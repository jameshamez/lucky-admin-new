<?php
header("Content-Type: application/json; charset=UTF-8");
require '../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');

$statements = [
    "ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `cost_price` DECIMAL(12,2) NULL DEFAULT NULL COMMENT 'ราคาต้นทุนสินค้า (ฝ่ายบัญชี)' AFTER `unit_price`",
    "ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `shipping_cost` DECIMAL(12,2) NULL DEFAULT NULL COMMENT 'ค่าขนส่ง (ฝ่ายบัญชี)' AFTER `cost_price`",
    "ALTER TABLE `products` ADD COLUMN IF NOT EXISTS `vat_price` DECIMAL(12,2) NULL DEFAULT NULL COMMENT 'VAT (ฝ่ายบัญชี)' AFTER `shipping_cost`",
];

$results = [];
foreach ($statements as $sql) {
    if ($conn->query($sql)) {
        $results[] = "OK: $sql";
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $conn->error, "sql" => $sql]);
        exit();
    }
}

echo json_encode(["status" => "success", "message" => "Added cost_price, shipping_cost, vat_price columns to products", "details" => $results]);
$conn->close();
