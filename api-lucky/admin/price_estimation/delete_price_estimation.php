<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../../condb.php';
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

$data = json_decode(file_get_contents("php://input"));

if (empty($data->id)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID is required"]);
    exit();
}

// Soft delete: Update status to 'ยกเลิก' (Cancelled)
$sql = "UPDATE price_estimations SET status = 'ยกเลิก' WHERE id = ?";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
    exit();
}

$stmt->bind_param("s", $data->id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(["status" => "success", "message" => "Price estimation cancelled successfully"]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Price estimation not found or already cancelled"]);
    }
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to cancel price estimation: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>