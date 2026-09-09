<template>
  <div class="teacher-directory app-surface">
    <div class="table-container">
      <a-table
        :columns="columns"
        :data-source="teachers"
        :pagination="false"
        :loading="loading"
        row-key="key"
        :row-selection="{ selectedRowKeys: selectedRowKeys, onChange: onSelectChange }"
        class="teacher-table"
        :scroll="{ y: 630 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <a-tag color="red">{{ record.cnName }}</a-tag>
          </template>
          <template v-if="column.key === 'role'">
            <a-tag color="orange">教师</a-tag>
          </template>
          <template v-if="column.key === 'subject'">
            <a-tag color="pink">{{ record.subject }}</a-tag>
          </template>

          <template v-if="column.key === 'gradeClass'">
            <div class="class-chips">
              <div v-for="item in record.gradeClasses" :key="item.grade" class="grade-group">
                <span class="grade-label">{{ item.grade }}年级:</span>
                <div class="chips">
                  <span v-for="c in item.classes" :key="c" class="class-chip">{{ c }}</span>
                </div>
              </div>
            </div>
          </template>
        </template>
      </a-table>
    </div>
    <div class="table-footer">
      <div class="footer-info">共 {{ total }} 名教师</div>
      <a-pagination v-model:current="currentPage" :total="total" :pageSize="pageSize" show-less-items @change="fetchTeachers" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { getTeacherPage } from '@/api/adminEducation/teacherIndex'
import type { TeachersByClassIdResponse } from '@/api/adminEducation/type'
import { message } from 'ant-design-vue'
import { onMounted, ref } from 'vue'

// const schoolSearch = ref('')
// const selectedSchoolId = ref(1)
const selectedRowKeys = ref<(string | number)[]>([])
const currentPage = ref(1)
const pageSize = 15
const total = ref(0)
const loading = ref(false)
// const jumpPage = ref('1')
// const pageSize = ref('10')

const onSelectChange = (keys: (string | number)[]) => {
  selectedRowKeys.value = keys
}

// const schools = [
//   { id: 1, name: "Xi'an High Tech 8th Primary" },
//   { id: 2, name: 'Mingde Experimental School' },
//   { id: 3, name: 'Yanta District No. 1 Middle' },
//   { id: 4, name: 'Second International Primary' },
// ]

const columns = [
  { title: 'ID', align: 'center', dataIndex: 'id', key: 'id', width: 80 },
  { title: '名称', align: 'center', key: 'name' },
  { title: '账号', align: 'center', dataIndex: 'account', key: 'account' },
  { title: '手机号', align: 'center', dataIndex: 'mobile', key: 'mobile' },
  { title: '角色', align: 'center', key: 'role', width: 120 },
  { title: '科目', align: 'center', dataIndex: 'subject', key: 'subject' },
  { title: '年级/班级', align: 'center', key: 'gradeClass' },
]

type TeacherRow = {
  key: string
  id: string
  cnName: string
  account: string
  mobile: string
  subject: string
  gradeClasses: { grade: string; classes: string[] }[]
}

const teachers = ref<TeacherRow[]>([])

function toTeacherRow(item: TeachersByClassIdResponse, index: number): TeacherRow {
  const classGroups = new Map<string, string[]>()
  for (const classInfo of item.classInfoList || []) {
    const grade = String(item.gradeName || item.gradeId || '-')
    const list = classGroups.get(grade) || []
    list.push(String(classInfo.className || classInfo.classId || '-'))
    classGroups.set(grade, list)
  }

  return {
    key: String(item.teacherId || item.userId || item.id || index),
    id: String(item.teacherId || item.id || index + 1),
    cnName: String(item.teacherName || item.userName || '-'),
    account: String(item.userName || item.phoneNumber || '-'),
    mobile: String(item.phoneNumber || '-'),
    subject: String(item.subjectName || item.subjectId || '-'),
    gradeClasses: [...classGroups.entries()].map(([grade, classes]) => ({ grade, classes })),
  }
}

async function fetchTeachers(page = currentPage.value) {
  currentPage.value = page
  loading.value = true
  try {
    const res = await getTeacherPage({ pageNo: currentPage.value, pageSize })
    teachers.value = (res?.list || []).map(toTeacherRow)
    total.value = Number(res?.total || 0)
  } catch (e: any) {
    teachers.value = []
    total.value = 0
    message.error(e?.message || '获取教师列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTeachers().catch(() => {})
})
</script>

<style scoped lang="less">
.teacher-directory {
  height: 100%;
  max-height: calc(100vh - 128px);
  padding-bottom: 80px;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 36px;
  border: 1px solid rgb(240 234 229 / 1);
}

.table-container {
  border-radius: 32px;
  width: 100%;
  background: transparent;

  .class-chips {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .grade-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .grade-label {
    font-size: 12px;
    font-weight: 700;
    color: #9ca3af;
  }
  .chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .class-chip {
    background: #f3f4f6;
    color: #374151;
    padding: 2px 10px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 700;
  }
}

.teacher-table {
  :deep(.ant-table-thead > tr > th) {
    background-color: rgb(250 247 245 / 1);
    color: rgb(140 109 93 / 1);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.6px;
    padding: 16px 18px;
    border-bottom: 1px solid rgb(240 234 229 / 1);
  }
  :deep(.ant-table-tbody > tr > td) {
    padding: 18px 12px;
    border-bottom: 1px solid #f3f4f6;
    vertical-align: middle;
  }
}

.table-footer {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  border-radius: 0 0 32px 32px;

  .footer-info {
    font-size: 13px;
    color: rgb(140 109 93 / 1);
    font-style: italic;
  }

  :deep(.ant-pagination-item) {
    border: none;
    background: transparent;
    border-radius: 32px;
    font-weight: 700;

    &-active {
      background: #f97316;
      a {
        color: white;
      }
    }
  }

  :deep(.ant-pagination-prev),
  :deep(.ant-pagination-next) {
    .ant-pagination-item-link {
      border: none;
      background: #f9fafb;
      border-radius: 12px;
    }
  }
}
</style>
