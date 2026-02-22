import { 
  ShoppingCart, 
  Palette, 
  Package, 
  Factory, 
  Calculator, 
  Users, 
  Crown
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
    route: "/design"
  },
  {
    id: "procurement",
    name: "ฝ่ายจัดซื้อ",
    icon: Package,
    route: "/procurement"
  },
  {
    id: "production",
    name: "ฝ่ายผลิตและจัดส่ง",
    icon: Factory,
    route: "/production"
  },
  {
    id: "accounting",
    name: "ฝ่ายบัญชี",
    icon: Calculator,
    route: "/accounting"
  },
  {
    id: "hr",
    name: "ฝ่ายบุคคล",
    icon: Users,
    route: "/hr"
  },
  {
    id: "manager",
    name: "ผู้จัดการ",
    icon: Crown,
    route: "/manager"
  },
  {
    id: "petty-cash",
    name: "เงินสดย่อย",
    icon: Calculator,
    route: "/petty-cash"
  }
];

export default function DepartmentSelection() {
  const navigate = useNavigate();

  const handleDepartmentClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-primary mb-4">THE BRAVO</h1>
          <div className="w-32 h-1 bg-primary mx-auto"></div>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-foreground mb-2">
            ยินดีต้อนรับสู่ระบบบริหารจัดการ THE BRAVO
          </h2>
          <p className="text-lg text-muted-foreground">
            กรุณาเลือกแผนกของคุณเพื่อเข้าสู่ระบบ
          </p>
        </div>

        {/* Department Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl w-full">
          {departments.map((dept) => {
            const IconComponent = dept.icon;
            return (
              <Card 
                key={dept.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-medium hover:border-primary hover:-translate-y-1 group"
                onClick={() => handleDepartmentClick(dept.route)}
              >
                <CardContent className="flex flex-col items-center justify-center p-6 h-32">
                  <IconComponent 
                    className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform duration-200" 
                  />
                  <span className="text-sm font-medium text-center text-foreground">
                    {dept.name}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-muted-foreground">
        © 2024 THE BRAVO - ระบบจัดการองค์กร
      </footer>
    </div>
  );
}