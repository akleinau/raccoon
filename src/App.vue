<template>
    <v-app>
        <start_overlay/>
        <fact_group_view v-if="this.visStore.current_fact_group !== null"/>
        <fact_view v-if="this.visStore.current_fact !== null"/>

        <v-app-bar>
            <v-app-bar-title>Raccoon</v-app-bar-title>
            <template v-slot:append>
                <v-btn @click="this.csvStore.reset()">Reset</v-btn>
            </template>
        </v-app-bar>
        <v-main>
            <v-card title="Dashboard">
                <div v-for="item in visStore.dashboard_items" v-bind:key="item">
                    <fact_group :visList="item.visualizations" :column="item.summary" :show_continuous="show_continuous" />
                </div>
            </v-card>

            <v-card title="Risk Factors" class="pa-5 bg-blue-grey-lighten-5">
                <!-- Choose Visualizations -->
                <div class="d-flex">
                    <div class="mx-5">
                        <v-radio-group v-model="impact_settings.graph" label="Impact Graph">
                            <v-radio label="bar" value="bar"></v-radio>
                            <v-radio label="pictograph" value="pictograph"></v-radio>
                        </v-radio-group>
                        <v-text-field type="number" label="#rows" v-model="impact_settings.grid[0]"/>
                        <v-text-field type="number" label="#columns" v-model="impact_settings.grid[1]"/>
                    </div>
                    <div class="mx-5">
                        <v-radio-group v-model="significance_settings.graph" label="Significance Graph">
                            <v-radio label="bar" value="bar"></v-radio>
                            <v-radio label="pictograph" value="pictograph"></v-radio>
                        </v-radio-group>
                        <v-text-field type="number" label="#rows" v-model="significance_settings.grid[0]"/>
                        <v-text-field type="number" label="#columns" v-model="significance_settings.grid[1]"/>
                    </div>
                    <div class="mx-5">
                        <v-checkbox v-model="show_continuous" label="show density plot"></v-checkbox>
                        <v-checkbox label="exclude missing values" v-model="csvStore.exclude_missing"></v-checkbox>
                        <v-text-field type="number" label="minimal bin size" v-model="csvStore.min_bin_size"/>
                        <v-btn variant="outlined" @click="csvStore.calc_variable_summaries()">Recalculate</v-btn>
                    </div>
                </div>


                <!-- Risk Factor Sheets -->
                <div v-for="column in csvStore.variable_summaries" v-bind:key="column">
                    <fact_group v-if="! visStore.dashboard_items.map(item => item.name).includes(column.name)"
                        :visList="generate_vis_from_settings(column)" :column="column" :show_continuous="show_continuous" />
                </div>

            </v-card>
        </v-main>

    </v-app>
</template>

<script>
import start_overlay from './components/start_overlay.vue'
import fact_group from './components/fact_group.vue'
import fact_group_view from './components/fact_group_view.vue'
import fact_view from './components/fact_view.vue'
import {useStore as csv_useStore} from "@/stores/csvStore";
import {useStore as vis_useStore} from "@/stores/visStore";


export default {
    components: {
        fact_group,
        start_overlay,
        fact_group_view,
        fact_view
    },
    setup() {
        const csvStore = csv_useStore()
        const visStore = vis_useStore()
        return {csvStore, visStore}
    },
    data() {
        return {
            impact_settings: {
                graph: "bar",
                grid: [25, 4],
            },
            significance_settings: {
                graph: "pictograph",
                grid: [25, 4],
            },
            show_continuous: false
        }
    },
    methods: {
        generate_vis_from_settings(column) {
            let visList = []
            visList.push(
                {
                    data_map: column['occurrence'],
                    range: [0, this.csvStore.csv.length],
                    grid: this.impact_settings.grid,
                    graph: this.impact_settings.graph,
                    color: "royalblue"
                },
                {
                    data_map: column['percent_target_option'],
                    range: "percent",
                    grid: this.significance_settings.grid,
                    graph: this.significance_settings.graph,
                    color: "MediumVioletRed"
                }
            )
            return visList
        }
    }
}
</script>

<style scoped></style>
