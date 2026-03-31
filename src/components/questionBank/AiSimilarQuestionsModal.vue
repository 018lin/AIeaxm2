<template>
  <a-modal
    :open="open"
    centered
    :footer="null"
    :width="860"
    wrap-class-name="ai-similar-modal"
    @update:open="emit('update:open', $event)"
  >
    <template #title>
      <div class="ai-similar-title">
        <span class="ai-similar-title-icon"><BulbOutlined /></span>
        <div class="ai-similar-title-text">
          <div class="ai-similar-title-main">AI生成类似题</div>
        </div>
      </div>
    </template>

    <div class="ai-similar">
      <div class="ai-similar-list">
        <div v-for="item in similarQuestions" :key="item.key" class="ai-similar-card">
          <div class="ai-similar-card-left">
            <div class="ai-similar-pill">SIMILAR</div>
            <div class="ai-similar-card-title">{{ item.title }}</div>
            <div class="ai-similar-card-stem">“{{ item.stem }}”</div>
            <div class="ai-similar-card-meta">
              <span class="ai-similar-meta-item">难度：{{ item.difficulty }}</span>
              <span class="ai-similar-meta-dot">·</span>
              <span class="ai-similar-meta-item">题型：{{ item.type }}</span>
            </div>
          </div>

          <div class="ai-similar-card-actions">
            <a-button class="ai-similar-btn primary-btn-light" @click="emit('add-to-draft', item)">加入题库</a-button>
          </div>
        </div>
      </div>

      <div class="ai-similar-footer">
        <div class="ai-similar-footer-left">AI 正在基于您的知识点不断优化题目质量…</div>
        <div class="ai-similar-footer-right">
          <a-button class="ai-similar-footer-cancel" @click="emit('update:open', false)">取消</a-button>
          <a-button type="primary" class="ai-similar-footer-regenerate" @click="regenerate">重新生成</a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { BulbOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'

type AiSimilarItem = {
  key: string
  title: string
  stem: string
  type: string
  difficulty: string
}

const props = defineProps<{
  open: boolean
  baseQuestion: any
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'add-to-basket', item: AiSimilarItem): void
  (e: 'add-to-draft', item: AiSimilarItem): void
  (e: 'regenerate'): void
}>()

const similarQuestions = ref<AiSimilarItem[]>([])

const buildSimilarQuestions = (record: any) => {
  const type = String(record?.type || '选择题')
  const difficulty = String(record?.difficulty || '中等')
  const baseStem = String(record?.content || '')

  const stems = [
    baseStem || '在光合作用的实验中，若将叶片的一半遮光，另一半曝光，这主要体现了实验设计的哪一原则？',
    '下列关于细胞呼吸的叙述中，正确的是：A. 无氧呼吸产生二氧化碳… B. 有氧呼吸在线粒体中进行…',
    '根据达尔文的自然选择学说，长颈鹿颈部长度的变化是由于：A. 用进废退… B. 定向变异…',
  ]

  const baseKey = String(record?.key || 'q')
  return stems.map((stem, idx) => ({
    key: `${baseKey}-ai-${idx + 1}`,
    title: `${type}（相似生成）`,
    stem,
    type,
    difficulty,
  }))
}

const regenerate = () => {
  const base = props.baseQuestion
  if (!base) return
  similarQuestions.value = buildSimilarQuestions(base).sort(() => Math.random() - 0.5)
  emit('regenerate')
}

watch(
  () => [props.open, props.baseQuestion],
  ([open, base]) => {
    if (!open) return
    if (!base) {
      similarQuestions.value = []
      return
    }
    similarQuestions.value = buildSimilarQuestions(base)
  },
  { immediate: true }
)
</script>

<style lang="scss">
.ai-similar-modal {
  .ant-modal-content {
    border-radius: 20px;
    overflow: hidden;
    padding: 0;
  }

  .ant-modal-header {
    margin: 0;
    padding: 18px 22px;
    border-bottom: 1px solid rgb(242, 235, 230);
  }

  .ant-modal-body {
    padding: 0;
  }
}

.ai-similar-title {
  display: flex;
  align-items: center;
  gap: 10px;

  &-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: rgba(255, 122, 41, 0.12);
    color: #ff7a29;
  }

  &-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &-main {
    font-size: 18px;
    font-weight: 700;
    color: rgb(60, 55, 51);
    line-height: 1.1;
  }

  &-sub {
    font-size: 12px;
    color: rgb(122, 115, 110);
  }
}

.ai-similar {
  background: #f8f7f6;
  padding: 18px 22px 14px;

  display: flex;
  flex-direction: column;
  gap: 14px;

  max-height: 72vh;
  overflow: hidden;
}

.ai-similar-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-right: 4px;
}

.ai-similar-card {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 16px;

  background: rgba(250, 250, 249, 0.5);
  border: 1px solid #eae2db;
  box-shadow:
    0 4px 20px -4px rgba(60, 55, 51, 0.08),
    0 2px 8px -2px rgba(60, 55, 51, 0.04);
  border-radius: 14px;
  padding: 16px;

  &-left {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &-actions {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
    justify-content: center;
  }

  &-title {
    font-weight: 700;
    color: rgb(60, 55, 51);
    font-size: 14px;
  }

  &-stem {
    color: rgb(122, 115, 110);
    font-size: 13px;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgb(122, 115, 110);
    font-size: 12px;
  }
}

.ai-similar-pill {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.6px;
  background: rgba(255, 122, 41, 0.12);
  color: #ff7a29;
  width: fit-content;
}

.ai-similar-meta-dot {
  opacity: 0.7;
}

.ai-similar-btn {
  height: 38px;
}

.ai-similar-footer {
  padding-top: 14px;
  border-top: 1px solid rgb(242, 235, 230);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  &-left {
    font-size: 12px;
    color: rgb(140 109 93 / 1);
    font-style: italic;
    opacity: 0.9;
  }

  &-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &-cancel {
    border-radius: 10px;
    height: 36px;
  }

  &-regenerate {
    border-radius: 10px;
    height: 36px;
    background: rgb(60, 55, 51);
    border-color: rgb(60, 55, 51);
  }
}
</style>
