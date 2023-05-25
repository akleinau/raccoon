<template>
    <vis_bar v-if="graph === 'bar'" :vis="full_vis" :column="column" :width="width" :preview="preview" :key="rerender"/>
    <vis_pictograph v-if="graph === 'pictograph'" :vis="full_vis" :column="column" :width="width" :preview="preview"
                    :key="rerender"/>
    <vis_line v-if="graph === 'density'" :vis="full_vis" :column="column" :width="width" :key="rerender"/>
    <vis_text v-if="graph === 'text'" :vis="full_vis" :column="column" :width="width" :key="rerender"/>
    <vis_pie v-if="graph === 'pie'" :vis="full_vis" :column="column" :width="width" :preview="preview" :key="rerender"/>
    <vis_multiple_pie v-if="graph === 'multiPie'" :vis="full_vis" :column="column" :width="width" :preview="preview" :key="rerender"/>
</template>

<script>
import vis_pictograph from "@/components/visualization/vis_pictograph.vue";
import vis_bar from "@/components/visualization/vis_bar.vue";
import vis_line from "@/components/visualization/vis_line.vue";
import vis_text from "@/components/visualization/vis_text.vue";
import vis_pie from "@/components/visualization/vis_pie.vue";
import {useVisStore} from "@/stores/visStore";
import {useCSVStore} from "@/stores/csvStore";
import vis_multiple_pie from "@/components/visualization/vis_multiple_pie.vue";

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
    components: {vis_bar, vis_pictograph, vis_line, vis_text, vis_pie, vis_multiple_pie},
    data() {
        return {
            rerender: 0,
        }
    },
    computed: {
        graph() {
            return this.vis.graph ? this.vis.graph : this.visStore.default_settings[this.vis.type].graph
        },
        target() {
            return this.csvStore.target
        },
        full_vis() {
            let vis = JSON.parse((JSON.stringify(this.vis)))
            let type_attr = ["title", "range", "grid", "axis"]
            type_attr.forEach(a => {
                if (!vis[a]) {
                    vis[a] = this.visStore.default_settings[vis.type][a]
                }
            })

            //colors
            if (!vis["background"]) {
                vis["background"] = this.visStore.default_colors.background
            }
            if (vis["color"] === null || vis["color"] === undefined) {
                if (vis.type === "text") {
                    vis["color"] = this.visStore.default_colors.text
                } else {
                    vis["color"] = this.visStore.default_settings[vis.type]["color"]
                }
            }
            vis["color"] = this.visStore.get_color(vis["color"])


            vis = JSON.parse((JSON.stringify(vis))) //remove all possible direkt references to default settings

            let text_attr = ["text", "title", "axis"]
            text_attr.forEach(a => {
                if (vis[a]) {
                    vis[a] = vis[a].map(t => {
                        t.color = t.color.replace("$color", vis.color)
                        return t
                    })
                }
            })

            return vis
        }
    },
    watch: {
        column: {
            handler: function () {
                this.rerender++
            }
            ,
            deep: true
        },
        full_vis: {
            handler: function () {
                this.rerender++
            }
            ,
            deep: true
        },
        target: {
            handler: function () {
                this.rerender++
            }
            ,
            deep: true
        }
    },
}
</script>

<style scoped>

</style>