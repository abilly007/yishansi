Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    }
  },

  data: {
    text: '年轻人在上班和上进之间选择了上香，中年人在躺平和躺赢之间选择了先上香再上班',
    amounts: [1, 10, 50],
    selectedAmount: 0,
    showAmounts: false
  },

  methods: {
    handleClose() {
      this.setData({ showAmounts: false })
      this.triggerEvent('close')
    },

    handleWork() {
      wx.showToast({
        title: '好好上班！',
        icon: 'success'
      })
      this.handleClose()
    },

    handlePray() {
      this.setData({ showAmounts: true })
    },

    async handlePay(e) {
      const amount = e.currentTarget.dataset.amount
      try {
        const { result } = await wx.cloud.callFunction({
          name: 'payMoney',
          data: { amount }
        })

        if (result.code === 0) {
          wx.showToast({
            title: '上香成功',
            icon: 'success'
          })
          this.triggerEvent('pay-success', { amount })
        } else {
          wx.showToast({
            title: result.error,
            icon: 'none'
          })
        }
      } catch (err) {
        console.error('支付失败', err)
        wx.showToast({
          title: '支付失败',
          icon: 'none'
        })
      }
      this.handleClose()
    }
  }
}) 