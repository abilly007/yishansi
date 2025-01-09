// index.js
const app = getApp()

Page({
  data: {
    onlineUsers: 0,
    totalUsers: 0,
    prizeMoney: 0,
    brokenMoney: 100,
    players: 0,
    isBreaking: false,
    showModal: false,
    showWinNotice: false,
    winner: null
  },

  onLoad() {
    // 监听数据更新
    wx.cloud.database().collection('statistics').doc('total').watch({
      onChange: (snapshot) => {
        if (snapshot.type === 'init' || snapshot.type === 'update') {
          const data = snapshot.docs[0]
          this.setData({
            onlineUsers: data.onlineUsers,
            totalUsers: data.totalUsers,
            prizeMoney: data.prize_money,
            brokenMoney: data.broken_money,
            players: data.players,
            isBreaking: data.is_breaking
          })
        }
      },
      onError: (err) => {
        console.error('监听数据失败', err)
      }
    })
    // 立即更新一次数据
    this.updateStats()
    // 监听开奖结果
    this.watchLotteryResult()
  },

  onShow() {
    // 每次显示页面时更新数据
    this.updateStats()
  },

  handleWork() {
    wx.showToast({
      title: '好好上班！',
      icon: 'success'
    })
  },

  handlePray() {
    const userInfo = wx.getStorageSync('userInfo')
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }
    this.setData({ showModal: true })
  },

  handleModalClose() {
    this.setData({ showModal: false })
  },

  async handlePaySuccess({ detail }) {
    const { amount } = detail
    // 刷新实时数据页面的统计数据
    const pages = getCurrentPages()
    const statsPage = pages.find(p => p.route === 'pages/stats/stats')
    if (statsPage && statsPage.getStatsData) {
      statsPage.getStatsData()
    }
    // 刷新用户余额
    const profilePage = pages.find(p => p.route === 'pages/profile/profile')
    if (profilePage && profilePage.getUserBalance) {
      profilePage.getUserBalance()
    }
  },

  async updateStats() {
    try {
      wx.showLoading({
        title: '加载中...',
        mask: true
      })
      const { result } = await wx.cloud.callFunction({
        name: 'updateStats'
      })
      if (result.code === 0) {
        console.log('统计数据更新成功:', result.data)
      }
    } catch (err) {
      console.error('更新统计数据失败', err)
      wx.showToast({
        title: '数据更新失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 监听开奖结果
  watchLotteryResult() {
    const db = wx.cloud.database()
    db.collection('lottery_results')
      .orderBy('createTime', 'desc')
      .limit(1)
      .watch({
        onChange: (snapshot) => {
          if (snapshot.type === 'init') return
          if (snapshot.docs.length > 0) {
            const result = snapshot.docs[0]
            this.setData({
              winner: result,
              showWinNotice: true
            })
          }
        },
        onError: (err) => {
          console.error('监听开奖结果失败', err)
        }
      })
  },

  handleWinNoticeClose() {
    this.setData({
      showWinNotice: false,
      winner: null
    })
  }
})
