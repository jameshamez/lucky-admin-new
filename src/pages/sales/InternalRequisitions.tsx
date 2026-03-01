import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Package, ClipboardList, Car, Plus, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { th } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const API_BASE = "https://finfinphone.com/api-lucky/admin";

interface MaterialRequest {
  id: number;
  request_date: string;
  material_id: number;
  material_name: string;
  qty: number;
  requester: string;
  remark: string;
  status: string;
  created_at: string;
}

interface Material {
  id: number;
  material_name: string;
  unit: string;
  current_qty: number;
  min_qty: number;
  note: string;
}

interface VehicleReservation {
  id: number;
  vehicle_type: string;
  purpose: string;
  start_datetime: string;
  end_datetime: string;
  requester: string;
  status: string;
  created_at: string;
}

export default function InternalRequisitions() {
  const [materialDate, setMaterialDate] = useState<Date>();
  const [pickupDate, setPickupDate] = useState<Date>();
  const [vehicleStartDate, setVehicleStartDate] = useState<Date>();
  const [vehicleEndDate, setVehicleEndDate] = useState<Date>();
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);

  const [vehicleType, setVehicleType] = useState("");
  const [vehiclePurpose, setVehiclePurpose] = useState("");
  const [vehicleStartTime, setVehicleStartTime] = useState("");
  const [vehicleEndTime, setVehicleEndTime] = useState("");
  const [vehicleRequester, setVehicleRequester] = useState("ผู้ใช้งานปัจจุบัน");
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const [vehicleHistory, setVehicleHistory] = useState<VehicleReservation[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);

  // --- Purchase requests state ---
  const [purchaseHistory, setPurchaseHistory] = useState<MaterialRequest[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(true);
  const [purchaseError, setPurchaseError] = useState("");

  // --- Materials (for dropdown) ---
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);

  // --- Purchase form state ---
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [purchaseSubmitting, setPurchaseSubmitting] = useState(false);
  const [purchaseName, setPurchaseName] = useState("");
  const [purchaseQty, setPurchaseQty] = useState("");
  const [purchaseReason, setPurchaseReason] = useState("");
  const [purchaseBudget, setPurchaseBudget] = useState("");

  // --- Usage (eqiupment draw) form state ---
  const [isUsageDialogOpen, setIsUsageDialogOpen] = useState(false);
  const [usageSubmitting, setUsageSubmitting] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [usageQty, setUsageQty] = useState("");
  const [usageDepartment, setUsageDepartment] = useState("");
  const [usageRequester] = useState("ผู้ใช้งานปัจจุบัน");
  const [usageReason, setUsageReason] = useState("");

  // --- Fetch purchase history ---
  const fetchPurchaseHistory = async () => {
    setPurchaseLoading(true);
    setPurchaseError("");
    try {
      const res = await fetch(`${API_BASE}/material_requests.php?limit=50`);
      const json = await res.json();
      if (json.status === "success") {
        setPurchaseHistory(json.data || []);
      } else {
        setPurchaseError("ไม่สามารถโหลดประวัติคำขอได้");
      }
    } catch {
      setPurchaseError("เชื่อมต่อ API ไม่ได้");
    } finally {
      setPurchaseLoading(false);
    }
  };

  // --- Fetch materials list ---
  const fetchMaterials = async () => {
    setMaterialsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/materials.php?limit=100`);
      const json = await res.json();
      if (json.status === "success") {
        setMaterials(json.data || []);
      }
    } catch {
      // silently fail
    } finally {
      setMaterialsLoading(false);
    }
  };

  // --- Fetch vehicle history ---
  const fetchVehicleHistory = async () => {
    setVehicleLoading(true);
    try {
      const res = await fetch(`${API_BASE}/vehicle_reservations.php`);
      const json = await res.json();
      if (json.status === "success") {
        setVehicleHistory(json.data || []);
      }
    } catch {
      // silently fail
    } finally {
      setVehicleLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseHistory();
    fetchMaterials();
    fetchVehicleHistory();
  }, []);

  // --- Submit purchase request (เบิกซื้อ) ---
  const handleSubmitPurchase = async () => {
    if (!purchaseName.trim() || !purchaseQty || !materialDate) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบ", description: "ชื่อ, จำนวน, วันที่ต้องการ", variant: "destructive" });
      return;
    }
    setPurchaseSubmitting(true);
    try {
      const payload = {
        request_date: format(materialDate, "yyyy-MM-dd"),
        material_name: purchaseName.trim(),
        qty: parseInt(purchaseQty),
        requester: "ผู้ใช้งานปัจจุบัน",
        remark: `${purchaseReason}${purchaseBudget ? ` | งบ: ${purchaseBudget} บาท` : ""}`,
      };
      const res = await fetch(`${API_BASE}/material_requests.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.status === "success") {
        toast({ title: "ส่งคำขอเบิกซื้อสำเร็จ", description: `คำขอ "${purchaseName}" ถูกบันทึกแล้ว` });
        setIsPurchaseDialogOpen(false);
        setPurchaseName(""); setPurchaseQty(""); setPurchaseReason(""); setPurchaseBudget(""); setMaterialDate(undefined);
        fetchPurchaseHistory();
      } else {
        toast({ title: "เกิดข้อผิดพลาด", description: json.message || "ไม่สามารถส่งคำขอได้", variant: "destructive" });
      }
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", description: "เชื่อมต่อ API ไม่ได้", variant: "destructive" });
    } finally {
      setPurchaseSubmitting(false);
    }
  };

  // --- Submit usage request (เบิกใช้จาก stock) ---
  const handleSubmitUsage = async () => {
    if (!selectedMaterial || !usageQty || !usageDepartment) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบ", description: "สินค้า, จำนวน, แผนก", variant: "destructive" });
      return;
    }
    setUsageSubmitting(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const payload = {
        request_date: today,
        material_name: selectedMaterial,
        qty: parseInt(usageQty),
        requester: usageRequester,
        remark: `แผนก: ${usageDepartment}${usageReason ? ` | ${usageReason}` : ""}`,
      };
      const res = await fetch(`${API_BASE}/material_requests.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.status === "success") {
        const remaining = json.data?.remainingQty;
        toast({
          title: "เบิกใช้อุปกรณ์สำเร็จ",
          description: `เบิก "${selectedMaterial}" จำนวน ${usageQty} ชิ้น${remaining !== undefined ? ` | คงเหลือ: ${remaining}` : ""}`,
        });
        setIsUsageDialogOpen(false);
        setSelectedMaterial(""); setUsageQty(""); setUsageDepartment(""); setUsageReason("");
        fetchPurchaseHistory();
        fetchMaterials(); // refresh stock
      } else {
        toast({ title: "เกิดข้อผิดพลาด", description: json.message || "ไม่สามารถเบิกได้", variant: "destructive" });
      }
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", description: "เชื่อมต่อ API ไม่ได้", variant: "destructive" });
    } finally {
      setUsageSubmitting(false);
    }
  };

  // --- Submit vehicle reservation ---
  const handleSubmitVehicle = async () => {
    if (!vehicleType || !vehiclePurpose || !vehicleStartDate || !vehicleStartTime || !vehicleEndDate || !vehicleEndTime || !vehicleRequester) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบ", description: "ประเภทรถ, วัตถุประสงค์, วันที่และเวลา", variant: "destructive" });
      return;
    }
    setVehicleSubmitting(true);
    try {
      const startDateTime = `${format(vehicleStartDate, "yyyy-MM-dd")} ${vehicleStartTime}:00`;
      const endDateTime = `${format(vehicleEndDate, "yyyy-MM-dd")} ${vehicleEndTime}:00`;

      const payload = {
        vehicle_type: vehicleType,
        purpose: vehiclePurpose,
        start_datetime: startDateTime,
        end_datetime: endDateTime,
        requester: vehicleRequester,
      };

      const res = await fetch(`${API_BASE}/vehicle_reservations.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.status === "success") {
        toast({ title: "ส่งคำขอจองรถสำเร็จ", description: "คำขอจองรถถูกบันทึกแล้ว รอการอนุมัติ" });
        setIsVehicleDialogOpen(false);
        setVehicleType(""); setVehiclePurpose("");
        setVehicleStartDate(undefined); setVehicleStartTime("");
        setVehicleEndDate(undefined); setVehicleEndTime("");
        fetchVehicleHistory();
      } else {
        toast({ title: "เกิดข้อผิดพลาด", description: json.message || "ไม่สามารถส่งคำขอได้", variant: "destructive" });
      }
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", description: "เชื่อมต่อ API ไม่ได้", variant: "destructive" });
    } finally {
      setVehicleSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "อนุมัติแล้ว": return "bg-green-500";
      case "รออนุมัติ": return "bg-yellow-500";
      case "บันทึกแล้ว": return "bg-blue-500";
      case "ปฏิเสธ": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  // Split: purchase history vs usage history
  // Both come from material_requests — distinguish by remark containing "แผนก:"
  const usageHistory = purchaseHistory.filter(r => r.remark?.includes("แผนก:"));
  const purchaseOnlyHistory = purchaseHistory.filter(r => !r.remark?.includes("แผนก:"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">เบิกการใช้งาน</h1>
        <p className="text-muted-foreground">จัดการคำขอเบิกซื้อ เบิกใช้ และจองรถส่วนกลาง</p>
      </div>

      <Tabs defaultValue="purchase" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="purchase" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            เบิกซื้อวัสดุอุปกรณ์
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            เบิกใช้อุปกรณ์
          </TabsTrigger>
          <TabsTrigger value="vehicle" className="flex items-center gap-2">
            <Car className="w-4 h-4" />
            จองรถส่วนกลาง
          </TabsTrigger>
        </TabsList>

        {/* ===== Tab: เบิกซื้อวัสดุอุปกรณ์ ===== */}
        <TabsContent value="purchase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>เบิกซื้อวัสดุอุปกรณ์</CardTitle>
              <CardDescription>สร้างคำขอให้ฝ่ายจัดซื้อดำเนินการซื้อวัสดุหรืออุปกรณ์</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    สร้างคำขอเบิกซื้อใหม่
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>สร้างคำขอเบิกซื้อวัสดุอุปกรณ์</DialogTitle>
                    <DialogDescription>กรอกรายละเอียดสำหรับการเบิกซื้อวัสดุหรืออุปกรณ์</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="material-name">ชื่ออุปกรณ์/วัสดุ *</Label>
                      <Input
                        id="material-name"
                        placeholder="กรอกชื่ออุปกรณ์หรือวัสดุ"
                        value={purchaseName}
                        onChange={e => setPurchaseName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-quantity">จำนวนที่ต้องการ *</Label>
                      <Input
                        id="material-quantity"
                        type="number"
                        placeholder="กรอกจำนวน"
                        value={purchaseQty}
                        onChange={e => setPurchaseQty(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-reason">เหตุผลในการเบิก</Label>
                      <Textarea
                        id="material-reason"
                        placeholder="กรอกเหตุผลในการเบิก"
                        rows={3}
                        value={purchaseReason}
                        onChange={e => setPurchaseReason(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-budget">งบประมาณโดยประมาณ</Label>
                      <Input
                        id="material-budget"
                        type="number"
                        placeholder="กรอกงบประมาณ (บาท)"
                        value={purchaseBudget}
                        onChange={e => setPurchaseBudget(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>วันที่ต้องการใช้งาน *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal", !materialDate && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {materialDate ? format(materialDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={materialDate} onSelect={setMaterialDate} initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button className="w-full" onClick={handleSubmitPurchase} disabled={purchaseSubmitting}>
                      {purchaseSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังส่ง...</> : "ส่งคำขอเบิกซื้อ"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">ประวัติคำขอเบิกซื้อ</h3>
                  <Button variant="ghost" size="sm" onClick={fetchPurchaseHistory} disabled={purchaseLoading}>
                    <RefreshCw className={cn("w-4 h-4 mr-1", purchaseLoading && "animate-spin")} />
                    รีเฟรช
                  </Button>
                </div>

                {purchaseLoading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> กำลังโหลด...
                  </div>
                ) : purchaseError ? (
                  <div className="flex items-center gap-2 text-destructive py-4">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{purchaseError}</span>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>รายการ</TableHead>
                          <TableHead>จำนวน</TableHead>
                          <TableHead>วันที่ขอ</TableHead>
                          <TableHead>ผู้ขอ</TableHead>
                          <TableHead>หมายเหตุ</TableHead>
                          <TableHead>สถานะ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseOnlyHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                              ยังไม่มีประวัติคำขอเบิกซื้อ
                            </TableCell>
                          </TableRow>
                        ) : (
                          purchaseOnlyHistory.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.material_name}</TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell>{item.request_date}</TableCell>
                              <TableCell>{item.requester}</TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{item.remark || "-"}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Tab: เบิกใช้อุปกรณ์ ===== */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>เบิกใช้อุปกรณ์</CardTitle>
              <CardDescription>เบิกใช้สต็อกวัสดุสำนักงานหรืออุปกรณ์ที่มีอยู่แล้วในคลัง</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isUsageDialogOpen} onOpenChange={setIsUsageDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    สร้างคำขอเบิกใช้ใหม่
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>สร้างคำขอเบิกใช้อุปกรณ์</DialogTitle>
                    <DialogDescription>กรอกรายละเอียดสำหรับการเบิกใช้สต็อกวัสดุหรืออุปกรณ์</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="usage-item">รายการสินค้า * {materialsLoading && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}</Label>
                      <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                        <SelectTrigger id="usage-item">
                          <SelectValue placeholder="เลือกรายการสินค้า" />
                        </SelectTrigger>
                        <SelectContent>
                          {materials.length === 0 ? (
                            <SelectItem value="__none" disabled>ไม่มีรายการ</SelectItem>
                          ) : (
                            materials.map(m => (
                              <SelectItem key={m.id} value={m.material_name}>
                                {m.material_name} (คงเหลือ: {m.current_qty} {m.unit})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage-quantity">จำนวนที่ต้องการ *</Label>
                      <Input
                        id="usage-quantity"
                        type="number"
                        placeholder="กรอกจำนวน"
                        value={usageQty}
                        onChange={e => setUsageQty(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage-department">แผนกผู้เบิก *</Label>
                      <Select value={usageDepartment} onValueChange={setUsageDepartment}>
                        <SelectTrigger id="usage-department">
                          <SelectValue placeholder="เลือกแผนก" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ขาย">ฝ่ายขาย</SelectItem>
                          {/* <SelectItem value="กราฟิก">กราฟิก</SelectItem>
                          <SelectItem value="จัดซื้อ">จัดซื้อ</SelectItem>
                          <SelectItem value="ผลิตและจัดส่ง">ผลิตและจัดส่ง</SelectItem>
                          <SelectItem value="บัญชี">บัญชี</SelectItem>
                          <SelectItem value="บุคคล">บุคคล</SelectItem> */}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage-requester">ผู้เบิก *</Label>
                      <Input id="usage-requester" value={usageRequester} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage-reason">เหตุผลในการเบิก</Label>
                      <Textarea
                        id="usage-reason"
                        placeholder="กรอกเหตุผลในการเบิก"
                        rows={3}
                        value={usageReason}
                        onChange={e => setUsageReason(e.target.value)}
                      />
                    </div>
                    <Button className="w-full" onClick={handleSubmitUsage} disabled={usageSubmitting}>
                      {usageSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังส่ง...</> : "ส่งคำขอเบิกใช้"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">ประวัติการเบิกใช้</h3>
                  <Button variant="ghost" size="sm" onClick={fetchPurchaseHistory} disabled={purchaseLoading}>
                    <RefreshCw className={cn("w-4 h-4 mr-1", purchaseLoading && "animate-spin")} />
                    รีเฟรช
                  </Button>
                </div>

                {purchaseLoading ? (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" /> กำลังโหลด...
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>รายการ</TableHead>
                          <TableHead>จำนวน</TableHead>
                          <TableHead>แผนก</TableHead>
                          <TableHead>ผู้เบิก</TableHead>
                          <TableHead>วันที่</TableHead>
                          <TableHead>สถานะ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usageHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                              ยังไม่มีประวัติการเบิกใช้
                            </TableCell>
                          </TableRow>
                        ) : (
                          usageHistory.map((item) => {
                            const dept = item.remark?.match(/แผนก:\s*([^|]+)/)?.[1]?.trim() || "-";
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.material_name}</TableCell>
                                <TableCell>{item.qty}</TableCell>
                                <TableCell>{dept}</TableCell>
                                <TableCell>{item.requester}</TableCell>
                                <TableCell>{item.request_date}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Tab: จองรถส่วนกลาง ===== */}
        <TabsContent value="vehicle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>จองการใช้รถส่วนกลาง</CardTitle>
              <CardDescription>จองรถยนต์ของบริษัทเพื่อใช้ในภารกิจที่เกี่ยวข้องกับงาน</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto mb-4">
                    <Plus className="w-4 h-4 mr-2" />
                    สร้างคำขอจองรถใหม่
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>สร้างคำขอจองรถส่วนกลาง</DialogTitle>
                    <DialogDescription>กรอกรายละเอียดสำหรับการจองรถส่วนกลาง</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="vehicle-type">ประเภทรถที่ต้องการ *</Label>
                      <Select value={vehicleType} onValueChange={setVehicleType}>
                        <SelectTrigger id="vehicle-type">
                          <SelectValue placeholder="เลือกประเภทรถ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="van">รถตู้</SelectItem>
                          <SelectItem value="pickup">รถกระบะ</SelectItem>
                          <SelectItem value="sedan">รถเก๋ง</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicle-purpose">วัตถุประสงค์ในการใช้ *</Label>
                      <Textarea id="vehicle-purpose" placeholder="กรอกวัตถุประสงค์ในการใช้รถ" rows={3} value={vehiclePurpose} onChange={e => setVehiclePurpose(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>วันที่และเวลาที่เริ่มใช้ *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !vehicleStartDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {vehicleStartDate ? format(vehicleStartDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={vehicleStartDate} onSelect={setVehicleStartDate} initialFocus className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                        <Input type="time" className="mt-2" value={vehicleStartTime} onChange={e => setVehicleStartTime(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>วันที่และเวลาที่สิ้นสุด *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !vehicleEndDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {vehicleEndDate ? format(vehicleEndDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={vehicleEndDate} onSelect={setVehicleEndDate} initialFocus className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                        <Input type="time" className="mt-2" value={vehicleEndTime} onChange={e => setVehicleEndTime(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicle-requester">ผู้ขอเบิกใช้รถ *</Label>
                      <Input id="vehicle-requester" placeholder="กรอกชื่อผู้ขอใช้รถ" value={vehicleRequester} onChange={e => setVehicleRequester(e.target.value)} />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleSubmitVehicle} disabled={vehicleSubmitting}
                    >
                      {vehicleSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังส่ง...</> : "ส่งคำขอจองรถ"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">ปฏิทินสถานะรถ</h3>
                <Calendar mode="single" selected={pickupDate} onSelect={setPickupDate} className="rounded-md border w-full pointer-events-auto" />
                <p className="text-sm text-muted-foreground mt-2">* วันที่มีสีเข้ม = มีการจองรถแล้ว</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">ประวัติการจองรถ</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ประเภทรถ</TableHead>
                        <TableHead>วัตถุประสงค์</TableHead>
                        <TableHead>เริ่มใช้</TableHead>
                        <TableHead>สิ้นสุด</TableHead>
                        <TableHead>สถานะ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicleLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></TableCell>
                        </TableRow>
                      ) : vehicleHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                            ยังไม่มีประวัติการจองรถ
                          </TableCell>
                        </TableRow>
                      ) : (
                        vehicleHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {item.vehicle_type === 'van' ? 'รถตู้' : item.vehicle_type === 'pickup' ? 'รถกระบะ' : item.vehicle_type === 'sedan' ? 'รถเก๋ง' : item.vehicle_type}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{item.purpose}</TableCell>
                            <TableCell>{format(new Date(item.start_datetime), "dd/MM/yyyy HH:mm")}</TableCell>
                            <TableCell>{format(new Date(item.end_datetime), "dd/MM/yyyy HH:mm")}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
