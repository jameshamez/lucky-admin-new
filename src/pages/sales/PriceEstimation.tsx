import { useState, useMemo, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Eye, Trash2, ShoppingCart, Clock, FileCheck, CheckCircle, Calendar, Filter, Send, FileText, RotateCcw, XCircle, Copy, ChevronDown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { EstimationCaptureCard } from "@/components/sales/EstimationCaptureCard";
import { DateRange } from "react-day-picker";

const STORAGE_KEY = "price-estimation-filters";

// Helper to load filters from session storage
const loadFilters = () => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
};

// Helper to save filters to session storage
const saveFilters = (filters: Record<string, any>) => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {}
};

export default function PriceEstimation() {
  const navigate = useNavigate();
  
  // Load persisted filters
  const saved = loadFilters();
  
  const [searchTerm, setSearchTerm] = useState(saved?.searchTerm || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEstimation, setSelectedEstimation] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(saved?.startDate ? new Date(saved.startDate) : undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(saved?.endDate ? new Date(saved.endDate) : undefined);
  const [productTypeFilter, setProductTypeFilter] = useState<string>(saved?.productTypeFilter || "all");
  const [statusFilter, setStatusFilter] = useState<string>(saved?.statusFilter || "all");
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionEstimation, setRevisionEstimation] = useState<typeof estimations[0] | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionReasons, setRevisionReasons] = useState<string[]>([]);
  const [captureDialogOpen, setCaptureDialogOpen] = useState(false);
  const [captureEstimation, setCaptureEstimation] = useState<typeof estimations[0] | null>(null);

  // Column header filters
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(saved?.columnFilters || {});
  const [statusMultiFilter, setStatusMultiFilter] = useState<string[]>(saved?.statusMultiFilter || []);
  const [columnDateRange, setColumnDateRange] = useState<DateRange | undefined>(
    saved?.columnDateRange ? { from: saved.columnDateRange.from ? new Date(saved.columnDateRange.from) : undefined, to: saved.columnDateRange.to ? new Date(saved.columnDateRange.to) : undefined } : undefined
  );
  const [openColumnFilter, setOpenColumnFilter] = useState<string | null>(null);

  // Persist filters to session storage
  useEffect(() => {
    saveFilters({
      searchTerm,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      productTypeFilter,
      statusFilter,
      columnFilters,
      statusMultiFilter,
      columnDateRange: columnDateRange ? { from: columnDateRange.from?.toISOString(), to: columnDateRange.to?.toISOString() } : undefined,
    });
  }, [searchTerm, startDate, endDate, productTypeFilter, statusFilter, columnFilters, statusMultiFilter, columnDateRange]);

  // Product types list
  const productTypesList = [
    "เหรียญสั่งผลิต", "โล่สั่งผลิต", "หมวก", "กระเป๋า", "แก้ว",
    "ขวดน้ำ", "ตุ๊กตา", "สมุด", "ปฏิทิน", "ลิสแบรนด์",
    "สายคล้อง", "แม่เหล็ก", "ที่เปิดขวด", "พวงกุญแจ", "ที่ทับกระดาษ"
  ];

  const allStatuses = [
    "ยื่นคำขอประเมิน", "อยู่ระหว่างการประเมินราคา", "เสนอราคา",
    "เสนอลูกค้า", "ยืนยันเรียบร้อย", "ยกเลิก"
  ];

  // Mock data for price estimations
  const estimations = [
    {
      id: 1, estimateId: "EST-240115001", date: "2024-01-15", lineName: "customer_line_001",
      productType: "เหรียญสั่งผลิต", quantity: 100, price: 15000, status: "ยื่นคำขอประเมิน",
      revisionCount: 0, salesOwner: "สมหญิง ใจดี",
      material: "ซิงค์อัลลอย", finish: "Shiny Gold", notes: "ลูกค้าต้องการด่วน",
    },
    {
      id: 2, estimateId: "EST-240114001", date: "2024-01-14", lineName: "customer_line_002",
      productType: "เหรียญสั่งผลิต", quantity: 50, price: 25000, status: "เสนอราคา",
      revisionCount: 0, salesOwner: "พนักงานขาย B",
      material: "ทองเหลือง", finish: "Antique Bronze", notes: "",
    },
    {
      id: 3, estimateId: "EST-240113001", date: "2024-01-13", lineName: "customer_line_003",
      productType: "โล่สั่งผลิต", quantity: 200, price: 8000, status: "ยกเลิก",
      revisionCount: 0, salesOwner: "วิภา รักษ์ดี",
      material: "อะคริลิค", finish: "UV Print", notes: "ยกเลิกเนื่องจากเปลี่ยนใจ",
    },
    {
      id: 4, estimateId: "EST-240112001", date: "2024-01-12", lineName: "customer_line_004",
      productType: "กระเป๋า", quantity: 150, price: 18000, status: "อยู่ระหว่างการประเมินราคา",
      revisionCount: 0, salesOwner: "สมหญิง ใจดี",
      material: "ผ้าแคนวาส", finish: "สกรีน", notes: "พิมพ์ลายตามแบบลูกค้า",
    },
    {
      id: 5, estimateId: "EST-240111001", date: "2024-01-11", lineName: "customer_line_005",
      productType: "แก้ว", quantity: 75, price: 32000, status: "เสนอลูกค้า",
      revisionCount: 1, salesOwner: "พนักงานขาย B",
      material: "เซรามิก", finish: "Sublimation", notes: "มีโลโก้ 2 ด้าน",
    },
    {
      id: 6, estimateId: "EST-240116001", date: "2024-01-16", lineName: "nun",
      productType: "เหรียญสั่งผลิต", quantity: 100, price: 20000, status: "ยืนยันเรียบร้อย",
      revisionCount: 0, salesOwner: "วิภา รักษ์ดี",
      material: "ซิงค์อัลลอย", finish: "Shiny Silver", notes: "",
    }
  ];

  const productTypes = productTypesList;

  // Status counts for summary cards
  const statusCounts = useMemo(() => ({
    submitted: estimations.filter(e => e.status === "ยื่นคำขอประเมิน").length,
    inProgress: estimations.filter(e => e.status === "อยู่ระหว่างการประเมินราคา").length,
    quoted: estimations.filter(e => e.status === "เสนอราคา").length,
    proposed: estimations.filter(e => e.status === "เสนอลูกค้า").length,
    confirmed: estimations.filter(e => e.status === "ยืนยันเรียบร้อย").length,
  }), []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ยื่นคำขอประเมิน": return "bg-blue-100 text-blue-700 border-blue-200";
      case "อยู่ระหว่างการประเมินราคา": return "bg-orange-100 text-orange-700 border-orange-200";
      case "เสนอราคา": return "bg-purple-100 text-purple-700 border-purple-200";
      case "เสนอลูกค้า": return "bg-amber-100 text-amber-700 border-amber-200";
      case "ยืนยันเรียบร้อย": return "bg-green-100 text-green-700 border-green-200";
      case "ยกเลิก": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Deep search across all fields
  const deepSearch = useCallback((estimation: typeof estimations[0], term: string): boolean => {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    return Object.values(estimation).some(value => {
      if (Array.isArray(value)) return value.some(v => String(v).toLowerCase().includes(lowerTerm));
      return String(value).toLowerCase().includes(lowerTerm);
    });
  }, []);

  // Highlight matching text
  const highlightText = useCallback((text: string, term: string) => {
    if (!term || !text) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    if (parts.length === 1) return text;
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark> : part
    );
  }, []);

  const filteredEstimations = useMemo(() => {
    return estimations.filter(estimation => {
      // Global deep search
      const matchesSearch = deepSearch(estimation, searchTerm);
      
      // Main date range filter
      const estimationDate = new Date(estimation.date);
      const matchesDateRange = (!startDate || estimationDate >= startDate) && (!endDate || estimationDate <= endDate);
      
      // Main dropdown filters
      const matchesProductType = productTypeFilter === "all" || estimation.productType === productTypeFilter;
      const matchesStatus = statusFilter === "all" || estimation.status === statusFilter;

      // Column header filters
      const matchesColEstimateId = !columnFilters.estimateId || estimation.estimateId.toLowerCase().includes(columnFilters.estimateId.toLowerCase());
      const matchesColLineName = !columnFilters.lineName || estimation.lineName.toLowerCase().includes(columnFilters.lineName.toLowerCase());
      const matchesColProductType = !columnFilters.productType || columnFilters.productType === "all" || estimation.productType === columnFilters.productType;
      const matchesColSalesOwner = !columnFilters.salesOwner || estimation.salesOwner.toLowerCase().includes(columnFilters.salesOwner.toLowerCase());
      const matchesColQuantity = !columnFilters.quantity || estimation.quantity.toString().includes(columnFilters.quantity);

      // Status multi-select column filter
      const matchesStatusMulti = statusMultiFilter.length === 0 || statusMultiFilter.includes(estimation.status);

      // Column date range filter
      let matchesColDate = true;
      if (columnDateRange?.from || columnDateRange?.to) {
        if (columnDateRange.from && columnDateRange.to) {
          matchesColDate = estimationDate >= columnDateRange.from && estimationDate <= columnDateRange.to;
        } else if (columnDateRange.from) {
          matchesColDate = estimationDate >= columnDateRange.from;
        } else if (columnDateRange.to) {
          matchesColDate = estimationDate <= columnDateRange.to;
        }
      }

      return matchesSearch && matchesDateRange && matchesProductType && matchesStatus &&
        matchesColEstimateId && matchesColLineName && matchesColProductType &&
        matchesColSalesOwner && matchesColQuantity && matchesStatusMulti && matchesColDate;
    });
  }, [searchTerm, startDate, endDate, productTypeFilter, statusFilter, columnFilters, statusMultiFilter, columnDateRange, deepSearch]);

  const hasActiveFilters = searchTerm || startDate || endDate || productTypeFilter !== "all" || statusFilter !== "all" || 
    Object.values(columnFilters).some(v => v && v !== "all") || statusMultiFilter.length > 0 || columnDateRange?.from || columnDateRange?.to;

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setProductTypeFilter("all");
    setStatusFilter("all");
    setSearchTerm("");
    setColumnFilters({});
    setStatusMultiFilter([]);
    setColumnDateRange(undefined);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  // Column filter components
  const TextColumnFilter = ({ columnKey, label }: { columnKey: string; label: string }) => (
    <Popover open={openColumnFilter === columnKey} onOpenChange={(open) => setOpenColumnFilter(open ? columnKey : null)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-5 w-5 p-0 ml-1", columnFilters[columnKey] && "text-primary")}>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2 bg-background z-50" align="start">
        <Input
          placeholder={`กรอง${label}...`}
          value={columnFilters[columnKey] || ""}
          onChange={(e) => setColumnFilters(prev => ({ ...prev, [columnKey]: e.target.value }))}
          className="h-8 text-xs"
          autoFocus
        />
        {columnFilters[columnKey] && (
          <Button variant="ghost" size="sm" className="w-full mt-1 text-xs" onClick={() => setColumnFilters(prev => ({ ...prev, [columnKey]: "" }))}>
            ล้าง
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );

  const SelectColumnFilter = ({ columnKey, label, options }: { columnKey: string; label: string; options: string[] }) => (
    <Popover open={openColumnFilter === columnKey} onOpenChange={(open) => setOpenColumnFilter(open ? columnKey : null)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-5 w-5 p-0 ml-1", columnFilters[columnKey] && columnFilters[columnKey] !== "all" && "text-primary")}>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 bg-background z-50" align="start">
        <div className="space-y-1 max-h-48 overflow-auto">
          <Button variant={!columnFilters[columnKey] || columnFilters[columnKey] === "all" ? "secondary" : "ghost"} size="sm" className="w-full justify-start text-xs" onClick={() => { setColumnFilters(prev => ({ ...prev, [columnKey]: "all" })); setOpenColumnFilter(null); }}>
            ทั้งหมด
          </Button>
          {options.map(opt => (
            <Button key={opt} variant={columnFilters[columnKey] === opt ? "secondary" : "ghost"} size="sm" className="w-full justify-start text-xs" onClick={() => { setColumnFilters(prev => ({ ...prev, [columnKey]: opt })); setOpenColumnFilter(null); }}>
              {opt}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  // Status Multi-Select Column Filter
  const StatusMultiSelectFilter = () => (
    <Popover open={openColumnFilter === "statusMulti"} onOpenChange={(open) => setOpenColumnFilter(open ? "statusMulti" : null)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-5 w-5 p-0 ml-1", statusMultiFilter.length > 0 && "text-primary")}>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 bg-background z-50" align="start">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground mb-2">เลือกสถานะ (หลายรายการ)</p>
          {allStatuses.map(status => (
            <div key={status} className="flex items-center gap-2">
              <Checkbox
                id={`col-status-${status}`}
                checked={statusMultiFilter.includes(status)}
                onCheckedChange={(checked) => {
                  setStatusMultiFilter(prev => checked ? [...prev, status] : prev.filter(s => s !== status));
                }}
              />
              <Label htmlFor={`col-status-${status}`} className="text-xs font-normal cursor-pointer flex-1">
                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", getStatusColor(status))}>
                  {status}
                </Badge>
              </Label>
            </div>
          ))}
          {statusMultiFilter.length > 0 && (
            <Button variant="ghost" size="sm" className="w-full text-xs mt-1" onClick={() => setStatusMultiFilter([])}>
              ล้างทั้งหมด
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  // Date Range Column Filter  
  const DateColumnFilter = () => (
    <Popover open={openColumnFilter === "dateCol"} onOpenChange={(open) => setOpenColumnFilter(open ? "dateCol" : null)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-5 w-5 p-0 ml-1", (columnDateRange?.from || columnDateRange?.to) && "text-primary")}>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 bg-background z-50" align="start">
        <p className="text-xs font-medium text-muted-foreground mb-2">เลือกช่วงวันที่</p>
        <CalendarComponent
          mode="range"
          selected={columnDateRange}
          onSelect={setColumnDateRange}
          numberOfMonths={1}
          className={cn("p-2 pointer-events-auto")}
        />
        {(columnDateRange?.from || columnDateRange?.to) && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">
              {columnDateRange.from && format(columnDateRange.from, "d/M/yy")}
              {columnDateRange.to && ` - ${format(columnDateRange.to, "d/M/yy")}`}
            </span>
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setColumnDateRange(undefined)}>
              ล้าง
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );

  // --- Keep all existing handlers ---
  const handleDelete = (id: number) => {
    setSelectedEstimation(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEstimation) {
      toast.success("ลบรายการประเมินราคาเรียบร้อยแล้ว");
      setDeleteDialogOpen(false);
      setSelectedEstimation(null);
    }
  };

  const handleCreateOrder = (estimation: typeof estimations[0]) => {
    navigate("/sales/create-order", { 
      state: { fromEstimation: true, estimationId: estimation.id, estimationData: estimation }
    });
  };

  // Render action buttons based on status (Sales side)
  const renderActionButtons = (estimation: typeof estimations[0]) => {
    const { status, id } = estimation;

    const ViewButton = () => (
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(`/sales/price-estimation/${id}`)}
        className="gap-2 w-[120px] border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
      >
        <Eye className="h-4 w-4" />
        ดูรายละเอียด
      </Button>
    );

    switch (status) {
      case "ยื่นคำขอประเมิน":
        return (
          <div className="flex items-center justify-start gap-3">
            <ViewButton />
            <Button variant="outline" size="sm" onClick={() => toast.success("ยกเลิกคำขอประเมินราคาเรียบร้อยแล้ว")} className="gap-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700">
              <XCircle className="h-4 w-4" />
              ยกเลิกคำขอ
            </Button>
          </div>
        );
      case "อยู่ระหว่างการประเมินราคา":
        return (
          <div className="flex items-center justify-start gap-3">
            <ViewButton />
            <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">จัดซื้อกำลังประเมิน</Badge>
          </div>
        );
      case "เสนอราคา":
        return (
          <div className="flex items-center justify-start gap-3">
            <ViewButton />
            <Button size="sm" onClick={() => toast.success("เปลี่ยนสถานะเป็น 'เสนอลูกค้า' เรียบร้อยแล้ว")} className="gap-2 bg-purple-600 text-white hover:bg-purple-700">
              <Send className="h-4 w-4" />
              ส่งเสนอลูกค้าแล้ว
            </Button>
          </div>
        );
      case "เสนอลูกค้า":
        return (
          <div className="flex items-center justify-start gap-3">
            <ViewButton />
            <Button size="sm" onClick={() => handleCreateOrder(estimation)} className="gap-2 bg-green-600 text-white hover:bg-green-700">
              <CheckCircle className="h-4 w-4" />
              ลูกค้ายืนยัน
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setRevisionEstimation(estimation); setRevisionNote(""); setRevisionReasons([]); setRevisionDialogOpen(true); }} className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 hover:text-orange-700">
              <RotateCcw className="h-4 w-4" />
              ขอแก้ไขราคา
            </Button>
          </div>
        );
      case "ยืนยันเรียบร้อย":
        return (
          <div className="flex items-center justify-start gap-3">
            <ViewButton />
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              จบขั้นตอน
            </Badge>
          </div>
        );
      default:
        return <div className="flex items-center justify-start"><ViewButton /></div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ประเมินราคา</h1>
          <p className="text-muted-foreground">จัดการการประเมินราคาสินค้า</p>
        </div>
        <Button onClick={() => navigate("/sales/price-estimation/add")} className="gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มประเมินราคา
        </Button>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          className={cn("cursor-pointer transition-all hover:shadow-md border-l-4 border-l-blue-500", statusFilter === "ยื่นคำขอประเมิน" && "ring-2 ring-blue-500")}
          onClick={() => setStatusFilter(statusFilter === "ยื่นคำขอประเมิน" ? "all" : "ยื่นคำขอประเมิน")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100"><Send className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">ยื่นคำขอประเมิน</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts.submitted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn("cursor-pointer transition-all hover:shadow-md border-l-4 border-l-orange-500", statusFilter === "อยู่ระหว่างการประเมินราคา" && "ring-2 ring-orange-500")}
          onClick={() => setStatusFilter(statusFilter === "อยู่ระหว่างการประเมินราคา" ? "all" : "อยู่ระหว่างการประเมินราคา")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100"><Clock className="h-5 w-5 text-orange-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">อยู่ระหว่างประเมิน</p>
                <p className="text-2xl font-bold text-orange-600">{statusCounts.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn("cursor-pointer transition-all hover:shadow-md border-l-4 border-l-purple-500", statusFilter === "เสนอราคา" && "ring-2 ring-purple-500")}
          onClick={() => setStatusFilter(statusFilter === "เสนอราคา" ? "all" : "เสนอราคา")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100"><FileText className="h-5 w-5 text-purple-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">เสนอราคา</p>
                <p className="text-2xl font-bold text-purple-600">{statusCounts.quoted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn("cursor-pointer transition-all hover:shadow-md border-l-4 border-l-amber-500", statusFilter === "เสนอลูกค้า" && "ring-2 ring-amber-500")}
          onClick={() => setStatusFilter(statusFilter === "เสนอลูกค้า" ? "all" : "เสนอลูกค้า")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100"><FileCheck className="h-5 w-5 text-amber-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">เสนอลูกค้า</p>
                <p className="text-2xl font-bold text-amber-600">{statusCounts.proposed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={cn("cursor-pointer transition-all hover:shadow-md border-l-4 border-l-green-500", statusFilter === "ยืนยันเรียบร้อย" && "ring-2 ring-green-500")}
          onClick={() => setStatusFilter(statusFilter === "ยืนยันเรียบร้อย" ? "all" : "ยืนยันเรียบร้อย")}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100"><CheckCircle className="h-5 w-5 text-green-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">ยืนยันเรียบร้อย</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.confirmed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการประเมินราคา</CardTitle>
          <div className="flex flex-col gap-4 pt-2">
            {/* Search - Deep Search */}
            <div className="flex gap-2">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="ค้นหาทุกฟิลด์ (LINE, วัสดุ, ชนิดการชุบ, หมายเหตุ...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {hasActiveFilters && (
                <Button variant="outline" size="default" onClick={clearFilters} className="gap-2 text-muted-foreground hover:text-foreground shrink-0">
                  <X className="h-4 w-4" />
                  ล้างค่าการกรองทั้งหมด
                </Button>
              )}
            </div>
            
            {/* Main Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>ตัวกรอง:</span>
              </div>
              
              {/* Date Range Filter */}
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("gap-2 min-w-[140px]", startDate && "border-primary text-primary")}>
                      <Calendar className="h-4 w-4" />
                      {startDate ? format(startDate, "d MMM yyyy", { locale: th }) : "วันที่เริ่มต้น"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                    <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus className={cn("pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">-</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("gap-2 min-w-[140px]", endDate && "border-primary text-primary")}>
                      <Calendar className="h-4 w-4" />
                      {endDate ? format(endDate, "d MMM yyyy", { locale: th }) : "วันที่สิ้นสุด"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                    <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} initialFocus className={cn("pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Product Type Filter */}
              <Select value={productTypeFilter} onValueChange={setProductTypeFilter}>
                <SelectTrigger className={cn("w-[180px] h-9", productTypeFilter !== "all" && "border-primary text-primary")}>
                  <SelectValue placeholder="ประเภทสินค้า" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">ประเภทสินค้าทั้งหมด</SelectItem>
                  {productTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={cn("w-[200px] h-9", statusFilter !== "all" && "border-primary text-primary")}>
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                  {allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Active filter badges */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1 text-xs">
                    ค้นหา: "{searchTerm}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchTerm("")} />
                  </Badge>
                )}
                {statusMultiFilter.map(s => (
                  <Badge key={s} variant="secondary" className="gap-1 text-xs">
                    {s}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusMultiFilter(prev => prev.filter(x => x !== s))} />
                  </Badge>
                ))}
                {Object.entries(columnFilters).filter(([_, v]) => v && v !== "all").map(([k, v]) => (
                  <Badge key={k} variant="secondary" className="gap-1 text-xs">
                    {k}: {v}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setColumnFilters(prev => ({ ...prev, [k]: "" }))} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center">Estimate ID <TextColumnFilter columnKey="estimateId" label="ID" /></div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">วันที่ประเมินราคา <DateColumnFilter /></div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">ชื่อ LINE <TextColumnFilter columnKey="lineName" label="LINE" /></div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">ประเภทสินค้า <SelectColumnFilter columnKey="productType" label="ประเภท" options={productTypesList} /></div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">เซลล์ผู้รับผิดชอบ <TextColumnFilter columnKey="salesOwner" label="เซลล์" /></div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end">จำนวน <TextColumnFilter columnKey="quantity" label="จำนวน" /></div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center">สถานะ <StatusMultiSelectFilter /></div>
                </TableHead>
                <TableHead className="text-center">คัดลอก</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEstimations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    ไม่พบรายการประเมินราคา
                    {hasActiveFilters && (
                      <div className="mt-2">
                        <Button variant="link" onClick={clearFilters} className="text-sm">ล้างตัวกรองทั้งหมด</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEstimations.map((estimation) => (
                  <TableRow key={estimation.id} className="hover:bg-muted/50">
                    <TableCell>
                      <a
                        href={`/sales/price-estimation/${estimation.estimateId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline hover:text-blue-800 cursor-pointer"
                      >
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-mono text-xs hover:bg-blue-100">
                          {highlightText(estimation.estimateId, searchTerm)}
                        </Badge>
                      </a>
                    </TableCell>
                    <TableCell className="font-medium">
                      {format(new Date(estimation.date), "d/M/yyyy", { locale: th })}
                    </TableCell>
                    <TableCell>{highlightText(estimation.lineName, searchTerm)}</TableCell>
                    <TableCell>{highlightText(estimation.productType, searchTerm)}</TableCell>
                    <TableCell>{highlightText(estimation.salesOwner, searchTerm)}</TableCell>
                    <TableCell className="text-right">{estimation.quantity.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("font-medium", getStatusColor(estimation.status))}>
                        {estimation.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setCaptureEstimation(estimation); setCaptureDialogOpen(true); }}>
                              <Copy className="h-3.5 w-3.5" />
                              คัดลอก
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>คัดลอกข้อมูลเป็นรูปภาพเพื่อส่งลูกค้า</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {renderActionButtons(estimation)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบรายการ</AlertDialogTitle>
            <AlertDialogDescription>คุณต้องการลบรายการประเมินราคานี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">ลบรายการ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revision Request Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <RotateCcw className="h-5 w-5 text-orange-500" />
              ขอแก้ไขราคา
            </DialogTitle>
            <DialogDescription>ระบุรายละเอียดที่ต้องการแก้ไข เพื่อส่งให้ฝ่ายจัดซื้อประเมินราคาใหม่</DialogDescription>
          </DialogHeader>

          {revisionEstimation && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="text-sm font-medium">รายการ #{revisionEstimation.id}</p>
                <p className="text-xs text-muted-foreground">
                  {revisionEstimation.productType} • {revisionEstimation.quantity.toLocaleString()} ชิ้น • {revisionEstimation.price.toLocaleString()} บาท
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">สาเหตุที่ต้องการแก้ไข</Label>
                {["ราคาสูงเกินไป", "ต้องการเปลี่ยนวัสดุ", "ต้องการเปลี่ยนจำนวน", "ต้องการเปลี่ยนขนาด / รูปแบบ", "ลูกค้าแจ้งงบประมาณใหม่"].map((reason) => (
                  <div key={reason} className="flex items-center gap-2">
                    <Checkbox id={reason} checked={revisionReasons.includes(reason)} onCheckedChange={(checked) => setRevisionReasons(prev => checked ? [...prev, reason] : prev.filter(r => r !== reason))} />
                    <Label htmlFor={reason} className="text-sm font-normal cursor-pointer">{reason}</Label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">รายละเอียดเพิ่มเติม</Label>
                <Textarea placeholder="ระบุรายละเอียดที่ต้องการแก้ไข เช่น งบประมาณใหม่ วัสดุที่ต้องการ..." value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} rows={3} />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRevisionDialogOpen(false)}>ยกเลิก</Button>
            <Button
              onClick={() => {
                if (revisionReasons.length === 0 && !revisionNote.trim()) {
                  toast.error("กรุณาระบุสาเหตุหรือรายละเอียดที่ต้องการแก้ไข");
                  return;
                }
                toast.success("ส่งคำขอแก้ไขราคาไปยังฝ่ายจัดซื้อเรียบร้อยแล้ว");
                setRevisionDialogOpen(false);
              }}
              className="gap-2 bg-orange-500 text-white hover:bg-orange-600"
            >
              <RotateCcw className="h-4 w-4" />
              ขอแก้ไขราคา
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Capture Image Dialog */}
      <Dialog open={captureDialogOpen} onOpenChange={setCaptureDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>คัดลอกข้อมูลเสนอราคา</DialogTitle>
            <DialogDescription>คัดลอกรูปภาพเพื่อส่งให้ลูกค้า</DialogDescription>
          </DialogHeader>
          {captureEstimation && (
            <EstimationCaptureCard
              data={{
                estimateId: captureEstimation.estimateId,
                productType: captureEstimation.productType,
                material: captureEstimation.material || "ซิงค์อัลลอย",
                size: "5 ซม.",
                thickness: "3 มม.",
                finish: captureEstimation.finish || "ชุบทอง",
                totalQuantity: captureEstimation.quantity,
                designCount: 2,
                medalPrice: 16000,
                strapPrice: 1500,
                totalPrice: 17500,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
