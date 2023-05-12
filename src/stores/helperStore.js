import {defineStore} from 'pinia'
import * as d3 from "d3";
import {useCSVStore} from "@/stores/csvStore";

export const useHelperStore = defineStore('helperStore', {
    state: () => ({}),
    actions: {
        /**
         * sorts options first by number, then by their string name
         *
         * @param a
         * @param b
         * @returns {number}
         */
        sort(a, b) {
            if (a.range !== undefined && b.range !== undefined) {
                return a.range[0] - b.range[0]
            }
            if (a.range !== undefined) {
                return -1
            }
            if (b.range !== undefined) {
                return 1
            }
            return a.name.localeCompare(b.name)
        },
        /**
         * calculates the maximum length of all options
         * @param options
         * @returns {*}
         */
        get_max_length(options) {
            return options.reduce((max, option) => Math.max(max, option.length), 0)
        },

    }
})