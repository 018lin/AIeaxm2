import { executeByPath, sendJson } from '../../_app-api.js'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {})
  try {
    const payload = await executeByPath(req)
    sendJson(res, 200, payload)
  } catch (error) {
    console.error('[api/question-bank-batch/import] request failed:', error)
    sendJson(res, 200, {
      code: 500,
      data: null,
      msg: error?.message || '服务异常',
      message: error?.message || '服务异常',
    })
  }
}
