<template>
  <v-app>
    <start_overlay/>

    <v-app-bar>
      <v-app-bar-title>Raccoon</v-app-bar-title>
      <template v-slot:append>
        <v-btn @click="this.Store.reset()">Reset</v-btn>
      </template>
    </v-app-bar>
    <v-main>
      <v-lazy :min-height="200">
        <v-card title="Risk Factors" class="pa-5 bg-blue-grey-lighten-5">

          <v-sheet border v-for="column in Store.variable_summaries" v-bind:key="column" class="pa-1 ma-2">
            <v-expansion-panels class="mb-3">
              <v-expansion-panel>
                <v-expansion-panel-title><h4> {{ column["name"] }} </h4></v-expansion-panel-title>
                <v-expansion-panel-text class="text-grey-darken-2">
                  pairs with statistically significant differences:
                  <span v-for="tuple in Object.values(column['significance'].significant_tuples)" v-bind:key="tuple">
                      ({{ tuple[0] !== "" ? tuple[0] : "null" }} - {{ tuple[1] !== "" ? tuple[1] : "null" }})
                  </span>
                  <div> Score: {{ column['significance'].score.toFixed(2) }}</div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
            <div v-if="column['significance'].significant_tuples.length === 0">
              <v-icon icon="mdi-alert" /> no statistically significant differences
            </div>
            <div class="d-flex flex-row mt-2">
              <div>
              <span class="d-flex justify-center">
                <b>#people per option</b>
              </span>
                <vis_bar :data_map="column['occurrence']" :range="[0,this.Store.csv.length]" color="royalblue"/>
              </div>
              <div>
              <span class="d-flex justify-center">
                <b>Proportion of people per option who have
                  <span style="color:darkblue"> {{ Store.target_column }} : {{ Store.target_option }} </span>
                </b>
              </span>
                <vis_pictograph :data_map="column['percent_target_option']" range="percent" color="MediumVioletRed" :grid="[25,4]"/>
              </div>
            </div>
          </v-sheet>

        </v-card>
      </v-lazy>
    </v-main>

  </v-app>
</template>

<script>
import start_overlay from './components/start_overlay.vue'
import vis_bar from "@/components/vis_bar.vue";
import vis_pictograph from "@/components/vis_pictograph.vue";
import {useStore} from "@/stores/csvStore";

export default {
  components: {
    vis_bar,
    vis_pictograph,
    start_overlay
  },
  setup() {
    const Store = useStore()
    return {Store}
  },
}
</script>

<style scoped></style>
