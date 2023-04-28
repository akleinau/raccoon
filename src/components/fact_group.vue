<template>
    <v-sheet border class="ma-2">
        <!-- additional information -->
        <v-expansion-panels class="mb-3">
            <v-expansion-panel>
                <v-expansion-panel-title><h4> {{ column["name"] }} </h4></v-expansion-panel-title>
                <v-expansion-panel-text class="text-grey-darken-2">
                    pairs with statistically significant differences:
                    <span v-for="tuple in Object.values(column['significance'].significant_tuples)"
                          v-bind:key="tuple">
                                        ({{ tuple[0] !== "" ? tuple[0] : "null" }} -
                                        {{ tuple[1] !== "" ? tuple[1] : "null" }})
                                    </span>
                    <div> Score: {{ column['significance'].score.toFixed(2) }}</div>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

        <!-- hints -->
        <div v-if="column['significance'].significant_tuples.length === 0">
            <v-icon icon="mdi-alert"/>
            no statistically significant differences
        </div>

        <!-- visualizations -->
        <div class="d-flex flex-row mt-2">
            <div>
                <span class="d-flex justify-center"> <b>#people per option</b></span>
                <vis_parser :description="visList[0]"/>
            </div>
            <div>
                <span class="d-flex justify-center">
                    <b>Proportion of people per option who have
                      <span style="color:darkblue">
                          {{ csvStore.target_column }} : {{ csvStore.target_option }}
                      </span>
                    </b>
                </span>
                <vis_parser :description="visList[1]"/>
            </div>
            <v-btn v-if="! visStore.dashboard_items.map(item => item.name).includes(column.name)"
                   class="ma-2 ml-5" color="indigo-darken-3" @click="visStore.add_dashboard_item(column, visList)"> Add
            </v-btn>
            <v-btn v-if="visStore.dashboard_items.map(item => item.name).includes(column.name)"
                   class="ma-2 ml-5" color="indigo-darken-3" @click="visStore.remove_dashboard_item(column.name)"> Remove
            </v-btn>
        </div>
        <vis_line v-if="column.type === 'continuous' && show_continuous" :data="column.data"
                  :target_data="column.data_with_target_option"/>
    </v-sheet>
</template>

<script>
import vis_line from "@/components/visualization/vis_line.vue";
import vis_parser from "@/components/visualization/vis_parser.vue";
import {useStore as vis_useStore} from "@/stores/visStore";
import {useStore as csv_useStore} from "@/stores/csvStore";

export default {
    name: "fact_group",
    components: {vis_parser, vis_line},
    props: [
        "visList",
        "column",
        "show_continuous"
    ],
    setup() {
        const visStore = vis_useStore()
        const csvStore = csv_useStore()
        return {csvStore, visStore}
    },
}
</script>

<style scoped>

</style>