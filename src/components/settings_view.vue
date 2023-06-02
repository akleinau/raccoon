<template>
  <!-- Choose Visualizations -->
    <v-expansion-panels class="ma-3 w-50">
        <v-expansion-panel>
            <v-expansion-panel-title><h4>Design </h4></v-expansion-panel-title>
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
                    <v-radio-group v-model="visStore.default_colors.background" label="Background" class="ml-5">
                        <v-radio v-for="color in this.background" :key="color" :value="color">
                            <template v-slot:label>
                                <div class="mr-2"
                                     :style="'background:' + color + '; border: 1px solid black; width: 200px; height: 30px'"/>
                            </template>
                        </v-radio>
                        <v-radio label="custom" :value="background_custom">
                            <template v-slot:label>
                                <div class="mr-2"
                                     :style="'background:' + background_custom + '; border: 1px solid black; width: 200px; height: 30px'"/>
                                <v-icon class="ml-2">mdi-pencil</v-icon>
                            </template>
                            <color-dialog :color="background_custom"
                                          @update="background_custom = $event; visStore.default_colors.background = $event"></color-dialog>
                        </v-radio>

                    </v-radio-group>

                    <!-- Text -->
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
                </div>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Data Processing -->
        <v-expansion-panel>
            <v-expansion-panel-title><h4>Calculation </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <div class="d-flex">
                    <div>
                        <v-checkbox label="exclude missing values" v-model="csvStore.exclude_missing"></v-checkbox>


                    </div>
                    <div style="width:200px" class="ml-2">
                        <v-text-field type="number" label="minimal bin size" class="align-self-stretch"
                                      v-model="csvStore.min_bin_size"/>
                    </div>
                    <div class="flex-grow-1 ml-5">
                        <v-expansion-panels>
                            <v-expansion-panel>
                                <v-expansion-panel-title>Regression</v-expansion-panel-title>
                                <v-expansion-panel-text>
                                    <v-text-field type="number" class="mx-5" label="min correlation with target"
                                                  v-model="regressionStore.correlation_boundary"/>
                                    <v-text-field type="number" class="mx-5" label="epochs"
                                                  v-model="regressionStore.epochs"/>
                                    <v-text-field type="number" class="mx-5"
                                                  label="fast epochs (for quickly finding risk factors)"
                                                  v-model="regressionStore.fast_epochs"/>
                                    <v-text-field type="number" class="mx-5" label="test ratio"
                                                  v-model="regressionStore.test_ratio"/>
                                    <v-text-field type="number" class="mx-5" label="batch size"
                                                  v-model="regressionStore.batch_size"/>
                                    <v-text-field type="number" class="mx-5" label="learning rate"
                                                  v-model="regressionStore.learning_rate"/>
                                    <v-btn variant="outlined" @click="regressionStore.compute_score()">Recalculate
                                    </v-btn>
                                </v-expansion-panel-text>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </div>
                    <div class="ml-5">
                        <v-btn variant="outlined" @click="csvStore.calc_variable_summaries()">Recalculate</v-btn>
                    </div>

                </div>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
            <v-expansion-panel-title><h4>Intention </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                I want to...
                <v-btn-toggle v-model="visStore.intention" @update:modelValue="visStore.update_settings_by_intention()">
                    <v-btn value="explore">
                        <v-icon class="mx-1" size="x-large">mdi-map-search</v-icon>
                        Explore
                    </v-btn>

                    <v-btn value="convince">
                        <v-icon class="mx-1" size="x-large">mdi-alert-octagram-outline</v-icon>
                        Convince
                    </v-btn>

                    <v-btn value="educate">
                        <v-icon class="mx-1" size="x-large">mdi-school</v-icon>
                        Educate
                    </v-btn>
                </v-btn-toggle>
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
            colors: [['#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#084594'].reverse(),
                ['#a1d99b', '#74c476', '#41ab5d', '#238b45', '#005a32'].reverse(),
                ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00']
            ],
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
            this.colors.push(JSON.parse(JSON.stringify(d3.schemeDark2)).slice(0, 5))
        }
    }
}
</script>

<style scoped>

</style>