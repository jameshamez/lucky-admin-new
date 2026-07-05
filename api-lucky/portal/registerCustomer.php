<?php
// register.php - PHP API สำหรับรับข้อมูลการลงทะเบียน

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

// ตรวจสอบความถูกต้องของข้อมูล
$errors = [];

// ตรวจสอบว่ามีข้อมูลที่จำเป็นครบถ้วนหรือไม่
$requiredFields = ['name', 'email', 'password', 'confirmPassword', 'phone'];
foreach ($requiredFields as $field) {
    if (empty($input[$field])) {
        $errors[] = "กรุณากรอกข้อมูลให้ครบถ้วน";
        break;
    }
}

// ตรวจสอบอีเมล
if (!empty($input['email']) && !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'รูปแบบอีเมลไม่ถูกต้อง';
}

// ตรวจสอบเบอร์โทรศัพท์
if (!empty($input['phone']) && !preg_match('/^[0-9]{10}$/', $input['phone'])) {
    $errors[] = 'เบอร์โทรศัพท์ไม่ถูกต้อง กรุณากรอกเบอร์โทรศัพท์ 10 หลัก';
}

// ตรวจสอบรหัสผ่าน
if (!empty($input['password'])) {
    if (strlen($input['password']) < 6) {
        $errors[] = 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร';
    }

    // ตรวจสอบรหัสผ่านตรงกัน
    if ($input['password'] !== $input['confirmPassword']) {
        $errors[] = 'รหัสผ่านไม่ตรงกัน';
    }
}

// ถ้ามีข้อผิดพลาด ส่งกลับข้อความผิดพลาด
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $errors[0]]);
    exit();
}

// ถ้าผ่านการตรวจสอบทั้งหมด ทำการบันทึกข้อมูล
try {
    // เชื่อมต่อฐานข้อมูล
    require_once('../condb.php');

    // เลือกฐานข้อมูล
    $conn->select_db("nacresc1_1");

    // ตรวจสอบว่ามีอีเมลนี้ในระบบแล้วหรือไม่
    $checkEmail = $conn->prepare("SELECT id FROM customers WHERE email = ?");
    $checkEmail->bind_param("s", $input['email']);
    $checkEmail->execute();
    $checkEmail->store_result();

    if ($checkEmail->num_rows > 0) {
        throw new Exception('อีเมลนี้ถูกใช้งานแล้ว');
    }

    // ตรวจสอบว่าเบอร์โทรศัพท์นี้มีในระบบแล้วหรือไม่
    // $checkPhone = $conn->prepare("SELECT id FROM customers WHERE phone = ?");
    // $checkPhone->bind_param("s", $input['phone']);
    // $checkPhone->execute();
    // $checkPhone->store_result();

    // if ($checkPhone->num_rows > 0) {
    //     throw new Exception('เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว');
    // }

    // Hash รหัสผ่านก่อนบันทึก
    $hashedPassword = password_hash($input['password'], PASSWORD_DEFAULT);

    // เตรียม SQL สำหรับบันทึกข้อมูล
    $stmt = $conn->prepare("INSERT INTO customers (username, password, full_name, email, phone, created_at) 
            VALUES (?, ?, ?, ?, ?, NOW())");

    // ตรวจสอบว่า prepare statement สำเร็จหรือไม่
    if (!$stmt) {
        throw new Exception("Prepare statement failed: " . $conn->error);
    }

    // กำหนดค่าเริ่มต้นสำหรับฟิลด์ที่อาจจะไม่มี
    $username = $input['email']; // ใช้ email เป็น username
    $fullName = $input['name'];
    $email = $input['email'];
    $phone = $input['phone'];

    $stmt->bind_param(
        "sssss",
        $username,
        $hashedPassword,
        $fullName,
        $email,
        $phone
    );

    // ทำการบันทึกข้อมูล
    $stmt->execute();

    // ตรวจสอบว่าการบันทึกสำเร็จหรือไม่
    if ($stmt->affected_rows > 0) {
        // ตอบกลับว่าสำเร็จ
        http_response_code(201); // Created
        echo json_encode(['success' => true, 'message' => 'ลงทะเบียนสำเร็จ']);
    } else {
        throw new Exception("บันทึกข้อมูลไม่สำเร็จ");
    }

    $stmt->close();
    $checkEmail->close();
    $checkPhone->close();

} catch (Exception $e) {
    // จัดการกรณีเกิดข้อผิดพลาดในการเชื่อมต่อหรือบันทึกข้อมูล
    http_response_code(500); // Internal Server Error
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);

    // บันทึกข้อผิดพลาดลงใน log
    error_log('Registration error: ' . $e->getMessage());
}

// ปิดการเชื่อมต่อ
if (isset($conn)) {
    $conn->close();
}
?>