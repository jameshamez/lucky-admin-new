<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed."]);
    exit();
}

// Supported upload categories and their directories
$category = $_POST['category'] ?? 'general';
$category_dirs = [
    'slip'           => 'uploads/orders/slips/',
    'design'         => 'uploads/orders/designs/',
    'quotation'      => 'uploads/orders/quotations/',
    'general'        => 'uploads/orders/general/',
];

$sub_dir = $category_dirs[$category] ?? $category_dirs['general'];
$upload_dir = '../' . $sub_dir;

// Create upload directory if it doesn't exist
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

// Max file size: 20MB for design files, 5MB for others
$max_size = ($category === 'design') ? 20 * 1024 * 1024 : 5 * 1024 * 1024;

// Allowed MIME types by category
$allowed_mimes = [
    'slip' => [
        'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
        'application/pdf'
    ],
    'design' => [
        'image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/svg+xml',
        'application/pdf',
        'application/postscript',           // .ai, .eps
        'application/illustrator',          // .ai
        'image/vnd.adobe.photoshop',        // .psd (some systems)
        'application/x-photoshop',          // .psd
        'application/octet-stream',         // fallback for .ai, .psd, .cdr
    ],
    'quotation' => [
        'image/jpeg', 'image/png', 'image/jpg',
        'application/pdf'
    ],
    'general' => [
        'image/jpeg', 'image/png', 'image/jpg', 'image/webp',
        'application/pdf'
    ],
];

$category_allowed = $allowed_mimes[$category] ?? $allowed_mimes['general'];

// Extension map (for safe renaming)
$ext_map = [
    'image/jpeg'                    => 'jpg',
    'image/jpg'                     => 'jpg',
    'image/png'                     => 'png',
    'image/webp'                    => 'webp',
    'image/svg+xml'                 => 'svg',
    'application/pdf'               => 'pdf',
    'application/postscript'        => 'ai',
    'application/illustrator'       => 'ai',
    'image/vnd.adobe.photoshop'     => 'psd',
    'application/x-photoshop'       => 'psd',
];

// Handle single file upload (field name: "file")
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $error_message = isset($_FILES['file']['error'])
        ? "Upload error code: " . $_FILES['file']['error']
        : "No file uploaded. Field name must be 'file'.";
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $error_message]);
    exit();
}

$file = $_FILES['file'];
$file_tmp  = $file['tmp_name'];
$file_name = $file['name'];
$file_size = $file['size'];

// Validate size
if ($file_size > $max_size) {
    http_response_code(400);
    $max_mb = $max_size / (1024 * 1024);
    echo json_encode(["status" => "error", "message" => "File size exceeds {$max_mb}MB limit."]);
    exit();
}

// Detect MIME
$file_mime = mime_content_type($file_tmp);

// For binary design files (AI, PSD, CDR) that resolve as octet-stream,
// fallback to checking the original file extension
$fallback_ext = null;
if ($file_mime === 'application/octet-stream' && $category === 'design') {
    $orig_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
    $design_exts = ['ai', 'psd', 'cdr', 'eps', 'svg'];
    if (in_array($orig_ext, $design_exts)) {
        $fallback_ext = $orig_ext;
    } else {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid file type for design category."]);
        exit();
    }
} elseif (!in_array($file_mime, $category_allowed)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid file type: {$file_mime}"]);
    exit();
}

// Determine extension
$file_ext = $fallback_ext ?? ($ext_map[$file_mime] ?? strtolower(pathinfo($file_name, PATHINFO_EXTENSION)));

// Generate unique filename
$new_name = uniqid($category . '_') . '_' . time() . '.' . $file_ext;
$dest_path = $upload_dir . $new_name;

if (!move_uploaded_file($file_tmp, $dest_path)) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to save uploaded file."]);
    exit();
}

// Return the relative path (from api-lucky/admin/ root)
$relative_path = $sub_dir . $new_name;

echo json_encode([
    "status"  => "success",
    "message" => "File uploaded successfully.",
    "data"    => [
        "fileName" => $file_name,
        "filePath" => $relative_path,
        "fileUrl"  => "https://nacres.co.th/api-lucky/admin/" . $relative_path,
        "fileSize" => $file_size,
        "mimeType" => $file_mime,
    ]
]);
?>
