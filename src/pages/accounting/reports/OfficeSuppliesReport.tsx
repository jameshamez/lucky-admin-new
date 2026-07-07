import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FileDown, Search, Loader2 } from "lucide-react";
import { accountingService } from "@/services/accountingService";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function OfficeSuppliesReport() {
  const [filterDate, setFilterDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [monthlyUsageData, setMonthlyUsageData] = useState<any[]>([]);
  const [suppliesList, setSuppliesList] = useState<any[]>([]);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchSuppliesData = async () => {
      setLoading(true);
      try {
        const res = await accountingService.getReportsData('office_supplies');
        if (res.status === 'success') {
          setSummaryData(res.data.summary);
          setMonthlyUsageData(res.data.monthlyUsageData);
          setSuppliesList(res.data.suppliesList);
          setUsageHistory(res.data.usageHistory);
        }
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูลรายงานวัสดุสำนักงานได้");
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliesData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "พร้อม":
        return <Badge className="bg-green-500">พร้อม</Badge>;
      case "ต่ำกว่า Min":
        return <Badge className="bg-yellow-500">ต่ำกว่า Min</Badge>;
      case "หมด":
        return <Badge className="bg-red-500">หมด</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleExportExcel = () => {
    if (suppliesList.length === 0 && usageHistory.length === 0) {
      toast.error("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }
    const wb = XLSX.utils.book_new();

    if (suppliesList.length > 0) {
      const rows = [["รหัส", "รายการ", "หมวดหมู่", "คงเหลือ", "Min Stock", "มูลค่า", "สถานะ"], ...suppliesList.map((i: any) => [i.code, i.name, i.category, i.stock, i.minStock, i.value, i.status])];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 14 }, { wch: 24 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws, "วัสดุคงเหลือ");
    }

    if (usageHistory.length > 0) {
      const rows = [["วันที่", "พนักงาน", "รายการ", "จำนวน", "มูลค่า"], ...usageHistory.map((i: any) => [i.date, i.employee, i.item, i.quantity, i.value])];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws, "ประวัติการเบิกใช้");
    }

    XLSX.writeFile(wb, `office-supplies-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("ส่งออกรายงานสำเร็จ");
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 print-area">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">รายงานวัสดุสำนักงาน</h1>
          <p className="text-muted-foreground">ติดตามวัสดุสิ้นเปลืองและการเบิกใช้</p>
        </div>
        <div className="flex gap-2 print-hide">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileDown className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
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

      {/* Monthly Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>การเบิกใช้ต่อเดือน</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyUsageData.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">ไม่มีข้อมูล</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" name="มูลค่าการเบิก" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="print-hide">
        <CardHeader>
          <CardTitle>ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">วันที่</label>
              <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">หมวดหมู่</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="stationary">เครื่องเขียน</SelectItem>
                  <SelectItem value="cleaning">ทำความสะอาด</SelectItem>
                  <SelectItem value="sanitary">สุขภัณฑ์</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">สถานะ</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="ready">พร้อม</SelectItem>
                  <SelectItem value="low">ต่ำกว่า Min</SelectItem>
                  <SelectItem value="out">หมด</SelectItem>
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

      {/* Supplies Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการวัสดุคงเหลือ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>รายการ</TableHead>
                <TableHead>หมวดหมู่</TableHead>
                <TableHead className="text-right">คงเหลือ</TableHead>
                <TableHead className="text-right">Min Stock</TableHead>
                <TableHead className="text-right">มูลค่า (฿)</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliesList.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">ไม่มีข้อมูลวัสดุ</TableCell></TableRow>
              ) : suppliesList.map((item) => (
                <TableRow key={item.code}>
                  <TableCell className="font-medium">{item.code}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right">{item.stock}</TableCell>
                  <TableCell className="text-right">{item.minStock}</TableCell>
                  <TableCell className="text-right">฿{item.value.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Usage History Table */}
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการเบิกใช้</CardTitle>
          <p className="text-xs text-muted-foreground">ระบบเบิกวัสดุสำนักงานตัดสต็อกทันทีเมื่อบันทึก จึงไม่มีสถานะรออนุมัติ/แผนกผู้เบิกแยกต่างหาก</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>ผู้เบิก</TableHead>
                <TableHead>รายการ</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead className="text-right">มูลค่า (฿)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageHistory.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">ไม่มีประวัติการเบิกใช้</TableCell></TableRow>
              ) : usageHistory.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.employee}</TableCell>
                  <TableCell>{item.item}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">฿{item.value.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
