<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../condb.php';
/** @var mysqli $conn */

// Database Selection
$db_options = ['finfinph_lcukycompany', 'finfinph_luckycompany'];
foreach ($db_options as $db) {
    if (@$conn->select_db($db))
        break;
}
$conn->set_charset("utf8mb4");

// Initialize users table if not exists
$conn->query("CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    username VARCHAR(50) UNIQUE, 
    password VARCHAR(255), 
    full_name VARCHAR(100), 
    email VARCHAR(100), 
    department VARCHAR(50), 
    role VARCHAR(50), 
    status VARCHAR(20) DEFAULT 'active', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Insert default admin if not exists
$admin_check = $conn->query("SELECT id FROM users WHERE username = 'admin'");
if ($admin_check->num_rows === 0) {
    // Default password 'admin123' (plain for demo, but better hashed in real apps)
    $password = password_hash('admin123', PASSWORD_BCRYPT);
    $conn->query("INSERT INTO users (username, password, full_name, email, department, role) 
                 VALUES ('admin', '$password', 'Admin User', 'admin@thebravo.com', 'IT', 'Admin')");

    // Create a sales user too
    $sales_pass = password_hash('sales123', PASSWORD_BCRYPT);
    $conn->query("INSERT INTO users (username, password, full_name, email, department, role) 
                 VALUES ('sales', '$sales_pass', 'สมชาย ฝ่ายขาย', 'sales@thebravo.com', 'ฝ่ายขาย', 'User')");
}

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : 'login';

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if ($action === 'login') {
        $username = $conn->real_escape_string($data['username'] ?? '');
        $password = $data['password'] ?? '';

        $sql = "SELECT * FROM users WHERE username = '$username' AND status = 'active'";
        $res = $conn->query($sql);

        if ($res->num_rows === 1) {
            $user = $res->fetch_assoc();
            if (password_verify($password, $user['password'])) {
                unset($user['password']); // Don't send password hash back
                echo json_encode(["status" => "success", "user" => $user]);
            } else {
                http_response_code(401);
                echo json_encode(["status" => "error", "message" => "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง"]);
            }
        } else {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง"]);
        }
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
$conn->close();
