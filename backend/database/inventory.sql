-- Production finished-goods inventory (Stage A: warehouses, products, stock, ledger)
-- Canonical warehouse code is always uppercase (TEG, LUCKY) — the mock data this replaces
-- used inconsistent casing (TEG/Lucky/LUCKY) across different pages.

CREATE TABLE IF NOT EXISTS `warehouses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `address` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'เปิดใช้งาน',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_locations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `warehouse_id` INT NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'เปิดใช้งาน',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_units` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `abbr` VARCHAR(20) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `name` VARCHAR(255) NOT NULL,
  `category_id` INT DEFAULT NULL,
  `subcategory` VARCHAR(255) DEFAULT NULL,
  `unit_id` INT DEFAULT NULL,
  `min_stock` INT DEFAULT 0,
  `image` VARCHAR(500) DEFAULT '/placeholder.svg',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `inventory_categories`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`unit_id`) REFERENCES `inventory_units`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_stock` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT NOT NULL,
  `warehouse_id` INT NOT NULL,
  `location_id` INT DEFAULT NULL,
  `ready_qty` INT NOT NULL DEFAULT 0,
  `defective_qty` INT NOT NULL DEFAULT 0,
  `damaged_qty` INT NOT NULL DEFAULT 0,
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `product_warehouse` (`product_id`, `warehouse_id`),
  FOREIGN KEY (`product_id`) REFERENCES `inventory_products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`location_id`) REFERENCES `inventory_locations`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ref_doc` VARCHAR(100) DEFAULT NULL,
  `type` ENUM('รับเข้า','ตัดออก','โอนคลัง','ปรับยอด') NOT NULL,
  `product_id` INT NOT NULL,
  `warehouse_id` INT NOT NULL,
  `to_warehouse_id` INT DEFAULT NULL COMMENT 'destination warehouse, only for โอนคลัง',
  `status_from` VARCHAR(20) DEFAULT NULL,
  `status_to` VARCHAR(20) DEFAULT NULL COMMENT 'ready|defective|damaged',
  `quantity` INT NOT NULL,
  `employee_name` VARCHAR(255) DEFAULT NULL,
  `note` TEXT DEFAULT NULL,
  `receive_type` ENUM('production','purchase','transfer','other') DEFAULT NULL,
  `price` DECIMAL(15,2) DEFAULT NULL,
  `batch_no` VARCHAR(100) DEFAULT NULL,
  `expire_date` DATE DEFAULT NULL,
  `supplier` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `inventory_products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_stock_count_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `warehouse_id` INT DEFAULT NULL COMMENT 'NULL = all warehouses',
  `status` ENUM('กำลังนับ','เสร็จสิ้น') DEFAULT 'กำลังนับ',
  `started_by` VARCHAR(255) DEFAULT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE DEFAULT NULL,
  FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_stock_count_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `session_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `system_qty` INT NOT NULL DEFAULT 0,
  `counted_qty` INT DEFAULT NULL,
  FOREIGN KEY (`session_id`) REFERENCES `inventory_stock_count_sessions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `inventory_products`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed data matching what the mock UI already assumed exists
INSERT INTO `warehouses` (`code`, `name`, `address`, `status`) VALUES
  ('TEG', 'คลัง TEG', 'สำนักงานใหญ่', 'เปิดใช้งาน'),
  ('LUCKY', 'คลัง Lucky', 'สาขา Lucky', 'เปิดใช้งาน')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `inventory_locations` (`warehouse_id`, `code`, `name`, `status`)
SELECT w.id, loc.code, loc.name, 'เปิดใช้งาน'
FROM `warehouses` w
JOIN (
  SELECT 'TEG' AS wcode, 'A1-1' AS code, 'A1-ชั้น1' AS name
  UNION ALL SELECT 'TEG', 'A2-1', 'A2-ชั้น1'
  UNION ALL SELECT 'TEG', 'A1-2', 'A1-ชั้น2'
  UNION ALL SELECT 'TEG', 'A2-2', 'A2-ชั้น2'
  UNION ALL SELECT 'LUCKY', 'B1-1', 'B1-ชั้น1'
  UNION ALL SELECT 'LUCKY', 'B2-1', 'B2-ชั้น1'
  UNION ALL SELECT 'LUCKY', 'B1-2', 'B1-ชั้น2'
  UNION ALL SELECT 'LUCKY', 'B2-2', 'B2-ชั้น2'
) loc ON loc.wcode = w.code
WHERE NOT EXISTS (
  SELECT 1 FROM `inventory_locations` il WHERE il.warehouse_id = w.id AND il.code = loc.code
);

INSERT INTO `inventory_categories` (`name`)
SELECT * FROM (
  SELECT 'ถ้วยรางวัลสำเร็จ' AS name
  UNION ALL SELECT 'เหรียญรางวัล'
  UNION ALL SELECT 'โล่รางวัล'
  UNION ALL SELECT 'เสื้อพิมพ์ลายและผ้า'
  UNION ALL SELECT 'ชิ้นส่วนถ้วยรางวัล'
) seed
WHERE NOT EXISTS (SELECT 1 FROM `inventory_categories` c WHERE c.name = seed.name);

INSERT INTO `inventory_units` (`name`, `abbr`)
SELECT * FROM (
  SELECT 'ชิ้น' AS name, 'ชิ้น' AS abbr
  UNION ALL SELECT 'กล่อง', 'กล่อง'
  UNION ALL SELECT 'แพ็ค', 'แพ็ค'
  UNION ALL SELECT 'เมตร', 'ม.'
) seed
WHERE NOT EXISTS (SELECT 1 FROM `inventory_units` u WHERE u.name = seed.name);
