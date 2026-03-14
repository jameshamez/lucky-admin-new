<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
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

// ==================== GET ====================
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'all';

    if ($action === 'supplies') {
        $res = $conn->query("SELECT * FROM `accounting_office_supplies` ORDER BY code ASC");
        $data = [];
        while ($row = $res->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $data]);
    } else if ($action === 'requisitions') {
        $sql = "SELECT r.*, s.code as supply_code, s.name as supply_name, s.category, s.unit, s.price_per_unit 
                FROM `accounting_office_requisitions` r
                JOIN `accounting_office_supplies` s ON r.supply_id = s.id
                ORDER BY r.requisition_date DESC, r.id DESC";
        $res = $conn->query($sql);
        $data = [];
        while ($row = $res->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $data]);
    } else {
        // Default: return both
        $s_res = $conn->query("SELECT * FROM `accounting_office_supplies` ORDER BY code ASC");
        $supplies = [];
        while ($row = $s_res->fetch_assoc()) {
            $supplies[] = $row;
        }

        $r_sql = "SELECT r.*, s.code as supply_code, s.name as supply_name, s.category, s.unit, s.price_per_unit 
                  FROM `accounting_office_requisitions` r
                  JOIN `accounting_office_supplies` s ON r.supply_id = s.id
                  ORDER BY r.requisition_date DESC, r.id DESC";
        $r_res = $conn->query($r_sql);
        $requisitions = [];
        while ($row = $r_res->fetch_assoc()) {
            $requisitions[] = $row;
        }

        echo json_encode([
            "status" => "success",
            "data" => [
                "supplies" => $supplies,
                "requisitions" => $requisitions
            ]
        ]);
    }
    exit();
}

// ==================== POST ====================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    if ($action === 'add_supply') {
        $stmt = $conn->prepare("INSERT INTO `accounting_office_supplies` (code, name, category, quantity, unit, price_per_unit, min_stock, date_received) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssisdis", $data['code'], $data['name'], $data['category'], $data['quantity'], $data['unit'], $data['pricePerUnit'], $data['minStock'], $data['dateReceived']);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    } else if ($action === 'add_requisition') {
        $conn->begin_transaction();
        try {
            // 1. Insert requisition
            $stmt = $conn->prepare("INSERT INTO `accounting_office_requisitions` (supply_id, quantity, requester, requisition_date, note) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("iisss", $data['supplyId'], $data['quantity'], $data['requester'], $data['date'], $data['note']);
            $stmt->execute();

            // 2. Update stock
            $update_stmt = $conn->prepare("UPDATE `accounting_office_supplies` SET quantity = quantity - ? WHERE id = ?");
            $update_stmt->bind_param("ii", $data['quantity'], $data['supplyId']);
            $update_stmt->execute();

            $conn->commit();
            echo json_encode(["status" => "success"]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }
    exit();
}

// ==================== PUT ====================
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? null;
    if (!$id)
        exit();

    $stmt = $conn->prepare("UPDATE `accounting_office_supplies` SET name=?, category=?, quantity=?, unit=?, price_per_unit=?, min_stock=?, date_received=? WHERE id=?");
    $stmt->bind_param("ssisdisi", $data['name'], $data['category'], $data['quantity'], $data['unit'], $data['pricePerUnit'], $data['minStock'], $data['dateReceived'], $id);
    if ($stmt->execute()) {
        echo json_encode(["status" => "success"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}

// ==================== DELETE ====================
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id)
        exit();

    $stmt = $conn->prepare("DELETE FROM `accounting_office_supplies` WHERE id = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(["status" => "success"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}
?>