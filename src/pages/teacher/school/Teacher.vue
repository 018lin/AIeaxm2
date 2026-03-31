<template>
  <div class="teacher-directory app-surface">
    <div class="table-container">
      <a-table
        :columns="columns"
        :data-source="teachers"
        :pagination="false"
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
      <div class="footer-info">共 {{ teachers.length }} 名教师</div>
      <a-pagination v-model:current="currentPage" :total="48" :pageSize="15" show-less-items />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// const schoolSearch = ref('')
// const selectedSchoolId = ref(1)
const selectedRowKeys = ref([])
const currentPage = ref(1)
// const jumpPage = ref('1')
// const pageSize = ref('10')

const onSelectChange = (keys: any) => {
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

const teachers = ref([
  {
    key: '1',
    id: '06',
    cnName: '翟梦雪',
    enName: 'Zhai MX',
    initials: '翟',
    avatarBg: '#ffedd5',
    avatarColor: '#f97316',
    account: '152****5391',
    mobile: '152****5391',
    subject: '语文',
    gradeClasses: [{ grade: '5', classes: ['03', '04'] }],
  },
  {
    key: '2',
    id: '07',
    cnName: '张玉',
    enName: 'Zhang Yu',
    initials: '张',
    avatarBg: '#f5f3ff',
    avatarColor: '#8b5cf6',
    account: '155****8916',
    mobile: '155****8916',
    subject: '数学',
    gradeClasses: [{ grade: '5', classes: ['05', '06'] }],
  },
  {
    key: '3',
    id: '11',
    cnName: '元妮妮',
    enName: 'Yuan NN',
    initials: '元',
    avatarBg: '#ecfdf5',
    avatarColor: '#10b981',
    account: '153****2859',
    mobile: '153****2859',
    subject: '全科',
    gradeClasses: [
      { grade: '4', classes: ['01', '02', '03', '04'] },
      { grade: '5', classes: ['01', '02', '03', '04'] },
      { grade: '6', classes: ['01', '02', '03', '04'] },
    ],
  },
  {
    key: '4',
    id: '12',
    cnName: '胡丽品',
    enName: 'Hu LP',
    initials: '胡',
    avatarBg: '#fff1f2',
    avatarColor: '#fb7185',
    account: '153****5879',
    mobile: '153****5879',
    subject: '全科',
    gradeClasses: [
      { grade: '4', classes: ['01-04'] },
      { grade: '5', classes: ['01-04'] },
    ],
  },
  {
    key: '1',
    id: '06',
    cnName: '翟梦雪',
    enName: 'Zhai MX',
    initials: '翟',
    avatarBg: '#ffedd5',
    avatarColor: '#f97316',
    account: '152****5391',
    mobile: '152****5391',
    subject: '语文',
    gradeClasses: [{ grade: '5', classes: ['03', '04'] }],
  },
  {
    key: '2',
    id: '07',
    cnName: '张玉',
    enName: 'Zhang Yu',
    initials: '张',
    avatarBg: '#f5f3ff',
    avatarColor: '#8b5cf6',
    account: '155****8916',
    mobile: '155****8916',
    subject: '数学',
    gradeClasses: [{ grade: '5', classes: ['05', '06'] }],
  },
  {
    key: '3',
    id: '11',
    cnName: '元妮妮',
    enName: 'Yuan NN',
    initials: '元',
    avatarBg: '#ecfdf5',
    avatarColor: '#10b981',
    account: '153****2859',
    mobile: '153****2859',
    subject: '全科',
    gradeClasses: [
      { grade: '4', classes: ['01', '02', '03', '04'] },
      { grade: '5', classes: ['01', '02', '03', '04'] },
      { grade: '6', classes: ['01', '02', '03', '04'] },
    ],
  },
  {
    key: '4',
    id: '12',
    cnName: '胡丽品',
    enName: 'Hu LP',
    initials: '胡',
    avatarBg: '#fff1f2',
    avatarColor: '#fb7185',
    account: '153****5879',
    mobile: '153****5879',
    subject: '全科',
    gradeClasses: [
      { grade: '4', classes: ['01-04'] },
      { grade: '5', classes: ['01-04'] },
    ],
  },
  {
    key: '3',
    id: '11',
    cnName: '元妮妮',
    enName: 'Yuan NN',
    initials: '元',
    avatarBg: '#ecfdf5',
    avatarColor: '#10b981',
    account: '153****2859',
    mobile: '153****2859',
    subject: '全科',
    gradeClasses: [
      { grade: '4', classes: ['01', '02', '03', '04'] },
      { grade: '5', classes: ['01', '02', '03', '04'] },
      { grade: '6', classes: ['01', '02', '03', '04'] },
    ],
  },
  {
    key: '4',
    id: '12',
    cnName: '胡丽品',
    enName: 'Hu LP',
    initials: '胡',
    avatarBg: '#fff1f2',
    avatarColor: '#fb7185',
    account: '153****5879',
    mobile: '153****5879',
    subject: '全科',
    gradeClasses: [
      { grade: '4', classes: ['01-04'] },
      { grade: '5', classes: ['01-04'] },
    ],
  },
])
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
