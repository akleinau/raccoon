<template>
    <v-app>
        <start_overlay/>
        <fact_group_view v-if="this.visStore.current_fact_group !== null"/>
        <fact_view v-if="this.visStore.current_fact !== null"/>

        <v-app-bar>
            <v-app-bar-title>Raccoon</v-app-bar-title>
            <template v-slot:append>
                <settings_view/>
                <v-btn @click="this.csvStore.reset()">Reset</v-btn>
            </template>
        </v-app-bar>

        <v-main>
            <v-card title="Dashboard" class="pa-5 bg-blue-grey-lighten-5">
                <div class="d-flex flex-wrap">
                    <div v-for="item in visStore.dashboard_items" v-bind:key="item" class="d-flex flex-column pa-2">
                        <fact_group_preview :visList="item.visualizations" :column="item.summary"
                                            style="height:500px" vertical="true"/>
                        <v-btn class="mt-0" variant="tonal"
                               @click="visStore.remove_dashboard_item(item.name)"> Remove
                        </v-btn>

                    </div>
                </div>
            </v-card>

            <v-card title="Adapt" class="pa-5">
                <div class="d-flex">
                    <v-expansion-panels class="ma-3 w-50">
                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Change Color </h4></v-expansion-panel-title>
                            <v-expansion-panel-text class="text-grey-darken-2">
                            </v-expansion-panel-text>
                        </v-expansion-panel>

                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Change Background </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                            </v-expansion-panel-text>
                        </v-expansion-panel>

                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Change Font </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                            </v-expansion-panel-text>
                        </v-expansion-panel>

                    </v-expansion-panels>

                    <div class="w-50 pl-5">
                        <h3> Tips </h3>
                        <ul class="pl-5">
                            <li>...</li>
                            <li>...</li>
                            <li>...</li>
                        </ul>
                    </div>
                </div>
            </v-card>

            <v-card title="Target" class="pa-5 bg-blue-grey-lighten-5" v-if="current_target_column">
                <fact_group_preview class="pa-2"
                                    v-if="!visStore.dashboard_items.map(item => item.name).includes(current_target_column.name)"
                                    :visList="get_visList_target()"
                                    :column="current_target_column"
                                    :vertical="true"/>

            </v-card>

            <v-card class="pa-5 bg-blue-grey-lighten-5">

                <v-card-title>Risk Factors
                    <all_risk_factor_view text-button="true"/>
                </v-card-title>

                <!-- Risk Factor Sheets -->
                <div class="d-flex pa-4 overflow-x-auto overflow-y-hidden align-stretch">
                    <div v-for="column in csvStore.variable_summaries.slice(1,20)" v-bind:key="column">
                        <fact_group_preview class="pa-2" style="height:500px"
                                            v-if="! visStore.dashboard_items.map(item => item.name).includes(column.name) && column.name !== csvStore.target_column"
                                            :visList="visStore.generate_main_fact_visList(column, csvStore.csv.length, csvStore.target_column, csvStore.target_option)"
                                            :column="column" :vertical="true"/>
                    </div>

                    <all_risk_factor_view/>
                </div>

            </v-card>

            <v-card title="Context" class="pa-5 bg-blue-grey-lighten-5">

            </v-card>
        </v-main>

    </v-app>
</template>

<script>
import start_overlay from './components/start_overlay.vue'
import fact_group_preview from './components/fact_group_preview.vue'
import fact_group_view from './components/fact_group_view.vue'
import fact_view from './components/fact_view.vue'
import settings_view from "@/components/settings_view.vue";
import all_risk_factor_view from "@/components/all_risk_factor_view.vue";
import {useVisStore} from "@/stores/visStore";
import {useCSVStore} from "@/stores/csvStore";


export default {
    components: {
        fact_group_preview,
        start_overlay,
        fact_group_view,
        fact_view,
        settings_view,
        all_risk_factor_view
    },
    setup() {
        const csvStore = useCSVStore()
        const visStore = useVisStore()
        return {csvStore, visStore}
    },
    computed: {
        current_target_column() {
            return this.csvStore.variable_summaries.find(a => a.name === this.csvStore.target_column)
        }
    },
    methods: {
        get_visList_target() {
            return [{
                type: 'impact',
                data_map: this.current_target_column['occurrence'],
                options: this.current_target_column['options'],
            }]
        }
    }
}
</script>

<style lang="sass" scoped>

.v-card.on-hover
  cursor: pointer

</style>
