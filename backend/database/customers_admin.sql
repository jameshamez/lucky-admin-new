-- ===================================================
-- Database: bravo_flow_erp
-- Table: customers_admin (ข้อมูลลูกค้า)
-- ===================================================

CREATE TABLE IF NOT EXISTS `customers_admin` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `company_name` VARCHAR(255) NOT NULL COMMENT 'ชื่อบริษัท/องค์กร',
  `customer_type` VARCHAR(100) DEFAULT 'เจ้าของงาน' COMMENT 'ประเภทลูกค้า',
  `tax_id` VARCHAR(13) DEFAULT NULL COMMENT 'เลขประจำตัวผู้เสียภาษี',
  `business_type` VARCHAR(100) DEFAULT NULL COMMENT 'ประเภทธุรกิจ',

  -- ที่อยู่ออกใบกำกับภาษี
  `billing_address` TEXT DEFAULT NULL,
  `billing_subdistrict` VARCHAR(150) DEFAULT NULL,
  `billing_district` VARCHAR(150) DEFAULT NULL,
  `billing_province` VARCHAR(150) DEFAULT NULL,
  `billing_postcode` VARCHAR(10) DEFAULT NULL,

  -- ที่อยู่จัดส่ง
  `shipping_address` TEXT DEFAULT NULL,
  `shipping_subdistrict` VARCHAR(150) DEFAULT NULL,
  `shipping_district` VARCHAR(150) DEFAULT NULL,
  `shipping_province` VARCHAR(150) DEFAULT NULL,
  `shipping_postcode` VARCHAR(10) DEFAULT NULL,
  `same_address` TINYINT(1) DEFAULT 0 COMMENT '1 = ที่อยู่จัดส่งเดียวกับที่อยู่ใบกำกับ',

  -- ข้อมูลผู้ติดต่อหลัก
  `contact_name` VARCHAR(255) DEFAULT NULL,
  `phone_numbers` JSON DEFAULT NULL COMMENT 'array ของเบอร์โทร',
  `emails` JSON DEFAULT NULL COMMENT 'array ของอีเมล',
  `line_id` VARCHAR(100) DEFAULT NULL,

  -- การนำเสนอ / CRM
  `presentation_status` VARCHAR(100) DEFAULT 'เสนอขาย',
  `sales_status` ENUM('ใหม่','เสนอราคา','ผลิต','ปิดงาน') DEFAULT 'ใหม่',
  `next_action` VARCHAR(255) DEFAULT NULL,
  `next_action_date` DATE DEFAULT NULL,
  `sales_owner` VARCHAR(255) DEFAULT NULL COMMENT 'ผู้รับผิดชอบ',
  `contact_count` INT DEFAULT 1,
  `last_contact_date` DATE DEFAULT NULL,
  `interested_products` TEXT DEFAULT NULL COMMENT 'สินค้าที่สนใจ คั่นด้วยคอมม่า',

  -- ข้อมูลภายใน
  `responsible_person` VARCHAR(255) DEFAULT NULL,
  `customer_status` VARCHAR(100) DEFAULT 'ลูกค้าใหม่' COMMENT 'ลูกค้าใหม่, ลูกค้าประจำ, ลูกค้า VIP',
  `how_found_us` VARCHAR(255) DEFAULT NULL,
  `other_channel` VARCHAR(255) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,

  -- ยอดรวม
  `total_orders` INT DEFAULT 0,
  `total_value` DECIMAL(15,2) DEFAULT 0.00,

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===================================================
-- Table: customer_contacts_admin (ผู้ติดต่อเพิ่มเติม)
-- ===================================================

CREATE TABLE IF NOT EXISTS `customer_contacts_admin` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_id` INT NOT NULL,
  `contact_name` VARCHAR(255) NOT NULL,
  `line_id` VARCHAR(100) DEFAULT NULL,
  `phone_number` VARCHAR(50) DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`customer_id`) REFERENCES `customers_admin`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===================================================
-- Sample Data (ตัวอย่างข้อมูล)
-- ===================================================

INSERT INTO `customers_admin` 
  (company_name, customer_type, tax_id, billing_province, contact_name, phone_numbers, emails, line_id, presentation_status, sales_status, next_action, next_action_date, sales_owner, contact_count, last_contact_date, interested_products, responsible_person, customer_status, how_found_us, notes, total_orders, total_value)
VALUES
  ('บริษัท ABC จำกัด', 'เจ้าของงาน', '1234567890123', 'กรุงเทพมหานคร', 'คุณสมชาย ใจดี', '["081-234-5678","082-345-6789"]', '["somchai@abc.co.th"]', '@somchai', 'เสนอขาย', 'ใหม่', 'โทรติดตาม', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'สมชาย', 2, CURDATE(), 'เหรียญ, ถ้วยรางวัล', 'สมชาย', 'ลูกค้าใหม่', 'Facebook', 'ลูกค้าใหม่สนใจเหรียญรุ่นพิเศษ', 0, 0.00),
  ('บริษัท XYZ Corp', 'ตัวแทน', '9876543210987', 'ชลบุรี', 'คุณวิภา รักงาน', '["089-111-2222"]', '["vipa@xyz.com"]', '@vipa_xyz', 'เสนอขาย', 'เสนอราคา', 'ส่งใบเสนอราคา', DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'วิภา', 5, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'โล่, เสื้อ', 'วิภา', 'ลูกค้าประจำ', 'Line', 'ลูกค้าประจำ สั่งทุก 3 เดือน', 8, 125000.00),
  ('องค์การ DEF', 'ออแกนไนเซอร์', NULL, 'เชียงใหม่', 'คุณธนา มีสุข', '["053-456-7890"]', '["thana@def.org"]', NULL, 'เสนอขาย', 'ผลิต', 'ติดตามการผลิต', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'ธนา', 10, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'สายคล้อง, แก้ว', 'ธนา', 'ลูกค้า VIP', 'แนะนำ', 'VIP จัดงานใหญ่ประจำปี', 25, 580000.00);
