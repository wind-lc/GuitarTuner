// pages/tuner/components/PitchDashboard/index.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    // 弦
    string: {
      type: Object,
      value: {}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 画布高度
    height: 0,
    // 画布对象
    cas: null,
    // 画布2d
    ctx: null,
    // 画布属性
    attr: {
      // 起始角度弧度值
      startAngle: 0,
      // 结束角度弧度值
      endAngle: 0,
      // 圆心坐标X
      centerX: 0,
      // 圆心坐标Y
      centerY: 0,
      // 半径
      radius: 0
    },
    // 当前指针数值
    currentValue: 0,
    // 当前指针起、终点坐标
    currentPointe: {
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0
    },
    // 目标指针数值
    targetValue: 0,
    // 动画执行中
    isAnimating: false,
    // 仪表盘音高范围
    pitchRange: [],
    // 实际频率
    frequency: 0
  },

  observers: {
    'string': function(v){
      this.updateDashboard()
    }
  },

  lifetimes: {
    ready: function() {
      this.init()
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * @description: 初始化
     * @param {void}
     * @return {void}
     */
    init(){
      // 获取配置
      // 获取屏幕宽度，计算画布大小
      const { screenWidth: w, pixelRatio: dpr } = wx.getWindowInfo()
      const h = w * 0.5
      this.setData({
        height: h
      })
      // 画布初始处理
      this.createSelectorQuery()
        .select('#canvas')
        .fields({
          node: true,
          size: true
        })
        .exec(([res]) => {
          const cas = res.node
          const ctx = cas.getContext('2d')
          // 增加分辨率，防止模糊
          // 乘以设备像素比
          cas.width = w * dpr
          // 乘以设备像素比
          cas.height = h * dpr
          // 让绘制内容按原大小显示
          ctx.scale(dpr, dpr)
          // 圆心坐标X
          const centerX = w * 0.5
          // 圆心坐标Y
          const centerY = h * 2.5
          // 半径差值
          const rNum = 50
          // 圆弧半径
          const radius = centerY - rNum
          // 起始角度弧度值
          const startAngle = Math.PI * 1.38
          // 结束角度弧度值
          const endAngle  = Math.PI * 1.62
          this.setData({
            cas,
            ctx,
            attr: {
              startAngle,
              endAngle,
              centerX,
              centerY,
              radius
            }
          })
          this.updateDashboard()
          this.animatePointer()
        })
      
    },
    /**
     * @description: 更新仪表
     * @param {void}
     * @return {void}
     */
    updateDashboard() {
      // 设置音高范围
      this.setData({
        pitchRange: [
          this.data.string.frequency - 10,
          this.data.string.frequency - 5,
          this.data.string.frequency,
          this.data.string.frequency + 5,
          this.data.string.frequency + 10
        ]
      })
      const { ctx, attr: { startAngle, endAngle, centerX, centerY, radius }, pitchRange } = this.data
      if (!ctx) return
      // 清除画布
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      // 绘制圆弧
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, startAngle - Math.PI * 0.01, endAngle + Math.PI * 0.01, false)
      ctx.lineWidth = 5
      ctx.strokeStyle = '#D9D9D9'
      ctx.stroke()
      // 圆弧的角度范围弧度值
      const angleRange = endAngle - startAngle
      // 刻度高度
      const tickHeight = 8
      // 刻度宽度
      const tickWidth = 2
      ctx.lineWidth = tickWidth
      const drawTick = (angle, tickH = tickHeight) => {
        // 起点坐标（向外延伸刻度高度）
        const startX = centerX + (radius + tickH) * Math.cos(angle)
        const startY = centerY + (radius + tickH) * Math.sin(angle)
        // 终点坐标（圆弧上的点）
        const endX = centerX + radius * Math.cos(angle)
        const endY = centerY + radius * Math.sin(angle)
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
      }
      // 绘制五个刻度
      drawTick(startAngle, tickHeight * 1.5) // 最左刻度
      drawTick(startAngle + angleRange / 4) // 左二分之一刻度
      drawTick(startAngle + angleRange / 2, tickHeight * 1.5) // 中间刻度
      drawTick(startAngle + (angleRange / 4) * 3) // 右二分之一刻度
      drawTick(endAngle, tickHeight * 1.5) // 最右刻度
      // 计算每个刻度标签对应的角度
      const angles = pitchRange.map((_, index) => startAngle + (angleRange / (pitchRange.length - 1)) * index)
      // 清除标签区域（增加 padding 避免清除不干净）
      // 适当增加清除范围，避免误删刻度线
      // 设置文本样式
      ctx.font = '14px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#D9D9D9'
      // 绘制五个刻度标签
      angles.forEach((angle, index) => {
        const x = centerX + (radius + 20) * Math.cos(angle)
        const y = centerY + (radius + 20) * Math.sin(angle)
        // 旋转文本，使其与刻度方向一致
        // 保存当前上下文
        ctx.save()
        ctx.translate(x, y)
        // 旋转角度，使文本沿着刻度方向
        ctx.rotate(angle + Math.PI / 2)
        // 在旋转后的坐标系中绘制文本
        ctx.fillText(pitchRange[index], 0, 0)
        ctx.restore()
      })
    },
    /**
     * @description: 更新指针位置
     * @param {number} value 当前刻度数值
     * @return {void}
     */
    updatePointer(value) {
      const { ctx, attr: { startAngle, endAngle, centerX, centerY, radius }, frequency } = this.data
      if (!ctx || this.data.pitchRange.length === 0) return
      // 五个刻度值
      const minValue = this.data.pitchRange[0]
      const maxValue = this.data.pitchRange[this.data.pitchRange.length - 1]
      value = Math.max(minValue, Math.min(value, maxValue))
      // 限制 value 在范围内
      if (value < minValue) value = minValue
      if (value > maxValue) value = maxValue
      // 计算数值占比
      const ratio = (value - minValue) / (maxValue - minValue)
      // 计算指针角度
      const pointerAngle = startAngle + ratio * (endAngle - startAngle)
      // 指针和圆弧间隙
      const pointerGap = 10
      // 指针长度
      const pointerLength = 30
      // 指针宽度
      const pointerWidth = 2
      // 计算指针起点（圆弧上的点）
      const pointerStartX = centerX + (radius - pointerGap) * Math.cos(pointerAngle)
      const pointerStartY = centerY + (radius - pointerGap) * Math.sin(pointerAngle)
      // 计算指针终点（向内移动）
      const pointerEndX = centerX + (radius - pointerGap - pointerLength) * Math.cos(pointerAngle)
      const pointerEndY = centerY + (radius - pointerGap - pointerLength) * Math.sin(pointerAngle)
      // 清除画布（避免指针残影）
      const { startX, startY, endX, endY } = this.data.currentPointe
      // 计算指针中心点
      const pointerCenterX = (startX + endX) / 2
      const pointerCenterY = (startY + endY) / 2
      // 计算指针方向向量
      const deltaX = endX - startX
      const deltaY = endY - startY
      const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      // 计算指针的法线方向（垂直于指针）
      const normalX = deltaY / length
      const normalY = -deltaX / length
      // 计算清除区域大小
      const clearPaddingX = Math.abs(normalX) * (pointerWidth / 2 + 2) + Math.abs(deltaX / length) * (pointerLength / 2 + 2)
      const clearPaddingY = Math.abs(normalY) * (pointerWidth / 2 + 2) + Math.abs(deltaY / length) * (pointerLength / 2 + 2)
      // 计算清除区域范围
      const clearX = pointerCenterX - clearPaddingX
      const clearY = pointerCenterY - clearPaddingY
      const clearWidth = clearPaddingX * 2
      const clearHeight = clearPaddingY * 2
      // 清除指针区域
      ctx.clearRect(clearX, clearY, clearWidth, clearHeight)
      // 重新绘制指针
      ctx.lineWidth = pointerWidth
      ctx.strokeStyle = '#C3A582'
      ctx.beginPath()
      ctx.moveTo(pointerStartX, pointerStartY)
      ctx.lineTo(pointerEndX, pointerEndY)
      ctx.stroke()
      // 清除当前音高数值
      // 设定一个合适的清除范围
      const clearTextX = 200
      const clearTextY = 60
      ctx.clearRect(centerX - clearTextX * 0.5, 150 - 3 - clearTextY * 0.5, clearTextX, clearTextY)
      // ctx.strokeStyle = 'red'
      // ctx.strokeRect(centerX - clearTextX * 0.5, 150 - 3 - clearTextY * 0.5, clearTextX, clearTextY)
      // 绘制当前音高数值
      // 设置文本样式
      ctx.font = '36px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#D9D9D9'
      ctx.fillText(this.data.string.musicalAlphabet, centerX, 140)
      ctx.font = '14px Arial'
      ctx.fillText(frequency + 'Hz', centerX, 165)
      // 保存当前指针位置
      this.setData({
        currentPointe: {
          startX: pointerStartX,
          startY: pointerStartY,
          endX: pointerEndX,
          endY: pointerEndY
        }
      })
    },
    /**
     * @description: 指针平滑动画
     * @param {void}
     * @return {void}
     */
    animatePointer() {
      // 如果已经在执行动画，则不重复启动
      if (this.data.isAnimating) return
      // 标记动画进行中
      this.setData({ isAnimating: true })
      const { cas } = this.data
      const step = (timestamp) => {
        const { currentValue, targetValue } = this.data
        // 逐步逼近目标值（可以调整步长）
        const newValue = Number((currentValue + (targetValue - currentValue) * 0.08).toFixed(2))
        // 如果新值和目标值足够接近如误差小于 0.1，直接设为目标值，并停止动画
        if (Math.abs(newValue - targetValue) < 0.1) {
          this.setData({
            currentValue: targetValue,
            // 解除动画锁
            isAnimating: false 
          })
          this.updatePointer(targetValue)
          // 终止动画
          return 
        }
        // 更新数值，并继续动画
        this.setData({ currentValue: newValue })
        this.updatePointer(newValue)
        cas.requestAnimationFrame(step)
      }
      cas.requestAnimationFrame(step)
    },
    /**
     * @description: 更新数据
     * @param {number} val 频率
     * @return {void}
     */
    update(val) {
      this.setData({
        targetValue: val,
        frequency: val
      })
      // 目标值更新后，确保动画启动（如果动画已经在运行，则动画会自然跟上）
      this.animatePointer()
    }
  }
})