// pages/profile/profile.js
const app = getApp()

Page({
  data: {
    userInfo: null,
    hasUserInfo: false,
    balance: 0
  },

  onLoad() {
    // 检查是否已经登录
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        hasUserInfo: true
      })
      // 确保获取openid
      const openid = wx.getStorageSync('_openid')
      if (!openid) {
        wx.cloud.callFunction({
          name: 'login',
          data: {
            userInfo,
            deviceInfo: wx.getSystemInfoSync()
          }
        }).then(({ result }) => {
          if (result.data) {
            wx.setStorageSync('balance', result.data.balance)
            this.setData({
              balance: result.data.balance
            })
          }
        })
      } else {
        this.getUserBalance()
      }
    }

    // 监听用户数据变化
    const db = wx.cloud.database()
    db.collection('users').where({
      _openid: wx.getStorageSync('_openid')
    }).watch({
      onChange: (snapshot) => {
        if (snapshot.type === 'init' || snapshot.type === 'update') {
          const userData = snapshot.docs[0]
          if (userData) {
            this.setData({
              balance: userData.balance
            })
            wx.setStorageSync('balance', userData.balance)
          }
        }
      },
      onError: (err) => {
        console.error('监听用户数据失败', err)
      }
    })
  },

  async handleLogin() {
    try {
      // 1. 获取用户信息
      const { userInfo } = await wx.getUserProfile({
        desc: '用于完善会员资料'
      })

      // 2. 获取设备信息
      const systemInfo = wx.getSystemInfoSync()
      const deviceInfo = {
        brand: systemInfo.brand,
        model: systemInfo.model,
        system: systemInfo.system
      }

      // 3. 获取IP地址
      const { result: ipResult } = await wx.cloud.callFunction({
        name: 'getIP'
      })

      // 4. 调用登录云函数
      const { result } = await wx.cloud.callFunction({
        name: 'login',
        data: {
          userInfo,
          deviceInfo,
          clientIP: ipResult.ip
        }
      })

      if (result.code === 0) {
        // 5. 更新页面显示
        this.setData({
          userInfo: userInfo,
          hasUserInfo: true
        })
        wx.setStorageSync('userInfo', userInfo)
        
        // 6. 更新在线状态
        await wx.cloud.callFunction({
          name: 'updateUserStatus',
          data: {
            isOnline: true
          }
        })

        // 保存用户信息
        wx.setStorageSync('userInfo', userInfo)
        // 保存openid
        if (result.data && result.data._openid) {
          wx.setStorageSync('_openid', result.data._openid)
        }
        // 保存用户余额
        if (result.data) {
          wx.setStorageSync('balance', result.data.balance)
          this.setData({
            balance: result.data.balance
          })
        }

        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      console.error('登录失败', err)
      wx.showToast({
        title: '登录失败',
        icon: 'none'
      })
    }
  },

  async handleLogout() {
    try {
      // 更新在线状态
      await wx.cloud.callFunction({
        name: 'updateUserStatus',
        data: {
          isOnline: false
        }
      })

      // 清除本地存储
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('_openid')
      wx.removeStorageSync('balance')

      // 更新页面状态
      this.setData({
        userInfo: null,
        hasUserInfo: false,
        balance: 0
      })

      wx.showToast({
        title: '已退出登录',
        icon: 'success'
      })
    } catch (err) {
      console.error('退出登录失败', err)
      wx.showToast({
        title: '退出失败',
        icon: 'none'
      })
    }
  },

  // 获取用户余额
  async getUserBalance() {
    try {
      console.log('开始获取余额')
      const db = wx.cloud.database()
      const openid = wx.getStorageSync('_openid')
      console.log('当前openid:', openid)
      if (!openid) {
        // 如果没有 openid，重新调用登录
        const { result } = await wx.cloud.callFunction({
          name: 'login',
          data: {
            userInfo: wx.getStorageSync('userInfo'),
            deviceInfo: wx.getSystemInfoSync()
          }
        })
        if (result.data && result.data._openid) {
          wx.setStorageSync('_openid', result.data._openid)
          this.getUserBalance()  // 递归调用自己
          return
        }
      }
      
      const { data } = await db.collection('users')
        .where({
          _openid: openid
        })
        .get()
      
      console.log('查询到的用户数据:', data)
      if (data.length) {
        wx.setStorageSync('balance', data[0].balance)
        this.setData({
          balance: data[0].balance
        })
        console.log('余额已更新:', data[0].balance)
      }
    } catch (err) {
      console.error('获取余额失败', err)
      wx.showToast({
        title: '获取余额失败',
        icon: 'none'
      })
    }
  },

  // 充值功能（预留）
  handleRecharge() {
    wx.showToast({
      title: '充值功能开发中',
      icon: 'none'
    })
  },

  // 提现功能（预留）
  handleWithdraw() {
    wx.showToast({
      title: '提现功能开发中',
      icon: 'none'
    })
  },

  onShow() {
    if (this.data.hasUserInfo) {
      this.getUserBalance()
    }
  },

  async handlePaySuccess({ detail }) {
    const { amount } = detail
    // 更新统计数据
    await this.updateStats()
    // 更新用户余额显示
    this.getUserBalance()
  }
})