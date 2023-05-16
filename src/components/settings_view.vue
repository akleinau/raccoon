<template>
  <!-- Choose Visualizations -->
    <v-expansion-panels class="ma-3 w-50">
        <v-expansion-panel>
            <v-expansion-panel-title><h4> Change Color </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <div class="d-flex">
                    <!-- Color Scheme -->
                    <div>
                        <v-radio-group v-model="visStore.default_colors.colors" label="Colors">
                            <v-radio v-for="colorList in this.colors" :key="colorList" :value="colorList">
                                <template v-slot:label>
                                    <div v-for="(color,i) in colorList" :key="i">
                                        <v-icon :style="'color:' + color">mdi-circle</v-icon>
                                        <color-dialog :color="color"
                                                      @update="colorList[i] = $event; visStore.default_colors.colors=colorList; color=$event"></color-dialog>
                                    </div>
                                </template>
                            </v-radio>
                        </v-radio-group>
                        <v-btn variant="tonal" class="ml-2 mt-0" @click="add_color_scheme">Add...</v-btn>
                    </div>

                    <!-- Background -->
                    <v-radio-group v-model="visStore.default_colors.background" label="Background">
                        <v-radio v-for="color in this.background" :key="color" :value="color">
                            <template v-slot:label>
                                <v-icon class="mr-2" :style="'color:' + color">mdi-circle</v-icon>
                                {{ color }}
                            </template>
                        </v-radio>
                        <v-radio label="custom" :value="background_custom">
                            <template v-slot:label>
                                <v-icon class="mr-2" :style="'color:' + background_custom">mdi-circle</v-icon>
                                custom ({{ background_custom }})
                                <v-icon class="ml-2">mdi-pencil</v-icon>
                            </template>
                            <color-dialog :color="background_custom"
                                          @update="background_custom = $event; visStore.default_colors.background = $event"></color-dialog>
                        </v-radio>

                    </v-radio-group>
                </div>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Text -->
        <v-expansion-panel>
            <v-expansion-panel-title><h4> Change Font </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <v-radio-group v-model="visStore.default_colors.text" label="Color">
                    <v-radio v-for="color in this.fontColor" :key="color" :value="color">
                        <template v-slot:label>
                            <v-icon class="mr-2" :style="'color:' + color">mdi-circle</v-icon>
                            {{ color }}
                        </template>
                    </v-radio>
                     <v-radio label="custom" :value="fontColor_custom">
                            <template v-slot:label>
                                <v-icon class="mr-2" :style="'color:' + fontColor_custom">mdi-circle</v-icon>
                                custom ({{ fontColor_custom }})
                                <v-icon class="ml-2">mdi-pencil</v-icon>
                            </template>
                            <color-dialog :color="fontColor_custom"
                                          @update="fontColor_custom = $event; visStore.default_colors.text = $event"></color-dialog>
                        </v-radio>
                </v-radio-group>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Graphs -->
        <v-expansion-panel>
            <v-expansion-panel-title><h4> Change Graphs </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <div class="d-flex">
                    <div class="mx-5">
                        <v-radio-group v-model="visStore.default_settings.impact.graph" label="Impact Graph">
                            <v-radio label="bar" value="bar"></v-radio>
                            <v-radio label="pictograph" value="pictograph"></v-radio>
                        </v-radio-group>
                        <v-text-field v-if="visStore.default_settings.impact.graph === 'pictograph'"
                                      type="number" label="#rows" v-model="visStore.default_settings.impact.grid[0]"/>
                        <v-text-field v-if="visStore.default_settings.impact.graph === 'pictograph'"
                                      type="number" label="#columns"
                                      v-model="visStore.default_settings.impact.grid[1]"/>
                    </div>
                    <div class="mx-5">
                        <v-radio-group v-model="visStore.default_settings.significance.graph"
                                       label="Significance Graph">
                            <v-radio label="bar" value="bar"></v-radio>
                            <v-radio label="pictograph" value="pictograph"></v-radio>
                        </v-radio-group>
                        <v-text-field v-if="visStore.default_settings.significance.graph === 'pictograph'"
                                      type="number" label="#rows"
                                      v-model="visStore.default_settings.significance.grid[0]"/>
                        <v-text-field v-if="visStore.default_settings.significance.graph === 'pictograph'"
                                      type="number" label="#columns"
                                      v-model="visStore.default_settings.significance.grid[1]"/>
                    </div>
                    <v-btn variant="outlined" @click="csvStore.calc_variable_summaries()">Recalculate</v-btn>
                </div>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Data Processing -->
        <v-expansion-panel>
            <v-expansion-panel-title><h4> Change Data Processing </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <div class="d-flex">
                    <div class="d-flex flex-column align-start align-content-start justify-start pb-5">
                        Data Preprocessing
                        <v-checkbox label="exclude missing values" v-model="csvStore.exclude_missing"></v-checkbox>
                        <v-text-field type="number" label="minimal bin size" class="align-self-stretch"
                                      v-model="csvStore.min_bin_size"/>
                        <v-btn variant="outlined" @click="csvStore.calc_variable_summaries()">Recalculate</v-btn>
                    </div>
                    <div class="flex-grow-1">
                        Regression
                        <v-text-field type="number" class="mx-5" label="min correlation with target"
                                      v-model="regressionStore.correlation_boundary"/>
                        <v-text-field type="number" class="mx-5" label="epochs"
                                      v-model="regressionStore.epochs"/>
                        <v-text-field type="number" class="mx-5" label="test ratio"
                                      v-model="regressionStore.test_ratio"/>
                        <v-text-field type="number" class="mx-5" label="batch size"
                                      v-model="regressionStore.batch_size"/>
                        <v-text-field type="number" class="mx-5" label="learning rate"
                                      v-model="regressionStore.learning_rate"/>
                        <v-btn variant="outlined" @click="regressionStore.compute_score()">Recalculate</v-btn>
                    </div>
                    <v-radio-group v-model="scoreStore.score" label="score"
                                   @update:modelValue="scoreStore.sort_summaries()">
                        <v-radio v-for="score in scoreStore.score_choices" :label="score" :value="score"
                                 v-bind:key="score"/>
                    </v-radio-group>

                </div>
            </v-expansion-panel-text>
        </v-expansion-panel>
    </v-expansion-panels>
</template>

<script>
import {useVisStore} from "@/stores/visStore";
import {useCSVStore} from "@/stores/csvStore";
import {useScoreStore} from "@/stores/scoreStore";
import {useRegressionStore} from "@/stores/regressionStore";
import * as d3 from "d3";
import ColorDialog from "@/components/helpers/color-dialog.vue";

export default {
    name: "settings_view",
    components: {ColorDialog},
    setup() {
        const csvStore = useCSVStore()
        const visStore = useVisStore()
        const scoreStore = useScoreStore()
        const regressionStore = useRegressionStore()
        return {csvStore, visStore, scoreStore, regressionStore}
    },
    data() {
        return {
            show: false,
            colors: [d3.schemeDark2, d3.schemeCategory10, d3.schemeSet1],
            background: ["lightgrey", "Gainsboro", "white"],
            background_custom: "#0099ff",
            fontColor: ["black", "midnightBlue", "darkblue"],
            fontColor_custom: "#000000"
        }
    },
    methods: {
        close() {
            this.show = false
        },
        add_color_scheme() {
            this.colors.push(JSON.parse(JSON.stringify(d3.schemeDark2)))
        }
    }
}
</script>

<style scoped>

</style>