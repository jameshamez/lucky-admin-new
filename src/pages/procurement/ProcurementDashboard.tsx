import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShoppingCart,
  AlertCircle,
  FileText,
  Package,
  Truck,
  CheckCircle,
  Calendar as CalendarIcon,
  DollarSign,
  ClipboardList,
  BarChart3,
  Filter,
  Download,
  TrendingUp,
  Target,
  Plane,
  Users,
  AlertTriangle,
  Clock
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { format } from "date-fns";
import { th } from "date-fns/locale";
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Initialize moment localizer for calendar
const localizer = momentLocalizer(moment);

// Sample data for charts and KPIs
const monthlyData = [
  { month: "ม.ค.", calculated: 45, produced: 38, delivered: 35 },
  { month: "ก.พ.", calculated: 52, produced: 45, delivered: 42 },
  { month: "มี.ค.", calculated: 48, produced: 48, delivered: 38 },
  { month: "เม.ย.", calculated: 61, produced: 52, delivered: 49 },
  { month: "พ.ค.", calculated: 55, produced: 58, delivered: 52 },
  { month: "มิ.ย.", calculated: 67, produced: 61, delivered: 58 }
];

const kpiData = {
  totalCalculated: 125,
  totalProduced: 95, 
  totalDelivered: 82,
  weeklyShipments: 12,
  unpaidOrders: "฿2,450,000",
  todaysTasks: 8,
  criticalAlerts: 3
};

const dailyTrendData = [
  { date: "1", calculated: 5, produced: 4, delivered: 3 },
  { date: "2", calculated: 8, produced: 6, delivered: 5 },
  { date: "3", calculated: 6, produced: 7, delivered: 6 },
  { date: "4", calculated: 9, produced: 8, delivered: 7 },
  { date: "5", calculated: 12, produced: 9, delivered: 8 },
  { date: "6", calculated: 7, produced: 11, delivered: 9 },
  { date: "7", calculated: 10, produced: 8, delivered: 10 }
];

const productTypeData = [
  { name: "เหรียญ", value: 35, color: "#8884d8" },
  { name: "ถ้วยรางวัล", value: 25, color: "#82ca9d" },
  { name: "คริสตัล", value: 20, color: "#ffc658" },
  { name: "อะคริลิก", value: 12, color: "#ff7300" },
  { name: "อื่นๆ", value: 8, color: "#d084d0" }
];

const chartConfig = {
  calculated: {
    label: "คำนวณราคา",
    color: "#3b82f6"
  },
  produced: {
    label: "สั่งผลิต", 
    color: "#f97316"
  },
  delivered: {
    label: "จัดส่งแล้ว",
    color: "#10b981"
  }
};

const recentJobs = [
  {
    id: "680724-01-Z",
    project: "เหรียญรางวัลวิ่ง",
    status: "กำลังผลิต",
    updateTime: "09:34 วันนี้",
    priority: "สูง"
  },
  {
    id: "680729-05-W", 
    project: "ถ้วยคริสตัล",
    status: "จัดส่งแล้ว",
    updateTime: "08:45 วันนี้",
    priority: "กลาง"
  },
  {
    id: "680730-02-Y",
    project: "โล่อะคริลิก",
    status: "รอคำนวณราคา", 
    updateTime: "07:20 วันนี้",
    priority: "สูง"
  }
];

// Calendar events data
const calendarEvents = [
  {
    id: 1,
    title: "โปรเจกต์ XYZ - จัดส่งจากจีน",
    start: new Date(2024, 11, 15, 10, 0),
    end: new Date(2024, 11, 15, 12, 0),
    type: "shipping",
    project: "วิ่งเลาะเวียง",
    responsible: "คุณสมชาย"
  },
  {
    id: 2,
    title: "สินค้าถึงไทย - ABC",
    start: new Date(2024, 11, 18, 14, 0),
    end: new Date(2024, 11, 18, 16, 0),
    type: "arrival",
    project: "งานแข่งขันกีฬา",
    responsible: "คุณสมหญิง"
  },
  {
    id: 3,
    title: "ประชุมทีมจัดซื้อ",
    start: new Date(2024, 11, 20, 9, 0),
    end: new Date(2024, 11, 20, 10, 30),
    type: "meeting",
    project: "การประชุม",
    responsible: "ทีมจัดซื้อ"
  }
];

// Today's tasks
const todaysTasks = [
  { id: 1, task: "ติดตามสถานะการส่งออกงาน 680721-01-Z", priority: "สูง", dueTime: "10:00", status: "pending" },
  { id: 2, task: "อัปเดตราคาวัสดุจากโรงงาน Y", priority: "ปานกลาง", dueTime: "14:00", status: "pending" },
  { id: 3, task: "ยืนยันใบสั่งซื้อเลขที่ PO-240615", priority: "ต่ำ", dueTime: "16:30", status: "completed" },
  { id: 4, task: "ประชุมกับซัพพลายเออร์", priority: "สูง", dueTime: "15:00", status: "pending" }
];

// Critical alerts
const criticalAlerts = [
  {
    id: 1,
    message: "งานรหัส 680721-01-Z ต้องส่งออกจากจีนภายใน 3 วัน",
    type: "urgent",
    project: "วิ่งเลาะเวียง",
    daysLeft: 3
  },
  {
    id: 2,
    message: "ใบสั่งซื้อ PO-240612 ยังไม่ได้รับการยืนยันจากโรงงาน",
    type: "warning",
    project: "งานแข่งขันกีฬา",
    daysLeft: 5
  }
];

// Recent activities
const recentActivities = [
  {
    id: 1,
    user: "คุณสมชาย",
    action: "อัปเดตสถานะ 'โปรเจกต์ ABC' เป็น 'สินค้าถึงไทย'",
    time: "14:30 น.",
    type: "status_update"
  },
  {
    id: 2,
    user: "คุณสมหญิง",
    action: "สั่งผลิตงาน 680724-01-Z เรียบร้อยแล้ว",
    time: "11:45 น.",
    type: "production_order"
  },
  {
    id: 3,
    user: "คุณวิชาญ",
    action: "อนุมัติราคางาน 680723-05-W",
    time: "09:15 น.",
    type: "approval"
  }
];

export default function ProcurementDashboard() {
  const [dateRange, setDateRange] = useState("monthly");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [productFilter, setProductFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [calendarView, setCalendarView] = useState("month");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const eventStyleGetter = (event: any) => {
    let backgroundColor = '#3b82f6';
    
    switch (event.type) {
      case 'shipping':
        backgroundColor = '#f97316';
        break;
      case 'arrival':
        backgroundColor = '#10b981';
        break;
      case 'meeting':
        backgroundColor = '#3b82f6';
        break;
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  const CustomEvent = ({ event }: any) => (
    <span className="text-xs">
      {event.type === 'shipping' && '✈️ '}
      {event.type === 'arrival' && '📦 '}
      {event.type === 'meeting' && '📅 '}
      {event.title}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">รายงานและสรุปยอด</h1>
          <p className="text-muted-foreground">ภาพรวมการดำเนินงานฝ่ายจัดซื้อ และการติดตามผลผลิตแบบเรียลไทม์</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            ส่งออกรายงาน
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            ตัวกรองและการแสดงผล
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateRange">ช่วงเวลา</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">รายวัน</SelectItem>
                  <SelectItem value="weekly">รายสัปดาห์</SelectItem>
                  <SelectItem value="monthly">รายเดือน</SelectItem>
                  <SelectItem value="yearly">รายปี</SelectItem>
                  <SelectItem value="custom">กำหนดเอง</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <div>
                <Label>เลือกวันที่</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP", { locale: th }) : "เลือกวันที่"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div>
              <Label htmlFor="productFilter">ประเภทสินค้า</Label>
              <Select value={productFilter} onValueChange={setProductFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="medal">เหรียญ</SelectItem>
                  <SelectItem value="trophy">ถ้วยรางวัล</SelectItem>
                  <SelectItem value="crystal">คริสตัล</SelectItem>
                  <SelectItem value="acrylic">อะคริลิก</SelectItem>
                  <SelectItem value="fabric">ผ้า</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="statusFilter">สถานะ</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="calculated">คำนวณราคา</SelectItem>
                  <SelectItem value="produced">สั่งผลิต</SelectItem>
                  <SelectItem value="delivered">จัดส่งแล้ว</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="✅ คำนวณราคาทั้งหมด"
          value={`${kpiData.totalCalculated} งาน`}
          change="+12% จากเดือนที่แล้ว"
          icon={<Target className="w-6 h-6" />}
          trend="up"
          className="border-l-4 border-l-blue-500"
        />
        <StatsCard
          title="🛠️ สั่งผลิตแล้ว"
          value={`${kpiData.totalProduced} งาน`}
          change="+8% จากเดือนที่แล้ว"
          icon={<Package className="w-6 h-6" />}
          trend="up"
          className="border-l-4 border-l-orange-500"
        />
        <StatsCard
          title="จำนวนงานต้องส่งออกสัปดาห์นี้"
          value={`${kpiData.weeklyShipments} งาน`}
          change="+3 จากสัปดาห์ที่แล้ว"
          icon={<Plane className="w-6 h-6" />}
          trend="up"
          className="border-l-4 border-l-purple-500"
        />
        <StatsCard
          title="ยอดสั่งซื้อที่ยังไม่ชำระเงิน"
          value={kpiData.unpaidOrders}
          change="-5% จากเดือนที่แล้ว"
          icon={<DollarSign className="w-6 h-6" />}
          trend="down"
          className="border-l-4 border-l-red-500"
        />
      </div>

      {/* Main Calendar - Full Width */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              ปฏิทินกิจกรรมหลัก
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant={calendarView === "month" ? "default" : "outline"} 
                size="sm"
                onClick={() => setCalendarView("month")}
              >
                เดือน
              </Button>
              <Button 
                variant={calendarView === "week" ? "default" : "outline"} 
                size="sm"
                onClick={() => setCalendarView("week")}
              >
                สัปดาห์
              </Button>
              <Button 
                variant={calendarView === "day" ? "default" : "outline"} 
                size="sm"
                onClick={() => setCalendarView("day")}
              >
                วัน
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <BigCalendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              view={calendarView as any}
              onView={setCalendarView}
              onSelectEvent={handleEventClick}
              eventPropGetter={eventStyleGetter}
              components={{
                event: CustomEvent
              }}
              className="h-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tasks and Alerts Section - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              งานที่ต้องทำวันนี้
              <Badge variant="secondary" className="ml-auto">
                {kpiData.todaysTasks}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.task}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant={task.priority === "สูง" ? "destructive" : task.priority === "ปานกลาง" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {task.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{task.dueTime}</span>
                  </div>
                </div>
                {task.status === "completed" ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                ) : (
                  <Button size="sm" variant="ghost" className="text-xs px-2">
                    ทำ
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Critical Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              แจ้งเตือนสำคัญ
              <Badge variant="destructive" className="ml-auto">
                {kpiData.criticalAlerts}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalAlerts.map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border-l-4 ${
                alert.type === "urgent" ? "border-l-red-500 bg-red-50" : "border-l-orange-500 bg-orange-50"
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">⚠️ {alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">โปรเจกต์: {alert.project}</p>
                  </div>
                  <Badge variant={alert.type === "urgent" ? "destructive" : "default"} className="text-xs">
                    {alert.daysLeft} วัน
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              จำนวนงานรายเดือน
            </CardTitle>
            <CardDescription>
              แสดงจำนวนงานในแต่ละขั้นตอนตามเดือน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="calculated" fill="#3b82f6" name="คำนวณราคา" />
                  <Bar dataKey="produced" fill="#f97316" name="สั่งผลิต" />
                  <Bar dataKey="delivered" fill="#10b981" name="จัดส่งแล้ว" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              แนวโน้มรายวัน
            </CardTitle>
            <CardDescription>
              แสดงแนวโน้มการทำงานแบบรายวัน
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="calculated" stroke="#3b82f6" strokeWidth={2} name="คำนวณราคา" />
                  <Line type="monotone" dataKey="produced" stroke="#f97316" strokeWidth={2} name="สั่งผลิต" />
                  <Line type="monotone" dataKey="delivered" stroke="#10b981" strokeWidth={2} name="จัดส่งแล้ว" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Product Type Distribution and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>สัดส่วนประเภทสินค้า</CardTitle>
            <CardDescription>
              แสดงสัดส่วนประเภทสินค้าที่ผลิต
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={productTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {productTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              กิจกรรมล่าสุดของงาน
            </CardTitle>
            <CardDescription>
              รายการกิจกรรมและการอัปเดตล่าสุดในระบบ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === "status_update" ? "bg-green-500" : 
                    activity.type === "production_order" ? "bg-blue-500" : "bg-orange-500"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.user}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>รายละเอียดกิจกรรม</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">ชื่อกิจกรรม</h4>
                <p className="text-sm text-muted-foreground">{selectedEvent.title}</p>
              </div>
              <div>
                <h4 className="font-medium">โปรเจกต์</h4>
                <p className="text-sm text-muted-foreground">{selectedEvent.project}</p>
              </div>
              <div>
                <h4 className="font-medium">ผู้รับผิดชอบ</h4>
                <p className="text-sm text-muted-foreground">{selectedEvent.responsible}</p>
              </div>
              <div>
                <h4 className="font-medium">วันที่และเวลา</h4>
                <p className="text-sm text-muted-foreground">
                  {moment(selectedEvent.start).format('DD/MM/YYYY HH:mm')} - {moment(selectedEvent.end).format('HH:mm')}
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <Badge variant={
                  selectedEvent.type === "shipping" ? "destructive" :
                  selectedEvent.type === "arrival" ? "default" : "secondary"
                }>
                  {selectedEvent.type === "shipping" && "จัดส่งจากจีน"}
                  {selectedEvent.type === "arrival" && "สินค้าถึงไทย"}
                  {selectedEvent.type === "meeting" && "การประชุม"}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}