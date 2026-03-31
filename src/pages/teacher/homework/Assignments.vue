<template>
  <div class="tch-assignment-page tch-page-container">
    <!-- 页面头部：标题和描述 -->
    <div class="tch-assignment-hero flex-between-start gap-18 mb-20">
      <div class="sub-content-head">
        <div>
          <div class="title-main">作业管理</div>
          <div class="title-sub">作业管理一体化平台：查看、编辑、管理尽在掌握</div>
        </div>
      </div>
    </div>

    <!-- 筛选条件卡片 -->
    <div class="tch-filter-card rounded-lg app-surface">
      <div class="tch-filter-grid flex items-end flex-wrap gap-md">
        <!-- 年级、班级、科目选择器 -->
        <SelectCom
          :typeList="[selectEnum.SUBJECT, selectEnum.GRADE, selectEnum.CLASS]"
          :selectValue="[filters.subject, filters.grade, filters.classNo]"
          :customData="customSelectData"
          showLabel
          @getList="handleFilter"
        />
        <!-- 日期范围选择器 -->
        <RangePicker :defaultValue="defaultDateRange" @getList="handleFilter" showLabel />
      </div>
    </div>

    <!-- 表格卡片 -->
    <div ref="tableCardRef" class="tch-table-card table-card--primary">
      <a-table
        :data-source="rows"
        :columns="columns"
        :pagination="false"
        :loading="loading"
        :scroll="{ x: 1400, y: tableBodyScrollY }"
        table-layout="fixed"
        row-key="key"
        class="tch-table table--primary"
      >
        <!-- 空状态 -->
        <template #emptyText>
          <a-empty :image="simpleImage" description="暂无数据" />
        </template>

        <!-- 自定义单元格渲染 -->
        <template #bodyCell="{ column, record }">
          <!-- 试卷名称列：显示标题和创建时间 -->
          <template v-if="column.key === 'paperSource'">
            <div class="tch-title-cell">
              <div class="tch-title-main bold text-primary">{{ record.title }}</div>
              <div class="tch-title-sub text-orange">提交时间：{{ record.createdAt }}</div>
            </div>
          </template>

          <!-- 已提交人数列：hover 时调用 getStudentHomeworkStudentList 获取名单 -->
          <template v-else-if="column.key === 'submittedCount'">
            <AssignmentStudentPopover
              title="提交学生名单"
              :count="Number(record.submittedCount || 0)"
              :assignment-id="record.id"
              :class-id="record.classId ?? ''"
              list-key="submitted"
            />
          </template>

          <!-- 未提交人数列：hover 时调用 getStudentHomeworkStudentList 获取名单 -->
          <template v-else-if="column.key === 'unsubmittedCount'">
            <AssignmentStudentPopover
              title="未提交学生名单"
              :count="Number(record.unsubmittedCount || 0)"
              :assignment-id="record.id"
              :class-id="record.classId ?? ''"
              list-key="unsubmitted"
              is-warn
            />
          </template>

          <!-- 异常页数列：显示异常徽章 -->
          <template v-else-if="column.key === 'abnormalPages'">
            <span v-if="Number(record.abnormalPages || 0) > 0" class="tch-count tch-abnormal-badge bold">
              {{ record.abnormalPages }}
            </span>
            <span v-else class="tch-count-muted tch-count">0</span>
          </template>

          <!-- 操作列：查看详情按钮 -->
          <template v-else-if="column.key === 'ops'" class="tch-ops-cell">
            <div class="ops-list">
              <a-tooltip :title="canPreview(record) ? '点击查看作业详情' : '该作业详情为空'">
                <span class="inline-flex">
                  <a-button size="small" class="primary" :disabled="!canPreview(record)" @click="preview(record)">
                    查看详情
                  </a-button>
                </span>
              </a-tooltip>
            </div>
          </template>
        </template>
      </a-table>

      <!-- 分页组件 -->
      <TchPagination
        v-model:current="pager.current"
        v-model:pageSize="pager.pageSize"
        :total="pager.total"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 作业管理页面
 * 功能：教师查看、筛选和管理作业列表
 * 特性：支持日期范围、年级、班级、科目筛选，表格自适应高度，分页加载
 */

// ==================== 依赖导入 ====================
import { listHomework } from '@/api/homework'
import type { ClassHomeworkVO, HomeworkListPageVO, HomeworkListRequest, HomeworkVO } from '@/api/homework/type'
import SelectCom from '@/components/common/Select.vue'
import RangePicker from '@/components/common/table/RangePicker.vue'
import TchPagination from '@/components/common/table/TchPagination.vue'
import AssignmentStudentPopover from '@/components/homework/AssignmentStudentPopover.vue'
import { selectEnum } from '@/enum/common'
import { ROUTES } from '@/router/routes'
import { getUserBaseInfo } from '@/services/storage'
import type { AssignmentRow, Status } from '@/types/homework'
import { encrypt } from '@/utils/crypto'
import useAntdTableScrollY from '@/utils/useAntdTableScrollY'
import { Empty, message } from 'ant-design-vue'
import dayjs, { type Dayjs } from 'dayjs'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

// ==================== 常量定义 ====================
/** 空状态图片 */
const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

/** 路由实例 */
const router = useRouter()

/** 用户基本信息 */
const userBaseInfo = getUserBaseInfo()

const customSelectData = computed(() => {
  if (!userBaseInfo) return []
  return [
    {
      dictType: selectEnum.SUBJECT,
      dictTypeList: [{ label: userBaseInfo.subjectName, value: userBaseInfo.subjectId }],
      disabled: true,
    },
    {
      dictType: selectEnum.GRADE,
      dictTypeList: [{ label: userBaseInfo.gradeName, value: userBaseInfo.gradeId }],
      disabled: true,
    },
    {
      dictType: selectEnum.CLASS,
      dictTypeList: userBaseInfo.classInfoList?.map((c: any) => ({ label: c.className, value: c.classId })) || [],
    },
  ]
})

// ==================== 响应式状态 ====================
/** 表格容器 DOM 引用 */
const tableCardRef = ref<HTMLElement | null>(null)

/** 表格主体滚动区域高度（动态计算） */
const { scrollY: tableBodyScrollY, update: updateTableScrollY } = useAntdTableScrollY(tableCardRef, {
  mode: 'viewport',
  minY: 160,
  bottomPadding: 20,
  subtractSelectors: ['.tch-table-footer', '.ant-table-thead'],
})

/**
 * 扩展的表格行数据类型
 * 用于支持多班级作业的行合并显示
 */
interface TableAssignmentRow extends AssignmentRow {
  /** 行合并数量（用于 rowSpan 属性，0 表示被合并的行） */
  rowSpan: number
  /** 唯一键（用于 Vue 列表渲染的 key） */
  key: string
  /** 班级ID（用于进入详情页请求班级作业详情接口） */
  classId?: string
  /** 班级名称（每个班级一行） */
  className?: string
}

/** 数据加载状态 */
const loading = ref(false)

/** 分页配置对象 */
const pager = reactive({
  current: 1, // 当前页码（从 1 开始）
  pageSize: 5, // 每页显示条数
  total: 0, // 数据总条数
})

/** 所有表格行数据（包含合并行信息） */
const allRows = ref<TableAssignmentRow[]>([])

/** 当前显示的表格行数据（计算属性，便于后续扩展过滤逻辑） */
const rows = computed(() => allRows.value)

/** 默认日期范围：最近 3 个月 */
const defaultDateRange = ref<[Dayjs, Dayjs]>([dayjs().subtract(3, 'month'), dayjs()])

/** 筛选条件对象 */
const filters = reactive({
  /** 日期范围（格式：YYYY-MM-DD） */
  dateRange: [
    defaultDateRange.value[0].format('YYYY-MM-DD'),
    defaultDateRange.value[1].format('YYYY-MM-DD'),
  ] as string[],
  /** 年级 ID */
  grade: userBaseInfo?.gradeId || (undefined as string | undefined),
  /** 班级 ID */
  classNo: undefined as string | undefined,
  /** 科目 ID */
  subject: userBaseInfo?.subjectId || (undefined as string | undefined),
})

// 获取作业列表数据
const getList = async () => {
  loading.value = true
  try {
    // 构建请求参数
    const params: HomeworkListRequest = {
      pageNo: pager.current,
      pageSize: pager.pageSize,
      // 日期范围转换为时间戳（开始时间为当天 00:00:00，结束时间为当天 23:59:59）
      startTime: filters.dateRange?.[0] ? dayjs(filters.dateRange[0]).startOf('day').valueOf() : undefined,
      endTime: filters.dateRange?.[1] ? dayjs(filters.dateRange[1]).endOf('day').valueOf() : undefined,
      gradeId: filters.grade,
      classId: filters.classNo,
      subjectId: filters.subject,
    }

    // 调用 API 获取数据
    const res = (await listHomework(params)) as HomeworkListPageVO
    const list = res?.list || []

    if (list.length) {
      const newRows: TableAssignmentRow[] = []

      // 遍历作业列表，处理每个作业的班级数据
      list.forEach((item: HomeworkVO) => {
        const classes = item.classHomeworkList || []

        // 基础行数据（所有班级共享的数据）
        const baseRow = {
          id: item.assignmentId || '',
          title: item.assignmentName || '',
          paperSource: item.assignmentName || '',
          scanDate: item.assignmentTime ? dayjs(item.assignmentTime).format('YYYY-MM-DD') : '',
          createdAt: item.assignmentTime ? dayjs(item.assignmentTime).format('YYYY-MM-DD') : '',
          homeworktype: formatType(item.assignmentType),
          status: (item.assignmentStatus as Status) || 'draft',
          grade: item.gradeName || '-',
          subject: item.subjectName || '',
          completedPage: item.assignmentPage ? `${item.assignmentPage}页` : '-',
          pendingPages: 0,
          avgScore: null,
        }

        // 如果没有班级数据，创建一个空行
        if (classes.length === 0) {
          newRows.push({
            ...baseRow,
            key: `${item.assignmentId}_empty`,
            className: '-',
            submissions: 0,
            submittedCount: 0,
            unsubmittedCount: 0,
            abnormalPages: 0,
            rowSpan: 1, // 单行不需要合并
          })
        } else {
          // 为每个班级创建一行
          classes.forEach((cls: ClassHomeworkVO, index: number) => {
            newRows.push({
              ...baseRow,
              key: `${item.assignmentId}_${cls.classId}`,
              classId: cls.classId,
              className: cls.className || '-',
              submissions: cls.completedCount || 0,
              submittedCount: cls.completedCount || 0,
              unsubmittedCount: cls.uncompletedCount || 0,
              abnormalPages: cls.abnormalCount || 0,
              // 第一行设置 rowSpan 为班级总数，其他行设置为 0（表示被合并）
              rowSpan: index === 0 ? classes.length : 0,
            })
          })
        }
      })

      allRows.value = newRows
      pager.total = Number(res?.total || 0)

      // 处理分页边界情况：如果当前页超出范围，重置到第一页
      if (pager.total > 0) {
        const maxPage = Math.ceil(pager.total / pager.pageSize)
        if (pager.current > maxPage) {
          pager.current = 1
          getList() // 递归调用，重新加载第一页数据
          return
        }
      } else {
        pager.current = 1
      }
    } else {
      // 无数据时重置状态
      allRows.value = []
      pager.total = 0
      pager.current = 1
    }
  } catch (error) {
    console.error('获取作业列表失败：', error)
    message.error('获取作业列表失败')
  } finally {
    loading.value = false
  }
}

/**
 * 格式化作业类型代码为中文名称
 * @param type - 作业类型代码（book/wrong/level）
 * @returns 作业类型中文名称
 */
const formatType = (type?: string): string => {
  const typeMap: Record<string, string> = {
    book: '校本组卷',
    wrong: '错题重组',
    level: '分层组题',
  }
  return type ? typeMap[type] || type : ''
}

/**
 * 处理筛选条件变化
 */
const handleFilter = (params: any) => {
  // 处理日期范围变化
  if ('startDate' in params) {
    filters.dateRange = [params.startDate || '', params.endDate || '']
  }

  // 处理年级变化：年级变化时需要清空班级选择（因为不同年级的班级不同）
  if ('gradeId' in params) {
    const nextGrade = (params.gradeId as string | undefined) || undefined
    if (nextGrade !== filters.grade) {
      filters.grade = nextGrade
      filters.classNo = undefined // 清空班级选择
    }
  }

  // 处理班级变化
  if ('classId' in params) {
    filters.classNo = (params.classId as string | undefined) || undefined
  }

  // 处理科目变化
  if ('subjectId' in params) {
    filters.subject = (params.subjectId as string | undefined) || undefined
  }

  // 筛选条件变化后，重置到第一页并刷新列表
  pager.current = 1
  getList()
}

/**
 * 处理分页变化
 * @param page - 目标页码
 * @param pageSize - 每页显示条数
 */
const handlePageChange = (page: number, pageSize: number) => {
  // 如果每页条数变化，需要重置到第一页（避免页码超出范围）
  if (pageSize !== pager.pageSize) {
    pager.pageSize = pageSize
    pager.current = 1
    getList()
    return
  }

  // 仅页码变化，直接跳转
  pager.current = page
  getList()
}

/**
 * 组件挂载时初始化
 * 1. 计算表格高度
 * 2. 监听窗口大小变化
 * 3. 加载作业列表数据
 */
onMounted(() => {
  updateTableScrollY()

  // 尝试恢复列表状态（从详情页返回时）
  try {
    const savedState = sessionStorage.getItem('ASSIGNMENTS_PAGE_STATE')
    if (savedState) {
      const state = JSON.parse(savedState)
      // 恢复分页
      if (state.pager) {
        pager.current = state.pager.current
        pager.pageSize = state.pager.pageSize
      }
      // 恢复筛选条件
      if (state.filters) {
        Object.assign(filters, state.filters)
        // 恢复日期选择器显示
        if (state.filters.dateRange?.length === 2) {
          defaultDateRange.value = [dayjs(state.filters.dateRange[0]), dayjs(state.filters.dateRange[1])]
        }
      }
      // 清除状态，避免刷新页面时仍然保持旧状态（可选）
      sessionStorage.removeItem('ASSIGNMENTS_PAGE_STATE')
    }
  } catch (e) {
    console.error('Restore page state failed:', e)
  }

  getList()
})

// 表格配置
const columns = [
  {
    title: '试卷名称',
    dataIndex: 'paperSource',
    key: 'paperSource',
    width: 200,
    ellipsis: true, // 超长文本显示省略号
    fixed: 'left' as const, // 固定在左侧
    customCell: (record: TableAssignmentRow) => ({ rowSpan: record.rowSpan }), // 支持行合并
  },
  {
    title: '年级',
    dataIndex: 'grade',
    key: 'grade',
    width: 90,
    customCell: (record: TableAssignmentRow) => ({ rowSpan: record.rowSpan }),
  },
  {
    title: '作业类型',
    dataIndex: 'homeworktype',
    key: 'homeworktype',
    width: 110,
    customCell: (record: TableAssignmentRow) => ({ rowSpan: record.rowSpan }),
  },
  {
    title: '科目',
    dataIndex: 'subject',
    key: 'subject',
    width: 80,
    customCell: (record: TableAssignmentRow) => ({ rowSpan: record.rowSpan }),
  },
  {
    title: '页码',
    dataIndex: 'completedPage',
    key: 'completedPage',
    width: 70,
    align: 'center',
    customCell: (record: TableAssignmentRow) => ({ rowSpan: record.rowSpan }),
  },
  {
    title: '班级',
    dataIndex: 'className',
    key: 'className',
    width: 100,
    // 班级列不合并，每个班级一行
  },
  {
    title: '已提交',
    dataIndex: 'submittedCount',
    key: 'submittedCount',
    width: 110,
  },
  {
    title: '未提交',
    dataIndex: 'unsubmittedCount',
    key: 'unsubmittedCount',
    width: 110,
  },
  {
    title: '异常（张）',
    dataIndex: 'abnormalPages',
    key: 'abnormalPages',
    width: 100,
  },
  {
    title: '操作',
    key: 'ops',
    width: 110,
    fixed: 'right' as const, // 固定在右侧
  },
]

const canPreview = (r: any) => {
  return Number(r?.submittedCount || 0) !== 0 || Number(r?.abnormalPages || 0) !== 0
}

// 查看作业详情
const preview = (r: AssignmentRow) => {
  if (!canPreview(r as any)) return

  // 保存当前列表状态（分页和筛选条件）
  const state = {
    pager: { current: pager.current, pageSize: pager.pageSize },
    filters: { ...filters },
  }
  sessionStorage.setItem('ASSIGNMENTS_PAGE_STATE', JSON.stringify(state))

  const encryptedId = encodeURIComponent(encrypt(String(r.id)))
  const path = ROUTES.TEACHER_HOMEWORK_DETAIL.replace(':id', encryptedId)
  const cid = (r as any)?.classId || filters.classNo

  if (cid) {
    sessionStorage.setItem(`hw_detail_classId_${String(r.id)}`, encrypt(String(cid)))
  }

  const grade = String((r as any)?.grade || '')
  const className = String((r as any)?.className || '')
  const gradeClass = [grade, className].filter(Boolean).join('') || '-'

  sessionStorage.setItem(
    `hw_detail_meta_${String(r.id)}`,
    JSON.stringify({
      subject: String((r as any)?.subject || '-') || '-',
      gradeClass,
      paperName: String((r as any)?.paperSource || (r as any)?.title || '-') || '-',
    })
  )

  router.push(path).catch(() => {})
}
</script>

<style scoped lang="scss">
.tch-assignment-page {
  /* 筛选条件卡片样式 */
  .tch-filter-card {
    background: var(--color-bg-card);
    border: 1px solid var(--color-border-light);
    padding: 18px;
    margin-bottom: 18px;
  }

  /* 表格容器样式 */
  .tch-table-card {
    .tch-table {
      width: 100%;
      flex: 1;
      min-height: 0;

      /* 确保表格内部元素正确布局 */
      :deep(.ant-spin-nested-loading),
      :deep(.ant-spin-container) {
        height: 100%;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }

      :deep(.ant-table) {
        flex: 1;
        min-height: 0;
        background: transparent;
        overflow: hidden;
      }

      :deep(.ant-table-container) {
        flex: 1;
        min-height: 0;
        border-inline-start: 0;
        border-inline-end: 0;
      }
    }
  }
}

.tch-title-cell {
  min-width: 260px;

  .tch-title-main {
    font-size: 14px;
  }

  .tch-title-sub {
    margin-top: 4px;
    font-size: 12px;
    opacity: 0.75;
  }
}

/* 平均分显示 */
.tch-avg {
  color: var(--color-text-primary);

  &.is-empty {
    color: var(--color-text-muted);
  }
}

/* 数量显示 */
.tch-count {
  display: inline-block;
  height: 26px;
  line-height: 26px;

  /* 灰色数量（0 或无数据） */
  &.tch-count-muted {
    color: var(--color-text-secondary);
  }

  /* 异常徽章（红色警告） */
  &.tch-abnormal-badge {
    color: var(--color-review-wrong-text);
  }
}
</style>
