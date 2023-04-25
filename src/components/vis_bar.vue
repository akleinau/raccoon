<template>
    <div ref="container"/>
</template>

<script>
import * as d3 from "d3";

export default {
    name: "vis_bar",
    props: [
        "data_map",
        "range",
        "color"
    ],
    watch: {
        data_map: function () {
            console.log("watch")
            console.log(this.data_map)
            this.visualize(Object.entries(this.data_map).map(([key, value]) => ({"name": key, "value": value})))
        }
    },
    methods: {
        get_range() {
            if (this.range === "percent") {
                return [0, 1]
            } else {
                return this.range
            }
        },
        get_value_text(value) {
            if (this.range === "percent") {
                return (value*100).toFixed(0) + "%"
            }
            return value
        },
        visualize(data) {
            let marging_bottom = 15
            let height = data.length * 35
            let width = 600
            let startBarX = 200

            let svg = d3.create("svg")
                .attr("width", width)
                .attr("height", height + marging_bottom)
                .attr("viewBox", [0, 0, width, height + marging_bottom])

            let x = d3.scaleLinear()
                .domain(this.get_range())
                .range([startBarX, width])

            let y = d3.scaleBand()
                .domain(data.map(d => d.name))
                .range([0, height])
                .padding(0.3)

            svg.append("rect")
                .attr("x", startBarX)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height)
                .attr("fill", "lightgray")

            svg.selectAll("bar")
                .data(data)
                .join("rect")
                .attr("x", startBarX)
                .attr("y", d => y(d.name))
                .attr("width", d => x(d.value) - x(0))
                .attr("height", y.bandwidth())
                .attr("fill", this.color)

            svg.selectAll("textName")
                .data(data)
                .join("text")
                .attr("x", startBarX - 5)
                .attr("y", d => y(d.name))
                .text(d => (d.name === "") ? "null" : d.name)
                .style("text-anchor", "end")
                .attr("dy", y.bandwidth() - 5)

            svg.selectAll("textValue")
                .data(data)
                .join("text")
                .attr("x", startBarX)
                .attr("y", d => y(d.name))
                .text(d => this.get_value_text(d.value))
                .style("text-anchor", "start")
                .style("fill", "white")
                .attr("dy", y.bandwidth()-5)

            svg.append("text")
                .attr("x", startBarX)
                .attr("y", height + marging_bottom)
                .text(this.get_value_text(0))

            svg.append("text")
                .attr("x", width)
                .attr("y", height + marging_bottom)
                .style("text-anchor", "end")
                .text(this.get_value_text(this.get_range()[1]))


            d3.select(this.$refs.container).selectAll("*").remove()
            d3.select(this.$refs.container).node().append(svg.node())
        }
    },
    mounted() {
        if (this.data_map != null) {
            this.visualize(Object.entries(this.data_map).map(([key, value]) => ({"name": key, "value": value})))
        }
    }
}
</script>

<style scoped>

</style>