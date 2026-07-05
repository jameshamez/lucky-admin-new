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
$db_options = ['nacresc1_1', 'finfinph_luckycompany'];
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
    if ($part === 'tasks3.php' && isset($path_parts[$key + 1]) && $path_parts[$key + 1] !== '') {
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
        $stmt = $conn->prepare("SELECT * FROM tasks_test3 WHERE id = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if (!$row) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Task not found"]);
            exit();
        }

        $sub_stmt = $conn->prepare("SELECT id, name, is_completed FROM sub_tasks_test3 WHERE task_id = ? ORDER BY updated_at ASC");
        $sub_stmt->bind_param("s", $id);
        $sub_stmt->execute();
        $sub_result = $sub_stmt->get_result();
        $sub_tasks = [];
        while ($sub_row = $sub_result->fetch_assoc()) {
            $sub_tasks[] = [
                'id' => $sub_row['id'],
                'name' => $sub_row['name'],
                'isCompleted' => (int) $sub_row['is_completed'] === 100,
                'percentCompleted' => (int) $sub_row['is_completed']
            ];
        }
        $row['subTasks'] = $sub_tasks;

        echo json_encode(["status" => "success", "data" => $row]);
        exit();
    }

    $where = ["1=1"];
    $params = [];
    $types = '';

    if (!empty($_GET['type'])) {
        $where[] = "type = ?";
        $params[] = trim($_GET['type']);
        $types .= 's';
    }

    if (!empty($_GET['search'])) {
        $like = '%' . trim($_GET['search']) . '%';
        $where[] = "(name LIKE ? OR note LIKE ?)";
        $params[] = $like;
        $params[] = $like;
        $types .= 'ss';
    }

    $where_sql = "WHERE " . implode(" AND ", $where);
    $sql = "SELECT * FROM tasks_test3 $where_sql ORDER BY sequence ASC, updated_at ASC";

    if (!empty($params)) {
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
    } else {
        $result = $conn->query($sql);
    }

    $tasks = [];
    $task_ids = [];
    while ($row = $result->fetch_assoc()) {
        $task = [
            'id' => $row['id'],
            'name' => $row['name'],
            'type' => $row['type'],
            'implementationStatus' => $row['implementation_status'],
            'uatStatus' => $row['uat_status'],
            'committeeStatus' => $row['committee_status'],
            'cloudStatus' => $row['cloud_status'],
            'e2eStatus' => $row['e2e_status'],
            'note' => $row['note'],
            'sequence' => (int) $row['sequence'],
            'updatedAt' => date('Y-m-d H:i', strtotime($row['updated_at'])),
            'subTasks' => []
        ];
        $tasks[$row['id']] = $task;
        $task_ids[] = "'" . $conn->real_escape_string($row['id']) . "'";
    }

    // Load all sub_tasks for the retrieved tasks
    if (!empty($task_ids)) {
        $ids_str = implode(",", $task_ids);
        $subResult = $conn->query("SELECT id, task_id, name, is_completed FROM sub_tasks_test3 WHERE task_id IN ($ids_str) ORDER BY updated_at ASC");
        if ($subResult) {
            while ($subRow = $subResult->fetch_assoc()) {
                $tasks[$subRow['task_id']]['subTasks'][] = [
                    'id' => $subRow['id'],
                    'name' => $subRow['name'],
                    'isCompleted' => (int) $subRow['is_completed'] === 100,
                    'percentCompleted' => (int) $subRow['is_completed']
                ];
            }
        }
    }

    echo json_encode(["status" => "success", "data" => array_values($tasks)]);
    exit();
}

// ==================== POST ====================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // Bulk Reorder
    if (isset($data['action']) && $data['action'] === 'reorder' && !empty($data['orders']) && is_array($data['orders'])) {
        $conn->begin_transaction();
        try {
            $update_stmt = $conn->prepare("UPDATE tasks_test3 SET sequence = ? WHERE id = ?");
            foreach ($data['orders'] as $order) {
                $task_id = $order['id'];
                $seq = (int) $order['sequence'];
                $update_stmt->bind_param("is", $seq, $task_id);
                $update_stmt->execute();
            }
            $conn->commit();
            echo json_encode(["status" => "success", "message" => "จัดลำดับใหม่สำเร็จ"]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
        exit();
    }

    if (empty($data['id']) || empty($data['name']) || empty($data['type'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "id, name และ type จำเป็นต้องกรอก"]);
        exit();
    }

    $check = $conn->prepare("SELECT id FROM tasks_test3 WHERE id = ?");
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
    $v_imp = trim($data['implementationStatus'] ?? 'Dev');
    $v_uat = trim($data['uatStatus'] ?? 'รอ UAT');
    $v_com = trim($data['committeeStatus'] ?? 'กรรมการตรวจสอบเอกสาร');
    $v_cloud = trim($data['cloudStatus'] ?? 'Pending');
    $v_e2e = trim($data['e2eStatus'] ?? 'Pending');
    $v_note = trim($data['note'] ?? '');

    // Get max sequence
    $res_seq = $conn->query("SELECT MAX(sequence) as max_seq FROM tasks_test3");
    $row_seq = $res_seq->fetch_assoc();
    $v_seq = ((int) ($row_seq['max_seq'] ?? 0)) + 1;

    $conn->begin_transaction();
    try {
        $stmt = $conn->prepare(
            "INSERT INTO tasks_test3 (id, name, type, implementation_status, uat_status, committee_status, cloud_status, e2e_status, note, sequence)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );
        $stmt->bind_param("sssssssssi", $v_id, $v_name, $v_type, $v_imp, $v_uat, $v_com, $v_cloud, $v_e2e, $v_note, $v_seq);
        $stmt->execute();

        if (!empty($data['subTasks']) && is_array($data['subTasks'])) {
            $sub_stmt = $conn->prepare("INSERT INTO sub_tasks_test3 (id, task_id, name, is_completed) VALUES (?, ?, ?, ?)");
            foreach ($data['subTasks'] as $st) {
                $st_id = !empty($st['id']) ? $st['id'] : uniqid('st_');
                $st_name = $st['name'] ?? 'Untitled';
                $st_comp = isset($st['percentCompleted']) ? (int) $st['percentCompleted'] : (!empty($st['isCompleted']) ? 100 : 0);
                $sub_stmt->bind_param("sssi", $st_id, $v_id, $st_name, $st_comp);
                $sub_stmt->execute();
            }
        }
        $conn->commit();

        http_response_code(201);
        echo json_encode(["status" => "success", "message" => "สร้าง Task สำเร็จ", "id" => $v_id]);
    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
    }
    exit();
}

// ==================== PUT ====================
if ($method === 'PUT') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ต้องระบุ ID"]);
        exit();
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (!empty($data)) {
        $fields = [];
        $params = [];
        $types = '';

        $field_map = [
            'name' => 'name',
            'type' => 'type',
            'implementationStatus' => 'implementation_status',
            'uatStatus' => 'uat_status',
            'committeeStatus' => 'committee_status',
            'cloudStatus' => 'cloud_status',
            'e2eStatus' => 'e2e_status',
            'note' => 'note',
            'sequence' => 'sequence'
        ];

        foreach ($field_map as $json_key => $db_col) {
            if (array_key_exists($json_key, $data)) {
                $fields[] = "$db_col = ?";
                $params[] = $data[$json_key];
                if ($json_key === 'sequence') {
                    $types .= 'i';
                } else {
                    $types .= 's';
                }
            }
        }

        $conn->begin_transaction();
        try {
            if (!empty($fields)) {
                $params[] = $id;
                $types .= 's';
                $stmt = $conn->prepare("UPDATE tasks_test3 SET " . implode(", ", $fields) . " WHERE id = ?");
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
            }

            if (array_key_exists('subTasks', $data) && is_array($data['subTasks'])) {
                $del_stmt = $conn->prepare("DELETE FROM sub_tasks_test3 WHERE task_id = ?");
                $del_stmt->bind_param("s", $id);
                $del_stmt->execute();

                if (!empty($data['subTasks'])) {
                    $in_stmt = $conn->prepare("INSERT INTO sub_tasks_test3 (id, task_id, name, is_completed) VALUES (?, ?, ?, ?)");
                    foreach ($data['subTasks'] as $st) {
                        $st_id = !empty($st['id']) ? $st['id'] : uniqid('st_');
                        $st_name = $st['name'] ?? 'Untitled';
                        $st_comp = isset($st['percentCompleted']) ? (int) $st['percentCompleted'] : (!empty($st['isCompleted']) ? 100 : 0);
                        $in_stmt->bind_param("sssi", $st_id, $id, $st_name, $st_comp);
                        $in_stmt->execute();
                    }
                }
            }

            $conn->commit();
            echo json_encode(["status" => "success", "message" => "อัปเดตข้อมูลสำเร็จ"]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $e->getMessage()]);
        }
    }
    exit();
}

// ==================== DELETE ====================
if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ต้องระบุ ID"]);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM tasks_test3 WHERE id = ?");
    $stmt->bind_param("s", $id);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "ลบ Task สำเร็จ"]);
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