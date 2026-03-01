<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];
$customer_id = isset($_GET['customer_id']) ? intval($_GET['customer_id']) : null;

switch ($method) {
    case 'GET':
        if (!$customer_id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "customer_id is required"]);
            exit();
        }
        $sql = "SELECT * FROM customer_orders WHERE customer_id = ? ORDER BY order_date DESC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $customer_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $orders = [];
        while ($row = $result->fetch_assoc()) {
            $row['amount'] = (float) $row['amount'];
            $row['paid_amount'] = (float) $row['paid_amount'];
            $row['items'] = (int) $row['items'];
            $orders[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $orders]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['customer_id']) || empty($data['title'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "customer_id and title are required"]);
            exit();
        }
        $order_code = 'ORD-' . strtoupper(substr(uniqid(), -6));
        $order_date = isset($data['order_date']) ? $data['order_date'] : date('Y-m-d');
        $amount = isset($data['amount']) ? (float) $data['amount'] : 0;
        $paid_amount = isset($data['paid_amount']) ? (float) $data['paid_amount'] : 0;
        $status = isset($data['status']) ? $data['status'] : 'รอการอนุมัติ';
        $items = isset($data['items']) ? (int) $data['items'] : 0;
        $cid = (int) $data['customer_id'];

        $sql = "INSERT INTO customer_orders (customer_id, order_code, title, amount, paid_amount, status, items, order_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("issddssi", $cid, $order_code, $data['title'], $amount, $paid_amount, $status, $items, $order_date);
        if ($stmt->execute()) {
            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Order created", "id" => $conn->insert_id, "order_code" => $order_code]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
$conn->close();
?>