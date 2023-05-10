import {defineStore} from 'pinia'
import {useCSVStore} from "@/stores/csvStore";

export const useScoreStore = defineStore('scoreStore', {
    state: () => ({
        score: "max_difference",
        score_choices: ["max_difference", "entropy", "max", "weighted_max", "regression"]
    }),
    actions: {
        /**
         * sort variable_summaries by currently selected significance score
         */
        sort_summaries() {
            useCSVStore().variable_summaries.sort((a, b) => b.significance.score[this.score] - a.significance.score[this.score])
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
                    "entropy": -this.entropy(Object.values(summary.percent_target_option)),
                    "regression": 0
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
        /**
         * computes entropy of a value array
         *
         * @param array
         * @returns {number}
         */
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
        /**
         * computes significance score based on maximal percentages weighted by their occurrence
         *
         * @param summary
         * @returns {number}
         */
        weighted_max_score(summary) {
            let max_percent_option = Object.entries(summary.percent_target_option).sort((a, b) => b[1] - a[1])[0]
            let max_percent_occurrence = summary.occurrence[max_percent_option[0]]
            return max_percent_option[1] * max_percent_occurrence / useCSVStore().csv.length
        },

    }
})