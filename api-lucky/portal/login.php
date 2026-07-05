<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Include database connection
require '../condb.php';

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

// Validate required fields
$required_fields = ['email', 'password'];
foreach ($required_fields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => "Missing required field: $field"
        ]);
        exit;
    }
}

try {
    // Select database
    $conn->select_db('nacresc1_1');

    // Prepare and execute the select query
    $stmt = $conn->prepare("SELECT id, username, password FROM customers WHERE username = ?");

    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    // Execute with parameters
    if (!$stmt->bind_param("s", $data['email'])) {
        throw new Exception("Bind param failed: " . $conn->error);
    }

    if (!$stmt->execute()) {
        throw new Exception("Execute failed: " . $stmt->error);
    }

    // Get result
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password'
        ]);
        exit;
    }

    // Verify password
    if (!password_verify($data['password'], $user['password'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password'
        ]);
        exit;
    }

    // Debug cookie information
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'data' => [
            'user_id' => $user['id'],
            'username' => $user['username']
        ],
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error logging in: ' . $e->getMessage(),
        'error' => [
            'conn_error' => $conn->error,
            'stmt_error' => isset($stmt) ? $stmt->error : 'No statement'
        ]
    ]);
}
?>