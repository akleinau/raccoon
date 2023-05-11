import {defineStore} from 'pinia'
import * as d3 from "d3";

export const useHelperStore = defineStore('helperStore', {
    state: () => ({}),
    actions: {
        /**
         * sorts options first by number, then by their string name
         *
         * @param a
         * @param b
         * @returns {number}
         */
        sort(a, b) {
            if (a.range !== undefined && b.range !== undefined) {
                return a.range[0] - b.range[0]
            }
            if (a.range !== undefined) {
                return -1
            }
            if (b.range !== undefined) {
                return 1
            }
            return a.name.localeCompare(b.name)
        },
        /**
         * calculates the maximum length of all options
         * @param options
         * @returns {*}
         */
        get_max_length(options) {
            return options.reduce((max, option) => Math.max(max, option.length), 0)
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
            const covariance = xf.map((d, i) => (d - mean_x) * (yf[i] - mean_y)).reduce((a, b) => a + b, 0)/n
            return covariance / (stddev_x * stddev_y)
        },
    }
})