<template>
    <StartOverlay/>

    <v-card title="Risk Factors" class="pa-5">
        {{Store.csv.columns}}
    </v-card>

</template>

<script>
import StartOverlay from './components/StartOverlay.vue'
import {useStore} from "@/stores/csvStore";

export default {
    components: {
        StartOverlay
    },
    setup() {
        const Store = useStore()
        return {Store}
    }
}
</script>

<style scoped></style>
