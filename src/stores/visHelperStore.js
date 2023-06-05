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
        get_range(vis) {
            if (vis.range === "percent") {
                return [0, 1]
            } else {
                return vis.range
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
            return (preview && label.length > 10) ? label.substring(0, 6) + "..." : label
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
        append_tspans(el, text, column) {
            let text_array = useHelperStore().parse_text(text, column)

            el.selectAll("tspan")
                .data(text_array)
                .join("tspan")
                .text(d => d.text)
                .style("fill", d => d.color)
        },
        get_bgcolor(background, foreground) {
            let bgcolor = background
            if (background === "auto") {
                bgcolor = d3.hsl(foreground)
                bgcolor.s = bgcolor.s * 0.2
                bgcolor.l += (1 - bgcolor.l) * 0.8
            }
            return bgcolor
        }
    }
})