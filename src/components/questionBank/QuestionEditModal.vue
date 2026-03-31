<template>
  <a-modal
    :open="open"
    title="编辑题目"
    centered
    width="800px"
    wrap-class-name="question-edit-modal"
    @update:open="$emit('update:open', $event)"
  >
    <div class="edit-container">
      <!-- Header Card -->
      <div class="edit-card header-card">
        <div class="header-item">
          <div class="header-label">学科</div>
          <a-select :default-value="question.subject" class="w-full">
            <a-select-option value="数学">数学</a-select-option>
          </a-select>
        </div>
        <div class="header-item">
          <div class="header-label">题型</div>
          <a-select :default-value="question.type" class="w-full">
            <a-select-option value="解答题">解答题</a-select-option>
          </a-select>
        </div>
        <div class="header-item">
          <div class="header-label">难度</div>
          <a-select :default-value="question.difficulty" class="w-full">
            <a-select-option value="基础">基础</a-select-option>
          </a-select>
        </div>
      </div>

      <!-- Question Stem Card -->
      <div class="edit-card">
        <div class="card-title">
          <span>题干</span>
        </div>
        <img src="../../assets/images/topic8.png" alt="题目图片" style="max-width: 100%; border-radius: 4px" />
      </div>

      <!-- Knowledge Points Card -->
      <div class="edit-card">
        <div class="card-title">
          <span>知识点</span>
        </div>
        <div class="tags">
          <span v-for="tag in knowledgeTags" :key="tag" class="tag">
            {{ tag }}
            <span class="close-icon" @click="removeKnowledgeTag(tag)">×</span>
          </span>
          <a-input
            v-if="newTagInputVisible"
            ref="newTagInput"
            v-model:value="newTagValue"
            size="small"
            class="tag-input"
            @blur="handleNewTagConfirm"
            @keyup.enter="handleNewTagConfirm"
          />
          <button v-else class="add-tag-btn" @click="showNewTagInput">+ 添加知识点</button>
        </div>
      </div>

      <!-- Answer Card -->
      <div class="edit-card">
        <div class="card-title">
          <span>正确答案</span>
        </div>
        <a-textarea :default-value="question.answer" :rows="3" />
      </div>

      <!-- Analysis Card -->
      <div class="edit-card">
        <div class="card-title">
          <span>解析思路</span>
        </div>
        <a-textarea :rows="4" />
      </div>
    </div>
    <template #footer>
      <a-button size="large">预览</a-button>
      <a-button type="primary" size="large">保存</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'

defineProps<{
  open: boolean
  question: any
}>()

defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

// --- Knowledge Point Tags ---
const knowledgeTags = ref(['二次函数', '函数最值', '配方法'])
const newTagInputVisible = ref(false)
const newTagValue = ref('')
const newTagInput = ref<HTMLInputElement | null>(null)

const removeKnowledgeTag = (tagToRemove: string) => {
  knowledgeTags.value = knowledgeTags.value.filter(tag => tag !== tagToRemove)
}

const showNewTagInput = () => {
  newTagInputVisible.value = true
  nextTick(() => {
    newTagInput.value?.focus()
  })
}

const handleNewTagConfirm = () => {
  if (newTagValue.value && !knowledgeTags.value.includes(newTagValue.value)) {
    knowledgeTags.value.push(newTagValue.value)
  }
  newTagInputVisible.value = false
  newTagValue.value = ''
}
</script>

<style lang="scss">
.question-edit-modal {
  .ant-modal-content {
    background-color: #f8f7f6;
    padding: 0;
    border-radius: 8px;
  }
  .ant-modal-header {
    background: transparent;
    border-bottom: 1px solid rgb(242, 235, 230);
    margin: 0 20px;
    padding: 20px 0;
  }
  .ant-modal-title {
    text-align: center;
    color: rgb(122 115 110);
    font-weight: 500;
  }
  .ant-modal-body {
    padding: 20px;
    max-height: 74vh;
    overflow-y: auto;
  }
  .ant-modal-close {
    top: 22px;
    right: 30px;
    color: #999;
  }

  .edit-container {
    font-family: 'Noto Sans SC', sans-serif;
  }

  .edit-card {
    background-color: #fff;
    border-radius: 8px;
    padding: 24px;
    border: 1px solid #eae2db;
    box-shadow:
      0 4px 20px -4px rgba(60, 55, 51, 0.08),
      0 2px 8px -2px rgba(60, 55, 51, 0.04);
    margin-bottom: 16px;
  }

  .header-card {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 20px 24px;

    .header-label {
      font-size: 12px;
      color: #888;
      margin-bottom: 8px;
    }
  }

  .card-title {
    font-size: 13px;
    color: #888;
    margin-bottom: 12px;
  }

  .stem-textarea {
    font-size: 16px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;

    .tag {
      display: flex;
      align-items: center;
      background-color: #f5f5f5;
      color: #555;
      font-size: 13px;
      padding: 5px 10px;
      border-radius: 4px;
      border: 1px solid #e0e0e0;

      .close-icon {
        margin-left: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
      }
    }

    .add-tag-btn {
      background: none;
      border: 1px dashed #ccc;
      border-radius: 4px;
      color: #888;
      padding: 5px 15px;
      cursor: pointer;
      font-size: 13px;
      &:hover {
        border-color: var(--color-primary);
        color: var(--color-primary);
      }
    }
    .tag-input {
      width: 100px;
    }
  }

  .ant-modal-footer {
    padding: 16px 24px;
    border-top: 1px solid rgb(242, 235, 230);
    background: transparent;
  }
}
</style>
