import {defineStore} from 'pinia'
import {useCSVStore} from "@/stores/csvStore";
import * as d3 from "d3";

export const useRegressionStore = defineStore('regressionStore', {
    state: () => ({}),
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
         * train
         */
        train() {
            const LEARNING_RATE = 0.01

            let [map, Data, y] = this.prepare_data()
            console.log("data:")
            console.log(map, Data, y)

            //create weight matrix with one weight per feature plus bias
            let weights = Array(Data.length).fill(0)
            let b = 0
            console.log("weights:")
            console.log(weights, b)

            //optimize weights using gradient descent
            //for each epoch
            for (let epoch = 0; epoch < 20; epoch++) {

                let batchsize = 10
                //for each batch of rows in data
                for (let i = 0; i < Data[0].length; i += batchsize) {
                    let loss = []
                    let dW = []
                    let db = []
                    for (let j = 0; j < batchsize; j++) {
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

                    if (i % 20 === 0) {
                        console.log("Loss: " + d3.mean(loss))
                    }

                }
            }

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
            csvStore.variable_summaries.forEach( summary => {
                let influence = d3.max(weights_map.filter(d => d.name === summary.name).map(d => Math.abs(d.weight)))
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
                if (summary) {

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
        }
    }
})