import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Package,
  Truck,
  Box,
  RefreshCw,
  TrendingUp,
  Book,
  ClipboardList,
  ArrowRight
} from "lucide-react";

const productionModules = [
  {
    id: "dashboard",
    title: "แดชบอร์ดฝ่ายผลิตและจัดส่ง",
    description: "ภาพรวมการผลิต สต็อกสินค้า และการจัดส่ง",
    icon: Package,
    path: "/production/dashboard",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "order-management",
    title: "จัดการออเดอร์และการผลิต",
    description: "ติดตามและอัปเดตสถานะการผลิตและออเดอร์",
    icon: RefreshCw,
    path: "/production/order-management",
    color: "from-green-500 to-green-600"
  },
  {
    id: "inventory-management", 
    title: "จัดการสต็อกสินค้า",
    description: "ควบคุมสต็อก บันทึกการเคลื่อนไหว และรายงานสินค้าตำหนิ",
    icon: Box,
    path: "/production/inventory-management",
    color: "from-orange-500 to-orange-600"
  },
  {
    id: "requests-management",
    title: "คำขอและการจัดการอื่นๆ",
    description: "จัดการคำขอใช้รถและคำขอเบิกสินค้าจากภายใน",
    icon: Truck,
    path: "/production/requests-management",
    color: "from-purple-500 to-purple-600"
  },
  {
    id: "production-reports",
    title: "รายงานผลการผลิต",
    description: "วิเคราะห์ประสิทธิภาพการผลิตและสถานะสต็อก",
    icon: TrendingUp,
    path: "/production/reports",
    color: "from-red-500 to-red-600"
  },
  {
    id: "employee-tasks",
    title: "รายละเอียดงานของพนักงาน",
    description: "ติดตามและอัปเดตรายละเอียดงานของพนักงานแต่ละคน",
    icon: ClipboardList,
    path: "/production/employee-tasks",
    color: "from-indigo-500 to-indigo-600"
  },
  {
    id: "work-guides",
    title: "คู่มือการทำงาน",
    description: "คู่มือและระเบียบปฏิบัติด้านการผลิตและจัดส่ง",
    icon: Book,
    path: "/production/work-guides",
    color: "from-gray-500 to-gray-600"
  }
];

export default function ProductionMain() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">ระบบฝ่ายผลิตและจัดส่ง</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          จัดการการผลิตอย่างครอบคลุม ตั้งแต่การรับออเดอร์ ควบคุมสต็อก ไปจนถึงการจัดส่งและรายงานผล
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {productionModules.map((module) => {
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
                <div className="text-2xl font-bold text-blue-600">18</div>
                <p className="text-sm text-muted-foreground">ออเดอร์ในระบบ</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">42</div>
                <p className="text-sm text-muted-foreground">ผลิตเสร็จวันนี้</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">3</div>
                <p className="text-sm text-muted-foreground">สินค้าใกล้หมด</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">95%</div>
                <p className="text-sm text-muted-foreground">การจัดส่งตรงเวลา</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}