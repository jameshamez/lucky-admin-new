<?php
// 1. Set Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// 2. Handle OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. Connect to Database
// Assuming condb.php is in the root directory, accessible via ../../condb.php from admin/price_estimation/
require '../../condb.php';
$conn->select_db('nacresc1_1');
$conn->set_charset("utf8mb4");

// 4. Get Input Data
$data = json_decode(file_get_contents("php://input"));

if (!$data) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No JSON data received"]);
    exit();
}

// Basic Validation
if (empty($data->customerId)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Customer ID is required"]);
    exit();
}

try {
    // Generate ID if not present
    if (empty($data->id)) {
        $id = bin2hex(random_bytes(18));
        $is_update = false;
    } else {
        $id = $data->id;
        $is_update = true;
    }

    // Prepare arrays for JSON fields
    $selected_colors = json_encode($data->selectedColors ?? []);
    $front_details = json_encode($data->frontDetails ?? []);
    $back_details = json_encode($data->backDetails ?? []);
    $attached_files = json_encode($data->attachedFiles ?? []);
    $product_color = $data->productColor ?? '';
    $product_size = $data->productSize ?? '';
    $product_details_text = $data->productDetails ?? '';

    if ($is_update) {
        // UPDATE
    $sql = "UPDATE price_estimations SET
                customer_id = ?, sales_owner_id = ?, estimate_date = ?, job_name = ?,
                product_category = ?, product_type = ?, quantity = ?, budget = ?, status = ?,
                event_date = ?, material = ?, custom_material = ?, has_design = ?, design_description = ?, estimate_note = ?,
                medal_size = ?, medal_thickness = ?, selected_colors = ?, front_details = ?, back_details = ?,
                lanyard_size = ?, lanyard_patterns = ?, strap_size = ?, strap_pattern_count = ?, sewing_option = ?,
                award_design_details = ?, plaque_option = ?, plaque_text = ?, inscription_plate = ?, inscription_details = ?,
                generic_design_details = ?, width = ?, length = ?, height = ?, thickness = ?, attached_files = ?,
                product_color = ?, product_size = ?, product_details = ?
                WHERE id = ?";

    $stmt = $conn->prepare($sql);
        if (!$stmt)
            throw new Exception("Prepare failed: " . $conn->error);

        // 34 strings, 4 doubles, 3 strings + id = 40 params
        $stmt->bind_param(
            "sssssssssssssssssssssssssssssssddddsssss",
            $data->customerId,
            $data->salesOwnerId,
            $data->estimateDate,
            $data->jobName,
            $data->productCategory,
            $data->productType,
            $data->quantity,
            $data->budget,
            $data->status,
            $data->eventDate,
            $data->material,
            $data->customMaterial,
            $data->hasDesign,
            $data->designDescription,
            $data->estimateNote,
            $data->medalSize,
            $data->medalThickness,
            $selected_colors,
            $front_details,
            $back_details,
            $data->lanyardSize,
            $data->lanyardPatterns,
            $data->strapSize,
            $data->strapPatternCount,
            $data->sewingOption,
            $data->awardDesignDetails,
            $data->plaqueOption,
            $data->plaqueText,
            $data->inscriptionPlate,
            $data->inscriptionDetails,
            $data->genericDesignDetails,
            $data->width,
            $data->length,
            $data->height,
            $data->thickness,
            $attached_files,
            $product_color,
            $product_size,
            $product_details_text,
            $id
        );

    } else {
        // INSERT
        $sql = "INSERT INTO price_estimations (
                id, customer_id, sales_owner_id, estimate_date, job_name,
                product_category, product_type, quantity, budget, status,
                event_date, material, custom_material, has_design, design_description, estimate_note,
                medal_size, medal_thickness, selected_colors, front_details, back_details,
                lanyard_size, lanyard_patterns, strap_size, strap_pattern_count, sewing_option,
                award_design_details, plaque_option, plaque_text, inscription_plate, inscription_details,
                generic_design_details, width, length, height, thickness, attached_files,
                product_color, product_size, product_details
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $stmt = $conn->prepare($sql);
        if (!$stmt)
            throw new Exception("Prepare failed: " . $conn->error);

        // 33 strings, 4 doubles, 3 strings = 40 params
        $stmt->bind_param(
            "ssssssssssssssssssssssssssssssssddddsss",
            $id,
            $data->customerId,
            $data->salesOwnerId,
            $data->estimateDate,
            $data->jobName,
            $data->productCategory,
            $data->productType,
            $data->quantity,
            $data->budget,
            $data->status,
            $data->eventDate,
            $data->material,
            $data->customMaterial,
            $data->hasDesign,
            $data->designDescription,
            $data->estimateNote,
            $data->medalSize,
            $data->medalThickness,
            $selected_colors,
            $front_details,
            $back_details,
            $data->lanyardSize,
            $data->lanyardPatterns,
            $data->strapSize,
            $data->strapPatternCount,
            $data->sewingOption,
            $data->awardDesignDetails,
            $data->plaqueOption,
            $data->plaqueText,
            $data->inscriptionPlate,
            $data->inscriptionDetails,
            $data->genericDesignDetails,
            $data->width,
            $data->length,
            $data->height,
            $data->thickness,
            $attached_files,
            $product_color,
            $product_size,
            $product_details_text
        );
    }

    if ($stmt->execute()) {
        echo json_encode(["status" => "success", "message" => "Saved successfully", "id" => $id]);
    } else {
        throw new Exception("Execute failed: " . $stmt->error);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>