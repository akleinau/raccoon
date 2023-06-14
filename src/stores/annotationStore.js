import {defineStore} from 'pinia'
import * as d3 from "d3";
import {useSimilarityStore} from "@/stores/similarityStore";


export const useAnnotationStore = defineStore('annotationStore', {
    state: () => ({}),
    actions: {
        /**
         * compute annotations for a summary based on its type
         *
         * @param summary
         * @param type
         * @returns {*[]}
         */
        compute_annotations(summary, type) {
            if (type === "significance") {
                return this.compute_significance_annotations(summary)
            }
            if (type === "impact") {
                return this.compute_impact_annotations(summary)
            }
            if (type === "similarity") {
                return this.compute_similarity_annotations(summary)
            }
            return []
        },
        /**
         * compute annotations based on a summary for significance visualizations
         *
         * @param summary
         * @returns {*[]}
         */
        compute_significance_annotations(summary) {
            let annotations = []
            annotations.push({"text": [[{"text": "custom", "color": "black"}]], "target": [], "score": 0}) //empty annotation

            //significance
            if (summary.significance !== undefined && summary.significance.significant_tuples.length === 0 && summary.options > 1) {
                annotations.push({
                    "text": [[{"text": "Not statistically significant!", "color": "black"}]],
                    "target": [],
                    "score": 10,
                })
            }
            else {
                let greatest_significance = summary.significance.significant_tuples.sort((a, b) => b[1] - a[1])[0]
                annotations.push({
                    "text": [[{"text": (summary.percent_target_option[greatest_significance]*100).toFixed(0) + "% of participants with a $column of ", "color": "black"}],
                        [{"text": summary.options.find(d => d.name === greatest_significance).label + " have $target_column: $target_option", "color": "black"}]],
                    "target": [greatest_significance],
                    "score": 3,
                })
            }

            let under_hundred = Object.entries(summary.occurrence).filter(([_, value]) => value < 100)
            if (under_hundred.length > 0) {
                if (under_hundred.length === 1) {
                    annotations.push({
                        "text": [
                            [{"text": "Based on only " + under_hundred[0][1] + " people.", "color": "black"}]],
                        "target": [under_hundred[0][0]],
                        "score": 7
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
                        "score": 7
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
                    "score": 5
                })

            }

            return annotations.sort((a, b) => b.score - a.score)
        },

        /**
         * compute annotations based on a summary for impact visualizations
         *
         * @param summary
         * @returns {*[]}
         */
        compute_impact_annotations(summary) {
            let annotations = []
            annotations.push({"text": [[{"text": "custom", "color": "black"}]], "target": [], "score": 0}) //empty annotation

            //occurrence
            let greatest_occurrence = Object.entries(summary.occurrence).sort((a, b) => b[1] - a[1])[0]
            annotations.push({
                "text": [[{"text": "Most participants have a ", "color": "black"}],
                    [{"text":"$column of " + summary.options.find(d => d.name === greatest_occurrence[0]).label, "color": "black"}]],
                "target": [greatest_occurrence[0]],
                "score": 5
            })

            let under_hundred = Object.entries(summary.occurrence).filter(([_, value]) => value < 100)
            if (under_hundred.length > 0) {
                if (under_hundred.length === 1) {
                    annotations.push({
                        "text": [
                            [{"text": "Only " + under_hundred[0][1] + " people.", "color": "black"}]],
                        "target": [under_hundred[0][0]],
                        "score": 7
                    })
                } else {
                    let upper_boundary = d3.max(under_hundred.map(([_, value]) => value))
                    upper_boundary = Math.ceil(upper_boundary / 10) * 10  //round up to next 10
                    annotations.push({
                        "text": [
                            [{
                                "text": "These groups each have fewer ",
                                "color": "black"
                            }],
                            [{
                                "text": "than " + upper_boundary + " people.",
                                "color": "black"
                            }]],
                        "target": under_hundred.map(([key, _]) => key),
                        "score": 7
                    })
                }
            }

            return annotations.sort((a, b) => b.score - a.score)
        },

        compute_similarity_annotations(summary) {
            let annotations = []
            annotations.push({"text": [[{"text": "custom", "color": "black"}]], "target": [], "score": 0}) //empty annotation
            //similar dashboard columns
            let similar_dashboard_columns = useSimilarityStore().compute_similar_dashboard_columns(summary)
                .sort((a, b) => b.similarity - a.similarity)
            if (similar_dashboard_columns.length > 0) {
                let name_string = similar_dashboard_columns
                    .map(d => d.column.label)
                    .join(", ")
                annotations.push({
                    "text": [
                        [{
                            "text": "$column correlates strongly with ",
                            "color": "black"
                        }],
                        [{
                            "text": name_string,
                            "color": "black"
                        }]],
                    "target": [],
                    "score": 10
                })
            }

            return annotations.sort((a, b) => b.score - a.score)
        }

    }
})