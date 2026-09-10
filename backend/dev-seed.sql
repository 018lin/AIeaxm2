CREATE DATABASE IF NOT EXISTS scan_grading_dev
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE scan_grading_dev;

CREATE TABLE IF NOT EXISTS system_users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL UNIQUE,
  nickname VARCHAR(100) NULL,
  password VARCHAR(128) NOT NULL,
  email VARCHAR(128) NULL,
  mobile VARCHAR(32) NULL,
  sex VARCHAR(8) NULL,
  status INT NOT NULL DEFAULT 0,
  avatar VARCHAR(500) NULL,
  tenant_id BIGINT NOT NULL DEFAULT 1,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS homework_classes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  grade VARCHAR(50) NOT NULL,
  alias VARCHAR(100) NULL,
  teacher_id BIGINT NULL,
  member_count INT DEFAULT 0,
  status INT NOT NULL DEFAULT 0,
  creator VARCHAR(64) DEFAULT '',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updater VARCHAR(64) DEFAULT '',
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  tenant_id BIGINT NOT NULL DEFAULT 1,
  KEY idx_teacher (teacher_id)
);

CREATE TABLE IF NOT EXISTS homework_layers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  description VARCHAR(255) NULL,
  status INT NOT NULL DEFAULT 0,
  creator VARCHAR(64) DEFAULT '',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updater VARCHAR(64) DEFAULT '',
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  tenant_id BIGINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS homework_assignments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  grade VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NULL,
  total_score INT DEFAULT 100,
  time_limit INT DEFAULT 60,
  status INT NOT NULL DEFAULT 0,
  published_at DATETIME NULL,
  creator VARCHAR(64) DEFAULT '',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updater VARCHAR(64) DEFAULT '',
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  tenant_id BIGINT NOT NULL DEFAULT 1,
  KEY idx_creator (creator),
  KEY idx_status (status)
);

CREATE TABLE IF NOT EXISTS homework_assignment_class (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  assignment_id BIGINT NOT NULL,
  class_id BIGINT NOT NULL,
  publish_time DATETIME NOT NULL,
  due_time DATETIME NULL,
  allow_late_submission TINYINT(1) DEFAULT 0,
  time_limit INT NULL,
  submission_attempts INT DEFAULT 1,
  status INT NOT NULL DEFAULT 0,
  creator VARCHAR(64) DEFAULT '',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updater VARCHAR(64) DEFAULT '',
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  tenant_id BIGINT NOT NULL DEFAULT 1,
  UNIQUE KEY uk_assign_class (assignment_id, class_id)
);

CREATE TABLE IF NOT EXISTS homework_questions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(500) NOT NULL,
  content TEXT NULL,
  type VARCHAR(30) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  grade VARCHAR(50) NOT NULL,
  score INT DEFAULT 5,
  estimated_time INT DEFAULT 5,
  status INT NOT NULL DEFAULT 0,
  usage_count INT DEFAULT 0,
  correct_rate DECIMAL(5,2) DEFAULT 0.00,
  creator VARCHAR(64) DEFAULT '',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updater VARCHAR(64) DEFAULT '',
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  tenant_id BIGINT NOT NULL DEFAULT 1,
  KEY idx_creator (creator),
  KEY idx_subject_grade (subject, grade)
);

CREATE TABLE IF NOT EXISTS homework_question_import_meta (
  question_id BIGINT PRIMARY KEY,
  batch_id VARCHAR(80) NOT NULL,
  detail_id VARCHAR(120) NOT NULL,
  exam_title VARCHAR(500) NOT NULL,
  import_format VARCHAR(40) NOT NULL,
  source_exam_id VARCHAR(80) NULL,
  external_question_id VARCHAR(120) NULL,
  original_no INT NULL,
  section_title VARCHAR(500) NULL,
  stem_html MEDIUMTEXT NULL,
  answer_html MEDIUMTEXT NULL,
  correct_answer TEXT NULL,
  options_json MEDIUMTEXT NULL,
  images_json MEDIUMTEXT NULL,
  creator VARCHAR(64) DEFAULT '',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  tenant_id BIGINT NOT NULL DEFAULT 1,
  UNIQUE KEY uk_import_external (import_format, source_exam_id, external_question_id),
  KEY idx_detail_id (detail_id),
  KEY idx_batch_id (batch_id)
);

CREATE TABLE IF NOT EXISTS homework_assignment_question (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  assignment_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  layer_id BIGINT NULL,
  position INT NOT NULL,
  score INT DEFAULT 5,
  status INT NOT NULL DEFAULT 0,
  creator VARCHAR(64) DEFAULT '',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updater VARCHAR(64) DEFAULT '',
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  tenant_id BIGINT NOT NULL DEFAULT 1,
  UNIQUE KEY uk_assign_question (assignment_id, question_id)
);

CREATE TABLE IF NOT EXISTS homework_submission (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  assignment_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  status INT NOT NULL DEFAULT 0,
  submitted_at DATETIME NULL,
  time_spent INT NULL,
  auto_score INT NULL,
  teacher_score INT NULL,
  final_score INT NULL,
  graded_at DATETIME NULL,
  creator VARCHAR(64) DEFAULT '',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updater VARCHAR(64) DEFAULT '',
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  tenant_id BIGINT NOT NULL DEFAULT 1,
  UNIQUE KEY uk_assign_student (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS homework_submission_item (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  submission_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  answer_text TEXT NULL,
  is_correct TINYINT(1) NULL,
  score INT NULL,
  max_score INT NOT NULL,
  status INT NOT NULL DEFAULT 0,
  creator VARCHAR(64) DEFAULT '',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updater VARCHAR(64) DEFAULT '',
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  tenant_id BIGINT NOT NULL DEFAULT 1,
  UNIQUE KEY uk_s_q (submission_id, question_id)
);

CREATE TABLE IF NOT EXISTS homework_compositions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  creator VARCHAR(64) DEFAULT '',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  tenant_id BIGINT NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS homework_mistake_book (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  student_id BIGINT NOT NULL,
  question_id BIGINT NOT NULL,
  error_type VARCHAR(50) NULL,
  wrong_count INT DEFAULT 1,
  mastered TINYINT(1) DEFAULT 0,
  last_review_time DATETIME NULL,
  tags VARCHAR(255) NULL,
  status INT NOT NULL DEFAULT 0,
  creator VARCHAR(64) DEFAULT '',
  create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updater VARCHAR(64) DEFAULT '',
  update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted TINYINT(1) NOT NULL DEFAULT 0,
  tenant_id BIGINT NOT NULL DEFAULT 1,
  UNIQUE KEY uk_stu_q (student_id, question_id)
);

INSERT INTO system_users (id, username, nickname, password, email, mobile, sex, status, tenant_id, deleted)
VALUES
  (1, '13866666666', '王老师', 'Aa123456', 'teacher@example.com', '13866666666', '1', 0, 1, 0),
  (1001, 'student1001', '李明', 'Aa123456', NULL, NULL, '1', 0, 1, 0),
  (1002, 'student1002', '张悦', 'Aa123456', NULL, NULL, '2', 0, 1, 0)
ON DUPLICATE KEY UPDATE
  nickname = VALUES(nickname),
  password = VALUES(password),
  deleted = VALUES(deleted);

INSERT INTO homework_classes (id, name, grade, teacher_id, member_count, status, creator, deleted)
VALUES
  (1, '三年级一班', '三年级', 1, 42, 0, '1', 0),
  (2, '三年级二班', '三年级', 1, 39, 0, '1', 0)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  grade = VALUES(grade),
  teacher_id = VALUES(teacher_id),
  member_count = VALUES(member_count),
  deleted = VALUES(deleted);

INSERT INTO homework_layers (id, name, difficulty, description, status, creator, deleted)
VALUES
  (1, '基础巩固组', 'easy', '适合基础薄弱学生，优先巩固核心概念。', 0, '1', 0),
  (2, '能力提升组', 'medium', '适合大多数学生，保持常规训练强度。', 0, '1', 0),
  (3, '拓展挑战组', 'hard', '适合掌握较好的学生，增加综合题比例。', 0, '1', 0)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  difficulty = VALUES(difficulty),
  description = VALUES(description),
  deleted = VALUES(deleted);

INSERT INTO homework_questions (id, title, content, type, difficulty, subject, grade, score, usage_count, correct_rate, creator, deleted)
VALUES
  (1, '两位数加法', '计算：36 + 47 = ?', 'blank', 'easy', '数学', '三年级', 5, 12, 86.50, '1', 0),
  (2, '长方形周长', '一个长方形长 8 厘米，宽 5 厘米，周长是多少？', 'answer', 'medium', '数学', '三年级', 8, 8, 72.00, '1', 0),
  (3, '阅读理解中心句', '阅读短文并找出最能概括段落意思的一句话。', 'answer', 'medium', '语文', '三年级', 10, 5, 68.00, '1', 0)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  content = VALUES(content),
  deleted = VALUES(deleted);

INSERT INTO homework_assignments (id, title, type, subject, grade, difficulty, total_score, time_limit, status, published_at, creator, deleted)
VALUES
  (1, '三年级数学周练', 'homework', '数学', '三年级', 'medium', 100, 45, 1, NOW() - INTERVAL 2 DAY, '1', 0),
  (2, '语文阅读专项练习', 'homework', '语文', '三年级', 'medium', 100, 40, 1, NOW() - INTERVAL 5 DAY, '1', 0)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  status = VALUES(status),
  deleted = VALUES(deleted);

INSERT INTO homework_assignment_class (assignment_id, class_id, publish_time, due_time, status, creator, deleted)
VALUES
  (1, 1, NOW() - INTERVAL 2 DAY, NOW() + INTERVAL 1 DAY, 1, '1', 0),
  (1, 2, NOW() - INTERVAL 2 DAY, NOW() + INTERVAL 1 DAY, 1, '1', 0),
  (2, 1, NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 1 DAY, 1, '1', 0)
ON DUPLICATE KEY UPDATE
  publish_time = VALUES(publish_time),
  due_time = VALUES(due_time),
  deleted = VALUES(deleted);

INSERT INTO homework_assignment_question (assignment_id, question_id, layer_id, position, score, status, creator, deleted)
VALUES
  (1, 1, 1, 1, 5, 0, '1', 0),
  (1, 2, 2, 2, 8, 0, '1', 0),
  (2, 3, 2, 1, 10, 0, '1', 0)
ON DUPLICATE KEY UPDATE
  position = VALUES(position),
  score = VALUES(score),
  deleted = VALUES(deleted);

INSERT INTO homework_submission (id, assignment_id, student_id, status, submitted_at, auto_score, teacher_score, final_score, graded_at, creator, deleted)
VALUES
  (1, 1, 1001, 2, NOW() - INTERVAL 1 DAY, 86, 88, 88, NOW() - INTERVAL 20 HOUR, '1001', 0),
  (2, 1, 1002, 1, NOW() - INTERVAL 23 HOUR, 74, NULL, 74, NULL, '1002', 0),
  (3, 2, 1001, 2, NOW() - INTERVAL 3 DAY, 91, 92, 92, NOW() - INTERVAL 2 DAY, '1001', 0)
ON DUPLICATE KEY UPDATE
  submitted_at = VALUES(submitted_at),
  final_score = VALUES(final_score),
  graded_at = VALUES(graded_at),
  deleted = VALUES(deleted);

INSERT INTO homework_submission_item (submission_id, question_id, answer_text, is_correct, score, max_score, status, creator, deleted)
VALUES
  (1, 1, '83', 1, 5, 5, 0, '1001', 0),
  (1, 2, '26 厘米', 1, 8, 8, 0, '1001', 0),
  (2, 1, '73', 0, 0, 5, 0, '1002', 0),
  (2, 2, '26 厘米', 1, 8, 8, 0, '1002', 0),
  (3, 3, '短文围绕春天的变化展开。', 1, 9, 10, 0, '1001', 0)
ON DUPLICATE KEY UPDATE
  answer_text = VALUES(answer_text),
  score = VALUES(score),
  deleted = VALUES(deleted);

INSERT INTO homework_compositions (id, title, creator, deleted)
VALUES
  (1, '我的校园作文批改', '1', 0),
  (2, '秋天来了作文批改', '1', 0)
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  deleted = VALUES(deleted);

INSERT INTO homework_mistake_book (id, student_id, question_id, wrong_count, mastered, creator, deleted)
VALUES
  (1, 1001, 2, 2, 0, '1', 0),
  (2, 1002, 1, 3, 0, '1', 0),
  (3, 1002, 3, 1, 1, '1', 0)
ON DUPLICATE KEY UPDATE
  wrong_count = VALUES(wrong_count),
  mastered = VALUES(mastered),
  deleted = VALUES(deleted);
