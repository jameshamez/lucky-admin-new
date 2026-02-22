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

export const mockTransactions: CommissionTransaction[] = [
  // 2025-01
  { id: "t1", month: "2025-01", employeeId: "EMP-001", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-RM-001", jobName: "ถ้วยพลาสติกไทย 100 ชิ้น", type: "ReadyMade", productCategory: "ถ้วยรางวัล พลาสติก ไทย", quantity: 100, totalSales: 15000, commission: 300, rateInfo: "3 บาท/ชิ้น", status: "COMPLETED" },
  { id: "t2", month: "2025-01", employeeId: "EMP-001", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-MTO-001", jobName: "โล่อะคริลิค 30 ชิ้น", type: "MadeToOrder", productCategory: "โล่สั่งผลิต (อะคริลิค/ไม้/คริสตัล/เรซิ่น/เหรียญอะคริลิค)", quantity: 30, totalSales: 120000, commission: 100, rateInfo: "Tier 11-50", status: "COMPLETED" },
  { id: "t3", month: "2025-01", employeeId: "EMP-001", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-RM-002", jobName: "อะไหล่ถ้วยรางวัล", type: "ReadyMade", productCategory: "อะไหล่ชิ้นส่วนถ้วยรางวัล", quantity: 1, totalSales: 38000, commission: 1900, rateInfo: "5% ยอดขาย", status: "COMPLETED" },
  { id: "t4", month: "2025-01", employeeId: "EMP-002", employeeName: "คุณสมหญิง รวยเงิน", poNumber: "PO-MTO-002", jobName: "เหรียญรางวัลกีฬา 5000 ชิ้น", type: "MadeToOrder", productCategory: "เหรียญรางวัล (สั่งผลิต)", quantity: 5000, totalSales: 85000, commission: 250, rateInfo: "Tier 1-10k", status: "COMPLETED" },
  { id: "t5", month: "2025-01", employeeId: "EMP-002", employeeName: "คุณสมหญิง รวยเงิน", poNumber: "PO-RM-003", jobName: "ถ้วยโลหะ L/XL 20 ชิ้น", type: "ReadyMade", productCategory: "ถ้วยรางวัล โลหะ (L/XL)", quantity: 20, totalSales: 80000, commission: 600, rateInfo: "30 บาท/ชิ้น", status: "COMPLETED" },
  { id: "t6", month: "2025-01", employeeId: "EMP-003", employeeName: "คุณวิชัย ขยัน", poNumber: "PO-MTO-003", jobName: "เสื้อวิ่ง 2500 ตัว", type: "MadeToOrder", productCategory: "เสื้อ", quantity: 2500, totalSales: 450000, commission: 200, rateInfo: "Tier 1k-3k", status: "COMPLETED" },
  { id: "t7", month: "2025-01", employeeId: "EMP-003", employeeName: "คุณวิชัย ขยัน", poNumber: "PO-RM-004", jobName: "ระบบวิ่ง 200 คน", type: "ReadyMade", productCategory: "ระบบวิ่ง", quantity: 200, totalSales: 35000, commission: 200, rateInfo: "1 บาท/คน", status: "COMPLETED" },
  { id: "t8", month: "2025-01", employeeId: "EMP-004", employeeName: "คุณสมศักดิ์ ทำงาน", poNumber: "PO-MTO-004", jobName: "ออแกไนท์กีฬาสี", type: "MadeToOrder", productCategory: "ออแกไนท์", quantity: 1, totalSales: 95000, commission: 5000, rateInfo: "Fixed Job", status: "COMPLETED" },
  { id: "t9", month: "2025-01", employeeId: "EMP-004", employeeName: "คุณสมศักดิ์ ทำงาน", poNumber: "PO-RM-005", jobName: "เหรียญมาตรฐาน 500 ชิ้น", type: "ReadyMade", productCategory: "เหรียญรางวัล (มาตรฐาน)", quantity: 500, totalSales: 12500, commission: 250, rateInfo: "0.5 บาท/ชิ้น", status: "COMPLETED" },
  { id: "t10", month: "2025-01", employeeId: "EMP-006", employeeName: "คุณประยุทธ์ เก่ง", poNumber: "PO-MTO-005", jobName: "โล่คริสตัล 200 ชิ้น", type: "MadeToOrder", productCategory: "โล่สั่งผลิต (อะคริลิค/ไม้/คริสตัล/เรซิ่น/เหรียญอะคริลิค)", quantity: 200, totalSales: 300000, commission: 300, rateInfo: "Tier 101-300", status: "COMPLETED" },
  { id: "t11", month: "2025-01", employeeId: "EMP-007", employeeName: "คุณนิภา สวย", poNumber: "PO-RM-006", jobName: "ถ้วยพลาสติกจีน 200 ชิ้น", type: "ReadyMade", productCategory: "ถ้วยรางวัล พลาสติก จีน", quantity: 200, totalSales: 100000, commission: 1000, rateInfo: "5 บาท/ชิ้น", status: "COMPLETED" },
  // 2025-02
  { id: "t12", month: "2025-02", employeeId: "EMP-001", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-RM-010", jobName: "ถ้วยพลาสติกจีน 80 ชิ้น", type: "ReadyMade", productCategory: "ถ้วยรางวัล พลาสติก จีน", quantity: 80, totalSales: 40000, commission: 400, rateInfo: "5 บาท/ชิ้น", status: "COMPLETED" },
  { id: "t13", month: "2025-02", employeeId: "EMP-001", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-MTO-010", jobName: "เหรียญสั่งผลิต 12000 ชิ้น", type: "MadeToOrder", productCategory: "เหรียญรางวัล (สั่งผลิต)", quantity: 12000, totalSales: 180000, commission: 500, rateInfo: "Tier 10k+", status: "COMPLETED" },
  { id: "t14", month: "2025-02", employeeId: "EMP-002", employeeName: "คุณสมหญิง รวยเงิน", poNumber: "PO-RM-011", jobName: "ถ้วยพิวเตอร์ 15 ชิ้น", type: "ReadyMade", productCategory: "ถ้วยรางวัล พิวเตอร์/เบญจรงค์", quantity: 15, totalSales: 75000, commission: 450, rateInfo: "30 บาท/ชิ้น", status: "COMPLETED" },
  { id: "t15", month: "2025-02", employeeId: "EMP-003", employeeName: "คุณวิชัย ขยัน", poNumber: "PO-MTO-011", jobName: "เสื้อ 4000 ตัว", type: "MadeToOrder", productCategory: "เสื้อ", quantity: 4000, totalSales: 720000, commission: 500, rateInfo: "Tier 3k+", status: "COMPLETED" },
  { id: "t16", month: "2025-02", employeeId: "EMP-004", employeeName: "คุณสมศักดิ์ ทำงาน", poNumber: "PO-MTO-012", jobName: "ออแกไนท์งานวิ่ง", type: "MadeToOrder", productCategory: "ออแกไนท์", quantity: 1, totalSales: 150000, commission: 5000, rateInfo: "Fixed Job", status: "COMPLETED" },
  { id: "t17", month: "2025-02", employeeId: "EMP-006", employeeName: "คุณประยุทธ์ เก่ง", poNumber: "PO-RM-012", jobName: "โล่มาตรฐาน 100 ชิ้น", type: "ReadyMade", productCategory: "โล่รางวัล (มาตรฐาน)", quantity: 100, totalSales: 45000, commission: 300, rateInfo: "3 บาท/ชิ้น", status: "COMPLETED" },
  { id: "t18", month: "2025-02", employeeId: "EMP-007", employeeName: "คุณนิภา สวย", poNumber: "PO-MTO-013", jobName: "เหรียญสั่งผลิต 3000 ชิ้น", type: "MadeToOrder", productCategory: "เหรียญรางวัล (สั่งผลิต)", quantity: 3000, totalSales: 60000, commission: 250, rateInfo: "Tier 1-10k", status: "COMPLETED" },
  // 2024-12
  { id: "t19", month: "2024-12", employeeId: "EMP-001", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-RM-090", jobName: "ถ้วยพลาสติกไทย 300 ชิ้น", type: "ReadyMade", productCategory: "ถ้วยรางวัล พลาสติก ไทย", quantity: 300, totalSales: 45000, commission: 900, rateInfo: "3 บาท/ชิ้น", status: "COMPLETED" },
  { id: "t20", month: "2024-12", employeeId: "EMP-002", employeeName: "คุณสมหญิง รวยเงิน", poNumber: "PO-MTO-090", jobName: "โล่อะคริลิค 500 ชิ้น", type: "MadeToOrder", productCategory: "โล่สั่งผลิต (อะคริลิค/ไม้/คริสตัล/เรซิ่น/เหรียญอะคริลิค)", quantity: 500, totalSales: 750000, commission: 500, rateInfo: "Tier 301+", status: "COMPLETED" },
  { id: "t21", month: "2024-12", employeeId: "EMP-003", employeeName: "คุณวิชัย ขยัน", poNumber: "PO-RM-091", jobName: "ระบบวิ่ง 500 คน", type: "ReadyMade", productCategory: "ระบบวิ่ง", quantity: 500, totalSales: 85000, commission: 500, rateInfo: "1 บาท/คน", status: "COMPLETED" },
  { id: "t22", month: "2024-12", employeeId: "EMP-004", employeeName: "คุณสมศักดิ์ ทำงาน", poNumber: "PO-MTO-091", jobName: "เสื้อวิ่ง 5000 ตัว", type: "MadeToOrder", productCategory: "เสื้อ", quantity: 5000, totalSales: 900000, commission: 500, rateInfo: "Tier 3k+", status: "COMPLETED" },
  { id: "t23", month: "2024-12", employeeId: "EMP-006", employeeName: "คุณประยุทธ์ เก่ง", poNumber: "PO-RM-092", jobName: "ถ้วยโลหะ S/M 50 ชิ้น", type: "ReadyMade", productCategory: "ถ้วยรางวัล โลหะ (S/M)", quantity: 50, totalSales: 35000, commission: 500, rateInfo: "10 บาท/ชิ้น", status: "COMPLETED" },
  { id: "t24", month: "2024-12", employeeId: "EMP-007", employeeName: "คุณนิภา สวย", poNumber: "PO-MTO-092", jobName: "ออแกไนท์งาน Year End", type: "MadeToOrder", productCategory: "ออแกไนท์", quantity: 1, totalSales: 200000, commission: 5000, rateInfo: "Fixed Job", status: "COMPLETED" },
  // 2024-11
  { id: "t25", month: "2024-11", employeeId: "EMP-001", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-RM-080", jobName: "ถ้วยพลาสติกจีน 150 ชิ้น", type: "ReadyMade", productCategory: "ถ้วยรางวัล พลาสติก จีน", quantity: 150, totalSales: 75000, commission: 750, rateInfo: "5 บาท/ชิ้น", status: "COMPLETED" },
  { id: "t26", month: "2024-11", employeeId: "EMP-002", employeeName: "คุณสมหญิง รวยเงิน", poNumber: "PO-MTO-080", jobName: "เหรียญสั่งผลิต 8000 ชิ้น", type: "MadeToOrder", productCategory: "เหรียญรางวัล (สั่งผลิต)", quantity: 8000, totalSales: 120000, commission: 250, rateInfo: "Tier 1-10k", status: "COMPLETED" },
  { id: "t27", month: "2024-11", employeeId: "EMP-003", employeeName: "คุณวิชัย ขยัน", poNumber: "PO-MTO-081", jobName: "โล่ไม้สัก 60 ชิ้น", type: "MadeToOrder", productCategory: "โล่สั่งผลิต (อะคริลิค/ไม้/คริสตัล/เรซิ่น/เหรียญอะคริลิค)", quantity: 60, totalSales: 180000, commission: 200, rateInfo: "Tier 51-100", status: "COMPLETED" },
  { id: "t28", month: "2024-11", employeeId: "EMP-004", employeeName: "คุณสมศักดิ์ ทำงาน", poNumber: "PO-RM-081", jobName: "อะไหล่ถ้วย", type: "ReadyMade", productCategory: "อะไหล่ชิ้นส่วนถ้วยรางวัล", quantity: 1, totalSales: 25000, commission: 1250, rateInfo: "5% ยอดขาย", status: "COMPLETED" },
  { id: "t29", month: "2024-11", employeeId: "EMP-006", employeeName: "คุณประยุทธ์ เก่ง", poNumber: "PO-MTO-082", jobName: "เสื้อกีฬา 1200 ตัว", type: "MadeToOrder", productCategory: "เสื้อ", quantity: 1200, totalSales: 240000, commission: 200, rateInfo: "Tier 1-1k", status: "COMPLETED" },
  { id: "t30", month: "2024-11", employeeId: "EMP-007", employeeName: "คุณนิภา สวย", poNumber: "PO-RM-082", jobName: "เหรียญมาตรฐาน 1000 ชิ้น", type: "ReadyMade", productCategory: "เหรียญรางวัล (มาตรฐาน)", quantity: 1000, totalSales: 25000, commission: 500, rateInfo: "0.5 บาท/ชิ้น", status: "COMPLETED" },
  // 2024-10
  { id: "t31", month: "2024-10", employeeId: "EMP-001", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-MTO-070", jobName: "โล่คริสตัล VIP 400 ชิ้น", type: "MadeToOrder", productCategory: "โล่สั่งผลิต (อะคริลิค/ไม้/คริสตัล/เรซิ่น/เหรียญอะคริลิค)", quantity: 400, totalSales: 600000, commission: 500, rateInfo: "Tier 301+", status: "COMPLETED" },
  { id: "t32", month: "2024-10", employeeId: "EMP-002", employeeName: "คุณสมหญิง รวยเงิน", poNumber: "PO-RM-070", jobName: "ถ้วยพลาสติกไทย 250 ชิ้น", type: "ReadyMade", productCategory: "ถ้วยรางวัล พลาสติก ไทย", quantity: 250, totalSales: 37500, commission: 750, rateInfo: "3 บาท/ชิ้น", status: "COMPLETED" },
  { id: "t33", month: "2024-10", employeeId: "EMP-003", employeeName: "คุณวิชัย ขยัน", poNumber: "PO-MTO-071", jobName: "ออแกไนท์งานกีฬา", type: "MadeToOrder", productCategory: "ออแกไนท์", quantity: 1, totalSales: 180000, commission: 5000, rateInfo: "Fixed Job", status: "COMPLETED" },
  { id: "t34", month: "2024-10", employeeId: "EMP-004", employeeName: "คุณสมศักดิ์ ทำงาน", poNumber: "PO-RM-071", jobName: "ระบบวิ่ง 350 คน", type: "ReadyMade", productCategory: "ระบบวิ่ง", quantity: 350, totalSales: 60000, commission: 350, rateInfo: "1 บาท/คน", status: "COMPLETED" },
  { id: "t35", month: "2024-10", employeeId: "EMP-006", employeeName: "คุณประยุทธ์ เก่ง", poNumber: "PO-MTO-072", jobName: "เสื้อ 800 ตัว", type: "MadeToOrder", productCategory: "เสื้อ", quantity: 800, totalSales: 160000, commission: 100, rateInfo: "Tier 1-1k", status: "COMPLETED" },
  { id: "t36", month: "2024-10", employeeId: "EMP-007", employeeName: "คุณนิภา สวย", poNumber: "PO-RM-072", jobName: "โล่มาตรฐาน 60 ชิ้น", type: "ReadyMade", productCategory: "โล่รางวัล (มาตรฐาน)", quantity: 60, totalSales: 27000, commission: 180, rateInfo: "3 บาท/ชิ้น", status: "COMPLETED" },
  // 2024-09
  { id: "t37", month: "2024-09", employeeId: "EMP-001", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-RM-060", jobName: "ถ้วยพิวเตอร์ 10 ชิ้น", type: "ReadyMade", productCategory: "ถ้วยรางวัล พิวเตอร์/เบญจรงค์", quantity: 10, totalSales: 50000, commission: 300, rateInfo: "30 บาท/ชิ้น", status: "COMPLETED" },
  { id: "t38", month: "2024-09", employeeId: "EMP-002", employeeName: "คุณสมหญิง รวยเงิน", poNumber: "PO-MTO-060", jobName: "เหรียญสั่งผลิต 15000 ชิ้น", type: "MadeToOrder", productCategory: "เหรียญรางวัล (สั่งผลิต)", quantity: 15000, totalSales: 225000, commission: 500, rateInfo: "Tier 10k+", status: "COMPLETED" },
  { id: "t39", month: "2024-09", employeeId: "EMP-003", employeeName: "คุณวิชัย ขยัน", poNumber: "PO-RM-061", jobName: "ถ้วยโลหะ S/M 80 ชิ้น", type: "ReadyMade", productCategory: "ถ้วยรางวัล โลหะ (S/M)", quantity: 80, totalSales: 56000, commission: 800, rateInfo: "10 บาท/ชิ้น", status: "COMPLETED" },
  { id: "t40", month: "2024-09", employeeId: "EMP-004", employeeName: "คุณสมศักดิ์ ทำงาน", poNumber: "PO-MTO-061", jobName: "โล่เรซิ่น 25 ชิ้น", type: "MadeToOrder", productCategory: "โล่สั่งผลิต (อะคริลิค/ไม้/คริสตัล/เรซิ่น/เหรียญอะคริลิค)", quantity: 25, totalSales: 87500, commission: 100, rateInfo: "Tier 11-50", status: "COMPLETED" },
  // PENDING entries
  { id: "t41", month: "2026-02", employeeId: "EMP-001", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-RM-100", jobName: "ถ้วยพลาสติกไทย 150 ชิ้น", type: "ReadyMade", productCategory: "ถ้วยรางวัล พลาสติก ไทย", quantity: 150, totalSales: 22500, commission: 450, rateInfo: "3 บาท/ชิ้น", status: "PENDING" },
  { id: "t42", month: "2026-02", employeeId: "EMP-003", employeeName: "คุณวิชัย ขยัน", poNumber: "PO-MTO-100", jobName: "เสื้อวิ่ง 2000 ตัว", type: "MadeToOrder", productCategory: "เสื้อ", quantity: 2000, totalSales: 380000, commission: 200, rateInfo: "Tier 1k-3k", status: "PENDING" },
  { id: "t43", month: "2026-02", employeeId: "EMP-006", employeeName: "คุณประยุทธ์ เก่ง", poNumber: "PO-MTO-101", jobName: "ออแกไนท์งานวิ่ง", type: "MadeToOrder", productCategory: "ออแกไนท์", quantity: 1, totalSales: 95000, commission: 5000, rateInfo: "Fixed Job", status: "PENDING" },
];

// Sales targets mock data (per employee per month)
export type SalesTarget = {
  employeeId: string;
  employeeName: string;
  role: "Sale" | "Admin";
  month: string;
  target: number;
};

export const mockSalesTargets: SalesTarget[] = [
  // Jan 2025
  { employeeId: "EMP-001", employeeName: "คุณสมชาย ใจดี", role: "Sale", month: "2025-01", target: 200000 },
  { employeeId: "EMP-002", employeeName: "คุณสมหญิง รวยเงิน", role: "Sale", month: "2025-01", target: 180000 },
  { employeeId: "EMP-003", employeeName: "คุณวิชัย ขยัน", role: "Sale", month: "2025-01", target: 250000 },
  { employeeId: "EMP-004", employeeName: "คุณสมศักดิ์ ทำงาน", role: "Sale", month: "2025-01", target: 150000 },
  { employeeId: "EMP-006", employeeName: "คุณประยุทธ์ เก่ง", role: "Sale", month: "2025-01", target: 180000 },
  { employeeId: "EMP-007", employeeName: "คุณนิภา สวย", role: "Sale", month: "2025-01", target: 150000 },
  // Feb 2025
  { employeeId: "EMP-001", employeeName: "คุณสมชาย ใจดี", role: "Sale", month: "2025-02", target: 220000 },
  { employeeId: "EMP-002", employeeName: "คุณสมหญิง รวยเงิน", role: "Sale", month: "2025-02", target: 180000 },
  { employeeId: "EMP-003", employeeName: "คุณวิชัย ขยัน", role: "Sale", month: "2025-02", target: 280000 },
  { employeeId: "EMP-004", employeeName: "คุณสมศักดิ์ ทำงาน", role: "Sale", month: "2025-02", target: 160000 },
  { employeeId: "EMP-006", employeeName: "คุณประยุทธ์ เก่ง", role: "Sale", month: "2025-02", target: 180000 },
  { employeeId: "EMP-007", employeeName: "คุณนิภา สวย", role: "Sale", month: "2025-02", target: 150000 },
  // Admin targets (company total)
  { employeeId: "EMP-005", employeeName: "คุณสุดา ดี", role: "Admin", month: "2025-01", target: 2500000 },
  { employeeId: "EMP-008", employeeName: "คุณอรุณ แจ่มใส", role: "Admin", month: "2025-01", target: 2500000 },
  { employeeId: "EMP-005", employeeName: "คุณสุดา ดี", role: "Admin", month: "2025-02", target: 2500000 },
  { employeeId: "EMP-008", employeeName: "คุณอรุณ แจ่มใส", role: "Admin", month: "2025-02", target: 2500000 },
];

// Employee movement mock
export type EmployeeMovement = {
  id: string;
  name: string;
  position: string;
  type: "NEW" | "RESIGNED";
  date: string; // "YYYY-MM-DD"
  month: string; // "YYYY-MM"
};

export const mockEmployeeMovements: EmployeeMovement[] = [
  { id: "EMP-007", name: "คุณนิภา สวย", position: "Sales Executive", type: "NEW", date: "2025-01-15", month: "2025-01" },
  { id: "EMP-010", name: "คุณสุรชัย พัฒนา", position: "Graphic Designer", type: "RESIGNED", date: "2025-01-31", month: "2025-01" },
  { id: "EMP-011", name: "คุณพรรณี ใส", position: "Admin Officer", type: "NEW", date: "2025-02-01", month: "2025-02" },
  { id: "EMP-012", name: "คุณธีรศักดิ์ ลาออก", position: "Production Staff", type: "RESIGNED", date: "2024-12-31", month: "2024-12" },
  { id: "EMP-009", name: "คุณสมปอง ผลิต", position: "Production Staff", type: "NEW", date: "2024-11-01", month: "2024-11" },
];

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
