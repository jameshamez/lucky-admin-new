import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  Target,
  Download,
  Loader2
} from "lucide-react";
import { accountingService } from "@/services/accountingService";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const EXPENSE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

// Business targets (goals set by management, not measured data — same pattern as the
// hardcoded per-person sales target already used elsewhere in this app's dashboards).
const KPI_TARGETS = {
  grossMargin: 25.0,
  netMargin: 12.0,
  avgCostPerOrder: 35000,
};

export default function FinancialReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("year");
  const [loading, setLoading] = useState(true);
  const [cashFlow, setCashFlow] = useState<{ month: string; income: number; expense: number }[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<{ category: string; amount: number; percentage: number; color: string }[]>([]);
  const [orderProfitData, setOrderProfitData] = useState<{ orderId: string; customer: string; revenue: number; cost: number; profit: number; margin: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dashRes, woRes] = await Promise.all([
          accountingService.getDashboardData(),
          accountingService.getWorkOrders(),
        ]);

        if (dashRes.status === "success") {
          setCashFlow(dashRes.data.cashFlow || []);
          const cats = dashRes.data.topExpenseCategories || [];
          setExpenseBreakdown(cats.map((c: any, i: number) => ({
            category: c.name,
            amount: c.amount,
            percentage: c.percent,
            color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
          })));
        }

        if (woRes.status === "success") {
          const rows = (woRes.data || [])
            .map((wo: any) => {
              const profit = wo.revenue - wo.expense;
              return {
                orderId: wo.id,
                customer: wo.customer,
                revenue: wo.revenue,
                cost: wo.expense,
                profit,
                margin: wo.revenue > 0 ? Math.round((profit / wo.revenue) * 1000) / 10 : 0,
              };
            })
            .sort((a: any, b: any) => b.profit - a.profit)
            .slice(0, 10);
          setOrderProfitData(rows);
        }
      } catch {
        toast.error("ไม่สามารถโหลดข้อมูลรายงานทางการเงินได้");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const profitLossData = useMemo(
    () => cashFlow.map((c) => ({ month: c.month, revenue: c.income, cost: c.expense, profit: c.income - c.expense })),
    [cashFlow]
  );

  const totals = useMemo(() => {
    const revenue = cashFlow.reduce((s, c) => s + c.income, 0);
    const cost = cashFlow.reduce((s, c) => s + c.expense, 0);
    return { revenue, cost, profit: revenue - cost };
  }, [cashFlow]);

  const kpiData = useMemo(() => {
    const grossMargin = totals.revenue > 0 ? Math.round((totals.profit / totals.revenue) * 1000) / 10 : 0;
    const avgCostPerOrder = orderProfitData.length > 0
      ? Math.round(orderProfitData.reduce((s, o) => s + o.cost, 0) / orderProfitData.length)
      : 0;
    return [
      { metric: "อัตรากำไรขั้นต้น (%)", current: grossMargin, target: KPI_TARGETS.grossMargin, higherIsBetter: true },
      { metric: "อัตรากำไรสุทธิ (%)", current: grossMargin, target: KPI_TARGETS.netMargin, higherIsBetter: true },
      { metric: "ต้นทุนเฉลี่ยต่อออเดอร์ (฿)", current: avgCostPerOrder, target: KPI_TARGETS.avgCostPerOrder, higherIsBetter: false },
    ];
  }, [totals, orderProfitData]);

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const summaryRows = [
      ["สรุปรายงานทางการเงิน (6 เดือนล่าสุด)"],
      [],
      ["รายรับรวม", totals.revenue],
      ["ต้นทุนรวม", totals.cost],
      ["กำไรสุทธิ", totals.profit],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    wsSummary["!cols"] = [{ wch: 24 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "สรุปรวม");

    if (profitLossData.length > 0) {
      const rows = [["เดือน", "รายรับ", "ต้นทุน", "กำไร"], ...profitLossData.map(p => [p.month, p.revenue, p.cost, p.profit])];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws, "กำไร-ขาดทุนรายเดือน");
    }

    if (orderProfitData.length > 0) {
      const rows = [["รหัสออเดอร์", "ลูกค้า", "รายรับ", "ต้นทุน", "กำไร", "Margin (%)"], ...orderProfitData.map(o => [o.orderId, o.customer, o.revenue, o.cost, o.profit, o.margin])];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws, "ต้นทุนต่อออเดอร์ (Top 10)");
    }

    if (expenseBreakdown.length > 0) {
      const rows = [["หมวดค่าใช้จ่าย", "ยอดรวม", "สัดส่วน (%)"], ...expenseBreakdown.map(e => [e.category, e.amount, e.percentage])];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 22 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws, "หมวดค่าใช้จ่าย");
    }

    XLSX.writeFile(wb, `financial-reports-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("ส่งออกรายงานสำเร็จ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">รายงานทางการเงิน</h1>
            <p className="text-muted-foreground">รายงานสุขภาพทางการเงินของบริษัท (6 เดือนล่าสุด)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">เดือนนี้</SelectItem>
              <SelectItem value="quarter">ไตรมาสนี้</SelectItem>
              <SelectItem value="year">ปีนี้</SelectItem>
            </SelectContent>
          </Select>

          <Button className="gap-2" onClick={handleExportExcel}>
            <Download className="h-4 w-4" />
            ส่งออกรายงาน
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายรับรวม</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{totals.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">รวม 6 เดือนล่าสุด</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ต้นทุนรวม</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{totals.cost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">รวม 6 เดือนล่าสุด</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไรสุทธิ</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{totals.profit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">รวม 6 เดือนล่าสุด</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>รายงานกำไร-ขาดทุน</CardTitle>
            <CardDescription>เปรียบเทียบรายรับ ต้นทุน และกำไรรายเดือน</CardDescription>
          </CardHeader>
          <CardContent>
            {profitLossData.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">ไม่มีข้อมูล</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={profitLossData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="รายรับ" />
                  <Area type="monotone" dataKey="cost" stackId="2" stroke="#ef4444" fill="#ef4444" name="ต้นทุน" />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} name="กำไร" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>การกระจายค่าใช้จ่าย</CardTitle>
            <CardDescription>สัดส่วนค่าใช้จ่ายแยกตามหมวดหมู่ (เดือนนี้)</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseBreakdown.length === 0 ? (
              <p className="text-center text-muted-foreground py-16">ไม่มีข้อมูลค่าใช้จ่ายเดือนนี้</p>
            ) : (
              <div className="space-y-4">
                {expenseBreakdown.map((expense, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{expense.category}</span>
                      <span className="text-sm text-muted-foreground">
                        ฿{expense.amount.toLocaleString()} ({expense.percentage}%)
                      </span>
                    </div>
                    <Progress value={expense.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายงานต้นทุนต่อออเดอร์ (Top 10 กำไรสูงสุด)</CardTitle>
          <CardDescription>วิเคราะห์กำไร-ขาดทุนของแต่ละออเดอร์ (ต้นทุนประมาณ 65% ของยอดขาย)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">รหัสออเดอร์</th>
                  <th className="text-left py-2 font-medium">ลูกค้า</th>
                  <th className="text-right py-2 font-medium">รายรับ</th>
                  <th className="text-right py-2 font-medium">ต้นทุน</th>
                  <th className="text-right py-2 font-medium">กำไร</th>
                  <th className="text-right py-2 font-medium">อัตรากำไร</th>
                </tr>
              </thead>
              <tbody>
                {orderProfitData.length === 0 ? (
                  <tr><td colSpan={6} className="text-center text-muted-foreground py-8">ไม่มีข้อมูลออเดอร์</td></tr>
                ) : orderProfitData.map((order, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 font-mono">{order.orderId}</td>
                    <td className="py-2">{order.customer}</td>
                    <td className="py-2 text-right">฿{order.revenue.toLocaleString()}</td>
                    <td className="py-2 text-right">฿{order.cost.toLocaleString()}</td>
                    <td className="py-2 text-right font-medium">฿{order.profit.toLocaleString()}</td>
                    <td className="py-2 text-right">
                      <span className={`px-2 py-1 rounded text-xs ${
                        order.margin > 30 ? 'bg-success/10 text-success' :
                        order.margin > 20 ? 'bg-warning/10 text-warning' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {order.margin}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* KPI Section */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวชี้วัดทางการเงิน (KPI)</CardTitle>
          <CardDescription>ผลการดำเนินงานเทียบกับเป้าหมาย (ต้นทุนอิงสูตรประมาณ 65% ของยอดขาย ไม่ใช่ต้นทุนจริงต่อออเดอร์)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kpiData.map((kpi, index) => {
              const met = kpi.higherIsBetter ? kpi.current >= kpi.target : kpi.current <= kpi.target;
              const progressValue = kpi.higherIsBetter
                ? Math.min(100, (kpi.current / kpi.target) * 100)
                : Math.min(100, (kpi.target / Math.max(kpi.current, 1)) * 100);
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{kpi.metric}</span>
                    <span className={`px-2 py-1 rounded text-xs ${met ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      {met ? "ผ่านเป้า" : "ต่ำกว่าเป้า"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>ปัจจุบัน: {kpi.current.toLocaleString()}</span>
                    <span>เป้าหมาย: {kpi.target.toLocaleString()}</span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
