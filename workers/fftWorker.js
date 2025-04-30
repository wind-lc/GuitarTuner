const FFT = require('./fft')

worker.onMessage(function (e) {
  let { pcmData, sampleRate } = e;
  pcmData = new Int16Array(pcmData);
  
  // 1. 确定FFT大小（2的幂次，且>=1024）
  let fftSize = 1024;
  while (fftSize < pcmData.length && fftSize < 16384) {
    fftSize *= 2;
  }

  // 2. 准备数据并加汉宁窗（减少频谱泄露）
  const input = new Float32Array(fftSize);
  for (let i = 0; i < Math.min(pcmData.length, fftSize); i++) {
    const window = 0.5 * (1 - Math.cos(2 * Math.PI * i / (fftSize - 1)))
    input[i] = (pcmData[i] / 32768) * window; // 16位PCM归一化并加窗
  }

  // 3. 执行FFT
  const fft = new FFT(fftSize);
  const out = fft.createComplexArray();
  fft.realTransform(out, input);
  fft.completeSpectrum(out);

  // 4. 计算幅度谱（仅取前一半）
  const magnitudes = new Array(fftSize / 2);
  for (let i = 0; i < fftSize / 2; i++) {
    magnitudes[i] = Math.sqrt(out[2 * i] ** 2 + out[2 * i + 1] ** 2);
  }

  // 5. 在有效范围内找峰值（例如：吉他频率82Hz-1.2kHz）
  const minBin = Math.floor(80 * fftSize / sampleRate); // 最低频率对应的bin
  const maxBin = Math.floor(1200 * fftSize / sampleRate); // 最高频率对应的bin
  
  let maxMag = 0;
  let peakBin = 0;
  for (let i = minBin; i <= maxBin; i++) {
    if (magnitudes[i] > maxMag) {
      maxMag = magnitudes[i];
      peakBin = i;
    }
  }

  // 6. 抛物线插值提高精度
  let refinedBin = peakBin;
  if (peakBin > minBin && peakBin < maxBin) {
    const alpha = magnitudes[peakBin - 1];
    const beta = magnitudes[peakBin];
    const gamma = magnitudes[peakBin + 1];
    refinedBin = peakBin + 0.5 * (alpha - gamma) / (alpha - 2 * beta + gamma);
  }

  // 7. 计算最终频率
  const frequency = refinedBin * sampleRate / fftSize;
  worker.postMessage({ frequency });
});