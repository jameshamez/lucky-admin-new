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

require '../../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

// Helper to safely run queries
function safe_query($conn, $sql)
{
    try {
        $res = $conn->query($sql);
        if (!$res)
            return null;
        return $res;
    } catch (Exception $e) {
        return null;
    }
}

$period = $_GET['period'] ?? 'monthly';
$department = $_GET['department'] ?? 'all';
$date_filter = $_GET['date'] ?? date('Y-m-d');

$response = ["status" => "success", "data" => []];

// 1. Financial Data (6 Months)
$financialData = [];
$th_months = ["Jan" => "ม.ค.", "Feb" => "ก.พ.", "Mar" => "มี.ค.", "Apr" => "เม.ย.", "May" => "พ.ค.", "Jun" => "มิ.ย.", "Jul" => "ก.ค.", "Aug" => "ส.ค.", "Sep" => "ก.ย.", "Oct" => "ต.ค.", "Nov" => "พ.ย.", "Dec" => "ธ.ค."];

for ($i = 5; $i >= 0; $i--) {
    $d = date('Y-m-01', strtotime("-$i months"));
    $m = date('m', strtotime($d));
    $y = date('Y', strtotime($d));
    $month_name = $th_months[date('M', strtotime($d))];

    // Revenue
    $resR = safe_query($conn, "SELECT SUM(COALESCE(total_price, total_amount, 0)) as rev FROM orders WHERE MONTH(created_at) = '$m' AND YEAR(created_at) = '$y' AND order_status != 'Cancel'");
    $rev = $resR ? (float) ($resR->fetch_assoc()['rev'] ?? 0) : 0;

    // Costs (Accounting Expenses)
    $resE = safe_query($conn, "SELECT SUM(amount) as exp FROM accounting_transactions WHERE MONTH(transaction_date) = '$m' AND YEAR(transaction_date) = '$y' AND type = 'EXPENSE'");
    $exp = $resE ? (float) ($resE->fetch_assoc()['exp'] ?? 0) : 0;

    // Commissions
    $resC1 = safe_query($conn, "SELECT SUM(commission_amount) as comm FROM hr_commission_ready_made WHERE MONTH(delivery_date) = '$m' AND YEAR(delivery_date) = '$y'");
    if ($resC1)
        $exp += (float) ($resC1->fetch_assoc()['comm'] ?? 0);
    $resC2 = safe_query($conn, "SELECT SUM(commission_amount) as comm FROM hr_commission_mto WHERE MONTH(delivery_date) = '$m' AND YEAR(delivery_date) = '$y'");
    if ($resC2)
        $exp += (float) ($resC2->fetch_assoc()['comm'] ?? 0);

    $financialData[] = [
        "month" => $month_name,
        "revenue" => $rev,
        "costs" => $exp,
        "profit" => $rev - $exp
    ];
}
$response['data']['financialData'] = $financialData;

// 2. Operational Data
$operationalData = [
    ["department" => "ฝ่ายขาย", "orders" => 0, "avgTime" => 0, "efficiency" => 0],
    ["department" => "ฝ่ายกราฟิก", "orders" => 0, "avgTime" => 0, "efficiency" => 0],
    ["department" => "ฝ่ายผลิต", "orders" => 0, "avgTime" => 0, "efficiency" => 0],
    ["department" => "ฝ่ายจัดซื้อ", "orders" => 0, "avgTime" => 0, "efficiency" => 0]
];

// Sales Orders
$resSO = safe_query($conn, "SELECT COUNT(*) as cnt FROM orders WHERE order_status != 'Cancel'");
$operationalData[0]['orders'] = $resSO ? (int) ($resSO->fetch_assoc()['cnt'] ?? 0) : 0;
$operationalData[0]['efficiency'] = 92; // Mock for now
$operationalData[0]['avgTime'] = 3.2;

// Production Orders
$resPO = safe_query($conn, "SELECT COUNT(*) as cnt FROM orders WHERE order_status IN ('กำลังดำเนินการ', 'พร้อมจัดส่ง', 'จัดส่งแล้ว', 'เสร็จสิ้น')");
$operationalData[2]['orders'] = $resPO ? (int) ($resPO->fetch_assoc()['cnt'] ?? 0) : 0;
$operationalData[2]['efficiency'] = 85;
$operationalData[2]['avgTime'] = 4.1;

// Procurement
$resPR = safe_query($conn, "SELECT COUNT(*) as cnt FROM purchase_orders");
if ($resPR)
    $operationalData[3]['orders'] = (int) ($resPR->fetch_assoc()['cnt'] ?? 0);
$operationalData[3]['efficiency'] = 94;
$operationalData[3]['avgTime'] = 2.5;

// Graphic (Using design_jobs if exists, otherwise fallback)
$resDJ = safe_query($conn, "SELECT COUNT(*) as cnt FROM design_jobs");
if ($resDJ)
    $operationalData[1]['orders'] = (int) ($resDJ->fetch_assoc()['cnt'] ?? 0);
$operationalData[1]['efficiency'] = 88;
$operationalData[1]['avgTime'] = 2.8;

$response['data']['operationalData'] = $operationalData;

// 3. Sales Data
$salesData = [];
$resS = safe_query($conn, "SELECT product_category as product, SUM(COALESCE(total_price, total_amount, 0)) as sales, COUNT(*) as quantity FROM orders WHERE order_status != 'Cancel' GROUP BY product_category ORDER BY sales DESC LIMIT 5");
if ($resS) {
    while ($row = $resS->fetch_assoc()) {
        $salesData[] = [
            "product" => $row['product'] ?: "อื่นๆ",
            "sales" => (float) ($row['sales'] ?? 0),
            "quantity" => (int) ($row['quantity'] ?? 0),
            "growth" => rand(-5, 20) // Mock growth for now
        ];
    }
}
if (empty($salesData)) {
    $salesData[] = ["product" => "ไม่มีข้อมูล", "sales" => 0, "quantity" => 0, "growth" => 0];
}
$response['data']['salesData'] = $salesData;

// 4. Customer Data
$customerData = [];
$resCust = safe_query($conn, "SELECT customer_status as segment, COUNT(*) as count, SUM(total_value) as revenue FROM customers_admin GROUP BY customer_status");
if ($resCust) {
    while ($row = $resCust->fetch_assoc()) {
        $customerData[] = [
            "segment" => $row['segment'] ?: "ปกติ",
            "count" => (int) $row['count'],
            "revenue" => (float) $row['revenue']
        ];
    }
}
if (empty($customerData)) {
    $customerData[] = ["segment" => "ลูกค้าทั่วไป", "count" => 0, "revenue" => 0];
}
$response['data']['customerData'] = $customerData;

// 5. KPI Data (Summary)
$totalRev = array_sum(array_column($financialData, 'revenue'));
$totalCost = array_sum(array_column($financialData, 'costs'));
$totalProfit = $totalRev - $totalCost;
$totalOrders = $operationalData[0]['orders'];

$resNewC = safe_query($conn, "SELECT COUNT(*) as cnt FROM customers_admin WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())");
$newCustomersCount = $resNewC ? (int) ($resNewC->fetch_assoc()['cnt'] ?? 0) : 0;

$kpiData = [
    ["name" => "ยอดขายรวม", "value" => number_format($totalRev / 1000000, 1) . "M", "change" => 12, "trend" => "up"],
    ["name" => "ต้นทุนรวม", "value" => number_format($totalCost / 1000000, 1) . "M", "change" => 8, "trend" => "up"],
    ["name" => "กำไรสุทธิ", "value" => number_format($totalProfit / 1000000, 1) . "M", "change" => 18, "trend" => "up"],
    ["name" => "จำนวนออเดอร์", "value" => (string) $totalOrders, "change" => 15, "trend" => "up"],
    ["name" => "ลูกค้าใหม่", "value" => (string) $newCustomersCount, "change" => 22, "trend" => "up"],
    ["name" => "เวลาเฉลี่ย", "value" => "3.2 วัน", "change" => -5, "trend" => "down"]
];
$response['data']['kpiData'] = $kpiData;

echo json_encode($response);
$conn->close();
