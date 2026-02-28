<?php
// ===================================================
// API: customers.php
// ครอบคลุม: GET (ดึงรายการ/รายบุคคล), POST (เพิ่ม), PUT (แก้ไข), DELETE (ลบ)
// ===================================================

ini_set('display_errors', 0);
error_reporting(E_ALL);

// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// เชื่อมต่อฐานข้อมูล
require '../condb.php';
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]);
    exit();
}

// ดึง Method และ ID จาก URL
$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

// ตรวจสอบ ID จาก PATH เช่น /customers.php/5
if (!$id) {
    $path_parts = explode('/', trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/'));
    foreach ($path_parts as $key => $part) {
        if ($part === 'customers.php' && isset($path_parts[$key + 1]) && is_numeric($path_parts[$key + 1])) {
            $id = intval($path_parts[$key + 1]);
        }
    }
}

// ===================================================
// ROUTE: GET - ดึงข้อมูลลูกค้า
// ===================================================
switch ($method) {

    case 'GET':
        if ($id) {
            // ดึงข้อมูลลูกค้ารายบุคคล
            $sql = "SELECT c.*, GROUP_CONCAT(
                        JSON_OBJECT(
                            'id', cc.id,
                            'contact_name', cc.contact_name,
                            'line_id', cc.line_id,
                            'phone_number', cc.phone_number,
                            'email', cc.email
                        )
                    ) as additional_contacts
                    FROM customers_admin c
                    LEFT JOIN customer_contacts_admin cc ON c.id = cc.customer_id
                    WHERE c.id = ?
                    GROUP BY c.id";

            $stmt = $conn->prepare($sql);
            if (!$stmt) {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
                exit();
            }

            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $row = $result->fetch_assoc();
                $row = formatCustomerRow($row);
                echo json_encode(["status" => "success", "data" => $row]);
            } else {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Customer not found"]);
            }
        } else {
            // ดึงข้อมูลลูกค้าทั้งหมด
            $search = isset($_GET['search']) ? $_GET['search'] : '';
            $status = isset($_GET['status']) ? $_GET['status'] : '';
            $sales_status = isset($_GET['sales_status']) ? $_GET['sales_status'] : '';
            $sales_owner = isset($_GET['sales_owner']) ? $_GET['sales_owner'] : '';

            $where_conditions = [];
            $params = [];
            $types = '';

            if (!empty($search)) {
                $like = '%' . $search . '%';
                $where_conditions[] = "(c.company_name LIKE ? OR c.contact_name LIKE ? OR c.billing_province LIKE ?)";
                $params[] = $like;
                $params[] = $like;
                $params[] = $like;
                $types .= 'sss';
            }
            if (!empty($status) && $status !== 'all') {
                $where_conditions[] = "c.customer_status = ?";
                $params[] = $status;
                $types .= 's';
            }
            if (!empty($sales_status) && $sales_status !== 'all') {
                $where_conditions[] = "c.sales_status = ?";
                $params[] = $sales_status;
                $types .= 's';
            }
            if (!empty($sales_owner) && $sales_owner !== 'all') {
                $where_conditions[] = "c.sales_owner = ?";
                $params[] = $sales_owner;
                $types .= 's';
            }

            $where_clause = count($where_conditions) > 0 ? "WHERE " . implode(" AND ", $where_conditions) : "";

            $sql = "SELECT c.* FROM customers_admin c $where_clause ORDER BY c.created_at DESC";

            if (!empty($params)) {
                $stmt = $conn->prepare($sql);
                $stmt->bind_param($types, ...$params);
                $stmt->execute();
                $result = $stmt->get_result();
            } else {
                $result = $conn->query($sql);
            }

            $customers = [];
            while ($row = $result->fetch_assoc()) {
                $customers[] = formatCustomerRow($row);
            }

            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $customers, "total" => count($customers)]);
        }
        break;

    // ===================================================
    // ROUTE: POST - เพิ่มลูกค้าใหม่
    // ===================================================
    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);

        if (empty($data['company_name']) || empty($data['contact_name'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ชื่อบริษัท และชื่อผู้ติดต่อ จำเป็นต้องกรอก"]);
            exit();
        }

        // เตรียมข้อมูล JSON
        $phone_numbers_json = json_encode($data['phone_numbers'] ?? []);
        $emails_json = json_encode($data['emails'] ?? []);
        $interested_products = is_array($data['interested_products'])
            ? implode(", ", $data['interested_products'])
            : ($data['interested_products'] ?? '');

        $last_contact_date = !empty($data['last_contact_date'])
            ? date('Y-m-d', strtotime($data['last_contact_date']))
            : date('Y-m-d');

        $next_action_date = !empty($data['next_action_date'])
            ? date('Y-m-d', strtotime($data['next_action_date']))
            : null;

        $sql = "INSERT INTO customers_admin 
            (company_name, customer_type, tax_id, business_type,
             billing_address, billing_subdistrict, billing_district, billing_province, billing_postcode,
             shipping_address, shipping_subdistrict, shipping_district, shipping_province, shipping_postcode, same_address,
             contact_name, phone_numbers, emails, line_id,
             presentation_status, sales_status, next_action, next_action_date, sales_owner,
             contact_count, last_contact_date, interested_products,
             responsible_person, customer_status, how_found_us, other_channel, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
            exit();
        }

        $company_name = $data['company_name'] ?? '';
        $customer_type = $data['customer_type'] ?? 'เจ้าของงาน';
        $tax_id = $data['tax_id'] ?? null;
        $business_type = $data['business_type'] ?? null;
        $billing_address = $data['billing_address'] ?? '';
        $billing_subdistrict = $data['billing_subdistrict'] ?? '';
        $billing_district = $data['billing_district'] ?? '';
        $billing_province = $data['billing_province'] ?? '';
        $billing_postcode = $data['billing_postcode'] ?? '';
        $shipping_address = $data['shipping_address'] ?? '';
        $shipping_subdistrict = $data['shipping_subdistrict'] ?? '';
        $shipping_district = $data['shipping_district'] ?? '';
        $shipping_province = $data['shipping_province'] ?? '';
        $shipping_postcode = $data['shipping_postcode'] ?? '';
        $same_address = isset($data['same_address']) ? (int) $data['same_address'] : 0;
        $contact_name = $data['contact_name'] ?? '';
        $line_id = $data['line_id'] ?? '';
        $presentation_status = $data['presentation_status'] ?? 'เสนอขาย';
        $sales_status = $data['sales_status'] ?? 'ใหม่';
        $next_action = $data['next_action'] ?? '';
        $sales_owner = $data['sales_owner'] ?? '';
        $contact_count = (int) ($data['contact_count'] ?? 1);
        $responsible_person = $data['responsible_person'] ?? '';
        $customer_status = $data['customer_status'] ?? 'ลูกค้าใหม่';
        $how_found_us = $data['how_found_us'] ?? '';
        $other_channel = $data['other_channel'] ?? '';
        $notes = $data['notes'] ?? '';

        // Type string must match exactly the 32 columns in INSERT
        // s=string, i=integer, d=double
        // company_name, customer_type, tax_id, business_type,
        // billing_address, billing_subdistrict, billing_district, billing_province, billing_postcode,
        // shipping_address, shipping_subdistrict, shipping_district, shipping_province, shipping_postcode, same_address(i),
        // contact_name, phone_numbers, emails, line_id,
        // presentation_status, sales_status, next_action, next_action_date, sales_owner,
        // contact_count(i), last_contact_date, interested_products,
        // responsible_person, customer_status, how_found_us, other_channel, notes
        $stmt->bind_param(
            "ssssssssssssssisssssssssisssssss",

            $company_name,
            $customer_type,
            $tax_id,
            $business_type,
            $billing_address,
            $billing_subdistrict,
            $billing_district,
            $billing_province,
            $billing_postcode,
            $shipping_address,
            $shipping_subdistrict,
            $shipping_district,
            $shipping_province,
            $shipping_postcode,
            $same_address,
            $contact_name,
            $phone_numbers_json,
            $emails_json,
            $line_id,
            $presentation_status,
            $sales_status,
            $next_action,
            $next_action_date,
            $sales_owner,
            $contact_count,
            $last_contact_date,
            $interested_products,
            $responsible_person,
            $customer_status,
            $how_found_us,
            $other_channel,
            $notes
        );

        if ($stmt->execute()) {
            $new_id = $conn->insert_id;

            // เพิ่มผู้ติดต่อเพิ่มเติม
            if (!empty($data['additional_contacts']) && is_array($data['additional_contacts'])) {
                $contact_sql = "INSERT INTO customer_contacts_admin (customer_id, contact_name, line_id, phone_number, email) VALUES (?, ?, ?, ?, ?)";
                $contact_stmt = $conn->prepare($contact_sql);
                foreach ($data['additional_contacts'] as $contact) {
                    if (!empty($contact['contact_name'])) {
                        $cn = $contact['contact_name'];
                        $cl = $contact['line_id'] ?? '';
                        $cp = $contact['phone_number'] ?? '';
                        $ce = $contact['email'] ?? '';
                        $contact_stmt->bind_param("issss", $new_id, $cn, $cl, $cp, $ce);
                        $contact_stmt->execute();
                    }
                }
            }

            // ดึงข้อมูลที่เพิ่งสร้าง
            $get_sql = "SELECT * FROM customers_admin WHERE id = ?";
            $get_stmt = $conn->prepare($get_sql);
            $get_stmt->bind_param("i", $new_id);
            $get_stmt->execute();
            $result = $get_stmt->get_result();
            $new_customer = formatCustomerRow($result->fetch_assoc());

            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "เพิ่มลูกค้าใหม่สำเร็จ", "data" => $new_customer]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $stmt->error]);
        }
        break;

    // ===================================================
    // ROUTE: PUT - แก้ไขข้อมูลลูกค้า
    // ===================================================
    case 'PUT':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ต้องระบุ customer ID"]);
            exit();
        }

        $data = json_decode(file_get_contents("php://input"), true);

        $update_fields = [];
        $params = [];
        $types = '';

        $allowed_fields = [
            'company_name' => 's',
            'customer_type' => 's',
            'tax_id' => 's',
            'business_type' => 's',
            'billing_address' => 's',
            'billing_subdistrict' => 's',
            'billing_district' => 's',
            'billing_province' => 's',
            'billing_postcode' => 's',
            'shipping_address' => 's',
            'shipping_subdistrict' => 's',
            'shipping_district' => 's',
            'shipping_province' => 's',
            'shipping_postcode' => 's',
            'same_address' => 'i',
            'contact_name' => 's',
            'line_id' => 's',
            'presentation_status' => 's',
            'sales_status' => 's',
            'next_action' => 's',
            'next_action_date' => 's',
            'sales_owner' => 's',
            'contact_count' => 'i',
            'last_contact_date' => 's',
            'interested_products' => 's',
            'responsible_person' => 's',
            'customer_status' => 's',
            'how_found_us' => 's',
            'other_channel' => 's',
            'notes' => 's',
            'total_orders' => 'i',
            'total_value' => 'd',
        ];

        foreach ($allowed_fields as $field => $type) {
            if (array_key_exists($field, $data)) {
                $update_fields[] = "$field = ?";
                if ($field === 'phone_numbers' || $field === 'emails') {
                    $params[] = json_encode($data[$field]);
                } elseif ($field === 'interested_products' && is_array($data[$field])) {
                    $params[] = implode(", ", $data[$field]);
                } else {
                    $params[] = $data[$field];
                }
                $types .= $type;
            }
        }

        // จัดการ phone_numbers และ emails (JSON)
        if (array_key_exists('phone_numbers', $data)) {
            $update_fields[] = "phone_numbers = ?";
            $params[] = json_encode($data['phone_numbers']);
            $types .= 's';
        }
        if (array_key_exists('emails', $data)) {
            $update_fields[] = "emails = ?";
            $params[] = json_encode($data['emails']);
            $types .= 's';
        }

        if (empty($update_fields)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ไม่มีข้อมูลที่จะแก้ไข"]);
            exit();
        }

        $params[] = $id;
        $types .= 'i';

        $sql = "UPDATE customers_admin SET " . implode(", ", $update_fields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
            exit();
        }
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            $get_sql = "SELECT * FROM customers_admin WHERE id = ?";
            $get_stmt = $conn->prepare($get_sql);
            $get_stmt->bind_param("i", $id);
            $get_stmt->execute();
            $result = $get_stmt->get_result();
            $updated = formatCustomerRow($result->fetch_assoc());
            echo json_encode(["status" => "success", "message" => "แก้ไขข้อมูลสำเร็จ", "data" => $updated]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $stmt->error]);
        }
        break;

    // ===================================================
    // ROUTE: DELETE - ลบลูกค้า
    // ===================================================
    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ต้องระบุ customer ID"]);
            exit();
        }

        $sql = "DELETE FROM customers_admin WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "ลบข้อมูลลูกค้าสำเร็จ"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $stmt->error]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}

$conn->close();

// ===================================================
// Helper: จัดรูปแบบข้อมูลลูกค้าก่อนส่งกลับ
// ===================================================
function formatCustomerRow($row)
{
    if (!$row)
        return null;

    // แปลง JSON string -> Array
    if (!empty($row['phone_numbers'])) {
        $decoded = json_decode($row['phone_numbers'], true);
        $row['phone_numbers'] = is_array($decoded) ? $decoded : [$row['phone_numbers']];
    } else {
        $row['phone_numbers'] = [];
    }

    if (!empty($row['emails'])) {
        $decoded = json_decode($row['emails'], true);
        $row['emails'] = is_array($decoded) ? $decoded : [$row['emails']];
    } else {
        $row['emails'] = [];
    }

    // แปลง interested_products -> Array
    if (!empty($row['interested_products'])) {
        $row['interested_products'] = array_map('trim', explode(",", $row['interested_products']));
    } else {
        $row['interested_products'] = [];
    }

    // แปลง additional_contacts (GROUP_CONCAT) -> Array
    if (!empty($row['additional_contacts'])) {
        $row['additional_contacts'] = json_decode("[" . $row['additional_contacts'] . "]", true);
    } else {
        $row['additional_contacts'] = [];
    }

    // แปลง numeric strings -> numbers
    $row['id'] = (int) $row['id'];
    $row['total_orders'] = (int) $row['total_orders'];
    $row['total_value'] = (float) $row['total_value'];
    $row['contact_count'] = (int) $row['contact_count'];
    $row['same_address'] = (bool) $row['same_address'];

    return $row;
}
?>