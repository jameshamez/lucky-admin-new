<?php
// registerGoogle.php - PHP API สำหรับบันทึกข้อมูลผู้ใช้ Google

// อนุญาตการเข้าถึงจาก Origin ต่างๆ (CORS)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json; charset=utf-8');

// ถ้าเป็น OPTIONS request (preflight) ให้จบการทำงานเลย
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ตรวจสอบว่าเป็น POST request หรือไม่
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['success' => false, 'message' => 'ไม่อนุญาตให้ใช้ Method นี้']);
    exit();
}

// รับข้อมูล JSON จาก request body
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

// ตรวจสอบว่าสามารถแปลง JSON เป็น array ได้หรือไม่
if ($input === null) {
    http_response_code(400); // Bad Request
    echo json_encode(['success' => false, 'message' => 'รูปแบบข้อมูลไม่ถูกต้อง']);
    exit();
}

// ตรวจสอบความถูกต้องของข้อมูล Google User
$errors = [];

// ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วนหรือไม่
if (empty($input['googleUserId'])) {
    $errors[] = "ไม่พบ Google User ID";
}

if (empty($input['displayName'])) {
    $errors[] = "ไม่พบชื่อผู้ใช้";
}

if (empty($input['email'])) {
    $errors[] = "ไม่พบอีเมล";
} elseif (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'รูปแบบอีเมลไม่ถูกต้อง';
}



// ถ้ามีข้อผิดพลาด ส่งกลับข้อความผิดพลาด
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $errors[0]]);
    exit();
}

// ถ้าผ่านการตรวจสอบทั้งหมด ทำการบันทึกข้อมูล Google User
try {
    // เชื่อมต่อฐานข้อมูล
    require_once('../condb.php');

    // เลือกฐานข้อมูล
    $conn->select_db("nacresc1_1");

    // ตรวจสอบว่ามี Google User ID นี้ในระบบแล้วหรือไม่
    $checkGoogleUser = $conn->prepare("SELECT id, google_user_id, google_name, email, google_picture_url, created_at, updated_at FROM customers WHERE google_user_id = ?");
    $checkGoogleUser->bind_param("s", $input['googleUserId']);
    $checkGoogleUser->execute();
    $result = $checkGoogleUser->get_result();

    if ($result->num_rows > 0) {
        // ผู้ใช้มีอยู่แล้ว - อัปเดตข้อมูล
        $existingUser = $result->fetch_assoc();

        $updateStmt = $conn->prepare("UPDATE customers SET google_name = ?, email = ?, google_picture_url = ?, updated_at = NOW() WHERE google_user_id = ?");
        $updateStmt->bind_param(
            "ssss",
            $input['displayName'],
            $input['email'],
            $input['pictureUrl'],
            $input['googleUserId']
        );

        $updateStmt->execute();

        if ($updateStmt->affected_rows >= 0) {
            // ดึงข้อมูลที่อัปเดตแล้ว
            $getUserStmt = $conn->prepare("SELECT id, google_user_id, google_name, email, google_picture_url, created_at, updated_at FROM customers WHERE google_user_id = ?");
            $getUserStmt->bind_param("s", $input['googleUserId']);
            $getUserStmt->execute();
            $updatedUser = $getUserStmt->get_result()->fetch_assoc();

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'อัปเดตข้อมูลผู้ใช้ Google สำเร็จ',
                'user' => $updatedUser
            ]);
            $getUserStmt->close();
        } else {
            throw new Exception("อัปเดตข้อมูลไม่สำเร็จ");
        }

        $updateStmt->close();
    } else {
        // ผู้ใช้ใหม่ - สร้างข้อมูลใหม่
        $insertStmt = $conn->prepare("INSERT INTO customers (google_user_id, google_name, email, google_picture_url, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())");

        if (!$insertStmt) {
            throw new Exception("Prepare statement failed: " . $conn->error);
        }

        $insertStmt->bind_param(
            "ssss",
            $input['googleUserId'],
            $input['displayName'],
            $input['email'],
            $input['pictureUrl']
        );

        $insertStmt->execute();

        if ($insertStmt->affected_rows > 0) {
            // ดึงข้อมูลผู้ใช้ที่เพิ่งสร้าง
            $newUserId = $conn->insert_id;
            $getUserStmt = $conn->prepare("SELECT id, google_user_id, google_name, email, google_picture_url, created_at, updated_at FROM customers WHERE id = ?");
            $getUserStmt->bind_param("i", $newUserId);
            $getUserStmt->execute();
            $newUser = $getUserStmt->get_result()->fetch_assoc();

            http_response_code(201); // Created
            echo json_encode([
                'success' => true,
                'message' => 'บันทึกข้อมูลผู้ใช้ Google สำเร็จ',
                'user' => $newUser
            ]);
            $getUserStmt->close();
        } else {
            throw new Exception("บันทึกข้อมูลไม่สำเร็จ");
        }

        $insertStmt->close();
    }

    $checkGoogleUser->close();

} catch (Exception $e) {
    // จัดการกรณีเกิดข้อผิดพลาดในการเชื่อมต่อหรือบันทึกข้อมูล
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);

    // บันทึกข้อผิดพลาดลงใน log
    error_log('Google User save error: ' . $e->getMessage());
}

// ปิดการเชื่อมต่อ
if (isset($conn)) {
    $conn->close();
}
?>