import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
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
  Area,
  AreaChart
} from "recharts";
import {
  FileBarChart,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Clock,
  AlertTriangle,
  Target,
  Calendar as CalendarIcon,
  Download,
  Filter,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("operational");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [date, setDate] = useState<Date>(new Date());

  // Sample data for charts
  const orderStatusData = [
    { name: "รออนุมัติ", value: 12, color: "#f59e0b" },
    { name: "กำลังผลิต", value: 25, color: "#3b82f6" },
    { name: "รอจัดส่ง", value: 8, color: "#8b5cf6" },
    { name: "จัดส่งแล้ว", value: 45, color: "#10b981" },
  ];

  const productionEfficiencyData = [
    { month: "ม.ค.", produced: 120, defective: 5 },
    { month: "ก.พ.", produced: 135, defective: 7 },
    { month: "มี.ค.", produced: 155, defective: 4 },
    { month: "เม.ย.", produced: 142, defective: 6 },
    { month: "พ.ค.", produced: 160, defective: 3 },
    { month: "มิ.ย.", produced: 175, defective: 8 },
  ];

  const profitLossData = [
    { month: "ม.ค.", revenue: 850000, cost: 620000, profit: 230000 },
    { month: "ก.พ.", revenue: 920000, cost: 680000, profit: 240000 },
    { month: "มี.ค.", revenue: 1100000, cost: 780000, profit: 320000 },
    { month: "เม.ย.", revenue: 980000, cost: 720000, profit: 260000 },
    { month: "พ.ค.", revenue: 1200000, cost: 850000, profit: 350000 },
    { month: "มิ.ย.", revenue: 1350000, cost: 920000, profit: 430000 },
  ];

  const expenseData = [
    { category: "ค่าวัสดุ", amount: 450000, percentage: 45 },
    { category: "ค่าแรง", amount: 320000, percentage: 32 },
    { category: "ค่าสาธารณูปโภค", amount: 85000, percentage: 8.5 },
    { category: "ค่าเช่า", amount: 95000, percentage: 9.5 },
    { category: "อื่นๆ", amount: 50000, percentage: 5 },
  ];

  const kpiData = [
    { department: "ฝ่ายขาย", target: 90, actual: 92, performance: "เกินเป้า" },
    { department: "ฝ่ายผลิต", target: 85, actual: 88, performance: "เกินเป้า" },
    { department: "ฝ่ายกราฟิก", target: 95, actual: 89, performance: "ต่ำกว่าเป้า" },
    { department: "ฝ่ายจัดซื้อ", target: 80, actual: 85, performance: "เกินเป้า" },
  ];

  const inventoryData = [
    { item: "กระดาษ A4", current: 250, minimum: 100, status: "ปกติ" },
    { item: "หมึกพิมพ์", current: 45, minimum: 50, status: "ใกล้หมด" },
    { item: "ฟิล์มพลาสติก", current: 15, minimum: 30, status: "ขาดแคลน" },
    { item: "กาว", current: 180, minimum: 100, status: "ปกติ" },
    { item: "ป้ายสติกเกอร์", current: 35, minimum: 40, status: "ใกล้หมด" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ปกติ": return "bg-success";
      case "ใกล้หมด": return "bg-warning";
      case "ขาดแคลน": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "ปกติ": return "text-success-foreground";
      case "ใกล้หมด": return "text-warning-foreground";
      case "ขาดแคลน": return "text-destructive-foreground";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileBarChart className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">รายงานผล</h1>
            <p className="text-muted-foreground">รายงานประสิทธิภาพและผลการดำเนินงานทั้งองค์กร</p>
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
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="operational" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            การดำเนินงาน
          </TabsTrigger>
          <TabsTrigger value="personnel" className="gap-2">
            <Users className="w-4 h-4" />
            บุคลากร
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="w-4 h-4" />
            สินค้าคงคลัง
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operational" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ออเดอร์ทั้งหมด</CardTitle>
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">90</div>
                <p className="text-xs text-muted-foreground">+15% จากเดือนที่แล้ว</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">เวลาเฉลี่ยต่อออเดอร์</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5.2 วัน</div>
                <p className="text-xs text-muted-foreground">-0.5 วันจากเดือนที่แล้ว</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">อัตราของเสีย</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2%</div>
                <p className="text-xs text-muted-foreground">-1.1% จากเดือนที่แล้ว</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ผลิตภัณฑ์ต่อวัน</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">175</div>
                <p className="text-xs text-muted-foreground">+12% จากเดือนที่แล้ว</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>สถานะออเดอร์</CardTitle>
                <CardDescription>การกระจายตัวของออเดอร์ตามสถานะ</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ประสิทธิภาพการผลิต</CardTitle>
                <CardDescription>ชิ้นงานที่ผลิตได้และอัตราของเสีย</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productionEfficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="produced" fill="#10b981" name="ผลิตได้" />
                    <Bar dataKey="defective" fill="#ef4444" name="ของเสีย" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        <TabsContent value="personnel" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">พนักงานทั้งหมด</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">32</div>
                <p className="text-xs text-muted-foreground">+2 คนจากเดือนที่แล้ว</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">KPI เฉลี่ย</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">88.5%</div>
                <p className="text-xs text-muted-foreground">+3.2% จากเดือนที่แล้ว</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ค่าคอมมิชชัน</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿125,400</div>
                <p className="text-xs text-muted-foreground">+8% จากเดือนที่แล้ว</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">อัตราการมาทำงาน</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">-1.1% จากเดือนที่แล้ว</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ผลงาน KPI ตามแผนก</CardTitle>
              <CardDescription>เปรียบเทียบผลงานจริงกับเป้าหมายแต่ละแผนก</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kpiData.map((dept, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{dept.department}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {dept.actual}% / {dept.target}%
                        </span>
                        <Badge variant={dept.performance === "เกินเป้า" ? "default" : "destructive"}>
                          {dept.performance}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Progress value={dept.target} className="h-2 bg-muted" />
                      </div>
                      <div className="flex-1">
                        <Progress 
                          value={dept.actual} 
                          className={`h-2 ${dept.actual >= dept.target ? 'bg-success' : 'bg-destructive'}`} 
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>เป้าหมาย</span>
                      <span>ผลงานจริง</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">รายการทั้งหมด</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">525</div>
                <p className="text-xs text-muted-foreground">รายการในคลัง</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ใกล้หมด</CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">4</div>
                <p className="text-xs text-muted-foreground">รายการต้องเติมสต็อก</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ขาดแคลน</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">1</div>
                <p className="text-xs text-muted-foreground">รายการต้องสั่งซื้อด่วน</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>สถานะสินค้าคงคลัง</CardTitle>
              <CardDescription>รายการสินค้าและสถานะปัจจุบัน</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.item}</h3>
                      <p className="text-sm text-muted-foreground">
                        คงเหลือ: {item.current} | ขั้นต่ำ: {item.minimum}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={(item.current / (item.minimum * 2)) * 100} 
                        className="w-24 h-2" 
                      />
                      <Badge className={`${getStatusColor(item.status)} ${getStatusTextColor(item.status)}`}>
                        {item.status}
                      </Badge>
                    </div>
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