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
const draftBoxStore = new Map()

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
  return fail(
    '未配置真实业务后端或数据库，已停止返回演示假数据。请设置 APP_API_PROXY_TARGET，或仅在直连数据库调试时设置 DATABASE_URL / DB_HOST / DB_NAME / DB_USER / DB_PASSWORD。',
    503
  )
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

function toTimestamp(value) {
  if (!value) return 0
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime()
  return Number.isFinite(time) ? time : 0
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

async function teacherDetail(req) {
  try {
    const body = await readBody(req)
    const id = String(body.teacherId || body.userId || body.id || '')
    const row = await queryOne(
      `SELECT
        u.id AS id,
        u.id AS userId,
        u.id AS teacherId,
        u.username AS userName,
        COALESCE(u.nickname, u.username) AS teacherName,
        u.mobile AS phoneNumber,
        u.sex AS sex,
        u.status AS status
       FROM system_users u
       WHERE u.deleted = 0 AND u.id = ?
       LIMIT 1`,
      [id]
    )
    if (!row) return fail('教师不存在', 404)
    const classes = await query(
      `SELECT id AS classId, name AS className, grade AS gradeId, grade AS gradeName
       FROM homework_classes
       WHERE deleted = b'0' AND teacher_id = ?
       ORDER BY id ASC`,
      [id]
    )
    return ok({
      id: row.id,
      userId: String(row.userId || row.id),
      teacherId: String(row.teacherId || row.id),
      userName: row.userName || '',
      teacherName: row.teacherName || row.userName || '',
      phoneNumber: row.phoneNumber || '',
      sex: row.sex == null ? '' : String(row.sex),
      status: row.status == null ? '' : String(row.status),
      gradeId: classes[0]?.gradeId || '',
      gradeName: classes[0]?.gradeName || '',
      classInfoList: classes.map(item => ({ classId: String(item.classId), className: item.className || '' })),
    })
  } catch (error) {
    return dbError(error)
  }
}

function mapClass(row) {
  return {
    id: row.id,
    classId: String(row.classId || row.id),
    className: String(row.className || row.name || ''),
    gradeId: String(row.gradeId || row.grade || ''),
    gradeName: String(row.gradeName || row.grade || ''),
    status: row.status === 1 || row.status === '1' || row.status === true,
    studentCount: String(row.studentCount ?? row.member_count ?? row.memberCount ?? 0),
    teacherCount: String(row.teacherCount ?? (row.teacher_id || row.teacherId ? 1 : 0)),
  }
}

async function classPage(req) {
  try {
    const body = await readBody(req)
    const { pageNo, pageSize, offset } = pageInput(body)
    const clauses = ["deleted = b'0'"]
    const values = []
    pushEquals(clauses, values, 'id', body.classId)
    pushEquals(clauses, values, 'grade', body.gradeId)
    pushLike(clauses, values, 'name', body.className)
    const where = clauses.join(' AND ')
    const [totalRow, rows] = await Promise.all([
      queryOne(`SELECT COUNT(*) AS n FROM homework_classes WHERE ${where}`, values),
      query(
        `SELECT id, id AS classId, name AS className, grade AS gradeId, grade AS gradeName,
          status, member_count AS studentCount, teacher_id AS teacherId
         FROM homework_classes
         WHERE ${where}
         ORDER BY id DESC
         LIMIT ?, ?`,
        [...values, offset, pageSize]
      ),
    ])
    const total = Number(totalRow?.n || 0)
    return ok({ list: rows.map(mapClass), total, totalPage: Math.ceil(total / pageSize) })
  } catch (error) {
    return dbError(error)
  }
}

async function classList(req) {
  try {
    const body = await readBody(req)
    const clauses = ["deleted = b'0'"]
    const values = []
    pushEquals(clauses, values, 'grade', body.gradeId)
    const rows = await query(
      `SELECT id, id AS classId, name AS className, grade AS gradeId, grade AS gradeName,
        status, member_count AS studentCount, teacher_id AS teacherId
       FROM homework_classes
       WHERE ${clauses.join(' AND ')}
       ORDER BY id ASC`,
      values
    )
    return ok(rows.map(mapClass))
  } catch (error) {
    return dbError(error)
  }
}

function mapStudent(row) {
  return {
    id: row.id,
    studentId: String(row.studentId || row.id),
    studentUserId: String(row.studentUserId || row.id),
    studentName: String(row.studentName || row.nickname || row.username || ''),
    studentCode: String(row.studentCode || row.username || row.id),
    userName: String(row.userName || row.username || ''),
    sex: row.sex == null ? '' : String(row.sex),
    status: row.status == null ? '' : String(row.status),
    classId: row.classId == null ? '' : String(row.classId),
    className: String(row.className || ''),
    gradeId: String(row.gradeId || ''),
    gradeName: String(row.gradeName || ''),
    schoolId: row.schoolId || '',
  }
}

async function studentPage(req) {
  try {
    const body = await readBody(req)
    const { pageNo, pageSize, offset } = pageInput(body)
    const clauses = ['u.deleted = 0', "u.username <> '13866666666'"]
    const values = []
    pushLike(clauses, values, 'COALESCE(u.nickname, u.username)', body.studentName || body.teacherName)
    pushEquals(clauses, values, 'u.status', body.status)
    pushEquals(clauses, values, 'c.id', body.classId)
    pushEquals(clauses, values, 'c.grade', body.gradeId)
    const where = clauses.join(' AND ')
    const [totalRow, rows] = await Promise.all([
      queryOne(
        `SELECT COUNT(DISTINCT u.id) AS n
         FROM system_users u
         LEFT JOIN homework_submission s ON s.student_id = u.id AND s.deleted = b'0'
         LEFT JOIN homework_assignment_class ac ON ac.assignment_id = s.assignment_id AND ac.deleted = b'0'
         LEFT JOIN homework_classes c ON c.id = ac.class_id AND c.deleted = b'0'
         WHERE ${where}`,
        values
      ),
      query(
        `SELECT DISTINCT
          u.id,
          u.id AS studentId,
          u.id AS studentUserId,
          u.username AS userName,
          COALESCE(u.nickname, u.username) AS studentName,
          u.username AS studentCode,
          u.sex,
          u.status,
          c.id AS classId,
          c.name AS className,
          c.grade AS gradeId,
          c.grade AS gradeName
         FROM system_users u
         LEFT JOIN homework_submission s ON s.student_id = u.id AND s.deleted = b'0'
         LEFT JOIN homework_assignment_class ac ON ac.assignment_id = s.assignment_id AND ac.deleted = b'0'
         LEFT JOIN homework_classes c ON c.id = ac.class_id AND c.deleted = b'0'
         WHERE ${where}
         ORDER BY u.id DESC
         LIMIT ?, ?`,
        [...values, offset, pageSize]
      ),
    ])
    const total = Number(totalRow?.n || 0)
    return ok({ list: rows.map(mapStudent), total, totalPage: Math.ceil(total / pageSize) })
  } catch (error) {
    return dbError(error)
  }
}

async function studentList(req) {
  try {
    const body = await readBody(req)
    const clauses = ['u.deleted = 0', "u.username <> '13866666666'"]
    const values = []
    pushEquals(clauses, values, 'c.id', body.classId)
    pushEquals(clauses, values, 'c.grade', body.gradeId)
    const rows = await query(
      `SELECT DISTINCT
        u.id,
        u.id AS studentId,
        u.id AS studentUserId,
        u.username AS userName,
        COALESCE(u.nickname, u.username) AS studentName,
        u.username AS studentCode,
        u.sex,
        u.status,
        c.id AS classId,
        c.name AS className,
        c.grade AS gradeId,
        c.grade AS gradeName
       FROM system_users u
       LEFT JOIN homework_submission s ON s.student_id = u.id AND s.deleted = b'0'
       LEFT JOIN homework_assignment_class ac ON ac.assignment_id = s.assignment_id AND ac.deleted = b'0'
       LEFT JOIN homework_classes c ON c.id = ac.class_id AND c.deleted = b'0'
       WHERE ${clauses.join(' AND ')}
       ORDER BY u.id ASC`,
      values
    )
    return ok(rows.map(mapStudent))
  } catch (error) {
    return dbError(error)
  }
}

async function studentsByClassId(req) {
  return studentList(req)
}

async function teachersByClassId(req) {
  try {
    const body = await readBody(req)
    const rows = await query(
      `SELECT
        u.id,
        u.id AS userId,
        u.id AS teacherId,
        u.username AS userName,
        COALESCE(u.nickname, u.username) AS teacherName,
        u.mobile AS phoneNumber,
        u.sex,
        u.status,
        c.id AS classId,
        c.name AS className,
        c.grade AS gradeId,
        c.grade AS gradeName
       FROM system_users u
       JOIN homework_classes c ON c.teacher_id = u.id AND c.deleted = b'0'
       WHERE u.deleted = 0 AND (? = '' OR c.id = ?) AND (? = '' OR c.grade = ?)
       ORDER BY u.id ASC`,
      [String(body.classId || ''), String(body.classId || ''), String(body.gradeId || ''), String(body.gradeId || '')]
    )
    return ok(
      rows.map(row => ({
        id: row.id,
        userId: String(row.userId || row.id),
        teacherId: String(row.teacherId || row.id),
        userName: row.userName || '',
        teacherName: row.teacherName || row.userName || '',
        phoneNumber: row.phoneNumber || '',
        sex: row.sex == null ? '' : String(row.sex),
        status: row.status == null ? '' : String(row.status),
        gradeId: row.gradeId || '',
        gradeName: row.gradeName || '',
        classInfoList: row.classId ? [{ classId: String(row.classId), className: row.className || '' }] : [],
      }))
    )
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

async function assignmentPage(req) {
  try {
    const body = await readBody(req)
    const { pageNo, pageSize, offset } = pageInput(body)
    const user = await getCurrentUser(req)
    if (!user) return fail('登录已过期', 401)
    const clauses = ["a.deleted = b'0'"]
    const values = []
    pushEquals(clauses, values, 'a.creator', String(user.id))
    pushEquals(clauses, values, 'a.grade', body.gradeId)
    pushEquals(clauses, values, 'a.subject', body.subjectId)
    pushEquals(clauses, values, 'a.type', body.assignmentType)
    const where = clauses.join(' AND ')
    const [totalRow, rows] = await Promise.all([
      queryOne(`SELECT COUNT(*) AS n FROM homework_assignments a WHERE ${where}`, values),
      query(
        `SELECT
          a.id,
          a.id AS assignmentId,
          a.title AS assignmentName,
          a.type AS assignmentType,
          a.type AS assignmentNature,
          a.subject AS subjectId,
          a.subject AS subjectName,
          a.grade AS gradeId,
          a.grade AS gradeName,
          a.status,
          COUNT(aq.question_id) AS questionNumbers
         FROM homework_assignments a
         LEFT JOIN homework_assignment_question aq ON aq.assignment_id = a.id AND aq.deleted = b'0'
         WHERE ${where}
         GROUP BY a.id, a.title, a.type, a.subject, a.grade, a.status
         ORDER BY a.create_time DESC
         LIMIT ?, ?`,
        [...values, offset, pageSize]
      ),
    ])
    return ok({
      list: rows.map(row => ({
        id: row.id,
        assignmentId: String(row.assignmentId),
        assignmentName: row.assignmentName || '',
        assignmentNature: row.assignmentNature || 'homework',
        assignmentType: row.assignmentType || 'homework',
        assignmentPages: '1',
        classId: '',
        gradeId: row.gradeId || '',
        gradeName: row.gradeName || '',
        subjectId: row.subjectId || '',
        subjectName: row.subjectName || '',
        questionNumbers: Number(row.questionNumbers || 0),
        questionsPage: 1,
        status: String(row.status || ''),
        assignmentStatus: String(row.status || ''),
      })),
      total: Number(totalRow?.n || 0),
    })
  } catch (error) {
    return dbError(error)
  }
}

function mapAssignment(row, classRows = []) {
  return {
    assignmentId: String(row.assignmentId || row.id),
    assignmentName: row.assignmentName || row.title || '',
    assignmentPage: null,
    assignmentStatus: row.assignmentStatus == null ? String(row.status || '') : String(row.assignmentStatus),
    assignmentTime: toTimestamp(row.assignmentTime || row.published_at || row.create_time),
    assignmentType: row.assignmentType || row.type || '',
    gradeId: row.gradeId || row.grade || '',
    gradeName: row.gradeName || row.grade || '',
    subjectId: row.subjectId || row.subject || '',
    subjectName: row.subjectName || row.subject || '',
    classHomeworkList: classRows.map(c => ({
      classId: String(c.classId),
      className: String(c.className || ''),
      completedCount: Number(c.completedCount || 0),
      uncompletedCount: Math.max(Number(c.totalCount || 0) - Number(c.completedCount || 0), 0),
      abnormalCount: Number(c.abnormalCount || 0),
    })),
  }
}

async function homeworkList(req) {
  try {
    const body = await readBody(req)
    const { pageNo, pageSize, offset } = pageInput(body)
    const user = await getCurrentUser(req)
    if (!user) return fail('登录已过期', 401)
    const clauses = ["a.deleted = b'0'"]
    const values = []
    pushEquals(clauses, values, 'a.creator', String(user.id))
    pushEquals(clauses, values, 'a.grade', body.gradeId)
    pushEquals(clauses, values, 'a.subject', body.subjectId)
    if (body.classId) {
      clauses.push('ac.class_id = ?')
      values.push(String(body.classId))
    }
    const where = clauses.join(' AND ')
    const [totalRow, rows] = await Promise.all([
      queryOne(
        `SELECT COUNT(DISTINCT a.id) AS n
         FROM homework_assignments a
         LEFT JOIN homework_assignment_class ac ON ac.assignment_id = a.id AND ac.deleted = b'0'
         WHERE ${where}`,
        values
      ),
      query(
        `SELECT DISTINCT
          a.id,
          a.id AS assignmentId,
          a.title AS assignmentName,
          a.type AS assignmentType,
          a.subject AS subjectId,
          a.subject AS subjectName,
          a.grade AS gradeId,
          a.grade AS gradeName,
          a.status AS assignmentStatus,
          a.published_at AS assignmentTime,
          a.create_time
         FROM homework_assignments a
         LEFT JOIN homework_assignment_class ac ON ac.assignment_id = a.id AND ac.deleted = b'0'
         WHERE ${where}
         ORDER BY a.create_time DESC
         LIMIT ?, ?`,
        [...values, offset, pageSize]
      ),
    ])
    const ids = rows.map(r => r.id)
    let classRows = []
    if (ids.length) {
      classRows = await query(
        `SELECT
          ac.assignment_id AS assignmentId,
          c.id AS classId,
          c.name AS className,
          c.member_count AS totalCount,
          COUNT(DISTINCT s.student_id) AS completedCount,
          SUM(CASE WHEN s.status < 0 THEN 1 ELSE 0 END) AS abnormalCount
         FROM homework_assignment_class ac
         JOIN homework_classes c ON c.id = ac.class_id AND c.deleted = b'0'
         LEFT JOIN homework_submission s ON s.assignment_id = ac.assignment_id AND s.deleted = b'0'
         WHERE ac.deleted = b'0' AND ac.assignment_id IN (${ids.map(() => '?').join(',')})
         GROUP BY ac.assignment_id, c.id, c.name, c.member_count`,
        ids
      )
    }
    const classMap = new Map()
    for (const row of classRows) {
      const list = classMap.get(String(row.assignmentId)) || []
      list.push(row)
      classMap.set(String(row.assignmentId), list)
    }
    const total = Number(totalRow?.n || 0)
    return ok({
      list: rows.map(row => mapAssignment(row, classMap.get(String(row.id)) || [])),
      total,
      totalPage: Math.ceil(total / pageSize),
    })
  } catch (error) {
    return dbError(error)
  }
}

async function classHomeworkDetail(req) {
  try {
    const input = await readInput(req)
    const assignmentId = String(input.assignmentId || '')
    const classId = String(input.classId || '')
    const rows = await query(
      `SELECT
        q.id AS questionId,
        q.title,
        q.content,
        q.type,
        aq.position,
        aq.score,
        s.student_id AS studentId,
        u.nickname AS studentName,
        si.id AS detailId,
        si.answer_text AS studentAnswer,
        si.is_correct AS isCorrect,
        si.score AS studentScore
       FROM homework_assignment_question aq
       JOIN homework_questions q ON q.id = aq.question_id AND q.deleted = b'0'
       LEFT JOIN homework_submission s ON s.assignment_id = aq.assignment_id AND s.deleted = b'0'
       LEFT JOIN homework_assignment_class ac ON ac.assignment_id = aq.assignment_id AND ac.deleted = b'0'
       LEFT JOIN system_users u ON u.id = s.student_id AND u.deleted = 0
       LEFT JOIN homework_submission_item si ON si.submission_id = s.id AND si.question_id = q.id AND si.deleted = b'0'
       WHERE aq.deleted = b'0' AND aq.assignment_id = ? AND (? = '' OR ac.class_id = ?)
       ORDER BY aq.position ASC, s.student_id ASC`,
      [assignmentId, classId, classId]
    )
    const map = new Map()
    for (const row of rows) {
      const id = String(row.questionId)
      if (!map.has(id)) {
        map.set(id, {
          assignmentId,
          questionId: id,
          questionOrder: String(row.position || ''),
          pageNumber: '1',
          questionContent: row.content || row.title || '',
          questionImage: '',
          answer: '',
          explainVideoUrl: '',
          correctStudentList: [],
          errorStudentList: [],
          halfStudentList: [],
        })
      }
      if (row.studentId == null) continue
      const item = {
        assignmentId,
        detailId: row.detailId == null ? '' : String(row.detailId),
        homeworkId: row.detailId == null ? '' : String(row.detailId),
        homeworkStatus: row.isCorrect ? 'Correct' : 'Incorrect',
        questionId: id,
        studentAnswerImage: '',
        studentUserId: String(row.studentId),
        studentName: row.studentName || String(row.studentId),
      }
      const target = row.isCorrect ? 'correctStudentList' : row.studentScore > 0 ? 'halfStudentList' : 'errorStudentList'
      map.get(id)[target].push(item)
    }
    return ok([...map.values()])
  } catch (error) {
    return dbError(error)
  }
}

async function originalDetail(req) {
  try {
    const input = await readInput(req)
    const assignmentId = String(input.assignmentId || '')
    const studentUserId = String(input.studentUserId || '')
    const rows = await query(
      `SELECT
        s.id,
        s.id AS homeworkId,
        s.assignment_id AS assignmentId,
        s.student_id AS studentUserId,
        s.status AS homeworkStatus,
        s.submitted_at AS scanTime,
        JSON_ARRAYAGG(JSON_OBJECT('questionId', si.question_id, 'answer', si.answer_text, 'status', si.is_correct)) AS auditResult
       FROM homework_submission s
       LEFT JOIN homework_submission_item si ON si.submission_id = s.id AND si.deleted = b'0'
       WHERE s.deleted = b'0' AND (? = '' OR s.assignment_id = ?) AND (? = '' OR s.student_id = ?)
       GROUP BY s.id, s.assignment_id, s.student_id, s.status, s.submitted_at
       ORDER BY s.submitted_at DESC`,
      [assignmentId, assignmentId, studentUserId, studentUserId]
    )
    const result = rows.map(row => ({
      id: String(row.id),
      fileName: `作业-${row.homeworkId}`,
      attachmentId: null,
      assignmentId: String(row.assignmentId),
      homeworkStatus: String(row.homeworkStatus || ''),
      scanTime: toDateTime(row.scanTime),
      qrcodeContent: null,
      errorReason: null,
      batchId: null,
      homeworkId: String(row.homeworkId),
      studentUserId: String(row.studentUserId),
      auditResult: row.auditResult,
      attachmentUrl: null,
    }))
    return ok(studentUserId || input.homeworkId ? result[0] || null : result)
  } catch (error) {
    return dbError(error)
  }
}

async function assignmentStatistics(req) {
  try {
    const input = await readInput(req)
    const rows = await query(
      `SELECT
        a.id AS assignmentId,
        a.title AS assignmentName,
        aq.position,
        AVG(CASE WHEN si.max_score > 0 THEN si.score / si.max_score * 100 ELSE NULL END) AS correctRate
       FROM homework_assignment_question aq
       JOIN homework_assignments a ON a.id = aq.assignment_id AND a.deleted = b'0'
       LEFT JOIN homework_submission s ON s.assignment_id = aq.assignment_id AND s.deleted = b'0'
       LEFT JOIN homework_submission_item si ON si.submission_id = s.id AND si.question_id = aq.question_id AND si.deleted = b'0'
       WHERE aq.deleted = b'0' AND aq.assignment_id = ?
       GROUP BY a.id, a.title, aq.position
       ORDER BY aq.position`,
      [String(input.assignmentId || '')]
    )
    return ok(
      rows.map(row => ({
        assignmentId: String(row.assignmentId),
        assignmentName: row.assignmentName || '',
        correctRate: Math.round(Number(row.correctRate || 0)),
        page: 1,
        questionNumber: Number(row.position || 0),
      }))
    )
  } catch (error) {
    return dbError(error)
  }
}

async function homeworkQuestionStatistics(req) {
  try {
    const input = await readInput(req)
    const assignmentId = String(input.assignmentId || '')
    const [assignment, totalRow, submitRow, rows] = await Promise.all([
      queryOne('SELECT id, title FROM homework_assignments WHERE id = ? AND deleted = b\'0\'', [assignmentId]),
      queryOne(
        `SELECT COALESCE(SUM(c.member_count), 0) AS n
         FROM homework_assignment_class ac
         JOIN homework_classes c ON c.id = ac.class_id AND c.deleted = b'0'
         WHERE ac.assignment_id = ? AND ac.deleted = b'0'`,
        [assignmentId]
      ),
      queryOne('SELECT COUNT(DISTINCT student_id) AS n FROM homework_submission WHERE assignment_id = ? AND deleted = b\'0\'', [
        assignmentId,
      ]),
      query(
        `SELECT
          q.id AS questionId,
          q.type AS questionType,
          aq.position,
          SUM(CASE WHEN si.is_correct = 1 THEN 1 ELSE 0 END) AS correctCount,
          SUM(CASE WHEN si.is_correct = 0 AND COALESCE(si.score, 0) > 0 THEN 1 ELSE 0 END) AS halfCorrectCount,
          SUM(CASE WHEN si.is_correct = 0 AND COALESCE(si.score, 0) <= 0 THEN 1 ELSE 0 END) AS inCorrectCount,
          AVG(CASE WHEN si.max_score > 0 THEN si.score / si.max_score * 100 ELSE NULL END) AS correctRate
         FROM homework_assignment_question aq
         JOIN homework_questions q ON q.id = aq.question_id AND q.deleted = b'0'
         LEFT JOIN homework_submission s ON s.assignment_id = aq.assignment_id AND s.deleted = b'0'
         LEFT JOIN homework_submission_item si ON si.submission_id = s.id AND si.question_id = q.id AND si.deleted = b'0'
         WHERE aq.deleted = b'0' AND aq.assignment_id = ?
         GROUP BY q.id, q.type, aq.position
         ORDER BY aq.position`,
        [assignmentId]
      ),
    ])
    return ok({
      assignmentId,
      assignmentName: assignment?.title || '',
      averageCorrectRate: Math.round(
        rows.length ? rows.reduce((sum, row) => sum + Number(row.correctRate || 0), 0) / rows.length : 0
      ),
      submitCount: Number(submitRow?.n || 0),
      totalCount: Number(totalRow?.n || 0),
      questionStatisticsList: rows.map(row => ({
        answerContent: '',
        correctCount: Number(row.correctCount || 0),
        correctRate: Math.round(Number(row.correctRate || 0)),
        halfCorrectCount: Number(row.halfCorrectCount || 0),
        inCorrectCount: Number(row.inCorrectCount || 0),
        pageNumber: '1',
        questionId: String(row.questionId),
        questionOrder: String(row.position || ''),
        questionType: row.questionType || '',
      })),
    })
  } catch (error) {
    return dbError(error)
  }
}

async function homeworkStudentStatistics(req) {
  try {
    const input = await readInput(req)
    const assignmentId = String(input.assignmentId || '')
    const questionRows = await query(
      `SELECT q.id AS questionId, aq.position
       FROM homework_assignment_question aq
       JOIN homework_questions q ON q.id = aq.question_id AND q.deleted = b'0'
       WHERE aq.deleted = b'0' AND aq.assignment_id = ?
       ORDER BY aq.position`,
      [assignmentId]
    )
    const rows = await query(
      `SELECT
        s.student_id AS studentId,
        u.nickname AS studentName,
        q.id AS questionId,
        aq.position,
        si.is_correct AS isCorrect,
        si.score,
        si.max_score
       FROM homework_submission s
       LEFT JOIN system_users u ON u.id = s.student_id AND u.deleted = 0
       JOIN homework_assignment_question aq ON aq.assignment_id = s.assignment_id AND aq.deleted = b'0'
       JOIN homework_questions q ON q.id = aq.question_id AND q.deleted = b'0'
       LEFT JOIN homework_submission_item si ON si.submission_id = s.id AND si.question_id = q.id AND si.deleted = b'0'
       WHERE s.deleted = b'0' AND s.assignment_id = ?
       ORDER BY s.student_id, aq.position`,
      [assignmentId]
    )
    const students = new Map()
    for (const row of rows) {
      const id = String(row.studentId)
      if (!students.has(id)) {
        students.set(id, {
          studentId: id,
          studentName: row.studentName || id,
          correctCount: 0,
          halfCorrectCount: 0,
          incorrectCount: 0,
          questionResults: [],
        })
      }
      const status = row.isCorrect ? 'Correct' : Number(row.score || 0) > 0 ? 'CorrectAndIncorrect' : 'Incorrect'
      const item = students.get(id)
      if (status === 'Correct') item.correctCount += 1
      else if (status === 'CorrectAndIncorrect') item.halfCorrectCount += 1
      else item.incorrectCount += 1
      item.questionResults.push({ questionOrder: String(row.position || ''), gradeResult: status })
    }
    const studentRows = [...students.values()].map(item => ({
      ...item,
      overallCorrectRate: Math.round((item.correctCount / Math.max(questionRows.length, 1)) * 100),
    }))
    return ok({
      assignmentId,
      assignmentName: '',
      averageCorrectRate: Math.round(
        studentRows.length
          ? studentRows.reduce((sum, row) => sum + Number(row.overallCorrectRate || 0), 0) / studentRows.length
          : 0
      ),
      questionList: questionRows.map(row => ({
        pageNumber: '1',
        questionId: String(row.questionId),
        questionOrder: String(row.position || ''),
      })),
      studentRows,
      submitCount: studentRows.length,
      submitRate: studentRows.length ? 100 : 0,
      totalCount: studentRows.length,
    })
  } catch (error) {
    return dbError(error)
  }
}

async function homeworkStudentList(req) {
  try {
    const input = await readInput(req)
    const assignmentId = String(input.assignmentId || '')
    const classId = String(input.classId || '')
    const submitted = await query(
      `SELECT DISTINCT
        u.id AS studentId,
        u.id AS userId,
        COALESCE(u.nickname, u.username) AS studentName,
        u.username AS studentCode,
        c.id AS classId,
        c.grade AS gradeId
       FROM homework_submission s
       JOIN system_users u ON u.id = s.student_id AND u.deleted = 0
       LEFT JOIN homework_assignment_class ac ON ac.assignment_id = s.assignment_id AND ac.deleted = b'0'
       LEFT JOIN homework_classes c ON c.id = ac.class_id AND c.deleted = b'0'
       WHERE s.deleted = b'0' AND s.assignment_id = ? AND (? = '' OR c.id = ?)`,
      [assignmentId, classId, classId]
    )
    return ok({
      submitted: submitted.map(mapStudent),
      unsubmitted: [],
    })
  } catch (error) {
    return dbError(error)
  }
}

async function manualGradingList(req) {
  try {
    const input = await readInput(req)
    const assignmentId = String(input.assignmentId || '')
    const rows = await query(
      `SELECT
        s.id AS homeworkId,
        s.student_id AS studentUserId,
        u.nickname AS studentName,
        u.username AS studentCode,
        si.id AS homeworkDetailId,
        si.answer_text AS answerContent,
        si.is_correct AS isCorrect
       FROM homework_submission_item si
       JOIN homework_submission s ON s.id = si.submission_id AND s.deleted = b'0'
       LEFT JOIN system_users u ON u.id = s.student_id AND u.deleted = 0
       WHERE si.deleted = b'0' AND s.assignment_id = ? AND si.is_correct = 0
       ORDER BY s.student_id, si.id`,
      [assignmentId]
    )
    const map = new Map()
    for (const row of rows) {
      const id = String(row.studentUserId)
      if (!map.has(id)) {
        map.set(id, {
          homeworkId: String(row.homeworkId),
          studentUserId: id,
          studentName: row.studentName || id,
          studentCode: row.studentCode || id,
          homeworkList: [],
        })
      }
      map.get(id).homeworkList.push({
        homeworkDetailId: String(row.homeworkDetailId),
        answerContent: row.answerContent || '',
        answerAttachment: '',
        answerAreas: '[]',
        gradingResult: row.isCorrect ? 'Correct' : 'Incorrect',
        gradingResultStr: '[]',
      })
    }
    return ok({ assignmentId, classId: String(input.classId || ''), questions: [...map.values()] })
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

function mapQuestion(row) {
  return {
    id: row.id,
    questionId: String(row.questionId || row.id),
    questionContent: row.questionContent || row.content || row.title || '',
    questionsAttachment: '',
    answerAttachment: '',
    analysisAttachment: '',
    correctAnswer: row.correctAnswer || '',
    answerAnalysis: row.answerAnalysis || '',
    questionType: row.questionType || row.type || '',
    questionTypeTagName: row.questionType || row.type || '',
    difficulty: row.difficulty || '',
    difficultyTagName: row.difficulty || '',
    subjectId: row.subjectId || row.subject || '',
    subjectName: row.subjectName || row.subject || '',
    gradeId: row.gradeId || row.grade || '',
    gradeName: row.gradeName || row.grade || '',
    stageId: row.stageId || '',
    status: row.status == null ? 1 : Number(row.status),
    createTime: toDateTime(row.createTime || row.create_time),
    creator: row.creator || '',
    creatorName: row.creatorName || row.creator || '',
    defaultScore: { score: Number(row.score || 0) },
    coordinates: { data: [] },
    knowledgePoints: [],
    chapters: [],
    answers: row.correctAnswer ? [{ answer: row.correctAnswer }] : [],
    answered: row.correctAnswer ? 1 : 0,
    wrongAnswerCount: String(row.wrongAnswerCount || 0),
    wrongAnswerTime: '',
    layoutFormat: '',
  }
}

async function questionPage(req) {
  try {
    const body = await readBody(req)
    const { pageNo, pageSize, offset } = pageInput(body)
    const clauses = ["deleted = b'0'"]
    const values = []
    pushEquals(clauses, values, 'grade', body.gradeId)
    pushEquals(clauses, values, 'subject', body.subjectId)
    pushEquals(clauses, values, 'difficulty', body.difficulty)
    pushEquals(clauses, values, 'type', body.questionType)
    const where = clauses.join(' AND ')
    const [totalRow, rows] = await Promise.all([
      queryOne(`SELECT COUNT(*) AS n FROM homework_questions WHERE ${where}`, values),
      query(
        `SELECT
          id,
          id AS questionId,
          title,
          content,
          type AS questionType,
          difficulty,
          subject AS subjectId,
          subject AS subjectName,
          grade AS gradeId,
          grade AS gradeName,
          score,
          status,
          creator,
          create_time AS createTime
         FROM homework_questions
         WHERE ${where}
         ORDER BY id DESC
         LIMIT ?, ?`,
        [...values, offset, pageSize]
      ),
    ])
    return ok({ list: rows.map(mapQuestion), total: Number(totalRow?.n || 0) })
  } catch (error) {
    return dbError(error)
  }
}

async function questionDetail(req) {
  try {
    const path = new URL(req.url || '/', 'http://localhost').pathname.replace(/^\/app(?=\/)/, '')
    const id = decodeURIComponent(path.split('/').pop() || '')
    const row = await queryOne(
      `SELECT
        id,
        id AS questionId,
        title,
        content,
        type AS questionType,
        difficulty,
        subject AS subjectId,
        subject AS subjectName,
        grade AS gradeId,
        grade AS gradeName,
        score,
        status,
        creator,
        create_time AS createTime
       FROM homework_questions
       WHERE deleted = b'0' AND id = ?
       LIMIT 1`,
      [id]
    )
    return row ? ok(mapQuestion(row)) : fail('题目不存在', 404)
  } catch (error) {
    return dbError(error)
  }
}

async function questionBankDetailPage(req) {
  try {
    const body = await readBody(req)
    const { pageNo, pageSize, offset } = pageInput(body)
    const [totalRow, rows] = await Promise.all([
      queryOne("SELECT COUNT(DISTINCT subject, grade) AS n FROM homework_questions WHERE deleted = b'0'"),
      query(
        `SELECT
          MIN(id) AS id,
          CONCAT('local-', subject, '-', grade) AS detailId,
          CONCAT(grade, subject, '题库') AS examTitle,
          subject AS subjectId,
          subject AS subjectName,
          grade AS gradeId,
          grade AS gradeName,
          MIN(create_time) AS createTime,
          COUNT(*) AS questionCount
         FROM homework_questions
         WHERE deleted = b'0'
         GROUP BY subject, grade
         ORDER BY MIN(id) DESC
         LIMIT ?, ?`,
        [offset, pageSize]
      ),
    ])
    const total = Number(totalRow?.n || 0)
    return ok({
      list: rows.map(row => ({
        id: row.id,
        detailId: row.detailId,
        batchId: row.detailId,
        examTitle: row.examTitle,
        gradeId: row.gradeId,
        gradeName: row.gradeName,
        subjectId: row.subjectId,
        subjectName: row.subjectName,
        stageId: '',
        stageName: '',
        termId: '',
        termName: '',
        itemType: 'local',
        itemTypeName: '本地题库',
        typeName: '本地题库',
        auditStatus: 'AUDIT_PASS',
        creatorName: '本地数据',
        createTime: toDateTime(row.createTime),
      })),
      total,
      totalPage: Math.ceil(total / pageSize),
    })
  } catch (error) {
    return dbError(error)
  }
}

async function questionBankDetailByPath(req) {
  try {
    const path = new URL(req.url || '/', 'http://localhost').pathname.replace(/^\/app(?=\/)/, '')
    const detailId = decodeURIComponent(path.split('/').pop() || '')
    const row = await queryOne(
      `SELECT
        MIN(id) AS id,
        CONCAT('local-', subject, '-', grade) AS detailId,
        CONCAT(grade, subject, '题库') AS examTitle,
        subject AS subjectId,
        subject AS subjectName,
        grade AS gradeId,
        grade AS gradeName,
        MIN(create_time) AS createTime
       FROM homework_questions
       WHERE deleted = b'0'
       GROUP BY subject, grade
       HAVING detailId = ?
       LIMIT 1`,
      [detailId]
    )
    if (!row) return fail('试卷详情不存在', 404)
    return ok({
      id: row.id,
      detailId: row.detailId,
      batchId: row.detailId,
      examTitle: row.examTitle,
      gradeId: row.gradeId,
      gradeName: row.gradeName,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      itemType: 'local',
      itemTypeName: '本地题库',
      auditStatus: 'AUDIT_PASS',
      createTime: toDateTime(row.createTime),
    })
  } catch (error) {
    return dbError(error)
  }
}

async function questionBankViewQuestion(req) {
  try {
    const path = new URL(req.url || '/', 'http://localhost').pathname.replace(/^\/app(?=\/)/, '')
    const detailId = decodeURIComponent(path.split('/').pop() || '')
    const rows = await query(
      `SELECT id, id AS questionId
       FROM homework_questions
       WHERE deleted = b'0' AND CONCAT('local-', subject, '-', grade) = ?
       ORDER BY id ASC`,
      [detailId]
    )
    return ok({
      questionList: rows.map(row => ({
        questionId: String(row.questionId),
        questionsUrl: '',
        status: 1,
        tags: [],
      })),
    })
  } catch (error) {
    return dbError(error)
  }
}

async function emptyList() {
  return ok([])
}

function aiGradingMaterialSources() {
  return ok([
    { source: 'scanner_scan', sourceName: '扫描机扫描' },
    { source: 'mobile_photo_upload', sourceName: '移动端拍照上传' },
  ])
}

function notImplemented(message = '该接口尚未接入真实后端，请配置 APP_API_PROXY_TARGET 转发到业务后端。') {
  return fail(message, 501)
}

function draftBoxKey(item = {}) {
  return [
    item.tenantId || process.env.APP_TENANT_ID || '1',
    item.teacherId || item.creator || 'default',
    item.draftBoxType || '',
    item.draftBoxNature || '',
  ].join(':')
}

function groupedDraftItems(items) {
  const groups = new Map()
  for (const item of items) {
    const name = item.questionTypeTagName || item.questionType || '未分类'
    const id = item.questionTypeTagId || item.questionType || name
    if (!groups.has(id)) {
      groups.set(id, { questionTypeTagId: id, questionTypeTagName: name, assignmentId: item.assignmentId, children: [] })
    }
    groups.get(id).children.push(item)
  }
  return [...groups.values()]
}

async function draftBoxCreate(req) {
  const item = await readBody(req)
  const key = draftBoxKey(item)
  const list = draftBoxStore.get(key) || []
  const draftBoxId = item.draftBoxId || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const next = {
    ...item,
    draftBoxId,
    id: item.id || list.length + 1,
    createTime: new Date().toISOString(),
    updateTime: new Date().toISOString(),
    deleted: 0,
  }
  const existingIndex = list.findIndex(row => String(row.questionId || '') === String(next.questionId || ''))
  if (existingIndex >= 0) list[existingIndex] = { ...list[existingIndex], ...next }
  else list.push(next)
  draftBoxStore.set(key, list)
  return ok(draftBoxId)
}

async function draftBoxDelete(req) {
  const body = await readBody(req)
  const draftBoxId = String(body.draftBoxId || '')
  for (const [key, list] of draftBoxStore.entries()) {
    const next = list.filter(item => String(item.draftBoxId || '') !== draftBoxId)
    if (next.length !== list.length) {
      draftBoxStore.set(key, next)
      return ok(draftBoxId)
    }
  }
  return ok(draftBoxId)
}

async function draftBoxList(req) {
  const body = await readBody(req)
  const key = draftBoxKey(body)
  return ok(groupedDraftItems(draftBoxStore.get(key) || []))
}

async function draftBoxDeleteAll(req) {
  const body = await readBody(req)
  draftBoxStore.set(draftBoxKey(body), [])
  return ok(true)
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
  const target = new URL(proxyTarget)
  const basePath = target.pathname.replace(/\/+$/, '')
  const requestPath = String(originalPath || '').replace(/^\/+/, '')
  target.pathname = `${basePath}/${requestPath}`.replace(/\/{2,}/g, '/')
  target.search = originalUrl.search
  const method = String(req.method || 'GET').toUpperCase()
  const headers = { ...req.headers }
  delete headers.host
  delete headers.connection

  let body
  if (method !== 'GET' && method !== 'HEAD') {
    body = req.rawBody && req.rawBody.length ? req.rawBody : JSON.stringify(await readBody(req))
    if (!headers['content-type'] && !headers['Content-Type']) headers['content-type'] = 'application/json'
  }
  if (body == null) {
    delete headers['content-length']
    delete headers['Content-Length']
  }
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
  if (endpoint === 'homework-material-sources' && method === 'GET') {
    if (!requireAuth(req)) return fail('登录已过期', 401)
    return aiGradingMaterialSources()
  }
  if (endpoint === 'scanner-scan-material' && method === 'POST') {
    if (!requireAuth(req)) return fail('登录已过期', 401)
    return notImplemented('扫描机扫描素材接口已保留，尚未接入真实扫描机服务，请配置 APP_API_PROXY_TARGET 转发到业务后端。')
  }
  if (endpoint === 'mobile-photo-upload-material' && method === 'POST') {
    if (!requireAuth(req)) return fail('登录已过期', 401)
    return notImplemented('移动端拍照上传素材接口已保留，尚未接入真实上传服务，请配置 APP_API_PROXY_TARGET 转发到业务后端。')
  }

  if (!hasDatabaseConfig()) return dbUnavailable()
  if (endpoint !== 'public-key' && endpoint !== 'oauth-login' && !requireAuth(req)) return fail('登录已过期', 401)

  if (endpoint === 'permission-info' && method === 'GET') return permissionInfo(req)
  if (endpoint === 'permission-validate' && method === 'POST') return fail('真实权限验证接口尚未接入，请配置 APP_API_PROXY_TARGET 转发到业务后端。', 501)
  if (endpoint === 'permission-sync' && method === 'POST') return fail('真实权限同步接口尚未接入，请配置 APP_API_PROXY_TARGET 转发到业务后端。', 501)
  if (endpoint === 'teacher-info' && method === 'GET') return teacherInfo(req)
  if (endpoint === 'teacher-page' && method === 'POST') return teacherPage(req)
  if (endpoint === 'teacher-detail' && method === 'POST') return teacherDetail(req)
  if (endpoint === 'class-page' && method === 'POST') return classPage(req)
  if (endpoint === 'class-list' && method === 'POST') return classList(req)
  if (endpoint === 'student-page' && method === 'POST') return studentPage(req)
  if (endpoint === 'student-list' && method === 'POST') return studentList(req)
  if (endpoint === 'student-info' && method === 'POST') {
    const body = await readBody(req)
    const rows = await studentList({ ...req, body })
    if (rows.code !== 0) return rows
    return ok((rows.data || []).find(item => String(item.studentId) === String(body.studentId)) || null)
  }
  if (endpoint === 'class-students' && method === 'POST') return studentsByClassId(req)
  if (endpoint === 'class-teachers' && method === 'POST') return teachersByClassId(req)
  if (endpoint === 'teacher-overview' && method === 'GET') return teacherOverview(req)
  if (endpoint === 'student-overview' && method === 'GET') return studentOverview(req)
  if (endpoint === 'question-statistics' && method === 'GET') return questionStatistics(req)
  if (endpoint === 'recent-homework' && method === 'GET') return recentHomework(req)
  if (endpoint === 'recent-assignments' && method === 'GET') return recentAssignments(req)
  if (endpoint === 'assignment-page' && method === 'POST') return assignmentPage(req)
  if (endpoint === 'homework-list' && method === 'POST') return homeworkList(req)
  if (endpoint === 'class-homework-detail' && method === 'GET') return classHomeworkDetail(req)
  if (endpoint === 'original-detail' && method === 'POST') return originalDetail(req)
  if (endpoint === 'homework-statistics' && method === 'GET') return assignmentStatistics(req)
  if (endpoint === 'homework-question-statistics' && method === 'GET') return homeworkQuestionStatistics(req)
  if (endpoint === 'homework-student-statistics' && method === 'GET') return homeworkStudentStatistics(req)
  if (endpoint === 'homework-student-list' && method === 'POST') return homeworkStudentList(req)
  if (endpoint === 'manual-grading-list' && method === 'GET') return manualGradingList(req)
  if (endpoint === 'composition-page' && method === 'POST') return compositionPage(req)
  if (endpoint === 'question-page' && method === 'POST') return questionPage(req)
  if (endpoint === 'question-detail' && method === 'GET') return questionDetail(req)
  if (endpoint === 'question-bank-detail-page' && method === 'POST') return questionBankDetailPage(req)
  if (endpoint === 'question-bank-detail' && method === 'GET') return questionBankDetailByPath(req)
  if (endpoint === 'question-bank-view-question' && method === 'GET') return questionBankViewQuestion(req)
  if (endpoint === 'question-bank-view-attach' && method === 'GET') return ok('')
  if (endpoint === 'tag-list' && method === 'POST') return emptyList()
  if (endpoint === 'knowledge-tree' && method === 'POST') return emptyList()
  if (endpoint === 'chapter-list' && method === 'POST') return emptyList()
  if (endpoint === 'draft-box-create' && method === 'POST') return draftBoxCreate(req)
  if (endpoint === 'draft-box-delete' && method === 'POST') return draftBoxDelete(req)
  if (endpoint === 'draft-box-delete-all' && method === 'POST') return draftBoxDeleteAll(req)
  if (endpoint === 'draft-box-list' && method === 'POST') return draftBoxList(req)
  if (endpoint === 'mistake-student-statistics' && method === 'GET') return mistakeStudentStatistics(req)
  if (endpoint === 'mistake-detail' && method === 'GET') return mistakeDetail(req)
  if (endpoint === 'grouping-strategy-page' && method === 'POST') return groupingStrategyPage(req)
  if (
    [
      'assignment-create',
      'assignment-copy',
      'assignment-delete',
      'assignment-download',
      'assignment-splice',
      'assignment-finalized',
      'assignment-to-finalized',
      'assignment-batch-download',
      'assignment-qrcode-list',
      'class-create',
      'class-update',
      'class-delete',
      'student-create',
      'student-update',
      'student-delete',
      'student-import',
      'student-import-template',
      'student-remove-class',
      'teacher-create',
      'teacher-update',
      'teacher-delete',
      'teacher-import',
      'teacher-import-template',
      'teacher-clear-class',
      'question-delete',
      'question-edit',
      'question-ai-answer',
      'question-bank-import',
      'question-bank-update-title',
      'question-bank-delete',
      'file-upload',
      'multipart-init',
      'multipart-upload-part',
      'multipart-complete',
      'multipart-abort',
      'multipart-progress',
      'manual-grading',
      'correct-grading-result',
      'student-homework-associate',
      'teacher-explanation-create',
      'teacher-explanation-page',
      'rules-get',
      'rules-update',
      'system-user-update-status',
      'system-user-random-username',
      'system-user-reset-password',
      'class-report-get',
      'class-report-generate-comment',
      'student-report-list',
      'student-report-get',
      'student-report-generate-comment',
      'grouping-strategy-create',
      'grouping-strategy-update',
      'student-group-update',
    ].includes(endpoint)
  ) {
    return notImplemented()
  }

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

  if (/^\/api\/v1\/question\/(?!page$|delete$|edit$|genAiAnswer$)[^/]+$/.test(originalPath)) {
    return executeApi(req, 'question-detail')
  }
  if (/^\/api\/v1\/question-bank-detail\/detail\/[^/]+$/.test(originalPath)) {
    return executeApi(req, 'question-bank-detail')
  }
  if (/^\/api\/v1\/question-bank-detail\/view-question\/[^/]+$/.test(originalPath)) {
    return executeApi(req, 'question-bank-view-question')
  }
  if (/^\/api\/v1\/question-bank-detail\/view-attach\/[^/]+$/.test(originalPath)) {
    return executeApi(req, 'question-bank-view-attach')
  }
  if (/^\/api\/v1\/question-bank-detail\/delete\/[^/]+$/.test(originalPath)) {
    return executeApi(req, 'question-bank-delete')
  }

  const endpointMap = {
    '/oauth/public-key': 'public-key',
    '/api/oauth/public-key': 'public-key',
    '/api/v1/oauth/public-key': 'public-key',
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
    '/api/v1/teacher/delete': 'teacher-delete',
    '/api/v1/teacher/import-template': 'teacher-import-template',
    '/api/v1/teacher/import': 'teacher-import',
    '/api/v1/teacher/teacher': 'teacher-detail',
    '/api/v1/teacher/create': 'teacher-create',
    '/api/v1/teacher/edit': 'teacher-update',
    '/api/v1/teacher/clearSubjectAndClass': 'teacher-clear-class',
    '/api/v1/teacher/overview': 'teacher-overview',
    '/api/v1/student/page': 'student-page',
    '/api/v1/student/list': 'student-list',
    '/api/v1/student/student': 'student-info',
    '/api/v1/student/create': 'student-create',
    '/api/v1/student/update': 'student-update',
    '/api/v1/student/delete': 'student-delete',
    '/api/v1/student/import-template': 'student-import-template',
    '/api/v1/student/import': 'student-import',
    '/api/v1/student/removeClassId': 'student-remove-class',
    '/api/v1/student/overview': 'student-overview',
    '/api/v1/class/page': 'class-page',
    '/api/v1/class/list': 'class-list',
    '/api/v1/class/create': 'class-create',
    '/api/v1/class/update': 'class-update',
    '/api/v1/class/deleteByClassId': 'class-delete',
    '/api/v1/class/studentsByClassId': 'class-students',
    '/api/v1/class/teachersByClassId': 'class-teachers',
    '/api/v1/question/statistics': 'question-statistics',
    '/api/v1/question/page': 'question-page',
    '/api/v1/question/delete': 'question-delete',
    '/api/v1/question/edit': 'question-edit',
    '/api/v1/question/genAiAnswer': 'question-ai-answer',
    '/api/v1/student/homework/recent-list': 'recent-homework',
    '/api/v1/student/homework/list': 'homework-list',
    '/api/v1/student/homework/class-homework-detail': 'class-homework-detail',
    '/api/v1/student/homework/original-detail': 'original-detail',
    '/api/v1/student/homework/statistics': 'homework-statistics',
    '/api/v1/student/homework/question-statistics': 'homework-question-statistics',
    '/api/v1/student/homework/student-statistics': 'homework-student-statistics',
    '/api/v1/student/homework/student-list': 'homework-student-list',
    '/api/v1/student/homework/manual-grading-list': 'manual-grading-list',
    '/api/v1/student/homework/manual-grading': 'manual-grading',
    '/api/v1/student/homework/correct-grading-result': 'correct-grading-result',
    '/api/v1/student/homework/associate': 'student-homework-associate',
    '/api/v1/student/homework/material-sources': 'homework-material-sources',
    '/api/v1/student/homework/material/scanner-scan': 'scanner-scan-material',
    '/api/v1/student/homework/material/mobile-photo/upload': 'mobile-photo-upload-material',
    '/api/v1/assignment/recent-list': 'recent-assignments',
    '/api/v1/assignment/page': 'assignment-page',
    '/api/v1/assignment/create': 'assignment-create',
    '/api/v1/assignment/copy': 'assignment-copy',
    '/api/v1/assignment/delete': 'assignment-delete',
    '/api/v1/assignment/download': 'assignment-download',
    '/api/v1/assignment/splice': 'assignment-splice',
    '/api/v1/assignment/finalized': 'assignment-finalized',
    '/api/v1/assignment/to-finalized': 'assignment-to-finalized',
    '/api/v1/assignment/batch-download': 'assignment-batch-download',
    '/api/v1/assignment-qrcode/list': 'assignment-qrcode-list',
    '/api/v1/composition/page': 'composition-page',
    '/api/v1/question-bank-detail/page': 'question-bank-detail-page',
    '/api/v1/question-bank-detail/update-title': 'question-bank-update-title',
    '/api/v1/question-bank-batch/import': 'question-bank-import',
    '/api/v1/tag/list': 'tag-list',
    '/api/v1/knowledge-point/tree': 'knowledge-tree',
    '/api/v1/chapter/list': 'chapter-list',
    '/api/v1/draft-box/create': 'draft-box-create',
    '/api/v1/draft-box/delete': 'draft-box-delete',
    '/api/v1/draft-box/delete-all': 'draft-box-delete-all',
    '/api/v1/draft-box/list': 'draft-box-list',
    '/api/v1/file/upload': 'file-upload',
    '/api/v1/file/multipart/init': 'multipart-init',
    '/api/v1/file/multipart/upload-part': 'multipart-upload-part',
    '/api/v1/file/multipart/complete': 'multipart-complete',
    '/api/v1/file/multipart/abort': 'multipart-abort',
    '/api/v1/file/multipart/progress': 'multipart-progress',
    '/api/v1/teacher-explanation/create': 'teacher-explanation-create',
    '/api/v1/teacher-explanation/page': 'teacher-explanation-page',
    '/api/v1/rules/getrules': 'rules-get',
    '/api/v1/rules/update-rules': 'rules-update',
    '/api/v1/system-user/update-status': 'system-user-update-status',
    '/api/v1/system-user/random-username': 'system-user-random-username',
    '/api/v1/system-user/reset-password': 'system-user-reset-password',
    '/api/v1/class-report/get': 'class-report-get',
    '/api/v1/class-report/generate-comment': 'class-report-generate-comment',
    '/api/v1/student-report/student-list': 'student-report-list',
    '/api/v1/student-report/get': 'student-report-get',
    '/api/v1/student-report/generate-comment': 'student-report-generate-comment',
    '/api/v1/mistakes/student-statistics': 'mistake-student-statistics',
    '/api/v1/mistakes/detail': 'mistake-detail',
    '/api/v1/grouping-strategy/page': 'grouping-strategy-page',
    '/api/v1/grouping-strategy/create': 'grouping-strategy-create',
    '/api/v1/grouping-strategy/update': 'grouping-strategy-update',
    '/api/v1/student-group/update': 'student-group-update',
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
