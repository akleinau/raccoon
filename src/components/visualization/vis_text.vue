<template>
    <div :style="'width: ' + width + 'px; font-size: ' + font_size + 'rem; font-family: ' + vis.font_family"
         class="pb-3" v-if="!(preview && vis.type==='overall')">
        <span v-for="item in helperStore.parse_text(generate_text, column)" v-bind:key=item
              :style="'color: ' + item.color">{{ item.text }}</span>
    </div>
</template>

<script>
import {useDashboardStore} from "@/stores/dashboardStore";
import {useHelperStore} from "@/stores/helperStore";

export default {
    name: "vis_text",
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

            //create text from data_map and type

            //get option with max percent
            let max_percent_option = Object.entries(this.column.percent_target_option).sort((a, b) => b[1] - a[1])[0]
            if (max_percent_option) {
                //get percentage of max percent
                if (this.vis.type === 'significance') return [{
                    text: "$rows with $column: " + max_percent_option[0] + " have a " +
                        (max_percent_option[1] * 100).toFixed(0) + "% chance of having $target_label",
                    color: this.vis.color
                }]

                if (this.vis.type === 'impact') {
                    if (!this.vis.detailLevel || this.vis.detailLevel === 'nominator') return [{
                        text: this.column.occurrence[max_percent_option[0]] + " $rows have $column: " + max_percent_option[0],
                        color: this.vis.color
                    }]

                    if (this.vis.detailLevel === 'denominator') return [{
                        text: this.column.occurrence[max_percent_option[0]] + " of " + Object.values(this.column.occurrence).reduce((a, b) => a + b, 0) +
                            " $rows have $column: " + max_percent_option[0],
                        color: this.vis.color
                    }]

                    if (this.vis.detailLevel === 'percent') return [{
                        text: (this.column.occurrence[max_percent_option[0]] / Object.values(this.column.occurrence).reduce((a, b) => a + b, 0) * 100).toFixed(0) +
                            "% of $rows have $column: " + max_percent_option[0],
                        color: this.vis.color
                    }]


                }

                let greatest_occurrence = Object.entries(this.column.occurrence).sort((a, b) => b[1] - a[1])[0]
                if (this.vis.type === 'overall') return [
                    {
                        text: "Most people have a $column of " + this.column.options.find(d => d.name === greatest_occurrence[0]).label + " resulting in a likelihood of $target_label of " +
                            (this.column.percent_target_option[greatest_occurrence[0]] * 100).toFixed(0) + "%.",
                        color: this.vis.color
                    },
                    {
                        text: " For people with a $column of " + this.column.options.find(d => d.name === max_percent_option[0]).label + " the likelihood increases to " +
                            (max_percent_option[1] * 100).toFixed(0) + "%.",
                    }
                ]

            }

            return [{text: "", color: "$color"}]
        }
    }
}
</script>

<style scoped>

</style>