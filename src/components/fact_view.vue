<template>
    <v-dialog v-model="display">
        <v-card title="Fact View" class="flex mx-auto w-75">
            <vis_parser :description="visStore.current_fact.vis"/>

            <v-expansion-panels class="ma-3">
                <v-expansion-panel>
                    <v-expansion-panel-title><h4> Change Visualization Type </h4></v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <v-radio-group v-model="visStore.current_fact.vis.graph">
                            <v-radio label="bar" value="bar"></v-radio>
                            <v-radio label="pictograph" value="pictograph"></v-radio>
                            <v-radio label="default" value=""></v-radio>
                        </v-radio-group>
                    </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel>
                    <v-expansion-panel-title><h4> Change Color </h4></v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <v-text-field label="Color" v-model="visStore.current_fact.vis.color"/>
                        <v-btn @click="makeDefault_color"> set as default for {{visStore.current_fact.vis.type}} Graphs </v-btn>
                    </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel>
                    <v-expansion-panel-title><h4> Change Title </h4></v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <v-text-field label="Title" v-model="visStore.current_fact.vis.title"/>
                        <v-btn @click="makeDefault_title"> set as default for {{visStore.current_fact.vis.type}} Graphs </v-btn>
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
import {useVisStore} from "@/stores/visStore";
import vis_parser from "@/components/visualization/vis_parser.vue";

export default {
    name: "fact_view",
    components: {vis_parser},
    setup() {
        const visStore = useVisStore()
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
        },
        /**
         * sets the current title as default title for the current visualization type
         */
        makeDefault_title() {
            this.visStore.default_settings[this.visStore.current_fact.vis.type].title = this.visStore.current_fact.vis.title
        },
        /**
         * sets the current color as default color for the current visualization type
         */
        makeDefault_color() {
            this.visStore.default_settings[this.visStore.current_fact.vis.type].color = this.visStore.current_fact.vis.color
        }
    }
}
</script>

<style scoped>

</style>