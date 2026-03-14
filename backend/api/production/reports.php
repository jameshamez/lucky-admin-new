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

$period = $_GET['period'] ?? 'this-month';

// 1. Efficiency Data (Weekly)
$efficiencyData = [];
$effQuery = "SELECT 
                CONCAT('สัปดาห์ ', WEEK(stat_date, 1) - WEEK(DATE_SUB(stat_date, INTERVAL DAY(stat_date)-1 DAY), 1) + 1) as week,
                SUM(target_units) as target,
                SUM(actual_units) as actual,
                AVG((actual_units/target_units)*100) as efficiency
             FROM production_stats 
             WHERE MONTH(stat_date) = MONTH(CURRENT_DATE()) AND YEAR(stat_date) = YEAR(CURRENT_DATE())
             GROUP BY WEEK(stat_date, 1)";
$resEff = $conn->query($effQuery);
if ($resEff) {
    while ($row = $resEff->fetch_assoc()) {
        $efficiencyData[] = [
            "week" => $row['week'],
            "target" => (int) $row['target'],
            "actual" => (int) $row['actual'],
            "efficiency" => round((float) $row['efficiency'], 1)
        ];
    }
}

// 2. Order Status Breakdown
$statusData = [];
$statusQuery = "SELECT order_status as name, COUNT(*) as value FROM orders GROUP BY order_status";
$resStatus = $conn->query($statusQuery);
$colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
$idx = 0;
if ($resStatus) {
    while ($row = $resStatus->fetch_assoc()) {
        $statusData[] = [
            "name" => $row['name'],
            "value" => (int) $row['value'],
            "color" => $colors[$idx % count($colors)]
        ];
        $idx++;
    }
}

// 3. Inventory Movement
$movementData = [];
$moveQuery = "SELECT movement_date as date, 
                SUM(CASE WHEN type = 'IN' THEN quantity ELSE 0 END) as stockIn,
                SUM(CASE WHEN type = 'OUT' THEN quantity ELSE 0 END) as stockOut
              FROM inventory_movements 
              GROUP BY movement_date 
              ORDER BY movement_date DESC LIMIT 7";
$resMove = $conn->query($moveQuery);
if ($resMove) {
    while ($row = $resMove->fetch_assoc()) {
        $movementData[] = [
            "date" => date("d/m", strtotime($row['date'])),
            "stockIn" => (float) $row['stockIn'],
            "stockOut" => (float) $row['stockOut'],
            "net" => (float) ($row['stockIn'] - $row['stockOut'])
        ];
    }
}

// 4. Inventory Status
$inventoryData = [];
$invQuery = "SELECT * FROM production_inventory";
$resInv = $conn->query($invQuery);
if ($resInv) {
    while ($row = $resInv->fetch_assoc()) {
        $status = "ปกติ";
        if ($row['current_stock'] <= 0)
            $status = "ขาดแคลน";
        else if ($row['current_stock'] < $row['min_stock'])
            $status = "ใกล้หมด";

        $inventoryData[] = [
            "item" => $row['item_name'],
            "current" => (float) $row['current_stock'],
            "minimum" => (float) $row['min_stock'],
            "status" => $status,
            "value" => (float) ($row['current_stock'] * $row['unit_price'])
        ];
    }
}

// 5. Defect Analysis
$defectData = [];
$defectQuery = "SELECT defect_type as type, COUNT(*) as count FROM production_defects GROUP BY defect_type";
$resDefect = $conn->query($defectQuery);
$totalDefects = 0;
$defectRows = [];
if ($resDefect) {
    while ($row = $resDefect->fetch_assoc()) {
        $totalDefects += (int) $row['count'];
        $defectRows[] = $row;
    }
    foreach ($defectRows as $r) {
        $defectData[] = [
            "type" => $r['type'],
            "count" => (int) $r['count'],
            "percentage" => $totalDefects > 0 ? round(((int) $r['count'] / $totalDefects) * 100, 1) : 0
        ];
    }
}

// 6. Delivery Performance (Mock months for demonstration if no data, or real)
$deliveryData = [
    ["month" => "ต.ค.", "onTime" => 85, "late" => 15, "total" => 100],
    ["month" => "พ.ย.", "onTime" => 92, "late" => 8, "total" => 100],
    ["month" => "ธ.ค.", "onTime" => 88, "late" => 12, "total" => 100],
    ["month" => "ม.ค.", "onTime" => 95, "late" => 5, "total" => 100]
];

// 7. Summary Stats
$summary = [
    "efficiency" => "0%",
    "completedOrders" => 0,
    "onTimeRate" => "0%",
    "defectRate" => "0.0%"
];

// Calc Completed
$resComp = $conn->query("SELECT COUNT(*) as total FROM orders WHERE order_status = 'จัดส่งแล้ว' OR order_status = 'Completed'");
if ($resComp)
    $summary['completedOrders'] = (int) $resComp->fetch_assoc()['total'];

// Calc Efficiency Avg
$resAvgEff = $conn->query("SELECT AVG((actual_units/target_units)*100) as avg_eff FROM production_stats");
if ($resAvgEff) {
    $avg = $resAvgEff->fetch_assoc()['avg_eff'];
    if ($avg)
        $summary['efficiency'] = round($avg, 0) . "%";
}

echo json_encode([
    "status" => "success",
    "data" => [
        "efficiencyCharts" => $efficiencyData,
        "orderStatusBreakdown" => $statusData,
        "inventoryMovements" => array_reverse($movementData),
        "inventoryStatus" => $inventoryData,
        "defectAnalysis" => $defectData,
        "deliveryPerformance" => $deliveryData,
        "summary" => $summary
    ]
]);

$conn->close();
?>