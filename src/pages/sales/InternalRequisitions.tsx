import { useState, useEffect, useMemo } from "react";
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
import { CalendarIcon, Package, ClipboardList, Car, Plus, Loader2, AlertTriangle, RefreshCw, Eye, XCircle, Edit, CheckCircle2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { salesStockService as materialStockService } from "@/services/materialStockService";
import { th } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

const CURRENT_DEPT = 'sales';
const API_BASE = "https://nacres.co.th/api-lucky/admin";

// Safe date formatting helper for API data
const formatSafeDateTime = (dateVal: string, formatStr: string = "dd/MM/yyyy HH:mm") => {
  if (!dateVal || dateVal.startsWith("0000-00-00")) return "-";
  const d = new Date(dateVal.replace(' ', 'T')); // Standardize for cross-browser
  if (isNaN(d.getTime())) return "-";
  return format(d, formatStr, { locale: th });
};

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
  const [vehicleRequester, setVehicleRequester] = useState("");
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const [vehicleHistory, setVehicleHistory] = useState<VehicleReservation[]>([]);
  const [vehicleLoading, setVehicleLoading] = useState(false);

  // Calculate booked dates for calendar highlighting
  const bookedDates = useMemo(() => {
    const dates: Date[] = [];
    vehicleHistory.forEach(r => {
      // Only show approved or pending status
      if (r.status === "ปฏิเสธ" || r.status === "ยกเลิก") return;
      try {
        const start = new Date(r.start_datetime.replace(' ', 'T'));
        const end = new Date(r.end_datetime.replace(' ', 'T'));
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

        let curr = new Date(start);
        curr.setHours(0, 0, 0, 0);
        const lastDay = new Date(end);
        lastDay.setHours(0, 0, 0, 0);

        while (curr <= lastDay) {
          dates.push(new Date(curr));
          curr.setDate(curr.getDate() + 1);
        }
      } catch (e) { console.error("Error parsing reservation date:", e); }
    });
    return dates;
  }, [vehicleHistory]);

  // --- Purchase requests state ---
  const [purchaseHistory, setPurchaseHistory] = useState<MaterialRequest[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(true);
  const [purchaseError, setPurchaseError] = useState("");

  // Auto-filled requester from login
  const [purchaseRequester, setPurchaseRequester] = useState("");

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
  const [usageDepartment, setUsageDepartment] = useState("ฝ่ายขาย");
  const [salesEmployees, setSalesEmployees] = useState<any[]>([]);
  const [usageRequester, setUsageRequester] = useState("");
  const [usageReason, setUsageReason] = useState("");

  const [employeesLoading, setEmployeesLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    if (userData && Object.keys(userData).length > 0) {
      setCurrentUser(userData);
      const name = userData.full_name || "";
      if (name) {
        setPurchaseRequester(name);
        setUsageRequester(name);
        setVehicleRequester(name);
      }
    }
  }, []);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isVehicleDetailOpen, setIsVehicleDetailOpen] = useState(false);

  const [editingRequest, setEditingRequest] = useState<any>(null);
  const [isRequestDetailOpen, setIsRequestDetailOpen] = useState(false);
  const [isRequestEditDialogOpen, setIsRequestEditDialogOpen] = useState(false);

  const clearError = (key: string) => {
    if (formErrors[key]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleCancelRequest = async (id: number) => {
    if (!confirm("คุณต้องการยกเลิกคำขอนี้ใช่หรือไม่? (การยกเลิกจะคืนสต็อกโดยสมบูรณ์)")) return;
    try {
      const response = await fetch(`${API_BASE}/material_requests.php?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.status === "success") {
        toast({ title: "ยกเลิกสำเร็จ", description: "ยกเลิกคำขอและคืนสต็อกเรียบร้อยแล้ว" });
        fetchPurchaseHistory();
        fetchMaterials();
      } else {
        toast({ variant: "destructive", title: "เกิดข้อผิดพลาด", description: data.message });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาด", description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้" });
    }
  };

  const handleEditRequest = (item: any) => {
    setEditingRequest(item);
    if (item.remark?.includes("แผนก:")) {
      // Usage request
      setSelectedMaterial(item.material_name);
      setUsageQty(item.qty.toString());
      setUsageDepartment(item.remark?.match(/แผนก:\s*([^|]+)/)?.[1]?.trim() || "ฝ่ายขาย");
      setUsageRequester(item.requester || purchaseRequester);
      const remarkParts = item.remark?.split('|');
      setUsageReason(remarkParts.length > 1 ? remarkParts[1].trim() : "");
      setIsUsageDialogOpen(true);
    } else {
      // Purchase request
      setPurchaseName(item.material_name);
      setPurchaseQty(item.qty.toString());
      setPurchaseRequester(item.requester || purchaseRequester);
      const remarkParts = item.remark?.split('|');
      setPurchaseReason(remarkParts[0]?.trim() || "");
      const budgetMatch = item.remark?.match(/งบ:\s*(\d+)/);
      setPurchaseBudget(budgetMatch ? budgetMatch[1] : "");
      if (item.request_date && !item.request_date.startsWith("0000")) {
        setMaterialDate(new Date(item.request_date.replace(' ', 'T')));
      }
      setIsPurchaseDialogOpen(true);
    }
  };

  // --- Fetch purchase history ---
  const fetchPurchaseHistory = async () => {
    setPurchaseLoading(true);
    setPurchaseError("");
    try {
      const json = await materialStockService.getRequests({ limit: 50 });
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
      const json = await materialStockService.getMaterials({ limit: 100 });
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

  const fetchSalesEmployees = async () => {
    setEmployeesLoading(true);
    try {
      const json = await materialStockService.getEmployees({ department: 'ฝ่ายขาย' });
      if (json.status === "success") {
        setSalesEmployees(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    if (!confirm(`คุณต้องการเปลี่ยนสถานะเป็น "${newStatus}" ใช่หรือไม่?`)) return;
    try {
      setPurchaseLoading(true);
      const json = await materialStockService.updateRequest(id, { status: newStatus });
      if (json.status === "success") {
        toast({ title: "สำเร็จ", description: `เปลี่ยนสถานะเป็น "${newStatus}" เรียบร้อยแล้ว` });
        fetchPurchaseHistory();
      } else {
        toast({ title: "เกิดข้อผิดพลาด", description: json.message || "ไม่สามารถอัปเดตสถานะได้", variant: "destructive" });
      }
    } catch {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", variant: "destructive" });
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleCancelVehicle = async (id: number) => {
    if (!confirm("คุณต้องการยกเลิกการจองรถนี้ใช่หรือไม่?")) return;
    try {
      const response = await fetch(`${API_BASE}/vehicle_reservations.php`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "ยกเลิก" }),
      });
      const data = await response.json();
      if (data.status === "success") {
        toast({ title: "ยกเลิกสำเร็จ", description: "ยกเลิกการจองรถเรียบร้อยแล้ว" });
        fetchVehicleHistory();
      } else {
        toast({ variant: "destructive", title: "เกิดข้อผิดพลาด", description: data.message });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "เกิดข้อผิดพลาด", description: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้" });
    }
  };

  useEffect(() => {
    fetchPurchaseHistory();
    fetchMaterials();
    fetchVehicleHistory();
    fetchSalesEmployees();
  }, []);

  // --- Submit purchase request (เบิกซื้อ) ---
  const handleSubmitPurchase = async () => {
    const errors: Record<string, string> = {};
    if (!purchaseName.trim()) errors.purchaseName = "กรุณากรอกชื่อวัสดุ/อุปกรณ์";
    if (!purchaseQty) errors.purchaseQty = "กรุณากรอกจำนวน";
    if (!materialDate) errors.materialDate = "กรุณาเลือกวันที่ต้องการ";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน", variant: "destructive" });
      return;
    }
    setFormErrors({});
    setPurchaseSubmitting(true);
    try {
      const payload = {
        request_date: materialDate ? format(materialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        material_name: purchaseName.trim(),
        qty: parseInt(purchaseQty),
        requester: editingRequest?.requester || purchaseRequester || "ผู้ใช้งานปัจจุบัน",
        remark: `${purchaseReason}${purchaseBudget ? ` | งบ: ${purchaseBudget} บาท` : ""}`,
        status: editingRequest?.status || "รออนุมัติ",
      };

      let json;
      if (editingRequest) {
        json = await materialStockService.updateRequest(editingRequest.id, payload);
      } else {
        json = await materialStockService.createRequest(payload);
      }

      if (json.status === "success") {
        toast({ title: editingRequest ? "แก้ไขสำเร็จ" : "ส่งคำขอเบิกซื้อสำเร็จ", description: `คำขอ "${purchaseName}" ถูกบันทึกแล้ว` });
        setIsPurchaseDialogOpen(false);
        setEditingRequest(null);
        setPurchaseName(""); setPurchaseQty(""); setPurchaseReason(""); setPurchaseBudget(""); setMaterialDate(undefined);
        fetchPurchaseHistory();
      } else {
        toast({ title: "เกิดข้อผิดพลาด", description: json.message || "ไม่สามารถดำเนินการได้", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "เกิดข้อผิดพลาด", description: "เชื่อมต่อ API ไม่ได้", variant: "destructive" });
    } finally {
      setPurchaseSubmitting(false);
    }
  };

  // --- Submit usage request (เบิกใช้จาก stock) ---
  const handleSubmitUsage = async () => {
    const errors: Record<string, string> = {};
    if (!selectedMaterial) errors.selectedMaterial = "กรุณาเลือกรายการสินค้า";
    if (!usageQty) errors.usageQty = "กรุณากรอกจำนวนที่ต้องการ";
    if (!usageDepartment) errors.usageDepartment = "กรุณาเลือกแผนก";
    if (!usageRequester) errors.usageRequester = "กรุณาเลือกผู้เบิก";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน", variant: "destructive" });
      return;
    }
    setFormErrors({});
    setUsageSubmitting(true);
    try {
      const payload = {
        request_date: editingRequest?.request_date || format(new Date(), "yyyy-MM-dd"),
        material_name: selectedMaterial,
        qty: parseInt(usageQty),
        requester: usageRequester,
        remark: `แผนก: ${usageDepartment}${usageReason ? ` | ${usageReason}` : ""}`,
        status: editingRequest?.status || "รออนุมัติ",
      };

      let json;
      if (editingRequest) {
        json = await materialStockService.updateRequest(editingRequest.id, payload);
      } else {
        json = await materialStockService.createRequest(payload);
      }

      if (json.status === "success") {
        toast({
          title: editingRequest ? "แก้ไขสำเร็จ" : "เบิกใช้อุปกรณ์สำเร็จ",
          description: `รายการถูกบันทึกเรียบร้อยแล้ว`,
        });
        setIsUsageDialogOpen(false);
        setEditingRequest(null);
        setSelectedMaterial(""); setUsageQty(""); setUsageDepartment("ฝ่ายขาย"); setUsageRequester(""); setUsageReason("");
        fetchPurchaseHistory();
        fetchMaterials(); // refresh stock
      } else {
        toast({ title: "เกิดข้อผิดพลาด", description: json.message || "ไม่สามารถดำเนินการได้", variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "เกิดข้อผิดพลาด", description: "เชื่อมต่อ API ไม่ได้", variant: "destructive" });
    } finally {
      setUsageSubmitting(false);
    }
  };

  // --- Submit vehicle reservation ---
  const handleSubmitVehicle = async () => {
    const errors: Record<string, string> = {};
    if (!vehicleType) errors.vehicleType = "กรุณาเลือกประเภทรถ";
    if (!vehiclePurpose) errors.vehiclePurpose = "กรุณาระบุวัตถุประสงค์";
    if (!vehicleStartDate) errors.vehicleStartDate = "กรุณาเลือกวันที่เริ่ม";
    if (!vehicleStartTime) errors.vehicleStartTime = "กรุณาระบุเวลาเริ่ม";
    if (!vehicleEndDate) errors.vehicleEndDate = "กรุณาเลือกวันที่สิ้นสุด";
    if (!vehicleEndTime) errors.vehicleEndTime = "กรุณาระบุเวลาสิ้นสุด";
    if (!vehicleRequester) errors.vehicleRequester = "กรุณาระบุผู้ขอใช้รถ";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast({ title: "ข้อมูลไม่ครบถ้วน", description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน", variant: "destructive" });
      return;
    }
    setFormErrors({});
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
              <Dialog open={isPurchaseDialogOpen} onOpenChange={(val) => {
                setIsPurchaseDialogOpen(val);
                if (!val) { setEditingRequest(null); setPurchaseName(""); setPurchaseQty(""); setPurchaseReason(""); setPurchaseBudget(""); setMaterialDate(undefined); }
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    สร้างคำขอเบิกซื้อใหม่
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-black">
                  <DialogHeader>
                    <DialogTitle>{editingRequest ? "แก้ไขคำขอเบิกซื้อ" : "สร้างคำขอเบิกซื้อวัสดุอุปกรณ์"}</DialogTitle>
                    <DialogDescription>กรอกรายละเอียดสำหรับการเบิกซื้อวัสดุหรืออุปกรณ์</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="material-name" className="flex items-center gap-1 font-medium">
                        ชื่ออุปกรณ์/วัสดุ * {purchaseName.trim() && !formErrors.purchaseName && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </Label>
                      <Input
                        id="material-name"
                        placeholder="กรอกชื่ออุปกรณ์หรือวัสดุ"
                        value={purchaseName}
                        onChange={e => { setPurchaseName(e.target.value); clearError('purchaseName'); }}
                        className={cn(
                          formErrors.purchaseName ? "border-red-500 ring-1 ring-red-500" :
                            purchaseName.trim() ? "border-green-500 focus-visible:ring-green-500" : ""
                        )}
                      />
                      {formErrors.purchaseName && <p className="text-xs text-red-500">{formErrors.purchaseName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-quantity" className="flex items-center gap-1 font-medium">
                        จำนวนที่ต้องการ * {purchaseQty && !formErrors.purchaseQty && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </Label>
                      <Input
                        id="material-quantity"
                        type="number"
                        placeholder="กรอกจำนวน"
                        value={purchaseQty}
                        onChange={e => { setPurchaseQty(e.target.value); clearError('purchaseQty'); }}
                        className={cn(
                          formErrors.purchaseQty ? "border-red-500 ring-1 ring-red-500" :
                            purchaseQty ? "border-green-500 focus-visible:ring-green-500" : ""
                        )}
                      />
                      {formErrors.purchaseQty && <p className="text-xs text-red-500">{formErrors.purchaseQty}</p>}
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
                      <Label htmlFor="purchase-requester">ผู้เบิก (Requester)</Label>
                      <Input
                        id="purchase-requester"
                        placeholder="กรอกชื่อผู้เบิก"
                        value={purchaseRequester}
                        onChange={e => setPurchaseRequester(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1 font-medium">
                        วันที่ต้องการใช้งาน * {materialDate && !formErrors.materialDate && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !materialDate && "text-muted-foreground",
                              formErrors.materialDate ? "border-red-500 ring-1 ring-red-500" :
                                materialDate ? "border-green-500 focus-visible:ring-green-500" : ""
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {materialDate ? format(materialDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={materialDate} onSelect={(d) => { setMaterialDate(d); clearError('materialDate'); }} initialFocus className="pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                      {formErrors.materialDate && <p className="text-xs text-red-500">{formErrors.materialDate}</p>}
                    </div>
                    <Button className="w-full" onClick={handleSubmitPurchase} disabled={purchaseSubmitting}>
                      {purchaseSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังดำเนินการ...</> : editingRequest ? "บันทึกการแก้ไข" : "ส่งคำขอเบิกซื้อ"}
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
                          <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseOnlyHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
                              ยังไม่มีประวัติคำขอเบิกซื้อ
                            </TableCell>
                          </TableRow>
                        ) : (
                          purchaseOnlyHistory.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.material_name}</TableCell>
                              <TableCell>{item.qty}</TableCell>
                              <TableCell>{formatSafeDateTime(item.request_date, "dd/MM/yyyy")}</TableCell>
                              <TableCell>{item.requester}</TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{item.remark || "-"}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {(item.status === "รออนุมัติ" || item.status === "บันทึกแล้ว") && (
                                    <>
                                      <Button
                                        variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                        onClick={() => handleUpdateStatus(item.id, "อนุมัติแล้ว")}
                                        title="อนุมัติ"
                                      >
                                        <CheckCircle2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                        onClick={() => handleUpdateStatus(item.id, "ปฏิเสธ")}
                                        title="ปฏิเสธ"
                                      >
                                        <XCircle className="h-4 w-4 text-rose-500" />
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => { setEditingRequest(item); setIsRequestDetailOpen(true); }}
                                    title="ดูรายละเอียด"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={() => handleEditRequest(item)}
                                    title="แก้ไข"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleCancelRequest(item.id)}
                                    title="ลบรายการ"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </Button>
                                </div>
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
              <Dialog open={isUsageDialogOpen} onOpenChange={(val) => {
                setIsUsageDialogOpen(val);
                if (!val) { setEditingRequest(null); setSelectedMaterial(""); setUsageQty(""); setUsageRequester(""); setUsageReason(""); }
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    สร้างคำขอเบิกใช้ใหม่
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto text-black">
                  <DialogHeader>
                    <DialogTitle>{editingRequest ? "แก้ไขคำขอเบิกใช้" : "สร้างคำขอเบิกใช้อุปกรณ์"}</DialogTitle>
                    <DialogDescription>กรอกรายละเอียดสำหรับการเบิกใช้สต็อกวัสดุหรืออุปกรณ์</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="usage-item" className="flex items-center gap-1 font-medium">
                        รายการสินค้า * {selectedMaterial && !formErrors.selectedMaterial && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </Label>
                      <Select value={selectedMaterial} onValueChange={(val) => { setSelectedMaterial(val); clearError('selectedMaterial'); }}>
                        <SelectTrigger id="usage-item" className={cn(
                          formErrors.selectedMaterial ? "border-red-500 ring-1 ring-red-500" :
                            selectedMaterial ? "border-green-500 focus-visible:ring-green-500" : ""
                        )}>
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
                      {formErrors.selectedMaterial && <p className="text-xs text-red-500">{formErrors.selectedMaterial}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage-quantity" className="flex items-center gap-1 font-medium">
                        จำนวนที่ต้องการ * {usageQty && !formErrors.usageQty && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </Label>
                      <Input
                        id="usage-quantity"
                        type="number"
                        placeholder="กรอกจำนวน"
                        value={usageQty}
                        onChange={e => { setUsageQty(e.target.value); clearError('usageQty'); }}
                        className={cn(
                          formErrors.usageQty ? "border-red-500 ring-1 ring-red-500" :
                            usageQty ? "border-green-500 focus-visible:ring-green-500" : ""
                        )}
                      />
                      {formErrors.usageQty && <p className="text-xs text-red-500">{formErrors.usageQty}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage-department" className="flex items-center gap-1 font-medium">
                        แผนกผู้เบิก * {usageDepartment && !formErrors.usageDepartment && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </Label>
                      <Select value={usageDepartment} onValueChange={(val) => { setUsageDepartment(val); clearError('usageDepartment'); }}>
                        <SelectTrigger id="usage-department" className={cn(
                          formErrors.usageDepartment ? "border-red-500 ring-1 ring-red-500" :
                            usageDepartment ? "border-green-500 focus-visible:ring-green-500" : ""
                        )}>
                          <SelectValue placeholder="เลือกแผนก" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ฝ่ายขาย">ฝ่ายขาย</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.usageDepartment && <p className="text-xs text-red-500">{formErrors.usageDepartment}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage-requester" className="flex items-center gap-1 font-medium">
                        ผู้เบิก * {usageRequester && !formErrors.usageRequester && <CheckCircle2 className="w-4 h-4 text-green-500" />} {employeesLoading && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}
                      </Label>
                      <Select value={usageRequester} onValueChange={(val) => { setUsageRequester(val); clearError('usageRequester'); }}>
                        <SelectTrigger id="usage-requester" className={cn(
                          formErrors.usageRequester ? "border-red-500 ring-1 ring-red-500" :
                            usageRequester ? "border-green-500 focus-visible:ring-green-500" : ""
                        )}>
                          <SelectValue placeholder="เลือกผู้เบิก" />
                        </SelectTrigger>
                        <SelectContent>
                          {currentUser && currentUser.full_name && !salesEmployees.some(e => e.full_name === currentUser.full_name) && (
                            <SelectItem value={currentUser.full_name}>
                              {currentUser.full_name} (คุณ)
                            </SelectItem>
                          )}
                          {salesEmployees.length === 0 && !employeesLoading && !currentUser?.full_name ? (
                            <SelectItem value="__none" disabled>ไม่มีรายชื่อ (ฝ่ายขาย)</SelectItem>
                          ) : (
                            salesEmployees.map(emp => (
                              <SelectItem key={emp.id} value={emp.full_name}>
                                {emp.full_name} ({emp.nickname || emp.position})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {formErrors.usageRequester && <p className="text-xs text-red-500">{formErrors.usageRequester}</p>}
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
                      {usageSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังดำเนินการ...</> : editingRequest ? "บันทึกการแก้ไข" : "ส่งคำขอเบิกใช้"}
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
                          <TableHead className="text-right">จัดการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usageHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
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
                                <TableCell>{formatSafeDateTime(item.request_date, "dd/MM/yyyy")}</TableCell>
                                <TableCell>
                                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    {(item.status === "รออนุมัติ" || item.status === "บันทึกแล้ว") && (
                                      <>
                                        <Button
                                          variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                          onClick={() => handleUpdateStatus(item.id, "อนุมัติแล้ว")}
                                          title="อนุมัติ"
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                          onClick={() => handleUpdateStatus(item.id, "ปฏิเสธ")}
                                          title="ปฏิเสธ"
                                        >
                                          <XCircle className="h-4 w-4 text-rose-500" />
                                        </Button>
                                      </>
                                    )}
                                    <Button
                                      variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      onClick={() => { setEditingRequest(item); setIsRequestDetailOpen(true); }}
                                      title="ดูรายละเอียด"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      onClick={() => handleEditRequest(item)}
                                      title="แก้ไข"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                      onClick={() => handleCancelRequest(item.id)}
                                      title="ลบรายการ"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
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
                      <Label htmlFor="vehicle-type" className="flex items-center gap-1 font-medium">
                        ประเภทรถที่ต้องการ * {vehicleType && !formErrors.vehicleType && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </Label>
                      <Select value={vehicleType} onValueChange={(val) => { setVehicleType(val); clearError('vehicleType'); }}>
                        <SelectTrigger id="vehicle-type" className={cn(
                          formErrors.vehicleType ? "border-red-500 ring-1 ring-red-500" :
                            vehicleType ? "border-green-500 focus-visible:ring-green-500" : ""
                        )}>
                          <SelectValue placeholder="เลือกประเภทรถ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="van">รถตู้</SelectItem>
                          <SelectItem value="pickup">รถกระบะ</SelectItem>
                          <SelectItem value="sedan">รถเก๋ง</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.vehicleType && <p className="text-xs text-red-500">{formErrors.vehicleType}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicle-purpose" className="flex items-center gap-1 font-medium">
                        วัตถุประสงค์ในการใช้ * {vehiclePurpose.trim() && !formErrors.vehiclePurpose && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      </Label>
                      <Textarea
                        id="vehicle-purpose"
                        placeholder="กรอกวัตถุประสงค์ในการใช้รถ"
                        rows={3}
                        value={vehiclePurpose}
                        onChange={e => { setVehiclePurpose(e.target.value); clearError('vehiclePurpose'); }}
                        className={cn(
                          formErrors.vehiclePurpose ? "border-red-500 ring-1 ring-red-500" :
                            vehiclePurpose.trim() ? "border-green-500 focus-visible:ring-green-500" : ""
                        )}
                      />
                      {formErrors.vehiclePurpose && <p className="text-xs text-red-500">{formErrors.vehiclePurpose}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1 font-medium">
                          วันที่และเวลาที่เริ่มใช้ * {vehicleStartDate && vehicleStartTime && !formErrors.vehicleStartDate && !formErrors.vehicleStartTime && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !vehicleStartDate && "text-muted-foreground",
                                formErrors.vehicleStartDate ? "border-red-500 ring-1 ring-red-500" :
                                  vehicleStartDate ? "border-green-500 focus-visible:ring-green-500" : ""
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {vehicleStartDate ? format(vehicleStartDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={vehicleStartDate} onSelect={(d) => { setVehicleStartDate(d); clearError('vehicleStartDate'); }} initialFocus className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                        {formErrors.vehicleStartDate && <p className="text-xs text-red-500">{formErrors.vehicleStartDate}</p>}
                        <Input
                          type="time"
                          className={cn(
                            "mt-2",
                            formErrors.vehicleStartTime ? "border-red-500 ring-1 ring-red-500" :
                              vehicleStartTime ? "border-green-500 focus-visible:ring-green-500" : ""
                          )}
                          value={vehicleStartTime}
                          onChange={e => { setVehicleStartTime(e.target.value); clearError('vehicleStartTime'); }}
                        />
                        {formErrors.vehicleStartTime && <p className="text-xs text-red-500">{formErrors.vehicleStartTime}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1 font-medium">
                          วันที่และเวลาที่สิ้นสุด * {vehicleEndDate && vehicleEndTime && !formErrors.vehicleEndDate && !formErrors.vehicleEndTime && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !vehicleEndDate && "text-muted-foreground",
                                formErrors.vehicleEndDate ? "border-red-500 ring-1 ring-red-500" :
                                  vehicleEndDate ? "border-green-500 focus-visible:ring-green-500" : ""
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {vehicleEndDate ? format(vehicleEndDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={vehicleEndDate} onSelect={(d) => { setVehicleEndDate(d); clearError('vehicleEndDate'); }} initialFocus className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                        {formErrors.vehicleEndDate && <p className="text-xs text-red-500">{formErrors.vehicleEndDate}</p>}
                        <Input
                          type="time"
                          className={cn(
                            "mt-2",
                            formErrors.vehicleEndTime ? "border-red-500 ring-1 ring-red-500" :
                              vehicleEndTime ? "border-green-500 focus-visible:ring-green-500" : ""
                          )}
                          value={vehicleEndTime}
                          onChange={e => { setVehicleEndTime(e.target.value); clearError('vehicleEndTime'); }}
                        />
                        {formErrors.vehicleEndTime && <p className="text-xs text-red-500">{formErrors.vehicleEndTime}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicle-requester" className="flex items-center gap-1 font-medium">
                        ผู้ขอเบิกใช้รถ * {vehicleRequester && !formErrors.vehicleRequester && <CheckCircle2 className="w-4 h-4 text-green-500" />} {employeesLoading && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}
                      </Label>
                      <Select value={vehicleRequester} onValueChange={(val) => { setVehicleRequester(val); clearError('vehicleRequester'); }}>
                        <SelectTrigger id="vehicle-requester" className={cn(
                          formErrors.vehicleRequester ? "border-red-500 ring-1 ring-red-500" :
                            vehicleRequester ? "border-green-500 focus-visible:ring-green-500" : ""
                        )}>
                          <SelectValue placeholder="เลือกผู้ขอใช้รถ" />
                        </SelectTrigger>
                        <SelectContent>
                          {currentUser && currentUser.full_name && !salesEmployees.some(e => e.full_name === currentUser.full_name) && (
                            <SelectItem value={currentUser.full_name}>
                              {currentUser.full_name} (คุณ)
                            </SelectItem>
                          )}
                          {salesEmployees.length === 0 && !employeesLoading && !currentUser?.full_name ? (
                            <SelectItem value="__none" disabled>ไม่มีรายชื่อ (ฝ่ายขาย)</SelectItem>
                          ) : (
                            salesEmployees.map(emp => (
                              <SelectItem key={emp.id} value={emp.full_name}>
                                {emp.full_name} ({emp.nickname || emp.position})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {formErrors.vehicleRequester && <p className="text-xs text-red-500">{formErrors.vehicleRequester}</p>}
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
                <Calendar
                  mode="single"
                  selected={pickupDate}
                  onSelect={setPickupDate}
                  className="rounded-md border w-full pointer-events-auto"
                  modifiers={{ booked: bookedDates }}
                  modifiersClassNames={{
                    booked: "bg-rose-500 text-white font-bold rounded-md hover:bg-rose-600 focus:bg-rose-600"
                  }}
                />
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
                        <TableHead>ผู้ขอเบิก</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehicleLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></TableCell>
                        </TableRow>
                      ) : vehicleHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-6">
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
                            <TableCell>{formatSafeDateTime(item.start_datetime)}</TableCell>
                            <TableCell>{formatSafeDateTime(item.end_datetime)}</TableCell>
                            <TableCell>{item.requester || "-"}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => {
                                    setSelectedVehicle(item);
                                    setIsVehicleDetailOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {item.status !== "ยกเลิก" && item.status !== "ไม่อนุมัติ" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleCancelVehicle(item.id)}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
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

      <Dialog open={isVehicleDetailOpen} onOpenChange={setIsVehicleDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>รายละเอียดการจองรถ</DialogTitle>
            <DialogDescription>ข้อมูลรายละเอียดการขอใช้รถส่วนกลาง</DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-muted-foreground">ประเภทรถ:</div>
                <div className="col-span-2 font-medium">
                  {selectedVehicle.vehicle_type === 'van' ? 'รถตู้' : selectedVehicle.vehicle_type === 'pickup' ? 'รถกระบะ' : selectedVehicle.vehicle_type === 'sedan' ? 'รถเก๋ง' : selectedVehicle.vehicle_type}
                </div>

                <div className="text-muted-foreground">ผู้ขอเบิก:</div>
                <div className="col-span-2 font-medium">{selectedVehicle.requester}</div>

                <div className="text-muted-foreground">เริ่มใช้:</div>
                <div className="col-span-2 font-medium">{formatSafeDateTime(selectedVehicle.start_datetime, "dd/MM/yyyy HH:mm น.")}</div>

                <div className="text-muted-foreground">สิ้นสุด:</div>
                <div className="col-span-2 font-medium">{formatSafeDateTime(selectedVehicle.end_datetime, "dd/MM/yyyy HH:mm น.")}</div>

                <div className="text-muted-foreground">วัตถุประสงค์:</div>
                <div className="col-span-2 font-medium">{selectedVehicle.purpose}</div>

                <div className="text-muted-foreground">สถานะ:</div>
                <div className="col-span-2">
                  <Badge className={getStatusColor(selectedVehicle.status)}>{selectedVehicle.status}</Badge>
                </div>

                {selectedVehicle.notes && selectedVehicle.notes !== "-" && (
                  <>
                    <div className="text-muted-foreground">หมายเหตุ:</div>
                    <div className="col-span-2 font-medium">{selectedVehicle.notes}</div>
                  </>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setIsVehicleDetailOpen(false)}>ปิด</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRequestDetailOpen} onOpenChange={setIsRequestDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>รายละเอียดคำขอเบิกอุปกรณ์/วัสดุ</DialogTitle>
            <DialogDescription>ข้อมูลรายละเอียดของคำขอเบิกในระบบ</DialogDescription>
          </DialogHeader>
          {editingRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-2 text-sm text-black">
                <div className="text-muted-foreground">รายการ:</div>
                <div className="col-span-2 font-medium">{editingRequest.material_name}</div>

                <div className="text-muted-foreground">จำนวน:</div>
                <div className="col-span-2 font-medium">{editingRequest.qty}</div>

                <div className="text-muted-foreground">วันที่ขอ:</div>
                <div className="col-span-2 font-medium">{formatSafeDateTime(editingRequest.request_date, "dd/MM/yyyy")}</div>

                <div className="text-muted-foreground">ผู้เบิก/ผู้ขอ:</div>
                <div className="col-span-2 font-medium">{editingRequest.requester}</div>

                <div className="text-muted-foreground">สถานะ:</div>
                <div className="col-span-2">
                  <Badge className={getStatusColor(editingRequest.status)}>{editingRequest.status}</Badge>
                </div>

                <div className="text-muted-foreground">รายละเอียดเพิ่มเติม:</div>
                <div className="col-span-2 font-medium whitespace-pre-wrap">{editingRequest.remark || "-"}</div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setIsRequestDetailOpen(false)}>ปิด</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
