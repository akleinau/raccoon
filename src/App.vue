<template>
  <v-app>
    <start_overlay/>
    <fact_group_view v-if="this.visStore.current_fact_group !== null"/>
    <fact_view v-if="this.visStore.current_fact !== null"/>

    <v-app-bar>
      <v-app-bar-title>Raccoon</v-app-bar-title>
      <template v-slot:append>
        <settings_view/>
        <v-btn @click="this.csvStore.reset()">Reset</v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <v-card title="Dashboard" class="pa-5 bg-blue-grey-lighten-5">
        <div v-for="item in visStore.dashboard_items" v-bind:key="item">
          <fact_group_preview :visList="item.visualizations" :column="item.summary"/>
        </div>
      </v-card>

      <v-card title="Adapt" class="pa-5">
        <div class="d-flex">
          <v-expansion-panels class="ma-3 w-50">
            <v-expansion-panel>
              <v-expansion-panel-title><h4> Change Color </h4></v-expansion-panel-title>
              <v-expansion-panel-text class="text-grey-darken-2">
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-title><h4> Change Background </h4></v-expansion-panel-title>
              <v-expansion-panel-text>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <v-expansion-panel>
              <v-expansion-panel-title><h4> Change Font </h4></v-expansion-panel-title>
              <v-expansion-panel-text>
              </v-expansion-panel-text>
            </v-expansion-panel>

          </v-expansion-panels>

          <div class="w-50 pl-5">
            <h3> Tips </h3>
            <ul class="pl-5">
              <li>...</li>
              <li>...</li>
              <li>...</li>
            </ul>
          </div>
        </div>
      </v-card>

      <v-card title="Risk Factors" class="pa-5 bg-blue-grey-lighten-5">

        <!-- Risk Factor Sheets -->
        <div v-for="column in csvStore.variable_summaries" v-bind:key="column">
          <fact_group_preview v-if="! visStore.dashboard_items.map(item => item.name).includes(column.name)"
                              :visList="generate_vis_from_settings(column)" :column="column"/>
        </div>

      </v-card>
    </v-main>

  </v-app>
</template>

<script>
import start_overlay from './components/start_overlay.vue'
import fact_group_preview from './components/fact_group_preview.vue'
import fact_group_view from './components/fact_group_view.vue'
import fact_view from './components/fact_view.vue'
import settings_view from "@/components/settings_view.vue";
import {useStore as csv_useStore} from "@/stores/csvStore";
import {useStore as vis_useStore} from "@/stores/visStore";


export default {
  components: {
    fact_group_preview,
    start_overlay,
    fact_group_view,
    fact_view,
    settings_view
  },
  setup() {
    const csvStore = csv_useStore()
    const visStore = vis_useStore()
    return {csvStore, visStore}
  },
  methods: {
    /**
     * generates standard visualizations for risk factors from settings
     *
     * @param column
     * @returns {*[]}
     */
    generate_vis_from_settings(column) {
      let visList = []
      visList.push(
          {
            data_map: column['occurrence'],
            range: [0, this.csvStore.csv.length],
            grid: this.visStore.impact_settings.grid,
            graph: this.visStore.impact_settings.graph,
            color: "royalblue"
          },
          {
            data_map: column['percent_target_option'],
            range: "percent",
            grid: this.visStore.significance_settings.grid,
            graph: this.visStore.significance_settings.graph,
            color: "MediumVioletRed"
          }
      )
      return visList
    }
  }
}
</script>

<style scoped></style>
