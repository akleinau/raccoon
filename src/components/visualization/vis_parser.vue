<template>
    <vis_bar v-if="graph === 'bar'" @svg="saveSVG"
             :vis="full_vis" :column="column" :width="width" :preview="preview" :key="rerender"/>
    <vis_pictograph v-if="graph === 'pictograph'" @svg="saveSVG"
                    :vis="full_vis" :column="column" :width="width" :preview="preview" :key="rerender"/>
    <vis_line v-if="graph === 'density'" :vis="full_vis" :column="column" :width="width" :key="rerender"/>
    <vis_text v-if="graph === 'text'" :vis="full_vis" :column="column" :width="width" :preview="preview" :key="rerender"/>
    <vis_pie v-if="graph === 'pie'" @svg="saveSVG"
             :vis="full_vis" :column="column" :width="width" :preview="preview" :key="rerender"/>
    <vis_multiple_pie v-if="graph === 'multiPie'" @svg="saveSVG"
                      :vis="full_vis" :column="column" :width="width" :preview="preview" :key="rerender"/>
</template>

<script>
import vis_pictograph from "@/components/visualization/vis_pictograph.vue";
import vis_bar from "@/components/visualization/vis_bar.vue";
import vis_line from "@/components/visualization/vis_line.vue";
import vis_text from "@/components/visualization/vis_text.vue";
import vis_pie from "@/components/visualization/vis_pie.vue";
import {useDashboardStore} from "@/stores/dashboardStore";
import {useDataStore} from "@/stores/dataStore";
import {useAnnotationStore} from "@/stores/annotationStore";
import vis_multiple_pie from "@/components/visualization/vis_multiple_pie.vue";
import {useHelperStore} from "@/stores/helperStore";

export default {
    name: "vis_parser",
    props: [
        "vis", "column", "width", "preview", "index"
    ],
    setup() {
        const dashboardStore = useDashboardStore()
        const dataStore = useDataStore()
        const annotationStore = useAnnotationStore()
        const helperStore = useHelperStore()
        return {dashboardStore, dataStore, annotationStore, helperStore}
    },
    components: {vis_bar, vis_pictograph, vis_line, vis_text, vis_pie, vis_multiple_pie},
    data() {
        return {
            rerender: 0
        }
    },
    computed: {
        graph() {
            return this.vis.graph ? this.vis.graph : this.dashboardStore.default_settings[this.vis.type].graph
        },
        target() {
            return this.dataStore.target
        },
        full_vis() {
            let vis = JSON.parse((JSON.stringify(this.vis)))
            let type_attr = ["title", "range", "grid", "axis", "detailLevel", "icon", "ratio"]
            type_attr.forEach(a => {
                if (!vis[a]) {
                    vis[a] = this.dashboardStore.default_settings[vis.type][a]
                }
            })

            //colors
            if (!vis["background"]) {
                if (this.dashboardStore.default_settings[vis.type]["background"] !== undefined) {
                    vis["background"] = this.dashboardStore.default_settings[vis.type]["background"]
                }
                else {
                    vis["background"] = this.dashboardStore.default_colors.background
                }
            }
            if (vis["color"] === null || vis["color"] === undefined) {
                if (vis.graph === "text") {
                    vis["color"] = this.dashboardStore.default_colors.text
                } else {
                    vis["color"] = this.dashboardStore.default_settings[vis.type]["color"]
                }
            }
            vis["color"] = this.dashboardStore.get_color(vis["color"])

            //font
            if (!vis["font_family"]) {
                vis["font_family"] = this.dashboardStore.default_colors["font_family"]
            }

            //annotations
            if (!this.preview && !vis["annotation"]) {
                let annotations = this.annotationStore.compute_annotations(this.column, this.vis.type)
                if (annotations.length > 1) { //greater than 1 because of the custom annotation
                    vis["annotation"] = annotations[0]
                }
                else {
                    vis["annotation"] = "None"
                }
            }

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

            if (vis["annotation"] && vis["annotation"] !== "None") {
                vis["annotation"] = this.wrap_text(vis["annotation"])
            }

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
    methods: {
        /**
         * add line breaks to annotation text
         *
         * @param annotation
         * @returns {*}
         */
        wrap_text(annotation) {
            const MAX_LENGTH = 30

            //parse text to get full labels instead of variables
            let all_elements = this.helperStore.parse_text(annotation.text, this.column)

            //create new lines
            let new_lines = []
            let current_line = []
            let current_line_length = 0
            all_elements.forEach(e => {
                //if tspan is too long, split up by word and try again
                if (current_line_length + e.text.length > MAX_LENGTH) {
                    //split up line
                    e.text.split(" ").forEach(s => {
                        if (current_line_length + s.length > MAX_LENGTH) {
                            new_lines.push(current_line)
                            current_line = [{text: s, color: e.color}]
                            current_line_length = s.length
                        }
                        else {
                            current_line.push({text: " " + s, color: e.color})
                            current_line_length += s.length + 1
                        }
                    })
                }
                //if tspan is not too long, add to current line
                else {
                    current_line.push(e)
                    current_line_length += e.text.length
                }
            })
            new_lines.push(current_line)

            annotation.text = new_lines
            return annotation
        },
        /**
         * save svgs for export
         * @param svg
         */
        saveSVG(svg) {
            if (this.index !== undefined) {
                this.dashboardStore.current_fact_group_svgs[this.index] = svg
            }

        }
    }
}
</script>

<style scoped>

</style>