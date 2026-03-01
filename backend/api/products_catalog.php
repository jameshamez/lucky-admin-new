<?php
/**
 * products_catalog.php
 * ดึงสินค้าจากตาราง products (สินค้าสำเร็จรูป)
 * ใช้สำหรับหน้า CreateOrder เพื่อเลือกสินค้าสำเร็จรูปจากหน้าจัดการสินค้า
 *
 * GET /api/products_catalog.php
 *   ?category=สินค้าสำเร็จรูป  (default)
 *   ?product_type=Trophy
 *   ?search=ถ้วย
 *   ?in_stock=1  (เฉพาะที่มีสต็อก)
 *   ?page=1&limit=50
 */

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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit();
}

require '../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

// ตรวจสอบว่าตาราง products มีอยู่หรือไม่
$table_check = $conn->query("SHOW TABLES LIKE 'products'");
if ($table_check->num_rows === 0) {
    // ตารางยังไม่มี ส่ง empty พร้อม hint
    echo json_encode([
        "status" => "success",
        "data" => [],
        "meta" => [
            "note" => "ตาราง products ยังไม่มีในฐานข้อมูล กรุณา import orders_tables.sql ก่อน",
            "total" => 0,
        ]
    ]);
    exit();
}

// Query parameters
$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$limit = isset($_GET['limit']) ? min(200, intval($_GET['limit'])) : 50;
$offset = ($page - 1) * $limit;

$category = isset($_GET['category']) ? trim($_GET['category']) : 'สินค้าสำเร็จรูป';
$product_type = isset($_GET['product_type']) ? trim($_GET['product_type']) : '';
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$in_stock = isset($_GET['in_stock']) ? intval($_GET['in_stock']) : 0;

// Build WHERE clause
$where = ["is_active = 1"];
$params = [];
$types = '';

if ($category !== '') {
    $where[] = "category = ?";
    $params[] = $category;
    $types .= 's';
}
if ($product_type !== '') {
    $where[] = "product_type = ?";
    $params[] = $product_type;
    $types .= 's';
}
if ($search !== '') {
    $like = '%' . $search . '%';
    $where[] = "(name LIKE ? OR product_code LIKE ? OR material LIKE ? OR description LIKE ?)";
    $params = array_merge($params, [$like, $like, $like, $like]);
    $types .= 'ssss';
}
if ($in_stock) {
    $where[] = "stock_qty > 0";
}

$where_sql = "WHERE " . implode(" AND ", $where);

// Count
$count_sql = "SELECT COUNT(*) AS total FROM products $where_sql";
if (!empty($params)) {
    $count_stmt = $conn->prepare($count_sql);
    $count_stmt->bind_param($types, ...$params);
    $count_stmt->execute();
    $total = $count_stmt->get_result()->fetch_assoc()['total'];
} else {
    $total = $conn->query($count_sql)->fetch_assoc()['total'];
}

// Get data
$data_sql = "SELECT * FROM products $where_sql ORDER BY category ASC, product_type ASC, name ASC LIMIT ? OFFSET ?";
$data_params = array_merge($params, [$limit, $offset]);
$data_types = $types . 'ii';

$data_stmt = $conn->prepare($data_sql);
if (!empty($data_params)) {
    $data_stmt->bind_param($data_types, ...$data_params);
}
$data_stmt->execute();
$result = $data_stmt->get_result();

$products = [];
$by_type = []; // จัดกลุ่มตาม product_type สำหรับ dropdown

while ($row = $result->fetch_assoc()) {
    // คำนวณ stock_status แบบ dynamic
    if (intval($row['stock_qty']) <= 0) {
        $row['stock_status'] = 'out_of_stock';
    } elseif (intval($row['stock_qty']) <= intval($row['min_qty'])) {
        $row['stock_status'] = 'low_stock';
    } else {
        $row['stock_status'] = 'in_stock';
    }

    $products[] = $row;

    // สร้าง group by product_type สำหรับ nested dropdown
    $pt = $row['product_type'] ?? 'อื่นๆ';
    if (!isset($by_type[$pt])) {
        $by_type[$pt] = [];
    }
    $by_type[$pt][] = [
        'id' => $row['id'],
        'product_code' => $row['product_code'] ?? '',
        'name' => $row['name'],
        'material' => $row['material'] ?? '',
        'size' => $row['size'] ?? '',
        'unit_price' => floatval($row['unit_price']),
        'stock_qty' => intval($row['stock_qty']),
        'stock_status' => $row['stock_status'],
        'image_url' => $row['image_url'] ?? null,
    ];
}

// Distinct categories + product_types สำหรับ filter UI
$cats_result = $conn->query("SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category ASC");
$categories = [];
while ($r = $cats_result->fetch_assoc()) {
    $categories[] = $r['category'];
}

$types_result = $conn->query("SELECT DISTINCT product_type FROM products WHERE is_active = 1 AND category='สินค้าสำเร็จรูป' ORDER BY product_type ASC");
$product_types = [];
while ($r = $types_result->fetch_assoc()) {
    $product_types[] = $r['product_type'];
}

echo json_encode([
    "status" => "success",
    "data" => $products,
    "by_type" => $by_type,
    "meta" => [
        "total" => intval($total),
        "page" => $page,
        "limit" => $limit,
        "total_pages" => ceil($total / $limit),
        "categories" => $categories,
        "product_types" => $product_types,
    ]
]);

$conn->close();
?>