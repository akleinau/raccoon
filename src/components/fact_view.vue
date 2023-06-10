<template>
    <v-expansion-panels class="ma-3 text-blue">

        <!-- Graph -->
        <v-expansion-panel>
            <v-expansion-panel-title class="text-blue-darken-3"><h4>Visualization Type </h4></v-expansion-panel-title>
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
                <div v-if="visStore.current_fact.vis.graph === 'pictograph'" class="w-100"
                     :disabled="!has_attribute['graph']">

                    <!-- icon -->
                    <h4> Pictograph </h4> <br>
                    <div class="d-flex justify-space-around w-100">
                        <div>
                            <div><b>Icons</b></div>
                            <div class="d-flex">
                                <v-text-field v-model="visStore.current_fact.vis.icon"
                                              placeholder="custom"
                                              style="min-width:250px"
                                              :prepend-icon="'mdi-' + visStore.current_fact.vis.icon"
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
                            <v-slider v-model="visStore.current_fact.vis.ratio" min="0" max="2"
                                      step="0.01"
                                      label="ratio" thumb-label></v-slider>
                            <div class=" mt-2">presets:</div>
                            <v-btn-toggle v-model="visStore.current_fact.vis.icon" inline class="mb-5">
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
                                    v-model="visStore.current_fact.vis.grid[0]"/>
                            <v-text-field
                                    type="number" label="#columns" style="min-width:200px"
                                    v-model="visStore.current_fact.vis.grid[1]"/>
                        </div>
                    </div>
                </div>

                <v-btn @click="set_default_graph_settings" variant="tonal"
                       :disabled="!has_attribute['graph']">
                    set as default for {{ visStore.current_fact.vis.type }}
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
                    </div>
                </div>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Background -->
        <v-expansion-panel v-if="get_default('background') !== undefined">
            <v-expansion-panel-title class="text-blue-darken-3"><h4>Background </h4></v-expansion-panel-title>
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
        <v-expansion-panel v-if="get_default('title') !== undefined">
            <v-expansion-panel-title class="text-blue-darken-3"><h4>Title </h4></v-expansion-panel-title>
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
        <v-expansion-panel v-if="get_default('axis') !== undefined">
            <v-expansion-panel-title class="text-blue-darken-3"><h4>Axis </h4></v-expansion-panel-title>
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
        <v-expansion-panel v-if="annotation_list.length !== 0">
            <v-expansion-panel-title class="text-blue-darken-3"><h4>Annotation </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <v-switch v-model="has_attribute['annotation']" label="Custom"/>
                <div v-if="visStore.current_fact.vis.annotation !== undefined &&
                                    visStore.current_fact.vis.annotation !== null">
                    <text_input v-for="(el,i) in visStore.current_fact.vis.annotation.text" :key="i"
                                :text="el" default=""
                                @change="visStore.current_fact.vis.annotation.text[i] = $event"
                                :color="get_color()"/>
                </div>
                <v-radio-group v-model="visStore.current_fact.vis.annotation" :disabled="!has_attribute['annotation']">
                    <v-radio label="no annotation" value="None"></v-radio>
                    <v-radio
                            v-for="el in annotation_list"
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

        <!-- Text -->
        <v-expansion-panel>
            <v-expansion-panel-title class="text-blue-darken-3"><h4>Text </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <v-switch v-model="has_attribute['text']" label="Custom"/>
                <text_input :text="visStore.current_fact.vis.text" :default="[]"
                            @change="visStore.current_fact.vis.text = $event" :color="get_color()"
                            :disabled="!has_attribute['text']"/>
                <v-btn @click="makeDefault('text')" :disabled="!has_attribute['text']"
                       variant="tonal">
                    set as default for {{ visStore.current_fact.vis.type }} Graphs
                </v-btn>
            </v-expansion-panel-text>
        </v-expansion-panel>

    </v-expansion-panels>
</template>

<script>
import {useVisStore} from "@/stores/visStore";
import text_input from "@/components/helpers/text-input.vue";
import {useCSVStore} from "@/stores/csvStore";
import ColorDialog from "@/components/helpers/color-dialog.vue";
import {useAnnotationStore} from "@/stores/annotationStore";

export default {
    name: "fact_view",
    components: {ColorDialog, text_input},
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
                        if (this.visStore.current_fact.vis[attr] === undefined) {
                            // when the attribute is not defined, set it to the default value
                            this.visStore.current_fact.vis[attr] = this.get_default(attr)
                            if (attr === "graph") {
                                this.visStore.current_fact.vis["detailLevel"] = this.get_default("detailLevel")
                            }
                            if (attr === "graph" && this.get_default(attr) === "pictograph") {
                                this.visStore.current_fact.vis["grid"] = JSON.parse(JSON.stringify(this.get_default("grid")))
                                this.visStore.current_fact.vis["icon"] = this.get_default("icon")
                                this.visStore.current_fact.vis["ratio"] = this.get_default("ratio")
                            }
                        }
                    } else {
                        this.visStore.current_fact.vis[attr] = undefined
                    }
                })
            },
            deep: true
        },
        current_fact: function () {
            if (this.visStore.current_fact !== null) {
                this.updateView()
            }
        }
    },
    computed: {
        current_fact() {
            return this.visStore.current_fact
        },
    },
    created() {
        this.updateView()
    },
    methods: {
        updateView() {
            let attributes = ["graph", "color", "background", "title", "axis", "annotation", "text"]
            attributes.forEach(key => {
                this.has_attribute[key] = this.visStore.current_fact.vis[key] !== undefined
            })
            this.annotation_list = this.annotationStore.compute_annotations(this.visStore.current_fact.column, this.visStore.current_fact.vis.type)
        },
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
            if (attribute === "annotation") {
                return this.annotation_list[0]
            }

            return this.visStore.default_settings[this.visStore.current_fact.vis.type][attribute]
        },
        set_default_graph_settings() {
            if (this.visStore.current_fact.vis.graph === 'pictograph') {
                this.makeDefault('grid')
                this.makeDefault('icon')
                this.makeDefault('ratio')
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