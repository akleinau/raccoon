<template>
  <v-dialog v-model="Store.start">
    <v-card title="Raccoon" class="flex mx-auto w-75">
      <div>
        <v-card-text>
          Load Dataset:
        </v-card-text>
        <v-file-input label="File input" class="px-5" v-model="files"
                      @update:modelValue="uploaded"></v-file-input>
      </div>

      <div v-if="Store.columns.length !== 0">
        <v-card-text>
          Select target:
        </v-card-text>
        <v-autocomplete v-model="Store.target_column" class="px-5" label="Select" :items="Store.columns"
                        @update:modelValue="target_selected"/>
      </div>

      <div v-if="Store.target_all_options.length !== 0">
        <v-card-text>
          Select target option:
        </v-card-text>
        <v-autocomplete v-model="Store.target_option" class="px-5" label="Select" :items="Store.target_all_options"/>
      </div>

      <div v-if="Store.target_option">
        <v-checkbox label="exclude missing values" v-model="Store.exclude_missing"></v-checkbox>
      </div>

      <v-card-actions>
        <div v-if="Store.target_option">
          <v-btn color="primary" @click="visualize()">Visualize</v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import * as d3 from "d3";
import {useStore} from '@/stores/csvStore'

export default {
  setup() {
    const Store = useStore()
    return {Store}
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
        this.Store.columns = data.columns
        this.Store.csv = data
        this.Store.min_bin_size = Math.floor(data.length/100)
      }
      reader.readAsText(csvFile)
    },
    /**
     * gets called when a target is selected
     */
    target_selected() {
      console.log("target_selected")
      this.Store.target_all_options = [...new Set(this.Store.csv.map(d => d[this.Store.target_column]))]
      this.Store.target_all_options = this.Store.target_all_options.filter(d => !(d === null || d === ""))
      console.log(this.Store.target_all_options)
    },
    /**
     *
     */
    visualize() {
      this.Store.start = false
      this.Store.calc_variable_summaries()
      this.files = null
    }
  }
}
</script>
