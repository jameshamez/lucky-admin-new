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
import { Download, TrendingUp, Package, Truck, AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { productionService } from "@/services/productionService";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Mock data removed

export default function ProductionReports() {
  const [period, setPeriod] = useState("this-month");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await productionService.getReportsData(period);
        if (res.status === 'success') {
          setData(res.data);
        }
      } catch (error) {
        toast.error("ไม่สามารถโหลดข้อมูลรายงานได้");
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [period]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const {
    efficiencyCharts,
    orderStatusBreakdown,
    inventoryMovements,
    inventoryStatus,
    defectAnalysis,
    deliveryPerformance,
    summary
  } = data || {
    efficiencyCharts: [],
    orderStatusBreakdown: [],
    inventoryMovements: [],
    inventoryStatus: [],
    defectAnalysis: [],
    deliveryPerformance: [],
    summary: { efficiency: "0%", completedOrders: 0, onTimeRate: "0%", defectRate: "0.0%" }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">รายงานผลการผลิต</h1>
          <p className="text-muted-foreground">วิเคราะห์ประสิทธิภาพการผลิตและสถานะสต็อก</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
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
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
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
            <div className="text-2xl font-bold">{summary.efficiency}</div>
            <p className="text-xs text-muted-foreground">เปรียบเทียบกับเป้าหมาย</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ออเดอร์เสร็จสิ้น</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.completedOrders}</div>
            <p className="text-xs text-muted-foreground text-green-600">ในรายการทั้งหมด</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การจัดส่งตรงเวลา</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.onTimeRate}</div>
            <p className="text-xs text-muted-foreground text-green-600">อ้างอิงจากประวัติ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อัตราสินค้าตำหนิ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.defectRate}</div>
            <p className="text-xs text-muted-foreground text-red-600">จากการสุ่มตรวจ</p>
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
                  <BarChart data={efficiencyCharts}>
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
                  {efficiencyCharts.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">ไม่มีข้อมูลประสิทธิภาพ</TableCell></TableRow>
                  ) : efficiencyCharts.map((week: any) => (
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
                <LineChart data={inventoryMovements}>
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
                  {inventoryStatus.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">ไม่มีข้อมูลสต็อก</TableCell></TableRow>
                  ) : inventoryStatus.map((item: any) => (
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