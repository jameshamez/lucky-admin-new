<?php
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

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $sql = "SELECT * FROM equipment_requests ORDER BY created_at DESC";
        $result = $conn->query($sql);

        $data = [];
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $data[] = $row;
            }
        }

        echo json_encode([
            "status" => "success",
            "data" => $data
        ]);
        break;

    case 'POST':
        $input = json_decode(file_get_contents("php://input"));

        if (empty($input->equipment_name) || empty($input->qty) || empty($input->department)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Missing required fields"]);
            exit();
        }

        // Get equipment id
        $eq_sql = "SELECT id, current_qty FROM equipments WHERE equipment_name = ?";
        $eq_stmt = $conn->prepare($eq_sql);
        $eq_stmt->bind_param("s", $input->equipment_name);
        $eq_stmt->execute();
        $eq_res = $eq_stmt->get_result();

        $equipment_id = 0;
        $current_qty = 0;
        if ($eq_res->num_rows > 0) {
            $eq_data = $eq_res->fetch_assoc();
            $equipment_id = $eq_data['id'];
            $current_qty = $eq_data['current_qty'];

            // Deduct stock if there is any
            $new_qty = max(0, $current_qty - intval($input->qty));
            $up_sql = "UPDATE equipments SET current_qty = ? WHERE id = ?";
            $up_stmt = $conn->prepare($up_sql);
            $up_stmt->bind_param("ii", $new_qty, $equipment_id);
            $up_stmt->execute();
        }

        $date = date('Y-m-d');
        $requester = isset($input->requester) ? $input->requester : 'ผู้ใช้งานปัจจุบัน';
        $remark = isset($input->remark) ? $input->remark : '';
        $status = 'รออนุมัติ';

        $sql = "INSERT INTO equipment_requests (request_date, equipment_id, equipment_name, qty, department, requester, remark, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);

        $stmt->bind_param("sisissss", $date, $equipment_id, $input->equipment_name, $input->qty, $input->department, $requester, $remark, $status);

        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Equipment request created", "id" => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed: " . $stmt->error]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}

$conn->close();
?>