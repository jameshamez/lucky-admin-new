import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Factory, Package, Calculator, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { procurementService } from "@/services/procurementService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ProcurementSettings() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [shippingMethods, setShippingMethods] = useState<any[]>([]);
  const [generalSettings, setGeneralSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Supplier dialog
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [supplierForm, setSupplierForm] = useState({ name: "", contact: "", specialty: "" });

  // Material dialog
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [materialForm, setMaterialForm] = useState({ category: "", material_name: "" });

  // Color dialog
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<any>(null);
  const [colorForm, setColorForm] = useState({ name_en: "", name_th: "" });

  // Shipping dialog
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [shippingForm, setShippingForm] = useState({ name: "" });

  // Pricing (general) form
  const [pricingForm, setPricingForm] = useState({ exchange_rate: "", vat_rate: "" });
  const [savingPricing, setSavingPricing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [suppRes, matRes, colRes, shipRes, genRes] = await Promise.all([
        procurementService.getSuppliers(),
        procurementService.getSettings('materials'),
        procurementService.getSettings('colors'),
        procurementService.getSettings('shipping'),
        procurementService.getSettings('general')
      ]);

      if (suppRes.status === 'success') setSuppliers(suppRes.data);
      if (matRes.status === 'success') setMaterials(matRes.data);
      if (colRes.status === 'success') setColors(colRes.data);
      if (shipRes.status === 'success') setShippingMethods(shipRes.data);
      if (genRes.status === 'success') setGeneralSettings(genRes.data);
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPricingForm({
      exchange_rate: generalSettings.exchange_rate || "5.5",
      vat_rate: generalSettings.vat_rate || "7",
    });
  }, [generalSettings]);

  // ---- Supplier dialog ----
  const openAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({ name: "", contact: "", specialty: "" });
    setSupplierDialogOpen(true);
  };
  const openEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setSupplierForm({ name: supplier.name || "", contact: supplier.contact || "", specialty: supplier.specialty || "" });
    setSupplierDialogOpen(true);
  };
  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) {
      toast.error("กรุณากรอกชื่อโรงงาน");
      return;
    }
    const res = editingSupplier
      ? await procurementService.updateSupplier(editingSupplier.id, supplierForm)
      : await procurementService.createSupplier(supplierForm);
    if (res.status === "success") {
      toast.success(editingSupplier ? "แก้ไขโรงงานสำเร็จ" : "เพิ่มโรงงานสำเร็จ");
      setSupplierDialogOpen(false);
      fetchData();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาด");
    }
  };

  // ---- Material dialog ----
  const openAddMaterial = () => {
    setEditingMaterial(null);
    setMaterialForm({ category: "", material_name: "" });
    setMaterialDialogOpen(true);
  };
  const openEditMaterial = (material: any) => {
    setEditingMaterial(material);
    setMaterialForm({ category: material.category || "", material_name: material.material_name || "" });
    setMaterialDialogOpen(true);
  };
  const handleSaveMaterial = async () => {
    if (!materialForm.material_name.trim()) {
      toast.error("กรุณากรอกชื่อวัสดุ");
      return;
    }
    const res = editingMaterial
      ? await procurementService.updateSetting('materials', editingMaterial.id, materialForm)
      : await procurementService.createSetting('materials', materialForm);
    if (res.status === "success") {
      toast.success(editingMaterial ? "แก้ไขวัสดุสำเร็จ" : "เพิ่มวัสดุสำเร็จ");
      setMaterialDialogOpen(false);
      fetchData();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาด");
    }
  };

  // ---- Color dialog ----
  const openAddColor = () => {
    setEditingColor(null);
    setColorForm({ name_en: "", name_th: "" });
    setColorDialogOpen(true);
  };
  const openEditColor = (color: any) => {
    setEditingColor(color);
    setColorForm({ name_en: color.name_en || "", name_th: color.name_th || "" });
    setColorDialogOpen(true);
  };
  const handleSaveColor = async () => {
    if (!colorForm.name_en.trim() || !colorForm.name_th.trim()) {
      toast.error("กรุณากรอกชื่อสีทั้งภาษาอังกฤษและไทย");
      return;
    }
    const res = editingColor
      ? await procurementService.updateSetting('colors', editingColor.id, colorForm)
      : await procurementService.createSetting('colors', colorForm);
    if (res.status === "success") {
      toast.success(editingColor ? "แก้ไขสีสำเร็จ" : "เพิ่มสีสำเร็จ");
      setColorDialogOpen(false);
      fetchData();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาด");
    }
  };

  // ---- Shipping dialog ----
  const openAddShipping = () => {
    setShippingForm({ name: "" });
    setShippingDialogOpen(true);
  };
  const handleSaveShipping = async () => {
    if (!shippingForm.name.trim()) {
      toast.error("กรุณากรอกชื่อช่องทางการจัดส่ง");
      return;
    }
    const res = await procurementService.createSetting('shipping', shippingForm);
    if (res.status === "success") {
      toast.success("เพิ่มช่องทางการจัดส่งสำเร็จ");
      setShippingDialogOpen(false);
      fetchData();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาด");
    }
  };

  // ---- Pricing (general settings) ----
  const handleSavePricing = async () => {
    setSavingPricing(true);
    try {
      const [r1, r2] = await Promise.all([
        procurementService.createSetting('general', { key: 'exchange_rate', value: pricingForm.exchange_rate }),
        procurementService.createSetting('general', { key: 'vat_rate', value: pricingForm.vat_rate }),
      ]);
      if (r1.status === "success" && r2.status === "success") {
        toast.success("บันทึกการตั้งค่าเรียบร้อย");
        fetchData();
      } else {
        toast.error("เกิดข้อผิดพลาดในการบันทึก");
      }
    } finally {
      setSavingPricing(false);
    }
  };

  const handleDeleteSupplier = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    const res = await procurementService.deleteSupplier(id);
    if (res.status === 'success') {
      toast.success("Deleted");
      fetchData();
    }
  };

  const handleDeleteSetting = async (type: string, id: number) => {
    if (!confirm("Are you sure?")) return;
    const res = await procurementService.deleteSetting(type, id);
    if (res.status === 'success') {
      toast.success("Deleted");
      fetchData();
    }
  };

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
                <Button size="sm" onClick={openAddSupplier}>เพิ่มโรงงาน</Button>
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
                          <Button variant="outline" size="sm" onClick={() => openEditSupplier(supplier)}>แก้ไข</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteSupplier(supplier.id)}>ลบ</Button>
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
                  <Button size="sm" onClick={openAddMaterial}>เพิ่มวัสดุ</Button>
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
                    {materials.map((material: any) => (
                      <TableRow key={material.id}>
                        <TableCell>{material.category}</TableCell>
                        <TableCell className="font-medium">{material.material_name}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditMaterial(material)}>แก้ไข</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteSetting('materials', material.id)}>ลบ</Button>
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
                  <Button size="sm" onClick={openAddColor}>เพิ่มสี</Button>
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
                    {colors.map((color: any) => (
                      <TableRow key={color.id}>
                        <TableCell className="font-medium">{color.name_en}</TableCell>
                        <TableCell>{color.name_th}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditColor(color)}>แก้ไข</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDeleteSetting('colors', color.id)}>ลบ</Button>
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
                  <Input
                    type="number"
                    value={pricingForm.exchange_rate}
                    step="0.01"
                    onChange={(e) => setPricingForm((p) => ({ ...p, exchange_rate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>VAT (%)</Label>
                  <Input
                    type="number"
                    value={pricingForm.vat_rate}
                    onChange={(e) => setPricingForm((p) => ({ ...p, vat_rate: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleSavePricing} disabled={savingPricing}>
                {savingPricing ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
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
                  {shippingMethods.map(method => (
                    <div key={method.id} className="flex items-center gap-2">
                      <Input value={method.name} readOnly />
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteSetting('shipping', method.id)}>ลบ</Button>
                    </div>
                  ))}
                </div>
                <Button className="mt-2" size="sm" onClick={openAddShipping}>เพิ่มช่องทางใหม่</Button>
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

      {/* Supplier Dialog */}
      <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "แก้ไขโรงงาน/ซัพพลายเออร์" : "เพิ่มโรงงาน/ซัพพลายเออร์"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>ชื่อโรงงาน *</Label>
              <Input value={supplierForm.name} onChange={(e) => setSupplierForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <Label>ผู้ติดต่อ</Label>
              <Input value={supplierForm.contact} onChange={(e) => setSupplierForm((p) => ({ ...p, contact: e.target.value }))} />
            </div>
            <div>
              <Label>ประเภทสินค้าที่เชี่ยวชาญ</Label>
              <Input value={supplierForm.specialty} onChange={(e) => setSupplierForm((p) => ({ ...p, specialty: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupplierDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSaveSupplier}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Material Dialog */}
      <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaterial ? "แก้ไขวัสดุ" : "เพิ่มวัสดุ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>ประเภทสินค้า</Label>
              <Input value={materialForm.category} onChange={(e) => setMaterialForm((p) => ({ ...p, category: e.target.value }))} />
            </div>
            <div>
              <Label>ชื่อวัสดุ *</Label>
              <Input value={materialForm.material_name} onChange={(e) => setMaterialForm((p) => ({ ...p, material_name: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSaveMaterial}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Color Dialog */}
      <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingColor ? "แก้ไขสี" : "เพิ่มสี"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>ชื่อภาษาอังกฤษ *</Label>
              <Input value={colorForm.name_en} onChange={(e) => setColorForm((p) => ({ ...p, name_en: e.target.value }))} />
            </div>
            <div>
              <Label>ชื่อภาษาไทย *</Label>
              <Input value={colorForm.name_th} onChange={(e) => setColorForm((p) => ({ ...p, name_th: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setColorDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSaveColor}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping Dialog */}
      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มช่องทางการจัดส่ง</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>ชื่อช่องทาง *</Label>
              <Input value={shippingForm.name} onChange={(e) => setShippingForm({ name: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShippingDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSaveShipping}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
