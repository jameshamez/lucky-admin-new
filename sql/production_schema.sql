-- 1. ตารางสำหรับงานประจำวันของพนักงาน (Daily Tasks)
CREATE TABLE IF NOT EXISTS `employee_tasks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee_id` INT NOT NULL,
  `task_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `task_details` TEXT COMMENT 'รายละเอียดงาน',
  `task_count` INT DEFAULT 0 COMMENT 'จำนวนที่ทำได้',
  `task_type` VARCHAR(100) COMMENT 'ประเภทงาน เช่น งานประกอบ, งานแพ็ก',
  `status` ENUM('pending', 'completed') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ตารางสำหรับติดตามขั้นตอนการผลิตอย่างละเอียด (Production Workflow)
-- ใช้เก็บสถานะย่อยของแต่ละ Order เช่น จัดซื้ออะไหล่, ประกอบ, QC, แพ็กของ
CREATE TABLE IF NOT EXISTS `production_workflow` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `step_name` VARCHAR(50) NOT NULL COMMENT 'ชื่อขั้นตอน: procurement, assembly, ribbon, qc, packing, shipping',
  `status` ENUM('waiting', 'in_progress', 'complete', 'issue') DEFAULT 'waiting',
  `remark` TEXT COMMENT 'หมายเหตุ/ปัญหาที่พบ',
  `box_count` INT DEFAULT 0 COMMENT 'จำนวนกล่อง (สำหรับขั้นตอน packing)',
  `carrier_name` VARCHAR(100) COMMENT 'บริษัทขนส่ง',
  `tracking_number` VARCHAR(100) COMMENT 'เลข Tracking',
  `updated_by` VARCHAR(100) COMMENT 'ชื่อผู้กำกับดูแลขั้นตอนนั้น',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `order_step` (`order_id`, `step_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. ตารางจองรถ (ถ้ายังไม่มี)
CREATE TABLE IF NOT EXISTS `vehicle_reservations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `vehicle_type` VARCHAR(100),
  `purpose` TEXT,
  `start_datetime` DATETIME,
  `end_datetime` DATETIME,
  `requester` VARCHAR(100),
  `status` ENUM('รออนุมัติ', 'อนุมัติแล้ว', 'ไม่อนุมัติ') DEFAULT 'รออนุมัติ',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. เพิ่มสถานะการผลิตเข้าไปในตาราง orders (ถ้ายังไม่มี)
-- ALTER TABLE `orders` ADD COLUMN `production_status` VARCHAR(50) DEFAULT 'รอผลิต' AFTER `status`;
-- ALTER TABLE `orders` ADD COLUMN `urgency` ENUM('ปกติ', 'ด่วน', 'ด่วนมาก') DEFAULT 'ปกติ' AFTER `production_status`;

-- เพิ่ม Index เพื่อให้ดึงข้อมูลได้เร็วขึ้น
CREATE INDEX idx_task_date ON employee_tasks(task_date);
CREATE INDEX idx_workflow_order ON production_workflow(order_id);
