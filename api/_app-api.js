import { constants, privateDecrypt, createHmac } from 'node:crypto'
import { hasDatabaseConfig, query, queryOne } from '../backend/db.mjs'

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
const tokenSecret = process.env.APP_TOKEN_SECRET || 'local-dev-token-secret'
const proxyTarget = (process.env.APP_API_PROXY_TARGET || '').replace(/\/+$/, '')

const publicKeyBase64 = publicKey
  .replace('-----BEGIN PUBLIC KEY-----', '')
  .replace('-----END PUBLIC KEY-----', '')
  .replace(/\s+/g, '')

function ok(data) {
  return { code: 0, data, msg: 'success' }
}

function fail(message, code = 500) {
  return { code, data: null, msg: message, message }
}

function dbUnavailable() {
  return fail('未配置真实数据库，已停止返回演示假数据。请设置 DATABASE_URL 或 DB_HOST/DB_NAME/DB_USER/DB_PASSWORD。', 503)
}

function dbError(error) {
  console.error('[app-api] database error:', error)
  return fail(error?.message || '数据库查询失败', 500)
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
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (payload.exp && Number(payload.exp) < Date.now()) return null
    return payload
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
  return payload?.username ? payload : null
}

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

function toDateTime(value) {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 19).replace('T', ' ')
  return String(value)
}

function toPercent(value) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? `${Math.round(n)}%` : '0%'
}

function toNumberString(value) {
  const n = Number(value || 0)
  return String(Number.isFinite(n) ? n : 0)
}

function monthStart() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function daysAgoStart(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

function getAuthSql() {
  return (
    process.env.APP_AUTH_USER_SQL ||
    'SELECT id, username, nickname, password AS password_hash, email, tenant_id FROM system_users WHERE username = ? AND deleted = 0 LIMIT 1'
  )
}

function pageInput(input = {}, defaultPageSize = 10) {
  const pageNo = Math.max(Number(input.pageNo || input.page || 1), 1)
  const pageSize = Math.min(Math.max(Number(input.pageSize || defaultPageSize), 1), 200)
  return { pageNo, pageSize, offset: (pageNo - 1) * pageSize }
}

function readQueryParams(req) {
  return new URL(req.url || '/', 'http://localhost').searchParams
}

async function readInput(req) {
  const body = await readBody(req)
  const params = readQueryParams(req)
  for (const [key, value] of params.entries()) {
    if (body[key] == null) body[key] = value
  }
  return body
}

function pushEquals(clauses, values, column, value) {
  if (value === undefined || value === null || value === '') return
  clauses.push(`${column} = ?`)
  values.push(String(value))
}

function pushLike(clauses, values, column, value) {
  const keyword = String(value || '').trim()
  if (!keyword) return
  clauses.push(`${column} LIKE ?`)
  values.push(`%${keyword}%`)
}

function passwordMatches(row, password) {
  const mode = process.env.APP_AUTH_PASSWORD_MODE || 'plain'
  if (mode === 'none') return true
  const stored = String(row?.password_hash || row?.password || '')
  return stored && stored === password
}

async function handleLogin(req) {
  if (!hasDatabaseConfig()) return dbUnavailable()

  const body = await readBody(req)
  const username = String(body.username || '').trim()
  const password = decryptPassword(String(body.password || ''))
  if (!username || !password) return fail('请输入账号和密码', 1)

  try {
    const user = await queryOne(getAuthSql(), [username])
    if (!user || !passwordMatches(user, password)) return fail('账号或密码错误', 1)

    const accessToken = signToken({
      id: user.id,
      username,
      type: 'access',
      exp: Date.now() + 24 * 60 * 60 * 1000,
    })
    const refreshToken = signToken({
      id: user.id,
      username,
      type: 'refresh',
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    })

    return ok({
      userId: String(user.id),
      accessToken,
      refreshToken,
      tenantId: String(user.tenant_id || process.env.APP_TENANT_ID || '1'),
      expiresTime: expiresTime(),
    })
  } catch (error) {
    return dbError(error)
  }
}

async function getCurrentUser(req) {
  const payload = requireAuth(req)
  if (!payload) return null

  const sql =
    process.env.APP_USER_INFO_SQL ||
    'SELECT id, username, nickname, email, avatar, tenant_id FROM system_users WHERE id = ? AND deleted = 0 LIMIT 1'
  return await queryOne(sql, [payload.id])
}

async function teacherInfo(req) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return fail('登录已过期', 401)

    const sql =
      process.env.APP_TEACHER_INFO_SQL ||
      `SELECT
        u.id AS id,
        u.id AS userId,
        u.username AS username,
        COALESCE(u.nickname, u.username) AS teacherName,
        u.mobile AS phoneNumber,
        u.email AS email,
        c.id AS classId,
        c.name AS className,
        c.grade AS gradeId,
        c.grade AS gradeName
      FROM system_users u
      LEFT JOIN homework_classes c ON c.teacher_id = u.id AND c.deleted = b'0'
      WHERE u.id = ? AND u.deleted = 0`
    const rows = await query(sql, [user.id])
    const first = rows[0] || user
    const classInfoList = rows
      .filter(r => r.classId != null)
      .map(r => ({ classId: String(r.classId), className: String(r.className || '') }))

    return ok({
      id: first.id,
      userId: String(first.userId || first.id),
      username: first.username,
      nickname: first.nickname || first.teacherName || first.username,
      teacherId: String(first.userId || first.id),
      teacherName: first.teacherName || first.nickname || first.username,
      phoneNumber: first.phoneNumber || '',
      schoolId: first.schoolId || '',
      schoolName: first.schoolName || '',
      gradeId: first.gradeId || '',
      gradeName: first.gradeName || '',
      subjectId: first.subjectId || '',
      subjectName: first.subjectName || '',
      useDefaultPwd: false,
      classInfoList,
    })
  } catch (error) {
    return dbError(error)
  }
}

async function teacherPage(req) {
  try {
    const body = await readBody(req)
    const pageNo = Math.max(Number(body.pageNo || body.page || 1), 1)
    const pageSize = Math.min(Math.max(Number(body.pageSize || 10), 1), 200)
    const offset = (pageNo - 1) * pageSize
    const clauses = ['u.deleted = 0']
    const values = []

    if (body.teacherName) {
      clauses.push('(u.nickname LIKE ? OR u.username LIKE ?)')
      values.push(`%${body.teacherName}%`, `%${body.teacherName}%`)
    }
    if (body.status !== undefined && body.status !== null && body.status !== '') {
      clauses.push('u.status = ?')
      values.push(String(body.status))
    }
    if (body.gradeId) {
      clauses.push('c.grade = ?')
      values.push(String(body.gradeId))
    }
    if (body.classId) {
      clauses.push('c.id = ?')
      values.push(String(body.classId))
    }

    const where = clauses.join(' AND ')
    const countSql =
      process.env.APP_TEACHER_PAGE_COUNT_SQL ||
      `SELECT COUNT(DISTINCT u.id) AS n
       FROM system_users u
       LEFT JOIN homework_classes c ON c.teacher_id = u.id AND c.deleted = b'0'
       WHERE ${where}`
    const pageSql =
      process.env.APP_TEACHER_PAGE_SQL ||
      `SELECT
        u.id AS id,
        u.id AS userId,
        u.id AS teacherId,
        u.username AS userName,
        COALESCE(u.nickname, u.username) AS teacherName,
        u.mobile AS phoneNumber,
        u.sex AS sex,
        u.status AS status,
        c.id AS classId,
        c.name AS className,
        c.grade AS gradeId,
        c.grade AS gradeName
       FROM system_users u
       LEFT JOIN homework_classes c ON c.teacher_id = u.id AND c.deleted = b'0'
       WHERE ${where}
       ORDER BY u.id DESC
       LIMIT ?, ?`

    const [totalRow, rows] = await Promise.all([
      queryOne(countSql, values),
      query(pageSql, [...values, offset, pageSize]),
    ])

    const map = new Map()
    for (const row of rows) {
      const id = String(row.teacherId || row.userId || row.id)
      if (!map.has(id)) {
        map.set(id, {
          id: row.id,
          teacherId: id,
          userId: String(row.userId || row.id),
          userName: row.userName || '',
          teacherName: row.teacherName || row.userName || '',
          phoneNumber: row.phoneNumber || '',
          sex: row.sex == null ? '' : String(row.sex),
          status: row.status == null ? '' : String(row.status),
          schoolId: row.schoolId || '',
          gradeId: row.gradeId || '',
          gradeName: row.gradeName || '',
          subjectId: row.subjectId || '',
          subjectName: row.subjectName || '',
          classInfoList: [],
        })
      }

      const item = map.get(id)
      if (!item.gradeId && row.gradeId) item.gradeId = String(row.gradeId)
      if (!item.gradeName && row.gradeName) item.gradeName = String(row.gradeName)
      if (row.classId != null) {
        item.classInfoList.push({
          classId: String(row.classId),
          className: String(row.className || ''),
        })
      }
    }

    const total = Number(totalRow?.n || 0)
    return ok({
      list: [...map.values()],
      total,
      totalPage: Math.ceil(total / pageSize),
    })
  } catch (error) {
    return dbError(error)
  }
}

async function permissionInfo(req) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return fail('登录已过期', 401)
    return ok({
      user: {
        id: user.id,
        userId: String(user.id),
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar || '',
        email: user.email || '',
      },
      roles: String(process.env.APP_DEFAULT_ROLES || 'teacher').split(',').filter(Boolean),
      permissions: String(process.env.APP_DEFAULT_PERMISSIONS || '*').split(',').filter(Boolean),
    })
  } catch (error) {
    return dbError(error)
  }
}

async function teacherOverview(req) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return fail('登录已过期', 401)

    const [classes, assignments, students, accuracy] = await Promise.all([
      queryOne("SELECT COUNT(*) AS n FROM homework_classes WHERE teacher_id = ? AND deleted = b'0'", [user.id]),
      queryOne("SELECT COUNT(*) AS n FROM homework_assignments WHERE creator = ? AND deleted = b'0' AND create_time >= ?", [
        String(user.id),
        monthStart(),
      ]),
      queryOne("SELECT COALESCE(SUM(member_count), 0) AS n FROM homework_classes WHERE teacher_id = ? AND deleted = b'0'", [
        user.id,
      ]),
      queryOne(
        `SELECT AVG(CASE WHEN si.max_score > 0 THEN si.score / si.max_score * 100 ELSE NULL END) AS n
         FROM homework_submission_item si
         JOIN homework_submission s ON s.id = si.submission_id AND s.deleted = b'0'
         JOIN homework_assignments a ON a.id = s.assignment_id AND a.deleted = b'0'
         WHERE a.creator = ? AND si.deleted = b'0' AND si.create_time >= ?`,
        [String(user.id), monthStart()]
      ),
    ])

    return ok({
      accuracy: toNumberString(Math.round(Number(accuracy?.n || 0))),
      classCount: toNumberString(classes?.n),
      studentCount: toNumberString(students?.n),
      workCount: toNumberString(assignments?.n),
    })
  } catch (error) {
    return dbError(error)
  }
}

async function studentOverview(req) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return fail('登录已过期', 401)

    const rows = await query(
      `SELECT
        c.id AS classId,
        c.name AS className,
        s.student_id AS studentId,
        AVG(s.final_score) AS avgScore
      FROM homework_classes c
      LEFT JOIN homework_assignment_class ac ON ac.class_id = c.id AND ac.deleted = b'0'
      LEFT JOIN homework_submission s ON s.assignment_id = ac.assignment_id AND s.deleted = b'0'
      WHERE c.teacher_id = ? AND c.deleted = b'0'
      GROUP BY c.id, c.name, s.student_id
      ORDER BY c.id`,
      [user.id]
    )

    const map = new Map()
    for (const row of rows) {
      const classId = String(row.classId || '')
      if (!map.has(classId)) {
        map.set(classId, { classId, className: String(row.className || ''), scores: [] })
      }
      if (row.studentId != null && row.avgScore != null) {
        map.get(classId).scores.push({ id: String(row.studentId), score: Number(row.avgScore) })
      }
    }

    return ok(
      [...map.values()].map(item => {
        const avg =
          item.scores.length > 0 ? item.scores.reduce((sum, i) => sum + i.score, 0) / item.scores.length : 0
        const above = item.scores.filter(i => i.score >= avg + 5)
        const below = item.scores.filter(i => i.score < avg - 5)
        const middle = item.scores.filter(i => i.score < avg + 5 && i.score >= avg - 5)
        const total = Math.max(item.scores.length, 1)
        return {
          classId: item.classId,
          className: item.className,
          aboveCount: String(above.length),
          aboveRatio: toPercent((above.length / total) * 100),
          avgCount: String(middle.length),
          avgRatio: toPercent((middle.length / total) * 100),
          belowCount: String(below.length),
          belowRatio: toPercent((below.length / total) * 100),
          avgRate: toPercent(avg),
          aboveList: above.map(i => i.id),
          avgList: middle.map(i => i.id),
          belowList: below.map(i => i.id),
          studentList: item.scores.map(i => i.id),
        }
      })
    )
  } catch (error) {
    return dbError(error)
  }
}

async function questionStatistics(req) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return fail('登录已过期', 401)
    const recentStart = daysAgoStart(7)
    const [total, self, recent, recentSelf] = await Promise.all([
      queryOne("SELECT COUNT(*) AS n FROM homework_questions WHERE deleted = b'0'"),
      queryOne("SELECT COUNT(*) AS n FROM homework_questions WHERE creator = ? AND deleted = b'0'", [String(user.id)]),
      queryOne("SELECT COUNT(*) AS n FROM homework_questions WHERE deleted = b'0' AND create_time >= ?", [recentStart]),
      queryOne("SELECT COUNT(*) AS n FROM homework_questions WHERE creator = ? AND deleted = b'0' AND create_time >= ?", [
        String(user.id),
        recentStart,
      ]),
    ])

    return ok({
      totalQuestionCount: Number(total?.n || 0),
      subjectQuestionCount: Math.max(Number(total?.n || 0) - Number(self?.n || 0), 0),
      selfQuestionCount: Number(self?.n || 0),
      newQuestionCount: Number(recent?.n || 0),
      newSubjectQuestionCount: Math.max(Number(recent?.n || 0) - Number(recentSelf?.n || 0), 0),
      newSelfQuestionCount: Number(recentSelf?.n || 0),
    })
  } catch (error) {
    return dbError(error)
  }
}

async function recentHomework(req) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return fail('登录已过期', 401)

    const rows = await query(
      `SELECT
        a.id AS assignmentId,
        a.title AS assignmentName,
        a.grade AS gradeName,
        a.subject AS subjectName,
        MIN(s.submitted_at) AS firstSubmitTime,
        c.id AS classId,
        c.name AS className,
        COUNT(DISTINCT s.student_id) AS submittedCount,
        COALESCE(c.member_count, 0) AS totalCount,
        SUM(CASE WHEN s.graded_at IS NOT NULL THEN 1 ELSE 0 END) AS gradedCount,
        SUM(CASE WHEN s.graded_at IS NULL THEN 1 ELSE 0 END) AS needGradingCount
      FROM homework_assignments a
      LEFT JOIN homework_assignment_class ac ON ac.assignment_id = a.id AND ac.deleted = b'0'
      LEFT JOIN homework_classes c ON c.id = ac.class_id AND c.deleted = b'0'
      LEFT JOIN homework_submission s ON s.assignment_id = a.id AND s.deleted = b'0'
      WHERE a.creator = ? AND a.deleted = b'0'
      GROUP BY a.id, a.title, a.grade, a.subject, c.id, c.name, c.member_count
      ORDER BY COALESCE(MIN(s.submitted_at), a.create_time) DESC
      LIMIT 20`,
      [String(user.id)]
    )

    const map = new Map()
    for (const row of rows) {
      const id = String(row.assignmentId)
      if (!map.has(id)) {
        map.set(id, {
          assignmentId: id,
          assignmentName: row.assignmentName || '',
          firstSubmitTime: toDateTime(row.firstSubmitTime),
          gradeId: row.gradeName || '',
          gradeName: row.gradeName || '',
          subjectId: row.subjectName || '',
          subjectName: row.subjectName || '',
          groupProgressList: [],
        })
      }
      if (row.classId != null) {
        map.get(id).groupProgressList.push({
          classId: String(row.classId),
          className: String(row.className || ''),
          type: 'class',
          submittedCount: Number(row.submittedCount || 0),
          totalCount: Number(row.totalCount || 0),
          gradedCount: Number(row.gradedCount || 0),
          needGradingCount: Number(row.needGradingCount || 0),
        })
      }
    }

    return ok([...map.values()].slice(0, 5))
  } catch (error) {
    return dbError(error)
  }
}

async function recentAssignments(req) {
  try {
    const user = await getCurrentUser(req)
    if (!user) return fail('登录已过期', 401)

    const rows = await query(
      `SELECT
        a.id AS assignmentId,
        a.title AS assignmentName,
        a.grade AS gradeName,
        a.subject AS subjectName,
        a.type AS assignmentType,
        a.status AS status,
        COUNT(aq.question_id) AS questionNumbers
      FROM homework_assignments a
      LEFT JOIN homework_assignment_question aq ON aq.assignment_id = a.id AND aq.deleted = b'0'
      WHERE a.creator = ? AND a.deleted = b'0'
      GROUP BY a.id, a.title, a.grade, a.subject, a.type, a.status
      ORDER BY a.create_time DESC
      LIMIT 5`,
      [String(user.id)]
    )

    return ok(
      rows.map(row => ({
        assignmentId: String(row.assignmentId),
        assignmentName: row.assignmentName || '',
        gradeName: row.gradeName || '',
        subjectName: row.subjectName || '',
        assignmentType: row.assignmentType || '',
        status: String(row.status || ''),
        questionNumbers: Number(row.questionNumbers || 0),
      }))
    )
  } catch (error) {
    return dbError(error)
  }
}

async function compositionPage(req) {
  try {
    const body = await readBody(req)
    const pageNo = Number(body.pageNo || body.page || 1)
    const pageSize = Number(body.pageSize || 10)
    const keyword = String(body.keyword || '').trim()
    const where = keyword ? "WHERE deleted = b'0' AND title LIKE ?" : "WHERE deleted = b'0'"
    const params = keyword ? [`%${keyword}%`, (pageNo - 1) * pageSize, pageSize] : [(pageNo - 1) * pageSize, pageSize]
    const countParams = keyword ? [`%${keyword}%`] : []
    const [total, rows] = await Promise.all([
      queryOne(`SELECT COUNT(*) AS n FROM homework_compositions ${where}`, countParams),
      query(
        `SELECT id, title, creator, create_time AS createdAt FROM homework_compositions ${where} ORDER BY create_time DESC LIMIT ?, ?`,
        params
      ),
    ])
    return ok({ list: rows, rows, total: Number(total?.n || 0) })
  } catch (error) {
    return dbError(error)
  }
}

async function mistakeStudentStatistics() {
  try {
    const rows = await query(
      `SELECT
        student_id AS id,
        student_id AS name,
        SUM(CASE WHEN mastered = 1 THEN 1 ELSE 0 END) AS destroy,
        SUM(wrong_count) AS wrongTotal,
        COUNT(*) AS redo
      FROM homework_mistake_book
      WHERE deleted = b'0'
      GROUP BY student_id
      ORDER BY wrongTotal DESC`
    )
    return ok(
      rows.map(row => {
        const wrongTotal = Number(row.wrongTotal || 0)
        const destroy = Number(row.destroy || 0)
        const redo = Number(row.redo || 0)
        const base = Math.max(wrongTotal + destroy + redo, 1)
        return {
          id: String(row.id),
          name: String(row.name),
          destroy,
          redo,
          wrongTotal,
          answerTotal: wrongTotal + destroy,
          progress: {
            destroyPct: Math.round((destroy / base) * 100),
            redoPct: Math.round((redo / base) * 100),
            wrongPct: Math.round((wrongTotal / base) * 100),
          },
        }
      })
    )
  } catch (error) {
    return dbError(error)
  }
}

async function mistakeDetail(req) {
  try {
    const params = new URL(req.url || '/', 'http://localhost').searchParams
    const studentId = String(params.get('studentId') || params.get('id') || '').trim()
    const date = String(params.get('date') || '').trim()
    const clauses = ["mb.deleted = b'0'"]
    const values = []
    if (studentId) {
      clauses.push('mb.student_id = ?')
      values.push(studentId)
    }
    if (date && date !== 'all') {
      clauses.push('DATE(mb.create_time) = ?')
      values.push(date)
    }

    const rows = await query(
      `SELECT
        mb.id,
        mb.student_id AS studentId,
        mb.mastered,
        mb.create_time AS createTime,
        q.id AS questionId,
        q.title,
        q.content
      FROM homework_mistake_book mb
      LEFT JOIN homework_questions q ON q.id = mb.question_id AND q.deleted = b'0'
      WHERE ${clauses.join(' AND ')}
      ORDER BY mb.create_time DESC
      LIMIT 100`,
      values
    )

    const dates = [...new Set(rows.map(row => toDateTime(row.createTime).slice(0, 10)).filter(Boolean))].map(d => ({
      label: d,
      value: d,
    }))

    return ok({
      dates: [{ label: '全部日期', value: 'all' }, ...dates],
      questions: rows.map((row, index) => ({
        id: String(row.id),
        no: String(index + 1).padStart(2, '0'),
        status: row.mastered ? 'correct' : 'wrong',
        content: row.content || row.title || '',
        studentAnswer: '',
        correctAnswer: '',
        analysis: '',
        time: toDateTime(row.createTime),
      })),
    })
  } catch (error) {
    return dbError(error)
  }
}

async function groupingStrategyPage() {
  try {
    const rows = await query(
      `SELECT
        id,
        id AS groupId,
        name AS groupName,
        difficulty,
        description,
        create_time AS createTime
      FROM homework_layers
      WHERE deleted = b'0'
      ORDER BY id ASC`
    )

    return ok({
      list: rows.length
        ? [
            {
              id: rows[0].id,
              strategyId: 'default',
              strategyName: '默认分层',
              studentGroupVOS: rows.map(row => ({
                id: row.id,
                groupId: String(row.groupId),
                groupName: row.groupName,
                groupCode: row.difficulty || '',
                description: row.description || '',
                createTime: toDateTime(row.createTime),
              })),
            },
          ]
        : [],
      total: rows.length ? 1 : 0,
      totalPage: rows.length ? 1 : 0,
    })
  } catch (error) {
    return dbError(error)
  }
}

async function proxyRequest(req, originalPath) {
  const originalUrl = new URL(req.url || '/', 'http://localhost')
  const target = new URL(`${originalPath}${originalUrl.search}`, proxyTarget)
  const method = String(req.method || 'GET').toUpperCase()
  const headers = { ...req.headers }
  delete headers.host
  delete headers.connection

  const body = method === 'GET' || method === 'HEAD' ? undefined : JSON.stringify(await readBody(req))
  const upstream = await fetch(target, { method, headers, body })
  const text = await upstream.text()
  try {
    return JSON.parse(text)
  } catch {
    return upstream.ok ? ok(text) : fail(text || `上游接口错误: ${upstream.status}`, upstream.status)
  }
}

export async function executeApi(req, endpoint) {
  const method = String(req.method || 'GET').toUpperCase()

  if (endpoint === 'public-key' && method === 'GET') return ok(publicKeyBase64)
  if (endpoint === 'oauth-login' && method === 'POST') return handleLogin(req)
  if (endpoint === 'oauth-refresh-token' && method === 'POST') {
    const params = new URL(req.url || '/', 'http://localhost').searchParams
    const payload = readToken(String(params.get('refreshToken') || ''))
    if (!payload) return fail('登录已过期', 401)
    return ok({
      userId: String(payload.id || ''),
      accessToken: signToken({ ...payload, type: 'access', exp: Date.now() + 24 * 60 * 60 * 1000 }),
      refreshToken: signToken({ ...payload, type: 'refresh', exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }),
      tenantId: String(process.env.APP_TENANT_ID || '1'),
      expiresTime: expiresTime(),
    })
  }
  if (endpoint === 'oauth-logout' && method === 'POST') return ok(true)
  if (endpoint === 'reset-password' && method === 'POST') return fail('真实重置密码接口尚未接入，请配置 APP_API_PROXY_TARGET 转发到业务后端。', 501)
  if (endpoint === 'forgot-password' && method === 'POST') return fail('真实忘记密码接口尚未接入，请配置 APP_API_PROXY_TARGET 转发到业务后端。', 501)

  if (!hasDatabaseConfig()) return dbUnavailable()
  if (endpoint !== 'public-key' && endpoint !== 'oauth-login' && !requireAuth(req)) return fail('登录已过期', 401)

  if (endpoint === 'permission-info' && method === 'GET') return permissionInfo(req)
  if (endpoint === 'permission-validate' && method === 'POST') return fail('真实权限验证接口尚未接入，请配置 APP_API_PROXY_TARGET 转发到业务后端。', 501)
  if (endpoint === 'permission-sync' && method === 'POST') return fail('真实权限同步接口尚未接入，请配置 APP_API_PROXY_TARGET 转发到业务后端。', 501)
  if (endpoint === 'teacher-info' && method === 'GET') return teacherInfo(req)
  if (endpoint === 'teacher-page' && method === 'POST') return teacherPage(req)
  if (endpoint === 'teacher-overview' && method === 'GET') return teacherOverview(req)
  if (endpoint === 'student-overview' && method === 'GET') return studentOverview(req)
  if (endpoint === 'question-statistics' && method === 'GET') return questionStatistics(req)
  if (endpoint === 'recent-homework' && method === 'GET') return recentHomework(req)
  if (endpoint === 'recent-assignments' && method === 'GET') return recentAssignments(req)
  if (endpoint === 'composition-page' && method === 'POST') return compositionPage(req)
  if (endpoint === 'mistake-student-statistics' && method === 'GET') return mistakeStudentStatistics(req)
  if (endpoint === 'mistake-detail' && method === 'GET') return mistakeDetail(req)
  if (endpoint === 'grouping-strategy-page' && method === 'POST') return groupingStrategyPage(req)
  if (endpoint === 'assignment-download' && method === 'POST') return fail('真实下载接口尚未接入，请配置 APP_API_PROXY_TARGET 转发到业务后端。', 501)
  if (endpoint === 'assignment-splice' && method === 'POST') return fail('真实继续组卷接口尚未接入，请配置 APP_API_PROXY_TARGET 转发到业务后端。', 501)

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
  const originalPath = new URL(req.url || '/', 'http://localhost').pathname.replace(/^\/app(?=\/)/, '')
  if (proxyTarget) return proxyRequest(req, originalPath)

  const endpointMap = {
    '/oauth/public-key': 'public-key',
    '/api/oauth/public-key': 'public-key',
    '/api/v1/oauth/login': 'oauth-login',
    '/api/v1/oauth/refresh-token': 'oauth-refresh-token',
    '/api/v1/auth/refresh-token': 'oauth-refresh-token',
    '/api/v1/oauth/logout': 'oauth-logout',
    '/api/v1/oauth/reset-password': 'reset-password',
    '/api/v1/oauth/forgot-password': 'forgot-password',
    '/api/v1/oauth/get-permission-info': 'permission-info',
    '/api/v1/permission/validate': 'permission-validate',
    '/api/v1/permission/sync': 'permission-sync',
    '/api/v1/teacher/teacher-info': 'teacher-info',
    '/api/v1/teacher/page': 'teacher-page',
    '/api/v1/teacher/overview': 'teacher-overview',
    '/api/v1/student/overview': 'student-overview',
    '/api/v1/question/statistics': 'question-statistics',
    '/api/v1/student/homework/recent-list': 'recent-homework',
    '/api/v1/assignment/recent-list': 'recent-assignments',
    '/api/v1/assignment/download': 'assignment-download',
    '/api/v1/assignment/splice': 'assignment-splice',
    '/api/v1/composition/page': 'composition-page',
    '/api/v1/mistakes/student-statistics': 'mistake-student-statistics',
    '/api/v1/mistakes/detail': 'mistake-detail',
    '/api/v1/grouping-strategy/page': 'grouping-strategy-page',
    '/api/public-key': 'public-key',
    '/api/login': 'oauth-login',
    '/api/refresh-token': 'oauth-refresh-token',
    '/api/logout': 'oauth-logout',
    '/api/reset-password': 'reset-password',
    '/api/forgot-password': 'forgot-password',
    '/api/permission-info': 'permission-info',
    '/api/permission-validate': 'permission-validate',
    '/api/permission-sync': 'permission-sync',
    '/api/teacher-info': 'teacher-info',
    '/api/teacher-page': 'teacher-page',
    '/api/teacher-overview': 'teacher-overview',
    '/api/student-overview': 'student-overview',
    '/api/question-statistics': 'question-statistics',
    '/api/recent-homework': 'recent-homework',
    '/api/recent-assignments': 'recent-assignments',
    '/api/assignment-download': 'assignment-download',
    '/api/assignment-splice': 'assignment-splice',
    '/api/composition-page': 'composition-page',
    '/api/mistake-student-statistics': 'mistake-student-statistics',
    '/api/mistake-detail': 'mistake-detail',
    '/api/grouping-strategy-page': 'grouping-strategy-page',
  }
  const endpoint = endpointMap[originalPath]
  if (!endpoint) return fail('接口不存在', 404)
  return executeApi(req, endpoint)
}
