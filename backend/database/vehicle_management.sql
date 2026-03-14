-- 1. ตารางข้อมูลรถ (Vehicles)
CREATE TABLE IF NOT EXISTS `vehicles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vehicle_code` VARCHAR(20) UNIQUE COMMENT 'รหัสภายในเช่น V001',
  `name` VARCHAR(100) NOT NULL COMMENT 'ชื่อเรียกเช่น รถกระบะ 1',
  `license_plate` VARCHAR(50) NOT NULL COMMENT 'ทะเบียนรถ',
  `type` VARCHAR(50) DEFAULT 'กระบะ' COMMENT 'ประเภทรถ',
  `status` ENUM('พร้อมใช้', 'กำลังใช้งาน', 'ซ่อมบำรุง') DEFAULT 'พร้อมใช้',
  `current_mileage` INT DEFAULT 0 COMMENT 'เลขไมล์ปัจจุบัน',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ตารางบันทึกการใช้รถและน้ำมัน (Vehicle Usage Logs)
CREATE TABLE IF NOT EXISTS `vehicle_usage_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vehicle_id` INT NOT NULL,
  `usage_date` DATE NOT NULL,
  `driver_name` VARCHAR(100) NOT NULL,
  `destination` VARCHAR(255) NOT NULL,
  `purpose` TEXT,
  `mileage_start` INT DEFAULT 0,
  `mileage_end` INT DEFAULT 0,
  `fuel_added` DECIMAL(10,2) DEFAULT 0 COMMENT 'เติมน้ำมัน (ลิตร)',
  `fuel_cost` DECIMAL(10,2) DEFAULT 0 COMMENT 'ค่าน้ำมัน (บาท)',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. ปรับปรุงตาราง vehicle_reservations (คำขอใช้รถ)
ALTER TABLE `vehicle_reservations`
  ADD COLUMN IF NOT EXISTS `customer_name` VARCHAR(255) AFTER `id`,
  ADD COLUMN IF NOT EXISTS `product_detail` TEXT AFTER `customer_name`,
  ADD COLUMN IF NOT EXISTS `delivery_location` VARCHAR(255) AFTER `purpose`,
  ADD COLUMN IF NOT EXISTS `address` TEXT AFTER `delivery_location`,
  ADD COLUMN IF NOT EXISTS `notes` TEXT AFTER `requester`,
  ADD COLUMN IF NOT EXISTS `image_url` VARCHAR(500) AFTER `status`;
