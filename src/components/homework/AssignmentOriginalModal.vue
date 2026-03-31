<template>
  <a-modal
    :open="open"
    :footer="null"
    :width="1000"
    :closable="true"
    centered
    class="assignment-original-modal"
    @cancel="close"
  >
    <template #title>
      <div class="custom-header">
        <div class="indicator"></div>
        <span class="title-text">原作业</span>
      </div>

      <div class="toolbar">
        <div class="tool-group">
          <div class="tool-btn" @click="handleZoomIn">
            <Icon icon="iconamoon:zoom-in-light" width="20" />
            <span>放大</span>
          </div>
          <div class="divider"></div>
          <div class="tool-btn" @click="handleZoomOut">
            <Icon icon="iconamoon:zoom-out-light" width="20" />
            <span>缩小</span>
          </div>
          <div class="divider"></div>
          <div class="tool-btn" @click="handleReset">
            <Icon icon="solar:restart-bold" width="20" />
            <span>重置</span>
          </div>
          <div class="divider"></div>
          <div class="tool-btn" @click="handleDownload">
            <Icon icon="solar:download-bold-duotone" width="20" />
            <span>下载</span>
          </div>
        </div>
      </div>
    </template>

    <div class="modal-content-body">
      <!-- Toolbar -->

      <!-- Student Info -->
      <div class="student-info-bar">
        <div class="info-pill">
          <span class="label">学生:</span>
          <span class="value bold">{{ modalCtx?.studentName || '未知' }}</span>
          <span class="dot">•</span>
          <span class="label">学号:</span>
          <span class="value bold">{{ modalCtx?.studentCode || '-' }}</span>
          <span class="dot">•</span>
          <span class="label">年级班级:</span>
          <span class="value bold">{{ modalCtx?.gradeClass || '-' }}</span>
        </div>
      </div>

      <!-- Image Canvas -->
      <div class="image-canvas" @wheel="handleWheel">
        <template v-if="modalCtx?.originalDetail || modalCtx?.originalImage">
          <div
            class="image-wrapper"
            :style="{ transform: `translate(${translateX}px, ${translateY}px) scale(${scale})` }"
          >
            <OriginalWorkPaper
              :original-detail="modalCtx?.originalDetail ?? null"
              :fallback-img="modalCtx?.originalImage"
              fit-mode="width"
            />
          </div>
        </template>
        <div v-else class="empty-state">
          <Icon icon="solar:gallery-remove-bold-duotone" width="48" color="#ccc" />
          <p>暂无原作业图片</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer-status">
        <div class="left-info">
          <span>共 {{ pageTotal }} 页</span>
        </div>
        <div v-if="pageTotal > 1" class="tch-ow-preview-nav" aria-label="预览分页">
          <button type="button" class="tch-ow-nav-btn" :disabled="!canPrev" aria-label="上一页" @click="prevPage">
            <Icon icon="solar:alt-arrow-left-linear" width="16" />
          </button>
          <div class="tch-ow-nav-indicator">
            <span>第 {{ pageIndex + 1 }} 页 / 共 {{ pageTotal }} 页</span>
          </div>
          <button type="button" class="tch-ow-nav-btn" :disabled="!canNext" aria-label="下一页" @click="nextPage">
            <Icon icon="solar:alt-arrow-right-linear" width="16" />
          </button>
        </div>

        <div class="right-status">
          <div class="status-badge">
            <Icon icon="solar:check-circle-bold" class="success-icon" />
            <span>数据已同步</span>
          </div>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import OriginalWorkPaper from '@/components/homework/OriginalWorkPaper.vue'
import { downloadOriginalWorkAsPdf } from '@/utils/downloadHelper'
import { Icon } from '@iconify/vue'
import { message } from 'ant-design-vue'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  /** 可包含 originalDetail(原作业详情)、originalImage(原图URL)、studentName、studentUserId、gradeClass 等 */
  modalCtx: any
  pageIndex: number
  pageTotal: number
}>()

const emit = defineEmits<{ closeModal: [boolean]; changePage: [number] }>()
const close = () => emit('closeModal', false)
const canPrev = computed(() => props.pageTotal > 1 && props.pageIndex > 0)
const canNext = computed(() => props.pageTotal > 1 && props.pageIndex + 1 < props.pageTotal)
const prevPage = () => {
  if (!canPrev.value) return
  emit('changePage', props.pageIndex - 1)
}
const nextPage = () => {
  if (!canNext.value) return
  emit('changePage', props.pageIndex + 1)
}

// Image Controls
const scale = ref(1)
const rotation = ref(0)
const translateX = ref(0)
const translateY = ref(0)

const handleZoomIn = () => {
  scale.value = Math.min(scale.value + 0.1, 5)
}

const handleZoomOut = () => {
  scale.value = Math.max(scale.value - 0.1, 0.6)
}

const handleWheel = (e: WheelEvent) => {
  if (!e.ctrlKey && !e.metaKey) return
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  scale.value = Math.max(0.5, Math.min(scale.value + delta, 5))
}

const handleReset = () => {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

const downloading = ref(false)
// 下载原卷留痕 PDF（所有页面含批阅标记）
const handleDownload = async () => {
  const rawIds = Array.isArray(props.modalCtx?.homeworkIds) ? (props.modalCtx?.homeworkIds as any[]) : []
  const ids = rawIds.map(x => String(x || '').trim()).filter(Boolean)

  if (!ids.length) {
    message.warning('当前暂无原作业图片')
    return
  }

  if (downloading.value) return
  downloading.value = true

  const studentName = String(props.modalCtx?.studentName || props.modalCtx?.name || '').trim()
  const fileName = `原卷留痕_${studentName || '学生'}`

  try {
    await downloadOriginalWorkAsPdf(ids, fileName)
  } catch {
    message.error('下载失败，请稍后重试')
  } finally {
    downloading.value = false
  }
}

// Reset state when modal opens
watch(
  () => props.open,
  val => {
    if (val) {
      scale.value = 1
      rotation.value = 0
      translateX.value = 0
      translateY.value = 0
    }
  }
)
</script>

<style scoped lang="scss">
.custom-header {
  display: flex;
  align-items: center;
  gap: 12px;

  .indicator {
    width: 6px;
    height: 24px;
    background: #ff6b00;
    border-radius: 4px;
  }

  .title-text {
    font-size: 20px;
    font-weight: 700;
    color: #333;
  }
}

.modal-content-body {
  display: flex;
  flex-direction: column;
  height: calc(95vh - 55px);
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: center;
  margin-bottom: 5px;

  .tool-group {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .tool-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #ff6b00;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    user-select: none;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }

  .divider {
    width: 1px;
    height: 16px;
    background: #ffe0cc;
  }
}

.student-info-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 10px;

  .info-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f0f9ff;
    padding: 8px 24px;
    border-radius: 10px;
    font-size: 14px;
    color: #555;

    .label {
      color: #64748b;
    }

    .value {
      color: #0f172a;
      &.bold {
        font-weight: 600;
      }
    }

    .dot {
      color: #cbd5e1;
      margin: 0 4px;
    }
  }
}

.image-canvas {
  flex: 1;
  min-height: 0;
  border-radius: 8px;
  overflow: auto;
  position: relative;

  .image-wrapper {
    width: 54%;
    margin: 0 auto;
    transform-origin: center top;

    :deep(.tch-ow-paper) {
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
      background: #f8fafc;
      height: auto;
      max-height: none;
    }

    :deep(.tch-ow-paper-canvas) {
      height: auto;
      max-height: none;
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 400px;
    gap: 12px;
    color: #999;
  }
}

.modal-footer-status {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .left-info {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    color: #94a3b8;
    font-weight: 600;
  }

  .ant-btn.light.disabled {
    color: rgba(0, 0, 0, 0.7);
    background-color: rgba(0, 0, 0, 0.04);
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #dcfce7;
    color: #166534;
    padding: 6px 16px;
    border-radius: 99px;
    font-size: 13px;
    font-weight: 600;

    .success-icon {
      color: #22c55e;
    }
  }
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
</style>
