import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Search, QrCode, Eye, Pencil } from "lucide-react";
import { Supply, Requisition } from "./types";
import { toast } from "sonner";

type SortKey = "code" | "name" | "category" | "quantity" | "pricePerUnit" | "dateReceived";

interface Props {
  supplies: Supply[];
  requisitions: Requisition[];
  onView: (supply: Supply) => void;
  onEdit: (supply: Supply) => void;
}

const SupplyStockTable = ({ supplies, requisitions, onView, onEdit }: Props) => {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("code");
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = supplies
    .filter((s) => {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "code") cmp = a.code.localeCompare(b.code);
      else if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "category") cmp = a.category.localeCompare(b.category);
      else if (sortKey === "quantity") cmp = a.quantity - b.quantity;
      else if (sortKey === "pricePerUnit") cmp = a.pricePerUnit - b.pricePerUnit;
      else if (sortKey === "dateReceived") cmp = a.dateReceived.localeCompare(b.dateReceived);
      return sortAsc ? cmp : -cmp;
    });

  const SortIcon = () => <ArrowUpDown className="inline w-3 h-3 ml-1" />;

  const handlePrintQR = (supply: Supply) => {
    toast.info(`พิมพ์ QR Code: ${supply.code} - ${supply.name}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="ค้นหา รหัส / ชื่อ / หมวดหมู่..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>
      <div className="rounded-md border overflow-auto scrollbar-littleboy max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary">
              {([
                ["code", "รหัส"],
                ["name", "ชื่อรายการ"],
                ["category", "หมวดหมู่"],
                ["quantity", "คงเหลือ"],
                ["pricePerUnit", "ราคา/หน่วย"],
                ["dateReceived", "วันที่รับเข้า"],
              ] as [SortKey, string][]).map(([key, label]) => (
                <TableHead
                  key={key}
                  className="text-primary-foreground cursor-pointer select-none whitespace-nowrap"
                  onClick={() => toggleSort(key)}
                >
                  {label}<SortIcon />
                </TableHead>
              ))}
              <TableHead className="text-primary-foreground text-center">สถานะ</TableHead>
              <TableHead className="text-primary-foreground text-center">QR</TableHead>
              <TableHead className="text-primary-foreground text-center">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => {
              const isLow = s.quantity <= s.minStock;
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs font-medium">{s.code}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell className="text-sm">{s.category}</TableCell>
                  <TableCell className={`text-center font-semibold ${isLow ? "text-[#D6275A]" : ""}`}>
                    {s.quantity} {s.unit}
                  </TableCell>
                  <TableCell className="text-right">฿{s.pricePerUnit.toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{s.dateReceived}</TableCell>
                  <TableCell className="text-center">
                    {isLow ? (
                      <Badge className="bg-[#D6275A] text-white">ใกล้หมด</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">ปกติ</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => handlePrintQR(s)} title="พิมพ์ QR Code">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-1">
                      <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50" onClick={() => onView(s)} title="ดู">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-orange-500 hover:bg-orange-50" onClick={() => onEdit(s)} title="แก้ไข">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {/* Summary footer */}
      <div className="flex flex-wrap gap-4 p-3 bg-muted/50 rounded-lg text-sm">
        <span>รวมทั้งหมด: <strong>{supplies.length}</strong> รายการ</span>
        <span>มูลค่ารวม: <strong>฿{supplies.reduce((s, i) => s + i.quantity * i.pricePerUnit, 0).toLocaleString()}</strong></span>
        <span className="text-[#D6275A]">ใกล้หมด: <strong>{supplies.filter((s) => s.quantity <= s.minStock).length}</strong> รายการ</span>
      </div>
    </div>
  );
};

export default SupplyStockTable;
