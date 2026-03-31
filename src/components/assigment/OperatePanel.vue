<template>
  <aside class="tch-mr-right app-surface">
    <div class="panel">
      <div class="title flex-between">
        <span>答题区</span>
        <span class="count">共 {{ answerCount }} 个填空</span>
      </div>

      <div class="panel-list">
        <button
          v-for="i in answerIndexes"
          :key="resolveAreaId(i)"
          type="button"
          class="area"
          :class="[{ active: selectedIndex === i }, statusTone(String(safeGradingItem(i)?.status || ''))]"
          @click="emit('selectArea', i)"
        >
          <span class="left">空{{ resolveAreaId(i) }}</span>
          <span class="right">{{ statusText(String(safeGradingItem(i)?.status || '')) }}</span>
        </button>
      </div>

      <div class="answer-card">
        <div class="label">空{{ resolveAreaId(selectedIndex) }} 的答题内容</div>
        <div class="value">{{ currentAnswer || '-' }}</div>
      </div>
    </div>

    <div class="panel">
      <div class="title">批改判定</div>
      <div class="judge-list">
        <button
          type="button"
          class="judge is-green"
          :class="{ active: currentStatus === 'Correct' }"
          @click="emit('setStatus', 'Correct')"
        >
          <span class="dot">✓</span>
          <span>正确</span>
        </button>
        <button
          type="button"
          class="judge is-orange"
          :class="{ active: currentStatus === 'CorrectAndIncorrect' }"
          @click="emit('setStatus', 'CorrectAndIncorrect')"
        >
          <span class="dot">!</span>
          <span>半对</span>
        </button>
        <button
          type="button"
          class="judge is-red"
          :class="{ active: currentStatus === 'Incorrect' }"
          @click="emit('setStatus', 'Incorrect')"
        >
          <span class="dot">✕</span>
          <span>错误</span>
        </button>
      </div>
    </div>

    <button type="button" class="submit-btn" :disabled="submitting" @click="emit('submit')">
      {{ submitting ? '提交中...' : '确认批改' }}
    </button>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type AreaPoint = { x: number; y: number }
type AnswerArea = { areaId?: string; posList?: AreaPoint[][] }
type GradingItem = { studentAnswer?: string; status?: string; [property: string]: any }

const emit = defineEmits<{
  (e: 'selectArea', index: number): void
  (e: 'setStatus', status: 'Correct' | 'Incorrect' | 'CorrectAndIncorrect'): void
  (e: 'submit'): void
}>()

const props = defineProps<{
  homeworkDetailId: string
  areas: AnswerArea[]
  gradingItems: GradingItem[]
  selectedIndex: number
  submitting: boolean
}>()

// 答题区数量由 areas 决定，确保按钮与答题区一一对应
const answerCount = computed(() => props.areas.length)
const answerIndexes = computed(() => Array.from({ length: answerCount.value }, (_, i) => i))

const resolveAreaId = (i: number) => String(props.areas[i]?.areaId || i + 1)

// 确保 gradingItems 的索引与 panel-list 按钮一一对应
const safeGradingItem = (index: number) => {
  if (index < 0 || index >= props.gradingItems.length) return undefined
  return props.gradingItems[index]
}

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

const currentAnswer = computed(() => String(safeGradingItem(props.selectedIndex)?.studentAnswer || '').trim())
const currentStatus = computed(() => String(safeGradingItem(props.selectedIndex)?.status || '').trim())
</script>

<style scoped lang="less">
.tch-mr-right {
  min-height: 0;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  gap: 14px;
}

.title {
  font-weight: 700;
  color: rgba(17, 24, 39, 0.55);
  letter-spacing: 1px;
  font-size: 12px;
  padding-bottom: 15px;
}

.sub-title {
  font-size: 12px;
  color: rgba(17, 24, 39, 0.45);
  padding-bottom: 12px;
}

.panel {
  .count {
    font-size: 12px;
    color: rgba(17, 24, 39, 0.45);
    font-weight: 700;
  }

  .panel-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .area {
    height: 44px;
    border-radius: 8px;
    border: 1px solid #d9d9d9;
    background: var(--color-bg-soft, rgb(248, 250, 252));
    padding: 0 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: 800;
    color: rgba(15, 23, 42, 0.85);

    &.active {
      border-width: 2px;
    }

    &.is-correct {
      border-color: rgba(16, 185, 129, 0.45);

      .right {
        color: var(--color-review-wrong-text);
      }
    }

    &.is-half {
      border-color: rgba(251, 191, 36, 0.55);

      .right {
        color: var(--color-review-half-text);
      }
    }

    &.is-wrong {
      border-color: rgba(239, 68, 68, 0.45);
    }

    .right {
      font-size: 12px;
      font-weight: 800;
      color: rgba(71, 85, 105, 0.85);
    }
  }

  .answer-card {
    margin-top: 12px;
    border-radius: 8px;
    border: 1px solid rgba(242, 235, 230, 1);
    background: rgba(255, 255, 255, 0.96);
    padding: 12px;

    .label {
      font-size: 12px;
      font-weight: 800;
      color: rgba(17, 24, 39, 0.55);
    }

    .value {
      margin-top: 8px;
      font-size: 28px;
      font-weight: 700;
      color: rgba(15, 23, 42, 0.9);
      word-break: break-word;
    }
  }

  .judge-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .judge {
    width: 100%;
    height: 54px;
    border-radius: 10px;
    border: 1px solid rgba(242, 235, 230, 1);
    background: rgba(255, 255, 255, 0.96);
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    cursor: pointer;
    font-weight: 700;
    color: rgba(15, 23, 42, 0.85);

    .dot {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
    }

    &.is-green {
      &.active {
        border-color: rgba(16, 185, 129, 0.5);
      }
      .dot {
        background: var(--color-review-correct-bg);
        color: var(--color-review-correct-text);
      }
    }

    &.is-orange {
      &.active {
        border-color: rgba(251, 191, 36, 0.5);
      }

      .dot {
        background: var(--color-review-half-bg);
        color: var(--color-review-half-text);
      }
    }

    &.is-red {
      &.active {
        border-color: var(--color-border-error, rgba(239, 68, 68, 0.5));
      }
      .dot {
        background: var(--color-review-wrong-bg);
        color: var(--color-review-wrong-text);
      }
    }
  }
}

.submit-btn {
  margin-top: auto;
  height: 56px;
  border-radius: 18px;
  border: none;
  background: rgba(236, 122, 46, 0.95);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

// .actions {
//   width: 100%;
//   margin-top: 40px;

//   .submit-btn {
//     width: 100%;
//     height: 44px;
//     font-weight: 700;
//     display: flex;
//     justify-content: center;
//   }
// }
</style>
