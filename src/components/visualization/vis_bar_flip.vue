<template>
    <div ref="container"/>
</template>

<script>
import * as d3 from "d3";
import {useHelperStore} from "@/stores/helperStore";
import {useVisHelperStore} from "@/stores/visHelperStore";

export default {
    name: "vis_bar",
    props: [
        "vis", "column", "width", "preview"
    ],
    emits: ["svg"],
    setup() {
        const helperStore = useHelperStore()
        const visHelperStore = useVisHelperStore()
        return {helperStore, visHelperStore}
    },
    data: function() {
        return {
            use_column_group_names: false,
            num_colors: 5
        }
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
                if (this.vis.unit === "natural_frequencies") {
                    let grid_size = this.vis.grid[0] * this.vis.grid[1]
                    return (value * grid_size).toFixed(0) + "/" + grid_size
                }
                return (value * 100).toFixed(0) + "%"
            }
            if (this.vis.unit === "percent") {
                return (value / this.visHelperStore.get_range(this.vis)[1] * 100).toFixed(0) + "%"
            }
            return value
        },
        /**
         * computes the data to visualize, either directly or from the data_map
         */
        data_to_vis() {
            let data = this.vis.data
            if (this.vis.data_map !== undefined) {
                this.use_column_group_names = true
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
            let margin_bottom = this.preview ? 20 : 50
            let margin_right = this.preview? 20 : 50
            let margin_left = this.preview? 20 : 50
            let margin = {top: 30, bottom: margin_bottom, left: margin_left, right: margin_right}
            let annotation_height = this.preview ? 0 : this.vis.annotation === "None" ? margin.left : 30

            let width = (this.width ? this.width : 300)*this.vis.size - margin.right
            let height = 3*35*this.vis.size


            let svg = d3.create("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.bottom + margin.top + annotation_height)
                .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.bottom + margin.top + annotation_height])
                .attr("font-family", this.vis.font_family)

            let y = d3.scaleLinear()
                .domain(this.visHelperStore.get_range(this.vis, data))
                .range([margin.top, height + margin.top])

            let x = d3.scaleBand()
                .domain(data.map(d => d.name))
                .range([margin.left, width + margin.left])
                .padding(0.2)

            //background
            let bgcolor = this.visHelperStore.get_bgcolor(this.vis.background.color, this.vis.bgcolor)

            svg.append("rect")
                .attr("x", margin.left)
                .attr("y", margin.top)
                .attr("width", width)
                .attr("height", height)
                .attr("fill", bgcolor)
                .attr("stroke", this.vis.background.stroke)
                .attr("stroke-width", 2)

            svg.selectAll("bar")
                .data(data)
                .join("rect")
                .attr("y", d => 3*margin.top + height -  y(d.value) - y(0))
                .attr("x", d => x(d.name))
                .attr("height", d => y(d.value) - y(0))
                .attr("width", x.bandwidth())
                .attr("fill", (d, i) => this.vis.color[i%this.num_colors])

            svg.selectAll("textName")
                .data(data)
                .join("text")
                .attr("y", margin.top + 30)
                .attr("x", d => x(d.name) + x.bandwidth() / 2)
                .text(d => this.use_column_group_names ? this.visHelperStore.get_column_label(d, this.column, this.preview) : d.name)
                .style("text-anchor", "middle")

            if (!this.preview) {
                svg.selectAll("textValue")
                    .data(data)
                    .join("text")
                    .attr("y", d => (this.get_value_text(d.value).toString().length*5 < y(d.value) - y(0)) ?
                        margin.top + height - 5: margin.top + height -5- y(d.value) + y(0))
                    .attr("x", d => x(d.name)+ x.bandwidth() / 2)
                    .text(d => this.get_value_text(d.value))
                    .style("text-anchor", "middle")
                    .style("fill", d => (this.get_value_text(d.value).toString().length*5 < y(d.value) - y(0)) ? "white" : "#202020")

                if (this.vis.context === true) {
                    //x axis texts
                    svg.append("text")
                        .attr("x", margin.left)
                        .attr("y", margin.top + height)
                        .style("text-anchor", "end")
                        .text(this.get_value_text(0))

                    svg.append("text")
                        .attr("x", margin.left)
                        .attr("y", 15 + margin.top )
                        .style("text-anchor", "end")
                        .text(this.get_value_text(this.visHelperStore.get_range(this.vis)[1]))
                }

            }


            //title
            let title = svg.append("text")
                .attr("x", margin.left + ( width + margin.right) / 2)
                .attr("y", margin.top / 2)
                .style("text-anchor", "middle")
                .text("")
                .style("font-size", this.preview ? "1em" : "1.1em")
            this.visHelperStore.append_tspans(title, this.vis.title, this.column, this.preview)

            //annotations
            //use this.getComputedTextLength to split up into multiple parts?
            let gap = 15
            if (!this.preview && this.vis.annotation !== undefined && this.vis.annotation !== "None") {
                let targets_y = this.vis.annotation.target.map(d => x(d))
                //text
                this.vis.annotation.text.forEach((t, i) => {
                    let annotation = svg.append("text")
                        .attr("y", height + margin.top + gap + i*15 + 10)
                        .attr("x", width/2 + margin.left)
                        .attr("width", 200)
                        .style("font-style", "italic")
                        .style("text-anchor", "middle")
                    this.visHelperStore.append_tspans(annotation, t, this.column)
                })

                //lines
                svg.selectAll("line")
                    .data(targets_y)
                    .join("line")
                    .attr("y1", height + margin.top + gap - 10)
                    .attr("x1", d => d)
                    .attr("y2", height + margin.top + gap - 10)
                    .attr("x2", d => d + x.bandwidth())
                    .attr("stroke", "#505050")
                    .attr("stroke-width", 3)
            }


            d3.select(this.$refs.container).selectAll("*").remove()
            d3.select(this.$refs.container).node().append(svg.node())
            if (!this.preview) {
                this.$emit('svg', svg.node(), width + margin.left + margin.right)
            }
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