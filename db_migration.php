<?php
require 'backend/condb.php';

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Add department column to materials
$sql1 = "ALTER TABLE materials ADD COLUMN IF NOT EXISTS department VARCHAR(50) DEFAULT 'design' AFTER note";
if ($conn->query($sql1) === TRUE) {
    echo "Column 'department' added to materials table successfully\n";
} else {
    echo "Error adding column to materials: " . $conn->error . "\n";
}

// Add department column to material_requests
$sql2 = "ALTER TABLE material_requests ADD COLUMN IF NOT EXISTS department VARCHAR(50) DEFAULT 'design' AFTER status";
if ($conn->query($sql2) === TRUE) {
    echo "Column 'department' added to material_requests table successfully\n";
} else {
    echo "Error adding column to material_requests: " . $conn->error . "\n";
}

$conn->close();
?>