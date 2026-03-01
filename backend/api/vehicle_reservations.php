<?php
// เปิด Error Reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany'); 
// เช็คการเชื่อมต่อ
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $sql = "SELECT * FROM vehicle_reservations ORDER BY start_datetime DESC";
        $result = $conn->query($sql);

        $reservations = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $reservations[] = $row;
            }
        }

        echo json_encode([
            "status" => "success",
            "data" => $reservations
        ]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->vehicle_type) || empty($data->purpose) || empty($data->start_datetime) || empty($data->end_datetime) || empty($data->requester)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "All fields are required"]);
            exit();
        }

        $sql = "INSERT INTO vehicle_reservations (vehicle_type, purpose, start_datetime, end_datetime, requester, status) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);

        $status = 'รออนุมัติ';
        $stmt->bind_param("ssssss", $data->vehicle_type, $data->purpose, $data->start_datetime, $data->end_datetime, $data->requester, $status);

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Vehicle reservation created successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to create reservation: " . $stmt->error]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}

$conn->close();
?>