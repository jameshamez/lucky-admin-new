import { useState, useEffect, useMemo } from "react";
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
import { Search, Check, X, Eye, Car, Package, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { accountingStockService } from "@/services/materialStockService";
import { productionService } from "@/services/productionService";
import { accountingService } from "@/services/accountingService";

interface MaterialRequestRow {
  id: number;
  department: string;
  requester: string;
  material_name: string;
  qty: number;
  request_date: string;
  status: string;
}

interface VehicleRequestRow {
  id: number;
  requester: string;
  purpose: string;
  start_datetime: string;
  vehicle_type: string;
  status: string;
}

interface EmployeeExpenseRow {
  id: string;
  employee: string;
  department: string | null;
  type: string;
  description: string;
  amount: number;
  receiptDate: string;
  receiptUrl: string | null;
  status: string;
}

export default function InternalRequests() {
  const [materialRequests, setMaterialRequests] = useState<MaterialRequestRow[]>([]);
  const [vehicleRequests, setVehicleRequests] = useState<VehicleRequestRow[]>([]);
  const [employeeExpenses, setEmployeeExpenses] = useState<EmployeeExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [matRes, vehRes, empRes] = await Promise.all([
        accountingStockService.getRequests({ limit: 100 }),
        fetch("https://nacres.co.th/api-lucky/admin/vehicle_reservations.php").then(r => r.json()),
        accountingService.getEmployeeExpenses(),
      ]);
      if (matRes.status === "success") setMaterialRequests(matRes.data || []);
      if (vehRes.status === "success") setVehicleRequests(vehRes.data || []);
      if (empRes.status === "success") setEmployeeExpenses(empRes.data || []);
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลคำขอเบิกจ่ายได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const isPending = (status: string) => status === "รออนุมัติ" || status === "บันทึกแล้ว";

  const filteredMaterialRequests = useMemo(() => {
    return materialRequests.filter((r) => {
      if (pendingOnly && !isPending(r.status)) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        String(r.id).toLowerCase().includes(term) ||
        (r.department || "").toLowerCase().includes(term) ||
        (r.requester || "").toLowerCase().includes(term) ||
        (r.material_name || "").toLowerCase().includes(term)
      );
    });
  }, [materialRequests, searchTerm, pendingOnly]);

  // Summary cards computed from real data across all 3 categories
  const summary = useMemo(() => {
    const thisMonth = new Date().toISOString().slice(0, 7);
    let pendingCount = 0, pendingTotal = 0, approvedCount = 0, approvedTotal = 0;

    for (const r of materialRequests) {
      const amount = 0; // material_requests has no monetary value column
      if (isPending(r.status)) { pendingCount++; pendingTotal += amount; }
      else if (r.status === "อนุมัติแล้ว" && r.request_date?.startsWith(thisMonth)) { approvedCount++; approvedTotal += amount; }
    }
    for (const r of vehicleRequests) {
      if (r.status === "รออนุมัติ") pendingCount++;
      else if (r.status === "อนุมัติแล้ว" && r.start_datetime?.startsWith(thisMonth)) approvedCount++;
    }
    for (const e of employeeExpenses) {
      if (isPending(e.status)) { pendingCount++; pendingTotal += e.amount; }
      else if (e.status === "อนุมัติแล้ว" && e.receiptDate?.startsWith(thisMonth)) { approvedCount++; approvedTotal += e.amount; }
    }
    return { pendingCount, pendingTotal, approvedCount, approvedTotal };
  }, [materialRequests, vehicleRequests, employeeExpenses]);

  const handleMaterialStatus = async (id: number, status: string) => {
    const res = await accountingStockService.updateRequest(id, { status });
    if (res.status === "success") {
      toast.success("อัปเดตสถานะเรียบร้อย");
      fetchAll();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleVehicleStatus = async (id: number, status: string) => {
    let reject_reason: string | undefined;
    if (status === "ไม่อนุมัติ") {
      reject_reason = window.prompt("ระบุเหตุผลที่ไม่อนุมัติ") || undefined;
      if (!reject_reason) return;
    }
    const res = await productionService.updateVehicleReservationStatus(id, status, reject_reason);
    if (res.status === "success") {
      toast.success("อัปเดตสถานะเรียบร้อย");
      fetchAll();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleExpenseStatus = async (id: string, status: string) => {
    const res = await accountingService.updateEmployeeExpenseStatus(id, status);
    if (res.status === "success") {
      toast.success("อัปเดตสถานะเรียบร้อย");
      fetchAll();
    } else {
      toast.error(res.message || "เกิดข้อผิดพลาด");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            <div className="text-2xl font-bold">{summary.pendingCount}</div>
            <p className="text-xs text-muted-foreground">รายการ (วัสดุ+รถ+ค่าใช้จ่าย)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดรวมที่รออนุมัติ</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{summary.pendingTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">เฉพาะค่าใช้จ่ายพนักงาน (มีมูลค่าเงิน)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อนุมัติเดือนนี้</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{summary.approvedTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{summary.approvedCount} รายการ</p>
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
              <Input placeholder="ค้นหาคำขอ..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button variant={pendingOnly ? "default" : "outline"} onClick={() => setPendingOnly((v) => !v)}>รออนุมัติเท่านั้น</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>คำขอวัสดุอุปกรณ์ (ทุกแผนก)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสคำขอ</TableHead>
                    <TableHead>ฝ่าย/ผู้ขอ</TableHead>
                    <TableHead>รายการ</TableHead>
                    <TableHead>จำนวน</TableHead>
                    <TableHead>วันที่ขอ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaterialRequests.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">ไม่มีคำขอ</TableCell></TableRow>
                  ) : filteredMaterialRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">REQ-{request.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{request.department}</p>
                          <p className="text-xs text-muted-foreground">{request.requester}</p>
                        </div>
                      </TableCell>
                      <TableCell>{request.material_name}</TableCell>
                      <TableCell>{request.qty}</TableCell>
                      <TableCell>{request.request_date}</TableCell>
                      <TableCell>
                        <Badge variant={isPending(request.status) ? "destructive" : "default"}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {isPending(request.status) && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleMaterialStatus(request.id, "อนุมัติแล้ว")}>
                                <Check className="w-4 h-4 mr-1" />
                                อนุมัติ
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleMaterialStatus(request.id, "ปฏิเสธ")}>
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
                    <TableHead>ประเภทรถ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleRequests.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">ไม่มีคำขอ</TableCell></TableRow>
                  ) : vehicleRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">VEH-{request.id}</TableCell>
                      <TableCell>{request.requester}</TableCell>
                      <TableCell>{request.purpose}</TableCell>
                      <TableCell>{request.start_datetime?.slice(0, 10)}</TableCell>
                      <TableCell>{request.vehicle_type}</TableCell>
                      <TableCell>
                        <Badge variant={request.status === "รออนุมัติ" ? "destructive" : "default"}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {request.status === "รออนุมัติ" && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleVehicleStatus(request.id, "อนุมัติแล้ว")}>
                                <Check className="w-4 h-4 mr-1" />
                                อนุมัติ
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleVehicleStatus(request.id, "ไม่อนุมัติ")}>
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
                  {employeeExpenses.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">ไม่มีคำขอ</TableCell></TableRow>
                  ) : employeeExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">EMP-{expense.id}</TableCell>
                      <TableCell>{expense.employee}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.type}</Badge>
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>฿{expense.amount.toLocaleString()}</TableCell>
                      <TableCell>{expense.receiptDate}</TableCell>
                      <TableCell>
                        <Badge variant={expense.status === "รออนุมัติ" ? "destructive" : "default"}>
                          {expense.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {expense.receiptUrl && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="w-4 h-4 mr-1" />
                                ดูใบเสร็จ
                              </a>
                            </Button>
                          )}
                          {expense.status === "รออนุมัติ" && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleExpenseStatus(expense.id, "อนุมัติแล้ว")}>
                                <Check className="w-4 h-4 mr-1" />
                                อนุมัติ
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleExpenseStatus(expense.id, "ปฏิเสธ")}>
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
