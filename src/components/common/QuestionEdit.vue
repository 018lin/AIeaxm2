<template>
  <a-modal
    :open="open"
    :width="800"
    centered
    okText="保存修改"
    cancelText="取消"
    @cancel="handleClose"
    @ok="handleSave"
    class="question-edit-modal"
  >
    <div>
      <div class="form-header">题目编辑</div>
      <div class="form">
        <div class="form-item app-surface">
          <h2>基本信息</h2>
          <div class="form-select-box">
            <div class="form-select">
              <p class="form-label">学段</p>
              <a-select placeholder="请选择学段" class="select" v-model:value="baseInfo.stageId" @change="changeStage">
                <a-select-option v-for="item in dictStageList" :key="item.dictValue" :value="item.dictValue">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </div>
            <div class="form-select">
              <p class="form-label">学科</p>
              <!-- 学科不支持修改 -->
              <a-select placeholder="请选择学科" class="select" v-model:value="baseInfo.subjectId" disabled>
                <a-select-option v-for="item in subjectList" :key="item.dictValue" :value="item.dictValue">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </div>
            <div class="form-select">
              <p class="form-label">难度</p>
              <a-select placeholder="请选择难度" class="select" v-model:value="baseInfo.difficulty">
                <a-select-option
                  v-for="item in difficultyTagList"
                  :key="item.questionTagId"
                  :value="item.questionTagId"
                >
                  {{ item.tagName }}
                </a-select-option>
              </a-select>
            </div>
            <div class="form-select">
              <p class="form-label">题型</p>
              <a-select placeholder="请选择题型" class="select" v-model:value="baseInfo.questionType">
                <a-select-option v-for="item in questionTypeList" :key="item.questionTagId" :value="item.questionTagId">
                  {{ item.tagName }}
                </a-select-option>
              </a-select>
            </div>
          </div>
        </div>
        <div class="form-item app-surface">
          <h2>知识点</h2>
          <div class="tag-box knowledge-tag-box">
            <template v-for="(knowledge, index) in baseInfo.knowledgePoints" :key="knowledge.knowledgePointId">
              <a-tag
                class="tag-item"
                :closable="baseInfo.knowledgePoints && baseInfo.knowledgePoints.length > 1"
                @close="handleCloseKnowledge(index)"
              >
                {{ knowledge.pointName }}
              </a-tag>
            </template>
            <a-tag class="tag-add" @click="addKnowledge">
              <PlusOutlined />
              添加知识点
            </a-tag>
          </div>
        </div>
        <div class="form-item app-surface">
          <h2>教材章节</h2>
          <div></div>
          <div class="form-select-box">
            <div class="form-select">
              <p class="form-label">版本</p>
              <a-select placeholder="请选择版本" class="select" v-model:value="baseInfo.textbookVersion">
                <a-select-option v-for="item in versionList" :key="item.dictValue" :value="item.dictValue">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </div>
            <div class="form-select">
              <p class="form-label">年级</p>
              <a-select placeholder="请选择年级" class="select" v-model:value="baseInfo.gradeId">
                <a-select-option v-for="item in gradeList" :key="item.dictValue" :value="item.dictValue">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </div>
            <div class="form-select">
              <p class="form-label">册次</p>
              <a-select placeholder="请选择册次" class="select" v-model:value="baseInfo.volume">
                <a-select-option v-for="item in volumeList" :key="item.dictValue" :value="item.dictValue">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </div>
          </div>
          <div>
            <p class="form-label">所属章节</p>
            <div class="tag-box">
              <a-tag class="tag-item">{{ baseInfo.chapterName || '-' }}</a-tag>
              <a-tag class="tag-add" @click="editChapter">
                <EditOutlined />
                修改章节
              </a-tag>
            </div>
          </div>
        </div>
        <div class="form-item app-surface">
          <h2>题干</h2>
          <div class="form-canvas"><QuestionItem :questionInfo="baseInfo" /></div>
        </div>
        <div class="form-item app-surface">
          <div class="form-item-title">
            <h2>答案与解析</h2>
            <a-button type="primary" :icon="h(StarOutlined)" @click="getAiAnswer">AI生成答案与解析</a-button>
          </div>
          <a-spin :spinning="answerLoading" tip="加载中……" :delay="delayTime">
            <template v-if="baseInfo.answers && baseInfo.answers.length === 1">
              <a-textarea
                v-for="answerItem in baseInfo.answers"
                class="textarea"
                placeholder="请输入答案"
                :auto-size="{ minRows: 3, maxRows: 5 }"
                v-model:value="answerItem.answer"
                :key="answerItem.area_id"
              />
            </template>
            <div v-else-if="baseInfo.answers && baseInfo.answers.length > 1" class="form-item-answers">
              <div v-for="(answerItem, index) in baseInfo.answers" :key="answerItem.area_id" class="form-item-answer">
                <p class="form-item-answer-label">空{{ answerItem.area_id }}:</p>
                <a-textarea
                  class="textarea"
                  placeholder="请输入答案"
                  :auto-size="{ minRows: 2, maxRows: 3 }"
                  v-model:value="answerItem.answer"
                />
                <a-button
                  v-if="canDeleteAnswer"
                  type="text"
                  danger
                  size="small"
                  class="delete-answer-btn"
                  @click="deleteAnswer(index)"
                >
                  删除
                </a-button>
              </div>
            </div>
            <template v-else></template>
            <a-textarea
              class="textarea"
              placeholder="请输入解析"
              :auto-size="{ minRows: 3, maxRows: 5 }"
              v-model:value="baseInfo.answerAnalysis"
            />
          </a-spin>
        </div>
      </div>
    </div>
  </a-modal>

  <!-- 添加知识点弹窗 -->
  <a-modal
    :open="isAddKnowledge"
    :width="660"
    centered
    okText="确定"
    cancelText="取消"
    :z-index="2000"
    @cancel="handleCancelAddKnowledge"
    @ok="handleAddKnowledge"
  >
    <div>
      <div class="form-header">选择知识点</div>
      <div class="tree-box">
        <a-tree
          v-if="knowledgeTreeData.length"
          v-model:checkedKeys="knowledgeCheckedKeys"
          checkable
          :tree-data="knowledgeTreeData"
          :field-names="{ key: 'knowledgePointId', title: 'pointName' }"
        >
          <template #title="{ dataRef }">
            <div class="tree-node-row flex-between w-full">
              <span class="node-title">
                {{ dataRef.pointName }}
              </span>
            </div>
          </template>
        </a-tree>
        <div v-else class="empty-box">
          <a-empty description="敬请期待~" />
        </div>
      </div>
    </div>
  </a-modal>

  <!-- 修改章节弹窗 -->
  <a-modal :open="isEditChapter" :width="660" centered :footer="null" :z-index="2000" @cancel="handleCancelEditChapter">
    <div>
      <div class="form-header">选择章节</div>
      <div class="tree-box">
        <a-tree
          v-if="chapterTreeData.length"
          v-model:selectedKeys="selectedChapterKeys"
          :tree-data="chapterTreeData"
          :field-names="{ key: 'chapterId', title: 'chapterName' }"
          @select="handleSelectChapter"
        >
          <template #title="{ dataRef }">
            <div class="tree-node-row flex-between w-full">
              <span class="node-title">
                {{ dataRef.chapterName || dataRef.unitName }}
              </span>
            </div>
          </template>
        </a-tree>
        <div v-else class="empty-box">
          <a-empty description="敬请期待~" />
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { getChapterList, getDictList, getKnowledgeTreeList, getTagList } from '@/api/common/index'
import type { chapterResponse, dictListResponse, knowledgeTreeResponse, tagListResponse } from '@/api/common/type'
import { editQuestionBank, getQuestionBankAIAnswer, getQuestionBankById } from '@/api/questionBank/index'
import type { QuestionBankByIdResponse } from '@/api/questionBank/type'
import QuestionItem from '@/components/common/QuestionItem.vue'
import { selectEnum, tagEnum } from '@/enum/common'
import { dictGradeOneList, dictGradeThreeList, dictGradeTwoList, dictStageList } from '@/utils/dictList'
import { EditOutlined, PlusOutlined, StarOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, h, ref, watch } from 'vue'

// 父组件传递的参数
const props = defineProps<{
  open: boolean
  questionId: string
  userId: string
}>()
const emit = defineEmits<{
  (e: 'closeEdit'): void
  (e: 'refreshList'): void
}>()

// 状态
const difficultyTagList = ref<tagListResponse[]>([]) // 难度标签列表
const questionTypeList = ref<tagListResponse[]>([]) // 题型标签列表
const gradeList = ref<dictListResponse[]>([]) // 年级字典列表
const subjectList = ref<dictListResponse[]>([]) // 学科字典列表
const versionList = ref<dictListResponse[]>([]) // 版本字典列表
const volumeList = ref<dictListResponse[]>([]) // 册次字典列表
const baseInfo = ref<QuestionBankByIdResponse>({} as QuestionBankByIdResponse) // 试题基础信息
const originalBaseInfo = ref<QuestionBankByIdResponse>({} as QuestionBankByIdResponse) // 保存原始基础信息
// AI 生成的答案/解析
const answerLoading = ref<boolean>(false) // AI 生成的答案的加载状态
const delayTime = 500 // 延迟时间
const originalAnswersLength = ref<number>(0) // 保存原始答案数组长度
// 知识点树相关状态
const knowledgeTreeData = ref<knowledgeTreeResponse[]>([]) // 知识点树数据
const isAddKnowledge = ref<boolean>(false)
const knowledgeCheckedKeys = ref<string[]>([]) // 选中的知识点ID列表
const originalKnowledgePoints = ref<any[]>([]) // 保存原始知识点列表
// 章节树相关状态
const chapterTreeData = ref<chapterResponse[]>([])
const isEditChapter = ref<boolean>(false)
const chapterIds = ref<string[]>([])
const selectedChapterKeys = ref<string[]>([])

const knowledgePointIds = computed(() => {
  return baseInfo.value.knowledgePoints?.map(point => point.knowledgePointId) || []
})

// 判断答案是否可以删除
const canDeleteAnswer = computed(() => {
  const currentLength = baseInfo.value.answers?.length || 0
  return currentLength > originalAnswersLength.value
})

// 保存
const handleSave = async () => {
  // 比较是否有修改
  const isChanged =
    JSON.stringify(baseInfo.value) !== JSON.stringify(originalBaseInfo.value) ||
    JSON.stringify(chapterIds.value) !== JSON.stringify(selectedChapterKeys.value)

  if (!isChanged) {
    message.warning('没有改动，无需保存')
    return
  }

  const params = {
    answerAnalysis: baseInfo.value.answerAnalysis,
    chapterIds: chapterIds.value,
    answers: baseInfo.value.answers,
    difficulty: baseInfo.value.difficulty,
    knowledgePointIds: knowledgePointIds.value,
    questionId: props.questionId,
    questionType: baseInfo.value.questionType,
    stageId: baseInfo.value.stageId,
    subjectId: baseInfo.value.subjectId,
    updater: props.userId,
    gradeId: baseInfo.value.gradeId,
    textBookVersionId: baseInfo.value.textbookVersion,
    volume: baseInfo.value.volume,
  }
  const res = await editQuestionBank(params as any)
  if (res) {
    emit('refreshList')
    handleClose()
  }
}

// 关闭弹窗
const handleClose = () => {
  handleCancelAddKnowledge()
  emit('closeEdit')
}

// 添加知识点标签-打开弹窗
const addKnowledge = () => {
  // 保存原始状态
  originalKnowledgePoints.value = JSON.parse(JSON.stringify(baseInfo.value.knowledgePoints || []))
  isAddKnowledge.value = true
  getTreeList()
}
// 添加知识点标签-确认添加
const handleAddKnowledge = () => {
  // 从树形数据中提取选中的知识点
  const flattenTree = (nodes: knowledgeTreeResponse[]): knowledgeTreeResponse[] => {
    let result: knowledgeTreeResponse[] = []
    nodes.forEach(node => {
      result.push(node)
      if (node.children && node.children.length > 0) {
        result = result.concat(flattenTree(node.children))
      }
    })
    return result
  }

  const flatNodes = flattenTree(knowledgeTreeData.value)
  const selectedPoints = flatNodes
    .filter(node => knowledgeCheckedKeys.value.includes((node as any).knowledgePointId || ''))
    .map(node => ({
      knowledgePointId: (node as any).knowledgePointId,
      pointName: (node as any).pointName,
    }))

  // 合并原有知识点和新选中的知识点
  const existingPoints = baseInfo.value.knowledgePoints || []
  const allPoints = [...existingPoints, ...selectedPoints]

  // 去重：根据 knowledgePointId 去重
  const uniquePoints = allPoints.filter(
    (point, index, self) => index === self.findIndex(p => p.knowledgePointId === point.knowledgePointId)
  )

  baseInfo.value.knowledgePoints = uniquePoints
  isAddKnowledge.value = false
  knowledgeCheckedKeys.value = []
}
// 添加知识点标签-关闭弹窗
const handleCancelAddKnowledge = () => {
  // 恢复原始状态
  baseInfo.value.knowledgePoints = JSON.parse(JSON.stringify(originalKnowledgePoints.value))
  isAddKnowledge.value = false
  // 清空选择状态
  knowledgeCheckedKeys.value = []
}
// 删除知识点标签
const handleCloseKnowledge = (index: number) => {
  const knowledgePoints = baseInfo.value.knowledgePoints
  if (knowledgePoints && knowledgePoints.length > 1) {
    knowledgePoints.splice(index, 1)
  }
}

// 编辑章节-打开弹窗
const editChapter = () => {
  isEditChapter.value = true
  getChapterTreeList()
  console.log('isEditChapter:', isEditChapter.value)
}
// 编辑章节-确认修改
const handleSelectChapter = (keys: string[], info: any) => {
  const infoData = info.node || {}
  if (infoData.children && infoData.children.length > 0) {
    message.warning('请选择最末级章节')
    return
  }
  chapterIds.value = keys
  baseInfo.value.chapterName = infoData.chapterName || infoData.unitName || ''
  handleCancelEditChapter()
}
// 编辑章节-关闭弹窗
const handleCancelEditChapter = () => {
  isEditChapter.value = false
  selectedChapterKeys.value = []
}

// 获取基础信息
const getBaseInfo = async () => {
  const res = await getQuestionBankById({ questionId: props.questionId })
  changeStage(res.stageId || '')
  baseInfo.value = res
  originalBaseInfo.value = JSON.parse(JSON.stringify(res))
  // 保存原始答案数组长度
  originalAnswersLength.value = res.answers?.length || 0
}

// 获取题目的AI答案
const getAiAnswer = async () => {
  answerLoading.value = true
  const res = await getQuestionBankAIAnswer({ questionId: props.questionId })
  if (res) {
    const aiAnswers = res.aiAnswer || []
    const currentAnswers = baseInfo.value.answers || []

    // AI返回长度小于原始长度：补充空答案
    if (aiAnswers.length < currentAnswers.length) {
      const result = [...aiAnswers]
      for (let i = aiAnswers.length; i < currentAnswers.length; i++) {
        result.push({
          area_id: currentAnswers[i].area_id,
          answer: '',
        })
      }
      baseInfo.value.answers = result
    } else {
      // AI返回长度>=原始长度：直接使用AI答案
      baseInfo.value.answers = aiAnswers
    }

    baseInfo.value.answerAnalysis = res.aiAnalysis
  }
  answerLoading.value = false
}

// 删除答案项
const deleteAnswer = (index: number) => {
  if (canDeleteAnswer.value && baseInfo.value.answers) {
    baseInfo.value.answers.splice(index, 1)
  }
}

// 切换学段时，重置年级
const changeStage = (value: string) => {
  // 重新获取年级列表
  if (value === '1') {
    gradeList.value = dictGradeOneList
    baseInfo.value.gradeId = undefined
    return
  } else if (value === '2') {
    gradeList.value = dictGradeTwoList
    baseInfo.value.gradeId = undefined
    return
  } else if (value === '3') {
    gradeList.value = dictGradeThreeList
    baseInfo.value.gradeId = undefined
    return
  }
}

// 监听弹窗打开状态，打开时才加载数据
watch(
  () => props.open,
  newVal => {
    if (newVal && difficultyTagList.value.length === 0) {
      // 获取难度标签
      getTags(tagEnum.DIFFICULTY)
      // 获取题型标签
      getTags(tagEnum.QUESTION_TYPE)
      // 获取字典数据
      getDictData([selectEnum.SUBJECT, selectEnum.TEXTBOOK_VERSION, selectEnum.TEXTBOOK_VOLUME]) //
    }
  }
)

// 监听 questionId 变化，有值时获取试题详情
watch(
  () => props.questionId,
  newVal => {
    if (newVal) {
      getBaseInfo()
    }
  },
  { immediate: true }
)

// 获取标签列表
const getTags = async (tagTypeVal: string) => {
  const res = await getTagList({ tagType: tagTypeVal })
  if (tagTypeVal === tagEnum.DIFFICULTY) {
    difficultyTagList.value = res || []
  } else if (
    tagTypeVal === tagEnum.QUESTION_TYPE ||
    tagTypeVal === tagEnum.CHINESE_QUESTION_TYPE ||
    tagTypeVal === tagEnum.ENGLISH_QUESTION_TYPE
  ) {
    questionTypeList.value = res || []
  }
}

// 监听学科变化，更新题型标签
watch([() => baseInfo.value.subjectId, () => subjectList.value], ([newSubjectId, newSubjectList]) => {
  if (newSubjectId && newSubjectList && newSubjectList.length > 0) {
    const subjectItem = newSubjectList.find(item => item.dictValue === newSubjectId)
    const subjectName = subjectItem?.label || ''
    if (subjectName === '语文') {
      getTags(tagEnum.CHINESE_QUESTION_TYPE)
    } else if (subjectName === '英语') {
      getTags(tagEnum.ENGLISH_QUESTION_TYPE)
    } else {
      getTags(tagEnum.QUESTION_TYPE)
    }
  }
})

// 获取字典数据
const getDictData = async (type: string[]) => {
  const res = await getDictList({ dictTypes: type })
  const resData = res || []

  // 遍历返回的字典数据，根据 dictType 分别赋值
  resData.forEach(item => {
    if (item.dictType === selectEnum.SUBJECT) {
      subjectList.value = item.dictTypeList || []
    } else if (item.dictType === selectEnum.TEXTBOOK_VERSION) {
      versionList.value = item.dictTypeList || []
    } else if (item.dictType === selectEnum.TEXTBOOK_VOLUME) {
      volumeList.value = item.dictTypeList || []
    }
  })
}

// 获取知识点树
const getTreeList = async () => {
  const params = {
    parentId: '0', // 父级知识点ID（0表示根节点）
    stageId: baseInfo.value.stageId,
    subjectId: baseInfo.value.subjectId,
  }
  const res = await getKnowledgeTreeList(params)
  knowledgeTreeData.value = res
}

// 获取章节树
const getChapterTreeList = async () => {
  const params = {
    stage: baseInfo.value.stageId,
    gradeId: baseInfo.value.gradeId,
    subject: baseInfo.value.subjectId,
    textbookVersion: baseInfo.value.textbookVersion,
    volume: baseInfo.value.volume,
    parentId: '0',
  }
  const res = await getChapterList(params)
  chapterTreeData.value = res || []
}
</script>

<style scoped lang="scss">
.form-header {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}
.form {
  display: flex;
  flex-direction: column;
  height: 720px;
  overflow-y: auto;
  padding: 0 10px 0 0;
  margin-top: 15px;

  .form-item {
    padding: 15px;
    margin-top: 20px;
    &:first-child {
      margin-top: 0;
    }

    .form-item-title {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    h2 {
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

    .form-label {
      font-size: 14px;
      color: #757575;
      margin-bottom: 5px;
    }

    .form-select-box {
      margin-top: 20px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      justify-content: space-between;
      .form-select {
        width: 280px;
        margin-bottom: 15px;
        .select {
          width: 100%;
        }
      }

      .form-name {
        width: 280px;
        height: 44px;
        border: 1px solid transparent;
        color: rgba(0, 0, 0, 0.88);
        font-size: 14px;
        margin-bottom: 15px;
        background-color: rgb(248 247 246 / var(--tw-bg-opacity, 1));
        border-color: rgb(242, 235, 230);
        border-radius: 6px;
        line-height: 44px;
        padding: 0 11px;
      }
    }

    .tag-box {
      background: rgb(248 247 246 / var(--tw-bg-opacity, 1));
      border: 1px solid rgb(242, 235, 230);
      padding: 15px 15px 5px;
      border-radius: 10px;
      .tag-item {
        font-size: 14px;
        padding: 5px 10px;
        border-radius: 8px;
        margin-bottom: 10px;
        background: #ffffff;
      }
      .tag-add {
        font-size: 14px;
        padding: 5px 10px;
        cursor: pointer;
        color: #ffffff;
        background: #ec7a2e;
      }
    }
    .knowledge-tag-box {
      margin-top: 15px;
    }

    .form-img {
      width: 100%;
      margin-top: 15px;
    }

    .textarea {
      width: 100%;
      margin-top: 20px;
    }
  }

  .form-canvas {
    width: 100%;
    margin-top: 15px;
  }

  .form-item-answers {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    .form-item-answer {
      width: 46%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      .form-item-answer-label {
        width: 40px;
        margin-top: 20px;
      }
      .delete-answer-btn {
        position: absolute;
        right: 5px;
        top: 25px;
        padding: 0 8px;
        height: 24px;
        font-size: 12px;
      }
    }
  }
}

.tree-box {
  height: 480px;
  overflow-y: auto;
  padding: 10px 0;
  .empty-box {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .node-title {
    &:hover {
      color: var(--color-primary);
    }
  }
}
</style>

<style lang="scss">
/* 非 scoped 样式，确保能覆盖全局 .ant-btn 样式 */
.ant-modal-footer .ant-btn.ant-btn-default {
  border: 1px solid #d9d9d9 !important;
}
.question-edit-modal.ant-modal .ant-modal-content {
  border-radius: 24px;
  padding: 28px 32px 24px;
  background: rgb(248 247 246 / 1);
  box-shadow: none;
}
.ant-modal-body {
  padding: 0;
}
.ant-tree {
  background: transparent;
}
/* 提升 message 组件的 z-index */
.ant-message {
  z-index: 3000 !important;
}
</style>
