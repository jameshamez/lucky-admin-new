<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

require_once "../../condb.php";
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $id = (int) $_GET['id'];
            $sql = "SELECT * FROM accounting_petty_cash WHERE id = $id";
            $res = $conn->query($sql);
            if ($res && $res->num_rows > 0) {
                echo json_encode(["status" => "success", "data" => $res->fetch_assoc()]);
            } else {
                echo json_encode(["status" => "error", "message" => "Not found"]);
            }
        } else {
            $sql = "SELECT * FROM accounting_petty_cash ORDER BY request_date DESC, created_at DESC";
            $res = $conn->query($sql);
            $data = [];
            if ($res) {
                while ($row = $res->fetch_assoc()) {
                    $row['amount'] = (float) $row['amount'];
                    $data[] = $row;
                }
            }
            echo json_encode(["status" => "success", "data" => $data]);
        }
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);

        if (isset($input['action']) && $input['action'] === 'bulk_clear') {
            $ids = $input['ids']; // Array of IDs
            $date = $input['date'];
            $idsStr = implode(',', array_map('intval', $ids));
            $sql = "UPDATE accounting_petty_cash SET clearance_status = 'เคลียร์แล้ว', clearance_date = '$date' WHERE id IN ($idsStr)";
            if ($conn->query($sql)) {
                echo json_encode(["status" => "success", "message" => "Cleared " . count($ids) . " items"]);
            } else {
                echo json_encode(["status" => "error", "message" => $conn->error]);
            }
        } elseif (isset($input['id'])) {
            // Update
            $id = (int) $input['id'];
            $sql = "UPDATE accounting_petty_cash SET 
                employee = ?, department = ?, amount = ?, request_date = ?, 
                category = ?, sub_category = ?, description = ?, status = ?, 
                approver = ?, approved_date = ?, paid_date = ?, payment_method = ?, 
                clearance_status = ?, notes = ?, 
                tax_id_13 = ?, branch_code_5 = ?, invoice_no = ?, invoice_date = ?, 
                tax_record_date = ?, price_type = ?, account_code = ?, quantity = ?, 
                tax_rate = ?, withholding_tax = ?, paid_by_code = ?, paid_amount = ?, 
                pnd = ?, classification_group = ?
                WHERE id = ?";

            $stmt = $conn->prepare($sql);
            $stmt->bind_param(
                "ssdsssssssssssssssssssssdsssi",
                $input['employee'],
                $input['department'],
                $input['amount'],
                $input['requestDate'],
                $input['category'],
                $input['subCategory'],
                $input['description'],
                $input['status'],
                $input['approver'],
                $input['approvedDate'],
                $input['paidDate'],
                $input['paymentMethod'],
                $input['clearanceStatus'],
                $input['notes'],
                $input['taxId13'],
                $input['branchCode5'],
                $input['invoiceNo'],
                $input['invoiceDate'],
                $input['taxRecordDate'],
                $input['priceType'],
                $input['accountCode'],
                $input['quantity'],
                $input['taxRate'],
                $input['withholdingTax'],
                $input['paidBy'],
                $input['paidAmount'],
                $input['pnd'],
                $input['classificationGroup'],
                $id
            );

            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Updated"]);
            } else {
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
        } else {
            // Create
            $pc_code = "PC-" . date("Ymd") . "-" . str_pad(rand(1, 999), 3, "0", STR_PAD_LEFT);
            $sql = "INSERT INTO accounting_petty_cash (
                pc_code, employee, department, amount, request_date, 
                category, sub_category, description, status, payment_method, 
                clearance_status, notes, 
                tax_id_13, branch_code_5, invoice_no, invoice_date, 
                tax_record_date, price_type, account_code, quantity, 
                tax_rate, withholding_tax, paid_by_code, paid_amount, 
                pnd, classification_group
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $stmt = $conn->prepare($sql);
            $status = $input['status'] ?? 'รออนุมัติ';
            $stmt->bind_param(
                "ssssssssssssssssssdsssssss",
                $pc_code,
                $input['employee'],
                $input['department'],
                $input['amount'],
                $input['requestDate'],
                $input['category'],
                $input['subCategory'],
                $input['description'],
                $status,
                $input['paymentMethod'],
                $input['clearanceStatus'],
                $input['notes'],
                $input['taxId13'],
                $input['branchCode5'],
                $input['invoiceNo'],
                $input['invoiceDate'],
                $input['taxRecordDate'],
                $input['priceType'],
                $input['accountCode'],
                $input['quantity'],
                $input['taxRate'],
                $input['withholdingTax'],
                $input['paidBy'],
                $input['paidAmount'],
                $input['pnd'],
                $input['classificationGroup']
            );

            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "id" => $conn->insert_id]);
            } else {
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>