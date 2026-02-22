import { useState } from "react";
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
import { CalendarIcon, Upload, History, Trash2, Edit, Eye } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ReceiveRecord {
  id: string;
  date: string;
  docNo: string;
  product: string;
  warehouse: string;
  location?: string;
  status: string;
  quantity: number;
  unit: string;
  receiver: string;
  notes: string;
  type: string;
  price: number;
  batchNo?: string;
  expireDate?: string;
  supplier?: string;
}

export default function InventoryReceive() {
  const [receiveDate, setReceiveDate] = useState<Date>(new Date());
  const [expireDate, setExpireDate] = useState<Date>();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [docNo, setDocNo] = useState("");
  const [batchNo, setBatchNo] = useState("");
  const [supplier, setSupplier] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<ReceiveRecord | null>(null);

  // Mock data
  const products = [
    { id: "1", name: "บรรจุภัณฑ์กล่อง A4", unit: "กล่อง" },
    { id: "2", name: "กระดาษอาร์ตการ์ด 300 แกรม", unit: "รีม" },
    { id: "3", name: "หมึกพิมพ์ CMYK", unit: "ลิตร" },
    { id: "4", name: "ฟิล์มเคลือบ", unit: "ม้วน" },
    { id: "5", name: "กาวติดกล่อง", unit: "แกลลอน" },
  ];

  const warehouses = [
    { id: "TEG", name: "คลัง TEG" },
    { id: "LUCKY", name: "คลัง Lucky" },
  ];

  const locationOptions = [
    { id: "A1-1", name: "A1-ชั้น1" },
    { id: "A2-1", name: "A2-ชั้น1" },
    { id: "A1-2", name: "A1-ชั้น2" },
    { id: "A2-2", name: "A2-ชั้น2" },
    { id: "B1-1", name: "B1-ชั้น1" },
    { id: "B2-1", name: "B2-ชั้น1" },
    { id: "B1-2", name: "B1-ชั้น2" },
    { id: "B2-2", name: "B2-ชั้น2" },
  ];

  const statusOptions = [
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

  const [records, setRecords] = useState<ReceiveRecord[]>([
    {
      id: "1",
      date: "2025-01-15 14:30",
      docNo: "RCV-2025-001",
      product: "บรรจุภัณฑ์กล่อง A4",
      warehouse: "คลัง TEG",
      location: "A1-ชั้น1",
      status: "พร้อมผลิต",
      quantity: 500,
      unit: "กล่อง",
      receiver: "สมชาย ใจดี",
      notes: "รับเข้าจากฝ่ายผลิต",
      type: "จากฝ่ายผลิต",
      price: 15,
      batchNo: "BATCH-001",
      supplier: "ฝ่ายผลิต",
    },
    {
      id: "2",
      date: "2025-01-14 10:15",
      docNo: "RCV-2025-002",
      product: "กระดาษอาร์ตการ์ด 300 แกรม",
      warehouse: "คลัง Lucky",
      location: "B2-ชั้น2",
      status: "พร้อมผลิต",
      quantity: 200,
      unit: "รีม",
      receiver: "สมหญิง รักงาน",
      notes: "รับจากซัพพลายเออร์",
      type: "จากจัดซื้อ",
      price: 450,
      supplier: "บริษัท กระดาษไทย จำกัด",
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "พร้อมผลิต":
        return "bg-green-500";
      case "ตำหนิ":
        return "bg-yellow-500";
      case "ชำรุด":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const calculateTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const unitPrice = parseFloat(price) || 0;
    return (qty * unitPrice).toFixed(2);
  };

  const selectedProductData = products.find(p => p.id === selectedProduct);

  const handleSubmit = () => {
    // Validation
    if (!selectedType) {
      toast.error("กรุณาเลือกประเภทการรับเข้า");
      return;
    }
    if (!docNo) {
      toast.error("กรุณากรอกเลขที่เอกสารอ้างอิง");
      return;
    }
    if (!selectedProduct) {
      toast.error("กรุณาเลือกสินค้า");
      return;
    }
    if (!selectedWarehouse) {
      toast.error("กรุณาเลือกคลังปลายทาง");
      return;
    }
    if (!selectedStatus) {
      toast.error("กรุณาเลือกสถานะสินค้า");
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error("กรุณากรอกจำนวนที่ถูกต้อง");
      return;
    }

    // Check conditions
    if (parseFloat(quantity) > 500) {
      toast.warning("จำนวนมากกว่า 500 หน่วย ต้องรออนุมัติก่อนบันทึก");
      return;
    }

    if (selectedStatus === "damaged" && !notes.includes("รูปภาพ")) {
      toast.error("สถานะชำรุดต้องแนบรูปภาพบังคับ");
      return;
    }

    // Create new record
    const newRecord: ReceiveRecord = {
      id: (records.length + 1).toString(),
      date: format(receiveDate, "yyyy-MM-dd HH:mm", { locale: th }),
      docNo,
      product: selectedProductData?.name || "",
      warehouse: warehouses.find(w => w.id === selectedWarehouse)?.name || "",
      location: locationOptions.find(l => l.id === selectedLocation)?.name || "",
      status: statusOptions.find(s => s.value === selectedStatus)?.label || "",
      quantity: parseFloat(quantity),
      unit: selectedProductData?.unit || "",
      receiver: "ผู้ใช้งานปัจจุบัน",
      notes,
      type: typeOptions.find(t => t.value === selectedType)?.label || "",
      price: parseFloat(price) || 0,
      batchNo,
      supplier,
    };

    setRecords([newRecord, ...records]);
    toast.success("บันทึกรับเข้าสินค้าสำเร็จ");
    handleClear();
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
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* คลังปลายทาง */}
            <div className="space-y-2">
              <Label htmlFor="warehouse">คลังปลายทาง *</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger id="warehouse">
                  <SelectValue placeholder="เลือกคลัง" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
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
                  {locationOptions.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* สถานะสินค้า */}
            <div className="space-y-2">
              <Label htmlFor="status">สถานะสินค้า *</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
                value="ผู้ใช้งานปัจจุบัน"
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
              <Button variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedStatus === "damaged" && "⚠️ สถานะชำรุดต้องแนบรูปภาพบังคับ"}
            </p>
          </div>

          {/* ปุ่มดำเนินการ */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSubmit} size="lg">
              บันทึกรับเข้า
            </Button>
            <Button variant="outline" onClick={handleClear} size="lg">
              ล้างฟอร์ม
            </Button>
            <Button variant="secondary" size="lg">
              <History className="mr-2 h-4 w-4" />
              ดูประวัติรับเข้า
            </Button>
          </div>

          {/* เงื่อนไขเตือน */}
          <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
            <p className="font-semibold">⚠️ เงื่อนไขการรับเข้า:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>รับเข้ามากกว่า 500 หน่วย → ต้องรออนุมัติ</li>
              <li>สถานะชำรุด → ต้องแนบรูปบังคับ</li>
              <li>จากโอนคลัง → ดึงข้อมูลจาก TXN โอนอัตโนมัติ</li>
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
                  <TableHead>ตำแหน่ง</TableHead>
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
                    <TableCell>{record.docNo}</TableCell>
                    <TableCell>{record.product}</TableCell>
                    <TableCell>{record.warehouse}</TableCell>
                    <TableCell>
                      {record.location && (
                        <Badge variant="outline">{record.location}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {record.quantity.toLocaleString()} {record.unit}
                    </TableCell>
                    <TableCell>{record.receiver}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {record.notes}
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
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
            <DialogDescription>เลขที่เอกสาร: {selectedDetail?.docNo}</DialogDescription>
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
                  <p className="font-medium">{selectedDetail.type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">สินค้า</Label>
                  <p className="font-medium">{selectedDetail.product}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">คลัง</Label>
                  <p className="font-medium">{selectedDetail.warehouse}</p>
                </div>
                {selectedDetail.location && (
                  <div>
                    <Label className="text-muted-foreground">ตำแหน่งจัดเก็บ</Label>
                    <p className="font-medium">{selectedDetail.location}</p>
                  </div>
                )}
                <div>
                  <Label className="text-muted-foreground">สถานะ</Label>
                  <Badge className={getStatusColor(selectedDetail.status)}>
                    {selectedDetail.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">จำนวน</Label>
                  <p className="font-medium">
                    {selectedDetail.quantity.toLocaleString()} {selectedDetail.unit}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">ราคาต่อหน่วย</Label>
                  <p className="font-medium">{selectedDetail.price.toLocaleString()} บาท</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">มูลค่ารวม</Label>
                  <p className="font-medium">
                    {(selectedDetail.price * selectedDetail.quantity).toLocaleString()} บาท
                  </p>
                </div>
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
                  <p className="font-medium">{selectedDetail.receiver}</p>
                </div>
              </div>
              {selectedDetail.notes && (
                <div>
                  <Label className="text-muted-foreground">หมายเหตุ</Label>
                  <p className="font-medium">{selectedDetail.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
