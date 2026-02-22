import { useState, useRef, useMemo } from "react";
import { format, startOfDay, endOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import html2canvas from "html2canvas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Calculator, Plus, Trash2, Settings, Clock, FileCheck, CheckCircle2, Search, AlertCircle, Inbox, RotateCcw, FileImage, Paperclip, AlertTriangle, CheckCircle, X, History, User, FileText, Save, Pencil, Trophy, Copy, ChevronDown, ChevronUp, Package, Factory, Image } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import sampleArtwork from "@/assets/sample-artwork.png";
import sampleArtworkMedal from "@/assets/sample-artwork-medal.png";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
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
}

const Quotation = () => {
  const navigate = useNavigate();
  const [factoriesList, setFactoriesList] = useState<FactoryQuotation[]>([]);
  const [currentFactoryId, setCurrentFactoryId] = useState<string | null>(null);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<MockQuotation | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [productTypeFilter, setProductTypeFilter] = useState<ProductType | "all">("all");
  
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

  // Mock data for existing quotations with extended details
  const [mockQuotations, setMockQuotations] = useState<MockQuotation[]>([
    {
      id: 1,
      jobCode: "JOB-2024-001",
      jobName: "งานวิ่ง Bangkok Marathon 2024",
      customerName: "สมาคมกีฬากรุงเทพมหานคร",
      factory: "",
      factoryLabel: "-",
      createdDate: "2024-01-15",
      eventDate: "2025-01-16",
      quantity: 5000,
      totalCost: 0,
      totalSellingPrice: 0,
      profit: 0,
      status: "ยื่นคำขอประเมิน",
      salesPerson: "พนักงานขาย A",
      productType: "custom",
      material: "ซิงค์อัลลอย",
      size: "5 ซม.",
      thickness: "4 มิล",
      colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)", "shinny copper (สีทองแดงเงา)"],
      frontDetails: "พิมพ์โลโก้, ลงสีสเปรย์, ลงน้ำยาป้องกันสนิม, ขัดเงา",
      backDetails: "แกะสลักข้อความ, ปั๊มลาย",
      lanyardSize: "90x2.5 ซม.",
      lanyardPatterns: 3,
      customerBudget: 45,
      designFiles: ["design_marathon_2024.ai"],
      artworkImages: [sampleArtworkMedal],
      notes: "ต้องการส่งมอบก่อนวันงาน 7 วัน",
      rejectionLogs: []
    },
    {
      id: 2,
      jobCode: "JOB-2024-002",
      jobName: "รางวัลพนักงานดีเด่น Quarter 1",
      customerName: "บริษัท ไทยออยล์ จำกัด (มหาชน)",
      factory: "china_linda",
      factoryLabel: "China LINDA",
      createdDate: "2024-01-16",
      eventDate: "2025-01-18",
      quantity: 150,
      totalCost: 16000,
      totalSellingPrice: 17500,
      profit: 1500,
      status: "เสนอราคา",
      salesPerson: "พนักงานขาย B",
      productType: "custom",
      material: "ซิงค์อัลลอย",
      size: "6 ซม.",
      thickness: "5 มิล",
      colors: ["shinny gold (สีทองเงา)"],
      frontDetails: "พิมพ์โลโก้, แกะสลักข้อความ, ขัดเงา",
      backDetails: "พิมพ์โลโก้, แกะสลักข้อความ",
      lanyardSize: "90x3 ซม.",
      lanyardPatterns: 1,
      customerBudget: 120,
      designFiles: ["thaioil_employee_award.pdf"],
      artworkImages: [sampleArtworkMedal],
      notes: "ต้องมีกล่องใส่เหรียญด้วย",
      rejectionLogs: []
    },
    {
      id: 3,
      jobCode: "JOB-2024-003",
      jobName: "เหรียญที่ระลึกครบรอบ 20 ปี บริษัท ABC",
      customerName: "บริษัท ABC จำกัด",
      factory: "china_pn",
      factoryLabel: "China PN",
      createdDate: "2024-01-17",
      eventDate: "2025-01-28",
      quantity: 500,
      totalCost: 18750,
      totalSellingPrice: 21000,
      profit: 2250,
      status: "เสนอลูกค้า",
      customerConfirmed: true,
      salesPerson: "พนักงานขาย A",
      productType: "custom",
      material: "ซิงค์อัลลอย",
      size: "7 ซม.",
      thickness: "4 มิล",
      colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)"],
      frontDetails: "พิมพ์โลโก้, ลงน้ำยาป้องกันสนิม, พิมพ์ซิลค์สกรีน, ขัดเงา, แกะลึก",
      backDetails: "แกะสลักข้อความ, ปั๊มลาย",
      lanyardSize: "90x2.5 ซม.",
      lanyardPatterns: 2,
      customerBudget: 50,
      designFiles: [],
      artworkImages: [],
      notes: "",
      winnerFactoryValue: "china_pn",
      rejectionLogs: []
    },
    {
      id: 4,
      jobCode: "JOB-2024-004",
      jobName: "การแข่งขันฟุตบอลเยาวชนแห่งชาติ",
      customerName: "การกีฬาแห่งประเทศไทย",
      factory: "",
      factoryLabel: "-",
      createdDate: "2024-01-18",
      eventDate: "2025-01-15",
      quantity: 3000,
      totalCost: 0,
      totalSellingPrice: 0,
      profit: 0,
      status: "อยู่ระหว่างการประเมินราคา",
      salesPerson: "พนักงานขาย C",
      productType: "custom",
      material: "ซิงค์อัลลอย",
      size: "5 ซม.",
      thickness: "4 มิล",
      colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)", "shinny copper (สีทองแดงเงา)"],
      frontDetails: "พิมพ์โลโก้, ลงสีสเปรย์, ขัดเงา",
      backDetails: "-",
      lanyardSize: "90x2.5 ซม.",
      lanyardPatterns: 1,
      customerBudget: 35,
      designFiles: [],
      artworkImages: [],
      notes: "รอไฟล์ออกแบบจากลูกค้า",
      rejectionLogs: [
        {
          rejectedAt: "2024-01-19T10:30:00",
          rejectedBy: "จัดซื้อ สมชาย",
          reason: "ไม่มีไฟล์ออกแบบแนบมา และไม่ได้ระบุรายละเอียดด้านหลังเหรียญ"
        }
      ],
      // Multi-option quote data
      selectedSizes: ["5 ซม.", "6 ซม."],
      selectedThicknesses: ["3 มิล", "4 มิล"],
      quantitySets: [
        {
          setName: "A",
          quantities: [
            { color: "shinny gold (สีทองเงา)", quantity: 400 },
            { color: "shinny silver (สีเงินเงา)", quantity: 400 },
            { color: "shinny copper (สีทองแดงเงา)", quantity: 200 }
          ],
          total: 1000
        },
        {
          setName: "B",
          quantities: [
            { color: "shinny gold (สีทองเงา)", quantity: 800 },
            { color: "shinny silver (สีเงินเงา)", quantity: 800 },
            { color: "shinny copper (สีทองแดงเงา)", quantity: 400 }
          ],
          total: 2000
        },
        {
          setName: "C",
          quantities: [
            { color: "shinny gold (สีทองเงา)", quantity: 1200 },
            { color: "shinny silver (สีเงินเงา)", quantity: 1200 },
            { color: "shinny copper (สีทองแดงเงา)", quantity: 600 }
          ],
          total: 3000
        }
      ],
      estimationOptions: [
        "Option 1: ขนาด 5 ซม. หนา 3 มิล",
        "Option 2: ขนาด 5 ซม. หนา 4 มิล",
        "Option 3: ขนาด 6 ซม. หนา 3 มิล",
        "Option 4: ขนาด 6 ซม. หนา 4 มิล"
      ]
    },
    {
      id: 5,
      jobCode: "JOB-2024-005",
      jobName: "เหรียญรางวัลการแข่งขันว่ายน้ำ SEA Games",
      customerName: "คณะกรรมการโอลิมปิคแห่งประเทศไทย",
      factory: "china_bc",
      factoryLabel: "China B&C",
      createdDate: "2024-01-10",
      eventDate: "2025-01-20",
      quantity: 800,
      totalCost: 48000,
      totalSellingPrice: 64000,
      profit: 16000,
      status: "ยื่นคำขอประเมิน",
      salesPerson: "พนักงานขาย A",
      productType: "custom",
      material: "ซิงค์อัลลอย",
      size: "8 ซม.",
      thickness: "5 มิล",
      colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)", "shinny copper (สีทองแดงเงา)"],
      frontDetails: "พิมพ์โลโก้, ลงสีสเปรย์, ลงน้ำยาป้องกันสนิม, พิมพ์ซิลค์สกรีน, ขัดเงา, แกะลึก, ปั๊มลาย",
      backDetails: "พิมพ์โลโก้, แกะสลักข้อความ, ขัดเงา",
      lanyardSize: "90x3 ซม.",
      lanyardPatterns: 3,
      customerBudget: 80,
      designFiles: ["seagames_design.ai"],
      artworkImages: [sampleArtworkMedal],
      notes: "งานสำคัญระดับประเทศ",
      rejectionLogs: []
    },
    {
      id: 6,
      jobCode: "JOB-2024-006",
      jobName: "งานปั่นจักรยานการกุศล Tour de Thailand",
      customerName: "สมาคมจักรยานแห่งประเทศไทย",
      factory: "",
      factoryLabel: "-",
      createdDate: "2024-01-12",
      eventDate: "2025-02-01",
      quantity: 2000,
      totalCost: 0,
      totalSellingPrice: 0,
      profit: 0,
      status: "ยื่นคำขอประเมิน",
      salesPerson: "พนักงานขาย B",
      productType: "custom",
      material: "ซิงค์อัลลอย",
      size: "6 ซม.",
      thickness: "4 มิล",
      colors: ["shinny silver (สีเงินเงา)"],
      frontDetails: "พิมพ์โลโก้, ลงน้ำยาป้องกันสนิม, ขัดเงา",
      backDetails: "แกะสลักข้อความ",
      lanyardSize: "90x2.5 ซม.",
      lanyardPatterns: 2,
      customerBudget: 40,
      designFiles: ["tour_design.pdf"],
      artworkImages: [],
      notes: "",
      rejectionLogs: []
    },
    {
      id: 7,
      jobCode: "JOB-2024-007",
      jobName: "เหรียญเชิดชูเกียรติผู้เกษียณอายุ ปี 2567",
      customerName: "กระทรวงมหาดไทย",
      factory: "china_zj",
      factoryLabel: "China ZJ",
      createdDate: "2024-01-08",
      eventDate: "2025-01-17",
      quantity: 250,
      totalCost: 22500,
      totalSellingPrice: 30000,
      profit: 7500,
      status: "เสนอราคา",
      salesPerson: "พนักงานขาย C",
      productType: "custom",
      material: "ซิงค์อัลลอย",
      size: "7 ซม.",
      thickness: "5 มิล",
      colors: ["shinny gold (สีทองเงา)"],
      frontDetails: "พิมพ์โลโก้, ลงสีสเปรย์, พิมพ์ซิลค์สกรีน, แกะลึก, ปั๊มลาย",
      backDetails: "แกะสลักข้อความ, ขัดเงา, แกะลึก",
      lanyardSize: "90x3 ซม.",
      lanyardPatterns: 1,
      customerBudget: 150,
      designFiles: [],
      artworkImages: [],
      notes: "ต้องมีกล่องกำมะหยี่",
      rejectionLogs: []
    },
    {
      id: 8,
      jobCode: "JOB-2024-008",
      jobName: "เหรียญรางวัลนักเรียนเรียนดี ปีการศึกษา 2567",
      customerName: "โรงเรียนเตรียมอุดมศึกษา",
      factory: "china_xiaoli",
      factoryLabel: "China Xiaoli",
      createdDate: "2024-01-19",
      eventDate: "2025-02-15",
      quantity: 1200,
      totalCost: 36000,
      totalSellingPrice: 48000,
      profit: 12000,
      status: "ยืนยันเรียบร้อย",
      salesPerson: "พนักงานขาย A",
      productType: "custom",
      material: "ซิงค์อัลลอย",
      size: "5 ซม.",
      thickness: "4 มิล",
      colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)", "shinny copper (สีทองแดงเงา)"],
      frontDetails: "ตราโรงเรียน",
      backDetails: "ปีการศึกษา 2567",
      lanyardSize: "90x2.5 ซม.",
      lanyardPatterns: 3,
      customerBudget: 40,
      designFiles: [],
      artworkImages: [],
      notes: "",
      winnerFactoryValue: "china_xiaoli",
      rejectionLogs: []
    },
    {
      id: 9,
      jobCode: "JOB-2024-009",
      jobName: "งานวิ่งมินิมาราธอน อสมท.",
      customerName: "บมจ. อสมท",
      factory: "",
      factoryLabel: "-",
      createdDate: "2024-01-20",
      eventDate: "2025-01-25",
      quantity: 3500,
      totalCost: 0,
      totalSellingPrice: 0,
      profit: 0,
      status: "อยู่ระหว่างการประเมินราคา",
      salesPerson: "พนักงานขาย B",
      productType: "custom",
      material: "ซิงค์อัลลอย",
      size: "5 ซม.",
      thickness: "4 มิล",
      colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)"],
      frontDetails: "โลโก้ อสมท",
      backDetails: "-",
      lanyardSize: "90x2.5 ซม.",
      lanyardPatterns: 2,
      customerBudget: 35,
      designFiles: [],
      artworkImages: [],
      notes: "รอยืนยันจำนวนสีจากลูกค้า",
      rejectionLogs: [
        {
          rejectedAt: "2024-01-21T14:00:00",
          rejectedBy: "จัดซื้อ สมหญิง",
          reason: "จำนวนสีไม่ชัดเจน ต้องการ 2 หรือ 3 สี"
        }
      ],
      // Multi-option quote data
      selectedSizes: ["4 ซม.", "5 ซม.", "6 ซม."],
      selectedThicknesses: ["3 มิล", "4 มิล"],
      quantitySets: [
        {
          setName: "A",
          quantities: [
            { color: "shinny gold (สีทองเงา)", quantity: 500 },
            { color: "shinny silver (สีเงินเงา)", quantity: 500 }
          ],
          total: 1000
        },
        {
          setName: "B",
          quantities: [
            { color: "shinny gold (สีทองเงา)", quantity: 1500 },
            { color: "shinny silver (สีเงินเงา)", quantity: 1000 }
          ],
          total: 2500
        }
      ],
      estimationOptions: [
        "Option 1: ขนาด 4 ซม. หนา 3 มิล",
        "Option 2: ขนาด 4 ซม. หนา 4 มิล",
        "Option 3: ขนาด 5 ซม. หนา 3 มิล",
        "Option 4: ขนาด 5 ซม. หนา 4 มิล",
        "Option 5: ขนาด 6 ซม. หนา 3 มิล",
        "Option 6: ขนาด 6 ซม. หนา 4 มิล"
      ]
    },
    {
      id: 10,
      jobCode: "JOB-2024-010",
      jobName: "เหรียญที่ระลึกงานครบรอบ 50 ปี ธนาคารกรุงเทพ",
      customerName: "ธนาคารกรุงเทพ จำกัด (มหาชน)",
      factory: "china_benc",
      factoryLabel: "China BENC",
      createdDate: "2024-01-21",
      eventDate: "2025-03-01",
      quantity: 10000,
      totalCost: 450000,
      totalSellingPrice: 600000,
      profit: 150000,
      status: "เสนอลูกค้า",
      customerConfirmed: false,
      salesPerson: "พนักงานขาย C",
      productType: "custom",
      material: "ซิงค์อัลลอย",
      size: "8 ซม.",
      thickness: "6 มิล",
      colors: ["shinny gold (สีทองเงา)"],
      frontDetails: "ตราธนาคารครบรอบ 50 ปี",
      backDetails: "ประวัติธนาคารโดยย่อ",
      lanyardSize: "90x3 ซม.",
      lanyardPatterns: 1,
      customerBudget: 65,
      designFiles: ["bbl_50years.ai"],
      artworkImages: ["bbl_preview.jpg"],
      notes: "งานพรีเมี่ยม ต้องการคุณภาพสูง",
      winnerFactoryValue: "china_benc",
      rejectionLogs: []
    },
    // Production Order Items (รายการสั่งผลิต) - ข้อมูลจาก ประเมินเสร็จสิ้น ที่เซลล์ยืนยันราคาแล้ว
    // JOB-2024-003: เหรียญที่ระลึกครบรอบ 20 ปี บริษัท ABC - ย้ายมาจาก "ประเมินเสร็จสิ้น"
    {
      id: 11,
      jobCode: "JOB-2024-003",
      jobName: "เหรียญที่ระลึกครบรอบ 20 ปี บริษัท ABC",
      customerName: "บริษัท ABC จำกัด",
      factory: "china_pn",
      factoryLabel: "China PN",
      createdDate: "2024-01-17",
      eventDate: "2025-01-28",
      quantity: 500,
      totalCost: 18750,
      totalSellingPrice: 21000,
      profit: 2250,
      status: "รายการสั่งผลิต" as QuotationStatus,
      salesPerson: "พนักงานขาย A",
      productType: "custom" as ProductType,
      material: "ซิงค์อัลลอย",
      size: "7 ซม.",
      thickness: "4 มิล",
      colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)"],
      frontDetails: "พิมพ์โลโก้, ลงน้ำยาป้องกันสนิม, พิมพ์ซิลค์สกรีน, ขัดเงา, แกะลึก",
      backDetails: "แกะสลักข้อความ, ปั๊มลาย",
      lanyardSize: "90x2.5 ซม.",
      lanyardPatterns: 2,
      customerBudget: 50,
      designFiles: ["abc_20years.ai"],
      artworkImages: [sampleArtworkMedal],
      notes: "งานครบรอบ 20 ปี",
      winnerFactoryValue: "china_pn",
      productionStep: "เริ่มผลิต" as ProductionStep,
      productionStepHistory: [
        { step: "ออกใบ PO" as ProductionStep, updatedAt: "2024-01-20T09:00:00", updatedBy: "จัดซื้อ สมชาย" },
        { step: "จ่ายมัดจำแล้ว" as ProductionStep, updatedAt: "2024-01-21T14:30:00", updatedBy: "จัดซื้อ สมชาย" },
        { step: "เริ่มผลิต" as ProductionStep, updatedAt: "2024-01-23T10:00:00", updatedBy: "จัดซื้อ สมหญิง" },
      ],
      estimatedTotalCost: 18750,
      estimatedProfit: 2250,
      rejectionLogs: []
    },
    // JOB-2024-008: เหรียญรางวัลนักเรียนเรียนดี - ย้ายมาจาก "ประเมินเสร็จสิ้น"
    {
      id: 12,
      jobCode: "JOB-2024-008",
      jobName: "เหรียญรางวัลนักเรียนเรียนดี ปีการศึกษา 2567",
      customerName: "โรงเรียนเตรียมอุดมศึกษา",
      factory: "china_xiaoli",
      factoryLabel: "China Xiaoli",
      createdDate: "2024-01-19",
      eventDate: "2025-02-15",
      quantity: 1200,
      totalCost: 36000,
      totalSellingPrice: 48000,
      profit: 12000,
      status: "รายการสั่งผลิต" as QuotationStatus,
      salesPerson: "พนักงานขาย A",
      productType: "custom" as ProductType,
      material: "ซิงค์อัลลอย",
      size: "5 ซม.",
      thickness: "4 มิล",
      colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)", "shinny copper (สีทองแดงเงา)"],
      frontDetails: "ตราโรงเรียน",
      backDetails: "ปีการศึกษา 2567",
      lanyardSize: "90x2.5 ซม.",
      lanyardPatterns: 3,
      customerBudget: 40,
      designFiles: ["triamudom_award.ai"],
      artworkImages: [sampleArtworkMedal],
      notes: "เหรียญรางวัลนักเรียนดีเด่น",
      winnerFactoryValue: "china_xiaoli",
      productionStep: "จ่ายมัดจำแล้ว" as ProductionStep,
      productionStepHistory: [
        { step: "ออกใบ PO" as ProductionStep, updatedAt: "2024-01-22T11:00:00", updatedBy: "จัดซื้อ สมชาย" },
        { step: "จ่ายมัดจำแล้ว" as ProductionStep, updatedAt: "2024-01-24T09:00:00", updatedBy: "จัดซื้อ สมหญิง" },
      ],
      estimatedTotalCost: 36000,
      estimatedProfit: 12000,
      rejectionLogs: []
    },
    // JOB-2024-010: เหรียญที่ระลึกงานครบรอบ 50 ปี ธนาคารกรุงเทพ - ย้ายมาจาก "ประเมินเสร็จสิ้น"
    {
      id: 13,
      jobCode: "JOB-2024-010",
      jobName: "เหรียญที่ระลึกงานครบรอบ 50 ปี ธนาคารกรุงเทพ",
      customerName: "ธนาคารกรุงเทพ จำกัด (มหาชน)",
      factory: "china_benc",
      factoryLabel: "China BENC",
      createdDate: "2024-01-21",
      eventDate: "2025-03-01",
      quantity: 10000,
      totalCost: 450000,
      totalSellingPrice: 600000,
      profit: 150000,
      status: "รายการสั่งผลิต" as QuotationStatus,
      salesPerson: "พนักงานขาย C",
      productType: "custom" as ProductType,
      material: "ซิงค์อัลลอย",
      size: "8 ซม.",
      thickness: "6 มิล",
      colors: ["shinny gold (สีทองเงา)"],
      frontDetails: "ตราธนาคารครบรอบ 50 ปี",
      backDetails: "ประวัติธนาคารโดยย่อ",
      lanyardSize: "90x3 ซม.",
      lanyardPatterns: 1,
      customerBudget: 65,
      designFiles: ["bbl_50years.ai"],
      artworkImages: [sampleArtworkMedal],
      notes: "งานพรีเมี่ยม ต้องการคุณภาพสูง",
      winnerFactoryValue: "china_benc",
      productionStep: "ออกใบ PO" as ProductionStep,
      productionStepHistory: [
        { step: "ออกใบ PO" as ProductionStep, updatedAt: "2024-01-25T10:00:00", updatedBy: "จัดซื้อ สมชาย" },
      ],
      estimatedTotalCost: 450000,
      estimatedProfit: 150000,
      rejectionLogs: []
    },
  ]);

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
        return filtered.filter(q => q.status === "รายการสั่งผลิต");
      case "history":
        return filtered.filter(q => q.status === "ยืนยันเรียบร้อย" || q.status === "ยกเลิก");
      default:
        return filtered;
    }
  };

  // Count quotations by status
  const getStatusCount = (statuses: QuotationStatus[]) => {
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
      uploadedFile: null
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
  const handleSupplierFileUpload = (entryId: string, file: File | null) => {
    setSupplierEntries(prev => prev.map(entry => {
      if (entry.id === entryId) {
        return { ...entry, uploadedFile: file };
      }
      return entry;
    }));
    if (file) {
      toast.success(`อัพโหลดไฟล์ ${file.name} สำเร็จ`);
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
    setSelectedWinner(null);
    setSelectedFactories([]); // Reset factory selection
    setFactorySelectOpen(false);
    
    // Check if status requires read-only with mock data
    const isReadOnly = quotation.status === "เสนอลูกค้า";
    const isInProgress = quotation.status === "อยู่ระหว่างการประเมินราคา" || quotation.status === "เสนอราคา";
    setIsReadOnlyMode(isReadOnly);
    
    if (isReadOnly || isInProgress) {
      // Load mock saved estimation data for read-only or in-progress editing
      setEstimationStarted(true);
      setGlobalHeader({
        shippingCostRMB: 120,
        exchangeRate: 5.5,
        vat: 7,
        quantity: quotation.quantity || 800,
        unitSellingPriceTHB: 85,
        lanyardSellingPriceTHB: 15,
      });
      
      // Determine winner factory for completed status
      const winnerFactory = quotation.winnerFactoryValue;
      
      // Mock supplier entries for read-only display
      const mockSupplierData: FactoryEntry[] = [
        {
          id: "entry-1",
          factoryValue: "china_zj",
          factoryLabel: "China ZJ",
          unitCost: 12.5,
          moldCost: 800,
          moldCostAdditionalTHB: 0,
          shippingCost: 120,
          exchangeRate: 5.5,
          vat: 7,
          totalCostPerUnit: 0,
          sellingPricePerUnit: 85,
          sellingPriceLanyard: 15,
          totalSellingPricePerUnit: 0,
          totalProfit: 0,
          isWinner: winnerFactory === "china_zj",
          uploadedFile: null
        },
        {
          id: "entry-2",
          factoryValue: "china_xiaoli",
          factoryLabel: "China Xiaoli",
          unitCost: 11.8,
          moldCost: 750,
          moldCostAdditionalTHB: 0,
          shippingCost: 120,
          exchangeRate: 5.5,
          vat: 7,
          totalCostPerUnit: 0,
          sellingPricePerUnit: 85,
          sellingPriceLanyard: 15,
          totalSellingPricePerUnit: 0,
          totalProfit: 0,
          isWinner: winnerFactory === "china_xiaoli",
          uploadedFile: null
        },
        {
          id: "entry-3",
          factoryValue: "china_pn",
          factoryLabel: "China PN",
          unitCost: 13.2,
          moldCost: 900,
          moldCostAdditionalTHB: 0,
          shippingCost: 120,
          exchangeRate: 5.5,
          vat: 7,
          totalCostPerUnit: 0,
          sellingPricePerUnit: 85,
          sellingPriceLanyard: 15,
          totalSellingPricePerUnit: 0,
          totalProfit: 0,
          isWinner: winnerFactory === "china_pn",
          uploadedFile: null
        },
        {
          id: "entry-4",
          factoryValue: "china_benc",
          factoryLabel: "China BENC",
          unitCost: 10.5,
          moldCost: 700,
          moldCostAdditionalTHB: 0,
          shippingCost: 120,
          exchangeRate: 5.5,
          vat: 7,
          totalCostPerUnit: 0,
          sellingPricePerUnit: 85,
          sellingPriceLanyard: 15,
          totalSellingPricePerUnit: 0,
          totalProfit: 0,
          isWinner: winnerFactory === "china_benc",
          uploadedFile: null
        }
      ];
      // Calculate costs for each entry
      const calculatedEntries = mockSupplierData.map(entry => {
        const calculated = calculateSupplierCosts(entry, quotation.quantity, {
          shippingCostRMB: 120,
          exchangeRate: 5.5,
          vat: 7,
          quantity: quotation.quantity || 800,
          unitSellingPriceTHB: 85,
          lanyardSellingPriceTHB: 15,
        });
        return { ...entry, ...calculated };
      });
      setSupplierEntries(calculatedEntries);
      setSelectedFactories(["china_zj", "china_xiaoli", "china_pn", "china_benc"]);
      
      // Set selected winner if completed (เสนอลูกค้า)
      if (isReadOnly && winnerFactory) {
        const winnerEntry = calculatedEntries.find(e => e.factoryValue === winnerFactory);
        if (winnerEntry) {
          setSelectedWinner(winnerEntry.id);
        }
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

  // Close management modal
  const closeManagementModal = () => {
    setShowManagementModal(false);
    setSelectedQuotation(null);
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

  // Handle enable editing for read-only mode
  const handleEnableEditing = () => {
    setIsReadOnlyMode(false);
    toast.success("เปิดโหมดแก้ไข - สามารถแก้ไขข้อมูลได้แล้ว");
  };

  // Handle reject/return to sales
  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("กรุณาระบุเหตุผลในการตีกลับ");
      return;
    }

    if (selectedQuotation) {
      const rejectionLog = {
        rejectedAt: new Date().toISOString(),
        rejectedBy: "จัดซื้อ ผู้ใช้งาน", // In real app, get from auth
        reason: rejectReason
      };

      setMockQuotations(prev => prev.map(q => {
        if (q.id === selectedQuotation.id) {
          return {
            ...q,
            status: "ขอข้อมูลเพิ่มเติม" as QuotationStatus,
            rejectionLogs: [...q.rejectionLogs, rejectionLog]
          };
        }
        return q;
      }));

      toast.success("ตีกลับงานสำเร็จ - สถานะเปลี่ยนเป็น 'ขอข้อมูลเพิ่มเติม'");
      setShowRejectDialog(false);
      setRejectReason("");
      closeManagementModal();
    }
  };

  // Handle cancel job
  const handleCancel = () => {
    if (!cancelReason.trim()) {
      toast.error("กรุณาระบุเหตุผลในการยกเลิก");
      return;
    }

    if (selectedQuotation) {
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
    }
  };

  // Handle accept job - change status to "อยู่ระหว่างการประเมินราคา" and show estimation section
  const handleAcceptJob = (quotation?: MockQuotation) => {
    const targetQuotation = quotation || selectedQuotation;
    if (targetQuotation) {
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
    }
  };

  // Handle send price to sales - change status to "เสนอลูกค้า"
  const handleSendPriceToSales = () => {
    if (supplierEntries.length === 0) {
      toast.error("กรุณาเพิ่มข้อมูลโรงงานอย่างน้อย 1 โรงงาน");
      return;
    }
    if (selectedQuotation) {
      setMockQuotations(prev => prev.map(q => {
        if (q.id === selectedQuotation.id) {
          return {
            ...q,
            status: "เสนอลูกค้า" as QuotationStatus,
          };
        }
        return q;
      }));
      toast.success("ส่งราคาให้ฝ่ายขายสำเร็จ - สถานะเปลี่ยนเป็น 'เสนอลูกค้า'");
      closeManagementModal();
    }
  };

  // Handle send revised price to sales - change status to "เสนอลูกค้า"
  const handleSendRevisedPrice = () => {
    if (supplierEntries.length === 0) {
      toast.error("กรุณาเพิ่มข้อมูลโรงงานอย่างน้อย 1 โรงงาน");
      return;
    }
    if (selectedQuotation) {
      setMockQuotations(prev => prev.map(q => {
        if (q.id === selectedQuotation.id) {
          return {
            ...q,
            status: "เสนอลูกค้า" as QuotationStatus,
          };
        }
        return q;
      }));
      toast.success("ส่งราคาแก้ไขสำเร็จ - สถานะเปลี่ยนเป็น 'เสนอลูกค้า'");
      closeManagementModal();
    }
  };

  // Handle save estimation
  const handleSaveEstimation = () => {
    if (supplierEntries.length === 0) {
      toast.error("กรุณาเพิ่มข้อมูลโรงงานอย่างน้อย 1 โรงงาน");
      return;
    }

    toast.success("บันทึกข้อมูลสำเร็จ");
  };

  // Handle approve with selected winner
  const handleApproveWithWinner = () => {
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
      setMockQuotations(prev => prev.map(q => {
        if (q.id === selectedQuotation.id) {
          return {
            ...q,
            status: "ประเมินเสร็จสิ้น" as QuotationStatus,
            winnerFactoryValue: winnerEntry.factoryValue,
            factory: winnerEntry.factoryValue,
            factoryLabel: winnerEntry.factoryLabel,
          };
        }
        return q;
      }));

      toast.success(`อนุมัติราคาสำเร็จ - โรงงานผู้ชนะ: ${winnerEntry.factoryLabel}`);
      closeManagementModal();
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

    const artworkSrc = q.artworkImages?.[0] || sampleArtworkMedal;
    const jobCode = generateJobCode(entry.factoryValue, index);
    const quantity = globalHeader.quantity || q.quantity;

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
                <img src="${artworkSrc}" style="max-width:156px;max-height:140px;object-fit:contain;" crossorigin="anonymous" />
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
                <p style="font-size:11px;color:#9ca3af;margin:0 0 4px 0;">ชนิดการชุบ</p>
                <p style="font-size:13px;font-weight:600;color:#1f2937;margin:0;">${q.colors?.[0]?.includes('gold') ? 'Shiny Gold (เงา)' : q.colors?.[0]?.includes('silver') ? 'Shiny Silver (เงา)' : 'Shiny (เงา)'}</p>
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

        <!-- Factory Comparison Table -->
        <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:20px;">
          <h3 style="font-size:15px;font-weight:700;color:#374151;margin:0 0 16px 0;">ตารางเปรียบเทียบโรงงาน</h3>
          <table style="width:100%;border-collapse:separate;border-spacing:0;font-size:13px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            <thead>
              <tr>
                <th style="padding:12px 16px;text-align:left;background:#eff6ff;color:#1d4ed8;font-weight:600;font-size:12px;border-bottom:1px solid #e5e7eb;">โรงงาน</th>
                <th style="padding:12px 16px;text-align:right;background:#ecfdf5;color:#059669;font-weight:600;font-size:12px;border-bottom:1px solid #e5e7eb;">ทุนรวม (THB)</th>
                <th style="padding:12px 16px;text-align:right;background:#ecfdf5;color:#059669;font-weight:600;font-size:12px;border-bottom:1px solid #e5e7eb;">ราคาขายรวม (THB)</th>
                <th style="padding:12px 16px;text-align:right;background:#fefce8;color:#ca8a04;font-weight:600;font-size:12px;border-bottom:1px solid #e5e7eb;">กำไร (THB)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background:#ffffff;">
                <td style="padding:12px 16px;font-weight:600;color:#1f2937;">${entry.factoryLabel}</td>
                <td style="padding:12px 16px;text-align:right;font-weight:600;color:#1f2937;">${(entry.totalCostPerUnit * quantity).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
                <td style="padding:12px 16px;text-align:right;font-weight:600;color:#059669;">${(entry.totalSellingPricePerUnit * quantity).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</td>
                <td style="padding:12px 16px;text-align:right;font-weight:700;color:${(entry.totalProfit || 0) >= 0 ? '#059669' : '#dc2626'};">${entry.totalProfit?.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0}) || '0'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    try {
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
              description: 'ครบทั้งรายละเอียดสินค้าและข้อมูลราคาโรงงาน'
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(eventDate);
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
      label: "เสนอราคา", 
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
      count: getStatusCount(["รายการสั่งผลิต"])
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

  // Quotation table component - Updated with single manage button
  const QuotationTable = ({ quotations, tabValue }: { quotations: MockQuotation[]; tabValue: string }) => {
    if (quotations.length === 0) {
      const tabLabel = tabConfig.find(t => t.value === tabValue)?.label || "";
      const hasDataWithoutSearch = mockQuotations.some(q => {
        switch (tabValue) {
          case "pending": return q.status === "ยื่นคำขอประเมิน";
          case "in-progress": return q.status === "อยู่ระหว่างการประเมินราคา";
          case "quoted": return q.status === "เสนอราคา";
          case "proposed": return q.status === "เสนอลูกค้า";
          case "production": return q.status === "รายการสั่งผลิต";
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
                <TableHead>รหัสงาน</TableHead>
                <TableHead>ชื่องาน</TableHead>
                <TableHead>โรงงานผู้ชนะ</TableHead>
                <TableHead>ลูกค้า</TableHead>
                <TableHead>วันที่ต้องส่งมอบ</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead className="text-right">ต้นทุนรวม</TableHead>
                <TableHead className="text-right">ราคาขาย</TableHead>
                <TableHead>สถานะการผลิต</TableHead>
                <TableHead className="text-center">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((quotation) => (
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
              <TableHead>รหัสงาน</TableHead>
              <TableHead>ชื่องาน</TableHead>
              <TableHead>ประเภทสินค้า</TableHead>
              <TableHead>ลูกค้า</TableHead>
              <TableHead>พนักงานขาย</TableHead>
              <TableHead>วันที่สร้าง</TableHead>
              <TableHead>วันที่ต้องส่งมอบ</TableHead>
              <TableHead className="text-right">จำนวน</TableHead>
              {tabValue !== "pending" && tabValue !== "info-needed" && (
                <>
                  <TableHead>โรงงาน</TableHead>
                  <TableHead className="text-right">ต้นทุนรวม</TableHead>
                  <TableHead className="text-right">ราคาขาย</TableHead>
                  <TableHead className="text-right">กำไร</TableHead>
                </>
              )}
              <TableHead>สถานะ</TableHead>
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
            {quotations.map((quotation) => (
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
                    <TableCell className="text-right">{quotation.totalCost.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{quotation.totalSellingPrice.toLocaleString()}</TableCell>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          setMockQuotations(prev => prev.map(q => {
                            if (q.id === quotation.id) {
                              return {
                                ...q,
                                status: "รายการสั่งผลิต" as QuotationStatus,
                                productionStep: "ออกใบ PO" as ProductionStep,
                                productionStepHistory: [{
                                  step: "ออกใบ PO" as ProductionStep,
                                  updatedAt: new Date().toISOString(),
                                  updatedBy: "จัดซื้อ ผู้ใช้งาน"
                                }],
                              };
                            }
                            return q;
                          }));
                          toast.success("สั่งผลิตสำเร็จ - งานถูกย้ายไป 'รายการสั่งผลิต'");
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
                        onClick={(e) => {
                          e.stopPropagation();
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

  return (
    <div className="space-y-6">
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
      <Sheet open={showManagementModal} onOpenChange={closeManagementModal}>
        <SheetContent side="right" className="w-3/4 max-w-none sm:max-w-none overflow-y-auto scrollbar-littleboy p-6">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-3">
              <Settings className="w-6 h-6" />
              จัดการคำขอประเมินราคา
              {selectedQuotation && (
                <Badge variant="outline" className="ml-2 font-mono">
                  {selectedQuotation.jobCode}
                </Badge>
              )}
            </SheetTitle>
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
                      <p className="font-medium text-sm">{selectedQuotation.jobName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">ลูกค้า</p>
                      <p className="font-medium text-sm">{selectedQuotation.customerName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">พนักงานขาย</p>
                      <p className="font-medium text-sm">{selectedQuotation.salesPerson}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Product Specs Section */}
                  <div>
                    <h4 className="font-semibold text-sm text-foreground mb-4">รายละเอียดสินค้า</h4>
                    
                    {/* Main Specs - 2 Column Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">วัสดุ</p>
                        <p className="font-medium text-sm">{selectedQuotation.material}</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">ขนาด</p>
                        <p className="font-medium text-sm">{selectedQuotation.size}</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">ความหนา</p>
                        <p className="font-medium text-sm">{selectedQuotation.thickness}</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">ชนิดการชุบ</p>
                        <p className="font-medium text-sm">Shiny (เงา)</p>
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
                            {selectedQuotation.colors.map((color, idx) => {
                              const colorQuantities: Record<string, number> = {
                                "shinny gold (สีทองเงา)": Math.ceil(selectedQuotation.quantity * 0.22),
                                "shinny silver (สีเงินเงา)": Math.ceil(selectedQuotation.quantity * 0.44),
                                "shinny copper (สีทองแดงเงา)": Math.ceil(selectedQuotation.quantity * 0.34),
                              };
                              const colorDisplayMap: Record<string, string> = {
                                "shinny gold (สีทองเงา)": "Gold (ทอง)",
                                "shinny silver (สีเงินเงา)": "Silver (เงิน)",
                                "shinny copper (สีทองแดงเงา)": "Copper (ทองแดง)",
                              };
                              const qty = colorQuantities[color] || Math.ceil(selectedQuotation.quantity / selectedQuotation.colors.length);
                              return (
                                <TableRow key={idx}>
                                  <TableCell className="py-2 text-sm">{colorDisplayMap[color] || color}</TableCell>
                                  <TableCell className="text-right py-2 text-sm">{qty.toLocaleString()} ชิ้น</TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow className="bg-muted/30 font-medium">
                              <TableCell className="py-2 text-sm">รวม</TableCell>
                              <TableCell className="text-right py-2 text-sm font-semibold">{selectedQuotation.quantity.toLocaleString()} ชิ้น</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    {/* Front/Back Details - Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">รายละเอียดด้านหน้า</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {selectedQuotation.frontDetails?.split(", ").map((detail, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{detail}</Badge>
                          )) || <span className="text-muted-foreground text-sm">-</span>}
                        </div>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">รายละเอียดด้านหลัง</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {selectedQuotation.backDetails?.split(", ").map((detail, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{detail}</Badge>
                          )) || <span className="text-muted-foreground text-sm">-</span>}
                        </div>
                      </div>
                    </div>

                    {/* Lanyard */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">ขนาดสายคล้องคอ</p>
                        <p className="font-medium text-sm">{selectedQuotation.lanyardSize.replace("x", " × ")}</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-1">จำนวนลาย</p>
                        <p className="font-medium text-sm">{selectedQuotation.lanyardPatterns} ลาย</p>
                      </div>
                    </div>

                    {/* Customer Budget - Highlighted */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">งบประมาณต่อชิ้น</p>
                      <p className="font-bold text-xl text-primary">{selectedQuotation.customerBudget.toLocaleString()} บาท</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Deadline */}
                  <div>
                    <p className="text-sm text-muted-foreground">วันที่ต้องส่งมอบ</p>
                    <div>{getDeadlineDisplay(selectedQuotation.eventDate)}</div>
                  </div>

                  {/* Artwork Section - Sales Style */}
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-3 font-medium">ข้อมูล Artwork</p>
                    
                    {/* Artwork Image Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">รูป Artwork</p>
                        {selectedQuotation.artworkImages.length > 0 ? (
                          <>
                            {/* Main Preview - Clickable */}
                            <button
                              onClick={() => setIsArtworkFullscreenOpen(true)}
                              className="w-full bg-muted rounded-lg p-4 flex items-center justify-center min-h-[200px] max-h-[300px] cursor-zoom-in hover:bg-muted/80 transition-colors"
                            >
                              <img
                                src={sampleArtwork}
                                alt={`Artwork preview ${selectedArtworkIndex + 1}`}
                                className="max-w-full max-h-[260px] object-contain"
                              />
                            </button>
                            <p className="text-xs text-muted-foreground text-center mt-2">คลิกที่รูปเพื่อขยายเต็มจอ</p>
                            
                            {/* Thumbnails */}
                            {selectedQuotation.artworkImages.length > 1 && (
                              <div className="flex gap-2 flex-wrap mt-3">
                                {selectedQuotation.artworkImages.map((img, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setSelectedArtworkIndex(index)}
                                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all bg-muted p-1 ${
                                      selectedArtworkIndex === index
                                        ? "border-primary ring-2 ring-primary/20"
                                        : "border-border hover:border-primary/50"
                                    }`}
                                  >
                                    <img
                                      src={sampleArtwork}
                                      alt={`Thumbnail ${index + 1}`}
                                      className="w-full h-full object-contain"
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
                  {selectedQuotation.notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">หมายเหตุจากเซลล์</p>
                        <p className="font-medium bg-yellow-50 p-3 rounded-lg border border-yellow-200">{selectedQuotation.notes}</p>
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
                          const colorsFormatted = selectedQuotation.colors.join(", ");
                          const lanyardFormatted = `${selectedQuotation.lanyardSize.replace("ซม.", "cm.")} (${selectedQuotation.lanyardPatterns} Designs)`;
                          const quantityFormatted = `${selectedQuotation.quantity.toLocaleString()} pcs.`;
                          
                          const summaryText = `Product: Medal
Material: ${selectedQuotation.material}
Project: ${selectedQuotation.jobName}
Plating: ${colorsFormatted}
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
                      <p><span className="text-slate-500">Material:</span> {selectedQuotation.material}</p>
                      <p><span className="text-slate-500">Project:</span> {selectedQuotation.jobName}</p>
                      <p><span className="text-slate-500">Plating:</span> {selectedQuotation.colors.join(", ")}</p>
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
                              <TableHead className="w-[100px] text-center bg-cyan-50 font-bold">ทุนรวม<br/><span className="text-xs font-normal">(THB)</span></TableHead>
                              <TableHead className="w-[100px] text-center bg-green-50 font-bold">ราคาขายรวม<br/><span className="text-xs font-normal">(THB)</span></TableHead>
                              <TableHead className="w-[100px] text-center bg-amber-50 font-bold">กำไร<br/><span className="text-xs font-normal">(THB)</span></TableHead>
                              <TableHead className="w-[100px] text-center bg-purple-50 font-bold">ค่าโมล(เพิ่มเติม)<br/><span className="text-xs font-normal">(THB)</span></TableHead>
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
                                            handleSupplierFileUpload(entry.id, file);
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
                                      {entry.uploadedFile && (
                                        <span className="text-xs text-green-600 truncate max-w-[100px] block mt-1" title={entry.uploadedFile.name}>
                                          ✓ {entry.uploadedFile.name.length > 12 
                                            ? `${entry.uploadedFile.name.slice(0, 10)}...` 
                                            : entry.uploadedFile.name}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                    </div>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Footer Actions - Only show after estimation started or in read-only mode */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                {/* Show close button when not started yet */}
                {!estimationStarted && !isReadOnlyMode && (
                  <Button variant="outline" onClick={closeManagementModal}>
                    ปิด
                  </Button>
                )}
                
                {/* Show full action buttons only after estimation started or in read-only mode */}
                {(estimationStarted || isReadOnlyMode) && (
                  <>
                    <Button variant="outline" onClick={closeManagementModal}>
                      {isReadOnlyMode ? "ปิด" : "ยกเลิก"}
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
                        onClick={() => {
                          if (selectedQuotation) {
                            const winnerEntry = supplierEntries.find(e => e.id === selectedWinner);
                            setMockQuotations(prev => prev.map(q => {
                              if (q.id === selectedQuotation.id) {
                                return {
                                  ...q,
                                  status: "รายการสั่งผลิต" as QuotationStatus,
                                  productionStep: "ออกใบ PO" as ProductionStep,
                                  productionStepHistory: [{
                                    step: "ออกใบ PO" as ProductionStep,
                                    updatedAt: new Date().toISOString(),
                                    updatedBy: "จัดซื้อ ผู้ใช้งาน"
                                  }],
                                  winnerFactoryValue: winnerEntry?.factoryValue || selectedQuotation.winnerFactoryValue,
                                  factory: winnerEntry?.factoryValue || selectedQuotation.factory,
                                  factoryLabel: winnerEntry?.factoryLabel || selectedQuotation.factoryLabel,
                                };
                              }
                              return q;
                            }));
                            toast.success("สั่งผลิตสำเร็จ - งานถูกย้ายไป 'รายการสั่งผลิต'");
                            closeManagementModal();
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
                          onClick={() => {
                            const winnerEntry = supplierEntries.find(e => e.isWinner);
                            if (!winnerEntry) {
                              toast.error("กรุณาเลือกโรงงานที่ต้องการอนุมัติก่อน");
                              return;
                            }
                            setMockQuotations(prev => prev.map(q => {
                              if (q.id === selectedQuotation.id) {
                                return {
                                  ...q,
                                  status: "เสนอราคา" as QuotationStatus,
                                  winnerFactoryValue: winnerEntry.factoryValue,
                                  factory: winnerEntry.factoryValue,
                                  factoryLabel: winnerEntry.factoryLabel,
                                };
                              }
                              return q;
                            }));
                            toast.success(`อนุมัติราคาสำเร็จ - โรงงาน: ${winnerEntry.factoryLabel} → ย้ายไปแถบ 'เสนอราคา'`);
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
                        src={selectedQuotation.artworkImages?.[0] || "/placeholder.svg"} 
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
                      <p className="font-medium text-blue-700">{selectedQuotation.material}</p>
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
                      <p className="text-xs text-muted-foreground">ชนิดการชุบ</p>
                      <p className="font-medium">Shiny (เงา)</p>
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
                          <div className="text-cyan-600">ทุนรวม</div>
                          <div className="text-xs text-cyan-500">(THB)</div>
                        </TableHead>
                        <TableHead className="text-center bg-green-50">
                          <div className="text-green-600">ราคาขายรวม</div>
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
                            {entry.uploadedFile ? (
                              <div className="flex items-center justify-center gap-1">
                                <Upload className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600">อัพโหลด</span>
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
              onClick={() => {
                setShowApprovalConfirmDialog(false);
                if (selectedQuotation) {
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
                  closeManagementModal();
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
                        src={summaryQuotation.artworkImages?.[0] || "/placeholder.svg"} 
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
                      <p className="text-xs text-muted-foreground">ชนิดการชุบ</p>
                      <p className="font-medium">Shiny (เงา)</p>
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
                          <div className="text-cyan-600">ทุนรวม</div>
                          <div className="text-xs text-cyan-500">(THB)</div>
                        </TableHead>
                        <TableHead className="text-center bg-green-50">
                          <div className="text-green-600">ราคาขายรวม</div>
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
                            {entry.uploadedFile ? (
                              <div className="flex items-center justify-center gap-1">
                                <Upload className="w-4 h-4 text-green-600" />
                                <span className="text-xs text-green-600">อัพโหลด</span>
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
              onClick={() => {
                if (summaryQuotation && summarySelectedFactory) {
                  const selectedEntry = summarySupplierEntries.find(e => e.id === summarySelectedFactory);
                  setMockQuotations(prev => prev.map(q =>
                    q.id === summaryQuotation.id
                      ? { ...q, status: "ประเมินเสร็จสิ้น" as QuotationStatus, winnerFactoryValue: selectedEntry?.factoryValue, factory: selectedEntry?.factoryValue || "", factoryLabel: selectedEntry?.factoryLabel || "" }
                      : q
                  ));
                  setShowSummaryDialog(false);
                  setSummarySelectedFactory(null);
                  toast.success(`อนุมัติราคาโรงงาน ${selectedEntry?.factoryLabel} เรียบร้อย`);
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

                    {/* Finish Type */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">ชนิดการชุบ (Finish)</p>
                      <Badge variant="outline" className="text-sm">Shiny (เงา)</Badge>
                    </div>

                    {/* Colors and Quantity Table */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">สีและจำนวน</p>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="text-left">สี</TableHead>
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
                              const colorDisplayMap: Record<string, string> = {
                                "shinny gold (สีทองเงา)": "Gold (ทอง)",
                                "shinny silver (สีเงินเงา)": "Silver (เงิน)",
                                "shinny copper (สีทองแดงเงา)": "Copper (ทองแดง)",
                              };
                              const qty = colorQuantities[color] || Math.ceil(selectedProductionItem.quantity / selectedProductionItem.colors.length);
                              return (
                                <TableRow key={idx}>
                                  <TableCell>{colorDisplayMap[color] || color}</TableCell>
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
                      <div className="flex gap-2 flex-wrap">
                        {selectedProductionItem.frontDetails?.split(", ").map((detail, idx) => (
                          <Badge key={idx} variant="outline" className="text-sm">{detail}</Badge>
                        )) || <span className="text-muted-foreground">-</span>}
                      </div>
                    </div>

                    {/* Back Details */}
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">รายละเอียดด้านหลัง</p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedProductionItem.backDetails?.split(", ").map((detail, idx) => (
                          <Badge key={idx} variant="outline" className="text-sm">{detail}</Badge>
                        )) || <span className="text-muted-foreground">-</span>}
                      </div>
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
                        <p className="text-sm text-muted-foreground mb-2">รูป Artwork</p>
                        {selectedProductionItem.artworkImages.length > 0 ? (
                          <>
                            <button
                              onClick={() => setIsArtworkFullscreenOpen(true)}
                              className="w-full bg-muted rounded-lg p-4 flex items-center justify-center min-h-[200px] max-h-[300px] cursor-zoom-in hover:bg-muted/80 transition-colors"
                            >
                              <img
                                src={sampleArtwork}
                                alt={`Artwork preview`}
                                className="max-w-full max-h-[260px] object-contain"
                              />
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prod-po">ใบสั่งซื้อ (PO)</Label>
                      <Input
                        id="prod-po"
                        placeholder="ระบุเลขที่ใบสั่งซื้อ"
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prod-split">จำนวนแยก (ถ้ามี)</Label>
                      <Input
                        id="prod-split"
                        placeholder="ระบุจำนวนแยก เช่น 3 ล็อต"
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prod-vat">ภาษีมูลค่าเพิ่ม VAT (%)</Label>
                        <Input
                          id="prod-vat"
                          type="number"
                          defaultValue="7"
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
                        <Select>
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
                          defaultValue="5.5"
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

          <SheetFooter>
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
