<template>
    <div ref="container"/>
</template>

<script>
import * as d3 from "d3";
import {useHelperStore} from "@/stores/helperStore";
import {useVisStore} from "@/stores/visStore";

export default {
    name: "vis_bar",
    props: [
        "vis", "column", "width", "preview"
    ],
    setup() {
        const helperStore = useHelperStore()
        const visStore = useVisStore()
        return {helperStore, visStore}
    },
    methods: {
        /**
         * returns the range of the data
         *
         * @returns {number[]|*}
         */
        get_range() {
            if (this.vis.range === "percent") {
                return [0, 1]
            } else {
                return this.vis.range
            }
        },
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
        /**
         * returns the label of the column
         *
         * @param d
         * @returns {string}
         */
        get_column_label(d) {
            let label = (d.name === "") ? "null" : this.column.options.find(x => x.name === d.name).label
            return (this.preview && label.length > 10) ? label.substring(0, 6) + "..." : label
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
            let margin_top = 30
            let marging_bottom = 30
            let width = this.width ? this.width : 300
            let height = data.length * (width / 10)
            let startBarX = this.helperStore.get_max_length(this.column.options.map(a => a.label)) * 10 + 30
            if (this.preview && startBarX > 100) {
                startBarX = 100
            }

            let svg = d3.create("svg")
                .attr("width", width + startBarX)
                .attr("height", height + marging_bottom + margin_top)
                .attr("viewBox", [0, -margin_top, width + startBarX, height + marging_bottom + margin_top])

            let x = d3.scaleLinear()
                .domain(this.get_range())
                .range([startBarX, width + startBarX])

            let y = d3.scaleBand()
                .domain(data.map(d => d.name))
                .range([0, height])
                .padding(0.2)

            //background
            svg.append("rect")
                .attr("x", startBarX)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height)
                .attr("fill", this.vis.background)

            svg.selectAll("bar")
                .data(data)
                .join("rect")
                .attr("x", startBarX)
                .attr("y", d => y(d.name))
                .attr("width", d => x(d.value) - x(0))
                .attr("height", y.bandwidth())
                .attr("fill", this.vis.color)

            svg.selectAll("textName")
                .data(data)
                .join("text")
                .attr("x", startBarX - 5)
                .attr("y", d => y(d.name))
                .text(d => this.get_column_label(d))
                .style("text-anchor", "end")
                .attr("dy", y.bandwidth() - 5)

            if (!this.preview) {
                svg.selectAll("textValue")
                    .data(data)
                    .join("text")
                    .attr("x", startBarX)
                    .attr("y", d => y(d.name))
                    .text(d => this.get_value_text(d.value))
                    .style("text-anchor", "start")
                    .style("fill", "white")
                    .attr("dy", y.bandwidth() - 5)

                //x axis texts
                svg.append("text")
                    .attr("x", startBarX)
                    .attr("y", height + 15)
                    .text(this.get_value_text(0))

                svg.append("text")
                    .attr("x", width + startBarX)
                    .attr("y", height + 15)
                    .style("text-anchor", "end")
                    .text(this.get_value_text(this.get_range()[1]))

                //column name
                svg.append("text")
                    .attr("x", -(height / 2))
                    .attr("y", 20)
                    .text(this.column.label)
                    .style("text-anchor", "middle")
                    .attr("transform", "rotate(-90)")


            }

            let title = svg.append("text")
                .attr("x", startBarX + width / 2)
                .attr("y", -10)
                .style("text-anchor", "middle")
                .text("")

            let title_array = this.helperStore.parse_text(this.vis.title, this.column)

            title.selectAll("tspan")
                .data(title_array)
                .join("tspan")
                .text(d => d.text)
                .style("fill", d => d.color)


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