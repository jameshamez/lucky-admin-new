import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package, Warehouse, Ruler } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const mockProducts = [
  { code: "P001", name: "ถังขยะพลาสติก 120L", category: "ถังขยะพลาสติก", unit: "ชิ้น", minStock: 50 },
  { code: "P002", name: "ถังขยะพลาสติก 240L", category: "ถังขยะพลาสติก", unit: "ชิ้น", minStock: 50 },
  { code: "P003", name: "ถังขยะสแตนเลส 80L", category: "ถังขยะสแตนเลส", unit: "ชิ้น", minStock: 30 },
];

const mockWarehouses = [
  { id: "1", code: "TEG", name: "คลัง TEG", address: "สำนักงานใหญ่", status: "เปิดใช้งาน" },
  { id: "2", code: "LUCKY", name: "คลัง Lucky", address: "สาขา Lucky", status: "เปิดใช้งาน" },
];

const mockUnits = [
  { id: "1", name: "ชิ้น", abbr: "ชิ้น" },
  { id: "2", name: "กล่อง", abbr: "กล่อง" },
  { id: "3", name: "แพ็ค", abbr: "แพ็ค" },
  { id: "4", name: "เมตร", abbr: "ม." },
];

const mockLocations = [
  { id: "1", code: "A1-1", name: "A1-ชั้น1", warehouse: "คลัง TEG", status: "เปิดใช้งาน" },
  { id: "2", code: "A2-1", name: "A2-ชั้น1", warehouse: "คลัง TEG", status: "เปิดใช้งาน" },
  { id: "3", code: "A1-2", name: "A1-ชั้น2", warehouse: "คลัง TEG", status: "เปิดใช้งาน" },
  { id: "4", code: "A2-2", name: "A2-ชั้น2", warehouse: "คลัง TEG", status: "เปิดใช้งาน" },
  { id: "5", code: "B1-1", name: "B1-ชั้น1", warehouse: "คลัง Lucky", status: "เปิดใช้งาน" },
  { id: "6", code: "B2-1", name: "B2-ชั้น1", warehouse: "คลัง Lucky", status: "เปิดใช้งาน" },
  { id: "7", code: "B1-2", name: "B1-ชั้น2", warehouse: "คลัง Lucky", status: "เปิดใช้งาน" },
  { id: "8", code: "B2-2", name: "B2-ชั้น2", warehouse: "คลัง Lucky", status: "เปิดใช้งาน" },
];

const mockCategories = [
  { id: "1", name: "ถังขยะพลาสติก" },
  { id: "2", name: "ถังขยะสแตนเลส" },
  { id: "3", name: "รถเข็นขยะ" },
];

export default function InventorySettings() {
  const { toast } = useToast();

  const handleAdd = (type: string) => {
    toast({
      title: "เพิ่มสำเร็จ",
      description: `เพิ่ม${type}เรียบร้อยแล้ว`,
    });
  };

  const handleEdit = (type: string, name: string) => {
    toast({
      title: "แก้ไขสำเร็จ",
      description: `แก้ไข${type} "${name}" เรียบร้อยแล้ว`,
    });
  };

  const handleDelete = (type: string, name: string) => {
    toast({
      title: "ลบสำเร็จ",
      description: `ลบ${type} "${name}" เรียบร้อยแล้ว`,
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ตั้งค่าระบบคลัง</h1>
        <p className="text-muted-foreground">จัดการข้อมูลพื้นฐานและการตั้งค่า</p>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            สินค้า
          </TabsTrigger>
          <TabsTrigger value="warehouses">
            <Warehouse className="mr-2 h-4 w-4" />
            คลัง
          </TabsTrigger>
          <TabsTrigger value="locations">
            ตำแหน่งจัดเก็บ
          </TabsTrigger>
          <TabsTrigger value="units">
            <Ruler className="mr-2 h-4 w-4" />
            หน่วยนับ
          </TabsTrigger>
          <TabsTrigger value="categories">
            หมวดหมู่
          </TabsTrigger>
        </TabsList>

        {/* Products */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>รายการสินค้า</CardTitle>
                <CardDescription>จัดการข้อมูลสินค้าและจุดสั่งซื้อขั้นต่ำ</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มสินค้า
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>เพิ่มสินค้าใหม่</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>รหัสสินค้า *</Label>
                      <Input placeholder="P001" />
                    </div>
                    <div className="space-y-2">
                      <Label>ชื่อสินค้า *</Label>
                      <Input placeholder="ถังขยะพลาสติก 120L" />
                    </div>
                    <div className="space-y-2">
                      <Label>หมวดหมู่</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกหมวดหมู่" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>หน่วยนับ *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกหน่วย" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockUnits.map(unit => (
                            <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>จุดสั่งซื้อขั้นต่ำ</Label>
                      <Input type="number" placeholder="50" />
                    </div>
                    <Button className="w-full" onClick={() => handleAdd("สินค้า")}>
                      บันทึก
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัส</TableHead>
                    <TableHead>ชื่อสินค้า</TableHead>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead>หน่วยนับ</TableHead>
                    <TableHead>ขั้นต่ำ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProducts.map((product) => (
                    <TableRow key={product.code}>
                      <TableCell className="font-medium">{product.code}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>{product.minStock}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit("สินค้า", product.name)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete("สินค้า", product.name)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warehouses */}
        <TabsContent value="warehouses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>รายการคลัง</CardTitle>
                <CardDescription>จัดการสถานที่เก็บสินค้า</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มคลัง
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>เพิ่มคลังใหม่</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>รหัสคลัง *</Label>
                      <Input placeholder="WAREHOUSE01" />
                    </div>
                    <div className="space-y-2">
                      <Label>ชื่อคลัง *</Label>
                      <Input placeholder="คลังสาขาใหม่" />
                    </div>
                    <div className="space-y-2">
                      <Label>ที่อยู่</Label>
                      <Input placeholder="ระบุที่อยู่" />
                    </div>
                    <Button className="w-full" onClick={() => handleAdd("คลัง")}>
                      บันทึก
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัส</TableHead>
                    <TableHead>ชื่อคลัง</TableHead>
                    <TableHead>ที่อยู่</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockWarehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">{warehouse.code}</TableCell>
                      <TableCell>{warehouse.name}</TableCell>
                      <TableCell>{warehouse.address}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">{warehouse.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit("คลัง", warehouse.name)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete("คลัง", warehouse.name)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations */}
        <TabsContent value="locations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>ตำแหน่งจัดเก็บสินค้า (Locations)</CardTitle>
                <CardDescription>กำหนด Location ต่อคลัง</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มตำแหน่ง
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>เพิ่มตำแหน่งจัดเก็บใหม่</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>รหัสตำแหน่ง *</Label>
                      <Input placeholder="A1-1" />
                    </div>
                    <div className="space-y-2">
                      <Label>ชื่อตำแหน่ง *</Label>
                      <Input placeholder="A1-ชั้น1" />
                    </div>
                    <div className="space-y-2">
                      <Label>คลัง *</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกคลัง" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TEG">คลัง TEG</SelectItem>
                          <SelectItem value="LUCKY">คลัง Lucky</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={() => handleAdd("ตำแหน่ง")}>
                      บันทึก
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัส</TableHead>
                    <TableHead>ชื่อตำแหน่ง</TableHead>
                    <TableHead>คลัง</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLocations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.code}</TableCell>
                      <TableCell>{location.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{location.warehouse}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">{location.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit("ตำแหน่ง", location.name)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete("ตำแหน่ง", location.name)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Units */}
        <TabsContent value="units">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>หน่วยนับ</CardTitle>
                <CardDescription>จัดการหน่วยนับสินค้า</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มหน่วยนับ
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>เพิ่มหน่วยนับใหม่</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>ชื่อหน่วย *</Label>
                      <Input placeholder="เช่น กิโลกรัม" />
                    </div>
                    <div className="space-y-2">
                      <Label>ตัวย่อ</Label>
                      <Input placeholder="เช่น กก." />
                    </div>
                    <Button className="w-full" onClick={() => handleAdd("หน่วยนับ")}>
                      บันทึก
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อหน่วย</TableHead>
                    <TableHead>ตัวย่อ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUnits.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>{unit.abbr}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit("หน่วยนับ", unit.name)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete("หน่วยนับ", unit.name)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>หมวดหมู่สินค้า</CardTitle>
                <CardDescription>จัดการหมวดหมู่สินค้า</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มหมวดหมู่
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>เพิ่มหมวดหมู่ใหม่</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>ชื่อหมวดหมู่ *</Label>
                      <Input placeholder="เช่น ถังขยะอุตสาหกรรม" />
                    </div>
                    <Button className="w-full" onClick={() => handleAdd("หมวดหมู่")}>
                      บันทึก
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อหมวดหมู่</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit("หมวดหมู่", category.name)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete("หมวดหมู่", category.name)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
