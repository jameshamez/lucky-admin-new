<?php
require_once "../../condb.php";
$conn->select_db('finfinph_lcukycompany'); // Removed hardcoded DB selection

// Check if role and status columns exist in employees table
$result = $conn->query("SHOW COLUMNS FROM `employees` LIKE 'role'");
if ($result->num_rows == 0) {
    $conn->query("ALTER TABLE `employees` ADD COLUMN `role` VARCHAR(50) DEFAULT 'General' AFTER `position` ");
}

$result = $conn->query("SHOW COLUMNS FROM `employees` LIKE 'status'");
if ($result->num_rows == 0) {
    $conn->query("ALTER TABLE `employees` ADD COLUMN `status` VARCHAR(50) DEFAULT 'ACTIVE' AFTER `role` ");
}

$result = $conn->query("SHOW COLUMNS FROM `employees` LIKE 'hire_date'");
if ($result->num_rows == 0) {
    $conn->query("ALTER TABLE `employees` ADD COLUMN `hire_date` DATE AFTER `status` ");
}

$result = $conn->query("SHOW COLUMNS FROM `employees` LIKE 'resign_date'");
if ($result->num_rows == 0) {
    $conn->query("ALTER TABLE `employees` ADD COLUMN `resign_date` DATE AFTER `hire_date` ");
}

// Check if hr_sales_targets table exists
$conn->query("CREATE TABLE IF NOT EXISTS `hr_sales_targets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` VARCHAR(50) NOT NULL,
    `month` VARCHAR(7) NOT NULL, -- YYYY-MM
    `target_amount` DECIMAL(15,2) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `emp_month` (`employee_id`, `month`)
)");

// Check if hr_commission_mto table exists
$conn->query("CREATE TABLE IF NOT EXISTS `hr_commission_mto` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `delivery_date` DATE NOT NULL,
    `po_number` VARCHAR(100) NOT NULL UNIQUE,
    `job_name` VARCHAR(255),
    `product_category` VARCHAR(255),
    `sale_name` VARCHAR(255),
    `quantity` INT DEFAULT 0,
    `total_sales_amount` DECIMAL(15,2) DEFAULT 0,
    `tier_condition` VARCHAR(100),
    `commission_amount` DECIMAL(15,2) DEFAULT 0,
    `calc_description` TEXT,
    `commission_status` ENUM('PENDING', 'COMPLETED') DEFAULT 'PENDING',
    `processed_at` DATETIME,
    `commission_period` VARCHAR(10),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Check if hr_commission_ready_made table exists
$conn->query("CREATE TABLE IF NOT EXISTS `hr_commission_ready_made` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `delivery_date` DATE NOT NULL,
    `po_number` VARCHAR(100) NOT NULL UNIQUE,
    `job_name` VARCHAR(255),
    `product_category` VARCHAR(255),
    `sale_name` VARCHAR(255),
    `quantity` INT DEFAULT 0,
    `total_sales_amount` DECIMAL(15,2) DEFAULT 0,
    `rate_display` VARCHAR(100),
    `base_amount` VARCHAR(100),
    `commission_amount` DECIMAL(15,2) DEFAULT 0,
    `calc_description` TEXT,
    `commission_status` ENUM('PENDING', 'COMPLETED') DEFAULT 'PENDING',
    `processed_at` DATETIME,
    `commission_period` VARCHAR(10),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Check if hr_config_ready_made table exists
$conn->query("CREATE TABLE IF NOT EXISTS `hr_config_ready_made` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category` VARCHAR(255) NOT NULL,
    `rate_per_unit` DECIMAL(15,2) DEFAULT 0,
    `unit` VARCHAR(50) DEFAULT 'ชิ้น',
    `calc_method` ENUM('perUnit', 'percentSales') DEFAULT 'perUnit',
    `active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Check if hr_config_mto table exists
$conn->query("CREATE TABLE IF NOT EXISTS `hr_config_mto` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category` VARCHAR(255) NOT NULL,
    `calc_method` ENUM('tier', 'fixedPerJob') DEFAULT 'tier',
    `fixed_per_job` DECIMAL(15,2) DEFAULT 0,
    `active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Check if hr_config_mto_tiers table exists
$conn->query("CREATE TABLE IF NOT EXISTS `hr_config_mto_tiers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `mto_config_id` INT NOT NULL,
    `min_qty` INT DEFAULT 0,
    `max_qty` INT,
    `fixed_amount` DECIMAL(15,2) DEFAULT 0,
    `label` VARCHAR(100),
    INDEX (`mto_config_id`)
)");

// Check if hr_config_incentives table exists
$conn->query("CREATE TABLE IF NOT EXISTS `hr_config_incentives` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `min_sales` DECIMAL(15,2) DEFAULT 0,
    `max_sales` DECIMAL(15,2),
    `incentive_per_person` DECIMAL(15,2) DEFAULT 0,
    `label` VARCHAR(100),
    `active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Check if hr_kpi_records table exists
$conn->query("CREATE TABLE IF NOT EXISTS `hr_kpi_records` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` VARCHAR(50),
    `employee_name` VARCHAR(255),
    `department` VARCHAR(100),
    `month` VARCHAR(7),
    `kpi_score` DECIMAL(5,2) DEFAULT 0,
    `remark` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Check if hr_kpi_integrations table exists
$conn->query("CREATE TABLE IF NOT EXISTS `hr_kpi_integrations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `department` VARCHAR(100),
    `data_source_type` VARCHAR(50),
    `sheet_url` TEXT,
    `api_endpoint` TEXT,
    `note` TEXT,
    `active` TINYINT(1) DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

// Seed Ready-Made Configs
$res = $conn->query("SELECT COUNT(*) as cnt FROM hr_config_ready_made");
if ($res->fetch_assoc()['cnt'] == 0) {
    $conn->query("INSERT INTO hr_config_ready_made (category, rate_per_unit, unit, calc_method, active) VALUES 
        ('ถ้วยรางวัล พลาสติก ไทย', 3, 'ชิ้น', 'perUnit', 1),
        ('ถ้วยรางวัล พลาสติก จีน', 5, 'ชิ้น', 'perUnit', 1),
        ('ถ้วยรางวัล พิวเตอร์/เบญจรงค์', 30, 'ชิ้น', 'perUnit', 1),
        ('ถ้วยรางวัล โลหะ (S/M)', 10, 'ชิ้น', 'perUnit', 1),
        ('ถ้วยรางวัล โลหะ (L/XL)', 30, 'ชิ้น', 'perUnit', 1),
        ('โล่รางวัล (มาตรฐาน)', 3, 'ชิ้น', 'perUnit', 1),
        ('เหรียญรางวัล (มาตรฐาน)', 0.5, 'ชิ้น', 'perUnit', 1),
        ('ระบบวิ่ง', 1, 'คน', 'perUnit', 1),
        ('อะไหล่ชิ้นส่วนถ้วยรางวัล', 5, '%ยอดขาย', 'percentSales', 1)");
}

// Seed MTO Configs and Tiers
$res = $conn->query("SELECT COUNT(*) as cnt FROM hr_config_mto");
if ($res->fetch_assoc()['cnt'] == 0) {
    // b1
    $conn->query("INSERT INTO hr_config_mto (id, category, calc_method, active) VALUES (1, 'โล่สั่งผลิต (อะคริลิค/ไม้/คริสตัล/เรซิ่น/เหรียญอะคริลิค)', 'tier', 1)");
    $conn->query("INSERT INTO hr_config_mto_tiers (mto_config_id, min_qty, max_qty, fixed_amount, label) VALUES 
        (1, 1, 10, 50, '1-10 ชิ้น'), (1, 11, 50, 100, '11-50 ชิ้น'), (1, 51, 100, 200, '51-100 ชิ้น'), (1, 101, 300, 300, '101-300 ชิ้น'), (1, 301, NULL, 500, '301+ ชิ้น')");
    // b2
    $conn->query("INSERT INTO hr_config_mto (id, category, calc_method, active) VALUES (2, 'เหรียญรางวัล (สั่งผลิต)', 'tier', 1)");
    $conn->query("INSERT INTO hr_config_mto_tiers (mto_config_id, min_qty, max_qty, fixed_amount, label) VALUES 
        (2, 1, 10000, 250, '1-10,000 ชิ้น'), (2, 10001, NULL, 500, '10,001+ ชิ้น')");
    // b3
    $conn->query("INSERT INTO hr_config_mto (id, category, calc_method, active) VALUES (3, 'เสื้อ', 'tier', 1)");
    $conn->query("INSERT INTO hr_config_mto_tiers (mto_config_id, min_qty, max_qty, fixed_amount, label) VALUES 
        (3, 1, 1000, 100, '1-1,000 ตัว'), (3, 1001, 3000, 200, '1,001-3,000 ตัว'), (3, 3001, NULL, 500, '3,001+ ตัว')");
    // b4
    $conn->query("INSERT INTO hr_config_mto (id, category, calc_method, active) VALUES (4, 'BIB', 'tier', 1)");
    $conn->query("INSERT INTO hr_config_mto_tiers (mto_config_id, min_qty, max_qty, fixed_amount, label) VALUES (4, 1, NULL, 0, 'ทุกจำนวน')");
    // b5
    $conn->query("INSERT INTO hr_config_mto (id, category, calc_method, fixed_per_job, active) VALUES (5, 'ออแกไนท์', 'fixedPerJob', 5000, 1)");
}

// Seed Incentives
$res = $conn->query("SELECT COUNT(*) as cnt FROM hr_config_incentives");
if ($res->fetch_assoc()['cnt'] == 0) {
    $conn->query("INSERT INTO hr_config_incentives (min_sales, max_sales, incentive_per_person, label, active) VALUES 
        (2300000, 2499999, 500, '2,300,000 - 2,499,999', 1),
        (2500000, 2699999, 2500, '2,500,000 - 2,699,999', 1),
        (2700000, 2999999, 3000, '2,700,000 - 2,999,999', 1),
        (3000000, 3499999, 3500, '3,000,000 - 3,499,999', 1),
        (3500000, 3999999, 4000, '3,500,000 - 3,999,999', 1),
        (4000000, 4999999, 4500, '4,000,000 - 4,999,999', 1),
        (5000000, NULL, 5000, '5,000,000+', 1)");
}

// Seed Sales Targets
$res = $conn->query("SELECT COUNT(*) as cnt FROM hr_sales_targets");
if ($res->fetch_assoc()['cnt'] == 0) {
    $conn->query("INSERT INTO hr_sales_targets (employee_id, month, target_amount) VALUES 
        ('EMP-001', '2025-01', 200000), ('EMP-002', '2025-01', 180000), ('EMP-003', '2025-01', 250000),
        ('EMP-001', '2025-02', 220000), ('EMP-002', '2025-02', 180000), ('EMP-003', '2025-02', 280000)");
}

// Update some hire dates for demo
$conn->query("UPDATE employees SET hire_date = '2024-01-15' WHERE hire_date IS NULL LIMIT 5");

echo "Database updated successfully";
$conn->close();
?>