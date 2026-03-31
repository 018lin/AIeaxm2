<template>
  <div class="question-list">
    <div
      v-for="(item, index) in pageList"
      :key="item.id"
      class="question-card"
      :class="{ 'is-drag-over': overIndex === index, 'is-drag-disabled': isFinalized }"
      :draggable="!isFinalized"
      :data-question-id="item.questionId"
      @dragstart="!isFinalized && onDragStart($event, index)"
      @dragover.prevent="!isFinalized && onDragOver(index)"
      @dragleave="!isFinalized && onDragLeave()"
      @drop.prevent="!isFinalized && onDrop($event, index)"
      @dragend="!isFinalized && onDragEnd()"
    >
      <div class="question-area">
        <!-- 题号 -->
        <div class="question-num">{{ (startNo || 1) + index }}.</div>
        <!-- 统一最大高度，保持字体大小一致且不失真 -->
        <img class="question-img" :src="item.questionsUrl" alt="题目图片" draggable="false" />
      </div>
      <!-- 应用题预留答题区域 -->
      <!-- <div v-if="item.questionTypeTagId == '25' || item.questionTypeTagId == '26'" class="answer-area"></div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuestionBasketItem } from '@/api/questionBasket/type'
import { ref } from 'vue'

const props = defineProps<{
  isFinalized: boolean
  pageList: QuestionBasketItem[]
  paperType: string
  startNo?: number
}>()
const emit = defineEmits<{ move: [{ from: number; to: number }] }>()

const overIndex = ref<number | null>(null)

// 开始拖拽
const onDragStart = (e: DragEvent, fromIndex: number) => {
  if (!e.dataTransfer) return
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('application/x-preview-exam-index', String(fromIndex))
}
// 拖拽经过
const onDragOver = (toIndex: number) => {
  overIndex.value = toIndex
}
// 拖拽离开
const onDragLeave = () => {
  overIndex.value = null
}
// 拖拽结束放下
const onDrop = (e: DragEvent, toIndex: number) => {
  const raw = e.dataTransfer?.getData('application/x-preview-exam-index') || ''
  const fromIndex = Number(raw)

  overIndex.value = null

  if (!Number.isFinite(fromIndex)) return
  if (fromIndex === toIndex) return

  emit('move', { from: fromIndex, to: toIndex })
}
// 拖拽结束
const onDragEnd = () => {
  overIndex.value = null
}
</script>

<style scoped lang="less">
.question-list {
  display: flex;
  flex-direction: column;
}

.question-card {
  background: #fff;
  overflow: hidden;
  cursor: move;
  user-select: none;
  transition: all 0.2s;
  padding: 0 10px 15px;
  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
    border: 2px solid #e5e7eb;
  }

  &.is-drag-over {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(236, 122, 46, 0.15);
    transform: scale(1.01);
  }

  .question-area {
    display: flex;
    align-items: flex-start;
    .question-num {
      color: #000;
      font-weight: 600;
      font-size: 16px;
      flex-shrink: 0;
      padding-right: 5px;
    }

    .question-img {
      width: 90%; // 统一宽度，保持字体大小一致
      height: auto;
      max-height: 880px;
      display: block;
      border-radius: 8px;
      object-fit: contain;
      image-rendering: -webkit-optimize-contrast; // 提高缩放后的清晰度
      image-rendering: crisp-edges;
    }
  }

  // .answer-area {
  //   width: 100%;
  //   height: 100px;
  // }
}
</style>
