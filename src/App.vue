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
                Percentage of people with a variable option who have fatty liver
                <div v-for="column in Store.variable_summaries" v-bind:key="column" class="pt-4">
                    <h4> {{ column["name"] }} </h4>
                    <div class="d-flex flex-row">
                        <vis_bar :data_map="column['occurrence']" :range="[0,this.Store.csv.length]" color="royalblue"/>
                        <vis_bar :data_map="column['percent_target_option']" range="percent" color="MediumVioletRed"/>
                    </div>
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
