import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Search, Calendar, Download, RefreshCw, FileText, Users, Clock, TrendingUp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Status configuration
const statusConfig = {
  unassigned: { label: "ยังไม่ได้รับมอบหมาย", color: "#888888" },
  designing: { label: "กำลังออกแบบ", color: "#007BFF" },
  review: { label: "รอตรวจสอบ", color: "#F9A825" },
  feedback: { label: "แก้ไขตาม Feedback", color: "#FF7043" },
  production: { label: "อยู่ระหว่างการผลิต", color: "#29B6F6" },
  completed: { label: "เสร็จสิ้น", color: "#2ECC71" },
};

// Mock data
const mockJobs = [
  { id: "1", job_code: "DG-2025-001", customer_name: "บริษัท ABC", job_type: "เหรียญรางวัล", designer: "สมชาย", start_date: "2025-01-10", due_date: "2025-01-25", status: "designing", priority: "high" },
  { id: "2", job_code: "DG-2025-002", customer_name: "โรงเรียน XYZ", job_type: "ถ้วยรางวัล", designer: "สมหญิง", start_date: "2025-01-12", due_date: "2025-01-28", status: "review", priority: "medium" },
  { id: "3", job_code: "DG-2025-003", customer_name: "บริษัท DEF", job_type: "คริสตัล", designer: "ประเสริฐ", start_date: "2025-01-15", due_date: "2025-02-01", status: "feedback", priority: "high" },
  { id: "4", job_code: "DG-2025-004", customer_name: "มหาวิทยาลัย LMN", job_type: "อะคริลิก", designer: "สมชาย", start_date: "2025-01-08", due_date: "2025-01-20", status: "production", priority: "low" },
  { id: "5", job_code: "DG-2025-005", customer_name: "บริษัท GHI", job_type: "ผ้า", designer: "สมหญิง", start_date: "2025-01-05", due_date: "2025-01-18", status: "completed", priority: "medium" },
  { id: "6", job_code: "DG-2025-006", customer_name: "สมาคม JKL", job_type: "สายคล้องคอ", designer: "ประเสริฐ", start_date: "2025-01-16", due_date: "2025-01-30", status: "unassigned", priority: "low" },
  { id: "7", job_code: "DG-2025-007", customer_name: "บริษัท MNO", job_type: "เหรียญรางวัล", designer: "", start_date: "2025-01-17", due_date: "2025-02-05", status: "unassigned", priority: "medium" },
  { id: "8", job_code: "DG-2025-008", customer_name: "โรงเรียน PQR", job_type: "ถ้วยรางวัล", designer: "สมชาย", start_date: "2025-01-14", due_date: "2025-01-26", status: "designing", priority: "high" },
  { id: "9", job_code: "DG-2025-009", customer_name: "บริษัท STU", job_type: "คริสตัล", designer: "สมหญิง", start_date: "2025-01-11", due_date: "2025-01-24", status: "feedback", priority: "high" },
  { id: "10", job_code: "DG-2025-010", customer_name: "มหาวิทยาลัย VWX", job_type: "อะคริลิก", designer: "ประเสริฐ", start_date: "2025-01-13", due_date: "2025-01-27", status: "review", priority: "medium" },
  { id: "11", job_code: "DG-2025-011", customer_name: "บริษัท AAA", job_type: "เหรียญรางวัล", designer: "วิไล", start_date: "2025-01-09", due_date: "2025-01-22", status: "production", priority: "medium" },
  { id: "12", job_code: "DG-2025-012", customer_name: "โรงเรียน BBB", job_type: "ถ้วยรางวัล", designer: "สมชาย", start_date: "2025-01-11", due_date: "2025-01-29", status: "completed", priority: "low" },
];

// Designer performance data
const designerPerformance = [
  { name: "สมชาย", completed: 45, inProgress: 12, revision: 3, avgTime: 4.2, rating: 4.8 },
  { name: "สมหญิง", completed: 38, inProgress: 8, revision: 2, avgTime: 3.8, rating: 4.9 },
  { name: "ประเสริฐ", completed: 42, inProgress: 10, revision: 4, avgTime: 4.5, rating: 4.6 },
  { name: "วิไล", completed: 28, inProgress: 6, revision: 1, avgTime: 3.5, rating: 4.7 },
];

// Monthly data for charts
const monthlyData = [
  { month: "ก.ค.", total: 45, completed: 42, onTime: 38 },
  { month: "ส.ค.", total: 52, completed: 48, onTime: 44 },
  { month: "ก.ย.", total: 48, completed: 46, onTime: 40 },
  { month: "ต.ค.", total: 55, completed: 50, onTime: 46 },
  { month: "พ.ย.", total: 60, completed: 54, onTime: 50 },
  { month: "ธ.ค.", total: 58, completed: 52, onTime: 48 },
];

// Job type distribution
const jobTypeData = [
  { name: "เหรียญรางวัล", value: 35, color: "#FFD700" },
  { name: "ถ้วยรางวัล", value: 25, color: "#C0C0C0" },
  { name: "คริสตัล", value: 15, color: "#87CEEB" },
  { name: "อะคริลิก", value: 12, color: "#FF69B4" },
  { name: "ผ้า", value: 8, color: "#8B4513" },
  { name: "สายคล้องคอ", value: 5, color: "#32CD32" },
];

export default function DesignReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [designerFilter, setDesignerFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate statistics
  const totalJobs = mockJobs.length;
  const statusCounts = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = mockJobs.filter(job => job.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  // Pie chart data
  const pieChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: statusConfig[status as keyof typeof statusConfig].label,
    value: count,
    color: statusConfig[status as keyof typeof statusConfig].color,
  }));

  // Line chart data (30 days)
  const lineChartData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: format(date, "dd/MM", { locale: th }),
      completed: Math.floor(Math.random() * 5) + 1,
      pending: Math.floor(Math.random() * 8) + 2,
    };
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">รายงานผลแผนกกราฟิก</h1>
          <p className="text-muted-foreground mt-1">วิเคราะห์และติดตามประสิทธิภาพงานออกแบบ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            รีเฟรช
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            ส่งออกรายงาน
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาจาก: รหัสงาน, ลูกค้า, ชื่องาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start gap-2">
                    <Calendar className="h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: th }) : "วันที่เริ่ม"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start gap-2">
                    <Calendar className="h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: th }) : "วันที่สิ้นสุด"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} />
                </PopoverContent>
              </Popover>

              <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="ประเภทงาน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภท</SelectItem>
                  <SelectItem value="เหรียญรางวัล">เหรียญรางวัล</SelectItem>
                  <SelectItem value="ถ้วยรางวัล">ถ้วยรางวัล</SelectItem>
                  <SelectItem value="คริสตัล">คริสตัล</SelectItem>
                  <SelectItem value="อะคริลิก">อะคริลิก</SelectItem>
                  <SelectItem value="ผ้า">ผ้า</SelectItem>
                  <SelectItem value="สายคล้องคอ">สายคล้องคอ</SelectItem>
                </SelectContent>
              </Select>

              <Select value={designerFilter} onValueChange={setDesignerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="ทุกคน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกคน</SelectItem>
                  <SelectItem value="สมชาย">สมชาย</SelectItem>
                  <SelectItem value="สมหญิง">สมหญิง</SelectItem>
                  <SelectItem value="ประเสริฐ">ประเสริฐ</SelectItem>
                  <SelectItem value="วิไล">วิไล</SelectItem>
                </SelectContent>
              </Select>

              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="ทุกลูกค้า" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกลูกค้า</SelectItem>
                  {Array.from(new Set(mockJobs.map(j => j.customer_name))).map(customer => (
                    <SelectItem key={customer} value={customer}>{customer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="ทุกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = statusCounts[status] || 0;
          const percentage = totalJobs > 0 ? (count / totalJobs) * 100 : 0;
          return (
            <Card key={status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {config.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {percentage.toFixed(1)}% ของงานทั้งหมด
                </div>
                <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: config.color
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <FileText className="h-4 w-4" />
            ภาพรวม
          </TabsTrigger>
          <TabsTrigger value="designer" className="gap-2">
            <Users className="h-4 w-4" />
            รายนักออกแบบ
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="gap-2">
            <Clock className="h-4 w-4" />
            ประสิทธิภาพ
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            แนวโน้ม
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart - Status */}
            <Card>
              <CardHeader>
                <CardTitle>สัดส่วนงานตามสถานะ</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>จำนวนงานที่เสร็จและงานค้างย้อนหลัง 30 วัน</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke="#2ECC71" name="งานเสร็จ" strokeWidth={2} />
                    <Line type="monotone" dataKey="pending" stroke="#E53935" name="งานค้าง" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Job Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>สัดส่วนประเภทงาน</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jobTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" name="จำนวนงาน">
                    {jobTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Designer Performance Tab */}
        <TabsContent value="designer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ประสิทธิภาพรายนักออกแบบ</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead className="text-center">งานเสร็จ</TableHead>
                    <TableHead className="text-center">กำลังทำ</TableHead>
                    <TableHead className="text-center">แก้ไข</TableHead>
                    <TableHead className="text-center">เวลาเฉลี่ย (วัน)</TableHead>
                    <TableHead className="text-center">คะแนน</TableHead>
                    <TableHead>ความคืบหน้า</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {designerPerformance.map((designer) => (
                    <TableRow key={designer.name}>
                      <TableCell className="font-medium">{designer.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {designer.completed}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {designer.inProgress}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                          {designer.revision}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{designer.avgTime}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-primary/10 text-primary">
                          ⭐ {designer.rating}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="w-full">
                          <Progress value={(designer.completed / 50) * 100} className="h-2" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Designer Comparison Chart */}
          <Card>
            <CardHeader>
              <CardTitle>เปรียบเทียบผลงานนักออกแบบ</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={designerPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" fill="#2ECC71" name="งานเสร็จ" />
                  <Bar dataKey="inProgress" fill="#007BFF" name="กำลังทำ" />
                  <Bar dataKey="revision" fill="#FF7043" name="แก้ไข" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Efficiency Tab */}
        <TabsContent value="efficiency" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">เวลาเฉลี่ยต่องาน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">4.0 วัน</div>
                <p className="text-xs text-green-600 mt-1">-0.5 วัน จากเดือนก่อน</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">อัตราส่งตรงเวลา</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">92%</div>
                <p className="text-xs text-green-600 mt-1">+3% จากเดือนก่อน</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">อัตราแก้ไขงาน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-500">15%</div>
                <p className="text-xs text-red-600 mt-1">+2% จากเดือนก่อน</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">ความพึงพอใจลูกค้า</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">4.7/5</div>
                <p className="text-xs text-green-600 mt-1">+0.2 จากเดือนก่อน</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ประสิทธิภาพรายเดือน</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#888888" name="งานทั้งหมด" />
                  <Bar dataKey="completed" fill="#2ECC71" name="งานเสร็จ" />
                  <Bar dataKey="onTime" fill="#007BFF" name="ส่งตรงเวลา" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>แนวโน้มงานรายเดือน (6 เดือน)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#888888" name="งานทั้งหมด" strokeWidth={2} />
                  <Line type="monotone" dataKey="completed" stroke="#2ECC71" name="งานเสร็จ" strokeWidth={2} />
                  <Line type="monotone" dataKey="onTime" stroke="#007BFF" name="ส่งตรงเวลา" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ประเภทงานยอดนิยม</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobTypeData.map((type, index) => (
                    <div key={type.name} className="flex items-center gap-4">
                      <div className="text-lg font-bold text-muted-foreground w-6">{index + 1}</div>
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: type.color }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{type.name}</span>
                          <span className="text-sm text-muted-foreground">{type.value} งาน</span>
                        </div>
                        <Progress value={type.value} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>สรุปประจำเดือน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">งานใหม่</span>
                    <Badge className="bg-blue-100 text-blue-700">58 งาน</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">งานเสร็จ</span>
                    <Badge className="bg-green-100 text-green-700">52 งาน</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">งานค้าง</span>
                    <Badge className="bg-orange-100 text-orange-700">6 งาน</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">งานล่าช้า</span>
                    <Badge className="bg-red-100 text-red-700">2 งาน</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
