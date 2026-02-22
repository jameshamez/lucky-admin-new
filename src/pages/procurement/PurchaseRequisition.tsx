import { useState, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Plus, FileText, Eye, Pencil, Download, Bell, RotateCcw, Search, Trash2, ChevronsUpDown, X, Upload, ExternalLink, Image as ImageIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ========== Types ==========
interface PRLineItem {
  id: string;
  description: string;
  link: string;
  qty: number;
  unitPrice: number;
  currency: "THB" | "CNY";
  exchangeRate: number;
}

interface PRPayment {
  id: string;
  date: Date;
  amount: number;
  method: string;
}

interface PRAttachment {
  id: string;
  file: File;
  preview: string;
}

interface PRItem {
  id: string;
  prNumber: string;
  issueDate: Date;
  usageDate: Date;
  requester: string;
  purposeType: "new" | "job";
  purposeText: string;
  jobIds: string[];
  channel: string;
  items: PRLineItem[];
  shipping: number;
  includeVat: boolean;
  payments: PRPayment[];
  attachments: PRAttachment[];
  status: "pending" | "ordered" | "received" | "rejected";
}

// ========== Constants ==========
const CI_HEADER = "#b41f24";
const CI_PRIMARY = "#ef4042";
const CI_ACCENT = "#f2d878";

const staffList = [
  "นายสมชาย ใจดี",
  "นางสาวสมหญิง รักงาน",
  "นายวิชัย สุขใจ",
  "นางสาวพิมพ์ใจ ดีมาก",
  "นายอนุชา ทำงาน",
];

const channelOptions = ["Local", "Import", "Online", "Shopee", "Lazada", "ร้านค้าประจำ", "ติดต่อตรง"];

const paymentMethods = ["โอนเงิน", "เงินสด", "เช็ค", "บัตรเครดิต"];

const jobIdOptions = [
  { id: "JOB-2026-001", label: "JOB-2026-001 — ถ้วยรางวัลเกียรติยศ", items: [
    { desc: "ถ้วยรางวัลคริสตัล 12 นิ้ว", qty: 50, price: 1200, currency: "THB" as const },
    { desc: "ฐานไม้สัก", qty: 50, price: 350, currency: "THB" as const },
  ]},
  { id: "JOB-2026-002", label: "JOB-2026-002 — โล่อะคริลิค", items: [
    { desc: "แผ่นอะคริลิคใส 8mm", qty: 100, price: 45, currency: "CNY" as const },
    { desc: "สกรูทองเหลือง", qty: 400, price: 5, currency: "THB" as const },
  ]},
  { id: "JOB-2026-003", label: "JOB-2026-003 — เหรียญที่ระลึก", items: [
    { desc: "แม่พิมพ์เหรียญ", qty: 1, price: 8500, currency: "THB" as const },
  ]},
];

const createEmptyLineItem = (): PRLineItem => ({
  id: String(Date.now()) + Math.random(),
  description: "",
  link: "",
  qty: 0,
  unitPrice: 0,
  currency: "THB",
  exchangeRate: 1,
});

// ========== Sample Data ==========
const initialData: PRItem[] = [
  {
    id: "1",
    prNumber: "PR-2026-0001",
    issueDate: new Date(2026, 1, 10),
    usageDate: new Date(2026, 1, 15),
    requester: "นายสมชาย ใจดี",
    purposeType: "new",
    purposeText: "ใช้ในแผนกบัญชี",
    jobIds: [],
    channel: "Online",
    items: [
      { id: "i1", description: "กระดาษ A4 80 แกรม", link: "https://shopee.co.th/example", qty: 10, unitPrice: 120, currency: "THB", exchangeRate: 1 },
    ],
    shipping: 50,
    includeVat: false,
    payments: [],
    attachments: [],
    status: "pending",
  },
  {
    id: "2",
    prNumber: "PR-2026-0002",
    issueDate: new Date(2026, 1, 8),
    usageDate: new Date(2026, 1, 12),
    requester: "นางสาวสมหญิง รักงาน",
    purposeType: "new",
    purposeText: "เปลี่ยนหมึกเครื่องปริ้นชั้น 2",
    jobIds: [],
    channel: "Local",
    items: [
      { id: "i2", description: "หมึกปริ้นเตอร์ HP 680 สีดำ", link: "", qty: 3, unitPrice: 350, currency: "THB", exchangeRate: 1 },
    ],
    shipping: 0,
    includeVat: true,
    payments: [{ id: "p1", date: new Date(2026, 1, 9), amount: 1050, method: "โอนเงิน" }],
    attachments: [],
    status: "ordered",
  },
  {
    id: "3",
    prNumber: "PR-2026-0003",
    issueDate: new Date(2026, 1, 5),
    usageDate: new Date(2026, 1, 7),
    requester: "นายวิชัย สุขใจ",
    purposeType: "job",
    purposeText: "",
    jobIds: ["JOB-2026-001"],
    channel: "Import",
    items: [
      { id: "i3", description: "ถ้วยรางวัลคริสตัล 12 นิ้ว", link: "", qty: 50, unitPrice: 1200, currency: "THB", exchangeRate: 1 },
      { id: "i4", description: "ฐานไม้สัก", link: "", qty: 50, unitPrice: 350, currency: "THB", exchangeRate: 1 },
    ],
    shipping: 500,
    includeVat: true,
    payments: [],
    attachments: [],
    status: "received",
  },
  {
    id: "4",
    prNumber: "PR-2026-0004",
    issueDate: new Date(2026, 1, 3),
    usageDate: new Date(2026, 1, 10),
    requester: "นางสาวพิมพ์ใจ ดีมาก",
    purposeType: "new",
    purposeText: "ทดแทนเก้าอี้ที่ชำรุด",
    jobIds: [],
    channel: "Lazada",
    items: [
      { id: "i5", description: "เก้าอี้สำนักงาน สีดำ", link: "https://lazada.co.th/example", qty: 1, unitPrice: 4500, currency: "THB", exchangeRate: 1 },
    ],
    shipping: 200,
    includeVat: false,
    payments: [],
    attachments: [],
    status: "rejected",
  },
];

// ========== Helpers ==========
const deepSearchObject = (obj: Record<string, any>, term: string): boolean => {
  const lowerTerm = term.toLowerCase();
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val == null) continue;
    if (typeof val === "string" && val.toLowerCase().includes(lowerTerm)) return true;
    if (typeof val === "number" && String(val).includes(term)) return true;
    if (val instanceof Date && format(val, "dd/MM/yyyy").includes(term)) return true;
    if (Array.isArray(val)) {
      for (const item of val) {
        if (typeof item === "object" && deepSearchObject(item, term)) return true;
      }
    }
    if (typeof val === "object" && !(val instanceof Date) && !Array.isArray(val)) {
      if (deepSearchObject(val, term)) return true;
    }
  }
  return false;
};

const HighlightText = ({ text, search }: { text: string; search: string }) => {
  if (!search || !text) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(search.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-foreground rounded px-0.5">{text.slice(idx, idx + search.length)}</mark>
      {text.slice(idx + search.length)}
    </>
  );
};

const calcLineTotal = (item: PRLineItem) => item.qty * item.unitPrice * (item.currency === "CNY" ? item.exchangeRate : 1);

const calcPRTotal = (pr: PRItem) => {
  const subtotal = pr.items.reduce((s, i) => s + calcLineTotal(i), 0);
  const beforeVat = subtotal + pr.shipping;
  const vat = pr.includeVat ? beforeVat * 0.07 : 0;
  return beforeVat + vat;
};

// ========== Main Component ==========
export default function PurchaseRequisition() {
  const [requests, setRequests] = useState<PRItem[]>(initialData);

  // Drawer state
  const [drawerMode, setDrawerMode] = useState<"create" | "edit" | "view" | null>(null);
  const [activePR, setActivePR] = useState<PRItem | null>(null);

  // Form state for create/edit
  const [form, setForm] = useState<Omit<PRItem, "id" | "prNumber" | "status">>({
    issueDate: new Date(),
    usageDate: new Date(),
    requester: "",
    purposeType: "new",
    purposeText: "",
    jobIds: [],
    channel: "",
    items: [createEmptyLineItem()],
    shipping: 0,
    includeVat: false,
    payments: [],
    attachments: [],
  });

  // Search & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPR, setFilterPR] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined);
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);
  const [filterRequester, setFilterRequester] = useState("");
  const [filterProduct, setFilterProduct] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Sort
  const [sortField, setSortField] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Job search
  const [jobSearchTerm, setJobSearchTerm] = useState("");

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredJobOptions = useMemo(() => {
    if (!jobSearchTerm) return jobIdOptions;
    const term = jobSearchTerm.toLowerCase();
    return jobIdOptions.filter(j =>
      j.id.toLowerCase().includes(term) ||
      j.label.toLowerCase().includes(term) ||
      j.items.some(i => i.desc.toLowerCase().includes(term))
    );
  }, [jobSearchTerm]);

  const hasActiveFilters = searchTerm || filterPR || filterDateFrom || filterDateTo || filterRequester || filterProduct || filterStatus !== "all";

  const resetAllFilters = () => {
    setSearchTerm("");
    setFilterPR("");
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
    setFilterRequester("");
    setFilterProduct("");
    setFilterStatus("all");
  };

  const generatePRNumber = () => {
    const year = new Date().getFullYear();
    const seq = String(requests.length + 1).padStart(4, "0");
    return `PR-${year}-${seq}`;
  };

  // Calculations for form
  const formSubtotal = useMemo(() => form.items.reduce((s, i) => s + calcLineTotal(i), 0), [form.items]);
  const formBeforeVat = formSubtotal + form.shipping;
  const formVat = form.includeVat ? formBeforeVat * 0.07 : 0;
  const formNetTotal = formBeforeVat + formVat;
  const formTotalPaid = form.payments.reduce((s, p) => s + p.amount, 0);
  const formRemaining = formNetTotal - formTotalPaid;

  // Filtered & sorted list
  const filteredRequests = useMemo(() => {
    let result = requests.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterPR && !r.prNumber.toLowerCase().includes(filterPR.toLowerCase())) return false;
      if (filterRequester && !r.requester.toLowerCase().includes(filterRequester.toLowerCase())) return false;
      if (filterProduct) {
        const hasProduct = r.items.some(i => i.description.toLowerCase().includes(filterProduct.toLowerCase()));
        if (!hasProduct) return false;
      }
      if (filterDateFrom && r.issueDate < startOfDay(filterDateFrom)) return false;
      if (filterDateTo && r.issueDate > endOfDay(filterDateTo)) return false;
      if (searchTerm && !deepSearchObject(r as any, searchTerm)) return false;
      return true;
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        let va: any, vb: any;
        switch (sortField) {
          case "prNumber": va = a.prNumber; vb = b.prNumber; break;
          case "issueDate": va = a.issueDate.getTime(); vb = b.issueDate.getTime(); break;
          case "requester": va = a.requester; vb = b.requester; break;
          case "total": va = calcPRTotal(a); vb = calcPRTotal(b); break;
          case "status": va = a.status; vb = b.status; break;
          default: return 0;
        }
        if (va < vb) return sortDir === "asc" ? -1 : 1;
        if (va > vb) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [requests, filterStatus, filterPR, filterRequester, filterProduct, filterDateFrom, filterDateTo, searchTerm, sortField, sortDir]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  // ========== Drawer Actions ==========
  const openCreate = () => {
    setForm({
      issueDate: new Date(),
      usageDate: new Date(),
      requester: "",
      purposeType: "new",
      purposeText: "",
      jobIds: [],
      channel: "",
      items: [createEmptyLineItem()],
      shipping: 0,
      includeVat: false,
      payments: [],
      attachments: [],
    });
    setActivePR(null);
    setDrawerMode("create");
  };

  const openEdit = (pr: PRItem) => {
    setForm({
      issueDate: pr.issueDate,
      usageDate: pr.usageDate,
      requester: pr.requester,
      purposeType: pr.purposeType,
      purposeText: pr.purposeText,
      jobIds: [...pr.jobIds],
      channel: pr.channel,
      items: [...pr.items],
      shipping: pr.shipping,
      includeVat: pr.includeVat,
      payments: [...pr.payments],
      attachments: [...pr.attachments],
    });
    setActivePR(pr);
    setDrawerMode("edit");
  };

  const openView = (pr: PRItem) => {
    setActivePR(pr);
    setDrawerMode("view");
  };

  const closeDrawer = () => {
    setDrawerMode(null);
    setActivePR(null);
  };

  const handleSave = () => {
    if (!form.requester) {
      toast.error("กรุณาเลือกชื่อผู้ขอซื้อ");
      return;
    }
    if (form.items.every(i => !i.description)) {
      toast.error("กรุณากรอกรายการสินค้าอย่างน้อย 1 รายการ");
      return;
    }

    if (drawerMode === "create") {
      const newPR: PRItem = {
        id: String(Date.now()),
        prNumber: generatePRNumber(),
        status: "pending",
        ...form,
      };
      setRequests(prev => [newPR, ...prev]);
      toast.success("สร้าง PR เรียบร้อย: " + newPR.prNumber);
    } else if (drawerMode === "edit" && activePR) {
      setRequests(prev => prev.map(r => r.id === activePR.id ? { ...r, ...form } : r));
      toast.success("แก้ไข PR เรียบร้อย");
    }
    closeDrawer();
  };

  const handleStatusChange = (id: string, newStatus: PRItem["status"]) => {
    const item = requests.find(r => r.id === id);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    if (newStatus === "rejected" && item) {
      toast.error(`🔔 แจ้งเตือน: ใบขอซื้อ ${item.prNumber} ไม่อนุมัติ — แจ้ง "${item.requester}" ให้ตรวจสอบและแก้ไข`, { duration: 6000, icon: <Bell className="w-4 h-4" /> });
    } else {
      toast.success("เปลี่ยนสถานะเรียบร้อย");
    }
  };

  // Line items
  const addLineItem = () => setForm(f => ({ ...f, items: [...f.items, createEmptyLineItem()] }));
  const removeLineItem = (id: string) => setForm(f => ({ ...f, items: f.items.filter(i => i.id !== id) }));
  const updateLineItem = (id: string, field: keyof PRLineItem, value: any) => {
    setForm(f => ({
      ...f,
      items: f.items.map(i => {
        if (i.id !== id) return i;
        const updated = { ...i, [field]: value };
        if (field === "currency" && value === "THB") updated.exchangeRate = 1;
        if (field === "currency" && value === "CNY") updated.exchangeRate = 5.0;
        return updated;
      }),
    }));
  };

  // Purpose logic
  const handlePurposeTypeChange = (type: "new" | "job") => {
    setForm(f => ({ ...f, purposeType: type, purposeText: "", jobIds: [] }));
    if (type === "new") {
      setForm(f => ({ ...f, items: [createEmptyLineItem()] }));
    }
  };

  const handleJobToggle = (jobId: string) => {
    setForm(f => {
      const isSelected = f.jobIds.includes(jobId);
      const newJobIds = isSelected ? f.jobIds.filter(id => id !== jobId) : [...f.jobIds, jobId];
      
      // Rebuild items from all selected jobs
      const allItems: PRLineItem[] = [];
      for (const jid of newJobIds) {
        const job = jobIdOptions.find(j => j.id === jid);
        if (job) {
          for (const ji of job.items) {
            allItems.push({
              id: String(Date.now()) + Math.random(),
              description: ji.desc,
              link: "",
              qty: ji.qty,
              unitPrice: ji.price,
              currency: ji.currency,
              exchangeRate: ji.currency === "CNY" ? 5.0 : 1,
            });
          }
        }
      }

      return {
        ...f,
        jobIds: newJobIds,
        items: allItems.length > 0 ? allItems : [createEmptyLineItem()],
      };
    });
  };

  // Payments
  const addPayment = () => setForm(f => ({ ...f, payments: [...f.payments, { id: String(Date.now()), date: new Date(), amount: 0, method: "โอนเงิน" }] }));
  const removePayment = (id: string) => setForm(f => ({ ...f, payments: f.payments.filter(p => p.id !== id) }));
  const updatePayment = (id: string, field: keyof PRPayment, value: any) => {
    setForm(f => ({ ...f, payments: f.payments.map(p => p.id === id ? { ...p, [field]: value } : p) }));
  };

  // Attachments
  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newAttachments: PRAttachment[] = Array.from(files).map(file => ({
      id: String(Date.now()) + Math.random(),
      file,
      preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
    }));
    setForm(f => ({ ...f, attachments: [...f.attachments, ...newAttachments] }));
  };

  const removeAttachment = (id: string) => setForm(f => ({ ...f, attachments: f.attachments.filter(a => a.id !== id) }));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  // Export CSV
  const handleExport = () => {
    const bom = "\uFEFF";
    const headers = ["เลข PR", "วันที่ออก", "วันที่ใช้งาน", "ผู้ขอซื้อ", "รายการ", "ยอดรวมสุทธิ", "สถานะ"];
    const statusLabel: Record<string, string> = { pending: "รอสั่งซื้อ", ordered: "สั่งซื้อแล้ว", received: "รับของแล้ว", rejected: "ไม่อนุมัติ" };
    const rows = filteredRequests.map(r => [
      r.prNumber,
      format(r.issueDate, "dd/MM/yyyy"),
      format(r.usageDate, "dd/MM/yyyy"),
      r.requester,
      r.items.map(i => `${i.description} x${i.qty}`).join("; "),
      calcPRTotal(r).toFixed(2),
      statusLabel[r.status] || r.status,
    ]);
    const csv = bom + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PR_Export_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("ส่งออกข้อมูลเรียบร้อย");
  };

  const getStatusBadge = (status: PRItem["status"]) => {
    switch (status) {
      case "pending":
        return <Badge className="whitespace-nowrap" style={{ backgroundColor: CI_ACCENT, color: "#333" }}>⏳ รอสั่งซื้อ</Badge>;
      case "ordered":
        return <Badge className="bg-blue-600 text-white whitespace-nowrap">📦 สั่งซื้อแล้ว</Badge>;
      case "received":
        return <Badge className="bg-green-600 text-white whitespace-nowrap">✅ รับของแล้ว</Badge>;
      case "rejected":
        return <Badge className="whitespace-nowrap" style={{ backgroundColor: CI_PRIMARY, color: "#fff" }}>❌ ไม่อนุมัติ</Badge>;
    }
  };

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:opacity-80 text-white font-medium text-xs">
      {children}
      <ChevronsUpDown className="w-3 h-3" />
    </button>
  );

  // ========== Date Picker ==========
  const DatePickerField = ({ label, value, onChange, disabled = false }: { label: string; value: Date | undefined; onChange: (d: Date | undefined) => void; disabled?: boolean }) => (
    <div>
      <Label className="text-xs font-semibold">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" disabled={disabled} className={cn("w-full justify-start text-left font-normal h-9 text-sm", !value && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {value ? format(value, "dd/MM/yyyy") : "เลือกวันที่"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className="pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );

  // ========== Drawer Content ==========
  const isReadonly = drawerMode === "view";
  const drawerTitle = drawerMode === "create" ? "สร้างใบขอซื้อ (PR)" : drawerMode === "edit" ? `แก้ไข ${activePR?.prNumber}` : `รายละเอียด ${activePR?.prNumber}`;

  const viewData = isReadonly && activePR ? activePR : null;
  const displayItems = isReadonly && viewData ? viewData.items : form.items;
  const displayShipping = isReadonly && viewData ? viewData.shipping : form.shipping;
  const displayIncludeVat = isReadonly && viewData ? viewData.includeVat : form.includeVat;
  const displayPayments = isReadonly && viewData ? viewData.payments : form.payments;

  const displaySubtotal = displayItems.reduce((s, i) => s + calcLineTotal(i), 0);
  const displayBeforeVat = displaySubtotal + displayShipping;
  const displayVat = displayIncludeVat ? displayBeforeVat * 0.07 : 0;
  const displayNetTotal = displayBeforeVat + displayVat;
  const displayTotalPaid = displayPayments.reduce((s, p) => s + p.amount, 0);
  const displayRemaining = displayNetTotal - displayTotalPaid;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">จัดการใบขอซื้อ</h1>
          <p className="text-muted-foreground mt-1">Purchase Requisition (PR)</p>
        </div>
        <Button onClick={openCreate} style={{ backgroundColor: CI_PRIMARY }} className="text-white hover:opacity-90">
          <Plus className="mr-2 h-4 w-4" />
          สร้างใบขอซื้อใหม่
        </Button>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 sm:max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="🔍 ค้นหาเชิงลึก (เลข PR, ผู้ขอ, สินค้า, สเปค...)" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        {hasActiveFilters && (
          <Button variant="outline" onClick={resetAllFilters} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
            <RotateCcw className="h-4 w-4" />
            ล้างค่าการค้นหา
          </Button>
        )}
        <Button variant="outline" onClick={handleExport} className="ml-auto">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* PR Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            รายการใบขอซื้อ ({filteredRequests.length} รายการ)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: CI_HEADER }}>
                <TableHead className="text-white"><SortButton field="prNumber">เลข PR</SortButton></TableHead>
                <TableHead className="text-white"><SortButton field="issueDate">วันที่ออก PR</SortButton></TableHead>
                <TableHead className="text-white"><SortButton field="requester">ผู้ขอซื้อ</SortButton></TableHead>
                <TableHead className="text-white">รายการสินค้า</TableHead>
                <TableHead className="text-white text-right"><SortButton field="total">ยอดรวมสุทธิ</SortButton></TableHead>
                <TableHead className="text-white"><SortButton field="status">สถานะ</SortButton></TableHead>
                <TableHead className="text-white">เปลี่ยนสถานะ</TableHead>
                <TableHead className="text-white">การจัดการ</TableHead>
              </TableRow>
              {/* Filters */}
              <TableRow className="bg-muted/30">
                <TableHead className="py-1"><Input placeholder="กรอง PR..." value={filterPR} onChange={e => setFilterPR(e.target.value)} className="h-7 text-xs" /></TableHead>
                <TableHead className="py-1">
                  <div className="flex gap-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("h-7 text-xs w-full justify-start", !filterDateFrom && "text-muted-foreground")}>
                          {filterDateFrom ? format(filterDateFrom, "dd/MM/yy") : "จาก"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDateFrom} onSelect={setFilterDateFrom} className="pointer-events-auto" /></PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("h-7 text-xs w-full justify-start", !filterDateTo && "text-muted-foreground")}>
                          {filterDateTo ? format(filterDateTo, "dd/MM/yy") : "ถึง"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDateTo} onSelect={setFilterDateTo} className="pointer-events-auto" /></PopoverContent>
                    </Popover>
                  </div>
                </TableHead>
                <TableHead className="py-1"><Input placeholder="กรองผู้ขอ..." value={filterRequester} onChange={e => setFilterRequester(e.target.value)} className="h-7 text-xs" /></TableHead>
                <TableHead className="py-1"><Input placeholder="กรองสินค้า..." value={filterProduct} onChange={e => setFilterProduct(e.target.value)} className="h-7 text-xs" /></TableHead>
                <TableHead className="py-1" />
                <TableHead className="py-1">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="pending">⏳ รอสั่งซื้อ</SelectItem>
                      <SelectItem value="ordered">📦 สั่งซื้อแล้ว</SelectItem>
                      <SelectItem value="received">✅ รับของแล้ว</SelectItem>
                      <SelectItem value="rejected">❌ ไม่อนุมัติ</SelectItem>
                    </SelectContent>
                  </Select>
                </TableHead>
                <TableHead className="py-1" />
                <TableHead className="py-1" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">ไม่พบรายการ</TableCell>
                </TableRow>
              ) : (
                filteredRequests.map(req => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <button onClick={() => openView(req)} className="font-medium text-blue-600 hover:underline flex items-center gap-1 whitespace-nowrap">
                        <FileText className="w-4 h-4" />
                        <HighlightText text={req.prNumber} search={searchTerm} />
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <HighlightText text={format(req.issueDate, "dd/MM/yyyy")} search={searchTerm} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <HighlightText text={req.requester} search={searchTerm} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        {req.items.slice(0, 2).map(i => (
                          <div key={i.id} className="text-xs whitespace-nowrap">
                            <HighlightText text={i.description} search={searchTerm} /> <span className="text-muted-foreground">×{i.qty}</span>
                          </div>
                        ))}
                        {req.items.length > 2 && <span className="text-xs text-muted-foreground">+{req.items.length - 2} รายการ</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold whitespace-nowrap" style={{ color: CI_PRIMARY }}>
                      ฿{calcPRTotal(req).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>{getStatusBadge(req.status)}</TableCell>
                    <TableCell>
                      <Select value={req.status} onValueChange={v => handleStatusChange(req.id, v as PRItem["status"])}>
                        <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">⏳ รอสั่งซื้อ</SelectItem>
                          <SelectItem value="ordered">📦 สั่งซื้อแล้ว</SelectItem>
                          <SelectItem value="received">✅ รับของแล้ว</SelectItem>
                          <SelectItem value="rejected">❌ ไม่อนุมัติ</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openView(req)} title="ดูรายละเอียด"><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(req)} title="แก้ไข"><Pencil className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ========== SIDE DRAWER ========== */}
      <Sheet open={drawerMode !== null} onOpenChange={open => { if (!open) closeDrawer(); }}>
        <SheetContent side="left" className="w-[75vw] sm:max-w-none p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b shrink-0" style={{ backgroundColor: CI_HEADER }}>
            <SheetTitle className="text-white text-lg">{drawerTitle}</SheetTitle>
            {isReadonly && activePR && <div className="mt-1">{getStatusBadge(activePR.status)}</div>}
          </SheetHeader>

          {/* Scrollable Body */}
          <ScrollArea className="flex-1 scrollbar-littleboy" style={{ paddingBottom: isReadonly ? 0 : 80 }}>
            <div className="p-6 space-y-6">

              {/* Section 1: General Info */}
              <div>
                <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: CI_PRIMARY }}>
                  <FileText className="w-4 h-4" /> ข้อมูลทั่วไป
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold">เลขที่ PR</Label>
                    <Input value={isReadonly && activePR ? activePR.prNumber : generatePRNumber()} disabled className="h-9 text-sm bg-muted" />
                  </div>
                  <DatePickerField label="วันที่ออก PR" value={isReadonly && viewData ? viewData.issueDate : form.issueDate} onChange={d => setForm(f => ({ ...f, issueDate: d }))} disabled={isReadonly} />
                  <DatePickerField label="วันที่ต้องการใช้งาน" value={isReadonly && viewData ? viewData.usageDate : form.usageDate} onChange={d => setForm(f => ({ ...f, usageDate: d }))} disabled={isReadonly} />
                  <div>
                    <Label className="text-xs font-semibold">ชื่อผู้ขอซื้อ</Label>
                    {isReadonly ? (
                      <Input value={viewData?.requester || ""} disabled className="h-9 text-sm" />
                    ) : (
                      <Select value={form.requester} onValueChange={v => setForm(f => ({ ...f, requester: v }))}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="เลือกผู้ขอซื้อ" /></SelectTrigger>
                        <SelectContent>
                          {staffList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                {/* Purpose Logic */}
                <div className="mt-4 space-y-3">
                  <Label className="text-xs font-semibold">จุดประสงค์การซื้อ</Label>
                  {isReadonly ? (
                    <div className="text-sm p-2 bg-muted rounded">
                      {viewData?.purposeType === "job" ? (
                        <span>จาก JOB ID: <span className="font-medium">{viewData.jobIds.join(", ")}</span></span>
                      ) : (
                        <span>{viewData?.purposeText || "-"}</span>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <Button
                          variant={form.purposeType === "new" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePurposeTypeChange("new")}
                          style={form.purposeType === "new" ? { backgroundColor: CI_PRIMARY } : {}}
                          className={form.purposeType === "new" ? "text-white" : ""}
                        >
                          สั่งซื้อใหม่
                        </Button>
                        <Button
                          variant={form.purposeType === "job" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePurposeTypeChange("job")}
                          style={form.purposeType === "job" ? { backgroundColor: CI_PRIMARY } : {}}
                          className={form.purposeType === "job" ? "text-white" : ""}
                        >
                          ข้อมูลจาก JOB ID
                        </Button>
                      </div>
                      {form.purposeType === "new" ? (
                        <Textarea placeholder="ระบุจุดประสงค์การซื้อ..." rows={2} value={form.purposeText} onChange={e => setForm(f => ({ ...f, purposeText: e.target.value }))} className="text-sm" />
                      ) : (
                        <div className="border rounded-lg bg-muted/20 overflow-hidden">
                          {/* Search */}
                          <div className="p-3 border-b">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                placeholder="ค้นหา JOB ID, ชื่องาน, สินค้า..."
                                value={jobSearchTerm}
                                onChange={e => setJobSearchTerm(e.target.value)}
                                className="h-8 text-xs pl-8"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">เลือก JOB ID ได้มากกว่า 1 รายการ (สินค้าจะถูกรวมเข้าตารางอัตโนมัติ)</p>
                          </div>
                          {/* Scrollable list */}
                          <ScrollArea className="max-h-[280px] scrollbar-littleboy">
                            <div className="p-2 space-y-1.5">
                              {filteredJobOptions.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">ไม่พบ JOB ID ที่ตรงกับคำค้นหา</p>
                              ) : (
                                filteredJobOptions.map(j => {
                                  const isChecked = form.jobIds.includes(j.id);
                                  return (
                                    <label
                                      key={j.id}
                                      className={cn(
                                        "flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-all text-sm",
                                        isChecked ? "border-2 bg-red-50" : "border-transparent bg-background hover:bg-muted/50"
                                      )}
                                      style={isChecked ? { borderColor: CI_PRIMARY } : {}}
                                      onClick={() => handleJobToggle(j.id)}
                                    >
                                      <div
                                        className={cn(
                                          "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                                          isChecked ? "text-white" : "border-muted-foreground/40"
                                        )}
                                        style={isChecked ? { backgroundColor: CI_PRIMARY, borderColor: CI_PRIMARY } : {}}
                                      >
                                        {isChecked && <span className="text-xs font-bold">✓</span>}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium whitespace-nowrap">{j.id}</div>
                                        <div className="text-xs text-muted-foreground truncate">{j.label.split("—")[1]?.trim()}</div>
                                        <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                                          {j.items.map(i => i.desc).join(", ")}
                                        </div>
                                      </div>
                                      <div className="shrink-0 flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground">{j.items.length} รายการ</span>
                                        {isChecked && (
                                          <Badge variant="secondary" className="text-[10px]" style={{ backgroundColor: `${CI_ACCENT}50`, color: "#333" }}>
                                            ✓
                                          </Badge>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          </ScrollArea>
                          {/* Selected summary */}
                          {form.jobIds.length > 0 && (
                            <div className="p-3 border-t">
                              <p className="text-xs font-medium" style={{ color: CI_PRIMARY }}>
                                ✅ เลือกแล้ว {form.jobIds.length} JOB — รวม {form.items.length} รายการสินค้า
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Channel */}
                <div className="mt-4">
                  <Label className="text-xs font-semibold">ช่องทางการซื้อ</Label>
                  {isReadonly ? (
                    <Input value={viewData?.channel || "-"} disabled className="h-9 text-sm" />
                  ) : (
                    <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="เลือกช่องทาง" /></SelectTrigger>
                      <SelectContent>
                        {channelOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {/* Section 2: Item Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: CI_PRIMARY }}>
                    📦 รายการสินค้า
                  </h3>
                  {!isReadonly && (
                    <Button size="sm" onClick={addLineItem} style={{ backgroundColor: CI_PRIMARY }} className="text-white hover:opacity-90 h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> เพิ่มรายการ
                    </Button>
                  )}
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto scrollbar-littleboy">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ backgroundColor: CI_HEADER }}>
                          <TableHead className="text-white text-xs w-8">#</TableHead>
                          <TableHead className="text-white text-xs min-w-[200px]">รายละเอียดสินค้า</TableHead>
                          <TableHead className="text-white text-xs min-w-[140px]">ลิงก์</TableHead>
                          <TableHead className="text-white text-xs w-20">จำนวน</TableHead>
                          <TableHead className="text-white text-xs w-28">ราคา/หน่วย</TableHead>
                          <TableHead className="text-white text-xs w-24">สกุลเงิน</TableHead>
                          <TableHead className="text-white text-xs w-28">อัตราแลกเปลี่ยน</TableHead>
                          <TableHead className="text-white text-xs w-28 text-right">ราคารวม (฿)</TableHead>
                          {!isReadonly && <TableHead className="text-white text-xs w-10" />}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayItems.map((item, idx) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-xs text-center">{idx + 1}</TableCell>
                            <TableCell>
                              {isReadonly ? (
                                <span className="text-sm">{item.description}</span>
                              ) : (
                                <Input value={item.description} onChange={e => updateLineItem(item.id, "description", e.target.value)} placeholder="ชื่อสินค้า..." className="h-8 text-xs" style={{ borderColor: "transparent" }} onFocus={e => (e.target.style.borderColor = CI_ACCENT)} onBlur={e => (e.target.style.borderColor = "transparent")} />
                              )}
                            </TableCell>
                            <TableCell>
                              {isReadonly ? (
                                item.link ? <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1"><ExternalLink className="w-3 h-3" />ลิงก์</a> : <span className="text-xs text-muted-foreground">-</span>
                              ) : (
                                <Input value={item.link} onChange={e => updateLineItem(item.id, "link", e.target.value)} placeholder="URL..." className="h-8 text-xs" style={{ borderColor: "transparent" }} onFocus={e => (e.target.style.borderColor = CI_ACCENT)} onBlur={e => (e.target.style.borderColor = "transparent")} />
                              )}
                            </TableCell>
                            <TableCell>
                              {isReadonly ? (
                                <span className="text-sm">{item.qty}</span>
                              ) : (
                                <Input type="number" min={0} value={item.qty || ""} onChange={e => updateLineItem(item.id, "qty", Number(e.target.value))} className="h-8 text-xs w-20" style={{ borderColor: "transparent" }} onFocus={e => (e.target.style.borderColor = CI_ACCENT)} onBlur={e => (e.target.style.borderColor = "transparent")} />
                              )}
                            </TableCell>
                            <TableCell>
                              {isReadonly ? (
                                <span className="text-sm">{item.unitPrice.toLocaleString()}</span>
                              ) : (
                                <Input type="number" min={0} value={item.unitPrice || ""} onChange={e => updateLineItem(item.id, "unitPrice", Number(e.target.value))} className="h-8 text-xs" style={{ borderColor: "transparent" }} onFocus={e => (e.target.style.borderColor = CI_ACCENT)} onBlur={e => (e.target.style.borderColor = "transparent")} />
                              )}
                            </TableCell>
                            <TableCell>
                              {isReadonly ? (
                                <span className="text-sm">{item.currency}</span>
                              ) : (
                                <Select value={item.currency} onValueChange={v => updateLineItem(item.id, "currency", v)}>
                                  <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="THB">THB</SelectItem>
                                    <SelectItem value="CNY">CNY</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.currency === "CNY" ? (
                                isReadonly ? (
                                  <span className="text-sm">{item.exchangeRate}</span>
                                ) : (
                                  <Input type="number" min={0} step={0.01} value={item.exchangeRate || ""} onChange={e => updateLineItem(item.id, "exchangeRate", Number(e.target.value))} className="h-8 text-xs" style={{ borderColor: "transparent" }} onFocus={e => (e.target.style.borderColor = CI_ACCENT)} onBlur={e => (e.target.style.borderColor = "transparent")} />
                                )
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium text-sm">
                              ฿{calcLineTotal(item).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            {!isReadonly && (
                              <TableCell>
                                {displayItems.length > 1 && (
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeLineItem(item.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="mt-4 border rounded-lg p-4 bg-muted/30 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>ยอดรวมสินค้า</span>
                    <span>฿{displaySubtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span>ค่าขนส่ง</span>
                    {isReadonly ? (
                      <span>฿{displayShipping.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    ) : (
                      <Input type="number" min={0} value={form.shipping || ""} onChange={e => setForm(f => ({ ...f, shipping: Number(e.target.value) }))} className="h-8 text-sm w-32 text-right" />
                    )}
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <div className="flex items-center gap-2">
                      <span>VAT 7%</span>
                      {!isReadonly && (
                        <Switch checked={form.includeVat} onCheckedChange={v => setForm(f => ({ ...f, includeVat: v }))} />
                      )}
                      {isReadonly && <span className="text-xs text-muted-foreground">({displayIncludeVat ? "เปิด" : "ปิด"})</span>}
                    </div>
                    <span>฿{displayVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-bold">ยอดรวมสุทธิ</span>
                    <span className="text-lg font-bold" style={{ color: CI_PRIMARY }}>
                      ฿{displayNetTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Payments */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: CI_PRIMARY }}>
                    💳 การชำระเงิน
                  </h3>
                  {!isReadonly && (
                    <Button size="sm" variant="outline" onClick={addPayment} className="h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> เพิ่มยอดชำระ
                    </Button>
                  )}
                </div>

                {displayPayments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">ยังไม่มีรายการชำระเงิน</p>
                ) : (
                  <div className="space-y-3">
                    {displayPayments.map((pay, idx) => (
                      <div key={pay.id} className="border rounded-lg p-3 bg-muted/20 relative">
                        {!isReadonly && (
                          <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive" onClick={() => removePayment(pay.id)}>
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                        <div className="text-xs font-semibold mb-2">ชำระครั้งที่ {idx + 1}</div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs">วันที่จ่าย</Label>
                            {isReadonly ? (
                              <div className="text-sm mt-1">{format(pay.date, "dd/MM/yyyy")}</div>
                            ) : (
                              <DatePickerField label="" value={pay.date} onChange={d => d && updatePayment(pay.id, "date", d)} />
                            )}
                          </div>
                          <div>
                            <Label className="text-xs">จำนวนเงิน (฿)</Label>
                            {isReadonly ? (
                              <div className="text-sm mt-1 font-medium">฿{pay.amount.toLocaleString()}</div>
                            ) : (
                              <Input type="number" min={0} value={pay.amount || ""} onChange={e => updatePayment(pay.id, "amount", Number(e.target.value))} className="h-8 text-sm" />
                            )}
                          </div>
                          <div>
                            <Label className="text-xs">วิธีการชำระ</Label>
                            {isReadonly ? (
                              <div className="text-sm mt-1">{pay.method}</div>
                            ) : (
                              <Select value={pay.method} onValueChange={v => updatePayment(pay.id, "method", v)}>
                                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Payment Summary */}
                <div className="mt-3 flex justify-between items-center text-sm p-3 rounded-lg" style={{ backgroundColor: `${CI_ACCENT}30` }}>
                  <span>ยอดชำระแล้ว: <span className="font-bold">฿{displayTotalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></span>
                  <span>ยอดคงเหลือ: <span className="font-bold" style={{ color: displayRemaining > 0 ? CI_PRIMARY : "#16a34a" }}>
                    ฿{displayRemaining.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span></span>
                </div>
              </div>

              {/* Section 4: Attachments */}
              {!isReadonly && (
                <div>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: CI_PRIMARY }}>
                    📎 ไฟล์แนบ
                  </h3>
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground hover:border-opacity-70 transition-colors cursor-pointer"
                    style={{ borderColor: CI_ACCENT }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">ลากวางไฟล์ หรือ คลิกเพื่อเลือกไฟล์</p>
                    <p className="text-xs mt-1">รองรับ รูปภาพ, PDF, ใบเสนอราคา</p>
                    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
                  </div>

                  {form.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {form.attachments.map(att => (
                        <div key={att.id} className="relative border rounded-lg p-1 w-24 h-24 flex items-center justify-center bg-muted/30 group">
                          {att.preview ? (
                            <img src={att.preview} alt={att.file.name} className="w-full h-full object-cover rounded" />
                          ) : (
                            <div className="text-center">
                              <FileText className="w-6 h-6 mx-auto text-muted-foreground" />
                              <p className="text-[10px] mt-1 truncate w-20">{att.file.name}</p>
                            </div>
                          )}
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeAttachment(att.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* View mode attachments info */}
              {isReadonly && viewData && viewData.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: CI_PRIMARY }}>
                    📎 ไฟล์แนบ ({viewData.attachments.length} ไฟล์)
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {viewData.attachments.map(att => (
                      <div key={att.id} className="border rounded-lg p-1 w-24 h-24 flex items-center justify-center bg-muted/30">
                        {att.preview ? (
                          <img src={att.preview} alt={att.file.name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <div className="text-center">
                            <FileText className="w-6 h-6 mx-auto text-muted-foreground" />
                            <p className="text-[10px] mt-1 truncate w-20">{att.file.name}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </ScrollArea>

          {/* Sticky Footer */}
          {!isReadonly && (
            <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4 flex justify-end gap-3 z-10">
              <Button variant="outline" onClick={closeDrawer}>ยกเลิก</Button>
              <Button onClick={handleSave} style={{ backgroundColor: CI_PRIMARY }} className="text-white hover:opacity-90">
                บันทึก
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
