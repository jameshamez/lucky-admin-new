<?php
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

require '../../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $month = $_GET['month'] ?? 'all';
    $year = $_GET['year'] ?? 'all';

    $where1 = ["commission_status = 'COMPLETED'"];
    $where2 = ["commission_status = 'COMPLETED'"];

    if ($year !== 'all') {
        $where1[] = "commission_period LIKE '$year-%'";
        $where2[] = "commission_period LIKE '$year-%'";
    }
    if ($month !== 'all') {
        $m = str_pad($month, 2, '0', STR_PAD_LEFT);
        if ($year !== 'all') {
            $pattern = "$year-$m";
            $where1[count($where1) - 1] = "commission_period = '$pattern'";
            $where2[count($where2) - 1] = "commission_period = '$pattern'";
        } else {
            $where1[] = "commission_period LIKE '%-$m'";
            $where2[] = "commission_period LIKE '%-$m'";
        }
    }

    $whereSql1 = "WHERE " . implode(" AND ", $where1);
    $whereSql2 = "WHERE " . implode(" AND ", $where2);

    $sql1 = "SELECT id, commission_period as month, sale_name as employeeName, po_number as poNumber, job_name as jobName, 'ReadyMade' as type, quantity, total_sales_amount as totalSales, commission_amount as commission, rate_display as rateInfo FROM hr_commission_ready_made $whereSql1";
    $sql2 = "SELECT id, commission_period as month, sale_name as employeeName, po_number as poNumber, job_name as jobName, 'MadeToOrder' as type, quantity, total_sales_amount as totalSales, commission_amount as commission, tier_condition as rateInfo FROM hr_commission_mto $whereSql2";

    $data = [];

    $res1 = $conn->query($sql1);
    if ($res1) {
        while ($row = $res1->fetch_assoc()) {
            $row['id'] = "rm_" . $row['id'];
            $row['quantity'] = (int) $row['quantity'];
            $row['totalSales'] = (float) $row['totalSales'];
            $row['commission'] = (float) $row['commission'];
            $data[] = $row;
        }
    }

    $res2 = $conn->query($sql2);
    if ($res2) {
        while ($row = $res2->fetch_assoc()) {
            $row['id'] = "mto_" . $row['id'];
            $row['quantity'] = (int) $row['quantity'];
            $row['totalSales'] = (float) $row['totalSales'];
            $row['commission'] = (float) $row['commission'];
            $data[] = $row;
        }
    }

    echo json_encode(["status" => "success", "data" => $data]);
}
$conn->close();
