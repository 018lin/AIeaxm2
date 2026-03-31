<template>
  <div class="teacher-add">
    <!-- 标题栏 -->
    <div class="teacher-add-header">
      <a-button class="default-btn" :icon="h(ArrowLeftOutlined)" @click="goBack">返回</a-button>
      <span class="title">{{ teacherId ? '编辑教师' : '新建教师' }}</span>
    </div>
    <!-- 账号信息 -->
    <div class="teacher-add-content app-surface">
      <div class="content-title"><span></span>1. 账号信息</div>
      <a-form ref="accountFormRef" :model="accountForm" :rules="rules" :label-col="labelCol" :wrapper-col="wrapperCol">
        <a-form-item label="真实姓名" name="teacherName">
          <a-input v-model:value="accountForm.teacherName" placeholder="请输入教师姓名" />
        </a-form-item>
        <a-form-item label="手机号" name="phoneNumber">
          <a-input v-model:value="accountForm.phoneNumber" placeholder="请输入手机号" autocomplete="off" />
        </a-form-item>
        <a-form-item label="性别" name="sex">
          <a-radio-group v-model:value="accountForm.sex">
            <a-radio value="1">男</a-radio>
            <a-radio value="2">女</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item
          label="密码"
          name="password"
          v-if="!teacherId"
          extra="8-10位，数字、大写字母、小写字母的组合，三者缺一不可"
        >
          <a-input-password v-model:value="accountForm.password" placeholder="请输入密码" autocomplete="new-password" />
        </a-form-item>
        <a-form-item label="确认密码" name="confirmPassword" v-if="!teacherId">
          <a-input-password
            v-model:value="accountForm.confirmPassword"
            placeholder="请输入密码"
            autocomplete="new-password"
          />
        </a-form-item>
      </a-form>
    </div>

    <!-- 授课信息 -->
    <div class="teacher-add-content app-surface">
      <div class="content-title"><span></span>2. 授课信息</div>
      <a-form ref="classFormRef" :model="classForm" :rules="classRules" :label-col="labelCol" :wrapper-col="wrapperCol">
        <a-form-item label="授课年级" name="gradeId">
          <a-select allow-clear v-model:value="classForm.gradeId" placeholder="请选择授课年级">
            <a-select-option v-for="item in gradeList" :key="item.dictValue" :value="item.dictValue">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="授课学科" name="subjectId">
          <a-select allow-clear v-model:value="classForm.subjectId" placeholder="请选择授课学科">
            <a-select-option v-for="item in subjectList" :key="item.dictValue" :value="item.dictValue">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="授课班级" name="classIds">
          <a-select
            allow-clear
            v-model:value="classForm.classIds"
            mode="multiple"
            placeholder="请选择授课班级"
            class="multiple-select"
          >
            <a-select-option v-for="item in classList" :key="item.classId" :value="item.classId">
              {{ item.className }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </div>

    <!-- 提交按钮 -->
    <a-row class="teacher-add-btn app-surface">
      <a-col :span="5"></a-col>
      <a-col :span="13" style="display: flex">
        <a-button class="default-btn" @click="goBack" style="margin-right: 30px">取消</a-button>
        <a-button type="primary" class="primary-btn" @click="submitForm">提交</a-button>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { createTeacher, editTeacher, getTeacherInfo } from '@/api/adminEducation/teacherIndex'
import { getClassPage, getDictList } from '@/api/common/index'
import type { dictListResponse } from '@/api/common/type'
import { selectEnum } from '@/enum/common'
import { decrypt } from '@/utils/crypto'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import { h, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// 类型
interface AccountRuleForm {
  teacherName: string
  phoneNumber: string
  sex: string
  password: string
  confirmPassword: string
}
const route = useRoute()
const router = useRouter()

// 状态
const teacherId = ref('')
const subjectList = ref<dictListResponse[]>([]) // 学科字典列表
const gradeList = ref<dictListResponse[]>([]) // 年级字典列表
const classList = ref<any[]>([]) // 班级字典列表
// 表单数据-账号信息
const accountForm = reactive<AccountRuleForm>({
  teacherName: '',
  phoneNumber: '',
  sex: '',
  password: '',
  confirmPassword: '',
})
// 表单校验规则-授课信息
const classForm = reactive<{
  gradeId: string | undefined
  subjectId: string | undefined
  classIds: string[] | []
}>({
  gradeId: undefined,
  subjectId: undefined,
  classIds: [],
})
const accountFormRef = ref()
const classFormRef = ref()
const labelCol = { span: 5 }
const wrapperCol = { span: 13 }
// 密码一致性校验
const validatePasswordMatch = async (_rule: any, value: any) => {
  if (!value) {
    return Promise.reject('请再次输入密码')
  } else if (value !== accountForm.password) {
    return Promise.reject('两次输入密码不一致')
  }
  return Promise.resolve()
}
const rules: Record<string, Rule[]> = {
  teacherName: [{ required: true, message: '请输入教师姓名', trigger: 'blur' }],
  phoneNumber: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入正确的11位手机号', trigger: 'blur' },
  ],
  sex: [{ required: true, message: '请选择性别', trigger: 'change' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 10, message: '密码长度为8-10位', trigger: 'blur' },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,10}$/,
      message: '8-10位，数字、大写字母、小写字母的组合，三者缺一不可',
      trigger: 'blur',
    },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validatePasswordMatch, trigger: 'blur' },
  ],
}
const classRules: Record<string, Rule[]> = {
  gradeId: [{ required: true, message: '请选择授课年级', trigger: 'change' }],
  subjectId: [{ required: true, message: '请选择授课学科', trigger: 'change' }],
  classIds: [{ required: true, message: '请选择授课班级', trigger: 'change' }],
}

// 保存
const submitForm = async () => {
  if (!accountFormRef.value || !classFormRef.value) return

  try {
    // 同时校验两个表单
    await Promise.all([accountFormRef.value.validate(), classFormRef.value.validate()])

    const params = {
      ...accountForm,
      ...classForm,
    }

    if (teacherId.value) {
      // 编辑教师
      handleEdit({ teacherId: teacherId.value, ...params })
    } else {
      // 新增教师
      handleCreate(params)
    }
  } catch (error) {
    console.log('表单校验失败', error)
  }
}

// 新增教师
const handleCreate = async (params: any) => {
  try {
    const res = await createTeacher(params)
    if (res) {
      message.success('新增教师成功')
      goBack()
    } else {
      message.error('新增教师失败')
    }
  } catch (error) {
    console.error('新增教师失败', error)
  }
}
// 编辑教师
const handleEdit = async (params: any) => {
  try {
    const res = await editTeacher(params)
    if (res) {
      message.success('编辑教师成功')
      goBack()
    } else {
      message.error('编辑教师失败')
    }
  } catch (error) {
    console.error('编辑教师失败', error)
  }
}

// 返回
const goBack = () => {
  router.back()
}

// 获取教师信息
const getInfo = async (teacherId: string) => {
  const res = await getTeacherInfo({ teacherId })
  if (res) {
    accountForm.teacherName = res.teacherName || ''
    accountForm.phoneNumber = res.phoneNumber || ''
    accountForm.sex = res.sex || ''
    classForm.subjectId = res.subjectId || undefined

    // 先获取班级列表，再设置选中的值
    const classIds = res.classInfoList?.map(item => item.classId).filter((id): id is string => id !== undefined) || []
    if (res.gradeId) {
      await getClassPage({ gradeId: res.gradeId })
      classForm.gradeId = res.gradeId
      // 等待下一个 tick 后再设置 classId，确保班级列表已经加载
      nextTick(() => {
        classForm.classIds = classIds
      })
    }
  }
}

// 获取班级列表
const getClassData = async (gradeId: string) => {
  // 获取联动班级
  const res = await getClassPage({
    gradeId: gradeId,
    pageNo: 1,
    pageSize: 20,
  })
  classList.value = res?.list || []
}

// 获取字典数据
const getDictData = async (type: string[]) => {
  const res = await getDictList({ dictTypes: type })
  const resData = res || []

  // 遍历返回的字典数据，根据 dictType 分别赋值
  resData.forEach(item => {
    if (item.dictType === selectEnum.SUBJECT) {
      subjectList.value = item.dictTypeList || []
    } else if (item.dictType === selectEnum.GRADE) {
      gradeList.value = item.dictTypeList || []
    }
  })
}

onMounted(() => {
  getDictData([selectEnum.GRADE, selectEnum.SUBJECT])
  // 从路由参数获取信息
  const teacherIdStr = route.query.teacherId as string
  if (teacherIdStr) {
    teacherId.value = decrypt(teacherIdStr)
    console.log('teacherId:', teacherId.value)
    getInfo(teacherId.value)
  }
})

watch(
  () => classForm.gradeId,
  newVal => {
    if (newVal) {
      classForm.classIds = []
      getClassData(newVal)
    }
  }
)
</script>

<style scoped lang="scss">
.teacher-add {
  width: 100%;
  height: 100%;
  .teacher-add-header {
    display: flex;
    align-items: center;
    .title {
      height: 24px;
      display: inline-block;
      color: #111827eb;
      font-size: 18px;
      font-weight: 700;
      line-height: 24px;
      padding-left: 30px;
    }
  }
  .teacher-add-content {
    margin-top: 15px;
    border: 1px solid #e7ecf3;

    .content-title {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      padding: 15px;
      font-size: 16px;
      font-weight: 700;
      line-height: 24px;
      color: #111827eb;
      background: #fbfcfd;
      border-bottom: 1px solid #e7ecf3;
      border-radius: 18px 18px 0 0;
      span {
        display: inline-block;
        width: 4px;
        height: 16px;
        background-color: #ec7a2e;
        margin-right: 8px;
        border-radius: 2px;
      }
    }
  }
  .teacher-add-btn {
    padding: 15px;
    margin-top: 15px;
    display: flex;
  }
}
.multiple-select {
  :deep(.ant-select-selector) {
    min-height: 44px !important;
    height: auto !important;
    max-height: none !important;
    padding: 4px 8px !important;

    .ant-select-selection-overflow {
      gap: 6px;
      flex-wrap: wrap;
    }

    .ant-select-selection-item {
      height: 32px;
      line-height: 32px !important;
      padding: 0 12px;
      margin: 2px 0;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 8px;
      color: #c2410c;
      font-size: 14px;

      .ant-select-selection-item-remove {
        color: #f97316;

        &:hover {
          color: #c2410c;
        }
      }
    }

    .ant-select-selection-search {
      margin-inline-start: 0 !important;
    }

    .ant-select-selection-placeholder {
      line-height: 36px;
    }
  }
}
</style>
