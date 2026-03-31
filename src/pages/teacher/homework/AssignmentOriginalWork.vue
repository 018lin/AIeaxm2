<template>
  <div class="tch-detail-page">
    <!-- 顶部详情头部：返回按钮 + Tab 切换 -->
    <TchDetailHeader :header="header" :tabs="tabs" :active-key="activeTabKey" @back="goBack" @navigate="goTab" />

    <div class="tch-ow-actions flex-between gap-12">
      <div class="left">
        <div class="meta flex items-center gap-8 text-secondary text-12">
          <Icon icon="solar:book-bold-duotone" width="16" />
          <span>{{ header.subject }} {{ header.gradeClass }}</span>
          <span class="sep opacity-60">|</span>
          <Icon icon="solar:document-bold-duotone" width="16" />
          <span class="paper bold text-primary">{{ header.paperName }}</span>
        </div>
      </div>
      <div class="right flex items-center gap-10">
        <a-button
          type="primary"
          class="tch-ow-act inline-flex items-center gap-8 h-34 rounded-12"
          @click="downloadOriginal"
        >
          <Icon icon="solar:download-minimalistic-bold-duotone" width="16" />
          原卷留痕
        </a-button>
      </div>
    </div>

    <div class="tch-ow-body grid gap-16 flex-1 min-h-0">
      <!-- 左侧：学生列表（按提交状态分组） -->
      <aside class="tch-ow-left app-surface flex-col gap-10 rounded-18 p-12 min-h-0">
        <div ref="stuListRef" class="tch-ow-stu-list flex-col gap-14 flex-1 min-h-0 overflow-auto">
          <div
            v-for="sec in groupSections"
            :key="sec.key"
            :ref="setGroupAnchor(sec.key)"
            class="tch-ow-stu-group flex-col gap-10"
          >
            <div class="tch-ow-stu-group-title bold text-secondary text-12 px-2 opacity-80">{{ sec.title }}</div>

            <button
              v-for="stu in sec.items"
              :key="stu.key"
              type="button"
              class="tch-ow-stu-item flex-between items-center border-primary gap-10 cursor-pointer rounded-md p-10 bg-card w-full"
              :class="{ active: stu.key === selectedStudentKey, disabled: stu.group === 'unsubmitted' }"
              @click="selectStudent(stu.key)"
            >
              <div class="main flex-col gap-2">
                <div class="name bold text-primary text-13">{{ stu.name || '未知' }}</div>
                <div class="no text-muted text-12">{{ stu.studentNo || '未知' }}</div>
              </div>

              <div class="flex gap-xs">
                <span v-if="stu.isLack" class="badge bold rounded-full text-12 px-10 py-2 min-w-52 text-center is-red">
                  缺页
                </span>
                <span
                  class="badge bold rounded-full text-12 px-10 py-2 min-w-52 text-center"
                  :class="badgeClass(stu.group)"
                  >{{ stu.badge }}</span
                >
              </div>
            </button>
          </div>
        </div>

        <!-- 底部统计区：按状态展示学生数量，并支持点击快速跳转到对应分组 -->
        <div class="tch-ow-stats grid gap-8 pt-10 border-t-light">
          <button
            v-for="stat in groupStats"
            :key="stat.key"
            type="button"
            class="row flex-between p-10 items-center rounded-md text-xs bold cursor-pointer w-full"
            :class="stat.className"
            @click="scrollToGroup(stat.key)"
          >
            <span class="label">{{ stat.label }}</span>
            <span class="val"
              >{{ stat.count }}
              {{ stat.label == '异常' ? '张' : '人' }}
            </span>
          </button>
        </div>
      </aside>

      <!-- 中间：原作业预览区域 + 校正学号按钮 -->
      <main class="tch-ow-center app-surface flex-col items-center gap-16 rounded-18 p-16 bg-surface min-h-0">
        <div v-if="originalDetailLoading" class="tch-ow-loading flex-center flex-1 w-full text-secondary text-14">
          <a-spin size="large" />
          <span class="ml-8">加载原作业中...</span>
        </div>
        <div
          v-else-if="!selectedStudent"
          class="tch-ow-empty flex-center flex-col flex-1 w-full text-secondary text-14 gap-8"
        >
          <Icon icon="solar:users-group-rounded-bold-duotone" width="48" class="opacity-50" />
          <span>暂无学生名单，或请从左侧选择学生</span>
        </div>
        <div
          v-else-if="selectedStudent && !originalFirstDetail?.attachmentUrl && !currentImg"
          class="tch-ow-empty flex-center flex-col flex-1 w-full text-secondary text-14 gap-8"
        >
          <Icon icon="solar:document-text-bold-duotone" width="48" class="opacity-50" />
          <span>该学生暂无原作业图片</span>
        </div>
        <div v-else class="tch-ow-paper-area">
          <div class="tch-ow-paper-wrap">
            <OriginalWorkPaper
              ref="paperRef"
              :original-details="originalDetails"
              :fallback-img="currentImg"
              previewable
            />
          </div>
        </div>

        <div class="flex gap-10 flex-wrap justify-center">
          <button
            v-for="p in paperRef?.paperVisiblePages || []"
            :key="p.index"
            type="button"
            class="tch-ow-fix inline-flex-center bold primary-btn"
            @click="openFixModal(p.index)"
          >
            <Icon icon="solar:pen-bold-duotone" width="16" />
            校正学号（第{{ p.index + 1 }}页）
          </button>
        </div>
      </main>

      <!-- 学号校正弹窗 -->
      <a-modal
        v-model:open="fixModalOpen"
        title="校正学号"
        ok-text="确定"
        cancel-text="取消"
        :width="560"
        wrap-class-name="tch-ow-fix-modal"
        @ok="saveFix"
      >
        <div class="tch-fix-modal">
          <!-- 关联学生：单行选择，突出当前学生信息 -->
          <div class="tch-fix-block">
            <div class="tch-fix-label">关联学生</div>
            <a-select
              v-model:value="fixForm.associateKey"
              :options="associateOptions"
              placeholder="请选择学生"
              class="tch-fix-stu-select"
              @change="onAssociateChange"
            />
          </div>

          <!-- 学号错误原因分析，仅展示不可点击 -->
          <div class="tch-fix-block">
            <div class="tch-fix-label">学号错误原因分析</div>
            <div class="tch-fix-reason-cards">
              <div v-for="r in fixReasonOptions" :key="r.value" class="reason-card relative flex gap-sm">
                <div class="reason-content">
                  <div class="reason-title">{{ r.label }}</div>
                  <div class="reason-desc">{{ r.desc }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </a-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { associateStudentHomework, getStudentHomeworkStudentList } from '@/api/common'
import type { HomeworkStudentListItem } from '@/api/common/type'
import { getOriginalDetail } from '@/api/homework/index'
import TchDetailHeader from '@/components/common/TchDetailHeader.vue'
import OriginalWorkPaper from '@/components/homework/OriginalWorkPaper.vue'
import { ROUTES } from '@/router/routes'
import type {
  DetailTab,
  FixStudentIdForm,
  OriginalWorkData,
  OriginalWorkRow,
  StuGroupKey,
  StuGroupSection,
  StuItem,
  TabKey,
} from '@/types/homework'
import { decrypt } from '@/utils/crypto'
import { downloadOriginalWorkAsPdf } from '@/utils/downloadHelper'
import { Icon } from '@iconify/vue'
import { Modal, message } from 'ant-design-vue'
import type { ComponentPublicInstance } from 'vue'
import { computed, nextTick, reactive, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 路由参数中的作业 ID（加密），优先解码后再解密
const routeAssignmentId = computed(() => String(route.params.id || ''))
const assignmentId = computed(() => {
  const raw = routeAssignmentId.value
  if (!raw) return ''
  try {
    return decrypt(decodeURIComponent(raw))
  } catch {
    return decrypt(raw)
  }
})

// 当前班级 ID（从路由参数或本地缓存中解析）
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

const groupAnchorEls = ref<Record<StuGroupKey, HTMLElement | null>>({
  submitted: null,
  abnormal: null,
  unsubmitted: null,
})

const setGroupAnchor = (key: StuGroupKey) => (el: Element | ComponentPublicInstance | null) => {
  groupAnchorEls.value[key] = (el as HTMLElement) || null
}

const scrollToGroup = (key: StuGroupKey) => {
  const el = groupAnchorEls.value[key]
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const owData = ref<OriginalWorkData>({
  submitted: [],
  abnormal: [],
  unsubmitted: [],
})

const pickList = (res: Record<string, any> | null | undefined, keys: string[]): HomeworkStudentListItem[] => {
  if (!res || typeof res !== 'object') return []
  for (const k of keys) {
    const v = (res as any)[k]
    if (Array.isArray(v)) return v
  }
  if (Array.isArray((res as any).key)) return (res as any).key
  return []
}

const toRow = (s: HomeworkStudentListItem): OriginalWorkRow | null => {
  const homeworkIds = Array.isArray((s as any)?.homeworkIds)
    ? (s as any).homeworkIds.map((v: any) => String(v ?? '').trim()).filter(Boolean)
    : []

  const idRaw = (s as any)?.studentUserId
  const studentUserId = idRaw == null ? '' : String(idRaw).trim()
  // 对于 abnormal 数据，studentUserId 为 null，使用 homeworkIds[0] 作为唯一标识
  const id = studentUserId || (homeworkIds[0] ? `hw_${homeworkIds[0]}` : '')
  if (!id) return null

  const nameRaw = String((s as any)?.studentName ?? '').trim()
  const noRaw = String((s as any)?.studentCode ?? '').trim()

  return {
    id,
    name: nameRaw || '未知',
    img: '',
    studentNo: noRaw || '未知',
    homeworkIds,
    isLack: Boolean((s as any)?.isLack),
  }
}

const fetchStudentList = async () => {
  const aid = String(assignmentId.value || '')
  const cid = String(classId.value || '')
  if (!aid || !cid) return

  try {
    const res = (await getStudentHomeworkStudentList({ assignmentId: aid, classId: cid })) as any

    const submitted = pickList(res, ['submitted', 'completed', 'submitList', 'submittedList'])
      .map(toRow)
      .filter(Boolean) as OriginalWorkRow[]

    const abnormal = pickList(res, ['abnormal', 'abnormalList']).map(toRow).filter(Boolean) as OriginalWorkRow[]

    const unsubmitted = pickList(res, ['unsubmitted', 'uncompleted', 'unsubmitList', 'unsubmittedList'])
      .map(toRow)
      .filter(Boolean) as OriginalWorkRow[]

    if (submitted.length || unsubmitted.length || abnormal.length) {
      owData.value = {
        submitted,
        abnormal,
        unsubmitted,
      }
    }
  } catch {
    // ignore
  }
}

watch(
  [assignmentId, classId],
  ([aid, cid]) => {
    if (!aid || !cid) return
    fetchStudentList()
  },
  { immediate: true }
)

// 根据分组返回徽标文案
const badgeOf = (g: StuGroupKey) => (g === 'abnormal' ? '异常' : g === 'submitted' ? '已提交' : '未提交')

// 根据分组返回徽标样式类名
const badgeClass = (g: StuGroupKey) => (g === 'abnormal' ? 'is-red' : g === 'submitted' ? 'is-green' : 'is-blue')

// 所有学生列表，按分组扁平化，方便后续筛选与查找
const allStudents = computed<StuItem[]>(() => {
  const data = owData.value
  const mk = (group: StuGroupKey, rows: OriginalWorkRow[]) =>
    (rows || []).map(r => ({
      key: `${group}:${r.id}`,
      group,
      rawId: r.id,
      name: String(r.name || ''),
      img: String(r.img || ''),
      studentNo: String(r.studentNo || ''),
      homeworkIds: Array.isArray(r.homeworkIds) ? r.homeworkIds : [],
      badge: badgeOf(group),
      isLack: Boolean((r as any)?.isLack),
    }))

  return [...mk('submitted', data.submitted), ...mk('abnormal', data.abnormal), ...mk('unsubmitted', data.unsubmitted)]
})

// 按状态分组后的学生列表（左侧列表和底部统计共用）
const studentsByGroup = computed<Record<StuGroupKey, StuItem[]>>(() => ({
  submitted: allStudents.value.filter(s => s.group === 'submitted'),
  abnormal: allStudents.value.filter(s => s.group === 'abnormal'),
  unsubmitted: allStudents.value.filter(s => s.group === 'unsubmitted'),
}))

const groupSections = computed<StuGroupSection[]>(() => [
  {
    key: 'submitted',
    title: `已提交（${studentsByGroup.value.submitted.length}人）`,
    items: studentsByGroup.value.submitted,
  },
  {
    key: 'abnormal',
    title: `异常（${studentsByGroup.value.abnormal.length}张）`,
    items: studentsByGroup.value.abnormal,
  },
  {
    key: 'unsubmitted',
    title: `未提交（${studentsByGroup.value.unsubmitted.length}人）`,
    items: studentsByGroup.value.unsubmitted,
  },
])

const orderedStudents = computed(() => groupSections.value.flatMap(s => s.items))

const selectedStudentKey = ref<string>('')

// 默认选中第一个同学（含未提交），以便默认拉取原作业；点击列表可切换
watchEffect(() => {
  const list = orderedStudents.value
  if (!Array.isArray(list) || list.length === 0) {
    selectedStudentKey.value = ''
    return
  }
  if (!selectedStudentKey.value || !list.some(s => s.key === selectedStudentKey.value)) {
    selectedStudentKey.value = list[0]?.key || ''
  }
})

const selectedStudent = computed(() => orderedStudents.value.find(s => s.key === selectedStudentKey.value) || null)
const selectedStudentId = computed(() => {
  if (selectedStudent.value?.group === 'unsubmitted') return ''
  const rawId = String(selectedStudent.value?.rawId || '')
  // abnormal 数据使用 hw_xxx 格式的 ID，不是有效的 studentUserId，返回空让它用 homeworkId 获取
  if (rawId.startsWith('hw_')) return ''
  return rawId
})
const currentImg = computed(() =>
  selectedStudent.value?.group === 'unsubmitted' ? '' : String(selectedStudent.value?.img || '')
)

// 原作业详情：接口按 assignmentId + studentUserId 返回多页（数组），页数 = data.length
const originalDetails = ref<import('@/api/homework/type').OriginalDetailVO[]>([])
const originalFirstDetail = computed(() => originalDetails.value[0] || null)
const originalDetailLoading = ref(false)

// 原作业组件引用
const paperRef = ref<InstanceType<typeof OriginalWorkPaper> | null>(null)

watch(
  () => selectedStudentKey.value,
  () => {
    originalDetails.value = []
  }
)

const parseAssignmentPage = (detail: any): number => {
  const raw = String(detail?.qrcodeContent || '').trim()
  if (raw) {
    try {
      const obj = JSON.parse(raw) as any
      const n = Number(obj?.assignmentPage)
      if (Number.isFinite(n)) return n
    } catch {}
  }
  const fileName = String(detail?.fileName || '')
  const m = fileName.match(/_(\d+)\.(jpg|jpeg|png|webp|bmp|gif)$/i)
  if (m?.[1]) return Number(m[1]) || 0
  return 0
}

async function fetchOriginalDetail(aid: string, sid: string, homeworkId?: string) {
  originalDetails.value = []
  originalDetailLoading.value = true
  try {
    const studentUserId = String(sid || '').trim()
    const assignmentIdStr = String(aid || '').trim()
    const homeworkIdStr = String(homeworkId || '').trim()

    const tryByAidSid = async () => {
      if (!studentUserId || !assignmentIdStr) return [] as any[]
      const res = await getOriginalDetail({ assignmentId: assignmentIdStr, studentUserId })
      return (Array.isArray(res) ? res : [res]).filter(Boolean) as any[]
    }

    const tryByHomeworkId = async () => {
      if (!homeworkIdStr) return [] as any[]
      const res = await getOriginalDetail({ homeworkId: homeworkIdStr })
      return (Array.isArray(res) ? res : [res]).filter(Boolean) as any[]
    }

    // 如果没有 studentUserId，直接用 homeworkId 获取
    let list = studentUserId ? await tryByAidSid() : []

    if (!list.length && homeworkIdStr) list = await tryByHomeworkId()

    list.sort((a, b) => parseAssignmentPage(a) - parseAssignmentPage(b))
    originalDetails.value = list as import('@/api/homework/type').OriginalDetailVO[]
  } catch {
    originalDetails.value = []
  } finally {
    originalDetailLoading.value = false
  }
}

watch(
  [assignmentId, selectedStudentId, selectedStudentKey],
  ([aid, sid]) => {
    const fallbackHomeworkId =
      Array.isArray(selectedStudent.value?.homeworkIds) && selectedStudent.value?.homeworkIds?.[0]
        ? String(selectedStudent.value?.homeworkIds?.[0] || '')
        : ''

    // 对于 abnormal 数据，sid 为空，但有 homeworkId
    if (!aid || (!sid && !fallbackHomeworkId)) {
      originalDetails.value = []
      return
    }

    fetchOriginalDetail(String(aid || ''), String(sid || ''), fallbackHomeworkId)
  },
  { immediate: true }
)

const selectStudent = (key: string) => {
  const it = orderedStudents.value.find(s => s.key === key)
  if (it?.group === 'unsubmitted') return
  selectedStudentKey.value = key
}

// 底部统计：各状态对应的学生数量
const statSubmitted = computed(() => owData.value.submitted.length)
const statAbnormal = computed(() => owData.value.abnormal.length)
const statUnsubmitted = computed(() => owData.value.unsubmitted.length)

// 底部统计按钮配置，模板中通过 v-for 渲染
const groupStats = computed(() => [
  { key: 'submitted' as StuGroupKey, label: '已提交', count: statSubmitted.value, className: 'is-green' },
  { key: 'abnormal' as StuGroupKey, label: '异常', count: statAbnormal.value, className: 'is-red' },
  { key: 'unsubmitted' as StuGroupKey, label: '未提交', count: statUnsubmitted.value, className: 'is-blue' },
])

const fixReasonOptions: import('@/types/homework').FixReasonOption[] = [
  {
    value: 'correct_but_ocr_wrong',
    label: '系统识别错误',
    desc: '书写正确且规范，但识别结果不准确',
  },
  {
    value: 'wrong_student_no',
    label: '写错学号',
    desc: '学生本人在作答纸上填写的学号有误',
  },
  {
    value: 'handwriting',
    label: '字迹潦草',
    desc: '笔画不清晰或重叠导致识别困难',
  },
  {
    value: 'position_or_context',
    label: '填写不规范',
    desc: '位置偏移或受周围文字干扰',
  },
]

const fixModalOpen = ref(false)
const fixForm = reactive<FixStudentIdForm>({
  search: '',
  associateKey: '',
  studentNo: '',
  reasonKey: '',
})
const fixTargetKey = ref('')
const fixPageIndex = ref(0)

const associateOptions = computed(() => {
  const kw = fixForm.search.trim()
  const disabledKey = fixTargetKey.value
  const options = allStudents.value
    .filter(s => s.group === 'submitted' || s.group === 'unsubmitted')
    .map(s => ({
      value: s.key,
      label: `${s.name}（${s.studentNo || '—'}）`,
      disabled: !!disabledKey && s.key === disabledKey,
    }))

  if (!kw) return options
  return options.filter(o => String(o.label).includes(kw))
})

const openFixModal = (pageIndex: number) => {
  if (!selectedStudent.value) return

  fixTargetKey.value = selectedStudent.value.key
  fixPageIndex.value = pageIndex
  fixForm.search = ''

  if (selectedStudent.value.group === 'abnormal') {
    fixForm.associateKey = ''
    fixForm.studentNo = ''
  } else {
    fixForm.associateKey = selectedStudent.value.key
    fixForm.studentNo = selectedStudent.value.studentNo
  }

  fixForm.reasonKey = ''
  fixModalOpen.value = true
}

const onAssociateChange = (v: string) => {
  if (v === fixTargetKey.value) {
    message.warning('不能选择当前')
    return
  }
  const it = allStudents.value.find(s => s.key === v)
  if (it) fixForm.studentNo = it.studentNo
}

const parseKey = (k: string): { group: StuGroupKey; id: string } => {
  const idx = k.indexOf(':')
  return { group: k.slice(0, idx) as StuGroupKey, id: k.slice(idx + 1) }
}

// 保存学号校正：调用后端接口关联原作业与学生
const saveFix = async () => {
  const studentNo = fixForm.studentNo.trim()
  if (!studentNo) {
    message.warning('请选择学号')
    return
  }

  // 需要选择一个要关联的学生
  const associateKey = fixForm.associateKey
  if (!associateKey) {
    message.warning('请选择学生')
    return
  }
  if (associateKey === fixTargetKey.value) {
    message.warning('不能选择当前')
    return
  }

  const homeworkId = String(originalDetails.value[fixPageIndex.value]?.homeworkId || '').trim()
  if (!homeworkId) {
    message.warning('当前原作业信息缺失，无法校正学号')
    return
  }

  const { id } = parseKey(associateKey)

  const doAssociate = async (forceAssociate?: boolean) => {
    return await associateStudentHomework({
      homeworkId,
      studentUserId: id,
      ...(typeof forceAssociate === 'boolean' ? { forceAssociate } : {}),
    })
  }

  const confirmForceAssociate = () =>
    new Promise<boolean>(resolve => {
      Modal.confirm({
        title: '确认覆盖？',
        content: '该学生已关联作业，是否确认覆盖？',
        okText: '确认',
        cancelText: '取消',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      })
    })

  const afterSuccess = async () => {
    fixModalOpen.value = false
    message.success('已更新学号')

    await fetchStudentList()
    await nextTick()

    const nextSelectedKey = orderedStudents.value.find(s => s.rawId === id && s.group !== 'unsubmitted')?.key || ''
    if (nextSelectedKey) selectedStudentKey.value = nextSelectedKey
  }

  try {
    const ok = await doAssociate()
    if (!ok) {
      message.error('校正学号失败，请稍后重试')
      return
    }
    await afterSuccess()
  } catch (e: any) {
    const errMsg = String(e?.message || e || '')
    if (errMsg === '学生已关联作业') {
      const confirmed = await confirmForceAssociate()
      if (!confirmed) return

      try {
        const ok = await doAssociate(true)
        if (!ok) {
          message.error('校正学号失败，请稍后重试')
          return
        }
        await afterSuccess()
      } catch (e2: any) {
        message.error(e2?.message || '校正学号失败，请稍后重试')
      }
      return
    }

    message.error(errMsg || '校正学号失败，请稍后重试')
  }
}

// 头部展示信息（学科 / 班级 / 试卷），优先使用缓存数据
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
    } catch {}
  }

  return {
    subject: '-',
    gradeClass: '-',
    paperName: '-',
  }
})

// 根据作业 ID 构建各个 Tab 的路由地址
const buildPath = (tpl: string) => tpl.replace(':id', encodeURIComponent(String(routeAssignmentId.value)))
const tabs = computed<DetailTab[]>(() => [
  { key: 'pages', label: '讲错题', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL) },
  { key: 'student_stats', label: '学生作业统计', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_STUDENT_STATS) },
  { key: 'students', label: '学生（汇总）', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_STUDENTS) },
  { key: 'origin-work', label: '原作业', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_ORIGINAL_WORK) },
  { key: 'ai', label: '人工批阅', to: buildPath(ROUTES.TEACHER_HOMEWORK_DETAIL_MANUAL_REVIEW) },
])
const activeTabKey = computed<TabKey>(() => 'origin-work')

// 切换顶部 Tab
const goTab = (to: string) => {
  router.push(to).catch(() => {})
}

// 返回作业列表
const goBack = () => {
  router.push(ROUTES.TEACHER_HOMEWORK).catch(() => {})
}

// 下载原卷留痕 PDF（所有页面含批阅标记）
const downloadOriginal = async () => {
  const ids = originalDetails.value.map(d => String(d?.homeworkId || '').trim()).filter(Boolean)
  if (!ids.length) {
    message.warning('当前暂无原作业图片')
    return
  }
  const fileName = `原卷留痕_${selectedStudent.value?.name || ''}`
  try {
    await downloadOriginalWorkAsPdf(ids, fileName)
  } catch {
    message.error('下载失败，请稍后重试')
  }
}
</script>

<style scoped lang="scss">
.tch-detail-page {
  height: var(--content-height);
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: hidden;

  .tch-ow-actions {
    padding: 0 6px;

    .meta {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-text-secondary);
      font-size: 12px;

      .sep {
        opacity: 0.6;
      }

      .paper {
        font-weight: 700;
        color: var(--color-primary);
      }
    }

    .right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .tch-ow-body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 16px;

    .tch-ow-left {
      padding: 12px;
      border-radius: 18px;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .tch-ow-stu-list {
        flex: 1;
        min-height: 0;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 14px;

        .tch-ow-stu-group {
          display: flex;
          flex-direction: column;
          gap: 10px;

          &-title {
            font-size: 12px;
            font-weight: 700;
            color: var(--color-text-secondary);
            opacity: 0.8;
            padding: 0 2px;
          }
        }
      }

      .tch-ow-stats {
        border-top: 1px solid var(--color-border-light);
        padding-top: 10px;
        display: grid;
        gap: 8px;

        .row {
          border: none;

          &:hover {
            filter: brightness(0.98);
          }

          &.is-red {
            background: var(--color-badge-red-bg);
            color: var(--color-badge-red-text);
          }
          &.is-green {
            background: var(--color-badge-green-bg);
            color: var(--color-badge-green-text);
          }
          &.is-blue {
            background: var(--color-badge-blue-bg);
            color: var(--color-badge-blue-text);
          }
          &.is-gray {
            background: var(--color-badge-gray-bg);
            color: var(--color-badge-gray-text);
          }
        }
      }
    }

    .tch-ow-center {
      border-radius: 18px;
      padding: 16px;
      min-height: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      background: var(--color-bg-surface);
      position: relative;

      .tch-ow-paper-area {
        flex: 1;
        min-height: 0;
        width: 100%;
        overflow: hidden;
        border-radius: 8px;
      }

      .tch-ow-paper-wrap {
        width: 100%;
        height: 100%;
        transform-origin: center top;
      }
    }
  }

  .tch-ow-stu-item {
    text-align: left;
    background: var(--color-bg-card);

    &:hover {
      border-color: var(--color-primary-soft);
    }

    &.active {
      background: rgba(255, 247, 237, 0.4);
      border-color: var(--color-primary-soft);
    }

    .main {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .name {
        font-weight: 700;
        color: var(--color-text-primary);
        font-size: 13px;
      }

      .no {
        font-size: 12px;
        color: var(--color-text-muted);
      }
    }

    .badge {
      min-width: 52px;
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 4px;

      &.is-red {
        background: var(--color-badge-red-bg);
        color: var(--color-badge-red-text);
      }
      &.is-green {
        background: var(--color-badge-green-bg);
        color: var(--color-badge-green-text);
      }
      &.is-blue {
        background: var(--color-badge-blue-bg);
        color: var(--color-badge-blue-text);
      }
      &.is-gray {
        background: var(--color-badge-gray-bg);
        color: var(--color-badge-gray-text);
      }
    }

    &.disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }
}

:global(.tch-ow-fix-modal .ant-modal-body) {
  padding: 0;
}

.tch-fix-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .tch-fix-block {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .tch-fix-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .tch-fix-reason-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;

    .reason-card {
      &:before {
        content: '';
        margin-top: 10px;
        display: block;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: #8c6d5d66;
      }

      .reason-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--color-text-primary);
        margin-bottom: 4px;
      }

      .reason-desc {
        font-size: 12px;
        color: var(--color-text-secondary);
        line-height: 1.5;
      }
    }
  }
}

:deep(.tch-ow-fix-modal .ant-input),
:deep(.tch-ow-fix-modal .ant-select-selector) {
  height: 44px;
  border-radius: 12px !important;
}

:deep(.tch-ow-fix-modal .ant-select-selector) {
  align-items: center;
}

:global(.tch-ow-fix-modal .ant-radio-group.tch-fix-reasons) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
