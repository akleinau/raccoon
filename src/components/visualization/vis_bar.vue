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
        "description", "width"
    ],
    watch: {
        description: {
            handler: function () {
                let data = Object.entries(this.description.data_map).map(([key, value]) => ({
                    "name": key,
                    "value": value
                }))
                data.sort((a, b) => this.helperStore.sort(a.name, b.name))
                this.visualize(data)
            }
            ,
            deep: true
        }
    },
    setup() {
        const helperStore = useHelperStore()
        const visStore = useVisStore()
        return {helperStore, visStore}
    },
    computed: {
        color() {
            return this.description.color ? this.description.color : this.visStore.default_settings[this.description.type].color
        },
        range() {
            return this.description.range ? this.description.range : this.visStore.default_settings[this.description.type].range
        },
        title() {
            return this.description.title ? this.description.title : this.visStore.default_settings[this.description.type].title
        }

    },
    methods: {
        /**
         * returns the range of the data
         *
         * @returns {number[]|*}
         */
        get_range() {
            if (this.range === "percent") {
                return [0, 1]
            } else {
                return this.range
            }
        },
        /**
         * returns value as pretty text
         *
         * @param value
         * @returns {*|string}
         */
        get_value_text(value) {
            if (this.range === "percent") {
                return (value * 100).toFixed(0) + "%"
            }
            return value
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
            let startBarX = this.helperStore.get_max_length(this.description.options) * 10 + 10

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

            svg.append("text")
                .attr("x", startBarX + width / 2)
                .attr("y", -10)
                .style("text-anchor", "middle")
                .text(this.title)


            d3.select(this.$refs.container).selectAll("*").remove()
            d3.select(this.$refs.container).node().append(svg.node())
        }
    },
    mounted() {
        if (this.description.data_map != null) {
            let data = Object.entries(this.description.data_map).map(([key, value]) => ({"name": key, "value": value}))
            data.sort((a, b) => this.helperStore.sort(a.name, b.name))
            this.visualize(data)
        }
    }
}
</script>

<style scoped>

</style>