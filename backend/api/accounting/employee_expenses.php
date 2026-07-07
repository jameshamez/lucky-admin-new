<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require __DIR__ . '/../../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $data = [];
        $res = $conn->query("SELECT * FROM accounting_employee_expenses ORDER BY receipt_date DESC, id DESC");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $data[] = [
                    "id" => (string) $row['id'],
                    "employee" => $row['employee'],
                    "department" => $row['department'],
                    "type" => $row['type'],
                    "description" => $row['description'],
                    "amount" => (float) $row['amount'],
                    "receiptDate" => $row['receipt_date'],
                    "receiptUrl" => $row['receipt_url'],
                    "status" => $row['status'],
                ];
            }
        }
        echo json_encode(["status" => "success", "data" => $data]);
        exit();
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        if (empty($input['employee']) || empty($input['type']) || empty($input['amount'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "employee, type และ amount เป็นสิ่งจำเป็น"]);
            exit();
        }
        $department = $input['department'] ?? null;
        $description = $input['description'] ?? null;
        $amount = (float) $input['amount'];
        $receiptDate = $input['receiptDate'] ?? date('Y-m-d');
        $receiptUrl = $input['receiptUrl'] ?? null;

        $stmt = $conn->prepare("INSERT INTO accounting_employee_expenses (employee, department, type, description, amount, receipt_date, receipt_url) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssdss", $input['employee'], $department, $input['type'], $description, $amount, $receiptDate, $receiptUrl);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        exit();
    }

    if ($method === 'PUT') {
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "id required"]);
            exit();
        }
        $input = json_decode(file_get_contents("php://input"), true);

        if (isset($input['status']) && count($input) === 1) {
            $stmt = $conn->prepare("UPDATE accounting_employee_expenses SET status = ? WHERE id = ?");
            $stmt->bind_param("si", $input['status'], $id);
        } else {
            $stmt = $conn->prepare("UPDATE accounting_employee_expenses SET employee=?, department=?, type=?, description=?, amount=?, receipt_date=?, receipt_url=?, status=? WHERE id = ?");
            $amount = (float) ($input['amount'] ?? 0);
            $status = $input['status'] ?? 'รออนุมัติ';
            $stmt->bind_param(
                "ssssdsssi",
                $input['employee'], $input['department'], $input['type'], $input['description'],
                $amount, $input['receiptDate'], $input['receiptUrl'], $status, $id
            );
        }

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Updated"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        exit();
    }

    if ($method === 'DELETE') {
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "id required"]);
            exit();
        }
        $stmt = $conn->prepare("DELETE FROM accounting_employee_expenses WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Deleted"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        exit();
    }

    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
