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
        if (isset($_GET['id'])) {
            $id = (int) $_GET['id'];
            $stmt = $conn->prepare("SELECT s.*, w.code as warehouse_code FROM inventory_stock_count_sessions s
                                    LEFT JOIN warehouses w ON w.id = s.warehouse_id WHERE s.id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $session = $stmt->get_result()->fetch_assoc();
            if (!$session) {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Not found"]);
                exit();
            }
            $items = [];
            $stmt2 = $conn->prepare("SELECT i.*, p.code as product_code, p.name as product_name
                                     FROM inventory_stock_count_items i
                                     JOIN inventory_products p ON p.id = i.product_id
                                     WHERE i.session_id = ?");
            $stmt2->bind_param("i", $id);
            $stmt2->execute();
            $res = $stmt2->get_result();
            while ($row = $res->fetch_assoc()) {
                $items[] = [
                    "id" => (int) $row['id'],
                    "productId" => (int) $row['product_id'],
                    "code" => $row['product_code'],
                    "name" => $row['product_name'],
                    "systemQty" => (int) $row['system_qty'],
                    "countedQty" => $row['counted_qty'] !== null ? (int) $row['counted_qty'] : null,
                ];
            }
            echo json_encode(["status" => "success", "data" => [
                "id" => (int) $session['id'],
                "name" => $session['name'],
                "warehouse" => $session['warehouse_code'],
                "status" => $session['status'],
                "startedBy" => $session['started_by'],
                "startDate" => $session['start_date'],
                "endDate" => $session['end_date'],
                "items" => $items,
            ]]);
            exit();
        }

        $data = [];
        $res = $conn->query("SELECT s.*, w.code as warehouse_code,
                            (SELECT COUNT(*) FROM inventory_stock_count_items i WHERE i.session_id = s.id) as item_count,
                            (SELECT COUNT(*) FROM inventory_stock_count_items i WHERE i.session_id = s.id AND i.counted_qty IS NOT NULL) as counted_count
                            FROM inventory_stock_count_sessions s
                            LEFT JOIN warehouses w ON w.id = s.warehouse_id
                            ORDER BY s.id DESC");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $data[] = [
                    "id" => (int) $row['id'],
                    "name" => $row['name'],
                    "warehouse" => $row['warehouse_code'] ?: "all",
                    "status" => $row['status'],
                    "startedBy" => $row['started_by'],
                    "startDate" => $row['start_date'],
                    "endDate" => $row['end_date'],
                    "items" => (int) $row['item_count'],
                    "counted" => (int) $row['counted_count'],
                ];
            }
        }
        echo json_encode(["status" => "success", "data" => $data]);
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        $action = $input['action'] ?? '';

        if ($action === 'create_session') {
            $name = $input['name'] ?? '';
            $warehouseCode = $input['warehouseCode'] ?? null;
            $startedBy = $input['startedBy'] ?? null;
            if ($name === '') {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "name is required"]);
                exit();
            }

            $warehouseId = null;
            if ($warehouseCode && $warehouseCode !== 'all') {
                $wcode = strtoupper($warehouseCode);
                $stmt = $conn->prepare("SELECT id FROM warehouses WHERE code = ?");
                $stmt->bind_param("s", $wcode);
                $stmt->execute();
                $row = $stmt->get_result()->fetch_assoc();
                $warehouseId = $row ? (int) $row['id'] : null;
            }

            $conn->begin_transaction();
            try {
                $ins = $conn->prepare("INSERT INTO inventory_stock_count_sessions (name, warehouse_id, started_by, start_date) VALUES (?, ?, ?, CURDATE())");
                $ins->bind_param("sis", $name, $warehouseId, $startedBy);
                $ins->execute();
                $sessionId = $conn->insert_id;

                // Snapshot current total stock (ready+defective+damaged) per product as the system count baseline
                $sql = "SELECT product_id, SUM(ready_qty + defective_qty + damaged_qty) as total_qty FROM inventory_stock";
                if ($warehouseId) {
                    $sql .= " WHERE warehouse_id = " . (int) $warehouseId;
                }
                $sql .= " GROUP BY product_id";
                $res = $conn->query($sql);
                if ($res) {
                    while ($row = $res->fetch_assoc()) {
                        $pid = (int) $row['product_id'];
                        $qty = (int) $row['total_qty'];
                        $itemIns = $conn->prepare("INSERT INTO inventory_stock_count_items (session_id, product_id, system_qty) VALUES (?, ?, ?)");
                        $itemIns->bind_param("iii", $sessionId, $pid, $qty);
                        $itemIns->execute();
                    }
                }
                $conn->commit();
                echo json_encode(["status" => "success", "id" => $sessionId]);
            } catch (Exception $e) {
                $conn->rollback();
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        } elseif ($action === 'save_count') {
            $sessionId = (int) ($input['sessionId'] ?? 0);
            $items = $input['items'] ?? []; // [{productId, countedQty}]
            if (!$sessionId) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "sessionId is required"]);
                exit();
            }
            foreach ($items as $item) {
                $pid = (int) ($item['productId'] ?? 0);
                $counted = (int) ($item['countedQty'] ?? 0);
                $upd = $conn->prepare("UPDATE inventory_stock_count_items SET counted_qty = ? WHERE session_id = ? AND product_id = ?");
                $upd->bind_param("iii", $counted, $sessionId, $pid);
                $upd->execute();
            }
            echo json_encode(["status" => "success"]);
        } elseif ($action === 'complete_session') {
            $sessionId = (int) ($input['sessionId'] ?? 0);
            if (!$sessionId) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "sessionId is required"]);
                exit();
            }

            $stmt = $conn->prepare("SELECT * FROM inventory_stock_count_sessions WHERE id = ?");
            $stmt->bind_param("i", $sessionId);
            $stmt->execute();
            $session = $stmt->get_result()->fetch_assoc();
            if (!$session) {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Not found"]);
                exit();
            }

            $conn->begin_transaction();
            try {
                // Auto-create ปรับยอด transactions for items whose counted qty differs from system qty
                // (only when the session is scoped to a single warehouse — matches original UI which
                // never supported a real cross-warehouse count reconciliation)
                if ($session['warehouse_id']) {
                    $warehouseId = (int) $session['warehouse_id'];
                    $stmt2 = $conn->prepare("SELECT * FROM inventory_stock_count_items WHERE session_id = ? AND counted_qty IS NOT NULL");
                    $stmt2->bind_param("i", $sessionId);
                    $stmt2->execute();
                    $res = $stmt2->get_result();
                    while ($item = $res->fetch_assoc()) {
                        $pid = (int) $item['product_id'];
                        $counted = (int) $item['counted_qty'];
                        $system = (int) $item['system_qty'];
                        if ($counted === $system) continue;

                        $stockStmt = $conn->prepare("SELECT * FROM inventory_stock WHERE product_id = ? AND warehouse_id = ?");
                        $stockStmt->bind_param("ii", $pid, $warehouseId);
                        $stockStmt->execute();
                        $stockRow = $stockStmt->get_result()->fetch_assoc();
                        $readyQty = $stockRow ? (int) $stockRow['ready_qty'] : 0;
                        $defectiveQty = $stockRow ? (int) $stockRow['defective_qty'] : 0;
                        $damagedQty = $stockRow ? (int) $stockRow['damaged_qty'] : 0;

                        // Apply the counted-vs-system diff to the "ready" bucket (physical counts don't
                        // distinguish status — matches original mock, which only ever counted totals)
                        $diff = $counted - $system;
                        $newReady = max(0, $readyQty + $diff);

                        if ($stockRow) {
                            $u = $conn->prepare("UPDATE inventory_stock SET ready_qty = ? WHERE product_id = ? AND warehouse_id = ?");
                            $u->bind_param("iii", $newReady, $pid, $warehouseId);
                            $u->execute();
                        } else {
                            $ins2 = $conn->prepare("INSERT INTO inventory_stock (product_id, warehouse_id, ready_qty, defective_qty, damaged_qty) VALUES (?, ?, ?, 0, 0)");
                            $ins2->bind_param("iii", $pid, $warehouseId, $newReady);
                            $ins2->execute();
                        }

                        $note = "ปรับยอดจากรอบนับสต็อก #$sessionId (ระบบ: $system, นับจริง: $counted)";
                        $qtyForLog = abs($diff);
                        $refDoc = "SC" . str_pad($sessionId, 3, "0", STR_PAD_LEFT);
                        $txIns = $conn->prepare("INSERT INTO inventory_transactions (ref_doc, type, product_id, warehouse_id, quantity, note) VALUES (?, 'ปรับยอด', ?, ?, ?, ?)");
                        $txIns->bind_param("siiis", $refDoc, $pid, $warehouseId, $qtyForLog, $note);
                        $txIns->execute();
                    }
                }

                $upd = $conn->prepare("UPDATE inventory_stock_count_sessions SET status = 'เสร็จสิ้น', end_date = CURDATE() WHERE id = ?");
                $upd->bind_param("i", $sessionId);
                $upd->execute();

                $conn->commit();
                echo json_encode(["status" => "success"]);
            } catch (Exception $e) {
                $conn->rollback();
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
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
