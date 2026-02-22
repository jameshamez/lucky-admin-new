import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Factory, Package, Calculator, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProcurementSettings() {
  const [suppliers, setSuppliers] = useState([
    { id: "1", name: "China B&C", contact: "สมชาย", specialty: "เหรียญ, ถ้วย" },
    { id: "2", name: "China LINDA", contact: "สมหญิง", specialty: "โล่, คริสตัล" },
  ]);

  const [materials, setMaterials] = useState([
    { id: "1", category: "เหรียญ", material: "ซิงค์อัลลอย" },
    { id: "2", category: "เหรียญ", material: "อะคริลิก" },
  ]);

  const [colors, setColors] = useState([
    { id: "1", name: "shinny gold", nameLocal: "สีทองเงา" },
    { id: "2", name: "shinny silver", nameLocal: "สีเงินเงา" },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">การตั้งค่า (ฝ่ายจัดซื้อ)</h1>
        <p className="text-muted-foreground mt-2">
          จัดการข้อมูลหลัก, ซัพพลายเออร์, วัสดุ และการตั้งค่าต่างๆ
        </p>
      </div>

      <Tabs defaultValue="suppliers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suppliers">
            <Factory className="mr-2 h-4 w-4" />
            ซัพพลายเออร์
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            สินค้า/วัสดุ
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <Calculator className="mr-2 h-4 w-4" />
            การคำนวณ
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="mr-2 h-4 w-4" />
            การสั่งซื้อ
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Suppliers */}
        <TabsContent value="suppliers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>รายชื่อโรงงาน/ซัพพลายเออร์</CardTitle>
                <Button size="sm">เพิ่มโรงงาน</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อโรงงาน</TableHead>
                    <TableHead>ผู้ติดต่อ</TableHead>
                    <TableHead>ประเภทสินค้าที่เชี่ยวชาญ</TableHead>
                    <TableHead>การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contact}</TableCell>
                      <TableCell>{supplier.specialty}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">แก้ไข</Button>
                          <Button variant="destructive" size="sm">ลบ</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Products & Materials */}
        <TabsContent value="products">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>วัสดุ (แยกตามประเภทสินค้า)</CardTitle>
                  <Button size="sm">เพิ่มวัสดุ</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ประเภทสินค้า</TableHead>
                      <TableHead>ชื่อวัสดุ</TableHead>
                      <TableHead>การจัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>{material.category}</TableCell>
                        <TableCell className="font-medium">{material.material}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">แก้ไข</Button>
                            <Button variant="destructive" size="sm">ลบ</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>สีชุบ</CardTitle>
                  <Button size="sm">เพิ่มสี</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อภาษาอังกฤษ</TableHead>
                      <TableHead>ชื่อภาษาไทย</TableHead>
                      <TableHead>การจัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colors.map((color) => (
                      <TableRow key={color.id}>
                        <TableCell className="font-medium">{color.name}</TableCell>
                        <TableCell>{color.nameLocal}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">แก้ไข</Button>
                            <Button variant="destructive" size="sm">ลบ</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 3: Pricing Settings */}
        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle>การคำนวณและอนุมัติ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>อัตราแลกเปลี่ยน (Default ECR)</Label>
                  <Input type="number" defaultValue="5.5" step="0.01" />
                </div>
                <div>
                  <Label>VAT (%)</Label>
                  <Input type="number" defaultValue="7" />
                </div>
              </div>
              <Button onClick={() => toast.success("บันทึกการตั้งค่าเรียบร้อย")}>
                บันทึกการตั้งค่า
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Order Settings */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>การสั่งซื้อ (Purchase Order Settings)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>ช่องทางการจัดส่ง</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Input defaultValue="Air Freight" />
                    <Button variant="outline" size="sm">แก้ไข</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input defaultValue="Sea Freight" />
                    <Button variant="outline" size="sm">แก้ไข</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input defaultValue="EK Freight" />
                    <Button variant="outline" size="sm">แก้ไข</Button>
                  </div>
                </div>
                <Button className="mt-2" size="sm">เพิ่มช่องทางใหม่</Button>
              </div>

              <div>
                <Label>รูปแบบเลขที่ PO/PR</Label>
                <Input defaultValue="PRDDMMYYXXXX" disabled />
                <p className="text-xs text-muted-foreground mt-1">
                  รูปแบบอัตโนมัติ: PR + วันที่ + ลำดับ (เช่น PR13092501)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
