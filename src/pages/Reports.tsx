import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import {
  FileBarChart,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Clock,
  AlertTriangle,
  Target,
  Calendar as CalendarIcon,
  Download,
  Filter,
  RefreshCw,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { reportService } from "@/services/reportService";
import { toast } from "sonner";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("operational");
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  // Storage for fetched data
  const [reportData, setReportData] = useState<any>(null);
  const [prodStats, setProdStats] = useState<any>(null);
  const [hrData, setHrData] = useState<any>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");

      // Parallel fetch
      const [compRes, prodRes, hrRes] = await Promise.all([
        reportService.getComprehensiveReports(selectedPeriod, "all", dateStr),
        reportService.getProductionReports(selectedPeriod === "monthly" ? "this-month" : "year"),
        reportService.getHRReports()
      ]);

      if (compRes.status === "success") setReportData(compRes.data);
      if (prodRes.status === "success") setProdStats(prodRes.data);
      if (hrRes.status === "success") setHrData(hrRes.data);

    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลรายงานได้");
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, date]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ปกติ": return "bg-success";
      case "ใกล้หมด": return "bg-warning";
      case "ขาดแคลน": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "ปกติ": return "text-success-foreground";
      case "ใกล้หมด": return "text-warning-foreground";
      case "ขาดแคลน": return "text-destructive-foreground";
      default: return "text-muted-foreground";
    }
  };

  if (loading && !reportData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">กำลังจัดทำรายงาน...</p>
      </div>
    );
  }

  // Derived data
  const kpis = reportData?.kpiData || [];
  const financialData = reportData?.financialData || [];
  const prodEfficiency = prodStats?.efficiencyCharts || [];
  const orderStatus = prodStats?.orderStatusBreakdown || [];
  const inventoryData = prodStats?.inventoryStatus || [];
  const hrStats = hrData?.kpi || [];
  const summary = prodStats?.summary || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileBarChart className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">รายงานผล</h1>
            <p className="text-muted-foreground">รายงานประสิทธิภาพและผลการดำเนินงานทั้งองค์กร</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">สัปดาห์นี้</SelectItem>
              <SelectItem value="monthly">เดือนนี้</SelectItem>
              <SelectItem value="quarterly">ไตรมาสนี้</SelectItem>
              <SelectItem value="yearly">ปีนี้</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(date, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={fetchAllData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button className="gap-2">
            <Download className="h-4 w-4" />
            ส่งออกรายงาน
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="operational" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            การดำเนินงาน
          </TabsTrigger>
          <TabsTrigger value="personnel" className="gap-2">
            <Users className="w-4 h-4" />
            บุคลากร
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="w-4 h-4" />
            สินค้าคงคลัง
          </TabsTrigger>
        </TabsList>

        <TabsContent value="operational" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ออเดอร์ทั้งหมด</CardTitle>
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.completedOrders || 0}</div>
                <p className="text-xs text-muted-foreground">สำเร็จแล้วในเดือนนี้</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ประสิทธิภาพเฉลี่ย</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.efficiency || "0%"}</div>
                <p className="text-xs text-muted-foreground">เทียบเป้าหมายการผลิต</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">กำไรสุทธิ</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ฿{new Intl.NumberFormat('th-TH').format(financialData[financialData.length - 1]?.profit || 0)}
                </div>
                <p className="text-xs text-muted-foreground">ในเดือนปัจจุบัน</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">เป้าหมายฝ่ายขาย</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-muted-foreground">บรรลุเป้าหมายเฉลี่ย</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>สถานะออเดอร์</CardTitle>
                <CardDescription>การกระจายตัวของออเดอร์ตามสถานะจริงในระบบ</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatus}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {orderStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ประสิทธิภาพการผลิตรายสัปดาห์</CardTitle>
                <CardDescription>เทียบเป้าหมายและจำนวนที่ผลิตได้จริง</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={prodEfficiency}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="actual" fill="#10b981" name="ผลิตได้" />
                    <Bar dataKey="target" fill="#e2e8f0" name="เป้าหมาย" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>


        <TabsContent value="personnel" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">KPI บันทึกแล้ว</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hrStats.length}</div>
                <p className="text-xs text-muted-foreground">พนักงานที่ได้รับการประเมิน</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">KPI เฉลี่ยองค์กร</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {hrStats.length > 0 ? (hrStats.reduce((acc: any, curr: any) => acc + curr.score, 0) / hrStats.length).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">ผลงานดีเยี่ยม</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ค่าคอมมิชชันรวม</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿{new Intl.NumberFormat('th-TH').format(hrData?.transactions?.reduce((acc: any, curr: any) => acc + curr.commission, 0) || 0)}</div>
                <p className="text-xs text-muted-foreground">ยอดสะสมรวมทุกแผนก</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">รายการเบิกจ่าย</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{hrData?.transactions?.length || 0}</div>
                <p className="text-xs text-muted-foreground">รอการตรวจสอบ</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ผลงาน KPI ล่าสุด</CardTitle>
              <CardDescription>คะแนนประเมินผลการปฏิบัติงานรายบุคคล</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {hrStats.slice(0, 5).map((record: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{record.employeeName} ({record.department})</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {record.score}%
                        </span>
                        <Badge variant={record.score >= 80 ? "default" : "destructive"}>
                          {record.score >= 80 ? "ผ่านเกณฑ์" : "ควรปรับปรุง"}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={record.score} className={`h-2 ${record.score >= 80 ? 'bg-success' : 'bg-destructive'}`} />
                  </div>
                ))}
                {hrStats.length === 0 && <p className="text-center text-muted-foreground py-4">ไม่มีข้อมูลการประเมิน</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">รายการวัสดุ</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inventoryData.length}</div>
                <p className="text-xs text-muted-foreground">ประเภทอุปกรณ์/วัสดุ</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">รายการที่ใกล้หมด</CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {inventoryData.filter((i: any) => i.status === "ใกล้หมด").length}
                </div>
                <p className="text-xs text-muted-foreground">ต้องการการสั่งซื้อเพิ่ม</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ขาดแคลน</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {inventoryData.filter((i: any) => i.status === "ขาดแคลน").length}
                </div>
                <p className="text-xs text-muted-foreground">ของหมดสต็อก/ต้องสั่งด่วน</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>สถานะสินค้าคงคลังปัจจุบัน</CardTitle>
              <CardDescription>รายการวัสดุและสถานะการใช้ในฝ่ายผลิต</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inventoryData.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.item}</h3>
                      <p className="text-sm text-muted-foreground">
                        คงเหลือ: {item.current} | ขั้นต่ำ: {item.minimum}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={Math.min(100, (item.current / (item.minimum || 1)) * 50)}
                        className="w-24 h-2"
                      />
                      <Badge className={`${getStatusColor(item.status)} ${getStatusTextColor(item.status)}`}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {inventoryData.length === 0 && <p className="text-center text-muted-foreground py-4">ไม่มีข้อมูลคงคลัง</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}