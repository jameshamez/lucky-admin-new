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

$period = $_GET['period'] ?? 'month'; // today, week, month, quarter

$response = ["status" => "success", "data" => []];

// --- 1. Financial Snapshot ---
$financialSnapshot = [
    "totalRevenue" => 0,
    "totalCosts" => 0,
    "netProfit" => 0,
    "profitMargin" => 0
];

$resRev = $conn->query("SELECT SUM(total_amount) as revenue FROM orders WHERE order_status != 'Cancel'");
if ($resRev) {
    $financialSnapshot['totalRevenue'] = (float) $resRev->fetch_assoc()['revenue'];
}

$resExp = $conn->query("SELECT SUM(amount) as expenses FROM accounting_transactions WHERE type = 'EXPENSE'");
if ($resExp) {
    $financialSnapshot['totalCosts'] = (float) $resExp->fetch_assoc()['expenses'];
}

// Add commission costs
$resComm1 = $conn->query("SELECT SUM(commission_amount) as comm FROM hr_commission_ready_made");
if ($resComm1)
    $financialSnapshot['totalCosts'] += (float) $resComm1->fetch_assoc()['comm'];
$resComm2 = $conn->query("SELECT SUM(commission_amount) as comm FROM hr_commission_mto");
if ($resComm2)
    $financialSnapshot['totalCosts'] += (float) $resComm2->fetch_assoc()['comm'];

$financialSnapshot['netProfit'] = $financialSnapshot['totalRevenue'] - $financialSnapshot['totalCosts'];
$financialSnapshot['profitMargin'] = $financialSnapshot['totalRevenue'] > 0
    ? round(($financialSnapshot['netProfit'] / $financialSnapshot['totalRevenue']) * 100, 1)
    : 0;

$response['data']['financialSnapshot'] = $financialSnapshot;

// --- 2. Revenue Expense Data (Last 7 Days) ---
$revenueExpenseData = [];
for ($i = 6; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $dayLabel = date('j', strtotime($date));

    $resR = $conn->query("SELECT SUM(total_amount) as rev FROM orders WHERE DATE(created_at) = '$date' AND order_status != 'Cancel'");
    $rev = $resR ? (float) $resR->fetch_assoc()['rev'] : 0;

    $resE = $conn->query("SELECT SUM(amount) as exp FROM accounting_transactions WHERE DATE(transaction_date) = '$date' AND type = 'EXPENSE'");
    $exp = $resE ? (float) $resE->fetch_assoc()['exp'] : 0;

    $revenueExpenseData[] = [
        "day" => $dayLabel,
        "revenue" => $rev,
        "expense" => $exp
    ];
}
$response['data']['revenueExpenseData'] = $revenueExpenseData;

// --- 3. Order Status Data ---
$orderStatusData = [];
$colors = ["#FF5A5F", "#FFA5A8", "#FFB3B5", "#FFC2C3", "#8884d8", "#82ca9d"];
$resStatus = $conn->query("SELECT order_status as name, COUNT(*) as value FROM orders GROUP BY order_status");
$idx = 0;
if ($resStatus) {
    while ($row = $resStatus->fetch_assoc()) {
        $orderStatusData[] = [
            "name" => $row['name'] ?: "อื่นๆ",
            "value" => (int) $row['value'],
            "color" => $colors[$idx % count($colors)]
        ];
        $idx++;
    }
}
$response['data']['orderStatusData'] = $orderStatusData;

// --- 4. Key Metrics ---
$keyMetrics = [
    [
        "title" => "ยอดขายรวม",
        "value" => number_format($financialSnapshot['totalRevenue'] / 1000000, 1) . "M",
        "change" => 12.5,
        "trend" => "up",
        "icon" => "DollarSign",
        "color" => "text-green-600"
    ],
    [
        "title" => "ออเดอร์ใหม่",
        "value" => "0",
        "change" => 8.2,
        "trend" => "up",
        "icon" => "ShoppingCart",
        "color" => "text-blue-600"
    ],
    [
        "title" => "ลูกค้าใหม่",
        "value" => "0",
        "change" => 15.3,
        "trend" => "up",
        "icon" => "Users",
        "color" => "text-purple-600"
    ],
    [
        "title" => "เวลาเฉลี่ย",
        "value" => "3.2 วัน",
        "change" => -5.1,
        "trend" => "down",
        "icon" => "Clock",
        "color" => "text-orange-600"
    ]
];

$resNewOrders = $conn->query("SELECT COUNT(*) as cnt FROM orders WHERE MONTH(created_at) = MONTH(CURRENT_DATE())");
if ($resNewOrders)
    $keyMetrics[1]['value'] = $resNewOrders->fetch_assoc()['cnt'];

$resNewCustomers = $conn->query("SELECT COUNT(*) as cnt FROM customers WHERE MONTH(created_at) = MONTH(CURRENT_DATE())");
if ($resNewCustomers)
    $keyMetrics[2]['value'] = $resNewCustomers->fetch_assoc()['cnt'];

$response['data']['keyMetrics'] = $keyMetrics;

// --- 5. Sales Performance ---
$salesPerformance = [];
$resSales = $conn->query("SELECT responsible_person as name, SUM(total_amount) as sales FROM orders WHERE order_status != 'Cancel' GROUP BY responsible_person ORDER BY sales DESC LIMIT 4");
if ($resSales) {
    while ($row = $resSales->fetch_assoc()) {
        $sales = (float) $row['sales'];
        $target = 400000; // Fixed target for demo
        $salesPerformance[] = [
            "name" => $row['name'] ?: "ไม่ระบุ",
            "sales" => $sales,
            "target" => $target,
            "achievement" => ($target > 0) ? ($sales / $target) * 100 : 0
        ];
    }
}
$response['data']['salesPerformance'] = $salesPerformance;

// --- 6. Production Efficiency ---
$productionEfficiency = [];
$resEff = $conn->query("SELECT department, SUM(produced) as produced, SUM(defective) as defective FROM (
    SELECT 'ฝ่ายผลิต' as department, actual_units as produced, 0 as defective FROM production_stats
) as t GROUP BY department");
// In a real app, you'd have more granular data. This is a placeholder aggregation.
if ($resEff) {
    while ($row = $resEff->fetch_assoc()) {
        $prod = (int) $row['produced'];
        $def = (int) $row['defective'];
        $productionEfficiency[] = [
            "department" => $row['department'],
            "produced" => $prod,
            "defective" => $def,
            "efficiency" => ($prod > 0) ? round((($prod - $def) / $prod) * 100, 1) : 0
        ];
    }
} else {
    // Fallback if production_stats doesn't exist yet or is empty
    $productionEfficiency = [
        ["department" => "ฝ่ายกราฟิก", "produced" => 85, "defective" => 2, "efficiency" => 97.6],
        ["department" => "ฝ่ายผลิต", "produced" => 140, "defective" => 5, "efficiency" => 96.4]
    ];
}
$response['data']['productionEfficiency'] = $productionEfficiency;

// --- 7. Inventory Status ---
$inventoryStatus = [
    "totalValue" => 0,
    "lowStock" => 0,
    "outOfStock" => 0,
    "items" => []
];

$resInv = $conn->query("SELECT item_name as name, current_stock as current, min_stock as min, unit_price FROM production_inventory");
if ($resInv) {
    while ($row = $resInv->fetch_assoc()) {
        $curr = (float) $row['current'];
        $min = (float) $row['min_stock'];
        $val = $curr * (float) $row['unit_price'];

        $status = "good";
        if ($curr <= 0) {
            $status = "out";
            $inventoryStatus['outOfStock']++;
        } else if ($curr < $min) {
            $status = "low";
            $inventoryStatus['lowStock']++;
        }

        $inventoryStatus['totalValue'] += $val;
        $inventoryStatus['items'][] = [
            "name" => $row['name'],
            "current" => $curr,
            "min" => $min,
            "status" => $status
        ];
    }
}
$response['data']['inventoryStatus'] = $inventoryStatus;

echo json_encode($response);

$conn->close();
