import { useState } from "react";
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
  Package
} from "lucide-react";

export default function StatusOverview() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Sample data for orders
  const orders = [
    {
      id: "ORD-2024-001",
      customer: "บริษัท ABC จำกัด",
      product: "โบรชัวร์สินค้า A4 สี่สี",
      orderDate: "2024-01-15",
      dueDate: "2024-01-25",
      status: "กำลังออกแบบ",
      statusColor: "bg-primary",
      responsible: "นางสาวใจ ใส",
      department: "ฝ่ายกราฟิก",
      priority: "สูง"
    },
    {
      id: "ORD-2024-002",
      customer: "ร้าน XYZ",
      product: "ป้ายโฆษณา PVC ขนาดใหญ่",
      orderDate: "2024-01-14",
      dueDate: "2024-01-28",
      status: "กำลังผลิต",
      statusColor: "bg-info",
      responsible: "นายสมชาย ขยัน",
      department: "ฝ่ายผลิต",
      priority: "ปกติ"
    },
    {
      id: "ORD-2024-003",
      customer: "บริษัท DEF",
      product: "สติกเกอร์สินค้า 1000 ชิ้น",
      orderDate: "2024-01-16",
      dueDate: "2024-01-30",
      status: "รอกราฟิก",
      statusColor: "bg-muted",
      responsible: "-",
      department: "ฝ่ายกราฟิก",
      priority: "ปกติ"
    },
    {
      id: "ORD-2024-004",
      customer: "ห้างสรรพสินค้า GHI",
      product: "บรรจุภัณฑ์กล่องกระดาษ",
      orderDate: "2024-01-12",
      dueDate: "2024-01-22",
      status: "รอจัดส่ง",
      statusColor: "bg-warning",
      responsible: "นายวิชัย ส่งได้",
      department: "ฝ่ายผลิต",
      priority: "สูง"
    },
    {
      id: "ORD-2024-005",
      customer: "บริษัท JKL",
      product: "แคตตาล็อกสินค้า 500 เล่ม",
      orderDate: "2024-01-10",
      dueDate: "2024-01-20",
      status: "จัดส่งแล้ว",
      statusColor: "bg-success",
      responsible: "เสร็จสิ้น",
      department: "-",
      priority: "ปกติ"
    },
    {
      id: "ORD-2024-006",
      customer: "ร้านอาหาร MNO",
      product: "เมนูอาหาร พลาสติก เคลือบ",
      orderDate: "2024-01-17",
      dueDate: "2024-01-27",
      status: "รอสั่งผลิต",
      statusColor: "bg-warning",
      responsible: "นายประสิทธิ์ ทำได้",
      department: "ฝ่ายผลิต",
      priority: "ปกติ"
    },
    {
      id: "ORD-2024-007",
      customer: "โรงเรียน PQR",
      product: "ใบประกาศนียบัตร 200 ใบ",
      orderDate: "2024-01-18",
      dueDate: "2024-02-01",
      status: "รอการอนุมัติ",
      statusColor: "bg-accent",
      responsible: "นายผู้จัดการ",
      department: "ฝ่ายขาย",
      priority: "สูง"
    },
    {
      id: "ORD-2024-008",
      customer: "คลินิก STU",
      product: "แผ่นพับสุขภาพ A5",
      orderDate: "2024-01-19",
      dueDate: "2024-01-29",
      status: "กำลังออกแบบ",
      statusColor: "bg-primary",
      responsible: "นางสาวใจ ใส",
      department: "ฝ่ายกราฟิก",
      priority: "ปกติ"
    }
  ];

  const statusCounts = {
    total: orders.length,
    inProgress: orders.filter(o => ["กำลังออกแบบ", "กำลังผลิต", "รอสั่งผลิต"].includes(o.status)).length,
    pending: orders.filter(o => ["รอกราฟิก", "รอการอนุมัติ"].includes(o.status)).length,
    completed: orders.filter(o => o.status === "จัดส่งแล้ว").length,
    shipping: orders.filter(o => o.status === "รอจัดส่ง").length
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.product.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesDepartment = departmentFilter === "all" || order.department === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "จัดส่งแล้ว": return <CheckCircle className="w-4 h-4" />;
      case "รอการอนุมัติ": return <AlertCircle className="w-4 h-4" />;
      case "กำลังออกแบบ":
      case "กำลังผลิต": return <PlayCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === "สูง" ? "text-destructive" : "text-muted-foreground";
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
            
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Master Job Table */}
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
    </div>
  );
}