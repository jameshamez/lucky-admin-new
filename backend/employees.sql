-- ===================================================
-- สร้างตาราง employees
-- ใช้สำหรับ dropdown พนักงานในหน้า Create Order
-- ===================================================

CREATE TABLE IF NOT EXISTS `employees` (
  `id`          INT(11)      NOT NULL AUTO_INCREMENT,
  `code`        VARCHAR(20)  NOT NULL DEFAULT '' COMMENT 'รหัสพนักงาน เช่น EMP001',
  `full_name`   VARCHAR(255) NOT NULL COMMENT 'ชื่อ-นามสกุล',
  `nickname`    VARCHAR(100) NULL     COMMENT 'ชื่อเล่น',
  `department`  VARCHAR(100) NULL     COMMENT 'แผนก เช่น ฝ่ายขาย / ฝ่ายผลิต',
  `position`    VARCHAR(100) NULL     COMMENT 'ตำแหน่ง',
  `phone`       VARCHAR(30)  NULL,
  `email`       VARCHAR(255) NULL,
  `line_id`     VARCHAR(100) NULL,
  `is_sales`    TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1 = แสดงใน dropdown พนักงานขาย',
  `is_active`   TINYINT(1)   NOT NULL DEFAULT 1 COMMENT '1 = ใช้งานอยู่',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_emp_code` (`code`),
  KEY `idx_emp_department` (`department`),
  KEY `idx_emp_is_active`  (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== ข้อมูลตัวอย่าง =====
INSERT IGNORE INTO `employees` (`code`, `full_name`, `nickname`, `department`, `position`, `is_sales`, `is_active`) VALUES
  ('EMP001', 'นายสมศักดิ์ รักงาน',       'ศักดิ์',  'ฝ่ายขาย', 'พนักงานขาย',        1, 1),
  ('EMP002', 'นางสาวพิมพ์ใจ ดีเยี่ยม',  'พิมพ์',  'ฝ่ายขาย', 'พนักงานขาย',        1, 1),
  ('EMP003', 'นายวิชัย มั่นคง',           'วิชัย',  'ฝ่ายขาย', 'ผู้จัดการฝ่ายขาย', 1, 1),
  ('EMP004', 'นางสาวสุดา เก่งมาก',        'สุดา',   'ฝ่ายขาย', 'พนักงานขาย',        1, 1),
  ('EMP005', 'นายอนันต์ ชาญฉลาด',         'อนันต์', 'ฝ่ายขาย', 'พนักงานขาย',        1, 1);
