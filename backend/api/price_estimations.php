<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

set_exception_handler(function ($e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage(), "line" => $e->getLine(), "file" => basename($e->getFile())]);
    exit();
});
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
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

// Parse ID
$request_uri = $_SERVER['REQUEST_URI'];
$path_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));
$id = null;
foreach ($path_parts as $key => $part) {
    if (($part === 'price_estimations.php') && isset($path_parts[$key + 1]) && is_numeric($path_parts[$key + 1])) {
        $id = intval($path_parts[$key + 1]);
    }
}
if (!$id && isset($_GET['id'])) {
    $id = intval($_GET['id']);
}

// GET lists or single
if ($method === 'GET') {
    if ($id) {
        $stmt = $conn->prepare("SELECT * FROM price_estimations_sales WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result()->fetch_assoc();
        if (!$res) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Not found"]);
            exit();
        }
        if (!empty($res['details'])) {
            $res['details'] = json_decode($res['details'], true);
        }
        echo json_encode(["status" => "success", "data" => $res]);
        exit();
    }

    $sql = "SELECT * FROM price_estimations_sales ORDER BY id DESC LIMIT 200";
    $result = $conn->query($sql);
    $data = [];
    while ($row = $result->fetch_assoc()) {
        if (!empty($row['details'])) {
            $row['details'] = json_decode($row['details'], true);
        }
        $data[] = $row;
    }

    echo json_encode(["status" => "success", "data" => $data]);
    exit();
}

// POST create
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Request body is empty"]);
        exit();
    }

    // Auto generate estimate_id: EST-YYMMXXXX
    $ym = date('ym');
    $stmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM price_estimations_sales WHERE estimate_id LIKE ?");
    $like = "EST-{$ym}%";
    $stmt->bind_param("s", $like);
    $stmt->execute();
    $count = $stmt->get_result()->fetch_assoc()['cnt'];
    $estimate_id = 'EST-' . $ym . str_pad($count + 1, 4, '0', STR_PAD_LEFT);

    // Prepare fields
    $customer_name = $data['customer_name'] ?? '';
    if (empty($customer_name)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "customer_name is required"]);
        exit();
    }

    $customer_id = !empty($data['customer_id']) ? intval($data['customer_id']) : 0;
    $customer_phone = $data['customer_phone'] ?? '';
    $customer_line = $data['customer_line'] ?? '';
    $customer_email = $data['customer_email'] ?? '';
    $sales_owner_id = $data['sales_owner_id'] ?? '';
    $job_name = $data['job_name'] ?? '';
    $product_category = $data['product_category'] ?? '';
    $product_type = $data['product_type'] ?? '';
    $quantity = !empty($data['quantity']) ? intval($data['quantity']) : 0;
    $budget = isset($data['budget']) && $data['budget'] !== null ? floatval($data['budget']) : 0.0;
    $price = isset($data['price']) && $data['price'] !== null ? floatval($data['price']) : 0.0;
    $status = $data['status'] ?? 'ยื่นคำขอประเมิน';
    $notes = $data['notes'] ?? '';
    $details = !empty($data['details']) ? json_encode($data['details']) : null;
    $estimation_date = !empty($data['estimation_date']) ? $data['estimation_date'] : date('Y-m-d');

    $sql = "INSERT INTO price_estimations_sales (
        estimate_id, estimation_date, customer_id, customer_name, customer_phone, customer_line, customer_email,
        sales_owner_id, job_name, product_category, product_type, quantity, budget, price, status, notes, details
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param(
        "ssissssssssidddss",
        $estimate_id,
        $estimation_date,
        $customer_id,
        $customer_name,
        $customer_phone,
        $customer_line,
        $customer_email,
        $sales_owner_id,
        $job_name,
        $product_category,
        $product_type,
        $quantity,
        $budget,
        $price,
        $status,
        $notes,
        $details
    );

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
        exit();
    }

    echo json_encode([
        "status" => "success",
        "message" => "Price estimation created",
        "id" => $conn->insert_id,
        "estimate_id" => $estimate_id
    ]);
    exit();
}

// PUT / PATCH update
if ($method === 'PUT' || $method === 'PATCH') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID is required"]);
        exit();
    }

    $data = json_decode(file_get_contents("php://input"), true);
    if (empty($data)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Request body is empty"]);
        exit();
    }

    $fields = [];
    $params = [];
    $types = '';

    $allowed = [
        'customer_id',
        'customer_name',
        'customer_phone',
        'customer_line',
        'customer_email',
        'sales_owner_id',
        'job_name',
        'product_category',
        'product_type',
        'quantity',
        'budget',
        'price',
        'status',
        'revision_count',
        'notes',
        'details'
    ];

    foreach ($allowed as $f) {
        if (array_key_exists($f, $data)) {
            $val = $data[$f];
            if ($f === 'details' && is_array($val)) {
                $val = json_encode($val);
            }
            $fields[] = "$f = ?";
            $params[] = $val;
            $types .= in_array($f, ['budget', 'price']) ? 'd' : (in_array($f, ['quantity', 'revision_count', 'customer_id']) ? 'i' : 's');
        }
    }

    if (empty($fields)) {
        echo json_encode(["status" => "success", "message" => "No changes"]);
        exit();
    }

    $params[] = $id;
    $types .= 'i';

    $sql = "UPDATE price_estimations_sales SET " . implode(", ", $fields) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
        exit();
    }

    echo json_encode(["status" => "success", "message" => "Updated successfully"]);
    exit();
}

// DELETE
if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID is required"]);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM price_estimations_sales WHERE id = ?");
    $stmt->bind_param("i", $id);

    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
        exit();
    }

    echo json_encode(["status" => "success", "message" => "Deleted successfully"]);
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
