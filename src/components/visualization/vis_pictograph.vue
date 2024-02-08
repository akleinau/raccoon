<template>
    <i v-show="false" class="mdi" :class="'mdi-' + this.vis.icon"/>
    <i v-show="false" class="mdi" :class="'mdi-' + this.vis.icon2"/>
    <div ref="container"/>
</template>

<script>
import * as d3 from "d3";
import {useHelperStore} from "@/stores/helperStore";
import {useDataStore} from "@/stores/dataStore";
import {useVisHelperStore} from "@/stores/visHelperStore";

export default {
    name: "vis_pictograph",
    props: [
        "column", "vis", "width", "preview"
    ],
    emits: ["svg"],
    setup() {
        const helperStore = useHelperStore()
        const dataStore = useDataStore()
        const visHelperStore = useVisHelperStore()
        return {helperStore, dataStore, visHelperStore}
    },
    data: function () {
        return {
            use_column_group_names: false,
        }
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
            if (this.vis.unit === "natural_frequencies") {
                return [{"text": this.get_value(value), "color": this.vis.color},
                    {"text": "/" + this.vis.grid[0] * this.vis.grid[1], "color": "black"}]
            } else if (this.vis.unit === "percent") {
                let percent = (this.vis.range === "percent") ? value : (value / this.visHelperStore.get_range(this.vis)[1])
                return [{"text": (percent*100).toFixed(0), "color": this.vis.color},
                    {"text": "%", "color": "black"}]
            }
        },
        /**
         * computes the data to visualize, either directly or from the data_map
         */
        data_to_vis() {
            let data = this.vis.data
            if (this.vis.data_map !== undefined) {
                this.use_column_group_names = true
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
            let margin_bottom = this.preview ? 0 : 30
            let margin_top = 30
            let margin_top_labels = 50
            let margin_right = this.preview ? 20 : 70
            let margin_left = this.preview ? 20 : 70
            let height = (this.width ? this.width : 300)*this.vis.size - margin_right
            let margin = {top: margin_top, right: margin_right, bottom: margin_bottom, left: margin_left}
            let annotation_height = this.preview ? 0 : this.vis.annotation === "None" ? margin.left : 70
            const icon_padding = 0.1
            const row_padding = 10
            const grid_padding = 10

            let max_range = this.get_value(this.visHelperStore.get_range(this.vis, data)[1])
            let max_range_y = Math.ceil(max_range / this.vis.grid[0])
            let max_range_x = Math.ceil(max_range / max_range_y) //reduce number of columns when context icons are hidden

            const dot_range_X = d3.range(0, max_range_x, 1)
            const dot_range_Y = d3.range(0, max_range_y, 1)
            const dot_range = d3.range(0, max_range, 1)

            const max_icon_width = 30

            if ((height/max_range_x) > max_icon_width) height = max_icon_width * max_range_x

            let y = d3.scaleBand()
                .domain(dot_range_X)
                .range([height + margin.top, margin.top + grid_padding + margin_top_labels])
                .padding(icon_padding)

            const icon_height = y.bandwidth()
            const icon_width = icon_height * this.vis.ratio
            const icon_padding_px = y.step() - y.bandwidth() //padding in pixel to compute height

            const row_width = (icon_width + icon_padding_px) * max_range_y
            //x position inside each row
            let x = d3.scaleBand()
                .domain(dot_range_Y)
                .range([0, row_width])
                .padding(icon_padding)

            let width = data.length * (row_width + row_padding) // icon_height for margins

            //x position of each row
            let x_row = d3.scaleBand()
                .domain(data.map(d => d.name))
                .range([margin.left + grid_padding, margin.left + 2*grid_padding + width])


            let svg = d3.create("svg")
                .attr("height", height + margin.top + margin.bottom + annotation_height)
                .attr("width", width + margin.right + margin.left + grid_padding * 2)
                .attr("viewBox", [0, 0, width + margin.left + margin.right + grid_padding * 2, height + margin.top + margin.bottom + annotation_height])
                .attr("font-family", this.vis.font_family)

            let bgcolor = this.visHelperStore.get_bgcolor(this.vis.background.color, this.vis.color[1])

            //background
            svg.append("rect")
                .attr("y", margin.top)
                .attr("x", margin.left)
                .attr("height", height + margin.bottom)
                .attr("width", width + grid_padding * 2)
                .attr("fill", bgcolor)
                .attr("stroke", this.vis.background.stroke)
                .attr("stroke-width", 2)

            let brightness_background = d3.hsl(bgcolor).l
            let contrasting_color = brightness_background > 0.9 ? "#bebebe" : "#fafafa"

            let emptyCircleColor = this.vis.context === true ? contrasting_color : bgcolor

            //one element per option
            svg.selectAll("option")
                .data(data)
                .join("g")
                .attr("y", margin.top)
                .attr("x", d => x_row(d.name))
                .each((par, index, node) => {
                    d3.select(node[index]).selectAll("text")
                        .data(dot_range)
                        .join("text")
                        .attr("y", d => y(Math.floor(d / max_range_y)))
                        .attr("x", d => x_row(par.name) + x(d % max_range_y) )
                        .attr("fill", d => ((d + 1) <= this.get_value(par.value)) ? this.vis.color[index] : emptyCircleColor)
                        .style("font-family", "Material Design Icons")
                        .html(d => ((d + 1) <= this.get_value(par.value)) ?this.getIcon(0) : this.getIcon(1))
                        .style("font-size", d3.max([icon_width, icon_height]) + "px")
                })


            svg.selectAll("textName")
                .data(data)
                .join("text")
                .attr("y", margin.top + margin_top_labels/2)
                .attr("x", d => x_row(d.name) + row_width / 2)
                .text(d => this.use_column_group_names ? this.visHelperStore.get_column_label(d, this.column, this.preview) : d.name)
                .style("text-anchor", "middle")
                .attr("dy", 7*this.vis.ratio)

            if (!this.preview) {
                svg.selectAll("textValue")
                    .data(data)
                    .join("text")
                    .attr("y", height + margin.top)
                    .attr("x", d => x_row(d.name) + row_width / 2)
                    .text("")
                    .style("text-anchor", "middle")
                    .style("fill", "black")
                    .each((par, index, node) => {
                        d3.select(node[index]).selectAll("textParts")
                            .data(this.get_value_text(par.value))
                            .join("tspan")
                            .text(d => d.text)
                            .style("fill", d => d.color[index])
                    })
                    .attr("dy", 7*this.vis.ratio)


            }

            //title
            let title = svg.append("text")
                .attr("x", margin.left + width / 2)
                .attr("y", margin.top / 2)
                .style("text-anchor", "middle")
                .text("")
                .style("font-size", this.preview ? "1em" : "1.1em")
            this.visHelperStore.append_tspans(title, this.vis.title, this.column, this.preview)

            //annotations
            //use this.getComputedTextLength to split up into multiple parts?
            let gap = 20
            if (!this.preview && this.vis.annotation !== undefined && this.vis.annotation !== "None") {
                let targets_y = this.vis.annotation.target.map(d => x_row(d))
                //text
                this.vis.annotation.text.forEach((t, i) => {
                    let annotation = svg.append("text")
                        .attr("y", height + margin.top + margin.bottom + gap + 15*i)
                        .attr("x", margin.left + width/2)
                        .style("text-anchor", "middle")
                        .attr("width", width)
                        .attr("dy", 7*this.vis.ratio)
                    this.visHelperStore.append_tspans(annotation, t, this.column)
                })

                //lines
                svg.selectAll("line")
                    .data(targets_y)
                    .join("line")
                    .attr("y1", height + margin.top + margin.bottom + gap - 10)
                    .attr("x1", d => d + 10)
                    .attr("y2", height + margin.top + margin.bottom + gap - 10)
                    .attr("x2", d => d + row_width + 10)
                    .attr("stroke", "#505050")
                    .attr("stroke-width", 3)
            }


            d3.select(this.$refs.container).selectAll("*").remove()
            d3.select(this.$refs.container).node().append(svg.node())
            if (!this.preview) {
                this.$emit('svg', svg.node(), height + margin.left + margin.right + annotation_height)
            }
        },
        /**
         * returns current icon used as items of the pictograph
         *
         * @returns {string}
         */
        getIcon(i) {
            // this copies the content from the pseudo element :before as it's needed to show the icon from material design
            const icon = (i === 0) ? this.vis.icon : this.vis.icon2
            const ele = document.querySelector('.mdi-' + icon);
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