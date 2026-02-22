import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { DollarSign } from "lucide-react";
import { type CommissionTransaction, formatCurrency } from "./reportMockData";
import { calculateAdminIncentive, defaultIncentiveTiers } from "@/lib/commissionConfig";
import { getAdminEmployees, type Employee } from "@/lib/employeeData";

type Props = {
  transactions: CommissionTransaction[];
  employees: Employee[];
  selectedMonth: string;
};

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6"];
const BAR_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function FinancialBreakdownTab({ transactions, employees, selectedMonth }: Props) {
  const adminEmployees = useMemo(() => getAdminEmployees(employees), [employees]);

  const monthTxns = useMemo(() =>
    transactions.filter(t => t.month === selectedMonth && t.status === "COMPLETED"),
    [transactions, selectedMonth]
  );

  const totalSales = monthTxns.reduce((s, t) => s + t.totalSales, 0);
  const readyMadeComm = monthTxns.filter(t => t.type === "ReadyMade").reduce((s, t) => s + t.commission, 0);
  const madeToOrderComm = monthTxns.filter(t => t.type === "MadeToOrder").reduce((s, t) => s + t.commission, 0);
  const incentive = calculateAdminIncentive(defaultIncentiveTiers, totalSales);
  const totalIncentive = incentive.amount * adminEmployees.length;

  // Cost structure pie
  const costStructure = useMemo(() => [
    { name: "คอมฯ สำเร็จรูป", value: readyMadeComm },
    { name: "คอมฯ สั่งผลิต", value: madeToOrderComm },
    { name: "Incentive Admin", value: totalIncentive },
  ].filter(d => d.value > 0), [readyMadeComm, madeToOrderComm, totalIncentive]);

  // Sales by product category
  const salesByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    monthTxns.forEach(t => {
      // Simplify category names
      let cat = t.productCategory;
      if (cat.includes("ถ้วย")) cat = "ถ้วยรางวัล";
      else if (cat.includes("โล่")) cat = "โล่รางวัล";
      else if (cat.includes("เหรียญ")) cat = "เหรียญรางวัล";
      else if (cat.includes("เสื้อ")) cat = "เสื้อ";
      else if (cat.includes("ระบบวิ่ง")) cat = "ระบบวิ่ง";
      else if (cat.includes("ออแกไนท์")) cat = "ออแกไนท์";
      else if (cat.includes("อะไหล่")) cat = "อะไหล่";
      else if (cat.includes("BIB")) cat = "BIB";
      cats[cat] = (cats[cat] || 0) + t.totalSales;
    });
    return Object.entries(cats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [monthTxns]);

  const totalCost = readyMadeComm + madeToOrderComm + totalIncentive;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">คอมฯ สำเร็จรูป</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">{formatCurrency(readyMadeComm)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">คอมฯ สั่งผลิต</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-600">{formatCurrency(madeToOrderComm)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Incentive Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600">{formatCurrency(totalIncentive)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ต้นทุนรวม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">{formatCurrency(totalCost)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cost Structure Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              สัดส่วนค่าใช้จ่าย
            </CardTitle>
          </CardHeader>
          <CardContent>
            {costStructure.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">ไม่มีข้อมูลค่าใช้จ่าย</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costStructure}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {costStructure.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Sales by Category Bar */}
        <Card>
          <CardHeader>
            <CardTitle>ยอดขายแยกตามประเภทสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            {salesByCategory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">ไม่มีข้อมูลยอดขาย</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesByCategory} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" name="ยอดขาย" radius={[0, 4, 4, 0]}>
                    {salesByCategory.map((_, index) => (
                      <Cell key={`bar-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
