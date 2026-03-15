<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../../condb.php';
/** @var mysqli $conn */

// Database Selection
$db_options = ['finfinph_lcukycompany', 'finfinph_luckycompany'];
foreach ($db_options as $db) {
    if (@$conn->select_db($db))
        break;
}
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $res = $conn->query("SELECT setting_key, setting_value FROM system_settings");
    $settings = [];
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $settings[$row['setting_key']] = json_decode($row['setting_value'], true);
        }
    }

    // If empty, return defaults or empty object
    if (empty($settings)) {
        echo json_encode(["status" => "success", "data" => []]);
    } else {
        echo json_encode(["status" => "success", "data" => $settings]);
    }
    exit();
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    if (!$input || !isset($input['key']) || !isset($input['value'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid input. 'key' and 'value' are required."]);
        exit();
    }

    $key = trim($input['key']);
    $value = json_encode($input['value'], JSON_UNESCAPED_UNICODE);

    $stmt = $conn->prepare("INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
    $stmt->bind_param("ss", $key, $value);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Settings updated successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database error: " . $stmt->error]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
$conn->close();
?>