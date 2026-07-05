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
        $res = $conn->query("SELECT * FROM `user_manual_videos` ORDER BY created_at DESC");
        $data = [];
        if ($res) {
            while ($row = $res->fetch_assoc()) {
                $data[] = [
                    "id" => (int) $row['id'],
                    "title" => $row['title'],
                    "description" => $row['description'],
                    "videoUrl" => $row['video_url'],
                    "thumbnail" => $row['thumbnail'],
                ];
            }
        }
        echo json_encode(["status" => "success", "data" => $data]);
    } elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);

        $title = $input['title'] ?? '';
        $description = $input['description'] ?? '';
        $videoUrl = $input['videoUrl'] ?? '';
        $thumbnail = $input['thumbnail'] ?? '/placeholder.svg';

        if ($title === '' || $videoUrl === '') {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "title and videoUrl are required"]);
            exit();
        }

        if (isset($input['id']) && $input['id']) {
            $id = (int) $input['id'];
            $stmt = $conn->prepare("UPDATE user_manual_videos SET title = ?, description = ?, video_url = ?, thumbnail = ? WHERE id = ?");
            $stmt->bind_param("ssssi", $title, $description, $videoUrl, $thumbnail, $id);
            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "id" => $id]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
        } else {
            $stmt = $conn->prepare("INSERT INTO user_manual_videos (title, description, video_url, thumbnail) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", $title, $description, $videoUrl, $thumbnail);
            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "id" => $conn->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
        }
    } elseif ($method === 'DELETE') {
        $id = (int) ($_GET['id'] ?? 0);
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "id is required"]);
            exit();
        }
        $stmt = $conn->prepare("DELETE FROM user_manual_videos WHERE id = ?");
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
