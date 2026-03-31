/**
 * 将时间戳格式化为字符串：YYYY-MM-DD hh:mm:ss
 * @param timestamp 时间戳（毫秒）
 * @returns 格式化后的时间字符串，若时间戳非法则返回空字符串
 */
export const formatTimestamp = (timestamp: number | string, type: string): string => {
  const date = new Date(timestamp)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const pad = (value: number): string => value.toString().padStart(2, '0')

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  const seconds = pad(date.getSeconds())
  let dateString: string = ''
  if (type === 'YYYY-MM-DD hh:mm:ss') {
    dateString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } else if (type === 'YYYY-MM-DD') {
    dateString = `${year}-${month}-${day}`
  }
  return dateString
}
