const instrument = require('./instrument')
/**
 * 获取指定乐器的音高数据
 * @param {string} instrumentName 乐器名称，例如 "guitar"
 * @returns {Array} 该乐器的音高数据
 */
const getInstrumentTuning = (instrumentName) => {
  return instrument[instrumentName]?.strings || []
}
export {
  getInstrumentTuning,
}