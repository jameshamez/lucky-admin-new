<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../../condb.php';
/** @var mysqli $conn */

// Specific DB selection if needed, based on dashboard.php pattern
// $conn->select_db('finfinph_lcukycompany'); 
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;

    if ($id) {
        // Fetch single expense with items and payments
        $sql = "SELECT * FROM `accounting_expenses` WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $expense = $result->fetch_assoc();

        if ($expense) {
            // Fetch items
            $itemSql = "SELECT * FROM `accounting_expense_items` WHERE expense_id = ?";
            $itemStmt = $conn->prepare($itemSql);
            $itemStmt->bind_param("i", $id);
            $itemStmt->execute();
            $items = $itemStmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $expense['items'] = $items;

            // Fetch payments
            $paymentSql = "SELECT * FROM `accounting_expense_payments` WHERE expense_id = ?";
            $paymentStmt = $conn->prepare($paymentSql);
            $paymentStmt->bind_param("i", $id);
            $paymentStmt->execute();
            $payments = $paymentStmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $expense['payments'] = $payments;

            echo json_encode(["status" => "success", "data" => $expense]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Expense not found"]);
        }
    } else {
        // Fetch all expenses
        $sql = "SELECT * FROM `accounting_expenses` ORDER BY purchase_date DESC";
        $result = $conn->query($sql);
        $expenses = $result->fetch_all(MYSQLI_ASSOC);

        // For dashboard summary data
        $summarySql = "SELECT 
            SUM(net_amount) as total_expenses,
            SUM(paid_amount) as total_paid,
            SUM(CASE WHEN payment_status = 'รออนุมัติ' THEN 1 ELSE 0 END) as pending_approvals
            FROM `accounting_expenses`";
        $summaryResult = $conn->query($summarySql);
        $summary = $summaryResult->fetch_assoc();

        // Monthly data
        $monthlySql = "SELECT DATE_FORMAT(purchase_date, '%Y-%m') as month, SUM(net_amount) as amount 
                       FROM `accounting_expenses` 
                       GROUP BY month ORDER BY month DESC LIMIT 12";
        $monthlyResult = $conn->query($monthlySql);
        $monthly = $monthlyResult->fetch_all(MYSQLI_ASSOC);

        echo json_encode([
            "status" => "success",
            "data" => $expenses,
            "summary" => $summary,
            "monthly" => array_reverse($monthly)
        ]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        echo json_encode(["status" => "error", "message" => "Invalid input"]);
        exit();
    }

    $id = isset($data['id']) ? $data['id'] : null;
    $supplier = $data['supplier'];
    $po_no = $data['poNo'];
    $invoice_no = $data['invoiceNo'];
    $purchase_date = $data['purchaseDate'];
    $payment_status = $data['paymentStatus'];
    $remark = $data['remark'];
    $items = isset($data['items']) ? $data['items'] : [];
    $payments = isset($data['payments']) ? $data['payments'] : [];

    // Calculate totals
    $total_amount = 0;
    foreach ($items as $item) {
        $total_amount += $item['quantity'] * $item['unitPrice'];
    }

    $includeVat = isset($data['includeVat']) ? $data['includeVat'] : true;
    $vat = $includeVat ? $total_amount * 0.07 : 0;
    $net_amount = $total_amount + $vat;

    $paid_amount = 0;
    $last_payment_date = null;
    $payment_method = "";
    foreach ($payments as $payment) {
        $paid_amount += $payment['amount'];
        $last_payment_date = $payment['date'];
        $payment_method = $payment['method'];
    }

    $outstanding_amount = $net_amount - $paid_amount;

    if ($id && is_numeric($id)) {
        // Update
        $sql = "UPDATE `accounting_expenses` SET 
                supplier = ?, po_no = ?, invoice_no = ?, purchase_date = ?, 
                payment_date = ?, description = ?, amount = ?, vat = ?, 
                net_amount = ?, paid_amount = ?, outstanding_amount = ?, 
                payment_method = ?, payment_status = ?, remark = ?
                WHERE id = ?";

        $desc = count($items) > 0 ? $items[0]['description'] : "";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            "ssssssdddddsssi",
            $supplier,
            $po_no,
            $invoice_no,
            $purchase_date,
            $last_payment_date,
            $desc,
            $total_amount,
            $vat,
            $net_amount,
            $paid_amount,
            $outstanding_amount,
            $payment_method,
            $payment_status,
            $remark,
            $id
        );
        $stmt->execute();
        $expense_id = $id;
    } else {
        // Create
        // Generate expense code
        $year = date('Y');
        $codePrefix = "EXP-" . $year . "-";
        $codeSql = "SELECT expense_code FROM `accounting_expenses` WHERE expense_code LIKE '$codePrefix%' ORDER BY id DESC LIMIT 1";
        $codeRes = $conn->query($codeSql);
        $lastCode = $codeRes->fetch_assoc();

        $num = 1;
        if ($lastCode) {
            $lastNum = (int) substr($lastCode['expense_code'], -3);
            $num = $lastNum + 1;
        }
        $expense_code = $codePrefix . str_pad($num, 3, '0', STR_PAD_LEFT);

        $sql = "INSERT INTO `accounting_expenses` (
                expense_code, supplier, po_no, invoice_no, purchase_date, 
                payment_date, description, amount, vat, net_amount, 
                paid_amount, outstanding_amount, payment_method, payment_status, remark
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $desc = count($items) > 0 ? $items[0]['description'] : "";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param(
            "sssssssdddddsss",
            $expense_code,
            $supplier,
            $po_no,
            $invoice_no,
            $purchase_date,
            $last_payment_date,
            $desc,
            $total_amount,
            $vat,
            $net_amount,
            $paid_amount,
            $outstanding_amount,
            $payment_method,
            $payment_status,
            $remark
        );
        $stmt->execute();
        $expense_id = $conn->insert_id;
    }

    // Update items (Delete and re-insert for simplicity)
    $conn->query("DELETE FROM `accounting_expense_items` WHERE expense_id = $expense_id");
    foreach ($items as $item) {
        $itemSql = "INSERT INTO `accounting_expense_items` (expense_id, description, quantity, unit_price, currency) VALUES (?, ?, ?, ?, ?)";
        $iStmt = $conn->prepare($itemSql);
        $iStmt->bind_param("isdds", $expense_id, $item['description'], $item['quantity'], $item['unitPrice'], $item['currency']);
        $iStmt->execute();
    }

    // Update payments
    $conn->query("DELETE FROM `accounting_expense_payments` WHERE expense_id = $expense_id");
    foreach ($payments as $payment) {
        $pSql = "INSERT INTO `accounting_expense_payments` (expense_id, payment_date, amount, payment_method) VALUES (?, ?, ?, ?)";
        $pStmt = $conn->prepare($pSql);
        $pStmt->bind_param("isds", $expense_id, $payment['date'], $payment['amount'], $payment['method']);
        $pStmt->execute();
    }

    echo json_encode(["status" => "success", "message" => "Expense saved", "id" => $expense_id]);
} elseif ($method === 'DELETE') {
    $id = isset($_GET['id']) ? $_GET['id'] : null;
    if ($id) {
        $sql = "DELETE FROM `accounting_expenses` WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Expense deleted"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Delete failed"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "No ID provided"]);
    }
}

$conn->close();
?>