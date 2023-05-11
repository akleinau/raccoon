<template>
  <v-dialog v-model="csvStore.start">
    <v-card title="Raccoon" class="flex mx-auto w-75">
      <div>
        <v-card-text>
          Load Dataset:
        </v-card-text>
        <v-file-input label="File input" class="px-5" v-model="files"
                      @update:modelValue="uploaded"></v-file-input>
      </div>

      <div v-if="csvStore.columns.length !== 0">
        <v-card-text>
          Select target:
        </v-card-text>
        <v-autocomplete v-model="csvStore.target_column" class="px-5" label="Select" :items="csvStore.columns"
                        @update:modelValue="target_selected"/>
      </div>

      <div v-if="csvStore.target_all_options.length !== 0">
        <v-card-text>
          Select target option:
        </v-card-text>
        <v-autocomplete v-model="csvStore.target_option" class="px-5" label="Select" :items="csvStore.target_all_options"/>
      </div>

      <div v-if="csvStore.target_option">
        <v-checkbox label="exclude missing values" v-model="csvStore.exclude_missing"></v-checkbox>
      </div>

      <v-card-actions>
        <div v-if="csvStore.target_option">
          <v-btn color="primary" @click="visualize()">Visualize</v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as d3 from "d3";
import {useCSVStore} from '@/Stores/csvStore'
import {useVisStore} from "@/Stores/visStore";
import {useRegressionStore} from "@/stores/regressionStore";

export default {
  setup() {
    const csvStore = useCSVStore()
    const visStore = useVisStore()
    const regressionStore = useRegressionStore()
    return {csvStore, visStore, regressionStore}
  },
  data() {
    return {
      files: null,
    }
  },
  methods: {
    /**
     * gets called when a file is uploaded
     */
    uploaded() {
      console.log("uploaded:")
      const csvFile = this.files[0];
      const name = csvFile.name.replace('.csv', '')
      console.log(name)
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = d3.csvParse(event.target.result)
        this.csvStore.columns = data.columns
        this.csvStore.csv = data
        this.csvStore.min_bin_size = Math.floor(data.length/100)
      }
      reader.readAsText(csvFile)
    },
    /**
     * gets called when a target is selected
     */
    target_selected() {
      console.log("target_selected")
      this.csvStore.target_all_options = [...new Set(this.csvStore.csv.map(d => d[this.csvStore.target_column]))]
      this.csvStore.target_all_options = this.csvStore.target_all_options.filter(d => !(d === null || d === ""))
      console.log(this.csvStore.target_all_options)
    },
    /**
     * start the calculation of the visualizations and closes the overlay
     */
    visualize() {
      this.csvStore.start = false
      this.visStore.set_initial_default_settings(this.csvStore.csv.length, this.csvStore.target_column, this.csvStore.target_option)
      this.csvStore.calc_variable_summaries()
      this.visStore.add_dashboard_item(this.csvStore.variable_summaries.find(d => d.name === useCSVStore().target_column),
        [ {type: 'impact', data_map: 'occurrence'}], false)
      this.csvStore.variable_summaries.slice(0,5)
          .filter(summary => summary.significance.score["regression"] > 0.1)
          .forEach(summary => this.visStore.add_dashboard_item(summary, this.visStore.generate_main_fact_visList(), false))
      this.regressionStore.compute_score()

      this.files = null
    }
  }
}
</script>
