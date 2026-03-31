<template>
  <div class="mk-page">
    <div class="mk-grid">
      <aside class="mk-left">
        <QuerySidebar title="班级错题库" width="100%" mode="slot">
          <div class="flex-col gap-md">
            <!-- 年级 -->
            <div>
              <div class="input-label">年级</div>
              <a-select
                v-model:value="filters.gradeId"
                style="width: 240px"
                placeholder="请选择年级"
                @change="selectGradeId"
              >
                <a-select-option v-for="item in gradeList" :key="item.dictValue" :value="item.dictValue">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </div>
            <!-- 班级 -->
            <div>
              <div class="input-label">班级</div>
              <a-select
                placeholder="请选择班级"
                style="width: 240px"
                v-model:value="filters.classId"
                @change="selectClassId"
              >
                <a-select-option v-for="item in classList" :key="item.classId">
                  {{ item.className }}
                </a-select-option>
              </a-select>
            </div>
            <!-- 学科 -->
            <SelectCom
              :typeList="[selectEnum.SUBJECT]"
              :selectValue="[filters.subjectId]"
              showLabel
              width="240px"
              @getList="getParams"
            />
            <!-- 时间 -->
            <div>
              <div class="input-label">时间</div>
              <RangePicker @getList="getParams" />
            </div>
          </div>
        </QuerySidebar>
      </aside>

      <!-- 右侧内容区 -->
      <main class="exam-content flex-col flex-1 gap-sm">
        <!-- 顶部筛选区 -->
        <QuestionTopFilter @getList="getParams" showSort :subjectId="filters.subjectId" />

        <template v-if="questionList.length">
          <QuestionList :list="questionList" source="WRONG" :page="{ pageNo, pageSize }" showCountTime />

          <TchPagination v-model:current="pageNo" v-model:pageSize="pageSize" :total="total" @change="getList" />
        </template>
        <template v-else>
          <div class="mk-empty app-surface">
            <a-empty :image="simpleImage" description="暂无数据" />
          </div>
        </template>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getClassPage } from '@/api/common/index'
import type { dictListResponse } from '@/api/common/type'
import { listQuestionBank } from '@/api/questionBank/index'
import type { questionBankItem } from '@/api/questionBank/type'
import QuerySidebar from '@/components/common/QuerySidebar.vue'
import QuestionList from '@/components/common/QuestionList.vue'
import QuestionTopFilter from '@/components/common/QuestionTopFilter.vue'
import SelectCom from '@/components/common/Select.vue'
import RangePicker from '@/components/common/table/RangePicker.vue'
import TchPagination from '@/components/common/table/TchPagination.vue'
import { QuestionBasketEnum, selectEnum } from '@/enum/common'
import { getUserBaseInfo } from '@/services/storage'
import { dictGradeOneList, dictGradeThreeList, dictGradeTwoList } from '@/utils/dictList'
import { Empty } from 'ant-design-vue'
import { onMounted, reactive, ref } from 'vue'

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

// 参数类型定义
interface FilterParams {
  key: keyof typeof filters
  value: string | undefined
}

// 日期范围参数类型
interface DateRangeParams {
  startDate?: string
  endDate?: string
}

// 分页与筛选
const pageNo = ref(1)
const pageSize = ref(5)
const total = ref(0)
const questionList = ref<questionBankItem[]>([]) // 题库列表
const parsedUserInfo = getUserBaseInfo()
const classList = ref(parsedUserInfo?.classInfoList || []) // 班级列表
const stageId = ref(parsedUserInfo?.stageId || undefined)
const gradeList = ref<dictListResponse[]>([]) // 年级字典列表
const filters = reactive({
  gradeId: parsedUserInfo?.gradeId || undefined, // 年级ID
  subjectId: parsedUserInfo?.subjectId || undefined, // 学科ID
  classId: classList.value[0]?.classId ?? undefined, // 班级ID
  questionType: '', // 题型
  difficulty: '', // 难度
  startDate: '', // 开始日期
  endDate: '', // 结束日期
  orderByColumn: 'count', // 排序字段
  isAsc: 'desc', // 排序方式
})

onMounted(() => {
  // 获取题库列表
  getList()
  getGadeList()
})

// 年级列表
const getGadeList = () => {
  // 重新获取年级列表
  if (stageId.value === '1') {
    gradeList.value = dictGradeOneList
  } else if (stageId.value === '2') {
    gradeList.value = dictGradeTwoList
  } else if (stageId.value === '3') {
    gradeList.value = dictGradeThreeList
  }
}

// 选择年级时，更新 filters.gradeId 并刷新列表
const selectGradeId = (value: string) => {
  filters.gradeId = value || undefined
  filters.classId = undefined
  pageNo.value = 1
  getList()
  getClassList(value)
}

// 选择班级时，更新 filters.classId 并刷新列表
const selectClassId = (value: string) => {
  filters.classId = value || undefined
  if (value) {
    localStorage.setItem('wrongClassId', value)
  }
  pageNo.value = 1
  getList()
}

const getParams = (params: FilterParams | DateRangeParams) => {
  // 参数校验，避免解构 null 值
  if (!params || typeof params !== 'object') {
    console.warn('Invalid params received:', params)
    return
  }
  Object.assign(filters, params)

  // 重置分页并刷新列表
  pageNo.value = 1
  getList()
}

// 列表接口
const getList = async () => {
  const params = {
    pageNo: pageNo.value,
    pageSize: pageSize.value,
    gradeId: filters.gradeId,
    subjectId: filters.subjectId,
    classId: filters.classId,
    questionType: filters.questionType,
    difficulty: filters.difficulty,
    assignmentType: QuestionBasketEnum.WRONG,
    startDate: filters.startDate,
    endDate: filters.endDate,
    orderByColumn: filters.orderByColumn,
    isAsc: filters.isAsc,
  }
  console.log('请求参数:', params)
  const res = await listQuestionBank(params)
  questionList.value = res.list || []
  total.value = res.total || 0
}

// 获取联动班级
const getClassList = async (gradeId: string) => {
  const res = await getClassPage({
    gradeId: gradeId,
    pageNo: 1,
    pageSize: 20,
  })
  classList.value = res?.list || []
}
</script>

<style scoped lang="scss">
.mk-page {
  width: 100%;
  height: var(--content-height);
  min-height: 0;
  overflow: hidden;

  .mk-grid {
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 18px;

    .mk-left {
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* 右侧内容区 */
    .exam-content {
      min-width: 500px;
      overflow-x: auto;
      max-height: var(--content-height);
    }

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
    }
  }
}
.mk-empty {
  height: calc(100vh - 124px);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
