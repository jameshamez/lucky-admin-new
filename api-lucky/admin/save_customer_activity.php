<?php
// เปิด Error Reporting ชั่วคราวเพื่อดูปัญหา (ถ้า Production แล้วควรปิด)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../condb.php';
$conn->select_db('nacresc1_1'); // Make sure to replace 'lucky_db' with your actual database name

// เช็คการเชื่อมต่อ
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->customer_id) && !empty($data->title)) {

    // แปลงวันที่จาก ISO8601 เป็น MySQL Format (Y-m-d H:i:s)
    $start_datetime = date('Y-m-d H:i:s', strtotime($data->start_datetime));
    $end_datetime = !empty($data->end_datetime) ? date('Y-m-d H:i:s', strtotime($data->end_datetime)) : null;

    if (isset($data->id) && !empty($data->id)) {
        // Update Existing Activity
        $sql = "UPDATE customer_admin_activities SET 
                activity_type = ?, 
                title = ?, 
                description = ?, 
                start_datetime = ?, 
                end_datetime = ?, 
                reminder_type = ?, 
                contact_person = ?, 
                responsible_person = ?, 
                status = ?, 
                priority = ? 
                WHERE id = ?";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Prepare failed (Update): " . $conn->error]);
            exit();
        }

        $stmt->bind_param(
            "sssssssssss",
            $data->activity_type,
            $data->title,
            $data->description,
            $start_datetime,
            $end_datetime,
            $data->reminder_type,
            $data->contact_person,
            $data->responsible_person,
            $data->status,
            $data->priority,
            $data->id
        );
    } else {
        // Insert New Activity
        $id = bin2hex(random_bytes(18)); // Generate Unique ID

        $sql = "INSERT INTO customer_admin_activities (
                id, customer_id, activity_type, title, description, 
                start_datetime, end_datetime, reminder_type, 
                contact_person, responsible_person, status, priority
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Prepare failed (Insert): " . $conn->error]);
            exit();
        }

        $stmt->bind_param(
            "ssssssssssss",
            $id,
            $data->customer_id,
            $data->activity_type,
            $data->title,
            $data->description,
            $start_datetime,
            $end_datetime,
            $data->reminder_type,
            $data->contact_person,
            $data->responsible_person,
            $data->status,
            $data->priority
        );
    }

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Activity saved successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database error: " . $stmt->error]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data"]);
}
?>