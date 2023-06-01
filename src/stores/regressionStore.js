import {defineStore} from 'pinia'
import {useCSVStore} from "@/stores/csvStore";
import * as d3 from "d3";
import {useScoreStore} from "@/stores/scoreStore";
import {useVisStore} from "@/stores/visStore";

export const useRegressionStore = defineStore('regressionStore', {
    state: () => ({
        accuracy_diff: 0,
        dashboard_accuracy: 0,
        test_ratio: 0.1,
        batch_size: 10,
        learning_rate: 0.01,
        epochs: 15,
        fast_epochs: 3,
        correlation_boundary: 0.25
    }),
    actions: {
        /**
         * calculates sigmoid function
         */
        sigmoid(x) {
            return 1 / (1 + Math.exp(-x))
        },
        /**
         * calculates the dot product
         *
         * @param a
         * @param b
         * @returns {function(*, *): *}
         */
        dot_product(a, b) {
            return a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n)
        },
        /**
         * calculate loss
         */
        loss(pred, actual) {
            return -(actual * Math.log(pred) + (1 - actual) * Math.log(1 - pred))
        },
        /**
         * calculate accuracy
         *
         * @param TEST_SET_I
         * @param Data
         * @param weights
         * @param b
         * @param y_pred
         * @param y_actual
         */
        accuracy(TEST_SET_I, Data, weights, b, y_pred, y_actual) {
            //check accuracy
            let correct = 0
            for (let i = TEST_SET_I; i < y_actual.length; i++) {
                let row = Data[i]
                let curr_pred = weights ? this.sigmoid(this.dot_product(weights, row) + b + y_pred[i]) : this.sigmoid(b + y_pred[i])
                let curr_actual = y_actual[i]
                if (curr_pred > 0.5 && curr_actual === 1) {
                    correct++
                } else if (curr_pred < 0.5 && curr_actual === 0) {
                    correct++
                }
            }
            return (correct / (y_actual.length - TEST_SET_I))
        },
        /**
         * compute predictions without sigma
         *
         * @param weights
         * @param b
         * @param data
         * @param y_pred
         * @returns {*[]}
         */
        compute_new_prediction(weights, b, data, y_pred) {
            let y_new_pred = []
            for (let i = 0; i < y_pred.length; i++) {
                let row = weights ? data[i] : null
                let curr_pred = weights ? this.dot_product(weights, row) + b + y_pred[i] : b + y_pred[i]
                y_new_pred.push(curr_pred)
            }
            return y_new_pred
        },
        /**
         * calculate pearson coefficient of normalized data
         */
        pearson_of_normalized(x, y) {
            return x.reduce((a, b, i) => a + b * y[i], 0) / x.length
        },
        /**
         * train
         */
        train(columns, map, Data, y_pred, y_actual, summary_place, epochs) {

            const onlyBias = Data.length === 0

            //create weight matrix with one weight per feature plus bias
            let weights = onlyBias ? null : Array(Data[0].length).fill(0)
            let b = 0

            const TEST_SET_I = y_actual.length - Math.floor(y_actual.length / (100 * this.test_ratio))

            //optimize weights using gradient descent
            //for each epoch
            for (let epoch = 0; epoch < epochs; epoch++) {
                //let accuracy = this.accuracy(TEST_SET_I, Data, weights, b, y_pred, y_actual);

                //for each batch of rows in data
                for (let i = 0; i < TEST_SET_I; i += this.batch_size) {
                    let loss = []
                    let dW = []
                    let db = []
                    for (let j = 0; j < this.batch_size; j++) {
                        //multiplicate weights with data
                        let row = Data[j + i]
                        let curr_pred = onlyBias ? this.sigmoid(b + y_pred[j + i]) : this.sigmoid(this.dot_product(weights, row) + b + y_pred[j + i])
                        let curr_actual = y_actual[j + i]

                        loss.push(this.loss(curr_pred, curr_actual))
                        if (!onlyBias) dW.push(row.map((d) => (curr_pred - curr_actual) * d))
                        db.push(curr_pred - curr_actual)
                    }

                    //compute derivates
                    if (!onlyBias) dW = dW[0].map((_, i) => d3.mean(dW.map(d => d[i])))
                    db = d3.mean(db)


                    //update weights
                    if (!onlyBias) weights = weights.map((d, i) => d - this.learning_rate * dW[i])
                    b = b - this.learning_rate * db

                    //  if (i % (Math.floor(Data[0].length / (this.batch_size)) * 20) === 0) {
                    //       console.log("Loss: " + d3.mean(loss) + " Accuracy: " + accuracy)
                    //   }

                }
            }

            let accuracy = this.accuracy(TEST_SET_I, Data, weights, b, y_pred, y_actual);
            //console.log("Final Accuracy: " + accuracy)

            //combine map with weights and then sort
            let weights_map = map.map((d, i) =>
                ({
                    "type": d.type,
                    "name": d.name,
                    "option": d.option,
                    "weight": weights[i],
                })
            ) //.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))

            const csvStore = useCSVStore()
            const visStore = useVisStore()

            if (summary_place === "variable_summaries") {
                columns.forEach(column => {
                    //let influence = d3.max(weights_map.filter(d => d.name === column).map(d => Math.abs(d.weight)))
                    let summary = csvStore.variable_summaries.find(d => d.name === column)
                    //console.log(influence)
                    if (summary) {
                        summary.significance.score["regression"] = accuracy - this.dashboard_accuracy
                        //console.log(summary.significance.score["regression"])
                        if (accuracy - this.dashboard_accuracy > this.accuracy_diff) this.accuracy_diff = accuracy - this.dashboard_accuracy
                    }
                })
            }

            if (summary_place === "dashboard") {
                visStore.dashboard_items.forEach(item => {
                    if (item.column.significance) {
                        let influence = d3.max(weights_map.filter(d => d.name === item.name).map(d => Math.abs(d.weight)))
                        if (!influence) influence = 0
                        item.column.significance.score["regression"] = influence
                    }
                })
            }

            return [this.compute_new_prediction(weights, b, Data, y_pred), accuracy]

        },
        prepare_target() {
            let csvStore = useCSVStore()
            let y = []
            csvStore.csv.forEach(d => {
                if (d[csvStore.target_column] === csvStore.target_option) {
                    y.push(1)
                } else {
                    y.push(0)
                }
            })
            return y
        },
        prepare_data(columns) {
            let csvStore = useCSVStore()
            let map = [] //create feature matrix and map to trace back each feature to its original column/ option
            let Data = []

            //gets csv data - categorical, numerical, ordinal data, and target
            columns.forEach(column => {

                let summary = csvStore.variable_summaries.find(d => d.name === column)
                if (summary && Math.abs(summary.correlation_with_target) >= this.correlation_boundary) {

                    let data_items = []
                    let map_items = []
                    if (summary.type === "categorical") {
                        // convert categorical data to one hot encoding
                        summary.options.forEach(option => {
                            data_items.push(csvStore.csv.map(d => d[column] === option.name ? 1 : 0))
                            map_items.push({
                                "type": "categorical",
                                "name": column,
                                "option": option.name
                            })
                        })

                    } else if (summary.type === "continuous") {
                        //normalize continuous data
                        let mean = d3.mean(csvStore.csv.map(d => d[column]))
                        let stddev = d3.deviation(csvStore.csv.map(d => d[column]))
                        data_items.push(csvStore.csv.map(d => d[column]).map(d => isNaN(d) || d === "" ? 0 : (d - mean) / stddev))
                        map_items.push({
                            "type": "continuous",
                            "name": column,
                        })
                    }

                    if (data_items.length > 0) {
                        Data.push(...data_items)
                        map.push(...map_items)
                    }
                }


            })

            //transpose data for faster calculations later
            if (Data.length > 0) {
                Data = Data[0].map((_, i) => Data.map(row => row[i]))
            }

            return [map, Data]
        },
        /**
         * score computation
         */
        compute_score() {
            this.accuracy_diff = 0
            let visStore = useVisStore()
            let csvStore = useCSVStore()
            let y = this.prepare_target()
            let dashboard_columns = useVisStore().dashboard_items
                .map(d => d.name)
                .filter(d => d !== csvStore.target_column && !visStore.excluded_columns.includes(d))
            let [dashboard_map, dashboard_data] = this.prepare_data(dashboard_columns)
            console.log("training on dashboard:")
            let [y_pred, accuracy] = this.train(dashboard_columns, dashboard_map, dashboard_data, Array(y.length).fill(0), y, "dashboard", this.epochs)
            this.dashboard_accuracy = accuracy
            console.log("dashboard accuracy: " + accuracy)
            //console.log(y_pred)
            console.log("training on remaining data:")
            useCSVStore().columns.forEach(column => {
                if (!useVisStore().dashboard_items.map(d => d.name).includes(column) &&
                    column !== useCSVStore().target_column) {
                    if (!visStore.excluded_columns.includes(column)) {
                        let [map, Data] = this.prepare_data([column])
                        if (Data.length > 0) this.train([column], map, Data, y_pred, y, "variable_summaries", this.fast_epochs)
                        else {
                            let summary = csvStore.variable_summaries.find(d => d.name === column)
                            if (summary) {
                                summary.significance.score["regression"] = 0
                            }
                        }
                    } else {
                        let summary = csvStore.variable_summaries.find(d => d.name === column)
                        if (summary) {
                            summary.significance.score["regression"] = 0
                        }
                    }
                }
            })
            console.log("accuracy diff: " + this.accuracy_diff)
            let scoreStore = useScoreStore()
            scoreStore.score = "regression"
            scoreStore.sort_summaries()
        }
    }
})