// Shared types & mock data for HR Reports (Unified Report Center)
import {
  defaultReadyMadeConfigs,
  defaultMadeToOrderConfigs,
  defaultIncentiveTiers,
  calculateReadyMadeCommission,
  calculateMadeToOrderCommission,
  calculateAdminIncentive,
  type IncentiveTier,
} from "@/lib/commissionConfig";
import { type Employee } from "@/lib/employeeData";

export type CommissionTransaction = {
  id: string;
  month: string; // "YYYY-MM"
  employeeId: string;
  employeeName: string;
  poNumber: string;
  jobName: string;
  type: "ReadyMade" | "MadeToOrder";
  productCategory: string;
  quantity: number;
  totalSales: number;
  commission: number;
  rateInfo: string;
  status: "PENDING" | "COMPLETED";
};

// Sales targets mock data (per employee per month)
export type SalesTarget = {
  employeeId: string;
  employeeName: string;
  role: "Sale" | "Admin";
  month: string;
  target: number;
};

// Employee movement mock
export type EmployeeMovement = {
  id: string;
  name: string;
  position: string;
  type: "NEW" | "RESIGNED";
  date: string; // "YYYY-MM-DD"
  month: string; // "YYYY-MM"
};

// Helpers
export const monthLabels: Record<string, string> = {
  "01": "มกราคม", "02": "กุมภาพันธ์", "03": "มีนาคม", "04": "เมษายน",
  "05": "พฤษภาคม", "06": "มิถุนายน", "07": "กรกฎาคม", "08": "สิงหาคม",
  "09": "กันยายน", "10": "ตุลาคม", "11": "พฤศจิกายน", "12": "ธันวาคม",
};

export const formatCurrency = (amount: number) => `฿${amount.toLocaleString()}`;

export function getMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${monthLabels[m]} ${parseInt(y) + 543}`;
}

// Recalculate commission for a transaction
export function recalculateCommission(txn: CommissionTransaction): number {
  if (txn.type === "ReadyMade") {
    const config = defaultReadyMadeConfigs.find(c => c.category === txn.productCategory && c.active);
    if (!config) return 0;
    const result = calculateReadyMadeCommission(config, txn.quantity, txn.totalSales);
    return result.amount;
  } else {
    const config = defaultMadeToOrderConfigs.find(c => c.category === txn.productCategory && c.active);
    if (!config) return 0;
    const result = calculateMadeToOrderCommission(config, txn.quantity);
    return result.amount;
  }
}
