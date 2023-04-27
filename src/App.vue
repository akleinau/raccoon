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
          <!-- Choose Visualizations -->
          <div class="d-flex">
            <div class="mx-5">
              <v-radio-group v-model="impact_graph" label="Impact Graph">
                <v-radio label="bar" value="bar"></v-radio>
                <v-radio label="pictograph" value="pictograph"></v-radio>
              </v-radio-group>
              <v-text-field type="number" label="#rows" v-model="impact_grid[0]"/>
              <v-text-field type="number" label="#columns" v-model="impact_grid[1]"/>
            </div>
            <div class="mx-5">
              <v-radio-group v-model="significance_graph" label="Significance Graph">
                <v-radio label="bar" value="bar"></v-radio>
                <v-radio label="pictograph" value="pictograph"></v-radio>
              </v-radio-group>
              <v-text-field type="number" label="#rows" v-model="significance_grid[0]"/>
              <v-text-field type="number" label="#columns" v-model="significance_grid[1]"/>
            </div>
            <v-checkbox v-model="show_continuous" label="show density plot"></v-checkbox>
          </div>


          <!-- Risk Factor Sheets -->
          <div v-for="column in Store.variable_summaries" v-bind:key="column">
            <v-sheet border class="ma-2">
              <!-- additional information -->
              <v-expansion-panels class="mb-3">
                <v-expansion-panel>
                  <v-expansion-panel-title><h4> {{ column["name"] }} </h4></v-expansion-panel-title>
                  <v-expansion-panel-text class="text-grey-darken-2">
                    pairs with statistically significant differences:
                    <span v-for="tuple in Object.values(column['significance'].significant_tuples)"
                          v-bind:key="tuple">
                                        ({{ tuple[0] !== "" ? tuple[0] : "null" }} -
                                        {{ tuple[1] !== "" ? tuple[1] : "null" }})
                                    </span>
                    <div> Score: {{ column['significance'].score.toFixed(2) }}</div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>

              <!-- hints -->
              <div v-if="column['significance'].significant_tuples.length === 0">
                <v-icon icon="mdi-alert"/>
                no statistically significant differences
              </div>

              <!-- visualizations -->
              <div class="d-flex flex-row mt-2">
                <div>
                  <span class="d-flex justify-center"> <b>#people per option</b></span>
                  <vis_bar v-if="impact_graph === 'bar'" :data_map="column['occurrence']"
                           :range="[0,this.Store.csv.length]"
                           color="royalblue"/>
                  <vis_pictograph v-if="impact_graph === 'pictograph'"
                                  :data_map="column['occurrence']"
                                  :range="[0,this.Store.csv.length]" :grid="impact_grid"
                                  color="royalblue"/>
                </div>
                <div>
                                <span class="d-flex justify-center">
                                    <b>Proportion of people per option who have
                                      <span style="color:darkblue">
                                          {{ Store.target_column }} : {{ Store.target_option }}
                                      </span>
                                    </b>
                                </span>
                  <vis_pictograph v-show="significance_graph === 'pictograph'"
                                  :data_map="column['percent_target_option']" range="percent"
                                  color="MediumVioletRed" :grid="significance_grid"/>
                  <vis_bar v-if="significance_graph === 'bar'" :data_map="column['percent_target_option']"
                           range="percent"
                           color="MediumVioletRed"/>
                </div>
              </div>
              <vis_line v-if="column.type === 'continuous' && show_continuous" :data="column.data" :target_data="column.data_with_target_option"/>
            </v-sheet>
          </div>

        </v-card>
      </v-lazy>
    </v-main>

  </v-app>
</template>

<script>
import start_overlay from './components/start_overlay.vue'
import vis_bar from "@/components/vis_bar.vue";
import vis_pictograph from "@/components/vis_pictograph.vue";
import vis_line from "@/components/vis_line.vue";
import {useStore} from "@/stores/csvStore";

export default {
  components: {
    vis_bar,
    vis_pictograph,
    vis_line,
    start_overlay
  },
  setup() {
    const Store = useStore()
    return {Store}
  },
  data() {
    return {
      impact_graph: "bar",
      significance_graph: "pictograph",
      impact_grid: [25, 4],
      significance_grid: [25, 4],
      show_continuous: false
    }
  },
}
</script>

<style scoped></style>
