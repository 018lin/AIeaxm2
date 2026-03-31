<template>
  <div class="class-admin">
    <!-- 搜索栏 -->
    <div class="class-admin-search app-surface">
      <SelectCom :typeList="[selectEnum.GRADE]" :select-value="selectValue" @getList="handleFilter" />
      <a-button type="primary" :icon="h(PlusOutlined)" @click="openCreate(null)">新增</a-button>
    </div>

    <!-- 表格 -->
    <div class="table-container app-surface" v-if="list.length">
      <a-table :columns="columns" :data-source="list" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <div class="btn-box">
              <a-button type="link" @click="goToDetail(record)" :icon="h(EyeOutlined)">查看</a-button>
              <a-button type="link" @click="openCreate(record)" :icon="h(EditOutlined)">修改</a-button>
              <a-popconfirm title="确定要删除吗?" ok-text="是" cancel-text="否" @confirm="deleteConfig(record.classId)">
                <a-button style="color: #f43f5e" :icon="h(DeleteOutlined)">删除</a-button>
              </a-popconfirm>
            </div>
          </template>
        </template>
      </a-table>

      <TchPagination
        v-model:current="filters.pageNo"
        v-model:pageSize="filters.pageSize"
        :total="total"
        @change="getList"
      />
    </div>

    <!-- 空数据 -->
    <div class="empty-state" v-else>
      <a-empty :description="'暂无数据'" />
    </div>

    <!-- 创建班级 模态框 -->
    <a-modal
      v-model:open="addOrEditOpen"
      :title="addOrEditTitle"
      :confirm-loading="formLoading"
      width="500px"
      :footer="null"
      @cancel="closeCreate"
    >
      <div class="form-box">
        <div class="form-item">
          <p class="form-label">年级</p>
          <a-select v-model:value="formData.gradeId" placeholder="请选择年级" style="width: 300px">
            <a-select-option v-for="item in gradeList" :key="item.dictValue" :value="item.dictValue">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </div>
        <div class="form-item">
          <p class="form-label">班级名称</p>
          <a-input
            v-model:value="formData.className"
            max-length="20"
            placeholder="班级名称长度不能超过10个字符"
            style="width: 300px; height: 44px"
          />
        </div>
        <div class="form-btn">
          <a-button class="default-btn" @click="closeCreate">取消</a-button>
          <a-button class="primary-btn" type="primary" @click="submitForm">保存</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { createClass, deleteClass, getClassPage, updateClass } from '@/api/adminEducation/index'
import type { ClassVO } from '@/api/adminEducation/type'
import { getDictList } from '@/api/common/index'
import type { dictListResponse } from '@/api/common/type'
import SelectCom from '@/components/common/Select.vue'
import TchPagination from '@/components/common/table/TchPagination.vue'
import { selectEnum } from '@/enum/common'
import { ROUTES } from '@/router/routes'
import { encrypt } from '@/utils/crypto'
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// 筛选条件
const filters = reactive<{
  pageNo: number
  pageSize: number
  gradeId?: string
}>({
  pageNo: 1,
  pageSize: 10,
  gradeId: undefined,
})
const gradeList = ref<dictListResponse[]>([]) // 年级字典列表
const selectValue = computed(() => [filters.gradeId])
const list = ref<ClassVO[]>([]) // 班级列表
const total = ref(0) // 班级列表总数
// 新增 / 修改相关
const addOrEditOpen = ref(false) // 新增 / 修改抽屉的显示状态
const addOrEditTitle = ref('') // 新增 / 修改抽屉的标题
const formLoading = ref(false) // 表单提交加载状态
const formData = reactive<any>({ gradeId: undefined, className: '', classId: undefined }) // 表单数据
const columns = [
  { title: '年级', align: 'center', dataIndex: 'gradeName', key: 'gradeName' },
  { title: '班级', dataIndex: 'className', key: 'className' },
  { title: '教师人数', dataIndex: 'teacherCount', key: 'teacherCount' },
  { title: '学生人数', dataIndex: 'studentCount', key: 'studentCount' },
  { title: '操作', key: 'actions' },
]

// 新增/修改
const openCreate = async (item: ClassVO | null) => {
  if (item) {
    addOrEditTitle.value = '修改班级'
    formData.gradeId = item.gradeId
    formData.classId = item.classId
    formData.className = item.className
  } else {
    addOrEditTitle.value = '新建班级'
    formData.gradeId = undefined
    formData.classId = undefined
    formData.className = ''
  }
  addOrEditOpen.value = true
}
const closeCreate = () => {
  addOrEditOpen.value = false
  addOrEditTitle.value = ''
  formData.gradeId = undefined
  formData.className = ''
  formData.classId = undefined
}
const submitForm = async () => {
  if (!formData.gradeId) {
    message.error('请选择年级')
    return
  }
  if (!formData.className) {
    message.error('请输入班级名称')
    return
  }
  formLoading.value = true
  try {
    if (!formData.classId) {
      await createClass(formData)
    } else {
      await updateClass(formData)
    }
    message.success('操作成功')
    getList()
    closeCreate()
  } catch (error) {
    console.error('操作失败', error)
  } finally {
    formLoading.value = false
  }
}

// 详情
const goToDetail = async (item: ClassVO) => {
  if (!item) {
    return
  }
  const params = {
    classId: item.classId,
    gradeId: item.gradeId,
    className: item.className,
    gradeName: item.gradeName,
  }
  router.push({
    path: ROUTES.ADMIN_EDUCATION_CLASS_DETAIL,
    query: { data: encrypt(JSON.stringify(params)) },
  })
}

// 删除
const deleteConfig = async (classId: string) => {
  await deleteClass({ classId: classId })
  message.success('删除成功')
  getList()
}

// 筛选
const handleFilter = (params: any) => {
  if ('gradeId' in params) {
    const nextGrade = params.gradeId || undefined
    if (nextGrade !== filters.gradeId) {
      filters.gradeId = nextGrade
    }
  }
}

// 获取列表
const getList = async () => {
  const res = await getClassPage(filters)
  list.value = res.list || []
  total.value = res.total || 0
}

// 获取字典数据
const getDictData = async (type: string[]) => {
  const res = await getDictList({ dictTypes: type })
  const resData = res || []

  // 遍历返回的字典数据，根据 dictType 分别赋值
  resData.forEach(item => {
    if (item.dictType === selectEnum.GRADE) {
      gradeList.value = item.dictTypeList || []
    }
  })
}

onMounted(() => {
  getDictData([selectEnum.GRADE])
  getList()
})

watch(
  () => filters.gradeId,
  () => {
    getList()
  }
)
</script>

<style scoped lang="scss">
.class-admin {
  width: 100%;
  height: 100%;

  .class-admin-search {
    padding: 20px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .table-container {
    padding: 20px;
    margin-top: 20px;

    .btn-box {
      display: flex;
      gap: 8px;
    }
  }
}

.empty-state {
  height: calc(100vh - 200px);
  display: flex;
  justify-content: center;
  align-items: center;
}

.form-box {
  width: 100%;
  border-top: 1px solid #f0f0f0;
  padding: 30px;
  .form-item {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    font-size: 15px;

    .form-label {
      width: 120px;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
  .form-btn {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
