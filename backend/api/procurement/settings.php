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
$type = $_GET['type'] ?? ''; // materials, colors, shipping, general

if ($method === 'GET') {
    $data = [];
    if ($type === 'materials') {
        $res = $conn->query("SELECT * FROM procurement_materials ORDER BY category, material_name");
        while ($row = $res->fetch_assoc())
            $data[] = $row;
    } else if ($type === 'colors') {
        $res = $conn->query("SELECT * FROM procurement_colors ORDER BY name_en");
        while ($row = $res->fetch_assoc())
            $data[] = $row;
    } else if ($type === 'shipping') {
        $res = $conn->query("SELECT * FROM procurement_shipping_methods ORDER BY name");
        while ($row = $res->fetch_assoc())
            $data[] = $row;
    } else if ($type === 'general') {
        $res = $conn->query("SELECT * FROM procurement_settings");
        while ($row = $res->fetch_assoc())
            $data[$row['setting_key']] = $row['setting_value'];
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid type"]);
        exit();
    }
    echo json_encode(["status" => "success", "data" => $data]);
    exit();
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    if ($type === 'materials') {
        $stmt = $conn->prepare("INSERT INTO procurement_materials (category, material_name) VALUES (?, ?)");
        $stmt->bind_param("ss", $input['category'], $input['material_name']);
    } else if ($type === 'colors') {
        $stmt = $conn->prepare("INSERT INTO procurement_colors (name_en, name_th) VALUES (?, ?)");
        $stmt->bind_param("ss", $input['name_en'], $input['name_th']);
    } else if ($type === 'shipping') {
        $stmt = $conn->prepare("INSERT INTO procurement_shipping_methods (name) VALUES (?)");
        $stmt->bind_param("s", $input['name']);
    } else if ($type === 'general') {
        $stmt = $conn->prepare("INSERT INTO procurement_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
        $stmt->bind_param("ss", $input['key'], $input['value']);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid type"]);
        exit();
    }

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "id" => $conn->insert_id]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
    exit();
}

if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if (!$id) {
        echo json_encode(["status" => "error", "message" => "ID required"]);
        exit();
    }

    $table = "";
    if ($type === 'materials')
        $table = "procurement_materials";
    else if ($type === 'colors')
        $table = "procurement_colors";
    else if ($type === 'shipping')
        $table = "procurement_shipping_methods";
    else {
        echo json_encode(["status" => "error", "message" => "Invalid type"]);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM $table WHERE id = ?");
    $stmt->bind_param("i", $id);
    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Deleted"]);
    } else {
        echo json_encode(["status" => "error", "message" => $conn->error]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
?>