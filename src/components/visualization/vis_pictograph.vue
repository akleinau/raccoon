<template>
    <div ref="container"/>
</template>

<script>
import * as d3 from "d3";
import {useHelperStore} from "@/stores/helperStore";
import {useVisStore} from "@/stores/visStore";
import {useCSVStore} from "@/stores/csvStore";

export default {
    name: "vis_pictograph",
    props: [
        "column", "vis", "width", "preview"
    ],
    setup() {
        const helperStore = useHelperStore()
        const visStore = useVisStore()
        const csvStore = useCSVStore()
        return {helperStore, visStore, csvStore}
    },
    methods: {
        get_range() {
            if (this.vis.range === "percent") {
                return [0, 1]
            } else {
                return this.vis.range
            }
        }
        ,
        /**
         * returns value in number of dots
         *
         * @param value
         * @returns {string}
         */
        get_value(value) {
            const nominator = (this.vis.range === "percent") ? value : (value / this.get_range()[1])
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
        /**
         * returns the label of the column
         *
         * @param d
         * @returns {string}
         */
        get_column_label(d) {
            let label = (d.name === "") ? "null" : this.column.options.find(x => x.name === d.name).label
            return (this.preview && label.length > 10) ? label.substring(0, 7) + "..." : label
        },
        data_to_vis() {
            let data = this.vis.data
            if (this.vis.data_map !== undefined) {
                data = Object.entries(this.column[this.vis.data_map]).map(([key, value]) => ({
                    "name": key,
                    "value": value
                }))
                data = data.sort((a, b) => this.helperStore.sort(
                    this.column.options.find(x => x.name === a.name),
                    this.column.options.find(x => x.name === b.name)))
            }

            this.visualize(data)
        },
        /**
         * visualizes the data
         *
         * @param data
         */
        visualize(data) {
            let marging_bottom = 20
            let margin_top_grid = 10
            let margin_top = 30
            let margin_right = this.preview ? 5 : 60
            let width = (this.width ? this.width : 300) - margin_right
            let startBarX = this.helperStore.get_max_length(this.column.options.map(a => a.label)) * 10 + 10
            if (this.preview && startBarX > 100) {
                startBarX = 100
            }
            const padding = 0.3

            const dot_range_X = d3.range(0, this.vis.grid[0], 1)
            const dot_range_Y = d3.range(0, this.vis.grid[1], 1)
            const dot_range = d3.range(0, (this.vis.grid[0] * this.vis.grid[1]), 1)


            let x = d3.scaleBand()
                .domain(dot_range_X)
                .range([startBarX, width + startBarX])
                .padding(padding)

            const radius = x.bandwidth() / 2

            const y_range = x.step() * this.vis.grid[1]
            let y = d3.scaleBand()
                .domain(dot_range_Y)
                .range([0, y_range])
            let height = data.length * (y_range + y.bandwidth())

            let y_options = d3.scaleBand()
                .domain(data.map(d => d.name))
                .range([margin_top_grid + radius * 3, height + margin_top_grid + radius * 3]) //radius times three as outer padding


            let svg = d3.create("svg")
                .attr("width", width + startBarX + margin_right)
                .attr("height", height + marging_bottom + margin_top)
                .attr("viewBox", [0, -margin_top, width + startBarX + margin_right, height + marging_bottom + margin_top])

            //background
            svg.append("rect")
                .attr("x", startBarX - x.bandwidth() / 2)
                .attr("y", margin_top_grid)
                .attr("width", width + margin_right)
                .attr("height", height)
                .attr("fill", this.vis.background)

            //one element per option
            svg.selectAll("option")
                .data(data)
                .join("g")
                .attr("x", startBarX)
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
                .attr("x", startBarX - x.bandwidth() / 2 - 5)
                .attr("y", d => y_options(d.name) + y_options.bandwidth() / 2)
                .text(d => this.get_column_label(d))
                .style("text-anchor", "end")

            if (!this.preview) {
                svg.selectAll("textValue")
                    .data(data)
                    .join("text")
                    .attr("x", width + startBarX - x.bandwidth() / 2)
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

            }


            let title = svg.append("text")
                .attr("x", startBarX + width / 2)
                .attr("y", -10)
                .style("text-anchor", "middle")
                .text("")

            let title_array = this.helperStore.parse_text(this.vis.title)

            title.selectAll("tspan")
                .data(title_array)
                .join("tspan")
                .text(d => d.text)
                .style("fill", d => d.color)


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