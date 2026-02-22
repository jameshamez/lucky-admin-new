import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FileDown, Search } from "lucide-react";

export default function OfficeSuppliesReport() {
  const [filterDate, setFilterDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const summaryData = [
    { title: "มูลค่าวัสดุคงเหลือ", value: "฿180,000", color: "text-blue-600" },
    { title: "การเบิกเดือนนี้", value: "฿45,000", color: "text-green-600" },
    { title: "รายการต่ำกว่า Min", value: "12 รายการ", color: "text-yellow-600" },
    { title: "รายการหมด", value: "3 รายการ", color: "text-red-600" },
  ];

  const monthlyUsageData = [
    { month: "ม.ค.", value: 38000 },
    { month: "ก.พ.", value: 42000 },
    { month: "มี.ค.", value: 39000 },
    { month: "เม.ย.", value: 45000 },
    { month: "พ.ค.", value: 48000 },
    { month: "มิ.ย.", value: 43000 },
    { month: "ก.ค.", value: 46000 },
    { month: "ส.ค.", value: 44000 },
    { month: "ก.ย.", value: 47000 },
    { month: "ต.ค.", value: 49000 },
    { month: "พ.ย.", value: 45000 },
    { month: "ธ.ค.", value: 45000 },
  ];

  const suppliesList = [
    { code: "OS001", name: "กระดาษ A4", category: "เครื่องเขียน", stock: 85, minStock: 50, value: 8500, status: "พร้อม" },
    { code: "OS002", name: "ปากกาลูกลื่น", category: "เครื่องเขียน", stock: 120, minStock: 100, value: 2400, status: "พร้อม" },
    { code: "OS003", name: "น้ำยาทำความสะอาด", category: "ทำความสะอาด", stock: 15, minStock: 20, value: 1500, status: "ต่ำกว่า Min" },
    { code: "OS004", name: "กระดาษชำระ", category: "สุขภัณฑ์", stock: 0, minStock: 30, value: 0, status: "หมด" },
    { code: "OS005", name: "แฟ้มเอกสาร", category: "เครื่องเขียน", stock: 45, minStock: 30, value: 2250, status: "พร้อม" },
  ];

  const usageHistory = [
    { date: "2025-01-05", employee: "สมชาย ใจดี", department: "ขาย", item: "กระดาษ A4", quantity: 5, value: 500, status: "อนุมัติ" },
    { date: "2025-01-04", employee: "สมหญิง รักษ์ดี", department: "บัญชี", item: "ปากกา", quantity: 10, value: 200, status: "อนุมัติ" },
    { date: "2025-01-03", employee: "วิชัย มั่นคง", department: "ผลิต", item: "แฟ้มเอกสาร", quantity: 8, value: 400, status: "อนุมัติ" },
    { date: "2025-01-02", employee: "สมศรี ดีงาม", department: "ออกแบบ", item: "กระดาษ A4", quantity: 3, value: 300, status: "รออนุมัติ" },
    { date: "2025-01-01", employee: "ประเสริฐ วงศ์ดี", department: "HR", item: "น้ำยาทำความสะอาด", quantity: 2, value: 200, status: "อนุมัติ" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "พร้อม":
        return <Badge className="bg-green-500">พร้อม</Badge>;
      case "ต่ำกว่า Min":
        return <Badge className="bg-yellow-500">ต่ำกว่า Min</Badge>;
      case "หมด":
        return <Badge className="bg-red-500">หมด</Badge>;
      case "อนุมัติ":
        return <Badge className="bg-green-500">อนุมัติ</Badge>;
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
          <h1 className="text-3xl font-bold">รายงานวัสดุสำนักงาน</h1>
          <p className="text-muted-foreground">ติดตามวัสดุสิ้นเปลืองและการเบิกใช้</p>
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

      {/* Monthly Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>การเบิกใช้ต่อเดือน</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyUsageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" name="มูลค่าการเบิก" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

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
              <label className="text-sm font-medium mb-2 block">หมวดหมู่</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="stationary">เครื่องเขียน</SelectItem>
                  <SelectItem value="cleaning">ทำความสะอาด</SelectItem>
                  <SelectItem value="sanitary">สุขภัณฑ์</SelectItem>
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
                  <SelectItem value="ready">พร้อม</SelectItem>
                  <SelectItem value="low">ต่ำกว่า Min</SelectItem>
                  <SelectItem value="out">หมด</SelectItem>
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

      {/* Supplies Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการวัสดุคงเหลือ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>รายการ</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="text-right">คงเหลือ</TableHead>
                <TableHead className="text-right">Min Stock</TableHead>
                <TableHead className="text-right">มูลค่า (฿)</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliesList.map((item) => (
                <TableRow key={item.code}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">{item.stock}</TableCell>
                  <TableCell className="text-right">{item.minStock}</TableCell>
                  <TableCell className="text-right">฿{item.value.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Usage History Table */}
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการเบิกใช้</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>พนักงาน</TableHead>
                <TableHead>แผนก</TableHead>
                <TableHead>รายการ</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead className="text-right">มูลค่า (฿)</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageHistory.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.employee}</TableCell>
                  <TableCell>{item.department}</TableCell>
                  <TableCell>{item.item}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">฿{item.value.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
