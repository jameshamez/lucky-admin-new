-- Office/production consumables (paper, ink, film, glue, lanyards) — a domain distinct from
-- Stage A's finished-goods warehouses and Stage B's trophy/medal + BOM stock. Used only by
-- InventoryManagement.tsx's own "รับเข้า/จ่ายออก" and "ประวัติเคลื่อนไหว" tabs.

CREATE TABLE IF NOT EXISTS `office_supplies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(255) DEFAULT NULL,
  `current_stock` INT NOT NULL DEFAULT 0,
  `minimum_stock` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(50) DEFAULT 'ชิ้น',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `office_supply_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `supply_id` INT NOT NULL,
  `type` ENUM('รับเข้า','จ่ายออก','ปรับยอด') NOT NULL,
  `qty` INT NOT NULL COMMENT 'signed delta applied to current_stock',
  `employee_name` VARCHAR(255) DEFAULT NULL,
  `note` TEXT DEFAULT NULL,
  `order_ref` VARCHAR(100) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`supply_id`) REFERENCES `office_supplies`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `office_supply_defects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_name` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `defect_type` VARCHAR(255) DEFAULT NULL,
  `report_date` DATE DEFAULT NULL,
  `reported_by` VARCHAR(255) DEFAULT NULL,
  `order_ref` VARCHAR(100) DEFAULT NULL,
  `resolution_action` VARCHAR(255) DEFAULT NULL,
  `note` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data matching the mock UI so the page isn't empty on first load
INSERT INTO `office_supplies` (`code`,`name`,`category`,`current_stock`,`minimum_stock`,`unit`) VALUES
('INV-001','กระดาษ A4','วัสดุการพิมพ์',25,50,'รีม'),
('INV-002','หมึกสีดำ','วัสดุการพิมพ์',15,20,'ขวด'),
('INV-003','ฟิล์มพลาสติก','วัสดุบรรจุภัณฑ์',120,100,'เมตร'),
('INV-004','กาวลาเบล','วัสดุติดตั้ง',8,10,'หลอด'),
('INV-005','สายคล้อง','อุปกรณ์เสริม',500,200,'เส้น');

INSERT INTO `office_supply_movements` (`supply_id`,`type`,`qty`,`employee_name`,`note`,`created_at`) VALUES
(1,'รับเข้า',100,'สมชาย','รับจากซัพพลายเออร์','2024-01-20 09:00:00'),
(2,'จ่ายออก',-5,'วิชัย','เบิกใช้งาน ORD-003','2024-01-20 10:00:00'),
(5,'รับเข้า',200,'สมชาย','รับจากซัพพลายเออร์','2024-01-19 09:00:00'),
(3,'จ่ายออก',-30,'มานะ','เบิกใช้งาน ORD-002','2024-01-19 11:00:00'),
(4,'ปรับยอด',-2,'สุชาติ','สินค้าหมดอายุ','2024-01-18 15:00:00');

INSERT INTO `office_supply_defects` (`product_name`,`quantity`,`defect_type`,`report_date`,`reported_by`,`order_ref`,`resolution_action`) VALUES
('ป้ายโฆษณา',2,'สีผิดเพี้ยน','2024-01-20','ทีม QC','ORD-001','ผลิตใหม่'),
('แผ่นพับ',50,'พิมพ์ไม่ชัด','2024-01-19','ทีม A','ORD-002','ส่งคืนซัพพลายเออร์');
