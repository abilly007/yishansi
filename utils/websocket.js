class WebSocketClient {
  constructor() {
    this.connectUrl = 'wss://你的websocket地址'
    this.status = 'closed'
    this.reconnectTimer = null
    this.heartBeatTimer = null
    this.socket = null
  }

  connect() {
    if (this.status === 'connecting') return
    
    this.status = 'connecting'
    this.socket = wx.connectSocket({
      url: this.connectUrl,
      success: () => {
        console.log('WebSocket连接成功')
        this.status = 'connected'
        this.startHeartBeat()
      },
      fail: (err) => {
        console.error('WebSocket连接失败', err)
        this.reconnect()
      }
    })

    this.initEventHandlers()
  }

  initEventHandlers() {
    this.socket.onClose(() => {
      this.status = 'closed'
      this.reconnect()
    })

    this.socket.onError(() => {
      this.status = 'error'
      this.reconnect()
    })

    this.socket.onMessage((res) => {
      try {
        const data = JSON.parse(res.data)
        // 处理收到的消息
        this.handleMessage(data)
      } catch (err) {
        console.error('消息解析失败', err)
      }
    })
  }

  handleMessage(data) {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    
    if (data.type === 'stats_update') {
      currentPage.setData({
        onlineUsers: data.onlineUsers,
        totalUsers: data.totalUsers
      })
    }
  }

  startHeartBeat() {
    this.heartBeatTimer = setInterval(() => {
      this.send({ type: 'heartbeat' })
    }, 30000)
  }

  reconnect() {
    if (this.reconnectTimer) return
    
    this.reconnectTimer = setTimeout(() => {
      this.connect()
      this.reconnectTimer = null
    }, 3000)
  }

  send(data) {
    if (this.status !== 'connected') return
    
    this.socket.send({
      data: JSON.stringify(data),
      fail: () => this.reconnect()
    })
  }

  close() {
    if (this.heartBeatTimer) {
      clearInterval(this.heartBeatTimer)
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.socket && this.socket.close()
  }
}

module.exports = new WebSocketClient() 