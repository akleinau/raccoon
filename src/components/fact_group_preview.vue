<template>
    <v-sheet border class="ma-2">
        <!-- visualizations -->
        <div class="d-flex flex-row mt-2">
            <div @click="show_fact_group_view">
                <span class="d-flex justify-center"> <b>#people per option</b></span>
                <vis_parser :description="visList[0]"/>
            </div>
            <div @click="show_fact_group_view">
                <span class="d-flex justify-center">
                    <b>Proportion of people per option who have
                      <span style="color:darkblue">
                          {{ csvStore.target_column }} : {{ csvStore.target_option }}
                      </span>
                    </b>
                </span>
                <vis_parser :description="visList[1]"/>
            </div>
            <v-btn class="ma-2 ml-5" color="indigo-darken-3" @click="show_fact_group_view"> Show
            </v-btn>
          <v-btn v-if="!visStore.dashboard_items.map(item => item.name).includes(column.name)"
                   class="ma-2 ml-5" color="indigo-darken-3" @click="visStore.add_dashboard_item(column, visList)"> Add
            </v-btn>
            <v-btn v-if="visStore.dashboard_items.map(item => item.name).includes(column.name)"
                   class="ma-2 ml-5" color="indigo-darken-3" @click="visStore.remove_dashboard_item(column.name)"> Remove
            </v-btn>
        </div>
    </v-sheet>
</template>

<script>
import vis_parser from "@/components/visualization/vis_parser.vue";
import {useStore as vis_useStore} from "@/stores/visStore";
import {useStore as csv_useStore} from "@/stores/csvStore";

export default {
    name: "fact_group",
    components: {vis_parser},
    props: [
        "visList",
        "column"
    ],
    setup() {
        const visStore = vis_useStore()
        const csvStore = csv_useStore()
        return {csvStore, visStore}
    },
  methods: {
    /**
     * shows the fact group view for the selected fact group
     */
    show_fact_group_view() {
            this.visStore.current_fact_group = {'column': this.column, 'visList': this.visList}
        }
    }
}
</script>

<style scoped>

</style>