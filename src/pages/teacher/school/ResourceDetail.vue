<template>
  <div class="resource-detail">
    <div class="breadcrumb app-surface">
      <a-button type="primary" :icon="h(LeftOutlined)" @click="goBack">返回</a-button>
      <span class="path">讲堂记录</span>
      <span class="divider flex-1"></span>
      <span class="current">观看微课</span>
    </div>

    <div v-loading="loading" class="content-wrapper">
      <div class="video-section">
        <div class="video-player">
          <video v-if="detail?.videoUrl" controls class="video-element">
            <source :src="detail.videoUrl" type="video/mp4" />
          </video>
          <div v-else class="video-empty">暂无视频地址</div>
        </div>
      </div>

      <div class="info-sidebar">
        <div class="info-card">
          <div class="card-header">
            <span>视频信息</span>
          </div>

          <div class="info-item">
            <div class="label">
              <PlayCircleFilled :style="{ color: '#e67e22' }" />
              视频名称
            </div>
            <div class="value">{{ detail?.explanationName || '-' }}</div>
          </div>

          <div class="info-item">
            <div class="label">
              <CalendarOutlined :style="{ color: '#e67e22' }" />
              录制时间
            </div>
            <div class="value">{{ detail?.publishTime ? formatTimestamp(detail.publishTime, 'YYYY-MM-DD') : '-' }}</div>
          </div>

          <div class="info-item">
            <div class="label">
              <HistoryOutlined :style="{ color: '#e67e22' }" />
              视频时长
            </div>
            <div class="value">{{ formatDuration(detail?.duration) }}</div>
          </div>

          <!-- <div class="info-item">
            <div class="label">
              <TeamOutlined :style="{ color: '#e67e22' }" />
              讲解题目
            </div>
            <div class="value">{{ detail?.questionContent || '-' }}</div>
          </div> -->

          <div v-if="detail?.teacherName" class="info-item">
            <div class="label">
              <UserOutlined :style="{ color: '#e67e22' }" />
              讲解教师
            </div>
            <div class="value">{{ detail.teacherName }}</div>
          </div>

          <!-- <a-button type="primary" :icon="h(DeleteOutlined)" disabled>删除视频</a-button> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTeacherExplanationPage } from '@/api/school'
import type { TeacherExplanationVO } from '@/api/school/type'
import { formatTimestamp } from '@/utils/time'
import { CalendarOutlined, HistoryOutlined, LeftOutlined, PlayCircleFilled, UserOutlined } from '@ant-design/icons-vue'
import { h, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const detail = ref<TeacherExplanationVO | null>(null)

const goBack = () => {
  router.back()
}

const formatDuration = (seconds?: number) => {
  if (!seconds) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const fetchDetail = async () => {
  const rawId = String(route.params.id || '')
  if (!rawId) return

  loading.value = true
  try {
    const byBizId = await getTeacherExplanationPage({
      pageNo: 1,
      pageSize: 1,
      explanationId: rawId,
    })
    const first = byBizId?.list?.[0]
    if (first) {
      detail.value = first
      return
    }

    const maybeNum = Number(rawId)
    if (!Number.isNaN(maybeNum)) {
      const res = await getTeacherExplanationPage({ pageNo: 1, pageSize: 200 })
      detail.value = (res?.list || []).find(it => it?.id === maybeNum) || null
      return
    }

    detail.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDetail()
})

watch(
  () => route.params.id,
  () => {
    fetchDetail()
  }
)
</script>

<style scoped lang="less">
.resource-detail {
  width: 100%;
  height: calc(100vh - 124px);
  max-width: 1200px;
  margin: 0 auto;

  /* 面包屑导航 */
  .breadcrumb {
    height: 60px;
    width: 100%;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    font-size: 14px;
    .path {
      padding-left: 10px;
      color: #666;
    }
    .current {
      color: #333;
      font-weight: 500;
    }
  }

  /* 内容布局 */
  .content-wrapper {
    display: grid;
    gap: 24px;
    grid-template-columns: auto 300px;
    .video-section {
      flex: 1;
      min-width: 0;
      /* 视频播放器 */
      .video-player {
        width: 100%;
        max-width: 900px;
        aspect-ratio: 150/97;
        background: #000;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .video-element {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .video-empty {
        color: #fff;
        font-size: 14px;
      }
    }

    .info-sidebar {
      height: 100%;
      flex-shrink: 0;
      /* 信息卡片 */
      .info-card {
        background: #fff;
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 24px;
        padding-bottom: 16px;
        border-bottom: 1px solid #f0f0f0;
      }

      .card-header span {
        font-size: 18px;
        font-weight: 600;
        color: #222;
      }

      /* 信息项 */
      .info-item {
        margin-bottom: 30px;
      }

      .info-item .label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
        color: #999;
        margin-bottom: 8px;
      }

      .info-item .value {
        font-size: 14px;
        color: #333;
        padding-left: 20px;
      }

      .subject-tag {
        display: inline-block;
        background: #e3f2fd;
        color: #1976d2;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 13px;
      }
    }
  }
}

/* 响应式 */
@media (max-width: 1200px) {
  .content-wrapper {
    flex-direction: column;
  }

  .info-sidebar {
    width: 100%;
  }
}
</style>
