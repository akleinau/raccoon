import {defineStore} from 'pinia'
import * as d3 from "d3";
import {useHelperStore} from './helperStore'
import {useScoreStore} from "./scoreStore";
import {useRegressionStore} from "@/stores/regressionStore";
import {useSimilarityStore} from "@/stores/similarityStore";

export const useDataStore = defineStore('dataStore', {
    state: () => ({
        start: true,
        exclude_missing: true,
        csv: null,
        min_bin_size: 0,
        columns: [],
        target_column: null,
        target_all_options: [],
        target_option: null,
        target: null,
        variable_summaries: []
    }),
    actions: {
        /**
         * calculates summary per variable
         */
        calc_variable_summaries() {
            this.variable_summaries = []
            let scoreStore = useScoreStore()

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
                        data: this.csv.map(d => d[column]),
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
                        const steps = 4
                        let options_binned_num = this.calculate_pretty_bins(options_num, steps)
                        let options_bin = [...options_binned_num, ...options_other]
                        options_bin = options_bin.sort(useHelperStore().sort)

                        summary = {
                            name: column,
                            label: column,
                            type: "continuous",
                            options: options_bin,
                            data: this.csv.map(d => d[column]),
                            data_binned: this.csv.map(d => this.find_bin(d[column], options_bin)),
                            data_with_target_option: this.filter_for_target_option(this.csv).map(d => d[column]).filter(d => !isNaN(d) && d !== ""),
                            data_with_target_option_binned: this.filter_for_target_option(this.csv).map(d => this.find_bin(d[column], options_bin)),
                            //how often each option occurs
                            occurrence: Object.fromEntries(new Map(options_bin.map(d => [d.name, 0]))),
                            //how often each option occurs together with the target option
                            occurrence_target_option: Object.fromEntries(new Map(options_bin.map(d => [d.name, 0]))),
                        }
                        summary.data_binned.forEach(d => summary.occurrence[d]++)
                        summary.data_with_target_option_binned.forEach(d => summary.occurrence_target_option[d]++)
                        summary = this.bin_ends(summary, this.min_bin_size)
                    }
                }

                if (Object.keys(summary).length > 0) {
                    summary = this.summary_exclude_missing(summary)

                    //percentage how often each option occurs together with the target option
                    summary.percent_target_option = this.divide_maps(summary.occurrence_target_option, summary.occurrence)

                    //total values
                    summary.total = {
                        occurrence: d3.sum(Object.values(summary.occurrence)),
                        occurrence_target_option: d3.sum(Object.values(summary.occurrence_target_option))
                    }
                    summary.total.percent_target_option = summary.total.occurrence_target_option / summary.total.occurrence

                    this.compute_initial_risk_groups(summary)
                    this.compute_risk_increase(summary)

                    this.variable_summaries.push(summary)
                }
            })

            //go through summaries again to compute correlation with target
            let target_summary = this.variable_summaries.find(d => d.name === this.target_column)
            this.target = target_summary
            console.log(target_summary)
            this.variable_summaries.forEach(summary => {
                summary.correlation_with_target = useSimilarityStore().compute_similarity(target_summary, summary)
                summary.significance = scoreStore.compute_significance_score(summary)

            })

            //sort by significance_score
            scoreStore.sort_summaries()

            useRegressionStore().prepare_data()
            useRegressionStore().compute_score()

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
         * compute initial risk groups for a summary
         *
         * @param summary
         */
        compute_initial_risk_groups(summary) {
            //calculate risk boundary differencing between risk factor and not risk factor
            const percent_range = d3.extent(Object.values(summary.percent_target_option))
            const split_percent = percent_range[0] + (percent_range[1] - percent_range[0]) / 2
            const groups_true = Object.entries(summary.percent_target_option).filter(d => d[1] >= split_percent).map(d => d[0])

            summary.options.forEach(d => {
                d.risk_group = groups_true.includes(d.name)
            })

        },
        /**
         * binary percent risk increase when in specific groups
         *
         * @param summary
         * @returns {{risk_difference: string, risk_factor_groups: string}}
         */
        compute_risk_increase(summary) {

            //compute groups below risk boundary
            const groups_false = summary.options.filter(d => d.risk_group === false).map(d => d.name)
            const groups_below_occurrence_sum = groups_false.reduce((a, b) => a + summary.occurrence[b], 0)
            const groups_below_target_option_occurrence_sum = groups_false.reduce((a, b) => a + summary.occurrence_target_option[b], 0)
            const below_percentage = groups_below_target_option_occurrence_sum / groups_below_occurrence_sum

            //compute groups above risk boundary
            const groups_true = summary.options.filter(d => d.risk_group === true).map(d => d.name)
            const groups_above_occurrence_sum = groups_true.reduce((a, b) => a + summary.occurrence[b], 0)
            const groups_above_target_option_occurrence_sum = groups_true.reduce((a, b) => a + summary.occurrence_target_option[b], 0)
            const above_percentage = groups_above_target_option_occurrence_sum / groups_above_occurrence_sum

            //create name of risk factor
            const name_above = this.compute_group_name(summary.options, summary.type)

            //calculate metrics to compare risk factors
            const risk_multiplier = below_percentage === 0 ? null : (above_percentage / below_percentage).toFixed(1)
            const risk_difference = (above_percentage - below_percentage).toFixed(1)

            summary.riskIncrease = {
                risk_factor_groups: groups_true,
                name: name_above,
                risk_difference: risk_difference,
                risk_multiplier: risk_multiplier,
                absolute_risk: above_percentage.toFixed(3)
            }
        },
        /**
         * computes the name of a group
         */
        compute_group_name(options, type) {
            let group_options = options.filter(d => d.risk_group === true)
            group_options = JSON.parse(JSON.stringify(group_options))
            group_options = group_options.sort(useHelperStore().sort)

            if (type === "continuous") {
                let min = d3.min(options.filter(d => d.range !== undefined).map(d => +d.range[0]))
                let max = d3.max(options.filter(d => d.range !== undefined).map(d => +d.range[1]))

                //combine groups
                let i = 0
                while (i < group_options.length - 1) {
                    if (group_options[i].range !== undefined && group_options[i + 1].range !== undefined &&
                        group_options[i].range[1] === group_options[i + 1].range[0]) {
                        group_options[i].range[1] = group_options[i + 1].range[1]
                        group_options.splice(i + 1, 1)
                    } else {
                        i++
                    }
                }

                //update names, labels
                group_options = group_options.filter(d => d.range !== undefined).map(d => {
                    d.name = d.range[0] + "-" + d.range[1]
                    d.label = (+d.range[0] === min) ? "<" + d.range[1] :
                        (+d.range[1] === max) ? "≥" + d.range[0] :
                            d.range[0] + "-" + d.range[1]
                    return d
                })

            }
            return group_options.reduce((a, b) => a + ", " + b.label, "").substring(2) //remove first comma
        },
        /**
         * recalculates a variable summaries when the option bins are changed. For now, people that do not fit in any of
         * the current bins are just ignored. This will be changed in the future.
         *
         * @param summary
         * @returns {*}
         */
        recalculate_summary_after_option_change(summary) {
            //only continue if there are less than 10 options to make sure it is categorical or ordinal
            if (summary.type === "categorical") {
                //not implemented yet
                return summary

            }
            if (summary.type === "continuous") {

                //update names
                if (summary.type === "continuous") {
                    summary.options.filter(d => d.range !== undefined).forEach(d => d.name = d.range[0] + "-" + d.range[1])
                    summary.options.filter(d => d.range !== undefined).forEach((d, i) => {
                        if (i === 0) {
                            d.label = "<" + d.range[1]
                        } else if (i === summary.options.length - 1) {
                            d.label = "≥" + d.range[0]
                        } else {
                            d.label = d.name
                        }
                    })
                }

                summary.occurrence = Object.fromEntries(new Map(summary.options.map(d => [d.name, 0])))
                summary.occurrence_target_option = Object.fromEntries(new Map(summary.options.map(d => [d.name, 0])))
                summary.data_binned = summary.data.map(d => this.find_bin(d, summary.options))
                summary.data_binned.forEach(d => summary.occurrence[d]++)
                summary.data_with_target_option_binned = summary.data_with_target_option.map(d => this.find_bin(d, summary.options))
                summary.data_with_target_option_binned.forEach(d => summary.occurrence_target_option[d]++)

                //for now: just exclude null values
                delete summary.occurrence[null]
                delete summary.occurrence_target_option[null]

                summary.percent_target_option = this.divide_maps(summary.occurrence_target_option, summary.occurrence)


                summary = this.summary_exclude_missing(summary)
                summary.significance = useScoreStore().compute_significance_score(summary)
                this.compute_risk_increase(summary)

                console.log(summary)

                return summary
            }

        },
        /**
         * finds the option bin for a value
         *
         * @param value
         * @param options
         * @returns {*|null}
         */
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