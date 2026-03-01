CREATE TABLE `vehicle_reservations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vehicle_type` varchar(50) NOT NULL,
  `purpose` text NOT NULL,
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `requester` varchar(255) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'รออนุมัติ',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
