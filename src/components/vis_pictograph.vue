<template>
    <div ref="container"/>
</template>

<script>
import * as d3 from "d3";
import {useStore} from "@/stores/csvStore";

export default {
    name: "vis_pictograph",
    props: [
        "data_map",
        "range",
        "color",
        "grid"
    ],
    watch: {
        data_map: function () {
            console.log("watch")
            let data = Object.entries(this.data_map).map(([key, value]) => ({"name": key, "value": value}))
            data.sort((a, b) => this.Store.sort(a.name, b.name))
            this.visualize(data)
        },
        grid: {
            handler: function () {
                console.log("watch")
                this.visualize(Object.entries(this.data_map).map(([key, value]) => ({"name": key, "value": value})))
            },
            deep: true
        }
    },
        setup() {
        const Store = useStore()
        return {Store}
    },
    methods: {
        get_range() {
            if (this.range === "percent") {
                return [0, 1]
            } else {
                return this.range
            }
        },
        /**
         * returns value in number of dots
         *
         * @param value
         * @returns {string}
         */
        get_value(value) {
            const nominator = (this.range === "percent") ? value : (value / this.get_range()[1])
            return (nominator * this.grid[0] * this.grid[1]).toFixed(0)

        },

        /**
         * returns value as frequency with nominator/denominator
         *
         * @param value
         * @returns {string}
         */
        get_value_text(value) {
            return this.get_value(value) + "/" + this.grid[0] * this.grid[1]
        },
        /**
         * visualizes the data
         *
         * @param data
         */
        visualize(data) {
            let marging_bottom = 15
            let margin_top = 10
            let margin_right = 60
            let width = 600
            let startBarX = 200
            const padding = 0.3

            const dot_range_X = d3.range(0, this.grid[0], 1)
            const dot_range_Y = d3.range(0, this.grid[1], 1)
            const dot_range = d3.range(0, (this.grid[0] * this.grid[1]), 1)


            let x = d3.scaleBand()
                .domain(dot_range_X)
                .range([startBarX, width])
                .padding(padding)

            const y_range = x.step() * this.grid[1]
            let y = d3.scaleBand()
                .domain(dot_range_Y)
                .range([0, y_range])
                .padding(padding)

            let height = data.length * y_range + data.length * y.bandwidth()

            let y_options = d3.scaleBand()
                .domain(data.map(d => d.name))
                .range([margin_top, height])


            let svg = d3.create("svg")
                .attr("width", width + margin_right)
                .attr("height", height + marging_bottom)
                .attr("viewBox", [0, 0, width + margin_right, height + marging_bottom])

            //background
            svg.append("rect")
                .attr("x", startBarX - x.bandwidth() / 2)
                .attr("y", 0)
                .attr("width", width)
                .attr("height", height)
                .attr("fill", "lightgray")

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
                        .attr("cx", d => x(Math.floor(d / this.grid[1])))
                        .attr("cy", d => y_options(par.name) + y(d % this.grid[1]))
                        .attr("r", x.bandwidth() / 2)
                        .attr("fill", d => ((d + 1) <= this.get_value(par.value)) ? this.color : "darkgray")
                })


            svg.selectAll("textName")
                .data(data)
                .join("text")
                .attr("x", startBarX - x.bandwidth() / 2 - 5)
                .attr("y", d => y_options(d.name))
                .text(d => (d.name === "") ? "null" : d.name)
                .style("text-anchor", "end")
                .attr("dy", y_options.bandwidth() / 2 - 5)

            svg.selectAll("textValue")
                .data(data)
                .join("text")
                .attr("x", width - x.bandwidth() / 2)
                .attr("y", d => y_options(d.name))
                .text(d => this.get_value_text(d.value))
                .style("text-anchor", "start")
                .style("fill", "white")
                .attr("dy", y_options.bandwidth() / 2 - 5)

            //x axis texts
            svg.append("text")
                .attr("x", startBarX)
                .attr("y", height + marging_bottom)
                .text(this.get_value_text(0))
                .style("text-anchor", "center")

            svg.append("text")
                .attr("x", width - x.bandwidth() / 2)
                .attr("y", height + marging_bottom)
                .style("text-anchor", "end")
                .text(this.get_value_text(this.get_range()[1]))


            d3.select(this.$refs.container).selectAll("*").remove()
            d3.select(this.$refs.container).node().append(svg.node())
        }
    },
    mounted() {
        if (this.data_map != null) {
            let data = Object.entries(this.data_map).map(([key, value]) => ({"name": key, "value": value}))
            data.sort((a, b) => this.Store.sort(a.name, b.name))
            this.visualize(data)
        }
    }
}
</script>

<style scoped>

</style>