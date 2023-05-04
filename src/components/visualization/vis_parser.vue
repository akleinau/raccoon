<template>
    <vis_bar v-if="graph === 'bar'" :description="description" :width="width"/>
    <vis_pictograph v-if="graph === 'pictograph'" :description="description" :width="width"/>
    <vis_line v-if="graph === 'density'" :description="description" :width="width"/>
</template>

<script>
import vis_pictograph from "@/components/visualization/vis_pictograph.vue";
import vis_bar from "@/components/visualization/vis_bar.vue";
import vis_line from "@/components/visualization/vis_line.vue";
import {useVisStore} from "@/stores/visStore";

export default {
    name: "vis_parser",
    props: [
        "description", "width"
    ],
    setup() {
        const visStore = useVisStore()
        return {visStore}
    },
    components: {vis_bar, vis_pictograph, vis_line},
    computed: {
        graph() {
            return this.description.graph ? this.description.graph : this.visStore.default_settings[this.description.type].graph
        }
    }
}
</script>

<style scoped>

</style>