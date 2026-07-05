-- Multi-department QC approval per production step, per order.
-- Reconciles two previously-separate mock implementations (QCVerificationCards.tsx's
-- 3-status+comment model, and OrderDetail.tsx's boolean-only model) into one shared table.

CREATE TABLE IF NOT EXISTS `qc_approvals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` VARCHAR(100) NOT NULL,
  `step_key` VARCHAR(100) NOT NULL,
  `department` ENUM('เซลล์','จัดซื้อ') NOT NULL,
  `status` ENUM('pending','passed','failed') NOT NULL DEFAULT 'pending',
  `comment` TEXT DEFAULT NULL,
  `approved_by` VARCHAR(255) DEFAULT NULL,
  `approved_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `order_step_department` (`order_id`, `step_key`, `department`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
