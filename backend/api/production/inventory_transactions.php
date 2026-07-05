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

function getWarehouseId($conn, $code) {
    $code = strtoupper($code);
    $stmt = $conn->prepare("SELECT id FROM warehouses WHERE code = ?");
    $stmt->bind_param("s", $code);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    return $row ? (int) $row['id'] : null;
}

function getOrCreateStockRow($conn, $productId, $warehouseId) {
    $stmt = $conn->prepare("SELECT * FROM inventory_stock WHERE product_id = ? AND warehouse_id = ?");
    $stmt->bind_param("ii", $productId, $warehouseId);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    if ($row) return $row;

    $ins = $conn->prepare("INSERT INTO inventory_stock (product_id, warehouse_id, ready_qty, defective_qty, damaged_qty) VALUES (?, ?, 0, 0, 0)");
    $ins->bind_param("ii", $productId, $warehouseId);
    $ins->execute();
    return ["id" => $conn->insert_id, "ready_qty" => 0, "defective_qty" => 0, "damaged_qty" => 0];
}

$statusColumn = ["ready" => "ready_qty", "defective" => "defective_qty", "damaged" => "damaged_qty"];

try {
    if ($method === 'GET') {
        $where = [];
        if (!empty($_GET['type']) && $_GET['type'] !== 'all') {
            $t = $conn->real_escape_string($_GET['type']);
            $where[] = "t.type = '$t'";
        }
        if (!empty($_GET['warehouse']) && $_GET['warehouse'] !== 'all') {
            $wh = $conn->real_escape_string($_GET['warehouse']);
            $where[] = "(w.code = '$wh' OR tw.code = '$wh')";
        }
        $whereSql = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

        $sql = "SELECT t.*, p.code as product_code, p.name as product_name,
                       w.code as warehouse_code, tw.code as to_warehouse_code
                FROM inventory_transactions t
                JOIN inventory_products p ON p.id = t.product_id
                JOIN warehouses w ON w.id = t.warehouse_id
                LEFT JOIN warehouses tw ON tw.id = t.to_warehouse_id
                $whereSql
                ORDER BY t.created_at DESC
                LIMIT 500";
        $data = [];
        $res = $conn->query($sql);
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $statusLabel = ["ready" => "พร้อมผลิต", "defective" => "ตำหนิ", "damaged" => "ชำรุด"];
                $warehouseDisplay = $row['warehouse_code'];
                if ($row['to_warehouse_code']) {
                    $warehouseDisplay .= " → " . $row['to_warehouse_code'];
                }
                $data[] = [
                    "id" => "TXN" . str_pad($row['id'], 3, "0", STR_PAD_LEFT),
                    "date" => $row['created_at'],
                    "refDoc" => $row['ref_doc'],
                    "type" => $row['type'],
                    "product" => $row['product_code'] . " " . $row['product_name'],
                    "warehouse" => $warehouseDisplay,
                    "statusFrom" => $statusLabel[$row['status_from']] ?? '-',
                    "statusTo" => $statusLabel[$row['status_to']] ?? '-',
                    "quantity" => (int) $row['quantity'],
                    "by" => $row['employee_name'],
                    "note" => $row['note'],
                    "receiveType" => $row['receive_type'],
                    "price" => $row['price'] !== null ? (float) $row['price'] : null,
                    "batchNo" => $row['batch_no'],
                    "expireDate" => $row['expire_date'],
                    "supplier" => $row['supplier'],
                ];
            }
        }
        echo json_encode(["status" => "success", "data" => $data]);
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        $type = $input['type'] ?? '';
        $productId = (int) ($input['productId'] ?? 0);
        $warehouseCode = $input['warehouseCode'] ?? '';
        $refDoc = $input['refDoc'] ?? null;
        $employeeName = $input['employeeName'] ?? null;
        $note = $input['note'] ?? null;

        if (!$productId || $warehouseCode === '' || !in_array($type, ['รับเข้า', 'ตัดออก', 'โอนคลัง', 'ปรับยอด'], true)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "productId, warehouseCode and a valid type are required"]);
            exit();
        }

        $warehouseId = getWarehouseId($conn, $warehouseCode);
        if (!$warehouseId) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ไม่พบคลังสินค้า: $warehouseCode"]);
            exit();
        }

        $conn->begin_transaction();
        try {
            if ($type === 'ปรับยอด') {
                $readyQty = (int) ($input['readyQty'] ?? 0);
                $defectiveQty = (int) ($input['defectiveQty'] ?? 0);
                $damagedQty = (int) ($input['damagedQty'] ?? 0);

                $stockRow = getOrCreateStockRow($conn, $productId, $warehouseId);
                $diff = ($readyQty - (int) $stockRow['ready_qty'])
                      + ($defectiveQty - (int) $stockRow['defective_qty'])
                      + ($damagedQty - (int) $stockRow['damaged_qty']);

                $upd = $conn->prepare("UPDATE inventory_stock SET ready_qty=?, defective_qty=?, damaged_qty=? WHERE product_id=? AND warehouse_id=?");
                $upd->bind_param("iiiii", $readyQty, $defectiveQty, $damagedQty, $productId, $warehouseId);
                $upd->execute();

                $qtyForLog = abs($diff);
                $ins = $conn->prepare("INSERT INTO inventory_transactions (ref_doc, type, product_id, warehouse_id, status_from, status_to, quantity, employee_name, note) VALUES (?, ?, ?, ?, NULL, NULL, ?, ?, ?)");
                $ins->bind_param("ssiiiss", $refDoc, $type, $productId, $warehouseId, $qtyForLog, $employeeName, $note);
                $ins->execute();
            } elseif ($type === 'โอนคลัง') {
                $toWarehouseCode = $input['toWarehouseCode'] ?? '';
                $status = $input['status'] ?? 'ready';
                $quantity = (int) ($input['quantity'] ?? 0);
                $col = $statusColumn[$status] ?? 'ready_qty';

                $toWarehouseId = getWarehouseId($conn, $toWarehouseCode);
                if (!$toWarehouseId || $quantity <= 0) {
                    throw new Exception("toWarehouseCode และ quantity ต้องถูกต้อง");
                }

                $fromRow = getOrCreateStockRow($conn, $productId, $warehouseId);
                if ((int) $fromRow[$col] < $quantity) {
                    throw new Exception("สต็อกคลังต้นทางไม่พอสำหรับการโอน");
                }
                $conn->query("UPDATE inventory_stock SET $col = $col - $quantity WHERE product_id = $productId AND warehouse_id = $warehouseId");

                getOrCreateStockRow($conn, $productId, $toWarehouseId);
                $conn->query("UPDATE inventory_stock SET $col = $col + $quantity WHERE product_id = $productId AND warehouse_id = $toWarehouseId");

                $ins = $conn->prepare("INSERT INTO inventory_transactions (ref_doc, type, product_id, warehouse_id, to_warehouse_id, status_from, status_to, quantity, employee_name, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $ins->bind_param("ssiiississ", $refDoc, $type, $productId, $warehouseId, $toWarehouseId, $status, $status, $quantity, $employeeName, $note);
                $ins->execute();
            } else {
                // รับเข้า or ตัดออก
                $status = $input['status'] ?? 'ready';
                $quantity = (int) ($input['quantity'] ?? 0);
                $col = $statusColumn[$status] ?? 'ready_qty';
                if ($quantity <= 0) {
                    throw new Exception("quantity ต้องมากกว่า 0");
                }

                $row = getOrCreateStockRow($conn, $productId, $warehouseId);
                if ($type === 'ตัดออก' && (int) $row[$col] < $quantity) {
                    throw new Exception("สต็อกไม่พอสำหรับการตัดออก");
                }
                $sign = $type === 'รับเข้า' ? '+' : '-';
                $conn->query("UPDATE inventory_stock SET $col = $col $sign $quantity WHERE product_id = $productId AND warehouse_id = $warehouseId");

                // Receiving into a location updates the product's home location for this warehouse
                if ($type === 'รับเข้า' && !empty($input['locationId'])) {
                    $locationId = (int) $input['locationId'];
                    $conn->query("UPDATE inventory_stock SET location_id = $locationId WHERE product_id = $productId AND warehouse_id = $warehouseId");
                }

                $receiveType = $input['receiveType'] ?? null;
                $price = isset($input['price']) ? (float) $input['price'] : null;
                $batchNo = $input['batchNo'] ?? null;
                $expireDate = !empty($input['expireDate']) ? $input['expireDate'] : null;
                $supplier = $input['supplier'] ?? null;

                $ins = $conn->prepare("INSERT INTO inventory_transactions
                    (ref_doc, type, product_id, warehouse_id, status_from, status_to, quantity, employee_name, note, receive_type, price, batch_no, expire_date, supplier)
                    VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                $ins->bind_param(
                    "ssiisisssdsss",
                    $refDoc, $type, $productId, $warehouseId, $status, $quantity, $employeeName, $note,
                    $receiveType, $price, $batchNo, $expireDate, $supplier
                );
                $ins->execute();
            }

            $conn->commit();
            echo json_encode(["status" => "success"]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(400);
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
