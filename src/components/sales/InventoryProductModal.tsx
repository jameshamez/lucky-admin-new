import { useState, useEffect, useMemo } from "react";
import {
  Search, X, LayoutGrid, List, Package,
  ChevronRight, CheckCircle2, Info, Loader2,
  Tag, Box
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const API_PRODUCT_URL = "https://nacres.co.th/api-lucky/portal/getProduct.php";
const BASE_IMAGE_URL = "https://nacres.co.th/api-lucky/";

interface InventoryProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: any) => void;
}

export default function InventoryProductModal({ isOpen, onClose, onSelect }: InventoryProductModalProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const categories = [
    { key: "all", label: "ทั้งหมด" },
    { key: "ถ้วยรางวัลสำเร็จ", label: "ถ้วยรางวัล" },
    { key: "เหรียญรางวัล", label: "เหรียญรางวัล" },
    { key: "โล่รางวัล", label: "โล่รางวัล" },
    { key: "เสื้อพิมพ์ลายและผ้า", label: "เสื้อ/ผ้า" },
  ];

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_PRODUCT_URL);
      const json = await response.json();
      if (json.status === "success" && Array.isArray(json.data)) {
        setProducts(json.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.modelName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id?.toString().includes(searchTerm);

      const subId = parseInt(p.subcategoryId || "0");
      let mainCat = p.category || "";
      if (subId >= 1 && subId <= 6) mainCat = "ถ้วยรางวัลสำเร็จ";
      if (subId >= 7 && subId <= 10) mainCat = "เหรียญรางวัล";
      if (subId >= 11 && subId <= 15) mainCat = "โล่รางวัล";
      if (subId >= 16 && subId <= 18) mainCat = "เสื้อพิมพ์ลายและผ้า";

      const matchesCategory = activeCategory === "all" || mainCat === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, activeCategory]);

  const handleSelect = (product: any) => {
    onSelect(product);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              คลังสินค้าสำเร็จรูป (Inventory Select)
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="h-8 w-8"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="h-8 w-8"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อสินค้า, รหัสโมเดล..."
                className="pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat) => (
                <Button
                  key={cat.key}
                  variant={activeCategory === cat.key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.key)}
                  className="rounded-full whitespace-nowrap"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-900/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground animate-pulse">กำลังโหลดข้อมูลสินค้าจากคลัง...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <Box className="w-16 h-16 opacity-20" />
              <p className="text-lg">ไม่พบข้อมูลสินค้าที่ค้นหา</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map((p) => (
                <Card
                  key={p.id}
                  className="group hover:ring-2 hover:ring-primary transition-all cursor-pointer overflow-hidden flex flex-col border-none shadow-sm"
                  onClick={() => handleSelect(p)}
                >
                  <div className="aspect-square relative bg-white overflow-hidden">
                    {p.image ? (
                      <img
                        src={`${BASE_IMAGE_URL}${p.image}`}
                        alt={p.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Package className="w-12 h-12 opacity-10" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge variant={parseInt(p.inventory) > 0 ? "default" : "destructive"} className="shadow-sm">
                        {parseInt(p.inventory) > 0 ? `สต็อก: ${p.inventory}` : "หมด"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3 flex-1 flex flex-col justify-between bg-white dark:bg-slate-800">
                    <div>
                      <div className="text-[10px] text-primary font-bold uppercase mb-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {p.modelName || `ID: ${p.id}`}
                      </div>
                      <h5 className="font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5rem]">
                        {p.name}
                      </h5>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-primary font-bold text-base">
                        ฿{parseFloat(p.price || 0).toLocaleString()}
                      </div>
                      <Button size="sm" className="h-7 px-2 text-[10px] gap-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        เลือก <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-transparent hover:border-primary hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => handleSelect(p)}
                >
                  <div className="w-16 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                    <img
                      src={`${BASE_IMAGE_URL}${p.image}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-primary font-bold">{p.modelName}</div>
                    <h5 className="font-semibold truncate">{p.name}</h5>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>หมวดหมู่: {p.category || SUBCATEGORY_MAP[p.subcategoryId]?.name || "ทั่วไป"}</span>
                      <span>สต็อก: {p.inventory}</span>
                    </div>
                  </div>
                  <div className="text-right px-4">
                    <div className="text-primary font-bold text-lg">฿{parseFloat(p.price || 0).toLocaleString()}</div>
                  </div>
                  <Button size="icon" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 border-t bg-muted/10">
          <p className="text-xs text-muted-foreground mr-auto flex items-center gap-1">
            <Info className="w-3 h-3" />
            แนะ: คลิกที่รูปสินค้าเพื่อเลือกรายการทันที
          </p>
          <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Copy of Master Subcategories for mapping logic in modal
const SUBCATEGORY_MAP: Record<string, { id: string; name: string }> = {
  "1": { id: "1", name: "ถ้วยรางวัลโลหะอิตาลี" },
  "2": { id: "2", name: "ถ้วยรางวัลโลหะจีน" },
  "3": { id: "3", name: "ถ้วยรางวัลพลาสติกอิตาลี" },
  "4": { id: "4", name: "ถ้วยรางวัลพลาสติกไทย" },
  "5": { id: "5", name: "ถ้วยรางวัลพิวเตอร์" },
  "6": { id: "6", name: "ถ้วยรางวัลเบญจรงค์" },
  "7": { id: "7", name: "เหรียญรางวัลสำเร็จรูป" },
  "8": { id: "8", name: "เหรียญรางวัลซิงค์อัลลอย" },
  "9": { id: "9", name: "เหรียญรางวัลอะคริลิก" },
  "10": { id: "10", name: "เหรียญรางวัลอื่นๆ" },
  "11": { id: "11", name: "โล่รางวัลอะคริลิก(สำเร็จ)" },
  "12": { id: "12", name: "โล่รางวัลอะคริลิก (สั่งผลิต)" },
  "13": { id: "13", name: "โล่รางวัลคริสตัล" },
  "14": { id: "14", name: "โล่รางวัลไม้" },
  "15": { id: "15", name: "โล่รางวัลเรซิน" },
  "16": { id: "16", name: "เสื้อคอปก" },
  "17": { id: "17", name: "เสื้อคอกลม" },
  "18": { id: "18", name: "เสื้อแขนยาว" },
};
