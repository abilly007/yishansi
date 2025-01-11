const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const db = cloud.database()
  const _ = db.command
  const amount = event.amount || 0

  try {
    // 1. 查询用户余额
    console.log('OPENID:', OPENID)
    const { data: users } = await db.collection('users')
      .where({ _openid: OPENID })
      .get()

    console.log('查询到的用户:', users)

    if (!users.length) {
      console.error('用户不存在:', OPENID)
      return {
        code: -1,
        error: '用户不存在'
      }
    }

    const user = users[0]
    console.log('用户余额:', user.balance, '支付金额:', amount)
    if (user.balance < amount) {
      return {
        code: -1,
        error: '余额不足'
      }
    }

    // 2. 扣除用户余额
    const newBalance = user.balance - amount
    console.log('更新前余额:', user.balance, '更新后余额:', newBalance)
    
    try {
      await db.collection('users').doc(user._id).update({
        data: {
          balance: newBalance,
          pay: amount,
          last_pay: db.serverDate()
        }
      })
      console.log('用户余额更新成功')
    } catch (updateErr) {
      console.error('用户余额更新失败:', updateErr)
      throw updateErr
    }

    // 3. 更新奖池金额和参与人数
    try {
      // 先获取当前统计数据
      const { data: stats } = await db.collection('statistics').doc('total').get()
      console.log('当前统计数据:', stats)

      await db.collection('statistics').doc('total').update({
        data: {
          prize_money: _.inc(amount),
          players: stats.players + (user.pay === 0 ? 1 : 0),  // 只有首次支付才增加参与人数
          updateTime: db.serverDate()
        }
      })
      console.log('统计数据更新成功')

      // 再次确认更新结果
      const { data: updatedStats } = await db.collection('statistics').doc('total').get()
      console.log('更新后的统计数据:', updatedStats)
    } catch (statsErr) {
      console.error('统计数据更新失败:', statsErr)
      throw statsErr
    }

    // 4. 再次查询确认更新结果
    const { data: updatedUser } = await db.collection('users')
      .doc(user._id)
      .get()
    console.log('更新后的用户数据:', updatedUser)

    return {
      code: 0,
      msg: '支付成功',
      data: {
        balance: newBalance,
        _openid: OPENID
      }
    }
  } catch (err) {
    console.error('支付失败', err)
    return {
      code: -1,
      error: err.message || '支付失败'
    }
  }
} 