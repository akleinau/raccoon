<template>
  <!-- Choose Visualizations -->
    <v-expansion-panels class="ma-3 w-50">
        <v-expansion-panel>
            <v-expansion-panel-title><h4> Change Color </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <div class="d-flex">
                    <v-text-field class="mx-2" label="Impact Graphs" v-model="visStore.default_settings.impact.color"/>
                    <v-text-field class="mx-2" label="Significance Graphs" v-model="visStore.default_settings.significance.color"/>
                    <v-btn class="mx-2" variant="outlined" @click="csvStore.calc_variable_summaries()">Recalculate</v-btn>
                </div>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
            <v-expansion-panel-title><h4> Change Font </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
            <v-expansion-panel-title><h4> Change Graphs </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <div class="d-flex">
                    <div class="mx-5">
                        <v-radio-group v-model="visStore.default_settings.impact.graph" label="Impact Graph">
                            <v-radio label="bar" value="bar"></v-radio>
                            <v-radio label="pictograph" value="pictograph"></v-radio>
                        </v-radio-group>
                        <v-text-field v-if="visStore.default_settings.impact.graph === 'pictograph'"
                                      type="number" label="#rows" v-model="visStore.default_settings.impact.grid[0]"/>
                        <v-text-field v-if="visStore.default_settings.impact.graph === 'pictograph'"
                                      type="number" label="#columns"
                                      v-model="visStore.default_settings.impact.grid[1]"/>
                    </div>
                    <div class="mx-5">
                        <v-radio-group v-model="visStore.default_settings.significance.graph"
                                       label="Significance Graph">
                            <v-radio label="bar" value="bar"></v-radio>
                            <v-radio label="pictograph" value="pictograph"></v-radio>
                        </v-radio-group>
                        <v-text-field v-if="visStore.default_settings.significance.graph === 'pictograph'"
                                      type="number" label="#rows"
                                      v-model="visStore.default_settings.significance.grid[0]"/>
                        <v-text-field v-if="visStore.default_settings.significance.graph === 'pictograph'"
                                      type="number" label="#columns"
                                      v-model="visStore.default_settings.significance.grid[1]"/>
                    </div>
                    <v-btn variant="outlined" @click="csvStore.calc_variable_summaries()">Recalculate</v-btn>
                </div>
            </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
            <v-expansion-panel-title><h4> Change Data Processing </h4></v-expansion-panel-title>
            <v-expansion-panel-text>
                <div class="d-flex">
                    <v-checkbox label="exclude missing values" v-model="csvStore.exclude_missing"></v-checkbox>
                    <v-text-field type="number" class="mx-5" label="minimal bin size" v-model="csvStore.min_bin_size"/>
                    <v-radio-group v-model="csvStore.score" label="score">
                        <v-radio v-for="score in csvStore.score_choices" :label="score" :value="score" v-bind:key="score" />
                    </v-radio-group>
                    <v-btn variant="outlined" @click="csvStore.calc_variable_summaries()">Recalculate</v-btn>
                </div>
            </v-expansion-panel-text>
        </v-expansion-panel>
    </v-expansion-panels>
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