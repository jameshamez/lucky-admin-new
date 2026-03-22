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

// Dynamic Column Detection - detect ALL available columns
function getAvailableColumns($conn)
{
    $res = $conn->query("SHOW COLUMNS FROM orders");
    $cols = [];
    while ($row = $res->fetch_assoc())
        $cols[] = strtolower($row['Field']);
    return $cols;
}

$all_cols = getAvailableColumns($conn);

// Revenue Expression: pick the best non-zero amount
// Use GREATEST to find the largest non-zero value among the available columns
$rev_parts = [];
if (in_array('total_amount', $all_cols))
    $rev_parts[] = 'COALESCE(total_amount, 0)';
if (in_array('total_price', $all_cols))
    $rev_parts[] = 'COALESCE(total_price, 0)';
if (in_array('subtotal', $all_cols))
    $rev_parts[] = 'COALESCE(subtotal, 0)';
if (in_array('budget', $all_cols))
    $rev_parts[] = 'COALESCE(budget, 0)';
$rev_expr = count($rev_parts) > 1 ? 'GREATEST(' . implode(', ', $rev_parts) . ')' : ($rev_parts[0] ?? '0');

// Status Expression: COALESCE order_status and status columns
$has_order_status = in_array('order_status', $all_cols);
$has_status = in_array('status', $all_cols);
$status_expr = $has_order_status && $has_status
    ? "COALESCE(NULLIF(order_status,''), NULLIF(status,''), 'ไม่ระบุ')"
    : ($has_order_status ? "COALESCE(order_status, 'ไม่ระบุ')" : "COALESCE(status, 'ไม่ระบุ')");

// Category Expression: COALESCE product_category and product_type 
$has_product_category = in_array('product_category', $all_cols);
$has_product_type = in_array('product_type', $all_cols);
$cat_expr = "COALESCE(NULLIF(" . ($has_product_category ? 'product_category' : "''") . ",''), NULLIF(" . ($has_product_type ? 'product_type' : "''") . ",''), 'อื่นๆ')";

// Date Expression: handle both date and datetime in order_date
$date_expr = "DATE(order_date)";

$period = $_GET['period'] ?? 'month';
$response = ["status" => "success", "data" => []];

// ============================
// 1. Dashboard Summary (Current Period)
// ============================
$where_period = "";
$current_label = "";
$period_label_th = "";
if ($period === 'day') {
    $current_label = date('Y-m-d');
    $where_period = "$date_expr = '$current_label'";
    $period_label_th = "วันนี้";
} elseif ($period === 'year') {
    $current_label = date('Y');
    $where_period = "YEAR(order_date) = $current_label";
    $period_label_th = "ปีนี้";
} else {
    $current_label = date('Y-m');
    $where_period = "DATE_FORMAT(order_date, '%Y-%m') = '$current_label'";
    $period_label_th = "เดือนนี้";
}

$summary_sql = "SELECT 
                    SUM($rev_expr) as current_revenue,
                    SUM(COALESCE(paid_amount, 0)) as real_revenue,
                    COUNT(*) as total_orders
                FROM orders 
                WHERE $where_period";
$summary = $conn->query($summary_sql)->fetch_assoc();

// Target calculation (safe query - table may not exist)
$target_amount = 2000000; // default
$target_check = @$conn->query("SHOW TABLES LIKE 'sales_targets'");
if ($target_check && $target_check->num_rows > 0) {
    $target_sql = "SELECT SUM(target_amount) as target FROM sales_targets WHERE period_value LIKE '$current_label%'";
    $target_res = $conn->query($target_sql)->fetch_assoc();
    $target_amount = (float) ($target_res['target'] ?? 2000000);
}

$current_rev = (float) ($summary['current_revenue'] ?? 0);
$real_rev = (float) ($summary['real_revenue'] ?? 0);

$response['data']['dashboardSummary'] = [
    "current" => $current_rev,
    "target" => $target_amount,
    "percentage" => $target_amount > 0 ? round(($current_rev / $target_amount) * 100) : 0,
    "realRevenue" => $real_rev,
    "pendingRevenue" => $current_rev - $real_rev,
    "totalOrders" => (int) ($summary['total_orders'] ?? 0),
    "periodLabel" => $period_label_th
];

// ============================
// 2. Pipeline Status Counts
// ============================
// Use the COALESCE status expression for reliable status detection
$status_counts_sql = "SELECT $status_expr as resolved_status, COUNT(*) as count FROM orders GROUP BY resolved_status";
$res = $conn->query($status_counts_sql);
$status_map = [];
while ($row = $res->fetch_assoc()) {
    $status_map[$row['resolved_status']] = (int) $row['count'];
}

// Map all known statuses - including Thai and English variants
$response['data']['pipelineStats'] = [
    "estimate" => ($status_map['ประเมินราคา'] ?? 0),
    "quotation" => ($status_map['ใบเสนอราคา'] ?? 0),
    "pendingDeposit" => ($status_map['รอชำระมัดจำ'] ?? 0) + ($status_map['รอชำระเงิน'] ?? 0) + ($status_map['pending'] ?? 0),
    "graphicDesign" => ($status_map['รอออกแบบ'] ?? 0),
    "production" => ($status_map['กำลังผลิต'] ?? 0),
    "qcReadyToShip" => ($status_map['ตรวจสอบคุณภาพ'] ?? 0),
    "completed" => ($status_map['จัดส่งสำเร็จ'] ?? 0) + ($status_map['completed'] ?? 0),
    "newOrders" => ($status_map['สร้างคำสั่งซื้อใหม่'] ?? 0)
];

// Also send raw status map for debugging / future use
$response['data']['rawStatusCounts'] = $status_map;

// ============================
// 3. Urgent Orders
// ============================
$urgent_sql = "SELECT 
                orders.order_id as numeric_id,
                COALESCE(NULLIF(orders.job_id, ''), CONCAT('JOB-', orders.order_id)) as id, 
                COALESCE(NULLIF(orders.customer_name, ''), customers.full_name, customers.line_id, 'ไม่ระบุชื่อ') as customer,
                COALESCE(NULLIF(orders.job_name, ''), (SELECT product_name FROM order_items WHERE order_id = orders.order_id LIMIT 1), 'ไม่ระบุงาน') as mainItem,
                orders.delivery_date, 
                $status_expr as reason,
                DATEDIFF(CURDATE(), orders.delivery_date) as overdueDays
               FROM orders 
               LEFT JOIN customers ON orders.customer_id = customers.id
               WHERE $status_expr NOT IN ('จัดส่งสำเร็จ', 'completed')
               AND orders.order_date IS NOT NULL
               ORDER BY orders.delivery_date ASC LIMIT 10";
$res = $conn->query($urgent_sql);
$urgentOrders = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $days = (int) ($row['overdueDays'] ?? 0);
        $row['overdueDays'] = max(0, $days);
        $row['dueDateType'] = $days > 0 ? 'overdue' : ($days == 0 ? 'today' : 'tomorrow');
        $row['dueDate'] = $row['delivery_date'] ?: 'วันนี้';
        $urgentOrders[] = $row;
    }
}
$response['data']['urgentOrders'] = $urgentOrders;

// ============================
// 4. Jobs By Status Details
// ============================
// Use resolved status + include common statuses from actual data
$all_status_keys = [
    'ประเมินราคา' => 'estimate',
    'ใบเสนอราคา' => 'quotation',
    'รอชำระมัดจำ' => 'pendingDeposit',
    'รอชำระเงิน' => 'pendingDeposit',
    'pending' => 'pendingDeposit',
    'รอออกแบบ' => 'graphicDesign',
    'กำลังผลิต' => 'production',
    'ตรวจสอบคุณภาพ' => 'qcReadyToShip',
    'จัดส่งสำเร็จ' => 'completed',
    'completed' => 'completed',
    'สร้างคำสั่งซื้อใหม่' => 'newOrders'
];

$jobs_by_status = [
    'estimate' => [],
    'quotation' => [],
    'pendingDeposit' => [],
    'graphicDesign' => [],
    'production' => [],
    'qcReadyToShip' => [],
    'completed' => [],
    'newOrders' => []
];

$jobs_sql = "SELECT orders.order_id, orders.job_id as jobId, orders.order_date as orderDate, orders.sales_channel as salesChannel, 
        orders.customer_line as lineName, 
        COALESCE(NULLIF(orders.customer_name, ''), customers.full_name, 'ไม่ระบุ') as customerName, 
        COALESCE(NULLIF(orders.job_name, ''), (SELECT product_name FROM order_items WHERE order_id = orders.order_id LIMIT 1), 'ไม่ระบุ') as product, 
        orders.delivery_date as deliveryDate, $status_expr as resolved_status,
        $rev_expr as revenue
        FROM orders 
        LEFT JOIN customers ON orders.customer_id = customers.id
        ORDER BY orders.order_date DESC LIMIT 100";
$job_res = $conn->query($jobs_sql);
while ($j = $job_res->fetch_assoc()) {
    $rs = $j['resolved_status'];
    $key = $all_status_keys[$rs] ?? null;
    if ($key && isset($jobs_by_status[$key]) && count($jobs_by_status[$key]) < 15) {
        unset($j['resolved_status'], $j['revenue']);
        $jobs_by_status[$key][] = $j;
    }
}
$response['data']['jobsByStatus'] = $jobs_by_status;

// ============================
// 5. Sales Trend (Stacked Chart Data)
// ============================
$trend_group = "";
$trend_format = "";
$trend_order = "";
$trend_limit = 6;

if ($period === 'day') {
    $trend_group = "DATE(order_date)";
    $trend_format = "%d/%m";
    $trend_order = "DATE(order_date) DESC";
    $trend_limit = 14; // 2 weeks of daily data
} elseif ($period === 'year') {
    $trend_group = "YEAR(order_date)";
    $trend_format = "%Y";
    $trend_order = "YEAR(order_date) DESC";
    $trend_limit = 5;
} else {
    // Monthly (default)  
    $trend_group = "DATE_FORMAT(order_date, '%Y-%m')";
    $trend_format = "%Y-%m";
    $trend_order = "DATE_FORMAT(order_date, '%Y-%m') DESC";
    $trend_limit = 12;
}

$trend_sql = "SELECT 
                $trend_group as period_key,
                DATE_FORMAT(order_date, '$trend_format') as name,
                $cat_expr as category,
                SUM($rev_expr) as revenue,
                COUNT(*) as order_count
              FROM orders
              WHERE order_date IS NOT NULL AND order_date != '0000-00-00' AND order_date != '0000-00-00 00:00:00'
              GROUP BY period_key, category
              ORDER BY $trend_order";

$res = $conn->query($trend_sql);
$temp_trend = [];
$seen_periods = [];

if ($res) {
    while ($row = $res->fetch_assoc()) {
        $period_key = $row['period_key'];
        $name = $row['name'];
        $cat = $row['category'] ?: 'อื่นๆ';

        // Normalize Category Name for chart display
        $cat_lower = mb_strtolower($cat);
        if (stripos($cat, 'Medal') !== false || mb_stripos($cat, 'เหรียญ') !== false) {
            $cat = 'เหรียญรางวัล';
        } else if (stripos($cat, 'Trophy') !== false || mb_stripos($cat, 'ถ้วย') !== false) {
            $cat = 'ถ้วยรางวัล';
        } else if (stripos($cat, 'Plaque') !== false || mb_stripos($cat, 'โล่') !== false) {
            $cat = 'โล่รางวัล';
        } else {
            $cat = 'อื่นๆ';
        }

        // Track unique periods and limit
        if (!isset($seen_periods[$period_key])) {
            if (count($seen_periods) >= $trend_limit)
                continue; // skip if we have enough periods
            $seen_periods[$period_key] = true;
        }

        // Format month names for Thai display
        if ($period === 'month') {
            $month_map = [
                '01' => 'ม.ค.',
                '02' => 'ก.พ.',
                '03' => 'มี.ค.',
                '04' => 'เม.ย.',
                '05' => 'พ.ค.',
                '06' => 'มิ.ย.',
                '07' => 'ก.ค.',
                '08' => 'ส.ค.',
                '09' => 'ก.ย.',
                '10' => 'ต.ค.',
                '11' => 'พ.ย.',
                '12' => 'ธ.ค.'
            ];
            $parts = explode('-', $name);
            if (count($parts) === 2) {
                $name = $month_map[$parts[1]] ?? $name;
            }
        }

        if (!isset($temp_trend[$period_key])) {
            $temp_trend[$period_key] = [
                "name" => $name,
                "เหรียญรางวัล" => 0,
                "ถ้วยรางวัล" => 0,
                "โล่รางวัล" => 0,
                "อื่นๆ" => 0,
                "_orderCount" => 0
            ];
        }
        $revenue = (float) $row['revenue'];
        $count = (int) $row['order_count'];
        $temp_trend[$period_key][$cat] += $revenue;
        $temp_trend[$period_key]['_orderCount'] += $count;
    }
}

// Convert to array, strip internal keys, and reverse to chronological order
$trend = [];
foreach (array_reverse(array_values($temp_trend)) as $item) {
    $orderCount = $item['_orderCount'];
    unset($item['_orderCount']);
    $item['orderCount'] = $orderCount;
    $trend[] = $item;
}
$response['data']['salesTrend'] = $trend;

// ============================
// 6. Debug info (column detection)
// ============================
$response['data']['_debug'] = [
    "revExpr" => $rev_expr,
    "statusExpr" => $status_expr,
    "catExpr" => $cat_expr,
    "period" => $period,
    "currentLabel" => $current_label,
    "availableCols" => $all_cols
];

echo json_encode($response, JSON_UNESCAPED_UNICODE);
$conn->close();
