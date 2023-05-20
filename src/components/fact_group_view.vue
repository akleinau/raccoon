<template>
    <v-dialog scrollable v-model="display" height="100%" width="80%">
        <v-card class="mx-auto w-100 h-100">

            <v-card-title>
                Fact Group View: {{ visStore.current_fact_group.column['label'] }}
            </v-card-title>

            <!-- hints -->
            <div v-if="visStore.current_fact_group.column.significance !== undefined &&
                visStore.current_fact_group.column['significance'].significant_tuples.length === 0">
                <v-icon icon="mdi-alert"/>
                no statistically significant differences
            </div>
            <div v-if="Object.values(visStore.current_fact_group.column.occurrence).filter( b => b < 100).length > 0">
                <v-icon icon="mdi-alert"/>
                Calculated frequencies are less accurate for options with less than 100 people.
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
                                           v-if="visStore.current_fact_group.column.significance !== undefined">
                            <v-expansion-panel-title><h4> Statistical Information </h4></v-expansion-panel-title>
                            <v-expansion-panel-text class="text-grey-darken-2">
                                pairs with statistically significant differences:
                                <span v-for="tuple in Object.values(visStore.current_fact_group.column['significance'].significant_tuples)"
                                      v-bind:key="tuple">
                                        ({{ tuple[0] !== "" ? tuple[0] : "null" }} -
                                        {{ tuple[1] !== "" ? tuple[1] : "null" }})
                                    </span>
                                <div> Score:
                                    {{
                                    visStore.current_fact_group.column['significance'].score[scoreStore.score].toFixed(2)
                                    }}
                                </div>
                                <div> Risk Increase: {{ visStore.current_fact_group.column['riskIncrease'] }}</div>
                                <div> Correlation with Target: {{visStore.current_fact_group.column['correlation_with_target']}}</div>
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
                                <div class="ml-2 mb-2">Change options:</div>
                                <div v-for="(item,i) in visStore.current_fact_group.column.options" v-bind:key="i"
                                     class="d-flex">
                                    <v-text-field variant="outlined" :label="'label of: ' + item.name"
                                                  v-model="visStore.current_fact_group.column.options[i].label"/>
                                    <v-text-field class="px-5" type="number" label="min"
                                                  v-if="visStore.current_fact_group.column.options[i].range !== undefined"
                                                  v-model="visStore.current_fact_group.column.options[i].range[0]"/>
                                    <v-text-field type="number" label="max"
                                                  v-if="visStore.current_fact_group.column.options[i].range !== undefined"
                                                  v-model="visStore.current_fact_group.column.options[i].range[1]"/>
                                    <v-btn @click="remove_option(item)" class="mt-2">Remove</v-btn>
                                </div>
                                <v-btn @click="add_option" class="mt-2">Add option</v-btn>
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
            panels: []
        }
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
        remove_option(option) {
            this.visStore.current_fact_group.column.options = this.visStore.current_fact_group.column.options.filter(item => item.name !== option.name)
            this.recalculate_options()
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
        }
    }
}
</script>

<style lang="sass" scoped>
.v-card.on-hover
  cursor: pointer

</style>