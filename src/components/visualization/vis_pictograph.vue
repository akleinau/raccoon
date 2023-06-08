<template>
    <i v-show="false" class="mdi" :class="'mdi-' + this.vis.icon" />
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
            const icon_padding = 0.1
            const row_padding = 10
            const grid_padding = 10

            const dot_range_X = d3.range(0, this.vis.grid[0], 1)
            const dot_range_Y = d3.range(0, this.vis.grid[1], 1)
            const dot_range = d3.range(0, (this.vis.grid[0] * this.vis.grid[1]), 1)


            let x = d3.scaleBand()
                .domain(dot_range_X)
                .range([margin.left + grid_padding, width + margin.left])
                .padding(icon_padding)

            const icon_width = x.bandwidth()
            const icon_height = icon_width * this.vis.ratio
            const icon_padding_px = x.step() - x.bandwidth() //padding in pixel to compute height

            const row_height = (icon_height + icon_padding_px ) * this.vis.grid[1]
            //y position inside each row
            let y = d3.scaleBand()
                .domain(dot_range_Y)
                .range([0, row_height])
                .padding(icon_padding)

            let height = data.length * (row_height+row_padding) // icon_height for margins

            //y position of each row
            let y_row = d3.scaleBand()
                .domain(data.map(d => d.name))
                .range([margin.top + grid_padding, margin.top + grid_padding + height])


            let svg = d3.create("svg")
                .attr("width", width + margin.left + margin.right + annotation_width)
                .attr("height", height + margin.bottom + margin.top + grid_padding*2)
                .attr("viewBox", [0, 0, width + margin.left + margin.right + annotation_width, height + margin.bottom + margin.top + grid_padding*2])
                .attr("font-family", this.vis.font_family)

            let bgcolor = this.visHelperStore.get_bgcolor(this.vis.background.color, this.vis.color)

            //background
            svg.append("rect")
                .attr("x", margin.left)
                .attr("y", margin.top)
                .attr("width", width + margin.right)
                .attr("height", height + grid_padding*2)
                .attr("fill", bgcolor)
                .attr("stroke", this.vis.background.stroke)
                .attr("stroke-width", 2)

            let brightness_background = d3.hsl(bgcolor).l
            let contrasting_color = brightness_background > 0.9 ? "#bebebe" : "#fafafa"

            let emptyCircleColor = this.vis.detailLevel === "nominator" ? bgcolor : contrasting_color

            //one element per option
            svg.selectAll("option")
                .data(data)
                .join("g")
                .attr("x", margin.left)
                .attr("y", d => y_row(d.name))
                .each((par, index, node) => {
                    d3.select(node[index]).selectAll("text")
                        .data(dot_range)
                        .join("text")
                        .attr("x", d => x(Math.floor(d / this.vis.grid[1])))
                        .attr("y", d => y_row(par.name) + y(d % this.vis.grid[1]) + icon_height)
                        .attr("fill", d => ((d + 1) <= this.get_value(par.value)) ? this.vis.color : emptyCircleColor)
                        .style("font-family", "Material Design Icons")
                        .html(this.getIcon)
                        .style("font-size", d3.max([icon_height, icon_width]) + "px")
                })


            svg.selectAll("textName")
                .data(data)
                .join("text")
                .attr("x", margin.left - 5)
                .attr("y", d => y_row(d.name) + row_height / 2)
                .text(d => this.visHelperStore.get_column_label(d, this.column, this.preview))
                .style("text-anchor", "end")
                .attr("dy", 7)

            if (!this.preview) {
                svg.selectAll("textValue")
                    .data(data)
                    .join("text")
                    .attr("x", width + margin.left + margin_right - 5)
                    .attr("y", d => y_row(d.name) + row_height / 2)
                    .text("")
                    .style("text-anchor", "end")
                    .style("fill", "black")
                    .each((par, index, node) => {
                        d3.select(node[index]).selectAll("textParts")
                            .data(this.get_value_text(par.value))
                            .join("tspan")
                            .text(d => d.text)
                            .style("fill", d => d.color)
                    })
                    .attr("dy", 7)


                //column name
                svg.append("text")
                    .attr("x", -(margin.top + (height + grid_padding*2 ) / 2))
                    .attr("y", 20)
                    .text(this.column.label)
                    .style("text-anchor", "middle")
                    .attr("transform", "rotate(-90)")


                //axis
                let axis_title = svg.append("text")
                    .attr("x", margin.left + width / 2)
                    .attr("y", height  + grid_padding*2 + margin.top + margin.bottom / 2)
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
                let targets_y = this.vis.annotation.target.map(d => y_row(d))
                let mean_y = targets_y.length > 0 ? d3.mean(targets_y) : height / 2
                //text
                this.vis.annotation.text.forEach((t, i) => {
                    let annotation = svg.append("text")
                        .attr("x", width + margin.left + margin.right + gap)
                        .attr("y", mean_y + i * 15 + row_height / 2)
                        .attr("width", 200)
                        .style("font-style", "italic")
                        .attr("dy", 7)
                    this.visHelperStore.append_tspans(annotation, t, this.column)
                })

                //lines
                svg.selectAll("line")
                    .data(targets_y)
                    .join("line")
                    .attr("x1", width + margin.left + margin.right + gap - 10)
                    .attr("y1", d => d)
                    .attr("x2", width + margin.left + margin.right + gap - 10)
                    .attr("y2", d => d + row_height)
                    .attr("stroke", "#505050")
                    .attr("stroke-width", 3)
            }


            d3.select(this.$refs.container).selectAll("*").remove()
            d3.select(this.$refs.container).node().append(svg.node())
        },
        getIcon() {
            // this copies the content from the pseudo element :before as it's needed to show the icon from material design
            const ele = document.querySelector('.mdi-' + this.vis.icon);
            if (ele) {
                const styles = window.getComputedStyle(ele, ':before');
                return styles.content.replaceAll('"', "");
            }

            return '';
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