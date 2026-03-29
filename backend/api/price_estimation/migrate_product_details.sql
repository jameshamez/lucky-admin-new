-- Migration: Add product extra detail columns
-- Tables: price_estimations (used by save_price_estimation.php) and price_estimations_sales (used by price_estimations.php)

-- For price_estimations table
ALTER TABLE `price_estimations`
  ADD COLUMN `product_color` varchar(255) DEFAULT NULL AFTER `generic_design_details`,
  ADD COLUMN `product_size` varchar(255) DEFAULT NULL AFTER `product_color`,
  ADD COLUMN `product_details` text DEFAULT NULL AFTER `product_size`;

-- For price_estimations_sales table
ALTER TABLE `price_estimations_sales`
  ADD COLUMN `product_color` varchar(255) DEFAULT NULL,
  ADD COLUMN `product_size` varchar(255) DEFAULT NULL,
  ADD COLUMN `product_details` text DEFAULT NULL;
