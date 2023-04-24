<template>
  <v-app>
    <StartOverlay/>

    <v-app-bar>
      <v-app-bar-title>Raccoon</v-app-bar-title>
      <template v-slot:append>
        <v-btn @click="this.Store.start= true">Reset</v-btn>
      </template>
    </v-app-bar>
    <v-main>
      <v-card title="Risk Factors" class="pa-5">

        <div v-for="column in Store.columns" v-bind:key="column"> {{ column }}</div>

      </v-card>
    </v-main>

  </v-app>
</template>

<script>
import StartOverlay from './components/StartOverlay.vue'
import {useStore} from "@/stores/csvStore";

export default {
  components: {
    StartOverlay
  },
  setup() {
    const Store = useStore()
    return {Store}
  }
}
</script>

<style scoped></style>
