<template>
    <v-dialog scrollable v-model="display" height="100%" width="80%">
        <v-card class="mx-auto w-100 h-100">

            <v-card-title>
                Fact Group View: {{ visStore.current_fact_group.column['label'] }}

                <div v-if="column.riskIncrease">
                    Risk Options:
                    {{ column.riskIncrease.name }}
                </div>
            </v-card-title>

            <!-- hints -->
            <div v-if="visStore.current_fact_group.column.significance !== undefined &&
                visStore.current_fact_group.column['significance'].significant_tuples.length === 0">
                <v-icon icon="mdi-alert"/>
                no statistically significant differences
            </div>
            <div v-if=" visStore.is_recommendation_column(visStore.current_fact_group.column) &&
                visStore.current_fact_group.column.significance !== undefined &&
                visStore.current_fact_group.column['significance'].score['regression'] < 0.001">
                <v-icon icon="mdi-alert"/>
                Adding this factor will not improve risk prediction further.
            </div>
            <div v-if="visStore.current_fact_group.column.occurrence !== undefined &&
            Object.values(visStore.current_fact_group.column.occurrence).filter( b => b < 100).length > 0">
                <v-icon icon="mdi-alert"/>
                Calculated frequencies are less accurate for options with less than 100 people.
            </div>
            <div v-if="visStore.current_fact_group.similar_dashboard_columns !== undefined &&
                visStore.current_fact_group.similar_dashboard_columns.length > 0">
                <v-icon icon="mdi-alert"/>
                Correlates strongly with dashboard items:
                {{
                visStore.current_fact_group.similar_dashboard_columns
                    .map(d => d.column.label + " (" + d.similarity.toFixed(1) + ")")
                    .join(", ")
                }}
            </div>

            <div class="d-flex justify-space-evenly">
                <div>
                    <!-- visualizations -->
                    <div class="d-flex flex-column pb-5">
                        <div class="d-flex flex-column pa-1 ma-auto" v-for="vis in visStore.current_fact_group.visList"
                             v-bind:key="vis">
                            <v-hover v-slot="{ isHovering, props }">
                                <v-card :elevation="isHovering ? 16 : 2" v-bind="props" @click="show_fact_view(vis)"
                                        :class="{ 'on-hover': isHovering }" class="pa-2">
                                    <vis_parser :vis="vis" :column="visStore.current_fact_group.column" :width="400"/>
                                </v-card>
                            </v-hover>
                            <div class="d-flex w-100 flex-wrap">
                                <v-btn variant="tonal" class="flex-grow-1 mx-1" @click="remove_vis(vis)">Remove</v-btn>
                            </div>
                        </div>
                    </div>

                </div>

                <div class="w-50  pr-5">
                    <!-- option tabs -->
                    <v-expansion-panels class="ma-3" v-model="panels">
                        <v-expansion-panel class="ma-1"
                                           v-if="column.significance !== undefined">
                            <v-expansion-panel-title><h4> Statistical Information </h4></v-expansion-panel-title>
                            <v-expansion-panel-text class="text-grey-darken-2">
                                options with statistically significant differences:
                                <span v-for="tuple in Object.values(visStore.current_fact_group.column['significance'].significant_tuples)"
                                      v-bind:key="tuple">
                                        {{ tuple !== "" ? tuple : "null" }},
                                    </span>
                                <div v-if="column.significance"> Score:
                                    {{
                                    visStore.current_fact_group.column['significance'].score[scoreStore.score].toFixed(2)
                                    }}
                                </div>
                                <div v-if="column.riskIncrease"> Risk Increase:
                                    {{ visStore.current_fact_group.column['riskIncrease'] }}
                                </div>
                                <div v-if="column.correlation_with_target"> Correlation with Target:
                                    {{ visStore.current_fact_group.column['correlation_with_target'] }}
                                </div>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                        <v-expansion-panel class="ma-1">
                            <v-expansion-panel-title><h4> Similar Facts </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <div class="d-flex overflow-y-hidden  pb-5">
                                    <div class="d-flex flex-column pa-1"
                                         v-for="vis in visStore.current_fact_group.additional_vis_list"
                                         v-bind:key="vis">
                                        <v-hover v-slot="{ isHovering, props }">
                                            <v-card :elevation="isHovering ? 16 : 2" v-bind="props"
                                                    @click="show_fact_view(vis)"
                                                    :class="{ 'on-hover': isHovering }" class="pa-2">
                                                <vis_parser :vis="vis" :column="visStore.current_fact_group.column"
                                                            :width="300"
                                                            :preview="true"/>
                                            </v-card>
                                        </v-hover>
                                        <div class="d-flex w-100 flex-wrap">
                                            <v-btn variant="tonal" class="flex-grow-1 mx-1" @click="add_vis(vis)">Add
                                            </v-btn>
                                        </div>
                                    </div>
                                </div>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                        <v-expansion-panel class="ma-1" @click="calculate_similar_facts()">
                            <v-expansion-panel-title><h4> Similar Variables </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <div class="d-flex overflow-y-hidden  pb-5">
                                    <div class="d-flex flex-column pa-1"
                                         v-for="item in visStore.current_fact_group.similar_columns"
                                         v-bind:key="item">
                                        <fact_group_preview style="height:400px" class="pa-2" :visList="item.visList"
                                                            :column="item.column" :vertical="true"/>
                                        <div class="d-flex pl-2 align-self-center">Correlation:
                                            {{ item.similarity.toFixed(2) }}
                                        </div>
                                    </div>
                                </div>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                        <v-expansion-panel class="ma-1">
                            <v-expansion-panel-title><h4> Adapt </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <div class="ml-2">Change risk factor label:</div>
                                <v-text-field label="Label" v-model="visStore.current_fact_group.column.label"/>
                                <div class="ml-2 mb-3">Change options:</div>
                                <div class="d-flex w-100">
                                    <div class="bg-grey-darken-2 mr-2 mb-5 rounded-pill" style="width:10px"></div>
                                    <div class="flex-grow-1">
                                        <div v-for="(item,i) in visStore.current_fact_group.column.options"
                                             v-bind:key="i">
                                            <div class="d-flex">
                                                <v-text-field variant="outlined" :label="item.name" class="mr-2"
                                                              density="compact"
                                                              v-model="visStore.current_fact_group.column.options[i].label"/>
                                                <v-btn @click="add_step(i)" class="mt-2"
                                                       v-if="item.range !== undefined"
                                                       variant="text" icon="mdi-arrow-split-horizontal"
                                                       density="compact"></v-btn>
                                            </div>
                                            <div class="d-flex justify-center" v-if="option_steps[i] !== undefined">
                                                <v-text-field type="number" style="max-width: 100px" class="mr-2"
                                                              density="compact"
                                                              v-model="option_steps[i]" @change="update_step(i)"/>
                                                <v-btn @click="remove_step(i)" variant="text" density="compact"
                                                       class="mt-1"
                                                       icon="mdi-delete"></v-btn>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <v-btn @click="recalculate_options" class="mt-2">Recalculate options</v-btn>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </div>

            </div>

            <div class="d-flex flex-column-reverse h-100">
                <v-card-actions class="w-100 bg-grey-lighten-2 pa-5">
                    <div class="d-flex w-100">
                        <v-btn variant="elevated" @click="close" class="px-9">Close</v-btn>
                        <v-btn variant="elevated" @click="add" prepend-icon="mdi-plus"
                               v-if="!visStore.dashboard_items.find(d => d.name === visStore.current_fact_group.column.name)">
                            Add to dashboard
                        </v-btn>
                        <v-btn variant="elevated" @click="remove" prepend-icon="mdi-minus" v-else> Remove from
                            dashboard
                        </v-btn>
                        <!-- end buttons -->
                        <div class="flex-grow-1 d-flex justify-end">
                            <v-btn variant="text" @click="exclude" prepend-icon="mdi-delete"
                                   v-if="!visStore.excluded_columns.includes(visStore.current_fact_group.column.name)">
                                Exclude
                            </v-btn>
                            <v-btn variant="elevated" @click="include" prepend-icon="mdi-restore" v-else>restore</v-btn>
                        </div>
                    </div>
                </v-card-actions>
            </div>


        </v-card>
    </v-dialog>
</template>

<script>
import {useVisStore} from "@/stores/visStore";
import vis_parser from "@/components/visualization/vis_parser.vue";
import {useCSVStore} from "@/stores/csvStore";
import {useScoreStore} from "@/stores/scoreStore"
import fact_group_preview from "@/components/fact_group_preview.vue";
import {useSimilarityStore} from "@/stores/similarityStore";
import * as d3 from "d3";

export default {
    name: "fact_group_view",
    components: {vis_parser, fact_group_preview},
    setup() {
        const visStore = useVisStore()
        const csvStore = useCSVStore()
        const scoreStore = useScoreStore()
        return {visStore, csvStore, scoreStore}
    },
    data() {
        return {
            display: true,
            panels: [],
            option_steps: []
        }
    },
    created() {
        this.options_to_steps()
    },
    watch: {
        display: function () {
            this.close()
        },
        current_fact_group: function () {
            this.panels = []
        }
    },
    computed: {
        current_fact_group() {
            return this.visStore.current_fact_group
        },
        column() {
            return this.visStore.current_fact_group.column
        },
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
        },
        /**
         * excludes the fact group from the dashboard
         */
        remove() {
            this.visStore.remove_dashboard_item(this.visStore.current_fact_group.column.name)
            this.close()
        },
        add_option() {
            this.visStore.current_fact_group.column.options.push({
                'name': '0-1',
                'label': '0-1',
                'range': [0, 1]
            })
        },
        /**
         * recalculates the options for the risk factor
         */
        recalculate_options() {
            this.visStore.current_fact_group.column = this.csvStore.recalculate_summary_after_option_change(this.visStore.current_fact_group.column)
        },
        /**
         * removes a visualization from the fact group visList
         *
         * @param vis
         */
        remove_vis(vis) {
            this.visStore.current_fact_group.visList = this.visStore.current_fact_group.visList.filter(item => item.type !== vis.type)
            this.visStore.current_fact_group.additional_vis_list.push(vis)
        },
        /**
         * adds a visualization to the fact group visList
         *
         * @param vis
         */
        add_vis(vis) {
            this.visStore.current_fact_group.additional_vis_list = this.visStore.current_fact_group.additional_vis_list.filter(item => item.type !== vis.type)
            this.visStore.current_fact_group.visList.push(vis)
        },
        /**
         * deletes the fact group
         */
        exclude() {
            this.visStore.exclude_column(this.visStore.current_fact_group.column)
            this.close()
        },
        /**
         * includes the fact group
         */
        include() {
            this.visStore.restore_column(this.visStore.current_fact_group.column.name)
            this.close()
        },
        calculate_similar_facts() {
            if (!this.visStore.current_fact_group['similar_columns']) {
                this.visStore.current_fact_group['similar_columns'] = useSimilarityStore().compute_similar_columns(this.visStore.current_fact_group['column'])
            }
        },
        options_to_steps() {
            if (this.visStore.current_fact_group.column.type === 'continuous') {
                let steps = this.visStore.current_fact_group.column.options.filter(d => d.range !== undefined).map(d => d.range[1])
                steps.pop()
                this.option_steps = steps
            } else this.option_steps = []
        },
        update_step(i) {
            this.visStore.current_fact_group.column.options[i].range[1] = this.option_steps[i]
            this.visStore.current_fact_group.column.options[i + 1].range[0] = this.option_steps[i]
            this.recalculate_options()
        },
        remove_step(i) {
            this.visStore.current_fact_group.column.options[i + 1].range[0] = this.visStore.current_fact_group.column.options[i].range[0]
            this.visStore.current_fact_group.column.options.splice(i, 1)
            this.option_steps.splice(i, 1)
            this.recalculate_options()
        },
        add_step(i) {
            let min = (i - 1) < 0 ? this.visStore.current_fact_group.column.options[0].range[0] : this.option_steps[i - 1]
            let max = (i >= this.option_steps.length) ? d3.max(this.visStore.current_fact_group.column.options.filter(d => d.range !== undefined).map(d => d.range[1])) : this.option_steps[i]
            let new_step = +min + (+max - +min) / 2
            this.option_steps.splice(i, 0, new_step)
            this.visStore.current_fact_group.column.options[i].range[0] = new_step
            this.visStore.current_fact_group.column.options.splice(i, 0, {
                'name': min + '-' + new_step,
                'label': min + '-' + new_step,
                'range': [min, new_step]
            })
            this.recalculate_options()
        }
    }
}
</script>

<style lang="sass" scoped>
.v-card.on-hover
  cursor: pointer

</style>