import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Package, AlertTriangle, FileSpreadsheet } from "lucide-react";
import ExcelImportDialog, { type ImportRow } from "@/components/procurement/ExcelImportDialog";

interface InventoryItem {
  id: string;
  image: string;
  manufact: string;
  name: string;
  sku: string;
  category: string;
  color: string;
  size: string;
  mtl: string;
  noted: string;
  description: string;
  quantity: number;
  minQty: number;
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
  status: "in_stock" | "out_of_stock" | "defective" | "low_stock";
}

const computeStatus = (qty: number, minQty: number): InventoryItem["status"] => {
  if (qty <= 0) return "out_of_stock";
  if (minQty > 0 && qty < minQty) return "low_stock";
  return "in_stock";
};

const initialInventory: InventoryItem[] = [
  {
    id: "1", image: "/placeholder.svg", manufact: "BC", name: "ถ้วยรางวัล B531 G",
    sku: "B531-G", category: "ถ้วยรางวัล", color: "G", size: "H192mm",
    mtl: "PLASTIC", noted: "", description: "ถ้วยรางวัลพลาสติก",
    quantity: 400, minQty: 50, priceYuan: 3.00, priceTHB: 15.60,
    amountRMB: 1200, totalTHB: 6240, pcsCtn: 200, ctn: 2,
    boxSize: "B2", boxSizeNum: 0.0350, shippingCost: 105.00,
    shippingPerPiece: 0.53, totalShipping: 16.13, meas: 0.0700, gw: 6.50, tgw: 13,
    status: "in_stock",
  },
  {
    id: "2", image: "/placeholder.svg", manufact: "BC", name: "ถ้วยรางวัล B531 S",
    sku: "B531-S", category: "ถ้วยรางวัล", color: "S", size: "H192mm",
    mtl: "PLASTIC", noted: "", description: "ถ้วยรางวัลพลาสติก สีเงิน",
    quantity: 400, minQty: 50, priceYuan: 3.00, priceTHB: 15.60,
    amountRMB: 1200, totalTHB: 6240, pcsCtn: 200, ctn: 2,
    boxSize: "B2", boxSizeNum: 0.0350, shippingCost: 105.00,
    shippingPerPiece: 0.53, totalShipping: 16.13, meas: 0.0700, gw: 6.50, tgw: 13,
    status: "in_stock",
  },
  {
    id: "3", image: "/placeholder.svg", manufact: "BC", name: "ถ้วยรางวัล B531 C",
    sku: "B531-C", category: "ถ้วยรางวัล", color: "C", size: "H192mm",
    mtl: "PLASTIC", noted: "", description: "ถ้วยรางวัลพลาสติก สีทองแดง",
    quantity: 400, minQty: 50, priceYuan: 3.00, priceTHB: 15.60,
    amountRMB: 1200, totalTHB: 6240, pcsCtn: 200, ctn: 2,
    boxSize: "B2", boxSizeNum: 0.0350, shippingCost: 105.00,
    shippingPerPiece: 0.53, totalShipping: 16.13, meas: 0.0700, gw: 6.50, tgw: 13,
    status: "in_stock",
  },
  {
    id: "4", image: "/placeholder.svg", manufact: "BC", name: "ถ้วยรางวัล B531 GRD",
    sku: "B531-GRD", category: "ถ้วยรางวัล", color: "GRD", size: "H192mm",
    mtl: "PLASTIC", noted: "", description: "ถ้วยรางวัลพลาสติก GRD",
    quantity: 0, minQty: 50, priceYuan: 3.60, priceTHB: 18.72,
    amountRMB: 1440, totalTHB: 7488, pcsCtn: 200, ctn: 2,
    boxSize: "B2", boxSizeNum: 0.0350, shippingCost: 105.00,
    shippingPerPiece: 0.53, totalShipping: 19.25, meas: 0.0700, gw: 6.50, tgw: 13,
    status: "out_of_stock",
  },
];

export default function InventoryStock() {
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showImportDialog, setShowImportDialog] = useState(false);

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufact.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    let matchesCategory = true;
    if (categoryFilter === "defective") {
      matchesCategory = item.status === "defective";
    } else if (categoryFilter !== "all") {
      matchesCategory = item.category === categoryFilter;
    }
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: InventoryItem["status"]) => {
    switch (status) {
      case "in_stock":
        return <Badge className="bg-green-600">✅ มีในสต็อก</Badge>;
      case "out_of_stock":
        return <Badge variant="destructive">❌ หมด</Badge>;
      case "defective":
        return <Badge className="bg-yellow-600">⚠️ มีตำหนิ</Badge>;
      case "low_stock":
        return <Badge className="bg-red-600">⚠️ ใกล้หมด</Badge>;
    }
  };

  const handleImportConfirm = (rows: ImportRow[]) => {
    const newItems: InventoryItem[] = rows.map((row, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      image: "/placeholder.svg",
      manufact: row.manufact || "-",
      name: row.name,
      sku: row.sku,
      category: row.category || "ไม่ระบุ",
      color: row.color || "-",
      size: row.size || "-",
      mtl: row.mtl || "-",
      noted: row.noted || "",
      description: row.description || "",
      quantity: row.quantity,
      minQty: row.minQty,
      priceYuan: row.priceYuan || 0,
      priceTHB: row.priceTHB || 0,
      amountRMB: row.amountRMB || 0,
      totalTHB: row.totalTHB || 0,
      pcsCtn: row.pcsCtn || 0,
      ctn: row.ctn || 0,
      boxSize: row.boxSize || "-",
      boxSizeNum: row.boxSizeNum || 0,
      shippingCost: row.shippingCost || 0,
      shippingPerPiece: row.shippingPerPiece || 0,
      totalShipping: row.totalShipping || 0,
      meas: row.meas || 0,
      gw: row.gw || 0,
      tgw: row.tgw || 0,
      status: computeStatus(row.quantity, row.minQty),
    }));
    setInventory(prev => [...prev, ...newItems]);
  };

  const existingSkus = inventory.map((item) => item.sku);

  const categories = [...new Set(inventory.map(i => i.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">สต๊อกสินค้า</h1>
          <p className="text-muted-foreground mt-2">
            ตรวจสอบข้อมูลสต็อกสินค้าในคลัง
          </p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowImportDialog(true)}>
          <FileSpreadsheet className="w-4 h-4 mr-2" /> นำเข้าจาก Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ค้นหาและกรองสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อสินค้า, รหัส SKU หรือโรงงาน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="กรองตามสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="in_stock">มีในสต็อก</SelectItem>
                <SelectItem value="out_of_stock">หมด</SelectItem>
                <SelectItem value="low_stock">ใกล้หมด</SelectItem>
                <SelectItem value="defective">มีตำหนิ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
              <Package className="w-4 h-4" /> ค้นหาตามหมวดหมู่
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "ทั้งหมด" },
                ...categories.map(c => ({ key: c, label: c })),
                { key: "defective", label: "สินค้ามีตำหนิ" },
              ].map((cat) => (
                <Badge
                  key={cat.key}
                  variant={categoryFilter === cat.key ? "default" : "outline"}
                  className={`cursor-pointer px-3 py-1.5 text-sm ${
                    categoryFilter === cat.key
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setCategoryFilter(cat.key)}
                >
                  {cat.key === "defective" && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {cat.label}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            รายการสินค้าทั้งหมด ({filteredInventory.length} รายการ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs whitespace-nowrap">ลำดับ</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">MANUFACT</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">PIC</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">CODE</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">SIZE</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">COLOR</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">MTL</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Noted</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">QTY</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">PRICE (¥)</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">บาท</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">AMOUNT RMB</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">ราคารวม THB</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">PCS/CTN</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">CTN</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">BOX SIZE</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">BOX SIZE</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">ค่าขนส่ง</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">ราคาค่าขนส่งต่อชิ้น</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right text-green-600 font-bold">รวมขนส่ง</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">MEAS</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">GW</TableHead>
                  <TableHead className="text-xs whitespace-nowrap text-right">T.GW</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item, index) => (
                  <TableRow key={item.id} className={item.status === "low_stock" ? "bg-red-50" : ""}>
                    <TableCell className="text-xs">{index + 1}</TableCell>
                    <TableCell className="text-xs font-medium bg-orange-50">{item.manufact}</TableCell>
                    <TableCell>
                      <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" />
                    </TableCell>
                    <TableCell className="text-xs font-medium">{item.sku}</TableCell>
                    <TableCell className="text-xs">{item.size}</TableCell>
                    <TableCell className="text-xs bg-blue-50">{item.color}</TableCell>
                    <TableCell className="text-xs bg-orange-50 font-medium">{item.mtl}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.noted || "-"}</TableCell>
                    <TableCell className="text-xs text-right font-semibold">{item.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">¥{item.priceYuan.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right text-purple-600 font-medium">฿{item.priceTHB.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right">¥{item.amountRMB.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right text-purple-600 font-bold">฿{item.totalTHB.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right">{item.pcsCtn}</TableCell>
                    <TableCell className="text-xs text-right">{item.ctn}</TableCell>
                    <TableCell className="text-xs">{item.boxSize}</TableCell>
                    <TableCell className="text-xs text-right">{item.boxSizeNum.toFixed(4)}</TableCell>
                    <TableCell className="text-xs text-right">{item.shippingCost.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right">{item.shippingPerPiece.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right text-green-600 font-bold">{item.totalShipping.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right">{item.meas.toFixed(4)}</TableCell>
                    <TableCell className="text-xs text-right">{item.gw.toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-right">{item.tgw}</TableCell>
                    <TableCell>
                      {getStatusBadge(item.status)}
                      {item.status === "low_stock" && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          ต่ำกว่าขั้นต่ำ
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ExcelImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportConfirm={handleImportConfirm}
        existingSkus={existingSkus}
      />
    </div>
  );
}
