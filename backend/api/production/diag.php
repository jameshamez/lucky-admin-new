<?php
require '../../condb.php';
$conn->select_db('finfinph_lcukycompany');
$res = $conn->query("DESC orders");
$cols = [];
while ($row = $res->fetch_assoc())
    $cols[] = $row['Field'];
echo json_encode($cols);
?>