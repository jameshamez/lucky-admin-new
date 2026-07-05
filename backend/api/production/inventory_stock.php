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

require __DIR__ . '/../../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

try {
    if (isset($_GET['summary'])) {
        // 1. Per-warehouse totals
        $warehouseData = [];
        $grand = ["name" => "รวมทุกคลัง", "total" => 0, "ready" => 0, "defective" => 0, "damaged" => 0];
        $res = $conn->query("SELECT w.name, w.code,
                            COALESCE(SUM(s.ready_qty),0) as ready,
                            COALESCE(SUM(s.defective_qty),0) as defective,
                            COALESCE(SUM(s.damaged_qty),0) as damaged
                            FROM warehouses w
                            LEFT JOIN inventory_stock s ON s.warehouse_id = w.id
                            GROUP BY w.id, w.name, w.code
                            ORDER BY w.id ASC");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $ready = (int) $row['ready'];
                $defective = (int) $row['defective'];
                $damaged = (int) $row['damaged'];
                $total = $ready + $defective + $damaged;
                $warehouseData[] = ["name" => $row['code'], "total" => $total, "ready" => $ready, "defective" => $defective, "damaged" => $damaged];
                $grand['total'] += $total;
                $grand['ready'] += $ready;
                $grand['defective'] += $defective;
                $grand['damaged'] += $damaged;
            }
        }
        array_unshift($warehouseData, $grand);

        // 2. Top low-stock products (ready < min_stock)
        $topLowStock = [];
        $res = $conn->query("SELECT p.code, p.name, w.code as warehouse_code, s.ready_qty, p.min_stock
                            FROM inventory_stock s
                            JOIN inventory_products p ON p.id = s.product_id
                            JOIN warehouses w ON w.id = s.warehouse_id
                            WHERE s.ready_qty < p.min_stock
                            ORDER BY (p.min_stock - s.ready_qty) DESC
                            LIMIT 10");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $topLowStock[] = [
                    "code" => $row['code'],
                    "name" => $row['name'],
                    "stock" => (int) $row['ready_qty'],
                    "min" => (int) $row['min_stock'],
                    "warehouse" => $row['warehouse_code'],
                ];
            }
        }

        // 3. Monthly stock movement (net transaction volume by status_to, last 6 months)
        $thMonths = ["01" => "ม.ค.", "02" => "ก.พ.", "03" => "มี.ค.", "04" => "เม.ย.", "05" => "พ.ค.", "06" => "มิ.ย.", "07" => "ก.ค.", "08" => "ส.ค.", "09" => "ก.ย.", "10" => "ต.ค.", "11" => "พ.ย.", "12" => "ธ.ค."];
        $chartBuckets = [];
        for ($i = 5; $i >= 0; $i--) {
            $ym = date('Y-m', strtotime("-$i months"));
            $chartBuckets[$ym] = ["พร้อมผลิต" => 0, "ตำหนิ" => 0, "ชำรุด" => 0];
        }
        $res = $conn->query("SELECT DATE_FORMAT(created_at, '%Y-%m') as ym, status_to, SUM(quantity) as qty
                            FROM inventory_transactions
                            WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 5 MONTH)
                            GROUP BY ym, status_to");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $ym = $row['ym'];
                if (!isset($chartBuckets[$ym])) continue;
                $label = $row['status_to'] === 'ready' ? 'พร้อมผลิต' : ($row['status_to'] === 'defective' ? 'ตำหนิ' : ($row['status_to'] === 'damaged' ? 'ชำรุด' : null));
                if ($label) $chartBuckets[$ym][$label] += (int) $row['qty'];
            }
        }
        $chartData = [];
        foreach ($chartBuckets as $ym => $vals) {
            $label = $thMonths[date('m', strtotime($ym . '-01'))] ?? $ym;
            $chartData[] = array_merge(["month" => $label], $vals);
        }

        echo json_encode(["status" => "success", "data" => [
            "warehouseData" => $warehouseData,
            "topLowStock" => $topLowStock,
            "chartData" => $chartData,
        ]]);
        exit();
    }

    $where = [];
    if (!empty($_GET['warehouse']) && $_GET['warehouse'] !== 'all') {
        $wh = $conn->real_escape_string($_GET['warehouse']);
        $where[] = "w.code = '$wh'";
    }
    if (!empty($_GET['location']) && $_GET['location'] !== 'all') {
        $loc = $conn->real_escape_string($_GET['location']);
        $where[] = "l.code = '$loc'";
    }
    if (!empty($_GET['category']) && $_GET['category'] !== 'all') {
        $cat = $conn->real_escape_string($_GET['category']);
        $where[] = "c.name = '$cat'";
    }
    if (!empty($_GET['search'])) {
        $s = $conn->real_escape_string($_GET['search']);
        $where[] = "(p.code LIKE '%$s%' OR p.name LIKE '%$s%')";
    }
    $whereSql = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

    $sql = "SELECT s.*, p.code as product_code, p.name as product_name, p.min_stock,
                   u.abbr as unit_abbr, u.name as unit_name,
                   w.code as warehouse_code, l.name as location_name
            FROM inventory_stock s
            JOIN inventory_products p ON p.id = s.product_id
            JOIN warehouses w ON w.id = s.warehouse_id
            LEFT JOIN inventory_locations l ON l.id = s.location_id
            LEFT JOIN inventory_categories c ON c.id = p.category_id
            LEFT JOIN inventory_units u ON u.id = p.unit_id
            $whereSql
            ORDER BY s.id ASC";
    $data = [];
    $res = $conn->query($sql);
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $ready = (int) $row['ready_qty'];
            $defective = (int) $row['defective_qty'];
            $damaged = (int) $row['damaged_qty'];
            $data[] = [
                "id" => (int) $row['id'],
                "productId" => (int) $row['product_id'],
                "code" => $row['product_code'],
                "name" => $row['product_name'],
                "warehouse" => $row['warehouse_code'],
                "location" => $row['location_name'],
                "total" => $ready + $defective + $damaged,
                "ready" => $ready,
                "defective" => $defective,
                "damaged" => $damaged,
                "min" => (int) $row['min_stock'],
                "unit" => $row['unit_abbr'] ?: $row['unit_name'],
                "lastUpdated" => $row['last_updated'],
            ];
        }
    }
    echo json_encode(["status" => "success", "data" => $data]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
