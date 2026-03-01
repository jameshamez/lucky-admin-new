-- ===== ตาราง customer_orders =====
CREATE TABLE `customer_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `order_code` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT 0,
  `paid_amount` decimal(12,2) NOT NULL DEFAULT 0,
  `status` varchar(50) NOT NULL DEFAULT 'รอการอนุมัติ',
  `items` int(11) NOT NULL DEFAULT 0,
  `order_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===== ตาราง customer_design_files =====
CREATE TABLE `customer_design_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `version` varchar(50) NOT NULL DEFAULT 'V1',
  `file_url` varchar(500) DEFAULT NULL,
  `department` varchar(50) NOT NULL DEFAULT 'sales',
  `uploaded_by` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ===== ตาราง customer_notes =====
CREATE TABLE `customer_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `author` varchar(100) NOT NULL DEFAULT 'ผู้ใช้งาน',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
