import {defineStore} from 'pinia'
import {useCSVStore} from "@/stores/csvStore";

export const useVisStore = defineStore('visStore', {
    state: () => ({
        dashboard_items: [],
        current_fact_group: null,
        current_fact: null,
        default_settings: {
            impact: {
                graph: "bar",
                grid: [25, 4],
                color: "royalblue",
                range: [0, 100],
                title: "#people per option"
            },
            significance: {
                graph: "pictograph",
                grid: [25, 4],
                color: "MediumVioletRed",
                range: "percent",
                title: "Frequency"
            },
            context: {
                graph: "bar",
                grid: [25, 4],
                color: "green"
            }
        }
    }),
    actions: {
        add_dashboard_item(summary, visList) {
            this.dashboard_items.push({
                "name": summary.name,
                "column": summary,
                "visList": visList
            })
            console.log(this.dashboard_items)
        },
        remove_dashboard_item(name) {
            this.dashboard_items = this.dashboard_items.filter(item => item.name !== name)
        },
        /**
         * generates standard visualizations for risk factors from settings
         *
         * @param column
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
        generate_additional_fact_visList(column) {
            let visList = []
            if (column.type === "continuous") {
                visList.push(
                    {
                        graph: 'density',
                        data: column.data,
                        data_with_target_option: column.data_with_target_option,
                        title: 'Density'
                    }
                )
            }
            return visList
        },
        set_initial_default_settings(length, target_column, target_option) {
            this.default_settings.significance.title = "Frequency of " + target_column + ": " + target_option
            this.default_settings.impact.range = [0, length]
        },
        generate_context_facts() {
            let facts = []
            let risk_factor_items = this.dashboard_items.filter(d => d.column.name !== useCSVStore().target_column &&
                d.column.riskIncrease !== undefined)
            if (risk_factor_items.length > 0) {
                const options = risk_factor_items.map(item => ({
                    "name": item.column.riskIncrease.risk_factor_groups,
                    "label": item.column.label + ": " + item.column.riskIncrease.risk_factor_groups
                }))
                const column = {name: "Context", options: options}

                const max_risk_multiplier = Math.max(...risk_factor_items.map(item => item.column.riskIncrease.risk_multiplier)) + 1
                const max_risk_difference = Math.max(...risk_factor_items.map(item => item.column.riskIncrease.risk_difference)) + 1
                facts.push({
                        "visList": [{
                            type: "context",
                            data: risk_factor_items.map(item => ({
                                name: item.column.riskIncrease.risk_factor_groups,
                                value: item.column.riskIncrease.risk_difference
                            })).sort((a, b) => b.value - a.value),
                            range: [0, Math.round(max_risk_difference)],
                            title: "maximal difference in risk between options"
                        }],
                        "column": column
                    },
                    {
                        "visList": [{
                            type: "context",
                            data: risk_factor_items.map(item => ({
                                name: item.column.riskIncrease.risk_factor_groups,
                                value: item.column.riskIncrease.risk_multiplier
                            })).sort((a, b) => b.value - a.value),
                            range: [0, Math.round(max_risk_multiplier)],
                            title: "risk increase through factor"
                        }],
                        "column": column
                    })
            }

            return facts
        },
        generate_general_factGroups() {
            let target_column = useCSVStore().variable_summaries.find(d => d.name === useCSVStore().target_column)
            if (!target_column) { return [] }
            return [{
                "visList": [{
                    type: 'impact',
                    data_map: 'occurrence'
                }],
                "column": useCSVStore().variable_summaries.find(d => d.name === useCSVStore().target_column)
            }]

        }
    }
})