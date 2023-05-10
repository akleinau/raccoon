import {defineStore} from 'pinia'
import {useCSVStore} from "@/stores/csvStore";
import {useRegressionStore} from "@/stores/regressionStore";

export const useVisStore = defineStore('visStore', {
    state: () => ({
        dashboard_items: [],
        current_fact_group: null,
        current_fact: null,
        excluded_columns: [],
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
            },
            text: {
                graph: "text",
                font_size: 2,
                color: "midnightblue"
            }
        }
    }),
    actions: {
        /**
         * adds a new fact group to the dashboard
         *
         * @param summary
         * @param visList
         */
        add_dashboard_item(summary, visList) {
            this.dashboard_items.push({
                "name": summary.name,
                "column": summary,
                "visList": visList
            })
            useRegressionStore().compute_score()
            console.log(this.dashboard_items)
        },
        /**
         * removes a fact group from the dashboard
         *
         * @param name
         */
        remove_dashboard_item(name) {
            this.dashboard_items = this.dashboard_items.filter(item => item.name !== name)
            useRegressionStore().compute_score()
        },
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
         * @param column
         * @returns {*[]}
         */
        generate_additional_fact_visList(column) {
            let visList = []
            if (column.type === "continuous") {
                visList.push(
                    {
                        type: 'density',
                        graph: 'density',
                        data: column.data,
                        data_with_target_option: column.data_with_target_option,
                        title: 'Density'
                    }
                )
            }
            //get option with max percent
            let csvStore = useCSVStore()
            let max_percent_option = Object.entries(column.percent_target_option).sort((a, b) => b[1] - a[1])[0]
            if (max_percent_option) {
                visList.push(
                    {
                        type: "text",
                        text: "Participants with " + column.label + ": " + max_percent_option[0] + " have a " +
                            (max_percent_option[1]*100).toFixed(0) + "% chance of having " +
                            csvStore.target_column + ": " + csvStore.target_option
                    }
                )
            }

            return visList
        },
        /**
         * sets default settings for visualizations to adapt them to current dataset
         *
         * @param length
         * @param target_column
         * @param target_option
         */
        set_initial_default_settings(length, target_column, target_option) {
            this.default_settings.significance.title = "Frequency of " + target_column + ": " + target_option
            this.default_settings.impact.range = [0, length]
        },
        /**
         * generates context fact groups from selected risk factors
         *
         * @returns {*[]}
         */
        generate_context_fact_groups() {
            let fact_groups = []
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
                fact_groups.push({
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

            return fact_groups
        },
        /**
         * generates fact groups for general information about the dataset and target
         */
        generate_general_factGroups() {
            let factGroups = []

            //occurrence of target
            let target_column = useCSVStore().variable_summaries.find(d => d.name === useCSVStore().target_column)
            if (target_column) {
                factGroups.push({
                    "visList": [{
                        type: 'impact',
                        data_map: 'occurrence'
                    }],
                    "column": useCSVStore().variable_summaries.find(d => d.name === useCSVStore().target_column)
                })
            }

            //nr of participants
            let csv = useCSVStore().csv
            if (csv) {
                factGroups.push({
                    "visList": [{
                        type: 'text',
                        text: "The dataset consists of " + csv.length + " participants."
                    }],
                    "column": {name: "Nr of participants"}
                })
            }

            return factGroups
        },
        /**
         * check if column can be shown in recommendations
         */
        is_recommendation_column(column) {
            return (! this.dashboard_items.map(item => item.name).includes(column.name) &&
                column.name !== useCSVStore().target_column &&
                !this.excluded_columns.includes(column.name))
        },
        /**
         * exclude column
         */
        exclude_column(column) {
            this.excluded_columns.push(column.name)
            useRegressionStore().compute_score()
        },
        /**
         * restore column
         */
        restore_column(column) {
            this.excluded_columns = this.excluded_columns.filter(d => d !== column)
            useRegressionStore().compute_score()
        }
    }
})