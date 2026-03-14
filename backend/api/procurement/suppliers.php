<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

// Parse ID from URL or query string
$id = null;
$request_uri = $_SERVER['REQUEST_URI'];
$path_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
foreach ($path_parts as $key => $part) {
    if ($part === 'suppliers.php' && isset($path_parts[$key + 1]) && is_numeric($path_parts[$key + 1])) {
        $id = intval($path_parts[$key + 1]);
    }
}
if (!$id && isset($_GET['id'])) {
    $id = intval($_GET['id']);
}

if ($method === 'GET') {
    if ($id) {
        $stmt = $conn->prepare("SELECT * FROM procurement_suppliers WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        echo json_encode(["status" => "success", "data" => $res]);
    } else {
        $sql = "SELECT * FROM procurement_suppliers ORDER BY name ASC";
        $result = $conn->query($sql);
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $data]);
    }
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $name = $data['name'] ?? '';
    $contact = $data['contact'] ?? null;
    $specialty = $data['specialty'] ?? null;

    if (!$name) {
        echo json_encode(["status" => "error", "message" => "Name is required"]);
        exit();
    }

    $stmt = $conn->prepare("INSERT INTO procurement_suppliers (name, contact, specialty) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $name, $contact, $specialty);
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "id" => $conn->insert_id]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
    exit();
}

if ($method === 'PUT') {
    if (!$id) {
        echo json_encode(["status" => "error", "message" => "ID required"]);
        exit();
    }
    $data = json_decode(file_get_contents("php://input"), true);
    $fields = [];
    $params = [];
    $types = '';

    if (isset($data['name'])) {
        $fields[] = "name = ?";
        $params[] = $data['name'];
        $types .= 's';
    }
    if (isset($data['contact'])) {
        $fields[] = "contact = ?";
        $params[] = $data['contact'];
        $types .= 's';
    }
    if (isset($data['specialty'])) {
        $fields[] = "specialty = ?";
        $params[] = $data['specialty'];
        $types .= 's';
    }

    if (empty($fields)) {
        echo json_encode(["status" => "error", "message" => "No fields to update"]);
        exit();
    }

    $params[] = $id;
    $types .= 'i';
    $stmt = $conn->prepare("UPDATE procurement_suppliers SET " . implode(", ", $fields) . " WHERE id = ?");
    $stmt->bind_param($types, ...$params);
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Updated"]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
    exit();
}

if ($method === 'DELETE') {
    if (!$id) {
        echo json_encode(["status" => "error", "message" => "ID required"]);
        exit();
    }
    $stmt = $conn->prepare("DELETE FROM procurement_suppliers WHERE id = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Deleted"]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
?>