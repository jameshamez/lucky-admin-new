import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Plus, Search, Calendar } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Status configuration - 6 สถานะหลักเท่านั้น
const statusConfig = {
  unassigned: { label: "ยังไม่ได้รับมอบหมาย", color: "#888888", bgColor: "bg-gray-500" },
  designing: { label: "กำลังออกแบบ", color: "#007BFF", bgColor: "bg-blue-500" },
  review: { label: "รอตรวจสอบ", color: "#F9A825", bgColor: "bg-yellow-500" },
  feedback: { label: "แก้ไขตาม Feedback", color: "#FF7043", bgColor: "bg-orange-500" },
  production: { label: "อยู่ระหว่างการผลิต", color: "#29B6F6", bgColor: "bg-cyan-500" },
  completed: { label: "เสร็จสิ้น", color: "#2ECC71", bgColor: "bg-green-500" },
};

// Mock data for design jobs - ใช้เฉพาะ 6 สถานะหลัก
const mockJobs = [
  { id: "1", job_code: "DG-2025-001", customer_name: "บริษัท ABC", job_type: "เหรียญรางวัล", designer: "สมชาย", start_date: "2025-01-10", due_date: "2025-01-25", status: "designing", priority: "high", description: "เหรียญรางวัลแข่งขันกีฬา" },
  { id: "2", job_code: "DG-2025-002", customer_name: "โรงเรียน XYZ", job_type: "ถ้วยรางวัล", designer: "สมหญิง", start_date: "2025-01-12", due_date: "2025-01-28", status: "review", priority: "medium", description: "ถ้วยรางวัลนักเรียนดีเด่น" },
  { id: "3", job_code: "DG-2025-003", customer_name: "บริษัท DEF", job_type: "คริสตัล", designer: "ประเสริฐ", start_date: "2025-01-15", due_date: "2025-02-01", status: "feedback", priority: "high", description: "คริสตัลโล่รางวัล" },
  { id: "4", job_code: "DG-2025-004", customer_name: "มหาวิทยาลัย LMN", job_type: "อะคริลิก", designer: "สมชาย", start_date: "2025-01-08", due_date: "2025-01-20", status: "production", priority: "low", description: "ป้ายอะคริลิก" },
  { id: "5", job_code: "DG-2025-005", customer_name: "บริษัท GHI", job_type: "ผ้า", designer: "สมหญิง", start_date: "2025-01-05", due_date: "2025-01-18", status: "completed", priority: "medium", description: "ผ้าแบนเนอร์" },
  { id: "6", job_code: "DG-2025-006", customer_name: "สมาคม JKL", job_type: "สายคล้องคอ", designer: "ประเสริฐ", start_date: "2025-01-16", due_date: "2025-01-30", status: "unassigned", priority: "low", description: "สายคล้องคอ ID Card" },
  { id: "7", job_code: "DG-2025-007", customer_name: "บริษัท MNO", job_type: "เหรียญรางวัล", designer: "", start_date: "2025-01-17", due_date: "2025-02-05", status: "unassigned", priority: "medium", description: "เหรียญรางวัลพนักงานดีเด่น" },
  { id: "8", job_code: "DG-2025-008", customer_name: "โรงเรียน PQR", job_type: "ถ้วยรางวัล", designer: "สมชาย", start_date: "2025-01-14", due_date: "2025-01-26", status: "designing", priority: "high", description: "ถ้วยรางวัลแข่งขันวิชาการ" },
  { id: "9", job_code: "DG-2025-009", customer_name: "บริษัท STU", job_type: "คริสตัล", designer: "สมหญิง", start_date: "2025-01-11", due_date: "2025-01-24", status: "feedback", priority: "high", description: "คริสตัลรางวัล - รอข้อมูล Logo" },
  { id: "10", job_code: "DG-2025-010", customer_name: "มหาวิทยาลัย VWX", job_type: "อะคริลิก", designer: "ประเสริฐ", start_date: "2025-01-13", due_date: "2025-01-27", status: "review", priority: "medium", description: "โล่อะคริลิกรางวัล" },
  { id: "11", job_code: "DG-2025-011", customer_name: "บริษัท AAA", job_type: "เหรียญรางวัล", designer: "วิไล", start_date: "2025-01-09", due_date: "2025-01-22", status: "production", priority: "medium", description: "เหรียญรางวัลพนักงานดีเด่น" },
  { id: "12", job_code: "DG-2025-012", customer_name: "โรงเรียน BBB", job_type: "ถ้วยรางวัล", designer: "สมชาย", start_date: "2025-01-11", due_date: "2025-01-29", status: "completed", priority: "low", description: "ถ้วยรางวัลกีฬาสี" },
];

// Mock data for line chart (30 days)
const lineChartData = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: format(date, "dd/MM", { locale: th }),
    completed: Math.floor(Math.random() * 5) + 1,
    pending: Math.floor(Math.random() * 8) + 2,
  };
});

// Mock data for bar chart (6 months)
const barChartData = Array.from({ length: 6 }, (_, i) => {
  const date = new Date();
  date.setMonth(date.getMonth() - (5 - i));
  return {
    month: format(date, "MMM", { locale: th }),
    "เหรียญรางวัล": Math.floor(Math.random() * 15) + 5,
    "ถ้วยรางวัล": Math.floor(Math.random() * 12) + 3,
    "คริสตัล": Math.floor(Math.random() * 8) + 2,
    "อะคริลิก": Math.floor(Math.random() * 10) + 4,
    "ผ้า": Math.floor(Math.random() * 6) + 1,
    "สายคล้องคอ": Math.floor(Math.random() * 20) + 10,
  };
});

export default function DesignDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [jobTypeFilter, setJobTypeFilter] = useState("all");
  const [designerFilter, setDesignerFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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

  // Filter jobs for urgent table (designing, feedback, review)
  const urgentJobs = mockJobs
    .filter(job => ["designing", "feedback", "review"].includes(job.status))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 10);

  const calculateDaysLeft = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">แดชบอร์ดฝ่ายกราฟิก</h1>
        <p className="text-muted-foreground mt-1">ภาพรวมงานออกแบบทั้งหมด</p>
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
                  <SelectValue placeholder="ผู้รับผิดชอบ" />
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
                  <SelectValue placeholder="ลูกค้า" />
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
                  <SelectValue placeholder="สถานะงาน" />
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

      {/* Summary Cards - แสดงเฉพาะ 6 สถานะ */}
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
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

      {/* Bar Chart - Stacked */}
      <Card>
        <CardHeader>
          <CardTitle>ประเภทงานรายเดือน (6 เดือนล่าสุด)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="เหรียญรางวัล" stackId="a" fill="#FFD700" />
              <Bar dataKey="ถ้วยรางวัล" stackId="a" fill="#C0C0C0" />
              <Bar dataKey="คริสตัล" stackId="a" fill="#87CEEB" />
              <Bar dataKey="อะคริลิก" stackId="a" fill="#FF69B4" />
              <Bar dataKey="ผ้า" stackId="a" fill="#8B4513" />
              <Bar dataKey="สายคล้องคอ" stackId="a" fill="#32CD32" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Urgent Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>งานที่ต้องเร่งดำเนินการ (Top 10)</CardTitle>
          <p className="text-sm text-muted-foreground">
            งานสถานะ "กำลังออกแบบ, แก้ไข Feedback, รอตรวจสอบ" ที่ใกล้กำหนดส่งที่สุด
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสงาน</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>ประเภทงาน</TableHead>
                <TableHead>วันกำหนดส่ง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ความสำคัญ</TableHead>
                <TableHead>เหลืออีก</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {urgentJobs.map((job) => {
                const daysLeft = calculateDaysLeft(job.due_date);
                const isOverdue = daysLeft < 0;
                const config = statusConfig[job.status as keyof typeof statusConfig];
                
                return (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.job_code}</TableCell>
                    <TableCell>{job.customer_name}</TableCell>
                    <TableCell>{job.job_type}</TableCell>
                    <TableCell>{format(new Date(job.due_date), "dd/MM/yyyy", { locale: th })}</TableCell>
                    <TableCell>
                      <Badge className={`${config.bgColor} text-white`}>
                        {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        job.priority === "high" ? "destructive" :
                        job.priority === "medium" ? "default" : "secondary"
                      }>
                        {job.priority === "high" ? "สูง" : job.priority === "medium" ? "กลาง" : "ต่ำ"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={isOverdue ? "text-red-500 font-bold" : ""}>
                        {isOverdue ? `เกิน ${Math.abs(daysLeft)} วัน` : `${daysLeft} วัน`}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline">เปิดงาน</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
