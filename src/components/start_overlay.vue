<template>
    <v-dialog v-model="dataStore.start">
        <v-card class="flex mx-auto w-75">

            <v-card-title>RACCOON - Risk Factor Communication</v-card-title>

            <v-card-text>
                <div style="height:550px" class="d-flex flex-column align-center w-100">
                    <div v-if="page === 0" class="w-100 mt-16">
                        <h1 class="d-flex justify-center"> Choose dataset</h1>
                        <div class="d-flex w-100 mx-3 align-center justify-center">
                            <div class="mt-5 w-50">
                                <v-file-input label="File input" class="px-5" v-model="files"
                                              @update:modelValue="uploaded"></v-file-input>
                            </div>
                            or
                            <v-btn @click="load_example" variant="tonal" class="mx-5">load example</v-btn>
                        </div>

                    </div>

                    <div v-if="page === 1">
                        <h1 class="d-flex justify-center mb-3 mt-16"> Choose target</h1>
                        <div class="mb-5">Your target is the disease or hazard for which you want to compute risk
                            factors.
                        </div>

                        <div v-if="dataStore.column_names.length !== 0">
                            <v-autocomplete v-model="dataStore.target_column" class="px-5" label="Select target"
                                            :items="dataStore.column_names" style="min-width: 500px"
                                            @update:modelValue="target_selected"/>
                        </div>

                        <div v-if="dataStore.target_all_options.length !== 0">
                            <v-autocomplete v-model="dataStore.target_option" class="px-5" label="Select target option"
                                            :items="dataStore.target_all_options"
                                            @update:modelValue="target_option_selected"/>
                        </div>
                        <div class="px-5 pb-5 pt-7" v-if="dataStore.target_option">
                            <div>Customize target label:</div>
                            <v-text-field v-model="dataStore.target_label"
                                          :hint="'eg. ' + dataStore.target_column + ':' + dataStore.target_option"
                            ></v-text-field>
                            <i> Example: "The likelihood of <span class="text-primary">{{
                                dataStore.target_label
                                }} </span>
                                is
                                X%."
                            </i>
                        </div>
                    </div>

                    <div v-if="page === 2">

                        <div class="px-5 pb-5" v-if="dataStore.target_option">
                            <h1 class="d-flex justify-center mb-5 mt-16"> I want to... </h1>
                            <v-btn-toggle v-model="dashboardStore.intention" class="d-flex justify-center">
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
                            <div style="width:800px" class="mt-1 d-flex justify-center">
                                <div v-if="dashboardStore.intention === 'explore'">
                                    Explore the data. Showing detailed information about the dataset.
                                </div>
                                <div v-if="dashboardStore.intention === 'convince'">
                                    Convince the public about the risks associated with the risk factors.
                                </div>
                                <div v-if="dashboardStore.intention === 'educate'">
                                    Educate the public. Showing simple, easily understandable visualizations.
                                </div>

                            </div>
                        </div>

                        <div class="px-5 pt-2 d-flex justify-center">
                            <v-expansion-panels  v-if="dataStore.target_option"
                                                style="width:800px">
                                <v-expansion-panel title="Additional Options">
                                    <v-expansion-panel-text>
                                        <v-checkbox label="exclude missing values"
                                                    v-model="dataStore.exclude_missing"></v-checkbox>
                                        <v-slider label="dashboard starting items" v-model="starting_items" :min="1"
                                                  :max="5"
                                                  :step="1"
                                                  thumb-label="always"></v-slider>
                                        <v-text-field label="rows equal" v-model="dataStore.row_label"></v-text-field>
                                    </v-expansion-panel-text>
                                </v-expansion-panel>
                            </v-expansion-panels>
                        </div>
                    </div>

                </div>

                <v-card-actions class="w-100 pa-5">
                    <div class="w-100 d-flex justify-space-between">
                        <v-btn @click="page--" :disabled="page === 0"> Prev</v-btn>
                        <v-btn class="d-flex justify-center font-weight-bold" style="font-size:1.5rem" color="primary"
                               @click="visualize()" v-if="page === 2">Calculate
                        </v-btn>
                        <v-btn @click="page++" :disabled="page === 2"> Next</v-btn>
                    </div>
                </v-card-actions>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script>
import * as d3 from "d3";
import {useDataStore} from '@/stores/dataStore'
import {useDashboardStore} from "@/stores/dashboardStore";
import {useRegressionStore} from "@/stores/regressionStore";
import {useVisGeneratorStore} from "@/stores/visGeneratorStore";

export default {
    setup() {
        const dataStore = useDataStore()
        const dashboardStore = useDashboardStore()
        const regressionStore = useRegressionStore()
        const visGeneratorStore = useVisGeneratorStore()
        return {dataStore, dashboardStore, regressionStore, visGeneratorStore}
    },
    data() {
        return {
            files: null,
            starting_items: 1,
            name: null,
            page: 0
        }
    },
    computed: {
        start() {
            return this.dataStore.start
        }
    },
    watch: {
        start() {
            this.files = null
            this.starting_items = 1
            this.name = null
        }
    },
    methods: {
        /**
         * gets called when a file is uploaded
         */
        uploaded() {
            this.dataStore.reset()
            const csvFile = this.files[0];
            this.name = csvFile.name.replace('.csv', '')
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = d3.csvParse(event.target.result)
                this.dataStore.column_names = data.columns
                this.dataStore.csv = data
                this.dataStore.min_bin_size = Math.max(Math.floor(data.length / 20), 10) //at least 5% of people per bin
            }
            reader.readAsText(csvFile)
            this.page++
        },
        /**
         * gets called when a target is selected
         */
        target_selected() {
            this.dataStore.target_all_options = [...new Set(this.dataStore.csv.map(d => d[this.dataStore.target_column]))]
            this.dataStore.target_all_options = this.dataStore.target_all_options.filter(d => !(d === null || d === ""))
        },
        /**
         * gets called when a target option is selected
         */
        target_option_selected() {
            this.dataStore.target_label = this.dataStore.target_column + ":" + this.dataStore.target_option
        },
        /**
         * start the calculation of the visualizations and closes the overlay
         */
        visualize() {
            this.dataStore.start = false
            this.dashboardStore.set_initial_default_settings(this.dataStore.csv.length, this.dataStore.target_column, this.dataStore.target_option)
            this.dataStore.calc_column_list()
            this.dashboardStore.add_dashboard_item(this.dataStore.column_list.find(d => d.name === useDataStore().target_column),
                [{type: 'impact', data_map: 'occurrence'}], false)
            let i = 0
            while (i < (this.starting_items - 1)) {
                let j = 0
                while (!this.dashboardStore.is_recommendation_column(this.dataStore.column_list[j])) {
                    j++
                }
                let best_column = this.dataStore.column_list[j]
                if (best_column.significance.score["regression"] >= 0.01) {
                    this.dashboardStore.add_dashboard_item(best_column, this.visGeneratorStore.generate_main_fact_visList(), true)
                    i++
                } else {
                    break
                }
            }

            this.files = null
        },

        async load_example() {
            const csvFile = "examples/diabetes_sample.csv";
            this.name = "diabetes example"
            const data = await d3.csv(csvFile)
            this.dataStore.column_names = data.columns
            this.dataStore.csv = data
            this.dataStore.min_bin_size = Math.max(Math.floor(data.length / 20), 10) //at least 5% of people per bin

            this.dataStore.target_column = "Diabetes"
            this.target_selected()
            this.dataStore.target_option = "Yes"
            this.target_option_selected()
            this.dataStore.target_label = "diabetes"

            this.page++
        }
    }
}
</script>
