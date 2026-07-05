import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Package, AlertTriangle, XCircle, CheckCircle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { inventoryService, StockSummary, Warehouse } from "@/services/inventoryService";
import { toast } from "sonner";

export default function InventoryDashboard() {
  const [selectedWarehouse, setSelectedWarehouse] = useState("รวมทุกคลัง");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [summary, setSummary] = useState<StockSummary>({ warehouseData: [], topLowStock: [], chartData: [] });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [warehousesRes, summaryRes] = await Promise.all([
          inventoryService.getWarehouses(),
          inventoryService.getStockSummary(),
        ]);
        if (warehousesRes.status === "success") setWarehouses(warehousesRes.data);
        if (summaryRes.status === "success") setSummary(summaryRes.data);
      } catch (error) {
        toast.error("ไม่สามารถโหลดข้อมูลภาพรวมสต็อกได้");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentData = summary.warehouseData.find(w => w.name === selectedWarehouse) || summary.warehouseData[0] || { total: 0, ready: 0, defective: 0, damaged: 0 };
  const filteredLowStock = summary.topLowStock.filter(item =>
    item.name.toLowerCase().includes(searchKeyword.toLowerCase()) || item.code.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const pct = (value: number, total: number) => total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ภาพรวมสต็อกสินค้า</h1>
        <p className="text-muted-foreground">ติดตามสถานะสินค้าคงคลังแบบเรียลไทม์</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="เลือกคลัง" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="รวมทุกคลัง">รวมทุกคลัง</SelectItem>
            {warehouses.map((w) => (
              <SelectItem key={w.id} value={w.code}>{w.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="ค้นหาสินค้า..."
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สต็อกรวม</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">หน่วย</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">พร้อมผลิต</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{currentData.ready.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {pct(currentData.ready, currentData.total)}% ของทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สินค้ามีตำหนิ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{currentData.defective.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {pct(currentData.defective, currentData.total)}% ของทั้งหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สินค้าชำรุด</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{currentData.damaged.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {pct(currentData.damaged, currentData.total)}% ของทั้งหมด
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Breakdown ตามสถานะ</CardTitle>
            <CardDescription>ปริมาณสินค้าที่เคลื่อนไหวแต่ละสถานะ 6 เดือนย้อนหลัง</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="พร้อมผลิต" fill="#22c55e" />
                <Bar dataKey="ตำหนิ" fill="#eab308" />
                <Bar dataKey="ชำรุด" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>สินค้าใกล้หมด (Top 10)</CardTitle>
            <CardDescription>สินค้าที่พร้อมผลิตต่ำกว่าจุดสั่งซื้อขั้นต่ำ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredLowStock.map((item) => (
                <div key={item.code} className="flex items-center justify-between pb-3 border-b last:border-0">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.code} • คลัง {item.warehouse}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">{item.stock} / {item.min}</p>
                    <p className="text-xs text-muted-foreground">คงเหลือ / ขั้นต่ำ</p>
                  </div>
                </div>
              ))}
              {filteredLowStock.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">ไม่มีสินค้าใกล้หมด</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
