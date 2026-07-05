export type DepartmentKey =
  | "sales"
  | "design"
  | "procurement"
  | "production"
  | "accounting"
  | "hr"
  | "manager"
  | "petty-cash";

export interface DepartmentInfo {
  id: DepartmentKey;
  name: string;
  route: string;
  allowedDepartments?: string[];
}

export interface DepartmentAwareUser {
  role?: string | null;
  department?: string | null;
}

// เฉพาะฝ่ายที่ระบุใน allowedDepartments เท่านั้นที่เข้าได้ (Admin/Manager เข้าได้เสมอ)
export const DEPARTMENTS: DepartmentInfo[] = [
  { id: "sales", name: "ฝ่ายขาย", route: "/sales", allowedDepartments: ["ฝ่ายขาย"] },
  { id: "design", name: "ฝ่ายกราฟิก", route: "/design", allowedDepartments: ["ฝ่ายกราฟิก"] },
  { id: "procurement", name: "ฝ่ายจัดซื้อ", route: "/procurement", allowedDepartments: ["ฝ่ายจัดซื้อ"] },
  { id: "production", name: "ฝ่ายผลิตและจัดส่ง", route: "/production", allowedDepartments: ["ฝ่ายผลิตและจัดส่ง"] },
  { id: "accounting", name: "ฝ่ายบัญชี", route: "/accounting", allowedDepartments: ["ฝ่ายบัญชี"] },
  { id: "hr", name: "ฝ่ายบุคคล", route: "/hr", allowedDepartments: ["ฝ่ายบุคคล"] },
  { id: "manager", name: "ผู้จัดการ", route: "/manager", allowedDepartments: ["ผู้จัดการ"] },
  { id: "petty-cash", name: "เงินสดย่อย", route: "/petty-cash", allowedDepartments: ["เงินสดย่อย"] },
];

const DEPARTMENT_BY_KEY: Record<DepartmentKey, DepartmentInfo> = DEPARTMENTS.reduce(
  (acc, dept) => ({ ...acc, [dept.id]: dept }),
  {} as Record<DepartmentKey, DepartmentInfo>
);

// แปลงชื่อแผนกภาษาไทยที่เก็บใน users.department (free text) ให้เป็น DepartmentKey
// ใช้ substring match เพื่อทนต่อความหลากหลายของข้อมูลจริง เช่น "กราฟิก"/"กราฟฟิก"
export function mapThaiDepartmentToKey(department?: string | null): DepartmentKey | null {
  const dept = department || "";
  if (dept.includes("ขาย")) return "sales";
  if (dept.includes("กราฟิก") || dept.includes("กราฟฟิก")) return "design";
  if (dept.includes("จัดซื้อ")) return "procurement";
  if (dept.includes("ผลิต")) return "production";
  if (dept.includes("บัญชี")) return "accounting";
  if (dept.includes("บุคคล")) return "hr";
  if (dept.includes("จัดการ")) return "manager";
  if (dept.includes("เงินสดย่อย")) return "petty-cash";
  return null;
}

function isAdminOrManagerRole(role?: string | null): boolean {
  const r = (role || "").toLowerCase();
  return r === "admin" || r === "manager";
}

// ตรวจสอบว่า user มีสิทธิ์เข้า department นี้หรือไม่
// - Admin / Manager → เข้าได้ทุก department
// - ถ้า department มี allowedDepartments → user ต้องอยู่ใน list นั้น
// - ถ้า department ไม่มี allowedDepartments → เปิดให้ทุกคน
export function canAccessDepartment(
  user: DepartmentAwareUser | null | undefined,
  deptKey: DepartmentKey
): boolean {
  if (isAdminOrManagerRole(user?.role)) return true;
  const dept = DEPARTMENT_BY_KEY[deptKey];
  if (!dept?.allowedDepartments) return true;
  return dept.allowedDepartments.includes(user?.department ?? "");
}

export function isAdminOrManager(user: DepartmentAwareUser | null | undefined): boolean {
  return isAdminOrManagerRole(user?.role);
}
