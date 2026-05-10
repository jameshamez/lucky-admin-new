<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit();
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed."]);
    exit();
}

$category = $_POST["category"] ?? "general";
$categoryDirs = [
    "slip" => "uploads/orders/slips/",
    "design" => "uploads/orders/designs/",
    "quotation" => "uploads/orders/quotations/",
    "general" => "uploads/orders/general/",
];

$allowedExtensions = [
    "slip" => ["jpg", "jpeg", "png", "webp", "pdf"],
    "design" => ["jpg", "jpeg", "png", "webp", "svg", "pdf", "ai", "psd", "eps", "cdr"],
    "quotation" => ["jpg", "jpeg", "png", "pdf"],
    "general" => ["jpg", "jpeg", "png", "webp", "pdf"],
];

$subDir = $categoryDirs[$category] ?? $categoryDirs["general"];
$targetDir = __DIR__ . "/" . $subDir;

if (!is_dir($targetDir) && !mkdir($targetDir, 0775, true) && !is_dir($targetDir)) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to create upload directory."]);
    exit();
}

if (!isset($_FILES["file"]) || $_FILES["file"]["error"] !== UPLOAD_ERR_OK) {
    $message = isset($_FILES["file"]["error"])
        ? "Upload error code: " . $_FILES["file"]["error"]
        : "No file uploaded. Field name must be 'file'.";
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => $message]);
    exit();
}

$file = $_FILES["file"];
$maxSize = $category === "design" ? 20 * 1024 * 1024 : 5 * 1024 * 1024;

if ($file["size"] > $maxSize) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "File size exceeds limit."]);
    exit();
}

$extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
$categoryAllowed = $allowedExtensions[$category] ?? $allowedExtensions["general"];

if (!in_array($extension, $categoryAllowed, true)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "File type not allowed."]);
    exit();
}

try {
    $random = bin2hex(random_bytes(6));
} catch (Exception $e) {
    $random = (string)mt_rand(100000, 999999);
}

$newName = $category . "_" . date("Ymd_His") . "_" . $random . "." . $extension;
$targetPath = $targetDir . $newName;

if (!is_uploaded_file($file["tmp_name"]) || !move_uploaded_file($file["tmp_name"], $targetPath)) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Failed to save uploaded file."]);
    exit();
}

$scheme = (!empty($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] !== "off") ? "https" : "http";
$host = $_SERVER["HTTP_HOST"] ?? "localhost";
$scriptDir = rtrim(str_replace("\\", "/", dirname($_SERVER["SCRIPT_NAME"] ?? "")), "/");
$baseUrl = $scheme . "://" . $host . $scriptDir;
$fileUrl = $baseUrl . "/" . $subDir . $newName;

echo json_encode([
    "status" => "success",
    "message" => "File uploaded successfully.",
    "data" => [
        "fileName" => $file["name"],
        "filePath" => $subDir . $newName,
        "fileUrl" => $fileUrl,
        "fileSize" => (int)$file["size"],
        "mimeType" => $file["type"] ?? "application/octet-stream",
    ],
]);
?>
