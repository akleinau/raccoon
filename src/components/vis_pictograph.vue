<template>
  <div ref="container"/>
</template>

<script>
import * as d3 from "d3";

export default {
  name: "vis_pictograph",
  props: [
    "data_map",
    "range",
    "color",
    "num_dots"
  ],
  watch: {
    data_map: function () {
      console.log("watch")
      console.log(this.data_map)
      this.visualize(Object.entries(this.data_map).map(([key, value]) => ({"name": key, "value": value})))
    },
    num_dots: function () {
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
    get_value(value) {
      const nominator = (this.range === "percent") ? value : (value / this.get_range()[1])

      return (nominator * this.num_dots).toFixed(0)

    },

    get_value_text(value) {
      return this.get_value(value) + "/" + this.num_dots
    },
    visualize(data) {
      let marging_bottom = 15
      let margin_right = 50
      let height = data.length * 35
      let width = 600
      let startBarX = 200

      let svg = d3.create("svg")
          .attr("width", width + margin_right)
          .attr("height", height + marging_bottom)
          .attr("viewBox", [0, 0, width + margin_right, height + marging_bottom])

      const dot_range = d3.range(1, (+this.num_dots + 1), 1)

      let x = d3.scaleBand()
          .domain(dot_range)
          .range([startBarX, width])
          .padding(0.3)

      let y = d3.scaleBand()
          .domain(data.map(d => d.name))
          .range([0, height])
          .padding(0.3)

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
          .attr("y", d => y(d.name))
          .each((par, index, node) => {
            d3.select(node[index]).selectAll("circle")
                .data(dot_range)
                .join("circle")
                .attr("cx", d => x(d))
                .attr("cy", y(par.name) + y.bandwidth() / 2)
                .attr("r", x.bandwidth() / 2)
                .attr("fill", d => (d <= this.get_value(par.value)) ? this.color : "darkgray")
          })


      svg.selectAll("textName")
          .data(data)
          .join("text")
          .attr("x", startBarX - x.bandwidth() / 2 - 5)
          .attr("y", d => y(d.name))
          .text(d => (d.name === "") ? "null" : d.name)
          .style("text-anchor", "end")
          .attr("dy", y.bandwidth() - 5)

      svg.selectAll("textValue")
          .data(data)
          .join("text")
          .attr("x", width - x.bandwidth() / 2)
          .attr("y", d => y(d.name))
          .text(d => this.get_value_text(d.value))
          .style("text-anchor", "start")
          .style("fill", "white")
          .attr("dy", y.bandwidth() - 5)

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
      this.visualize(Object.entries(this.data_map).map(([key, value]) => ({"name": key, "value": value})))
    }
  }
}
</script>

<style scoped>

</style>