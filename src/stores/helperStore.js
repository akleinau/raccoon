import {defineStore} from 'pinia'

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
            let a_split = a.split("-")
            let b_split = b.split("-")
            let a_is_number = !isNaN(a_split[0]) && a_split[0] !== ""
            let b_is_number = !isNaN(b_split[0]) && b_split[0] !== ""
            if (a_is_number && b_is_number) {
                return a_split[0] - b_split[0]
            }
            if (a_is_number) {
                return -1
            }
            if (b_is_number) {
                return 1
            }
            return a.localeCompare(b)
        },
        /**
         * calculates the maximum length of all options
         * @param options
         * @returns {*}
         */
        get_max_length(options) {
            return options.reduce((max, option) => Math.max(max, option.length), 0)
        }

    }
})