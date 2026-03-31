<template>
  <div v-if="open" class="view-question-modal-mask">
    <div class="view-question-modal-container">
      <!-- Header -->
      <div class="modal-header flex-between">
        <div class="header-left flex items-center gap-10">
          <Icon icon="solar:document-text-bold" class="header-icon" />
          <span class="header-title">查看试题</span>
        </div>
        <div class="header-right flex items-center gap-lg">
          <div class="close-btn flex items-center" @click="handleClose">
            <Icon icon="material-symbols:close-rounded" width="24" />
          </div>
        </div>
      </div>

      <!-- Info Bar -->
      <div class="info-bar">
        <div class="info-content">
          <div class="info-item">
            <span class="label">试卷名称</span>
            <span class="value main-title">{{ paper?.title || '2024-2025学年一年级上学期随堂练习数学试卷' }}</span>
          </div>
          <div class="info-item">
            <span class="label">学科</span>
            <span class="value dot-value"><span class="dot"></span>{{ paper?.subject || '数学' }}</span>
          </div>
          <div class="info-item">
            <span class="label">年级 / 学期</span>
            <span class="value">{{ paper?.grade || '一年级' }} · {{ paper?.semester || '上学期' }}</span>
          </div>
          <div class="info-item">
            <span class="label">试卷类型</span>
            <span class="tag">同步</span>
          </div>
        </div>
      </div>

      <!-- Content Area -->
      <div class="modal-content-list">
        <a-spin :spinning="loading">
          <a-empty
            v-if="!loading && paginatedQuestions.length === 0"
            :image="Empty.PRESENTED_IMAGE_SIMPLE"
            description="暂无试题"
          />
          <div v-else v-for="(q, index) in paginatedQuestions" :key="q.questionId" class="question-card">
            <!-- Tags -->
            <div class="card-tags">
              <!-- <span class="tag-pill is-purple">{{ q.type }}</span>
            <span class="tag-pill is-green">{{ q.difficulty }}</span> -->
              <span v-for="tag in q.tags" :key="tag.tagId" class="tag-pill is-blue">{{ tag.tagName }}</span>
            </div>

            <!-- Content -->
            <div class="card-body">
              <div class="question-stem">
                <span class="q-index">{{ (currentPage - 1) * pageSize + index + 1 }}.</span>
                <div v-if="q.questionsUrl" class="q-image">
                  <img :src="q.questionsUrl" alt="Question Image" />
                </div>
                <div v-else class="q-text">暂无内容</div>
              </div>
              <!-- <div class="question-options">
              <div v-for="opt in q.options" :key="opt" class="option-item">{{ opt }}</div>
            </div> -->
            </div>

            <!-- Footer -->
            <div class="card-footer flex-between items-center">
              <div class="footer-left flex gap-lg">
                <div class="meta-item flex items-center gap-xs">
                  <Icon icon="solar:clock-circle-linear" width="14" />
                  <span>上传时间：{{ paper?.date }}</span>
                </div>
                <div class="meta-item flex items-center gap-xs">
                  <Icon icon="solar:user-linear" width="14" />
                  <span>来源：{{ paper?.uploader }}</span>
                </div>
              </div>
              <div class="footer-right">
                <div class="action-btn">
                  <Icon icon="solar:pen-new-square-linear" width="16" />
                  <span>编辑</span>
                </div>
                <div class="action-btn">
                  <Icon icon="solar:lightbulb-linear" width="16" />
                  <span>解析</span>
                </div>
                <!-- 暂时不要
                <div class="action-btn">
                  <Icon icon="solar:copy-linear" width="16" />
                  <span>相似题</span>
                </div>
                <div class="action-btn">
                  <Icon icon="solar:chart-square-linear" width="16" />
                  <span>统计</span>
                </div> -->
                <div class="action-btn delete">
                  <Icon icon="solar:trash-bin-trash-linear" width="16" />
                </div>
              </div>
            </div>
          </div>
        </a-spin>
      </div>

      <!-- Pagination -->
      <div class="modal-footer">
        <div class="pagination-info">共 {{ totalQuestions }} 条数据，每页显示</div>
        <div class="pagination-select">
          {{ pageSize }} 条/页
          <Icon icon="solar:alt-arrow-down-linear" width="12" />
        </div>
        <div class="pagination-controls">
          <button class="page-btn prev" :disabled="currentPage === 1" @click="handlePageChange(currentPage - 1)">
            <Icon icon="solar:alt-arrow-left-linear" width="14" />
          </button>

          <template v-for="page in displayedPageNumbers" :key="page">
            <button
              v-if="page !== '...'"
              class="page-btn"
              :class="{ active: currentPage === page }"
              @click="handlePageChange(Number(page))"
            >
              {{ page }}
            </button>
            <span v-else class="page-ellipsis">...</span>
          </template>

          <button
            class="page-btn next"
            :disabled="currentPage === totalPages"
            @click="handlePageChange(currentPage + 1)"
          >
            <Icon icon="solar:alt-arrow-right-linear" width="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { queryQuestionBankDetailViewQuestion } from '@/api/questionBank'
import type { QuestionPreviewVO } from '@/api/questionBank/type'
import { Icon } from '@iconify/vue'
import { Empty } from 'ant-design-vue'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  paper?: any
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const handleClose = () => {
  emit('update:open', false)
}

const loading = ref(false)
const questions = ref<QuestionPreviewVO[]>([])

// Pagination
const currentPage = ref(1)
const pageSize = ref(10)

const totalQuestions = computed(() => questions.value.length)
const totalPages = computed(() => Math.ceil(totalQuestions.value / pageSize.value))

const paginatedQuestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return questions.value.slice(start, end)
})

const displayedPageNumbers = computed(() => {
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | string)[] = [1]
  let startPage = current - 1
  let endPage = current + 1

  if (current <= 4) {
    startPage = 2
    endPage = 5
  } else if (current >= total - 3) {
    startPage = total - 4
    endPage = total - 1
  }

  if (startPage > 2) pages.push('...')

  for (let i = startPage; i <= endPage; i++) {
    if (i > 1 && i < total) {
      pages.push(i)
    }
  }

  if (endPage < total - 1) pages.push('...')

  if (total > 1) pages.push(total)

  return pages
})

const handlePageChange = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const fetchQuestions = async () => {
  const detailId = props.paper?.detailId || props.paper?.paperId || props.paper?.raw?.detailId

  if (!detailId) return

  loading.value = true
  try {
    const res = await queryQuestionBankDetailViewQuestion(detailId)
    if (res?.questionList) {
        questions.value = res.questionList
        currentPage.value = 1
      }
  } catch (error) {
    console.error('Failed to fetch questions:', error)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  newVal => {
    if (newVal) {
      fetchQuestions()
    }
  }
)
</script>

<style scoped lang="scss">
.view-question-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-question-modal-container {
  width: 90%;
  height: 100%;
  max-width: 1000px;
  max-height: 90vh;
  background: #f5f7fa;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.modal-header {
  height: 60px;
  background: #fff;
  padding: 0 20px;
  border-bottom: 1px solid #eef0f3;
  flex-shrink: 0;
}

.header-left {
  .header-icon {
    color: #ff8e36;
    font-size: 24px;
  }

  .header-title {
    font-size: 18px;
    font-weight: 700;
    color: #333;
  }
}

.header-right {
  .close-btn {
    cursor: pointer;
    color: #999;

    &:hover {
      color: #333;
    }
  }
}

.info-bar {
  background: #fff;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eef0f3;
  flex-shrink: 0;

  .info-content {
    display: flex;
    align-items: center;
    gap: 40px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .label {
      font-size: 12px;
      color: #999;
    }

    .value {
      font-size: 14px;
      color: #333;
      font-weight: 600;

      &.main-title {
        font-size: 16px;
      }

      &.dot-value {
        display: flex;
        align-items: center;
        gap: 6px;

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #3b82f6;
        }
      }
    }

    .tag {
      font-size: 12px;
      color: #ff8e36;
      background: #fff7ec;
      padding: 2px 8px;
      border-radius: 4px;
      width: fit-content;
    }
  }
}

.modal-content-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
}

.card-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  .tag-pill {
    font-size: 12px;
    padding: 2px 10px;
    border-radius: 4px;
    font-weight: 500;

    &.is-purple {
      color: #8b5cf6;
      background: #f5f3ff;
    }
    &.is-green {
      color: #10b981;
      background: #ecfdf5;
    }
    &.is-blue {
      color: #3b82f6;
      background: #eff6ff;
    }
  }
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .question-stem {
    display: flex;
    gap: 8px;
    font-size: 15px;
    color: #333;
    line-height: 1.6;

    .q-index {
      font-weight: 700;
      color: #ff8e36;
      flex-shrink: 0;
    }

    .q-image {
      max-width: 500px;
      img {
        max-width: 100%;
        height: auto;
        display: block;
        border-radius: 4px;
      }
    }
  }
}

.card-footer {
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  color: #94a3b8;
  font-size: 13px;

  .footer-left {
    /* styles replaced by utility classes */
  }

  .footer-right {
    display: flex;
    gap: 16px;

    .action-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      color: #64748b;
      transition: color 0.2s;

      &:hover {
        color: #333;
      }

      &.delete {
        color: #94a3b8;
        margin-left: 8px;

        &:hover {
          color: #ef4444;
        }
      }
    }
  }
}

.modal-footer {
  height: 56px;
  background: #fff;
  border-top: 1px solid #eef0f3;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  font-size: 13px;
  color: #64748b;
  flex-shrink: 0;

  .pagination-select {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid #e2e8f0;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
  }

  .pagination-controls {
    display: flex;
    gap: 8px;

    .page-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      background: #fff;
      color: #64748b;
      cursor: pointer;
      font-size: 13px;

      &:hover:not(:disabled) {
        border-color: #ff8e36;
        color: #ff8e36;
      }

      &.active {
        background: #ff8e36;
        border-color: #ff8e36;
        color: #fff;
      }

      &:disabled {
        background: #f8fafc;
        color: #cbd5e1;
        cursor: not-allowed;
        border-color: #e2e8f0;
      }
    }

    .page-ellipsis {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      width: 20px;
    }
  }
}
</style>
