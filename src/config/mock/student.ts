export interface StudentMockRow {
  key: string
  id: string
  name: string
  identity: 'student' | 'monitor' | 'committee'
  grade: string
  clazz: string
}

const firstNames = [
  '子轩',
  '梓涵',
  '一诺',
  '浩宇',
  '欣怡',
  '语桐',
  '雨泽',
  '子涵',
  '宇轩',
  '依诺',
  '诗涵',
  '浩然',
  '铭泽',
  '子墨',
  '梓萱',
  '欣妍',
  '雨桐',
  '佳怡',
  '子恒',
  '浩轩',
]
const lastNames = [
  '李',
  '王',
  '张',
  '刘',
  '陈',
  '杨',
  '赵',
  '黄',
  '周',
  '吴',
  '徐',
  '孙',
  '胡',
  '朱',
  '高',
  '林',
  '何',
  '郭',
  '马',
  '罗',
]

const generateStudents = (grade: string, clazz: string, count: number, startId: number): StudentMockRow[] => {
  return Array.from({ length: count }).map((_, i) => {
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)]
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)]
    let identity: 'student' | 'monitor' | 'committee' = 'student'
    if (i === 0) identity = 'monitor'
    else if (i === 1) identity = 'committee'

    return {
      key: `${grade}-${clazz}-${i}`,
      id: String(startId + i),
      name: `${ln}${fn}`,
      identity,
      grade,
      clazz,
    }
  })
}

export const mockStudentsMap: Record<string, StudentMockRow[]> = {
  'LX1-1班': generateStudents('1年级', 'LX1-1班', 18, 20250101),
  'LX1-2班': generateStudents('1年级', 'LX1-2班', 16, 20250120),
  'LX2-1班': generateStudents('2年级', 'LX2-1班', 20, 20240101),
  'LX2-3班': generateStudents('2年级', 'LX2-3班', 15, 20240130),
  'LX3-1班': generateStudents('3年级', 'LX3-1班', 22, 20230101),
  'LX3-5班': generateStudents('3年级', 'LX3-5班', 19, 20230140),
  'LX4-3班': generateStudents('4年级', 'LX4-3班', 25, 20220301),
  'LX4-9班': generateStudents('4年级', 'LX4-9班', 18, 20220901),
}

export const mockClassesByGrade: Record<string, string[]> = {
  '1年级': ['LX1-1班', 'LX1-2班'],
  '2年级': ['LX2-1班', 'LX2-3班'],
  '3年级': ['LX3-1班', 'LX3-5班'],
  '4年级': ['LX4-3班', 'LX4-9班'],
}
