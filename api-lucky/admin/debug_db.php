<?php
require '../condb.php';
/** @var mysqli $conn */

echo "Connection status: " . ($conn->connect_error ? "FAILED: " . $conn->connect_error : "SUCCESS") . "\n";

$db_options = ['nacresc1_1', 'finfinph_luckycompany'];
foreach ($db_options as $db) {
    if ($conn->select_db($db)) {
        echo "Selected database: $db (SUCCESS)\n";

        $res = $conn->query("SHOW TABLES LIKE 'users'");
        if ($res->num_rows > 0) {
            echo "Table 'users' exists in $db.\n";
            $res_count = $conn->query("SELECT COUNT(*) as count FROM users");
            if ($res_count) {
                $row = $res_count->fetch_assoc();
                echo "User count: " . $row['count'] . "\n";

                $res_admin = $conn->query("SELECT username, role, status FROM users");
                while ($u = $res_admin->fetch_assoc()) {
                    echo " - " . $u['username'] . " (" . $u['role'] . ", " . $u['status'] . ")\n";
                }
            }
        } else {
            echo "Table 'users' NOT FOUND in $db.\n";
        }
    } else {
        echo "Failed to select database: $db (" . $conn->error . ")\n";
    }
}
?>