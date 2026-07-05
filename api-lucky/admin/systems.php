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
$db_options = ['nacresc1_1', 'nacresc1_1'];
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
    if ($part === 'systems.php' && isset($path_parts[$key + 1]) && $path_parts[$key + 1] !== '') {
        $id = $path_parts[$key + 1];
    }
}
if (!$id && isset($_GET['id'])) {
    $id = $_GET['id'];
}

$method = $_SERVER['REQUEST_METHOD'];

// ==================== GET ====================
if ($method === 'GET') {
    if ($id) {
        $stmt = $conn->prepare("SELECT * FROM systems WHERE id = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if (!$row) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "System not found"]);
            exit();
        }
        $row['subTasks'] = $row['sub_tasks'] ? json_decode($row['sub_tasks'], true) : [];
        unset($row['sub_tasks']);
        echo json_encode(["status" => "success", "data" => $row]);
        exit();
    }

    $where = ["1=1"];
    $params = [];
    $types = '';

    // Filter: type
    if (!empty($_GET['type'])) {
        $where[] = "type = ?";
        $params[] = trim($_GET['type']);
        $types .= 's';
    }

    // Search: name or note
    if (!empty($_GET['search'])) {
        $like = '%' . trim($_GET['search']) . '%';
        $where[] = "(name LIKE ? OR note LIKE ?)";
        $params[] = $like;
        $params[] = $like;
        $types .= 'ss';
    }

    $where_sql = "WHERE " . implode(" AND ", $where);
    $sql = "SELECT * FROM systems $where_sql ORDER BY created_at ASC";

    if (!empty($params)) {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conn->query($sql);
    }

    $systems = [];
    while ($row = $result->fetch_assoc()) {
        $system = [
            'id' => $row['id'],
            'name' => $row['name'],
            'type' => $row['type'],
            'uatStatus' => $row['uat_status'],
            'deliveryStatus' => $row['delivery_status'],
            'cloudStatus' => $row['cloud_status'],
            'e2eStatus' => $row['e2e_status'],
            'note' => $row['note'],
            'parentSystem' => $row['parent_system'],
            'updatedAt' => date('Y-m-d H:i', strtotime($row['updated_at'])),
            'subTasks' => $row['sub_tasks'] ? json_decode($row['sub_tasks'], true) : []
        ];
        $systems[] = $system;
    }

    // Build tree
    $items_by_id = [];
    $tree = [];

    foreach ($systems as $system) {
        $items_by_id[$system['id']] = $system;
        $items_by_id[$system['id']]['children'] = [];
    }

    foreach ($systems as $system) {
        $parentId = $system['parentSystem'];
        if ($parentId && isset($items_by_id[$parentId])) {
            $items_by_id[$parentId]['children'][] = &$items_by_id[$system['id']];
        } else {
            $tree[] = &$items_by_id[$system['id']];
        }
    }

    echo json_encode(["status" => "success", "data" => $tree]);
    exit();
}

// ==================== POST (สร้างระบบงานใหม่) ====================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data['id']) || empty($data['name']) || empty($data['type'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "id, name และ type จำเป็นต้องกรอก"]);
        exit();
    }

    $check = $conn->prepare("SELECT id FROM systems WHERE id = ?");
    $check->bind_param("s", $data['id']);
    $check->execute();
    if ($check->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "มี id นี้ในระบบแล้ว"]);
        exit();
    }

    $v_id = trim($data['id']);
    $v_name = trim($data['name']);
    $v_type = trim($data['type']);
    $v_uat_status = trim($data['uatStatus'] ?? 'อยู่ระหว่างดำเนินการของสายงาน');
    $v_delivery_status = trim($data['deliveryStatus'] ?? 'กระบวนการตรวจสอบเอกสาร');
    $v_cloud_status = trim($data['cloudStatus'] ?? 'N/A');
    $v_e2e_status = trim($data['e2eStatus'] ?? 'N/A');
    $v_note = trim($data['note'] ?? '');
    $v_parent_system = !empty($data['parentSystem']) ? trim($data['parentSystem']) : null;
    $v_sub_tasks = !empty($data['subTasks']) ? json_encode($data['subTasks']) : '[]';

    $stmt = $conn->prepare(
        "INSERT INTO systems (id, name, type, uat_status, delivery_status, cloud_status, e2e_status, note, parent_system, sub_tasks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("ssssssssss", $v_id, $v_name, $v_type, $v_uat_status, $v_delivery_status, $v_cloud_status, $v_e2e_status, $v_note, $v_parent_system, $v_sub_tasks);

    if ($stmt->execute()) {
        http_response_code(201);
        echo json_encode([
            "status" => "success",
            "message" => "สร้างระบบงานสำเร็จ",
            "id" => $v_id
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}

// ==================== PUT (แก้ไขระบบงาน) ====================
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

    // Map JSON payload keyste SQL columns
    $field_map = [
        'name' => 'name',
        'type' => 'type',
        'uatStatus' => 'uat_status',
        'deliveryStatus' => 'delivery_status',
        'cloudStatus' => 'cloud_status',
        'e2eStatus' => 'e2e_status',
        'note' => 'note',
        'parentSystem' => 'parent_system'
    ];

    foreach ($field_map as $json_key => $db_col) {
        if (array_key_exists($json_key, $data)) {
            $fields[] = "$db_col = ?";
            if ($json_key === 'parentSystem') {
                $params[] = !empty($data[$json_key]) ? $data[$json_key] : null;
            } else {
                $params[] = $data[$json_key];
            }
            $types .= 's';
        }
    }

    if (array_key_exists('subTasks', $data)) {
        $fields[] = "sub_tasks = ?";
        $params[] = json_encode($data['subTasks']);
        $types .= 's';
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ไม่มีข้อมูลที่จะอัปเดต"]);
        exit();
    }

    $params[] = $id;
    $types .= 's';

    $stmt = $conn->prepare("UPDATE systems SET " . implode(", ", $fields) . " WHERE id = ?");
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "อัปเดตข้อมูลสำเร็จ"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}

// ==================== DELETE (ลบระบบงาน) ====================
if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ต้องระบุ ID"]);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM systems WHERE id = ? OR parent_system = ?");
    $stmt->bind_param("ss", $id, $id);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "ลบระบบงานสำเร็จ"]);
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