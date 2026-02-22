import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockProducts = [
  { code: "P001", name: "ถังขยะพลาสติก 120L", unit: "ชิ้น" },
  { code: "P002", name: "ถังขยะพลาสติก 240L", unit: "ชิ้น" },
  { code: "P003", name: "ถังขยะสแตนเลส 80L", unit: "ชิ้น" },
];

const mockTransferHistory = [
  {
    id: "T001",
    date: "2025-01-15 14:30",
    product: "ถังขยะพลาสติก 120L",
    quantity: 50,
    from: "TEG",
    to: "Lucky",
    status: "พร้อมผลิต",
    by: "สมชาย ใจดี",
    note: "โอนไปสาขา Lucky ตามคำสั่งซื้อ"
  },
  {
    id: "T002",
    date: "2025-01-14 10:15",
    product: "ถังขยะพลาสติก 240L",
    quantity: 30,
    from: "Lucky",
    to: "TEG",
    status: "พร้อมผลิต",
    by: "สมหญิง รักงาน",
    note: "โอนคืนสต็อกส่วนเกิน"
  },
];

export default function InventoryTransfer() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [status, setStatus] = useState("ready");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    if (!selectedProduct || !quantity || !fromWarehouse || !toWarehouse) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "โปรดระบุสินค้า จำนวน และคลังต้นทาง-ปลายทาง",
        variant: "destructive"
      });
      return;
    }

    if (fromWarehouse === toWarehouse) {
      toast({
        title: "ไม่สามารถโอนได้",
        description: "คลังต้นทางและปลายทางต้องไม่เหมือนกัน",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "โอนย้ายสำเร็จ",
      description: `โอน ${quantity} หน่วย จาก ${fromWarehouse} ไป ${toWarehouse} เรียบร้อยแล้ว`,
    });

    // Reset form
    setSelectedProduct("");
    setQuantity("");
    setFromWarehouse("");
    setToWarehouse("");
    setStatus("ready");
    setNote("");
  };

  const getStatusBadge = (status: string) => {
    if (status === "พร้อมผลิต") return <Badge className="bg-green-500">พร้อมผลิต</Badge>;
    if (status === "ตำหนิ") return <Badge className="bg-yellow-500">ตำหนิ</Badge>;
    if (status === "ชำรุด") return <Badge className="bg-red-500">ชำรุด</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">โอนย้ายคลัง</h1>
        <p className="text-muted-foreground">โอนสินค้าระหว่างคลัง TEG และ Lucky</p>
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
                  {mockProducts.map((product) => (
                    <SelectItem key={product.code} value={product.code}>
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
                  <SelectItem value="TEG">TEG</SelectItem>
                  <SelectItem value="Lucky">Lucky</SelectItem>
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
                  <SelectItem value="TEG">TEG</SelectItem>
                  <SelectItem value="Lucky">Lucky</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>สถานะสินค้า</Label>
            <Select value={status} onValueChange={setStatus}>
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

          <Button onClick={handleSubmit} className="w-full" size="lg">
            <ArrowRight className="mr-2 h-4 w-4" />
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
              {mockTransferHistory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.id}</TableCell>
                  <TableCell className="text-sm">{item.date}</TableCell>
                  <TableCell>{item.product}</TableCell>
                  <TableCell className="font-semibold">{item.quantity}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.from}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.to}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-sm">{item.by}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
