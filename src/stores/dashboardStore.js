import {defineStore} from 'pinia'
import {useDataStore} from "@/stores/dataStore";
import {useRegressionStore} from "@/stores/regressionStore";
import {useSimilarityStore} from "@/stores/similarityStore";
import {useVisGeneratorStore} from "@/stores/visGeneratorStore";

export const useDashboardStore = defineStore('dashboardStore', {
    state: () => ({
        dashboard_items: [],
        current_fact_group: null,
        current_fact_index: null,
        excluded_columns: [],
        intention: "explore",
        default_settings: {
            impact: {
                graph: "bar",
                grid: [25, 4],
                icon: "circle",
                ratio: 1,
                range: [0, 100],
                axis: [{text: "amount of people in each group", color: "black"}],
                title: [{text: "How common is each group of $column in the data?", color: "black"}],
                detailLevel: "denominator",
                font_size: 2,
                color: 0,
            },
            significance: {
                graph: "pictograph",
                grid: [25, 4],
                icon: "circle",
                ratio: 1,
                range: "percent",
                axis: [{text: "likelihood of $target_column: $target_option per group", color: "black"}],
                title: [{text: "How likely is ", color: "black"},
                    {text: " $target_column: $target_option", color: "$color"}, {text: " per group of $column?", color: "black"}],
                detailLevel: "denominator",
                font_size: 2,
                color: 1,
            },
            context: {
                graph: "bar",
                grid: [25, 4],
                icon: "circle",
                ratio: 1,
                range: [0, 5],
                axis: [{text: "Context", color: "black"}],
                title: [{text: "Context", color: "black"}],
                detailLevel: "denominator",
                font_size: 2,
                color: 3,
            },
            custom: {
                graph: "text",
                font_size: 2,
                text: [{text: "", color: "black"}],
            },
            similarity: {
                graph: "bar",
                grid: [25, 4],
                icon: "circle",
                ratio: 1,
                range: [0, 1],
                axis: [{text: "correlation", color: "black"}],
                title: [{text: "Which variables are similar to $column?", color: "black"}],
                detailLevel: "denominator",
                font_size: 2,
                color: 2,

            }
        },
        default_colors: {
            "background": {color: "auto", stroke: "None"},
            "colors": ["#1302b5", "#0277b5", "#02b56c", "#1eb502", "#a4b502"],
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
            this.update_dashboard_context()
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
            this.update_dashboard_context()
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
        /**
         * updates default settings for visualizations to adapt them to current intention
         */
        update_settings_by_intention() {
            //consider intention
            if (this.intention === "explore") {
                this.default_settings.impact.detailLevel = "denominator"
                this.default_settings.impact.graph = "bar"
                this.default_settings.significance.detailLevel = "percent"
                this.default_settings.context.detailLevel = "denominator"
                this.default_settings.custom.detailLevel = "denominator"
            } else if (this.intention === "convince") {
                this.default_settings.impact.detailLevel = "nominator"
                this.default_settings.impact.graph = "bar"
                this.default_settings.significance.detailLevel = "nominator"
                this.default_settings.context.detailLevel = "nominator"
                this.default_settings.custom.detailLevel = "nominator"
            } else if (this.intention === "educate") {
                this.default_settings.impact.detailLevel = "percent"
                this.default_settings.impact.graph = "pie"
                this.default_settings.significance.detailLevel = "denominator"
                this.default_settings.context.detailLevel = "denominator"
                this.default_settings.custom.detailLevel = "denominator"
            }
        },
        /**
         * update context facts in the dashboard
         */
        update_dashboard_context() {
            let risk_factor_items = this.dashboard_items.filter(d => d.column.name !== useDataStore().target_column &&
                d.column.riskIncrease !== undefined)

            const options = risk_factor_items.map(item => ({
                    "name": item.column.riskIncrease.name,
                    "label": item.column.label + ": " + item.column.riskIncrease.name
                }))

            const max_risk_multiplier = Math.max(...risk_factor_items.map(item => item.column.riskIncrease.risk_multiplier)) + 1
            this.dashboard_items.forEach(item => {
                if (item.column.name === "RelativeIncrease") {
                    item.visList.forEach(vis => {
                        vis.data = risk_factor_items.map(item => ({
                            name: item.column.riskIncrease.name,
                            value: item.column.riskIncrease.risk_multiplier
                        })).filter(d => d.value !== null).sort((a, b) => b.value - a.value)
                        vis.range = [0, Math.round(max_risk_multiplier)]
                    })
                    item.column.options = options
                }
                if (item.column.name === "AbsoluteIncrease") {
                    item.visList.forEach(vis => {
                        vis.data = risk_factor_items.map(item => ({
                            name: item.column.riskIncrease.name,
                            value: item.column.riskIncrease.risk_difference
                        })).sort((a, b) => b.value - a.value)
                    })
                    item.column.options = options
                }
                if (item.column.name === "AbsoluteValues") {
                    item.visList.forEach(vis => {
                        vis.data = risk_factor_items.map(item => ({
                            name: item.column.riskIncrease.name,
                            value: item.column.riskIncrease.absolute_risk
                        })).sort((a, b) => b.value - a.value)
                    })
                    item.column.options = options
                }

            })
        },
        /**
         * check if column can be shown in recommendations
         */
        is_recommendation_column(column) {
            return (!this.dashboard_items.map(item => item.name).includes(column.name) &&
                column.name !== useDataStore().target_column &&
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
            let similar_dashboard_columns = useSimilarityStore().compute_similar_dashboard_columns(column)
            let additional_vis_list = useVisGeneratorStore().generate_additional_fact_visList(column, similar_dashboard_columns)

            this.current_fact_group = {
                'column': column,
                'visList': visList,
                'additional_vis_list': additional_vis_list,
                'similar_dashboard_columns': similar_dashboard_columns
            }
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