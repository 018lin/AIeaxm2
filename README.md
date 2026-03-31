// 文档：前端新增教师端页面与路由说明（简要）

# 教师端新增页面

- 讲评录制：`/teacher/lecture/record`
- 课堂讲评管理：`/teacher/lecture/manage`
- 选题界面：`/teacher/item-select`
- 题目详情编辑：`/teacher/question/edit/:id`
- 作业/试卷管理：`/teacher/assignments`
- 作业/试卷预览：`/teacher/assignments/preview/:id`
- 批改管理：`/teacher/grading/manage`
- 批改详情视图：`/teacher/grading/detail/:id`
- 在线发布确认：`/teacher/publish/confirm/:id`
 - 扫描与OCR识别中心：`/teacher/scan-center`
 - 扫描数据采集：`/teacher/scan-collect`
 - 生成巩固作业：`/teacher/homework/generate`
- 课程管理：`/teacher/course/manage`
- 学生成绩录入：`/teacher/scores/entry`
 - 个人学情报告（老师端）：`/teacher/student-report`
 - 批改汇总：`/teacher/grading-summary`
 - 选择题库：`/teacher/select-repo`

## 菜单重构（教师端）

- 调整菜单分组与绑定，移除不合理的顶级菜单：
  - 移除 “新建题目” 顶级菜单（保留路由，仅作为页面内按钮进入）
  - 新增分组 “作业与批改”，包含：作业/试卷管理、生成巩固作业、扫描数据采集、批改管理、批改汇总、自动组卷设置
  - 新增分组 “课堂讲评”，包含：讲评管理、讲评录制
  - 新增独立菜单：课程管理、成绩录入
  - 分组 “题库与错题” 包含：题库列表、选择题库、题目统计、错题重组、班级共性错题（含参数配置）

> 以上结构在 `src/config/mock/menu.js`，侧边栏渲染在 `src/components/layout/Sidebar.vue`（通过 `getMenuByRole` 注入）。

## 路由常量

统一在 `src/config/routes.ts` 管理：

```
TEACHER_ASSIGNMENT_MANAGE: '/teacher/assignments'
TEACHER_ASSIGNMENT_PREVIEW: '/teacher/assignments/preview/:id'
TEACHER_GRADING_MANAGE: '/teacher/grading/manage'
TEACHER_GRADING_DETAIL: '/teacher/grading/detail/:id'
TEACHER_PUBLISH_CONFIRM: '/teacher/publish/confirm/:id'
TEACHER_LECTURE_RECORD: '/teacher/lecture/record'
TEACHER_LECTURE_MANAGE: '/teacher/lecture/manage'
TEACHER_ITEM_SELECT: '/teacher/item-select'
TEACHER_QUESTION_EDIT: '/teacher/question/edit/:id'
TEACHER_SCAN_CENTER: '/teacher/scan-center'
TEACHER_SCAN_COLLECT: '/teacher/scan-collect'
TEACHER_GENERATE_HOMEWORK: '/teacher/homework/generate'
TEACHER_COURSE_MANAGE: '/teacher/courses'
TEACHER_SCORE_ENTRY: '/teacher/scores/entry'
```

## 页面说明

- 讲评录制（`pages/teacher/LectureRecord.vue`）
  - 表单：标题、班级选择、音视频上传（不自动上传，mock预览/保存）
  - 变量来源：`config/mock/assignment.js`（班级选项）
- 课堂讲评管理（`pages/teacher/LectureManage.vue`）
  - 列表：标题、班级、时长、创建时间，操作（播放/编辑/删除）
  - 变量来源：复用 `assignment.js` 的作业列表生成示例讲评数据
- 选题界面（`pages/teacher/ItemSelect.vue`）
  - 左侧分类树，右侧筛选（难度/题型/来源/使用频次）与题目列表
  - 变量来源：`assignment.js` 的 `creation.questionSelection`
- 题目详情编辑（`pages/teacher/QuestionEdit.vue`）
  - 表单：题干、学科、题型、难度、答案、解析
  - 变量来源：`questionBank.js`（题目与筛选选项）
- 批改与发布相关页面均使用 `assignment.js` 提供的统计与管理数据进行展示
 - 发布确认页（`pages/teacher/PublishConfirm.vue`）新增“通知设置”（站内通知/短信/钉钉）与“通知时间”选项，答案公布策略与联动保持一致。
 - 扫描与OCR识别中心（`pages/teacher/ScanCenter.vue`）
   - 左侧“扫描任务列表”：任务名、页数、状态（待识别/识别中/已识别/失败）、进度。
   - 右侧“OCR识别面板”：上传扫描件、识别按钮、识别结果预览（题目与置信度）。
   - 下方“投递操作”：投递到作业生成或批改流程（mock接口）。
   - 数据来源：`services/ocrScanner.ts` 与 `config/mock/assignment.js`；服务层提供 `importFromOCR` 与 `ingestOCR`（mock）。
 - 扫描数据采集（`pages/teacher/ScanCollect.vue`）
   - 任务列表：从作业列表生成扫描任务，支持开始/暂停/完成（mock）
   - 上传：使用 Upload 组件选择扫描图片，统一不自动上传
 - 生成巩固作业（`pages/teacher/GenerateHomework.vue`）
   - 表单：分层选择与班级选择，来源 `assignment.js`
   - 动作：生成预览与发布确认，跳转到对应路由（mock id）
 - 课程管理（`pages/teacher/CourseManage.vue`）
   - 列表：基于 `dashboard.js` 的班级统计生成课程数据
- 学生成绩录入（`pages/teacher/ScoreEntry.vue`）
  - 表：学生列表来源 `dashboard.js`；科目来源 `student.js`

- 个人学情报告（老师端）（`pages/teacher/StudentReport.vue`）
  - 概览：总分、排名/总人数、提升幅度
  - KPI：近7天练习次数、正确率、作业完成度
  - 科目进度：进度条 + 等级 + 薄弱点标签
  - 数据来源：`getStudentReport()`（统一入口 `src/config/index.js`）

- 选择题库（`pages/teacher/SelectRepo.vue`）
  - 筛选：学科、难度
  - 左侧：知识点树（来自 `knowledgePoints`）
  - 右侧：题目列表（支持预览/选择）
  - 数据来源：`src/config/mock/questionBank.js`（`questionList`、`knowledgePoints`、`questionFilterOptions`、`questionStats`）

- 自动组卷设置（`pages/teacher/AutoPaper.vue`）
  - 题目选择：分类标签与筛选（难度/题型/来源/使用频次）
  - 发布设置：目标班级、发布时间、提交与显示配置
  - 分层概览：层级题量/时限/及格分与自动分配规则预览
  - 数据来源：`src/config/mock/assignment.js`（`creation.questionSelection`、`creation.publishSettings`、`creation.tieredSettings`）

- 题目统计（`pages/teacher/ItemStats.vue`）
  - 概览：题库总数、本月新增、本月使用、已发布
  - 难度分布：进度条表示比例
  - 使用趋势：近12月使用次数（Mock）
  - 题目分析：近期作业题目分析（正确率/用时/常见错误）
  - 数据来源：`src/config/mock/questionBank.js`（`questionStats`、`questionUsageData`）与 `src/config/mock/assignment.js`（`statistics.questionAnalysis`）

- 错题重组（`pages/teacher/RecomposeErrors.vue`）
  - 班级常见错题：频次/难度/建议，支持加入重组池
  - 学生错题：个人错题列表，支持加入重组池
  - 生成：Mock 生成“个性化训练/试卷”
  - 数据来源：`src/config/mock/report.js`（`errorAnalysis.frequentErrors`）与 `getStudentMistakes()`

- 班级共性错题（`pages/teacher/ClassErrors.vue`）
  - 班级提交：提交率/平均分/通过率
  - 分数分布：区间统计
  - 共性错题Top：按题目分析聚合常见错误标签
  - 数据来源：`src/config/mock/assignment.js`（`statistics.classSubmissions`、`statistics.scoreDistribution`、`statistics.questionAnalysis`）

- 分层设置（`pages/teacher/LayerSettings.vue`）
  - 层级配置：题量、时限、及格分（前端可编辑控件）
  - 自动分配规则：开启开关与规则列表
  - 数据来源：`src/config/mock/assignment.js`（`creation.tieredSettings`）

- 批改汇总（`pages/teacher/GradingSummary.vue`）
  - 概览：总提交、总人数、提交率、平均分
  - 班级提交：表格展示各班级提交率/平均分/通过率
  - 分数分布：区间百分比进度条
  - 题目分析：正确率、平均用时、常见错误
  - 数据来源：`src/config/mock/assignment.js` 中 `statistics`

### 题库列表（`pages/teacher/QuestionBankList.vue`）
- 顶部按钮：
  - `新建题目`：跳转到 `/teacher/question-new` 新建页面。
  - `批量导入`：选择 JSON 文件导入题目数组，字段缺失自动补齐为草稿。
- 操作栏按钮：
  - `批量编辑`：对选中题目统一设置难度/状态。
  - `导出题目`：将当前题库导出为 JSON 文件。
- 列表行操作：
  - `查看`：跳转到题目编辑页的只读模式（`?view=1`）。
  - `编辑`：跳转到题目编辑页。
  - `复制题目`：生成新 ID、设为草稿并置顶。
  - `加入作业`：跳转到选题页面，附带 `add=<题目ID>` 参数。
  - `使用统计`：打开使用趋势对话框（Mock）。
  - `删除题目`：二次确认后从列表移除。
- 过滤与排序：支持学科、难度、题型、知识点过滤；支持创建时间/更新时间/难度/使用频次排序。
- 数据来源：`src/config/mock/questionBank.js`（题目列表、筛选选项、使用统计）。

## 使用说明

- 所有页面使用 `ant-design-vue` 组件库，并已在 `src/main.ts` 全局注册。
- 所有样式采用项目现有的 `soft-card`、`page-wrap` 设计风格，去除 Tailwind `@apply`，使用原生 CSS 保证可用与性能。
- 为保证演示完整性，页面状态均包含：加载中、空状态、错误提示的基础形态（mock）。

## 开发约束

- 变量统一来源于 `src/config` 与 `src/config/mock`，避免重复定义。
- 页面路由通过 `src/router/index.ts` 注册，路径字符串统一使用 `ROUTES` 常量。
- 修改产生新功能或影响原有操作时，同步更新本 README。

## 学生端页面与数据源（学生端）

- 我的错题本（`pages/student/Mistakes.vue`）
  - 数据来源：`getStudentMistakes()` 获取错题列表；学科选项来自 `getMockData('common.subjects')`；不在页面内定义本地 mock。
  - 字段映射：将学科中文名称映射为统一的学科 ID（如 `数学` → `math`）；难度中文映射为 `easy|medium|hard`；`mastered` 映射为状态 `mastered/pending`；`lastWrongAt` 用作 `createdAt`；`chapter` 映射到 `knowledgePoints`。
  - 统一常量：筛选项优先从 `@/config` 获取（如需拓展可在 `src/config/mock/student.js` 增加配置）。
  - 示例：
    ```ts
    import { getStudentMistakes, getMockData } from '@/config'
    const subjects = getMockData('common.subjects')
    const res = getStudentMistakes()
    // 将 res.mistakes 映射为页面使用结构后再渲染
    ```

## 学生端 UI 样式优化与容错显示说明

- 范围：个人学情报告（StudentReport.vue）、学习资源推荐（Resources.vue）、我的错题本（Mistakes.vue）。
- 目标：在不改变业务逻辑的前提下统一视觉风格，提升卡片与筛选区的可读性与层次感，保持对中文友好展示。
- 主要改动：
  - 背景统一为柔和的渐变（`#f5f7fa → #edf2f7`），筛选面板采用玻璃化白卡（轻边框、轻阴影、圆角）。
  - 资源与错题卡片统一圆角与阴影强度，标签圆角与间距统一，避免密集堆叠造成“拥挤感”。
  - 图表容器统一为卡片风格（白底、轻边框、圆角），不影响图表的数据与交互。
- 仪表板（Dashboard.vue）数值容错显示：
  - 新增 `safeNumber` 保证 KPI 显示为有效数字，避免 `NaN%`；新增 `trendOf` 与 `trendArrow` 作为占位趋势，后续接入真实数据时可替换。
  - 使用示例：

    ```ts
    // 保证展示为有效数值，避免 NaN
    function safeNumber(v: any): number {
      const n = Number(v)
      if (!isFinite(n) || isNaN(n)) return 0
      return n
    }
    // 趋势占位，接入后端后替换
    function trendOf(key: string): number {
      switch (key) {
        case 'practiceCount': return 15
        case 'accuracy': return 3
        case 'homeworkCompletion': return -2
        default: return 0
      }
    }
    function trendArrow(val: number): string {
      if (val > 0) return '↑'
      if (val < 0) return '↓'
      return '→'
    }
    ```

- 使用与兼容：
  - 无需额外操作，样式优化与容错显示开箱即用；不影响现有路由、数据源与交互逻辑。
  - 若业务需要切换主题或自定义配色，可通过 `student-theme` 容器设置 CSS 变量进行扩展。


## P0 导航修复说明（教师端）

- 新增并统一的路由常量：
  - `ROUTES.TEACHER_DASHBOARD = '/teacher/dashboard'`
  - `ROUTES.TEACHER_QUESTION_BANK = '/teacher/question-bank'`
  - `ROUTES.TEACHER_STUDENT_REPORT = '/teacher/student-report'`
  - `ROUTES.TEACHER_GRADING_SUMMARY = '/teacher/grading-summary'`

- 仪表盘快捷操作更新：
  - “布置作业” → `ROUTES.TEACHER_GENERATE_HOMEWORK`
  - “题库管理” → `ROUTES.TEACHER_QUESTION_BANK`
  - “学情分析” → `ROUTES.TEACHER_STUDENT_REPORT`
  - “班级管理” → `ROUTES.TEACHER_COURSE_MANAGE`
  - “查看详情（班级概览）” → `ROUTES.TEACHER_COURSE_MANAGE?classId=<ID>`

- 作业/试卷管理页按钮导航：
  - “新建作业/试卷” → `ROUTES.TEACHER_GENERATE_HOMEWORK`
  - “预览” → `ROUTES.TEACHER_ASSIGNMENT_PREVIEW.replace(':id', <ID>)`
  - “发布” → `ROUTES.TEACHER_PUBLISH_CONFIRM.replace(':id', <ID>)`
  - “编辑” → `ROUTES.TEACHER_GENERATE_HOMEWORK?mode=edit&id=<ID>`
  - “批量发布” → `ROUTES.TEACHER_PUBLISH_CONFIRM.replace(':id', 'batch')?ids=<ID1,ID2,...>`

- 批改管理页按钮导航：
  - “进入批改” → `ROUTES.TEACHER_GRADING_DETAIL.replace(':id', <ID>)`
  - “详情” → `ROUTES.TEACHER_GRADING_SUMMARY?id=<ID>`

> 本次为 P0 导航修复，不涉及数据结构与接口改造；后续 P1 将补齐发布流程与闭环逻辑。
## 教师端页面质量审查与修复说明

为保障老师端静态页面交付质量，已建立统一审查标准并完成首轮差异修复：

- 审查标准（像素级与功能比对）
  - 布局与视觉：严格 1:1 还原布局；核对间距、字体、颜色；验证图标/图片展示。
  - 功能与交互：按钮、筛选、表格等控件齐全且位置准确；实现颗粒度与设计一致；核查响应式断点表现。
- 差异修复规范
  - 按钮缺失即刻补齐，统一使用 `src/config/index.js` 的 `TEACHER_BUTTONS` 管理文案；保证状态与样式一致。
  - 修复完成后进行二次验证：页面自测 + 预览确认，无控制台报错，无视觉断裂。
- 本次修复内容（按钮补齐与统一文案）
  - 自动组卷（`pages/teacher/AutoPaper.vue`）：新增“重置”“保存设置”按钮；预览按钮保留。
  - 分层设置（`pages/teacher/LayerSettings.vue`）：新增“重置”“保存设置”。
  - 班级共性错题（`pages/teacher/ClassErrors.vue`）：新增“导出错题”“生成巩固作业”。
  - 题目统计（`pages/teacher/ItemStats.vue`）：新增“刷新数据”“导出报表”。
  - 错题重组（`pages/teacher/RecomposeErrors.vue`）：新增“清空重组池”“导出错题”，并统一“生成个性化训练/试卷”文案。

### 问题跟踪表（示例）

| 页面 | 差异类型 | 缺失要素 | 修复措施 | 复验证结论 |
| --- | --- | --- | --- | --- |
| 自动组卷 | 按钮缺失 | 保存/重置 | 补充按钮，统一文案 | 预览通过 |
| 分层设置 | 按钮缺失 | 保存/重置 | 补充按钮，统一文案 | 预览通过 |
| 班级错题 | 按钮缺失 | 导出/生成作业 | 补充按钮，统一文案 | 预览通过 |
| 题目统计 | 按钮缺失 | 导出/刷新 | 补充按钮，统一文案 | 预览通过 |
| 错题重组 | 按钮缺失 | 清空/导出 | 补充按钮，统一文案 | 预览通过 |

> 变量统一：新增 `TEACHER_BUTTONS` 于 `src/config/index.js`，避免页面重复定义文案；后续新增按钮请优先复用。

## 变更记录（类型与 Mock 修复）

- 类型声明对齐：
  - 在 `src/config/index.d.ts` 明确导出 `TEACHER_BUTTONS` 并枚举具体键（如 `saveSettings/reset/exportErrors/...`），统一使用 `label` 字段，提升模板类型推断稳定性。
  - 在 `src/config/mock/index.d.ts` 的 `QuestionStats` 中新增可选数值字段 `monthlyAdded`、`monthlyUsage`，与页面展示一致。
- Mock 数据补充：
  - 在 `src/config/mock/questionBank.js` 的 `questionStats` 中补充 `monthlyAdded: 62` 与 `monthlyUsage: 178`，避免统计卡片空白并提升演示完整性。
- 使用提示：
  - 页面按钮文案统一从 `@/config` 的 `TEACHER_BUTTONS` 读取，新增按钮请先在配置中添加，避免页面重复定义。
### 批改详情页更新
- 新增“试卷预览”标签：可在题目视角右侧切换查看试卷式样图片，路径 `/zuoye.png`（置于 `public` 目录）。
- 题目视角：题干/答案/解析与统计条，AI打分依据（得分点与权重）与学生命中展示；支持就地“人工修订”与“点评”，落审计。
- 学生视角：抽屉查看整体表现（总分、正确/错误/部分得分、用时），支持单题修订/点评。

### 批改管理入口修正
- “详情”统一跳转到批改详情页，不再进入“批改汇总”。
