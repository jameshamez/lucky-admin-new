import { useState, useEffect } from "react";
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
import { FileEdit, Package, PlayCircle, StopCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { inventoryService, InventoryProduct, StockRow, Warehouse, StockCountSession, StockCountItem } from "@/services/inventoryService";
import { useAuth } from "@/contexts/AuthContext";

export default function InventoryAdjust() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [sessions, setSessions] = useState<StockCountSession[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [productsRes, stockRes, warehousesRes, sessionsRes] = await Promise.all([
        inventoryService.getProducts(),
        inventoryService.getStock(),
        inventoryService.getWarehouses(),
        inventoryService.getStockCountSessions(),
      ]);
      if (productsRes.status === "success") setProducts(productsRes.data);
      if (stockRes.status === "success") setStock(stockRes.data);
      if (warehousesRes.status === "success") setWarehouses(warehousesRes.data);
      if (sessionsRes.status === "success") setSessions(sessionsRes.data);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // --- Quick Adjust ---
  const [selectedProduct, setSelectedProduct] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [readyCount, setReadyCount] = useState("");
  const [defectiveCount, setDefectiveCount] = useState("");
  const [damagedCount, setDamagedCount] = useState("");
  const [reason, setReason] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const currentStockRow = stock.find(s => s.code === selectedProduct && s.warehouse === warehouse);

  const handleAdjust = async () => {
    if (!selectedProduct || !warehouse) {
      toast.error("โปรดระบุสินค้าและคลัง");
      return;
    }
    if (!reason.trim()) {
      toast.error("โปรดระบุเหตุผลการปรับยอด");
      return;
    }
    const product = products.find(p => p.code === selectedProduct);
    if (!product) return;

    setAdjustSubmitting(true);
    try {
      const res = await inventoryService.createTransaction({
        type: "ปรับยอด",
        productId: product.id,
        warehouseCode: warehouse,
        readyQty: Number(readyCount || 0),
        defectiveQty: Number(defectiveCount || 0),
        damagedQty: Number(damagedCount || 0),
        note: reason,
        employeeName: user?.full_name,
      });
      if (res.status === "success") {
        toast.success("อัปเดตจำนวนสินค้าเรียบร้อยแล้ว");
        setSelectedProduct(""); setWarehouse(""); setReadyCount(""); setDefectiveCount(""); setDamagedCount(""); setReason("");
        fetchAll();
      } else {
        toast.error(res.message || "ปรับยอดไม่สำเร็จ");
      }
    } finally {
      setAdjustSubmitting(false);
    }
  };

  // --- Stock Count Sessions ---
  const [sessionName, setSessionName] = useState("");
  const [sessionWarehouse, setSessionWarehouse] = useState("");
  const [startingSession, setStartingSession] = useState(false);

  const handleStartSession = async () => {
    if (!sessionName || !sessionWarehouse) {
      toast.error("โปรดระบุชื่อรอบนับและคลัง");
      return;
    }
    setStartingSession(true);
    try {
      const res = await inventoryService.createStockCountSession({
        name: sessionName,
        warehouseCode: sessionWarehouse,
        startedBy: user?.full_name,
      });
      if (res.status === "success") {
        toast.success(`เริ่มนับสต็อกรอบ: ${sessionName}`);
        setSessionName(""); setSessionWarehouse("");
        fetchAll();
      } else {
        toast.error(res.message || "เปิดรอบนับไม่สำเร็จ");
      }
    } finally {
      setStartingSession(false);
    }
  };

  const [selectedSession, setSelectedSession] = useState<StockCountSession | null>(null);
  const [sessionItems, setSessionItems] = useState<StockCountItem[]>([]);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [loadingSessionDetail, setLoadingSessionDetail] = useState(false);
  const [savingCount, setSavingCount] = useState(false);
  const [completingSession, setCompletingSession] = useState(false);

  const openSessionDetail = async (session: StockCountSession, mode: "detail" | "report") => {
    setSelectedSession(session);
    setLoadingSessionDetail(true);
    if (mode === "detail") setShowDetailDialog(true); else setShowReportDialog(true);
    try {
      const res = await inventoryService.getStockCountSession(session.id);
      if (res.status === "success") setSessionItems(res.data.items);
    } finally {
      setLoadingSessionDetail(false);
    }
  };

  const updateCountedQty = (productId: number, value: string) => {
    setSessionItems(prev => prev.map(item => item.productId === productId ? { ...item, countedQty: value === "" ? null : Number(value) } : item));
  };

  const handleSaveCount = async () => {
    if (!selectedSession) return;
    setSavingCount(true);
    try {
      const items = sessionItems.filter(i => i.countedQty !== null).map(i => ({ productId: i.productId, countedQty: i.countedQty as number }));
      const res = await inventoryService.saveStockCount(selectedSession.id, items);
      if (res.status === "success") {
        toast.success("บันทึกข้อมูลการนับเรียบร้อยแล้ว");
        setShowDetailDialog(false);
        fetchAll();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSavingCount(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!selectedSession) return;
    setCompletingSession(true);
    try {
      const res = await inventoryService.completeStockCount(selectedSession.id);
      if (res.status === "success") {
        toast.success("ปิดรอบนับสต็อกและปรับยอดเรียบร้อยแล้ว");
        setShowDetailDialog(false);
        fetchAll();
      } else {
        toast.error(res.message || "ปิดรอบนับไม่สำเร็จ");
      }
    } finally {
      setCompletingSession(false);
    }
  };

  const matchedCount = sessionItems.filter(i => i.countedQty !== null && i.countedQty === i.systemQty).length;
  const diffItems = sessionItems.filter(i => i.countedQty !== null && i.countedQty !== i.systemQty);

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
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.code}>
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
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.code}>{w.name}</SelectItem>
                      ))}
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
                        <p className="text-2xl font-bold text-green-600">{currentStockRow?.ready ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ตำหนิ</p>
                        <p className="text-2xl font-bold text-yellow-600">{currentStockRow?.defective ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ชำรุด</p>
                        <p className="text-2xl font-bold text-red-600">{currentStockRow?.damaged ?? 0}</p>
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

              <Button onClick={handleAdjust} className="w-full" size="lg" disabled={adjustSubmitting}>
                {adjustSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileEdit className="mr-2 h-4 w-4" />}
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
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.code}>{w.name}</SelectItem>
                      ))}
                      <SelectItem value="all">ทุกคลัง</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleStartSession} className="w-full" disabled={startingSession}>
                {startingSession ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
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
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">SC{String(session.id).padStart(3, "0")}</TableCell>
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
                      <TableCell className="text-sm">{session.startedBy}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="text-sm">
                            {session.counted}/{session.items}
                          </div>
                          <div className="w-20 bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${session.items > 0 ? (session.counted / session.items) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {session.status === "กำลังนับ" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openSessionDetail(session, "detail")}
                          >
                            <StopCircle className="mr-2 h-4 w-4" />
                            ดูรายละเอียด
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openSessionDetail(session, "report")}
                          >
                            ดูรายงาน
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {sessions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">ยังไม่มีรอบนับสต็อก</TableCell>
                    </TableRow>
                  )}
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
                <p className="font-medium">{selectedSession?.startedBy}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ความคืบหน้า</p>
                <p className="font-medium">{sessionItems.filter(i => i.countedQty !== null).length} / {sessionItems.length} รายการ</p>
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
                {loadingSessionDetail ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : (
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
                      {sessionItems.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium">{item.code}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            {item.countedQty !== null ? (
                              <Badge className="bg-green-500">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                นับแล้ว
                              </Badge>
                            ) : (
                              <Badge variant="outline">รอนับ</Badge>
                            )}
                          </TableCell>
                          <TableCell>{item.systemQty}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              className="w-24"
                              value={item.countedQty ?? ""}
                              onChange={(e) => updateCountedQty(item.productId, e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
                ปิด
              </Button>
              <Button onClick={handleSaveCount} disabled={savingCount}>
                {savingCount ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}บันทึก
              </Button>
              <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleCompleteSession} disabled={completingSession}>
                {completingSession ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}เสร็จสิ้นการนับ
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
                <p className="font-medium">{selectedSession?.startedBy}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">สถานะ</p>
                <Badge className="bg-green-500">{selectedSession?.status}</Badge>
              </div>
            </div>

            {loadingSessionDetail ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">รายการทั้งหมด</p>
                        <p className="text-3xl font-bold">{sessionItems.length}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">ตรงกัน</p>
                        <p className="text-3xl font-bold text-green-600">{matchedCount}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">ต่างกัน</p>
                        <p className="text-3xl font-bold text-orange-600">{diffItems.length}</p>
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
                        {diffItems.map((item) => {
                          const diff = (item.countedQty as number) - item.systemQty;
                          return (
                            <TableRow key={item.productId}>
                              <TableCell className="font-medium">{item.code}</TableCell>
                              <TableCell>{item.name}</TableCell>
                              <TableCell>{item.systemQty}</TableCell>
                              <TableCell>{item.countedQty}</TableCell>
                              <TableCell>
                                <span className={diff > 0 ? "text-green-600" : "text-red-600"}>
                                  {diff > 0 ? "+" : ""}{diff}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {diffItems.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-6">ไม่มีส่วนต่าง</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                ปิด
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
