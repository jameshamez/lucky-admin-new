-- Purchase Requisition (PR) system — replaces the fully in-memory mock in
-- src/pages/procurement/PurchaseRequisition.tsx and feeds the quick-create
-- "เบิกซื้อวัสดุอุปกรณ์" tab in RequisitionCenter.tsx (same underlying concept).

CREATE TABLE IF NOT EXISTS `purchase_requisitions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pr_number` VARCHAR(50) NOT NULL UNIQUE,
  `issue_date` DATE NOT NULL,
  `usage_date` DATE DEFAULT NULL,
  `requester` VARCHAR(255) NOT NULL,
  `purpose_type` ENUM('new','job') NOT NULL DEFAULT 'new',
  `purpose_text` TEXT DEFAULT NULL,
  `job_ids` TEXT DEFAULT NULL COMMENT 'JSON array of job id strings',
  `channel` VARCHAR(100) DEFAULT NULL,
  `shipping` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `include_vat` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('pending','ordered','received','rejected') NOT NULL DEFAULT 'pending',
  `po_number` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pr_line_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pr_id` INT NOT NULL,
  `description` VARCHAR(500) NOT NULL,
  `link` VARCHAR(500) DEFAULT NULL,
  `qty` DECIMAL(15,3) NOT NULL DEFAULT 0,
  `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `currency` ENUM('THB','CNY') NOT NULL DEFAULT 'THB',
  `exchange_rate` DECIMAL(10,4) NOT NULL DEFAULT 1,
  FOREIGN KEY (`pr_id`) REFERENCES `purchase_requisitions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pr_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pr_id` INT NOT NULL,
  `payment_date` DATE NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `method` VARCHAR(50) DEFAULT NULL,
  `evidence_url` VARCHAR(500) DEFAULT NULL,
  `evidence_name` VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (`pr_id`) REFERENCES `purchase_requisitions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `pr_attachments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pr_id` INT NOT NULL,
  `kind` ENUM('general','receive') NOT NULL DEFAULT 'general',
  `file_url` VARCHAR(500) NOT NULL,
  `file_name` VARCHAR(255) DEFAULT NULL,
  `file_size` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`pr_id`) REFERENCES `purchase_requisitions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
