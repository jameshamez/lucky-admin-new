import {
  ShoppingCart,
  Palette,
  Package,
  Factory,
  Calculator,
  Users,
  Crown,
  LogOut
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const departments = [
  {
    id: "sales",
    name: "ฝ่ายขาย",
    icon: ShoppingCart,
    route: "/sales"
  },
  {
    id: "design",
    name: "ฝ่ายกราฟิก",
    icon: Palette,
    // route: "/design"
  },
  {
    id: "procurement",
    name: "ฝ่ายจัดซื้อ",
    icon: Package,
    // route: "/procurement"
  },
  {
    id: "production",
    name: "ฝ่ายผลิตและจัดส่ง",
    icon: Factory,
    // route: "/production"
  },
  {
    id: "accounting",
    name: "ฝ่ายบัญชี",
    icon: Calculator,
    // route: "/accounting"
  },
  {
    id: "hr",
    name: "ฝ่ายบุคคล",
    icon: Users,
    // route: "/hr"
  },
  {
    id: "manager",
    name: "ผู้จัดการ",
    icon: Crown,
    // route: "/manager"
  },
  {
    id: "petty-cash",
    name: "เงินสดย่อย",
    icon: Calculator,
    // route: "/petty-cash"
  }
];

export default function DepartmentSelection() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("user") || "{}");

  const handleDepartmentClick = (route: string) => {
    navigate(route);
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
            return (
              <Card
                key={dept.id}
                className="cursor-pointer border-none shadow-sm hover:shadow-strong transition-all duration-300 hover:-translate-y-1 group bg-white rounded-2xl overflow-hidden"
                onClick={() => handleDepartmentClick(dept.route)}
              >
                <CardContent className="flex flex-col items-center justify-center p-8 h-40 relative">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 group-hover:bg-primary/10 transition-colors mb-4">
                    <IconComponent
                      className="w-8 h-8 text-slate-600 group-hover:text-primary group-hover:scale-110 transition-all duration-300"
                    />
                  </div>
                  <span className="text-sm font-bold text-center text-slate-700 group-hover:text-primary tracking-tight">
                    {dept.name}
                  </span>
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