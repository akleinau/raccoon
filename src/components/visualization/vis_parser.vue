<template>
    <vis_bar v-if="description.graph === 'bar'" :data_map="description.data_map"
             :range="description.range"
             :color="description.color"/>
    <vis_pictograph v-if="description.graph === 'pictograph'"
                    :data_map="description.data_map"
                    :range="description.range" :grid="description.grid"
                    :color="description.color"/>
</template>

<script>
import vis_pictograph from "@/components/visualization/vis_pictograph.vue";
import vis_bar from "@/components/visualization/vis_bar.vue";

export default {
    name: "vis_parser",
    props: [
        "description"
    ],
    components: {vis_bar, vis_pictograph}
}
</script>

<style scoped>

</style>