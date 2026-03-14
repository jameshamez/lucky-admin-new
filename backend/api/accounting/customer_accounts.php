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
            // Fetch a single customer account with its follow-up history
            $id = $conn->real_escape_string($_GET['id']);
            $sql = "SELECT * FROM accounting_customer_accounts WHERE id = '$id'";
            $result = $conn->query($sql);

            if ($result && $result->num_rows > 0) {
                $data = $result->fetch_assoc();

                // Calculate days overdue
                try {
                    $due_date = new DateTime($data['due_date']);
                    $today = new DateTime();
                    if ($today > $due_date && $data['status'] !== 'ชำระเสร็จสิ้น') {
                        $interval = $today->diff($due_date);
                        $data['days_overdue'] = $interval->days;
                    } else {
                        $data['days_overdue'] = 0;
                    }
                } catch (Exception $e) {
                    $data['days_overdue'] = 0;
                }

                // Fetch follow-up history
                $historySql = "SELECT * FROM accounting_ar_follow_ups WHERE ar_id = '$id' ORDER BY follow_up_date DESC, created_at DESC";
                $historyResult = $conn->query($historySql);
                $history = [];
                if ($historyResult) {
                    while ($row = $historyResult->fetch_assoc()) {
                        $history[] = $row;
                    }
                }
                $data['follow_up_history'] = $history;

                echo json_encode(["status" => "success", "data" => $data]);
            } else {
                echo json_encode(["status" => "error", "message" => "Account not found"]);
            }
        } else {
            // Fetch all customer accounts
            $sql = "SELECT * FROM accounting_customer_accounts ORDER BY created_at DESC";
            $result = $conn->query($sql);
            $accounts = [];

            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    // Calculate days overdue
                    try {
                        $due_date = new DateTime($row['due_date']);
                        $today = new DateTime();
                        if ($today > $due_date && $row['status'] !== 'ชำระเสร็จสิ้น') {
                            $interval = $today->diff($due_date);
                            $row['days_overdue'] = $interval->days;
                        } else {
                            $row['days_overdue'] = 0;
                        }
                    } catch (Exception $e) {
                        $row['days_overdue'] = 0;
                    }
                    $accounts[] = $row;
                }
            }

            // Summary data
            $summary = [
                "total_accounts" => count($accounts),
                "total_receivable" => 0,
                "overdue_count" => 0,
                "completed_count" => 0
            ];

            foreach ($accounts as $acc) {
                $summary['total_receivable'] += (float) $acc['remaining_amount'];
                if (isset($acc['days_overdue']) && $acc['days_overdue'] > 30) {
                    $summary['overdue_count']++;
                }
                if ($acc['status'] === 'ชำระเสร็จสิ้น') {
                    $summary['completed_count']++;
                }
            }

            // Monthly data
            $monthly = [
                ["month" => "ม.ค.", "amount" => 120000],
                ["month" => "ก.พ.", "amount" => 95000],
                ["month" => "มี.ค.", "amount" => 145000],
                ["month" => "เม.ย.", "amount" => 110000],
                ["month" => "พ.ค.", "amount" => 130000],
                ["month" => "มิ.ย.", "amount" => 155000]
            ];

            echo json_encode([
                "status" => "success",
                "data" => $accounts,
                "summary" => $summary,
                "monthly" => $monthly
            ]);
        }
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);

        if (isset($input['action']) && $input['action'] === 'add_follow_up') {
            $ar_id = $input['ar_id'];
            $follow_up_date = $input['follow_up_date'];
            $channel = $input['channel'];
            $detail = $input['detail'];
            $next_follow_up_date = !empty($input['next_follow_up_date']) ? $input['next_follow_up_date'] : NULL;
            $user_name = $input['user_name'];

            $stmt = $conn->prepare("INSERT INTO accounting_ar_follow_ups (ar_id, follow_up_date, channel, detail, next_follow_up_date, user_name) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("isssss", $ar_id, $follow_up_date, $channel, $detail, $next_follow_up_date, $user_name);

            if ($stmt->execute()) {
                // Update the main table's follow_up_note
                $upd = $conn->prepare("UPDATE accounting_customer_accounts SET follow_up_note = ? WHERE id = ?");
                $upd->bind_param("si", $detail, $ar_id);
                $upd->execute();

                echo json_encode(["status" => "success", "message" => "Follow up added"]);
            } else {
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
        } elseif (isset($input['id'])) {
            // Update existing account
            $id = $input['id'];
            $customer_name = $input['customer_name'];
            $invoice_number = $input['invoice_number'];
            $invoice_date = $input['invoice_date'];
            $due_date = !empty($input['due_date']) ? $input['due_date'] : NULL;
            $total_amount = (float) $input['total_amount'];
            $paid_amount = (float) $input['paid_amount'];
            $remaining_amount = $total_amount - $paid_amount;
            $status = $input['status'];
            $account_manager = $input['account_manager'];

            $stmt = $conn->prepare("UPDATE accounting_customer_accounts SET 
                    customer_name = ?,
                    invoice_number = ?,
                    invoice_date = ?,
                    due_date = ?,
                    total_amount = ?,
                    paid_amount = ?,
                    remaining_amount = ?,
                    status = ?,
                    account_manager = ?
                    WHERE id = ?");
            $stmt->bind_param("ssssdddssi", $customer_name, $invoice_number, $invoice_date, $due_date, $total_amount, $paid_amount, $remaining_amount, $status, $account_manager, $id);

            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Account updated"]);
            } else {
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
        } else {
            // Create new account
            $ar_code = "AR-" . date("Y") . "-" . str_pad(rand(1, 999), 3, "0", STR_PAD_LEFT);
            $customer_name = $input['customer_name'] ?? '';
            $invoice_number = $input['invoice_number'] ?? '';
            $invoice_date = !empty($input['invoice_date']) ? $input['invoice_date'] : date('Y-m-d');
            $due_date = !empty($input['due_date']) ? $input['due_date'] : NULL;
            $total_amount = (float) ($input['total_amount'] ?? 0);
            $paid_amount = (float) ($input['paid_amount'] ?? 0);
            $remaining_amount = $total_amount - $paid_amount;
            $status = $input['status'] ?? 'รอชำระ';
            $account_manager = $input['account_manager'] ?? '';

            $stmt = $conn->prepare("INSERT INTO accounting_customer_accounts 
                    (ar_code, customer_name, invoice_number, invoice_date, due_date, total_amount, paid_amount, remaining_amount, status, account_manager)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssdddss", $ar_code, $customer_name, $invoice_number, $invoice_date, $due_date, $total_amount, $paid_amount, $remaining_amount, $status, $account_manager);

            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Account created", "id" => $conn->insert_id]);
            } else {
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
        }
    } elseif ($method === 'DELETE') {
        $id = $_GET['id'];
        $stmt = $conn->prepare("DELETE FROM accounting_customer_accounts WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Account deleted"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>