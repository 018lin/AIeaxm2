<template>
  <div class="mistake-detail flex h-full gap-lg">
    <!-- Left Sidebar -->
    <aside class="sidebar app-surface flex-col">
      <div class="sidebar-header">
        <div class="sidebar-title">
          <Icon icon="ph:users-three-bold" class="sidebar-title-icon" width="24" />
          学生列表
        </div>
        <a-input v-model:value="searchText" placeholder="搜索学生..." class="search-input">
          <template #prefix>
            <Icon icon="ph:magnifying-glass" />
          </template>
        </a-input>
      </div>

      <div class="student-list custom-scrollbar">
        <div
          v-for="student in filteredStudents"
          :key="student.id"
          class="student-item"
          :class="{ active: currentStudentId === student.id }"
          @click="selectStudent(student.id)"
        >
          <div class="student-row flex-between">
            <span class="student-name">{{ student.name }}</span>
            <span class="student-id">{{ student.studentId }}</span>
          </div>
          <div class="progress-wrapper">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: student.progress + '%' }"></div>
            </div>
            <span class="progress-text">{{ student.progress }}%</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- Right Content -->
    <main class="main-content app-surface flex-col flex-1">
      <!-- Header -->
      <header class="content-header">
        <div class="header-left">
          <button type="button" class="back-btn" @click="router.back()">
            <Icon icon="ph:arrow-left-bold" width="20" />
          </button>
          <a-breadcrumb>
            <a-breadcrumb-item>消灭错题统计</a-breadcrumb-item>
            <a-breadcrumb-item>学期数据</a-breadcrumb-item>
            <a-breadcrumb-item>西安高新第八小学 - 六年级-01-数学</a-breadcrumb-item>
          </a-breadcrumb>
        </div>
      </header>

      <!-- Scrollable Body -->
      <div class="content-body custom-scrollbar">
        <!-- Date Filter -->
        <div class="date-filter">
          <div class="date-tabs">
            <button
              v-for="date in dates"
              :key="date.value"
              class="date-tab"
              :class="{ 'is-active': currentDate === date.value }"
              type="button"
              @click="currentDate = date.value"
            >
              {{ date.label }}
            </button>
          </div>
          <a-button class="custom-date-btn">
            <Icon icon="ph:calendar-blank" />
            自定义日期
          </a-button>
        </div>

        <!-- Tip Banner -->
        <div class="tip-banner">
          <Icon icon="ph:lightbulb-fill" width="20" />
          <span>温馨提示：点击学生的作答区域，可以手动修改批改结果。</span>
        </div>

        <!-- Questions Grid -->
        <div class="questions-grid">
          <div v-for="q in questions" :key="q.id" class="question-card">
            <div class="card-header">
              <span class="q-idx">题号 {{ q.no }}</span>
              <span class="status-tag" :class="statusClass(q.status)">
                {{ statusText(q.status) }}
              </span>
            </div>

            <div class="card-body">
              <div class="q-content">{{ q.content }}</div>

              <div class="answer-area">
                <div class="answer-label">学生作答：</div>
                <div class="answer-text" :class="{ 'is-handwriting': q.status === 'pending' }">
                  {{ q.studentAnswer }}
                </div>

                <!-- Analysis if wrong -->
              <div v-if="q.status === 'wrong'" class="analysis">
                  <span class="analysis-label">解析：</span>{{ q.analysis || q.correctAnswer || '-' }}
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="grading-actions" v-if="q.status === 'pending'">
                <button type="button" class="action-btn is-check">
                  <Icon icon="ph:check-bold" width="16" />
                </button>
                <button type="button" class="action-btn is-cross">
                  <Icon icon="ph:x-bold" width="16" />
                </button>
              </div>

              <span class="timestamp"> <Icon icon="ph:clock" /> {{ q.time }} </span>
            </div>
          </div>

          <a-empty v-if="!questions.length" description="暂无错题数据" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { getMistakeDetail, getMistakeStudentStatistics, type MistakeDetailQuestion } from '@/api/mistakes'
import { Icon } from '@iconify/vue'
import { message } from 'ant-design-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const searchText = ref('')
const currentStudentId = ref<string>(String(route.params.studentId || route.params.id || ''))
const currentDate = ref('all')

const students = ref<{ id: string; name: string; studentId: string; progress: number }[]>([])
const dates = ref([{ label: '全部日期', value: 'all' }])
const questions = ref<MistakeDetailQuestion[]>([])

const filteredStudents = computed(() => {
  if (!searchText.value) return students.value
  return students.value.filter(s => s.name.includes(searchText.value) || s.studentId.includes(searchText.value))
})

const selectStudent = (id: string) => {
  currentStudentId.value = id
}

function calcProgress(row: any) {
  const total = Number(row.destroy || 0) + Number(row.redo || 0) + Number(row.wrongTotal || 0)
  if (!total) return 0
  return Math.round((Number(row.destroy || 0) / total) * 100)
}

async function fetchStudents() {
  try {
    const res = await getMistakeStudentStatistics()
    students.value = (res || []).map(row => ({
      id: String(row.id),
      name: String(row.name || row.id),
      studentId: String(row.id),
      progress: calcProgress(row),
    }))
    if (!currentStudentId.value && students.value.length) currentStudentId.value = students.value[0].id
  } catch (e: any) {
    students.value = []
    message.error(e?.message || '获取学生错题统计失败')
  }
}

async function fetchDetail() {
  if (!currentStudentId.value) {
    questions.value = []
    dates.value = [{ label: '全部日期', value: 'all' }]
    return
  }
  try {
    const res = await getMistakeDetail({ studentId: currentStudentId.value, date: currentDate.value })
    questions.value = res?.questions || []
    dates.value = res?.dates?.length ? res.dates : [{ label: '全部日期', value: 'all' }]
  } catch (e: any) {
    questions.value = []
    message.error(e?.message || '获取错题详情失败')
  }
}

watch([currentStudentId, currentDate], () => {
  fetchDetail().catch(() => {})
})

onMounted(async () => {
  await fetchStudents()
  await fetchDetail()
})

const statusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待批改',
    correct: '正确',
    wrong: '错误',
  }
  return map[status]
}

const statusClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'is-pending',
    correct: 'is-correct',
    wrong: 'is-wrong',
  }
  return map[status]
}
</script>

<style scoped lang="scss">
.sidebar {
  width: 280px;
  flex: 0 0 auto;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.sidebar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.92);
  margin-bottom: 12px;
}

.sidebar-title-icon {
  color: #fa8c16;
}

.search-input :deep(.ant-input-affix-wrapper) {
  height: 36px;
  border-radius: 999px;
  background: rgba(241, 245, 249, 1);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.student-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 6px 0;
}

.student-item {
  margin: 6px 10px;
  padding: 16px 14px;
  border-radius: 12px;
  border-left: 4px solid transparent;
  cursor: pointer;
  transition:
    background 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.student-item:hover {
  background: #f8f7f6;

  .progress-fill {
    background: rgb(236 122 46 / 0.4);
  }
}

.student-item.active {
  border-left-color: #fa8c16;
  background: rgb(236 122 46 / 0.1);
  border-left-width: 4px;
}

.student-row {
  margin-bottom: 10px;
}

.student-name {
  font-weight: 700;
  color: rgba(15, 23, 42, 0.9);
}

.student-item.active .student-name {
  color: #fa8c16;
}

.student-id {
  font-size: 12px;
  color: rgba(140, 109, 93, 0.8);
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex: 1;
  height: 6px;
  border-radius: 999px;
  background: rgb(242, 235, 230);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: rgb(140 109 93 / 0.5);
}

.student-item.active .progress-fill {
  background: #fa8c16;
}

.progress-text {
  width: 40px;
  text-align: right;
  font-size: 12px;
  font-weight: 700;
  color: rgba(140, 109, 93, 0.8);
}

.main-content {
  background: #fbf7f2;
  overflow: hidden;
}

.content-header {
  background: #fff;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03);
}

.content-header :deep(.ant-breadcrumb) {
  white-space: nowrap;
}

.content-header :deep(.ant-breadcrumb-link) {
  color: rgba(100, 116, 139, 1);
  font-weight: 700;
}

.content-header :deep(.ant-breadcrumb > span:last-child .ant-breadcrumb-link) {
  color: rgba(15, 23, 42, 0.92);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.back-btn {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.back-btn:hover {
  background: rgba(15, 23, 42, 0.04);
}

.icon-btn {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: rgba(15, 23, 42, 0.04);
}

.header-avatar {
  background: #fa8c16;
}

.content-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 18px 20px 28px;
}

.date-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.date-tabs {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  position: relative;
  padding-right: 18px;
}

.date-tabs::after {
  content: '';
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 26px;
  background: rgba(15, 23, 42, 0.08);
}

.date-tab {
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  border: 0;
  background: rgba(241, 245, 249, 1);
  color: rgba(71, 85, 105, 0.92);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.date-tab:hover {
  background: rgba(226, 232, 240, 1);
}

.date-tab.is-active {
  background: var(--primary-color);
  color: #fff;
}

.custom-date-btn {
  height: 36px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  padding: 0 14px;
}

.custom-date-btn :deep(span) {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.tip-banner {
  margin-bottom: 16px;
  padding: 14px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fff4e8;
  border: 1px solid rgba(250, 140, 22, 0.18);
  color: rgba(234, 88, 12, 0.95);
}

.tip-banner :deep(.iconify) {
  color: rgba(251, 146, 60, 1);
}

.tip-banner span {
  font-size: 13px;
  font-weight: 700;
}

.questions-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  align-items: start;
}

@media (max-width: 1200px) {
  .questions-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .questions-grid {
    grid-template-columns: 1fr;
  }
}

.question-card {
  background: #fff;
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.q-idx {
  font-size: 12px;
  font-weight: 700;
  color: rgba(71, 85, 105, 0.92);
}

.status-tag {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
}

.status-tag.is-pending {
  background: rgba(255, 237, 213, 1);
  color: rgba(234, 88, 12, 1);
}

.status-tag.is-correct {
  background: rgba(220, 252, 231, 1);
  color: rgba(22, 163, 74, 1);
}

.status-tag.is-wrong {
  background: rgba(254, 226, 226, 1);
  color: rgba(220, 38, 38, 1);
}

.card-body {
  flex: 1;
}

.q-content {
  font-size: 13px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.92);
  line-height: 1.6;
  margin-bottom: 12px;
}

.answer-area {
  background: rgba(248, 250, 252, 1);
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 12px;
  padding: 14px;
  min-height: 124px;
}

.search-input :deep(.ant-input-prefix .iconify) {
  color: rgba(148, 163, 184, 1);
}

.answer-label {
  font-size: 12px;
  font-weight: 700;
  color: rgba(148, 163, 184, 1);
}

.answer-text {
  margin-top: 6px;
  font-size: 18px;
  font-weight: 700;
  color: rgba(51, 65, 85, 0.92);
}

.answer-text.is-handwriting {
  font-style: italic;
  font-weight: 700;
}

.analysis {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  color: rgba(220, 38, 38, 1);
  font-size: 12px;
  font-weight: 700;
}

.analysis-label {
  font-weight: 700;
}

.card-footer {
  margin-top: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.timestamp {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(148, 163, 184, 1);
}

.grading-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.action-btn {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.06);
}

.action-btn.is-check {
  background: rgba(34, 197, 94, 1);
  color: #fff;
}

.action-btn.is-cross {
  background: rgba(248, 113, 113, 1);
  color: #fff;
}

.question-card.is-placeholder {
  opacity: 0.5;
}

.skeleton-line {
  height: 10px;
  background: rgba(226, 232, 240, 1);
  border-radius: 999px;
  margin-bottom: 12px;
}

.skeleton-line.is-short {
  width: 56px;
}

.skeleton-block {
  height: 46px;
  width: 72%;
  background: rgba(226, 232, 240, 1);
  border-radius: 12px;
  margin-bottom: 12px;
}

.skeleton-box {
  height: 128px;
  background: rgba(248, 250, 252, 1);
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}
</style>
