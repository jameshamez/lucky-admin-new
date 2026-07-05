<?php
require '../../condb.php';
$conn->select_db('nacresc1_1');
$res = $conn->query("DESC orders");
$cols = [];
while ($row = $res->fetch_assoc())
    $cols[] = $row['Field'];
echo json_encode($cols);
?>