-- Office Supplies Stock Table
CREATE TABLE IF NOT EXISTS `accounting_office_supplies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'SUP-XXX',
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(50) NOT NULL,
  `price_per_unit` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `min_stock` INT NOT NULL DEFAULT 5,
  `date_received` DATE DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Office Requisitions History Table
CREATE TABLE IF NOT EXISTS `accounting_office_requisitions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `supply_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `requester` VARCHAR(255) NOT NULL,
  `requisition_date` DATE NOT NULL,
  `note` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`supply_id`) REFERENCES `accounting_office_supplies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Seed Data for Supplies
INSERT IGNORE INTO `accounting_office_supplies` 
(`id`, `code`, `name`, `category`, `quantity`, `unit`, `price_per_unit`, `date_received`, `min_stock`) VALUES
(1, 'SUP-001', 'ปากกาลูกลื่น', 'เครื่องเขียน', 120, 'โหล', 85, '2024-01-10', 10),
(2, 'SUP-002', 'กระดาษ A4', 'กระดาษ/แฟ้ม', 50, 'รีม', 120, '2024-01-12', 20),
(3, 'SUP-003', 'แฟ้มเอกสาร', 'กระดาษ/แฟ้ม', 8, 'โหล', 180, '2024-01-15', 10),
(4, 'SUP-004', 'สมุดบันทึก', 'เครื่องเขียน', 30, 'เล่ม', 45, '2024-01-18', 15),
(5, 'SUP-005', 'หมึกพิมพ์ HP', 'หมึก/โทนเนอร์', 5, 'กล่อง', 950, '2024-02-01', 3),
(6, 'SUP-006', 'กาวแท่ง', 'อุปกรณ์สำนักงาน', 2, 'โหล', 65, '2024-02-05', 5),
(7, 'SUP-007', 'กรรไกร', 'อุปกรณ์สำนักงาน', 15, 'ชิ้น', 35, '2024-02-10', 5);

-- Initial Seed Data for Requisitions
INSERT IGNORE INTO `accounting_office_requisitions`
(`supply_id`, `quantity`, `requester`, `requisition_date`, `note`) VALUES
(1, 2, 'นายสมชาย ใจดี', '2024-02-10', 'ใช้ในแผนกขาย'),
(2, 5, 'นางสาวสมหญิง รักงาน', '2024-02-12', 'พิมพ์เอกสาร'),
(5, 1, 'นายทดสอบ ระบบดี', '2024-02-14', 'เปลี่ยนหมึกเครื่องปริ้น');
