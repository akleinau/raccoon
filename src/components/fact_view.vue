<template>
    <v-dialog v-model="display">
        <v-card title="Fact View" class="flex mx-auto w-75">
            <vis_parser :vis="visStore.current_fact.vis" :column="visStore.current_fact.column"/>

            <v-expansion-panels class="ma-3">
                <v-expansion-panel>
                    <v-expansion-panel-title><h4> Change Visualization Type </h4></v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <v-radio-group v-model="visStore.current_fact.vis.graph">
                            <v-radio label="bar" value="bar"></v-radio>
                            <v-radio label="pictograph" value="pictograph"></v-radio>
                            <v-radio label="default" value=""></v-radio>
                        </v-radio-group>
                    </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel>
                    <v-expansion-panel-title><h4> Change Color </h4></v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <v-text-field label="Color" v-model="visStore.current_fact.vis.color"/>
                        <v-btn @click="makeDefault_color"> set as default for {{ visStore.current_fact.vis.type }}
                            Graphs
                        </v-btn>
                    </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel>
                    <v-expansion-panel-title><h4> Change Title </h4></v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <v-text-field label="Title" v-model="visStore.current_fact.vis.title"/>
                        <v-btn @click="makeDefault_title"> set as default for {{ visStore.current_fact.vis.type }}
                            Graphs
                        </v-btn>
                    </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel>
                    <v-expansion-panel-title><h4> Change Option Labels </h4></v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <div class="pa-2">
                            <v-icon icon="mdi-information"/>
                            labels will be synced across all facts in the same fact group.
                        </div>
                        <div class="ml-2">Change risk factor label:</div>
                        <v-text-field label="Label" v-model="visStore.current_fact.column.label"/>
                        <div class="ml-2 mb-2">Change options:</div>
                        <div v-for="(item,i) in visStore.current_fact.column.options" v-bind:key="i"
                             class="d-flex">
                            <v-text-field variant="outlined" :label="'label of: ' + item.name"
                                          v-model="visStore.current_fact.column.options[i].label"/>
                            <v-text-field class="px-5" type="number" label="min"
                                          v-model="visStore.current_fact.column.options[i].range[0]"/>
                            <v-text-field type="number" label="max"
                                          v-model="visStore.current_fact.column.options[i].range[1]"/>
                        </div>
                        <v-btn @click="recalculate_options" class="mt-2">Recalculate options</v-btn>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>

            <v-card-actions>
                <v-btn v-if="!visStore.current_fact_group.visList.includes(visStore.current_fact.vis)" @click="add_vis">Add
                    fact
                </v-btn>
                <v-btn v-else @click="remove_vis">Remove fact</v-btn>
                <v-btn @click="close">Close</v-btn>
            </v-card-actions>

        </v-card>
    </v-dialog>
</template>

<script>
import {useVisStore} from "@/stores/visStore";
import vis_parser from "@/components/visualization/vis_parser.vue";
import {useCSVStore} from "@/stores/csvStore";

export default {
    name: "fact_view",
    components: {vis_parser},
    setup() {
        const visStore = useVisStore()
        const csvStore = useCSVStore()
        return {visStore, csvStore}
    },
    data() {
        return {
            display: true
        }
    },
    watch: {
        display: function () {
            this.close()
        }
    },
    methods: {
        /**
         * closes the fact view
         */
        close() {
            this.visStore.current_fact = null
        },
        /**
         * sets the current title as default title for the current visualization type
         */
        makeDefault_title() {
            this.visStore.default_settings[this.visStore.current_fact.vis.type].title = this.visStore.current_fact.vis.title
        },
        /**
         * sets the current color as default color for the current visualization type
         */
        makeDefault_color() {
            this.visStore.default_settings[this.visStore.current_fact.vis.type].color = this.visStore.current_fact.vis.color
        },
        /**
         * recalculates the options for the risk factor
         */
        recalculate_options() {
            this.visStore.current_fact.column = this.csvStore.recalculate_summary_after_option_change(this.visStore.current_fact.column)
        },
        remove_vis() {
            let vis = this.visStore.current_fact.vis
            this.visStore.current_fact_group.visList = this.visStore.current_fact_group.visList.filter(item => item.type !== vis.type)
            this.visStore.current_fact_group.additional_vis_list.push(vis)
        },
        add_vis() {
            let vis = this.visStore.current_fact.vis
            this.visStore.current_fact_group.additional_vis_list = this.visStore.current_fact_group.additional_vis_list.filter(item => item.type !== vis.type)
            this.visStore.current_fact_group.visList.push(vis)
        }
    }
}
</script>

<style scoped>

</style>