<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require __DIR__ . '/../../condb.php';
/** @var mysqli $conn */
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $warehouses = [];
        $byId = [];
        $res = $conn->query("SELECT * FROM `warehouses` ORDER BY id ASC");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $w = [
                    "id" => (int) $row['id'],
                    "code" => $row['code'],
                    "name" => $row['name'],
                    "address" => $row['address'],
                    "status" => $row['status'],
                    "locations" => [],
                ];
                $warehouses[] = $w;
                $byId[(int) $row['id']] = count($warehouses) - 1;
            }
        }
        $res = $conn->query("SELECT * FROM `inventory_locations` ORDER BY id ASC");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $wid = (int) $row['warehouse_id'];
                if (!isset($byId[$wid])) continue;
                $warehouses[$byId[$wid]]['locations'][] = [
                    "id" => (int) $row['id'],
                    "code" => $row['code'],
                    "name" => $row['name'],
                    "status" => $row['status'],
                ];
            }
        }
        echo json_encode(["status" => "success", "data" => $warehouses]);
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        $action = $input['action'] ?? '';

        if ($action === 'warehouse') {
            $code = trim($input['code'] ?? '');
            $name = $input['name'] ?? '';
            $address = $input['address'] ?? null;
            $status = $input['status'] ?? 'เปิดใช้งาน';
            if ($code === '' || $name === '') {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "code and name are required"]);
                exit();
            }
            $code = strtoupper($code);
            if (isset($input['id']) && $input['id']) {
                $id = (int) $input['id'];
                $stmt = $conn->prepare("UPDATE warehouses SET code = ?, name = ?, address = ?, status = ? WHERE id = ?");
                $stmt->bind_param("ssssi", $code, $name, $address, $status, $id);
                $stmt->execute();
                echo json_encode(["status" => "success", "id" => $id]);
            } else {
                $stmt = $conn->prepare("INSERT INTO warehouses (code, name, address, status) VALUES (?, ?, ?, ?)");
                $stmt->bind_param("ssss", $code, $name, $address, $status);
                if ($stmt->execute()) {
                    echo json_encode(["status" => "success", "id" => $conn->insert_id]);
                } else {
                    http_response_code(500);
                    echo json_encode(["status" => "error", "message" => "รหัสคลังนี้มีอยู่แล้ว หรือเกิดข้อผิดพลาด: " . $stmt->error]);
                }
            }
        } elseif ($action === 'location') {
            $warehouseId = (int) ($input['warehouseId'] ?? 0);
            $code = $input['code'] ?? '';
            $name = $input['name'] ?? '';
            $status = $input['status'] ?? 'เปิดใช้งาน';
            if (!$warehouseId || $code === '' || $name === '') {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "warehouseId, code and name are required"]);
                exit();
            }
            if (isset($input['id']) && $input['id']) {
                $id = (int) $input['id'];
                $stmt = $conn->prepare("UPDATE inventory_locations SET code = ?, name = ?, status = ? WHERE id = ?");
                $stmt->bind_param("sssi", $code, $name, $status, $id);
                $stmt->execute();
                echo json_encode(["status" => "success", "id" => $id]);
            } else {
                $stmt = $conn->prepare("INSERT INTO inventory_locations (warehouse_id, code, name, status) VALUES (?, ?, ?, ?)");
                $stmt->bind_param("isss", $warehouseId, $code, $name, $status);
                $stmt->execute();
                echo json_encode(["status" => "success", "id" => $conn->insert_id]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Unknown action"]);
        }
    } elseif ($method === 'DELETE') {
        $type = $_GET['type'] ?? '';
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id || !in_array($type, ['warehouse', 'location'], true)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "type and id are required"]);
            exit();
        }
        $table = $type === 'warehouse' ? 'warehouses' : 'inventory_locations';
        $stmt = $conn->prepare("DELETE FROM `$table` WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    } else {
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
