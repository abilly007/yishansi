const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const db = cloud.database()
  
  try {
    console.log('开始更新统计数据')
    
    // 统计总用户数（添加日志）
    const usersResult = await db.collection('users').count()
    const totalUsers = usersResult.total
    console.log('总用户数:', totalUsers)
    
    // 统计在线用户数（添加日志）
    const onlineResult = await db.collection('users')
      .where({
        isOnline: true
      })
      .count()
    const onlineUsers = onlineResult.total
    console.log('在线用户数:', onlineUsers)

    // 获取当前统计数据（添加日志）
    const statsResult = await db.collection('statistics').doc('total').get()
    console.log('当前统计数据:', statsResult.data)

    // 更新统计数据
    const updateResult = await db.collection('statistics').doc('total').update({
      data: {
        totalUsers,
        onlineUsers,
        updateTime: db.serverDate()
      }
    })
    console.log('更新结果:', updateResult)

    return {
      code: 0,
      data: {
        totalUsers,
        onlineUsers,
        updateResult
      }
    }
  } catch (err) {
    console.error('更新统计失败:', err)
    return {
      code: -1,
      error: err
    }
  }
} 