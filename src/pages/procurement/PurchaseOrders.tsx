import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Plus,
  FileText,
  Package,
  Truck,
  CheckCircle,
  Calendar,
  Building,
  Phone,
  Eye
} from "lucide-react";

const purchaseOrders = [
  {
    id: "PO001",
    supplier: "บริษัท วัสดุไทย จำกัด",
    contact: "คุณสมศักดิ์ - 02-123-4567",
    orderDate: "2024-01-15",
    expectedDate: "2024-01-20",
    status: "pending",
    items: [
      { name: "แผ่นอะคริลิกใส 3mm", quantity: 50, unit: "แผ่น", unitPrice: 80, total: 4000 },
      { name: "สกรูสแตนเลส", quantity: 5, unit: "กล่อง", unitPrice: 120, total: 600 }
    ],
    totalValue: 4600,
    project: "โล่รางวัลสมาคมนักกีฬา"
  },
  {
    id: "PO002",
    supplier: "บริษัท หมึกดี จำกัด",
    contact: "คุณสมปอง - 081-234-5678",
    orderDate: "2024-01-14",
    expectedDate: "2024-01-18",
    status: "processing",
    items: [
      { name: "หมึกพิมพ์สีทอง", quantity: 10, unit: "ขวด", unitPrice: 350, total: 3500 },
      { name: "หมึกพิมพ์สีเงิน", quantity: 5, unit: "ขวด", unitPrice: 350, total: 1750 }
    ],
    totalValue: 5250,
    project: "ถ้วยรางวัลบริษัท ABC"
  },
  {
    id: "PO003",
    supplier: "บริษัท กระดาษคุณภาพ จำกัด",
    contact: "คุณสมใจ - 02-987-6543",
    orderDate: "2024-01-12",
    expectedDate: "2024-01-17",
    status: "shipped",
    items: [
      { name: "กระดาษอาร์ตมาต A4", quantity: 20, unit: "แพ็ค", unitPrice: 150, total: 3000 }
    ],
    totalValue: 3000,
    project: "เอกสารประกอบงาน",
    trackingNumber: "TH1234567890"
  },
  {
    id: "PO004",
    supplier: "บริษัท คริสตัลไทย จำกัด",
    contact: "คุณสมหมาย - 081-987-6543",
    orderDate: "2024-01-10",
    expectedDate: "2024-01-15",
    status: "received",
    items: [
      { name: "ฐานถ้วยไม้สัก", quantity: 30, unit: "ชิ้น", unitPrice: 200, total: 6000 }
    ],
    totalValue: 6000,
    project: "ถ้วยคริสตัลสมาคมนักกีฬา",
    receivedDate: "2024-01-15"
  }
];

const statusConfig = {
  pending: {
    label: "รอดำเนินการ",
    color: "bg-amber-500",
    icon: FileText
  },
  processing: {
    label: "กำลังผลิต",
    color: "bg-blue-500",
    icon: Package
  },
  shipped: {
    label: "กำลังจัดส่ง",
    color: "bg-purple-500",
    icon: Truck
  },
  received: {
    label: "ได้รับแล้ว",
    color: "bg-green-500",
    icon: CheckCircle
  }
};

export default function PurchaseOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPO, setSelectedPO] = useState<any>(null);

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         po.project.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const updateStatus = (poId: string, newStatus: string) => {
    // In real app, this would update the database
    console.log(`Updating PO ${poId} to status ${newStatus}`);
    alert(`อัปเดตสถานะ ${poId} เป็น ${statusConfig[newStatus as keyof typeof statusConfig].label} แล้ว`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ใบสั่งซื้อ</h1>
          <p className="text-muted-foreground">จัดการและติดตามใบสั่งซื้อทั้งหมด</p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="w-4 h-4 mr-2" />
          สร้างใบสั่งซื้อ
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = purchaseOrders.filter(po => po.status === status).length;
          const IconComponent = config.icon;
          
          return (
            <Card key={status} className="text-center">
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <div className={`p-2 rounded-full ${config.color}`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm text-muted-foreground">{config.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchase Orders List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ค้นหาใบสั่งซื้อ (รหัส, ซัพพลายเออร์, โปรเจค)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="กรองตามสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="processing">กำลังผลิต</SelectItem>
                <SelectItem value="shipped">กำลังจัดส่ง</SelectItem>
                <SelectItem value="received">ได้รับแล้ว</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* PO Cards */}
          <div className="space-y-3">
            {filteredPOs.map((po) => (
              <Card 
                key={po.id}
                className={`cursor-pointer transition-all hover:shadow-medium ${
                  selectedPO?.id === po.id ? 'border-primary shadow-medium' : ''
                }`}
                onClick={() => setSelectedPO(po)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{po.id}</h3>
                        {getStatusBadge(po.status)}
                      </div>
                      <p className="font-medium">{po.supplier}</p>
                      <p className="text-sm text-muted-foreground">{po.contact}</p>
                      <p className="text-sm text-muted-foreground">
                        โปรเจค: {po.project}
                      </p>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <p className="text-lg font-bold text-primary">
                        ฿{po.totalValue.toLocaleString()}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>สั่ง: {po.orderDate}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>คาดว่าถึง: {po.expectedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      {po.items.length} รายการ
                    </span>
                    
                    {po.trackingNumber && (
                      <span className="text-sm font-medium text-blue-600">
                        Tracking: {po.trackingNumber}
                      </span>
                    )}
                    
                    {po.receivedDate && (
                      <span className="text-sm font-medium text-green-600">
                        รับเมื่อ: {po.receivedDate}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* PO Detail */}
        <div className="space-y-4">
          {selectedPO ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    รายละเอียดใบสั่งซื้อ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedPO.id}</h3>
                    {getStatusBadge(selectedPO.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedPO.supplier}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedPO.contact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>วันที่สั่ง: {selectedPO.orderDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>กำหนดส่ง: {selectedPO.expectedDate}</span>
                    </div>
                    <div>
                      <span className="font-medium">โปรเจค:</span>
                      <p>{selectedPO.project}</p>
                    </div>
                  </div>

                  {selectedPO.trackingNumber && (
                    <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                      <span className="font-medium text-blue-700">Tracking Number: </span>
                      <span className="text-blue-600">{selectedPO.trackingNumber}</span>
                    </div>
                  )}

                  {selectedPO.receivedDate && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded">
                      <span className="font-medium text-green-700">ได้รับสินค้าเมื่อ: </span>
                      <span className="text-green-600">{selectedPO.receivedDate}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>รายการสินค้า</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedPO.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} {item.unit} × ฿{item.unitPrice}
                          </p>
                        </div>
                        <p className="font-medium">
                          ฿{item.total.toLocaleString()}
                        </p>
                      </div>
                    ))}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold text-primary">
                        <span>รวมทั้งสิ้น:</span>
                        <span>฿{selectedPO.totalValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Update Buttons */}
              <div className="space-y-2">
                {selectedPO.status === "pending" && (
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => updateStatus(selectedPO.id, "processing")}
                  >
                    เริ่มผลิต
                  </Button>
                )}
                
                {selectedPO.status === "processing" && (
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={() => updateStatus(selectedPO.id, "shipped")}
                  >
                    เริ่มจัดส่ง
                  </Button>
                )}
                
                {selectedPO.status === "shipped" && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatus(selectedPO.id, "received")}
                  >
                    ยืนยันได้รับสินค้า
                  </Button>
                )}

                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  ดูใบสั่งซื้อ
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">เลือกใบสั่งซื้อเพื่อดูรายละเอียด</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}