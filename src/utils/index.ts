// 固定颜色组
const colorPairs = [
  { bg: '#e8f5e9', text: '#4caf50' }, // 绿色
  { bg: '#fff3e0', text: '#e67e22' }, // 橙色
  { bg: '#fde8e8', text: '#f15959' }, // 红色
  { bg: '#e3f2fd', text: '#2196f3' }, // 蓝色
  { bg: '#f3e5f5', text: '#9c27b0' }, // 紫色
  { bg: '#e6fffb', text: '#08979c' }, // 青色
  { bg: '#fff0f6', text: '#eb2f96' }, // 粉色
  { bg: '#e8eaf6', text: '#5e35b1' }, // 靛蓝
  { bg: '#f1f8e9', text: '#7cb342' }, // 石灰
  { bg: '#fff8e1', text: '#ffa000' }, // 琥珀
  { bg: '#e0f2f1', text: '#00897b' }, // 深青
  { bg: '#fce4ec', text: '#c2185b' }, // 玫瑰
  { bg: '#ede7f6', text: '#673ab7' }, // 紫罗兰
  { bg: '#e1f5fe', text: '#0288d1' }, // 天蓝
  { bg: '#e0f7fa', text: '#00acc1' }, // 薄荷
]

/**
 * 根据字符串生成固定的颜色
 * 不同科目的题型会根据题型名称自动分配不同颜色
 * 相同的题型名称总是得到相同的颜色
 * @param i 题型索引
 * @returns 包含背景色和文字色的CSS样式对象
 */
export const getColorFromString = (i: number) => {
  // 如果索引无效，返回默认颜色
  if (i === undefined || i === null || i < 0) {
    return {
      backgroundColor: colorPairs[0]!.bg,
      color: colorPairs[0]!.text,
    }
  }
  // 如果索引超出数组长度，从头开始循环
  const index = i % colorPairs.length
  return {
    backgroundColor: colorPairs[index]!.bg,
    color: colorPairs[index]!.text,
  }
}
