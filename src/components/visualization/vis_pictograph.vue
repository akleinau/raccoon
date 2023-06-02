<template>
    <div ref="container"/>
</template>

<script>
import * as d3 from "d3";
import {useHelperStore} from "@/stores/helperStore";
import {useVisStore} from "@/stores/visStore";
import {useCSVStore} from "@/stores/csvStore";
import {useVisHelperStore} from "@/stores/visHelperStore";

export default {
    name: "vis_pictograph",
    props: [
        "column", "vis", "width", "preview"
    ],
    setup() {
        const helperStore = useHelperStore()
        const visStore = useVisStore()
        const csvStore = useCSVStore()
        const visHelperStore = useVisHelperStore()
        return {helperStore, visStore, csvStore, visHelperStore}
    },
    methods: {
        /**
         * returns value in number of dots
         *
         * @param value
         * @returns {string}
         */
        get_value(value) {
            const nominator = (this.vis.range === "percent") ? value : (value / this.visHelperStore.get_range(this.vis)[1])
            return (nominator * this.vis.grid[0] * this.vis.grid[1]).toFixed(0)

        }
        ,

        /**
         * returns value as frequency with nominator/denominator
         *
         * @param value
         * @returns {[{color, text: string},{color: string, text: string}]}
         */
        get_value_text(value) {
            if (this.vis.detailLevel === "nominator") {
                return [{"text": this.get_value(value), "color": this.vis.color}]
            } else if (this.vis.detailLevel === "denominator") {
                return [{"text": this.get_value(value), "color": this.vis.color},
                    {"text": "/" + this.vis.grid[0] * this.vis.grid[1], "color": "black"}]
            } else if (this.vis.detailLevel === "percent") {
                return [{"text": (value * 100).toFixed(0), "color": this.vis.color},
                    {"text": "%", "color": "black"}]
            }
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
            let margin_bottom = this.preview ? 20 : 50
            let margin_top = 30
            let margin_right = this.preview ? 5 : 60
            let annotation_width = this.preview ? 0 : this.vis.annotation === "None" ? 0 : 300
            let width = (this.width ? this.width : 300) - margin_right
            let startBarX = this.helperStore.get_max_length(this.column.options.map(a => a.label)) * 10 + 30
            if (this.preview && startBarX > 100) {
                startBarX = 100
            }
            let margin = {top: margin_top, right: margin_right, bottom: margin_bottom, left: startBarX}
            const padding = 0.3

            const dot_range_X = d3.range(0, this.vis.grid[0], 1)
            const dot_range_Y = d3.range(0, this.vis.grid[1], 1)
            const dot_range = d3.range(0, (this.vis.grid[0] * this.vis.grid[1]), 1)


            let x = d3.scaleBand()
                .domain(dot_range_X)
                .range([margin.left, width + margin.left])
                .padding(padding)

            const radius = x.bandwidth() / 2

            const y_range = x.step() * this.vis.grid[1]
            let y = d3.scaleBand()
                .domain(dot_range_Y)
                .range([0, y_range])
            let height = data.length * (y_range + y.bandwidth())

            let y_options = d3.scaleBand()
                .domain(data.map(d => d.name))
                .range([margin.top + radius * 3, height + margin.top]) //radius times three as outer padding


            let svg = d3.create("svg")
                .attr("width", width + margin.left + margin.right + annotation_width)
                .attr("height", height + margin.bottom + margin.top)
                .attr("viewBox", [0, 0, width + margin.left + margin.right + annotation_width, height + margin.bottom + margin.top])

            //background
            svg.append("rect")
                .attr("x", margin.left - radius)
                .attr("y", margin.top)
                .attr("width", width + margin.right)
                .attr("height", height)
                .attr("fill", this.vis.background.color)
                .attr("stroke", this.vis.background.stroke)

            let brightness_background = d3.hsl(this.vis.background.color).l
            let contrasting_color = brightness_background > 0.9 ? "#b3b3b3" : "#fafafa"

            let emptyCircleColor = this.vis.detailLevel === "nominator" ? this.vis.background.color : contrasting_color

            //one element per option
            svg.selectAll("option")
                .data(data)
                .join("g")
                .attr("x", margin.left)
                .attr("y", d => y_options(d.name))
                .each((par, index, node) => {
                    d3.select(node[index]).selectAll("circle")
                        .data(dot_range)
                        .join("circle")
                        .attr("cx", d => x(Math.floor(d / this.vis.grid[1])))
                        .attr("cy", d => y_options(par.name) + y(d % this.vis.grid[1]) + radius)
                        .attr("r", radius)
                        .attr("fill", d => ((d + 1) <= this.get_value(par.value)) ? this.vis.color : emptyCircleColor)
                })


            svg.selectAll("textName")
                .data(data)
                .join("text")
                .attr("x", margin.left - x.bandwidth() / 2 - 5)
                .attr("y", d => y_options(d.name) +y_range / 2)
                .text(d => this.visHelperStore.get_column_label(d, this.column, this.preview))
                .style("text-anchor", "end")

            if (!this.preview) {
                svg.selectAll("textValue")
                    .data(data)
                    .join("text")
                    .attr("x", width + margin.left - x.bandwidth() / 2)
                    .attr("y", d => y_options(d.name) + y_range / 2)
                    .text("")
                    .style("text-anchor", "start")
                    .style("fill", "black")
                    .each((par, index, node) => {
                        d3.select(node[index]).selectAll("textParts")
                            .data(this.get_value_text(par.value))
                            .join("tspan")
                            .text(d => d.text)
                            .style("fill", d => d.color)
                    })

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
                .attr("x", (width + margin.left + margin.right) / 2)
                .attr("y", margin.top / 2)
                .style("text-anchor", "middle")
                .text("")
                .style("font-weight", this.preview ? "" : "bold")
            this.visHelperStore.append_tspans(title, this.vis.title, this.column)

            //annotations
            //use this.getComputedTextLength to split up into multiple parts?
            let gap = 15
            if (!this.preview && this.vis.annotation !== undefined && this.vis.annotation !== "None") {
                let targets_y = this.vis.annotation.target.map(d => y_options(d))
                let mean_y = targets_y.length > 0 ? d3.mean(targets_y) : height/2
                //text
                this.vis.annotation.text.forEach((t, i) => {
                    let annotation = svg.append("text")
                        .attr("x", width + margin.left + margin.right + gap)
                        .attr("y", mean_y + i * 15 + y_range / 2)
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
                    .attr("y2", d => d + y_range)
                    .attr("stroke", "#505050")
                    .attr("stroke-width", 3)
            }


            d3.select(this.$refs.container).selectAll("*").remove()
            d3.select(this.$refs.container).node().append(svg.node())
        }
    }
    ,
    mounted() {
        if (this.vis != null && this.column != null) {
            this.data_to_vis()
        }
    }
}
</script>

<style scoped>

</style>