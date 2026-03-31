<template>
  <div class="lectures-page app-surface p-20 flex-col">
    <!-- 视频网格 -->
    <a-empty
      style="padding-top: 30px"
      v-if="!loading && videoList.length === 0"
      :image="simpleImage"
      description="暂无视频"
    />
    <div v-else v-loading="loading" class="video-grid">
      <div
        v-for="video in videoList"
        :key="video.key"
        class="video-card"
        :class="`theme-${video.theme}`"
        @click="goToDetail(video)"
      >
        <div class="card-thumb">
          <div class="thumb-frame">
            <img v-if="video.coverUrl" :src="video.coverUrl" alt="" class="thumb-img" />
            <div v-else class="thumb-placeholder" />
            <div class="play-btn" aria-hidden="true">
              <span class="play-triangle" />
            </div>
            <span class="duration-tag">{{ video.duration }}</span>
          </div>
        </div>

        <div class="card-body">
          <h3 class="video-title">{{ video.title }}</h3>

          <div class="meta-row">
            <span class="meta-label"><CalendarOutlined />录制时间</span>
            <span class="meta-value">{{ video.date }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label"><TeamOutlined />讲解教师</span>
            <span class="meta-value meta-tag">{{ video.teacherName || '-' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <footer class="page-footer">
      <TchPagination
        v-model:current="currentPage"
        :pageSize="pageSize"
        :total="total"
        @change="onPageChange"
        footer-padding="0 20px"
      />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { getTeacherExplanationPage } from '@/api/school'
import type { TeacherExplanationQuery, TeacherExplanationVO } from '@/api/school/type'
import TchPagination from '@/components/common/table/TchPagination.vue'
import { ROUTES } from '@/router/routes'
import { formatTimestamp } from '@/utils/time'
import { CalendarOutlined, TeamOutlined } from '@ant-design/icons-vue'
import { Empty } from 'ant-design-vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

const filters = reactive<{
  gradeId?: string
  classId?: string
  subjectId?: string
  startDate?: string
  endDate?: string
}>({})

const currentPage = ref(1)
const pageSize = 8
const loading = ref(false)
const total = ref(0)
const listData = ref<TeacherExplanationVO[]>([])

const formatDuration = (seconds?: number) => {
  if (seconds == null) return '0\'00"'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}'${s.toString().padStart(2, '0')}"`
}

const videoList = computed(() => {
  return listData.value.map((item, index) => ({
    key: String(item.explanationId ?? item.id ?? index),
    explanationId: item.explanationId,
    id: item.id,
    title: item.explanationName || '未命名讲解',
    coverUrl: item.coverUrl,
    duration: formatDuration(item.duration),
    date: formatTimestamp(item.publishTime, 'YYYY-MM-DD'),
    teacherName: item.teacherName,
    theme: (index % 4) + 1,
  }))
})

const fetchList = async () => {
  loading.value = true
  try {
    const params: TeacherExplanationQuery = {
      pageNo: currentPage.value,
      pageSize,
      status: true,
      ...filters,
    }
    const res = await getTeacherExplanationPage(params)
    listData.value = res?.list ?? []
    total.value = res?.total ?? 0
  } finally {
    loading.value = false
  }
}

const goToDetail = (video: { explanationId?: string; id?: number }) => {
  const id = video.explanationId ?? String(video.id ?? '')
  if (!id) return
  router.push(ROUTES.TEACHER_SCHOOL_RESOURCE_DETAIL.replace(':id', encodeURIComponent(id)))
}

const onPageChange = (page: number) => {
  currentPage.value = page
  fetchList()
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="less">
.lectures-page {
  max-height: 100%;
  .video-grid {
    flex: 1;
    display: flex;
    overflow: auto;
    flex-wrap: wrap;
    gap: 22px;
    margin-bottom: 28px;

    .video-card {
      width: 23%;
      max-width: 250px;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(15, 23, 42, 0.06);
      box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
      transition:
        transform 0.18s ease,
        box-shadow 0.18s ease;
      cursor: pointer;

      .card-thumb {
        padding: 14px 14px 0;

        .thumb-frame {
          height: 132px;
          border-radius: 10px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .thumb-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumb-placeholder {
          width: 100%;
          height: 100%;
        }

        .play-btn {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #ff8a34;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 22px rgba(255, 138, 52, 0.35);
        }

        .play-triangle {
          width: 0;
          height: 0;
          border-top: 9px solid transparent;
          border-bottom: 9px solid transparent;
          border-left: 14px solid #fff;
          margin-left: 3px;
        }

        .duration-tag {
          position: absolute;
          right: 12px;
          bottom: 12px;
          height: 24px;
          padding: 0 10px;
          display: inline-flex;
          align-items: center;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.92);
          background: rgba(17, 24, 39, 0.55);
          backdrop-filter: blur(8px);
        }
      }

      .card-body {
        padding: 12px 16px 16px;

        .video-title {
          margin: 2px 0 10px;
          font-size: 14px;
          font-weight: 700;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 8px;
          font-size: 12px;
          color: rgba(107, 114, 128, 0.92);

          :deep(.anticon) {
            margin-right: 8px;
            opacity: 0.75;
          }

          .meta-label {
            display: inline-flex;
            align-items: center;
            min-width: 0;
            white-space: nowrap;
          }

          .meta-value {
            font-weight: 700;
            color: rgba(17, 24, 39, 0.78);
            white-space: nowrap;
          }

          .meta-tag {
            height: 24px;
            padding: 0 12px;
            border-radius: 9px;
            background: rgba(148, 163, 184, 0.12);
            color: rgba(75, 85, 99, 0.9);
            line-height: 24px;
          }

          .meta-highlight {
            color: #ff7a1a;
          }
        }
      }

      &:hover {
        transform: translateY(-6px);
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.1);

        .card-thumb .play-btn {
          width: 60px;
          height: 60px;
        }
      }

      &.theme-1 .thumb-frame {
        background: #fff4e5;
      }
      &.theme-2 .thumb-frame {
        background: #e9f2ff;
      }
      &.theme-3 .thumb-frame {
        background: #f3edff;
      }
      &.theme-4 .thumb-frame {
        background: #e9f8ef;
      }
    }
  }

  .page-footer {
    padding-top: 24px;
    border-top: 1px solid rgba(0, 0, 0, 0.04);
  }
}
</style>
