<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
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

// Parse ID from URL or query string
$id = null;
$request_uri = $_SERVER['REQUEST_URI'];
$path_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
foreach ($path_parts as $key => $part) {
    if ($part === 'employees.php' && isset($path_parts[$key + 1]) && is_numeric($path_parts[$key + 1])) {
        $id = intval($path_parts[$key + 1]);
    }
}
if (!$id && isset($_GET['id'])) {
    $id = intval($_GET['id']);
}

// ==================== GET ====================
if ($method === 'GET') {
    if ($id) {
        // ดึงพนักงานคนเดียว
        $stmt = $conn->prepare("SELECT * FROM employees WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if (!$row) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Employee not found"]);
            exit();
        }
        echo json_encode(["status" => "success", "data" => $row]);
        exit();
    }

    // ดึงรายชื่อพนักงานทั้งหมด (filter: is_sales, is_active, department)
    $where = ["is_active = 1"];
    $params = [];
    $types = '';

    // Filter: เฉพาะพนักงานขาย
    if (isset($_GET['sales_only']) && $_GET['sales_only'] === '1') {
        $where[] = "is_sales = 1";
    }

    // Filter: แผนก
    if (!empty($_GET['department'])) {
        $where[] = "department = ?";
        $params[] = trim($_GET['department']);
        $types .= 's';
    }

    // Search
    if (!empty($_GET['search'])) {
        $like = '%' . trim($_GET['search']) . '%';
        $where[] = "(full_name LIKE ? OR nickname LIKE ? OR code LIKE ?)";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $types .= 'sss';
    }

    $where_sql = "WHERE " . implode(" AND ", $where);
    $sql = "SELECT id, code, full_name, nickname, department, position, phone, email, is_sales, is_active FROM employees $where_sql ORDER BY full_name ASC";

    if (!empty($params)) {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conn->query($sql);
    }

    $employees = [];
    while ($row = $result->fetch_assoc()) {
        $employees[] = $row;
    }

    echo json_encode(["status" => "success", "data" => $employees, "total" => count($employees)]);
    exit();
}

// ==================== POST ====================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data) || empty($data['full_name'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "full_name is required"]);
        exit();
    }

    // Auto-generate code ถ้าไม่ส่งมา
    if (empty($data['code'])) {
        $count_row = $conn->query("SELECT COUNT(*) AS cnt FROM employees")->fetch_assoc();
        $data['code'] = 'EMP' . str_pad(($count_row['cnt'] + 1), 3, '0', STR_PAD_LEFT);
    }

    $v_code = $data['code'];
    $v_full_name = $data['full_name'];
    $v_nickname = $data['nickname'] ?? null;
    $v_department = $data['department'] ?? null;
    $v_position = $data['position'] ?? null;
    $v_phone = $data['phone'] ?? null;
    $v_email = $data['email'] ?? null;
    $v_line_id = $data['line_id'] ?? null;
    $v_is_sales = intval($data['is_sales'] ?? 1);
    $v_is_active = intval($data['is_active'] ?? 1);

    $stmt = $conn->prepare(
        "INSERT INTO employees (code, full_name, nickname, department, position, phone, email, line_id, is_sales, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param(
        "ssssssssii",
        $v_code,
        $v_full_name,
        $v_nickname,
        $v_department,
        $v_position,
        $v_phone,
        $v_email,
        $v_line_id,
        $v_is_sales,
        $v_is_active
    );

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode(["status" => "success", "id" => $conn->insert_id, "code" => $v_code]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}

// ==================== PUT ====================
if ($method === 'PUT') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID required"]);
        exit();
    }
    $data = json_decode(file_get_contents("php://input"), true);
    $fields = [];
    $params = [];
    $types = '';

    $allowed = ['code', 'full_name', 'nickname', 'department', 'position', 'phone', 'email', 'line_id', 'is_sales', 'is_active'];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $data)) {
            $fields[] = "$field = ?";
            $params[] = $data[$field];
            $types .= in_array($field, ['is_sales', 'is_active']) ? 'i' : 's';
        }
    }
    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "No fields to update"]);
        exit();
    }
    $params[] = $id;
    $types .= 'i';
    $stmt = $conn->prepare("UPDATE employees SET " . implode(", ", $fields) . " WHERE id = ?");
    $stmt->bind_param($types, ...$params);
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Updated"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}

// ==================== DELETE ====================
if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID required"]);
        exit();
    }
    // Soft delete
    $stmt = $conn->prepare("UPDATE employees SET is_active = 0 WHERE id = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Employee deactivated"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
$conn->close();
?>