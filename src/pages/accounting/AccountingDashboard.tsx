import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  Receipt, 
  TrendingUp,
  FileText,
  Clock,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  ShoppingCart,
  Wallet,
  TrendingDown,
  Monitor,
  ClipboardList,
  AlertTriangle,
  PackageMinus,
  Trophy,
  Lock,
  ClipboardCheck
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

// Mock Data
const cashFlowData = [
  { month: "ม.ค.", income: 450000, expense: 320000 },
  { month: "ก.พ.", income: 520000, expense: 380000 },
  { month: "มี.ค.", income: 680000, expense: 420000 },
  { month: "เม.ย.", income: 590000, expense: 390000 },
  { month: "พ.ค.", income: 720000, expense: 450000 },
  { month: "มิ.ย.", income: 850000, expense: 520000 },
];

const kpiData = [
  { name: "งานจัดส่ง", value: 92, target: 90, status: "success" },
  { name: "ปิดใบรับเงิน", value: 88, target: 85, status: "success" },
  { name: "เงินสดย่อย", value: 75, target: 80, status: "warning" },
  { name: "อนุมัติใบเสนอราคา", value: 95, target: 90, status: "success" },
  { name: "บันทึกรายรับ-จ่าย", value: 65, target: 85, status: "danger" },
];

const pendingTasks = [
  { id: "INV-001", task: "บันทึกรายรับจากคำสั่งซื้อ ORD-125", status: "pending", dueDate: "2024-01-20", priority: "high" },
  { id: "PAY-015", task: "อนุมัติการจ่ายเงินซัพพลายเออร์", status: "in-progress", dueDate: "2024-01-18", priority: "high" },
  { id: "REC-032", task: "ออกใบเสร็จรับเงิน - บริษัท ABC", status: "pending", dueDate: "2024-01-22", priority: "medium" },
  { id: "RPT-008", task: "จัดทำรายงานกำไรขาดทุนประจำเดือน", status: "completed", dueDate: "2024-01-15", priority: "low" },
  { id: "CHK-019", task: "ตรวจสอบยอดลูกหนี้คงค้าง", status: "in-progress", dueDate: "2024-01-21", priority: "medium" },
];

const activityLog = [
  { action: "อนุมัติการจ่าย", detail: "PAY-015 - ค่าวัสดุ ฿25,000", user: "สมชาย บัญชี", time: "10 นาทีที่แล้ว" },
  { action: "เพิ่มคำสั่งซื้อ", detail: "ORD-126 - บริษัท XYZ", user: "สมหญิง ขาย", time: "25 นาทีที่แล้ว" },
  { action: "ออกใบเสร็จ", detail: "REC-031 - ฿45,000", user: "สมชาย บัญชี", time: "1 ชั่วโมงที่แล้ว" },
  { action: "บันทึกรายรับ", detail: "INV-089 - ฿67,000", user: "สมศรี บัญชี", time: "2 ชั่วโมงที่แล้ว" },
  { action: "อนุมัติใบเสนอราคา", detail: "QUO-045", user: "ผู้จัดการขาย", time: "3 ชั่วโมงที่แล้ว" },
];

const salesByPerson = [
  { name: "สมชาย", sales: 450000, target: 400000 },
  { name: "สมหญิง", sales: 380000, target: 350000 },
  { name: "วิชัย", sales: 320000, target: 380000 },
  { name: "สมศรี", sales: 290000, target: 300000 },
  { name: "ประเสริฐ", sales: 260000, target: 270000 },
];

const salesByProductType = [
  { type: "เหรียญรางวัล", value: 280000, percentage: 22 },
  { type: "ถ้วยรางวัล", value: 245000, percentage: 19 },
  { type: "คริสตัล", value: 180000, percentage: 14 },
  { type: "อะคริลิก", value: 165000, percentage: 13 },
  { type: "ผ้า", value: 150000, percentage: 12 },
  { type: "อื่นๆ", value: 255000, percentage: 20 },
];

const topProducts = [
  { name: "เหรียญทองแดง พร้อมกล่อง", category: "เหรียญรางวัล", sales: 85000, orders: 45 },
  { name: "ถ้วยคริสตัล Premium", category: "ถ้วยรางวัล", sales: 78000, orders: 38 },
  { name: "ป้าย Acrylic ใส", category: "อะคริลิก", sales: 65000, orders: 52 },
  { name: "ริสแบรนด์ผ้าซาติน", category: "ผ้า", sales: 58000, orders: 67 },
  { name: "พวงกุญแจโลหะ", category: "พวงกุญแจ", sales: 52000, orders: 95 },
];

const accountsReceivable = [
  { company: "บริษัท ABC จำกัด", amount: 125000, dueDate: "2024-01-25", aging: "15 วัน" },
  { company: "ร้าน XYZ", amount: 85000, dueDate: "2024-01-30", aging: "10 วัน" },
  { company: "บริษัท DEF จำกัด", amount: 67000, dueDate: "2024-02-05", aging: "5 วัน" },
];

const accountsPayable = [
  { supplier: "ซัพพลายเออร์ A", amount: 95000, dueDate: "2024-01-22", type: "วัสดุ" },
  { supplier: "ซัพพลายเออร์ B", amount: 58000, dueDate: "2024-01-28", type: "อุปกรณ์" },
  { supplier: "ซัพพลายเออร์ C", amount: 42000, dueDate: "2024-02-01", type: "วัสดุ" },
];

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#f59e0b', '#10b981', '#6366f1'];

export default function AccountingDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  
  // คำนวณ KPI เฉลี่ย
  const averageKPI = Math.round(kpiData.reduce((sum, kpi) => sum + kpi.value, 0) / kpiData.length);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">แดชบอร์ดฝ่ายบัญชี</h1>
          <p className="text-muted-foreground">ภาพรวมข้อมูลทางการเงินแบบ Real-time</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* 1. การ์ดสรุปข้อมูลการเงิน */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="ยอดขายเดือนนี้"
          value="฿850,000"
          change="+18% จากเดือนที่แล้ว"
          icon={<TrendingUp className="h-4 w-4" />}
          trend="up"
        />
        <StatsCard
          title="สต็อกสินค้า"
          value="156 รายการ"
          change="-3% จากเดือนที่แล้ว"
          icon={<Package className="h-4 w-4" />}
          trend="down"
        />
        <StatsCard
          title="การเบิกจ่ายวันนี้"
          value="฿28,500"
          change="+12% จากเมื่อวาน"
          icon={<Wallet className="h-4 w-4" />}
          trend="up"
        />
        <StatsCard
          title="รายการรอดำเนินการ"
          value="12 รายการ"
          change="+3 รายการใหม่"
          icon={<Clock className="h-4 w-4" />}
          trend="neutral"
        />
      </div>

      {/* ภาพรวมเงินสดย่อย */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              ภาพรวมเงินสดย่อย
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              เดือนนี้
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">฿50,000</p>
              <p className="text-sm text-muted-foreground">วงเงินกองทุน</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-destructive">฿12,300</p>
              <p className="text-sm text-muted-foreground">เบิกจ่ายแล้ว</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-green-600">฿37,700</p>
              <p className="text-sm text-muted-foreground">คงเหลือ</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">75.4%</p>
              <p className="text-sm text-muted-foreground">คงเหลือ (%)</p>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold">8</p>
                <p className="text-xs text-muted-foreground">ทั้งหมด</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-lg font-bold">2</p>
                <p className="text-xs text-muted-foreground">รออนุมัติ</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold">1</p>
                <p className="text-xs text-muted-foreground">รอเบิกจ่าย</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold">5</p>
                <p className="text-xs text-muted-foreground">จ่ายแล้ว</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                <Receipt className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-bold">3</p>
                <p className="text-xs text-muted-foreground">รอเคลียร์</p>
              </div>
            </div>
          </div>

          {/* Top Categories */}
          <div>
            <p className="text-sm font-medium mb-3">หมวดหมู่ค่าใช้จ่ายสูงสุด</p>
            <div className="space-y-2">
              {[
                { name: "ค่าส่งสินค้า", amount: 4500, percent: 37 },
                { name: "ค่าน้ำมัน", amount: 3200, percent: 26 },
                { name: "ค่าของใช้", amount: 2800, percent: 23 },
                { name: "ค่าทางด่วน", amount: 1800, percent: 14 },
              ].map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-sm w-28 shrink-0">{cat.name}</span>
                  <Progress value={cat.percent} className="flex-1" />
                  <span className="text-sm font-medium w-24 text-right">฿{cat.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. สถานะการดำเนินงาน */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>สถานะการดำเนินงาน</CardTitle>
            <Badge 
              variant={averageKPI >= 85 ? "default" : averageKPI >= 70 ? "secondary" : "destructive"}
              className="text-lg px-4 py-1"
            >
              Job Completion Rate: {averageKPI}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kpiData.map((kpi) => (
              <div key={kpi.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{kpi.name}</span>
                    <Badge 
                      variant="outline" 
                      className={
                        kpi.status === "success" ? "border-green-500 text-green-700" :
                        kpi.status === "warning" ? "border-yellow-500 text-yellow-700" :
                        "border-red-500 text-red-700"
                      }
                    >
                      {kpi.value}%
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">เป้าหมาย: {kpi.target}%</span>
                </div>
                <Progress 
                  value={kpi.value} 
                  className={
                    kpi.status === "success" ? "[&>div]:bg-green-500" :
                    kpi.status === "warning" ? "[&>div]:bg-yellow-500" :
                    "[&>div]:bg-red-500"
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 3. งานรอดำเนินการ & 4. กิจกรรมล่าสุด */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* งานรอดำเนินการ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>งานรอดำเนินการ</CardTitle>
              <Badge variant="secondary">{pendingTasks.filter(t => t.status !== "completed").length} รายการ</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{task.id}</span>
                      <Badge 
                        variant="outline" 
                        className={
                          task.status === "completed" ? "border-green-500 text-green-700" :
                          task.status === "in-progress" ? "border-blue-500 text-blue-700" :
                          "border-yellow-500 text-yellow-700"
                        }
                      >
                        {task.status === "completed" ? "เสร็จสิ้น" : 
                         task.status === "in-progress" ? "ดำเนินการ" : "รอดำเนินการ"}
                      </Badge>
                      {task.priority === "high" && (
                        <Badge variant="destructive" className="text-xs">ด่วน</Badge>
                      )}
                    </div>
                    <p className="text-sm">{task.task}</p>
                    <p className="text-xs text-muted-foreground mt-1">ครบกำหนด: {task.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* กิจกรรมล่าสุด */}
        <Card>
          <CardHeader>
            <CardTitle>กิจกรรมล่าสุด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLog.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.detail}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{activity.user}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* กระแสเงินสด 6 เดือน */}
      <Card>
        <CardHeader>
          <CardTitle>กระแสเงินสด 6 เดือนที่ผ่านมา</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashFlowData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                formatter={(value: number) => `฿${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="income" fill="hsl(var(--primary))" name="รายรับ" radius={[8, 8, 0, 0]} />
              <Bar dataKey="expense" fill="hsl(var(--destructive))" name="รายจ่าย" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ยอดขายรายบุคคล & ยอดขายตามประเภทสินค้า */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ยอดขายรายบุคคล */}
        <Card>
          <CardHeader>
            <CardTitle>ยอดขายรายบุคคล vs เป้าหมาย</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesByPerson} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                <Tooltip 
                  formatter={(value: number) => `฿${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Bar dataKey="sales" fill="hsl(var(--primary))" name="ยอดขายจริง" radius={[0, 8, 8, 0]} />
                <Bar dataKey="target" fill="hsl(var(--secondary))" name="เป้าหมาย" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* ยอดขายตามประเภทสินค้า */}
        <Card>
          <CardHeader>
            <CardTitle>ยอดขายตามประเภทสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={salesByProductType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percentage }) => `${type}: ${percentage}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {salesByProductType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `฿${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 สินค้าขายดี */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 สินค้าขายดี</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary">฿{product.sales.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{product.orders} ออเดอร์</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* รายงานลูกหนี้ & เจ้าหนี้ */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* รายงานลูกหนี้ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>รายงานลูกหนี้</CardTitle>
              <Badge variant="secondary">
                ฿{accountsReceivable.reduce((sum, ar) => sum + ar.amount, 0).toLocaleString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accountsReceivable.map((ar, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{ar.company}</p>
                    <p className="text-sm text-muted-foreground">ครบกำหนด: {ar.dueDate}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      Aging: {ar.aging}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">฿{ar.amount.toLocaleString()}</p>
                    <Button size="sm" variant="outline" className="mt-1">
                      ติดตาม
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* รายงานเจ้าหนี้ */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>รายงานเจ้าหนี้</CardTitle>
              <Badge variant="destructive">
                ฿{accountsPayable.reduce((sum, ap) => sum + ap.amount, 0).toLocaleString()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accountsPayable.map((ap, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{ap.supplier}</p>
                    <p className="text-sm text-muted-foreground">ครบกำหนด: {ap.dueDate}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {ap.type}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">฿{ap.amount.toLocaleString()}</p>
                    <Button size="sm" className="mt-1">
                      จ่ายเงิน
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ภาพรวมสต็อกสินค้า */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              ภาพรวมสต็อกสินค้า
            </CardTitle>
            <Badge variant="outline" className="text-sm">ข้อมูลล่าสุด</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">12,450</p>
              <p className="text-sm text-muted-foreground">สต็อกรวม (หน่วย)</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold text-green-600">10,800</p>
              <p className="text-sm text-muted-foreground">พร้อมจำหน่าย</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-600">980</p>
              <p className="text-sm text-muted-foreground">สินค้ามีตำหนิ</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <AlertCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
              <p className="text-2xl font-bold text-destructive">670</p>
              <p className="text-sm text-muted-foreground">สินค้าชำรุด</p>
            </div>
          </div>

          {/* Warehouse Breakdown */}
          <div>
            <p className="text-sm font-medium mb-3">แยกตามคลังสินค้า</p>
            <div className="space-y-2">
              {[
                { name: "คลัง TEG", total: 7200, ready: 6300, percent: 88 },
                { name: "คลัง Lucky", total: 5250, ready: 4500, percent: 86 },
              ].map((wh) => (
                <div key={wh.name} className="flex items-center gap-3">
                  <span className="text-sm w-28 shrink-0">{wh.name}</span>
                  <Progress value={wh.percent} className="flex-1" />
                  <span className="text-sm font-medium w-32 text-right">
                    {wh.ready.toLocaleString()} / {wh.total.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div>
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              สินค้าใกล้หมด (ต่ำกว่าจุดสั่งซื้อ)
            </p>
            <div className="space-y-2">
              {[
                { name: "ถังขยะพลาสติก 120L", code: "P001", stock: 15, min: 50, warehouse: "TEG" },
                { name: "ถังขยะสแตนเลส 80L", code: "P003", stock: 8, min: 30, warehouse: "TEG" },
                { name: "รถเข็นขยะ", code: "P005", stock: 5, min: 20, warehouse: "TEG" },
              ].map((item) => (
                <div key={item.code} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.code} • คลัง {item.warehouse}</p>
                  </div>
                  <Badge variant="destructive">{item.stock} / {item.min}</Badge>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">มูลค่าสต็อกรวมประมาณ</span>
            <span className="text-lg font-bold">฿3,850,000</span>
          </div>
        </CardContent>
      </Card>

      {/* ภาพรวมใบสั่งงาน (Work Orders) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-[#ef4042]" />
              ภาพรวมใบสั่งงาน (Work Orders)
            </CardTitle>
            <Badge variant="outline" className="text-sm">เดือนนี้</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <ClipboardList className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">13</p>
              <p className="text-sm text-muted-foreground">ใบสั่งงานทั้งหมด</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-2xl font-bold text-blue-600">6</p>
              <p className="text-sm text-muted-foreground">กำลังดำเนินการ</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-[#ef4042]/5">
              <Trophy className="h-5 w-5 mx-auto mb-1 text-[#ef4042]" />
              <p className="text-2xl font-bold text-[#ef4042]">5</p>
              <p className="text-sm text-muted-foreground">ตรวจสอบแล้ว</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50">
              <Lock className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold text-green-600">2</p>
              <p className="text-sm text-muted-foreground">ปิดงานแล้ว</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-amber-50">
              <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <p className="text-2xl font-bold text-amber-600">3</p>
              <p className="text-sm text-muted-foreground">สต็อกไม่ครบ</p>
            </div>
          </div>

          {/* Financial Summary */}
          <div>
            <p className="text-sm font-medium mb-3">สรุปการเงินจากใบสั่งงาน</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">รายรับรวม (Revenue)</p>
                <p className="text-xl font-bold text-green-600">฿2,750,000</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">รายจ่ายรวม (Expense)</p>
                <p className="text-xl font-bold text-red-500">฿1,798,500</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">กำไรขั้นต้นรวม (GP)</p>
                <p className="text-xl font-bold text-[#ef4042]">฿951,500</p>
              </div>
              <div className="p-3 border rounded-lg">
                <p className="text-xs text-muted-foreground">Avg. Margin</p>
                <p className="text-xl font-bold text-amber-600">34.6%</p>
              </div>
            </div>
          </div>

          {/* Top GP Jobs */}
          <div>
            <p className="text-sm font-medium mb-3">งานที่มีกำไรสูงสุด (Top GP)</p>
            <div className="space-y-2">
              {[
                { id: "WO-2026-009", project: "เหรียญที่ระลึก 100 ปี", customer: "สำนักงานตำรวจแห่งชาติ", gp: 175000, margin: 50.0, status: "ปิดงาน" },
                { id: "WO-2026-004", project: "สายคล้องคอ งาน Expo 2026", customer: "บริษัท สยามพรีเมียม จำกัด", gp: 112000, margin: 35.0, status: "ตรวจสอบแล้ว" },
                { id: "WO-2026-001", project: "โปรเจคสายคล้องคอพรีเมียม", customer: "บริษัท ABC จำกัด", gp: 87500, margin: 35.0, status: "ตรวจสอบแล้ว" },
                { id: "WO-2026-011", project: "แก้วน้ำเซรามิค ของที่ระลึก", customer: "การไฟฟ้าส่วนภูมิภาค", gp: 81000, margin: 45.0, status: "กำลังดำเนินการ" },
                { id: "WO-2026-013", project: "กระเป๋าผ้า Canvas พิมพ์ลาย", customer: "บริษัท ออล อินสไปร์ จำกัด", gp: 81000, margin: 30.0, status: "กำลังดำเนินการ" },
              ].map((job, i) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#ef4042]/10 text-[#ef4042] font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{job.project}</p>
                      <p className="text-xs text-muted-foreground">{job.id} • {job.customer}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={
                      job.status === "ปิดงาน" ? "bg-green-50 text-green-700 border-green-200 text-xs gap-1" :
                      job.status === "ตรวจสอบแล้ว" ? "bg-[#ef4042]/10 text-[#ef4042] border-[#ef4042]/20 text-xs gap-1" :
                      "bg-blue-50 text-blue-700 border-blue-200 text-xs"
                    }>
                      {job.status === "ตรวจสอบแล้ว" && <Trophy className="h-3 w-3" />}
                      {job.status === "ปิดงาน" && <Lock className="h-3 w-3" />}
                      {job.status}
                    </Badge>
                    <div className="text-right">
                      <p className="font-bold text-sm text-green-600">฿{job.gp.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{job.margin}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Issues */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg border-amber-200 bg-amber-50/50">
              <p className="text-sm font-medium flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                ยอดค้างชำระจากลูกค้า
              </p>
              <p className="text-xl font-bold text-amber-700">฿175,000</p>
              <p className="text-xs text-muted-foreground mt-1">จาก 6 ใบสั่งงาน</p>
            </div>
            <div className="p-3 border rounded-lg border-orange-200 bg-orange-50/50">
              <p className="text-sm font-medium flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4 text-orange-600" />
                ค่าใช้จ่ายยังไม่ตั้งเบิก
              </p>
              <p className="text-xl font-bold text-orange-700">฿89,500</p>
              <p className="text-xs text-muted-foreground mt-1">จาก 5 ใบสั่งงาน</p>
            </div>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>การดำเนินการด่วน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Button className="h-20 flex-col">
              <FileText className="w-6 h-6 mb-2" />
              บันทึกรายรับ-รายจ่าย
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Users className="w-6 h-6 mb-2" />
              จัดการลูกหนี้
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <ShoppingCart className="w-6 h-6 mb-2" />
              อนุมัติการเบิกจ่าย
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <TrendingUp className="w-6 h-6 mb-2" />
              รายงานทางการเงิน
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ภาพรวมทรัพย์สินสำนักงาน & วัสดุสำนักงาน */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* ภาพรวมทรัพย์สินสำนักงาน */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                ภาพรวมทรัพย์สินสำนักงาน
              </CardTitle>
              <Badge variant="outline" className="text-sm">IT Equipment</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">42</p>
                <p className="text-xs text-muted-foreground">ทรัพย์สินทั้งหมด</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-green-600">35</p>
                <p className="text-xs text-muted-foreground">ใช้งานอยู่</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-blue-500">4</p>
                <p className="text-xs text-muted-foreground">อุปกรณ์ว่าง</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-orange-500">3</p>
                <p className="text-xs text-muted-foreground">ส่งซ่อม</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">แยกตามประเภท</p>
              <div className="space-y-2">
                {[
                  { name: "คอมพิวเตอร์ตั้งโต๊ะ", count: 15, percent: 36 },
                  { name: "โน้ตบุ๊ก", count: 12, percent: 29 },
                  { name: "โทรศัพท์มือถือ", count: 8, percent: 19 },
                  { name: "อุปกรณ์เสริม", count: 7, percent: 16 },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="text-sm w-32 shrink-0">{item.name}</span>
                    <Progress value={item.percent} className="flex-1" />
                    <span className="text-sm font-medium w-12 text-right">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">มูลค่ารวมทรัพย์สิน</span>
              <span className="text-lg font-bold">฿1,285,000</span>
            </div>
          </CardContent>
        </Card>

        {/* ภาพรวมวัสดุสำนักงาน */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                ภาพรวมวัสดุสำนักงาน
              </CardTitle>
              <Badge variant="outline" className="text-sm">เดือนนี้</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">7</p>
                <p className="text-xs text-muted-foreground">รายการวัสดุทั้งหมด</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-[#D6275A]">2</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> ใกล้หมด
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-green-600">฿42,175</p>
                <p className="text-xs text-muted-foreground">มูลค่าสต็อกรวม</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-orange-500">฿1,770</p>
                <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <PackageMinus className="h-3 w-3" /> ยอดเบิกจ่ายรวม
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">การเบิกจ่ายล่าสุด</p>
              <div className="space-y-2">
                {[
                  { item: "ปากกาลูกลื่น", requester: "นายสมชาย ใจดี", qty: "2 โหล", date: "10 ก.พ." },
                  { item: "กระดาษ A4", requester: "นางสาวสมหญิง รักงาน", qty: "5 รีม", date: "12 ก.พ." },
                  { item: "หมึกพิมพ์ HP", requester: "นายทดสอบ ระบบดี", qty: "1 กล่อง", date: "14 ก.พ." },
                ].map((req, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{req.item}</p>
                      <p className="text-xs text-muted-foreground">{req.requester} • {req.date}</p>
                    </div>
                    <Badge variant="secondary">{req.qty}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">ยอดเบิกจ่ายเดือนนี้</span>
              <span className="text-lg font-bold text-orange-500">฿1,770</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}