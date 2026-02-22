import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { UserPlus, UserMinus, TrendingDown } from "lucide-react";
import { type EmployeeMovement, mockEmployeeMovements } from "./reportMockData";
import { type Employee } from "@/lib/employeeData";

type Props = {
  employees: Employee[];
  selectedMonth: string;
};

const COLORS = ["hsl(var(--primary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

export default function HRTurnoverTab({ employees, selectedMonth }: Props) {
  const activeEmployees = employees.filter(e => e.status === "ACTIVE");
  const resignedAll = employees.filter(e => e.status === "RESIGNED");

  const monthMovements = useMemo(() =>
    mockEmployeeMovements.filter(m => m.month === selectedMonth),
    [selectedMonth]
  );

  const newJoiners = monthMovements.filter(m => m.type === "NEW");
  const resigned = monthMovements.filter(m => m.type === "RESIGNED");

  const turnoverRate = activeEmployees.length > 0
    ? ((resigned.length / (activeEmployees.length + resigned.length)) * 100).toFixed(1)
    : "0";

  // Role breakdown
  const roleData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeEmployees.forEach(e => {
      counts[e.role] = (counts[e.role] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [activeEmployees]);

  // Position breakdown
  const positionData = useMemo(() => {
    const counts: Record<string, number> = {};
    activeEmployees.forEach(e => {
      const pos = e.position || "ไม่ระบุ";
      counts[pos] = (counts[pos] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [activeEmployees]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">พนักงาน Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เข้าใหม่เดือนนี้</CardTitle>
            <UserPlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{newJoiners.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลาออกเดือนนี้</CardTitle>
            <UserMinus className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{resigned.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อัตราลาออก</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{turnoverRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Movement Table */}
        <Card>
          <CardHeader>
            <CardTitle>การเคลื่อนไหวพนักงาน</CardTitle>
          </CardHeader>
          <CardContent>
            {monthMovements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">ไม่มีการเคลื่อนไหวในเดือนนี้</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>ตำแหน่ง</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthMovements.map(m => (
                    <TableRow key={`${m.id}-${m.type}`}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.position}</TableCell>
                      <TableCell>
                        <Badge variant={m.type === "NEW" ? "default" : "destructive"}>
                          {m.type === "NEW" ? "เข้าใหม่" : "ลาออก"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{m.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Department Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>สัดส่วนพนักงานตาม Role</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {roleData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Position breakdown table */}
      <Card>
        <CardHeader>
          <CardTitle>สถิติตามตำแหน่งงาน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead className="text-right">จำนวนคน</TableHead>
                <TableHead className="w-48">สัดส่วน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positionData.map(pos => {
                const pct = activeEmployees.length > 0 ? (pos.value / activeEmployees.length) * 100 : 0;
                return (
                  <TableRow key={pos.name}>
                    <TableCell className="font-medium">{pos.name}</TableCell>
                    <TableCell className="text-right">{pos.value}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{pct.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
