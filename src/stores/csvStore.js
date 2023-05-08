import {defineStore} from 'pinia'
import * as d3 from "d3";
import {useHelperStore} from './helperStore'

export const useCSVStore = defineStore('csvStore', {
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
        score: "max_difference",
        score_choices: ["max_difference", "entropy", "max", "weighted_max"]
    }),
    actions: {
        /**
         * calculates summary per variable
         */
        calc_variable_summaries() {
            this.variable_summaries = []

            this.columns.forEach(column => {
                let options = [...new Set(this.csv.map(d => d[column]))]
                options = options.map(o => ({"name": o, "label": o}))
                //only continue if there are less than 10 options to make sure it is categorical or ordinal
                let summary = {}
                if (options.length <= 10) {
                    summary = {
                        name: column,
                        label: column,
                        type: "categorical",
                        options: options,
                        //how often each option occurs
                        occurrence: Object.fromEntries(new Map(options.map(d => [d.name, 0]))),
                        //how often each option occurs together with the target option
                        occurrence_target_option: Object.fromEntries(new Map(options.map(d => [d.name, 0]))),
                    }
                    this.csv.forEach(d => summary.occurrence[d[column]]++)
                    this.filter_for_target_option(this.csv).forEach(d => summary.occurrence_target_option[d[column]]++)
                } else {
                    let options_num = options.filter(d => !isNaN(d.name) && d.name !== "")
                    let options_other = options.filter(d => isNaN(d.name) || d.name === "")

                    //continuous variables
                    if (options_num.length > 5) {
                        //calculate bins
                        const steps = 2
                        let options_binned_num = this.calculate_pretty_bins(options_num, steps)
                        let options_bin = [...options_binned_num, ...options_other]
                        options_bin = options_bin.sort(useHelperStore().sort)

                        summary = {
                            name: column,
                            label: column,
                            type: "continuous",
                            options: options_bin,
                            data: this.csv.map(d => d[column]).filter(d => !isNaN(d) && d !== ""),
                            data_with_target_option: this.filter_for_target_option(this.csv).map(d => d[column]).filter(d => !isNaN(d) && d !== ""),
                            //how often each option occurs
                            occurrence: Object.fromEntries(new Map(options_bin.map(d => [d.name, 0]))),
                            //how often each option occurs together with the target option
                            occurrence_target_option: Object.fromEntries(new Map(options_bin.map(d => [d.name, 0]))),
                        }
                        this.csv.forEach(d => summary.occurrence[this.find_bin(d[column], options_bin)]++)
                        this.filter_for_target_option(this.csv).forEach(d => summary.occurrence_target_option[this.find_bin(d[column], options_bin)]++)
                        summary = this.bin_ends(summary, this.min_bin_size)
                    }
                }

                if (Object.keys(summary).length > 0) {
                    summary = this.summary_exclude_missing(summary)

                    //percentage how often each option occurs together with the target option
                    summary.percent_target_option = this.divide_maps(summary.occurrence_target_option, summary.occurrence)

                    //significance_score: difference in percentages of percent_target_option
                    summary.significance = this.compute_significance_score(summary)
                    summary.riskIncrease = this.compute_risk_increase(summary)

                    this.variable_summaries.push(summary)
                }
            })
            //sort by significance_score
            this.sort_summaries()
        },
        sort_summaries() {
            this.variable_summaries.sort((a, b) => b.significance.score[this.score] - a.significance.score[this.score])
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
         * @returns {{score: {}, significant_tuples: []}}
         */
        compute_significance_score(summary) {
            //create list of all tuples of percent_target_option and their significance_test_propotions
            let tuples = []
            for (let i = 0; i < summary.options.length; i++) {
                for (let j = i + 1; j < summary.options.length; j++) {
                    let o1 = summary.options[i]
                    let o2 = summary.options[j]
                    let p1 = summary.percent_target_option[o1.name]
                    let p2 = summary.percent_target_option[o2.name]
                    let n1 = summary.occurrence[o1.name]
                    let n2 = summary.occurrence[o2.name]
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
                return {
                    "significant_tuples": [],
                    "score": Object.fromEntries(new Map(this.score_choices.map(d => [d, -1])))
                }
            }

            return {
                "significant_tuples": tuples.map(d => [d.option1.label, d.option2.label]),
                "score": {
                    "max_difference": Math.max(...tuples.map(d => d.diff)),
                    "max": Object.entries(summary.percent_target_option).sort((a, b) => b[1] - a[1])[0][1],
                    "weighted_max": this.weighted_max_score(summary),
                    "entropy": -this.entropy(Object.values(summary.percent_target_option))
                }
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
        entropy(array) {
            let sum = 0
            array.forEach(d => sum += d)
            let result = 0
            array.forEach(d => {
                let p = d / sum
                result -= p * Math.log(p)
            })
            return result
        },
        weighted_max_score(summary) {
            let max_percent_option = Object.entries(summary.percent_target_option).sort((a, b) => b[1] - a[1])[0]
            let max_percent_occurrence = summary.occurrence[max_percent_option[0]]
            return max_percent_option[1] * max_percent_occurrence / this.csv.length
        },
        /**
         * calculates pretty extents for continuous columns.
         * Favors step sizes that are powers of 10 and ranges that are multiples of 10
         *
         * @param options
         * @param steps
         * @returns {(number|number)[]}
         */
        calculate_pretty_bins(options, steps) {
            let extent = d3.extent(options.map(d => +d.name))
            let stepsize = (extent[1] - extent[0]) / steps
            let pretty_stepsize_10 = Math.pow(10, Math.floor(Math.log10(stepsize)))
            let pretty_stepsize = Math.floor(stepsize / pretty_stepsize_10) * pretty_stepsize_10
            //let pretty_stepsize = (stepsize).toFixed(-Math.min(0,Math.floor(Math.log10(stepsize))))
            let pretty_min = Math.floor(extent[0] / pretty_stepsize) * pretty_stepsize
            let pretty_max = Math.ceil(extent[1] / pretty_stepsize) * pretty_stepsize

            let logStep = Math.max(0, -Math.floor(Math.log10(pretty_stepsize)))
            let bins = []
            for (let i = pretty_min; i <= pretty_max; i += pretty_stepsize) {
                let i_min = i.toFixed(logStep)
                let i_max = (i + pretty_stepsize).toFixed(logStep)
                bins.push({
                    "name": i_min + "-" + i_max,
                    "label": i_min + "-" + i_max,
                    "range": [i_min, i_max]
                })
            }

            return bins
        },
        /**
         * bins continuous columns at start and end
         *
         * @param summary
         * @param min_bin_size
         * @returns {*}
         */
        bin_ends(summary, min_bin_size) {
            let options_num = summary.options
            let last_index_num = options_num.filter(a => a.range !== undefined).length - 1

            //iterate through options_num from behind
            let i = last_index_num
            let occurrence_sum = 0
            let occurrence_target_option_sum = 0
            let name_end = options_num[i].range[1]
            let name_start = ""
            while (occurrence_sum < min_bin_size && i > 0) {
                occurrence_sum += summary['occurrence'][options_num[i].name]
                occurrence_target_option_sum += summary['occurrence_target_option'][options_num[i].name]
                name_start = options_num[i].range[0]
                delete summary.occurrence[options_num[i].name]
                delete summary.occurrence_target_option[options_num[i].name]
                options_num.splice(i, 1)
                i--
            }
            if (i < last_index_num) {
                summary.occurrence[name_start + "-" + name_end] = occurrence_sum
                summary.occurrence_target_option[name_start + "-" + name_end] = occurrence_target_option_sum
                options_num.push({
                    "name": name_start + "-" + name_end,
                    "label": "≥" + name_start,
                    "range": [name_start, name_end]
                })
            }

            //iterate through options_num from front
            last_index_num = i + 1
            i = 0
            occurrence_sum = 0
            occurrence_target_option_sum = 0
            name_start = options_num[i].range[0]
            name_end = ""
            while (occurrence_sum < min_bin_size && i < last_index_num) {
                occurrence_sum += summary['occurrence'][options_num[i].name]
                occurrence_target_option_sum += summary['occurrence_target_option'][options_num[i].name]
                name_end = options_num[i].range[1]
                delete summary.occurrence[options_num[i].name]
                delete summary.occurrence_target_option[options_num[i].name]
                i++
            }
            options_num.splice(0, i)

            if (i > 0) {
                summary.occurrence[name_start + "-" + name_end] = occurrence_sum
                summary.occurrence_target_option[name_start + "-" + name_end] = occurrence_target_option_sum
                options_num.push({
                    "name": name_start + "-" + name_end,
                    "label": "<" + name_end,
                    "range": [name_start, name_end]
                })
            }

            summary.options = options_num.sort(useHelperStore().sort)
            return summary
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
                summary.options = summary.options.filter(d => d.name !== "" && d.name !== "NA")
                delete summary.occurrence[""]
                delete summary.occurrence_target_option[""]
                delete summary.occurrence["NA"]
                delete summary.occurrence_target_option["NA"]
            }
            return summary
        },
        /**
         * binary percent risk increase when in specific groups
         *
         * @param summary
         * @returns {{risk_difference: string, risk_factor_groups: string}}
         */
        compute_risk_increase(summary) {
            const percent_range = d3.extent(Object.values(summary.percent_target_option))
            const split_percent = percent_range[0] + (percent_range[1] - percent_range[0]) / 2

            const groups_below = Object.entries(summary.percent_target_option).filter(d => d[1] < split_percent)
            const groups_below_occurrence_sum = groups_below.reduce((a, b) => a + summary.occurrence[b[0]], 0)
            const groups_below_target_option_occurrence_sum = groups_below.reduce((a, b) => a + summary.occurrence_target_option[b[0]], 0)
            const below_percentage = groups_below_target_option_occurrence_sum / groups_below_occurrence_sum

            const groups_above = Object.entries(summary.percent_target_option).filter(d => d[1] >= split_percent)
            const groups_above_occurrence_sum = groups_above.reduce((a, b) => a + summary.occurrence[b[0]], 0)
            const groups_above_target_option_occurrence_sum = groups_above.reduce((a, b) => a + summary.occurrence_target_option[b[0]], 0)
            const above_percentage = groups_above_target_option_occurrence_sum / groups_above_occurrence_sum

            const name_above = groups_above.reduce((a, b) => a + ", " + b[0], "")

            const risk_multiplier = below_percentage === 0 ? null : (above_percentage / below_percentage).toFixed(2)
            const risk_difference = (above_percentage - below_percentage).toFixed(2)

            return {"risk_factor_groups": name_above, risk_difference: risk_difference, risk_multiplier: risk_multiplier}
        },
        recalculate_summary_after_option_change(summary) {
            //only continue if there are less than 10 options to make sure it is categorical or ordinal
            if (summary.type === "categorical") {
                //not implemented yet
                return summary

            }
            if (summary.type === "continuous") {

                //update names
                summary.options.forEach(d => d.name = d.range === undefined ? d.name : d.range[0] + "-" + d.range[1])
                summary.options.forEach(d => d.label = d.name)

                summary.occurrence = Object.fromEntries(new Map(summary.options.map(d => [d.name, 0])))
                summary.occurrence_target_option = Object.fromEntries(new Map(summary.options.map(d => [d.name, 0])))
                summary.data.forEach(d => summary.occurrence[this.find_bin(d, summary.options)]++)
                summary.data_with_target_option.forEach(d => summary.occurrence_target_option[this.find_bin(d, summary.options)]++)

                //for now: just exclude null values
                delete summary.occurrence[null]
                delete summary.occurrence_target_option[null]

                summary.percent_target_option = this.divide_maps(summary.occurrence_target_option, summary.occurrence)


                summary = this.summary_exclude_missing(summary)
                summary.significance = this.compute_significance_score(summary)
                summary.riskIncrease = this.compute_risk_increase(summary)

                console.log(summary)

                return summary
            }

        },
        find_bin(value, options) {
            const option = options.find(d => d.range !== undefined ? +value >= +d.range[0] && +value < +d.range[1] : d.name === value)
            return option ? option.name : null
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
