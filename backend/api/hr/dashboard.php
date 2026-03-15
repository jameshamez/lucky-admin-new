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

$month = isset($_GET['month']) ? intval($_GET['month']) : intval(date('m'));
$year = isset($_GET['year']) ? intval($_GET['year']) : intval(date('Y'));

$selectedDate = sprintf("%04d-%02d", $year, $month);

// 1. Monthly Sales Total
$salesQuery = "SELECT SUM(total_amount) as total FROM `orders` WHERE order_date LIKE '$selectedDate%' AND order_status != 'ยกเลิก'";
$salesRes = $conn->query($salesQuery);
$salesTotal = (float)($salesRes->fetch_assoc()['total'] ?? 0);

// 2. Mocking/Calculating Commissions (Heuristic approach based on item_type)
// In a real system, you'd join with commission rules, but we'll use a data-driven approach based on item_type
$commQuery = "SELECT 
    o.responsible_person as name,
    SUM(CASE WHEN oi.item_type = 'custom' OR oi.item_type = 'made-to-order' THEN oi.total_price_item ELSE 0 END) as mto_sales,
    SUM(CASE WHEN oi.item_type != 'custom' AND oi.item_type != 'made-to-order' THEN oi.total_price_item ELSE 0 END) as rm_sales,
    SUM(oi.total_price_item) as total_sales
    FROM `orders` o
    JOIN `order_items` oi ON o.order_id = oi.order_id
    WHERE o.order_date LIKE '$selectedDate%' AND o.order_status != 'ยกเลิก'
    GROUP BY o.responsible_person
    ORDER BY total_sales DESC";

$commRes = $conn->query($commQuery);

$top5 = [];
$totalRM = 0;
$totalMTO = 0;
$rank = 1;

if ($commRes) {
    while ($row = $commRes->fetch_assoc()) {
        // Approssimate commission: RM = 2%, MTO = 5% (Example heuristic)
        // Or we could return raw sales data and let frontend handle exact config rules
        // To strictly replace mock, we'll return approximate comm values
        $rmComm = $row['rm_sales'] * 0.02; 
        $mtoComm = $row['mto_sales'] * 0.05;
        
        $totalRM += $rmComm;
        $totalMTO += $mtoComm;

        if ($rank <= 5) {
            $top5[] = [
                "rank" => $rank,
                "name" => $row['name'] ?: "ไม่ระบุพนักงาน",
                "readyMade" => round($rmComm, 2),
                "madeToOrder" => round($mtoComm, 2),
                "total" => round($rmComm + $mtoComm, 2)
            ];
        }
        $rank++;
    }
}

// 3. Monthly Trend (Last 6 months)
$trend = [];
for ($i = 5; $i >= 0; $i--) {
    $d = date('Y-m', strtotime("-$i months", strtotime("$selectedDate-01")));
    $tRes = $conn->query("SELECT 
        SUM(CASE WHEN oi.item_type = 'custom' OR oi.item_type = 'made-to-order' THEN oi.total_price_item ELSE 0 END) as mto,
        SUM(CASE WHEN oi.item_type != 'custom' AND oi.item_type != 'made-to-order' THEN oi.total_price_item ELSE 0 END) as rm
        FROM `orders` o
        JOIN `order_items` oi ON o.order_id = oi.order_id
        WHERE o.order_date LIKE '$d%' AND o.order_status != 'ยกเลิก'");
    $tRow = $tRes->fetch_assoc();
    
    $trend[$d] = [
        "readyMade" => round(($tRow['rm'] ?? 0) * 0.02, 2),
        "madeToOrder" => round(($tRow['mto'] ?? 0) * 0.05, 2)
    ];
}

echo json_encode([
    "status" => "success",
    "data" => [
        "sales" => $salesTotal,
        "readyMade" => round($totalRM, 2),
        "madeToOrder" => round($totalMTO, 2),
        "top5" => $top5,
        "trend" => $trend
    ]
]);

$conn->close();
