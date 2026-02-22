import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Users, Wallet } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { type CommissionTransaction, formatCurrency, getMonthLabel, monthLabels } from "./reportMockData";
import { calculateAdminIncentive, defaultIncentiveTiers } from "@/lib/commissionConfig";
import { getAdminEmployees, getSaleEmployees, type Employee } from "@/lib/employeeData";

type Props = {
  transactions: CommissionTransaction[];
  employees: Employee[];
  selectedMonth: string; // "YYYY-MM"
};

export default function GrandOverviewTab({ transactions, employees, selectedMonth }: Props) {
  const saleEmployees = useMemo(() => getSaleEmployees(employees), [employees]);
  const adminEmployees = useMemo(() => getAdminEmployees(employees), [employees]);

  // Current month data
  const monthTxns = useMemo(() =>
    transactions.filter(t => t.month === selectedMonth && t.status === "COMPLETED"),
    [transactions, selectedMonth]
  );

  const totalSales = monthTxns.reduce((s, t) => s + t.totalSales, 0);
  const totalCommission = monthTxns.reduce((s, t) => s + t.commission, 0);
  const incentive = calculateAdminIncentive(defaultIncentiveTiers, totalSales);
  const totalIncentive = incentive.amount * adminEmployees.length;
  const totalCost = totalCommission + totalIncentive;
  const netRevenue = totalSales - totalCost;

  // 6-month trend
  const trendData = useMemo(() => {
    const [selYear, selMon] = selectedMonth.split("-").map(Number);
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      let m = selMon - i;
      let y = selYear;
      while (m <= 0) { m += 12; y--; }
      months.push(`${y}-${String(m).padStart(2, "0")}`);
    }

    return months.map(month => {
      const txns = transactions.filter(t => t.month === month && t.status === "COMPLETED");
      const sales = txns.reduce((s, t) => s + t.totalSales, 0);
      const comm = txns.reduce((s, t) => s + t.commission, 0);
      const inc = calculateAdminIncentive(defaultIncentiveTiers, sales);
      const cost = comm + inc.amount * adminEmployees.length;
      const [, mm] = month.split("-");
      return {
        label: monthLabels[mm]?.slice(0, 3) || mm,
        ยอดขาย: sales,
        ต้นทุนคอม: cost,
      };
    });
  }, [transactions, selectedMonth, adminEmployees.length]);

  const costRatio = totalSales > 0 ? ((totalCost / totalSales) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดขายรวม</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-1">{monthTxns.length} รายการในเดือนนี้</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ต้นทุนค่าคอมฯ</CardTitle>
            <Wallet className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            <div className="flex gap-1 mt-1">
              <Badge variant="outline" className="text-xs">คอม {formatCurrency(totalCommission)}</Badge>
              <Badge variant="outline" className="text-xs">Incentive {formatCurrency(totalIncentive)}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายได้สุทธิ</CardTitle>
            {netRevenue >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netRevenue >= 0 ? "text-green-600" : "text-red-600"}`}>
              {formatCurrency(netRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">สัดส่วนต้นทุน {costRatio}%</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">พนักงานขาย Active</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{saleEmployees.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Admin: {adminEmployees.length} คน</p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            แนวโน้มยอดขาย vs ต้นทุน (6 เดือนล่าสุด)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="ยอดขาย" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="ต้นทุนคอม" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Incentive status */}
      <Card>
        <CardHeader>
          <CardTitle>สถานะ Incentive แอดมิน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ยอดขายรวมเดือนนี้</p>
              <p className="text-xl font-bold">{formatCurrency(totalSales)}</p>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-sm text-muted-foreground">Tier ที่ได้</p>
              <Badge variant={incentive.amount > 0 ? "default" : "secondary"}>
                {incentive.tierLabel}
              </Badge>
            </div>
            <div className="h-10 w-px bg-border" />
            <div>
              <p className="text-sm text-muted-foreground">Incentive/คน</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(incentive.amount)}</p>
            </div>
            {incentive.nextTierSales && (
              <>
                <div className="h-10 w-px bg-border" />
                <div>
                  <p className="text-sm text-muted-foreground">ยอดขายอีก {formatCurrency(incentive.nextTierSales - totalSales)} ถึง Tier ถัดไป</p>
                  <p className="text-sm">Incentive จะเป็น {formatCurrency(incentive.nextTierAmount || 0)}/คน</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
