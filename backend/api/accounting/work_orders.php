<?php
ini_set('display_errors', 0); // Turn off for production-like behavior, but we have error handling
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Corrected query using actual column names from schema
    $sql = "SELECT `order_id`, `job_id`, `customer_name`, `job_name`, `order_date`, `delivery_date`, `total_amount`, `paid_amount`, `order_status`, `responsible_person`,
            (SELECT SUM(`quantity`) FROM `order_items` WHERE `order_items`.`order_id` = `orders`.`order_id`) as `total_qty`
            FROM `orders`
            ORDER BY `order_date` DESC LIMIT 100";
    $result = $conn->query($sql);

    if (!$result) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $conn->error]);
        exit();
    }

    $workOrders = [];
    while ($row = $result->fetch_assoc()) {
        $real_id = $row['order_id'];
        $revenue = (float) $row['total_amount'];
        $paid = (float) $row['paid_amount'];
        $expense = $revenue * 0.65;
        $orderDate = $row['order_date'];

        $status = $row['order_status'];
        $workStatus = "กำลังดำเนินการ";
        if ($status === 'จัดส่งครบแล้ว' || $status === 'ปิดงาน') {
            $workStatus = "ปิดงาน";
        } elseif ($status === 'ยืนยันคำสั่งซื้อ' || $status === 'ตรวจสอบแล้ว') {
            $workStatus = "ตรวจสอบแล้ว";
        }

        $workOrders[] = [
            "id" => "WO-" . date('Y', strtotime($orderDate)) . "-" . str_pad($real_id, 3, '0', STR_PAD_LEFT),
            "jobId" => $row['job_id'] ?: "JOB-" . $real_id,
            "customer" => $row['customer_name'] ?: "ไม่ระบุชื่อลูกค้า",
            "project" => $row['job_name'] ?: "โปรเจกต์งาน",
            "factory" => "ทั่วไป",
            "prIssueDate" => date('Y-m-d', strtotime($orderDate)),
            "shipmentDate" => $row['delivery_date'] ?: date('Y-m-d', strtotime($orderDate)),
            "quantity" => (int) ($row['total_qty'] ?? 0),
            "revenue" => $revenue,
            "expense" => $expense,
            "stockStatus" => "ครบ",
            "workStatus" => $workStatus,
            "assignedBy" => $row['responsible_person'] ?: "Admin",
            "revenueItems" => [
                ["desc" => "ค่าสินค้าตามออเดอร์", "amount" => $revenue, "status" => ($paid >= $revenue ? "ชำระแล้ว" : "ค้างชำระ")]
            ],
            "expenseItems" => [
                ["desc" => "ต้นทุนสินค้าประเมิน", "amount" => $expense, "status" => "ตั้งเบิกแล้ว"]
            ],
            "stockSold" => [],
            "stockDeducted" => [],
            "attachments" => [],
            "notes" => ""
        ];
    }

    echo json_encode(["status" => "success", "data" => $workOrders]);
} elseif ($method === 'POST' || $method === 'PUT') {
    $input = json_decode(file_get_contents("php://input"), true);
    if (isset($input['id']) && isset($input['status'])) {
        // Extract numeric ID from WO-XXXX-YYY
        $parts = explode('-', $input['id']);
        $real_id = intval(end($parts));

        $status = $input['status'];
        // Updated WHERE clause to use order_id
        $sql = "UPDATE `orders` SET `order_status` = ? WHERE `order_id` = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $status, $real_id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Work order status updated"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    }
}

$conn->close();
?>