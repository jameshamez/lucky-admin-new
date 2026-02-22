// Shared Employee Data Store
// Single Source of Truth for employee data across HR module

export type EmployeeRole = "Sale" | "Admin" | "General";
export type EmployeeStatus = "ACTIVE" | "RESIGNED";

export type Employee = {
  id: string;
  fullName: string;
  nickname: string;
  position: string;
  role: EmployeeRole;
  status: EmployeeStatus;
};

// Default position options (can be extended)
export const defaultPositions: string[] = [
  "Sales Executive",
  "Sales Manager",
  "Admin Officer",
  "HR Officer",
  "Graphic Designer",
  "Production Staff",
  "Procurement Officer",
  "Accountant",
  "Messenger",
  "Manager",
];

// Central mock data — used as fallback only, Supabase is primary source
export const defaultEmployees: Employee[] = [
  { id: "EMP-001", fullName: "คุณสมชาย ใจดี", nickname: "ชาย", position: "Sales Manager", role: "Sale", status: "ACTIVE" },
  { id: "EMP-002", fullName: "คุณสมหญิง รวยเงิน", nickname: "หญิง", position: "Sales Executive", role: "Sale", status: "ACTIVE" },
  { id: "EMP-003", fullName: "คุณวิชัย ขยัน", nickname: "วิชัย", position: "Sales Executive", role: "Sale", status: "ACTIVE" },
  { id: "EMP-004", fullName: "คุณสมศักดิ์ ทำงาน", nickname: "ศักดิ์", position: "Sales Executive", role: "Sale", status: "ACTIVE" },
  { id: "EMP-005", fullName: "คุณสุดา ดี", nickname: "สุดา", position: "Admin Officer", role: "Admin", status: "ACTIVE" },
  { id: "EMP-006", fullName: "คุณประยุทธ์ เก่ง", nickname: "ยุทธ์", position: "Sales Executive", role: "Sale", status: "ACTIVE" },
  { id: "EMP-007", fullName: "คุณนิภา สวย", nickname: "นิภา", position: "Sales Executive", role: "Sale", status: "ACTIVE" },
  { id: "EMP-008", fullName: "คุณอรุณ แจ่มใส", nickname: "อรุณ", position: "Admin Officer", role: "Admin", status: "ACTIVE" },
  { id: "EMP-009", fullName: "คุณสมปอง ผลิต", nickname: "ปอง", position: "Production Staff", role: "General", status: "ACTIVE" },
];

// Helper functions for filtering
export function getSaleEmployees(employees: Employee[]): Employee[] {
  return employees.filter(e => e.role === "Sale" && e.status === "ACTIVE");
}

export function getAdminEmployees(employees: Employee[]): Employee[] {
  return employees.filter(e => e.role === "Admin" && e.status === "ACTIVE");
}

export function getActiveEmployees(employees: Employee[]): Employee[] {
  return employees.filter(e => e.status === "ACTIVE");
}

export function getResignedEmployees(employees: Employee[]): Employee[] {
  return employees.filter(e => e.status === "RESIGNED");
}
