<template>
  <v-dialog v-model="display">
    <v-card title="Fact View" class="flex mx-auto w-75">
      <vis_parser :description="visStore.current_fact.vis"/>

      <v-expansion-panels class="ma-3">
            <v-expansion-panel>
                <v-expansion-panel-title><h4> Change Visualization Type </h4></v-expansion-panel-title>
                <v-expansion-panel-text>
                    ...
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

      <v-card-actions>
        <v-btn @click="close">Close</v-btn>
      </v-card-actions>

    </v-card>
  </v-dialog>
</template>

<script>
import {useStore as vis_useStore} from "@/stores/visStore";
import vis_parser from "@/components/visualization/vis_parser.vue";

export default {
  name: "fact_view",
  components: {vis_parser},
  setup() {
    const visStore = vis_useStore()
    return {visStore}
  },
  data() {
    return {
      display: true
    }
  },
  watch: {
    display: function () {
      this.close()
    }
  },
  methods: {
    /**
     * closes the fact view
     */
    close() {
      this.visStore.current_fact = null
    }
  }
}
</script>

<style scoped>

</style>