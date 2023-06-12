<template>
    <v-dialog scrollable v-model="display" height="100%" width="85%">
        <v-card class="mx-auto w-100 h-100">

            <v-card-title>
                Fact Group View: {{ dashboardStore.current_fact_group.column['label'] }}

                <div v-if="column.riskIncrease">
                    Risk group:
                    {{ column.riskIncrease.name }}
                </div>
            </v-card-title>

            <!-- hints -->
            <div v-if="dashboardStore.current_fact_group.column.significance !== undefined &&
                dashboardStore.current_fact_group.column['significance'].significant_tuples.length === 0">
                <v-icon icon="mdi-alert"/>
                not statistically significant
            </div>
            <div v-if=" dashboardStore.is_recommendation_column(dashboardStore.current_fact_group.column) &&
                dashboardStore.current_fact_group.column.significance !== undefined &&
                dashboardStore.current_fact_group.column['significance'].score['regression'] < 0.001">
                <v-icon icon="mdi-alert"/>
                Adding this factor will not improve risk prediction further.
            </div>
            <div v-if="dashboardStore.current_fact_group.column.occurrence !== undefined &&
            Object.values(dashboardStore.current_fact_group.column.occurrence).filter( b => b < 100).length > 0">
                <v-icon icon="mdi-alert"/>
                Calculated frequencies are less accurate for options with less than 100 people.
            </div>
            <div v-if="dashboardStore.current_fact_group.similar_dashboard_columns !== undefined &&
                dashboardStore.current_fact_group.similar_dashboard_columns.length > 0">
                <v-icon icon="mdi-alert"/>
                Correlates strongly with dashboard items:
                {{
                dashboardStore.current_fact_group.similar_dashboard_columns
                    .map(d => d.column.label + " (" + d.similarity.toFixed(1) + ")")
                    .join(", ")
                }}
            </div>

            <div class="d-flex justify-space-evenly">
                <div>
                    <!-- visualizations -->
                    <div class="d-flex flex-column pb-5">
                        <div class="d-flex justify-space-between mx-2 align-center">
                            <div class="text-grey-darken-2">Click to select</div>
                            <v-btn class="text-blue-darken-3" variant="text" @click="dashboardStore.current_fact = null">clear
                                selection
                            </v-btn>
                        </div>
                        <div class="d-flex flex-column pa-1 ma-auto" v-for="vis in dashboardStore.current_fact_group.visList"
                             v-bind:key="vis">
                            <v-hover v-slot="{ isHovering, props }">
                                <v-card :elevation="isHovering ? 16 : 2" v-bind="props" @click="toggle_fact_view(vis)"
                                        :class="[{ 'on-hover': isHovering },
                                        {'bg-blue-darken-3': dashboardStore.current_fact && dashboardStore.current_fact.vis === vis}]"
                                        class="pa-2">
                                    <div class="bg-white pt-3">
                                        <vis_parser :vis="vis" :column="dashboardStore.current_fact_group.column"
                                                    :width="400"/>
                                    </div>
                                    <div class="d-flex justify-center align-center"
                                         v-if="dashboardStore.current_fact && dashboardStore.current_fact.vis === vis">
                                        <v-btn variant="text" icon="mdi-arrow-up" @click="move_vis_up(vis)"></v-btn>
                                        <v-btn variant="text" icon="mdi-arrow-down" @click="move_vis_down(vis)"></v-btn>
                                        <v-btn variant="text" @click="remove_vis(vis)">remove</v-btn>
                                    </div>
                                </v-card>
                            </v-hover>
                        </div>
                    </div>

                </div>

                <div class="w-50  pr-5">
                    <!-- general tabs -->
                    <h3 class="ml-3 mt-5"> General </h3>
                    <v-text-field label="Label" class="ml-3 mt-2" v-model="dashboardStore.current_fact_group.column.label"
                                  append-inner-icon="mdi-pencil"/>
                    <v-expansion-panels class="mx-3 mb-3" v-model="panels">

                        <!-- statistical information -->
                        <v-expansion-panel v-if="column.significance !== undefined" @click="calculate_similar_facts()">
                            <v-expansion-panel-title><h4> Statistical Information </h4></v-expansion-panel-title>
                            <v-expansion-panel-text class="text-grey-darken-2">
                                statistically significant: {{
                                dashboardStore.current_fact_group.column['significance'].significant_tuples.length > 0 ? "yes" : "no"
                                }}
                                <div v-if="column.significance"> Score ({{ scoreStore.score }}):
                                    {{
                                    dashboardStore.current_fact_group.column['significance'].score[scoreStore.score].toFixed(2)
                                    }}
                                </div>
                                <div v-if="column.correlation_with_target"> Correlation with Target:
                                    {{ dashboardStore.current_fact_group.column['correlation_with_target'].toFixed(2) }}
                                </div>
                                <div class="mt-5">
                                    <b>Correlates strongly with:</b>
                                </div>
                                <div class="d-flex overflow-y-hidden  pb-5">
                                    <div class="d-flex flex-column pa-1"
                                         v-for="item in dashboardStore.current_fact_group.similar_columns"
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

                        <!-- groups -->
                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Groups/ Bins </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <div class="d-flex w-100">
                                    <div class="bg-grey-darken-2 mb-5 rounded-pill" style="width:10px"></div>
                                    <div class="flex-grow-1">
                                        <div v-for="(item,i) in dashboardStore.current_fact_group.column.options"
                                             v-bind:key="i">
                                            <div class="d-flex">
                                                <v-btn @click="add_step(i)" class="mt-2 mr-2"
                                                       v-if="item.range !== undefined"
                                                       variant="text" icon="mdi-arrow-split-horizontal"
                                                       density="compact"></v-btn>
                                                <v-text-field variant="underlined" class="mx-2" density="compact"
                                                              :label="item.type === 'categorical' ? item.name : ''"
                                                              v-model="dashboardStore.current_fact_group.column.options[i].label"/>
                                                <div class="d-flex align-start" density="compact">
                                                    <span class="mt-2 ml-5 mr-1"> Risk group </span>
                                                    <v-checkbox v-model="item.risk_group" density="compact"/>
                                                </div>

                                            </div>
                                            <div class="d-flex justify-start" v-if="option_steps[i] !== undefined">
                                                <div class="bg-grey-darken-2 rounded-e-pill mt-4 mr-2"
                                                     style="width:10px; height:20px"></div>
                                                <v-text-field type="number" style="max-width: 100px" class="mr-2"
                                                              density="compact" variant="outlined"
                                                              v-model="option_steps[i]" @change="update_step(i)"/>
                                                <v-btn @click="remove_step(i)" variant="text" density="compact"
                                                       class="mt-3"
                                                       icon="mdi-delete"></v-btn>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <v-btn @click="recalculate_options" class="mt-2">Recalculate options</v-btn>
                            </v-expansion-panel-text>
                        </v-expansion-panel>

                        <!-- additional visualizations -->
                        <v-expansion-panel>
                            <v-expansion-panel-title><h4> Additional Visualizations </h4></v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <div class="d-flex overflow-y-hidden  pb-5">
                                    <div class="d-flex flex-column pa-1"
                                         v-for="vis in dashboardStore.current_fact_group.additional_vis_list"
                                         v-bind:key="vis">
                                        <v-hover v-slot="{ isHovering, props }">
                                            <v-card :elevation="isHovering ? 16 : 2" v-bind="props"
                                                    @click="add_vis(vis)"
                                                    :class="{ 'on-hover': isHovering }" class="pa-2">
                                                <vis_parser :vis="vis" :column="dashboardStore.current_fact_group.column"
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
                    </v-expansion-panels>
                    <!-- individual vis tabs -->
                    <h3 class="ml-3 text-blue-darken-3" v-if="dashboardStore.current_fact"> Selected </h3>
                    <fact_view v-if="this.dashboardStore.current_fact !== null"/>
                </div>

            </div>

            <div class="d-flex flex-column-reverse h-100">
                <v-card-actions class="w-100 bg-grey-lighten-2 pa-5">
                    <div class="d-flex w-100">
                        <v-btn variant="elevated" @click="close" class="px-9">Close</v-btn>
                        <v-btn variant="elevated" @click="add" prepend-icon="mdi-plus"
                               v-if="!dashboardStore.dashboard_items.find(d => d.name === dashboardStore.current_fact_group.column.name)">
                            Add to dashboard
                        </v-btn>
                        <v-btn variant="elevated" @click="remove" prepend-icon="mdi-minus" v-else> Remove from
                            dashboard
                        </v-btn>
                        <!-- end buttons -->
                        <div class="flex-grow-1 d-flex justify-end">
                            <v-btn variant="text" @click="exclude" prepend-icon="mdi-delete"
                                   v-if="!dashboardStore.excluded_columns.includes(dashboardStore.current_fact_group.column.name)">
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
import fact_view from "@/components/fact_view.vue";
import vis_parser from "@/components/visualization/vis_parser.vue";
import fact_group_preview from "@/components/fact_group_preview.vue";

import {useDashboardStore} from "@/stores/dashboardStore";
import {useCSVStore} from "@/stores/csvStore";
import {useScoreStore} from "@/stores/scoreStore"
import {useSimilarityStore} from "@/stores/similarityStore";
import * as d3 from "d3";

export default {
    name: "fact_group_view",
    components: {vis_parser, fact_group_preview, fact_view},
    setup() {
        const dashboardStore = useDashboardStore()
        const csvStore = useCSVStore()
        const scoreStore = useScoreStore()
        return {dashboardStore, csvStore, scoreStore}
    },
    data() {
        return {
            display: true,
            panels: [],
            option_steps: [],
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
        },
        risk_groups: function () {
            if (this.column) {
                this.csvStore.compute_risk_increase(this.column)
            }
        }
    },
    computed: {
        current_fact_group() {
            return this.dashboardStore.current_fact_group
        },
        column() {
            if (this.dashboardStore.current_fact_group) {
                return this.dashboardStore.current_fact_group.column
            } else return null
        },
        risk_groups() {
            if (this.column) {
                return this.dashboardStore.current_fact_group.column.options.map(o => o.risk_group)
            } else return []

        }
    },
    methods: {
        /**
         * shows fact view for the selected fact
         *
         * @param vis
         */
        toggle_fact_view(vis) {
            if (this.dashboardStore.current_fact && this.dashboardStore.current_fact.vis === vis) {
                this.dashboardStore.current_fact = null
            } else {
                this.dashboardStore.current_fact = {'vis': vis, 'column': this.dashboardStore.current_fact_group.column}
            }
        },
        /**
         * closes the fact group view
         */
        close() {
            this.dashboardStore.current_fact = null
            this.dashboardStore.current_fact_group = null
        },
        /**
         * adds the fact group to the dashboard
         */
        add() {
            this.dashboardStore.add_dashboard_item(this.dashboardStore.current_fact_group.column, this.dashboardStore.current_fact_group.visList)
            this.close()
        },
        /**
         * excludes the fact group from the dashboard
         */
        remove() {
            this.dashboardStore.remove_dashboard_item(this.dashboardStore.current_fact_group.column.name)
            this.close()
        },
        add_option() {
            this.dashboardStore.current_fact_group.column.options.push({
                'name': '0-1',
                'label': '0-1',
                'range': [0, 1]
            })
        },
        /**
         * recalculates the options for the risk factor
         */
        recalculate_options() {
            this.dashboardStore.current_fact_group.column = this.csvStore.recalculate_summary_after_option_change(this.dashboardStore.current_fact_group.column)
        },
        move_vis_up(vis) {
            let index = this.dashboardStore.current_fact_group.visList.indexOf(vis)
            if (index > 0) {
                this.dashboardStore.current_fact_group.visList.splice(index - 1, 0, this.dashboardStore.current_fact_group.visList.splice(index, 1)[0])
                this.dashboardStore.current_fact = {'vis': this.dashboardStore.current_fact_group.visList[index], 'column': this.dashboardStore.current_fact_group.column}
            }
        },
        move_vis_down(vis) {
            let index = this.dashboardStore.current_fact_group.visList.indexOf(vis)
            if (index < this.dashboardStore.current_fact_group.visList.length - 1) {
                this.dashboardStore.current_fact_group.visList.splice(index + 1, 0, this.dashboardStore.current_fact_group.visList.splice(index, 1)[0])
                this.dashboardStore.current_fact = {'vis': this.dashboardStore.current_fact_group.visList[index], 'column': this.dashboardStore.current_fact_group.column}
            }
        },
        /**
         * removes a visualization from the fact group visList
         *
         * @param vis
         */
        remove_vis(vis) {
            this.dashboardStore.current_fact_group.visList = this.dashboardStore.current_fact_group.visList.filter(item => item.type !== vis.type)
            this.dashboardStore.current_fact_group.additional_vis_list.push(vis)
        },
        /**
         * adds a visualization to the fact group visList
         *
         * @param vis
         */
        add_vis(vis) {
            this.dashboardStore.current_fact_group.additional_vis_list = this.dashboardStore.current_fact_group.additional_vis_list.filter(item => item.type !== vis.type)
            this.dashboardStore.current_fact_group.visList.push(vis)
        },
        /**
         * deletes the fact group
         */
        exclude() {
            this.dashboardStore.exclude_column(this.dashboardStore.current_fact_group.column)
            this.close()
        },
        /**
         * includes the fact group
         */
        include() {
            this.dashboardStore.restore_column(this.dashboardStore.current_fact_group.column.name)
            this.close()
        },
        calculate_similar_facts() {
            if (!this.dashboardStore.current_fact_group['similar_columns']) {
                this.dashboardStore.current_fact_group['similar_columns'] = useSimilarityStore().compute_similar_columns(this.dashboardStore.current_fact_group['column'])
            }
        },
        options_to_steps() {
            if (this.dashboardStore.current_fact_group.column.type === 'continuous') {
                let steps = this.dashboardStore.current_fact_group.column.options.filter(d => d.range !== undefined).map(d => d.range[1])
                steps.pop()
                this.option_steps = steps
            } else this.option_steps = []
        },
        update_step(i) {
            this.dashboardStore.current_fact_group.column.options[i].range[1] = this.option_steps[i]
            this.dashboardStore.current_fact_group.column.options[i + 1].range[0] = this.option_steps[i]
            this.recalculate_options()
        },
        remove_step(i) {
            this.dashboardStore.current_fact_group.column.options[i + 1].range[0] = this.dashboardStore.current_fact_group.column.options[i].range[0]
            this.dashboardStore.current_fact_group.column.options.splice(i, 1)
            this.option_steps.splice(i, 1)
            this.recalculate_options()
        },
        add_step(i) {
            let min = (i - 1) < 0 ? this.dashboardStore.current_fact_group.column.options[0].range[0] : this.option_steps[i - 1]
            let max = (i >= this.option_steps.length) ? d3.max(this.dashboardStore.current_fact_group.column.options.filter(d => d.range !== undefined).map(d => d.range[1])) : this.option_steps[i]
            let new_step = +min + (+max - +min) / 2
            this.option_steps.splice(i, 0, new_step)
            this.dashboardStore.current_fact_group.column.options[i].range[0] = new_step
            this.dashboardStore.current_fact_group.column.options.splice(i, 0, {
                'name': min + '-' + new_step,
                'label': min + '-' + new_step,
                'range': [min, new_step]
            })
            this.recalculate_options()
        },
    }
}
</script>

<style lang="sass" scoped>
.v-card.on-hover
  cursor: pointer

</style>