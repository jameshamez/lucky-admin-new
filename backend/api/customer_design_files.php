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

require '../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];
$customer_id = isset($_GET['customer_id']) ? intval($_GET['customer_id']) : null;
$id = isset($_GET['id']) ? intval($_GET['id']) : null;

switch ($method) {
    case 'GET':
        if (!$customer_id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "customer_id is required"]);
            exit();
        }
        $sql = "SELECT * FROM customer_design_files WHERE customer_id = ? ORDER BY created_at DESC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $customer_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $files = [];
        while ($row = $result->fetch_assoc()) {
            $files[] = $row;
        }
        echo json_encode(["status" => "success", "data" => $files]);
        break;

    case 'POST':
        // === Handle file upload (multipart/form-data) ===
        if (!empty($_FILES['file'])) {
            $cid = isset($_POST['customer_id']) ? intval($_POST['customer_id']) : 0;
            $name = isset($_POST['name']) ? trim($_POST['name']) : '';
            $version = isset($_POST['version']) ? trim($_POST['version']) : 'V1';
            $department = isset($_POST['department']) ? trim($_POST['department']) : 'sales';
            $uploaded_by = isset($_POST['uploaded_by']) ? trim($_POST['uploaded_by']) : 'ผู้ใช้งาน';

            if (!$cid || !$name) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "customer_id and name are required"]);
                exit();
            }

            $file = $_FILES['file'];

            // ตรวจสอบ upload error ก่อนเลย
            if ($file['error'] !== UPLOAD_ERR_OK) {
                $upload_errors = [
                    UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize in php.ini',
                    UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE in form',
                    UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
                    UPLOAD_ERR_NO_FILE => 'No file was uploaded',
                    UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
                    UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
                    UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the upload',
                ];
                $error_msg = isset($upload_errors[$file['error']]) ? $upload_errors[$file['error']] : 'Unknown upload error: ' . $file['error'];
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => $error_msg]);
                exit();
            }

            // ตรวจสอบ MIME type จากไฟล์จริง (ไม่เชื่อ $_FILES['type'] ที่ browser ส่งมา)
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $real_mime = $finfo->file($file['tmp_name']);
            $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

            if (!in_array($real_mime, $allowed_types)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "File type not allowed. Detected: " . $real_mime . ". Use JPG, PNG, GIF, WebP, or PDF"]);
                exit();
            }

            if ($file['size'] > 10 * 1024 * 1024) { // 10MB limit
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "File size exceeds 10MB"]);
                exit();
            }

            // สร้าง upload directory และตรวจสอบสิทธิ์
            $upload_dir = dirname(__DIR__) . '/uploads/designs/';
            if (!is_dir($upload_dir)) {
                if (!mkdir($upload_dir, 0755, true)) {
                    http_response_code(500);
                    echo json_encode(["status" => "error", "message" => "Failed to create upload directory: " . $upload_dir]);
                    exit();
                }
            }

            // ตรวจสอบว่า directory เขียนได้
            if (!is_writable($upload_dir)) {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "Upload directory is not writable: " . $upload_dir]);
                exit();
            }

            // กำหนด extension จาก MIME type จริง (ปลอดภัยกว่า pathinfo จากชื่อไฟล์)
            $mime_to_ext = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/gif' => 'gif',
                'image/webp' => 'webp',
                'application/pdf' => 'pdf',
            ];
            $ext = $mime_to_ext[$real_mime] ?? pathinfo($file['name'], PATHINFO_EXTENSION);

            $filename = 'design_' . $cid . '_' . time() . '_' . uniqid() . '.' . $ext;
            $target_path = $upload_dir . $filename;

            if (!move_uploaded_file($file['tmp_name'], $target_path)) {
                http_response_code(500);
                echo json_encode([
                    "status" => "error",
                    "message" => "Failed to move uploaded file",
                    "debug" => [
                        "tmp_name" => $file['tmp_name'],
                        "target" => $target_path,
                        "tmp_exists" => file_exists($file['tmp_name']),
                        "dir_write" => is_writable($upload_dir),
                    ]
                ]);
                exit();
            }

            // สร้าง public URL อย่างปลอดภัย
            $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'];
            $api_path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

            // หา base path ก่อน /api/ (เช่น /bravo/backend/api/ → base = /bravo)
            $api_pos = strpos($api_path, '/api/');
            if ($api_pos !== false) {
                $base_path = substr($api_path, 0, $api_pos);
            } else {
                // ถ้าหาไม่เจอ ให้ขึ้น 2 ระดับจาก api folder
                $base_path = rtrim(dirname(dirname($api_path)), '/');
            }

            $file_url = $scheme . '://' . $host . $base_path . '/uploads/designs/' . $filename;

            $sql = "INSERT INTO customer_design_files (customer_id, name, version, file_url, department, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("isssss", $cid, $name, $version, $file_url, $department, $uploaded_by);
            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode([
                    "status" => "success",
                    "message" => "File uploaded successfully",
                    "id" => $conn->insert_id,
                    "file_url" => $file_url,
                ]);
            } else {
                // ถ้า DB fail ให้ลบไฟล์ที่อัพโหลดแล้วออกด้วย
                @unlink($target_path);
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }

        } else {
            // === Handle JSON body (no file, save URL only) ===
            $data = json_decode(file_get_contents("php://input"), true);
            if (empty($data['customer_id']) || empty($data['name'])) {
                http_response_code(400);
                echo json_encode(["status" => "error", "message" => "customer_id and name are required"]);
                exit();
            }
            $cid = (int) $data['customer_id'];
            $name = $data['name'];
            $version = isset($data['version']) ? $data['version'] : 'V1';
            $file_url = isset($data['file_url']) ? $data['file_url'] : null;
            $department = isset($data['department']) ? $data['department'] : 'sales';
            $uploaded_by = isset($data['uploaded_by']) ? $data['uploaded_by'] : 'ผู้ใช้งาน';

            $sql = "INSERT INTO customer_design_files (customer_id, name, version, file_url, department, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("isssss", $cid, $name, $version, $file_url, $department, $uploaded_by);
            if ($stmt->execute()) {
                http_response_code(201);
                echo json_encode(["status" => "success", "message" => "Design file saved", "id" => $conn->insert_id]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => $stmt->error]);
            }
        }
        break;

    case 'DELETE':
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "id is required"]);
            exit();
        }

        // Get file_url to delete the physical file if it exists
        $get_sql = "SELECT file_url FROM customer_design_files WHERE id = ?";
        $get_stmt = $conn->prepare($get_sql);
        $get_stmt->bind_param("i", $id);
        $get_stmt->execute();
        $get_result = $get_stmt->get_result();
        if ($row = $get_result->fetch_assoc()) {
            if (!empty($row['file_url'])) {
                $upload_dir = dirname(__DIR__) . '/uploads/designs/';
                $filename = basename($row['file_url']);
                $file_path = $upload_dir . $filename;
                if (file_exists($file_path)) {
                    @unlink($file_path);
                }
            }
        }

        $sql = "DELETE FROM customer_design_files WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $id);
        if ($stmt->execute()) {
            echo json_encode(["status" => "success", "message" => "File deleted"]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
$conn->close();
?>