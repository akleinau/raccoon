<template>
  <div :style="'width: ' + width + 'px; font-size: ' + font_size + 'rem; color: ' + color"> {{vis.text}} </div>
</template>

<script>
import {useVisStore} from "@/stores/visStore";
export default {
    name: "vis_text",
    props: [
        "vis", "column", "width"
    ],
    setup() {
        const visStore = useVisStore()
        return {visStore}
    },
    computed: {
        font_size() {
            return this.vis.font_size ? this.vis.font_size : this.visStore.default_settings[this.vis.type].font_size
        },
        color() {
            return this.vis.color ? this.vis.color : this.visStore.default_settings[this.vis.type].color
        },
    }
}
</script>

<style scoped>

</style>