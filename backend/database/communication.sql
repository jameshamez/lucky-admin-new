-- Communication Module Tables

-- 1. Communication Channels
CREATE TABLE IF NOT EXISTS communication_channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20) DEFAULT 'bg-primary',
    type ENUM('public', 'private', 'department') DEFAULT 'public',
    department VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Communication Messages
CREATE TABLE IF NOT EXISTS communication_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    channel_id INT NOT NULL,
    user_id INT, -- NULL if system message
    user_name VARCHAR(100), -- Denormalized for quick display
    avatar_fallback VARCHAR(10),
    message TEXT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES communication_channels(id) ON DELETE CASCADE
);

-- 3. Announcements
CREATE TABLE IF NOT EXISTS communication_announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INT,
    author_name VARCHAR(100),
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Shared Files
CREATE TABLE IF NOT EXISTS communication_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size VARCHAR(50),
    file_type VARCHAR(50),
    uploaded_by INT,
    uploader_name VARCHAR(100),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. User Notifications
CREATE TABLE IF NOT EXISTS user_notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT, -- Target user, NULL for all
    message TEXT NOT NULL,
    type ENUM('success', 'warning', 'info', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data
INSERT INTO communication_channels (name, description, icon, color, type, department) VALUES
('ช่องทั่วไป', 'สื่อสารทั่วไปสำหรับทุกคน', 'Hash', 'bg-primary', 'public', 'General'),
('ฝ่ายขาย', 'สำหรับทีมขายเท่านั้น', 'MessageSquare', 'bg-success', 'department', 'Sales'),
('ฝ่ายกราฟิก', 'สำหรับทีมออกแบบ', 'MessageSquare', 'bg-warning', 'department', 'Design'),
('ฝ่ายผลิต', 'สำหรับทีมโรงงาน', 'MessageSquare', 'bg-info', 'department', 'Production'),
('ฝ่ายจัดซื้อ', 'สำหรับทีมจัดซื้อ', 'MessageSquare', 'bg-accent', 'department', 'Procurement'),
('ฝ่ายบัญชี', 'สำหรับทีมบัญชี', 'MessageSquare', 'bg-secondary', 'department', 'Accounting'),
('ฝ่ายบุคคล', 'สำหรับทีม HR', 'MessageSquare', 'bg-muted', 'department', 'HR');

INSERT INTO communication_messages (channel_id, user_name, avatar_fallback, message, is_system) VALUES
(1, 'สมชาย ใจดี', 'SC', 'สวัสดีครับทุกคน ขอประกาศว่าเราได้ออเดอร์ใหญ่เข้ามาแล้ว', FALSE),
(1, 'ระบบแจ้งเตือน', 'SYS', '🔔 ออเดอร์ #ORD-2024-001 ได้รับการอนุมัติแล้ว - ฝ่ายกราฟิกสามารถเริ่มงานได้', TRUE),
(1, 'นางสาวใจ ใส', 'NI', 'รับทราบครับ จะเริ่มออกแบบทันที', FALSE);

INSERT INTO communication_announcements (title, content, author_name, is_pinned) VALUES
('ประกาศวันหยุดประจำปี 2024', 'บริษัทจะหยุดทำการในวันสำคัญของชาติตามปฏิทินที่กำหนด', 'ฝ่ายบุคคล', TRUE),
('นโยบายใหม่เรื่องการทำงานล่วงเวลา', 'มีการปรับปรุงนโยบายการทำงานล่วงเวลาใหม่', 'ผู้จัดการทั่วไป', FALSE);

INSERT INTO user_notifications (message, type) VALUES
('ฝ่ายกราฟิกส่งงานออกแบบเสร็จแล้ว - ออเดอร์ #ORD-001', 'success'),
('งานใกล้เลยกำหนด - ออเดอร์ #ORD-002 (เหลือ 2 วัน)', 'warning'),
('คำขอเบิกวัตถุดิบใหม่รอการอนุมัติ', 'info');
