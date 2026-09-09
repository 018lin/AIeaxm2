import { createServer } from 'node:http'
import { createMockResponse, sendJson } from '../api/_mock-api.js'

const port = Number(process.env.PORT || 48080)

const server = createServer((req, res) => {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {})

  if (!req.url) return sendJson(res, 404, { code: 404, msg: 'Not found' })

  let body = ''
  req.on('data', chunk => {
    body += chunk
  })
  req.on('end', () => {
    const payload = createMockResponse(req.url, req.method || 'GET')
    sendJson(res, 200, payload)
  })
})

server.listen(port, () => {
  console.log(`Mock backend ready at http://localhost:${port}/app`)
})
