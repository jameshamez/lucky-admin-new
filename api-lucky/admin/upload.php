<?php
// api-lucky/admin/upload.php
// Simple, secure-ish upload endpoint for form-data file uploads.
// Accepts: POST multipart/form-data with fields:
//   - file: the uploaded file
//   - folder: optional subfolder under /uploads (e.g. price-estimations)

header('Content-Type: application/json; charset=utf-8');

// CORS: allow your site (adjust as needed)
$allowed_origins = [
  'https://nacres.co.th',
  'http://nacres.co.th',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins, true)) {
  header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
  header('Vary: Origin');
} else {
  header('Access-Control-Allow-Origin: *'); // relax CORS if you must
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['status' => 'error', 'message' => 'Method Not Allowed']);
  exit;
}

// Base upload directory and public URL (adjust if your structure differs)
$uploadBaseDir = rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/uploads';
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$uploadBaseUrl = $scheme . '://' . $host . '/uploads';

// Normalize and sanitize subfolder
$folder = isset($_POST['folder']) ? $_POST['folder'] : 'misc';
$folder = trim($folder, "/ \t\n\r\0\x0B");
if (strpos($folder, '..') !== false) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'Invalid folder']);
  exit;
}
$folder = preg_replace('~[^a-zA-Z0-9/_-]~', '', $folder);
if ($folder === '') $folder = 'misc';

$targetDir = $uploadBaseDir . '/' . $folder;
if (!is_dir($targetDir)) {
  if (!mkdir($targetDir, 0775, true) && !is_dir($targetDir)) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Failed to create upload directory']);
    exit;
  }
}

if (!isset($_FILES['file'])) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'No file uploaded']);
  exit;
}

$file = $_FILES['file'];

// Standard PHP upload errors
if ($file['error'] !== UPLOAD_ERR_OK) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'Upload error code: ' . $file['error']]);
  exit;
}

// Limits
$maxSize = 20 * 1024 * 1024; // 20 MB
if ($file['size'] > $maxSize) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'File too large (max 20MB)']);
  exit;
}

// Allowed types
$allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'ai', 'psd', 'eps', 'svg'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $allowedExtensions, true)) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'File type not allowed']);
  exit;
}

// Random file name
function randomFileName($ext) {
  try {
    $rand = bin2hex(random_bytes(6));
  } catch (Exception $e) {
    $rand = (string)mt_rand(100000, 999999);
  }
  return date('Ymd_His') . '_' . $rand . '.' . $ext;
}

$newName = randomFileName($ext);
$targetPath = $targetDir . '/' . $newName;

if (!is_uploaded_file($file['tmp_name'])) {
  http_response_code(400);
  echo json_encode(['status' => 'error', 'message' => 'Invalid upload']);
  exit;
}

if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
  http_response_code(500);
  echo json_encode(['status' => 'error', 'message' => 'Failed to move uploaded file']);
  exit;
}

$fileUrl = $uploadBaseUrl . '/' . $folder . '/' . $newName;

// Success
echo json_encode([
  'status' => 'success',
  'url' => $fileUrl,
  'file' => [
    'name' => $newName,
    'size' => $file['size'],
    'type' => $file['type'] ?? (function($p){
      if (function_exists('mime_content_type')) {
        return mime_content_type($p) ?: 'application/octet-stream';
      }
      return 'application/octet-stream';
    })($targetPath),
  ],
]);
