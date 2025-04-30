import { getInstrumentTuning } from '../../utils/index'

Page({
  data: {
    // 当前乐器配置
    instrumentTuning: getInstrumentTuning('guitar'),
    // 当前调试的弦
    string: {},
    // 左侧弦
    leftString: [],
    // 右侧弦
    rightString: [],
    // 自动/手动调弦
    auto: false,
    // 当前频率
    frequency: 0,
    // Web Worker 实例
    worker: null,
    // 记录管理器
    recorderManager: null,
    // 录音状态
    isRecording: false,
    // 仪表组件
    pitchDashboard: null
  },
  onShow() {
    console.log('显示')
    this.getTabBar().setData({
      selected: 0
    })
    if(!this.auto){
      // 手动调弦时默认第六弦开始
      this.setData({
        string: this.data.instrumentTuning[0],
        leftString: this.data.instrumentTuning.slice(0, 3),
        rightString: this.data.instrumentTuning.slice(3, this.data.instrumentTuning.length),
        pitchDashboard: this.selectComponent('.pitch-dashboard')
      })
    }
    this.initRecordPermission()
  },
  onHide() {
    console.log('隐藏')
    this.stopRecord()
  },
  onUnload(){
    console.log('卸载')
    this.stopRecord()
  },
  /**
   * @description: 初始化获取麦克风权限
   * @param {void}
   * @return {void}
   */
  initRecordPermission() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.record']) {
          // 已授权，直接开始录音
          this.startRecord()
        } else {
          // 未授权，主动申请
          wx.authorize({
            scope: 'scope.record',
            success: () => {
              this.startRecord()
            },
            fail: () => {
              wx.showModal({
                title: '提示',
                content: '请允许使用麦克风进行调音',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting()
                  }
                }
              })
            }
          })
        }
      }
    })
  },
  /**
   * @description: 记录麦克风声音并更新频率
   * @param {void}
   * @return {void}
   */
  startRecord() {
    console.log('开始')
    if (this.data.isRecording) return
    const recorderManager = wx.getRecorderManager()
    // 初始化 Web Worker
    const worker = wx.createWorker('workers/fftWorker.js')
    worker.onMessage((e) => {
      const frequency = Number((e.frequency || 0).toFixed(2))
      this.data.pitchDashboard.update(frequency)
      this.setData({
        frequency
      })
    })
    recorderManager.onFrameRecorded((res) => {
      if(this.data.isRecording){
        console.log('正在录音...')
        const pcmBuffer = res.frameBuffer
        // 发送音频数据到 Web Worker 进行处理
        worker.postMessage({
          pcmData: pcmBuffer,
          sampleRate: 48000
        })
      }
    })
    recorderManager.onStop((e) => {
      console.log('录音停止自动启动')
      this.stopRecord()
      setTimeout(() => {
        this.startRecord()
      }, 100)
    })
    recorderManager.onPause((e) => {
      console.log('暂停:', e)
    })
    recorderManager.onError((err) => {
      console.log('录音异常:', err)
    })
    recorderManager.start({
      format: 'pcm',          // 原始PCM格式（无需编码，但encodeBitRate仍需合法值）
      sampleRate: 48000,      // 采样率（Hz）
      numberOfChannels: 1,    // 单声道
      frameSize: 64,          // 每帧大小（平衡延迟和性能）
      encodeBitRate: 192000,  // 编码比特率（必须64k-320k之间）
      duration: 60000         // 分段录音时长（毫秒）
    })
    this.setData({
      isRecording: true,
      recorderManager,
      worker
    })
  },
  /**
   * @description: 终止调音
   * @param {void}
   * @return {void}
   */
  stopRecord() {
    if (!this.data.isRecording) return
    console.log('终止')
    this.data.recorderManager.stop()
    this.data.worker.terminate()
    this.setData({
      recorderManager: null,
      worker: null,
      isRecording: false
    })
  }
})