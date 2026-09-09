import { generateKeyPairSync } from 'node:crypto'

const publicKey = generateKeyPairSync('rsa', {
  modulusLength: 1024,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
}).publicKey

const publicKeyBase64 = publicKey
  .replace('-----BEGIN PUBLIC KEY-----', '')
  .replace('-----END PUBLIC KEY-----', '')
  .replace(/\s+/g, '')

const expiresTime = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

const ok = data => ({ code: 0, data, msg: 'success' })

const demoUser = {
  id: 1,
  userId: 'demo-teacher',
  username: 'demo',
  nickname: '演示教师',
  avatar: '',
  email: 'demo@example.com',
}

const teacherInfo = {
  id: 1,
  userId: 1,
  teacherId: 'T-demo-001',
  teacherName: '演示教师',
  phoneNumber: '13800000000',
  schoolId: 1,
  schoolName: '演示学校',
  gradeId: 'grade-7',
  gradeName: '七年级',
  subjectId: 'math',
  subjectName: '数学',
  useDefaultPwd: false,
  classInfoList: [
    { classId: 'class-1', className: '七年级一班' },
    { classId: 'class-2', className: '七年级二班' },
  ],
}

const recentHomework = [
  {
    assignmentId: 'hw-001',
    assignmentName: '有理数单元练习',
    firstSubmitTime: '2026-09-08 09:30:00',
    gradeId: 'grade-7',
    gradeName: '七年级',
    subjectId: 'math',
    subjectName: '数学',
    groupProgressList: [
      {
        classId: 'class-1',
        className: '七年级一班',
        type: 'class',
        submittedCount: 42,
        totalCount: 45,
        gradedCount: 8,
        needGradingCount: 10,
      },
      {
        classId: 'class-2',
        className: '七年级二班',
        type: 'class',
        submittedCount: 44,
        totalCount: 44,
        gradedCount: 6,
        needGradingCount: 6,
      },
    ],
  },
  {
    assignmentId: 'hw-002',
    assignmentName: '一次方程巩固作业',
    firstSubmitTime: '2026-09-07 15:20:00',
    gradeId: 'grade-7',
    gradeName: '七年级',
    subjectId: 'math',
    subjectName: '数学',
    groupProgressList: [
      {
        classId: 'class-1',
        className: '七年级一班',
        type: 'class',
        submittedCount: 45,
        totalCount: 45,
        gradedCount: 4,
        needGradingCount: 9,
      },
    ],
  },
]

const recentAssignments = [
  {
    assignmentId: 'paper-001',
    assignmentName: '七年级数学综合卷',
    gradeName: '七年级',
    subjectName: '数学',
    assignmentType: 'book',
    status: 'draft',
    questionNumbers: 18,
  },
  {
    assignmentId: 'paper-002',
    assignmentName: '有理数错题重组卷',
    gradeName: '七年级',
    subjectName: '数学',
    assignmentType: 'wrong',
    status: 'finalized',
    questionNumbers: 12,
  },
]

function normalizePath(url = '') {
  const { pathname } = new URL(url, 'http://mock.local')
  return pathname.replace(/^\/app(?=\/)/, '')
}

function route(path, method) {
  if (path === '/oauth/public-key' && method === 'GET') return ok(publicKeyBase64)

  if (path === '/api/v1/oauth/login' && method === 'POST') {
    return ok({
      userId: demoUser.userId,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      tenantId: '1',
      expiresTime: expiresTime(),
    })
  }

  if (path === '/api/v1/oauth/refresh-token' && method === 'POST') {
    return ok({
      userId: demoUser.userId,
      accessToken: 'mock-access-token-refreshed',
      refreshToken: 'mock-refresh-token',
      tenantId: '1',
      expiresTime: expiresTime(),
    })
  }

  if (path === '/api/v1/oauth/logout' && method === 'POST') return ok(true)

  if (path === '/api/v1/oauth/get-permission-info' && method === 'GET') {
    return ok({
      user: demoUser,
      roles: ['teacher', 'demo'],
      permissions: ['*'],
    })
  }

  if (path === '/api/v1/teacher/teacher-info' && method === 'GET') return ok(teacherInfo)

  if (path === '/api/v1/teacher/overview' && method === 'GET') {
    return ok({
      accuracy: '86',
      classCount: '2',
      studentCount: '89',
      workCount: '16',
    })
  }

  if (path === '/api/v1/student/overview' && method === 'GET') {
    return ok([
      {
        classId: 'class-1',
        className: '七年级一班',
        aboveCount: '18',
        aboveRatio: '40%',
        avgCount: '20',
        avgRatio: '44%',
        belowCount: '7',
        belowRatio: '16%',
        avgRate: '84%',
        aboveList: ['张明', '李华', '王可'],
        avgList: ['陈宇', '刘宁', '赵一'],
        belowList: ['周然', '孙琪'],
        studentList: ['张明', '李华', '王可', '陈宇', '刘宁', '赵一', '周然', '孙琪'],
      },
      {
        classId: 'class-2',
        className: '七年级二班',
        aboveCount: '16',
        aboveRatio: '36%',
        avgCount: '22',
        avgRatio: '50%',
        belowCount: '6',
        belowRatio: '14%',
        avgRate: '82%',
        aboveList: ['许佳', '高远'],
        avgList: ['何雨', '林舟', '钱昊'],
        belowList: ['吴双'],
        studentList: ['许佳', '高远', '何雨', '林舟', '钱昊', '吴双'],
      },
    ])
  }

  if (path === '/api/v1/question/statistics' && method === 'GET') {
    return ok({
      totalQuestionCount: 1280,
      subjectQuestionCount: 420,
      selfQuestionCount: 86,
      newQuestionCount: 34,
      newSubjectQuestionCount: 12,
      newSelfQuestionCount: 5,
    })
  }

  if (path === '/api/v1/student/homework/recent-list' && method === 'GET') return ok(recentHomework)
  if (path === '/api/v1/assignment/recent-list' && method === 'GET') return ok(recentAssignments)
  if (path === '/api/v1/assignment/download' && method === 'POST') return ok('')
  if (path === '/api/v1/assignment/splice' && method === 'POST') return ok(true)

  if (path.endsWith('/page')) return ok({ list: [], total: 0 })
  if (path.endsWith('/list') || path.endsWith('/tree')) return ok([])
  if (method === 'GET') return ok(null)
  return ok(true)
}

export function createMockResponse(url, method = 'GET') {
  const path = normalizePath(url)
  return route(path, method.toUpperCase())
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, tenant-id')
  res.end(JSON.stringify(payload))
}
