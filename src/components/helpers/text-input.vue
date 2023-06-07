<template>
    <div v-for="el in new_text" v-bind:key="el" class="d-flex">
        <v-text-field label="text" v-model="el.text" class="mx-2" :disabled="disabled"/>
        <v-text-field label="color" v-model="el.color" :disabled="disabled">
            <template v-slot:prepend>
                <v-icon :style="'color:' + get_color(el.color)">
                    mdi-circle
                </v-icon>
                <color-dialog v-if="el.color !== '$color'" :color="get_color(el.color)"
                              @update="el.color = $event"></color-dialog>
            </template>
        </v-text-field>
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
            new_text: ""
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
        }
    }
}
</script>

<style scoped>

</style>