-- Production Stage B: defective items + non-warehouse-scoped stock (InventoryManagement.tsx)
-- + withdrawal-components master list (ProductionStepBox.tsx)
-- Deliberately separate from Stage A's warehouse-scoped inventory_* tables — this domain has
-- no warehouse concept in its UI (single global stock per item).

CREATE TABLE IF NOT EXISTS `production_defective_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `image` VARCHAR(500) DEFAULT '/placeholder.svg',
  `category` VARCHAR(255) DEFAULT NULL,
  `subcategory` VARCHAR(255) DEFAULT NULL,
  `color` VARCHAR(100) DEFAULT NULL,
  `size` VARCHAR(100) DEFAULT NULL,
  `defect_type` VARCHAR(255) DEFAULT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(50) DEFAULT 'ชิ้น',
  `report_date` DATE DEFAULT NULL,
  `reported_by` VARCHAR(255) DEFAULT NULL,
  `order_ref` VARCHAR(100) DEFAULT NULL,
  `note` TEXT DEFAULT NULL,
  `status` ENUM('รอดำเนินการ','ตัดขาย','ทำลาย','ซ่อมแล้ว') DEFAULT 'รอดำเนินการ',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_stock_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `image` VARCHAR(500) DEFAULT '/placeholder.svg',
  `category` VARCHAR(255) DEFAULT NULL,
  `subcategory` VARCHAR(255) DEFAULT NULL,
  `color` VARCHAR(255) DEFAULT NULL,
  `size` VARCHAR(255) DEFAULT NULL,
  `tags` VARCHAR(255) DEFAULT NULL,
  `current_stock` INT NOT NULL DEFAULT 0,
  `minimum_stock` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(50) DEFAULT 'ชิ้น',
  `model` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('in_stock','low_stock','out_of_stock') DEFAULT 'in_stock',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_stock_bom` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `stock_item_id` INT NOT NULL,
  `component_code` VARCHAR(50) DEFAULT NULL,
  `component_name` VARCHAR(255) NOT NULL,
  `qty` INT NOT NULL DEFAULT 1,
  `unit` VARCHAR(50) DEFAULT 'ชิ้น',
  `sort_order` INT DEFAULT 0,
  FOREIGN KEY (`stock_item_id`) REFERENCES `production_stock_items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_stock_movements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `stock_item_id` INT NOT NULL,
  `type` ENUM('รับเข้า','จ่ายออก','เคลม','ชำรุด','เบิกภายใน') NOT NULL,
  `qty` INT NOT NULL,
  `employee_name` VARCHAR(255) DEFAULT NULL,
  `note` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`stock_item_id`) REFERENCES `production_stock_items`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_withdrawal_components` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `color` VARCHAR(100) DEFAULT NULL,
  `size` VARCHAR(100) DEFAULT NULL,
  `required_qty` INT NOT NULL DEFAULT 0,
  `unit` VARCHAR(50) DEFAULT 'ชิ้น',
  `image` VARCHAR(500) DEFAULT NULL,
  `sort_order` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `production_withdrawals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(100) NOT NULL,
  `step_key` VARCHAR(100) NOT NULL,
  `component_id` INT NOT NULL,
  `withdrawn_qty` INT NOT NULL,
  `requester` VARCHAR(255) DEFAULT NULL,
  `withdrawn_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`component_id`) REFERENCES `production_withdrawal_components`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data matching the mock UI so the pages aren't empty on first load

INSERT INTO `production_defective_items`
(`code`,`name`,`image`,`category`,`subcategory`,`color`,`size`,`defect_type`,`quantity`,`unit`,`report_date`,`reported_by`,`order_ref`,`note`,`status`) VALUES
('TC-001','ถ้วยรางวัลสีทอง','/placeholder.svg','ถ้วยรางวัลสำเร็จ','ถ้วยรางวัลโลหะอิตาลี','ทอง','A','สีผิดเพี้ยน',5,'ชิ้น','2025-02-10','ทีม QC','ORD-001','สีเคลือบไม่สม่ำเสมอ','รอดำเนินการ'),
('TC-003','ถ้วยรางวัลโลหะอิตาลี - สีเงิน','/placeholder.svg','ถ้วยรางวัลสำเร็จ','ถ้วยรางวัลโลหะอิตาลี','เงิน','B','รอยขีดข่วน',3,'ชิ้น','2025-02-08','ทีม A','ORD-005','มีรอยขีดข่วนที่ฐาน','รอดำเนินการ'),
('MD-001','เหรียญพลาสติกรู้แพ้รู้ชนะ','/placeholder.svg','เหรียญรางวัล','เหรียญพลาสติก','ทอง','มาตรฐาน','พิมพ์ไม่ชัด',50,'ชิ้น','2025-02-07','ทีม QC','ORD-010','ตัวอักษรเลือนหาย','ตัดขาย'),
('PL-001','โล่คริสตัลพรีเมียม','/placeholder.svg','โล่รางวัล','โล่คริสตัล','ใส','8 นิ้ว','แตกร้าว',2,'ชิ้น','2025-02-05','ทีม B','ORD-012','แตกร้าวจากการขนส่ง','ทำลาย'),
('CP-003','ฝาครอบพลาสติก','/placeholder.svg','ชิ้นส่วนถ้วยรางวัล','ฝาครอบ','ใส','มาตรฐาน','บิดงอ',10,'ชิ้น','2025-02-09','ทีม QC','ORD-018','ฝาบิดงอจากความร้อน','รอดำเนินการ');

INSERT INTO `production_stock_items`
(`id`,`code`,`name`,`image`,`category`,`subcategory`,`color`,`size`,`tags`,`current_stock`,`minimum_stock`,`unit`,`model`,`status`) VALUES
(1,'TC-001','ถ้วยรางวัลสีทอง','/placeholder.svg','ถ้วยรางวัลสำเร็จ','ถ้วยรางวัลโลหะอิตาลี','ทอง','A, B, C, N/A','ถ้วยรางวัล',500,100,'ชิ้น','911_S_W_D','in_stock'),
(2,'TC-002','testPP','/placeholder.svg','ถ้วยรางวัลสำเร็จ','ถ้วยรางวัลโลหะอิตาลี','ดำ','','#ww',0,50,'ชิ้น','testPP','out_of_stock'),
(3,'TC-003','ถ้วยรางวัลโลหะอิตาลี - สีเงิน','/placeholder.svg','ถ้วยรางวัลสำเร็จ','ถ้วยรางวัลโลหะอิตาลี','เงิน','A, B, C, D, N/A','',30,50,'ชิ้น','ถ้วยรางวัลโลหะอิตาลี-สีเงิน','low_stock'),
(4,'TC-004','rr','','ถ้วยรางวัลสำเร็จ','ถ้วยรางวัลโลหะอิตาลี','','','',0,10,'ชิ้น','rrrr','out_of_stock'),
(5,'MD-001','เหรียญพลาสติกรู้แพ้รู้ชนะ','/placeholder.svg','เหรียญรางวัล','เหรียญพลาสติก','ทอง, เงิน, ทองแดง','มาตรฐาน','เหรียญ',1200,200,'ชิ้น','Standard','in_stock'),
(6,'MD-002','เหรียญโลหะซิงค์สำเร็จรูป','/placeholder.svg','เหรียญรางวัล','เหรียญโลหะ','เงา, รมดำ','5cm','เหรียญ, premium',45,50,'ชิ้น','Premium','low_stock'),
(7,'PL-001','โล่คริสตัลพรีเมียม','/placeholder.svg','โล่รางวัล','โล่คริสตัล','ใส','8 นิ้ว','โล่, คริสตัล',80,30,'ชิ้น','Crystal-8','in_stock'),
(8,'CP-002','ฐานหินอ่อน','/placeholder.svg','ชิ้นส่วนถ้วยรางวัล','ฐานถ้วย','ดำ, ขาว','4x4 นิ้ว','ชิ้นส่วน, ฐาน',350,100,'ชิ้น','BASE-M01','in_stock'),
(9,'CP-003','ฝาครอบพลาสติก','/placeholder.svg','ชิ้นส่วนถ้วยรางวัล','ฝาครอบ','ใส','มาตรฐาน','ชิ้นส่วน',15,50,'ชิ้น','LID-P01','low_stock');

INSERT INTO `production_stock_bom` (`stock_item_id`,`component_code`,`component_name`,`qty`,`unit`,`sort_order`) VALUES
(1,'CP-001','ตัวถ้วยโลหะอิตาลี',1,'ชิ้น',0),
(1,'CP-002','ฐานหินอ่อน',1,'ชิ้น',1),
(1,'CP-003','ฝาครอบพลาสติก',1,'ชิ้น',2),
(1,'CP-004','กล่องบรรจุ',1,'ชิ้น',3),
(3,'CP-005','ตัวถ้วยโลหะอิตาลี (เงิน)',1,'ชิ้น',0),
(3,'CP-002','ฐานหินอ่อน',1,'ชิ้น',1),
(3,'CP-003','ฝาครอบพลาสติก',1,'ชิ้น',2),
(6,'CP-010','ตัวเหรียญซิงค์',1,'ชิ้น',0),
(6,'CP-011','สายคล้องคอ',1,'เส้น',1),
(6,'CP-012','ซองใส่เหรียญ',1,'ชิ้น',2);

INSERT INTO `production_stock_movements` (`stock_item_id`,`type`,`qty`,`employee_name`,`note`,`created_at`) VALUES
(1,'รับเข้า',100,'สมชาย','รับจากซัพพลายเออร์','2025-02-10 14:30:00'),
(1,'จ่ายออก',20,'วิชัย','เบิกใช้ ORD-015','2025-02-08 10:00:00'),
(1,'รับเข้า',50,'สมชาย','รับจาก PO-0055','2025-02-05 09:15:00'),
(2,'จ่ายออก',10,'มานะ','เบิกใช้ ORD-012','2025-02-08 16:00:00'),
(3,'จ่ายออก',15,'วิชัย','เบิกใช้ ORD-010','2025-02-05 11:00:00'),
(3,'รับเข้า',20,'สมชาย','รับจาก PO-0050','2025-02-03 09:30:00'),
(5,'รับเข้า',500,'สมชาย','รับล็อตใหม่','2025-02-10 08:00:00'),
(5,'จ่ายออก',200,'มานะ','เบิกใช้ ORD-018','2025-02-09 15:00:00'),
(6,'จ่ายออก',5,'วิชัย','เบิกใช้ ORD-020','2025-02-09 10:30:00'),
(7,'รับเข้า',30,'สมชาย','รับจากซัพพลายเออร์','2025-02-10 13:00:00'),
(9,'จ่ายออก',35,'มานะ','เบิกใช้ ORD-014','2025-02-08 11:00:00'),
(9,'รับเข้า',50,'สมชาย','รับจาก PO-0048','2025-02-06 09:00:00');

INSERT INTO `production_withdrawal_components` (`name`,`color`,`size`,`required_qty`,`unit`,`image`,`sort_order`) VALUES
('ตัวเหรียญ','ทอง','5cm',200,'ชิ้น','https://img.icons8.com/emoji/96/1st-place-medal.png',0),
('ตัวเหรียญ','เงิน','5cm',150,'ชิ้น','https://img.icons8.com/emoji/96/2nd-place-medal.png',1),
('ตัวเหรียญ','ทองแดง','5cm',150,'ชิ้น','https://img.icons8.com/emoji/96/3rd-place-medal.png',2),
('สายคล้องคอ','น้ำเงิน','90cm',500,'ชิ้น','https://img.icons8.com/fluency/96/ribbon.png',3),
('กล่องใส่เหรียญ','ดำ','8x8cm',500,'ชิ้น','https://img.icons8.com/fluency/96/box.png',4);
