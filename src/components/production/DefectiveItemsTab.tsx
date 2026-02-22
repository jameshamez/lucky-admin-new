import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Search, LayoutGrid, List, Package, Eye, AlertTriangle, ShoppingCart, Trash2,
} from "lucide-react";
import { toast } from "sonner";

// --- Data Types ---
interface DefectiveItem {
  id: string;
  code: string;
  name: string;
  image: string;
  category: string;
  subcategory: string;
  color: string;
  size: string;
  defectType: string;
  quantity: number;
  unit: string;
  reportDate: string;
  reportedBy: string;
  orderRef: string;
  note: string;
  status: "รอดำเนินการ" | "ตัดขาย" | "ทำลาย" | "ซ่อมแล้ว";
}

// --- Category Config ---
const categories = [
  { key: "all", label: "ทั้งหมด" },
  { key: "ถ้วยรางวัลสำเร็จ", label: "ถ้วยรางวัลสำเร็จ" },
  { key: "เหรียญรางวัล", label: "เหรียญรางวัล" },
  { key: "โล่รางวัล", label: "โล่รางวัล" },
  { key: "เสื้อพิมพ์ลายและผ้า", label: "เสื้อพิมพ์ลายและผ้า" },
  { key: "ชิ้นส่วนถ้วยรางวัล", label: "ชิ้นส่วนถ้วยรางวัล" },
];

// --- Mock Data ---
const initialDefectiveData: DefectiveItem[] = [
  {
    id: "DEF-001", code: "TC-001", name: "ถ้วยรางวัลสีทอง", image: "/placeholder.svg",
    category: "ถ้วยรางวัลสำเร็จ", subcategory: "ถ้วยรางวัลโลหะอิตาลี",
    color: "ทอง", size: "A", defectType: "สีผิดเพี้ยน",
    quantity: 5, unit: "ชิ้น", reportDate: "2025-02-10",
    reportedBy: "ทีม QC", orderRef: "ORD-001", note: "สีเคลือบไม่สม่ำเสมอ",
    status: "รอดำเนินการ",
  },
  {
    id: "DEF-002", code: "TC-003", name: "ถ้วยรางวัลโลหะอิตาลี - สีเงิน", image: "/placeholder.svg",
    category: "ถ้วยรางวัลสำเร็จ", subcategory: "ถ้วยรางวัลโลหะอิตาลี",
    color: "เงิน", size: "B", defectType: "รอยขีดข่วน",
    quantity: 3, unit: "ชิ้น", reportDate: "2025-02-08",
    reportedBy: "ทีม A", orderRef: "ORD-005", note: "มีรอยขีดข่วนที่ฐาน",
    status: "รอดำเนินการ",
  },
  {
    id: "DEF-003", code: "MD-001", name: "เหรียญพลาสติกรู้แพ้รู้ชนะ", image: "/placeholder.svg",
    category: "เหรียญรางวัล", subcategory: "เหรียญพลาสติก",
    color: "ทอง", size: "มาตรฐาน", defectType: "พิมพ์ไม่ชัด",
    quantity: 50, unit: "ชิ้น", reportDate: "2025-02-07",
    reportedBy: "ทีม QC", orderRef: "ORD-010", note: "ตัวอักษรเลือนหาย",
    status: "ตัดขาย",
  },
  {
    id: "DEF-004", code: "PL-001", name: "โล่คริสตัลพรีเมียม", image: "/placeholder.svg",
    category: "โล่รางวัล", subcategory: "โล่คริสตัล",
    color: "ใส", size: "8 นิ้ว", defectType: "แตกร้าว",
    quantity: 2, unit: "ชิ้น", reportDate: "2025-02-05",
    reportedBy: "ทีม B", orderRef: "ORD-012", note: "แตกร้าวจากการขนส่ง",
    status: "ทำลาย",
  },
  {
    id: "DEF-005", code: "CP-003", name: "ฝาครอบพลาสติก", image: "/placeholder.svg",
    category: "ชิ้นส่วนถ้วยรางวัล", subcategory: "ฝาครอบ",
    color: "ใส", size: "มาตรฐาน", defectType: "บิดงอ",
    quantity: 10, unit: "ชิ้น", reportDate: "2025-02-09",
    reportedBy: "ทีม QC", orderRef: "ORD-018", note: "ฝาบิดงอจากความร้อน",
    status: "รอดำเนินการ",
  },
];

export default function DefectiveItemsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [defectiveData, setDefectiveData] = useState<DefectiveItem[]>(initialDefectiveData);
  const [detailItem, setDetailItem] = useState<DefectiveItem | null>(null);
  const [sellItem, setSellItem] = useState<DefectiveItem | null>(null);
  const [sellQty, setSellQty] = useState("");
  const [sellNote, setSellNote] = useState("");

  const filteredItems = useMemo(() => {
    return defectiveData.filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.code.toLowerCase().includes(term) ||
        item.defectType.toLowerCase().includes(term);
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchTerm, selectedCategory, statusFilter, defectiveData]);

  const getStatusBadge = (status: DefectiveItem["status"]) => {
    switch (status) {
      case "รอดำเนินการ":
        return <Badge className="bg-amber-500 text-white">⏳ รอดำเนินการ</Badge>;
      case "ตัดขาย":
        return <Badge className="bg-blue-500 text-white">🛒 ตัดขาย</Badge>;
      case "ทำลาย":
        return <Badge variant="destructive">🗑️ ทำลาย</Badge>;
      case "ซ่อมแล้ว":
        return <Badge className="bg-green-600 text-white">✅ ซ่อมแล้ว</Badge>;
    }
  };

  const getDefectBadge = (type: string) => (
    <Badge variant="outline" className="text-destructive border-destructive/30">
      <AlertTriangle className="w-3 h-3 mr-1" />{type}
    </Badge>
  );

  const handleSellSubmit = () => {
    if (!sellItem) return;
    const qty = parseInt(sellQty);
    if (!qty || qty <= 0) {
      toast.error("กรุณากรอกจำนวนที่ถูกต้อง");
      return;
    }
    if (qty > sellItem.quantity) {
      toast.error(`จำนวนเกินสินค้ามีตำหนิ (มี ${sellItem.quantity} ${sellItem.unit})`);
      return;
    }

    setDefectiveData(prev => prev.map(item => {
      if (item.id !== sellItem.id) return item;
      const remaining = item.quantity - qty;
      return {
        ...item,
        quantity: remaining,
        status: remaining <= 0 ? "ตัดขาย" : item.status,
        note: item.note + (sellNote ? ` | ตัดขาย ${qty} ${item.unit}: ${sellNote}` : ` | ตัดขาย ${qty} ${item.unit}`),
      };
    }));

    toast.success(`ตัดออกขาย ${qty} ${sellItem.unit} เรียบร้อย`);
    setSellItem(null);
    setSellQty("");
    setSellNote("");
  };

  const handleDestroy = (item: DefectiveItem) => {
    setDefectiveData(prev => prev.map(d =>
      d.id === item.id ? { ...d, status: "ทำลาย" as const, quantity: 0 } : d
    ));
    toast.success(`ทำลายสินค้า ${item.name} เรียบร้อย`);
  };

  // --- Summary ---
  const summary = useMemo(() => ({
    total: defectiveData.reduce((s, i) => s + i.quantity, 0),
    pending: defectiveData.filter(i => i.status === "รอดำเนินการ").reduce((s, i) => s + i.quantity, 0),
    sold: defectiveData.filter(i => i.status === "ตัดขาย").length,
    destroyed: defectiveData.filter(i => i.status === "ทำลาย").length,
  }), [defectiveData]);

  // --- Card View ---
  const renderCardView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {filteredItems.map((item) => (
        <Card key={item.id} className="relative overflow-hidden flex flex-col">
          <Badge className="absolute top-3 right-3 z-10 bg-red-500 text-white text-xs">
            {item.subcategory || item.category}
          </Badge>

          <div className="h-48 bg-muted flex items-center justify-center overflow-hidden">
            {item.image ? (
              <img src={item.image} alt={item.name} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="text-muted-foreground text-sm flex flex-col items-center gap-2">
                <Package className="w-10 h-10 opacity-40" />
                ไม่มีรูปภาพ
              </div>
            )}
          </div>

          <CardContent className="flex-1 p-4 space-y-2">
            <h3 className="font-bold text-red-600 text-base leading-tight line-clamp-2">
              {item.name}
            </h3>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {item.color && <span>สี: {item.color}</span>}
              {item.size && <span>ขนาด: {item.size}</span>}
            </div>

            <p className="text-xs text-muted-foreground">
              รหัส: {item.code} • คงเหลือ: <span className="font-bold text-foreground">{item.quantity} {item.unit}</span>
            </p>

            <div className="flex flex-wrap gap-1.5">
              {getDefectBadge(item.defectType)}
              {getStatusBadge(item.status)}
            </div>

            <p className="text-xs text-muted-foreground">
              รายงานโดย: {item.reportedBy} • {item.reportDate}
            </p>
          </CardContent>

          <div className="flex justify-end gap-2 px-4 pb-4">
            {item.status === "รอดำเนินการ" && item.quantity > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1 border-blue-400 text-blue-600 hover:bg-blue-50"
                onClick={() => { setSellItem(item); setSellQty(""); setSellNote(""); }}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                ตัดออกขาย
              </Button>
            )}
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
              <TableHead>ประเภทตำหนิ</TableHead>
              <TableHead>สี</TableHead>
              <TableHead>ขนาด</TableHead>
              <TableHead className="text-right">จำนวน</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead>ผู้รายงาน</TableHead>
              <TableHead>วันที่</TableHead>
              <TableHead>จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} className={item.status === "รอดำเนินการ" ? "bg-amber-50/50" : ""}>
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
                <TableCell><span className="text-xs">{item.subcategory}</span></TableCell>
                <TableCell>{getDefectBadge(item.defectType)}</TableCell>
                <TableCell>{item.color}</TableCell>
                <TableCell>{item.size}</TableCell>
                <TableCell className="text-right font-semibold text-destructive">
                  {item.quantity} {item.unit}
                </TableCell>
                <TableCell>{getStatusBadge(item.status)}</TableCell>
                <TableCell className="text-xs">{item.reportedBy}</TableCell>
                <TableCell className="text-xs">{item.reportDate}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {item.status === "รอดำเนินการ" && item.quantity > 0 && (
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-blue-600 border-blue-300"
                        onClick={() => { setSellItem(item); setSellQty(""); setSellNote(""); }}>
                        <ShoppingCart className="w-3 h-3 mr-1" /> ตัดขาย
                      </Button>
                    )}
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
      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-muted-foreground">สินค้ามีตำหนิทั้งหมด</p>
            <p className="text-2xl font-bold text-destructive">{summary.total} ชิ้น</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-muted-foreground">รอดำเนินการ</p>
            <p className="text-2xl font-bold text-amber-600">{summary.pending} ชิ้น</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-muted-foreground">ตัดขายแล้ว</p>
            <p className="text-2xl font-bold text-blue-600">{summary.sold} รายการ</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-sm text-muted-foreground">ทำลายแล้ว</p>
            <p className="text-2xl font-bold text-muted-foreground">{summary.destroyed} รายการ</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="ค้นหาชื่อ, รหัสสินค้า, ประเภทตำหนิ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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

      {/* Category + Status Filter */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Package className="w-4 h-4" /> ค้นหาตามหมวดหมู่
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.key}
                variant={selectedCategory === cat.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.key)}
                className={selectedCategory === cat.key ? "bg-red-500 hover:bg-red-600 text-white" : ""}
              >
                {cat.label}
              </Button>
            ))}
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">กรองตามสถานะ</p>
            <div className="flex flex-wrap gap-2">
              {["all", "รอดำเนินการ", "ตัดขาย", "ทำลาย", "ซ่อมแล้ว"].map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className={statusFilter === s ? "bg-red-500 hover:bg-red-600 text-white" : ""}
                >
                  {s === "all" ? "ทั้งหมด" : s}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Count */}
      <p className="text-sm text-muted-foreground">
        <span className="text-primary font-semibold">{filteredItems.length}</span> รายการ
      </p>

      {/* Content */}
      {viewMode === "card" ? renderCardView() : renderTableView()}

      {/* ===== Sell Dialog ===== */}
      <Dialog open={!!sellItem} onOpenChange={(open) => !open && setSellItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              ตัดออกขาย (สินค้ามีตำหนิ)
            </DialogTitle>
          </DialogHeader>

          {sellItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                {sellItem.image ? (
                  <img src={sellItem.image} alt={sellItem.name} className="w-12 h-12 object-contain rounded border bg-white p-0.5" />
                ) : (
                  <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">{sellItem.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {sellItem.code} • ตำหนิ: {sellItem.defectType} • คงเหลือ: <span className="font-bold text-foreground">{sellItem.quantity}</span> {sellItem.unit}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">จำนวนที่ต้องการตัดขาย ({sellItem.unit})</Label>
                <Input
                  type="number"
                  min={1}
                  max={sellItem.quantity}
                  placeholder="กรอกจำนวน"
                  value={sellQty}
                  onChange={(e) => setSellQty(e.target.value)}
                />
                {parseInt(sellQty) > sellItem.quantity && (
                  <p className="text-xs text-destructive">⚠️ จำนวนเกินสินค้ามีตำหนิ ({sellItem.quantity} {sellItem.unit})</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">หมายเหตุ</Label>
                <Textarea
                  placeholder="เช่น ขายลดราคา, ส่งคืนซัพพลายเออร์"
                  value={sellNote}
                  onChange={(e) => setSellNote(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSellItem(null)}>ยกเลิก</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSellSubmit}>
              <ShoppingCart className="w-4 h-4 mr-1.5" /> ยืนยันตัดขาย
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
              รายละเอียดสินค้ามีตำหนิ
            </DialogTitle>
          </DialogHeader>

          {detailItem && (
            <div className="space-y-5">
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
                  <div className="flex gap-2 pt-1">
                    {getDefectBadge(detailItem.defectType)}
                    {getStatusBadge(detailItem.status)}
                  </div>
                </div>
              </div>

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
                  <p className="text-muted-foreground text-xs">สี</p>
                  <p className="font-medium">{detailItem.color || "-"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">ขนาด</p>
                  <p className="font-medium">{detailItem.size || "-"}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">จำนวนมีตำหนิ</p>
                  <p className="font-bold text-lg text-destructive">{detailItem.quantity} {detailItem.unit}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">ประเภทตำหนิ</p>
                  <p className="font-medium">{detailItem.defectType}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">ผู้รายงาน</p>
                  <p className="font-medium">{detailItem.reportedBy}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">วันที่รายงาน</p>
                  <p className="font-medium">{detailItem.reportDate}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">ออเดอร์อ้างอิง</p>
                  <p className="font-medium">{detailItem.orderRef}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-muted-foreground text-xs">หมายเหตุ</p>
                  <p className="font-medium">{detailItem.note || "-"}</p>
                </div>
              </div>

              {/* Actions in detail */}
              {detailItem.status === "รอดำเนินการ" && detailItem.quantity > 0 && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => { setSellItem(detailItem); setDetailItem(null); setSellQty(""); setSellNote(""); }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1.5" /> ตัดออกขาย
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => { handleDestroy(detailItem); setDetailItem(null); }}
                  >
                    <Trash2 className="w-4 h-4 mr-1.5" /> ทำลาย
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
