import {defineStore} from 'pinia'
import * as d3 from "d3";


export const useAnnotationStore = defineStore('annotationStore', {
    state: () => ({}),
    actions: {
        compute_annotations(summary, type) {
            if (type === "significance") {
                return this.compute_significance_annotations(summary)
            }
            return []
        },
        compute_significance_annotations(summary) {
            let annotations = []

            //significance
            if (summary.significance !== undefined && summary.significance.significant_tuples.length === 0) {
                annotations.push({
                    "text": [[{"text": "Not statistically significant!", "color": "black"}]],
                    "target": [],
                    "score": 10,
                })
            } else {
                let max_tuple = d3.greatest(summary.significance.tuples, d => d.increase)
                annotations.push({
                    "text": [
                        [{
                            "text": "People with " + max_tuple.option.label + " have a " + max_tuple.increase + " times",
                            "color": "black"
                        }],
                        [{"text": " higher risk than others", "color": "black"}]],
                    "target": [max_tuple.option.name],
                    "score": 10
                })
            }

            //occurrence
            let under_hundred = Object.entries(summary.occurrence).filter(([_, value]) => value < 100)
            if (under_hundred.length > 0) {
                if (under_hundred.length === 1) {
                    annotations.push({
                        "text": [
                            [{"text": "Based on only " + under_hundred[0][1] + " people.", "color": "black"}]],
                        "target": [under_hundred[0][0]],
                        "score": 8
                    })
                } else {
                    let upper_boundary = d3.max(under_hundred.map(([_, value]) => value))
                    upper_boundary = Math.ceil(upper_boundary / 10) * 10  //round up to next 10
                    annotations.push({
                        "text": [
                            [{
                                "text": "Each based on fewer ",
                                "color": "black"
                            }],
                            [{
                                "text": "than " + upper_boundary + " people.",
                                "color": "black"
                            }]],
                        "target": under_hundred.map(([key, _]) => key),
                        "score": 8
                    })
                }
            }

            //risk factor
            if (summary.riskIncrease !== undefined) {
                annotations.push({
                    "text": [
                        [{
                            "text": "People with " + summary.riskIncrease.name + " have a ",
                            "color": "black"
                        }],
                        [{
                            "text": summary.riskIncrease.risk_multiplier + " times higher risk than others",
                            "color": "black"
                        }]],
                    "target": summary.riskIncrease.risk_factor_groups,
                    "score": 7
                })

            }

            return annotations.sort((a, b) => b.score - a.score)
        }

    }
})