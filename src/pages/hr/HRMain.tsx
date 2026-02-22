import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Users,
  DollarSign,
  Target,
  FileText,
  TrendingUp,
  Book,
  ArrowRight,
  Settings,
  FileBarChart
} from "lucide-react";

const hrModules = [
  {
    id: "dashboard",
    title: "แดชบอร์ดฝ่ายบุคคล",
    description: "ภาพรวมข้อมูลพนักงาน KPI และแจ้งเตือนสำคัญ",
    icon: Users,
    path: "/hr/dashboard",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: "employee-management",
    title: "จัดการข้อมูลพนักงาน",
    description: "ฐานข้อมูลพนักงาน ข้อมูลส่วนตัว และการเข้าสู่ระบบ",
    icon: Users,
    path: "/hr/employee-management",
    color: "from-green-500 to-green-600"
  },
  {
    id: "commission-made-to-order",
    title: "ค่าคอมมิชชั่น (งานสั่งผลิต)",
    description: "คำนวณและจัดการค่าคอมมิชชั่นจากงานสั่งผลิตของฝ่ายขาย",
    icon: DollarSign,
    path: "/hr/commission-made-to-order",
    color: "from-orange-500 to-orange-600"
  },
  {
    id: "commission-ready-made",
    title: "ค่าคอมมิชชั่น (งานสำเร็จรูป)",
    description: "คำนวณและจัดการค่าคอมมิชชั่นจากงานสำเร็จรูปของฝ่ายขาย",
    icon: DollarSign,
    path: "/hr/commission-ready-made",
    color: "from-amber-500 to-amber-600"
  },
  {
    id: "hr-settings",
    title: "ตั้งค่า HR & Commission",
    description: "ตั้งค่าเรทค่าคอมมิชชั่น Level พนักงาน Incentive และ KPI",
    icon: Settings,
    path: "/hr/settings",
    color: "from-slate-500 to-slate-600"
  },
  {
    id: "monthly-commission-report",
    title: "รายงานค่าคอมรายเดือน",
    description: "สรุปค่าคอมทั้งหมดแยกตามพนักงาน ประเภทงาน และเดือน",
    icon: FileBarChart,
    path: "/hr/monthly-commission-report",
    color: "from-indigo-500 to-indigo-600"
  },
  {
    id: "hr-reports",
    title: "รายงานฝ่ายบุคคล",
    description: "รายงานประสิทธิภาพ ค่าตอบแทน และการวิเคราะห์บุคลากร",
    icon: TrendingUp,
    path: "/hr/reports",
    color: "from-red-500 to-red-600"
  },
  {
    id: "work-guides",
    title: "คู่มือการทำงาน",
    description: "ระเบียบบริษัท สวัสดิการ และเอกสารสำคัญ",
    icon: Book,
    path: "/hr/work-guides",
    color: "from-gray-500 to-gray-600"
  }
];

export default function HRMain() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">ระบบฝ่ายบุคคล</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          จัดการบุคลากรอย่างครอบคลุม ตั้งแต่ข้อมูลพนักงาน ค่าตอบแทน การประเมินผล ไปจนถึงการรายงาน
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {hrModules.map((module) => {
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
                <div className="text-2xl font-bold text-blue-600">31</div>
                <p className="text-sm text-muted-foreground">พนักงานทั้งหมด</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">฿27,258</div>
                <p className="text-sm text-muted-foreground">เงินเดือนเฉลี่ย</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">96.2%</div>
                <p className="text-sm text-muted-foreground">คะแนน KPI เฉลี่ย</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">3</div>
                <p className="text-sm text-muted-foreground">รอการประเมิน</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}