<template>
    <vis_bar v-if="graph === 'bar'" :vis="vis" :column="column" :width="width" :preview="preview" :key="rerender"/>
    <vis_pictograph v-if="graph === 'pictograph'" :vis="vis" :column="column" :width="width" :preview="preview" :key="rerender"/>
    <vis_line v-if="graph === 'density'" :vis="vis" :column="column" :width="width" :key="rerender"/>
    <vis_text v-if="graph === 'text'" :vis="vis" :column="column" :width="width" :key="rerender"/>
</template>

<script>
import vis_pictograph from "@/components/visualization/vis_pictograph.vue";
import vis_bar from "@/components/visualization/vis_bar.vue";
import vis_line from "@/components/visualization/vis_line.vue";
import vis_text from "@/components/visualization/vis_text.vue";
import {useVisStore} from "@/stores/visStore";
import {useCSVStore} from "@/stores/csvStore";

export default {
    name: "vis_parser",
    props: [
        "vis", "column", "width", "preview"
    ],
    setup() {
        const visStore = useVisStore()
        const csvStore = useCSVStore()
        return {visStore, csvStore}
    },
    components: {vis_bar, vis_pictograph, vis_line, vis_text},
    data() {
      return {
          rerender: 0
      }
    },
    computed: {
        graph() {
            return this.vis.graph ? this.vis.graph : this.visStore.default_settings[this.vis.type].graph
        },
        target() {
            return this.csvStore.target
        }
    },
    watch: {
        column: {
            handler: function () {
                this.rerender ++
            }
            ,
            deep: true
        },
        vis: {
            handler: function () {
                this.rerender ++
            }
            ,
            deep: true
        },
        target: {
            handler: function () {
                this.rerender ++
            }
            ,
            deep: true
        }
    },
}
</script>

<style scoped>

</style>