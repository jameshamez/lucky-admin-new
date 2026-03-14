-- Table for detailed expenses
CREATE TABLE IF NOT EXISTS `accounting_expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `expense_code` VARCHAR(50) NOT NULL UNIQUE,
  `supplier` VARCHAR(255) NOT NULL,
  `po_no` VARCHAR(100),
  `invoice_no` VARCHAR(100),
  `purchase_date` DATE,
  `payment_date` DATE,
  `description` TEXT,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `vat` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `net_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `paid_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `outstanding_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `payment_method` VARCHAR(50),
  `payment_status` VARCHAR(50),
  `remark` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for items within an expense
CREATE TABLE IF NOT EXISTS `accounting_expense_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `expense_id` INT NOT NULL,
  `description` TEXT,
  `quantity` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `currency` VARCHAR(10) DEFAULT 'THB',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`expense_id`) REFERENCES `accounting_expenses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for tracking payments for an expense
CREATE TABLE IF NOT EXISTS `accounting_expense_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `expense_id` INT NOT NULL,
  `payment_date` DATE,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `payment_method` VARCHAR(50),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`expense_id`) REFERENCES `accounting_expenses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial data matching Expenses.tsx mock data
INSERT INTO `accounting_expenses` 
(expense_code, supplier, po_no, invoice_no, purchase_date, payment_date, description, amount, vat, net_amount, paid_amount, outstanding_amount, payment_method, payment_status, remark)
VALUES 
('EXP-2025-001', 'China BENC', 'PO-2025-001', 'INV-CN-001', '2025-01-10', '2025-01-15', 'ปากกาพลาสติก 5000 ชิ้น', 75000, 5250, 80250, 80250, 0, 'โอน', 'จ่ายแล้ว', 'สั่งจากจีน รอสินค้าถึง 25 ม.ค.'),
('EXP-2025-002', 'บริษัท พรีเมี่ยมแบงค์ค็อก จำกัด', 'PO-2025-002', 'INV-TH-002', '2025-01-12', NULL, 'กระเป๋าผ้า Canvas 500 ใบ', 45000, 3150, 48150, 0, 48150, 'เช็ค', 'รออนุมัติ', 'รอการอนุมัติจากผู้บริหาร'),
('EXP-2025-003', 'Chaina LINDA', 'PO-2025-003', 'INV-CN-003', '2025-01-14', '2025-01-20', 'แก้วเซรามิค 800 ชิ้น', 96000, 6720, 102720, 102720, 0, 'โอน', 'จ่ายแล้ว', 'จ่ายครบแล้ว รอของถึงไทย'),
('EXP-2025-004', 'ไทย Solid', 'PO-2025-004', 'INV-TH-004', '2025-01-16', NULL, 'วัตถุดิบพลาสติก PLA', 25000, 1750, 26750, 0, 26750, 'เงินสด', 'รออนุมัติ', 'สั่งเพิ่มเติมสำหรับงานเร่งด่วน'),
('EXP-2025-005', 'Papermate', 'PO-2025-005', 'INV-TH-005', '2025-01-18', '2025-01-22', 'กล่องกระดาษพรีเมี่ยม 1000 ใบ', 18000, 1260, 19260, 19260, 0, 'โอน', 'จ่ายแล้ว', 'ของถึงแล้ว เก็บในคลัง'),
('EXP-2025-006', 'China X', 'PO-2025-006', 'INV-CN-006', '2025-01-20', NULL, 'พวงกุญแจอะคริลิค 3000 ชิ้น', 42000, 2940, 44940, 0, 44940, 'โอน', 'ยกเลิก', 'ยกเลิกเนื่องจากลูกค้าเปลี่ยนใจ');

-- Items for EXP-2025-001
INSERT INTO `accounting_expense_items` (expense_id, description, quantity, unit_price, currency) VALUES
(1, 'ปากกาพลาสติก', 5000, 15, 'THB');

-- Payments for EXP-2025-001
INSERT INTO `accounting_expense_payments` (expense_id, payment_date, amount, payment_method) VALUES
(1, '2025-01-15', 80250, 'โอน');
