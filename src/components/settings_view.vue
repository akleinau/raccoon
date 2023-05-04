<template>
  <!-- Choose Visualizations -->
  <v-dialog v-model="show">
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props"> Settings</v-btn>
    </template>

    <v-card>

      <v-card-title>Settings</v-card-title>

      <div class="d-flex">
        <div class="mx-5">
          <v-radio-group v-model="visStore.default_settings.impact.graph" label="Impact Graph">
            <v-radio label="bar" value="bar"></v-radio>
            <v-radio label="pictograph" value="pictograph"></v-radio>
          </v-radio-group>
          <v-text-field type="number" label="#rows" v-model="visStore.default_settings.impact.grid[0]"/>
          <v-text-field type="number" label="#columns" v-model="visStore.default_settings.impact.grid[1]"/>
        </div>
        <div class="mx-5">
          <v-radio-group v-model="visStore.default_settings.significance.graph" label="Significance Graph">
            <v-radio label="bar" value="bar"></v-radio>
            <v-radio label="pictograph" value="pictograph"></v-radio>
          </v-radio-group>
          <v-text-field type="number" label="#rows" v-model="visStore.default_settings.significance.grid[0]"/>
          <v-text-field type="number" label="#columns" v-model="visStore.default_settings.significance.grid[1]"/>
        </div>
        <div class="mx-5">
          <v-checkbox v-model="visStore.show_continuous" label="show density plot"></v-checkbox>
          <v-checkbox label="exclude missing values" v-model="csvStore.exclude_missing"></v-checkbox>
          <v-text-field type="number" label="minimal bin size" v-model="csvStore.min_bin_size"/>
          <v-btn variant="outlined" @click="csvStore.calc_variable_summaries()">Recalculate</v-btn>
        </div>
      </div>

      <v-card-actions>
        <v-btn @click="close">Close</v-btn>
      </v-card-actions>

    </v-card>
  </v-dialog>
</template>

<script>
import {useVisStore} from "@/stores/visStore";
import {useCSVStore} from "@/stores/csvStore";

export default {
  name: "settings_view",
  setup() {
    const csvStore = useCSVStore()
    const visStore = useVisStore()
    return {csvStore, visStore}
  },
  data() {
    return {
      show: false,
    }
  },
  methods: {
    close() {
      this.show = false
    }
  }
}
</script>

<style scoped>

</style>