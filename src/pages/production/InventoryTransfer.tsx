import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { inventoryService, InventoryProduct, Warehouse, InventoryTransaction, StockStatus } from "@/services/inventoryService";
import { useAuth } from "@/contexts/AuthContext";

export default function InventoryTransfer() {
  const { user } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [status, setStatus] = useState<StockStatus>("ready");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [history, setHistory] = useState<InventoryTransaction[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [productsRes, warehousesRes, txnRes] = await Promise.all([
        inventoryService.getProducts(),
        inventoryService.getWarehouses(),
        inventoryService.getTransactions({ type: "โอนคลัง" }),
      ]);
      if (productsRes.status === "success") setProducts(productsRes.data);
      if (warehousesRes.status === "success") setWarehouses(warehousesRes.data);
      if (txnRes.status === "success") setHistory(txnRes.data);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async () => {
    if (!selectedProduct || !quantity || !fromWarehouse || !toWarehouse) {
      toast.error("โปรดระบุสินค้า จำนวน และคลังต้นทาง-ปลายทาง");
      return;
    }
    if (fromWarehouse === toWarehouse) {
      toast.error("คลังต้นทางและปลายทางต้องไม่เหมือนกัน");
      return;
    }
    const product = products.find(p => p.code === selectedProduct);
    if (!product) return;

    setSubmitting(true);
    try {
      const res = await inventoryService.createTransaction({
        type: "โอนคลัง",
        productId: product.id,
        warehouseCode: fromWarehouse,
        toWarehouseCode: toWarehouse,
        status,
        quantity: Number(quantity),
        note,
        employeeName: user?.full_name,
      });
      if (res.status === "success") {
        toast.success(`โอน ${quantity} หน่วย จาก ${fromWarehouse} ไป ${toWarehouse} เรียบร้อยแล้ว`);
        setSelectedProduct(""); setQuantity(""); setFromWarehouse(""); setToWarehouse(""); setStatus("ready"); setNote("");
        fetchAll();
      } else {
        toast.error(res.message || "โอนย้ายไม่สำเร็จ");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (statusLabel: string) => {
    if (statusLabel === "พร้อมผลิต") return <Badge className="bg-green-500">พร้อมผลิต</Badge>;
    if (statusLabel === "ตำหนิ") return <Badge className="bg-yellow-500">ตำหนิ</Badge>;
    if (statusLabel === "ชำรุด") return <Badge className="bg-red-500">ชำรุด</Badge>;
    return <Badge variant="outline">{statusLabel}</Badge>;
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
        <h1 className="text-3xl font-bold">โอนย้ายคลัง</h1>
        <p className="text-muted-foreground">โอนสินค้าระหว่างคลังในระบบ</p>
      </div>

      {/* Transfer Form */}
      <Card>
        <CardHeader>
          <CardTitle>ฟอร์มโอนย้าย</CardTitle>
          <CardDescription>กรอกข้อมูลเพื่อโอนสินค้าระหว่างคลัง</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>สินค้า *</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสินค้า" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.code}>
                      {product.code} - {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>จำนวน *</Label>
              <Input
                type="number"
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3 items-end">
            <div className="space-y-2">
              <Label>จากคลัง *</Label>
              <Select value={fromWarehouse} onValueChange={setFromWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกคลังต้นทาง" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.code}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="space-y-2">
              <Label>ไปคลัง *</Label>
              <Select value={toWarehouse} onValueChange={setToWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกคลังปลายทาง" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.filter(w => w.code !== fromWarehouse).map((w) => (
                    <SelectItem key={w.id} value={w.code}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>สถานะสินค้า</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as StockStatus)}>
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

          <div className="space-y-2">
            <Label>หมายเหตุ</Label>
            <Textarea
              placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full" size="lg" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
            ยืนยันการโอนย้าย
          </Button>
        </CardContent>
      </Card>

      {/* Transfer History */}
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการโอนย้าย</CardTitle>
          <CardDescription>รายการโอนย้ายล่าสุด</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>วันที่-เวลา</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead>จากคลัง</TableHead>
                <TableHead>ไปคลัง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ผู้ทำรายการ</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => {
                const [from, to] = item.warehouse.split(" → ");
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell className="text-sm">{item.date}</TableCell>
                    <TableCell>{item.product}</TableCell>
                    <TableCell className="font-semibold">{item.quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{from}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{to}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.statusTo)}</TableCell>
                    <TableCell className="text-sm">{item.by}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.note}</TableCell>
                  </TableRow>
                );
              })}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">ยังไม่มีประวัติการโอนย้าย</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
