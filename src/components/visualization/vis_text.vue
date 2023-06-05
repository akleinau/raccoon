<template>
  <div :style="'width: ' + width + 'px; font-size: ' + font_size + 'rem; font-family: ' + vis.font_family">
      <span v-for="item in helperStore.parse_text(generate_text, column)" v-bind:key=item :style="'color: ' + item.color">{{item.text}}</span>
  </div>
</template>

<script>
import {useVisStore} from "@/stores/visStore";
import {useHelperStore} from "@/stores/helperStore";
export default {
    name: "vis_text",
    props: [
        "vis", "column", "width"
    ],
    setup() {
        const visStore = useVisStore()
        const helperStore = useHelperStore()
        return {visStore, helperStore}
    },
    computed: {
        font_size() {
            return this.vis.font_size ? this.vis.font_size : this.visStore.default_settings[this.vis.type].font_size
        },
        color() {
            return this.vis.color ? this.vis.color : this.visStore.default_settings[this.vis.type].color
        },
        generate_text() {
            if (this.vis.text) return this.vis.text

            //create text from data_map and type

            //get option with max percent
            let max_percent_option = Object.entries(this.column.percent_target_option).sort((a, b) => b[1] - a[1])[0]
            if (max_percent_option) {
                //get percentage of max percent
                if (this.vis.type === 'significance') return [{
                    text: "Participants with $column: " + max_percent_option[0] + " have a " +
                        (max_percent_option[1] * 100).toFixed(0) + "% chance of having $target_column: $target_option",
                    color: this.vis.color
                }]

                if (this.vis.type === 'impact') {
                    if (!this.vis.detailLevel || this.vis.detailLevel === 'nominator') return [{
                        text: this.column.occurrence[max_percent_option[0]] + " participants have $column: " + max_percent_option[0],
                        color: this.vis.color
                    }]

                    if (this.vis.detailLevel === 'denominator') return [{
                        text: this.column.occurrence[max_percent_option[0]] + " of " + Object.values(this.column.occurrence).reduce((a, b) => a + b, 0) +
                            " participants have $column: " + max_percent_option[0],
                        color: this.vis.color
                    }]

                    if (this.vis.detailLevel === 'percent') return [{
                        text: (this.column.occurrence[max_percent_option[0]] / Object.values(this.column.occurrence).reduce((a, b) => a + b, 0) * 100).toFixed(0) +
                            "% of participants have $column: " + max_percent_option[0],
                        color: this.vis.color
                    }]


                }
            }

            return [{text: "", color: "$color"}]
        }
    }
}
</script>

<style scoped>

</style>