Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    winner: {
      type: Object,
      value: null
    }
  },

  methods: {
    handleClose() {
      this.triggerEvent('close')
    }
  }
}) 