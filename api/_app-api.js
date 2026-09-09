import { constants, privateDecrypt, createHmac } from 'node:crypto'

const FALLBACK_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDHW5oFNTK4S2ihJlqvrDzB517f
ZEBeEK0gepyii9GH+vS0LQRk5lG16MeQ03yik9AjvR7SM3hK9d12ICU02NFF6Gv4
ex1E7HJGJPHcEIkX1ZPi40OZJByl7Mpc9ugLwPf3I1bvHjD3iOwu9+wk4O8LlwAR
KpJYgptkWFloypCPbwIDAQAB
-----END PUBLIC KEY-----`

const FALLBACK_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIICeAIBADANBgkqhkiG9w0BAQEFAASCAmIwggJeAgEAAoGBAMdbmgU1MrhLaKEm
Wq+sPMHnXt9kQF4QrSB6nKKL0Yf69LQtBGTmUbXox5DTfKKT0CO9HtIzeEr13XYg
JTTY0UXoa/h7HUTsckYk8dwQiRfVk+LjQ5kkHKXsylz26AvA9/cjVu8eMPeI7C73
7CTg7wuXABEqkliCm2RYWWjKkI9vAgMBAAECgYEAj5J6w9FiK7OzMIuMuAOU5hiZ
DM0IRjZAWKm08KM9TW8AmFnrVjdBFX8FalnE4tkNBxAGiF+k/GdBDPdtlDepziVZ
ayoIVZuayATqM1dZ7VXMmVQzr4atL1bLAFgHMN1O9qjV2hZpW95xbiW6d4LanOh8
s+WUOzGN1pOrGXtb0UECQQD9ksIGhSXofyuFHfyAHlGZuAPRogyUj2tDuDq+gC/g
77PDatDOTaVOJBls4FdRSO+ybS6/v0i/B2PMX/7NgLFRAkEAyUQEvg8dKSfnIYNm
7Ud7e3iux8tsapmNYwNdDclozDbNCS37YV3xzbWmfJqslk8OQwzmVPRRLZbX9OAZ
fpcEvwJBAMbcBRWf7e67bKHktlSzckMfML+CWmNXZkOhg1BKr0G0OkISztY7xlvV
q6ra9R9mF7TSM0tk8+P8I6Pv1J/NQUECQBAbhnmjggTyMZhICOvChcpq7SoGSMX7
Rgp/kWnyDZYSaLRsXqr7Nsfs2scsJdXdu9l35dM0vm50nRH3AXNVKMcCQQCdfbGE
HUc9fNWMfNF4Un0oY0bmkSlpBrUqfl+lfagiUs/cO7BdRRIa2oKEyswOGwTR7g3d
r3oftX4fBwN5rCyU
-----END PRIVATE KEY-----`

const publicKey = process.env.AUTH_PUBLIC_KEY || FALLBACK_PUBLIC_KEY
const privateKey = process.env.AUTH_PRIVATE_KEY || FALLBACK_PRIVATE_KEY
const loginUser = process.env.APP_LOGIN_USER || 'demo'
const loginPassword = process.env.APP_LOGIN_PASSWORD || '123456'
const tokenSecret = process.env.APP_TOKEN_SECRET || 'local-dev-token-secret'

const publicKeyBase64 = publicKey
  .replace('-----BEGIN PUBLIC KEY-----', '')
  .replace('-----END PUBLIC KEY-----', '')
  .replace(/\s+/g, '')

function ok(data) {
  return { code: 0, data, msg: 'success' }
}

function fail(message, code = 401) {
  return { code, data: null, msg: message, message }
}

function expiresTime() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', tokenSecret).update(body).digest('base64url')
  return `${body}.${sig}`
}

function readToken(token = '') {
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expected = createHmac('sha256', tokenSecret).update(body).digest('base64url')
  if (sig !== expected) return null
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

function decryptPassword(value = '') {
  if (!value.startsWith('RSA:')) return value

  try {
    return privateDecrypt(
      {
        key: privateKey,
        padding: constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(value.slice(4), 'base64')
    ).toString('utf8')
  } catch {
    return ''
  }
}

function getBearerToken(req) {
  const auth = req.headers?.authorization || req.headers?.Authorization || ''
  return String(auth).replace(/^Bearer\s+/i, '')
}

function requireAuth(req) {
  const payload = readToken(getBearerToken(req))
  return Boolean(payload?.username)
}

const userInfo = {
  id: 1,
  userId: 'demo-teacher',
  username: loginUser,
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

const studentOverview = [
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
]

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

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }

  return await new Promise(resolve => {
    let raw = ''
    req.on?.('data', chunk => {
      raw += chunk
    })
    req.on?.('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        resolve({})
      }
    })
    if (!req.on) resolve({})
  })
}

export async function executeApi(req, endpoint) {
  const method = String(req.method || 'GET').toUpperCase()

  if (endpoint === 'public-key' && method === 'GET') return ok(publicKeyBase64)

  if (endpoint === 'oauth-login' && method === 'POST') {
    const body = await readBody(req)
    const username = String(body.username || '').trim()
    const password = decryptPassword(String(body.password || ''))

    if (username !== loginUser || password !== loginPassword) {
      return fail('账号或密码错误', 1)
    }

    const accessToken = signToken({ username, type: 'access', exp: Date.now() + 24 * 60 * 60 * 1000 })
    const refreshToken = signToken({ username, type: 'refresh', exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })

    return ok({
      userId: userInfo.userId,
      accessToken,
      refreshToken,
      tenantId: '1',
      expiresTime: expiresTime(),
    })
  }

  if (endpoint === 'oauth-refresh-token' && method === 'POST') {
    const accessToken = signToken({ username: loginUser, type: 'access', exp: Date.now() + 24 * 60 * 60 * 1000 })
    return ok({
      userId: userInfo.userId,
      accessToken,
      refreshToken: signToken({ username: loginUser, type: 'refresh', exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
      tenantId: '1',
      expiresTime: expiresTime(),
    })
  }

  if (endpoint === 'oauth-logout' && method === 'POST') return ok(true)

  if (endpoint === 'reset-password' && method === 'POST') return ok(true)

  if (endpoint !== 'public-key' && endpoint !== 'oauth-login' && !requireAuth(req)) {
    return fail('登录已过期')
  }

  if (endpoint === 'permission-info' && method === 'GET') {
    return ok({
      user: userInfo,
      roles: ['teacher', 'demo'],
      permissions: ['*'],
    })
  }

  if (endpoint === 'teacher-info' && method === 'GET') return ok(teacherInfo)
  if (endpoint === 'teacher-overview' && method === 'GET') {
    return ok({ accuracy: '86', classCount: '2', studentCount: '89', workCount: '16' })
  }
  if (endpoint === 'student-overview' && method === 'GET') return ok(studentOverview)
  if (endpoint === 'question-statistics' && method === 'GET') {
    return ok({
      totalQuestionCount: 1280,
      subjectQuestionCount: 420,
      selfQuestionCount: 86,
      newQuestionCount: 34,
      newSubjectQuestionCount: 12,
      newSelfQuestionCount: 5,
    })
  }
  if (endpoint === 'recent-homework' && method === 'GET') return ok(recentHomework)
  if (endpoint === 'recent-assignments' && method === 'GET') return ok(recentAssignments)
  if (endpoint === 'assignment-download' && method === 'POST') return ok('')
  if (endpoint === 'assignment-splice' && method === 'POST') return ok(true)

  return fail('接口不存在', 404)
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, tenant-id')
  res.end(JSON.stringify(payload))
}

export function createHandler(endpoint) {
  return async function handler(req, res) {
    if (req.method === 'OPTIONS') return sendJson(res, 204, {})
    const payload = await executeApi(req, endpoint)
    sendJson(res, 200, payload)
  }
}

export async function executeByPath(req) {
  const path = new URL(req.url || '/', 'http://localhost').pathname.replace(/^\/app(?=\/)/, '')
  const endpointMap = {
    // 原始路径（Vercel 非 Next.js 项目中 catch-all 不生效，多段路径经 vercel.json rewrites 转为单段路径后进入）
    '/oauth/public-key': 'public-key',
    '/api/oauth/public-key': 'public-key',
    '/api/v1/oauth/login': 'oauth-login',
    '/api/v1/oauth/refresh-token': 'oauth-refresh-token',
    '/api/v1/auth/refresh-token': 'oauth-refresh-token',
    '/api/v1/oauth/logout': 'oauth-logout',
    '/api/v1/oauth/get-permission-info': 'permission-info',
    '/api/v1/teacher/teacher-info': 'teacher-info',
    '/api/v1/teacher/overview': 'teacher-overview',
    '/api/v1/student/overview': 'student-overview',
    '/api/v1/question/statistics': 'question-statistics',
    '/api/v1/student/homework/recent-list': 'recent-homework',
    '/api/v1/assignment/recent-list': 'recent-assignments',
    '/api/v1/assignment/download': 'assignment-download',
    '/api/v1/assignment/splice': 'assignment-splice',
    // 单段别名（与 vercel.json 中的 rewrite 目标一一对应）
    '/api/public-key': 'public-key',
    '/api/login': 'oauth-login',
    '/api/refresh-token': 'oauth-refresh-token',
    '/api/logout': 'oauth-logout',
    '/api/reset-password': 'reset-password',
    '/api/permission-info': 'permission-info',
    '/api/teacher-info': 'teacher-info',
    '/api/teacher-overview': 'teacher-overview',
    '/api/student-overview': 'student-overview',
    '/api/question-statistics': 'question-statistics',
    '/api/recent-homework': 'recent-homework',
    '/api/recent-assignments': 'recent-assignments',
    '/api/assignment-download': 'assignment-download',
    '/api/assignment-splice': 'assignment-splice',
  }
  const endpoint = endpointMap[path]
  if (!endpoint) return fail('接口不存在', 404)
  return executeApi(req, endpoint)
}
