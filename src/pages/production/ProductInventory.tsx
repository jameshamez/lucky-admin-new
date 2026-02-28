import { useState, useEffect, CSSProperties, Fragment, useMemo, useRef } from "react";
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

// Master Subcategories with their parent category (IDs match API subcategoryId)
const SUBCATEGORY_MAP: Record<string, { id: string; name: string }> = {
  // ถ้วยรางวัลสำเร็จ
  "1": { id: "1", name: "ถ้วยรางวัลโลหะอิตาลี" },
  "2": { id: "2", name: "ถ้วยรางวัลโลหะจีน" },
  "3": { id: "3", name: "ถ้วยรางวัลพลาสติกอิตาลี" },
  "4": { id: "4", name: "ถ้วยรางวัลพลาสติกไทย" },
  "5": { id: "5", name: "ถ้วยรางวัลพิวเตอร์" },
  "6": { id: "6", name: "ถ้วยรางวัลเบญจรงค์" },
  // เหรียญรางวัล
  "7": { id: "7", name: "เหรียญรางวัลสำเร็จรูป" },
  "8": { id: "8", name: "เหรียญรางวัลซิงค์อัลลอย" },
  "9": { id: "9", name: "เหรียญรางวัลอะคริลิก" },
  "10": { id: "10", name: "เหรียญรางวัลอื่นๆ" },
  // โล่รางวัล
  "11": { id: "11", name: "โล่รางวัลอะคริลิก(สำเร็จ)" },
  "12": { id: "12", name: "โล่รางวัลอะคริลิก (สั่งผลิต)" },
  "13": { id: "13", name: "โล่รางวัลคริสตัล" },
  "14": { id: "14", name: "โล่รางวัลไม้" },
  "15": { id: "15", name: "โล่รางวัลเรซิน" },
  // เสื้อพิมพ์ลายและผ้า
  "16": { id: "16", name: "เสื้อคอปก" },
  "17": { id: "17", name: "เสื้อคอกลม" },
  "18": { id: "18", name: "เสื้อแขนยาว" },
  // ชิ้นส่วนถ้วยรางวัล
  "19": { id: "19", name: "หัวป้ายพลาสติก" },
  "20": { id: "20", name: "หัวป้ายตุ๊กตาพลาสติก" },
  "21": { id: "21", name: "เหรียญรางวัลอะคริลิก" },
};

// Helper: get subcategories for a main category
const getSubcategoriesForCategory = (category: string): { id: string; name: string }[] => {
  switch (category) {
    case "ถ้วยรางวัลสำเร็จ":
      return Object.values(SUBCATEGORY_MAP).filter((sub) => ["1", "2", "3", "4", "5", "6"].includes(sub.id));
    case "เหรียญรางวัล":
      return Object.values(SUBCATEGORY_MAP).filter((sub) => ["7", "8", "9", "10"].includes(sub.id));
    case "โล่รางวัล":
      return Object.values(SUBCATEGORY_MAP).filter((sub) => ["11", "12", "13", "14", "15"].includes(sub.id));
    case "เสื้อพิมพ์ลายและผ้า":
      return Object.values(SUBCATEGORY_MAP).filter((sub) => ["16", "17", "18"].includes(sub.id));
    case "ชิ้นส่วนถ้วยรางวัล":
      return Object.values(SUBCATEGORY_MAP).filter((sub) => ["19", "20", "21"].includes(sub.id));
    default:
      return [];
  }
};

// Helper: get main category from subcategoryId
const getCategoryFromSubcategoryId = (subcategoryId: string): string => {
  const id = parseInt(subcategoryId);
  if (id >= 1 && id <= 6) return "ถ้วยรางวัลสำเร็จ";
  if (id >= 7 && id <= 10) return "เหรียญรางวัล";
  if (id >= 11 && id <= 15) return "โล่รางวัล";
  if (id >= 16 && id <= 18) return "เสื้อพิมพ์ลายและผ้า";
  if (id >= 19 && id <= 21) return "ชิ้นส่วนถ้วยรางวัล";
  return "";
};

// Master size options
const MASTER_SIZES = [
  { value: "A", label: "A" }, { value: "A+", label: "A+" },
  { value: "B", label: "B" }, { value: "C", label: "C" }, { value: "D", label: "D" },
  { value: "90X2.5 CM", label: "90X2.5 CM" }, { value: "90X2 CM", label: "90X2 CM" },
];

// Coin size options for เหรียญรางวัล category
const COIN_SIZES = [
  { value: "6", label: "6 ซม." }, { value: "6.5", label: "6.5 ซม." },
  { value: "7", label: "7 ซม." }, { value: "7.5", label: "7.5 ซม." },
  { value: "8", label: "8 ซม." },
];

// Master color options
const MASTER_COLORS = [
  { value: "ดำ", label: "ดำ", image: "/colors/black.png" },
  { value: "ทอง", label: "ทอง", image: "/colors/gold.png" },
  { value: "ทองแดง", label: "ทองแดง", image: "/colors/bronze.png" },
  { value: "ทอง-แดง", label: "ทอง-แดง", image: "/colors/gold-bronze.png" },
  { value: "เงิน", label: "เงิน", image: "/colors/silver.png" },
  { value: "ขาว", label: "ขาว", image: "/colors/white.png" },
  { value: "แดง", label: "แดง", image: "/colors/red.png" },
  { value: "น้ำเงิน", label: "น้ำเงิน", image: "/colors/blue.png" },
  { value: "เขียว", label: "เขียว", image: "/colors/green.png" },
  { value: "ม่วง", label: "ม่วง", image: "/colors/purple.png" },
  { value: "ชมพู", label: "ชมพู", image: "/colors/pink.png" },
  { value: "ฟ้า", label: "ฟ้า", image: "/colors/sky.png" },
  { value: "เหลือง", label: "เหลือง", image: "/colors/yellow.png" },
  { value: "แสด", label: "แสด", image: "/colors/orange.png" },
  { value: "เทา", label: "เทา", image: "/colors/gray.png" },
];

// Special color options for Zinc Alloy Medals (เหรียญรางวัลซิงค์อัลลอย)
const ZINC_ALLOY_MEDAL_COLORS = [
  { value: "shinny_gold", label: "สีทองเงา (Shinny Gold)", image: "/colors/shinny-gold.png" },
  { value: "shinny_silver", label: "สีเงินเงา (Shinny Silver)", image: "/colors/shinny-silver.png" },
  { value: "shinny_copper", label: "สีทองแดงเงา (Shinny Copper)", image: "/colors/shinny-copper.png" },
  { value: "antique_gold", label: "สีทองรมดำ (Antique Gold)", image: "/colors/antique-gold.png" },
  { value: "antique_silver", label: "สีเงินรมดำ (Antique Silver)", image: "/colors/antique-silver.png" },
  { value: "antique_copper", label: "สีทองแดงรมดำ (Antique Copper)", image: "/colors/antique-copper.png" },
  { value: "misty_gold", label: "สีทองด้าน (Misty Gold)", image: "/colors/misty-gold.png" },
  { value: "misty_silver", label: "สีเงินด้าน (Misty Silver)", image: "/colors/misty-silver.png" },
  { value: "misty_copper", label: "สีทองแดงด้าน (Misty Copper)", image: "/colors/misty-copper.png" },
];

// Helper: get color list based on product type and subcategory
const getColorList = (_productType?: string, _category?: string, subcategoryId?: string) => {
  if (subcategoryId === "8") return ZINC_ALLOY_MEDAL_COLORS;
  return MASTER_COLORS;
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

const API_PRODUCT_URL = "https://finfinphone.com/api-lucky/portal/getProduct.php";
const BASE_IMAGE_URL = "https://finfinphone.com/api-lucky/";

// Helper: map API product -> ProductItem
function mapApiProduct(p: any): ProductItem {
  const stock = typeof p.inventory === "number" ? p.inventory : parseInt(p.inventory) || 0;
  const imageUrl = p.image ? `${BASE_IMAGE_URL}${p.image}` : "";
  const additionalImages: string[] = (p.images || []).map((img: string) => `${BASE_IMAGE_URL}${img}`);
  const colors: string[] = (p.colors || []).map((c: any) => c.color).filter(Boolean);
  const sizes: string[] = (p.sizes || [])
    .map((s: any) => s.size)
    .filter((s: string) => s && s.trim() !== "");
  const prices: PriceEntry[] = (p.prices || []).map((pr: any) => ({
    model: p.modelName || p.name,
    retailPrice: pr.retail_price || 0,
    moldCost: 0,
    specialPrice: pr.special_price || 0,
  }));
  if (prices.length === 0 && p.price > 0) {
    prices.push({ model: p.modelName || p.name, retailPrice: p.price, moldCost: 0, specialPrice: 0 });
  }
  const productionTimes: ProductionTime[] = (p.productionTimes || []).map((pt: any) => ({
    value: parseInt(pt.duration) || 0,
    unit: pt.unit === "months" ? "สัปดาห์" : "วัน",
  }));
  const rawTags: string[] = (p.tags || []).filter((t: string) => t !== "[]" && t.trim() !== "");
  const tagsStr = rawTags.join(", ");
  // Derive main category and subcategory name from subcategoryId
  const subId = p.subcategoryId || "0";
  const mainCategory = getCategoryFromSubcategoryId(subId) || p.category || "";
  const subcategoryName = SUBCATEGORY_MAP[subId]?.name || p.category || "";
  return {
    id: String(p.id),
    code: `PROD-${p.id}`,
    name: p.name,
    image: imageUrl,
    additionalImages,
    productType: mainCategory || "สินค้าทั่วไป",
    category: mainCategory || "สินค้าทั่วไป",
    subcategory: subcategoryName,
    color: colors,
    size: sizes,
    tags: tagsStr,
    description: p.description || "",
    currentStock: stock,
    minimumStock: 0,
    unit: "ชิ้น",
    model: p.modelName || "",
    productionTime: productionTimes,
    options: [],
    prices,
    lastUpdated: new Date().toISOString().split("T")[0],
    status: stock <= 0 ? "out_of_stock" : "in_stock",
    movementHistory: [],
  };
}

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
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    setApiLoading(true);
    fetch(API_PRODUCT_URL)
      .then(res => res.json())
      .then(json => {
        if (json.status === "success" && Array.isArray(json.data)) {
          setProducts(json.data.map(mapApiProduct));
        } else {
          setApiError("ไม่สามารถโหลดข้อมูลสินค้าได้");
        }
      })
      .catch(() => setApiError("เชื่อมต่อ API ไม่ได้"))
      .finally(() => setApiLoading(false));
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
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

  // New Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [productionTimes, setProductionTimes] = useState<{ duration: string; unit: string }[]>([]);

  const openEditModal = (item: ProductItem) => {
    const apiProduct: any = {
      id: item.id,
      name: item.name,
      modelName: item.model,
      description: item.description,
      category: item.category,
      subcategoryId: "",
      productType: item.productType === "สินค้าทั่วไป" ? "" : "1",
      image: item.image,
      images: item.additionalImages || [],
      colors: item.color.map((c, i) => ({ id: i, color: c, image_path: "" })),
      sizes: item.size.map((s, i) => ({ id: i, size: s, width: 0, height: 0, weight: 0 })),
      tags: item.tags ? item.tags.split(", ").filter(Boolean) : [],
      options: item.options.map((o, i) => ({ id: i, product_id: item.id, option_id: i + 1 })),
      prices: item.prices.map((p, i) => ({ id: i, retail_price: p.retailPrice, wholesale_price: p.moldCost, special_price: p.specialPrice })),
      parts: [],
    };
    for (const [id, sub] of Object.entries(SUBCATEGORY_MAP)) {
      if (sub.name === item.subcategory) {
        apiProduct.subcategoryId = id;
        break;
      }
    }
    setEditProduct(apiProduct);
    setProductionTimes(item.productionTime.map(pt => ({ duration: String(pt.value), unit: pt.unit === "สัปดาห์" ? "months" : "days" })));
    setIsEditModalOpen(true);
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setEditProduct(null);
    setProductionTimes([]);
  };

  const handleEditSave = () => {
    if (!editProduct) return;
    handleEditClose();
  };

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

  const subcategories = getSubcategoriesForCategory(selectedCategory);

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
      const matchesSearch = !term || item.name.toLowerCase().includes(term) || item.code.toLowerCase().includes(term) || item.model.toLowerCase().includes(term) || item.tags.toLowerCase().includes(term);
      const isDefectiveCategory = selectedCategory === "defective";
      const matchesCategory = selectedCategory === "all" || isDefectiveCategory || item.category === selectedCategory;
      const matchesSubcategory = selectedSubcategoryId === "" || item.subcategory === (getSubcategoriesForCategory(selectedCategory).find(s => s.id === selectedSubcategoryId)?.name || "");
      let matchesStatus = true;
      if (isDefectiveCategory) matchesStatus = item.status === "defective";
      else if (statusFilter === "in_stock") matchesStatus = item.status === "in_stock";
      else if (statusFilter === "low_stock") matchesStatus = item.status === "low_stock";
      else if (statusFilter === "out_of_stock") matchesStatus = item.status === "out_of_stock";
      else if (statusFilter === "defective") matchesStatus = item.status === "defective";
      return matchesSearch && matchesCategory && matchesSubcategory && matchesStatus;
    });
  }, [searchTerm, selectedCategory, selectedSubcategoryId, statusFilter, products]);

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
                      {isEditing ? <Input className="h-7 text-xs w-24" value={ed.model || ""} onChange={(e) => setInlineEditData(prev => ({ ...prev, model: e.target.value }))} /> : item.model}
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

  if (apiLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">กำลังโหลดข้อมูลสินค้า...</p>
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
          <p className="font-medium text-destructive">{apiError}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>ลองใหม่</Button>
        </div>
      </div>
    );
  }

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
                    onClick={() => { setSelectedCategory(cat.key); setSelectedSubcategoryId(""); }}
                    className={selectedCategory === cat.key ? "bg-red-500 hover:bg-red-600 text-white" : ""}>
                    {cat.label}
                  </Button>
                ))}
              </div>
              {subcategories.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">หมวดหมู่ย่อย</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant={selectedSubcategoryId === "" ? "default" : "outline"} size="sm"
                      onClick={() => setSelectedSubcategoryId("")}
                      className={selectedSubcategoryId === "" ? "bg-red-500 hover:bg-red-600 text-white" : ""}>
                      ทั้งหมด
                    </Button>
                    {subcategories.map((subcategory) => (
                      <Button key={subcategory.id} variant={selectedSubcategoryId === subcategory.id ? "default" : "outline"} size="sm"
                        onClick={() => setSelectedSubcategoryId(subcategory.id)}
                        className={selectedSubcategoryId === subcategory.id ? "bg-red-500 hover:bg-red-600 text-white" : ""}>
                        {subcategory.name}
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
      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="bg-white rounded-lg shadow-xl max-w-5xl w-full p-4 sm:p-6 mx-2 sm:mx-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle
              className="text-lg font-semibold text-gray-900 mb-4"
              style={{
                fontFamily: "Sukhumvit Set, sans-serif" as CSSProperties["fontFamily"],
              }}
            >
              แก้ไขสินค้า
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column - Image Upload */}
            <div className="w-full lg:w-1/3 space-y-4">
              {/* Main image preview */}
              <div className="w-full">
                {editProduct?.image?.length > 0 && (
                  <div className="relative h-40 md:h-48 lg:h-60 w-full overflow-hidden rounded-lg border border-gray-200">
                    <img
                      src={
                        editProduct.image?.startsWith("data:")
                          ? editProduct.image
                          : `${editProduct.image}`
                      }
                      alt="Main product image"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Additional Images */}
              <div className="mt-4">
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                >
                  รูปภาพเพิ่มเติม
                </label>
                <div>
                  {/* Main image preview */}

                  {/* Scrollable gallery */}
                  <div className="w-full overflow-x-auto pb-4 mb-4 hide-scrollbar">
                    <div className="flex space-x-4">
                      {/* Existing images preview */}
                      {editProduct?.images?.map((img, index) => (
                        <div
                          key={index}
                          className="relative h-20 w-20 flex-shrink-0 group"
                        >
                          <img
                            src={
                              img.startsWith("data:")
                                ? img
                                : `${img}`
                            }
                            alt={`Product image ${index}`}
                            className="h-full w-full object-cover rounded-md border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                            onClick={() => {
                              if (editProduct && editProduct.images) {
                                // Move this image to the first position (main image)
                                const newImages = [...editProduct.images];
                                const selectedImg = newImages.splice(
                                  index,
                                  1
                                )[0];
                                newImages.unshift(selectedImg);
                                setEditProduct((prev) => ({
                                  ...prev!,
                                  images: newImages,
                                }));
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (editProduct) {
                                const newImages = [...editProduct.images];
                                newImages.splice(index, 1);
                                setEditProduct((prev) => ({
                                  ...prev!,
                                  images: newImages,
                                }));
                              }
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3 w-3"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* Add more images button */}
                      <label className="h-20 w-20 flex-shrink-0 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center cursor-pointer hover:bg-gray-50">
                        <div className="flex flex-col items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                          <span className="text-sm text-gray-500 mt-1">
                            เพิ่มรูป
                          </span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (
                              e.target.files &&
                              e.target.files.length > 0 &&
                              editProduct
                            ) {
                              // สร้าง array สำหรับเก็บรูปภาพใหม่
                              const newImages = [
                                ...(editProduct.images || []),
                              ];

                              // สร้างตัวแปรเพื่อติดตามจำนวนไฟล์ที่อ่านเสร็จแล้ว
                              let filesProcessed = 0;
                              const totalFiles = e.target.files.length;

                              // วนลูปผ่านไฟล์ทั้งหมดที่เลือก
                              Array.from(e.target.files).forEach((file) => {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    newImages.push(
                                      event.target.result as string
                                    );
                                    filesProcessed++;

                                    // อัปเดตรูปภาพเมื่ออ่านไฟล์ทั้งหมดเสร็จแล้ว
                                    if (filesProcessed === totalFiles) {
                                      setEditProduct((prev) => ({
                                        ...prev!,
                                        images: [...newImages],
                                      }));
                                    }
                                  }
                                };
                                reader.readAsDataURL(file);
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Helper text */}
                  {/* <p className="text-xs text-gray-500 mb-2">คลิกที่รูปเพื่อตั้งเป็นรูปหลัก (รูปแรกจะถูกใช้เป็นรูปหลัก)</p> */}
                </div>
              </div>
            </div>

            {/* Right Column - Product Details */}
            <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                >
                  ประเภทสินค้า
                </label>
                <select
                  value={editProduct?.productType || ""}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct!,
                      productType: e.target.value as
                        | "ready"
                        | "preorder"
                        | "",
                    })
                  }
                  className="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">เลือกประเภทสินค้า</option>
                  <option value="1">สินค้าสำเร็จรูป</option>
                  <option value="2">สินค้าพรีออเดอร์</option>
                  <option value="3">opton</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                >
                  ชื่อสินค้า (สำหรับแสดงลูกค้า)
                </label>
                <input
                  type="text"
                  value={editProduct?.name || ""}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setEditProduct((prev) => ({
                      ...prev!,
                      name: newName,
                    }));
                  }}
                  className="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="ชื่อสินค้า"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                >
                  รหัสสินค้า
                </label>
                <input
                  type="text"
                  value={editProduct?.modelName || ""}
                  onChange={(e) => {
                    const newModelName = e.target.value;
                    setEditProduct((prev) => ({
                      ...prev!,
                      modelName: newModelName,
                    }));
                  }}
                  className="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="ชื่อรุ่น"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                >
                  รายละเอียดสินค้า
                </label>
                <textarea
                  value={editProduct?.description || ""}
                  onChange={(e) => {
                    const newDescription = e.target.value;
                    setEditProduct((prev) => ({
                      ...prev!,
                      description: newDescription,
                    }));
                  }}
                  className="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                  placeholder="รายละเอียดสินค้า"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                >
                  Tags
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editProduct?.tags?.join(" ") || ""}
                    onChange={(e) => {
                      // Split by spaces and add # to each tag
                      const tags = e.target.value
                        .split(" ")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag.length > 0)
                        .map((tag) =>
                          tag.startsWith("#") ? tag : `#${tag}`
                        );

                      setEditProduct((prev) => ({
                        ...prev!,
                        tags: tags,
                      }));
                    }}
                    className="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="ป้อน tags แยกด้วยช่องว่าง"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                    <span className="text-sm">#Tags</span>
                  </div>
                </div>
              </div>

              {/* <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2" style={{ fontFamily: 'Sukhumvit Set, sans-serif' }}>
                      ราคา
                    </label>
                    <input
                      type="text"
                      value={editProduct?.price || 0}
                      onChange={(e) => {
                        const newPrice = parseFloat(e.target.value);
                        setEditProduct(prev => ({
                          ...prev!,
                          price: newPrice
                        }));
                      }}
                      className="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="0"
                      min="0"
                    />
                  </div> */}

              <div>
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                >
                  หมวดหมู่
                </label>
                <select
                  value={editProduct?.category || ""}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    console.log("Selected category:", newCategory);

                    // อัพเดต state ทันที
                    setEditProduct((prev) => {
                      if (!prev) return prev;

                      // ล้างการเลือกหมวดหมู่ย่อยเมื่อเปลี่ยนหมวดหมู่หลัก
                      const updatedProduct = {
                        ...prev,
                        category: newCategory,
                        subcategoryId: "", // รีเซ็ตค่าหมวดหมู่ย่อย
                      };

                      console.log("Updated product state:", updatedProduct);
                      return updatedProduct;
                    });
                  }}
                  className="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories.map((category) => (<option key={category.key} value={category.key}>{category.label}</option>))}
                </select>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                >
                  หมวดหมู่ย่อย
                </label>
                <select
                  value={editProduct?.subcategoryId || ""}
                  onChange={(e) => {
                    const newSubcategoryId = e.target.value;
                    console.log(
                      "Selected subcategoryId:",
                      newSubcategoryId
                    );
                    setEditProduct((prev) => ({
                      ...prev!,
                      subcategoryId: newSubcategoryId,
                    }));
                  }}
                  className="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">เลือกหมวดหมู่ย่อย</option>
                  {editProduct?.category
                    ? // ถ้ามีการเลือกหมวดหมู่หลัก แสดงเฉพาะหมวดหมู่ย่อยที่เกี่ยวข้อง
                    getSubcategoriesForCategory(editProduct.category).map(
                      (subcategory) => (
                        <option
                          key={subcategory.id}
                          value={subcategory.id}
                        >
                          {subcategory.name}
                        </option>
                      )
                    )
                    : // ถ้าไม่มีการเลือกหมวดหมู่หลัก แสดงทั้งหมด
                    Object.entries(SUBCATEGORY_MAP).map(
                      ([id, subcategory]) => (
                        <option key={id} value={id}>
                          {subcategory.name}
                        </option>
                      )
                    )}
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                >
                  สี
                </label>
                <div className="space-y-2">
                  {editProduct?.colors?.map((color, index) => (
                    <div
                      key={color.id || index}
                      className="bg-white p-4 rounded-lg shadow-sm border"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden">
                          <img
                            src={
                              color.image_path
                                ? color.image_path.startsWith("http") ||
                                  color.image_path.startsWith("data:")
                                  ? color.image_path
                                  : `${BASE_IMAGE_URL}/${color.image_path.replace(
                                    /^\/+/,
                                    ""
                                  )}`
                                : "/default-color.png"
                            }
                            alt={color.color}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <span
                            className="text-sm text-gray-700"
                            style={{
                              fontFamily: "Sukhumvit Set, sans-serif",
                            }}
                          >
                            {color.color}
                          </span>
                          <div className="mt-2 space-y-2">
                            {color.image_path && (
                              <div className="relative w-20 h-20 rounded-md overflow-hidden mb-2">
                                <img
                                  src={
                                    color.image_path.startsWith("http") ||
                                      color.image_path.startsWith("data:")
                                      ? color.image_path
                                      : `${BASE_IMAGE_URL}/${color.image_path.replace(
                                        /^\/+/,
                                        ""
                                      )}`
                                  }
                                  alt={`Color ${color.color}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      if (editProduct) {
                                        const updatedColors = [
                                          ...(editProduct.colors || []),
                                        ];
                                        updatedColors[index] = {
                                          ...updatedColors[index],
                                          image_path:
                                            reader.result as string,
                                        };
                                        setEditProduct({
                                          ...editProduct,
                                          colors: updatedColors,
                                        });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                                id={`edit-color-image-${color.id || index}`}
                              />
                              <label
                                htmlFor={`edit-color-image-${color.id || index
                                  }`}
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 cursor-pointer"
                              >
                                <svg
                                  className="mr-2 h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                {color.image_path
                                  ? "เปลี่ยนรูปภาพ"
                                  : "อัพโหลดรูปภาพ"}
                              </label>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (editProduct) {
                              const updatedColors = [
                                ...(editProduct.colors || []),
                              ];
                              updatedColors.splice(index, 1);
                              setEditProduct({
                                ...editProduct,
                                colors: updatedColors,
                              });
                            }
                          }}
                          className="p-2 text-red-600 hover:text-[#ec4a4c]"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <select
                      value=""
                      onChange={(e) => {
                        const selectedColor = e.target.value;
                        if (selectedColor) {
                          const colorList = getColorList(
                            editProduct?.productType,
                            editProduct?.category,
                            editProduct?.subcategoryId
                          );
                          const selectedColorData = colorList.find(
                            (c) => c.value === selectedColor
                          );
                          setEditProduct({
                            ...editProduct,
                            colors: [
                              ...(editProduct.colors || []),
                              {
                                color: selectedColor,
                                image_path: selectedColorData?.image || "",
                              },
                            ],
                          });
                        }
                      }}
                      className="flex-1 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                    >
                      <option value="">เลือกสี</option>
                      {getColorList(
                        editProduct?.productType,
                        editProduct?.category,
                        editProduct?.subcategoryId
                      ).map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setEditProduct({ ...editProduct, colors: [] });
                      }}
                      className="px-3 py-1 text-sm text-white bg-red-600 rounded-md hover:bg-red-700"
                    >
                      ล้างสีทั้งหมด
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                >
                  Tags
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editProduct?.tags?.join(" ") || ""}
                    onChange={(e) => {
                      // Split by spaces and add # to each tag
                      const tags = e.target.value
                        .split(" ")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag.length > 0)
                        .map((tag) =>
                          tag.startsWith("#") ? tag : `#${tag}`
                        );

                      if (editProduct) {
                        setEditProduct({ ...editProduct, tags: tags });
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="ป้อน tags แยกด้วยช่องว่าง"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                    <span className="text-sm">#Tags</span>
                  </div>
                </div>
              </div>
              {/* Production Times */}
              <div>
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                >
                  ระยะเวลาการผลิต
                </label>
                <div className="space-y-2">
                  {productionTimes.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={time.duration}
                        onChange={(e) => {
                          const newTimes = [...productionTimes];
                          newTimes[index] = {
                            ...time,
                            duration: e.target.value, // เปลี่ยนจาก parseInt(e.target.value)
                          };
                          setProductionTimes(newTimes);
                        }}
                        className="w-24 px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <select
                        value={time.unit}
                        onChange={(e) => {
                          const newTimes = [...productionTimes];
                          newTimes[index] = {
                            ...time,
                            unit: e.target.value as
                              | "days"
                              | "weeks"
                              | "months",
                          };
                          setProductionTimes(newTimes);
                        }}
                        className="w-32 px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      >
                        <option value="days">วัน</option>
                        <option value="weeks">สัปดาห์</option>
                        <option value="months">เดือน</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const newTimes = [...productionTimes];
                          newTimes.splice(index, 1);
                          setProductionTimes(newTimes);
                        }}
                        className="p-2 text-red-600 hover:text-[#ec4a4c]"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setProductionTimes([
                        ...productionTimes,
                        { duration: "", unit: "days" },
                      ])
                    }
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                  >
                    + เพิ่มระยะเวลาการผลิต
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                >
                  ขนาด
                </label>
                <div className="space-y-4">
                  {editProduct &&
                    editProduct.sizes?.map((sizeItem, index) => (
                      <div
                        key={sizeItem.id || index}
                        className="bg-white p-4 rounded-lg shadow-sm border"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ขนาด
                            </label>
                            <select
                              value={sizeItem.size || ""}
                              onChange={(e) => {
                                const updatedSizes = [
                                  ...(editProduct.sizes || []),
                                ];
                                updatedSizes[index] = {
                                  ...updatedSizes[index],
                                  size: e.target.value,
                                };
                                setEditProduct({
                                  ...editProduct,
                                  sizes: updatedSizes,
                                });
                              }}
                              className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            >
                              <option value="">เลือกขนาด</option>
                              {(editProduct?.category === "เหรียญรางวัล"
                                ? COIN_SIZES
                                : MASTER_SIZES
                              ).map((option) => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Width (cm)
                            </label>
                            <input
                              type="text"
                              value={sizeItem.width || 0}
                              onChange={(e) => {
                                const updatedSizes = [
                                  ...(editProduct.sizes || []),
                                ];
                                updatedSizes[index] = {
                                  ...updatedSizes[index],
                                  width: parseFloat(e.target.value),
                                };
                                setEditProduct({
                                  ...editProduct,
                                  sizes: updatedSizes,
                                });
                              }}
                              className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Height (cm)
                            </label>
                            <input
                              type="text"
                              value={sizeItem.height || 0}
                              onChange={(e) => {
                                const updatedSizes = [
                                  ...(editProduct.sizes || []),
                                ];
                                updatedSizes[index] = {
                                  ...updatedSizes[index],
                                  height: parseFloat(e.target.value),
                                };
                                setEditProduct({
                                  ...editProduct,
                                  sizes: updatedSizes,
                                });
                              }}
                              className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm text-gray-700 mb-1">
                              Weight (g)
                            </label>
                            <input
                              type="text"
                              min="0"
                              step="1"
                              value={sizeItem.weight || 0}
                              onChange={(e) => {
                                const updatedSizes = [
                                  ...(editProduct.sizes || []),
                                ];
                                updatedSizes[index] = {
                                  ...updatedSizes[index],
                                  weight: parseFloat(e.target.value),
                                };
                                setEditProduct({
                                  ...editProduct,
                                  sizes: updatedSizes,
                                });
                              }}
                              className="w-full px-3 py-2 bg-white text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const updatedSizes = [
                                ...(editProduct.sizes || []),
                              ];
                              updatedSizes.splice(index, 1);
                              setEditProduct({
                                ...editProduct,
                                sizes: updatedSizes,
                              });
                            }}
                            className="p-2 text-red-600 hover:text-[#ec4a4c] rounded-lg hover:bg-red-50 transition-all duration-200"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  <button
                    type="button"
                    onClick={() => {
                      const updatedSizes = [...(editProduct.sizes || [])];
                      updatedSizes.push({
                        size: "",
                        width: 0,
                        height: 0,
                        weight: 0,
                      });
                      setEditProduct({
                        ...editProduct,
                        sizes: updatedSizes,
                      });
                    }}
                    className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 hover:shadow-lg"
                    style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                  >
                    เพิ่มขนาด
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                <div className="w-full bg-white shadow-sm rounded-lg border border-gray-200">
                  <div className="space-y-4">
                    {[
                      { id: 1, value: "ทำป้ายจารึก", label: "ทำป้ายจารึก" },
                      { id: 2, value: "ทำโบว์", label: "ทำโบว์" },
                      {
                        id: 3,
                        value: "ตราสัญลักษณ์",
                        label: "ตราสัญลักษณ์",
                      },
                      { id: 4, value: "สกรีน 1 สี", label: "สกรีน 1 สี" },
                      { id: 5, value: "สกรีน 4 สี", label: "สกรีน 4 สี" },
                      { id: 6, value: "สติ๊กเกอร์", label: "สติ๊กเกอร์" },
                      {
                        id: 7,
                        value: "เลเซอร์รมยาสี",
                        label: "เลเซอร์รมยาสี",
                      },
                      { id: 8, value: "mirror", label: "mirror" },
                      {
                        id: 9,
                        value: "กล่องบุสวยงาม",
                        label: "กล่องบุสวยงาม",
                      },
                    ].map((option) => {
                      // Check if this option is selected in editProduct
                      const isSelected =
                        editProduct?.options?.some(
                          (productOption) =>
                            productOption.option_id === option.id
                        ) || false;

                      return (
                        <div
                          key={option.id}
                          className="flex items-center justify-between space-x-3 bg-white p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors w-full"
                        >
                          <div className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              id={`option-${option.id}`}
                              checked={isSelected}
                              onChange={(e) => {
                                const currentOptions =
                                  editProduct.options || [];
                                let updatedOptions;

                                if (e.target.checked) {
                                  // Add new option object
                                  const newOption = {
                                    id: Date.now(), // Temporary ID for new options
                                    product_id: editProduct.id || 0,
                                    option_id: option.id,
                                  };
                                  updatedOptions = [
                                    ...currentOptions,
                                    newOption,
                                  ];
                                } else {
                                  // Remove option with matching option_id
                                  updatedOptions = currentOptions.filter(
                                    (opt) => opt.option_id !== option.id
                                  );
                                }

                                setEditProduct({
                                  ...editProduct,
                                  options: updatedOptions,
                                });
                              }}
                              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            />
                            <label
                              htmlFor={`option-${option.id}`}
                              className="text-sm text-gray-700"
                            >
                              {option.label}
                            </label>
                          </div>
                        </div>
                      );
                    })}
                    อื่นๆโปรดระบุ
                    <input type="text" />
                  </div>
                </div>
              </div>
              {editProduct && editProduct.productType === "1" && (
                <div className="md:col-span-2">
                  <label
                    className="block text-sm font-medium text-gray-900 mb-2"
                    style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                  >
                    ส่วนประกอบ
                  </label>
                  <div className="space-y-4">
                    {/* Search input */}
                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          const newParts = [
                            ...(editProduct?.parts || []),
                            {
                              id: Date.now().toString(),
                              modelName: "",
                              name: "",
                              for_product: "",
                              color: "",
                              quantity: 1,
                            },
                          ];
                          setEditProduct({
                            ...editProduct!,
                            parts: newParts,
                          });
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        +เพิ่มส่วนประกอบ
                      </button>
                    </div>

                    {/* Parts list */}
                    <div className="space-y-4">
                      {/* Show message if no parts exist */}
                      {(editProduct?.parts?.length === 0 ||
                        !editProduct?.parts) && (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center text-gray-500">
                            ไม่มีส่วนประกอบ กรุณาเพิ่มส่วนประกอบ
                          </div>
                        )}
                      {(editProduct?.parts || []).map((part, index) => (
                        <div
                          key={part.id}
                          className="bg-white p-4 rounded-lg border border-gray-200"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                รหัสสินค้า (Model)
                              </label>
                              <input
                                type="text"
                                value={editProduct?.modelName || ""}
                                readOnly
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                ชิ้นส่วนสำหรับ
                              </label>
                              <input
                                type="text"
                                value={part.for_product || ""}
                                onChange={(e) => {
                                  const updatedParts = [
                                    ...(editProduct?.parts || []),
                                  ];
                                  updatedParts[index] = {
                                    ...part,
                                    for_product: e.target.value,
                                  };
                                  setEditProduct({
                                    ...editProduct!,
                                    parts: updatedParts,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                รหัส/ชื่อสินค้า
                              </label>
                              <input
                                type="text"
                                value={part.name || ""}
                                onChange={(e) => {
                                  const updatedParts = [
                                    ...(editProduct?.parts || []),
                                  ];
                                  updatedParts[index] = {
                                    ...part,
                                    name: e.target.value,
                                  };
                                  setEditProduct({
                                    ...editProduct!,
                                    parts: updatedParts,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                สี
                              </label>
                              <select
                                value={part.color || ""}
                                onChange={(e) => {
                                  const updatedParts = [
                                    ...(editProduct?.parts || []),
                                  ];
                                  updatedParts[index] = {
                                    ...part,
                                    color: e.target.value,
                                  };
                                  setEditProduct({
                                    ...editProduct!,
                                    parts: updatedParts,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                              >
                                <option value="">เลือกสี</option>
                                {MASTER_COLORS.map((color) => (
                                  <option
                                    key={color.value}
                                    value={color.value}
                                  >
                                    {color.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label className="block text-sm text-gray-700 mb-1">
                                  จำนวน
                                </label>
                                <input
                                  type="text"
                                  min="1"
                                  value={part.quantity || 1}
                                  onChange={(e) => {
                                    const updatedParts = [
                                      ...(editProduct?.parts || []),
                                    ];
                                    updatedParts[index] = {
                                      ...part,
                                      quantity:
                                        parseInt(e.target.value) || 1,
                                    };
                                    setEditProduct({
                                      ...editProduct!,
                                      parts: updatedParts,
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedParts = (
                                    editProduct?.parts || []
                                  ).filter((_, i) => i !== index);
                                  setEditProduct({
                                    ...editProduct!,
                                    parts: updatedParts,
                                  });
                                }}
                                className="mt-6 p-2 text-red-600 hover:text-[#ec4a4c] transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Prices Section */}
              <div className="md:col-span-2">
                <label
                  className="block text-sm font-medium text-gray-900 mb-2"
                  style={{ fontFamily: "Sukhumvit Set, sans-serif" }}
                >
                  ราคา
                </label>
                <div className="space-y-4">
                  {/* Add Price Button */}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        const newPrices = [
                          ...(editProduct?.prices || []),
                          {
                            id: Date.now().toString(),
                            retail_price: 0,
                            wholesale_price: 0,
                            special_price: 0,
                          },
                        ];
                        setEditProduct({
                          ...editProduct!,
                          prices: newPrices,
                        });
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      +เพิ่มราคา
                    </button>
                  </div>

                  {/* Prices List */}
                  {editProduct && editProduct.productType === "1" && (
                    <div className="space-y-4">
                      {/* Show message if no prices exist */}
                      {(editProduct?.prices?.length === 0 ||
                        !editProduct?.prices) && (
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center text-gray-500">
                            ไม่มีราคา กรุณาเพิ่มราคา
                          </div>
                        )}
                      {(editProduct?.prices || []).map((price, index) => (
                        <div
                          key={price.id}
                          className="bg-white p-4 rounded-lg border border-gray-200"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                รหัสสินค้า (Model)
                              </label>
                              <input
                                type="text"
                                value={editProduct?.modelName || ""}
                                readOnly
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                ราคาปลีก
                              </label>
                              <input
                                type="text"
                                min="0"
                                value={price.retail_price}
                                onChange={(e) => {
                                  const updatedPrices = [
                                    ...(editProduct?.prices || []),
                                  ];
                                  updatedPrices[index] = {
                                    ...price,
                                    retail_price:
                                      parseFloat(e.target.value) || 0,
                                  };
                                  setEditProduct({
                                    ...editProduct!,
                                    prices: updatedPrices,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                {" "}
                                {editProduct &&
                                  editProduct.productType === "1"
                                  ? "ราคาส่ง (100 ชิ้นขึ้นไป)"
                                  : "ค่าโมล"}
                              </label>
                              <input
                                type="text"
                                min="0"
                                value={price.wholesale_price}
                                onChange={(e) => {
                                  const updatedPrices = [
                                    ...(editProduct?.prices || []),
                                  ];
                                  updatedPrices[index] = {
                                    ...price,
                                    wholesale_price:
                                      parseFloat(e.target.value) || 0,
                                  };
                                  setEditProduct({
                                    ...editProduct!,
                                    prices: updatedPrices,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label className="block text-sm text-gray-700 mb-1">
                                  ราคาพิเศษ
                                </label>
                                <input
                                  type="text"
                                  min="0"
                                  value={price.special_price}
                                  onChange={(e) => {
                                    const updatedPrices = [
                                      ...(editProduct?.prices || []),
                                    ];
                                    updatedPrices[index] = {
                                      ...price,
                                      special_price:
                                        parseFloat(e.target.value) || 0,
                                    };
                                    setEditProduct({
                                      ...editProduct!,
                                      prices: updatedPrices,
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedPrices = (
                                    editProduct?.prices || []
                                  ).filter((_, i) => i !== index);
                                  setEditProduct({
                                    ...editProduct!,
                                    prices: updatedPrices,
                                  });
                                }}
                                className="mt-6 p-2 text-red-600 hover:text-[#ec4a4c] transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0111 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {editProduct && editProduct.productType === "2" && (
                    <div className="space-y-4">
                      {(editProduct?.prices || []).map((price, index) => (
                        <div
                          key={price.id}
                          className="bg-white p-4 rounded-lg border border-gray-200"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                รหัสสินค้า (Model)
                              </label>
                              <input
                                type="text"
                                value={editProduct?.modelName || ""}
                                readOnly
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                ราคาปลีก
                              </label>
                              <input
                                type="text"
                                min="0"
                                value={price.retail_price}
                                onChange={(e) => {
                                  const updatedPrices = [
                                    ...(editProduct?.prices || []),
                                  ];
                                  updatedPrices[index] = {
                                    ...price,
                                    retail_price:
                                      parseFloat(e.target.value) || 0,
                                  };
                                  setEditProduct({
                                    ...editProduct!,
                                    prices: updatedPrices,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                ค่าโมล
                              </label>
                              <input
                                type="text"
                                min="0"
                                value={price.wholesale_price}
                                onChange={(e) => {
                                  const updatedPrices = [
                                    ...(editProduct?.prices || []),
                                  ];
                                  updatedPrices[index] = {
                                    ...price,
                                    wholesale_price:
                                      parseFloat(e.target.value) || 0,
                                  };
                                  setEditProduct({
                                    ...editProduct!,
                                    prices: updatedPrices,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label className="block text-sm text-gray-700 mb-1">
                                  ราคาพิเศษ
                                </label>
                                <input
                                  type="text"
                                  min="0"
                                  value={price.special_price}
                                  onChange={(e) => {
                                    const updatedPrices = [
                                      ...(editProduct?.prices || []),
                                    ];
                                    updatedPrices[index] = {
                                      ...price,
                                      special_price:
                                        parseFloat(e.target.value) || 0,
                                    };
                                    setEditProduct({
                                      ...editProduct!,
                                      prices: updatedPrices,
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedPrices = (
                                    editProduct?.prices || []
                                  ).filter((_, i) => i !== index);
                                  setEditProduct({
                                    ...editProduct!,
                                    prices: updatedPrices,
                                  });
                                }}
                                className="mt-6 p-2 text-red-600 hover:text-[#ec4a4c] transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0111 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {editProduct && editProduct.productType === "3" && (
                    <div className="space-y-4">
                      {(editProduct?.prices || []).map((price, index) => (
                        <div
                          key={price.id}
                          className="bg-white p-4 rounded-lg border border-gray-200"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                รหัสสินค้า (Model)
                              </label>
                              <input
                                type="text"
                                value={editProduct?.modelName || ""}
                                readOnly
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                ราคาปลีก
                              </label>
                              <input
                                type="text"
                                min="0"
                                value={price.retail_price}
                                onChange={(e) => {
                                  const updatedPrices = [
                                    ...(editProduct?.prices || []),
                                  ];
                                  updatedPrices[index] = {
                                    ...price,
                                    retail_price:
                                      parseFloat(e.target.value) || 0,
                                  };
                                  setEditProduct({
                                    ...editProduct!,
                                    prices: updatedPrices,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-700 mb-1">
                                ค่าโมล
                              </label>
                              <input
                                type="text"
                                min="0"
                                value={price.wholesale_price}
                                onChange={(e) => {
                                  const updatedPrices = [
                                    ...(editProduct?.prices || []),
                                  ];
                                  updatedPrices[index] = {
                                    ...price,
                                    wholesale_price:
                                      parseFloat(e.target.value) || 0,
                                  };
                                  setEditProduct({
                                    ...editProduct!,
                                    prices: updatedPrices,
                                  });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <label className="block text-sm text-gray-700 mb-1">
                                  ราคาพิเศษ
                                </label>
                                <input
                                  type="text"
                                  min="0"
                                  value={price.special_price}
                                  onChange={(e) => {
                                    const updatedPrices = [
                                      ...(editProduct?.prices || []),
                                    ];
                                    updatedPrices[index] = {
                                      ...price,
                                      special_price:
                                        parseFloat(e.target.value) || 0,
                                    };
                                    setEditProduct({
                                      ...editProduct!,
                                      prices: updatedPrices,
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedPrices = (
                                    editProduct?.prices || []
                                  ).filter((_, i) => i !== index);
                                  setEditProduct({
                                    ...editProduct!,
                                    prices: updatedPrices,
                                  });
                                }}
                                className="mt-6 p-2 text-red-600 hover:text-[#ec4a4c] transition-colors"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0111 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleEditClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              style={{
                fontFamily:
                  "Sukhumvit Set, sans-serif" as CSSProperties["fontFamily"],
              }}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleEditSave}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 hover:shadow-lg active:scale-95"
              style={{
                fontFamily:
                  "Sukhumvit Set, sans-serif" as CSSProperties["fontFamily"],
              }}
            >
              บันทึก
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Stock Adjustment Dialog ===== */}
      < Dialog open={!!adjustItem
      } onOpenChange={(open) => !open && setAdjustItem(null)}>
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
      </Dialog >

      {/* ===== Detail Dialog ===== */}
      < Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
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
      </Dialog >

      {/* Excel Import Dialog */}
      {
        isProcurementMode && (
          <ExcelImportDialog
            open={showImportDialog}
            onOpenChange={setShowImportDialog}
            onImportConfirm={handleImportConfirm}
            existingSkus={existingSkus}
          />
        )
      }
    </div >
  );
}
