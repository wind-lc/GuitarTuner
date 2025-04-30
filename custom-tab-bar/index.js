Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/tuner/index",
        text: "调音器",
        icon: 'tuner'
      },
      {
        pagePath: "/pages/metronome/index",
        text: "节拍器",
        icon: 'metronome'
      }
    ]
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      this.setData({
        selected: data.index
      })
      wx.switchTab({url})
    }
  }
})