import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FileDown, Search } from "lucide-react";

export default function InventoryReport() {
  const [filterDate, setFilterDate] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [filterProductType, setFilterProductType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const summaryData = [
    { title: "มูลค่าสต๊อกรวม", value: "฿5,800,000", color: "text-blue-600" },
    { title: "สินค้าพร้อมขาย", value: "1,245 รายการ", color: "text-green-600" },
    { title: "ต่ำกว่า Min", value: "28 รายการ", color: "text-yellow-600" },
    { title: "สินค้าหมด", value: "5 รายการ", color: "text-red-600" },
  ];

  const statusData = [
    { name: "พร้อมขาย", value: 1245, color: "hsl(var(--primary))" },
    { name: "ต่ำกว่า Min", value: 28, color: "#fbbf24" },
    { name: "หมดสต๊อก", value: 5, color: "#ef4444" },
  ];

  const categoryValueData = [
    { category: "กล่องกระดาษ", value: 2100000 },
    { category: "ถุง", value: 1500000 },
    { category: "สติกเกอร์", value: 980000 },
    { category: "เทป", value: 750000 },
    { category: "อื่นๆ", value: 470000 },
  ];

  const inventoryList = [
    { code: "P001", name: "กล่องกระดาษลูกฟูก A4", category: "กล่อง", quantity: 450, minStock: 100, value: 450000, status: "พร้อมขาย" },
    { code: "P002", name: "ถุงพลาสติก PE", category: "ถุง", quantity: 320, minStock: 150, value: 320000, status: "พร้อมขาย" },
    { code: "P003", name: "สติกเกอร์สินค้า", category: "สติกเกอร์", quantity: 85, minStock: 100, value: 85000, status: "ต่ำกว่า Min" },
    { code: "P004", name: "เทปกาว OPP", category: "เทป", quantity: 0, minStock: 50, value: 0, status: "หมดสต๊อก" },
    { code: "P005", name: "กล่องสีขาว A3", category: "กล่อง", quantity: 280, minStock: 100, value: 280000, status: "พร้อมขาย" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "พร้อมขาย":
        return <Badge className="bg-green-500">พร้อมขาย</Badge>;
      case "ต่ำกว่า Min":
        return <Badge className="bg-yellow-500">ต่ำกว่า Min</Badge>;
      case "หมดสต๊อก":
        return <Badge className="bg-red-500">หมดสต๊อก</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">รายงานสต๊อกสินค้า</h1>
          <p className="text-muted-foreground">ติดตามมูลค่าและสถานะสต๊อกสินค้า</p>
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
              <label className="text-sm font-medium mb-2 block">คลัง</label>
              <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกคลัง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="main">คลังหลัก</SelectItem>
                  <SelectItem value="secondary">คลังสำรอง</SelectItem>
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
                  <SelectItem value="box">กล่อง</SelectItem>
                  <SelectItem value="bag">ถุง</SelectItem>
                  <SelectItem value="sticker">สติกเกอร์</SelectItem>
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
                  <SelectItem value="ready">พร้อมขาย</SelectItem>
                  <SelectItem value="low">ต่ำกว่า Min</SelectItem>
                  <SelectItem value="out">หมดสต๊อก</SelectItem>
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

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>สถานะสต๊อกสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>มูลค่าสต๊อกตามประเภท</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryValueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการสต๊อกสินค้า</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสสินค้า</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="text-right">คงเหลือ</TableHead>
                <TableHead className="text-right">Min Stock</TableHead>
                <TableHead className="text-right">มูลค่า (฿)</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryList.map((item) => (
                <TableRow key={item.code}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.minStock}</TableCell>
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
