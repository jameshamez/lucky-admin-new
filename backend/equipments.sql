CREATE TABLE `equipments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipment_name` varchar(255) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `current_qty` int(11) NOT NULL DEFAULT 0,
  `min_qty` int(11) NOT NULL DEFAULT 0,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `equipment_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `request_date` date NOT NULL,
  `equipment_id` int(11) NOT NULL,
  `equipment_name` varchar(255) NOT NULL,
  `qty` int(11) NOT NULL,
  `department` varchar(100) NOT NULL,
  `requester` varchar(255) NOT NULL,
  `remark` text DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'รออนุมัติ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert some dummy data
INSERT INTO `equipments` (`equipment_name`, `unit`, `current_qty`, `min_qty`) VALUES
('ปากกาเจล สีน้ำเงิน', 'แท่ง', 100, 10),
('กระดาษ A4', 'รีม', 50, 5),
('เมาส์ไร้สาย', 'ชิ้น', 20, 2),
('สมุดบันทึก', 'เล่ม', 80, 10);
