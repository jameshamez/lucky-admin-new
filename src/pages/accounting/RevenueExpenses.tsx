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
import { Search, Plus, Eye, Calculator } from "lucide-react";

const revenueData = [
  { 
    id: "ORD-001", 
    customer: "บริษัท ABC จำกัด", 
    amount: 45000, 
    orderDate: "2024-01-15",
    paymentDate: "2024-01-20",
    status: "บันทึกแล้ว",
    materials: 15000,
    labor: 12000,
    commission: 2250
  },
  { 
    id: "ORD-002", 
    customer: "ร้าน XYZ", 
    amount: 28000, 
    orderDate: "2024-01-16",
    paymentDate: null,
    status: "รอบันทึก",
    materials: 9000,
    labor: 8000,
    commission: 1400
  },
];

const expenseData = [
  { id: "EXP-001", description: "ค่าเช่าสำนักงาน", amount: 35000, date: "2024-01-01", category: "ค่าเช่า" },
  { id: "EXP-002", description: "ค่าไฟฟ้า", amount: 8500, date: "2024-01-05", category: "สาธารณูปโภค" },
  { id: "EXP-003", description: "ค่าวัสดุสำนักงาน", amount: 12000, date: "2024-01-10", category: "วัสดุ" },
];

export default function RevenueExpenses() {
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">รายรับ-รายจ่าย</h1>
          <p className="text-muted-foreground">จัดการข้อมูลทางการเงิน</p>
        </div>
        <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary-hover">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มรายจ่าย
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>เพิ่มรายจ่ายใหม่</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="expense-description">รายละเอียด</Label>
                <Textarea
                  id="expense-description"
                  placeholder="กรอกรายละเอียดรายจ่าย"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">จำนวนเงิน (บาท)</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-date">วันที่</Label>
                  <Input
                    id="expense-date"
                    type="date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-category">หมวดหมู่</Label>
                <Input
                  id="expense-category"
                  placeholder="เช่น ค่าเช่า, สาธารณูปโภค"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsExpenseDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button 
                className="bg-gradient-to-r from-primary to-primary-hover"
                onClick={() => setIsExpenseDialogOpen(false)}
              >
                บันทึก
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">รายรับ</TabsTrigger>
          <TabsTrigger value="expenses">รายจ่าย</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="ค้นหาออเดอร์..." className="pl-10" />
            </div>
          </div>

          {/* Revenue Table */}
          <Card>
            <CardHeader>
              <CardTitle>รายรับจากออเดอร์</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>เลขที่ออเดอร์</TableHead>
                    <TableHead>ลูกค้า</TableHead>
                    <TableHead>ยอดเงิน</TableHead>
                    <TableHead>วันที่ออเดอร์</TableHead>
                    <TableHead>วันที่ชำระ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueData.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>฿{order.amount.toLocaleString()}</TableCell>
                      <TableCell>{order.orderDate}</TableCell>
                      <TableCell>
                        {order.paymentDate || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={order.status === "บันทึกแล้ว" ? "default" : "destructive"}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            ดูรายละเอียด
                          </Button>
                          {order.status === "รอบันทึก" && (
                            <Button size="sm">
                              <Calculator className="w-4 h-4 mr-1" />
                              บันทึกต้นทุน
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

        <TabsContent value="expenses" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="ค้นหารายจ่าย..." className="pl-10" />
            </div>
          </div>

          {/* Expenses Table */}
          <Card>
            <CardHeader>
              <CardTitle>รายจ่ายทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัส</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>จำนวนเงิน</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseData.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.id}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>฿{expense.amount.toLocaleString()}</TableCell>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          แก้ไข
                        </Button>
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