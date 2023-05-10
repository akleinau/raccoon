import {defineStore} from 'pinia'
import {useCSVStore} from "@/stores/csvStore";
import * as d3 from "d3";
import {useScoreStore} from "@/stores/scoreStore";

export const useRegressionStore = defineStore('regressionStore', {
    state: () => ({
        excludedColumns: ["stea_alt75_s0"],
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
         * @param y
         */
        accuracy: function (TEST_SET_I, Data, weights, b, y) {
            //check accuracy
            let correct = 0
            for (let i = TEST_SET_I; i < Data[0].length; i++) {
                let row = Data.map(d => d[i])
                let curr_pred = this.sigmoid(this.dot_product(weights, row) + b)
                let curr_actual = y[i]
                if (curr_pred > 0.5 && curr_actual === 1) {
                    correct++
                } else if (curr_pred < 0.5 && curr_actual === 0) {
                    correct++
                }
            }
            return (correct / (Data[0].length - TEST_SET_I))
        },
        /**
         * train
         */
        train() {

            let [map, Data, y] = this.prepare_data()

            //create weight matrix with one weight per feature plus bias
            let weights = Array(Data.length).fill(0)
            let b = 0

            const TEST_SET_I = Data[0].length - Data[0].length / 10
            const BATCHSIZE = 10
            const LEARNING_RATE = 0.01

            //optimize weights using gradient descent
            //for each epoch
            for (let epoch = 0; epoch < 15; epoch++) {
                let accuracy = this.accuracy(TEST_SET_I, Data, weights, b, y);

                //for each batch of rows in data
                for (let i = 0; i < TEST_SET_I; i += BATCHSIZE) {
                    let loss = []
                    let dW = []
                    let db = []
                    for (let j = 0; j < BATCHSIZE; j++) {
                        //multiplicate weights with data
                        let row = Data.map(d => d[j + i])
                        let curr_pred = this.sigmoid(this.dot_product(weights, row) + b)
                        let curr_actual = y[j + i]

                        loss.push(this.loss(curr_pred, curr_actual))
                        dW.push(row.map((d) => (curr_pred - curr_actual) * d))
                        db.push(curr_actual - curr_pred)
                    }

                    let mean_dW = []
                    //compute derivates
                    for (let k = 0; k < dW[0].length; k++) {
                        mean_dW.push(d3.mean(dW.map(d => d[k])))
                    }
                    db = d3.mean(db)


                    //update weights
                    weights = weights.map((d, i) => d - LEARNING_RATE * mean_dW[i])
                    b = b - LEARNING_RATE * db

                    if (i % (30 * BATCHSIZE) === 0) {
                        console.log("Loss: " + d3.mean(loss) + " Accuracy: " + accuracy)
                    }

                }
            }

            let accuracy = this.accuracy(TEST_SET_I, Data, weights, b, y);
            console.log("Final Accuracy: " + accuracy)

            //combine map with weights and then sort
            let weights_map = map.map((d, i) =>
                ({
                    "type": d.type,
                    "name": d.name,
                    "option": d.option,
                    "weight": weights[i],
                })
            ).sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))

            console.log("weights map:", weights_map)

            let csvStore = useCSVStore()
            csvStore.variable_summaries.forEach(summary => {
                let influence = d3.max(weights_map.filter(d => d.name === summary.name).map(d => Math.abs(d.weight)))
                if (!influence) influence = 0
                summary.significance.score["regression"] = influence
            })

        },
        /**
         * prepare data for training
         */
        prepare_data() {
            let csvStore = useCSVStore()
            let map = []
            let Data = []
            let y = []

            //gets csv data - categorical, numerical, ordinal data, and target
            csvStore.csv.columns.forEach(column => {
                let summary = csvStore.variable_summaries.find(d => d.name === column)
                if (summary && !this.excludedColumns.includes(column)) {

                    //convert target to binary 1 - 0 values. Currently only works for binary targets
                    if (summary.name === csvStore.target_column) {

                        csvStore.csv.forEach(d => {
                            if (d[column] === csvStore.target_option) {
                                y.push(1)
                            } else {
                                y.push(0)
                            }
                        })
                        //handles feature data
                    } else {
                        if (summary.type === "categorical") {
                            // convert categorical data to one hot encoding
                            summary.options.forEach(option => {
                                Data.push(csvStore.csv.map(d => d[column] === option.name ? 1 : 0))
                                map.push({
                                    "type": "categorical",
                                    "name": column,
                                    "option": option.name
                                })
                            })

                        } else if (summary.type === "continuous") {
                            //add data in bins for now to cope with missing data (just gets own bin)
                            summary.options.forEach(option => {
                                Data.push(csvStore.csv.map(d => csvStore.find_bin(d[column], summary.options) === option.name ? 1 : 0))
                                map.push({
                                    "type": "binned",
                                    "name": column,
                                    "option": option.name
                                })
                            })
                        }
                    }
                }
            })
            //create feature matrix and map to trace back each feature to its original column/ option

            return [map, Data, y]
        },
        /**
         * score computation
         */
        compute_score() {
            this.train()
            let scoreStore = useScoreStore()
            scoreStore.score = "regression"
            scoreStore.sort_summaries()
        }
    }
})