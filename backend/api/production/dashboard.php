<?php
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../../condb.php';
/** @var mysqli $conn */
$conn->select_db('finfinph_lcukycompany');
$conn->set_charset("utf8mb4");

// 1. สรุปยอด (Stats)
$stats = [
    "totalOrders" => 0,
    "nearDueOrders" => 0,
    "completedToday" => 0,
    "pendingVehicleRequests" => 0
];

// งานทั้งหมด (ดึงเฉพาะที่ยังไม่ปิดจบ)
$res = $conn->query("SELECT COUNT(*) as total FROM orders WHERE order_status NOT IN ('จัดส่งแล้ว', 'Cancel')");
if ($res)
    $stats['totalOrders'] = (int) $res->fetch_assoc()['total'];

// งานใกล้ครบกำหนด (สมมติว่าเหลืออีก 3 วัน)
$res = $conn->query("SELECT COUNT(*) as total FROM orders WHERE delivery_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY) AND order_status != 'จัดส่งแล้ว'");
if ($res)
    $stats['nearDueOrders'] = (int) $res->fetch_assoc()['total'];

// งานที่ผลิตเสร็จวันนี้
$res = $conn->query("SELECT SUM(task_count) as total FROM employee_tasks WHERE DATE(task_date) = CURDATE() AND status = 'completed'");
if ($res)
    $stats['completedToday'] = (int) $res->fetch_assoc()['total'] ?: 0;

// สถิติรายวันสำหรับการย้อนหลัง 7 วัน (สำหรับกราฟ)
$dailyTrend = [];
for ($i = 6; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i days"));
    $label = date('D', strtotime($date));
    $res = $conn->query("SELECT SUM(task_count) as total FROM employee_tasks WHERE DATE(task_date) = '$date' AND status = 'completed'");
    $count = $res ? (int) $res->fetch_assoc()['total'] : 0;
    $dailyTrend[] = ["period" => $label, "completed" => $count ?: 0];
}

// 2. งานประจำวันของพนักงาน (Daily Tasks)
$dailyTasks = [];
$res = $conn->query("SELECT t.*, e.full_name as employeeName FROM employee_tasks t LEFT JOIN employees e ON t.employee_id = e.id WHERE DATE(task_date) = CURDATE() ORDER BY task_date DESC");
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $dailyTasks[] = [
            "id" => $row['id'],
            "dateTime" => $row['task_date'],
            "employeeName" => $row['employeeName'],
            "taskDetails" => $row['task_details'],
            "taskCount" => (int) $row['task_count'],
            "taskType" => $row['task_type']
        ];
    }
}

// 3. ออเดอร์ที่กำลังดำเนินการ (Active Orders)
$activeOrders = [];
$res = $conn->query("SELECT * FROM orders WHERE order_status NOT IN ('จัดส่งแล้ว', 'Cancel') ORDER BY created_at DESC LIMIT 10");
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $activeOrders[] = [
            "id" => $row['order_number'] ?: "JOB-" . $row['id'],
            "customerName" => $row['customer_name'],
            "jobName" => $row['job_name'] ?: "งานสั่งผลิต",
            "jobDetails" => $row['details'] ?: "",
            "salesPerson" => $row['sales_owner'] ?: "-",
            "shipping" => $row['delivery_channel'] ?: "N/A",
            "nearDue" => (strtotime($row['delivery_date']) - time() < 259200), // < 3 days
            "urgency" => isset($row['urgency']) ? $row['urgency'] : "ปกติ"
        ];
    }
}

// 4. สถานะการขอใช้รถ (Vehicle Requests)
$vehicleRequests = [];
$res = $conn->query("SELECT * FROM vehicle_reservations WHERE status = 'รออนุมัติ' OR DATE(start_datetime) = CURDATE() ORDER BY start_datetime DESC LIMIT 10");
if ($res) {
    while ($row = $res->fetch_assoc()) {
        $vehicleRequests[] = [
            "id" => $row['id'],
            "requester" => $row['requester'],
            "purpose" => $row['purpose'],
            "vehicle_type" => $row['vehicle_type'],
            "status" => $row['status'],
            "start_datetime" => $row['start_datetime']
        ];
    }
}

// ยอดรออนุมัติรถ
$res = $conn->query("SELECT COUNT(*) as total FROM vehicle_reservations WHERE status = 'รออนุมัติ'");
if ($res)
    $stats['pendingVehicleRequests'] = (int) $res->fetch_assoc()['total'];

echo json_encode([
    "status" => "success",
    "data" => [
        "stats" => $stats,
        "dailyTrend" => $dailyTrend,
        "dailyTasks" => $dailyTasks,
        "activeOrders" => $activeOrders,
        "vehicleRequests" => $vehicleRequests
    ]
]);

$conn->close();
?>