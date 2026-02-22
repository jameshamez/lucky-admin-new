import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import AddPriceEstimationBase from "@/pages/sales/AddPriceEstimation";

// Procurement's own price estimation page - reuses the sales form component
// but at a separate URL for procurement department access
export default function ProcurementAddPriceEstimation() {
  return <AddPriceEstimationBase />;
}
