<?php
header("Content-Type: application/json; charset=UTF-8");
require '../../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');

$sql = "ALTER TABLE `orders` ADD COLUMN IF NOT EXISTS `production_workflow` LONGTEXT NULL COMMENT 'JSON data for production steps details' AFTER `departments`";
if ($conn->query($sql)) {
    echo json_encode(["status" => "success", "message" => "Added production_workflow column"]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $conn->error]);
}
$conn->close();
?>