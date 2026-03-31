import type { AttachmentVO } from '@/api/questionBank/type'
import { multipartAbort, multipartComplete, multipartInit, multipartProgress, multipartUploadPart } from '@/api/file'

export type MultipartUploadOptions = {
  threshold?: number
  partSize?: number
  concurrency?: number
  maxRetries?: number
  onProgress?: (p: { percent: number; loaded: number; total: number }) => void
}

type UploadSessionCache = {
  uploadId: string
  fileName: string
  fileSize: number
  lastModified: number
  partSize: number
  updatedAt: number
}

const DEFAULT_THRESHOLD = 10 * 1024 * 1024
const DEFAULT_PART_SIZE = 5 * 1024 * 1024
const DEFAULT_CONCURRENCY = 3
const DEFAULT_MAX_RETRIES = 3

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

const sha256Hex = async (text: string) => {
  const enc = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', enc)
  const bytes = Array.from(new Uint8Array(digest))
  return bytes.map(b => b.toString(16).padStart(2, '0')).join('')
}

const fileKeyOf = async (file: File) => sha256Hex([file.name, file.size, file.lastModified, file.type].join('|'))

const cacheKeyOf = (fileKey: string) => `mpu:${fileKey}`

const loadSession = (fileKey: string): UploadSessionCache | null => {
  try {
    const raw = localStorage.getItem(cacheKeyOf(fileKey))
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== 'object') return null
    if (!obj.uploadId) return null
    return obj as UploadSessionCache
  } catch {
    return null
  }
}

const saveSession = (fileKey: string, s: UploadSessionCache) => {
  try {
    localStorage.setItem(cacheKeyOf(fileKey), JSON.stringify(s))
  } catch {
    // ignore
  }
}

const clearSession = (fileKey: string) => {
  try {
    localStorage.removeItem(cacheKeyOf(fileKey))
  } catch {
    // ignore
  }
}

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onerror = () => reject(r.error)
    r.onload = () => {
      const res = String(r.result || '')
      const idx = res.indexOf(',')
      resolve(idx >= 0 ? res.slice(idx + 1) : res)
    }
    r.readAsDataURL(blob)
  })

const parseUploadedParts = (res: any): Set<number> => {
  const out = new Set<number>()
  const addNum = (n: any) => {
    const x = Number(n)
    if (Number.isFinite(x) && x > 0) out.add(Math.trunc(x))
  }

  if (Array.isArray(res)) {
    res.forEach(addNum)
    return out
  }

  const nums =
    res?.uploadedParts ||
    res?.uploadedPartNumbers ||
    res?.partNumbers ||
    res?.parts ||
    res?.uploaded ||
    res?.data?.uploadedParts ||
    res?.data?.parts

  if (Array.isArray(nums)) {
    nums.forEach((it: any) => {
      if (typeof it === 'number' || typeof it === 'string') addNum(it)
      else addNum(it?.partNumber)
    })
  }

  return out
}

const createQueue = (concurrency: number) => {
  let running = 0
  const q: Array<() => Promise<void>> = []

  const runNext = () => {
    if (running >= concurrency) return
    const job = q.shift()
    if (!job) return
    running++
    job()
      .catch(() => {})
      .finally(() => {
        running--
        runNext()
      })
  }

  return {
    push(job: () => Promise<void>) {
      q.push(job)
      runNext()
    },
    async drain() {
      while (running > 0 || q.length > 0) {
        await sleep(30)
      }
    },
  }
}

export type MultipartUploadResult = {
  uploadId: string
  attachment?: AttachmentVO | any
}

export async function uploadFileResumable(file: File, opts: MultipartUploadOptions = {}): Promise<MultipartUploadResult> {
  const threshold = opts.threshold ?? DEFAULT_THRESHOLD
  const partSize = opts.partSize ?? DEFAULT_PART_SIZE
  const concurrency = Math.max(1, Math.trunc(opts.concurrency ?? DEFAULT_CONCURRENCY))
  const maxRetries = Math.max(0, Math.trunc(opts.maxRetries ?? DEFAULT_MAX_RETRIES))

  if (!(file instanceof File)) throw new Error('Invalid file')

  const fileKey = await fileKeyOf(file)
  const cached = loadSession(fileKey)

  const ensureSession = async () => {
    if (cached && cached.fileName === file.name && cached.fileSize === file.size && cached.lastModified === file.lastModified) {
      return cached.uploadId
    }
    const initRes: any = await multipartInit({ fileName: file.name, fileSize: file.size, contentType: file.type })
    const uploadId = String(initRes?.uploadId || initRes?.data?.uploadId || '')
    if (!uploadId) throw new Error('Upload init failed: missing uploadId')
    saveSession(fileKey, {
      uploadId,
      fileName: file.name,
      fileSize: file.size,
      lastModified: file.lastModified,
      partSize,
      updatedAt: Date.now(),
    })
    return uploadId
  }

  const uploadId = await ensureSession()

  if (file.size <= threshold) {
    const base64 = await blobToBase64(file)
    await multipartUploadPart({ uploadId, partNumber: 1, content: base64, fileName: file.name })
    const attachment = await multipartComplete({ uploadId })
    clearSession(fileKey)
    return { uploadId, attachment }
  }

  let uploaded = new Set<number>()
  try {
    const prog = await multipartProgress({ uploadId })
    uploaded = parseUploadedParts(prog)
  } catch {
    uploaded = new Set<number>()
  }

  const totalParts = Math.max(1, Math.ceil(file.size / partSize))

  let loadedApprox = Math.min(uploaded.size * partSize, file.size)
  opts.onProgress?.({ percent: file.size ? Math.round((loadedApprox / file.size) * 100) : 0, loaded: loadedApprox, total: file.size })

  const queue = createQueue(concurrency)

  const uploadOne = async (partNumber: number) => {
    const start = (partNumber - 1) * partSize
    const end = Math.min(file.size, start + partSize)
    const chunk = file.slice(start, end)

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const content = await blobToBase64(chunk)
        await multipartUploadPart({ uploadId, partNumber, content, fileName: file.name })
        return
      } catch (e) {
        if (attempt >= maxRetries) throw e
        await sleep(300 * Math.pow(2, attempt))
      }
    }
  }

  for (let i = 1; i <= totalParts; i++) {
    if (uploaded.has(i)) continue
    queue.push(async () => {
      await uploadOne(i)
      uploaded.add(i)
      loadedApprox = Math.min(uploaded.size * partSize, file.size)
      opts.onProgress?.({
        percent: file.size ? Math.round((loadedApprox / file.size) * 100) : 0,
        loaded: loadedApprox,
        total: file.size,
      })
      saveSession(fileKey, {
        uploadId,
        fileName: file.name,
        fileSize: file.size,
        lastModified: file.lastModified,
        partSize,
        updatedAt: Date.now(),
      })
    })
  }

  await queue.drain()

  const attachment = await multipartComplete({ uploadId })
  clearSession(fileKey)
  opts.onProgress?.({ percent: 100, loaded: file.size, total: file.size })
  return { uploadId, attachment }
}

export async function abortResumableUpload(file: File) {
  const fileKey = await fileKeyOf(file)
  const cached = loadSession(fileKey)
  if (!cached?.uploadId) return
  try {
    await multipartAbort({ uploadId: cached.uploadId })
  } finally {
    clearSession(fileKey)
  }
}

