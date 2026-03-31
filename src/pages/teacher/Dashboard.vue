<template>
  <div class="page-wrap teacher-theme tch-dashboard">
    <section class="tch-db-hero app-surface">
      <div class="tch-db-hero-left">
        <h1 v-if="teacherDisplayName" class="bold">{{ teacherDisplayName }}，欢迎您</h1>
        <div class="tch-db-hero-desc">
          这里是您的专属教学工作台。作业布置、数据采集、分析报告一站全搞定。系统已为您更新了最新的班级学情数据。
        </div>
      </div>
      <div class="tch-db-hero-right" aria-hidden="true">
        <Icon class="tch-db-spark s1" icon="solar:stars-minimalistic-bold-duotone" width="44" />
        <Icon class="tch-db-spark s2" icon="solar:stars-minimalistic-bold-duotone" width="26" />
        <Icon class="tch-db-spark s3" icon="solar:stars-minimalistic-bold-duotone" width="34" />
      </div>
    </section>

    <section class="tch-db-kpis">
      <div v-for="k in topKpis" :key="k.key" class="tch-db-kpi-card app-surface">
        <div class="left">
          <div class="label">{{ k.label }}</div>
          <div class="val">
            {{ k.value }}<span v-if="k.unit" class="unit">{{ k.unit }}</span>
          </div>
        </div>
        <div class="icon" :class="'is-' + k.tone">
          <Icon :icon="k.icon" width="18" />
        </div>
      </div>
    </section>

    <section class="tch-db-panels">
      <StudentDistributionCorrect
        :accuracy="studentAccuracyDist"
        :above-list="currentStudentOverview?.aboveList"
        :avg-list="currentStudentOverview?.avgList"
        :below-list="currentStudentOverview?.belowList"
        :classes="classTabs"
        :active-index="activeClassIndex"
        @change-class="handleChangeClass"
      />

      <div class="tch-db-panel app-surface">
        <div class="tch-db-panel-head">
          <div class="tch-db-panel-title">校本题库</div>
          <button type="button" class="tch-db-link cursor-pointer" @click="goQuestionBank">管理题库 →</button>
        </div>

        <QuestionBankCards />
      </div>
    </section>

    <section class="tch-db-recents">
      <RecentPapersCard />
      <RecentHomeworkCard />
    </section>
  </div>
</template>

<script setup lang="ts">
import { getStudentOverview, getTeacherOverview } from '@/api/dashboard'
import type { StudentOverviewVO, TeacherOverviewVO } from '@/api/dashboard/type'
import QuestionBankCards from '@/components/dashboard/QuestionBankCards.vue'
import RecentHomeworkCard from '@/components/dashboard/RecentHomeworkCard.vue'
import RecentPapersCard from '@/components/dashboard/RecentPapersCard.vue'
import StudentDistributionCorrect from '@/components/dashboard/StudentDistributionCorrect.vue'
import { ROUTES } from '@/router/routes'
import { getUserBaseInfo } from '@/services/storage'
import { Icon } from '@iconify/vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const parsedUserInfo = getUserBaseInfo()
const teacherDisplayName = ref(parsedUserInfo?.teacherName || '')

type Tone = 'blue' | 'green' | 'purple' | 'orange'

type TopKpi = {
  key: string
  label: string
  value: number | string
  unit?: string
  icon: string
  tone: Tone
}

const topKpis = computed<TopKpi[]>(() => [
  {
    key: 'classes',
    label: '授课班级数',
    value: overviewData.value.classCount || 0,
    icon: 'solar:users-group-rounded-bold-duotone',
    tone: 'blue',
  },
  {
    key: 'students',
    label: '学生总数',
    value: overviewData.value.studentCount || 0,
    unit: '人',
    icon: 'solar:user-rounded-bold-duotone',
    tone: 'green',
  },
  {
    key: 'monthly',
    label: '本月作业',
    value: overviewData.value.workCount || 0,
    unit: '份',
    icon: 'solar:pen-new-square-bold-duotone',
    tone: 'purple',
  },
  {
    key: 'avg',
    label: '平均答题率',
    value: overviewData.value.accuracy || 0,
    unit: '%',
    icon: 'solar:chart-2-bold-duotone',
    tone: 'orange',
  },
])

const overviewData = ref<TeacherOverviewVO>({
  classCount: '0',
  studentCount: '0',
  workCount: '0',
  accuracy: '0',
})

type ClassTab = { classId: string; className: string }
type DistItem = { count: number; rate: number }
type Distribution = { above: DistItem; equal: DistItem; below: DistItem }

const classTabs = ref<ClassTab[]>([])
const activeClassIndex = ref(0)
const studentOverviewList = ref<StudentOverviewVO[]>([])
const currentStudentOverview = computed(() => studentOverviewList.value[activeClassIndex.value] ?? null)

const parsePct = (s?: string) => {
  const raw = String(s ?? '').trim()
  const m = raw.match(/-?\d+(?:\.\d+)?/)
  const n = m ? Number(m[0]) : 0
  return Number.isFinite(n) ? n : 0
}

const parseCount = (s?: string) => {
  const n = Number(String(s ?? '').trim())
  return Number.isFinite(n) ? n : 0
}

const toDistribution = (vo: StudentOverviewVO | null | undefined): Distribution => {
  return {
    above: { count: parseCount(vo?.aboveCount), rate: parsePct(vo?.aboveRatio) },
    equal: { count: parseCount(vo?.avgCount), rate: parsePct(vo?.avgRatio) },
    below: { count: parseCount(vo?.belowCount), rate: parsePct(vo?.belowRatio) },
  }
}

const studentAccuracyDist = computed<Distribution>(() => toDistribution(currentStudentOverview.value))

const fetchStudentOverviewInit = async () => {
  try {
    const list = await getStudentOverview()
    if (!Array.isArray(list) || !list.length) return

    studentOverviewList.value = list

    classTabs.value = list.map((i, idx) => ({
      classId: String(i?.classId ?? idx),
      className: String(i?.className ?? `${idx + 1}班`),
    }))

    activeClassIndex.value = 0
  } catch (error) {
    console.error('Fetch student overview failed:', error)
  }
}

const handleChangeClass = (index: number) => {
  const i = Number(index)
  if (!Number.isFinite(i)) return
  const clamped = Math.max(0, Math.min(studentOverviewList.value.length - 1, i))
  activeClassIndex.value = clamped
}

const fetchOverview = async () => {
  if (!parsedUserInfo?.userId) return
  try {
    const res = await getTeacherOverview()
    if (res) {
      overviewData.value = res
    }
  } catch (error) {
    console.error('Fetch overview failed:', error)
  }
}

onMounted(() => {
  fetchOverview()
  fetchStudentOverviewInit()
})

const goAssignNow = () => {
  router.push(ROUTES.TEACHER_HOMEWORK).catch(() => {})
}

const goClassReport = () => {
  router.push(ROUTES.TEACHER_REPORTS_CLASS).catch(() => {})
}

const goQuestionBank = () => {
  router.push(ROUTES.TEACHER_QUESTION_BANK).catch(() => {})
}
</script>

<style scoped lang="scss">
.tch-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.tch-db-hero {
  padding: 34px 40px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 247, 237, 0.6) 100%);

  h1 {
    font-size: 40px;
    color: #334155;
    letter-spacing: 0.2px;
  }
}

.tch-db-hero-left {
  max-width: 720px;
}

.tch-db-hero-desc {
  margin-top: 12px;
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.75;
}

.tch-db-hero-btn {
  height: 40px;
  border-radius: 12px;
  padding: 0 18px;
  font-weight: 700;
}

.tch-db-hero-right {
  position: absolute;
  right: 56px;
  top: 50%;
  transform: translateY(-50%);
  width: 210px;
  height: 150px;
}

.tch-db-spark {
  position: absolute;
  color: rgba(249, 115, 22, 0.55);

  &.s1 {
    right: 26px;
    top: 26px;
  }

  &.s2 {
    right: 0;
    top: 70px;
    color: rgba(249, 115, 22, 0.42);
  }

  &.s3 {
    right: 42px;
    top: 86px;
    color: rgba(249, 115, 22, 0.36);
  }
}

.tch-db-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.tch-db-recents {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  min-height: 360px;
}

.tch-db-kpi-card {
  border-radius: 18px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);

  .label {
    font-size: 12px;
    color: var(--color-text-secondary);
    font-weight: 700;
  }

  .val {
    margin-top: 6px;
    font-size: 34px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .unit {
    margin-left: 4px;
    font-size: 12px;
    font-weight: 700;
    color: var(--color-text-secondary);
  }

  .icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;

    &.is-blue {
      background: rgba(59, 130, 246, 0.12);
      color: rgba(59, 130, 246, 0.95);
    }

    &.is-green {
      background: rgba(34, 197, 94, 0.12);
      color: rgba(34, 197, 94, 0.95);
    }

    &.is-purple {
      background: rgba(139, 92, 246, 0.12);
      color: rgba(139, 92, 246, 0.95);
    }

    &.is-orange {
      background: rgba(249, 115, 22, 0.12);
      color: rgba(249, 115, 22, 0.95);
    }
  }
}

.tch-db-panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.tch-db-panel {
  border-radius: 18px;
  padding: 18px 20px;
}

.tch-db-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tch-db-panel-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}

.tch-db-title-bar {
  width: 4px;
  height: 16px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.35);
}

.tch-db-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.03);
  border-radius: 999px;
  padding: 4px;
}

.tch-db-tab {
  height: 28px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.tch-db-tab.active {
  background: rgba(59, 130, 246, 0.14);
  color: rgba(59, 130, 246, 0.95);
}

.tch-db-dist {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  align-items: center;
}

.tch-db-dist-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-height: 210px;
}

.tch-db-dist-pill {
  width: 64px;
  height: 160px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.12);
  position: relative;
  overflow: hidden;
}

.tch-db-dist-pill .fill {
  position: absolute;
  inset: 0 0 28px 0;
  background: rgba(59, 130, 246, 0.14);
}

.tch-db-dist-pill .base {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 38px;
  background: rgba(251, 191, 36, 0.16);
}

.tch-db-dist-line {
  width: 100%;
  height: 1px;
  background: rgba(15, 23, 42, 0.06);
}

.tch-db-dist-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.tch-db-dist-item .mark {
  width: 4px;
  height: 34px;
  border-radius: 999px;
  margin-top: 2px;
}

.tch-db-dist-item .mark.is-blue {
  background: rgba(59, 130, 246, 0.35);
}

.tch-db-dist-item .mark.is-green {
  background: rgba(34, 197, 94, 0.35);
}

.tch-db-dist-item .mark.is-orange {
  background: rgba(251, 146, 60, 0.4);
}

.tch-db-dist-item .name {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text-secondary);
}

.tch-db-dist-item .num {
  margin-top: 4px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.tch-db-dist-item .pct {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(15, 23, 42, 0.38);
}

.tch-db-link {
  font-size: 12px;
  font-weight: 700;
  color: rgba(249, 115, 22, 0.9);
  border: none;
  background: transparent;
}

:deep(.tch-db-qb) {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

:deep(.tch-db-qb-card) {
  border-radius: 18px;
  padding: 18px;
  min-height: 310px;
  position: relative;
  overflow: hidden;

  .t {
    font-size: 12px;
    font-weight: 700;
    color: rgba(15, 23, 42, 0.62);
  }

  .v {
    margin-top: 8px;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }

  .mid {
    margin-top: 18px;
  }

  .sub {
    font-size: 12px;
    font-weight: 700;
    color: rgba(15, 23, 42, 0.5);
  }

  .subv {
    margin-top: 6px;
    font-size: 18px;
    font-weight: 700;
    color: rgba(15, 23, 42, 0.86);
  }

  .qb-icon {
    position: absolute;
    left: 18px;
    bottom: 18px;
    opacity: 0.26;
  }

  &.is-blue {
    background: rgba(56, 189, 248, 0.12);
    color: rgba(2, 132, 199, 1);

    .v {
      color: rgba(2, 132, 199, 1);
    }
  }

  &.is-purple {
    background: rgba(196, 181, 253, 0.14);
    color: rgba(109, 40, 217, 1);

    .v {
      color: rgba(109, 40, 217, 1);
    }
  }

  &.is-green {
    background: rgba(167, 243, 208, 0.16);
    color: rgba(5, 150, 105, 1);

    .v {
      color: rgba(5, 150, 105, 1);
    }
  }
}

@media (max-width: 1024px) {
  .tch-db-hero {
    padding: 28px 22px;
  }

  .tch-db-kpis {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .tch-db-recents {
    grid-template-columns: 1fr;
  }

  .tch-db-panels {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .tch-db-kpis {
    grid-template-columns: 1fr;
  }

  .tch-db-dist {
    grid-template-columns: 1fr;
  }

  :deep(.tch-db-qb) {
    grid-template-columns: 1fr;
  }
}
</style>
