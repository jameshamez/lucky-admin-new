import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileDown, Search, Image } from "lucide-react";

export default function OfficeEquipmentReport() {
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPurchaseDate, setFilterPurchaseDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const summaryData = [
    { title: "มูลค่าทรัพย์สินรวม", value: "฿3,450,000", color: "text-blue-600" },
    { title: "อุปกรณ์ทั้งหมด", value: "145 รายการ", color: "text-green-600" },
    { title: "ใช้งานอยู่", value: "132 รายการ", color: "text-green-600" },
    { title: "ชำรุด/ซ่อมบำรุง", value: "13 รายการ", color: "text-yellow-600" },
  ];

  const equipmentList = [
    { 
      assetNo: "EQ-2024-001", 
      name: "เครื่องคอมพิวเตอร์ Dell OptiPlex", 
      category: "IT", 
      purchaseDate: "2024-01-15", 
      price: 25000, 
      status: "ใช้งานอยู่", 
      assignedTo: "สมชาย ใจดี",
      hasImage: true
    },
    { 
      assetNo: "EQ-2024-002", 
      name: "เครื่องปริ้นเตอร์ HP LaserJet", 
      category: "IT", 
      purchaseDate: "2024-02-20", 
      price: 15000, 
      status: "ใช้งานอยู่", 
      assignedTo: "แผนกบัญชี",
      hasImage: true
    },
    { 
      assetNo: "EQ-2023-045", 
      name: "โต๊ะทำงาน", 
      category: "เฟอร์นิเจอร์", 
      purchaseDate: "2023-05-10", 
      price: 8500, 
      status: "ใช้งานอยู่", 
      assignedTo: "สมหญิง รักษ์ดี",
      hasImage: false
    },
    { 
      assetNo: "EQ-2024-003", 
      name: "เครื่องปรับอากาศ Daikin", 
      category: "เครื่องใช้ไฟฟ้า", 
      purchaseDate: "2024-03-01", 
      price: 28000, 
      status: "ซ่อมบำรุง", 
      assignedTo: "ห้องประชุม A",
      hasImage: true
    },
    { 
      assetNo: "EQ-2023-028", 
      name: "ตู้เอกสาร", 
      category: "เฟอร์นิเจอร์", 
      purchaseDate: "2023-08-15", 
      price: 6500, 
      status: "ใช้งานอยู่", 
      assignedTo: "แผนก HR",
      hasImage: false
    },
    { 
      assetNo: "EQ-2024-004", 
      name: "เครื่องถ่ายเอกสาร Canon", 
      category: "IT", 
      purchaseDate: "2024-04-10", 
      price: 45000, 
      status: "ใช้งานอยู่", 
      assignedTo: "ส่วนกลาง",
      hasImage: true
    },
    { 
      assetNo: "EQ-2023-012", 
      name: "โทรศัพท์สำนักงาน", 
      category: "อุปกรณ์สื่อสาร", 
      purchaseDate: "2023-02-20", 
      price: 3500, 
      status: "ชำรุด", 
      assignedTo: "แผนกขาย",
      hasImage: false
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ใช้งานอยู่":
        return <Badge className="bg-green-500">ใช้งานอยู่</Badge>;
      case "ซ่อมบำรุง":
        return <Badge className="bg-yellow-500">ซ่อมบำรุง</Badge>;
      case "ชำรุด":
        return <Badge className="bg-red-500">ชำรุด</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">รายงานอุปกรณ์สำนักงาน</h1>
          <p className="text-muted-foreground">จัดการทรัพย์สินและครุภัณฑ์ของบริษัท</p>
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
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">หมวดหมู่</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="furniture">เฟอร์นิเจอร์</SelectItem>
                  <SelectItem value="appliance">เครื่องใช้ไฟฟ้า</SelectItem>
                  <SelectItem value="communication">อุปกรณ์สื่อสาร</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">วันที่ซื้อ</label>
              <Input type="date" value={filterPurchaseDate} onChange={(e) => setFilterPurchaseDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">สถานะอุปกรณ์</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="active">ใช้งานอยู่</SelectItem>
                  <SelectItem value="maintenance">ซ่อมบำรุง</SelectItem>
                  <SelectItem value="damaged">ชำรุด</SelectItem>
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

      {/* Equipment Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการทรัพย์สิน (Asset List)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หมายเลขครุภัณฑ์</TableHead>
                <TableHead>รายการ</TableHead>
                <TableHead>หมวด</TableHead>
                <TableHead>วันที่ซื้อ</TableHead>
                <TableHead className="text-right">ราคา (฿)</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ผู้ถือครอง</TableHead>
                <TableHead className="text-center">รูปภาพ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipmentList.map((item) => (
                <TableRow key={item.assetNo}>
                  <TableCell className="font-medium">{item.assetNo}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.purchaseDate}</TableCell>
                  <TableCell className="text-right">฿{item.price.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.assignedTo}</TableCell>
                  <TableCell className="text-center">
                    {item.hasImage ? (
                      <Button variant="ghost" size="sm">
                        <Image className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
