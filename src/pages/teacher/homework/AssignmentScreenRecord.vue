<template>
  <div ref="screenRecordRef" class="screen-record full-size relative">
    <a-config-provider :getPopupContainer="() => fullscreenContainer">
      <!-- 右侧-控制面板 -->
      <div class="canvas-controls frosted-glass">
        <div class="control-top">
          <a-tooltip placement="left" title="返回列表">
            <div class="ctrl-item" @click="goBack">
              <div class="ctrl-btn">
                <Icon icon="ep:back" width="20" height="20" />
              </div>
              <div class="ctrl-label">返回</div>
            </div>
          </a-tooltip>
        </div>

        <div class="divider"></div>

        <div class="control-center">
          <div class="record-group">
            <div class="ctrl-item no-hover">
              <div class="record-btn" :class="{ recording: isRecordingActive }" @click="toggleRecording">
                <div class="inner-icon">
                  <PauseCircleOutlined v-if="recordingState === 'recording'" />
                  <PlayCircleOutlined v-else-if="recordingState === 'paused'" />
                  <Icon icon="line-md:play-filled" width="20" height="20" v-else />
                  <!-- <div class="record-dot" v-else></div> -->
                </div>
              </div>
              <div class="ctrl-label record">{{ recordBtnLabel }}</div>
            </div>
            <div class="timer mt-6" v-if="isRecordingActive">
              {{ formattedTime }}
            </div>
          </div>

          <a-tooltip placement="left" title="保存并上传" v-if="isRecordingActive || recordedBlob">
            <button
              type="button"
              class="sr-ctrl-btn ctrl-item mt-15 flex-col gap-s"
              :disabled="uploadPopup.uploading"
              @click.stop="openSaveUploadModal()"
            >
              <div class="ctrl-btn"><Icon icon="material-symbols:overview-key-rounded" width="18" /></div>

              <div class="ctrl-label">结束录制</div>
            </button>
          </a-tooltip>
        </div>

        <div class="divider"></div>

        <div class="control-bottom">
          <a-tooltip placement="left" title="工具栏" :open="!showTools && undefined">
            <div
              class="tool-trigger flex-col gap-s w-full position-relative"
              :class="{ active: showTools }"
              @click.stop="showTools = !showTools"
            >
              <div class="ctrl-item">
                <div class="ctrl-btn">
                  <Icon icon="streamline:pen-tool" width="15" height="15" />
                </div>

                <div class="ctrl-label">工具栏</div>
              </div>

              <div class="tool-popover frosted-glass" @click.stop v-show="showTools">
                <div class="tool-group">
                  <a-tooltip title="画笔" placement="right">
                    <div class="tool-btn" :class="{ active: currentTool === 'pen' }" @click.stop="currentTool = 'pen'">
                      <EditOutlined />
                    </div>
                  </a-tooltip>

                  <a-tooltip title="文本" placement="right">
                    <div
                      class="tool-btn"
                      :class="{ active: currentTool === 'text' }"
                      @click.stop="currentTool = 'text'"
                    >
                      <FontSizeOutlined />
                    </div>
                  </a-tooltip>
                  <a-tooltip title="橡皮擦" placement="right">
                    <div
                      class="tool-btn"
                      :class="{ active: currentTool === 'eraser' }"
                      @click.stop="currentTool = 'eraser'"
                    >
                      <Icon icon="solar:eraser-outline" width="15" height="15" />
                    </div>
                  </a-tooltip>
                  <a-tooltip title="箭头" placement="right">
                    <div
                      class="tool-btn"
                      :class="{ active: currentTool === 'arrow' }"
                      @click.stop="currentTool = 'arrow'"
                    >
                      <ArrowRightOutlined />
                    </div>
                  </a-tooltip>
                  <a-tooltip title="直线" placement="right">
                    <div
                      class="tool-btn"
                      :class="{ active: currentTool === 'line' }"
                      @click.stop="currentTool = 'line'"
                    >
                      <MinusOutlined />
                    </div>
                  </a-tooltip>
                </div>
                <div class="divider"></div>
                <a-tooltip title="选择画笔粗细" placement="right">
                  <div class="size-slider-vertical">
                    <a-slider v-model:value="brushSize" :min="1" :max="20" vertical class="custom-slider" />
                    <span>{{ brushSize }}</span>
                  </div>
                </a-tooltip>

                <div class="divider"></div>
                <div class="color-group">
                  <div
                    v-for="color in recentColors"
                    :key="color"
                    class="color-btn"
                    :class="{ active: brushColor === color }"
                    :style="{ background: color }"
                    @click.stop="changeColor(color)"
                  ></div>
                  <a-tooltip title="选择画笔颜色" placement="right">
                    <div class="tool-btn color-picker-btn" @click.stop="openColorPicker">
                      <input
                        ref="colorInputRef"
                        type="color"
                        class="color-input"
                        :value="brushColor"
                        @click.stop
                        @input="(e: any) => changeColor(e.target.value)"
                      />
                      <Icon icon="fluent-mdl2:color" />
                    </div>
                  </a-tooltip>
                </div>
                <div class="divider"></div>
                <div class="action-group">
                  <a-tooltip title="撤销" placement="right">
                    <div class="tool-btn" @click.stop="undo">
                      <UndoOutlined />
                    </div>
                  </a-tooltip>
                  <a-tooltip title="清屏" placement="right">
                    <div class="tool-btn" @click.stop="clearCanvas">
                      <DeleteOutlined />
                    </div>
                  </a-tooltip>
                </div>
              </div>
            </div>
          </a-tooltip>
        </div>
      </div>

      <!-- 画布与名单区域（录制选区默认整页 screenRecordRef，此处为内容区） -->
      <div class="screen-record-content canvas-box">
        <canvas ref="canvasRef" class="drawing-canvas full-size" :style="{ cursor: cursorStyle }"></canvas>

        <!-- 底部状态栏 -->
        <div class="bottom-status-left">
          <div class="status-indicator frosted-glass" v-if="recordingState === 'recording'">
            <span class="dot"></span>
            <span>正在录制中</span>
          </div>
          <div class="status-indicator idle frosted-glass" v-else-if="recordingState === 'paused'">
            <InfoCircleOutlined />
            <span>录制暂停中</span>
          </div>
          <div class="status-indicator idle frosted-glass" v-else>
            <InfoCircleOutlined />
            <span>点击左侧红色按钮开始录制</span>
          </div>
        </div>

        <div class="bottom-status-right">
          <div class="fullscreen-btn frosted-glass" @click="toggleFullscreen">
            <div class="fs-icon">全屏</div>
            <Icon icon="iconamoon:screen-full-light" width="15" height="15" />
          </div>
        </div>

        <button type="button" class="student-toggle frosted-glass" @click="panelOpen = !panelOpen">
          <UnorderedListOutlined />
          学生名单
          <span class="student-badge">{{ studentCount }}</span>
        </button>

        <div class="canvas-answer frosted-glass" v-show="panelOpen">
          <div class="answer-header">
            <span class="title">名单</span>
          </div>
          <div class="student-list-content flex-col gap-md">
            <StudentListGroup
              label="正确学生:"
              :users="currentTopic?.users.rightUsers || []"
              groupClass="right"
              @preview="handlePreview"
            />
            <StudentListGroup
              label="错误学生:"
              :users="currentTopic?.users.wrongUsers || []"
              groupClass="wrong"
              @preview="handlePreview"
            />
            <StudentListGroup
              label="半对学生:"
              :users="currentTopic?.users.halfUsers || []"
              groupClass="half"
              @preview="handlePreview"
            />
            <StudentListGroup
              label="其他学生:"
              :users="currentTopic?.users.ortherUsers || []"
              groupClass="other"
              @preview="handlePreview"
            />
          </div>
        </div>
      </div>

      <!-- 右侧-切题 -->
      <div class="canvas-topic frosted-glass">
        <div class="topic-title">题号</div>
        <div ref="topicListRef" class="topic-list">
          <a-tooltip
            placement="right"
            :title="isRecordingActive ? '切换题目将结束当前视频的录制' : null"
            v-for="(topic, index) in topicNum"
            :key="topic.id"
          >
            <p
              class="topic-item"
              :class="currentTopic?.id === topic.id ? 'active-item' : ''"
              @click="confirmChangeQuestion(index)"
            >
              {{ topic.number }}
            </p>
          </a-tooltip>
        </div>
      </div>

      <!-- 图片预览弹窗 -->
      <a-modal
        v-model:open="previewVisible"
        :title="previewTitle"
        :footer="null"
        width="60%"
        wrapClassName="full-image-modal"
        centered
        :zIndex="1050"
        :getContainer="() => fullscreenContainer"
      >
        <img :src="previewImage" style="width: 100%; height: auto; max-height: 90vh; object-fit: contain" />
      </a-modal>

      <a-modal
        v-model:open="saveUploadVisible"
        title="保存并上传"
        centered
        :maskClosable="false"
        :zIndex="1060"
        :getContainer="() => fullscreenContainer"
      >
        <div class="sr-save-upload">
          <div class="sr-save-row">
            <span class="sr-save-label">视频名称</span>
            <a-input v-model:value="saveUploadName" :maxlength="50" placeholder="请输入视频名称" />
          </div>
          <div class="sr-tips flex gap-s">
            <Icon icon="gridicons:notice-outline" width="20" color="#ec7a2e" />
            <p>
              小提示：<br />可以在
              <span class="bold">我的学校-微课资源</span>
              查看已上传的视频
            </p>
          </div>
        </div>
        <template #footer>
          <a-button danger :disabled="uploadPopup.uploading || saveUploadSubmitting" @click="discardVideo"
            >重新录制</a-button
          >
          <a-button
            type="primary"
            :loading="saveUploadSubmitting"
            :disabled="uploadPopup.uploading"
            @click="saveAndUpload"
            >保存并上传</a-button
          >
        </template>
      </a-modal>
    </a-config-provider>
  </div>

  <!-- 录屏：仅本页选区域，不请求屏幕权限，可录入左侧栏、名单、右侧栏等；全屏时需挂载到全屏元素内 -->
  <Teleport :to="fullscreenContainer">
    <div v-if="regionSelectVisible" class="region-record-overlay" @mousedown.self="cancelRegionSelect">
      <p class="region-overlay-hint" v-if="!regionSelection || (regionSelection.w < 5 && regionSelection.h < 5)">
        拖拽勾选录制区域（含左侧栏、名单、右侧栏等），无需授权
      </p>
      <div
        ref="regionSelectLayerRef"
        class="region-select-layer region-select-layer-full"
        @mousedown="onRegionSelectStart"
        @mousemove="onRegionSelectMove"
        @mouseup="onRegionSelectEnd"
        @mouseleave="onRegionSelectEnd"
      >
        <div
          v-if="regionSelection && (regionSelection.w > 0 || regionSelection.h > 0 || regionSelectStart)"
          class="region-selection-box"
          :style="{
            left: regionSelection.x + 'px',
            top: regionSelection.y + 'px',
            width: Math.max(0, regionSelection.w) + 'px',
            height: Math.max(0, regionSelection.h) + 'px',
          }"
        >
          <span class="region-tip" v-if="regionSelectStart">拖拽选择录制区域</span>
          <span class="region-tip region-tip-adjust" v-else>可拖拽边缘调整点精确对齐边界</span>
          <template v-if="!regionSelectStart && regionSelection.w >= 10 && regionSelection.h >= 10">
            <div class="region-handle nw" @mousedown.stop="startResize($event, 'nw')" title="左上" />
            <div class="region-handle n" @mousedown.stop="startResize($event, 'n')" title="上" />
            <div class="region-handle ne" @mousedown.stop="startResize($event, 'ne')" title="右上" />
            <div class="region-handle e" @mousedown.stop="startResize($event, 'e')" title="右" />
            <div class="region-handle se" @mousedown.stop="startResize($event, 'se')" title="右下" />
            <div class="region-handle s" @mousedown.stop="startResize($event, 's')" title="下" />
            <div class="region-handle sw" @mousedown.stop="startResize($event, 'sw')" title="左下" />
            <div class="region-handle w" @mousedown.stop="startResize($event, 'w')" title="左" />
          </template>
        </div>
      </div>
      <div class="region-record-actions">
        <a-button @click="cancelRegionSelect">取消</a-button>
        <a-button
          type="primary"
          :disabled="!regionSelection || regionSelection.w < 10 || regionSelection.h < 10"
          @click="startRegionRecording"
        >
          开始录制
        </a-button>
      </div>
    </div>
  </Teleport>

  <Teleport :to="fullscreenContainer">
    <Transition name="sr-popup-slide">
      <div v-if="uploadPopup.visible" class="sr-upload-popup">
        <div class="up-head">
          <span class="up-title">上传状态</span>
          <button type="button" class="up-close" @click="closeUploadPopup">
            <Icon icon="mingcute:close-line" width="16" />
          </button>
        </div>

        <div class="up-body">
          <div class="up-row">
            <span class="up-label">{{ uploadPopupLabel }}</span>
            <span class="up-pct">{{ uploadPopup.progress }}%</span>
          </div>
          <div class="up-bar">
            <div class="up-fill" :style="{ width: uploadPopup.progress + '%' }"></div>
          </div>
        </div>

        <div class="up-foot">
          <div class="up-stats">
            <span class="stat ok"><i class="dot"></i> 成功: {{ uploadPopup.success }}</span>
            <span class="stat bad"><i class="dot"></i> 失败: {{ uploadPopup.fail }}</span>
          </div>
          <button
            v-if="uploadPopup.status !== 'success'"
            type="button"
            class="up-retry"
            :disabled="uploadPopup.uploading"
            @click="retryUpload"
          >
            <Icon icon="solar:restart-bold" width="14" />
            {{ uploadPopup.uploading ? '上传中' : '重试' }}
          </button>
          <button
            v-else
            type="button"
            class="up-view"
            :disabled="!uploadPopup.lastExplanationId"
            @click="gotoUploadedVideo"
          >
            <Icon icon="solar:play-bold" width="14" />
            查看已上传视频
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>

  <input
    v-if="textInput.visible"
    v-model="textInput.value"
    class="canvas-text-input"
    :style="{
      left: textInput.x + 'px',
      top: textInput.y + 'px',
      fontSize: textInput.fontSize + 'px',
      color: textInput.color,
      width: '200px',
      position: 'absolute',
      background: 'transparent',
      border: '1px dashed #666',
      outline: 'none',
      zIndex: 100,
    }"
    @blur="handleTextBlur"
    @keyup.enter="handleTextBlur"
    autoFocus
  />
</template>

<script setup lang="ts">
import { createTeacherExplanation, getClassHomeworkDetail, uploadFile } from '@/api/homework'
import type { ClassHomeworkDetailVO, StudentHomeworkDetailVO } from '@/api/homework/type'
import StudentListGroup from '@/components/homework/StudentListGroup.vue'
import { ROUTES } from '@/router/routes'
import type { ScreenRecordTopic } from '@/types/homework'
import { decrypt } from '@/utils/crypto'
import {
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  FontSizeOutlined,
  InfoCircleOutlined,
  MinusOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons-vue'
import { Icon } from '@iconify/vue'
import { message, Modal } from 'ant-design-vue'
import html2canvas from 'html2canvas'
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

// 基本状态
const router = useRouter()
const route = useRoute()
const screenRecordRef = ref<HTMLElement | null>(null)

const assignmentId = computed(() => {
  const raw = String(route.params.id || '')
  if (!raw) return ''
  try {
    return decrypt(decodeURIComponent(raw))
  } catch {
    return decrypt(raw)
  }
})
const header = computed(() => {
  const cached = assignmentId.value ? sessionStorage.getItem(`hw_detail_meta_${String(assignmentId.value)}`) : ''
  if (cached) {
    try {
      const v = JSON.parse(cached) as any
      if (v && typeof v === 'object') {
        return {
          subject: String(v.subject || '-'),
          gradeClass: String(v.gradeClass || '-'),
          paperName: String(v.paperName || '-'),
        }
      }
    } catch {
      // ignore
    }
  }

  return {
    subject: '-',
    gradeClass: '-',
    paperName: '-',
  }
})

const classId = computed(() => {
  const v = route.query.classId
  const raw = typeof v === 'string' ? v : ''
  if (raw) {
    try {
      return decrypt(decodeURIComponent(raw))
    } catch {
      return decrypt(raw)
    }
  }
  const cached = assignmentId.value
    ? sessionStorage.getItem(`hw_detail_classId_${String(assignmentId.value)}`) || ''
    : ''
  return cached ? decrypt(cached) : ''
})

function mapDetailToTopic(item: ClassHomeworkDetailVO, index: number): ScreenRecordTopic {
  const id = (item as any).questionId ?? item.questionOrder ?? String(index)
  const number = item.questionOrder ?? item.pageNumber ?? String(index + 1)
  const url = item.questionImage ?? ''
  const firstCorrect = item.correctStudentList?.[0]
  const answerUrl = firstCorrect?.studentAnswerImage ?? ''
  const toUser = (s: StudentHomeworkDetailVO) => ({
    name: String(s.studentName ?? s.studentUserId ?? '-'),
    answerImageUrl: s.studentAnswerImage,
  })
  // 答案：使用 class-homework-detail 接口返回的 answer 字段
  const answerText =
    item.answers
      ?.map((answer: any, i: number) => {
        const prefix = item.answers.length > 1 ? `空${i + 1}：` : ''
        const semi = item.answers.length > 1 ? '；' : ''
        return `${prefix}${answer.answer}${semi}`
      })
      .join('\n') || ''

  return {
    id: String(id),
    number: String(number),
    url,
    answerUrl,
    questionContent: item.questionContent,
    answerText,
    users: {
      rightUsers: (item.correctStudentList ?? []).map(toUser),
      wrongUsers: (item.errorStudentList ?? []).map(toUser),
      halfUsers: (item.halfStudentList ?? []).map(toUser),
      ortherUsers: [],
    },
  }
}

const topicNum = ref<ScreenRecordTopic[]>([])
const currentTopic = ref<ScreenRecordTopic>()
const panelOpen = ref(false)
const classDetailLoading = ref(false)

const topicListRef = ref<HTMLElement | null>(null)
const topicListAtBottom = ref(false)

const updateTopicListAtBottom = () => {
  const el = topicListRef.value
  if (!el) return
  topicListAtBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 1
}

const scrollActiveTopicIntoView = (behavior: ScrollBehavior = 'smooth') => {
  const wrap = topicListRef.value
  if (!wrap) return
  const el = wrap.querySelector('.topic-item.active-item') as HTMLElement | null
  if (!el) return
  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior })
}

watch(
  () => [currentTopic.value?.id, topicNum.value.length] as const,
  () => {
    nextTick(() => {
      scrollActiveTopicIntoView('auto')
      updateTopicListAtBottom()
    })
  },
  { immediate: true }
)

watch(
  () => topicListRef.value,
  el => {
    if (!el) return
    el.addEventListener('scroll', updateTopicListAtBottom, { passive: true })
    nextTick(() => updateTopicListAtBottom())
  },
  { immediate: true }
)

const fetchClassHomeworkDetail = async () => {
  const aid = assignmentId.value
  const cid = classId.value
  if (!aid || !cid) {
    topicNum.value = []
    return
  }
  classDetailLoading.value = true
  try {
    const list = await getClassHomeworkDetail({ assignmentId: aid, classId: cid })
    topicNum.value = Array.isArray(list) ? list.map((item, i) => mapDetailToTopic(item, i)) : []
    const rawIndex = route.query.topicIndex
    const topicIndex = typeof rawIndex === 'string' ? parseInt(rawIndex, 10) : NaN
    if (Number.isInteger(topicIndex) && topicIndex >= 0 && topicIndex < topicNum.value.length) {
      currentTopic.value = topicNum.value[topicIndex]
    } else {
      currentTopic.value = topicNum.value[0]
    }
    loadCurrentTopicImages()
  } catch {
    topicNum.value = []
    currentTopic.value = topicNum.value[0]
    loadCurrentTopicImages()
  } finally {
    classDetailLoading.value = false
  }
}

watch(
  [assignmentId, classId],
  () => {
    fetchClassHomeworkDetail()
  },
  { immediate: false }
)

const studentCount = computed(() => {
  const u = currentTopic.value?.users
  return (
    (u?.rightUsers?.length || 0) +
    (u?.wrongUsers?.length || 0) +
    (u?.halfUsers?.length || 0) +
    (u?.ortherUsers?.length || 0)
  )
})

// 图片预览状态
const previewVisible = ref(false)
const previewImage = ref('')
const previewTitle = ref('')

const handlePreview = (url: string | undefined, name: string) => {
  if (!url) return
  previewImage.value = url
  previewTitle.value = `${name}的答案`
  previewVisible.value = true
}

// 录屏相关状态
const recordingState = ref<'idle' | 'recording' | 'paused'>('idle')
const isRecordingActive = computed(() => recordingState.value === 'recording' || recordingState.value === 'paused')
const recordBtnLabel = computed(() => {
  if (recordingState.value === 'recording') return '暂停录制'
  if (recordingState.value === 'paused') return '继续录制'
  return '开始录制'
})
const recordedStream = ref<MediaStream | null>(null)
const micStream = ref<MediaStream | null>(null)

// 录屏：仅本页选区域，不请求「该网站将能看到您屏幕上的内容」，用 html2canvas 截取选区录制
const regionSelectVisible = ref(false)
const regionSelectLayerRef = ref<HTMLElement | null>(null)
const regionSelection = ref<{ x: number; y: number; w: number; h: number } | null>(null)
const regionSelectStart = ref<{ x: number; y: number } | null>(null)
const regionRecordCanvas = ref<HTMLCanvasElement | null>(null)
/** 正在拖拽的调整点：n/s/e/w/nw/ne/sw/se */
const regionResizeHandle = ref<string | null>(null)
let regionCaptureLoopId = 0
/** 本页截图画布录制循环是否运行中 */
let regionPageCaptureActive = false
const recordedBlob = ref<Blob | null>(null)
const mediaRecorder = ref<MediaRecorder | null>(null)
const recordedChunks = ref<Blob[]>([])
const recordMimeType = ref<string>('video/mp4')
let recordTimer: number | null = null
let stopRecordingResolver: null | ((blob: Blob | null) => void) = null
const recordSeconds = ref(0)
const lastRecordDuration = ref(0)
const formattedTime = computed(() => {
  const m = Math.floor(recordSeconds.value / 60)
    .toString()
    .padStart(2, '0')
  const s = (recordSeconds.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const lastAutoUploadTopicId = ref<string | null>(null)

type UploadPopupStatus = 'idle' | 'uploading' | 'success' | 'fail'

const uploadPopup = reactive({
  visible: false,
  progress: 0,
  success: 0,
  fail: 0,
  uploading: false,
  lastBlob: null as null | Blob,
  status: 'idle' as UploadPopupStatus,
  lastExplanationId: '' as string,
  lastDuration: 0,
})

const uploadPopupLabel = computed(() => {
  if (uploadPopup.status === 'success') return '上传成功'
  if (uploadPopup.status === 'fail') return '上传失败'
  return '当前题上传中...'
})

const startUpload = async (trigger: 'manual' | 'auto', blob: Blob, duration?: number, customName?: string) => {
  if (uploadPopup.uploading) return

  const questionId = currentTopic.value?.id
  if (!questionId) {
    message.warning('缺少题目ID，无法上传讲解')
    return
  }

  const actualDuration = Math.max(0, Number(duration ?? lastRecordDuration.value ?? 0))
  uploadPopup.lastDuration = actualDuration

  uploadPopup.lastBlob = blob
  uploadPopup.visible = true
  uploadPopup.uploading = true
  uploadPopup.status = 'uploading'
  uploadPopup.lastExplanationId = ''
  uploadPopup.progress = 0

  const ts = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const topic = currentTopic.value?.number || questionId
  const mime = blob.type || recordMimeType.value || 'video/mp4'
  const ext = mime.includes('webm') ? 'webm' : 'mp4'
  const rawBase = (String(customName || '').trim() || `讲题_${topic}`).replace(/[\\/:*?"<>|]+/g, '_').trim()
  const safeBase = rawBase || `讲题_${topic}`
  const fileName = `${safeBase}_${ts}.${ext}`
  const videoFile = new File([blob], fileName, { type: mime })

  try {
    const attachment = await uploadFile(
      { file: videoFile, category: 'teacher_explanation' },
      {
        onUploadProgress: e => {
          const total = e.total || 0
          const loaded = e.loaded || 0
          if (total > 0) {
            uploadPopup.progress = Math.min(80, Math.floor((loaded / total) * 80))
          }
        },
      }
    )

    const attachmentId = attachment?.attachmentId
    if (!attachmentId) throw new Error('上传失败：未返回 attachmentId')

    uploadPopup.progress = Math.max(uploadPopup.progress, 90)

    const defaultExplanationName = header.value.paperName
      ? `${header.value.paperName} 题目 ${topic}`
      : `讲解视频-题目 ${topic}`
    const explanationName = String(customName || '').trim() || defaultExplanationName

    const explanationId = await createTeacherExplanation({
      explanationName,
      questionId,
      videoAttaId: attachmentId,
      duration: uploadPopup.lastDuration,
    })

    uploadPopup.lastExplanationId = explanationId == null ? '' : String(explanationId)
    uploadPopup.progress = 100
    uploadPopup.status = 'success'
    uploadPopup.success += 1
    if (trigger === 'manual') message.success('上传成功')
  } catch (e: any) {
    uploadPopup.status = 'fail'
    uploadPopup.fail += 1
    if (trigger === 'manual') message.error(e?.message || '上传失败')
  } finally {
    uploadPopup.uploading = false
  }
}

const closeUploadPopup = () => {
  if (uploadPopup.uploading) return
  uploadPopup.visible = false
  uploadPopup.status = 'idle'
}

const gotoUploadedVideo = () => {
  const eid = String(uploadPopup.lastExplanationId || '').trim()
  if (!eid) {
    message.warning('暂无可查看的视频')
    return
  }
  const path = ROUTES.TEACHER_SCHOOL_RESOURCE_DETAIL.replace(':id', encodeURIComponent(eid))
  router.push(path).catch(() => {})
  uploadPopup.visible = false
}

const retryUpload = () => {
  if (!uploadPopup.lastBlob) {
    message.warning('暂无可重试的上传任务')
    return
  }
  startUpload('manual', uploadPopup.lastBlob, uploadPopup.lastDuration)
}

const stopRecordingAndWait = (stopStream = true) => {
  return new Promise<Blob | null>(resolve => {
    if (!mediaRecorder.value || (recordingState.value !== 'recording' && recordingState.value !== 'paused')) {
      resolve(recordedBlob.value)
      return
    }
    stopRecordingResolver = resolve
    stopRecording(stopStream)
  })
}

const resetRecordResult = () => {
  recordedBlob.value = null
  recordedChunks.value = []
  mediaRecorder.value = null
  recordedStream.value = null
  recordSeconds.value = 0
}

const saveUploadVisible = ref(false)
const saveUploadName = ref('')
const saveUploadSubmitting = ref(false)
const startRecordingAfterSaveUpload = ref(false)

const getDefaultExplanationName = () => {
  const topic = currentTopic.value?.number || currentTopic.value?.id || ''
  return header.value.paperName ? `${header.value.paperName} 题目 ${topic}` : `讲解视频-题目 ${topic}`
}

const openSaveUploadModal = async (startAfter: boolean = false) => {
  startRecordingAfterSaveUpload.value = startAfter === true

  if (recordingState.value === 'recording') {
    pauseRecording()
  }

  saveUploadName.value = getDefaultExplanationName()
  saveUploadVisible.value = true
}

const discardVideo = async () => {
  if (uploadPopup.uploading || saveUploadSubmitting.value) return
  saveUploadSubmitting.value = true
  try {
    if (isFullscreen.value && document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        // ignore
      }
    }
    if (isRecordingActive.value) {
      await stopRecordingAndWait(true)
    }
    resetRecordResult()
    saveUploadVisible.value = false

    if (startRecordingAfterSaveUpload.value) {
      startRecordingAfterSaveUpload.value = false
      clearCanvas()
      startRecording()
    }
  } finally {
    saveUploadSubmitting.value = false
  }
}

const saveAndUpload = async () => {
  if (uploadPopup.uploading || saveUploadSubmitting.value) return

  const name = String(saveUploadName.value || '').trim()
  if (!name) {
    message.warning('请输入视频名称')
    return
  }

  saveUploadSubmitting.value = true
  try {
    let blob: Blob | null = null
    if (isRecordingActive.value) {
      blob = await stopRecordingAndWait(true)
    } else {
      blob = recordedBlob.value
    }

    if (!blob) {
      message.warning('暂无可上传的视频')
      return
    }

    saveUploadVisible.value = false
    if (isFullscreen.value && document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch {
        // ignore
      }
    }
    startUpload('manual', blob, undefined, name)
    resetRecordResult()

    if (startRecordingAfterSaveUpload.value) {
      startRecordingAfterSaveUpload.value = false
      clearCanvas()
      startRecording()
    }
  } finally {
    saveUploadSubmitting.value = false
  }
}

// 画布相关状态
const canvasRef = ref<HTMLCanvasElement | null>(null)
const canvasContext = ref<CanvasRenderingContext2D | null>(null)
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)
const snapshot = ref<ImageData | null>(null)
const lastMidX = ref(0)
const lastMidY = ref(0)
const textInput = ref({
  visible: false,
  x: 0,
  y: 0,
  value: '',
  fontSize: 16,
  color: '#ffffff',
})

// 图片相关
let img: HTMLImageElement
let imgAnswer: HTMLImageElement

// 处理图片（去白底、变色）；若图片宽高无效则返回占位 canvas，避免 drawImage 报错
const processImage = (image: HTMLImageElement, targetWidth: number, colorHex: string, maxHeight?: number) => {
  const w = image.naturalWidth || image.width || 0
  const h = image.naturalHeight || image.height || 0
  if (!w || !h || !Number.isFinite(w) || !Number.isFinite(h)) {
    const off = document.createElement('canvas')
    off.width = 1
    off.height = 1
    return { canvas: off, height: 1 }
  }

  // 计算缩放比例，同时考虑宽度和高度限制，保持宽高比
  let scale = targetWidth / w
  let imgHeight = h * scale

  // 如果有最大高度限制且当前高度超过限制，则按高度缩放
  if (maxHeight && imgHeight > maxHeight) {
    scale = maxHeight / h
    imgHeight = maxHeight
  }

  const offWidth = Math.max(1, Math.round(w * scale))
  const offHeight = Math.max(1, Math.round(imgHeight))

  const off = document.createElement('canvas')
  off.width = offWidth
  off.height = offHeight
  const offCtx = off.getContext('2d')

  // Parse color
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorHex)
  const rgb = result
    ? {
        r: parseInt(result[1] || 'ff', 16),
        g: parseInt(result[2] || 'ff', 16),
        b: parseInt(result[3] || 'ff', 16),
      }
    : { r: 255, g: 255, b: 255 }

  if (offCtx) {
    offCtx.imageSmoothingEnabled = true
    offCtx.imageSmoothingQuality = 'high'
    offCtx.clearRect(0, 0, off.width, off.height)
    offCtx.drawImage(image, 0, 0, off.width, off.height)

    try {
      const imageData = offCtx.getImageData(0, 0, off.width, off.height)
      const d = imageData.data

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i]!
        const g = d[i + 1]!
        const b = d[i + 2]!
        const a = d[i + 3]!
        if (a === 0) continue

        const isWhite = r > 245 && g > 245 && b > 245
        if (isWhite) {
          d[i + 3] = 0
          continue
        }

        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        const strength = Math.min(1, Math.max(0, (255 - lum) / 255))

        d[i] = rgb.r
        d[i + 1] = rgb.g
        d[i + 2] = rgb.b
        d[i + 3] = Math.round(a * strength)
      }

      offCtx.putImageData(imageData, 0, 0)
    } catch {
      // 跨域图片会污染 canvas，无法 getImageData，仅保留缩放绘制不做像素处理
    }
  }
  return { canvas: off, height: offHeight }
}

// 画布配置
const brushColor = ref('#ffffff')
const brushSize = ref(4)
const currentTool = ref<'pen' | 'brush' | 'eraser' | 'text' | 'line' | 'arrow'>('pen')
const isFullscreen = ref(false)
// 全屏时弹窗、Teleport 需挂载到全屏元素内，否则会渲染到 body 外不可见
const fullscreenContainer = computed(() =>
  isFullscreen.value && screenRecordRef.value ? screenRecordRef.value : document.body
)
const showTools = ref(false)
const recentColors = ref<string[]>(['#f5222d', '#52c41a', '#1890ff', '#FEF3C7', '#ffffff'])
const colorInputRef = ref<HTMLInputElement | null>(null)
const openColorPicker = () => {
  const el = colorInputRef.value
  if (el) el.click()
}

const cursorStyle = computed(() => {
  if (currentTool.value === 'text') return 'text'

  if (currentTool.value === 'pen') {
    const stroke = brushColor.value
    const svg = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.0002 3.00003L21.0002 8.00003L8.00023 21L3.00023 21L3.00023 16L16.0002 3.00003Z" stroke="${stroke}" stroke-width="2" fill="rgba(0,0,0,0.2)"/>
        <path d="M14 5L19 10" stroke="${stroke}" stroke-width="2"/>
      </svg>
    `
      .trim()
      .replace(/\s+/g, ' ')
    return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') 0 24, auto`
  }

  if (currentTool.value === 'eraser') {
    const size = Math.max(16, brushSize.value)
    const radius = size / 2
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${radius}" cy="${radius}" r="${
          radius - 1
        }" stroke="black" stroke-width="1" fill="rgba(255, 255, 255, 0.3)" />
        <circle cx="${radius}" cy="${radius}" r="${
          radius - 1
        }" stroke="white" stroke-width="1" stroke-dasharray="4 4" fill="none" />
      </svg>
    `
      .trim()
      .replace(/\s+/g, ' ')
    return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}') ${radius} ${radius}, auto`
  }

  return 'crosshair'
})

// 切换题目：题目图、答案、学生名单均随 currentTopic 联动
const changeQuestion = (index: number) => {
  currentTopic.value = topicNum.value[index]
  if (currentTopic.value) {
    if (canvasRef.value && canvasContext.value) {
      const c = canvasRef.value
      canvasContext.value.clearRect(0, 0, c.clientWidth || c.width, c.clientHeight || c.height)
    }
    loadCurrentTopicImages()
    nextTick(() => drawBackgroundImage())
  }
}
// 二次确认（全屏时需挂载到全屏容器内才能显示）
const confirmChangeQuestion = (index: number) => {
  if (!isRecordingActive.value) {
    changeQuestion(index)
    return
  }

  Modal.confirm({
    title: '切换题目将结束当前录制并开始新的录制，确定继续吗？',
    okText: '确定',
    cancelText: '取消',
    getContainer: () => fullscreenContainer.value ?? document.body,
    async onOk() {
      const fromTopicId = currentTopic.value?.id || null

      if (fromTopicId && fromTopicId !== lastAutoUploadTopicId.value) {
        if (recordingState.value === 'recording' || recordingState.value === 'paused') {
          const blob = await stopRecordingAndWait(true)
          if (blob) {
            lastAutoUploadTopicId.value = fromTopicId
            startUpload('auto', blob)
          }
        } else if (recordedBlob.value) {
          lastAutoUploadTopicId.value = fromTopicId
          startUpload('auto', recordedBlob.value)
        }
      } else if (recordingState.value === 'recording' || recordingState.value === 'paused') {
        stopRecording(true)
      }

      changeQuestion(index)
    },
  })
}

let leavingConfirming = false
const confirmEndRecording = async () => {
  if (!isRecordingActive.value) return true
  if (leavingConfirming) return false
  leavingConfirming = true
  try {
    return await new Promise<boolean>(resolve => {
      Modal.confirm({
        title: '确认操作',
        content: '点击该功能将结束当前视频的录制，确定继续吗？',
        okText: '确定',
        cancelText: '取消',
        getContainer: () => fullscreenContainer.value ?? document.body,
        async onOk() {
          await stopRecordingAndWait(true)
          resolve(true)
        },
        onCancel() {
          resolve(false)
        },
      })
    })
  } finally {
    leavingConfirming = false
  }
}

onBeforeRouteLeave(async () => {
  if (!isRecordingActive.value) return true
  const ok = await confirmEndRecording()
  return ok
})

const goBack = async () => {
  const ok = await confirmEndRecording()
  if (!ok) return
  const id = String(route.params.id || '')
  const target = id ? ROUTES.TEACHER_HOMEWORK_DETAIL.replace(':id', encodeURIComponent(id)) : ROUTES.TEACHER_HOMEWORK
  router.push(target).catch(() => {})
}

// 修改画笔颜色
const changeColor = (color: string) => {
  brushColor.value = color
  if (currentTool.value === 'eraser') {
    currentTool.value = 'pen'
  }
}

// 打开录屏：仅本页选区域，不请求屏幕权限；默认选区为整页（含左侧工具栏、学生名单、右侧题号）
const openRegionSelect = () => {
  regionSelectStart.value = null
  regionSelectVisible.value = true
  nextTick(() => {
    const el = screenRecordRef.value
    if (el) {
      const r = el.getBoundingClientRect()
      regionSelection.value = {
        x: Math.round(r.left),
        y: Math.round(r.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
      }
    } else {
      regionSelection.value = null
    }
  })
}

const cancelRegionSelect = () => {
  regionSelectVisible.value = false
  regionSelection.value = null
  regionSelectStart.value = null
  regionResizeHandle.value = null
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
}

const onRegionSelectStart = (e: MouseEvent) => {
  if (regionResizeHandle.value) return
  const layer = e.currentTarget as HTMLElement
  const rect = layer.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  regionSelectStart.value = { x, y }
  regionSelection.value = { x, y, w: 0, h: 0 }
}

const getLayerMouse = (e: MouseEvent) => {
  const layer = e.currentTarget as HTMLElement
  const rect = layer.getBoundingClientRect()
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

const onRegionSelectMove = (e: MouseEvent) => {
  const { x: mx, y: my } = getLayerMouse(e)
  const layer = e.currentTarget as HTMLElement
  const lw = layer.clientWidth
  const lh = layer.clientHeight
  const minSize = 10

  if (regionResizeHandle.value && regionSelection.value) {
    const sel = regionSelection.value
    const h = regionResizeHandle.value
    let nx = sel.x,
      ny = sel.y,
      nw = sel.w,
      nh = sel.h
    if (h.includes('e')) {
      nw = Math.max(minSize, Math.min(lw - sel.x, mx - sel.x))
    }
    if (h.includes('w')) {
      nx = Math.max(0, Math.min(sel.x + sel.w - minSize, mx))
      nw = sel.x + sel.w - nx
    }
    if (h.includes('s')) {
      nh = Math.max(minSize, Math.min(lh - sel.y, my - sel.y))
    }
    if (h.includes('n')) {
      ny = Math.max(0, Math.min(sel.y + sel.h - minSize, my))
      nh = sel.y + sel.h - ny
    }
    regionSelection.value = { x: nx, y: ny, w: nw, h: nh }
    return
  }

  if (!regionSelectStart.value || !regionSelection.value) return
  const sx = Math.max(0, Math.min(regionSelectStart.value.x, mx))
  const sy = Math.max(0, Math.min(regionSelectStart.value.y, my))
  const w = Math.abs(mx - regionSelectStart.value.x)
  const h = Math.abs(my - regionSelectStart.value.y)
  regionSelection.value = { x: sx, y: sy, w, h }
}

const onRegionSelectEnd = () => {
  if (regionResizeHandle.value) {
    regionResizeHandle.value = null
    document.removeEventListener('mousemove', onResizeMove)
    document.removeEventListener('mouseup', onResizeEnd)
    return
  }
  regionSelectStart.value = null
}

const startResize = (_e: MouseEvent, handle: string) => {
  regionResizeHandle.value = handle
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
}

const onResizeMove = (e: MouseEvent) => {
  if (!regionResizeHandle.value || !regionSelection.value || !regionSelectLayerRef.value) return
  const layer = regionSelectLayerRef.value
  const rect = layer.getBoundingClientRect()
  const mx = e.clientX - rect.left
  const my = e.clientY - rect.top
  const lw = layer.clientWidth
  const lh = layer.clientHeight
  const minSize = 10
  const sel = regionSelection.value
  const h = regionResizeHandle.value
  let nx = sel.x,
    ny = sel.y,
    nw = sel.w,
    nh = sel.h
  if (h.includes('e')) nw = Math.max(minSize, Math.min(lw - sel.x, mx - sel.x))
  if (h.includes('w')) {
    nx = Math.max(0, Math.min(sel.x + sel.w - minSize, mx))
    nw = sel.x + sel.w - nx
  }
  if (h.includes('s')) nh = Math.max(minSize, Math.min(lh - sel.y, my - sel.y))
  if (h.includes('n')) {
    ny = Math.max(0, Math.min(sel.y + sel.h - minSize, my))
    nh = sel.y + sel.h - ny
  }
  regionSelection.value = { x: nx, y: ny, w: nw, h: nh }
}

const onResizeEnd = () => {
  regionResizeHandle.value = null
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
}

// 开始区域录制：仅本页截图画布，不请求屏幕权限，选区为视口坐标（选区层全屏）
const startRegionRecording = async () => {
  const sel = regionSelection.value
  if (!sel || sel.w < 10 || sel.h < 10) return

  const scale = 2
  let outW = Math.max(2, Math.floor(sel.w * scale))
  let outH = Math.max(2, Math.floor(sel.h * scale))
  outW = outW & 1 ? outW - 1 : outW
  outH = outH & 1 ? outH - 1 : outH

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    message.error('无法创建录制画布')
    return
  }
  ctx.imageSmoothingEnabled = false
  regionRecordCanvas.value = canvas

  if (!window.MediaRecorder) {
    message.error('当前浏览器不支持录屏功能')
    cancelRegionSelect()
    return
  }
  let mimeType = 'video/webm'
  if (typeof MediaRecorder.isTypeSupported === 'function') {
    const candidates = [
      'video/webm; codecs=vp9,opus',
      'video/webm; codecs=vp8,opus',
      'video/webm; codecs=vp9',
      'video/webm; codecs=vp8',
      'video/mp4',
    ]

    const supported = candidates.find(t => MediaRecorder.isTypeSupported(t))
    if (supported) {
      mimeType = supported
    } else {
      message.error('当前浏览器不支持录制，请更换浏览器')
      cancelRegionSelect()
      return
    }
  }

  regionSelectVisible.value = false
  const selCopy = { ...sel }
  const targetFps = 15
  const frameInterval = 1000 / targetFps

  // 仅开始时截一帧作为静态背景，循环中只合成背景+画笔，不再调用 html2canvas，消除闪动
  const staticBgCanvas = document.createElement('canvas')
  staticBgCanvas.width = outW
  staticBgCanvas.height = outH
  const staticBgCtx = staticBgCanvas.getContext('2d')
  if (!staticBgCtx) {
    message.error('无法创建静态背景')
    return
  }
  try {
    await new Promise<void>(r => requestAnimationFrame(() => r()))
    await new Promise<void>(r => setTimeout(r, 0))
    // 全屏时只截取全屏元素（录制界面），避免录进顶部导航栏
    const captureTarget = (document.fullscreenElement as HTMLElement) || document.body
    const drawCanvasEl = canvasRef.value
    const capW = captureTarget === document.body ? window.innerWidth : captureTarget.clientWidth
    const capH = captureTarget === document.body ? window.innerHeight : captureTarget.clientHeight
    const full = await html2canvas(captureTarget, {
      scale,
      width: capW,
      height: capH,
      windowWidth: capW,
      windowHeight: capH,
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      logging: false,
      backgroundColor: '#162622', // 与 canvas-box 一致，避免白边
      ignoreElements: el => el === drawCanvasEl, // 排除画布，避免题目/答案渲染两遍
    })
    const sx = selCopy.x * scale
    const sy = selCopy.y * scale
    const sw = selCopy.w * scale
    const sh = selCopy.h * scale
    staticBgCtx.drawImage(full, sx, sy, sw, sh, 0, 0, outW, outH)
  } catch (e) {
    message.error('截取背景失败，请重试')
    return
  }

  regionPageCaptureActive = true
  let frameCount = 0
  let refreshingBg = false
  const refreshIntervalFrames = 30 // 约 2 秒刷新一次背景，可录入工具栏、名单、弹窗变化
  const refreshBackground = async () => {
    if (refreshingBg || !regionPageCaptureActive || !staticBgCtx) return
    refreshingBg = true
    try {
      await new Promise<void>(r => requestAnimationFrame(() => r()))
      await new Promise<void>(r => setTimeout(r, 0))
      const captureTarget = (document.fullscreenElement as HTMLElement) || document.body
      const drawCanvasEl = canvasRef.value
      const capW = captureTarget === document.body ? window.innerWidth : captureTarget.clientWidth
      const capH = captureTarget === document.body ? window.innerHeight : captureTarget.clientHeight
      const full = await html2canvas(captureTarget, {
        scale,
        width: capW,
        height: capH,
        windowWidth: capW,
        windowHeight: capH,
        scrollX: 0,
        scrollY: 0,
        useCORS: true,
        logging: false,
        backgroundColor: '#162622',
        ignoreElements: el => el === drawCanvasEl,
      })
      if (!regionPageCaptureActive) return
      const sx = selCopy.x * scale
      const sy = selCopy.y * scale
      const sw = selCopy.w * scale
      const sh = selCopy.h * scale
      staticBgCtx.drawImage(full, sx, sy, sw, sh, 0, 0, outW, outH)
    } catch {
      // 单次刷新失败忽略
    } finally {
      refreshingBg = false
    }
  }
  const captureLoop = () => {
    if (!regionPageCaptureActive || !regionRecordCanvas.value) return
    frameCount += 1
    if (frameCount % refreshIntervalFrames === 0) {
      refreshBackground()
    }
    const start = performance.now()
    ctx.drawImage(staticBgCanvas, 0, 0, outW, outH, 0, 0, outW, outH)
    const drawCanvas = canvasRef.value
    if (drawCanvas && drawCanvas.width > 0 && drawCanvas.height > 0) {
      const rect = drawCanvas.getBoundingClientRect()
      const outX = ((rect.left - selCopy.x) / selCopy.w) * outW
      const outY = ((rect.top - selCopy.y) / selCopy.h) * outH
      const outCw = (rect.width / selCopy.w) * outW
      const outCh = (rect.height / selCopy.h) * outH
      if (outCw > 0 && outCh > 0) {
        ctx.drawImage(drawCanvas, 0, 0, drawCanvas.width, drawCanvas.height, outX, outY, outCw, outCh)
      }
    }
    const elapsed = performance.now() - start
    const delay = Math.max(0, Math.ceil(frameInterval - elapsed))
    regionCaptureLoopId = window.setTimeout(captureLoop, delay) as unknown as number
  }
  // 先画一帧再开录，避免开头黑屏
  ctx.drawImage(staticBgCanvas, 0, 0, outW, outH, 0, 0, outW, outH)
  const drawCanvas0 = canvasRef.value
  if (drawCanvas0 && drawCanvas0.width > 0 && drawCanvas0.height > 0) {
    const rect0 = drawCanvas0.getBoundingClientRect()
    const outX0 = ((rect0.left - selCopy.x) / selCopy.w) * outW
    const outY0 = ((rect0.top - selCopy.y) / selCopy.h) * outH
    const outCw0 = (rect0.width / selCopy.w) * outW
    const outCh0 = (rect0.height / selCopy.h) * outH
    if (outCw0 > 0 && outCh0 > 0) {
      ctx.drawImage(drawCanvas0, 0, 0, drawCanvas0.width, drawCanvas0.height, outX0, outY0, outCw0, outCh0)
    }
  }
  regionCaptureLoopId = window.setTimeout(captureLoop, frameInterval) as unknown as number

  await nextTick()

  recordSeconds.value = 0
  lastRecordDuration.value = 0

  const videoStream = canvas.captureStream(targetFps)
  let outStream: MediaStream = videoStream

  try {
    micStream.value = await navigator.mediaDevices.getUserMedia({ audio: true })
    outStream = new MediaStream([...videoStream.getVideoTracks(), ...micStream.value.getAudioTracks()])
  } catch {
    micStream.value = null
    message.warning('未获取到麦克风权限，本次录制不包含声音')
  }

  recordedStream.value = outStream
  recordMimeType.value = mimeType
  recordingState.value = 'recording'
  showTools.value = true
  startTimer()
  const videoBitsPerSecond = 10_000_000
  const recorder = new MediaRecorder(outStream, { mimeType, videoBitsPerSecond })
  mediaRecorder.value = recorder
  recordedChunks.value = []
  recorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) recordedChunks.value.push(e.data)
  }
  recorder.onstop = () => {
    recordedBlob.value = new Blob(recordedChunks.value, { type: recordMimeType.value })
    if (stopRecordingResolver) {
      const r = stopRecordingResolver
      stopRecordingResolver = null
      r(recordedBlob.value)
    }
  }
  recorder.onerror = () => stopRecording()
  recorder.start(500)
}

function stopRegionCapture() {
  regionPageCaptureActive = false
  if (regionCaptureLoopId) {
    clearTimeout(regionCaptureLoopId)
    regionCaptureLoopId = 0
  }
  regionRecordCanvas.value = null
}

// 开始录屏入口：钉钉式区域录屏（全屏/非全屏均走选区，全屏时选区层会挂载到全屏元素内）
const startRecording = async (_reuseStream = false) => {
  currentTool.value = 'pen'
  await openRegionSelect()
}

// 计时器控制
const startTimer = () => {
  if (recordTimer) window.clearInterval(recordTimer)
  recordTimer = window.setInterval(() => {
    recordSeconds.value += 1
  }, 1000)
}

const stopTimer = () => {
  if (recordTimer) {
    window.clearInterval(recordTimer)
    recordTimer = null
  }
}

const setMicTrackEnabled = (enabled: boolean) => {
  const tracks = micStream.value?.getAudioTracks?.() || []
  tracks.forEach(t => {
    t.enabled = enabled
  })
}

// 暂停录屏
const pauseRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state === 'recording') {
    mediaRecorder.value.pause()
    setMicTrackEnabled(false)
    recordingState.value = 'paused'
    stopTimer()
  }
}

// 恢复录屏
const resumeRecording = () => {
  if (mediaRecorder.value && mediaRecorder.value.state === 'paused') {
    setMicTrackEnabled(true)
    mediaRecorder.value.resume()
    recordingState.value = 'recording'
    startTimer()
  }
}

// 切换录屏状态
const toggleRecording = () => {
  if (recordingState.value === 'idle') {
    if (recordedBlob.value && !uploadPopup.uploading) {
      openSaveUploadModal(true)
      return
    }
    clearCanvas()
    startRecording()
    return
  }

  if (recordingState.value === 'recording') {
    pauseRecording()
    return
  }

  if (recordingState.value === 'paused') {
    resumeRecording()
  }
}

// 停止录屏
const stopRecording = (stopStream = true) => {
  if (mediaRecorder.value && (recordingState.value === 'recording' || recordingState.value === 'paused')) {
    setMicTrackEnabled(false)
    mediaRecorder.value.stop()
    recordingState.value = 'idle'
    stopTimer()
    lastRecordDuration.value = recordSeconds.value
    recordSeconds.value = 0

    stopRegionCapture()

    if (stopStream && recordedStream.value) {
      recordedStream.value.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop()
        }
      })
    }

    micStream.value = null
  }
}

// 清空画布
const undoStack = ref<ImageData[]>([])
const saveState = () => {
  if (!canvasRef.value || !canvasContext.value) return
  const w = canvasRef.value.width
  const h = canvasRef.value.height
  // getImageData 可能会因为跨域图片污染画布而失败，需 try-catch
  try {
    const data = canvasContext.value.getImageData(0, 0, w, h)
    undoStack.value.push(data)
    if (undoStack.value.length > 20) undoStack.value.shift()
  } catch (e) {
    console.warn('Canvas tainted, cannot save state for undo', e)
  }
}

const undo = () => {
  if (undoStack.value.length === 0 || !canvasContext.value) return
  const last = undoStack.value.pop()
  if (last) {
    canvasContext.value.putImageData(last, 0, 0)
  }
}

const clearCanvas = () => {
  if (canvasRef.value && canvasContext.value) {
    saveState()
    const c = canvasRef.value
    canvasContext.value.clearRect(0, 0, c.clientWidth || c.width, c.clientHeight || c.height)
    drawBackgroundImage()
  }
}

// 绘制函数
const startDrawing = (e: MouseEvent) => {
  if (currentTool.value === 'text') {
    if (textInput.value.visible) {
      handleTextBlur()
    }
    textInput.value = {
      visible: true,
      x: e.offsetX,
      y: e.offsetY,
      value: '',
      fontSize: brushSize.value * 4 + 12, // Scale font size with brush size
      color: brushColor.value,
    }
    // Focus logic needs to be handled in next tick or watch
    return
  }

  saveState()
  isDrawing.value = true
  ;[lastX.value, lastY.value] = [e.offsetX, e.offsetY]
  lastMidX.value = lastX.value
  lastMidY.value = lastY.value

  if (canvasContext.value) {
    canvasContext.value.strokeStyle = currentTool.value === 'eraser' ? '#162622' : brushColor.value
    canvasContext.value.lineWidth = brushSize.value
    canvasContext.value.lineCap = 'round'
    canvasContext.value.lineJoin = 'round'

    // Save snapshot for shapes（跨域图片会导致 canvas 被污染，getImageData 可能抛错）
    if (['line', 'arrow'].includes(currentTool.value) && canvasRef.value) {
      try {
        snapshot.value = canvasContext.value.getImageData(0, 0, canvasRef.value.width, canvasRef.value.height)
      } catch {
        snapshot.value = null
      }
    }
  }
}

const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
  const angle = Math.atan2(toY - fromY, toX - fromX)

  const headLength = Math.max(18, brushSize.value * 6)
  const headWidth = Math.max(14, brushSize.value * 4)

  const baseX = toX - headLength * Math.cos(angle)
  const baseY = toY - headLength * Math.sin(angle)

  const px = -Math.sin(angle)
  const py = Math.cos(angle)

  const leftX = baseX + (headWidth / 2) * px
  const leftY = baseY + (headWidth / 2) * py
  const rightX = baseX - (headWidth / 2) * px
  const rightY = baseY - (headWidth / 2) * py

  ctx.save()

  // 1) Shaft: a straight line
  ctx.strokeStyle = brushColor.value
  ctx.lineWidth = brushSize.value
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(baseX, baseY)
  ctx.stroke()

  // 2) Head: a filled triangle
  ctx.fillStyle = brushColor.value
  ctx.beginPath()
  ctx.moveTo(toX, toY)
  ctx.lineTo(leftX, leftY)
  ctx.lineTo(rightX, rightY)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

const draw = (e: MouseEvent) => {
  if (!isDrawing.value || !canvasContext.value) return

  if (['line', 'arrow'].includes(currentTool.value)) {
    // Restore snapshot
    if (snapshot.value) {
      canvasContext.value.putImageData(snapshot.value, 0, 0)
    }

    if (currentTool.value === 'line') {
      canvasContext.value.strokeStyle = brushColor.value
      canvasContext.value.lineWidth = brushSize.value
      canvasContext.value.lineCap = 'round'
      canvasContext.value.lineJoin = 'round'

      canvasContext.value.beginPath()
      canvasContext.value.moveTo(lastX.value, lastY.value)
      canvasContext.value.lineTo(e.offsetX, e.offsetY)
      canvasContext.value.stroke()
    } else if (currentTool.value === 'arrow') {
      drawArrow(canvasContext.value, lastX.value, lastY.value, e.offsetX, e.offsetY)
    }
    return
  }

  canvasContext.value.strokeStyle = currentTool.value === 'eraser' ? '#162622' : brushColor.value
  canvasContext.value.lineWidth = brushSize.value
  canvasContext.value.lineCap = 'round'
  canvasContext.value.lineJoin = 'round'

  const midX = (lastX.value + e.offsetX) / 2
  const midY = (lastY.value + e.offsetY) / 2

  canvasContext.value.beginPath()
  canvasContext.value.moveTo(lastMidX.value, lastMidY.value)
  canvasContext.value.quadraticCurveTo(lastX.value, lastY.value, midX, midY)
  canvasContext.value.stroke()

  lastMidX.value = midX
  lastMidY.value = midY
  ;[lastX.value, lastY.value] = [e.offsetX, e.offsetY]
}

const stopDrawing = () => {
  isDrawing.value = false
  snapshot.value = null
  lastMidX.value = 0
  lastMidY.value = 0
}

const handleTextBlur = () => {
  if (textInput.value.visible && textInput.value.value && canvasContext.value) {
    saveState()
    canvasContext.value.font = `${textInput.value.fontSize}px Arial`
    canvasContext.value.fillStyle = textInput.value.color
    canvasContext.value.fillText(textInput.value.value, textInput.value.x, textInput.value.y + textInput.value.fontSize)
  }
  textInput.value.visible = false
}

// 触摸设备支持
const handleTouchStart = (e: TouchEvent) => {
  e.preventDefault()
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  saveState()

  const touch: any = e.touches[0]
  isDrawing.value = true
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top
  ;[lastX.value, lastY.value] = [x, y]
  lastMidX.value = x
  lastMidY.value = y
}
const handleTouchMove = (e: TouchEvent) => {
  e.preventDefault()
  if (!isDrawing.value || !canvasContext.value) return

  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return

  const touch: any = e.touches[0]
  const x = touch.clientX - rect.left
  const y = touch.clientY - rect.top

  canvasContext.value.strokeStyle = currentTool.value === 'eraser' ? '#162622' : brushColor.value
  canvasContext.value.lineWidth = brushSize.value
  canvasContext.value.lineCap = 'round'
  canvasContext.value.lineJoin = 'round'

  const midX = (lastX.value + x) / 2
  const midY = (lastY.value + y) / 2

  canvasContext.value.beginPath()
  canvasContext.value.moveTo(lastMidX.value, lastMidY.value)
  canvasContext.value.quadraticCurveTo(lastX.value, lastY.value, midX, midY)
  canvasContext.value.stroke()

  lastMidX.value = midX
  lastMidY.value = midY
  ;[lastX.value, lastY.value] = [x, y]
}

let canvasResizeObserver: ResizeObserver | null = null
let lastObservedCanvasW = 0
let lastObservedCanvasH = 0

const scheduleCanvasLayoutUpdate = async () => {
  await nextTick()
  await new Promise<void>(r => requestAnimationFrame(() => r()))
  await new Promise<void>(r => requestAnimationFrame(() => r()))
  if (!canvasRef.value || !canvasContext.value) return
  const w = canvasRef.value.clientWidth
  const h = canvasRef.value.clientHeight
  if (!w || !h) return
  if (Math.abs(w - lastObservedCanvasW) < 1 && Math.abs(h - lastObservedCanvasH) < 1) return
  lastObservedCanvasW = w
  lastObservedCanvasH = h
  setCanvasSize()
  if (img && img.complete) drawBackgroundImage()
}

const onWindowResize = () => {
  scheduleCanvasLayoutUpdate()
}

const updateFullscreenStatus = () => {
  isFullscreen.value = !!document.fullscreenElement
  scheduleCanvasLayoutUpdate()
}

const toggleFullscreen = async () => {
  if (isRecordingActive.value) {
    message.warning('录制中，请勿点击全屏')
    return
  }

  try {
    if (!document.fullscreenElement) {
      await screenRecordRef.value?.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
    updateFullscreenStatus()
  } catch (error) {
    console.error('切换全屏模式失败:', error)
    message.error('无法切换全屏模式，请检查浏览器设置。')
  }
}

// 绘制圆角矩形的辅助函数（避免宽高为 0 导致 InvalidStateError）
const drawRoundedImage = (
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  if (!width || !height || width <= 0 || height <= 0) return
  const srcW = (img as HTMLCanvasElement).width ?? (img as HTMLImageElement).naturalWidth
  const srcH = (img as HTMLCanvasElement).height ?? (img as HTMLImageElement).naturalHeight
  if (srcW === 0 || srcH === 0) return

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  ctx.closePath()
  ctx.clip()
  ctx.drawImage(img, x, y, width, height)
  ctx.restore()
}

// 将长文本按最大宽度拆成多行
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = []
  const chars = [...text]
  let line = ''
  for (const char of chars) {
    const next = line + char
    const w = ctx.measureText(next).width
    if (w <= maxWidth) {
      line = next
    } else {
      if (line) lines.push(line)
      line = char
    }
  }
  if (line) lines.push(line)
  return lines
}

// 绘制圆角矩形背景并填文本（试题/答案回显用）
const drawTextBlock = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  lines: string[],
  lineHeight: number,
  padding: number,
  bgColor: string,
  textColor: string,
  radius: number
) => {
  const height = padding * 2 + lines.length * lineHeight
  ctx.save()
  ctx.fillStyle = bgColor
  ctx.beginPath()
  ctx.roundRect(x, y, width, height, radius)
  ctx.fill()
  ctx.fillStyle = textColor
  ctx.font = '14px sans-serif'
  ctx.textBaseline = 'top'
  lines.forEach((line, i) => {
    ctx.fillText(line, x + padding, y + padding + i * lineHeight)
  })
  ctx.restore()
  return height
}

// 高 DPI：设置画布为设备像素比，录屏/导出与录屏区域一致清晰
const setCanvasSize = () => {
  const canvas = canvasRef.value
  const ctx = canvasContext.value
  if (!canvas || !ctx) return

  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  const rect = canvas.getBoundingClientRect()
  const logicalW = Math.max(1, Math.round(rect.width || canvas.clientWidth || 1))
  const logicalH = Math.max(1, Math.round(rect.height || canvas.clientHeight || 1))

  canvas.width = logicalW * dpr
  canvas.height = logicalH * dpr

  canvas.style.width = '100%'
  canvas.style.height = '100%'

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

// 绘制背景：试题 + 答案 回显到 canvas（参考题目在上、答案在下的布局）
const drawBackgroundImage = () => {
  const canvas = canvasRef.value
  const ctx = canvasContext.value
  const topic = currentTopic.value
  if (!canvas || !ctx) return

  const logicalW = canvas.clientWidth || canvas.width
  const logicalH = canvas.clientHeight || canvas.height
  ctx.clearRect(0, 0, logicalW, logicalH)

  const targetWidth = 450
  const x = (logicalW - targetWidth) / 2
  let currentY = 20
  const radius = 18

  // 1. 试题区域：只绘一次，优先题目图，无图再用题目文本（避免题目重复）
  if (img && img.src && img.complete) {
    // 计算最大高度：容器高度 - student-toggle 高度 - 40px
    const containerHeight = canvasRef.value?.clientHeight || 0
    const studentToggle = document.querySelector('.student-toggle') as HTMLElement
    const toggleHeight = studentToggle?.clientHeight || 0
    const maxHeight = Math.max(0, containerHeight - toggleHeight - 40)

    const q = processImage(img, targetWidth, '#FEF3C7', maxHeight)
    // 使用实际图片宽度居中绘制，避免拉伸变形
    const actualWidth = q.canvas.width
    const drawX = (logicalW - actualWidth) / 2
    drawRoundedImage(ctx, q.canvas, drawX, currentY, actualWidth, q.height, radius)
    currentY += q.height + 20
  } else if (topic?.questionContent) {
    ctx.save()
    ctx.font = '14px sans-serif'
    const padding = 16
    const lineHeight = 22
    const maxTextWidth = targetWidth - padding * 2
    const lines = wrapText(ctx, topic.questionContent, maxTextWidth)
    const blockH = drawTextBlock(
      ctx,
      x,
      currentY,
      targetWidth,
      lines,
      lineHeight,
      padding,
      '#FEF3C7',
      '#1f2937',
      radius
    )
    ctx.restore()
    currentY += blockH + 20
  }

  // 2. 答案区域：先绘「答案」文本块，保证答案区始终可见
  const answerStr = (topic?.answerText ?? '').trim()
  if (answerStr) {
    ctx.save()
    ctx.font = '28px sans-serif'
    const padding = 10
    const lineHeight = 36
    const maxTextWidth = 700
    const answerLines = wrapText(ctx, `答案  ${answerStr}`, maxTextWidth)
    const blockH = drawTextBlock(
      ctx,
      x,
      currentY,
      targetWidth,
      answerLines,
      lineHeight,
      padding,
      'transparent',
      '#FEF3C7',
      radius
    )
    ctx.restore()
    currentY += blockH + 20
  } else {
    // 无 answer 时仅显示答案区占位，不展示答案图片
    ctx.save()
    ctx.font = '20px sans-serif'
    const padding = 10
    const lineHeight = 28
    const maxTextWidth = targetWidth - padding * 2
    const answerLines = wrapText(ctx, '答案 -', maxTextWidth)
    drawTextBlock(ctx, x, currentY, targetWidth, answerLines, lineHeight, padding, 'transparent', '#FEF3C7', radius)
    ctx.restore()
  }
}

// 加载当前题目的动态题目图与答案图
function loadCurrentTopicImages() {
  const topic = currentTopic.value
  if (img) {
    img.crossOrigin = 'anonymous'
    img.src = topic?.url ?? ''
  }
  if (imgAnswer) {
    imgAnswer.crossOrigin = 'anonymous'
    imgAnswer.src = topic?.answerUrl ?? ''
  }
}

// 组件挂载时初始化
onMounted(async () => {
  document.addEventListener('fullscreenchange', updateFullscreenStatus)
  window.addEventListener('resize', onWindowResize)
  updateFullscreenStatus()

  if (typeof ResizeObserver !== 'undefined') {
    await nextTick()
    const el = screenRecordRef.value
    if (el) {
      canvasResizeObserver?.disconnect()
      canvasResizeObserver = new ResizeObserver(() => {
        scheduleCanvasLayoutUpdate()
      })
      canvasResizeObserver.observe(el)
    }
  }

  await fetchClassHomeworkDetail()
  // 保持 fetch 里根据 topicIndex 选中的题目，不覆盖为第一题，实现「从哪题点进去就展示哪题」的联动

  // 加载背景图片（使用接口返回的 questionImage / 学生答案图）
  img = new Image()
  imgAnswer = new Image()
  img.crossOrigin = 'anonymous'
  imgAnswer.crossOrigin = 'anonymous'

  const redraw = () => {
    if (canvasRef.value && canvasContext.value) {
      drawBackgroundImage()
    }
  }
  img.onload = redraw
  imgAnswer.onload = redraw

  loadCurrentTopicImages()

  if (canvasRef.value) {
    canvasContext.value = canvasRef.value.getContext('2d')

    if (canvasContext.value) {
      // 设置初始画布样式
      canvasContext.value.lineJoin = 'round'
      canvasContext.value.lineCap = 'round'
      canvasContext.value.strokeStyle = brushColor.value
      canvasContext.value.lineWidth = brushSize.value

      nextTick(() => {
        setCanvasSize()
        if (img.complete) drawBackgroundImage()
      })
    }

    // 添加事件监听
    const canvas = canvasRef.value
    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDrawing)
    canvas.addEventListener('mouseout', stopDrawing)

    // 触摸设备支持
    canvas.addEventListener('touchstart', handleTouchStart)
    canvas.addEventListener('touchmove', handleTouchMove)
    canvas.addEventListener('touchend', stopDrawing)
  }
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', updateFullscreenStatus)
  window.removeEventListener('resize', onWindowResize)
  if (canvasResizeObserver) {
    canvasResizeObserver.disconnect()
    canvasResizeObserver = null
  }
  if (topicListRef.value) {
    topicListRef.value.removeEventListener('scroll', updateTopicListAtBottom)
  }
  if (canvasRef.value) {
    const canvas = canvasRef.value
    canvas.removeEventListener('mousedown', startDrawing)
    canvas.removeEventListener('mousemove', draw)
    canvas.removeEventListener('mouseup', stopDrawing)
    canvas.removeEventListener('mouseout', stopDrawing)
    canvas.removeEventListener('touchstart', handleTouchStart)
    canvas.removeEventListener('touchmove', handleTouchMove)
    canvas.removeEventListener('touchend', stopDrawing)
  }
})
</script>

<style scoped lang="scss">
.screen-record {
  overflow: hidden;

  .canvas-topic {
    position: absolute;
    right: 18px;
    top: 50%;
    z-index: 10;
    transform: translateY(-50%);
    padding: 22px 7px 0;
    // overflow: hidden;

    &::-webkit-scrollbar {
      display: none;
    }

    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      height: 58px;
      pointer-events: none;
      z-index: 2;
      bottom: 0;
      background: linear-gradient(to top, rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0));
      opacity: 1;
      transition: opacity 0.18s ease;
      border-radius: 0 0 31px 31px;
    }

    &.is-topic-bottom::after {
      opacity: 0;
    }

    .topic-title {
      flex-shrink: 0;
      font-size: 13px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.85);
      margin: 0;
      margin-bottom: 8px;
      padding: 0 4px 4px;
      white-space: nowrap;
      text-align: center;
    }

    .topic-list {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      min-height: 0;
      position: relative;
      overflow-y: auto;
      max-height: 330px;
      margin-top: 4px;
      padding: 5px;
      gap: 8px;
      scrollbar-width: none;
      -ms-overflow-style: none;

      &::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none;
      }

      .topic-item {
        width: 48px;
        height: 48px;
        margin: 0;
        border-radius: 50%;
        text-align: center;
        line-height: 48px;
        color: rgba(255, 255, 255, 0.6);
        background: rgba(255, 255, 255, 0.05);
        font-weight: 600;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        border: 1px solid transparent;

        &:hover {
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.2);
        }
      }

      .active-item {
        background: var(--color-primary);
        color: var(--color-white);
        position: relative;
        border: none;
        box-shadow: none;

        &::after {
          content: '';
          position: absolute;
          top: -5px;
          left: -5px;
          right: -5px;
          bottom: -5px;
          border-radius: 50%;
          border: 2px solid var(--color-primary);
          opacity: 0.6;
        }

        &:hover {
          background: var(--color-primary);
          transform: none;
        }
      }
    }
  }

  .canvas-box {
    width: 100%;
    height: 100%;
    position: relative;

    .drawing-canvas {
      background-color: #162622;
      background-image:
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
      background-size: 48px 48px;
      display: block;
      margin: 0 auto;
    }

    .student-toggle {
      position: absolute;
      left: 50%;
      bottom: 20px;
      transform: translateX(-50%);
      height: 48px;
      padding: 10px 24px;
      border-radius: 20px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background-color: rgba(22, 38, 34, 0.8);

      &:hover {
        background: rgba(40, 40, 40, 0.4);
        transform: translateX(-50%) translateY(-2px);
      }
    }

    .student-badge {
      background: var(--color-error);
      color: white;
      border-radius: 10px;
      padding: 0 6px;
      font-size: 12px;
      height: 18px;
      line-height: 18px;
      min-width: 18px;
      text-align: center;
    }

    .canvas-answer {
      width: min(520px, calc(100% - 64px));
      height: auto;
      max-height: 400px;
      position: absolute;
      bottom: 80px; /* Above toolbar */
      left: 50%;
      transform: translateX(-50%);
      padding: 24px;
      border-radius: 24px;
      box-sizing: border-box;
      z-index: 10;
      background: rgba(22, 38, 34, 0.8);

      .answer-header {
        margin-bottom: 20px;
        .title {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-primary);
          position: relative;
          padding-bottom: 10px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);

          &::after {
            content: '';
            position: absolute;
            left: 0;
            bottom: -2px;
            width: 32px;
            height: 2px;
            background: var(--color-primary);
            border-radius: 1px;
          }
        }
      }
    }
  }

  .bottom-toolbar {
    position: absolute;
    bottom: 78px;
    left: 50%;
    transform: translateX(-50%);
    height: 60px;
    background: rgba(30, 30, 30, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 30px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    backdrop-filter: blur(20px);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    width: 140px; /* Initial width for "工具栏" label */
    overflow: hidden;
    cursor: pointer;
    z-index: 20;

    &:hover {
      width: auto;
      min-width: 800px; /* Expand to fit content */
      background: rgba(30, 30, 30, 0.6);

      .toolbar-trigger {
        display: none;
      }

      .toolbar-content {
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
        width: 100%;
      }
    }

    .toolbar-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      height: 100%;
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;

      .trigger-icon {
        font-size: 20px;
      }
    }

    .toolbar-content {
      display: flex;
      align-items: center;
      gap: 20px;
      opacity: 0;
      transform: translateX(20px);
      transition: all 0.3s ease;
      pointer-events: none;
      width: 0; /* Initially hidden */
      overflow: hidden;
    }

    .divider {
      width: 1px;
      height: 24px;
      background: rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
    }

    .tool-group,
    .color-group,
    .action-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .tool-btn {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.6);
      font-size: 20px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
      }

      &.active {
        color: #333;
        background: var(--color-white);
      }
    }

    .size-slider {
      display: flex;
      align-items: center;
      gap: 10px;
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
      font-weight: 700;
      width: 180px;

      .custom-slider {
        flex: 1;

        :deep(.ant-slider-rail) {
          background-color: red !important;
        }
        :deep(.ant-slider-track) {
          background-color: #fff;
        }
        :deep(.ant-slider-handle) {
          border-color: #fff;
        }
      }
    }

    .color-btn {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s;

      &.active {
        transform: scale(1.2);
        border-color: #fff;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      }
    }

    .color-picker-btn {
      font-size: 18px;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;

      .color-input {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
      }
    }
  }

  .canvas-controls {
    position: absolute;
    left: 18px;
    top: 50%;
    z-index: 10;
    transform: translateY(-50%);
    height: auto;
    gap: 16px;
    padding: 16px 4px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;

    .control-top {
      width: 100%;
    }

    .divider {
      width: 24px;
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
    }

    .ctrl-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      gap: 6px;
      padding: 0 3px 3px;
      cursor: pointer;
      border-radius: 12px;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      &.no-hover {
        &:hover {
          background: transparent;
          color: inherit;
        }
      }
    }

    .ctrl-label {
      font-size: 12px;
      line-height: 1;
      color: rgba(255, 255, 255, 0.55);
      user-select: none;
      pointer-events: none;
    }

    .ctrl-label.record {
      color: var(--color-ant-red);
      font-weight: 700;
    }

    .control-bottom {
      display: flex;
      flex-direction: column;
      gap: 16px;
      align-items: center;
      width: 100%;
    }

    .tool-trigger {
      &.active {
        .ctrl-item {
          background: rgba(255, 255, 255, 0.1);
        }

        .tool-popover {
          opacity: 1;
          pointer-events: auto;
        }
      }

      .tool-popover {
        position: absolute;
        left: 130%; /* Position to the left of the button */
        top: 30%;
        transform: translateY(-45%) translateX(0) scale(1);
        opacity: 0;
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 16px 12px;
        width: max-content;

        &::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          right: -20px; /* Bridge the gap */
          width: 20px;
        }

        .tool-group,
        .action-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .color-group {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 8px;
          justify-items: center;
        }

        .tool-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.6);
          font-size: 18px;
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.1);
          }

          &.active {
            color: #333;
            background: #fff;
          }
        }

        .size-slider-vertical {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: rgba(255, 255, 255, 0.5);
          font-size: 10px;
          font-weight: 700;
          height: 120px;

          .custom-slider {
            flex: 1;

            :deep(.ant-slider-rail) {
              background-color: rgba(255, 255, 255, 0.2);
            }

            :deep(.ant-slider-track) {
              background-color: #fff;
            }
            :deep(.ant-slider-handle) {
              border-color: #fff;
            }
          }
        }

        .color-btn {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.2s;

          &.active {
            transform: scale(1.2);
            border-color: var(--color-white);
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
          }
        }

        .color-picker-btn {
          font-size: 16px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;

          .color-input {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            opacity: 0;
            cursor: pointer;
          }
        }
      }
    }

    .ctrl-btn {
      width: 100%;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.6);
      font-size: 20px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .control-center {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .record-group {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .record-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-ant-red);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(245, 34, 45, 0.4);
      transition: all 0.2s;

      .inner-icon {
        color: var(--color-white);
        font-size: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .record-dot {
        width: 12px;
        height: 12px;
        background: var(--color-white);
        border-radius: 2px; /* Square-ish */
      }

      &:hover {
        transform: scale(1.1);
      }

      &.recording {
        .inner-icon {
          font-size: 20px;
        }
      }
    }

    .timer {
      font-size: 12px;
      color: var(--color-ant-red);
      font-weight: 600;
    }

    .stop-btn {
      color: rgba(255, 255, 255, 0.6);
      &:hover {
        color: var(--color-ant-red);
      }
    }
  }

  .bottom-status-left {
    position: absolute;
    left: 20px;
    bottom: 20px;

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      color: rgba(255, 255, 255, 0.8);
      font-size: 12px;

      .dot {
        width: 8px;
        height: 8px;
        background: #f5222d;
        border-radius: 50%;
        animation: pulse 2s infinite ease-in-out;
      }
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.3);
      opacity: 0.7;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .bottom-status-right {
    position: absolute;
    right: 20px;
    top: 20px;

    .fullscreen-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      color: #fa8c16;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      padding: 8px 16px;

      .fs-icon {
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
}

:global(.answer-popover) {
  z-index: 10;
}

:global(.answer-popover .ant-popover-inner-content) {
  padding: 0;
}

.popover-image-box {
  position: relative;
  width: 300px;
  cursor: zoom-in;
  border-radius: 4px;
  overflow: hidden;

  img {
    width: 100%;
    height: auto;
    display: block;
  }

  .click-hint {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.6);
    color: #fff;
    font-size: 12px;
    text-align: center;
    padding: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover .click-hint {
    opacity: 1;
  }
}

.frosted-glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: var(--tw-shadow);
  padding: 24px 12px;
  border-radius: 999px;
}

/* 全屏状态下样式 */
.screen-record:fullscreen {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  border-radius: 0;
}

.screen-record:not(:fullscreen) .canvas-box {
  background-color: #162622;
}

.sr-ctrl-btn {
  border: none;
  background: transparent;
  padding: 0;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
}

.screen-record:not(:fullscreen) .canvas-box {
  background-color: #162622;
}

/* 区域录屏 overlay：屏幕变暗 + 自由选区 + 边缘调整点 */
.region-record-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.region-overlay-hint {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.95);
  font-size: 14px;
  border-radius: 8px;
  white-space: nowrap;
  z-index: 1;
}

.region-record-preview {
  position: relative;
  max-width: 90vw;
  max-height: 70vh;
  width: 100%;
  aspect-ratio: 16 / 10;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.region-preview-video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.region-select-layer {
  position: absolute;
  inset: 0;
  cursor: crosshair;
}

/* 选区层铺满视口，选区坐标为视口坐标，用于本页截图画布录制 */
.region-select-layer-full {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  cursor: crosshair;
}

.region-selection-box {
  position: absolute;
  border: 2px solid var(--color-primary, #1890ff);
  background: rgba(24, 144, 255, 0.15);
  box-sizing: border-box;
  pointer-events: none;

  .region-tip {
    position: absolute;
    bottom: 100%;
    left: 0;
    margin-bottom: 4px;
    padding: 2px 8px;
    background: var(--color-primary, #1890ff);
    color: #fff;
    font-size: 12px;
    white-space: nowrap;
    border-radius: 4px;
  }

  .region-tip-adjust {
    white-space: nowrap;
  }
}

/* 选区边缘 8 个调整点，便于精确对齐窗口边界 */
.region-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #fff;
  border: 1px solid var(--color-primary, #1890ff);
  border-radius: 2px;
  cursor: pointer;
  z-index: 2;
  box-sizing: border-box;
  pointer-events: auto;
}

.region-handle.nw {
  left: -5px;
  top: -5px;
  cursor: nwse-resize;
}
.region-handle.n {
  left: 50%;
  top: -5px;
  margin-left: -5px;
  cursor: ns-resize;
}
.region-handle.ne {
  right: -5px;
  top: -5px;
  left: auto;
  cursor: nesw-resize;
}
.region-handle.e {
  right: -5px;
  top: 50%;
  margin-top: -5px;
  left: auto;
  cursor: ew-resize;
}
.region-handle.se {
  right: -5px;
  bottom: -5px;
  left: auto;
  top: auto;
  cursor: nwse-resize;
}
.region-handle.s {
  left: 50%;
  bottom: -5px;
  margin-left: -5px;
  top: auto;
  cursor: ns-resize;
}
.region-handle.sw {
  left: -5px;
  bottom: -5px;
  top: auto;
  cursor: nesw-resize;
}
.region-handle.w {
  left: -5px;
  top: 50%;
  margin-top: -5px;
  cursor: ew-resize;
}

.region-record-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.sr-save-upload {
  padding-top: 6px;

  .sr-save-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sr-tips {
    background-color: rgb(255 247 237);
    border: 1px solid rgb(255 237 213);
    border-radius: 8px;
    margin-top: 10px;
    padding: 10px;
    color: rgb(154 52 18);
    font-size: 12px;
    p {
      margin: 0;
    }
  }

  .sr-save-label {
    width: 72px;
    flex: 0 0 72px;
    color: rgba(17, 24, 39, 0.85);
    font-weight: 700;
  }
}

.sr-upload-popup {
  position: fixed;
  top: 18px;
  right: 18px;
  width: 340px;
  background: #fff;
  border-radius: 18px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.14);
  padding: 18px;
  z-index: 9999;

  .up-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
  }

  .up-title {
    font-size: 16px;
    font-weight: 700;
    color: rgba(17, 24, 39, 0.9);
  }

  .up-close {
    border: none;
    background: transparent;
    color: rgba(17, 24, 39, 0.35);
    cursor: pointer;
    padding: 4px;
  }

  .up-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    color: rgba(17, 24, 39, 0.55);
    margin-bottom: 10px;
  }

  .up-pct {
    font-size: 18px;
    font-weight: 700;
    color: #e67e22;
  }

  .up-bar {
    height: 8px;
    background: rgba(17, 24, 39, 0.08);
    border-radius: 99px;
    overflow: hidden;
  }

  .up-fill {
    height: 100%;
    background: #e67e22;
    width: 0;
    transition: width 180ms ease;
  }

  .up-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
  }

  .up-stats {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: rgba(17, 24, 39, 0.6);
  }

  .stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 99px;
    display: inline-block;
  }

  .ok .dot {
    background: #2ecc71;
  }

  .bad .dot {
    background: #e74c3c;
  }

  .up-retry {
    height: 34px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid rgba(230, 126, 34, 0.35);
    background: rgba(230, 126, 34, 0.08);
    color: #e67e22;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }

  .up-view {
    height: 34px;
    padding: 0 14px;
    border-radius: 10px;
    font-size: 14px;
    border: 1px solid rgba(46, 204, 113, 0.35);
    background: rgba(46, 204, 113, 0.08);
    color: #27ae60;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;

    &:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }
  }
}

.sr-popup-slide-enter-active,
.sr-popup-slide-leave-active {
  transition: all 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sr-popup-slide-enter-from,
.sr-popup-slide-leave-to {
  transform: translateY(14px);
  opacity: 0;
}
</style>
