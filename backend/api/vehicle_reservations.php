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
$conn->select_db('nacresc1_1');
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
                    "vehicle_type" => $row['vehicle_type'],
                    "purpose" => $row['purpose'],
                    "start_datetime" => $row['start_datetime'],
                    "end_datetime" => $row['end_datetime'],
                    "requester" => $row['requester'],
                    "status" => $row['status'],
                    "notes" => $row['notes'],
                    "customer_name" => $row['customer_name'],
                    "product_detail" => $row['product_detail'],
                    "reject_reason" => $row['reject_reason'] ?? null
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

        // ตรวจสอบฟิลด์ที่จำเป็น (ปรับตามที่ React ส่งมา)
        if (empty($data->vehicle_type) || empty($data->start_datetime) || empty($data->requester)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Required fields missing (vehicle_type, start_datetime, requester)"]);
            exit();
        }

        $sql = "INSERT INTO vehicle_reservations (customer_name, product_detail, vehicle_type, purpose, delivery_location, address, start_datetime, end_datetime, requester, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);

        $status = 'รออนุมัติ';
        $customer_name = $data->customerLineName ?? '-'; // สำหรับจองใช้ภายใน
        $product = $data->product ?? 'จองใช้รถส่วนกลาง';
        $purpose = $data->purpose ?? '-';
        $delivery_location = $data->deliveryLocation ?? '-';
        $address = $data->address ?? '-';
        $notes = $data->notes ?? '-';
        $end_date = $data->end_datetime ?? $data->start_datetime;

        $stmt->bind_param(
            "sssssssssss",
            $customer_name,
            $product,
            $data->vehicle_type,
            $purpose,
            $delivery_location,
            $address,
            $data->start_datetime,
            $end_date,
            $data->requester,
            $notes,
            $status
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

        $sql = "UPDATE vehicle_reservations SET status = ?";
        $types = "s";
        $params = [$data->status];

        if (isset($data->reject_reason)) {
            $sql .= ", reject_reason = ?";
            $types .= "s";
            $params[] = $data->reject_reason;
        }

        $sql .= " WHERE id = ?";
        $types .= "i";
        $params[] = $data->id;

        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);

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