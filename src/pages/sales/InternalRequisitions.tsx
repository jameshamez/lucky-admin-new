import { useState } from "react";
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
import { CalendarIcon, Package, ClipboardList, Car, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { th } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

export default function InternalRequisitions() {
  const [materialDate, setMaterialDate] = useState<Date>();
  const [pickupDate, setPickupDate] = useState<Date>();
  const [vehicleStartDate, setVehicleStartDate] = useState<Date>();
  const [vehicleEndDate, setVehicleEndDate] = useState<Date>();
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);

  // Mock data for purchase history
  const purchaseHistory = [
    { id: 1, item: "กระดาษ A4", quantity: 5, status: "อนุมัติแล้ว", date: "2024-01-15" },
    { id: 2, item: "หมึกพิมพ์", quantity: 3, status: "รออนุมัติ", date: "2024-01-16" },
  ];

  // Mock data for usage history
  const usageHistory = [
    { id: 1, item: "ปากกา", quantity: 20, department: "ขาย", date: "2024-01-14" },
    { id: 2, item: "กระดาษ A4", quantity: 2, department: "ขาย", date: "2024-01-15" },
  ];

  // Mock data for vehicle booking history
  const vehicleHistory = [
    { id: 1, vehicle: "รถตู้", purpose: "ส่งของลูกค้า", startDate: "2024-01-15 09:00", endDate: "2024-01-15 17:00", status: "อนุมัติแล้ว" },
    { id: 2, vehicle: "รถกระบะ", purpose: "จัดส่งสินค้า", startDate: "2024-01-16 08:00", endDate: "2024-01-16 12:00", status: "รออนุมัติ" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "อนุมัติแล้ว":
        return "bg-green-500";
      case "รออนุมัติ":
        return "bg-yellow-500";
      case "ปฏิเสธ":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

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

        {/* Material/Equipment Purchase Request */}
        <TabsContent value="purchase" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>เบิกซื้อวัสดุอุปกรณ์</CardTitle>
              <CardDescription>สร้างคำขอให้ฝ่ายจัดซื้อดำเนินการซื้อวัสดุหรืออุปกรณ์</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
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
                      <Input id="material-name" placeholder="กรอกชื่ออุปกรณ์หรือวัสดุ" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-quantity">จำนวนที่ต้องการ *</Label>
                      <Input id="material-quantity" type="number" placeholder="กรอกจำนวน" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-reason">เหตุผลในการเบิก</Label>
                      <Textarea id="material-reason" placeholder="กรอกเหตุผลในการเบิก" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-budget">งบประมาณโดยประมาณ</Label>
                      <Input id="material-budget" type="number" placeholder="กรอกงบประมาณ (บาท)" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="material-file">ไฟล์แนบ</Label>
                      <Input id="material-file" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                      <p className="text-xs text-muted-foreground">รองรับไฟล์: PDF, JPG, PNG</p>
                    </div>
                    <div className="space-y-2">
                      <Label>วันที่ต้องการใช้งาน *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !materialDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {materialDate ? format(materialDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={materialDate}
                            onSelect={setMaterialDate}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <Button className="w-full">ส่งคำขอเบิกซื้อ</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">ประวัติคำขอเบิกซื้อ</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>รายการ</TableHead>
                        <TableHead>จำนวน</TableHead>
                        <TableHead>วันที่</TableHead>
                        <TableHead>สถานะ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.item}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.date}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Usage Request */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>เบิกใช้อุปกรณ์</CardTitle>
              <CardDescription>เบิกใช้สต็อกวัสดุสำนักงานหรืออุปกรณ์ที่มีอยู่แล้วในคลัง</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
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
                      <Label htmlFor="usage-item">รายการสินค้า *</Label>
                      <Select>
                        <SelectTrigger id="usage-item">
                          <SelectValue placeholder="เลือกรายการสินค้า" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pen">ปากกา (สต็อกคงเหลือ: 100)</SelectItem>
                          <SelectItem value="paper">กระดาษ A4 (สต็อกคงเหลือ: 50)</SelectItem>
                          <SelectItem value="notebook">สมุดโน้ต (สต็อกคงเหลือ: 30)</SelectItem>
                          <SelectItem value="stapler">เครื่องเย็บกระดาษ (สต็อกคงเหลือ: 15)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage-quantity">จำนวนที่ต้องการ *</Label>
                      <Input id="usage-quantity" type="number" placeholder="กรอกจำนวน" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage-department">แผนกผู้เบิก *</Label>
                      <Select>
                        <SelectTrigger id="usage-department">
                          <SelectValue placeholder="เลือกแผนก" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">ขาย</SelectItem>
                          <SelectItem value="design">กราฟิก</SelectItem>
                          <SelectItem value="procurement">จัดซื้อ</SelectItem>
                          <SelectItem value="production">ผลิตและจัดส่ง</SelectItem>
                          <SelectItem value="accounting">บัญชี</SelectItem>
                          <SelectItem value="hr">บุคคล</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage-requester">ผู้เบิก *</Label>
                      <Input id="usage-requester" value="ผู้ใช้งานปัจจุบัน" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="usage-reason">เหตุผลในการเบิก</Label>
                      <Textarea id="usage-reason" placeholder="กรอกเหตุผลในการเบิก" rows={3} />
                    </div>
                    <Button className="w-full">ส่งคำขอเบิกใช้</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">ประวัติการเบิกใช้</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>รายการ</TableHead>
                        <TableHead>จำนวน</TableHead>
                        <TableHead>แผนก</TableHead>
                        <TableHead>วันที่</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usageHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.item}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{item.department}</TableCell>
                          <TableCell>{item.date}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicle Booking */}
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
                      <Select>
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
                      <Textarea id="vehicle-purpose" placeholder="กรอกวัตถุประสงค์ในการใช้รถ" rows={3} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>วันที่และเวลาที่เริ่มใช้ *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !vehicleStartDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {vehicleStartDate ? format(vehicleStartDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={vehicleStartDate}
                              onSelect={setVehicleStartDate}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <Input type="time" className="mt-2" />
                      </div>
                      <div className="space-y-2">
                        <Label>วันที่และเวลาที่สิ้นสุด *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !vehicleEndDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {vehicleEndDate ? format(vehicleEndDate, "PPP", { locale: th }) : <span>เลือกวันที่</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={vehicleEndDate}
                              onSelect={setVehicleEndDate}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <Input type="time" className="mt-2" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicle-requester">ผู้ขอเบิกใช้รถ *</Label>
                      <Input id="vehicle-requester" placeholder="กรอกชื่อผู้ขอใช้รถ" />
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        toast({
                          title: "ส่งคำขอจองรถสำเร็จ",
                          description: "คำขอจองรถของคุณถูกส่งเรียบร้อยแล้ว รอการอนุมัติ",
                        });
                        setIsVehicleDialogOpen(false);
                      }}
                    >
                      ส่งคำขอจองรถ
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
                />
                <p className="text-sm text-muted-foreground mt-2">
                  * วันที่มีสีเข้ม = มีการจองรถแล้ว
                </p>
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
                      {vehicleHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.vehicle}</TableCell>
                          <TableCell>{item.purpose}</TableCell>
                          <TableCell>{item.startDate}</TableCell>
                          <TableCell>{item.endDate}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
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
