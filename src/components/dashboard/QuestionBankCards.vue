<template>
  <div class="tch-db-qb">
    <div v-for="c in cards" :key="c.key" class="tch-db-qb-card" :class="'is-' + c.tone">
      <div class="top">
        <div class="t">{{ c.title }}</div>
        <div class="v">{{ c.value }}</div>
      </div>
      <div class="mid">
        <div class="sub">{{ c.subLabel }}</div>
        <div class="subv">{{ c.subValue }}</div>
      </div>
      <div class="qb-icon" aria-hidden="true">
        <Icon :icon="c.icon" width="40" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getQuestionStatistics } from '@/api/dashboard'
import type { QuestionCountVO } from '@/api/dashboard/type'
import { getUserBaseInfo } from '@/services/storage'
import { Icon } from '@iconify/vue'
import { computed, onMounted, ref } from 'vue'

const parsedUserInfo = getUserBaseInfo()
const subjectName = String(parsedUserInfo?.subjectName || '').trim()

const stats = ref<QuestionCountVO | null>(null)

const nf = new Intl.NumberFormat('zh-CN')
const asNum = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
const asFmt = (v: any) => nf.format(asNum(v))

const cards = computed(() => {
  const s = stats.value
  return [
    {
      key: 'total',
      title: '总试题',
      value: s ? asFmt(s.totalQuestionCount) : '--',
      subLabel: '近7日',
      subValue: s ? asNum(s.newQuestionCount) : 0,
      tone: 'blue',
      icon: 'solar:clipboard-text-bold-duotone',
    },
    {
      key: 'subject',
      title: `${subjectName || '学科'}试题`,
      value: s ? asFmt(s.subjectQuestionCount) : '--',
      subLabel: '近7日',
      subValue: s ? asNum(s.newSubjectQuestionCount) : 0,
      tone: 'purple',
      icon: 'solar:book-2-bold-duotone',
    },
    {
      key: 'upload',
      title: '上传试题',
      value: s ? asFmt(s.selfQuestionCount) : '--',
      subLabel: '近7日',
      subValue: s ? asNum(s.newSelfQuestionCount) : 0,
      tone: 'green',
      icon: 'solar:cloud-upload-bold-duotone',
    },
  ] as const
})

onMounted(async () => {
  try {
    stats.value = await getQuestionStatistics()
  } catch {
    stats.value = null
  }
})
</script>
