<?php
ini_set('display_errors', 1);
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
$conn->select_db('finfinph_lcukycompany'); // Removed hardcoded DB selection
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];
$type = $_GET['type'] ?? '';

if ($method === 'GET') {
    if ($type === 'ready_made') {
        $res = $conn->query("SELECT id, category, rate_per_unit as ratePerUnit, unit, calc_method as calcMethod, active FROM hr_config_ready_made ORDER BY id");
        if (!$res) {
            echo json_encode(["status" => "error", "message" => $conn->error]);
            exit;
        }
        $data = [];
        while ($row = $res->fetch_assoc()) {
            $row['ratePerUnit'] = (float) $row['ratePerUnit'];
            $row['active'] = (bool) $row['active'];
            $data[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $data]);
    } elseif ($type === 'mto') {
        $res = $conn->query("SELECT id, category, calc_method as calcMethod, fixed_per_job as fixedPerJob, active FROM hr_config_mto ORDER BY id");
        if (!$res) {
            echo json_encode(["status" => "error", "message" => $conn->error]);
            exit;
        }
        $data = [];
        while ($row = $res->fetch_assoc()) {
            $row['fixedPerJob'] = (float) $row['fixedPerJob'];
            $row['active'] = (bool) $row['active'];
            $id = $row['id'];
            $resTiers = $conn->query("SELECT id, min_qty as minQty, max_qty as maxQty, fixed_amount as fixedAmount, label FROM hr_config_mto_tiers WHERE mto_config_id = $id");
            $tiers = [];
            while ($t = $resTiers->fetch_assoc()) {
                $t['minQty'] = (int) $t['minQty'];
                $t['maxQty'] = $t['maxQty'] !== null ? (int) $t['maxQty'] : null;
                $t['fixedAmount'] = (float) $t['fixedAmount'];
                $tiers[] = $t;
            }
            $row['tiers'] = $tiers;
            $data[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $data]);
    } elseif ($type === 'incentives') {
        $res = $conn->query("SELECT id, min_sales as minSales, max_sales as maxSales, incentive_per_person as incentivePerPerson, label, active FROM hr_config_incentives ORDER BY min_sales");
        if (!$res) {
            echo json_encode(["status" => "error", "message" => $conn->error]);
            exit;
        }
        $data = [];
        while ($row = $res->fetch_assoc()) {
            $row['minSales'] = (float) $row['minSales'];
            $row['maxSales'] = $row['maxSales'] !== null ? (float) $row['maxSales'] : null;
            $row['incentivePerPerson'] = (float) $row['incentivePerPerson'];
            $row['active'] = (bool) $row['active'];
            $data[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $data]);
    } elseif ($type === 'kpi_records') {
        $month = $_GET['month'] ?? '';
        $where = $month ? "WHERE month = '$month'" : "";
        $res = $conn->query("SELECT id, employee_id as employeeId, employee_name as employeeName, department, month, kpi_score as kpiScore, remark FROM hr_kpi_records $where ORDER BY month DESC, employee_name");
        if (!$res) {
            echo json_encode(["status" => "error", "message" => $conn->error]);
            exit;
        }
        $data = [];
        while ($row = $res->fetch_assoc()) {
            $row['kpiScore'] = (float) $row['kpiScore'];
            $data[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $data]);
    } elseif ($type === 'kpi_integrations') {
        $res = $conn->query("SELECT id, department, data_source_type as dataSourceType, sheet_url as sheetUrl, api_endpoint as apiEndpoint, note, active FROM hr_kpi_integrations ORDER BY id");
        if (!$res) {
            echo json_encode(["status" => "error", "message" => $conn->error]);
            exit;
        }
        $data = [];
        while ($row = $res->fetch_assoc()) {
            $row['active'] = (bool) $row['active'];
            $data[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $data]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    if ($type === 'ready_made') {
        $category = $conn->real_escape_string($input['category']);
        $rate = floatval($input['ratePerUnit']);
        $unit = $conn->real_escape_string($input['unit']);
        $method = $conn->real_escape_string($input['calcMethod']);
        $active = $input['active'] ? 1 : 0;
        $sql = "INSERT INTO hr_config_ready_made (category, rate_per_unit, unit, calc_method, active) VALUES ('$category', $rate, '$unit', '$method', $active)";
        if ($conn->query($sql))
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        else
            echo json_encode(["status" => "error", "message" => $conn->error]);
    } elseif ($type === 'mto') {
        $category = $conn->real_escape_string($input['category']);
        $method = $conn->real_escape_string($input['calcMethod']);
        $fixed = floatval($input['fixedPerJob'] ?? 0);
        $active = $input['active'] ? 1 : 0;
        $sql = "INSERT INTO hr_config_mto (category, calc_method, fixed_per_job, active) VALUES ('$category', '$method', $fixed, $active)";
        if ($conn->query($sql)) {
            $id = $conn->insert_id;
            if (isset($input['tiers']) && is_array($input['tiers'])) {
                foreach ($input['tiers'] as $t) {
                    $min = (int) $t['minQty'];
                    $max = $t['maxQty'] !== null ? (int) $t['maxQty'] : "NULL";
                    $amt = floatval($t['fixedAmount']);
                    $label = $conn->real_escape_string($t['label']);
                    $conn->query("INSERT INTO hr_config_mto_tiers (mto_config_id, min_qty, max_qty, fixed_amount, label) VALUES ($id, $min, $max, $amt, '$label')");
                }
            }
            echo json_encode(["status" => "success", "id" => $id]);
        } else
            echo json_encode(["status" => "error", "message" => $conn->error]);
    } elseif ($type === 'incentives') {
        $min = floatval($input['minSales']);
        $max = $input['maxSales'] !== null ? floatval($input['maxSales']) : "NULL";
        $amt = floatval($input['incentivePerPerson']);
        $label = $conn->real_escape_string($input['label']);
        $active = $input['active'] ? 1 : 0;
        $sql = "INSERT INTO hr_config_incentives (min_sales, max_sales, incentive_per_person, label, active) VALUES ($min, $max, $amt, '$label', $active)";
        if ($conn->query($sql))
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        else
            echo json_encode(["status" => "error", "message" => $conn->error]);
    } elseif ($type === 'kpi_records') {
        $empId = $conn->real_escape_string($input['employeeId']);
        $empName = $conn->real_escape_string($input['employeeName']);
        $dept = $conn->real_escape_string($input['department']);
        $month = $conn->real_escape_string($input['month']);
        $score = floatval($input['kpiScore']);
        $remark = $conn->real_escape_string($input['remark']);
        $sql = "INSERT INTO hr_kpi_records (employee_id, employee_name, department, month, kpi_score, remark) VALUES ('$empId', '$empName', '$dept', '$month', $score, '$remark')";
        if ($conn->query($sql))
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        else
            echo json_encode(["status" => "error", "message" => $conn->error]);
    } elseif ($type === 'kpi_integrations') {
        $dept = $conn->real_escape_string($input['department']);
        $sourceType = $conn->real_escape_string($input['dataSourceType']);
        $sheetUrl = $conn->real_escape_string($input['sheetUrl'] ?? '');
        $apiEp = $conn->real_escape_string($input['apiEndpoint'] ?? '');
        $note = $conn->real_escape_string($input['note'] ?? '');
        $active = $input['active'] ? 1 : 0;
        $sql = "INSERT INTO hr_kpi_integrations (department, data_source_type, sheet_url, api_endpoint, note, active) VALUES ('$dept', '$sourceType', '$sheetUrl', '$apiEp', '$note', $active)";
        if ($conn->query($sql))
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        else
            echo json_encode(["status" => "error", "message" => $conn->error]);
    }
} elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents("php://input"), true);
    $id = intval($input['id']);
    if ($type === 'ready_made') {
        $category = $conn->real_escape_string($input['category']);
        $rate = floatval($input['ratePerUnit']);
        $unit = $conn->real_escape_string($input['unit']);
        $method = $conn->real_escape_string($input['calcMethod']);
        $active = $input['active'] ? 1 : 0;
        $sql = "UPDATE hr_config_ready_made SET category='$category', rate_per_unit=$rate, unit='$unit', calc_method='$method', active=$active WHERE id=$id";
        if ($conn->query($sql))
            echo json_encode(["status" => "success"]);
        else
            echo json_encode(["status" => "error", "message" => $conn->error]);
    } elseif ($type === 'mto') {
        $category = $conn->real_escape_string($input['category']);
        $method = $conn->real_escape_string($input['calcMethod']);
        $fixed = floatval($input['fixedPerJob'] ?? 0);
        $active = $input['active'] ? 1 : 0;
        $sql = "UPDATE hr_config_mto SET category='$category', calc_method='$method', fixed_per_job=$fixed, active=$active WHERE id=$id";
        if ($conn->query($sql)) {
            $conn->query("DELETE FROM hr_config_mto_tiers WHERE mto_config_id = $id");
            if (isset($input['tiers']) && is_array($input['tiers'])) {
                foreach ($input['tiers'] as $t) {
                    $min = (int) $t['minQty'];
                    $max = $t['maxQty'] !== null ? (int) $t['maxQty'] : "NULL";
                    $amt = floatval($t['fixedAmount']);
                    $label = $conn->real_escape_string($t['label']);
                    $conn->query("INSERT INTO hr_config_mto_tiers (mto_config_id, min_qty, max_qty, fixed_amount, label) VALUES ($id, $min, $max, $amt, '$label')");
                }
            }
            echo json_encode(["status" => "success"]);
        } else
            echo json_encode(["status" => "error", "message" => $conn->error]);
    } elseif ($type === 'incentives') {
        $min = floatval($input['minSales']);
        $max = $input['maxSales'] !== null ? floatval($input['maxSales']) : "NULL";
        $amt = floatval($input['incentivePerPerson']);
        $label = $conn->real_escape_string($input['label']);
        $active = $input['active'] ? 1 : 0;
        $sql = "UPDATE hr_config_incentives SET min_sales=$min, max_sales=$max, incentive_per_person=$amt, label='$label', active=$active WHERE id=$id";
        if ($conn->query($sql))
            echo json_encode(["status" => "success"]);
        else
            echo json_encode(["status" => "error", "message" => $conn->error]);
    } elseif ($type === 'kpi_records') {
        $empId = $conn->real_escape_string($input['employeeId']);
        $empName = $conn->real_escape_string($input['employeeName']);
        $dept = $conn->real_escape_string($input['department']);
        $month = $conn->real_escape_string($input['month']);
        $score = floatval($input['kpiScore']);
        $remark = $conn->real_escape_string($input['remark']);
        $sql = "UPDATE hr_kpi_records SET employee_id='$empId', employee_name='$empName', department='$dept', month='$month', kpi_score=$score, remark='$remark' WHERE id=$id";
        if ($conn->query($sql))
            echo json_encode(["status" => "success"]);
        else
            echo json_encode(["status" => "error", "message" => $conn->error]);
    } elseif ($type === 'kpi_integrations') {
        $dept = $conn->real_escape_string($input['department']);
        $sourceType = $conn->real_escape_string($input['dataSourceType']);
        $sheetUrl = $conn->real_escape_string($input['sheetUrl'] ?? '');
        $apiEp = $conn->real_escape_string($input['apiEndpoint'] ?? '');
        $note = $conn->real_escape_string($input['note'] ?? '');
        $active = $input['active'] ? 1 : 0;
        $sql = "UPDATE hr_kpi_integrations SET department='$dept', data_source_type='$sourceType', sheet_url='$sheetUrl', api_endpoint='$apiEp', note='$note', active=$active WHERE id=$id";
        if ($conn->query($sql))
            echo json_encode(["status" => "success"]);
        else
            echo json_encode(["status" => "error", "message" => $conn->error]);
    }
} elseif ($method === 'DELETE') {
    $id = intval($_GET['id']);
    $tableMap = [
        'ready_made' => 'hr_config_ready_made',
        'mto' => 'hr_config_mto',
        'incentives' => 'hr_config_incentives',
        'kpi_records' => 'hr_kpi_records',
        'kpi_integrations' => 'hr_kpi_integrations'
    ];
    if (isset($tableMap[$type])) {
        $table = $tableMap[$type];
        $sql = "DELETE FROM $table WHERE id=$id";
        if ($conn->query($sql))
            echo json_encode(["status" => "success"]);
        else
            echo json_encode(["status" => "error", "message" => $conn->error]);
    }
}

$conn->close();
?>