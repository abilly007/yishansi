// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'yishansi-1gi3lcns459b37e9',
        traceUser: true
      })
    }

    // 监听小程序切前台
    wx.onAppShow(() => {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        wx.cloud.callFunction({
          name: 'updateUserStatus',
          data: {
            isOnline: true
          }
        })
      }
    })

    // 监听小程序切后台
    wx.onAppHide(() => {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        wx.cloud.callFunction({
          name: 'updateUserStatus',
          data: {
            isOnline: false
          }
        })
      }
    })
  }
})
