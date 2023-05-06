<template>
    <vis_bar v-if="graph === 'bar'" :vis="vis" :column="column" :width="width"/>
    <vis_pictograph v-if="graph === 'pictograph'" :vis="vis" :column="column" :width="width"/>
    <vis_line v-if="graph === 'density'" :vis="vis" :column="column" :width="width"/>
</template>

<script>
import vis_pictograph from "@/components/visualization/vis_pictograph.vue";
import vis_bar from "@/components/visualization/vis_bar.vue";
import vis_line from "@/components/visualization/vis_line.vue";
import {useVisStore} from "@/stores/visStore";

export default {
    name: "vis_parser",
    props: [
        "vis", "column", "width"
    ],
    setup() {
        const visStore = useVisStore()
        return {visStore}
    },
    components: {vis_bar, vis_pictograph, vis_line},
    computed: {
        graph() {
            return this.vis.graph ? this.vis.graph : this.visStore.default_settings[this.vis.type].graph
        }
    }
}
</script>

<style scoped>

</style>