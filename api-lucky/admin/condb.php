<?php
$servername = "localhost";
$username = "nacresc1_1";
$password = "nacresco_1" ;

// Create connection
$conn = new mysqli($servername, $username, $password);

// Check connection
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}
// echo "Connected successfully";
?>