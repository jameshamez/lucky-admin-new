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

$type = $_GET['type'] ?? 'summary';

if ($type === 'summary') {
    // Reports dashboard summary
    $data = [
        "monthlySales" => 0,
        "monthlySalesChange" => "+0%",
        "stockValue" => 0,
        "stockChange" => "+0%",
        "officeValue" => 0,
        "officeChange" => "+0%",
        "pettyCashSpent" => 0,
        "pettyCashChange" => "+0%"
    ];

    // 1. Monthly Sales
    $res = $conn->query("SELECT SUM(total_amount) as total FROM `orders` WHERE MONTH(order_date) = MONTH(CURRENT_DATE()) AND YEAR(order_date) = YEAR(CURRENT_DATE())");
    $row = $res->fetch_assoc();
    $data['monthlySales'] = (float) ($row['total'] ?? 0);

    // 2. Stock Value (Using office_inventory as proxy for now if no production inventory table is visible)
    // Actually, let's check for office supplies first
    $res = $conn->query("SELECT SUM(quantity * price_per_unit) as total FROM `accounting_office_supplies` ");
    $row = $res->fetch_assoc();
    $data['officeValue'] = (float) ($row['total'] ?? 0);

    // 3. Petty Cash Spent
    $res = $conn->query("SELECT SUM(amount) as total FROM `accounting_petty_cash` WHERE status = 'PAID' AND MONTH(request_date) = MONTH(CURRENT_DATE())");
    $row = $res->fetch_assoc();
    $data['pettyCashSpent'] = (float) ($row['total'] ?? 0);

    echo json_encode(["status" => "success", "data" => $data]);
} else if ($type === 'sales') {
    // Detailed sales report
    // 1. Monthly Chart (Reusing revenue logic)
    $monthlyData = [];
    for ($i = 5; $i >= 0; $i--) {
        $monthStr = date('Y-m', strtotime("-$i months"));
        $monthLabel = date('M', strtotime($monthStr));
        $thMonths = ["Jan" => "ม.ค.", "Feb" => "ก.พ.", "Mar" => "มี.ค.", "Apr" => "เม.ย.", "May" => "พ.ค.", "Jun" => "มิ.ย.", "Jul" => "ก.ค.", "Aug" => "ส.ค.", "Sep" => "ก.ย.", "Oct" => "ต.ค.", "Nov" => "พ.ย.", "Dec" => "ธ.ค."];
        $label = $thMonths[$monthLabel] ?? $monthLabel;

        $res = $conn->query("SELECT SUM(total_amount) as actual FROM `orders` WHERE order_date LIKE '$monthStr%'");
        $row = $res->fetch_assoc();
        $monthlyData[] = ["month" => $label, "actual" => (float) ($row['actual'] ?? 0), "target" => 500000];
    }

    // 2. Top Products
    $topProducts = [];
    $res = $conn->query("SELECT product_name as name, SUM(quantity) as quantity, SUM(total_price_item) as value 
                        FROM `order_items` 
                        GROUP BY product_name 
                        ORDER BY value DESC LIMIT 10");
    if ($res) {
        $rank = 1;
        while ($row = $res->fetch_assoc()) {
            $row['rank'] = $rank++;
            $row['quantity'] = (int) $row['quantity'];
            $row['value'] = (float) $row['value'];
            $topProducts[] = $row;
        }
    }

    // 3. Daily Sales
    $dailySales = [];
    $res = $conn->query("SELECT DATE(order_date) as date, COUNT(*) as orders, SUM(total_amount) as value, MAX(responsible_person) as salesperson 
                        FROM `orders` 
                        GROUP BY DATE(order_date) 
                        ORDER BY date DESC LIMIT 30");
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $row['orders'] = (int) $row['orders'];
            $row['value'] = (float) $row['value'];
            $dailySales[] = $row;
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "monthlyData" => $monthlyData,
            "topProducts" => $topProducts,
            "dailySales" => $dailySales
        ]
    ]);
} else if ($type === 'inventory') {
    // Inventory Report
    $res = $conn->query("SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN quantity > min_stock THEN 1 ELSE 0 END) as ready,
        SUM(CASE WHEN quantity <= min_stock AND quantity > 0 THEN 1 ELSE 0 END) as low,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(quantity * price_per_unit) as total_value
        FROM `accounting_office_supplies` ");
    $stats = $res->fetch_assoc();

    $totalVal = (float) ($stats['total_value'] ?? 0);

    $list = [];
    $res = $conn->query("SELECT id, code, name, category, quantity, min_stock, price_per_unit FROM `accounting_office_supplies` ");
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $qty = (int) $row['quantity'];
            $min = (int) $row['min_stock'];
            $status = "พร้อมขาย";
            if ($qty == 0)
                $status = "หมดสต๊อก";
            else if ($qty <= $min)
                $status = "ต่ำกว่า Min";

            $list[] = [
                "code" => $row['code'],
                "name" => $row['name'],
                "category" => $row['category'],
                "quantity" => $qty,
                "minStock" => $min,
                "value" => $qty * (float) $row['price_per_unit'],
                "status" => $status
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "summary" => [
                ["title" => "มูลค่าสต๊อกรวม", "value" => "฿" . number_format($totalVal), "color" => "text-blue-600"],
                ["title" => "สินค้าพร้อมขาย", "value" => (int) ($stats['ready'] ?? 0) . " รายการ", "color" => "text-green-600"],
                ["title" => "ต่ำกว่า Min", "value" => (int) ($stats['low'] ?? 0) . " รายการ", "color" => "text-yellow-600"],
                ["title" => "สินค้าหมด", "value" => (int) ($stats['out_of_stock'] ?? 0) . " รายการ", "color" => "text-red-600"],
            ],
            "statusData" => [
                ["name" => "พร้อมขาย", "value" => (int) ($stats['ready'] ?? 0), "color" => "hsl(var(--primary))"],
                ["name" => "ต่ำกว่า Min", "value" => (int) ($stats['low'] ?? 0), "color" => "#fbbf24"],
                ["name" => "หมดสต๊อก", "value" => (int) ($stats['out_of_stock'] ?? 0), "color" => "#ef4444"],
            ],
            "inventoryList" => $list
        ]
    ]);
} else if ($type === 'petty_cash') {
    // Petty Cash Report
    $res = $conn->query("SELECT 
        SUM(amount) as total_spent,
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as paid_amount,
        SUM(CASE WHEN status != 'PAID' AND status != 'REJECTED' THEN amount ELSE 0 END) as pending_amount
        FROM `accounting_petty_cash` 
        WHERE MONTH(request_date) = MONTH(CURRENT_DATE())");
    $stats = $res->fetch_assoc();

    $paidAmount = (float) ($stats['paid_amount'] ?? 0);
    $pendingAmount = (float) ($stats['pending_amount'] ?? 0);

    $history = [];
    $res = $conn->query("SELECT * FROM `accounting_petty_cash` ORDER BY request_date DESC LIMIT 50");
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $history[] = [
                "id" => $row['id'],
                "date" => $row['request_date'],
                "requester" => $row['requester_name'],
                "purpose" => $row['purpose'],
                "amount" => (float) $row['amount'],
                "status" => $row['status']
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "summary" => [
                ["label" => "ยอดใช้จ่ายเดือนนี้", "value" => "฿" . number_format($paidAmount), "change" => "+0%", "icon" => "Briefcase"],
                ["label" => "รอการเบิกจ่าย", "value" => "฿" . number_format($pendingAmount), "change" => "0 รายการ", "icon" => "FileText"],
                ["label" => "จำนวนรายการ", "value" => (int) ($stats['total_requests'] ?? 0), "change" => "เดือนนี้", "icon" => "Search"],
            ],
            "history" => $history
        ]
    ]);
} else if ($type === 'office_equipment') {
    $res = $conn->query("SELECT 
        COUNT(*) as total_items,
        SUM(CASE WHEN status = 'ใช้งานอยู่' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'ส่งซ่อม' THEN 1 ELSE 0 END) as broken,
        SUM(price) as total_value
        FROM `accounting_office_assets` ");
    $stats = $res->fetch_assoc();

    $totalValue = (float) ($stats['total_value'] ?? 0);

    $list = [];
    $res = $conn->query("SELECT * FROM `accounting_office_assets` ");
    if ($res) {
        while ($row = $res->fetch_assoc()) {
            $list[] = [
                "assetNo" => $row['asset_id'],
                "name" => $row['name'],
                "category" => $row['category'],
                "purchaseDate" => $row['purchase_date'],
                "price" => (float) $row['price'],
                "status" => $row['status'],
                "assignedTo" => $row['assigned_to'] ?? "-",
                "hasImage" => false
            ];
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => [
            "summary" => [
                ["title" => "มูลค่าทรัพย์สินรวม", "value" => "฿" . number_format($totalValue), "color" => "text-blue-600"],
                ["title" => "อุปกรณ์ทั้งหมด", "value" => ($stats['total_items'] ?? 0) . " รายการ", "color" => "text-green-600"],
                ["title" => "ใช้งานอยู่", "value" => ($stats['active'] ?? 0) . " รายการ", "color" => "text-green-600"],
                ["title" => "ชำรุด/ซ่อมบำรุง", "value" => ($stats['broken'] ?? 0) . " รายการ", "color" => "text-yellow-600"],
            ],
            "list" => $list
        ]
    ]);
}

$conn->close();
?>