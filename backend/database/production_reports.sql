-- 1. ตารางบันทึกประสิทธิภาพการผลิตรายวัน/สัปดาห์ (Production Efficiency)
CREATE TABLE IF NOT EXISTS `production_stats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `stat_date` DATE NOT NULL UNIQUE,
  `target_units` INT DEFAULT 0 COMMENT 'เป้าหมายผลิต (หน่วย)',
  `actual_units` INT DEFAULT 0 COMMENT 'ผลิตได้จริง (หน่วย)',
  `waste_units` INT DEFAULT 0 COMMENT 'เสีย/ตำหนิ (หน่วย)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ตารางบันทึกรายการสินค้าตำหนิ/ปัญหาการผลิต (Defect Logs)
CREATE TABLE IF NOT EXISTS `production_defects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT DEFAULT NULL,
  `defect_type` VARCHAR(100) NOT NULL COMMENT 'เช่น สีเพี้ยน, พิมพ์ไม่ชัด, ขนาดผิด',
  `description` TEXT,
  `reported_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `is_resolved` TINYINT(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. ตารางข้อมูลวัตถุดิบ/สต็อก (Production Inventory)
CREATE TABLE IF NOT EXISTS `production_inventory` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `item_name` VARCHAR(255) NOT NULL,
  `current_stock` DECIMAL(10,2) DEFAULT 0,
  `min_stock` DECIMAL(10,2) DEFAULT 0,
  `unit` VARCHAR(20) DEFAULT 'ชิ้น/แผ่น',
  `unit_price` DECIMAL(10,2) DEFAULT 0,
  `category` VARCHAR(50) COMMENT 'เช่น กระดาษ, หมึก, ฟิล์ม',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ตารางบันทึกการเคลื่อนไหวสต็อก (Inventory Movement)
CREATE TABLE IF NOT EXISTS `inventory_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `inventory_id` INT NOT NULL,
  `type` ENUM('IN', 'OUT') NOT NULL,
  `quantity` DECIMAL(10,2) NOT NULL,
  `movement_date` DATE NOT NULL,
  `notes` VARCHAR(255),
  FOREIGN KEY (`inventory_id`) REFERENCES `production_inventory`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ข้อมูลตัวอย่างสำหรับทดสอบ (Dummy Data สำหรับ Report)
INSERT IGNORE INTO `production_inventory` (item_name, current_stock, min_stock, unit, unit_price, category) VALUES 
('กระดาษ A4 (รีม)', 25, 50, 'รีม', 500, 'กระดาษ'),
('หมึกสี CMYK', 15, 20, 'ชุด', 500, 'หมึก'),
('ฟิล์มพลาสติก (ม้วน)', 120, 100, 'ม้วน', 200, 'ฟิล์ม');
