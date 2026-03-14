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
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $vehicle_id = isset($_GET['vehicle_id']) ? intval($_GET['vehicle_id']) : 0;
        $sql = "SELECT * FROM vehicle_usage_logs";
        if ($vehicle_id > 0) {
            $sql .= " WHERE vehicle_id = $vehicle_id";
        }
        $sql .= " ORDER BY usage_date DESC, id DESC";

        $result = $conn->query($sql);
        $logs = [];
        if ($result) {
            while ($row = $result->fetch_assoc()) {
                $logs[] = [
                    "id" => $row['id'],
                    "date" => $row['usage_date'],
                    "driver" => $row['driver_name'],
                    "destination" => $row['destination'],
                    "purpose" => $row['purpose'],
                    "mileageStart" => (int) $row['mileage_start'],
                    "mileageEnd" => (int) $row['mileage_end'],
                    "fuelAdded" => (float) $row['fuel_added'],
                    "fuelCost" => (float) $row['fuel_cost'],
                    "notes" => $row['notes']
                ];
            }
        }
        echo json_encode(["status" => "success", "data" => $logs]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['vehicle_id']) || empty($data['date'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Vehicle ID and Date are required"]);
            exit();
        }

        $conn->begin_transaction();
        try {
            $sql = "INSERT INTO vehicle_usage_logs (vehicle_id, usage_date, driver_name, destination, purpose, mileage_start, mileage_end, fuel_added, fuel_cost, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param(
                "issssiidds",
                $data['vehicle_id'],
                $data['date'],
                $data['driver'],
                $data['destination'],
                $data['purpose'],
                $data['mileageStart'],
                $data['mileageEnd'],
                $data['fuelAdded'],
                $data['fuelCost'],
                $data['notes']
            );
            $stmt->execute();

            // Update vehicle current mileage
            $v_sql = "UPDATE vehicles SET current_mileage = ? WHERE id = ?";
            $v_stmt = $conn->prepare($v_sql);
            $v_stmt->bind_param("ii", $data['mileageEnd'], $data['vehicle_id']);
            $v_stmt->execute();

            $conn->commit();
            echo json_encode(["status" => "success"]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;
}

$conn->close();
?>