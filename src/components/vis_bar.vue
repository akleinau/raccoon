<template>
    <div ref="container" style="width:100px; height:50px"/>
</template>

<script>
import * as d3 from "d3";

export default {
    name: "vis_bar",
    methods: {
        visualize() {
            let svg = d3.create("svg")
                .attr("height", 50)
                .attr("width", 100)
                .attr("viewBox", "0 0 100 50")

            svg.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 40)
                .attr("height", 40)
                .attr("fill", "red")


            d3.select(this.$refs.container).selectAll("*").remove()
            d3.select(this.$refs.container).node().append(svg.node())
        }
    },
    mounted() {
        this.visualize()
    }
}
</script>

<style scoped>

</style>