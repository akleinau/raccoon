import {defineStore} from 'pinia'

export const useStore = defineStore('store', {
    state: () => ({
        start: true,
        csv: null,
        columns: [],
        target_column: null,
        target_all_options: [],
        target_option: null,
        variable_summaries: []
    }),
    actions: {
        calc_variable_summaries() {
            this.variable_summaries = []
            this.columns.forEach(column => {
                let options = [...new Set(this.csv.map(d => d[column]))]
                let summary = {
                    name: column,
                    //how often each option occurs
                    occurrence: Object.fromEntries(new Map(options.map(d => [d, 0]))),
                    //how often each option occurs together with the target option
                    occurrence_target_option: Object.fromEntries(new Map(options.map(d => [d, 0]))),
                }
                this.csv.forEach(d => summary.occurrence[d[column]]++)
                this.filter_for_target_option(this.csv).forEach(d => summary.occurrence_target_option[d[column]]++)

                //only continue if each option occurs more than 10 times to make sure its statistically impactful
                if (Object.values(summary.occurrence).every(d => d > 10)) {
                    //percentage how often each option occurs together with the target option
                    summary.percent_target_option = this.divide_maps(summary.occurrence_target_option, summary.occurrence)
                    //significance_score: difference in percentages of percent_target_option
                    let min = Math.min(...Object.values(summary.percent_target_option))
                    let max = Math.max(...Object.values(summary.percent_target_option))
                    summary.significance_score = max - min
                    this.variable_summaries.push(summary)
                }
            })
            //sort by significance_score
            this.variable_summaries.sort((a, b) => b.significance_score - a.significance_score)
        },
        filter_for_target_option(d) {
            return d.filter(d => d[this.target_column] === this.target_option)
        },
        divide_maps(a, b) {
            let result = {}
            Object.keys(a).forEach(key => {
                result[key] = a[key] / b[key]
            })
            return result
        },
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
