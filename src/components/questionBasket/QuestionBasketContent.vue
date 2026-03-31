<template>
  <div class="basket-content">
    <!-- 试题列表 -->
    <div class="question-list-box">
      <a-empty style="padding-top: 30px" v-if="list.length === 0" :image="simpleImage" description="暂无试题" />
      <div v-else class="question-list">
        <template v-for="(item, index) in list" :key="index">
          <div v-for="(q, i) in item.children" :key="q.id" class="question-item">
            <div class="question-item-left">
              <span class="question-item-icon" aria-hidden="true">
                <ProfileOutlined style="font-size: 22px; color: #fb923c" />
              </span>

              <div class="question-item-main">
                <div class="question-item-title">{{ item.questionTypeTagName }}{{ i + 1 }}</div>
                <div class="question-tags">
                  <span class="question-tag" :style="getColorFromString(index)">
                    {{ q.questionTypeTagName }}
                  </span>
                  <span class="question-tag" :style="getColorFromString(difficultyTagIndex[q.difficulty || ''] || 0)">
                    {{ q.difficultyTagName }}
                  </span>
                </div>
              </div>
            </div>

            <button type="button" class="question-item-del" aria-label="移除" @click="remove(q.draftBoxId)">
              <DeleteOutlined />
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- 题型分布 -->
    <div class="qb-statistics">
      <div class="qb-panel-head">
        <span class="qb-panel-icon is-type" aria-hidden="true">
          <AppstoreOutlined />
        </span>
        <span>题型分布</span>
      </div>
      <div class="qb-stats">
        <a-empty v-if="!hasAnyQuestion" :image="simpleImage" description="暂无数据" />
        <div v-else class="flex-col gap-xs">
          <div v-for="(row, i) in typeStatRows" :key="row.key" class="qb-stat-row">
            <div>{{ row.label }}</div>
            <div class="qb-stat-count" :style="getColorFromString(i)">{{ row.count }}道</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 难度分布 -->
    <div class="qb-statistics">
      <div class="qb-panel-head">
        <span class="qb-panel-icon is-difficulty" aria-hidden="true">
          <BarChartOutlined />
        </span>
        <span>难度分布</span>
      </div>
      <div class="qb-stats">
        <div v-for="(row, i) in difficultyStatRows" :key="row.key" class="qb-stat-row">
          <div>{{ row.label }}</div>
          <div class="qb-stat-count" :style="getColorFromString(i)">{{ row.count }}道</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTagList } from '@/api/common/index'
import type { tagListResponse } from '@/api/common/type'
import type { QuestionBasketRsponse } from '@/api/questionBasket/type'
import { tagEnum } from '@/enum/common'
import { questionBasketService } from '@/services/questionBasket'
import { getColorFromString } from '@/utils/index'
import { AppstoreOutlined, BarChartOutlined, DeleteOutlined, ProfileOutlined } from '@ant-design/icons-vue'
import { Empty, message } from 'ant-design-vue'
import { computed, onMounted, reactive, ref } from 'vue'
const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

// 父组件传值
const props = defineProps<{ list: QuestionBasketRsponse[] }>()

// 基础状态
const difficultyTagList = ref<tagListResponse[]>([])
const difficultyTagIndex = reactive<Record<string, number>>({
  qt_diff_easy: 0,
  qt_diff_medium: 1,
  qt_diff_hard: 2,
})

// 计算属性
const hasAnyQuestion = computed(() => props.list.some(item => Array.isArray(item.children) && item.children.length > 0))
// 题型统计数据
const typeStatRows = computed(() => {
  return props.list
    .filter(item => Array.isArray(item.children) && item.children.length > 0)
    .map(item => {
      const key = item.questionTypeTagId || item.children?.[0]?.questionType || item.questionTypeTagName
      return {
        key: key || '',
        label: item.questionTypeTagName || '',
        count: item.children.length,
      }
    })
})
// 难度统计数据
const difficultyStatRows = computed(() => {
  // 统计每个难度的数量
  const difficultyCountMap: Record<string, number> = {}

  props.list.forEach(item => {
    item.children.forEach(child => {
      const difficulty = child.difficulty
      if (difficulty) {
        difficultyCountMap[difficulty] = (difficultyCountMap[difficulty] || 0) + 1
      }
    })
  })

  // 根据 difficultyTagList 生成统计行数据
  return difficultyTagList.value.map(tag => ({
    key: tag.questionTagId || '',
    label: tag.tagName || '',
    count: difficultyCountMap[tag.questionTagId || ''] || 0,
  }))
})

onMounted(() => {
  // 获取难度标签
  getTags(tagEnum.DIFFICULTY)
})

// 获取标签列表
const getTags = async (tagTypeVal: string) => {
  const res = await getTagList({ tagType: tagTypeVal })
  if (tagTypeVal === tagEnum.DIFFICULTY) {
    difficultyTagList.value = res || []
  }
}

// 移除试题篮
const remove = async (draftBoxId: string | undefined) => {
  if (!draftBoxId) {
    message.error('请选择要移除的试题')
    return
  }
  const res = await questionBasketService.removeQuestionBasket(draftBoxId, '', 'BOOK')
  if (res) {
    await questionBasketService.initGetlist()
    message.success('从试题篮移除成功')
  }
}
</script>

<style scoped lang="less">
.basket-content {
  .question-list-box {
    width: 100%;
    min-height: 140px;
    margin-bottom: 15px;
    border-radius: 18px;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);

    .question-list {
      height: 176px;
      display: flex;
      flex-direction: column;
      overflow-y: scroll;
    }

    .question-item {
      padding: 14px 14px;
      border-radius: 18px;
      background: #fff;
      border: 1px solid rgba(0, 0, 0, 0.04);
      box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      transition:
        transform 160ms ease,
        box-shadow 160ms ease,
        border-color 160ms ease;

      &:hover {
        transform: translateY(-1px);
        border-color: rgba(0, 0, 0, 0.06);
        box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
      }
      &:last-child {
        margin-bottom: 0;
      }

      .question-item-left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;

        .question-item-icon {
          width: 50px;
          height: 50px;
          background: #fff7ed;
          text-align: center;
          line-height: 50px;
          border-radius: 12px;
          padding-top: 3px;
        }
      }

      .question-item-main {
        min-width: 0;

        .question-item-title {
          font-size: 14px;
          font-weight: 700;
          color: rgba(17, 24, 39, 0.9);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 240px;
        }
        .question-tags {
          margin-top: 6px;
          display: flex;
          gap: 8px;
        }
        .question-tag {
          height: 22px;
          padding: 0 10px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          font-size: 12px;
          font-weight: 700;
        }
      }

      .question-item-del {
        width: 34px;
        height: 34px;
        border-radius: 12px;
        border: none;
        background: rgba(0, 0, 0, 0.04);
        color: rgba(17, 24, 39, 0.5);
        transform: translateY(-1px);
        cursor: pointer;
      }
    }
  }

  .qb-statistics {
    padding: 15px 20px 20px;
    margin-bottom: 14px;
    border-radius: 20px;
    background: #fff;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
    .qb-panel-head {
      width: 100%;
      padding-bottom: 10px;
      border-bottom: 1px solid #f0f0f0;
      margin-bottom: 10px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      color: rgba(17, 24, 39, 0.78);
      .qb-panel-icon {
        width: 28px;
        height: 28px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(17, 24, 39, 0.05);
        color: rgba(17, 24, 39, 0.55);
      }
      .qb-panel-icon.is-type {
        background: #fff3e0;
        color: #e67e22;
      }

      .qb-panel-icon.is-difficulty {
        background: #e8f5e9;
        color: #4caf50;
      }
    }
    .qb-stats {
      display: flex;
      flex-direction: column;
      gap: 5px;

      .qb-stat-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        color: rgba(17, 24, 39, 0.72);
        .qb-stat-count {
          height: 24px;
          min-width: 44px;
          padding: 0 10px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
      }
    }
  }
}
</style>
