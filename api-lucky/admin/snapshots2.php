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

require '../condb.php';
/** @var mysqli $conn */

// Database Selection
$db_options = ['nacresc1_1', 'finfinph_luckycompany'];
foreach ($db_options as $db) {
    if (@$conn->select_db($db))
        break;
}
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

// Parse ID from URL or query string
$id = null;
$request_uri = $_SERVER['REQUEST_URI'];
$path_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
foreach ($path_parts as $key => $part) {
    if ($part === 'snapshots.php' && isset($path_parts[$key + 1]) && $path_parts[$key + 1] !== '') {
        $id = $path_parts[$key + 1];
    }
}
if (!$id && isset($_GET['id'])) {
    $id = $_GET['id'];
}

// ==================== GET ====================
if ($method === 'GET') {
    if ($id) {
        $stmt = $conn->prepare("SELECT * FROM snapshots_test2 WHERE id = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if (!$row) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Snapshot not found"]);
            exit();
        }
        $row['items'] = json_decode($row['snapshot_data'], true);
        unset($row['snapshot_data']);

        echo json_encode(["status" => "success", "data" => $row]);
        exit();
    }

    $sql = "SELECT id, snapshot_date, total_tasks, completed_tasks, overall_progress, created_at FROM snapshots_test2 ORDER BY snapshot_date DESC, created_at DESC";
    $result = $conn->query($sql);

    $snapshots = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $snapshots[] = [
                'id' => $row['id'],
                'date' => $row['snapshot_date'],
                'totalTasks' => (int) $row['total_tasks'],
                'completedTasks' => (int) $row['completed_tasks'],
                'overallProgress' => (int) $row['overall_progress'],
                'createdAt' => date('Y-m-d H:i:s', strtotime($row['created_at'])),
                'items' => [] // Don't load full data for list view to save bandwidth
            ];
        }
    }

    echo json_encode(["status" => "success", "data" => $snapshots]);
    exit();
}

// ==================== POST ====================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['date']) || !isset($data['items']) || !is_array($data['items'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "date and items are required"]);
        exit();
    }

    $snapshot_id = uniqid('snap_');
    $date = $data['date'];

    // Calculates summary (module-level, matching Dashboard2 logic)
    $total_tasks = count($data['items']);
    $completed_tasks = 0;
    foreach ($data['items'] as $item) {
        $status = isset($item['implementationStatus']) ? $item['implementationStatus'] : '';
        if ($status === 'Done' || $status === 'Done เก็บ Defect') {
            $completed_tasks++;
        }
    }

    $overall_progress = $total_tasks > 0 ? (int) round(($completed_tasks / $total_tasks) * 100) : 0;

    // Add full data for snapshot_data
    $snapshot_data = json_encode($data['items'], JSON_UNESCAPED_UNICODE);

    $stmt = $conn->prepare("INSERT INTO snapshots_test2 (id, snapshot_date, total_tasks, completed_tasks, overall_progress, snapshot_data) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssiiis", $snapshot_id, $date, $total_tasks, $completed_tasks, $overall_progress, $snapshot_data);

    if ($stmt->execute()) {
        echo json_encode([
            "status" => "success",
            "message" => "Snapshot created successfully",
            "data" => [
                'id' => $snapshot_id,
                'date' => $date,
                'totalTasks' => $total_tasks,
                'completedTasks' => $completed_tasks,
                'overallProgress' => $overall_progress
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error creating snapshot: " . $stmt->error]);
    }
    exit();
}

// ==================== DELETE ====================
if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Snapshot ID required"]);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM snapshots_test2 WHERE id = ?");
    $stmt->bind_param("s", $id);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Snapshot deleted successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Error deleting snapshot: " . $stmt->error]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
