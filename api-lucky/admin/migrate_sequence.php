<?php
require 'condb.php';
/** @var mysqli $conn */

// Database Selection
$db_options = ['nacresc1_1', 'finfinph_luckycompany'];
foreach ($db_options as $db) {
    if (@$conn->select_db($db))
        break;
}

$tables = ['tasks_test', 'tasks_test2', 'tasks_test3'];

foreach ($tables as $table) {
    echo "Updating table: $table... ";
    $res = $conn->query("SHOW COLUMNS FROM `$table` LIKE 'sequence'");
    if ($res->num_rows == 0) {
        if ($conn->query("ALTER TABLE `$table` ADD `sequence` INT NOT NULL DEFAULT 0 AFTER `note`")) {
            echo "Added 'sequence' column successfully.\n";

            // Initialize sequence based on updated_at
            $conn->query("SET @seq := 0");
            $conn->query("UPDATE `$table` SET sequence = (@seq := @seq + 1) ORDER BY updated_at ASC");
            echo "Initialized sequence for existing records.\n";
        } else {
            echo "Error adding 'sequence' column: " . $conn->error . "\n";
        }
    } else {
        echo "Column 'sequence' already exists.\n";
    }
}

$conn->close();
?>