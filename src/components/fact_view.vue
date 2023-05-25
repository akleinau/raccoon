<template>
    <v-dialog v-model="display" height="85%" width="70%">
        <v-card class="mx-auto w-100 h-100">

            <v-card-title>
                Fact View: {{ visStore.current_fact.column['label'] }}
            </v-card-title>

            <div class="d-flex justify-space-evenly w-100">
                <div>
                    <!-- visualization -->
                    <vis_parser :vis="visStore.current_fact.vis" :column="visStore.current_fact.column" :width="500"/>
                </div>
                <div class="w-50 pr-5">
                    <!-- tabs -->
                    <v-expansion-panels class="ma-3">
                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Change Visualization Type </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <div class="d-flex">
                                    <v-radio-group v-model="visStore.current_fact.vis.graph">
                                        <v-radio label="bar" value="bar"></v-radio>
                                        <v-radio label="pictograph" value="pictograph" @click="add_grid"></v-radio>
                                        <v-radio label="pie" value="pie"></v-radio>
                                        <v-radio label="multiple pies" value="multiPie"></v-radio>
                                        <v-radio label="text" value="text"></v-radio>
                                        <v-radio label="default" value=""></v-radio>
                                    </v-radio-group>
                                    <div v-if="visStore.current_fact.vis.graph === 'pictograph'" class="w-50">
                                        <v-text-field
                                                type="number" label="#rows"
                                                v-model="visStore.current_fact.vis.grid[0]"/>
                                        <v-text-field
                                                type="number" label="#columns"
                                                v-model="visStore.current_fact.vis.grid[1]"/>
                                    </div>
                                    <div v-if="visStore.current_fact.vis.graph === 'text'" class="w-50">
                                        <v-radio-group v-model="visStore.current_fact.vis.detailLevel">
                                            <v-radio label="nominator" value="nominator"></v-radio>
                                            <v-radio label="denominator" value="denominator"></v-radio>
                                            <v-radio label="percent" value="percent"></v-radio>
                                        </v-radio-group>
                                    </div>
                                </div>
                                <v-btn @click="set_default_graph_settings"> set as default for {{
                                    visStore.current_fact.vis.type
                                    }}
                                    Graphs
                                </v-btn>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Change Color </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-text-field label="Color" v-model="visStore.current_fact.vis.color"/>
                                <v-btn @click="makeDefault('color')"> set as default for {{
                                    visStore.current_fact.vis.type
                                    }}
                                    Graphs
                                </v-btn>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Change Title </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <text_input :text="visStore.current_fact.vis.title" :default="get_default('title')"
                                @change="visStore.current_fact.vis.title = $event" :color="get_color()"/>
                                <v-btn @click="makeDefault('title')"> set as default for {{
                                    visStore.current_fact.vis.type
                                    }}
                                    Graphs
                                </v-btn>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Change Axis </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <text_input :text="visStore.current_fact.vis.axis" :default="get_default('axis')"
                                @change="visStore.current_fact.vis.axis = $event" :color="get_color()"/>
                                <v-btn @click="makeDefault('axis')"> set as default for {{
                                    visStore.current_fact.vis.type
                                    }}
                                    Graphs
                                </v-btn>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>
            </div>

            <!-- actions -->
            <div class="d-flex flex-column-reverse h-100">
                <v-card-actions class="w-100 bg-grey-lighten-2 pa-5">
                    <div class="d-flex">
                        <v-btn variant="elevated" class="px-9" @click="close">Close</v-btn>
                        <v-btn variant="elevated" prepend-icon="mdi-plus"
                               v-if="!visStore.current_fact_group.visList.includes(visStore.current_fact.vis)"
                               @click="add_vis">
                            Add fact
                        </v-btn>
                        <v-btn variant="elevated" v-else @click="remove_vis" prepend-icon="mdi-minus">
                            Remove fact
                        </v-btn>
                    </div>
                </v-card-actions>
            </div>
        </v-card>
    </v-dialog>
</template>

<script>
import {useVisStore} from "@/stores/visStore";
import vis_parser from "@/components/visualization/vis_parser.vue";
import text_input from "@/components/helpers/text-input.vue";
import {useCSVStore} from "@/stores/csvStore";

export default {
    name: "fact_view",
    components: {vis_parser, text_input},
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
        makeDefault(attribute) {
            this.visStore.default_settings[this.visStore.current_fact.vis.type][attribute] = this.visStore.current_fact.vis[attribute]
        },
        get_default(attribute) {
            return this.visStore.default_settings[this.visStore.current_fact.vis.type][attribute]
        },
        set_default_graph_settings() {
            this.makeDefault('graph')
            if (this.visStore.current_fact.vis.graph === 'pictograph') {
                this.makeDefault('grid')
            }
        },
        /**
         * removes the current visualization from the current fact group
         */
        remove_vis() {
            let vis = this.visStore.current_fact.vis
            this.visStore.current_fact_group.visList = this.visStore.current_fact_group.visList.filter(item => item.type !== vis.type)
            this.visStore.current_fact_group.additional_vis_list.push(vis)
            this.close()
        },
        /**
         * adds the current visualization to the current fact group
         */
        add_vis() {
            let vis = this.visStore.current_fact.vis
            this.visStore.current_fact_group.additional_vis_list = this.visStore.current_fact_group.additional_vis_list.filter(item => item.type !== vis.type)
            this.visStore.current_fact_group.visList.push(vis)
        },
        add_grid() {
            if (!this.visStore.current_fact.vis.grid) {
                this.visStore.current_fact.vis.grid = this.visStore.default_settings[this.visStore.current_fact.vis.type].grid
            }
        },
        get_color() {
            if (this.visStore.current_fact.vis.color) {
                return this.visStore.get_color(this.visStore.current_fact.vis.color)
            } else {
                return this.visStore.get_color(this.visStore.default_settings[this.visStore.current_fact.vis.type].color)
            }
        }
    }
}
</script>

<style scoped>

</style>