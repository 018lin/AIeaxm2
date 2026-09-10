<template>
  <div class="db-card app-surface">
    <div class="db-card-header">
      <div class="header-left">
        <div class="title-bar"></div>
        <div class="title">最近作业</div>
      </div>
      <a-button type="link" class="more-link" @click="viewAll">作业管理</a-button>
    </div>

    <div class="db-card-body">
      <div v-if="loading" class="loading-state">
        <a-spin />
      </div>

      <a-empty v-else-if="list.length === 0" description="暂无" />

      <div v-else class="homework-list">
        <div v-for="item in list" :key="item.assignmentId" class="homework-item">
          <div class="item-header">
            <div class="homework-title text-ellipsis" :title="item.assignmentName">
              {{ item.assignmentName }}
            </div>
            <div class="flex gap-xs">
              <div class="tag">
                {{ item.gradeName }}
              </div>

              <div class="tag">
                {{ item.subjectName }}
              </div>
            </div>
          </div>

          <div class="class-list">
            <div
              v-for="g in item.groupProgressList || []"
              :key="String(g.type || '') + '_' + String(g.classId || g.groupId || '')"
              class="class-row"
            >
              <div class="class-info">
                <span class="dot"></span>
                <span class="class-name">{{ g.type === 'group' ? g.groupName : g.className }}</span>
              </div>

              <div class="progress-stats">
                <div class="stat-item">
                  <span class="label">提交进度</span>
                  <div class="progress-pill is-blue">
                    <span class="curr">{{ g.submittedCount || 0 }}</span>
                    <span class="sep">/</span>
                    <span class="total">{{ g.totalCount || 0 }}</span>
                  </div>
                </div>

                <div class="stat-item">
                  <span class="label">人工批阅</span>
                  <div class="progress-pill is-purple">
                    <span class="curr">{{ g.gradedCount || 0 }}</span>
                    <span class="sep">/</span>
                    <span class="total">{{ g.needGradingCount || 0 }}</span>
                  </div>
                </div>
              </div>

              <div class="row-action">
                <a-button v-if="shouldShowFix(g)" class="action-btn fix-btn" @click="handleFix(item, g)"
                  >讲错题</a-button
                >
                <a-button v-else-if="shouldShowGrade(g)" class="action-btn light" @click="handleGrade(item, g)"
                  >去批改</a-button
                >
                <a-button v-else class="action-btn view-btn" @click="viewDetail(item, g)">查看详情</a-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getRecentHomework } from '@/api/dashboard'
import type { GroupProgressVO, HomeworkRecentVO } from '@/api/dashboard/type'
import { ROUTES } from '@/router/routes'
import { encrypt } from '@/utils/crypto'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const list = ref<HomeworkRecentVO[]>([])

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getRecentHomework()
    list.value = (res || []).slice(0, 3)
  } catch (error) {
    console.error('Fetch homework failed:', error)
  } finally {
    loading.value = false
  }
}

const viewAll = () => {
  router.push(ROUTES.TEACHER_HOMEWORK)
}

const navigateToDetail = (item: HomeworkRecentVO, g: GroupProgressVO, routePath: string) => {
  const aid = String(item.assignmentId || '')
  const cid = String(g.classId || g.groupId || '')

  if (!aid || !cid) return

  // 缓存头部元数据供详情页使用
  const meta = {
    subject: item.subjectName || '-',
    gradeClass: g.type === 'group' ? g.groupName : g.className || '-',
    paperName: item.assignmentName || '-',
  }
  sessionStorage.setItem(`hw_detail_meta_${aid}`, JSON.stringify(meta))

  // 加密参数
  const encAid = encodeURIComponent(encrypt(aid))
  const encCid = encrypt(cid)

  // 替换路径参数并跳转
  const path = routePath.replace(':id', encAid)
  router.push({
    path,
    query: {
      classId: encCid,
    },
  })
}

const viewDetail = (item: HomeworkRecentVO, g: GroupProgressVO) => {
  // a. 若该班级/分层有未提交的人数 -> 原作业
  navigateToDetail(item, g, ROUTES.TEACHER_HOMEWORK_DETAIL_ORIGINAL_WORK)
}

const handleFix = (item: HomeworkRecentVO, g: GroupProgressVO) => {
  // c. 若该班级/分层所有人都已提交，且都已批阅完成 -> 讲错题
  navigateToDetail(item, g, ROUTES.TEACHER_HOMEWORK_DETAIL)
}

const handleGrade = (item: HomeworkRecentVO, g: GroupProgressVO) => {
  // b. 若该班级/分层所有人都已提交，但是人工批阅进度未完成 -> 人工批阅
  navigateToDetail(item, g, ROUTES.TEACHER_HOMEWORK_DETAIL_MANUAL_REVIEW)
}

const shouldShowFix = (g: GroupProgressVO) => {
  const total = Number(g.totalCount || 0)
  const submitted = Number(g.submittedCount || 0)
  const need = Number(g.needGradingCount || 0)
  const graded = Number(g.gradedCount || 0)
  return total > 0 && submitted >= total && need > 0 && graded >= need
}

const shouldShowGrade = (g: GroupProgressVO) => {
  const need = Number(g.needGradingCount || 0)
  const graded = Number(g.gradedCount || 0)
  return need > graded
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
    background: #10b981; // Green color from image
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
  overflow-y: auto;
}

.homework-list {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.homework-item {
  display: flex;
  flex-direction: column;
  gap: 16px;
  &:not(:last-child) {
    padding-bottom: 20px;
    border-bottom: 1px solid rgb(241 245 249);
  }
}

.item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .homework-title {
    font-size: 16px;
    font-weight: 700;
    color: #111827;
  }

  .detail-link {
    color: #ef4444; // Red color for "查看详情"
    font-size: 12px;
    font-weight: 700;
    padding: 0;
    height: auto;
  }

  .tag {
    color: #10b981;
    background: rgba(16, 185, 129, 0.1);
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
  }
}

.class-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.class-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 12px;

  &:hover {
    background: #f3f4f6;
  }

  .class-info {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 80px;

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
    }

    .class-name {
      font-size: 14px;
      font-weight: 700;
      color: #374151;
    }
  }

  .progress-stats {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      font-size: 12px;
      color: #9ca3af;
    }
  }

  .progress-pill {
    display: flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 700;

    .sep {
      margin: 0 2px;
      opacity: 0.6;
    }

    &.is-blue {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    &.is-purple {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
    }
  }

  .row-action {
    width: 80px;
    display: flex;
    justify-content: flex-end;

    .action-btn {
      height: 28px;
      padding: 0 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      border: none;

      &.fix-btn {
        background: #fff7ed;
        color: #f97316;
        border: 1px solid rgba(249, 115, 22, 0.2);

        &:hover {
          background: #ffedd5;
        }
      }

      &.grade-btn {
        background: #f97316;
        color: #fff;

        &:hover {
          background: #ea580c;
        }
      }

      &.view-btn {
        background: #fff;
        color: #6b7280;
        border: 1px solid #e5e7eb;

        &:hover {
          background: #f9fafb;
        }
      }
    }
  }
}
</style>
