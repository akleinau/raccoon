import {defineStore} from 'pinia'
import * as d3 from "d3";
import {useCSVStore} from "@/stores/csvStore";
import {useVisStore} from "@/stores/visStore";

export const useSimilarityStore = defineStore('similarityStore', {
    state: () => ({
        similarity_boundary: 0.8,
    }),
    actions: {
        /**
         * compute similar columns based on column types
         */
        compute_similar_columns(summary) {
            const csv = useCSVStore().csv
            const visList = useVisStore().generate_main_fact_visList()
            const current_column = csv.map(d => d[summary.name])

            //continuous variables
            if (summary.type === "continuous") {
                return useCSVStore().variable_summaries
                    .filter(item => item.name !== summary.name && item.type === "continuous")
                    .map(item => {
                        return {
                            'item': item,
                            'similarity': this.pearson(current_column, csv.map(d => d[item.name]))
                        }
                    })
                    .filter(d => Math.abs(d.similarity) >= this.similarity_boundary)
                    .sort((a, b) => b.similarity - a.similarity)
                    .map(d => ({
                        'column': d.item,
                        'visList': visList,
                        'similarity': d.similarity
                    }))
            }

            //categorical variables
            if (summary.type === "categorical") {
                return useCSVStore().variable_summaries
                    .filter(item => item.name !== summary.name && item.type === "categorical")
                    .map(item => {
                        return {
                            'item': item,
                            'similarity': this.cramers_v(summary, item)
                        }
                    })
                    .filter(d => d.similarity >= this.similarity_boundary)
                    .sort((a, b) => b.similarity - a.similarity)
                    .map(d => ({
                        'column': d.item,
                        'visList': visList,
                        'similarity': d.similarity
                    }))
            }
            return []
        },
        /**
         * calculate pearson coefficient
         */
        pearson(x, y) {
            //handle missing data by deleting rows
            let filtered = x.map((d, i) => [d, y[i]])
                .filter(d => !isNaN(d[0]) && !isNaN(d[1]))
                .filter(d => d[0] !== "" && d[1] !== "")
            let xf = filtered.map(d => d[0])
            let yf = filtered.map(d => d[1])
            let n = filtered.length

            //calculate pearson
            const mean_x = d3.mean(xf)
            const mean_y = d3.mean(yf)
            const stddev_x = d3.deviation(xf)
            const stddev_y = d3.deviation(yf)
            const covariance = xf.map((d, i) => (d - mean_x) * (yf[i] - mean_y)).reduce((a, b) => a + b, 0) / n
            return covariance / (stddev_x * stddev_y)
        },
        /**
         * calculate Cramer's V
         */
        cramers_v(x, y) {
            //calculate Cramer's V
            const confusion_matrix = this.confusion_matrix(x, y)
            const n = d3.sum(confusion_matrix.map(row => d3.sum(row)))
            //chi_squared
            const chi_squared = d3.sum(confusion_matrix.map((row, i) =>
                row.map((cell, j) => {
                    const row_sum = d3.sum(row)
                    const column_sum = d3.sum(confusion_matrix.map(row => row[j]))
                    const expected = row_sum * column_sum / n
                    return Math.pow(cell - expected, 2) / expected
                })).flat())

            //cramer's v
            const r = confusion_matrix.length
            const k = confusion_matrix[0].length
            return Math.sqrt(chi_squared / (n * Math.min(k - 1, r - 1)))
        },
        /**
         * calculate confusion matrix
         */
        confusion_matrix(x, y) {
            let options_x_index = Object.fromEntries(new Map(x.options.map((d, i) => [d.name, i])))
            let options_y_index = Object.fromEntries(new Map(y.options.map((d, i) => [d.name, i])))
            let csv = useCSVStore().csv
            let matrix = Array.from(Array(x.options.length), () => new Array(y.options.length).fill(0))
            csv.forEach(row => {
                let x_index = options_x_index[row[x.name]]
                let y_index = options_y_index[row[y.name]]
                if (x_index !== undefined && y_index !== undefined) {
                    matrix[x_index][y_index]++
                }
            })
            return matrix
        }

    }
})