<template>
  <div class="student-add">
    <!-- 标题栏 -->
    <div class="student-add-header">
      <a-button class="default-btn" :icon="h(ArrowLeftOutlined)" @click="goBack">返回</a-button>
      <span class="title">{{ studentId ? '编辑学生' : '新建学生' }}</span>
    </div>
    <!-- 账号信息 -->
    <div class="student-add-content app-surface">
      <div class="content-title"><span></span>1. 账号信息</div>
      <a-form ref="accountFormRef" :model="accountForm" :rules="rules" :label-col="labelCol" :wrapper-col="wrapperCol">
        <a-form-item label="真实姓名" name="studentName">
          <a-input v-model:value="accountForm.studentName" placeholder="请输入学生姓名" />
        </a-form-item>
        <a-form-item label="学号" name="studentCode">
          <a-input v-model:value="accountForm.studentCode" placeholder="请输入学号" />
        </a-form-item>
        <!-- <a-form-item label="用户名" name="userName" extra="4-16位，由数字、大写字母或小写字母组成，三者任意组合">
          <a-row>
            <a-col :span="20">
              <a-input v-model:value="accountForm.userName" placeholder="请输入用户名" />
            </a-col>
            <a-col :span="4" class="create-name-btn">
              <a-button type="primary" link @click="createUserName"> 系统自动生成 </a-button>
            </a-col>
          </a-row>
        </a-form-item> -->
        <a-form-item label="性别" name="sex">
          <a-radio-group v-model:value="accountForm.sex">
            <a-radio value="1">男</a-radio>
            <a-radio value="2">女</a-radio>
          </a-radio-group>
        </a-form-item>
        <!-- <a-form-item
          label="密码"
          name="password"
          v-if="!studentId"
          extra="8-10位，数字、大写字母、小写字母的组合，三者缺一不可"
        >
          <a-input-password v-model:value="accountForm.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item label="确认密码" name="confirmPassword" v-if="!studentId">
          <a-input-password v-model:value="accountForm.confirmPassword" placeholder="请输入密码" />
        </a-form-item> -->
      </a-form>
    </div>

    <!-- 所在班级 -->
    <div class="student-add-content app-surface">
      <div class="content-title"><span></span>2. 所在班级</div>
      <a-form ref="classFormRef" :model="classForm" :rules="classRules" :label-col="labelCol" :wrapper-col="wrapperCol">
        <a-form-item label="所在年级" name="gradeId">
          <a-select allow-clear v-model:value="classForm.gradeId" placeholder="请选择所在年级">
            <a-select-option v-for="item in gradeList" :key="item.dictValue" :value="item.dictValue">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="所在班级" name="classId">
          <a-select allow-clear v-model:value="classForm.classId" placeholder="请选择所在班级">
            <a-select-option v-for="item in classList" :key="item.classId" :value="item.classId">
              {{ item.className }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </div>

    <!-- 提交按钮 -->
    <a-row class="student-add-btn app-surface">
      <a-col :span="5"></a-col>
      <a-col :span="13" style="display: flex">
        <a-button class="default-btn" @click="goBack" style="margin-right: 30px">取消</a-button>
        <a-button type="primary" class="primary-btn" @click="submitForm">提交</a-button>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { createStudent, editStudent, getStudentInfo } from '@/api/adminEducation/studentIndex'
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
  studentName: string
  studentCode: string
  // userName: string
  sex: string
  // password: string
  // confirmPassword: string
}
const route = useRoute()
const router = useRouter()

// 状态
const studentId = ref('')
const gradeList = ref<dictListResponse[]>([]) // 年级字典列表
const classList = ref<any[]>([]) // 班级字典列表
// 表单数据-账号信息
const accountForm = reactive<AccountRuleForm>({
  studentName: '',
  studentCode: '',
  // userName: '',
  sex: '',
  // password: '',
  // confirmPassword: '',
})
// 表单校验规则-授课信息
const classForm = reactive<{
  gradeId: string | undefined
  classId: string | undefined
}>({
  gradeId: undefined,
  classId: undefined,
})
const accountFormRef = ref()
const classFormRef = ref()
const labelCol = { span: 5 }
const wrapperCol = { span: 13 }
// // 密码一致性校验
// const validatePasswordMatch = async (_rule: any, value: any) => {
//   if (!value) {
//     return Promise.reject('请再次输入密码')
//   } else if (value !== accountForm.password) {
//     return Promise.reject('两次输入密码不一致')
//   }
//   return Promise.resolve()
// }
const rules: Record<string, Rule[]> = {
  studentName: [{ required: true, message: '请输入学生姓名', trigger: 'blur' }],
  studentCode: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  // userName: [
  //   { required: true, message: '请输入用户名', trigger: 'blur' },
  //   { min: 4, max: 16, message: '用户名长度为4-16位', trigger: 'blur' },
  //   {
  //     pattern: /^[a-zA-Z0-9]{4,16}$/,
  //     message: '4-16位，由数字、大写字母或小写字母组成，三者任意组合',
  //     trigger: 'blur',
  //   },
  // ],
  sex: [{ required: true, message: '请选择性别', trigger: 'change' }],
  // password: [
  //   { required: true, message: '请输入密码', trigger: 'blur' },
  //   { min: 8, max: 10, message: '密码长度为8-10位', trigger: 'blur' },
  //   {
  //     pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,10}$/,
  //     message: '8-10位，数字、大写字母、小写字母的组合，三者缺一不可',
  //     trigger: 'blur',
  //   },
  // ],
  // confirmPassword: [
  //   { required: true, message: '请再次输入密码', trigger: 'blur' },
  //   { validator: validatePasswordMatch, trigger: 'blur' },
  // ],
}
const classRules: Record<string, Rule[]> = {
  gradeId: [{ required: true, message: '请选择所在年级', trigger: 'change' }],
  classId: [{ required: true, message: '请选择所在班级', trigger: 'change' }],
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

    if (studentId.value) {
      // 编辑学生
      handleEdit({ studentId: studentId.value, ...params })
    } else {
      // 新增学生
      handleCreate(params)
    }
  } catch (error) {
    console.log('表单校验失败', error)
  }
}

// 新增学生
const handleCreate = async (params: any) => {
  try {
    const res = await createStudent(params)
    if (res) {
      message.success('新增学生成功')
      goBack()
    } else {
      message.error('新增学生失败')
    }
  } catch (error) {
    console.error('新增学生失败', error)
  }
}
// 编辑学生
const handleEdit = async (params: any) => {
  try {
    const res = await editStudent(params)
    if (res) {
      message.success('编辑学生成功')
      goBack()
    } else {
      message.error('编辑学生失败')
    }
  } catch (error) {
    console.error('编辑学生失败', error)
  }
}

// // 系统自动生成用户名
// const createUserName = async () => {
//   const res = await getRandomUsername()
//   if (res) {
//     accountForm.userName = res
//   }
// }

// 返回
const goBack = () => {
  router.back()
}

// 获取教师信息
const getInfo = async (studentId: string) => {
  const res = await getStudentInfo({ studentId })
  if (res) {
    accountForm.studentName = res.studentName || ''
    accountForm.studentCode = res.studentCode || ''
    // accountForm.userName = res.userName || ''
    accountForm.sex = res.sex || ''

    // 先获取班级列表，再设置选中的值
    if (res.gradeId) {
      await getClassData(res.gradeId)
      classForm.gradeId = res.gradeId
      // 等待下一个 tick 后再设置 classId，确保班级列表已经加载
      nextTick(() => {
        classForm.classId = res.classId
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
    if (item.dictType === selectEnum.GRADE) {
      gradeList.value = item.dictTypeList || []
    }
  })
}

onMounted(() => {
  getDictData([selectEnum.GRADE])
  // 从路由参数获取信息
  const studentIdStr = route.query.studentId as string
  if (studentIdStr) {
    studentId.value = decrypt(studentIdStr)
    console.log('studentId:', studentId.value)
    getInfo(studentId.value)
  }
})

watch(
  () => classForm.gradeId,
  newVal => {
    if (newVal) {
      classForm.classId = undefined
      getClassData(newVal)
    }
  }
)
</script>

<style scoped lang="scss">
.student-add {
  width: 100%;
  height: 100%;
  .student-add-header {
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
  .student-add-content {
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
  .student-add-btn {
    padding: 15px;
    margin-top: 15px;
    display: flex;
  }
  .create-name-btn {
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
