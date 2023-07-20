<template>
    <v-app>
        <start_overlay/>
        <fact_group_view v-if="this.dashboardStore.current_fact_group !== null"/>

        <v-app-bar>
            <v-app-bar-title>Raccoon</v-app-bar-title>
            <template v-slot:append>
                <v-btn @click="this.dataStore.reset()">Reset</v-btn>
            </template>
        </v-app-bar>

        <v-main>

            <!-- Dashboard -->
            <v-card class="pa-5 bg-blue-grey-lighten-5">

                <v-card-title>
                    Dashboard
                    <dashboard_overlay text-button="true"/>
                    <export_overlay />
                </v-card-title>

                <div class="d-flex overflow-x-auto overflow-y-hidden align-stretch">
                    <div v-for="item in dashboardStore.dashboard_items" v-bind:key="item" class="d-flex flex-column pa-2">
                        <fact_group_preview :visList="item.visList" :column="item.column"
                                            style="height:500px" vertical="true"/>
                        <v-btn class="mt-0" variant="tonal"
                               @click="dashboardStore.remove_dashboard_item(item.name)"> Remove
                        </v-btn>

                    </div>
                    <dashboard_overlay/>
                </div>
            </v-card>

            <!-- Adaptation -->
            <v-card class="pa-4">
                <div class="d-flex">
                    <settings_view/>

                    <div class="w-50 pl-5">
                        <tips-view/>
                    </div>
                </div>
            </v-card>

            <!-- General -->
            <v-card title="General" class="pa-5 bg-blue-grey-lighten-5">
                <div class="d-flex overflow-x-auto overflow-y-hidden align-stretch">
                    <div v-for="item in general_list" v-bind:key="item">
                        <fact_group_preview style="height:200px" class="pa-2" :visList="item.visList"
                                            :column="item.column"/>
                    </div>
                </div>

            </v-card>

            <!-- Risk Factors -->
            <v-card class="pa-5 bg-blue-grey-lighten-5">

                <v-card-title>
                    <div class="d-flex align-center">
                        Risk Factors
                        <all_risk_factor_overlay text-button="true"/>
                        <div class="flex-grow-1 d-flex justify-end">
                            <excluded_column_overlay/>
                            <v-select class="flex-grow-0" label="Sort by..." variant="solo-filled"
                                      v-model="scoreStore.score" @update:modelValue="scoreStore.sort_summaries()"
                                      :items="scoreStore.score_choices"></v-select>
                        </div>
                    </div>
                </v-card-title>

                <div class="ml-3 mb-2">
                    Confounding factors:
                    <span v-for="name in dashboardStore.confounding_factors" v-bind:key="name" class="ml-2">
                        <v-chip variant="elevated" class="bg-shades-white">
                            {{dashboardStore.dashboard_items.find(d => d.column.name === name).column.label}}
                        </v-chip>
                    </span>
                    <confounding_factor_overlay />
                </div>

                <div v-if="regressionStore.performance_diff < 0.01">
                    <v-icon icon="mdi-alert"/>
                    there are no more impactful risk factors. Remaining frequency differences are explained by
                    correlations with currently selected factors.
                </div>

                <!-- Risk Factor Sheets -->
                <div class="d-flex overflow-x-auto overflow-y-hidden align-stretch">
                    <div v-for="item in risk_list" v-bind:key="item">
                        <fact_group_preview class="pa-2" style="height:500px"
                                            :visList="item.visList"
                                            :column="item.column" :vertical="true"/>
                    </div>

                    <all_risk_factor_overlay/>
                </div>

            </v-card>

            <!-- Context -->
            <v-card title="Context" class="pa-5 bg-blue-grey-lighten-5">
                <div class="d-flex overflow-x-auto overflow-y-hidden align-stretch">
                    <div v-for="item in visGeneratorStore.generate_context_fact_groups()" v-bind:key="item">
                        <fact_group_preview class="pa-2" :visList="item.visList" :column="item.column"
                                            v-if="! dashboardStore.dashboard_items.map(i => i.name).includes(item.column.name)"/>
                    </div>
                </div>
            </v-card>
        </v-main>

    </v-app>
</template>

<script>
import start_overlay from './components/start_overlay.vue'
import fact_group_preview from './components/fact_group_preview.vue'
import fact_group_view from './components/fact_group_view.vue'
import settings_view from "@/components/settings_view.vue";
import all_risk_factor_overlay from "@/components/all_risk_factor_overlay.vue";
import excluded_column_overlay from "@/components/excluded_column_overlay.vue";
import dashboard_overlay from "@/components/dashboard_overlay.vue";
import tipsView from "@/components/tipsView.vue";
import {useDashboardStore} from "@/stores/dashboardStore";
import {useDataStore} from "@/stores/dataStore";
import {useRegressionStore} from "@/stores/regressionStore";
import {useScoreStore} from "@/stores/scoreStore";
import {useVisGeneratorStore} from "@/stores/visGeneratorStore";
import confounding_factor_overlay from "@/components/confounding_factor_overlay.vue";


export default {
    components: {
        confounding_factor_overlay,
        excluded_column_overlay,
        fact_group_preview,
        start_overlay,
        fact_group_view,
        settings_view,
        all_risk_factor_overlay,
        dashboard_overlay,
        tipsView,
        export_overlay
    },
    setup() {
        const dataStore = useDataStore()
        const dashboardStore = useDashboardStore()
        const scoreStore = useScoreStore()
        const regressionStore = useRegressionStore()
        const visGeneratorStore = useVisGeneratorStore()
        return {dataStore, dashboardStore, regressionStore, scoreStore, visGeneratorStore}
    },
    computed: {
        risk_list: function () {
            return this.dataStore.column_list
                .filter(d => this.dashboardStore.is_recommendation_column(d)).slice(0, 20).map(column => {
                return {
                    column: column,
                    visList: this.visGeneratorStore.generate_main_fact_visList(column)
                }
            })

        },
        general_list: function () {
            return this.visGeneratorStore.generate_general_factGroups()
                .filter(d => !this.dashboardStore.dashboard_items.map(i => i.name).includes(d.column.name))
        }
    }
}
</script>

<style lang="sass" scoped>

.v-card.on-hover
  cursor: pointer

</style>
