// pages/stats/stats.js
const websocket = require('../../utils/websocket')

Page({

  /**
   * 页面的初始数据
   */
  data: {
    onlineUsers: 0,
    totalUsers: 0,
    prizeMoney: 0,
    brokenMoney: 100,
    players: 0,
    isBreaking: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.getStatsData()
    this.updateStats()
    // 监听数据更新
    this.watchStats()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.updateStats()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  async getStatsData() {
    try {
      const db = wx.cloud.database()
      const { data } = await db.collection('statistics').doc('total').get()
      
      this.setData({
        onlineUsers: data.onlineUsers,
        totalUsers: data.totalUsers,
        prizeMoney: data.prize_money,
        brokenMoney: data.broken_money,
        players: data.players,
        isBreaking: data.is_breaking
      })
    } catch (err) {
      console.error('获取统计数据失败', err)
      wx.showToast({
        title: '数据加载失败',
        icon: 'none'
      })
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

  handleRefresh() {
    this.updateStats()
  },

  // 监听统计数据变化
  watchStats() {
    const db = wx.cloud.database()
    db.collection('statistics').doc('total').watch({
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
        wx.showToast({
          title: '数据监听失败',
          icon: 'none'
        })
      }
    })
  }
})