import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { accountingService } from "@/services/accountingService";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Monitor, Laptop, Smartphone, Plug, Search, Plus, Edit, Eye, QrCode,
  ArrowUpDown, Wrench, UserCheck, Package, ChevronRight, CalendarDays,
  DollarSign, Printer, History, Loader2
} from "lucide-react";

// ── Types ──
interface AssetHistoryEntry {
  id: string;
  date: string;
  type: "transfer" | "repair" | "upgrade" | "register";
  description: string;
  cost?: number;
  fromUser?: string;
  toUser?: string;
}

interface Asset {
  id: string;
  assetId: string;
  name: string;
  category: "คอมพิวเตอร์" | "โน้ตบุ๊ก" | "มือถือ" | "อุปกรณ์เสริม";
  assignedTo: string;
  purchaseDate: string;
  price: number;
  status: "ใช้งานอยู่" | "ว่าง" | "ส่งซ่อม" | "จำหน่ายออก";
  history: AssetHistoryEntry[];
}

// ── Helpers ──
const generateAssetId = (date: string, seq: number) => {
  const d = date.replace(/-/g, "");
  return `INV-${d}-${String(seq).padStart(3, "0")}`;
};

const today = new Date().toISOString().slice(0, 10);

// ── Colors (from spec) ──
const NAUTICAL_BLUE = "hsl(215 60% 22%)";       // #19-4050
const LITTLE_BOY_BLUE = "hsl(210 60% 65%)";     // #16-4132
const BERMUDA = "hsl(162 50% 50%)";              // green-teal
const PINK_YARROW = "hsl(330 72% 55%)";          // pink

// ── Mock Data ──
const initialAssets: Asset[] = [
  {
    id: "1", assetId: "INV-20240115-001", name: "MacBook Pro 14 M3", category: "โน้ตบุ๊ก",
    assignedTo: "สมชาย ใจดี", purchaseDate: "2024-01-15", price: 69900, status: "ใช้งานอยู่",
    history: [
      { id: "h1", date: "2024-01-15", type: "register", description: "นำเข้าอุปกรณ์ใหม่" },
      { id: "h2", date: "2024-01-16", type: "transfer", description: "มอบให้พนักงาน", fromUser: "-", toUser: "สมชาย ใจดี" },
      { id: "h3", date: "2024-06-10", type: "upgrade", description: "เพิ่ม RAM 16GB → 32GB", cost: 4500 },
    ],
  },
  {
    id: "2", assetId: "INV-20240220-002", name: "Dell OptiPlex 7010", category: "คอมพิวเตอร์",
    assignedTo: "สมหญิง รักงาน", purchaseDate: "2024-02-20", price: 25000, status: "ใช้งานอยู่",
    history: [
      { id: "h4", date: "2024-02-20", type: "register", description: "นำเข้าอุปกรณ์ใหม่" },
      { id: "h5", date: "2024-02-21", type: "transfer", description: "มอบให้พนักงาน", fromUser: "-", toUser: "สมหญิง รักงาน" },
    ],
  },
  {
    id: "3", assetId: "INV-20240301-003", name: "iPhone 15 Pro", category: "มือถือ",
    assignedTo: "", purchaseDate: "2024-03-01", price: 42900, status: "ว่าง",
    history: [
      { id: "h6", date: "2024-03-01", type: "register", description: "นำเข้าอุปกรณ์ใหม่" },
      { id: "h7", date: "2024-03-05", type: "transfer", description: "มอบให้พนักงาน", fromUser: "-", toUser: "วิชัย สุขใจ" },
      { id: "h8", date: "2024-11-01", type: "transfer", description: "คืนอุปกรณ์ (พนักงานลาออก)", fromUser: "วิชัย สุขใจ", toUser: "-" },
    ],
  },
  {
    id: "4", assetId: "INV-20240410-004", name: "Logitech MX Keys", category: "อุปกรณ์เสริม",
    assignedTo: "สมชาย ใจดี", purchaseDate: "2024-04-10", price: 3490, status: "ส่งซ่อม",
    history: [
      { id: "h9", date: "2024-04-10", type: "register", description: "นำเข้าอุปกรณ์ใหม่" },
      { id: "h10", date: "2024-12-01", type: "repair", description: "คีย์บอร์ดปุ่มค้าง ส่งศูนย์", cost: 800 },
    ],
  },
  {
    id: "5", assetId: "INV-20230815-005", name: "Samsung Galaxy S23", category: "มือถือ",
    assignedTo: "", purchaseDate: "2023-08-15", price: 29900, status: "จำหน่ายออก",
    history: [
      { id: "h11", date: "2023-08-15", type: "register", description: "นำเข้าอุปกรณ์ใหม่" },
      { id: "h12", date: "2024-08-15", type: "transfer", description: "จำหน่ายออก (ครบอายุใช้งาน)", fromUser: "แผนกขาย", toUser: "-" },
    ],
  },
  {
    id: "6", assetId: "INV-20240501-006", name: "ASUS VivoBook 15", category: "โน้ตบุ๊ก",
    assignedTo: "อรุณ แสงจันทร์", purchaseDate: "2024-05-01", price: 19900, status: "ใช้งานอยู่",
    history: [
      { id: "h13", date: "2024-05-01", type: "register", description: "นำเข้าอุปกรณ์ใหม่" },
      { id: "h14", date: "2024-05-02", type: "transfer", description: "มอบให้พนักงาน", fromUser: "-", toUser: "อรุณ แสงจันทร์" },
      { id: "h15", date: "2024-09-15", type: "repair", description: "เปลี่ยนแบตเตอรี่", cost: 2200 },
    ],
  },
];

// ── Component ──
const OfficeInventory = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [bubbleFilter, setBubbleFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const res = await accountingService.getOfficeAssets();
      if (res.status === 'success') {
        const mapped = res.data.map((a: any) => ({
          id: a.id,
          assetId: a.asset_id,
          name: a.name,
          category: a.category,
          assignedTo: a.assigned_to || "",
          purchaseDate: a.purchase_date,
          price: Number(a.price),
          status: a.status,
          history: [] // Initially empty, load on demand
        }));
        setAssets(mapped);
      }
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลทรัพย์สินได้");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssetDetails = async (asset: Asset) => {
    try {
      const res = await accountingService.getOfficeAssetDetails(asset.id);
      if (res.status === 'success') {
        const a = res.data;
        const mappedAsset: Asset = {
          id: a.id,
          assetId: a.asset_id,
          name: a.name,
          category: a.category,
          assignedTo: a.assigned_to || "",
          purchaseDate: a.purchase_date,
          price: Number(a.price),
          status: a.status,
          history: a.history.map((h: any) => ({
            id: h.id,
            date: h.date,
            type: h.type as any,
            description: h.description,
            cost: h.cost,
            fromUser: h.fromUser,
            toUser: h.toUser
          }))
        };
        setSelectedAsset(mappedAsset);
        setShowHistoryDrawer(true);
      }
    } catch (error) {
      toast.error("ไม่สามารถโหลดประวัติได้");
    }
  };

  // Drawers & Dialogs
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);

  // Add form
  const [addForm, setAddForm] = useState({
    name: "", category: "คอมพิวเตอร์" as Asset["category"],
    assignedTo: "", purchaseDate: today, price: 0, status: "ใช้งานอยู่" as Asset["status"],
    assetIdOverride: "",
  });

  // ── Filtering ──
  const filteredAssets = useMemo(() => {
    let result = [...assets];

    // Bubble filter
    if (bubbleFilter === "available") result = result.filter(a => a.status === "ว่าง");
    else if (bubbleFilter === "assigned") result = result.filter(a => a.assignedTo !== "");
    else if (bubbleFilter === "repair") result = result.filter(a => a.status === "ส่งซ่อม");

    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(a =>
        a.assetId.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.assignedTo.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const valA = (a as any)[sortKey];
        const valB = (b as any)[sortKey];
        const cmp = typeof valA === "number" ? valA - valB : String(valA).localeCompare(String(valB));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [assets, searchTerm, bubbleFilter, sortKey, sortDir]);

  // ── Summary stats ──
  const totalValue = assets.reduce((s, a) => s + a.price, 0);
  const countByCategory = (cat: string) => assets.filter(a => a.category === cat).length;
  const countByStatus = (st: string) => assets.filter(a => a.status === st).length;

  // ── Sort handler ──
  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const SortHeader = ({ label, field }: { label: string; field: string }) => (
    <TableHead
      className="cursor-pointer select-none text-primary-foreground whitespace-nowrap bg-primary"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-60" />
      </span>
    </TableHead>
  );

  // ── Status badge ──
  const getStatusBadge = (status: Asset["status"]) => {
    switch (status) {
      case "ใช้งานอยู่": return <Badge style={{ backgroundColor: BERMUDA, color: "#fff" }}>ใช้งานอยู่</Badge>;
      case "ว่าง": return <Badge style={{ backgroundColor: LITTLE_BOY_BLUE, color: "#fff" }}>ว่าง</Badge>;
      case "ส่งซ่อม": return <Badge style={{ backgroundColor: PINK_YARROW, color: "#fff" }}>ส่งซ่อม</Badge>;
      case "จำหน่ายออก": return <Badge variant="outline">จำหน่ายออก</Badge>;
    }
  };

  // ── Category icon ──
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "คอมพิวเตอร์": return <Monitor className="h-4 w-4" />;
      case "โน้ตบุ๊ก": return <Laptop className="h-4 w-4" />;
      case "มือถือ": return <Smartphone className="h-4 w-4" />;
      default: return <Plug className="h-4 w-4" />;
    }
  };

  // ── History type icon + color ──
  const getHistoryStyle = (type: AssetHistoryEntry["type"]) => {
    switch (type) {
      case "transfer": return { icon: <UserCheck className="h-4 w-4" />, color: LITTLE_BOY_BLUE, label: "ย้ายผู้ใช้" };
      case "repair": return { icon: <Wrench className="h-4 w-4" />, color: PINK_YARROW, label: "ซ่อมแซม" };
      case "upgrade": return { icon: <Plug className="h-4 w-4" />, color: BERMUDA, label: "อัปเกรด" };
      case "register": return { icon: <Package className="h-4 w-4" />, color: NAUTICAL_BLUE, label: "นำเข้า" };
    }
  };

  // ── Add asset ──
  const handleAddAsset = async () => {
    const seq = assets.length + 1;
    const assetId = addForm.assetIdOverride || generateAssetId(addForm.purchaseDate, seq);

    const payload = {
      assetId,
      name: addForm.name,
      category: addForm.category,
      assignedTo: addForm.assignedTo,
      purchaseDate: addForm.purchaseDate,
      price: addForm.price,
      status: addForm.status
    };

    try {
      const res = await accountingService.saveOfficeAsset(payload);
      if (res.status === 'success') {
        toast.success("เพิ่มทรัพย์สินเรียบร้อยแล้ว");
        setShowAddDialog(false);
        setAddForm({ name: "", category: "คอมพิวเตอร์", assignedTo: "", purchaseDate: today, price: 0, status: "ใช้งานอยู่", assetIdOverride: "" });
        fetchAssets();
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("การสื่อสารกับเซิร์ฟเวอร์ล้มเหลว");
    }
  };

  // ── Edit asset ──
  const handleSaveEdit = async () => {
    if (!editAsset) return;

    const payload = {
      id: editAsset.id,
      assetId: editAsset.assetId,
      name: editAsset.name,
      category: editAsset.category,
      assignedTo: editAsset.assignedTo,
      purchaseDate: editAsset.purchaseDate,
      price: editAsset.price,
      status: editAsset.status
    };

    try {
      const res = await accountingService.saveOfficeAsset(payload);
      if (res.status === 'success') {
        toast.success("แก้ไขข้อมูลเรียบร้อยแล้ว");
        setShowEditDialog(false);
        fetchAssets();
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("การสื่อสารกับเซิร์ฟเวอร์ล้มเหลว");
    }
  };

  // ── Print QR (simple text simulation) ──
  const handlePrintQR = (asset: Asset) => {
    const url = `${window.location.origin}/accounting/office-inventory?asset=${asset.assetId}`;
    const w = window.open("", "_blank", "width=400,height=500");
    if (w) {
      w.document.write(`
        <html><head><title>QR Label - ${asset.assetId}</title>
        <style>body{font-family:sans-serif;text-align:center;padding:40px}
        .qr{width:200px;height:200px;margin:20px auto;border:2px solid #333;display:flex;align-items:center;justify-content:center;font-size:12px;word-break:break-all;padding:10px}
        .id{font-size:18px;font-weight:bold;margin-top:16px}
        .name{color:#666;margin-top:8px}
        @media print{button{display:none}}</style></head>
        <body>
          <div class="qr">QR: ${url}</div>
          <div class="id">${asset.assetId}</div>
          <div class="name">${asset.name}</div>
          <br/><button onclick="window.print()">🖨️ พิมพ์</button>
        </body></html>
      `);
    }
  };

  // ── Bubble filters ──
  const bubbles = [
    { key: "all", label: "ทั้งหมด", count: assets.length, color: NAUTICAL_BLUE },
    { key: "available", label: "อุปกรณ์ว่าง", count: countByStatus("ว่าง"), color: LITTLE_BOY_BLUE },
    { key: "assigned", label: "มีผู้ดูแล", count: assets.filter(a => a.assignedTo !== "").length, color: BERMUDA },
    { key: "repair", label: "กำลังส่งซ่อม", count: countByStatus("ส่งซ่อม"), color: PINK_YARROW },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">จัดการทรัพย์สินสำนักงาน</h1>
          <p className="text-muted-foreground mt-1">ติดตามอุปกรณ์ IT และทรัพย์สินของบริษัท พร้อมระบบ QR Code</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" /> เพิ่มทรัพย์สิน
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">มูลค่าทรัพย์สินรวม</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: NAUTICAL_BLUE }}>฿{totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        {[
          { label: "คอมพิวเตอร์", icon: Monitor, cat: "คอมพิวเตอร์" },
          { label: "โน้ตบุ๊ก", icon: Laptop, cat: "โน้ตบุ๊ก" },
          { label: "มือถือ", icon: Smartphone, cat: "มือถือ" },
        ].map(c => (
          <Card key={c.cat}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{countByCategory(c.cat)} <span className="text-sm font-normal text-muted-foreground">เครื่อง</span></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bubble Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        {bubbles.map(b => (
          <button
            key={b.key}
            onClick={() => setBubbleFilter(b.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${bubbleFilter === b.key ? "text-white shadow-md" : "bg-background text-foreground hover:opacity-80"}`}
            style={bubbleFilter === b.key ? { backgroundColor: b.color, borderColor: b.color } : { borderColor: b.color, color: b.color }}
          >
            {b.label} ({b.count})
          </button>
        ))}
        <div className="flex-1 min-w-[250px] relative ml-auto">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อพนักงาน, รหัสอุปกรณ์, ชื่ออุปกรณ์..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Asset Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full" style={{ maxHeight: "65vh" }}>
            <style>{`
              [data-radix-scroll-area-viewport]::-webkit-scrollbar { width: 8px; }
              [data-radix-scroll-area-viewport]::-webkit-scrollbar-thumb { background: ${LITTLE_BOY_BLUE}40; border-radius: 4px; }
              [data-radix-scroll-area-viewport]::-webkit-scrollbar-track { background: transparent; }
            `}</style>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHeader label="รหัสอุปกรณ์" field="assetId" />
                  <SortHeader label="ชื่ออุปกรณ์/รุ่น" field="name" />
                  <SortHeader label="ประเภท" field="category" />
                  <SortHeader label="ผู้ดูแล/ผู้ใช้งาน" field="assignedTo" />
                  <SortHeader label="วันที่ซื้อ" field="purchaseDate" />
                  <SortHeader label="ราคา (฿)" field="price" />
                  <SortHeader label="สถานะ" field="status" />
                  <TableHead className="text-center text-primary-foreground whitespace-nowrap bg-primary">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      ไม่พบรายการทรัพย์สิน
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssets.map(asset => (
                    <TableRow key={asset.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => fetchAssetDetails(asset)}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4 opacity-40" />
                          {asset.assetId}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{asset.name}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1.5">{getCategoryIcon(asset.category)} {asset.category}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {asset.assignedTo ? (
                          asset.assignedTo
                        ) : (
                          <span style={{ color: LITTLE_BOY_BLUE }} className="font-medium">อุปกรณ์ว่าง</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{asset.purchaseDate}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">฿{asset.price.toLocaleString()}</TableCell>
                      <TableCell className="whitespace-nowrap">{getStatusBadge(asset.status)}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" title="ดูประวัติ" onClick={() => fetchAssetDetails(asset)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="แก้ไข" onClick={() => { setEditAsset({ ...asset }); setShowEditDialog(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="พิมพ์ QR Code" onClick={() => handlePrintQR(asset)}>
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Footer summary */}
          <div className="border-t p-4 flex flex-wrap gap-6 text-sm">
            <span className="font-semibold">รวมทั้งหมด: {assets.length} รายการ</span>
            <span>มูลค่ารวม: <strong>฿{totalValue.toLocaleString()}</strong></span>
            <Separator orientation="vertical" className="h-5" />
            <span>คอมฯ: {countByCategory("คอมพิวเตอร์")}</span>
            <span>โน้ตบุ๊ก: {countByCategory("โน้ตบุ๊ก")}</span>
            <span>มือถือ: {countByCategory("มือถือ")}</span>
            <span>อุปกรณ์เสริม: {countByCategory("อุปกรณ์เสริม")}</span>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════ History Drawer (3:4 width) ═══════════ */}
      <Sheet open={showHistoryDrawer} onOpenChange={setShowHistoryDrawer}>
        <SheetContent className="w-[75vw] sm:max-w-[75vw] p-0 overflow-hidden">
          {selectedAsset && (
            <div className="h-full flex flex-col">
              <SheetHeader className="p-6 pb-4 border-b" style={{ backgroundColor: `${NAUTICAL_BLUE}08` }}>
                <SheetTitle className="text-xl flex items-center gap-3">
                  {getCategoryIcon(selectedAsset.category)}
                  {selectedAsset.name}
                </SheetTitle>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1"><QrCode className="h-3.5 w-3.5" /> {selectedAsset.assetId}</span>
                  <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> ซื้อ: {selectedAsset.purchaseDate}</span>
                  <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" /> ฿{selectedAsset.price.toLocaleString()}</span>
                  {getStatusBadge(selectedAsset.status)}
                </div>
                <div className="mt-2 text-sm">
                  <span className="font-medium">ผู้ดูแล: </span>
                  {selectedAsset.assignedTo || <span style={{ color: LITTLE_BOY_BLUE }}>อุปกรณ์ว่าง</span>}
                </div>
              </SheetHeader>

              <ScrollArea className="flex-1 p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                  <History className="h-5 w-5" /> ประวัติทรัพย์สิน (Timeline)
                </h3>

                <div className="relative pl-8">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-border" />

                  {[...selectedAsset.history].reverse().map((entry, idx) => {
                    const style = getHistoryStyle(entry.type);
                    return (
                      <div key={entry.id} className="relative mb-8 last:mb-0">
                        {/* Dot */}
                        <div
                          className="absolute -left-8 w-8 h-8 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: style.color }}
                        >
                          {style.icon}
                        </div>

                        <Card className="ml-4">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline" style={{ borderColor: style.color, color: style.color }}>{style.label}</Badge>
                              <span className="text-xs text-muted-foreground">{entry.date}</span>
                            </div>
                            <p className="text-sm mt-2">{entry.description}</p>
                            {(entry.fromUser || entry.toUser) && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span>{entry.fromUser || "-"}</span>
                                <ChevronRight className="h-3 w-3" />
                                <span className="font-medium text-foreground">{entry.toUser || "-"}</span>
                              </div>
                            )}
                            {entry.cost != null && entry.cost > 0 && (
                              <div className="mt-2 text-xs font-medium" style={{ color: PINK_YARROW }}>
                                ค่าใช้จ่าย: ฿{entry.cost.toLocaleString()}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══════════ Add Asset Dialog ═══════════ */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มทรัพย์สินใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชื่ออุปกรณ์/รุ่น *</Label>
                <Input value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} placeholder="เช่น MacBook Pro 14 M3" />
              </div>
              <div className="space-y-2">
                <Label>ประเภท *</Label>
                <Select value={addForm.category} onValueChange={(v: Asset["category"]) => setAddForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="คอมพิวเตอร์">คอมพิวเตอร์</SelectItem>
                    <SelectItem value="โน้ตบุ๊ก">โน้ตบุ๊ก</SelectItem>
                    <SelectItem value="มือถือ">มือถือ</SelectItem>
                    <SelectItem value="อุปกรณ์เสริม">อุปกรณ์เสริม</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>วันที่ซื้อ *</Label>
                <Input type="date" value={addForm.purchaseDate} onChange={e => setAddForm(p => ({ ...p, purchaseDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>ราคา (฿) *</Label>
                <Input type="number" value={addForm.price || ""} onChange={e => setAddForm(p => ({ ...p, price: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>ผู้ดูแล/ผู้ใช้งาน</Label>
                <Input value={addForm.assignedTo} onChange={e => setAddForm(p => ({ ...p, assignedTo: e.target.value }))} placeholder="ชื่อพนักงาน (ว่างได้)" />
              </div>
              <div className="space-y-2">
                <Label>สถานะ</Label>
                <Select value={addForm.status} onValueChange={(v: Asset["status"]) => setAddForm(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ใช้งานอยู่">ใช้งานอยู่</SelectItem>
                    <SelectItem value="ว่าง">ว่าง</SelectItem>
                    <SelectItem value="ส่งซ่อม">ส่งซ่อม</SelectItem>
                    <SelectItem value="จำหน่ายออก">จำหน่ายออก</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>รหัสอุปกรณ์ (Auto หรือกำหนดเอง)</Label>
              <Input
                value={addForm.assetIdOverride}
                onChange={e => setAddForm(p => ({ ...p, assetIdOverride: e.target.value }))}
                placeholder={`Auto: ${generateAssetId(addForm.purchaseDate, assets.length + 1)}`}
              />
              <p className="text-xs text-muted-foreground">ถ้าไม่กรอก ระบบจะสร้าง INV-YYYYMMDD-XXX อัตโนมัติ</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleAddAsset} disabled={!addForm.name}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Edit Asset Dialog ═══════════ */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>แก้ไขทรัพย์สิน</DialogTitle>
          </DialogHeader>
          {editAsset && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>รหัสอุปกรณ์</Label>
                  <Input value={editAsset.assetId} onChange={e => setEditAsset(p => p ? { ...p, assetId: e.target.value } : p)} />
                </div>
                <div className="space-y-2">
                  <Label>ชื่ออุปกรณ์/รุ่น</Label>
                  <Input value={editAsset.name} onChange={e => setEditAsset(p => p ? { ...p, name: e.target.value } : p)} />
                </div>
                <div className="space-y-2">
                  <Label>ประเภท</Label>
                  <Select value={editAsset.category} onValueChange={(v: Asset["category"]) => setEditAsset(p => p ? { ...p, category: v } : p)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="คอมพิวเตอร์">คอมพิวเตอร์</SelectItem>
                      <SelectItem value="โน้ตบุ๊ก">โน้ตบุ๊ก</SelectItem>
                      <SelectItem value="มือถือ">มือถือ</SelectItem>
                      <SelectItem value="อุปกรณ์เสริม">อุปกรณ์เสริม</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ราคา (฿)</Label>
                  <Input type="number" value={editAsset.price} onChange={e => setEditAsset(p => p ? { ...p, price: Number(e.target.value) } : p)} />
                </div>
                <div className="space-y-2">
                  <Label>ผู้ดูแล/ผู้ใช้งาน</Label>
                  <Input value={editAsset.assignedTo} onChange={e => setEditAsset(p => p ? { ...p, assignedTo: e.target.value } : p)} />
                </div>
                <div className="space-y-2">
                  <Label>สถานะ</Label>
                  <Select value={editAsset.status} onValueChange={(v: Asset["status"]) => setEditAsset(p => p ? { ...p, status: v } : p)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ใช้งานอยู่">ใช้งานอยู่</SelectItem>
                      <SelectItem value="ว่าง">ว่าง</SelectItem>
                      <SelectItem value="ส่งซ่อม">ส่งซ่อม</SelectItem>
                      <SelectItem value="จำหน่ายออก">จำหน่ายออก</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>วันที่ซื้อ</Label>
                  <Input type="date" value={editAsset.purchaseDate} onChange={e => setEditAsset(p => p ? { ...p, purchaseDate: e.target.value } : p)} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleSaveEdit}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficeInventory;
