<template>
  <div
    ref="paperWrapRef"
    class="tch-ow-paper flex-center w-full rounded-16 border-light overflow-hidden"
    :class="{ 'is-previewable': previewable && Boolean(previewSrc) }"
    @click="onOpenPreview"
  >
    <template v-if="isMultiPage">
      <div class="tch-ow-paper-pages" :class="{ 'is-two': paperVisiblePages.length === 2 }">
        <div
          v-for="(p, i) in paperVisiblePages"
          :key="p.index"
          class="tch-ow-paper-page"
          :class="{ 'is-right': i === 1 }"
        >
          <canvas v-show="paperDrawn[i]" :ref="setPaperCanvasRef(i)" class="tch-ow-paper-canvas" />
        </div>
      </div>

      <div v-if="paperGroupTotal > 1" class="tch-ow-paper-nav" aria-label="分页">
        <button
          type="button"
          class="tch-ow-nav-btn"
          :disabled="!canPaperPrev"
          aria-label="上一页"
          @click.stop="paperPrevGroup"
        >
          <Icon icon="solar:alt-arrow-left-linear" width="16" />
        </button>
        <div class="tch-ow-nav-indicator">{{ paperIndicatorText }}</div>
        <button
          type="button"
          class="tch-ow-nav-btn"
          :disabled="!canPaperNext"
          aria-label="下一页"
          @click.stop="paperNextGroup"
        >
          <Icon icon="solar:alt-arrow-right-linear" width="16" />
        </button>
      </div>
    </template>

    <template v-else>
      <canvas v-show="originalImageDrawn" ref="paperCanvasRef" class="tch-ow-paper-canvas" />
      <img
        v-if="fallbackImg && !originalDetail?.attachmentUrl"
        :src="fallbackImg"
        alt="原作业"
        class="w-full h-full object-contain"
      />
    </template>
    <!-- <div v-if="previewable && previewSrc" class="tch-ow-hover-mask">点击查看大图</div> -->
  </div>

  <a-modal
    v-if="previewable"
    :open="previewOpen"
    :footer="null"
    centered
    width="1200"
    wrap-class-name="tch-ow-preview-modal"
    @update:open="onPreviewClose"
  >
    <div class="tch-ow-zoom" aria-label="缩放控制">
      <button type="button" class="tch-ow-zoom-btn" aria-label="缩小" @click="handlePreviewZoomOut">
        <Icon icon="ic:round-minus" width="16" />
      </button>
      <div class="tch-ow-zoom-val">{{ previewZoomPercent }}%</div>
      <button type="button" class="tch-ow-zoom-btn" aria-label="放大" @click="handlePreviewZoomIn">
        <Icon icon="ic:round-plus" width="16" />
      </button>
      <div class="tch-ow-zoom-divider"></div>
      <button type="button" class="tch-ow-zoom-btn tch-ow-zoom-reset" @click="handlePreviewReset">重置</button>
    </div>
    <template v-if="isMultiPage">
      <div
        ref="previewWrapRef"
        class="tch-ow-preview-canvas tch-ow-preview-swiper"
        @wheel="handlePreviewWheel"
        @scroll="handlePreviewScroll"
      >
        <div class="tch-ow-preview-track">
          <div v-for="(g, gi) in pageGroups" :key="gi" class="tch-ow-preview-slide">
            <div class="tch-ow-preview-pages" :class="{ 'is-two': g.length === 2 }">
              <canvas
                v-for="p in g"
                :key="p.index"
                :ref="setPreviewCanvasRef(p.index)"
                class="tch-ow-preview-img"
                :style="{ height: `${90 * previewScale}vh` }"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="paperGroupTotal > 1" class="tch-ow-preview-nav" aria-label="预览分页">
        <button
          type="button"
          class="tch-ow-nav-btn"
          :disabled="!canPreviewPrev"
          aria-label="上一页"
          @click="previewPrevGroup"
        >
          <Icon icon="solar:alt-arrow-left-linear" width="16" />
        </button>
        <div class="tch-ow-nav-indicator">{{ previewIndicatorText }}</div>
        <button
          type="button"
          class="tch-ow-nav-btn"
          :disabled="!canPreviewNext"
          aria-label="下一页"
          @click="previewNextGroup"
        >
          <Icon icon="solar:alt-arrow-right-linear" width="16" />
        </button>
      </div>
    </template>

    <template v-else>
      <div class="tch-ow-preview-canvas" @wheel="handlePreviewWheel">
        <canvas ref="previewCanvasRef" class="tch-ow-preview-img" :style="{ height: `${90 * previewScale}vh` }" />
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import type { AnswerAreaCalculate, AuditResultPoint, OriginalDetailVO, ParsedAuditResult } from '@/api/homework/type'
import { Icon } from '@iconify/vue'
import { message } from 'ant-design-vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  originalDetail?: OriginalDetailVO | null
  originalDetails?: OriginalDetailVO[] | null
  fallbackImg?: string
  fitMode?: 'contain' | 'width'
  previewable?: boolean
}>()

const paperWrapRef = ref<HTMLElement | null>(null)
const paperCanvasRef = ref<HTMLCanvasElement | null>(null)
const previewCanvasRef = ref<HTMLCanvasElement | null>(null)
const originalImageDrawn = ref(false)

type PageItem = { index: number; detail: OriginalDetailVO }

const allDetails = computed<OriginalDetailVO[]>(() => {
  const list = props.originalDetails
  if (Array.isArray(list) && list.length) return list.filter(Boolean)
  return props.originalDetail ? [props.originalDetail] : []
})

const isMultiPage = computed(() => allDetails.value.length > 1)
const pageGroups = computed<PageItem[][]>(() => {
  const list = allDetails.value
  const out: PageItem[][] = []
  for (let i = 0; i < list.length; i += 2) {
    const g: PageItem[] = []
    const d1 = list[i]
    if (d1) g.push({ index: i, detail: d1 })
    const d2 = list[i + 1]
    if (d2) g.push({ index: i + 1, detail: d2 })
    out.push(g)
  }
  return out
})

const paperGroupIndex = ref(0)
const paperVisiblePages = computed<PageItem[]>(() => pageGroups.value[paperGroupIndex.value] || [])
const paperGroupTotal = computed(() => pageGroups.value.length)
const canPaperPrev = computed(() => paperGroupTotal.value > 1 && paperGroupIndex.value > 0)
const canPaperNext = computed(() => paperGroupTotal.value > 1 && paperGroupIndex.value + 1 < paperGroupTotal.value)
const paperIndicatorText = computed(() => {
  const total = allDetails.value.length
  if (!total) return ''
  const start = paperGroupIndex.value * 2 + 1
  const end = Math.min(start + 1, total)
  return `第 ${start}${end > start ? `-${end}` : ''} 页 / 共 ${total} 页`
})

const paperCanvasEls = ref<(HTMLCanvasElement | null)[]>([])
const paperDrawn = ref<boolean[]>([false, false])
const setPaperCanvasRef = (slot: number) => (el: any) => {
  paperCanvasEls.value[slot] = (el as HTMLCanvasElement) || null
}

const previewOpen = ref(false)
const previewSrc = computed(
  () => props.originalDetail?.attachmentUrl || props.originalDetails?.[0]?.attachmentUrl || props.fallbackImg || ''
)

const previewScale = ref(1)
const previewZoomPercent = computed(() => Math.round(previewScale.value * 100))

const previewWrapRef = ref<HTMLElement | null>(null)
const previewGroupIndex = ref(0)
const canPreviewPrev = computed(() => paperGroupTotal.value > 1 && previewGroupIndex.value > 0)
const canPreviewNext = computed(() => paperGroupTotal.value > 1 && previewGroupIndex.value + 1 < paperGroupTotal.value)
defineExpose({
  paperGroupIndex,
  paperVisiblePages,
  pageGroups,
})

const previewIndicatorText = computed(() => {
  const total = allDetails.value.length
  if (!total) return ''
  const start = previewGroupIndex.value * 2 + 1
  const end = Math.min(start + 1, total)
  return `第 ${start}${end > start ? `-${end}` : ''} 页 / 共 ${total} 页`
})

const previewCanvasEls = new Map<number, HTMLCanvasElement>()
const setPreviewCanvasRef = (pageIndex: number) => (el: any) => {
  const canvas = el as HTMLCanvasElement | null
  if (canvas) previewCanvasEls.set(pageIndex, canvas)
  else previewCanvasEls.delete(pageIndex)
}

const onOpenPreview = () => {
  if (!props.previewable || !previewSrc.value) return
  previewScale.value = 1
  previewOpen.value = true
  if (isMultiPage.value) {
    previewGroupIndex.value = paperGroupIndex.value
    nextTick(() => {
      scrollToPreviewGroup(previewGroupIndex.value, false)
      drawPreviewGroup(previewGroupIndex.value)
    })
  } else {
    nextTick(() => drawPreviewCanvas())
  }
}

const onPreviewClose = (val: boolean) => {
  previewOpen.value = val
  if (!val) previewScale.value = 1
}

const handlePreviewZoomIn = () => {
  previewScale.value = Math.min(previewScale.value + 0.1, 5)
}
const handlePreviewZoomOut = () => {
  if (previewScale.value <= 1) {
    message.warning('已缩放至最小')
    return
  }
  previewScale.value = Math.max(previewScale.value - 0.2, 1)
}
const handlePreviewReset = () => {
  previewScale.value = 1
}
const handlePreviewWheel = (e: WheelEvent) => {
  if (!e.ctrlKey && !e.metaKey) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  previewScale.value = Math.max(0.5, Math.min(previewScale.value + delta, 5))
}

const paperPrevGroup = () => {
  if (!canPaperPrev.value) return
  paperGroupIndex.value -= 1
}
const paperNextGroup = () => {
  if (!canPaperNext.value) return
  paperGroupIndex.value += 1
}

const previewPrevGroup = () => {
  if (!canPreviewPrev.value) return
  previewGroupIndex.value -= 1
  scrollToPreviewGroup(previewGroupIndex.value)
  nextTick(() => drawPreviewGroup(previewGroupIndex.value))
}
const previewNextGroup = () => {
  if (!canPreviewNext.value) return
  previewGroupIndex.value += 1
  scrollToPreviewGroup(previewGroupIndex.value)
  nextTick(() => drawPreviewGroup(previewGroupIndex.value))
}

const scrollToPreviewGroup = (idx: number, smooth = true) => {
  const el = previewWrapRef.value
  if (!el) return
  const w = el.clientWidth || 1
  el.scrollTo({ left: idx * w, behavior: smooth ? 'smooth' : 'auto' })
}

let previewScrollRaf = 0
const handlePreviewScroll = () => {
  if (previewScrollRaf) cancelAnimationFrame(previewScrollRaf)
  previewScrollRaf = requestAnimationFrame(() => {
    const el = previewWrapRef.value
    if (!el) return
    const w = el.clientWidth || 1
    const idx = Math.round(el.scrollLeft / w)
    if (idx !== previewGroupIndex.value) {
      previewGroupIndex.value = idx
      nextTick(() => drawPreviewGroup(previewGroupIndex.value))
    }
  })
}

// 解析后端返回的 auditResult：
// - 若为字符串，则尝试 JSON.parse
// - 若已为对象（见 api/homework/api.md 示例），则直接返回
function parseAuditResult(raw: OriginalDetailVO['auditResult']): ParsedAuditResult | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ParsedAuditResult
    } catch {
      return null
    }
  }
  if (typeof raw === 'object') {
    return raw as ParsedAuditResult
  }
  return null
}

// 从解析后的 auditResult 收集所有答案区域及其 status（坐标原点在卷子左上角 (0,0)），
// 同时为每个区域携带对应页面的大图尺寸，避免多页时统一使用第一页尺寸导致偏差
function collectAnswerAreasWithStatus(parsed: ParsedAuditResult | null): {
  area: AnswerAreaCalculate
  status: 'Correct' | 'Incorrect' | 'CorrectAndIncorrect'
  bigW: number
  bigH: number
}[] {
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
          const area = areas[i]
          const resultItem = gradingResult[i]
          const status = resultItem?.status as 'Correct' | 'Incorrect' | 'CorrectAndIncorrect' | undefined

          if (!status) continue

          out.push({ area, status, bigW, bigH })
        }
      }
    }
  }
  return out
}

// 手写风格对勾：一笔带过、线条略带弧度与抖动，参考纸质批阅
function drawHandCheck(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const j = (scale = 1) => (Math.random() - 0.5) * scale * (1.2 + Math.random() * 1)
  ctx.strokeStyle = '#e63946'
  const baseW = Math.max(1, size * 0.1)
  ctx.lineWidth = baseW + Math.random() * (baseW * 0.1)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const a = size * (0.52 + (Math.random() - 0.5) * 0.12)
  const b = size * (0.38 + (Math.random() - 0.5) * 0.1)
  const c = size * (0.48 + (Math.random() - 0.5) * 0.1)
  const x1 = cx - a + j(size * 0.08)
  const y1 = cy + size * 0.08 + j(size * 0.06)
  const x2 = cx - size * 0.08 + j(size * 0.06)
  const y2 = cy + b + j(size * 0.06)
  const x3 = cx + c + j(size * 0.06)
  const y3 = cy - size * 0.42 + j(size * 0.06)
  const c1x = x1 - size * 0.06 + j(size * 0.12)
  const c1y = y1 + size * 0.2 + j(size * 0.08)
  const c2x = x2 + size * 0.18 + j(size * 0.1)
  const c2y = y2 - size * 0.02 + j(size * 0.08)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.quadraticCurveTo(c1x, c1y, x2, y2)
  ctx.quadraticCurveTo(c2x, c2y, x3, y3)
  ctx.stroke()
}

// 手写风格半对符号：对号 + 划上一笔（对号上方一条手写斜线），中国批阅中表示半对
function drawHandHalfCheck(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  drawHandCheck(ctx, cx, cy, size)

  const j = (scale = 1) => (Math.random() - 0.5) * scale * (1 + Math.random() * 0.6)

  ctx.strokeStyle = '#e63946'
  const baseW = Math.max(1, size * 0.1)
  ctx.lineWidth = baseW + Math.random() * (baseW * 0.1)
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

// 手写风格叉：两条斜线带轻微弧度（wobble），像笔尖划过
function drawHandCross(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const j = (scale = 1) => (Math.random() - 0.5) * scale * (1 + Math.random() * 0.8)
  ctx.strokeStyle = '#e63946'
  const baseW = Math.max(1, size * 0.1)
  ctx.lineWidth = baseW + Math.random() * (baseW * 0.1)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const r = size * (0.36 + Math.random() * 0.08)
  const tilt = (Math.random() - 0.5) * 0.22
  const cos = Math.cos(tilt)
  const sin = Math.sin(tilt)
  const x1 = cx + (-r * cos + r * sin) + j(size * 0.06)
  const y1 = cy + (-r * sin - r * cos) + j(size * 0.06)
  const x2 = cx + (r * cos + r * sin) + j(size * 0.06)
  const y2 = cy + (r * sin + r * cos) + j(size * 0.06)
  const x3 = cx + (r * cos + r * sin) + j(size * 0.06)
  const y3 = cy + (r * sin - r * cos) + j(size * 0.06)
  const x4 = cx + (-r * cos - r * sin) + j(size * 0.06)
  const y4 = cy + (-r * sin + r * cos) + j(size * 0.06)
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

// 根据 pos_list 计算矩形中心（API 坐标系：原点左上角 (0,0)）
function areaCenterInApi(area: AnswerAreaCalculate): { x: number; y: number } | null {
  const b = areaBoundsInApi(area)
  if (!b) return null
  return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 }
}

// 根据 pos_list 计算矩形边界（API 坐标系），用于半对半错时左右分开放叉/对勾
function areaBoundsInApi(area: AnswerAreaCalculate): { minX: number; maxX: number; minY: number; maxY: number } | null {
  const list = area.pos_list?.[0] as AuditResultPoint[] | undefined
  if (!list || list.length < 4) return null
  const first = list[0]
  if (!first) return null
  let minX = first.x
  let maxX = first.x
  let minY = first.y
  let maxY = first.y
  for (let i = 1; i < list.length; i++) {
    const item = list[i]
    if (!item) continue
    minX = Math.min(minX, item.x)
    maxX = Math.max(maxX, item.x)
    minY = Math.min(minY, item.y)
    maxY = Math.max(maxY, item.y)
  }
  return { minX, maxX, minY, maxY }
}

// 将 API 坐标（左上角原点 (0,0)）转为 canvas 坐标（同为左上角原点）
function apiToCanvas(apiX: number, apiY: number, bigW: number, bigH: number, canvasW: number, canvasH: number) {
  const scaleX = canvasW / bigW
  const scaleY = canvasH / bigH
  return {
    x: apiX * scaleX,
    y: apiY * scaleY,
  }
}

// 在 canvas 上绘制底图 + 批改符号
function drawImageWithMarks(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  cw: number,
  ch: number,
  dpr: number,
  parsed: ParsedAuditResult | null,
  setStyle = true
) {
  canvas.width = Math.round(cw * dpr)
  canvas.height = Math.round(ch * dpr)
  if (setStyle) {
    canvas.style.width = `${cw}px`
    canvas.style.height = `${ch}px`
  }
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(dpr, dpr)
  ctx.drawImage(img, 0, 0, cw, ch)

  const areasWithStatus = collectAnswerAreasWithStatus(parsed)
  for (const { area, status, bigW, bigH } of areasWithStatus) {
    const center = areaCenterInApi(area)
    if (!center) continue
    const { x: cx, y: cy } = apiToCanvas(center.x, center.y, bigW, bigH, cw, ch)
    const markSize = Math.max(14, Math.min(160, cw * 0.04))
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
}

// 绘制主视图 canvas
function drawPaperWithMarks() {
  const canvas = paperCanvasRef.value
  const wrap = paperWrapRef.value
  const detail = props.originalDetail || allDetails.value[0]
  if (!canvas || !wrap || !detail?.attachmentUrl) return

  const parsed = parseAuditResult(detail.auditResult)

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    const wrapRect = wrap.getBoundingClientRect()
    const imgAspect = img.naturalWidth / img.naturalHeight
    let cw: number
    let ch: number
    if (props.fitMode === 'width') {
      cw = wrapRect.width
      ch = cw / imgAspect
    } else {
      const wrapAspect = wrapRect.width / wrapRect.height
      if (imgAspect > wrapAspect) {
        cw = wrapRect.width
        ch = wrapRect.width / imgAspect
      } else {
        ch = wrapRect.height
        cw = wrapRect.height * imgAspect
      }
    }
    const dpr = window.devicePixelRatio || 1
    drawImageWithMarks(canvas, img, cw, ch, dpr, parsed)
    originalImageDrawn.value = true
  }
  img.onerror = () => {
    originalImageDrawn.value = false
  }
  img.src = detail.attachmentUrl
}

function drawPaperMultiPages() {
  const wrap = paperWrapRef.value
  if (!wrap) return

  const wrapRect = wrap.getBoundingClientRect()
  const pages = paperVisiblePages.value
  const pageCount = pages.length
  const availW = pageCount === 2 ? wrapRect.width / 2 : wrapRect.width
  const availH = wrapRect.height

  for (let slot = 0; slot < 2; slot++) {
    const page = pages[slot]
    const canvas = paperCanvasEls.value[slot]
    if (!canvas) {
      paperDrawn.value[slot] = false
      continue
    }
    if (!page?.detail?.attachmentUrl) {
      paperDrawn.value[slot] = false
      continue
    }

    const parsed = parseAuditResult(page.detail.auditResult)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const imgAspect = img.naturalWidth / img.naturalHeight
      let cw: number
      let ch: number
      if (props.fitMode === 'width') {
        cw = availW
        ch = cw / imgAspect
      } else {
        const wrapAspect = availW / availH
        if (imgAspect > wrapAspect) {
          cw = availW
          ch = availW / imgAspect
        } else {
          ch = availH
          cw = availH * imgAspect
        }
      }

      const dpr = window.devicePixelRatio || 1
      drawImageWithMarks(canvas, img, cw, ch, dpr, parsed)
      paperDrawn.value[slot] = true
    }
    img.onerror = () => {
      paperDrawn.value[slot] = false
    }
    img.src = page.detail.attachmentUrl
  }
}

// 绘制预览弹窗 canvas（原图分辨率 + 批改留痕）
function drawPreviewCanvas() {
  const canvas = previewCanvasRef.value
  const detail = props.originalDetail || allDetails.value[0]
  const src = detail?.attachmentUrl || props.fallbackImg
  if (!canvas || !src) return

  const parsed = detail ? parseAuditResult(detail.auditResult) : null
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    drawImageWithMarks(canvas, img, img.naturalWidth, img.naturalHeight, 1, parsed, false)
  }
  img.src = src
}

function drawPreviewGroup(groupIndex: number) {
  const g = pageGroups.value[groupIndex] || []
  for (const p of g) {
    const canvas = previewCanvasEls.get(p.index)
    const src = p.detail?.attachmentUrl
    if (!canvas || !src) continue

    const parsed = parseAuditResult(p.detail.auditResult)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      drawImageWithMarks(canvas, img, img.naturalWidth, img.naturalHeight, 1, parsed, false)
    }
    img.src = src
  }
}

watch(
  () => [props.originalDetail, props.originalDetails],
  () => {
    paperGroupIndex.value = 0
    paperDrawn.value = [false, false]
    nextTick(() => {
      if (isMultiPage.value) drawPaperMultiPages()
      else drawPaperWithMarks()
    })
  }
)

// 容器尺寸变化时重绘
let resizeObserver: ResizeObserver | null = null
let lastObservedWidth = 0
let lastObservedHeight = 0
watch(
  [
    paperWrapRef,
    () =>
      isMultiPage.value
        ? pageGroups.value.map(g => g.map(p => p.detail?.attachmentUrl || '').join('|')).join('||')
        : props.originalDetail?.attachmentUrl || allDetails.value[0]?.attachmentUrl,
  ],
  ([wrap]) => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    lastObservedWidth = 0
    lastObservedHeight = 0
    const el = wrap as HTMLElement | null
    if (!el) return
    const firstDetail = props.originalDetail || allDetails.value[0]
    if (!isMultiPage.value && !firstDetail?.attachmentUrl) return
    if (isMultiPage.value && !allDetails.value.length) return
    resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      if (Math.abs(width - lastObservedWidth) < 1 && Math.abs(height - lastObservedHeight) < 1) return
      lastObservedWidth = width
      lastObservedHeight = height
      if (isMultiPage.value) drawPaperMultiPages()
      else drawPaperWithMarks()
    })
    resizeObserver.observe(el)
  },
  { immediate: true }
)

watch(
  () => paperGroupIndex.value,
  () => {
    if (!isMultiPage.value) return
    paperDrawn.value = [false, false]
    nextTick(() => drawPaperMultiPages())
  }
)

watch(
  () => previewOpen.value,
  open => {
    if (!open) return
    if (!isMultiPage.value) return
    nextTick(() => {
      scrollToPreviewGroup(previewGroupIndex.value, false)
      drawPreviewGroup(previewGroupIndex.value)
    })
  }
)

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style scoped lang="scss">
.tch-ow-paper {
  height: 100%;
  min-height: 0;
  max-height: 100%;
  margin: 0 auto;
  position: relative;

  &.is-previewable {
    cursor: pointer;
  }

  .tch-ow-paper-pages {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: stretch;
    justify-content: center;
  }

  .tch-ow-paper-page {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .tch-ow-paper-page.is-right {
    border-left: 1px solid var(--color-border-light);
  }

  .tch-ow-paper-canvas {
    display: block;
    max-width: 100%;
    max-height: 100%;
    box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
    transition: none !important;
    animation: none !important;
    transform: none !important;
  }

  .tch-ow-hover-mask {
    position: absolute;
    width: 100%;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.35);
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    opacity: 0;
    transition: opacity 0.18s ease;
    pointer-events: none;
  }

  &.is-previewable:hover .tch-ow-hover-mask {
    opacity: 1;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
}

.tch-ow-paper-nav {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(245, 130, 51, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

.tch-ow-preview-nav {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(245, 130, 51, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
}

.tch-ow-nav-btn {
  height: 30px;
  width: 30px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgb(255 247 237);
    color: var(--color-primary);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
}

.tch-ow-nav-indicator {
  font-size: 12px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.7);
  user-select: none;
  white-space: nowrap;
}

.tch-ow-zoom {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 5px;
  display: inline-flex;
  align-items: center;
  background: #fff;
  border: 1px solid rgba(245, 130, 51, 0.2);
  padding: 4px 8px;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  margin-bottom: 8px;
}

.tch-ow-zoom-btn {
  height: 30px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  display: flex;
  align-items: center;

  &:hover {
    background-color: rgb(255 247 237);
    color: var(--color-primary);
  }
}

.tch-ow-zoom-reset {
  width: auto;
  padding: 0 12px;
  font-size: 12px;
}

.tch-ow-zoom-divider {
  width: 1px;
  height: 18px;
  background: var(--color-border-light);
}

.tch-ow-zoom-val {
  min-width: 56px;
  padding: 0 6px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.65);
  user-select: none;
}

.tch-ow-preview-canvas {
  overflow: auto;
  max-height: 92vh;
  text-align: center;
}

.tch-ow-preview-swiper {
  scroll-snap-type: x mandatory;
}

.tch-ow-preview-track {
  display: flex;
  width: 100%;
}

.tch-ow-preview-slide {
  flex: 0 0 100%;
  scroll-snap-align: start;
  display: flex;
  justify-content: center;
}

.tch-ow-preview-pages {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
}

.tch-ow-preview-pages.is-two {
  gap: 14px;
}

.tch-ow-preview-img {
  height: 90vh;
  width: auto;
  max-width: none;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  transform-origin: center top;
  box-shadow: 0 0 12px rgba(0, 0, 0, 0.1);
}

:deep(.tch-ow-preview-modal .ant-modal-body) {
  padding: 12px;
}

:deep(.tch-ow-preview-modal .ant-modal-content) {
  border-radius: 16px;
}
</style>
