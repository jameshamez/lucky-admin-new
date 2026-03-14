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
                $reservations[] = [
                    "id" => $row['id'],
                    "customerLineName" => $row['customer_name'],
                    "product" => $row['product_detail'],
                    "deliveryBy" => $row['requester'],
                    "deliveryDate" => $row['start_datetime'],
                    "deliveryLocation" => $row['delivery_location'],
                    "address" => $row['address'],
                    "notes" => $row['notes'],
                    "status" => $row['status'],
                    "imageUrl" => $row['image_url']
                ];
            }
        }

        echo json_encode([
            "status" => "success",
            "data" => $reservations
        ]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->customerLineName) || empty($data->deliveryDate)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Required fields missing"]);
            exit();
        }

        $sql = "INSERT INTO vehicle_reservations (customer_name, product_detail, vehicle_type, purpose, delivery_location, address, start_datetime, end_datetime, requester, notes, status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);

        $status = 'รออนุมัติ';
        $v_type = $data->vehicle_type ?? 'กระบะ';
        $purpose = $data->purpose ?? 'ส่งสินค้า';
        $end_date = $data->end_datetime ?? $data->deliveryDate;

        $stmt->bind_param(
            "ssssssssssss",
            $data->customerLineName,
            $data->product,
            $v_type,
            $purpose,
            $data->deliveryLocation,
            $data->address,
            $data->deliveryDate,
            $end_date,
            $data->deliveryBy,
            $data->notes,
            $status,
            $data->imageUrl
        );

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Vehicle reservation created successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to create reservation: " . $stmt->error]);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->id) || empty($data->status)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ID and Status are required"]);
            exit();
        }

        $sql = "UPDATE vehicle_reservations SET status = ? WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $data->status, $data->id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}

$conn->close();
?>