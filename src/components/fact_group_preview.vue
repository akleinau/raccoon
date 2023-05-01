<template>
        <!-- visualizations -->
        <div class="d-flex mt-2">
            <v-hover v-slot="{ isHovering, props }">
                <v-card :elevation="isHovering ? 16 : 2" v-bind="props" :class="{ 'on-hover': isHovering }"
                        @click="show_fact_group_view" class="pa-2 d-flex flex-column align-center" >
                    <h4>{{column.name}}</h4>
                    <div v-for="vis in visList" v-bind:key="vis">
                        <vis_parser :description="vis"/>
                    </div>
                </v-card>
            </v-hover>
        </div>
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

<style lang="sass" scoped>
.v-card.on-hover
  cursor: pointer

</style>