# 配置系统使用指南

## 📁 目录结构

```
src/config/
├── index.js              # 统一入口
├── index.d.ts           # TypeScript类型定义
├── design-tokens.js      # 设计系统
├── routes.ts            # 路由配置（保留）
└── mock/                # 数据管理
    ├── index.js         # 数据中心
    ├── menu.js          # 菜单配置
    ├── auth.js          # 认证配置
    ├── student.js       # 学生端数据
    ├── admin.js         # 管理员数据
    ├── charts.js        # 图表配置
    ├── milestones.js    # 里程碑数据
    ├── dashboard.js     # 仪表盘数据
    ├── report.js        # 报告数据
    └── assignment.js    # 作业数据
```

## 🚀 快速使用

### 1. 统一导入
```javascript
// 导入常量和配置
import { 
  STUDENT_KPI_CARDS, 
  UI_SIZES, 
  MISTAKE_FILTERS,
  mockReportSubjects,
  mockReportKpis
} from '@/config';

// 导入数据获取函数
import { 
  getMockData, 
  mockApiCall,
  getStudentMistakes,
  getStudentDashboard
} from '@/config';
```

### 2. 获取数据
```javascript
// 获取菜单
const menu = getMockData('system.menu.items');

// 获取学生仪表盘
const dashboard = getMockData('pages.dashboard');

// 获取错题数据
const mistakes = getStudentMistakes();

// 模拟API调用
const response = await mockApiCall('/student/dashboard');
```

### 3. 使用配置常量
```javascript
// 使用错题筛选配置
const knowledgePoints = MISTAKE_FILTERS.knowledgePoints;
const timeRanges = MISTAKE_FILTERS.timeRanges;
const assignmentSources = MISTAKE_FILTERS.assignmentSources;

// 使用UI尺寸配置
const cardSize = UI_SIZES.card.medium;

// 使用KPI卡片配置
const kpiCards = STUDENT_KPI_CARDS;
```

## 📊 数据管理规范

### 统一数据源
- ✅ **推荐**: 所有数据从 `config/mock/` 目录获取
- ❌ **避免**: 在页面组件中定义mock数据

### 数据分类
- **学生端数据**: `config/mock/student.js`
  - 仪表盘数据: `mockDashboard`
  - 错题数据: `mockMistakes`
  - 筛选配置: `mistakeFilters`
  - KPI配置: `kpiCards`
  
- **管理员数据**: `config/mock/admin.js`
  - 用户管理: `mockUsers`
  - 角色配置: `roleColumns`
  
- **通用配置**: `config/index.js`
  - UI尺寸: `UI_SIZES`
  - 设计令牌: `DESIGN_TOKENS`

### 数据路径

- **菜单**: `system.menu.items`
- **认证**: `system.auth.mockUsers`
- **学生数据**: `system.student.mockDashboard`
- **管理员数据**: `system.admin.users.mockData`
- **页面数据**: `pages.{milestones|dashboard|report|assignment}`
- **图表配置**: `charts.{chartName}`
- **通用数据**: `common.{userInfo|subjects|grades|classes}`

## 🔧 开发规范

### 新增数据
1. 在对应的mock文件中添加数据结构
2. 在 `config/index.js` 中导出常量或函数
3. 在 `config/index.d.ts` 中添加类型定义
4. 在页面中导入使用

### 修改数据
1. 直接修改mock文件中的数据
2. 确保类型定义同步更新
3. 检查相关页面的引用

### 删除数据
1. 从mock文件中删除数据
2. 从导出文件中删除相关导出
3. 更新类型定义文件
4. 检查并更新所有引用页面

## ✨ 特性

- 🎯 **统一管理** - 所有配置集中管理，避免数据分散
- 🔧 **类型安全** - 完整的TypeScript类型定义
- 🚀 **高性能** - 按需加载支持
- 🌐 **中文友好** - 完整中文支持
- 🛠️ **开发友好** - 丰富的工具函数和清晰的数据结构

---
*统一数据管理，提高开发效率！*

## 📘 生成巩固作业使用说明（教师端）

- 页面入口：`生成巩固作业`，四步流程：`选择来源` → `结构设计` → `题目编排` → `预览校验`
- 选择来源：
  - 按钮：`试题篮`、`按知识点`、`错题本`、`班级共性错题`、`AI生成类似题`
  - 开关：`追加模式`（累积候选并自动去重）、`清空来源池`
  - 统计：显示“来源池：N 题”
- 结构设计：
  - 设置标题、总分、预计时长与题型配比（选择/填空/解答），点击“按配比自动编排”
- 题目编排：
  - 操作：`替换`、`生成类似题替换`、`移除`、`添加随机题`
- 预览校验：
  - 统计卡片：题型配比、难度分布、预计总时长、重复率、知识点覆盖（中文显示）
  - 来源构成：显示试题篮/知识点/错题本/班级共性错题/AI类似题占比
  - 达标校验：输入“知识点覆盖目标”与“重复率上限(%)”，显示“达标/未达标”
  - 操作：`一键优化达标`（自动补齐题型、控制时长并提升覆盖）、`加入试题篮`、`导出PDF`、`发布确认`
- Mock数据与中文：
  - 所有新增能力先走中文 mock，接口签名保留，后续可无缝接入真实服务
  - 不引入日志与国际化，页面统一中文
