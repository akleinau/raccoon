<template>
    <div class="d-flex flex-wrap">
        <div v-for="(el,i) in new_text" v-bind:key="el">
            <div class="d-flex justify-center align-center">
                <div>
                    <v-select class="mx-2" variant="underlined" :items="['black', '$color', custom_colors[i]]"
                              v-model="el.color" style="width:50px" :disabled="disabled">
                        <template v-slot:selection="{ item }">
                            <v-icon :style="'color:' + get_color(item.value)">mdi-circle</v-icon>
                        </template>
                        <template v-slot:item="{ item }">
                            <div>
                                <v-btn @click="el.color=item.value" class="w-100" variant="text">
                                    <v-icon v-if="item.value !== 'black' && item.value !== '$color'">mdi mdi-pencil
                                    </v-icon>
                                    <v-icon v-else :style="'color:' + get_color(item.value)">mdi-circle</v-icon>
                                    <color-dialog v-if="item.value !== 'black' && item.value !== '$color'"
                                                  :color="get_color(custom_colors[i])"
                                                  @update="custom_colors[i] = $event; el.color = $event;"></color-dialog>
                                </v-btn>
                            </div>
                        </template>
                    </v-select>
                </div>
                <v-btn icon="mdi-delete" variant="plain" density="compact" :disabled="disabled"
                       @click="delete_text_el(i)"></v-btn>
                <v-btn icon="mdi-plus" variant="plain" density="compact" :disabled="disabled"
                       @click="add_text_el(i)"></v-btn>
            </div>
            <v-textarea label="text" class="mx-1 text-no-wrap" v-model="el.text" :rows="1" auto-grow :disabled="disabled"
                :style="'width:' + +(el.text.length*9 + 30) + 'px; min-width:130px'"/>
        </div>
    </div>
</template>

<script>
import ColorDialog from "@/components/helpers/color-dialog.vue";

export default {
    name: "text-input",
    components: {ColorDialog},
    props: ['text', 'default', 'color', 'disabled'],
    emits: ['change'],
    data() {
        return {
            old_text: "",
            new_text: "",
            custom_colors: []
        }
    },
    watch: {
        text: {
            handler: function () {
                this.update_texts()
            },
            deep: true

        },
        new_text: {
            handler: function () {
                if (this.text !== undefined) {
                    this.$emit("change", this.new_text)
                }
            },
            deep: true
        }
    },
    created() {
        this.update_texts()
        this.custom_colors = this.default.map(_ => "green")
    },
    methods: {
        get_color(color) {
            if (color === "$color") {
                return this.color
            } else {
                return color
            }
        },
        update_texts() {
            if (this.text && this.text !== "") {
                this.new_text = this.text
            } else {
                this.new_text = JSON.parse(JSON.stringify(this.default))
            }
        },
        add_text_el(i) {
            this.new_text.splice(i + 1, 0, {text: "", color: "black"})
            this.custom_colors.splice(i + 1, 0, "green")
        },
        delete_text_el(i) {
            this.new_text.splice(i, 1)
            this.custom_colors.splice(i, 1)
        }
    }
}
</script>

<style scoped>

</style>