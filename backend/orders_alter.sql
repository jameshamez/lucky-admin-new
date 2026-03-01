-- ===========================================================
-- ALTER TABLE orders
-- เพิ่ม columns ที่ขาดเข้าไปในตาราง orders ที่มีอยู่แล้ว
-- ไม่กระทบข้อมูลเดิม (ใช้ ADD COLUMN IF NOT EXISTS)
-- ===========================================================
-- รัน script นี้ใน phpMyAdmin หรือ MySQL CLI
-- ===========================================================

-- =================== คอลัมน์ที่มีอยู่แล้ว (ข้าม) ===================
-- order_id, customer_id, order_date, usage_date,
-- delivery_method, total_price, status,
-- needs_tax_invoice, invoice_id, tracking_number
-- ====================================================================

ALTER TABLE `orders`

    -- ===== ข้อมูลการสั่งซื้อ =====
    ADD COLUMN IF NOT EXISTS `job_id`               VARCHAR(50)    NULL        COMMENT 'รหัสงาน JOB-YYYY-XXXX'             AFTER `order_id`,
    ADD COLUMN IF NOT EXISTS `quotation_number`     VARCHAR(50)    NULL        COMMENT 'เลขใบเสนอราคา'                     AFTER `job_id`,
    ADD COLUMN IF NOT EXISTS `job_name`             VARCHAR(255)   NOT NULL DEFAULT '' COMMENT 'ชื่องาน / รายละเอียดสั่ง' AFTER `quotation_number`,
    ADD COLUMN IF NOT EXISTS `urgency_level`        VARCHAR(50)    NOT NULL DEFAULT 'ปกติ' COMMENT 'ความเร่งด่วน'          AFTER `job_name`,
    ADD COLUMN IF NOT EXISTS `sales_channel`        VARCHAR(100)   NULL        COMMENT 'ช่องทางการขาย'                    AFTER `urgency_level`,
    ADD COLUMN IF NOT EXISTS `responsible_person`   VARCHAR(100)   NOT NULL DEFAULT '' COMMENT 'พนักงานที่รับผิดชอบ'      AFTER `sales_channel`,

    -- ===== ข้อมูลลูกค้า =====
    ADD COLUMN IF NOT EXISTS `customer_name`        VARCHAR(255)   NOT NULL DEFAULT '' COMMENT 'ชื่อลูกค้า'               AFTER `customer_id`,
    ADD COLUMN IF NOT EXISTS `customer_phone`       VARCHAR(50)    NOT NULL DEFAULT '' COMMENT 'เบอร์โทร'                 AFTER `customer_name`,
    ADD COLUMN IF NOT EXISTS `customer_line`        VARCHAR(100)   NOT NULL DEFAULT '' COMMENT 'LINE ID'                  AFTER `customer_phone`,
    ADD COLUMN IF NOT EXISTS `customer_email`       VARCHAR(255)   NOT NULL DEFAULT '' COMMENT 'อีเมล'                    AFTER `customer_line`,
    ADD COLUMN IF NOT EXISTS `customer_address`     TEXT           NULL        COMMENT 'ที่อยู่ลูกค้า'                    AFTER `customer_email`,

    -- ===== ข้อมูลภาษี =====
    ADD COLUMN IF NOT EXISTS `tax_payer_name`       VARCHAR(255)   NULL        COMMENT 'ชื่อผู้เสียภาษี'                  AFTER `needs_tax_invoice`,
    ADD COLUMN IF NOT EXISTS `tax_id`               VARCHAR(20)    NULL        COMMENT 'เลขผู้เสียภาษี'                   AFTER `tax_payer_name`,
    ADD COLUMN IF NOT EXISTS `tax_address`          TEXT           NULL        COMMENT 'ที่อยู่ผู้เสียภาษี'               AFTER `tax_id`,

    -- ===== ข้อมูลสินค้า =====
    ADD COLUMN IF NOT EXISTS `product_category`     VARCHAR(100)   NOT NULL DEFAULT '' COMMENT 'สินค้าสำเร็จรูป / สั่งผลิต' AFTER `usage_date`,
    ADD COLUMN IF NOT EXISTS `product_type`         VARCHAR(100)   NOT NULL DEFAULT '' COMMENT 'Trophy / Medal / etc'     AFTER `product_category`,
    ADD COLUMN IF NOT EXISTS `budget`               DECIMAL(12,2)  NULL        COMMENT 'งบประมาณลูกค้า'                  AFTER `product_type`,

    -- ===== ราคา (เพิ่มเติมจาก total_price) =====
    ADD COLUMN IF NOT EXISTS `subtotal`             DECIMAL(12,2)  NOT NULL DEFAULT 0 COMMENT 'ยอดก่อน VAT'              AFTER `total_price`,
    ADD COLUMN IF NOT EXISTS `delivery_cost`        DECIMAL(12,2)  NOT NULL DEFAULT 0 COMMENT 'ค่าจัดส่ง'               AFTER `subtotal`,
    ADD COLUMN IF NOT EXISTS `vat_amount`           DECIMAL(12,2)  NOT NULL DEFAULT 0 COMMENT 'VAT 7%'                   AFTER `delivery_cost`,
    ADD COLUMN IF NOT EXISTS `total_amount`         DECIMAL(12,2)  NOT NULL DEFAULT 0 COMMENT 'ยอดรวมทั้งหมด'           AFTER `vat_amount`,

    -- ===== การชำระเงิน =====
    ADD COLUMN IF NOT EXISTS `payment_method`       VARCHAR(100)   NOT NULL DEFAULT '' COMMENT 'วิธีชำระเงิน'            AFTER `total_amount`,
    ADD COLUMN IF NOT EXISTS `payment_status`       VARCHAR(50)    NOT NULL DEFAULT 'รอชำระเงิน' COMMENT 'สถานะชำระ'    AFTER `payment_method`,
    ADD COLUMN IF NOT EXISTS `paid_amount`          DECIMAL(12,2)  NOT NULL DEFAULT 0 COMMENT 'ยอดที่ชำระแล้ว'         AFTER `payment_status`,

    -- ===== การจัดส่ง =====
    ADD COLUMN IF NOT EXISTS `delivery_date`        DATE           NULL        COMMENT 'วันกำหนดส่ง'                      AFTER `usage_date`,
    ADD COLUMN IF NOT EXISTS `event_location`       VARCHAR(255)   NULL        COMMENT 'สถานที่จัดงาน'                   AFTER `delivery_date`,
    ADD COLUMN IF NOT EXISTS `delivery_type`        VARCHAR(50)    NOT NULL DEFAULT 'parcel' COMMENT 'parcel/pickup/staff' AFTER `delivery_method`,
    ADD COLUMN IF NOT EXISTS `delivery_recipient`   VARCHAR(255)   NULL        COMMENT 'ชื่อผู้รับ'                       AFTER `delivery_type`,
    ADD COLUMN IF NOT EXISTS `delivery_phone`       VARCHAR(50)    NULL        COMMENT 'เบอร์โทรผู้รับ'                   AFTER `delivery_recipient`,
    ADD COLUMN IF NOT EXISTS `delivery_address`     TEXT           NULL        COMMENT 'ที่อยู่จัดส่ง'                    AFTER `delivery_phone`,
    ADD COLUMN IF NOT EXISTS `preferred_delivery_date` DATE        NULL        COMMENT 'วันที่ต้องการรับสินค้า'            AFTER `delivery_address`,

    -- ===== สถานะงาน =====
    ADD COLUMN IF NOT EXISTS `order_status`         VARCHAR(50)    NOT NULL DEFAULT 'สร้างคำสั่งซื้อใหม่' COMMENT 'สถานะคำสั่งซื้อ' AFTER `status`,
    ADD COLUMN IF NOT EXISTS `job_created`          TINYINT(1)     NOT NULL DEFAULT 0 COMMENT 'สร้างงานแล้วหรือยัง'      AFTER `order_status`,
    ADD COLUMN IF NOT EXISTS `departments`          VARCHAR(500)   NULL        COMMENT 'JSON array แผนกที่รับงาน'          AFTER `job_created`,

    -- ===== Metadata =====
    ADD COLUMN IF NOT EXISTS `notes`                TEXT           NULL        COMMENT 'หมายเหตุเพิ่มเติม',
    ADD COLUMN IF NOT EXISTS `updated_at`           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'อัปเดตล่าสุด';

-- ===== เพิ่ม Index ที่จำเป็น (IF NOT EXISTS ป้องกัน error ถ้ามีอยู่แล้ว) =====
ALTER TABLE `orders`
    ADD UNIQUE INDEX IF NOT EXISTS `idx_job_id`          (`job_id`),
    ADD        INDEX IF NOT EXISTS `idx_order_status`    (`order_status`),
    ADD        INDEX IF NOT EXISTS `idx_payment_status`  (`payment_status`),
    ADD        INDEX IF NOT EXISTS `idx_delivery_date`   (`delivery_date`),
    ADD        INDEX IF NOT EXISTS `idx_order_date_col`  (`order_date`);

-- ===================================================
-- ALTER TABLE order_items
-- เพิ่ม columns ที่ขาดเข้าไปในตารางที่มีอยู่แล้ว
-- คอลัมน์เดิม: item_id, order_id, product_id,
--              quantity, price, size, color,
--              width, height, weight
-- ===================================================
ALTER TABLE `order_items`

    -- ประเภทสินค้า: catalog (สำเร็จรูป) หรือ custom (สั่งผลิต)
    ADD COLUMN IF NOT EXISTS `item_type`      VARCHAR(50)   NOT NULL DEFAULT 'custom'
        COMMENT 'catalog / custom'                  AFTER `order_id`,

    -- ชื่อสินค้า / รหัสสินค้า
    ADD COLUMN IF NOT EXISTS `product_name`   VARCHAR(255)  NOT NULL DEFAULT ''
        COMMENT 'ชื่อสินค้า / ประเภทสินค้า'          AFTER `product_id`,
    ADD COLUMN IF NOT EXISTS `product_code`   VARCHAR(100)  NULL
        COMMENT 'รหัสสินค้า'                        AFTER `product_name`,

    -- วัสดุ
    ADD COLUMN IF NOT EXISTS `material`       VARCHAR(255)  NULL
        COMMENT 'วัสดุ'                             AFTER `product_code`,

    -- ราคาต่อหน่วย (คอลัมน์เดิมชื่อ price ≈ unit_price)
    -- ** ไม่ drop price เดิม เพิ่ม unit_price ใหม่ไว้คู่กัน **
    ADD COLUMN IF NOT EXISTS `unit_price`     DECIMAL(12,2) NOT NULL DEFAULT 0
        COMMENT 'ราคาต่อหน่วย (= price เดิม)'       AFTER `price`,

    -- ยอดรวมต่อ item
    ADD COLUMN IF NOT EXISTS `total_price_item` DECIMAL(12,2) NOT NULL DEFAULT 0
        COMMENT 'ยอดรวม (quantity × unit_price)'   AFTER `unit_price`,

    -- รายละเอียดพิเศษ (JSON): engravings, colors, sizes
    ADD COLUMN IF NOT EXISTS `details`        TEXT          NULL
        COMMENT 'JSON รายละเอียดพิเศษ'              AFTER `weight`,

    -- Timestamp
    ADD COLUMN IF NOT EXISTS `created_at`     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
        COMMENT 'วันที่สร้าง';

-- ===== Index สำหรับ order_items (ถ้ายังไม่มี) =====
ALTER TABLE `order_items`
    ADD INDEX IF NOT EXISTS `idx_oi_product_id` (`product_id`);

-- ===================================================
-- หมายเหตุ Mapping คอลัมน์ order_items:
--   price       (เดิม) → unit_price  (ใหม่):  API จะ COALESCE(unit_price, price)
--   item_id     (เดิม) → id          (ใหม่):  API ใช้ item_id ได้เลย
--   width/height/weight (พิเศษ)      → ยังคงไว้ ไม่กระทบ
-- ===================================================

-- ===================================================
-- สร้างตาราง order_payments (ถ้ายังไม่มี)
-- ===================================================
CREATE TABLE IF NOT EXISTS `order_payments` (
  `id`                 INT(11)       NOT NULL AUTO_INCREMENT,
  `order_id`           INT(11)       NOT NULL,
  `payment_type`       VARCHAR(50)   NOT NULL COMMENT 'deposit / full / design_fee / additional',
  `payment_label`      VARCHAR(100)  DEFAULT NULL,
  `amount`             DECIMAL(12,2) NOT NULL DEFAULT 0,
  `transfer_date`      DATE          DEFAULT NULL,
  `slip_url`           VARCHAR(500)  DEFAULT NULL,
  `additional_details` TEXT          DEFAULT NULL,
  `created_at`         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_op_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================
-- Mapping สรุปทั้งหมด:
-- orders:
--   status           → order_status   (COALESCE)
--   total_price      → total_amount   (COALESCE)
--   needs_tax_invoice→ require_tax_invoice (COALESCE)
--   delivery_method  → delivery_type  (เก็บทั้งคู่)
-- order_items:
--   item_id          → id             (ใช้ item_id ได้เลย)
--   price            → unit_price     (COALESCE)
-- ===================================================
