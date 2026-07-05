CREATE TABLE IF NOT EXISTS `price_estimations` (
  `id` varchar(36) NOT NULL,
  `customer_id` varchar(36) NOT NULL,
  `sales_owner_id` varchar(50) DEFAULT NULL,
  `estimate_date` date DEFAULT NULL,
  `job_name` varchar(255) DEFAULT NULL,
  `product_category` varchar(100) DEFAULT NULL,
  `product_type` varchar(100) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `budget` decimal(10,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'รอประเมินราคา',
  `event_date` date DEFAULT NULL,
  `material` varchar(100) DEFAULT NULL,
  `custom_material` varchar(255) DEFAULT NULL,
  `has_design` varchar(50) DEFAULT NULL,
  `design_description` text DEFAULT NULL,
  `estimate_note` text DEFAULT NULL,

  -- Medal Specifics
  `medal_size` varchar(50) DEFAULT NULL,
  `medal_thickness` varchar(50) DEFAULT NULL,
  `selected_colors` text DEFAULT NULL, -- JSON
  `front_details` text DEFAULT NULL, -- JSON
  `back_details` text DEFAULT NULL, -- JSON

  -- Lanyard Specifics
  `lanyard_size` varchar(50) DEFAULT NULL,
  `lanyard_patterns` varchar(50) DEFAULT NULL,
  `strap_size` varchar(50) DEFAULT NULL,
  `strap_pattern_count` varchar(50) DEFAULT NULL,
  `sewing_option` varchar(50) DEFAULT NULL,

  -- Award/Plaque Specifics
  `award_design_details` text DEFAULT NULL,
  `plaque_option` varchar(50) DEFAULT NULL,
  `plaque_text` text DEFAULT NULL,
  `inscription_plate` varchar(50) DEFAULT NULL,
  `inscription_details` text DEFAULT NULL,

  -- Generic
  `generic_design_details` text DEFAULT NULL,

  -- Product Extra Details
  `product_color` varchar(255) DEFAULT NULL,
  `product_size` varchar(255) DEFAULT NULL,
  `product_details` text DEFAULT NULL,

  -- Dimensions
  `width` decimal(10,2) DEFAULT NULL,
  `length` decimal(10,2) DEFAULT NULL,
  `height` decimal(10,2) DEFAULT NULL,
  `thickness` decimal(10,2) DEFAULT NULL,

  -- Files
  `attached_files` text DEFAULT NULL, -- JSON

  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),

  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
