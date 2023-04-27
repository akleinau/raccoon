<template>
  <div ref="container"/>
</template>

<script>
import * as d3 from "d3";

export default {
  name: "vis_line",
  props: [
    "data",
    "target_data"
  ],
  watch: {
    data: function () {
      console.log("watch")
      this.visualize(this.data, this.target_data)
    }
  },
  methods: {
    visualize(data, target_data) {
      let marging_bottom = 30
      let margin_left = 30
      let margin_top = 10
      let margin_right = 30
      let height = 200
      let width = 600

      let svg = d3.create("svg")
          .attr("width", width + margin_left)
          .attr("height", height + marging_bottom)
          .attr("viewBox", [-margin_left, -margin_top, width + margin_right, height + marging_bottom])

      //background
      svg.append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", width)
          .attr("height", height)
          .attr("fill", "lightgray")

      // add the x Axis
      var x = d3.scaleLinear()
          .domain(d3.extent(data))
          .range([0, width]);
      svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x));

      // add the y Axis
      var y = d3.scaleLinear()
          .range([height, 0])
          .domain([0, 1]);
      svg.append("g")
          .call(d3.axisLeft(y));

      // Compute kernel density estimation
      var kde = this.kernelDensityEstimator(this.kernelEpanechnikov(7), x.ticks(40))
      var density = kde(data)

      // Plot the area
      svg.append("path")
          .attr("class", "mypath")
          .datum(density)
          .attr("fill", "none")
          .attr("stroke", "midnightblue")
          .attr("stroke-width", 1)
          .attr("stroke-linejoin", "round")
          .attr("d", d3.line()
              .x(d => x(d[0]))
              .y(d => y(d[1]))
          );

      var kde2 = this.kernelDensityEstimator(this.kernelEpanechnikov(7), x.ticks(40))
      var density_target = kde2(target_data)

      // Plot the area
      svg.append("path")
          .attr("class", "mypath")
          .datum(density_target)
          .attr("fill", "none")
          .attr("stroke", "purple")
          .attr("stroke-width", 1)
          .attr("stroke-linejoin", "round")
          .attr("d", d3.line()
              .x(d => x(d[0]))
              .y(d => y(d[1]))
          );


      d3.select(this.$refs.container).selectAll("*").remove()
      d3.select(this.$refs.container).node().append(svg.node())
    },
    // Function to compute density
    kernelDensityEstimator(kernel, X) {
      return function (V) {
        return X.map(function (x) {
          return [x, d3.mean(V, function (v) {
            return kernel(x - v);
          })];
        });
      };
    },

    kernelEpanechnikov(k) {
      return function (v) {
        return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
      };
    }
  },
  mounted() {
    if (this.data != null) {
      this.visualize(this.data, this.target_data)
    }
  }
}
</script>

<style scoped>

</style>