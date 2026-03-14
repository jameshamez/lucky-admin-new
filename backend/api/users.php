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

require '../condb.php';
/** @var mysqli $conn */

// Database Selection
$db_options = ['finfinph_lcukycompany', 'finfinph_luckycompany'];
foreach ($db_options as $db) {
    if (@$conn->select_db($db))
        break;
}
$conn->set_charset("utf8mb4");

// Parse ID from URL or query string
$id = null;
$request_uri = $_SERVER['REQUEST_URI'];
$path_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
foreach ($path_parts as $key => $part) {
    if ($part === 'users.php' && isset($path_parts[$key + 1]) && is_numeric($path_parts[$key + 1])) {
        $id = intval($path_parts[$key + 1]);
    }
}
if (!$id && isset($_GET['id'])) {
    $id = intval($_GET['id']);
}

$method = $_SERVER['REQUEST_METHOD'];

// ==================== GET ====================
if ($method === 'GET') {
    if ($id) {
        // ดึง user คนเดียว (ไม่ส่ง password กลับ)
        $stmt = $conn->prepare("SELECT id, username, full_name, email, department, role, status, created_at FROM users WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if (!$row) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "User not found"]);
            exit();
        }
        echo json_encode(["status" => "success", "data" => $row]);
        exit();
    }

    // ดึงรายชื่อ user ทั้งหมด
    $where = ["1=1"];
    $params = [];
    $types = '';

    // Filter: department
    if (!empty($_GET['department'])) {
        $where[] = "department = ?";
        $params[] = trim($_GET['department']);
        $types .= 's';
    }

    // Filter: role
    if (!empty($_GET['role'])) {
        $where[] = "role = ?";
        $params[] = trim($_GET['role']);
        $types .= 's';
    }

    // Filter: status (active / inactive)
    if (!empty($_GET['status'])) {
        $where[] = "status = ?";
        $params[] = trim($_GET['status']);
        $types .= 's';
    }

    // Search: username, full_name, email
    if (!empty($_GET['search'])) {
        $like = '%' . trim($_GET['search']) . '%';
        $where[] = "(username LIKE ? OR full_name LIKE ? OR email LIKE ?)";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $types .= 'sss';
    }

    $where_sql = "WHERE " . implode(" AND ", $where);
    // ไม่ส่ง password กลับ
    $sql = "SELECT id, username, full_name, email, department, role, status, created_at FROM users $where_sql ORDER BY created_at DESC";

    if (!empty($params)) {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conn->query($sql);
    }

    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }

    echo json_encode(["status" => "success", "data" => $users, "total" => count($users)]);
    exit();
}

// ==================== POST (สร้าง user ใหม่) ====================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // Validation
    if (empty($data['username']) || empty($data['password']) || empty($data['full_name'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "username, password และ full_name จำเป็นต้องกรอก"]);
        exit();
    }

    // ตรวจสอบ username ซ้ำ
    $check = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $check->bind_param("s", $data['username']);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "มี username นี้ในระบบแล้ว"]);
        exit();
    }

    $v_username = trim($data['username']);
    $v_password = password_hash($data['password'], PASSWORD_BCRYPT); // hash ก่อนบันทึก
    $v_full_name = trim($data['full_name']);
    $v_email = trim($data['email'] ?? '');
    $v_department = trim($data['department'] ?? '');
    $v_role = trim($data['role'] ?? 'User');
    $v_status = trim($data['status'] ?? 'active');

    $stmt = $conn->prepare(
        "INSERT INTO users (username, password, full_name, email, department, role, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("sssssss", $v_username, $v_password, $v_full_name, $v_email, $v_department, $v_role, $v_status);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "message" => "สร้างผู้ใช้งานสำเร็จ",
            "id" => $conn->insert_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}

// ==================== PUT (แก้ไข user) ====================
if ($method === 'PUT') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ต้องระบุ ID"]);
        exit();
    }

    $data = json_decode(file_get_contents("php://input"), true);
    $fields = [];
    $params = [];
    $types = '';

    // Fields ที่อนุญาตให้แก้ไข
    $allowed_string = ['username', 'full_name', 'email', 'department', 'role', 'status'];
    foreach ($allowed_string as $field) {
        if (array_key_exists($field, $data)) {
            // ตรวจสอบ username ซ้ำ (ยกเว้น record ของตัวเอง)
            if ($field === 'username') {
                $check = $conn->prepare("SELECT id FROM users WHERE username = ? AND id != ?");
                $check->bind_param("si", $data['username'], $id);
                $check->execute();
                if ($check->get_result()->num_rows > 0) {
                    http_response_code(409);
                    echo json_encode(["status" => "error", "message" => "มี username นี้ในระบบแล้ว"]);
                    exit();
                }
            }
            $fields[] = "$field = ?";
            $params[] = $data[$field];
            $types .= 's';
        }
    }

    // แก้ไข password (ถ้าส่งมา)
    if (!empty($data['password'])) {
        $fields[] = "password = ?";
        $params[] = password_hash($data['password'], PASSWORD_BCRYPT);
        $types .= 's';
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ไม่มีข้อมูลที่จะอัปเดต"]);
        exit();
    }

    $params[] = $id;
    $types .= 'i';

    $stmt = $conn->prepare("UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?");
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "อัปเดตผู้ใช้งานสำเร็จ"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}

// ==================== DELETE (ปิดการใช้งาน user) ====================
if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ต้องระบุ ID"]);
        exit();
    }

    // ป้องกันลบ admin คนสุดท้าย
    $admin_check = $conn->prepare("SELECT COUNT(*) AS cnt FROM users WHERE role = 'Admin' AND status = 'active' AND id != ?");
    $admin_check->bind_param("i", $id);
    $admin_check->execute();
    $admin_row = $admin_check->get_result()->fetch_assoc();

    $target = $conn->prepare("SELECT role FROM users WHERE id = ?");
    $target->bind_param("i", $id);
    $target->execute();
    $target_user = $target->get_result()->fetch_assoc();

    if ($target_user && $target_user['role'] === 'Admin' && $admin_row['cnt'] == 0) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "ไม่สามารถปิดการใช้งาน Admin คนสุดท้ายได้"]);
        exit();
    }

    // Soft delete — เปลี่ยน status เป็น inactive แทนการลบจริง
    $stmt = $conn->prepare("UPDATE users SET status = 'inactive' WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "ปิดการใช้งานผู้ใช้งานสำเร็จ"]);
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