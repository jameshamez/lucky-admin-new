import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Calculator,
  Receipt,
  Users,
  FileCheck,
  TrendingUp,
  Book,
  ArrowRight
} from "lucide-react";

const accountingModules = [
  {
    id: "dashboard",
    title: "แดชบอร์ดฝ่ายบัญชี",
    description: "ภาพรวมข้อมูลทางการเงิน แจ้งเตือนงานด่วน และสรุปสถานะ",
    icon: Calculator,
    path: "/accounting/dashboard",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "revenue-expenses",
    title: "รายรับ-รายจ่าย",
    description: "บันทึกรายรับจากออเดอร์ จัดการค่าใช้จ่าย และคำนวณต้นทุน",
    icon: Receipt,
    path: "/accounting/revenue-expenses",
    color: "from-green-500 to-green-600"
  },
  {
    id: "customer-accounts",
    title: "จัดการลูกหนี้",
    description: "ติดตามการชำระเงินจากลูกค้า และประวัติการทำธุรกรรม",
    icon: Users,
    path: "/accounting/customer-accounts",
    color: "from-orange-500 to-orange-600"
  },
  {
    id: "internal-requests",
    title: "คำขอการเบิกจ่าย",
    description: "อนุมัติคำขอเบิกวัสดุ รถส่วนกลาง และค่าใช้จ่ายพนักงาน",
    icon: FileCheck,
    path: "/accounting/internal-requests",
    color: "from-purple-500 to-purple-600"
  },
  {
    id: "financial-reports",
    title: "รายงานทางการเงิน",
    description: "วิเคราะห์กำไร-ขาดทุน รายงาน KPI และแผนภูมิทางการเงิน",
    icon: TrendingUp,
    path: "/accounting/financial-reports",
    color: "from-red-500 to-red-600"
  },
  {
    id: "work-guides",
    title: "คู่มือการทำงาน",
    description: "เอกสารอ้างอิง นโยบายทางการเงิน และระเบียบปฏิบัติ",
    icon: Book,
    path: "/accounting/work-guides",
    color: "from-gray-500 to-gray-600"
  }
];

export default function AccountingMain() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">ระบบฝ่ายบัญชี</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          จัดการข้อมูลทางการเงินครบวงจร ตั้งแต่รายรับ รายจ่าย ลูกหนี้ ไปจนถึงการรายงานผล
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accountingModules.map((module) => {
          const IconComponent = module.icon;
          return (
            <Card 
              key={module.id} 
              className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/20"
              onClick={() => navigate(module.path)}
            >
              <CardHeader className="space-y-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${module.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {module.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  เข้าสู่ระบบ
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 pt-8 border-t">
        <h2 className="text-2xl font-bold text-center mb-6">สรุปข้อมูลด่วน</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">฿850,000</div>
                <p className="text-sm text-muted-foreground">รายรับเดือนนี้</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">฿520,000</div>
                <p className="text-sm text-muted-foreground">รายจ่ายเดือนนี้</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">12</div>
                <p className="text-sm text-muted-foreground">รอการชำระ</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">8</div>
                <p className="text-sm text-muted-foreground">คำขอรออนุมัติ</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}