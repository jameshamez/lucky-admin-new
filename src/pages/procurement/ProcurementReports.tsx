import { useState } from "react";
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

const mockData = [
  { month: "ม.ค.", calculated: 45, ordered: 38, delivered: 32 },
  { month: "ก.พ.", calculated: 52, ordered: 45, delivered: 40 },
  { month: "มี.ค.", calculated: 61, ordered: 55, delivered: 48 },
  { month: "เม.ย.", calculated: 58, ordered: 52, delivered: 45 },
  { month: "พ.ค.", calculated: 70, ordered: 63, delivered: 58 },
  { month: "มิ.ย.", calculated: 68, ordered: 61, delivered: 55 },
];

// ข้อมูล Mock โรงงาน
const factoryData = [
  {
    factory: "โรงงาน A (จีน)",
    medal: { quoted: 45, ordered: 38, po: 35 },
    trophy: { quoted: 20, ordered: 15, po: 12 },
    award: { quoted: 15, ordered: 12, po: 10 },
    shirt: { quoted: 8, ordered: 5, po: 5 },
    other: { quoted: 5, ordered: 3, po: 3 },
  },
  {
    factory: "โรงงาน B (จีน)",
    medal: { quoted: 32, ordered: 28, po: 25 },
    trophy: { quoted: 18, ordered: 14, po: 12 },
    award: { quoted: 10, ordered: 8, po: 8 },
    shirt: { quoted: 5, ordered: 4, po: 4 },
    other: { quoted: 3, ordered: 2, po: 2 },
  },
  {
    factory: "โรงงาน C (ไทย)",
    medal: { quoted: 25, ordered: 22, po: 20 },
    trophy: { quoted: 12, ordered: 10, po: 9 },
    award: { quoted: 8, ordered: 7, po: 6 },
    shirt: { quoted: 15, ordered: 12, po: 11 },
    other: { quoted: 4, ordered: 3, po: 3 },
  },
  {
    factory: "โรงงาน D (ไทย)",
    medal: { quoted: 18, ordered: 15, po: 14 },
    trophy: { quoted: 8, ordered: 6, po: 5 },
    award: { quoted: 6, ordered: 5, po: 4 },
    shirt: { quoted: 20, ordered: 18, po: 16 },
    other: { quoted: 2, ordered: 1, po: 1 },
  },
];

// ข้อมูลเปรียบเทียบตีราคา vs สั่งผลิต
const comparisonData = [
  { name: "เหรียญ", quoted: 120, ordered: 103, rate: 86 },
  { name: "ถ้วย", quoted: 58, ordered: 45, rate: 78 },
  { name: "โล่", quoted: 39, ordered: 32, rate: 82 },
  { name: "เสื้อ", quoted: 48, ordered: 39, rate: 81 },
  { name: "อื่นๆ", quoted: 14, ordered: 9, rate: 64 },
];

const COLORS = ["#3b82f6", "#22c55e", "#f97316", "#8b5cf6", "#ec4899"];

export default function ProcurementReports() {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [timeRange, setTimeRange] = useState<string>("monthly");
  const [productType, setProductType] = useState<string>("all");

  // คำนวณ Total ของแต่ละโรงงาน
  const getFactoryTotals = (factory: typeof factoryData[0]) => {
    return {
      quoted: factory.medal.quoted + factory.trophy.quoted + factory.award.quoted + factory.shirt.quoted + factory.other.quoted,
      ordered: factory.medal.ordered + factory.trophy.ordered + factory.award.ordered + factory.shirt.ordered + factory.other.ordered,
      po: factory.medal.po + factory.trophy.po + factory.award.po + factory.shirt.po + factory.other.po,
    };
  };

  // คำนวณ Grand Total
  const grandTotal = factoryData.reduce(
    (acc, factory) => {
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
  const pieData = comparisonData.map((item) => ({
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
            <div className="text-3xl font-bold text-blue-600">125 งาน</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12% จากเดือนที่แล้ว
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
            <div className="text-3xl font-bold text-orange-600">95 งาน</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +8% จากเดือนที่แล้ว
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
            <div className="text-3xl font-bold text-green-600">82 งาน</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +15% จากเดือนที่แล้ว
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
                {factoryData.map((factory, index) => {
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
                    {factoryData.reduce((sum, f) => sum + f.medal.quoted, 0)} / {factoryData.reduce((sum, f) => sum + f.medal.ordered, 0)} / {factoryData.reduce((sum, f) => sum + f.medal.po, 0)}
                  </TableCell>
                  <TableCell colSpan={3} className="text-center border-r">
                    {factoryData.reduce((sum, f) => sum + f.trophy.quoted, 0)} / {factoryData.reduce((sum, f) => sum + f.trophy.ordered, 0)} / {factoryData.reduce((sum, f) => sum + f.trophy.po, 0)}
                  </TableCell>
                  <TableCell colSpan={3} className="text-center border-r">
                    {factoryData.reduce((sum, f) => sum + f.award.quoted, 0)} / {factoryData.reduce((sum, f) => sum + f.award.ordered, 0)} / {factoryData.reduce((sum, f) => sum + f.award.po, 0)}
                  </TableCell>
                  <TableCell colSpan={3} className="text-center border-r">
                    {factoryData.reduce((sum, f) => sum + f.shirt.quoted, 0)} / {factoryData.reduce((sum, f) => sum + f.shirt.ordered, 0)} / {factoryData.reduce((sum, f) => sum + f.shirt.po, 0)}
                  </TableCell>
                  <TableCell colSpan={3} className="text-center border-r">
                    {factoryData.reduce((sum, f) => sum + f.other.quoted, 0)} / {factoryData.reduce((sum, f) => sum + f.other.ordered, 0)} / {factoryData.reduce((sum, f) => sum + f.other.po, 0)}
                  </TableCell>
                  <TableCell className="text-center">{grandTotal.quoted}</TableCell>
                  <TableCell className="text-center">{grandTotal.ordered}</TableCell>
                  <TableCell className="text-center">{grandTotal.po}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground mt-2">* ตีราคา / สั่งผลิต / เปิด PO (หน่วย: งาน)</p>
        </CardContent>
      </Card>

      {/* Comparison Report: Quoted vs Ordered */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            เปรียบเทียบ: ส่งตีราคา vs สั่งผลิตจริง
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Bar Chart Comparison */}
            <div>
              <h4 className="text-sm font-medium mb-4">กราฟแท่งเปรียบเทียบ (แยกประเภทสินค้า)</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={comparisonData}>
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
                    {pieData.map((entry, index) => (
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
            <h4 className="text-sm font-medium mb-3">อัตราการแปลงจากตีราคาเป็นสั่งผลิต</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ประเภทสินค้า</TableHead>
                  <TableHead className="text-center">ส่งตีราคา (งาน)</TableHead>
                  <TableHead className="text-center">สั่งผลิตจริง (งาน)</TableHead>
                  <TableHead className="text-center">อัตราแปลง (%)</TableHead>
                  <TableHead className="text-center">สถานะ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.map((item, index) => (
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
                  <TableCell className="text-center">{comparisonData.reduce((sum, i) => sum + i.quoted, 0)}</TableCell>
                  <TableCell className="text-center">{comparisonData.reduce((sum, i) => sum + i.ordered, 0)}</TableCell>
                  <TableCell className="text-center">
                    {Math.round((comparisonData.reduce((sum, i) => sum + i.ordered, 0) / comparisonData.reduce((sum, i) => sum + i.quoted, 0)) * 100)}%
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
            <BarChart data={mockData}>
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
            <LineChart data={mockData}>
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
