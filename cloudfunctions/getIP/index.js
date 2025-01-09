const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  return {
    code: 0,
    ip: event.clientIP // 云函数会自动注入clientIP
  }
} 