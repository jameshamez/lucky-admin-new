<?php
require '../condb.php';
// Do not select other db
$res = $conn->query('SELECT id, order_date, total_amount, total_price FROM orders ORDER BY id DESC LIMIT 5');
if ($res) {
    while ($row = $res->fetch_assoc())
        echo json_encode($row) . "\n";
} else {
    echo "Query failed: " . $conn->error;
}
?>