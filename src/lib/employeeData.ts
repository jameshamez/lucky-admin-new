// Shared Employee Data Store
// Single Source of Truth for employee data across HR module

export type EmployeeRole = "Sale" | "Admin" | "General";
export type EmployeeStatus = "ACTIVE" | "RESIGNED";

export type Employee = {
  id: string;
  fullName: string;
  nickname: string;
  department?: string;
  position: string;
  isSales?: boolean | number;
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

// Helper functions for filtering
export function getSaleEmployees(employees: Employee[]): Employee[] {
  return employees.filter(e =>
    (e.department === "ฝ่ายขาย" || e.isSales === 1 || e.isSales === true) &&
    e.status === "ACTIVE"
  );
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
