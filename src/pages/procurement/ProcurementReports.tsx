import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, BarChart3, TrendingUp, Factory, FileCheck } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { procurementService } from "@/services/procurementService";
import { toast } from "sonner";

type FactoryReportRow = {
  factory: string;
  medal: { quoted: number; ordered: number; po: number };
  trophy: { quoted: number; ordered: number; po: number };
  award: { quoted: number; ordered: number; po: number };
  shirt: { quoted: number; ordered: number; po: number };
  other: { quoted: number; ordered: number; po: number };
};

type ComparisonRow = { name: string; quoted: number; ordered: number; rate: number };

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ec4899"];

export default function ProcurementReports() {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [timeRange, setTimeRange] = useState<string>("monthly");
  const [productType, setProductType] = useState<string>("all");

  // API Data
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await procurementService.getReportData();
      if (res.status === 'success') {
        setReportData(res.data);
      }
    } catch (error) {
      toast.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [timeRange, productType]); // Re-fetch on filter change if API supports it

  // คำนวณ Total ของแต่ละโรงงาน
  const getFactoryTotals = (factory: FactoryReportRow) => {
    return {
      quoted: factory.medal.quoted + factory.trophy.quoted + factory.award.quoted + factory.shirt.quoted + factory.other.quoted,
      ordered: factory.medal.ordered + factory.trophy.ordered + factory.award.ordered + factory.shirt.ordered + factory.other.ordered,
      po: factory.medal.po + factory.trophy.po + factory.award.po + factory.shirt.po + factory.other.po,
    };
  };

  // คำนวณ Grand Total
  const currentFactoryData: FactoryReportRow[] = reportData?.factorySummary || [];
  const grandTotal = currentFactoryData.reduce(
    (acc: any, factory: any) => {
      const totals = getFactoryTotals(factory);
      return {
        quoted: acc.quoted + totals.quoted,
        ordered: acc.ordered + totals.ordered,
        po: acc.po + totals.po,
      };
    },
    { quoted: 0, ordered: 0, po: 0 }
  );

  // ข้อมูลสำหรับ Pie Chart
  const currentComparisonData: ComparisonRow[] = reportData?.comparisonData || [];
  const pieData = currentComparisonData.map((item: any) => ({
    name: item.name,
    value: item.ordered,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">รายงานและสรุปยอด</h1>
        <p className="text-muted-foreground mt-2">
          วิเคราะห์และติดตามผลการดำเนินงานของแผนกจัดซื้อ
        </p>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>ตัวกรองและเลือกช่วงเวลา</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label>ช่วงเวลา</Label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">รายวัน</SelectItem>
                  <SelectItem value="weekly">รายสัปดาห์</SelectItem>
                  <SelectItem value="monthly">รายเดือน</SelectItem>
                  <SelectItem value="yearly">รายปี</SelectItem>
                  <SelectItem value="custom">กำหนดเอง</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>ประเภทสินค้า</Label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="medal">เหรียญรางวัล</SelectItem>
                  <SelectItem value="trophy">ถ้วยรางวัล</SelectItem>
                  <SelectItem value="award">โล่</SelectItem>
                  <SelectItem value="shirt">เสื้อ</SelectItem>
                  <SelectItem value="other">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timeRange === "custom" && (
              <>
                <div>
                  <Label>จากวันที่</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateFrom ? format(dateFrom, "PPP") : "เลือกวันที่"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>ถึงวันที่</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateTo ? format(dateTo, "PPP") : "เลือกวันที่"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              คำนวณราคาทั้งหมด
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{reportData?.stats?.totalCalculated || 0} งาน</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              อ้างอิงข้อมูลจริงจากระบบ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              สั่งผลิตแล้ว
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{reportData?.stats?.totalOrdered || 0} งาน</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              รวมออเดอร์ทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              จัดส่งเสร็จแล้ว
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{reportData?.stats?.totalDelivered || 0} งาน</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              งานที่ปิดจบแล้ว
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Factory Summary Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            รายงานสรุปโรงงาน (แยกประเภทสินค้า)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {grandTotal.quoted === 0 && grandTotal.ordered === 0 && grandTotal.po === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              ยังไม่มีข้อมูลแยกตามโรงงาน (ระบบยังไม่ได้บันทึกว่าใบเสนอราคา/คำสั่งซื้อแต่ละรายการผูกกับโรงงานไหน)
            </p>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="border-r align-middle">โรงงาน</TableHead>
                  <TableHead colSpan={3} className="text-center border-r bg-blue-50">เหรียญ</TableHead>
                  <TableHead colSpan={3} className="text-center border-r bg-green-50">ถ้วย</TableHead>
                  <TableHead colSpan={3} className="text-center border-r bg-orange-50">โล่</TableHead>
                  <TableHead colSpan={3} className="text-center border-r bg-purple-50">เสื้อ</TableHead>
                  <TableHead colSpan={3} className="text-center border-r bg-pink-50">อื่นๆ</TableHead>
                  <TableHead colSpan={3} className="text-center bg-gray-100">รวมทั้งหมด</TableHead>
                </TableRow>
                <TableRow>
                  {/* เหรียญ */}
                  <TableHead className="text-center text-xs bg-blue-50">ตีราคา</TableHead>
                  <TableHead className="text-center text-xs bg-blue-50">สั่งผลิต</TableHead>
                  <TableHead className="text-center text-xs border-r bg-blue-50">PO</TableHead>
                  {/* ถ้วย */}
                  <TableHead className="text-center text-xs bg-green-50">ตีราคา</TableHead>
                  <TableHead className="text-center text-xs bg-green-50">สั่งผลิต</TableHead>
                  <TableHead className="text-center text-xs border-r bg-green-50">PO</TableHead>
                  {/* โล่ */}
                  <TableHead className="text-center text-xs bg-orange-50">ตีราคา</TableHead>
                  <TableHead className="text-center text-xs bg-orange-50">สั่งผลิต</TableHead>
                  <TableHead className="text-center text-xs border-r bg-orange-50">PO</TableHead>
                  {/* เสื้อ */}
                  <TableHead className="text-center text-xs bg-purple-50">ตีราคา</TableHead>
                  <TableHead className="text-center text-xs bg-purple-50">สั่งผลิต</TableHead>
                  <TableHead className="text-center text-xs border-r bg-purple-50">PO</TableHead>
                  {/* อื่นๆ */}
                  <TableHead className="text-center text-xs bg-pink-50">ตีราคา</TableHead>
                  <TableHead className="text-center text-xs bg-pink-50">สั่งผลิต</TableHead>
                  <TableHead className="text-center text-xs border-r bg-pink-50">PO</TableHead>
                  {/* รวม */}
                  <TableHead className="text-center text-xs bg-gray-100">ตีราคา</TableHead>
                  <TableHead className="text-center text-xs bg-gray-100">สั่งผลิต</TableHead>
                  <TableHead className="text-center text-xs bg-gray-100">PO</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentFactoryData.map((factory: any, index: number) => {
                  const totals = getFactoryTotals(factory);
                  return (
                    <TableRow key={index}>
                      <TableCell className="font-medium border-r whitespace-nowrap">{factory.factory}</TableCell>
                      {/* เหรียญ */}
                      <TableCell className="text-center">{factory.medal.quoted}</TableCell>
                      <TableCell className="text-center">{factory.medal.ordered}</TableCell>
                      <TableCell className="text-center border-r">{factory.medal.po}</TableCell>
                      {/* ถ้วย */}
                      <TableCell className="text-center">{factory.trophy.quoted}</TableCell>
                      <TableCell className="text-center">{factory.trophy.ordered}</TableCell>
                      <TableCell className="text-center border-r">{factory.trophy.po}</TableCell>
                      {/* โล่ */}
                      <TableCell className="text-center">{factory.award.quoted}</TableCell>
                      <TableCell className="text-center">{factory.award.ordered}</TableCell>
                      <TableCell className="text-center border-r">{factory.award.po}</TableCell>
                      {/* เสื้อ */}
                      <TableCell className="text-center">{factory.shirt.quoted}</TableCell>
                      <TableCell className="text-center">{factory.shirt.ordered}</TableCell>
                      <TableCell className="text-center border-r">{factory.shirt.po}</TableCell>
                      {/* อื่นๆ */}
                      <TableCell className="text-center">{factory.other.quoted}</TableCell>
                      <TableCell className="text-center">{factory.other.ordered}</TableCell>
                      <TableCell className="text-center border-r">{factory.other.po}</TableCell>
                      {/* รวม */}
                      <TableCell className="text-center font-semibold bg-gray-50">{totals.quoted}</TableCell>
                      <TableCell className="text-center font-semibold bg-gray-50">{totals.ordered}</TableCell>
                      <TableCell className="text-center font-semibold bg-gray-50">{totals.po}</TableCell>
                    </TableRow>
                  );
                })}
                {/* Grand Total Row */}
                <TableRow className="bg-muted font-bold">
                  <TableCell className="border-r">รวมทั้งหมด</TableCell>
                  <TableCell colSpan={3} className="text-center border-r">
                    {currentFactoryData.reduce((sum: number, f: any) => sum + f.medal.quoted, 0)} / {currentFactoryData.reduce((sum: number, f: any) => sum + f.medal.ordered, 0)} / {currentFactoryData.reduce((sum: number, f: any) => sum + f.medal.po, 0)}
                  </TableCell>
                  <TableCell colSpan={3} className="text-center border-r">
                    {currentFactoryData.reduce((sum: number, f: any) => sum + f.trophy.quoted, 0)} / {currentFactoryData.reduce((sum: number, f: any) => sum + f.trophy.ordered, 0)} / {currentFactoryData.reduce((sum: number, f: any) => sum + f.trophy.po, 0)}
                  </TableCell>
                  <TableCell colSpan={3} className="text-center border-r">
                    {currentFactoryData.reduce((sum: number, f: any) => sum + f.award.quoted, 0)} / {currentFactoryData.reduce((sum: number, f: any) => sum + f.award.ordered, 0)} / {currentFactoryData.reduce((sum: number, f: any) => sum + f.award.po, 0)}
                  </TableCell>
                  <TableCell colSpan={3} className="text-center border-r">
                    {currentFactoryData.reduce((sum: number, f: any) => sum + f.shirt.quoted, 0)} / {currentFactoryData.reduce((sum: number, f: any) => sum + f.shirt.ordered, 0)} / {currentFactoryData.reduce((sum: number, f: any) => sum + f.shirt.po, 0)}
                  </TableCell>
                  <TableCell colSpan={3} className="text-center border-r">
                    {currentFactoryData.reduce((sum: number, f: any) => sum + f.other.quoted, 0)} / {currentFactoryData.reduce((sum: number, f: any) => sum + f.other.ordered, 0)} / {currentFactoryData.reduce((sum: number, f: any) => sum + f.other.po, 0)}
                  </TableCell>
                  <TableCell className="text-center">{grandTotal.quoted}</TableCell>
                  <TableCell className="text-center">{grandTotal.ordered}</TableCell>
                  <TableCell className="text-center">{grandTotal.po}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          )}
          <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-sm text-blue-800">
            <p className="font-semibold flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
              คำชี้แจงเกี่ยวกับการนับจำนวน "ตีราคา"
            </p>
            <p className="pl-3.5 text-blue-700/80 text-xs">
              การสรุปยอด "ตีราคา" จะอ้างอิงจากบัญชีไลน์ลูกค้า (LINE) <b>แบบไม่ซ้ำ (Unique User)</b> 
              <br/>เช่น ลูกค้า 1 คนขอตีราคาสินค้า 5 ครั้ง ระบบจะนับยอดการตีราคาเป็นแค่ 1 ครั้ง เพื่อให้สอดคล้องกับ Conversion Rate ที่แม่นยำที่สุด
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Report: Quoted vs Ordered */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            เปรียบเทียบ: จำนวนลูกค้าที่ส่งตีราคา vs ลูกค้าที่สั่งผลิตจริง
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Bar Chart Comparison */}
            <div>
              <h4 className="text-sm font-medium mb-4">กราฟแท่งเปรียบเทียบ (แยกประเภทสินค้า)</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={currentComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quoted" fill="#3b82f6" name="ส่งตีราคา" />
                  <Bar dataKey="ordered" fill="#22c55e" name="สั่งผลิตจริง" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart Distribution */}
            <div>
              <h4 className="text-sm font-medium mb-4">สัดส่วนการสั่งผลิตจริง (ตามประเภทสินค้า)</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Conversion Rate Table */}
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">อัตราการแปลงจากลูกค้าที่ให้ตีราคา เป็น ลูกค้าสั่งผลิต (Conversion Rate)</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ประเภทสินค้า</TableHead>
                  <TableHead className="text-center">ลูกค้าส่งตีราคา (คน)</TableHead>
                  <TableHead className="text-center">ลูกค้าที่สั่งผลิตจริง (คน)</TableHead>
                  <TableHead className="text-center">อัตราแปลง (%)</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentComparisonData.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-center">{item.quoted}</TableCell>
                    <TableCell className="text-center">{item.ordered}</TableCell>
                    <TableCell className="text-center font-semibold">{item.rate}%</TableCell>
                    <TableCell className="text-center">
                      {item.rate >= 80 ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">ดีเยี่ยม</span>
                      ) : item.rate >= 70 ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">ปานกลาง</span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">ต้องปรับปรุง</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {/* Summary Row */}
                <TableRow className="bg-muted font-bold">
                  <TableCell>รวมทั้งหมด</TableCell>
                  <TableCell className="text-center">{currentComparisonData.reduce((sum: number, i: any) => sum + i.quoted, 0)}</TableCell>
                  <TableCell className="text-center">{currentComparisonData.reduce((sum: number, i: any) => sum + i.ordered, 0)}</TableCell>
                  <TableCell className="text-center">
                    {Math.round((currentComparisonData.reduce((sum: number, i: any) => sum + i.ordered, 0) / (currentComparisonData.reduce((sum: number, i: any) => i.quoted, 0) || 1)) * 100)}%
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            กราฟแท่งแสดงจำนวนงาน (รายเดือน)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={reportData?.monthlyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="calculated" fill="#3b82f6" name="คำนวณราคา" />
              <Bar dataKey="ordered" fill="#f97316" name="สั่งผลิต" />
              <Bar dataKey="delivered" fill="#22c55e" name="จัดส่งแล้ว" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            กราฟเส้นแสดงแนวโน้ม
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={reportData?.monthlyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="calculated"
                stroke="#3b82f6"
                name="คำนวณราคา"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="ordered"
                stroke="#f97316"
                name="สั่งผลิต"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="delivered"
                stroke="#22c55e"
                name="จัดส่งแล้ว"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
