import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import {
  FileBarChart,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Phone,
  Target,
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  BookOpen
} from "lucide-react";
import { format } from "date-fns";

export default function SalesReports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [date, setDate] = useState<Date>(new Date());

  // รายงานยอดขาย Data
  const salesData = [
    { month: "ม.ค.", revenue: 850000, orders: 45, avgOrder: 18889 },
    { month: "ก.พ.", revenue: 920000, orders: 52, avgOrder: 17692 },
    { month: "มี.ค.", revenue: 1100000, orders: 61, avgOrder: 18033 },
    { month: "เม.ย.", revenue: 980000, orders: 48, avgOrder: 20417 },
    { month: "พ.ค.", revenue: 1200000, orders: 67, avgOrder: 17910 },
    { month: "มิ.ย.", revenue: 1350000, orders: 72, avgOrder: 18750 },
  ];

  const salesByProductType = [
    { name: "เสื้อยืด", value: 35, color: "#3b82f6" },
    { name: "เสื้อโปโล", value: 25, color: "#10b981" },
    { name: "เสื้อกีฬา", value: 20, color: "#f59e0b" },
    { name: "หมวก", value: 12, color: "#8b5cf6" },
    { name: "อื่นๆ", value: 8, color: "#6b7280" },
  ];

  // รายงานพนักงาน Data
  const employeePerformance = [
    { name: "สมชาย ใจดี", orders: 45, revenue: 890000, target: 800000, commission: 44500, kpi: 111 },
    { name: "สมหญิง รักงาน", orders: 38, revenue: 720000, target: 800000, commission: 36000, kpi: 90 },
    { name: "ประยุทธ์ ขยัน", orders: 52, revenue: 1020000, target: 800000, commission: 51000, kpi: 128 },
    { name: "วิภา ตั้งใจ", orders: 41, revenue: 815000, target: 800000, commission: 40750, kpi: 102 },
    { name: "นภา สู้งาน", orders: 36, revenue: 680000, target: 800000, commission: 34000, kpi: 85 },
  ];

  // รายงานลูกค้า Data
  const customerSegments = [
    { type: "ลูกค้าประจำ", count: 45, revenue: 2500000, percentage: 62.5 },
    { type: "ลูกค้าใหม่", count: 32, revenue: 980000, percentage: 24.5 },
    { type: "ผู้มุ่งหวัง", count: 28, revenue: 520000, percentage: 13 },
  ];

  const topCustomers = [
    { name: "บริษัท ABC จำกัด", orders: 12, revenue: 580000, lastContact: "2024-06-28" },
    { name: "โรงเรียนสุขใจ", orders: 8, revenue: 420000, lastContact: "2024-06-25" },
    { name: "องค์การ XYZ", orders: 10, revenue: 520000, lastContact: "2024-06-27" },
    { name: "มูลนิธิรักษ์โลก", orders: 6, revenue: 320000, lastContact: "2024-06-24" },
  ];

  // รายงานการติดต่อ Data
  const activityData = [
    { month: "ม.ค.", calls: 120, meetings: 45, emails: 85, followUps: 32 },
    { month: "ก.พ.", calls: 135, meetings: 52, emails: 92, followUps: 38 },
    { month: "มี.ค.", calls: 145, meetings: 48, emails: 98, followUps: 41 },
    { month: "เม.ย.", calls: 128, meetings: 55, emails: 88, followUps: 35 },
    { month: "พ.ค.", calls: 152, meetings: 61, emails: 105, followUps: 45 },
    { month: "มิ.ย.", calls: 168, meetings: 58, emails: 112, followUps: 48 },
  ];

  const conversionRates = [
    { stage: "โทรครั้งแรก", count: 168, conversion: 100 },
    { stage: "นัดหมาย", count: 58, conversion: 34.5 },
    { stage: "เสนอใบเสนอราคา", count: 42, conversion: 25 },
    { stage: "ปิดการขาย", count: 28, conversion: 16.7 },
  ];

  // รายงานสินค้า Data
  const productPerformance = [
    { product: "เสื้อยืด Cotton 100%", sold: 450, revenue: 540000, margin: 35, stock: 120 },
    { product: "เสื้อโปโล Dry-Fit", sold: 320, revenue: 480000, margin: 40, stock: 85 },
    { product: "เสื้อกีฬา Mesh", sold: 280, revenue: 420000, margin: 38, stock: 95 },
    { product: "หมวกปักโลโก้", sold: 180, revenue: 108000, margin: 45, stock: 65 },
    { product: "กระเป๋าผ้า", sold: 95, revenue: 57000, margin: 42, stock: 42 },
  ];

  // รายงานคะแนน KPI Data
  const kpiMetrics = [
    { 
      name: "เป้ายอดขาย", 
      target: 5000000, 
      actual: 5600000, 
      achievement: 112,
      weight: 40
    },
    { 
      name: "จำนวนออเดอร์", 
      target: 250, 
      actual: 273, 
      achievement: 109,
      weight: 20
    },
    { 
      name: "การติดต่อลูกค้า", 
      target: 500, 
      actual: 548, 
      achievement: 110,
      weight: 15
    },
    { 
      name: "ลูกค้าใหม่", 
      target: 30, 
      actual: 32, 
      achievement: 107,
      weight: 15
    },
    { 
      name: "ความพึงพอใจ", 
      target: 85, 
      actual: 92, 
      achievement: 108,
      weight: 10
    },
  ];

  // รายงานหลักการขาย Data
  const salesPrinciples = [
    {
      principle: "การทำความเข้าใจลูกค้า",
      score: 92,
      activities: 156,
      success: 85,
      notes: "ใช้เวลาฟังลูกค้าและเข้าใจความต้องการ"
    },
    {
      principle: "การสร้างความสัมพันธ์",
      score: 88,
      activities: 142,
      success: 78,
      notes: "ติดต่อและดูแลลูกค้าอย่างสม่ำเสมอ"
    },
    {
      principle: "การเสนอขายตรงจุด",
      score: 85,
      activities: 128,
      success: 72,
      notes: "นำเสนอสินค้าที่ตอบโจทย์ลูกค้า"
    },
    {
      principle: "การติดตามผล",
      score: 90,
      activities: 165,
      success: 82,
      notes: "ติดตามผลและดูแลหลังการขาย"
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileBarChart className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">รายงานผล - ฝ่ายขาย</h1>
            <p className="text-muted-foreground">รายงานและวิเคราะห์ผลการขายแบบครบวงจร</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">สัปดาห์นี้</SelectItem>
              <SelectItem value="month">เดือนนี้</SelectItem>
              <SelectItem value="quarter">ไตรมาสนี้</SelectItem>
              <SelectItem value="year">ปีนี้</SelectItem>
            </SelectContent>
          </Select>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(date, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            ส่งออกรายงาน
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="sales" className="gap-1 text-xs">
            <DollarSign className="w-3 h-3" />
            ยอดขาย
          </TabsTrigger>
          <TabsTrigger value="employee" className="gap-1 text-xs">
            <Users className="w-3 h-3" />
            พนักงาน
          </TabsTrigger>
          <TabsTrigger value="customer" className="gap-1 text-xs">
            <Users className="w-3 h-3" />
            ลูกค้า
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-1 text-xs">
            <Phone className="w-3 h-3" />
            การติดต่อ
          </TabsTrigger>
          <TabsTrigger value="product" className="gap-1 text-xs">
            <Package className="w-3 h-3" />
            สินค้า
          </TabsTrigger>
          <TabsTrigger value="kpi" className="gap-1 text-xs">
            <Target className="w-3 h-3" />
            KPI
          </TabsTrigger>
          <TabsTrigger value="principles" className="gap-1 text-xs">
            <BookOpen className="w-3 h-3" />
            หลักการ
          </TabsTrigger>
        </TabsList>

        {/* 1. รายงานยอดขาย */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ยอดขายรวม</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿6,400,000</div>
                <p className="text-xs text-muted-foreground">+18% จากเดือนที่แล้ว</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ออเดอร์ทั้งหมด</CardTitle>
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">345</div>
                <p className="text-xs text-muted-foreground">+12% จากเดือนที่แล้ว</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">มูลค่าเฉลี่ยต่อออเดอร์</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿18,551</div>
                <p className="text-xs text-muted-foreground">+5% จากเดือนที่แล้ว</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">อัตรากำไร</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">38.5%</div>
                <p className="text-xs text-muted-foreground">+2.1% จากเดือนที่แล้ว</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>แนวโน้มยอดขายรายเดือน</CardTitle>
                <CardDescription>รายได้และจำนวนออเดอร์ย้อนหลัง 6 เดือน</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="รายได้" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>สัดส่วนยอดขายตามประเภทสินค้า</CardTitle>
                <CardDescription>แบ่งตามประเภทสินค้าที่ขายได้</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesByProductType}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {salesByProductType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. รายงานพนักงาน */}
        <TabsContent value="employee" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">พนักงานขาย</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5 คน</div>
                <p className="text-xs text-muted-foreground">ทีมขายปัจจุบัน</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">KPI เฉลี่ย</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">103.2%</div>
                <p className="text-xs text-success">เกินเป้าหมาย</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">คอมมิชชันรวม</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿206,250</div>
                <p className="text-xs text-muted-foreground">เดือนนี้</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ออเดอร์เฉลี่ย/คน</CardTitle>
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">42</div>
                <p className="text-xs text-muted-foreground">ต่อเดือน</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ผลงานพนักงานขาย</CardTitle>
              <CardDescription>ประสิทธิภาพการขายและเป้าหมายรายบุคคล</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อพนักงาน</TableHead>
                    <TableHead className="text-center">ออเดอร์</TableHead>
                    <TableHead className="text-right">ยอดขาย</TableHead>
                    <TableHead className="text-right">เป้าหมาย</TableHead>
                    <TableHead className="text-right">คอมมิชชัน</TableHead>
                    <TableHead className="text-center">KPI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeePerformance.map((emp, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell className="text-center">{emp.orders}</TableCell>
                      <TableCell className="text-right">฿{emp.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">฿{emp.target.toLocaleString()}</TableCell>
                      <TableCell className="text-right">฿{emp.commission.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={emp.kpi >= 100 ? "default" : "destructive"}>
                          {emp.kpi}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. รายงานลูกค้า */}
        <TabsContent value="customer" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {customerSegments.map((segment, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{segment.type}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{segment.count} ราย</div>
                  <p className="text-xs text-muted-foreground">฿{segment.revenue.toLocaleString()} ({segment.percentage}%)</p>
                  <Progress value={segment.percentage} className="mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ลูกค้าอันดับต้น</CardTitle>
              <CardDescription>ลูกค้าที่มียอดซื้อสูงสุด</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อลูกค้า</TableHead>
                    <TableHead className="text-center">จำนวนออเดอร์</TableHead>
                    <TableHead className="text-right">มูลค่ารวม</TableHead>
                    <TableHead>ติดต่อล่าสุด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((customer, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="text-center">{customer.orders}</TableCell>
                      <TableCell className="text-right">฿{customer.revenue.toLocaleString()}</TableCell>
                      <TableCell>{customer.lastContact}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. รายงานการติดต่อ */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">การโทรติดต่อ</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">168</div>
                <p className="text-xs text-muted-foreground">เดือนนี้</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">การนัดหมาย</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">58</div>
                <p className="text-xs text-muted-foreground">เดือนนี้</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">การส่งอีเมล</CardTitle>
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">112</div>
                <p className="text-xs text-muted-foreground">เดือนนี้</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">การติดตามผล</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">48</div>
                <p className="text-xs text-muted-foreground">เดือนนี้</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>กิจกรรมการติดต่อ</CardTitle>
                <CardDescription>สรุปกิจกรรมการติดต่อลูกค้าย้อนหลัง 6 เดือน</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="calls" fill="#3b82f6" name="โทรติดต่อ" />
                    <Bar dataKey="meetings" fill="#10b981" name="นัดหมาย" />
                    <Bar dataKey="emails" fill="#f59e0b" name="อีเมล" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>อัตราการแปลง (Conversion Rate)</CardTitle>
                <CardDescription>แสดง Conversion Funnel ของกระบวนการขาย</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {conversionRates.map((stage, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{stage.stage}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {stage.count} ราย
                          </span>
                          <Badge>{stage.conversion}%</Badge>
                        </div>
                      </div>
                      <Progress value={stage.conversion} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 5. รายงานสินค้า */}
        <TabsContent value="product" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สินค้าทั้งหมด</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,325</div>
                <p className="text-xs text-muted-foreground">ชิ้นที่ขายได้</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">มูลค่ารวม</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿1,605,000</div>
                <p className="text-xs text-muted-foreground">รายได้จากสินค้า</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">อัตรากำไรเฉลี่ย</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">40%</div>
                <p className="text-xs text-muted-foreground">Margin เฉลี่ย</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สินค้าขายดี</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
                <p className="text-xs text-muted-foreground">รายการ</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ผลงานสินค้า</CardTitle>
              <CardDescription>สินค้าขายดีและผลการดำเนินงาน</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อสินค้า</TableHead>
                    <TableHead className="text-center">ขายได้</TableHead>
                    <TableHead className="text-right">รายได้</TableHead>
                    <TableHead className="text-center">Margin</TableHead>
                    <TableHead className="text-center">คงเหลือ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productPerformance.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.product}</TableCell>
                      <TableCell className="text-center">{product.sold}</TableCell>
                      <TableCell className="text-right">฿{product.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{product.margin}%</Badge>
                      </TableCell>
                      <TableCell className="text-center">{product.stock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. รายงานคะแนน KPI */}
        <TabsContent value="kpi" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">คะแนน KPI รวม</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">110.4%</div>
                <p className="text-xs text-success">เกินเป้าหมาย 10.4%</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ตัวชี้วัด</CardTitle>
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5 ตัว</div>
                <p className="text-xs text-muted-foreground">ตัวชี้วัดหลัก</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ผลงาน KPI รายตัวชี้วัด</CardTitle>
              <CardDescription>เปรียบเทียบเป้าหมายและผลงานจริง พร้อมน้ำหนักคะแนน</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {kpiMetrics.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{metric.name}</span>
                        <Badge variant="outline" className="text-xs">
                          น้ำหนัก {metric.weight}%
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {typeof metric.actual === 'number' && metric.actual > 100000 
                            ? `฿${metric.actual.toLocaleString()}` 
                            : metric.actual.toLocaleString()
                          } / 
                          {typeof metric.target === 'number' && metric.target > 100000 
                            ? `฿${metric.target.toLocaleString()}` 
                            : metric.target.toLocaleString()
                          }
                        </span>
                        <Badge variant={metric.achievement >= 100 ? "default" : "destructive"}>
                          {metric.achievement}%
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={metric.achievement > 100 ? 100 : metric.achievement} 
                      className={metric.achievement >= 100 ? 'bg-success' : 'bg-muted'}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 7. รายงานหลักการขาย */}
        <TabsContent value="principles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">หลักการทั้งหมด</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">หลักการหลัก</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">คะแนนเฉลี่ย</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">88.8%</div>
                <p className="text-xs text-muted-foreground">ประสิทธิภาพโดยรวม</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">กิจกรรมทั้งหมด</CardTitle>
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">591</div>
                <p className="text-xs text-muted-foreground">กิจกรรมที่บันทึก</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">อัตราความสำเร็จ</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">79.3%</div>
                <p className="text-xs text-muted-foreground">เฉลี่ยทุกหลักการ</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ผลการปฏิบัติตามหลักการขาย</CardTitle>
              <CardDescription>วิเคราะห์การใช้หลักการขายในแต่ละด้าน</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {salesPrinciples.map((principle, index) => (
                  <div key={index} className="space-y-3 pb-4 border-b last:border-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{principle.principle}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{principle.notes}</p>
                      </div>
                      <Badge variant={principle.score >= 90 ? "default" : "secondary"}>
                        {principle.score}%
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">กิจกรรม:</span>
                        <span className="ml-2 font-medium">{principle.activities}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ความสำเร็จ:</span>
                        <span className="ml-2 font-medium">{principle.success}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">คะแนน:</span>
                        <span className="ml-2 font-medium">{principle.score}%</span>
                      </div>
                    </div>
                    <Progress value={principle.score} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
