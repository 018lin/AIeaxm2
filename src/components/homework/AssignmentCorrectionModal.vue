<template>
  <a-modal :open="open" title="判题" :footer="null" :width="920" @cancel="close" class="tch-stu-modal">
    <div class="tch-stu-modal-body">
      <div class="tch-stu-modal-left">
        <div class="tch-stu-meta flex items-center gap-12">
          <div class="tch-stu-meta-text flex items-center gap-sm">
            <Icon icon="clarity:avatar-solid-badged" color="var(--color-primary)" width="24" />
            <div class="tch-stu-info">
              <div class="tch-stu-meta-label">学生姓名</div>
              <div class="tch-stu-meta-value bold text-primary">{{ modalCtx.studentName }}</div>
            </div>
          </div>
        </div>

        <div class="tch-stu-modal-content">
          <!-- <div class="tch-stu-modal-title bold text-primary">{{ modalCtx.img }}</div> -->
          <div class="tch-stu-modal-paper flex-center">
            <div v-if="modalCtx.img" class="tch-stu-modal-paper-inner">
              <img ref="imgRef" :src="modalCtx.img" alt="作答" @load="handleImgLoad" />
              <div class="tch-areas-overlay">
                <button
                  v-for="i in answerIndexes"
                  :key="resolveAreaId(i)"
                  type="button"
                  class="tch-area-box"
                  :class="[{ active: selectedIndex === i }, statusTone(String(gradingItems[i]?.status || ''))]"
                  :style="areaStyle(i)"
                  @click.stop="selectArea(i)"
                >
                  <span class="tch-area-box-tag">空{{ resolveAreaId(i) }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="tch-stu-modal-right flex-col gap-12">
        <div v-if="answerIndexes.length > 1" class="mul-question-inner">
          <div class="tch-stu-judge-title bold">答题区</div>
          <div class="tch-area-list">
            <button
              v-for="i in answerIndexes"
              :key="resolveAreaId(i)"
              type="button"
              class="tch-area-item"
              :class="[{ active: selectedIndex === i }, statusTone(String(gradingItems[i]?.status || ''))]"
              @click.stop="selectArea(i)"
            >
              <span class="left">空{{ resolveAreaId(i) }}</span>
              <span class="right">{{ statusText(String(gradingItems[i]?.status || '')) }}</span>
            </button>
          </div>

          <div class="tch-area-answer">
            <div class="label bold">{{ labelText }}</div>
            <div class="value">{{ currentAnswer || '-' }}</div>
          </div>
        </div>

        <div class="tch-stu-judge-title bold">批改判定</div>
        <button
          type="button"
          class="tch-judge-btn is-correct flex items-center gap-10 bold"
          :class="{ active: currentStatus === 'Correct' }"
          @click.stop="changeSelectedStatus('Correct')"
        >
          <span class="icon flex-center">
            <CheckOutlined />
          </span>
          正确
        </button>
        <button
          type="button"
          class="tch-judge-btn is-half flex items-center gap-10 bold"
          :class="{ active: currentStatus === 'CorrectAndIncorrect' }"
          @click.stop="changeSelectedStatus('CorrectAndIncorrect')"
        >
          <span class="icon flex-center">
            <Icon icon="tdesign:error" width="14" />
          </span>
          半对
        </button>
        <button
          type="button"
          class="tch-judge-btn is-wrong flex items-center gap-10 bold"
          :class="{ active: currentStatus === 'Incorrect' }"
          @click.stop="changeSelectedStatus('Incorrect')"
        >
          <span class="icon flex-center">
            <CloseOutlined />
          </span>
          错误
        </button>

        <button type="button" class="tch-stu-confirm bold" :disabled="submitting" @click="confirmJudge">
          {{ submitting ? '提交中...' : '确认批改' }}
        </button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { correctGradingResult } from '@/api/common'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons-vue'
import { Icon } from '@iconify/vue'
import { message } from 'ant-design-vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

type AreaPoint = { x: number; y: number }
type AnswerArea = { areaId?: string; posList?: AreaPoint[][] }
type GradingItem = { studentAnswer?: string; status?: string; [property: string]: any }

const props = defineProps<{
  open: boolean
  modalCtx: any
  modalJudge: string
}>()

const emit = defineEmits<{
  closeModal: [boolean]
  changeModalJudge: [string]
  confirmJudge: [payload: { gradingId: string; gradingResult: string }]
}>()

const submitting = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)
const imgBox = ref({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })
const rafId = ref<number | null>(null)

const originalSnapshot = ref('')

const areas = ref<AnswerArea[]>([])
const gradingItems = ref<GradingItem[]>([])
const selectedIndex = ref(0)

const safeJsonParse = <T,>(raw: any, fallback: T): T => {
  if (raw == null) return fallback
  if (typeof raw === 'string') {
    const s = raw.trim()
    if (!s) return fallback
    try {
      return JSON.parse(s) as T
    } catch {
      return fallback
    }
  }
  return (raw as T) ?? fallback
}

const stableStringify = (v: any): string => {
  if (v == null) return 'null'
  const t = typeof v
  if (t === 'string') return JSON.stringify(v)
  if (t === 'number' || t === 'boolean') return String(v)
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`
  if (t !== 'object') return JSON.stringify(v)

  const obj = v as Record<string, any>
  const keys = Object.keys(obj).sort()
  return `{${keys.map(k => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}

const answerCount = computed(() => Math.max(areas.value.length, gradingItems.value.length))
const answerIndexes = computed(() => Array.from({ length: answerCount.value }, (_, i) => i))

watch(answerCount, n => {
  if (n <= 0) selectedIndex.value = 0
  else if (selectedIndex.value >= n) selectedIndex.value = 0
})

const resolveAreaId = (i: number) => String(areas.value[i]?.areaId || i + 1)

const statusText = (status: string) => {
  const s = String(status || '').trim()
  if (s === 'Correct') return '正确'
  if (s === 'Incorrect') return '错误'
  if (s === 'CorrectAndIncorrect') return '半对'
  return '-'
}

const statusTone = (status: string) => {
  const s = String(status || '').trim()
  if (s === 'Correct') return 'is-correct'
  if (s === 'Incorrect') return 'is-wrong'
  if (s === 'CorrectAndIncorrect') return 'is-half'
  return ''
}

const currentAnswer = computed(() => String(gradingItems.value[selectedIndex.value]?.studentAnswer || '').trim())
const currentStatus = computed(() => String(gradingItems.value[selectedIndex.value]?.status || '').trim())

const labelText = computed(() => `${props.modalCtx.studentName}：空${resolveAreaId(selectedIndex.value)}答案`)

const overallJudge = computed(() => {
  const list = gradingItems.value
  if (!list.length) return String(props.modalJudge || '').trim()
  const statuses = list.map(it => String(it?.status || '').trim()).filter(Boolean)
  if (statuses.length !== list.length) return 'CorrectAndIncorrect'
  if (statuses.every(s => s === 'Correct')) return 'Correct'
  if (statuses.every(s => s === 'Incorrect')) return 'Incorrect'
  return 'CorrectAndIncorrect'
})

const syncModalJudge = () => {
  const next = overallJudge.value
  if (next && next !== props.modalJudge) emit('changeModalJudge', next)
}

const close = () => emit('closeModal', false)

const selectArea = (i: number) => {
  if (submitting.value) return
  selectedIndex.value = i
}

const changeSelectedStatus = (next: string) => {
  if (submitting.value) return
  const i = selectedIndex.value
  const list = gradingItems.value
  if (!list[i]) return
  list[i] = { ...list[i], status: next }
  gradingItems.value = [...list]
  syncModalJudge()
}

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

const handleImgLoad = () => {
  nextTick(() => scheduleMeasure(4))
}

const coordMeta = computed(() => {
  let maxX = 0
  let maxY = 0

  for (const area of areas.value) {
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

  if (maxX > 0 && maxY > 0 && maxX <= 1.1 && maxY <= 1.1) {
    return { baseW: 1, baseH: 1 }
  }

  if (maxX > 0 && maxY > 0 && maxX <= 100.1 && maxY <= 100.1) {
    return { baseW: 100, baseH: 100 }
  }

  const looksDownscaled = nw >= 1200 && nh >= 1200 && maxX > 0 && maxY > 0 && maxX <= 1000 && maxY <= 1000

  if (!looksDownscaled) {
    return { baseW: nw || maxX || 1, baseH: nh || maxY || 1 }
  }

  let baseW = maxX
  let baseH = maxY

  const natAspect = nw > 0 && nh > 0 ? nw / nh : 0
  const coordAspect = baseW > 0 && baseH > 0 ? baseW / baseH : 0

  if (Number.isFinite(natAspect) && natAspect > 0 && Number.isFinite(coordAspect) && coordAspect > 0) {
    const rel = Math.abs(coordAspect - natAspect) / natAspect
    if (rel > 0.25) {
      const wFromH = baseH * natAspect
      const hFromW = baseW / natAspect
      baseW = Math.max(baseW, wFromH)
      baseH = Math.max(baseH, hFromW)
    }
  }

  return { baseW, baseH }
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
  const area = areas.value[i]
  const bbox = area ? buildBbox(area) : null
  const box = imgBox.value

  if (!bbox || !box.width || !box.height) return { display: 'none' }

  const meta = coordMeta.value
  const baseW = Number(meta?.baseW) || 0
  const baseH = Number(meta?.baseH) || 0

  if (!baseW || !baseH) return { display: 'none' }

  const sx = box.width / baseW
  const sy = box.height / baseH

  const left = bbox.minX * sx
  const top = bbox.minY * sy
  const width = Math.max(0, (bbox.maxX - bbox.minX) * sx)
  const height = Math.max(0, (bbox.maxY - bbox.minY) * sy)

  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  }
}

const initFromCtx = async () => {
  const ctx = props.modalCtx || {}
  areas.value = safeJsonParse<AnswerArea[]>(ctx?.answerAreas, [])

  const parsed = safeJsonParse<GradingItem[]>(ctx?.gradingResult, [])
  if (Array.isArray(parsed) && parsed.length) {
    gradingItems.value = parsed.map(it => ({ ...it }))
  } else if (areas.value.length) {
    const fallbackStatus = String(props.modalJudge || 'Incorrect').trim() || 'Incorrect'
    gradingItems.value = areas.value.map(() => ({ studentAnswer: '', status: fallbackStatus }))
  } else {
    gradingItems.value = []
  }

  originalSnapshot.value = stableStringify(gradingItems.value)

  selectedIndex.value = 0
  syncModalJudge()
  await nextTick()

  const el = imgRef.value
  if (el && el.complete && el.naturalWidth > 0) {
    scheduleMeasure(4)
  } else {
    scheduleMeasure(6)
  }
}

watch(
  () => [props.open, props.modalCtx],
  ([open]) => {
    if (!open) return
    initFromCtx()
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

const confirmJudge = async () => {
  if (submitting.value) return

  const ctx = props.modalCtx || {}
  const gradingId = String(
    ctx?.gradingId || ctx?.detailId || ctx?.homeworkDetailId || ctx?.homeworkId || ctx?.imgRecordId || ctx?.id || ''
  ).trim()

  if (!gradingId) {
    message.warning('缺少批改结果ID，无法修正')
    return
  }

  if (!gradingItems.value.length) {
    message.warning('缺少批阅结果，无法提交')
    return
  }

  const nextSnapshot = stableStringify(gradingItems.value)
  if (nextSnapshot === originalSnapshot.value) {
    message.info('暂时没有修改结果哦')
    return
  }

  const gradingResultStr = JSON.stringify(gradingItems.value)

  submitting.value = true
  try {
    await correctGradingResult({
      gradingId,
      gradingResult: overallJudge.value || String(props.modalJudge || '').trim(),
      gradingResultStr,
    })
    originalSnapshot.value = nextSnapshot
    message.success('已更新批阅结果')
    emit('confirmJudge', { gradingId, gradingResult: overallJudge.value || String(props.modalJudge || '').trim() })
  } catch (e: any) {
    message.error(e?.message || '修正批阅结果失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.tch-stu-modal {
  :deep(.ant-modal-header) {
    margin: 0;
    padding: 16px 20px;
  }

  :deep(.ant-modal-body) {
    padding: 0;
  }

  &-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
  }

  &-left {
    padding-right: 20px;
  }

  &-right {
    border-left: 1px solid var(--color-border-light, rgba(148, 163, 184, 0.18));
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &-content {
    margin-top: 16px;
    border-radius: 16px;
    background: var(--color-bg-soft, rgba(248, 250, 252, 1));
    padding: 16px;
  }

  &-title {
    font-size: 14px;
    color: var(--color-text-primary, rgba(17, 24, 39, 0.9));
    margin-bottom: 12px;
  }

  &-paper {
    border-radius: 14px;
    overflow: hidden;
    background: var(--color-bg-container, #fff);
    min-height: 260px;
    display: flex;
    align-items: center;
    justify-content: center;

    &-inner {
      position: relative;
      display: inline-block;
      max-width: 100%;
    }

    img {
      max-width: 100%;
      height: auto;
      display: block;
    }

    .tch-areas-overlay {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .tch-area-box {
      position: absolute;
      border: 2px solid rgba(59, 130, 246, 0.7);
      background: rgba(59, 130, 246, 0.12);
      border-radius: 6px;
      padding: 0;
      cursor: pointer;
      pointer-events: auto;

      // 坐标不准确，兜底方案
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;

      &.active {
        box-shadow: 0 0 0 2px rgba(255, 107, 0, 0.35);

        .tch-area-box-tag {
          color: red;
        }
      }

      &.is-correct {
        border-color: rgba(16, 185, 129, 0.75);
        background: rgba(16, 185, 129, 0.12);
      }

      &.is-half {
        border-color: rgba(251, 191, 36, 0.75);
        background: rgba(251, 191, 36, 0.12);
      }

      &.is-wrong {
        border-color: rgba(239, 68, 68, 0.75);
        background: rgba(239, 68, 68, 0.12);
      }

      .tch-area-box-tag {
        position: absolute;
        left: 4px;
        top: 4px;
        font-size: 11px;
        font-weight: 700;
        width: 30px;
        color: rgba(239, 68, 68, 0.75);
        background: rgba(255, 255, 255, 0.85);
        border-radius: 6px;
        padding: 2px 6px;
        line-height: 1.2;
        user-select: none;

        // 兜底
        display: none !important;
      }
    }
  }
}
.tch-stu-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border-light, rgba(148, 163, 184, 0.18));

  &-text {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &-label {
    font-size: 12px;
    color: var(--color-text-tertiary, rgba(71, 85, 105, 0.75));
  }

  &-value {
    font-size: 16px;
    color: var(--color-text-primary, rgba(17, 24, 39, 0.92));
  }
}
.tch-stu-judge-title {
  font-size: 13px;
  color: var(--color-text-secondary, rgba(71, 85, 105, 0.8));
  margin-bottom: 4px;
}

.tch-area-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 220px;
  overflow: auto;
  padding-right: 4px;
  padding-bottom: 4px;
}

.tch-area-item {
  border-radius: 8px;
  border: 1px solid transparent;
  background: var(--color-bg-soft, rgb(248 250 252 / 1));
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.85);

  &.active {
    border-width: 2px;
  }

  &.is-correct {
    border-color: rgba(16, 185, 129, 0.5);
  }

  &.is-half {
    border-color: rgba(251, 191, 36, 0.5);

    .right {
      color: var(--color-review-half-text);
    }
  }

  &.is-wrong {
    border-color: rgba(239, 68, 68, 0.5);

    .right {
      color: var(--color-review-wrong-text);
    }
  }

  .right {
    font-size: 12px;
    font-weight: 700;
    color: rgba(71, 85, 105, 0.85);
  }
}

.tch-area-answer {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.9);
  padding: 10px 12px;

  .label {
    font-size: 12px;
    color: rgba(71, 85, 105, 0.85);
    margin-bottom: 6px;
  }

  .value {
    font-size: 16px;
    font-weight: 800;
    color: rgba(15, 23, 42, 0.92);
    word-break: break-word;
  }
}

.tch-judge-btn {
  height: 54px;
  border-radius: 10px;
  background: var(--color-bg-soft, rgb(248 250 252 / 1));
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  font-size: 14px;
  color: var(--color-text-primary, rgba(17, 24, 39, 0.85));
  cursor: pointer;
  border: 1px solid transparent;

  &.is-correct {
    &.active,
    &:hover {
      border-color: var(--color-border-success, rgba(16, 185, 129, 0.5));
    }

    .icon {
      background: var(--color-review-correct-bg);
      color: var(--color-review-correct-text);
    }
  }

  &.is-half {
    &.active,
    &:hover {
      border-color: var(--color-border-warning, rgba(251, 191, 36, 0.5));
    }

    .icon {
      background: var(--color-review-half-bg);
      color: var(--color-review-half-text);
    }
  }

  &.is-wrong {
    &.active,
    &:hover {
      border-color: var(--color-border-error, rgba(239, 68, 68, 0.5));
    }

    .icon {
      background: var(--color-review-wrong-bg);
      color: var(--color-review-wrong-text);
    }
  }

  .icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

.tch-stu-confirm {
  margin-top: auto;
  height: 52px;
  border-radius: 16px;
  border: none;
  font-weight: 700;
  background: var(--color-primary);
  color: var(--color-white, #fff);
  cursor: pointer;

  &:hover {
    background: var(--color-warning); // or a slightly darker primary
    opacity: 0.9;
  }
}
</style>
