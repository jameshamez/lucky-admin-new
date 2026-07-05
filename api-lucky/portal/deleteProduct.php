<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include database connection
require '../condb.php';

// Function to recursively delete a directory
function deleteDirectory($dir)
{
    if (!file_exists($dir)) {
        return true;
    }

    if (!is_dir($dir)) {
        return unlink($dir);
    }

    foreach (scandir($dir) as $item) {
        if ($item == '.' || $item == '..') {
            continue;
        }

        if (!deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) {
            return false;
        }
    }

    return rmdir($dir);
}

// Check if the request method is DELETE or POST
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Remove the 'Connected successfully' message from condb.php
    ob_clean();

    // รับข้อมูลจาก request body (JSON)
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);

    // ถ้าไม่มีข้อมูล JSON ให้ลองรับจาก form data (POST)
    if ($json_data === false || $data === null) {
        // รับค่าจาก form data (POST)
        $product_id = isset($_POST['id']) ? $_POST['id'] : null;
    } else {
        // รับค่าจาก JSON
        $product_id = isset($data['id']) ? $data['id'] : null;
    }

    // รับค่าจาก query parameter (สำหรับ DELETE method)
    if (empty($product_id) && isset($_GET['id'])) {
        $product_id = $_GET['id'];
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

    // Select the database
    $conn->select_db('nacresc1_1');

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

    // เริ่มทำ transaction
    $conn->begin_transaction();

    try {
        // ค้นหารูปภาพทั้งหมดของสินค้า
        $find_images_stmt = $conn->prepare("SELECT image_src FROM product_image WHERE product_id = ?");
        $find_images_stmt->bind_param("i", $product_id);
        $find_images_stmt->execute();
        $find_images_result = $find_images_stmt->get_result();

        // ลบข้อมูลรูปภาพออกจากฐานข้อมูล
        $delete_images_stmt = $conn->prepare("DELETE FROM product_image WHERE product_id = ?");
        $delete_images_stmt->bind_param("i", $product_id);
        $delete_images_stmt->execute();

        // ลบข้อมูลสินค้าออกจากฐานข้อมูล
        $delete_product_stmt = $conn->prepare("DELETE FROM product WHERE id = ?");
        $delete_product_stmt->bind_param("i", $product_id);
        $delete_product_stmt->execute();

        // Commit transaction
        $conn->commit();

        // ลบโฟลเดอร์รูปภาพของสินค้า
        $product_folder = "../uploads/products/{$product_id}";
        if (file_exists($product_folder)) {
            deleteDirectory($product_folder);
        }

        $response = [
            'status' => 'success',
            'message' => 'Product deleted successfully',
            'product_id' => $product_id
        ];
    } catch (Exception $e) {
        // Rollback transaction on error
        $conn->rollback();

        $response = [
            'status' => 'error',
            'message' => 'Failed to delete product: ' . $e->getMessage()
        ];
    }

    // Close statements
    $check_stmt->close();
    if (isset($find_images_stmt))
        $find_images_stmt->close();
    if (isset($delete_images_stmt))
        $delete_images_stmt->close();
    if (isset($delete_product_stmt))
        $delete_product_stmt->close();
} else {
    $response = [
        'status' => 'error',
        'message' => 'Only DELETE or POST methods are allowed'
    ];
}

$conn->close();
echo json_encode($response);
?>