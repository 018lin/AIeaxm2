import { downloadCanvasesAsPdf } from '@/utils/downloadHelper'
import * as echarts from 'echarts'
import html2canvas from 'html2canvas'

// A4 PDF导出配置选项类型
export type ExportA4PdfOptions = {
  margin?: number
  scale?: number
  backgroundColor?: string
  forceSingleColumn?: boolean
  echartsPixelRatio?: number
}

// A4纸张尺寸（像素）
const A4_W = 794
const A4_H = 1123

// 创建A4页面画布
const buildA4Page = (bg: string, scale: number) => {
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1
  const pageW = Math.max(1, Math.round(A4_W * s))
  const pageH = Math.max(1, Math.round(A4_H * s))

  const page = document.createElement('canvas')
  page.width = pageW
  page.height = pageH
  const ctx = page.getContext('2d')
  if (ctx) {
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, pageW, pageH) // 填充背景色
  }
  return page
}

// 将内容适配到A4页面（单页模式）
const fitToA4 = (src: HTMLCanvasElement, margin: number, bg: string, scale: number) => {
  const s = Number.isFinite(scale) && scale > 0 ? scale : 1
  const page = buildA4Page(bg, s)
  const ctx = page.getContext('2d')
  if (!ctx) return page

  const sw = src.width
  const sh = src.height
  const pageW = page.width
  const pageH = page.height

  const m = Math.max(0, Math.round(margin * s))
  const innerW = Math.max(1, pageW - m * 2) // 内容区域宽度
  const innerH = Math.max(1, pageH - m * 2) // 内容区域高度

  const ratio = Math.min(innerW / sw, innerH / sh) // 计算缩放比例
  const dw = Math.max(1, Math.round(sw * ratio))
  const dh = Math.max(1, Math.round(sh * ratio))
  const dx = Math.round((pageW - dw) / 2) // 水平居中
  const dy = Math.round((pageH - dh) / 2) // 垂直居中

  ctx.drawImage(src, 0, 0, sw, sh, dx, dy, dw, dh) // 绘制缩放后的图像
  return page
}

// 需要保持完整的块类型（不被分页切割）
type KeepBlock = { top: number; bottom: number; isContainer?: boolean }

// 将内容分割成多个A4页面
const splitToA4Pages = (
  src: HTMLCanvasElement,
  margin: number,
  bg: string,
  keepBlocks: KeepBlock[] | undefined,
  scale: number
) => {
  const pages: HTMLCanvasElement[] = []

  const sw = src.width
  const sh = src.height
  if (!sw || !sh) return pages

  const s = Number.isFinite(scale) && scale > 0 ? scale : 1
  const pageW = Math.max(1, Math.round(A4_W * s))
  const pageH = Math.max(1, Math.round(A4_H * s))
  const m = Math.max(0, Math.round(margin * s))

  const innerW = Math.max(1, pageW - m * 2)
  const innerH = Math.max(1, pageH - m * 2)

  const ratio = innerW / sw
  const pageSrcH = innerH / ratio

  const blocks = (Array.isArray(keepBlocks) ? keepBlocks : [])
    .map(b => ({
      top: Math.max(0, b.top),
      bottom: Math.min(sh, b.bottom),
      isContainer: (b as any).isContainer === true,
    }))
    .filter(b => b.bottom - b.top > 2)
    .sort((a, b) => a.top - b.top)

  const mergedBlocks: KeepBlock[] = []
  // Use an aggressive merge strategy. Try to combine nearby blocks as long as they fit on one page.
  // This helps keep charts with their legends, and table rows together.
  const mergeGap = pageSrcH * 0.04
  for (const b of blocks) {
    const last = mergedBlocks[mergedBlocks.length - 1] as KeepBlock | undefined
    if (!last) {
      mergedBlocks.push({ ...b })
    } else {
      const lastBottom = (last as any).bottom
      const lastTop = (last as any).top
      const lastIsContainer = (last as any).isContainer === true

      const newBottom = Math.max(lastBottom, (b as any).bottom)
      const newHeight = newBottom - lastTop

      // 如果当前块或上一个块是图表容器，不合并，避免图表被切割
      // 图表容器应该保持独立，即使它们很接近
      const shouldMerge = !((b as any).isContainer === true || lastIsContainer)

      if ((b as any).top <= lastBottom + mergeGap && newHeight <= pageSrcH * 0.99 && shouldMerge) {
        // Merge block with the previous one
        mergedBlocks[mergedBlocks.length - 1] = {
          top: lastTop,
          bottom: newBottom,
          isContainer: lastIsContainer || (b as any).isContainer === true,
        }
      } else {
        // Otherwise, start a new block
        mergedBlocks.push({ ...b })
      }
    }
  }

  const isKeepable = (b: KeepBlock) => b.bottom - b.top <= pageSrcH * 0.99 || (b as any).isContainer === true
  const keep = mergedBlocks.filter(isKeepable)

  const isInsideKeepBlock = (y: number) => {
    return keep.some(b => y > b.top + 0.5 && y < b.bottom - 0.5)
  }

  const minStep = 2
  const minPageFill = Math.max(40, pageSrcH * 0.12)

  let sy = 0
  while (sy < sh - 1) {
    const idealEnd = Math.min(sh, sy + pageSrcH)

    let best = -1

    const candidates: number[] = [idealEnd]
    for (const b of keep) {
      if (b.top > sy + minStep && b.top <= idealEnd + 0.5) candidates.push(b.top)
      if (b.bottom > sy + minStep && b.bottom <= idealEnd + 0.5) candidates.push(b.bottom)
    }

    for (const y of candidates) {
      if (y <= sy + minStep) continue
      if (y > idealEnd + 0.5) continue
      if (isInsideKeepBlock(y)) continue
      if (y > best) best = y
    }

    const idealInsideKeep = isInsideKeepBlock(idealEnd)

    let end: number
    if (idealInsideKeep) {
      if (best > 0) {
        // 在进入 keepBlock 之前提前分页，整块内容（如 .mdc-chart 图表）放到下一页，避免被裁断
        end = best
      } else {
        // 没有安全断点可用，尝试把当前 keepBlock 整块放到本页
        const blk = keep.find(b => idealEnd > b.top + 0.5 && idealEnd < b.bottom - 0.5)
        if (blk && blk.bottom - sy <= pageSrcH * 1.35) {
          // 整块高度不超过一页的 1.35 倍，则将分页线延长到块底部
          end = blk.bottom
        } else {
          // 块本身太高或未找到，退回 idealEnd（极端情况下仍可能被裁断）
          end = idealEnd
        }
      }
    } else {
      end = best > 0 ? best : idealEnd
      if (end - sy < minPageFill) end = idealEnd
    }

    const sHeight = Math.max(1, end - sy)

    const page = buildA4Page(bg, s)
    const ctx = page.getContext('2d')
    if (ctx) {
      const dh = Math.max(1, Math.round(sHeight * ratio))
      ctx.drawImage(src, 0, sy, sw, sHeight, m, m, innerW, dh)
      pages.push(page)
    }

    sy += sHeight
  }

  return pages
}

const injectExportStyle = (wrap: HTMLElement) => {
  const style = document.createElement('style')
  style.textContent = `
    * { box-sizing: border-box; }
    .ar-export-wrap, .ar-export-wrap * { overflow-wrap: anywhere; word-break: break-word; white-space: normal; }

    .ar-export-wrap .class-comparison-card { border: 1px solid #f1f5f9; }
    .ar-export-wrap .ant-table, .ar-export-wrap .ant-table-wrapper { width: 100% !important; }
    .ar-export-wrap .ant-table { table-layout: fixed !important; }
    .ar-export-wrap .ant-table-cell { white-space: normal !important; word-break: break-word !important; }

    .ar-export-wrap .skpi-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
    .ar-export-wrap .mcc-grid { grid-template-columns: 1fr !important; }
    .ar-export-wrap .mcl-group { grid-template-columns: 1fr !important; }

    .ar-export-wrap canvas { display: block !important; margin: 0 auto !important; }

    .ar-export-wrap .ring,
    .ar-export-wrap .chart-container {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .ar-export-wrap .class-comparison-card .chart-container { min-height: 160px; }
    .ar-export-wrap .mdc-chart { height: 170px; }
    .ar-export-wrap .chart-trend { height: 320px; }
    .ar-export-wrap .scp-body {grid-template-columns: auto !important; gap: 0 !important;}
    .ar-export-wrap .mdc-card {margin-bottom: 0px;}

    

    /* PDF模式图表切换：显示PDF版本，隐藏网页版本 */
    .ar-export-wrap .trend-chart-web { display: none !important; }
    .ar-export-wrap .trend-chart-pdf { display: block !important; visibility: visible; position: static; margin-bottom:0px }
  `
  wrap.appendChild(style)
}

// 判断是否应该保持网格布局
const shouldKeepGrid = (el: Element) => {
  if (el instanceof HTMLElement) {
    if (el.classList.contains('skpi-grid')) return true
    if (el.closest('.skpi-grid')) return true
  }
  return false
}

// 强制使用单列布局
const forceSingleColumn = (root: HTMLElement) => {
  const nodes = root.querySelectorAll<HTMLElement>('*')
  nodes.forEach(el => {
    if (shouldKeepGrid(el)) return // 保留指定的网格布局
    const cs = getComputedStyle(el)
    if (cs.display === 'grid' || cs.display === 'inline-grid') {
      el.style.gridTemplateColumns = '1fr' // 强制单列
    }
    el.style.maxWidth = '100%'
  })
}

// 同步Canvas位图（从源元素复制到目标克隆元素）
const syncCanvasBitmaps = (srcRoot: HTMLElement, dstRoot: HTMLElement) => {
  const src = Array.from(srcRoot.querySelectorAll('canvas'))
  const dst = Array.from(dstRoot.querySelectorAll('canvas'))
  const n = Math.min(src.length, dst.length)

  for (let i = 0; i < n; i++) {
    const s = src[i] as HTMLCanvasElement
    const d = dst[i] as HTMLCanvasElement

    try {
      const sw = s.width
      const sh = s.height
      const ctx = d.getContext('2d')
      if (!ctx || !sw || !sh) continue

      const dw = d.width || sw
      const dh = d.height || sh
      if (!d.width || !d.height) {
        d.width = dw
        d.height = dh
      }

      const scale = Math.min(dw / sw, dh / sh) // 缩放比例，保持宽高比
      const rw = Math.max(1, Math.round(sw * scale))
      const rh = Math.max(1, Math.round(sh * scale))
      const dx = Math.round((dw - rw) / 2) // 水平居中
      const dy = Math.round((dh - rh) / 2) // 垂直居中

      ctx.clearRect(0, 0, dw, dh)
      ctx.drawImage(s, 0, 0, sw, sh, dx, dy, rw, rh) // 复制并缩放图像
    } catch {
      // 忽略错误
    }
  }
}

// 将ECharts图表快照为图片（用于PDF导出）
const snapshotEchartsToImages = (srcRoot: HTMLElement, dstRoot: HTMLElement, bg: string, pixelRatio: number) => {
  const selectors = [
    '.chart-container',
    '.sd-chart',
    '.ring',
    '.scp-chart',
    '.scp-body',
    '.chart-trend',
    '.mdc-chart',
    '.mdc-card',
    '.shp-chart',
  ]

  const pr = Math.max(2, Math.min(6, Number(pixelRatio || 4))) // 像素比例，2-6之间

  for (const sel of selectors) {
    const srcEls = Array.from(srcRoot.querySelectorAll<HTMLElement>(sel))
    const dstEls = Array.from(dstRoot.querySelectorAll<HTMLElement>(sel))
    const n = Math.min(srcEls.length, dstEls.length)

    for (let i = 0; i < n; i++) {
      const srcEl = srcEls[i]
      const dstEl = dstEls[i]
      const inst = echarts.getInstanceByDom(srcEl)
      if (!inst) continue

      const originalSize = { width: srcEl.offsetWidth, height: srcEl.offsetHeight } // 保存原始尺寸
      const targetRect = dstEl.getBoundingClientRect()
      const targetSize = { width: targetRect.width, height: targetRect.height } // 目标PDF尺寸

      if (!targetSize.width || !targetSize.height) continue

      try {
        // 临时将图表调整到目标PDF尺寸
        inst.resize(targetSize)

        // 生成更高分辨率的图片
        const url = inst.getDataURL({ type: 'png', pixelRatio: pr, backgroundColor: bg })

        // 恢复图表原始尺寸
        inst.resize(originalSize)

        if (!url) continue

        // 将生成的图片放入克隆元素中
        dstEl.innerHTML = ''
        dstEl.style.display = 'flex'
        dstEl.style.alignItems = 'center'
        dstEl.style.justifyContent = 'center'

        const img = document.createElement('img')
        img.src = url
        img.style.maxWidth = '100%'
        img.style.maxHeight = '100%'
        img.style.width = 'auto'
        img.style.height = 'auto'
        img.style.objectFit = 'contain'
        img.style.display = 'block'

        dstEl.appendChild(img)
      } catch (e) {
        // 确保出错时也恢复尺寸
        inst.resize(originalSize)
        console.error('Failed to snapshot chart:', e)
      }
    }
  }
}

// 将元素捕获为Canvas
async function captureElementToCanvas(el: HTMLElement, opts: ExportA4PdfOptions) {
  const scale = Number(opts.scale || 2)
  const bg = String(opts.backgroundColor || '#ffffff')

  return html2canvas(el, {
    backgroundColor: bg,
    scale,
    scrollX: 0,
    scrollY: 0,
    useCORS: true,
    allowTaint: true,
    logging: false,
  })
}

// 捕获报告克隆（处理样式、图表等）
async function captureReportClone(reportEl: HTMLElement, opts: ExportA4PdfOptions, contentWidth: number) {
  const scale = Number(opts.scale || 2)
  const bg = String(opts.backgroundColor || '#ffffff')

  const wrap = document.createElement('div')
  wrap.style.position = 'fixed'
  wrap.style.left = '-99999px' // 放到屏幕外
  wrap.style.top = '0'
  wrap.style.width = `${contentWidth}px`
  wrap.style.background = bg
  wrap.style.pointerEvents = 'none'

  injectExportStyle(wrap) // 注入导出样式

  const cloned = reportEl.cloneNode(true) as HTMLElement
  cloned.classList.add('ar-export-wrap')
  cloned.style.width = `${contentWidth}px`
  cloned.style.maxWidth = `${contentWidth}px`
  cloned.style.background = bg

  if (opts.forceSingleColumn) forceSingleColumn(cloned) // 强制单列布局

  wrap.appendChild(cloned)
  document.body.appendChild(wrap)

  await new Promise<void>(r => requestAnimationFrame(() => r())) // 等待渲染

  syncCanvasBitmaps(reportEl, cloned) // 同步Canvas位图

  const pr = Number(opts.echartsPixelRatio || opts.scale || 4)
  snapshotEchartsToImages(reportEl, cloned, bg, pr) // 快照ECharts图表

  await new Promise<void>(r => requestAnimationFrame(() => r())) // 再次等待渲染

  const rootRect = cloned.getBoundingClientRect()

  // 收集需要保持完整的元素（避免被分页切割）
  const keepCandidateEls = Array.from(
    cloned.querySelectorAll<HTMLElement>(
      [
        // 通用容器
        '.mcc-card',
        '.mcc-note',
        '.scp-card',
        '.class-comparison-card',
        '.mcl-group > .panel',
        '.block',
        '.sqac-card',
        // 图表容器（优先级高，确保图表不被切割）
        '.mdc-card',
        '.chart-container',
        '.sd-chart',
        '.ring',
        '.scp-chart',
        '.shp-chart',
        '.scp-body',
        '.sqac-row',

        '.chart-trend',
        '.chart-trend .trend-chart-web .card',
        '.chart-trend .trend-chart-pdf .trend-split-item .card',
        // 表格元素
        '.ant-table-wrapper',
        '.ant-table-thead > tr',
        '.ant-table-tbody > tr',
        '.ant-table-row',
        // 文本元素
        '.title',
        '.card-title',
        '.legend',
        '.chart-legend',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'li',
        'span',
      ].join(',')
    )
  )

  // 去重并过滤嵌套块，只保留最内层的
  // 这创建一个最小有意义单元的平面列表（如标题、图表、图例项）
  // splitToA4Pages 中的合并逻辑会将这些单元分组在一起
  const uniqueKeepEls = Array.from(new Set(keepCandidateEls))

  // 特殊处理：对于图表容器（.mdc-card, .chart-trend 等），即使包含子元素也保留
  // 这样可以确保整个图表卡片不被分页切割
  const chartContainerSelectors = [
    '.mdc-card',
    '.chart-trend',
    '.chart-container',
    '.sd-chart',
    '.ring',
    '.scp-chart',
    '.shp-chart',
    '.scp-body',
    '.sqac-row',
    '.sqac-card',
    '.ant-table-thead > tr',
    '.ant-table-tbody > tr',
    '.ant-table-row',
  ]

  const keepEls = uniqueKeepEls.filter(el => {
    const hasKeepChild = uniqueKeepEls.some(otherEl => el !== otherEl && el.contains(otherEl))

    // 如果是图表容器，保留它；否则过滤掉有子元素的元素
    const isChartContainer = chartContainerSelectors.some(sel => el.matches(sel))
    if (isChartContainer) {
      return true
    }

    return !hasKeepChild
  })

  // 计算需要保持完整的块的位置信息
  const keepBlocks: KeepBlock[] = keepEls
    .map(el => {
      const rect = el.getBoundingClientRect()
      const top = rect.top - rootRect.top
      const bottom = top + rect.height
      const isContainer = chartContainerSelectors.some(sel => el.matches(sel))
      return { top: top * scale, bottom: bottom * scale, isContainer }
    })
    .filter(b => b.bottom - b.top > 6) // 过滤太小的块

  // 使用html2canvas捕获克隆的内容
  const canvas = await html2canvas(cloned, {
    backgroundColor: bg,
    scale,
    width: contentWidth,
    windowWidth: contentWidth,
    scrollX: 0,
    scrollY: 0,
    useCORS: true,
    allowTaint: true,
    logging: false,
  })

  document.body.removeChild(wrap) // 清理临时元素

  return { canvas, keepBlocks }
}

// 导出A4报告PDF主函数
export async function exportA4ReportPdf(args: {
  coverEl: HTMLElement
  reportEl: HTMLElement
  fileName: string
  reportSelector?: string
  cover?: ExportA4PdfOptions
  report?: ExportA4PdfOptions
}) {
  const coverOpts = args.cover || {}
  const reportOpts = args.report || {}

  const coverMargin = Number(coverOpts.margin ?? 0)
  const reportMargin = Number(reportOpts.margin ?? 48)

  const bg = String(reportOpts.backgroundColor || '#ffffff')

  const coverScale = Number(coverOpts.scale || 2)
  const reportScale = Number(reportOpts.scale || 2)

  // 处理封面页
  const coverCanvasHi = await captureElementToCanvas(args.coverEl, coverOpts)
  const coverPage = fitToA4(coverCanvasHi, coverMargin, bg, coverScale)

  // 处理报告内容页
  const contentWidth = Math.max(1, A4_W - reportMargin * 2)
  const { canvas: reportCanvasHi, keepBlocks } = await captureReportClone(args.reportEl, reportOpts, contentWidth)
  const pages = splitToA4Pages(reportCanvasHi, reportMargin, bg, keepBlocks, reportScale)

  // 下载PDF
  const pdfScale = Math.max(1, Math.round(Math.max(coverScale, reportScale)))
  downloadCanvasesAsPdf([coverPage, ...pages], args.fileName, { dpi: 96 * pdfScale, jpegQuality: 1 })
}
