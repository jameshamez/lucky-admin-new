-- Office Assets Table (For IT equipment and furniture)
CREATE TABLE IF NOT EXISTS `accounting_office_assets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `asset_id` VARCHAR(50) NOT NULL UNIQUE COMMENT 'INV-YYYYMMDD-XXX',
  `name` VARCHAR(255) NOT NULL,
  `category` ENUM('คอมพิวเตอร์', 'โน้ตบุ๊ก', 'มือถือ', 'อุปกรณ์เสริม') NOT NULL,
  `assigned_to` VARCHAR(255) DEFAULT NULL COMMENT 'Employee name or ID',
  `purchase_date` DATE NOT NULL,
  `price` DECIMAL(15, 2) NOT NULL,
  `status` ENUM('ใช้งานอยู่', 'ว่าง', 'ส่งซ่อม', 'จำหน่ายออก') DEFAULT 'ใช้งานอยู่',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Asset History Table (For tracking movement, repairs, and updates)
CREATE TABLE IF NOT EXISTS `accounting_office_asset_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `asset_id_fk` INT NOT NULL,
  `history_date` DATE NOT NULL,
  `type` ENUM('transfer', 'repair', 'upgrade', 'register') NOT NULL,
  `description` TEXT NOT NULL,
  `cost` DECIMAL(15, 2) DEFAULT 0,
  `from_user` VARCHAR(100) DEFAULT NULL,
  `to_user` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`asset_id_fk`) REFERENCES `accounting_office_assets`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Seed Data
INSERT INTO `accounting_office_assets` (`asset_id`, `name`, `category`, `assigned_to`, `purchase_date`, `price`, `status`) VALUES
('INV-20240115-001', 'MacBook Pro 14 M3', 'โน้ตบุ๊ก', 'สมชาย ใจดี', '2024-01-15', 69900.00, 'ใช้งานอยู่'),
('INV-20240220-002', 'Dell OptiPlex 7010', 'คอมพิวเตอร์', 'สมหญิง รักงาน', '2024-02-20', 25000.00, 'ใช้งานอยู่'),
('INV-20240301-003', 'iPhone 15 Pro', 'มือถือ', NULL, '2024-03-01', 42900.00, 'ว่าง'),
('INV-20240410-004', 'Logitech MX Keys', 'อุปกรณ์เสริม', 'สมชาย ใจดี', '2024-04-10', 3490.00, 'ส่งซ่อม'),
('INV-20230815-005', 'Samsung Galaxy S23', 'มือถือ', NULL, '2023-08-15', 29900.00, 'จำหน่ายออก');

-- Initial History Data
INSERT INTO `accounting_office_asset_history` (`asset_id_fk`, `history_date`, `type`, `description`, `cost`, `from_user`, `to_user`) VALUES
(1, '2024-01-15', 'register', 'นำเข้าอุปกรณ์ใหม่', 0, NULL, NULL),
(1, '2024-01-16', 'transfer', 'มอบให้พนักงาน', 0, '-', 'สมชาย ใจดี'),
(1, '2024-06-10', 'upgrade', 'เพิ่ม RAM 16GB → 32GB', 4500, NULL, NULL),
(2, '2024-02-20', 'register', 'นำเข้าอุปกรณ์ใหม่', 0, NULL, NULL),
(2, '2024-02-21', 'transfer', 'มอบให้พนักงาน', 0, '-', 'สมหญิง รักงาน'),
(3, '2024-03-01', 'register', 'นำเข้าอุปกรณ์ใหม่', 0, NULL, NULL),
(3, '2024-03-05', 'transfer', 'มอบให้พนักงาน', 0, '-', 'วิชัย สุขใจ'),
(3, '2024-11-01', 'transfer', 'คืนอุปกรณ์ (พนักงานลาออก)', 0, 'วิชัย สุขใจ', '-'),
(4, '2024-04-10', 'register', 'นำเข้าอุปกรณ์ใหม่', 0, NULL, NULL),
(4, '2024-12-01', 'repair', 'คีย์บอร์ดปุ่มค้าง ส่งศูนย์', 800, NULL, NULL);
