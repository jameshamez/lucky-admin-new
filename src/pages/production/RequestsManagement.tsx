import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, Car, Package, Check, X } from "lucide-react";

const vehicleRequests = [
  {
    id: "VEH-001",
    purpose: "จัดส่งสินค้าลูกค้า ABC",
    destination: "บริษัท ABC จำกัด - สาขาสีลม",
    requestDate: "2024-01-20",
    useDate: "2024-01-22",
    estimatedDistance: "45 กม.",
    driver: "คุณสมชาย",
    status: "รออนุมัติ",
    requestedBy: "ทีม A"
  },
  {
    id: "VEH-002", 
    purpose: "รับวัสดุจากซัพพลายเออร์",
    destination: "บริษัท Material Supply Co.",
    requestDate: "2024-01-19",
    useDate: "2024-01-21",
    estimatedDistance: "25 กม.",
    driver: "คุณสมหญิง",
    status: "อนุมัติแล้ว",
    requestedBy: "ทีม B"
  },
  {
    id: "VEH-003",
    purpose: "จัดส่งสินค้าด่วน",
    destination: "ร้าน XYZ - ถนนรัชดาภิเษก",
    requestDate: "2024-01-18",
    useDate: "2024-01-20",
    estimatedDistance: "32 กม.",
    driver: "คุณสมศักดิ์",
    status: "ใช้งานแล้ว",
    requestedBy: "ทีม C"
  }
];

const internalRequests = [
  {
    id: "REQ-001",
    department: "ฝ่ายกราฟิก",
    requester: "คุณสมชาย",
    items: "กระดาษ A4 (10 รีม), หมึกสี (5 ขวด)",
    requestDate: "2024-01-20",
    urgency: "ปกติ",
    status: "รออนุมัติ",
    reason: "สำหรับงานออกแบบโปรเจคใหม่"
  },
  {
    id: "REQ-002",
    department: "ฝ่ายขาย",
    requester: "คุณสมหญิง",
    items: "โบรชัวร์ (500 ชิ้น), นามบัตร (200 ชิ้น)",
    requestDate: "2024-01-19",
    urgency: "ด่วน",
    status: "อนุมัติแล้ว",
    reason: "งานแสดงสินค้าวันที่ 25 ม.ค."
  }
];

export default function RequestsManagement() {
  const [isVehicleDialogOpen, setIsVehicleDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "รออนุมัติ": return "destructive";
      case "อนุมัติแล้ว": return "default";
      case "ใช้งานแล้ว": return "secondary";
      case "ปฏิเสธ": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">คำขอและการจัดการอื่นๆ</h1>
          <p className="text-muted-foreground">จัดการคำขอใช้รถและคำขอเบิกสินค้าจากภายใน</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คำขอใช้รถรออนุมัติ</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicleRequests.filter(req => req.status === "รออนุมัติ").length}
            </div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รถใช้งานวันนี้</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vehicleRequests.filter(req => req.status === "อนุมัติแล้ว").length}
            </div>
            <p className="text-xs text-muted-foreground">คัน</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คำขอเบิกรออนุมัติ</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {internalRequests.filter(req => req.status === "รออนุมัติ").length}
            </div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คำขอเบิกด่วน</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {internalRequests.filter(req => req.urgency === "ด่วน").length}
            </div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vehicle" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vehicle">
            <Car className="w-4 h-4 mr-2" />
            คำขอใช้รถ
          </TabsTrigger>
          <TabsTrigger value="internal">
            <Package className="w-4 h-4 mr-2" />
            คำขอเบิกจากภายใน
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vehicle" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="ค้นหาคำขอ..." className="pl-10" />
              </div>
            </div>
            <Dialog open={isVehicleDialogOpen} onOpenChange={setIsVehicleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary-hover">
                  <Plus className="w-4 h-4 mr-2" />
                  ขอใช้รถใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>ขอใช้รถส่วนกลาง</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="purpose">วัตถุประสงค์</Label>
                    <Input id="purpose" placeholder="เช่น จัดส่งสินค้า, รับวัสดุ" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="destination">ปลายทาง</Label>
                    <Textarea id="destination" placeholder="ที่อยู่ปลายทางที่จะไป" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="use-date">วันที่ใช้</Label>
                      <Input id="use-date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="distance">ระยะทางประมาณ</Label>
                      <Input id="distance" placeholder="เช่น 25 กม." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="driver-pref">คนขับที่ต้องการ</Label>
                    <Input id="driver-pref" placeholder="ระบุชื่อหรือเว้นว่างไว้" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">หมายเหตุ</Label>
                    <Textarea id="notes" placeholder="รายละเอียดเพิ่มเติม" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsVehicleDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-primary to-primary-hover"
                    onClick={() => setIsVehicleDialogOpen(false)}
                  >
                    ส่งคำขอ
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>รายการคำขอใช้รถ</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสคำขอ</TableHead>
                    <TableHead>วัตถุประสงค์</TableHead>
                    <TableHead>ปลายทาง</TableHead>
                    <TableHead>วันที่ใช้</TableHead>
                    <TableHead>ระยะทาง</TableHead>
                    <TableHead>คนขับ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>{request.purpose}</TableCell>
                      <TableCell>{request.destination}</TableCell>
                      <TableCell>{request.useDate}</TableCell>
                      <TableCell>{request.estimatedDistance}</TableCell>
                      <TableCell>{request.driver}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {request.status === "รออนุมัติ" && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <Check className="w-4 h-4 mr-1" />
                                อนุมัติ
                              </Button>
                              <Button size="sm" variant="destructive">
                                <X className="w-4 h-4 mr-1" />
                                ปฏิเสธ
                              </Button>
                            </>
                          )}
                          {request.status !== "รออนุมัติ" && (
                            <Button size="sm" variant="outline">
                              ดูรายละเอียด
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="internal" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="ค้นหาคำขอ..." className="pl-10" />
              </div>
            </div>
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-primary-hover">
                  <Plus className="w-4 h-4 mr-2" />
                  สร้างคำขอเบิกใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>คำขอเบิกสินค้าจากภายใน</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="req-department">แผนกผู้ขอ</Label>
                    <Input id="req-department" placeholder="เช่น ฝ่ายกราฟิก, ฝ่ายขาย" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-items">รายการที่ขอ</Label>
                    <Textarea id="req-items" placeholder="ระบุรายการและจำนวนที่ต้องการ" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-reason">เหตุผลการใช้งาน</Label>
                    <Textarea id="req-reason" placeholder="อธิบายการใช้งานหรือโครงการ" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="req-urgency">ความเร่งด่วน</Label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="ปกติ">ปกติ</option>
                      <option value="ด่วน">ด่วน</option>
                      <option value="ด่วนมาก">ด่วนมาก</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-primary to-primary-hover"
                    onClick={() => setIsRequestDialogOpen(false)}
                  >
                    ส่งคำขอ
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>รายการคำขอเบิกจากภายใน</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสคำขอ</TableHead>
                    <TableHead>แผนก/ผู้ขอ</TableHead>
                    <TableHead>รายการ</TableHead>
                    <TableHead>วันที่ขอ</TableHead>
                    <TableHead>ความเร่งด่วน</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {internalRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{request.department}</p>
                          <p className="text-sm text-muted-foreground">{request.requester}</p>
                        </div>
                      </TableCell>
                      <TableCell>{request.items}</TableCell>
                      <TableCell>{request.requestDate}</TableCell>
                      <TableCell>
                        <Badge variant={request.urgency === "ด่วน" ? "destructive" : "secondary"}>
                          {request.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {request.status === "รออนุมัติ" && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <Check className="w-4 h-4 mr-1" />
                                อนุมัติ
                              </Button>
                              <Button size="sm" variant="destructive">
                                <X className="w-4 h-4 mr-1" />
                                ปฏิเสธ
                              </Button>
                            </>
                          )}
                          {request.status !== "รออนุมัติ" && (
                            <Button size="sm" variant="outline">
                              ดูรายละเอียด
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}