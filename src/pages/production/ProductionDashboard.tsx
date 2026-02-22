import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Package, 
  Truck, 
  CheckCircle,
  Car,
  Calendar,
  User
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts";

// ข้อมูลประสิทธิภาพการผลิต
const dailyProductionData = [
  { period: "จ.", completed: 45 },
  { period: "อ.", completed: 52 },
  { period: "พ.", completed: 48 },
  { period: "พฤ.", completed: 55 },
  { period: "ศ.", completed: 49 },
  { period: "ส.", completed: 42 },
  { period: "อา.", completed: 38 },
];

const weeklyProductionData = [
  { period: "สัปดาห์ 1", completed: 320 },
  { period: "สัปดาห์ 2", completed: 350 },
  { period: "สัปดาห์ 3", completed: 290 },
  { period: "สัปดาห์ 4", completed: 380 },
];

const monthlyProductionData = [
  { period: "ม.ค.", completed: 1340 },
  { period: "ก.พ.", completed: 1280 },
  { period: "มี.ค.", completed: 1450 },
  { period: "เม.ย.", completed: 1520 },
  { period: "พ.ค.", completed: 1380 },
  { period: "มิ.ย.", completed: 1600 },
];

// งานประจำวันของแต่ละรายคน
const dailyTasks = [
  { 
    id: 1, 
    dateTime: "2024-01-20 08:00", 
    employeeName: "สมชาย ใจดี", 
    taskDetails: "แพ็กสินค้าเหรียญทอง 500 ชิ้น", 
    taskCount: 500, 
    taskType: "งานแพ็กสินค้า" 
  },
  { 
    id: 2, 
    dateTime: "2024-01-20 09:00", 
    employeeName: "สมหญิง รักงาน", 
    taskDetails: "ประกอบถ้วยรางวัล 50 ชิ้น", 
    taskCount: 50, 
    taskType: "งานประกอบ" 
  },
  { 
    id: 3, 
    dateTime: "2024-01-20 10:00", 
    employeeName: "วิชัย มานะ", 
    taskDetails: "จัดหาวัสดุสำหรับงานวันนี้", 
    taskCount: 10, 
    taskType: "งานจัดหา" 
  },
  { 
    id: 4, 
    dateTime: "2024-01-20 13:00", 
    employeeName: "สุดา สวยงาม", 
    taskDetails: "ผูกโบว์ของขวัญ 200 ชิ้น", 
    taskCount: 200, 
    taskType: "งานผูกโบว์" 
  },
  { 
    id: 5, 
    dateTime: "2024-01-20 14:00", 
    employeeName: "ประยุทธ แข็งแรง", 
    taskDetails: "จัดส่งสินค้าไปยังลูกค้า ABC", 
    taskCount: 3, 
    taskType: "งานจัดส่ง" 
  },
];

// ออเดอร์ที่กำลังดำเนินการ
const activeOrders = [
  { 
    id: "ORD-001", 
    customerName: "บริษัท ABC จำกัด", 
    jobName: "เหรียญรางวัลการแข่งขัน", 
    jobDetails: "เหรียญทอง 500 ชิ้น, เหรียญเงิน 300 ชิ้น", 
    salesPerson: "นภา ขายดี", 
    shipping: "Air Freight", 
    nearDue: true, 
    urgency: "ด่วนมาก" 
  },
  { 
    id: "ORD-002", 
    customerName: "โรงเรียนสายรุ้ง", 
    jobName: "ถ้วยรางวัลกีฬาสี", 
    jobDetails: "ถ้วยทอง 10 ชิ้น, โล่เกียรติยศ 50 ชิ้น", 
    salesPerson: "สมศรี ใส่ใจ", 
    shipping: "EK Freight", 
    nearDue: false, 
    urgency: "ปกติ" 
  },
  { 
    id: "ORD-003", 
    customerName: "บริษัท XYZ Corporation", 
    jobName: "คริสตัลของที่ระลึก", 
    jobDetails: "คริสตัลแกะสลัก 100 ชิ้น", 
    salesPerson: "วิไล รับใช้", 
    shipping: "Sea Freight", 
    nearDue: true, 
    urgency: "ด่วน" 
  },
  { 
    id: "ORD-004", 
    customerName: "มหาวิทยาลัยการกีฬา", 
    jobName: "เหรียญมหาวิทยาลัย", 
    jobDetails: "เหรียญทองแดง 1000 ชิ้น", 
    salesPerson: "นภา ขายดี", 
    shipping: "Air Freight", 
    nearDue: false, 
    urgency: "ปกติ" 
  },
];

const vehicleRequests = [
  { id: "VEH-001", purpose: "จัดส่งสินค้าลูกค้า ABC", requestDate: "2024-01-20", status: "รออนุมัติ" },
  { id: "VEH-002", purpose: "รับวัสดุจากซัพพลายเออร์", requestDate: "2024-01-21", status: "อนุมัติแล้ว" },
  { id: "VEH-003", purpose: "จัดส่งสินค้าไปโรงเรียน", requestDate: "2024-01-21", status: "อนุมัติแล้ว" },
];

export default function ProductionDashboard() {
  const totalOrders = activeOrders.length;
  const completedToday = dailyProductionData[dailyProductionData.length - 1]?.completed || 0;
  const pendingVehicleRequests = vehicleRequests.filter(req => req.status === "รออนุมัติ").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">แดชบอร์ดฝ่ายผลิตและจัดส่ง</h1>
          <p className="text-muted-foreground">ภาพรวมการผลิต และการจัดส่ง</p>
        </div>
      </div>

      {/* ภาพรวมการผลิตและการจัดส่ง */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="งานทั้งหมด"
          value={totalOrders.toString()}
          change={`${activeOrders.filter(o => o.nearDue).length} งานใกล้ครบกำหนด`}
          icon={<Package className="h-4 w-4" />}
          trend="neutral"
        />
        <StatsCard
          title="งานที่ผลิตเสร็จภายในวัน"
          value={completedToday.toString()}
          change="ชิ้นงาน"
          icon={<CheckCircle className="h-4 w-4" />}
          trend="up"
        />
        <StatsCard
          title="สถานะการขอใช้รถ"
          value={vehicleRequests.length.toString()}
          change={`${pendingVehicleRequests} รายการรออนุมัติ`}
          icon={<Car className="h-4 w-4" />}
          trend="neutral"
        />
      </div>

      {/* ประสิทธิภาพการผลิต */}
      <Card>
        <CardHeader>
          <CardTitle>ประสิทธิภาพการผลิต</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">รายวัน</TabsTrigger>
              <TabsTrigger value="weekly">รายสัปดาห์</TabsTrigger>
              <TabsTrigger value="monthly">รายเดือน</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyProductionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" name="สินค้าผลิตเสร็จ" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="weekly" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyProductionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="สินค้าผลิตเสร็จ" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="monthly" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyProductionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" name="สินค้าผลิตเสร็จ" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* งานประจำวันของแต่ละรายคน */}
      <Card>
        <CardHeader>
          <CardTitle>งานประจำวันของแต่ละรายคน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    วันที่และเวลา
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    ชื่อพนักงาน
                  </div>
                </TableHead>
                <TableHead>รายละเอียดงาน</TableHead>
                <TableHead className="text-center">จำนวนงาน</TableHead>
                <TableHead>ประเภทงาน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.dateTime}</TableCell>
                  <TableCell>{task.employeeName}</TableCell>
                  <TableCell>{task.taskDetails}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{task.taskCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{task.taskType}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ออเดอร์ที่กำลังดำเนินการ */}
      <Card>
        <CardHeader>
          <CardTitle>ออเดอร์ที่กำลังดำเนินการ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อลูกค้า</TableHead>
                <TableHead>ชื่องาน</TableHead>
                <TableHead>รายละเอียดงาน</TableHead>
                <TableHead>เซลล์ผู้รับผิดชอบ</TableHead>
                <TableHead>ขนส่ง</TableHead>
                <TableHead className="text-center">สถานะ</TableHead>
                <TableHead className="text-center">ความเร่งด่วน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.customerName}</TableCell>
                  <TableCell>{order.jobName}</TableCell>
                  <TableCell className="max-w-xs truncate">{order.jobDetails}</TableCell>
                  <TableCell>{order.salesPerson}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Truck className="h-3 w-3" />
                      {order.shipping}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {order.nearDue && (
                      <Badge variant="destructive">ใกล้ส่งมอบ</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={
                        order.urgency === "ด่วนมาก" ? "destructive" : 
                        order.urgency === "ด่วน" ? "secondary" : 
                        "outline"
                      }
                    >
                      {order.urgency}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}