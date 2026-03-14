import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Package,
  Truck,
  CheckCircle,
  Car,
  Calendar,
  User
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from "recharts";

import { useState, useEffect } from "react";
import { productionService } from "@/services/productionService";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductionDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await productionService.getDashboardData();
      if (res.status === 'success') {
        setDashboardData(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch production dashboard:", error);
      toast.error("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[300px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalOrders: 0,
    nearDueOrders: 0,
    completedToday: 0,
    pendingVehicleRequests: 0
  };

  const dailyProductionData = dashboardData?.dailyTrend || [];
  const dailyTasks = dashboardData?.dailyTasks || [];
  const activeOrders = dashboardData?.activeOrders || [];
  const vehicleRequests = dashboardData?.vehicleRequests || []; // API endpoint might need update to return this

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">แดชบอร์ดฝ่ายผลิตและจัดส่ง</h1>
          <p className="text-muted-foreground">ภาพรวมการผลิต และการจัดส่ง</p>
        </div>
      </div>

      {/* ภาพรวมการผลิตและการจัดส่ง */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="งานทั้งหมด"
          value={stats.totalOrders.toString()}
          change={`${stats.nearDueOrders} งานใกล้ครบกำหนด`}
          icon={<Package className="h-4 w-4" />}
          trend="neutral"
        />
        <StatsCard
          title="งานที่ผลิตเสร็จภายในวัน"
          value={stats.completedToday.toString()}
          change="ชิ้นงาน"
          icon={<CheckCircle className="h-4 w-4" />}
          trend="up"
        />
        <StatsCard
          title="สถานะการขอใช้รถ"
          value={vehicleRequests.length.toString()}
          change={`${stats.pendingVehicleRequests} รายการรออนุมัติ`}
          icon={<Car className="h-4 w-4" />}
          trend="neutral"
        />
      </div>

      {/* ประสิทธิภาพการผลิต */}
      <Card>
        <CardHeader>
          <CardTitle>ประสิทธิภาพการผลิต</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">รายวัน</TabsTrigger>
              <TabsTrigger value="weekly">รายสัปดาห์</TabsTrigger>
              <TabsTrigger value="monthly">รายเดือน</TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyProductionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" name="สินค้าผลิตเสร็จ" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="weekly" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyProductionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="สินค้าผลิตเสร็จ"
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="monthly" className="mt-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyProductionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" name="สินค้าผลิตเสร็จ" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* งานประจำวันของแต่ละรายคน */}
      <Card>
        <CardHeader>
          <CardTitle>งานประจำวันของแต่ละรายคน</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    วันที่และเวลา
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    ชื่อพนักงาน
                  </div>
                </TableHead>
                <TableHead>รายละเอียดงาน</TableHead>
                <TableHead className="text-center">จำนวนงาน</TableHead>
                <TableHead>ประเภทงาน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.dateTime}</TableCell>
                  <TableCell>{task.employeeName}</TableCell>
                  <TableCell>{task.taskDetails}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{task.taskCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{task.taskType}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ออเดอร์ที่กำลังดำเนินการ */}
      <Card>
        <CardHeader>
          <CardTitle>ออเดอร์ที่กำลังดำเนินการ</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อลูกค้า</TableHead>
                <TableHead>ชื่องาน</TableHead>
                <TableHead>รายละเอียดงาน</TableHead>
                <TableHead>เซลล์ผู้รับผิดชอบ</TableHead>
                <TableHead>ขนส่ง</TableHead>
                <TableHead className="text-center">สถานะ</TableHead>
                <TableHead className="text-center">ความเร่งด่วน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.customerName}</TableCell>
                  <TableCell>{order.jobName}</TableCell>
                  <TableCell className="max-w-xs truncate">{order.jobDetails}</TableCell>
                  <TableCell>{order.salesPerson}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <Truck className="h-3 w-3" />
                      {order.shipping}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {order.nearDue && (
                      <Badge variant="destructive">ใกล้ส่งมอบ</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        order.urgency === "ด่วนมาก" ? "destructive" :
                          order.urgency === "ด่วน" ? "secondary" :
                            "outline"
                      }
                    >
                      {order.urgency}
                    </Badge>
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