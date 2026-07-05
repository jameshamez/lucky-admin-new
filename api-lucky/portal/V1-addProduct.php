<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include database connection
require '../condb.php';

// ฟังก์ชันสำหรับบันทึกรูปภาพจาก base64 หรือไฟล์ที่อัปโหลด
// รองรับทั้ง base64 string และ uploaded file
function saveImage($imageSource, $outputPath)
{
    // ตรวจสอบว่าเป็น base64 string หรือไม่
    if (is_string($imageSource) && strpos($imageSource, 'data:image') !== false) {
        // แยกส่วน metadata และ base64 data
        $parts = explode(',', $imageSource);
        if (count($parts) === 2) {
            // ถอดรหัส base64
            $imageData = base64_decode($parts[1]);

            // บันทึกไฟล์
            if (file_put_contents($outputPath, $imageData)) {
                return basename($outputPath);
            }
        }
    }
    return false;
}

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Remove the 'Connected successfully' message from condb.php
    ob_clean();

    // รับข้อมูลจาก request body (JSON)
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    // ถ้าไม่มีข้อมูล JSON ให้ลองรับจาก form data (POST)
    if ($json_data === false || $data === null) {
        // รับค่าจาก form data (POST)
        $subcategory_id = isset($_POST['subcategory_id']) ? $_POST['subcategory_id'] : null;
        $model = isset($_POST['model']) ? $_POST['model'] : '';
        $name = isset($_POST['name']) ? $_POST['name'] : '';
        $price = isset($_POST['price']) ? $_POST['price'] : 0;
        $inventory = isset($_POST['inventory']) ? $_POST['inventory'] : 0;
        $request = isset($_POST['request']) ? $_POST['request'] : 0;

        // รับค่า total_available หรือ total_availble (รองรับทั้งสองกรณี)
        $total_available = isset($_POST['total_available']) ? $_POST['total_available'] :
            (isset($_POST['total_availble']) ? $_POST['total_availble'] : 0);

        $color = isset($_POST['color']) ? $_POST['color'] : null;
        $size = isset($_POST['size']) ? $_POST['size'] : null;
        $width = isset($_POST['width']) ? $_POST['width'] : null;
        $height = isset($_POST['height']) ? $_POST['height'] : null;
        $weight = isset($_POST['weight']) ? $_POST['weight'] : null;
        $body = isset($_POST['body']) ? $_POST['body'] : null;

        // รับข้อมูลรูปภาพหลัก (รองรับทั้ง base64 และไฟล์ที่อัปโหลด)
        $main_image = null;
        $main_image_filename = null;

        if (isset($_POST['image']) && !empty($_POST['image'])) {
            $main_image = $_POST['image'];
        } elseif (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
            $main_image = $_FILES['image'];
        }
    } else {
        // รับค่าจาก JSON
        $subcategory_id = isset($data['subcategory_id']) ? $data['subcategory_id'] :
            (isset($data['subcategoryId']) ? $data['subcategoryId'] : null);
        $model = isset($data['model']) ? $data['model'] :
            (isset($data['modelName']) ? $data['modelName'] : '');
        $name = isset($data['name']) ? $data['name'] : '';
        $price = isset($data['price']) ? $data['price'] : 0;
        $inventory = isset($data['inventory']) ? $data['inventory'] : 0;
        $request = isset($data['request']) ? $data['request'] : 0;

        // รับค่า total_available หรือ total_availble (รองรับทั้งสองกรณี)
        $total_available = isset($data['total_available']) ? $data['total_available'] :
            (isset($data['total_availble']) ? $data['total_availble'] : 0);

        $color = isset($data['color']) ? $data['color'] : null;
        $size = isset($data['size']) ? $data['size'] : null;
        $width = isset($data['width']) ? $data['width'] : null;
        $height = isset($data['height']) ? $data['height'] : null;
        $weight = isset($data['weight']) ? $data['weight'] : null;
        $body = isset($data['body']) ? $data['body'] :
            (isset($data['description']) ? $data['description'] : null);

        // รับข้อมูลรูปภาพหลัก
        $main_image = isset($data['image']) ? $data['image'] : null;
        $main_image_filename = null;
    }

    // รับข้อมูลรูปภาพเพิ่มเติม
    $additional_images = [];
    $additional_image_filenames = [];

    // รับข้อมูลรูปภาพเพิ่มเติมจาก JSON
    if (isset($data) && isset($data['images']) && is_array($data['images'])) {
        $additional_images = $data['images'];
    }

    // Validate required fields
    if (empty($name)) {
        $response = [
            'status' => 'error',
            'message' => 'Product name is required'
        ];
        echo json_encode($response);
        exit();
    }

    // Select the database
    $conn->select_db('nacresc1_1'); // Make sure to replace 'lucky_db' with your actual database name

    // เตรียมข้อมูลรูปภาพสำหรับบันทึกหลังจากบันทึกข้อมูลสินค้า
    $images_to_save = [];
    $sequence = 0;

    // เตรียมข้อมูลรูปภาพหลัก (ถ้ามี)
    // หมายเหตุ: เราจะสร้างโฟลเดอร์หลังจากได้ product_id แล้ว
    // จึงเก็บข้อมูลรูปภาพไว้ก่อน
    $temp_image_files = [];

    if ($main_image) {
        $temp_main_image = null;

        // ตรวจสอบว่าเป็น base64 string หรือไฟล์ที่อัปโหลด
        if (is_string($main_image) && strpos($main_image, 'data:image') !== false) {
            // กรณีเป็น base64 string
            $temp_main_image = $main_image;
        } elseif (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
            // กรณีเป็นไฟล์ที่อัปโหลด
            $temp_main_image = file_get_contents($_FILES['image']['tmp_name']);
        }

        if ($temp_main_image) {
            $temp_image_files[] = [
                'data' => $temp_main_image,
                'is_base64' => is_string($main_image) && strpos($main_image, 'data:image') !== false,
                'filename' => 'main.jpg',
                'sequence' => $sequence++,
                'is_main' => 1,
                'is_portal' => 1
            ];
        }
    }

    // เตรียมข้อมูลรูปภาพเพิ่มเติม (ถ้ามี)

    // ตรวจสอบรูปภาพเพิ่มเติมจาก JSON
    if (isset($data) && isset($data['images']) && is_array($data['images'])) {
        foreach ($data['images'] as $index => $image_url) {
            if (!empty($image_url) && (strpos($image_url, 'data:image') !== false || strpos($image_url, 'http') === 0)) {
                $temp_image_files[] = [
                    'data' => $image_url,
                    'is_base64' => strpos($image_url, 'data:image') !== false,
                    'filename' => "image_{$index}.jpg",
                    'sequence' => $sequence++,
                    'is_main' => 0,
                    'is_portal' => isset($data['is_portal_' . $index]) ? $data['is_portal_' . $index] : 1
                ];
            }
        }
    } else {
        // ตรวจสอบรูปภาพเพิ่มเติมจาก POST data
        foreach ($_POST as $key => $value) {
            if (strpos($key, 'additional_image_') === 0 && !empty($value) && strpos($value, 'data:image') !== false) {
                $index = str_replace('additional_image_', '', $key);
                $temp_image_files[] = [
                    'data' => $value,
                    'is_base64' => true,
                    'filename' => "image_{$index}.jpg",
                    'sequence' => $sequence++,
                    'is_main' => 0,
                    'is_portal' => isset($_POST['is_portal_' . $index]) && $_POST['is_portal_' . $index] ? 1 : 0
                ];
            }
        }

        // ตรวจสอบรูปภาพเพิ่มเติมจาก FILES
        foreach ($_FILES as $key => $file) {
            if (strpos($key, 'additional_image_') === 0 && $file['error'] == 0) {
                $index = str_replace('additional_image_', '', $key);
                $temp_image_files[] = [
                    'data' => file_get_contents($file['tmp_name']),
                    'is_base64' => false,
                    'filename' => "image_{$index}.jpg",
                    'sequence' => $sequence++,
                    'is_main' => 0,
                    'is_portal' => isset($_POST['is_portal_' . $index]) && $_POST['is_portal_' . $index] ? 1 : 0
                ];
            }
        }
    }

    // Prepare and execute the SQL query สำหรับบันทึกข้อมูลสินค้า
    $stmt = $conn->prepare("INSERT INTO product (subcategory_id, model, name, price, inventory, request, total_available, color, size, width, height, weight, body) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issiiisssssss", $subcategory_id, $model, $name, $price, $inventory, $request, $total_available, $color, $size, $width, $height, $weight, $body);

    if ($stmt->execute()) {
        $product_id = $conn->insert_id;

        // สร้างโฟลเดอร์สำหรับเก็บรูปภาพของสินค้า
        $product_folder = "../uploads/products/{$product_id}";
        if (!file_exists($product_folder)) {
            mkdir($product_folder, 0777, true);
        }

        // บันทึกข้อมูลรูปภาพลงในตาราง product_image
        $image_data = [];

        if (!empty($temp_image_files)) {
            $image_stmt = $conn->prepare("INSERT INTO product_image (product_id, image_src, sequence, is_main, is_portal) VALUES (?, ?, ?, ?, ?)");

            foreach ($temp_image_files as $image) {
                // บันทึกไฟล์รูปภาพลงในโฟลเดอร์ของสินค้า
                $image_path = "{$product_folder}/{$image['filename']}";

                if ($image['is_base64']) {
                    // กรณีเป็น base64 string
                    $parts = explode(',', $image['data']);
                    if (count($parts) === 2) {
                        $imageData = base64_decode($parts[1]);
                        file_put_contents($image_path, $imageData);
                    }
                } else {
                    // กรณีเป็นไฟล์ที่อัปโหลด
                    file_put_contents($image_path, $image['data']);
                }

                // บันทึกข้อมูลลงในฐานข้อมูล
                $image_filename = basename($image_path);
                $image_stmt->bind_param("isiii", $product_id, $image_filename, $image['sequence'], $image['is_main'], $image['is_portal']);

                if ($image_stmt->execute()) {
                    $image_data[] = [
                        'id' => $conn->insert_id,
                        'product_id' => $product_id,
                        'image_src' => $image_filename,
                        'sequence' => $image['sequence'],
                        'is_main' => $image['is_main'],
                        'is_portal' => $image['is_portal']
                    ];
                }
            }

            $image_stmt->close();
        }

        $response = [
            'status' => 'success',
            'message' => 'Product added successfully',
            'product_id' => $product_id,
            'data' => [
                'subcategory_id' => $subcategory_id,
                'model' => $model,
                'name' => $name,
                'price' => $price,
                'inventory' => $inventory,
                'request' => $request,
                'total_available' => $total_available,
                'color' => $color,
                'size' => $size,
                'width' => $width,
                'height' => $height,
                'weight' => $weight,
                'body' => $body,
                'images' => $image_data
            ]
        ];
    } else {
        $response = [
            'status' => 'error',
            'message' => 'Failed to add product: ' . $stmt->error
        ];
    }

    $stmt->close();
} else {
    $response = [
        'status' => 'error',
        'message' => 'Only POST method is allowed'
    ];
}

$conn->close();
echo json_encode($response);
