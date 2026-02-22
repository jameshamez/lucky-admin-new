import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Download, Search, Calendar, Inbox, Filter, X, FileImage, Trophy, Package, Truck, CheckCircle, Clock, Image as ImageIcon, Factory, User, FileText, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import sampleArtwork from "@/assets/sample-artwork.png";

// Status types for history
type HistoryStatus = "สำเร็จ" | "ยกเลิก";

interface HistoryItem {
  id: number;
  jobCode: string;
  jobName: string;
  customerName: string;
  factory: string;
  factoryLabel: string;
  productType: string;
  createdDate: string;
  completedDate: string;
  quantity: number;
  totalCost: number;
  totalSellingPrice: number;
  profit: number;
  status: HistoryStatus;
  salesPerson: string;
  // Extended fields from production order
  material: string;
  size: string;
  thickness: string;
  colors: string[];
  frontDetails: string;
  backDetails: string;
  lanyardSize: string;
  lanyardPatterns: number;
  customerBudget: number;
  artworkImages: string[];
  designFiles: string[];
  notes: string;
  // Order & Shipping info
  orderer?: string;
  poNumber?: string;
  shipDate?: string;
  splitQuantity?: string;
  totalSales?: number;
  vat?: number;
  shippingChannel?: string;
  shippingCostRMB?: number;
  exchangeRate?: number;
  shippingCostTHB?: number;
  // Status tracking
  qcStatus?: {
    artwork: { status: string; photo?: string; date?: string };
    cnc: { status: string; photo?: string; date?: string };
    lanyard: { status: string; photo?: string; date?: string };
    finalQc: { status: string; photo?: string; date?: string };
  };
  shippingStatus?: {
    factoryExport: { status: string; photo?: string; date?: string };
    inTransit: { status: string; photo?: string; date?: string };
    customs: { status: string; photo?: string; date?: string };
    arrival: { status: string; photo?: string; date?: string };
  };
  logisticsStatus?: {
    warehouseToStore: { status: string; photo?: string; date?: string };
    storeQc: { status: string; photo?: string; date?: string };
    deliverySuccess: { status: string; photo?: string; date?: string; carrier?: string; trackingNumber?: string };
  };
}

const factories = [
  { value: "china_bc", label: "China B&C" },
  { value: "china_linda", label: "China LINDA" },
  { value: "china_pn", label: "China PN" },
  { value: "china_xiaoli", label: "China Xiaoli" },
  { value: "china_zj", label: "China ZJ" },
  { value: "china_benc", label: "China BENC" },
  { value: "china_lanyard_a", label: "China Lanyard A" },
  { value: "premium_bangkok", label: "บริษัท พรีเมี่ยมแบงค์ค็อก จำกัด" },
  { value: "thai_solid", label: "ไทย Solid" },
  { value: "pv_pewter", label: "PV พิวเตอร์" },
];

const productTypes = [
  { value: "เหรียญสั่งผลิต", label: "เหรียญสั่งผลิต" },
  { value: "โล่สั่งผลิต", label: "โล่สั่งผลิต" },
  { value: "ถ้วยรางวัล", label: "ถ้วยรางวัล" },
  { value: "สายคล้อง", label: "สายคล้อง" },
  { value: "พวงกุญแจ", label: "พวงกุญแจ" },
  { value: "แม่เหล็ก", label: "แม่เหล็ก" },
];

const PricingHistory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFactory, setSelectedFactory] = useState<string>("all");
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Mock history data - All medal production projects with extended details
  const [historyData] = useState<HistoryItem[]>([
    {
      id: 1,
      jobCode: "JOB-2023-045",
      jobName: "เหรียญงานวิ่ง Chiang Mai Marathon 2023",
      customerName: "สมาคมกีฬาจังหวัดเชียงใหม่",
      factory: "china_bc",
      factoryLabel: "China B&C",
      productType: "เหรียญสั่งผลิต",
      createdDate: "2023-10-15",
      completedDate: "2023-11-20",
      quantity: 8000,
      totalCost: 320000,
      totalSellingPrice: 480000,
      profit: 160000,
      status: "สำเร็จ",
      salesPerson: "พนักงานขาย A",
      material: "ซิงค์อัลลอย",
      size: "5 ซม.",
      thickness: "4 มิล",
      colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)", "shinny copper (สีทองแดงเงา)"],
      frontDetails: "พิมพ์โลโก้, ลงสีสเปรย์, ลงน้ำยาป้องกันสนิม, ขัดเงา",
      backDetails: "แกะสลักข้อความ, ปั๊มลาย",
      lanyardSize: "90x2.5 ซม.",
      lanyardPatterns: 3,
      customerBudget: 60,
      artworkImages: ["artwork_cm_marathon.jpg"],
      designFiles: ["design_cm_marathon.ai"],
      notes: "ต้องการส่งมอบก่อนวันงาน 7 วัน",
      orderer: "จัดซื้อ สมชาย",
      poNumber: "PO-2023-045",
      shipDate: "2023-11-10",
      splitQuantity: "2 ล็อต",
      totalSales: 480000,
      vat: 7,
      shippingChannel: "SEA",
      shippingCostRMB: 8500,
      exchangeRate: 5.5,
      shippingCostTHB: 46750,
      qcStatus: {
        artwork: { status: "approved", photo: "/qc/artwork.jpg", date: "2023-10-20" },
        cnc: { status: "approved", photo: "/qc/cnc.jpg", date: "2023-10-25" },
        lanyard: { status: "approved", photo: "/qc/lanyard.jpg", date: "2023-10-28" },
        finalQc: { status: "approved", photo: "/qc/final.jpg", date: "2023-11-01" }
      },
      shippingStatus: {
        factoryExport: { status: "completed", photo: "/ship/export.jpg", date: "2023-11-05" },
        inTransit: { status: "completed", photo: "/ship/transit.jpg", date: "2023-11-08" },
        customs: { status: "completed", photo: "/ship/customs.jpg", date: "2023-11-15" },
        arrival: { status: "completed", photo: "/ship/arrival.jpg", date: "2023-11-18" }
      },
      logisticsStatus: {
        warehouseToStore: { status: "completed", photo: "/log/warehouse.jpg", date: "2023-11-19" },
        storeQc: { status: "completed", photo: "/log/storeqc.jpg", date: "2023-11-19" },
        deliverySuccess: { status: "completed", photo: "/log/delivery.jpg", date: "2023-11-20", carrier: "Kerry Express", trackingNumber: "KRTH123456789" }
      }
    },
    {
      id: 2,
      jobCode: "JOB-2023-052",
      jobName: "เหรียญที่ระลึกงานประชุมผู้ถือหุ้น ปตท.",
      customerName: "บริษัท ปตท. จำกัด (มหาชน)",
      factory: "china_zj",
      factoryLabel: "China ZJ",
      productType: "เหรียญสั่งผลิต",
      createdDate: "2023-11-01",
      completedDate: "2023-11-25",
      quantity: 2000,
      totalCost: 90000,
      totalSellingPrice: 140000,
      profit: 50000,
      status: "สำเร็จ",
      salesPerson: "พนักงานขาย C",
      material: "ซิงค์อัลลอย",
      size: "6 ซม.",
      thickness: "5 มิล",
      colors: ["shinny gold (สีทองเงา)"],
      frontDetails: "พิมพ์โลโก้, แกะสลักข้อความ, ขัดเงา",
      backDetails: "พิมพ์โลโก้, แกะสลักข้อความ",
      lanyardSize: "90x3 ซม.",
      lanyardPatterns: 1,
      customerBudget: 75,
      artworkImages: ["artwork_ptt.jpg"],
      designFiles: ["design_ptt.ai"],
      notes: "ต้องมีกล่องใส่เหรียญด้วย",
      orderer: "จัดซื้อ สมหญิง",
      poNumber: "PO-2023-052",
      shipDate: "2023-11-15",
      totalSales: 140000,
      vat: 7,
      shippingChannel: "AIR",
      shippingCostRMB: 3200,
      exchangeRate: 5.5,
      shippingCostTHB: 17600,
      qcStatus: {
        artwork: { status: "approved", photo: "/qc/artwork2.jpg", date: "2023-11-05" },
        cnc: { status: "approved", photo: "/qc/cnc2.jpg", date: "2023-11-08" },
        lanyard: { status: "approved", photo: "/qc/lanyard2.jpg", date: "2023-11-10" },
        finalQc: { status: "approved", photo: "/qc/final2.jpg", date: "2023-11-12" }
      },
      shippingStatus: {
        factoryExport: { status: "completed", date: "2023-11-15" },
        inTransit: { status: "completed", date: "2023-11-17" },
        customs: { status: "completed", date: "2023-11-20" },
        arrival: { status: "completed", date: "2023-11-22" }
      },
      logisticsStatus: {
        warehouseToStore: { status: "completed", date: "2023-11-23" },
        storeQc: { status: "completed", date: "2023-11-24" },
        deliverySuccess: { status: "completed", date: "2023-11-25", carrier: "Flash Express", trackingNumber: "TH99887766" }
      }
    },
    {
      id: 3,
      jobCode: "JOB-2023-058",
      jobName: "เหรียญรางวัลการแข่งขันกีฬาแห่งชาติ ครั้งที่ 48",
      customerName: "การกีฬาแห่งประเทศไทย",
      factory: "china_linda",
      factoryLabel: "China LINDA",
      productType: "เหรียญสั่งผลิต",
      createdDate: "2023-09-10",
      completedDate: "2023-10-28",
      quantity: 5000,
      totalCost: 225000,
      totalSellingPrice: 350000,
      profit: 125000,
      status: "สำเร็จ",
      salesPerson: "พนักงานขาย B",
      material: "ซิงค์อัลลอย",
      size: "7 ซม.",
      thickness: "4 มิล",
      colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)"],
      frontDetails: "พิมพ์โลโก้, ลงน้ำยาป้องกันสนิม, พิมพ์ซิลค์สกรีน, ขัดเงา, แกะลึก",
      backDetails: "แกะสลักข้อความ, ปั๊มลาย",
      lanyardSize: "90x2.5 ซม.",
      lanyardPatterns: 2,
      customerBudget: 70,
      artworkImages: ["artwork_sat.jpg"],
      designFiles: ["design_sat.ai"],
      notes: "",
      orderer: "จัดซื้อ สมชาย",
      poNumber: "PO-2023-058",
      shipDate: "2023-10-15",
      totalSales: 350000,
      vat: 7,
      shippingChannel: "SEA",
      shippingCostRMB: 6000,
      exchangeRate: 5.5,
      shippingCostTHB: 33000,
      qcStatus: {
        artwork: { status: "approved", date: "2023-09-20" },
        cnc: { status: "approved", date: "2023-09-25" },
        lanyard: { status: "approved", date: "2023-09-28" },
        finalQc: { status: "approved", date: "2023-10-01" }
      },
      shippingStatus: {
        factoryExport: { status: "completed", date: "2023-10-05" },
        inTransit: { status: "completed", date: "2023-10-10" },
        customs: { status: "completed", date: "2023-10-20" },
        arrival: { status: "completed", date: "2023-10-25" }
      },
      logisticsStatus: {
        warehouseToStore: { status: "completed", date: "2023-10-26" },
        storeQc: { status: "completed", date: "2023-10-27" },
        deliverySuccess: { status: "completed", date: "2023-10-28", carrier: "J&T Express", trackingNumber: "JNT123456" }
      }
    },
    {
      id: 6,
      jobCode: "JOB-2023-075",
      jobName: "เหรียญรางวัลงานวิ่งการกุศล Run for Dogs",
      customerName: "มูลนิธิช่วยเหลือสัตว์",
      factory: "china_xiaoli",
      factoryLabel: "China Xiaoli",
      productType: "เหรียญสั่งผลิต",
      createdDate: "2023-11-15",
      completedDate: "2023-12-05",
      quantity: 3000,
      totalCost: 105000,
      totalSellingPrice: 150000,
      profit: 45000,
      status: "ยกเลิก",
      salesPerson: "พนักงานขาย B",
      material: "ซิงค์อัลลอย",
      size: "5 ซม.",
      thickness: "3 มิล",
      colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)"],
      frontDetails: "พิมพ์โลโก้, ลงสีสเปรย์",
      backDetails: "-",
      lanyardSize: "90x2.5 ซม.",
      lanyardPatterns: 1,
      customerBudget: 50,
      artworkImages: [],
      designFiles: [],
      notes: "ลูกค้ายกเลิกเนื่องจากงบไม่พอ"
    }
  ]);

  // Filter logic
  const filteredData = historyData.filter(item => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      item.jobCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    // Factory filter
    const matchesFactory = selectedFactory === "all" || item.factory === selectedFactory;

    // Product type filter
    const matchesProductType = selectedProductType === "all" || item.productType === selectedProductType;

    // Status filter
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;

    // Date range filter
    const itemDate = new Date(item.completedDate);
    const matchesStartDate = !startDate || itemDate >= startDate;
    const matchesEndDate = !endDate || itemDate <= endDate;

    return matchesSearch && matchesFactory && matchesProductType && matchesStatus && matchesStartDate && matchesEndDate;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedFactory("all");
    setSelectedProductType("all");
    setSelectedStatus("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  const hasActiveFilters = searchTerm || selectedFactory !== "all" || selectedProductType !== "all" || selectedStatus !== "all" || startDate || endDate;

  const getStatusBadge = (status: HistoryStatus) => {
    if (status === "สำเร็จ") {
      return <Badge className="bg-green-100 text-green-700 border-green-300 text-xs px-2 py-0.5">{status}</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-xs px-2 py-0.5">{status}</Badge>;
  };

  // Summary stats
  const totalOrdered = historyData.filter(item => item.status === "สำเร็จ").length;
  const totalCancelled = historyData.filter(item => item.status === "ยกเลิก").length;
  const totalProfit = historyData.filter(item => item.status === "สำเร็จ").reduce((sum, item) => sum + item.profit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ประวัติรายการสั่งผลิต</h1>
          <p className="text-muted-foreground">รายการที่สั่งผลิตสำเร็จหรือยกเลิก - ใช้เป็นฐานข้อมูลราคากลาง</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          ส่งออกรายงาน
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">สำเร็จ</p>
                <p className="text-2xl font-bold text-green-600">{totalOrdered}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Badge className="bg-green-500 text-white">{totalOrdered}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ยกเลิก</p>
                <p className="text-2xl font-bold text-gray-600">{totalCancelled}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Badge className="bg-gray-500 text-white">{totalCancelled}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">กำไรรวม (สั่งซื้อแล้ว)</p>
                <p className="text-2xl font-bold text-green-600">฿{totalProfit.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-lg font-bold">฿</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="ค้นหาตามรหัสงาน, ชื่องาน, หรือชื่อลูกค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">ตัวกรอง:</span>
              </div>

              {/* Product Type Filter */}
              <Select value={selectedProductType} onValueChange={setSelectedProductType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="ประเภทสินค้า" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกประเภทสินค้า</SelectItem>
                  {productTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Factory Filter */}
              <Select value={selectedFactory} onValueChange={setSelectedFactory}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="โรงงาน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกโรงงาน</SelectItem>
                  {factories.map(factory => (
                    <SelectItem key={factory.value} value={factory.value}>{factory.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="สำเร็จ">สำเร็จ</SelectItem>
                  <SelectItem value="ยกเลิก">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>

              {/* Start Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: th }) : "วันที่เริ่มต้น"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* End Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: th }) : "วันที่สิ้นสุด"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                  <X className="h-4 w-4" />
                  ล้างตัวกรอง
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการทั้งหมด ({filteredData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Inbox className="h-16 w-16 mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">ไม่พบรายการ</h3>
              <p className="text-sm text-center">
                {hasActiveFilters ? (
                  <>
                    ไม่พบรายการตามเงื่อนไขที่เลือก
                    <br />
                    <span className="text-primary cursor-pointer" onClick={clearFilters}>ลองล้างตัวกรองแล้วค้นหาใหม่</span>
                  </>
                ) : (
                  "ยังไม่มีประวัติการประเมินราคา"
                )}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสงาน</TableHead>
                    <TableHead>ชื่องาน</TableHead>
                    <TableHead>ลูกค้า</TableHead>
                    <TableHead>ประเภทสินค้า</TableHead>
                    <TableHead>โรงงาน</TableHead>
                    <TableHead>วันที่เสร็จสิ้น</TableHead>
                    <TableHead className="text-right">จำนวน</TableHead>
                    <TableHead className="text-right">ต้นทุนรวม</TableHead>
                    <TableHead className="text-right">ราคาขาย</TableHead>
                    <TableHead className="text-right">กำไร</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono font-medium">
                        <a
                          href={`/procurement/estimation/history/${item.jobCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline hover:text-blue-800 cursor-pointer"
                        >
                          {item.jobCode}
                        </a>
                      </TableCell>
                      <TableCell>{item.jobName}</TableCell>
                      <TableCell>{item.customerName}</TableCell>
                      <TableCell>{item.productType}</TableCell>
                      <TableCell>{item.factoryLabel}</TableCell>
                      <TableCell>{new Date(item.completedDate).toLocaleDateString('th-TH')}</TableCell>
                      <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{item.totalCost.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{item.totalSellingPrice.toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.profit.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowDetailDialog(true);
                            }}
                            title="ดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog - Redesigned Clean Layout */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-0">
            <DialogTitle className="text-lg font-semibold">
              รายละเอียดประวัติการประเมินราคา
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-5">
              {/* Section 1: Compact Header - Single Row */}
              <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">[{selectedItem.jobCode}]</span>
                    <span className="font-medium">{selectedItem.jobName}</span>
                  </div>
                  <Separator orientation="vertical" className="h-5 hidden md:block" />
                  <div className="text-sm">
                    <span className="text-muted-foreground">ลูกค้า:</span>{" "}
                    <span className="font-medium">{selectedItem.customerName}</span>
                    <span className="text-muted-foreground ml-1">(เซลล์: {selectedItem.salesPerson?.replace('พนักงานขาย ', '')})</span>
                  </div>
                  <Separator orientation="vertical" className="h-5 hidden md:block" />
                  <div className="flex items-center gap-2">
                    {selectedItem.status === "สำเร็จ" ? (
                      <>
                        <Badge className="bg-green-100 text-green-700 border-green-300 text-xs">จัดส่งสำเร็จ</Badge>
                        {selectedItem.logisticsStatus?.deliverySuccess?.carrier && (
                          <span className="text-xs text-muted-foreground">
                            ({selectedItem.logisticsStatus.deliverySuccess.carrier}: {selectedItem.logisticsStatus.deliverySuccess.trackingNumber})
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-xs">ยกเลิก</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Specs & Financials - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left: Product Specs */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                    <Package className="w-4 h-4" />
                    ข้อมูลสินค้า
                  </h4>
                  <div className="text-sm space-y-2">
                    <p>
                      <span className="text-muted-foreground">วัสดุ:</span> {selectedItem.material} | 
                      <span className="text-muted-foreground ml-2">ขนาด:</span> {selectedItem.size} | 
                      <span className="text-muted-foreground ml-2">หนา:</span> {selectedItem.thickness}
                    </p>
                    <p>
                      <span className="text-muted-foreground">สายคล้อง:</span> {selectedItem.lanyardSize?.replace("x", " × ")} ({selectedItem.lanyardPatterns} ลาย)
                    </p>
                    {/* Front/Back as compact badges */}
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-muted-foreground mr-1">หน้า:</span>
                      {selectedItem.frontDetails?.split(", ").slice(0, 3).map((d, i) => (
                        <Badge key={i} variant="outline" className="text-xs py-0">{d}</Badge>
                      ))}
                      {selectedItem.frontDetails?.split(", ").length > 3 && (
                        <span className="text-xs text-muted-foreground">+{selectedItem.frontDetails?.split(", ").length - 3}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-muted-foreground mr-1">หลัง:</span>
                      {selectedItem.backDetails && selectedItem.backDetails !== "-" ? (
                        selectedItem.backDetails.split(", ").slice(0, 3).map((d, i) => (
                          <Badge key={i} variant="outline" className="text-xs py-0">{d}</Badge>
                        ))
                      ) : <span className="text-xs text-muted-foreground">-</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Financial Table */}
                <div className="border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                    <FileText className="w-4 h-4" />
                    ตารางจำนวนและราคา
                  </h4>
                  <div className="border rounded overflow-hidden text-sm">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="text-xs py-2">รายการ</TableHead>
                          <TableHead className="text-xs text-right py-2">จำนวน</TableHead>
                          <TableHead className="text-xs text-right py-2">ราคา/หน่วย</TableHead>
                          <TableHead className="text-xs text-right py-2">รวมเงิน</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedItem.colors.map((c, i) => {
                          const colorMap: Record<string, string> = {
                            "shinny gold (สีทองเงา)": "ทอง",
                            "shinny silver (สีเงินเงา)": "เงิน",
                            "shinny copper (สีทองแดงเงา)": "ทองแดง",
                          };
                          const colorName = colorMap[c] || c.split(" ")[0];
                          const qtyPerColor = Math.ceil(selectedItem.quantity / selectedItem.colors.length);
                          const pricePerColor = qtyPerColor * selectedItem.customerBudget;
                          return (
                            <TableRow key={i}>
                              <TableCell className="py-2 text-xs">{colorName}</TableCell>
                              <TableCell className="text-right py-2 text-xs">{qtyPerColor.toLocaleString()}</TableCell>
                              <TableCell className="text-right py-2 text-xs">{selectedItem.customerBudget} บาท</TableCell>
                              <TableCell className="text-right py-2 text-xs font-medium">{pricePerColor.toLocaleString()} บาท</TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-muted/30 font-medium">
                          <TableCell className="py-2 text-xs">รวมสุทธิ</TableCell>
                          <TableCell className="text-right py-2 text-xs font-semibold">{selectedItem.quantity.toLocaleString()} ชิ้น</TableCell>
                          <TableCell className="text-right py-2 text-xs"></TableCell>
                          <TableCell className="text-right py-2 text-xs">
                            <span className="font-bold">{selectedItem.totalSellingPrice.toLocaleString()}</span>
                            <span className="text-muted-foreground ml-1">(+VAT {((selectedItem.totalSellingPrice) * 0.07).toLocaleString(undefined, {maximumFractionDigits: 0})})</span>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Section 3: Production & Costs */}
              {selectedItem.status === "สำเร็จ" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Production Info */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                      <Factory className="w-4 h-4" />
                      ข้อมูลการผลิตและต้นทุน
                    </h4>
                    <div className="text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">โรงงานผลิต:</span>
                        <span className="font-semibold text-green-700">{selectedItem.factoryLabel}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">ใบสั่งซื้อ (PO):</span>
                        <span className="font-mono">{selectedItem.poNumber || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">ต้นทุนขนส่ง ({selectedItem.shippingChannel || 'SEA'}):</span>
                        <span>
                          {selectedItem.shippingCostRMB?.toLocaleString() || '-'} RMB 
                          <span className="text-muted-foreground ml-1">(Rate {selectedItem.exchangeRate || 5.5})</span> 
                          = <span className="font-semibold">{selectedItem.shippingCostTHB?.toLocaleString() || '-'} บาท</span>
                        </span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">กำไรสุทธิ:</span>
                        <span className="font-bold text-lg text-green-600">{selectedItem.profit.toLocaleString()} บาท</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Artwork & File */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2 text-primary">
                      <ImageIcon className="w-4 h-4" />
                      ไฟล์งาน
                    </h4>
                    <div className="flex gap-4 items-start">
                      {/* Artwork Thumbnail */}
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {selectedItem.artworkImages && selectedItem.artworkImages.length > 0 ? (
                          <img src={sampleArtwork} alt="Artwork" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      {/* File Info */}
                      <div className="flex-1">
                        {selectedItem.designFiles && selectedItem.designFiles.length > 0 ? (
                          <div className="flex items-center gap-2 text-sm">
                            <FileImage className="w-4 h-4 text-blue-600" />
                            <span>{selectedItem.designFiles[0]}</span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">ไม่มีไฟล์งาน</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Horizontal Project Timeline */}
              {selectedItem.status === "สำเร็จ" && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-sm flex items-center gap-2 text-primary mb-4">
                    <Clock className="w-4 h-4" />
                    ไทม์ไลน์สถานะงาน
                  </h4>
                  
                  {/* Timeline - Horizontal Steps */}
                  <div className="relative pt-2">
                    {/* Connection Line - positioned behind circles */}
                    <div className="absolute top-6 left-8 right-8 h-0.5 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 z-0" />
                    
                    {/* Three Phase Groups */}
                    <div className="grid grid-cols-3 gap-4 relative z-10">
                      {/* Phase 1: Production QC */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center z-10">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-medium text-green-700">Production QC</span>
                        </div>
                        <div className="ml-10 space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{selectedItem.qcStatus?.artwork?.date ? new Date(selectedItem.qcStatus.artwork.date).toLocaleDateString('th-TH', {day: '2-digit', month: '2-digit'}) : '-'}: Artwork</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{selectedItem.qcStatus?.cnc?.date ? new Date(selectedItem.qcStatus.cnc.date).toLocaleDateString('th-TH', {day: '2-digit', month: '2-digit'}) : '-'}: CNC</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{selectedItem.qcStatus?.finalQc?.date ? new Date(selectedItem.qcStatus.finalQc.date).toLocaleDateString('th-TH', {day: '2-digit', month: '2-digit'}) : '-'}: ก่อนส่ง</span>
                          </div>
                        </div>
                      </div>

                      {/* Phase 2: International Shipping */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center z-10">
                            <Truck className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-medium text-blue-700">Shipping</span>
                        </div>
                        <div className="ml-10 space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-blue-500" />
                            <span>{selectedItem.shippingStatus?.factoryExport?.date ? new Date(selectedItem.shippingStatus.factoryExport.date).toLocaleDateString('th-TH', {day: '2-digit', month: '2-digit'}) : '-'}: ออกจากโรงงาน</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-blue-500" />
                            <span>{selectedItem.shippingStatus?.arrival?.date ? new Date(selectedItem.shippingStatus.arrival.date).toLocaleDateString('th-TH', {day: '2-digit', month: '2-digit'}) : '-'}: ถึงไทย</span>
                          </div>
                        </div>
                      </div>

                      {/* Phase 3: Local Delivery */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center z-10">
                            <Package className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-xs font-medium text-purple-700">Delivery</span>
                        </div>
                        <div className="ml-10 space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-purple-500" />
                            <span>{selectedItem.logisticsStatus?.warehouseToStore?.date ? new Date(selectedItem.logisticsStatus.warehouseToStore.date).toLocaleDateString('th-TH', {day: '2-digit', month: '2-digit'}) : '-'}: คลัง→ร้าน</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-purple-500" />
                            <span>{selectedItem.logisticsStatus?.deliverySuccess?.date ? new Date(selectedItem.logisticsStatus.deliverySuccess.date).toLocaleDateString('th-TH', {day: '2-digit', month: '2-digit'}) : '-'}: ลูกค้าได้รับ</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancelled Item Summary */}
              {selectedItem.status === "ยกเลิก" && (
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-4">
                    <X className="w-5 h-5 text-gray-500" />
                    <span className="font-semibold text-gray-700">งานถูกยกเลิก</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-muted-foreground">ต้นทุน (ประมาณ)</p>
                      <p className="font-bold text-lg">฿{selectedItem.totalCost.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <p className="text-xs text-muted-foreground">ราคาขาย (ประมาณ)</p>
                      <p className="font-bold text-lg">฿{selectedItem.totalSellingPrice.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded border border-gray-300">
                      <p className="text-xs text-muted-foreground">กำไรที่ไม่ได้รับ</p>
                      <p className="font-bold text-lg text-gray-500">฿{selectedItem.profit.toLocaleString()}</p>
                    </div>
                  </div>
                  {selectedItem.notes && (
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <p className="text-xs text-muted-foreground mb-1">เหตุผลการยกเลิก:</p>
                      <p className="text-sm font-medium text-red-700">{selectedItem.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingHistory;
