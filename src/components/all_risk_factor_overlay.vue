<template>
  <!-- Choose Visualizations -->
    <v-dialog v-model="show">
        <template v-slot:activator="{ props }">

            <v-btn v-bind="props" class="h-auto pa-4 ma-2" :variant="textButton? 'plain' : 'elevated'" >
                More...
            </v-btn>

        </template>

        <v-card title="Risk Factors">
            <!-- not sure why this is so buggy!
            <v-virtual-scroll height="500" :items="csvStore.variable_summaries">
                <template  v-slot:default="item">
                    <fact_group_preview class="pa-2"
                                        v-if="! dashboardStore.dashboard_items.map(ditem => ditem.name).includes(item.item.name)"
                                        :visList="dashboardStore.generate_vis_from_settings(item.item, csvStore.csv.length, csvStore.target_column, csvStore.target_option)"
                                        :column="item.item"/>
                </template>
            </v-virtual-scroll>
            -->
            <div class="d-flex flex-wrap overflow-auto align-stretch" style="height:800px">
                <div v-for="column in csvStore.variable_summaries" v-bind:key="column" class="relative">
                    <fact_group_preview v-if="dashboardStore.is_recommendation_column(column)"
                                        class="pa-2 h-100" :vertical="true"
                                        :visList="visGeneratorStore.generate_main_fact_visList()"
                                        :column="column"/>
                </div>
            </div>


            <v-card-actions>
                <v-btn @click="close">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import fact_group_preview from "@/components/fact_group_preview.vue";
import {useDashboardStore} from "@/stores/dashboardStore";
import {useCSVStore} from "@/stores/csvStore";
import {useVisGeneratorStore} from "@/stores/visGeneratorStore";

export default {
    name: "settings_view",
    components: {
        fact_group_preview
    },
    props: [
        "textButton"
    ],
    setup() {
        const dashboardStore = useDashboardStore()
        const csvStore = useCSVStore()
        const visGeneratorStore = useVisGeneratorStore()
        return {csvStore, dashboardStore, visGeneratorStore}
    },
    data() {
        return {
            show: false,
        }
    },
    methods: {
        close() {
            this.show = false
        }
    }
}
</script>

<style scoped>

</style>