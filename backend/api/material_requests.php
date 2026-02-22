<?php
// เปิด Error Reporting
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
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

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$path_parts = explode('/', trim(parse_url($request_uri, PHP_URL_PATH), '/'));

// Get ID from URL if present
$id = null;
foreach ($path_parts as $key => $part) {
    if ($part === 'material_requests.php' && isset($path_parts[$key + 1]) && is_numeric($path_parts[$key + 1])) {
        $id = intval($path_parts[$key + 1]);
    }
}

if (!$id && isset($_GET['id'])) {
    $id = intval($_GET['id']);
}

switch ($method) {
    case 'GET':
        if ($id) {
            // Get single request
            $sql = "SELECT * FROM material_requests WHERE id = ?";
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
                $request = $result->fetch_assoc();
                echo json_encode(["status" => "success", "data" => $request]);
            } else {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Request not found"]);
            }
        } else {
            // Get all requests with pagination and filtering
            $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
            $search = isset($_GET['search']) ? $_GET['search'] : '';
            $material = isset($_GET['material']) ? $_GET['material'] : 'all';
            $requester = isset($_GET['requester']) ? $_GET['requester'] : 'all';

            $offset = ($page - 1) * $limit;

            // Build WHERE clause
            $where_conditions = [];
            $params = [];
            $types = '';

            if (!empty($search)) {
                $where_conditions[] = "(material_name LIKE ? OR requester LIKE ?)";
                $params[] = '%' . $search . '%';
                $params[] = '%' . $search . '%';
                $types .= 'ss';
            }

            if ($material !== 'all') {
                $where_conditions[] = "material_name = ?";
                $params[] = $material;
                $types .= 's';
            }

            if ($requester !== 'all') {
                $where_conditions[] = "requester = ?";
                $params[] = $requester;
                $types .= 's';
            }

            $where_clause = count($where_conditions) > 0 ? "WHERE " . implode(" AND ", $where_conditions) : "";

            // Count total
            $count_sql = "SELECT COUNT(*) as total FROM material_requests $where_clause";
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
            $sql = "SELECT * FROM material_requests $where_clause ORDER BY created_at DESC LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            $types .= 'ii';

            $stmt = $conn->prepare($sql);
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }
            $stmt->execute();
            $result = $stmt->get_result();

            $requests = [];
            while ($row = $result->fetch_assoc()) {
                $requests[] = $row;
            }

            $total_pages = ceil($total / $limit);

            echo json_encode([
                "status" => "success",
                "data" => $requests,
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
        // Create new material request
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->request_date) || empty($data->material_name) || empty($data->qty) || empty($data->requester)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "request_date, material_name, qty, and requester are required"]);
            exit();
        }

        // Get material from database
        $get_material_sql = "SELECT * FROM materials WHERE material_name = ?";
        $get_material_stmt = $conn->prepare($get_material_sql);
        $get_material_stmt->bind_param("s", $data->material_name);
        $get_material_stmt->execute();
        $material_result = $get_material_stmt->get_result();

        if ($material_result->num_rows === 0) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Material not found"]);
            exit();
        }

        $material = $material_result->fetch_assoc();

        // Check stock availability
        $qty = intval($data->qty);
        if ($qty > $material['current_qty']) {
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "message" => "Insufficient stock. Available: " . $material['current_qty'] . " " . $material['unit']
            ]);
            exit();
        }

        // Start transaction
        $conn->begin_transaction();

        try {
            // Create request
            $insert_sql = "INSERT INTO material_requests (request_date, material_id, material_name, qty, requester, remark, status) 
                          VALUES (?, ?, ?, ?, ?, ?, ?)";
            $insert_stmt = $conn->prepare($insert_sql);

            if (!$insert_stmt) {
                throw new Exception("Prepare failed: " . $conn->error);
            }

            $remark = isset($data->remark) ? $data->remark : '';
            $status = 'บันทึกแล้ว';

            $insert_stmt->bind_param(
                "sisisss",
                $data->request_date,
                $material['id'],
                $data->material_name,
                $qty,
                $data->requester,
                $remark,
                $status
            );

            if (!$insert_stmt->execute()) {
                throw new Exception("Failed to create request: " . $insert_stmt->error);
            }

            $new_request_id = $conn->insert_id;

            // Deduct stock
            $new_qty = $material['current_qty'] - $qty;
            $update_stock_sql = "UPDATE materials SET current_qty = ? WHERE id = ?";
            $update_stock_stmt = $conn->prepare($update_stock_sql);
            $update_stock_stmt->bind_param("ii", $new_qty, $material['id']);

            if (!$update_stock_stmt->execute()) {
                throw new Exception("Failed to update stock: " . $update_stock_stmt->error);
            }

            // Commit transaction
            $conn->commit();

            // Get created request
            $get_request_sql = "SELECT * FROM material_requests WHERE id = ?";
            $get_request_stmt = $conn->prepare($get_request_sql);
            $get_request_stmt->bind_param("i", $new_request_id);
            $get_request_stmt->execute();
            $request_result = $get_request_stmt->get_result();
            $request = $request_result->fetch_assoc();

            // Check if stock is low
            $is_low_stock = $new_qty <= $material['min_qty'];

            http_response_code(201);
            echo json_encode([
                "status" => "success",
                "message" => "Material request created successfully",
                "data" => [
                    "request" => $request,
                    "lowStock" => $is_low_stock,
                    "remainingQty" => $new_qty
                ]
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Update material request
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Request ID is required"]);
            exit();
        }

        $data = json_decode(file_get_contents("php://input"));

        // Get existing request
        $get_request_sql = "SELECT * FROM material_requests WHERE id = ?";
        $get_request_stmt = $conn->prepare($get_request_sql);
        $get_request_stmt->bind_param("i", $id);
        $get_request_stmt->execute();
        $request_result = $get_request_stmt->get_result();

        if ($request_result->num_rows === 0) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Request not found"]);
            exit();
        }

        $existing_request = $request_result->fetch_assoc();

        // Start transaction
        $conn->begin_transaction();

        try {
            // Update fields list
            $update_fields = [];
            $params = [];
            $types = '';

            // Handle material change or quantity change for stock adjustment
            $material_changed = isset($data->material_name) && $data->material_name !== $existing_request['material_name'];
            $qty_changed = isset($data->qty) && $data->qty != $existing_request['qty'];

            if ($material_changed || $qty_changed) {
                // Return stock to the old material first
                $return_stock_sql = "UPDATE materials SET current_qty = current_qty + ? WHERE id = ?";
                $return_stock_stmt = $conn->prepare($return_stock_sql);
                $return_stock_stmt->bind_param("ii", $existing_request['qty'], $existing_request['material_id']);
                $return_stock_stmt->execute();

                // Get the material to deduct from (might be the same or different)
                $material_to_deduct_name = $material_changed ? $data->material_name : $existing_request['material_name'];
                $get_material_sql = "SELECT * FROM materials WHERE material_name = ?";
                $get_material_stmt = $conn->prepare($get_material_sql);
                $get_material_stmt->bind_param("s", $material_to_deduct_name);
                $get_material_stmt->execute();
                $material_result = $get_material_stmt->get_result();

                if ($material_result->num_rows === 0) {
                    throw new Exception("Material not found: " . $material_to_deduct_name);
                }

                $material = $material_result->fetch_assoc();
                $new_qty_to_deduct = $qty_changed ? intval($data->qty) : $existing_request['qty'];

                if ($new_qty_to_deduct > $material['current_qty']) {
                    throw new Exception("Insufficient stock in " . $material['material_name'] . ". Available: " . $material['current_qty']);
                }

                // Deduct from new/current material
                $deduct_stock_sql = "UPDATE materials SET current_qty = current_qty - ? WHERE id = ?";
                $deduct_stock_stmt = $conn->prepare($deduct_stock_sql);
                $deduct_stock_stmt->bind_param("ii", $new_qty_to_deduct, $material['id']);
                $deduct_stock_stmt->execute();

                // If material changed, we must update material_id
                if ($material_changed) {
                    $update_fields[] = "material_id = ?";
                    $params[] = $material['id'];
                    $types .= 'i';
                }
            }

            if (isset($data->request_date)) {
                $update_fields[] = "request_date = ?";
                $params[] = $data->request_date;
                $types .= 's';
            }
            if (isset($data->material_name)) {
                $update_fields[] = "material_name = ?";
                $params[] = $data->material_name;
                $types .= 's';
            }
            if (isset($data->qty)) {
                $update_fields[] = "qty = ?";
                $params[] = intval($data->qty);
                $types .= 'i';
            }
            if (isset($data->requester)) {
                $update_fields[] = "requester = ?";
                $params[] = $data->requester;
                $types .= 's';
            }
            if (isset($data->remark)) {
                $update_fields[] = "remark = ?";
                $params[] = $data->remark;
                $types .= 's';
            }

            if (!empty($update_fields)) {
                $params[] = $id;
                $types .= 'i';

                $update_sql = "UPDATE material_requests SET " . implode(", ", $update_fields) . " WHERE id = ?";
                $update_stmt = $conn->prepare($update_sql);
                $update_stmt->bind_param($types, ...$params);

                if (!$update_stmt->execute()) {
                    throw new Exception("Failed to update request: " . $update_stmt->error);
                }
            }

            // Commit transaction
            $conn->commit();

            // Get updated request
            $get_request_stmt->execute();
            $request_result = $get_request_stmt->get_result();
            $request = $request_result->fetch_assoc();

            echo json_encode(["status" => "success", "message" => "Request updated successfully", "data" => $request]);

        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Cancel/Delete material request
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Request ID is required"]);
            exit();
        }

        // Get request
        $get_request_sql = "SELECT * FROM material_requests WHERE id = ?";
        $get_request_stmt = $conn->prepare($get_request_sql);
        $get_request_stmt->bind_param("i", $id);
        $get_request_stmt->execute();
        $request_result = $get_request_stmt->get_result();

        if ($request_result->num_rows === 0) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Request not found"]);
            exit();
        }

        $request = $request_result->fetch_assoc();

        // Check if request is from today
        $today = date('Y-m-d');
        if ($request['request_date'] !== $today) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Can only cancel today's requests"]);
            exit();
        }

        // Start transaction
        $conn->begin_transaction();

        try {
            // Return stock
            $get_material_sql = "SELECT * FROM materials WHERE id = ?";
            $get_material_stmt = $conn->prepare($get_material_sql);
            $get_material_stmt->bind_param("i", $request['material_id']);
            $get_material_stmt->execute();
            $material_result = $get_material_stmt->get_result();

            if ($material_result->num_rows > 0) {
                $material = $material_result->fetch_assoc();
                $new_qty = $material['current_qty'] + $request['qty'];

                $update_stock_sql = "UPDATE materials SET current_qty = ? WHERE id = ?";
                $update_stock_stmt = $conn->prepare($update_stock_sql);
                $update_stock_stmt->bind_param("ii", $new_qty, $material['id']);
                $update_stock_stmt->execute();
            }

            // Delete request
            $delete_sql = "DELETE FROM material_requests WHERE id = ?";
            $delete_stmt = $conn->prepare($delete_sql);
            $delete_stmt->bind_param("i", $id);

            if (!$delete_stmt->execute()) {
                throw new Exception("Failed to delete request: " . $delete_stmt->error);
            }

            // Commit transaction
            $conn->commit();

            echo json_encode(["status" => "success", "message" => "Request cancelled and stock returned successfully"]);

        } catch (Exception $e) {
            $conn->rollback();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}

$conn->close();
?>