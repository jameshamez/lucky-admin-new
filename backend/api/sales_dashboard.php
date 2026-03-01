<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

set_exception_handler(function ($e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage(),
        "file" => basename($e->getFile()),
        "line" => $e->getLine()
    ]);
    exit();
});

require '../condb.php';
/** @var mysqli $conn */

// Database Selection
$db_options = ['finfinph_lcukycompany', 'finfinph_luckycompany'];
foreach ($db_options as $db) {
    if (@$conn->select_db($db))
        break;
}
$conn->set_charset("utf8mb4");

// Dynamic Column Detection
function getOrderRevenueColumn($conn)
{
    $res = $conn->query("SHOW COLUMNS FROM orders");
    $cols = [];
    while ($row = $res->fetch_assoc())
        $cols[] = strtolower($row['Field']);
    if (in_array('total_amount', $cols))
        return 'total_amount';
    if (in_array('total_price', $cols))
        return 'total_price';
    return 'subtotal';
}

$rev_col = getOrderRevenueColumn($conn);
$response = ["status" => "success", "data" => []];

// 1. Dashboard Monthly Summary
$current_month = date('Y-m');
$summary_sql = "SELECT 
                    SUM(COALESCE($rev_col, 0)) as current_revenue,
                    SUM(COALESCE(paid_amount, 0)) as real_revenue,
                    COUNT(*) as total_orders
                FROM orders 
                WHERE order_date LIKE '$current_month%'";
$summary = $conn->query($summary_sql)->fetch_assoc();

// Target calculation
$target_sql = "SELECT SUM(target_amount) as target FROM sales_targets WHERE period_value LIKE '$current_month%'";
$target_res = $conn->query($target_sql)->fetch_assoc();
$target_amount = (float) ($target_res['target'] ?? 2000000);

$current_rev = (float) ($summary['current_revenue'] ?? 0);
$real_rev = (float) ($summary['real_revenue'] ?? 0);

$response['data']['dashboardSummary'] = [
    "current" => $current_rev,
    "target" => $target_amount,
    "percentage" => $target_amount > 0 ? round(($current_rev / $target_amount) * 100) : 0,
    "realRevenue" => $real_rev,
    "pendingRevenue" => $current_rev - $real_rev,
    "totalOrders" => (int) $summary['total_orders']
];

// 2. Pipeline Status Counts
$status_counts_sql = "SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status";
$res = $conn->query($status_counts_sql);
$status_map = [];
while ($row = $res->fetch_assoc()) {
    $status_map[$row['order_status']] = (int) $row['count'];
}

$response['data']['pipelineStats'] = [
    "estimate" => $status_map['ประเมินราคา'] ?? 0,
    "quotation" => $status_map['ใบเสนอราคา'] ?? 0,
    "pendingDeposit" => $status_map['รอชำระมัดจำ'] ?? 0,
    "graphicDesign" => $status_map['รอออกแบบ'] ?? 0,
    "production" => $status_map['กำลังผลิต'] ?? 0,
    "qcReadyToShip" => $status_map['ตรวจสอบคุณภาพ'] ?? 0,
    "completed" => $status_map['จัดส่งสำเร็จ'] ?? 0
];

// 3. Urgent Orders
$urgent_sql = "SELECT 
                job_id as id, customer_name as customer, job_name as mainItem, 
                delivery_date, order_status as reason,
                DATEDIFF(CURDATE(), delivery_date) as overdueDays
               FROM orders 
               WHERE order_status != 'จัดส่งสำเร็จ' 
               AND (delivery_date <= DATE_ADD(CURDATE(), INTERVAL 1 DAY) OR delivery_date IS NULL)
               ORDER BY delivery_date ASC LIMIT 10";
$res = $conn->query($urgent_sql);
$urgentOrders = [];
while ($row = $res->fetch_assoc()) {
    $days = (int) $row['overdueDays'];
    $row['dueDateType'] = $days > 0 ? 'overdue' : ($days == 0 ? 'today' : 'tomorrow');
    $row['dueDate'] = $days > 0 ? "เกินกำหนด" : ($days == 0 ? "วันนี้" : "พรุ่งนี้");
    $urgentOrders[] = $row;
}
$response['data']['urgentOrders'] = $urgentOrders;

// 4. Jobs By Status Details
$status_keys = [
    'ประเมินราคา' => 'estimate',
    'ใบเสนอราคา' => 'quotation',
    'รอชำระมัดจำ' => 'pendingDeposit',
    'รอออกแบบ' => 'graphicDesign',
    'กำลังผลิต' => 'production',
    'ตรวจสอบคุณภาพ' => 'qcReadyToShip',
    'จัดส่งสำเร็จ' => 'completed'
];

$jobs_by_status = [];
foreach ($status_keys as $db_status => $key) {
    $sql = "SELECT job_id as jobId, order_date as orderDate, sales_channel as salesChannel, 
            customer_line as lineName, customer_name as customerName, job_name as product, 
            delivery_date as deliveryDate 
            FROM orders WHERE order_status = '$db_status' ORDER BY order_date DESC LIMIT 15";
    $job_res = $conn->query($sql);
    $jobs_by_status[$key] = [];
    while ($j = $job_res->fetch_assoc())
        $jobs_by_status[$key][] = $j;
}
$response['data']['jobsByStatus'] = $jobs_by_status;

// 5. Sales Trend (Chart)
$trend_sql = "SELECT DATE_FORMAT(order_date, '%b') as month, SUM(COALESCE($rev_col, 0)) as revenue 
              FROM orders GROUP BY YEAR(order_date), MONTH(order_date) 
              ORDER BY YEAR(order_date) DESC, MONTH(order_date) DESC LIMIT 6";
$res = $conn->query($trend_sql);
$trend = [];
while ($row = $res->fetch_assoc())
    $trend[] = ["name" => $row['month'], "revenue" => (float) $row['revenue']];
$response['data']['salesTrend'] = array_reverse($trend);

echo json_encode($response);
$conn->close();
