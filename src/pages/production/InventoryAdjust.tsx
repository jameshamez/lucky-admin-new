import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileEdit, Package, PlayCircle, StopCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const mockProducts = [
  { code: "P001", name: "ถังขยะพลาสติก 120L", warehouse: "TEG", ready: 200, defective: 30, damaged: 20 },
  { code: "P002", name: "ถังขยะพลาสติก 240L", warehouse: "Lucky", ready: 150, defective: 20, damaged: 10 },
];

const mockStockCountSessions = [
  {
    id: "SC001",
    name: "นับสต็อกประจำเดือน ม.ค. 2568",
    warehouse: "TEG",
    status: "กำลังนับ",
    startDate: "2025-01-15 08:00",
    by: "สมชาย ใจดี",
    items: 15,
    counted: 8
  },
  {
    id: "SC002",
    name: "นับสต็อกสิ้นปี 2567",
    warehouse: "Lucky",
    status: "เสร็จสิ้น",
    startDate: "2024-12-31 08:00",
    endDate: "2024-12-31 16:30",
    by: "สมหญิง รักงาน",
    items: 25,
    counted: 25
  },
];

export default function InventoryAdjust() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [readyCount, setReadyCount] = useState("");
  const [defectiveCount, setDefectiveCount] = useState("");
  const [damagedCount, setDamagedCount] = useState("");
  const [reason, setReason] = useState("");

  const [sessionName, setSessionName] = useState("");
  const [sessionWarehouse, setSessionWarehouse] = useState("");

  const [selectedSession, setSelectedSession] = useState<typeof mockStockCountSessions[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const handleAdjust = () => {
    if (!selectedProduct || !warehouse) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "โปรดระบุสินค้าและคลัง",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "ปรับยอดสำเร็จ",
      description: "อัปเดตจำนวนสินค้าเรียบร้อยแล้ว",
    });

    // Reset
    setSelectedProduct("");
    setWarehouse("");
    setReadyCount("");
    setDefectiveCount("");
    setDamagedCount("");
    setReason("");
  };

  const handleStartSession = () => {
    if (!sessionName || !sessionWarehouse) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบ",
        description: "โปรดระบุชื่อรอบนับและคลัง",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "เปิดรอบนับสำเร็จ",
      description: `เริ่มนับสต็อกรอบ: ${sessionName}`,
    });

    setSessionName("");
    setSessionWarehouse("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ปรับยอด/นับสต็อก</h1>
        <p className="text-muted-foreground">ปรับปรุงจำนวนสินค้าให้ตรงกับความเป็นจริง</p>
      </div>

      <Tabs defaultValue="adjust" className="space-y-4">
        <TabsList>
          <TabsTrigger value="adjust">
            <FileEdit className="mr-2 h-4 w-4" />
            ปรับยอดด่วน
          </TabsTrigger>
          <TabsTrigger value="count">
            <Package className="mr-2 h-4 w-4" />
            รอบนับสต็อก
          </TabsTrigger>
        </TabsList>

        {/* Quick Adjust */}
        <TabsContent value="adjust" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ปรับยอดด่วน</CardTitle>
              <CardDescription>ปรับจำนวนสินค้าทันทีโดยระบุตัวเลขจริง</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
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
                  <Label>คลัง *</Label>
                  <Select value={warehouse} onValueChange={setWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกคลัง" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEG">TEG</SelectItem>
                      <SelectItem value="Lucky">Lucky</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedProduct && warehouse && (
                <Card className="bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg">ยอดปัจจุบัน</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">พร้อมผลิต</p>
                        <p className="text-2xl font-bold text-green-600">200</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ตำหนิ</p>
                        <p className="text-2xl font-bold text-yellow-600">30</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ชำรุด</p>
                        <p className="text-2xl font-bold text-red-600">20</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>จำนวนจริง (พร้อมผลิต)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={readyCount}
                    onChange={(e) => setReadyCount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>จำนวนจริง (ตำหนิ)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={defectiveCount}
                    onChange={(e) => setDefectiveCount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>จำนวนจริง (ชำรุด)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={damagedCount}
                    onChange={(e) => setDamagedCount(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>เหตุผลการปรับยอด *</Label>
                <Textarea
                  placeholder="ระบุเหตุผล เช่น สินค้าสูญหาย, นับผิดพลาด, สินค้าเสียหาย"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleAdjust} className="w-full" size="lg">
                <FileEdit className="mr-2 h-4 w-4" />
                ยืนยันการปรับยอด
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Count Sessions */}
        <TabsContent value="count" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>เปิดรอบนับสต็อกใหม่</CardTitle>
              <CardDescription>สร้างรอบนับสต็อกเพื่อตรวจนับทีละรายการ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>ชื่อรอบนับ *</Label>
                  <Input
                    placeholder="เช่น นับสต็อกประจำเดือน ก.พ. 2568"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>คลัง *</Label>
                  <Select value={sessionWarehouse} onValueChange={setSessionWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกคลัง" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEG">TEG</SelectItem>
                      <SelectItem value="Lucky">Lucky</SelectItem>
                      <SelectItem value="all">ทุกคลัง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleStartSession} className="w-full">
                <PlayCircle className="mr-2 h-4 w-4" />
                เริ่มรอบนับ
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>รอบนับทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่</TableHead>
                    <TableHead>ชื่อรอบนับ</TableHead>
                    <TableHead>คลัง</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>เริ่มเมื่อ</TableHead>
                    <TableHead>ผู้นับ</TableHead>
                    <TableHead>ความคืบหน้า</TableHead>
                    <TableHead>จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockStockCountSessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.id}</TableCell>
                      <TableCell>{session.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.warehouse}</Badge>
                      </TableCell>
                      <TableCell>
                        {session.status === "กำลังนับ" ? (
                          <Badge className="bg-blue-500">กำลังนับ</Badge>
                        ) : (
                          <Badge className="bg-green-500">เสร็จสิ้น</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{session.startDate}</TableCell>
                      <TableCell className="text-sm">{session.by}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm">
                            {session.counted}/{session.items}
                          </div>
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${(session.counted / session.items) * 100}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {session.status === "กำลังนับ" ? (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedSession(session);
                              setShowDetailDialog(true);
                            }}
                          >
                            <StopCircle className="mr-2 h-4 w-4" />
                            ดูรายละเอียด
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setSelectedSession(session);
                              setShowReportDialog(true);
                            }}
                          >
                            ดูรายงาน
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog for Session Details */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดรอบนับสต็อก</DialogTitle>
            <DialogDescription>
              {selectedSession?.name} - {selectedSession?.warehouse}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">เริ่มนับเมื่อ</p>
                <p className="font-medium">{selectedSession?.startDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ผู้นับ</p>
                <p className="font-medium">{selectedSession?.by}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ความคืบหน้า</p>
                <p className="font-medium">{selectedSession?.counted} / {selectedSession?.items} รายการ</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">สถานะ</p>
                <Badge className="bg-blue-500">{selectedSession?.status}</Badge>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">รายการสินค้าที่กำลังนับ</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รหัส</TableHead>
                      <TableHead>ชื่อสินค้า</TableHead>
                      <TableHead>สถานะการนับ</TableHead>
                      <TableHead>ยอดในระบบ</TableHead>
                      <TableHead>ยอดนับได้</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProducts.map((product, idx) => (
                      <TableRow key={product.code}>
                        <TableCell className="font-medium">{product.code}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>
                          {idx < (selectedSession?.counted || 0) ? (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              นับแล้ว
                            </Badge>
                          ) : (
                            <Badge variant="outline">รอนับ</Badge>
                          )}
                        </TableCell>
                        <TableCell>{product.ready + product.defective + product.damaged}</TableCell>
                        <TableCell>
                          {idx < (selectedSession?.counted || 0) ? 
                            product.ready + product.defective + product.damaged + (Math.random() > 0.5 ? 5 : -3) : 
                            "-"
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                ปิด
              </Button>
              <Button onClick={() => {
                toast({
                  title: "บันทึกความคืบหน้า",
                  description: "บันทึกข้อมูลการนับเรียบร้อยแล้ว",
                });
                setShowDetailDialog(false);
              }}>
                บันทึก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog for Session Report */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>รายงานผลการนับสต็อก</DialogTitle>
            <DialogDescription>
              {selectedSession?.name} - {selectedSession?.warehouse}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">เริ่มนับเมื่อ</p>
                <p className="font-medium">{selectedSession?.startDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เสร็จสิ้นเมื่อ</p>
                <p className="font-medium">{selectedSession?.endDate || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ผู้นับ</p>
                <p className="font-medium">{selectedSession?.by}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">สถานะ</p>
                <Badge className="bg-green-500">{selectedSession?.status}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">รายการทั้งหมด</p>
                    <p className="text-3xl font-bold">{selectedSession?.items}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">ตรงกัน</p>
                    <p className="text-3xl font-bold text-green-600">
                      {Math.floor((selectedSession?.items || 0) * 0.8)}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">ต่างกัน</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {Math.ceil((selectedSession?.items || 0) * 0.2)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">รายการที่มีส่วนต่าง</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รหัส</TableHead>
                      <TableHead>ชื่อสินค้า</TableHead>
                      <TableHead>ยอดในระบบ</TableHead>
                      <TableHead>ยอดนับได้</TableHead>
                      <TableHead>ส่วนต่าง</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProducts.slice(0, 2).map((product) => {
                      const systemStock = product.ready + product.defective + product.damaged;
                      const countedStock = systemStock + (Math.random() > 0.5 ? 5 : -3);
                      const diff = countedStock - systemStock;
                      return (
                        <TableRow key={product.code}>
                          <TableCell className="font-medium">{product.code}</TableCell>
                          <TableCell>{product.name}</TableCell>
                          <TableCell>{systemStock}</TableCell>
                          <TableCell>{countedStock}</TableCell>
                          <TableCell>
                            <span className={diff > 0 ? "text-green-600" : "text-red-600"}>
                              {diff > 0 ? "+" : ""}{diff}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                ปิด
              </Button>
              <Button onClick={() => {
                toast({
                  title: "ส่งออกรายงาน",
                  description: "กำลังดาวน์โหลดรายงาน PDF...",
                });
              }}>
                ส่งออก PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
