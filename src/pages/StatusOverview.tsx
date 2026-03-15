import { useState, useEffect, useCallback } from "react";
import { orderService, Order } from "@/services/orderService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  Users,
  Calendar,
  Package,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface UIOrder {
  id: string;
  customer: string;
  product: string;
  orderDate: string;
  dueDate: string;
  status: string;
  statusColor: string;
  responsible: string;
  department: string;
  priority: string;
}

export default function StatusOverview() {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [rawOrders, setRawOrders] = useState<UIOrder[]>([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderService.getOrders({ limit: 100 });
      if (res.status === "success" && res.data) {
        const mapped: UIOrder[] = res.data.map((o: any) => {
          let color = "bg-muted";
          const status = o.order_status || "สร้างคำสั่งซื้อใหม่";

          if (status.includes("ผลิต")) color = "bg-info";
          else if (status.includes("ออกแบบ")) color = "bg-primary";
          else if (status.includes("จัดส่ง") && !status.includes("แล้ว")) color = "bg-warning";
          else if (status.includes("เสร็จ") || status.includes("แล้ว")) color = "bg-success";
          else if (status.includes("อนุมัติ")) color = "bg-accent";

          // Determine department based on status
          let dept = "-";
          if (status.includes("ออกแบบ") || status.includes("กราฟิก")) dept = "ฝ่ายกราฟิก";
          else if (status.includes("ผลิต")) dept = "ฝ่ายผลิต";
          else if (status.includes("จัดซื้อ")) dept = "ฝ่ายจัดซื้อ";
          else if (status.includes("อนุมัติ") || status.includes("สร้าง")) dept = "ฝ่ายขาย";

          return {
            id: o.job_id || `ORD-${o.id}`,
            customer: o.customer_name || "ไม่ระบุ",
            product: o.job_name || "ไม่ระบุรายการ",
            orderDate: o.order_date ? o.order_date.split(' ')[0] : "-",
            dueDate: o.delivery_date ? o.delivery_date.split(' ')[0] : "-",
            status: status,
            statusColor: color,
            responsible: o.responsible_person || "-",
            department: dept,
            priority: o.urgency_level || "ปกติ"
          };
        });
        setRawOrders(mapped);
      }
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถโหลดข้อมูลสถานะงานได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const statusCounts = {
    total: rawOrders.length,
    inProgress: rawOrders.filter(o => o.status.includes("กำลัง") || o.status.includes("ระหว่าง") || o.status.includes("ดำเนินการ")).length,
    pending: rawOrders.filter(o => o.status.includes("รอ") && !o.status.includes("จัดส่ง")).length,
    completed: rawOrders.filter(o => o.status.includes("แล้ว") || o.status.includes("เสร็จ")).length,
    shipping: rawOrders.filter(o => o.status.includes("รอจัดส่ง")).length
  };

  const filteredOrders = rawOrders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || order.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusIcon = (status: string) => {
    if (status.includes("แล้ว") || status.includes("เสร็จ")) return <CheckCircle className="w-4 h-4" />;
    if (status.includes("อนุมัติ")) return <AlertCircle className="w-4 h-4" />;
    if (status.includes("กำลัง")) return <PlayCircle className="w-4 h-4" />;
    return <Clock className="w-4 h-4" />;
  };

  const getPriorityColor = (priority: string) => {
    return (priority === "สูง" || priority === "เร่งด่วน") ? "text-destructive" : "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">สถานะงานรวม</h1>
            <p className="text-muted-foreground">ภาพรวมของทุกออเดอร์ในระบบตั้งแต่เริ่มต้นจนส่งมอบ</p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">งานทั้งหมด</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.total}</div>
            <p className="text-xs text-muted-foreground">ออเดอร์ในระบบ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">กำลังดำเนินการ</CardTitle>
            <PlayCircle className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{statusCounts.inProgress}</div>
            <p className="text-xs text-muted-foreground">งานที่กำลังทำ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอการอนุมัติ</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{statusCounts.pending}</div>
            <p className="text-xs text-muted-foreground">งานรอดำเนินการ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รอจัดส่ง</CardTitle>
            <Clock className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{statusCounts.shipping}</div>
            <p className="text-xs text-muted-foreground">พร้อมส่งมอบ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">จัดส่งแล้ว</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{statusCounts.completed}</div>
            <p className="text-xs text-muted-foreground">งานเสร็จสิ้น</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            การกรองและค้นหา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="ค้นหา รหัสออเดอร์, ลูกค้า, หรือสินค้า..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="กรองตามสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="รอกราฟิก">รอกราฟิก</SelectItem>
                <SelectItem value="กำลังออกแบบ">กำลังออกแบบ</SelectItem>
                <SelectItem value="รอสั่งผลิต">รอสั่งผลิต</SelectItem>
                <SelectItem value="กำลังผลิต">กำลังผลิต</SelectItem>
                <SelectItem value="รอจัดส่ง">รอจัดส่ง</SelectItem>
                <SelectItem value="จัดส่งแล้ว">จัดส่งแล้ว</SelectItem>
                <SelectItem value="รอการอนุมัติ">รอการอนุมัติ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="กรองตามแผนก" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกแผนก</SelectItem>
                <SelectItem value="ฝ่ายขาย">ฝ่ายขาย</SelectItem>
                <SelectItem value="ฝ่ายกราฟิก">ฝ่ายกราฟิก</SelectItem>
                <SelectItem value="ฝ่ายผลิต">ฝ่ายผลิต</SelectItem>
                <SelectItem value="ฝ่ายจัดซื้อ">ฝ่ายจัดซื้อ</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" onClick={fetchOrders} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 bg-white/50 rounded-lg">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">กำลังดึงข้อมูลงานล่าสุด...</p>
        </div>
      )}

      {/* Master Job Table */}
      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                ตารางสถานะงานหลัก
              </div>
              <Badge variant="secondary">{filteredOrders.length} รายการ</Badge>
            </CardTitle>
            <CardDescription>
              รายละเอียดทุกออเดอร์ในระบบพร้อมสถานะและผู้รับผิดชอบ
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">รหัสออเดอร์</TableHead>
                    <TableHead>ลูกค้า</TableHead>
                    <TableHead className="min-w-[200px]">สินค้า/รายละเอียด</TableHead>
                    <TableHead className="w-[100px]">วันรับงาน</TableHead>
                    <TableHead className="w-[100px]">กำหนดส่ง</TableHead>
                    <TableHead className="w-[140px]">สถานะปัจจุบัน</TableHead>
                    <TableHead>ผู้รับผิดชอบ</TableHead>
                    <TableHead className="w-[80px]">ความสำคัญ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{order.id}</TableCell>
                      <TableCell className="font-medium">{order.customer}</TableCell>
                      <TableCell>{order.product}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {order.orderDate}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {order.dueDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${order.statusColor} text-white gap-1`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs">
                              {order.responsible.length > 1 ? order.responsible.slice(0, 2) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{order.responsible}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>ไม่พบข้อมูลที่ตรงกับการค้นหา</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}