import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Package, Warehouse as WarehouseIcon, Ruler, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  inventoryService, InventoryProduct, Warehouse, WarehouseLocation, InventoryCategory, InventoryUnit,
} from "@/services/inventoryService";

type DeleteType = "product" | "warehouse" | "location" | "unit" | "category";

export default function InventorySettings() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [units, setUnits] = useState<InventoryUnit[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [productsRes, warehousesRes, metaRes] = await Promise.all([
        inventoryService.getProducts(),
        inventoryService.getWarehouses(),
        inventoryService.getProductMeta(),
      ]);
      if (productsRes.status === "success") setProducts(productsRes.data);
      if (warehousesRes.status === "success") setWarehouses(warehousesRes.data);
      if (metaRes.status === "success") { setCategories(metaRes.data.categories); setUnits(metaRes.data.units); }
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลตั้งค่าคลังได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const locations: (WarehouseLocation & { warehouseName: string; warehouseId: number })[] = warehouses.flatMap(w =>
    w.locations.map(l => ({ ...l, warehouseName: w.name, warehouseId: w.id }))
  );

  // --- Delete (shared) ---
  const [deleteTarget, setDeleteTarget] = useState<{ type: DeleteType; id: number; label: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const openDelete = (type: DeleteType, id: number, label: string) => { setDeleteTarget({ type, id, label }); setDeleteDialogOpen(true); };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    let res;
    if (deleteTarget.type === "product") res = await inventoryService.deleteProductEntity("product", deleteTarget.id);
    else if (deleteTarget.type === "unit") res = await inventoryService.deleteProductEntity("unit", deleteTarget.id);
    else if (deleteTarget.type === "category") res = await inventoryService.deleteProductEntity("category", deleteTarget.id);
    else if (deleteTarget.type === "warehouse") res = await inventoryService.deleteWarehouseEntity("warehouse", deleteTarget.id);
    else res = await inventoryService.deleteWarehouseEntity("location", deleteTarget.id);

    if (res?.status === "success") {
      toast.success(`ลบ "${deleteTarget.label}" เรียบร้อยแล้ว`);
      fetchAll();
    } else {
      toast.error(res?.message || "ลบไม่สำเร็จ");
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  // --- Products ---
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [isProductAdd, setIsProductAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Partial<InventoryProduct>>({});
  const [savingProduct, setSavingProduct] = useState(false);

  const openAddProduct = () => { setIsProductAdd(true); setEditProduct({ code: "", name: "", minStock: 0 }); setProductDialogOpen(true); };
  const openEditProduct = (p: InventoryProduct) => { setIsProductAdd(false); setEditProduct({ ...p }); setProductDialogOpen(true); };
  const saveProduct = async () => {
    if (!editProduct.code?.trim() || !editProduct.name?.trim()) { toast.error("กรุณากรอกรหัสและชื่อสินค้า"); return; }
    setSavingProduct(true);
    try {
      const res = await inventoryService.saveProduct(editProduct);
      if (res.status === "success") {
        toast.success(isProductAdd ? "เพิ่มสินค้าเรียบร้อยแล้ว" : "แก้ไขสินค้าเรียบร้อยแล้ว");
        setProductDialogOpen(false);
        fetchAll();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSavingProduct(false);
    }
  };

  // --- Warehouses ---
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [isWarehouseAdd, setIsWarehouseAdd] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState<{ id?: number; code: string; name: string; address: string }>({ code: "", name: "", address: "" });
  const [savingWarehouse, setSavingWarehouse] = useState(false);

  const openAddWarehouse = () => { setIsWarehouseAdd(true); setEditWarehouse({ code: "", name: "", address: "" }); setWarehouseDialogOpen(true); };
  const openEditWarehouse = (w: Warehouse) => { setIsWarehouseAdd(false); setEditWarehouse({ id: w.id, code: w.code, name: w.name, address: w.address || "" }); setWarehouseDialogOpen(true); };
  const saveWarehouse = async () => {
    if (!editWarehouse.code.trim() || !editWarehouse.name.trim()) { toast.error("กรุณากรอกรหัสและชื่อคลัง"); return; }
    setSavingWarehouse(true);
    try {
      const res = await inventoryService.saveWarehouse(editWarehouse);
      if (res.status === "success") {
        toast.success(isWarehouseAdd ? "เพิ่มคลังเรียบร้อยแล้ว" : "แก้ไขคลังเรียบร้อยแล้ว");
        setWarehouseDialogOpen(false);
        fetchAll();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSavingWarehouse(false);
    }
  };

  // --- Locations ---
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [isLocationAdd, setIsLocationAdd] = useState(false);
  const [editLocation, setEditLocation] = useState<{ id?: number; warehouseId: number; code: string; name: string }>({ warehouseId: 0, code: "", name: "" });
  const [savingLocation, setSavingLocation] = useState(false);

  const openAddLocation = () => { setIsLocationAdd(true); setEditLocation({ warehouseId: 0, code: "", name: "" }); setLocationDialogOpen(true); };
  const openEditLocation = (l: WarehouseLocation & { warehouseId: number }) => { setIsLocationAdd(false); setEditLocation({ id: l.id, warehouseId: l.warehouseId, code: l.code, name: l.name }); setLocationDialogOpen(true); };
  const saveLocation = async () => {
    if (!editLocation.warehouseId) { toast.error("กรุณาเลือกคลัง"); return; }
    if (!editLocation.code.trim() || !editLocation.name.trim()) { toast.error("กรุณากรอกรหัสและชื่อตำแหน่ง"); return; }
    setSavingLocation(true);
    try {
      const res = await inventoryService.saveLocation(editLocation);
      if (res.status === "success") {
        toast.success(isLocationAdd ? "เพิ่มตำแหน่งเรียบร้อยแล้ว" : "แก้ไขตำแหน่งเรียบร้อยแล้ว");
        setLocationDialogOpen(false);
        fetchAll();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSavingLocation(false);
    }
  };

  // --- Units ---
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [isUnitAdd, setIsUnitAdd] = useState(false);
  const [editUnit, setEditUnit] = useState<{ id?: number; name: string; abbr: string }>({ name: "", abbr: "" });
  const [savingUnit, setSavingUnit] = useState(false);

  const openAddUnit = () => { setIsUnitAdd(true); setEditUnit({ name: "", abbr: "" }); setUnitDialogOpen(true); };
  const openEditUnit = (u: InventoryUnit) => { setIsUnitAdd(false); setEditUnit({ id: u.id, name: u.name, abbr: u.abbr }); setUnitDialogOpen(true); };
  const saveUnit = async () => {
    if (!editUnit.name.trim()) { toast.error("กรุณากรอกชื่อหน่วย"); return; }
    setSavingUnit(true);
    try {
      const res = await inventoryService.saveUnit(editUnit);
      if (res.status === "success") {
        toast.success(isUnitAdd ? "เพิ่มหน่วยนับเรียบร้อยแล้ว" : "แก้ไขหน่วยนับเรียบร้อยแล้ว");
        setUnitDialogOpen(false);
        fetchAll();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSavingUnit(false);
    }
  };

  // --- Categories ---
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [isCategoryAdd, setIsCategoryAdd] = useState(false);
  const [editCategory, setEditCategory] = useState<{ id?: number; name: string }>({ name: "" });
  const [savingCategory, setSavingCategory] = useState(false);

  const openAddCategory = () => { setIsCategoryAdd(true); setEditCategory({ name: "" }); setCategoryDialogOpen(true); };
  const openEditCategory = (c: InventoryCategory) => { setIsCategoryAdd(false); setEditCategory({ id: c.id, name: c.name }); setCategoryDialogOpen(true); };
  const saveCategory = async () => {
    if (!editCategory.name.trim()) { toast.error("กรุณากรอกชื่อหมวดหมู่"); return; }
    setSavingCategory(true);
    try {
      const res = await inventoryService.saveCategory(editCategory);
      if (res.status === "success") {
        toast.success(isCategoryAdd ? "เพิ่มหมวดหมู่เรียบร้อยแล้ว" : "แก้ไขหมวดหมู่เรียบร้อยแล้ว");
        setCategoryDialogOpen(false);
        fetchAll();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSavingCategory(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ตั้งค่าระบบคลัง</h1>
        <p className="text-muted-foreground">จัดการข้อมูลพื้นฐานและการตั้งค่า</p>
      </div>

      {/* Shared delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบข้อมูล</AlertDialogTitle>
            <AlertDialogDescription>คุณแน่ใจหรือไม่ที่จะลบ "{deleteTarget?.label}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">ลบข้อมูล</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            สินค้า
          </TabsTrigger>
          <TabsTrigger value="warehouses">
            <WarehouseIcon className="mr-2 h-4 w-4" />
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
              <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddProduct}>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มสินค้า
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isProductAdd ? "เพิ่มสินค้าใหม่" : "แก้ไขสินค้า"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>รหัสสินค้า *</Label>
                      <Input placeholder="P001" value={editProduct.code || ""} onChange={(e) => setEditProduct({ ...editProduct, code: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>ชื่อสินค้า *</Label>
                      <Input placeholder="ถังขยะพลาสติก 120L" value={editProduct.name || ""} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>หมวดหมู่</Label>
                      <Select value={editProduct.categoryId ? String(editProduct.categoryId) : ""} onValueChange={(v) => setEditProduct({ ...editProduct, categoryId: Number(v) })}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกหมวดหมู่" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>หน่วยนับ *</Label>
                      <Select value={editProduct.unitId ? String(editProduct.unitId) : ""} onValueChange={(v) => setEditProduct({ ...editProduct, unitId: Number(v) })}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกหน่วย" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit.id} value={String(unit.id)}>{unit.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>จุดสั่งซื้อขั้นต่ำ</Label>
                      <Input type="number" placeholder="50" value={editProduct.minStock ?? ""} onChange={(e) => setEditProduct({ ...editProduct, minStock: Number(e.target.value) })} />
                    </div>
                    <Button className="w-full" onClick={saveProduct} disabled={savingProduct}>
                      {savingProduct ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}บันทึก
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
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.code}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        {product.category && <Badge variant="outline">{product.category}</Badge>}
                      </TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>{product.minStock}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEditProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openDelete("product", product.id, product.name)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">ยังไม่มีสินค้า</TableCell></TableRow>
                  )}
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
              <Dialog open={warehouseDialogOpen} onOpenChange={setWarehouseDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddWarehouse}>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มคลัง
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isWarehouseAdd ? "เพิ่มคลังใหม่" : "แก้ไขคลัง"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>รหัสคลัง *</Label>
                      <Input placeholder="WAREHOUSE01" value={editWarehouse.code} onChange={(e) => setEditWarehouse({ ...editWarehouse, code: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>ชื่อคลัง *</Label>
                      <Input placeholder="คลังสาขาใหม่" value={editWarehouse.name} onChange={(e) => setEditWarehouse({ ...editWarehouse, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>ที่อยู่</Label>
                      <Input placeholder="ระบุที่อยู่" value={editWarehouse.address} onChange={(e) => setEditWarehouse({ ...editWarehouse, address: e.target.value })} />
                    </div>
                    <Button className="w-full" onClick={saveWarehouse} disabled={savingWarehouse}>
                      {savingWarehouse ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}บันทึก
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
                  {warehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell className="font-medium">{warehouse.code}</TableCell>
                      <TableCell>{warehouse.name}</TableCell>
                      <TableCell>{warehouse.address}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">{warehouse.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEditWarehouse(warehouse)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openDelete("warehouse", warehouse.id, warehouse.name)}>
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
              <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddLocation}>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มตำแหน่ง
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isLocationAdd ? "เพิ่มตำแหน่งจัดเก็บใหม่" : "แก้ไขตำแหน่งจัดเก็บ"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>รหัสตำแหน่ง *</Label>
                      <Input placeholder="A1-1" value={editLocation.code} onChange={(e) => setEditLocation({ ...editLocation, code: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>ชื่อตำแหน่ง *</Label>
                      <Input placeholder="A1-ชั้น1" value={editLocation.name} onChange={(e) => setEditLocation({ ...editLocation, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>คลัง *</Label>
                      <Select value={editLocation.warehouseId ? String(editLocation.warehouseId) : ""} onValueChange={(v) => setEditLocation({ ...editLocation, warehouseId: Number(v) })}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกคลัง" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map(w => (
                            <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={saveLocation} disabled={savingLocation}>
                      {savingLocation ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}บันทึก
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
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell className="font-medium">{location.code}</TableCell>
                      <TableCell>{location.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{location.warehouseName}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">{location.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEditLocation(location)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openDelete("location", location.id, location.name)}>
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
              <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddUnit}>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มหน่วยนับ
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isUnitAdd ? "เพิ่มหน่วยนับใหม่" : "แก้ไขหน่วยนับ"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>ชื่อหน่วย *</Label>
                      <Input placeholder="เช่น กิโลกรัม" value={editUnit.name} onChange={(e) => setEditUnit({ ...editUnit, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>ตัวย่อ</Label>
                      <Input placeholder="เช่น กก." value={editUnit.abbr} onChange={(e) => setEditUnit({ ...editUnit, abbr: e.target.value })} />
                    </div>
                    <Button className="w-full" onClick={saveUnit} disabled={savingUnit}>
                      {savingUnit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}บันทึก
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
                  {units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="font-medium">{unit.name}</TableCell>
                      <TableCell>{unit.abbr}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEditUnit(unit)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openDelete("unit", unit.id, unit.name)}>
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
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openAddCategory}>
                    <Plus className="mr-2 h-4 w-4" />
                    เพิ่มหมวดหมู่
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isCategoryAdd ? "เพิ่มหมวดหมู่ใหม่" : "แก้ไขหมวดหมู่"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>ชื่อหมวดหมู่ *</Label>
                      <Input placeholder="เช่น ถังขยะอุตสาหกรรม" value={editCategory.name} onChange={(e) => setEditCategory({ ...editCategory, name: e.target.value })} />
                    </div>
                    <Button className="w-full" onClick={saveCategory} disabled={savingCategory}>
                      {savingCategory ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}บันทึก
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
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEditCategory(category)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openDelete("category", category.id, category.name)}>
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
