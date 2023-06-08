<template>
    <v-dialog v-model="display" height="85%" width="75%">
        <v-card class="mx-auto w-100 h-100">

            <v-card-title>
                Fact View: {{ visStore.current_fact.column['label'] }}
            </v-card-title>

            <div class="d-flex justify-end w-100">
                <div class="flex-shrink-1">
                    <!-- visualization -->
                    <vis_parser :vis="visStore.current_fact.vis" :column="visStore.current_fact.column" :width="400"/>
                </div>
                <div class="pr-5 flex-grow-1">
                    <!-- tabs -->
                    <v-expansion-panels class="ma-3">

                        <!-- Graph -->
                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Change Visualization Type </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-switch v-model="has_attribute['graph']" label="Custom"/>
                                <div class="d-flex">
                                    <v-radio-group v-model="visStore.current_fact.vis.graph"
                                                   :disabled="!has_attribute['graph']">
                                        <v-radio label="default" :value="null"></v-radio>
                                        <v-radio label="bar" value="bar"></v-radio>
                                        <v-radio label="pictograph" value="pictograph"></v-radio>
                                        <v-radio label="pie" value="pie"></v-radio>
                                        <v-radio label="multiple pies" value="multiPie"></v-radio>
                                        <v-radio label="text" value="text"></v-radio>
                                    </v-radio-group>
                                    <div class="w-50">
                                        <b class="ml-2" v-if="has_attribute['graph']"> Detail Level</b>
                                        <div class="ml-2 text-grey" v-else>Detail Level</div>
                                        <v-radio-group v-model="visStore.current_fact.vis.detailLevel"
                                                       :disabled="!has_attribute['graph']">
                                            <v-radio label="nominator" value="nominator"></v-radio>
                                            <v-radio label="denominator" value="denominator"></v-radio>
                                            <v-radio label="percent" value="percent"></v-radio>
                                        </v-radio-group>
                                    </div>
                                </div>
                                <div v-if="visStore.current_fact.vis.graph === 'pictograph'" class="w-50"
                                         :disabled="!has_attribute['graph']">

                                        <!-- icon -->
                                        <b> Pictograph </b>
                                        <v-select v-model="visStore.current_fact.vis.icon"
                                                  :items="icons">
                                            <template v-slot:selection="{ item }">
                                                <v-icon :icon="item.value" class="mr-2"/>
                                                {{ item.value }}
                                            </template>
                                            <template v-slot:item="{ item }">
                                                <div>
                                                    <v-btn variant="text" class="w-100 justify-start"
                                                        @click="visStore.current_fact.vis.icon = item.value">
                                                        <v-icon :icon="item.value" class="mr-2"/>
                                                        {{ item.value }}
                                                    </v-btn>
                                                </div>
                                            </template>
                                        </v-select>

                                        <!-- grid -->
                                        <v-text-field
                                                type="number" label="#rows"
                                                v-model="visStore.current_fact.vis.grid[0]"/>
                                        <v-text-field
                                                type="number" label="#columns"
                                                v-model="visStore.current_fact.vis.grid[1]"/>
                                    </div>

                                <v-btn @click="set_default_graph_settings" variant="tonal"
                                       :disabled="!has_attribute['graph']">
                                    set as default for {{ visStore.current_fact.vis.type }}
                                    Graphs
                                </v-btn>
                            </v-expansion-panel-text>
                        </v-expansion-panel>

                        <!-- Color -->
                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Change Color </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-switch v-model="has_attribute['color']" label="Custom"/>
                                <v-radio-group v-model="visStore.current_fact.vis.color"
                                               :disabled="!has_attribute['color']">
                                    <v-radio v-for="(el,i) in visStore.default_colors.colors" v-bind:key="el"
                                             :value="i">
                                        <template v-slot:label>
                                            <v-icon :style="'color:' + el">
                                                mdi-circle
                                            </v-icon>
                                        </template>
                                    </v-radio>

                                    <v-radio class="d-flex align-center" :value="custom_color">
                                        <template v-slot:label>
                                            <v-icon :style="'color:' + custom_color" class="mr-2">
                                                mdi-circle
                                            </v-icon>
                                            custom
                                            <v-icon class="ml-2">mdi-pencil</v-icon>
                                            <color-dialog v-if="visStore.current_fact.vis.color !== '$color'"
                                                          :color="get_color()"
                                                          @update="visStore.current_fact.vis.color = $event; custom_color= $event"></color-dialog>
                                        </template>
                                    </v-radio>
                                </v-radio-group>
                                <v-btn @click="makeDefault('color')" variant="tonal"
                                       :disabled="!has_attribute['color']"> set as default for
                                    {{ visStore.current_fact.vis.type }} Graphs
                                </v-btn>
                            </v-expansion-panel-text>
                        </v-expansion-panel>

                        <!-- Background -->
                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Change Background </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-switch v-model="has_attribute['background']" label="Custom"/>
                                <v-radio-group v-model="visStore.current_fact.vis.background"
                                               class="ml-5" :disabled="!has_attribute['background']">
                                    <v-radio label="auto" :value="background_auto">
                                        <template v-slot:label>
                                            Auto
                                        </template>
                                    </v-radio>
                                    <v-radio v-for="item in this.background" :key="item" :value="item">
                                        <template v-slot:label>
                                            <div class="mr-2"
                                                 :style="'background:' + item.color + '; border: 1px solid ' + item.stroke + '; width: 100px; height: 30px'"/>
                                        </template>
                                    </v-radio>
                                    <v-radio label="custom" :value="background_custom">
                                        <template v-slot:label>
                                            <div class="mr-2"
                                                 :style="'background:' + background_custom.color + '; border: 1px solid ' + background_custom.stroke + '; width: 100px; height: 30px'"/>
                                            <v-icon class="ml-2">mdi-pencil</v-icon>
                                        </template>
                                        <color-dialog :color="background_custom.color"
                                                      @update="background_custom.color = $event; visStore.current_fact.vis.background = $event"></color-dialog>
                                    </v-radio>

                                </v-radio-group>
                                <v-btn @click="makeDefault('background')" :disabled="!has_attribute['background']"
                                       variant="tonal"> set as default for
                                    {{ visStore.current_fact.vis.type }} Graphs
                                </v-btn>

                            </v-expansion-panel-text>
                        </v-expansion-panel>

                        <!-- Title -->
                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Change Title </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-switch v-model="has_attribute['title']" label="Custom"/>
                                <text_input :text="visStore.current_fact.vis.title" :default="get_default('title')"
                                            @change="visStore.current_fact.vis.title = $event" :color="get_color()"
                                            :disabled="!has_attribute['title']"/>
                                <v-btn @click="makeDefault('title')" :disabled="!has_attribute['title']"
                                       variant="tonal">
                                    set as default for {{ visStore.current_fact.vis.type }} Graphs
                                </v-btn>
                            </v-expansion-panel-text>
                        </v-expansion-panel>

                        <!-- Axis -->
                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Change Axis </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-switch v-model="has_attribute['axis']" label="Custom"/>
                                <text_input :text="visStore.current_fact.vis.axis" :default="get_default('axis')"
                                            @change="visStore.current_fact.vis.axis = $event" :color="get_color()"
                                            :disabled="!has_attribute['axis']"/>
                                <v-btn @click="makeDefault('axis')" :disabled="!has_attribute['axis']"
                                       variant="tonal">
                                    set as default for {{ visStore.current_fact.vis.type }} Graphs
                                </v-btn>
                            </v-expansion-panel-text>
                        </v-expansion-panel>

                        <!-- Annotation -->
                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Change Annotation </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <div v-if="visStore.current_fact.vis.annotation !== undefined &&
                                    visStore.current_fact.vis.annotation !== null">
                                    <text_input v-for="(el,i) in visStore.current_fact.vis.annotation.text" :key="i"
                                                :text="el" default=""
                                                @change="visStore.current_fact.vis.annotation.text[i] = $event"
                                                :color="get_color()"/>
                                </div>
                                <v-radio-group v-model="visStore.current_fact.vis.annotation">
                                    <v-radio label="default" :value="null"></v-radio>
                                    <v-radio label="no annotation" value="None"></v-radio>
                                    <v-radio
                                            v-for="el in annotationStore.compute_annotations(visStore.current_fact.column, visStore.current_fact.vis.type)"
                                            v-bind:key="el"
                                            :value="el">
                                        <template v-slot:label>
                                            <div class="w-100">
                                                <span v-for="text in el.text" v-bind:key="text">
                                                    <span v-for="span in text" v-bind:key="span"
                                                          :style="'color:' + span.color">
                                                        {{ span.text }}
                                                    </span>
                                                </span>
                                            </div>
                                        </template>
                                    </v-radio>
                                </v-radio-group>
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
import ColorDialog from "@/components/helpers/color-dialog.vue";
import {useAnnotationStore} from "@/stores/annotationStore";

export default {
    name: "fact_view",
    components: {ColorDialog, vis_parser, text_input},
    setup() {
        const visStore = useVisStore()
        const csvStore = useCSVStore()
        const annotationStore = useAnnotationStore()
        return {visStore, csvStore, annotationStore}
    },
    data() {
        return {
            display: true,
            custom_color: '#000000',
            has_attribute: {},
            background: [{color: "Gainsboro", stroke: "None"}, {color: "#D3D9E6", stroke: "None"}, {
                color: "white", stroke: "darkgray"
            }],
            background_custom: {color: "#efe7de", stroke: "None"},
            background_auto: {color: "auto", stroke: "None"},
            icons: ['mdi-circle', 'mdi-human', 'mdi-human-male', 'mdi-human-child', 'mdi-account']
        }
    },
    watch: {
        display: function () {
            this.close()
        },
        has_attribute: {
            handler: function (val) {
                let type = this.visStore.current_fact.vis.type

                Object.keys(val).forEach(attr => {
                    if (val[attr]) {
                        if (this.visStore.current_fact.vis[attr] === undefined) {
                            // when the attribute is not defined, set it to the default value
                            this.visStore.current_fact.vis[attr] = this.visStore.default_settings[type][attr]
                            if (attr === "graph" && this.visStore.default_settings[type][attr] === "pictograph") {
                                this.visStore.current_fact.vis["grid"] = JSON.parse(JSON.stringify(this.visStore.default_settings[type]["grid"]))
                                this.visStore.current_fact.vis["icon"] = this.visStore.default_settings[type]["icon"]
                            }
                        }
                    } else {
                        this.visStore.current_fact.vis[attr] = undefined
                    }
                })
            },
            deep: true
        },
    },
    created() {
        let attributes = ["graph", "color", "background", "title", "axis"]
        attributes.forEach(key => {
            this.has_attribute[key] = this.visStore.current_fact.vis[key] !== undefined
        })
    },
    methods: {
        /**
         * closes the fact view
         */
        close() {
            this.visStore.current_fact = null
        },
        /**
         * sets the current attribute as default title for the current visualization type
         */
        makeDefault(attribute) {
            if (this.visStore.current_fact.vis[attribute] !== undefined) {
                this.visStore.default_settings[this.visStore.current_fact.vis.type][attribute] = this.visStore.current_fact.vis[attribute]
            }
            this.visStore.current_fact.vis[attribute] = undefined
            this.has_attribute[attribute] = false
        },
        get_default(attribute) {
            return this.visStore.default_settings[this.visStore.current_fact.vis.type][attribute]
        },
        set_default_graph_settings() {
            if (this.visStore.current_fact.vis.graph === 'pictograph') {
                this.makeDefault('grid')
                this.makeDefault('icon')
                console.log(this.visStore.default_settings[this.visStore.current_fact.vis.type]['icon'])
            }
            this.makeDefault('graph')
            this.makeDefault('detailLevel')
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