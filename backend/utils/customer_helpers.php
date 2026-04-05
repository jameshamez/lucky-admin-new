<?php
/**
 * recalculateCustomerStats
 * อัปเดตยอดรวมออเดอร์ มูลค่ารวม และจำนวนครั้งที่ติดต่อในตาราง customers_admin
 */
function recalculateCustomerStats($conn, $customer_id) {
    if (!$customer_id) return false;

    // 1. คำนวณจากตาราง customer_orders
    $order_sql = "SELECT COUNT(*) as total_orders, SUM(amount) as total_value FROM customer_orders WHERE customer_id = ?";
    $stmt = $conn->prepare($order_sql);
    $stmt->bind_param("i", $customer_id);
    $stmt->execute();
    $order_res = $stmt->get_result()->fetch_assoc();
    $total_orders = $order_res['total_orders'] ?? 0;
    $total_value = $order_res['total_value'] ?? 0;

    // 2. คำนวณจากตาราง customer_activities
    $activity_sql = "SELECT COUNT(*) as contact_count, MAX(start_datetime) as last_contact FROM customer_activities WHERE customer_id = ?";
    $stmt = $conn->prepare($activity_sql);
    $stmt->bind_param("i", $customer_id);
    $stmt->execute();
    $activity_res = $stmt->get_result()->fetch_assoc();
    $contact_count = $activity_res['contact_count'] ?? 0;
    $last_contact = $activity_res['last_contact'] ?? null;

    // 3. อัปเดตกลับไปยังตาราง customers_admin
    $update_sql = "UPDATE customers_admin SET 
                    total_orders = ?, 
                    total_value = ?, 
                    contact_count = ?";
    
    $params = [$total_orders, $total_value, $contact_count];
    $types = "idi";

    if ($last_contact) {
        $update_sql .= ", last_contact_date = ?";
        $params[] = date('Y-m-d', strtotime($last_contact));
        $types .= "s";
    }

    $update_sql .= " WHERE id = ?";
    $params[] = $customer_id;
    $types .= "i";

    $update_stmt = $conn->prepare($update_sql);
    $update_stmt->bind_param($types, ...$params);
    return $update_stmt->execute();
}
?>
