<?php
/**
 * API for migrating JOB IDs to the format JOB-YYYY-XXXX
 * This script will fill in missing job_ids or re-format them if needed.
 */

require '../condb.php';

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // 1. Get all existing JOB IDs to establish baseline counters for each year
    $year_counters = [];
    $existing_sql = "SELECT job_id FROM orders WHERE job_id LIKE 'JOB-%'";
    $existing_result = $conn->query($existing_sql);

    if ($existing_result) {
        while ($row = $existing_result->fetch_assoc()) {
            if (preg_match('/JOB-(\d{4})-(\d{4})/', $row['job_id'], $matches)) {
                $year = $matches[1];
                $seq = intval($matches[2]);
                if (!isset($year_counters[$year]) || $seq > $year_counters[$year]) {
                    $year_counters[$year] = $seq;
                }
            }
        }
    }

    // 2. Select orders that need a JOB ID (NULL, empty, or not in format)
    // We order by order_id to keep a logical sequence if dates are same
    $sql = "SELECT order_id, order_date, created_at FROM orders 
            WHERE job_id IS NULL 
               OR job_id = '' 
               OR job_id NOT REGEXP '^JOB-[0-9]{4}-[0-9]{4}$'
            ORDER BY order_date ASC, order_id ASC";

    $result = $conn->query($sql);
    if (!$result) {
        throw new Exception("Error fetching orders: " . $conn->error);
    }

    $updated_count = 0;
    $updates = [];
    $errors = [];

    while ($row = $result->fetch_assoc()) {
        $id = $row['order_id'];

        // Determine year from order_date, fallback to created_at, then current year
        $date_str = (!empty($row['order_date']) && $row['order_date'] !== '0000-00-00' && $row['order_date'] !== '0000-00-00 00:00:00')
            ? $row['order_date']
            : $row['created_at'];

        $year = date('Y');
        if (!empty($date_str) && $date_str !== '0000-00-00' && $date_str !== '0000-00-00 00:00:00') {
            $timestamp = strtotime($date_str);
            if ($timestamp !== false) {
                $year = date('Y', $timestamp);
            }
        }

        // Increment counter for this year
        if (!isset($year_counters[$year])) {
            $year_counters[$year] = 0;
        }
        $year_counters[$year]++;

        $new_job_id = 'JOB-' . $year . '-' . str_pad($year_counters[$year], 4, '0', STR_PAD_LEFT);

        // Update record
        $update_sql = "UPDATE orders SET job_id = ? WHERE order_id = ?";
        $stmt = $conn->prepare($update_sql);
        if (!$stmt) {
            $errors[] = "Prepare failed for ID $id: " . $conn->error;
            continue;
        }

        $stmt->bind_param("si", $new_job_id, $id);
        if ($stmt->execute()) {
            $updated_count++;
            $updates[] = ["id" => $id, "new_job_id" => $new_job_id, "date_ref" => $date_str];
        } else {
            // If duplicate (due to unique index), try incrementing again
            if ($conn->errno == 1062) { // Duplicate entry
                $year_counters[$year]++;
                $new_job_id = 'JOB-' . $year . '-' . str_pad($year_counters[$year], 4, '0', STR_PAD_LEFT);
                $stmt->bind_param("si", $new_job_id, $id);
                if ($stmt->execute()) {
                    $updated_count++;
                    $updates[] = ["id" => $id, "new_job_id" => $new_job_id, "date_ref" => $date_str, "retry" => true];
                } else {
                    $errors[] = "Error updating order ID $id (Duplicate retry failed): " . $stmt->error;
                }
            } else {
                $errors[] = "Error updating order ID $id: " . $stmt->error;
            }
        }
        $stmt->close();
    }

    echo json_encode([
        "status" => "success",
        "message" => "Migration completed",
        "total_updated" => $updated_count,
        "processed_years" => array_keys($year_counters),
        "counters" => $year_counters,
        "details" => $updates,
        "errors" => $errors
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}

$conn->close();
