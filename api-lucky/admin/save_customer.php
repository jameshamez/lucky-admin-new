<?php
// 1. ตั้งค่า Header สำหรับ CORS ให้ครบถ้วน
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// 2. จัดการคำขอแบบ OPTIONS (สำคัญมากสำหรับ Web Browser)
// เมื่อ Browser ส่งคำขอมาเช็ค (Preflight) ให้ตอบกลับ 200 ทันที
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. เชื่อมต่อฐานข้อมูล (ใช้ไฟล์เดิมของคุณ)
require '../condb.php';
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

// 4. รับข้อมูล JSON
$data = json_decode(file_get_contents("php://input"));

// ตรวจสอบว่ามีข้อมูลส่งมาจริงหรือไม่
if (!$data) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ไม่ได้รับข้อมูล JSON"]);
    exit();
}

if (!empty($data->companyName) && !empty($data->contactName)) {

    // เริ่ม Transaction
    $conn->begin_transaction();

    try {
        $main_id = bin2hex(random_bytes(18));

        $query = "INSERT INTO customers_admin (
                    id, company_name, customer_type, tax_id, 
                    billing_province, billing_district, billing_subdistrict, billing_postcode, billing_address,
                    shipping_province, shipping_district, shipping_subdistrict, shipping_postcode, shipping_address,
                    contact_name, line_id, phone_numbers, emails, 
                    presentation_status, interested_products, responsible_person, 
                    customer_status, how_found_us, other_channel, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($query);

        $phone_json = json_encode($data->phoneNumbers ?? []);
        $email_json = json_encode($data->emails ?? []);
        $products_str = is_array($data->interestedProducts) ? implode(", ", $data->interestedProducts) : "";

        $stmt->bind_param(
            "sssssssssssssssssssssssss",
            $main_id,
            $data->companyName,
            $data->customerType,
            $data->taxId,
            $data->billingProvince,
            $data->billingDistrict,
            $data->billingSubdistrict,
            $data->billingPostcode,
            $data->billingAddress,
            $data->shippingProvince,
            $data->shippingDistrict,
            $data->shippingSubdistrict,
            $data->shippingPostcode,
            $data->shippingAddress,
            $data->contactName,
            $data->lineId,
            $phone_json,
            $email_json,
            $data->presentationStatus,
            $products_str,
            $data->responsiblePerson,
            $data->customerStatus,
            $data->howFoundUs,
            $data->otherChannel,
            $data->notes
        );

        $stmt->execute();

        if (!empty($data->additionalContacts)) {
            $contact_query = "INSERT INTO customer_admin_contacts (id, customer_id, contact_name, line_id, phone_number, email) VALUES (?, ?, ?, ?, ?, ?)";
            $contact_stmt = $conn->prepare($contact_query);

            foreach ($data->additionalContacts as $contact) {
                $c_id = bin2hex(random_bytes(18));
                $contact_stmt->bind_param(
                    "ssssss",
                    $c_id,
                    $main_id,
                    $contact->contactName,
                    $contact->lineId,
                    $contact->phoneNumber,
                    $contact->email
                );
                $contact_stmt->execute();
            }
        }

        $conn->commit();
        echo json_encode(["status" => "success", "message" => "บันทึกข้อมูลเรียบร้อยแล้ว"]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }

} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ข้อมูลไม่ครบถ้วน: กรุณาระบุชื่อบริษัทและชื่อผู้ติดต่อ"]);
}
?>