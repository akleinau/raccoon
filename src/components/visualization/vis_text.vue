<template>
    <div :style="'width: ' + +(width*vis.size) + 'px; font-size: ' + font_size + 'rem; font-family: ' + vis.font_family"
         class="pb-3" v-if="!(preview && vis.type==='overall')">
        <span v-for="item in helperStore.parse_text(generate_text, column)" v-bind:key=item
              :style="'color: ' + item.color + ';font-style:' + item.weight">{{ item.text }}</span>
    </div>
    <div v-else></div>
</template>

<script>
import {useDashboardStore} from "@/stores/dashboardStore";
import {useHelperStore} from "@/stores/helperStore";
import * as d3 from "d3";

export default {
    name: "vis_text",
    emits: ['text'],
    props: [
        "vis", "column", "width", "preview"
    ],
    setup() {
        const dashboardStore = useDashboardStore()
        const helperStore = useHelperStore()
        return {dashboardStore, helperStore}
    },
    computed: {
        font_size() {
            return this.vis.font_size ? this.vis.font_size : this.dashboardStore.default_settings[this.vis.type].font_size
        },
        color() {
            return this.vis.color ? this.vis.color : this.dashboardStore.default_settings[this.vis.type].color
        },
        generate_text() {
            if (this.vis.text) return this.vis.text

            //text for significance annotations
            if (this.vis.type === 'significance') {
                //significance
                if (this.column.significance !== undefined && this.column.significance.significant_tuples.length === 0 && this.column.options.length > 1) {
                    return [{"text": "Not statistically significant!", "color": "black"}]
                } else if (this.column.significance !== undefined) {
                    //highest significant percentage
                    let greatest_significance = JSON.parse(JSON.stringify(this.column.significance.significant_tuples)).sort((a, b) => this.column.percent_target_option[b] - this.column.percent_target_option[a])[0]
                    let value = this.column.percent_target_option[greatest_significance]
                    let label = this.column.options.find(d => d.name === greatest_significance).label

                    if (this.vis.unit === 'natural_frequencies') {
                        const grid = this.vis.grid
                        const grid_size = grid[0] * grid[1]

                        return [{
                            text: (value * grid_size).toFixed(0) + "/" + grid_size + " $rows with $column: " + label +
                                " have $outcome",
                            color: this.vis.color
                        }]
                    } else {
                        return [{
                            text: "$rows with $column: " + label + " have a " +
                                (value * 100).toFixed(0) + "% chance of having $outcome",
                            color: this.vis.color
                        }]
                    }

                }
            }

            //text for impact annotations
            if (this.vis.type === 'impact') {

                let greatest_occurrence = Object.entries(this.column.occurrence).sort((a, b) => b[1] - a[1])[0]

                if (this.vis.unit === 'natural_frequencies') return [{
                    text: this.column.occurrence[greatest_occurrence[0]] + " of " + Object.values(this.column.occurrence).reduce((a, b) => a + b, 0) +
                        " $rows have $column: " + greatest_occurrence[0],
                    color: this.vis.color
                }]

                if (this.vis.unit === 'percent') return [{
                    text: (this.column.occurrence[greatest_occurrence[0]] / Object.values(this.column.occurrence).reduce((a, b) => a + b, 0) * 100).toFixed(0) +
                        "% of $rows have $column: " + greatest_occurrence[0],
                    color: this.vis.color
                }]


            }

            //text for overall annotations
            if (this.vis.type === 'overall') {
                let array = []

                let greatest_occurrence = Object.entries(this.column.occurrence).sort((a, b) => b[1] - a[1])[0]
                const significance_unit = this.dashboardStore.default_settings.significance.unit
                const grid = this.dashboardStore.default_settings.significance.grid
                const grid_size = grid[0] * grid[1]

                if (significance_unit === "natural_frequencies") {
                    array.push(
                        {
                            text: "Most people have a ",
                            color: this.vis.color
                        },
                        {
                            text: "$column of " + this.column.options.find(d => d.name === greatest_occurrence[0]).label,
                            color: this.vis.color,
                            weight: "italic"
                        },
                        {
                            text: " with a likelihood of " +
                                (this.column.percent_target_option[greatest_occurrence[0]] * grid_size).toFixed(0) + "/" + grid_size + " $rows having ",
                            color: this.vis.color
                        },
                        {
                            text: "$outcome.",
                            color: this.vis.color,
                            weight: "italic"
                        },
                    )
                } else {
                    array.push(
                        {
                            text: "Most people have a ",
                            color: this.vis.color
                        },
                        {
                            text: "$column of " + this.column.options.find(d => d.name === greatest_occurrence[0]).label,
                            color: this.vis.color,
                            weight: "italic"
                        },
                        {
                            text: " resulting in a " +
                                (this.column.percent_target_option[greatest_occurrence[0]] * 100).toFixed(0) + "% likelihood of ",
                            color: this.vis.color
                        },
                        {
                            text: "$outcome.",
                            color: this.vis.color,
                            weight: "italic"
                        },
                    )
                }

                if (this.column.significance !== undefined && this.column.significance.significant_tuples.length === 0 && this.column.options.length > 1) {
                    array.push(
                        {
                            text: "There are no statistically significant differences in likelihood depending on ",
                            color: this.vis.color,
                        },
                        {
                            text: "$column.",
                            color: this.vis.color,
                            weight: "italic"
                        }
                    )
                } else if (this.column.significance !== undefined) {
                    //highest significant percentage
                    let greatest_significance = JSON.parse(JSON.stringify(this.column.significance.significant_tuples)).sort((a, b) => this.column.percent_target_option[b] - this.column.percent_target_option[a])[0]
                    let value = this.column.percent_target_option[greatest_significance]
                    let label = this.column.options.find(d => d.name === greatest_significance).label

                    if (label === greatest_occurrence[0]) {
                        array.push({
                            text: " These are also the $rows with the highest statistically significant risk."
                        })
                    } else if (significance_unit === "natural_frequencies") {
                        array.push(
                            {
                                text: " For people with a ",
                                color: this.vis.color
                            },
                            {
                                text: "$column of " + label,
                                color: this.vis.color,
                                weight: "italic"
                            },
                            {
                                text: " the likelihood increases to " +
                                    (value * grid_size).toFixed(0) + "/" + grid_size + " $rows.",
                                color: this.vis.color
                            }
                        )
                    } else {
                        array.push(
                            {
                                text: " For people with a ",
                                color: this.vis.color
                            },
                            {
                                text: "$column of " + label,
                                color: this.vis.color,
                                weight: "italic"
                            },
                            {
                                text: " the likelihood increases to " +
                                    (value * 100).toFixed(0) + "%.",
                                color: this.vis.color
                            }
                        )
                    }
                }

                return array
            }

            return [{text: "", color: "$color"}]
        }
    },
    watch: {
        generate_text: {
            handler() {
                this.$emit('text', this.generate_text)
            },
            deep: true
        }
    },
    mounted() {
        this.$emit('text', this.generate_text)
    }
}
</script>

<style scoped>

</style>