<template>
    <v-dialog v-model="display">
        <v-card class="flex mx-auto w-75">

            <v-card-title>
                Fact Group View: {{ visStore.current_fact_group.column['label'] }}
            </v-card-title>

            <!-- hints -->
            <div v-if="visStore.current_fact_group.column.significance !== undefined &&
                visStore.current_fact_group.column['significance'].significant_tuples.length === 0">
                <v-icon icon="mdi-alert"/>
                no statistically significant differences
            </div>
            <div v-if="Object.values(visStore.current_fact_group.column.occurrence).filter( b => b < 100).length > 0">
                <v-icon icon="mdi-alert"/>
                Calculated frequencies are less accurate for options with less than 100 people.
            </div>

            <!-- visualizations -->
            <div class="d-flex overflow-y-hidden pb-5">
                <div class="d-flex flex-column pa-1" v-for="vis in visStore.current_fact_group.visList"
                     v-bind:key="vis">
                    <v-hover v-slot="{ isHovering, props }">
                        <v-card :elevation="isHovering ? 16 : 2" v-bind="props" @click="show_fact_view(vis)"
                                :class="{ 'on-hover': isHovering }" class="pa-2">
                            <vis_parser :vis="vis" :column="visStore.current_fact_group.column"/>
                        </v-card>
                    </v-hover>
                    <div class="d-flex w-100 flex-wrap">
                        <v-btn variant="tonal" class="flex-grow-1 mx-1" @click="remove_vis(vis)">Remove</v-btn>
                    </div>
                </div>
            </div>

            <!-- option tabs -->
            <v-expansion-panels class="ma-3">
                <v-expansion-panel class="ma-1" v-if="visStore.current_fact_group.column.significance !== undefined">
                    <v-expansion-panel-title><h4> Statistical Information </h4></v-expansion-panel-title>
                    <v-expansion-panel-text class="text-grey-darken-2">
                        pairs with statistically significant differences:
                        <span v-for="tuple in Object.values(visStore.current_fact_group.column['significance'].significant_tuples)"
                              v-bind:key="tuple">
                                        ({{ tuple[0] !== "" ? tuple[0] : "null" }} -
                                        {{ tuple[1] !== "" ? tuple[1] : "null" }})
                                    </span>
                        <div> Score:
                            {{ visStore.current_fact_group.column['significance'].score[scoreStore.score].toFixed(2) }}
                        </div>
                        <div> Risk Increase: {{ visStore.current_fact_group.column['riskIncrease'] }}</div>
                    </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel class="ma-1">
                    <v-expansion-panel-title><h4> Similar Facts </h4></v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <div class="d-flex overflow-y-hidden  pb-5">
                            <div class="d-flex flex-column pa-1"
                                 v-for="vis in visStore.current_fact_group.additional_vis_list"
                                 v-bind:key="vis">
                                <v-hover v-slot="{ isHovering, props }">
                                    <v-card :elevation="isHovering ? 16 : 2" v-bind="props" @click="show_fact_view(vis)"
                                            :class="{ 'on-hover': isHovering }" class="pa-2">
                                        <vis_parser :vis="vis" :column="visStore.current_fact_group.column"/>
                                    </v-card>
                                </v-hover>
                                <div class="d-flex w-100 flex-wrap">
                                    <v-btn variant="tonal" class="flex-grow-1 mx-1" @click="add_vis(vis)">Add</v-btn>
                                </div>
                            </div>
                        </div>
                    </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel class="ma-1">
                    <v-expansion-panel-title><h4> Adapt </h4></v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <div class="ml-2">Change risk factor label:</div>
                        <v-text-field label="Label" v-model="visStore.current_fact_group.column.label"/>
                        <div class="ml-2 mb-2">Change options:</div>
                        <div v-for="(item,i) in visStore.current_fact_group.column.options" v-bind:key="i"
                             class="d-flex">
                            <v-text-field variant="outlined" :label="'label of: ' + item.name"
                                          v-model="visStore.current_fact_group.column.options[i].label"/>
                            <v-text-field class="px-5" type="number" label="min"
                                          v-if="visStore.current_fact_group.column.options[i].range !== undefined"
                                          v-model="visStore.current_fact_group.column.options[i].range[0]"/>
                            <v-text-field type="number" label="max"
                                          v-if="visStore.current_fact_group.column.options[i].range !== undefined"
                                          v-model="visStore.current_fact_group.column.options[i].range[1]"/>
                        </div>
                        <v-btn @click="recalculate_options" class="mt-2">Recalculate options</v-btn>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>

            <v-card-actions>
                <v-btn @click="add"> Add</v-btn>
                <v-btn @click="close">Close</v-btn>
            </v-card-actions>


        </v-card>
    </v-dialog>
</template>

<script>
import {useVisStore} from "@/stores/visStore";
import vis_parser from "@/components/visualization/vis_parser.vue";
import {useCSVStore} from "@/stores/csvStore";
import {useScoreStore} from "@/stores/scoreStore";

export default {
    name: "fact_group_view",
    components: {vis_parser},
    setup() {
        const visStore = useVisStore()
        const csvStore = useCSVStore()
        const scoreStore = useScoreStore()
        return {visStore, csvStore, scoreStore}
    },
    data() {
        return {
            display: true,
        }
    },
    watch: {
        display: function () {
            this.close()
        },
    },
    methods: {
        /**
         * shows fact view for the selected fact
         *
         * @param vis
         */
        show_fact_view(vis) {
            this.visStore.current_fact = {'vis': vis, 'column': this.visStore.current_fact_group.column}
        },
        /**
         * closes the fact group view
         */
        close() {
            this.visStore.current_fact_group = null
        },
        /**
         * adds the fact group to the dashboard
         */
        add() {
            this.visStore.add_dashboard_item(this.visStore.current_fact_group.column, this.visStore.current_fact_group.visList)
            this.close()
        },
        /**
         * recalculates the options for the risk factor
         */
        recalculate_options() {
            this.visStore.current_fact_group.column = this.csvStore.recalculate_summary_after_option_change(this.visStore.current_fact_group.column)
        },
        /**
         * removes a visualization from the fact group visList
         *
         * @param vis
         */
        remove_vis(vis) {
            this.visStore.current_fact_group.visList = this.visStore.current_fact_group.visList.filter(item => item.type !== vis.type)
            this.visStore.current_fact_group.additional_vis_list.push(vis)
        },
        /**
         * adds a visualization to the fact group visList
         *
         * @param vis
         */
        add_vis(vis) {
            this.visStore.current_fact_group.additional_vis_list = this.visStore.current_fact_group.additional_vis_list.filter(item => item.type !== vis.type)
            this.visStore.current_fact_group.visList.push(vis)
        }
    }
}
</script>

<style lang="sass" scoped>
.v-card.on-hover
  cursor: pointer

</style>