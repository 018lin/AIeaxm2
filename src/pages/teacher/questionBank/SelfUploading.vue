<template>
  <div class="self-uploading-page">
    <!-- 顶部筛选栏 -->
    <div class="filter-section app-surface mb-20">
      <div class="flex items-end justify-between gap-lg flex-wrap">
        <div class="filter-list flex gap-md">
          <SelectCom :typeList="[subjectEnum, itemTypeEnum]" showLabel @getList="getList" />
        </div>

        <div class="flex items-center gap-12">
          <a-button type="primary" class="upload-btn primary-btn" @click="isUploadModalOpen = true">
            <template #icon><PlusOutlined /></template>
            录入题目
          </a-button>
        </div>
      </div>
    </div>

    <!-- 试卷列表 -->
    <a-empty v-if="!loading && papers.length === 0" :image="simpleImage" description="暂无录入题目" />
    <div v-else class="paper-grid" ref="paperGridRef">
      <div class="paper-content">
        <div
          v-for="paper in papers"
          :key="paper.id"
          class="paper-card app-surface"
          :class="getSubjectKey(paper.subjectText)"
        >
          <div class="paper-content flex-col gap-lg p-20 justify-between">
            <div class="paper-header">
              <div class="paper-tags">
                <span v-if="paper.subjectText" class="tag">{{ paper.subjectName }}</span>
                <span v-if="paper.typeText" class="tag">{{ paper.typeName }}</span>
              </div>
              <div v-if="editingId === paper.id" class="title-edit-mode">
                <a-textarea
                  v-model:value="tempTitle"
                  :auto-size="{ minRows: 1, maxRows: 2 }"
                  class="title-input-dashed"
                  @click.stop
                />
                <div class="edit-actions">
                  <CheckOutlined class="action-icon confirm" @click.stop="onSaveClick" />
                  <CloseOutlined class="action-icon cancel" @click.stop="cancelEdit" />
                </div>
              </div>
              <div v-else class="title-display-mode">
                <div class="paper-title-row">
                  <h3 class="paper-title" @click="startEdit(paper)" :class="getSubjectKey(paper.subjectText)">
                    <span>{{ paper.title }}</span>
                    <EditOutlined class="edit-icon" />
                  </h3>
                  <div v-if="paper.subjectText" class="type-tag" :class="getSubjectKey(paper.subjectText)">
                    <Icon :icon="getSubjectIcon(paper.subjectText)" width="35" />
                  </div>
                </div>
              </div>
            </div>

            <div class="flex-col gap-lg">
              <div class="paper-footer">
                <div class="flex justify-between w-full gap-md flex-wrap">
                  <div class="info-item">
                    <CalendarOutlined />
                    <span>更新时间：{{ paper.date }}</span>
                  </div>
                  <div class="info-item">
                    <UserOutlined />
                    <span>{{ paper.creatorName }}</span>
                  </div>
                </div>
              </div>

              <div class="paper-actions">
                <a-button class="action-btn justify-center normal" block @click="gotoTestPaper(paper)">
                  查看试题
                </a-button>
                <a-button
                  class="action-btn justify-center"
                  block
                  @click="handleViewExam(paper)"
                  :class="getSubjectKey(paper.subjectText)"
                >
                  查看试卷
                </a-button>

                <a-popconfirm
                  title="确定删除当前试卷吗？"
                  ok-text="删除"
                  cancel-text="取消"
                  placement="top"
                  @confirm="handleDeletePaper(paper)"
                >
                  <a-button class="action-btn justify-center del" @click.stop>
                    <Icon icon="material-symbols-light:delete-outline" width="20" color="#aa8469" class="del-icon" />
                  </a-button>
                </a-popconfirm>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <TchPagination v-model:current="currentPage" v-model:pageSize="pageSize" :total="total" footer-padding="10px 0" />
    <UploadPaperModal v-model:open="isUploadModalOpen" @submit="handleUploadSubmit" />
    <ViewPaperModal v-model:open="isViewPaperModalOpen" :paper="currentViewPaper" :preview-url="currentPreviewUrl" />
    <!-- <ViewQuestionModal v-model:open="isViewQuestionModalOpen" :paper="currentViewQuestionPaper" /> -->

    <!-- 修改标题确认弹窗 -->
    <a-modal
      v-model:open="isSaveModalOpen"
      title="确认修改"
      ok-text="确认"
      cancel-text="取消"
      :confirm-loading="savingTitle"
      @ok="handleSaveConfirm"
      width="400px"
      centered
    >
      <p>确定要修改试卷标题吗？</p>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import {
  deleteQuestionBankDetail,
  getQuestionBankDetailViewAttach,
  queryQuestionBankDetailPage,
  updateQuestionBankDetailTitle,
} from '@/api/questionBank'
import SelectCom from '@/components/common/Select.vue'
import TchPagination from '@/components/common/table/TchPagination.vue'
import ViewPaperModal from '@/components/common/ViewPaperModal.vue'
import UploadPaperModal from '@/components/questionBank/UploadPaperModal.vue'
// import ViewQuestionModal from '@/components/questionBank/ViewQuestionModal.vue'
import { selectEnum } from '@/enum/common'
import { ROUTES } from '@/router/routes'
import type { PaperCard, SelfUploadingFilters } from '@/types/questionBank/selfUploading'
import { formatTimestamp } from '@/utils/time'
import {
  CalendarOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { Icon } from '@iconify/vue'
import { Empty, message } from 'ant-design-vue'
import { nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

const subjectEnum = selectEnum.SUBJECT
const itemTypeEnum = selectEnum.ITEM_TYPE
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)
const loading = ref(false)
const paperGridRef = ref<HTMLElement | null>(null)
const isUploadModalOpen = ref(false)
const isViewPaperModalOpen = ref(false)
const currentViewPaper = ref<PaperCard | null>(null)
const currentPreviewUrl = ref('')

const filters = reactive<SelfUploadingFilters>({
  subject: 'all',
  grade: 'all',
  term: 'all',
  type: 'all',
  source: 'all',
})

const getList = (val: any) => {
  if ('gradeId' in val) {
    filters.grade = val.gradeId || 'all'
  }
  if ('subjectId' in val) {
    filters.subject = val.subjectId || 'all'
  }
  if ('termId' in val) {
    filters.term = val.termId || 'all'
  }
  if ('itemType' in val) {
    filters.type = val.itemType || 'all'
  }
}

const getPaperDetailId = (paper: PaperCard) => {
  const detailId = paper.raw?.detailId ? String(paper.raw.detailId) : ''
  const fallbackId = paper.raw?.id !== undefined && paper.raw?.id !== null ? String(paper.raw?.id) : ''
  return detailId || fallbackId
}

// 查看试卷
const gotoTestPaper = (paper: PaperCard) => {
  const id = getPaperDetailId(paper)

  if (!id) {
    message.error('缺少试卷详情ID，无法查看试题')
    return
  }

  router.push(ROUTES.TEACHER_QUESTION_PAGE_DETAIL.replace(':id', id))
}

// 将“全部”筛选值归一化为 undefined，便于直接作为接口入参
const normalizeFilter = (v: string) => {
  if (!v || v === 'all') return undefined
  return v
}

// 将接口返回的试卷详情结构映射为页面卡片展示结构
const toPaperCard = (it: PaperCard['raw']): PaperCard => {
  const id = typeof it.id === 'number' ? it.id : Number(it.id)
  const title = it.examTitle ? String(it.examTitle) : '未命名试卷'
  const date = it.updateTime ? formatTimestamp(new Date(it.updateTime).getTime(), 'YYYY-MM-DD') : ''
  const paperId = String(it.detailId || it.batchId || it.id || '')
  return {
    id: Number.isFinite(id) ? id : Date.now(),
    title,
    subjectText: it.subjectId ? String(it.subjectId) : '',
    subjectName: it.subjectName || '',
    gradeText: it.gradeId ? String(it.gradeId) : '',
    gradeName: it.gradeName || '',
    termText: it.termId ? String(it.termId) : '',
    termName: it.termName || '',
    typeText: it.itemType ? String(it.itemType) : '',
    typeName: it.itemTypeName || '',
    date,
    creatorName: it.creatorName || '',
    paperId,
    uploader: it.creatorName || '',
    raw: it,
  }
}

// 拉取试卷列表：根据筛选与分页参数请求后端分页接口
const fetchPapers = async () => {
  if (loading.value) return

  loading.value = true
  try {
    const res = await queryQuestionBankDetailPage({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      subjectId: normalizeFilter(filters.subject),
      gradeId: normalizeFilter(filters.grade),
      termId: normalizeFilter(filters.term),
      itemType: normalizeFilter(filters.type),
    })

    total.value = Number(res?.total || 0)
    papers.value = Array.isArray(res?.list) ? res.list.map(toPaperCard) : []
  } catch (e: any) {
    papers.value = []
    total.value = 0
    message.error(e?.message || '获取试卷列表失败')
  } finally {
    loading.value = false
  }
}

// 打开“查看试卷”弹窗
const handleViewExam = async (paper: PaperCard) => {
  const id = getPaperDetailId(paper)

  if (!id) {
    message.error('缺少试卷详情ID，无法获取预览地址')
    return
  }

  try {
    const url = await getQuestionBankDetailViewAttach(id)
    currentPreviewUrl.value = String(url || '')
    currentViewPaper.value = paper
    isViewPaperModalOpen.value = true
  } catch (e: any) {
    message.error(e?.message || '获取试卷预览地址失败')
  }
}

const deletingDetailId = ref('')

const handleDeletePaper = async (paper: PaperCard) => {
  const id = getPaperDetailId(paper)
  if (!id) {
    message.error('缺少试卷详情ID，无法删除')
    return
  }
  if (deletingDetailId.value) return

  deletingDetailId.value = id
  try {
    const ok = await deleteQuestionBankDetail({ detailId: id })
    if (!ok) {
      message.error('删除失败')
      return
    }

    message.success('删除成功')

    if (editingId.value === paper.id) {
      cancelEdit()
      isSaveModalOpen.value = false
    }

    await fetchPapers()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  } finally {
    deletingDetailId.value = ''
  }
}

// 上传弹窗提交回调：上传成功后回到第一页并刷新列表
const handleUploadSubmit = (_payload: any) => {
  currentPage.value = 1
  fetchPapers()
}

type SubjectKey = 'math' | 'chinese' | 'english' | 'other'

const getSubjectKey = (val?: string): SubjectKey => {
  const s = String(val || '').trim()
  if (!s) return 'other'

  if (s === '数学' || s === '2' || s.toLowerCase() === 'math') return 'math'
  if (s === '语文' || s === '1' || s.toLowerCase() === 'chinese') return 'chinese'
  if (s === '英文' || s === '3' || s.toLowerCase() === 'english') return 'english'

  return 'other'
}

const getSubjectIcon = (val?: string) => {
  const key = getSubjectKey(val)
  if (key === 'math') return 'mynaui:math'
  if (key === 'chinese') return 'icon-park-outline:chinese'
  if (key === 'english') return 'icon-park-outline:english'
  return 'mdi:file-document-outline'
}

// 进入标题编辑态
const editingId = ref<number | null>(null)
const tempTitle = ref('')
const isSaveModalOpen = ref(false)
const savingTitle = ref(false)

// 开始编辑标题
const startEdit = (paper: PaperCard) => {
  editingId.value = paper.id
  tempTitle.value = paper.title
}

// 取消编辑标题
const cancelEdit = () => {
  editingId.value = null
  tempTitle.value = ''
}

// 点击保存：打开确认弹窗并校验新旧标题不相同
const onSaveClick = () => {
  const paper = papers.value.find(p => p.id === editingId.value)
  const nextTitle = tempTitle.value.trim()

  if (!paper) return
  if (!nextTitle) return message.warning('标题不能为空')
  if (paper.title === nextTitle) return message.warning('新标题不能与原标题相同')

  tempTitle.value = nextTitle
  isSaveModalOpen.value = true
}

// 确认保存：提交后端标题修改
const handleSaveConfirm = async () => {
  if (savingTitle.value) return

  const paper = papers.value.find(p => p.id === editingId.value)
  const nextTitle = tempTitle.value.trim()

  if (!paper) return
  if (!nextTitle) return message.warning('标题不能为空')
  if (paper.title === nextTitle) return message.warning('新标题不能与原标题相同')

  const idVal = typeof paper.raw?.id === 'number' ? paper.raw.id : paper.id

  savingTitle.value = true
  try {
    const ok = await updateQuestionBankDetailTitle({
      id: idVal,
      examTitle: nextTitle,
      batchId: paper.raw?.batchId,
      detailId: paper.raw?.detailId,
    })

    if (!ok) return message.error('标题修改失败')

    paper.title = nextTitle
    if (paper.raw) paper.raw.examTitle = nextTitle

    message.success('标题修改成功')
    isSaveModalOpen.value = false
    editingId.value = null
  } finally {
    savingTitle.value = false
  }
}

// const paginatedPapers = computed(() => papers.value)

const papers = ref<PaperCard[]>([])

// 监听分页变化并刷新列表
watch([currentPage, pageSize], async () => {
  await fetchPapers()
  await nextTick()
  paperGridRef.value?.scrollTo({ top: 0 })
})

// 监听筛选变化：重置到第一页并刷新列表
watch(
  () => [filters.subject, filters.grade, filters.term, filters.type],
  () => {
    if (currentPage.value !== 1) {
      currentPage.value = 1
      return
    }
    fetchPapers()
  }
)

// 初始化拉取列表
onMounted(() => {
  fetchPapers()
})
</script>

<style scoped lang="scss">
.self-uploading-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.filter-section {
  padding: 24px;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);

  .filter-item {
    display: flex;
    flex-direction: column;
    width: 140px;

    .filter-select {
      width: 100%;
    }
  }

  .upload-btn {
    height: 40px;
    padding: 0 24px;
  }
}

.paper-grid {
  flex: 1;
  overflow-y: auto;
  padding: 3px 0 28px;

  > .paper-content {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px 32px;
  }
}

@media (max-width: 1100px) {
  .paper-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
  }
}

@media (max-width: 720px) {
  .paper-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.paper-card {
  height: 100%;
  border-radius: 22px;
  background: #ffffff;
  overflow: hidden;
  position: relative;
  transition: transform 0.25s ease;
  border: 1px solid rgba(229, 231, 235, 0.7);

  &:hover {
    .type-tag {
      transform: translate(0, -0.5rem) rotate(6deg) skewX(0) skewY(0) scaleX(1) scaleY(1);
    }

    .paper-header .paper-title {
      &.math {
        color: rgb(234 88 12);
      }
      &.chinese {
        color: rgb(37 99 235);
      }

      &.english {
        color: rgb(5 150 105);
      }
      color: red;
    }
  }

  &.math .paper-content {
    border-color: rgba(236, 122, 46, 0.8);
  }
  &.chinese .paper-content {
    border-color: rgb(37, 99, 235, 0.8);
  }

  &.english .paper-content {
    border-color: rgb(5 150 105);
  }

  .paper-content {
    height: 100%;
    border-left: 4px solid;
  }

  .paper-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    min-height: 43px;
  }

  .paper-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex: none;
  }

  .paper-icon.is-orange {
    background: #fff7ed;
    color: #f59e0b;
    box-shadow: 0 10px 22px rgba(245, 158, 11, 0.18);
  }

  .paper-icon.is-blue {
    background: #eff6ff;
    color: #3b82f6;
    box-shadow: 0 10px 22px rgba(59, 130, 246, 0.18);
  }

  .paper-icon.is-green {
    background: #ecfdf5;
    color: #10b981;
    box-shadow: 0 10px 22px rgba(16, 185, 129, 0.18);
  }

  .paper-header {
    .paper-title {
      font-size: 18px;
      font-weight: 700;
      color: rgb(61 55 51);
      line-height: 1.45;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      cursor: pointer;
      transition: color 0.2s;
      width: calc(100% - 60px);

      > *:first-child {
        flex: 1;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      &:hover {
        .edit-icon {
          opacity: 1;
          transform: scale(1);
        }

        &.math {
          color: rgb(234 88 12);
        }
        &.chinese {
          color: rgb(37 99 235);
        }

        &.english {
          color: rgb(5 150 105);
        }
      }

      .edit-icon {
        font-size: 16px;
        // color: #f59e0b;
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.2s ease;
        margin-top: 4px;
      }
    }

    .type-tag {
      width: 56px;
      height: 56px;
      top: 20px;
      right: 20px;
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 16px;

      &.math {
        color: rgb(234 88 12);
        background-color: rgb(255 247 237 / var(--tw-bg-opacity, 1));
        filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.3));
      }
      &.chinese {
        color: rgb(37 99 235);
        background: rgb(239 246 255 / var(--tw-bg-opacity, 1));
        filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.3));
      }

      &.english {
        color: rgb(5 150 105);
        background: rgb(236 253 245 / var(--tw-bg-opacity, 1));
        filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.3));
      }
    }

    .title-edit-mode {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      .title-input-dashed {
        flex: 1;
        border: 1px dashed #f59e0b;
        border-radius: 10px;
        background: #fffbf0;
        font-size: 16px;
        color: #3d3733;
        padding: 8px 12px;
        resize: none;
        box-shadow: none;

        &:focus {
          border-color: #ea580c;
          background: #fff;
        }
      }

      .edit-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;

        .action-icon {
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;

          &.confirm {
            color: #f59e0b;
            &:hover {
              color: #ea580c;
              transform: scale(1.1);
            }
          }

          &.cancel {
            color: #9ca3af;
            &:hover {
              color: #ef4444;
              transform: scale(1.1);
            }
          }
        }
      }
    }

    .paper-tags {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 12px;

      .tag {
        padding: 2px 10px;
        border-radius: 3px;
        font-size: 12px;
        background-color: rgb(248 250 252);
        color: rgb(120 113 108);

        &.math {
          color: rgb(234 88 12);
          background: rgb(255 247 237 / var(--tw-bg-opacity, 1));
        }

        &.chinese {
          color: rgb(37 99 235);
          background: rgb(239 246 255 / var(--tw-bg-opacity, 1));
        }

        &.english {
          color: rgb(5 150 105);
          background: rgb(236 253 245 / var(--tw-bg-opacity, 1));
        }

        // &.muted-gold {
        //   background-color: rgb(254 243 226);
        //   color: rgb(212 175 55);
        //   border-color: rgb(212 175 55 / 0.1);
        // }
        // &.terracotta {
        //   border-color: rgb(245 138 66 / 0.1);
        //   background: rgb(255 241 230);
        //   color: rgb(230 126 34);
        // }
        // &.stone {
        // }
        // &.warm-beige {
        //   background-color: rgb(254 243 226);
        //   color: rgb(184 143 90);
        //   border-color: rgb(184 143 90 / 0.1);
        // }
      }
    }
  }

  .paper-meta-box {
    margin-top: 8px;
    background: #f8fafc;
    border: 1px solid #eef2f7;
    border-radius: 18px;
    padding: 18px 18px 16px;
  }

  .meta-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 14px;
    border-bottom: 1px solid #eef2f7;
  }

  .meta-label {
    font-size: 11px;
    letter-spacing: 0.12em;
    color: #94a3b8;
    font-weight: 700;
  }

  .meta-code {
    font-size: 11px;
    letter-spacing: 0.08em;
    color: #94a3b8;
    font-weight: 700;
  }

  .meta-bottom {
    padding-top: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .paper-actions {
    margin-top: auto;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 4px;

    .action-btn {
      border: none;
      justify-content: center;
      max-width: 38%;

      &.normal {
        border: 1px solid #eef2f7;

        &:hover {
          color: inherit;
          border: 1px solid #d9d9d9;
          background-color: rgba(153, 107, 77, 0.05);
        }
      }

      &.del {
        border: 1px solid #eef2f7;
        &:hover {
          // background-color: rgba(153, 107, 77, 0.05);
          border: 1px solid #d9d9d9;

          color: rgb(239 68 68);

          background-color: rgba(254, 242, 242, 1);

          .del-icon {
            color: rgb(239 68 68) !important;
          }
        }
      }

      &.math {
        background-color: #fff8f0;
        color: var(--color-primary);

        &:hover {
          background-color: rgb(255 237 213);
        }
      }

      &.chinese {
        background-color: #f0f9ff;
        color: #2563eb;

        &:hover {
          background-color: rgb(239 246 255 / 1);
        }
      }

      &.english {
        background-color: #f0fdf4;
        color: rgb(5 150 105);

        &:hover {
          background-color: rgb(236 253 245 / 1);
        }
      }
    }
  }

  .btn-outline {
    height: 46px;
    border-radius: 14px;
    border-color: #e5e7eb;
    color: #475569;
    font-weight: 700;
    background: #ffffff;
  }

  .btn-primary-light {
    height: 46px;
    border-radius: 14px;
    border-color: transparent;
    background: #fff7e6;
    color: #f59e0b;
    font-weight: 700;
  }

  .btn-primary-light:hover {
    background: #ffedd5;
    color: #ea580c;
  }

  .paper-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    padding: 14px 16px;
    background: #f9fafb;
    border: 1px solid #eef2f7;
    border-radius: 14px;
    color: rgb(120 113 108);
    font-size: 13px;
    gap: 20px;

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .footer-right {
      display: flex;
      justify-content: flex-end;
      margin-left: auto;
    }

    .paper-id-pill {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      letter-spacing: 0.2px;
      color: rgb(120, 113, 108);
    }
  }
}

.ant-empty {
  flex: 1;
}

@media screen and (max-width: 1300px) {
  .paper-card .paper-actions {
    .action-btn {
      max-width: none;
      width: 100%;
    }
  }
}
</style>
