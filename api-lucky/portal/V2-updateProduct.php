<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Log errors to a file for better debugging
ini_set('log_errors', 1);
$logFile = dirname(__DIR__) . '/error_log.txt';
ini_set('error_log', $logFile);

// Clear the log file at the start of each request
file_put_contents($logFile, "");

// Error handler to catch all errors
function handleError($errno, $errstr, $errfile, $errline) {
    $log = "Error [$errno] $errstr in $errfile on line $errline";
    error_log($log);
    
    // Return false to continue with PHP's internal error handling
    return false;
}
set_error_handler('handleError');

// Shutdown function to catch fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        $log = "Fatal error: [{$error['type']}] {$error['message']} in {$error['file']} on line {$error['line']}";
        error_log($log);
    }
});

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS'); // Removed PUT as we'll use POST only
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include database connection
require '../condb.php';

// Debug function
function debug_log($message, $data = null) {
    $log = date('Y-m-d H:i:s') . ' - ' . $message;
    if ($data !== null) {
        $log .= ' - ' . json_encode($data);
    }
    error_log($log);
}

debug_log('updateProduct.php started');

// ฟังก์ชันสำหรับบันทึกรูปภาพจาก base64 หรือไฟล์ที่อัปโหลด
// รองรับทั้ง base64 string และ uploaded file
function saveImage($imageSource, $outputPath) {
    $debug = [];
    $debug['start'] = 'saveImage function called';
    $debug['outputPath'] = $outputPath;
    $debug['source_type'] = gettype($imageSource);
    
    // ตรวจสอบว่าเป็น base64 string หรือไม่
    if (is_string($imageSource) && strpos($imageSource, 'data:image') !== false) {
        $debug['type'] = 'base64_image';
        // แยกส่วน metadata และ base64 data
        $parts = explode(',', $imageSource, 2);
        $debug['parts_count'] = count($parts);
        
        if (count($parts) === 2) {
            // ถอดรหัส base64
            $imageData = base64_decode($parts[1], true);
            $debug['decode_success'] = $imageData !== false;
            $debug['data_length'] = strlen($imageData);
            
            if ($imageData !== false) {
                // สร้าง directory ถ้ายังไม่มี
                $dir = dirname($outputPath);
                if (!file_exists($dir)) {
                    $debug['dir_created'] = mkdir($dir, 0777, true);
                }
                
                // บันทึกไฟล์
                $result = file_put_contents($outputPath, $imageData);
                $debug['write_result'] = $result;
                $debug['file_exists'] = file_exists($outputPath);
                $debug['file_size'] = $result !== false ? filesize($outputPath) : 0;
                
                if ($result !== false) {
                    $debug['success'] = true;
                    error_log('saveImage Debug: ' . print_r($debug, true));
                    return basename($outputPath);
                }
            }
        }
    } 
    // ตรวจสอบว่าเป็น path ไฟล์หรือไม่
    elseif (is_string($imageSource) && file_exists($imageSource)) {
        $debug['type'] = 'file_path';
        $debug['file_exists'] = true;
        $debug['file_size'] = filesize($imageSource);
        
        // สร้าง directory ถ้ายังไม่มี
        $dir = dirname($outputPath);
        if (!file_exists($dir)) {
            $debug['dir_created'] = mkdir($dir, 0777, true);
        }
        
        // คัดลอกไฟล์
        $result = copy($imageSource, $outputPath);
        $debug['copy_result'] = $result;
        $debug['dest_exists'] = file_exists($outputPath);
        
        if ($result) {
            $debug['success'] = true;
            error_log('saveImage Debug: ' . print_r($debug, true));
            return basename($outputPath);
        }
    }
    
    $debug['error'] = 'Failed to save image';
    error_log('saveImage Debug: ' . print_r($debug, true));
    return false;
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('HTTP/1.1 200 OK');
    exit(0);
}

// Log the request method and headers
error_log("=== NEW REQUEST ===");
error_log("Request Method: " . $_SERVER['REQUEST_METHOD']);
error_log("Content Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
error_log("POST data: " . print_r($_POST, true));

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Only POST method is allowed',
        'received_method' => $_SERVER['REQUEST_METHOD']
    ]);
    exit;
}

try {
    // Get the raw POST data
    $rawData = file_get_contents('php://input');
    error_log("Raw input data: " . $rawData);
    
    // Parse the raw data if it's JSON
    $jsonData = json_decode($rawData, true);
    if (json_last_error() === JSON_ERROR_NONE) {
        error_log("Parsed JSON data: " . print_r($jsonData, true));
    } else {
        error_log("No valid JSON data found in request");
    }
    
    // Log all available superglobals for debugging
    error_log("\$_POST: " . print_r($_POST, true));
    error_log("\$_FILES: " . print_r($_FILES, true));
    
    // Check if we have form data but no POST data (happens with PUT requests)
    if (empty($_POST) && !empty($rawData) && strpos($rawData, '=') !== false) {
        parse_str($rawData, $_POST);
        error_log("Parsed PUT data into \$_POST: " . print_r($_POST, true));
    }
    // Remove the 'Connected successfully' message from condb.php
    ob_clean();
    
    // Initialize data array
    $data = [];
    
    // First try to get data from JSON if available
    if (!empty($jsonData) && is_array($jsonData)) {
        $data = $jsonData;
        error_log("Using JSON data");
    } 
    // Otherwise use POST data
    else if (!empty($_POST)) {
        $data = $_POST;
        error_log("Using POST data");
    }
    
    // Log the final data we're working with
    error_log("Final data to process: " . print_r($data, true));
    
    // Check if we have required fields
    if (empty($data)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'No data provided',
            'received_data' => $data
        ]);
        exit;
    }
    
    // Debug raw data with enhanced tracking
    $debug = [
        'request_method' => $_SERVER['REQUEST_METHOD'],
        'content_type' => isset($_SERVER['CONTENT_TYPE']) ? $_SERVER['CONTENT_TYPE'] : 'not set',
        'raw_json_data' => $rawData,
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
        
        // รับค่า product_id ที่ต้องการอัปเดต
        $product_id = isset($_POST['product_id']) ? $_POST['product_id'] : null;
        
        // ตรวจสอบว่ามี product_id หรือไม่
        if (!$product_id) {
            $response = [
                'status' => 'error',
                'message' => 'Product ID is required for update'
            ];
            echo json_encode($response);
            exit;
        }
        
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
        
        // รับค่า product_id ที่ต้องการอัปเดต
        $product_id = isset($data['product_id']) ? $data['product_id'] : null;
        
        // ตรวจสอบว่ามี product_id หรือไม่
        if (!$product_id) {
            $response = [
                'status' => 'error',
                'message' => 'Product ID is required for update'
            ];
            echo json_encode($response);
            exit;
        }
        
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
            'structure' => array_map(function($item) {
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

    // Log all available data for debugging
    error_log("Trying to find product ID in data: " . print_r($data, true));
    
    // Get product_id (support both 'id' and 'product_id' parameters)
    $product_id = null;
    $product_id_sources = [];
    
    // Check all possible sources for product ID
    $possible_id_fields = ['id', 'product_id', 'product-id', 'productId'];
    
    foreach ($possible_id_fields as $field) {
        if (isset($data[$field]) && is_numeric($data[$field])) {
            $product_id = (int)$data[$field];
            $product_id_sources[] = "Found in data['$field']";
            error_log("Found product_id in data['$field']: $product_id");
        }
    }
    
    // If still not found, check $_POST directly
    if ($product_id === null) {
        foreach ($possible_id_fields as $field) {
            if (isset($_POST[$field]) && is_numeric($_POST[$field])) {
                $product_id = (int)$_POST[$field];
                $product_id_sources[] = "Found in \$_POST['$field']";
                error_log("Found product_id in \$_POST['$field']: $product_id");
            }
        }
    }
    
    // Log the result of product ID search
    if ($product_id === null) {
        error_log("Could not find product ID in any expected field");
    } else {
        error_log("Using product_id: $product_id (sources: " . implode(", ", $product_id_sources) . ")");
    }
    
    // Add to debug info
    $debug['product_id_sources'] = $product_id_sources;

    // Check if product_id exists
    debug_log('Checking product_id', ['product_id' => $product_id]);
    if (!isset($product_id) || $product_id <= 0) {
        $response = [
            'status' => 'error',
            'message' => 'Product ID is required for update'
        ];
        echo json_encode($response);
        exit;
    }

    // Update product in database
    $sql = "UPDATE products SET 
       subcategory_id = ?, model = ?, name = ?, price = ?, inventory = ?, 
       request = ?, total_available = ?, color = ?, size = ?, width = ?, 
       height = ?, weight = ?, body = ?, parts = ?, prices = ?, 
       sizes = ?, colors = ?, options = ?, tags = ?";
    // Log the SQL query
    $debug['sql_query'] = $sql;

    $stmt = $conn->prepare($sql);

    $params = "issdsiissdddssssss";
    $param_values = [
        $subcategory_id, 
        $model, 
        $name, 
        $price, 
        $inventory, 
        $request, 
        $total_available, 
        $color, 
        $size, 
        $width, 
        $height, 
        $weight, 
        $body, 
        $parts_json, 
        $prices_json, 
        $sizes_json, 
        $colors_json,
        $options_json,
        $tags_json
    ];

    // Only update main image if a new one is provided
    if (!empty($main_image_filename)) {
        $sql .= ", main_image = ?";
        $params .= "s";
        $param_values[] = $main_image_filename;
    }

    $sql .= " WHERE id = ?";
    $params .= "i";
    $param_values[] = $product_id;

    $stmt = $conn->prepare($sql);

    // Create the bind_param argument array dynamically
    $bind_param_args = array($params);
    foreach ($param_values as &$value) {
        $bind_param_args[] = &$value;
    }

    call_user_func_array(array($stmt, 'bind_param'), $bind_param_args);

    debug_log('Executing SQL update for product');
    if ($stmt->execute()) {
        debug_log('Product update SQL executed successfully');

        // Delete existing color data
        $delete_colors_sql = "DELETE FROM product_colors WHERE product_id = ?";
        $delete_colors_stmt = $conn->prepare($delete_colors_sql);
        $delete_colors_stmt->bind_param("i", $product_id);
        $delete_colors_stmt->execute();
        $delete_colors_stmt->close();

        // First delete existing image records except the main image
        $delete_images_sql = "DELETE FROM product_images WHERE product_id = ? AND is_main = 0";
        $delete_images_stmt = $conn->prepare($delete_images_sql);
        $delete_images_stmt->bind_param("i", $product_id);
        $delete_images_stmt->execute();
        $delete_images_stmt->close();

        // Insert new product image data
        if (!empty($image_data)) {
            $image_sql = "INSERT INTO product_images (product_id, image_path, is_main, sequence, is_portal) VALUES (?, ?, ?, ?, ?)";
            $image_stmt = $conn->prepare($image_sql);

            foreach ($image_data as $image) {
                $image_stmt->bind_param("isiii", $product_id, $image['image_path'], $image['is_main'], $image['sequence'], $image['is_portal']);
                $image_stmt->execute();
            }
            $image_stmt->close();
        }

        // Insert updated color data (if exists)
        $debug['colors_processing'] = [
            'colors_to_insert_exists' => !empty($colors_to_insert),
            'colors_to_insert_type' => gettype($colors_to_insert),
            'colors_to_insert_count' => is_array($colors_to_insert) ? count($colors_to_insert) : 0,
            'colors_to_insert_sample' => is_array($colors_to_insert) && !empty($colors_to_insert) ? array_slice($colors_to_insert, 0, 1) : null
        ];
        
        if (!empty($colors_to_insert) && is_array($colors_to_insert)) {
            $colors_sql = "INSERT INTO product_colors (product_id, color, image_path) VALUES (?, ?, ?)";
            $colors_stmt = $conn->prepare($colors_sql);
            
            if ($colors_stmt === false) {
                $debug['colors_stmt_error'] = $conn->error;
            }

            $debug['colors_processing_loop_start'] = true;
            foreach ($colors_to_insert as $index => $color_data) {
                $color = isset($color_data['color']) ? $color_data['color'] : (isset($color_data['label']) ? $color_data['label'] : '');
                $image_base64 = isset($color_data['image_path']) ? $color_data['image_path'] : 
                              (isset($color_data['image']) ? $color_data['image'] : '');
                
                $debug['color_processing_' . $index] = [
                    'color' => $color,
                    'has_image' => !empty($image_base64),
                    'image_type' => gettype($image_base64),
                    'image_sample' => is_string($image_base64) ? substr($image_base64, 0, 50) . '...' : null
                ];

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

                        $colors_stmt->bind_param('iss', 
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
                        'error' => 'Invalid image data',
                        'image_data' => substr($image_base64, 0, 100) . '...' // Show first 100 chars of image data for debugging
                    ];
                }
            }
            $colors_stmt->close();
        } else {
            $debug['colors_skipped'] = 'No color data to insert';
            $debug['colors_data'] = $colors_to_insert;
        }

        // Create directory for product images if it doesn't exist
        $product_dir = '../uploads/products/' . $product_id;
        if (!file_exists($product_dir)) {
            mkdir($product_dir, 0777, true);
        }
        
        // Create colors directory if it doesn't exist
        $colors_dir = '../uploads/products/' . $product_id . '/colors';
        if (!file_exists($colors_dir)) {
            mkdir($colors_dir, 0777, true);
        }
        
        $response = [
            'status' => 'success',
            'message' => 'Product updated successfully',
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
        debug_log('Failed to execute SQL update', ['error' => $stmt->error]);
        $response = [
            'status' => 'error',
            'message' => 'Failed to update product: ' . $stmt->error
        ];
    }
        mkdir($colors_dir, 0777, true);
    }
    
    $response = [
        'status' => 'success',
        'message' => 'Product updated successfully',
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
    debug_log('Failed to execute SQL update', ['error' => $stmt->error]);
    $response = [
        'status' => 'error',
        'message' => 'Failed to update product: ' . $stmt->error
    ];
}

if (isset($stmt) && $stmt) {
    $stmt->close();
}

} else {
    debug_log('Request method not allowed', ['method' => $_SERVER['REQUEST_METHOD']]);
    $response = [
        'status' => 'error',
        'message' => 'Only POST method is allowed'
    ];
}

$conn->close();
echo json_encode($response);
