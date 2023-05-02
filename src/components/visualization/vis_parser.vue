<template>
  <vis_bar v-if="description.graph === 'bar'" :description="description" :width="width"/>
  <vis_pictograph v-if="description.graph === 'pictograph'" :description="description" :width="width"/>
  <vis_line v-if="description.graph === 'density'" :description="description" :width="width"/>
</template>

<script>
import vis_pictograph from "@/components/visualization/vis_pictograph.vue";
import vis_bar from "@/components/visualization/vis_bar.vue";
import vis_line from "@/components/visualization/vis_line.vue";

export default {
  name: "vis_parser",
  props: [
    "description", "width"
  ],
  components: {vis_bar, vis_pictograph, vis_line}
}
</script>

<style scoped>

</style>