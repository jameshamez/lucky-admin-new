import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Search, LayoutGrid, List, Package, Eye, Edit,
  ArrowDownCircle, ArrowUpCircle,
  Clock, User, AlertTriangle, Boxes, History, TrendingDown,
  DollarSign, Save, Truck, Receipt,
} from "lucide-react";
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

interface AccountingCost {
  costPrice: number;
  shippingCost: number;
  vatPrice: number;
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
  accountingCost?: AccountingCost;
}

// --- Categories ---
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

// --- Mock Data ---
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
    bom: [
      { id: "CP-001", name: "ตัวถ้วยโลหะอิตาลี", qty: 1, unit: "ชิ้น" },
      { id: "CP-002", name: "ฐานหินอ่อน", qty: 1, unit: "ชิ้น" },
    ],
    movementHistory: [
      { id: "M1", date: "2025-02-10 14:30", type: "รับเข้า", qty: 100, by: "สมชาย", note: "รับจากซัพพลายเออร์" },
      { id: "M2", date: "2025-02-08 10:00", type: "จ่ายออก", qty: 20, by: "วิชัย", note: "เบิกใช้ ORD-015" },
    ],
    accountingCost: { costPrice: 800, shippingCost: 50, vatPrice: 59.5 },
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
    accountingCost: { costPrice: 750, shippingCost: 50, vatPrice: 56 },
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
    accountingCost: { costPrice: 400, shippingCost: 30, vatPrice: 30.1 },
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

const AccountingProductInventory = () => {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("products");

  // Detail dialog
  const [detailItem, setDetailItem] = useState<ProductItem | null>(null);

  // Cost editing dialog
  const [costEditItem, setCostEditItem] = useState<ProductItem | null>(null);
  const [costForm, setCostForm] = useState<AccountingCost>({ costPrice: 0, shippingCost: 0, vatPrice: 0 });

  // Inline table editing state: { [productId]: AccountingCost }
  const [inlineEdits, setInlineEdits] = useState<Record<string, AccountingCost>>({});
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  const subcategories = subcategoryMap[selectedCategory] || [];

  const summaryStats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter(p => p.status === "low_stock").length;
    const outOfStock = products.filter(p => p.status === "out_of_stock").length;
    const defective = products.filter(p => p.status === "defective").length;
    const todayMovements = 12;
    return { total, lowStock, outOfStock, defective, todayMovements };
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

  const getStatusBadge = (status: ProductItem["status"], stock: number) => {
    switch (status) {
      case "in_stock": return <Badge className="bg-green-600 text-white">✅ มีในสต็อก ({stock})</Badge>;
      case "low_stock": return <Badge className="bg-amber-500 text-white">⚠️ ใกล้หมด ({stock})</Badge>;
      case "out_of_stock": return <Badge variant="destructive">❌ หมด</Badge>;
      case "defective": return <Badge className="bg-yellow-600 text-white">⚠️ มีตำหนิ ({stock})</Badge>;
    }
  };

  // Open cost editing dialog (for card view)
  const openCostEdit = (item: ProductItem) => {
    setCostEditItem(item);
    setCostForm({
      costPrice: item.accountingCost?.costPrice || 0,
      shippingCost: item.accountingCost?.shippingCost || 0,
      vatPrice: item.accountingCost?.vatPrice || 0,
    });
  };

  const handleSaveCost = () => {
    if (!costEditItem) return;
    setProducts(prev => prev.map(p =>
      p.id === costEditItem.id ? { ...p, accountingCost: { ...costForm } } : p
    ));
    toast.success(`บันทึกข้อมูลต้นทุน "${costEditItem.name}" เรียบร้อย`);
    setCostEditItem(null);
  };

  // Inline table edit handlers
  const startInlineEdit = (item: ProductItem) => {
    setEditingRowId(item.id);
    setInlineEdits(prev => ({
      ...prev,
      [item.id]: {
        costPrice: item.accountingCost?.costPrice || 0,
        shippingCost: item.accountingCost?.shippingCost || 0,
        vatPrice: item.accountingCost?.vatPrice || 0,
      },
    }));
  };

  const updateInlineField = (productId: string, field: keyof AccountingCost, value: number) => {
    setInlineEdits(prev => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const saveInlineEdit = (productId: string) => {
    const cost = inlineEdits[productId];
    if (!cost) return;
    setProducts(prev => prev.map(p =>
      p.id === productId ? { ...p, accountingCost: { ...cost } } : p
    ));
    const product = products.find(p => p.id === productId);
    toast.success(`บันทึกต้นทุน "${product?.name}" เรียบร้อย`);
    setEditingRowId(null);
  };

  const cancelInlineEdit = () => {
    setEditingRowId(null);
  };

  const getTotalCost = (item: ProductItem) => {
    if (!item.accountingCost) return null;
    return item.accountingCost.costPrice + item.accountingCost.shippingCost + item.accountingCost.vatPrice;
  };

  const getInlineTotalCost = (productId: string) => {
    const cost = inlineEdits[productId];
    if (!cost) return 0;
    return cost.costPrice + cost.shippingCost + cost.vatPrice;
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
            </div>
            <p className="text-xs text-muted-foreground">Model: {item.model} • หมวดหมู่: {item.category}</p>

            {/* Accounting cost display */}
            <div className="border-t pt-2 mt-2 space-y-1">
              {item.accountingCost ? (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">ต้นทุน:</span>
                    <span className="font-semibold">{item.accountingCost.costPrice.toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">ค่าขนส่ง:</span>
                    <span>{item.accountingCost.shippingCost.toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">VAT:</span>
                    <span>{item.accountingCost.vatPrice.toLocaleString()} ฿</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold border-t pt-1">
                    <span>รวมต้นทุน:</span>
                    <span className="text-primary">{getTotalCost(item)?.toLocaleString()} ฿</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground italic">ยังไม่ได้กรอกข้อมูลต้นทุน</p>
              )}
            </div>

            <div className="pt-1">{getStatusBadge(item.status, item.currentStock)}</div>
          </CardContent>
          <div className="flex justify-end items-center px-4 pb-4 gap-1">
            <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600 border-blue-300 hover:bg-blue-50"
              onClick={() => setDetailItem(item)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 border-green-300 hover:bg-green-50"
              onClick={() => openCostEdit(item)}>
              <DollarSign className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );

  // --- Table View with inline editing ---
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
              <TableHead className="text-right">คงเหลือ</TableHead>
              <TableHead className="text-right">ขั้นต่ำ</TableHead>
              <TableHead className="text-right min-w-[120px]">ราคาต้นทุน</TableHead>
              <TableHead className="text-right min-w-[120px]">ค่าขนส่ง</TableHead>
              <TableHead className="text-right min-w-[120px]">VAT</TableHead>
              <TableHead className="text-right">รวมต้นทุน</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const isEditing = editingRowId === item.id;
              const editData = inlineEdits[item.id];
              return (
                <TableRow key={item.id} className={`${item.status === "low_stock" ? "bg-amber-50" : ""} ${isEditing ? "bg-green-50/50 ring-1 ring-green-200" : ""}`}>
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
                  <TableCell className="font-medium text-red-600 max-w-[150px] truncate">{item.name}</TableCell>
                  <TableCell><span className="text-xs">{item.subcategory}</span></TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className={item.currentStock < item.minimumStock ? "text-red-600" : ""}>{item.currentStock}</span>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">{item.minimumStock}</TableCell>

                  {/* Inline editable cost fields */}
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-[110px] h-8 text-right text-sm ml-auto"
                        value={editData?.costPrice || ""}
                        onChange={(e) => updateInlineField(item.id, "costPrice", parseFloat(e.target.value) || 0)}
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`cursor-pointer hover:text-primary hover:underline text-sm ${item.accountingCost ? "" : "text-muted-foreground"}`}
                        onClick={() => startInlineEdit(item)}
                      >
                        {item.accountingCost ? `${item.accountingCost.costPrice.toLocaleString()} ฿` : "คลิกเพื่อกรอก"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-[110px] h-8 text-right text-sm ml-auto"
                        value={editData?.shippingCost || ""}
                        onChange={(e) => updateInlineField(item.id, "shippingCost", parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      <span
                        className={`cursor-pointer hover:text-primary hover:underline text-sm ${item.accountingCost ? "" : "text-muted-foreground"}`}
                        onClick={() => startInlineEdit(item)}
                      >
                        {item.accountingCost ? `${item.accountingCost.shippingCost.toLocaleString()} ฿` : "คลิกเพื่อกรอก"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        className="w-[110px] h-8 text-right text-sm ml-auto"
                        value={editData?.vatPrice || ""}
                        onChange={(e) => updateInlineField(item.id, "vatPrice", parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      <span
                        className={`cursor-pointer hover:text-primary hover:underline text-sm ${item.accountingCost ? "" : "text-muted-foreground"}`}
                        onClick={() => startInlineEdit(item)}
                      >
                        {item.accountingCost ? `${item.accountingCost.vatPrice.toLocaleString()} ฿` : "คลิกเพื่อกรอก"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-sm font-bold text-primary">
                    {isEditing
                      ? `${getInlineTotalCost(item.id).toLocaleString()} ฿`
                      : getTotalCost(item) !== null
                        ? `${getTotalCost(item)?.toLocaleString()} ฿`
                        : <span className="text-muted-foreground font-normal">-</span>
                    }
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status, item.currentStock)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {isEditing ? (
                        <>
                          <Button size="sm" className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700" onClick={() => saveInlineEdit(item.id)}>
                            <Save className="w-3 h-3 mr-1" /> บันทึก
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={cancelInlineEdit}>
                            ยกเลิก
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => startInlineEdit(item)} title="แก้ไขต้นทุน">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-600" onClick={() => setDetailItem(item)} title="ดูรายละเอียด">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">สต๊อกสินค้า (ฝ่ายบัญชี)</h1>
        <p className="text-muted-foreground">ดูรายการสินค้าและกรอกข้อมูลต้นทุน ค่าขนส่ง และ VAT</p>
      </div>

      {/* Summary Cards */}
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

        <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => { setActiveTab("products"); setSelectedCategory("defective"); }}>
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
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" /> ประวัติเคลื่อนไหว
          </TabsTrigger>
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

          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-semibold">{filteredItems.length}</span> รายการ
          </p>

          {viewMode === "card" ? renderCardView() : renderTableView()}
        </TabsContent>

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
      </Tabs>

      {/* ===== Cost Editing Dialog ===== */}
      <Dialog open={!!costEditItem} onOpenChange={(open) => !open && setCostEditItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" /> กรอกข้อมูลต้นทุนสินค้า
            </DialogTitle>
          </DialogHeader>
          {costEditItem && (
            <div className="space-y-5">
              {/* Product info */}
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                {costEditItem.image ? (
                  <img src={costEditItem.image} alt={costEditItem.name} className="w-12 h-12 object-contain rounded border bg-white p-0.5" />
                ) : (
                  <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">{costEditItem.name}</p>
                  <p className="text-xs text-muted-foreground">{costEditItem.code} • คงเหลือ: <span className="font-bold text-foreground">{costEditItem.currentStock}</span> {costEditItem.unit}</p>
                </div>
              </div>

              {/* Cost fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-600" /> ราคาต้นทุนสินค้า (บาท)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="กรอกราคาต้นทุน"
                    value={costForm.costPrice || ""}
                    onChange={(e) => setCostForm(prev => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Truck className="w-4 h-4 text-amber-600" /> ราคาค่าขนส่ง (บาท)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="กรอกค่าขนส่ง"
                    value={costForm.shippingCost || ""}
                    onChange={(e) => setCostForm(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" /> ราคา VAT (บาท)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="กรอกราคา VAT"
                    value={costForm.vatPrice || ""}
                    onChange={(e) => setCostForm(prev => ({ ...prev, vatPrice: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                {/* Total calculation */}
                <div className="bg-muted/50 rounded-lg p-4 border">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ราคาต้นทุน:</span>
                      <span>{costForm.costPrice.toLocaleString()} ฿</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ค่าขนส่ง:</span>
                      <span>{costForm.shippingCost.toLocaleString()} ฿</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VAT:</span>
                      <span>{costForm.vatPrice.toLocaleString()} ฿</span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t pt-2">
                      <span>รวมต้นทุนทั้งหมด:</span>
                      <span className="text-primary">
                        {(costForm.costPrice + costForm.shippingCost + costForm.vatPrice).toLocaleString()} ฿
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCostEditItem(null)}>ยกเลิก</Button>
            <Button onClick={handleSaveCost} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-1.5" /> บันทึกต้นทุน
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

              {/* Accounting Cost in detail */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-green-600" /> ข้อมูลต้นทุน (ฝ่ายบัญชี)
                </h4>
                {detailItem.accountingCost ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ราคาต้นทุนสินค้า:</span>
                      <span className="font-semibold">{detailItem.accountingCost.costPrice.toLocaleString()} ฿</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ราคาค่าขนส่ง:</span>
                      <span className="font-semibold">{detailItem.accountingCost.shippingCost.toLocaleString()} ฿</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ราคา VAT:</span>
                      <span className="font-semibold">{detailItem.accountingCost.vatPrice.toLocaleString()} ฿</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-green-300 pt-1.5">
                      <span>รวมต้นทุนทั้งหมด:</span>
                      <span className="text-green-700">{getTotalCost(detailItem)?.toLocaleString()} ฿</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic py-2">ยังไม่ได้กรอกข้อมูลต้นทุน</p>
                )}
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
                    <TableHeader><TableRow className="bg-muted/50"><TableHead className="text-xs">Model</TableHead><TableHead className="text-xs text-right">ราคาปลีก</TableHead><TableHead className="text-xs text-right">ค่าโมล</TableHead><TableHead className="text-xs text-right">ราคาพิเศษ</TableHead></TableRow></TableHeader>
                    <TableBody>{detailItem.prices.map((p, i) => (
                      <TableRow key={i}><TableCell className="text-xs">{p.model}</TableCell><TableCell className="text-xs text-right">{p.retailPrice.toLocaleString()}</TableCell><TableCell className="text-xs text-right">{p.moldCost.toLocaleString()}</TableCell><TableCell className="text-xs text-right">{p.specialPrice.toLocaleString()}</TableCell></TableRow>
                    ))}</TableBody>
                  </Table>
                </div>
              )}
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
    </div>
  );
};

export default AccountingProductInventory;
