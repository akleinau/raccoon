import {defineStore} from 'pinia'
import {useCSVStore} from "@/stores/csvStore";
import {useRegressionStore} from "@/stores/regressionStore";
import {useSimilarityStore} from "@/stores/similarityStore";
import * as d3 from "d3";

export const useVisStore = defineStore('visStore', {
    state: () => ({
        dashboard_items: [],
        current_fact_group: null,
        current_fact: null,
        excluded_columns: [],
        intention: "explore",
        default_settings: {
            impact: {
                graph: "bar",
                grid: [25, 4],
                range: [0, 100],
                axis: [{text: "amount of people", color: "black"}],
                title: [{text: "How common is each option in the dataset?", color: "black"}],
                detailLevel: "denominator",
                font_size: 2,
                color: 0,
            },
            significance: {
                graph: "pictograph",
                grid: [25, 4],
                range: "percent",
                axis: [{text: "occurrence per 100 people", color: "black"}],
                title: [{text: "How frequent is ", color: "black"},
                {text: " $target_column: $target_option", color: "$color"}, {text: " per group?", color: "black"}],
                detailLevel: "denominator",
                font_size: 2,
                color: 1,
            },
            context: {
                graph: "bar",
                grid: [25, 4],
                range: [0,5],
                axis: [{text: "Context", color: "black"}],
                title: [{text: "Context", color: "black"}],
                detailLevel: "denominator",
                font_size: 2,
                color: 2,
            },
            text: {
                graph: "text",
                font_size: 2,
            }
        },
        default_colors: {
            "background": {color: "auto", stroke: "None"},
            "colors": [ "#1302b5", "#0277b5", "#02b56c", "#1eb502", "#a4b502" ] ,
            "text": "midnightBlue",
            "font_family": "inherit",
        }
    }),
    actions: {
        /**
         * adds a new fact group to the dashboard
         *
         * @param summary
         * @param visList
         * @param recalculate
         */
        add_dashboard_item(summary, visList, recalculate = true) {
            this.dashboard_items.push({
                "name": summary.name,
                "column": summary,
                "visList": visList
            })
            if (recalculate) {
                useRegressionStore().compute_score()
            }
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
         * @returns {*[]}
         */
        generate_additional_fact_visList() {

            return []
        },
        /**
         * sets default settings for visualizations to adapt them to current dataset
         *
         * @param length
         */
        set_initial_default_settings(length) {
            this.default_settings.impact.range = [0, length]

            this.update_settings_by_intention()

        },
        update_settings_by_intention() {
            //consider intention
            if (this.intention === "explore") {
                this.default_settings.impact.detailLevel = "denominator"
                this.default_settings.impact.graph = "bar"
                this.default_settings.significance.detailLevel = "percent"
                this.default_settings.context.detailLevel = "denominator"
                this.default_settings.text.detailLevel = "denominator"
            } else if (this.intention === "convince") {
                this.default_settings.impact.detailLevel = "nominator"
                this.default_settings.impact.graph = "bar"
                this.default_settings.significance.detailLevel = "nominator"
                this.default_settings.context.detailLevel = "nominator"
                this.default_settings.text.detailLevel = "nominator"
            } else if (this.intention === "educate") {
                this.default_settings.impact.detailLevel = "percent"
                this.default_settings.impact.graph = "pie"
                this.default_settings.significance.detailLevel = "denominator"
                this.default_settings.context.detailLevel = "denominator"
                this.default_settings.text.detailLevel = "denominator"
            }
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
                                name: item.column.riskIncrease.name,
                                value: item.column.riskIncrease.risk_multiplier
                            })).filter(d => d.value !== null).sort((a, b) => b.value - a.value),
                            range: [0, Math.round(max_risk_multiplier)],
                            title: [{text: "By how many times is the risk increased?", color: "black"}],
                            axis: [{text: "risk increase through factor", color: "black"}]
                        }],
                        "column": {name: "RelativeIncrease", label:"Risk Factors", options: options}
                    },
                    //absolute risk increase
                    {
                        "visList": [{
                            type: "context",
                            data: risk_factor_items.map(item => ({
                                name: item.column.riskIncrease.name,
                                value: item.column.riskIncrease.risk_difference
                            })).sort((a, b) => b.value - a.value),
                            range: [0, 1],
                            detailLevel: "percent",
                            title: [{text: "How much is the risk increased?", color: "black"}],
                            axis: [{text: "difference in risk with/ without factor", color: "black"}]
                        }],
                        "column": {name: "AbsoluteIncrease", label:"Risk Factors", options: options}
                    },
                    //absolute risk
                    {
                        "visList": [{
                            type: "context",
                            data: risk_factor_items.map(item => ({
                                name: item.column.riskIncrease.name,
                                value: item.column.riskIncrease.absolute_risk
                            })).sort((a, b) => b.value - a.value),
                            range: [0, 1],
                            graph: "pictograph",
                            title: [{text: "What is the risk per risk factor?", color: "black"}],
                            axis: [{text: "absolute risk through factor", color: "black"}]
                        }],
                        "column": {name: "AbsoluteValues", label:"Risk Factors", options: options}
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
                        text: [{text: "The dataset consists of " + csv.length + " participants.", color: "$color"}]
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
            return (!this.dashboard_items.map(item => item.name).includes(column.name) &&
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
        },
        /**
         * set new fact group
         */
        set_fact_group(column, visList) {
            this.current_fact_group = {
                'column': column,
                'visList': visList,
                'additional_vis_list': this.generate_additional_fact_visList(column),
                'similar_dashboard_columns': useSimilarityStore().compute_similar_dashboard_columns(column)}
        },
        /**
         * get color
         */
        get_color(color_name) {
            if (!isNaN(color_name)) {
                return this.default_colors.colors[color_name]
            }
            return color_name
        }
    }
})