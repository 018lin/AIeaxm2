# IPTA 业务端 SQL 设计（homework_*）

## 概述
- 范围：面向 `/frontend` 业务端与 `/system-frontend` 管理端的“作业/试卷 + 错题 + 题库 + 推荐 + 报告 + 资源 + OCR”等核心业务，统一以 `homework_` 前缀建表。
- 依据：前端页面与服务的实体与字段习惯，示例：`src/pages/teacher/GenerateHomework.vue`、`src/services/questionBasket.ts`、`src/config/mock/assignment.js`、`src/config/mock/questionService.js`、`src/services/studentAssignment.ts`、`src/services/report.ts`、`src/composables/useMockService.ts` 等。
- 关联：用户、角色等系统表已存在，此处仅以外键字段引用（如 `creator_id`、`student_id`、`teacher_id`、`uploader_id`），不重复设计用户表。

## 命名与约定
- 表前缀：一律使用 `homework_`。
- 主键：`id BIGINT PRIMARY KEY AUTO_INCREMENT`，或在关联表使用复合唯一约束。
- 时间：`created_at`、`updated_at`、必要处 `published_at`、`submitted_at`、`graded_at`。
- 状态枚举：与前端保持一致，如 `draft|published|completed|expired`、`active|inactive|deleted` 等。
- 关联外键：`*_id` 指向现有系统表（用户/部门/租户/字典…），班级业务在本设计内提供 `homework_classes`。
- 索引：为高频查询字段建立索引（`assignment_id`、`question_id`、`student_id`、`class_id`、`type`、`difficulty`、`status`）。

## 与现有前端的贯通逻辑说明
- 作业创建/分层/发布：对应 `assignmentData.creation.*`（`src/config/mock/assignment.js`），落库到 `homework_assignments`、`homework_layers`、`homework_assignment_layer`、`homework_assignment_class`、`homework_assignment_question`。
- 试题篮与分发：对应 `src/services/questionBasket.ts` 的试题集合、分发日志，落库到 `homework_question_basket`、`homework_distribution_log`。
- 题库管理与收藏：对应 `src/config/mock/questionService.js`，落库到 `homework_questions`、`homework_question_option`、`homework_question_knowledge_*`、`homework_question_tag_*`、`homework_question_favorite_*`。
- 学生作业与提交：对应 `src/services/studentAssignment.ts`，落库到 `homework_submission`、`homework_submission_item`、`homework_grading_task`。
- 错题与复习：对应 `src/config/mock/student.js` 与 `src/services/revision.ts`，落库到 `homework_mistake_book`、`homework_mistake_review_task`、`homework_mistake_review_task_item`、`homework_class_common_error`。
- 推荐与讲评：对应 `src/pages/teacher/Recommendation.vue` 和 `src/config/mock/recommendation.js`、`src/services/lecture.ts`，落库到 `homework_recommendation`、`homework_lecture`（讲评元数据，选配）。
- 报告体系：对应 `src/services/report.ts` 与 `src/services/reportSystem.ts`，落库到 `homework_report`、`homework_report_share`。
- 资源管理：对应教务资源页与 Mock 接口（`useMockService` 的 `/affairs/resources`），落库到 `homework_resource`、`homework_resource_favorite`、`homework_resource_download`。
- OCR 扫描：对应 `OCRScan.vue` 场景与通用服务，落库到 `homework_ocr_task`、`homework_ocr_result`。

---

## 表设计与 SQL

### 1) 班级表：homework_classes
- 作用：标准化业务端的班级维度，支撑作业发布与统计。
- 字段：`name`、`grade`、`alias`、`teacher_id`、`member_count`、`status`、`created_at`、`updated_at`。
```sql
CREATE TABLE homework_classes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  grade VARCHAR(50) NOT NULL,
  alias VARCHAR(100) NULL,
  teacher_id BIGINT NULL,
  member_count INT DEFAULT 0,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_class_name_grade (name, grade),
  KEY idx_teacher (teacher_id)
);
```

### 2) 分层表：homework_layers
- 作用：分层教学维度（名称/难度），与作业关联。
- 字段：`name`、`difficulty`、`description`、`creator_id`、`status`。
```sql
CREATE TABLE homework_layers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  description VARCHAR(255) NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_layer_name (name)
);
```

### 3) 作业表：homework_assignments
- 作用：作业/试卷的主体信息。
- 字段：`title`、`type(homework|exam|practice)`、`subject`、`grade`、`difficulty`、`total_score`、`time_limit`、`status(draft|published|completed|expired)`、`creator_id`、`published_at`。
```sql
CREATE TABLE homework_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  grade VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NULL,
  total_score INT DEFAULT 100,
  time_limit INT DEFAULT 60,
  status int NOT NULL COMMENT '状态',
  published_at DATETIME NULL,
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  KEY idx_subject_grade (subject, grade),
  KEY idx_status (status)
);
```

### 4) 作业-分层关联：homework_assignment_layer
- 作用：作业与层的关联，支持按层编排题目与分发。
```sql
CREATE TABLE homework_assignment_layer (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  assignment_id BIGINT NOT NULL,
  layer_id BIGINT NOT NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_assign_layer (assignment_id, layer_id),
  KEY idx_layer (layer_id),
  KEY idx_assign (assignment_id)
);
```

### 5) 作业-班级发布：homework_assignment_class
- 作用：作业发布到班级的计划与约束。
- 字段：`publish_time`、`due_time`、`allow_late_submission`、`time_limit`、`submission_attempts`、`status`。
```sql
CREATE TABLE homework_assignment_class (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  assignment_id BIGINT NOT NULL,
  class_id BIGINT NOT NULL,
  publish_time DATETIME NOT NULL,
  due_time DATETIME NULL,
  allow_late_submission TINYINT(1) DEFAULT 0,
  time_limit INT NULL,
  submission_attempts INT DEFAULT 1,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_assign_class (assignment_id, class_id),
  KEY idx_due (due_time)
);
```

### 6) 作业-题目编排：homework_assignment_question
- 作用：作业内题目有序编排，含得分与层归属。
```sql
CREATE TABLE homework_assignment_question (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  assignment_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  layer_id BIGINT NULL,
  position INT NOT NULL,
  score INT DEFAULT 5,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_assign_question (assignment_id, question_id),
  KEY idx_assign_pos (assignment_id, position),
  KEY idx_layer (layer_id)
);
```

### 7) 题库：homework_questions
- 作用：题库主表，兼容多题型与难度、知识点/标签关系。
- 字段：`title`、`content`、`type(choice|blank|judge|answer|multiple_choice)`、`difficulty`、`subject`、`grade`、`score`、`estimated_time`、`status`、`creator_id`、`usage_count`、`correct_rate`。
```sql
CREATE TABLE homework_questions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  content TEXT NULL,
  type VARCHAR(30) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  grade VARCHAR(50) NOT NULL,
  score INT DEFAULT 5,
  estimated_time INT DEFAULT 5,
  status int NOT NULL COMMENT '状态',
  usage_count INT DEFAULT 0,
  correct_rate DECIMAL(5,2) DEFAULT 0.00,
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  KEY idx_type_diff (type, difficulty),
  KEY idx_subject_grade (subject, grade),
  KEY idx_status (status)
);
```

### 8) 题目选项：homework_question_option
- 作用：选择/多选题的选项与正误。
```sql
CREATE TABLE homework_question_option (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT NOT NULL,
  label VARCHAR(10) NOT NULL,
  content VARCHAR(500) NOT NULL,
  is_correct TINYINT(1) DEFAULT 0,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_question_label (question_id, label),
  KEY idx_question (question_id)
);
```

### 9) 知识点：homework_question_knowledge
- 作用：知识点字典（如“二次函数”等）。
```sql
CREATE TABLE homework_question_knowledge (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(200) NOT NULL,
  description VARCHAR(255) NULL,
  subject VARCHAR(50) NULL,
  grade VARCHAR(50) NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_kp_name (name)
);
```

### 10) 题目-知识点关系：homework_question_knowledge_rel
```sql
CREATE TABLE homework_question_knowledge_rel (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT NOT NULL,
  knowledge_id BIGINT NOT NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_q_k (question_id, knowledge_id),
  KEY idx_k (knowledge_id)
);
```

### 11) 标签字典：homework_question_tag
```sql
CREATE TABLE homework_question_tag (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_tag_name (name)
);
```

### 12) 题目-标签关系：homework_question_tag_rel
```sql
CREATE TABLE homework_question_tag_rel (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT NOT NULL,
  tag_id BIGINT NOT NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_q_t (question_id, tag_id)
);
```

### 13) 收藏夹：homework_question_favorite_folder
```sql
CREATE TABLE homework_question_favorite_folder (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  question_count INT DEFAULT 0,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_user_name (user_id, name)
);
```

### 14) 收藏关系：homework_question_favorite
```sql
CREATE TABLE homework_question_favorite (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  question_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  folder_id BIGINT NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_q_u (question_id, user_id),
  KEY idx_folder (folder_id)
);
```

### 15) 试题篮：homework_question_basket
- 作用：用户级试题篮（支持作业上下文）。
```sql
CREATE TABLE homework_question_basket (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  assignment_id BIGINT NULL,
  subject VARCHAR(50) NULL,
  grade VARCHAR(50) NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_u_q (user_id, question_id),
  KEY idx_assign (assignment_id)
);
```

### 16) 作业提交：homework_submission
```sql
CREATE TABLE homework_submission (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  assignment_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  status int NOT NULL COMMENT '状态',
  submitted_at DATETIME NULL,
  time_spent INT NULL,
  auto_score INT NULL,
  teacher_score INT NULL,
  final_score INT NULL,
  graded_at DATETIME NULL,
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_assign_student (assignment_id, student_id),
  KEY idx_status (status)
);
```

### 17) 作业提交题目：homework_submission_item
```sql
CREATE TABLE homework_submission_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  submission_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  answer_text TEXT NULL,
  is_correct TINYINT(1) NULL,
  score INT NULL,
  max_score INT NOT NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_s_q (submission_id, question_id)
);
```

### 18) 批改任务：homework_grading_task
```sql
CREATE TABLE homework_grading_task (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  assignment_id BIGINT NOT NULL,
  submission_id BIGINT NOT NULL,
  grader_id BIGINT NOT NULL,
  status int NOT NULL COMMENT '状态',
  feedback TEXT NULL,
  graded_at DATETIME NULL,
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_s_g (submission_id, grader_id)
);
```

### 19) 错题本：homework_mistake_book
```sql
CREATE TABLE homework_mistake_book (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  error_type VARCHAR(50) NULL,
  wrong_count INT DEFAULT 1,
  mastered TINYINT(1) DEFAULT 0,
  last_review_time DATETIME NULL,
  tags VARCHAR(255) NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_stu_q (student_id, question_id)
);
```

### 20) 复习任务：homework_mistake_review_task
```sql
CREATE TABLE homework_mistake_review_task (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id BIGINT NOT NULL,
  plan_type VARCHAR(20) NOT NULL,
  status int NOT NULL COMMENT '状态',
  progress_done INT DEFAULT 0,
  progress_total INT DEFAULT 0,
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号'
);
```

### 21) 复习任务明细：homework_mistake_review_task_item
```sql
CREATE TABLE homework_mistake_review_task_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  schedule_date DATE NOT NULL,
  count INT DEFAULT 1,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_task_q_date (task_id, question_id, schedule_date)
);
```

### 22) 班级共性错题：homework_class_common_error
```sql
CREATE TABLE homework_class_common_error (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  class_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  wrong_count INT DEFAULT 0,
  reasons VARCHAR(255) NULL,
  analysis TEXT NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_c_q (class_id, question_id)
);
```

### 23) 推荐记录：homework_recommendation
```sql
CREATE TABLE homework_recommendation (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id BIGINT NOT NULL,
  item_type VARCHAR(20) NOT NULL,
  item_id BIGINT NOT NULL,
  algorithm VARCHAR(50) NULL,
  confidence DECIMAL(4,2) NULL,
  reason VARCHAR(255) NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  KEY idx_student (student_id)
);
```

### 24) 讲评元数据（选配）：homework_lecture
```sql
CREATE TABLE homework_lecture (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  class_id BIGINT NULL,
  assignment_id BIGINT NULL,
  teacher_id BIGINT NULL,
  content TEXT NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  KEY idx_type (type)
);
```

### 25) 报告：homework_report
```sql
CREATE TABLE homework_report (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  level VARCHAR(20) NOT NULL,
  type VARCHAR(20) NOT NULL,
  subject VARCHAR(50) NULL,
  grade VARCHAR(50) NULL,
  class_id BIGINT NULL,
  student_id BIGINT NULL,
  period VARCHAR(50) NULL,
  data TEXT NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  KEY idx_level_type (level, type)
);
```

### 26) 报告分享：homework_report_share
```sql
CREATE TABLE homework_report_share (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  report_id BIGINT NOT NULL,
  share_type VARCHAR(20) NOT NULL,
  expiry_date DATETIME NULL,
  password VARCHAR(100) NULL,
  permissions VARCHAR(100) NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_report_share (report_id, share_type)
);
```

### 27) 教学资源：homework_resource
```sql
CREATE TABLE homework_resource (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(30) NOT NULL,
  subject VARCHAR(50) NULL,
  grade VARCHAR(50) NULL,
  source VARCHAR(50) NULL,
  uploader_id BIGINT NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  KEY idx_type (type)
);
```

### 28) 资源收藏：homework_resource_favorite
```sql
CREATE TABLE homework_resource_favorite (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  resource_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  UNIQUE KEY uk_r_u (resource_id, user_id)
);
```

### 29) 资源下载：homework_resource_download
```sql
CREATE TABLE homework_resource_download (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  resource_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  KEY idx_r (resource_id),
  KEY idx_u (user_id)
);
```

### 30) OCR 任务：homework_ocr_task
```sql
CREATE TABLE homework_ocr_task (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  status int NOT NULL COMMENT '状态',
  parsed_count INT DEFAULT 0,
  error_message VARCHAR(255) NULL,
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  KEY idx_user (user_id)
);
```

### 31) OCR 结果：homework_ocr_result
```sql
CREATE TABLE homework_ocr_result (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  task_id BIGINT NOT NULL,
  question_id BIGINT NULL,
  raw_text TEXT NULL,
  structured_json TEXT NULL,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  KEY idx_task (task_id)
);
```

### 32) 分发日志：homework_distribution_log
- 作用：记录试题篮分发，映射 `questionBasket.distributionLogs`。
```sql
CREATE TABLE homework_distribution_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  items_count INT NOT NULL,
  type VARCHAR(20) NOT NULL,
  targets TEXT NOT NULL,
  assignment_id BIGINT NULL,
  subject VARCHAR(50) NULL,
  grade VARCHAR(50) NULL,
  time DATETIME DEFAULT CURRENT_TIMESTAMP,
  status int NOT NULL COMMENT '状态',
  creator varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '创建者',
  create_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updater varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '更新者',
  update_time datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted bit(1) NOT NULL DEFAULT b'0' COMMENT '是否删除',
  tenant_id bigint NOT NULL DEFAULT '0' COMMENT '租户编号',
  KEY idx_type_time (type, time)
);
```

---

## 表间关系与前端映射
- 发布流程：`homework_assignments` → `homework_assignment_layer` → `homework_assignment_question` → `homework_assignment_class`（与 `homework_classes`）
- 题库管理：`homework_questions` ↔ `homework_question_option` ↔ `homework_question_knowledge_*` ↔ `homework_question_tag_*`；收藏与文件夹：`homework_question_favorite_*`
- 学生作业：`homework_submission` ↔ `homework_submission_item` ↔ `homework_grading_task`
- 错题与复习：`homework_mistake_book` ↔ `homework_mistake_review_task` ↔ `homework_mistake_review_task_item`；班级共性错题：`homework_class_common_error`
- 推荐与讲评：`homework_recommendation`，讲评（选配）`homework_lecture`
- 报告：`homework_report` ↔ `homework_report_share`
- 资源：`homework_resource` ↔ `homework_resource_favorite` ↔ `homework_resource_download`
- OCR：`homework_ocr_task` ↔ `homework_ocr_result`
- 分发日志：`homework_distribution_log` 映射试题篮记录

## 兼容管理端与业务端的注意点
- 管理端可直接对字典类（知识点、标签）、题库、资源进行 CRUD；业务端使用相同表数据进行选择与发布。
- 任何用户维度外键（`*_id`）指向现有系统用户表；班级统一指向 `homework_classes`。
- 索引按查询路径设计：题库（类型/难度/学科/年级）、作业（状态/学科/年级）、提交（作业/学生）、资源（类型/状态）。

## 说明与后续使用
- 本设计保存于：`frontend/docs/homework-sql-design.md`。
- 可在此基础上调整字段或新增扩展表（如题目解析结构化子表、PDF模板配置等），不影响现有查询索引设计。
