<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require __DIR__ . '/../../condb.php';
/** @var mysqli $conn */
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        if (isset($_GET['meta'])) {
            $categories = [];
            $res = $conn->query("SELECT * FROM inventory_categories ORDER BY id ASC");
            if ($res) while ($row = $res->fetch_assoc()) $categories[] = ["id" => (int) $row['id'], "name" => $row['name']];

            $units = [];
            $res = $conn->query("SELECT * FROM inventory_units ORDER BY id ASC");
            if ($res) while ($row = $res->fetch_assoc()) $units[] = ["id" => (int) $row['id'], "name" => $row['name'], "abbr" => $row['abbr']];

            echo json_encode(["status" => "success", "data" => ["categories" => $categories, "units" => $units]]);
            exit();
        }

        $where = [];
        if (!empty($_GET['category'])) {
            $cat = $conn->real_escape_string($_GET['category']);
            $where[] = "c.name = '$cat'";
        }
        if (!empty($_GET['search'])) {
            $s = $conn->real_escape_string($_GET['search']);
            $where[] = "(p.code LIKE '%$s%' OR p.name LIKE '%$s%')";
        }
        $whereSql = count($where) > 0 ? "WHERE " . implode(" AND ", $where) : "";

        $sql = "SELECT p.*, c.name as category_name, u.name as unit_name, u.abbr as unit_abbr
                FROM inventory_products p
                LEFT JOIN inventory_categories c ON p.category_id = c.id
                LEFT JOIN inventory_units u ON p.unit_id = u.id
                $whereSql
                ORDER BY p.id ASC";
        $data = [];
        $res = $conn->query($sql);
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $data[] = [
                    "id" => (int) $row['id'],
                    "code" => $row['code'],
                    "name" => $row['name'],
                    "categoryId" => $row['category_id'] ? (int) $row['category_id'] : null,
                    "category" => $row['category_name'],
                    "subcategory" => $row['subcategory'],
                    "unitId" => $row['unit_id'] ? (int) $row['unit_id'] : null,
                    "unit" => $row['unit_abbr'] ?: $row['unit_name'],
                    "minStock" => (int) $row['min_stock'],
                    "image" => $row['image'],
                ];
            }
        }
        echo json_encode(["status" => "success", "data" => $data]);
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        $action = $input['action'] ?? 'product';

        if ($action === 'product') {
            $code = trim($input['code'] ?? '');
            $name = $input['name'] ?? '';
            $categoryId = !empty($input['categoryId']) ? (int) $input['categoryId'] : null;
            $subcategory = $input['subcategory'] ?? null;
            $unitId = !empty($input['unitId']) ? (int) $input['unitId'] : null;
            $minStock = (int) ($input['minStock'] ?? 0);
            $image = $input['image'] ?? '/placeholder.svg';

            if ($code === '' || $name === '') {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "code and name are required"]);
                exit();
            }

            if (isset($input['id']) && $input['id']) {
                $id = (int) $input['id'];
                $stmt = $conn->prepare("UPDATE inventory_products SET code=?, name=?, category_id=?, subcategory=?, unit_id=?, min_stock=?, image=? WHERE id=?");
                $stmt->bind_param("ssisiisi", $code, $name, $categoryId, $subcategory, $unitId, $minStock, $image, $id);
                $stmt->execute();
                echo json_encode(["status" => "success", "id" => $id]);
            } else {
                $stmt = $conn->prepare("INSERT INTO inventory_products (code, name, category_id, subcategory, unit_id, min_stock, image) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("ssisiis", $code, $name, $categoryId, $subcategory, $unitId, $minStock, $image);
                if ($stmt->execute()) {
                    echo json_encode(["status" => "success", "id" => $conn->insert_id]);
                } else {
                    http_response_code(500);
                    echo json_encode(["status" => "error", "message" => "รหัสสินค้านี้มีอยู่แล้ว หรือเกิดข้อผิดพลาด: " . $stmt->error]);
                }
            }
        } elseif ($action === 'category') {
            $name = $input['name'] ?? '';
            if ($name === '') {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "name is required"]);
                exit();
            }
            if (isset($input['id']) && $input['id']) {
                $id = (int) $input['id'];
                $stmt = $conn->prepare("UPDATE inventory_categories SET name = ? WHERE id = ?");
                $stmt->bind_param("si", $name, $id);
                $stmt->execute();
                echo json_encode(["status" => "success", "id" => $id]);
            } else {
                $stmt = $conn->prepare("INSERT INTO inventory_categories (name) VALUES (?)");
                $stmt->bind_param("s", $name);
                $stmt->execute();
                echo json_encode(["status" => "success", "id" => $conn->insert_id]);
            }
        } elseif ($action === 'unit') {
            $name = $input['name'] ?? '';
            $abbr = $input['abbr'] ?? $name;
            if ($name === '') {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "name is required"]);
                exit();
            }
            if (isset($input['id']) && $input['id']) {
                $id = (int) $input['id'];
                $stmt = $conn->prepare("UPDATE inventory_units SET name = ?, abbr = ? WHERE id = ?");
                $stmt->bind_param("ssi", $name, $abbr, $id);
                $stmt->execute();
                echo json_encode(["status" => "success", "id" => $id]);
            } else {
                $stmt = $conn->prepare("INSERT INTO inventory_units (name, abbr) VALUES (?, ?)");
                $stmt->bind_param("ss", $name, $abbr);
                $stmt->execute();
                echo json_encode(["status" => "success", "id" => $conn->insert_id]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Unknown action"]);
        }
    } elseif ($method === 'DELETE') {
        $type = $_GET['type'] ?? 'product';
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id || !in_array($type, ['product', 'category', 'unit'], true)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "type and id are required"]);
            exit();
        }
        $table = [
            'product' => 'inventory_products',
            'category' => 'inventory_categories',
            'unit' => 'inventory_units',
        ][$type];
        $stmt = $conn->prepare("DELETE FROM `$table` WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    } else {
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>
