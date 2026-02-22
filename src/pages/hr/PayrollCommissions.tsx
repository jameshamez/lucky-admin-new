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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Calculator, Send, Eye, DollarSign } from "lucide-react";

const salesData = [
  {
    id: "EMP-001",
    name: "คุณสมชาย ใจดี",
    department: "ฝ่ายขาย",
    totalSales: 580000,
    commissionRate: 3.5,
    commissionAmount: 20300,
    month: "มกราคม 2024",
    status: "คำนวณแล้ว",
    paidDate: null
  },
  {
    id: "EMP-002",
    name: "คุณสมหญิง รวยเงิน",
    department: "ฝ่ายขาย",
    totalSales: 125000,
    commissionRate: 2.5,
    commissionAmount: 3125,
    month: "มกราคม 2024",
    status: "รอคำนวณ",
    paidDate: null
  },
];

const payrollData = [
  {
    id: "EMP-001",
    name: "คุณสมชาย ใจดี",
    position: "หัวหน้าฝ่ายขาย",
    baseSalary: 35000,
    commission: 20300,
    bonus: 5000,
    deductions: 2000,
    netPay: 58300,
    month: "มกราคม 2024",
    status: "จ่ายแล้ว"
  },
  {
    id: "EMP-002",
    name: "คุณสมหญิง รวยเงิน",
    position: "พนักงานขาย",
    baseSalary: 25000,
    commission: 3125,
    bonus: 0,
    deductions: 1500,
    netPay: 26625,
    month: "มกราคม 2024",
    status: "รอจ่าย"
  },
  {
    id: "EMP-003",
    name: "คุณสมศักดิ์ ทำงาน",
    position: "นักออกแบบกราฟิก",
    baseSalary: 28000,
    commission: 0,
    bonus: 2000,
    deductions: 1400,
    netPay: 28600,
    month: "มกราคม 2024",
    status: "รอจ่าย"
  }
];

export default function PayrollCommissions() {
  const [isCalculateDialogOpen, setIsCalculateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ค่าตอบแทนและค่าคอมมิชชัน</h1>
          <p className="text-muted-foreground">คำนวณและจัดการเงินเดือนและค่าคอมมิชชันพนักงาน</p>
        </div>
        <Dialog open={isCalculateDialogOpen} onOpenChange={setIsCalculateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary-hover">
              <Calculator className="w-4 h-4 mr-2" />
              คำนวณค่าคอมมิชชัน
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>คำนวณค่าคอมมิชชัน</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="month">เลือกเดือน</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกเดือน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024-01">มกราคม 2024</SelectItem>
                    <SelectItem value="2023-12">ธันวาคม 2023</SelectItem>
                    <SelectItem value="2023-11">พฤศจิกายน 2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee">เลือกพนักงาน</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกพนักงาน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกคน</SelectItem>
                    <SelectItem value="EMP-001">คุณสมชาย ใจดี</SelectItem>
                    <SelectItem value="EMP-002">คุณสมหญิง รวยเงิน</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCalculateDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button 
                className="bg-gradient-to-r from-primary to-primary-hover"
                onClick={() => setIsCalculateDialogOpen(false)}
              >
                คำนวณ
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ค่าคอมมิชชันเดือนนี้</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿23,425</div>
            <p className="text-xs text-muted-foreground">
              จาก 2 คน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เงินเดือนรวมเดือนนี้</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿113,525</div>
            <p className="text-xs text-muted-foreground">
              จาก 3 คน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอการจ่าย</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              คน
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">จ่ายแล้วเดือนนี้</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿58,300</div>
            <p className="text-xs text-muted-foreground">
              1 คน
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="commission" className="space-y-4">
        <TabsList>
          <TabsTrigger value="commission">ค่าคอมมิชชัน</TabsTrigger>
          <TabsTrigger value="payroll">เงินเดือนรวม</TabsTrigger>
        </TabsList>

        <TabsContent value="commission" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="ค้นหาพนักงาน..." className="pl-10" />
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="เลือกเดือน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-01">มกราคม 2024</SelectItem>
                <SelectItem value="2023-12">ธันวาคม 2023</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Commission Table */}
          <Card>
            <CardHeader>
              <CardTitle>ค่าคอมมิชชันตามยอดขาย</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead>ยอดขายรวม</TableHead>
                    <TableHead>อัตราคอมมิชชัน</TableHead>
                    <TableHead>ค่าคอมมิชชัน</TableHead>
                    <TableHead>เดือน</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.map((sale) => (
                    <TableRow key={`${sale.id}-${sale.month}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{sale.name}</p>
                          <p className="text-xs text-muted-foreground">{sale.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>฿{sale.totalSales.toLocaleString()}</TableCell>
                      <TableCell>{sale.commissionRate}%</TableCell>
                      <TableCell className="font-semibold">
                        ฿{sale.commissionAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>{sale.month}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={sale.status === "คำนวณแล้ว" ? "default" : "destructive"}
                        >
                          {sale.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            ดู
                          </Button>
                          {sale.status === "คำนวณแล้ว" && (
                            <Button size="sm">
                              <Send className="w-4 h-4 mr-1" />
                              ส่งให้บัญชี
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

        <TabsContent value="payroll" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="ค้นหาพนักงาน..." className="pl-10" />
            </div>
            <Select>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="เลือกเดือน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-01">มกราคม 2024</SelectItem>
                <SelectItem value="2023-12">ธันวาคม 2023</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payroll Table */}
          <Card>
            <CardHeader>
              <CardTitle>เงินเดือนรวมทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead>เงินเดือนพื้นฐาน</TableHead>
                    <TableHead>ค่าคอมมิชชัน</TableHead>
                    <TableHead>โบนัส</TableHead>
                    <TableHead>หัก</TableHead>
                    <TableHead>รับสุทธิ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollData.map((payroll) => (
                    <TableRow key={`${payroll.id}-${payroll.month}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{payroll.name}</p>
                          <p className="text-xs text-muted-foreground">{payroll.position}</p>
                        </div>
                      </TableCell>
                      <TableCell>฿{payroll.baseSalary.toLocaleString()}</TableCell>
                      <TableCell>฿{payroll.commission.toLocaleString()}</TableCell>
                      <TableCell>฿{payroll.bonus.toLocaleString()}</TableCell>
                      <TableCell>฿{payroll.deductions.toLocaleString()}</TableCell>
                      <TableCell className="font-semibold">
                        ฿{payroll.netPay.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={payroll.status === "จ่ายแล้ว" ? "default" : "destructive"}
                        >
                          {payroll.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            ดูรายละเอียด
                          </Button>
                          {payroll.status === "รอจ่าย" && (
                            <Button size="sm">
                              <Send className="w-4 h-4 mr-1" />
                              ส่งให้บัญชี
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