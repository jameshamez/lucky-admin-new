import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Filter,
  Calculator,
  Clock,
  FileText,
  Palette,
  ExternalLink,
  DollarSign,
  CreditCard,
  Search,
  Bell,
  Link as LinkIcon,
  FileWarning,
  BadgeCheck,
  CircleDollarSign
} from "lucide-react";
import StackedSalesChart from "@/components/sales/StackedSalesChart";
import { DateRange } from "react-day-picker";

// Mock data for jobs by status - organized by NEW workflow
const jobsByStatus: Record<string, Array<{
  jobId: string;
  orderDate: string;
  salesChannel: string;
  lineName: string;
  customerName: string;
  product: string;
  deliveryDate: string;
}>> = {
  estimate: [
    { jobId: "JOB-2024-015", orderDate: "2024-01-20", salesChannel: "ลูกค้าสั่งเอง", lineName: "customer_abc", customerName: "บริษัท ABC", product: "ถ้วยรางวัล", deliveryDate: "2024-02-10" },
    { jobId: "JOB-2024-016", orderDate: "2024-01-21", salesChannel: "ฟรีแลนซ์", lineName: "shop_xyz", customerName: "ร้าน XYZ", product: "เหรียญรางวัล", deliveryDate: "2024-02-15" },
  ],
  quotation: [
    { jobId: "JOB-2024-012", orderDate: "2024-01-18", salesChannel: "ร้านค้าตัวแทน", lineName: "dealer_01", customerName: "ตัวแทน กรุงเทพ", product: "โล่รางวัล", deliveryDate: "2024-02-05" },
    { jobId: "JOB-2024-013", orderDate: "2024-01-19", salesChannel: "ลูกค้าสั่งเอง", lineName: "school_admin", customerName: "โรงเรียนสายรุ้ง", product: "ถ้วยรางวัล", deliveryDate: "2024-02-08" },
  ],
  pendingDeposit: [
    { jobId: "JOB-2024-008", orderDate: "2024-01-15", salesChannel: "ลูกค้าสั่งเอง", lineName: "customer_line1", customerName: "สมชาย ใจดี", product: "ถ้วยรางวัล", deliveryDate: "2024-01-25" },
    { jobId: "JOB-2024-009", orderDate: "2024-01-16", salesChannel: "ฟรีแลนซ์", lineName: "shop_manager", customerName: "สุดา เก่งมาก", product: "เหรียญรางวัล", deliveryDate: "2024-01-30" },
  ],
  graphicDesign: [
    { jobId: "JOB-2024-004", orderDate: "2024-01-14", salesChannel: "ลูกค้าสั่งเอง", lineName: "company_hr", customerName: "บริษัท ดีเด่น", product: "ถ้วยคริสตัล", deliveryDate: "2024-01-28" },
    { jobId: "JOB-2024-005", orderDate: "2024-01-13", salesChannel: "ฟรีแลนซ์", lineName: "sport_club", customerName: "สมาคมนักกีฬา", product: "เหรียญทอง", deliveryDate: "2024-01-26" },
  ],
  production: [
    { jobId: "JOB-2024-001", orderDate: "2024-01-15", salesChannel: "ลูกค้าสั่งเอง", lineName: "customer_line1", customerName: "สมชาย ใจดี", product: "ถ้วยรางวัล", deliveryDate: "2024-01-25" },
    { jobId: "JOB-2024-002", orderDate: "2024-01-16", salesChannel: "ฟรีแลนซ์", lineName: "shop_manager", customerName: "สุดา เก่งมาก", product: "เหรียญรางวัล", deliveryDate: "2024-01-30" },
    { jobId: "JOB-2024-003", orderDate: "2024-01-17", salesChannel: "ร้านค้าตัวแทน", lineName: "event_planner", customerName: "อนันต์ ชาญฉลาด", product: "โล่รางวัล", deliveryDate: "2024-02-05" },
    { jobId: "JOB-2024-006", orderDate: "2024-01-12", salesChannel: "ร้านค้าตัวแทน", lineName: "shop_south", customerName: "ร้านภาคใต้", product: "โล่ไม้", deliveryDate: "2024-02-01" },
  ],
  qcReadyToShip: [
    { jobId: "JOB-2024-007", orderDate: "2024-01-10", salesChannel: "ลูกค้าสั่งเอง", lineName: "gov_office", customerName: "สำนักงานราชการ", product: "ถ้วยรางวัล", deliveryDate: "2024-01-22" },
    { jobId: "JOB-2024-010", orderDate: "2024-01-11", salesChannel: "ฟรีแลนซ์", lineName: "university", customerName: "มหาวิทยาลัย", product: "เหรียญรางวัล", deliveryDate: "2024-01-24" },
  ],
  completed: [
    { jobId: "JOB-2024-100", orderDate: "2024-01-05", salesChannel: "ลูกค้าสั่งเอง", lineName: "company_a", customerName: "บริษัท A", product: "ถ้วยรางวัล", deliveryDate: "2024-01-15" },
    { jobId: "JOB-2024-101", orderDate: "2024-01-06", salesChannel: "ฟรีแลนซ์", lineName: "school_b", customerName: "โรงเรียน B", product: "เหรียญรางวัล", deliveryDate: "2024-01-16" },
  ],
};

const salesData = {
  monthly: {
    current: 245000,
    target: 300000,
    percentage: 82,
    realRevenue: 185000,    // ยอดที่เก็บมัดจำแล้ว
    pendingRevenue: 60000   // ยอดที่รอชำระ
  },
  jobStatus: {
    estimate: 15,
    quotation: 12,
    pendingDeposit: 8,
    graphicDesign: 18,
    production: 31,
    qcReadyToShip: 34,
    completed: 127
  }
};

const urgentOrders = [
  {
    id: "JOB-2024-018",
    customer: "บริษัท เอบีซี จำกัด",
    mainItem: "ถ้วยรางวัลทอง",
    totalItems: 3,
    dueDate: "วันนี้",
    dueDateType: "today" as const,
    reason: "รอไฟล์ดีไซน์",
    overdueDays: 0
  },
  {
    id: "JOB-2024-019", 
    customer: "โรงเรียนสายรุ้ง",
    mainItem: "เหรียญรางวัล",
    totalItems: 2,
    dueDate: "พรุ่งนี้",
    dueDateType: "tomorrow" as const,
    reason: "รอการอนุมัติ",
    overdueDays: 0
  },
  {
    id: "JOB-2024-020",
    customer: "สมาคมนักกีฬา",
    mainItem: "ถ้วยคริสตัล",
    totalItems: 1,
    dueDate: "เกินกำหนด",
    dueDateType: "overdue" as const,
    reason: "QC ไม่ผ่าน",
    overdueDays: 5
  },
  {
    id: "JOB-2024-021",
    customer: "มหาวิทยาลัยกรุงเทพ",
    mainItem: "โล่รางวัล",
    totalItems: 4,
    dueDate: "เกินกำหนด",
    dueDateType: "overdue" as const,
    reason: "รอไฟล์ดีไซน์",
    overdueDays: 3
  }
];

// NEW: Pipeline statuses organized by WORKFLOW
const pipelineStatuses = [
  { key: "estimate", name: "ประเมินราคา", count: salesData.jobStatus.estimate, type: "waiting", icon: Calculator },
  { key: "quotation", name: "ใบเสนอราคา", count: salesData.jobStatus.quotation, type: "waiting", icon: FileText },
  { key: "pendingDeposit", name: "รอชำระมัดจำ", count: salesData.jobStatus.pendingDeposit, type: "waiting", icon: CreditCard },
  { key: "graphicDesign", name: "รอออกแบบ", count: salesData.jobStatus.graphicDesign, type: "progress", icon: Palette },
  { key: "production", name: "กำลังผลิต", count: salesData.jobStatus.production, type: "progress", icon: Package },
  { key: "qcReadyToShip", name: "ตรวจสอบคุณภาพ", count: salesData.jobStatus.qcReadyToShip, type: "progress", icon: Truck },
  { key: "completed", name: "จัดส่งสำเร็จ", count: salesData.jobStatus.completed, type: "done", icon: CheckCircle },
];

const getStatusStyle = (type: string) => {
  switch (type) {
    case "waiting":
      return "bg-muted/50 text-muted-foreground border-muted";
    case "progress":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
    case "risk":
      return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800";
    case "done":
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800";
    default:
      return "bg-muted/50 text-muted-foreground border-muted";
  }
};

const getDueDateStyle = (type: string) => {
  switch (type) {
    case "today":
      return "text-orange-600 dark:text-orange-400";
    case "tomorrow":
      return "text-yellow-600 dark:text-yellow-400";
    case "overdue":
      return "text-red-600 dark:text-red-400";
    default:
      return "text-muted-foreground";
  }
};

// Dynamic button configuration based on reason
const getActionButton = (reason: string) => {
  switch (reason) {
    case "รอไฟล์ดีไซน์":
      return { 
        label: "แจ้งเตือนกราฟิก", 
        color: "bg-sky-500 hover:bg-sky-600 text-white",
        icon: Bell
      };
    case "รอการอนุมัติ":
      return { 
        label: "ส่งลิงก์ตรวจแบบ", 
        color: "bg-blue-600 hover:bg-blue-700 text-white",
        icon: LinkIcon
      };
    case "QC ไม่ผ่าน":
      return { 
        label: "เปิดใบเคลม/สั่งผลิตใหม่", 
        color: "bg-red-500 hover:bg-red-600 text-white",
        icon: FileWarning
      };
    default:
      return { 
        label: "ติดตามงาน", 
        color: "bg-primary hover:bg-primary-hover text-primary-foreground",
        icon: ExternalLink
      };
  }
};

export default function SalesDashboard() {
  const navigate = useNavigate();
  const [selectedProductType, setSelectedProductType] = useState("ทั้งหมด");
  const [selectedEmployee, setSelectedEmployee] = useState("ทั้งหมด");
  const [productTypeFilter, setProductTypeFilter] = useState<"all" | "custom" | "readymade">("all");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatusData, setSelectedStatusData] = useState<{key: string; name: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const handleStatusClick = (statusKey: string, statusName: string) => {
    setSelectedStatus(selectedStatus === statusKey ? null : statusKey);
    setSelectedStatusData({ key: statusKey, name: statusName });
    setStatusDialogOpen(true);
  };

  const getChannelBadgeColor = (channel: string) => {
    switch (channel) {
      case "ลูกค้าสั่งเอง": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "ฟรีแลนซ์": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "ร้านค้าตัวแทน": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">แดชบอร์ดฝ่ายขาย</h1>
          <p className="text-sm text-muted-foreground">ภาพรวมการขายและออเดอร์ประจำวัน</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Global Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาลูกค้า / เลข Order / เบอร์โทร"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[280px] h-9"
            />
          </div>
          <Button onClick={() => navigate("/sales/price-estimation")} variant="outline" size="sm">
            <Calculator className="w-4 h-4 mr-2" />
            ประเมินราคา
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary-hover">
            <Package className="w-4 h-4 mr-2" />
            สร้างออเดอร์ใหม่
          </Button>
        </div>
      </div>

      {/* ===== Section 1: Monthly Sales Summary with Revenue Breakdown ===== */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ยอดขายเดือนนี้</p>
              <p className="text-xl font-bold text-primary">
                ฿{salesData.monthly.current.toLocaleString()}
              </p>
              {/* Revenue breakdown badges */}
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <BadgeCheck className="w-3 h-3" />
                  เก็บแล้ว ฿{salesData.monthly.realRevenue.toLocaleString()}
                </Badge>
                <Badge variant="secondary" className="text-xs gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  <CircleDollarSign className="w-3 h-3" />
                  รอชำระ ฿{salesData.monthly.pendingRevenue.toLocaleString()}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex-1 max-w-xs hidden sm:block">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{salesData.monthly.percentage}% ของเป้าหมาย</span>
              <span>฿{salesData.monthly.target.toLocaleString()}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${salesData.monthly.percentage}%` }}
              />
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm text-muted-foreground">เหลือจากเป้า</p>
            <p className="font-semibold">
              ฿{(salesData.monthly.target - salesData.monthly.current).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ===== Section 2: Filters with Product Type Toggle ===== */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Product Type Toggle (Custom vs Ready-made) */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <Button
                variant={productTypeFilter === "all" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs px-3"
                onClick={() => setProductTypeFilter("all")}
              >
                ทั้งหมด
              </Button>
              <Button
                variant={productTypeFilter === "custom" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs px-3"
                onClick={() => setProductTypeFilter("custom")}
              >
                สินค้าสั่งผลิต
              </Button>
              <Button
                variant={productTypeFilter === "readymade" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs px-3"
                onClick={() => setProductTypeFilter("readymade")}
              >
                สินค้าสำเร็จรูป
              </Button>
            </div>

            <div className="h-6 w-px bg-border hidden md:block" />

            <Select value={selectedProductType} onValueChange={setSelectedProductType}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="ประเภทสินค้า" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
                <SelectItem value="เหรียญสั่งผลิต">เหรียญสั่งผลิต</SelectItem>
                <SelectItem value="โล่สั่งผลิต">โล่สั่งผลิต</SelectItem>
                <SelectItem value="หมวก">หมวก</SelectItem>
                <SelectItem value="กระเป๋า">กระเป๋า</SelectItem>
                <SelectItem value="แก้ว">แก้ว</SelectItem>
                <SelectItem value="ขวดน้ำ">ขวดน้ำ</SelectItem>
                <SelectItem value="ตุ๊กตา">ตุ๊กตา</SelectItem>
                <SelectItem value="สมุด">สมุด</SelectItem>
                <SelectItem value="ปฏิทิน">ปฏิทิน</SelectItem>
                <SelectItem value="ลิสแบรนด์">ลิสแบรนด์</SelectItem>
                <SelectItem value="สายคล้อง">สายคล้อง</SelectItem>
                <SelectItem value="แม่เหล็ก">แม่เหล็ก</SelectItem>
                <SelectItem value="ที่เปิดขวด">ที่เปิดขวด</SelectItem>
                <SelectItem value="พวงกุญแจ">พวงกุญแจ</SelectItem>
                <SelectItem value="ที่ทับกระดาษ">ที่ทับกระดาษ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="ชื่อเซลล์" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
                <SelectItem value="สมชาย ใจดี">สมชาย ใจดี</SelectItem>
                <SelectItem value="สมหญิง รักงาน">สมหญิง รักงาน</SelectItem>
                <SelectItem value="วิทยา เก่งขาย">วิทยา เก่งขาย</SelectItem>
                <SelectItem value="มานี ซื่อสัตย์">มานี ซื่อสัตย์</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                  <Calendar className="w-4 h-4 mr-2" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "d MMM yy", { locale: th })} - {format(dateRange.to, "d MMM yy", { locale: th })}
                      </>
                    ) : (
                      format(dateRange.from, "d MMM yyyy", { locale: th })
                    )
                  ) : (
                    "เลือกช่วงเวลา"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            <Button size="sm" className="h-9 ml-auto">
              <Filter className="w-4 h-4 mr-2" />
              ใช้ตัวกรอง
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== Section 3: Sales Chart ===== */}
      <StackedSalesChart />

      {/* ===== Section 4: Order Pipeline Overview - NEW WORKFLOW ORDER ===== */}
      <div className="space-y-3">
        <h2 className="font-semibold text-foreground">สถานะงาน</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {pipelineStatuses.map((status) => {
            const IconComponent = status.icon;
            return (
              <button
                key={status.key}
                onClick={() => handleStatusClick(status.key, status.name)}
                className={`p-3 rounded-lg border text-left transition-all hover:shadow-sm active:scale-[0.98] ${getStatusStyle(status.type)} ${
                  selectedStatus === status.key ? 'ring-2 ring-primary ring-offset-1' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4 opacity-70" />
                  <span className="text-xs font-medium truncate">{status.name}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{status.count}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status Detail Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              รายละเอียดงาน - {selectedStatusData?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedStatusData && jobsByStatus[selectedStatusData.key] && (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-primary">JOB ID</TableHead>
                    <TableHead>วันที่สั่งซื้อ</TableHead>
                    <TableHead>ช่องทางการขาย</TableHead>
                    <TableHead>ชื่อ LINE</TableHead>
                    <TableHead>ชื่อผู้สั่งซื้อ</TableHead>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>วันจัดส่ง</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobsByStatus[selectedStatusData.key].map((job) => (
                    <TableRow key={job.jobId} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium text-primary">{job.jobId}</TableCell>
                      <TableCell>{job.orderDate}</TableCell>
                      <TableCell>
                        <Badge className={cn("font-normal", getChannelBadgeColor(job.salesChannel))}>
                          {job.salesChannel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-primary">{job.lineName}</TableCell>
                      <TableCell>{job.customerName}</TableCell>
                      <TableCell>{job.product}</TableCell>
                      <TableCell>{job.deliveryDate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                  ปิด
                </Button>
                <Button onClick={() => {
                  navigate(`/sales/order-tracking?status=${selectedStatusData.key}`);
                  setStatusDialogOpen(false);
                }}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  ดูทั้งหมด
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Section 5: Critical Action Zone with Dynamic Buttons ===== */}
      <div className="rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200 dark:border-orange-800/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <h2 className="font-semibold text-foreground">งานที่ต้องติดตามเร่งด่วน</h2>
          <Badge variant="destructive" className="ml-auto">{urgentOrders.length}</Badge>
        </div>
        
        {/* Table view for urgent orders */}
        <div className="bg-background/80 backdrop-blur rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-primary">JOB ID</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>สินค้าหลัก</TableHead>
                <TableHead>กำหนดส่ง</TableHead>
                <TableHead>สาเหตุ</TableHead>
                <TableHead className="text-center">วันล่าช้า</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {urgentOrders.map((order) => {
                const actionConfig = getActionButton(order.reason);
                const ActionIcon = actionConfig.icon;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium text-primary">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{order.mainItem}</span>
                        {order.totalItems > 1 && (
                          <Badge variant="secondary" className="text-xs h-5">+{order.totalItems - 1}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-1 font-medium ${getDueDateStyle(order.dueDateType)}`}>
                        <Clock className="w-3 h-3" />
                        {order.dueDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">
                        {order.reason}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {order.overdueDays > 0 ? (
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {order.overdueDays} วัน
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" className={cn("gap-1", actionConfig.color)}>
                        <ActionIcon className="w-3 h-3" />
                        {actionConfig.label}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
