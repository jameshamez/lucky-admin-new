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

try {
    if ($method === 'GET') {
        $orderId = $_GET['orderId'] ?? '';
        $stepKey = $_GET['stepKey'] ?? '';
        if ($orderId === '' || $stepKey === '') {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "orderId and stepKey are required"]);
            exit();
        }

        $stmt = $conn->prepare("SELECT w.*, c.name, c.color, c.size, c.required_qty, c.unit, c.image
                                FROM production_withdrawals w
                                JOIN production_withdrawal_components c ON c.id = w.component_id
                                WHERE w.order_id = ? AND w.step_key = ?
                                ORDER BY w.withdrawn_at ASC, w.id ASC");
        $stmt->bind_param("ss", $orderId, $stepKey);
        $stmt->execute();
        $res = $stmt->get_result();

        // Group rows into batches keyed by (withdrawn_at, requester) — a single withdrawal
        // action inserts multiple component rows sharing the same timestamp.
        $batches = [];
        $batchKeys = [];
        while ($row = $res->fetch_assoc()) {
            $key = $row['withdrawn_at'] . '|' . $row['requester'];
            if (!isset($batchKeys[$key])) {
                $batches[] = [
                    "date" => $row['withdrawn_at'],
                    "requester" => $row['requester'],
                    "items" => [],
                ];
                $batchKeys[$key] = count($batches) - 1;
            }
            $batches[$batchKeys[$key]]['items'][] = [
                "id" => (string) $row['component_id'],
                "name" => $row['name'],
                "color" => $row['color'],
                "size" => $row['size'],
                "requiredQty" => (int) $row['required_qty'],
                "withdrawnQty" => (int) $row['withdrawn_qty'],
                "image" => $row['image'],
            ];
        }

        echo json_encode(["status" => "success", "data" => $batches]);
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        $orderId = $input['orderId'] ?? '';
        $stepKey = $input['stepKey'] ?? '';
        $requester = $input['requester'] ?? '';
        $items = $input['items'] ?? []; // [{componentId, withdrawnQty}]

        if ($orderId === '' || $stepKey === '' || $requester === '' || count($items) === 0) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "orderId, stepKey, requester and items are required"]);
            exit();
        }

        $timestamp = date('Y-m-d H:i:s');
        $conn->begin_transaction();
        try {
            foreach ($items as $item) {
                $componentId = (int) ($item['componentId'] ?? 0);
                $withdrawnQty = (int) ($item['withdrawnQty'] ?? 0);
                if (!$componentId || $withdrawnQty <= 0) continue;
                $ins = $conn->prepare("INSERT INTO production_withdrawals (order_id, step_key, component_id, withdrawn_qty, requester, withdrawn_at) VALUES (?, ?, ?, ?, ?, ?)");
                $ins->bind_param("ssiiss", $orderId, $stepKey, $componentId, $withdrawnQty, $requester, $timestamp);
                $ins->execute();
            }
            $conn->commit();
            echo json_encode(["status" => "success"]);
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
