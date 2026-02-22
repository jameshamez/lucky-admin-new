import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Minus,
  LayoutGrid,
  List,
  Package,
  Edit,
  Trash2,
  ChevronRight,
  Eye,
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Clock,
  User,
} from "lucide-react";
import { toast } from "sonner";

// --- Data Types ---
interface BOMComponent {
  id: string;
  name: string;
  qty: number;
  unit: string;
}

interface MovementLog {
  id: string;
  date: string;
  type: "รับเข้า" | "จ่ายออก";
  qty: number;
  by: string;
  note: string;
}

interface InventoryItem {
  id: string;
  code: string;
  name: string;
  image: string;
  category: string;
  subcategory: string;
  color: string;
  size: string;
  tags: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  model: string;
  lastUpdated: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  bom?: BOMComponent[];
  movementHistory?: MovementLog[];
}

// --- Category & Subcategory Config ---
const categories = [
  { key: "all", label: "ทั้งหมด" },
  { key: "ถ้วยรางวัลสำเร็จ", label: "ถ้วยรางวัลสำเร็จ" },
  { key: "เหรียญรางวัล", label: "เหรียญรางวัล" },
  { key: "โล่รางวัล", label: "โล่รางวัล" },
  { key: "เสื้อพิมพ์ลายและผ้า", label: "เสื้อพิมพ์ลายและผ้า" },
  { key: "ชิ้นส่วนถ้วยรางวัล", label: "ชิ้นส่วนถ้วยรางวัล" },
];

const subcategoryMap: Record<string, { key: string; label: string }[]> = {
  all: [],
  ถ้วยรางวัลสำเร็จ: [
    { key: "all", label: "ทั้งหมด" },
    { key: "ถ้วยรางวัลโลหะอิตาลี", label: "ถ้วยรางวัลโลหะอิตาลี" },
    { key: "ถ้วยรางวัลโลหะจีน", label: "ถ้วยรางวัลโลหะจีน" },
    { key: "ถ้วยรางวัลพลาสติกอิตาลี", label: "ถ้วยรางวัลพลาสติกอิตาลี" },
    { key: "ถ้วยรางวัลพลาสติกไทย", label: "ถ้วยรางวัลพลาสติกไทย" },
    { key: "ถ้วยรางวัลฟิกเกอร์", label: "ถ้วยรางวัลฟิกเกอร์" },
    { key: "ถ้วยรางวัลเบญจรงค์", label: "ถ้วยรางวัลเบญจรงค์" },
  ],
  เหรียญรางวัล: [
    { key: "all", label: "ทั้งหมด" },
    { key: "เหรียญพลาสติก", label: "เหรียญพลาสติก" },
    { key: "เหรียญโลหะ", label: "เหรียญโลหะ" },
  ],
  โล่รางวัล: [
    { key: "all", label: "ทั้งหมด" },
    { key: "โล่คริสตัล", label: "โล่คริสตัล" },
    { key: "โล่ไม้", label: "โล่ไม้" },
  ],
  เสื้อพิมพ์ลายและผ้า: [
    { key: "all", label: "ทั้งหมด" },
    { key: "เสื้อโปโล", label: "เสื้อโปโล" },
    { key: "เสื้อยืด", label: "เสื้อยืด" },
  ],
  ชิ้นส่วนถ้วยรางวัล: [
    { key: "all", label: "ทั้งหมด" },
    { key: "ฐานถ้วย", label: "ฐานถ้วย" },
    { key: "ตัวถ้วย", label: "ตัวถ้วย" },
    { key: "ฝาครอบ", label: "ฝาครอบ" },
  ],
};

// --- Initial Mock Data ---
const initialStockData: InventoryItem[] = [
  {
    id: "1", code: "TC-001", name: "ถ้วยรางวัลสีทอง", image: "/placeholder.svg",
    category: "ถ้วยรางวัลสำเร็จ", subcategory: "ถ้วยรางวัลโลหะอิตาลี",
    color: "ทอง", size: "A, B, C, N/A", tags: "ถ้วยรางวัล",
    currentStock: 500, minimumStock: 100, unit: "ชิ้น", model: "911_S_W_D",
    lastUpdated: "2025-02-10", status: "in_stock",
    bom: [
      { id: "CP-001", name: "ตัวถ้วยโลหะอิตาลี", qty: 1, unit: "ชิ้น" },
      { id: "CP-002", name: "ฐานหินอ่อน", qty: 1, unit: "ชิ้น" },
      { id: "CP-003", name: "ฝาครอบพลาสติก", qty: 1, unit: "ชิ้น" },
      { id: "CP-004", name: "กล่องบรรจุ", qty: 1, unit: "ชิ้น" },
    ],
    movementHistory: [
      { id: "M1", date: "2025-02-10 14:30", type: "รับเข้า", qty: 100, by: "สมชาย", note: "รับจากซัพพลายเออร์" },
      { id: "M2", date: "2025-02-08 10:00", type: "จ่ายออก", qty: 20, by: "วิชัย", note: "เบิกใช้ ORD-015" },
      { id: "M3", date: "2025-02-05 09:15", type: "รับเข้า", qty: 50, by: "สมชาย", note: "รับจาก PO-0055" },
    ],
  },
  {
    id: "2", code: "TC-002", name: "testPP", image: "/placeholder.svg",
    category: "ถ้วยรางวัลสำเร็จ", subcategory: "ถ้วยรางวัลโลหะอิตาลี",
    color: "ดำ", size: "", tags: "#ww",
    currentStock: 0, minimumStock: 50, unit: "ชิ้น", model: "testPP",
    lastUpdated: "2025-02-08", status: "out_of_stock",
    movementHistory: [
      { id: "M4", date: "2025-02-08 16:00", type: "จ่ายออก", qty: 10, by: "มานะ", note: "เบิกใช้ ORD-012" },
    ],
  },
  {
    id: "3", code: "TC-003", name: "ถ้วยรางวัลโลหะอิตาลี - สีเงิน", image: "/placeholder.svg",
    category: "ถ้วยรางวัลสำเร็จ", subcategory: "ถ้วยรางวัลโลหะอิตาลี",
    color: "เงิน", size: "A, B, C, D, N/A", tags: "[]",
    currentStock: 30, minimumStock: 50, unit: "ชิ้น", model: "ถ้วยรางวัลโลหะอิตาลี-สีเงิน",
    lastUpdated: "2025-02-05", status: "low_stock",
    bom: [
      { id: "CP-005", name: "ตัวถ้วยโลหะอิตาลี (เงิน)", qty: 1, unit: "ชิ้น" },
      { id: "CP-002", name: "ฐานหินอ่อน", qty: 1, unit: "ชิ้น" },
      { id: "CP-003", name: "ฝาครอบพลาสติก", qty: 1, unit: "ชิ้น" },
    ],
    movementHistory: [
      { id: "M5", date: "2025-02-05 11:00", type: "จ่ายออก", qty: 15, by: "วิชัย", note: "เบิกใช้ ORD-010" },
      { id: "M6", date: "2025-02-03 09:30", type: "รับเข้า", qty: 20, by: "สมชาย", note: "รับจาก PO-0050" },
    ],
  },
  {
    id: "4", code: "TC-004", name: "rr", image: "",
    category: "ถ้วยรางวัลสำเร็จ", subcategory: "ถ้วยรางวัลโลหะอิตาลี",
    color: "", size: "", tags: "[]",
    currentStock: 0, minimumStock: 10, unit: "ชิ้น", model: "rrrr",
    lastUpdated: "2025-02-01", status: "out_of_stock",
  },
  {
    id: "5", code: "MD-001", name: "เหรียญพลาสติกรู้แพ้รู้ชนะ", image: "/placeholder.svg",
    category: "เหรียญรางวัล", subcategory: "เหรียญพลาสติก",
    color: "ทอง, เงิน, ทองแดง", size: "มาตรฐาน", tags: "เหรียญ",
    currentStock: 1200, minimumStock: 200, unit: "ชิ้น", model: "Standard",
    lastUpdated: "2025-02-10", status: "in_stock",
    movementHistory: [
      { id: "M7", date: "2025-02-10 08:00", type: "รับเข้า", qty: 500, by: "สมชาย", note: "รับล็อตใหม่" },
      { id: "M8", date: "2025-02-09 15:00", type: "จ่ายออก", qty: 200, by: "มานะ", note: "เบิกใช้ ORD-018" },
    ],
  },
  {
    id: "6", code: "MD-002", name: "เหรียญโลหะซิงค์สำเร็จรูป", image: "/placeholder.svg",
    category: "เหรียญรางวัล", subcategory: "เหรียญโลหะ",
    color: "เงา, รมดำ", size: "5cm", tags: "เหรียญ, premium",
    currentStock: 45, minimumStock: 50, unit: "ชิ้น", model: "Premium",
    lastUpdated: "2025-02-09", status: "low_stock",
    bom: [
      { id: "CP-010", name: "ตัวเหรียญซิงค์", qty: 1, unit: "ชิ้น" },
      { id: "CP-011", name: "สายคล้องคอ", qty: 1, unit: "เส้น" },
      { id: "CP-012", name: "ซองใส่เหรียญ", qty: 1, unit: "ชิ้น" },
    ],
    movementHistory: [
      { id: "M9", date: "2025-02-09 10:30", type: "จ่ายออก", qty: 5, by: "วิชัย", note: "เบิกใช้ ORD-020" },
    ],
  },
  {
    id: "7", code: "PL-001", name: "โล่คริสตัลพรีเมียม", image: "/placeholder.svg",
    category: "โล่รางวัล", subcategory: "โล่คริสตัล",
    color: "ใส", size: "8 นิ้ว", tags: "โล่, คริสตัล",
    currentStock: 80, minimumStock: 30, unit: "ชิ้น", model: "Crystal-8",
    lastUpdated: "2025-02-10", status: "in_stock",
    movementHistory: [
      { id: "M10", date: "2025-02-10 13:00", type: "รับเข้า", qty: 30, by: "สมชาย", note: "รับจากซัพพลายเออร์" },
    ],
  },
  {
    id: "8", code: "CP-002", name: "ฐานหินอ่อน", image: "/placeholder.svg",
    category: "ชิ้นส่วนถ้วยรางวัล", subcategory: "ฐานถ้วย",
    color: "ดำ, ขาว", size: "4x4 นิ้ว", tags: "ชิ้นส่วน, ฐาน",
    currentStock: 350, minimumStock: 100, unit: "ชิ้น", model: "BASE-M01",
    lastUpdated: "2025-02-10", status: "in_stock",
  },
  {
    id: "9", code: "CP-003", name: "ฝาครอบพลาสติก", image: "/placeholder.svg",
    category: "ชิ้นส่วนถ้วยรางวัล", subcategory: "ฝาครอบ",
    color: "ใส", size: "มาตรฐาน", tags: "ชิ้นส่วน",
    currentStock: 15, minimumStock: 50, unit: "ชิ้น", model: "LID-P01",
    lastUpdated: "2025-02-08", status: "low_stock",
    movementHistory: [
      { id: "M11", date: "2025-02-08 11:00", type: "จ่ายออก", qty: 35, by: "มานะ", note: "เบิกใช้ ORD-014" },
      { id: "M12", date: "2025-02-06 09:00", type: "รับเข้า", qty: 50, by: "สมชาย", note: "รับจาก PO-0048" },
    ],
  },
];

export default function InventoryStockTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [bomDialogItem, setBomDialogItem] = useState<InventoryItem | null>(null);

  // Mutable stock data
  const [stockData, setStockData] = useState<InventoryItem[]>(initialStockData);

  // Stock Adjustment Dialog state
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustType, setAdjustType] = useState<"รับเข้า" | "จ่ายออก">("รับเข้า");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  // Detail Dialog state
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);

  const subcategories = subcategoryMap[selectedCategory] || [];

  const filteredItems = useMemo(() => {
    return stockData.filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        item.color.toLowerCase().includes(term) ||
        item.size.toLowerCase().includes(term) ||
        item.tags.toLowerCase().includes(term);

      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      const matchesSubcategory =
        selectedSubcategory === "all" || item.subcategory === selectedSubcategory;

      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [searchTerm, selectedCategory, selectedSubcategory, stockData]);

  const handleCategoryChange = (key: string) => {
    setSelectedCategory(key);
    setSelectedSubcategory("all");
  };

  const getStatusBadge = (status: InventoryItem["status"], stock: number) => {
    switch (status) {
      case "in_stock":
        return <Badge className="bg-green-600 text-white">✅ มีในสต็อก ({stock})</Badge>;
      case "low_stock":
        return <Badge className="bg-amber-500 text-white">⚠️ ใกล้หมด ({stock})</Badge>;
      case "out_of_stock":
        return <Badge variant="destructive">❌ หมด</Badge>;
    }
  };

  const computeStatus = (stock: number, min: number): InventoryItem["status"] => {
    if (stock <= 0) return "out_of_stock";
    if (stock < min) return "low_stock";
    return "in_stock";
  };

  // --- Stock Adjustment Submit ---
  const handleAdjustSubmit = () => {
    if (!adjustItem) return;
    const qty = parseInt(adjustQty);
    if (!qty || qty <= 0) {
      toast.error("กรุณากรอกจำนวนที่ถูกต้อง");
      return;
    }

    const now = new Date();
    const timestamp = now.toLocaleDateString("th-TH", {
      day: "2-digit", month: "2-digit", year: "numeric",
    }) + " " + now.toLocaleTimeString("th-TH", {
      hour: "2-digit", minute: "2-digit",
    });

    const newLog: MovementLog = {
      id: `M-${Date.now()}`,
      date: timestamp,
      type: adjustType,
      qty,
      by: "สมชาย ใจดี",
      note: adjustNote || (adjustType === "รับเข้า" ? "รับเข้าสต๊อก" : "จ่ายออกสต๊อก"),
    };

    setStockData(prev => prev.map(item => {
      if (item.id !== adjustItem.id) return item;
      const newStock = adjustType === "รับเข้า"
        ? item.currentStock + qty
        : Math.max(0, item.currentStock - qty);
      return {
        ...item,
        currentStock: newStock,
        lastUpdated: timestamp,
        status: computeStatus(newStock, item.minimumStock),
        movementHistory: [newLog, ...(item.movementHistory || [])].slice(0, 50),
      };
    }));

    toast.success(
      adjustType === "รับเข้า"
        ? `รับเข้า ${qty} ${adjustItem.unit} เรียบร้อย`
        : `จ่ายออก ${qty} ${adjustItem.unit} เรียบร้อย`
    );

    // Reset & close
    setAdjustItem(null);
    setAdjustQty("");
    setAdjustNote("");
    setAdjustType("รับเข้า");
  };

  const openAdjustDialog = (item: InventoryItem) => {
    setAdjustItem(item);
    setAdjustType("รับเข้า");
    setAdjustQty("");
    setAdjustNote("");
  };

  // --- Card View ---
  const renderCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {filteredItems.map((item) => (
        <Card key={item.id} className="relative overflow-hidden flex flex-col">
          {/* Category badge - top right */}
          <Badge className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs">
            {item.subcategory || item.category}
          </Badge>

          {/* Stock count badge - bottom right of image */}
          {item.status === "in_stock" && (
            <span className="absolute top-[170px] right-3 z-10 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              ฿{item.currentStock}
            </span>
          )}

          {/* Image */}
          <div className="h-48 bg-muted flex items-center justify-center overflow-hidden">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
                <Package className="w-10 h-10 opacity-40" />
                ไม่มีรูปภาพ
              </div>
            )}
          </div>

          {/* Info */}
          <CardContent className="flex-1 p-4 space-y-2">
            <h3 className="font-bold text-red-600 text-base leading-tight line-clamp-2">
              {item.name}
            </h3>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {item.color && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
                  สี: {item.color}
                </span>
              )}
              {item.size && <span>ขนาด: {item.size}</span>}
              {item.tags && item.tags !== "[]" && (
                <span className="text-primary">Tags: {item.tags}</span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Model : {item.model} หมวดหมู่ : {item.category}
            </p>

            {/* BOM indicator */}
            {item.bom && item.bom.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-blue-600 p-0 h-auto hover:text-blue-800"
                onClick={() => setBomDialogItem(item)}
              >
                <Package className="w-3 h-3 mr-1" />
                BOM: {item.bom.length} ชิ้นส่วน
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </Button>
            )}

            {/* Status */}
            <div className="pt-1">
              {getStatusBadge(item.status, item.currentStock)}
            </div>
          </CardContent>

          {/* Actions - Updated */}
          <div className="flex justify-end gap-2 px-4 pb-4">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1 border-primary text-primary hover:bg-primary/10"
              onClick={() => openAdjustDialog(item)}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              ปรับปรุงสต๊อก
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-blue-600 border-blue-300 hover:bg-blue-50"
              onClick={() => setDetailItem(item)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );

  // --- Table View ---
  const renderTableView = () => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>รูป</TableHead>
              <TableHead>รหัส</TableHead>
              <TableHead>ชื่อสินค้า</TableHead>
              <TableHead>หมวดหมู่</TableHead>
              <TableHead>สี</TableHead>
              <TableHead>ขนาด</TableHead>
              <TableHead className="text-right">คงเหลือ</TableHead>
              <TableHead className="text-right">ขั้นต่ำ</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>BOM</TableHead>
              <TableHead>จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} className={item.status === "low_stock" ? "bg-amber-50" : ""}>
                <TableCell>
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-contain rounded border bg-white p-0.5" />
                  ) : (
                    <div className="w-10 h-10 rounded border bg-muted flex items-center justify-center">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{item.code}</TableCell>
                <TableCell className="font-medium text-red-600">{item.name}</TableCell>
                <TableCell>
                  <span className="text-xs">{item.subcategory}</span>
                </TableCell>
                <TableCell>{item.color}</TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell className="text-right font-semibold">
                  <span className={item.currentStock < item.minimumStock ? "text-red-600" : ""}>
                    {item.currentStock}
                  </span>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{item.minimumStock}</TableCell>
                <TableCell>{getStatusBadge(item.status, item.currentStock)}</TableCell>
                <TableCell>
                  {item.bom && item.bom.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-blue-600 p-1 h-auto"
                      onClick={() => setBomDialogItem(item)}
                    >
                      {item.bom.length} ชิ้นส่วน
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => openAdjustDialog(item)}>
                      <RefreshCw className="w-3 h-3 mr-1" /> ปรับสต๊อก
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" onClick={() => setDetailItem(item)}>
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {/* Search + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="ค้นหาชื่อ, รหัสสินค้า, สี, ขนาด..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1 border rounded-lg p-1">
          <Button
            variant={viewMode === "card" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("card")}
            className="h-8"
          >
            <LayoutGrid className="w-4 h-4 mr-1" />
            Card
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("table")}
            className="h-8"
          >
            <List className="w-4 h-4 mr-1" />
            Table
          </Button>
        </div>
      </div>

      {/* Category Navigation */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Package className="w-4 h-4" />
            ค้นหาตามหมวดหมู่
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.key}
                variant={selectedCategory === cat.key ? "default" : "outline"}
                size="sm"
                onClick={() => handleCategoryChange(cat.key)}
                className={selectedCategory === cat.key ? "bg-red-500 hover:bg-red-600 text-white" : ""}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {subcategories.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">หมวดหมู่ย่อย</p>
              <div className="flex flex-wrap gap-2">
                {subcategories.map((sub) => (
                  <Button
                    key={sub.key}
                    variant={selectedSubcategory === sub.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSubcategory(sub.key)}
                    className={
                      selectedSubcategory === sub.key
                        ? "bg-red-500 hover:bg-red-600 text-white"
                        : ""
                    }
                  >
                    {sub.label}
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

      {/* BOM Dialog */}
      <Dialog open={!!bomDialogItem} onOpenChange={(open) => !open && setBomDialogItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              รายการชิ้นส่วน (BOM) - {bomDialogItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              สินค้ารหัส <span className="font-semibold">{bomDialogItem?.code}</span> ประกอบด้วยชิ้นส่วนดังนี้:
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ชื่อชิ้นส่วน</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead>หน่วย</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bomDialogItem?.bom?.map((comp) => (
                  <TableRow key={comp.id}>
                    <TableCell className="font-medium">{comp.id}</TableCell>
                    <TableCell>{comp.name}</TableCell>
                    <TableCell className="text-right">{comp.qty}</TableCell>
                    <TableCell>{comp.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Stock Adjustment Dialog ===== */}
      <Dialog open={!!adjustItem} onOpenChange={(open) => !open && setAdjustItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              ปรับปรุงสต๊อก
            </DialogTitle>
          </DialogHeader>

          {adjustItem && (
            <div className="space-y-4">
              {/* Item info */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                {adjustItem.image ? (
                  <img src={adjustItem.image} alt={adjustItem.name} className="w-12 h-12 object-contain rounded border bg-white p-0.5" />
                ) : (
                  <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">{adjustItem.name}</p>
                  <p className="text-xs text-muted-foreground">{adjustItem.code} • คงเหลือ: <span className="font-bold text-foreground">{adjustItem.currentStock}</span> {adjustItem.unit}</p>
                </div>
              </div>

              {/* Type selector */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">ประเภท</Label>
                <div className="flex gap-2">
                  <Button
                    variant={adjustType === "รับเข้า" ? "default" : "outline"}
                    className={adjustType === "รับเข้า" ? "bg-green-600 hover:bg-green-700 flex-1" : "flex-1"}
                    onClick={() => setAdjustType("รับเข้า")}
                  >
                    <ArrowDownCircle className="w-4 h-4 mr-1.5" />
                    รับเข้า
                  </Button>
                  <Button
                    variant={adjustType === "จ่ายออก" ? "destructive" : "outline"}
                    className="flex-1"
                    onClick={() => setAdjustType("จ่ายออก")}
                  >
                    <ArrowUpCircle className="w-4 h-4 mr-1.5" />
                    จ่ายออก
                  </Button>
                </div>
              </div>

              {/* Qty */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">จำนวน ({adjustItem.unit})</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="กรอกจำนวน"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                />
                {adjustType === "จ่ายออก" && parseInt(adjustQty) > adjustItem.currentStock && (
                  <p className="text-xs text-destructive">⚠️ จำนวนเกินสต๊อกคงเหลือ ({adjustItem.currentStock} {adjustItem.unit})</p>
                )}
              </div>

              {/* Note */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">หมายเหตุ</Label>
                <Textarea
                  placeholder="เช่น รับจากซัพพลายเออร์, เบิกใช้ ORD-xxx"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAdjustItem(null)}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleAdjustSubmit}
              className={adjustType === "รับเข้า" ? "bg-green-600 hover:bg-green-700" : ""}
              variant={adjustType === "จ่ายออก" ? "destructive" : "default"}
            >
              {adjustType === "รับเข้า" ? (
                <><ArrowDownCircle className="w-4 h-4 mr-1.5" />ยืนยันรับเข้า</>
              ) : (
                <><ArrowUpCircle className="w-4 h-4 mr-1.5" />ยืนยันจ่ายออก</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Detail Dialog ===== */}
      <Dialog open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              รายละเอียดสินค้า
            </DialogTitle>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-5">
              {/* Image + Basic info */}
              <div className="flex gap-4">
                {detailItem.image ? (
                  <img src={detailItem.image} alt={detailItem.name} className="w-24 h-24 object-contain rounded-lg border bg-white p-2 flex-shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-lg border bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-red-600">{detailItem.name}</h3>
                  <p className="text-sm text-muted-foreground">รหัส: <span className="font-mono font-semibold text-foreground">{detailItem.code}</span></p>
                  <div className="pt-1">{getStatusBadge(detailItem.status, detailItem.currentStock)}</div>
                </div>
              </div>

              {/* Full Spec */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">หมวดหมู่</p>
                  <p className="font-medium">{detailItem.category}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">หมวดหมู่ย่อย</p>
                  <p className="font-medium">{detailItem.subcategory}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">Model</p>
                  <p className="font-medium">{detailItem.model || "-"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">สี</p>
                  <p className="font-medium">{detailItem.color || "-"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">ขนาด</p>
                  <p className="font-medium">{detailItem.size || "-"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">หน่วย</p>
                  <p className="font-medium">{detailItem.unit}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">คงเหลือ</p>
                  <p className="font-bold text-lg">{detailItem.currentStock}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">สต๊อกขั้นต่ำ</p>
                  <p className="font-medium">{detailItem.minimumStock}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">Tags</p>
                  <p className="font-medium">{detailItem.tags && detailItem.tags !== "[]" ? detailItem.tags : "-"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">อัปเดตล่าสุด</p>
                  <p className="font-medium">{detailItem.lastUpdated}</p>
                </div>
              </div>

              {/* BOM */}
              {detailItem.bom && detailItem.bom.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    รายการชิ้นส่วน (BOM)
                  </h4>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs">รหัส</TableHead>
                          <TableHead className="text-xs">ชื่อ</TableHead>
                          <TableHead className="text-xs text-right">จำนวน</TableHead>
                          <TableHead className="text-xs">หน่วย</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailItem.bom.map((comp) => (
                          <TableRow key={comp.id}>
                            <TableCell className="text-xs font-medium">{comp.id}</TableCell>
                            <TableCell className="text-xs">{comp.name}</TableCell>
                            <TableCell className="text-xs text-right">{comp.qty}</TableCell>
                            <TableCell className="text-xs">{comp.unit}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Movement History (last 10) */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  ประวัติการรับ-จ่ายย้อนหลัง (ล่าสุด 10 รายการ)
                </h4>
                {(detailItem.movementHistory && detailItem.movementHistory.length > 0) ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {detailItem.movementHistory.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg border bg-muted/20 text-sm">
                        <div className="mt-0.5">
                          {log.type === "รับเข้า" ? (
                            <ArrowDownCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <ArrowUpCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={log.type === "รับเข้า" ? "bg-green-100 text-green-700 text-[10px] py-0 px-1.5" : "bg-red-100 text-red-700 text-[10px] py-0 px-1.5"}>
                              {log.type}
                            </Badge>
                            <span className="font-bold">{log.type === "รับเข้า" ? "+" : "-"}{log.qty} {(stockData.find(s => s.id === detailItem.id) || detailItem).unit}</span>
                            <span className="text-xs text-muted-foreground">{log.date}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <User className="w-3 h-3" />
                            <span>{log.by}</span>
                            {log.note && <span className="ml-1">• {log.note}</span>}
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
    </div>
  );
}
