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

            <v-card title="Dashboard" class="pa-5 bg-blue-grey-lighten-5">
                <div class="d-flex flex-wrap">
                    <div v-for="item in visStore.dashboard_items" v-bind:key="item" class="d-flex flex-column pa-2">
                        <fact_group_preview :visList="item.visList" :column="item.column"
                                            style="height:500px" vertical="true"/>
                        <v-btn class="mt-0" variant="tonal"
                               @click="visStore.remove_dashboard_item(item.name)"> Remove
                        </v-btn>

                    </div>
                </div>
            </v-card>

            <v-card title="Adapt" class="pa-5">
                <div class="d-flex">
                    <settings_view/>

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

            <v-card title="General" class="pa-5 bg-blue-grey-lighten-5">
                <div class="d-flex pa-4 overflow-x-auto overflow-y-hidden align-stretch">
                    <div v-for="item in visStore.generate_general_factGroups()" v-bind:key="item">
                        <fact_group_preview style="height:200px" class="pa-2" :visList="item.visList" :column="item.column"
                         v-if="! visStore.dashboard_items.map(i => i.name).includes(item.column.name)"/>
                    </div>
                </div>

            </v-card>

            <v-card class="pa-5 bg-blue-grey-lighten-5">

                <v-card-title>Risk Factors
                    <all_risk_factor_view text-button="true"/>
                </v-card-title>

                <!-- Risk Factor Sheets -->
                <div class="d-flex pa-4 overflow-x-auto overflow-y-hidden align-stretch">
                    <div v-for="column in csvStore.variable_summaries.slice(0,20)" v-bind:key="column">
                        <fact_group_preview class="pa-2" style="height:500px"
                                            v-if="visStore.is_recommendation_column(column)"
                                            :visList="visStore.generate_main_fact_visList()"
                                            :column="column" :vertical="true"/>
                    </div>

                    <all_risk_factor_view/>
                </div>

            </v-card>

            <v-card title="Context" class="pa-5 bg-blue-grey-lighten-5">
                <div class="d-flex pa-4 overflow-x-auto overflow-y-hidden align-stretch">
                    <div v-for="item in visStore.generate_context_fact_groups()" v-bind:key="item">
                        <fact_group_preview class="pa-2" :visList="item.visList" :column="item.column"
                        v-if="! visStore.dashboard_items.map(i => i.name).includes(item.column.name)"/>
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
import fact_view from './components/fact_view.vue'
import settings_view from "@/components/settings_view.vue";
import all_risk_factor_view from "@/components/all_risk_factor_view.vue";
import {useVisStore} from "@/stores/visStore";
import {useCSVStore} from "@/stores/csvStore";
import {useRegressionStore} from "@/stores/regressionStore";


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
        const regressionStore = useRegressionStore()
        return {csvStore, visStore, regressionStore}
    }
}
</script>

<style lang="sass" scoped>

.v-card.on-hover
  cursor: pointer

</style>
