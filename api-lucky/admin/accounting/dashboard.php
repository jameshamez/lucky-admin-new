<?php
ini_set('display_errors', 1);
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
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

// Helper function to safely query and return empty if fails
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

// --- 1. Summary Stats ---
$stats = [
    "monthlyIncome" => 0,
    "monthlyExpense" => 0,
    "pendingPayments" => 0,
    "pendingRequests" => 0,
    "stockCount" => 0,
    "unpaidAmount" => 0
];

$res = safe_query($conn, "SELECT
    SUM(CASE WHEN type='INCOME' THEN amount ELSE 0 END) as income,
    SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END) as expense
    FROM `accounting_transactions`
    WHERE MONTH(transaction_date) = MONTH(CURRENT_DATE()) AND YEAR(transaction_date) = YEAR(CURRENT_DATE())");
if ($res && $row = $res->fetch_assoc()) {
    $stats['monthlyIncome'] = (float) $row['income'];
    $stats['monthlyExpense'] = (float) $row['expense'];
}

$res = safe_query($conn, "SELECT COUNT(*) as total, SUM(total_amount - paid_amount) as unpaid FROM `orders` WHERE payment_status != 'ชำระครบแล้ว' AND payment_status != 'ชำระครบ'");
if ($res && $row = $res->fetch_assoc()) {
    $stats['pendingPayments'] = (int) $row['total'];
    $stats['unpaidAmount'] = (float) $row['unpaid'];
}

$res = safe_query($conn, "SELECT COUNT(*) as total FROM `accounting_petty_cash` WHERE status = 'รออนุมัติ'");
if ($res && $row = $res->fetch_assoc()) {
    $stats['pendingRequests'] = (int) $row['total'];
}

$res = safe_query($conn, "SELECT COUNT(*) as total FROM `office_inventory` ");
if ($res && $row = $res->fetch_assoc()) {
    $stats['stockCount'] = (int) $row['total'];
}

// --- 2. Cash Flow Data (6 Months) ---
$cashFlow = [];
for ($i = 5; $i >= 0; $i--) {
    $date = date('Y-m-01', strtotime("-$i months"));
    $monthName = date('M', strtotime($date));
    $thMonths = ["Jan" => "ม.ค.", "Feb" => "ก.พ.", "Mar" => "มี.ค.", "Apr" => "เม.ย.", "May" => "พ.ค.", "Jun" => "มิ.ย.", "Jul" => "ก.ค.", "Aug" => "ส.ค.", "Sep" => "ก.ย.", "Oct" => "ต.ค.", "Nov" => "พ.ย.", "Dec" => "ธ.ค."];
    $label = $thMonths[$monthName] ?? $monthName;

    $m = date('m', strtotime($date));
    $y = date('Y', strtotime($date));

    $q = "SELECT
            SUM(CASE WHEN type='INCOME' THEN amount ELSE 0 END) as inc,
            SUM(CASE WHEN type='EXPENSE' THEN amount ELSE 0 END) as exp
          FROM `accounting_transactions`
          WHERE MONTH(transaction_date) = '$m' AND YEAR(transaction_date) = '$y'";
    $resM = safe_query($conn, $q);
    $inc = 0;
    $exp = 0;
    if ($resM && $rowM = $resM->fetch_assoc()) {
        $inc = (float) ($rowM['inc'] ?? 0);
        $exp = (float) ($rowM['exp'] ?? 0);
    }
    $cashFlow[] = ["month" => $label, "income" => $inc, "expense" => $exp];
}

// --- 3. Pending Tasks ---
$tasks = [];
$resTasks = safe_query($conn, "SELECT * FROM `accounting_tasks` ORDER BY priority DESC, due_date ASC LIMIT 5");
if ($resTasks) {
    while ($row = $resTasks->fetch_assoc()) {
        $tasks[] = [
            "id" => "TASK-" . $row['id'],
            "task" => $row['task_name'],
            "status" => $row['status'],
            "dueDate" => $row['due_date'],
            "priority" => $row['priority']
        ];
    }
}

// --- 4. Petty Cash Summary ---
$pettyCashFund = 0.0;
$resFund = safe_query($conn, "SELECT setting_value FROM system_settings WHERE setting_key = 'petty_cash_fund'");
if ($resFund && $rowFund = $resFund->fetch_assoc()) {
    $decodedFund = json_decode($rowFund['setting_value'], true);
    $pettyCashFund = isset($decodedFund['amount']) ? (float) $decodedFund['amount'] : 0.0;
}
$pettyCash = [
    "total" => $pettyCashFund,
    "spent" => 0,
    "remaining" => $pettyCashFund,
    "percent" => 100,
    "stats" => ["pending" => 0, "approved" => 0, "paid" => 0, "clearing" => 0, "all" => 0]
];
$resPC = safe_query($conn, "SELECT SUM(amount) as total FROM `accounting_petty_cash` WHERE status = 'จ่ายแล้ว' AND MONTH(request_date) = MONTH(CURRENT_DATE()) AND YEAR(request_date) = YEAR(CURRENT_DATE())");
if ($resPC && $row = $resPC->fetch_assoc()) {
    $spent = (float) ($row['total'] ?? 0);
    $pettyCash['spent'] = $spent;
    $pettyCash['remaining'] = $pettyCash['total'] - $spent;
    $pettyCash['percent'] = ($pettyCash['total'] > 0) ? round(($pettyCash['remaining'] / $pettyCash['total']) * 100, 1) : 0;
}

$resPCStats = safe_query($conn, "SELECT status, COUNT(*) as cnt FROM `accounting_petty_cash` GROUP BY status");
if ($resPCStats) {
    $totalAll = 0;
    while ($row = $resPCStats->fetch_assoc()) {
        $s = $row['status'];
        $cnt = (int) $row['cnt'];
        $totalAll += $cnt;
        if ($s === 'รออนุมัติ')
            $pettyCash['stats']['pending'] = $cnt;
        else if ($s === 'รอเบิกจ่าย')
            $pettyCash['stats']['approved'] = $cnt;
        else if ($s === 'จ่ายแล้ว')
            $pettyCash['stats']['paid'] = $cnt;
    }
    $pettyCash['stats']['all'] = $totalAll;
}

// "Clearing" tracks reconciliation (clearance_status), not the request status enum
$resPCClearing = safe_query($conn, "SELECT COUNT(*) as cnt FROM `accounting_petty_cash` WHERE clearance_status = 'รอเคลียร์'");
if ($resPCClearing && $row = $resPCClearing->fetch_assoc()) {
    $pettyCash['stats']['clearing'] = (int) $row['cnt'];
}

// --- 5. Sales by Person ---
$salesByPerson = [];
$resSales = safe_query($conn, "SELECT responsible_person as name, SUM(total_amount) as sales FROM `orders` WHERE order_status != 'ยกเลิก' GROUP BY responsible_person ORDER BY sales DESC LIMIT 5");
if ($resSales) {
    while ($row = $resSales->fetch_assoc()) {
        $salesByPerson[] = [
            "name" => $row['name'] ?: "ไม่ระบุ",
            "sales" => (float) $row['sales'],
            "target" => 500000
        ];
    }
}

// --- 6. Sales by Product Type ---
$salesByProductType = [];
$resCat = safe_query($conn, "SELECT product_category as type, SUM(total_amount) as value FROM `orders` WHERE order_status != 'ยกเลิก' GROUP BY product_category ORDER BY value DESC");
if ($resCat) {
    $totalSales = 0;
    $temp = [];
    while ($row = $resCat->fetch_assoc()) {
        $val = (float) $row['value'];
        $totalSales += $val;
        $temp[] = ["type" => $row['type'] ?: "อื่นๆ", "value" => $val];
    }
    foreach ($temp as $t) {
        $t['percentage'] = ($totalSales > 0) ? round(($t['value'] / $totalSales) * 100, 1) : 0;
        $salesByProductType[] = $t;
    }
}

// --- 7. Top 5 Products ---
$topProducts = [];
$resTop = safe_query($conn, "SELECT product_name as name, MAX(item_type) as category, SUM(total_price_item) as sales, SUM(quantity) as orders
                        FROM `order_items`
                        GROUP BY product_name
                        ORDER BY sales DESC LIMIT 5");
if ($resTop) {
    while ($row = $resTop->fetch_assoc()) {
        $topProducts[] = [
            "name" => $row['name'],
            "category" => $row['category'],
            "sales" => (float) $row['sales'],
            "orders" => (int) $row['orders']
        ];
    }
}

// --- 8. Accounts Receivable (ลูกหนี้) ---
$accountsReceivable = [];
$resAR = safe_query($conn, "SELECT customer_name as company, remaining_amount as amount, due_date as dueDate, days_overdue as aging
                      FROM `accounting_customer_accounts`
                      WHERE status != 'ชำระเสร็จสิ้น'
                      ORDER BY days_overdue DESC LIMIT 5");
if ($resAR) {
    while ($row = $resAR->fetch_assoc()) {
        $accountsReceivable[] = [
            "company" => $row['company'],
            "amount" => (float) $row['amount'],
            "dueDate" => $row['dueDate'],
            "aging" => $row['aging'] . " วัน"
        ];
    }
}

// --- 8.1 Accounts Payable (เจ้าหนี้) ---
$accountsPayable = [];
$resAP = safe_query($conn, "SELECT employee as supplier, amount, request_date as dueDate, 'เบิกจ่าย' as type
                      FROM `accounting_petty_cash`
                      WHERE status IN ('รออนุมัติ', 'รอเบิกจ่าย')
                      ORDER BY request_date ASC LIMIT 5");
if ($resAP) {
    while ($row = $resAP->fetch_assoc()) {
        $accountsPayable[] = [
            "supplier" => $row['supplier'],
            "amount" => (float) $row['amount'],
            "dueDate" => $row['dueDate'],
            "type" => $row['type']
        ];
    }
}

// --- 8.2 Recent Activities (Union of transactions and follow-ups) ---
$recentActivities = [];
$resAct = safe_query($conn, "(SELECT type as action, description as detail, 'System' as user, transaction_date as date_sort, DATE_FORMAT(transaction_date, '%H:%i %d/%m/%Y') as time
                        FROM `accounting_transactions`)
                       UNION
                       (SELECT 'AR Follow-up' as action, detail, user_name as user, created_at as date_sort, DATE_FORMAT(created_at, '%H:%i %d/%m/%Y') as time
                        FROM `accounting_ar_follow_ups`)
                       ORDER BY date_sort DESC LIMIT 8");
if ($resAct) {
    while ($row = $resAct->fetch_assoc()) {
        $recentActivities[] = [
            "action" => $row['action'],
            "detail" => $row['detail'],
            "user" => $row['user'],
            "time" => $row['time']
        ];
    }
}

// --- 9. Inventory Overview ---
$inventory = [
    "counts" => ["total" => 0, "ready" => 0, "damaged" => 0, "low" => 0],
    "lowStock" => []
];
$resInv = safe_query($conn, "SELECT
    COUNT(*) as total,
    SUM(CASE WHEN quantity > 0 THEN 1 ELSE 0 END) as ready,
    SUM(CASE WHEN quantity <= min_qty AND quantity > 0 THEN 1 ELSE 0 END) as low
    FROM `office_inventory` ");
if ($resInv && $row = $resInv->fetch_assoc()) {
    $inventory['counts']['total'] = (int) $row['total'];
    $inventory['counts']['ready'] = (int) $row['ready'];
    $inventory['counts']['low'] = (int) $row['low'];
}

$resLow = safe_query($conn, "SELECT item_name as name, 'OFFICE' as code, quantity as stock, min_qty as min, 'Office' as warehouse
                       FROM `office_inventory`
                       WHERE quantity <= min_qty
                       LIMIT 3");
if ($resLow) {
    while ($row = $resLow->fetch_assoc()) {
        $inventory['lowStock'][] = $row;
    }
}

// --- 10. Work Orders Overview ---
$workOrders = [
    "stats" => ["all" => 0, "processing" => 0, "checking" => 0, "closed" => 0, "lowStock" => 0],
    "revenue" => 0,
    "expense" => 0,
    "gp" => 0,
    "margin" => 0
];
$resWO = safe_query($conn, "SELECT order_status, COUNT(*) as cnt, SUM(total_amount) as rev, SUM(paid_amount) as paid FROM `orders` GROUP BY order_status");
if ($resWO) {
    while ($row = $resWO->fetch_assoc()) {
        $st = $row['order_status'];
        $cnt = (int) $row['cnt'];
        $workOrders['stats']['all'] += $cnt;
        $workOrders['revenue'] += (float) $row['rev'];

        if ($st == 'สร้างงานแล้ว')
            $workOrders['stats']['processing'] += $cnt;
        else if ($st == 'ยืนยันคำสั่งซื้อ' || $st == 'ตรวจสอบแล้ว')
            $workOrders['stats']['checking'] += $cnt;
        else if ($st == 'จัดส่งครบแล้ว' || $st == 'ปิดงาน')
            $workOrders['stats']['closed'] += $cnt;
    }
    $workOrders['expense'] = $workOrders['revenue'] * 0.65;
    $workOrders['gp'] = $workOrders['revenue'] - $workOrders['expense'];
    $workOrders['margin'] = ($workOrders['revenue'] > 0) ? round(($workOrders['gp'] / $workOrders['revenue']) * 100, 1) : 0;
}

// --- 11. Top Expense Categories (this month) ---
$topExpenseCategories = [];
$resExpCat = safe_query($conn, "SELECT category, SUM(amount) as total FROM `accounting_transactions`
                          WHERE type = 'EXPENSE' AND MONTH(transaction_date) = MONTH(CURRENT_DATE()) AND YEAR(transaction_date) = YEAR(CURRENT_DATE())
                          GROUP BY category ORDER BY total DESC LIMIT 4");
if ($resExpCat) {
    $expCatRows = [];
    $expCatTotal = 0;
    while ($row = $resExpCat->fetch_assoc()) {
        $amt = (float) $row['total'];
        $expCatTotal += $amt;
        $expCatRows[] = ["name" => $row['category'] ?: "อื่นๆ", "amount" => $amt];
    }
    foreach ($expCatRows as $r) {
        $r['percent'] = ($expCatTotal > 0) ? round(($r['amount'] / $expCatTotal) * 100) : 0;
        $topExpenseCategories[] = $r;
    }
}

// --- 12. Top GP Jobs (same 0.65 expense estimate convention as work_orders.php) ---
$topGPJobs = [];
$resTopGP = safe_query($conn, "SELECT order_id, customer_name, job_name, order_date, total_amount, order_status FROM `orders` ORDER BY total_amount DESC LIMIT 30");
if ($resTopGP) {
    $gpCandidates = [];
    while ($row = $resTopGP->fetch_assoc()) {
        $revenue = (float) $row['total_amount'];
        $expense = $revenue * 0.65;
        $gp = $revenue - $expense;
        $status = $row['order_status'];
        $workStatus = "กำลังดำเนินการ";
        if ($status === 'จัดส่งครบแล้ว' || $status === 'ปิดงาน') {
            $workStatus = "ปิดงาน";
        } elseif ($status === 'ยืนยันคำสั่งซื้อ' || $status === 'ตรวจสอบแล้ว') {
            $workStatus = "ตรวจสอบแล้ว";
        }
        $gpCandidates[] = [
            "id" => "WO-" . date('Y', strtotime($row['order_date'])) . "-" . str_pad($row['order_id'], 3, '0', STR_PAD_LEFT),
            "project" => $row['job_name'] ?: "โปรเจกต์งาน",
            "customer" => $row['customer_name'] ?: "ไม่ระบุชื่อลูกค้า",
            "gp" => $gp,
            "margin" => $revenue > 0 ? round(($gp / $revenue) * 100, 1) : 0,
            "status" => $workStatus,
        ];
    }
    usort($gpCandidates, fn($a, $b) => $b['gp'] <=> $a['gp']);
    $topGPJobs = array_slice($gpCandidates, 0, 5);
}

// --- 13. AR / AP Summary (total pending, not just top 5) ---
$arSummary = ["total" => 0, "count" => 0];
$resARSum = safe_query($conn, "SELECT COUNT(*) as cnt, SUM(remaining_amount) as total FROM `accounting_customer_accounts` WHERE status != 'ชำระเสร็จสิ้น'");
if ($resARSum && $row = $resARSum->fetch_assoc()) {
    $arSummary['count'] = (int) $row['cnt'];
    $arSummary['total'] = (float) $row['total'];
}

$apSummary = ["total" => 0, "count" => 0];
$resAPSum = safe_query($conn, "SELECT COUNT(*) as cnt, SUM(amount) as total FROM `accounting_petty_cash` WHERE status IN ('รออนุมัติ', 'รอเบิกจ่าย')");
if ($resAPSum && $row = $resAPSum->fetch_assoc()) {
    $apSummary['count'] = (int) $row['cnt'];
    $apSummary['total'] = (float) $row['total'];
}

// --- 14. Office Assets Overview ---
$officeAssets = [
    "counts" => ["total" => 0, "active" => 0, "available" => 0, "repair" => 0],
    "byCategory" => [],
    "totalValue" => 0
];
$resOA = safe_query($conn, "SELECT
    COUNT(*) as total,
    SUM(CASE WHEN status = 'ใช้งานอยู่' THEN 1 ELSE 0 END) as active,
    SUM(CASE WHEN status = 'ว่าง' THEN 1 ELSE 0 END) as available,
    SUM(CASE WHEN status = 'ส่งซ่อม' THEN 1 ELSE 0 END) as repair,
    SUM(price) as total_value
    FROM `accounting_office_assets`");
if ($resOA && $row = $resOA->fetch_assoc()) {
    $officeAssets['counts']['total'] = (int) $row['total'];
    $officeAssets['counts']['active'] = (int) $row['active'];
    $officeAssets['counts']['available'] = (int) $row['available'];
    $officeAssets['counts']['repair'] = (int) $row['repair'];
    $officeAssets['totalValue'] = (float) $row['total_value'];
}
$resOACat = safe_query($conn, "SELECT category, COUNT(*) as cnt FROM `accounting_office_assets` GROUP BY category ORDER BY cnt DESC");
if ($resOACat) {
    $total = $officeAssets['counts']['total'];
    while ($row = $resOACat->fetch_assoc()) {
        $cnt = (int) $row['cnt'];
        $officeAssets['byCategory'][] = [
            "name" => $row['category'],
            "count" => $cnt,
            "percent" => $total > 0 ? round(($cnt / $total) * 100) : 0,
        ];
    }
}

// --- 15. Office Supplies Overview ---
$officeSupplies = [
    "counts" => ["total" => 0, "lowStock" => 0],
    "totalValue" => 0,
    "monthlyRequisitionValue" => 0,
    "recentRequisitions" => []
];
$resOS = safe_query($conn, "SELECT
    COUNT(*) as total,
    SUM(CASE WHEN quantity <= min_stock THEN 1 ELSE 0 END) as low_stock,
    SUM(quantity * price_per_unit) as total_value
    FROM `accounting_office_supplies`");
if ($resOS && $row = $resOS->fetch_assoc()) {
    $officeSupplies['counts']['total'] = (int) $row['total'];
    $officeSupplies['counts']['lowStock'] = (int) $row['low_stock'];
    $officeSupplies['totalValue'] = (float) $row['total_value'];
}
$resOSReq = safe_query($conn, "SELECT SUM(r.quantity * s.price_per_unit) as total FROM `accounting_office_requisitions` r
                          JOIN `accounting_office_supplies` s ON s.id = r.supply_id
                          WHERE MONTH(r.requisition_date) = MONTH(CURRENT_DATE()) AND YEAR(r.requisition_date) = YEAR(CURRENT_DATE())");
if ($resOSReq && $row = $resOSReq->fetch_assoc()) {
    $officeSupplies['monthlyRequisitionValue'] = (float) ($row['total'] ?? 0);
}
$resOSRecent = safe_query($conn, "SELECT r.quantity, r.requester, r.requisition_date, s.name as supply_name, s.unit
                            FROM `accounting_office_requisitions` r
                            JOIN `accounting_office_supplies` s ON s.id = r.supply_id
                            ORDER BY r.requisition_date DESC, r.created_at DESC LIMIT 3");
if ($resOSRecent) {
    while ($row = $resOSRecent->fetch_assoc()) {
        $officeSupplies['recentRequisitions'][] = [
            "item" => $row['supply_name'],
            "requester" => $row['requester'],
            "qty" => $row['quantity'] . " " . $row['unit'],
            "date" => date('d/m', strtotime($row['requisition_date'])),
        ];
    }
}

echo json_encode([
    "status" => "success",
    "data" => [
        "stats" => $stats,
        "cashFlow" => $cashFlow,
        "tasks" => $tasks,
        "pettyCash" => $pettyCash,
        "salesByPerson" => $salesByPerson,
        "salesByProductType" => $salesByProductType,
        "topProducts" => $topProducts,
        "accountsReceivable" => $accountsReceivable,
        "accountsPayable" => $accountsPayable,
        "recentActivities" => $recentActivities,
        "inventory" => $inventory,
        "workOrders" => $workOrders,
        "topExpenseCategories" => $topExpenseCategories,
        "topGPJobs" => $topGPJobs,
        "arSummary" => $arSummary,
        "apSummary" => $apSummary,
        "officeAssets" => $officeAssets,
        "officeSupplies" => $officeSupplies
    ]
]);

$conn->close();
?>
