import { useState, useMemo } from "react";
import { format } from "date-fns";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Wallet, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  FileSpreadsheet,
  Eye,
  Check,
  Paperclip,
  Pencil,
  CalendarIcon,
  FileCheck,
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  BarChart3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface PettyCashRequest {
  id: string;
  employee: string;
  department: string;
  amount: number;
  requestDate: string;
  category: string;
  subCategory?: string;
  description: string;
  status: "รออนุมัติ" | "รอเบิกจ่าย" | "จ่ายแล้ว" | "ยกเลิก";
  approver?: string;
  approvedDate?: string;
  paidDate?: string;
  paymentMethod: string;
  clearanceStatus: "รอเคลียร์" | "เคลียร์แล้ว";
  clearanceDate?: string;
  attachments?: string[];
  notes?: string;
  // PEAK fields (optional)
  taxId13?: string;
  branchCode5?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  taxRecordDate?: string;
  priceType?: string;
  accountCode?: string;
  quantity?: number;
  taxRate?: string;
  withholdingTax?: string;
  paidBy?: string;
  paidAmount?: number;
  pnd?: string;
  classificationGroup?: string;
}

const EXPENSE_CATEGORIES = [
  { value: "คืนเงินลูกค้า", label: "คืนเงินลูกค้า", hasSubField: "qo" },
  { value: "ค่าน้ำมัน", label: "ค่าน้ำมัน", hasSubField: "mileage" },
  { value: "ค่าทางด่วน", label: "ค่าทางด่วน", hasSubField: "actual" },
  { value: "สวัสดิการพนักงาน", label: "สวัสดิการพนักงาน", hasSubField: "welfare" },
  { value: "ค่าส่งสินค้า", label: "ค่าส่งสินค้า", hasSubField: "delivery" },
  { value: "ค่าเติมน้ำมันรถบริษัท", label: "ค่าเติมน้ำมันรถบริษัท", hasSubField: "vehicle" },
  { value: "ค่าของใช้", label: "ค่าของใช้", hasSubField: "macro" },
  { value: "ค่าสำรองจ่าย", label: "ค่าสำรองจ่าย", hasSubField: null },
  { value: "อื่น ๆ", label: "อื่น ๆ", hasSubField: "other" },
];

const WELFARE_OPTIONS = ["วันเกิด", "รางวัล", "เลี้ยงส่ง"];
const DELIVERY_OPTIONS = ["Goship", "นครชัยแอร์", "มะม่วง", "NTC", "Flash", "Lalamove"];
const VEHICLE_OPTIONS = ["MG 7กฌ3439", "NISSAN 2ฒผ3439", "MG 5ขล2700", "BENZ ภษ298"];

const PeakFieldsSection = ({ prefix = "", defaultValues = {} as Partial<PettyCashRequest> }: { prefix?: string; defaultValues?: Partial<PettyCashRequest> }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" type="button" className="w-full justify-between border border-dashed border-muted-foreground/30 px-4 py-2 h-auto">
          <span className="text-sm font-medium text-muted-foreground">ข้อมูล PEAK (ไม่บังคับ)</span>
          {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}taxId13`}>เลขทะเบียน 13 หลัก</Label>
            <Input id={`${prefix}taxId13`} placeholder="0105557083391" maxLength={13} defaultValue={defaultValues.taxId13 || ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}branchCode5`}>เลขสาขา 5 หลัก</Label>
            <Input id={`${prefix}branchCode5`} placeholder="00000" maxLength={5} defaultValue={defaultValues.branchCode5 || ""} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}invoiceNo`}>เลขที่ใบกำกับฯ</Label>
            <Input id={`${prefix}invoiceNo`} placeholder="IV2020/001" maxLength={35} defaultValue={defaultValues.invoiceNo || ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}invoiceDate`}>วันที่ใบกำกับฯ</Label>
            <Input id={`${prefix}invoiceDate`} type="date" defaultValue={defaultValues.invoiceDate || ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}taxRecordDate`}>วันที่บันทึกภาษีซื้อ</Label>
            <Input id={`${prefix}taxRecordDate`} type="date" defaultValue={defaultValues.taxRecordDate || ""} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}priceType`}>ประเภทราคา</Label>
            <Select defaultValue={defaultValues.priceType || ""}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - แยกภาษี</SelectItem>
                <SelectItem value="2">2 - รวมภาษี</SelectItem>
                <SelectItem value="3">3 - ไม่มีภาษี</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}accountCode`}>บัญชี</Label>
            <Input id={`${prefix}accountCode`} placeholder="530306" defaultValue={defaultValues.accountCode || ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}quantity`}>จำนวน</Label>
            <Input id={`${prefix}quantity`} type="number" placeholder="1" step="0.0001" defaultValue={defaultValues.quantity || ""} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}taxRate`}>อัตราภาษี</Label>
            <Select defaultValue={defaultValues.taxRate || ""}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกอัตรา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NO">NO - ไม่มีภาษี</SelectItem>
                <SelectItem value="7%">7%</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}withholdingTax`}>หัก ณ ที่จ่าย</Label>
            <Input id={`${prefix}withholdingTax`} placeholder="0 หรือ 3%" defaultValue={defaultValues.withholdingTax || ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}pnd`}>ภ.ง.ด.</Label>
            <Select defaultValue={defaultValues.pnd || ""}>
              <SelectTrigger>
                <SelectValue placeholder="เลือก ภ.ง.ด." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">ภ.ง.ด.1</SelectItem>
                <SelectItem value="2">ภ.ง.ด.2</SelectItem>
                <SelectItem value="3">ภ.ง.ด.3</SelectItem>
                <SelectItem value="53">ภ.ง.ด.53</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${prefix}paidBy`}>ชำระโดย (รหัสช่องทางการเงิน)</Label>
            <Input id={`${prefix}paidBy`} placeholder="CSH001" defaultValue={defaultValues.paidBy || ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${prefix}paidAmount`}>จำนวนเงินที่ชำระ</Label>
            <Input id={`${prefix}paidAmount`} type="number" placeholder="0" step="0.01" defaultValue={defaultValues.paidAmount || ""} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${prefix}classificationGroup`}>กลุ่มจัดประเภท</Label>
          <Input id={`${prefix}classificationGroup`} placeholder="G001-00001" defaultValue={defaultValues.classificationGroup || ""} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default function StandalonePettyCash() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PettyCashRequest | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clearDate, setClearDate] = useState<Date>(new Date());
  
  // Monthly popup state
  const [monthPopupOpen, setMonthPopupOpen] = useState(false);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterEmployee, setFilterEmployee] = useState<string>("all");
  const [filterClearanceStatus, setFilterClearanceStatus] = useState<string>("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>("all");
  const [requests, setRequests] = useState<PettyCashRequest[]>([
    {
      id: "PC-20250110-001",
      employee: "สมชาย ใจดี",
      department: "ขาย",
      amount: 1500,
      requestDate: "2025-01-10",
      category: "ค่าน้ำมัน",
      subCategory: "ขาไป: 15,234 km / ขากลับ: 15,456 km",
      description: "เดินทางพบลูกค้า",
      status: "จ่ายแล้ว",
      paymentMethod: "เงินสด",
      clearanceStatus: "รอเคลียร์",
    },
    {
      id: "PC-20250109-002",
      employee: "สมหญิง รักงาน",
      department: "บัญชี",
      amount: 500,
      requestDate: "2025-01-09",
      category: "ค่าของใช้",
      description: "ซื้อเครื่องเขียน",
      status: "จ่ายแล้ว",
      approver: "ผู้จัดการฝ่ายบัญชี",
      approvedDate: "2025-01-09",
      paidDate: "2025-01-09",
      paymentMethod: "เงินสด",
      clearanceStatus: "เคลียร์แล้ว",
      clearanceDate: "2025-01-15",
    },
    {
      id: "PC-20250108-003",
      employee: "สมศักดิ์ มั่นคง",
      department: "ผลิต",
      amount: 2300,
      requestDate: "2025-01-08",
      category: "ค่าส่งสินค้า",
      description: "ส่งสินค้าลูกค้า A",
      status: "จ่ายแล้ว",
      paymentMethod: "เงินสด",
      clearanceStatus: "รอเคลียร์",
    },
  ]);

  // Get unique values for filters
  const uniqueEmployees = useMemo(() => 
    [...new Set(requests.map(r => r.employee))], [requests]
  );
  const uniqueDepartments = useMemo(() => 
    [...new Set(requests.map(r => r.department))], [requests]
  );
  const uniqueCategories = useMemo(() => 
    [...new Set(requests.map(r => r.category))], [requests]
  );
  const uniquePaymentMethods = useMemo(() => 
    [...new Set(requests.map(r => r.paymentMethod))], [requests]
  );

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        request.id.toLowerCase().includes(searchLower) ||
        request.employee.toLowerCase().includes(searchLower) ||
        request.department.toLowerCase().includes(searchLower) ||
        request.category.toLowerCase().includes(searchLower) ||
        (request.subCategory?.toLowerCase().includes(searchLower) ?? false) ||
        request.description.toLowerCase().includes(searchLower) ||
        request.amount.toString().includes(searchLower) ||
        request.requestDate.includes(searchLower) ||
        request.status.toLowerCase().includes(searchLower) ||
        request.paymentMethod.toLowerCase().includes(searchLower) ||
        request.clearanceStatus.toLowerCase().includes(searchLower) ||
        (request.approver?.toLowerCase().includes(searchLower) ?? false) ||
        (request.approvedDate?.includes(searchLower) ?? false) ||
        (request.paidDate?.includes(searchLower) ?? false) ||
        (request.clearanceDate?.includes(searchLower) ?? false) ||
        (request.notes?.toLowerCase().includes(searchLower) ?? false);

      const matchesStatus = filterStatus === "all" || request.status === filterStatus;
      const matchesCategory = filterCategory === "all" || request.category === filterCategory;
      const matchesDepartment = filterDepartment === "all" || request.department === filterDepartment;
      const matchesEmployee = filterEmployee === "all" || request.employee === filterEmployee;
      const matchesClearance = filterClearanceStatus === "all" || request.clearanceStatus === filterClearanceStatus;
      const matchesPayment = filterPaymentMethod === "all" || request.paymentMethod === filterPaymentMethod;

      return matchesSearch && matchesStatus && matchesCategory && matchesDepartment && 
             matchesEmployee && matchesClearance && matchesPayment;
    });
  }, [requests, searchQuery, filterStatus, filterCategory, filterDepartment, 
      filterEmployee, filterClearanceStatus, filterPaymentMethod]);

  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus("all");
    setFilterCategory("all");
    setFilterDepartment("all");
    setFilterEmployee("all");
    setFilterClearanceStatus("all");
    setFilterPaymentMethod("all");
  };

  const hasActiveFilters = searchQuery !== "" || filterStatus !== "all" || 
    filterCategory !== "all" || filterDepartment !== "all" || 
    filterEmployee !== "all" || filterClearanceStatus !== "all" || 
    filterPaymentMethod !== "all";

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "รออนุมัติ").length,
    readyToPay: requests.filter(r => r.status === "รอเบิกจ่าย").length,
    paid: requests.filter(r => r.status === "จ่ายแล้ว").length,
    balance: 50000,
  };

  // Monthly spending data
  const monthlySpendingData = useMemo(() => {
    const months = [
      { key: "01", label: "ม.ค." }, { key: "02", label: "ก.พ." },
      { key: "03", label: "มี.ค." }, { key: "04", label: "เม.ย." },
      { key: "05", label: "พ.ค." }, { key: "06", label: "มิ.ย." },
      { key: "07", label: "ก.ค." }, { key: "08", label: "ส.ค." },
      { key: "09", label: "ก.ย." }, { key: "10", label: "ต.ค." },
      { key: "11", label: "พ.ย." }, { key: "12", label: "ธ.ค." },
    ];
    return months.map(m => {
      const monthRequests = requests.filter(r => r.requestDate.substring(5, 7) === m.key);
      const total = monthRequests.reduce((sum, r) => sum + r.amount, 0);
      const count = monthRequests.length;
      return { month: m.label, monthKey: m.key, total, count };
    });
  }, [requests]);

  const totalSpentThisYear = useMemo(() => 
    requests.filter(r => r.status === "จ่ายแล้ว").reduce((sum, r) => sum + r.amount, 0),
    [requests]
  );

  const avgMonthlySpending = useMemo(() => {
    const activeMonths = monthlySpendingData.filter(m => m.total > 0).length;
    return activeMonths > 0 ? Math.round(totalSpentThisYear / activeMonths) : 0;
  }, [monthlySpendingData, totalSpentThisYear]);

  const selectedMonthRequests = useMemo(() => {
    if (!selectedMonthKey) return [];
    return requests.filter(r => r.requestDate.substring(5, 7) === selectedMonthKey);
  }, [requests, selectedMonthKey]);

  const selectedMonthLabel = useMemo(() => {
    const labels: Record<string, string> = {
      "01": "มกราคม", "02": "กุมภาพันธ์", "03": "มีนาคม", "04": "เมษายน",
      "05": "พฤษภาคม", "06": "มิถุนายน", "07": "กรกฎาคม", "08": "สิงหาคม",
      "09": "กันยายน", "10": "ตุลาคม", "11": "พฤศจิกายน", "12": "ธันวาคม",
    };
    return selectedMonthKey ? labels[selectedMonthKey] || "" : "";
  }, [selectedMonthKey]);

  const selectedMonthTotal = useMemo(() => 
    selectedMonthRequests.reduce((sum, r) => sum + r.amount, 0),
    [selectedMonthRequests]
  );

  const handleBarClick = (data: any) => {
    if (data?.activePayload?.[0]?.payload) {
      const payload = data.activePayload[0].payload;
      if (payload.total > 0) {
        setSelectedMonthKey(payload.monthKey);
        setMonthPopupOpen(true);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      "รออนุมัติ": "secondary",
      "รอเบิกจ่าย": "default",
      "จ่ายแล้ว": "outline",
      "ยกเลิก": "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getCategoryConfig = () => {
    return EXPENSE_CATEGORIES.find(cat => cat.value === selectedCategory);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("บันทึกคำขอเบิกเงินสดย่อยสำเร็จ");
    setIsDialogOpen(false);
  };

  const handleViewRequest = (request: PettyCashRequest) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  const handleEditRequest = (request: PettyCashRequest) => {
    setSelectedRequest(request);
    setEditCategory(request.category);
    setIsEditDialogOpen(true);
  };

  const getEditCategoryConfig = () => {
    return EXPENSE_CATEGORIES.find(cat => cat.value === editCategory);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("แก้ไขคำขอเบิกเงินสดย่อยสำเร็จ");
    setIsEditDialogOpen(false);
    setSelectedRequest(null);
  };

  const handleStatusChange = (requestId: string, newStatus: PettyCashRequest["status"]) => {
    setRequests(prev => prev.map(req => 
      req.id === requestId ? { ...req, status: newStatus } : req
    ));
    toast.success(`เปลี่ยนสถานะเป็น "${newStatus}" สำเร็จ`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const clearableIds = filteredRequests
        .filter(r => r.clearanceStatus === "รอเคลียร์")
        .map(r => r.id);
      setSelectedIds(clearableIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const isAllSelected = filteredRequests.filter(r => r.clearanceStatus === "รอเคลียร์").length > 0 &&
    filteredRequests.filter(r => r.clearanceStatus === "รอเคลียร์").every(r => selectedIds.includes(r.id));

  const selectedAmount = requests
    .filter(r => selectedIds.includes(r.id))
    .reduce((sum, r) => sum + r.amount, 0);

  const generateClearDocNo = () => {
    const now = new Date();
    const year = now.getFullYear();
    const count = String(Math.floor(Math.random() * 1000) + 1).padStart(3, '0');
    return `PC-CL-${year}${count}`;
  };

  const handleClearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clearDateStr = format(clearDate, "yyyy-MM-dd");
    setRequests(prev => prev.map(req => 
      selectedIds.includes(req.id) 
        ? { ...req, clearanceStatus: "เคลียร์แล้ว" as const, clearanceDate: clearDateStr }
        : req
    ));
    toast.success(`เคลียร์เงินสดย่อย ${selectedIds.length} รายการ ยอด ฿${selectedAmount.toLocaleString()} สำเร็จ`);
    setIsClearDialogOpen(false);
    setSelectedIds([]);
  };

  const handleExportPEAK = () => {
    const headers = [
      "ลำดับที่*", "วันที่เอกสาร", "อ้างอิงถึง", "ผู้รับเงิน/คู่ค้า",
      "เลขทะเบียน 13 หลัก", "เลขสาขา 5 หลัก", "เลขที่ใบกำกับฯ (ถ้ามี)",
      "วันที่ใบกำกับฯ (ถ้ามี)", "วันที่บันทึกภาษีซื้อ (ถ้ามี)", "ประเภทราคา",
      "บัญชี", "คำอธิบาย", "จำนวน", "ราคาต่อหน่วย", "อัตราภาษี",
      "หัก ณ ที่จ่าย (ถ้ามี)", "ชำระโดย", "จำนวนเงินที่ชำระ",
      "ภ.ง.ด. (ถ้ามี)", "หมายเหตุ", "กลุ่มจัดประเภท"
    ];

    const rows = filteredRequests.map((req, idx) => {
      const docDate = req.requestDate.replace(/-/g, "");
      return [
        idx + 1,
        docDate,
        req.id,
        req.employee,
        req.taxId13 || "",
        req.branchCode5 || "",
        req.invoiceNo || "",
        req.invoiceDate ? req.invoiceDate.replace(/-/g, "") : "",
        req.taxRecordDate ? req.taxRecordDate.replace(/-/g, "") : "",
        req.priceType || 3,
        req.accountCode || "",
        `${req.category} - ${req.description}`,
        req.quantity || 1,
        req.amount,
        req.taxRate || "NO",
        req.withholdingTax || 0,
        req.paidBy || "",
        req.paidAmount || req.amount,
        req.pnd || "",
        req.notes || "",
        req.classificationGroup || "",
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PEAK_ImportExpense");
    XLSX.writeFile(wb, `PEAK_ImportExpense_${format(new Date(), "yyyyMMdd")}.xlsx`);
    toast.success("Export ไฟล์ PEAK สำเร็จ");
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">เบิกเงินสดย่อย</h1>
            <p className="text-muted-foreground mt-1">
              บันทึกคำขอเบิกเงินสด พร้อมสถานะการอนุมัติและการจ่าย
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportPEAK}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Export PEAK
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  ขอเบิกใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>สร้างคำขอเบิกเงินสดย่อย</DialogTitle>
                  <DialogDescription>
                    กรอกข้อมูลคำขอเบิกเงินสดย่อยและรอการอนุมัติ
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">รหัสคำขอ</Label>
                      <Input 
                        id="code" 
                        value="PC-20250110-003" 
                        disabled 
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expNumber">เลขที่ EXP</Label>
                      <Input 
                        id="expNumber" 
                        placeholder="กรอกเลขที่ EXP"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="requestDate">วันที่เบิก</Label>
                      <Input 
                        id="requestDate" 
                        type="date" 
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee">ชื่อ-นามสกุลพนักงาน *</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกพนักงาน" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emp1">สมชาย ใจดี</SelectItem>
                          <SelectItem value="emp2">สมหญิง รักงาน</SelectItem>
                          <SelectItem value="emp3">สมศักดิ์ มั่นคง</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">แผนก *</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกแผนก" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales">ขาย</SelectItem>
                          <SelectItem value="accounting">บัญชี</SelectItem>
                          <SelectItem value="production">ผลิต</SelectItem>
                          <SelectItem value="procurement">จัดซื้อ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">จำนวนเงิน (บาท) *</Label>
                      <Input 
                        id="amount" 
                        type="number" 
                        placeholder="0.00" 
                        required
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">หมวดหมู่ค่าใช้จ่าย *</Label>
                      <Select 
                        required 
                        value={selectedCategory} 
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกหมวดหมู่" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Conditional Sub-fields */}
                  {getCategoryConfig()?.hasSubField === "qo" && (
                    <div className="space-y-2">
                      <Label htmlFor="qoNumber">QO Number</Label>
                      <Input id="qoNumber" placeholder="ระบุเลข QO" />
                    </div>
                  )}

                  {getCategoryConfig()?.hasSubField === "mileage" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mileageOut">กิโลขาไป (km)</Label>
                        <Input id="mileageOut" type="number" placeholder="0" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mileageReturn">กิโลขากลับ (km)</Label>
                        <Input id="mileageReturn" type="number" placeholder="0" />
                      </div>
                    </div>
                  )}

                  {getCategoryConfig()?.hasSubField === "actual" && (
                    <div className="space-y-2">
                      <Label htmlFor="tollActual">จำนวนเงินตามจริง</Label>
                      <Input id="tollActual" placeholder="ตามจริง" disabled className="bg-muted" />
                    </div>
                  )}

                  {getCategoryConfig()?.hasSubField === "welfare" && (
                    <div className="space-y-2">
                      <Label htmlFor="welfareType">ประเภทสวัสดิการ</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกประเภท" />
                        </SelectTrigger>
                        <SelectContent>
                          {WELFARE_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {getCategoryConfig()?.hasSubField === "delivery" && (
                    <div className="space-y-2">
                      <Label htmlFor="deliveryService">บริการขนส่ง</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกบริการ" />
                        </SelectTrigger>
                        <SelectContent>
                          {DELIVERY_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {getCategoryConfig()?.hasSubField === "vehicle" && (
                    <div className="space-y-2">
                      <Label htmlFor="vehicleId">ทะเบียนรถ</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกรถ" />
                        </SelectTrigger>
                        <SelectContent>
                          {VEHICLE_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {getCategoryConfig()?.hasSubField === "macro" && (
                    <div className="space-y-2">
                      <Label htmlFor="macroDetails">รายละเอียด Macro</Label>
                      <Input id="macroDetails" placeholder="ระบุรายละเอียด" />
                    </div>
                  )}

                  {getCategoryConfig()?.hasSubField === "other" && (
                    <div className="space-y-2">
                      <Label htmlFor="otherDetails">โปรดระบุเพิ่มเติม</Label>
                      <Input id="otherDetails" placeholder="ระบุรายละเอียด" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="description">รายละเอียดการเบิก *</Label>
                    <Textarea 
                      id="description" 
                      placeholder="อธิบายรายละเอียดการเบิกเงิน" 
                      required
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="approver">ผู้อนุมัติ *</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกผู้อนุมัติ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mgr1">ผู้จัดการฝ่ายบัญชี</SelectItem>
                          <SelectItem value="mgr2">ผู้จัดการฝ่ายขาย</SelectItem>
                          <SelectItem value="mgr3">ผู้อำนวยการ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethod">ช่องทางจ่ายเงิน *</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกช่องทาง" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">เงินสด</SelectItem>
                          <SelectItem value="transfer">โอน</SelectItem>
                          <SelectItem value="promptpay">PromptPay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="attachments">แนบเอกสาร/ใบเสร็จ</Label>
                    <Input id="attachments" type="file" multiple />
                    <p className="text-xs text-muted-foreground">
                      รองรับไฟล์ PDF, JPG, PNG (ไม่เกิน 5MB ต่อไฟล์)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">หมายเหตุ</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)" 
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="createdBy">ผู้สร้างคำขอ *</Label>
                    <Select required>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกผู้สร้างคำขอ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="emp1">สมชาย ใจดี</SelectItem>
                        <SelectItem value="emp2">สมหญิง รักงาน</SelectItem>
                        <SelectItem value="emp3">สมศักดิ์ มั่นคง</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* PEAK Optional Fields */}
                  <PeakFieldsSection prefix="create-" />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      ยกเลิก
                    </Button>
                    <Button type="submit">
                      บันทึกคำขอ
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="ยอดเงินคงเหลือ"
            value={`฿${stats.balance.toLocaleString()}`}
            icon={<Wallet className="h-5 w-5" />}
          />
          <StatsCard
            title="รออนุมัติ"
            value={stats.pending.toString()}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatsCard
            title="รอเบิกจ่าย"
            value={stats.readyToPay.toString()}
            icon={<AlertCircle className="h-5 w-5" />}
          />
          <StatsCard
            title="จ่ายแล้ว"
            value={stats.paid.toString()}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        </div>

        {/* Monthly Spending Overview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                ภาพรวมการจ่ายรายเดือน
              </CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">ยอดจ่ายทั้งปี:</span>
                  <span className="font-bold text-primary">฿{totalSpentThisYear.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">เฉลี่ย/เดือน:</span>
                  <span className="font-bold">฿{avgMonthlySpending.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlySpendingData} onClick={handleBarClick} className="cursor-pointer">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `฿${(v/1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: number) => [`฿${value.toLocaleString()}`, "ยอดเบิก"]}
                      labelFormatter={(label) => `เดือน ${label}`}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} cursor="pointer" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Monthly Summary Cards */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {monthlySpendingData.filter(m => m.total > 0).map((m) => (
                  <div key={m.month} className="flex items-center justify-between p-2.5 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{m.month}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">฿{m.total.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{m.count} รายการ</p>
                    </div>
                  </div>
                ))}
                {monthlySpendingData.every(m => m.total === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">ยังไม่มีข้อมูลการจ่าย</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">
              เลือก {selectedIds.length} รายการ (รวม ฿{selectedAmount.toLocaleString()})
            </span>
            <Button onClick={() => setIsClearDialogOpen(true)}>
              <FileCheck className="mr-2 h-4 w-4" />
              เคลียร์เงินสดย่อย
            </Button>
          </div>
        )}

        {/* Filter Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                ค้นหาและกรองข้อมูล
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  <X className="mr-1 h-4 w-4" />
                  ล้างตัวกรอง
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาทุกข้อมูล: รหัส, พนักงาน, แผนก, หมวดหมู่, รายละเอียด, จำนวนเงิน, วันที่, หมายเหตุ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">สถานะ</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="รออนุมัติ">รออนุมัติ</SelectItem>
                    <SelectItem value="รอเบิกจ่าย">รอเบิกจ่าย</SelectItem>
                    <SelectItem value="จ่ายแล้ว">จ่ายแล้ว</SelectItem>
                    <SelectItem value="ยกเลิก">ยกเลิก</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">หมวดหมู่</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {uniqueCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">แผนก</Label>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {uniqueDepartments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">พนักงาน</Label>
                <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {uniqueEmployees.map(emp => (
                      <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">การเคลียร์</Label>
                <Select value={filterClearanceStatus} onValueChange={setFilterClearanceStatus}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="รอเคลียร์">รอเคลียร์</SelectItem>
                    <SelectItem value="เคลียร์แล้ว">เคลียร์แล้ว</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ช่องทางจ่าย</Label>
                <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {uniquePaymentMethods.map(method => (
                      <SelectItem key={method} value={method}>{method}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Results Summary */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>แสดง {filteredRequests.length} จาก {requests.length} รายการ</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>รายการเบิกเงินสดย่อย ({filteredRequests.length} รายการ)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>รหัส</TableHead>
                  <TableHead>พนักงาน</TableHead>
                  <TableHead>แผนก</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead className="text-right">จำนวนเงิน</TableHead>
                  <TableHead>วันที่ขอ</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-center">การเคลียร์</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.map((request) => (
                  <TableRow key={request.id} className={selectedIds.includes(request.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(request.id)}
                        onCheckedChange={(checked) => handleSelectRow(request.id, checked as boolean)}
                        disabled={request.clearanceStatus === "เคลียร์แล้ว"}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.employee}</TableCell>
                    <TableCell>{request.department}</TableCell>
                    <TableCell>
                      <div>
                        <span>{request.category}</span>
                        {request.subCategory && (
                          <p className="text-xs text-muted-foreground">{request.subCategory}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{request.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      ฿{request.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{request.requestDate}</TableCell>
                    <TableCell>
                      <Select
                        value={request.status}
                        onValueChange={(value) => handleStatusChange(request.id, value as PettyCashRequest["status"])}
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="รออนุมัติ">
                            <Badge variant="secondary" className="cursor-pointer">รออนุมัติ</Badge>
                          </SelectItem>
                          <SelectItem value="รอเบิกจ่าย">
                            <Badge variant="default" className="cursor-pointer">รอเบิกจ่าย</Badge>
                          </SelectItem>
                          <SelectItem value="จ่ายแล้ว">
                            <Badge variant="outline" className="cursor-pointer">จ่ายแล้ว</Badge>
                          </SelectItem>
                          <SelectItem value="ยกเลิก">
                            <Badge variant="destructive" className="cursor-pointer">ยกเลิก</Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center">
                      {request.clearanceStatus === "เคลียร์แล้ว" ? (
                        <div className="flex flex-col items-center gap-1">
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
                            เคลียร์แล้ว
                          </Badge>
                          {request.clearanceDate && (
                            <span className="text-xs text-muted-foreground">{request.clearanceDate}</span>
                          )}
                        </div>
                      ) : (
                        <Badge variant="destructive">
                          ยังไม่เคลียร์
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleViewRequest(request)}
                          title="ดูรายละเอียด"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEditRequest(request)}
                          title="แก้ไข"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {request.status === "รออนุมัติ" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600">
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {request.attachments && request.attachments.length > 0 && (
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Paperclip className="h-4 w-4" />
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

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>รายละเอียดคำขอเบิกเงินสดย่อย</DialogTitle>
              <DialogDescription>
                ดูข้อมูลคำขอเบิกเงินสดย่อยและสถานะการอนุมัติ
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>รหัสคำขอ</Label>
                    <Input value={selectedRequest.id} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>วันที่เบิก</Label>
                    <Input value={selectedRequest.requestDate} disabled className="bg-muted" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ชื่อ-นามสกุลพนักงาน</Label>
                    <Input value={selectedRequest.employee} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>แผนก</Label>
                    <Input value={selectedRequest.department} disabled className="bg-muted" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>จำนวนเงิน (บาท)</Label>
                    <Input value={`฿${selectedRequest.amount.toLocaleString()}`} disabled className="bg-muted font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label>หมวดหมู่ค่าใช้จ่าย</Label>
                    <Input value={selectedRequest.category} disabled className="bg-muted" />
                  </div>
                </div>

                {selectedRequest.subCategory && (
                  <div className="space-y-2">
                    <Label>รายละเอียดเพิ่มเติม</Label>
                    <Input value={selectedRequest.subCategory} disabled className="bg-muted" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>รายละเอียดการเบิก</Label>
                  <Textarea value={selectedRequest.description} disabled className="bg-muted" rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ผู้อนุมัติ</Label>
                    <Input value={selectedRequest.approver || "-"} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>ช่องทางจ่ายเงิน</Label>
                    <Input value={selectedRequest.paymentMethod} disabled className="bg-muted" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>เอกสาร/ใบเสร็จที่แนบ</Label>
                  {selectedRequest.attachments && selectedRequest.attachments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.attachments.map((file, idx) => (
                        <Badge key={idx} variant="outline" className="cursor-pointer">
                          <Paperclip className="mr-1 h-3 w-3" />
                          {file}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">ไม่มีเอกสารแนบ</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>หมายเหตุ</Label>
                  <Textarea value={selectedRequest.notes || "-"} disabled className="bg-muted" rows={2} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>สถานะ</Label>
                    <div className="h-10 flex items-center">
                      {getStatusBadge(selectedRequest.status)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>สถานะเคลียร์</Label>
                    <div className="h-10 flex items-center">
                      {selectedRequest.clearanceStatus === "เคลียร์แล้ว" ? (
                        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">เคลียร์แล้ว</Badge>
                      ) : (
                        <Badge variant="destructive">ยังไม่เคลียร์</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {selectedRequest.approvedDate && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>วันที่อนุมัติ</Label>
                      <Input value={selectedRequest.approvedDate} disabled className="bg-muted" />
                    </div>
                    {selectedRequest.paidDate && (
                      <div className="space-y-2">
                        <Label>วันที่จ่าย</Label>
                        <Input value={selectedRequest.paidDate} disabled className="bg-muted" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                ปิด
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>แก้ไขคำขอเบิกเงินสดย่อย</DialogTitle>
              <DialogDescription>
                แก้ไขข้อมูลคำขอเบิกเงินสดย่อยและรอการอนุมัติ
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-code">รหัสคำขอ</Label>
                    <Input 
                      id="edit-code" 
                      value={selectedRequest.id} 
                      disabled 
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-requestDate">วันที่เบิก</Label>
                    <Input 
                      id="edit-requestDate" 
                      type="date" 
                      defaultValue={selectedRequest.requestDate}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-employee">ชื่อ-นามสกุลพนักงาน *</Label>
                    <Select defaultValue={selectedRequest.employee}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกพนักงาน" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="สมชาย ใจดี">สมชาย ใจดี</SelectItem>
                        <SelectItem value="สมหญิง รักงาน">สมหญิง รักงาน</SelectItem>
                        <SelectItem value="สมศักดิ์ มั่นคง">สมศักดิ์ มั่นคง</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-department">แผนก *</Label>
                    <Select defaultValue={selectedRequest.department}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกแผนก" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ขาย">ขาย</SelectItem>
                        <SelectItem value="บัญชี">บัญชี</SelectItem>
                        <SelectItem value="ผลิต">ผลิต</SelectItem>
                        <SelectItem value="จัดซื้อ">จัดซื้อ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-amount">จำนวนเงิน (บาท) *</Label>
                    <Input 
                      id="edit-amount" 
                      type="number" 
                      defaultValue={selectedRequest.amount}
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">หมวดหมู่ค่าใช้จ่าย *</Label>
                    <Select 
                      value={editCategory} 
                      onValueChange={setEditCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกหมวดหมู่" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Conditional Sub-fields for Edit */}
                {getEditCategoryConfig()?.hasSubField === "qo" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-qoNumber">QO Number</Label>
                    <Input id="edit-qoNumber" placeholder="ระบุเลข QO" />
                  </div>
                )}

                {getEditCategoryConfig()?.hasSubField === "mileage" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-mileageOut">กิโลขาไป (km)</Label>
                      <Input id="edit-mileageOut" type="number" placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-mileageReturn">กิโลขากลับ (km)</Label>
                      <Input id="edit-mileageReturn" type="number" placeholder="0" />
                    </div>
                  </div>
                )}

                {getEditCategoryConfig()?.hasSubField === "actual" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-tollActual">จำนวนเงินตามจริง</Label>
                    <Input id="edit-tollActual" placeholder="ตามจริง" disabled className="bg-muted" />
                  </div>
                )}

                {getEditCategoryConfig()?.hasSubField === "welfare" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-welfareType">ประเภทสวัสดิการ</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกประเภท" />
                      </SelectTrigger>
                      <SelectContent>
                        {WELFARE_OPTIONS.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {getEditCategoryConfig()?.hasSubField === "delivery" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-deliveryService">บริการขนส่ง</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกบริการ" />
                      </SelectTrigger>
                      <SelectContent>
                        {DELIVERY_OPTIONS.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {getEditCategoryConfig()?.hasSubField === "vehicle" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-vehicleId">ทะเบียนรถ</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกรถ" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_OPTIONS.map(option => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {getEditCategoryConfig()?.hasSubField === "macro" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-macroDetails">รายละเอียด Macro</Label>
                    <Input id="edit-macroDetails" placeholder="ระบุรายละเอียด" />
                  </div>
                )}

                {getEditCategoryConfig()?.hasSubField === "other" && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-otherDetails">โปรดระบุเพิ่มเติม</Label>
                    <Input id="edit-otherDetails" placeholder="ระบุรายละเอียด" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="edit-description">รายละเอียดการเบิก *</Label>
                  <Textarea 
                    id="edit-description" 
                    defaultValue={selectedRequest.description}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-approver">ผู้อนุมัติ *</Label>
                    <Select defaultValue={selectedRequest.approver || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกผู้อนุมัติ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ผู้จัดการฝ่ายบัญชี">ผู้จัดการฝ่ายบัญชี</SelectItem>
                        <SelectItem value="ผู้จัดการฝ่ายขาย">ผู้จัดการฝ่ายขาย</SelectItem>
                        <SelectItem value="ผู้อำนวยการ">ผู้อำนวยการ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-paymentMethod">ช่องทางจ่ายเงิน *</Label>
                    <Select defaultValue={selectedRequest.paymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกช่องทาง" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="เงินสด">เงินสด</SelectItem>
                        <SelectItem value="โอน">โอน</SelectItem>
                        <SelectItem value="PromptPay">PromptPay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-attachments">แนบเอกสาร/ใบเสร็จ</Label>
                  <Input id="edit-attachments" type="file" multiple />
                  <p className="text-xs text-muted-foreground">
                    รองรับไฟล์ PDF, JPG, PNG (ไม่เกิน 5MB ต่อไฟล์)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes">หมายเหตุ</Label>
                  <Textarea 
                    id="edit-notes" 
                    defaultValue={selectedRequest.notes || ""}
                    placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)" 
                    rows={2}
                  />
                </div>

                {/* PEAK Optional Fields */}
                <PeakFieldsSection prefix="edit-" defaultValues={selectedRequest} />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit">
                    บันทึกการแก้ไข
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Clearing Modal */}
        <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>บันทึกการเคลียร์เงินสดย่อย</DialogTitle>
              <DialogDescription>
                กรอกข้อมูลหลักฐานการเคลียร์เงิน สำหรับ {selectedIds.length} รายการ
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleClearSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clearDocNo">เลขที่เอกสาร *</Label>
                  <Input 
                    id="clearDocNo" 
                    defaultValue={generateClearDocNo()} 
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>วัน/เดือน/ปี ที่เคลียร์ *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !clearDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {clearDate ? format(clearDate, "dd/MM/yyyy") : "เลือกวันที่"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={clearDate}
                        onSelect={(date) => date && setClearDate(date)}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clearOperator">ผู้ดำเนินการ *</Label>
                  <Select defaultValue="current">
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกผู้ดำเนินการ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">พนักงานปัจจุบัน (ล็อกอิน)</SelectItem>
                      <SelectItem value="mgr1">ผู้จัดการฝ่ายบัญชี</SelectItem>
                      <SelectItem value="mgr2">ผู้อำนวยการ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clearAmount">ยอดเงินรวม (บาท) *</Label>
                  <Input 
                    id="clearAmount" 
                    type="number" 
                    value={selectedAmount}
                    className="bg-muted font-medium"
                    readOnly
                  />
                </div>
              </div>

              {/* Selected items summary */}
              <div className="space-y-2">
                <Label>รายการที่เลือก ({selectedIds.length} รายการ)</Label>
                <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/50">
                  {requests
                    .filter(r => selectedIds.includes(r.id))
                    .map(r => (
                      <div key={r.id} className="flex justify-between text-sm py-1 border-b last:border-b-0">
                        <span>{r.id} - {r.employee}</span>
                        <span className="font-medium">฿{r.amount.toLocaleString()}</span>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clearSlip">แนบสลิปโอนเงิน</Label>
                <Input id="clearSlip" type="file" accept="image/*,.pdf" />
                <p className="text-xs text-muted-foreground">
                  รองรับไฟล์รูปภาพ หรือ PDF (ไม่เกิน 5MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clearRemarks">หมายเหตุ</Label>
                <Textarea 
                  id="clearRemarks" 
                  placeholder="เช่น เคลียร์ยอดสะสมประจำสัปดาห์, หักลบค่าใช้จ่ายส่วนเกิน" 
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsClearDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  <FileCheck className="mr-2 h-4 w-4" />
                  บันทึกการเคลียร์
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        {/* Monthly Detail Popup */}
        <Dialog open={monthPopupOpen} onOpenChange={setMonthPopupOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                รายการเงินสดย่อย — เดือน{selectedMonthLabel}
              </DialogTitle>
              <DialogDescription>
                {selectedMonthRequests.length} รายการ | ยอดรวม ฿{selectedMonthTotal.toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            {selectedMonthRequests.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัส</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>ผู้เบิก</TableHead>
                    <TableHead>หมวด</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead className="text-right">จำนวนเงิน</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่เคลียร์</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedMonthRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-xs">{r.id}</TableCell>
                      <TableCell className="text-xs">{r.requestDate}</TableCell>
                      <TableCell className="text-xs">{r.employee}</TableCell>
                      <TableCell className="text-xs">{r.category}</TableCell>
                      <TableCell className="text-xs max-w-[160px] truncate">{r.description}</TableCell>
                      <TableCell className="text-right text-xs font-semibold">฿{r.amount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell className="text-xs">
                        {r.clearanceStatus === "เคลียร์แล้ว" ? (
                          <Badge variant="outline" className="text-xs border-green-500 text-green-700">{r.clearanceDate}</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">รอเคลียร์</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">ไม่มีรายการในเดือนนี้</p>
            )}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-muted-foreground">
                เคลียร์แล้ว {selectedMonthRequests.filter(r => r.clearanceStatus === "เคลียร์แล้ว").length} / {selectedMonthRequests.length} รายการ
              </span>
              <span className="text-lg font-bold">รวม ฿{selectedMonthTotal.toLocaleString()}</span>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}
