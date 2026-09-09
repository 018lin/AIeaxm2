import { createServer } from 'node:http'
import { executeByPath, sendJson } from '../api/_app-api.js'

const port = Number(process.env.APP_API_PORT || process.env.PORT || 48080)

const server = createServer((req, res) => {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {})

  if (!req.url) return sendJson(res, 404, { code: 404, msg: 'Not found' })

  const chunks = []
  req.on('data', chunk => {
    chunks.push(chunk)
  })
  req.on('end', async () => {
    const rawBody = Buffer.concat(chunks)
    req.rawBody = rawBody
    try {
      const contentType = String(req.headers['content-type'] || '')
      req.body = rawBody.length && contentType.includes('application/json') ? JSON.parse(rawBody.toString('utf8')) : {}
    } catch {
      req.body = {}
    }
    try {
      const payload = await executeByPath(req)
      sendJson(res, 200, payload)
    } catch (error) {
      console.error('[backend] request failed:', error)
      sendJson(res, 200, {
        code: 500,
        data: null,
        msg: error?.message || '服务异常',
        message: error?.message || '服务异常',
      })
    }
  })
})

server.listen(port, () => {
  console.log(`Backend API ready at http://localhost:${port}/app`)
})

server.on('error', error => {
  if (error?.code === 'EADDRINUSE') {
    console.error(`Backend API port ${port} is already in use. Set APP_API_PORT to another port or stop the existing process.`)
    process.exit(1)
  }
  console.error('[backend] failed to start:', error)
  process.exit(1)
})
