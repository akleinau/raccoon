<template>
    <div v-for="el in new_text" v-bind:key="el" class="d-flex">
        <v-text-field label="text" v-model="el.text" class="mx-2"/>
        <v-text-field label="color" v-model="el.color" :style="'color:' + el.color"/>
    </div>
</template>

<script>
export default {
    name: "text-input",
    props: ['text'],
    data() {
        return {
            old_text: this.text,
            new_text: [{text: "test", color: "black"}, {text: "title", color: "orange"}]
        }
    },
}
</script>

<style scoped>

</style>