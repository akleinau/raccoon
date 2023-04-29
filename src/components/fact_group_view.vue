<template>
  <v-dialog v-model="display">
    <v-card title="Fact Group View" class="flex mx-auto w-75">
      <div v-for="vis in visStore.current_fact_group.visList" v-bind:key="vis">
        <div @click="show_fact_view(vis)" class="d-flex ma-2">
          <vis_parser :description="vis"/>
          <v-btn @click="show_fact_view(vis)" class="ml-2">Show</v-btn>
        </div>
      </div>

      <v-expansion-panels class="ma-3">
        <v-expansion-panel>
          <v-expansion-panel-title><h4> Similar Facts </h4></v-expansion-panel-title>
          <v-expansion-panel-text>
            ...
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-card-actions>
        <v-btn @click="add"> Add </v-btn>
        <v-btn @click="close">Close</v-btn>
      </v-card-actions>


    </v-card>
  </v-dialog>
</template>

<script>
import {useStore as vis_useStore} from "@/stores/visStore";
import vis_parser from "@/components/visualization/vis_parser.vue";

export default {
  name: "fact_group_view",
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
    show_fact_view(vis) {
      this.visStore.current_fact = {'vis': vis, 'column': this.visStore.current_fact_group.column}
    },
    close() {
      this.visStore.current_fact_group = null
    },
    add() {
      this.visStore.add_dashboard_item(this.visStore.current_fact_group.column, this.visStore.current_fact_group.visList)
      this.close()
    }
  }
}
</script>

<style scoped>

</style>