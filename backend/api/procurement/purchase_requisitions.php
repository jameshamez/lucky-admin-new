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

function fetchPR($conn, $id) {
    $stmt = $conn->prepare("SELECT * FROM purchase_requisitions WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $pr = $stmt->get_result()->fetch_assoc();
    if (!$pr) return null;

    $items = [];
    $stmtI = $conn->prepare("SELECT * FROM pr_line_items WHERE pr_id = ? ORDER BY id ASC");
    $stmtI->bind_param("i", $id);
    $stmtI->execute();
    $resI = $stmtI->get_result();
    while ($row = $resI->fetch_assoc()) {
        $items[] = [
            "id" => (string) $row['id'],
            "description" => $row['description'],
            "link" => $row['link'],
            "qty" => (float) $row['qty'],
            "unitPrice" => (float) $row['unit_price'],
            "currency" => $row['currency'],
            "exchangeRate" => (float) $row['exchange_rate'],
        ];
    }

    $payments = [];
    $stmtP = $conn->prepare("SELECT * FROM pr_payments WHERE pr_id = ? ORDER BY id ASC");
    $stmtP->bind_param("i", $id);
    $stmtP->execute();
    $resP = $stmtP->get_result();
    while ($row = $resP->fetch_assoc()) {
        $payments[] = [
            "id" => (string) $row['id'],
            "date" => $row['payment_date'],
            "amount" => (float) $row['amount'],
            "method" => $row['method'],
            "evidenceUrl" => $row['evidence_url'],
            "evidenceName" => $row['evidence_name'],
        ];
    }

    $attachments = [];
    $receiveAttachments = [];
    $stmtA = $conn->prepare("SELECT * FROM pr_attachments WHERE pr_id = ? ORDER BY id ASC");
    $stmtA->bind_param("i", $id);
    $stmtA->execute();
    $resA = $stmtA->get_result();
    while ($row = $resA->fetch_assoc()) {
        $entry = [
            "id" => (string) $row['id'],
            "url" => $row['file_url'],
            "name" => $row['file_name'],
            "size" => (int) $row['file_size'],
        ];
        if ($row['kind'] === 'receive') $receiveAttachments[] = $entry;
        else $attachments[] = $entry;
    }

    return [
        "id" => (string) $pr['id'],
        "prNumber" => $pr['pr_number'],
        "issueDate" => $pr['issue_date'],
        "usageDate" => $pr['usage_date'],
        "requester" => $pr['requester'],
        "purposeType" => $pr['purpose_type'],
        "purposeText" => $pr['purpose_text'],
        "jobIds" => $pr['job_ids'] ? json_decode($pr['job_ids'], true) : [],
        "channel" => $pr['channel'],
        "shipping" => (float) $pr['shipping'],
        "includeVat" => (bool) $pr['include_vat'],
        "status" => $pr['status'],
        "poNumber" => $pr['po_number'],
        "items" => $items,
        "payments" => $payments,
        "attachments" => $attachments,
        "receiveAttachments" => $receiveAttachments,
    ];
}

function generatePrNumber($conn) {
    $today = date('Ymd');
    $res = $conn->query("SELECT COUNT(*) as cnt FROM purchase_requisitions WHERE pr_number LIKE 'PR-$today-%'");
    $cnt = 1;
    if ($res && $row = $res->fetch_assoc()) $cnt = (int) $row['cnt'] + 1;
    return "PR-$today-" . str_pad($cnt, 3, "0", STR_PAD_LEFT);
}

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            $pr = fetchPR($conn, (int) $_GET['id']);
            if (!$pr) {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Not found"]);
                exit();
            }
            echo json_encode(["status" => "success", "data" => $pr]);
            exit();
        }

        $ids = [];
        $res = $conn->query("SELECT id FROM purchase_requisitions ORDER BY id DESC");
        while ($row = $res->fetch_assoc()) $ids[] = (int) $row['id'];
        $data = array_map(fn($id) => fetchPR($conn, $id), $ids);
        echo json_encode(["status" => "success", "data" => $data]);
        exit();
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);

        $prNumber = generatePrNumber($conn);
        $jobIdsJson = json_encode($input['jobIds'] ?? [], JSON_UNESCAPED_UNICODE);

        $conn->begin_transaction();
        try {
            $stmt = $conn->prepare("INSERT INTO purchase_requisitions
                (pr_number, issue_date, usage_date, requester, purpose_type, purpose_text, job_ids, channel, shipping, include_vat, status, po_number)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)");
            $issueDate = $input['issueDate'] ?? date('Y-m-d');
            $usageDate = $input['usageDate'] ?? null;
            $purposeType = $input['purposeType'] ?? 'new';
            $includeVat = !empty($input['includeVat']) ? 1 : 0;
            $shipping = (float) ($input['shipping'] ?? 0);
            $stmt->bind_param(
                "ssssssssdis",
                $prNumber, $issueDate, $usageDate, $input['requester'], $purposeType,
                $input['purposeText'], $jobIdsJson, $input['channel'], $shipping, $includeVat, $input['poNumber']
            );
            $stmt->execute();
            $prId = $conn->insert_id;

            foreach (($input['items'] ?? []) as $item) {
                $stmtI = $conn->prepare("INSERT INTO pr_line_items (pr_id, description, link, qty, unit_price, currency, exchange_rate) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $qty = (float) ($item['qty'] ?? 0);
                $unitPrice = (float) ($item['unitPrice'] ?? 0);
                $currency = $item['currency'] ?? 'THB';
                $exchangeRate = (float) ($item['exchangeRate'] ?? 1);
                $stmtI->bind_param("issddsd", $prId, $item['description'], $item['link'], $qty, $unitPrice, $currency, $exchangeRate);
                $stmtI->execute();
            }

            foreach (($input['payments'] ?? []) as $p) {
                $stmtP = $conn->prepare("INSERT INTO pr_payments (pr_id, payment_date, amount, method, evidence_url, evidence_name) VALUES (?, ?, ?, ?, ?, ?)");
                $amount = (float) ($p['amount'] ?? 0);
                $stmtP->bind_param("isdsss", $prId, $p['date'], $amount, $p['method'], $p['evidenceUrl'], $p['evidenceName']);
                $stmtP->execute();
            }

            foreach (($input['attachments'] ?? []) as $a) {
                $stmtA = $conn->prepare("INSERT INTO pr_attachments (pr_id, kind, file_url, file_name, file_size) VALUES (?, 'general', ?, ?, ?)");
                $size = (int) ($a['size'] ?? 0);
                $stmtA->bind_param("issi", $prId, $a['url'], $a['name'], $size);
                $stmtA->execute();
            }
            foreach (($input['receiveAttachments'] ?? []) as $a) {
                $stmtA = $conn->prepare("INSERT INTO pr_attachments (pr_id, kind, file_url, file_name, file_size) VALUES (?, 'receive', ?, ?, ?)");
                $size = (int) ($a['size'] ?? 0);
                $stmtA->bind_param("issi", $prId, $a['url'], $a['name'], $size);
                $stmtA->execute();
            }

            $conn->commit();
            echo json_encode(["status" => "success", "data" => fetchPR($conn, $prId)]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
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

        // Status-only update (from the inline status dropdown in the list table)
        if (isset($input['status']) && !isset($input['items'])) {
            $stmt = $conn->prepare("UPDATE purchase_requisitions SET status = ?, po_number = COALESCE(?, po_number) WHERE id = ?");
            $poNumber = $input['poNumber'] ?? null;
            $stmt->bind_param("ssi", $input['status'], $poNumber, $id);
            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "data" => fetchPR($conn, $id)]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
            exit();
        }

        // Full replace (edit form save)
        $conn->begin_transaction();
        try {
            $jobIdsJson = json_encode($input['jobIds'] ?? [], JSON_UNESCAPED_UNICODE);
            $includeVat = !empty($input['includeVat']) ? 1 : 0;
            $shipping = (float) ($input['shipping'] ?? 0);
            $purposeType = $input['purposeType'] ?? 'new';
            $usageDate = $input['usageDate'] ?? null;

            $stmt = $conn->prepare("UPDATE purchase_requisitions SET
                issue_date = ?, usage_date = ?, requester = ?, purpose_type = ?, purpose_text = ?,
                job_ids = ?, channel = ?, shipping = ?, include_vat = ?, po_number = ?
                WHERE id = ?");
            $stmt->bind_param(
                "sssssssdisi",
                $input['issueDate'], $usageDate, $input['requester'], $purposeType, $input['purposeText'],
                $jobIdsJson, $input['channel'], $shipping, $includeVat, $input['poNumber'], $id
            );
            $stmt->execute();

            $conn->query("DELETE FROM pr_line_items WHERE pr_id = $id");
            $conn->query("DELETE FROM pr_payments WHERE pr_id = $id");
            $conn->query("DELETE FROM pr_attachments WHERE pr_id = $id");

            foreach (($input['items'] ?? []) as $item) {
                $stmtI = $conn->prepare("INSERT INTO pr_line_items (pr_id, description, link, qty, unit_price, currency, exchange_rate) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $qty = (float) ($item['qty'] ?? 0);
                $unitPrice = (float) ($item['unitPrice'] ?? 0);
                $currency = $item['currency'] ?? 'THB';
                $exchangeRate = (float) ($item['exchangeRate'] ?? 1);
                $stmtI->bind_param("issddsd", $id, $item['description'], $item['link'], $qty, $unitPrice, $currency, $exchangeRate);
                $stmtI->execute();
            }
            foreach (($input['payments'] ?? []) as $p) {
                $stmtP = $conn->prepare("INSERT INTO pr_payments (pr_id, payment_date, amount, method, evidence_url, evidence_name) VALUES (?, ?, ?, ?, ?, ?)");
                $amount = (float) ($p['amount'] ?? 0);
                $stmtP->bind_param("isdsss", $id, $p['date'], $amount, $p['method'], $p['evidenceUrl'], $p['evidenceName']);
                $stmtP->execute();
            }
            foreach (($input['attachments'] ?? []) as $a) {
                $stmtA = $conn->prepare("INSERT INTO pr_attachments (pr_id, kind, file_url, file_name, file_size) VALUES (?, 'general', ?, ?, ?)");
                $size = (int) ($a['size'] ?? 0);
                $stmtA->bind_param("issi", $id, $a['url'], $a['name'], $size);
                $stmtA->execute();
            }
            foreach (($input['receiveAttachments'] ?? []) as $a) {
                $stmtA = $conn->prepare("INSERT INTO pr_attachments (pr_id, kind, file_url, file_name, file_size) VALUES (?, 'receive', ?, ?, ?)");
                $size = (int) ($a['size'] ?? 0);
                $stmtA->bind_param("issi", $id, $a['url'], $a['name'], $size);
                $stmtA->execute();
            }

            $conn->commit();
            echo json_encode(["status" => "success", "data" => fetchPR($conn, $id)]);
        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
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
