<template>
  <!-- visualization preview -->
    <div class="d-flex">
        <v-hover v-slot="{ isHovering, props }">
            <v-card :elevation="isHovering ? 16 : 2" v-bind="props"
                    :class="{ 'on-hover': isHovering}"
                    @click="show_fact_group_view">
                <h4 class="ml-4 mt-4 d-flex flex-column align-center w-100">{{ column.label }}</h4>

                <!-- hint when column is excluded -->
                <div v-if="visStore.excluded_columns.includes(column.name)"
                     class="ml-4 mt-4 d-flex justify-center w-100 text-yellow-darken-4">
                    <v-icon icon="mdi-alert" class="mr-2"/> [Excluded from risk factor calculations]
                </div>

                <!--visualization preview -->
                <div class="pa-2 mr-2 d-flex align-center" :class="{ 'flex-column': vertical }">
                    <div v-for="vis in visList" v-bind:key="vis">
                        <vis_parser :vis="vis" :column="column" :width="300" :preview="true"/>
                    </div>
                </div>
            </v-card>
        </v-hover>
    </div>
</template>

<script>
import vis_parser from "@/components/visualization/vis_parser.vue";
import {useVisStore} from "@/stores/visStore";
import {useCSVStore} from "@/stores/csvStore";

export default {
    name: "fact_group",
    components: {vis_parser},
    props: [
        "visList",
        "column",
        "vertical",
        "height",
        "width"
    ],
    setup() {
        const visStore = useVisStore()
        const csvStore = useCSVStore()
        return {csvStore, visStore}
    },
    methods: {
        /**
         * shows the fact group view for the selected fact group
         */
        show_fact_group_view() {
            this.visStore.current_fact_group = {'column': this.column,
                'visList': this.visList,
                'additional_vis_list': this.visStore.generate_additional_fact_visList(this.column)}
        }
    }
}
</script>

<style lang="sass" scoped>
.v-card.on-hover
  cursor: pointer

</style>