<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);
// Log errors to file
ini_set('log_errors', 1);
ini_set('error_log', '../error_log.txt');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include database connection
require '../condb.php';

// Function to create directory if not exists
function createDirectoryIfNotExists($dir)
{
    if (!file_exists($dir)) {
        mkdir($dir, 0777, true);
    }
}

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Remove any previous output from condb.php
        ob_clean();

        // Log incoming data
        error_log('POST data: ' . print_r($_POST, true));
        error_log('FILES data: ' . print_r($_FILES, true));

        // Get customer information from POST
        $customerInfo = json_decode($_POST['customerInfo'], true);
        error_log('Customer info: ' . print_r($customerInfo, true));
        $cartItems = json_decode($_POST['cartItems'], true);
        error_log('Cart items: ' . print_r($cartItems, true));
        $totalPrice = isset($_POST['totalPrice']) ? floatval($_POST['totalPrice']) : 0;

        if (!$customerInfo || !$cartItems) {
            throw new Exception("ข้อมูลไม่ครบถ้วน");
        }

        // Connect to database
        $conn->select_db('nacresc1_1');

        // Start transaction
        $conn->begin_transaction();

        // 1. Insert customer information
        $customer_query = "INSERT INTO customers (full_name, line_id, phone, email, created_at) 
                         VALUES (?, ?, ?, ?, NOW())";
        error_log('Preparing query: ' . $customer_query);

        $customer_stmt = $conn->prepare($customer_query);
        if ($customer_stmt === false) {
            throw new Exception("Prepare statement failed: (" . $conn->errno . ") " . $conn->error . " - Query: " . $customer_query);
        }

        $customer_stmt->bind_param(
            "ssss",
            $customerInfo['fullName'],
            $customerInfo['lineId'],
            $customerInfo['phone'],
            $customerInfo['email']
        );

        $customer_stmt->execute();
        $customer_id = $conn->insert_id;
        $customer_stmt->close();

        // Insert customer address
        $address_query = "INSERT INTO addresses (customer_id, address_text, is_default) 
                         VALUES (?, ?, TRUE)";
        error_log('Preparing query: ' . $address_query);

        $address_stmt = $conn->prepare($address_query);
        if ($address_stmt === false) {
            throw new Exception("Prepare statement failed: (" . $conn->errno . ") " . $conn->error . " - Query: " . $address_query);
        }

        $address_stmt->bind_param(
            "is",
            $customer_id,
            $customerInfo['address']
        );

        $address_stmt->execute();
        $address_stmt->close();

        // 2. Insert order information
        $needs_tax_invoice = $customerInfo['needTaxInvoice'] ? 1 : 0;

        $order_stmt = $conn->prepare(
            "INSERT INTO orders (customer_id, order_date, usage_date, delivery_method, total_price, status, needs_tax_invoice) 
             VALUES (?, NOW(), ?, ?, ?, 'pending', ?)"
        );

        $order_stmt->bind_param(
            "issdi",
            $customer_id,
            $customerInfo['usageDate'],
            $customerInfo['deliveryMethod'],
            $totalPrice,
            $needs_tax_invoice
        );

        $order_stmt->execute();
        $order_id = $conn->insert_id;
        $order_stmt->close();

        // 3. Insert tax invoice information if needed
        if ($needs_tax_invoice) {
            $invoice_query = "INSERT INTO tax_invoices (customer_id, company_name, tax_id, company_address) 
                             VALUES (?, ?, ?, ?)";
            error_log('Preparing query: ' . $invoice_query);

            $invoice_stmt = $conn->prepare($invoice_query);
            if ($invoice_stmt === false) {
                throw new Exception("Prepare statement failed: (" . $conn->errno . ") " . $conn->error . " - Query: " . $invoice_query);
            }

            $invoice_stmt->bind_param(
                "isss",
                $customer_id,
                $customerInfo['companyName'],
                $customerInfo['taxId'],
                $customerInfo['companyAddress']
            );

            $invoice_stmt->execute();
            $invoice_id = $conn->insert_id;
            $invoice_stmt->close();

            // Update the order with the invoice_id
            $update_order_query = "UPDATE orders SET invoice_id = ? WHERE order_id = ?";
            $update_stmt = $conn->prepare($update_order_query);
            if ($update_stmt === false) {
                throw new Exception("Prepare statement failed: (" . $conn->errno . ") " . $conn->error . " - Query: " . $update_order_query);
            }

            $update_stmt->bind_param("ii", $invoice_id, $order_id);
            $update_stmt->execute();
            $update_stmt->close();
        }

        // 4. Insert order items
        $items_stmt = $conn->prepare(
            "INSERT INTO order_items (order_id, product_id, quantity, price, size, color) 
             VALUES (?, ?, ?, ?, ?, ?)"
        );

        foreach ($cartItems as $item) {
            $size = isset($item['product']['size']) ? $item['product']['size'] : '';
            $color = isset($item['product']['color']) ? $item['product']['color'] : '';

            $items_stmt->bind_param(
                "iiidss",
                $order_id,
                $item['product']['id'],
                $item['quantity'],
                $item['product']['price'],
                $size,
                $color
            );

            $items_stmt->execute();
            $item_id = $conn->insert_id;

            // Insert selected options if any
            if (isset($item['product']['selectedOptions']) && !empty($item['product']['selectedOptions'])) {
                $options_stmt = $conn->prepare(
                    "INSERT INTO order_item_options (item_id, product_option_id, option_name) 
                     VALUES (?, ?, ?)"
                );

                if ($options_stmt === false) {
                    throw new Exception("Prepare statement failed: (" . $conn->errno . ") " . $conn->error);
                }

                foreach ($item['product']['selectedOptions'] as $option_id) {
                    // ถ้าไม่มีชื่อตัวเลือก ให้ใช้ ID แทน
                    $option_name = isset($item['product']['options'][$option_id]['name']) ?
                        $item['product']['options'][$option_id]['name'] :
                        "Option #" . $option_id;

                    $options_stmt->bind_param(
                        "iis",
                        $item_id,
                        $option_id,
                        $option_name
                    );
                    $options_stmt->execute();
                }

                $options_stmt->close();
            }
        }

        $items_stmt->close();

        // 5. Process file attachments
        if (!empty($_FILES)) {
            // Create upload directory for this order
            $upload_dir = "../uploads/orders/{$order_id}/";
            createDirectoryIfNotExists($upload_dir);

            $attachments_stmt = $conn->prepare(
                "INSERT INTO order_attachments (order_id, file_name, file_path, file_size, file_type, upload_date) 
                 VALUES (?, ?, ?, ?, ?, NOW())"
            );

            foreach ($_FILES as $key => $file) {
                if (strpos($key, 'attachment_') === 0 && $file['error'] === 0) {
                    // Get file info
                    $file_name = basename($file['name']);
                    $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
                    $file_size = $file['size'];

                    // Create unique filename to prevent overwriting
                    $unique_file_name = uniqid() . '_' . $file_name;
                    $file_path = $upload_dir . $unique_file_name;

                    // Move the uploaded file
                    if (move_uploaded_file($file['tmp_name'], $file_path)) {
                        // Save file info to database
                        $relative_path = "uploads/orders/{$order_id}/{$unique_file_name}";

                        $attachments_stmt->bind_param(
                            "issis",
                            $order_id,
                            $file_name,
                            $relative_path,
                            $file_size,
                            $file_ext
                        );

                        $attachments_stmt->execute();
                    }
                }
            }

            $attachments_stmt->close();
        }

        // Commit the transaction
        $conn->commit();

        // Create order reference number
        $order_ref = 'ORD-' . str_pad($order_id, 8, '0', STR_PAD_LEFT);

        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'บันทึกคำสั่งซื้อเรียบร้อย',
            'orderId' => $order_id,
            'orderRef' => $order_ref,
            'totalItems' => count($cartItems),
            'totalAttachments' => isset($_FILES) ? count($_FILES) : 0
        ]);

    } catch (Exception $e) {
        // Log detailed error
        error_log('Exception in save_order.php: ' . $e->getMessage());
        error_log('Stack trace: ' . $e->getTraceAsString());

        // Rollback the transaction if there was an error
        if (isset($conn) && $conn->ping()) {
            $conn->rollback();
        }

        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'เกิดข้อผิดพลาด: ' . $e->getMessage()
        ]);
    }

    // Close the database connection
    if (isset($conn) && $conn->ping()) {
        $conn->close();
    }

} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'รองรับเฉพาะ POST method เท่านั้น'
    ]);
}
?>