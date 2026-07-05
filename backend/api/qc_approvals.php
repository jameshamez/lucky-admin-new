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

require __DIR__ . '/../condb.php';
/** @var mysqli $conn */
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];
$departments = ['เซลล์', 'จัดซื้อ'];

try {
    if ($method === 'GET') {
        $orderId = $_GET['orderId'] ?? '';
        $stepsParam = $_GET['steps'] ?? '';
        $steps = array_filter(array_map('trim', explode(',', $stepsParam)));

        if ($orderId === '' || count($steps) === 0) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "orderId and steps are required"]);
            exit();
        }

        // Lazy-init: make sure every (order, step, department) combo has a row
        foreach ($steps as $step) {
            foreach ($departments as $dept) {
                $ins = $conn->prepare("INSERT IGNORE INTO qc_approvals (order_id, step_key, department, status) VALUES (?, ?, ?, 'pending')");
                $ins->bind_param("sss", $orderId, $step, $dept);
                $ins->execute();
            }
        }

        $stepList = implode(',', array_map(fn($s) => "'" . $conn->real_escape_string($s) . "'", $steps));
        $orderIdEsc = $conn->real_escape_string($orderId);
        $res = $conn->query("SELECT * FROM qc_approvals WHERE order_id = '$orderIdEsc' AND step_key IN ($stepList) ORDER BY id ASC");

        $grouped = [];
        foreach ($steps as $step) $grouped[$step] = [];
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $grouped[$row['step_key']][] = [
                    "department" => $row['department'],
                    "status" => $row['status'],
                    "approvedBy" => $row['approved_by'],
                    "approvedAt" => $row['approved_at'],
                    "comment" => $row['comment'],
                ];
            }
        }

        echo json_encode(["status" => "success", "data" => $grouped]);
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        $orderId = $input['orderId'] ?? '';
        $stepKey = $input['stepKey'] ?? '';
        $department = $input['department'] ?? '';
        $status = $input['status'] ?? '';
        $comment = $input['comment'] ?? null;
        $approvedBy = $input['approvedBy'] ?? null;

        if ($orderId === '' || $stepKey === '' || !in_array($department, $departments, true) || !in_array($status, ['passed', 'failed'], true)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "orderId, stepKey, department and a valid status are required"]);
            exit();
        }

        $stmt = $conn->prepare("INSERT INTO qc_approvals (order_id, step_key, department, status, comment, approved_by, approved_at)
                                VALUES (?, ?, ?, ?, ?, ?, NOW())
                                ON DUPLICATE KEY UPDATE status = VALUES(status), comment = VALUES(comment),
                                approved_by = VALUES(approved_by), approved_at = VALUES(approved_at)");
        $stmt->bind_param("ssssss", $orderId, $stepKey, $department, $status, $comment, $approvedBy);
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
