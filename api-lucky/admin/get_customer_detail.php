<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require '../condb.php';
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

// รับ ID จาก URL (เช่น get_customer_detail.php?id=xxxx)
$id = $_GET['id'];

if (!empty($id)) {
    // 1. ดึงข้อมูลลูกค้าหลัก
    $sql = "SELECT * FROM customers_admin WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $customer = $result->fetch_assoc();

    if ($customer) {
        // แปลง JSON กลับเป็น Array
        $customer['phone_numbers'] = json_decode($customer['phone_numbers']);
        $customer['emails'] = json_decode($customer['emails']);
        $customer['interested_products'] = $customer['interested_products'] ? explode(", ", $customer['interested_products']) : [];

        // 2. ดึงข้อมูลผู้ติดต่อเพิ่มเติม (จากตารางลูก)
        $sql_contacts = "SELECT * FROM customer_admin_contacts WHERE customer_id = ?";
        $stmt_c = $conn->prepare($sql_contacts);
        $stmt_c->bind_param("s", $id);
        $stmt_c->execute();
        $res_c = $stmt_c->get_result();

        $additional_contacts = [];
        while ($c_row = $res_c->fetch_assoc()) {
            $additional_contacts[] = $c_row;
        }

        // รวมข้อมูลเข้าด้วยกัน
        $customer['additional_contacts'] = $additional_contacts;

        echo json_encode(["status" => "success", "data" => $customer]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "ไม่พบข้อมูลลูกค้า"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "กรุณาระบุ ID"]);
}
?>