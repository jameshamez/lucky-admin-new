import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { CalendarIcon, RefreshCw, Download, Filter, TrendingUp, TrendingDown, DollarSign, Users, Package, Activity } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";

// Sample data
const financialData = [
  { month: "ม.ค.", revenue: 2400000, costs: 1800000, profit: 600000 },
  { month: "ก.พ.", revenue: 2100000, costs: 1600000, profit: 500000 },
  { month: "มี.ค.", revenue: 2800000, costs: 2000000, profit: 800000 },
  { month: "เม.ย.", revenue: 2200000, costs: 1700000, profit: 500000 },
  { month: "พ.ค.", revenue: 3200000, costs: 2300000, profit: 900000 },
  { month: "มิ.ย.", revenue: 2900000, costs: 2100000, profit: 800000 }
];

const operationalData = [
  { department: "ฝ่ายขาย", orders: 85, avgTime: 3.2, efficiency: 92 },
  { department: "ฝ่ายกราฟิก", orders: 78, avgTime: 2.8, efficiency: 88 },
  { department: "ฝ่ายผลิต", orders: 92, avgTime: 4.1, efficiency: 85 },
  { department: "ฝ่ายจัดซื้อ", orders: 67, avgTime: 2.5, efficiency: 94 }
];

const salesData = [
  { product: "ป้ายไวนิล", sales: 450000, quantity: 89, growth: 12 },
  { product: "นามบัตร", sales: 280000, quantity: 156, growth: -5 },
  { product: "สติ๊กเกอร์", sales: 320000, quantity: 234, growth: 18 },
  { product: "โบรชัวร์", sales: 180000, quantity: 45, growth: 8 },
  { product: "ปฏิทิน", sales: 220000, quantity: 67, growth: 15 }
];

const customerData = [
  { segment: "ลูกค้าใหม่", count: 45, revenue: 890000 },
  { segment: "ลูกค้าประจำ", count: 123, revenue: 2400000 },
  { segment: "ลูกค้า VIP", count: 18, revenue: 1200000 }
];

const kpiData = [
  { name: "ยอดขายรวม", value: "4.2M", change: 12, trend: "up" },
  { name: "ต้นทุนรวม", value: "3.1M", change: 8, trend: "up" },
  { name: "กำไรสุทธิ", value: "1.1M", change: 18, trend: "up" },
  { name: "จำนวนออเดอร์", value: "342", change: 15, trend: "up" },
  { name: "ลูกค้าใหม่", value: "45", change: 22, trend: "up" },
  { name: "เวลาเฉลี่ย", value: "3.2 วัน", change: -5, trend: "down" }
];

const COLORS = ['#FF5A5F', '#FF7F8A', '#FFA5A8', '#FFB3B5', '#FFC2C3'];

export default function ComprehensiveReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [date, setDate] = useState<Date>(new Date());
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [activeTab, setActiveTab] = useState("financial");

  const handleExport = (format: string) => {
    toast.success(`ส่งออกรายงานเป็น ${format.toUpperCase()} สำเร็จ`);
  };

  const handleRefresh = () => {
    toast.success("อัปเดตข้อมูลสำเร็จ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">รายงานผลรวมทั้งหมด</h1>
        <p className="text-muted-foreground">
          ศูนย์บัญชาการข้อมูลขององค์กร สำหรับวิเคราะห์ประสิทธิภาพและการตัดสินใจเชิงธุรกิจ
        </p>
      </div>

      {/* Control Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="เลือกช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">รายวัน</SelectItem>
                  <SelectItem value="weekly">รายสัปดาห์</SelectItem>
                  <SelectItem value="monthly">รายเดือน</SelectItem>
                  <SelectItem value="quarterly">รายไตรมาส</SelectItem>
                  <SelectItem value="yearly">รายปี</SelectItem>
                  <SelectItem value="custom">กำหนดเอง</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: th }) : "เลือกวันที่"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>

            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="เลือกแผนก" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกแผนก</SelectItem>
                <SelectItem value="sales">ฝ่ายขาย</SelectItem>
                <SelectItem value="design">ฝ่ายกราฟิก</SelectItem>
                <SelectItem value="production">ฝ่ายผลิต</SelectItem>
                <SelectItem value="procurement">ฝ่ายจัดซื้อ</SelectItem>
                <SelectItem value="accounting">ฝ่ายบัญชี</SelectItem>
                <SelectItem value="hr">ฝ่ายบุคคล</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto flex gap-2">
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                รีเฟรช
              </Button>
              <Button variant="outline" onClick={() => handleExport("pdf")}>
                <Download className="w-4 h-4 mr-2" />
                ส่งออก PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport("excel")}>
                <Download className="w-4 h-4 mr-2" />
                ส่งออก Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.name}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.name}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
                <div className={`flex items-center gap-1 ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{Math.abs(kpi.change)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="financial">รายงานทางการเงิน</TabsTrigger>
          <TabsTrigger value="operational">รายงานประสิทธิภาพการดำเนินงาน</TabsTrigger>
          <TabsTrigger value="sales">รายงานการขายและลูกค้า</TabsTrigger>
        </TabsList>

        {/* Financial Reports */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>รายรับ - รายจ่าย 6 เดือนย้อนหลัง</CardTitle>
                <CardDescription>เปรียบเทียบรายรับและรายจ่ายรายเดือน</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [
                        new Intl.NumberFormat('th-TH').format(value), 
                        value === financialData[0]?.revenue ? 'รายรับ' : value === financialData[0]?.costs ? 'รายจ่าย' : 'กำไร'
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#FF5A5F" name="รายรับ" />
                    <Bar dataKey="costs" fill="#FFA5A8" name="รายจ่าย" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>แนวโน้มกำไรสุทธิ</CardTitle>
                <CardDescription>การเปลี่ยนแปลงของกำไรในช่วง 6 เดือน</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => [new Intl.NumberFormat('th-TH').format(value), 'กำไร']} />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#FF5A5F" 
                      strokeWidth={2}
                      dot={{ fill: '#FF5A5F', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>สรุปผลการดำเนินงานทางการเงิน</CardTitle>
              <CardDescription>ตารางรายละเอียดรายรับและรายจ่ายรายเดือน</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เดือน</TableHead>
                    <TableHead className="text-right">รายรับ (บาท)</TableHead>
                    <TableHead className="text-right">รายจ่าย (บาท)</TableHead>
                    <TableHead className="text-right">กำไรสุทธิ (บาท)</TableHead>
                    <TableHead className="text-right">อัตรากำไร (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialData.map((item) => (
                    <TableRow key={item.month}>
                      <TableCell className="font-medium">{item.month}</TableCell>
                      <TableCell className="text-right">{new Intl.NumberFormat('th-TH').format(item.revenue)}</TableCell>
                      <TableCell className="text-right">{new Intl.NumberFormat('th-TH').format(item.costs)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {new Intl.NumberFormat('th-TH').format(item.profit)}
                      </TableCell>
                      <TableCell className="text-right">
                        {((item.profit / item.revenue) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operational Reports */}
        <TabsContent value="operational" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ประสิทธิภาพการทำงานตามแผนก</CardTitle>
                <CardDescription>เปรียบเทียบประสิทธิภาพการทำงานของแต่ละแผนก</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {operationalData.map((dept) => (
                  <div key={dept.department} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{dept.department}</span>
                      <Badge variant="outline">{dept.efficiency}%</Badge>
                    </div>
                    <Progress value={dept.efficiency} className="h-2" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>ออเดอร์: {dept.orders}</span>
                      <span>เวลาเฉลี่ย: {dept.avgTime} วัน</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>จำนวนออเดอร์ตามแผนก</CardTitle>
                <CardDescription>การกระจายของออเดอร์ในแต่ละแผนก</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={operationalData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.department}: ${entry.orders}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="orders"
                    >
                      {operationalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>รายละเอียดการดำเนินงานตามแผนก</CardTitle>
              <CardDescription>ข้อมูลครบถ้วนของการทำงานในแต่ละแผนก</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>แผนก</TableHead>
                    <TableHead className="text-right">จำนวนออเดอร์</TableHead>
                    <TableHead className="text-right">เวลาเฉลี่ย (วัน)</TableHead>
                    <TableHead className="text-right">ประสิทธิภาพ (%)</TableHead>
                    <TableHead className="text-right">สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operationalData.map((item) => (
                    <TableRow key={item.department}>
                      <TableCell className="font-medium">{item.department}</TableCell>
                      <TableCell className="text-right">{item.orders}</TableCell>
                      <TableCell className="text-right">{item.avgTime}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress value={item.efficiency} className="w-16 h-2" />
                          <span>{item.efficiency}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={item.efficiency >= 90 ? "default" : item.efficiency >= 80 ? "secondary" : "destructive"}
                          className={
                            item.efficiency >= 90 
                              ? "bg-green-100 text-green-800" 
                              : item.efficiency >= 80 
                                ? "bg-yellow-100 text-yellow-800" 
                                : "bg-red-100 text-red-800"
                          }
                        >
                          {item.efficiency >= 90 ? "ดีเยี่ยม" : item.efficiency >= 80 ? "ดี" : "ต้องปรับปรุง"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Reports */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ยอดขายตามประเภทสินค้า</CardTitle>
                <CardDescription>เปรียบเทียบยอดขายของสินค้าแต่ละประเภท</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="product" type="category" width={80} />
                    <Tooltip formatter={(value: number) => [new Intl.NumberFormat('th-TH').format(value), 'ยอดขาย']} />
                    <Bar dataKey="sales" fill="#FF5A5F" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>การกระจายลูกค้า</CardTitle>
                <CardDescription>แบ่งตามกลุ่มลูกค้าและมูลค่ารายรับ</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.segment}: ${entry.count} คน`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {customerData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>รายละเอียดยอดขายสินค้า</CardTitle>
                <CardDescription>ข้อมูลยอดขายและการเติบโตของแต่ละสินค้า</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {salesData.map((item) => (
                    <div key={item.product} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <h4 className="font-medium">{item.product}</h4>
                        <p className="text-sm text-muted-foreground">{item.quantity} รายการ</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{new Intl.NumberFormat('th-TH').format(item.sales)} บาท</p>
                        <div className="flex items-center gap-1">
                          {item.growth >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-600" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-600" />
                          )}
                          <span className={`text-sm ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.growth > 0 ? '+' : ''}{item.growth}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>สรุปข้อมูลลูกค้า</CardTitle>
                <CardDescription>การแบ่งกลุ่มลูกค้าตามมูลค่าและจำนวน</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerData.map((segment) => (
                    <div key={segment.segment} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{segment.segment}</span>
                        <Badge variant="outline">{segment.count} คน</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">รายรับ:</span>
                        <span className="font-medium">{new Intl.NumberFormat('th-TH').format(segment.revenue)} บาท</span>
                      </div>
                      <Progress 
                        value={(segment.revenue / Math.max(...customerData.map(c => c.revenue))) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}