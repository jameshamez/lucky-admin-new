-- Procurement Module Tables
-- Created: 2026-03-13

USE `finfinph_lcukycompany`;

-- 1. Suppliers
CREATE TABLE IF NOT EXISTS procurement_suppliers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    specialty TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Materials (Settings)
CREATE TABLE IF NOT EXISTS procurement_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100),
    material_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Colors (Settings)
CREATE TABLE IF NOT EXISTS procurement_colors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_en VARCHAR(100),
    name_th VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Shipping Methods (Settings)
CREATE TABLE IF NOT EXISTS procurement_shipping_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Procurement Tracking (Data for Dashboard)
CREATE TABLE IF NOT EXISTS procurement_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    job_id VARCHAR(50),
    project_name VARCHAR(255),
    status VARCHAR(100),
    priority VARCHAR(50),
    update_time DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Procurement Tasks
CREATE TABLE IF NOT EXISTS procurement_tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL,
    priority VARCHAR(50),
    due_time VARCHAR(20),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Settings (Markup, Exchange Rate, etc.)
CREATE TABLE IF NOT EXISTS procurement_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed initial data
INSERT INTO procurement_suppliers (name, contact, specialty) VALUES 
('China B&C', 'สมชาย', 'เหรียญ, ถ้วย'),
('China LINDA', 'สมหญิง', 'โล่, คริสตัล');

INSERT INTO procurement_materials (category, material_name) VALUES 
('เหรียญ', 'ซิงค์อัลลอย'),
('เหรียญ', 'อะคริลิก');

INSERT INTO procurement_colors (name_en, name_th) VALUES 
('shinny gold', 'สีทองเงา'),
('shinny silver', 'สีเงินเงา');

INSERT INTO procurement_shipping_methods (name) VALUES 
('Air Freight'),
('Sea Freight'),
('EK Freight');

INSERT INTO procurement_settings (setting_key, setting_value) VALUES 
('exchange_rate', '5.5'),
('vat_rate', '7');
