import { useState } from "react";
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
  Download
} from "lucide-react";

export default function FinancialReports() {
  const [selectedPeriod, setSelectedPeriod] = useState("year");

  const profitLossData = [
    { month: "ม.ค.", revenue: 850000, cost: 620000, profit: 230000 },
    { month: "ก.พ.", revenue: 920000, cost: 680000, profit: 240000 },
    { month: "มี.ค.", revenue: 1100000, cost: 780000, profit: 320000 },
    { month: "เม.ย.", revenue: 980000, cost: 720000, profit: 260000 },
    { month: "พ.ค.", revenue: 1200000, cost: 850000, profit: 350000 },
    { month: "มิ.ย.", revenue: 1350000, cost: 920000, profit: 430000 },
  ];

  const orderProfitData = [
    { orderId: "ORD-001", customer: "บริษัท ABC", revenue: 45000, cost: 32000, profit: 13000, margin: 28.9 },
    { orderId: "ORD-002", customer: "ร้าน XYZ", revenue: 28000, cost: 22000, profit: 6000, margin: 21.4 },
    { orderId: "ORD-003", customer: "บริษัท DEF", revenue: 62000, cost: 41000, profit: 21000, margin: 33.9 },
    { orderId: "ORD-004", customer: "ร้าน GHI", revenue: 35000, cost: 28000, profit: 7000, margin: 20.0 },
    { orderId: "ORD-005", customer: "บริษัท JKL", revenue: 78000, cost: 51000, profit: 27000, margin: 34.6 },
  ];

  const expenseBreakdown = [
    { category: "ค่าวัสดุ", amount: 450000, percentage: 45, color: "#3b82f6" },
    { category: "ค่าแรง", amount: 320000, percentage: 32, color: "#10b981" },
    { category: "ค่าสาธารณูปโภค", amount: 85000, percentage: 8.5, color: "#f59e0b" },
    { category: "ค่าเช่า", amount: 95000, percentage: 9.5, color: "#8b5cf6" },
    { category: "อื่นๆ", amount: 50000, percentage: 5, color: "#ef4444" },
  ];

  const kpiData = [
    { metric: "อัตรากำไรขั้นต้น", current: 28.3, target: 25.0, status: "เกินเป้า" },
    { metric: "อัตรากำไรสุทธิ", current: 15.2, target: 12.0, status: "เกินเป้า" },
    { metric: "ต้นทุนต่อออเดอร์", current: 32500, target: 35000, status: "ดีกว่าเป้า" },
    { metric: "เวลาเก็บเงิน (วัน)", current: 28, target: 30, status: "ดีกว่าเป้า" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">รายงานทางการเงิน</h1>
            <p className="text-muted-foreground">รายงานสุขภาพทางการเงินของบริษัท</p>
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
          
          <Button className="gap-2">
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
            <div className="text-2xl font-bold">฿6,400,000</div>
            <p className="text-xs text-muted-foreground">+18% จากเดือนที่แล้ว</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ต้นทุนรวม</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿4,590,000</div>
            <p className="text-xs text-muted-foreground">+12% จากเดือนที่แล้ว</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำไรสุทธิ</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿1,810,000</div>
            <p className="text-xs text-muted-foreground">+28% จากเดือนที่แล้ว</p>
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
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={profitLossData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                <Area type="monotone" dataKey="revenue" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="รายรับ" />
                <Area type="monotone" dataKey="cost" stackId="2" stroke="#ef4444" fill="#ef4444" name="ต้นทุน" />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} name="กำไร" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>การกระจายค่าใช้จ่าย</CardTitle>
            <CardDescription>สัดส่วนค่าใช้จ่ายแยกตามหมวดหมู่</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>

      {/* Order Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายงานต้นทุนต่อออเดอร์</CardTitle>
          <CardDescription>วิเคราะห์กำไร-ขาดทุนของแต่ละออเดอร์</CardDescription>
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
                {orderProfitData.map((order, index) => (
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
          <CardDescription>ผลการดำเนินงานเทียบกับเป้าหมาย</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kpiData.map((kpi, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{kpi.metric}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    kpi.status === "เกินเป้า" || kpi.status === "ดีกว่าเป้า" 
                      ? 'bg-success/10 text-success' 
                      : 'bg-destructive/10 text-destructive'
                  }`}>
                    {kpi.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>ปัจจุบัน: {typeof kpi.current === 'number' && kpi.current > 100 ? kpi.current.toLocaleString() : kpi.current}</span>
                  <span>เป้าหมาย: {typeof kpi.target === 'number' && kpi.target > 100 ? kpi.target.toLocaleString() : kpi.target}</span>
                </div>
                <Progress 
                  value={Math.min(100, (kpi.current / kpi.target) * 100)} 
                  className="h-2" 
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}