<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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
    // 1. Get Monthly Revenue Data for Charts (Last 12 months)
    $chartData = [];
    for ($i = 11; $i >= 0; $i--) {
        $monthStr = date('Y-m', strtotime("-$i months"));
        $monthLabel = date('M', strtotime($monthStr));

        // Map to Thai month labels to match frontend
        $thMonths = ["Jan" => "ม.ค.", "Feb" => "ก.พ.", "Mar" => "มี.ค.", "Apr" => "เม.ย.", "May" => "พ.ค.", "Jun" => "มิ.ย.", "Jul" => "ก.ค.", "Aug" => "ส.ค.", "Sep" => "ก.ย.", "Oct" => "ต.ค.", "Nov" => "พ.ย.", "Dec" => "ธ.ค."];
        $label = $thMonths[$monthLabel] ?? $monthLabel;

        $sql = "SELECT 
                    SUM(`total_amount`) as actual,
                    SUM(CASE WHEN `product_category` = 'สั่งผลิตภายนอก' OR `product_category` = 'สั่งผลิตภายใน' THEN `total_amount` ELSE 0 END) as custom,
                    SUM(CASE WHEN `product_category` = 'สินค้าสำเร็จรูป' THEN `total_amount` ELSE 0 END) as readymade
                FROM `orders` 
                WHERE `order_date` LIKE '$monthStr%'";
        $res = $conn->query($sql);
        $row = $res->fetch_assoc();

        $chartData[] = [
            "month" => $label,
            "actual" => (float) ($row['actual'] ?? 0),
            "target" => 500000, // Static target for now
            "custom" => (float) ($row['custom'] ?? 0),
            "readymade" => (float) ($row['readymade'] ?? 0)
        ];
    }

    // 2. Get Orders Data
    $ordersSql = "SELECT * FROM `orders` ORDER BY `order_date` DESC LIMIT 200";
    $result = $conn->query($ordersSql);
    $orders = [];

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $total = (float) $row['total_amount'];
            $paid = (float) $row['paid_amount'];
            $outstanding = $total - $paid;

            $orders[] = [
                "id" => "ORD-" . date('Y', strtotime($row['order_date'])) . "-" . str_pad($row['order_id'], 3, '0', STR_PAD_LEFT),
                "orderType" => $row['product_category'] ?: "ไม่มีข้อมูล",
                "quotationNo" => $row['quotation_number'] ?: "-",
                "customerName" => $row['customer_name'] ?: "ไม่ระบุชื่อ",
                "lineId" => $row['customer_line'] ?: "-",
                "address" => $row['customer_address'] ?: "-",
                "phone" => $row['customer_phone'] ?: "-",
                "email" => $row['customer_email'] ?: "-",
                "orderDate" => date('Y-m-d', strtotime($row['order_date'])),
                "usageDate" => $row['usage_date'] ?: "-",
                "deliveryDate" => $row['delivery_date'] ?: "-",
                "deliveryMethod" => $row['delivery_method'] ?: "-",
                "taxInvoice" => (bool) $row['needs_tax_invoice'],
                "companyName" => $row['tax_payer_name'],
                "taxId" => $row['tax_id'],
                "jobName" => $row['job_name'] ?: "โปรเจกต์งาน",
                "jobType" => $row['product_type'] ?: "ทั่วไป",
                "tags" => "#งานระบบ",
                "totalAmount" => $total,
                "paidAmount" => $paid,
                "outstandingAmount" => $outstanding,
                "paymentStatus" => $row['payment_status'] ?: "รอชำระเงิน",
                "isClosed" => ($row['order_status'] === 'ปิดงาน' || $row['order_status'] === 'จัดส่งครบแล้ว'),
                "urgency" => $row['urgency_level'] ?: "ปกติ",
                "orderChannel" => $row['sales_channel'] ?: "Direct",
                "shippingFee" => (float) ($row['delivery_cost'] ?? 0),
                "productionStatus" => $row['status']
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "chartData" => $chartData,
            "orders" => $orders
        ]
    ]);
}

$conn->close();
?>