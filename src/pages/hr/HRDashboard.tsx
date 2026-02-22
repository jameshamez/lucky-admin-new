import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DollarSign, TrendingUp, Award, Target, RefreshCw, Package, Layers, Download,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { defaultIncentiveTiers, calculateAdminIncentive } from "@/lib/commissionConfig";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

// Mock monthly data keyed by "YYYY-MM"
const allMonthlyData: Record<string, {
  sales: number;
  readyMade: number;
  madeToOrder: number;
  top5: { rank: number; name: string; readyMade: number; madeToOrder: number; total: number }[];
}> = {
  "2026-01": {
    sales: 2600000, readyMade: 3200, madeToOrder: 5200,
    top5: [
      { rank: 1, name: "คุณสมศักดิ์ ทำงาน", readyMade: 750, madeToOrder: 4800, total: 5550 },
      { rank: 2, name: "คุณสมชาย ใจดี", readyMade: 2000, madeToOrder: 500, total: 2500 },
      { rank: 3, name: "คุณวิชัย ขยัน", readyMade: 180, madeToOrder: 650, total: 830 },
      { rank: 4, name: "คุณสมหญิง รวยเงิน", readyMade: 700, madeToOrder: 200, total: 900 },
      { rank: 5, name: "คุณสุดา ดี", readyMade: 400, madeToOrder: 250, total: 650 },
    ],
  },
  "2026-02": {
    sales: 2850000, readyMade: 3650, madeToOrder: 5850,
    top5: [
      { rank: 1, name: "คุณสมศักดิ์ ทำงาน", readyMade: 850, madeToOrder: 5300, total: 6150 },
      { rank: 2, name: "คุณสมชาย ใจดี", readyMade: 2200, madeToOrder: 600, total: 2800 },
      { rank: 3, name: "คุณวิชัย ขยัน", readyMade: 200, madeToOrder: 700, total: 900 },
      { rank: 4, name: "คุณสมหญิง รวยเงิน", readyMade: 850, madeToOrder: 250, total: 1100 },
      { rank: 5, name: "คุณสุดา ดี", readyMade: 450, madeToOrder: 300, total: 750 },
    ],
  },
  "2025-12": {
    sales: 3100000, readyMade: 3400, madeToOrder: 5500,
    top5: [
      { rank: 1, name: "คุณสมศักดิ์ ทำงาน", readyMade: 900, madeToOrder: 4900, total: 5800 },
      { rank: 2, name: "คุณสมชาย ใจดี", readyMade: 1900, madeToOrder: 550, total: 2450 },
      { rank: 3, name: "คุณสมหญิง รวยเงิน", readyMade: 800, madeToOrder: 300, total: 1100 },
      { rank: 4, name: "คุณวิชัย ขยัน", readyMade: 250, madeToOrder: 600, total: 850 },
      { rank: 5, name: "คุณสุดา ดี", readyMade: 350, madeToOrder: 200, total: 550 },
    ],
  },
  "2025-11": {
    sales: 2400000, readyMade: 2900, madeToOrder: 4800,
    top5: [
      { rank: 1, name: "คุณสมศักดิ์ ทำงาน", readyMade: 700, madeToOrder: 4500, total: 5200 },
      { rank: 2, name: "คุณสมชาย ใจดี", readyMade: 1800, madeToOrder: 400, total: 2200 },
      { rank: 3, name: "คุณวิชัย ขยัน", readyMade: 150, madeToOrder: 500, total: 650 },
      { rank: 4, name: "คุณสมหญิง รวยเงิน", readyMade: 600, madeToOrder: 200, total: 800 },
      { rank: 5, name: "คุณสุดา ดี", readyMade: 300, madeToOrder: 150, total: 450 },
    ],
  },
};

const monthlyTrendBase: Record<string, { readyMade: number; madeToOrder: number }> = {
  "2025-09": { readyMade: 2800, madeToOrder: 4200 },
  "2025-10": { readyMade: 3100, madeToOrder: 5100 },
  "2025-11": { readyMade: 2900, madeToOrder: 4800 },
  "2025-12": { readyMade: 3400, madeToOrder: 5500 },
  "2026-01": { readyMade: 3200, madeToOrder: 5200 },
  "2026-02": { readyMade: 3650, madeToOrder: 5850 },
};

const thaiMonthShort = ["", "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

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

export default function HRDashboard() {
  const { toast } = useToast();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

  const selectedKey = `${selectedYear}-${selectedMonth.padStart(2, "0")}`;

  const data = useMemo(() => {
    return allMonthlyData[selectedKey] ?? { sales: 0, readyMade: 0, madeToOrder: 0, top5: [] };
  }, [selectedKey]);

  const currentMonthSales = data.sales;
  const readyMadeCommTotal = data.readyMade;
  const madeToOrderCommTotal = data.madeToOrder;
  const totalCommission = readyMadeCommTotal + madeToOrderCommTotal;

  const incentiveResult = useMemo(() => calculateAdminIncentive(defaultIncentiveTiers, currentMonthSales), [currentMonthSales]);

  // Build 6-month trend ending at selected month
  const monthlyTrendData = useMemo(() => {
    const result = [];
    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth);
    for (let i = 5; i >= 0; i--) {
      let m = month - i;
      let y = year;
      while (m <= 0) { m += 12; y -= 1; }
      const key = `${y}-${m.toString().padStart(2, "0")}`;
      const d = monthlyTrendBase[key];
      result.push({
        month: thaiMonthShort[m],
        readyMade: d?.readyMade ?? 0,
        madeToOrder: d?.madeToOrder ?? 0,
      });
    }
    return result;
  }, [selectedMonth, selectedYear]);

  const pieData = [
    { name: "สำเร็จรูป", value: readyMadeCommTotal, color: "hsl(var(--chart-1))" },
    { name: "สั่งผลิต", value: madeToOrderCommTotal, color: "hsl(var(--chart-2))" },
  ];

  const progressPercent = useMemo(() => {
    if (incentiveResult.nextTierSales === null) return 100;
    const currentTier = defaultIncentiveTiers.find(t => currentMonthSales >= t.minSales && (t.maxSales === null || currentMonthSales <= t.maxSales));
    const base = currentTier?.minSales ?? 0;
    const target = incentiveResult.nextTierSales;
    if (target <= base) return 100;
    return Math.min(100, Math.round(((currentMonthSales - base) / (target - base)) * 100));
  }, [incentiveResult, currentMonthSales]);

  const handleRefresh = () => {
    toast({ title: "รีเฟรชข้อมูล", description: `โหลดข้อมูลเดือน ${months.find(m => m.value === selectedMonth)?.label} ${years.find(y => y.value === selectedYear)?.label} แล้ว` });
  };

  const handleExportExcel = () => {
    const monthLabel = months.find(m => m.value === selectedMonth)?.label ?? selectedMonth;
    const yearLabel = years.find(y => y.value === selectedYear)?.label ?? selectedYear;
    const periodLabel = `${monthLabel} ${yearLabel}`;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ["สรุปค่าคอมมิชชั่นประจำเดือน", periodLabel],
      [],
      ["รายการ", "จำนวน (บาท)"],
      ["ยอดขายรวม", currentMonthSales],
      ["ค่าคอมรวม", totalCommission],
      ["ค่าคอม สำเร็จรูป", readyMadeCommTotal],
      ["ค่าคอม สั่งผลิต", madeToOrderCommTotal],
      [],
      ["Admin Incentive"],
      ["ขั้นปัจจุบัน", incentiveResult.tierLabel],
      ["Incentive ต่อคน", incentiveResult.amount],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "สรุปรวม");

    // Sheet 2: Top 5
    const top5Data = [
      ["ลำดับ", "ชื่อพนักงาน", "สำเร็จรูป (฿)", "สั่งผลิต (฿)", "รวม (฿)"],
      ...data.top5.map(e => [e.rank, e.name, e.readyMade, e.madeToOrder, e.total]),
    ];
    const wsTop5 = XLSX.utils.aoa_to_sheet(top5Data);
    wsTop5["!cols"] = [{ wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsTop5, "Top 5 พนักงาน");

    // Sheet 3: 6-month trend
    const trendData = [
      ["เดือน", "สำเร็จรูป (฿)", "สั่งผลิต (฿)", "รวม (฿)"],
      ...monthlyTrendData.map(d => [d.month, d.readyMade, d.madeToOrder, d.readyMade + d.madeToOrder]),
    ];
    const wsTrend = XLSX.utils.aoa_to_sheet(trendData);
    wsTrend["!cols"] = [{ wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsTrend, "แนวโน้ม 6 เดือน");

    // Sheet 4: Incentive tiers
    const incentiveData = [
      ["ช่วงยอดขาย", "ขั้นต่ำ (฿)", "ขั้นสูง (฿)", "Incentive/คน (฿)", "สถานะ"],
      ...defaultIncentiveTiers.filter(t => t.active).map(t => [
        t.label, t.minSales, t.maxSales ?? "ไม่จำกัด", t.incentivePerPerson,
        currentMonthSales >= t.minSales && (t.maxSales === null || currentMonthSales <= t.maxSales) ? "✓ ปัจจุบัน" : ""
      ]),
    ];
    const wsIncentive = XLSX.utils.aoa_to_sheet(incentiveData);
    wsIncentive["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsIncentive, "Incentive Tiers");

    XLSX.writeFile(wb, `HR_Commission_${selectedYear}_${selectedMonth.padStart(2, "0")}.xlsx`);
    toast({ title: "ส่งออกสำเร็จ", description: `ดาวน์โหลดไฟล์ Excel สรุปเดือน ${periodLabel} แล้ว` });
  };

  const hasData = data.sales > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">แดชบอร์ด HR & Commission</h1>
          <p className="text-muted-foreground">ภาพรวมค่าคอมมิชชั่น และ Incentive แอดมิน</p>
        </div>
        {hasData && (
          <Button variant="outline" onClick={handleExportExcel} className="gap-2">
            <Download className="w-4 h-4" />Export Excel
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">เดือน</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">ปี</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{years.map(y => <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex items-end">
              <Button className="w-full" onClick={handleRefresh}><RefreshCw className="w-4 h-4 mr-2" />รีเฟรชข้อมูล</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!hasData && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground text-lg">ไม่มีข้อมูลสำหรับเดือน {months.find(m => m.value === selectedMonth)?.label} {years.find(y => y.value === selectedYear)?.label}</p>
            <p className="text-sm text-muted-foreground mt-1">ลองเลือกเดือนอื่น หรือรอข้อมูลถูกบันทึกเข้าระบบ</p>
          </CardContent>
        </Card>
      )}

      {hasData && (
        <>
          {/* KPI Cards Row 1 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ยอดขายรวมเดือนนี้</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿{currentMonthSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">ใช้คำนวณ Incentive แอดมิน</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ค่าคอมรวมเดือนนี้</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">฿{totalCommission.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">สำเร็จรูป + สั่งผลิต</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สำเร็จรูป</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿{readyMadeCommTotal.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{totalCommission > 0 ? ((readyMadeCommTotal / totalCommission) * 100).toFixed(1) : 0}% ของยอดรวม</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สั่งผลิต</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿{madeToOrderCommTotal.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{totalCommission > 0 ? ((madeToOrderCommTotal / totalCommission) * 100).toFixed(1) : 0}% ของยอดรวม</p>
              </CardContent>
            </Card>
          </div>

          {/* Admin Incentive Tracker */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Admin Incentive Tracker
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">ความคืบหน้ายอดขายเดือนนี้สู่เป้า Incentive ขั้นถัดไป</p>
              </div>
              <Badge variant={incentiveResult.amount > 0 ? "default" : "outline"} className="text-sm">
                {incentiveResult.amount > 0 ? `ได้รับ ฿${incentiveResult.amount.toLocaleString()}/คน` : "ยังไม่ถึงเป้า"}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>ยอดขายปัจจุบัน: <strong>฿{currentMonthSales.toLocaleString()}</strong></span>
                  {incentiveResult.nextTierSales && (
                    <span>เป้าถัดไป: <strong>฿{incentiveResult.nextTierSales.toLocaleString()}</strong> → ฿{incentiveResult.nextTierAmount?.toLocaleString()}/คน</span>
                  )}
                </div>
                <Progress value={progressPercent} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>ขั้นปัจจุบัน: {incentiveResult.tierLabel}</span>
                  <span>{progressPercent}% สู่ขั้นถัดไป</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {defaultIncentiveTiers.filter(t => t.active).map(tier => (
                    <Badge
                      key={tier.id}
                      variant={currentMonthSales >= tier.minSales && (tier.maxSales === null || currentMonthSales <= tier.maxSales) ? "default" : "outline"}
                      className="text-xs"
                    >
                      {tier.label}: ฿{tier.incentivePerPerson.toLocaleString()}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>แนวโน้มค่าคอมย้อนหลัง 6 เดือน</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="readyMade" fill="hsl(var(--chart-1))" name="สำเร็จรูป" />
                    <Bar dataKey="madeToOrder" fill="hsl(var(--chart-2))" name="สั่งผลิต" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>สัดส่วนค่าคอมตามประเภท</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top 5 Ranking */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" />Top 5 พนักงานค่าคอมสูงสุด</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">ลำดับ</TableHead>
                    <TableHead>ชื่อพนักงาน</TableHead>
                    <TableHead className="text-right">สำเร็จรูป</TableHead>
                    <TableHead className="text-right">สั่งผลิต</TableHead>
                    <TableHead className="text-right">รวม</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.top5.map(emp => (
                    <TableRow key={emp.rank}>
                      <TableCell>
                        <Badge variant={emp.rank <= 3 ? "default" : "secondary"}>{emp.rank}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell className="text-right">฿{emp.readyMade.toLocaleString()}</TableCell>
                      <TableCell className="text-right">฿{emp.madeToOrder.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-primary">฿{emp.total.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
