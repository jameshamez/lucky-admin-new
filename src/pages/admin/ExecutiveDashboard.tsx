import { useEffect, useState } from "react";
import { adminService } from "@/services/adminService";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Clock,
  Target,
  RefreshCw,
  Filter,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  DollarSign,
  ShoppingCart,
  Users,
  Clock,
  Package,
  Target
};

export default function ExecutiveDashboard() {
  const [timePeriod, setTimePeriod] = useState("month");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminService.getDashboardData(timePeriod);
      if (res.status === "success") {
        setData(res.data);
      } else {
        toast.error("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้: " + res.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [timePeriod]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good": return "bg-green-100 text-green-800 border-green-200";
      case "low": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "out": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good": return <CheckCircle className="w-4 h-4" />;
      case "low": case "out": return <AlertTriangle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">กำลังดึงข้อมูลแดชบอร์ดผู้บริหาร...</p>
      </div>
    );
  }

  const {
    financialSnapshot = {},
    revenueExpenseData = [],
    orderStatusData = [],
    keyMetrics = [],
    salesPerformance = [],
    productionEfficiency = [],
    inventoryStatus = { totalValue: 0, lowStock: 0, outOfStock: 0, items: [] }
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">แดชบอร์ดผู้บริหาร</h1>
          <p className="text-muted-foreground mt-1">
            ภาพรวมประสิทธิภาพธุรกิจและตัวชี้วัดสำคัญ
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">วันนี้</SelectItem>
              <SelectItem value="week">สัปดาห์นี้</SelectItem>
              <SelectItem value="month">เดือนนี้</SelectItem>
              <SelectItem value="quarter">ไตรมาสนี้</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Financial Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ยอดขายรวม</p>
                <p className="text-3xl font-bold text-[#FF5A5F]">
                  {new Intl.NumberFormat('th-TH', {
                    style: 'currency',
                    currency: 'THB',
                    minimumFractionDigits: 0
                  }).format(financialSnapshot.totalRevenue)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-[#FF5A5F]" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ต้นทุนรวม</p>
                <p className="text-3xl font-bold">
                  {new Intl.NumberFormat('th-TH', {
                    style: 'currency',
                    currency: 'THB',
                    minimumFractionDigits: 0
                  }).format(financialSnapshot.totalCosts)}
                </p>
              </div>
              <Package className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">กำไรสุทธิ</p>
                <p className="text-3xl font-bold text-green-600">
                  {new Intl.NumberFormat('th-TH', {
                    style: 'currency',
                    currency: 'THB',
                    minimumFractionDigits: 0
                  }).format(financialSnapshot.netProfit)}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">อัตรากำไร</p>
                <p className="text-3xl font-bold text-blue-600">
                  {financialSnapshot.profitMargin}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Expense Chart */}
      <Card>
        <CardHeader>
          <CardTitle>แนวโน้มรายรับ - รายจ่าย (7 วันล่าสุด)</CardTitle>
          <CardDescription>การเปลี่ยนแปลงของรายรับและรายจ่ายรายวัน</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueExpenseData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFA5A8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#FFA5A8" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip
                formatter={(value: number) => [new Intl.NumberFormat('th-TH').format(value), value === revenueExpenseData[0]?.revenue ? 'รายรับ' : 'รายจ่าย']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#FF5A5F" fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="expense" stroke="#FFA5A8" fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Key Metrics and Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>ตัวชี้วัดสำคัญ</CardTitle>
            <CardDescription>ประสิทธิภาพการดำเนินงานในภาพรวม</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {keyMetrics.map((metric: any) => {
              const IconComponent = ICON_MAP[metric.icon] || Target;
              return (
                <div key={metric.title} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gray-100 ${metric.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{metric.title}</p>
                      <p className="text-2xl font-bold">{metric.value}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-medium">{Math.abs(metric.change)}%</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle>สถานะออเดอร์</CardTitle>
            <CardDescription>การกระจายของออเดอร์ในแต่ละสถานะ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {orderStatusData.map((status) => (
                  <div key={status.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-sm">{status.name}</span>
                    </div>
                    <span className="font-medium">{status.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Performance and Production */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Performance */}
        <Card>
          <CardHeader>
            <CardTitle>ประสิทธิภาพการขาย</CardTitle>
            <CardDescription>ผลงานของพนักงานขายเทียบกับเป้าหมาย</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {salesPerformance.map((person) => (
              <div key={person.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{person.name}</span>
                  <Badge
                    variant={person.achievement >= 100 ? "default" : "secondary"}
                    className={person.achievement >= 100 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                  >
                    {person.achievement.toFixed(1)}%
                  </Badge>
                </div>
                <Progress value={Math.min(person.achievement, 100)} className="h-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>ยอดขาย: {new Intl.NumberFormat('th-TH').format(person.sales)}</span>
                  <span>เป้าหมาย: {new Intl.NumberFormat('th-TH').format(person.target)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Inventory Status */}
        <Card>
          <CardHeader>
            <CardTitle>สถานะสินค้าคงคลัง</CardTitle>
            <CardDescription>ภาพรวมของสต็อกสินค้าและการแจ้งเตือน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">มูลค่ารวม</p>
                <p className="text-lg font-bold">
                  {new Intl.NumberFormat('th-TH', {
                    style: 'currency',
                    currency: 'THB',
                    minimumFractionDigits: 0
                  }).format(inventoryStatus.totalValue)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">สินค้าใกล้หมด</p>
                <p className="text-lg font-bold text-yellow-600">{inventoryStatus.lowStock}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">สินค้าหมด</p>
                <p className="text-lg font-bold text-red-600">{inventoryStatus.outOfStock}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">รายการต้องเฝ้าระวัง:</h4>
              {inventoryStatus.items.filter(item => item.status !== 'good').map((item) => (
                <div key={item.name} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <Badge variant="outline" className={getStatusColor(item.status)}>
                    {item.current}/{item.min}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle>ประสิทธิภาพการผลิต</CardTitle>
          <CardDescription>สรุปผลการผลิตและคุณภาพงานของแต่ละแผนก</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productionEfficiency}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="produced" fill="#FF5A5F" name="ผลิตได้" />
              <Bar dataKey="defective" fill="#FFA5A8" name="มีตำหนิ" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}