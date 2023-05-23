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
            return [{"text": this.get_value(value), "color": this.vis.color},
                {"text": "/" + this.vis.grid[0] * this.vis.grid[1], "color": "black"}]
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
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.bottom + margin.top)
                .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.bottom + margin.top])

            //background
            svg.append("rect")
                .attr("x", margin.left - radius)
                .attr("y", margin.top)
                .attr("width", width + margin.right)
                .attr("height", height)
                .attr("fill", this.vis.background)

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
                        .attr("cy", d => y_options(par.name) + y(d % this.vis.grid[1]))
                        .attr("r", radius)
                        .attr("fill", d => ((d + 1) <= this.get_value(par.value)) ? this.vis.color : "darkgray")
                })


            svg.selectAll("textName")
                .data(data)
                .join("text")
                .attr("x", margin.left - x.bandwidth() / 2 - 5)
                .attr("y", d => y_options(d.name) + y_options.bandwidth() / 2)
                .text(d => this.visHelperStore.get_column_label(d, this.column, this.preview))
                .style("text-anchor", "end")

            if (!this.preview) {
                svg.selectAll("textValue")
                    .data(data)
                    .join("text")
                    .attr("x", width + margin.left - x.bandwidth() / 2)
                    .attr("y", d => y_options(d.name) + y_options.bandwidth() / 2)
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