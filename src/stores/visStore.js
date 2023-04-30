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
        }
    }
})