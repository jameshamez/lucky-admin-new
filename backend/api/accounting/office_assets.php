<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

require_once "../../condb.php";
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    if ($method === 'GET') {
        if (isset($_GET['id'])) {
            // Get single asset details with history
            $id = (int) $_GET['id'];
            $sql = "SELECT * FROM accounting_office_assets WHERE id = $id";
            $res = $conn->query($sql);
            if ($res && $res->num_rows > 0) {
                $asset = $res->fetch_assoc();

                // Get history
                $histSql = "SELECT * FROM accounting_office_asset_history WHERE asset_id_fk = $id ORDER BY history_date DESC, created_at DESC";
                $histRes = $conn->query($histSql);
                $history = [];
                if ($histRes) {
                    while ($h = $histRes->fetch_assoc()) {
                        $history[] = [
                            "id" => $h['id'],
                            "date" => $h['history_date'],
                            "type" => $h['type'],
                            "description" => $h['description'],
                            "cost" => (float) $h['cost'],
                            "fromUser" => $h['from_user'],
                            "toUser" => $h['to_user']
                        ];
                    }
                }
                $asset['history'] = $history;
                echo json_encode(["status" => "success", "data" => $asset]);
            } else {
                echo json_encode(["status" => "error", "message" => "Asset not found"]);
            }
        } else {
            // Get all assets
            $sql = "SELECT * FROM accounting_office_assets ORDER BY created_at DESC";
            $res = $conn->query($sql);
            $assets = [];
            if ($res) {
                while ($row = $res->fetch_assoc()) {
                    $row['price'] = (float) $row['price'];
                    $assets[] = $row;
                }
            }
            echo json_encode(["status" => "success", "data" => $assets]);
        }
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);

        if (isset($input['action']) && $input['action'] === 'add_history') {
            // Add a history entry
            $asset_id_fk = (int) $input['asset_id'];
            $date = $input['date'];
            $type = $input['type'];
            $description = $input['description'];
            $cost = (float) ($input['cost'] ?? 0);
            $fromUser = $input['fromUser'] ?? null;
            $toUser = $input['toUser'] ?? null;

            $stmt = $conn->prepare("INSERT INTO accounting_office_asset_history (asset_id_fk, history_date, type, description, cost, from_user, to_user) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("isssdss", $asset_id_fk, $date, $type, $description, $cost, $fromUser, $toUser);

            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "History added"]);
            } else {
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
        } elseif (isset($input['id'])) {
            // Update existing asset
            $id = (int) $input['id'];
            $asset_id = $input['assetId'];
            $name = $input['name'];
            $category = $input['category'];
            $assigned_to = $input['assignedTo'] ?? null;
            $purchase_date = $input['purchaseDate'];
            $price = (float) $input['price'];
            $status = $input['status'];

            $stmt = $conn->prepare("UPDATE accounting_office_assets SET asset_id = ?, name = ?, category = ?, assigned_to = ?, purchase_date = ?, price = ?, status = ? WHERE id = ?");
            $stmt->bind_param("sssssdsi", $asset_id, $name, $category, $assigned_to, $purchase_date, $price, $status, $id);

            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Asset updated"]);
            } else {
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
        } else {
            // Create new asset
            $asset_id = $input['assetId'];
            $name = $input['name'];
            $category = $input['category'];
            $assigned_to = $input['assignedTo'] ?? null;
            $purchase_date = $input['purchaseDate'];
            $price = (float) $input['price'];
            $status = $input['status'] ?? 'ว่าง';

            $stmt = $conn->prepare("INSERT INTO accounting_office_assets (asset_id, name, category, assigned_to, purchase_date, price, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssds", $asset_id, $name, $category, $assigned_to, $purchase_date, $price, $status);

            if ($stmt->execute()) {
                $new_id = $conn->insert_id;
                // Add initial history
                $histDesc = "นำเข้าอุปกรณ์ใหม่";
                $histType = "register";
                $histStmt = $conn->prepare("INSERT INTO accounting_office_asset_history (asset_id_fk, history_date, type, description) VALUES (?, ?, ?, ?)");
                $histStmt->bind_param("isss", $new_id, $purchase_date, $histType, $histDesc);
                $histStmt->execute();

                echo json_encode(["status" => "success", "message" => "Asset created", "id" => $new_id]);
            } else {
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
        }
    } elseif ($method === 'DELETE') {
        $id = (int) $_GET['id'];
        $stmt = $conn->prepare("DELETE FROM accounting_office_assets WHERE id = ?");
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "Asset deleted"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}

$conn->close();
?>