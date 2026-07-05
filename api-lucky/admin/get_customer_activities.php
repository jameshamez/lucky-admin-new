<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");

require '../condb.php';
$conn->select_db('nacresc1_1');

$customer_id = $_GET['customer_id'];

if ($customer_id) {
    $sql = "SELECT * FROM customer_admin_activities WHERE customer_id = ? ORDER BY start_datetime DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $customer_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $activities = [];
    while ($row = $result->fetch_assoc()) {
        $activities[] = $row;
    }

    echo json_encode($activities);
} else {
    http_response_code(400);
    echo json_encode(["message" => "Customer ID is required"]);
}
?>