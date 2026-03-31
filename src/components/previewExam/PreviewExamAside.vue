<template>
  <aside class="preview-right">
    <div class="panel">
      <div class="panel-section-title">
        <Icon icon="solar:widget-2-bold" width="16" />
        <span>布局设置</span>
      </div>

      <div class="layout-toggle">
        <button
          type="button"
          class="layout-btn"
          :class="{ active: curPaperType === 'A4', disabled: isFinalized }"
          :disabled="isFinalized"
          @click="$emit('change-paper-type', 'A4')"
        >
          <Icon icon="solar:align-left-bold" width="18" />
          <span>A4 单栏</span>
        </button>
        <button
          type="button"
          class="layout-btn"
          :class="{ active: curPaperType === 'A4DC', disabled: isFinalized }"
          :disabled="isFinalized"
          @click="$emit('change-paper-type', 'A4DC')"
        >
          <Icon icon="solar:align-vertical-center-bold" width="18" />
          <span>A4 双栏</span>
        </button>
        <button
          type="button"
          class="layout-btn"
          :class="{ active: curPaperType === 'A3', disabled: isFinalized }"
          :disabled="isFinalized"
          @click="$emit('change-paper-type', 'A3')"
        >
          <Icon icon="solar:align-bottom-bold" width="18" />
          <span>A3 单栏</span>
        </button>
      </div>

      <div class="panel-section-title">
        <Icon icon="solar:list-bold" width="16" />
        <span>题型顺序</span>
        <span class="sub">拖拽排序</span>
      </div>

      <div class="type-list">
        <div
          v-for="(item, index) in localData"
          :key="item.questionTypeTagName"
          class="type-item"
          :class="{ 'is-drag-over': dragOverTypeIndex === index, 'is-drag-disabled': isFinalized }"
          :draggable="!isFinalized"
          @dragstart="!isFinalized && onTypeDragStart($event, index)"
          @dragover.prevent="!isFinalized && onTypeDragOver(index)"
          @dragleave="!isFinalized && onTypeDragLeave()"
          @drop.prevent="!isFinalized && onTypeDrop($event, index)"
          @dragend="!isFinalized && onTypeDragEnd()"
        >
          <Icon icon="solar:hamburger-menu-bold" width="16" class="drag-handle" />
          <span class="type-name">{{ item.questionTypeTagName }}</span>
          <span class="type-num">{{ item.children.length }}</span>
        </div>
      </div>

      <div class="panel-section-title">
        <Icon icon="solar:bolt-bold" width="16" />
        <span>主要操作</span>
      </div>

      <a-button class="action-primary" type="primary" :disabled="isFinalized" @click="$emit('finalize')">
        <Icon icon="solar:check-circle-bold" width="18" />
        {{ isFinalized ? '已定稿' : '定稿' }}
      </a-button>
      <a-button class="action-secondary" type="default" :disabled="!isFinalized" @click="$emit('download')">
        <Icon icon="solar:download-minimalistic-bold-duotone" width="18" />
        下载文档
      </a-button>

      <!-- <div class="panel-divider"></div> -->

      <!-- <div class="answer-row">
        <div class="answer-text">
          <div class="answer-zh">参考答案</div>
        </div>
        <a-tooltip v-if="!isFinalized" title="定稿后才能选择" placement="top">
          <span>
            <a-switch :disabled="!isFinalized" v-model:checked="innerIsAnswer" />
          </span>
        </a-tooltip>
        <a-switch v-else v-model:checked="innerIsAnswer" />
      </div> -->
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { QuestionBasketRsponse } from '@/api/questionBasket/type'
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  curPaperType: string
  localData: QuestionBasketRsponse[]
  isFinalized: boolean
  isAnswer: boolean
}>()

const emit = defineEmits<{
  'change-paper-type': ['A3' | 'A4' | 'A4DC']
  'update:isAnswer': [boolean]
  'update:localData': [QuestionBasketRsponse[]]
  finalize: []
  download: []
}>()

const dragOverTypeIndex = ref<number | null>(null)
const innerIsAnswer = ref(props.isAnswer)

watch(
  () => props.isAnswer,
  val => {
    innerIsAnswer.value = val
  }
)

watch(innerIsAnswer, val => {
  emit('update:isAnswer', val)
})

const localData = computed(() => props.localData)

const onTypeDragStart = (e: DragEvent, fromIndex: number) => {
  if (!e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('application/x-type-index', String(fromIndex))
}
const onTypeDragOver = (toIndex: number) => {
  dragOverTypeIndex.value = toIndex
}
const onTypeDragLeave = () => {
  dragOverTypeIndex.value = null
}
const onTypeDrop = (e: DragEvent, toIndex: number) => {
  const raw = e.dataTransfer?.getData('application/x-type-index') || ''
  const fromIndex = Number(raw)

  dragOverTypeIndex.value = null

  if (!Number.isFinite(fromIndex)) return
  if (fromIndex === toIndex) return

  const newData = [...props.localData]
  const [removed] = newData.splice(fromIndex, 1)
  if (!removed) return
  newData.splice(toIndex, 0, removed)
  emit('update:localData', newData)
}
const onTypeDragEnd = () => {
  dragOverTypeIndex.value = null
}
</script>

<style scoped lang="less">
.preview-right {
  width: 280px;
  border-left: 1px solid #eef0f3;
  background: #fff;
  padding: 20px;
  overflow-y: auto;

  .panel {
    display: flex;
    flex-direction: column;

    .panel-section-title {
      display: flex;
      align-items: center;
      gap: 6px;
      color: rgb(75 85 99 / 1);
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 10px;

      .sub {
        margin-left: auto;
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
      }
    }

    .layout-toggle {
      border-radius: 12px;
      padding: 6px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 30px;

      .layout-btn {
        height: 36px !important;
        border: 0;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        cursor: pointer;
        color: #6b7280;
        font-weight: 700;
        background: #fff;
        box-shadow: 0 6px 16px rgba(17, 24, 39, 0.12);
      }

      .layout-btn.active {
        color: #ec7a2e;
        border: 1px solid #ec7a2e;
      }

      .layout-btn.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .type-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 30px;

      .type-item {
        display: flex;
        align-items: center;
        gap: 10px;
        height: 38px;
        padding: 0 15px;
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        cursor: move;
        user-select: none;
        transition: all 0.2s;

        &:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        &.is-drag-over {
          border-color: #ec7a2e;
          background: #fef3e9;
          box-shadow: 0 0 0 3px rgba(236, 122, 46, 0.1);
        }

        .drag-handle {
          color: #9ca3af;
          flex-shrink: 0;
        }

        .type-name {
          flex: 1;
          color: #111827;
          font-weight: 600;
          font-size: 13px;
        }

        .type-num {
          color: #ec7a2e;
          background: #fef3e9;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
        }
      }
    }

    .action-primary,
    .action-secondary {
      width: 100%;
      height: 36px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-weight: 700;
      transition: all 0.2s;
      margin-bottom: 10px;
    }

    .action-primary {
      background: #ec7a2e;
      border-color: #ec7a2e;

      &:not(:disabled):hover {
        background: #d96b23;
        border-color: #d96b23;
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(236, 122, 46, 0.3);
      }
    }

    .panel-divider {
      height: 1px;
      margin: 5px 0 10px;
      background: #eef0f3;
    }

    .answer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;

      .answer-text {
        .answer-zh {
          font-size: 14px;
          font-weight: 700;
          color: #111827;
        }
      }
    }
  }
}
</style>
