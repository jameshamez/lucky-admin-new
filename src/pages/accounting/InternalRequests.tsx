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
import { Search, Check, X, Eye, Car, Package, User } from "lucide-react";

const materialRequests = [
  {
    id: "REQ-001",
    department: "ฝ่ายกราฟิก",
    requester: "คุณสมชาย",
    items: "กระดาษ A4, หมึกเครื่องพิมพ์",
    amount: 2500,
    requestDate: "2024-01-15",
    status: "รออนุมัติ",
    priority: "ปกติ"
  },
  {
    id: "REQ-002",
    department: "ฝ่ายผลิต",
    requester: "คุณสมหญิง",
    items: "วัสดุผลิตสินค้า",
    amount: 15000,
    requestDate: "2024-01-16",
    status: "อนุมัติแล้ว",
    priority: "ด่วน"
  },
];

const vehicleRequests = [
  {
    id: "VEH-001",
    requester: "คุณสมศักดิ์ - ฝ่ายขาย",
    purpose: "เข้าพบลูกค้าบริษัท ABC",
    date: "2024-01-20",
    distance: "45 กม.",
    estimatedCost: 800,
    status: "รออนุมัติ"
  },
  {
    id: "VEH-002",
    requester: "คุณสมปอง - ฝ่ายจัดซื้อ",
    purpose: "รับวัสดุจากซัพพลายเออร์",
    date: "2024-01-18",
    distance: "25 กม.",
    estimatedCost: 500,
    status: "อนุมัติแล้ว"
  },
];

const employeeExpenses = [
  {
    id: "EMP-001",
    employee: "คุณสมชาย - ฝ่ายขาย",
    type: "ค่าเดินทาง",
    description: "เข้าพบลูกค้าต่างจังหวัด",
    amount: 3500,
    receiptDate: "2024-01-10",
    status: "รออนุมัติ"
  },
  {
    id: "EMP-002",
    employee: "คุณสมหญิง - ฝ่ายกราฟิก",
    type: "ค่าเบี้ยเลี้ยง",
    description: "งานติดตั้งที่ลูกค้า",
    amount: 1200,
    receiptDate: "2024-01-12",
    status: "อนุมัติแล้ว"
  },
];

export default function InternalRequests() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">คำขอการเบิกจ่าย</h1>
          <p className="text-muted-foreground">อนุมัติคำขอเบิกจ่ายจากภายในองค์กร</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คำขอรออนุมัติ</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              รายการ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดรวมที่รออนุมัติ</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿25,400</div>
            <p className="text-xs text-muted-foreground">
              จากคำขอทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อนุมัติเดือนนี้</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿45,800</div>
            <p className="text-xs text-muted-foreground">
              12 รายการ
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="materials" className="space-y-4">
        <TabsList>
          <TabsTrigger value="materials">
            <Package className="w-4 h-4 mr-2" />
            วัสดุอุปกรณ์
          </TabsTrigger>
          <TabsTrigger value="vehicle">
            <Car className="w-4 h-4 mr-2" />
            รถส่วนกลาง
          </TabsTrigger>
          <TabsTrigger value="expenses">
            <User className="w-4 h-4 mr-2" />
            ค่าใช้จ่ายพนักงาน
          </TabsTrigger>
        </TabsList>

        {/* Material Requests */}
        <TabsContent value="materials" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="ค้นหาคำขอ..." className="pl-10" />
            </div>
            <Button variant="outline">รออนุมัติเท่านั้น</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>คำขอวัสดุอุปกรณ์</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสคำขอ</TableHead>
                    <TableHead>ฝ่าย/ผู้ขอ</TableHead>
                    <TableHead>รายการ</TableHead>
                    <TableHead>ยอดเงิน</TableHead>
                    <TableHead>วันที่ขอ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materialRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{request.department}</p>
                          <p className="text-xs text-muted-foreground">{request.requester}</p>
                        </div>
                      </TableCell>
                      <TableCell>{request.items}</TableCell>
                      <TableCell>฿{request.amount.toLocaleString()}</TableCell>
                      <TableCell>{request.requestDate}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={request.status === "รออนุมัติ" ? "destructive" : "default"}
                        >
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            ดู
                          </Button>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicle Requests */}
        <TabsContent value="vehicle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>คำขอใช้รถส่วนกลาง</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสคำขอ</TableHead>
                    <TableHead>ผู้ขอ</TableHead>
                    <TableHead>วัตถุประสงค์</TableHead>
                    <TableHead>วันที่ใช้</TableHead>
                    <TableHead>ระยะทาง</TableHead>
                    <TableHead>ค่าใช้จ่ายประมาณ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>{request.requester}</TableCell>
                      <TableCell>{request.purpose}</TableCell>
                      <TableCell>{request.date}</TableCell>
                      <TableCell>{request.distance}</TableCell>
                      <TableCell>฿{request.estimatedCost}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={request.status === "รออนุมัติ" ? "destructive" : "default"}
                        >
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Employee Expenses */}
        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ค่าใช้จ่ายพนักงาน</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัส</TableHead>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>จำนวนเงิน</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.id}</TableCell>
                      <TableCell>{expense.employee}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.type}</Badge>
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>฿{expense.amount.toLocaleString()}</TableCell>
                      <TableCell>{expense.receiptDate}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={expense.status === "รออนุมัติ" ? "destructive" : "default"}
                        >
                          {expense.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            ดูใบเสร็จ
                          </Button>
                          {expense.status === "รออนุมัติ" && (
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