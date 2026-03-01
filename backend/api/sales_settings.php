<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

require_once '../condb.php';
$conn->select_db('finfinph_lcukycompany');
$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    exit(0);
}

if ($method == 'GET') {
    if (isset($_GET['type'])) {
        $type = $_GET['type'];
        if ($type == 'master_data') {
            $sql = "SELECT * FROM sales_master_data WHERE is_active = 1";
            $res = $conn->query($sql);
            $data = [];
            while ($row = $res->fetch_assoc())
                $data[] = $row;
            echo json_encode(["status" => "success", "data" => $data]);
        } else if ($type == 'sales_targets') {
            $sql = "SELECT * FROM sales_targets ORDER BY id DESC";
            $res = $conn->query($sql);
            $data = [];
            while ($row = $res->fetch_assoc())
                $data[] = $row;
            echo json_encode(["status" => "success", "data" => $data]);
        } else if ($type == 'activity_targets') {
            $sql = "SELECT * FROM sales_activity_targets ORDER BY id DESC";
            $res = $conn->query($sql);
            $data = [];
            while ($row = $res->fetch_assoc())
                $data[] = $row;
            echo json_encode(["status" => "success", "data" => $data]);
        } else {
            echo json_encode(["status" => "error", "message" => "Unknown type"]);
        }
    } else {
        $master_data = [];
        $res = $conn->query("SELECT * FROM sales_master_data WHERE is_active = 1");
        if ($res) {
            while ($row = $res->fetch_assoc())
                $master_data[] = $row;
        }

        $sales_targets = [];
        $res = $conn->query("SELECT * FROM sales_targets ORDER BY id DESC");
        if ($res) {
            while ($row = $res->fetch_assoc())
                $sales_targets[] = $row;
        }

        $activity_targets = [];
        $res = $conn->query("SELECT * FROM sales_activity_targets ORDER BY id DESC");
        if ($res) {
            while ($row = $res->fetch_assoc())
                $activity_targets[] = $row;
        }

        echo json_encode([
            "status" => "success",
            "data" => [
                "master_data" => $master_data,
                "sales_targets" => $sales_targets,
                "activity_targets" => $activity_targets
            ]
        ]);
    }
}

if ($method == 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!isset($input['action'])) {
        echo json_encode(["status" => "error", "message" => "No action specified"]);
        exit;
    }

    $action = $input['action'];

    if ($action == 'save_master_data') {
        $id = $input['id'] ?? null;
        $category = $input['category'];
        $name = $input['name'];
        $description = $input['description'] ?? '';
        $color = $input['color'] ?? null;

        if ($id) {
            $stmt = $conn->prepare("UPDATE sales_master_data SET category=?, name=?, description=?, color=? WHERE id=?");
            $stmt->bind_param("ssssi", $category, $name, $description, $color, $id);
        } else {
            $stmt = $conn->prepare("INSERT INTO sales_master_data (category, name, description, color) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", $category, $name, $description, $color);
        }

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Data saved", "id" => $id ?: $conn->insert_id]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    } else if ($action == 'save_sales_target') {
        $id = $input['id'] ?? null;
        $target_type = $input['target_type'];
        $target_subject_id = $input['target_subject_id'] ?? null;
        $target_subject_name = $input['target_subject_name'];
        $period_type = $input['period_type'];
        $period_value = $input['period_value'];
        $target_amount = $input['target_amount'];
        $current_amount = $input['current_amount'] ?? 0;

        if ($id) {
            $stmt = $conn->prepare("UPDATE sales_targets SET target_type=?, target_subject_id=?, target_subject_name=?, period_type=?, period_value=?, target_amount=?, current_amount=? WHERE id=?");
            $stmt->bind_param("sssssddi", $target_type, $target_subject_id, $target_subject_name, $period_type, $period_value, $target_amount, $current_amount, $id);
        } else {
            $stmt = $conn->prepare("INSERT INTO sales_targets (target_type, target_subject_id, target_subject_name, period_type, period_value, target_amount, current_amount) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssdd", $target_type, $target_subject_id, $target_subject_name, $period_type, $period_value, $target_amount, $current_amount);
        }

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Target saved", "id" => $id ?: $conn->insert_id]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    } else if ($action == 'save_activity_target') {
        $id = $input['id'] ?? null;
        $employee_id = $input['employee_id'] ?? null;
        $employee_name = $input['employee_name'];
        $activity_type = $input['activity_type'];
        $period_type = $input['period_type'];
        $target_count = $input['target_count'];
        $current_count = $input['current_count'] ?? 0;

        if ($id) {
            $stmt = $conn->prepare("UPDATE sales_activity_targets SET employee_id=?, employee_name=?, activity_type=?, period_type=?, target_count=?, current_count=? WHERE id=?");
            $stmt->bind_param("ssssiii", $employee_id, $employee_name, $activity_type, $period_type, $target_count, $current_count, $id);
        } else {
            $stmt = $conn->prepare("INSERT INTO sales_activity_targets (employee_id, employee_name, activity_type, period_type, target_count, current_count) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssssii", $employee_id, $employee_name, $activity_type, $period_type, $target_count, $current_count);
        }

        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Activity target saved", "id" => $id ?: $conn->insert_id]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
}

if ($method == 'DELETE') {
    $type = $_GET['type'] ?? '';
    $id = $_GET['id'] ?? 0;

    if ($type == 'master_data') {
        // Soft delete
        $stmt = $conn->prepare("UPDATE sales_master_data SET is_active = 0 WHERE id = ?");
        $stmt->bind_param("i", $id);
    } else if ($type == 'sales_targets') {
        $stmt = $conn->prepare("DELETE FROM sales_targets WHERE id = ?");
        $stmt->bind_param("i", $id);
    } else if ($type == 'activity_targets') {
        $stmt = $conn->prepare("DELETE FROM sales_activity_targets WHERE id = ?");
        $stmt->bind_param("i", $id);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid type"]);
        exit;
    }

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Deleted"]);
    } else {
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
}
?>