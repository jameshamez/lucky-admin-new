import { useState, useRef, useMemo, useEffect } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Calculator, Plus, Trash2, Settings, Clock, FileCheck, CheckCircle2, Search, AlertCircle, Inbox, RotateCcw, FileImage, Paperclip, AlertTriangle, CheckCircle, X, History, User, FileText, Save, Pencil, Trophy, Copy, ChevronDown, ChevronUp, Package, Factory, Image, Download, Link2, ArrowUpDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import sampleArtwork from "@/assets/sample-artwork.png";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import ProcurementStatusUpdate from "@/components/procurement/ProcurementStatusUpdate";

// Status types for the workflow
type QuotationStatus =
  | "ยื่นคำขอประเมิน"
  | "อยู่ระหว่างการประเมินราคา"
  | "เสนอราคา"
  | "เสนอลูกค้า"
  | "ยืนยันเรียบร้อย"
  | "รายการสั่งผลิต"
  | "ยกเลิก";

// Production status steps
type ProductionStep = "ออกใบ PO" | "จ่ายมัดจำแล้ว" | "เริ่มผลิต" | "ผลิตเสร็จ" | "สินค้าถึงไทย";

const PRODUCTION_STEPS: ProductionStep[] = ["ออกใบ PO", "จ่ายมัดจำแล้ว", "เริ่มผลิต", "ผลิตเสร็จ", "สินค้าถึงไทย"];

const factories = [
  { value: "china_bc", label: "China B&C" },
  { value: "china_linda", label: "China LINDA" },
  { value: "china_pn", label: "China PN" },
  { value: "china_xiaoli", label: "China Xiaoli" },
  { value: "china_zj", label: "China ZJ" },
  { value: "china_benc", label: "China BENC" },
  { value: "china_lanyard_a", label: "China Lanyard A" },
  { value: "china_u", label: "China U" },
  { value: "china_w", label: "China W" },
  { value: "china_x", label: "China X" },
  { value: "china_y", label: "China Y" },
  { value: "china_z", label: "China Z" },
  { value: "papermate", label: "Papermate" },
  { value: "shinemaker", label: "Shinemaker" },
  { value: "the101", label: "The101" },
  { value: "premium_bangkok", label: "บริษัท พรีเมี่ยมแบงค์ค็อก จำกัด" },
  { value: "thai_solid", label: "ไทย Solid" },
  { value: "pv_pewter", label: "PV พิวเตอร์" },
];

const factoryFormSchema = z.object({
  factory: z.string().min(1, "กรุณาเลือกโรงงาน"),
  unitCost: z.string().min(1, "กรุณากรอกทุนต่อหน่วย"),
  moldCost: z.string().optional(),
  moldCostAdditional: z.string().optional(),
  shippingCost: z.string().min(1, "กรุณากรอกค่าขนส่ง"),
  exchangeRate: z.string().min(1, "กรุณากรอกอัตราแลกเปลี่ยน"),
  vat: z.string().min(1, "กรุณากรอก VAT"),
  quantity: z.string().min(1, "กรุณากรอกจำนวน"),
  sellingPrice: z.string().min(1, "กรุณากรอกราคาขาย"),
  sellingPriceLanyard: z.string().optional(),
  productColor: z.string().optional(),
  productSize: z.string().optional(),
  thickness: z.string().optional(),
  linesPerThickness: z.string().optional(),
});

type FactoryFormValues = z.infer<typeof factoryFormSchema>;

interface FactoryQuotation extends FactoryFormValues {
  id: string;
  totalCost: number;
  totalSellingPrice: number;
  totalProfit: number;
  uploadedFile: File | null;
}

interface SupplierEvidenceFile {
  name: string;
  type: string;
  size: number;
  data: string;
  uploadedAt: string;
}

// Product Type for Job-based vs Ready-made
type ProductType = "custom" | "readymade";

// Multi-option quote support
interface QuantitySet {
  setName: string; // A, B, C
  quantities: { color: string; quantity: number }[];
  total: number;
}

// Extended mock quotation with job details from sales
interface MockQuotation {
  id: number;
  jobCode: string;
  jobName: string;
  customerName: string;
  factory: string;
  factoryLabel: string;
  createdDate: string;
  eventDate: string;
  quantity: number;
  totalCost: number;
  totalSellingPrice: number;
  profit: number;
  status: QuotationStatus;
  salesPerson: string;
  productType: ProductType;
  // Extended job details from sales
  material: string;
  size: string;
  thickness: string;
  colors: string[];
  frontDetails: string;
  backDetails: string;
  lanyardSize: string;
  lanyardPatterns: number;
  customerBudget: number;
  designFiles: string[];
  artworkImages: string[];
  notes: string;
  // Winner factory for completed estimations
  winnerFactoryValue?: string;
  // Production tracking (for รายการสั่งผลิต tab)
  productionStep?: ProductionStep;
  productionStepHistory?: {
    step: ProductionStep;
    updatedAt: string;
    updatedBy: string;
  }[];
  // Actual costing (for calculating net profit)
  actualExchangeRate?: number;
  actualShippingCost?: number;
  estimatedTotalCost?: number;
  estimatedProfit?: number;
  actualTotalCost?: number;
  actualNetProfit?: number;
  // Customer confirmation (for เสนอลูกค้า tab)
  customerConfirmed?: boolean;
  // Rejection log
  rejectionLogs: {
    rejectedAt: string;
    rejectedBy: string;
    reason: string;
  }[];
  // Multi-option quote support
  selectedSizes?: string[];
  selectedThicknesses?: string[];
  quantitySets?: QuantitySet[];
  estimationOptions?: string[]; // Generated options for procurement
}

// Factory quotation entry for multi-supplier comparison
interface FactoryEntry {
  id: string;
  factoryValue: string;
  factoryLabel: string;
  unitCost: number; // ชิ้นงาน ทุน/หน่วย (RMB)
  moldCost: number; // ค่าโมล (RMB) - total
  moldCostAdditionalTHB: number; // ค่าโมล(เพิ่มเติม) (THB) - per row, already in THB
  shippingCost: number; // ค่าขนส่ง (RMB) - total
  exchangeRate: number; // อัตราแลกเปลี่ยน (ECR)
  vat: number; // VAT %
  totalCostPerUnit: number; // ทุนรวม/หน่วย (THB)
  sellingPricePerUnit: number; // ราคาขายต่อหน่วย (THB)
  sellingPriceLanyard: number; // ราคาขายสาย/หน่วย (THB)
  totalSellingPricePerUnit: number; // ราคาขายรวม/หน่วย (THB)
  totalProfit: number; // กำไรรวม (THB)
  isWinner: boolean;
  uploadedFile: File | null; // ไฟล์แนบหลักฐานการตีราคา
  evidenceFile?: SupplierEvidenceFile | null; // serialized file persisted in details JSON
}

interface JobColorQuantityDraft {
  color: string;
  quantity: string;
}

interface JobDetailsDraft {
  jobName: string;
  customerName: string;
  salesPerson: string;
  material: string;
  size: string;
  thickness: string;
  finishTypeLabel: string;
  frontDetails: string;
  backDetails: string;
  lanyardSize: string;
  lanyardPatterns: string;
  customerBudget: string;
  eventDate: string;
  quantity: string;
  notes: string;
  colorRows: JobColorQuantityDraft[];
}

const API_BASE = "https://nacres.co.th/api-lucky/admin";
const QUOTATION_TAB_VALUES = ["pending", "in-progress", "quoted", "proposed", "production"] as const;
type QuotationTabValue = typeof QUOTATION_TAB_VALUES[number];
const PRODUCTION_READY_STATUSES: QuotationStatus[] = ["รายการสั่งผลิต", "ยืนยันเรียบร้อย"];

const isProductionReadyStatus = (status?: QuotationStatus) =>
  Boolean(status && PRODUCTION_READY_STATUSES.includes(status));

const Quotation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [factoriesList, setFactoriesList] = useState<FactoryQuotation[]>([]);
  const [currentFactoryId, setCurrentFactoryId] = useState<string | null>(null);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<MockQuotation | null>(null);
  const openedReviewLinkRef = useRef<string | null>(null);
  const [isEditingJobDetails, setIsEditingJobDetails] = useState(false);
  const [isSavingJobDetails, setIsSavingJobDetails] = useState(false);
  const [jobDetailsDraft, setJobDetailsDraft] = useState<JobDetailsDraft | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [productTypeFilter, setProductTypeFilter] = useState<ProductType | "all">("all");

  // Column sorting state
  type SortDirection = "asc" | "desc" | null;
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Cycle: asc -> desc -> null
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Header column filters for Quotation table
  const [filterJobCode, setFilterJobCode] = useState("");
  const [filterJobName, setFilterJobName] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterSalesPerson, setFilterSalesPerson] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>(undefined);
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>(undefined);

  const hasActiveQuotationFilters = searchTerm || filterJobCode || filterJobName || filterCustomer || filterSalesPerson || filterDateFrom || filterDateTo || productTypeFilter !== "all";

  const resetAllQuotationFilters = () => {
    setSearchTerm("");
    setFilterJobCode("");
    setFilterJobName("");
    setFilterCustomer("");
    setFilterSalesPerson("");
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
    setProductTypeFilter("all");
  };

  const isQuotationTabValue = (value: string | null): value is QuotationTabValue =>
    Boolean(value && QUOTATION_TAB_VALUES.includes(value as QuotationTabValue));

  const getQuotationTabValue = (status?: QuotationStatus): QuotationTabValue => {
    switch (status) {
      case "อยู่ระหว่างการประเมินราคา":
        return "in-progress";
      case "เสนอราคา":
        return "quoted";
      case "เสนอลูกค้า":
        return "proposed";
      case "ยืนยันเรียบร้อย":
      case "รายการสั่งผลิต":
        return "production";
      case "ยื่นคำขอประเมิน":
      default:
        return "pending";
    }
  };

  const buildQuotationReviewUrl = (quotation: MockQuotation) => {
    const url = new URL(window.location.origin);
    url.pathname = "/procurement/estimation/quotation";
    url.searchParams.set("quotationId", String(quotation.id));
    url.searchParams.set("tab", getQuotationTabValue(quotation.status));
    return url.toString();
  };

  const copyTextToClipboard = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textArea);

    if (!copied) {
      throw new Error("Copy command failed");
    }
  };

  const handleCopyReviewLink = async () => {
    if (!selectedQuotation) return;

    try {
      const reviewUrl = buildQuotationReviewUrl(selectedQuotation);
      await copyTextToClipboard(reviewUrl);
      toast.success("คัดลอกลิงก์สำเร็จ", {
        description: "ส่งลิงก์นี้ให้หัวหน้าเปิดกลับมาตรวจสอบรายการนี้ได้",
      });
    } catch (err) {
      console.error("Error copying review link:", err);
      toast.error("ไม่สามารถคัดลอกลิงก์ได้");
    }
  };

  const parseDraftNumber = (value: string) => {
    const parsed = Number(String(value || "").replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const detailsValueToText = (value: any) => {
    if (Array.isArray(value)) return value.filter(Boolean).join(", ");
    return String(value || "").trim();
  };

  const splitDetailsText = (value: string) =>
    value
      .split(/\s*,\s*|\n/g)
      .map(item => item.trim())
      .filter(Boolean);

  const getDraftColorRows = (quotation: MockQuotation): JobColorQuantityDraft[] => {
    const rawRows = (quotation as any)?.rawDetails?.colorQuantityRows;

    if (Array.isArray(rawRows) && rawRows.length > 0) {
      const rows = rawRows
        .map((row: any) => {
          const quantity = Array.isArray(row?.quantities)
            ? row.quantities.reduce((sum: number, qty: any) => sum + (Number(qty) || 0), 0)
            : Number(row?.quantity) || 0;

          return {
            color: String(row?.color || "").trim(),
            quantity: quantity ? String(quantity) : "",
          };
        })
        .filter(row => row.color || row.quantity);

      if (rows.length > 0) return rows;
    }

    if (quotation.colors.length > 0) {
      const fallbackQuantity = Math.ceil(quotation.quantity / Math.max(quotation.colors.length, 1));
      return quotation.colors.map(color => ({
        color,
        quantity: fallbackQuantity ? String(fallbackQuantity) : "",
      }));
    }

    return [{ color: "", quantity: quotation.quantity ? String(quotation.quantity) : "" }];
  };

  const createJobDetailsDraft = (quotation: MockQuotation): JobDetailsDraft => {
    const rawDetails = (quotation as any).rawDetails || {};

    return {
      jobName: quotation.jobName || "",
      customerName: quotation.customerName || "",
      salesPerson: quotation.salesPerson || "",
      material: quotation.material || "",
      size: quotation.size || "",
      thickness: quotation.thickness || "",
      finishTypeLabel: rawDetails.finishTypeLabel || rawDetails.finishType || "",
      frontDetails: detailsValueToText(rawDetails.frontDetails ?? quotation.frontDetails),
      backDetails: detailsValueToText(rawDetails.backDetails ?? quotation.backDetails),
      lanyardSize: quotation.lanyardSize || "",
      lanyardPatterns: String(quotation.lanyardPatterns || ""),
      customerBudget: quotation.customerBudget ? String(quotation.customerBudget) : "",
      eventDate: quotation.eventDate && quotation.eventDate !== "-" ? quotation.eventDate : "",
      quantity: quotation.quantity ? String(quotation.quantity) : "",
      notes: quotation.notes && quotation.notes !== "-" ? quotation.notes : "",
      colorRows: getDraftColorRows(quotation),
    };
  };

  const updateJobDetailsDraft = (field: keyof Omit<JobDetailsDraft, "colorRows">, value: string) => {
    setJobDetailsDraft(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const updateDraftColorRow = (index: number, field: keyof JobColorQuantityDraft, value: string) => {
    setJobDetailsDraft(prev => {
      if (!prev) return prev;
      const colorRows = prev.colorRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      );
      const totalQuantity = colorRows.reduce((sum, row) => sum + parseDraftNumber(row.quantity), 0);
      return {
        ...prev,
        colorRows,
        quantity: totalQuantity > 0 ? String(totalQuantity) : prev.quantity,
      };
    });
  };

  const addDraftColorRow = () => {
    setJobDetailsDraft(prev => prev ? {
      ...prev,
      colorRows: [...prev.colorRows, { color: "", quantity: "" }],
    } : prev);
  };

  const removeDraftColorRow = (index: number) => {
    setJobDetailsDraft(prev => {
      if (!prev) return prev;
      const colorRows = prev.colorRows.filter((_, rowIndex) => rowIndex !== index);
      const nextRows = colorRows.length > 0 ? colorRows : [{ color: "", quantity: "" }];
      const totalQuantity = nextRows.reduce((sum, row) => sum + parseDraftNumber(row.quantity), 0);
      return {
        ...prev,
        colorRows: nextRows,
        quantity: totalQuantity > 0 ? String(totalQuantity) : prev.quantity,
      };
    });
  };

  const handleStartEditJobDetails = () => {
    if (!selectedQuotation) return;
    setJobDetailsDraft(createJobDetailsDraft(selectedQuotation));
    setIsEditingJobDetails(true);
  };

  const handleCancelEditJobDetails = () => {
    setJobDetailsDraft(selectedQuotation ? createJobDetailsDraft(selectedQuotation) : null);
    setIsEditingJobDetails(false);
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const getSupplierEvidenceFile = (entry: Partial<FactoryEntry> | any): SupplierEvidenceFile | null => {
    const evidence = entry?.evidenceFile || entry?.uploadedEvidence || entry?.supplierEvidence || null;
    if (evidence?.data || evidence?.url) {
      return {
        name: evidence.name || evidence.fileName || evidence.filename || "หลักฐาน",
        type: evidence.type || evidence.mimeType || "",
        size: Number(evidence.size) || 0,
        data: evidence.data || evidence.url || "",
        uploadedAt: evidence.uploadedAt || evidence.date || "",
      };
    }

    if (entry?.uploadedFileData || entry?.uploadedFileUrl) {
      return {
        name: entry.uploadedFileName || "หลักฐาน",
        type: entry.uploadedFileType || "",
        size: Number(entry.uploadedFileSize) || 0,
        data: entry.uploadedFileData || entry.uploadedFileUrl,
        uploadedAt: entry.uploadedAt || "",
      };
    }

    return null;
  };

  const getSupplierEvidenceName = (entry: FactoryEntry) =>
    entry.uploadedFile?.name || getSupplierEvidenceFile(entry)?.name || "";

  const hasSupplierEvidence = (entry: FactoryEntry) =>
    Boolean(entry.uploadedFile || getSupplierEvidenceFile(entry));

  const serializeSupplierEntries = (entries: FactoryEntry[]) =>
    entries.map(entry => {
      const evidenceFile = getSupplierEvidenceFile(entry);
      return {
        ...entry,
        uploadedFile: null,
        evidenceFile,
      };
    });

  const downloadSupplierEvidence = (entry: FactoryEntry) => {
    const evidenceFile = getSupplierEvidenceFile(entry);
    if (!evidenceFile?.data) {
      toast.error("ไม่พบไฟล์หลักฐาน");
      return;
    }

    const link = document.createElement("a");
    link.href = evidenceFile.data;
    link.download = evidenceFile.name || "หลักฐาน";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const persistSupplierEntriesDraft = async (entries: FactoryEntry[]) => {
    if (!selectedQuotation) return;

    const calcQuantity = globalHeader.quantity || selectedQuotation.quantity;
    const totalSellingPrice = (globalHeader.unitSellingPriceTHB + globalHeader.lanyardSellingPriceTHB) * calcQuantity;
    const updatedDetails = {
      ...(selectedQuotation as any).rawDetails,
      supplierEntries: serializeSupplierEntries(entries),
      globalHeader,
      estimationStarted: true,
      totalSellingPrice,
      totalCost: entries[0]?.totalCostPerUnit * calcQuantity || 0,
      profit: entries[0]?.totalProfit || 0,
    };

    const payload = {
      price: totalSellingPrice,
      details: updatedDetails,
    };

    const res = await fetch(`${API_BASE}/price_estimations.php/${selectedQuotation.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || json?.status === "error") {
      throw new Error(json?.message || "Failed to persist supplier entries");
    }

    setSelectedQuotation(prev => prev && prev.id === selectedQuotation.id
      ? ({
          ...prev,
          totalSellingPrice,
          totalCost: updatedDetails.totalCost,
          profit: updatedDetails.profit,
          rawDetails: updatedDetails,
        } as MockQuotation)
      : prev
    );
    setMockQuotations(prev => prev.map(quotation =>
      quotation.id === selectedQuotation.id
        ? ({
            ...quotation,
            totalSellingPrice,
            totalCost: updatedDetails.totalCost,
            profit: updatedDetails.profit,
            rawDetails: updatedDetails,
          } as MockQuotation)
        : quotation
    ));
  };

  const handleSaveJobDetails = async () => {
    if (!selectedQuotation || !jobDetailsDraft) return;
    if (!jobDetailsDraft.jobName.trim()) {
      toast.error("กรุณาระบุชื่องาน");
      return;
    }

    const normalizedColorRows = jobDetailsDraft.colorRows
      .map(row => ({
        color: row.color.trim(),
        quantity: parseDraftNumber(row.quantity),
      }))
      .filter(row => row.color || row.quantity > 0);

    const totalQuantityFromColors = normalizedColorRows.reduce((sum, row) => sum + row.quantity, 0);
    const totalQuantity = totalQuantityFromColors || parseDraftNumber(jobDetailsDraft.quantity) || selectedQuotation.quantity || 0;
    const customerBudget = parseDraftNumber(jobDetailsDraft.customerBudget);
    const lanyardPatterns = parseDraftNumber(jobDetailsDraft.lanyardPatterns);
    const rawDetails = (selectedQuotation as any).rawDetails || {};
    const existingColorRows = Array.isArray(rawDetails.colorQuantityRows) ? rawDetails.colorQuantityRows : [];
    const updatedColors = normalizedColorRows.map(row => row.color).filter(Boolean);
    const updatedColorQuantityRows = normalizedColorRows.map((row, index) => ({
      ...(existingColorRows[index] || {}),
      id: existingColorRows[index]?.id || `manual-${Date.now()}-${index}`,
      color: row.color,
      quantities: [row.quantity],
      note: existingColorRows[index]?.note || "",
    }));
    const updatedFrontDetails = splitDetailsText(jobDetailsDraft.frontDetails);
    const updatedBackDetails = splitDetailsText(jobDetailsDraft.backDetails);
    const updatedGlobalHeader = {
      ...(rawDetails.globalHeader || globalHeader),
      quantity: totalQuantity,
    };

    const updatedDetails = {
      ...rawDetails,
      jobName: jobDetailsDraft.jobName.trim(),
      customerName: jobDetailsDraft.customerName.trim(),
      salesPerson: jobDetailsDraft.salesPerson.trim(),
      material: jobDetailsDraft.material.trim(),
      size: jobDetailsDraft.size.trim(),
      thickness: jobDetailsDraft.thickness.trim(),
      finishTypeLabel: jobDetailsDraft.finishTypeLabel.trim(),
      frontDetails: updatedFrontDetails,
      backDetails: updatedBackDetails,
      lanyardSize: jobDetailsDraft.lanyardSize.trim(),
      lanyardPatterns,
      colors: updatedColors,
      colorQuantityRows: updatedColorQuantityRows,
      quantity: totalQuantity,
      totalQuantity,
      eventDate: jobDetailsDraft.eventDate.trim() || "-",
      usage_date: jobDetailsDraft.eventDate.trim() || "",
      customerBudget,
      budget: customerBudget,
      ...(rawDetails.globalHeader ? { globalHeader: updatedGlobalHeader } : {}),
    };

    const updatedQuotation: MockQuotation = {
      ...selectedQuotation,
      jobName: jobDetailsDraft.jobName.trim(),
      customerName: jobDetailsDraft.customerName.trim(),
      salesPerson: jobDetailsDraft.salesPerson.trim(),
      material: jobDetailsDraft.material.trim(),
      size: jobDetailsDraft.size.trim(),
      thickness: jobDetailsDraft.thickness.trim(),
      colors: updatedColors,
      frontDetails: updatedFrontDetails.join(", ") || "-",
      backDetails: updatedBackDetails.join(", ") || "-",
      lanyardSize: jobDetailsDraft.lanyardSize.trim(),
      lanyardPatterns,
      customerBudget,
      eventDate: jobDetailsDraft.eventDate.trim() || "-",
      quantity: totalQuantity,
      notes: jobDetailsDraft.notes.trim() || "-",
      rawDetails: updatedDetails,
    } as MockQuotation;

    try {
      setIsSavingJobDetails(true);
      const payload = {
        customer_name: updatedQuotation.customerName,
        sales_owner_id: updatedQuotation.salesPerson,
        job_name: updatedQuotation.jobName,
        quantity: totalQuantity,
        budget: customerBudget,
        notes: updatedQuotation.notes === "-" ? "" : updatedQuotation.notes,
        details: updatedDetails,
      };

      const res = await fetch(`${API_BASE}/price_estimations.php/${selectedQuotation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || json?.status === "error") {
        throw new Error(json?.message || "Failed to save job details");
      }

      setSelectedQuotation(updatedQuotation);
      setMockQuotations(prev => prev.map(quotation =>
        quotation.id === selectedQuotation.id ? updatedQuotation : quotation
      ));
      setGlobalHeader(updatedGlobalHeader);
      setJobDetailsDraft(createJobDetailsDraft(updatedQuotation));
      setIsEditingJobDetails(false);
      toast.success("บันทึกรายละเอียดงานสำเร็จ");
      fetchQuotations();
    } catch (err) {
      console.error("Error saving job details:", err);
      toast.error("เกิดข้อผิดพลาดในการบันทึกรายละเอียดงาน");
    } finally {
      setIsSavingJobDetails(false);
    }
  };

  // Translate material to user-friendly label (TH/EN)
  const translateMaterial = (material: string): string => {
    if (!material) return "-";
    const m = material.toLowerCase();
    if (m.includes("zinc") || m.includes("zinc-alloy") || m.includes("ซิงค์")) return "ซิงค์อัลลอย (Zinc Alloy)";
    if (m.includes("brass") || m.includes("ทองเหลือง")) return "ทองเหลือง (Brass)";
    if (m.includes("acrylic") || m.includes("อะคริลิค")) return "อะคริลิค (Acrylic)";
    if (m.includes("crystal") || m.includes("คริสตัล")) return "คริสตัล (Crystal)";
    if (m.includes("iron") || m.includes("เหล็ก")) return "เหล็ก (Iron)";
    if (m.includes("polyscreen") || m.includes("โพลีสกรีน")) return "โพลีสกรีน (Polyscreen)";
    return material;
  };

  // Get concise Thai plating name for a single color token
  const getThaiPlatingName = (raw: string): string => {
    const c = (raw || "").toLowerCase();
    if (c.includes("rose") || c.includes("โรส")) return "โรสโกลด์";
    if (c.includes("black nickel") || c.includes("รมดำ") || c.includes("นิกเกิลดำ")) return "รมดำ";
    if (c.includes("antique gold") || c.includes("ทองโบราณ")) return "ทองโบราณ";
    if (c.includes("antique silver") || c.includes("เงินโบราณ")) return "เงินโบราณ";
    if (c.includes("antique") || c.includes("โบราณ")) return "โบราณ";
    if (c.includes("matte gold") || c.includes("gold matte") || c.includes("ทองด้าน")) return "ทองด้าน";
    if (c.includes("matte silver") || c.includes("silver matte") || c.includes("เงินด้าน")) return "เงินด้าน";
    if (c.includes("matte copper") || c.includes("copper matte") || c.includes("ทองแดงด้าน")) return "ทองแดงด้าน";
    if (c.includes("shiny gold") || c.includes("shinny gold") || c.includes("ทองเงา")) return "ทองเงา";
    if (c.includes("shiny silver") || c.includes("shinny silver") || c.includes("เงินเงา")) return "เงินเงา";
    if (c.includes("shiny copper") || c.includes("shinny copper") || c.includes("ทองแดงเงา")) return "ทองแดงเงา";
    if (c.includes("nickel")) return "นิกเกิล";
    if (c.includes("gold")) return "ทอง";
    if (c.includes("silver")) return "เงิน";
    if (c.includes("copper")) return "ทองแดง";
    return raw || "-";
  };

  // Compute per-color quantities (prefer rawDetails rows; fallback to even distribution)
  const computeColorQuantities = (q: MockQuotation) => {
    const rows = (q as any)?.rawDetails?.colorQuantityRows;
    if (Array.isArray(rows) && rows.some((r: any) => r?.color)) {
      return rows
        .filter((r: any) => r?.color)
        .map((row: any) => {
          const qty = Array.isArray(row.quantities)
            ? row.quantities.reduce((sum: number, v: number) => sum + (Number(v) || 0), 0)
            : Number(row.quantity) || 0;
          return { color: row.color, thai: getThaiPlatingName(row.color), qty };
        });
    }
    const colors = Array.isArray(q.colors) ? q.colors : [];
    const total = q.quantity || 0;
    const n = Math.max(colors.length, 1);
    const base = Math.floor(total / n);
    let remainder = total - base * n;
    return colors.map((color) => {
      const add = remainder > 0 ? 1 : 0;
      remainder -= add;
      return { color, thai: getThaiPlatingName(color), qty: base + add };
    });
  };

  const translateMaterialForLanguage = (material: string, language: "th" | "zh" | "en") => {
    const value = (material || "").toLowerCase();
    const normalized = translateMaterial(material || "");

    const materialMap = [
      { test: ["zinc", "ซิงค์"], th: "ซิงค์อัลลอย", zh: "锌合金", en: "Zinc Alloy" },
      { test: ["brass", "ทองเหลือง"], th: "ทองเหลือง", zh: "黄铜", en: "Brass" },
      { test: ["acrylic", "อะคริลิค"], th: "อะคริลิค", zh: "亚克力", en: "Acrylic" },
      { test: ["crystal", "คริสตัล"], th: "คริสตัล", zh: "水晶", en: "Crystal" },
      { test: ["iron", "เหล็ก"], th: "เหล็ก", zh: "铁", en: "Iron" },
      { test: ["polyscreen", "โพลีสกรีน"], th: "โพลีสกรีน", zh: "涤纶丝印", en: "Polyscreen" },
    ];

    const found = materialMap.find(item => item.test.some(token => value.includes(token)));
    if (found) return found[language];
    return language === "th" ? normalized : material || "-";
  };

  const translatePlatingForLanguage = (raw: string, language: "th" | "zh" | "en") => {
    const thai = getThaiPlatingName(raw);
    const map: Record<string, { zh: string; en: string }> = {
      "โรสโกลด์": { zh: "玫瑰金", en: "Rose Gold" },
      "รมดำ": { zh: "黑镍", en: "Black Nickel" },
      "ทองโบราณ": { zh: "古金", en: "Antique Gold" },
      "เงินโบราณ": { zh: "古银", en: "Antique Silver" },
      "โบราณ": { zh: "古色", en: "Antique" },
      "ทองด้าน": { zh: "哑光金", en: "Matte Gold" },
      "เงินด้าน": { zh: "哑光银", en: "Matte Silver" },
      "ทองแดงด้าน": { zh: "哑光铜", en: "Matte Copper" },
      "ทองเงา": { zh: "亮金", en: "Shiny Gold" },
      "เงินเงา": { zh: "亮银", en: "Shiny Silver" },
      "ทองแดงเงา": { zh: "亮铜", en: "Shiny Copper" },
      "นิกเกิล": { zh: "镍", en: "Nickel" },
      "ทอง": { zh: "金色", en: "Gold" },
      "เงิน": { zh: "银色", en: "Silver" },
      "ทองแดง": { zh: "铜色", en: "Copper" },
    };

    if (language === "th") return thai;
    return map[thai]?.[language] || raw || "-";
  };

  const translateDetailForLanguage = (details: string, language: "th" | "zh" | "en") => {
    if (!details || details === "-") return "-";

    const detailMap: Record<string, { zh: string; en: string }> = {
      "พิมพ์โลโก้": { zh: "印LOGO", en: "Logo printing" },
      "แกะสลักข้อความ": { zh: "文字雕刻", en: "Text engraving" },
      "ลงสีสเปรย์": { zh: "喷漆", en: "Spray paint" },
      "ขัดเงา": { zh: "抛光", en: "Polishing" },
      "ลงน้ำยาป้องกันสนิม": { zh: "防锈处理", en: "Anti-rust coating" },
      "แกะลึก": { zh: "深雕", en: "Deep engraving" },
      "พิมพ์ซิลค์สกรีน": { zh: "丝网印刷", en: "Silk screen printing" },
      "ปั๊มลาย": { zh: "压纹", en: "Embossing" },
      "ลงสี": { zh: "上色", en: "Color fill" },
      "สกรีนUV": { zh: "UV印刷", en: "UV printing" },
      "พื้นทราย": { zh: "砂面", en: "Sand texture" },
      "อื่นๆ": { zh: "其他", en: "Other" },
    };

    return details
      .split(/\s*,\s*|\s*\/\s*|\n/g)
      .map(item => {
        const trimmed = item.trim();
        if (!trimmed) return "";
        if (language === "th") return trimmed;
        return detailMap[trimmed]?.[language] || trimmed;
      })
      .filter(Boolean)
      .join(" , ");
  };

  const formatLanyardForLanguage = (size: string, patterns: number, language: "th" | "zh" | "en") => {
    const normalizedSize = size && size !== "-" ? size.replace("x", " × ") : "-";
    const patternCount = patterns || 0;

    if (language === "zh") return `${normalizedSize} (${patternCount} 个设计)`;
    if (language === "en") return `${normalizedSize} (${patternCount} designs)`;
    return `${normalizedSize} (${patternCount}แบบ)`;
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  // Build unified trilingual summary text (for copy/share)
  const buildUnifiedSummary = (q: MockQuotation): string => {
    const frontStr = typeof q.frontDetails === 'string' ? q.frontDetails : Array.isArray((q as any).frontDetails) ? (q as any).frontDetails.join(" , ") : "-";
    const backStr = typeof q.backDetails === 'string' ? q.backDetails : Array.isArray((q as any).backDetails) ? (q as any).backDetails.join(" , ") : "-";
    const sizeStr = q.size || "-";
    const thicknessStr = q.thickness || "-";
    const totalQty = q.quantity || 0;
    const colorEntries = computeColorQuantities(q);
    const project = q.jobName || "-";
    const eventDate = q.eventDate && q.eventDate !== '-' ? q.eventDate : '-';
    const lineOwner = `LINE  ${q.salesPerson || '-'}`;
    const colorsByLanguage = (language: "th" | "zh" | "en") =>
      (q.colors || []).map(color => translatePlatingForLanguage(color, language)).join(" , ") || "-";
    const colorLinesByLanguage = (language: "th" | "zh" | "en") => {
      if (colorEntries.length === 0) {
        if (language === "zh") return "按总数量混色";
        if (language === "en") return "Mixed colors according to total quantity";
        return "ส่งคละสีตามจำนวน";
      }

      return colorEntries.map(entry => {
        const colorName = translatePlatingForLanguage(entry.color, language);
        const quantityText = entry.qty.toLocaleString();
        if (language === "zh") return `${colorName} ${quantityText} 枚`;
        if (language === "en") return `${colorName} ${quantityText} pcs`;
        return `${entry.thai} ${quantityText} เหรียญ`;
      }).join("\n");
    };

    const materialTh = translateMaterialForLanguage(q.material || "", "th");
    const materialZh = translateMaterialForLanguage(q.material || "", "zh");
    const materialEn = translateMaterialForLanguage(q.material || "", "en");

    return (
`===== ไทย =====
ตีเหรียญ${materialTh}
${lineOwner}
วัสดุ : ${materialTh}
สีชุบ (สีเนื้องาน) : ${colorsByLanguage("th")}
รายละเอียดด้านหน้า : ${frontStr}
รายละเอียดด้านหลัง : ${backStr}
ขนาด ซม. : ${sizeStr}
ความหนา มม. : ${thicknessStr}
ขนาดสาย : ${formatLanyardForLanguage(q.lanyardSize || "-", q.lanyardPatterns || 0, "th")}
รวมจำนวน ${totalQty.toLocaleString()} เหรียญ
${colorLinesByLanguage("th")}
Project : ${project}
ใช้งาน ${eventDate}

===== 中文 =====
${materialZh}奖牌制作
${lineOwner}
材质 : ${materialZh}
电镀颜色 : ${colorsByLanguage("zh")}
正面细节 : ${translateDetailForLanguage(frontStr, "zh")}
背面细节 : ${translateDetailForLanguage(backStr, "zh")}
尺寸(cm) : ${sizeStr}
厚度(mm) : ${thicknessStr}
挂绳尺寸 : ${formatLanyardForLanguage(q.lanyardSize || "-", q.lanyardPatterns || 0, "zh")}
总数量 ${totalQty.toLocaleString()} 枚
${colorLinesByLanguage("zh")}
项目 : ${project}
使用日期 : ${eventDate}

===== English =====
${materialEn} Medal Production
${lineOwner}
Material : ${materialEn}
Plating color : ${colorsByLanguage("en")}
Front details : ${translateDetailForLanguage(frontStr, "en")}
Back details : ${translateDetailForLanguage(backStr, "en")}
Size (cm) : ${sizeStr}
Thickness (mm) : ${thicknessStr}
Lanyard size : ${formatLanyardForLanguage(q.lanyardSize || "-", q.lanyardPatterns || 0, "en")}
Total quantity ${totalQty.toLocaleString()} pcs
${colorLinesByLanguage("en")}
Project : ${project}
Use date : ${eventDate}`
    );
  };

  // Rejection modal state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Multi-supplier entries
  const [supplierEntries, setSupplierEntries] = useState<FactoryEntry[]>([]);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  // Estimation started state - controls visibility of Section 3
  const [estimationStarted, setEstimationStarted] = useState(false);

  // Read-only mode for items in "รออนุมัติราคา" status
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);

  // Cancel dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Confirmation popup state for "ขออนุมัติราคา"
  const [showApprovalConfirmDialog, setShowApprovalConfirmDialog] = useState(false);

  // Summary popup state for "รออนุมัติราคา" tab
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [summaryQuotation, setSummaryQuotation] = useState<MockQuotation | null>(null);
  const [summarySupplierEntries, setSummarySupplierEntries] = useState<FactoryEntry[]>([]);
  const [summarySelectedFactory, setSummarySelectedFactory] = useState<string | null>(null);
  const summaryContentRef = useRef<HTMLDivElement>(null);

  // Ref for capturing approval content as image
  const approvalContentRef = useRef<HTMLDivElement>(null);
  const estimationCaptureRef = useRef<HTMLDivElement>(null);

  // Multi-select factories state
  const [selectedFactories, setSelectedFactories] = useState<string[]>([]);
  const [factorySelectOpen, setFactorySelectOpen] = useState(false);
  const [factorySearchQuery, setFactorySearchQuery] = useState("");

  // Artwork modal states
  const [isArtworkFullscreenOpen, setIsArtworkFullscreenOpen] = useState(false);
  const [selectedArtworkIndex, setSelectedArtworkIndex] = useState(0);
  const [isUploadHistoryOpen, setIsUploadHistoryOpen] = useState(false);

  // Production modal state
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [selectedProductionItem, setSelectedProductionItem] = useState<MockQuotation | null>(null);
  const [actualExchangeRate, setActualExchangeRate] = useState<number>(0);
  const [actualShippingCost, setActualShippingCost] = useState<number>(0);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<string>("all");

  // Production Order Forms States
  const [prodOrderer, setProdOrderer] = useState("จัดซื้อสมชาย");
  const [prodPo, setProdPo] = useState("");
  const [prodShipDate, setProdShipDate] = useState("");
  const [prodSplit, setProdSplit] = useState("");
  const [prodTotalSales, setProdTotalSales] = useState("");
  const [prodVat, setProdVat] = useState("7");
  const [prodChannel, setProdChannel] = useState("SEA");
  const [prodShipCostRMB, setProdShipCostRMB] = useState("");
  const [prodExchange, setProdExchange] = useState("5.5");

  const orderPrintRef = useRef<HTMLDivElement>(null);
  // Other details input states for Production Modal
  const [frontOtherOpen, setFrontOtherOpen] = useState(false);
  const [frontOtherText, setFrontOtherText] = useState("");
  const [backOtherOpen, setBackOtherOpen] = useState(false);
  const [backOtherText, setBackOtherText] = useState("");

  const generateProductionOrderPDF = async () => {
    if (!orderPrintRef.current || !selectedProductionItem) return;
    try {
      toast.info("กำลังสร้างใบสั่งงาน (PDF)... กรุณารอสักครู่");
      // Make visible for print
      orderPrintRef.current.style.display = "block";
      const canvas = await html2canvas(orderPrintRef.current, { scale: 2 });
      orderPrintRef.current.style.display = "none";
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Production_Order_${selectedProductionItem.jobCode}.pdf`);
      toast.success("ดาวน์โหลดใบสั่งงานสำเร็จ!");
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการสร้าง PDF");
    }
  };

  // Workflow steps for production order
  const WORKFLOW_STEPS = [
    { key: "all", label: "ทั้งหมด" },
    { key: "artwork", label: "ตรวจสอบ Artwork" },
    { key: "cnc", label: "ตรวจสอบงาน CNC" },
    { key: "production", label: "ผลิตชิ้นงาน" },
    { key: "color_check", label: "ตรวจสอบลงสี" },
    { key: "lanyard", label: "ตรวจสอบสายคล้อง" },
    { key: "final", label: "ตรวจสอบชิ้นงานก่อนจัดส่ง" },
    { key: "factory_ship", label: "โรงงานส่งออก" },
    { key: "in_transit", label: "ระหว่างขนส่ง" },
    { key: "arrived_th", label: "ถึงไทย" },
    { key: "warehouse_to_store", label: "ส่งจากโกดัง → ร้าน" },
    { key: "store_qc", label: "ตรวจนับ & QC ที่ร้าน" },
    { key: "delivery_success", label: "จัดส่งสำเร็จ" },
  ];

  // Mock design files upload history
  const designFileHistory = [
    { fileName: "artwork_final_v3.ai", uploadDate: "2024-01-18", uploadTime: "14:32:15", uploadedBy: "สมชาย กราฟิก" },
    { fileName: "artwork_v2.ai", uploadDate: "2024-01-16", uploadTime: "10:15:42", uploadedBy: "สมหญิง ดีไซน์" },
    { fileName: "artwork_draft.ai", uploadDate: "2024-01-14", uploadTime: "09:20:30", uploadedBy: "สมชาย กราฟิก" },
  ];
  const latestDesignFile = designFileHistory.length > 0 ? designFileHistory[0] : null;

  // Global Header values (shared across all factories)
  const [globalHeader, setGlobalHeader] = useState({
    shippingCostRMB: 0, // ค่าขนส่งรวม (RMB)
    exchangeRate: 5.5, // อัตราแลกเปลี่ยน (ECR)
    vat: 7, // VAT (%)
    quantity: 0, // จำนวน (ชิ้น)
    // Selling price fields
    unitSellingPriceTHB: 0, // ชิ้นงาน ราคาขาย/หน่วย (THB)
    lanyardSellingPriceTHB: 0, // สายห้อย ราคาขาย/หน่วย (THB)
  });

  // Mock data state for existing quotations - now fetched from API
  const [mockQuotations, setMockQuotations] = useState<MockQuotation[]>([]);

  const parseStoredImageSource = (image: any): string => {
    if (!image) return "";

    if (typeof image === "string") {
      const value = image.trim();
      if (!value) return "";

      try {
        const parsed = JSON.parse(value);
        return parseStoredImageSource(parsed);
      } catch {
        return value;
      }
    }

    if (typeof image === "object") {
      return parseStoredImageSource(
        image.data ||
        image.url ||
        image.src ||
        image.file_url ||
        image.fileUrl ||
        image.path ||
        ""
      );
    }

    return "";
  };

  const isImageSource = (source: string) => {
    const value = source.trim();
    if (!value) return false;
    if (/^data:image\//i.test(value)) return true;
    if (/^blob:/i.test(value)) return true;
    if (/\.(png|jpe?g|gif|webp|svg)(\?.*)?(#.*)?$/i.test(value)) return true;
    if (/^(https?:)?\/\//i.test(value) || value.startsWith("/")) {
      return !/\.(pdf|ai|psd|eps|docx?|xlsx?)(\?.*)?(#.*)?$/i.test(value);
    }
    return false;
  };

  const isMockArtworkSource = (source: string) => {
    const value = source.toLowerCase();
    return value.includes("sample-artwork") || value.includes("placeholder.svg");
  };

  const uniqueImageSources = (sources: string[]) =>
    sources.reduce<string[]>((acc, source) => {
      if (!source || acc.includes(source)) return acc;
      acc.push(source);
      return acc;
    }, []);

  const getArtworkImagesFromDetails = (details: any) => {
    const imageGroups = [
      details?.customerReferenceImages,
      details?.referenceImages,
      details?.artworkImages,
      details?.images,
    ];

    const parsedSources = imageGroups
      .flatMap(group => Array.isArray(group) ? group : group ? [group] : [])
      .map(parseStoredImageSource)
      .filter(isImageSource)
      .filter(source => !isMockArtworkSource(source));

    return uniqueImageSources(parsedSources);
  };

  const getPrimaryArtworkSource = (quotation: MockQuotation) => {
    const sources = uniqueImageSources([
      ...(quotation.artworkImages || []),
      ...getArtworkImagesFromDetails((quotation as any).rawDetails || {}),
    ].map(parseStoredImageSource));

    return sources.find(source => isImageSource(source) && !isMockArtworkSource(source)) || "";
  };

  const renderArtworkImageHtml = (source: string) => {
    if (!source) {
      return `
        <div style="width:156px;height:140px;display:flex;align-items:center;justify-content:center;border:1px dashed #cbd5e1;border-radius:8px;background:#f8fafc;color:#64748b;font-size:12px;text-align:center;line-height:1.5;padding:12px;">
          ไม่มีรูปภาพแนบ
        </div>
      `;
    }

    return `<img src="${source}" style="max-width:156px;max-height:140px;object-fit:contain;" crossorigin="anonymous" />`;
  };

  const waitForImagesToLoad = async (container: HTMLElement) => {
    const images = Array.from(container.querySelectorAll("img"));
    if (images.length === 0) return;

    await Promise.race([
      Promise.all(images.map(image => {
        if (image.complete && image.naturalWidth > 0) return Promise.resolve();

        return new Promise<void>((resolve) => {
          image.onload = () => resolve();
          image.onerror = () => resolve();
        });
      })),
      new Promise(resolve => window.setTimeout(resolve, 3000)),
    ]);
  };

  // Fetch quotations from API
  const fetchQuotations = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/price_estimations.php`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();

      if (json.status === "success" && json.data) {
        const mappedData = json.data.map((item: any) => {
          let detailObj: any = {};
          try {
            detailObj = typeof item.details === 'string' ? JSON.parse(item.details) : (item.details || {});
          } catch (e) { }

          // Map API status to QuotationStatus if needed
          let statusStr = String(item.status || "ยื่นคำขอประเมิน").trim();
          const statusMap: Record<string, string> = {
            "0": "ยื่นคำขอประเมิน",
            "1": "อยู่ระหว่างการประเมินราคา",
            "2": "เสนอราคา",
            "3": "เสนอลูกค้า",
            "4": "ยืนยันเรียบร้อย",
            "5": "รายการสั่งผลิต",
            "6": "ยกเลิก",
            "ยื่นคำขอประเมิน": "ยื่นคำขอประเมิน",
            "อยู่ระหว่างการประเมินราคา": "อยู่ระหว่างการประเมินราคา",
            "เสนอราคา": "เสนอราคา",
            "เสนอลูกค้า": "เสนอลูกค้า",
            "ยืนยันเรียบร้อย": "ยืนยันเรียบร้อย",
            "รายการสั่งผลิต": "รายการสั่งผลิต",
            "ยกเลิก": "ยกเลิก"
          };

          const finalStatus = (statusMap[statusStr] || statusStr) as QuotationStatus;

          return {
            id: parseInt(item.id),
            jobCode: item.estimate_id || `JOB-${item.id}`,
            jobName: item.job_name || detailObj?.jobName || "-",
            customerName: item.customer_name || "-",
            createdDate: item.estimation_date || "-",
            eventDate: detailObj?.eventDate || "-",
            quantity: item.quantity || 0,
            totalCost: detailObj?.totalCost || 0,
            totalSellingPrice: item.price || 0,
            profit: detailObj?.profit || 0,
            status: finalStatus,
            salesPerson: item.sales_owner_id || "ระบุไม่ได้",
            factory: detailObj?.winnerFactoryValue || item.factory || "",
            factoryLabel: detailObj?.factoryLabel || item.factory_label || "-",
            productType: detailObj?.productType || "custom",
            material: (() => {
              const rawMat = detailObj?.material || "-";
              const materialMap: Record<string, string> = {
                "zinc-alloy": "ซิงค์อัลลอย (Zinc Alloy)",
                "brass": "ทองเหลือง (Brass)",
                "acrylic": "อะคริลิค",
                "crystal": "คริสตัล",
                "iron": "เหล็ก",
                "polyscreen": "โพลีสกรีน",
              };
              return materialMap[rawMat] || rawMat;
            })(),
            size: detailObj?.size || "-",
            thickness: detailObj?.thickness || "-",
            colors: Array.isArray(detailObj?.colors) ? detailObj.colors : (detailObj?.colors ? [detailObj.colors] : []),
            frontDetails: Array.isArray(detailObj?.frontDetails) ? detailObj.frontDetails.join(", ") : (detailObj?.frontDetails || "-"),
            backDetails: Array.isArray(detailObj?.backDetails) ? detailObj.backDetails.join(", ") : (detailObj?.backDetails || "-"),
            lanyardSize: Array.isArray(detailObj?.lanyardSize) ? detailObj.lanyardSize.join(", ") : (detailObj?.lanyardSize || "-"),
            lanyardPatterns: parseInt(detailObj?.lanyardPatterns || item.lanyard_patterns || 0),
            customerBudget: item.budget || 0,
            designFiles: detailObj?.designFiles || [],
            artworkImages: getArtworkImagesFromDetails(detailObj),
            notes: item.notes || "-",
            rejectionLogs: detailObj?.rejectionLogs || [],
            customerConfirmed: finalStatus === "ยืนยันเรียบร้อย" || detailObj?.customerConfirmed === true || item.customer_confirmed === true || item.customer_confirmed === "1",
            winnerFactoryValue: detailObj?.winnerFactoryValue || item.factory,
            productionStep: detailObj?.productionStep,
            productionStepHistory: detailObj?.productionStepHistory || [],
            selectedSizes: detailObj?.selectedSizes || [],
            selectedThicknesses: detailObj?.selectedThicknesses || [],
            quantitySets: detailObj?.quantitySets || [],
            estimationOptions: detailObj?.estimationOptions || [],
            // Store the whole details for later use
            rawDetails: detailObj
          };
        });
        // เรียงลำดับจากเก่าสุดไปล่าสุด (1 -> 18) ตามที่คุณลูกค้าแจ้ง
        // อิงตาม ID (Auto Increment)
        mappedData.sort((a: any, b: any) => {
          return a.id - b.id; // Ascending order (น้อยสุด -> มากสุด)
        });

        setMockQuotations(mappedData);
      }
    } catch (err) {
      console.error("Error fetching quotations:", err);
      toast.error("ดึงข้อมูลการประเมินราคาล้มเหลว");
    } finally {
      setIsLoading(false);
    }
  };

  // call fetch on mount
  useEffect(() => {
    fetchQuotations();
  }, []);

  const form = useForm<FactoryFormValues>({
    resolver: zodResolver(factoryFormSchema),
    defaultValues: {
      factory: "",
      unitCost: "",
      moldCost: "",
      moldCostAdditional: "",
      shippingCost: "",
      exchangeRate: "5.5",
      vat: "7",
      quantity: "",
      sellingPrice: "",
      sellingPriceLanyard: "",
      productColor: "",
      productSize: "",
      thickness: "",
      linesPerThickness: "",
    },
  });

  // Deep search helper for quotation objects
  const deepSearchQuotation = (q: MockQuotation, term: string): boolean => {
    const lowerTerm = term.toLowerCase();
    const searchFields = [
      q.jobCode, q.jobName, q.customerName, q.salesPerson, q.material,
      q.size, q.thickness, q.frontDetails, q.backDetails, q.notes,
      q.lanyardSize, q.factory, q.factoryLabel, q.createdDate, q.eventDate,
      ...(q.colors || []),
      ...(q.designFiles || []),
      ...(q.estimationOptions || []),
      ...(q.rejectionLogs?.map(r => r.reason) || []),
    ];
    return searchFields.some(f => f && f.toLowerCase().includes(lowerTerm));
  };

  // Highlight text helper
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

  // Filter quotations by status and product type
  const getQuotationsByTab = (tab: string) => {
    let filtered = mockQuotations;

    // Apply deep search filter
    if (searchTerm) {
      filtered = filtered.filter(q => deepSearchQuotation(q, searchTerm));
    }

    // Apply product type filter
    if (productTypeFilter !== "all") {
      filtered = filtered.filter(q => q.productType === productTypeFilter);
    }

    // Apply header column filters
    if (filterJobCode) {
      filtered = filtered.filter(q => q.jobCode.toLowerCase().includes(filterJobCode.toLowerCase()));
    }
    if (filterJobName) {
      filtered = filtered.filter(q => q.jobName.toLowerCase().includes(filterJobName.toLowerCase()));
    }
    if (filterCustomer) {
      filtered = filtered.filter(q => q.customerName.toLowerCase().includes(filterCustomer.toLowerCase()));
    }
    if (filterSalesPerson) {
      filtered = filtered.filter(q => q.salesPerson.toLowerCase().includes(filterSalesPerson.toLowerCase()));
    }
    if (filterDateFrom || filterDateTo) {
      filtered = filtered.filter(q => {
        const d = new Date(q.createdDate);
        if (filterDateFrom && d < startOfDay(filterDateFrom)) return false;
        if (filterDateTo && d > endOfDay(filterDateTo)) return false;
        return true;
      });
    }

    // Apply status filter based on tab
    switch (tab) {
      case "pending":
        return filtered.filter(q => q.status === "ยื่นคำขอประเมิน");
      case "in-progress":
        return filtered.filter(q => q.status === "อยู่ระหว่างการประเมินราคา");
      case "quoted":
        return filtered.filter(q => q.status === "เสนอราคา");
      case "proposed":
        return filtered.filter(q => q.status === "เสนอลูกค้า");
      case "production":
        return filtered.filter(q => isProductionReadyStatus(q.status));
      case "history":
        return filtered.filter(q => q.status === "ยืนยันเรียบร้อย" || q.status === "ยกเลิก");
      default:
        return filtered;
    }
  };

  // Count quotations by status
  const getStatusCount = (statuses: readonly QuotationStatus[]) => {
    return mockQuotations.filter(q => statuses.includes(q.status)).length;
  };

  const calculateResults = (data: FactoryFormValues) => {
    const unitCost = parseFloat(data.unitCost || "0");
    const moldCost = parseFloat(data.moldCost || "0");
    const moldCostAdditional = parseFloat(data.moldCostAdditional || "0");
    const shippingCost = parseFloat(data.shippingCost || "0");
    const exchangeRate = parseFloat(data.exchangeRate || "5.5");
    const vat = parseFloat(data.vat || "7");
    const quantity = parseFloat(data.quantity || "0");
    const sellingPrice = parseFloat(data.sellingPrice || "0");
    const sellingPriceLanyard = parseFloat(data.sellingPriceLanyard || "0");

    if (quantity > 0) {
      const totalCostPerUnit =
        ((unitCost + (moldCost / quantity) + (moldCostAdditional / quantity) + (shippingCost / quantity)) * exchangeRate) *
        (1 + (vat / 100));
      const totalSellingPricePerUnit = sellingPrice + sellingPriceLanyard;
      const totalProfit = (totalSellingPricePerUnit - totalCostPerUnit) * quantity;

      return {
        totalCost: totalCostPerUnit,
        totalSellingPrice: totalSellingPricePerUnit,
        totalProfit: totalProfit,
      };
    }
    return { totalCost: 0, totalSellingPrice: 0, totalProfit: 0 };
  };

  // Calculate supplier entry with correct formula using per-row and global header values:
  // สูตรคำนวณทุนรวมต่อหน่วย (THB):
  // ทุนรวม = ((ชิ้นงาน + (โมล ÷ จำนวนชิ้น) + (ค่าขนส่ง ÷ จำนวนชิ้น)) × ECR) × (1 + (VAT ÷ 100))
  // - ชิ้นงาน (unitCost) และ โมล (moldCost + moldCostAdditional) มาจากแต่ละแถว
  // - ค่าขนส่ง, ECR, VAT, จำนวน มาจาก global header
  // 
  // สูตรราคาขายรวมต่อหน่วย (THB):
  // ราคาขายรวม = ราคาขาย + ราคาขายสาย (ถ้ามี) (from Global Header)
  //
  // สูตรกำไรรวม (THB):
  // กำไรรวม = (ราคาขายรวม – ทุนรวม) × จำนวนชิ้น
  const calculateSupplierCosts = (entry: Partial<FactoryEntry>, quantity: number, globalVals = globalHeader): Partial<FactoryEntry> => {
    // Per-row values
    const unitCost = entry.unitCost || 0; // ชิ้นงาน ทุน/หน่วย (RMB) - per row
    const moldCost = entry.moldCost || 0; // ค่าโมล (RMB) - per row
    const moldCostAdditionalTHB = entry.moldCostAdditionalTHB || 0; // ค่าโมล(เพิ่มเติม) (THB) - per row, already in THB

    // Global values
    const shippingCost = globalVals.shippingCostRMB || 0; // ค่าขนส่ง (RMB) from global
    const exchangeRate = globalVals.exchangeRate; // อัตราแลกเปลี่ยน from global
    const vat = globalVals.vat; // VAT % from global
    const qty = globalVals.quantity || quantity; // จำนวน (ชิ้น)

    // Selling prices from global header
    const unitSellingPrice = globalVals.unitSellingPriceTHB || 0; // ชิ้นงาน ราคาขาย/หน่วย (THB)
    const lanyardSellingPrice = globalVals.lanyardSellingPriceTHB || 0; // สายห้อย ราคาขาย/หน่วย (THB)

    if (qty > 0) {
      // ทุนรวม/หน่วย (THB) = ((ชิ้นงาน + (โมล ÷ จำนวนชิ้น) + (ค่าขนส่ง ÷ จำนวนชิ้น)) × ECR) × (1 + (VAT ÷ 100)) + (ค่าโมลเพิ่มเติม(THB) ÷ จำนวน)
      // โมล (RMB) ต้องหารด้วยจำนวน, ค่าโมลเพิ่มเติม(THB) หารด้วยจำนวนโดยตรง
      const baseCostPerUnit =
        ((unitCost + (moldCost / qty) + (shippingCost / qty)) * exchangeRate) *
        (1 + (vat / 100));
      // Add additional mold cost (already in THB, just divide by quantity)
      const totalCostPerUnit = baseCostPerUnit + (moldCostAdditionalTHB / qty);

      // ราคาขายรวม/หน่วย (THB) = ราคาขาย + ราคาขายสาย (ถ้ามี)
      const totalSellingPricePerUnit = unitSellingPrice + lanyardSellingPrice;

      // กำไรรวม (THB) = (ราคาขายรวม – ทุนรวม) × จำนวนชิ้น
      const totalProfit = (totalSellingPricePerUnit - totalCostPerUnit) * qty;

      return {
        ...entry,
        totalCostPerUnit,
        sellingPricePerUnit: unitSellingPrice,
        sellingPriceLanyard: lanyardSellingPrice,
        totalSellingPricePerUnit,
        totalProfit
      };
    }
    return entry;
  };

  // Translate plating colors to show type clearly (e.g., Shiny, Matte, Antique, Black Nickel)
  const translateColors = (colors: string[]): string => {
    return colors.map(color => {
      const colorLower = color.toLowerCase();
      
      // Shiny/Glossy finishes (สีชุบเงา)
      if (colorLower.includes("shinny gold") || colorLower.includes("shiny gold") || colorLower.includes("ชุบทองเงา")) 
        return "Shiny Gold (ชุบทองเงา)";
      if (colorLower.includes("shinny silver") || colorLower.includes("shiny silver") || colorLower.includes("ชุบเงินเงา")) 
        return "Shiny Silver (ชุบเงินเงา)";
      if (colorLower.includes("shinny copper") || colorLower.includes("shiny copper") || colorLower.includes("ชุบทองแดงเงา")) 
        return "Shiny Copper (ชุบทองแดงเงา)";
      if (colorLower.includes("shinny nickel") || colorLower.includes("shiny nickel") || colorLower.includes("ชุบนิกเกิลเงา")) 
        return "Shiny Nickel (ชุบนิกเกิลเงา)";
      
      // Matte finishes (สีชุบด้าน)
      if (colorLower.includes("matte gold") || colorLower.includes("matt gold") || colorLower.includes("ชุบทองด้าน")) 
        return "Matte Gold (ชุบทองด้าน)";
      if (colorLower.includes("matte silver") || colorLower.includes("matt silver") || colorLower.includes("ชุบเงินด้าน")) 
        return "Matte Silver (ชุบเงินด้าน)";
      if (colorLower.includes("matte copper") || colorLower.includes("matt copper") || colorLower.includes("ชุบทองแดงด้าน")) 
        return "Matte Copper (ชุบทองแดงด้าน)";
      if (colorLower.includes("matte nickel") || colorLower.includes("matt nickel") || colorLower.includes("ชุบนิกเกิลด้าน")) 
        return "Matte Nickel (ชุบนิกเกิลด้าน)";
      
      // Antique finishes (สีชุบโบราณ/แอนทีค)
      if (colorLower.includes("antique gold") || colorLower.includes("ชุบทองโบราณ") || colorLower.includes("ชุบทองแอนทีค")) 
        return "Antique Gold (ชุบทองโบราณ)";
      if (colorLower.includes("antique silver") || colorLower.includes("ชุบเงินโบราณ") || colorLower.includes("ชุบเงินแอนทีค")) 
        return "Antique Silver (ชุบเงินโบราณ)";
      if (colorLower.includes("antique copper") || colorLower.includes("antique bronze") || colorLower.includes("ชุบทองแดงโบราณ") || colorLower.includes("ชุบบรอนซ์โบราณ")) 
        return "Antique Copper/Bronze (ชุบทองแดงโบราณ)";
      
      // Black finishes (สีชุบดำ)
      if (colorLower.includes("black nickel") || colorLower.includes("ชุบรมดำ") || colorLower.includes("ชุบนิกเกิลดำ")) 
        return "Black Nickel (ชุบรมดำ)";
      if (colorLower.includes("black") || colorLower.includes("ชุบดำ")) 
        return "Black (ชุบดำ)";
      
      // Rose Gold (สีชุบโรสโกลด์)
      if (colorLower.includes("rose gold") || colorLower.includes("pink gold") || colorLower.includes("ชุบโรสโกลด์")) 
        return "Rose Gold (ชุบโรสโกลด์)";
      
      // Chrome (สีชุบโครเมี่ยม)
      if (colorLower.includes("chrome") || colorLower.includes("ชุบโครเมี่ยม")) 
        return "Chrome (ชุบโครเมี่ยม)";
      
      // Dual tone (สีชุบ 2 โทน)
      if (colorLower.includes("dual") || colorLower.includes("two tone") || colorLower.includes("2 tone") || colorLower.includes("2โทน")) 
        return "Dual Tone (ชุบ 2 โทน)";
      
      // If no match, return original with capitalization
      return color.charAt(0).toUpperCase() + color.slice(1);
    }).join(", ");
  };

  const getPlatingColorLabel = (color: unknown, customColor?: unknown): string => {
    const normalize = (value: unknown): string => {
      if (value === null || value === undefined) return "";
      if (typeof value === "string") return value.trim();
      if (typeof value === "number") return String(value);
      if (typeof value === "object") {
        const record = value as Record<string, unknown>;
        return normalize(record.label ?? record.name ?? record.text ?? record.color ?? record.value);
      }
      return "";
    };

    const raw = normalize(color);
    const custom = normalize(customColor);
    if (!raw || raw === "-") return "";
    if (raw.toLowerCase() === "other") return custom || "อื่นๆ";

    const labelMap: Record<string, string> = {
      gold: "Gold (ทอง)",
      silver: "Silver (เงิน)",
      copper: "Copper (ทองแดง)",
    };

    return labelMap[raw.toLowerCase()] || raw;
  };

  const getQuotationPlatingColorsText = (quotation?: MockQuotation | null): string => {
    if (!quotation) return "-";

    const rawDetails = (quotation as any)?.rawDetails || {};
    const colors: string[] = [];
    const rows = rawDetails?.colorQuantityRows;

    if (Array.isArray(rows)) {
      rows.forEach((row: any) => {
        const label = getPlatingColorLabel(row?.color, row?.customColor);
        if (label) colors.push(label);
      });
    }

    const addColors = (value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          const label = getPlatingColorLabel(item);
          if (label) colors.push(label);
        });
        return;
      }

      const label = getPlatingColorLabel(value);
      if (label) colors.push(label);
    };

    if (colors.length === 0) addColors(rawDetails?.colors);
    if (colors.length === 0) addColors(quotation.colors);

    const uniqueColors = colors.filter((color, index, all) => (
      all.findIndex((item) => item.toLowerCase() === color.toLowerCase()) === index
    ));

    return uniqueColors.length > 0 ? translateColors(uniqueColors) : "-";
  };

  // Factory code mapping for job code generation
  const getFactoryCode = (factoryValue: string): string => {
    const factoryCodeMap: Record<string, string> = {
      "chaina_bc": "BC",
      "chaina_linda": "LIN",
      "chaina_pn": "PN",
      "chaina_xiaoli": "XL",
      "chaina_zj": "ZJ",
      "china_benc": "BEN",
      "china_lanyard_a": "LA",
      "china_u": "U",
      "china_w": "W",
      "china_x": "X",
      "china_y": "Y",
      "china_z": "Z",
      "papermate": "PM",
      "shinemaker": "SM",
      "the101": "101",
      "premium_bangkok": "PBK",
      "thai_solid": "TS",
      "pv_pewter": "PV",
    };
    return factoryCodeMap[factoryValue] || "XXX";
  };

  // Generate job code in format YYMMDD-sequence-factoryCode (e.g., 680910-05-Y)
  const generateJobCode = (factoryValue: string, index: number): string => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const factoryCode = getFactoryCode(factoryValue);
    return `${yy}${mm}${dd}-${String(index + 1).padStart(2, '0')}-${factoryCode}`;
  };

  // Add new supplier entry
  const addSupplierEntry = (factoryValue?: string) => {
    const factory = factoryOptions.find(f => f.value === factoryValue);
    const newEntry: FactoryEntry = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      factoryValue: factoryValue || "",
      factoryLabel: factory?.label || "",
      unitCost: 0, // ชิ้นงาน ทุน/หน่วย (RMB) - per row input
      moldCost: 0, // ค่าโมล (RMB) - per row input
      moldCostAdditionalTHB: 0, // ค่าโมล(เพิ่มเติม) (THB) - per row input
      shippingCost: globalHeader.shippingCostRMB,
      exchangeRate: globalHeader.exchangeRate,
      vat: globalHeader.vat,
      totalCostPerUnit: 0,
      sellingPricePerUnit: globalHeader.unitSellingPriceTHB,
      sellingPriceLanyard: globalHeader.lanyardSellingPriceTHB,
      totalSellingPricePerUnit: 0,
      totalProfit: 0,
      isWinner: false,
      uploadedFile: null,
      evidenceFile: null
    };
    setSupplierEntries(prev => [...prev, newEntry]);
  };

  // Handle factory multi-select change
  const handleFactoryToggle = (factoryValue: string, checked: boolean) => {
    if (checked) {
      // Add factory to selection and create entry
      setSelectedFactories(prev => [...prev, factoryValue]);
      addSupplierEntry(factoryValue);
    } else {
      // Remove factory from selection and remove entry
      setSelectedFactories(prev => prev.filter(f => f !== factoryValue));
      const entryToRemove = supplierEntries.find(e => e.factoryValue === factoryValue);
      if (entryToRemove) {
        removeSupplierEntry(entryToRemove.id);
      }
    }
  };

  // Remove factory from selection (called when deleting row)
  const handleRemoveFactory = (factoryValue: string) => {
    setSelectedFactories(prev => prev.filter(f => f !== factoryValue));
  };

  // Handle file upload for supplier entry
  const handleSupplierFileUpload = async (entryId: string, file: File | null) => {
    if (!file) {
      setSupplierEntries(prev => prev.map(entry =>
        entry.id === entryId ? { ...entry, uploadedFile: null, evidenceFile: null } : entry
      ));
      return;
    }

    try {
      const data = await readFileAsDataUrl(file);
      const evidenceFile: SupplierEvidenceFile = {
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        data,
        uploadedAt: new Date().toISOString(),
      };

      const nextSupplierEntries = supplierEntries.map(entry =>
        entry.id === entryId ? { ...entry, uploadedFile: file, evidenceFile } : entry
      );
      setSupplierEntries(nextSupplierEntries);
      await persistSupplierEntriesDraft(nextSupplierEntries);
      toast.success(`อัพโหลดไฟล์ ${file.name} สำเร็จ`, {
        description: "บันทึกหลักฐานไว้กับรายการนี้แล้ว",
      });
    } catch (err) {
      console.error("Error reading supplier evidence file:", err);
      toast.error("ไม่สามารถอ่านไฟล์หลักฐานได้");
    }
  };

  // Update supplier entry (only for factory-specific fields: factory, unitCost, moldCost)
  const updateSupplierEntry = (id: string, field: keyof FactoryEntry, value: string | number | boolean) => {
    setSupplierEntries(prev => prev.map(entry => {
      if (entry.id === id) {
        const updatedEntry = { ...entry, [field]: value };

        // If factory changed, update label
        if (field === "factoryValue") {
          const factory = factoryOptions.find(f => f.value === value);
          updatedEntry.factoryLabel = factory?.label || "";
        }

        // Recalculate costs with global header values
        if (selectedQuotation) {
          const calculated = calculateSupplierCosts(updatedEntry, selectedQuotation.quantity, globalHeader);
          return { ...updatedEntry, ...calculated } as FactoryEntry;
        }
        return updatedEntry;
      }
      return entry;
    }));
  };

  // Update global header and recalculate all entries
  const updateGlobalHeader = (field: keyof typeof globalHeader, value: number) => {
    const newGlobalHeader = { ...globalHeader, [field]: value };
    setGlobalHeader(newGlobalHeader);

    // Recalculate all supplier entries with new global values
    if (selectedQuotation) {
      setSupplierEntries(prev => prev.map(entry => {
        const calculated = calculateSupplierCosts(entry, selectedQuotation.quantity, newGlobalHeader);
        return { ...entry, ...calculated } as FactoryEntry;
      }));
    }
  };

  // Remove supplier entry
  const removeSupplierEntry = (id: string) => {
    const entryToRemove = supplierEntries.find(e => e.id === id);
    if (entryToRemove && entryToRemove.factoryValue) {
      handleRemoveFactory(entryToRemove.factoryValue);
    }
    setSupplierEntries(prev => prev.filter(entry => entry.id !== id));
    if (selectedWinner === id) {
      setSelectedWinner(null);
    }
  };

  // Select winner
  const selectWinner = (id: string) => {
    setSelectedWinner(id);
    setSupplierEntries(prev => prev.map(entry => ({
      ...entry,
      isWinner: entry.id === id
    })));
  };

  // Open management modal - initialize selling prices from Sales data
  const openManagementModal = (quotation: MockQuotation) => {
    setSelectedQuotation(quotation);
    setJobDetailsDraft(createJobDetailsDraft(quotation));
    setIsEditingJobDetails(false);
    setSelectedWinner(null);
    setSelectedFactories([]); // Reset factory selection
    setFactorySelectOpen(false);

    // Check if status requires read-only with mock data
    const isReadOnly = quotation.status === "เสนอลูกค้า";
    const isInProgress = quotation.status === "อยู่ระหว่างการประเมินราคา" || quotation.status === "เสนอราคา";
    setIsReadOnlyMode(isReadOnly);

    const rawDetails: any = (quotation as any).rawDetails || {};
    const savedSupplierEntries = rawDetails.supplierEntries || [];
    const savedGlobalHeader = rawDetails.globalHeader;

    if (isReadOnly || isInProgress || rawDetails.estimationStarted) {
      setEstimationStarted(rawDetails.estimationStarted !== undefined ? rawDetails.estimationStarted : true);
      
      const currentGlobalHeader = savedGlobalHeader || {
        shippingCostRMB: 0,
        exchangeRate: 5.5,
        vat: 7,
        quantity: quotation.quantity || 0,
        unitSellingPriceTHB: 0,
        lanyardSellingPriceTHB: 0,
      };
      setGlobalHeader(currentGlobalHeader);

      if (savedSupplierEntries.length > 0) {
        const calculatedEntries = savedSupplierEntries.map((entry: any) => {
          const calculated = calculateSupplierCosts(entry, quotation.quantity, currentGlobalHeader);
          return { ...entry, ...calculated };
        });
        
        setSupplierEntries(calculatedEntries);
        setSelectedFactories(calculatedEntries.map((e: any) => e.factoryValue));

        const winnerFactory = quotation.winnerFactoryValue;
        if (winnerFactory) {
          const winnerEntry = calculatedEntries.find((e: any) => e.factoryValue === winnerFactory);
          if (winnerEntry) setSelectedWinner(winnerEntry.id);
        } else {
          const savedWinner = calculatedEntries.find((e: any) => e.isWinner);
          if (savedWinner) setSelectedWinner(savedWinner.id);
        }
      } else {
        setSupplierEntries([]);
        setSelectedFactories([]);
      }
    } else {
      // For "รอประเมิน" - start fresh
      setEstimationStarted(false);
      setSupplierEntries([]);
      setGlobalHeader({
        shippingCostRMB: 0,
        exchangeRate: 5.5,
        vat: 7,
        quantity: quotation.quantity || 0,
        unitSellingPriceTHB: 0,
        lanyardSellingPriceTHB: 0,
      });
    }

    setShowManagementModal(true);
  };

  const clearQuotationReviewParams = () => {
    const params = new URLSearchParams(location.search);
    if (!params.has("quotationId")) return;

    params.delete("quotationId");
    params.delete("tab");
    openedReviewLinkRef.current = null;
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : "",
        hash: location.hash,
      },
      { replace: true }
    );
  };

  // Close management modal
  const closeManagementModal = () => {
    clearQuotationReviewParams();
    setShowManagementModal(false);
    setSelectedQuotation(null);
    setJobDetailsDraft(null);
    setIsEditingJobDetails(false);
    setIsSavingJobDetails(false);
    setSupplierEntries([]);
    setSelectedWinner(null);
    setSelectedFactories([]); // Reset factory selection
    setFactorySelectOpen(false);
    setFactorySearchQuery(""); // Reset search query
    setRejectReason("");
    setCancelReason("");
    setEstimationStarted(false); // Reset estimation state
    setIsReadOnlyMode(false); // Reset read-only mode
    // Reset global header
    setGlobalHeader({
      shippingCostRMB: 0,
      exchangeRate: 5.5,
      vat: 7,
      quantity: 0,
      unitSellingPriceTHB: 0,
      lanyardSellingPriceTHB: 0,
    });
  };

  useEffect(() => {
    if (isLoading) return;

    const params = new URLSearchParams(location.search);
    const quotationId = params.get("quotationId");
    if (!quotationId || openedReviewLinkRef.current === quotationId) return;

    const targetQuotation = mockQuotations.find(
      quotation => String(quotation.id) === quotationId || quotation.jobCode === quotationId
    );
    openedReviewLinkRef.current = quotationId;

    if (!targetQuotation) {
      toast.error("ไม่พบรายการจากลิงก์", {
        description: "รายการอาจถูกลบ หรือผู้ใช้ไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
      });
      return;
    }

    const linkedTab = params.get("tab");
    resetAllQuotationFilters();
    setActiveTab(isQuotationTabValue(linkedTab) ? linkedTab : getQuotationTabValue(targetQuotation.status));
    openManagementModal(targetQuotation);
  }, [isLoading, mockQuotations, location.search]);

  // Handle enable editing for read-only mode
  const handleEnableEditing = () => {
    setIsReadOnlyMode(false);
    toast.success("เปิดโหมดแก้ไข - สามารถแก้ไขข้อมูลได้แล้ว");
  };

  // Handle reject/return to sales
  // Handle reject with reasons
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("กรุณาระบุเหตุผลในการตีกลับ");
      return;
    }

    if (selectedQuotation) {
      try {
        const rejectionLog = {
          rejectedAt: new Date().toISOString(),
          rejectedBy: "จัดซื้อ ผู้ใช้งาน", // In real app, get from auth
          reason: rejectReason
        };

        const updatedDetails = {
          ...(selectedQuotation as any).rawDetails,
          rejectionLogs: [...(selectedQuotation.rejectionLogs || []), rejectionLog]
        };

        const payload = {
          status: "ขอข้อมูลเพิ่มเติม",
          details: updatedDetails
        };

        const res = await fetch(`${API_BASE}/price_estimations.php/${selectedQuotation.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed to reject");

        setMockQuotations(prev => prev.map(q => {
          if (q.id === selectedQuotation.id) {
            return {
              ...q,
              status: "ขอข้อมูลเพิ่มเติม" as QuotationStatus,
              rejectionLogs: updatedDetails.rejectionLogs
            };
          }
          return q;
        }));

        toast.success("ตีกลับงานสำเร็จ - สถานะเปลี่ยนเป็น 'ขอข้อมูลเพิ่มเติม'");
        setShowRejectDialog(false);
        setRejectReason("");
        closeManagementModal();
        fetchQuotations();
      } catch (err) {
        console.error("Error rejecting:", err);
        toast.error("เกิดข้อผิดพลาดในการตีกลับงาน");
      }
    }
  };

  // Handle cancel job
  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("กรุณาระบุเหตุผลในการยกเลิก");
      return;
    }

    if (selectedQuotation) {
      try {
        const payload = {
          status: "ยกเลิก",
          notes: `เหตุผลการยกเลิก: ${cancelReason}`
        };

        const res = await fetch(`${API_BASE}/price_estimations.php/${selectedQuotation.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed to cancel");

        setMockQuotations(prev => prev.map(q => {
          if (q.id === selectedQuotation.id) {
            return {
              ...q,
              status: "ยกเลิก" as QuotationStatus,
            };
          }
          return q;
        }));

        toast.success("ยกเลิกงานสำเร็จ");
        setShowCancelDialog(false);
        setCancelReason("");
        closeManagementModal();
        fetchQuotations();
      } catch (err) {
        console.error("Error cancelling:", err);
        toast.error("เกิดข้อผิดพลาดในการยกเลิกงาน");
      }
    }
  };

  // Handle accept job - change status to "อยู่ระหว่างการประเมินราคา" and show estimation section
  const handleAcceptJob = async (quotation?: MockQuotation) => {
    const targetQuotation = quotation || selectedQuotation;
    if (targetQuotation) {
      try {
        const payload = { status: "อยู่ระหว่างการประเมินราคา" };
        const res = await fetch(`${API_BASE}/price_estimations.php/${targetQuotation?.id || selectedQuotation.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed update status");

        // Update local state
        setMockQuotations(prev => prev.map(q => {
          if (q.id === targetQuotation.id) {
            return {
              ...q,
              status: "อยู่ระหว่างการประเมินราคา" as QuotationStatus,
            };
          }
          return q;
        }));

        // If in modal, update selected quotation and show estimation
        if (selectedQuotation && selectedQuotation.id === targetQuotation.id) {
          setSelectedQuotation({ ...targetQuotation, status: "อยู่ระหว่างการประเมินราคา" });
          setEstimationStarted(true);
        }
        toast.success("รับงานสำเร็จ - สถานะเปลี่ยนเป็น 'อยู่ระหว่างการประเมินราคา'");
      } catch (err) {
        console.error("Error accepting job:", err);
        toast.error("เกิดข้อผิดพลาดในการรับงาน");
      }
    }
  };

  // Handle send price to sales - change status to "เสนอลูกค้า"
  const handleSendPriceToSales = async () => {
    if (supplierEntries.length === 0) {
      toast.error("กรุณาเพิ่มข้อมูลโรงงานอย่างน้อย 1 โรงงาน");
      return;
    }
    if (selectedQuotation) {
      try {
        const calcQuantity = globalHeader.quantity || selectedQuotation.quantity;
        const totalSellingPrice = (globalHeader.unitSellingPriceTHB + globalHeader.lanyardSellingPriceTHB) * calcQuantity;
        
        // Merge procurement data into details JSON
        const updatedDetails = {
          ...(selectedQuotation as any).rawDetails,
          supplierEntries: serializeSupplierEntries(supplierEntries),
          globalHeader,
          estimationStarted: true,
          totalSellingPrice: totalSellingPrice,
          totalCost: supplierEntries[0]?.totalCostPerUnit * calcQuantity || 0,
          profit: supplierEntries[0]?.totalProfit || 0
        };

        const payload = {
          status: "เสนอลูกค้า",
          price: totalSellingPrice,
          details: updatedDetails
        };

        const res = await fetch(`${API_BASE}/price_estimations.php/${selectedQuotation.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed to send price to sales");

        setMockQuotations(prev => prev.map(q => {
          if (q.id === selectedQuotation.id) {
            return {
              ...q,
              status: "เสนอลูกค้า" as QuotationStatus,
              totalSellingPrice: totalSellingPrice,
              totalCost: updatedDetails.totalCost,
              profit: updatedDetails.profit,
              ...(updatedDetails as any)
            };
          }
          return q;
        }));

        toast.success("ส่งราคาให้ฝ่ายขายสำเร็จ - สถานะเปลี่ยนเป็น 'เสนอลูกค้า'");
        closeManagementModal();
        fetchQuotations(); // Refresh to get latest state
      } catch (err) {
        console.error("Error sending price to sales:", err);
        toast.error("เกิดข้อผิดพลาดในการส่งราคา");
      }
    }
  };

  // Handle send revised price to sales - change status to "เสนอลูกค้า"
  const handleSendRevisedPrice = async () => {
    if (supplierEntries.length === 0) {
      toast.error("กรุณาเพิ่มข้อมูลโรงงานอย่างน้อย 1 โรงงาน");
      return;
    }
    if (selectedQuotation) {
      try {
        const calcQuantity = globalHeader.quantity || selectedQuotation.quantity;
        const totalSellingPrice = (globalHeader.unitSellingPriceTHB + globalHeader.lanyardSellingPriceTHB) * calcQuantity;
        
        const updatedDetails = {
          ...(selectedQuotation as any).rawDetails,
          supplierEntries: serializeSupplierEntries(supplierEntries),
          globalHeader,
          estimationStarted: true,
          totalSellingPrice: totalSellingPrice,
          totalCost: supplierEntries[0]?.totalCostPerUnit * calcQuantity || 0,
          profit: supplierEntries[0]?.totalProfit || 0
        };

        const payload = {
          status: "เสนอลูกค้า",
          price: totalSellingPrice,
          details: updatedDetails
        };

        const res = await fetch(`${API_BASE}/price_estimations.php/${selectedQuotation.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed to send revised price");

        setMockQuotations(prev => prev.map(q => {
          if (q.id === selectedQuotation.id) {
            return {
              ...q,
              status: "เสนอลูกค้า" as QuotationStatus,
              totalSellingPrice: totalSellingPrice,
              totalCost: updatedDetails.totalCost,
              profit: updatedDetails.profit,
              ...(updatedDetails as any)
            };
          }
          return q;
        }));

        toast.success("ส่งราคาแก้ไขสำเร็จ - สถานะเปลี่ยนเป็น 'เสนอลูกค้า'");
        closeManagementModal();
        fetchQuotations(); // Sync with DB
      } catch (err) {
        console.error("Error sending revised price:", err);
        toast.error("เกิดข้อผิดพลาดในการส่งราคาแก้ไข");
      }
    }
  };

  // Handle save estimation (Draft)
  const handleSaveEstimation = async () => {
    if (supplierEntries.length === 0) {
      toast.error("กรุณาเพิ่มข้อมูลโรงงานอย่างน้อย 1 โรงงาน");
      return;
    }

    if (selectedQuotation) {
      try {
        const calcQuantity = globalHeader.quantity || selectedQuotation.quantity;
        const totalSellingPrice = (globalHeader.unitSellingPriceTHB + globalHeader.lanyardSellingPriceTHB) * calcQuantity;
        
        const updatedDetails = {
          ...(selectedQuotation as any).rawDetails,
          supplierEntries: serializeSupplierEntries(supplierEntries),
          globalHeader,
          estimationStarted: true,
          totalSellingPrice: totalSellingPrice,
          totalCost: supplierEntries[0]?.totalCostPerUnit * calcQuantity || 0,
          profit: supplierEntries[0]?.totalProfit || 0
        };

        const payload = {
          price: totalSellingPrice,
          details: updatedDetails
        };

        const res = await fetch(`${API_BASE}/price_estimations.php/${selectedQuotation.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed to save draft");

        setMockQuotations(prev => prev.map(q => {
          if (q.id === selectedQuotation.id) {
            return {
              ...q,
              totalSellingPrice: totalSellingPrice,
              totalCost: updatedDetails.totalCost,
              profit: updatedDetails.profit,
              ...(updatedDetails as any)
            };
          }
          return q;
        }));

        toast.success("บันทึกข้อมูลร่างสำเร็จ");
        fetchQuotations();
      } catch (err) {
        console.error("Error saving draft:", err);
        toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    }
  };

  // Handle approve with selected winner
  const handleApproveWithWinner = async () => {
    if (!selectedWinner) {
      toast.error("กรุณาเลือกโรงงานผู้ชนะก่อนอนุมัติ");
      return;
    }

    const winnerEntry = supplierEntries.find(e => e.id === selectedWinner);
    if (!winnerEntry) {
      toast.error("ไม่พบข้อมูลโรงงานที่เลือก");
      return;
    }

    if (selectedQuotation) {
      try {
        const calcQuantity = globalHeader.quantity || selectedQuotation.quantity;
        const totalSellingPrice = winnerEntry.totalSellingPricePerUnit * calcQuantity;
        const totalCost = winnerEntry.totalCostPerUnit * calcQuantity;
        const profit = winnerEntry.totalProfit;
        
        const updatedDetails = {
          ...(selectedQuotation as any).rawDetails,
          supplierEntries: serializeSupplierEntries(supplierEntries),
          globalHeader,
          winnerFactoryValue: winnerEntry.factoryValue,
          factoryLabel: winnerEntry.factoryLabel,
          estimationStarted: true,
          totalSellingPrice: totalSellingPrice,
          totalCost: totalCost,
          profit: profit
        };

        const payload = {
          status: "เสนอราคา",
          price: totalSellingPrice,
          details: updatedDetails
        };

        const res = await fetch(`${API_BASE}/price_estimations.php/${selectedQuotation.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Failed to approve");

        setMockQuotations(prev => prev.map(q => {
          if (q.id === selectedQuotation.id) {
            return {
              ...q,
              status: "เสนอราคา" as QuotationStatus,
              winnerFactoryValue: winnerEntry.factoryValue,
              factory: winnerEntry.factoryValue,
              factoryLabel: winnerEntry.factoryLabel,
              totalSellingPrice: totalSellingPrice,
              totalCost: totalCost,
              profit: profit,
              ...(updatedDetails as any)
            };
          }
          return q;
        }));

        toast.success(`อนุมัติราคาสำเร็จ - โรงงานผู้ชนะ: ${winnerEntry.factoryLabel}`);
        closeManagementModal();
        fetchQuotations(); // Sync with DB
      } catch (err) {
        console.error("Error approving:", err);
        toast.error("เกิดข้อผิดพลาดในการอนุมัติ");
      }
    }
  };

  // Handle select winner in read-only mode
  const handleSelectWinnerReadOnly = (entryId: string) => {
    setSelectedWinner(entryId);
    setSupplierEntries(prev => prev.map(entry => ({
      ...entry,
      isWinner: entry.id === entryId
    })));
  };

  // Copy product details + specific factory row as image to clipboard
  const handleCopyRowAsImage = async (entry: FactoryEntry, index: number, quotation?: MockQuotation) => {
    const q = quotation || selectedQuotation;
    if (!q) return;

    const artworkSrc = getPrimaryArtworkSource(q);
    const jobCode = generateJobCode(entry.factoryValue, index);
    const quantity = globalHeader.quantity || q.quantity;
    const productionSummaryHtml = escapeHtml(buildUnifiedSummary(q));

    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;left:-9999px;top:0;background:#fff;width:860px;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;color:#1f2937;';

    container.innerHTML = `
      <div style="padding:28px;background:#ffffff;">
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e5e7eb;">
          <h2 style="margin:0;font-size:20px;font-weight:700;color:#1f2937;">สรุปข้อมูลอนุมัติราคา</h2>
          <div style="border:2px dashed #9ca3af;border-radius:8px;padding:8px 16px;display:flex;align-items:center;gap:8px;color:#6b7280;font-size:13px;">
            <span>🖼️</span>
            <span>คัดลอกเป็นรูปภาพ</span>
          </div>
        </div>

        <!-- Product Details Section -->
        <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px;">
          <h3 style="font-size:15px;font-weight:700;color:#374151;margin:0 0 16px 0;">รายละเอียดสินค้า</h3>
          <div style="display:flex;gap:20px;">
            <!-- Left: Image + Job ID -->
            <div style="flex-shrink:0;width:180px;">
              <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:12px;display:flex;align-items:center;justify-content:center;min-height:160px;margin-bottom:10px;">
                ${renderArtworkImageHtml(artworkSrc)}
              </div>
              <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:8px 12px;text-align:center;">
                <span style="font-size:11px;color:#6b7280;display:block;">JOB ID</span>
                <span style="font-size:14px;font-weight:700;color:#1d4ed8;">${q.jobCode}</span>
              </div>
            </div>
            <!-- Right: 9-cell grid -->
            <div style="flex:1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
              <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;">
                <p style="font-size:11px;color:#9ca3af;margin:0 0 4px 0;">ชื่อลูกค้า</p>
                <p style="font-size:13px;font-weight:600;color:#1f2937;margin:0;">${q.customerName}</p>
              </div>
              <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;">
                <p style="font-size:11px;color:#9ca3af;margin:0 0 4px 0;">พนักงานขาย</p>
                <p style="font-size:13px;font-weight:600;color:#1f2937;margin:0;">${q.salesPerson}</p>
              </div>
              <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;">
                <p style="font-size:11px;color:#9ca3af;margin:0 0 4px 0;">วันที่ใช้งาน</p>
                <p style="font-size:13px;font-weight:600;color:#1f2937;margin:0;">${new Date(q.eventDate).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
              </div>
              <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;">
                <p style="font-size:11px;color:#9ca3af;margin:0 0 4px 0;">วัสดุ</p>
                <p style="font-size:13px;font-weight:600;color:#1f2937;margin:0;">${q.material}</p>
              </div>
              <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;">
                <p style="font-size:11px;color:#9ca3af;margin:0 0 4px 0;">ขนาด</p>
                <p style="font-size:13px;font-weight:600;color:#1f2937;margin:0;">${q.size}</p>
              </div>
              <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;">
                <p style="font-size:11px;color:#9ca3af;margin:0 0 4px 0;">ความหนา</p>
                <p style="font-size:13px;font-weight:600;color:#1f2937;margin:0;">${q.thickness}</p>
              </div>
              <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;">
                <p style="font-size:11px;color:#9ca3af;margin:0 0 4px 0;">สีชุบ</p>
                <p style="font-size:13px;font-weight:600;color:#1f2937;margin:0;">${getQuotationPlatingColorsText(q)}</p>
              </div>
              <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;">
                <p style="font-size:11px;color:#9ca3af;margin:0 0 4px 0;">จำนวนรวม</p>
                <p style="font-size:13px;font-weight:700;color:#1f2937;margin:0;">${quantity.toLocaleString()} ชิ้น</p>
              </div>
              <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:10px 12px;">
                <p style="font-size:11px;color:#ea580c;margin:0 0 4px 0;">จำนวนลาย</p>
                <p style="font-size:13px;font-weight:700;color:#ea580c;margin:0;">${q.lanyardPatterns} ลาย</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Trilingual Production Details Section -->
        <div style="background:#f8fafc;border:1px solid #dbeafe;border-radius:12px;padding:20px;margin-bottom:20px;">
          <h3 style="font-size:15px;font-weight:700;color:#1d4ed8;margin:0 0 12px 0;">ข้อมูลสั่งผลิต 3 ภาษา</h3>
          <pre style="white-space:pre-wrap;word-break:break-word;margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.55;color:#1f2937;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:14px;">${productionSummaryHtml}</pre>
        </div>

        <!-- Factory Comparison Table -->
        <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;color:#374151;margin:0 0 16px 0;">ตารางเปรียบเทียบโรงงาน</h3>
          <table style="width:100%;border-collapse:separate;border-spacing:0;font-size:13px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <thead>
              <tr>
                <th style="padding:12px 16px;text-align:left;background:#eff6ff;color:#1d4ed8;font-weight:600;font-size:12px;border-bottom:1px solid #e5e7eb;">โรงงาน</th>
                <th style="padding:12px 16px;text-align:right;background:#ecfdf5;color:#059669;font-weight:600;font-size:12px;border-bottom:1px solid #e5e7eb;">ต้นทุน/ชิ้น (THB)</th>
                <th style="padding:12px 16px;text-align:right;background:#ecfdf5;color:#059669;font-weight:600;font-size:12px;border-bottom:1px solid #e5e7eb;">ราคาขาย/ชิ้น (THB)</th>
                <th style="padding:12px 16px;text-align:right;background:#fefce8;color:#ca8a04;font-weight:600;font-size:12px;border-bottom:1px solid #e5e7eb;">กำไร (THB)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background:#ffffff;">
                <td style="padding:12px 16px;font-weight:600;color:#1f2937;">${entry.factoryLabel}</td>
                <td style="padding:12px 16px;text-align:right;font-weight:600;color:#1f2937;">${(entry.totalCostPerUnit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="padding:12px 16px;text-align:right;font-weight:600;color:#059669;">${(entry.totalSellingPricePerUnit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="padding:12px 16px;text-align:right;font-weight:700;color:${(entry.totalProfit || 0) >= 0 ? '#059669' : '#dc2626'};">${entry.totalProfit?.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
      await waitForImagesToLoad(container);

      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            toast.success('คัดลอกรูปภาพสำเร็จ', {
              description: 'ครบทั้งรายละเอียดสินค้า ข้อมูลสั่งผลิต 3 ภาษา และข้อมูลราคาโรงงาน'
            });
          } catch {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `estimation-${q.jobCode}-${entry.factoryLabel}.png`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('ดาวน์โหลดรูปภาพสำเร็จ (Clipboard ไม่รองรับ)');
          }
        }
      }, 'image/png');
    } catch {
      toast.error('ไม่สามารถคัดลอกรูปภาพได้');
    } finally {
      document.body.removeChild(container);
    }
  };

  // Copy image from table row (without modal open) - uses mock winner data
  const handleCopyFromTable = async (quotation: MockQuotation) => {
    const winnerFactory = quotation.winnerFactoryValue || quotation.factory;
    const factory = factories.find(f => f.value === winnerFactory);
    const mockEntry: FactoryEntry = {
      id: "table-copy",
      factoryValue: winnerFactory || "china_linda",
      factoryLabel: factory?.label || quotation.factoryLabel || "China LINDA",
      unitCost: 8.5,
      moldCost: 2500,
      moldCostAdditionalTHB: 0,
      shippingCost: 120,
      exchangeRate: 5.5,
      vat: 7,
      totalCostPerUnit: quotation.quantity > 0 ? (quotation.totalCost / quotation.quantity) : 106.67,
      sellingPricePerUnit: quotation.quantity > 0 ? (quotation.totalSellingPrice / quotation.quantity) : 116.67,
      sellingPriceLanyard: 0,
      totalSellingPricePerUnit: quotation.quantity > 0 ? (quotation.totalSellingPrice / quotation.quantity) : 116.67,
      totalProfit: quotation.profit || 1500,
      isWinner: true,
      uploadedFile: null,
    };
    await handleCopyRowAsImage(mockEntry, 0, quotation);
  };


  const factoryOptions = [
    { value: "chaina_bc", label: "Chaina B&C", code: "BC" },
    { value: "chaina_linda", label: "Chaina LINDA", code: "LIN" },
    { value: "chaina_pn", label: "Chaina PN", code: "PN" },
    { value: "chaina_xiaoli", label: "Chaina Xiaoli", code: "XL" },
    { value: "chaina_zj", label: "Chaina ZJ", code: "ZJ" },
    { value: "china_benc", label: "China BENC", code: "BEN" },
    { value: "china_lanyard_a", label: "China Lanyard A", code: "LA" },
    { value: "china_u", label: "China U", code: "U" },
    { value: "china_w", label: "China W", code: "W" },
    { value: "china_x", label: "China X", code: "X" },
    { value: "china_y", label: "China Y", code: "Y" },
    { value: "china_z", label: "China Z", code: "Z" },
    { value: "papermate", label: "Papermate", code: "PM" },
    { value: "shinemaker", label: "Shinemaker", code: "SM" },
    { value: "the101", label: "The101", code: "101" },
    { value: "premium_bangkok", label: "บริษัท พรีเมี่ยมแบงค์ค็อก จำกัด", code: "PBK" },
    { value: "thai_solid", label: "ไทย Solid", code: "TS" },
    { value: "pv_pewter", label: "PV พิวเตอร์", code: "PV" },
  ];

  const getStatusBadge = (status: QuotationStatus) => {
    const statusConfig: Record<QuotationStatus, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      "ยื่นคำขอประเมิน": { variant: "outline", className: "bg-blue-100 text-blue-700 border-blue-300 text-xs px-2 py-0.5" },
      "อยู่ระหว่างการประเมินราคา": { variant: "outline", className: "bg-orange-100 text-orange-700 border-orange-300 text-xs px-2 py-0.5" },
      "เสนอราคา": { variant: "outline", className: "bg-purple-100 text-purple-700 border-purple-300 text-xs px-2 py-0.5" },
      "เสนอลูกค้า": { variant: "default", className: "bg-amber-100 text-amber-700 border-amber-300 text-xs px-2 py-0.5" },
      "ยืนยันเรียบร้อย": { variant: "default", className: "bg-green-100 text-green-700 border-green-300 text-xs px-2 py-0.5" },
      "รายการสั่งผลิต": { variant: "secondary", className: "bg-blue-100 text-blue-700 border-blue-300 text-xs px-2 py-0.5" },
      "ยกเลิก": { variant: "secondary", className: "bg-gray-100 text-gray-600 border-gray-300 text-xs px-2 py-0.5" },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>;
  };

  // Product type badge helper - All items are now "เหรียญสั่งผลิต"
  const getProductTypeBadge = (productType: ProductType) => {
    return <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-xs px-2 py-0.5">เหรียญสั่งผลิต</Badge>;
  };

  // Deadline color-coding helper
  const getDeadlineDisplay = (eventDate: string) => {
    if (!eventDate || eventDate === "-" || eventDate.trim() === "") {
      return <span className="text-muted-foreground">-</span>;
    }

    const deadline = new Date(eventDate);
    // Check if valid date
    if (isNaN(deadline.getTime())) {
      // Could be Thai localized or something non-standard, just return as-is
      return <span className="text-foreground">{eventDate}</span>;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = deadline.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (diffDays < 0) {
      return (
        <div className="flex flex-col items-start">
          <span className="text-red-600 font-medium">{formattedDate}</span>
          <span className="text-xs text-red-500 font-semibold">เลยกำหนด {Math.abs(diffDays)} วัน</span>
        </div>
      );
    } else if (diffDays <= 3) {
      return (
        <div className="flex flex-col items-start">
          <span className="text-red-600 font-medium">{formattedDate}</span>
          <span className="text-xs text-red-500 font-semibold">เหลือ {diffDays} วัน</span>
        </div>
      );
    } else if (diffDays <= 7) {
      return (
        <div className="flex flex-col items-start">
          <span className="text-yellow-600 font-medium">{formattedDate}</span>
          <span className="text-xs text-yellow-500">เหลือ {diffDays} วัน</span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-start">
        <span className="text-foreground">{formattedDate}</span>
        <span className="text-xs text-muted-foreground">เหลือ {diffDays} วัน</span>
      </div>
    );
  };

  // Tab configuration - Reordered per workflow: รอประเมิน > ขอข้อมูลเพิ่มเติม > รออนุมัติราคา > ประเมินเสร็จสิ้น > รายการสั่งผลิต
  const tabConfig = [
    {
      value: "pending",
      label: "ยื่นคำขอประเมิน",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-500",
      count: getStatusCount(["ยื่นคำขอประเมิน"])
    },
    {
      value: "in-progress",
      label: "อยู่ระหว่างประเมิน",
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-500",
      count: getStatusCount(["อยู่ระหว่างการประเมินราคา"])
    },
    {
      value: "quoted",
      label: "ประเมินเสร็จสิ้น",
      icon: FileCheck,
      color: "text-purple-600",
      bgColor: "bg-purple-500",
      count: getStatusCount(["เสนอราคา"])
    },
    {
      value: "proposed",
      label: "เสนอลูกค้า",
      icon: CheckCircle2,
      color: "text-amber-600",
      bgColor: "bg-amber-500",
      count: getStatusCount(["เสนอลูกค้า"])
    },
    {
      value: "production",
      label: "รายการสั่งผลิต",
      icon: Factory,
      color: "text-blue-600",
      bgColor: "bg-blue-500",
      count: getStatusCount(PRODUCTION_READY_STATUSES)
    },
  ];

  // Empty state component
  const EmptyState = ({ tabLabel, isSearchResult }: { tabLabel: string; isSearchResult: boolean }) => (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Inbox className="h-16 w-16 mb-4 text-muted-foreground/50" />
      {isSearchResult ? (
        <>
          <h3 className="text-lg font-medium mb-2">ไม่พบข้อมูลในสถานะนี้</h3>
          <p className="text-sm text-center">
            ไม่พบรายการที่ค้นหาในสถานะ "{tabLabel}"
            <br />
            <span className="text-primary">ลองค้นหาใน Tab อื่นๆ ดูครับ</span>
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium mb-2">ไม่มีรายการในสถานะนี้</h3>
          <p className="text-sm">ยังไม่มีคำขอประเมินราคาในสถานะ "{tabLabel}"</p>
        </>
      )}
    </div>
  );

  // SortableTableHead component for clickable sortable column headers
  const SortableTableHead = ({ column, children, className }: { column: string; children: React.ReactNode; className?: string }) => (
    <TableHead
      className={cn("cursor-pointer select-none hover:bg-muted/50 transition-colors", className)}
      onClick={() => handleSort(column)}
    >
      <div className={cn("flex items-center gap-1", className?.includes("text-right") ? "justify-end" : className?.includes("text-center") ? "justify-center" : "")}>
        <span>{children}</span>
        {sortColumn === column ? (
          sortDirection === "asc" ? (
            <ChevronUp className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          )
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
        )}
      </div>
    </TableHead>
  );

  // Sort quotations based on current sort state
  const sortQuotations = (data: MockQuotation[]): MockQuotation[] => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      let valA: any;
      let valB: any;

      switch (sortColumn) {
        case "jobCode":
          valA = a.jobCode || "";
          valB = b.jobCode || "";
          break;
        case "jobName":
          valA = a.jobName || "";
          valB = b.jobName || "";
          break;
        case "productType":
          valA = a.productType || "";
          valB = b.productType || "";
          break;
        case "customerName":
          valA = a.customerName || "";
          valB = b.customerName || "";
          break;
        case "salesPerson":
          valA = a.salesPerson || "";
          valB = b.salesPerson || "";
          break;
        case "createdDate":
          valA = new Date(a.createdDate).getTime() || 0;
          valB = new Date(b.createdDate).getTime() || 0;
          break;
        case "eventDate":
          valA = a.eventDate && a.eventDate !== "-" ? new Date(a.eventDate).getTime() : 0;
          valB = b.eventDate && b.eventDate !== "-" ? new Date(b.eventDate).getTime() : 0;
          break;
        case "quantity":
          valA = a.quantity || 0;
          valB = b.quantity || 0;
          break;
        case "factory":
          valA = a.factoryLabel || "";
          valB = b.factoryLabel || "";
          break;
        case "costPerUnit":
          valA = a.quantity > 0 ? a.totalCost / a.quantity : 0;
          valB = b.quantity > 0 ? b.totalCost / b.quantity : 0;
          break;
        case "sellingPerUnit":
          valA = a.quantity > 0 ? a.totalSellingPrice / a.quantity : 0;
          valB = b.quantity > 0 ? b.totalSellingPrice / b.quantity : 0;
          break;
        case "profit":
          valA = a.profit || 0;
          valB = b.profit || 0;
          break;
        case "totalCost":
          valA = a.totalCost || 0;
          valB = b.totalCost || 0;
          break;
        case "totalSellingPrice":
          valA = a.totalSellingPrice || 0;
          valB = b.totalSellingPrice || 0;
          break;
        case "status":
          valA = a.status || "";
          valB = b.status || "";
          break;
        case "productionStep":
          valA = a.productionStep || "";
          valB = b.productionStep || "";
          break;
        default:
          return 0;
      }

      // Compare
      if (typeof valA === "string" && typeof valB === "string") {
        const cmp = valA.localeCompare(valB, "th");
        return sortDirection === "asc" ? cmp : -cmp;
      }
      const diff = (valA as number) - (valB as number);
      return sortDirection === "asc" ? diff : -diff;
    });
  };

  // Quotation table component - Updated with single manage button
  const QuotationTable = ({ quotations, tabValue }: { quotations: MockQuotation[]; tabValue: string }) => {
    const sortedQuotations = sortQuotations(quotations);
    if (quotations.length === 0) {
      const tabLabel = tabConfig.find(t => t.value === tabValue)?.label || "";
      const hasDataWithoutSearch = mockQuotations.some(q => {
        switch (tabValue) {
          case "pending": return q.status === "ยื่นคำขอประเมิน";
          case "in-progress": return q.status === "อยู่ระหว่างการประเมินราคา";
          case "quoted": return q.status === "เสนอราคา";
          case "proposed": return q.status === "เสนอลูกค้า";
          case "production": return isProductionReadyStatus(q.status);
          case "history": return q.status === "ยืนยันเรียบร้อย" || q.status === "ยกเลิก";
          default: return false;
        }
      });
      const isSearchResult = searchTerm.length > 0 && hasDataWithoutSearch;
      return <EmptyState tabLabel={tabLabel} isSearchResult={isSearchResult} />;
    }

    // Production tab shows different columns and actions
    if (tabValue === "production") {
      return (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead column="jobCode">รหัสงาน</SortableTableHead>
                <SortableTableHead column="jobName">ชื่องาน</SortableTableHead>
                <SortableTableHead column="factory">โรงงานผู้ชนะ</SortableTableHead>
                <SortableTableHead column="customerName">ลูกค้า</SortableTableHead>
                <SortableTableHead column="eventDate">วันที่ต้องส่งมอบ</SortableTableHead>
                <SortableTableHead column="quantity" className="text-right">จำนวน</SortableTableHead>
                <SortableTableHead column="totalCost" className="text-right">ต้นทุนรวม</SortableTableHead>
                <SortableTableHead column="totalSellingPrice" className="text-right">ราคาขาย</SortableTableHead>
                <SortableTableHead column="productionStep">สถานะการผลิต</SortableTableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedQuotations.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell className="font-mono font-medium">
                    <button onClick={() => openProductionModal(quotation)} className="text-blue-600 hover:underline whitespace-nowrap">
                      <HighlightText text={quotation.jobCode} search={searchTerm} />
                    </button>
                  </TableCell>
                  <TableCell><HighlightText text={quotation.jobName} search={searchTerm} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{quotation.factoryLabel}</span>
                    </div>
                  </TableCell>
                  <TableCell>{quotation.customerName}</TableCell>
                  <TableCell>{getDeadlineDisplay(quotation.eventDate)}</TableCell>
                  <TableCell className="text-right">{quotation.quantity.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{quotation.totalCost.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{quotation.totalSellingPrice.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300">
                      {quotation.productionStep || "ออกใบ PO"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openProductionModal(quotation)}
                        className="gap-2"
                      >
                        <Factory className="w-4 h-4" />
                        จัดการ
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead column="jobCode">รหัสงาน</SortableTableHead>
              <SortableTableHead column="jobName">ชื่องาน</SortableTableHead>
              <SortableTableHead column="productType">ประเภทสินค้า</SortableTableHead>
              <SortableTableHead column="customerName">ลูกค้า</SortableTableHead>
              <SortableTableHead column="salesPerson">พนักงานขาย</SortableTableHead>
              <SortableTableHead column="createdDate">วันที่สร้าง</SortableTableHead>
              <SortableTableHead column="eventDate">วันที่ต้องส่งมอบ</SortableTableHead>
              <SortableTableHead column="quantity" className="text-right">จำนวน</SortableTableHead>
              {tabValue !== "pending" && tabValue !== "info-needed" && (
                <>
                  <SortableTableHead column="factory">โรงงาน</SortableTableHead>
                  <SortableTableHead column="costPerUnit" className="text-right">ต้นทุน/ชิ้น</SortableTableHead>
                  <SortableTableHead column="sellingPerUnit" className="text-right">ราคาขาย/ชิ้น</SortableTableHead>
                  <SortableTableHead column="profit" className="text-right">กำไรรวม</SortableTableHead>
                </>
              )}
              <SortableTableHead column="status">สถานะ</SortableTableHead>
              <TableHead className="text-center">จัดการ</TableHead>
            </TableRow>
            {/* Header Filter Row */}
            <TableRow className="bg-muted/30">
              <TableHead className="py-1">
                <Input placeholder="กรอง..." value={filterJobCode} onChange={(e) => setFilterJobCode(e.target.value)} className="h-7 text-xs" />
              </TableHead>
              <TableHead className="py-1">
                <Input placeholder="กรอง..." value={filterJobName} onChange={(e) => setFilterJobName(e.target.value)} className="h-7 text-xs" />
              </TableHead>
              <TableHead className="py-1" />
              <TableHead className="py-1">
                <Input placeholder="กรอง..." value={filterCustomer} onChange={(e) => setFilterCustomer(e.target.value)} className="h-7 text-xs" />
              </TableHead>
              <TableHead className="py-1">
                <Input placeholder="กรอง..." value={filterSalesPerson} onChange={(e) => setFilterSalesPerson(e.target.value)} className="h-7 text-xs" />
              </TableHead>
              <TableHead className="py-1">
                <div className="flex gap-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-7 text-xs flex-1 justify-start", !filterDateFrom && "text-muted-foreground")}>
                        {filterDateFrom ? format(filterDateFrom, "dd/MM/yy") : "จาก"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDateFrom} onSelect={setFilterDateFrom} className="pointer-events-auto" /></PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className={cn("h-7 text-xs flex-1 justify-start", !filterDateTo && "text-muted-foreground")}>
                        {filterDateTo ? format(filterDateTo, "dd/MM/yy") : "ถึง"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDateTo} onSelect={setFilterDateTo} className="pointer-events-auto" /></PopoverContent>
                  </Popover>
                </div>
              </TableHead>
              <TableHead className="py-1" />
              <TableHead className="py-1" />
              {tabValue !== "pending" && tabValue !== "info-needed" && (
                <>
                  <TableHead className="py-1" />
                  <TableHead className="py-1" />
                  <TableHead className="py-1" />
                  <TableHead className="py-1" />
                </>
              )}
              <TableHead className="py-1" />
              <TableHead className="py-1" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedQuotations.map((quotation) => (
              <TableRow key={quotation.id}>
                <TableCell className="font-mono font-medium">
                  <button onClick={() => openManagementModal(quotation)} className="text-blue-600 hover:underline whitespace-nowrap">
                    <HighlightText text={quotation.jobCode} search={searchTerm} />
                  </button>
                </TableCell>
                <TableCell><HighlightText text={quotation.jobName} search={searchTerm} /></TableCell>
                <TableCell>{getProductTypeBadge(quotation.productType)}</TableCell>
                <TableCell><HighlightText text={quotation.customerName} search={searchTerm} /></TableCell>
                <TableCell><HighlightText text={quotation.salesPerson} search={searchTerm} /></TableCell>
                <TableCell>{new Date(quotation.createdDate).toLocaleDateString('th-TH')}</TableCell>
                <TableCell>{getDeadlineDisplay(quotation.eventDate)}</TableCell>
                <TableCell className="text-right">{quotation.quantity.toLocaleString()}</TableCell>
                {tabValue !== "pending" && tabValue !== "info-needed" && (
                  <>
                    <TableCell>{quotation.factoryLabel}</TableCell>
                    <TableCell className="text-right">
                      {quotation.quantity > 0 
                        ? (quotation.totalCost / quotation.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0.00'}
                    </TableCell>
                    <TableCell className="text-right">
                      {quotation.quantity > 0 
                        ? (quotation.totalSellingPrice / quotation.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '0.00'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${quotation.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {quotation.profit.toLocaleString()}
                    </TableCell>
                  </>
                )}
                <TableCell>
                  {tabValue === "proposed" && quotation.customerConfirmed ? (
                    <Badge className="bg-green-100 text-green-700 border-green-300 text-xs px-2 py-0.5">ลูกค้ายืนยัน</Badge>
                  ) : (
                    getStatusBadge(quotation.status)
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    {(tabValue === "approval" || tabValue === "completed") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSummaryQuotation(quotation);
                          const mockEntries: FactoryEntry[] = [
                            {
                              id: "summary-1",
                              factoryValue: quotation.winnerFactoryValue || quotation.factory || "china_linda",
                              factoryLabel: quotation.factoryLabel || "China LINDA",
                              unitCost: 8.5,
                              moldCost: 2500,
                              moldCostAdditionalTHB: 0,
                              shippingCost: 500,
                              exchangeRate: 5.5,
                              vat: 7,
                              totalCostPerUnit: (quotation.totalCost / quotation.quantity) || 106.67,
                              sellingPricePerUnit: (quotation.totalSellingPrice / quotation.quantity) || 116.67,
                              sellingPriceLanyard: 0,
                              totalSellingPricePerUnit: (quotation.totalSellingPrice / quotation.quantity) || 116.67,
                              totalProfit: quotation.profit || 1500,
                              isWinner: true,
                              uploadedFile: null,
                            }
                          ];
                          setSummarySupplierEntries(mockEntries);
                          if (tabValue === "completed") {
                            const winnerEntry = mockEntries.find(e => e.isWinner);
                            setSummarySelectedFactory(winnerEntry?.id || null);
                          } else {
                            setSummarySelectedFactory(null);
                          }
                          setShowSummaryDialog(true);
                        }}
                        className="gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <FileText className="w-4 h-4" />
                        สรุปข้อมูล
                      </Button>
                    )}
                    {/* Quick accept button for pending tab */}
                    {tabValue === "pending" && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcceptJob(quotation);
                        }}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        รับงาน
                      </Button>
                    )}
                    {/* สั่งผลิต button for proposed tab when customer confirmed */}
                    {tabValue === "proposed" && quotation.customerConfirmed && (
                      <Button
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const updatedDetails = {
                              ...(quotation as any).rawDetails,
                              productionStep: "ออกใบ PO" as ProductionStep,
                              productionStepHistory: [{
                                step: "ออกใบ PO" as ProductionStep,
                                updatedAt: new Date().toISOString(),
                                updatedBy: "จัดซื้อ ผู้ใช้งาน"
                              }]
                            };
                            const payload = {
                              status: "รายการสั่งผลิต",
                              details: updatedDetails
                            };
                            const res = await fetch(`${API_BASE}/price_estimations.php/${quotation.id}`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(payload)
                            });
                            if (!res.ok) throw new Error("Failed to update status");

                            setMockQuotations(prev => prev.map(q => {
                              if (q.id === quotation.id) {
                                return {
                                  ...q,
                                  status: "รายการสั่งผลิต" as QuotationStatus,
                                  ...(updatedDetails as any)
                                };
                              }
                              return q;
                            }));
                            toast.success("สั่งผลิตสำเร็จ - งานถูกย้ายไป 'รายการสั่งผลิต'");
                            fetchQuotations();
                          } catch (err) {
                            console.error("Error ordering production:", err);
                            toast.error("เกิดข้อผิดพลาดในการสั่งผลิต");
                          }
                        }}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Factory className="w-4 h-4" />
                        สั่งผลิต
                      </Button>
                    )}
                    {/* คัดลอกรูปภาพ button for in-progress tab */}
                    {tabValue === "in-progress" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyFromTable(quotation);
                        }}
                        className="gap-2"
                      >
                        <Image className="w-4 h-4" />
                        คัดลอกรูปภาพ
                      </Button>
                    )}
                    {/* ส่งราคาให้ฝ่ายขาย button for quoted tab */}
                    {tabValue === "quoted" && (
                      <Button
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const payload = { status: "เสนอลูกค้า" };
                            const res = await fetch(`${API_BASE}/price_estimations.php/${quotation.id}`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(payload)
                            });
                            if (!res.ok) throw new Error("Failed to send price");

                            setMockQuotations(prev => prev.map(q => {
                              if (q.id === quotation.id) {
                                return {
                                  ...q,
                                  status: "เสนอลูกค้า" as QuotationStatus,
                                };
                              }
                              return q;
                            }));
                            toast.success("ส่งราคาให้ฝ่ายขายสำเร็จ - สถานะเปลี่ยนเป็น 'เสนอลูกค้า'");
                            fetchQuotations();
                          } catch (err) {
                            console.error("Error sending price:", err);
                            toast.error("เกิดข้อผิดพลาดในการส่งราคา");
                          }
                        }}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        ส่งราคาให้ฝ่ายขาย
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openManagementModal(quotation)}
                      className="gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      จัดการ
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Open production modal
  const openProductionModal = (quotation: MockQuotation) => {
    setSelectedProductionItem(quotation);
    setActualExchangeRate(quotation.actualExchangeRate || 0);
    setActualShippingCost(quotation.actualShippingCost || 0);
    setActiveWorkflowStep("all");
    setShowProductionModal(true);
  };

  // Close production modal
  const closeProductionModal = () => {
    setShowProductionModal(false);
    setSelectedProductionItem(null);
    setActualExchangeRate(0);
    setActualShippingCost(0);
  };

  // Update production step
  const updateProductionStep = (step: ProductionStep) => {
    if (!selectedProductionItem) return;

    const newHistory = [
      ...(selectedProductionItem.productionStepHistory || []),
      {
        step,
        updatedAt: new Date().toISOString(),
        updatedBy: "จัดซื้อ ผู้ใช้งาน" // In real app, get from auth
      }
    ];

    setMockQuotations(prev => prev.map(q => {
      if (q.id === selectedProductionItem.id) {
        return {
          ...q,
          productionStep: step,
          productionStepHistory: newHistory
        };
      }
      return q;
    }));

    setSelectedProductionItem(prev => prev ? {
      ...prev,
      productionStep: step,
      productionStepHistory: newHistory
    } : null);

    toast.success(`อัปเดตสถานะเป็น "${step}" สำเร็จ`);
  };

  // Calculate actual net profit
  const calculateActualNetProfit = () => {
    if (!selectedProductionItem) return 0;
    const estimatedExchangeRate = 5.5; // Default ECR
    const estimatedShipping = (selectedProductionItem.estimatedTotalCost || 0) * 0.05; // Assume 5% of cost

    // Difference in exchange rate and shipping
    const exchangeRateDiff = (actualExchangeRate - estimatedExchangeRate) * (selectedProductionItem.totalCost || 0) / estimatedExchangeRate;
    const shippingDiff = actualShippingCost - estimatedShipping;

    const actualProfit = (selectedProductionItem.profit || 0) - exchangeRateDiff - shippingDiff;
    return actualProfit;
  };

  // Save actual costing
  const saveActualCosting = () => {
    if (!selectedProductionItem) return;

    const actualProfit = calculateActualNetProfit();

    setMockQuotations(prev => prev.map(q => {
      if (q.id === selectedProductionItem.id) {
        return {
          ...q,
          actualExchangeRate,
          actualShippingCost,
          actualNetProfit: actualProfit
        };
      }
      return q;
    }));

    setSelectedProductionItem(prev => prev ? {
      ...prev,
      actualExchangeRate,
      actualShippingCost,
      actualNetProfit: actualProfit
    } : null);

    toast.success("บันทึกต้นทุนจริงสำเร็จ");
  };

  // Copy Production Details
  const handleCopyProductionDetails = (quotation: MockQuotation) => {
    try {
      const copyText = buildUnifiedSummary(quotation);
      navigator.clipboard.writeText(copyText);
      toast.success("คัดลอกข้อมูลสำหรับสั่งผลิตเรียบร้อยแล้ว");
    } catch (err) {
      console.error(err);
      toast.error("ไม่สามารถคัดลอกข้อมูลได้");
    }
  };

  // Download artwork image
  const downloadArtwork = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `Artwork_${selectedQuotation?.jobCode || 'image'}_${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("กำลังดาวน์โหลดรูปภาพ");
  };

  return (
    <div className="space-y-6">
      {/* Artwork Fullscreen Dialog */}
      <Dialog open={isArtworkFullscreenOpen} onOpenChange={setIsArtworkFullscreenOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95">
          <div className="relative w-full h-[95vh] flex flex-col">
            {/* Header with close and download buttons */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="text-white">
                <p className="text-sm opacity-80">Artwork Preview</p>
                <p className="font-medium">{selectedQuotation?.jobCode} - {selectedQuotation?.jobName}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectedQuotation && selectedQuotation.artworkImages[selectedArtworkIndex]) {
                      downloadArtwork(selectedQuotation.artworkImages[selectedArtworkIndex], selectedArtworkIndex);
                    }
                  }}
                  className="text-white hover:bg-white/20"
                >
                  <Download className="h-4 w-4 mr-2" />
                  บันทึกรูป
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsArtworkFullscreenOpen(false)}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Main image display */}
            <div className="flex-1 flex items-center justify-center p-4">
              {selectedQuotation && selectedQuotation.artworkImages[selectedArtworkIndex] && (
                <img
                  src={selectedQuotation.artworkImages[selectedArtworkIndex] || sampleArtwork}
                  alt={`Artwork ${selectedArtworkIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.src = sampleArtwork;
                  }}
                />
              )}
            </div>

            {/* Navigation controls */}
            {selectedQuotation && selectedQuotation.artworkImages.length > 1 && (
              <>
                {/* Previous button */}
                {selectedArtworkIndex > 0 && (
                  <button
                    onClick={() => setSelectedArtworkIndex(prev => Math.max(0, prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all"
                  >
                    <ChevronDown className="h-6 w-6 rotate-90" />
                  </button>
                )}

                {/* Next button */}
                {selectedArtworkIndex < selectedQuotation.artworkImages.length - 1 && (
                  <button
                    onClick={() => setSelectedArtworkIndex(prev => Math.min(selectedQuotation.artworkImages.length - 1, prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all"
                  >
                    <ChevronDown className="h-6 w-6 -rotate-90" />
                  </button>
                )}

                {/* Image counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                  {selectedArtworkIndex + 1} / {selectedQuotation.artworkImages.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการประเมินราคา และสั่งผลิต</h1>
          <p className="text-muted-foreground">จัดการคำขอประเมินราคาจากฝ่ายขาย และติดตามสถานะการผลิต</p>
        </div>
        <Button onClick={() => navigate("/procurement/estimation/add")} className="gap-2">
          <Plus className="h-4 w-4" />
          เพิ่มประเมินราคา
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="🔍 ค้นหาเชิงลึก (วัสดุ, ชนิดชุบ, หมายเหตุ, โรงงาน, สเปค...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={productTypeFilter}
              onValueChange={(value: ProductType | "all") => setProductTypeFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="ประเภทสินค้า" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="custom">Custom Made</SelectItem>
                <SelectItem value="readymade">Ready-made</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveQuotationFilters && (
              <Button variant="outline" onClick={resetAllQuotationFilters} className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                <RotateCcw className="h-4 w-4" />
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-muted/50">
              {tabConfig.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <tab.icon className={`h-4 w-4 ${tab.color}`} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <Badge
                    variant="secondary"
                    className={`ml-1 ${tab.bgColor} text-white text-xs px-2 py-0.5 min-w-[20px] flex items-center justify-center`}
                  >
                    {tab.count}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {tabConfig.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-6">
                <QuotationTable
                  quotations={getQuotationsByTab(tab.value)}
                  tabValue={tab.value}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Management Drawer */}
      <Sheet open={showManagementModal} onOpenChange={(open) => {
        if (!open) closeManagementModal();
      }}>
        <SheetContent side="right" className="w-3/4 max-w-none sm:max-w-none overflow-y-auto scrollbar-littleboy p-6">
          <SheetHeader className="pr-12">
            <div className="flex items-center justify-between gap-4">
              <SheetTitle className="flex items-center gap-3">
                <Settings className="w-6 h-6" />
                จัดการคำขอประเมินราคา
                {selectedQuotation && (
                  <Badge variant="outline" className="ml-2 font-mono">
                    {selectedQuotation.jobCode}
                  </Badge>
                )}
              </SheetTitle>
              {selectedQuotation && (
                <div className="flex items-center gap-2">
                  {isEditingJobDetails ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={handleCancelEditJobDetails}
                        disabled={isSavingJobDetails}
                      >
                        <X className="h-4 w-4" />
                        ยกเลิกแก้ไข
                      </Button>
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={handleSaveJobDetails}
                        disabled={isSavingJobDetails}
                      >
                        <Save className="h-4 w-4" />
                        {isSavingJobDetails ? "กำลังบันทึก..." : "บันทึกรายละเอียดงาน"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleStartEditJobDetails}
                    >
                      <Pencil className="h-4 w-4" />
                      แก้ไข
                    </Button>
                  )}
                </div>
              )}
            </div>
          </SheetHeader>

          {selectedQuotation && (
            <div className="space-y-6" ref={estimationCaptureRef}>
              {/* Section 1: Job Details from Sales (Read-only) */}
              <Card className="border border-border">
                <CardHeader className="pb-3 bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-foreground text-base">
                    <FileImage className="w-5 h-5 text-primary" />
                    รายละเอียดงาน
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-5">
                  {/* Basic Info - Compact Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">JOB ID</p>
                      <p className="font-mono font-semibold text-primary">{selectedQuotation.jobCode}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">ชื่องาน</p>
                      {isEditingJobDetails && jobDetailsDraft ? (
                        <Input
                          value={jobDetailsDraft.jobName}
                          onChange={(e) => updateJobDetailsDraft("jobName", e.target.value)}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <p className="font-medium text-sm">{selectedQuotation.jobName}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">ลูกค้า</p>
                      {isEditingJobDetails && jobDetailsDraft ? (
                        <Input
                          value={jobDetailsDraft.customerName}
                          onChange={(e) => updateJobDetailsDraft("customerName", e.target.value)}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <p className="font-medium text-sm">{selectedQuotation.customerName}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">พนักงานขาย</p>
                      {isEditingJobDetails && jobDetailsDraft ? (
                        <Input
                          value={jobDetailsDraft.salesPerson}
                          onChange={(e) => updateJobDetailsDraft("salesPerson", e.target.value)}
                          className="h-8 text-sm"
                        />
                      ) : (
                        <p className="font-medium text-sm">{selectedQuotation.salesPerson}</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Product Specs Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-sm text-foreground">รายละเอียดสินค้า</h4>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleCopyProductionDetails(selectedQuotation)}>
                        <Copy className="h-3 w-3 mr-1" />
                        คัดลอกข้อมูลสั่งผลิต
                      </Button>
                    </div>

                    {/* Main Specs - 2 Column Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">วัสดุ</p>
                        {isEditingJobDetails && jobDetailsDraft ? (
                          <Input
                            value={jobDetailsDraft.material}
                            onChange={(e) => updateJobDetailsDraft("material", e.target.value)}
                            className="h-8 text-sm bg-background"
                          />
                        ) : (
                          <p className="font-medium text-sm">{selectedQuotation.material}</p>
                        )}
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">ขนาด</p>
                        {isEditingJobDetails && jobDetailsDraft ? (
                          <Input
                            value={jobDetailsDraft.size}
                            onChange={(e) => updateJobDetailsDraft("size", e.target.value)}
                            className="h-8 text-sm bg-background"
                          />
                        ) : (
                          <p className="font-medium text-sm">{selectedQuotation.size}</p>
                        )}
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">ความหนา</p>
                        {isEditingJobDetails && jobDetailsDraft ? (
                          <Input
                            value={jobDetailsDraft.thickness}
                            onChange={(e) => updateJobDetailsDraft("thickness", e.target.value)}
                            className="h-8 text-sm bg-background"
                          />
                        ) : (
                          <p className="font-medium text-sm">{selectedQuotation.thickness}</p>
                        )}
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">ชนิดการชุบ</p>
                        {isEditingJobDetails && jobDetailsDraft ? (
                          <Input
                            value={jobDetailsDraft.finishTypeLabel}
                            onChange={(e) => updateJobDetailsDraft("finishTypeLabel", e.target.value)}
                            className="h-8 text-sm bg-background"
                          />
                        ) : (
                          <p className="font-medium text-sm">{(selectedQuotation as any).rawDetails?.finishTypeLabel || "-"}</p>
                        )}
                      </div>
                    </div>

                    {/* Colors and Quantity Table */}
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">สีและจำนวน</p>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="text-left text-xs py-2">สี</TableHead>
                              <TableHead className="text-right text-xs py-2">จำนวน</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {isEditingJobDetails && jobDetailsDraft ? (
                              jobDetailsDraft.colorRows.map((row, idx) => (
                                <TableRow key={idx}>
                                  <TableCell className="py-2">
                                    <Input
                                      value={row.color}
                                      onChange={(e) => updateDraftColorRow(idx, "color", e.target.value)}
                                      placeholder="เช่น gold"
                                      className="h-8 text-sm"
                                    />
                                  </TableCell>
                                  <TableCell className="py-2">
                                    <div className="flex items-center justify-end gap-2">
                                      <Input
                                        type="number"
                                        min={0}
                                        value={row.quantity}
                                        onChange={(e) => updateDraftColorRow(idx, "quantity", e.target.value)}
                                        placeholder="0"
                                        className="h-8 text-sm text-right max-w-36"
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive"
                                        onClick={() => removeDraftColorRow(idx)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : (
                              (() => {
                                const rawDetails = (selectedQuotation as any).rawDetails;
                                const colorQuantityRows = rawDetails?.colorQuantityRows;

                                // Use actual colorQuantityRows data if available
                                if (colorQuantityRows && Array.isArray(colorQuantityRows) && colorQuantityRows.some((r: any) => r.color)) {
                                  return colorQuantityRows.filter((r: any) => r.color).map((row: any, idx: number) => {
                                    const totalQty = Array.isArray(row.quantities)
                                      ? row.quantities.reduce((sum: number, q: number) => sum + (q || 0), 0)
                                      : 0;
                                    return (
                                      <TableRow key={idx}>
                                        <TableCell className="py-2 text-sm">{row.color}</TableCell>
                                        <TableCell className="text-right py-2 text-sm">{totalQty.toLocaleString()} ชิ้น</TableCell>
                                      </TableRow>
                                    );
                                  });
                                }

                                // Fallback to colors array
                                return selectedQuotation.colors.map((color, idx) => {
                                  const qty = Math.ceil(selectedQuotation.quantity / Math.max(selectedQuotation.colors.length, 1));
                                  return (
                                    <TableRow key={idx}>
                                      <TableCell className="py-2 text-sm">{color}</TableCell>
                                      <TableCell className="text-right py-2 text-sm">{qty.toLocaleString()} ชิ้น</TableCell>
                                    </TableRow>
                                  );
                                });
                              })()
                            )}
                            <TableRow className="bg-muted/30 font-medium">
                              <TableCell className="py-2 text-sm">รวม</TableCell>
                              <TableCell className="text-right py-2 text-sm font-semibold">
                                {isEditingJobDetails && jobDetailsDraft
                                  ? (jobDetailsDraft.colorRows.reduce((sum, row) => sum + parseDraftNumber(row.quantity), 0) || parseDraftNumber(jobDetailsDraft.quantity)).toLocaleString()
                                  : selectedQuotation.quantity.toLocaleString()} ชิ้น
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                      {isEditingJobDetails && (
                        <Button type="button" variant="outline" size="sm" className="gap-2 mt-2" onClick={addDraftColorRow}>
                          <Plus className="h-4 w-4" />
                          เพิ่มสี
                        </Button>
                      )}
                    </div>

                    {/* Front/Back Details - Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {isEditingJobDetails && jobDetailsDraft ? (
                        <>
                          <div className="bg-muted/40 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground font-medium mb-2">รายละเอียดด้านหน้า</p>
                            <Textarea
                              value={jobDetailsDraft.frontDetails}
                              onChange={(e) => updateJobDetailsDraft("frontDetails", e.target.value)}
                              placeholder="คั่นแต่ละรายการด้วย comma หรือขึ้นบรรทัดใหม่"
                              className="min-h-[92px] bg-background text-sm"
                            />
                          </div>
                          <div className="bg-muted/40 rounded-lg p-3">
                            <p className="text-xs text-muted-foreground font-medium mb-2">รายละเอียดด้านหลัง</p>
                            <Textarea
                              value={jobDetailsDraft.backDetails}
                              onChange={(e) => updateJobDetailsDraft("backDetails", e.target.value)}
                              placeholder="คั่นแต่ละรายการด้วย comma หรือขึ้นบรรทัดใหม่"
                              className="min-h-[92px] bg-background text-sm"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Front Details - Collapsible */}
                          <Collapsible className="bg-muted/40 rounded-lg">
                            <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/60 transition-colors rounded-lg">
                              <p className="text-xs text-muted-foreground font-medium">รายละเอียดด้านหน้า</p>
                              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-3 pb-3">
                              <div className="flex gap-1.5 flex-wrap pt-2">
                                {(typeof selectedQuotation.frontDetails === 'string' ? selectedQuotation.frontDetails.split(", ") : []).map((detail, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">{detail}</Badge>
                                )) || <span className="text-muted-foreground text-sm">-</span>}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          {/* Back Details - Collapsible */}
                          <Collapsible className="bg-muted/40 rounded-lg">
                            <CollapsibleTrigger className="w-full p-3 flex items-center justify-between hover:bg-muted/60 transition-colors rounded-lg">
                              <p className="text-xs text-muted-foreground font-medium">รายละเอียดด้านหลัง</p>
                              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-3 pb-3">
                              <div className="flex gap-1.5 flex-wrap pt-2">
                                {(typeof selectedQuotation.backDetails === 'string' ? selectedQuotation.backDetails.split(", ") : []).map((detail, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">{detail}</Badge>
                                )) || <span className="text-muted-foreground text-sm">-</span>}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </>
                      )}
                    </div>

                    {/* Lanyard */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">ขนาดสายคล้องคอ</p>
                        {isEditingJobDetails && jobDetailsDraft ? (
                          <Input
                            value={jobDetailsDraft.lanyardSize}
                            onChange={(e) => updateJobDetailsDraft("lanyardSize", e.target.value)}
                            className="h-8 text-sm bg-background"
                          />
                        ) : (
                          <p className="font-medium text-sm">{selectedQuotation.lanyardSize.replace("x", " × ")}</p>
                        )}
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">จำนวนลาย</p>
                        {isEditingJobDetails && jobDetailsDraft ? (
                          <Input
                            type="number"
                            min={0}
                            value={jobDetailsDraft.lanyardPatterns}
                            onChange={(e) => updateJobDetailsDraft("lanyardPatterns", e.target.value)}
                            className="h-8 text-sm bg-background"
                          />
                        ) : (
                          <p className="font-medium text-sm">{selectedQuotation.lanyardPatterns} ลาย</p>
                        )}
                      </div>
                    </div>

                    {/* Customer Budget - Highlighted */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">งบประมาณต่อชิ้น</p>
                      {isEditingJobDetails && jobDetailsDraft ? (
                        <Input
                          type="number"
                          min={0}
                          value={jobDetailsDraft.customerBudget}
                          onChange={(e) => updateJobDetailsDraft("customerBudget", e.target.value)}
                          className="h-10 max-w-xs bg-background font-semibold text-primary"
                        />
                      ) : (
                        <p className="font-bold text-xl text-primary">{selectedQuotation.customerBudget.toLocaleString()} บาท</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Deadline */}
                  <div>
                    <p className="text-sm text-muted-foreground">วันที่ต้องส่งมอบ</p>
                    {isEditingJobDetails && jobDetailsDraft ? (
                      <Input
                        value={jobDetailsDraft.eventDate}
                        onChange={(e) => updateJobDetailsDraft("eventDate", e.target.value)}
                        placeholder="เช่น 2026-05-17 หรือ 17/5/2569"
                        className="mt-2 h-9 max-w-sm"
                      />
                    ) : (
                      <div>{getDeadlineDisplay(selectedQuotation.eventDate)}</div>
                    )}
                  </div>

                  {/* Artwork Section - Sales Style */}
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-3 font-medium">ข้อมูล Artwork</p>

                    {/* Artwork Image Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-muted-foreground">รูป Artwork</p>
                          {selectedQuotation.artworkImages.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentImage = selectedQuotation.artworkImages[selectedArtworkIndex];
                                const link = document.createElement('a');
                                link.href = currentImage;
                                link.download = `Artwork_${selectedQuotation.jobCode}_${selectedArtworkIndex + 1}.jpg`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                toast.success("กำลังดาวน์โหลดรูปภาพ");
                              }}
                              className="gap-1.5 h-7 text-xs"
                            >
                              <Download className="h-3 w-3" />
                              บันทึกรูป
                            </Button>
                          )}
                        </div>
                        {selectedQuotation.artworkImages.length > 0 ? (
                          <>
                            {/* Main Preview - Clickable */}
                            <div className="relative">
                              <button
                                onClick={() => setIsArtworkFullscreenOpen(true)}
                                className="w-full bg-muted rounded-lg p-4 flex items-center justify-center min-h-[200px] max-h-[300px] cursor-zoom-in hover:bg-muted/80 transition-colors relative group"
                              >
                                <img
                                  src={selectedQuotation.artworkImages[selectedArtworkIndex] || sampleArtwork}
                                  alt={`Artwork preview ${selectedArtworkIndex + 1}`}
                                  className="max-w-full max-h-[260px] object-contain"
                                  onError={(e) => {
                                    // Fallback to sample image if real image fails to load
                                    e.currentTarget.src = sampleArtwork;
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-3 py-1.5 rounded-full text-sm">
                                    คลิกเพื่อขยาย
                                  </div>
                                </div>
                              </button>
                              {selectedQuotation.artworkImages.length > 1 && (
                                <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
                                  {selectedArtworkIndex + 1} / {selectedQuotation.artworkImages.length}
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-2">คลิกที่รูปเพื่อขยายเต็มจอ</p>

                            {/* Thumbnails */}
                            {selectedQuotation.artworkImages.length > 1 && (
                              <div className="flex gap-2 flex-wrap mt-3">
                                {selectedQuotation.artworkImages.map((img, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setSelectedArtworkIndex(index)}
                                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all bg-muted p-1 ${selectedArtworkIndex === index
                                      ? "border-primary ring-2 ring-primary/20"
                                      : "border-border hover:border-primary/50"
                                      }`}
                                  >
                                    <img
                                      src={img || sampleArtwork}
                                      alt={`Thumbnail ${index + 1}`}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        e.currentTarget.src = sampleArtwork;
                                      }}
                                    />
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        ) : (
                          /* Placeholder when no images */
                          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center min-h-[150px] bg-muted/30">
                            <FileImage className="h-10 w-10 text-muted-foreground/50 mb-2" />
                            <p className="text-muted-foreground text-sm">ไม่มีรูป Artwork</p>
                          </div>
                        )}
                      </div>

                      {/* Design Files Section */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">ไฟล์งานออกแบบ</p>
                        {(() => {
                          const raw = Array.isArray((selectedQuotation as any)?.designFiles)
                            ? (selectedQuotation as any).designFiles
                            : Array.isArray((selectedQuotation as any)?.rawDetails?.designFiles)
                              ? (selectedQuotation as any).rawDetails.designFiles
                              : [];

                          const mapFile = (f: any) => {
                            if (typeof f === 'string') {
                              return {
                                fileName: f.split('/').pop() || 'ไฟล์งานออกแบบ',
                                url: f,
                                uploadedBy: '-',
                                uploadDate: '',
                                uploadTime: ''
                              };
                            }
                            return {
                              fileName: f.fileName || f.name || 'ไฟล์งานออกแบบ',
                              url: f.url || f.link || '',
                              uploadedBy: f.uploadedBy || f.user || '-',
                              uploadDate: f.uploadDate || f.date || '',
                              uploadTime: f.uploadTime || f.time || ''
                            };
                          };

                          const files = (raw || []).map(mapFile).filter((x: any) => x.url);
                          const latest = files.length > 0 ? files[files.length - 1] : null;

                          if (!latest) {
                            return (
                              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30">
                                <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                <p className="text-muted-foreground text-sm">ยังไม่มีไฟล์งานออกแบบ</p>
                              </div>
                            );
                          }

                          const dateText = latest.uploadDate ? new Date(latest.uploadDate).toLocaleDateString('th-TH') : '';

                          return (
                            <div className="bg-muted/50 rounded-lg p-4 border">
                              <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-primary/10 rounded-lg">
                                    <FileText className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{latest.fileName}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                      <span>{dateText} {latest.uploadTime}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {latest.uploadedBy}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {latest.url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = latest.url;
                                        link.download = latest.fileName;
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      }}
                                      className="gap-1.5"
                                    >
                                      <Download className="h-4 w-4" />
                                      ดาวน์โหลด
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsUploadHistoryOpen(true)}
                                    className="gap-1.5"
                                  >
                                    <History className="h-4 w-4" />
                                    ประวัติการอัพโหลด
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {(selectedQuotation.notes || isEditingJobDetails) && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">หมายเหตุจากเซลล์</p>
                        {isEditingJobDetails && jobDetailsDraft ? (
                          <Textarea
                            value={jobDetailsDraft.notes}
                            onChange={(e) => updateJobDetailsDraft("notes", e.target.value)}
                            placeholder="หมายเหตุเพิ่มเติม"
                            className="min-h-[84px]"
                          />
                        ) : (
                          <p className="font-medium bg-yellow-50 p-3 rounded-lg border border-yellow-200">{selectedQuotation.notes}</p>
                        )}
                      </div>
                    </>
                  )}

                  {/* Rejection History */}
                  {selectedQuotation.rejectionLogs.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-red-600 font-medium mb-2 flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4" />
                          ประวัติการตีกลับ
                        </p>
                        <div className="space-y-2">
                          {selectedQuotation.rejectionLogs.map((log, idx) => (
                            <div key={idx} className="bg-red-50 p-3 rounded-lg border border-red-200">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-red-700">{log.rejectedBy}</span>
                                <span className="text-muted-foreground">
                                  {new Date(log.rejectedAt).toLocaleString('th-TH')}
                                </span>
                              </div>
                              <p className="text-sm">{log.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Technical Summary Cards - Collapsible (Only for รอประเมิน tab) */}
              {selectedQuotation.status === "ยื่นคำขอประเมิน" && (
                <Collapsible className="w-full">
                  <Card className="border-2 border-slate-200">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="pb-3 cursor-pointer hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-slate-700 text-base">
                            <FileText className="w-5 h-5" />
                            Technical Summary (สำหรับส่งโรงงาน)
                          </CardTitle>
                          <ChevronDown className="w-5 h-5 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Thai + English Mixed Summary */}
                          <Card className="border-2 border-slate-300 bg-slate-50/50">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-slate-700 text-base">
                                  <FileText className="w-5 h-5" />
                                  Technical Summary (TH)
                                </CardTitle>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 hover:bg-slate-100"
                                  onClick={() => {
                                    const sizeFormatted = selectedQuotation.size.replace("ซม.", "cm.");
                                    const thicknessFormatted = selectedQuotation.thickness.replace("มิล", "mm.");
                                    const colorsThai = (selectedQuotation.colors || []).map(getThaiPlatingName).join(", ");
                                    const lanyardFormatted = `${selectedQuotation.lanyardSize.replace("ซม.", "cm.")} (${selectedQuotation.lanyardPatterns} Designs)`;
                                    const quantityFormatted = `${selectedQuotation.quantity.toLocaleString()} pcs.`;

                                    const summaryText = `Product: Medal
Material: ${translateMaterial(selectedQuotation.material)}
Project: ${selectedQuotation.jobName}
Plating: ${colorsThai}
Front: ${selectedQuotation.frontDetails || "-"}
Back: ${selectedQuotation.backDetails || "-"}
Size: ${sizeFormatted}
Thickness: ${thicknessFormatted}
Lanyard: ${lanyardFormatted}
Quantity: ${quantityFormatted}`;

                                    navigator.clipboard.writeText(summaryText);
                                    toast.success("คัดลอกข้อมูลเรียบร้อยแล้ว", {
                                      description: "สามารถนำไปวางใน LINE หรือแอปอื่นได้"
                                    });
                                  }}
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="font-mono text-sm bg-white rounded-lg p-4 border border-slate-200 whitespace-pre-line leading-relaxed">
                                <p><span className="text-slate-500">Product:</span> Medal</p>
                                <p><span className="text-slate-500">Material:</span> {translateMaterial(selectedQuotation.material)}</p>
                                <p><span className="text-slate-500">Project:</span> {selectedQuotation.jobName}</p>
                                <p><span className="text-slate-500">Plating:</span> {(selectedQuotation.colors || []).map(getThaiPlatingName).join(", ")}</p>
                                <p><span className="text-slate-500">Front:</span> {selectedQuotation.frontDetails || "-"}</p>
                                <p><span className="text-slate-500">Back:</span> {selectedQuotation.backDetails || "-"}</p>
                                <p><span className="text-slate-500">Size:</span> {selectedQuotation.size.replace("ซม.", "cm.")}</p>
                                <p><span className="text-slate-500">Thickness:</span> {selectedQuotation.thickness.replace("มิล", "mm.")}</p>
                                <p><span className="text-slate-500">Lanyard:</span> {selectedQuotation.lanyardSize.replace("ซม.", "cm.")} ({selectedQuotation.lanyardPatterns} Designs)</p>
                                <p><span className="text-slate-500">Quantity:</span> {selectedQuotation.quantity.toLocaleString()} pcs.</p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Full English Summary */}
                          <Card className="border-2 border-blue-300 bg-blue-50/50">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-blue-700 text-base">
                                  <FileText className="w-5 h-5" />
                                  Technical Summary (EN)
                                </CardTitle>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 hover:bg-blue-100"
                                  onClick={() => {
                                    // Translate Thai details to English
                                    const translateFrontDetails = (details: string) => {
                                      const translations: Record<string, string> = {
                                        "พิมพ์โลโก้": "Logo Printing",
                                        "ลงสีสเปรย์": "Spray Paint",
                                        "ลงน้ำยาป้องกันสนิม": "Anti-Rust Coating",
                                        "พิมพ์ซิลค์สกรีน": "Silk Screen Printing",
                                        "แกะสลักข้อความ": "Text Engraving",
                                        "ขัดเงา": "Polishing",
                                        "แกะลึก": "Deep Engraving",
                                        "ปั๊มลาย": "Embossing"
                                      };
                                      return details.split(", ").map(item => translations[item.trim()] || item.trim()).join(", ");
                                    };

                                    const translateColors = (colors: string[]) => {
                                      return colors.map(color => {
                                        if (color.includes("shinny gold")) return "Shiny Gold";
                                        if (color.includes("shinny silver")) return "Shiny Silver";
                                        if (color.includes("shinny copper")) return "Shiny Copper";
                                        return color;
                                      }).join(", ");
                                    };

                                    const translateMaterial = (material: string) => {
                                      if (material.includes("ซิงค์อัลลอย") || material.includes("Zinc Alloy")) return "Zinc Alloy";
                                      if (material.includes("ทองเหลือง")) return "Brass";
                                      return material;
                                    };

                                    const sizeFormatted = selectedQuotation.size.replace("ซม.", "cm.");
                                    const thicknessFormatted = selectedQuotation.thickness.replace("มิล", "mm.");
                                    const colorsFormatted = translateColors(selectedQuotation.colors);
                                    const lanyardFormatted = `${selectedQuotation.lanyardSize.replace("ซม.", "cm.")} (${selectedQuotation.lanyardPatterns} Designs)`;
                                    const quantityFormatted = `${selectedQuotation.quantity.toLocaleString()} pcs.`;
                                    const frontEn = translateFrontDetails(selectedQuotation.frontDetails || "-");
                                    const backEn = translateFrontDetails(selectedQuotation.backDetails || "-");
                                    const materialEn = translateMaterial(selectedQuotation.material);

                                    const summaryText = `Product: Medal
Material: ${materialEn}
Project: ${selectedQuotation.jobName}
Plating: ${colorsFormatted}
Front: ${frontEn}
Back: ${backEn}
Size: ${sizeFormatted}
Thickness: ${thicknessFormatted}
Lanyard: ${lanyardFormatted}
Quantity: ${quantityFormatted}`;

                                    navigator.clipboard.writeText(summaryText);
                                    toast.success("Copied to clipboard", {
                                      description: "Ready to paste in LINE or other apps"
                                    });
                                  }}
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="font-mono text-sm bg-white rounded-lg p-4 border border-blue-200 whitespace-pre-line leading-relaxed">
                                {(() => {
                                  const translateFrontDetails = (details: string) => {
                                    const translations: Record<string, string> = {
                                      "พิมพ์โลโก้": "Logo Printing",
                                      "ลงสีสเปรย์": "Spray Paint",
                                      "ลงน้ำยาป้องกันสนิม": "Anti-Rust Coating",
                                      "พิมพ์ซิลค์สกรีน": "Silk Screen Printing",
                                      "แกะสลักข้อความ": "Text Engraving",
                                      "ขัดเงา": "Polishing",
                                      "แกะลึก": "Deep Engraving",
                                      "ปั๊มลาย": "Embossing"
                                    };
                                    return details.split(", ").map(item => translations[item.trim()] || item.trim()).join(", ");
                                  };

                                  // Use shared translateColors helper function

                                  const translateMaterial = (material: string) => {
                                    if (material.includes("ซิงค์อัลลอย") || material.includes("Zinc Alloy")) return "Zinc Alloy";
                                    if (material.includes("ทองเหลือง")) return "Brass";
                                    return material;
                                  };

                                  return (
                                    <>
                                      <p><span className="text-blue-500">Product:</span> Medal</p>
                                      <p><span className="text-blue-500">Material:</span> {translateMaterial(selectedQuotation.material)}</p>
                                      <p><span className="text-blue-500">Project:</span> {selectedQuotation.jobName}</p>
                                      <p><span className="text-blue-500">Plating:</span> {translateColors(selectedQuotation.colors)}</p>
                                      <p><span className="text-blue-500">Front:</span> {translateFrontDetails(selectedQuotation.frontDetails || "-")}</p>
                                      <p><span className="text-blue-500">Back:</span> {translateFrontDetails(selectedQuotation.backDetails || "-")}</p>
                                      <p><span className="text-blue-500">Size:</span> {selectedQuotation.size.replace("ซม.", "cm.")}</p>
                                      <p><span className="text-blue-500">Thickness:</span> {selectedQuotation.thickness.replace("มิล", "mm.")}</p>
                                      <p><span className="text-blue-500">Lanyard:</span> {selectedQuotation.lanyardSize.replace("ซม.", "cm.")} ({selectedQuotation.lanyardPatterns} Designs)</p>
                                      <p><span className="text-blue-500">Quantity:</span> {selectedQuotation.quantity.toLocaleString()} pcs.</p>
                                    </>
                                  );
                                })()}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Section 2: Action Bar - Hide when estimation started */}
              {!estimationStarted && (
                <Card className="border-2 border-amber-200 bg-amber-50/30">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <span className="font-medium text-amber-700">การจัดการสถานะ</span>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant="destructive"
                          onClick={() => setShowRejectDialog(true)}
                          className="gap-2"
                        >
                          <RotateCcw className="w-4 h-4" />
                          ข้อมูลไม่ครบ / ตีกลับ
                        </Button>
                        <Button
                          onClick={() => handleAcceptJob()}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                          รับงานเพื่อประเมินราคา
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Section 3: Multi-Supplier Estimation Table - Only show after clicking "เริ่มการประเมินราคา" */}
              {estimationStarted && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calculator className="w-5 h-5" />
                          ตารางประเมินราคา
                          {!isReadOnlyMode && selectedQuotation?.status === "อยู่ระหว่างการประเมินราคา" && (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-300 ml-2">
                              อยู่ระหว่างการประเมินราคา
                            </Badge>
                          )}
                          {!isReadOnlyMode && selectedQuotation?.status === "อยู่ระหว่างการประเมินราคา" && (selectedQuotation?.rejectionLogs?.length || 0) > 0 && (
                            <Badge className="bg-red-100 text-red-700 border-red-300 ml-2">
                              Revision #{selectedQuotation.rejectionLogs.length}
                            </Badge>
                          )}
                          {isReadOnlyMode && selectedQuotation?.status === "เสนอราคา" && (
                            <Badge className="bg-purple-100 text-purple-700 border-purple-300 ml-2">
                              เสนอราคา
                            </Badge>
                          )}
                          {isReadOnlyMode && selectedQuotation?.status === "เสนอลูกค้า" && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-300 ml-2">
                              เสนอลูกค้า
                            </Badge>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                          {isReadOnlyMode && selectedQuotation?.status === "เสนอลูกค้า"
                            ? "ข้อมูลการประเมินราคาที่เสร็จสิ้นแล้ว - โรงงานที่ได้รับเลือกจะแสดง Badge 'ผู้ชนะ'"
                            : isReadOnlyMode
                              ? "ข้อมูลการประเมินราคาที่บันทึกไว้ - กดปุ่มแก้ไขเพื่อแก้ไขข้อมูล"
                              : selectedQuotation?.status === "อยู่ระหว่างการประเมินราคา" && (selectedQuotation?.rejectionLogs?.length || 0) > 0
                                ? "แก้ไขราคาตามที่ฝ่ายขายขอ แล้วกด 'ส่งราคาแก้ไข'"
                                : "เลือกโรงงานที่ต้องการเปรียบเทียบ กรอกราคาแต่ละโรงงาน"}
                        </p>
                      </div>
                      {isReadOnlyMode && selectedQuotation?.status !== "เสนอลูกค้า" && (
                        <Button
                          onClick={handleEnableEditing}
                          className="gap-2 bg-amber-500 hover:bg-amber-600"
                        >
                          <Pencil className="w-4 h-4" />
                          แก้ไขข้อมูล
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Factory Multi-Select Dropdown - Hide in read-only mode */}
                    {!isReadOnlyMode && (
                      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                        <div className="flex items-center gap-2 mb-4">
                          <Plus className="w-5 h-5 text-purple-600" />
                          <span className="font-semibold text-purple-700">เลือกโรงงาน (Multi-Select)</span>
                        </div>

                        <Popover open={factorySelectOpen} onOpenChange={setFactorySelectOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between min-h-[40px] h-auto py-2">
                              <span className="text-muted-foreground">
                                {selectedFactories.length === 0
                                  ? "เลือกโรงงานที่ต้องการเปรียบเทียบ..."
                                  : `เลือกแล้ว ${selectedFactories.length} โรงงาน`}
                              </span>
                              <Plus className="w-4 h-4 ml-2" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0 overflow-hidden" align="start">
                            <div className="p-3 border-b bg-muted/50 space-y-2">
                              <p className="font-medium text-sm">เลือกโรงงาน (18 โรงงาน)</p>
                              <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  placeholder="ค้นหาโรงงาน..."
                                  value={factorySearchQuery}
                                  onChange={(e) => setFactorySearchQuery(e.target.value)}
                                  className="pl-8 h-9"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">เลือกได้หลายโรงงานพร้อมกัน</p>
                            </div>
                            <div className="max-h-[280px] overflow-y-auto overscroll-contain p-2 space-y-1">
                              {factoryOptions
                                .filter(factory =>
                                  factory.label.toLowerCase().includes(factorySearchQuery.toLowerCase()) ||
                                  factory.code.toLowerCase().includes(factorySearchQuery.toLowerCase())
                                )
                                .map((factory) => (
                                  <div
                                    key={factory.value}
                                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                                    onClick={() => handleFactoryToggle(factory.value, !selectedFactories.includes(factory.value))}
                                  >
                                    <Checkbox
                                      checked={selectedFactories.includes(factory.value)}
                                      onCheckedChange={(checked) => handleFactoryToggle(factory.value, checked as boolean)}
                                    />
                                    <div className="flex items-center gap-2 flex-1">
                                      <span className="text-sm font-medium">{factory.label}</span>
                                      <Badge variant="outline" className="text-xs">{factory.code}</Badge>
                                    </div>
                                  </div>
                                ))}
                              {factoryOptions.filter(factory =>
                                factory.label.toLowerCase().includes(factorySearchQuery.toLowerCase()) ||
                                factory.code.toLowerCase().includes(factorySearchQuery.toLowerCase())
                              ).length === 0 && (
                                  <div className="p-4 text-center text-muted-foreground text-sm">
                                    ไม่พบโรงงานที่ค้นหา
                                  </div>
                                )}
                            </div>
                          </PopoverContent>
                        </Popover>

                        {/* Selected factories display */}
                        {selectedFactories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {selectedFactories.map(factoryValue => {
                              const factory = factoryOptions.find(f => f.value === factoryValue);
                              return (
                                <Badge
                                  key={factoryValue}
                                  variant="secondary"
                                  className="gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200"
                                >
                                  {factory?.label}
                                  <X
                                    className="w-3 h-3 cursor-pointer hover:text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFactoryToggle(factoryValue, false);
                                    }}
                                  />
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Global Header - ข้อมูลต้นทุน */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Settings className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-700">ข้อมูลต้นทุน</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">ค่าขนส่ง (RMB)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={globalHeader.shippingCostRMB || ""}
                            onChange={(e) => updateGlobalHeader("shippingCostRMB", parseFloat(e.target.value) || 0)}
                            className="mt-1 text-center font-medium"
                            placeholder="0.00"
                            disabled={isReadOnlyMode}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">อัตราแลกเปลี่ยน</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={globalHeader.exchangeRate || ""}
                            onChange={(e) => updateGlobalHeader("exchangeRate", parseFloat(e.target.value) || 0)}
                            className="mt-1 text-center font-medium"
                            placeholder="5.5"
                            disabled={isReadOnlyMode}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">VAT (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={globalHeader.vat || ""}
                            onChange={(e) => updateGlobalHeader("vat", parseFloat(e.target.value) || 0)}
                            className="mt-1 text-center font-medium"
                            placeholder="7"
                            disabled={isReadOnlyMode}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">จำนวน (ชิ้น)</Label>
                          <Input
                            type="number"
                            value={globalHeader.quantity || ""}
                            onChange={(e) => updateGlobalHeader("quantity", parseInt(e.target.value) || 0)}
                            className="mt-1 text-center font-medium bg-green-50 border-green-200"
                            placeholder="0"
                            disabled={isReadOnlyMode}
                          />
                        </div>
                      </div>
                    </div>

                    {/* ราคาขาย Section */}
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                      <div className="flex items-center gap-2 mb-4">
                        <Settings className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-700">ราคาขาย</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-green-700">ชิ้นงาน ราคาขาย/หน่วย (THB) <span className="text-red-500">*</span></Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={globalHeader.unitSellingPriceTHB || ""}
                            onChange={(e) => updateGlobalHeader("unitSellingPriceTHB", parseFloat(e.target.value) || 0)}
                            className="mt-1 text-center font-medium"
                            placeholder="0.00"
                            disabled={isReadOnlyMode}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-green-700">สายห้อย ราคาขาย/หน่วย (THB)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={globalHeader.lanyardSellingPriceTHB || ""}
                            onChange={(e) => updateGlobalHeader("lanyardSellingPriceTHB", parseFloat(e.target.value) || 0)}
                            className="mt-1 text-center font-medium"
                            placeholder="0.00"
                            disabled={isReadOnlyMode}
                          />
                        </div>
                      </div>
                    </div>

                    {supplierEntries.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>ยังไม่มีข้อมูลโรงงาน</p>
                        <p className="text-sm">เลือกโรงงานจาก Dropdown ด้านบนเพื่อเริ่มกรอกราคา</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                {/* Show selection column for อยู่ระหว่างประเมิน, เสนอราคา, or เสนอลูกค้า */}
                                {(selectedQuotation?.status === "อยู่ระหว่างการประเมินราคา" || selectedQuotation?.status === "เสนอราคา" || selectedQuotation?.status === "เสนอลูกค้า") && (
                                  <TableHead className="w-[80px] text-center bg-green-50 font-bold">เลือก</TableHead>
                                )}
                                <TableHead className="min-w-[180px]">โรงงาน & รหัสงาน</TableHead>
                                <TableHead className="min-w-[200px] text-center bg-orange-50">
                                  <div className="text-orange-700 font-bold">ต้นทุนหยวน</div>
                                  <div className="text-xs font-normal text-orange-600">(ทุน/หน่วย, ค่าโมล)</div>
                                </TableHead>
                                <TableHead className="w-[100px] text-center bg-cyan-50 font-bold">ต้นทุน/ชิ้น<br /><span className="text-xs font-normal">(THB)</span></TableHead>
                                <TableHead className="w-[100px] text-center bg-green-50 font-bold">ราคาขาย/ชิ้น<br /><span className="text-xs font-normal">(THB)</span></TableHead>
                                <TableHead className="w-[100px] text-center bg-amber-50 font-bold">กำไรรวม<br /><span className="text-xs font-normal">(THB)</span></TableHead>
                                <TableHead className="w-[100px] text-center bg-purple-50 font-bold">ค่าโมล(เพิ่มเติม)<br /><span className="text-xs font-normal">(THB)</span></TableHead>
                                <TableHead className="min-w-[130px] text-center">หลักฐาน</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {supplierEntries.map((entry, index) => (
                                <TableRow
                                  key={entry.id}
                                  className={
                                    entry.isWinner && (selectedQuotation?.status === "เสนอลูกค้า" || selectedQuotation?.status === "เสนอราคา")
                                      ? "bg-green-50/70 border-l-4 border-l-green-500"
                                      : entry.isWinner && selectedQuotation?.status === "อยู่ระหว่างการประเมินราคา"
                                        ? "bg-green-50/50 border-l-4 border-l-green-400"
                                        : ""
                                  }
                                >
                                  {/* Selection column for อยู่ระหว่างประเมิน, เสนอราคา, or เสนอลูกค้า */}
                                  {(selectedQuotation?.status === "อยู่ระหว่างการประเมินราคา" || selectedQuotation?.status === "เสนอราคา" || selectedQuotation?.status === "เสนอลูกค้า") && (
                                    <TableCell className="text-center bg-green-50/30">
                                      <Button
                                        variant={entry.isWinner ? "default" : "outline"}
                                        size="sm"
                                        className={`gap-1 text-xs ${entry.isWinner ? "bg-green-600 hover:bg-green-700" : "hover:bg-green-50 hover:border-green-400"}`}
                                        onClick={() => handleSelectWinnerReadOnly(entry.id)}
                                      >
                                        เลือก
                                      </Button>
                                    </TableCell>
                                  )}
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{entry.factoryLabel || "ยังไม่ได้เลือก"}</span>
                                        {entry.isWinner && (selectedQuotation?.status === "อยู่ระหว่างการประเมินราคา" || selectedQuotation?.status === "เสนอลูกค้า" || selectedQuotation?.status === "เสนอราคา") && (
                                          <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs px-2 py-0.5">เลือก</Badge>
                                        )}
                                      </div>
                                      <div className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded inline-block">
                                        {generateJobCode(entry.factoryValue, index)}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="bg-orange-50/50">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label className="text-xs text-orange-600">ทุน/หน่วย</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={entry.unitCost || ""}
                                          onChange={(e) => updateSupplierEntry(entry.id, "unitCost", parseFloat(e.target.value) || 0)}
                                          className="h-8 text-center text-sm"
                                          placeholder="0.00"
                                          disabled={isReadOnlyMode}
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-xs text-orange-600">ค่าโมล</Label>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          value={entry.moldCost || ""}
                                          onChange={(e) => updateSupplierEntry(entry.id, "moldCost", parseFloat(e.target.value) || 0)}
                                          className="h-8 text-center text-sm"
                                          placeholder="0.00"
                                          disabled={isReadOnlyMode}
                                        />
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center bg-cyan-50/50">
                                    <span className="font-bold text-lg text-cyan-700">
                                      {entry.totalCostPerUnit?.toFixed(2) || "0.00"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center bg-green-50/50">
                                    <span className="font-bold text-lg text-green-700">
                                      {entry.totalSellingPricePerUnit?.toFixed(2) || "0.00"}
                                    </span>
                                  </TableCell>
                                  <TableCell className={`text-center ${(entry.totalProfit || 0) >= 0 ? 'bg-amber-50/50' : 'bg-red-50/50'}`}>
                                    <span className={`font-bold text-lg ${(entry.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {entry.totalProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center bg-purple-50/50">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      value={entry.moldCostAdditionalTHB || ""}
                                      onChange={(e) => updateSupplierEntry(entry.id, "moldCostAdditionalTHB", parseFloat(e.target.value) || 0)}
                                      className="h-8 w-20 text-center text-sm mx-auto"
                                      placeholder="0.00"
                                      disabled={isReadOnlyMode}
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {isReadOnlyMode ? (
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-center gap-1">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 text-xs px-2"
                                            onClick={() => handleCopyRowAsImage(entry, index)}
                                          >
                                            <Copy className="w-3 h-3" />
                                            คัดลอก
                                          </Button>
                                        </div>
                                        {hasSupplierEvidence(entry) && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-auto max-w-[128px] gap-1 px-2 py-1 text-xs text-green-600"
                                            title={getSupplierEvidenceName(entry)}
                                            onClick={() => downloadSupplierEvidence(entry)}
                                          >
                                            <Paperclip className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{getSupplierEvidenceName(entry)}</span>
                                          </Button>
                                        )}
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center justify-center gap-2">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 text-xs px-2"
                                            onClick={() => handleCopyRowAsImage(entry, index)}
                                            title="คัดลอกข้อมูลเป็นรูปภาพ"
                                          >
                                            <Copy className="w-3 h-3" />
                                          </Button>
                                          <input
                                            type="file"
                                            id={`file-upload-${entry.id}`}
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0] || null;
                                              void handleSupplierFileUpload(entry.id, file);
                                              e.currentTarget.value = "";
                                            }}
                                          />
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1 text-xs px-3"
                                            onClick={() => document.getElementById(`file-upload-${entry.id}`)?.click()}
                                          >
                                            <Upload className="w-3 h-3" />
                                            อัพโหลด
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeSupplierEntry(entry.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                        {hasSupplierEvidence(entry) && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="mx-auto mt-1 h-auto max-w-[128px] gap-1 px-2 py-1 text-xs text-green-600"
                                            title={getSupplierEvidenceName(entry)}
                                            onClick={() => downloadSupplierEvidence(entry)}
                                          >
                                            <Paperclip className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{getSupplierEvidenceName(entry)}</span>
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Summary Section - Show total values */}
                        {supplierEntries.length > 0 && (
                          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                            <h3 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                              <Calculator className="w-5 h-5" />
                              สรุปยอดรวม (Total Summary)
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                              {supplierEntries.map((entry) => {
                                const calcQuantity = globalHeader.quantity || selectedQuotation?.quantity || 0;
                                const totalCost = entry.totalCostPerUnit * calcQuantity;
                                const totalSellingPrice = entry.totalSellingPricePerUnit * calcQuantity;
                                const totalProfit = entry.totalProfit;
                                
                                return (
                                  <div 
                                    key={entry.id} 
                                    className={`p-3 rounded-lg border ${
                                      entry.isWinner 
                                        ? 'bg-green-50 border-green-300' 
                                        : 'bg-white border-gray-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="font-medium text-sm">{entry.factoryLabel}</span>
                                      {entry.isWinner && (
                                        <Badge className="bg-green-500 text-white text-xs px-1.5 py-0">เลือก</Badge>
                                      )}
                                    </div>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">ต้นทุนรวมทั้งหมด:</span>
                                        <span className="font-bold text-cyan-700">{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">ราคาขายรวมทั้งหมด:</span>
                                        <span className="font-bold text-green-700">{totalSellingPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿</span>
                                      </div>
                                      <div className="flex justify-between pt-1 border-t">
                                        <span className="text-gray-600">กำไรรวมทั้งหมด:</span>
                                        <span className={`font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ฿
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-xs text-blue-600 mt-3">
                              * ตารางด้านบนแสดงราคาต่อหน่วย ส่วนนี้แสดงยอดรวมทั้งหมด (จำนวน {(globalHeader.quantity || selectedQuotation?.quantity || 0).toLocaleString()} ชิ้น)
                            </p>
                          </div>
                        )}

                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Footer Actions - Only show after estimation started or in read-only mode */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                {/* Show close button when not started yet */}
                {!estimationStarted && !isReadOnlyMode && (
                  <>
                    <Button variant="outline" onClick={closeManagementModal}>
                      ปิด
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleCopyReviewLink}>
                      <Link2 className="w-4 h-4" />
                      คัดลอกลิงก์
                    </Button>
                  </>
                )}

                {/* Show full action buttons only after estimation started or in read-only mode */}
                {(estimationStarted || isReadOnlyMode) && (
                  <>
                    <Button variant="outline" onClick={closeManagementModal}>
                      {isReadOnlyMode ? "ปิด" : "ยกเลิก"}
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleCopyReviewLink}>
                      <Link2 className="w-4 h-4" />
                      คัดลอกลิงก์
                    </Button>
                    {/* Show approve button for อยู่ระหว่างประเมิน and เสนอราคา */}
                    {isReadOnlyMode && (selectedQuotation?.status === "อยู่ระหว่างการประเมินราคา" || selectedQuotation?.status === "เสนอราคา") && (
                      <Button
                        onClick={handleApproveWithWinner}
                        disabled={!selectedWinner}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Trophy className="w-4 h-4" />
                        อนุมัติราคา & บันทึก
                      </Button>
                    )}
                    {/* Show สั่งผลิต button for เสนอลูกค้า only when customer confirmed */}
                    {isReadOnlyMode && selectedQuotation?.status === "เสนอลูกค้า" && selectedQuotation?.customerConfirmed && (
                      <Button
                        onClick={async () => {
                          if (selectedQuotation) {
                            try {
                              const winnerEntry = supplierEntries.find(e => e.id === selectedWinner);
                              const updatedDetails = {
                                ...(selectedQuotation as any).rawDetails,
                                productionStep: "ออกใบ PO" as ProductionStep,
                                productionStepHistory: [{
                                  step: "ออกใบ PO" as ProductionStep,
                                  updatedAt: new Date().toISOString(),
                                  updatedBy: "จัดซื้อ ผู้ใช้งาน"
                                }],
                                winnerFactoryValue: winnerEntry?.factoryValue || selectedQuotation.winnerFactoryValue,
                                factoryLabel: winnerEntry?.factoryLabel || selectedQuotation.factoryLabel,
                              };

                              const payload = {
                                status: "รายการสั่งผลิต",
                                details: updatedDetails
                              };

                              const res = await fetch(`${API_BASE}/price_estimations.php/${selectedQuotation.id}`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(payload)
                              });

                              if (!res.ok) throw new Error("Failed to order production");

                              setMockQuotations(prev => prev.map(q => {
                                if (q.id === selectedQuotation.id) {
                                  return {
                                    ...q,
                                    status: "รายการสั่งผลิต" as QuotationStatus,
                                    ...(updatedDetails as any)
                                  };
                                }
                                return q;
                              }));
                              toast.success("สั่งผลิตสำเร็จ - งานถูกย้ายไป 'รายการสั่งผลิต'");
                              closeManagementModal();
                              fetchQuotations();
                            } catch (err) {
                              console.error("Error ordering production:", err);
                              toast.error("เกิดข้อผิดพลาดในการสั่งผลิต");
                            }
                          }
                        }}
                        className="gap-2 bg-blue-600 hover:bg-blue-700"
                      >
                        <Factory className="w-4 h-4" />
                        สั่งผลิต
                      </Button>
                    )}
                    {!isReadOnlyMode && selectedQuotation?.status === "อยู่ระหว่างการประเมินราคา" && (
                      <>
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => {
                            const winnerEntry = supplierEntries.find(e => e.isWinner);
                            if (winnerEntry) {
                              const winnerIndex = supplierEntries.indexOf(winnerEntry);
                              handleCopyRowAsImage(winnerEntry, winnerIndex);
                            } else if (supplierEntries.length > 0) {
                              handleCopyRowAsImage(supplierEntries[0], 0);
                            } else {
                              toast.error("ไม่มีข้อมูลโรงงานให้คัดลอก");
                            }
                          }}
                        >
                          <Image className="w-4 h-4" />
                          คัดลอกรูปภาพ
                        </Button>
                        <Button
                          onClick={handleSaveEstimation}
                          disabled={supplierEntries.length === 0}
                          variant="outline"
                          className="gap-2"
                        >
                          <Save className="w-4 h-4" />
                          บันทึกข้อมูล
                        </Button>
                        <Button
                          onClick={async () => {
                            const winnerId = supplierEntries.find(e => e.isWinner)?.id;
                            if (!winnerId) {
                              toast.error("กรุณาเลือกโรงงานที่ต้องการอนุมัติก่อน");
                              return;
                            }
                            setSelectedWinner(winnerId);
                            // Call the existing API handler
                            await handleApproveWithWinner();
                            closeManagementModal();
                          }}
                          disabled={!supplierEntries.some(e => e.isWinner)}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Trophy className="w-4 h-4" />
                          อนุมัติราคา
                        </Button>
                      </>
                    )}
                    {/* ส่งราคาให้ฝ่ายขาย / ส่งราคาแก้ไข - on เสนอราคา tab */}
                    {!isReadOnlyMode && selectedQuotation?.status === "เสนอราคา" && (
                      <>
                        <Button
                          onClick={handleSaveEstimation}
                          disabled={supplierEntries.length === 0}
                          variant="outline"
                          className="gap-2"
                        >
                          <Save className="w-4 h-4" />
                          บันทึกข้อมูล
                        </Button>
                        {selectedQuotation.rejectionLogs.length > 0 ? (
                          <Button
                            onClick={handleSendRevisedPrice}
                            disabled={supplierEntries.length === 0}
                            className="gap-2 bg-orange-600 hover:bg-orange-700"
                          >
                            <RotateCcw className="w-4 h-4" />
                            ส่งราคาแก้ไข (ครั้งที่ {selectedQuotation.rejectionLogs.length})
                          </Button>
                        ) : (
                          <Button
                            onClick={handleSendPriceToSales}
                            disabled={supplierEntries.length === 0}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                            ส่งราคาให้ฝ่ายขาย
                          </Button>
                        )}
                      </>
                    )}
                    {!isReadOnlyMode && selectedQuotation?.status === "ยื่นคำขอประเมิน" && (
                      <>
                        <Button
                          onClick={handleSaveEstimation}
                          disabled={supplierEntries.length === 0}
                          className="gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                          <Save className="w-4 h-4" />
                          บันทึกข้อมูล
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <RotateCcw className="w-5 h-5" />
              ตีกลับคำขอประเมินราคา
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              งานจะถูกย้ายไปสถานะ "ขอข้อมูลเพิ่มเติม" เพื่อให้ฝ่ายขายแก้ไขและส่งกลับมาใหม่
            </p>
            <div>
              <Label htmlFor="reject-reason">เหตุผลในการตีกลับ *</Label>
              <Textarea
                id="reject-reason"
                placeholder="ระบุเหตุผล เช่น ไม่มีไฟล์ออกแบบ, ข้อมูลจำนวนไม่ชัดเจน, ต้องการ Artwork เพิ่ม..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              * ระบบจะบันทึก Log ว่าจัดซื้อคนไหนตีกลับด้วยเหตุผลอะไร
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleReject} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              ยืนยันตีกลับ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-700">
              <X className="w-5 h-5" />
              ยกเลิกงาน
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ยืนยันการยกเลิกงานนี้? งานจะถูกย้ายไปสถานะ "ยกเลิก" และไม่สามารถกู้คืนได้
            </p>
            <div>
              <Label htmlFor="cancel-reason">เหตุผลในการยกเลิก *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="ระบุเหตุผล เช่น ลูกค้ายกเลิกโปรเจกต์, ไม่ตกลงราคา..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleCancel} className="gap-2">
              <X className="w-4 h-4" />
              ยืนยันยกเลิกงาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approval Confirmation Dialog - สรุปข้อมูลก่อนขออนุมัติ */}
      <Dialog open={showApprovalConfirmDialog} onOpenChange={setShowApprovalConfirmDialog}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              สรุปข้อมูลก่อนขออนุมัติราคา
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={async () => {
                if (approvalContentRef.current) {
                  try {
                    await waitForImagesToLoad(approvalContentRef.current);
                    const canvas = await html2canvas(approvalContentRef.current, {
                      backgroundColor: "#ffffff",
                      scale: 2,
                      useCORS: true,
                    });
                    canvas.toBlob(async (blob) => {
                      if (blob) {
                        try {
                          await navigator.clipboard.write([
                            new ClipboardItem({ "image/png": blob }),
                          ]);
                          toast.success("คัดลอกเป็นรูปภาพแล้ว");
                        } catch (err) {
                          // Fallback: download as file
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `quotation-summary-${selectedQuotation?.jobCode || "export"}.png`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success("ดาวน์โหลดรูปภาพแล้ว");
                        }
                      }
                    }, "image/png");
                  } catch (err) {
                    toast.error("เกิดข้อผิดพลาดในการคัดลอกรูปภาพ");
                  }
                }
              }}
            >
              <Image className="w-4 h-4" />
              คัดลอกเป็นรูปภาพ
            </Button>
          </DialogHeader>

          {selectedQuotation && (
            <div ref={approvalContentRef} className="space-y-6 bg-white p-4 rounded-lg">
              {/* Section 1: Product Details with JOB ID and Artwork */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-600 mb-4">รายละเอียดสินค้า</h3>

                {/* Main Layout: Artwork Left + Specs Right */}
                <div className="flex gap-4">
                  {/* Left Column: Artwork + JOB ID */}
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    {/* Artwork Image */}
                    <div className="w-32 h-32 border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                      <img
                        src={getPrimaryArtworkSource(selectedQuotation) || "/placeholder.svg"}
                        alt="Artwork"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {/* JOB ID Badge */}
                    <div className="inline-flex items-center gap-1 bg-blue-100 px-2 py-1.5 rounded-lg">
                      <span className="text-xs text-blue-600">JOB ID:</span>
                      <span className="font-bold text-sm text-blue-700">{selectedQuotation.jobCode}</span>
                    </div>
                  </div>

                  {/* Right Column: 2x3 Specs Grid */}
                  <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-3">
                    {/* Row 1 */}
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">วัสดุ</p>
                      <p className="font-medium text-blue-700">{translateMaterial(selectedQuotation.material)}</p>
                    </div>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">ขนาด</p>
                      <p className="font-medium">{selectedQuotation.size}</p>
                    </div>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">ความหนา</p>
                      <p className="font-medium">{selectedQuotation.thickness}</p>
                    </div>
                    {/* Row 2 */}
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">สีชุบ</p>
                      <p className="font-medium">{getQuotationPlatingColorsText(selectedQuotation)}</p>
                    </div>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">จำนวนรวม</p>
                      <p className="font-bold text-lg">{selectedQuotation.quantity.toLocaleString()} ชิ้น</p>
                    </div>
                    <div className="border rounded-lg p-3 bg-orange-50">
                      <p className="text-xs text-orange-600">จำนวนลาย</p>
                      <p className="font-semibold text-lg">{selectedQuotation.lanyardPatterns} ลาย</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Factory Comparison Table */}
              <div>
                <h3 className="text-sm font-semibold text-orange-600 mb-3">ตารางเปรียบเทียบโรงงาน</h3>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-left">โรงงาน & รหัสงาน</TableHead>
                        <TableHead className="text-center bg-orange-50">
                          <div className="text-orange-600">ต้นทุนหยวน</div>
                          <div className="text-xs text-orange-500">(ทุน/หน่วย, ค่าโมล)</div>
                        </TableHead>
                        <TableHead className="text-center bg-cyan-50">
                          <div className="text-cyan-600">ต้นทุน/ชิ้น</div>
                          <div className="text-xs text-cyan-500">(THB)</div>
                        </TableHead>
                        <TableHead className="text-center bg-green-50">
                          <div className="text-green-600">ราคาขาย/ชิ้น</div>
                          <div className="text-xs text-green-500">(THB)</div>
                        </TableHead>
                        <TableHead className="text-center bg-amber-50">
                          <div className="text-amber-600">กำไร</div>
                          <div className="text-xs text-amber-500">(THB)</div>
                        </TableHead>
                        <TableHead className="text-center bg-purple-50">
                          <div className="text-purple-600">ค่าโมล(เพิ่ม</div>
                          <div className="text-xs text-purple-500">เติม) (THB)</div>
                        </TableHead>
                        <TableHead className="text-center">หลักฐาน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierEntries.map((entry, index) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium text-blue-700">{entry.factoryLabel || "ยังไม่ได้เลือก"}</div>
                              <div className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded inline-block">
                                {generateJobCode(entry.factoryValue, index)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="bg-orange-50/30">
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div>
                                <div className="text-xs text-orange-600">ทุน/หน่วย</div>
                                <div className="font-medium">{entry.unitCost?.toFixed(2) || "0.00"}</div>
                              </div>
                              <div>
                                <div className="text-xs text-orange-600">ค่าโมล</div>
                                <div className="font-medium">{entry.moldCost?.toFixed(2) || "0.00"}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center bg-cyan-50/30">
                            <span className="font-bold text-cyan-700">
                              {entry.totalCostPerUnit?.toFixed(2) || "0.00"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center bg-green-50/30">
                            <span className="font-bold text-green-700">
                              {entry.totalSellingPricePerUnit?.toFixed(2) || "0.00"}
                            </span>
                          </TableCell>
                          <TableCell className={`text-center ${(entry.totalProfit || 0) >= 0 ? 'bg-amber-50/30' : 'bg-red-50/30'}`}>
                            <span className={`font-bold ${(entry.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {entry.totalProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center bg-purple-50/30">
                            <span className="font-medium">{entry.moldCostAdditionalTHB?.toFixed(2) || "0.00"}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {hasSupplierEvidence(entry) ? (
                              <div className="flex items-center justify-center gap-1">
                                <Upload className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600">มีไฟล์</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 mt-4 border-t">
            <Button variant="outline" onClick={() => setShowApprovalConfirmDialog(false)}>
              กลับไปแก้ไข
            </Button>
            <Button
              onClick={async () => {
                if (selectedQuotation) {
                  try {
                    const payload = { status: "อยู่ระหว่างการประเมินราคา" };
                    const res = await fetch(`${API_BASE}/price_estimations.php/${selectedQuotation.id}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload)
                    });
                    if (!res.ok) throw new Error("Failed to update status");

                    setMockQuotations(prev => prev.map(q => {
                      if (q.id === selectedQuotation.id) {
                        return {
                          ...q,
                          status: "อยู่ระหว่างการประเมินราคา" as QuotationStatus,
                        };
                      }
                      return q;
                    }));
                    toast.success("ส่งขออนุมัติราคาสำเร็จ - สถานะเปลี่ยนเป็น 'อยู่ระหว่างการประเมินราคา'");
                    setShowApprovalConfirmDialog(false);
                    closeManagementModal();
                    fetchQuotations();
                  } catch (err) {
                    console.error("Error approving:", err);
                    toast.error("เกิดข้อผิดพลาดในการส่งขออนุมัติ");
                  }
                }
              }}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              ยืนยันขออนุมัติราคา
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Drawer for รออนุมัติราคา tab */}
      <Sheet open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <SheetContent side="right" className="w-3/4 max-w-none sm:max-w-none overflow-y-auto scrollbar-littleboy p-6">
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-blue-700">
              <FileText className="w-5 h-5" />
              สรุปข้อมูลอนุมัติราคา
            </SheetTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={async () => {
                if (summaryContentRef.current) {
                  try {
                    await waitForImagesToLoad(summaryContentRef.current);
                    const canvas = await html2canvas(summaryContentRef.current, {
                      backgroundColor: "#ffffff",
                      scale: 2,
                      useCORS: true,
                    });
                    canvas.toBlob(async (blob) => {
                      if (blob) {
                        try {
                          await navigator.clipboard.write([
                            new ClipboardItem({ "image/png": blob }),
                          ]);
                          toast.success("คัดลอกเป็นรูปภาพแล้ว");
                        } catch (err) {
                          // Fallback: download as file
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `quotation-summary-${summaryQuotation?.jobCode || "export"}.png`;
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success("ดาวน์โหลดรูปภาพแล้ว");
                        }
                      }
                    }, "image/png");
                  } catch (err) {
                    toast.error("เกิดข้อผิดพลาดในการคัดลอกรูปภาพ");
                  }
                }
              }}
            >
              <Image className="w-4 h-4" />
              คัดลอกเป็นรูปภาพ
            </Button>
          </SheetHeader>

          {summaryQuotation && (
            <div ref={summaryContentRef} className="space-y-6 bg-white p-4 rounded-lg">
              {/* Section 1: Product Details with JOB ID and Artwork */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-600 mb-4">รายละเอียดสินค้า</h3>

                {/* Main Layout: Artwork Left + Specs Right */}
                <div className="flex gap-4">
                  {/* Left Column: Artwork + JOB ID */}
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    {/* Artwork Image */}
                    <div className="w-32 h-32 border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                      <img
                        src={getPrimaryArtworkSource(summaryQuotation) || "/placeholder.svg"}
                        alt="Artwork"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    {/* JOB ID Badge */}
                    <div className="inline-flex items-center gap-1 bg-blue-100 px-2 py-1.5 rounded-lg">
                      <span className="text-xs text-blue-600">JOB ID:</span>
                      <span className="font-bold text-sm text-blue-700">{summaryQuotation.jobCode}</span>
                    </div>
                  </div>

                  {/* Right Column: 2x3 Specs Grid */}
                  <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-3">
                    {/* Row 1 */}
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">วัสดุ</p>
                      <p className="font-medium text-blue-700">{summaryQuotation.material}</p>
                    </div>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">ขนาด</p>
                      <p className="font-medium">{summaryQuotation.size}</p>
                    </div>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">ความหนา</p>
                      <p className="font-medium">{summaryQuotation.thickness}</p>
                    </div>
                    {/* Row 2 */}
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">สีชุบ</p>
                      <p className="font-medium">{getQuotationPlatingColorsText(summaryQuotation)}</p>
                    </div>
                    <div className="border rounded-lg p-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground">จำนวนรวม</p>
                      <p className="font-bold text-lg">{summaryQuotation.quantity.toLocaleString()} ชิ้น</p>
                    </div>
                    <div className="border rounded-lg p-3 bg-orange-50">
                      <p className="text-xs text-orange-600">จำนวนลาย</p>
                      <p className="font-semibold text-lg">{summaryQuotation.lanyardPatterns} ลาย</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Factory Comparison Table - Same as approval popup */}
              <div>
                <h3 className="text-sm font-semibold text-orange-600 mb-3">ตารางเปรียบเทียบโรงงาน</h3>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-center w-16">เลือก</TableHead>
                        <TableHead className="text-left">โรงงาน & รหัสงาน</TableHead>
                        <TableHead className="text-center bg-orange-50">
                          <div className="text-orange-600">ต้นทุนหยวน</div>
                          <div className="text-xs text-orange-500">(ทุน/หน่วย, ค่าโมล)</div>
                        </TableHead>
                        <TableHead className="text-center bg-cyan-50">
                          <div className="text-cyan-600">ต้นทุน/ชิ้น</div>
                          <div className="text-xs text-cyan-500">(THB)</div>
                        </TableHead>
                        <TableHead className="text-center bg-green-50">
                          <div className="text-green-600">ราคาขาย/ชิ้น</div>
                          <div className="text-xs text-green-500">(THB)</div>
                        </TableHead>
                        <TableHead className="text-center bg-amber-50">
                          <div className="text-amber-600">กำไร</div>
                          <div className="text-xs text-amber-500">(THB)</div>
                        </TableHead>
                        <TableHead className="text-center bg-purple-50">
                          <div className="text-purple-600">ค่าโมล(เพิ่ม</div>
                          <div className="text-xs text-purple-500">เติม) (THB)</div>
                        </TableHead>
                        <TableHead className="text-center">หลักฐาน</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summarySupplierEntries.map((entry, index) => (
                        <TableRow key={entry.id} className={summarySelectedFactory === entry.id ? "bg-green-50/50 ring-1 ring-green-300" : ""}>
                          <TableCell className="text-center">
                            <input
                              type="radio"
                              name="summaryFactorySelect"
                              checked={summarySelectedFactory === entry.id}
                              onChange={() => setSummarySelectedFactory(entry.id)}
                              className="w-4 h-4 accent-green-600 cursor-pointer"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-blue-700">{entry.factoryLabel || "ยังไม่ได้เลือก"}</span>
                                {(summarySelectedFactory === entry.id || (!summarySelectedFactory && entry.isWinner)) && (
                                  <Badge className="bg-green-500 hover:bg-green-500 text-white text-xs px-2 py-0.5">เลือก</Badge>
                                )}
                              </div>
                              <div className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded inline-block">
                                {generateJobCode(entry.factoryValue, index)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="bg-orange-50/30">
                            <div className="grid grid-cols-2 gap-2 text-center">
                              <div>
                                <div className="text-xs text-orange-600">ทุน/หน่วย</div>
                                <div className="font-medium">{entry.unitCost?.toFixed(2) || "0.00"}</div>
                              </div>
                              <div>
                                <div className="text-xs text-orange-600">ค่าโมล</div>
                                <div className="font-medium">{entry.moldCost?.toFixed(2) || "0.00"}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center bg-cyan-50/30">
                            <span className="font-bold text-cyan-700">
                              {entry.totalCostPerUnit?.toFixed(2) || "0.00"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center bg-green-50/30">
                            <span className="font-bold text-green-700">
                              {entry.totalSellingPricePerUnit?.toFixed(2) || "0.00"}
                            </span>
                          </TableCell>
                          <TableCell className={`text-center ${(entry.totalProfit || 0) >= 0 ? 'bg-amber-50/30' : 'bg-red-50/30'}`}>
                            <span className={`font-bold ${(entry.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {entry.totalProfit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center bg-purple-50/30">
                            <span className="font-medium">{entry.moldCostAdditionalTHB?.toFixed(2) || "0.00"}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {hasSupplierEvidence(entry) ? (
                              <div className="flex items-center justify-center gap-1">
                                <Upload className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600">มีไฟล์</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <Trash2 className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
            <Button variant="outline" onClick={() => { setShowSummaryDialog(false); setSummarySelectedFactory(null); }}>
              ปิด
            </Button>
            <Button
              disabled={!summarySelectedFactory}
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={async () => {
                if (summaryQuotation && summarySelectedFactory) {
                  const selectedEntry = summarySupplierEntries.find(e => e.id === summarySelectedFactory);
                  if (!selectedEntry) return;

                  try {
                    const headerForSummary = ((summaryQuotation as any)?.rawDetails?.globalHeader) || (globalHeader as any) || { quantity: summaryQuotation.quantity };
                    const updatedDetails = {
                      ...(summaryQuotation as any).rawDetails,
                      supplierEntries: serializeSupplierEntries(summarySupplierEntries),
                      globalHeader: headerForSummary,
                      winnerFactoryValue: selectedEntry.factoryValue,
                      factoryLabel: selectedEntry.factoryLabel,
                      estimationStarted: true
                    };

                    const payload = {
                      status: "เสนอราคา",
                      price: selectedEntry.totalSellingPricePerUnit * (headerForSummary.quantity || summaryQuotation.quantity),
                      details: updatedDetails
                    };

                    const res = await fetch(`${API_BASE}/price_estimations.php/${summaryQuotation.id}`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload)
                    });

                    if (!res.ok) throw new Error("Failed to approve");

                    setMockQuotations(prev => prev.map(q => {
                      if (q.id === summaryQuotation.id) {
                        return {
                          ...q,
                          status: "เสนอราคา" as QuotationStatus,
                          winnerFactoryValue: selectedEntry.factoryValue,
                          factory: selectedEntry.factoryValue,
                          factoryLabel: selectedEntry.factoryLabel,
                        };
                      }
                      return q;
                    }));

                    setShowSummaryDialog(false);
                    setSummarySelectedFactory(null);
                    toast.success(`อนุมัติราคาโรงงาน ${selectedEntry.factoryLabel} เรียบร้อย - สถานะเป็น 'เสนอราคา'`);
                    fetchQuotations();
                  } catch (err) {
                    console.error("Error approving from summary:", err);
                    toast.error("เกิดข้อผิดพลาดในการอนุมัติ");
                  }
                }
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              อนุมัติราคา & บันทึก
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Fullscreen Artwork Modal */}
      <Dialog open={isArtworkFullscreenOpen} onOpenChange={setIsArtworkFullscreenOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setIsArtworkFullscreenOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={sampleArtwork}
              alt="Artwork fullscreen"
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload History Dialog */}
      <Dialog open={isUploadHistoryOpen} onOpenChange={setIsUploadHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              ประวัติการอัพโหลดไฟล์
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ไฟล์</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>เวลาอัพโหลด</TableHead>
                  <TableHead>ผู้อัพโหลด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designFileHistory.map((file, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      {file.fileName}
                    </TableCell>
                    <TableCell>{new Date(file.uploadDate).toLocaleDateString('th-TH')}</TableCell>
                    <TableCell>{file.uploadTime}</TableCell>
                    <TableCell className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {file.uploadedBy}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadHistoryOpen(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Production Management Drawer */}
      <Sheet open={showProductionModal} onOpenChange={closeProductionModal}>
        <SheetContent side="right" className="w-3/4 max-w-none sm:max-w-none overflow-y-auto scrollbar-littleboy p-6">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <Factory className="w-6 h-6 text-blue-600" />
              จัดการรายการสั่งผลิต
              {selectedProductionItem && (
                <Badge variant="outline" className="ml-2 font-mono">
                  {selectedProductionItem.jobCode}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {/* Workflow Stepper Bar */}
          {selectedProductionItem && (() => {
            // Determine active step index based on activeWorkflowStep
            const productionSteps = WORKFLOW_STEPS.filter(s => s.key !== "all");
            const activeIdx = productionSteps.findIndex(s => s.key === activeWorkflowStep);
            // If "all" is selected, show no step as active (all pending)
            const currentIdx = activeWorkflowStep === "all" ? -1 : activeIdx;

            return (
              <div className="bg-white rounded-lg border p-4 -mx-6 mx-0">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Factory className="w-4 h-4 text-primary" />
                  แถบสถานะการผลิต (Production Progress)
                </h3>

                {/* Stepper */}
                <div className="flex items-start relative overflow-x-auto pb-2">
                  {productionSteps.map((step, index) => {
                    const isCompleted = currentIdx > index;
                    const isActive = currentIdx === index;
                    const isPending = currentIdx < index || currentIdx === -1;

                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center relative z-10 flex-1 min-w-[72px] cursor-pointer group"
                        onClick={() => setActiveWorkflowStep(step.key)}
                      >
                        {/* Connector line (before this step) */}
                        {index > 0 && (
                          <div
                            className={cn(
                              "absolute top-4 right-1/2 w-full h-0.5",
                              isCompleted || isActive ? "bg-green-400" : "bg-muted"
                            )}
                            style={{ zIndex: -1 }}
                          />
                        )}

                        {/* Circle */}
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs font-bold",
                            isCompleted && "bg-green-500 border-green-500 text-white",
                            isActive && "bg-amber-500 border-amber-500 text-white animate-pulse",
                            isPending && "bg-muted border-muted-foreground/30 text-muted-foreground",
                            "group-hover:scale-110"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>

                        {/* Label */}
                        <span
                          className={cn(
                            "text-[10px] mt-1.5 text-center font-medium leading-tight max-w-[80px]",
                            isCompleted && "text-green-600",
                            isActive && "text-amber-600 font-semibold",
                            isPending && "text-muted-foreground"
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Current status detail */}
                <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">สถานะปัจจุบัน:</span>
                  <span className="font-semibold text-amber-600">
                    {activeWorkflowStep === "all" ? "ทั้งหมด" : productionSteps.find(s => s.key === activeWorkflowStep)?.label || "-"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-xs h-6 px-2 text-muted-foreground hover:text-primary"
                    onClick={() => setActiveWorkflowStep("all")}
                  >
                    ดูทั้งหมด
                  </Button>
                </div>
              </div>
            );
          })()}

          {selectedProductionItem && (
            <div className="space-y-6">
              {/* Section 1: Job Details from Sales (Read-only) - เหมือนกับ จัดการคำขอประเมินราคา */}
              <Card className="border-2 border-blue-200 bg-blue-50/30">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <FileImage className="w-5 h-5" />
                    รายละเอียดงาน
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">JOB ID</p>
                      <p className="font-mono font-semibold text-primary">{selectedProductionItem.jobCode}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ชื่องาน</p>
                      <p className="font-medium">{selectedProductionItem.jobName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ลูกค้า</p>
                      <p className="font-medium">{selectedProductionItem.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">พนักงานขาย</p>
                      <p className="font-medium">{selectedProductionItem.salesPerson}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Product Specs - Material */}
                  <div>
                    <p className="text-sm text-muted-foreground">วัสดุ</p>
                    <p className="font-medium">{selectedProductionItem.material}</p>
                  </div>

                  <Separator />

                  {/* รายละเอียดสำหรับประเมินราคา - Sales Style Table Layout */}
                  <div>
                    <h4 className="font-semibold text-primary mb-4">รายละเอียดสำหรับประเมินราคา</h4>

                    {/* Size and Thickness */}
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">ขนาด</p>
                        <p className="font-medium">{selectedProductionItem.size}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">ความหนา</p>
                        <p className="font-medium">{selectedProductionItem.thickness}</p>
                      </div>
                    </div>

                    {/* Colors with Plating Type */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">สีชุบ (Plating Colors)</p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedProductionItem.colors.map((color, idx) => (
                          <Badge key={idx} variant="outline" className="text-sm bg-blue-50 border-blue-200">
                            {translateColors([color])}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Colors and Quantity Table */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">สีและจำนวน</p>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="text-left">สีชุบ</TableHead>
                              <TableHead className="text-right">จำนวน</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedProductionItem.colors.map((color, idx) => {
                              const colorQuantities: Record<string, number> = {
                                "shinny gold (สีทองเงา)": Math.ceil(selectedProductionItem.quantity * 0.22),
                                "shinny silver (สีเงินเงา)": Math.ceil(selectedProductionItem.quantity * 0.44),
                                "shinny copper (สีทองแดงเงา)": Math.ceil(selectedProductionItem.quantity * 0.34),
                              };
                              const qty = colorQuantities[color] || Math.ceil(selectedProductionItem.quantity / selectedProductionItem.colors.length);
                              return (
                                <TableRow key={idx}>
                                  <TableCell>{translateColors([color])}</TableCell>
                                  <TableCell className="text-right">{qty.toLocaleString()} ชิ้น</TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow className="bg-muted/30 font-medium">
                              <TableCell>รวม</TableCell>
                              <TableCell className="text-right font-semibold">{selectedProductionItem.quantity.toLocaleString()} ชิ้น</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Front Details */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">รายละเอียดด้านหน้า</p>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-2 flex-wrap">
                          {selectedProductionItem.frontDetails?.split(", ").map((detail, idx) => (
                            <Badge key={idx} variant="outline" className="text-sm">{detail}</Badge>
                          )) || <span className="text-muted-foreground">-</span>}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 h-7 text-xs"
                          onClick={() => setFrontOtherOpen(o => !o)}
                        >
                          อื่นๆ
                        </Button>
                      </div>
                      {frontOtherOpen && (
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            value={frontOtherText}
                            onChange={(e) => setFrontOtherText(e.target.value)}
                            placeholder="พิมพ์รายละเอียดด้านหน้าเพิ่มเติม..."
                            className="h-8"
                          />
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              if (!frontOtherText.trim() || !selectedProductionItem) return;
                              const add = frontOtherText.trim();
                              const current = selectedProductionItem.frontDetails || "";
                              const next = current ? `${current}, ${add}` : add;
                              setSelectedProductionItem({ ...selectedProductionItem, frontDetails: next });
                              setFrontOtherText("");
                              setFrontOtherOpen(false);
                              toast.success("เพิ่มรายละเอียดด้านหน้าแล้ว");
                            }}
                          >
                            เพิ่ม
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Back Details */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">รายละเอียดด้านหลัง</p>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-2 flex-wrap">
                          {selectedProductionItem.backDetails?.split(", ").map((detail, idx) => (
                            <Badge key={idx} variant="outline" className="text-sm">{detail}</Badge>
                          )) || <span className="text-muted-foreground">-</span>}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="shrink-0 h-7 text-xs"
                          onClick={() => setBackOtherOpen(o => !o)}
                        >
                          อื่นๆ
                        </Button>
                      </div>
                      {backOtherOpen && (
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            value={backOtherText}
                            onChange={(e) => setBackOtherText(e.target.value)}
                            placeholder="พิมพ์รายละเอียดด้านหลังเพิ่มเติม..."
                            className="h-8"
                          />
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              if (!backOtherText.trim() || !selectedProductionItem) return;
                              const add = backOtherText.trim();
                              const current = selectedProductionItem.backDetails || "";
                              const next = current ? `${current}, ${add}` : add;
                              setSelectedProductionItem({ ...selectedProductionItem, backDetails: next });
                              setBackOtherText("");
                              setBackOtherOpen(false);
                              toast.success("เพิ่มรายละเอียดด้านหลังแล้ว");
                            }}
                          >
                            เพิ่ม
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Lanyard */}
                    <div className="grid grid-cols-2 gap-8 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">ขนาดสายคล้องคอ</p>
                        <p className="font-medium">{selectedProductionItem.lanyardSize.replace("x", " × ")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">จำนวนลาย</p>
                        <p className="font-medium">{selectedProductionItem.lanyardPatterns} ลาย</p>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Customer Budget */}
                    <div>
                      <p className="text-sm text-muted-foreground">งบประมาณต่อชิ้น</p>
                      <p className="font-semibold text-xl text-destructive">{selectedProductionItem.customerBudget.toLocaleString()} บาท</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Deadline */}
                  <div>
                    <p className="text-sm text-muted-foreground">วันที่ต้องส่งมอบ</p>
                    <div>{getDeadlineDisplay(selectedProductionItem.eventDate)}</div>
                  </div>

                  {/* Artwork Section */}
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-3 font-medium">ข้อมูล Artwork</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-muted-foreground">รูป Artwork</p>
                          {selectedProductionItem.artworkImages.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const currentImage = selectedProductionItem.artworkImages[0];
                                downloadArtwork(currentImage, 0);
                              }}
                              className="gap-1.5 h-7 text-xs"
                            >
                              <Download className="h-3 w-3" />
                              บันทึกรูป
                            </Button>
                          )}
                        </div>
                        {selectedProductionItem.artworkImages.length > 0 ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedQuotation(selectedProductionItem);
                                setSelectedArtworkIndex(0);
                                setIsArtworkFullscreenOpen(true);
                              }}
                              className="w-full bg-muted rounded-lg p-4 flex items-center justify-center min-h-[200px] max-h-[300px] cursor-zoom-in hover:bg-muted/80 transition-colors relative group"
                            >
                              <img
                                src={selectedProductionItem.artworkImages[0] || sampleArtwork}
                                alt={`Artwork preview`}
                                className="max-w-full max-h-[260px] object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = sampleArtwork;
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-3 py-1.5 rounded-full text-sm">
                                  คลิกเพื่อขยาย
                                </div>
                              </div>
                            </button>
                            <p className="text-xs text-muted-foreground text-center mt-2">คลิกที่รูปเพื่อขยายเต็มจอ</p>
                          </>
                        ) : (
                          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center min-h-[150px] bg-muted/30">
                            <FileImage className="h-10 w-10 text-muted-foreground/50 mb-2" />
                            <p className="text-muted-foreground text-sm">ไม่มีรูป Artwork</p>
                          </div>
                        )}
                      </div>

                      {/* Design Files Section */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">ไฟล์งานออกแบบ</p>
                        {latestDesignFile ? (
                          <div className="bg-muted/50 rounded-lg p-4 border">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{latestDesignFile.fileName}</p>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span>{new Date(latestDesignFile.uploadDate).toLocaleDateString('th-TH')} {latestDesignFile.uploadTime}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {latestDesignFile.uploadedBy}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsUploadHistoryOpen(true)}
                                className="gap-1.5"
                              >
                                <History className="h-4 w-4" />
                                ประวัติการอัพโหลด
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30">
                            <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                            <p className="text-muted-foreground text-sm">ยังไม่มีไฟล์งานออกแบบ</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedProductionItem.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">หมายเหตุจากเซลล์</p>
                        <p className="font-medium bg-yellow-50 p-3 rounded-lg border border-yellow-200">{selectedProductionItem.notes}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>


              {/* Winner Factory Summary Card */}
              <Card className="border-2 border-green-300 bg-green-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-700 text-base">
                    ข้อมูลโรงงานที่สั่งผลิต
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">โรงงาน</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-semibold text-green-700 text-lg">{selectedProductionItem.factoryLabel}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">จำนวนรวม</p>
                      <p className="font-semibold text-lg">{selectedProductionItem.quantity.toLocaleString()} ชิ้น</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ราคาขายรวม</p>
                      <p className="font-bold text-green-600 text-xl">{selectedProductionItem.totalSellingPrice.toLocaleString()} บาท</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">กำไรประมาณการ</p>
                      <p className="font-semibold text-blue-600 text-lg">{selectedProductionItem.profit.toLocaleString()} บาท</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 2: Order & Shipping Details - Editable by Procurement */}
              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-primary text-base">
                    <Calculator className="w-5 h-5" />
                    ข้อมูลออเดอร์และการจัดส่ง
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Row 1: ผู้สั่งงาน & ใบสั่งซื้อ (PO) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prod-orderer">ผู้สั่งงาน</Label>
                      <Input
                        id="prod-orderer"
                        placeholder="ระบุชื่อผู้สั่งงาน"
                        value={prodOrderer}
                        onChange={(e) => setProdOrderer(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prod-po">ใบสั่งซื้อ (PO)</Label>
                      <Input
                        id="prod-po"
                        placeholder="ระบุเลขที่ใบสั่งซื้อ"
                        value={prodPo}
                        onChange={(e) => setProdPo(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Row 2: วันที่จัดส่งออก & จำนวนแยก */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prod-shipdate">วันที่จัดส่งออก</Label>
                      <Input
                        id="prod-shipdate"
                        type="date"
                        value={prodShipDate}
                        onChange={(e) => setProdShipDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prod-split">จำนวนแยก (ถ้ามี)</Label>
                      <Input
                        id="prod-split"
                        placeholder="ระบุจำนวนแยก เช่น 3 ล็อต"
                        value={prodSplit}
                        onChange={(e) => setProdSplit(e.target.value)}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* สรุปการเงิน */}
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-3">สรุปการเงิน</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prod-totalsales">รวมยอดขาย (THB)</Label>
                        <Input
                          id="prod-totalsales"
                          type="number"
                          placeholder="0"
                          value={prodTotalSales}
                          onChange={(e) => setProdTotalSales(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prod-vat">ภาษีมูลค่าเพิ่ม VAT (%)</Label>
                        <Input
                          id="prod-vat"
                          type="number"
                          value={prodVat}
                          onChange={(e) => setProdVat(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* รายละเอียดขนส่ง */}
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-3">รายละเอียดขนส่ง</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prod-channel">ช่องทางการจัดส่ง</Label>
                        <Select value={prodChannel} onValueChange={setProdChannel}>
                          <SelectTrigger id="prod-channel">
                            <SelectValue placeholder="เลือกช่องทาง" />
                          </SelectTrigger>
                          <SelectContent className="bg-popover">
                            <SelectItem value="EK">EK</SelectItem>
                            <SelectItem value="SEA">SEA</SelectItem>
                            <SelectItem value="AIR">AIR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prod-shipcost-rmb">ค่าขนส่ง (RMB)</Label>
                        <Input
                          id="prod-shipcost-rmb"
                          type="number"
                          placeholder="0.00"
                          value={prodShipCostRMB}
                          onChange={(e) => setProdShipCostRMB(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="prod-exchange">อัตราแลกเปลี่ยน (EXC)</Label>
                        <Input
                          id="prod-exchange"
                          type="number"
                          step="0.01"
                          value={prodExchange}
                          onChange={(e) => setProdExchange(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prod-shipcost-thb">ค่าขนส่ง (THB)</Label>
                        <div className="relative">
                          <Input
                            id="prod-shipcost-thb"
                            type="number"
                            placeholder="0.00"
                            readOnly
                            value={(parseFloat(prodShipCostRMB || "0") * parseFloat(prodExchange || "5.5")).toFixed(2)}
                            className="bg-muted pr-24"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            คำนวณอัตโนมัติ
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section 3: Status Update (QC, Shipping, Logistics) */}
              <ProcurementStatusUpdate orderId={selectedProductionItem.jobCode} filterStep={activeWorkflowStep} />

            </div>
          )}

          {/* Hidden Printable PDF Section */}
          {selectedProductionItem && (
            <div
              ref={orderPrintRef}
              style={{ display: "none", width: "800px", padding: "40px", backgroundColor: "#fff", color: "#000" }}
              className="font-sans absolute -z-50 box-border"
            >
              <div className="text-center mb-8 border-b-2 border-black pb-4">
                <h1 className="text-2xl font-bold mb-2">ใบสั่งงาน (PRODUCTION ORDER)</h1>
                <p className="text-gray-600">รหัสงาน (JOB ID): <strong>{selectedProductionItem.jobCode}</strong></p>
                <p className="text-gray-600">ชื่องาน: <strong>{selectedProductionItem.jobName}</strong></p>
              </div>

              <div className="flex gap-4 mb-6 text-sm">
                <div className="flex-1 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-bold border-b pb-2 mb-2">ข้อมูลออเดอร์</h3>
                  <p><strong>ผู้สั่งงาน:</strong> {prodOrderer || "-"}</p>
                  <p><strong>PO Number:</strong> {prodPo || "-"}</p>
                  <p><strong>วันจัดส่งสินค้า:</strong> {prodShipDate ? new Date(prodShipDate).toLocaleDateString('th-TH') : "-"}</p>
                  <p><strong>ล็อต/แยก:</strong> {prodSplit || "-"}</p>
                </div>
                <div className="flex-1 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-bold border-b pb-2 mb-2">ข้อมูลการเงิน & จัดส่ง</h3>
                  <p><strong>ยอดขาย:</strong> {parseFloat(prodTotalSales || "0").toLocaleString()} บาท (VAT {prodVat}%)</p>
                  <p><strong>ต้นทุนการผลิต:</strong> {selectedProductionItem.totalSellingPrice.toLocaleString()} บาท</p>
                  <p><strong>ช่องทางจัดส่ง:</strong> {prodChannel}</p>
                  <p><strong>ค่าขนส่งจีน:</strong> {prodShipCostRMB || "0"} RMB</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg mb-6 text-sm">
                <h3 className="font-bold border-b pb-2 mb-4">สเปกสินค้า (Product Specs)</h3>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <p><strong>โรงงานผลิต:</strong> {selectedProductionItem.factoryLabel}</p>
                  <p><strong>จำนวนสั่งผลิต:</strong> {selectedProductionItem.quantity.toLocaleString()} ชิ้น</p>
                  <p><strong>วัสดุ:</strong> {selectedProductionItem.material}</p>
                  <p><strong>ขนาด:</strong> {selectedProductionItem.size}</p>
                  <p><strong>ความหนา:</strong> {selectedProductionItem.thickness}</p>
                  <p><strong>สี/การชุบ:</strong> {translateColors(selectedProductionItem.colors)}</p>
                  <p><strong>ด้านหน้า:</strong> {selectedProductionItem.frontDetails || "-"}</p>
                  <p><strong>ด้านหลัง:</strong> {selectedProductionItem.backDetails || "-"}</p>
                  <p><strong>สายคล้อง:</strong> {selectedProductionItem.lanyardSize} ({selectedProductionItem.lanyardPatterns} แบบ)</p>
                </div>
                {selectedProductionItem.notes && (
                  <p className="mt-4 pt-2 border-t"><strong>หมายเหตุเพิ่มเติม:</strong> {selectedProductionItem.notes}</p>
                )}
              </div>

              <div className="text-xs text-center text-gray-500 mt-12">
                เอกสารสร้างเมื่อ: {new Date().toLocaleString("th-TH")}
              </div>
            </div>
          )}

          <SheetFooter className="flex justify-end gap-3 pb-8">
            <Button variant="secondary" onClick={generateProductionOrderPDF} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Download className="w-4 h-4" />
              สร้างใบสั่งงาน (PDF)
            </Button>
            <Button variant="outline" onClick={closeProductionModal}>
              ปิด
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Quotation;
