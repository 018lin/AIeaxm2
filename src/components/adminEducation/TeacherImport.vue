<template>
  <a-modal :open="open" :width="760" centered :footer="null" @cancel="handleClose" class="question-edit-modal">
    <!-- 批量导入流程、要求 -->
    <div class="import-box" v-if="currentState === 0">
      <div class="import-header">批量导入教师</div>

      <div class="import-item app-surface">
        <div class="import-title"><span class="import-title-icon"></span>导入流程</div>
        <a-timeline>
          <a-timeline-item>创建班级</a-timeline-item>
          <a-timeline-item>下载模板（页面下方）</a-timeline-item>
          <a-timeline-item>按照要求编辑模板（模板要求见下方文字）</a-timeline-item>
          <a-timeline-item>上传模板</a-timeline-item>
          <a-timeline-item style="padding-bottom: 0">
            导入的账号可通过填写的
            <a-tag color="volcano">手机号</a-tag>登录，默认密码为
            <a-tag color="volcano">手机号后六位</a-tag>
          </a-timeline-item>
        </a-timeline>
      </div>

      <div class="import-item import-request app-surface">
        <div class="import-title"><span class="import-title-icon"></span>模板要求</div>
        <a-descriptions bordered :column="1" :labelStyle="{ width: '150px' }" class="import-descriptions">
          <a-descriptions-item label="教师真实姓名："> 填写教师姓名 </a-descriptions-item>
          <a-descriptions-item label="性别：">
            填写教师性别，“<a-tag color="volcano">男</a-tag>”或“<a-tag color="volcano">女</a-tag>”
          </a-descriptions-item>
          <a-descriptions-item label="教师手机号：">
            填写教师<a-tag color="volcano">手机号</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="授课年级：">
            <p>填写年级名称</p>
            <p>
              <span>填写格式： </span>
              <a-tag color="volcano" style="margin-top: 5px" v-for="item in gradeList" :key="item.value">
                {{ item.label }}
              </a-tag>
            </p>
          </a-descriptions-item>
          <a-descriptions-item label="授课学科：">
            <p>填写学科名称</p>
            <p>
              <span>填写格式： </span>
              <a-tag color="volcano" style="margin-top: 5px" v-for="item in subjectList" :key="item.value">
                {{ item.label }}
              </a-tag>
            </p>
          </a-descriptions-item>
          <a-descriptions-item label="授课班级名称：">
            填写班级名称，填写格式，如：1班、二班等，需与系统中已存在的一致，多个班级，用“，”隔开
          </a-descriptions-item>
        </a-descriptions>
      </div>

      <div class="import-btn app-surface">
        <a-button
          type="primary"
          class="primary-btn"
          @click="downloadTemplate"
          style="margin-right: 40px"
          :icon="h(DownloadOutlined)"
          >下载模板</a-button
        >
        <a-upload
          :before-upload="beforeUpload"
          :custom-request="handleUpload"
          :show-upload-list="false"
          accept=".xlsx,.xls"
        >
          <a-button type="primary" class="primary-btn" :loading="uploading" :icon="h(UploadOutlined)">
            批量导入
          </a-button>
        </a-upload>
      </div>
    </div>
    <!-- 批量导入成功 -->
    <div class="import-success" v-else-if="currentState === 1">
      <div class="import-header">导入结果</div>
      <div class="import-result-icon import-success-icon">
        <CheckCircleOutlined />
      </div>
      <div class="success-main">
        <h2 class="success-title">导入成功</h2>
        <p class="success-content">
          本次导入{{ successCount }}条教师信息，导入的教师可使用填写的 <b>手机号</b>登录，默认密码为
          <b>手机号后六位</b>
        </p>
      </div>
    </div>
    <!-- 批量导入失败 -->
    <div class="import-error" v-else>
      <div class="import-header">导入结果</div>
      <div class="import-result-icon import-error-icon">
        <CloseCircleOutlined />
      </div>
      <div class="error-list">
        <p class="error-item" v-for="(item, index) in errorList" :key="index">
          第{{ item.rowIndex }}行，{{ item.message }}
        </p>
      </div>
      <div class="error-btn">
        <a-button class="default-btn" @click="handleClose" style="margin-right: 40px"> 取消 </a-button>
        <a-upload
          :before-upload="beforeUpload"
          :custom-request="handleUpload"
          :show-upload-list="false"
          accept=".xlsx,.xls"
        >
          <a-button type="primary" class="primary-btn" :loading="uploading"> 重新上传 </a-button>
        </a-upload>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { downloadTeacherTemplate, importTeachers } from '@/api/adminEducation/teacherIndex'
import { CheckCircleOutlined, CloseCircleOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons-vue'
import type { UploadProps } from 'ant-design-vue'
import { message } from 'ant-design-vue'
import { h, ref } from 'vue'

// 父组件传递的参数
const props = defineProps<{
  open: boolean
}>()
const emit = defineEmits<{
  close: [status: boolean]
  success: []
}>()

const uploading = ref(false)
const currentState = ref(0) // 0: 初始状态，1: 导入成功，2: 导入失败
const successCount = ref(0) // 成功导入的教师数量
const errorList = ref<{ rowIndex: number; message: string; field: string }[]>([]) // 导入失败的错误信息列表

const gradeList = [
  { label: '一年级', value: '1' },
  { label: '二年级', value: '2' },
  { label: '三年级', value: '3' },
  { label: '四年级', value: '4' },
  { label: '五年级', value: '5' },
  { label: '六年级', value: '6' },
  { label: '七年级', value: '7' },
  { label: '八年级', value: '8' },
  { label: '九年级', value: '9' },
]
const subjectList = [
  { label: '语文', value: 'chinese' },
  { label: '数学', value: 'math' },
  { label: '英语', value: 'english' },
  { label: '物理', value: 'physics' },
  { label: '化学', value: 'chemistry' },
  { label: '生物学', value: 'biology' },
  { label: '历史', value: 'history' },
  { label: '地理', value: 'geography' },
  { label: '道德与法治', value: 'moralityAndLaw' },
  { label: '科学', value: 'science' },
  { label: '体育与健康', value: 'sportsAndHealth' },
  { label: '信息技术', value: 'informationTechnology' },
  { label: '艺术', value: 'art' },
  { label: '劳动', value: 'labor' },
  { label: '俄语', value: 'russian' },
  { label: '日语', value: 'japanese' },
]

const handleClose = () => {
  emit('close', false)
  currentState.value = 0
  successCount.value = 0
  errorList.value = []
}

// 下载模板
const downloadTemplate = async () => {
  const res = await downloadTeacherTemplate()
  if (res) {
    // 创建 Blob 对象
    const blob = new Blob([res], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `教师导入模板_${new Date().getTime()}.xlsx`
    // 触发下载
    document.body.appendChild(link)
    link.click()
    // 清理
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    message.success('模板下载成功')
  } else {
    message.error('模板下载失败')
  }
}

// 上传前的校验
const beforeUpload: UploadProps['beforeUpload'] = file => {
  const isExcel =
    file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.type === 'application/vnd.ms-excel'
  if (!isExcel) {
    message.error('只能上传 Excel 文件！')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    message.error('文件大小不能超过 10MB！')
    return false
  }
  return true
}

// 自定义上传
const handleUpload: UploadProps['customRequest'] = async options => {
  const { file } = options
  uploading.value = true

  try {
    // 调用上传接口
    const res = await importTeachers({ file: file as File })
    if (res.success) {
      currentState.value = 1
      successCount.value = res.successCount || 0
      message.success('批量导入成功')
      emit('success')
    } else {
      currentState.value = 2
      errorList.value = res.errors || []
      message.error('批量导入失败')
    }
  } catch (error) {
    console.error('导入失败', error)
    message.error('导入失败，请检查文件格式')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped lang="scss">
.import-header {
  font-size: 22px;
  font-weight: 700;
  color: #111827;
}

.import-box {
  .import-title {
    font-size: 16px;
    font-weight: 500;
    color: #111827;
    display: flex;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 20px;
    .import-title-icon {
      display: inline-block;
      width: 4px;
      height: 20px;
      background-color: #ec7a2e;
      margin-right: 8px;
      border-radius: 2px;
    }
  }
  .import-item {
    padding: 15px 15px 0;
    margin-top: 20px;
  }
  .import-request {
    padding-bottom: 15px;
    .import-descriptions {
      height: 250px;
      overflow-y: auto;
    }
  }
  .import-btn {
    margin-top: 20px;
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.import-result-icon {
  width: 120px;
  height: 120px;
  margin: 10px auto 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #ccc;
  border-radius: 50%;
  font-size: 100px;
}

.import-success {
  .import-success-icon {
    color: #22c55e;
    background: #dcfce7;
  }
  .success-main {
    min-height: 200px;
    text-align: center;
    margin-top: 20px;

    .success-title {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
    }
    .success-content {
      margin-top: 12px;
      font-size: 16px;
      color: #111827;

      b {
        color: #ec7a2e;
      }
    }
  }
}

.import-error {
  .import-error-icon {
    color: #f43f5e;
    background: #fee2e2;
  }
  .error-list {
    max-height: 200px;
    min-height: 100px;
    overflow-y: auto;
    margin-top: 20px;
    padding: 0 15px;

    .error-item {
      text-align: center;
      font-size: 14px;
      color: #111827;
      margin-bottom: 8px;
    }
  }
  .error-btn {
    margin-top: 20px;
    padding: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>

<style lang="scss">
.question-edit-modal.ant-modal .ant-modal-content {
  border-radius: 24px;
  padding: 28px 32px 24px;
  background: rgb(248 247 246 / 1);
  box-shadow: none;
}
.ant-modal-body {
  padding: 0;
}
</style>
