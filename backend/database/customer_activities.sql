-- ===================================================
-- Table: customer_activities (กิจกรรมลูกค้า)
-- DB: finfinph_lcukycompany
-- ===================================================

CREATE TABLE IF NOT EXISTS `customer_activities` (
  `id`                 INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id`        INT NOT NULL,
  `activity_type`      VARCHAR(100) NOT NULL DEFAULT 'โทรศัพท์'
                       COMMENT 'โทรศัพท์,อีเมล,การประชุม,เยี่ยมชม,ส่งใบเสนอราคา,ติดตามงาน,อื่นๆ',
  `title`              VARCHAR(255) NOT NULL,
  `description`        TEXT DEFAULT NULL,
  `start_datetime`     DATETIME NOT NULL,
  `end_datetime`       DATETIME DEFAULT NULL,
  `reminder_type`      VARCHAR(100) DEFAULT 'ไม่ต้องแจ้ง',
  `contact_person`     VARCHAR(255) DEFAULT NULL,
  `responsible_person` VARCHAR(255) DEFAULT NULL,
  `status`             VARCHAR(100) DEFAULT 'รอดำเนินการ'
                       COMMENT 'รอดำเนินการ,กำลังดำเนินการ,เสร็จสิ้น,ยกเลิก',
  `priority`           VARCHAR(50) DEFAULT 'ปานกลาง'
                       COMMENT 'ต่ำ,ปานกลาง,สูง,ด่วนมาก',
  `created_at`         DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers_admin`(`id`) ON DELETE CASCADE,
  INDEX idx_customer_id (`customer_id`),
  INDEX idx_start_datetime (`start_datetime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
