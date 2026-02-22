import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Package, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";

const mockWarehouseData = [
  { name: "รวมทุกคลัง", total: 12450, ready: 10800, defective: 980, damaged: 670 },
  { name: "TEG", total: 7200, ready: 6300, defective: 550, damaged: 350 },
  { name: "Lucky", total: 5250, ready: 4500, defective: 430, damaged: 320 },
];

const mockTopLowStock = [
  { code: "P001", name: "ถังขยะพลาสติก 120L", stock: 15, min: 50, warehouse: "TEG" },
  { code: "P002", name: "ถังขยะพลาสติก 240L", stock: 22, min: 50, warehouse: "Lucky" },
  { code: "P003", name: "ถังขยะสแตนเลส 80L", stock: 8, min: 30, warehouse: "TEG" },
  { code: "P004", name: "ถังขยะอเนกประสงค์", stock: 18, min: 40, warehouse: "Lucky" },
  { code: "P005", name: "รถเข็นขยะ", stock: 5, min: 20, warehouse: "TEG" },
];

const chartData = [
  { month: "ม.ค.", พร้อมผลิต: 10200, ตำหนิ: 850, ชำรุด: 600 },
  { month: "ก.พ.", พร้อมผลิต: 10500, ตำหนิ: 920, ชำรุด: 580 },
  { month: "มี.ค.", พร้อมผลิต: 10800, ตำหนิ: 980, ชำรุด: 670 },
];

export default function InventoryDashboard() {
  const [selectedWarehouse, setSelectedWarehouse] = useState("รวมทุกคลัง");
  const [searchKeyword, setSearchKeyword] = useState("");

  const currentData = mockWarehouseData.find(w => w.name === selectedWarehouse) || mockWarehouseData[0];

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
            <SelectItem value="TEG">TEG</SelectItem>
            <SelectItem value="Lucky">Lucky</SelectItem>
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
              {((currentData.ready / currentData.total) * 100).toFixed(1)}% ของทั้งหมด
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
              {((currentData.defective / currentData.total) * 100).toFixed(1)}% ของทั้งหมด
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
              {((currentData.damaged / currentData.total) * 100).toFixed(1)}% ของทั้งหมด
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Breakdown ตามสถานะ</CardTitle>
            <CardDescription>แสดงจำนวนสินค้าแต่ละสถานะ 3 เดือนย้อนหลัง</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
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
            <CardTitle>สินค้าใกล้หมด (Top 5)</CardTitle>
            <CardDescription>สินค้าที่พร้อมผลิตต่ำกว่าจุดสั่งซื้อขั้นต่ำ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTopLowStock.map((item) => (
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
