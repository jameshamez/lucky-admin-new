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

require __DIR__ . '/../../condb.php';
/** @var mysqli $conn */
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $data = [];
        $res = $conn->query("SELECT * FROM `production_defective_items` ORDER BY report_date DESC, id DESC");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $data[] = [
                    "id" => (string) $row['id'],
                    "code" => $row['code'],
                    "name" => $row['name'],
                    "image" => $row['image'],
                    "category" => $row['category'],
                    "subcategory" => $row['subcategory'],
                    "color" => $row['color'],
                    "size" => $row['size'],
                    "defectType" => $row['defect_type'],
                    "quantity" => (int) $row['quantity'],
                    "unit" => $row['unit'],
                    "reportDate" => $row['report_date'],
                    "reportedBy" => $row['reported_by'],
                    "orderRef" => $row['order_ref'],
                    "note" => $row['note'],
                    "status" => $row['status'],
                ];
            }
        }
        echo json_encode(["status" => "success", "data" => $data]);
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        $action = $input['action'] ?? '';
        $id = (int) ($input['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "id is required"]);
            exit();
        }

        if ($action === 'sell') {
            $qty = (int) ($input['qty'] ?? 0);
            $note = $input['note'] ?? '';
            if ($qty <= 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "qty ต้องมากกว่า 0"]);
                exit();
            }

            $stmt = $conn->prepare("SELECT quantity, unit, note FROM production_defective_items WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            if (!$row) {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Not found"]);
                exit();
            }
            if ($qty > (int) $row['quantity']) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "จำนวนเกินสินค้ามีตำหนิ (มี {$row['quantity']} {$row['unit']})"]);
                exit();
            }

            $remaining = (int) $row['quantity'] - $qty;
            $newStatus = $remaining <= 0 ? 'ตัดขาย' : null;
            $newNote = $row['note'] . ($note !== '' ? " | ตัดขาย {$qty} {$row['unit']}: {$note}" : " | ตัดขาย {$qty} {$row['unit']}");

            if ($newStatus) {
                $upd = $conn->prepare("UPDATE production_defective_items SET quantity = ?, note = ?, status = ? WHERE id = ?");
                $upd->bind_param("issi", $remaining, $newNote, $newStatus, $id);
            } else {
                $upd = $conn->prepare("UPDATE production_defective_items SET quantity = ?, note = ? WHERE id = ?");
                $upd->bind_param("isi", $remaining, $newNote, $id);
            }
            $upd->execute();
            echo json_encode(["status" => "success"]);
        } elseif ($action === 'destroy') {
            $upd = $conn->prepare("UPDATE production_defective_items SET status = 'ทำลาย', quantity = 0 WHERE id = ?");
            $upd->bind_param("i", $id);
            $upd->execute();
            echo json_encode(["status" => "success"]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Unknown action"]);
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
