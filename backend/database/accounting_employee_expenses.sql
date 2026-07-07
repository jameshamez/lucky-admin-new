-- Employee expense reimbursement claims (travel, per-diem, etc.) — distinct from
-- accounting_expenses (supplier/PO purchases) and accounting_petty_cash (fund draws).
-- Used by InternalRequests.tsx's "ค่าใช้จ่ายพนักงาน" tab.

CREATE TABLE IF NOT EXISTS `accounting_employee_expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `employee` VARCHAR(255) NOT NULL,
  `department` VARCHAR(100) DEFAULT NULL,
  `type` VARCHAR(100) NOT NULL COMMENT 'e.g. ค่าเดินทาง, ค่าเบี้ยเลี้ยง',
  `description` TEXT DEFAULT NULL,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `receipt_date` DATE NOT NULL,
  `receipt_url` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('รออนุมัติ','อนุมัติแล้ว','ปฏิเสธ') NOT NULL DEFAULT 'รออนุมัติ',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
