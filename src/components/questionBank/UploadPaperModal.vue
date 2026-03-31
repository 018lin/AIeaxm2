<template>
  <a-modal
    :open="open"
    :footer="null"
    centered
    :width="840"
    wrap-class-name="upload-paper-modal"
    @update:open="$emit('update:open', $event)"
    @cancel="handleCancel"
  >
    <div class="upload-card">
      <div class="upload-header">
        <div class="title-cn">上传试卷</div>
        <div class="sub">请填写以下信息并上传您的教学文件</div>
      </div>

      <a-spin class="upload-form-spin" :spinning="loading" tip="上传中..." size="large" :delay="120">
        <div class="upload-form">
          <div class="label-inner">
            <div>
              <div class="input-label">学段</div>
              <a-select
                v-model:value="form.stageId"
                style="width: 354px"
                placeholder="请选择学段"
                @change="changeStage"
              >
                <a-select-option v-for="item in dictStageList" :key="item.dictValue" :value="item.dictValue">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </div>
            <div>
              <div class="input-label">年级</div>
              <a-select v-model:value="form.gradeId" style="width: 354px" placeholder="请选择年级">
                <a-select-option v-for="item in gradeList" :key="item.dictValue" :value="item.dictValue">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </div>
            <SelectCom
              :typeList="[
                selectEnum.SUBJECT,
                selectEnum.ITEM_TYPE,
                selectEnum.TEXTBOOK_VERSION,
                selectEnum.TEXTBOOK_VOLUME,
              ]"
              :select-value="selectValue"
              showLabel
              @getList="handleGetList"
            />
            <div class="select-item">
              <div class="input-label">章节（选填）</div>
              <a-tooltip :title="chapterSelectTip" :mouse-enter-delay="0.08" :mouse-leave-delay="0.08">
                <span class="block">
                  <a-select
                    class="rc-select"
                    allow-clear
                    v-model:value="form.chapterId"
                    placeholder="请选择章节"
                    :options="chapterTreeData"
                    :disabled="chapterSelectDisabled"
                    :field-names="{ label: 'chapterName', value: 'chapterId', options: 'children' }"
                    @dropdownVisibleChange="onChapterDropdown"
                  ></a-select>
                </span>
              </a-tooltip>
            </div>
          </div>

          <div class="field full mt-20 flex-col">
            <div class="input-label">
              <span>上传文件</span>
            </div>
            <a-upload-dragger
              class="upload-dragger"
              name="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              :file-list="form.fileList"
              :before-upload="beforeUpload"
              @remove="onRemove"
            >
              <div class="upload-inner">
                <div class="upload-icon-wrap">
                  <Icon icon="iwwa:upload" width="30" />
                </div>
                <div class="upload-main-text">点击或者拖拽文件到此处</div>
                <div class="upload-tip">支持 pdf、word、jpg、png 等格式</div>
              </div>
            </a-upload-dragger>
          </div>
        </div>
      </a-spin>

      <div class="upload-footer flex justify-end gap-12 mt-20">
        <a-button class="btn-back" @click="handleCancel">返回</a-button>
        <a-button type="primary" class="btn-confirm" :loading="loading" @click="handleOk">确定</a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { getChapterList } from '@/api/common/index'
import type { chapterResponse, dictListResponse } from '@/api/common/type'
import { importQuestionBankBatch } from '@/api/questionBank'
import type { ImportQuestionBankBatchRequest } from '@/api/questionBank/type'
import SelectCom from '@/components/common/Select.vue'
import { selectEnum } from '@/enum/common'
// 切片上传
// import { uploadFileResumable } from '@/services/fragmentedUpload'
import { dictGradeOneList, dictGradeThreeList, dictGradeTwoList, dictStageList } from '@/utils/dictList'
import { Icon } from '@iconify/vue'
import type { UploadProps } from 'ant-design-vue'
import { Upload, message } from 'ant-design-vue'
import { computed, reactive, ref, watch } from 'vue'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (
    e: 'submit',
    value: {
      stageId?: string
      subject?: string
      grade?: string
      semester?: string
      type?: string
      fileList: UploadProps['fileList']
    }
  ): void
}>()

const loading = ref(false)
const chapterTreeData = ref<chapterResponse[]>([])
const form = reactive<{
  stageId?: string
  gradeId?: string
  subject?: string
  questionBankTypeId?: string
  textbookVersionId?: string
  volume?: string
  chapterId?: string
  fileList: UploadProps['fileList']
}>({
  stageId: undefined,
  gradeId: undefined,
  subject: undefined,
  questionBankTypeId: undefined,
  textbookVersionId: undefined,
  volume: undefined,
  chapterId: undefined,
  fileList: [],
})
const gradeList = ref<dictListResponse[]>([]) // 年级字典列表

const selectValue = computed(() => [form.subject, form.questionBankTypeId, form.textbookVersionId, form.volume])

const chapterSelectDisabled = computed(() => {
  return !form.subject || !form.textbookVersionId || !form.volume || !form.gradeId
})

const chapterSelectTip = computed(() => {
  if (!chapterSelectDisabled.value) return ''
  return '请先选择学科，版本，册次，年级'
})

// 切换学段时，重置年级
const changeStage = (value: string) => {
  // 重新获取年级列表
  getGadeList(value)
  form.gradeId = undefined
}

// 年级列表
const getGadeList = (value: string) => {
  // 重新获取年级列表
  if (value === '1') {
    gradeList.value = dictGradeOneList
  } else if (value === '2') {
    gradeList.value = dictGradeTwoList
  } else if (value === '3') {
    gradeList.value = dictGradeThreeList
  }
}

const handleGetList = (val: any) => {
  if ('subjectId' in val) form.subject = val.subjectId
  if ('itemType' in val) form.questionBankTypeId = val.itemType
  if ('textbookVersionId' in val) form.textbookVersionId = val.textbookVersionId
  if ('volume' in val) form.volume = val.volume
}

// 选择文件：限制格式并拦截自动上传，仅保留当前选择的文件。
const beforeUpload: UploadProps['beforeUpload'] = file => {
  const name = String((file as any)?.name || '')
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : ''
  const allowed = new Set(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'])

  if (!ext || !allowed.has(ext)) {
    message.warning(`文件 ${name} 格式不支持，仅支持 pdf、doc、docx、jpg、jpeg、png`)
    return Upload.LIST_IGNORE
  }

  // 多文件上传模式：追加新文件
  form.fileList = [...(form.fileList || []), file]
  return false
}

// 移除文件：从 fileList 中删除对应项。
const onRemove: UploadProps['onRemove'] = file => {
  form.fileList = (form.fileList || []).filter(f => f.uid !== file.uid)
}

const resetForm = () => {
  form.stageId = undefined
  form.gradeId = undefined
  form.subject = undefined
  form.questionBankTypeId = undefined
  form.textbookVersionId = undefined
  form.volume = undefined
  form.chapterId = undefined
  form.fileList = []
  chapterTreeData.value = []
}

// 关闭弹窗：上传中不允许关闭。
const handleCancel = () => {
  if (loading.value) return
  emit('update:open', false)
}

// 从 Upload 组件的 fileList 中提取原始 File 对象。
const extractFiles = (list: UploadProps['fileList']): File[] => {
  const arr = Array.isArray(list) ? list : []
  return arr
    .map(f => (f as any)?.originFileObj || (f as any))
    .filter((f: any): f is File => typeof File !== 'undefined' && f instanceof File)
}

// 提交上传：校验表单与文件后调用上传接口。
const handleOk = async () => {
  if (loading.value) return
  if (!form.stageId) return message.warning('请选择学段')
  if (!form.gradeId) return message.warning('请选择年级')
  if (!form.subject) return message.warning('请选择学科')
  if (!form.questionBankTypeId) return message.warning('请选择类型')
  if (!form.textbookVersionId) return message.warning('请选择教材版本')
  if (!form.volume) return message.warning('请选择册次')

  const files = extractFiles(form.fileList)
  if (files.length === 0) return message.warning('请上传文件')

  loading.value = true
  const submitSnapshot = { ...form }
  try {
    /* 切片上传
    const uploadedRefs: Array<File | string> = []

    for (const f of files) {
      try {
        const { attachment } = await uploadFileResumable(f, {
          onProgress: p => {
            if (p.percent >= 0 && p.percent <= 100) {
              ;(message as any).destroy?.()
              message.loading(`上传中…${p.percent}%`, 0)
            }
          },
        })

        ;(message as any).destroy?.()

        const a: any = attachment?.data ?? attachment
        const ref = String(a?.attachmentId || a?.filePath || a?.url || '')
        uploadedRefs.push(ref ? ref : f)
      } catch {
        uploadedRefs.push(f)
      }
    }
    */

    const params = {
      stageId: String(form.stageId),
      gradeId: String(form.gradeId),
      subjectId: String(form.subject),
      questionBankTypeId: String(form.questionBankTypeId),
      textbookVersionId: String(form.textbookVersionId),
      volume: String(form.volume),
      files,
      /* 切片上传
      files: uploadedRefs as any, */
    } as ImportQuestionBankBatchRequest
    if (form.chapterId) params.chapterId = String(form.chapterId)

    await importQuestionBankBatch(params)

    message.success('试卷上传成功')
    emit('submit', submitSnapshot)

    resetForm()
    emit('update:open', false)
  } catch (e: any) {
    const msg = e?.message || '试卷上传失败'
    message.error(msg)
  } finally {
    /* 切片上传
    ;(message as any).destroy?.()
    */
    loading.value = false
  }
}

const getChapterTreeList = async () => {
  if (chapterSelectDisabled.value) {
    chapterTreeData.value = []
    return
  }

  try {
    const params = {
      stage: form.stageId,
      gradeId: form.gradeId,
      subject: form.subject,
      volume: form.volume,
      textbookVersion: form.textbookVersionId,
      parentId: '0',
    }

    const res = await getChapterList(params as any)
    // console.log('章节数据原始返回:', res)

    // 递归处理数据，确保每个节点都有 chapterName（如果没有则使用 unitName）
    const processChapterData = (data: any): chapterResponse[] => {
      if (!data) {
        console.log('数据为空')
        return []
      }

      if (!Array.isArray(data)) {
        console.log('数据不是数组:', typeof data, data)
        return []
      }

      const result = data
        .map((item, index) => {
          if (!item || typeof item !== 'object') {
            console.log(`第 ${index} 项无效:`, item)
            return null
          }

          const processedItem: any = {
            chapterId: item.chapterId,
            chapterName: item.chapterName || item.unitName || '未命名',
            // 保留其他需要的字段
            level: item.level,
            parentId: item.parentId,
          }

          // 处理子节点
          if (item.children && Array.isArray(item.children) && item.children.length > 0) {
            const processedChildren = processChapterData(item.children)
            // 只在有子节点时才添加 children 字段，且必须是数组
            if (processedChildren.length > 0) {
              processedItem.children = processedChildren
            }
          }
          // 明确不设置 children 为 undefined

          return processedItem
        })
        .filter(item => item !== null && item !== undefined)

      // console.log('处理后的数据:', result)
      return result
    }

    const processed = processChapterData(res)
    // console.log('最终章节数据:', processed)
    chapterTreeData.value = processed
  } catch (error) {
    console.error('获取章节列表失败:', error)
    chapterTreeData.value = []
  }
}

const onChapterDropdown = (open: boolean) => {
  if (!open) return
  if (chapterSelectDisabled.value) return
  if (Array.isArray(chapterTreeData.value) && chapterTreeData.value.length > 0) return
  getChapterTreeList().catch(() => {})
}

watch(
  () => [form.gradeId, form.subject, form.textbookVersionId, form.volume],
  () => {
    if (form.chapterId) form.chapterId = undefined
    chapterTreeData.value = []
  }
)
</script>

<style lang="scss">
.upload-paper-modal {
  .ant-modal-content {
    padding: 0;
    background: transparent;
    box-shadow: none;
  }

  .ant-modal-body {
    padding: 0;
  }

  .upload-card {
    background: rgb(248 247 246 / 1);
    border-radius: 24px;
    padding: 28px 32px 24px;
    border: 1px solid rgb(240 234 229 / 1);
  }

  .upload-header {
    margin-bottom: 20px;

    .title-cn {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
    }

    .sub {
      margin-top: 10px;
      font-size: 13px;
      color: #6b7280;
    }
  }

  .upload-form-spin {
    display: block;
  }

  .upload-form-spin .ant-spin-container {
    border-radius: 18px;
    overflow: hidden;
  }

  .upload-form-spin .ant-spin {
    max-height: none;
  }

  .upload-form {
    background: #ffffff;
    border-radius: 18px;
    padding: 20px 24px 24px;
    border: 1px solid #f2ebe6;
    box-shadow:
      0 4px 20px -4px rgba(60, 55, 51, 0.08),
      0 2px 8px -2px rgba(60, 55, 51, 0.04);
  }

  .upload-inner {
    padding: 32px 12px;
    text-align: center;
  }

  .upload-icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 999px;
    margin: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f97316;
    font-size: 26px;
  }

  .upload-main-text {
    color: #f97316;
    font-weight: 700;
    font-size: 16px;
  }

  .upload-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #9ca3af;
  }

  .ant-upload.ant-upload-drag {
    border-radius: 16px;
    border-style: dashed;
    border-color: #fed7aa;
    background: #fffbf0;
  }

  .ant-upload.ant-upload-drag:not(.ant-upload-disabled):hover {
    border-color: #f97316;
    .upload-icon-wrap {
      transform: scale(1.2);
    }
  }

  .btn-back {
    border-radius: 999px;
    padding: 0 24px;
  }

  .btn-confirm {
    border-radius: 999px;
    padding: 0 32px;
    font-weight: 600;
    background: #f97316;
    border-color: #f97316;
    box-shadow: 0 6px 18px rgba(249, 115, 22, 0.35);

    &:hover {
      background: #ea580c;
      border-color: #ea580c;
    }
  }
}

.select-item {
  display: flex;
  flex-direction: column;
}
.label-inner {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.label-inner .select-container {
  display: contents;
}
.label-inner .rc-select {
  width: 100%;
}
</style>
