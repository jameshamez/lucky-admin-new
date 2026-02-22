import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Download, FileSpreadsheet, ChevronDown, ChevronRight, DollarSign, Users, Award, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { defaultIncentiveTiers, calculateAdminIncentive } from "@/lib/commissionConfig";
import { defaultEmployees, getAdminEmployees, type Employee, type EmployeeRole, type EmployeeStatus } from "@/lib/employeeData";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";

// Mock transaction data — in production this comes from DB
type Transaction = {
  id: string;
  month: string; // "2025-01", "2025-02"
  employeeName: string;
  poNumber: string;
  jobName: string;
  type: "ReadyMade" | "MadeToOrder";
  quantity: number;
  totalSales: number;
  commission: number;
  rateInfo: string;
};

const mockTransactions: Transaction[] = [
  // January 2025
  { id: "t1", month: "2025-01", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-RM-001", jobName: "ถ้วยพลาสติกไทย 100 ชิ้น", type: "ReadyMade", quantity: 100, totalSales: 15000, commission: 300, rateInfo: "3 บาท/ชิ้น" },
  { id: "t2", month: "2025-01", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-MTO-001", jobName: "โล่อะคริลิค 30 ชิ้น", type: "MadeToOrder", quantity: 30, totalSales: 120000, commission: 100, rateInfo: "Tier 11-50" },
  { id: "t3", month: "2025-01", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-RM-002", jobName: "อะไหล่ถ้วยรางวัล", type: "ReadyMade", quantity: 1, totalSales: 38000, commission: 1900, rateInfo: "5% ยอดขาย" },
  { id: "t4", month: "2025-01", employeeName: "คุณสมหญิง รวยเงิน", poNumber: "PO-MTO-002", jobName: "เหรียญรางวัลกีฬา 5000 ชิ้น", type: "MadeToOrder", quantity: 5000, totalSales: 85000, commission: 250, rateInfo: "Tier 1-10k" },
  { id: "t5", month: "2025-01", employeeName: "คุณสมหญิง รวยเงิน", poNumber: "PO-RM-003", jobName: "ถ้วยโลหะ L/XL 20 ชิ้น", type: "ReadyMade", quantity: 20, totalSales: 80000, commission: 600, rateInfo: "30 บาท/ชิ้น" },
  { id: "t6", month: "2025-01", employeeName: "คุณวิชัย ขยัน", poNumber: "PO-MTO-003", jobName: "เสื้อวิ่ง 2500 ตัว", type: "MadeToOrder", quantity: 2500, totalSales: 450000, commission: 200, rateInfo: "Tier 1k-3k" },
  { id: "t7", month: "2025-01", employeeName: "คุณวิชัย ขยัน", poNumber: "PO-RM-004", jobName: "ระบบวิ่ง 200 คน", type: "ReadyMade", quantity: 200, totalSales: 35000, commission: 200, rateInfo: "1 บาท/คน" },
  { id: "t8", month: "2025-01", employeeName: "คุณสมศักดิ์ ทำงาน", poNumber: "PO-MTO-004", jobName: "ออแกไนท์กีฬาสี", type: "MadeToOrder", quantity: 1, totalSales: 95000, commission: 5000, rateInfo: "Fixed Job" },
  { id: "t9", month: "2025-01", employeeName: "คุณสมศักดิ์ ทำงาน", poNumber: "PO-RM-005", jobName: "เหรียญมาตรฐาน 500 ชิ้น", type: "ReadyMade", quantity: 500, totalSales: 12500, commission: 250, rateInfo: "0.5 บาท/ชิ้น" },
  { id: "t10", month: "2025-01", employeeName: "คุณสุดา ดี", poNumber: "PO-MTO-005", jobName: "โล่คริสตัล 200 ชิ้น", type: "MadeToOrder", quantity: 200, totalSales: 300000, commission: 300, rateInfo: "Tier 101-300" },
  // February 2025
  { id: "t11", month: "2025-02", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-RM-010", jobName: "ถ้วยพลาสติกจีน 80 ชิ้น", type: "ReadyMade", quantity: 80, totalSales: 40000, commission: 400, rateInfo: "5 บาท/ชิ้น" },
  { id: "t12", month: "2025-02", employeeName: "คุณสมชาย ใจดี", poNumber: "PO-MTO-010", jobName: "เหรียญสั่งผลิต 12000 ชิ้น", type: "MadeToOrder", quantity: 12000, totalSales: 180000, commission: 500, rateInfo: "Tier 10k+" },
  { id: "t13", month: "2025-02", employeeName: "คุณสมหญิง รวยเงิน", poNumber: "PO-RM-011", jobName: "ถ้วยพิวเตอร์ 15 ชิ้น", type: "ReadyMade", quantity: 15, totalSales: 75000, commission: 450, rateInfo: "30 บาท/ชิ้น" },
  { id: "t14", month: "2025-02", employeeName: "คุณวิชัย ขยัน", poNumber: "PO-MTO-011", jobName: "เสื้อ 4000 ตัว", type: "MadeToOrder", quantity: 4000, totalSales: 720000, commission: 500, rateInfo: "Tier 3k+" },
  { id: "t15", month: "2025-02", employeeName: "คุณสมศักดิ์ ทำงาน", poNumber: "PO-MTO-012", jobName: "ออแกไนท์งานวิ่ง", type: "MadeToOrder", quantity: 1, totalSales: 150000, commission: 5000, rateInfo: "Fixed Job" },
];

const monthLabels: Record<string, string> = {
  "01": "มกราคม", "02": "กุมภาพันธ์", "03": "มีนาคม", "04": "เมษายน",
  "05": "พฤษภาคม", "06": "มิถุนายน", "07": "กรกฎาคม", "08": "สิงหาคม",
  "09": "กันยายน", "10": "ตุลาคม", "11": "พฤศจิกายน", "12": "ธันวาคม",
};

const formatCurrency = (amount: number) => `฿${amount.toLocaleString()}`;

const MonthlyCommissionReport = () => {
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "ReadyMade" | "MadeToOrder">("all");
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [expandedEmployees, setExpandedEmployees] = useState<string[]>([]);

  const [employees, setEmployees] = useState<Employee[]>(defaultEmployees);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("employees").select("*").order("full_name");
      if (data && data.length > 0) {
        setEmployees(data.map(d => ({ id: d.id, fullName: d.full_name, nickname: d.nickname, position: d.position, role: d.role as EmployeeRole, status: d.status as EmployeeStatus })));
      }
    };
    load();
  }, []);

  const incentiveTiers = defaultIncentiveTiers;
  const adminEmployees = getAdminEmployees(employees);

  // Filter transactions
  const filtered = useMemo(() => {
    return mockTransactions.filter(t => {
      const yearMatch = selectedYear === "all" || t.month.startsWith(selectedYear);
      const monthMatch = selectedMonth === "all" || t.month.endsWith(`-${selectedMonth}`);
      const typeMatch = typeFilter === "all" || t.type === typeFilter;
      return yearMatch && monthMatch && typeMatch;
    });
  }, [selectedYear, selectedMonth, typeFilter]);

  // Group by month
  const monthlyData = useMemo(() => {
    const grouped: Record<string, Transaction[]> = {};
    filtered.forEach(t => { (grouped[t.month] = grouped[t.month] || []).push(t); });

    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, txns]) => {
        const totalSales = txns.reduce((s, t) => s + t.totalSales, 0);
        const totalCommission = txns.reduce((s, t) => s + t.commission, 0);
        const incentive = calculateAdminIncentive(incentiveTiers, totalSales);

        // Group by employee
        const byEmployee: Record<string, Transaction[]> = {};
        txns.forEach(t => { (byEmployee[t.employeeName] = byEmployee[t.employeeName] || []).push(t); });
        const employees = Object.entries(byEmployee).map(([name, etxns]) => ({
          name,
          totalCommission: etxns.reduce((s, t) => s + t.commission, 0),
          readyMade: etxns.filter(t => t.type === "ReadyMade").reduce((s, t) => s + t.commission, 0),
          madeToOrder: etxns.filter(t => t.type === "MadeToOrder").reduce((s, t) => s + t.commission, 0),
          transactions: etxns,
        })).sort((a, b) => b.totalCommission - a.totalCommission);

        const [year, mm] = month.split("-");
        const label = `${monthLabels[mm]} ${parseInt(year) + 543}`;

        return { month, label, totalSales, totalCommission, incentive, grandTotal: totalCommission + incentive.amount, employees, txnCount: txns.length };
      });
  }, [filtered, incentiveTiers]);

  const toggleMonth = (month: string) => setExpandedMonths(prev => prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]);
  const toggleEmployee = (key: string) => setExpandedEmployees(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);

  // Overall totals
  const overallSales = monthlyData.reduce((s, m) => s + m.totalSales, 0);
  const overallCommission = monthlyData.reduce((s, m) => s + m.totalCommission, 0);
  const overallIncentive = monthlyData.reduce((s, m) => s + m.incentive.amount, 0);

  // Export to Excel
  const handleExport = useCallback(() => {
    if (filtered.length === 0) {
      toast.error("ไม่มีข้อมูลสำหรับ Export");
      return;
    }

    const wb = XLSX.utils.book_new();

    // Group filtered data by month
    const byMonth: Record<string, typeof filtered> = {};
    filtered.forEach(t => {
      (byMonth[t.month] = byMonth[t.month] || []).push(t);
    });

    // Sort months descending
    const sortedMonths = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

    sortedMonths.forEach(month => {
      const txns = byMonth[month];
      const [y, m] = month.split("-");
      const monthLabel = `${monthLabels[m]} ${parseInt(y) + 543}`;
      const sheetName = `${monthLabels[m]} ${parseInt(y) + 543}`.slice(0, 31);

      const rows: Record<string, any>[] = txns.map(t => ({
        "เดือน": monthLabel,
        "พนักงาน": t.employeeName,
        "เลข PO": t.poNumber,
        "ชื่องาน": t.jobName,
        "ประเภท": t.type === "ReadyMade" ? "สำเร็จรูป" : "สั่งผลิต",
        "จำนวน": t.quantity,
        "ยอดขาย (฿)": t.totalSales,
        "เรท/เงื่อนไข": t.rateInfo,
        "ค่าคอม (฿)": t.commission,
      }));

      const monthSales = txns.reduce((s, t) => s + t.totalSales, 0);
      const monthCommission = txns.reduce((s, t) => s + t.commission, 0);

      // Summary row for commission
      rows.push({
        "เดือน": "", "พนักงาน": "", "เลข PO": "", "ชื่องาน": "", "ประเภท": "",
        "จำนวน": "", "ยอดขาย (฿)": monthSales, "เรท/เงื่อนไข": "รวมค่าคอม", "ค่าคอม (฿)": monthCommission,
      });

      // Blank row
      rows.push({ "เดือน": "", "พนักงาน": "", "เลข PO": "", "ชื่องาน": "", "ประเภท": "", "จำนวน": "", "ยอดขาย (฿)": "", "เรท/เงื่อนไข": "", "ค่าคอม (฿)": "" });

      // Admin Incentive section
      const incentive = calculateAdminIncentive(incentiveTiers, monthSales);
      rows.push({
        "เดือน": "Incentive แอดมิน", "พนักงาน": "", "เลข PO": "", "ชื่องาน": "",
        "ประเภท": incentive.amount > 0 ? incentive.tierLabel : "ไม่ถึงเป้า",
        "จำนวน": "", "ยอดขาย (฿)": `ยอดขายรวม: ${monthSales}`, "เรท/เงื่อนไข": "", "ค่าคอม (฿)": "",
      });

      if (incentive.amount > 0 && adminEmployees.length > 0) {
        // Header row for admin
        rows.push({
          "เดือน": "รหัสพนักงาน", "พนักงาน": "ชื่อ-นามสกุล", "เลข PO": "ตำแหน่ง", "ชื่องาน": "",
          "ประเภท": "", "จำนวน": "", "ยอดขาย (฿)": "", "เรท/เงื่อนไข": "", "ค่าคอม (฿)": "Incentive (฿)",
        });
        adminEmployees.forEach(admin => {
          rows.push({
            "เดือน": admin.id, "พนักงาน": admin.fullName, "เลข PO": admin.position, "ชื่องาน": "",
            "ประเภท": "", "จำนวน": "", "ยอดขาย (฿)": "", "เรท/เงื่อนไข": "", "ค่าคอม (฿)": incentive.amount,
          });
        });
        rows.push({
          "เดือน": "", "พนักงาน": "", "เลข PO": "", "ชื่องาน": "", "ประเภท": "",
          "จำนวน": "", "ยอดขาย (฿)": "", "เรท/เงื่อนไข": `รวม Incentive (${adminEmployees.length} คน)`, "ค่าคอม (฿)": incentive.amount * adminEmployees.length,
        });
      }

      // Grand total
      rows.push({ "เดือน": "", "พนักงาน": "", "เลข PO": "", "ชื่องาน": "", "ประเภท": "", "จำนวน": "", "ยอดขาย (฿)": "", "เรท/เงื่อนไข": "", "ค่าคอม (฿)": "" });
      const grandTotal = monthCommission + (incentive.amount > 0 ? incentive.amount * adminEmployees.length : 0);
      rows.push({
        "เดือน": "", "พนักงาน": "", "เลข PO": "", "ชื่องาน": "", "ประเภท": "",
        "จำนวน": "", "ยอดขาย (฿)": "", "เรท/เงื่อนไข": "Grand Total", "ค่าคอม (฿)": grandTotal,
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 20 }, { wch: 22 }, { wch: 15 }, { wch: 30 },
        { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    const yearLabel = selectedYear === "all" ? "ทั้งหมด" : (parseInt(selectedYear) + 543).toString();
    XLSX.writeFile(wb, `รายงานค่าคอม_${yearLabel}.xlsx`);
    toast.success(`ดาวน์โหลดไฟล์ Excel สำเร็จ (${sortedMonths.length} เดือน)`);
  }, [filtered, selectedYear, incentiveTiers, adminEmployees]);

  // Show report handler — expand all months
  const handleShowReport = useCallback(() => {
    const allMonthKeys = monthlyData.map(m => m.month);
    setExpandedMonths(allMonthKeys);
    toast.success(`แสดงรายงาน ${monthlyData.length} เดือน`);
  }, [monthlyData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">รายงานค่าคอมมิชชั่นรายเดือน</h1>
          <p className="text-muted-foreground mt-1">สรุปค่าคอมและ Incentive แอดมิน แบบ Drill-down</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><FileSpreadsheet className="w-4 h-4 mr-2" />Export</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">ปี</label>
              <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); if (v !== "all") setSelectedMonth("all"); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="2025">2568</SelectItem>
                  <SelectItem value="2024">2567</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">เดือน</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {Object.entries(monthLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">ประเภทงาน</label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="ReadyMade">สำเร็จรูป</SelectItem>
                  <SelectItem value="MadeToOrder">สั่งผลิต</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={handleShowReport}>แสดงรายงาน</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดขายรวม</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(overallSales)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ค่าคอมรวม</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(overallCommission)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incentive แอดมินรวม</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatCurrency(overallIncentive)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดจ่ายรวม</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-primary">{formatCurrency(overallCommission + overallIncentive)}</div></CardContent>
        </Card>
      </div>

      {/* Drill-down Table */}
      <Card>
        <CardHeader><CardTitle>ประวัติรายเดือน (Drill-down)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {monthlyData.length === 0 && <p className="text-center text-muted-foreground py-8">ไม่พบข้อมูล</p>}

          {monthlyData.map(mData => {
            const isMonthExpanded = expandedMonths.includes(mData.month);
            return (
              <div key={mData.month} className="border rounded-lg overflow-hidden">
                {/* Level 1: Month row */}
                <button
                  onClick={() => toggleMonth(mData.month)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {isMonthExpanded ? <ChevronDown className="w-5 h-5 text-muted-foreground" /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                    <div>
                      <p className="font-semibold text-lg">{mData.label}</p>
                      <p className="text-xs text-muted-foreground">{mData.txnCount} รายการ · {mData.employees.length} พนักงาน</p>
                    </div>
                  </div>
                  <div className="flex gap-6 items-center text-sm">
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">ยอดขายรวม</p>
                      <p className="font-medium">{formatCurrency(mData.totalSales)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">ค่าคอม Sale</p>
                      <p className="font-medium">{formatCurrency(mData.totalCommission)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Incentive แอดมิน</p>
                      <p className="font-medium">
                        {mData.incentive.amount > 0 ? (
                          <Badge variant="default" className="text-xs">{formatCurrency(mData.incentive.amount)}/คน</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">ไม่ถึงเป้า</Badge>
                        )}
                      </p>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-muted-foreground text-xs">Grand Total</p>
                      <p className="font-bold text-primary">{formatCurrency(mData.grandTotal)}</p>
                    </div>
                  </div>
                </button>

                {/* Level 2: Employees */}
                {isMonthExpanded && (
                  <div className="border-t bg-muted/20 px-4 pb-2">
                    {/* Sales Commission Drill-down */}
                    {mData.employees.map(emp => {
                      const empKey = `${mData.month}-${emp.name}`;
                      const isEmpExpanded = expandedEmployees.includes(empKey);
                      return (
                        <div key={empKey} className="border-b last:border-b-0">
                          <button
                            onClick={() => toggleEmployee(empKey)}
                            className="w-full flex items-center justify-between py-3 px-2 hover:bg-muted/30 transition-colors text-left"
                          >
                            <div className="flex items-center gap-2">
                              {isEmpExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                              <span className="font-medium">{emp.name}</span>
                              <span className="text-xs text-muted-foreground">({emp.transactions.length} รายการ)</span>
                            </div>
                            <div className="flex gap-4 text-sm">
                              <div className="text-right">
                                <span className="text-xs text-muted-foreground mr-1">สำเร็จรูป:</span>
                                <span className="font-medium">{formatCurrency(emp.readyMade)}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-muted-foreground mr-1">สั่งผลิต:</span>
                                <span className="font-medium">{formatCurrency(emp.madeToOrder)}</span>
                              </div>
                              <div className="text-right min-w-[100px]">
                                <span className="font-bold text-primary">{formatCurrency(emp.totalCommission)}</span>
                              </div>
                            </div>
                          </button>

                          {/* Level 3: Transactions */}
                          {isEmpExpanded && (
                            <div className="pl-8 pr-2 pb-3">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>PO</TableHead>
                                    <TableHead>ชื่องาน</TableHead>
                                    <TableHead>ประเภท</TableHead>
                                    <TableHead className="text-right">จำนวน</TableHead>
                                    <TableHead className="text-right">ยอดขาย</TableHead>
                                    <TableHead>เรท/เงื่อนไข</TableHead>
                                    <TableHead className="text-right">ค่าคอม</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {emp.transactions.map(txn => (
                                    <TableRow key={txn.id}>
                                      <TableCell className="font-medium text-xs">{txn.poNumber}</TableCell>
                                      <TableCell className="text-xs max-w-[180px] truncate">{txn.jobName}</TableCell>
                                      <TableCell>
                                        <Badge variant={txn.type === "ReadyMade" ? "default" : "secondary"} className="text-xs">
                                          {txn.type === "ReadyMade" ? "สำเร็จรูป" : "สั่งผลิต"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right text-xs">{txn.quantity.toLocaleString()}</TableCell>
                                      <TableCell className="text-right text-xs">{formatCurrency(txn.totalSales)}</TableCell>
                                      <TableCell><Badge variant="outline" className="text-xs">{txn.rateInfo}</Badge></TableCell>
                                      <TableCell className="text-right font-bold text-primary text-xs">{formatCurrency(txn.commission)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Admin Incentive Summary */}
                    {mData.incentive.amount > 0 && adminEmployees.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-dashed">
                        <div className="flex items-center gap-2 mb-2 px-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-semibold">Incentive แอดมิน — {formatCurrency(mData.incentive.amount)}/คน</span>
                          <Badge variant="outline" className="text-xs">{mData.incentive.tierLabel}</Badge>
                        </div>
                        <div className="rounded-md border bg-background">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>รหัส</TableHead>
                                <TableHead>ชื่อ-นามสกุล</TableHead>
                                <TableHead>ตำแหน่ง</TableHead>
                                <TableHead className="text-right">Incentive</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {adminEmployees.map(admin => (
                                <TableRow key={admin.id}>
                                  <TableCell className="text-xs font-medium">{admin.id}</TableCell>
                                  <TableCell className="text-xs">{admin.fullName}</TableCell>
                                  <TableCell className="text-xs">{admin.position}</TableCell>
                                  <TableCell className="text-right text-xs font-bold text-amber-600">{formatCurrency(mData.incentive.amount)}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-muted/50">
                                <TableCell colSpan={3} className="text-xs font-semibold text-right">รวม Incentive ({adminEmployees.length} คน)</TableCell>
                                <TableCell className="text-right text-xs font-bold text-amber-600">{formatCurrency(mData.incentive.amount * adminEmployees.length)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                    {mData.incentive.amount === 0 && (
                      <div className="mt-3 pt-3 border-t border-dashed px-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Award className="w-4 h-4" />
                          <span>Incentive แอดมิน: ไม่ถึงเป้า (ยอดขาย {formatCurrency(mData.totalSales)})</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonthlyCommissionReport;
