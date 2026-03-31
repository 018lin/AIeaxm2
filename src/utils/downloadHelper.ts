import { getOriginalDetail } from '@/api/homework/index'
import type { AnswerAreaCalculate, AuditResultPoint, OriginalDetailVO, ParsedAuditResult } from '@/api/homework/type'

/**
 * 通过 URL 下载文件（创建临时 <a> 标签触发浏览器下载）
 */
export function downloadByUrl(url: string, fileName: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function downloadCanvasesAsPdf(
  canvases: HTMLCanvasElement[],
  fileName: string,
  opts?: { dpi?: number; jpegQuality?: number }
) {
  if (!Array.isArray(canvases) || canvases.length === 0) return
  const pdfBlob = canvasesToPdfBlob(canvases, opts)
  downloadBlob(pdfBlob, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`)
}

// ─── 原卷留痕：渲染 + 导出 PDF ───────────────────────────────

/**
 * 拉取所有 homeworkId 对应的原卷详情，逐页绘制留痕 canvas，合并为 PDF 并下载。
 */
export async function downloadOriginalWorkAsPdf(homeworkIds: string[], fileName: string) {
  if (!homeworkIds.length) return

  const canvases: HTMLCanvasElement[] = []

  for (const hid of homeworkIds) {
    try {
      const res = await getOriginalDetail({ homeworkId: hid })
      const detail = Array.isArray(res) ? res[0] : res
      if (!detail) continue
      const canvas = await renderOriginalToCanvas(detail)
      if (canvas) canvases.push(canvas)
    } catch {
      // 单页失败不阻塞其余页
    }
  }

  if (!canvases.length) return

  // 生成 A4 纸张尺寸 PDF（单位：点，1pt = 1/72 英寸）
  const a4 = { w: 595.28, h: 841.89 }
  const pdfBlob = canvasesToPdfBlob(canvases, { pageSize: a4 })
  downloadBlob(pdfBlob, fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`)
}

// ─── 渲染原卷留痕到离屏 Canvas ─────────────────────────────

async function renderOriginalToCanvas(detail: OriginalDetailVO): Promise<HTMLCanvasElement | null> {
  if (!detail.attachmentUrl) return null

  const img = await loadImage(detail.attachmentUrl)
  if (!img) return null

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const parsed = parseAuditResult(detail.auditResult)
  const areas = collectAnswerAreasWithStatus(parsed)
  const cw = canvas.width
  const ch = canvas.height

  for (const { area, status, bigW, bigH } of areas) {
    const center = areaCenterInApi(area)
    if (!center) continue
    const { x: cx, y: cy } = apiToCanvas(center.x, center.y, bigW, bigH, cw, ch)
    const markSize = Math.max(14, Math.min(90, cw * 0.04))
    const drawX = cx + markSize * 1.1
    const drawY = cy + markSize * 0.5

    if (status === 'Correct') {
      drawHandCheck(ctx, drawX, drawY, markSize)
    } else if (status === 'Incorrect') {
      drawHandCross(ctx, drawX, drawY, markSize)
    } else if (status === 'CorrectAndIncorrect') {
      drawHandHalfCheck(ctx, drawX, drawY, markSize)
    }
  }

  return canvas
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// ─── auditResult 解析 & 坐标计算（与 OriginalWorkPaper 逻辑一致）──

function parseAuditResult(raw: OriginalDetailVO['auditResult']): ParsedAuditResult | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (typeof raw === 'object') return raw as ParsedAuditResult
  return null
}

function collectAnswerAreasWithStatus(parsed: ParsedAuditResult | null) {
  const out: {
    area: AnswerAreaCalculate
    status: 'Correct' | 'Incorrect' | 'CorrectAndIncorrect'
    bigW: number
    bigH: number
  }[] = []
  const pages = parsed?.correctionResult?.pages || parsed?.pages
  if (!pages || !Array.isArray(pages)) return out
  const fallbackW = pages[0]?.bigImgWidth ?? 1654
  const fallbackH = pages[0]?.bigImgHeight ?? 2335
  for (const page of pages) {
    const bigW = page.bigImgWidth ?? fallbackW
    const bigH = page.bigImgHeight ?? fallbackH
    const level1List = (page as any).questionsLevel1 || (page as any).questionLevels
    if (!level1List || !Array.isArray(level1List)) continue
    for (const q1 of level1List) {
      const level2List = (q1 as any).questionsLevel2 || (q1 as any).secondQuestionLevels
      if (!level2List || !Array.isArray(level2List)) continue
      for (const q2 of level2List) {
        const gradingResult = (q2 as any).grading_result || (q2 as any).gradingResult
        const areas = (q2 as any).answerAreasCalculate
        if (!Array.isArray(gradingResult) || !Array.isArray(areas)) continue
        if (gradingResult.length !== areas.length) continue
        for (let i = 0; i < areas.length; i++) {
          const status = gradingResult[i]?.status as 'Correct' | 'Incorrect' | 'CorrectAndIncorrect' | undefined
          if (status) out.push({ area: areas[i], status, bigW, bigH })
        }
      }
    }
  }
  return out
}

function areaBoundsInApi(area: AnswerAreaCalculate) {
  const list = area.pos_list?.[0] as AuditResultPoint[] | undefined
  if (!list || list.length < 4) return null
  const first = list[0]!
  let minX = first.x,
    maxX = first.x,
    minY = first.y,
    maxY = first.y
  for (let i = 1; i < list.length; i++) {
    const p = list[i]!
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  return { minX, maxX, minY, maxY }
}

function areaCenterInApi(area: AnswerAreaCalculate) {
  const b = areaBoundsInApi(area)
  return b ? { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 } : null
}

function apiToCanvas(apiX: number, apiY: number, bigW: number, bigH: number, cw: number, ch: number) {
  return { x: apiX * (cw / bigW), y: apiY * (ch / bigH) }
}

// ─── 手写风格批阅符号 ──────────────────────────────────────

function drawHandCheck(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const j = (s = 1) => (Math.random() - 0.5) * s * (1.2 + Math.random())
  ctx.strokeStyle = '#e63946'
  ctx.lineWidth = 5 + Math.random() * 0.8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const a = size * (0.52 + (Math.random() - 0.5) * 0.12)
  const b = size * (0.38 + (Math.random() - 0.5) * 0.1)
  const c = size * (0.48 + (Math.random() - 0.5) * 0.1)
  const x1 = cx - a + j(size * 0.08),
    y1 = cy + size * 0.08 + j(size * 0.06)
  const x2 = cx - size * 0.08 + j(size * 0.06),
    y2 = cy + b + j(size * 0.06)
  const x3 = cx + c + j(size * 0.06),
    y3 = cy - size * 0.42 + j(size * 0.06)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(x1 - size * 0.06 + j(size * 0.12), y1 + size * 0.2 + j(size * 0.08), x2, y2)
  ctx.quadraticCurveTo(x2 + size * 0.18 + j(size * 0.1), y2 - size * 0.02 + j(size * 0.08), x3, y3)
  ctx.stroke()
}

// 手写风格半对符号：对号 + 划上一笔（对号上方一条手写斜线），中国批阅中表示半对
function drawHandHalfCheck(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  drawHandCheck(ctx, cx, cy, size)

  const j = (scale = 1) => (Math.random() - 0.5) * scale * (1 + Math.random() * 0.6)

  ctx.strokeStyle = '#e63946'
  ctx.lineWidth = 5 + Math.random() * 0.8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const startX = cx - size * 0.18 + j(size * 0.06)
  const startY = cy - size * 0.58 + j(size * 0.06)
  const endX = cx + size * 0.6 + j(size * 0.06)
  const endY = cy - size * 0.06 + j(size * 0.06)

  const ctrlX = (startX + endX) / 2 + j(size * 0.12)
  const ctrlY = (startY + endY) / 2 + j(size * 0.12)

  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY)
  ctx.stroke()
}

function drawHandCross(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const j = (s = 1) => (Math.random() - 0.5) * s * (1 + Math.random() * 0.8)
  ctx.strokeStyle = '#e63946'
  ctx.lineWidth = 5 + Math.random() * 0.8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const r = size * (0.36 + Math.random() * 0.08)
  const tilt = (Math.random() - 0.5) * 0.22
  const cos = Math.cos(tilt),
    sin = Math.sin(tilt)
  const x1 = cx + (-r * cos + r * sin) + j(size * 0.06),
    y1 = cy + (-r * sin - r * cos) + j(size * 0.06)
  const x2 = cx + (r * cos + r * sin) + j(size * 0.06),
    y2 = cy + (r * sin + r * cos) + j(size * 0.06)
  const x3 = cx + (r * cos + r * sin) + j(size * 0.06),
    y3 = cy + (r * sin - r * cos) + j(size * 0.06)
  const x4 = cx + (-r * cos - r * sin) + j(size * 0.06),
    y4 = cy + (-r * sin + r * cos) + j(size * 0.06)
  const wobble = size * (0.06 + Math.random() * 0.06)
  const mx1 = (x1 + x2) / 2 + (y2 - y1) * 0.15 * (Math.random() > 0.5 ? 1 : -1)
  const my1 = (y1 + y2) / 2 - (x2 - x1) * 0.15 * (Math.random() > 0.5 ? 1 : -1)
  const mx2 = (x3 + x4) / 2 + (y4 - y3) * 0.15 * (Math.random() > 0.5 ? 1 : -1)
  const my2 = (y3 + y4) / 2 - (x4 - x3) * 0.15 * (Math.random() > 0.5 ? 1 : -1)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(mx1 + (Math.random() - 0.5) * wobble, my1 + (Math.random() - 0.5) * wobble, x2, y2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(x3, y3)
  ctx.quadraticCurveTo(mx2 + (Math.random() - 0.5) * wobble, my2 + (Math.random() - 0.5) * wobble, x4, y4)
  ctx.stroke()
}

// ─── Canvas → PDF 构建 ──────────────────────────────────────

type PageImg = { jpg: Uint8Array; w: number; h: number }

function canvasesToPdfBlob(
  canvases: HTMLCanvasElement[],
  opts?: { dpi?: number; jpegQuality?: number; pageSize?: { w: number; h: number } }
): Blob {
  const dpi = Number(opts?.dpi || 96)
  const jpegQuality = typeof opts?.jpegQuality === 'number' ? opts!.jpegQuality! : 0.98
  const q = Math.max(0.6, Math.min(1, jpegQuality))

  const pages: PageImg[] = canvases.map(c => ({
    jpg: dataUrlToBytes(c.toDataURL('image/jpeg', q)),
    w: c.width,
    h: c.height,
  }))
  return buildPdf(pages, dpi, opts?.pageSize)
}

function dataUrlToBytes(dataUrl: string) {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const bin = atob(base64)
  const u8 = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
  return u8
}

function buildPdf(
  pages: PageImg[],
  dpi = 96,
  pageSize?: { w: number; h: number }
): Blob {
  const enc = new TextEncoder()
  const chunks: Uint8Array[] = []
  let len = 0
  const offsets: number[] = [0]
  const add = (u8: Uint8Array) => {
    chunks.push(u8)
    len += u8.length
  }
  const str = (s: string) => add(enc.encode(s))
  const startObj = (n: number) => {
    offsets[n] = len
    str(`${n} 0 obj\n`)
  }
  const endObj = () => str('endobj\n')

  const total = 2 + pages.length * 3

  str('%PDF-1.3\n')

  startObj(1)
  str('<< /Type /Catalog /Pages 2 0 R >>\n')
  endObj()

  startObj(2)
  str(`<< /Type /Pages /Kids [ ${pages.map((_, i) => `${3 + i * 3} 0 R`).join(' ')} ] /Count ${pages.length} >>\n`)
  endObj()

  pages.forEach((p, i) => {
    const d = Number.isFinite(dpi) && dpi > 0 ? dpi : 96
    const wImgPt = (p.w * 72) / d
    const hImgPt = (p.h * 72) / d

    const pageW = pageSize?.w ?? wImgPt
    const pageH = pageSize?.h ?? hImgPt

    // 缩放到 A4（或指定纸张）内，保持比例，不放大
    const scale = Math.min(1, pageW / wImgPt, pageH / hImgPt)
    const scaledW = wImgPt * scale
    const scaledH = hImgPt * scale
    const offsetX = Math.max(0, (pageW - scaledW) / 2)
    const offsetY = Math.max(0, (pageH - scaledH) / 2)

    startObj(3 + i * 3)
    str(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Resources << /XObject << /Im0 ${4 + i * 3} 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ${5 + i * 3} 0 R >>\n`
    )
    endObj()

    startObj(4 + i * 3)
    str(
      `<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpg.length} >>\nstream\n`
    )
    add(p.jpg)
    str('\nendstream\n')
    endObj()

    const content = enc.encode(
      `q\n${scaledW.toFixed(2)} 0 0 ${scaledH.toFixed(2)} ${offsetX.toFixed(2)} ${offsetY.toFixed(2)} cm\n/Im0 Do\nQ\n`
    )
    startObj(5 + i * 3)
    str(`<< /Length ${content.length} >>\nstream\n`)
    add(content)
    str('endstream\n')
    endObj()
  })

  const xrefOff = len
  str(`xref\n0 ${total + 1}\n`)
  str('0000000000 65535 f \n')
  for (let i = 1; i <= total; i++) str(`${String(offsets[i] ?? 0).padStart(10, '0')} 00000 n \n`)
  str(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xrefOff}\n%%EOF`)

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' })
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
