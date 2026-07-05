<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

try {
    // Include database connection
    require '../condb.php';

    if (!$conn) {
        throw new Exception('Database connection failed');
    }

    // Remove the 'Connected successfully' message from condb.php
    ob_clean();

    // Select the database
    if (!$conn->select_db('nacresc1_1')) {
        throw new Exception('Could not select database: ' . $conn->error);
    }

    // Debug connection
    error_log("Debug - Connection type: " . get_class($conn));
    error_log("Debug - Connection status: " . ($conn->ping() ? 'alive' : 'dead'));
    error_log("Debug - Selected database: " . $conn->query("SELECT DATABASE()")->fetch_row()[0]);
} catch (Exception $e) {
    error_log("Database connection error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection error',
        'debug' => $e->getMessage()
    ]);
    exit;
}

// ฟังก์ชันสำหรับดึงข้อมูลรูปภาพของสินค้า
function getProductImages($conn, $product_id)
{
    $images = [];
    $main_image = '';

    $image_stmt = $conn->prepare("SELECT * FROM product_image WHERE product_id = ? ORDER BY sequence ASC");
    $image_stmt->bind_param("i", $product_id);
    $image_stmt->execute();
    $image_result = $image_stmt->get_result();

    if ($image_result->num_rows > 0) {
        while ($image = $image_result->fetch_assoc()) {
            // ตรวจสอบว่าเป็นรูปภาพหลักหรือไม่
            if ($image['is_main'] == 1) {
                $main_image = "/uploads/products/{$product_id}/{$image['image_src']}";
            } else {
                $images[] = "/uploads/products/{$product_id}/{$image['image_src']}";
            }
        }
    }

    return ['main_image' => $main_image, 'additional_images' => $images];
}

// ฟังก์ชันสำหรับดึงข้อมูลหมวดหมู่ของสินค้า
function getCategoryName($conn, $subcategory_id)
{
    if (empty($subcategory_id)) {
        return '';
    }

    $stmt = $conn->prepare("SELECT subcategory_name FROM subcategory_product WHERE id = ?");
    $stmt->bind_param("i", $subcategory_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return $row['subcategory_name'];
    }

    return '';
}

// ฟังก์ชันสำหรับดึงข้อมูลตัวเลือกของสินค้า
function getProductOptions($conn, $product_id)
{
    $options = [];

    try {
        if (!$conn || empty($product_id)) {
            return $options;
        }

        $options_stmt = $conn->prepare("SELECT id, product_id, option_id FROM product_options_select WHERE product_id = ?");

        if (!$options_stmt) {
            return $options;
        }

        $options_stmt->bind_param("s", $product_id);

        if (!$options_stmt->execute()) {
            $options_stmt->close();
            return $options;
        }

        $options_result = $options_stmt->get_result();

        while ($option = $options_result->fetch_assoc()) {
            $options[] = $option;
        }

        $options_stmt->close();

        return $options;

    } catch (Exception $e) {
        return $options;
    }
}

// ฟังก์ชันสำหรับดึงข้อมูลอะไหล่ของสินค้า
function getProductParts($conn, $product_id)
{
    $parts = [];

    if (!$conn || empty($product_id)) {
        return $parts;
    }

    $parts_stmt = $conn->prepare("SELECT id, name, product_id, for_product, color, quantity FROM product_part WHERE product_id = ?");
    $parts_stmt->bind_param("i", $product_id);
    $parts_stmt->execute();
    $parts_result = $parts_stmt->get_result();

    if ($parts_result->num_rows > 0) {
        while ($part = $parts_result->fetch_assoc()) {
            $parts[] = $part;
        }
    }
    $parts_stmt->close();

    return $parts;
}

// ฟังก์ชันสำหรับดึงข้อมูลราคาของสินค้า
function getProductPrices($conn, $product_id)
{
    $prices = [];

    if (!$conn || empty($product_id)) {
        return $prices;
    }

    $prices_stmt = $conn->prepare("SELECT id, product_id, retail_price, wholesale_price, special_price FROM product_prices WHERE product_id = ?");
    $prices_stmt->bind_param("i", $product_id);
    $prices_stmt->execute();
    $prices_result = $prices_stmt->get_result();

    if ($prices_result->num_rows > 0) {
        while ($price = $prices_result->fetch_assoc()) {
            $prices[] = $price;
        }
    }
    $prices_stmt->close();

    return $prices;
}

// ฟังก์ชันสำหรับดึงข้อมูลขนาดของสินค้า
function getProductSizes($conn, $product_id)
{
    $sizes = [];

    if (!$conn || empty($product_id)) {
        return $sizes;
    }

    $sizes_stmt = $conn->prepare("SELECT id, product_id, size, height, width, weight FROM product_size WHERE product_id = ?");
    $sizes_stmt->bind_param("i", $product_id);
    $sizes_stmt->execute();
    $sizes_result = $sizes_stmt->get_result();

    if ($sizes_result->num_rows > 0) {
        while ($size = $sizes_result->fetch_assoc()) {
            $sizes[] = $size;
        }
    }
    $sizes_stmt->close();

    return $sizes;
}

// ฟังก์ชันสำหรับดึงข้อมูลสีของสินค้า
function getProductColors($conn, $product_id)
{
    $colors = [];

    try {
        if (!$conn || empty($product_id)) {
            return $colors;
        }

        $colors_stmt = $conn->prepare("SELECT id, product_id, color, image_path, created_at, updated_at FROM product_colors WHERE product_id = ?");

        if (!$colors_stmt) {
            return $colors;
        }

        $colors_stmt->bind_param("s", $product_id);

        if (!$colors_stmt->execute()) {
            $colors_stmt->close();
            return $colors;
        }

        $colors_result = $colors_stmt->get_result();

        while ($color = $colors_result->fetch_assoc()) {
            $colors[] = $color;
        }

        $colors_stmt->close();

        return $colors;

    } catch (Exception $e) {
        return $colors;
    }
}

// ฟังก์ชันสำหรับดึงข้อมูลระยะเวลาผลิตของสินค้า
function getProductProductionTimes($conn, $product_id)
{
    $production_times = [];

    if (!$conn || empty($product_id)) {
        return $production_times;
    }

    $times_stmt = $conn->prepare("SELECT id, product_id, duration, unit, description, created_at, updated_at FROM product_times WHERE product_id = ?");
    $times_stmt->bind_param("i", $product_id);
    $times_stmt->execute();
    $times_result = $times_stmt->get_result();

    if ($times_result->num_rows > 0) {
        while ($time = $times_result->fetch_assoc()) {
            $production_times[] = $time;
        }
    }
    $times_stmt->close();

    return $production_times;
}

// ฟังก์ชันสำหรับแปลงข้อมูลสินค้าให้อยู่ในรูปแบบที่ต้องการ
function formatProductData($product, $images, $category_name, $conn = null)
{
    $debug = [
        'product_id' => $product['id'] ?? 'not_set',
        'has_connection' => $conn !== null,
        'connection_info' => [
            'conn_type' => $conn ? get_class($conn) : 'null',
            'product_id_exists' => isset($product['id']),
            'product_id_value' => $product['id'] ?? 'not_set'
        ],
        'data_sources' => []
    ];

    // ฟังก์ชันช่วยดึงข้อมูล
    $fetchData = function ($type, $fetchFunc) use ($conn, $product, &$debug) {
        $data = [];
        $debug['data_sources'][$type] = [
            'source' => 'initializing',
            'has_data' => false,
            'error' => null
        ];

        try {
            if ($conn && isset($product['id'])) {
                $debug['data_sources'][$type]['source'] = 'database';
                $debug['data_sources'][$type]['attempt'] = 'Trying to fetch from database';

                $result = $fetchFunc($conn, $product['id']);

                if (isset($result['data'])) {
                    $data = $result['data'];
                    $debug[$type . '_debug'] = $result['debug'];
                    $debug['data_sources'][$type]['has_data'] = !empty($data);
                } else {
                    $data = $result;
                    $debug['data_sources'][$type]['has_data'] = !empty($data);
                }
            } else if (isset($product[$type]) && !empty($product[$type])) {
                $debug['data_sources'][$type]['source'] = 'json';
                $debug['data_sources'][$type]['attempt'] = 'Trying to decode JSON';

                $data = json_decode($product[$type], true) ?: [];
                $debug['data_sources'][$type]['has_data'] = !empty($data);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    $debug['data_sources'][$type]['error'] = 'JSON decode error: ' . json_last_error_msg();
                }
            } else {
                $debug['data_sources'][$type]['source'] = 'empty';
                $debug['data_sources'][$type]['attempt'] = 'No data source available';
            }
        } catch (Exception $e) {
            $debug['data_sources'][$type]['error'] = $e->getMessage();
            $data = [];
        }
        return $data;
    };

    // ดึงข้อมูลทั้งหมด
    $data = [
        'options' => $fetchData('options', 'getProductOptions'),
        'parts' => $fetchData('parts', 'getProductParts'),
        'prices' => $fetchData('prices', 'getProductPrices'),
        'sizes' => $fetchData('sizes', 'getProductSizes'),
        'colors' => $fetchData('colors', 'getProductColors'),
        'production_times' => $fetchData('production_times', 'getProductProductionTimes')
    ];

    // แปลง tags
    $tags = [];
    if (isset($product['tags']) && !empty($product['tags'])) {
        $tags = array_filter(
            array_map('trim', explode(',', $product['tags'])),
            function ($tag) {
                return !empty($tag); }
        );
        $debug['data_sources']['tags'] = 'string_converted';
    }

    return [
        'id' => (string) ($product['id'] ?? ''),
        'name' => $product['name'] ?? '',
        'modelName' => $product['model'] ?? '',
        'description' => $product['body'] ?? '',
        'price' => (float) ($product['price'] ?? 0),
        'category' => $category_name,
        'subcategoryId' => (string) ($product['subcategory_id'] ?? ''),
        'productType' => $product['type_id'] ?? '1',
        'options' => $data['options'] ?? [],
        'parts' => $data['parts'] ?? [],
        'prices' => $data['prices'] ?? [],
        'sizes' => $data['sizes'] ?? [],
        'colors' => $data['colors'] ?? [],
        'image' => $images['main_image'] ?? '',
        'images' => $images['additional_images'] ?? [],
        'productionTimes' => $data['production_times'] ?? [],
        'inventory' => (int) ($product['inventory'] ?? 0),
        'request' => (int) ($product['request'] ?? 0),
        'total_available' => (int) ($product['total_available'] ?? 0),
        'tags' => $tags ?? []
    ];
}

// Check if the request method is GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    // Check if product_id is provided
    if (isset($_GET['product_id'])) {
        // Get product by ID
        $product_id = $_GET['product_id'];

        $stmt = $conn->prepare("SELECT * FROM product WHERE id = ?");
        $stmt->bind_param("i", $product_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $product = $result->fetch_assoc();

            // ดึงข้อมูลรูปภาพ
            $images = getProductImages($conn, $product_id);

            // ดึงข้อมูลหมวดหมู่
            $category_name = getCategoryName($conn, $product['subcategory_id']);

            // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
            $formatted_product = formatProductData($product, $images, $category_name, $conn);

            $response = [
                'status' => 'success',
                'data' => $formatted_product
            ];
        } else {
            $response = [
                'status' => 'error',
                'message' => 'Product not found'
            ];
        }

        $stmt->close();
    } else if (isset($_GET['subcategory_id'])) {
        // Get products by subcategory_id
        $subcategory_id = $_GET['subcategory_id'];

        $stmt = $conn->prepare("SELECT * FROM product WHERE subcategory_id = ?");
        $stmt->bind_param("i", $subcategory_id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows > 0) {
            $products = [];
            $category_name = getCategoryName($conn, $subcategory_id);

            while ($product = $result->fetch_assoc()) {
                // ดึงข้อมูลรูปภาพ
                $images = getProductImages($conn, $product['id']);

                // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
                $products[] = formatProductData($product, $images, $category_name, $conn);

            }

            $response = [
                'status' => 'success',
                'count' => count($products),
                'data' => $products
            ];
        } else {
            $response = [
                'status' => 'error',
                'message' => 'No products found for this subcategory'
            ];
        }

        $stmt->close();
    } else {
        // Get all products
        $result = $conn->query("SELECT * FROM product");

        if ($result->num_rows > 0) {
            $products = [];

            while ($product = $result->fetch_assoc()) {
                // ดึงข้อมูลรูปภาพ
                $images = getProductImages($conn, $product['id']);

                // ดึงข้อมูลหมวดหมู่
                $category_name = getCategoryName($conn, $product['subcategory_id']);

                // แปลงข้อมูลให้อยู่ในรูปแบบที่ต้องการ
                $products[] = formatProductData($product, $images, $category_name, $conn);
            }

            $response = [
                'status' => 'success',
                'count' => count($products),
                'data' => $products
            ];
        } else {
            $response = [
                'status' => 'error',
                'message' => 'No products found'
            ];
        }
    }
} else {
    $response = [
        'status' => 'error',
        'message' => 'Only GET method is allowed'
    ];
}

$conn->close();
echo json_encode($response);
