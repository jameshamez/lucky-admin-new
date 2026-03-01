-- ===================================================
-- Tables for Sales Settings
-- ===================================================

-- Table for simple master data
CREATE TABLE IF NOT EXISTS `sales_master_data` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `category` VARCHAR(50) NOT NULL COMMENT 'customer_type, business_type, customer_status, channel, job_type, delivery_format, urgency_level',
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `color` VARCHAR(50) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for Sales Targets
CREATE TABLE IF NOT EXISTS `sales_targets` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `target_type` ENUM('individual', 'team') NOT NULL,
  `target_subject_id` VARCHAR(50) DEFAULT NULL COMMENT 'Employee ID or Team ID',
  `target_subject_name` VARCHAR(255) NOT NULL,
  `period_type` ENUM('monthly', 'quarterly', 'yearly') NOT NULL,
  `period_value` VARCHAR(50) NOT NULL COMMENT 'e.g. 2024-01, Q1-2024, 2024',
  `target_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `current_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for Activity Targets
CREATE TABLE IF NOT EXISTS `sales_activity_targets` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `employee_id` VARCHAR(50) DEFAULT NULL,
  `employee_name` VARCHAR(255) NOT NULL,
  `activity_type` VARCHAR(50) NOT NULL COMMENT 'call, meeting, email',
  `period_type` ENUM('daily', 'weekly', 'monthly') NOT NULL,
  `target_count` INT(11) NOT NULL DEFAULT 0,
  `current_count` INT(11) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial mock data if desired
INSERT INTO `sales_master_data` (`category`, `name`, `description`) VALUES
('customer_type', 'เจ้าของงาน', 'ลูกค้าที่เป็นเจ้าของโครงการโดยตรง'),
('customer_type', 'ออร์แกไนเซอร์/ตัวกลาง', 'บริษัทจัดงานหรือตัวกลาง'),
('business_type', 'โรงเรียน', 'สถานศึกษาทุกระดับ'),
('business_type', 'องค์กร', 'บริษัทเอกชน'),
('business_type', 'หน่วยงานรัฐ', 'หน่วยงานภาครัฐ'),
('customer_status', 'ผู้มุ่งหวัง (Lead)', 'ลูกค้าที่กำลังสนใจ'),
('customer_status', 'ลูกค้าใหม่', 'ลูกค้าที่ซื้อครั้งแรก'),
('customer_status', 'ลูกค้าประจำ', 'ลูกค้าที่ซื้อบ่อย'),
('customer_status', 'เลิกติดต่อ (Inactive)', 'ลูกค้าที่ไม่ติดต่อแล้ว'),
('channel', 'Facebook', 'โซเชียลมีเดีย'),
('channel', 'Google', 'ค้นหาผ่าน Google'),
('channel', 'ลูกค้าแนะนำ', 'แนะนำจากลูกค้าเดิม'),
('job_type', 'งานวิ่ง', 'งานแข่งวิ่ง มาราธอน'),
('job_type', 'งานมอบรางวัล', 'งานประกาศรางวัล'),
('job_type', 'กีฬาภายใน', 'กีฬาสีภายในองค์กร'),
('delivery_format', 'จัดส่งพัสดุ', 'ส่งทางไปรษณีย์/ขนส่ง'),
('delivery_format', 'รับที่ร้าน', 'มารับเองที่ร้าน'),
('urgency_level', 'ปกติ', 'ไม่เร่งด่วน'),
('urgency_level', 'เร่งด่วน', 'ต้องเร่งจัดส่ง'),
('urgency_level', 'เร่งด่วนมาก', 'ต้องส่งทันที');

UPDATE `sales_master_data` SET `color` = 'bg-green-500' WHERE `category` = 'urgency_level' AND `name` = 'ปกติ';
UPDATE `sales_master_data` SET `color` = 'bg-yellow-500' WHERE `category` = 'urgency_level' AND `name` = 'เร่งด่วน';
UPDATE `sales_master_data` SET `color` = 'bg-red-500' WHERE `category` = 'urgency_level' AND `name` = 'เร่งด่วนมาก';
