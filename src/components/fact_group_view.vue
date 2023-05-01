<template>
    <v-dialog v-model="display">
        <v-card class="flex mx-auto w-75">

            <v-card-title>
                Fact Group View: {{ visStore.current_fact_group.column['name'] }}
            </v-card-title>

            <!-- hints -->
            <div v-if="visStore.current_fact_group.column['significance'].significant_tuples.length === 0">
                <v-icon icon="mdi-alert"/>
                no statistically significant differences
            </div>


            <div class="d-flex pa-1" v-for="vis in visStore.current_fact_group.visList" v-bind:key="vis">
                <v-hover v-slot="{ isHovering, props }">
                    <v-card :elevation="isHovering ? 16 : 2" v-bind="props" @click="show_fact_view(vis)"
                            :class="{ 'on-hover': isHovering }" class="pa-2">
                        <vis_parser :description="vis"/>
                    </v-card>
                </v-hover>
                <v-btn @click="show_fact_view(vis)" class="ml-2">Show</v-btn>
            </div>


            <v-expansion-panels class="ma-3">
                <v-expansion-panel class="ma-1">
                    <v-expansion-panel-title><h4> Statistical Information </h4></v-expansion-panel-title>
                    <v-expansion-panel-text class="text-grey-darken-2">
                        pairs with statistically significant differences:
                        <span v-for="tuple in Object.values(visStore.current_fact_group.column['significance'].significant_tuples)"
                              v-bind:key="tuple">
                                        ({{ tuple[0] !== "" ? tuple[0] : "null" }} -
                                        {{ tuple[1] !== "" ? tuple[1] : "null" }})
                                    </span>
                        <div> Score: {{ visStore.current_fact_group.column['significance'].score.toFixed(2) }}</div>
                    </v-expansion-panel-text>
                </v-expansion-panel>
                <v-expansion-panel class="ma-1">
                    <v-expansion-panel-title><h4> Similar Facts </h4></v-expansion-panel-title>
                    <v-expansion-panel-text>
                        <vis_parser v-if="visStore.current_fact_group.column.type==='continuous'"
                                    :description="{graph: 'density', data: visStore.current_fact_group.column.data,
                      data_with_target_option: visStore.current_fact_group.column.data_with_target_option}"/>
                    </v-expansion-panel-text>
                </v-expansion-panel>
            </v-expansion-panels>

            <v-card-actions>
                <v-btn @click="add"> Add</v-btn>
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
        /**
         * shows fact view for the selected fact
         *
         * @param vis
         */
        show_fact_view(vis) {
            this.visStore.current_fact = {'vis': vis, 'column': this.visStore.current_fact_group.column}
        },
        /**
         * closes the fact group view
         */
        close() {
            this.visStore.current_fact_group = null
        },
        /**
         * adds the fact group to the dashboard
         */
        add() {
            this.visStore.add_dashboard_item(this.visStore.current_fact_group.column, this.visStore.current_fact_group.visList)
            this.close()
        }
    }
}
</script>

<style lang="sass" scoped>
.v-card.on-hover
    cursor: pointer

</style>