import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FileDown, Search, Loader2 } from "lucide-react";
import { accountingService } from "@/services/accountingService";
import { toast } from "sonner";

export default function PettyCashReport() {
  const [filterDate, setFilterDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchPettyCashData = async () => {
      setLoading(true);
      try {
        const res = await accountingService.getReportsData('petty_cash');
        if (res.status === 'success') {
          setSummaryData(res.data.summary);
          setHistory(res.data.history);
        }
      } catch (error) {
        toast.error("ไม่สามารถดึงข้อมูลรายงานเงินสดย่อยได้");
      } finally {
        setLoading(false);
      }
    };
    fetchPettyCashData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  // Monthly category data (Mock for now as backend doesn't group yet)
  const monthlyCategoryData = [
    { month: "ปัจจุบัน", fuel: 0, delivery: 0, welfare: 0, others: 0 },
  ];

  const monthlyTrendData = [
    { month: "ปัจจุบัน", total: history.reduce((sum, h) => sum + h.amount, 0) },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "จ่ายแล้ว":
        return <Badge className="bg-green-500">จ่ายแล้ว</Badge>;
      case "รอเบิกจ่าย":
        return <Badge className="bg-orange-500">รอเบิกจ่าย</Badge>;
      case "รออนุมัติ":
        return <Badge className="bg-yellow-500">รออนุมัติ</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">รายงานเงินสดย่อย</h1>
          <p className="text-muted-foreground">ติดตามการเบิกจ่ายและยอดคงเหลือกองกลาง</p>
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

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ยอดเบิกจ่ายตามหมวด</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyCategoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="fuel" fill="#3b82f6" name="ค่าน้ำมัน" />
                <Bar dataKey="delivery" fill="#10b981" name="ค่าส่งสินค้า" />
                <Bar dataKey="welfare" fill="#f59e0b" name="สวัสดิการ" />
                <Bar dataKey="others" fill="#6366f1" name="อื่นๆ" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>แนวโน้มการเบิกจ่าย</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" name="ยอดรวม" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวกรอง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="text-sm font-medium mb-2 block">วันที่</label>
              <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">หมวดค่าใช้จ่าย</label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวด" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="fuel">ค่าน้ำมัน</SelectItem>
                  <SelectItem value="delivery">ค่าส่งสินค้า</SelectItem>
                  <SelectItem value="welfare">สวัสดิการ</SelectItem>
                  <SelectItem value="refund">คืนเงินลูกค้า</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">แผนก</label>
              <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแผนก" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="sales">ขาย</SelectItem>
                  <SelectItem value="accounting">บัญชี</SelectItem>
                  <SelectItem value="production">ผลิต</SelectItem>
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
                  <SelectItem value="paid">จ่ายแล้ว</SelectItem>
                  <SelectItem value="pending_payment">รอเบิกจ่าย</SelectItem>
                  <SelectItem value="pending_approval">รออนุมัติ</SelectItem>
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

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการคำขอเบิก</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>รหัสคำขอ</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>ผู้เบิก</TableHead>
                <TableHead>แผนก</TableHead>
                <TableHead>หมวดค่าใช้จ่าย</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead className="text-right">จำนวนเงิน (฿)</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>ผู้อนุมัติ</TableHead>
                <TableHead>วันที่จ่ายจริง</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">PC-{item.id}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.requester}</TableCell>
                  <TableCell>โฮมออฟฟิศ</TableCell>
                  <TableCell>ทั่วไป</TableCell>
                  <TableCell>{item.purpose}</TableCell>
                  <TableCell className="text-right">฿{item.amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{item.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
