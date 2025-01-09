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
        console.log('当前余额:', wx.getStorageSync('balance'))
        wx.showLoading({
          title: '支付中...',
          mask: true
        })

        const balance = wx.getStorageSync('balance') || 0
        if (balance < amount) {
          wx.showToast({
            title: '余额不足',
            icon: 'none'
          })
          this.handleClose()
          return
        }

        const { result } = await wx.cloud.callFunction({
          name: 'payMoney',
          data: { amount }
        })
        console.log('支付结果:', result)

        if (result.code === 0) {
          wx.setStorageSync('balance', result.data.balance)
          console.log('更新后余额:', result.data.balance)
          const pages = getCurrentPages()
          const profilePage = pages.find(p => p.route === 'pages/profile/profile')
          if (profilePage) {
            const openid = wx.getStorageSync('_openid')
            if (!openid && result.data._openid) {
              wx.setStorageSync('_openid', result.data._openid)
            }
            profilePage.setData({
              balance: result.data.balance
            })
            profilePage.getUserBalance()
          }
          const statsPage = pages.find(p => p.route === 'pages/stats/stats')
          if (statsPage && statsPage.getStatsData) {
            statsPage.getStatsData()
          }
          setTimeout(() => {
            wx.showToast({
              title: '上香成功',
              icon: 'success',
              duration: 2000
            })
          }, 100)
          this.triggerEvent('pay-success', { amount })
        } else {
          wx.showToast({
            title: result.error || '支付失败',
            icon: 'none'
          })
        }
      } catch (err) {
        console.error('支付失败', err)
        wx.showToast({
          title: '支付失败',
          icon: 'none'
        })
      } finally {
        wx.hideLoading()
        this.handleClose()
      }
    }
  }
}) 