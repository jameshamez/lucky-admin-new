<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include database connection
require '../condb.php';

// Remove the 'Connected successfully' message from condb.php
ob_clean();

// Select the database
$conn->select_db('nacresc1_1');

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

// ฟังก์ชันสำหรับแปลงข้อมูลสินค้าให้อยู่ในรูปแบบที่ต้องการ
function formatProductData($product, $images, $category_name)
{
    return [
        'id' => (string) $product['id'],
        'name' => $product['name'],
        'modelName' => $product['model'],
        'description' => $product['body'],
        'price' => (int) $product['price'],
        'category' => $category_name,
        'subcategoryId' => (string) $product['subcategory_id'],
        'image' => $images['main_image'],
        'images' => $images['additional_images'],
        'size' => $product['size'],
        'width' => (float) $product['width'],
        'height' => (float) $product['height'],
        'weight' => (float) $product['weight'],
        'color' => $product['color'],
        'inventory' => (int) $product['inventory'],
        'request' => (int) $product['request'],
        'total_available' => (int) $product['total_available']
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
            $formatted_product = formatProductData($product, $images, $category_name);

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
                $products[] = formatProductData($product, $images, $category_name);
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
                $products[] = formatProductData($product, $images, $category_name);
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
