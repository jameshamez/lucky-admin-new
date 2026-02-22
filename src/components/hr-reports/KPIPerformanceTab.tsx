import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Award, ChevronDown, ChevronRight, Target } from "lucide-react";
import { type CommissionTransaction, type SalesTarget, formatCurrency, mockSalesTargets } from "./reportMockData";
import { calculateAdminIncentive, defaultIncentiveTiers } from "@/lib/commissionConfig";
import { type Employee } from "@/lib/employeeData";

type Props = {
  transactions: CommissionTransaction[];
  employees: Employee[];
  selectedMonth: string;
};

type EmployeeKPI = {
  employeeId: string;
  name: string;
  role: "Sale" | "Admin";
  position: string;
  target: number;
  actual: number;
  achieved: number;
  commission: number;
  orders: CommissionTransaction[];
};

export default function KPIPerformanceTab({ transactions, employees, selectedMonth }: Props) {
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  const monthTxns = useMemo(() =>
    transactions.filter(t => t.month === selectedMonth && t.status === "COMPLETED"),
    [transactions, selectedMonth]
  );

  const totalMonthSales = monthTxns.reduce((s, t) => s + t.totalSales, 0);

  const kpiData: EmployeeKPI[] = useMemo(() => {
    const targets = mockSalesTargets.filter(t => t.month === selectedMonth);

    return targets.map(tgt => {
      const emp = employees.find(e => e.id === tgt.employeeId);
      const empTxns = monthTxns.filter(t => t.employeeId === tgt.employeeId);
      const actual = tgt.role === "Sale"
        ? empTxns.reduce((s, t) => s + t.totalSales, 0)
        : totalMonthSales; // Admin uses company total
      const commission = tgt.role === "Sale"
        ? empTxns.reduce((s, t) => s + t.commission, 0)
        : calculateAdminIncentive(defaultIncentiveTiers, totalMonthSales).amount;
      const achieved = tgt.target > 0 ? (actual / tgt.target) * 100 : 0;

      return {
        employeeId: tgt.employeeId,
        name: tgt.employeeName,
        role: tgt.role,
        position: emp?.position || tgt.role,
        target: tgt.target,
        actual,
        achieved,
        commission,
        orders: empTxns,
      };
    }).sort((a, b) => b.achieved - a.achieved);
  }, [monthTxns, employees, selectedMonth, totalMonthSales]);

  const avgAchievement = kpiData.length > 0
    ? kpiData.reduce((s, k) => s + k.achieved, 0) / kpiData.length
    : 0;
  const aboveTarget = kpiData.filter(k => k.achieved >= 100).length;

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return "bg-green-500";
    if (pct >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% สำเร็จเฉลี่ย</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAchievement.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ถึงเป้าหมาย</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{aboveTarget}/{kpiData.length}</div>
            <p className="text-xs text-muted-foreground">คน</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดขายรวมทั้งบริษัท</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthSales)}</div>
            <p className="text-xs text-muted-foreground">เป้า Incentive Admin</p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            อันดับประสิทธิภาพพนักงาน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>ชื่อพนักงาน</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead className="text-right">เป้าหมาย</TableHead>
                <TableHead className="text-right">ทำได้จริง</TableHead>
                <TableHead className="w-48">% สำเร็จ</TableHead>
                <TableHead className="text-right">ค่าคอม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kpiData.map((kpi, idx) => (
                <Collapsible key={kpi.employeeId} asChild open={expandedEmployee === kpi.employeeId}>
                  <>
                    <CollapsibleTrigger asChild>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedEmployee(expandedEmployee === kpi.employeeId ? null : kpi.employeeId)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {expandedEmployee === kpi.employeeId ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            {idx + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{kpi.name}</TableCell>
                        <TableCell>
                          <Badge variant={kpi.role === "Sale" ? "default" : "secondary"}>
                            {kpi.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(kpi.target)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(kpi.actual)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                              <div
                                className={`h-full rounded-full ${getProgressColor(kpi.achieved)} transition-all`}
                                style={{ width: `${Math.min(kpi.achieved, 100)}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${kpi.achieved >= 100 ? "text-green-600" : kpi.achieved >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                              {kpi.achieved.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(kpi.commission)}</TableCell>
                      </TableRow>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      {kpi.orders.length > 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <div className="bg-muted/30 p-4">
                              <p className="text-sm font-medium mb-2">รายละเอียดออเดอร์ ({kpi.orders.length} รายการ)</p>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>PO</TableHead>
                                    <TableHead>ชื่องาน</TableHead>
                                    <TableHead>ประเภท</TableHead>
                                    <TableHead className="text-right">ยอดขาย</TableHead>
                                    <TableHead className="text-right">ค่าคอม</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {kpi.orders.map(order => (
                                    <TableRow key={order.id}>
                                      <TableCell className="text-xs">{order.poNumber}</TableCell>
                                      <TableCell className="text-xs">{order.jobName}</TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                          {order.type === "ReadyMade" ? "สำเร็จรูป" : "สั่งผลิต"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right text-xs">{formatCurrency(order.totalSales)}</TableCell>
                                      <TableCell className="text-right text-xs">{formatCurrency(order.commission)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="p-4 bg-muted/30 text-center text-sm text-muted-foreground">
                            {kpi.role === "Admin" ? "Admin ใช้ยอดขายรวมบริษัทเป็นฐาน Incentive" : "ไม่มีออเดอร์ในเดือนนี้"}
                          </TableCell>
                        </TableRow>
                      )}
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
