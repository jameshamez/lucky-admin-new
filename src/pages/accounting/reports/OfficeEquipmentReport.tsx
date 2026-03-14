import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileDown, Search, Image as ImageIcon, Loader2 } from "lucide-react";
import { accountingService } from "@/services/accountingService";
import { toast } from "sonner";

export default function OfficeEquipmentReport() {
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPurchaseDate, setFilterPurchaseDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);

  useEffect(() => {
    const fetchEquipmentData = async () => {
      setLoading(true);
      try {
        const res = await accountingService.getReportsData('office_equipment');
        if (res.status === 'success') {
          setSummaryData(res.data.summary);
          setEquipmentList(res.data.list);
        }
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูลรายงานพัสดุได้");
      } finally {
        setLoading(false);
      }
    };
    fetchEquipmentData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ใช้งานอยู่":
        return <Badge className="bg-green-500">ใช้งานอยู่</Badge>;
      case "ว่าง":
        return <Badge className="bg-blue-500">ว่าง</Badge>;
      case "ส่งซ่อม":
        return <Badge className="bg-yellow-500">ส่งซ่อม</Badge>;
      case "จำหน่ายออก":
        return <Badge className="bg-red-500">จำหน่ายออก</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">รายงานอุปกรณ์สำนักงาน</h1>
          <p className="text-muted-foreground">จัดการทรัพย์สินและครุภัณฑ์ของบริษัท</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((card, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">หมวดหมู่</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="it">IT</SelectItem>
                  <SelectItem value="furniture">เฟอร์นิเจอร์</SelectItem>
                  <SelectItem value="appliance">เครื่องใช้ไฟฟ้า</SelectItem>
                  <SelectItem value="communication">อุปกรณ์สื่อสาร</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">วันที่ซื้อ</label>
              <Input type="date" value={filterPurchaseDate} onChange={(e) => setFilterPurchaseDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">สถานะอุปกรณ์</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="active">ใช้งานอยู่</SelectItem>
                  <SelectItem value="maintenance">ซ่อมบำรุง</SelectItem>
                  <SelectItem value="damaged">ชำรุด</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Search className="mr-2 h-4 w-4" />
                ค้นหา
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการทรัพย์สิน (Asset List)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>หมายเลขครุภัณฑ์</TableHead>
                <TableHead>รายการ</TableHead>
                <TableHead>หมวด</TableHead>
                <TableHead>วันที่ซื้อ</TableHead>
                <TableHead className="text-right">ราคา (฿)</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ผู้ถือครอง</TableHead>
                <TableHead className="text-center">รูปภาพ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipmentList.map((item) => (
                <TableRow key={item.assetNo}>
                  <TableCell className="font-medium">{item.assetNo}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.purchaseDate}</TableCell>
                  <TableCell className="text-right">฿{item.price.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>{item.assignedTo}</TableCell>
                  <TableCell className="text-center">
                    {item.hasImage ? (
                      <Button variant="ghost" size="sm">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
