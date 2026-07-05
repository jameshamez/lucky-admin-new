<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../condb.php';
$conn->select_db('nacresc1_1');

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    $sql = "DELETE FROM customer_admin_activities WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $data->id);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Activity deleted successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database error"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID is required"]);
}
?>