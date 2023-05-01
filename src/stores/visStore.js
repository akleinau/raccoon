import {defineStore} from 'pinia'

export const useStore = defineStore('visStore', {
    state: () => ({
        dashboard_items: [],
        current_fact_group: null,
        current_fact: null,
        impact_settings: {
            graph: "bar",
            grid: [25, 4],
        },
        significance_settings: {
            graph: "pictograph",
            grid: [25, 4],
        },
        show_continuous: false
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
        generate_vis_from_settings(column, length, target_column, target_option) {
            let visList = []
            visList.push(
                {
                    data_map: column['percent_target_option'],
                    range: "percent",
                    grid: this.significance_settings.grid,
                    graph: this.significance_settings.graph,
                    color: "MediumVioletRed",
                    title: "Proportion of people per option who have " + target_column + ": " + target_option
                },
                {
                    data_map: column['occurrence'],
                    range: [0, length],
                    grid: this.impact_settings.grid,
                    graph: this.impact_settings.graph,
                    color: "royalblue",
                    title: "#people per option"
                },
            )
            return visList
        }
    }
})