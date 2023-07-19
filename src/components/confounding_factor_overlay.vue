<template>
    <v-dialog v-model="show" :scrim="false" width="auto">
        <template v-slot:activator="{ props }">

            <v-btn v-bind="props" class="h-auto px-4 mx-2" variant="plain" prepend-icon="mdi-pencil">
                change
            </v-btn>

        </template>
        <v-card>
            <v-card-title class="mx-3">Confounding Factors</v-card-title>
            <v-card-text>
                <div v-for="item in confounding_factors" v-bind:key="item">
                    <v-checkbox v-model="item.factor" :label="item.name" @change="factor_changed(item)" hide-details/>
                </div>
            </v-card-text>

        </v-card>
    </v-dialog>
</template>

<script>
import {useDashboardStore} from "@/stores/dashboardStore";
import {useRegressionStore} from "@/stores/regressionStore";

export default {
    name: "confounding_factor_overlay",
    setup() {
        const dashboardStore = useDashboardStore()
        const regressionStore = useRegressionStore()
        return {dashboardStore, regressionStore}
    },
    data() {
        return {
            show: false,
            confounding_factors: []
        }
    },
    mounted() {
        this.update_factors()
    },
    watch: {
        show() {
            this.update_factors()
        }
    },
    methods: {
        update_factors() {
            this.confounding_factors = this.dashboardStore.dashboard_items.map(item => ({
                name: item.column.label,
                column: item.column,
                factor: this.dashboardStore.is_confounding_factor(item.column)
            }))
        },
        factor_changed(item) {
            if (item.factor === true) {
                this.dashboardStore.add_confounding_factor(item.column)
            } else {
                this.dashboardStore.remove_confounding_factor(item.column)
            }
            this.regressionStore.compute_score()
        }
    }

}
</script>

<style scoped>

</style>