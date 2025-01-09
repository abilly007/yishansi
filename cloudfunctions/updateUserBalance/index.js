const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const db = cloud.database()
  
  try {
    // 查找所有余额为0或没有余额字段的用户
    const { data: users } = await db.collection('users')
      .where({
        balance: db.command.or([
          db.command.exists(false),  // 没有balance字段
          db.command.eq(0)           // balance为0
        ])
      })
      .get()

    // 批量更新这些用户的余额
    const updatePromises = users.map(user => {
      return db.collection('users').doc(user._id).update({
        data: {
          balance: 100  // 设置初始余额
        }
      })
    })

    await Promise.all(updatePromises)

    return {
      code: 0,
      msg: '更新成功',
      updated: users.length
    }
  } catch (err) {
    console.error('更新用户余额失败', err)
    return {
      code: -1,
      error: err
    }
  }
} 