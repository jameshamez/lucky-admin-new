-- ===================================================
-- ตาราง orders (คำสั่งซื้อหลัก)
-- ===================================================
CREATE TABLE IF NOT EXISTS `orders` (
  `id`                  INT(11)        NOT NULL AUTO_INCREMENT,
  `job_id`              VARCHAR(50)    NOT NULL UNIQUE COMMENT 'รหัสงาน เช่น JOB-2024-001',
  `quotation_number`    VARCHAR(50)    DEFAULT NULL COMMENT 'เลขใบเสนอราคา',
  `order_date`          DATE           NOT NULL DEFAULT (CURDATE()),

  -- พนักงาน
  `responsible_person`  VARCHAR(100)   NOT NULL DEFAULT '',

  -- ลูกค้า
  `customer_id`         INT(11)        DEFAULT NULL COMMENT 'FK customers table (optional)',
  `customer_name`       VARCHAR(255)   NOT NULL,
  `customer_phone`      VARCHAR(50)    DEFAULT '',
  `customer_line`       VARCHAR(100)   DEFAULT '' COMMENT 'LINE ID / ชื่อ LINE',
  `customer_email`      VARCHAR(255)   DEFAULT '',
  `customer_address`    TEXT           DEFAULT NULL,

  -- ข้อมูลภาษี
  `require_tax_invoice` TINYINT(1)     NOT NULL DEFAULT 0,
  `tax_payer_name`      VARCHAR(255)   DEFAULT NULL,
  `tax_id`              VARCHAR(20)    DEFAULT NULL,
  `tax_address`         TEXT           DEFAULT NULL,

  -- รายละเอียดงาน
  `urgency_level`       VARCHAR(50)    NOT NULL DEFAULT 'ปกติ',
  `job_name`            VARCHAR(255)   NOT NULL DEFAULT '',
  `event_location`      VARCHAR(255)   DEFAULT NULL,
  `usage_date`          DATE           DEFAULT NULL,
  `delivery_date`       DATE           DEFAULT NULL,
  `product_category`    VARCHAR(100)   NOT NULL DEFAULT '' COMMENT 'สินค้าสำเร็จรูป / สินค้าสั่งผลิต / etc',
  `product_type`        VARCHAR(100)   NOT NULL DEFAULT '' COMMENT 'Trophy / Medal / ReadyMedal / etc',
  `budget`              DECIMAL(12,2)  DEFAULT NULL,
  `sales_channel`       VARCHAR(100)   DEFAULT NULL,

  -- ราคา
  `subtotal`            DECIMAL(12,2)  NOT NULL DEFAULT 0,
  `delivery_cost`       DECIMAL(12,2)  NOT NULL DEFAULT 0,
  `vat_amount`          DECIMAL(12,2)  NOT NULL DEFAULT 0,
  `total_amount`        DECIMAL(12,2)  NOT NULL DEFAULT 0,

  -- การชำระเงิน
  `payment_method`      VARCHAR(100)   DEFAULT '',
  `payment_status`      VARCHAR(50)    NOT NULL DEFAULT 'รอชำระเงิน',
  `paid_amount`         DECIMAL(12,2)  NOT NULL DEFAULT 0,

  -- การจัดส่ง
  `delivery_type`       VARCHAR(50)    NOT NULL DEFAULT 'parcel' COMMENT 'parcel/pickup/staff',
  `delivery_method`     VARCHAR(100)   DEFAULT '',
  `delivery_recipient`  VARCHAR(255)   DEFAULT NULL,
  `delivery_phone`      VARCHAR(50)    DEFAULT NULL,
  `delivery_address`    TEXT           DEFAULT NULL,
  `preferred_delivery_date` DATE       DEFAULT NULL,

  -- สถานะ
  `order_status`        VARCHAR(50)    NOT NULL DEFAULT 'สร้างคำสั่งซื้อใหม่',
  `job_created`         TINYINT(1)     NOT NULL DEFAULT 0,
  `departments`         VARCHAR(500)   DEFAULT NULL COMMENT 'JSON array of assigned departments',

  -- Metadata
  `notes`               TEXT           DEFAULT NULL,
  `created_at`          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_job_id`        (`job_id`),
  KEY `idx_customer_id`   (`customer_id`),
  KEY `idx_order_status`  (`order_status`),
  KEY `idx_payment_status`(`payment_status`),
  KEY `idx_order_date`    (`order_date`),
  KEY `idx_delivery_date` (`delivery_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===================================================
-- ตาราง order_items (รายการสินค้าในคำสั่งซื้อ)
-- รองรับทั้ง "สินค้าสำเร็จรูป" (อ้างอิง product_id) และ "สินค้าสั่งผลิต"
-- ===================================================
CREATE TABLE IF NOT EXISTS `order_items` (
  `id`              INT(11)        NOT NULL AUTO_INCREMENT,
  `order_id`        INT(11)        NOT NULL,
  `product_id`      INT(11)        DEFAULT NULL COMMENT 'FK products table (สำหรับสินค้าสำเร็จรูป)',
  `item_type`       VARCHAR(50)    NOT NULL DEFAULT 'custom' COMMENT 'catalog / custom',
  `product_name`    VARCHAR(255)   NOT NULL COMMENT 'ชื่อสินค้า / ประเภทสินค้า',
  `product_code`    VARCHAR(100)   DEFAULT NULL,
  `material`        VARCHAR(255)   DEFAULT NULL,
  `size`            VARCHAR(100)   DEFAULT NULL,
  `color`           VARCHAR(100)   DEFAULT NULL,
  `quantity`        INT(11)        NOT NULL DEFAULT 0,
  `unit_price`      DECIMAL(12,2)  NOT NULL DEFAULT 0,
  `total_price`     DECIMAL(12,2)  NOT NULL DEFAULT 0,
  `details`         TEXT           DEFAULT NULL COMMENT 'JSON รายละเอียดพิเศษ (engravings, colors, etc)',
  `created_at`      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_order_id`   (`order_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===================================================
-- ตาราง order_payments (ประวัติการชำระเงิน)
-- ===================================================
CREATE TABLE IF NOT EXISTS `order_payments` (
  `id`              INT(11)        NOT NULL AUTO_INCREMENT,
  `order_id`        INT(11)        NOT NULL,
  `payment_type`    VARCHAR(50)    NOT NULL COMMENT 'deposit / full / design_fee / additional',
  `payment_label`   VARCHAR(100)   DEFAULT NULL,
  `amount`          DECIMAL(12,2)  NOT NULL DEFAULT 0,
  `transfer_date`   DATE           DEFAULT NULL,
  `slip_url`        VARCHAR(500)   DEFAULT NULL,
  `additional_details` TEXT        DEFAULT NULL,
  `created_at`      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  CONSTRAINT `fk_order_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===================================================
-- ตัวอย่าง: ถ้ายังไม่มีตาราง products สำหรับสินค้าสำเร็จรูป
-- (ถ้ามีแล้วสามารถข้ามส่วนนี้ได้)
--
-- CREATE TABLE IF NOT EXISTS `products` (
--   `id`            INT(11)       NOT NULL AUTO_INCREMENT,
--   `product_code`  VARCHAR(100)  NOT NULL UNIQUE,
--   `name`          VARCHAR(255)  NOT NULL,
--   `category`      VARCHAR(100)  NOT NULL DEFAULT 'สินค้าสำเร็จรูป',
--   `subcategory`   VARCHAR(100)  DEFAULT NULL,
--   `product_type`  VARCHAR(100)  NOT NULL COMMENT 'Trophy / ReadyMedal / WoodAward',
--   `material`      VARCHAR(255)  DEFAULT NULL,
--   `size`          VARCHAR(100)  DEFAULT NULL,
--   `unit_price`    DECIMAL(12,2) NOT NULL DEFAULT 0,
--   `stock_qty`     INT(11)       NOT NULL DEFAULT 0,
--   `min_qty`       INT(11)       NOT NULL DEFAULT 0,
--   `stock_status`  VARCHAR(50)   NOT NULL DEFAULT 'in_stock',
--   `image_url`     VARCHAR(500)  DEFAULT NULL,
--   `description`   TEXT          DEFAULT NULL,
--   `is_active`     TINYINT(1)    NOT NULL DEFAULT 1,
--   `created_at`    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
--   `updated_at`    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   PRIMARY KEY (`id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- ===================================================
