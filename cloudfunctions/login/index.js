const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  const _ = db.command
  
  try {
    // 查询用户是否存在
    const { data: users } = await db.collection('users')
      .where({ _openid: OPENID })
      .get()

    const now = db.serverDate()
    
    if (users.length === 0) {
      // 新用户，创建用户记录
      const userData = {
        _openid: OPENID,
        nickName: event.userInfo.nickName,
        avatarUrl: event.userInfo.avatarUrl,
        gender: event.userInfo.gender,
        country: event.userInfo.country,
        province: event.userInfo.province,
        city: event.userInfo.city,
        lastLoginTime: now,
        lastLoginIP: event.clientIP,
        deviceInfo: event.deviceInfo,
        isOnline: true,
        createTime: now,
        balance: 100,
        pay: 0,
        last_pay: null
      }

      await db.collection('users').add({
        data: userData
      })

      // 更新总用户数和在线用户数
      await db.collection('statistics').doc('total').update({
        data: {
          totalUsers: _.inc(1),
          updateTime: now
        }
      })

      return {
        code: 0,
        msg: '登录成功',
        data: userData
      }
    } else {
      // 老用户，更新登录信息
      const userData = users[0]
      // 检查是否有余额，没有则设置初始余额
      if (!userData.balance) {
        userData.balance = 100
        await db.collection('users').doc(userData._id).update({
          data: { balance: 100 }
        })
      }
      await db.collection('users').doc(userData._id).update({
        data: {
          nickName: event.userInfo.nickName,
          avatarUrl: event.userInfo.avatarUrl,
          lastLoginTime: now,
          lastLoginIP: event.clientIP,
          deviceInfo: event.deviceInfo,
          isOnline: true
        }
      })

      // 检查用户是否已经在线
      if (!userData.isOnline) {
        await db.collection('statistics').doc('total').update({
          data: {
            onlineUsers: _.inc(1),
            updateTime: now
          }
        })
      }

      return {
        code: 0,
        msg: '登录成功',
        data: {
          ...userData,
          nickName: event.userInfo.nickName,
          avatarUrl: event.userInfo.avatarUrl,
          lastLoginTime: now,
          lastLoginIP: event.clientIP,
          deviceInfo: event.deviceInfo,
          isOnline: true
        }
      }
    }
  } catch (err) {
    console.error('登录失败', err)
    return {
      code: -1,
      error: err
    }
  }
} 