# 用户统计微信小程序

## 项目结构调整
1. 创建标准云开发项目结构：
```bash
# 在项目根目录执行
mkdir -p miniprogram
mv app.js miniprogram/
mv app.json miniprogram/
mv app.wxss miniprogram/
mv pages miniprogram/
mv utils miniprogram/
mv images miniprogram/
```

2. 最终项目结构：
```
项目根目录/
├── cloudfunctions/          # 云函数目录
│   ├── getIP/              # 获取IP云函数
│   │   ├── index.js
│   │   └── package.json
│   ├── login/              # 登录云函数
│   │   ├── index.js
│   │   └── package.json
│   └── updateUserStatus/    # 更新用户状态云函数
│       ├── index.js
│       └── package.json
└── miniprogram/            # 小程序目录
    ├── app.js              # 小程序入口文件
    ├── app.json            # 小程序配置文件
    ├── app.wxss            # 全局样式文件
    ├── components/         # 组件文件夹
    │   ├── game-modal/    # 游戏弹窗组件
    │   │   ├── index.js
    │   │   ├── index.json
    │   │   ├── index.wxml
    │   │   └── index.wxss
    │   └── win-notice/    # 中奖通知组件
    │       ├── index.js
    │       ├── index.json
    │       ├── index.wxml
    │       └── index.wxss
    ├── pages/              # 页面文件夹
    │   ├── index/         # 首页
    │   ├── stats/         # 统计页面
    │   └── profile/       # 个人中心
    ├── utils/             # 工具类文件夹
    └── images/            # 图片资源文件夹
```

## 云开发配置
1. 云环境ID: yishansi-1gi3lcns459b37e9
2. 数据库集合:
   - users: 用户信息表
   - statistics: 统计数据表

## 云函数说明
1. getIP: 获取用户IP地址
2. login: 处理用户登录
3. updateUserStatus: 更新用户在线状态
4. updateStats: 更新统计数据
   - 统计总用户数
   - 统计在线用户数
   - 更新statistics集合

## 云函数依赖安装记录
```bash
# updateStats云函数
cd cloudfunctions/updateStats
npm init -y
npm install --save wx-server-sdk
```

## 云函数参数说明

### 1. login 云函数
```javascript
// 调用参数
{
  userInfo: {              // 必填，来自 wx.getUserProfile
    nickName: string,      // 必填，用户昵称
    avatarUrl: string,     // 必填，用户头像
    gender: number,        // 可选，性别
    country: string,       // 可选，国家
    province: string,      // 可选，省份
    city: string          // 可选，城市
  },
  deviceInfo: {            // 必填，来自 wx.getSystemInfoSync
    brand: string,        // 必填，设备品牌
    model: string,        // 必填，设备型号
    system: string        // 必填，操作系统
  },
  clientIP: string        // 可选，会被云函数自动获取
}
```

### 2. updateUserStatus 云函数
```javascript
// 调用参数
{
  isOnline: boolean       // 必填，用户在线状态
}
```

### 3. getIP 云函数
```javascript
// 无需传参，云函数会自动获取 clientIP
// 返回格式
{
  code: 0,
  ip: string             // 客户端IP地址
}
```

### 调用示例
```javascript
// 登录示例
const { userInfo } = await wx.getUserProfile({
  desc: '用于完善会员资料'
})

const systemInfo = wx.getSystemInfoSync()
const deviceInfo = {
  brand: systemInfo.brand,
  model: systemInfo.model,
  system: systemInfo.system
}

const { result } = await wx.cloud.callFunction({
  name: 'login',
  data: {
    userInfo,
    deviceInfo
  }
})

// 更新在线状态示例
await wx.cloud.callFunction({
  name: 'updateUserStatus',
  data: {
    isOnline: true
  }
})

// 退出登录示例
async function handleLogout() {
  try {
    // 1. 更新用户在线状态
    await wx.cloud.callFunction({
      name: 'updateUserStatus',
      data: {
        isOnline: false
      }
    })

    // 2. 清除本地存储的用户信息
    wx.removeStorageSync('userInfo')

    // 3. 更新页面状态
    this.setData({
      userInfo: null,
      hasUserInfo: false
    })
  } catch (err) {
    console.error('退出失败', err)
  }
}
```

# 云函数部署说明

## 常见问题解决
如果右键菜单没有"云端安装依赖"选项，请按以下步骤操作：

1. 确认开发者工具版本
   - 使用最新版本的微信开发者工具
   - 当前建议版本：1.06.2301170 或更高

2. 检查项目配置
   - 确保项目根目录有 project.config.json 文件
   - 确保已经开启云开发功能
   - 检查是否已正确配置云环境ID

3. 手动部署云函数方法：
   a. 在终端(Terminal)中进入云函数目录：
      ```bash
      cd cloudfunctions/getIP
      ```
   
   b. 安装依赖：
      ```bash
      npm install --save wx-server-sdk
      ```
   
   c. 使用开发者工具的"上传"功能
      - 右键点击云函数文件夹
      - 选择"上传并部署"（不带"云端安装依赖"的选项）

4. 检查云函数目录结构
   确保云函数目录结构正确：
   ```
   getIP/
   ├── index.js
   ├── package.json
   └── node_modules/
   ```

5. 如果没有package.json，需手动创建：
   ```json
   {
     "name": "getIP",
     "version": "1.0.0",
     "description": "",
     "main": "index.js",
     "dependencies": {
       "wx-server-sdk": "latest"
     }
   }
   ```

## 部署步骤

1. 创建云函数：
   - 在cloudfunctions目录右键
   - 选择"新建Node.js云函数"
   - 输入云函数名称（如：getIP）

2. 安装依赖：
   - 打开终端(Terminal)
   - cd到云函数目录
   - 执行npm install

3. 上传云函数：
   - 在云函数目录右键
   - 选择"上传并部署"

4. 验证部署：
   - 打开云开发控制台
   - 检查云函数列表
   - 查看云函数是否部署成功

## 注意事项

1. 确保开发环境：
   - Node.js已安装（建议v12或更高版本）
   - npm可正常使用
   - 微信开发者工具已更新到最新版本

2. 常见错误处理：
   - 如遇到权限问题，检查云开发权限设置
   - 如遇到依赖安装失败，可尝试使用cnpm或手动安装

3. 调试方法：
   - 使用云开发控制台的云函数调试功能
   - 查看云函数运行日志
   - 使用console.log进行调试输出

4. 建议：
   - 每次修改云函数后都重新上传
   - 保持本地依赖包版本与云端一致
   - 定期清理云函数日志

## 数据库集合创建步骤

### 1. 打开云开发控制台
- 点击微信开发者工具顶部工具栏的"云开发"按钮
- 进入云开发控制台

### 2. 创建 users 集合
1. 点击左侧菜单"数据库"
2. 点击"集合名称"旁边的"+"号按钮
3. 输入集合名称：users
4. 权限设置：
   - 点击"权限设置"
   - 选择"仅创建者可读写"
   - 点击"确定"
5. 说明：
   - 无需手动添加记录
   - 用户首次登录时会自动创建记录
   - 通过login云函数自动维护用户数据

### 3. 创建 statistics 集合
1. 同样点击"+"号创建新集合
2. 输入集合名称：statistics
3. 权限设置：
   - 点击"权限设置"
   - 选择"所有用户可读，仅创建者可写"
   - 点击"确定"
4. 说明：
   - 需要手动添加初始记录
   - 后续数据由云函数自动更新

### 4. 初始化 statistics 集合数据
```javascript
{
  "_id": "total",
  "onlineUsers": 0,
  "totalUsers": 0,
  "players": 0,
  "prize_money": 0,
  "broken_money": 100,
  "is_breaking": false,
  "updateTime": new Date()
}
```
5. 点击"确定"保存

### 5. users 集合字段说明
```json
{
  "_id": "系统自动生成",
  "openid": "string",          // 微信用户唯一标识
  "nickName": "string",        // 用户微信昵称
  "avatarUrl": "string",       // 微信头像URL
  "gender": 0,                 // 性别：0未知，1男性，2女性
  "country": "string",         // 用户所在国家
  "province": "string",        // 用户所在省份
  "city": "string",           // 用户所在城市
  "lastLoginTime": Date,      // 用户最后一次登录时间
  "lastLoginIP": "string",    // 用户最后一次登录的IP地址
  "deviceInfo": {             // 用户设备信息
    "brand": "string",        // 设备品牌，如：iPhone、Huawei
    "model": "string",        // 具体型号，如：iPhone X、Mate 30
    "system": "string"        // 系统版本，如：iOS 14.0、Android 10
  },
  "isOnline": boolean,        // 用户在线状态：true在线，false离线
  "createTime": Date,         // 用户首次登录时间，即注册时间
  "balance": number,          // 用户钱包余额
  "pay": number,             // 本轮游戏已支付金额
  "last_pay": Date           // 上次支付时间
}
```

字段详细说明：
1. openid：
   - 类型：字符串
   - 说明：微信用户的唯一标识
   - 来源：通过云函数获取

2. 用户基本信息：
   - nickName：用户微信昵称
   - avatarUrl：微信头像地址
   - gender：性别代码（0,1,2）
   - country/province/city：地理位置信息

3. 登录相关信息：
   - lastLoginTime：记录每次登录时间
   - lastLoginIP：记录登录IP，用于统计
   - deviceInfo：记录用户设备信息，用于分析

4. 状态标记：
   - isOnline：实时记录用户在线状态
   - createTime：用于统计新增用户

### 6. statistics 集合字段说明
```json
{
  "_id": "total",
  "onlineUsers": number,     // 在线用户数
  "totalUsers": number,      // 总用户数
  "players": number,         // 参与游戏的用户数
  "prize_money": number,     // 奖池总金额
  "broken_money": number,    // 开奖金额
  "is_breaking": boolean,    // 是否正在开奖
  "updateTime": Date         // 更新时间
}
```

### 7. 验证步骤
1. 检查集合是否创建成功
2. 确认权限设置是否正确
3. 验证 statistics 集合初始数据是否正确
4. 尝试添加一条测试数据验证权限

### 退出登录流程
1. 用户点击退出按钮
2. 调用updateUserStatus云函数，更新用户在线状态为false
3. 清除本地存储的用户信息
4. 重置页面显示状态
5. 更新在线用户统计数据

### 8. 创建 lottery_results 集合
1. 点击"+"号创建新集合
2. 输入集合名称：lottery_results
3. 权限设置：
   - 点击"权限设置"
   - 选择"所有用户可读，仅创建者可写"
   - 点击"确定"
4. 字段说明：
```json
{
  "_id": "系统自动生成",
  "nickName": "string",     // 中奖用户昵称
  "avatarUrl": "string",    // 中奖用户头像
  "amount": number,         // 中奖金额
  "createTime": Date        // 开奖时间
}
```

## 更新记录

### 2024-01-18
1. 优化首页数据更新逻辑
   - 移除initData函数，统一使用updateStats
   - 添加加载状态提示
   - 优化错误处理

2. 数据更新流程优化
   - 页面加载时立即更新一次数据
   - 监听数据变化自动更新
   - 页面显示时更新数据
   - 统一使用云函数返回的数据