-- Table for Customer Accounts (Accounts Receivable)
CREATE TABLE IF NOT EXISTS `accounting_customer_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ar_code` VARCHAR(50) NOT NULL UNIQUE,
  `customer_name` VARCHAR(255) NOT NULL,
  `invoice_number` VARCHAR(100),
  `invoice_date` DATE,
  `due_date` DATE,
  `total_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `paid_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `remaining_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL COMMENT 'ชำระเสร็จสิ้น, รอชำระ, ค้างชำระ',
  `follow_up_note` TEXT,
  `account_manager` VARCHAR(100),
  `last_updated` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for Follow-up History
CREATE TABLE IF NOT EXISTS `accounting_ar_follow_ups` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ar_id` INT NOT NULL,
  `follow_up_date` DATE NOT NULL,
  `channel` VARCHAR(50) NOT NULL COMMENT 'โทรศัพท์, อีเมล, LINE, เข้าพบ',
  `detail` TEXT,
  `next_follow_up_date` DATE,
  `user_name` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`ar_id`) REFERENCES `accounting_customer_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for monthly AR summary (for charts) - Optional, can be derived from the main table
-- But to match mock data structure easily, we can use a query.

-- Insert initial data matching CustomerAccounts.tsx mock data
INSERT INTO `accounting_customer_accounts` 
(ar_code, customer_name, invoice_number, invoice_date, due_date, total_amount, paid_amount, remaining_amount, status, follow_up_note, account_manager)
VALUES 
('AR-001', 'บริษัท ABC จำกัด', 'INV-2024-001', '2024-01-10', '2024-01-25', 75000, 25000, 50000, 'ค้างชำระ', 'โทรติดตามแล้ว 2 ครั้ง รอยืนยันวันชำระ', 'คุณสมชาย'),
('AR-002', 'ร้าน XYZ', 'INV-2024-002', '2024-02-15', '2024-03-15', 45000, 0, 45000, 'รอชำระ', '-', 'คุณสมหญิง'),
('AR-003', 'บริษัท DEF จำกัด', 'INV-2024-003', '2024-01-05', '2024-01-20', 120000, 120000, 0, 'ชำระเสร็จสิ้น', 'ชำระครบถ้วนแล้ว', 'คุณสมศักดิ์'),
('AR-004', 'บริษัท GHI จำกัด', 'INV-2024-004', '2023-12-20', '2024-01-05', 85000, 30000, 55000, 'ค้างชำระ', 'ลูกค้าขอผ่อนชำระ 3 งวด', 'คุณสมชาย');

-- Insert follow-up history for AR-001
INSERT INTO `accounting_ar_follow_ups` (ar_id, follow_up_date, channel, detail, next_follow_up_date, user_name) VALUES
(1, '2024-02-29', 'โทรศัพท์', 'โทรติดตามครั้งที่ 2 ลูกค้าแจ้งว่าจะชำระภายในสัปดาห์หน้า', '2024-03-07', 'คุณสมชาย'),
(1, '2024-02-15', 'LINE', 'ส่งข้อความแจ้งเตือนครบกำหนดชำระ ลูกค้าอ่านแล้วยังไม่ตอบ', '2024-02-29', 'คุณสมชาย'),
(1, '2024-01-26', 'โทรศัพท์', 'โทรแจ้งครบกำหนดชำระ ลูกค้ารับทราบแต่ขอเลื่อน', '2024-02-15', 'คุณสมชาย');

-- Insert follow-up history for AR-003
INSERT INTO `accounting_ar_follow_ups` (ar_id, follow_up_date, channel, detail, next_follow_up_date, user_name) VALUES
(3, '2024-01-19', 'โทรศัพท์', 'ลูกค้าโอนเงินเข้าบัญชีเรียบร้อย ยืนยันสลิปแล้ว', NULL, 'คุณสมศักดิ์');

-- Insert follow-up history for AR-004
INSERT INTO `accounting_ar_follow_ups` (ar_id, follow_up_date, channel, detail, next_follow_up_date, user_name) VALUES
(4, '2024-02-28', 'เข้าพบ', 'เข้าพบลูกค้าที่สำนักงาน ตกลงผ่อนชำระ 3 งวด งวดละ ~18,333 บาท เริ่มงวดแรก 15 มี.ค.', '2024-03-15', 'คุณสมชาย'),
(4, '2024-02-10', 'อีเมล', 'ส่งอีเมลแจ้งยอดค้างชำระพร้อมใบแจ้งหนี้ฉบับใหม่', '2024-02-20', 'คุณสมชาย'),
(4, '2024-01-20', 'โทรศัพท์', 'โทรแจ้งครบกำหนด ลูกค้าแจ้งว่ามีปัญหากระแสเงินสด ขอผ่อนผัน', '2024-02-10', 'คุณสมชาย');
