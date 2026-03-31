<template>
  <div class="filter-card" :class="{ 'frosted-glass': glass }">
    <div class="filter-header">
      <div class="title flex-center">筛选条件</div>
      <div class="toggle-btn" @click="isCollapsed = !isCollapsed">
        <span>{{ isCollapsed ? '展开' : '收起' }}</span>
        <Icon
          :icon="isCollapsed ? 'solar:alt-arrow-down-bold-duotone' : 'solar:alt-arrow-up-bold-duotone'"
          width="16"
        />
      </div>
    </div>

    <div v-show="!isCollapsed" class="filter-body">
      <div class="filter-row">
        <span class="filter-label">题型：</span>
        <div class="filter-options">
          <span
            class="filter-pill"
            :class="{ active: filters.questionType === 'all' }"
            @click="selectDict('all', 'questionType')"
          >
            全部题型
          </span>
          <span
            class="filter-pill"
            v-for="type in questionTypeList"
            :key="type.questionTagId"
            :class="{ active: filters.questionType === type.questionTagId }"
            @click="selectDict(type.questionTagId, 'questionType')"
            >{{ type.tagName }}</span
          >
        </div>
      </div>
      <div class="filter-row">
        <span class="filter-label">难度：</span>
        <div class="filter-options">
          <span
            class="filter-pill"
            :class="{ active: filters.difficulty === 'all' }"
            @click="selectDict('all', 'difficulty')"
          >
            全部难度
          </span>
          <span
            class="filter-pill"
            v-for="diff in difficultyTagList"
            :key="diff.questionTagId"
            :class="{ active: filters.difficulty === diff.questionTagId }"
            @click="selectDict(diff.questionTagId, 'difficulty')"
            >{{ diff.tagName }}</span
          >
        </div>
      </div>
      <div class="filter-row" v-if="showSort">
        <span class="filter-label">排序：</span>
        <div class="filter-options">
          <span class="filter-pill" :class="{ active: filters.orderByColumn === 'count' }" @click="changeSort('count')">
            <span style="padding-right: 5px">错题人数</span>
            <Icon icon="cil:sort-ascending" style="font-size: 20px" v-if="sortObj.count === 'asc'" />
            <Icon icon="cil:sort-descending" style="font-size: 20px" v-if="sortObj.count === 'desc'" />
          </span>
          <span class="filter-pill" :class="{ active: filters.orderByColumn === 'time' }" @click="changeSort('time')">
            <span style="padding-right: 5px">错题时间</span>
            <Icon icon="cil:sort-ascending" style="font-size: 20px" v-if="sortObj.time === 'asc'" />
            <Icon icon="cil:sort-descending" style="font-size: 20px" v-if="sortObj.time === 'desc'" />
          </span>
        </div>
      </div>
      <div class="filter-row" v-if="showAnswer">
        <span class="filter-label">答案：</span>
        <div class="filter-options">
          <span class="filter-pill" :class="{ active: filters.answered === 'all' }" @click="selectAnswered('all')">
            全部
          </span>
          <span class="filter-pill" :class="{ active: filters.answered === '0' }" @click="selectAnswered('0')">
            缺失
          </span>
          <span class="filter-pill" :class="{ active: filters.answered === '1' }" @click="selectAnswered('1')">
            完整
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTagList } from '@/api/common/index'
import type { tagListResponse } from '@/api/common/type'
import { tagEnum } from '@/enum/common'
import { Icon } from '@iconify/vue'
import { onMounted, reactive, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    glass?: boolean
    showSort?: boolean
    showAnswer?: boolean
    subjectId?: string
  }>(),
  {
    glass: true,
    showSort: false,
    showAnswer: false,
    subjectId: '',
  }
)

const emit = defineEmits<{
  (e: 'getList', params: any): void
}>()

const isCollapsed = ref(true)

// 筛选条件
const filters = reactive<{
  questionType: string | undefined
  difficulty: string | undefined
  orderByColumn?: string
  isAsc?: string
  answered?: string
}>({
  questionType: 'all',
  difficulty: 'all',
  orderByColumn: 'count',
  isAsc: 'desc',
  answered: 'all',
})
// 排序
const sortObj = reactive<{
  count: string
  time: string
}>({
  count: 'desc',
  time: 'desc',
})
const difficultyTagList = ref<tagListResponse[]>([]) // 难度标签列表
const questionTypeList = ref<tagListResponse[]>([]) // 题型标签列表

// 选择标签
const selectDict = (id: string | undefined, key: 'questionType' | 'difficulty') => {
  filters[key] = id
  emit('getList', { [key]: id === 'all' ? undefined : id })
}

// 选择答案完整性
const selectAnswered = (value: string) => {
  filters.answered = value
  emit('getList', { answered: value === 'all' ? undefined : value })
}

// 切换排序
const changeSort = (type: 'count' | 'time') => {
  if (filters.orderByColumn === type) {
    // 已经是当前排序，切换升降序
    sortObj[type] = sortObj[type] === 'asc' ? 'desc' : 'asc'
    filters.isAsc = sortObj[type]
  } else {
    // 切换排序类型，默认降序
    filters.orderByColumn = type
    sortObj[type] = 'desc'
    filters.isAsc = 'desc'
  }
  emit('getList', {
    orderByColumn: filters.orderByColumn,
    isAsc: filters.isAsc,
  })
}

onMounted(() => {
  // 获取难度标签
  getTags(tagEnum.DIFFICULTY)
  // 获取题型标签
})

// 获取标签列表
const getTags = async (tagTypeVal: string) => {
  const res = await getTagList({ tagType: tagTypeVal })
  if (tagTypeVal === tagEnum.DIFFICULTY) {
    difficultyTagList.value = res || []
  } else if (
    tagTypeVal === tagEnum.QUESTION_TYPE ||
    tagTypeVal === tagEnum.CHINESE_QUESTION_TYPE ||
    tagTypeVal === tagEnum.ENGLISH_QUESTION_TYPE ||
    tagTypeVal === tagEnum.SCIENCE_QUESTION_TYPE
  ) {
    questionTypeList.value = res || []
  }
}

// 监听学科变化，更新题型标签
watch(
  () => props.subjectId,
  (newSubjectId, oldSubjectId) => {
    if (newSubjectId === '1') {
      getTags(tagEnum.CHINESE_QUESTION_TYPE)
    } else if (newSubjectId === '2') {
      getTags(tagEnum.QUESTION_TYPE)
    } else if (newSubjectId === '3') {
      getTags(tagEnum.ENGLISH_QUESTION_TYPE)
    } else if (newSubjectId === '4') {
      getTags(tagEnum.SCIENCE_QUESTION_TYPE)
    }

    // 只有在学科真正变化时（非初始化）才重置筛选条件并触发查询
    if (oldSubjectId !== undefined) {
      // 重置筛选条件
      filters.questionType = 'all'
      filters.difficulty = 'all'
      filters.answered = 'all'
      emit('getList', { questionType: undefined, difficulty: undefined, answered: undefined })
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.frosted-glass {
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

/* 筛选区 */
.filter-card {
  display: flex;
  flex-direction: column;
  padding: 10px 20px;
  gap: 8px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 4px;

  .title {
    font-weight: 700;
    color: #333;
    font-size: 15px;

    &::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 18px;
      background: #ff7d00;
      border-radius: 2px;
      margin-right: 8px;
    }
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #666;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: var(--color-primary);
    }
  }
}

.filter-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-row {
  display: flex;
  align-items: flex-start;

  .filter-label {
    width: 60px;
    color: #666;
    font-size: 14px;
    line-height: 28px;
    flex-shrink: 0;
  }

  .filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .filter-sort {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      color: #333;
      cursor: pointer;
      margin: 0;
      padding: 0;

      &:hover {
        color: var(--color-primary);
      }
    }
  }
}

.filter-pill {
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 20px;
  border: 1px solid transparent;
  display: flex;
  align-items: center;

  &:hover {
    color: var(--color-primary);
  }

  &.active {
    // background: var(--color-primary);
    // color: white;
    color: var(--color-primary);
    border-color: var(--color-primary-soft);
    background: var(--color-bg-warm);
  }
}

.filter-divider {
  height: 1px;
  background: #eee;
  margin: 4px 0;
}

.filter-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .filter-more {
    display: flex;
    align-items: center;
    gap: 24px;

    .filter-label {
      color: #666;
    }

    .switch-group {
      display: flex;
      align-items: center;
      gap: 8px;
      .switch-label {
        font-size: 14px;
        color: #333;
      }
    }
  }
}
</style>
