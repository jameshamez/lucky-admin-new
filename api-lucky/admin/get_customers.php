<?php
// 1. ตั้งค่า Header เพื่อรองรับการเรียกจาก React (CORS)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

// 2. เชื่อมต่อฐานข้อมูล (ใช้ไฟล์เดิมของคุณ)
require '../condb.php';
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

// 3. เขียนคำสั่ง SQL ดึงข้อมูล
// ดึงข้อมูลจากตาราง customers_admin เรียงตามวันที่สร้างล่าสุด
$sql = "SELECT * FROM customers_admin ORDER BY created_at DESC";
$result = $conn->query($sql);

$customers = array();

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {

        // --- จัดการข้อมูลพิเศษก่อนส่งออก ---

        // แปลง JSON string ของเบอร์โทรกลับเป็น Array
        if (!empty($row['phone_numbers'])) {
            $row['phone_numbers'] = json_decode($row['phone_numbers']);
        } else {
            $row['phone_numbers'] = [];
        }

        // แปลง JSON string ของอีเมลกลับเป็น Array
        if (!empty($row['emails'])) {
            $row['emails'] = json_decode($row['emails']);
        } else {
            $row['emails'] = [];
        }

        // แปลง String สินค้าที่สนใจ (คั่นด้วยคอมม่า) เป็น Array
        if (!empty($row['interested_products'])) {
            $row['interested_products'] = explode(", ", $row['interested_products']);
        } else {
            $row['interested_products'] = [];
        }

        // เพิ่มข้อมูลเข้าไปในรายการหลัก
        $customers[] = $row;
    }

    // ส่งข้อมูลกลับเป็น JSON พร้อมสถานะ 200 OK
    http_response_code(200);
    echo json_encode($customers);

} else {
    // ถ้าไม่มีข้อมูล ส่งเป็น Array ว่างกลับไป
    http_response_code(200);
    echo json_encode([]);
}

$conn->close();
?>