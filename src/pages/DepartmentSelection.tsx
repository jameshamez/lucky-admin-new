import {
  ShoppingCart,
  Palette,
  Package,
  Factory,
  Calculator,
  Users,
  Crown,
  LogOut,
  Lock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const departments = [
  {
    id: "sales",
    name: "ฝ่ายขาย",
    icon: ShoppingCart,
    route: "/sales",
    allowedDepartments: ["ฝ่ายขาย"], // เฉพาะฝ่ายขายเท่านั้น (Admin/Manager เข้าได้เสมอ)
  },
  {
    id: "design",
    name: "ฝ่ายกราฟิก",
    icon: Palette,
    route: "/design",
    allowedDepartments: ["ฝ่ายกราฟิก"], // เฉพาะฝ่ายกราฟิกเท่านั้น (Admin/Manager เข้าได้เสมอ)
  },
  {
    id: "procurement",
    name: "ฝ่ายจัดซื้อ",
    icon: Package,
    route: "/procurement",
    allowedDepartments: ["ฝ่ายจัดซื้อ"], // เฉพาะฝ่ายจัดซื้อเท่านั้น (Admin/Manager เข้าได้เสมอ)
  },
  {
    id: "production",
    name: "ฝ่ายผลิตและจัดส่ง",
    icon: Factory,
    route: "/production",
    allowedDepartments: ["ฝ่ายผลิตและจัดส่ง"], // เฉพาะฝ่ายผลิตและจัดส่งเท่านั้น (Admin/Manager เข้าได้เสมอ)
  },
  {
    id: "accounting",
    name: "ฝ่ายบัญชี",
    icon: Calculator,
    route: "/accounting",
    allowedDepartments: ["ฝ่ายบัญชี"], // เฉพาะฝ่ายบัญชีเท่านั้น (Admin/Manager เข้าได้เสมอ)
  },
  {
    id: "hr",
    name: "ฝ่ายบุคคล",
    icon: Users,
    route: "/hr",
    allowedDepartments: ["ฝ่ายบุคคล"], // เฉพาะฝ่ายบุคคลเท่านั้น (Admin/Manager เข้าได้เสมอ)
  },
  {
    id: "manager",
    name: "ผู้จัดการ",
    icon: Crown,
    route: "/manager",
    allowedDepartments: ["ผู้จัดการ"], // เฉพาะผู้จัดการเท่านั้น (Admin/Manager เข้าได้เสมอ)
  },
  {
    id: "petty-cash",
    name: "เงินสดย่อย",
    icon: Calculator,
    route: "/petty-cash",
    allowedDepartments: ["เงินสดย่อย"], // เฉพาะเงินสดย่อยเท่านั้น (Admin/Manager เข้าได้เสมอ)
  },
];

export default function DepartmentSelection() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("user") || "{}");

  // role จาก API เป็น "Admin", "Manager", "User" → เช็คแบบ case-insensitive
  const userRole = (userData.role ?? "").toLowerCase();
  const isAdminOrManager = userRole === "admin" || userRole === "manager";

  /**
   * ตรวจสอบว่า user มีสิทธิ์เข้า department นี้หรือไม่
   * - Admin / Manager → เข้าได้ทุก department
   * - ถ้า department มี allowedDepartments → user ต้องอยู่ใน list นั้น
   * - ถ้า department ไม่มี allowedDepartments → เปิดให้ทุกคน
   * department จาก API เป็นภาษาไทย เช่น "ฝ่ายขาย", "IT"
   */
  const canAccess = (dept: (typeof departments)[number]) => {
    if (isAdminOrManager) return true;
    if (!dept.allowedDepartments) return true;
    return dept.allowedDepartments.includes(userData.department ?? "");
  };

  const handleDepartmentClick = (dept: (typeof departments)[number]) => {
    if (!canAccess(dept)) return;
    if (dept.route) navigate(dept.route);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

      {/* Top Navbar for User Info */}
      <div className="w-full px-8 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">B</div>
          <span className="font-bold text-slate-800 tracking-tight">THE BRAVO ERP</span>
        </div>

        <div className="flex items-center gap-4 bg-white p-1.5 pl-4 rounded-full border border-slate-200 shadow-sm">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-700 leading-none">คุณ{userData.full_name || 'ผู้ใช้งาน'}</span>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase">{userData.role || 'พนักงาน'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
            title="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
        {/* Welcome Section */}
        <div className="text-center mb-10 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            ยินดีต้อนรับกลับมา, <span className="text-primary">{userData.full_name?.split(' ')[0] || 'เพื่อนพนักงาน'}</span>
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            กรุณาเลือกฝ่ายที่ต้องการดำเนินการ
          </p>
        </div>

        {/* Department Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl w-full">
          {departments.map((dept) => {
            const IconComponent = dept.icon;
            const accessible = canAccess(dept);
            return (
              <Card
                key={dept.id}
                onClick={() => handleDepartmentClick(dept)}
                className={[
                  "border-none shadow-sm rounded-2xl overflow-hidden transition-all duration-300",
                  accessible
                    ? "cursor-pointer hover:shadow-strong hover:-translate-y-1 group bg-white"
                    : "cursor-not-allowed bg-slate-100 opacity-60",
                ].join(" ")}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 h-40 relative">
                  {/* Active hover indicator */}
                  {accessible && (
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                      </div>
                    </div>
                  )}

                  {/* Lock badge for restricted departments */}
                  {!accessible && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center">
                        <Lock className="w-3 h-3 text-slate-500" />
                      </div>
                    </div>
                  )}

                  <div
                    className={[
                      "p-4 rounded-2xl mb-4 transition-colors",
                      accessible
                        ? "bg-slate-50 group-hover:bg-primary/10"
                        : "bg-slate-200",
                    ].join(" ")}
                  >
                    <IconComponent
                      className={[
                        "w-8 h-8 transition-all duration-300",
                        accessible
                          ? "text-slate-600 group-hover:text-primary group-hover:scale-110"
                          : "text-slate-400",
                      ].join(" ")}
                    />
                  </div>
                  <span
                    className={[
                      "text-sm font-bold text-center tracking-tight",
                      accessible
                        ? "text-slate-700 group-hover:text-primary"
                        : "text-slate-400",
                    ].join(" ")}
                  >
                    {dept.name}
                  </span>
                  {!accessible && (
                    <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                      ไม่มีสิทธิ์เข้าถึง
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-xs font-semibold text-slate-400 uppercase tracking-widest z-10">
        © 2024 THE BRAVO GROUP - ENTERPRISE RESOURCE PLANNING SYSTEM
      </footer>
    </div>
  );
}