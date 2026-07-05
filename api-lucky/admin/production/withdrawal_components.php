<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require __DIR__ . '/../../condb.php';
/** @var mysqli $conn */
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

try {
    $data = [];
    $res = $conn->query("SELECT * FROM `production_withdrawal_components` ORDER BY sort_order ASC, id ASC");
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $data[] = [
                "id" => (string) $row['id'],
                "name" => $row['name'],
                "color" => $row['color'],
                "size" => $row['size'],
                "requiredQty" => (int) $row['required_qty'],
                "unit" => $row['unit'],
                "image" => $row['image'],
            ];
        }
    }
    echo json_encode(["status" => "success", "data" => $data]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
