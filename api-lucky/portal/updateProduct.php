<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, POST');
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

// Check if the request method is PUT or POST
if ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Remove the 'Connected successfully' message from condb.php
    ob_clean();

    // รับข้อมูลจาก request body (JSON)
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    // ถ้าไม่มีข้อมูล JSON ให้ลองรับจาก form data (POST)
    if ($json_data === false || $data === null) {
        // รับค่าจาก form data (POST)
        $product_id = isset($_POST['id']) ? $_POST['id'] : null;
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
        $tags = isset($_POST['tags']) ? $_POST['tags'] : null;
        $body = isset($_POST['body']) ? $_POST['body'] : null;

        // รับข้อมูลรูปภาพหลัก (รองรับทั้ง base64 และไฟล์ที่อัปโหลด)
        $main_image = null;

        if (isset($_POST['image']) && !empty($_POST['image'])) {
            $main_image = $_POST['image'];
        } elseif (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
            $main_image = $_FILES['image'];
        }

        // รับข้อมูล options จาก form data ถ้ามี
        $options = [];
        if (isset($_POST['options']) && is_string($_POST['options'])) {
            $decoded_options = json_decode($_POST['options'], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $options = $decoded_options;
            }
        }
        $colors = isset($_POST['colors']) ? $_POST['colors'] : null;
        $production_times = isset($_POST['production_times']) ? $_POST['production_times'] : null;
        $parts = isset($_POST['parts']) ? $_POST['parts'] : null;
        $sizes = isset($_POST['sizes']) ? $_POST['sizes'] : null;
        $prices = isset($_POST['prices']) ? $_POST['prices'] : null;
    } else {
        // รับค่าจาก JSON
        $product_id = isset($data['id']) ? $data['id'] : null;
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
        $tags = isset($data['tags']) ? $data['tags'] : null;
        $body = isset($data['body']) ? $data['body'] :
            (isset($data['description']) ? $data['description'] : null);

        // รับข้อมูลรูปภาพหลัก
        $main_image = isset($data['image']) ? $data['image'] : null;
        $colors = isset($data['colors']) && is_array($data['colors']) ? $data['colors'] : [];
        $production_times = isset($data['production_times']) ? $data['production_times'] : null;
        $sizes = isset($data['sizes']) ? $data['sizes'] : null;
        $parts = isset($data['parts']) ? $data['parts'] : null;
        $prices = isset($data['prices']) ? $data['prices'] : null;

        // รับข้อมูล options จาก JSON
        $options = isset($data['options']) && is_array($data['options']) ? $data['options'] : [];
    }

    // Validate required fields
    if (empty($product_id)) {
        $response = [
            'status' => 'error',
            'message' => 'Product ID is required'
        ];
        echo json_encode($response);
        exit();
    }

    if (empty($name)) {
        $response = [
            'status' => 'error',
            'message' => 'Product name is required'
        ];
        echo json_encode($response);
        exit();
    }

    // Select the database
    $conn->select_db('nacresc1_1');

    // เตรียมข้อมูลรูปภาพสำหรับบันทึกหลังจากอัปเดตข้อมูลสินค้า
    $temp_image_files = [];
    $sequence = 0;

    // ตรวจสอบว่าสินค้ามีอยู่จริงหรือไม่
    $check_stmt = $conn->prepare("SELECT * FROM product WHERE id = ?");
    $check_stmt->bind_param("i", $product_id);
    $check_stmt->execute();
    $result = $check_stmt->get_result();

    if ($result->num_rows === 0) {
        $response = [
            'status' => 'error',
            'message' => 'Product not found'
        ];
        echo json_encode($response);
        exit();
    }

    // เตรียมข้อมูลรูปภาพหลัก (ถ้ามี)
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
        // เก็บรายการรูปภาพที่จะยังคงไว้
        $keep_images = [];

        // ตรวจสอบรูปภาพที่มีอยู่แล้วที่จะยังคงไว้
        foreach ($data['images'] as $image_url) {
            if (!empty($image_url) && strpos($image_url, '/uploads/products/') === 0) {
                // แยกชื่อไฟล์จาก URL
                $image_parts = explode('/', $image_url);
                $image_filename = end($image_parts);
                $keep_images[] = $image_filename;
            }
        }

        // ลบรูปภาพเพิ่มเติมที่ไม่ได้อยู่ในรายการที่จะคงไว้
        if (!empty($keep_images)) {
            $placeholders = implode(',', array_fill(0, count($keep_images), '?'));
            $types = str_repeat('s', count($keep_images));

            // ค้นหารูปภาพที่ไม่ได้อยู่ในรายการที่จะคงไว้
            $find_images_stmt = $conn->prepare("SELECT id, image_src FROM product_image WHERE product_id = ? AND is_main = 0 AND image_src NOT IN ({$placeholders})");
            $params = array_merge([$product_id], $keep_images);
            $bind_params = array_merge(['i'], str_split($types));

            $find_images_stmt->bind_param(implode('', $bind_params), ...$params);
            $find_images_stmt->execute();
            $find_images_result = $find_images_stmt->get_result();

            // ลบไฟล์รูปภาพที่ไม่ได้อยู่ในรายการที่จะคงไว้
            $delete_ids = [];
            if ($find_images_result->num_rows > 0) {
                while ($old_image = $find_images_result->fetch_assoc()) {
                    $old_image_path = "{$product_folder}/{$old_image['image_src']}";
                    if (file_exists($old_image_path)) {
                        unlink($old_image_path); // ลบไฟล์รูปภาพเดิม
                    }
                    $delete_ids[] = $old_image['id'];
                }

                // ลบข้อมูลรูปภาพจากฐานข้อมูล
                if (!empty($delete_ids)) {
                    $id_placeholders = implode(',', array_fill(0, count($delete_ids), '?'));
                    $id_types = str_repeat('i', count($delete_ids));

                    $delete_images_stmt = $conn->prepare("DELETE FROM product_image WHERE id IN ({$id_placeholders})");
                    $delete_images_stmt->bind_param($id_types, ...$delete_ids);
                    $delete_images_stmt->execute();
                    $delete_images_stmt->close();
                }
            }
            $find_images_stmt->close();
        }

        // เพิ่มรูปภาพใหม่
        foreach ($data['images'] as $index => $image_url) {
            if (!empty($image_url) && (strpos($image_url, 'data:image') !== false || strpos($image_url, 'http') === 0)) {
                // ข้ามรูปภาพที่เป็น URL ที่ชี้ไปยังรูปภาพที่มีอยู่แล้ว
                if (strpos($image_url, '/uploads/products/') === 0) {
                    continue;
                }

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

    // Prepare and execute the SQL query สำหรับอัปเดตข้อมูลสินค้า
    $stmt = $conn->prepare("UPDATE product SET subcategory_id = ?, model = ?, name = ?, price = ?, inventory = ?, request = ?, total_available = ?, color = ?, size = ?, width = ?, height = ?, weight = ?, body = ?, tags = ? WHERE id = ?");
    $stmt->bind_param("issiiissssssssi", $subcategory_id, $model, $name, $price, $inventory, $request, $total_available, $color, $size, $width, $height, $weight, $body, $tags, $product_id);

    if ($stmt->execute()) {
        // ตรวจสอบว่ามีโฟลเดอร์สำหรับเก็บรูปภาพของสินค้าหรือไม่
        $product_folder = "../uploads/products/{$product_id}";
        if (!file_exists($product_folder)) {
            mkdir($product_folder, 0777, true);
        }

        // บันทึกข้อมูลรูปภาพใหม่ลงในตาราง product_image (ถ้ามี)
        $image_data = [];

        if (!empty($temp_image_files)) {
            // ถ้ามีรูปภาพหลักใหม่ ให้ลบรูปภาพหลักเดิมออกจากฐานข้อมูลและลบไฟล์
            $has_main_image = false;
            foreach ($temp_image_files as $image) {
                if ($image['is_main'] == 1) {
                    $has_main_image = true;
                    break;
                }
            }

            if ($has_main_image) {
                // ค้นหารูปภาพหลักเดิมและลบไฟล์
                $find_main_stmt = $conn->prepare("SELECT image_src FROM product_image WHERE product_id = ? AND is_main = 1");
                $find_main_stmt->bind_param("i", $product_id);
                $find_main_stmt->execute();
                $find_main_result = $find_main_stmt->get_result();

                if ($find_main_result->num_rows > 0) {
                    while ($old_image = $find_main_result->fetch_assoc()) {
                        $old_image_path = "{$product_folder}/{$old_image['image_src']}";
                        if (file_exists($old_image_path)) {
                            unlink($old_image_path); // ลบไฟล์รูปภาพเดิม
                        }
                    }
                }
                $find_main_stmt->close();

                // ลบข้อมูลรูปภาพหลักเดิมจากฐานข้อมูล
                $delete_main_stmt = $conn->prepare("DELETE FROM product_image WHERE product_id = ? AND is_main = 1");
                $delete_main_stmt->bind_param("i", $product_id);
                $delete_main_stmt->execute();
                $delete_main_stmt->close();
            }

            // บันทึกรูปภาพใหม่
            $image_stmt = $conn->prepare("INSERT INTO product_image (product_id, image_src, sequence, is_main, is_portal) VALUES (?, ?, ?, ?, ?)");

            // เก็บรายการ sequence ที่จะใช้ในรูปภาพใหม่
            $new_sequences = [];
            foreach ($temp_image_files as $image) {
                $new_sequences[] = $image['sequence'];
            }

            // ตรวจสอบและลบรูปภาพที่มี sequence ซ้ำกับรูปภาพใหม่
            if (!empty($new_sequences)) {
                $seq_placeholders = implode(',', array_fill(0, count($new_sequences), '?'));
                $seq_types = str_repeat('i', count($new_sequences));

                // ค้นหารูปภาพที่มี sequence ซ้ำกับรูปภาพใหม่
                $find_seq_stmt = $conn->prepare("SELECT id, image_src FROM product_image WHERE product_id = ? AND sequence IN ({$seq_placeholders}) AND is_main = 0");
                $seq_params = array_merge([$product_id], $new_sequences);
                $seq_bind_params = array_merge(['i'], str_split($seq_types));

                $find_seq_stmt->bind_param(implode('', $seq_bind_params), ...$seq_params);
                $find_seq_stmt->execute();
                $find_seq_result = $find_seq_stmt->get_result();

                // ลบไฟล์รูปภาพที่มี sequence ซ้ำกับรูปภาพใหม่
                $delete_seq_ids = [];
                if ($find_seq_result->num_rows > 0) {
                    while ($old_seq_image = $find_seq_result->fetch_assoc()) {
                        $old_seq_image_path = "{$product_folder}/{$old_seq_image['image_src']}";
                        if (file_exists($old_seq_image_path)) {
                            unlink($old_seq_image_path); // ลบไฟล์รูปภาพเดิม
                        }
                        $delete_seq_ids[] = $old_seq_image['id'];
                    }

                    // ลบข้อมูลรูปภาพจากฐานข้อมูล
                    if (!empty($delete_seq_ids)) {
                        $seq_id_placeholders = implode(',', array_fill(0, count($delete_seq_ids), '?'));
                        $seq_id_types = str_repeat('i', count($delete_seq_ids));

                        $delete_seq_stmt = $conn->prepare("DELETE FROM product_image WHERE id IN ({$seq_id_placeholders})");
                        $delete_seq_stmt->bind_param($seq_id_types, ...$delete_seq_ids);
                        $delete_seq_stmt->execute();
                        $delete_seq_stmt->close();
                    }
                }
                $find_seq_stmt->close();
            }

            // บันทึกรูปภาพใหม่
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

        // ดึงข้อมูลสินค้าที่อัปเดตแล้ว
        $select_stmt = $conn->prepare("SELECT * FROM product WHERE id = ?");
        $select_stmt->bind_param("i", $product_id);
        $select_stmt->execute();
        $updated_product = $select_stmt->get_result()->fetch_assoc();
        $select_stmt->close();

        // ดึงข้อมูลรูปภาพทั้งหมดของสินค้า
        $image_select_stmt = $conn->prepare("SELECT * FROM product_image WHERE product_id = ? ORDER BY sequence ASC");
        $image_select_stmt->bind_param("i", $product_id);
        $image_select_stmt->execute();
        $image_result = $image_select_stmt->get_result();
        $all_images = [];

        while ($image = $image_result->fetch_assoc()) {
            $all_images[] = [
                'id' => $image['id'],
                'product_id' => $image['product_id'],
                'image_src' => "/uploads/products/{$product_id}/{$image['image_src']}",
                'sequence' => $image['sequence'],
                'is_main' => $image['is_main'],
                'is_portal' => $image['is_portal']
            ];
        }

        $image_select_stmt->close();

        // Update product options if provided
        if (!empty($options)) {
            // First, delete all existing options for this product
            $delete_stmt = $conn->prepare("DELETE FROM product_options_select WHERE product_id = ?");
            $delete_stmt->bind_param("i", $product_id);
            $delete_stmt->execute();
            $delete_stmt->close();

            // Then insert the new options
            $insert_stmt = $conn->prepare("INSERT INTO product_options_select (product_id, option_id) VALUES (?, ?)");

            foreach ($options as $option) {
                if (isset($option['option_id'])) {
                    $option_id = $option['option_id'];
                    $insert_stmt->bind_param("ii", $product_id, $option_id);
                    $insert_stmt->execute();
                }
            }

            $insert_stmt->close();
        }

        // Update product colors if provided
        if (!empty($colors)) {
            // Create directory for color images if it doesn't exist
            $color_images_dir = '../uploads/products/' . $product_id . '/colors';
            if (!file_exists($color_images_dir)) {
                mkdir($color_images_dir, 0777, true);
            }

            // First, fetch existing colors to preserve their images
            $existing_colors = [];
            $existing_color_stmt = $conn->prepare("SELECT id, color, image_path FROM product_colors WHERE product_id = ?");
            $existing_color_stmt->bind_param("i", $product_id);
            $existing_color_stmt->execute();
            $color_result = $existing_color_stmt->get_result();

            while ($color_row = $color_result->fetch_assoc()) {
                $existing_colors[$color_row['color']] = $color_row['image_path'];

                // Check if the image file exists (debug purposes)
                if (!empty($color_row['image_path'])) {
                    $full_path = '../' . $color_row['image_path'];
                    if (!file_exists($full_path)) {
                        // Log for debugging
                        error_log("Color image not found: " . $full_path);
                    }
                }
            }
            $existing_color_stmt->close();

            // Now delete all existing colors for this product from DB
            $delete_stmt = $conn->prepare("DELETE FROM product_colors WHERE product_id = ?");
            $delete_stmt->bind_param("i", $product_id);
            $delete_stmt->execute();
            $delete_stmt->close();

            // Prepare for re-insertion of colors
            $colors_sql = "INSERT INTO product_colors (product_id, color, image_path) VALUES (?, ?, ?)";
            $colors_stmt = $conn->prepare($colors_sql);

            if ($colors_stmt) {
                // Check if colors is a JSON string
                if (is_string($colors)) {
                    $colors = json_decode($colors, true);
                }

                // Track which existing image files are reused
                $used_images = [];

                if (is_array($colors)) {
                    foreach ($colors as $color_data) {
                        $color = isset($color_data['color']) ? $color_data['color'] : '';
                        $image_input = isset($color_data['image_path']) ? $color_data['image_path'] : '';
                        $image_path = null;

                        // Case 1: This is an existing color with no new image input - reuse existing image
                        if (
                            !empty($color) && isset($existing_colors[$color]) && !empty($existing_colors[$color])
                            && empty($image_input)
                        ) {
                            // Reuse the existing image path for this color
                            $image_path = $existing_colors[$color];

                            // Verify the image file exists
                            $full_existing_path = '../' . $image_path;
                            if (file_exists($full_existing_path)) {
                                // File exists, so we can safely reuse the path
                                $used_images[] = $image_path;
                            } else {
                                // File doesn't exist - might have been deleted or moved
                                // Set image_path to null so it doesn't reference a missing file
                                $image_path = null;
                                error_log("Existing color image not found: " . $full_existing_path);
                            }
                        }
                        // Case 2: Handle new image if provided as base64
                        else if (!empty($image_input) && strpos($image_input, 'data:image') !== false) {
                            // This is a base64 image - generate unique filename and save it
                            $image_filename = uniqid('color_') . '_' . preg_replace('/[^a-z0-9]/i', '_', $color) . '.png';
                            $image_path = 'uploads/products/' . $product_id . '/colors/' . $image_filename;
                            $full_image_path = '../' . $image_path;

                            // Save the base64 image
                            saveImage($image_input, $full_image_path);
                            $used_images[] = $image_path;
                        }
                        // Case 3: Handle image path/URL that is not base64
                        else if (!empty($image_input)) {
                            // Use the provided path directly
                            $image_path = $image_input;
                            $used_images[] = $image_path;
                        }

                        if (!empty($color)) {
                            $colors_stmt->bind_param('iss', $product_id, $color, $image_path);
                            $colors_stmt->execute();
                        }
                    }
                }
                $colors_stmt->close();

                // Optional: You can add code here to clean up unused image files
                // This would remove old color images that are no longer associated with any color
                // But it's safer to keep them in case they're needed later
            }
        }

        // Handle product production times update
        if ($production_times) {
            // First delete all existing production times for this product
            $delete_times_stmt = $conn->prepare("DELETE FROM product_times WHERE product_id = ?");
            if ($delete_times_stmt) {
                $delete_times_stmt->bind_param("i", $product_id);
                $delete_times_stmt->execute();
                $delete_times_stmt->close();

                // Now insert new production times
                if (is_string($production_times)) {
                    $production_times = json_decode($production_times, true);
                }

                if (is_array($production_times) && !empty($production_times)) {
                    $current_timestamp = date('Y-m-d H:i:s');
                    $times_sql = "INSERT INTO product_times (product_id, duration, unit, created_at, updated_at) VALUES (?, ?, ?, ?, ?)";
                    $times_stmt = $conn->prepare($times_sql);

                    if ($times_stmt) {
                        foreach ($production_times as $time_data) {
                            $duration = isset($time_data['duration']) ? intval($time_data['duration']) : 0;
                            $unit = isset($time_data['unit']) ? $time_data['unit'] : 'days';

                            $times_stmt->bind_param(
                                'iisss',
                                $product_id,
                                $duration,
                                $unit,
                                $current_timestamp,
                                $current_timestamp
                            );

                            if (!$times_stmt->execute()) {
                                // Log error but continue with other product times
                                error_log("Failed to insert product time: " . $conn->error);
                            }
                        }
                        $times_stmt->close();
                    }
                }
            }
        }

        // Handle product sizes update
        if ($sizes) {
            // First delete all existing sizes for this product
            $delete_sizes_stmt = $conn->prepare("DELETE FROM product_size WHERE product_id = ?");
            if ($delete_sizes_stmt) {
                $delete_sizes_stmt->bind_param("i", $product_id);
                $delete_sizes_stmt->execute();
                $delete_sizes_stmt->close();

                // Now insert new sizes
                if (is_string($sizes)) {
                    $sizes = json_decode($sizes, true);
                }

                if (is_array($sizes) && !empty($sizes)) {
                    $sizes_sql = "INSERT INTO product_size (product_id, size, width, height, weight) VALUES (?, ?, ?, ?, ?)";
                    $sizes_stmt = $conn->prepare($sizes_sql);

                    if ($sizes_stmt) {
                        foreach ($sizes as $size_data) {
                            $size = isset($size_data['size']) ? $size_data['size'] : '';
                            $width = isset($size_data['width']) ? floatval($size_data['width']) : 0;
                            $height = isset($size_data['height']) ? floatval($size_data['height']) : 0;
                            $weight = isset($size_data['weight']) ? floatval($size_data['weight']) : 0;

                            $sizes_stmt->bind_param(
                                'isddd',
                                $product_id,
                                $size,
                                $width,
                                $height,
                                $weight
                            );

                            if (!$sizes_stmt->execute()) {
                                // Log error but continue with other sizes
                                error_log("Failed to insert product size: " . $conn->error);
                            }
                        }
                        $sizes_stmt->close();
                    }
                }
            }
        }

        // Handle product parts update
        $debug_parts = [];
        if ($parts) {
            $debug_parts['parts_input'] = $parts;
            // First delete all existing parts for this product
            $delete_parts_stmt = $conn->prepare("DELETE FROM product_part WHERE product_id = ?");
            if ($delete_parts_stmt) {
                $delete_parts_stmt->bind_param("i", $product_id);
                $delete_parts_stmt->execute();
                $delete_parts_stmt->close();
                $debug_parts['delete_status'] = 'deleted existing parts';

                // Now insert new parts
                if (is_string($parts)) {
                    $parts = json_decode($parts, true);
                    $debug_parts['decoded_parts'] = $parts;
                }

                if (is_array($parts) && !empty($parts)) {
                    $debug_parts['parts_count'] = count($parts);
                    $parts_sql = "INSERT INTO product_part (id, product_id, name, for_product, color, quantity) VALUES (NULL, ?, ?, ?, ?, ?)";
                    $debug_parts['parts_sql'] = $parts_sql;

                    $parts_stmt = $conn->prepare($parts_sql);
                    if (!$parts_stmt) {
                        $debug_parts['prepare_error'] = $conn->error;
                        error_log("Failed to prepare parts statement: " . $conn->error);
                    } else {
                        $debug_parts['inserted_parts'] = [];

                        foreach ($parts as $part_index => $part) {
                            $name = isset($part['name']) ? $part['name'] : '';
                            $for_product = isset($part['for_product']) ? $part['for_product'] : '';
                            $color = isset($part['color']) ? $part['color'] : '';
                            $quantity = isset($part['quantity']) ? intval($part['quantity']) : 1;

                            $debug_parts['part_data_' . $part_index] = [
                                'name' => $name,
                                'for_product' => $for_product,
                                'color' => $color,
                                'quantity' => $quantity
                            ];

                            $parts_stmt->bind_param(
                                'isssi',
                                $product_id,
                                $name,
                                $for_product,
                                $color,
                                $quantity
                            );

                            if (!$parts_stmt->execute()) {
                                $debug_parts['error_' . $part_index] = $conn->error;
                                error_log("Failed to insert product part: " . $conn->error);
                            } else {
                                $debug_parts['inserted_parts'][] = $part_index;
                            }
                        }
                        $parts_stmt->close();
                        $debug_parts['status'] = 'completed';
                    }
                } else {
                    $debug_parts['error'] = 'Parts array is empty or invalid';
                }
            } else {
                $debug_parts['delete_error'] = $conn->error;
            }
        } else {
            $debug_parts['status'] = 'No parts data provided';
        }

        // Handle product prices update
        $debug_prices = [];
        if ($prices) {
            $debug_prices['prices_input'] = $prices;
            // First delete all existing prices for this product
            $delete_prices_stmt = $conn->prepare("DELETE FROM product_prices WHERE product_id = ?");
            if ($delete_prices_stmt) {
                $delete_prices_stmt->bind_param("i", $product_id);
                $delete_prices_stmt->execute();
                $delete_prices_stmt->close();
                $debug_prices['delete_status'] = 'deleted existing prices';

                // Now insert new prices
                if (is_string($prices)) {
                    $prices = json_decode($prices, true);
                    $debug_prices['decoded_prices'] = $prices;
                }

                if (is_array($prices) && !empty($prices)) {
                    $debug_prices['prices_count'] = count($prices);
                    $prices_sql = "INSERT INTO product_prices (id, product_id, retail_price, wholesale_price, special_price) VALUES (NULL, ?, ?, ?, ?)";
                    $debug_prices['prices_sql'] = $prices_sql;

                    $prices_stmt = $conn->prepare($prices_sql);
                    if (!$prices_stmt) {
                        $debug_prices['prepare_error'] = $conn->error;
                        error_log("Failed to prepare prices statement: " . $conn->error);
                    } else {
                        $debug_prices['inserted_prices'] = [];

                        foreach ($prices as $price_index => $price) {
                            $retail_price = isset($price['retail_price']) ? floatval($price['retail_price']) : 0;
                            $wholesale_price = isset($price['wholesale_price']) ? floatval($price['wholesale_price']) : 0;
                            $special_price = isset($price['special_price']) ? floatval($price['special_price']) : 0;

                            $debug_prices['price_data_' . $price_index] = [
                                'retail_price' => $retail_price,
                                'wholesale_price' => $wholesale_price,
                                'special_price' => $special_price
                            ];

                            $prices_stmt->bind_param(
                                'iddd',
                                $product_id,
                                $retail_price,
                                $wholesale_price,
                                $special_price
                            );

                            if (!$prices_stmt->execute()) {
                                $debug_prices['error_' . $price_index] = $conn->error;
                                error_log("Failed to insert product price: " . $conn->error);
                            } else {
                                $debug_prices['inserted_prices'][] = $price_index;
                            }
                        }
                        $prices_stmt->close();
                        $debug_prices['status'] = 'completed';
                    }
                } else {
                    $debug_prices['error'] = 'Prices array is empty or invalid';
                }
            } else {
                $debug_prices['delete_error'] = $conn->error;
            }
        } else {
            $debug_prices['status'] = 'No prices data provided';
        }

        $response = [
            'status' => 'success',
            'message' => 'Product updated successfully',
            'product_id' => $product_id,
            'data' => $updated_product,
            'images' => $all_images,
            'options_updated' => !empty($options),
            'colors_updated' => !empty($colors),
            'times_updated' => !empty($production_times),
            'sizes_updated' => !empty($sizes),
            'parts_updated' => !empty($parts),
            'prices_updated' => !empty($prices),
            'debug_parts' => $debug_parts,
            'debug_prices' => $debug_prices
        ];
    } else {
        $response = [
            'status' => 'error',
            'message' => 'Failed to update product: ' . $stmt->error
        ];
    }

    $stmt->close();
} else {
    $response = [
        'status' => 'error',
        'message' => 'Only PUT or POST methods are allowed'
    ];
}

$conn->close();
echo json_encode($response);
?>