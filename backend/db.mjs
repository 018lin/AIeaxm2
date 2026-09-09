import mysql from 'mysql2/promise'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

let pool

function loadEnvFile(file) {
  const path = join(process.cwd(), file)
  if (!existsSync(path)) return

  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    const raw = trimmed.slice(eq + 1).trim()
    if (process.env[key] != null) continue
    process.env[key] = raw.replace(/^['"]|['"]$/g, '')
  }
}

loadEnvFile('.env')
loadEnvFile('.env.local')
loadEnvFile('.env.development')
loadEnvFile('.env.development.local')

function readDbConfig() {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL
  if (url) return { uri: url }

  const host = process.env.DB_HOST || process.env.MYSQL_HOST
  const database = process.env.DB_NAME || process.env.DB_DATABASE || process.env.MYSQL_DATABASE
  const user = process.env.DB_USER || process.env.MYSQL_USER

  if (!host || !database || !user) return null

  return {
    host,
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
    user,
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    namedPlaceholders: true,
    timezone: '+08:00',
  }
}

export function hasDatabaseConfig() {
  return Boolean(readDbConfig())
}

export function getPool() {
  const config = readDbConfig()
  if (!config) {
    throw new Error('未配置真实数据库，请设置 DATABASE_URL 或 DB_HOST/DB_NAME/DB_USER/DB_PASSWORD')
  }

  if (!pool) {
    pool = mysql.createPool(config)
  }

  return pool
}

export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params)
  return rows
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return Array.isArray(rows) ? rows[0] || null : null
}
