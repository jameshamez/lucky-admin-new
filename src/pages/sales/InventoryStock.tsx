import { useState } from "react";
import { Search, Filter, AlertTriangle, Package, XCircle, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data for inventory
const inventoryData = [
  {
    id: "1",
    image: "/placeholder.svg",
    name: "ถ้วยรางวัล",
    sku: "CUP001",
    category: "รางวัล",
    color: "ทอง",
    size: "15 cm",
    description: "ถ้วยรางวัลทองขนาดกลาง",
    quantity: 25,
    unit: "ชิ้น",
    minQty: 10,
    status: "มีในสต็อก",
    hasDefect: false
  },
  {
    id: "2", 
    image: "/placeholder.svg",
    name: "เหรียญรางวัล",
    sku: "MEDAL001",
    category: "รางวัล",
    color: "เงิน",
    size: "8 cm",
    description: "เหรียญรางวัลเงินขนาดมาตรฐาน",
    quantity: 5,
    unit: "ชิ้น",
    minQty: 15,
    status: "ใกล้หมด",
    hasDefect: false
  },
  {
    id: "3",
    image: "/placeholder.svg", 
    name: "โล่รางวัล",
    sku: "SHIELD001",
    category: "รางวัล",
    color: "คริสตัล",
    size: "20 cm",
    description: "โล่รางวัลคริสตัลพรีเมียม",
    quantity: 0,
    unit: "ชิ้น",
    minQty: 5,
    status: "หมด",
    hasDefect: false
  },
  {
    id: "4",
    image: "/placeholder.svg",
    name: "ป้ายไวนิล",
    sku: "VINYL001", 
    category: "สื่อสิ่งพิมพ์",
    color: "หลากสี",
    size: "150x100 cm",
    description: "ป้ายไวนิลงานอีเว้นท์",
    quantity: 3,
    unit: "แผ่น",
    minQty: 10,
    status: "มีตำหนิ",
    hasDefect: true
  },
  {
    id: "5",
    image: "/placeholder.svg",
    name: "สติกเกอร์",
    sku: "STICK001",
    category: "สื่อสิ่งพิมพ์", 
    color: "ขาว",
    size: "10x10 cm",
    description: "สติกเกอร์วินิลกันน้ำ",
    quantity: 8,
    unit: "แผ่น",
    minQty: 20,
    status: "ใกล้หมด",
    hasDefect: false
  }
];

const getStatusBadge = (item: any) => {
  if (item.hasDefect) {
    return <Badge className="flex items-center gap-1 bg-warning text-warning-foreground hover:bg-warning/80"><AlertTriangle className="w-3 h-3" />มีตำหนิ</Badge>;
  }
  if (item.quantity === 0) {
    return <Badge variant="secondary" className="flex items-center gap-1"><XCircle className="w-3 h-3" />หมด</Badge>;
  }
  if (item.quantity < item.minQty) {
    return <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />ใกล้หมด</Badge>;
  }
  return <Badge className="flex items-center gap-1 bg-success text-success-foreground hover:bg-success/80"><CheckCircle className="w-3 h-3" />มีในสต็อก</Badge>;
};

const getStatusColor = (item: any) => {
  if (item.hasDefect) return "text-destructive";
  if (item.quantity === 0) return "text-muted-foreground";  
  if (item.quantity < item.minQty) return "text-destructive";
  return "text-primary";
};

export default function InventoryStock() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredData = inventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (filterStatus) {
      case "in-stock":
        return item.quantity >= 1 && !item.hasDefect && item.quantity >= item.minQty;
      case "out-of-stock":
        return item.quantity === 0;
      case "defective":
        return item.hasDefect;
      case "low-stock":
        return item.quantity < item.minQty && item.quantity > 0 && !item.hasDefect;
      default:
        return true;
    }
  });

  const statsData = {
    totalItems: inventoryData.length,
    inStock: inventoryData.filter(item => item.quantity >= 1 && !item.hasDefect).length,
    outOfStock: inventoryData.filter(item => item.quantity === 0).length,
    defective: inventoryData.filter(item => item.hasDefect).length,
    lowStock: inventoryData.filter(item => item.quantity < item.minQty && item.quantity > 0 && !item.hasDefect).length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">สต็อกสินค้า</h1>
        <p className="text-muted-foreground">
          ตรวจสอบข้อมูลสต็อกสินค้าในคลัง (ไม่สามารถแก้ไขข้อมูลได้)
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สินค้าทั้งหมด</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData.totalItems}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">มีในสต็อก</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statsData.inStock}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ใกล้หมด</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statsData.lowStock}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">หมด</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statsData.outOfStock}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">มีตำหนิ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statsData.defective}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="ค้นหาชื่อสินค้าหรือรหัสสินค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            onClick={() => setFilterStatus("all")}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            ทั้งหมด
          </Button>
          <Button
            variant={filterStatus === "in-stock" ? "default" : "outline"}
            onClick={() => setFilterStatus("in-stock")}
          >
            มีในสต็อก
          </Button>
          <Button
            variant={filterStatus === "low-stock" ? "default" : "outline"}
            onClick={() => setFilterStatus("low-stock")}
          >
            ใกล้หมด
          </Button>
          <Button
            variant={filterStatus === "out-of-stock" ? "default" : "outline"}
            onClick={() => setFilterStatus("out-of-stock")}
          >
            หมด
          </Button>
          <Button
            variant={filterStatus === "defective" ? "default" : "outline"}
            onClick={() => setFilterStatus("defective")}
          >
            มีตำหนิ
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการสินค้า</CardTitle>
          <CardDescription>
            แสดงข้อมูลสินค้าทั้งหมดในระบบ (ผลการค้นหา: {filteredData.length} รายการ)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">รูป</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>รหัส</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>สี</TableHead>
                  <TableHead>ขนาด</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      ไม่พบข้อมูลสินค้าที่ค้นหา
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id} className={item.quantity < item.minQty && item.quantity > 0 ? "bg-red-50" : ""}>
                      <TableCell>
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.color}</TableCell>
                      <TableCell>{item.size}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.description}</TableCell>
                      <TableCell className={`text-right font-semibold ${getStatusColor(item)}`}>
                        {item.quantity} {item.unit}
                        {item.quantity < item.minQty && item.quantity > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            ขั้นต่ำ: {item.minQty} {item.unit}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item)}
                        {item.quantity < item.minQty && item.quantity > 0 && (
                          <div className="text-xs text-red-600 mt-1 font-semibold">
                            สินค้าใกล้หมด
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}