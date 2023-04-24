import { defineStore } from 'pinia'

export const useStore = defineStore('store', {
  state: () => ({
      start: true,
      csv: null,
      columns: [],
      target_column: null,
      target_all_options: [],
      target_option: null
  })
})
