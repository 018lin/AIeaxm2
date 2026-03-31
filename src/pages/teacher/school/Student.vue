<template>
  <div class="student-main">
    <!-- 授课信息 -->
    <header class="header app-surface p-20">
      <p class="title-label">授课信息</p>
      <p class="description" v-if="gradeName && subjectName && classList.length">
        您教授{{ gradeName }}
        <span v-for="(item, index) in classList" :key="item.classId">
          {{ item.className }}{{ classList.length - 1 === index ? '' : '、' }}
        </span>
        的{{ subjectName }}
      </p>
    </header>
    <!-- 班级信息 -->
    <div ref="tableBoxRef" class="table-box app-surface p-20">
      <p class="title-label">班级信息</p>
      <!-- 操作 -->
      <div class="table-top">
        <div class="table-top-left" v-if="classList.length">
          <a-select placeholder="请选择班级" style="width: 120px" v-model:value="classId" class="table-top-select">
            <a-select-option v-for="item in classList" :key="item.classId">
              {{ item.className }}
            </a-select-option>
          </a-select>
          <span class="count-badge">{{ total }}名学生</span>
        </div>

        <div class="table-top-actions">
          <a-button type="primary" class="primary-btn" @click="openErrorSettings">
            <template #icon><CloseCircleOutlined /></template>
            错题设置
          </a-button>
          <!-- <a-button type="primary" class="primary-btn" @click="goToLayerSetting">
            <template #icon><TagsOutlined /></template>
            分层策略
          </a-button> -->
        </div>
      </div>
      <!-- 表格 -->
      <div class="table-card--primary" v-if="studentList.length">
        <a-table :columns="columns" :data-source="studentList" :pagination="false" :scroll="{ y: tableScrollY }">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'no'">
              <span>{{ (pageNo - 1) * pageSize + index + 1 }}</span>
            </template>
            <template v-if="column.key === 'sex'">
              <a-tag color="green" v-if="record.sex === '1'">男</a-tag>
              <a-tag color="pink" v-else-if="record.sex === '2'">女</a-tag>
            </template>
          </template>
        </a-table>

        <TchPagination v-model:current="pageNo" v-model:pageSize="pageSize" :total="total" @change="getStudentData" />
      </div>
      <!-- 空数据 -->
      <div class="empty-state" v-else>
        <a-empty :description="'暂无数据'" />
      </div>
    </div>

    <!-- 错题设置 -->
    <ErrorSettings :open="errorSettingsOpen" :classId="classId" :info="errorSettingsInfo" @close="closeErrorSettings" />
  </div>
</template>

<script setup lang="ts">
import { getRules } from '@/api/recompose/index'
import { getStudentList } from '@/api/school/index'
import type { StudentItem } from '@/api/school/type'
import TchPagination from '@/components/common/table/TchPagination.vue'
import ErrorSettings from '@/components/school/ErrorSettings.vue'
import { ROUTES } from '@/router/routes'
import { getUserBaseInfo } from '@/services/storage'
import { encrypt } from '@/utils/crypto'
import useAntdTableScrollY from '@/utils/useAntdTableScrollY'
import { CloseCircleOutlined } from '@ant-design/icons-vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

// 路由
const router = useRouter()

// 状态
const parsedUserInfo = getUserBaseInfo()
const gradeId = ref(parsedUserInfo?.gradeId || '') // 年级ID
const gradeName = ref(parsedUserInfo?.gradeName || '') // 年级名称
const subjectId = ref(parsedUserInfo?.subjectId || '') // 学科ID
const subjectName = ref(parsedUserInfo?.subjectName || '') // 学科名称
const classList = ref(parsedUserInfo?.classInfoList || []) // 班级列表
const classId = ref<string>('') // 当前选择的班级ID
const errorSettingsOpen = ref(false) // 错题设置抽屉状态
const errorSettingsInfo = ref({}) // 错题设置信息
// 表格状态
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)
const studentList = ref<StudentItem[]>([])

const tableBoxRef = ref<HTMLElement | null>(null)
const { scrollY: tableScrollY } = useAntdTableScrollY(tableBoxRef, {
  mode: 'container',
  minY: 60,
  subtractSelectors: ['.title-label', '.table-top', '.tch-table-footer', '.ant-table-thead'],
  subtractPadding: true,
  extraSubtract: 155,
})

const columns = [
  { title: '序号', align: 'center', dataIndex: 'no', key: 'no' },
  { title: '姓名', dataIndex: 'studentName', key: 'studentName' },
  { title: '性别', key: 'sex' },
  { title: '学号', dataIndex: 'studentCode', key: 'studentCode' },
]

// 分层策略
const goToLayerSetting = () => {
  const params = {
    gradeId: gradeId.value,
    gradeName: gradeName.value,
    classId: classId.value,
    subjectId: subjectId.value,
    subjectName: subjectName.value,
  }

  // 跳转到分层策略页面
  router.push({
    path: ROUTES.TEACHER_LAYER_SETTINGS,
    query: { data: encrypt(JSON.stringify(params)) },
  })
}

// 错题设置
const openErrorSettings = () => {
  errorSettingsOpen.value = true
  getRulesData()
}
const closeErrorSettings = () => {
  errorSettingsOpen.value = false
}
const getRulesData = async () => {
  try {
    const res = await getRules({ classId: classId.value })
    errorSettingsInfo.value = res || {}
  } catch (error) {
    console.error('获取错题设置失败:', error)
  }
}

// 获取学生列表
const getStudentData = async () => {
  if (!gradeId.value || !classId.value) {
    return
  }
  const params = {
    classId: classId.value,
    gradeId: gradeId.value,
    pageNo: pageNo.value,
    pageSize: pageSize.value,
  }
  const res = await getStudentList(params)
  studentList.value = res.list || []
  total.value = res.total || 0
}

// 监听 classList，生成 classId
watch(
  classList,
  newAllClassList => {
    if (!newAllClassList || newAllClassList.length === 0) {
      return
    }
    // 根据 classIds 过滤 allClassList
    classId.value = classList.value[0]?.classId ?? ''
  },
  { deep: true, immediate: true }
)

watch(
  classId,
  ([newClassId]) => {
    if (newClassId) {
      getStudentData()
    }
  },
  { deep: true, immediate: true }
)
</script>

<style scoped lang="scss">
.student-main {
  width: 100%;
  height: 100%;

  .title-label {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #474646;
    padding-left: 15px;
    position: relative;
    height: 18px;
    line-height: 18px;
    &::before {
      content: ' ';
      display: block;
      width: 4px;
      height: 100%;
      border-radius: 2px;
      position: absolute;
      top: 0;
      left: 0;
      background: #f97316;
    }
  }

  // 头部
  .header {
    height: 100px;
    margin-bottom: 20px;
    .description {
      margin: 20px 0 5px 15px;
      font-size: 14px;
      color: #666;
    }
  }

  .table-box {
    height: calc(100% - 120px);

    // 表格头部
    .table-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      background: #f9f9f8;
      border: 1px solid #f5f5f4;
      padding: 20px;
      margin: 20px 0 20px;
      border-radius: 10px;

      .table-top-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .table-top-select {
          :deep(.ant-select-selector) {
            height: 40px !important;
            background: #ffffff !important;
          }
        }

        .count-badge {
          padding: 10px 15px;
          background: #fff7ed;
          color: #f9781e;
          font-size: 12px;
          font-weight: 700;
          border-radius: 12px;
          border: 1px solid #f7e5d1;
        }
      }

      .table-top-actions {
        display: flex;
        gap: 12px;
      }
    }
  }

  // 空数据
  .empty-state {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--color-text-muted);
  }
}
</style>
