import { createServer } from 'node:http'
import { executeByPath, sendJson } from '../api/_app-api.js'

const port = Number(process.env.PORT || 48080)

const server = createServer((req, res) => {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {})

  if (!req.url) return sendJson(res, 404, { code: 404, msg: 'Not found' })

  let body = ''
  req.on('data', chunk => {
    body += chunk
  })
  req.on('end', () => {
    try {
      req.body = body ? JSON.parse(body) : {}
    } catch {
      req.body = {}
    }
    executeByPath(req).then(payload => sendJson(res, 200, payload))
  })
})

server.listen(port, () => {
  console.log(`Backend API ready at http://localhost:${port}/app`)
})
