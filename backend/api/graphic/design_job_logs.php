<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../../condb.php';
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $conn->connect_error]);
    exit();
}

// ─── GET logs ─────────────────────────────────────────────────────────────────
$job_id = isset($_GET['job_id']) ? intval($_GET['job_id']) : null;
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 100;

if (!$job_id) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "job_id required"]);
    exit();
}

$stmt = $conn->prepare(
    "SELECT l.*, dj.job_code, dj.client_name
     FROM design_job_logs l
     JOIN design_jobs dj ON l.job_id = dj.id
     WHERE l.job_id = ?
     ORDER BY l.created_at DESC
     LIMIT ?"
);
$stmt->bind_param("ii", $job_id, $limit);
$stmt->execute();
$result = $stmt->get_result();

$logs = [];
while ($row = $result->fetch_assoc()) {
    $logs[] = $row;
}

echo json_encode(["status" => "success", "data" => $logs]);
$conn->close();
?>