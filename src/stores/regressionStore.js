import {defineStore} from 'pinia'
import {useCSVStore} from "@/stores/csvStore";

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
            for (let epoch = 0; epoch < 10; epoch++) {
                //for each row in data
                for (let i = 0; i < Data[0].length; i++) {
                    //multiplicate weights with data
                    let x = Data.map(d => d[i])
                    let pred = this.sigmoid(this.dot_product(weights, x) + b)
                    let actual = y[i]

                    let loss = this.loss(pred, actual)

                    //compute derivates
                    let dW = x.map(d => (pred - actual) * d)
                    let db = actual - pred

                    //update weights
                    weights = weights.map((d, i) => d - LEARNING_RATE * dW[i])
                    b = b - LEARNING_RATE * db

                    console.log(dW, db, weights, b)

                    console.log("Loss: " + loss)
                }
            }


            //return weights for each feature and bias
            console.log("weights after training:")
            console.log(weights, b)


            return [map, Data, y]
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