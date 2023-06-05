<template>
    <div ref="container"/>
</template>

<script>
import * as d3 from "d3";
import {useHelperStore} from "@/stores/helperStore";
import {useVisStore} from "@/stores/visStore";
import {useVisHelperStore} from "@/stores/visHelperStore";

export default {
    name: "vis_bar",
    props: [
        "vis", "column", "width", "preview"
    ],
    setup() {
        const helperStore = useHelperStore()
        const visStore = useVisStore()
        const visHelperStore = useVisHelperStore()
        return {helperStore, visStore, visHelperStore}
    },
    methods: {
        /**
         * returns value as pretty text
         *
         * @param value
         * @returns {*|string}
         */
        get_value_text(value) {
            if (this.vis.range === "percent") {
                return (value * 100).toFixed(0) + "%"
            }
            if (this.vis.detailLevel === "percent") {
                return (value / this.visHelperStore.get_range(this.vis)[1] * 100).toFixed(0) + "%"
            }
            return value
        },
        data_to_vis() {
            let data = this.vis.data
            if (this.vis.data_map !== undefined) {
                data = this.visHelperStore.datamap_to_array(this.column[this.vis.data_map], this.column.options)
            }

            this.visualize(data)
        },
        /**
         * visualizes the data
         *
         * @param data
         */
        visualize(data) {
            let startBarX = this.helperStore.get_max_length(this.column.options.map(a => a.label)) * 10 + 30
            if (this.preview && startBarX > 100) {
                startBarX = 100
            }
            let margin_bottom = this.preview ? 20 : 50
            let margin = {top: 30, bottom: margin_bottom, left: startBarX, right: 5}
            let annotation_width = this.preview ? 0 : this.vis.annotation === "None" ? 0 : 300

            let width = (this.width ? this.width : 300) - margin.right
            let height = data.length * (width / 10)


            let svg = d3.create("svg")
                .attr("width", width + margin.left + margin.right + annotation_width)
                .attr("height", height + margin.bottom + margin.top)
                .attr("viewBox", [0, 0, width + margin.left + margin.right + annotation_width, height + margin.bottom + margin.top])

            let x = d3.scaleLinear()
                .domain(this.visHelperStore.get_range(this.vis))
                .range([margin.left, width + margin.left])

            let y = d3.scaleBand()
                .domain(data.map(d => d.name))
                .range([margin.top, height + margin.top])
                .padding(0.2)

            //background
            svg.append("rect")
                .attr("x", margin.left)
                .attr("y", margin.top)
                .attr("width", width)
                .attr("height", height)
                .attr("fill", this.vis.background.color)
                .attr("stroke", this.vis.background.stroke)
                .attr("stroke-width", 2)

            svg.selectAll("bar")
                .data(data)
                .join("rect")
                .attr("x", margin.left)
                .attr("y", d => y(d.name))
                .attr("width", d => x(d.value) - x(0))
                .attr("height", y.bandwidth())
                .attr("fill", this.vis.color)

            svg.selectAll("textName")
                .data(data)
                .join("text")
                .attr("x", margin.left - 5)
                .attr("y", d => y(d.name))
                .text(d => this.visHelperStore.get_column_label(d, this.column, this.preview))
                .style("text-anchor", "end")
                .attr("dy", y.bandwidth() - 5)

            if (!this.preview) {
                svg.selectAll("textValue")
                    .data(data)
                    .join("text")
                    .attr("x", margin.left)
                    .attr("y", d => y(d.name))
                    .text(d => this.get_value_text(d.value))
                    .style("text-anchor", "start")
                    .style("fill", "white")
                    .attr("dy", y.bandwidth() - 5)

                if (this.vis.detailLevel !== "nominator") {
                    //x axis texts
                    svg.append("text")
                        .attr("x", margin.left)
                        .attr("y", height + margin.top + margin.bottom / 2)
                        .text(this.get_value_text(0))

                    svg.append("text")
                        .attr("x", width + margin.left)
                        .attr("y", height + margin.top + margin.bottom / 2)
                        .style("text-anchor", "end")
                        .text(this.get_value_text(this.visHelperStore.get_range(this.vis)[1]))
                }

                //column name
                svg.append("text")
                    .attr("x", -(margin.top + height / 2))
                    .attr("y", 20)
                    .text(this.column.label)
                    .style("text-anchor", "middle")
                    .attr("transform", "rotate(-90)")


                //axis
                let axis_title = svg.append("text")
                    .attr("x", margin.left + width / 2)
                    .attr("y", height + margin.top + margin.bottom / 2)
                    .style("text-anchor", "middle")
                    .text("")
                this.visHelperStore.append_tspans(axis_title, this.vis.axis, this.column)
            }


            //title
            let title = svg.append("text")
                .attr("x", (margin.left + width) / 2)
                .attr("y", margin.top / 2)
                .style("text-anchor", "middle")
                .text("")
                .style("font-weight", this.preview ? "" : "bold")
            this.visHelperStore.append_tspans(title, this.vis.title, this.column)

            //annotations
            //use this.getComputedTextLength to split up into multiple parts?
            let gap = 15
            if (!this.preview && this.vis.annotation !== undefined && this.vis.annotation !== "None") {
                let targets_y = this.vis.annotation.target.map(d => y(d))
                let mean_y = targets_y.length > 0 ? d3.mean(targets_y) : height / 2
                //text
                this.vis.annotation.text.forEach((t, i) => {
                    let annotation = svg.append("text")
                        .attr("x", width + margin.left + margin.right + gap)
                        .attr("y", mean_y + i * 15 + y.bandwidth() / 2)
                        .attr("width", 200)
                        .style("font-style", "italic")
                    this.visHelperStore.append_tspans(annotation, t, this.column)
                })

                //lines
                svg.selectAll("line")
                    .data(targets_y)
                    .join("line")
                    .attr("x1", width + margin.left + margin.right + gap - 10)
                    .attr("y1", d => d)
                    .attr("x2", width + margin.left + margin.right + gap - 10)
                    .attr("y2", d => d + y.bandwidth())
                    .attr("stroke", "#505050")
                    .attr("stroke-width", 3)
            }


            d3.select(this.$refs.container).selectAll("*").remove()
            d3.select(this.$refs.container).node().append(svg.node())
        }
    },
    mounted() {
        if (this.vis != null && this.column != null) {
            this.data_to_vis()
        }
    }
}
</script>

<style scoped>

</style>