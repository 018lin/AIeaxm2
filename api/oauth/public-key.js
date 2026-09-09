import { createMockResponse, sendJson } from '../_mock-api.js'

export default function handler(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {})
  sendJson(res, 200, createMockResponse('/oauth/public-key', req.method))
}
