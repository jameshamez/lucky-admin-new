<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../condb.php';
/** @var mysqli $conn */

// Database Selection
$db_options = ['finfinph_lcukycompany', 'finfinph_luckycompany'];
foreach ($db_options as $db) {
    if (@$conn->select_db($db))
        break;
}
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ==================== GET ====================
if ($method === 'GET') {
    switch ($action) {
        case 'channels':
            $sql = "SELECT * FROM communication_channels ORDER BY id ASC";
            $result = $conn->query($sql);
            $channels = [];
            while ($row = $result->fetch_assoc()) {
                // Mock member count for now as we don't have a members table yet
                $row['members'] = rand(2, 15);
                $channels[] = $row;
            }
            echo json_encode(["status" => "success", "data" => $channels]);
            break;

        case 'messages':
            $channel_id = intval($_GET['channel_id'] ?? 0);
            if (!$channel_id) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "channel_id is required"]);
                exit();
            }
            $sql = "SELECT * FROM communication_messages WHERE channel_id = ? ORDER BY created_at ASC LIMIT 100";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $channel_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $messages = [];
            while ($row = $result->fetch_assoc()) {
                // Formatting time for frontend
                $row['time'] = date('H:i', strtotime($row['created_at']));
                $messages[] = $row;
            }
            echo json_encode(["status" => "success", "data" => $messages]);
            break;

        case 'announcements':
            $sql = "SELECT * FROM communication_announcements ORDER BY is_pinned DESC, created_at DESC";
            $result = $conn->query($sql);
            $announcements = [];
            while ($row = $result->fetch_assoc()) {
                $row['date'] = date('Y-m-d', strtotime($row['created_at']));
                $announcements[] = $row;
            }
            echo json_encode(["status" => "success", "data" => $announcements]);
            break;

        case 'notifications':
            $sql = "SELECT * FROM user_notifications ORDER BY created_at DESC LIMIT 50";
            $result = $conn->query($sql);
            $notifications = [];
            while ($row = $result->fetch_assoc()) {
                // Simple relative time
                $diff = time() - strtotime($row['created_at']);
                if ($diff < 60)
                    $row['time'] = "เมื่อครู่";
                elseif ($diff < 3600)
                    $row['time'] = floor($diff / 60) . " นาทีที่แล้ว";
                elseif ($diff < 86400)
                    $row['time'] = floor($diff / 3600) . " ชั่วโมงที่แล้ว";
                else
                    $row['time'] = floor($diff / 86400) . " วันที่แล้ว";

                $notifications[] = $row;
            }
            echo json_encode(["status" => "success", "data" => $notifications]);
            break;

        case 'files':
            $sql = "SELECT * FROM communication_files ORDER BY upload_date DESC";
            $result = $conn->query($sql);
            $files = [];
            while ($row = $result->fetch_assoc()) {
                $row['uploadDate'] = date('Y-m-d', strtotime($row['upload_date']));
                $files[] = $row;
            }
            echo json_encode(["status" => "success", "data" => $files]);
            break;

        default:
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Invalid action"]);
            break;
    }
    exit();
}

// ==================== POST ====================
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    switch ($action) {
        case 'send_message':
            if (empty($data['channel_id']) || empty($data['message'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "channel_id and message are required"]);
                exit();
            }
            $channel_id = intval($data['channel_id']);
            $user_id = intval($data['user_id'] ?? 0);
            $user_name = trim($data['user_name'] ?? 'Anonymous');
            $avatar = trim($data['avatar_fallback'] ?? '??');
            $message = trim($data['message']);

            $stmt = $conn->prepare("INSERT INTO communication_messages (channel_id, user_id, user_name, avatar_fallback, message) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("iisss", $channel_id, $user_id, $user_name, $avatar, $message);

            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Message sent", "id" => $conn->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
            break;

        case 'add_announcement':
            if (empty($data['title']) || empty($data['content'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "title and content are required"]);
                exit();
            }
            $title = trim($data['title']);
            $content = trim($data['content']);
            $author_name = trim($data['author_name'] ?? 'Admin');
            $is_pinned = !empty($data['is_pinned']) ? 1 : 0;

            $stmt = $conn->prepare("INSERT INTO communication_announcements (title, content, author_name, is_pinned) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("sssi", $title, $content, $author_name, $is_pinned);

            if ($stmt->execute()) {
                echo json_encode(["status" => "success", "message" => "Announcement added"]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["status" => "error", "message" => "Action not supported via POST"]);
            break;
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
$conn->close();
?>