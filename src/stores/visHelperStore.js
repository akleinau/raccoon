import {defineStore} from 'pinia'
import {useHelperStore} from "@/stores/helperStore";
import * as d3 from "d3";

export const useVisHelperStore = defineStore('VisHelperStore', {
    state: () => ({}),
    actions: {
        /**
         * returns the range of the data
         *
         * @returns {number[]|*}
         */
        get_range(vis, data = []) {
            if (vis.context === true || data.length === 0) {
                if (vis.range === "percent") {
                    return [0, 1]
                } else {
                    return vis.range
                }
            }
            else {
                let max = d3.max(data, d => +d.value)
                let margin = 0.05 //percent added as margin
                if (vis.range === "percent") {
                    return [0, max+(max*margin)]
                }
                else {
                    return [vis.range[0], max+(max*margin)]
                }
            }

        },
        /**
         * returns the label of the column
         *
         * @param d
         * @returns {string}
         */
        get_column_label(d, column, preview) {
            let label = (d.name === "") ? "null" : column.options.find(x => x.name === d.name).label
            let boundary = 30 / column.options.length
            let text_length = Math.max(boundary-4, 2)
            return (preview && label.length > boundary) ? label.substring(0, text_length) + "..." : label
        },
        /**
         * converts datamap of a column to an array
         *
         * @param data
         * @returns {{name: *, value: *}[]}
         */
        datamap_to_array(data, options) {
            let array = Object.entries(data).map(([key, value]) => ({
                "name": key,
                "value": value
            }))
            array = array.sort((a, b) => useHelperStore().sort(
                options.find(x => x.name === a.name),
                options.find(x => x.name === b.name)))

            return array
        },
        /**
         * add text as tspans to an element to enable differently colored text segments
         *
         * @param el
         * @param text
         * @param column
         * @param preview
         */
        append_tspans(el, text, column, preview = false) {
            let text_array = useHelperStore().parse_text(text, column)

            el.selectAll("tspan")
                .data(text_array)
                .join("tspan")
                .text(d => d.text)
                .style("fill", d => d.color)
                .style("font-weight", d => d.weight && !preview ? "bold" : "normal")
                .style("font-style", d => d.italic && !preview? "italic" : "normal")
        },
        /**
         * returns background color. If background is set to auto, an appropriate color is selected. Else the background color is returned.
         *
         * @param background
         * @param foreground
         * @returns {*}
         */
        get_bgcolor(background, foreground) {
            let bgcolor = background
            if (background === "auto") {
                bgcolor = d3.hsl(foreground)
                bgcolor.s = bgcolor.s * 0.2
                bgcolor.l += (1 - bgcolor.l) * 0.8
            }
            return bgcolor
        },
        /**
         * create color list out of color specifications
         *
         * @param specification
         * @param standard
         * @param length
         * @returns {*[]}
         */
        create_color_list(specification, standard, length) {
            if (specification.type === "standard") {
                if (standard.type === "scheme") {
                    let color = d3.hsl(standard.color)
                    let spread = standard.spread

                    //start in the middle
                    let start_h_offset = spread * (length - 1) / 2
                    color.h += start_h_offset

                    //individualize h
                    color.h += Math.floor(specification.value * standard.global_spread)

                    if (color.h < 0) color.h += 360

                    //create list
                    let list = []
                    for (let i = 0; i < length; i++) {
                        list.push(color.formatHex())
                        color.h -= spread
                        if (color.h < 0) color.h += 360
                    }
                    return list
                } else return standard.list
            }
            else {
                return specification.list
            }
        },
    }
})