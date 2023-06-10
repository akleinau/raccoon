<template>
  <!-- Choose Visualizations -->
    <v-expansion-panels class="ma-3 w-50">
        <v-expansion-panel>
            <v-expansion-panel-title><h4>Design </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <div class="d-flex">
                    <!-- Color Scheme -->
                    <div>
                        <v-radio-group v-model="color_mode" label="Colors" class="mr-5" inline>
                            <v-radio value="oneColor" label="color based"
                                     @click="visStore.default_colors.colors=neighbor_color_list"/>
                            <v-radio value="scheme" label="scheme"
                                     @click="visStore.default_colors.colors=scheme"/>
                            <v-radio value="custom" label="custom"
                                     @click="custom_color_list=visStore.default_colors.colors"/>
                        </v-radio-group>

                        <div v-if="color_mode === 'oneColor'" class="mr-5">
                            <div class="d-flex w-100 justify-center">
                                Color based:
                                <v-icon class="ml-2" :style="'color:' + neighborColor">mdi-circle</v-icon>
                                <v-icon class="ml-1">mdi-pencil</v-icon>
                                <color-dialog :color="neighborColor"
                                              @update="neighborColor = $event; visStore.default_colors.colors=neighbor_color_list "></color-dialog>
                            </div>
                            <v-slider v-model="color_spread" label="spread" start="20" end="100" step="5"
                                      @click="visStore.default_colors.colors=neighbor_color_list"
                                      style="max-width:200px"/>
                            <v-divider class="mt-2"></v-divider>
                            <div class="d-flex w-100 justify-center mt-2">
                            <span v-for="(color,i) in visStore.default_colors.colors" :key="i">
                                <v-icon :style="'color:' + color">mdi-circle</v-icon>
                            </span>
                            </div>
                        </div>

                        <div v-if="color_mode === 'scheme'" class="mr-5">
                            <div>Color scheme:</div>
                            <v-select v-model="scheme" :items="colors" dense variant="underlined">
                                <template v-slot:selection="{item}">
                                    <v-icon class="mb-2" :style="'color:' + item.value">mdi-circle</v-icon>
                                </template>
                                <template v-slot:item="{item}">
                                    <div>
                                        <v-btn @click="scheme = item.value; visStore.default_colors.colors=scheme"
                                               variant="plain">
                                            <v-icon v-for="color in item.value" :key="color"
                                                    :style="'color:' + color">
                                                mdi-circle
                                            </v-icon>
                                        </v-btn>
                                    </div>
                                </template>
                            </v-select>
                        </div>

                        <div v-if="color_mode === 'custom'">
                            <div>Custom:</div>
                            <span v-for="(color,i) in custom_color_list" :key="i">
                                        <v-icon :style="'color:' + color">mdi-circle</v-icon>
                                        <v-icon class="mr-2">mdi-pencil</v-icon>
                                        <color-dialog :color="color"
                                                      @update="custom_color_list[i] = $event; visStore.default_colors.colors=custom_color_list; color=$event"></color-dialog>
                                    </span>
                        </div>
                    </div>

                    <!-- Background -->
                    <v-radio-group v-model="visStore.default_colors.background" label="Background" class="ml-5">
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
                                          @update="background_custom.color = $event; visStore.default_colors.background.color = $event"></color-dialog>
                        </v-radio>

                    </v-radio-group>

                    <!-- Text -->
                    <v-radio-group v-model="visStore.default_colors.text" label="Font Color">
                        <v-radio v-for="color in this.fontColor" :key="color" :value="color">
                            <template v-slot:label>
                                <v-icon class="mr-2" :style="'color:' + color">mdi-circle</v-icon>
                            </template>
                        </v-radio>
                        <v-radio label="custom" :value="fontColor_custom">
                            <template v-slot:label>
                                <v-icon class="mr-2" :style="'color:' + fontColor_custom">mdi-circle</v-icon>
                                <v-icon>mdi-pencil</v-icon>
                            </template>
                            <color-dialog :color="fontColor_custom"
                                          @update="fontColor_custom = $event; visStore.default_colors.text = $event"></color-dialog>
                        </v-radio>
                    </v-radio-group>

                    <v-radio-group v-model="visStore.default_colors.font_family" label="Font Family" class="ml-5 mr-2"  style="min-width:120px">
                        <v-radio v-for="font in this.font_families" :key="font" :label="font" :value="font" :style="'font-family: ' + font" />
                        <v-radio label="custom" :value="font_family_custom">
                            <template v-slot:label>
                                <v-text-field v-model="font_family_custom" variant="underlined" style="min-width:100px"
                                              @update:modelValue="visStore.default_colors.font_family = font_family_custom"/>
                                <v-icon>mdi-pencil</v-icon>
                            </template>
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
                <v-btn-toggle v-model="visStore.intention" @update:modelValue="visStore.update_settings_by_intention()"
                              class="mb-1">
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

                <div v-if="visStore.intention === 'explore'">
                    For scientists to explore the data. Showing detailed information about the dataset.
                    <ul class="ml-5">
                        <li>Pictographs with percentages</li>
                        <li>Bar charts showing absolute numbers of participants</li>
                    </ul>
                </div>
                <div v-if="visStore.intention === 'convince'">
                    Visualizations to convince the public about a certain topic.
                    <ul class="ml-5">
                        <li>showing only nominators increases perceived risk</li>
                        <li>Pictographs and bar charts are easy to understand</li>
                    </ul>
                </div>
                <div v-if="visStore.intention === 'educate'">
                    For scientists to educate the public about their findings. Showing only the most important
                    information about the dataset.
                    <ul class="ml-5">
                        <li>Pictographs showing natural frequencies (eg 22/100) best for understanding risks</li>
                        <li>Pie Charts for best overview over a distribution (on cost of accuracy)</li>
                    </ul>
                </div>

            </v-expansion-panel-text>
        </v-expansion-panel>
        <v-expansion-panel>
            <v-expansion-panel-title> <h4>Rename</h4> </v-expansion-panel-title>
            <v-expansion-panel-text>
                <div class="d-flex">
                    <b>Target: </b>
                    <v-text-field :label="csvStore.target.name" v-model="csvStore.target.label"
                        append-inner-icon="mdi-pencil" class="mx-3"  ></v-text-field>
                    <v-text-field :label="csvStore.target.options.find(d => d.name ===csvStore.target_option).name"
                                  v-model="csvStore.target.options.find(d => d.name ===csvStore.target_option).label"
                                append-inner-icon="mdi-pencil" class="mx-3"></v-text-field>
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
            color_mode: "oneColor",
            color_spread: 45,
            neighborColor: "#1302B5",
            scheme: d3.quantize(d3.interpolateCool, 5).map(d => d3.color(d).hex()),
            colors: [
                d3.quantize(d3.interpolateCool, 5).map(d => d3.color(d).hex()),
                d3.quantize(d3.interpolatePlasma, 5).map(d => d3.color(d).hex()),
                d3.quantize(d3.interpolateViridis, 5).map(d => d3.color(d).hex()),
                d3.quantize(d3.interpolateSpectral, 5).map(d => d3.color(d).hex()),
                d3.quantize(d3.interpolateRainbow, 5).map(d => d3.color(d).hex()),
                d3.quantize(d3.interpolateSinebow, 5).map(d => d3.color(d).hex()),
            ],
            custom_color_list: d3.quantize(d3.interpolateCool, 5).map(d => d3.color(d).hex()),
            background: [{color: "Gainsboro", stroke: "None"}, {color: "#D3D9E6", stroke: "None"}, {
                color: "white", stroke: "darkgray"
            }],
            background_custom: {color: "#efe7de", stroke: "None"},
            background_auto: {color: "auto", stroke: "None"},
            fontColor: ["black", "midnightBlue", "darkblue"],
            fontColor_custom: "#000000",
            font_families: ["inherit", "Arial", "monospace", "Times New Roman", "Verdana"],
            font_family_custom: "custom",
        }
    },
    methods: {
        close() {
            this.show = false
        }
    },
    computed: {
        neighbor_color_list() {
            let color = d3.hsl(this.neighborColor)
            let list = []
            for (let i = 0; i < 5; i++) {
                list.push(color.formatHex())
                color.h -= this.color_spread
                if (color.h < 0) color.h += 360
            }
            return list
        }
    }
}
</script>

<style scoped>

</style>