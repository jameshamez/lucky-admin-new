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
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];
$customer_id = isset($_GET['customer_id']) ? intval($_GET['customer_id']) : null;
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

switch ($method) {
    case 'GET':
        if (!$customer_id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "customer_id is required"]);
            exit();
        }
        $sql = "SELECT * FROM customer_notes WHERE customer_id = ? ORDER BY created_at DESC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $customer_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $notes = [];
        while ($row = $result->fetch_assoc()) {
            $notes[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $notes]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['customer_id']) || empty($data['content'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "customer_id and content are required"]);
            exit();
        }
        $cid = (int) $data['customer_id'];
        $content = $data['content'];
        $author = isset($data['author']) ? $data['author'] : 'ผู้ใช้งาน';

        $sql = "INSERT INTO customer_notes (customer_id, content, author) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iss", $cid, $content, $author);
        if ($stmt->execute()) {
            $new_id = $conn->insert_id;
            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Note saved", "id" => $new_id]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "id is required"]);
            exit();
        }
        $sql = "DELETE FROM customer_notes WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Note deleted"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
$conn->close();
?>