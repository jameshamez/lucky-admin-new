import { useState, useMemo, useEffect } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Search, Eye, FileText, AlertCircle, ShieldCheck, FilePlus, ArrowUpDown, FileCheck, Printer, Paperclip, Upload } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { accountingService } from "@/services/accountingService";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderData {
  id: string;
  orderType: string;
  quotationNo: string;
  customerName: string;
  lineId: string;
  address: string;
  phone: string;
  email: string;
  orderDate: string;
  usageDate: string;
  deliveryDate: string;
  deliveryMethod: string;
  taxInvoice: boolean;
  companyName?: string;
  taxId?: string;
  jobName: string;
  jobType: string;
  tags: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  paymentStatus: string;
  isClosed: boolean;
  urgency: string;
  orderChannel: string;
  shippingFee: number;
  productionDetail?: string;
  productionStaff?: string;
  productionDeadline?: string;
  productionStatus?: string;
  paymentProof?: {
    slipUrl: string;
    transferDate: string;
    transferAmount: number;
    bankName: string;
  }[];
}

type SortKey = "orderDate" | "deliveryDate" | "totalAmount" | "paidAmount" | "outstandingAmount" | null;
type SortDir = "asc" | "desc";

export default function Revenue() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifiedOrders, setVerifiedOrders] = useState<Set<string>>(new Set());
  const [documentCreated, setDocumentCreated] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyingOrder, setVerifyingOrder] = useState<OrderData | null>(null);
  const [verifyAmount, setVerifyAmount] = useState("");
  const [verifyFile, setVerifyFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await accountingService.getRevenueData();
      if (res.status === 'success') {
        setOrders(res.data.orders);
        setChartData(res.data.chartData);
      }
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลรายรับได้");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filteredOrders = useMemo(() => {
    let result = orders.filter(order => {
      const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || order.orderType === filterType;
      // Map frontend status to matches (e.g. 'รอชำระ' might be 'รอชำระเงิน' in API)
      const matchesStatus = filterStatus === "all" || (order.paymentStatus && order.paymentStatus.includes(filterStatus));
      return matchesSearch && matchesType && matchesStatus;
    });

    if (sortKey) {
      result = [...result].sort((a, b) => {
        let valA: string | number, valB: string | number;
        if (sortKey === "orderDate" || sortKey === "deliveryDate") {
          valA = a[sortKey as keyof OrderData] as string; valB = b[sortKey as keyof OrderData] as string;
        } else {
          valA = a[sortKey as keyof OrderData] as number; valB = b[sortKey as keyof OrderData] as number;
        }
        if (valA < valB) return sortDir === "asc" ? -1 : 1;
        if (valA > valB) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [orders, searchTerm, filterType, filterStatus, sortKey, sortDir]);

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + order.totalAmount, 0), [orders]);
  const avgMonthlyRevenue = chartData.length > 0 ? totalRevenue / chartData.length : 0;
  const pendingPayments = useMemo(() => orders.filter(o => o.paymentStatus && o.paymentStatus.includes("รอชำระ")).length, [orders]);

  const getStatusColor = (status: string) => {
    if (status.includes("ชำระครบ")) return "default";
    if (status.includes("มัดจำ")) return "secondary";
    if (status.includes("รอชำระ")) return "destructive";
    return "outline";
  };

  const getUrgencyColor = (urgency: string) => {
    if (!urgency) return "outline";
    if (urgency.includes("3-5")) return "destructive";
    if (urgency.includes("1 วัน")) return "destructive";
    if (urgency.includes("2 วัน")) return "secondary";
    if (urgency.includes("ด่วน")) return "destructive";
    return "outline";
  };

  const openVerifyDialog = (order: OrderData) => {
    setVerifyingOrder(order);
    setVerifyAmount(order.paidAmount > 0 ? order.paidAmount.toString() : "");
    setVerifyFile(null);
    setVerifyDialogOpen(true);
  };

  const handleConfirmVerify = () => {
    if (!verifyingOrder) return;
    const hasPaidProof = verifyingOrder.paymentProof && verifyingOrder.paymentProof.length > 0;
    if (!hasPaidProof && (!verifyAmount || Number(verifyAmount) <= 0)) {
      toast.error("กรุณาระบุยอดที่ชำระ");
      return;
    }
    setVerifiedOrders(prev => {
      const next = new Set(prev);
      next.add(verifyingOrder.id);
      return next;
    });
    const displayAmount = hasPaidProof
      ? verifyingOrder.paymentProof!.reduce((sum, p) => sum + p.transferAmount, 0)
      : Number(verifyAmount);
    toast.success(`ตรวจสอบรับยอดสำเร็จ: ${verifyingOrder.id} - ยอด ฿${displayAmount.toLocaleString()}`);
    setVerifyDialogOpen(false);
    setVerifyingOrder(null);
    setVerifyAmount("");
    setVerifyFile(null);
  };

  const handleGenerateDocument = (order: OrderData) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
    setDocumentCreated(prev => {
      const next = new Set(prev);
      next.add(order.id);
      return next;
    });
  };

  const SortableHead = ({ label, sortField }: { label: string; sortField: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
      onClick={() => handleSort(sortField)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
      </div>
    </TableHead>
  );

  const today = new Date().toISOString().split("T")[0];
  const docNumber = selectedOrder ? `DOC-${selectedOrder.id.replace("ORD-", "")}` : "";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">หน้ารายรับ</h1>
          <p className="text-muted-foreground">ระบบจัดการรายรับและออเดอร์ทั้งหมด</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">รายรับรวมทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">฿{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">ข้อมูล 12 เดือนย้อนหลัง</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">รายรับเฉลี่ยต่อเดือน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">฿{avgMonthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-success mt-1">+12.5% จากเดือนที่แล้ว</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">ออเดอร์รอชำระเงิน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{pendingPayments} ออเดอร์</div>
            <p className="text-xs text-muted-foreground mt-1">ต้องติดตามชำระเงิน</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>กราฟรายรับรวม 12 เดือนย้อนหลัง</CardTitle>
            <CardDescription>เปรียบเทียบยอดขายจริงกับเป้าหมาย</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={2} name="ยอดขายจริง" />
                  <Line type="monotone" dataKey="target" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" name="เป้าหมาย" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>เปรียบเทียบยอดขายตามประเภทสินค้า</CardTitle>
            <CardDescription>สินค้าสั่งผลิต vs สินค้าสำเร็จรูป</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} />
                  <Legend />
                  <Bar dataKey="custom" fill="hsl(var(--primary))" name="สินค้าสั่งผลิต" />
                  <Bar dataKey="readymade" fill="hsl(var(--accent))" name="สินค้าสำเร็จรูป" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการรับออเดอร์ทั้งหมด</CardTitle>
          <CardDescription>ข้อมูลออเดอร์และสถานะการชำระเงิน</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหารหัสออเดอร์หรือชื่อลูกค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="ประเภทการสั่งซื้อ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="สั่งผลิตภายนอก">สั่งผลิตภายนอก</SelectItem>
                <SelectItem value="สั่งผลิตภายใน">สั่งผลิตภายใน</SelectItem>
                <SelectItem value="สินค้าสำเร็จรูป">สินค้าสำเร็จรูป</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="สถานะการชำระเงิน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="รอชำระ">รอชำระ</SelectItem>
                <SelectItem value="มัดจำ">มัดจำ</SelectItem>
                <SelectItem value="ชำระครบ">ชำระครบ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table with custom scrollbar */}
          <div className="rounded-md border overflow-auto max-h-[600px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-destructive/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-destructive/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัสออเดอร์</TableHead>
                  <TableHead>ลูกค้า</TableHead>
                  <TableHead>ชื่องาน</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <SortableHead label="วันที่สั่ง" sortField="orderDate" />
                  <SortableHead label="วันที่ส่ง" sortField="deliveryDate" />
                  <SortableHead label="ยอดเงิน" sortField="totalAmount" />
                  <SortableHead label="ยอดชำระแล้ว" sortField="paidAmount" />
                  <SortableHead label="ยอดคงค้างชำระ" sortField="outstandingAmount" />
                  <TableHead>สถานะชำระ</TableHead>
                  <TableHead>ระดับความเร่งด่วน</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={13}><Skeleton className="h-12 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredOrders.map((order) => {
                  const isVerified = verifiedOrders.has(order.id);
                  const hasDocument = documentCreated.has(order.id);

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">{order.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.jobName}</div>
                          <div className="text-xs text-muted-foreground">{order.tags}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.orderType}</Badge>
                      </TableCell>
                      <TableCell>{order.orderDate}</TableCell>
                      <TableCell>{order.deliveryDate}</TableCell>
                      <TableCell className="text-right font-medium">
                        ฿{order.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium text-success">
                        ฿{order.paidAmount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={order.outstandingAmount > 0 ? "text-destructive" : "text-success"}>
                          ฿{order.outstandingAmount.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(order.paymentStatus)}>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getUrgencyColor(order.urgency)}>
                          {order.urgency}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isVerified ? (
                          <Badge className="bg-destructive text-destructive-foreground">ตรวจสอบแล้ว</Badge>
                        ) : order.isClosed ? (
                          <Badge variant="default">ปิดยอดแล้ว</Badge>
                        ) : (
                          <Badge variant="secondary">ยังไม่ปิดยอด</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {/* Verify Payment Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${isVerified ? "text-destructive" : "text-destructive hover:text-destructive"}`}
                            onClick={() => openVerifyDialog(order)}
                            disabled={isVerified}
                            title="ตรวจสอบรับยอด"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </Button>

                          {/* Generate Document Button */}
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleGenerateDocument(order)}
                              title="ออกเอกสาร"
                            >
                              <FilePlus className="w-4 h-4" />
                            </Button>
                            {hasDocument && (
                              <FileCheck className="w-3 h-3 text-destructive absolute -top-0.5 -right-0.5" />
                            )}
                          </div>

                          {/* View Detail Button */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" title="ดูรายละเอียด">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>รายละเอียดออเดอร์ {order.id}</DialogTitle>
                                <DialogDescription>ข้อมูลสั่งซื้อและการจัดส่งแบบละเอียด</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">ข้อมูลลูกค้า</p>
                                    <p className="font-medium">{order.customerName}</p>
                                    <p className="text-sm">{order.phone}</p>
                                    <p className="text-sm">{order.email}</p>
                                    <p className="text-sm">{order.lineId}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">ที่อยู่จัดส่ง</p>
                                    <p className="text-sm">{order.address}</p>
                                    <p className="text-sm mt-2">
                                      <span className="font-medium">วิธีจัดส่ง:</span> {order.deliveryMethod}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">รายละเอียดงาน</p>
                                  <p className="font-medium">{order.jobName}</p>
                                  <p className="text-sm">ประเภทงาน: {order.jobType}</p>
                                  <p className="text-sm">{order.tags}</p>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">วันที่สั่งซื้อ</p>
                                    <p className="font-medium">{order.orderDate}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">วันที่ใช้งาน</p>
                                    <p className="font-medium">{order.usageDate}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">วันที่จัดส่ง</p>
                                    <p className="font-medium">{order.deliveryDate}</p>
                                  </div>
                                </div>
                                {order.taxInvoice && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">ข้อมูลใบกำกับภาษี</p>
                                    <p className="text-sm">{order.companyName}</p>
                                    <p className="text-sm">เลขที่: {order.taxId}</p>
                                  </div>
                                )}
                                {order.productionDetail && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">ข้อมูลฝ่ายผลิต</p>
                                    <p className="text-sm">{order.productionDetail}</p>
                                    <p className="text-sm">ผู้รับผิดชอบ: {order.productionStaff}</p>
                                    <p className="text-sm">กำหนดส่ง: {order.productionDeadline}</p>
                                    <Badge variant="outline" className="mt-1">{order.productionStatus}</Badge>
                                  </div>
                                )}
                                <div className="pt-4 border-t">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-muted-foreground">ยอดรวม</span>
                                    <span className="font-medium">฿{order.totalAmount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-muted-foreground">ค่าขนส่ง</span>
                                    <span className="font-medium">฿{order.shippingFee.toLocaleString()}</span>
                                  </div>
                                  <div className="flex justify-between items-center font-bold text-lg">
                                    <span>ยอดสุทธิ</span>
                                    <span>฿{(order.totalAmount + order.shippingFee).toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      {pendingPayments > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm font-medium">
                มีออเดอร์ {pendingPayments} รายการที่ยังไม่ได้ชำระเงิน กรุณาติดตาม
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Side Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-3/4 sm:max-w-none overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-destructive/30 [&::-webkit-scrollbar-thumb]:rounded-full">
          {selectedOrder && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-xl">
                  {selectedOrder.taxInvoice ? "ใบเสร็จรับเงิน / ใบกำกับภาษี" : "บิลเงินสด"}
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.taxInvoice
                    ? "เอกสารตามข้อกำหนดกรมสรรพากร"
                    : "ใบเสร็จรับเงินทั่วไป (ไม่มีใบกำกับภาษี)"}
                </p>
              </SheetHeader>

              {/* Document Preview */}
              <div className="border rounded-lg p-8 bg-white text-foreground space-y-6 print:shadow-none">
                {/* Document Header */}
                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-bold">THE BRAVO</h2>
                  <p className="text-sm text-muted-foreground">123 ถนนสุขุมวิท กรุงเทพฯ 10110 | โทร: 02-000-0000</p>
                  {selectedOrder.taxInvoice && (
                    <p className="text-sm text-muted-foreground">เลขประจำตัวผู้เสียภาษี: 0-1234-56789-01-2</p>
                  )}
                  <div className="pt-2">
                    <Badge className="bg-destructive text-destructive-foreground text-base px-4 py-1">
                      {selectedOrder.taxInvoice ? "ใบเสร็จรับเงิน / ใบกำกับภาษี" : "บิลเงินสด"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Document Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">เลขที่เอกสาร:</span>
                      <span className="ml-2 font-medium">{docNumber}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">วันที่:</span>
                      <span className="ml-2 font-medium">{today}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">อ้างอิงออเดอร์:</span>
                      <span className="ml-2 font-medium">{selectedOrder.id}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-muted-foreground">ชื่อลูกค้า:</span>
                      <span className="ml-2 font-medium">{selectedOrder.customerName}</span>
                    </div>
                    {selectedOrder.taxInvoice && selectedOrder.companyName && (
                      <div>
                        <span className="text-muted-foreground">ชื่อบริษัท:</span>
                        <span className="ml-2 font-medium">{selectedOrder.companyName}</span>
                      </div>
                    )}
                    {selectedOrder.taxInvoice && selectedOrder.taxId && (
                      <div>
                        <span className="text-muted-foreground">เลขผู้เสียภาษี:</span>
                        <span className="ml-2 font-medium">{selectedOrder.taxId}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">ที่อยู่:</span>
                      <span className="ml-2 font-medium">{selectedOrder.address}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Items Table */}
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">ลำดับ</TableHead>
                        <TableHead>รายการ</TableHead>
                        <TableHead>ประเภท</TableHead>
                        <TableHead className="text-right">จำนวนเงิน (฿)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>1</TableCell>
                        <TableCell className="font-medium">{selectedOrder.jobName}</TableCell>
                        <TableCell>{selectedOrder.jobType}</TableCell>
                        <TableCell className="text-right">฿{selectedOrder.totalAmount.toLocaleString()}</TableCell>
                      </TableRow>
                      {selectedOrder.shippingFee > 0 && (
                        <TableRow>
                          <TableCell>2</TableCell>
                          <TableCell>ค่าขนส่ง ({selectedOrder.deliveryMethod})</TableCell>
                          <TableCell>บริการ</TableCell>
                          <TableCell className="text-right">฿{selectedOrder.shippingFee.toLocaleString()}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ยอดรวมก่อนภาษี</span>
                    <span>฿{(selectedOrder.totalAmount + selectedOrder.shippingFee).toLocaleString()}</span>
                  </div>
                  {selectedOrder.taxInvoice && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ภาษีมูลค่าเพิ่ม 7%</span>
                        <span>฿{((selectedOrder.totalAmount + selectedOrder.shippingFee) * 0.07).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold text-lg">
                        <span>ยอดรวมสุทธิ</span>
                        <span>฿{((selectedOrder.totalAmount + selectedOrder.shippingFee) * 1.07).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </>
                  )}
                  {!selectedOrder.taxInvoice && (
                    <div className="flex justify-between font-bold text-lg">
                      <span>ยอดรวมสุทธิ</span>
                      <span>฿{(selectedOrder.totalAmount + selectedOrder.shippingFee).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Payment Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">สถานะการชำระ:</span>
                    <Badge className="ml-2" variant={getStatusColor(selectedOrder.paymentStatus)}>
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ยอดชำระแล้ว:</span>
                    <span className="ml-2 font-medium text-success">฿{selectedOrder.paidAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Signature Area */}
                <div className="grid grid-cols-2 gap-8 pt-8 text-center text-sm">
                  <div>
                    <div className="border-b border-dashed mb-2 pb-8" />
                    <p className="text-muted-foreground">ผู้รับเงิน</p>
                  </div>
                  <div>
                    <div className="border-b border-dashed mb-2 pb-8" />
                    <p className="text-muted-foreground">ผู้จ่ายเงิน</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 sticky bottom-0 bg-background py-4 border-t">
                <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex-1" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  พิมพ์เอกสาร
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => toast.success("ส่ง PDF ให้ลูกค้าสำเร็จ")}>
                  <FileText className="w-4 h-4 mr-2" />
                  ส่ง PDF ให้ลูกค้า
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Verify Payment Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ตรวจสอบรับยอด</DialogTitle>
            <DialogDescription>
              {verifyingOrder ? `ออเดอร์ ${verifyingOrder.id} - ${verifyingOrder.customerName}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Show existing payment proof for paid orders */}
            {verifyingOrder && verifyingOrder.paymentProof && verifyingOrder.paymentProof.length > 0 ? (
              <>
                <div className="space-y-3">
                  <Label>ไฟล์แนบ (สลิปการโอน/หลักฐาน)</Label>
                  {verifyingOrder.paymentProof.map((proof, idx) => (
                    <div key={idx} className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        สลิปที่ {idx + 1}
                      </div>
                      <div className="flex justify-center bg-muted/30 rounded-md p-2">
                        <img
                          src={proof.slipUrl}
                          alt={`สลิปโอนเงิน ${idx + 1}`}
                          className="max-h-40 object-contain rounded"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">วันที่โอน:</span>
                          <p className="font-medium">{proof.transferDate}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">ยอดเงินที่โอน:</span>
                          <p className="font-medium text-primary">฿{proof.transferAmount.toLocaleString()}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">โอนเข้าธนาคาร:</span>
                          <p className="font-medium">{proof.bankName}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ยอดรวมที่โอน:</span>
                  <span className="font-bold text-primary">
                    ฿{verifyingOrder.paymentProof.reduce((sum, p) => sum + p.transferAmount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">ยอดรวมทั้งหมด:</span>
                  <span className="font-bold">฿{verifyingOrder.totalAmount.toLocaleString()}</span>
                </div>
                <Button className="w-full" onClick={handleConfirmVerify}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  ยืนยันการตรวจสอบ
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>ไฟล์แนบ (สลิปการโอน/หลักฐาน)</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    {verifyFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <Paperclip className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{verifyFile.name}</span>
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setVerifyFile(null)}>ลบ</Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">คลิกเพื่ออัปโหลดไฟล์</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            if (e.target.files?.[0]) setVerifyFile(e.target.files[0]);
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ยอดที่ชำระ (บาท)</Label>
                  <Input
                    type="number"
                    placeholder="ระบุยอดที่ชำระ"
                    value={verifyAmount}
                    onChange={(e) => setVerifyAmount(e.target.value)}
                  />
                  {verifyingOrder && (
                    <p className="text-xs text-muted-foreground">
                      ยอดรวมทั้งหมด: ฿{verifyingOrder.totalAmount.toLocaleString()} | ยอดคงค้าง: ฿{verifyingOrder.outstandingAmount.toLocaleString()}
                    </p>
                  )}
                </div>
                <Button className="w-full" onClick={handleConfirmVerify}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  ยืนยันการตรวจสอบ
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
