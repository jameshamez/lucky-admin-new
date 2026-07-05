import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { inventoryService, InventoryProduct, Warehouse, InventoryTransaction, StockStatus } from "@/services/inventoryService";
import { useAuth } from "@/contexts/AuthContext";

const statusOptions: { value: StockStatus; label: string }[] = [
  { value: "ready", label: "พร้อมผลิต" },
  { value: "defective", label: "ตำหนิ" },
  { value: "damaged", label: "ชำรุด" },
];

const typeOptions = [
  { value: "production", label: "จากฝ่ายผลิต" },
  { value: "purchase", label: "จากจัดซื้อ" },
  { value: "transfer", label: "จากโอนคลัง" },
  { value: "other", label: "อื่นๆ" },
];

const statusLabelToValue: Record<string, StockStatus> = { "พร้อมผลิต": "ready", "ตำหนิ": "defective", "ชำรุด": "damaged" };

export default function InventoryReceive() {
  const { user } = useAuth();
  const [receiveDate, setReceiveDate] = useState<Date>(new Date());
  const [expireDate, setExpireDate] = useState<Date>();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StockStatus | "">("");
  const [selectedType, setSelectedType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [docNo, setDocNo] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<InventoryTransaction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [records, setRecords] = useState<InventoryTransaction[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [productsRes, warehousesRes, txnRes] = await Promise.all([
        inventoryService.getProducts(),
        inventoryService.getWarehouses(),
        inventoryService.getTransactions({ type: "รับเข้า" }),
      ]);
      if (productsRes.status === "success") setProducts(productsRes.data);
      if (warehousesRes.status === "success") setWarehouses(warehousesRes.data);
      if (txnRes.status === "success") setRecords(txnRes.data);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "พร้อมผลิต": return "bg-green-500";
      case "ตำหนิ": return "bg-yellow-500";
      case "ชำรุด": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const unitPrice = parseFloat(price) || 0;
    return (qty * unitPrice).toFixed(2);
  };

  const selectedProductData = products.find(p => p.code === selectedProduct);
  const currentWarehouse = warehouses.find(w => w.code === selectedWarehouse);
  const availableLocations = currentWarehouse ? currentWarehouse.locations : warehouses.flatMap(w => w.locations);

  const handleSubmit = async () => {
    if (!selectedType) { toast.error("กรุณาเลือกประเภทการรับเข้า"); return; }
    if (!docNo) { toast.error("กรุณากรอกเลขที่เอกสารอ้างอิง"); return; }
    if (!selectedProductData) { toast.error("กรุณาเลือกสินค้า"); return; }
    if (!selectedWarehouse) { toast.error("กรุณาเลือกคลังปลายทาง"); return; }
    if (!selectedStatus) { toast.error("กรุณาเลือกสถานะสินค้า"); return; }
    if (!quantity || parseFloat(quantity) <= 0) { toast.error("กรุณากรอกจำนวนที่ถูกต้อง"); return; }
    if (parseFloat(quantity) > 500) { toast.warning("จำนวนมากกว่า 500 หน่วย ต้องรออนุมัติก่อนบันทึก"); return; }
    if (selectedStatus === "damaged" && !notes.includes("รูปภาพ")) {
      toast.error("สถานะชำรุดต้องแนบรูปภาพบังคับ");
      return;
    }

    setSubmitting(true);
    try {
      const res = await inventoryService.createTransaction({
        type: "รับเข้า",
        productId: selectedProductData.id,
        warehouseCode: selectedWarehouse,
        status: selectedStatus,
        quantity: parseFloat(quantity),
        refDoc: docNo,
        employeeName: user?.full_name,
        note: notes,
        receiveType: selectedType,
        price: parseFloat(price) || undefined,
        batchNo: batchNo || undefined,
        expireDate: expireDate ? format(expireDate, "yyyy-MM-dd") : undefined,
        supplier: supplier || undefined,
        locationId: selectedLocation ? Number(selectedLocation) : undefined,
      });
      if (res.status === "success") {
        toast.success("บันทึกรับเข้าสินค้าสำเร็จ");
        handleClear();
        fetchAll();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setSelectedType("");
    setDocNo("");
    setReceiveDate(new Date());
    setSelectedProduct("");
    setSelectedWarehouse("");
    setSelectedLocation("");
    setSelectedStatus("");
    setQuantity("");
    setPrice("");
    setBatchNo("");
    setExpireDate(undefined);
    setSupplier("");
    setNotes("");
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
        <h1 className="text-3xl font-bold text-foreground">รับเข้าสินค้า</h1>
        <p className="text-muted-foreground mt-2">
          บันทึกการรับสินค้าเข้าคลัง และสร้าง Transaction อัตโนมัติ
        </p>
      </div>

      {/* ฟอร์มรับเข้าสินค้า */}
      <Card>
        <CardHeader>
          <CardTitle>ฟอร์มรับเข้าสินค้า</CardTitle>
          <CardDescription>กรอกข้อมูลการรับเข้าสินค้าให้ครบถ้วน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ประเภทการรับเข้า */}
            <div className="space-y-2">
              <Label htmlFor="type">ประเภทการรับเข้า *</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* เลขที่เอกสาร */}
            <div className="space-y-2">
              <Label htmlFor="docNo">เลขที่เอกสารอ้างอิง *</Label>
              <Input
                id="docNo"
                value={docNo}
                onChange={(e) => setDocNo(e.target.value)}
                placeholder="RCV-2025-XXX"
              />
            </div>

            {/* วันที่รับเข้า */}
            <div className="space-y-2">
              <Label>วันที่รับเข้า *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !receiveDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {receiveDate ? format(receiveDate, "PPP", { locale: th }) : "เลือกวันที่"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={receiveDate}
                    onSelect={(date) => date && setReceiveDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* สินค้า */}
            <div className="space-y-2">
              <Label htmlFor="product">สินค้า *</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger id="product">
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

            {/* คลังปลายทาง */}
            <div className="space-y-2">
              <Label htmlFor="warehouse">คลังปลายทาง *</Label>
              <Select value={selectedWarehouse} onValueChange={(v) => { setSelectedWarehouse(v); setSelectedLocation(""); }}>
                <SelectTrigger id="warehouse">
                  <SelectValue placeholder="เลือกคลัง" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.code}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ตำแหน่งจัดเก็บสินค้า */}
            <div className="space-y-2">
              <Label htmlFor="location">ตำแหน่งจัดเก็บสินค้า (Location)</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger id="location">
                  <SelectValue placeholder="เลือกตำแหน่ง" />
                </SelectTrigger>
                <SelectContent>
                  {availableLocations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* สถานะสินค้า */}
            <div className="space-y-2">
              <Label htmlFor="status">สถานะสินค้า *</Label>
              <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as StockStatus)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* จำนวน */}
            <div className="space-y-2">
              <Label htmlFor="quantity">จำนวนที่รับเข้า *</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>

            {/* หน่วยนับ */}
            <div className="space-y-2">
              <Label htmlFor="unit">หน่วยนับ</Label>
              <Input
                id="unit"
                value={selectedProductData?.unit || ""}
                disabled
                className="bg-muted"
              />
            </div>

            {/* ราคาต่อหน่วย */}
            <div className="space-y-2">
              <Label htmlFor="price">ราคาต่อหน่วย (บาท)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* มูลค่ารวม */}
            <div className="space-y-2">
              <Label htmlFor="total">มูลค่ารวม (บาท)</Label>
              <Input
                id="total"
                value={calculateTotal()}
                disabled
                className="bg-muted font-semibold"
              />
            </div>

            {/* Batch/Lot No. */}
            <div className="space-y-2">
              <Label htmlFor="batchNo">Batch / Lot No.</Label>
              <Input
                id="batchNo"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                placeholder="BATCH-XXX"
              />
            </div>

            {/* วันหมดอายุ */}
            <div className="space-y-2">
              <Label>วันหมดอายุ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expireDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expireDate ? format(expireDate, "PPP", { locale: th }) : "เลือกวันที่"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={expireDate}
                    onSelect={setExpireDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* ผู้จัดส่ง/แหล่งที่มา */}
            <div className="space-y-2">
              <Label htmlFor="supplier">ผู้จัดส่ง / แหล่งที่มา</Label>
              <Input
                id="supplier"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="ชื่อซัพพลายเออร์"
              />
            </div>

            {/* ผู้รับเข้า */}
            <div className="space-y-2">
              <Label htmlFor="receiver">ผู้รับเข้า</Label>
              <Input
                id="receiver"
                value={user?.full_name || "ไม่ระบุชื่อ"}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          {/* หมายเหตุ */}
          <div className="space-y-2">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="บันทึกข้อมูลเพิ่มเติม..."
              rows={3}
            />
          </div>

          {/* แนบไฟล์ */}
          <div className="space-y-2">
            <Label htmlFor="file">แนบไฟล์ / รูปภาพ</Label>
            <div className="flex items-center gap-2">
              <Input id="file" type="file" multiple accept="image/*,.pdf" />
              <Button variant="outline" size="icon" type="button">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedStatus === "damaged" && "⚠️ สถานะชำรุดต้องแนบรูปภาพบังคับ"}
            </p>
          </div>

          {/* ปุ่มดำเนินการ */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSubmit} size="lg" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}บันทึกรับเข้า
            </Button>
            <Button variant="outline" onClick={handleClear} size="lg">
              ล้างฟอร์ม
            </Button>
          </div>

          {/* เงื่อนไขเตือน */}
          <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
            <p className="font-semibold">⚠️ เงื่อนไขการรับเข้า:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>รับเข้ามากกว่า 500 หน่วย → ต้องรออนุมัติ</li>
              <li>สถานะชำรุด → ต้องแนบรูปบังคับ</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* ตารางประวัติรับเข้า */}
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการรับเข้าสินค้า</CardTitle>
          <CardDescription>รายการรับเข้าล่าสุด</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>วันที่</TableHead>
                  <TableHead>เลขที่เอกสาร</TableHead>
                  <TableHead>สินค้า</TableHead>
                  <TableHead>คลัง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>ผู้รับ</TableHead>
                  <TableHead>หมายเหตุ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.date}</TableCell>
                    <TableCell>{record.refDoc}</TableCell>
                    <TableCell>{record.product}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{record.warehouse}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.statusTo)}>
                        {record.statusTo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {record.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell>{record.by}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {record.note}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedDetail(record)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">ยังไม่มีประวัติการรับเข้า</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog รายละเอียด */}
      <Dialog open={!!selectedDetail} onOpenChange={() => setSelectedDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดการรับเข้า</DialogTitle>
            <DialogDescription>เลขที่เอกสาร: {selectedDetail?.refDoc}</DialogDescription>
          </DialogHeader>
          {selectedDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">วันที่รับเข้า</Label>
                  <p className="font-medium">{selectedDetail.date}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ประเภท</Label>
                  <p className="font-medium">{typeOptions.find(t => t.value === selectedDetail.receiveType)?.label || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">สินค้า</Label>
                  <p className="font-medium">{selectedDetail.product}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">คลัง</Label>
                  <p className="font-medium">{selectedDetail.warehouse}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">สถานะ</Label>
                  <Badge className={getStatusColor(selectedDetail.statusTo)}>
                    {selectedDetail.statusTo}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">จำนวน</Label>
                  <p className="font-medium">{selectedDetail.quantity.toLocaleString()}</p>
                </div>
                {selectedDetail.price !== null && (
                  <div>
                    <Label className="text-muted-foreground">ราคาต่อหน่วย</Label>
                    <p className="font-medium">{selectedDetail.price.toLocaleString()} บาท</p>
                  </div>
                )}
                {selectedDetail.batchNo && (
                  <div>
                    <Label className="text-muted-foreground">Batch No.</Label>
                    <p className="font-medium">{selectedDetail.batchNo}</p>
                  </div>
                )}
                {selectedDetail.supplier && (
                  <div>
                    <Label className="text-muted-foreground">ผู้จัดส่ง</Label>
                    <p className="font-medium">{selectedDetail.supplier}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">ผู้รับเข้า</Label>
                  <p className="font-medium">{selectedDetail.by}</p>
                </div>
              </div>
              {selectedDetail.note && (
                <div>
                  <Label className="text-muted-foreground">หมายเหตุ</Label>
                  <p className="font-medium">{selectedDetail.note}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
