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

function computeSupplyStatus($current, $min) {
    if ($min <= 0) return 'ปกติ';
    $ratio = $current / $min;
    if ($ratio <= 0.6) return 'ขาดแคลน';
    if ($ratio < 1.0) return 'ใกล้หมด';
    return 'ปกติ';
}

try {
    if ($method === 'GET') {
        $type = $_GET['type'] ?? 'stock';

        if ($type === 'stock') {
            $data = [];
            $res = $conn->query("SELECT * FROM office_supplies ORDER BY id ASC");
            if ($res) {
                while ($row = $res->fetch_assoc()) {
                    $current = (int) $row['current_stock'];
                    $min = (int) $row['minimum_stock'];
                    $data[] = [
                        "id" => $row['code'],
                        "supplyId" => (int) $row['id'],
                        "name" => $row['name'],
                        "category" => $row['category'],
                        "currentStock" => $current,
                        "minimumStock" => $min,
                        "unit" => $row['unit'],
                        "lastUpdated" => $row['updated_at'],
                        "status" => computeSupplyStatus($current, $min),
                    ];
                }
            }
            echo json_encode(["status" => "success", "data" => $data]);
        } elseif ($type === 'movements') {
            $data = [];
            $res = $conn->query("SELECT m.*, s.name as supply_name, s.unit as supply_unit
                                FROM office_supply_movements m
                                JOIN office_supplies s ON s.id = m.supply_id
                                ORDER BY m.created_at DESC, m.id DESC LIMIT 500");
            if ($res) {
                while ($row = $res->fetch_assoc()) {
                    $data[] = [
                        "id" => "MOV-" . str_pad($row['id'], 3, "0", STR_PAD_LEFT),
                        "date" => $row['created_at'],
                        "type" => $row['type'],
                        "item" => $row['supply_name'],
                        "qty" => (int) $row['qty'],
                        "unit" => $row['supply_unit'],
                        "by" => $row['employee_name'],
                        "note" => $row['note'],
                        "orderRef" => $row['order_ref'],
                    ];
                }
            }
            echo json_encode(["status" => "success", "data" => $data]);
        } elseif ($type === 'defects') {
            $data = [];
            $res = $conn->query("SELECT * FROM office_supply_defects ORDER BY report_date DESC, id DESC");
            if ($res) {
                while ($row = $res->fetch_assoc()) {
                    $data[] = [
                        "id" => "DEF-" . str_pad($row['id'], 3, "0", STR_PAD_LEFT),
                        "product" => $row['product_name'],
                        "quantity" => (int) $row['quantity'],
                        "defectType" => $row['defect_type'],
                        "reportDate" => $row['report_date'],
                        "reportedBy" => $row['reported_by'],
                        "orderRef" => $row['order_ref'],
                        "action" => $row['resolution_action'],
                    ];
                }
            }
            echo json_encode(["status" => "success", "data" => $data]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Unknown type"]);
        }
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        $action = $input['action'] ?? '';

        if ($action === 'movement') {
            $supplyId = (int) ($input['supplyId'] ?? 0);
            $type = $input['type'] ?? '';
            $qty = (int) ($input['qty'] ?? 0);
            $employeeName = $input['employeeName'] ?? null;
            $note = $input['note'] ?? null;
            $orderRef = $input['orderRef'] ?? null;

            if (!$supplyId || !in_array($type, ['รับเข้า', 'จ่ายออก', 'ปรับยอด'], true) || $qty === 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "supplyId, type และ qty (ไม่เป็น 0) เป็นสิ่งจำเป็น"]);
                exit();
            }

            $delta = $type === 'รับเข้า' ? abs($qty) : ($type === 'จ่ายออก' ? -abs($qty) : $qty);

            $conn->begin_transaction();
            try {
                $stmt = $conn->prepare("SELECT current_stock FROM office_supplies WHERE id = ? FOR UPDATE");
                $stmt->bind_param("i", $supplyId);
                $stmt->execute();
                $row = $stmt->get_result()->fetch_assoc();
                if (!$row) throw new Exception("ไม่พบสินค้า");

                $newStock = max(0, (int) $row['current_stock'] + $delta);
                $upd = $conn->prepare("UPDATE office_supplies SET current_stock = ? WHERE id = ?");
                $upd->bind_param("ii", $newStock, $supplyId);
                $upd->execute();

                $ins = $conn->prepare("INSERT INTO office_supply_movements (supply_id, type, qty, employee_name, note, order_ref) VALUES (?, ?, ?, ?, ?, ?)");
                $ins->bind_param("isisss", $supplyId, $type, $delta, $employeeName, $note, $orderRef);
                $ins->execute();

                $conn->commit();
                echo json_encode(["status" => "success", "data" => ["currentStock" => $newStock]]);
            } catch (Exception $e) {
                $conn->rollback();
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            }
        } elseif ($action === 'defect') {
            $productName = $input['productName'] ?? '';
            $quantity = (int) ($input['quantity'] ?? 0);
            $defectType = $input['defectType'] ?? null;
            $reportedBy = $input['reportedBy'] ?? null;
            $orderRef = $input['orderRef'] ?? null;
            $resolutionAction = $input['resolutionAction'] ?? null;
            $note = $input['note'] ?? null;

            if ($productName === '' || $quantity <= 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "productName และ quantity เป็นสิ่งจำเป็น"]);
                exit();
            }

            $ins = $conn->prepare("INSERT INTO office_supply_defects (product_name, quantity, defect_type, report_date, reported_by, order_ref, resolution_action, note) VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?)");
            $ins->bind_param("sisssss", $productName, $quantity, $defectType, $reportedBy, $orderRef, $resolutionAction, $note);
            if ($ins->execute()) {
                echo json_encode(["status" => "success", "id" => $conn->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => $ins->error]);
            }
        } elseif ($action === 'bulk_import') {
            $type = $input['type'] ?? '';
            $rows = $input['rows'] ?? [];
            if (!in_array($type, ['รับเข้า', 'จ่ายออก'], true) || count($rows) === 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "type และ rows เป็นสิ่งจำเป็น"]);
                exit();
            }

            // Validate every code exists before writing anything
            $codes = array_map(fn($r) => $r['code'] ?? '', $rows);
            $invalid = [];
            $codeToId = [];
            foreach ($codes as $code) {
                if ($code === '' || isset($codeToId[$code])) continue;
                $stmt = $conn->prepare("SELECT id, current_stock FROM office_supplies WHERE code = ?");
                $stmt->bind_param("s", $code);
                $stmt->execute();
                $row = $stmt->get_result()->fetch_assoc();
                if (!$row) {
                    $invalid[] = $code;
                } else {
                    $codeToId[$code] = ["id" => (int) $row['id'], "stock" => (int) $row['current_stock']];
                }
            }
            if (count($invalid) > 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "ไม่พบรหัสสินค้า: " . implode(', ', $invalid)]);
                exit();
            }

            $conn->begin_transaction();
            try {
                $imported = 0;
                foreach ($rows as $row) {
                    $code = $row['code'] ?? '';
                    $qty = (int) ($row['qty'] ?? 0);
                    $note = $row['note'] ?? null;
                    if ($code === '' || $qty <= 0 || !isset($codeToId[$code])) continue;

                    $supplyId = $codeToId[$code]['id'];
                    $delta = $type === 'รับเข้า' ? $qty : -$qty;
                    $newStock = max(0, $codeToId[$code]['stock'] + $delta);
                    $codeToId[$code]['stock'] = $newStock;

                    $upd = $conn->prepare("UPDATE office_supplies SET current_stock = ? WHERE id = ?");
                    $upd->bind_param("ii", $newStock, $supplyId);
                    $upd->execute();

                    $ins = $conn->prepare("INSERT INTO office_supply_movements (supply_id, type, qty, note) VALUES (?, ?, ?, ?)");
                    $ins->bind_param("isis", $supplyId, $type, $delta, $note);
                    $ins->execute();
                    $imported++;
                }
                $conn->commit();
                echo json_encode(["status" => "success", "imported" => $imported]);
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
