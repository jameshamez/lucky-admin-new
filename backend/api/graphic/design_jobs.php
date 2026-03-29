<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require '../../condb.php';
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Connection failed: " . $conn->connect_error]);
    exit();
}

// ─── Auto-create tables ──────────────────────────────────────────────────────

$conn->query("
CREATE TABLE IF NOT EXISTS design_jobs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    job_code        VARCHAR(50) UNIQUE NOT NULL,
    client_name     VARCHAR(200) NOT NULL,
    job_type        VARCHAR(100) NOT NULL,
    description     TEXT,
    urgency         ENUM('เร่งด่วน 3-5 ชั่วโมง','ด่วน 1 วัน','ด่วน 2 วัน','ปกติ') DEFAULT 'ปกติ',
    priority        ENUM('high','medium','low') DEFAULT 'medium',
    designer        VARCHAR(100) DEFAULT NULL,
    ordered_by      VARCHAR(100) DEFAULT NULL,
    quotation_no    VARCHAR(50) DEFAULT NULL,
    status          ENUM(
                        'รอรับงาน','รับงานแล้ว','กำลังดำเนินการ',
                        'รอตรวจสอบ','แก้ไข','ผลิตชิ้นงาน','เสร็จสิ้น'
                    ) DEFAULT 'รอรับงาน',
    progress        TINYINT DEFAULT 0,
    -- Design workflow
    google_drive_link   VARCHAR(500) DEFAULT NULL,
    layout_image        VARCHAR(500) DEFAULT NULL,
    artwork_image       VARCHAR(500) DEFAULT NULL,
    artwork_status      ENUM('draft','pending_review','approved','rejected') DEFAULT 'draft',
    production_artwork  VARCHAR(500) DEFAULT NULL,
    ai_file             VARCHAR(500) DEFAULT NULL,
    -- Notes / specs
    internal_notes  TEXT,
    specs           TEXT,
    feedback        TEXT,
    -- Medal-specific fields (JSON stored as text)
    medal_size      VARCHAR(20) DEFAULT NULL,
    medal_thickness VARCHAR(20) DEFAULT NULL,
    medal_colors    TEXT DEFAULT NULL,
    medal_front_details TEXT DEFAULT NULL,
    medal_back_details  TEXT DEFAULT NULL,
    lanyard_size    VARCHAR(50) DEFAULT NULL,
    lanyard_patterns VARCHAR(100) DEFAULT NULL,
    quantity        INT DEFAULT NULL,
    -- Dates
    order_date      DATE DEFAULT NULL,
    due_date        DATE DEFAULT NULL,
    assigned_at     DATETIME DEFAULT NULL,
    started_at      DATETIME DEFAULT NULL,
    finish_date     DATE DEFAULT NULL,
    -- QC
    revision_rounds TINYINT DEFAULT 0,
    qc_pass         TINYINT(1) DEFAULT NULL,
    -- Timestamps
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");

$conn->query("
CREATE TABLE IF NOT EXISTS design_job_logs (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    job_id      INT NOT NULL,
    changed_by  VARCHAR(100) DEFAULT NULL,
    old_status  VARCHAR(50) DEFAULT NULL,
    new_status  VARCHAR(50) DEFAULT NULL,
    note        TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES design_jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
");

// ─── Parse ID from ?id= or URL path ─────────────────────────────────────────
$id = null;
if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    $id = intval($_GET['id']);
} else {
    $parts = explode('/', trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/'));
    foreach ($parts as $k => $p) {
        if ($p === 'design_jobs.php' && isset($parts[$k + 1]) && is_numeric($parts[$k + 1])) {
            $id = intval($parts[$k + 1]);
        }
    }
}

$method = $_SERVER['REQUEST_METHOD'];

// ─── Helper: decode JSON body ────────────────────────────────────────────────
function getBody()
{
    return json_decode(file_get_contents("php://input"), true);
}

// ─── Helper: log status change ───────────────────────────────────────────────
function logStatus($conn, $job_id, $old_status, $new_status, $changed_by, $note = '')
{
    if ($old_status === $new_status)
        return;
    $stmt = $conn->prepare(
        "INSERT INTO design_job_logs (job_id, changed_by, old_status, new_status, note) VALUES (?,?,?,?,?)"
    );
    $stmt->bind_param("issss", $job_id, $changed_by, $old_status, $new_status, $note);
    $stmt->execute();
}

// ─── GET ─────────────────────────────────────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        // Single job
        $stmt = $conn->prepare("SELECT * FROM design_jobs WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if ($row) {
            // Parse JSON fields
            $row['medal_colors'] = $row['medal_colors'] ? json_decode($row['medal_colors']) : [];
            $row['medal_front_details'] = $row['medal_front_details'] ? json_decode($row['medal_front_details']) : [];
            $row['medal_back_details'] = $row['medal_back_details'] ? json_decode($row['medal_back_details']) : [];
            echo json_encode(["status" => "success", "data" => $row]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Job not found"]);
        }
        exit();
    }

    // --- Auto-sync Missing Sales Orders ---
    // Safely pull any orders that have the "ฝ่ายกราฟฟิก" department but aren't in design_jobs yet
    $sync_sql = "
        INSERT IGNORE INTO design_jobs (job_code, client_name, job_type, urgency, status, ordered_by, due_date, order_date)
        SELECT 
            job_id, 
            COALESCE(NULLIF(customer_name, ''), 'ไม่ระบุชื่อ'), 
            COALESCE(NULLIF(job_name, ''), 'ทั่วไป'), 
            'ปกติ', 
            'รอรับงาน', 
            responsible_person, 
            COALESCE(NULLIF(delivery_date, ''), CURDATE()), 
            COALESCE(NULLIF(order_date, ''), CURDATE())
        FROM orders
        WHERE departments LIKE '%ฝ่ายกราฟฟิก%'
    ";
    if (!$conn->query($sync_sql)) {
        // Just log it or ignore, don't break the whole API
        error_log("Design Sync Error: " . $conn->error);
    }

    // List with filters
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? max(1, intval($_GET['limit'])) : 50;
    $search = isset($_GET['search']) ? trim($_GET['search']) : '';
    $status = isset($_GET['status']) ? trim($_GET['status']) : '';
    $urgency = isset($_GET['urgency']) ? trim($_GET['urgency']) : '';
    $designer = isset($_GET['designer']) ? trim($_GET['designer']) : '';
    $job_type = isset($_GET['job_type']) ? trim($_GET['job_type']) : '';
    $date_from = isset($_GET['date_from']) ? $_GET['date_from'] : '';
    $date_to = isset($_GET['date_to']) ? $_GET['date_to'] : '';

    $offset = ($page - 1) * $limit;
    $where = ["1=1"];
    $params = [];
    $types = '';

    if ($search) {
        $where[] = "(job_code LIKE ? OR client_name LIKE ? OR description LIKE ? OR designer LIKE ?)";
        $s = "%$search%";
        $params = array_merge($params, [$s, $s, $s, $s]);
        $types .= 'ssss';
    }
    if ($status) {
        $where[] = "status = ?";
        $params[] = $status;
        $types .= 's';
    }
    if ($urgency) {
        $where[] = "urgency = ?";
        $params[] = $urgency;
        $types .= 's';
    }
    if ($designer) {
        $where[] = "designer = ?";
        $params[] = $designer;
        $types .= 's';
    }
    if ($job_type) {
        $where[] = "job_type = ?";
        $params[] = $job_type;
        $types .= 's';
    }
    if ($date_from) {
        $where[] = "due_date >= ?";
        $params[] = $date_from;
        $types .= 's';
    }
    if ($date_to) {
        $where[] = "due_date <= ?";
        $params[] = $date_to;
        $types .= 's';
    }

    $where_sql = implode(" AND ", $where);

    // Count
    $count_sql = "SELECT COUNT(*) as total FROM design_jobs WHERE $where_sql";
    if ($params) {
        $cs = $conn->prepare($count_sql);
        if (!$cs) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Prepare count failed: " . $conn->error]);
            exit();
        }
        $cs->bind_param($types, ...$params);
        $cs->execute();
        $total = $cs->get_result()->fetch_assoc()['total'];
    } else {
        $count_res = $conn->query($count_sql);
        if (!$count_res) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Count query failed: " . $conn->error]);
            exit();
        }
        $total = $count_res->fetch_assoc()['total'];
    }

    // Data
    $sql = "SELECT * FROM design_jobs WHERE $where_sql ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;
    $types .= 'ii';

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $jobs = [];
    while ($row = $result->fetch_assoc()) {
        $row['medal_colors'] = $row['medal_colors'] ? json_decode($row['medal_colors']) : [];
        $row['medal_front_details'] = $row['medal_front_details'] ? json_decode($row['medal_front_details']) : [];
        $row['medal_back_details'] = $row['medal_back_details'] ? json_decode($row['medal_back_details']) : [];
        $jobs[] = $row;
    }

    echo json_encode([
        "status" => "success",
        "data" => $jobs,
        "pagination" => [
            "total" => intval($total),
            "page" => $page,
            "limit" => $limit,
            "totalPages" => ceil($total / $limit)
        ]
    ]);
    exit();
}

// ─── POST (Create) ────────────────────────────────────────────────────────────
if ($method === 'POST') {
    $data = getBody();

    if (empty($data['job_code']) || empty($data['client_name']) || empty($data['job_type'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "job_code, client_name, job_type are required"]);
        exit();
    }

    // Check duplicate job_code
    $chk = $conn->prepare("SELECT id FROM design_jobs WHERE job_code = ?");
    $chk->bind_param("s", $data['job_code']);
    $chk->execute();
    if ($chk->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode(["status" => "error", "message" => "Job code already exists"]);
        exit();
    }

    // JSON encode array fields
    $medal_colors = !empty($data['medal_colors']) ? json_encode($data['medal_colors']) : null;
    $medal_front_details = !empty($data['medal_front_details']) ? json_encode($data['medal_front_details']) : null;
    $medal_back_details = !empty($data['medal_back_details']) ? json_encode($data['medal_back_details']) : null;

    $sql = "INSERT INTO design_jobs 
        (job_code, client_name, job_type, description, urgency, priority, designer, ordered_by,
         quotation_no, status, progress, google_drive_link, layout_image, artwork_image,
         artwork_status, production_artwork, ai_file, internal_notes, specs, feedback,
         medal_size, medal_thickness, medal_colors, medal_front_details, medal_back_details,
         lanyard_size, lanyard_patterns, quantity, order_date, due_date, assigned_at,
         started_at, finish_date, revision_rounds, qc_pass)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $conn->error]);
        exit();
    }

    $job_code = $data['job_code'];
    $client_name = $data['client_name'];
    $job_type = $data['job_type'];
    $description = $data['description'] ?? null;
    $urgency = $data['urgency'] ?? 'ปกติ';
    $priority = $data['priority'] ?? 'medium';
    $designer = $data['designer'] ?? null;
    $ordered_by = $data['ordered_by'] ?? null;
    $quotation_no = $data['quotation_no'] ?? null;
    $status = $data['status'] ?? 'รอรับงาน';
    $progress = isset($data['progress']) ? intval($data['progress']) : 0;
    $gdrive = $data['google_drive_link'] ?? null;
    $layout_img = $data['layout_image'] ?? null;
    $artwork_img = $data['artwork_image'] ?? null;
    $artwork_status = $data['artwork_status'] ?? 'draft';
    $prod_artwork = $data['production_artwork'] ?? null;
    $ai_file = $data['ai_file'] ?? null;
    $notes = $data['internal_notes'] ?? null;
    $specs = $data['specs'] ?? null;
    $feedback = $data['feedback'] ?? null;
    $medal_size = $data['medal_size'] ?? null;
    $medal_thickness = $data['medal_thickness'] ?? null;
    $lanyard_size = $data['lanyard_size'] ?? null;
    $lanyard_patterns = $data['lanyard_patterns'] ?? null;
    $quantity = isset($data['quantity']) ? intval($data['quantity']) : null;
    $order_date = $data['order_date'] ?? null;
    $due_date = $data['due_date'] ?? null;
    $assigned_at = $data['assigned_at'] ?? null;
    $started_at = $data['started_at'] ?? null;
    $finish_date = $data['finish_date'] ?? null;
    $revision_rounds = isset($data['revision_rounds']) ? intval($data['revision_rounds']) : 0;
    $qc_pass = isset($data['qc_pass']) ? intval($data['qc_pass']) : null;

    $stmt->bind_param(
        "ssssssssssississsssssssssssssssiisi",
        $job_code,
        $client_name,
        $job_type,
        $description,
        $urgency,
        $priority,
        $designer,
        $ordered_by,
        $quotation_no,
        $status,
        $progress,
        $gdrive,
        $layout_img,
        $artwork_img,
        $artwork_status,
        $prod_artwork,
        $ai_file,
        $notes,
        $specs,
        $feedback,
        $medal_size,
        $medal_thickness,
        $medal_colors,
        $medal_front_details,
        $medal_back_details,
        $lanyard_size,
        $lanyard_patterns,
        $quantity,
        $order_date,
        $due_date,
        $assigned_at,
        $started_at,
        $finish_date,
        $revision_rounds,
        $qc_pass
    );

    if ($stmt->execute()) {
        $new_id = $conn->insert_id;
        // Log initial status
        logStatus($conn, $new_id, null, $status, $ordered_by ?? 'system', 'สร้างงานใหม่');
        http_response_code(201);
        echo json_encode(["status" => "success", "message" => "Job created", "id" => $new_id]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}

// ─── PUT (Update) ─────────────────────────────────────────────────────────────
if ($method === 'PUT') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID required"]);
        exit();
    }

    $data = getBody();

    // Get current job for logging
    $cur = $conn->prepare("SELECT status FROM design_jobs WHERE id = ?");
    $cur->bind_param("i", $id);
    $cur->execute();
    $current = $cur->get_result()->fetch_assoc();
    if (!$current) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Job not found"]);
        exit();
    }
    $old_status = $current['status'];

    // Updatable string fields
    $str_fields = [
        'job_code',
        'client_name',
        'job_type',
        'description',
        'urgency',
        'priority',
        'designer',
        'ordered_by',
        'quotation_no',
        'status',
        'google_drive_link',
        'layout_image',
        'artwork_image',
        'artwork_status',
        'production_artwork',
        'ai_file',
        'internal_notes',
        'specs',
        'feedback',
        'medal_size',
        'medal_thickness',
        'lanyard_size',
        'lanyard_patterns',
        'order_date',
        'due_date',
        'assigned_at',
        'started_at',
        'finish_date'
    ];
    $int_fields = ['progress', 'quantity', 'revision_rounds', 'qc_pass'];
    $json_fields = ['medal_colors', 'medal_front_details', 'medal_back_details'];

    $set = [];
    $params = [];
    $types = '';

    foreach ($str_fields as $f) {
        if (array_key_exists($f, $data)) {
            $set[] = "$f = ?";
            $params[] = $data[$f];
            $types .= 's';
        }
    }
    foreach ($int_fields as $f) {
        if (array_key_exists($f, $data)) {
            $set[] = "$f = ?";
            $params[] = intval($data[$f]);
            $types .= 'i';
        }
    }
    foreach ($json_fields as $f) {
        if (array_key_exists($f, $data)) {
            $set[] = "$f = ?";
            $params[] = is_array($data[$f]) ? json_encode($data[$f]) : $data[$f];
            $types .= 's';
        }
    }

    if (empty($set)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "No fields to update"]);
        exit();
    }

    $params[] = $id;
    $types .= 'i';

    $sql = "UPDATE design_jobs SET " . implode(", ", $set) . " WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        // Log status change if status was updated
        $new_status = $data['status'] ?? $old_status;
        $changed_by = $data['changed_by'] ?? $data['designer'] ?? 'system';
        $log_note = $data['log_note'] ?? '';
        logStatus($conn, $id, $old_status, $new_status, $changed_by, $log_note);

        echo json_encode(["status" => "success", "message" => "Job updated"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "ID required"]);
        exit();
    }

    $stmt = $conn->prepare("DELETE FROM design_jobs WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Job deleted"]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $stmt->error]);
    }
    exit();
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
$conn->close();
?>