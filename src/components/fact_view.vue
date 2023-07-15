<template>
    <v-expansion-panels class="ma-3 text-blue">

        <!-- Graph -->
        <v-expansion-panel>
            <v-expansion-panel-title class="text-blue-darken-3"><h4>Visualization Type </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <v-switch v-model="has_attribute['graph']" label="Custom"/>
                <div class="d-flex">
                    <v-radio-group v-model="vis.graph"
                                   :disabled="!has_attribute['graph']">
                        <v-radio label="bar" value="bar"  v-if="has_data()"></v-radio>
                        <v-radio label="pictograph" value="pictograph" v-if="has_data()"></v-radio>
                        <v-radio label="pie" value="pie"  v-if="has_data()"></v-radio>
                        <v-radio label="multiple pies" value="multiPie"  v-if="has_data()"></v-radio>
                        <v-radio label="text" value="text"></v-radio>
                    </v-radio-group>
                    <div class="w-50">
                        <b class="ml-2" v-if="has_attribute['graph']"> Unit & Context</b>
                        <div class="ml-2 text-grey" v-else>Unit</div>
                        <v-radio-group v-model="vis.unit"
                                       :disabled="!has_attribute['graph']">
                            <v-radio label="natural frequencies" value="natural_frequencies"></v-radio>
                            <v-radio label="percent" value="percent"></v-radio>
                        </v-radio-group>
                        <v-checkbox v-model="vis.context" label="Context"
                                       :disabled="!has_attribute['graph']">
                        </v-checkbox>
                    </div>
                </div>
                <div v-if="vis.graph === 'text'" class="w-100" :disabled="!has_attribute['graph']">
                    <div>Font Size</div>
                    <v-slider v-model="vis.font_size" :disabled="!has_attribute['graph']"
                              min="0.5" max="3" step="0.1" show-ticks="always" :ticks="[0.5,1,1.5,2,2.5,3]"></v-slider>
                </div>

                <div v-if="vis.graph === 'pictograph'" class="w-100"
                     :disabled="!has_attribute['graph']">

                    <!-- icon -->
                    <h4> Pictograph </h4> <br>
                    <div class="d-flex justify-space-around w-100">
                        <div>
                            <div><b>Icons</b></div>
                            <div class="d-flex">
                                <v-text-field v-model="vis.icon"
                                              placeholder="custom"
                                              style="min-width:250px"
                                              :prepend-icon="'mdi-' + vis.icon"
                                              append-inner-icon="mdi-pencil">
                                    <template v-slot:details>
                                        <div>
                                            see <a
                                                href="https://pictogrammers.com/library/mdi/"
                                                target="_blank">here</a> for more icons
                                        </div>
                                    </template>
                                </v-text-field>
                            </div>
                            <v-slider v-model="vis.ratio" min="0" max="2"
                                      step="0.01"
                                      label="ratio" thumb-label></v-slider>
                            <div class=" mt-2">presets:</div>
                            <v-btn-toggle v-model="vis.icon" inline class="mb-5">
                                <v-btn v-for="icon in icons" v-bind:key="icon"
                                       :value="icon">
                                    <v-icon :icon="'mdi-'+icon"/>
                                </v-btn>
                            </v-btn-toggle>

                        </div>

                        <v-divider vertical></v-divider>
                        <!-- grid -->
                        <div>
                            <div><b>Grid</b></div>
                            <v-text-field
                                    type="number" label="#rows" style="min-width:200px"
                                    v-model="vis.grid[0]"/>
                            <v-text-field
                                    type="number" label="#columns" style="min-width:200px"
                                    v-model="vis.grid[1]"/>
                        </div>
                    </div>
                </div>

                <v-btn @click="set_default_graph_settings" variant="tonal"
                       :disabled="!has_attribute['graph']">
                    set as default for {{ vis.type }}
                    Graphs
                </v-btn>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Color -->
        <v-expansion-panel v-if="get_default('color') !== undefined">
            <v-expansion-panel-title class="text-blue-darken-3"><h4>Color </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <div class="d-flex">
                    <div>
                        <v-switch v-model="has_attribute['color']" label="Custom"/>
                        <v-radio-group v-model="vis.color"
                                       :disabled="!has_attribute['color']">
                            <v-radio v-for="(el,i) in dashboardStore.default_colors.colors" v-bind:key="el"
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
                                    <color-dialog v-if="vis.color !== '$color'"
                                                  :color="get_color()"
                                                  @update="vis.color = $event; custom_color= $event"></color-dialog>
                                </template>
                            </v-radio>
                        </v-radio-group>
                        <v-btn @click="makeDefault('color')" variant="tonal"
                               :disabled="!has_attribute['color']"> set as default for
                            {{ vis.type }} Graphs
                        </v-btn>
                    </div>
                </div>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Background -->
        <v-expansion-panel v-if="get_default('background') !== undefined">
            <v-expansion-panel-title class="text-blue-darken-3"><h4>Background </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <v-switch v-model="has_attribute['background']" label="Custom"/>
                <v-radio-group v-model="vis.background"
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
                                      @update="background_custom.color = $event; vis.background = $event"></color-dialog>
                    </v-radio>

                </v-radio-group>
                <v-btn @click="makeDefault('background')" :disabled="!has_attribute['background']"
                       variant="tonal"> set as default for
                    {{ vis.type }} Graphs
                </v-btn>

            </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Title -->
        <v-expansion-panel v-if="get_default('title') !== undefined">
            <v-expansion-panel-title class="text-blue-darken-3"><h4>Title </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <v-switch v-model="has_attribute['title']" label="Custom"/>
                <text_input :text="vis.title" :default="get_default('title')"
                            @change="vis.title = $event" :color="get_color()"
                            :disabled="!has_attribute['title']"/>
                <v-btn @click="makeDefault('title')" :disabled="!has_attribute['title']"
                       variant="tonal">
                    set as default for {{ vis.type }} Graphs
                </v-btn>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Axis -->
        <v-expansion-panel v-if="get_default('axis') !== undefined">
            <v-expansion-panel-title class="text-blue-darken-3"><h4>Axis </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <v-switch v-model="has_attribute['axis']" label="Custom"/>
                <text_input :text="vis.axis" :default="get_default('axis')"
                            @change="vis.axis = $event" :color="get_color()"
                            :disabled="!has_attribute['axis']"/>
                <v-btn @click="makeDefault('axis')" :disabled="!has_attribute['axis']"
                       variant="tonal">
                    set as default for {{ vis.type }} Graphs
                </v-btn>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Annotation -->
        <v-expansion-panel v-if="annotation_list.length !== 0">
            <v-expansion-panel-title class="text-blue-darken-3"><h4>Annotation </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <v-switch v-model="has_attribute['annotation']" label="Custom"/>
                <v-radio-group v-model="vis.annotation" :disabled="!has_attribute['annotation']">
                    <v-radio label="no annotation" value="None"></v-radio>
                    <v-radio
                            v-for="el in annotation_list"
                            v-bind:key="el"
                            :value="el">
                        <template v-slot:label>
                            <div class="w-100">
                                <span v-for="span in helperStore.parse_text(el.text, dashboardStore.current_fact_group.column)"
                                      v-bind:key="span" :style="'color:' + span.color">
                                    {{ span.text }}
                                </span>
                            </div>
                        </template>
                    </v-radio>
                </v-radio-group>
                <div v-if="vis.annotation !== undefined && vis.annotation !== 'None' &&
                                    vis.annotation !== null">
                    <text_input :text="vis.annotation.text"
                                @change="vis.annotation.text = $event"
                                :color="get_color()"/>
                </div>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Text -->
        <v-expansion-panel v-if="get_default('graph') === 'text' || vis.graph === 'text'">
            <v-expansion-panel-title class="text-blue-darken-3"><h4>Text </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <v-switch v-model="has_attribute['text']" label="Custom"/>
                <text_input :text="vis.text" :default="[]"
                            @change="vis.text = $event" :color="get_color()"
                            :disabled="!has_attribute['text']"/>
                <v-btn @click="makeDefault('text')" :disabled="!has_attribute['text']"
                       variant="tonal">
                    set as default for {{ vis.type }} Graphs
                </v-btn>
            </v-expansion-panel-text>
        </v-expansion-panel>

    </v-expansion-panels>
</template>

<script>
import {useDashboardStore} from "@/stores/dashboardStore";
import text_input from "@/components/helpers/text-input.vue";
import {useDataStore} from "@/stores/dataStore";
import ColorDialog from "@/components/helpers/color-dialog.vue";
import {useAnnotationStore} from "@/stores/annotationStore";
import {useHelperStore} from "@/stores/helperStore";

export default {
    name: "fact_view",
    components: {ColorDialog, text_input},
    setup() {
        const dashboardStore = useDashboardStore()
        const dataStore = useDataStore()
        const annotationStore = useAnnotationStore()
        const helperStore = useHelperStore()
        return {dashboardStore, dataStore, annotationStore, helperStore}
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
            icons: ['circle', 'human-male', 'account', 'bed', 'home'],
            annotation_list: []
        }
    },
    watch: {
        display: function () {
            this.close()
        },
        has_attribute: {
            handler: function (val) {
                Object.keys(val).forEach(attr => {
                    if (val[attr]) {
                        if (this.vis[attr] === undefined) {
                            // when the attribute is not defined, set it to the default value
                            this.vis[attr] = JSON.parse(JSON.stringify(this.get_default(attr)))
                            if (attr === "graph") {
                                this.vis["unit"] = this.get_default("unit")
                                this.vis["context"] = this.get_default("context")
                            }
                            if (attr === "graph" && this.get_default(attr) === "pictograph") {
                                this.vis["grid"] = JSON.parse(JSON.stringify(this.get_default("grid")))
                                this.vis["icon"] = this.get_default("icon")
                                this.vis["ratio"] = this.get_default("ratio")
                            }

                            if (attr === "text") {
                                let exp = this.dashboardStore.current_fact_group_exports[this.dashboardStore.current_fact_index]
                                if (exp.type === "text") {
                                    this.vis["text"] = exp.item
                                }
                            }

                        }
                    } else {
                        this.vis[attr] = undefined
                        if (attr === "graph") {
                            ['font_size', 'grid', 'icon', 'ratio', 'graph', 'unit', 'context'].forEach(key => {
                                this.vis[key] = undefined
                            })
                        }
                    }
                })
            },
            deep: true
        },
        vis: function () {
            if (this.vis !== null) {
                this.updateView()
            }
        }
    },
    computed: {
        vis() {
            if (this.dashboardStore.current_fact_index === null) {
                return null
            } else {
                return this.dashboardStore.current_fact_group.visList[this.dashboardStore.current_fact_index]
            }

        },
    },
    created() {
        if (this.dashboardStore.current_fact_index !== null) {
            this.updateView()
        }
    },
    methods: {
        updateView() {
            if (this.vis !== null && this.vis !== undefined) {
                let attributes = ["graph", "color", "background", "title", "axis", "annotation", "text"]
                attributes.forEach(key => {
                    this.has_attribute[key] = this.vis[key] !== undefined
                })
                this.annotation_list = this.annotationStore.compute_annotations(this.dashboardStore.current_fact_group.column, this.vis.type)
            }
        },
        /**
         * closes the fact view
         */
        close() {
            this.dashboardStore.current_fact_index = null
        },
        /**
         * sets the current attribute as default title for the current visualization type
         */
        makeDefault(attribute) {
            if (this.vis[attribute] !== undefined) {
                this.dashboardStore.default_settings[this.vis.type][attribute] = this.vis[attribute]
            }
            this.vis[attribute] = undefined
            this.has_attribute[attribute] = false
        },
        get_default(attribute) {
            if (attribute === "annotation") {
                return this.annotation_list[0]
            }

            if (this.vis === null || this.vis === undefined) {
                return null
            }

            return this.dashboardStore.default_settings[this.vis.type][attribute]
        },
        set_default_graph_settings() {
            if (this.vis.graph === 'font size') {
                this.makeDefault('font_size')
            }

            if (this.vis.graph === 'pictograph') {
                this.makeDefault('grid')
                this.makeDefault('icon')
                this.makeDefault('ratio')
            }
            this.makeDefault('graph')
            this.makeDefault('unit')
            this.makeDefault('context')
        },
        /**
         * returns the color of the current visualization
         * @returns {string}
         */
        get_color() {
            if (this.vis.color) {
                return this.dashboardStore.get_color(this.vis.color)
            } else {
                return this.dashboardStore.get_color(this.dashboardStore.default_settings[this.vis.type].color)
            }
        },
        has_data() {
            return this.vis.data || this.vis.data_map || this.get_default("data") || this.get_default("data_map")
        }
    }
}
</script>

<style scoped>

</style>