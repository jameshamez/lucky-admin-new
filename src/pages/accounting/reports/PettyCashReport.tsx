import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FileDown, Search } from "lucide-react";

export default function PettyCashReport() {
  const [filterDate, setFilterDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const summaryData = [
    { title: "ยอดเบิกเดือนนี้", value: "฿95,000", color: "text-blue-600" },
    { title: "รออนุมัติ", value: "฿12,500", color: "text-yellow-600" },
    { title: "รอเบิกจ่าย", value: "฿8,200", color: "text-orange-600" },
    { title: "คงเหลือกองกลาง", value: "฿45,300", color: "text-green-600" },
  ];

  const monthlyCategoryData = [
    { month: "ม.ค.", fuel: 15000, delivery: 12000, welfare: 8000, others: 5000 },
    { month: "ก.พ.", fuel: 16000, delivery: 11000, welfare: 9000, others: 6000 },
    { month: "มี.ค.", fuel: 14000, delivery: 13000, welfare: 7500, others: 5500 },
    { month: "เม.ย.", fuel: 17000, delivery: 12500, welfare: 8500, others: 7000 },
    { month: "พ.ค.", fuel: 18000, delivery: 14000, welfare: 9500, others: 6500 },
    { month: "มิ.ย.", fuel: 16500, delivery: 13500, welfare: 8000, others: 5000 },
  ];

  const monthlyTrendData = [
    { month: "ม.ค.", total: 40000 },
    { month: "ก.พ.", total: 42000 },
    { month: "มี.ค.", total: 40000 },
    { month: "เม.ย.", total: 45000 },
    { month: "พ.ค.", total: 48000 },
    { month: "มิ.ย.", total: 43000 },
  ];

  const requestsList = [
    { 
      code: "PC-20250105-001", 
      date: "2025-01-05", 
      employee: "สมชาย ใจดี", 
      department: "ขาย", 
      category: "ค่าน้ำมัน", 
      detail: "เติมน้ำมันรถเยี่ยมลูกค้า", 
      amount: 1500, 
      status: "จ่ายแล้ว",
      approver: "ผู้จัดการขาย",
      approvalDate: "2025-01-05",
      paymentDate: "2025-01-05"
    },
    { 
      code: "PC-20250104-002", 
      date: "2025-01-04", 
      employee: "สมหญิง รักษ์ดี", 
      department: "บัญชี", 
      category: "ค่าส่งสินค้า", 
      detail: "ส่งเอกสารด่วน - Flash Express", 
      amount: 850, 
      status: "รอเบิกจ่าย",
      approver: "ผู้จัดการบัญชี",
      approvalDate: "2025-01-04",
      paymentDate: "-"
    },
    { 
      code: "PC-20250103-003", 
      date: "2025-01-03", 
      employee: "วิชัย มั่นคง", 
      department: "ผลิต", 
      category: "ค่าของใช้", 
      detail: "ซื้อขาตั้งกล้อง", 
      amount: 2500, 
      status: "รออนุมัติ",
      approver: "ผู้จัดการผลิต",
      approvalDate: "-",
      paymentDate: "-"
    },
    { 
      code: "PC-20250102-004", 
      date: "2025-01-02", 
      employee: "ประเสริฐ วงศ์ดี", 
      department: "HR", 
      category: "สวัสดิการพนักงาน", 
      detail: "ของขวัญวันเกิดพนักงาน", 
      amount: 1200, 
      status: "จ่ายแล้ว",
      approver: "ผู้จัดการ HR",
      approvalDate: "2025-01-02",
      paymentDate: "2025-01-02"
    },
    { 
      code: "PC-20250101-005", 
      date: "2025-01-01", 
      employee: "สมศรี ดีงาม", 
      department: "ออกแบบ", 
      category: "คืนเงินลูกค้า", 
      detail: "คืนเงินมัดจำ QO-2024-1250", 
      amount: 5000, 
      status: "จ่ายแล้ว",
      approver: "ผู้อำนวยการ",
      approvalDate: "2025-01-01",
      paymentDate: "2025-01-01"
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "จ่ายแล้ว":
        return <Badge className="bg-green-500">จ่ายแล้ว</Badge>;
      case "รอเบิกจ่าย":
        return <Badge className="bg-orange-500">รอเบิกจ่าย</Badge>;
      case "รออนุมัติ":
        return <Badge className="bg-yellow-500">รออนุมัติ</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">รายงานเงินสดย่อย</h1>
          <p className="text-muted-foreground">ติดตามการเบิกจ่ายและยอดคงเหลือกองกลาง</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((card, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ยอดเบิกจ่ายตามหมวด</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="fuel" fill="#3b82f6" name="ค่าน้ำมัน" />
                <Bar dataKey="delivery" fill="#10b981" name="ค่าส่งสินค้า" />
                <Bar dataKey="welfare" fill="#f59e0b" name="สวัสดิการ" />
                <Bar dataKey="others" fill="#6366f1" name="อื่นๆ" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>แนวโน้มการเบิกจ่าย</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" name="ยอดรวม" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="text-sm font-medium mb-2 block">วันที่</label>
              <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">หมวดค่าใช้จ่าย</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="fuel">ค่าน้ำมัน</SelectItem>
                  <SelectItem value="delivery">ค่าส่งสินค้า</SelectItem>
                  <SelectItem value="welfare">สวัสดิการ</SelectItem>
                  <SelectItem value="refund">คืนเงินลูกค้า</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">แผนก</label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแผนก" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="sales">ขาย</SelectItem>
                  <SelectItem value="accounting">บัญชี</SelectItem>
                  <SelectItem value="production">ผลิต</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">สถานะ</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="paid">จ่ายแล้ว</SelectItem>
                  <SelectItem value="pending_payment">รอเบิกจ่าย</SelectItem>
                  <SelectItem value="pending_approval">รออนุมัติ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Search className="mr-2 h-4 w-4" />
                ค้นหา
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการคำขอเบิก</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสคำขอ</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ผู้เบิก</TableHead>
                <TableHead>แผนก</TableHead>
                <TableHead>หมวดค่าใช้จ่าย</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead className="text-right">จำนวนเงิน (฿)</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ผู้อนุมัติ</TableHead>
                <TableHead>วันที่จ่ายจริง</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requestsList.map((item) => (
                <TableRow key={item.code}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.employee}</TableCell>
                  <TableCell>{item.department}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.detail}</TableCell>
                  <TableCell className="text-right">฿{item.amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.approver}</TableCell>
                  <TableCell>{item.paymentDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
