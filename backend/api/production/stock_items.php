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
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

function computeStockStatus($stock, $min) {
    if ($stock <= 0) return 'out_of_stock';
    if ($stock < $min) return 'low_stock';
    return 'in_stock';
}

try {
    if ($method === 'GET') {
        $items = [];
        $byId = [];
        $res = $conn->query("SELECT * FROM `production_stock_items` ORDER BY id ASC");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $item = [
                    "id" => (string) $row['id'],
                    "code" => $row['code'],
                    "name" => $row['name'],
                    "image" => $row['image'],
                    "category" => $row['category'],
                    "subcategory" => $row['subcategory'],
                    "color" => $row['color'],
                    "size" => $row['size'],
                    "tags" => $row['tags'],
                    "currentStock" => (int) $row['current_stock'],
                    "minimumStock" => (int) $row['minimum_stock'],
                    "unit" => $row['unit'],
                    "model" => $row['model'],
                    "lastUpdated" => $row['updated_at'],
                    "status" => $row['status'],
                    "bom" => [],
                    "movementHistory" => [],
                ];
                $items[] = $item;
                $byId[(int) $row['id']] = count($items) - 1;
            }
        }

        $res = $conn->query("SELECT * FROM `production_stock_bom` ORDER BY sort_order ASC, id ASC");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $sid = (int) $row['stock_item_id'];
                if (!isset($byId[$sid])) continue;
                $items[$byId[$sid]]['bom'][] = [
                    "id" => $row['component_code'] ?: ("BOM-" . $row['id']),
                    "name" => $row['component_name'],
                    "qty" => (int) $row['qty'],
                    "unit" => $row['unit'],
                ];
            }
        }

        $res = $conn->query("SELECT * FROM `production_stock_movements` ORDER BY created_at DESC, id DESC");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $sid = (int) $row['stock_item_id'];
                if (!isset($byId[$sid])) continue;
                if (count($items[$byId[$sid]]['movementHistory']) >= 50) continue;
                $items[$byId[$sid]]['movementHistory'][] = [
                    "id" => "M" . $row['id'],
                    "date" => $row['created_at'],
                    "type" => $row['type'],
                    "qty" => (int) $row['qty'],
                    "by" => $row['employee_name'],
                    "note" => $row['note'],
                ];
            }
        }

        echo json_encode(["status" => "success", "data" => $items]);
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        $action = $input['action'] ?? 'adjust';
        if ($action !== 'adjust') {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Unknown action"]);
            exit();
        }

        $id = (int) ($input['id'] ?? 0);
        $type = $input['type'] ?? '';
        $qty = (int) ($input['qty'] ?? 0);
        $note = $input['note'] ?? null;
        $employeeName = $input['employeeName'] ?? null;

        if (!$id || $qty <= 0 || !in_array($type, ['รับเข้า', 'จ่ายออก', 'เคลม', 'ชำรุด', 'เบิกภายใน'], true)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "id, qty และ type ที่ถูกต้องเป็นสิ่งจำเป็น"]);
            exit();
        }

        $stmt = $conn->prepare("SELECT current_stock, minimum_stock FROM production_stock_items WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if (!$row) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Not found"]);
            exit();
        }

        $current = (int) $row['current_stock'];
        $min = (int) $row['minimum_stock'];
        // Only รับเข้า increases stock — every other type decreases, matching the original UI
        $newStock = $type === 'รับเข้า' ? $current + $qty : max(0, $current - $qty);
        $newStatus = computeStockStatus($newStock, $min);

        $conn->begin_transaction();
        try {
            $upd = $conn->prepare("UPDATE production_stock_items SET current_stock = ?, status = ? WHERE id = ?");
            $upd->bind_param("isi", $newStock, $newStatus, $id);
            $upd->execute();

            $ins = $conn->prepare("INSERT INTO production_stock_movements (stock_item_id, type, qty, employee_name, note) VALUES (?, ?, ?, ?, ?)");
            $ins->bind_param("isiss", $id, $type, $qty, $employeeName, $note);
            $ins->execute();

            $conn->commit();
            echo json_encode(["status" => "success", "data" => ["currentStock" => $newStock, "status" => $newStatus]]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
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
