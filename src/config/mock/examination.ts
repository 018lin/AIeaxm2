import type { ExamQuestion } from '@/types/examination'

export const questionsMock: ExamQuestion[] = [
  {
    id: 1,
    type: '填空题',
    difficulty: '基础',
    content: '2. 在下面的口里，填哪几个数字商是一位数？填哪几个数字商是两位数？',
  },
  {
    id: 2,
    type: '填空题',
    difficulty: '基础',
    content: '今年乐乐 8 岁，爸爸 38 岁，那么 ______ 年前，爸爸的年龄是乐乐年龄的 6 倍。',
  },
  {
    id: 3,
    type: '计算题',
    difficulty: '基础',
    content: '3. 直接写出得数。',
  },
  {
    id: 4,
    type: '填空题',
    difficulty: '提升',
    content: '一个长方形的长是 12 厘米，宽是 8 厘米，如果长增加 3 厘米，宽不变，面积增加 ______ 平方厘米。',
  },
  {
    id: 5,
    type: '选择题',
    difficulty: '基础',
    content: '下列图形中，不是轴对称图形的是（ ）。',
  },
  {
    id: 6,
    type: '计算题',
    difficulty: '提升',
    content: '简便计算：125 × 32 × 25',
  },
  {
    id: 7,
    type: '解答题',
    difficulty: '素养',
    content: '学校买来 5 盒羽毛球，每盒 12 个，共用去 240 元，平均每个羽毛球多少元？',
  },
  {
    id: 8,
    type: '填空题',
    difficulty: '基础',
    content: '3.5 吨 = ______ 千克，40 分 = ______ 时。',
  },
  {
    id: 9,
    type: '选择题',
    difficulty: '提升',
    content: '一个三角形的三个内角分别是 45°、45°、90°，这个三角形是（ ）。',
  },
  {
    id: 10,
    type: '解答题',
    difficulty: '基础',
    content: '修一条路，第一天修了全长的 20%，第二天修了全长的 30%，两天共修了 500 米，这条路全长多少米？',
  },
]
