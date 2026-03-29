import { useState, useMemo, useEffect } from "react";
import sampleArtwork from "@/assets/sample-artwork.png";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ClipboardList, Truck, Package, CheckCircle, Clock, Search, AlertCircle, Filter, X, Ribbon, Check, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductionWorkspace } from "@/components/production/ProductionWorkspace";
import { productionService } from "@/services/productionService";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Helper to map API order to Component Order format
const mapOrder = (o: any) => ({
  id: o.job_id || o.order_number || `JOB-${o.order_id || o.id || Math.random()}`,
  orderDate: o.order_date?.split(' ')[0] || o.created_at?.split(' ')[0] || "-",
  lineName: o.customer_line || o.customer_line_id || o.line_name || "-",
  customerName: o.customer_name || "-",
  product: o.job_name || o.product || "งานสั่งผลิต",
  deliveryDate: o.delivery_date || "-",
  status: o.order_status || "รอผลิต",
  statusOrder: 1,
  quotation: o.quotation_no || o.quotation_number || "-",
  responsiblePerson: o.sales_owner || o.responsible_person || "-",
  graphicDesigner: o.graphic_owner || o.graphic_designer || "-",
  assignedEmployee: o.production_owner || "-",
  jobType: o.job_type || o.product_category || "งานสั่งผลิต",
  quantity: parseInt(o.total_quantity || o.quantity) || 1,
  isAccepted: o.production_status === 'accepted' || o.order_status !== 'สร้างคำสั่งซื้อใหม่',
  phone: o.customer_phone || "-",
  address: o.customer_address || o.delivery_address || o.shipping_address || "-",
  paymentStatus: o.payment_status || "มัดจำ",
  deliveryChannel: o.delivery_method || o.delivery_channel || "-",
  hasEngravingTag: o.has_engraving === '1' || o.hasEngravingTag === true,
  hasRibbon: o.has_ribbon === '1' || o.hasRibbon === true,
  trackingNumber: o.tracking_number || "",
  hasIssue: o.has_issue === '1' || o.hasIssue === true,
  issueDetail: o.issue_detail || "",
  productDetails: o.productDetails || [],
  paymentInfo: {
    status: o.payment_status === 'Paid' || o.payment_status === 'เต็มจำนวน' ? 'full' : 'deposit',
    amount: parseFloat(o.total_price ?? o.total_amount) || 0,
    proof: "#",
    bank: "-",
    receivedDate: "-",
    netTotal: parseFloat(o.total_price ?? o.total_amount) || 0,
  },
  shippingInfo: {
    province: "-",
    channel: o.delivery_method || o.delivery_channel || "-",
    shippingFee: parseFloat(o.shipping_fee) || 0,
    usageDate: o.delivery_date || "-",
  },
  productionWorkflow: o.production_workflow || null,
  dbId: o.order_id || o.id
});

// Mock data removed

export default function OrderManagement() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await productionService.getOrders();
      if (res.status === 'success' && res.data) {
        // บางครั้ง API อาจส่งคืนมาเป็น array หรือ object ที่มีข้อมูลซ้อนอีกที
        const dataArr = Array.isArray(res.data) ? res.data : (res.data.data || []);
        const mapped = dataArr.map(mapOrder);
        setOrders(mapped);
      }
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลออเดอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>("all");
  const [selectedGraphicDesigner, setSelectedGraphicDesigner] = useState<string>("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");
  const [selectedDeliveryChannel, setSelectedDeliveryChannel] = useState<string>("all");
  const [selectedEngravingTag, setSelectedEngravingTag] = useState<string>("all");
  const [selectedRibbon, setSelectedRibbon] = useState<string>("all");

  // Get unique employees from orders
  const employees = useMemo(() => {
    const uniqueEmployees = [...new Set(orders.map(o => o.assignedEmployee))];
    return uniqueEmployees.sort();
  }, [orders]);

  // Get unique sales persons
  const salesPersons = useMemo(() => {
    const unique = [...new Set(orders.map(o => o.responsiblePerson))];
    return unique.sort();
  }, [orders]);

  // Get unique graphic designers
  const graphicDesigners = useMemo(() => {
    const unique = [...new Set(orders.map(o => o.graphicDesigner))];
    return unique.sort();
  }, [orders]);

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      รอผลิต: orders.filter(o => o.status === "รอผลิต").length,
      กำลังผลิต: orders.filter(o => o.status === "กำลังผลิต" || o.status.startsWith("รอ") || o.status === "โรงงานส่งออก").length,
      พร้อมจัดส่ง: orders.filter(o => o.status === "พร้อมจัดส่ง" || o.status === "ประกอบเสร็จ").length,
      จัดส่งแล้ว: orders.filter(o => o.status === "จัดส่งแล้ว").length,
      มีปัญหา: orders.filter(o => o.hasIssue).length,
    };
  }, [orders]);

  // Filtered orders based on all criteria
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter (Job ID, Customer Name, Product)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" ||
        order.id.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower) ||
        order.product.toLowerCase().includes(searchLower);

      // Employee filter
      const matchesEmployee = selectedEmployee === "all" || order.assignedEmployee === selectedEmployee;

      // Sales person filter
      const matchesSalesPerson = selectedSalesPerson === "all" || order.responsiblePerson === selectedSalesPerson;

      // Graphic designer filter
      const matchesGraphicDesigner = selectedGraphicDesigner === "all" || order.graphicDesigner === selectedGraphicDesigner;

      // Payment status filter
      const matchesPaymentStatus = selectedPaymentStatus === "all" || order.paymentStatus === selectedPaymentStatus;

      // Delivery channel filter
      const matchesDeliveryChannel = selectedDeliveryChannel === "all" || order.deliveryChannel === selectedDeliveryChannel;

      // Engraving tag filter
      const matchesEngravingTag = selectedEngravingTag === "all" ||
        (selectedEngravingTag === "รับ" && order.hasEngravingTag) ||
        (selectedEngravingTag === "ไม่รับ" && !order.hasEngravingTag);

      // Ribbon filter
      const matchesRibbon = selectedRibbon === "all" ||
        (selectedRibbon === "รับ" && order.hasRibbon) ||
        (selectedRibbon === "ไม่รับ" && !order.hasRibbon);

      // Status filter
      let matchesStatus = true;
      if (activeStatus !== "all") {
        if (activeStatus === "มีปัญหา") {
          matchesStatus = order.hasIssue === true;
        } else if (activeStatus === "กำลังผลิต") {
          matchesStatus = order.status === "กำลังผลิต" || order.status.startsWith("รอ") || order.status === "โรงงานส่งออก";
        } else if (activeStatus === "พร้อมจัดส่ง") {
          matchesStatus = order.status === "พร้อมจัดส่ง" || order.status === "ประกอบเสร็จ";
        } else {
          matchesStatus = order.status === activeStatus;
        }
      }

      return matchesSearch && matchesEmployee && matchesSalesPerson && matchesGraphicDesigner &&
        matchesPaymentStatus && matchesDeliveryChannel && matchesEngravingTag && matchesRibbon && matchesStatus;
    });
  }, [orders, searchQuery, selectedEmployee, selectedSalesPerson, selectedGraphicDesigner,
    selectedPaymentStatus, selectedDeliveryChannel, selectedEngravingTag, selectedRibbon, activeStatus]);

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
  };

  const handleBack = () => {
    setSelectedOrder(null);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      // Find the internal numeric ID if possible, or use orderId
      // Our mapOrder uses order_number as id. 
      // But updateOrderStatus expects the primary key ID. 
      // Let's find the numeric ID from the orders array.
      const order = orders.find(o => o.id === orderId);
      const numericId = order?.dbId || orderId;

      await productionService.updateOrderStatus(numericId, newStatus);

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
      toast.success("อัปเดตสถานะหลักสำเร็จ");
    } catch (error) {
      toast.error("ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedEmployee("all");
    setActiveStatus("all");
    setSelectedSalesPerson("all");
    setSelectedGraphicDesigner("all");
    setSelectedPaymentStatus("all");
    setSelectedDeliveryChannel("all");
    setSelectedEngravingTag("all");
    setSelectedRibbon("all");
  };

  const hasActiveFilters = searchQuery !== "" || selectedEmployee !== "all" || activeStatus !== "all" ||
    selectedSalesPerson !== "all" || selectedGraphicDesigner !== "all" || selectedPaymentStatus !== "all" ||
    selectedDeliveryChannel !== "all" || selectedEngravingTag !== "all" || selectedRibbon !== "all";

  const getStatusBadge = (status: string, hasIssue?: boolean) => {
    if (hasIssue) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-300">
          <AlertCircle className="w-3 h-3 mr-1" />
          มีปัญหา
        </Badge>
      );
    }
    const config: Record<string, string> = {
      "รอผลิต": "bg-gray-100 text-gray-700",
      "กำลังผลิต": "bg-blue-100 text-blue-700",
      "พร้อมจัดส่ง": "bg-orange-100 text-orange-700",
      "จัดส่งแล้ว": "bg-green-100 text-green-700",
      "รอประกอบ": "bg-yellow-100 text-yellow-700",
      "รอผูกโบว์": "bg-purple-100 text-purple-700",
      "รอติดป้ายจารึก": "bg-indigo-100 text-indigo-700",
      "ประกอบเสร็จ": "bg-green-100 text-green-700",
      "โรงงานส่งออก": "bg-cyan-100 text-cyan-700",
    };
    return <Badge className={config[status] || "bg-gray-100 text-gray-700"}>{status}</Badge>;
  };

  // If an order is selected, show the workspace view
  if (selectedOrder) {
    return (
      <div className="space-y-6">
        <ProductionWorkspace
          order={selectedOrder}
          onBack={handleBack}
          onStatusChange={handleStatusChange}
        />
      </div>
    );
  }

  // Summary stats
  const stats = [
    { label: "รอผลิต", count: statusCounts.รอผลิต, icon: Clock, color: "text-gray-600", bgColor: "bg-gray-50" },
    { label: "กำลังผลิต", count: statusCounts.กำลังผลิต, icon: Package, color: "text-blue-600", bgColor: "bg-blue-50" },
    { label: "พร้อมจัดส่ง", count: statusCounts.พร้อมจัดส่ง, icon: Truck, color: "text-orange-600", bgColor: "bg-orange-50" },
    { label: "จัดส่งแล้ว", count: statusCounts.จัดส่งแล้ว, icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">จัดการผลิตและจัดส่ง</h1>
        <p className="text-muted-foreground">ระบบติดตามงานตั้งแต่เริ่มผลิตจนถึงส่งมอบ • เลือกงานเพื่อเริ่มบันทึกการผลิต</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat) => (
            <Card
              key={stat.label}
              className={`cursor-pointer transition-all hover:shadow-md ${activeStatus === stat.label ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setActiveStatus(activeStatus === stat.label ? "all" : stat.label)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
                <p className="text-xs text-muted-foreground">รายการ</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            ค้นหาและกรองข้อมูล
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหา Job ID, ชื่อลูกค้า, หรือสินค้า..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="shrink-0">
                <X className="h-4 w-4 mr-1" />
                ล้างตัวกรอง
              </Button>
            )}
          </div>

          {/* Filter Dropdowns Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Sales Person */}
            <Select value={selectedSalesPerson} onValueChange={setSelectedSalesPerson}>
              <SelectTrigger>
                <SelectValue placeholder="พนักงานขายทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">พนักงานขายทั้งหมด</SelectItem>
                {salesPersons.map((person) => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Graphic Designer */}
            <Select value={selectedGraphicDesigner} onValueChange={setSelectedGraphicDesigner}>
              <SelectTrigger>
                <SelectValue placeholder="พนักงานกราฟิกทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">พนักงานกราฟิกทั้งหมด</SelectItem>
                {graphicDesigners.map((designer) => (
                  <SelectItem key={designer} value={designer}>
                    {designer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Status */}
            <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="สถานะชำระเงินทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">สถานะชำระเงินทั้งหมด</SelectItem>
                <SelectItem value="มัดจำ">มัดจำ</SelectItem>
                <SelectItem value="เต็มจำนวน">เต็มจำนวน</SelectItem>
              </SelectContent>
            </Select>

            {/* Delivery Channel */}
            <Select value={selectedDeliveryChannel} onValueChange={setSelectedDeliveryChannel}>
              <SelectTrigger>
                <SelectValue placeholder="ช่องทางจัดส่งทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">ช่องทางจัดส่งทั้งหมด</SelectItem>
                <SelectItem value="มารับเอง">มารับเอง</SelectItem>
                <SelectItem value="จัดส่ง">จัดส่ง</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Dropdowns Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Production Employee */}
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="พนักงานผลิตทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">พนักงานผลิตทั้งหมด</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee} value={employee}>
                    {employee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Engraving Tag Filter */}
            <Select value={selectedEngravingTag} onValueChange={setSelectedEngravingTag}>
              <SelectTrigger>
                <SelectValue placeholder="ป้ายจารึกทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">ป้ายจารึกทั้งหมด</SelectItem>
                <SelectItem value="รับ">รับงานป้ายจารึก</SelectItem>
                <SelectItem value="ไม่รับ">ไม่รับงานป้ายจารึก</SelectItem>
              </SelectContent>
            </Select>

            {/* Ribbon Filter */}
            <Select value={selectedRibbon} onValueChange={setSelectedRibbon}>
              <SelectTrigger>
                <SelectValue placeholder="โบว์ทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">โบว์ทั้งหมด</SelectItem>
                <SelectItem value="รับ">รับงานโบว์</SelectItem>
                <SelectItem value="ไม่รับ">ไม่รับงานโบว์</SelectItem>
              </SelectContent>
            </Select>

            {/* Empty placeholder for grid alignment */}
            <div></div>
          </div>

          {/* Status Tabs */}
          <Tabs value={activeStatus} onValueChange={setActiveStatus}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                ทั้งหมด ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger value="รอผลิต" className="text-xs sm:text-sm">
                <Clock className="w-3 h-3 mr-1 hidden sm:inline" />
                รอผลิต ({statusCounts.รอผลิต})
              </TabsTrigger>
              <TabsTrigger value="กำลังผลิต" className="text-xs sm:text-sm">
                <Package className="w-3 h-3 mr-1 hidden sm:inline" />
                กำลังผลิต ({statusCounts.กำลังผลิต})
              </TabsTrigger>
              <TabsTrigger value="พร้อมจัดส่ง" className="text-xs sm:text-sm">
                <Truck className="w-3 h-3 mr-1 hidden sm:inline" />
                พร้อมส่ง ({statusCounts.พร้อมจัดส่ง})
              </TabsTrigger>
              <TabsTrigger value="จัดส่งแล้ว" className="text-xs sm:text-sm">
                <CheckCircle className="w-3 h-3 mr-1 hidden sm:inline" />
                ส่งแล้ว ({statusCounts.จัดส่งแล้ว})
              </TabsTrigger>
              <TabsTrigger value="มีปัญหา" className="text-xs sm:text-sm text-destructive">
                <AlertCircle className="w-3 h-3 mr-1 hidden sm:inline" />
                มีปัญหา ({statusCounts.มีปัญหา})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                รายการงาน
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                แสดง {filteredOrders.length} จาก {orders.length} รายการ
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Job ID</TableHead>
                  <TableHead className="whitespace-nowrap">สถานะ</TableHead>
                  <TableHead className="whitespace-nowrap">สินค้า</TableHead>
                  <TableHead className="whitespace-nowrap">ชื่อลูกค้า</TableHead>
                  <TableHead className="whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      วันที่ (สั่ง/ส่ง)
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">ช่องทางจัดส่ง</TableHead>
                  <TableHead className="whitespace-nowrap text-center">จารึก</TableHead>
                  <TableHead className="whitespace-nowrap text-center">โบว์</TableHead>
                  <TableHead className="whitespace-nowrap">การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-16 mb-1" />
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-5 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-5 mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map(order => (
                    <TableRow
                      key={order.id}
                      className={`cursor-pointer hover:bg-muted/50 ${order.hasIssue ? 'bg-destructive/10 hover:bg-destructive/20 border-l-4 border-l-destructive' : ''
                        }`}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        <a
                          href={`/production/orders/${order.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline hover:text-blue-800 cursor-pointer"
                        >
                          {order.id}
                        </a>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getStatusBadge(order.status, order.hasIssue)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap max-w-[120px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate block font-medium">{order.product}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{order.product}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-primary">@{order.lineName}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col text-sm">
                          <span className="text-muted-foreground text-xs">{order.orderDate}</span>
                          <span className="font-medium">{order.deliveryDate}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{order.deliveryChannel}</TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        {order.hasEngravingTag ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        {order.hasRibbon ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleSelectOrder(order)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          อัปเดต
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</p>
                        {hasActiveFilters && (
                          <Button variant="link" onClick={clearFilters}>
                            ล้างตัวกรองทั้งหมด
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}