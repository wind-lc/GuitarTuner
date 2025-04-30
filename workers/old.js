const FFT = require('./fft')

worker.onMessage(function (e) {
  let { pcmData, sampleRate } = e
  pcmData = new Int16Array(pcmData)
  const SIZE = pcmData.length
  let fftSize = 1

  // 找到大于等于 pcmData 长度的 2 的幂
  while (fftSize < SIZE) {
    fftSize *= 2
  }

  // 确保 fftSize 大于 1 且是 2 的幂
  if (fftSize <= 1) {
    fftSize = 2  // 保证 fftSize 至少为 2
  }

  const input = new Float32Array(fftSize)
  for (let i = 0; i < SIZE; i++) {
    input[i] = pcmData[i] / 32768 // 假设PCM数据是16位
  }

  // 执行FFT变换
  const fft = new FFT(fftSize)
  const out = fft.createComplexArray()
  fft.realTransform(out, input)
  fft.completeSpectrum(out)

  // 获取频谱的幅度（振幅值）
  const magnitudes = new Array(input.length / 2)
  for (let i = 0; i < input.length / 2; i++) {
    magnitudes[i] = Math.sqrt(out[2 * i] * out[2 * i] + out[2 * i + 1] * out[2 * i + 1]) // 计算幅值
  }

  // 查找最大幅值的位置
  let maxMagnitude = -1
  let maxIndex = -1
  for (let i = 0; i < magnitudes.length; i++) {
    if (magnitudes[i] > maxMagnitude) {
      maxMagnitude = magnitudes[i]
      maxIndex = i
    }
  }

  // 计算频率
  const frequency = maxIndex * sampleRate / SIZE
  worker.postMessage({ frequency })
})
