<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$response = array();
$upload_dir = '../uploads/price_estimation/';

// Create upload directory if it doesn't exist
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $file_tmp_path = $_FILES['file']['tmp_name'];
        $file_name = $_FILES['file']['name'];
        $file_size = $_FILES['file']['size'];
        $file_type = $_FILES['file']['type'];

        // Validate file size (Max 5MB)
        if ($file_size > 5 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(array("status" => "error", "message" => "File size exceeds 5MB limit."));
            exit();
        }

        // Validate file type
        $file_mime = mime_content_type($file_tmp_path);
        $extension_map = array(
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/jpg' => 'jpg',
            'application/pdf' => 'pdf'
        );

        if (!array_key_exists($file_mime, $extension_map)) {
            http_response_code(400);
            echo json_encode(array("status" => "error", "message" => "Invalid file type. Only JPG, PNG, and PDF are allowed."));
            exit();
        }

        // Generate unique filename to prevent overwriting
        $file_extension = $extension_map[$file_mime];
        $new_file_name = uniqid() . '_' . time() . '.' . $file_extension;
        $dest_path = $upload_dir . $new_file_name;

        if (move_uploaded_file($file_tmp_path, $dest_path)) {
            // Return success response with file info
            // The path returned is relative to the admin directory or can be absolute URL depending on frontend need
            // Here returning relative path from admin root which might be useful for storing in DB
            $relative_path = 'uploads/price_estimation/' . $new_file_name;

            http_response_code(200);
            echo json_encode(array(
                "status" => "success",
                "message" => "File uploaded successfully.",
                "data" => array(
                    "fileName" => $file_name, // Original name for display
                    "filePath" => $relative_path, // Path for storage/access
                    "fileSize" => $file_size
                )
            ));
        } else {
            http_response_code(500);
            echo json_encode(array("status" => "error", "message" => "Error moving uploaded file."));
        }
    } else {
        http_response_code(400);
        $error_message = isset($_FILES['file']['error']) ? "Upload error code: " . $_FILES['file']['error'] : "No file uploaded.";
        echo json_encode(array("status" => "error", "message" => $error_message));
    }
} else {
    http_response_code(405);
    echo json_encode(array("status" => "error", "message" => "Method not allowed."));
}
?>
