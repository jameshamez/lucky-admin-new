<?php
// ===================================================
// API: customer_activities.php
// GET    ?customer_id=X  → ดึงกิจกรรมทั้งหมดของลูกค้า
// GET    ?id=X           → ดึงกิจกรรมรายการเดียว
// POST                   → เพิ่มกิจกรรมใหม่
// PUT    ?id=X           → แก้ไขกิจกรรม
// DELETE ?id=X           → ลบกิจกรรม
// ===================================================

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// ดักจับ fatal error ให้ส่งกลับเป็น JSON เสมอ
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        header("Content-Type: application/json; charset=UTF-8");
        echo json_encode([
            "status" => "error",
            "message" => "PHP Fatal: " . $error['message'],
            "line" => $error['line']
        ]);
    }
});

// CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// เชื่อมต่อ DB
require '../condb.php';
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;
$customer_id = isset($_GET['customer_id']) ? intval($_GET['customer_id']) : null;

switch ($method) {

    // ===================================================
    // GET — ดึงกิจกรรม
    // ===================================================
    case 'GET':
        if ($id) {
            // กิจกรรมรายการเดียว
            $stmt = $conn->prepare("SELECT * FROM customer_activities WHERE id = ?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                echo json_encode(["status" => "success", "data" => formatRow($row)]);
            } else {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Activity not found"]);
            }
        } elseif ($customer_id) {
            // กิจกรรมทั้งหมดของลูกค้า เรียงล่าสุดก่อน
            $stmt = $conn->prepare(
                "SELECT * FROM customer_activities WHERE customer_id = ? ORDER BY start_datetime DESC"
            );
            $stmt->bind_param("i", $customer_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $activities = [];
            while ($row = $result->fetch_assoc()) {
                $activities[] = formatRow($row);
            }
            echo json_encode(["status" => "success", "data" => $activities, "total" => count($activities)]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ต้องระบุ id หรือ customer_id"]);
        }
        break;

    // ===================================================
    // POST — เพิ่มกิจกรรมใหม่
    // ===================================================
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['customer_id']) || empty($data['title'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "customer_id และ title จำเป็นต้องกรอก"]);
            exit();
        }

        $cid = intval($data['customer_id']);
        $activity_type = $data['activity_type'] ?? 'โทรศัพท์';
        $title = $data['title'] ?? '';
        $description = $data['description'] ?? '';
        $start_datetime = $data['start_datetime'] ?? date('Y-m-d H:i:s');
        $end_datetime = !empty($data['end_datetime']) ? $data['end_datetime'] : null;
        $reminder_type = $data['reminder_type'] ?? 'ไม่ต้องแจ้ง';
        $contact_person = $data['contact_person'] ?? null;
        $responsible_person = $data['responsible_person'] ?? null;
        $status = $data['status'] ?? 'รอดำเนินการ';
        $priority = $data['priority'] ?? 'ปานกลาง';

        $sql = "INSERT INTO customer_activities
                    (customer_id, activity_type, title, description,
                     start_datetime, end_datetime, reminder_type,
                     contact_person, responsible_person, status, priority)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
            exit();
        }

        $stmt->bind_param(
            "issssssssss",
            $cid,
            $activity_type,
            $title,
            $description,
            $start_datetime,
            $end_datetime,
            $reminder_type,
            $contact_person,
            $responsible_person,
            $status,
            $priority
        );

        if ($stmt->execute()) {
            $new_id = $conn->insert_id;
            $get = $conn->prepare("SELECT * FROM customer_activities WHERE id = ?");
            $get->bind_param("i", $new_id);
            $get->execute();
            $new_activity = formatRow($get->get_result()->fetch_assoc());

            http_response_code(201);
            echo json_encode([
                "status" => "success",
                "message" => "บันทึกกิจกรรมสำเร็จ",
                "data" => $new_activity
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "DB Error: " . $stmt->error]);
        }
        break;

    // ===================================================
    // PUT — แก้ไขกิจกรรม
    // ===================================================
    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ต้องระบุ id"]);
            exit();
        }

        $data = json_decode(file_get_contents("php://input"), true);

        $allowed = [
            'activity_type' => 's',
            'title' => 's',
            'description' => 's',
            'start_datetime' => 's',
            'end_datetime' => 's',
            'reminder_type' => 's',
            'contact_person' => 's',
            'responsible_person' => 's',
            'status' => 's',
            'priority' => 's',
        ];

        $fields = [];
        $params = [];
        $types = '';

        foreach ($allowed as $field => $type) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
                $types .= $type;
            }
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ไม่มีข้อมูลที่จะแก้ไข"]);
            exit();
        }

        $params[] = $id;
        $types .= 'i';

        $sql = "UPDATE customer_activities SET " . implode(", ", $fields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
            exit();
        }
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            $get = $conn->prepare("SELECT * FROM customer_activities WHERE id = ?");
            $get->bind_param("i", $id);
            $get->execute();
            $updated = formatRow($get->get_result()->fetch_assoc());
            echo json_encode(["status" => "success", "message" => "อัปเดตกิจกรรมสำเร็จ", "data" => $updated]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "DB Error: " . $stmt->error]);
        }
        break;

    // ===================================================
    // DELETE — ลบกิจกรรม
    // ===================================================
    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ต้องระบุ id"]);
            exit();
        }

        $stmt = $conn->prepare("DELETE FROM customer_activities WHERE id = ?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "ลบกิจกรรมสำเร็จ"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "DB Error: " . $stmt->error]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}

$conn->close();

// ===================================================
// Helper: แปลง row ก่อนส่งออก
// ===================================================
function formatRow($row)
{
    if (!$row)
        return null;
    $row['id'] = (int) $row['id'];
    $row['customer_id'] = (int) $row['customer_id'];
    return $row;
}
?>