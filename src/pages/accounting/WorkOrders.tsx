import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, FileDown, Search, ArrowUpDown, Trophy, ClipboardCheck, Lock, Image, FileText, Receipt, Package, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { accountingService } from "@/services/accountingService";
import { Skeleton } from "@/components/ui/skeleton";

interface StockItem {
  name: string;
  soldQty: number;
  deductedQty: number;
}

interface Attachment {
  name: string;
  type: "image" | "slip" | "document";
  url: string;
}

interface RevenueItem {
  desc: string;
  amount: number;
  status: "ชำระแล้ว" | "ค้างชำระ";
}

interface ExpenseItem {
  desc: string;
  amount: number;
  status: "ตั้งเบิกแล้ว" | "ยังไม่ตั้งเบิก";
}

interface WorkOrder {
  id: string;
  jobId: string;
  customer: string;
  project: string;
  factory: string;
  prIssueDate: string;
  shipmentDate: string;
  quantity: number;
  revenue: number;
  expense: number;
  stockStatus: "ครบ" | "ไม่ครบ";
  workStatus: "กำลังดำเนินการ" | "ตรวจสอบแล้ว" | "ปิดงาน";
  assignedBy: string;
  revenueItems: RevenueItem[];
  expenseItems: ExpenseItem[];
  stockSold: StockItem[];
  stockDeducted: StockItem[];
  attachments: Attachment[];
  notes: string;
}

// No mock data - fetched from API

type SortKey = "id" | "revenue" | "expense" | "gp" | "margin" | "shipmentDate" | "prIssueDate";

export default function WorkOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterFactory, setFilterFactory] = useState("all");
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await accountingService.getWorkOrders();
      if (res.status === 'success') {
        setOrders(res.data);
      }
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลใบสั่งงานได้", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const SortBtn = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <button className="inline-flex items-center gap-1 font-medium" onClick={() => toggleSort(k)}>
      {children}
      <ArrowUpDown className="h-3 w-3 opacity-60" />
    </button>
  );

  const filteredOrders = useMemo(() => {
    let result = orders.filter(o => {
      const matchSearch = !searchTerm || [o.id, o.jobId, o.customer, o.project, o.factory].some(v => v.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = filterStatus === "all" || o.workStatus === filterStatus;
      const matchFactory = filterFactory === "all" || o.factory === filterFactory;
      return matchSearch && matchStatus && matchFactory;
    });
    result.sort((a, b) => {
      let va: number | string, vb: number | string;
      switch (sortKey) {
        case "revenue": va = a.revenue; vb = b.revenue; break;
        case "expense": va = a.expense; vb = b.expense; break;
        case "gp": va = a.revenue - a.expense; vb = b.revenue - b.expense; break;
        case "margin": va = a.revenue ? ((a.revenue - a.expense) / a.revenue) * 100 : 0; vb = b.revenue ? ((b.revenue - b.expense) / b.revenue) * 100 : 0; break;
        case "shipmentDate": va = a.shipmentDate; vb = b.shipmentDate; break;
        case "prIssueDate": va = a.prIssueDate; vb = b.prIssueDate; break;
        default: va = a.id; vb = b.id;
      }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return result;
  }, [orders, searchTerm, filterStatus, filterFactory, sortKey, sortAsc]);

  const getWorkStatusBadge = (status: string) => {
    switch (status) {
      case "กำลังดำเนินการ": return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">กำลังดำเนินการ</Badge>;
      case "ตรวจสอบแล้ว": return (
        <Badge variant="outline" className="bg-[#ef4042]/10 text-[#ef4042] border-[#ef4042]/20 gap-1">
          <Trophy className="h-3 w-3" />ตรวจสอบแล้ว
        </Badge>
      );
      case "ปิดงาน": return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1"><Lock className="h-3 w-3" />ปิดงาน</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCloseWorkOrder = async (order: WorkOrder) => {
    try {
      const res = await accountingService.updateWorkOrderStatus(order.id, "ปิดงาน");
      if (res.status === 'success') {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, workStatus: "ปิดงาน" as const } : o));
        setSelectedOrder(prev => prev && prev.id === order.id ? { ...prev, workStatus: "ปิดงาน" } : prev);
        toast({ title: "ปิดงานสำเร็จ", description: `${order.id} ถูกล็อกและส่งยอด GP เข้า Dashboard แล้ว` });
      } else {
        toast({ title: "ไม่สามารถปิดงานได้", description: res.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", variant: "destructive" });
    }
  };

  const handleExport = () => {
    toast({ title: "ส่งออกข้อมูลสำเร็จ", description: "กำลังดาวน์โหลดไฟล์ Excel..." });
  };

  const openDrawer = (order: WorkOrder) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const uniqueFactories = [...new Set(orders.map(o => o.factory))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ใบสั่งงาน (Work Orders)</h1>
          <p className="text-muted-foreground">สรุปรายละเอียดงานและตรวจสอบข้อมูลก่อนปิดงาน</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <FileDown className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="WO, JOB ID, ลูกค้า, โปรเจค..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">โรงงาน</Label>
              <Select value={filterFactory} onValueChange={setFilterFactory}>
                <SelectTrigger><SelectValue placeholder="ทั้งหมด" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {uniqueFactories.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">สถานะงาน</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue placeholder="ทั้งหมด" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="กำลังดำเนินการ">กำลังดำเนินการ</SelectItem>
                  <SelectItem value="ตรวจสอบแล้ว">ตรวจสอบแล้ว</SelectItem>
                  <SelectItem value="ปิดงาน">ปิดงาน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">วันที่</Label>
              <Input type="date" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>รายการใบสั่งงานทั้งหมด</CardTitle>
          <CardDescription>แสดงผลรวม {filteredOrders.length} รายการ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#6495ED]/30 [&::-webkit-scrollbar-track]:bg-transparent">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#b41f24] hover:bg-[#b41f24]">
                    <TableHead className="text-white font-semibold"><SortBtn k="id">WO / JOB ID</SortBtn></TableHead>
                    <TableHead className="text-white font-semibold">ลูกค้า / โปรเจกต์</TableHead>
                    <TableHead className="text-white font-semibold">โรงงาน</TableHead>
                    <TableHead className="text-white font-semibold"><SortBtn k="prIssueDate">วันที่ออก PR</SortBtn></TableHead>
                    <TableHead className="text-white font-semibold"><SortBtn k="shipmentDate">วันที่จัดส่ง</SortBtn></TableHead>
                    <TableHead className="text-white font-semibold text-right">จำนวน</TableHead>
                    <TableHead className="text-white font-semibold text-right"><SortBtn k="revenue">รายรับ</SortBtn></TableHead>
                    <TableHead className="text-white font-semibold text-right"><SortBtn k="expense">รายจ่าย</SortBtn></TableHead>
                    <TableHead className="text-white font-semibold text-right"><SortBtn k="gp">GP</SortBtn></TableHead>
                    <TableHead className="text-white font-semibold text-right"><SortBtn k="margin">% Margin</SortBtn></TableHead>
                    <TableHead className="text-white font-semibold text-center">สต็อก</TableHead>
                    <TableHead className="text-white font-semibold text-center">สถานะงาน</TableHead>
                    <TableHead className="text-white font-semibold">ผู้สั่งงาน</TableHead>
                    <TableHead className="text-white font-semibold text-center">ดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={14}><Skeleton className="h-12 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredOrders.map(order => {
                    const gp = order.revenue - order.expense;
                    const margin = order.revenue > 0 ? (gp / order.revenue) * 100 : 0;
                    return (
                      <TableRow key={order.id} className={order.workStatus === "ปิดงาน" ? "bg-muted/30 opacity-80" : ""}>
                        <TableCell>
                          <div className="font-medium text-sm">{order.id}</div>
                          <div className="text-xs text-muted-foreground">{order.jobId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{order.customer}</div>
                          <div className="text-xs text-muted-foreground">{order.project}</div>
                        </TableCell>
                        <TableCell className="text-sm">{order.factory}</TableCell>
                        <TableCell className="text-sm">{new Date(order.prIssueDate).toLocaleDateString("th-TH")}</TableCell>
                        <TableCell className="text-sm">{new Date(order.shipmentDate).toLocaleDateString("th-TH")}</TableCell>
                        <TableCell className="text-right text-sm">{order.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-green-600">฿{order.revenue.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm font-medium text-red-500">฿{order.expense.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm font-bold" style={{ color: gp >= 0 ? "#16a34a" : "#ef4042" }}>
                          ฿{gp.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold" style={{ color: margin >= 20 ? "#16a34a" : margin >= 10 ? "#f59e0b" : "#ef4042" }}>
                          {margin.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-center">
                          {order.stockStatus === "ครบ" ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">ครบ</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-[#f2d878]/30 text-amber-700 border-[#f2d878] text-xs gap-1">
                              <AlertTriangle className="h-3 w-3" />ไม่ครบ
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{getWorkStatusBadge(order.workStatus)}</TableCell>
                        <TableCell className="text-sm">{order.assignedBy}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            className="bg-[#ef4042] hover:bg-[#b41f24] text-white text-xs h-8"
                            onClick={() => openDrawer(order)}
                          >
                            <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                            ตรวจสอบ
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={14} className="text-center py-10 text-muted-foreground">ไม่พบข้อมูล</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side Drawer 3:4 */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[75vw] sm:max-w-[75vw] p-0 flex flex-col">
          {selectedOrder && (() => {
            const gp = selectedOrder.revenue - selectedOrder.expense;
            const margin = selectedOrder.revenue > 0 ? (gp / selectedOrder.revenue) * 100 : 0;
            const isClosed = selectedOrder.workStatus === "ปิดงาน";
            const pendingRevenue = selectedOrder.revenueItems.filter(r => r.status === "ค้างชำระ").reduce((s, r) => s + r.amount, 0);
            const pendingExpense = selectedOrder.expenseItems.filter(e => e.status === "ยังไม่ตั้งเบิก").reduce((s, e) => s + e.amount, 0);

            return (
              <>
                {/* Drawer Header */}
                <div className="bg-[#b41f24] text-white p-5">
                  <SheetTitle className="text-white text-xl font-bold">
                    ตรวจสอบรายละเอียดงาน
                  </SheetTitle>
                  <SheetDescription className="text-white/80 mt-1">
                    {selectedOrder.id} • {selectedOrder.jobId}
                  </SheetDescription>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <span>ลูกค้า: <strong>{selectedOrder.customer}</strong></span>
                    <span>โปรเจกต์: <strong>{selectedOrder.project}</strong></span>
                    <span>โรงงาน: <strong>{selectedOrder.factory}</strong></span>
                    <span>จำนวน: <strong>{selectedOrder.quantity.toLocaleString()} ชิ้น</strong></span>
                  </div>
                  <div className="mt-2">{getWorkStatusBadge(selectedOrder.workStatus)}</div>
                </div>

                {/* Scrollable Content */}
                <ScrollArea className="flex-1 [&>div>div]:!block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#6495ED]/30 [&::-webkit-scrollbar-track]:bg-transparent">
                  <div className="p-5 space-y-6">

                    {/* Section 1: Financial Audit */}
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                        <Receipt className="h-5 w-5 text-[#ef4042]" />
                        ส่วนที่ 1: สรุปการเงิน (Financial Audit)
                      </h3>

                      {/* GP Summary Cards */}
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        <Card className="border-green-200 bg-green-50">
                          <CardContent className="p-3 text-center">
                            <p className="text-xs text-muted-foreground">รายรับรวม</p>
                            <p className="text-lg font-bold text-green-700">฿{selectedOrder.revenue.toLocaleString()}</p>
                          </CardContent>
                        </Card>
                        <Card className="border-red-200 bg-red-50">
                          <CardContent className="p-3 text-center">
                            <p className="text-xs text-muted-foreground">รายจ่ายรวม</p>
                            <p className="text-lg font-bold text-red-600">฿{selectedOrder.expense.toLocaleString()}</p>
                          </CardContent>
                        </Card>
                        <Card className="border-[#ef4042]/30 bg-[#ef4042]/5">
                          <CardContent className="p-3 text-center">
                            <p className="text-xs text-muted-foreground">กำไรขั้นต้น (GP)</p>
                            <p className="text-lg font-bold" style={{ color: gp >= 0 ? "#16a34a" : "#ef4042" }}>฿{gp.toLocaleString()}</p>
                          </CardContent>
                        </Card>
                        <Card className="border-amber-200 bg-amber-50">
                          <CardContent className="p-3 text-center">
                            <p className="text-xs text-muted-foreground">% Margin</p>
                            <p className="text-lg font-bold" style={{ color: margin >= 20 ? "#16a34a" : "#f59e0b" }}>{margin.toFixed(1)}%</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Revenue Table */}
                      <div className="mb-3">
                        <p className="font-semibold text-sm mb-2 text-green-700">รายรับ (Revenue)</p>
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-green-100 hover:bg-green-100">
                                <TableHead className="text-green-800 text-xs">รายการ</TableHead>
                                <TableHead className="text-green-800 text-xs text-right">จำนวนเงิน</TableHead>
                                <TableHead className="text-green-800 text-xs text-center">สถานะ</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedOrder.revenueItems.map((r, i) => (
                                <TableRow key={i}>
                                  <TableCell className="text-sm">{r.desc}</TableCell>
                                  <TableCell className="text-sm text-right font-medium">฿{r.amount.toLocaleString()}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className={r.status === "ชำระแล้ว" ? "bg-green-50 text-green-700 border-green-200 text-xs" : "bg-[#f2d878]/30 text-amber-700 border-[#f2d878] text-xs"}>
                                      {r.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {pendingRevenue > 0 && (
                          <p className="text-xs mt-1 text-amber-600 font-medium">⚠ ยอดค้างชำระ: ฿{pendingRevenue.toLocaleString()}</p>
                        )}
                      </div>

                      {/* Expense Table */}
                      <div>
                        <p className="font-semibold text-sm mb-2 text-red-600">รายจ่าย (Expenses)</p>
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-red-50 hover:bg-red-50">
                                <TableHead className="text-red-800 text-xs">รายการ</TableHead>
                                <TableHead className="text-red-800 text-xs text-right">จำนวนเงิน</TableHead>
                                <TableHead className="text-red-800 text-xs text-center">สถานะ</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedOrder.expenseItems.map((e, i) => (
                                <TableRow key={i}>
                                  <TableCell className="text-sm">{e.desc}</TableCell>
                                  <TableCell className="text-sm text-right font-medium">฿{e.amount.toLocaleString()}</TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className={e.status === "ตั้งเบิกแล้ว" ? "bg-green-50 text-green-700 border-green-200 text-xs" : "bg-[#f2d878]/30 text-amber-700 border-[#f2d878] text-xs"}>
                                      {e.status}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {pendingExpense > 0 && (
                          <p className="text-xs mt-1 text-amber-600 font-medium">⚠ ค่าใช้จ่ายยังไม่ตั้งเบิก: ฿{pendingExpense.toLocaleString()}</p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Section 2: Inventory & Stock */}
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                        <Package className="h-5 w-5 text-[#ef4042]" />
                        ส่วนที่ 2: การจัดการสินค้าและสต็อก
                      </h3>
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-[#b41f24] hover:bg-[#b41f24]">
                              <TableHead className="text-white text-xs font-semibold">รายการสินค้า</TableHead>
                              <TableHead className="text-white text-xs font-semibold text-right">สต็อกขาย (ใบสั่งขาย)</TableHead>
                              <TableHead className="text-white text-xs font-semibold text-right">ตัดสต็อก (เบิกจริง)</TableHead>
                              <TableHead className="text-white text-xs font-semibold text-center">ผลตรวจสอบ</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedOrder.stockSold.map((item, i) => {
                              const mismatch = item.soldQty !== item.deductedQty;
                              return (
                                <TableRow key={i} className={mismatch ? "bg-[#f2d878]/20" : ""}>
                                  <TableCell className="text-sm font-medium">{item.name}</TableCell>
                                  <TableCell className="text-sm text-right">{item.soldQty.toLocaleString()}</TableCell>
                                  <TableCell className={`text-sm text-right font-medium ${mismatch ? "text-amber-700" : ""}`}>
                                    {item.deductedQty.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {mismatch ? (
                                      <Badge variant="outline" className="bg-[#f2d878]/30 text-amber-700 border-[#f2d878] text-xs gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        ไม่ตรง ({item.soldQty - item.deductedQty > 0 ? `-${(item.soldQty - item.deductedQty).toLocaleString()}` : `+${(item.deductedQty - item.soldQty).toLocaleString()}`})
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">✓ ตรงกัน</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <Separator />

                    {/* Section 3: Attachments & Notes */}
                    <div>
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-[#ef4042]" />
                        ส่วนที่ 3: เอกสารแนบและหมายเหตุ
                      </h3>
                      {selectedOrder.attachments.length > 0 ? (
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {selectedOrder.attachments.map((att, i) => (
                            <div key={i} className="border rounded-lg p-3 flex items-center gap-3 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors">
                              {att.type === "image" ? (
                                <Image className="h-8 w-8 text-blue-500 shrink-0" />
                              ) : att.type === "slip" ? (
                                <Receipt className="h-8 w-8 text-green-500 shrink-0" />
                              ) : (
                                <FileText className="h-8 w-8 text-gray-500 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{att.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{att.type === "image" ? "รูปภาพ" : att.type === "slip" ? "สลิปชำระเงิน" : "เอกสาร"}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-4">ไม่มีเอกสารแนบ</p>
                      )}

                      {selectedOrder.notes && (
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">หมายเหตุ</p>
                          <p className="text-sm">{selectedOrder.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>

                {/* Footer Actions */}
                <div className="border-t p-4 flex items-center justify-between bg-background">
                  <Button variant="outline" onClick={() => setDrawerOpen(false)}>ปิด</Button>
                  {!isClosed && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="bg-[#ef4042] hover:bg-[#b41f24] text-white gap-2">
                          <Lock className="h-4 w-4" />
                          ยืนยันปิดงาน (Close Work Order)
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>ยืนยันการปิดงาน</AlertDialogTitle>
                          <AlertDialogDescription>
                            เมื่อปิดงาน {selectedOrder.id} แล้ว ระบบจะล็อกข้อมูลไม่ให้แก้ไข และส่งยอดกำไร-ขาดทุนเข้า Dashboard ฝ่ายบริหารอัตโนมัติ คุณต้องการดำเนินการต่อหรือไม่?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                          <AlertDialogAction className="bg-[#ef4042] hover:bg-[#b41f24] text-white" onClick={() => handleCloseWorkOrder(selectedOrder)}>
                            ยืนยันปิดงาน
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {isClosed && (
                    <Badge className="bg-green-100 text-green-800 border-green-300 gap-1 px-4 py-2">
                      <Lock className="h-4 w-4" />
                      งานนี้ถูกปิดแล้ว — ข้อมูลถูกล็อก
                    </Badge>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}
