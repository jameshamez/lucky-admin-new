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
$conn->select_db('finfinph_lcukycompany');

$conn->set_charset("utf8mb4");

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

function getItemRevenueColumn($conn)
{
    $res = $conn->query("SHOW COLUMNS FROM order_items");
    $cols = [];
    while ($row = $res->fetch_assoc())
        $cols[] = strtolower($row['Field']);
    if (in_array('total_price_item', $cols))
        return 'total_price_item';
    if (in_array('total_price', $cols))
        return 'total_price';
    return 'price';
}

$rev_col = getOrderRevenueColumn($conn);
$item_rev_col = getItemRevenueColumn($conn);

// Dynamic filtering logic
$period = $_GET['period'] ?? 'month';
$selected_date = $_GET['date'] ?? date('Y-m-d');
$ts = strtotime($selected_date);

switch ($period) {
    case 'day':
        $date_from = date('Y-m-d', $ts);
        $date_to = $date_from;
        break;
    case 'week':
        // Handle week starting Monday vs Sunday depending on local preference
        $date_from = date('Y-m-d', strtotime('monday this week', $ts));
        $date_to = date('Y-m-d', strtotime('sunday this week', $ts));
        break;
    case 'month':
        $date_from = date('Y-m-01', $ts);
        $date_to = date('Y-m-t', $ts);
        break;
    case 'quarter':
        $month = date('n', $ts);
        $year = date('Y', $ts);
        if ($month <= 3) {
            $date_from = "$year-01-01";
            $date_to = "$year-03-31";
        } elseif ($month <= 6) {
            $date_from = "$year-04-01";
            $date_to = "$year-06-30";
        } elseif ($month <= 9) {
            $date_from = "$year-07-01";
            $date_to = "$year-09-30";
        } else {
            $date_from = "$year-10-01";
            $date_to = "$year-12-31";
        }
        break;
    case 'year':
        $date_from = date('Y-01-01', $ts);
        $date_to = date('Y-12-31', $ts);
        break;
    default:
        $date_from = date('Y-m-01', $ts);
        $date_to = date('Y-m-t', $ts);
}

$date_where = "order_date BETWEEN '$date_from' AND '$date_to'";

$response = ["status" => "success", "data" => []];
$response['data']['debug'] = [
    "period" => $period,
    "date_from" => $date_from,
    "date_to" => $date_to,
    "date_where" => $date_where
];

// 1. Dashboard Summary
$summary_sql = "SELECT 
                    SUM(COALESCE($rev_col, 0)) as header_revenue,
                    SUM(COALESCE(paid_amount, 0)) as real_revenue,
                    COUNT(*) as total_orders
                FROM orders 
                WHERE $date_where";
$summary = $conn->query($summary_sql)->fetch_assoc();

// Use order_items if header revenue is 0
$item_sum_sql = "SELECT SUM(COALESCE(oi.$item_rev_col, 0)) as item_revenue 
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.order_id
                WHERE o.$date_where";
$item_summary = $conn->query($item_sum_sql)->fetch_assoc();

$current_rev = (float) ($summary['header_revenue'] ?? 0);
if ($current_rev <= 0) {
    $current_rev = (float) ($item_summary['item_revenue'] ?? 0);
}

$real_rev = (float) ($summary['real_revenue'] ?? 0);

// Get target
$current_month = date('Y-m', $ts);
$target_sql = "SELECT SUM(target_amount) as target FROM sales_targets WHERE period_value = '$current_month' OR period_value LIKE '$current_month%'";
$target_res = $conn->query($target_sql)->fetch_assoc();
$target_amount = (float) ($target_res['target'] ?? 2000000);

$response['data']['dashboardSummary'] = [
    "current" => $current_rev,
    "target" => $target_amount,
    "percentage" => $target_amount > 0 ? round(($current_rev / $target_amount) * 100) : 0,
    "realRevenue" => $real_rev,
    "pendingRevenue" => $current_rev - $real_rev,
    "totalOrders" => (int) $summary['total_orders']
];

// Restore summary object for frontend compatibility
$response['data']['summary'] = [
    "totalRevenue" => $current_rev,
    "totalOrders" => (int) $summary['total_orders'],
    "avgOrder" => $summary['total_orders'] > 0 ? $current_rev / $summary['total_orders'] : 0,
    "growth" => 0
];

// 2. Pipeline Status Counts
// We map database statuses to dashboard keys
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

// 3. Urgent Orders (Due Today, Tomorrow, or Overdue)
$urgent_sql = "SELECT 
                job_id as id, 
                customer_name as customer, 
                job_name as mainItem, 
                delivery_date,
                order_status as reason,
                DATEDIFF(CURDATE(), delivery_date) as overdueDays
               FROM orders 
               WHERE order_status != 'จัดส่งสำเร็จ' 
               AND (delivery_date <= DATE_ADD(CURDATE(), INTERVAL 1 DAY) OR delivery_date IS NULL)
               ORDER BY delivery_date ASC LIMIT 10";
$res = $conn->query($urgent_sql);
$urgentOrders = [];
while ($row = $res->fetch_assoc()) {
    $row['overdueDays'] = (int) $row['overdueDays'];
    $dueType = 'future';
    if ($row['overdueDays'] > 0)
        $dueType = 'overdue';
    elseif ($row['overdueDays'] == 0)
        $dueType = 'today';
    elseif ($row['overdueDays'] == -1)
        $dueType = 'tomorrow';

    $row['dueDateType'] = $dueType;
    $row['dueDate'] = $row['overdueDays'] > 0 ? "เกินกำหนด" : ($row['overdueDays'] == 0 ? "วันนี้" : "พรุ่งนี้");
    $urgentOrders[] = $row;
}
$response['data']['urgentOrders'] = $urgentOrders;

// 4. Jobs By Status (for the dialogs)
$all_statuses = ['ประเมินราคา', 'ใบเสนอราคา', 'รอชำระมัดจำ', 'รอออกแบบ', 'กำลังผลิต', 'ตรวจสอบคุณภาพ', 'จัดส่งสำเร็จ'];
$jobs_by_status = [];
foreach ($all_statuses as $st) {
    $key = '';
    if ($st == 'ประเมินราคา')
        $key = 'estimate';
    elseif ($st == 'ใบเสนอราคา')
        $key = 'quotation';
    elseif ($st == 'รอชำระมัดจำ')
        $key = 'pendingDeposit';
    elseif ($st == 'รอออกแบบ')
        $key = 'graphicDesign';
    elseif ($st == 'กำลังผลิต')
        $key = 'production';
    elseif ($st == 'ตรวจสอบคุณภาพ')
        $key = 'qcReadyToShip';
    elseif ($st == 'จัดส่งสำเร็จ')
        $key = 'completed';

    $job_sql = "SELECT job_id as jobId, order_date as orderDate, sales_channel as salesChannel, 
                customer_line as lineName, customer_name as customerName, job_name as product, 
                delivery_date as deliveryDate 
                FROM orders WHERE order_status = '$st' ORDER BY order_date DESC LIMIT 20";
    $job_res = $conn->query($job_sql);
    $jobs_by_status[$key] = [];
    while ($j = $job_res->fetch_assoc()) {
        $jobs_by_status[$key][] = $j;
    }
}
$response['data']['jobsByStatus'] = $jobs_by_status;

// 5. Sales Trend (for chart)
$sales_trend_sql = "SELECT 
                        DATE_FORMAT(order_date, '%b') as month,
                        SUM(COALESCE($rev_col, 0)) as revenue
                    FROM orders 
                    GROUP BY YEAR(order_date), MONTH(order_date)
                    ORDER BY YEAR(order_date) DESC, MONTH(order_date) DESC LIMIT 6";
$res = $conn->query($sales_trend_sql);
$trend = [];
while ($row = $res->fetch_assoc()) {
    $trend[] = ["name" => $row['month'], "revenue" => (float) $row['revenue']];
}
$response['data']['salesTrend'] = array_reverse($trend);

// 6. Sales By Product Category
$cat_sql = "SELECT o.product_category as name, SUM(COALESCE(oi.$item_rev_col, 0)) as revenue, COUNT(DISTINCT o.order_id) as order_count 
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE o.$date_where
            GROUP BY o.product_category";
$res = $conn->query($cat_sql);
$salesByProductType = [];
$colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
$i = 0;
while ($row = $res->fetch_assoc()) {
    if (empty($row['name']))
        $row['name'] = 'อื่น ๆ';
    $val = (float) $row['revenue'];
    $cnt = (int) $row['order_count'];

    // Fallback if joined value is 0 but maybe header value exists (parity check)
    if ($val <= 0) {
        $check_sql = "SELECT SUM($rev_col) as val, COUNT(*) as cnt FROM orders WHERE product_category = '" . $conn->real_escape_string($row['name'] == 'อื่น ๆ' ? '' : $row['name']) . "' AND $date_where";
        $check = $conn->query($check_sql)->fetch_assoc();
        $val = (float) ($check['val'] ?? 0);
        $cnt = (int) ($check['cnt'] ?? 0);
    }

    if ($val > 0 || $cnt > 0) {
        $salesByProductType[] = [
            "name" => $row['name'],
            "value" => $val,
            "count" => $cnt,
            "color" => $colors[$i % count($colors)]
        ];
        $i++;
    }
}
$response['data']['salesByProductType'] = $salesByProductType;
// Final check: if still empty, try pulling from headers only
if (empty($salesByProductType)) {
    $res = $conn->query("SELECT product_category as name, SUM($rev_col) as value FROM orders WHERE $date_where GROUP BY product_category");
    while ($row = $res->fetch_assoc()) {
        if (empty($row['name']))
            $row['name'] = 'อื่น ๆ';
        if ($row['value'] > 0) {
            $salesByProductType[] = [
                "name" => $row['name'],
                "value" => (float) $row['value'],
                "color" => $colors[$i % count($colors)]
            ];
            $i++;
        }
    }
}

$response['data']['salesByProductType'] = $salesByProductType;

// 7. Employee Performance
$emp_sql = "SELECT 
                responsible_person as name, 
                COUNT(*) as orders, 
                SUM(COALESCE($rev_col, 0)) as revenue
            FROM orders 
            WHERE $date_where
            GROUP BY responsible_person";
$res = $conn->query($emp_sql);
$employeePerformance = [];
while ($row = $res->fetch_assoc()) {
    if (empty($row['name']))
        $row['name'] = 'ไม่ระบุ';
    $rev = (float) $row['revenue'];
    $target = 500000; // Mock target
    $employeePerformance[] = [
        "name" => $row['name'],
        "orders" => (int) $row['orders'],
        "revenue" => $rev,
        "target" => $target,
        "commission" => $rev * 0.03, // 3% mock commission
        "kpi" => $target > 0 ? round(($rev / $target) * 100) : 0
    ];
}
$response['data']['employeePerformance'] = $employeePerformance;

// 8. Top Customers
$cust_sql = "SELECT 
                customer_name as name, 
                COUNT(*) as orders, 
                SUM(COALESCE($rev_col, 0)) as revenue,
                MAX(order_date) as lastContact
             FROM orders 
             WHERE $date_where
             GROUP BY customer_name 
             ORDER BY revenue DESC LIMIT 10";
$res = $conn->query($cust_sql);
$topCustomers = [];
while ($row = $res->fetch_assoc()) {
    $topCustomers[] = [
        "name" => $row['name'],
        "orders" => (int) $row['orders'],
        "revenue" => (float) $row['revenue'],
        "lastContact" => $row['lastContact']
    ];
}
$response['data']['topCustomers'] = $topCustomers;

// 9. Product Performance
$prod_sql = "SELECT 
                product_name as product, 
                SUM(quantity) as sold, 
                SUM(COALESCE($item_rev_col, 0)) as revenue
             FROM order_items 
             JOIN orders ON order_items.order_id = orders.order_id
             WHERE $date_where
             GROUP BY product_name 
             ORDER BY sold DESC LIMIT 10";
$res = $conn->query($prod_sql);
$productPerformance = [];
while ($row = $res->fetch_assoc()) {
    $productPerformance[] = [
        "product" => $row['product'],
        "sold" => (int) $row['sold'],
        "revenue" => (float) $row['revenue'],
        "stock" => rand(10, 100) // Mock stock
    ];
}
$response['data']['productPerformance'] = $productPerformance;

// 10. Customer Segments (Real data from customers_admin)
$seg_sql = "SELECT customer_type as type, COUNT(*) as count, SUM(COALESCE(total_value, 0)) as revenue
            FROM customers_admin
            GROUP BY customer_type";
$res = $conn->query($seg_sql);
$customerSegments = [];
$total_seg_rev = 0;
while ($row = $res->fetch_assoc()) {
    $row['revenue'] = (float) $row['revenue'];
    $total_seg_rev += $row['revenue'];
    $customerSegments[] = $row;
}
foreach ($customerSegments as &$seg) {
    if ($total_seg_rev > 0) {
        $seg['percentage'] = round(($seg['revenue'] / $total_seg_rev) * 100);
    } else {
        $seg['percentage'] = 0;
    }
}
$response['data']['customerSegments'] = $customerSegments;

// 11. Activity Stats (Real data from customer_activities)
$act_sql = "SELECT activity_type, COUNT(*) as count 
            FROM customer_activities 
            WHERE start_datetime BETWEEN '$date_from 00:00:00' AND '$date_to 23:59:59'
            GROUP BY activity_type";
$res = $conn->query($act_sql);
$activityStats = ["calls" => 0, "meetings" => 0, "emails" => 0];
while ($row = $res->fetch_assoc()) {
    $type = $row['activity_type'];
    if ($type == 'โทรศัพท์')
        $activityStats['calls'] = (int) $row['count'];
    elseif ($type == 'นัดพบ')
        $activityStats['meetings'] = (int) $row['count'];
    elseif ($type == 'อีเมล')
        $activityStats['emails'] = (int) $row['count'];
}
$response['data']['activityStats'] = $activityStats;

// 12. KPI Metrics (Real data for new customers and closing rate)
$new_cust_sql = "SELECT COUNT(*) as new_count FROM customers_admin WHERE created_at BETWEEN '$date_from 00:00:00' AND '$date_to 23:59:59'";
$new_cust = $conn->query($new_cust_sql)->fetch_assoc();
$new_cust_count = (int) $new_cust['new_count'];

// Calculate real closing rate
$leads_sql = "SELECT COUNT(*) as cnt FROM orders WHERE $date_where";
$total_leads = (int) $conn->query($leads_sql)->fetch_assoc()['cnt'];
$won_sql = "SELECT COUNT(*) as cnt FROM orders 
            WHERE $date_where
            AND order_status IN ('ยืนยันคำสั่งซื้อ', 'สร้างงานแล้ว', 'กำลังผลิต', 'ตรวจสอบคุณภาพ', 'จัดส่งสำเร็จ')";
$won_leads = (int) $conn->query($won_sql)->fetch_assoc()['cnt'];
$closing_rate = $total_leads > 0 ? round(($won_leads / $total_leads) * 100) : 0;

$response['data']['kpiMetrics'] = [
    ["name" => "ยอดขายภาพรวมทีม", "actual" => $current_rev, "target" => $target_amount, "achievement" => $target_amount > 0 ? round(($current_rev / $target_amount) * 100) : 0],
    ["name" => "จำนวนลูกค้าใหม่", "actual" => $new_cust_count, "target" => 20, "achievement" => round(($new_cust_count / 20) * 100)],
    ["name" => "อัตราการปิดการขาย", "actual" => $won_leads, "target" => $total_leads, "achievement" => $closing_rate]
];

// 13. salesData (Compatibility with sales trend)
$response['data']['salesData'] = $response['data']['salesTrend'];

echo json_encode($response);
$conn->close();
