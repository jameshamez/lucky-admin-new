import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Calculator, FileSpreadsheet, Search, Plus, Clock, CheckCircle2, History, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import {
  defaultReadyMadeConfigs,
  getReadyMadeCategories,
  calculateReadyMadeCommission,
  type ReadyMadeConfig,
} from "@/lib/commissionConfig";
import { defaultEmployees, getSaleEmployees, type Employee, type EmployeeRole, type EmployeeStatus } from "@/lib/employeeData";
import { supabase } from "@/integrations/supabase/client";

type CommissionStatus = "PENDING" | "COMPLETED";

type ReadyMadeOrder = {
  id: string;
  deliveryDate: string;
  poNumber: string;
  jobName: string;
  productCategory: string;
  saleName: string;
  quantity: number;
  totalSalesAmount: number;
  rateDisplay: string;
  baseAmount: string;
  commissionAmount: number;
  calcDescription: string;
  commissionStatus: CommissionStatus;
  processedAt: string | null;
  commissionPeriod: string | null; // "YYYY-MM" format
};

const now = new Date();
const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

const mockOrders: ReadyMadeOrder[] = [
  { id: "1", deliveryDate: "2025-01-15", poNumber: "PO-RM-2025-001", jobName: "ถ้วยรางวัลพลาสติกไทย 100 ชิ้น", productCategory: "ถ้วยรางวัล พลาสติก ไทย", saleName: "คุณสมชาย ใจดี", quantity: 100, totalSalesAmount: 15000, rateDisplay: "3 บาท/ชิ้น", baseAmount: "100 ชิ้น", commissionAmount: 300, calcDescription: "3 บาท × 100 ชิ้น = ฿300", commissionStatus: "COMPLETED", processedAt: "2025-01-20T10:00:00", commissionPeriod: "2025-01" },
  { id: "2", deliveryDate: "2025-01-18", poNumber: "PO-RM-2025-002", jobName: "ถ้วยรางวัลพลาสติกจีน 50 ชิ้น", productCategory: "ถ้วยรางวัล พลาสติก จีน", saleName: "คุณสมหญิง รวยเงิน", quantity: 50, totalSalesAmount: 25000, rateDisplay: "5 บาท/ชิ้น", baseAmount: "50 ชิ้น", commissionAmount: 250, calcDescription: "5 บาท × 50 ชิ้น = ฿250", commissionStatus: "COMPLETED", processedAt: "2025-01-22T14:30:00", commissionPeriod: "2025-01" },
  { id: "7", deliveryDate: "2025-01-28", poNumber: "PO-RM-2025-006", jobName: "อะไหล่ฐานถ้วยรางวัล (เก่า)", productCategory: "อะไหล่ชิ้นส่วนถ้วยรางวัล", saleName: "คุณสมชาย ใจดี", quantity: 1, totalSalesAmount: 38000, rateDisplay: "5%", baseAmount: "฿38,000", commissionAmount: 1900, calcDescription: "5% ของยอดขาย ฿38,000 = ฿1,900", commissionStatus: "COMPLETED", processedAt: "2025-01-30T09:00:00", commissionPeriod: "2025-01" },
  { id: "3", deliveryDate: "2026-02-10", poNumber: "PO-RM-2026-008", jobName: "ถ้วยรางวัลโลหะ L/XL 20 ชิ้น", productCategory: "ถ้วยรางวัล โลหะ (L/XL)", saleName: "คุณวิชัย ขยัน", quantity: 20, totalSalesAmount: 30000, rateDisplay: "", baseAmount: "", commissionAmount: 0, calcDescription: "", commissionStatus: "PENDING", processedAt: null, commissionPeriod: null },
  { id: "4", deliveryDate: "2026-02-12", poNumber: "PO-RM-2026-009", jobName: "โล่รางวัลมาตรฐาน 80 ชิ้น", productCategory: "โล่รางวัล (มาตรฐาน)", saleName: "คุณสุดา ดี", quantity: 80, totalSalesAmount: 12000, rateDisplay: "", baseAmount: "", commissionAmount: 0, calcDescription: "", commissionStatus: "PENDING", processedAt: null, commissionPeriod: null },
  { id: "5", deliveryDate: "2026-02-14", poNumber: "PO-RM-2026-010", jobName: "อะไหล่ฐานถ้วยรางวัล", productCategory: "อะไหล่ชิ้นส่วนถ้วยรางวัล", saleName: "คุณสมชาย ใจดี", quantity: 1, totalSalesAmount: 22000, rateDisplay: "", baseAmount: "", commissionAmount: 0, calcDescription: "", commissionStatus: "PENDING", processedAt: null, commissionPeriod: null },
  { id: "6", deliveryDate: "2026-02-15", poNumber: "PO-RM-2026-011", jobName: "ระบบวิ่ง 300 คน", productCategory: "ระบบวิ่ง", saleName: "คุณนิภา สวย", quantity: 300, totalSalesAmount: 50000, rateDisplay: "", baseAmount: "", commissionAmount: 0, calcDescription: "", commissionStatus: "PENDING", processedAt: null, commissionPeriod: null },
];

const thaiMonthNames = ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];

function formatPeriodLabel(period: string): string {
  const [y, m] = period.split("-");
  const monthIdx = parseInt(m) - 1;
  const buddhistYear = parseInt(y) + 543;
  return `${thaiMonthNames[monthIdx]} ${buddhistYear}`;
}

const months = [
  { value: "1", label: "มกราคม" }, { value: "2", label: "กุมภาพันธ์" },
  { value: "3", label: "มีนาคม" }, { value: "4", label: "เมษายน" },
  { value: "5", label: "พฤษภาคม" }, { value: "6", label: "มิถุนายน" },
  { value: "7", label: "กรกฎาคม" }, { value: "8", label: "สิงหาคม" },
  { value: "9", label: "กันยายน" }, { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" }, { value: "12", label: "ธันวาคม" },
];

const years = [
  { value: "2024", label: "2567" }, { value: "2025", label: "2568" }, { value: "2026", label: "2569" },
];

export default function CommissionReadyMade() {
  const { toast } = useToast();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [orders, setOrders] = useState<ReadyMadeOrder[]>(mockOrders);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("PENDING");
  const [employees, setEmployees] = useState<Employee[]>(defaultEmployees);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("employees").select("*").eq("status", "ACTIVE").order("full_name");
      if (data && data.length > 0) {
        setEmployees(data.map(d => ({ id: d.id, fullName: d.full_name, nickname: d.nickname, position: d.position, role: d.role as EmployeeRole, status: d.status as EmployeeStatus })));
      }
    };
    load();
  }, []);

  const configs = defaultReadyMadeConfigs;
  const categories = useMemo(() => getReadyMadeCategories(configs), [configs]);

  const [addForm, setAddForm] = useState({
    poNumber: "", jobName: "", deliveryDate: new Date().toISOString().split("T")[0],
    productCategory: "", saleName: "", quantity: 0, totalSalesAmount: 0,
  });

  const selectedConfig = configs.find(c => c.category === addForm.productCategory);
  const needsSalesAmount = selectedConfig?.calcMethod === "percentSales";

  const computedCommission = useMemo(() => {
    if (!selectedConfig) return null;
    return calculateReadyMadeCommission(selectedConfig, addForm.quantity, addForm.totalSalesAmount);
  }, [selectedConfig, addForm.quantity, addForm.totalSalesAmount]);

  const monthYearFiltered = orders.filter(order => {
    const dateStr = order.commissionPeriod || order.deliveryDate;
    if (!dateStr) return true;
    const [y, m] = dateStr.split("-");
    if (selectedYear !== "all" && y !== selectedYear) return false;
    if (selectedMonth !== "all" && String(parseInt(m)) !== selectedMonth) return false;
    return true;
  });

  const searchFiltered = monthYearFiltered.filter(order => {
    const q = searchQuery.toLowerCase();
    return !q || order.poNumber.toLowerCase().includes(q) || order.jobName.toLowerCase().includes(q) || order.saleName.toLowerCase().includes(q);
  });

  const pendingOrders = searchFiltered.filter(o => o.commissionStatus === "PENDING");
  const completedOrders = searchFiltered.filter(o => o.commissionStatus === "COMPLETED");

  // Group completed orders by commissionPeriod for history tab
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, ReadyMadeOrder[]> = {};
    completedOrders.forEach(o => {
      const period = o.commissionPeriod || "unknown";
      if (!groups[period]) groups[period] = [];
      groups[period].push(o);
    });
    // Sort periods descending (newest first)
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [completedOrders]);

  const totalCommissionCompleted = completedOrders.reduce((sum, o) => sum + o.commissionAmount, 0);
  const totalRevenueCompleted = completedOrders.reduce((sum, o) => sum + o.totalSalesAmount, 0);

  const handleSelectAll = (checked: boolean) => setSelectedOrders(checked ? pendingOrders.map(o => o.id) : []);
  const handleSelectOrder = (id: string, checked: boolean) => setSelectedOrders(checked ? [...selectedOrders, id] : selectedOrders.filter(x => x !== id));

  const recalculateAndComplete = (order: ReadyMadeOrder): ReadyMadeOrder => {
    const config = configs.find(c => c.category === order.productCategory && c.active);
    const processedAt = new Date().toISOString();
    if (!config) return { ...order, commissionAmount: 0, calcDescription: "ไม่พบ config", commissionStatus: "COMPLETED", processedAt, commissionPeriod: currentPeriod };
    const result = calculateReadyMadeCommission(config, order.quantity, order.totalSalesAmount);
    return { ...order, rateDisplay: result.rateDisplay, baseAmount: result.baseAmount, commissionAmount: result.amount, calcDescription: result.description, commissionStatus: "COMPLETED", processedAt, commissionPeriod: currentPeriod };
  };

  const handleCalculateAll = () => {
    const pendingIds = pendingOrders.map(o => o.id);
    if (pendingIds.length === 0) { toast({ title: "ไม่มีรายการรอดำเนินการ", variant: "destructive" }); return; }
    setOrders(orders.map(o => pendingIds.includes(o.id) ? recalculateAndComplete(o) : o));
    setSelectedOrders([]);
    toast({ title: "คำนวณและบันทึกเรียบร้อย", description: `${pendingIds.length} รายการย้ายไปประวัติ` });
  };

  const handleCalculateSelected = () => {
    if (selectedOrders.length === 0) { toast({ title: "กรุณาเลือกรายการ", variant: "destructive" }); return; }
    setOrders(orders.map(o => selectedOrders.includes(o.id) ? recalculateAndComplete(o) : o));
    const count = selectedOrders.length;
    setSelectedOrders([]);
    toast({ title: "คำนวณเรียบร้อย", description: `${count} รายการย้ายไปประวัติ` });
  };

  const handleAddOrder = () => {
    if (!addForm.productCategory || !addForm.poNumber) { toast({ title: "กรุณากรอกข้อมูลให้ครบ", variant: "destructive" }); return; }
    if (!selectedConfig || !computedCommission) return;
    const newOrder: ReadyMadeOrder = {
      id: String(Date.now()), deliveryDate: addForm.deliveryDate, poNumber: addForm.poNumber,
      jobName: addForm.jobName, productCategory: addForm.productCategory, saleName: addForm.saleName,
      quantity: addForm.quantity, totalSalesAmount: addForm.totalSalesAmount,
      rateDisplay: computedCommission.rateDisplay, baseAmount: computedCommission.baseAmount,
      commissionAmount: computedCommission.amount, calcDescription: computedCommission.description,
      commissionStatus: "PENDING", processedAt: null, commissionPeriod: null,
    };
    setOrders([...orders, newOrder]);
    setIsAddDialogOpen(false);
    setAddForm({ poNumber: "", jobName: "", deliveryDate: new Date().toISOString().split("T")[0], productCategory: "", saleName: "", quantity: 0, totalSalesAmount: 0 });
    toast({ title: "เพิ่มรายการสำเร็จ (รอดำเนินการ)", description: `ค่าคอม Preview: ฿${computedCommission.amount.toLocaleString()}` });
  };

  const handleExport = () => {
    const dataToExport = activeTab === "PENDING" ? pendingOrders : completedOrders;
    if (dataToExport.length === 0) {
      toast({ title: "ไม่มีข้อมูลสำหรับ Export", variant: "destructive" });
      return;
    }
    const wb = XLSX.utils.book_new();
    const rows = dataToExport.map(o => ({
      "วันส่งของ": o.deliveryDate,
      "เลข PO": o.poNumber,
      "ชื่องาน": o.jobName,
      "ประเภทสินค้า": o.productCategory,
      "พนักงานขาย": o.saleName,
      "จำนวน": o.quantity,
      "ยอดขาย (฿)": o.totalSalesAmount,
      "อัตรา": o.rateDisplay,
      "ฐานคำนวณ": o.baseAmount,
      "ค่าคอม (฿)": o.commissionAmount,
      "รายละเอียด": o.calcDescription,
      "สถานะ": o.commissionStatus === "COMPLETED" ? "คำนวณแล้ว" : "รอดำเนินการ",
      "งวด": o.commissionPeriod ?? "-",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 20 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 35 }, { wch: 14 }, { wch: 10 },
    ];
    const sheetName = activeTab === "PENDING" ? "รอดำเนินการ" : "ประวัติ";
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `Commission_ReadyMade_${sheetName}_${selectedYear}_${selectedMonth.padStart(2, "0")}.xlsx`);
    toast({ title: "ส่งออกสำเร็จ", description: `ดาวน์โหลด ${dataToExport.length} รายการ (${sheetName}) แล้ว` });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ค่าคอมมิชชั่น (งานสำเร็จรูป)</h1>
        <p className="text-muted-foreground">คำนวณค่าคอมจาก Config A — อัตราต่อชิ้น หรือ %ยอดขาย</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">เดือน</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger><SelectValue placeholder="เลือกเดือน" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">ปี</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue placeholder="เลือกปี" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {years.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ค้นหา PO, ชื่องาน, พนักงาน..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedOrders([]); }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="PENDING" className="gap-2">
              <Clock className="w-4 h-4" />
              รอดำเนินการ
              {pendingOrders.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-xs">{pendingOrders.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="HISTORY" className="gap-2">
              <History className="w-4 h-4" />
              ประวัติการคำนวณ
              {completedOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">{completedOrders.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2 flex-wrap">
            {activeTab === "PENDING" && (
              <>
                <Button onClick={() => setIsAddDialogOpen(true)} size="sm" className="gap-2"><Plus className="w-4 h-4" />เพิ่มรายการ</Button>
                <Button onClick={handleCalculateAll} size="sm" variant="outline" className="gap-2"><Calculator className="w-4 h-4" />คำนวณทั้งหมด</Button>
                <Button onClick={handleCalculateSelected} size="sm" variant="outline" className="gap-2"><Calculator className="w-4 h-4" />คำนวณที่เลือก</Button>
              </>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport}><FileSpreadsheet className="w-4 h-4" />Export</Button>
          </div>
        </div>

        {/* Tab 1: Pending */}
        <TabsContent value="PENDING">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                รายการรอดำเนินการ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox checked={selectedOrders.length === pendingOrders.length && pendingOrders.length > 0} onCheckedChange={handleSelectAll} />
                      </TableHead>
                      <TableHead>วันที่ส่งงาน</TableHead>
                      <TableHead>เลขที่ PO</TableHead>
                      <TableHead>ชื่องาน</TableHead>
                      <TableHead>ประเภทสินค้า</TableHead>
                      <TableHead>ผู้ขาย</TableHead>
                      <TableHead className="text-right">จำนวน</TableHead>
                      <TableHead className="text-right">ยอดขายรวม</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          🎉 ไม่มีรายการรอดำเนินการ — งานเสร็จหมดแล้ว!
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingOrders.map(order => (
                        <TableRow key={order.id}>
                          <TableCell><Checkbox checked={selectedOrders.includes(order.id)} onCheckedChange={c => handleSelectOrder(order.id, c as boolean)} /></TableCell>
                          <TableCell className="whitespace-nowrap">{new Date(order.deliveryDate).toLocaleDateString('th-TH')}</TableCell>
                          <TableCell className="font-medium">{order.poNumber}</TableCell>
                          <TableCell className="max-w-[180px] truncate">{order.jobName}</TableCell>
                          <TableCell className="max-w-[160px] truncate text-xs">{order.productCategory}</TableCell>
                          <TableCell className="whitespace-nowrap">{order.saleName}</TableCell>
                          <TableCell className="text-right">{order.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right">฿{order.totalSalesAmount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
                              <Clock className="w-3 h-3 mr-1" />รอดำเนินการ
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: History grouped by month */}
        <TabsContent value="HISTORY">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-500" />
                ประวัติการคำนวณ (จัดกลุ่มตามเดือน)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groupedByMonth.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">ยังไม่มีประวัติการคำนวณ</div>
              ) : (
                <Accordion type="multiple" className="space-y-3">
                  {groupedByMonth.map(([period, items]) => {
                    const periodTotal = items.reduce((s, o) => s + o.commissionAmount, 0);
                    const periodSales = items.reduce((s, o) => s + o.totalSalesAmount, 0);
                    return (
                      <AccordionItem key={period} value={period} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center gap-3">
                              <CalendarDays className="w-5 h-5 text-primary" />
                              <div className="text-left">
                                <p className="font-semibold text-base">ยอดค่าคอมมิชชั่น — {formatPeriodLabel(period)}</p>
                                <p className="text-xs text-muted-foreground">{items.length} รายการ · ยอดขาย ฿{periodSales.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">฿{periodTotal.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">ค่าคอมรวม</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="rounded-md border overflow-x-auto mt-2">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>วันที่ทำรายการ</TableHead>
                                  <TableHead>เลขที่ PO</TableHead>
                                  <TableHead>ชื่องาน</TableHead>
                                  <TableHead>ประเภท</TableHead>
                                  <TableHead>ผู้ขาย</TableHead>
                                  <TableHead className="text-right">จำนวน</TableHead>
                                  <TableHead>Rate/Percent</TableHead>
                                  <TableHead>รายละเอียด</TableHead>
                                  <TableHead className="text-right">ค่าคอมสุทธิ</TableHead>
                                  <TableHead>สถานะ</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {items.map(order => (
                                  <TableRow key={order.id}>
                                    <TableCell className="whitespace-nowrap text-xs">
                                      {order.processedAt ? new Date(order.processedAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : "—"}
                                    </TableCell>
                                    <TableCell className="font-medium">{order.poNumber}</TableCell>
                                    <TableCell className="max-w-[180px] truncate">{order.jobName}</TableCell>
                                    <TableCell className="max-w-[140px] truncate text-xs">{order.productCategory}</TableCell>
                                    <TableCell className="whitespace-nowrap">{order.saleName}</TableCell>
                                    <TableCell className="text-right">{order.quantity.toLocaleString()}</TableCell>
                                    <TableCell>
                                      {order.rateDisplay ? <Badge variant="outline" className="text-xs">{order.rateDisplay}</Badge> : "—"}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground max-w-[200px]">{order.calcDescription || "—"}</TableCell>
                                    <TableCell className="text-right font-bold text-primary">฿{order.commissionAmount.toLocaleString()}</TableCell>
                                    <TableCell>
                                      <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/20">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />คำนวณแล้ว
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-base">รอดำเนินการ</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-amber-600">{pendingOrders.length}</div><p className="text-sm text-muted-foreground">รายการ</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">คำนวณแล้ว</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-emerald-600">{completedOrders.length}</div><p className="text-sm text-muted-foreground">รายการ</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">ยอดขายรวม (Completed)</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">฿{totalRevenueCompleted.toLocaleString()}</div><p className="text-sm text-muted-foreground">เฉพาะที่คำนวณแล้ว</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">รวมค่าคอมสำเร็จรูป</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-primary">฿{totalCommissionCompleted.toLocaleString()}</div><p className="text-sm text-muted-foreground">เฉพาะที่คำนวณแล้ว</p></CardContent></Card>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>เพิ่มรายการค่าคอม (งานสำเร็จรูป)</DialogTitle>
            <DialogDescription>รายการใหม่จะถูกเพิ่มในสถานะ "รอดำเนินการ" — กดคำนวณเพื่อบันทึกค่าคอม</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>เลขที่ PO *</Label>
                <Input value={addForm.poNumber} onChange={e => setAddForm({ ...addForm, poNumber: e.target.value })} placeholder="PO-RM-2025-XXX" />
              </div>
              <div className="space-y-2">
                <Label>วันที่ส่งงาน *</Label>
                <Input type="date" value={addForm.deliveryDate} onChange={e => setAddForm({ ...addForm, deliveryDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ชื่องาน *</Label>
              <Input value={addForm.jobName} onChange={e => setAddForm({ ...addForm, jobName: e.target.value })} placeholder="ชื่องาน/โปรเจค" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ประเภทสินค้า (Config A) *</Label>
                <Select value={addForm.productCategory} onValueChange={v => setAddForm({ ...addForm, productCategory: v })}>
                  <SelectTrigger><SelectValue placeholder="เลือกประเภทสินค้า" /></SelectTrigger>
                  <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>พนักงานขาย *</Label>
                <Select value={addForm.saleName} onValueChange={v => setAddForm({ ...addForm, saleName: v })}>
                  <SelectTrigger><SelectValue placeholder="เลือกพนักงานขาย" /></SelectTrigger>
                  <SelectContent>
                    {getSaleEmployees(employees).map(emp => (
                      <SelectItem key={emp.id} value={emp.fullName}>{emp.fullName} ({emp.nickname})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>จำนวน {needsSalesAmount ? "" : "*"}</Label>
                <Input type="number" min={0} value={addForm.quantity || ""} onChange={e => setAddForm({ ...addForm, quantity: parseInt(e.target.value) || 0 })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>ยอดขายรวม (บาท) {needsSalesAmount ? "*" : ""}</Label>
                <Input type="number" min={0} value={addForm.totalSalesAmount || ""} onChange={e => setAddForm({ ...addForm, totalSalesAmount: parseFloat(e.target.value) || 0 })} placeholder="0" />
              </div>
            </div>
            {computedCommission && (
              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
                <p className="text-sm font-medium">ผลการคำนวณ (Preview)</p>
                <p className="text-sm text-muted-foreground">{computedCommission.description}</p>
                <div className="flex items-baseline gap-3">
                  <p className="text-2xl font-bold text-primary">฿{computedCommission.amount.toLocaleString()}</p>
                  <Badge variant="outline">{computedCommission.rateDisplay}</Badge>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleAddOrder}>บันทึกรายการ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
