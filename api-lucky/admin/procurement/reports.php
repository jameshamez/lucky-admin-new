<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require '../../condb.php';
/** @var mysqli $conn */
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // 1. KPI Data
    $kpi = [
        "totalCalculated" => 0,
        "totalOrdered" => 0,
        "totalDelivered" => 0
    ];

    // Calculated (from price_estimations_sales)
    $res = $conn->query("SELECT COUNT(*) as cnt FROM price_estimations_sales");
    $kpi['totalCalculated'] = intval($res->fetch_assoc()['cnt'] ?? 0);

    // Ordered (from orders)
    $res = $conn->query("SELECT COUNT(*) as cnt FROM orders WHERE order_status != 'ยกเลิก'");
    $kpi['totalOrdered'] = intval($res->fetch_assoc()['cnt'] ?? 0);

    // Delivered
    $res = $conn->query("SELECT COUNT(*) as cnt FROM orders WHERE order_status = 'จัดส่งครบแล้ว'");
    $kpi['totalDelivered'] = intval($res->fetch_assoc()['cnt'] ?? 0);

    // 2. Monthly Trend (last 6 months)
    $monthlyData = [];
    for ($i = 5; $i >= 0; $i--) {
        $date = date('Y-m', strtotime("-$i months"));
        $monthName = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."][intval(date('m', strtotime("-$i months"))) - 1];

        $sql1 = "SELECT COUNT(*) as cnt FROM price_estimations_sales WHERE estimation_date LIKE '$date%'";
        $sql2 = "SELECT COUNT(*) as cnt FROM orders WHERE created_at LIKE '$date%' AND order_status != 'ยกเลิก'";
        $sql3 = "SELECT COUNT(*) as cnt FROM orders WHERE created_at LIKE '$date%' AND order_status = 'จัดส่งครบแล้ว'";

        $monthlyData[] = [
            "month" => $monthName,
            "calculated" => intval($conn->query($sql1)->fetch_assoc()['cnt'] ?? 0),
            "ordered" => intval($conn->query($sql2)->fetch_assoc()['cnt'] ?? 0),
            "delivered" => intval($conn->query($sql3)->fetch_assoc()['cnt'] ?? 0)
        ];
    }

    // 3. Factory/Supplier Summary (Detailed)
    // For now, we fetch suppliers and link them to orders if possible. 
    // Since the link might be in 'details' or not yet explicit, we provide a placeholder structure 
    // but with real supplier names.
    // NOTE: there is no table linking a quotation/order line item to a specific
    // factory + product category, so per-factory quoted/ordered/po breakdown
    // cannot be computed for real yet. Return real factory names with zeroed
    // counts instead of the random placeholder numbers this used to show.
    $factorySummary = [];
    $suppliers_res = $conn->query("SELECT * FROM procurement_suppliers");
    $zero = ["quoted" => 0, "ordered" => 0, "po" => 0];
    while ($s = $suppliers_res->fetch_assoc()) {
        $factorySummary[] = [
            "factory" => $s['name'],
            "medal" => $zero,
            "trophy" => $zero,
            "award" => $zero,
            "shirt" => $zero,
            "other" => $zero
        ];
    }

    // 4. Comparison Data (Quoted vs Ordered by Category)
    $categories = [
        ["name" => "เหรียญ", "id" => "medal"],
        ["name" => "ถ้วย", "id" => "trophy"],
        ["name" => "โล่", "id" => "award"],
        ["name" => "เสื้อ", "id" => "shirt"],
        ["name" => "อื่นๆ", "id" => "other"]
    ];

    $comparisonData = [];
    foreach ($categories as $cat) {
        $c_name = $cat['name'];
        $c_id = $cat['id'];

        $q_res = $conn->query("SELECT COUNT(*) as cnt FROM price_estimations_sales WHERE product_type = '$c_id' OR product_category LIKE '%$c_name%'");
        $quoted = intval($q_res->fetch_assoc()['cnt'] ?? 0);

        $o_res = $conn->query("SELECT COUNT(*) as cnt FROM orders WHERE product_category LIKE '%$c_name%'");
        $ordered = intval($o_res->fetch_assoc()['cnt'] ?? 0);

        $rate = $quoted > 0 ? round(($ordered / $quoted) * 100) : 0;

        $comparisonData[] = [
            "name" => $c_name,
            "quoted" => $quoted,
            "ordered" => $ordered,
            "rate" => $rate
        ];
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "stats" => $kpi,
            "monthlyTrend" => $monthlyData,
            "factorySummary" => $factorySummary,
            "comparisonData" => $comparisonData
        ]
    ]);
    exit();
}
?>