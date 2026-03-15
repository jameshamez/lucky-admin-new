CREATE TABLE IF NOT EXISTS `system_settings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Initial data
INSERT INTO `system_settings` (`setting_key`, `setting_value`) VALUES
('company_info', '{"name": "THE BRAVO", "logo": "", "email": "contact@thebravo.com", "phone": "02-123-4567", "address": "123 ถนนสุขุมวิท กรุงเทพฯ 10110"}'),
('workflow_settings', '{"orderApprovalLimit": 100000, "autoNotifications": true, "defaulWorkflow": ["รอกราฟิก", "กำลังออกแบบ", "รอผลิต", "กำลังผลิต", "เสร็จสิ้น"]}'),
('financial_settings', '{"currency": "THB", "taxRate": 7, "paymentTerms": ["ชำระทันที", "เครดิต 15 วัน", "เครดิต 30 วัน", "เครดิต 60 วัน"]}'),
('master_data', '{"products": ["ป้ายไวนิล", "นามบัตร", "สติ๊กเกอร์", "โบรชัวร์", "ปฏิทิน"], "suppliers": ["บริษัท A", "บริษัท B", "บริษัท C"], "expenseCategories": ["วัสดุอุปกรณ์", "ค่าเช่า", "ค่าไฟฟ้า", "ค่าใช้จ่ายพนักงาน", "ค่าขนส่ง"]}')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
