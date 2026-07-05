import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ArrowRightLeft, Edit, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { inventoryService, StockRow, Warehouse, StockStatus } from "@/services/inventoryService";
import { useAuth } from "@/contexts/AuthContext";

export default function InventoryAll() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showLowStock, setShowLowStock] = useState(false);

  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<StockRow[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [stockRes, warehousesRes] = await Promise.all([
        inventoryService.getStock(),
        inventoryService.getWarehouses(),
      ]);
      if (stockRes.status === "success") setInventory(stockRes.data);
      if (warehousesRes.status === "success") setWarehouses(warehousesRes.data);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลสต็อกได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const allLocations = warehouses.flatMap(w => w.locations);

  const filteredInventory = inventory.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchWarehouse = warehouseFilter === "all" || item.warehouse === warehouseFilter;
    const matchLocation = locationFilter === "all" || item.location === locationFilter;
    const matchLowStock = !showLowStock || item.ready < item.min;

    return matchSearch && matchWarehouse && matchLocation && matchLowStock;
  });

  const getStatusBadge = (ready: number, min: number) => {
    if (ready < min) {
      return <Badge variant="destructive">ใกล้หมด</Badge>;
    } else if (ready < min * 1.5) {
      return <Badge className="bg-yellow-500">ควรสั่งซื้อ</Badge>;
    }
    return <Badge className="bg-green-500">ปกติ</Badge>;
  };

  // --- Receive dialog state ---
  const [receiveQty, setReceiveQty] = useState("");
  const [receiveStatus, setReceiveStatus] = useState<StockStatus>("ready");
  const [receiveNote, setReceiveNote] = useState("");
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);

  const submitReceive = async (item: StockRow) => {
    const qty = Number(receiveQty);
    if (!qty || qty <= 0) { toast.error("กรุณาระบุจำนวน"); return; }
    setReceiveSubmitting(true);
    try {
      const res = await inventoryService.createTransaction({
        type: "รับเข้า", productId: item.productId, warehouseCode: item.warehouse,
        status: receiveStatus, quantity: qty, note: receiveNote, employeeName: user?.full_name,
      });
      if (res.status === "success") {
        toast.success(`รับเข้าสินค้า ${item.name} เรียบร้อยแล้ว`);
        setReceiveQty(""); setReceiveNote(""); setReceiveStatus("ready");
        fetchAll();
      } else {
        toast.error(res.message || "รับเข้าไม่สำเร็จ");
      }
    } finally {
      setReceiveSubmitting(false);
    }
  };

  // --- Deduct dialog state ---
  const [deductQty, setDeductQty] = useState("");
  const [deductStatus, setDeductStatus] = useState<StockStatus>("ready");
  const [deductReason, setDeductReason] = useState("");
  const [deductSubmitting, setDeductSubmitting] = useState(false);

  const submitDeduct = async (item: StockRow) => {
    const qty = Number(deductQty);
    if (!qty || qty <= 0) { toast.error("กรุณาระบุจำนวน"); return; }
    setDeductSubmitting(true);
    try {
      const res = await inventoryService.createTransaction({
        type: "ตัดออก", productId: item.productId, warehouseCode: item.warehouse,
        status: deductStatus, quantity: qty, note: deductReason, employeeName: user?.full_name,
      });
      if (res.status === "success") {
        toast.success(`ตัดสินค้า ${item.name} ออกเรียบร้อยแล้ว`);
        setDeductQty(""); setDeductReason(""); setDeductStatus("ready");
        fetchAll();
      } else {
        toast.error(res.message || "ตัดออกไม่สำเร็จ");
      }
    } finally {
      setDeductSubmitting(false);
    }
  };

  // --- Transfer dialog state ---
  const [transferTo, setTransferTo] = useState("");
  const [transferStatus, setTransferStatus] = useState<StockStatus>("ready");
  const [transferQty, setTransferQty] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  const submitTransfer = async (item: StockRow) => {
    const qty = Number(transferQty);
    if (!transferTo) { toast.error("กรุณาเลือกคลังปลายทาง"); return; }
    if (!qty || qty <= 0) { toast.error("กรุณาระบุจำนวน"); return; }
    setTransferSubmitting(true);
    try {
      const res = await inventoryService.createTransaction({
        type: "โอนคลัง", productId: item.productId, warehouseCode: item.warehouse,
        toWarehouseCode: transferTo, status: transferStatus, quantity: qty, employeeName: user?.full_name,
      });
      if (res.status === "success") {
        toast.success(`โอนสินค้า ${item.name} เรียบร้อยแล้ว`);
        setTransferTo(""); setTransferQty(""); setTransferStatus("ready");
        fetchAll();
      } else {
        toast.error(res.message || "โอนคลังไม่สำเร็จ");
      }
    } finally {
      setTransferSubmitting(false);
    }
  };

  // --- Edit (adjust stock levels) dialog state ---
  const [editReady, setEditReady] = useState("");
  const [editDefective, setEditDefective] = useState("");
  const [editDamaged, setEditDamaged] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const openEdit = (item: StockRow) => {
    setEditReady(String(item.ready));
    setEditDefective(String(item.defective));
    setEditDamaged(String(item.damaged));
    setEditReason("");
  };

  const submitEdit = async (item: StockRow) => {
    if (!editReason.trim()) { toast.error("กรุณาระบุเหตุผลการปรับยอด"); return; }
    setEditSubmitting(true);
    try {
      const res = await inventoryService.createTransaction({
        type: "ปรับยอด", productId: item.productId, warehouseCode: item.warehouse,
        readyQty: Number(editReady), defectiveQty: Number(editDefective), damagedQty: Number(editDamaged),
        note: editReason, employeeName: user?.full_name,
      });
      if (res.status === "success") {
        toast.success(`ปรับยอดสต็อก ${item.name} เรียบร้อยแล้ว`);
        fetchAll();
      } else {
        toast.error(res.message || "ปรับยอดไม่สำเร็จ");
      }
    } finally {
      setEditSubmitting(false);
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">รายการสต็อกทั้งหมด</h1>
          <p className="text-muted-foreground">จัดการสินค้าคงคลังทั้งหมด</p>
        </div>
        <Button onClick={() => navigate("/production/inventory-settings")}>
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
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.code}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="ตำแหน่งจัดเก็บ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกตำแหน่ง</SelectItem>
              {allLocations.map((loc) => (
                <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
              ))}
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
                    <Badge variant="secondary">{item.location || "-"}</Badge>
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
                      {/* Receive */}
                      <Dialog onOpenChange={(open) => { if (open) { setReceiveQty(""); setReceiveNote(""); setReceiveStatus("ready"); } }}>
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
                              <Input type="number" placeholder="0" value={receiveQty} onChange={(e) => setReceiveQty(e.target.value)} />
                            </div>
                            <div>
                              <Label>สถานะ</Label>
                              <Select value={receiveStatus} onValueChange={(v) => setReceiveStatus(v as StockStatus)}>
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
                              <Input placeholder="ระบุรายละเอียด (ถ้ามี)" value={receiveNote} onChange={(e) => setReceiveNote(e.target.value)} />
                            </div>
                            <Button className="w-full" onClick={() => submitReceive(item)} disabled={receiveSubmitting}>
                              {receiveSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}บันทึก
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Deduct */}
                      <Dialog onOpenChange={(open) => { if (open) { setDeductQty(""); setDeductReason(""); setDeductStatus("ready"); } }}>
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
                              <Input type="number" placeholder="0" value={deductQty} onChange={(e) => setDeductQty(e.target.value)} />
                            </div>
                            <div>
                              <Label>สถานะที่ตัดออก</Label>
                              <Select value={deductStatus} onValueChange={(v) => setDeductStatus(v as StockStatus)}>
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
                              <Input placeholder="ระบุเหตุผล" value={deductReason} onChange={(e) => setDeductReason(e.target.value)} />
                            </div>
                            <Button className="w-full" variant="destructive" onClick={() => submitDeduct(item)} disabled={deductSubmitting}>
                              {deductSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}ยืนยันตัดออก
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Transfer */}
                      <Dialog onOpenChange={(open) => { if (open) { setTransferTo(""); setTransferQty(""); setTransferStatus("ready"); } }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>โอนย้ายคลัง</DialogTitle>
                            <DialogDescription>โอนสินค้า: {item.name} (จากคลัง {item.warehouse})</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label>คลังปลายทาง</Label>
                              <Select value={transferTo} onValueChange={setTransferTo}>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกคลังปลายทาง" />
                                </SelectTrigger>
                                <SelectContent>
                                  {warehouses.filter(w => w.code !== item.warehouse).map((w) => (
                                    <SelectItem key={w.id} value={w.code}>{w.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>สถานะสินค้า</Label>
                              <Select value={transferStatus} onValueChange={(v) => setTransferStatus(v as StockStatus)}>
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
                              <Label>จำนวน</Label>
                              <Input type="number" placeholder="0" value={transferQty} onChange={(e) => setTransferQty(e.target.value)} />
                            </div>
                            <Button className="w-full" onClick={() => submitTransfer(item)} disabled={transferSubmitting}>
                              {transferSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}ยืนยันโอนย้าย
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Edit (adjust stock levels directly) */}
                      <Dialog onOpenChange={(open) => { if (open) openEdit(item); }}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>ปรับยอดสต็อก</DialogTitle>
                            <DialogDescription>แก้ไขจำนวนคงเหลือของ: {item.name}</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <Label>พร้อมผลิต</Label>
                                <Input type="number" value={editReady} onChange={(e) => setEditReady(e.target.value)} />
                              </div>
                              <div>
                                <Label>ตำหนิ</Label>
                                <Input type="number" value={editDefective} onChange={(e) => setEditDefective(e.target.value)} />
                              </div>
                              <div>
                                <Label>ชำรุด</Label>
                                <Input type="number" value={editDamaged} onChange={(e) => setEditDamaged(e.target.value)} />
                              </div>
                            </div>
                            <div>
                              <Label>เหตุผลการปรับยอด</Label>
                              <Input placeholder="ระบุเหตุผล" value={editReason} onChange={(e) => setEditReason(e.target.value)} />
                            </div>
                            <Button className="w-full" onClick={() => submitEdit(item)} disabled={editSubmitting}>
                              {editSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}บันทึก
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredInventory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-muted-foreground py-8">
                    ไม่มีข้อมูลสต็อก
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
