import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ArrowRightLeft, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const mockInventory = [
  { 
    id: "1", 
    code: "P001", 
    name: "ถังขยะพลาสติก 120L", 
    warehouse: "TEG",
    location: "A1-ชั้น1",
    total: 250, 
    ready: 200, 
    defective: 30, 
    damaged: 20, 
    min: 50,
    unit: "ชิ้น",
    lastUpdated: "2025-01-15 14:30"
  },
  { 
    id: "2", 
    code: "P002", 
    name: "ถังขยะพลาสติก 240L", 
    warehouse: "Lucky",
    location: "B2-ชั้น2",
    total: 180, 
    ready: 150, 
    defective: 20, 
    damaged: 10, 
    min: 50,
    unit: "ชิ้น",
    lastUpdated: "2025-01-15 13:20"
  },
  { 
    id: "3", 
    code: "P003", 
    name: "ถังขยะสแตนเลส 80L", 
    warehouse: "TEG",
    location: "A2-ชั้น1",
    total: 95, 
    ready: 80, 
    defective: 10, 
    damaged: 5, 
    min: 30,
    unit: "ชิ้น",
    lastUpdated: "2025-01-15 10:15"
  },
];

export default function InventoryAll() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showLowStock, setShowLowStock] = useState(false);

  const filteredInventory = mockInventory.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchWarehouse = warehouseFilter === "all" || item.warehouse === warehouseFilter;
    const matchLocation = locationFilter === "all" || item.location === locationFilter;
    const matchLowStock = !showLowStock || item.ready < item.min;
    
    return matchSearch && matchWarehouse && matchLocation && matchLowStock;
  });

  const handleAction = (action: string, itemName: string) => {
    toast({
      title: `${action}สำเร็จ`,
      description: `ดำเนินการ${action} ${itemName} เรียบร้อยแล้ว`,
    });
  };

  const getStatusBadge = (ready: number, min: number) => {
    if (ready < min) {
      return <Badge variant="destructive">ใกล้หมด</Badge>;
    } else if (ready < min * 1.5) {
      return <Badge className="bg-yellow-500">ควรสั่งซื้อ</Badge>;
    }
    return <Badge className="bg-green-500">ปกติ</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">รายการสต็อกทั้งหมด</h1>
          <p className="text-muted-foreground">จัดการสินค้าคงคลังทั้งหมด</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มสินค้าใหม่
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ค้นหาและกรอง</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <Input
            placeholder="ค้นหาด้วยรหัสหรือชื่อสินค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          
          <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="เลือกคลัง" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกคลัง</SelectItem>
              <SelectItem value="TEG">TEG</SelectItem>
              <SelectItem value="Lucky">Lucky</SelectItem>
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ตำแหน่งจัดเก็บ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกตำแหน่ง</SelectItem>
              <SelectItem value="A1-ชั้น1">A1-ชั้น1</SelectItem>
              <SelectItem value="A2-ชั้น1">A2-ชั้น1</SelectItem>
              <SelectItem value="A1-ชั้น2">A1-ชั้น2</SelectItem>
              <SelectItem value="A2-ชั้น2">A2-ชั้น2</SelectItem>
              <SelectItem value="B1-ชั้น1">B1-ชั้น1</SelectItem>
              <SelectItem value="B2-ชั้น1">B2-ชั้น1</SelectItem>
              <SelectItem value="B1-ชั้น2">B1-ชั้น2</SelectItem>
              <SelectItem value="B2-ชั้น2">B2-ชั้น2</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showLowStock ? "default" : "outline"}
            onClick={() => setShowLowStock(!showLowStock)}
          >
            สินค้าใกล้หมด
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead>คลัง</TableHead>
                <TableHead>ตำแหน่ง</TableHead>
                <TableHead className="text-center">รวม</TableHead>
                <TableHead className="text-center">🟢 พร้อมผลิต</TableHead>
                <TableHead className="text-center">🟡 ตำหนิ</TableHead>
                <TableHead className="text-center">🔴 ชำรุด</TableHead>
                <TableHead className="text-center">ขั้นต่ำ</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>อัปเดตล่าสุด</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.warehouse}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.location}</Badge>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{item.total}</TableCell>
                  <TableCell className="text-center text-green-600 font-medium">{item.ready}</TableCell>
                  <TableCell className="text-center text-yellow-600 font-medium">{item.defective}</TableCell>
                  <TableCell className="text-center text-red-600 font-medium">{item.damaged}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{item.min}</TableCell>
                  <TableCell>{getStatusBadge(item.ready, item.min)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.lastUpdated}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 justify-end">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>รับเข้าสินค้า</DialogTitle>
                            <DialogDescription>เพิ่มจำนวนสินค้า: {item.name}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label>จำนวน</Label>
                              <Input type="number" placeholder="0" />
                            </div>
                            <div>
                              <Label>สถานะ</Label>
                              <Select defaultValue="ready">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ready">พร้อมผลิต</SelectItem>
                                  <SelectItem value="defective">ตำหนิ</SelectItem>
                                  <SelectItem value="damaged">ชำรุด</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>หมายเหตุ</Label>
                              <Input placeholder="ระบุรายละเอียด (ถ้ามี)" />
                            </div>
                            <Button className="w-full" onClick={() => handleAction("รับเข้า", item.name)}>
                              บันทึก
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Minus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>ตัดออก</DialogTitle>
                            <DialogDescription>ตัดสินค้าออก: {item.name}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label>จำนวน</Label>
                              <Input type="number" placeholder="0" />
                            </div>
                            <div>
                              <Label>สถานะที่ตัดออก</Label>
                              <Select defaultValue="ready">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ready">พร้อมผลิต</SelectItem>
                                  <SelectItem value="defective">ตำหนิ</SelectItem>
                                  <SelectItem value="damaged">ชำรุด</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>เหตุผล</Label>
                              <Input placeholder="ระบุเหตุผล" />
                            </div>
                            <Button className="w-full" variant="destructive" onClick={() => handleAction("ตัดออก", item.name)}>
                              ยืนยันตัดออก
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button size="sm" variant="ghost">
                        <ArrowRightLeft className="h-4 w-4" />
                      </Button>

                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
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
