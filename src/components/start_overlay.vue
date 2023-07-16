<template>
    <v-dialog v-model="dataStore.start">
        <v-card title="Raccoon" class="flex mx-auto w-75">
            <div class="mt-5">
                <v-file-input label="File input" class="px-5" v-model="files"
                              @update:modelValue="uploaded"></v-file-input>
            </div>

            <div v-if="dataStore.column_names.length !== 0">
                <v-autocomplete v-model="dataStore.target_column" class="px-5" label="Select target"
                                :items="dataStore.column_names"
                                @update:modelValue="target_selected"/>
            </div>

            <div v-if="dataStore.target_all_options.length !== 0">
                <v-autocomplete v-model="dataStore.target_option" class="px-5" label="Select target option"
                                :items="dataStore.target_all_options" @update:modelValue="target_option_selected"/>
            </div>
            <div class="px-5 pb-5" v-if="dataStore.target_option">
                <v-text-field v-model="dataStore.target_label" :hint="'eg. ' + dataStore.target_column + ':' + dataStore.target_option"
                label="target label"></v-text-field>
                <i> Example: "The likelihood of <span class="text-primary">{{dataStore.target_label}} </span> is X%." </i>
            </div>

            <v-divider class="pb-5" />

            <div class="px-5 pb-5" v-if="dataStore.target_option">
                I want to...
                <v-btn-toggle  v-model="dashboardStore.intention">
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
            </div>

            <v-expansion-panels class="px-5" v-if="dataStore.target_option">
                <v-expansion-panel title="Additional Options">
                    <v-expansion-panel-text>
                        <v-checkbox label="exclude missing values" v-model="dataStore.exclude_missing"></v-checkbox>
                        <v-slider label="dashboard starting items" v-model="starting_items" :min="1" :max="5"
                                  :step="1"
                                  thumb-label="always"></v-slider>
                        <v-text-field label="rows equal" v-model="dataStore.row_label"></v-text-field>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>


            <v-card-actions class="w-100 pa-5">
                <div v-if="dataStore.target_option" class="w-100">
                    <v-btn class="d-flex w-100 justify-center font-weight-bold" style="font-size:1.5rem" color="primary"
                           @click="visualize()">Calculate
                    </v-btn>
                </div>
            </v-card-actions>
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
            starting_items: 1
        }
    },
    methods: {
        /**
         * gets called when a file is uploaded
         */
        uploaded() {
            const csvFile = this.files[0];
            const name = csvFile.name.replace('.csv', '')
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = d3.csvParse(event.target.result)
                this.dataStore.column_names = data.columns
                this.dataStore.csv = data
                this.dataStore.min_bin_size = Math.max(Math.floor(data.length / 20), 10) //at least 5% of people per bin

                if (name.includes("ship")) {
                    this.dataStore.target_column = "stea_s0"
                    this.target_selected()
                    this.dataStore.target_option = "US pos."
                    this.target_option_selected()
                }
            }
            reader.readAsText(csvFile)
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
        }
    }
}
</script>
