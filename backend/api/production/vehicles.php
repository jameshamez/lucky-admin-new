<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $sql = "SELECT * FROM vehicles ORDER BY vehicle_code ASC";
        $result = $conn->query($sql);
        $vehicles = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $vehicles[] = [
                    "id" => $row['id'],
                    "vehicle_code" => $row['vehicle_code'],
                    "name" => $row['name'],
                    "licensePlate" => $row['license_plate'],
                    "type" => $row['type'],
                    "status" => $row['status'],
                    "currentMileage" => (int) $row['current_mileage']
                ];
            }
        }
        echo json_encode(["status" => "success", "data" => $vehicles]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['name']) || empty($data['licensePlate'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Name and License Plate are required"]);
            exit();
        }

        $sql = "INSERT INTO vehicles (vehicle_code, name, license_plate, type, status, current_mileage) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $code = $data['vehicle_code'] ?? 'V' . str_pad(time() % 10000, 4, '0', STR_PAD_LEFT);
        $stmt->bind_param("sssssi", $code, $data['name'], $data['licensePlate'], $data['type'], $data['status'], $data['currentMileage']);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ID is required"]);
            exit();
        }

        $sql = "UPDATE vehicles SET name=?, license_plate=?, type=?, status=?, current_mileage=? WHERE id=?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssii", $data['name'], $data['licensePlate'], $data['type'], $data['status'], $data['currentMileage'], $data['id']);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        break;
}

$conn->close();
?>