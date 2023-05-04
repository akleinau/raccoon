import {defineStore} from 'pinia'

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
            }
        }
    }),
    actions: {
        add_dashboard_item(summary, visList) {
            this.dashboard_items.push({
                "name": summary.name,
                "summary": summary,
                "visualizations": visList
            })
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
        generate_main_fact_visList(column) {
            let visList = []
            visList.push(
                {
                    type: "significance",
                    data_map: column['percent_target_option'],
                    options: column['options'],
                },
                {
                    type: "impact",
                    data_map: column['occurrence'],
                    options: column['options'],
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
        }
    }
})