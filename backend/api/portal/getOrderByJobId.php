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

// Global error handlers
set_exception_handler(function ($e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
    exit();
});
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
});
register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => $err['message']]);
    }
});

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method Not Allowed"]);
    exit();
}

// Validate job_id param
if (empty($_GET['job_id'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "job_id parameter is required"]);
    exit();
}

$job_id = trim($_GET['job_id']);

// Connect to DB — try portal-relative path first, then fallback
$condb_paths = [
    __DIR__ . '/../../condb.php',       // backend/condb.php (local dev)
    __DIR__ . '/../../../condb.php',    // one level up (server variant)
    '/home/nacresc1/public_html/api-lucky/condb.php',  // absolute server path (common cPanel)
];
$connected = false;
foreach ($condb_paths as $path) {
    if (file_exists($path)) {
        require $path;
        $connected = true;
        break;
    }
}
if (!$connected) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database config not found"]);
    exit();
}

/** @var mysqli $conn */
// Try selecting the correct database (server uses nacresc1_1)
@$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

// Fetch order by job_id
$stmt = $conn->prepare("SELECT * FROM orders WHERE job_id = ? LIMIT 1");
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "DB prepare failed: " . $conn->error]);
    exit();
}
$stmt->bind_param("s", $job_id);
$stmt->execute();
$order = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$order) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "ไม่พบคำสั่งซื้อ: $job_id"]);
    exit();
}

$order_id = $order['order_id'] ?? $order['id'] ?? null;

// Compatibility aliases
$order_status  = $order['order_status'] ?? ($order['status'] ?? 'สร้างคำสั่งซื้อใหม่');
$total_price   = floatval($order['total_price'] ?? ($order['total_amount'] ?? 0));
$need_tax      = intval($order['require_tax_invoice'] ?? ($order['needs_tax_invoice'] ?? 0));
$paid_amount   = floatval($order['paid_amount'] ?? 0);
$delivery_cost = floatval($order['delivery_cost'] ?? 0);

// Fetch order items (map to cartItems format expected by Payment.tsx)
$items = [];
if ($order_id) {
    $items_stmt = $conn->prepare(
        "SELECT *,
         COALESCE(unit_price, price, 0)                  AS unit_price,
         COALESCE(total_price_item, price * quantity, 0)  AS total_price_item
         FROM order_items WHERE order_id = ? ORDER BY item_id ASC"
    );
    if ($items_stmt) {
        $items_stmt->bind_param("i", $order_id);
        $items_stmt->execute();
        $items_result = $items_stmt->get_result();
        while ($row = $items_result->fetch_assoc()) {
            $details = [];
            if (!empty($row['details'])) {
                $decoded = json_decode($row['details'], true);
                $details = $decoded !== null ? $decoded : [];
            }
            $unit_price = floatval($row['unit_price'] ?? $row['price'] ?? 0);
            $qty        = intval($row['quantity'] ?? 1);

            // Map to cartItems[].product structure expected by Payment.tsx
            $items[] = [
                "product" => [
                    "id"          => intval($row['item_id'] ?? $row['id'] ?? 0),
                    "brand"       => $row['product_code'] ?? '',
                    "name"        => $row['product_name'] ?? '',
                    "image"       => $row['image_url'] ?? '',
                    "price"       => $unit_price,
                    "size"        => $row['size'] ?? null,
                    "color"       => $row['color'] ?? null,
                    "productType" => $row['item_type'] === 'custom' ? '2' : '1',
                ],
                "quantity" => $qty,
            ];
        }
        $items_stmt->close();
    }
}

// Fetch order payments
$payments = [];
if ($order_id) {
    $pay_stmt = $conn->prepare(
        "SELECT * FROM order_payments WHERE order_id = ? ORDER BY id ASC"
    );
    if ($pay_stmt) {
        $pay_stmt->bind_param("i", $order_id);
        $pay_stmt->execute();
        while ($row = $pay_stmt->get_result()->fetch_assoc()) {
            $payments[] = $row;
        }
        $pay_stmt->close();
    }
}

// Build OrderDetails object matching Payment.tsx interface
$orderDetails = [
    "orderRef"  => $order['job_id'] ?? '',
    "orderId"   => (string)($order['order_id'] ?? ''),
    "totalPrice" => $total_price,
    "customerInfo" => [
        "fullName"       => $order['customer_name'] ?? '',
        "lineId"         => $order['customer_line'] ?? '',
        "phone"          => $order['customer_phone'] ?? '',
        "email"          => $order['customer_email'] ?? '',
        "address"        => $order['delivery_address'] ?? ($order['customer_address'] ?? ''),
        "needTaxInvoice"  => (bool)$need_tax,
        "companyName"    => $order['tax_payer_name'] ?? null,
        "taxId"          => $order['tax_id'] ?? null,
        "companyAddress" => $order['tax_address'] ?? null,
        "usageDate"      => $order['usage_date'] ?? null,
        "deliveryMethod" => $order['delivery_method'] ?? null,
    ],
    "cartItems"  => $items,
    // Extra info for display
    "orderStatus"  => $order_status,
    "paidAmount"   => $paid_amount,
    "deliveryCost" => $delivery_cost,
    "jobName"      => $order['job_name'] ?? '',
    "deliveryDate" => $order['delivery_date'] ?? null,
    "payments"     => $payments,
];

echo json_encode([
    "success"      => true,
    "orderDetails" => $orderDetails,
]);
exit();
