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

require __DIR__ . '/../condb.php';
/** @var mysqli $conn */
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        $sections = [];
        $sectionsById = [];
        $res = $conn->query("SELECT * FROM `user_manual_sections` ORDER BY sort_order ASC, id ASC");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $section = [
                    "id" => (int) $row['id'],
                    "category" => $row['category'],
                    "subcategories" => [],
                ];
                $sections[] = $section;
                $sectionsById[(int) $row['id']] = count($sections) - 1;
            }
        }

        $subsById = [];
        $res = $conn->query("SELECT * FROM `user_manual_subsections` ORDER BY sort_order ASC, id ASC");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $sectionId = (int) $row['section_id'];
                if (!isset($sectionsById[$sectionId])) continue;
                $sub = [
                    "id" => (int) $row['id'],
                    "title" => $row['title'],
                    "content" => $row['content'],
                    "attachments" => [],
                ];
                $sections[$sectionsById[$sectionId]]['subcategories'][] = $sub;
                $subIndex = count($sections[$sectionsById[$sectionId]]['subcategories']) - 1;
                $subsById[(int) $row['id']] = [$sectionsById[$sectionId], $subIndex];
            }
        }

        $res = $conn->query("SELECT * FROM `user_manual_attachments` ORDER BY id ASC");
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $subId = (int) $row['subsection_id'];
                if (!isset($subsById[$subId])) continue;
                [$si, $ui] = $subsById[$subId];
                $sections[$si]['subcategories'][$ui]['attachments'][] = [
                    "id" => (int) $row['id'],
                    "fileName" => $row['file_name'],
                    "fileUrl" => $row['file_url'],
                ];
            }
        }

        echo json_encode(["status" => "success", "data" => $sections]);
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        $action = $input['action'] ?? '';

        if ($action === 'section') {
            $category = $input['category'] ?? '';
            if ($category === '') {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "category is required"]);
                exit();
            }
            if (isset($input['id']) && $input['id']) {
                $id = (int) $input['id'];
                $stmt = $conn->prepare("UPDATE user_manual_sections SET category = ? WHERE id = ?");
                $stmt->bind_param("si", $category, $id);
                $stmt->execute();
                echo json_encode(["status" => "success", "id" => $id]);
            } else {
                $stmt = $conn->prepare("INSERT INTO user_manual_sections (category) VALUES (?)");
                $stmt->bind_param("s", $category);
                $stmt->execute();
                echo json_encode(["status" => "success", "id" => $conn->insert_id]);
            }
        } elseif ($action === 'subsection') {
            $sectionId = (int) ($input['sectionId'] ?? 0);
            $title = $input['title'] ?? '';
            $content = $input['content'] ?? '';
            if (!$sectionId || $title === '') {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "sectionId and title are required"]);
                exit();
            }
            if (isset($input['id']) && $input['id']) {
                $id = (int) $input['id'];
                $stmt = $conn->prepare("UPDATE user_manual_subsections SET title = ?, content = ? WHERE id = ?");
                $stmt->bind_param("ssi", $title, $content, $id);
                $stmt->execute();
                echo json_encode(["status" => "success", "id" => $id]);
            } else {
                $stmt = $conn->prepare("INSERT INTO user_manual_subsections (section_id, title, content) VALUES (?, ?, ?)");
                $stmt->bind_param("iss", $sectionId, $title, $content);
                $stmt->execute();
                echo json_encode(["status" => "success", "id" => $conn->insert_id]);
            }
        } elseif ($action === 'attachment') {
            $subsectionId = (int) ($input['subsectionId'] ?? 0);
            $fileName = $input['fileName'] ?? '';
            $fileUrl = $input['fileUrl'] ?? '';
            if (!$subsectionId || $fileName === '' || $fileUrl === '') {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "subsectionId, fileName and fileUrl are required"]);
                exit();
            }
            $stmt = $conn->prepare("INSERT INTO user_manual_attachments (subsection_id, file_name, file_url) VALUES (?, ?, ?)");
            $stmt->bind_param("iss", $subsectionId, $fileName, $fileUrl);
            $stmt->execute();
            echo json_encode(["status" => "success", "id" => $conn->insert_id]);
        } else {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Unknown action"]);
        }
    } elseif ($method === 'DELETE') {
        $type = $_GET['type'] ?? '';
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id || !in_array($type, ['section', 'subsection', 'attachment'], true)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "type and id are required"]);
            exit();
        }
        $table = [
            'section' => 'user_manual_sections',
            'subsection' => 'user_manual_subsections',
            'attachment' => 'user_manual_attachments',
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
