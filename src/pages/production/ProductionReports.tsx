import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Download, TrendingUp, Package, Truck, AlertTriangle } from "lucide-react";

const productionEfficiencyData = [
  { week: "สัปดาห์ 1", target: 250, actual: 245, efficiency: 98 },
  { week: "สัปดาห์ 2", target: 250, actual: 260, efficiency: 104 },
  { week: "สัปดาห์ 3", target: 250, actual: 235, efficiency: 94 },
  { week: "สัปดาห์ 4", target: 250, actual: 270, efficiency: 108 },
];

const inventoryMovementData = [
  { date: "01/01", stockIn: 150, stockOut: 120, net: 30 },
  { date: "02/01", stockIn: 80, stockOut: 145, net: -65 },
  { date: "03/01", stockIn: 200, stockOut: 110, net: 90 },
  { date: "04/01", stockIn: 120, stockOut: 135, net: -15 },
  { date: "05/01", stockIn: 180, stockOut: 95, net: 85 },
];

const orderStatusBreakdown = [
  { name: "กำลังผลิต", value: 8, color: "#8884d8" },
  { name: "ตรวจสอบคุณภาพ", value: 3, color: "#82ca9d" },
  { name: "พร้อมจัดส่ง", value: 5, color: "#ffc658" },
  { name: "รอเริ่มผลิต", value: 2, color: "#ff7300" },
];

const defectAnalysis = [
  { type: "สีผิดเพี้ยน", count: 5, percentage: 35.7 },
  { type: "พิมพ์ไม่ชัด", count: 4, percentage: 28.6 },
  { type: "ขนาดผิด", count: 3, percentage: 21.4 },
  { type: "วัสดุชำรุด", count: 2, percentage: 14.3 },
];

const deliveryPerformance = [
  { month: "ต.ค.", onTime: 85, late: 15, total: 100 },
  { month: "พ.ย.", onTime: 92, late: 8, total: 100 },
  { month: "ธ.ค.", onTime: 88, late: 12, total: 100 },
  { month: "ม.ค.", onTime: 95, late: 5, total: 100 },
];

const inventoryStatus = [
  { item: "กระดาษ A4", current: 25, minimum: 50, status: "ขาดแคลน", value: 12500 },
  { item: "หมึกสี", current: 15, minimum: 20, status: "ใกล้หมด", value: 7500 },
  { item: "ฟิล์มพลาสติก", current: 120, minimum: 100, status: "ปกติ", value: 24000 },
  { item: "กาวลาเบล", current: 8, minimum: 10, status: "ใกล้หมด", value: 4000 },
];

export default function ProductionReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">รายงานผลการผลิต</h1>
          <p className="text-muted-foreground">วิเคราะห์ประสิทธิภาพการผลิตและสถานะสต็อก</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="this-month">
            <SelectTrigger className="w-40">
              <SelectValue placeholder="เลือกช่วงเวลา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">เดือนนี้</SelectItem>
              <SelectItem value="last-month">เดือนที่แล้ว</SelectItem>
              <SelectItem value="this-quarter">ไตรมาสนี้</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-gradient-to-r from-primary to-primary-hover">
            <Download className="w-4 h-4 mr-2" />
            ส่งออกรายงาน
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ประสิทธิภาพการผลิต</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">101%</div>
            <p className="text-xs text-green-600">+3% จากเดือนที่แล้ว</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ออเดอร์เสร็จสิ้น</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-green-600">+2 จากเดือนที่แล้ว</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การจัดส่งตรงเวลา</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95%</div>
            <p className="text-xs text-green-600">+7% จากเดือนที่แล้ว</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อัตราสินค้าตำหนิ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.1%</div>
            <p className="text-xs text-red-600">+0.3% จากเดือนที่แล้ว</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="production" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="production">
            <TrendingUp className="w-4 h-4 mr-2" />
            ประสิทธิภาพการผลิต
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="w-4 h-4 mr-2" />
            สถานะสต็อก
          </TabsTrigger>
          <TabsTrigger value="quality">
            <AlertTriangle className="w-4 h-4 mr-2" />
            คุณภาพและการจัดส่ง
          </TabsTrigger>
        </TabsList>

        {/* Production Efficiency */}
        <TabsContent value="production" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>ประสิทธิภาพการผลิตรายสัปดาห์</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productionEfficiencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="target" fill="#e5e7eb" name="เป้าหมาย" />
                    <Bar dataKey="actual" fill="#3b82f6" name="ผลงานจริง" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>สถานะออเดอร์ปัจจุบัน</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>สรุปประสิทธิภาพรายสัปดาห์</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>สัปดาห์</TableHead>
                    <TableHead>เป้าหมาย</TableHead>
                    <TableHead>ผลงานจริง</TableHead>
                    <TableHead>ประสิทธิภาพ</TableHead>
                    <TableHead>สถานะ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productionEfficiencyData.map((week) => (
                    <TableRow key={week.week}>
                      <TableCell className="font-medium">{week.week}</TableCell>
                      <TableCell>{week.target}</TableCell>
                      <TableCell>{week.actual}</TableCell>
                      <TableCell>
                        <span className={week.efficiency >= 100 ? "text-green-600 font-semibold" : "text-orange-600 font-semibold"}>
                          {week.efficiency}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={week.efficiency >= 100 ? "default" : "secondary"}>
                          {week.efficiency >= 100 ? "เกินเป้า" : "ต่ำกว่าเป้า"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Status */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>การเคลื่อนไหวสต็อกสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={inventoryMovementData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="stockIn" stroke="#22c55e" name="นำเข้า" />
                  <Line type="monotone" dataKey="stockOut" stroke="#ef4444" name="เบิกออก" />
                  <Line type="monotone" dataKey="net" stroke="#3b82f6" name="คงเหลือสุทธิ" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>รายงานสถานะสต็อก</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รายการ</TableHead>
                    <TableHead>คงเหลือ</TableHead>
                    <TableHead>ขั้นต่ำ</TableHead>
                    <TableHead>มูลค่า (บาท)</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryStatus.map((item) => (
                    <TableRow key={item.item}>
                      <TableCell className="font-medium">{item.item}</TableCell>
                      <TableCell>
                        <span className={item.current < item.minimum ? "text-red-600 font-semibold" : ""}>
                          {item.current}
                        </span>
                      </TableCell>
                      <TableCell>{item.minimum}</TableCell>
                      <TableCell>฿{item.value.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            item.status === "ขาดแคลน" ? "destructive" : 
                            item.status === "ใกล้หมด" ? "secondary" : "default"
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.status !== "ปกติ" && (
                          <Button size="sm" variant="outline">
                            สั่งซื้อ
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality and Delivery */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>การวิเคราะห์สินค้าตำหนิ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {defectAnalysis.map((defect) => (
                    <div key={defect.type} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{defect.type}</p>
                        <p className="text-sm text-muted-foreground">{defect.count} ครั้ง</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{defect.percentage}%</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${defect.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ประสิทธิภาพการจัดส่ง</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={deliveryPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Bar dataKey="onTime" stackId="a" fill="#22c55e" name="ตรงเวลา" />
                    <Bar dataKey="late" stackId="a" fill="#ef4444" name="ล่าช้า" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>สรุปคุณภาพและการจัดส่ง</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">95%</div>
                  <p className="text-sm text-muted-foreground">การจัดส่งตรงเวลา</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">2.1%</div>
                  <p className="text-sm text-muted-foreground">อัตราสินค้าตำหนิ</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">14</div>
                  <p className="text-sm text-muted-foreground">รายการตำหนิ (เดือนนี้)</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">3.2</div>
                  <p className="text-sm text-muted-foreground">วันเฉลี่ยในการจัดส่ง</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}