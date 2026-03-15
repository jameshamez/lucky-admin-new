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

require '../../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $type = $_GET['type'] ?? 'all';
    $month = $_GET['month'] ?? 'all';
    $year = $_GET['year'] ?? 'all';

    $response = ["status" => "success", "data" => []];

    if ($type === 'transactions' || $type === 'all') {
        $where1 = [];
        $where2 = [];
        if ($year !== 'all') {
            $where1[] = "YEAR(delivery_date) = $year";
            $where2[] = "YEAR(delivery_date) = $year";
        }
        // Removed specific month filter to support trend charts fetching multiple months

        $wSql1 = count($where1) > 0 ? "WHERE " . implode(" AND ", $where1) : "";
        $wSql2 = count($where2) > 0 ? "WHERE " . implode(" AND ", $where2) : "";

        $sql1 = "SELECT id, DATE_FORMAT(delivery_date, '%Y-%m') as month, sale_name as employeeName, po_number as poNumber, job_name as jobName, 'ReadyMade' as type, product_category as productCategory, quantity, total_sales_amount as totalSales, commission_amount as commission, rate_display as rateInfo, commission_status as status FROM hr_commission_ready_made $wSql1";
        $sql2 = "SELECT id, DATE_FORMAT(delivery_date, '%Y-%m') as month, sale_name as employeeName, po_number as poNumber, job_name as jobName, 'MadeToOrder' as type, product_category as productCategory, quantity, total_sales_amount as totalSales, commission_amount as commission, tier_condition as rateInfo, commission_status as status FROM hr_commission_mto $wSql2";

        $transactions = [];
        $res1 = $conn->query($sql1);
        while ($row = $res1->fetch_assoc()) {
            $row['id'] = "rm-" . $row['id'];
            $row['quantity'] = (int) $row['quantity'];
            $row['totalSales'] = (float) $row['totalSales'];
            $row['commission'] = (float) $row['commission'];
            $transactions[] = $row;
        }

        $res2 = $conn->query($sql2);
        while ($row = $res2->fetch_assoc()) {
            $row['id'] = "mto-" . $row['id'];
            $row['quantity'] = (int) $row['quantity'];
            $row['totalSales'] = (float) $row['totalSales'];
            $row['commission'] = (float) $row['commission'];
            $transactions[] = $row;
        }
        $response['data']['transactions'] = $transactions;
    }

    if ($type === 'targets' || $type === 'all') {
        $sql = "SELECT employee_id as employeeId, month, target_amount as target FROM hr_sales_targets";
        $targets = [];
        $res = $conn->query($sql);
        while ($row = $res->fetch_assoc()) {
            $row['target'] = (float) $row['target'];
            $targets[] = $row;
        }
        $response['data']['targets'] = $targets;
    }

    if ($type === 'movements' || $type === 'all') {
        $sql = "SELECT code as id, full_name as name, position, 'NEW' as type, hire_date as date, DATE_FORMAT(hire_date, '%Y-%m') as month FROM employees WHERE hire_date IS NOT NULL 
                UNION 
                SELECT code as id, full_name as name, position, 'RESIGNED' as type, resign_date as date, DATE_FORMAT(resign_date, '%Y-%m') as month FROM employees WHERE resign_date IS NOT NULL";
        $movements = [];
        $res = $conn->query($sql);
        while ($row = $res->fetch_assoc()) {
            $movements[] = $row;
        }
        $response['data']['movements'] = $movements;
    }

    if ($type === 'kpi' || $type === 'all') {
        $sql = "SELECT id, employee_id as employeeId, employee_name as employeeName, department, month, kpi_score as score, remark FROM hr_kpi_records";
        $kpi = [];
        $res = $conn->query($sql);
        while ($row = $res->fetch_assoc()) {
            $row['score'] = (float) $row['score'];
            $kpi[] = $row;
        }
        $response['data']['kpi'] = $kpi;
    }

    echo json_encode($response);
} elseif ($method === 'POST') {
    // Handle saving targets or other report-related data if needed
    echo json_encode(["status" => "error", "message" => "POST not implemented for reports"]);
}

$conn->close();
