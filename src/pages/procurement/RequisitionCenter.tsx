import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ShoppingCart, Package, Car, CalendarIcon, Plus, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { productionService } from "@/services/productionService";
import { purchaseRequisitionService } from "@/services/purchaseRequisitionService";

const API_BASE = "https://nacres.co.th/api-lucky/admin";

export default function RequisitionCenter() {
  const { user } = useAuth();
  const [usageDate, setUsageDate] = useState<Date>();
  const [startDateTime, setStartDateTime] = useState<Date>();
  const [endDateTime, setEndDateTime] = useState<Date>();

  // Vehicle Booking Form State
  const [vehicleType, setVehicleType] = useState("");
  const [vehiclePurpose, setVehiclePurpose] = useState("");
  const [passengerCount, setPassengerCount] = useState("");
  const [isVehicleSubmitting, setIsVehicleSubmitting] = useState(false);

  // Material Purchase Request Form State
  const [matName, setMatName] = useState("");
  const [matQty, setMatQty] = useState("");
  const [matReason, setMatReason] = useState("");
  const [matBudget, setMatBudget] = useState("");
  const [matFiles, setMatFiles] = useState<FileList | null>(null);
  const [isMatSubmitting, setIsMatSubmitting] = useState(false);

  // Equipment Form State
  const [equipments, setEquipments] = useState<any[]>([]);
  const [loadingEq, setLoadingEq] = useState(false);
  const [eqName, setEqName] = useState("");
  const [eqQty, setEqQty] = useState("");
  const [eqDept, setEqDept] = useState("");
  const [eqRequester] = useState("ชื่อผู้ใช้งาน (อัตโนมัติ)");
  const [eqReason, setEqReason] = useState("");
  const [isEqSubmitting, setIsEqSubmitting] = useState(false);

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    setLoadingEq(true);
    try {
      const res = await fetch(`${API_BASE}/equipments.php`);
      const json = await res.json();
      if (json.status === "success") {
        setEquipments(json.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEq(false);
    }
  };

  const handleMaterialRequest = async () => {
    if (!matName || !matQty) {
      toast.error("กรุณากรอกชื่ออุปกรณ์/วัสดุ และจำนวนที่ต้องการ");
      return;
    }
    setIsMatSubmitting(true);
    try {
      const attachments = matFiles && matFiles.length > 0
        ? await Promise.all(Array.from(matFiles).map(async (file) => {
            const up = await purchaseRequisitionService.uploadFile(file);
            return up.status === "success" && up.url ? { url: up.url, name: up.file?.name || file.name, size: up.file?.size ?? file.size } : null;
          })).then(list => list.filter(Boolean))
        : [];

      const today = format(new Date(), "yyyy-MM-dd");
      const usage = usageDate ? format(usageDate, "yyyy-MM-dd") : today;
      const res = await purchaseRequisitionService.create({
        issueDate: today,
        usageDate: usage,
        requester: user?.full_name || user?.username || "ไม่ระบุ",
        purposeType: "new",
        purposeText: matReason || "เบิกซื้อวัสดุอุปกรณ์ (ผ่านเบิกการใช้งาน)",
        jobIds: [],
        channel: "",
        shipping: 0,
        includeVat: false,
        items: [{ description: matName, link: "", qty: Number(matQty), unitPrice: Number(matBudget) || 0, currency: "THB", exchangeRate: 1 }],
        payments: [],
        attachments,
        receiveAttachments: [],
      });
      if (res.status === "success") {
        toast.success(`ส่งคำขอเบิกซื้อวัสดุอุปกรณ์เรียบร้อย (เลขที่ ${res.data.prNumber})`);
        setMatName(""); setMatQty(""); setMatReason(""); setMatBudget(""); setMatFiles(null); setUsageDate(undefined);
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ API");
    } finally {
      setIsMatSubmitting(false);
    }
  };

  const handleEquipmentRequest = async () => {
    if (!eqName || !eqQty || !eqDept) {
      toast.error("กรุณากรอกข้อมูล หมวดอุปกรณ์, จำนวน และแผนก ให้ครบถ้วน");
      return;
    }
    setIsEqSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/equipment_requests.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipment_name: eqName,
          qty: parseInt(eqQty),
          department: eqDept,
          requester: eqRequester,
          remark: eqReason
        })
      });
      const json = await res.json();
      if (json.status === "success") {
        toast.success("ส่งคำขอเบิกใช้อุปกรณ์เรียบร้อย");
        setEqName(""); setEqQty(""); setEqDept(""); setEqReason("");
        fetchEquipments(); // Refresh stock
      } else {
        toast.error(json.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ API");
    } finally {
      setIsEqSubmitting(false);
    }
  };

  const handleVehicleBooking = async () => {
    if (!vehicleType || !startDateTime) {
      toast.error("กรุณาเลือกประเภทรถและวันที่เริ่มใช้");
      return;
    }
    setIsVehicleSubmitting(true);
    try {
      const vehicleTypeLabel = vehicleType === "sedan" ? "รถเก๋ง" : vehicleType === "van" ? "รถตู้" : "รถกระบะ";
      const res = await productionService.saveVehicleReservation({
        vehicle_type: vehicleTypeLabel,
        purpose: vehiclePurpose || undefined,
        start_datetime: startDateTime.toISOString(),
        end_datetime: (endDateTime || startDateTime).toISOString(),
        requester: user?.full_name || user?.username || "ไม่ระบุ",
        notes: passengerCount ? `จำนวนผู้เดินทาง: ${passengerCount} คน` : undefined,
      });
      if (res.status === "success") {
        toast.success("ส่งคำขอจองรถส่วนกลางเรียบร้อย");
        setVehicleType(""); setVehiclePurpose(""); setPassengerCount("");
        setStartDateTime(undefined); setEndDateTime(undefined);
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ API");
    } finally {
      setIsVehicleSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">เบิกการใช้งาน</h1>
        <p className="text-muted-foreground mt-2">
          ศูนย์กลางสำหรับขอใช้หรือเบิกทรัพยากรต่างๆ ของบริษัท
        </p>
      </div>

      <Tabs defaultValue="material" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="material">
            <ShoppingCart className="mr-2 h-4 w-4" />
            เบิกซื้อวัสดุอุปกรณ์
          </TabsTrigger>
          <TabsTrigger value="equipment">
            <Package className="mr-2 h-4 w-4" />
            เบิกใช้อุปกรณ์
          </TabsTrigger>
          <TabsTrigger value="vehicle">
            <Car className="mr-2 h-4 w-4" />
            จองรถส่วนกลาง
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Material Purchase Request */}
        <TabsContent value="material">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                สร้างคำขอเบิกซื้อใหม่
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>ชื่ออุปกรณ์/วัสดุ *</Label>
                  <Input placeholder="ระบุชื่ออุปกรณ์หรือวัสดุ" required value={matName} onChange={e => setMatName(e.target.value)} />
                </div>
                <div>
                  <Label>จำนวนที่ต้องการ *</Label>
                  <Input type="number" placeholder="ระบุจำนวน" required value={matQty} onChange={e => setMatQty(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>เหตุผลในการเบิก</Label>
                <Textarea placeholder="ระบุเหตุผล..." rows={3} value={matReason} onChange={e => setMatReason(e.target.value)} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>งบประมาณโดยประมาณ</Label>
                  <Input type="number" placeholder="0.00" value={matBudget} onChange={e => setMatBudget(e.target.value)} />
                </div>
                <div>
                  <Label>วันที่ต้องการใช้งาน</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !usageDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {usageDate ? format(usageDate, "PPP") : "เลือกวันที่"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={usageDate}
                        onSelect={setUsageDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label>ไฟล์แนบ (ใบเสนอราคา/รูปภาพ)</Label>
                <Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={e => setMatFiles(e.target.files)} />
              </div>

              <Button onClick={handleMaterialRequest} className="w-full" disabled={isMatSubmitting}>
                {isMatSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin inline" />กำลังส่ง...</> : "ส่งคำขอเบิกซื้อ"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Equipment Usage Request */}
        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                สร้างคำขอเบิกใช้ใหม่
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>รายการสินค้า * {loadingEq && <Loader2 className="w-3 h-3 inline animate-spin ml-1" />}</Label>
                <Select value={eqName} onValueChange={setEqName}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="ค้นหาและเลือกสินค้า" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipments.length === 0 ? (
                      <SelectItem value="__none" disabled>ไม่มีรายการอุปกรณ์</SelectItem>
                    ) : (
                      equipments.map(eq => (
                        <SelectItem key={eq.id} value={eq.equipment_name}>
                          {eq.equipment_name} (คงเหลือ: {eq.current_qty} {eq.unit})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>จำนวนที่ต้องการ *</Label>
                  <Input type="number" placeholder="ระบุจำนวน" required value={eqQty} onChange={e => setEqQty(e.target.value)} />
                </div>
                <div>
                  <Label>แผนกผู้เบิก *</Label>
                  <Select value={eqDept} onValueChange={setEqDept}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="เลือกแผนก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">แผนกขาย</SelectItem>
                      <SelectItem value="procurement">แผนกจัดซื้อ</SelectItem>
                      <SelectItem value="production">แผนกผลิต</SelectItem>
                      <SelectItem value="accounting">แผนกบัญชี</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>ผู้เบิก</Label>
                <Input value={eqRequester} disabled />
              </div>

              <div>
                <Label>เหตุผลในการเบิก</Label>
                <Textarea placeholder="ระบุเหตุผลในการเบิก..." rows={3} value={eqReason} onChange={e => setEqReason(e.target.value)} />
              </div>

              <Button onClick={handleEquipmentRequest} className="w-full" disabled={isEqSubmitting}>
                {isEqSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังส่ง...</> : "ส่งคำขอเบิกใช้"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Vehicle Booking */}
        <TabsContent value="vehicle">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                สร้างคำขอจองรถใหม่
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>ประเภทรถที่ต้องการ</Label>
                <Select value={vehicleType} onValueChange={setVehicleType}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภทรถ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedan">รถเก๋ง</SelectItem>
                    <SelectItem value="van">รถตู้</SelectItem>
                    <SelectItem value="pickup">รถกระบะ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>วัตถุประสงค์ในการใช้</Label>
                <Textarea placeholder="ระบุวัตถุประสงค์..." rows={3} value={vehiclePurpose} onChange={e => setVehiclePurpose(e.target.value)} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>วันที่และเวลาที่เริ่มใช้</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDateTime && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDateTime ? format(startDateTime, "PPP HH:mm") : "เลือกวันที่และเวลา"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDateTime}
                        onSelect={setStartDateTime}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>วันที่และเวลาที่สิ้นสุด</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDateTime && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDateTime ? format(endDateTime, "PPP HH:mm") : "เลือกวันที่และเวลา"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDateTime}
                        onSelect={setEndDateTime}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label>จำนวนผู้เดินทาง</Label>
                <Input type="number" placeholder="ระบุจำนวนคน" min="1" value={passengerCount} onChange={e => setPassengerCount(e.target.value)} />
              </div>

              <Button onClick={handleVehicleBooking} className="w-full" disabled={isVehicleSubmitting}>
                {isVehicleSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังส่ง...</> : "ส่งคำขอจองรถ"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
