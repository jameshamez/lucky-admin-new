-- 1. ตารางบันทึกธุรกรรมการเงิน (รายรับ - รายจ่าย)
CREATE TABLE IF NOT EXISTS `accounting_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('INCOME', 'EXPENSE') NOT NULL,
  `category` VARCHAR(100) NOT NULL COMMENT 'เช่น ค่าวัสดุ, ค่าเช่า, ยอดขายออเดอร์',
  `amount` DECIMAL(15,2) NOT NULL,
  `transaction_date` DATE NOT NULL,
  `reference_id` VARCHAR(50) DEFAULT NULL COMMENT 'ID อ้างอิง เช่น เลขที่ใบสั่งงาน/ใบจอง',
  `description` TEXT,
  `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') DEFAULT 'COMPLETED',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ตารางจัดการเงินสดย่อย (Petty Cash)
CREATE TABLE IF NOT EXISTS `accounting_petty_cash` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `requester_name` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL,
  `purpose` TEXT NOT NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'PAID') DEFAULT 'PENDING',
  `approved_by` VARCHAR(100) DEFAULT NULL,
  `request_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. ตารางบันทึกงานบัญชี (Accounting Tasks)
CREATE TABLE IF NOT EXISTS `accounting_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `task_name` VARCHAR(255) NOT NULL,
  `status` ENUM('pending', 'in-progress', 'completed') DEFAULT 'pending',
  `priority` ENUM('low', 'medium', 'high') DEFAULT 'medium',
  `due_date` DATE,
  `assigned_to` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ตารางคลังสำนักงาน (Office Inventory - แยกจากฝ่ายผลิต)
CREATE TABLE IF NOT EXISTS `office_inventory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_name` VARCHAR(255) NOT NULL,
  `stock_quantity` INT DEFAULT 0,
  `min_quantity` INT DEFAULT 5,
  `unit` VARCHAR(50) DEFAULT 'ชิ้น',
  `category` VARCHAR(100),
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ข้อมูลตัวอย่างสำหรับ Cash Flow (Dummy Data)
INSERT IGNORE INTO `accounting_transactions` (type, category, amount, transaction_date) VALUES 
('INCOME', 'ยอดขายออเดอร์', 450000, '2024-01-15'),
('INCOME', 'ยอดขายออเดอร์', 520000, '2024-02-15'),
('EXPENSE', 'ค่าวัสดุอุปกรณ์', 320000, '2024-01-20'),
('EXPENSE', 'เงินเดือนพนักงาน', 150000, '2024-01-30');
