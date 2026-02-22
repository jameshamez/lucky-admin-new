import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { format, parse, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { th } from "date-fns/locale";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const mockTransactions = [
  {
    id: "TXN001",
    date: "2025-01-15 14:30:22",
    refDoc: "PO-2025-001",
    type: "รับเข้า",
    product: "ถังขยะพลาสติก 120L",
    warehouse: "TEG",
    statusFrom: "-",
    statusTo: "พร้อมผลิต",
    quantity: 100,
    by: "สมชาย ใจดี",
    note: "รับเข้าจากซัพพลายเออร์"
  },
  {
    id: "TXN002",
    date: "2025-01-15 13:15:08",
    refDoc: "T-001",
    type: "โอนคลัง",
    product: "ถังขยะพลาสติก 120L",
    warehouse: "TEG → Lucky",
    statusFrom: "พร้อมผลิต",
    statusTo: "พร้อมผลิต",
    quantity: 50,
    by: "สมชาย ใจดี",
    note: "โอนไปสาขา Lucky"
  },
  {
    id: "TXN003",
    date: "2025-01-15 11:45:33",
    refDoc: "SO-2025-045",
    type: "ตัดออก",
    product: "ถังขยะพลาสติก 240L",
    warehouse: "Lucky",
    statusFrom: "พร้อมผลิต",
    statusTo: "-",
    quantity: 25,
    by: "สมหญิง รักงาน",
    note: "จัดส่งตามคำสั่งซื้อ"
  },
  {
    id: "TXN004",
    date: "2025-01-15 10:20:15",
    refDoc: "ADJ-001",
    type: "ปรับยอด",
    product: "ถังขยะสแตนเลส 80L",
    warehouse: "TEG",
    statusFrom: "พร้อมผลิต",
    statusTo: "พร้อมผลิต",
    quantity: -5,
    by: "สมศักดิ์ ซื่อสัตย์",
    note: "สินค้าสูญหายจากการนับสต็อก"
  },
  {
    id: "TXN005",
    date: "2025-01-14 16:30:44",
    refDoc: "QC-2025-012",
    type: "เปลี่ยนสถานะ",
    product: "ถังขยะพลาสติก 120L",
    warehouse: "TEG",
    statusFrom: "พร้อมผลิต",
    statusTo: "ตำหนิ",
    quantity: 10,
    by: "สมปอง คุณภาพ",
    note: "พบรอยขีดข่วนเล็กน้อย"
  },
];

export default function InventoryHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const filteredTransactions = mockTransactions.filter(txn => {
    const matchSearch = 
      txn.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.refDoc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchType = typeFilter === "all" || txn.type === typeFilter;
    const matchWarehouse = warehouseFilter === "all" || txn.warehouse.includes(warehouseFilter);

    let matchDate = true;
    if (dateFrom || dateTo) {
      const txnDate = parse(txn.date, "yyyy-MM-dd HH:mm:ss", new Date());
      if (dateFrom && dateTo) {
        matchDate = isWithinInterval(txnDate, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
      } else if (dateFrom) {
        matchDate = txnDate >= startOfDay(dateFrom);
      } else if (dateTo) {
        matchDate = txnDate <= endOfDay(dateTo);
      }
    }
    
    return matchSearch && matchType && matchWarehouse && matchDate;
  });

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      toast.error("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }
    const exportData = filteredTransactions.map(txn => ({
      "เลขที่": txn.id,
      "วันที่-เวลา": txn.date,
      "เอกสารอ้างอิง": txn.refDoc,
      "ประเภท": txn.type,
      "สินค้า": txn.product,
      "คลัง": txn.warehouse,
      "สถานะจาก": txn.statusFrom,
      "สถานะไป": txn.statusTo,
      "จำนวน": txn.quantity,
      "ผู้ทำรายการ": txn.by,
      "หมายเหตุ": txn.note,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ประวัติเคลื่อนไหว");
    XLSX.writeFile(wb, `inventory-history-${format(new Date(), "yyyyMMdd-HHmmss")}.xlsx`);
    toast.success(`ส่งออกสำเร็จ ${filteredTransactions.length} รายการ`);
  };

  const getTypeBadge = (type: string) => {
    const badges: Record<string, { color: string; text: string }> = {
      "รับเข้า": { color: "bg-green-500", text: "รับเข้า" },
      "ตัดออก": { color: "bg-red-500", text: "ตัดออก" },
      "โอนคลัง": { color: "bg-blue-500", text: "โอนคลัง" },
      "ปรับยอด": { color: "bg-purple-500", text: "ปรับยอด" },
      "เปลี่ยนสถานะ": { color: "bg-orange-500", text: "เปลี่ยนสถานะ" },
    };
    const badge = badges[type] || { color: "bg-gray-500", text: type };
    return <Badge className={badge.color}>{badge.text}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === "-") return <span className="text-muted-foreground">-</span>;
    if (status === "พร้อมผลิต") return <Badge className="bg-green-500">พร้อมผลิต</Badge>;
    if (status === "ตำหนิ") return <Badge className="bg-yellow-500">ตำหนิ</Badge>;
    if (status === "ชำรุด") return <Badge className="bg-red-500">ชำรุด</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">ประวัติการเคลื่อนไหว</h1>
          <p className="text-muted-foreground">บันทึกรายการเคลื่อนไหวสินค้าทั้งหมด</p>
        </div>
        <Button onClick={handleExportExcel}>
          <Download className="mr-2 h-4 w-4" />
          ส่งออก Excel ({filteredTransactions.length})
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ค้นหาและกรอง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="ค้นหาด้วยเลขที่, เอกสาร, สินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="ประเภท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="รับเข้า">รับเข้า</SelectItem>
                <SelectItem value="ตัดออก">ตัดออก</SelectItem>
                <SelectItem value="โอนคลัง">โอนคลัง</SelectItem>
                <SelectItem value="ปรับยอด">ปรับยอด</SelectItem>
                <SelectItem value="เปลี่ยนสถานะ">เปลี่ยนสถานะ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="คลัง" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกคลัง</SelectItem>
                <SelectItem value="TEG">TEG</SelectItem>
                <SelectItem value="Lucky">Lucky</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP", { locale: th }) : "จากวันที่"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground">ถึง</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP", { locale: th }) : "ถึงวันที่"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการทั้งหมด ({filteredTransactions.length})</CardTitle>
          <CardDescription>บันทึกการเคลื่อนไหวสินค้าย้อนหลัง</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>วันที่-เวลา</TableHead>
                <TableHead>เอกสารอ้างอิง</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>คลัง</TableHead>
                <TableHead>สถานะจาก</TableHead>
                <TableHead>สถานะไป</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead>ผู้ทำรายการ</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-medium">{txn.id}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{txn.date}</TableCell>
                  <TableCell className="font-mono text-sm">{txn.refDoc}</TableCell>
                  <TableCell>{getTypeBadge(txn.type)}</TableCell>
                  <TableCell>{txn.product}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{txn.warehouse}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(txn.statusFrom)}</TableCell>
                  <TableCell>{getStatusBadge(txn.statusTo)}</TableCell>
                  <TableCell className={`text-right font-semibold ${txn.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                  </TableCell>
                  <TableCell className="text-sm">{txn.by}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{txn.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
