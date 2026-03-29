<?php
// เปิด Error Reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../condb.php';

// เช็คการเชื่อมต่อ
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]);
    exit();
}
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$path_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));

// Get ID from URL if present (e.g., materials.php/1 or materials.php/1/adjust)
$id = null;
$is_adjust = false;

foreach ($path_parts as $key => $part) {
    if ($part === 'materials.php' && isset($path_parts[$key + 1]) && is_numeric($path_parts[$key + 1])) {
        $id = intval($path_parts[$key + 1]);
        if (isset($path_parts[$key + 2]) && $path_parts[$key + 2] === 'adjust') {
            $is_adjust = true;
        }
    }
}

if (!$id && isset($_GET['id'])) {
    $id = intval($_GET['id']);
}

switch ($method) {
    case 'GET':
        if ($id) {
            // Get single material
            $sql = "SELECT * FROM materials WHERE id = ?";
            $stmt = $conn->prepare($sql);

            if (!$stmt) {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
                exit();
            }

            $stmt->bind_param("i", $id);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $material = $result->fetch_assoc();

                // Get movement history
                $history_sql = "SELECT id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as date, type, qty, note, created_by as by_user 
                                FROM material_movements 
                                WHERE material_id = ? 
                                ORDER BY created_at DESC LIMIT 50";
                $hist_stmt = $conn->prepare($history_sql);
                if ($hist_stmt) {
                    $hist_stmt->bind_param("i", $id);
                    $hist_stmt->execute();
                    $hist_result = $hist_stmt->get_result();
                    $history = [];
                    while ($hrow = $hist_result->fetch_assoc()) {
                        // Map db column 'by_user' to 'by' to match frontend interface
                        $hrow['by'] = $hrow['by_user'] ? $hrow['by_user'] : 'System';
                        unset($hrow['by_user']);
                        $history[] = $hrow;
                    }
                    $material['movementHistory'] = $history;
                }

                echo json_encode(["status" => "success", "data" => $material]);
            } else {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Material not found"]);
            }
        } else {
            // Get all materials with pagination and filtering
            $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
            $search = isset($_GET['search']) ? $_GET['search'] : '';
            $status = isset($_GET['status']) ? $_GET['status'] : 'all';

            $offset = ($page - 1) * $limit;

            // Build WHERE clause
            $where_conditions = [];
            $params = [];
            $types = '';

            // Filter by department (Required for segregation)
            $dept = isset($_GET['department']) ? $_GET['department'] : 'design';
            if ($dept !== 'all') {
                $where_conditions[] = "department = ?";
                $params[] = $dept;
                $types .= 's';
            }

            if (!empty($search)) {
                $where_conditions[] = "material_name LIKE ?";
                $params[] = '%' . $search . '%';
                $types .= 's';
            }

            if ($status === 'low') {
                $where_conditions[] = "current_qty <= min_qty AND current_qty > 0";
            } elseif ($status === 'out') {
                $where_conditions[] = "current_qty = 0";
            }

            $where_clause = count($where_conditions) > 0 ? "WHERE " . implode(" AND ", $where_conditions) : "";

            // Count total
            $count_sql = "SELECT COUNT(*) as total FROM materials $where_clause";
            if (!empty($params)) {
                $count_stmt = $conn->prepare($count_sql);
                $count_stmt->bind_param($types, ...$params);
                $count_stmt->execute();
                $count_result = $count_stmt->get_result();
                $total = $count_result->fetch_assoc()['total'];
            } else {
                $count_result = $conn->query($count_sql);
                $total = $count_result->fetch_assoc()['total'];
            }

            // Get paginated data
            $sql = "SELECT * FROM materials $where_clause ORDER BY updated_at DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            $types .= 'ii';

            $stmt = $conn->prepare($sql);
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }
            $stmt->execute();
            $result = $stmt->get_result();

            $materials = [];
            while ($row = $result->fetch_assoc()) {
                // Fetch recent history for each material
                $history_sql = "SELECT id, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') as date, type, qty, note, created_by as by_user 
                                FROM material_movements 
                                WHERE material_id = ? 
                                ORDER BY created_at DESC LIMIT 5";
                $hist_stmt = $conn->prepare($history_sql);
                if ($hist_stmt) {
                    $hist_stmt->bind_param("i", $row['id']);
                    $hist_stmt->execute();
                    $hist_result = $hist_stmt->get_result();
                    $history = [];
                    while ($hrow = $hist_result->fetch_assoc()) {
                        $hrow['by'] = $hrow['by_user'] ? $hrow['by_user'] : 'System';
                        unset($hrow['by_user']);
                        $history[] = $hrow;
                    }
                    $row['movementHistory'] = $history;
                }
                $materials[] = $row;
            }

            $total_pages = ceil($total / $limit);

            echo json_encode([
                "status" => "success",
                "data" => $materials,
                "pagination" => [
                    "total" => intval($total),
                    "page" => $page,
                    "limit" => $limit,
                    "totalPages" => $total_pages
                ]
            ]);
        }
        break;

    case 'POST':
        // Create new material
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->material_name) || empty($data->unit)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Material name and unit are required"]);
            exit();
        }

        // Check if material already exists
        $check_sql = "SELECT id FROM materials WHERE material_name = ?";
        $check_stmt = $conn->prepare($check_sql);
        $check_stmt->bind_param("s", $data->material_name);
        $check_stmt->execute();
        $check_result = $check_stmt->get_result();

        if ($check_result->num_rows > 0) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Material with this name already exists"]);
            exit();
        }

        $sql = "INSERT INTO materials (material_name, unit, current_qty, min_qty, note, department) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);

        if (!$stmt) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Prepare failed: " . $conn->error]);
            exit();
        }

        $current_qty = isset($data->current_qty) ? intval($data->current_qty) : 0;
        $min_qty = isset($data->min_qty) ? intval($data->min_qty) : 0;
        $note = isset($data->note) ? $data->note : '';
        $department = isset($data->department) ? $data->department : 'design';

        $stmt->bind_param(
            "ssiiss",
            $data->material_name,
            $data->unit,
            $current_qty,
            $min_qty,
            $note,
            $department
        );

        if ($stmt->execute()) {
            $new_id = $conn->insert_id;

            // Get created material
            $get_sql = "SELECT * FROM materials WHERE id = ?";
            $get_stmt = $conn->prepare($get_sql);
            $get_stmt->bind_param("i", $new_id);
            $get_stmt->execute();
            $result = $get_stmt->get_result();
            $material = $result->fetch_assoc();

            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Material created successfully", "data" => $material]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $stmt->error]);
        }
        break;

    case 'PUT':
        // Update material
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Material ID is required"]);
            exit();
        }

        $data = json_decode(file_get_contents("php://input"));

        $update_fields = [];
        $params = [];
        $types = '';

        if (isset($data->material_name)) {
            $update_fields[] = "material_name = ?";
            $params[] = $data->material_name;
            $types .= 's';
        }
        if (isset($data->unit)) {
            $update_fields[] = "unit = ?";
            $params[] = $data->unit;
            $types .= 's';
        }
        if (isset($data->current_qty)) {
            $update_fields[] = "current_qty = ?";
            $params[] = intval($data->current_qty);
            $types .= 'i';
        }
        if (isset($data->min_qty)) {
            $update_fields[] = "min_qty = ?";
            $params[] = intval($data->min_qty);
            $types .= 'i';
        }
        if (isset($data->note)) {
            $update_fields[] = "note = ?";
            $params[] = $data->note;
            $types .= 's';
        }
        if (isset($data->department)) {
            $update_fields[] = "department = ?";
            $params[] = $data->department;
            $types .= 's';
        }

        if (empty($update_fields)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "No fields to update"]);
            exit();
        }

        $params[] = $id;
        $types .= 'i';

        $sql = "UPDATE materials SET " . implode(", ", $update_fields) . " WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);

        if ($stmt->execute()) {
            // Get updated material
            $get_sql = "SELECT * FROM materials WHERE id = ?";
            $get_stmt = $conn->prepare($get_sql);
            $get_stmt->bind_param("i", $id);
            $get_stmt->execute();
            $result = $get_stmt->get_result();
            $material = $result->fetch_assoc();

            echo json_encode(["status" => "success", "message" => "Material updated successfully", "data" => $material]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $stmt->error]);
        }
        break;

    case 'PATCH':
        // Adjust stock
        if (!$id || !$is_adjust) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Invalid endpoint"]);
            exit();
        }

        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->adjustType) || !isset($data->amount)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "adjustType and amount are required"]);
            exit();
        }

        // Get current material
        $get_sql = "SELECT * FROM materials WHERE id = ?";
        $get_stmt = $conn->prepare($get_sql);
        $get_stmt->bind_param("i", $id);
        $get_stmt->execute();
        $result = $get_stmt->get_result();

        if ($result->num_rows === 0) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Material not found"]);
            exit();
        }

        $material = $result->fetch_assoc();
        $current_qty = $material['current_qty'];
        $amount = intval($data->amount);

        // Calculate new quantity
        switch ($data->adjustType) {
            case 'set':
                $new_qty = $amount;
                $movement_type = 'รับเข้า'; // Default or manual override
                break;
            case 'add':
            case 'รับเข้า':
                $new_qty = $current_qty + $amount;
                $movement_type = 'รับเข้า';
                break;
            case 'reduce':
            case 'จ่ายออก':
            case 'เคลม':
            case 'ชำรุด':
            case 'เบิกภายใน':
                $new_qty = $current_qty - $amount;
                $movement_type = in_array($data->adjustType, ['reduce']) ? 'จ่ายออก' : $data->adjustType;
                break;
            default:
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "Invalid adjustType. Must be: set, add, reduce, รับเข้า, จ่ายออก, เคลม, ชำรุด, or เบิกภายใน"]);
                exit();
        }

        // Ensure quantity doesn't go negative
        $new_qty = max(0, $new_qty);

        // Update stock
        $update_sql = "UPDATE materials SET current_qty = ? WHERE id = ?";
        $update_stmt = $conn->prepare($update_sql);
        $update_stmt->bind_param("ii", $new_qty, $id);

        if ($update_stmt->execute()) {
            // Log the movement
            $note = isset($data->note) ? $data->note : null;
            $created_by = isset($data->by) ? $data->by : 'System';

            // Check if material_movements table exists and try to insert
            $log_sql = "INSERT INTO material_movements (material_id, type, qty, note, created_by) VALUES (?, ?, ?, ?, ?)";
            $log_stmt = $conn->prepare($log_sql);
            if ($log_stmt) {
                $log_stmt->bind_param("isiss", $id, $movement_type, $amount, $note, $created_by);
                $log_stmt->execute();
            }

            // Get updated material
            $get_stmt->execute();
            $result = $get_stmt->get_result();
            $material = $result->fetch_assoc();

            echo json_encode(["status" => "success", "message" => "Stock adjusted successfully", "data" => $material]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $update_stmt->error]);
        }
        break;

    case 'DELETE':
        // Delete material
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Material ID is required"]);
            exit();
        }

        $sql = "DELETE FROM materials WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Material deleted successfully"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Database error: " . $stmt->error]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}

$conn->close();
?>