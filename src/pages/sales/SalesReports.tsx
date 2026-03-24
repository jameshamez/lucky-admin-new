import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  AreaChart,
  Area,
  Legend
} from "recharts";
import {
  FileBarChart,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  Phone,
  Target,
  Calendar as CalendarIcon,
  Download,
  RefreshCw,
  BookOpen,
  Loader2,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const API_BASE_URL = "https://nacres.co.th/api-lucky/admin/sales_reports.php";

export default function SalesReports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [date, setDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<any>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const response = await fetch(`${API_BASE_URL}?period=${selectedPeriod}&date=${formattedDate}`);
      const result = await response.json();
      if (result.status === "success") {
        setReportData(result.data);
      } else {
        toast.error("เกิดข้อผิดพลาด: " + result.message);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("ไม่สามารถเชื่อมต่อกับ API ได้");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) {
      toast.error("ไม่พบข้อมูลสำหรับส่งออก");
      return;
    }

    let csvContent = "\uFEFF"; // BOM for Excel Thai support

    // Summary Section
    csvContent += "สรุปรายงานการขาย\n";
    csvContent += `รอบรายงาน,${selectedPeriod === 'day' ? 'รายวัน' : selectedPeriod === 'week' ? 'รายสัปดาห์' : selectedPeriod === 'month' ? 'รายเดือน' : selectedPeriod === 'year' ? 'รายปี' : 'ทั้งหมด'}\n`;
    csvContent += `วันที่เลือก,${format(date, "dd/MM/yyyy")}\n\n`;

    csvContent += "ตัวชี้วัดหลัก\n";
    csvContent += `ยอดขายรวม,฿${data.summary.totalRevenue}\n`;
    csvContent += `ออเดอร์ทั้งหมด,${data.summary.totalOrders}\n`;
    csvContent += `มูลค่าเฉลี่ย/ออเดอร์,฿${data.summary.avgOrder}\n\n`;

    // Employee Performance Section
    if (data.employeePerformance && data.employeePerformance.length > 0) {
      csvContent += "ผลงานพนักงานขาย\n";
      csvContent += "ชื่อพนักงาน,จำนวนออเดอร์,ยอดขายรวม,เป้าหมาย,คอมมิชชัน,KPI(%)\n";
      data.employeePerformance.forEach((emp: any) => {
        csvContent += `"${emp.name || 'ไม่ระบุ'}",${emp.orders},${emp.revenue},${emp.target},${emp.commission},${emp.kpi}%\n`;
      });
      csvContent += "\n";
    }

    // Top Customers Section
    const customersForExport = (data.topCustomers || []).reduce((acc: any[], curr: any) => {
      const existing = acc.find(c => c.name.trim() === curr.name.trim());
      if (existing) {
        existing.orders = (existing.orders || 0) + (curr.orders || 0);
        existing.revenue = (existing.revenue || 0) + (curr.revenue || 0);
        if (curr.lastContact && (!existing.lastContact || curr.lastContact > existing.lastContact)) {
          existing.lastContact = curr.lastContact;
        }
      } else {
        acc.push({ ...curr });
      }
      return acc;
    }, []).sort((a, b) => b.revenue - a.revenue);

    if (customersForExport.length > 0) {
      csvContent += "ลูกค้าอันดับต้น (Top Customers)\n";
      csvContent += "ชื่อลูกค้า,จำนวนออเดอร์,มูลค่ารวมทั้งหมด,การสั่งซื้อล่าสุด\n";
      customersForExport.forEach((cust: any) => {
        csvContent += `"${cust.name}",${cust.orders},${cust.revenue},"${cust.lastContact}"\n`;
      });
      csvContent += "\n";
    }

    // Product Performance Section
    if (data.productPerformance && data.productPerformance.length > 0) {
      csvContent += "สินค้าขายดี\n";
      csvContent += "ชื่อสินค้า,จำนวนที่ขายได้(ชิ้น),รายได้ทั้งหมด,จำนวนคงเหลือในคลัง\n";
      data.productPerformance.forEach((prod: any) => {
        csvContent += `"${prod.product}",${prod.sold},${prod.revenue},${prod.stock}\n`;
      });
      csvContent += "\n";
    }

    // File download trigger
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sales-report-${selectedPeriod}-${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("ส่งออกรายงาน CSV สำเร็จ");
  };

  useEffect(() => {
    fetchReports();
  }, [selectedPeriod, date]);

  const defaultData = {
    salesData: [],
    salesByProductType: [],
    employeePerformance: [],
    customerSegments: [],
    topCustomers: [],
    productPerformance: [],
    kpiMetrics: [],
    activityStats: { calls: 0, meetings: 0, emails: 0 },
    summary: { totalRevenue: 0, totalOrders: 0, avgOrder: 0, growth: 0 }
  };

  const data = reportData ? { ...defaultData, ...reportData } : defaultData;

  const CATEGORY_MAP: Record<string, string> = {
    'readymade': 'สินค้าสำเร็จรูป',
    'made-to-order': 'สินค้าสั่งทำ',
    'service': 'งานบริการ',
    'semi-finished': 'กึ่งสำเร็จรูป',
    'other': 'อื่นๆ'
  };

  const salesByProductTypeThai = useMemo(() => {
    return data.salesByProductType.map((item: any) => ({
      ...item,
      displayName: CATEGORY_MAP[item.name] || item.name
    }));
  }, [data.salesByProductType]);

  if (loading && !reportData) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">กำลังโหลดข้อมูลรายงาน...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileBarChart className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">รายงานผล - ฝ่ายขาย</h1>
            <p className="text-muted-foreground">รายงานและวิเคราะห์ผลการขายแบบครบวงจร (ข้อมูลจริง)</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">สัปดาห์นี้</SelectItem>
              <SelectItem value="month">เดือนนี้</SelectItem>
              <SelectItem value="quarter">ไตรมาสนี้</SelectItem>
              <SelectItem value="year">ปีนี้</SelectItem>
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
              <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="icon" onClick={fetchReports} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button variant="destructive" className="gap-2" onClick={handleExport} disabled={loading}>
            <Download className="h-4 w-4" />
            ส่งออกรายงาน
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="sales" className="gap-1 text-xs"><DollarSign className="w-3 h-3" />ยอดขาย</TabsTrigger>
          <TabsTrigger value="employee" className="gap-1 text-xs"><Users className="w-3 h-3" />พนักงาน</TabsTrigger>
          <TabsTrigger value="customer" className="gap-1 text-xs"><Users className="w-3 h-3" />ลูกค้า</TabsTrigger>
          <TabsTrigger value="contact" className="gap-1 text-xs"><Phone className="w-3 h-3" />การติดต่อ</TabsTrigger>
          <TabsTrigger value="product" className="gap-1 text-xs"><Package className="w-3 h-3" />สินค้า</TabsTrigger>
          <TabsTrigger value="kpi" className="gap-1 text-xs"><Target className="w-3 h-3" />KPI</TabsTrigger>
          {/* <TabsTrigger value="principles" className="gap-1 text-xs"><BookOpen className="w-3 h-3" />หลักการ</TabsTrigger> */}
        </TabsList>

        {/* 1. รายงานยอดขาย */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ยอดขายรวม</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿{data.summary.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">ในช่วงเวลาที่เลือก</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ออเดอร์ทั้งหมด</CardTitle>
                <FileBarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.summary.totalOrders}</div>
                <p className="text-xs text-muted-foreground">จำนวนใบสั่งซื้อ</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">มูลค่าเฉลี่ย/ออเดอร์</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">฿{Math.round(data.summary.avgOrder).toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Ticket Size เฉลี่ย</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">อัตรากำไรเฉลี่ย</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">38%</div>
                <p className="text-xs text-muted-foreground">โดยประมาณ</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>แนวโน้มยอดขายรายเดือน</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="รายได้" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>สัดส่วนยอดขายตามหมวดหมู่</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={salesByProductTypeThai}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      nameKey="displayName"
                      label={({ displayName, value, count }) => `${displayName}: ${count || 0} ออเดอร์ (฿${value.toLocaleString()})`}
                    >
                      {salesByProductTypeThai.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--primary) / ${1 - index * 0.2})`} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: any, props: any) => [
                        `฿${value.toLocaleString()} (${props.payload.count || 0} ออเดอร์)`,
                        "รายได้"
                      ]}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. รายงานพนักงาน */}
        <TabsContent value="employee" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ผลงานพนักงานขาย</CardTitle>
              <CardDescription>วิเคราะห์รายบุคคลจากยอดขายจริง</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อพนักงาน</TableHead>
                    <TableHead className="text-center">ออเดอร์</TableHead>
                    <TableHead className="text-right">ยอดขาย</TableHead>
                    <TableHead className="text-right">เป้าหมาย</TableHead>
                    <TableHead className="text-right">คอมมิชชัน</TableHead>
                    <TableHead className="text-center">ความสำเร็จ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.employeePerformance.map((emp: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{emp.name || 'ไม่ระบุ'}</TableCell>
                      <TableCell className="text-center">{emp.orders}</TableCell>
                      <TableCell className="text-right">฿{emp.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-right">฿{emp.target.toLocaleString()}</TableCell>
                      <TableCell className="text-right">฿{emp.commission.toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={emp.kpi >= 100 ? "default" : "destructive"}>
                          {emp.kpi}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. รายงานลูกค้า */}
        <TabsContent value="customer" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.customerSegments.map((segment: any, index: number) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{segment.type}</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{segment.count} ราย</div>
                  <p className="text-xs text-muted-foreground">฿{segment.revenue.toLocaleString()} ({segment.percentage}%)</p>
                  <Progress value={segment.percentage} className="mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle>ลูกค้าอันดับต้น (Top 10)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อลูกค้า</TableHead>
                    <TableHead className="text-center">ออเดอร์</TableHead>
                    <TableHead className="text-right">มูลค่ารวม</TableHead>
                    <TableHead>สั่งซื้อล่าสุด</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    const topCustomers = (data.topCustomers || []).reduce((acc: any[], curr: any) => {
                      const existing = acc.find(c => c.name.trim() === curr.name.trim());
                      if (existing) {
                        existing.orders = (existing.orders || 0) + (curr.orders || 0);
                        existing.revenue = (existing.revenue || 0) + (curr.revenue || 0);
                        // keep the more recent date
                        if (curr.lastContact && (!existing.lastContact || curr.lastContact > existing.lastContact)) {
                          existing.lastContact = curr.lastContact;
                        }
                      } else {
                        acc.push({ ...curr });
                      }
                      return acc;
                    }, []).sort((a, b) => b.revenue - a.revenue);

                    return topCustomers.map((customer: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-center">{customer.orders}</TableCell>
                        <TableCell className="text-right">฿{customer.revenue.toLocaleString()}</TableCell>
                        <TableCell>{customer.lastContact}</TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. รายงานการติดต่อ */}
        <TabsContent value="contact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">โทรศัพท์</CardTitle>
                <Phone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{data.activityStats.calls}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">นัดพบ</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{data.activityStats.meetings}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">อีเมล</CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{data.activityStats.emails}</div></CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 5. รายงานสินค้า */}
        <TabsContent value="product" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>สินค้าขายดี</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อสินค้า</TableHead>
                    <TableHead className="text-center">ขายได้ (ชิ้น)</TableHead>
                    <TableHead className="text-right">รายได้ทั้งหมด</TableHead>
                    <TableHead className="text-center">สถานะสต็อก</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.productPerformance.map((product: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.product}</TableCell>
                      <TableCell className="text-center">{product.sold}</TableCell>
                      <TableCell className="text-right">฿{product.revenue.toLocaleString()}</TableCell>
                      <TableCell className="text-center"><Badge variant="outline">{product.stock} ในคลัง</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. KPI */}
        <TabsContent value="kpi" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>การติดตาม KPI รายบุคคล/ทีม</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-6">
                {data.kpiMetrics.map((kpi: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{kpi.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {kpi.name.includes("ยอดขาย") ? '฿' : ''}
                          {kpi.actual.toLocaleString()} /
                          {kpi.name.includes("ยอดขาย") ? " ฿" : " "}
                          {kpi.target.toLocaleString()}
                        </span>
                        <Badge variant={kpi.achievement >= 100 ? "default" : "destructive"}>{kpi.achievement}%</Badge>
                      </div>
                    </div>
                    <Progress value={Math.min(kpi.achievement, 100)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {
        loading && (
          <div className="fixed bottom-4 right-4 bg-primary text-white p-3 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">กำลังอัปเดตข้อมูล...</span>
          </div>
        )
      }
    </div >
  );
}
