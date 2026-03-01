import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
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
  CircleDollarSign,
  RefreshCw,
  Loader2
} from "lucide-react";
import StackedSalesChart from "@/components/sales/StackedSalesChart";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

const API_BASE_URL = "https://finfinphone.com/api-lucky/admin/sales_dashboard.php";

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

const getActionButton = (reason: string) => {
  if (reason.includes("ดีไซน์") || reason.includes("ออกแบบ")) {
    return { label: "แจ้งเตือนกราฟิก", color: "bg-sky-500 hover:bg-sky-600 text-white", icon: Bell };
  }
  if (reason.includes("อนุมัติ") || reason.includes("ยืนยัน")) {
    return { label: "ส่งลิงก์ตรวจแบบ", color: "bg-blue-600 hover:bg-blue-700 text-white", icon: LinkIcon };
  }
  if (reason.includes("QC") || reason.includes("ตำหนิ")) {
    return { label: "เปิดใบเคลม/สั่งผลิตใหม่", color: "bg-red-500 hover:bg-red-600 text-white", icon: FileWarning };
  }
  return { label: "ติดตามงาน", color: "bg-primary hover:bg-primary-hover text-primary-foreground", icon: ExternalLink };
};

export default function SalesDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedProductType, setSelectedProductType] = useState("ทั้งหมด");
  const [selectedEmployee, setSelectedEmployee] = useState("ทั้งหมด");
  const [productTypeFilter, setProductTypeFilter] = useState<"all" | "custom" | "readymade">("all");
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedStatusData, setSelectedStatusData] = useState<{ key: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}?period=month`);
      const result = await response.json();
      if (result.status === "success") {
        setDashboardData(result.data);
      } else {
        toast.error("Error: " + result.message);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      toast.error("ไม่สามารถเชื่อมต่อ API แดชบอร์ดได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  if (loading && !dashboardData) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">กำลังเตรียมข้อมูลแดชบอร์ด...</span>
      </div>
    );
  }

  const stats = dashboardData?.dashboardSummary || {
    current: 0, target: 0, percentage: 0, realRevenue: 0, pendingRevenue: 0
  };

  const pipeline = dashboardData?.pipelineStats || {};

  const pipelineStatuses = [
    { key: "estimate", name: "ประเมินราคา", count: pipeline.estimate || 0, type: "waiting", icon: Calculator },
    { key: "quotation", name: "ใบเสนอราคา", count: pipeline.quotation || 0, type: "waiting", icon: FileText },
    { key: "pendingDeposit", name: "รอชำระมัดจำ", count: pipeline.pendingDeposit || 0, type: "waiting", icon: CreditCard },
    { key: "graphicDesign", name: "รอออกแบบ", count: pipeline.graphicDesign || 0, type: "progress", icon: Palette },
    { key: "production", name: "กำลังผลิต", count: pipeline.production || 0, type: "progress", icon: Package },
    { key: "qcReadyToShip", name: "ตรวจสอบคุณภาพ", count: pipeline.qcReadyToShip || 0, type: "progress", icon: Truck },
    { key: "completed", name: "จัดส่งสำเร็จ", count: pipeline.completed || 0, type: "done", icon: CheckCircle },
  ];

  const urgentOrders = dashboardData?.urgentOrders || [];
  const jobsByStatus = dashboardData?.jobsByStatus || {};

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">แดชบอร์ดฝ่ายขาย</h1>
          <p className="text-sm text-muted-foreground">ภาพรวมการขายและออเดอร์ประจำวัน (ข้อมูลจริง)</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาลูกค้า / เลข Order..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[280px] h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
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

      {/* ===== Section 1: Monthly Sales Summary ===== */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ยอดขายเดือนนี้</p>
              <p className="text-xl font-bold text-primary">
                ฿{stats.current.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <BadgeCheck className="w-3 h-3" />
                  เก็บแล้ว ฿{stats.realRevenue.toLocaleString()}
                </Badge>
                <Badge variant="secondary" className="text-xs gap-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  <CircleDollarSign className="w-3 h-3" />
                  รอชำระ ฿{stats.pendingRevenue.toLocaleString()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-xs hidden sm:block">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{stats.percentage}% ของเป้าหมาย</span>
              <span>฿{stats.target.toLocaleString()}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(stats.percentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm text-muted-foreground">เหลือจากเป้า</p>
            <p className="font-semibold text-orange-600">
              ฿{Math.max(0, stats.target - stats.current).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ===== Section 2: Filters ===== */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <Button variant={productTypeFilter === "all" ? "default" : "ghost"} size="sm" className="h-8 text-xs px-3" onClick={() => setProductTypeFilter("all")}>ทั้งหมด</Button>
              <Button variant={productTypeFilter === "custom" ? "default" : "ghost"} size="sm" className="h-8 text-xs px-3" onClick={() => setProductTypeFilter("custom")}>สินค้าสั่งผลิต</Button>
              <Button variant={productTypeFilter === "readymade" ? "default" : "ghost"} size="sm" className="h-8 text-xs px-3" onClick={() => setProductTypeFilter("readymade")}>สินค้าสำเร็จรูป</Button>
            </div>
            <div className="h-6 w-px bg-border hidden md:block" />
            <Select value={selectedProductType} onValueChange={setSelectedProductType}>
              <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="ประเภทสินค้า" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ทั้งหมด">ทั้งหมด</SelectItem>
                <SelectItem value="Trophy">ถ้วยรางวัล</SelectItem>
                <SelectItem value="Medal">เหรียญรางวัล</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 justify-start font-normal", !dateRange && "text-muted-foreground")}>
                  <Calendar className="w-4 h-4 mr-2" />
                  {dateRange?.from ? (format(dateRange.from, "d MMM yy", { locale: th })) : "เลือกช่วงเวลา"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent initialFocus mode="range" selected={dateRange} onSelect={setDateRange} className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* ===== Section 3: Sales Chart ===== */}
      <StackedSalesChart />

      {/* ===== Section 4: Order Pipeline Overview ===== */}
      <div className="space-y-3">
        <h2 className="font-semibold text-foreground">สถานะออเดอร์แบบเรียลไทม์</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {pipelineStatuses.map((status) => {
            const IconComponent = status.icon;
            return (
              <button
                key={status.key}
                onClick={() => handleStatusClick(status.key, status.name)}
                className={`p-3 rounded-lg border text-left transition-all hover:shadow-sm active:scale-[0.98] ${getStatusStyle(status.type)} ${selectedStatus === status.key ? 'ring-2 ring-primary ring-offset-1' : ''
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
                    <TableHead>ช่องทาง</TableHead>
                    <TableHead>ชื่อ LINE</TableHead>
                    <TableHead>ชื่อลูกค้า</TableHead>
                    <TableHead>ชื่องาน/สินค้า</TableHead>
                    <TableHead>วันจัดส่ง</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobsByStatus[selectedStatusData.key].length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-4 text-muted-foreground">ไม่มีรายการในสถานะนี้</TableCell></TableRow>
                  ) : (
                    jobsByStatus[selectedStatusData.key].map((job: any) => (
                      <TableRow key={job.jobId} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium text-primary">{job.jobId}</TableCell>
                        <TableCell>{job.orderDate}</TableCell>
                        <TableCell><Badge className={cn("font-normal", getChannelBadgeColor(job.salesChannel))}>{job.salesChannel || 'ไม่ระบุ'}</Badge></TableCell>
                        <TableCell className="text-primary">{job.lineName || '-'}</TableCell>
                        <TableCell>{job.customerName}</TableCell>
                        <TableCell>{job.product}</TableCell>
                        <TableCell>{job.deliveryDate || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-4 gap-2">
                <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>ปิด</Button>
                <Button onClick={() => navigate(`/sales/order-tracking?status=${selectedStatusData.key}`)}><ExternalLink className="w-4 h-4 mr-2" />ดูทั้งหมด</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== Section 5: Urgent Orders (Real Data) ===== */}
      <div className="rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border border-orange-200 dark:border-orange-800/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <h2 className="font-semibold text-foreground">งานที่ต้องติดตามเร่งด่วน (ใกล้กำหนดส่ง)</h2>
          <Badge variant="destructive" className="ml-auto">{urgentOrders.length}</Badge>
        </div>

        <div className="bg-background/80 backdrop-blur rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-primary">JOB ID</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>งาน/สินค้า</TableHead>
                <TableHead>กำหนดส่ง</TableHead>
                <TableHead>สถานะปัจจุับัน</TableHead>
                <TableHead className="text-center">ล่าช้า</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {urgentOrders.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-4 text-muted-foreground">ไม่มีงานด่วนในขณะนี้</TableCell></TableRow>
              ) : (
                urgentOrders.map((order: any) => {
                  const actionConfig = getActionButton(order.reason);
                  const ActionIcon = actionConfig.icon;
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium text-primary">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.mainItem}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 font-medium ${getDueDateStyle(order.dueDateType)}`}>
                          <Clock className="w-3 h-3" />
                          {order.dueDate || order.delivery_date}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{order.reason}</Badge></TableCell>
                      <TableCell className="text-center">
                        {order.overdueDays > 0 ? (
                          <span className="font-bold text-red-600">{order.overdueDays} วัน</span>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" className={cn("gap-1", actionConfig.color)}>
                          <ActionIcon className="w-3 h-3" />
                          {actionConfig.label}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
