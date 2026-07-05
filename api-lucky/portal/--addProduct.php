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

    // Debug raw data with enhanced tracking
    $debug = [
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'content_type' => isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : 'not set',
        'raw_json_data' => $json_data,
        'decoded_data' => $data,
        'post_data' => $_POST,
        'files_data' => $_FILES,
        'fields' => [
            'subcategory_id' => isset($_POST['subcategory_id']) ? $_POST['subcategory_id'] : null,
            'model' => isset($_POST['model']) ? $_POST['model'] : '',
            'name' => isset($_POST['name']) ? $_POST['name'] : '',
            'description' => isset($_POST['description']) ? $_POST['description'] : '',
            'productType' => isset($_POST['productType']) ? $_POST['productType'] : '',
            'inventory' => isset($_POST['inventory']) ? $_POST['inventory'] : '',
            'request' => isset($_POST['request']) ? $_POST['request'] : '',
            'total_availble' => isset($_POST['total_availble']) ? $_POST['total_availble'] : '',
            'parts' => isset($_POST['parts']) ? json_decode($_POST['parts'], true) : [],
            'prices' => isset($_POST['prices']) ? json_decode($_POST['prices'], true) : [],
            'sizes' => isset($_POST['sizes']) ? json_decode($_POST['sizes'], true) : [],
            'colors' => isset($_POST['colors']) ? json_decode($_POST['colors'], true) : [],
            'options' => isset($_POST['options']) ? json_decode($_POST['options'], true) : [],
            'tags' => isset($_POST['tags']) ? json_decode($_POST['tags'], true) : []
        ],
        'json_decode_error' => json_last_error_msg(),
        'json_decode_error_code' => json_last_error()
    ];

    // Log the debug information to a file for persistence
    $log_file = '../logs/product_debug.log';
    if (!file_exists('../logs')) {
        mkdir('../logs', 0777, true);
    }
    $log_entry = date('Y-m-d H:i:s') . ' - ' . json_encode($debug, JSON_PRETTY_PRINT) . "\n-------------------\n";
    file_put_contents($log_file, $log_entry, FILE_APPEND);

    // ถ้าไม่มีข้อมูล JSON ให้ลองรับจาก form data (POST)
    if ($json_data === false || $data === null) {
        $debug['data_source'] = 'form_data';

        // รับค่าจาก form data (POST)
        $subcategory_id = isset($_POST['subcategory_id']) ? $_POST['subcategory_id'] : null;
        $model = isset($_POST['model']) ? $_POST['model'] : '';
        $name = isset($_POST['name']) ? $_POST['name'] : '';
        $colors_json = isset($_POST['colors']) ? $_POST['colors'] : '[]';
        $price = isset($_POST['price']) ? $_POST['price'] : 0;
        $inventory = isset($_POST['inventory']) ? $_POST['inventory'] : 0;
        $request = isset($_POST['request']) ? $_POST['request'] : 0;
        $productType = isset($_POST['productType']) ? $_POST['productType'] : null;
        $debug['productType'] = [
            'post_value' => isset($_POST['productType']) ? $_POST['productType'] : 'not set',
            'final_value' => $productType
        ];

        // รับค่า total_available หรือ total_availble (รองรับทั้งสองกรณี)
        $total_available = isset($_POST['total_available']) ? $_POST['total_available'] :
            (isset($_POST['total_availble']) ? $_POST['total_availble'] : 0);

        $colors = isset($_POST['colors']) ? $_POST['colors'] : null;
        $size = isset($_POST['size']) ? $_POST['size'] : null;
        $width = isset($_POST['width']) ? $_POST['width'] : null;
        $height = isset($_POST['height']) ? $_POST['height'] : null;
        $weight = isset($_POST['weight']) ? $_POST['weight'] : null;
        $body = isset($_POST['description']) ? $_POST['description'] : null;
        $tags = isset($_POST['tags']) ? $_POST['tags'] : null;

        // รับข้อมูลรูปภาพหลัก (รองรับทั้ง base64 และไฟล์ที่อัปโหลด)
        $main_image = null;
        $main_image_filename = null;

        if (isset($_POST['image']) && !empty($_POST['image'])) {
            $main_image = $_POST['image'];
        } elseif (isset($_FILES['image']) && $_FILES['image']['error'] == 0) {
            $main_image = $_FILES['image'];
        }
    } else {
        $debug['data_source'] = 'json_data';

        // รับค่าจาก JSON
        $subcategory_id = isset($data['subcategory_id']) ? $data['subcategory_id'] :
            (isset($data['subcategoryId']) ? $data['subcategoryId'] : null);
        $model = isset($data['model']) ? $data['model'] :
            (isset($data['modelName']) ? $data['modelName'] : '');
        $name = isset($data['name']) ? $data['name'] : '';
        $colors_json = isset($data['colors']) ? $data['colors'] : '[]';
        $price = isset($data['price']) ? $data['price'] : 0;
        $inventory = isset($data['inventory']) ? $data['inventory'] : 0;
        $request = isset($data['request']) ? $data['request'] : 0;

        // รับค่า total_available หรือ total_availble (รองรับทั้งสองกรณี)
        $total_available = isset($data['total_available']) ? $data['total_available'] :
            (isset($data['total_availble']) ? $data['total_availble'] : 0);

        $colors = isset($data['colors']) ? $data['colors'] : null;
        $size = isset($data['size']) ? $data['size'] : null;
        $width = isset($data['width']) ? $data['width'] : null;
        $height = isset($data['height']) ? $data['height'] : null;
        $weight = isset($data['weight']) ? $data['weight'] : null;
        $body = isset($data['description']) ? $data['description'] : null;
        $tags = isset($data['tags']) ? $data['tags'] : null;

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

    // เตรียมข้อมูลราคา
    $prices_to_insert = null;
    $debug['raw_prices'] = [
        'post' => isset($_POST['prices']) ? $_POST['prices'] : null,
        'json' => isset($data['prices']) ? $data['prices'] : null
    ];

    // เตรียมข้อมูลขนาด
    $sizes_to_insert = null;
    $debug['raw_sizes'] = [
        'post' => isset($_POST['sizes']) ? $_POST['sizes'] : null,
        'json' => isset($data['sizes']) ? $data['sizes'] : null
    ];

    // เตรียมข้อมูล production times
    $times_to_insert = null;
    $debug['raw_times'] = [
        'post' => isset($_POST['productionTimes']) ? $_POST['productionTimes'] : null,
        'json' => isset($data['productionTimes']) ? $data['productionTimes'] : null
    ];

    // ตรวจสอบข้อมูล production times จาก POST หรือ JSON
    if (isset($_POST['productionTimes']) && !empty($_POST['productionTimes'])) {
        $times_json = $_POST['productionTimes'];
        try {
            $times_to_insert = json_decode($times_json, true);
        } catch (Exception $e) {
            $debug['times_decode_error'] = $e->getMessage();
        }
    } elseif (isset($data['productionTimes']) && !empty($data['productionTimes'])) {
        $times_to_insert = $data['productionTimes'];
    }

    $debug['times_after_decode'] = [
        'data' => $times_to_insert,
        'type' => gettype($times_to_insert)
    ];

    // ตรวจสอบข้อมูลขนาดจาก POST หรือ JSON
    if (isset($_POST['sizes']) && !empty($_POST['sizes'])) {
        $sizes_json = $_POST['sizes'];
        try {
            $sizes_to_insert = json_decode($sizes_json, true);
        } catch (Exception $e) {
            $debug['sizes_decode_error'] = $e->getMessage();
        }
    } elseif (isset($data['sizes']) && !empty($data['sizes'])) {
        $sizes_to_insert = $data['sizes'];
    }

    $debug['sizes_after_decode'] = [
        'data' => $sizes_to_insert,
        'type' => gettype($sizes_to_insert)
    ];

    // รับข้อมูลราคาจาก POST
    if (isset($_POST['prices'])) {
        $debug['prices_source'] = 'POST data';
        $stripped = stripslashes($_POST['prices']);
        $prices_to_insert = json_decode($stripped, true);
        $debug['prices_decode'] = [
            'original' => $_POST['prices'],
            'stripped' => $stripped,
            'decoded' => $prices_to_insert,
            'error' => json_last_error_msg()
        ];
    }
    // รับข้อมูลราคาจาก JSON
    else if (isset($data['prices'])) {
        if (is_string($data['prices'])) {
            $debug['prices_source'] = 'JSON string';
            $prices_to_insert = json_decode($data['prices'], true);
        } else {
            $debug['prices_source'] = 'JSON data';
            $prices_to_insert = $data['prices'];
        }
    }

    $debug['prices_after_decode'] = [
        'data' => $prices_to_insert,
        'type' => gettype($prices_to_insert)
    ];

    // ตรวจสอบข้อมูลราคา
    if (is_array($prices_to_insert)) {
        if (isset($prices_to_insert[0])) {
            // ถ้าเป็น array ให้เอาค่าแรก
            $prices_to_insert = $prices_to_insert[0];
            $debug['prices_array_converted'] = true;
        }
        $debug['prices_array_content'] = $prices_to_insert;

        // ตรวจสอบว่ามีข้อมูลราคาครบหรือไม่
        $has_retail = isset($prices_to_insert['retailPrice']) || isset($prices_to_insert['retail_price']);
        $has_wholesale = isset($prices_to_insert['wholesalePrice']) || isset($prices_to_insert['wholesale_price']);
        $has_special = isset($prices_to_insert['specialPrice']) || isset($prices_to_insert['special_price']);

        $debug['prices_fields_check'] = [
            'has_retail' => $has_retail,
            'has_wholesale' => $has_wholesale,
            'has_special' => $has_special,
            'fields' => array_keys($prices_to_insert)
        ];

        if (!$has_retail && !$has_wholesale && !$has_special) {
            $prices_to_insert = null;
            $debug['prices_validation_error'] = 'Missing required price fields';
        }
    } else {
        $debug['prices_validation_error'] = 'Invalid price data format';
    }

    // เตรียมข้อมูล parts
    $parts_to_insert = [];
    if (isset($data['parts']) && is_array($data['parts'])) {
        $parts_to_insert = $data['parts'];
        $debug['parts_source'] = 'JSON array';
    } else if (isset($data['parts']) && is_string($data['parts'])) {
        $parts_to_insert = json_decode($data['parts'], true);
        $debug['parts_source'] = 'JSON string';
    } else if (isset($_POST['parts'])) {
        $parts_to_insert = json_decode(stripslashes($_POST['parts']), true);
        $debug['parts_source'] = 'POST data';
        $debug['parts_decode'] = [
            'original' => $_POST['parts'],
            'stripped' => stripslashes($_POST['parts']),
            'decoded' => $parts_to_insert,
            'error' => json_last_error_msg()
        ];
    }

    // ตรวจสอบและเตรียมข้อมูล parts
    $parts_validated = [];
    if (is_array($parts_to_insert)) {
        foreach ($parts_to_insert as $part) {
            // รองรับทั้ง for และ for_product
            $for_product = isset($part['for_product']) ? $part['for_product'] : (isset($part['for']) ? $part['for'] : null);

            if (isset($part['name']) && $for_product && isset($part['color']) && isset($part['quantity'])) {
                $parts_validated[] = [
                    'name' => $part['name'],
                    'for_product' => $for_product,
                    'color' => $part['color'],
                    'quantity' => intval($part['quantity'])
                ];
            } else {
                $debug['parts_validation'][] = [
                    'part' => $part,
                    'missing_fields' => array_diff(['name', 'for_product', 'color', 'quantity'], array_keys($part))
                ];
            }
        }
    }
    $debug['parts_validated'] = $parts_validated;

    // ถ้าเป็น array ให้เอาค่าแรก
    if (is_array($prices_to_insert)) {
        if (isset($prices_to_insert[0])) {
            $prices_to_insert = $prices_to_insert[0];
            $debug['prices_array_converted'] = true;
        }
        $debug['prices_array_content'] = $prices_to_insert;
    }

    // ตรวจสอบความถูกต้องของข้อมูลราคา
    if ($prices_to_insert) {
        // รองรับทั้งแบบ snake_case และ camelCase
        $retail_price = null;
        $wholesale_price = null;
        $special_price = null;

        // Debug ข้อมูลราคาที่ได้รับ
        $debug['prices_data_received'] = $prices_to_insert;

        // ตรวจสอบทั้งสองรูปแบบ
        $retail_price = isset($prices_to_insert['retail_price']) ? $prices_to_insert['retail_price'] :
            (isset($prices_to_insert['retailPrice']) ? $prices_to_insert['retailPrice'] : null);

        $wholesale_price = isset($prices_to_insert['wholesale_price']) ? $prices_to_insert['wholesale_price'] :
            (isset($prices_to_insert['wholesalePrice']) ? $prices_to_insert['wholesalePrice'] : null);

        $special_price = isset($prices_to_insert['special_price']) ? $prices_to_insert['special_price'] :
            (isset($prices_to_insert['specialPrice']) ? $prices_to_insert['specialPrice'] : null);

        if ($retail_price === null || $wholesale_price === null || $special_price === null) {
            $debug['prices_error'] = 'Missing required price fields';
            $debug['prices_received'] = $prices_to_insert;
            $prices_to_insert = null;
        } else {
            // แปลงค่าให้เป็นตัวเลข
            $prices_to_insert = [
                'retail_price' => intval($retail_price),
                'wholesale_price' => intval($wholesale_price),
                'special_price' => intval($special_price)
            ];
            $debug['final_prices'] = $prices_to_insert;
        }
    }
    $debug['prices_to_insert'] = $prices_to_insert;

    // เตรียมข้อมูล parts
    $parts_to_insert = [];
    $debug['full_request'] = $data;

    // แปลง colors string เป็น array
    $colors_array = [];
    $debug['colors_data'] = [
        'has_post_colors' => isset($_POST['colors']),
        'has_json_colors' => isset($data['colors']),
        'post_type' => isset($_POST['colors']) ? gettype($_POST['colors']) : 'undefined',
        'json_type' => isset($data['colors']) ? gettype($data['colors']) : 'undefined'
    ];

    // Try to get colors from POST data first
    if (isset($_POST['colors']) && !empty($_POST['colors'])) {
        $colors_array = json_decode($_POST['colors'], true);
        $debug['colors_data']['source'] = 'POST';
    }
    // If no valid colors in POST, try JSON data
    elseif (isset($data['colors']) && !empty($data['colors'])) {
        if (is_string($data['colors'])) {
            $colors_array = json_decode($data['colors'], true);
            $debug['colors_data']['source'] = 'JSON string';
        } else {
            $colors_array = $data['colors'];
            $debug['colors_data']['source'] = 'JSON array';
        }
        $debug['colors_data']['raw_data'] = $data['colors'];
    } else {
        $debug['colors_data']['error'] = 'Colors data not found in request';
    }

    // Log the results
    $debug['colors_data']['decoded_data'] = $colors_array;
    $debug['colors_data']['json_error'] = json_last_error_msg();
    $debug['colors_data']['status'] = ($colors_array && is_array($colors_array)) ? 'success' : 'failed';

    if ($colors_array && is_array($colors_array)) {
        // Add debug info about the colors array
        $debug['colors_array_info'] = [
            'total_items' => count($colors_array),
            'is_array' => is_array($colors_array),
            'first_item_type' => !empty($colors_array) ? gettype(reset($colors_array)) : 'none',
            'structure' => array_map(function ($item) {
                return [
                    'type' => gettype($item),
                    'has_value' => isset($item['value']),
                    'has_label' => isset($item['label']),
                    'value_type' => isset($item['value']) ? gettype($item['value']) : 'undefined',
                    'label_type' => isset($item['label']) ? gettype($item['label']) : 'undefined'
                ];
            }, $colors_array)
        ];

        // เตรียมข้อมูลสีสำหรับการ insert
        $colors_to_insert = [];
        foreach ($colors_array as $index => $color) {
            $debug['processing_color'][] = [
                'index' => $index,
                'color' => $color
            ];

            // ตรวจสอบว่ามีข้อมูลสีและรูปภาพครบถ้วน
            if (isset($color['color']) && isset($color['image'])) {
                $color_name = $color['color'];
                $image_data = $color['image'];
                $timestamp = time();

                // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
                $filename = "color_{$timestamp}_{$index}.png";
                $image_path = "../uploads/colors/{$filename}";

                // บันทึกรูปภาพ
                if (strpos($image_data, 'data:image') !== false) {
                    $parts = explode(',', $image_data);
                    if (count($parts) === 2) {
                        $imageData = base64_decode($parts[1]);
                        if (file_put_contents($image_path, $imageData)) {
                            $colors_to_insert[] = [
                                'color' => $color_name,
                                'image_path' => $filename,
                                'created_at' => date('Y-m-d H:i:s'),
                                'updated_at' => date('Y-m-d H:i:s')
                            ];
                            $debug['color_saved'][] = [
                                'color' => $color_name,
                                'filename' => $filename
                            ];
                        } else {
                            $debug['color_save_error'][] = [
                                'color' => $color_name,
                                'error' => 'Failed to save image file'
                            ];
                        }
                    }
                } else if (is_string($image_data) && file_exists($image_data)) {
                    // Handle uploaded file path
                    if (copy($image_data, $image_path)) {
                        $colors_to_insert[] = [
                            'color' => $color_name,
                            'image_path' => $filename,
                            'created_at' => date('Y-m-d H:i:s'),
                            'updated_at' => date('Y-m-d H:i:s')
                        ];
                        $debug['color_saved'][] = [
                            'color' => $color_name,
                            'filename' => $filename
                        ];
                    } else {
                        $debug['color_save_error'][] = [
                            'color' => $color_name,
                            'error' => 'Failed to copy image file'
                        ];
                    }
                }
            }
        }
    } else {
        $debug['colors_status'] = 'Colors data is not array or not set';
    }

    // เตรียมข้อมูล sizes
    if (isset($data['sizes']) && is_array($data['sizes'])) {
        $sizes_json = json_encode($data['sizes']);
    } else {
        $sizes_json = null;
    }

    // เตรียมข้อมูล prices
    if (isset($data['prices']) && is_array($data['prices'])) {
        $prices_json = json_encode($data['prices']);
    } else {
        $prices_json = null;
    }

    // เตรียมข้อมูล parts
    if (isset($data['parts']) && is_array($data['parts'])) {
        $parts_json = json_encode($data['parts']);
    } else {
        $parts_json = null;
    }

    // Prepare and execute the SQL query สำหรับบันทึกข้อมูลสินค้า
    // Debug variable types and values
    $debug = [
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'content_type' => isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : 'not set',
        'post_data' => $_POST,
        'files' => $_FILES,
        'json_data' => $json_data,
        'decoded_data' => $data,
        'variables' => [
            'productType' => ['type' => gettype($productType), 'value' => $productType],
            'subcategory_id' => ['type' => gettype($subcategory_id), 'value' => $subcategory_id],
            'model' => ['type' => gettype($model), 'value' => $model],
            'name' => ['type' => gettype($name), 'value' => $name],
            'price' => ['type' => gettype($price), 'value' => $price],
            'inventory' => ['type' => gettype($inventory), 'value' => $inventory],
            'request' => ['type' => gettype($request), 'value' => $request],
            'total_available' => ['type' => gettype($total_available), 'value' => $total_available],
            'color' => ['type' => gettype($color), 'value' => $color],
            'size' => ['type' => gettype($size), 'value' => $size],
            'width' => ['type' => gettype($width), 'value' => $width],
            'height' => ['type' => gettype($height), 'value' => $height],
            'weight' => ['type' => gettype($weight), 'value' => $weight],
            'body' => ['type' => gettype($body), 'value' => $body],
            'tags' => ['type' => gettype($tags), 'value' => $tags]
        ]
    ];

    // Convert tags to JSON string if it's an array
    if (is_array($tags)) {
        $tags = json_encode($tags);
    } elseif ($tags === null) {
        $tags = '[]';
    }

    // Cast numeric values and ensure strings aren't null
    $productType = is_numeric($productType) ? intval($productType) : 0;
    $subcategory_id = is_numeric($subcategory_id) ? intval($subcategory_id) : 0;
    $price = is_numeric($price) ? intval($price) : 0;
    $inventory = is_numeric($inventory) ? intval($inventory) : 0;
    $request = is_numeric($request) ? intval($request) : 0;
    $total_available = is_numeric($total_available) ? intval($total_available) : 0;
    $model = $model ?? '';
    $name = $name ?? '';
    $color = $color ?? '';
    $size = $size ?? '';
    $width = $width ?? '';
    $height = $height ?? '';
    $weight = $weight ?? '';
    $body = $body ?? '';

    // Log the values after casting
    $debug['processed_variables'] = [
        'productType' => ['type' => gettype($productType), 'value' => $productType],
        'subcategory_id' => ['type' => gettype($subcategory_id), 'value' => $subcategory_id],
        'model' => ['type' => gettype($model), 'value' => $model],
        'name' => ['type' => gettype($name), 'value' => $name],
        'price' => ['type' => gettype($price), 'value' => $price],
        'inventory' => ['type' => gettype($inventory), 'value' => $inventory],
        'request' => ['type' => gettype($request), 'value' => $request],
        'total_available' => ['type' => gettype($total_available), 'value' => $total_available],
        'color' => ['type' => gettype($color), 'value' => $color],
        'size' => ['type' => gettype($size), 'value' => $size],
        'width' => ['type' => gettype($width), 'value' => $width],
        'height' => ['type' => gettype($height), 'value' => $height],
        'weight' => ['type' => gettype($weight), 'value' => $weight],
        'body' => ['type' => gettype($body), 'value' => $body],
        'tags' => ['type' => gettype($tags), 'value' => $tags]
    ];

    $product_sql = "INSERT INTO product (type_id, subcategory_id, model, name, price, inventory, request, total_available, color, size, width, height, weight, body, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    // Log the SQL query
    $debug['sql_query'] = $product_sql;

    $stmt = $conn->prepare($product_sql);

    if ($stmt === false) {
        $debug['prepare_error'] = [
            'error' => $conn->error,
            'errno' => $conn->errno,
            'sqlstate' => $conn->sqlstate
        ];
        $response = [
            'status' => 'error',
            'message' => 'Failed to prepare statement: ' . $conn->error,
            'debug' => $debug
        ];
        echo json_encode($response);
        exit;
    }

    // Check parameter counts
    $type_string = "iissiiissssssss"; // 15 parameters: 7 integers/strings + 8 strings
    $params = [$productType, $subcategory_id, $model, $name, $price, $inventory, $request, $total_available, $color, $size, $width, $height, $weight, $body, $tags];

    $debug['parameter_check'] = [
        'type_string_length' => strlen($type_string),
        'params_count' => count($params),
        'type_string' => $type_string,
        'params' => $params
    ];

    if (strlen($type_string) !== count($params)) {
        $response = [
            'status' => 'error',
            'message' => 'Parameter count mismatch: expected ' . strlen($type_string) . ' parameters, got ' . count($params),
            'debug' => $debug
        ];
        echo json_encode($response);
        exit;
    }

    // Try binding parameters
    try {
        $bind_result = $stmt->bind_param($type_string, ...$params);

        if ($bind_result === false) {
            throw new Exception($stmt->error);
        }
    } catch (Exception $e) {
        $debug['bind_error'] = [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ];
        $response = [
            'status' => 'error',
            'message' => 'Failed to bind parameters: ' . $e->getMessage(),
            'debug' => $debug
        ];
        echo json_encode($response);
        exit;
    }

    if ($stmt->execute()) {
        $product_id = $conn->insert_id;

        // บันทึกข้อมูลสี
        if (!empty($colors_to_insert)) {
            // Debug: แสดงข้อมูลที่จะ insert
            $debug['colors_to_insert'] = $colors_to_insert;
            $debug['product_id_for_colors'] = $product_id;

            // ตรวจสอบการเตรียม SQL statement
            $color_sql = "INSERT INTO product_colors ( product_id, color, image_path, created_at, updated_at) VALUES ( ?, ?, ?, ?, ?)";
            $color_stmt = $conn->prepare($color_sql);

            // Log SQL query with details
            $debug['color_sql'] = [
                'query' => $color_sql,
                'total_colors' => count($colors_to_insert),
                'product_id' => $product_id,
                'colors_data' => array_map(function ($color) {
                    return [
                        'color' => $color['color'],
                        'image_path' => basename($color['image_path']),
                        'created_at' => $color['created_at']
                    ];
                }, $colors_to_insert)
            ];

            if (!$color_stmt) {
                $debug['color_prepare_error'] = $conn->error;
            } else {
                foreach ($colors_to_insert as $color_data) {
                    // Debug: แสดงข้อมูลแต่ละรายการที่กำลัง insert พร้อมรายละเอียด
                    $debug['current_color_data'] = [
                        'sql' => $color_sql,
                        'params' => [
                            'product_id' => $product_id,
                            'color' => $color_data['color'],
                            'image_path' => basename($color_data['image_path']),
                            'created_at' => $color_data['created_at'],
                            'updated_at' => $color_data['updated_at']
                        ],
                        'timestamp' => date('Y-m-d H:i:s'),
                        'file_exists' => file_exists($color_data['image_path']) ? 'yes' : 'no',
                        'image_size' => file_exists($color_data['image_path']) ? filesize($color_data['image_path']) : 0
                    ];

                    // Store only relative path in database
                    $relative_image_path = 'uploads/colors/' . basename($color_data['image_path']);

                    $color_stmt->bind_param(
                        'issss',
                        $product_id,
                        $color_data['color'],
                        $relative_image_path,
                        $color_data['created_at'],
                        $color_data['updated_at']
                    );

                    // ตรวจสอบการ bind parameters
                    if ($color_stmt->error) {
                        $debug['color_bind_error'][] = [
                            'error' => $color_stmt->error,
                            'color' => $color_data['color'],
                            'params' => [
                                'product_id' => $product_id,
                                'color' => $color_data['color'],
                                'image_path' => $relative_image_path
                            ]
                        ];
                        continue;
                    }

                    if ($color_stmt->execute()) {
                        $debug['color_insert_success'][] = [
                            'color' => $color_data['color'],
                            'image_path' => $relative_image_path
                        ];
                    } else {
                        $debug['color_insert_error'][] = [
                            'color' => $color_data['color'],
                            'sql_error' => $color_stmt->error,
                            'sql_errno' => $color_stmt->errno,
                            'image_path' => $relative_image_path
                        ];
                    }
                }
                $color_stmt->close();
            }

            // ตรวจสอบว่ามีข้อมูลถูก insert หรือไม่
            $check_colors = $conn->query("SELECT COUNT(*) as count FROM product_colors WHERE product_id = '{$product_id}'");
            if ($check_colors) {
                $count_result = $check_colors->fetch_assoc();
                $debug['colors_inserted_count'] = $count_result['count'];
            } else {
                $debug['colors_count_error'] = $conn->error;
            }
        } else {
            $debug['colors_status'] = 'No colors to insert';
        }

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

        // บันทึกข้อมูล parts
        if (!empty($parts_validated)) {
            $parts_sql = "INSERT INTO product_part (id, product_id, name, for_product, color, quantity) VALUES (NULL, ?, ?, ?, ?, ?)";
            $parts_stmt = $conn->prepare($parts_sql);

            if (!$parts_stmt) {
                $debug['parts_prepare_error'] = $conn->error;
            } else {
                foreach ($parts_validated as $part) {
                    $parts_stmt->bind_param(
                        'isssi',
                        $product_id,
                        $part['name'],
                        $part['for_product'],
                        $part['color'],
                        $part['quantity']
                    );

                    if (!$parts_stmt->execute()) {
                        $debug['parts_insert_error'][] = [
                            'error' => $conn->error,
                            'part' => $part
                        ];
                    } else {
                        $debug['parts_inserted'][] = [
                            'id' => $conn->insert_id,
                            'part' => $part
                        ];
                    }
                }
                $parts_stmt->close();
            }
        }

        // บันทึกข้อมูล production times
        if ($times_to_insert && is_array($times_to_insert)) {
            $debug['times_raw_data'] = $times_to_insert;
            $current_timestamp = date('Y-m-d H:i:s');

            $times_sql = "INSERT INTO product_times (product_id, duration, unit, created_at, updated_at) VALUES (?, ?, ?, ?, ?)";
            $debug['times_sql'] = $times_sql;
            $times_stmt = $conn->prepare($times_sql);

            if (!$times_stmt) {
                $debug['times_prepare_error'] = $conn->error;
            } else {
                foreach ($times_to_insert as $time_data) {
                    $duration = isset($time_data['duration']) ? $time_data['duration'] : 0;
                    $unit = isset($time_data['unit']) ? $time_data['unit'] : 'days';

                    $debug['time_data_to_insert'] = [
                        'product_id' => $product_id,
                        'duration' => $duration,
                        'unit' => $unit,
                        'created_at' => $current_timestamp,
                        'updated_at' => $current_timestamp
                    ];

                    $times_stmt->bind_param(
                        'issss',
                        $product_id,
                        $duration,
                        $unit,
                        $current_timestamp,
                        $current_timestamp
                    );

                    if (!$times_stmt->execute()) {
                        $debug['times_insert_error'][] = [
                            'error' => $conn->error,
                            'sql_state' => $conn->sqlstate,
                            'errno' => $conn->errno,
                            'data' => $debug['time_data_to_insert']
                        ];
                    } else {
                        $debug['times_inserted'][] = $debug['time_data_to_insert'];
                    }
                }
                $times_stmt->close();
            }
        } else {
            $debug['times_skipped'] = 'No production times data to insert';
            $debug['times_data'] = $times_to_insert;
        }

        // บันทึกข้อมูลขนาด
        if ($sizes_to_insert && is_array($sizes_to_insert)) {
            $debug['sizes_raw_data'] = $sizes_to_insert;

            $sizes_sql = "INSERT INTO product_size (product_id, size, width, height, weight) VALUES (?, ?, ?, ?, ?)";
            $debug['sizes_sql'] = $sizes_sql;
            $sizes_stmt = $conn->prepare($sizes_sql);

            if (!$sizes_stmt) {
                $debug['sizes_prepare_error'] = $conn->error;
            } else {
                foreach ($sizes_to_insert as $size_data) {
                    $size = isset($size_data['size']) ? $size_data['size'] : '';
                    $width = isset($size_data['width']) ? floatval($size_data['width']) : 0;
                    $height = isset($size_data['height']) ? floatval($size_data['height']) : 0;
                    $weight = isset($size_data['weight']) ? floatval($size_data['weight']) : 0;

                    $debug['size_data_to_insert'] = [
                        'product_id' => $product_id,
                        'size' => $size,
                        'width' => $width,
                        'height' => $height,
                        'weight' => $weight
                    ];

                    $sizes_stmt->bind_param(
                        'isddd',
                        $product_id,
                        $size,
                        $width,
                        $height,
                        $weight
                    );

                    if (!$sizes_stmt->execute()) {
                        $debug['sizes_insert_error'][] = [
                            'error' => $conn->error,
                            'sql_state' => $conn->sqlstate,
                            'errno' => $conn->errno,
                            'data' => $debug['size_data_to_insert']
                        ];
                    } else {
                        $debug['sizes_inserted'][] = [
                            'id' => $conn->insert_id,
                            'product_id' => $product_id,
                            'size' => $size,
                            'width' => $width,
                            'height' => $height,
                            'weight' => $weight
                        ];
                    }
                }
                $sizes_stmt->close();
            }
        } else {
            $debug['sizes_skipped'] = 'No sizes data to insert';
            $debug['sizes_data'] = $sizes_to_insert;
        }

        // บันทึกข้อมูล product options
        // ตรวจสอบข้อมูล options จาก POST หรือ JSON
        $options_to_insert = null;
        if (isset($_POST['options']) && !empty($_POST['options'])) {
            $options_to_insert = json_decode($_POST['options'], true);
        } elseif (isset($data['options']) && !empty($data['options'])) {
            $options_to_insert = $data['options'];
        }

        if ($options_to_insert && is_array($options_to_insert)) {
            $debug['options_raw_data'] = $options_to_insert;

            $options_sql = "INSERT INTO product_options_select (product_id, option_id) VALUES (?, ?)";
            $debug['options_sql'] = $options_sql;
            $options_stmt = $conn->prepare($options_sql);

            if (!$options_stmt) {
                $debug['options_prepare_error'] = $conn->error;
            } else {
                foreach ($options_to_insert as $option) {
                    $option_id = null;

                    // แปลงชื่อ option เป็น option_id
                    switch ($option) {
                        case 'สกรีน 1 สี':
                            $option_id = 1;
                            break;
                        case 'สกรีน 4 สี':
                            $option_id = 2;
                            break;
                        case 'สติ๊กเกอร์':
                            $option_id = 3;
                            break;
                        case 'เลเซอร์ รายละเอียด':
                            $option_id = 4;
                            break;
                    }

                    if ($option_id !== null) {
                        $debug['option_data_to_insert'] = [
                            'product_id' => $product_id,
                            'option_id' => $option_id
                        ];

                        $options_stmt->bind_param(
                            'ii',
                            $product_id,
                            $option_id
                        );

                        if (!$options_stmt->execute()) {
                            $debug['options_insert_error'][] = [
                                'error' => $conn->error,
                                'sql_state' => $conn->sqlstate,
                                'errno' => $conn->errno,
                                'data' => $debug['option_data_to_insert']
                            ];
                        } else {
                            $debug['options_inserted'][] = [
                                'id' => $conn->insert_id,
                                'product_id' => $product_id,
                                'option_id' => $option_id,
                                'option_name' => $option
                            ];
                        }
                    }
                }
                $options_stmt->close();
            }
        } else {
            $debug['options_skipped'] = 'No options data to insert';
            $debug['options_data'] = $data['options'] ?? null;
        }

        // บันทึกข้อมูลราคา
        if ($prices_to_insert && is_array($prices_to_insert)) {
            $debug['prices_raw_data'] = $prices_to_insert;

            $prices_sql = "INSERT INTO product_prices (id, product_id, retail_price, wholesale_price, special_price) VALUES (NULL, ?, ?, ?, ?)";
            $debug['prices_sql'] = $prices_sql;
            $prices_stmt = $conn->prepare($prices_sql);

            if (!$prices_stmt) {
                $debug['prices_prepare_error'] = $conn->error;
            } else {
                // เตรียมข้อมูลสำหรับการ insert
                $retail = isset($prices_to_insert['retailPrice']) ? floatval($prices_to_insert['retailPrice']) :
                    (isset($prices_to_insert['retail_price']) ? floatval($prices_to_insert['retail_price']) : 0);
                $wholesale = isset($prices_to_insert['wholesalePrice']) ? floatval($prices_to_insert['wholesalePrice']) :
                    (isset($prices_to_insert['wholesale_price']) ? floatval($prices_to_insert['wholesale_price']) : 0);
                $special = isset($prices_to_insert['specialPrice']) ? floatval($prices_to_insert['specialPrice']) :
                    (isset($prices_to_insert['special_price']) ? floatval($prices_to_insert['special_price']) : 0);

                $debug['prices_data_to_insert'] = [
                    'product_id' => $product_id,
                    'retail_price' => $retail,
                    'wholesale_price' => $wholesale,
                    'special_price' => $special
                ];

                $prices_stmt->bind_param(
                    'iddd',
                    $product_id,
                    $retail,
                    $wholesale,
                    $special
                );

                if (!$prices_stmt->execute()) {
                    $debug['prices_insert_error'] = [
                        'error' => $conn->error,
                        'sql_state' => $conn->sqlstate,
                        'errno' => $conn->errno,
                        'data' => $debug['prices_data_to_insert']
                    ];
                } else {
                    $debug['prices_inserted'] = [
                        'id' => $conn->insert_id,
                        'product_id' => $product_id,
                        'retail' => $retail,
                        'wholesale' => $wholesale,
                        'special' => $special
                    ];
                }
                $prices_stmt->close();
            }
        } else {
            $debug['prices_skipped'] = 'No price data to insert';
            $debug['prices_data'] = $prices_to_insert;
        }

        // Insert colors
        $debug['colors_json_raw'] = $colors_json;
        $colors_to_insert = json_decode($colors_json, true);
        $debug['colors_decoded'] = $colors_to_insert;
        $debug['json_last_error'] = json_last_error();
        if ($colors_to_insert && is_array($colors_to_insert)) {
            $debug['colors_raw_data'] = $colors_to_insert;

            // Create directory for color images if it doesn't exist
            $color_images_dir = '../uploads/products/' . $product_id . '/colors';
            if (!file_exists($color_images_dir)) {
                mkdir($color_images_dir, 0777, true);
            }

            $colors_sql = "INSERT INTO product_colors (product_id, color, image_path) VALUES (?, ?, ?)";
            $debug['colors_sql'] = $colors_sql;
            $colors_stmt = $conn->prepare($colors_sql);

            if (!$colors_stmt) {
                $debug['colors_prepare_error'] = $conn->error;
            } else {
                foreach ($colors_to_insert as $color_data) {
                    $color = isset($color_data['color']) ? $color_data['color'] : '';
                    $image_base64 = isset($color_data['image_path']) ? $color_data['image_path'] : '';

                    // Generate unique filename for the color image
                    $image_filename = uniqid('color_') . '_' . preg_replace('/[^a-z0-9]/i', '_', $color) . '.png';
                    $image_path = 'uploads/products/' . $product_id . '/colors/' . $image_filename;
                    $full_image_path = '../' . $image_path;

                    // Save the base64 image
                    if ($image_base64 && strpos($image_base64, 'data:image') !== false) {
                        if (saveImage($image_base64, $full_image_path)) {
                            $debug['color_image_saved'][] = $image_path;

                            $debug['color_data_to_insert'] = [
                                'product_id' => $product_id,
                                'color' => $color,
                                'image_path' => $image_path
                            ];

                            $colors_stmt->bind_param(
                                'iss',
                                $product_id,
                                $color,
                                $image_path
                            );

                            if (!$colors_stmt->execute()) {
                                $debug['colors_insert_error'][] = [
                                    'error' => $conn->error,
                                    'sql_state' => $conn->sqlstate,
                                    'errno' => $conn->errno,
                                    'data' => $debug['color_data_to_insert']
                                ];
                            } else {
                                $debug['colors_inserted'][] = [
                                    'id' => $conn->insert_id,
                                    'product_id' => $product_id,
                                    'color' => $color,
                                    'image_path' => $image_path
                                ];
                            }
                        } else {
                            $debug['color_image_save_error'][] = [
                                'color' => $color,
                                'error' => 'Failed to save color image'
                            ];
                        }
                    } else {
                        $debug['color_image_error'][] = [
                            'color' => $color,
                            'error' => 'Invalid image data'
                        ];
                    }
                }
                $colors_stmt->close();
            }
        } else {
            $debug['colors_skipped'] = 'No color data to insert';
            $debug['colors_data'] = $colors_to_insert;
        }

        $response = [
            'status' => 'success',
            'message' => 'Product added successfully',
            'product_id' => $product_id,
            'debug' => $debug,
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
                'images' => $image_data,
                'colors' => json_decode($colors_json, true),
                'sizes' => json_decode($sizes_json, true),
                'prices' => json_decode($prices_json, true),
                'parts' => json_decode($parts_json, true)
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
