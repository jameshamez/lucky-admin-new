<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Global handler: catch any uncaught exception/error → return JSON
set_exception_handler(function ($e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage(), "line" => $e->getLine(), "file" => basename($e->getFile())]);
    exit();
});
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
});
register_shutdown_function(function () {
    $err = error_get_last();
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $err['message'], "line" => $err['line']]);
    }
});

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

// Parse ID from URL or query string
$request_uri = $_SERVER['REQUEST_URI'];
$path_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
$id = null;
foreach ($path_parts as $key => $part) {
    if (($part === 'orders.php') && isset($path_parts[$key + 1]) && is_numeric($path_parts[$key + 1])) {
        $id = intval($path_parts[$key + 1]);
    }
}
if (!$id && isset($_GET['id'])) {
    $id = intval($_GET['id']);
}

// ==================== GET ====================
if ($method === 'GET') {

    if ($id) {
        // ดึงคำสั่งซื้อเดี่ยว พร้อม items และ payments
        $sql = "SELECT * FROM orders WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $order = $stmt->get_result()->fetch_assoc();

        if (!$order) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Order not found"]);
            exit();
        }

        // === Compatibility: merge legacy columns → ชื่อใหม่ ===
        $order['order_status'] = $order['order_status'] ?? ($order['status'] ?? 'สร้างคำสั่งซื้อใหม่');
        $order['total_amount'] = $order['total_amount'] ?? ($order['total_price'] ?? 0);
        $order['require_tax_invoice'] = $order['require_tax_invoice'] ?? ($order['needs_tax_invoice'] ?? 0);
        $order['paid_amount'] = $order['paid_amount'] ?? 0;

        // order items
        // รองรับทั้ง PK ชื่อ `id` และ `item_id` (เดิม)
        $items_stmt = $conn->prepare(
            "SELECT *,
             COALESCE(unit_price, price, 0)                 AS unit_price,
             COALESCE(total_price_item, price * quantity, 0) AS total_price
             FROM order_items WHERE order_id = ? ORDER BY item_id ASC"
        );
        $items_stmt->bind_param("i", $id);
        $items_stmt->execute();
        $items_result = $items_stmt->get_result();
        $items = [];
        while ($row = $items_result->fetch_assoc()) {
            if (!empty($row['details'])) {
                $row['details'] = json_decode($row['details'], true);
            }
            // ใช้ item_id เป็น id ถ้า id ไม่มี
            if (!isset($row['id']) && isset($row['item_id'])) {
                $row['id'] = $row['item_id'];
            }
            $items[] = $row;
        }

        // order payments
        $pay_stmt = $conn->prepare("SELECT * FROM order_payments WHERE order_id = ? ORDER BY id ASC");
        $pay_stmt->bind_param("i", $id);
        $pay_stmt->execute();
        $payments = [];
        while ($row = $pay_stmt->get_result()->fetch_assoc()) {
            $payments[] = $row;
        }

        // parse departments JSON
        if (!empty($order['departments'])) {
            $order['departments'] = json_decode($order['departments'], true);
        }

        $order['items'] = $items;
        $order['payments'] = $payments;

        echo json_encode(["status" => "success", "data" => $order]);
        exit();
    }

    // ดึงรายการคำสั่งซื้อทั้งหมด พร้อม filter และ pagination
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? min(100, intval($_GET['limit'])) : 20;
    $offset = ($page - 1) * $limit;

    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $order_status = isset($_GET['order_status']) ? trim($_GET['order_status']) : '';
    $payment_status = isset($_GET['payment_status']) ? trim($_GET['payment_status']) : '';
    $product_cat = isset($_GET['product_category']) ? trim($_GET['product_category']) : '';
    $delivery_method = isset($_GET['delivery_method']) ? trim($_GET['delivery_method']) : '';
    $payment_method = isset($_GET['payment_method']) ? trim($_GET['payment_method']) : '';
    $date_from = isset($_GET['date_from']) ? trim($_GET['date_from']) : '';
    $date_to = isset($_GET['date_to']) ? trim($_GET['date_to']) : '';

    $where = [];
    $params = [];
    $types = '';

    if ($search !== '') {
        $like = '%' . $search . '%';
        $where[] = "(job_id LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ? OR customer_line LIKE ? OR job_name LIKE ?)";
        $params = array_merge($params, [$like, $like, $like, $like, $like]);
        $types .= 'sssss';
    }
    if ($order_status !== '') {
        $where[] = "order_status = ?";
        $params[] = $order_status;
        $types .= 's';
    }
    if ($payment_status !== '') {
        $where[] = "payment_status = ?";
        $params[] = $payment_status;
        $types .= 's';
    }
    if ($product_cat !== '') {
        $where[] = "product_category = ?";
        $params[] = $product_cat;
        $types .= 's';
    }
    if ($delivery_method !== '') {
        $where[] = "delivery_method = ?";
        $params[] = $delivery_method;
        $types .= 's';
    }
    if ($payment_method !== '') {
        $where[] = "payment_method = ?";
        $params[] = $payment_method;
        $types .= 's';
    }
    if ($date_from !== '') {
        $where[] = "order_date >= ?";
        $params[] = $date_from;
        $types .= 's';
    }
    if ($date_to !== '') {
        $where[] = "order_date <= ?";
        $params[] = $date_to;
        $types .= 's';
    }

    $where_sql = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

    // Count total
    $count_sql = "SELECT COUNT(*) AS total FROM orders $where_sql";
    if (!empty($params)) {
        $count_stmt = $conn->prepare($count_sql);
        $count_stmt->bind_param($types, ...$params);
        $count_stmt->execute();
        $total = $count_stmt->get_result()->fetch_assoc()['total'];
    } else {
        $total = $conn->query($count_sql)->fetch_assoc()['total'];
    }

    // Get paginated orders
    $data_sql = "SELECT * FROM orders $where_sql ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $data_params = array_merge($params, [$limit, $offset]);
    $data_types = $types . 'ii';

    $data_stmt = $conn->prepare($data_sql);
    if (!empty($data_params)) {
        $data_stmt->bind_param($data_types, ...$data_params);
    }
    $data_stmt->execute();
    $result = $data_stmt->get_result();

    $orders = [];
    while ($row = $result->fetch_assoc()) {
        if (!empty($row['departments'])) {
            $row['departments'] = json_decode($row['departments'], true);
        }
        // Compatibility: ใช้คอลัมน์ใหม่ก่อน fallback คอลัมน์เดิม
        $row['order_status'] = $row['order_status'] ?? ($row['status'] ?? 'สร้างคำสั่งซื้อใหม่');
        $row['total_amount'] = $row['total_amount'] ?? ($row['total_price'] ?? 0);
        $row['require_tax_invoice'] = $row['require_tax_invoice'] ?? ($row['needs_tax_invoice'] ?? 0);
        $row['paid_amount'] = $row['paid_amount'] ?? 0;
        $row['payment_status'] = $row['payment_status'] ?? 'รอชำระเงิน';
        $orders[] = $row;
    }

    // Summary stats (all orders without limit for cards)
    // ใช้ COALESCE รองรับทั้งคอลัมน์เดิมและใหม่
    $stats_sql = "SELECT
        COALESCE(order_status, status, 'สร้างคำสั่งซื้อใหม่') AS order_status,
        COALESCE(payment_status, 'รอชำระเงิน') AS payment_status,
        COALESCE(total_amount, total_price, 0) AS total_amount,
        COALESCE(paid_amount, 0) AS paid_amount
    FROM orders $where_sql";
    if (!empty($params)) {
        $stats_stmt = $conn->prepare($stats_sql);
        $stats_stmt->bind_param($types, ...$params);
        $stats_stmt->execute();
        $stats_result = $stats_stmt->get_result();
    } else {
        $stats_result = $conn->query($stats_sql);
    }

    $status_counts = ['request' => 0, 'draft' => 0, 'confirmed' => 0, 'jobCreated' => 0];
    $payment_counts = ['partial' => 0, 'pending' => 0, 'credit' => 0];
    $total_revenue = 0;
    $total_paid = 0;

    while ($row = $stats_result->fetch_assoc()) {
        $total_revenue += floatval($row['total_amount']);
        $total_paid += floatval($row['paid_amount']);
        switch ($row['order_status']) {
            case 'ส่งคำขอสั่งซื้อ':
                $status_counts['request']++;
                break;
            case 'สร้างคำสั่งซื้อใหม่':
                $status_counts['draft']++;
                break;
            case 'ยืนยันคำสั่งซื้อ':
                $status_counts['confirmed']++;
                break;
            case 'สร้างงานแล้ว':
                $status_counts['jobCreated']++;
                break;
        }
        switch ($row['payment_status']) {
            case 'ชำระบางส่วน':
                $payment_counts['partial']++;
                break;
            case 'รอชำระเงิน':
                $payment_counts['pending']++;
                break;
            case 'เครดิต':
                $payment_counts['credit']++;
                break;
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => $orders,
        "pagination" => [
            "total" => intval($total),
            "page" => $page,
            "limit" => $limit,
            "totalPages" => ceil($total / $limit),
        ],
        "summary" => [
            "statusCounts" => $status_counts,
            "paymentCounts" => $payment_counts,
            "totalRevenue" => $total_revenue,
            "totalPaid" => $total_paid,
        ],
    ]);
    exit();
}

// ==================== POST ====================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (empty($data)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Request body is empty"]);
        exit();
    }

    // Auto-generate job_id if not provided
    if (empty($data['job_id'])) {
        $year = date('Y');
        $count_sql = "SELECT COUNT(*) AS cnt FROM orders WHERE YEAR(order_date) = ?";
        $count_stmt = $conn->prepare($count_sql);
        $count_stmt->bind_param("s", $year);
        $count_stmt->execute();
        $count = $count_stmt->get_result()->fetch_assoc()['cnt'];
        $data['job_id'] = 'JOB-' . $year . '-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);
    }

    // Validate required fields
    if (empty($data['customer_name'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "customer_name is required"]);
        exit();
    }

    $departments_json = !empty($data['departments']) ? json_encode($data['departments']) : null;

    $sql = "INSERT INTO orders (
        job_id, quotation_number, order_date, responsible_person,
        customer_id, customer_name, customer_phone, customer_line, customer_email, customer_address,
        needs_tax_invoice, tax_payer_name, tax_id, tax_address,
        urgency_level, job_name, event_location, usage_date, delivery_date,
        product_category, product_type, budget, sales_channel,
        subtotal, delivery_cost, vat_amount, total_amount, total_price,
        payment_method, payment_status, paid_amount,
        delivery_type, delivery_recipient, delivery_phone, delivery_address, preferred_delivery_date,
        status, job_created, departments, notes
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
        exit();
    }

    // Assign all values to real variables (bind_param requires references)
    $v_job_id = $data['job_id'];
    $v_quotation_number = $data['quotation_number'] ?? null;
    $v_order_date = $data['order_date'] ?? date('Y-m-d');
    $v_responsible_person = $data['responsible_person'] ?? '';
    $v_customer_id = isset($data['customer_id']) ? intval($data['customer_id']) : 0; // must be int for bind_param 'i'
    $v_customer_name = $data['customer_name'];
    $v_customer_phone = $data['customer_phone'] ?? '';
    $v_customer_line = $data['customer_line'] ?? '';
    $v_customer_email = $data['customer_email'] ?? '';
    $v_customer_address = $data['customer_address'] ?? null;
    $v_require_tax_invoice = intval($data['require_tax_invoice'] ?? 0);
    $v_tax_payer_name = $data['tax_payer_name'] ?? null;
    $v_tax_id = $data['tax_id'] ?? null;
    $v_tax_address = $data['tax_address'] ?? null;
    $v_urgency_level = $data['urgency_level'] ?? 'ปกติ';
    $v_job_name = $data['job_name'] ?? '';
    $v_event_location = $data['event_location'] ?? null;
    $v_usage_date = (!empty($data['usage_date'])) ? $data['usage_date'] : null;
    $v_delivery_date = (!empty($data['delivery_date'])) ? $data['delivery_date'] : null;
    $v_product_category = $data['product_category'] ?? '';
    $v_product_type = $data['product_type'] ?? '';
    $v_budget = isset($data['budget']) && $data['budget'] !== null ? floatval($data['budget']) : 0.0; // must be float for bind_param 'd'
    $v_sales_channel = $data['sales_channel'] ?? null;
    $v_subtotal = floatval($data['subtotal'] ?? 0);
    $v_delivery_cost = floatval($data['delivery_cost'] ?? 0);
    $v_vat_amount = floatval($data['vat_amount'] ?? 0);
    $v_total_amount = floatval($data['total_amount'] ?? 0);
    $v_payment_method = $data['payment_method'] ?? '';
    $v_payment_status = $data['payment_status'] ?? 'รอชำระเงิน';
    $v_paid_amount = floatval($data['paid_amount'] ?? 0);
    $v_delivery_type = $data['delivery_type'] ?? 'parcel';
    $v_delivery_recipient = $data['delivery_recipient'] ?? null;
    $v_delivery_phone = $data['delivery_phone'] ?? null;
    $v_delivery_address = $data['delivery_address'] ?? null;
    $v_preferred_delivery_date = $data['preferred_delivery_date'] ?? null;
    $v_order_status = $data['order_status'] ?? 'สร้างคำสั่งซื้อใหม่';
    $v_job_created = intval($data['job_created'] ?? 0);
    $v_notes = $data['notes'] ?? null;

    $stmt->bind_param(
        "ssssisssssissssssssssdsddddssdssssssiiss",
        $v_job_id,
        $v_quotation_number,
        $v_order_date,
        $v_responsible_person,
        $v_customer_id,
        $v_customer_name,
        $v_customer_phone,
        $v_customer_line,
        $v_customer_email,
        $v_customer_address,
        $v_require_tax_invoice,
        $v_tax_payer_name,
        $v_tax_id,
        $v_tax_address,
        $v_urgency_level,
        $v_job_name,
        $v_event_location,
        $v_usage_date,
        $v_delivery_date,
        $v_product_category,
        $v_product_type,
        $v_budget,
        $v_sales_channel,
        $v_subtotal,
        $v_delivery_cost,
        $v_vat_amount,
        $v_total_amount,
        $v_total_amount, // For total_price
        $v_payment_method,
        $v_payment_status,
        $v_paid_amount,
        $v_delivery_type,
        $v_delivery_recipient,
        $v_delivery_phone,
        $v_delivery_address,
        $v_preferred_delivery_date,
        $v_order_status,
        $v_job_created,
        $departments_json,
        $v_notes
    );

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
        exit();
    }

    $order_id = $conn->insert_id;

    // Insert order items
    if (!empty($data['items']) && is_array($data['items'])) {
        $item_sql = "INSERT INTO order_items (order_id, product_id, item_type, product_name, product_code, material, size, color, quantity, price, unit_price, total_price_item, details)
                      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";
        $item_stmt = $conn->prepare($item_sql);

        foreach ($data['items'] as $item) {
            // PHP 8.1+: null not allowed for 'i' or 'd' type in bind_param
            $i_product_id = isset($item['product_id']) && $item['product_id'] !== null ? intval($item['product_id']) : 0;
            $i_item_type = $item['item_type'] ?? 'custom';
            $i_product_name = $item['product_name'] ?? '';
            $i_product_code = $item['product_code'] ?? null;
            $i_material = $item['material'] ?? null;
            $i_size = $item['size'] ?? null;
            $i_color = $item['color'] ?? null;
            $i_qty = intval($item['quantity'] ?? 0);
            $i_unit_price = floatval($item['unit_price'] ?? 0);
            $i_total_price = floatval($item['total_price'] ?? ($i_qty * $i_unit_price));

            $i_details_json = !empty($item['details']) ? json_encode($item['details']) : null;

            $item_stmt->bind_param(
                "iissssssidds" . "s",
                $order_id,
                $i_product_id,
                $i_item_type,
                $i_product_name,
                $i_product_code,
                $i_material,
                $i_size,
                $i_color,
                $i_qty,
                $i_unit_price, // for `price`
                $i_unit_price, // for `unit_price`
                $i_total_price, // for `total_price_item`
                $i_details_json
            );
            if (!$item_stmt->execute()) {
                error_log("Item insert error: " . $item_stmt->error);
            }
        }
    }

    // Insert payment records
    if (!empty($data['payments']) && is_array($data['payments'])) {
        $pay_sql = "INSERT INTO order_payments (order_id, payment_type, payment_label, amount, transfer_date, slip_url, additional_details)
                     VALUES (?,?,?,?,?,?,?)";
        $pay_stmt = $conn->prepare($pay_sql);

        foreach ($data['payments'] as $payment) {
            $p_type = $payment['type'] ?? 'deposit';
            $p_label = $payment['typeLabel'] ?? null;
            $p_amount = floatval($payment['amount'] ?? 0);
            $p_transfer_date = $payment['transferDate'] ?? null;
            $p_slip_url = $payment['slipUrl'] ?? null;
            $p_additional_details = $payment['additionalDetails'] ?? null;

            $pay_stmt->bind_param(
                "issdss" . "s",
                $order_id,
                $p_type,
                $p_label,
                $p_amount,
                $p_transfer_date,
                $p_slip_url,
                $p_additional_details
            );
            $pay_stmt->execute();
        }
    }

    http_response_code(201);
    echo json_encode([
        "status" => "success",
        "message" => "Order created successfully",
        "id" => $order_id,
        "job_id" => $data['job_id'],
    ]);
    exit();
}

// ==================== PUT (Update) ====================
if ($method === 'PUT') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Order ID is required"]);
        exit();
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Request body is empty"]);
        exit();
    }

    // Build dynamic update
    $fields = [];
    $params = [];
    $types = '';

    $allowed_fields = [
        'customer_id',
        'subtotal',
        'delivery_cost',
        'vat_amount',
        'total_amount',
        'total_price', // For compatibility
        'payment_status',
        'paid_amount',
        'status',
        'job_created',
        'departments',
        'responsible_person',
        'urgency_level',
        'job_name',
        'event_location',
        'usage_date',
        'delivery_date',
        'product_category',
        'product_type',
        'budget',
        'sales_channel',
        'customer_name',
        'customer_phone',
        'customer_line',
        'customer_email',
        'customer_address',
        'needs_tax_invoice',
        'tax_payer_name',
        'tax_id',
        'tax_address',
        'payment_method',
        'delivery_type',
        'delivery_method',
        'delivery_recipient',
        'delivery_phone',
        'delivery_address',
        'preferred_delivery_date',
        'notes',
        'quotation_number',
    ];

    foreach ($allowed_fields as $field) {
        if (array_key_exists($field, $data)) {
            $value = $data[$field];
            if ($field === 'departments' && is_array($value)) {
                $value = json_encode($value);
            }
            $fields[] = "$field = ?";
            $params[] = $value;
            $types .= (in_array($field, ['paid_amount', 'total_amount', 'subtotal', 'vat_amount', 'delivery_cost', 'budget'])) ? 'd' : ((in_array($field, ['job_created', 'needs_tax_invoice', 'customer_id'])) ? 'i' : 's');
        }
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "No fields to update"]);
        exit();
    }

    $params[] = $id;
    $types .= 'i';

    $sql = "UPDATE orders SET " . implode(", ", $fields) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
        exit();
    }

    echo json_encode(["status" => "success", "message" => "Order updated successfully"]);
    exit();
}

// ==================== PATCH (สร้างงาน / เปลี่ยน status) ====================
if ($method === 'PATCH') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Order ID is required"]);
        exit();
    }

    $data = json_decode(file_get_contents("php://input"), true);

    // รองรับ: เปลี่ยน order_status, job_created, departments
    $fields = [];
    $params = [];
    $types = '';

    if (isset($data['order_status'])) {
        $fields[] = "status = ?";
        $params[] = $data['order_status'];
        $types .= 's';
    }
    if (isset($data['payment_status'])) {
        $fields[] = "payment_status = ?";
        $params[] = $data['payment_status'];
        $types .= 's';
    }
    if (isset($data['job_created'])) {
        $fields[] = "job_created = ?";
        $params[] = intval($data['job_created']);
        $types .= 'i';
    }
    if (isset($data['departments'])) {
        $fields[] = "departments = ?";
        $params[] = is_array($data['departments']) ? json_encode($data['departments']) : $data['departments'];
        $types .= 's';
    }
    if (isset($data['paid_amount'])) {
        $fields[] = "paid_amount = ?";
        $params[] = floatval($data['paid_amount']);
        $types .= 'd';
    }

    if (empty($fields)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "No fields to update"]);
        exit();
    }

    $params[] = $id;
    $types .= 'i';

    $sql = "UPDATE orders SET " . implode(", ", $fields) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Order patched successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}

// ==================== DELETE ====================
if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Order ID is required"]);
        exit();
    }

    // cascade delete handles order_items and order_payments automatically
    $stmt = $conn->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Order deleted successfully"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
$conn->close();
?>