<template>
  <!-- Choose Visualizations -->
    <v-dialog v-model="show">
        <template v-slot:activator="{ props }">

            <v-btn v-bind="props" class="h-auto pa-4 ma-2" variant="plain" v-if="visStore.excluded_columns.length > 0">
                excluded columns
            </v-btn>

        </template>

        <v-card title="Excluded columns">
            <v-list>
                <v-list-item v-for="column in visStore.excluded_columns" v-bind:key="column">
                    <template v-slot:prepend>
                        {{column}}
                        <v-btn @click="visStore.restore_column(column)" variant="plain" class="ml-2">restore</v-btn>
                    </template>

                </v-list-item>
            </v-list>

            <v-card-actions>
                <v-btn @click="close">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import {useVisStore} from "@/stores/visStore";

export default {
    name: "excluded_column_overlay",
    components: {},
    setup() {
        const visStore = useVisStore()
        return {visStore}
    },
    data() {
        return {
            show: false,
        }
    },
    methods: {
        close() {
            this.show = false
        }
    }
}
</script>

<style scoped>

</style>