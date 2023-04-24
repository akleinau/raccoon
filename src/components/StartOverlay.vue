<template>
    <v-dialog v-model="start">
        <v-card title="Raccoon" class="flex mx-auto w-75">
            <div>
                <v-card-text>
                    Load Dataset:
                </v-card-text>
                <v-file-input label="File input" class="px-5" v-model="files"
                              @update:modelValue="uploaded"></v-file-input>
            </div>

            <div v-if="columns.length !== 0">
                <v-card-text>
                    Select target:
                </v-card-text>
                <v-select class="px-5" label="Select" :items="columns"
                ></v-select>
            </div>

            <v-card-actions>
                <v-btn color="primary" @click="start = false">Visualize</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import * as d3 from "d3";
import {useStore} from '@/stores/csvStore'

export default {
    setup() {
        const Store = useStore()
        return {Store}
    },
    data() {
        return {
            start: true,
            files: null,
            columns: []
        }
    },
    methods: {
        uploaded() {
            console.log("uploaded:")
            const csvFile = this.files[0];
            const name = csvFile.name.replace('.csv', '')
            console.log(name)
            const reader = new FileReader();
            reader.onload = (event) => {
                const data = d3.csvParse(event.target.result)
                this.columns = data.columns
                this.Store.csv = data
            }
            reader.readAsText(csvFile)
        },
    }
}
</script>
