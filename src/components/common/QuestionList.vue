<template>
  <div class="mk-list">
    <div v-for="(q, index) in localList" :key="q.questionId" class="mk-qcard app-surface">
      <div class="mk-qhead">
        <div class="mk-qtags">
          <span class="tag-pill is-orange">第{{ (page.pageNo - 1) * page.pageSize + index + 1 }}题</span>
          <span class="tag-pill is-blue">{{ q.questionTypeTagName ?? '-' }}</span>
          <span class="tag-pill is-green">{{ q.difficultyTagName }}</span>
          <span class="tag-pill is-gray" v-if="q.layoutFormat && q.layoutFormat !== 'unknown'">
            {{ q.layoutFormat ? paperType[q.layoutFormat] : '-' }}
          </span>
          <!-- <span class="tag-pill is-gray" v-for="point in q.knowledgePoints" :key="point.pointCode">
            {{ point.pointName }}
          </span> -->
        </div>

        <div class="mk-qops" v-if="source === 'WRONG' || source === 'LEVEL' || source === 'BOOK'">
          <button
            type="button"
            class="btn-action primary-btn-light"
            :class="{ active: showAnswersId === q.questionId }"
            @click="toggleAnswer(q)"
          >
            {{ showAnswersId === q.questionId ? '收起答案' : '参考答案' }}
          </button>

          <button
            v-if="q.questionId && isSelected(q.questionId)"
            type="button"
            class="btn-added primary-btn"
            @click="remove(q.questionId)"
          >
            移除试题篮
          </button>
          <button
            v-else-if="source === 'WRONG' || source === 'LEVEL' || source === 'BOOK'"
            type="button"
            class="btn-add primary-btn"
            @click="add(q)"
          >
            加入试题篮
          </button>
        </div>
        <div class="mk-qops" v-if="(source === 'BANK' || source === 'DETAIL') && q.answered == 0">
          <button type="button" class="btn-action primary-btn-light btn-tag">缺失答案</button>
        </div>
      </div>
      <div class="mk-qbody">
        <div class="q-content">
          <template v-if="q.questionsAttachment">
            <QuestionItem v-if="source === 'BANK'" :questionInfo="q" />
            <img
              v-else
              :src="q.questionsAttachment"
              alt=""
              class="q-img"
              :style="{ maxWidth: q.layoutFormat === 'A4-2' ? '300px' : '600px' }"
              @contextmenu.prevent
              @dragstart.prevent
              draggable="false"
            />
          </template>

          <div v-else-if="hasQuestionContent(q)" class="q-text" v-html="renderQuestionContent(q.questionContent)" />

          <a-empty v-else :image="simpleImage" description="暂无数据" />
        </div>
        <div class="q-footer" v-if="source === 'BANK' || source === 'DETAIL'">
          <div class="q-footer-left">
            <span class="q-footer-left-item">
              上传时间：{{ q.createTime ? formatTimestamp(q.createTime, 'YYYY-MM-DD hh:mm:ss') : '' }}
            </span>
            <span class="q-footer-left-item">上传人：{{ q.creatorName }}</span>
          </div>
          <div class="q-footer-right">
            <a-button type="link" @click="openEdit(q)">编辑</a-button>
            <a-button type="link" @click="toggleAnswer(q)">
              {{ showAnswersId === q.questionId ? '收起' : '解析' }}
            </a-button>
            <a-popconfirm
              title="确定要删除这道题吗?"
              ok-text="是"
              cancel-text="否"
              placement="leftTop"
              @confirm="deleteQuestion(q)"
            >
              <a-button type="link">删除</a-button>
            </a-popconfirm>
          </div>
        </div>
        <div class="q-footer" v-if="source === 'WRONG'">
          <div class="q-footer-left">
            <span class="q-footer-left-item">错题人数：{{ q.wrongAnswerCount }}</span>
            <span class="q-footer-left-item"> 错题时间：{{ q.wrongAnswerTime || '' }} </span>
          </div>
        </div>
      </div>

      <transition name="slide-fade">
        <div v-if="showAnswersId === q.questionId" class="mk-answer">
          <div class="ans-row">
            <span class="ans-badge">正确答案</span>
            <div class="ans-text-box">
              <div class="ans-text" v-for="ite in q.answers" :key="ite.area_id">
                <span>空{{ ite.area_id }}：</span><span v-html="renderQuestionContent(String(ite.answer || ''))" />
              </div>
            </div>
          </div>
          <div class="ans-row">
            <span class="ans-badge">解析思路</span>
            <div class="ans-text">{{ q.answerAnalysis }}</div>
          </div>
        </div>
      </transition>
    </div>
  </div>
  <QuestionEdit
    :open="editVisible"
    :questionId="editQuestionId"
    :userId="userId"
    @closeEdit="closeEdit"
    @refreshList="emit('refreshList')"
  />
</template>

<script setup lang="ts">
import { deleteQuestionBank } from '@/api/questionBank/index'
import type { questionBankItem } from '@/api/questionBank/type'
import QuestionEdit from '@/components/common/QuestionEdit.vue'
import QuestionItem from '@/components/common/QuestionItem.vue'
import { questionBasketService } from '@/services/questionBasket'
import { getUserBaseInfo } from '@/services/storage'
import { formatTimestamp } from '@/utils/time'
import { Empty, message } from 'ant-design-vue'
import { reactive, ref, watch } from 'vue'
const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

// 默认参数
const props = withDefaults(
  defineProps<{
    list: questionBankItem[]
    page: { pageNo: number; pageSize: number }
    showBasketBtn?: boolean
    showBasket?: boolean
    source: 'BANK' | 'WRONG' | 'LEVEL' | 'DETAIL' | 'BOOK'
  }>(),
  {
    showBasketBtn: false,
    showBasket: true,
  }
)
const emit = defineEmits(['refreshList'])

// 状态
const parsedUserInfo = getUserBaseInfo()
const showAnswersId = ref('')
const editVisible = ref(false)
const editQuestionId = ref('')
const userId = ref(parsedUserInfo?.userId || '') // 当前登陆用户ID
const paperType = reactive<{ [key: string]: string }>({
  'A4-1': 'A4单栏、A3双栏',
  'A4-2': 'A4双栏',
  'A3-2': 'A4单栏、A3双栏',
})

const localList = ref<questionBankItem[]>([])
watch(
  () => props.list,
  v => {
    localList.value = Array.isArray(v) ? [...v] : []
  },
  { immediate: true }
)

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const hasQuestionContent = (q: questionBankItem) => String(q.questionContent || '').trim().length > 0

const renderQuestionContent = (content?: string) => {
  const raw = String(content || '').trim()
  if (!raw) return ''

  if (typeof DOMParser === 'undefined') {
    return escapeHtml(raw).replace(/\r?\n/g, '<br>')
  }

  const doc = new DOMParser().parseFromString(raw, 'text/html')
  doc.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach(el => el.remove())
  doc.body.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim()
      if (name.startsWith('on') || ((name === 'src' || name === 'href') && /^javascript:/i.test(value))) {
        el.removeAttribute(attr.name)
      }
    })
  })

  const html = doc.body.innerHTML.trim()
  return html || escapeHtml(raw).replace(/\r?\n/g, '<br>')
}

// 显示答案
const toggleAnswer = (q: questionBankItem) => {
  if (!q.questionId) return
  if (q.answerAnalysis || q.correctAnswer) {
    if (showAnswersId.value === q.questionId) {
      showAnswersId.value = ''
    } else {
      showAnswersId.value = q.questionId
    }
  } else {
    message.info('该题暂无答案与解析')
  }
}

// 加入试题篮
const isSelected = (id: string) => {
  const list =
    props.source === 'WRONG'
      ? questionBasketService.wrongList.value
      : props.source === 'LEVEL'
        ? questionBasketService.levelList.value
        : questionBasketService.bookList.value
  return list.some(group => group.children.some(item => item.questionId === id))
}

// 加入试题篮
const add = async (q: questionBankItem) => {
  if (props.source !== 'WRONG' && props.source !== 'LEVEL' && props.source !== 'BOOK') {
    message.error('当前页面不支持加入试题篮')
    return
  }
  const subjectInfoStr = localStorage.getItem('subjectInfoBasket')
  const stageInfoStr = localStorage.getItem('stageInfoBasket')
  const subjectInfo = subjectInfoStr && subjectInfoStr !== 'null' ? JSON.parse(subjectInfoStr) : {}
  const stageInfo = stageInfoStr && stageInfoStr !== 'null' ? JSON.parse(stageInfoStr) : {}

  if (subjectInfo.dictValue && q.subjectId !== subjectInfo.dictValue) {
    message.error(`您已组了${subjectInfo.label}的试卷，暂不支持跨学科进行组卷`)
    return
  }
  if (stageInfo.dictValue && q.stageId !== stageInfo.dictValue) {
    message.error(`您已组了${stageInfo.label}的试卷，暂不支持跨学段进行组卷`)
    return
  }
  const res = await questionBasketService.addQuestionBasket(q, props.source)
  if (res) {
    await questionBasketService.initGetlist()
    message.success('加入试题篮成功')
  }
}

// 移除试题篮
const remove = async (questionId: string | undefined) => {
  if (props.source !== 'WRONG' && props.source !== 'LEVEL' && props.source !== 'BOOK') {
    message.error('当前页面不支持移除试题篮')
    return
  }
  if (!questionId) {
    message.error('请选择要移除的试题')
    return
  }
  const res = await questionBasketService.removeQuestionBasket('', questionId, props.source)
  if (res) {
    await questionBasketService.initGetlist()
    message.success('从试题篮移除成功')
  }
}

// 编辑试题
const openEdit = (item: questionBankItem) => {
  // if (userId.value !== item.creator) {
  //   message.error('只能编辑自己创建的试题')
  //   return
  // }
  editVisible.value = true
  editQuestionId.value = item.questionId || ''
}
const closeEdit = () => {
  editVisible.value = false
  editQuestionId.value = ''
}
// 获取试题详情

// 删除试题
const deleteQuestion = async (item: questionBankItem) => {
  const questionId = String(item.questionId || '').trim()
  if (!questionId) {
    message.error('请选择要删除的试题')
    return
  }
  if (userId.value !== item.creator) {
    message.error('只能删除自己创建的试题')
    return
  }

  try {
    await deleteQuestionBank({ questionId })
    message.success('删除试题成功')

    if (showAnswersId.value === questionId) showAnswersId.value = ''
    localList.value = localList.value.filter(q => String(q.questionId || '').trim() !== questionId)

    const currentPageNo = Number((props as any)?.page?.pageNo || 1) || 1
    const suggestedPageNo = localList.value.length === 0 ? Math.max(1, currentPageNo - 1) : currentPageNo
    emit('refreshList', { pageNo: suggestedPageNo })
  } catch (e: any) {
    message.error(e?.message || '删除试题失败')
  }
}
</script>

<style scoped lang="scss">
.mk-list {
  flex: 1;
  min-width: 700px;
  min-height: 0;
  overflow: auto;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 2px;

  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background-color: transparent;
    border-radius: 999px;
    border: 2px solid transparent;
  }

  &:hover {
    scrollbar-color: rgb(140 109 93 / 0.4) transparent;
  }

  &:hover::-webkit-scrollbar-thumb {
    background-color: rgb(140 109 93 / 0.4);
    border: 2px solid rgba(148, 163, 184, 0.12);
  }

  .mk-qcard {
    position: relative;
    border-radius: 16px;
    padding: 12px 20px;
    background: #fff;
    transition: all 0.2s;
    margin-bottom: 2px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);

    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    }

    .mk-qhead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;

      .mk-qtags {
        width: calc(100% - 220px);
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .tag-pill {
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 12px;

          &.is-orange {
            background: #fff3e0;
            color: #e67e22;
          }
          &.is-blue {
            background: #e3f2fd;
            color: #2196f3;
          }
          &.is-green {
            background: #e8f5e9;
            color: #4caf50;
          }
          &.is-gray {
            background: #f5f5f5;
            color: rgb(75, 85, 99);
          }
        }
      }

      .mk-qops {
        width: 210px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 12px;

        .btn-add,
        .btn-added {
          height: 40px;
          font-size: 13px;
        }

        .btn-added {
          background: #f5f5f5;
          color: rgb(75 85 99 / 1);
          border: 1px solid #eee;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);

          &:hover {
            background: #eee;
          }
        }

        .btn-tag {
          cursor: default;
        }
      }
    }

    .mk-qbody {
      padding: 0 8px;

      .q-content {
        font-size: 16px;
        color: #333;
        line-height: 1.8;
        background: rgb(248 247 246 / 0.8);
        padding: 10px;
        border: 1px dashed #d9d9d9;
        border-radius: 12px;
        cursor: default;
        outline: none;

        &:hover {
          background: rgb(248 247 246 / 1);
          border-color: #e67e22;
        }

        .q-img {
          max-width: 300px;
          height: auto;
          display: block;
          border-radius: 8px;
          mix-blend-mode: darken;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          pointer-events: auto;
        }

        .q-text {
          max-width: 100%;
          white-space: normal;
          word-break: break-word;

          :deep(img) {
            max-width: 600px;
            width: auto;
            height: auto;
            display: block;
            margin: 8px 0;
            border-radius: 8px;
            mix-blend-mode: darken;
            user-select: none;
          }

          :deep(table) {
            max-width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
          }

          :deep(td),
          :deep(th) {
            padding: 4px 8px;
            border: 1px solid #d9d9d9;
          }
        }
      }

      .q-footer {
        margin-top: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        .q-footer-left {
          display: flex;
          .q-footer-left-item {
            margin-right: 20px;
            color: rgb(75, 85, 99);
          }
        }
        .q-footer-right {
          display: flex;
        }
      }
    }

    .mk-qfooter {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }

    .mk-answer {
      border-top: 1px dashed #eee;
      padding-top: 20px;
      margin-top: 20px;

      .ans-row {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;

        .ans-badge {
          background: #e67e22;
          color: #fff;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          height: fit-content;
          white-space: nowrap;
        }

        .ans-text-box {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .ans-text {
          font-size: 14px;
          color: #555;
          line-height: 1.6;

          span {
            font-weight: 700;
            font-size: 14px;
          }
        }
      }

      .ans-footer {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-top: 12px;

        .meta-info {
          font-size: 12px;
          color: #999;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .actions {
          display: flex;
          gap: 16px;

          .act-btn {
            border: none;
            background: transparent;
            color: #999;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: color 0.2s;

            &:hover {
              color: #666;
            }
          }
        }
      }
    }
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease-out;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

:deep(.ant-btn) {
  padding: 0 0 0 10px;
}
</style>
