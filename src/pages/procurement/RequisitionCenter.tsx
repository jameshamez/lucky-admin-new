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

const API_BASE = "https://finfinphone.com/api-lucky/admin";

export default function RequisitionCenter() {
  const [usageDate, setUsageDate] = useState<Date>();
  const [startDateTime, setStartDateTime] = useState<Date>();
  const [endDateTime, setEndDateTime] = useState<Date>();

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

  const handleMaterialRequest = () => {
    toast.success("ส่งคำขอเบิกซื้อวัสดุอุปกรณ์เรียบร้อย");
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

  const handleVehicleBooking = () => {
    toast.success("ส่งคำขอจองรถส่วนกลางเรียบร้อย");
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
                  <Input placeholder="ระบุชื่ออุปกรณ์หรือวัสดุ" required />
                </div>
                <div>
                  <Label>จำนวนที่ต้องการ *</Label>
                  <Input type="number" placeholder="ระบุจำนวน" required />
                </div>
              </div>

              <div>
                <Label>เหตุผลในการเบิก</Label>
                <Textarea placeholder="ระบุเหตุผล..." rows={3} />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>งบประมาณโดยประมาณ</Label>
                  <Input type="number" placeholder="0.00" />
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
                <Input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" />
              </div>

              <Button onClick={handleMaterialRequest} className="w-full">
                ส่งคำขอเบิกซื้อ
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
                <Select>
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
                <Textarea placeholder="ระบุวัตถุประสงค์..." rows={3} />
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
                <Input type="number" placeholder="ระบุจำนวนคน" min="1" />
              </div>

              <Button onClick={handleVehicleBooking} className="w-full">
                ส่งคำขอจองรถ
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
