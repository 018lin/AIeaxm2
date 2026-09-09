import { executeByPath, sendJson } from './_app-api.js'

// 单个 catch-all Serverless Function 处理全部 /api/* 请求
// （Vercel Hobby 计划最多 12 个函数，因此合并为 1 个）
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {})
  const payload = await executeByPath(req)
  sendJson(res, 200, payload)
}
