<template>
  <!-- Choose Visualizations -->
    <v-dialog v-model="show">
        <template v-slot:activator="{ props }">

            <v-btn v-bind="props" class="h-auto pa-4 ma-2" :variant="textButton? 'plain' : 'elevated'" >
                More...
            </v-btn>

        </template>

        <v-card title="Dashboard">
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
                    <div v-for="item in dashboardStore.dashboard_items" v-bind:key="item" class="d-flex flex-column pa-2">
                        <fact_group_preview :visList="item.visList" :column="item.column"
                                            style="height:500px" vertical="true"/>
                        <v-btn class="mt-0" variant="tonal"
                               @click="dashboardStore.remove_dashboard_item(item.name)"> Remove
                        </v-btn>

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

export default {
    name: "dashboard_overlay",
    components: {
        fact_group_preview
    },
    props: [
        "textButton"
    ],
    setup() {
        const dashboardStore = useDashboardStore()
        const csvStore = useCSVStore()
        return {csvStore, dashboardStore}
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