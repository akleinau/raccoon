<template>
  <vis_bar v-if="description.graph === 'bar'" :data_map="description.data_map"
           :range="description.range" :title="description.title"
           :color="description.color"/>
  <vis_pictograph v-if="description.graph === 'pictograph'"
                  :data_map="description.data_map" :title="description.title"
                  :range="description.range" :grid="description.grid"
                  :color="description.color"/>
  <vis_line v-if="description.graph === 'density'" :data="description.data" :title="description.title"
            :target_data="description.data_with_target_option"/>
</template>

<script>
import vis_pictograph from "@/components/visualization/vis_pictograph.vue";
import vis_bar from "@/components/visualization/vis_bar.vue";
import vis_line from "@/components/visualization/vis_line.vue";

export default {
  name: "vis_parser",
  props: [
    "description"
  ],
  components: {vis_bar, vis_pictograph, vis_line}
}
</script>

<style scoped>

</style>