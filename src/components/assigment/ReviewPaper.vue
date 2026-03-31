<template>
  <main class="main">
    <div class="content">
      <aside class="ques-list">
        <div class="label">题目列表</div>
        <button
          v-for="(q, i) in normalizedItems"
          :key="q.id"
          type="button"
          class="ques-item"
          :class="{ active: q.id === curQuestionId }"
          @click="selectQuestion(q.id)"
        >
          <div class="k">Q{{ i + 1 }}</div>
        </button>
      </aside>

      <div class="content-paper">
        <div class="answer" v-if="current">
          <div class="answer-block" v-if="attachments.length">
            <div class="answer-title">作答附件</div>
            <div class="attachment-list">
              <template v-for="(u, idx) in attachments" :key="u">
                <div v-if="true" class="attachment-img-wrap">
                  <img
                    :ref="(el: any) => setImgRef(el, idx)"
                    class="attachment-img"
                    :src="u"
                    @load="() => handleImgLoad(idx)"
                  />
                  <!-- 兜底方案 <div v-if="idx === 0" class="tch-areas-overlay">
                    <button
                      v-for="i in answerIndexes"
                      :key="resolveAreaId(i)"
                      type="button"
                      class="tch-area-box"
                      :class="[{ active: i === selectedIndex }, statusTone(String(gradingItems[i]?.status || ''))]"
                      :style="areaStyle(i)"
                      @click.stop="emit('selectArea', i)"
                    >
                      <span class="tch-area-box-tag">空{{ resolveAreaId(i) }}</span>
                    </button>
                  </div> -->
                </div>
                <a v-else class="attachment-link" :href="u" target="_blank" rel="noreferrer">{{ u }}</a>
              </template>
            </div>
          </div>
        </div>
        <a-empty v-else :image="simpleImage" description="暂无数据" />
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import type { NeedGradingHomeworkVO } from '@/api/homework/type'
import { Empty } from 'ant-design-vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

type AreaPoint = { x: number; y: number }
type AnswerArea = { areaId?: string; posList?: AreaPoint[][] }
type GradingItem = { studentAnswer?: string; status?: string; [property: string]: any }

const emit = defineEmits<{ colorTool: []; selectArea: [index: number] }>()

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

const props = withDefaults(
  defineProps<{
    items?: NeedGradingHomeworkVO[]
    studentId?: string
    areas?: AnswerArea[]
    gradingItems?: GradingItem[]
    selectedIndex?: number
  }>(),
  {
    items: () => [],
    studentId: '',
    areas: () => [],
    gradingItems: () => [],
    selectedIndex: 0,
  }
)

const curQuestionId = ref('')

const normalizedItems = computed(() => {
  const list = Array.isArray(props.items) ? props.items : []
  return list.map((it, idx) => {
    const id = String(it?.homeworkDetailId || idx + 1)
    return {
      id,
      answerContent: it?.answerContent,
      answerAttachment: it?.answerAttachment,
      raw: it,
    }
  })
})

const current = computed(() => normalizedItems.value.find(it => it.id === curQuestionId.value) || null)

const attachments = computed(() => {
  const raw = String(current.value?.answerAttachment || '').trim()
  if (!raw) return [] as string[]
  return raw
    .split(/[\n,]/g)
    .map(s => s.trim())
    .filter(Boolean)
})

const isImageUrl = (url: string) => {
  const u = String(url || '')
    .trim()
    .toLowerCase()
  return (
    u.startsWith('data:image/') ||
    u.endsWith('.png') ||
    u.endsWith('.jpg') ||
    u.endsWith('.jpeg') ||
    u.endsWith('.gif') ||
    u.endsWith('.webp') ||
    u.includes('image')
  )
}

const statusTone = (status: string) => {
  const s = String(status || '').trim()
  if (s === 'Correct') return 'is-correct'
  if (s === 'Incorrect') return 'is-wrong'
  if (s === 'CorrectAndIncorrect') return 'is-half'
  return ''
}

const answerCount = computed(() => Math.max(props.areas.length, props.gradingItems.length))
const answerIndexes = computed(() => Array.from({ length: answerCount.value }, (_, i) => i))
const resolveAreaId = (i: number) => String(props.areas[i]?.areaId || i + 1)

const imgRef = ref<HTMLImageElement | null>(null)
const imgBox = ref({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })
const rafId = ref<number | null>(null)

const updateImgMetrics = () => {
  const el = imgRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  imgBox.value = {
    width: rect.width,
    height: rect.height,
    naturalWidth: el.naturalWidth || 0,
    naturalHeight: el.naturalHeight || 0,
  }
}

const scheduleMeasure = (frames = 3) => {
  if (typeof window === 'undefined') return
  if (rafId.value != null) cancelAnimationFrame(rafId.value)

  let count = 0
  const run = () => {
    updateImgMetrics()
    count++
    if (count < Math.max(1, frames)) rafId.value = window.requestAnimationFrame(run)
  }
  rafId.value = window.requestAnimationFrame(run)
}

const handleImgLoad = (idx: number) => {
  if (idx !== 0) return
  nextTick(() => scheduleMeasure(4))
}

const setImgRef = (el: HTMLImageElement | null, idx: number) => {
  if (idx !== 0) return
  imgRef.value = el
}

const coordMeta = computed(() => {
  let maxX = 0
  let maxY = 0

  for (const area of props.areas) {
    const posList = Array.isArray(area?.posList) ? (area.posList as AreaPoint[][]) : []
    for (const poly of posList) {
      if (!Array.isArray(poly)) continue
      for (const p of poly) {
        const x = Number((p as any)?.x)
        const y = Number((p as any)?.y)
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
    }
  }

  const { naturalWidth: nw, naturalHeight: nh } = imgBox.value

  if (maxX > 0 && maxY > 0 && maxX <= 1.1 && maxY <= 1.1) return { baseW: 1, baseH: 1 }
  if (maxX > 0 && maxY > 0 && maxX <= 100.1 && maxY <= 100.1) return { baseW: 100, baseH: 100 }

  return { baseW: nw || maxX || 1, baseH: nh || maxY || 1 }
})

const buildBbox = (area: AnswerArea) => {
  const posList = Array.isArray(area?.posList) ? (area.posList as AreaPoint[][]) : []
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const poly of posList) {
    if (!Array.isArray(poly)) continue
    for (const p of poly) {
      const x = Number((p as any)?.x)
      const y = Number((p as any)?.y)
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue
      minX = Math.min(minX, x)
      minY = Math.min(minY, y)
      maxX = Math.max(maxX, x)
      maxY = Math.max(maxY, y)
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) return null
  return { minX, minY, maxX, maxY }
}

const areaStyle = (i: number) => {
  const area = props.areas[i]
  const bbox = area ? buildBbox(area) : null
  const box = imgBox.value
  if (!bbox || !box.width || !box.height) return { display: 'none' }

  const meta = coordMeta.value
  const baseW = Number(meta?.baseW) || 0
  const baseH = Number(meta?.baseH) || 0
  if (!baseW || !baseH) return { display: 'none' }

  const sx = box.width / baseW
  const sy = box.height / baseH

  return {
    left: `${bbox.minX * sx}px`,
    top: `${bbox.minY * sy}px`,
    width: `${Math.max(0, (bbox.maxX - bbox.minX) * sx)}px`,
    height: `${Math.max(0, (bbox.maxY - bbox.minY) * sy)}px`,
  }
}

const selectQuestion = (id: string) => {
  curQuestionId.value = String(id || '')
  emit('colorTool')
  nextTick(() => scheduleMeasure(4))
}

watch(
  () => [props.studentId, normalizedItems.value],
  () => {
    const list = normalizedItems.value
    if (!list.length) {
      curQuestionId.value = ''
      return
    }
    const cur = curQuestionId.value
    if (!cur || !list.some(it => it.id === cur)) {
      curQuestionId.value = list[0]?.id || ''
    }
    nextTick(() => scheduleMeasure(4))
  },
  { immediate: true }
)

if (typeof window !== 'undefined') {
  const onResize = () => scheduleMeasure(3)
  window.addEventListener('resize', onResize)

  let ro: ResizeObserver | null = null
  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(() => scheduleMeasure(3))
  }

  watch(
    () => imgRef.value,
    el => {
      ro?.disconnect()
      if (el) ro?.observe(el)
      scheduleMeasure(3)
    },
    { flush: 'post' }
  )

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onResize)
    ro?.disconnect()
    if (rafId.value != null) cancelAnimationFrame(rafId.value)
  })
}

defineExpose({
  curQuestionId,
})
</script>

<style scoped lang="less">
.main {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .header {
    width: 100%;
    height: 60px;
    background: #fff;
    position: relative;
    padding: 0 40px;
    box-sizing: border-box;
    margin-bottom: 20px;

    .header-scroll {
      flex: 1 1 auto;
      min-width: 0;
      max-width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      gap: 16px;
      overflow-x: auto;
      overflow-y: hidden;
      background: transparent;
      box-sizing: border-box;
      // /* 隐藏横向滚动条 */
      // scrollbar-width: none; /* Firefox */
      // -ms-overflow-style: none; /* IE 10+ */
      // &::-webkit-scrollbar {
      //   display: none;
      // }

      .header-item {
        width: max-content;
        height: 40px;
        padding: 0 18px;
        border-radius: 12px;
        border: 1px solid #f7f7f7;
        box-shadow: var(--app-shadow);
        display: flex;
        align-items: center;
        cursor: pointer;
        h3 {
          white-space: nowrap;
          font-size: 14px;
          font-weight: 700;
          margin: 0;
          padding-right: 8px;
          user-select: none;
          color: rgba(17, 24, 39, 0.75);
        }
        span {
          display: inline-block;
          width: max-content;
          color: #67768d;
          font-weight: 500;
        }
      }
      .active {
        background: rgba(236, 122, 46, 0.95);
        border-color: rgba(236, 122, 46, 0.65);
        h3 {
          color: #fff;
        }
        span {
          color: #fff;
        }
      }
    }

    .scroll-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 1;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #f7f7f7;
      border-radius: 50%;
      cursor: pointer;
      background: #fff;
    }
    .scroll-btn.left {
      left: 4px;
    }
    .scroll-btn.right {
      right: 4px;
    }
  }

  .content {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: 78px 1fr;

    .ques-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;

      .label {
        font-size: 12px;
        font-weight: 700;
        color: rgba(17, 24, 39, 0.55);
      }

      .ques-item {
        width: 68px;
        border-radius: 12px;
        border: 1px solid rgba(242, 235, 230, 1);
        background: rgba(255, 255, 255, 0.96);
        padding: 10px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        box-shadow: 0 12px 26px rgba(148, 117, 98, 0.06);
        .k {
          min-width: 34px;
          height: 26px;
          padding: 0 10px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 12px;
          color: rgba(17, 24, 39, 0.75);
          background: rgba(248, 246, 244, 0.95);
        }
      }

      .active {
        border-color: rgba(236, 122, 46, 0.65);
        background: rgba(236, 122, 46, 0.08);
        .k {
          color: #fff;
          background: rgba(236, 122, 46, 0.95);
        }
      }
    }

    .content-paper {
      min-height: 0;
      border-radius: 16px;
      border: 1px solid rgba(242, 235, 230, 1);
      background: #fdfbf7;
      padding: 22px;

      .answer {
        width: 100%;
        height: 100%;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .answer-title {
        font-size: 12px;
        font-weight: 700;
        color: rgba(17, 24, 39, 0.55);
        padding-bottom: 10px;
      }

      .answer-content {
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-size: 13px;
        color: rgba(17, 24, 39, 0.85);
        line-height: 1.6;
      }

      .answer-empty {
        font-size: 13px;
        color: rgba(17, 24, 39, 0.5);
      }

      .attachment-list {
        border-radius: 12px;
        border: 1px solid rgba(242, 235, 230, 1);
        overflow: hidden;
        padding: 12px;
        background: rgba(255, 255, 255, 0.96);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .attachment-img-wrap {
        position: relative;
        display: inline-block;
        max-width: 100%;
      }

      .attachment-img {
        max-width: 500px;
        width: 90%;
        display: block;
        max-height: calc(100vh - var(--header-height) - var(--space) - 154px);
        margin: auto;
        object-fit: contain;
      }

      .attachment-link {
        font-size: 12px;
        color: rgba(17, 24, 39, 0.65);
        text-decoration: underline;
      }

      .tch-areas-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .tch-area-box {
        position: absolute;
        border: 2px solid rgba(59, 130, 246, 0.65);
        background: rgba(59, 130, 246, 0.08);
        border-radius: 8px;
        padding: 0;
        pointer-events: auto;
        cursor: pointer;

        &.active {
          box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.25);
        }

        &.is-correct {
          border-color: rgba(16, 185, 129, 0.65);
          background: rgba(16, 185, 129, 0.08);
        }

        &.is-half {
          border-color: rgba(251, 191, 36, 0.7);
          background: rgba(251, 191, 36, 0.08);
        }

        &.is-wrong {
          border-color: rgba(239, 68, 68, 0.65);
          background: rgba(239, 68, 68, 0.08);
        }

        .tch-area-box-tag {
          position: absolute;
          left: 4px;
          top: 4px;
          font-size: 12px;
          font-weight: 800;
          color: rgba(15, 23, 42, 0.92);
          background: rgba(255, 255, 255, 0.86);
          border-radius: 8px;
          padding: 2px 6px;
          line-height: 1.2;
          user-select: none;
        }
      }
    }
  }
}
</style>
