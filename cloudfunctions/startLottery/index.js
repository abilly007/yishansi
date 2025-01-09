const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const db = cloud.database()
  const _ = db.command
  
  try {
    // 设置开奖状态
    await db.collection('statistics').doc('total').update({
      data: {
        is_breaking: true
      }
    })

    // 获取所有参与用户（pay > 0）
    const { data: players } = await db.collection('users')
      .where({
        pay: _.gt(0)
      })
      .get()

    if (!players.length) {
      return {
        code: -1,
        error: '无参与用户'
      }
    }

    // 随机选择一名用户
    const winner = players[Math.floor(Math.random() * players.length)]

    // 获取奖池金额
    const { data: stats } = await db.collection('statistics').doc('total').get()
    const prizeAmount = stats.prize_money

    // 更新中奖用户余额
    await db.collection('users').doc(winner.openid).update({
      data: {
        balance: _.inc(prizeAmount),
        pay: 0  // 清空支付记录
      }
    })

    // 添加开奖记录
    await db.collection('lottery_results').add({
      data: {
        nickName: winner.nickName,
        avatarUrl: winner.avatarUrl,
        amount: prizeAmount,
        createTime: db.serverDate()
      }
    })

    // 清空其他用户的支付记录
    await db.collection('users').where({
      openid: _.neq(winner.openid)
    }).update({
      data: {
        pay: 0
      }
    })

    // 更新统计数据
    await db.collection('statistics').doc('total').update({
      data: {
        prize_money: 0,  // 清空奖池
        players: 0,      // 清空参与人数
        is_breaking: false,  // 结束开奖
        // 根据用户数量设置新的开奖金额
        broken_money: await calculateNewBrokenMoney()
      }
    })

    return {
      code: 0,
      data: {
        winner: {
          nickName: winner.nickName,
          amount: prizeAmount
        }
      }
    }
  } catch (err) {
    console.error(err)
    return {
      code: -1,
      error: err
    }
  }
}

// 计算新的开奖金额
async function calculateNewBrokenMoney() {
  const db = cloud.database()
  const { total: userCount } = await db.collection('users').count()
  
  if (userCount < 100) return 100
  if (userCount < 10000) return 1000
  if (userCount < 100000) return 10000
  if (userCount < 1000000) return 100000
  return 1000000
} 