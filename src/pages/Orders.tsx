import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Download } from "lucide-react";
import { useState } from "react";

export default function Orders() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  const handleViewOrderDetails = (orderId: string) => {
    // Set order details and show details view
    setSelectedOrder({ id: orderId });
    setShowOrderDetails(true);
  };

  if (showOrderDetails && selectedOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">รายละเอียดออเดอร์ {selectedOrder.id}</h1>
            <p className="text-muted-foreground">ข้อมูลออเดอร์ทั้งหมด</p>
          </div>
          <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
            กลับไปรายการออเดอร์
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">รายละเอียดออเดอร์ {selectedOrder.id}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการออเดอร์</h1>
          <p className="text-muted-foreground">รายการคำสั่งซื้อทั้งหมด</p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-primary-hover">
          <Plus className="w-4 h-4 mr-2" />
          สร้างออเดอร์ใหม่
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="ค้นหาออเดอร์..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          กรองข้อมูล
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          ส่งออก
        </Button>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการออเดอร์</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">หมายเลขออเดอร์</th>
                  <th className="text-left p-4 font-medium">ชื่อลูกค้า</th>
                  <th className="text-left p-4 font-medium">สินค้า</th>
                  <th className="text-left p-4 font-medium">วันที่สั่งซื้อ</th>
                  <th className="text-left p-4 font-medium">ช่องทางการขาย</th>
                  <th className="text-left p-4 font-medium">วันที่จัดส่ง</th>
                  <th className="text-left p-4 font-medium">สถานะ</th>
                  <th className="text-left p-4 font-medium">การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">#ORD001</td>
                  <td className="p-4">บริษัท เอบีซี จำกัด</td>
                  <td className="p-4">เหรียญรางวัล</td>
                  <td className="p-4">15/01/2025</td>
                  <td className="p-4">
                    <Badge variant="outline">ลูกค้าสั่งเอง</Badge>
                  </td>
                  <td className="p-4">20/01/2025</td>
                  <td className="p-4">
                    <Badge variant="default">กำลังผลิต</Badge>
                  </td>
                  <td className="p-4">
                    <Button size="sm" variant="outline" onClick={() => handleViewOrderDetails('#ORD001')}>
                      ดูรายละเอียด
                    </Button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">#ORD002</td>
                  <td className="p-4">โรงเรียนเดฟเดฟ</td>
                  <td className="p-4">ถ้วยรางวัล</td>
                  <td className="p-4">14/01/2025</td>
                  <td className="p-4">
                    <Badge variant="secondary">ฟรีแลนซ์</Badge>
                  </td>
                  <td className="p-4">25/01/2025</td>
                  <td className="p-4">
                    <Badge variant="destructive">รอการชำระ</Badge>
                  </td>
                  <td className="p-4">
                    <Button size="sm" variant="outline" onClick={() => handleViewOrderDetails('#ORD002')}>
                      ดูรายละเอียด
                    </Button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">#ORD003</td>
                  <td className="p-4">ร้าน XYZ สปอร์ต</td>
                  <td className="p-4">โล่รางวัล</td>
                  <td className="p-4">13/01/2025</td>
                  <td className="p-4">
                    <Badge variant="outline">ร้านค้าตัวแทน</Badge>
                  </td>
                  <td className="p-4">22/01/2025</td>
                  <td className="p-4">
                    <Badge variant="default">เสร็จสิ้น</Badge>
                  </td>
                  <td className="p-4">
                    <Button size="sm" variant="outline" onClick={() => handleViewOrderDetails('#ORD003')}>
                      ดูรายละเอียด
                    </Button>
                  </td>
                </tr>
                <tr>
                  <td className="p-4">#ORD004</td>
                  <td className="p-4">มหาวิทยาลัยเทค</td>
                  <td className="p-4">เสื้อกีฬา</td>
                  <td className="p-4">12/01/2025</td>
                  <td className="p-4">
                    <Badge variant="outline">พนักงานเซลล์</Badge>
                  </td>
                  <td className="p-4">30/01/2025</td>
                  <td className="p-4">
                    <Badge variant="secondary">กำลังออกแบบ</Badge>
                  </td>
                  <td className="p-4">
                    <Button size="sm" variant="outline" onClick={() => handleViewOrderDetails('#ORD004')}>
                      ดูรายละเอียด
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}