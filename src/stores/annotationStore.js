import {defineStore} from 'pinia'
import * as d3 from "d3";


export const useAnnotationStore = defineStore('annotationStore', {
    state: () => ({}),
    actions: {
        compute_significance_annotations(summary) {
            let annotations = []

            //significance
            if (summary.significance !== undefined && summary.significance.significant_tuples.length === 0) {
                annotations.push({
                    "text": "No significant differences",
                    "target": [],
                    "score": 10,
                })
            }
            else {
                let max_tuple = d3.greatest(summary.significance.tuples, d => d.increase)
                annotations.push({
                    "text": "People with " + max_tuple.option.label + " have a " + max_tuple.increase + " times higher risk than others",
                    "target": [max_tuple.option.name],
                    "score": 10
                })
            }

            return annotations
        }

    }
})