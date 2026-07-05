<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../../condb.php';
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

// Select specific columns to avoid data overload and ensure correct mapping
// Using LEFT JOIN to get customer info from customers_admin
$sql = "SELECT pe.id, pe.estimate_date, pe.customer_id, pe.job_name, pe.product_type, pe.quantity, pe.budget, pe.status,
               c.company_name, c.contact_name, c.line_id
        FROM price_estimations pe
        LEFT JOIN customers_admin c ON pe.customer_id = c.id
        ORDER BY pe.created_at DESC";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    echo json_encode(["error" => "Database Query Failed: " . $conn->error]);
    exit();
}

$estimations = array();

if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // Determine the display name for the customer
        // Prioritize company_name, then contact_name, then fallback
        $customerName = !empty($row['company_name']) ? $row['company_name'] :
            (!empty($row['contact_name']) ? $row['contact_name'] : 'N/A');

        $estimations[] = array(
            'id' => $row['id'],
            'date' => $row['estimate_date'],
            'customerId' => $row['customer_id'],
            'customerName' => $customerName,
            'lineName' => $row['line_id'] ?? '',
            'jobName' => $row['job_name'],
            'productType' => $row['product_type'],
            'quantity' => (int) $row['quantity'],
            'price' => (float) $row['budget'], // Mapping budget to 'price' for frontend consistency
            'status' => $row['status']
        );
    }
}

echo json_encode($estimations);

$conn->close();
?>