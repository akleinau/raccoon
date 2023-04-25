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
      <v-card title="Risk Factors" class="pa-5">

        <div v-for="column in Store.variable_summaries" v-bind:key="column">
            {{column["name"]}}:
            <span v-for="(value, key) in column['percent_target_option']" v-bind:key="key">
                {{key === ""? "null" : key }}:
                <v-chip class="ma-1 ml-0"> {{(value*100).toFixed(0) + "%"}} </v-chip>
                <vis_bar />

            </span>
        </div>

      </v-card>
    </v-main>

  </v-app>
</template>

<script>
import start_overlay from './components/start_overlay.vue'
import vis_bar from "@/components/vis_bar.vue";
import {useStore} from "@/stores/csvStore";

export default {
  components: {
      vis_bar,
      start_overlay
  },
  setup() {
    const Store = useStore()
    return {Store}
  },
}
</script>

<style scoped></style>
