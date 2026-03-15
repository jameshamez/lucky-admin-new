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

require '../../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $status = $_GET['status'] ?? null;
    $month = $_GET['month'] ?? 'all';
    $year = $_GET['year'] ?? 'all';

    $where = [];
    if ($status)
        $where[] = "commission_status = '$status'";

    if ($status === 'COMPLETED') {
        if ($year !== 'all')
            $where[] = "commission_period LIKE '$year-%'";
        if ($month !== 'all') {
            $m = str_pad($month, 2, '0', STR_PAD_LEFT);
            if ($year !== 'all') {
                $pattern = "$year-$m";
                $where[count($where) - 1] = "commission_period = '$pattern'";
            } else {
                $where[] = "commission_period LIKE '%-$m'";
            }
        }
    } else {
        if ($year !== 'all')
            $where[] = "YEAR(delivery_date) = $year";
        if ($month !== 'all')
            $where[] = "MONTH(delivery_date) = $month";
    }

    $whereSql = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";
    $sql = "SELECT id, delivery_date as deliveryDate, po_number as poNumber, job_name as jobName, 
            product_category as productCategory, sale_name as saleName, quantity, 
            total_sales_amount as totalSalesAmount, rate_display as rateDisplay, 
            base_amount as baseAmount, commission_amount as commissionAmount, 
            calc_description as calcDescription, commission_status as commissionStatus, 
            processed_at as processedAt, commission_period as commissionPeriod 
            FROM hr_commission_ready_made $whereSql ORDER BY delivery_date DESC";

    $result = $conn->query($sql);
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $row['id'] = (string) $row['id'];
        $row['quantity'] = (int) $row['quantity'];
        $row['totalSalesAmount'] = (float) $row['totalSalesAmount'];
        $row['commissionAmount'] = (float) $row['commissionAmount'];
        $data[] = $row;
    }
    echo json_encode(["status" => "success", "data" => $data]);
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    $deliveryDate = $conn->real_escape_string($input['deliveryDate']);
    $poNumber = $conn->real_escape_string($input['poNumber']);
    $jobName = $conn->real_escape_string($input['jobName']);
    $productCategory = $conn->real_escape_string($input['productCategory']);
    $saleName = $conn->real_escape_string($input['saleName']);
    $quantity = intval($input['quantity']);
    $totalSalesAmount = floatval($input['totalSalesAmount']);
    $rateDisplay = $conn->real_escape_string($input['rateDisplay'] ?? '');
    $baseAmount = $conn->real_escape_string($input['baseAmount'] ?? '');
    $commissionAmount = floatval($input['commissionAmount'] ?? 0);
    $calcDescription = $conn->real_escape_string($input['calcDescription'] ?? '');
    $commissionStatus = $conn->real_escape_string($input['commissionStatus'] ?? 'PENDING');

    $sql = "INSERT INTO hr_commission_ready_made 
            (delivery_date, po_number, job_name, product_category, sale_name, quantity, total_sales_amount, rate_display, base_amount, commission_amount, calc_description, commission_status) 
            VALUES ('$deliveryDate', '$poNumber', '$jobName', '$productCategory', '$saleName', $quantity, $totalSalesAmount, '$rateDisplay', '$baseAmount', $commissionAmount, '$calcDescription', '$commissionStatus')";

    if ($conn->query($sql)) {
        echo json_encode(["status" => "success", "id" => $conn->insert_id]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
} elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents("php://input"), true);
    $ids = $input['ids'] ?? [];
    if (is_string($ids))
        $ids = [$ids];

    if (empty($ids)) {
        echo json_encode(["status" => "error", "message" => "No IDs provided"]);
        exit;
    }

    $action = $input['action'] ?? 'complete';

    if ($action === 'complete') {
        $period = $conn->real_escape_string($input['commissionPeriod']);
        $processedAt = date('Y-m-d H:i:s');

        $successCount = 0;
        foreach ($ids as $id) {
            $id = intval($id);
            if (isset($input['updates'][$id])) {
                $u = $input['updates'][$id];
                $rate = $conn->real_escape_string($u['rateDisplay']);
                $base = $conn->real_escape_string($u['baseAmount']);
                $amt = floatval($u['commissionAmount']);
                $desc = $conn->real_escape_string($u['calcDescription']);
                $sql = "UPDATE hr_commission_ready_made SET 
                        rate_display='$rate', 
                        base_amount='$base', 
                        commission_amount=$amt, 
                        calc_description='$desc', 
                        commission_status='COMPLETED', 
                        processed_at='$processedAt', 
                        commission_period='$period' 
                        WHERE id=$id";
            } else {
                $sql = "UPDATE hr_commission_ready_made SET 
                        commission_status='COMPLETED', 
                        processed_at='$processedAt', 
                        commission_period='$period' 
                        WHERE id=$id";
            }
            if ($conn->query($sql))
                $successCount++;
        }
        echo json_encode(["status" => "success", "updated" => $successCount]);
    }
} elseif ($method === 'DELETE') {
    $id = intval($_GET['id']);
    $sql = "DELETE FROM hr_commission_ready_made WHERE id = $id";
    if ($conn->query($sql)) {
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
}

$conn->close();
