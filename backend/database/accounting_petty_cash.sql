-- Drop old simple table if exists to apply new detailed schema
DROP TABLE IF EXISTS `accounting_petty_cash`;

-- Petty Cash Table (Detailed for PEAK integration and full lifecycle)
CREATE TABLE `accounting_petty_cash` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pc_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'PC-YYYYMMDD-XXX',
  `employee` VARCHAR(255) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `request_date` DATE NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `sub_category` TEXT DEFAULT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('รออนุมัติ', 'รอเบิกจ่าย', 'จ่ายแล้ว', 'ยกเลิก') DEFAULT 'รออนุมัติ',
  `approver` VARCHAR(100) DEFAULT NULL,
  `approved_date` DATE DEFAULT NULL,
  `paid_date` DATE DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'เงินสด',
  `clearance_status` ENUM('รอเคลียร์', 'เคลียร์แล้ว') DEFAULT 'รอเคลียร์',
  `clearance_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  
  -- PEAK integration fields
  `tax_id_13` VARCHAR(13) DEFAULT NULL,
  `branch_code_5` VARCHAR(5) DEFAULT NULL,
  `invoice_no` VARCHAR(50) DEFAULT NULL,
  `invoice_date` DATE DEFAULT NULL,
  `tax_record_date` DATE DEFAULT NULL,
  `price_type` VARCHAR(10) DEFAULT NULL,
  `account_code` VARCHAR(50) DEFAULT NULL,
  `quantity` DECIMAL(15, 4) DEFAULT 1,
  `tax_rate` VARCHAR(20) DEFAULT NULL,
  `withholding_tax` VARCHAR(20) DEFAULT NULL,
  `paid_by_code` VARCHAR(50) DEFAULT NULL COMMENT 'PEAK account code',
  `paid_amount` DECIMAL(15, 2) DEFAULT NULL,
  `pnd` VARCHAR(10) DEFAULT NULL,
  `classification_group` VARCHAR(50) DEFAULT NULL,

  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Seed Data
INSERT INTO `accounting_petty_cash` 
(`pc_code`, `employee`, `department`, `amount`, `request_date`, `category`, `sub_category`, `description`, `status`, `payment_method`, `clearance_status`) VALUES
('PC-20250110-001', 'สมชาย ใจดี', 'ขาย', 1500.00, '2025-01-10', 'ค่าน้ำมัน', 'ขาไป: 15,234 km / ขากลับ: 15,456 km', 'เดินทางพบลูกค้า', 'จ่ายแล้ว', 'เงินสด', 'รอเคลียร์'),
('PC-20250109-002', 'สมหญิง รักงาน', 'บัญชี', 500.00, '2025-01-09', 'ค่าของใช้', NULL, 'ซื้อเครื่องเขียน', 'จ่ายแล้ว', 'เงินสด', 'เคลียร์แล้ว'),
('PC-20250108-003', 'สมศักดิ์ มั่นคง', 'ผลิต', 2300.00, '2025-01-08', 'ค่าส่งสินค้า', NULL, 'ส่งสินค้าลูกค้า A', 'จ่ายแล้ว', 'เงินสด', 'รอเคลียร์');
