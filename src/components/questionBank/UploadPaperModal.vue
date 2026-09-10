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
        <div class="title-cn">录入题目</div>
        <div class="sub">请填写题目归属信息，并选择 PDF 文件或图片上传入库</div>
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
            <div>
              <div class="input-label">科目</div>
              <a-select v-model:value="form.subject" class="rc-select" placeholder="请选择科目">
                <a-select-option v-for="item in subjectList" :key="item.dictValue" :value="item.dictValue">
                  {{ item.label }}
                </a-select-option>
              </a-select>
            </div>
          </div>

          <div class="field full mt-20 flex-col">
            <div class="input-label">
              <span>上传方式</span>
            </div>
            <a-radio-group v-model:value="uploadMode" button-style="solid" class="upload-mode-group">
              <a-radio-button value="pdf">
                <FilePdfOutlined />
                PDF 文件
              </a-radio-button>
              <a-radio-button value="image">
                <PictureOutlined />
                图片
              </a-radio-button>
            </a-radio-group>
          </div>

          <div class="field full mt-20 flex-col">
            <div class="input-label">
              <span>上传题目文件</span>
            </div>
            <a-upload-dragger
              class="upload-dragger"
              name="file"
              multiple
              :accept="uploadAccept"
              :file-list="form.fileList"
              :before-upload="beforeUpload"
              @remove="onRemove"
            >
              <div class="upload-inner">
                <div class="upload-icon-wrap">
                  <Icon icon="iwwa:upload" width="30" />
                </div>
                <div class="upload-main-text">点击或者拖拽文件到此处</div>
                <div class="upload-tip">{{ uploadTip }}</div>
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
import { getDictList } from '@/api/common/index'
import type { dictListItem, dictListResponse } from '@/api/common/type'
import { importQuestionBankBatch } from '@/api/questionBank'
import type { ImportQuestionBankBatchRequest } from '@/api/questionBank/type'
import { selectEnum } from '@/enum/common'
// 切片上传
// import { uploadFileResumable } from '@/services/fragmentedUpload'
import { dictGradeOneList, dictGradeThreeList, dictGradeTwoList, dictStageList } from '@/utils/dictList'
import { FilePdfOutlined, PictureOutlined } from '@ant-design/icons-vue'
import { Icon } from '@iconify/vue'
import type { UploadProps } from 'ant-design-vue'
import { Upload, message } from 'ant-design-vue'
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps<{
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
type UploadMode = 'pdf' | 'image'
const uploadMode = ref<UploadMode>('pdf')
const form = reactive<{
  stageId?: string
  gradeId?: string
  subject?: string
  questionBankTypeId?: string
  textbookVersionId?: string
  volume?: string
  fileList: UploadProps['fileList']
}>({
  stageId: undefined,
  gradeId: undefined,
  subject: undefined,
  questionBankTypeId: undefined,
  textbookVersionId: undefined,
  volume: undefined,
  fileList: [],
})
const gradeList = ref<dictListItem[]>([]) // 年级字典列表
const itemTypeList = ref<dictListItem[]>([])
const versionList = ref<dictListItem[]>([])
const volumeList = ref<dictListItem[]>([])

const primarySubjectList: dictListItem[] = [
  { label: '语文', dictValue: '1' },
  { label: '数学', dictValue: '2' },
  { label: '英语', dictValue: '3' },
]

const juniorSubjectList: dictListItem[] = [
  ...primarySubjectList,
  { label: '物理', dictValue: '4' },
  { label: '化学', dictValue: '5' },
  { label: '政治', dictValue: '6' },
  { label: '地理', dictValue: '7' },
  { label: '生物', dictValue: '8' },
]

const subjectList = computed(() => {
  const stageId = String(form.stageId || '')
  if (stageId === '1') return primarySubjectList
  if (stageId === '2') return juniorSubjectList
  return []
})

const uploadModeConfig: Record<UploadMode, { accept: string; allowed: Set<string>; label: string; tip: string }> = {
  pdf: {
    accept: '.pdf',
    allowed: new Set(['pdf']),
    label: 'PDF 文件',
    tip: '支持 PDF 文件，可一次上传多个文件',
  },
  image: {
    accept: '.jpg,.jpeg,.png',
    allowed: new Set(['jpg', 'jpeg', 'png']),
    label: '图片',
    tip: '支持 jpg、jpeg、png 图片，可一次上传多张',
  },
}

const uploadAccept = computed(() => uploadModeConfig[uploadMode.value].accept)
const uploadTip = computed(() => uploadModeConfig[uploadMode.value].tip)

// 切换学段时，重置年级
const changeStage = (value: string) => {
  // 重新获取年级列表
  getGadeList(value)
  form.gradeId = undefined
  if (!subjectList.value.some(item => item.dictValue === form.subject)) {
    form.subject = undefined
  }
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
  } else {
    gradeList.value = []
  }
}

const getDictItems = (res: dictListResponse[], dictType: string) => {
  const normalizeItem = (item: any): dictListItem => ({
    id: item.id,
    label: item.label,
    dictValue: item.dictValue ?? item.value,
    value: item.value,
    dictType: item.dictType,
  })
  const group = res.find(item => item.dictType === dictType)
  if (group?.dictTypeList?.length) return group.dictTypeList.map(normalizeItem)

  return res
    .filter((item: any) => item.dictType === dictType && (item.dictValue || item.value))
    .map(normalizeItem)
}

const getDictData = async () => {
  const res = await getDictList({
    dictTypes: [selectEnum.ITEM_TYPE, selectEnum.TEXTBOOK_VERSION, selectEnum.TEXTBOOK_VOLUME],
  })
  const resData = res || []

  itemTypeList.value = getDictItems(resData, selectEnum.ITEM_TYPE)
  versionList.value = getDictItems(resData, selectEnum.TEXTBOOK_VERSION)
  volumeList.value = getDictItems(resData, selectEnum.TEXTBOOK_VOLUME)
  fillHiddenDefaults()
}

const fillHiddenDefaults = () => {
  form.questionBankTypeId = form.questionBankTypeId || itemTypeList.value[0]?.dictValue
  form.textbookVersionId = form.textbookVersionId || versionList.value[0]?.dictValue
  form.volume = form.volume || volumeList.value[0]?.dictValue
}

// 选择文件：限制格式并拦截自动上传，仅保留当前选择的文件。
const beforeUpload: UploadProps['beforeUpload'] = file => {
  const name = String((file as any)?.name || '')
  const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : ''
  const config = uploadModeConfig[uploadMode.value]

  if (!ext || !config.allowed.has(ext)) {
    message.warning(`文件 ${name} 格式不支持，当前方式仅支持${config.label}`)
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
  form.fileList = []
  uploadMode.value = 'pdf'
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
  fillHiddenDefaults()
  if (!form.questionBankTypeId || !form.textbookVersionId || !form.volume) {
    return message.error('题目录入配置加载失败，请刷新后重试')
  }

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

    await importQuestionBankBatch(params)

    message.success('题目录入成功')
    emit('submit', submitSnapshot)

    resetForm()
    emit('update:open', false)
  } catch (e: any) {
    const msg = e?.message || '题目录入失败'
    message.error(msg)
  } finally {
    /* 切片上传
    ;(message as any).destroy?.()
    */
    loading.value = false
  }
}

watch(
  () => props.open,
  open => {
    if (!open) return
    if (itemTypeList.value.length && versionList.value.length && volumeList.value.length) {
      fillHiddenDefaults()
      return
    }
    getDictData().catch(() => {
      message.error('获取题目归属字典失败')
    })
  },
  { immediate: true }
)

watch(uploadMode, () => {
  if (form.fileList?.length) {
    form.fileList = []
    message.info('已切换上传方式，请重新选择文件')
  }
})
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
    max-height: calc(100vh - 250px);
    overflow-y: auto;
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

  .upload-mode-group {
    display: flex;
    width: 100%;

    .ant-radio-button-wrapper {
      flex: 1;
      height: 42px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 600;
    }

    .ant-radio-button-wrapper-checked {
      background: #f97316;
      border-color: #f97316;
    }
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
