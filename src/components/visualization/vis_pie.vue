<template>
    <div ref="container"/>
</template>

<script>
import * as d3 from "d3";
import {useHelperStore} from "@/stores/helperStore";
import {useVisStore} from "@/stores/visStore";
import {useVisHelperStore} from "@/stores/visHelperStore";

export default {
    name: "vis_pie",
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
            let margin_colors = 30
            startBarX = startBarX + margin_colors
            let margin_bottom = this.preview ? 20 : 50
            let margin = {top: 30, bottom: margin_bottom, left: startBarX, right: 5}

            let width = (this.width ? this.width : 300) - margin.right
            let height = 200
            let annotation_width = this.preview ? 0 : this.vis.annotation === "None" ? 0 : 300


            let svg = d3.create("svg")
                .attr("width", width + margin.left + margin.right + annotation_width)
                .attr("height", height + margin.bottom + margin.top)
                .attr("viewBox", [0, 0, width + margin.left + margin.right + annotation_width, height + margin.bottom + margin.top])

            let brighterColor = d3.interpolateRgb("white", this.vis.color)(0.2)
            let darkerColor = d3.interpolateRgb("black", this.vis.color)(0.8)
            let color = d3.scaleOrdinal()
                .domain(data.map(d => d.name))
                .range(d3.quantize(d3.interpolateRgb(brighterColor, darkerColor), data.length))

            let pie = d3.pie()
                .value(d => d.value)

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

            svg.selectAll("textName")
                .data(data)
                .join("text")
                .attr("x", margin.left - margin_colors)
                .attr("y", d => y(d.name))
                .text(d => this.visHelperStore.get_column_label(d, this.column, this.preview))
                .style("text-anchor", "end")
                .attr("dy", y.bandwidth() / 2 + 5)

            svg.selectAll("textColor")
                .data(data)
                .join("rect")
                .attr("x", margin.left - margin_colors + 5)
                .attr("y", d => y(d.name) + y.bandwidth() / 2 - 10)
                .attr("width", 20)
                .attr("height", 20)
                .attr("fill", d => color(d.name))

            let radius = Math.min(width, height) / 3

            let pie_container = svg.append("g")
                .attr("transform", "translate(" + +(margin.left + width / 2) + "," + +(margin.top + height / 2) + ")")

            //pie
            pie_container.selectAll('pieParts')
                .data(pie(data))
                .enter()
                .append('path')
                .attr('d', d3.arc()
                    .innerRadius(0)
                    .outerRadius(radius)
                )
                .attr('fill', d => color(d.data.name))
                .attr("stroke", "black")
                .style("stroke-width", "1.5px")

            if (!this.preview) {

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
                let mean_y = targets_y.length > 0 ? d3.mean(targets_y) : height/2
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