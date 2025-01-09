const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const _ = db.command
  
  try {
    const { data: users } = await db.collection('users')
      .where({ _openid: wxContext.OPENID })
      .get()

    if (users.length > 0) {
      const user = users[0]
      // 如果用户在线且要设置为离线
      if (user.isOnline && !event.isOnline) {
        await db.collection('statistics').doc('total').update({
          data: {
            onlineUsers: _.inc(-1),
            updateTime: db.serverDate()
          }
        })
      }

      await db.collection('users').doc(user._id).update({
        data: {
          isOnline: event.isOnline
        }
      })
    }

    // 更新统计数据
    await cloud.callFunction({
      name: 'updateStats'
    })

    return {
      code: 0
    }
  } catch (err) {
    return {
      code: -1,
      error: err
    }
  }
} 