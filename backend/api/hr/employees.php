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
    if (isset($_GET['type']) && $_GET['type'] === 'positions') {
        $result = $conn->query("SELECT name FROM employee_positions ORDER BY name");
        $positions = [];
        while ($row = $result->fetch_assoc()) {
            $positions[] = $row['name'];
        }
        echo json_encode(["status" => "success", "data" => $positions]);
    } elseif (isset($_GET['type']) && $_GET['type'] === 'categories') {
        $result = $conn->query("SELECT id, category_name as name FROM category_product WHERE use_flage = 1 ORDER BY category_name");
        $categories = [];
        while ($row = $result->fetch_assoc()) {
            $categories[] = $row['name'];
        }
        echo json_encode(["status" => "success", "data" => $categories]);
    } else {
        $result = $conn->query("SELECT id, code, full_name as fullName, nickname, department, position, role, status, is_sales as isSales FROM employees ORDER BY created_at DESC");
        $employees = [];
        while ($row = $result->fetch_assoc()) {
            $employees[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $employees]);
    }
} elseif ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);

    if (isset($input['action']) && $input['action'] === 'add_position') {
        $name = $conn->real_escape_string($input['name']);
        $sql = "INSERT INTO employee_positions (name) VALUES ('$name')";
        if ($conn->query($sql)) {
            echo json_encode(["status" => "success", "message" => "Position added"]);
        } else {
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
    } else {
        // Add Employee
        $code = $conn->real_escape_string($input['id']);
        $fullName = $conn->real_escape_string($input['fullName']);
        $nickname = $conn->real_escape_string($input['nickname']);
        $position = $conn->real_escape_string($input['position']);
        $role = $conn->real_escape_string($input['role']);
        $status = $input['status'] ?? 'ACTIVE';

        $sql = "INSERT INTO employees (code, full_name, nickname, position, role, status) VALUES ('$code', '$fullName', '$nickname', '$position', '$role', '$status')";
        if ($conn->query($sql)) {
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        } else {
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
    }
} elseif ($method === 'PUT') {
    $input = json_decode(file_get_contents("php://input"), true);
    $id = $conn->real_escape_string($input['id']); // This is the 'code' or primary key?
    // In React component, 'id' in form is the code. But we might need the numeric PK for update if code changes.
    // Let's assume 'code' is the unique identifier for now as used in the component.

    $fullName = $conn->real_escape_string($input['fullName']);
    $nickname = $conn->real_escape_string($input['nickname']);
    $position = $conn->real_escape_string($input['position']);
    $role = $conn->real_escape_string($input['role']);
    $status = $conn->real_escape_string($input['status'] ?? 'ACTIVE');

    $sql = "UPDATE employees SET full_name='$fullName', nickname='$nickname', position='$position', role='$role', status='$status' WHERE code='$id'";
    if ($conn->query($sql)) {
        echo json_encode(["status" => "success", "message" => "Updated"]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
} elseif ($method === 'DELETE') {
    if (isset($_GET['type']) && $_GET['type'] === 'position') {
        $name = $conn->real_escape_string($_GET['name']);
        $sql = "DELETE FROM employee_positions WHERE name = '$name'";
        if ($conn->query($sql)) {
            echo json_encode(["status" => "success", "message" => "Position deleted"]);
        } else {
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
    } else {
        // We usually don't delete employees, just set status to RESIGNED
        $id = $conn->real_escape_string($_GET['id']);
        $sql = "UPDATE employees SET status='RESIGNED' WHERE code='$id'";
        if ($conn->query($sql)) {
            echo json_encode(["status" => "success", "message" => "Employee resigned"]);
        } else {
            echo json_encode(["status" => "error", "message" => $conn->error]);
        }
    }
}

$conn->close();
