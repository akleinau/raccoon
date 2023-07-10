import {defineStore} from 'pinia'
import {useDataStore} from "@/stores/dataStore";
import {useDashboardStore} from "@/stores/dashboardStore";

export const useVisGeneratorStore = defineStore('VisGeneratorStore', {
    state: () => ({}),
    actions: {
        /**
         * generates standard visualizations for risk factors from settings
         *
         * @returns {*[]}
         */
        generate_main_fact_visList() {
            let visList = []
            visList.push(
                {
                    type: "significance",
                    data_map: 'percent_target_option',
                    options: 'options',
                },
                {
                    type: "impact",
                    data_map: 'occurrence',
                    options: 'options',
                },
            )
            return visList
        },
        /**
         * generates additional visualizations for the fact group
         *
         * @returns {*[]}
         */
        generate_additional_fact_visList(column, similar_dashboard_columns) {
            let visList = []
            visList.push(
                {
                    type: "custom",
                    graph: "text",
                    text: [{"text": "add custom text about $column here", "color": "black"}],
                }
            )
            if (similar_dashboard_columns.length > 0) {
                visList.push(
                    {
                        type: "similarity",
                        data: similar_dashboard_columns.map(item => ({
                            name: item.column.label,
                            value: item.similarity.toFixed(2)
                        }))
                    }
                )
            }

            return visList
        },
        /**
         * generates context fact groups from selected risk factors
         *
         * @returns {*[]}
         */
        generate_context_fact_groups() {
            let fact_groups = []
            let risk_factor_items = useDashboardStore().dashboard_items.filter(d => d.column.name !== useDataStore().target_column &&
                d.column.riskIncrease !== undefined)
            if (risk_factor_items.length > 0) {
                const options = risk_factor_items.map(item => ({
                    "name": item.column.riskIncrease.name,
                    "label": item.column.label + ": " + item.column.riskIncrease.name
                }))

                const max_risk_multiplier = Math.max(...risk_factor_items.map(item => item.column.riskIncrease.risk_multiplier)) + 1
                fact_groups.push(
                    //relative risk increase
                    {
                        "visList": [{
                            type: "context",
                            data: risk_factor_items.map(item => ({
                                name: item.column.label + ": " + item.column.riskIncrease.name,
                                value: item.column.riskIncrease.risk_multiplier
                            })).filter(d => d.value !== null).sort((a, b) => b.value - a.value),
                            range: [0, Math.round(max_risk_multiplier)],
                            title: [{text: "By how many times is the risk increased?", color: "black"}],
                            axis: [{text: "risk increase through factor", color: "black"}]
                        }],
                        "column": {name: "RelativeIncrease", label: "Relative Risk Increase", options: options}
                    },
                    //absolute risk increase
                    {
                        "visList": [{
                            type: "context",
                            data: risk_factor_items.map(item => ({
                                name: item.column.label + ": " + item.column.riskIncrease.name,
                                value: item.column.riskIncrease.risk_difference
                            })).sort((a, b) => b.value - a.value),
                            range: [0, 1],
                            detailLevel: "percent",
                            title: [{text: "How much is the risk increased?", color: "black"}],
                            axis: [{text: "difference in risk with/ without factor", color: "black"}]
                        }],
                        "column": {name: "AbsoluteIncrease", label: "Absolute Risk Increase", options: options}
                    },
                    //absolute risk
                    {
                        "visList": [{
                            type: "context",
                            data: risk_factor_items.map(item => ({
                                name: item.column.label + ": " + item.column.riskIncrease.name,
                                value: item.column.riskIncrease.absolute_risk
                            })).sort((a, b) => b.value - a.value),
                            range: [0, 1],
                            graph: "pictograph",
                            title: [{text: "How frequent is ", color: "black"},
                                {text: " $target_label", color: "$color"}, {
                                    text: " per risk factor?",
                                    color: "black"
                                }],
                            axis: [{text: "absolute risk through factor", color: "black"}]
                        }],
                        "column": {name: "AbsoluteValues", label: "Absolute Risks", options: options}
                    })
            }

            return fact_groups
        },
        /**
         * generates fact groups for general information about the dataset and target
         */
        generate_general_factGroups() {
            let factGroups = []

            //occurrence of target
            let target_column = useDataStore().column_list.find(d => d.name === useDataStore().target_column)
            if (target_column) {
                factGroups.push({
                    "visList": [{
                        type: 'impact',
                        data_map: 'occurrence'
                    }],
                    "column": useDataStore().column_list.find(d => d.name === useDataStore().target_column)
                })
            }

            //nr of participants
            let csv = useDataStore().csv
            if (csv) {
                factGroups.push({
                    "visList": [{
                        type: 'custom',
                        text: [{text: "The dataset consists of " + csv.length + " $rows.", color: "$color"}]
                    }],
                    "column": {name: "Nr of participants"}
                })
            }

            return factGroups
        },
    }
})