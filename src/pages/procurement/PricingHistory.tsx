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
import * as XLSX from "xlsx";
import { toast } from "sonner";

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
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("https://nacres.co.th/api-lucky/admin/price_estimations.php")
      .then((res) => res.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((json: any) => {
        if (json.status !== "success" || !Array.isArray(json.data)) return;

        const mapped: HistoryItem[] = json.data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let detailObj: any = {};
            try {
              detailObj = typeof item.details === "string" ? JSON.parse(item.details) : (item.details || {});
            } catch {
              detailObj = {};
            }

            const rawStatus = String(item.status || "").trim();
            let status: HistoryStatus | null = null;
            if (rawStatus === "ยืนยันเรียบร้อย" || rawStatus === "รายการสั่งผลิต" || rawStatus === "4" || rawStatus === "5") {
              status = "สำเร็จ";
            } else if (rawStatus === "ยกเลิก" || rawStatus === "6") {
              status = "ยกเลิก";
            }
            if (!status) return null;

            const factoryValue = detailObj?.winnerFactoryValue || item.factory || "";
            const colors: string[] = Array.isArray(detailObj?.colors)
              ? detailObj.colors
              : (detailObj?.colors ? [detailObj.colors] : []);

            return {
              id: Number(item.id),
              jobCode: item.estimate_id || `JOB-${item.id}`,
              jobName: item.job_name || detailObj?.jobName || "-",
              customerName: item.customer_name || "-",
              factory: factoryValue,
              factoryLabel: factories.find((f) => f.value === factoryValue)?.label || factoryValue || "-",
              productType: item.product_type || detailObj?.productType || "-",
              createdDate: item.estimation_date || "-",
              completedDate: item.updated_at || item.estimation_date || "-",
              quantity: Number(item.quantity) || 0,
              totalCost: Number(detailObj?.totalCost) || 0,
              totalSellingPrice: Number(item.price) || 0,
              profit: Number(detailObj?.profit) || 0,
              status,
              salesPerson: item.sales_owner_id || "-",
              material: detailObj?.material || "-",
              size: detailObj?.size || "-",
              thickness: detailObj?.thickness || "-",
              colors,
              frontDetails: Array.isArray(detailObj?.frontDetails) ? detailObj.frontDetails.join(", ") : (detailObj?.frontDetails || "-"),
              backDetails: Array.isArray(detailObj?.backDetails) ? detailObj.backDetails.join(", ") : (detailObj?.backDetails || "-"),
              lanyardSize: Array.isArray(detailObj?.lanyardSize) ? detailObj.lanyardSize.join(", ") : (detailObj?.lanyardSize || "-"),
              lanyardPatterns: parseInt(detailObj?.lanyardPatterns) || 0,
              customerBudget: Number(item.budget) || 0,
              artworkImages: Array.isArray(detailObj?.artworkImages) ? detailObj.artworkImages : [],
              designFiles: Array.isArray(detailObj?.designFiles) ? detailObj.designFiles : [],
              notes: item.notes || "-",
            } as HistoryItem;
          })
          .filter((item: HistoryItem | null): item is HistoryItem => item !== null);

        setHistoryData(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

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

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.error("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }
    const rows = [
      ["รหัสงาน", "ชื่องาน", "ลูกค้า", "โรงงาน", "ประเภทสินค้า", "วันที่สร้าง", "วันที่เสร็จ", "จำนวน", "ต้นทุนรวม", "ราคาขายรวม", "กำไร", "สถานะ", "พนักงานขาย"],
      ...filteredData.map(item => [
        item.jobCode, item.jobName, item.customerName, item.factoryLabel, item.productType,
        item.createdDate, item.completedDate, item.quantity, item.totalCost, item.totalSellingPrice,
        item.profit, item.status, item.salesPerson,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 14 }, { wch: 24 }, { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 16 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ประวัติราคา");
    XLSX.writeFile(wb, `pricing-history-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(`ส่งออกสำเร็จ ${filteredData.length} รายการ`);
  };

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
        <Button variant="outline" className="gap-2" onClick={handleExportExcel}>
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
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <p className="text-sm">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredData.length === 0 ? (
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
