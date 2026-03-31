<template>
  <div class="detail">
    <header>
      <div class="header-content">
        <div>
          <h2>试卷名称：{{ baseInfo?.examTitle }}</h2>
          <div class="tag-box">
            <p class="tag-item tag-blue">学科：{{ baseInfo?.subjectName }}</p>
            <p class="tag-item tag-purple">试卷类型：{{ baseInfo?.itemTypeName }}</p>
          </div>
        </div>
        <div class="header-right">
          <a-button type="primary" :icon="h(LeftOutlined)" @click="goBack">返回上一页</a-button>
        </div>
      </div>
    </header>

    <main class="exam-content flex-col flex-1 gap-sm">
      <template v-if="questionList.length">
        <QuestionList :list="questionList" source="DETAIL" :page="{ pageNo, pageSize }" @refreshList="handleRefreshList" />
        <TchPagination v-model:current="pageNo" v-model:pageSize="pageSize" :total="total" @change="getList" />
      </template>

      <div v-else class="mk-empty app-surface">
        <a-empty :image="simpleImage" description="该试卷正在切题中，请稍后查看……" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { getQuestionBankDetail, getQuestionBankDetailList } from '@/api/questionBank/index'
import type { QuestionBankDetailResponse, questionBankItem } from '@/api/questionBank/type'
import QuestionList from '@/components/common/QuestionList.vue'
import TchPagination from '@/components/common/table/TchPagination.vue'
import { LeftOutlined } from '@ant-design/icons-vue'
import { Empty } from 'ant-design-vue'
import { computed, h, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

const router = useRouter()
const route = useRoute()
// 获取当前作业ID
const detailId = computed(() => String(route.params.id || ''))
const baseInfo = ref<QuestionBankDetailResponse>()
const pageNo = ref(1)
const pageSize = ref(5)
const total = ref(0)
const questionList = ref<questionBankItem[]>([]) // 题库列表

const handleRefreshList = async (payload?: any) => {
  const nextPageNo = Number(payload?.pageNo)
  if (Number.isFinite(nextPageNo) && nextPageNo > 0 && nextPageNo !== pageNo.value) {
    pageNo.value = nextPageNo
  }
  await getList()
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 获取题库列表
const getList = async () => {
  try {
    const params = {
      detailId: detailId.value,
      pageNo: pageNo.value,
      pageSize: pageSize.value,
    }
    const res = await getQuestionBankDetailList(params)
    questionList.value = res.list || []
    total.value = res.total || 0
  } catch (error) {
    console.error('获取题库列表失败：', error)
  }
}

// 获取试卷详情
const getQuestionBankDetailData = async () => {
  try {
    const res = await getQuestionBankDetail({ detailId: detailId.value })
    baseInfo.value = res
  } catch (error) {
    console.error('获取试卷详情失败：', error)
  }
}

onMounted(() => {
  getQuestionBankDetailData()
  getList()
})
</script>

<style scoped lang="scss">
.detail {
  width: 100%;
  height: var(--content-height);
  header {
    width: 100%;
    .header-content {
      max-width: 1240px;
      padding: 20px;
      box-sizing: border-box;
      overflow-x: auto;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      gap: 16px;

      .tag-box {
        display: flex;
        gap: 10px;
        margin-top: 20px;

        .tag-item {
          padding: 5px 15px;
          border-radius: 10px;
          color: #fff;
          font-size: 12px;
          margin-bottom: 0;

          &.tag-blue {
            color: #2196f3;
            background: #e3f2fd;
            border: 1px solid #68b1ec;
          }
          &.tag-orange {
            color: #e67e22;
            background: #fff3e0;
            border: 1px solid #eca96e;
          }
          &.tag-green {
            color: #4caf50;
            background: #e8f5e9;
            border: 1px solid #80bd82;
          }
          &.tag-purple {
            color: #9c27b0;
            background: #f3e5f5;
            border: 1px solid #b75fc7;
          }
        }
      }

      .header-right {
        display: flex;
        align-items: flex-end;
        flex-direction: column;
      }
    }
  }

  .exam-content {
    max-width: 1240px;
    margin: 0 auto;
    overflow-x: auto;
    max-height: calc(100% - 128px);
  }

  .mk-empty {
    height: calc(100vh - 124px);
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;
  }
}
</style>
