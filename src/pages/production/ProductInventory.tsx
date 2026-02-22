import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Plus, Minus, LayoutGrid, List, Package, Eye, Edit, Trash2,
  RefreshCw, ArrowDownCircle, ArrowUpCircle, ChevronRight, X, ImageIcon, Upload,
  Clock, User, AlertTriangle, XCircle, CheckCircle, Boxes, History, TrendingDown,
  Download, FileSpreadsheet, CheckCircle2,
} from "lucide-react";
import * as XLSX from "xlsx";
import DefectiveItemsTab from "@/components/production/DefectiveItemsTab";
import ExcelImportDialog, { type ImportRow } from "@/components/procurement/ExcelImportDialog";
import { toast } from "sonner";

// --- Types ---
interface PriceEntry {
  model: string;
  retailPrice: number;
  moldCost: number;
  specialPrice: number;
}

interface ProductionTime {
  value: number;
  unit: "วัน" | "สัปดาห์";
}

interface BOMComponent {
  id: string; name: string; qty: number; unit: string;
}

interface MovementLog {
  id: string; date: string; type: "รับเข้า" | "จ่ายออก"; qty: number; by: string; note: string;
}

interface ProcurementCost {
  manufact: string;
  mtl: string;
  noted: string;
  priceYuan: number;
  priceTHB: number;
  amountRMB: number;
  totalTHB: number;
  pcsCtn: number;
  ctn: number;
  boxSize: string;
  boxSizeNum: number;
  shippingCost: number;
  shippingPerPiece: number;
  totalShipping: number;
  meas: number;
  gw: number;
  tgw: number;
}

interface ProductItem {
  id: string;
  code: string;
  name: string;
  image: string;
  additionalImages: string[];
  productType: string;
  category: string;
  subcategory: string;
  color: string[];
  size: string[];
  tags: string;
  description: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  model: string;
  productionTime: ProductionTime[];
  options: string[];
  prices: PriceEntry[];
  lastUpdated: string;
  status: "in_stock" | "low_stock" | "out_of_stock" | "defective";
  bom?: BOMComponent[];
  movementHistory?: MovementLog[];
  procurementCost?: ProcurementCost;
}

// --- Categories ---
const productTypes = [
  "ถ้วยรางวัลสำเร็จ", "เหรียญรางวัล", "โล่รางวัล", "เสื้อพิมพ์ลายและผ้า", "ชิ้นส่วนถ้วยรางวัล",
];

const categories = [
  { key: "all", label: "ทั้งหมด" },
  { key: "ถ้วยรางวัลสำเร็จ", label: "ถ้วยรางวัลสำเร็จ" },
  { key: "เหรียญรางวัล", label: "เหรียญรางวัล" },
  { key: "โล่รางวัล", label: "โล่รางวัล" },
  { key: "เสื้อพิมพ์ลายและผ้า", label: "เสื้อพิมพ์ลายและผ้า" },
  { key: "ชิ้นส่วนถ้วยรางวัล", label: "ชิ้นส่วนถ้วยรางวัล" },
  { key: "defective", label: "สินค้ามีตำหนิ" },
];

const subcategoryMap: Record<string, string[]> = {
  ถ้วยรางวัลสำเร็จ: ["ถ้วยรางวัลโลหะอิตาลี", "ถ้วยรางวัลโลหะจีน", "ถ้วยรางวัลพลาสติกอิตาลี", "ถ้วยรางวัลพลาสติกไทย", "ถ้วยรางวัลฟิกเกอร์", "ถ้วยรางวัลเบญจรงค์"],
  เหรียญรางวัล: ["เหรียญพลาสติก", "เหรียญโลหะ"],
  โล่รางวัล: ["โล่คริสตัล", "โล่ไม้"],
  เสื้อพิมพ์ลายและผ้า: ["เสื้อโปโล", "เสื้อยืด"],
  ชิ้นส่วนถ้วยรางวัล: ["ฐานถ้วย", "ตัวถ้วย", "ฝาครอบ"],
};

const optionsList = [
  "ทำป้ายจารึก", "ทำโบว์", "ตราสัญลักษณ์", "สกรีน 1 สี", "สกรีน 4 สี",
  "สติ๊กเกอร์", "เลเซอร์มาสี", "mirror", "กล่องกำมะหยี่", "อื่นๆ โปรดระบุ",
];

const colorOptions = ["ทอง", "เงิน", "ทองแดง", "ดำ", "ขาว", "แดง", "น้ำเงิน", "เขียว", "ใส", "รมดำ", "เงา"];
const manufactOptions = ["BC", "YX", "GD", "HZ", "SZ", "DG", "ZJ"];
const mtlOptions = ["PLASTIC", "METAL", "ZINC", "CRYSTAL", "WOOD", "MARBLE", "RESIN", "GLASS"];
const sizeOptions = ["A", "B", "C", "D", "N/A", "5cm", "8 นิ้ว", "10 นิ้ว", "มาตรฐาน", "H192mm", "H250mm", "H300mm", "4x4 นิ้ว"];

// --- Mock Data ---
const emptyProcurementCost: ProcurementCost = {
  manufact: "", mtl: "", noted: "", priceYuan: 0, priceTHB: 0,
  amountRMB: 0, totalTHB: 0, pcsCtn: 0, ctn: 0, boxSize: "",
  boxSizeNum: 0, shippingCost: 0, shippingPerPiece: 0, totalShipping: 0,
  meas: 0, gw: 0, tgw: 0,
};

const initialProducts: ProductItem[] = [
  {
    id: "1", code: "TC-001", name: "ถ้วยรางวัลสีทอง", image: "/placeholder.svg",
    additionalImages: [], productType: "ถ้วยรางวัลสำเร็จ",
    category: "ถ้วยรางวัลสำเร็จ", subcategory: "ถ้วยรางวัลโลหะอิตาลี",
    color: ["ทอง"], size: ["A", "B", "C", "N/A"], tags: "ถ้วยรางวัล",
    description: "ถ้วยรางวัลโลหะอิตาลีสีทอง คุณภาพสูง",
    currentStock: 500, minimumStock: 100, unit: "ชิ้น", model: "911_S_W_D",
    productionTime: [{ value: 7, unit: "วัน" }],
    options: ["ทำป้ายจารึก", "ทำโบว์", "กล่องกำมะหยี่"],
    prices: [{ model: "911_S_W_D", retailPrice: 1500, moldCost: 200, specialPrice: 1200 }],
    lastUpdated: "2025-02-10", status: "in_stock",
    procurementCost: { manufact: "BC", mtl: "PLASTIC", noted: "", priceYuan: 3.00, priceTHB: 15.60, amountRMB: 1200, totalTHB: 6240, pcsCtn: 200, ctn: 2, boxSize: "B2", boxSizeNum: 0.035, shippingCost: 105, shippingPerPiece: 0.53, totalShipping: 16.13, meas: 0.07, gw: 6.5, tgw: 13 },
    bom: [
      { id: "CP-001", name: "ตัวถ้วยโลหะอิตาลี", qty: 1, unit: "ชิ้น" },
      { id: "CP-002", name: "ฐานหินอ่อน", qty: 1, unit: "ชิ้น" },
    ],
    movementHistory: [
      { id: "M1", date: "2025-02-10 14:30", type: "รับเข้า", qty: 100, by: "สมชาย", note: "รับจากซัพพลายเออร์" },
      { id: "M2", date: "2025-02-08 10:00", type: "จ่ายออก", qty: 20, by: "วิชัย", note: "เบิกใช้ ORD-015" },
    ],
  },
  {
    id: "2", code: "TC-002", name: "ถ้วยรางวัลสีเงิน", image: "/placeholder.svg",
    additionalImages: [], productType: "ถ้วยรางวัลสำเร็จ",
    category: "ถ้วยรางวัลสำเร็จ", subcategory: "ถ้วยรางวัลโลหะอิตาลี",
    color: ["เงิน"], size: ["A", "B", "C", "D"], tags: "ถ้วยรางวัล",
    description: "ถ้วยรางวัลโลหะอิตาลีสีเงิน",
    currentStock: 30, minimumStock: 50, unit: "ชิ้น", model: "912_S_W_D",
    productionTime: [{ value: 7, unit: "วัน" }],
    options: ["ทำป้ายจารึก", "ทำโบว์"],
    prices: [{ model: "912_S_W_D", retailPrice: 1500, moldCost: 200, specialPrice: 1200 }],
    lastUpdated: "2025-02-05", status: "low_stock",
    movementHistory: [
      { id: "M3", date: "2025-02-05 11:00", type: "จ่ายออก", qty: 15, by: "วิชัย", note: "เบิกใช้ ORD-010" },
    ],
  },
  {
    id: "3", code: "MD-001", name: "เหรียญพลาสติกรู้แพ้รู้ชนะ", image: "/placeholder.svg",
    additionalImages: [], productType: "เหรียญรางวัล",
    category: "เหรียญรางวัล", subcategory: "เหรียญพลาสติก",
    color: ["ทอง", "เงิน", "ทองแดง"], size: ["มาตรฐาน"], tags: "เหรียญ",
    description: "เหรียญพลาสติกสำหรับงานกีฬา",
    currentStock: 1200, minimumStock: 200, unit: "ชิ้น", model: "Standard",
    productionTime: [{ value: 3, unit: "วัน" }],
    options: ["สกรีน 1 สี", "สติ๊กเกอร์"],
    prices: [{ model: "Standard", retailPrice: 25, moldCost: 0, specialPrice: 18 }],
    lastUpdated: "2025-02-10", status: "in_stock",
  },
  {
    id: "4", code: "MD-002", name: "เหรียญโลหะซิงค์สำเร็จรูป", image: "/placeholder.svg",
    additionalImages: [], productType: "เหรียญรางวัล",
    category: "เหรียญรางวัล", subcategory: "เหรียญโลหะ",
    color: ["เงา", "รมดำ"], size: ["5cm"], tags: "เหรียญ, premium",
    description: "เหรียญโลหะซิงค์คุณภาพสูง",
    currentStock: 45, minimumStock: 50, unit: "ชิ้น", model: "Premium",
    productionTime: [{ value: 2, unit: "สัปดาห์" }],
    options: ["ทำป้ายจารึก", "สติ๊กเกอร์"],
    prices: [{ model: "Premium", retailPrice: 120, moldCost: 50, specialPrice: 90 }],
    lastUpdated: "2025-02-09", status: "low_stock",
  },
  {
    id: "5", code: "PL-001", name: "โล่คริสตัลพรีเมียม", image: "/placeholder.svg",
    additionalImages: [], productType: "โล่รางวัล",
    category: "โล่รางวัล", subcategory: "โล่คริสตัล",
    color: ["ใส"], size: ["8 นิ้ว"], tags: "โล่, คริสตัล",
    description: "โล่คริสตัลงานพรีเมียม",
    currentStock: 80, minimumStock: 30, unit: "ชิ้น", model: "Crystal-8",
    productionTime: [{ value: 5, unit: "วัน" }],
    options: ["เลเซอร์มาสี"],
    prices: [{ model: "Crystal-8", retailPrice: 850, moldCost: 0, specialPrice: 700 }],
    lastUpdated: "2025-02-10", status: "in_stock",
  },
  {
    id: "6", code: "CP-002", name: "ฐานหินอ่อน", image: "/placeholder.svg",
    additionalImages: [], productType: "ชิ้นส่วนถ้วยรางวัล",
    category: "ชิ้นส่วนถ้วยรางวัล", subcategory: "ฐานถ้วย",
    color: ["ดำ", "ขาว"], size: ["4x4 นิ้ว"], tags: "ชิ้นส่วน, ฐาน",
    description: "ฐานหินอ่อนสำหรับถ้วยรางวัล",
    currentStock: 350, minimumStock: 100, unit: "ชิ้น", model: "BASE-M01",
    productionTime: [], options: [],
    prices: [{ model: "BASE-M01", retailPrice: 150, moldCost: 0, specialPrice: 120 }],
    lastUpdated: "2025-02-10", status: "in_stock",
  },
  {
    id: "7", code: "CP-003", name: "ฝาครอบพลาสติก", image: "/placeholder.svg",
    additionalImages: [], productType: "ชิ้นส่วนถ้วยรางวัล",
    category: "ชิ้นส่วนถ้วยรางวัล", subcategory: "ฝาครอบ",
    color: ["ใส"], size: ["มาตรฐาน"], tags: "ชิ้นส่วน",
    description: "ฝาครอบพลาสติกใส",
    currentStock: 0, minimumStock: 50, unit: "ชิ้น", model: "LID-P01",
    productionTime: [], options: [],
    prices: [{ model: "LID-P01", retailPrice: 30, moldCost: 0, specialPrice: 25 }],
    lastUpdated: "2025-02-08", status: "out_of_stock",
  },
  {
    id: "8", code: "TC-008", name: "ถ้วยรางวัลสีทอง (ตำหนิ)", image: "/placeholder.svg",
    additionalImages: [], productType: "ถ้วยรางวัลสำเร็จ",
    category: "ถ้วยรางวัลสำเร็จ", subcategory: "ถ้วยรางวัลโลหะอิตาลี",
    color: ["ทอง"], size: ["A"], tags: "ถ้วยรางวัล,ตำหนิ",
    description: "ถ้วยรางวัลโลหะสีทอง มีรอยขีดข่วน",
    currentStock: 5, minimumStock: 0, unit: "ชิ้น", model: "911_S_W_D",
    productionTime: [], options: [],
    prices: [{ model: "911_S_W_D", retailPrice: 800, moldCost: 100, specialPrice: 600 }],
    lastUpdated: "2025-02-12", status: "defective",
  },
  {
    id: "9", code: "MD-005", name: "เหรียญโลหะ (ตำหนิ)", image: "/placeholder.svg",
    additionalImages: [], productType: "เหรียญรางวัล",
    category: "เหรียญรางวัล", subcategory: "เหรียญโลหะ",
    color: ["เงิน"], size: ["มาตรฐาน"], tags: "เหรียญ,ตำหนิ",
    description: "เหรียญโลหะสีเงิน สีไม่สม่ำเสมอ",
    currentStock: 10, minimumStock: 0, unit: "ชิ้น", model: "MED-M01",
    productionTime: [], options: [],
    prices: [{ model: "MED-M01", retailPrice: 150, moldCost: 30, specialPrice: 100 }],
    lastUpdated: "2025-02-11", status: "defective",
  },
];

// --- Empty form state ---
const emptyForm: Omit<ProductItem, "id" | "status" | "lastUpdated" | "movementHistory"> = {
  code: "", name: "", image: "", additionalImages: [], productType: "",
  category: "", subcategory: "", color: [], size: [], tags: "", description: "",
  currentStock: 0, minimumStock: 0, unit: "ชิ้น", model: "",
  productionTime: [], options: [], prices: [{ model: "", retailPrice: 0, moldCost: 0, specialPrice: 0 }],
  procurementCost: { ...emptyProcurementCost },
};

interface ProductInventoryProps {
  isSalesMode?: boolean;
  isProcurementMode?: boolean;
}

export default function ProductInventory({ isSalesMode = false, isProcurementMode = false }: ProductInventoryProps) {
  const isReadOnlyMode = isSalesMode || isProcurementMode;
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("products");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newSize, setNewSize] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const additionalImageInputRef = useRef<HTMLInputElement>(null);

  // Detail & adjust dialogs
  const [detailItem, setDetailItem] = useState<ProductItem | null>(null);
  const [adjustItem, setAdjustItem] = useState<ProductItem | null>(null);
  const [adjustType, setAdjustType] = useState<"รับเข้า" | "จ่ายออก">("รับเข้า");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  // Inline editing state
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditData, setInlineEditData] = useState<Partial<ProductItem & { procurementCost: ProcurementCost }>>({});

  const startInlineEdit = (item: ProductItem) => {
    setInlineEditId(item.id);
    setInlineEditData({ ...item, procurementCost: item.procurementCost ? { ...item.procurementCost } : { ...emptyProcurementCost } });
  };

  const cancelInlineEdit = () => {
    setInlineEditId(null);
    setInlineEditData({});
  };

  const saveInlineEdit = () => {
    if (!inlineEditId) return;
    const pc = inlineEditData.procurementCost;
    if (pc) {
      // Auto-calc shipping fields
      pc.shippingPerPiece = pc.pcsCtn > 0 ? pc.shippingCost / pc.pcsCtn : 0;
      pc.totalShipping = pc.shippingCost * pc.ctn;
    }
    setProducts(prev => prev.map(p => {
      if (p.id !== inlineEditId) return p;
      return {
        ...p,
        ...inlineEditData,
        status: computeStatus(inlineEditData.currentStock ?? p.currentStock, inlineEditData.minimumStock ?? p.minimumStock),
        lastUpdated: new Date().toISOString().split("T")[0],
      };
    }));
    toast.success("บันทึกการแก้ไขเรียบร้อย");
    setInlineEditId(null);
    setInlineEditData({});
  };

  const updateInlineProcurement = (field: keyof ProcurementCost, value: any) => {
    setInlineEditData(prev => {
      const pc = { ...(prev.procurementCost || emptyProcurementCost), [field]: value };
      // Auto-calc
      if (field === "shippingCost" || field === "pcsCtn") {
        pc.shippingPerPiece = pc.pcsCtn > 0 ? pc.shippingCost / pc.pcsCtn : 0;
      }
      if (field === "shippingCost" || field === "ctn") {
        pc.totalShipping = pc.shippingCost * pc.ctn;
      }
      return { ...prev, procurementCost: pc };
    });
  };

  const toggleInlineMulti = (field: "color" | "size", value: string) => {
    setInlineEditData(prev => {
      const arr = [...(prev[field] as string[] || [])];
      const idx = arr.indexOf(value);
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(value);
      return { ...prev, [field]: arr };
    });
  };

  const subcategories = subcategoryMap[selectedCategory] || [];

  // Excel import state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const existingSkus = products.map(p => p.code);

  const handleImportConfirm = (rows: ImportRow[]) => {
    const newItems: ProductItem[] = rows.map((row, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      code: row.sku,
      name: row.name,
      image: "/placeholder.svg",
      additionalImages: [],
      productType: row.category || "ถ้วยรางวัลสำเร็จ",
      category: row.category || "ถ้วยรางวัลสำเร็จ",
      subcategory: "",
      color: row.color ? row.color.split(",").map(s => s.trim()).filter(Boolean) : [],
      size: row.size ? row.size.split(",").map(s => s.trim()).filter(Boolean) : [],
      tags: "",
      description: row.description || "",
      currentStock: row.quantity,
      minimumStock: row.minQty,
      unit: "ชิ้น",
      model: row.sku,
      productionTime: [],
      options: [],
      prices: [{ model: row.sku, retailPrice: 0, moldCost: 0, specialPrice: 0 }],
      lastUpdated: new Date().toISOString().split("T")[0],
      status: computeStatus(row.quantity, row.minQty),
      movementHistory: [],
      procurementCost: {
        manufact: row.manufact || "",
        mtl: row.mtl || "",
        noted: row.noted || "",
        priceYuan: row.priceYuan,
        priceTHB: row.priceTHB,
        amountRMB: row.amountRMB,
        totalTHB: row.totalTHB,
        pcsCtn: row.pcsCtn,
        ctn: row.ctn,
        boxSize: row.boxSize,
        boxSizeNum: row.boxSizeNum,
        shippingCost: row.shippingCost,
        shippingPerPiece: row.shippingPerPiece,
        totalShipping: row.totalShipping,
        meas: row.meas,
        gw: row.gw,
        tgw: row.tgw,
      },
    }));
    setProducts(prev => [...prev, ...newItems]);
  };

  // Summary counts
  const summaryStats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter(p => p.status === "in_stock").length;
    const lowStock = products.filter(p => p.status === "low_stock").length;
    const outOfStock = products.filter(p => p.status === "out_of_stock").length;
    const defective = 2; // mock defective count
    const todayMovements = 12; // mock today's movements
    return { total, inStock, lowStock, outOfStock, defective, todayMovements };
  }, [products]);

  const filteredItems = useMemo(() => {
    return products.filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || item.name.toLowerCase().includes(term) || item.code.toLowerCase().includes(term) || item.tags.toLowerCase().includes(term);
      const isDefectiveCategory = selectedCategory === "defective";
      const matchesCategory = selectedCategory === "all" || isDefectiveCategory || item.category === selectedCategory;
      const matchesSubcategory = selectedSubcategory === "all" || item.subcategory === selectedSubcategory;
      let matchesStatus = true;
      if (isDefectiveCategory) matchesStatus = item.status === "defective";
      else if (statusFilter === "in_stock") matchesStatus = item.status === "in_stock";
      else if (statusFilter === "low_stock") matchesStatus = item.status === "low_stock";
      else if (statusFilter === "out_of_stock") matchesStatus = item.status === "out_of_stock";
      else if (statusFilter === "defective") matchesStatus = item.status === "defective";
      return matchesSearch && matchesCategory && matchesSubcategory && matchesStatus;
    });
  }, [searchTerm, selectedCategory, selectedSubcategory, statusFilter, products]);

  const computeStatus = (stock: number, min: number): ProductItem["status"] => {
    if (stock <= 0) return "out_of_stock";
    if (stock < min) return "low_stock";
    return "in_stock";
  };

  const getStatusBadge = (status: ProductItem["status"], stock: number) => {
    switch (status) {
      case "in_stock": return <Badge className="bg-green-600 text-white">✅ มีในสต็อก ({stock})</Badge>;
      case "low_stock": return <Badge className="bg-amber-500 text-white">⚠️ ใกล้หมด ({stock})</Badge>;
      case "out_of_stock": return <Badge variant="destructive">❌ หมด</Badge>;
      case "defective": return <Badge className="bg-yellow-600 text-white">⚠️ มีตำหนิ ({stock})</Badge>;
    }
  };

  // --- Modal handlers ---
  const openAddModal = () => {
    setEditingProduct(null);
    setForm({ ...emptyForm, prices: [{ model: "", retailPrice: 0, moldCost: 0, specialPrice: 0 }] });
    setShowModal(true);
  };

  const openEditModal = (item: ProductItem) => {
    setEditingProduct(item);
    setForm({
      code: item.code, name: item.name, image: item.image, additionalImages: [...item.additionalImages],
      productType: item.productType, category: item.category, subcategory: item.subcategory,
      color: [...item.color], size: [...item.size], tags: item.tags, description: item.description,
      currentStock: item.currentStock, minimumStock: item.minimumStock, unit: item.unit, model: item.model,
      productionTime: [...item.productionTime], options: [...item.options],
      prices: item.prices.length > 0 ? [...item.prices] : [{ model: "", retailPrice: 0, moldCost: 0, specialPrice: 0 }],
      procurementCost: item.procurementCost ? { ...item.procurementCost } : { ...emptyProcurementCost },
    });
    setShowModal(true);
  };

  const handleSaveProduct = () => {
    if (!form.name || !form.code || !form.category) {
      toast.error("กรุณากรอกข้อมูลที่จำเป็น (ชื่อ, รหัส, หมวดหมู่)");
      return;
    }
    const now = new Date().toISOString().split("T")[0];
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
        ...p, ...form,
        status: computeStatus(form.currentStock, form.minimumStock),
        lastUpdated: now,
      } : p));
      toast.success(`แก้ไขสินค้า "${form.name}" เรียบร้อย`);
    } else {
      const newProduct: ProductItem = {
        ...form, id: `${Date.now()}`,
        status: computeStatus(form.currentStock, form.minimumStock),
        lastUpdated: now, movementHistory: [],
      };
      setProducts(prev => [newProduct, ...prev]);
      toast.success(`เพิ่มสินค้า "${form.name}" เรียบร้อย`);
    }
    setShowModal(false);
  };

  const handleDeleteProduct = (item: ProductItem) => {
    setProducts(prev => prev.filter(p => p.id !== item.id));
    toast.success(`ลบสินค้า "${item.name}" เรียบร้อย`);
  };

  // --- Stock Adjustment ---
  const handleAdjustSubmit = () => {
    if (!adjustItem) return;
    const qty = parseInt(adjustQty);
    if (!qty || qty <= 0) { toast.error("กรุณากรอกจำนวนที่ถูกต้อง"); return; }
    const now = new Date();
    const timestamp = now.toLocaleDateString("th-TH") + " " + now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    const newLog: MovementLog = {
      id: `M-${Date.now()}`, date: timestamp, type: adjustType, qty,
      by: "สมชาย ใจดี", note: adjustNote || (adjustType === "รับเข้า" ? "รับเข้าสต๊อก" : "จ่ายออกสต๊อก"),
    };
    setProducts(prev => prev.map(item => {
      if (item.id !== adjustItem.id) return item;
      const newStock = adjustType === "รับเข้า" ? item.currentStock + qty : Math.max(0, item.currentStock - qty);
      return {
        ...item, currentStock: newStock, lastUpdated: timestamp,
        status: computeStatus(newStock, item.minimumStock),
        movementHistory: [newLog, ...(item.movementHistory || [])].slice(0, 50),
      };
    }));
    toast.success(adjustType === "รับเข้า" ? `รับเข้า ${qty} ${adjustItem.unit} เรียบร้อย` : `จ่ายออก ${qty} ${adjustItem.unit} เรียบร้อย`);
    setAdjustItem(null); setAdjustQty(""); setAdjustNote(""); setAdjustType("รับเข้า");
  };

  // --- Image handler (mock: uses placeholder) ---
  const handleMainImageUpload = () => {
    toast.info("อัปโหลดรูปภาพ (ระบบจำลอง)");
    setForm(prev => ({ ...prev, image: "/placeholder.svg" }));
  };

  // --- Card View ---
  const renderCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {filteredItems.map((item) => (
        <Card key={item.id} className="relative overflow-hidden flex flex-col">
          <Badge className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs">
            {item.subcategory || item.category}
          </Badge>
          {item.status === "in_stock" && (
            <span className="absolute top-[170px] right-3 z-10 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              {item.currentStock} {item.unit}
            </span>
          )}
          <div className="h-48 bg-muted flex items-center justify-center overflow-hidden">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
                <Package className="w-10 h-10 opacity-40" /> ไม่มีรูปภาพ
              </div>
            )}
          </div>
          <CardContent className="flex-1 p-4 space-y-2">
            <h3 className="font-bold text-red-600 text-base leading-tight line-clamp-2">{item.name}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {item.color.length > 0 && <span>สี: {item.color.join(", ")}</span>}
              {item.size.length > 0 && <span>ขนาด: {item.size.join(", ")}</span>}
              {item.tags && item.tags !== "[]" && <span className="text-primary">Tags: {item.tags}</span>}
            </div>
            <p className="text-xs text-muted-foreground">Model: {item.model} • หมวดหมู่: {item.category}</p>
            {item.bom && item.bom.length > 0 && (
              <div className="text-xs text-blue-600 flex items-center gap-1">
                <Package className="w-3 h-3" /> BOM: {item.bom.length} ชิ้นส่วน
              </div>
            )}
            <div className="pt-1">{getStatusBadge(item.status, item.currentStock)}</div>
          </CardContent>
          <div className="flex justify-between items-center px-4 pb-4">
            {!isReadOnlyMode && (
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-primary text-primary hover:bg-primary/10"
                onClick={() => { setAdjustItem(item); setAdjustType("รับเข้า"); setAdjustQty(""); setAdjustNote(""); }}>
                <RefreshCw className="w-3.5 h-3.5" /> ปรับปรุงสต๊อก
              </Button>
            )}
            <div className={`flex gap-1 ${isReadOnlyMode ? "ml-auto" : ""}`}>
              <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600 border-blue-300 hover:bg-blue-50"
                onClick={() => setDetailItem(item)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8 text-amber-600 border-amber-300 hover:bg-amber-50"
                onClick={() => openEditModal(item)}>
                <Edit className="w-4 h-4" />
              </Button>
              {!isReadOnlyMode && (
                <Button size="icon" variant="outline" className="h-8 w-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => handleDeleteProduct(item)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  // --- Table View ---
  const renderTableView = () => (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {isProcurementMode && <TableHead className="text-xs whitespace-nowrap">MANUFACT</TableHead>}
                <TableHead>รูป</TableHead>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อสินค้า</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead>สี</TableHead>
                <TableHead>ขนาด</TableHead>
                {isProcurementMode && (
                  <>
                    <TableHead className="text-xs whitespace-nowrap">MTL</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Noted</TableHead>
                  </>
                )}
                <TableHead className="text-right">คงเหลือ</TableHead>
                <TableHead className="text-right">ขั้นต่ำ</TableHead>
                {isProcurementMode && (
                  <>
                    <TableHead className="text-xs whitespace-nowrap text-right">PRICE (¥)</TableHead>
                    <TableHead className="text-xs whitespace-nowrap text-right">บาท</TableHead>
                    <TableHead className="text-xs whitespace-nowrap text-right">AMOUNT RMB</TableHead>
                    <TableHead className="text-xs whitespace-nowrap text-right">ราคารวม THB</TableHead>
                    <TableHead className="text-xs whitespace-nowrap text-right">PCS/CTN</TableHead>
                    <TableHead className="text-xs whitespace-nowrap text-right">CTN</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">BOX SIZE</TableHead>
                    <TableHead className="text-xs whitespace-nowrap text-right">BOX SIZE</TableHead>
                    <TableHead className="text-xs whitespace-nowrap text-right">ค่าขนส่ง</TableHead>
                    <TableHead className="text-xs whitespace-nowrap text-right">ค่าขนส่ง/ชิ้น</TableHead>
                    <TableHead className="text-xs whitespace-nowrap text-right text-green-600 font-bold">รวมขนส่ง</TableHead>
                    <TableHead className="text-xs whitespace-nowrap text-right">MEAS</TableHead>
                    <TableHead className="text-xs whitespace-nowrap text-right">GW</TableHead>
                    <TableHead className="text-xs whitespace-nowrap text-right">T.GW</TableHead>
                  </>
                )}
                <TableHead>สถานะ</TableHead>
                <TableHead>จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const isEditing = inlineEditId === item.id;
                const ed = inlineEditData;
                const pc = isEditing ? ed.procurementCost : item.procurementCost;
                return (
                  <TableRow key={item.id} className={item.status === "low_stock" ? "bg-amber-50" : ""}>
                    {isProcurementMode && (
                      <TableCell className="text-xs font-medium bg-orange-50">
                        {isEditing ? (
                          <Select value={pc?.manufact || ""} onValueChange={(v) => updateInlineProcurement("manufact", v)}>
                            <SelectTrigger className="h-7 text-xs w-20"><SelectValue placeholder="-" /></SelectTrigger>
                            <SelectContent>{manufactOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                          </Select>
                        ) : pc?.manufact || "-"}
                      </TableCell>
                    )}
                    <TableCell>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-10 h-10 object-contain rounded border bg-white p-0.5" />
                      ) : (
                        <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center">
                          <Package className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {isEditing ? <Input className="h-7 text-xs w-24" value={ed.code || ""} onChange={(e) => setInlineEditData(prev => ({ ...prev, code: e.target.value }))} /> : item.code}
                    </TableCell>
                    <TableCell className="font-medium text-red-600">
                      {isEditing ? <Input className="h-7 text-xs w-36" value={ed.name || ""} onChange={(e) => setInlineEditData(prev => ({ ...prev, name: e.target.value }))} /> : item.name}
                    </TableCell>
                    <TableCell><span className="text-xs">{item.subcategory}</span></TableCell>
                    <TableCell className="text-xs">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-0.5 max-w-[120px]">
                          {colorOptions.map(c => (
                            <Badge key={c} variant={(ed.color || []).includes(c) ? "default" : "outline"}
                              className={`cursor-pointer text-[10px] px-1 py-0 ${(ed.color || []).includes(c) ? "bg-red-500 text-white" : ""}`}
                              onClick={() => toggleInlineMulti("color", c)}>
                              {c}
                            </Badge>
                          ))}
                        </div>
                      ) : item.color.join(", ")}
                    </TableCell>
                    <TableCell className="text-xs">
                      {isEditing ? (
                        <div className="flex flex-wrap gap-0.5 max-w-[120px]">
                          {sizeOptions.map(s => (
                            <Badge key={s} variant={(ed.size || []).includes(s) ? "default" : "outline"}
                              className={`cursor-pointer text-[10px] px-1 py-0 ${(ed.size || []).includes(s) ? "bg-blue-500 text-white" : ""}`}
                              onClick={() => toggleInlineMulti("size", s)}>
                              {s}
                            </Badge>
                          ))}
                        </div>
                      ) : item.size.join(", ")}
                    </TableCell>
                    {isProcurementMode && (
                      <>
                        <TableCell className="text-xs bg-orange-50 font-medium">
                          {isEditing ? (
                            <div className="flex flex-wrap gap-0.5 max-w-[100px]">
                              {mtlOptions.map(m => {
                                const currentMtl = (pc?.mtl || "").split(",").map(s => s.trim()).filter(Boolean);
                                const isActive = currentMtl.includes(m);
                                return (
                                  <Badge key={m} variant={isActive ? "default" : "outline"}
                                    className={`cursor-pointer text-[10px] px-1 py-0 ${isActive ? "bg-orange-500 text-white" : ""}`}
                                    onClick={() => {
                                      const arr = isActive ? currentMtl.filter(x => x !== m) : [...currentMtl, m];
                                      updateInlineProcurement("mtl", arr.join(", "));
                                    }}>
                                    {m}
                                  </Badge>
                                );
                              })}
                            </div>
                          ) : pc?.mtl || "-"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {isEditing ? <Input className="h-7 text-xs w-20" value={pc?.noted || ""} onChange={(e) => updateInlineProcurement("noted", e.target.value)} /> : pc?.noted || "-"}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-right font-semibold">
                      {isEditing ? <Input type="number" className="h-7 text-xs w-16 text-right" value={ed.currentStock ?? ""} onChange={(e) => setInlineEditData(prev => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))} /> :
                        <span className={item.currentStock < item.minimumStock ? "text-red-600" : ""}>{item.currentStock}</span>}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {isEditing ? <Input type="number" className="h-7 text-xs w-16 text-right" value={ed.minimumStock ?? ""} onChange={(e) => setInlineEditData(prev => ({ ...prev, minimumStock: parseInt(e.target.value) || 0 }))} /> : item.minimumStock}
                    </TableCell>
                    {isProcurementMode && pc && (
                      <>
                        <TableCell className="text-xs text-right">
                          {isEditing ? <Input type="number" step="0.01" className="h-7 text-xs w-16 text-right" value={pc.priceYuan || ""} onChange={(e) => updateInlineProcurement("priceYuan", parseFloat(e.target.value) || 0)} /> : `¥${pc.priceYuan.toFixed(2)}`}
                        </TableCell>
                        <TableCell className="text-xs text-right text-purple-600 font-medium">
                          {isEditing ? <Input type="number" step="0.01" className="h-7 text-xs w-16 text-right" value={pc.priceTHB || ""} onChange={(e) => updateInlineProcurement("priceTHB", parseFloat(e.target.value) || 0)} /> : `฿${pc.priceTHB.toFixed(2)}`}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {isEditing ? <Input type="number" className="h-7 text-xs w-20 text-right" value={pc.amountRMB || ""} onChange={(e) => updateInlineProcurement("amountRMB", parseFloat(e.target.value) || 0)} /> : `¥${pc.amountRMB.toLocaleString()}`}
                        </TableCell>
                        <TableCell className="text-xs text-right text-purple-600 font-bold">
                          {isEditing ? <Input type="number" className="h-7 text-xs w-20 text-right" value={pc.totalTHB || ""} onChange={(e) => updateInlineProcurement("totalTHB", parseFloat(e.target.value) || 0)} /> : `฿${pc.totalTHB.toLocaleString()}`}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {isEditing ? <Input type="number" className="h-7 text-xs w-16 text-right" value={pc.pcsCtn || ""} onChange={(e) => updateInlineProcurement("pcsCtn", parseInt(e.target.value) || 0)} /> : pc.pcsCtn}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {isEditing ? <Input type="number" className="h-7 text-xs w-16 text-right" value={pc.ctn || ""} onChange={(e) => updateInlineProcurement("ctn", parseInt(e.target.value) || 0)} /> : pc.ctn}
                        </TableCell>
                        <TableCell className="text-xs">
                          {isEditing ? <Input className="h-7 text-xs w-16" value={pc.boxSize || ""} onChange={(e) => updateInlineProcurement("boxSize", e.target.value)} /> : pc.boxSize}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {isEditing ? <Input type="number" step="0.0001" className="h-7 text-xs w-20 text-right" value={pc.boxSizeNum || ""} onChange={(e) => updateInlineProcurement("boxSizeNum", parseFloat(e.target.value) || 0)} /> : pc.boxSizeNum.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {isEditing ? <Input type="number" step="0.01" className="h-7 text-xs w-20 text-right" value={pc.shippingCost || ""} onChange={(e) => updateInlineProcurement("shippingCost", parseFloat(e.target.value) || 0)} /> : pc.shippingCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-right text-muted-foreground">
                          {pc.shippingPerPiece.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-right text-green-600 font-bold">
                          {pc.totalShipping.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {isEditing ? <Input type="number" step="0.0001" className="h-7 text-xs w-20 text-right" value={pc.meas || ""} onChange={(e) => updateInlineProcurement("meas", parseFloat(e.target.value) || 0)} /> : pc.meas.toFixed(4)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {isEditing ? <Input type="number" step="0.01" className="h-7 text-xs w-16 text-right" value={pc.gw || ""} onChange={(e) => updateInlineProcurement("gw", parseFloat(e.target.value) || 0)} /> : pc.gw.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-xs text-right">
                          {isEditing ? <Input type="number" className="h-7 text-xs w-16 text-right" value={pc.tgw || ""} onChange={(e) => updateInlineProcurement("tgw", parseFloat(e.target.value) || 0)} /> : pc.tgw}
                        </TableCell>
                      </>
                    )}
                    {isProcurementMode && !pc && (
                      <>
                        {Array.from({ length: 14 }).map((_, i) => <TableCell key={i} className="text-xs text-center text-muted-foreground">-</TableCell>)}
                      </>
                    )}
                    <TableCell>{getStatusBadge(item.status, item.currentStock)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {isEditing ? (
                          <>
                            <Button size="sm" className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700" onClick={saveInlineEdit}>
                              <CheckCircle2 className="w-3 h-3 mr-1" /> บันทึก
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={cancelInlineEdit}>
                              <X className="w-3 h-3 mr-1" /> ยกเลิก
                            </Button>
                          </>
                        ) : (
                          <>
                            {!isReadOnlyMode && (
                              <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { setAdjustItem(item); setAdjustType("รับเข้า"); setAdjustQty(""); setAdjustNote(""); }}>
                                <RefreshCw className="w-3 h-3 mr-1" /> ปรับสต๊อก
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" onClick={() => setDetailItem(item)}>
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-600" onClick={() => startInlineEdit(item)}>
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            {!isReadOnlyMode && (
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteProduct(item)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isReadOnlyMode ? "รายการสินค้า" : "จัดการสินค้า"}</h1>
          <p className="text-muted-foreground">{isReadOnlyMode ? "ดูรายการสินค้าและสต็อกคงเหลือ" : "จัดการข้อมูลสินค้า เพิ่ม แก้ไข ลบ และปรับปรุงสต๊อก"}</p>
        </div>
        <div className="flex gap-2">
          {isProcurementMode && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowImportDialog(true)}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> นำเข้าจาก Excel
            </Button>
          )}
          {!isReadOnlyMode && (
            <>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => { setAdjustType("รับเข้า"); }}>
                <Plus className="w-4 h-4 mr-2" /> รับเข้า
              </Button>
              <Button variant="outline" onClick={() => { setAdjustType("จ่ายออก"); }}>
                <Minus className="w-4 h-4 mr-2" /> จ่ายออก
              </Button>
            </>
          )}
          <Button className="bg-red-600 hover:bg-red-700" onClick={openAddModal}>
            <Plus className="w-4 h-4 mr-2" /> เพิ่มสินค้า
          </Button>
        </div>
      </div>

      {/* Summary Cards - 4 cards like InventoryManagement */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "products" ? "ring-2 ring-primary" : ""}`} onClick={() => setActiveTab("products")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายการสินค้าทั้งหมด</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.total}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => { setActiveTab("products"); setStatusFilter("low_stock"); }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สินค้าใกล้หมด/ขาดแคลน</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summaryStats.lowStock + summaryStats.outOfStock}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "defective" ? "ring-2 ring-primary" : ""}`} onClick={() => setActiveTab("defective")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สินค้ามีตำหนิ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{summaryStats.defective}</div>
            <p className="text-xs text-muted-foreground">ชิ้น</p>
          </CardContent>
        </Card>

        <Card className={`cursor-pointer transition-all hover:shadow-md ${activeTab === "history" ? "ring-2 ring-primary" : ""}`} onClick={() => setActiveTab("history")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เคลื่อนไหววันนี้</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.todayMovements}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" /> สินค้า
          </TabsTrigger>
          {!isReadOnlyMode && (
            <TabsTrigger value="in-out" className="flex items-center gap-2">
              <ArrowDownCircle className="w-4 h-4" /> รับเข้า/จ่ายออก
            </TabsTrigger>
          )}
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" /> ประวัติเคลื่อนไหว
          </TabsTrigger>
          {!isReadOnlyMode && (
            <TabsTrigger value="defective" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> สินค้ามีตำหนิ
            </TabsTrigger>
          )}
        </TabsList>

        {/* Tab: Products */}
        <TabsContent value="products" className="space-y-4">
          {/* Search + View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="ค้นหาชื่อ, รหัสสินค้า, แท็ก..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button variant={viewMode === "card" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("card")} className="h-8">
                <LayoutGrid className="w-4 h-4 mr-1" /> Card
              </Button>
              <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("table")} className="h-8">
                <List className="w-4 h-4 mr-1" /> Table
              </Button>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "ทั้งหมด" },
              { key: "in_stock", label: "มีในสต็อก" },
              { key: "low_stock", label: "ใกล้หมด" },
              { key: "out_of_stock", label: "หมด" },
            ].map((s) => (
              <Button key={s.key} variant={statusFilter === s.key ? "default" : "outline"} size="sm"
                onClick={() => setStatusFilter(s.key)}>
                {s.label}
              </Button>
            ))}
          </div>

          {/* Category Filter */}
          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" /> ค้นหาตามหมวดหมู่
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Button key={cat.key} variant={selectedCategory === cat.key ? "default" : "outline"} size="sm"
                    onClick={() => { setSelectedCategory(cat.key); setSelectedSubcategory("all"); }}
                    className={selectedCategory === cat.key ? "bg-red-500 hover:bg-red-600 text-white" : ""}>
                    {cat.label}
                  </Button>
                ))}
              </div>
              {subcategories.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">หมวดหมู่ย่อย</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant={selectedSubcategory === "all" ? "default" : "outline"} size="sm"
                      onClick={() => setSelectedSubcategory("all")}
                      className={selectedSubcategory === "all" ? "bg-red-500 hover:bg-red-600 text-white" : ""}>
                      ทั้งหมด
                    </Button>
                    {subcategories.map((sub) => (
                      <Button key={sub} variant={selectedSubcategory === sub ? "default" : "outline"} size="sm"
                        onClick={() => setSelectedSubcategory(sub)}
                        className={selectedSubcategory === sub ? "bg-red-500 hover:bg-red-600 text-white" : ""}>
                        {sub}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Result Count */}
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-semibold">{filteredItems.length}</span> รายการ
          </p>

          {/* Content */}
          {viewMode === "card" ? renderCardView() : renderTableView()}
        </TabsContent>

        {/* Tab: Receive/Issue */}
        {!isReadOnlyMode && (
          <TabsContent value="in-out" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <ArrowDownCircle className="w-5 h-5" /> รับเข้าสินค้า
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>รายการสินค้า</Label><Input placeholder="เลือกหรือพิมพ์ชื่อสินค้า" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>จำนวน</Label><Input type="number" placeholder="0" /></div>
                    <div className="space-y-2"><Label>หน่วย</Label><Input placeholder="ชิ้น" disabled /></div>
                  </div>
                  <div className="space-y-2"><Label>หมายเหตุ</Label><Textarea placeholder="เช่น รับจากซัพพลายเออร์, เลขที่ PO" /></div>
                  <Button className="w-full bg-green-600 hover:bg-green-700"><Plus className="w-4 h-4 mr-2" /> บันทึกรับเข้า</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <ArrowUpCircle className="w-5 h-5" /> จ่ายออกสินค้า
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label>รายการสินค้า</Label><Input placeholder="เลือกหรือพิมพ์ชื่อสินค้า" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>จำนวน</Label><Input type="number" placeholder="0" /></div>
                    <div className="space-y-2"><Label>หน่วย</Label><Input placeholder="ชิ้น" disabled /></div>
                  </div>
                  <div className="space-y-2"><Label>อ้างอิง Order</Label><Input placeholder="เช่น ORD-001" /></div>
                  <div className="space-y-2"><Label>หมายเหตุ</Label><Textarea placeholder="รายละเอียดเพิ่มเติม" /></div>
                  <Button className="w-full" variant="destructive"><Minus className="w-4 h-4 mr-2" /> บันทึกจ่ายออก</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Tab: Movement History */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="ค้นหาประวัติ..." className="pl-10" />
            </div>
            <Button variant="outline">วันนี้</Button>
            <Button variant="outline">สัปดาห์นี้</Button>
            <Button variant="outline">เดือนนี้</Button>
          </div>
          <Card>
            <CardHeader><CardTitle>ประวัติการเคลื่อนไหวสินค้า</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัส</TableHead><TableHead>วันที่</TableHead><TableHead>ประเภท</TableHead>
                    <TableHead>สินค้า</TableHead><TableHead>จำนวน</TableHead><TableHead>หน่วย</TableHead>
                    <TableHead>ผู้ดำเนินการ</TableHead><TableHead>หมายเหตุ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { id: "MOV-001", date: "2025-02-10", type: "รับเข้า", item: "ถ้วยรางวัลสีทอง", qty: 100, unit: "ชิ้น", by: "สมชาย", note: "รับจากซัพพลายเออร์" },
                    { id: "MOV-002", date: "2025-02-10", type: "จ่ายออก", item: "เหรียญพลาสติก", qty: 50, unit: "ชิ้น", by: "วิชัย", note: "เบิกใช้งาน ORD-003" },
                    { id: "MOV-003", date: "2025-02-09", type: "รับเข้า", item: "โล่คริสตัลพรีเมียม", qty: 30, unit: "ชิ้น", by: "สมชาย", note: "รับจากซัพพลายเออร์" },
                    { id: "MOV-004", date: "2025-02-09", type: "จ่ายออก", item: "ถ้วยรางวัลสีเงิน", qty: 15, unit: "ชิ้น", by: "มานะ", note: "เบิกใช้งาน ORD-010" },
                    { id: "MOV-005", date: "2025-02-08", type: "ปรับยอด", item: "ฝาครอบพลาสติก", qty: -5, unit: "ชิ้น", by: "สุชาติ", note: "สินค้าชำรุด" },
                  ].map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="font-medium">{mov.id}</TableCell>
                      <TableCell>{mov.date}</TableCell>
                      <TableCell>
                        {mov.type === "รับเข้า" ? <Badge className="bg-green-100 text-green-700"><ArrowDownCircle className="w-3 h-3 mr-1" />{mov.type}</Badge> :
                         mov.type === "จ่ายออก" ? <Badge className="bg-red-100 text-red-700"><ArrowUpCircle className="w-3 h-3 mr-1" />{mov.type}</Badge> :
                         <Badge className="bg-blue-100 text-blue-700">{mov.type}</Badge>}
                      </TableCell>
                      <TableCell>{mov.item}</TableCell>
                      <TableCell className={mov.qty > 0 ? "text-green-600" : "text-red-600"}>
                        {mov.qty > 0 ? `+${mov.qty}` : mov.qty}
                      </TableCell>
                      <TableCell>{mov.unit}</TableCell>
                      <TableCell>{mov.by}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{mov.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Defective Items */}
        {!isReadOnlyMode && (
          <TabsContent value="defective" className="space-y-4">
            <DefectiveItemsTab />
          </TabsContent>
        )}
      </Tabs>

      {/* ===== Add/Edit Product Modal ===== */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
            {/* Left: Images */}
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/20 min-h-[200px]">
                {form.image ? (
                  <img src={form.image} alt="Product" className="w-full h-40 object-contain mb-2" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 opacity-40" />
                    <span className="text-sm">รูปภาพหลัก</span>
                  </div>
                )}
                <Button size="sm" variant="destructive" className="mt-2" onClick={handleMainImageUpload}>
                  <Upload className="w-3 h-3 mr-1" /> อัพโหลดรูปภาพ
                </Button>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">รูปภาพเพิ่มเติม</p>
                <div className="border-2 border-dashed rounded-lg p-4 flex items-center justify-center bg-muted/20 cursor-pointer hover:bg-muted/30"
                  onClick={() => { toast.info("เพิ่มรูปภาพ (ระบบจำลอง)"); }}>
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageIcon className="w-6 h-6 opacity-40" />
                    <span className="text-xs">เพิ่มรูปภาพ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form fields */}
            <div className="space-y-4">
              {/* Product Type */}
              <div className="space-y-1.5">
                <Label>ประเภทสินค้า</Label>
                <Select value={form.productType} onValueChange={(v) => setForm(prev => ({ ...prev, productType: v, category: v, subcategory: "" }))}>
                  <SelectTrigger><SelectValue placeholder="เลือกประเภทสินค้า" /></SelectTrigger>
                  <SelectContent>
                    {productTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <Label>ชื่อสินค้า (สำหรับแสดงลูกค้า)</Label>
                <Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="ชื่อสินค้า" />
              </div>

              {/* Code */}
              <div className="space-y-1.5">
                <Label>รหัสสินค้า</Label>
                <Input value={form.code} onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))} placeholder="รหัสสินค้า" />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label>รายละเอียด</Label>
                <Textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="รายละเอียดสินค้า" rows={3} />
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>หมวดหมู่</Label>
                  <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v, subcategory: "" }))}>
                    <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                    <SelectContent>
                      {productTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>หมวดหมู่ย่อย</Label>
                  <Select value={form.subcategory} onValueChange={(v) => setForm(prev => ({ ...prev, subcategory: v }))}>
                    <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่ย่อย" /></SelectTrigger>
                    <SelectContent>
                      {(subcategoryMap[form.category] || []).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Color & Tags */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>สี</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {colorOptions.map(c => (
                      <Badge key={c} variant={form.color.includes(c) ? "default" : "outline"}
                        className={`cursor-pointer text-xs ${form.color.includes(c) ? "bg-red-500 text-white" : ""}`}
                        onClick={() => setForm(prev => ({
                          ...prev,
                          color: prev.color.includes(c) ? prev.color.filter(x => x !== c) : [...prev.color, c],
                        }))}>
                        {c}
                      </Badge>
                    ))}
                  </div>
                  {form.color.length > 0 && (
                    <Button variant="link" size="sm" className="text-red-500 h-auto p-0 text-xs"
                      onClick={() => setForm(prev => ({ ...prev, color: [] }))}>
                      ล้างสีทั้งหมด
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Tags</Label>
                  <Input value={form.tags} onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="#Tags" />
                </div>
              </div>

              {/* Production Time */}
              <div className="space-y-1.5">
                <Label>ระยะเวลาการผลิต</Label>
                {form.productionTime.map((pt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input type="number" className="w-20" value={pt.value || ""} onChange={(e) => {
                      const updated = [...form.productionTime];
                      updated[idx] = { ...updated[idx], value: parseInt(e.target.value) || 0 };
                      setForm(prev => ({ ...prev, productionTime: updated }));
                    }} />
                    <Select value={pt.unit} onValueChange={(v) => {
                      const updated = [...form.productionTime];
                      updated[idx] = { ...updated[idx], unit: v as "วัน" | "สัปดาห์" };
                      setForm(prev => ({ ...prev, productionTime: updated }));
                    }}>
                      <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="วัน">วัน</SelectItem>
                        <SelectItem value="สัปดาห์">สัปดาห์</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive"
                      onClick={() => setForm(prev => ({ ...prev, productionTime: prev.productionTime.filter((_, i) => i !== idx) }))}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="destructive" size="sm"
                  onClick={() => setForm(prev => ({ ...prev, productionTime: [...prev.productionTime, { value: 0, unit: "วัน" }] }))}>
                  + เพิ่มระยะเวลาการผลิต
                </Button>
              </div>

              {/* Size */}
              <div className="space-y-1.5">
                <Label>ขนาด</Label>
                <div className="flex flex-wrap gap-1.5">
                  {sizeOptions.map(s => (
                    <Badge key={s} variant={form.size.includes(s) ? "default" : "outline"}
                      className={`cursor-pointer text-xs ${form.size.includes(s) ? "bg-blue-500 text-white" : ""}`}
                      onClick={() => setForm(prev => ({
                        ...prev,
                        size: prev.size.includes(s) ? prev.size.filter(x => x !== s) : [...prev.size, s],
                      }))}>
                      {s}
                    </Badge>
                  ))}
                </div>
                {form.size.length > 0 && (
                  <Button variant="link" size="sm" className="text-blue-500 h-auto p-0 text-xs"
                    onClick={() => setForm(prev => ({ ...prev, size: [] }))}>
                    ล้างขนาดทั้งหมด
                  </Button>
                )}
                <div className="flex gap-2">
                  <Input placeholder="เพิ่มขนาดอื่นๆ" value={newSize} onChange={(e) => setNewSize(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && newSize.trim()) { setForm(prev => ({ ...prev, size: [...prev.size, newSize.trim()] })); setNewSize(""); } }} />
                  <Button variant="outline" size="sm" onClick={() => { if (newSize.trim()) { setForm(prev => ({ ...prev, size: [...prev.size, newSize.trim()] })); setNewSize(""); } }}>
                    เพิ่ม
                  </Button>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-1.5">
                <Label>Options</Label>
                <div className="border rounded-lg divide-y">
                  {optionsList.map(opt => (
                    <label key={opt} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 cursor-pointer">
                      <Checkbox
                        checked={form.options.includes(opt)}
                        onCheckedChange={(checked) => setForm(prev => ({
                          ...prev,
                          options: checked ? [...prev.options, opt] : prev.options.filter(o => o !== opt),
                        }))} />
                      <span className="text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prices */}
              <div className="space-y-1.5">
                <Label>ราคา</Label>
                <Button variant="destructive" size="sm" className="mb-2"
                  onClick={() => setForm(prev => ({ ...prev, prices: [...prev.prices, { model: "", retailPrice: 0, moldCost: 0, specialPrice: 0 }] }))}>
                  + เพิ่มราคา
                </Button>
                {form.prices.map((price, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end">
                    <div className="space-y-1">
                      {idx === 0 && <Label className="text-xs">รหัสสินค้า (Model)</Label>}
                      <Input value={price.model} onChange={(e) => {
                        const updated = [...form.prices]; updated[idx] = { ...updated[idx], model: e.target.value };
                        setForm(prev => ({ ...prev, prices: updated }));
                      }} placeholder="Model" />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <Label className="text-xs">ราคาปลีก</Label>}
                      <Input type="number" value={price.retailPrice || ""} onChange={(e) => {
                        const updated = [...form.prices]; updated[idx] = { ...updated[idx], retailPrice: parseFloat(e.target.value) || 0 };
                        setForm(prev => ({ ...prev, prices: updated }));
                      }} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <Label className="text-xs">{isSalesMode ? "ราคาส่ง" : "ค่าโมล"}</Label>}
                      <Input type="number" value={price.moldCost || ""} onChange={(e) => {
                        const updated = [...form.prices]; updated[idx] = { ...updated[idx], moldCost: parseFloat(e.target.value) || 0 };
                        setForm(prev => ({ ...prev, prices: updated }));
                      }} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      {idx === 0 && <Label className="text-xs">ราคาพิเศษ</Label>}
                      <Input type="number" value={price.specialPrice || ""} onChange={(e) => {
                        const updated = [...form.prices]; updated[idx] = { ...updated[idx], specialPrice: parseFloat(e.target.value) || 0 };
                        setForm(prev => ({ ...prev, prices: updated }));
                      }} placeholder="0" />
                    </div>
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive"
                      onClick={() => setForm(prev => ({ ...prev, prices: prev.prices.filter((_, i) => i !== idx) }))}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Procurement Cost Fields */}
              {isProcurementMode && (
                <div className="space-y-4 border-t pt-4 mt-4">
                  <Label className="text-base font-bold">ข้อมูลต้นทุนจัดซื้อ</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">MANUFACT (โรงงาน)</Label>
                      <Select value={form.procurementCost?.manufact || ""} onValueChange={(v) => setForm(prev => ({ ...prev, procurementCost: { ...(prev.procurementCost || emptyProcurementCost), manufact: v } }))}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="เลือกโรงงาน" /></SelectTrigger>
                        <SelectContent>{manufactOptions.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">MTL (วัสดุ)</Label>
                      <div className="flex flex-wrap gap-1 border rounded-md p-2 min-h-[36px]">
                        {mtlOptions.map(m => {
                          const currentMtl = (form.procurementCost?.mtl || "").split(",").map(s => s.trim()).filter(Boolean);
                          const isActive = currentMtl.includes(m);
                          return (
                            <Badge key={m} variant={isActive ? "default" : "outline"}
                              className={`cursor-pointer text-xs ${isActive ? "bg-orange-500 text-white" : ""}`}
                              onClick={() => {
                                const arr = isActive ? currentMtl.filter(x => x !== m) : [...currentMtl, m];
                                setForm(prev => ({ ...prev, procurementCost: { ...(prev.procurementCost || emptyProcurementCost), mtl: arr.join(", ") } }));
                              }}>
                              {m}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Noted</Label>
                      <Input value={form.procurementCost?.noted || ""} onChange={(e) => setForm(prev => ({ ...prev, procurementCost: { ...(prev.procurementCost || emptyProcurementCost), noted: e.target.value } }))} placeholder="หมายเหตุ" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">PRICE (¥)</Label>
                      <Input type="number" value={form.procurementCost?.priceYuan || ""} onChange={(e) => setForm(prev => ({ ...prev, procurementCost: { ...(prev.procurementCost || emptyProcurementCost), priceYuan: parseFloat(e.target.value) || 0 } }))} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">บาท (THB)</Label>
                      <Input type="number" value={form.procurementCost?.priceTHB || ""} onChange={(e) => setForm(prev => ({ ...prev, procurementCost: { ...(prev.procurementCost || emptyProcurementCost), priceTHB: parseFloat(e.target.value) || 0 } }))} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">AMOUNT RMB</Label>
                      <Input type="number" value={form.procurementCost?.amountRMB || ""} onChange={(e) => setForm(prev => ({ ...prev, procurementCost: { ...(prev.procurementCost || emptyProcurementCost), amountRMB: parseFloat(e.target.value) || 0 } }))} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ราคารวม THB</Label>
                      <Input type="number" value={form.procurementCost?.totalTHB || ""} onChange={(e) => setForm(prev => ({ ...prev, procurementCost: { ...(prev.procurementCost || emptyProcurementCost), totalTHB: parseFloat(e.target.value) || 0 } }))} placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">PCS/CTN</Label>
                      <Input type="number" value={form.procurementCost?.pcsCtn || ""} onChange={(e) => {
                        const pcsCtn = parseInt(e.target.value) || 0;
                        setForm(prev => {
                          const pc = { ...(prev.procurementCost || emptyProcurementCost), pcsCtn };
                          pc.shippingPerPiece = pcsCtn > 0 ? pc.shippingCost / pcsCtn : 0;
                          return { ...prev, procurementCost: pc };
                        });
                      }} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">CTN</Label>
                      <Input type="number" value={form.procurementCost?.ctn || ""} onChange={(e) => {
                        const ctn = parseInt(e.target.value) || 0;
                        setForm(prev => {
                          const pc = { ...(prev.procurementCost || emptyProcurementCost), ctn };
                          pc.totalShipping = pc.shippingCost * ctn;
                          return { ...prev, procurementCost: pc };
                        });
                      }} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">BOX SIZE</Label>
                      <Input value={form.procurementCost?.boxSize || ""} onChange={(e) => setForm(prev => ({ ...prev, procurementCost: { ...(prev.procurementCost || emptyProcurementCost), boxSize: e.target.value } }))} placeholder="เช่น B2" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">BOX SIZE (ตัวเลข)</Label>
                      <Input type="number" step="0.0001" value={form.procurementCost?.boxSizeNum || ""} onChange={(e) => setForm(prev => ({ ...prev, procurementCost: { ...(prev.procurementCost || emptyProcurementCost), boxSizeNum: parseFloat(e.target.value) || 0 } }))} placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">ค่าขนส่ง</Label>
                      <Input type="number" value={form.procurementCost?.shippingCost || ""} onChange={(e) => {
                        const cost = parseFloat(e.target.value) || 0;
                        setForm(prev => {
                          const pc = { ...(prev.procurementCost || emptyProcurementCost), shippingCost: cost };
                          pc.shippingPerPiece = pc.pcsCtn > 0 ? cost / pc.pcsCtn : 0;
                          pc.totalShipping = cost * pc.ctn;
                          return { ...prev, procurementCost: pc };
                        });
                      }} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ค่าขนส่ง/ชิ้น (อัตโนมัติ)</Label>
                      <Input type="number" step="0.01" value={form.procurementCost?.shippingPerPiece?.toFixed(2) || "0"} disabled className="bg-muted" />
                      <p className="text-[10px] text-muted-foreground">= ค่าขนส่ง ÷ PCS/CTN</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-green-600">รวมขนส่ง (อัตโนมัติ)</Label>
                      <Input type="number" step="0.01" value={form.procurementCost?.totalShipping?.toFixed(2) || "0"} disabled className="bg-muted" />
                      <p className="text-[10px] text-muted-foreground">= ค่าขนส่ง × CTN</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">MEAS</Label>
                      <Input type="number" step="0.0001" value={form.procurementCost?.meas || ""} onChange={(e) => setForm(prev => ({ ...prev, procurementCost: { ...(prev.procurementCost || emptyProcurementCost), meas: parseFloat(e.target.value) || 0 } }))} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">GW</Label>
                      <Input type="number" step="0.01" value={form.procurementCost?.gw || ""} onChange={(e) => setForm(prev => ({ ...prev, procurementCost: { ...(prev.procurementCost || emptyProcurementCost), gw: parseFloat(e.target.value) || 0 } }))} placeholder="0" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">T.GW</Label>
                      <Input type="number" value={form.procurementCost?.tgw || ""} onChange={(e) => setForm(prev => ({ ...prev, procurementCost: { ...(prev.procurementCost || emptyProcurementCost), tgw: parseFloat(e.target.value) || 0 } }))} placeholder="0" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowModal(false)}>ยกเลิก</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleSaveProduct}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Stock Adjustment Dialog ===== */}
      <Dialog open={!!adjustItem} onOpenChange={(open) => !open && setAdjustItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5 text-primary" /> ปรับปรุงสต๊อก</DialogTitle>
          </DialogHeader>
          {adjustItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                {adjustItem.image ? <img src={adjustItem.image} alt={adjustItem.name} className="w-12 h-12 object-contain rounded border bg-white p-0.5" /> :
                  <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center"><Package className="w-5 h-5 text-muted-foreground" /></div>}
                <div>
                  <p className="font-semibold text-sm">{adjustItem.name}</p>
                  <p className="text-xs text-muted-foreground">{adjustItem.code} • คงเหลือ: <span className="font-bold text-foreground">{adjustItem.currentStock}</span> {adjustItem.unit}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">ประเภท</Label>
                <div className="flex gap-2">
                  <Button variant={adjustType === "รับเข้า" ? "default" : "outline"} className={adjustType === "รับเข้า" ? "bg-green-600 hover:bg-green-700 flex-1" : "flex-1"} onClick={() => setAdjustType("รับเข้า")}>
                    <ArrowDownCircle className="w-4 h-4 mr-1.5" /> รับเข้า
                  </Button>
                  <Button variant={adjustType === "จ่ายออก" ? "destructive" : "outline"} className="flex-1" onClick={() => setAdjustType("จ่ายออก")}>
                    <ArrowUpCircle className="w-4 h-4 mr-1.5" /> จ่ายออก
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">จำนวน ({adjustItem.unit})</Label>
                <Input type="number" min={1} placeholder="กรอกจำนวน" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} />
                {adjustType === "จ่ายออก" && parseInt(adjustQty) > adjustItem.currentStock && (
                  <p className="text-xs text-destructive">⚠️ จำนวนเกินสต๊อกคงเหลือ ({adjustItem.currentStock} {adjustItem.unit})</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">หมายเหตุ</Label>
                <Textarea placeholder="เช่น รับจากซัพพลายเออร์" value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAdjustItem(null)}>ยกเลิก</Button>
            <Button onClick={handleAdjustSubmit} className={adjustType === "รับเข้า" ? "bg-green-600 hover:bg-green-700" : ""} variant={adjustType === "จ่ายออก" ? "destructive" : "default"}>
              {adjustType === "รับเข้า" ? <><ArrowDownCircle className="w-4 h-4 mr-1.5" />ยืนยันรับเข้า</> : <><ArrowUpCircle className="w-4 h-4 mr-1.5" />ยืนยันจ่ายออก</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Detail Dialog ===== */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-blue-600" /> รายละเอียดสินค้า</DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-5">
              <div className="flex gap-4">
                {detailItem.image ? <img src={detailItem.image} alt={detailItem.name} className="w-24 h-24 object-contain rounded-lg border bg-white p-2 flex-shrink-0" /> :
                  <div className="w-24 h-24 rounded-lg border bg-muted flex items-center justify-center flex-shrink-0"><Package className="w-8 h-8 text-muted-foreground" /></div>}
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-red-600">{detailItem.name}</h3>
                  <p className="text-sm text-muted-foreground">รหัส: <span className="font-mono font-semibold text-foreground">{detailItem.code}</span></p>
                  <div className="pt-1">{getStatusBadge(detailItem.status, detailItem.currentStock)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-0.5"><p className="text-muted-foreground text-xs">หมวดหมู่</p><p className="font-medium">{detailItem.category}</p></div>
                <div className="space-y-0.5"><p className="text-muted-foreground text-xs">หมวดหมู่ย่อย</p><p className="font-medium">{detailItem.subcategory}</p></div>
                <div className="space-y-0.5"><p className="text-muted-foreground text-xs">Model</p><p className="font-medium">{detailItem.model || "-"}</p></div>
                <div className="space-y-0.5"><p className="text-muted-foreground text-xs">สี</p><p className="font-medium">{detailItem.color.join(", ") || "-"}</p></div>
                <div className="space-y-0.5"><p className="text-muted-foreground text-xs">ขนาด</p><p className="font-medium">{detailItem.size.join(", ") || "-"}</p></div>
                <div className="space-y-0.5"><p className="text-muted-foreground text-xs">หน่วย</p><p className="font-medium">{detailItem.unit}</p></div>
                <div className="space-y-0.5"><p className="text-muted-foreground text-xs">คงเหลือ</p><p className="font-bold text-lg">{detailItem.currentStock}</p></div>
                <div className="space-y-0.5"><p className="text-muted-foreground text-xs">สต๊อกขั้นต่ำ</p><p className="font-medium">{detailItem.minimumStock}</p></div>
                <div className="space-y-0.5"><p className="text-muted-foreground text-xs">Tags</p><p className="font-medium">{detailItem.tags || "-"}</p></div>
                <div className="space-y-0.5"><p className="text-muted-foreground text-xs">อัปเดตล่าสุด</p><p className="font-medium">{detailItem.lastUpdated}</p></div>
              </div>
              {detailItem.description && (
                <div className="space-y-0.5"><p className="text-muted-foreground text-xs">รายละเอียด</p><p className="text-sm">{detailItem.description}</p></div>
              )}
              {detailItem.options.length > 0 && (
                <div className="space-y-1"><p className="text-xs font-semibold">Options</p><div className="flex flex-wrap gap-1">{detailItem.options.map(o => <Badge key={o} variant="outline" className="text-xs">{o}</Badge>)}</div></div>
              )}
              {detailItem.prices.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold">ราคา</p>
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50"><TableHead className="text-xs">Model</TableHead><TableHead className="text-xs text-right">ราคาปลีก</TableHead><TableHead className="text-xs text-right">{isSalesMode ? "ราคาส่ง" : "ค่าโมล"}</TableHead><TableHead className="text-xs text-right">ราคาพิเศษ</TableHead></TableRow></TableHeader>
                    <TableBody>{detailItem.prices.map((p, i) => (
                      <TableRow key={i}><TableCell className="text-xs">{p.model}</TableCell><TableCell className="text-xs text-right">{p.retailPrice.toLocaleString()}</TableCell><TableCell className="text-xs text-right">{p.moldCost.toLocaleString()}</TableCell><TableCell className="text-xs text-right">{p.specialPrice.toLocaleString()}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </div>
              )}
              {/* Procurement Cost Details */}
              {isProcurementMode && detailItem.procurementCost && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold">ข้อมูลต้นทุนจัดซื้อ</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">MANUFACT</p><p className="font-medium">{detailItem.procurementCost.manufact || "-"}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">MTL</p><p className="font-medium">{detailItem.procurementCost.mtl || "-"}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">Noted</p><p className="font-medium">{detailItem.procurementCost.noted || "-"}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">PRICE (¥)</p><p className="font-medium">¥{detailItem.procurementCost.priceYuan.toFixed(2)}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">บาท</p><p className="font-medium text-purple-600">฿{detailItem.procurementCost.priceTHB.toFixed(2)}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">AMOUNT RMB</p><p className="font-medium">¥{detailItem.procurementCost.amountRMB.toLocaleString()}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">ราคารวม THB</p><p className="font-bold text-purple-600">฿{detailItem.procurementCost.totalTHB.toLocaleString()}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">PCS/CTN</p><p className="font-medium">{detailItem.procurementCost.pcsCtn}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">CTN</p><p className="font-medium">{detailItem.procurementCost.ctn}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">BOX SIZE</p><p className="font-medium">{detailItem.procurementCost.boxSize} ({detailItem.procurementCost.boxSizeNum.toFixed(4)})</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">ค่าขนส่ง</p><p className="font-medium">{detailItem.procurementCost.shippingCost.toFixed(2)}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">ค่าขนส่ง/ชิ้น</p><p className="font-medium">{detailItem.procurementCost.shippingPerPiece.toFixed(2)}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">รวมขนส่ง</p><p className="font-bold text-green-600">{detailItem.procurementCost.totalShipping.toFixed(2)}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">MEAS</p><p className="font-medium">{detailItem.procurementCost.meas.toFixed(4)}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">GW</p><p className="font-medium">{detailItem.procurementCost.gw.toFixed(2)}</p></div>
                    <div className="space-y-0.5"><p className="text-muted-foreground text-xs">T.GW</p><p className="font-medium">{detailItem.procurementCost.tgw}</p></div>
                  </div>
                </div>
              )}
              {/* BOM */}
              {detailItem.bom && detailItem.bom.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5"><Package className="w-4 h-4 text-blue-600" /> รายการชิ้นส่วน (BOM)</h4>
                  <Table><TableHeader><TableRow className="bg-muted/50"><TableHead className="text-xs">รหัส</TableHead><TableHead className="text-xs">ชื่อ</TableHead><TableHead className="text-xs text-right">จำนวน</TableHead><TableHead className="text-xs">หน่วย</TableHead></TableRow></TableHeader>
                    <TableBody>{detailItem.bom.map(c => <TableRow key={c.id}><TableCell className="text-xs">{c.id}</TableCell><TableCell className="text-xs">{c.name}</TableCell><TableCell className="text-xs text-right">{c.qty}</TableCell><TableCell className="text-xs">{c.unit}</TableCell></TableRow>)}</TableBody>
                  </Table>
                </div>
              )}
              {/* Movement History */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5"><Clock className="w-4 h-4 text-muted-foreground" /> ประวัติการรับ-จ่ายย้อนหลัง (ล่าสุด 10 รายการ)</h4>
                {(detailItem.movementHistory && detailItem.movementHistory.length > 0) ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {detailItem.movementHistory.slice(0, 10).map(log => (
                      <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg border bg-muted/20 text-sm">
                        <div className="mt-0.5">{log.type === "รับเข้า" ? <ArrowDownCircle className="w-4 h-4 text-green-600" /> : <ArrowUpCircle className="w-4 h-4 text-red-500" />}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={log.type === "รับเข้า" ? "bg-green-100 text-green-700 text-[10px] py-0 px-1.5" : "bg-red-100 text-red-700 text-[10px] py-0 px-1.5"}>{log.type}</Badge>
                            <span className="font-bold">{log.type === "รับเข้า" ? "+" : "-"}{log.qty} {detailItem.unit}</span>
                            <span className="text-xs text-muted-foreground">{log.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" /><span>{log.by}</span>{log.note && <span className="ml-1">• {log.note}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">ยังไม่มีประวัติการเคลื่อนไหว</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Excel Import Dialog */}
      {isProcurementMode && (
        <ExcelImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onImportConfirm={handleImportConfirm}
          existingSkus={existingSkus}
        />
      )}
    </div>
  );
}
