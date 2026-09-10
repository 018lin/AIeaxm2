<template>
  <div class="db-card app-surface">
    <div class="db-card-header">
      <div class="header-left">
        <div class="title-bar"></div>
        <div class="title">最近组卷</div>
      </div>
      <a-button type="link" class="more-link" @click="viewAll">查看全部</a-button>
    </div>

    <div class="db-card-body">
      <div class="table-header">
        <div class="col title">试卷标题</div>
        <div class="col status">状态/类型</div>
        <div class="col action">操作</div>
      </div>

      <div v-if="loading" class="loading-state">
        <a-spin />
      </div>

      <a-empty v-else-if="list.length === 0" description="暂无" />

      <div v-else class="paper-list">
        <div v-for="item in list" :key="item.assignmentId" class="paper-item">
          <div class="col title-col">
            <div class="paper-title text-ellipsis" :title="item.assignmentName">
              {{ item.assignmentName }}
            </div>
            <div class="paper-meta">{{ item.gradeName }} · {{ item.subjectName }}</div>
          </div>

          <div class="col status-col">
            <div class="status-tag" :class="getStatusClass(item.status)">
              {{ getStatusText(item.status) }}
            </div>
            <div class="type-text">
              {{
                item.assignmentType === 'book'
                  ? '智能组卷'
                  : item.assignmentType === 'wrong'
                    ? '错题重组'
                    : item.assignmentType === 'level'
                      ? '分层作业'
                      : '-'
              }}
            </div>
          </div>

          <div class="col action-col">
            <a-button
              v-if="item.status === 'draft'"
              class="action-btn continue-btn light"
              @click="handleContinue(item)"
              :disabled="item.assignmentType === 'level'"
            >
              继续组卷
            </a-button>
            <a-button v-else class="action-btn gray" @click="handleDownload(item)"> 下载 </a-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { downloadExamination, getRecentAssignments, spliceExamination } from '@/api/examination'
import type { listExaminationItem } from '@/api/examination/type'
import { ROUTES } from '@/router/routes'
import { encrypt } from '@/utils/crypto'
import { message } from 'ant-design-vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const list = ref<listExaminationItem[]>([])

const fetchList = async () => {
  loading.value = true
  try {
    const apiList = await getRecentAssignments()
    const filtered = (apiList || []).filter(item => ['draft', 'finalized'].includes(item.status || '')).slice(0, 3)
    list.value = filtered.length > 0 ? filtered : []
  } catch (error) {
    console.error('Fetch papers failed:', error)
  } finally {
    loading.value = false
  }
}

const viewAll = () => {
  router.push(ROUTES.TEACHER_EXAMINATION)
}

const handleContinue = async (item: listExaminationItem) => {
  const assignmentId = String(item.assignmentId || '')
  if (!assignmentId) return
  try {
    const res = await spliceExamination({ assignmentId })
    if (res) {
      message.success(`已将该试卷的${item.questionNumbers || 0}道题加入试题篮`)
      const encryptedId = encrypt(assignmentId)

      const raw = String(item.assignmentType || item.assignmentStatus || '').toLowerCase()
      let code = ['book', 'wrong', 'level'].includes(raw) ? raw : ''
      console.log(code)

      const path =
        code === 'wrong'
          ? ROUTES.TEACHER_HOMEWORK_RECOMPOSE_PAPER
          : code === 'level'
            ? ROUTES.TEACHER_LAYERED_CLASS_COMPOSE
            : ROUTES.TEACHER_EXAMINATION

      router.push({ path, query: { assignmentId: encryptedId } }).catch(() => {})
    }
  } catch (e) {
    console.error('Resume compose failed:', e)
  }
}

const handleDownload = async (item: listExaminationItem) => {
  try {
    const url = await downloadExamination({ assignmentId: item.assignmentId })
    if (url) {
      window.open(url, '_blank')
    }
  } catch (e) {
    console.error('Download failed:', e)
  }
}

const getStatusText = (status?: string) => {
  const map: Record<string, string> = {
    draft: '待定稿',
    finalized: '已定稿',
    published: '已发布',
  }
  return status ? map[status] || status : '-'
}

const getStatusClass = (status?: string) => {
  const map: Record<string, string> = {
    draft: 'is-draft',
    finalized: 'is-finalized',
    published: 'is-published',
  }
  return status ? map[status] || '' : ''
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
.db-card {
  border-radius: 16px;
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.db-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .title-bar {
    width: 4px;
    height: 18px;
    background: #ff7d00; // Orange color from image
    border-radius: 2px;
  }

  .title {
    font-size: 18px;
    font-weight: 700;
    color: #111827;
  }

  .more-link {
    color: #9ca3af;
    font-size: 12px;
    padding: 0;
    height: auto;

    &:hover {
      color: #6b7280;
    }
  }
}

.db-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.table-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;

  .col {
    font-size: 12px;
    color: #9ca3af;
    font-weight: 700;
  }

  .title {
    flex: 1;
  }
  .status {
    width: 100px;
    text-align: center;
  }
  .action {
    width: 80px;
    text-align: right;
  }
}

.paper-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.paper-item {
  display: flex;
  align-items: center;

  .col {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .title-col {
    flex: 1;
    min-width: 0;
    padding-right: 16px;

    .paper-title {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 6px;
    }

    .paper-meta {
      font-size: 12px;
      color: #9ca3af;
    }
  }

  .status-col {
    width: 100px;
    align-items: center;

    .status-tag {
      font-size: 12px;
      font-weight: 700;
      padding: 5px 8px;
      border-radius: 6px;
      margin-bottom: 6px;

      &.is-draft {
        color: #ff7d00;
        background: rgba(255, 125, 0, 0.1);
      }

      &.is-finalized {
        color: #10b981;
        background: rgba(16, 185, 129, 0.1);
      }
    }

    .type-text {
      font-size: 12px;
      color: #9ca3af;
    }
  }

  .action-col {
    width: 80px;
    align-items: flex-end;

    .action-btn {
      height: 32px;
      padding: 0 16px;
      font-size: 12px;
      font-weight: 700;
    }
  }
}

.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
</style>
