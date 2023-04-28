import {defineStore} from 'pinia'
import * as d3 from "d3";

export const useStore = defineStore('csvStore', {
    state: () => ({
        start: true,
        exclude_missing: true,
        csv: null,
        min_bin_size: 0,
        columns: [],
        target_column: null,
        target_all_options: [],
        target_option: null,
        variable_summaries: [],
    }),
    actions: {
        /**
         * calculates summary per variable
         */
        calc_variable_summaries() {
            this.variable_summaries = []

            this.columns.forEach(column => {
                let options = [...new Set(this.csv.map(d => d[column]))]
                //only continue if there are less than 10 options to make sure it is categorical or ordinal
                if (options.length <= 10) {
                    let summary = {
                        name: column,
                        type: "categorical",
                        options: options,
                        //how often each option occurs
                        occurrence: Object.fromEntries(new Map(options.map(d => [d, 0]))),
                        //how often each option occurs together with the target option
                        occurrence_target_option: Object.fromEntries(new Map(options.map(d => [d, 0]))),
                    }
                    this.csv.forEach(d => summary.occurrence[d[column]]++)
                    this.filter_for_target_option(this.csv).forEach(d => summary.occurrence_target_option[d[column]]++)

                    summary = this.summary_exclude_missing(summary)

                    //percentage how often each option occurs together with the target option
                    summary.percent_target_option = this.divide_maps(summary.occurrence_target_option, summary.occurrence)

                    //significance_score: difference in percentages of percent_target_option
                    summary.significance = this.compute_significance_score(summary)
                    this.variable_summaries.push(summary)

                } else {
                    let options_num = options.filter(d => !isNaN(d) && d !== "")

                    //continuous variables
                    if (options_num.length > 5) {
                        //calculate bins
                        const steps = 2
                        let extent = this.calculate_pretty_extent(options_num, steps)
                        let options_bin = [...new Set(options.map(d => this.bin_value(d, extent)))].sort(this.sort)


                        let summary = {
                            name: column,
                            type: "continuous",
                            options: options_bin,
                            data: this.csv.map(d => d[column]).filter(d => !isNaN(d) && d !== ""),
                            data_with_target_option: this.filter_for_target_option(this.csv).map(d => d[column]).filter(d => !isNaN(d) && d !== ""),
                            //how often each option occurs
                            occurrence: Object.fromEntries(new Map(options_bin.map(d => [d, 0]))),
                            //how often each option occurs together with the target option
                            occurrence_target_option: Object.fromEntries(new Map(options_bin.map(d => [d, 0]))),
                        }
                        this.csv.forEach(d => summary.occurrence[this.bin_value(d[column], extent)]++)
                        this.filter_for_target_option(this.csv).forEach(d => summary.occurrence_target_option[this.bin_value(d[column], extent)]++)
                        summary = this.bin_ends(summary, this.min_bin_size)

                        summary = this.summary_exclude_missing(summary)

                        //percentage how often each option occurs together with the target option
                        summary.percent_target_option = this.divide_maps(summary.occurrence_target_option, summary.occurrence)

                        //significance_score: difference in percentages of percent_target_option
                        summary.significance = this.compute_significance_score(summary)
                        this.variable_summaries.push(summary)
                    }
                }

            })
            //sort by significance_score
            this.variable_summaries.sort((a, b) => b.significance.score - a.significance.score)
        },
        /**
         * filters table for only rows with target option selected
         *
         * @param d
         * @returns {*}
         */
        filter_for_target_option(d) {
            return d.filter(d => d[this.target_column] === this.target_option)
        },
        /**
         * divides values of two maps per key
         *
         * @param a
         * @param b
         * @returns {{}}
         */
        divide_maps(a, b) {
            let result = {}
            Object.keys(a).forEach(key => {
                result[key] = a[key] / b[key]
            })
            return result
        },
        /**
         * computes tuples with statistically significant differences and significance score
         *
         * @param summary
         * @returns {{score: number, significant_tuples: []}}
         */
        compute_significance_score(summary) {
            //create list of all tuples of percent_target_option and their significance_test_propotions
            let tuples = []
            for (let i = 0; i < summary.options.length; i++) {
                for (let j = i + 1; j < summary.options.length; j++) {
                    let o1 = summary.options[i]
                    let o2 = summary.options[j]
                    let p1 = summary.percent_target_option[o1]
                    let p2 = summary.percent_target_option[o2]
                    let n1 = summary.occurrence[o1]
                    let n2 = summary.occurrence[o2]
                    if (this.significance_test_proportions(p1, p2, n1, n2)) {
                        tuples.push({
                            "option1": o1,
                            "option2": o2,
                            "diff": Math.abs(p1 - p2)
                        })
                    }
                }
            }
            if (tuples.length === 0) {
                return {"significant_tuples": [], "score": -1}
            }

            return {
                "significant_tuples": tuples.map(d => [d.option1, d.option2]),
                "score": Math.max(...tuples.map(d => d.diff))
            }
        },
        /**
         * returns true if the difference in the percentage of the target option is significant
         *
         * @param p1 - percentage of target option in first group
         * @param p2 - percentage of target option in second group
         * @param n1 - number of elements in first group
         * @param n2 - number of elements in second group
         * @returns {boolean}
         */
        significance_test_proportions(p1, p2, n1, n2) {
            //test for too small sample sizes
            if (n1 < 10 || n2 < 10) {
                return false
            }

            let p = (p1 * n1 + p2 * n2) / (n1 + n2)
            let se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2))
            let z = (p1 - p2) / se
            //for a normal distribution with mea 0 and sttdev 1, the z score boundary for 95% confidence is 1.96
            const Z_SCORE_BOUNDARY = 1.64485
            return Math.abs(z) >= Z_SCORE_BOUNDARY
        },
        /**
         * bins a value into a range of steps
         *
         * @param value
         * @param range - [min, max, stepsize]
         */
        bin_value(value, range) {
            if (isNaN(value) || value === "") {
                return value
            }
            var step = Math.floor((value - range[0]) / range[2])
            var logStep = Math.max(0, -Math.floor(Math.log10(range[2])))
            return (range[0] + step * range[2]).toFixed(logStep) + "-" + (range[0] + (step + 1) * range[2]).toFixed(logStep)
        },
        /**
         * calculates pretty extents for continuous columns.
         * Favors step sizes that are powers of 10 and ranges that are multiples of 10
         *
         * @param options
         * @param steps
         * @returns {(number|number)[]}
         */
        calculate_pretty_extent(options, steps) {
            let extent = d3.extent(options.map(d => +d))
            let stepsize = (extent[1] - extent[0]) / steps
            let pretty_stepsize = Math.pow(10, Math.floor(Math.log10(stepsize)))
            let pretty_min = Math.floor(extent[0] / pretty_stepsize) * pretty_stepsize
            let pretty_max = Math.ceil(extent[1] / pretty_stepsize) * pretty_stepsize

            return [pretty_min, pretty_max, pretty_stepsize]
        },
        /**
         * bins continuous columns at start and end
         *
         * @param summary
         * @param min_bin_size
         * @returns {*}
         */
        bin_ends(summary, min_bin_size) {
            let options_num = summary.options.filter(d => !isNaN(d.split("-")[0]) && !isNaN(d.split("-")[0]) && d !== "")

            //iterate through options_num from behind
            let i = options_num.length - 1
            let occurrence_sum = 0
            let occurrence_target_option_sum = 0
            let name_end = options_num[i].split("-")[1]
            let name_start = ""
            while (occurrence_sum < min_bin_size && i > 0) {
                occurrence_sum += summary['occurrence'][options_num[i]]
                occurrence_target_option_sum += summary['occurrence_target_option'][options_num[i]]
                name_start = options_num[i].split("-")[0]
                delete summary.occurrence[options_num[i]]
                delete summary.occurrence_target_option[options_num[i]]
                i--
            }
            if (i < options_num.length - 1) {
                summary.occurrence[name_start + "-" + name_end] = occurrence_sum
                summary.occurrence_target_option[name_start + "-" + name_end] = occurrence_target_option_sum
            }

            //iterate through options_num from front
            i = 0
            occurrence_sum = 0
            occurrence_target_option_sum = 0
            name_start = options_num[i].split("-")[0]
            name_end = ""
            while (occurrence_sum < min_bin_size && i < options_num.length - 1) {
                occurrence_sum += summary['occurrence'][options_num[i]]
                occurrence_target_option_sum += summary['occurrence_target_option'][options_num[i]]
                name_end = options_num[i].split("-")[1]
                delete summary.occurrence[options_num[i]]
                delete summary.occurrence_target_option[options_num[i]]
                i++
            }

            if (i > 0) {
                summary.occurrence[name_start + "-" + name_end] = occurrence_sum
                summary.occurrence_target_option[name_start + "-" + name_end] = occurrence_target_option_sum
            }

            summary.options = Object.keys(summary.occurrence)
            return summary
        },
        /**
         * sorts options first by number, then by their string name
         *
         * @param a
         * @param b
         * @returns {number}
         */
        sort(a, b) {
            let a_split = a.split("-")
            let b_split = b.split("-")
            let a_is_number = !isNaN(a_split[0]) && a_split[0] !== ""
            let b_is_number = !isNaN(b_split[0]) && b_split[0] !== ""
            if (a_is_number && b_is_number) {
                return a_split[0] - b_split[0]
            }
            if (a_is_number) {
                return -1
            }
            if (b_is_number) {
                return 1
            }
            return a.localeCompare(b)
        },
        /**
         * if missing values should be excluded, remove them from the summary
         *
         * @param summary
         * @returns {*}
         */
        summary_exclude_missing(summary) {
            //exclude missing values
            if (this.exclude_missing) {
                summary.options = summary.options.filter(d => d !== "" && d !== "NaN")
                delete summary.occurrence[""]
                delete summary.occurrence_target_option[""]
                delete summary.occurrence["NA"]
                delete summary.occurrence_target_option["NA"]
            }
            return summary
        },
        /**
         * resets all variables to their initial state
         */
        reset() {
            this.start = true
            this.csv = null
            this.columns = []
            this.target_column = null
            this.target_all_options = []
            this.target_option = null
            this.variable_summaries = []
        }
    }
})
