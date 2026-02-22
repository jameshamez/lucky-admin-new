import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FileDown, Search } from "lucide-react";

export default function SalesReport() {
  const [filterDate, setFilterDate] = useState("");
  const [filterSalesperson, setFilterSalesperson] = useState("");
  const [filterProductType, setFilterProductType] = useState("");

  const monthlyData = [
    { month: "ม.ค.", actual: 2100000, target: 2000000 },
    { month: "ก.พ.", actual: 1950000, target: 2000000 },
    { month: "มี.ค.", actual: 2300000, target: 2000000 },
    { month: "เม.ย.", actual: 2150000, target: 2000000 },
    { month: "พ.ค.", actual: 2400000, target: 2000000 },
    { month: "มิ.ย.", actual: 2200000, target: 2000000 },
    { month: "ก.ค.", actual: 2500000, target: 2000000 },
    { month: "ส.ค.", actual: 2350000, target: 2000000 },
    { month: "ก.ย.", actual: 2450000, target: 2000000 },
    { month: "ต.ค.", actual: 2600000, target: 2000000 },
    { month: "พ.ย.", actual: 2550000, target: 2000000 },
    { month: "ธ.ค.", actual: 2450000, target: 2000000 },
  ];

  const topProducts = [
    { rank: 1, name: "กล่องกระดาษลูกฟูก A4", quantity: 850, value: 425000 },
    { rank: 2, name: "ถุงพลาสติก PE", quantity: 720, value: 360000 },
    { rank: 3, name: "สติกเกอร์สินค้า", quantity: 650, value: 325000 },
    { rank: 4, name: "กล่องสีขาว A3", quantity: 580, value: 290000 },
    { rank: 5, name: "เทปกาว OPP", quantity: 520, value: 260000 },
    { rank: 6, name: "กระดาษคราฟท์", quantity: 480, value: 240000 },
    { rank: 7, name: "ถุงกระดาษสีน้ำตาล", quantity: 420, value: 210000 },
    { rank: 8, name: "สติกเกอร์บาร์โค้ด", quantity: 380, value: 190000 },
    { rank: 9, name: "กล่องไดคัท", quantity: 340, value: 170000 },
    { rank: 10, name: "ฟิล์มยืด", quantity: 300, value: 150000 },
  ];

  const dailySales = [
    { date: "2025-01-01", orders: 15, value: 125000, salesperson: "สมชาย ใจดี" },
    { date: "2025-01-02", orders: 18, value: 145000, salesperson: "สมหญิง รักษ์ดี" },
    { date: "2025-01-03", orders: 22, value: 185000, salesperson: "สมชาย ใจดี" },
    { date: "2025-01-04", orders: 20, value: 165000, salesperson: "วิชัย มั่นคง" },
    { date: "2025-01-05", orders: 25, value: 210000, salesperson: "สมหญิง รักษ์ดี" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">รายงานยอดขาย</h1>
          <p className="text-muted-foreground">วิเคราะห์ยอดขายและประสิทธิภาพการขาย</p>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">วันที่</label>
              <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">พนักงานขาย</label>
              <Select value={filterSalesperson} onValueChange={setFilterSalesperson}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกพนักงานขาย" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="somchai">สมชาย ใจดี</SelectItem>
                  <SelectItem value="somying">สมหญิง รักษ์ดี</SelectItem>
                  <SelectItem value="wichai">วิชัย มั่นคง</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">ประเภทสินค้า</label>
              <Select value={filterProductType} onValueChange={setFilterProductType}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="box">กล่องกระดาษ</SelectItem>
                  <SelectItem value="bag">ถุง</SelectItem>
                  <SelectItem value="sticker">สติกเกอร์</SelectItem>
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

      {/* Monthly Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>ยอดขายรายเดือน (เทียบกับเป้า)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="actual" fill="hsl(var(--primary))" name="ยอดขายจริง" />
              <Bar dataKey="target" fill="hsl(var(--muted))" name="เป้าหมาย" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top 10 Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 สินค้าขายดี</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>อันดับ</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead className="text-right">จำนวนขาย</TableHead>
                <TableHead className="text-right">มูลค่า (฿)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((product) => (
                <TableRow key={product.rank}>
                  <TableCell className="font-medium">#{product.rank}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-right">{product.quantity}</TableCell>
                  <TableCell className="text-right">฿{product.value.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Daily Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>ยอดขายรายวัน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>จำนวนออเดอร์</TableHead>
                <TableHead>มูลค่า (฿)</TableHead>
                <TableHead>พนักงานขาย</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailySales.map((sale) => (
                <TableRow key={sale.date}>
                  <TableCell>{sale.date}</TableCell>
                  <TableCell>{sale.orders}</TableCell>
                  <TableCell>฿{sale.value.toLocaleString()}</TableCell>
                  <TableCell>{sale.salesperson}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
