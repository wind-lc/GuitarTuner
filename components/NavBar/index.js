Component({
    properties: {
      title: {
        type: String,
        value: '标题' // 默认标题
      }
    },
    data: {
      statusBarHeight: 0, // 状态栏高度
      navBarHeight: 0, // 导航栏高度
      capsuleHeight: 0 // 胶囊按钮高度
    },
    lifetimes: {
      attached() {
        this.getNavBarInfo()
      }
    },
  
    methods: {
      getNavBarInfo() {
        // 获取窗口信息
        const windowInfo = wx.getWindowInfo()
        const menuButtonInfo = wx.getMenuButtonBoundingClientRect() // 获取胶囊按钮信息
  
        const statusBarHeight = windowInfo.statusBarHeight // 状态栏高度
        const navBarHeight = (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height // 计算导航栏高度
  
        this.setData({
          statusBarHeight,
          navBarHeight,
          capsuleHeight: menuButtonInfo.height
        })
      }
    }
  })