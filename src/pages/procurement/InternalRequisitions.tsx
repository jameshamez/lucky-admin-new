import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Check,
  X,
  Package,
  AlertTriangle,
  Calendar,
  User
} from "lucide-react";

const requisitions = [
  {
    id: "REQ001",
    department: "ฝ่ายกราฟิก",
    requestedBy: "คุณสมปอง",
    requestDate: "2024-01-15",
    urgency: "สูง",
    status: "pending",
    items: [
      { name: "หมึกพิมพ์สีทอง", quantity: 2, unit: "ขวด", estimatedCost: 700 },
      { name: "กระดาษอาร์ตมาต A4", quantity: 5, unit: "แพ็ค", estimatedCost: 750 }
    ],
    reason: "วัสดุเหลือน้อย ต้องใช้สำหรับงานถ้วยรางวัล",
    totalCost: 1450
  },
  {
    id: "REQ002",
    department: "ฝ่ายผลิต",
    requestedBy: "คุณสมศักดิ์",
    requestDate: "2024-01-14",
    urgency: "กลาง",
    status: "pending",
    items: [
      { name: "แผ่นอะคริลิกใส 3mm", quantity: 10, unit: "แผ่น", estimatedCost: 800 },
      { name: "สกรูสแตนเลส", quantity: 1, unit: "กล่อง", estimatedCost: 120 }
    ],
    reason: "เตรียมวัสดุสำหรับงานโล่รางวัล",
    totalCost: 920
  },
  {
    id: "REQ003",
    department: "ฝ่ายกราฟิก",
    requestedBy: "คุณสมใจ",
    requestDate: "2024-01-13",
    urgency: "ต่ำ",
    status: "approved",
    items: [
      { name: "ฟิล์มโฮโลแกรม", quantity: 3, unit: "เมตร", estimatedCost: 360 }
    ],
    reason: "สำหรับงานพิเศษลูกค้า VIP",
    totalCost: 360,
    approvedDate: "2024-01-14"
  },
  {
    id: "REQ004",
    department: "ฝ่ายผลิต",
    requestedBy: "คุณสมชาติ",
    requestDate: "2024-01-12",
    urgency: "กลาง",
    status: "rejected",
    items: [
      { name: "สีสเปรย์ทอง", quantity: 5, unit: "กระป๋อง", estimatedCost: 1000 }
    ],
    reason: "ต้องการสีสำหรับทดลองสีใหม่",
    totalCost: 1000,
    rejectionReason: "งบประมาณไม่เพียงพอ ขอให้ใช้สีที่มีอยู่ก่อน"
  }
];

const statusConfig = {
  pending: {
    label: "รอการอนุมัติ",
    color: "bg-amber-500",
    textColor: "text-amber-600"
  },
  approved: {
    label: "อนุมัติแล้ว",
    color: "bg-green-500",
    textColor: "text-green-600"
  },
  rejected: {
    label: "ไม่อนุมัติ",
    color: "bg-red-500",
    textColor: "text-red-600"
  }
};

const urgencyConfig = {
  "สูง": { color: "destructive" },
  "กลาง": { color: "secondary" },
  "ต่ำ": { color: "outline" }
};

export default function InternalRequisitions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [selectedRequisition, setSelectedRequisition] = useState<any>(null);

  const filteredRequisitions = requisitions.filter(req => {
    const matchesSearch = req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;
    const matchesUrgency = urgencyFilter === "all" || req.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const pendingRequisitions = requisitions.filter(req => req.status === "pending");

  const approveRequisition = (reqId: string) => {
    // In real app, this would update the database
    console.log(`Approving requisition ${reqId}`);
    alert(`อนุมัติคำขอเบิก ${reqId} เรียบร้อยแล้ว`);
  };

  const rejectRequisition = (reqId: string) => {
    // In real app, this would show a modal for rejection reason
    const reason = prompt("เหตุผลในการไม่อนุมัติ:");
    if (reason) {
      console.log(`Rejecting requisition ${reqId} with reason: ${reason}`);
      alert(`ไม่อนุมัติคำขอเบิก ${reqId}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const config = urgencyConfig[urgency as keyof typeof urgencyConfig];
    return (
      <Badge variant={config.color as any}>
        {urgency}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">คำขอเบิกจากภายใน</h1>
          <p className="text-muted-foreground">อนุมัติและจัดการคำขอเบิกวัสดุจากแผนกต่างๆ</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{pendingRequisitions.length}</p>
          <p className="text-sm text-muted-foreground">คำขอรอการอนุมัติ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requisitions List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ค้นหาคำขอเบิก (รหัส, แผนก, ผู้ขอ)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="pending">รอการอนุมัติ</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
              </SelectContent>
            </Select>

            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="ความเร่งด่วน" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกระดับ</SelectItem>
                <SelectItem value="สูง">สูง</SelectItem>
                <SelectItem value="กลาง">กลาง</SelectItem>
                <SelectItem value="ต่ำ">ต่ำ</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Requisition Cards */}
          <div className="space-y-3">
            {filteredRequisitions.map((req) => (
              <Card 
                key={req.id}
                className={`cursor-pointer transition-all hover:shadow-medium ${
                  selectedRequisition?.id === req.id ? 'border-primary shadow-medium' : ''
                } ${req.urgency === "สูง" && req.status === "pending" ? 'border-l-4 border-l-red-500' : ''}`}
                onClick={() => setSelectedRequisition(req)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{req.id}</h3>
                        {getStatusBadge(req.status)}
                        {getUrgencyBadge(req.urgency)}
                      </div>
                      <p className="font-medium">{req.department}</p>
                      <p className="text-sm text-muted-foreground">
                        ขอโดย: {req.requestedBy}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        รายการ: {req.items.length} รายการ
                      </p>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{req.requestDate}</span>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        ฿{req.totalCost.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {req.status === "pending" && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          approveRequisition(req.id);
                        }}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        อนุมัติ
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          rejectRequisition(req.id);
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        ไม่อนุมัติ
                      </Button>
                    </div>
                  )}

                  {req.status === "rejected" && req.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      <span className="font-medium text-red-700">เหตุผล: </span>
                      <span className="text-red-600">{req.rejectionReason}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Requisition Detail */}
        <div className="space-y-4">
          {selectedRequisition ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    รายละเอียดคำขอเบิก
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedRequisition.id}</h3>
                    <div className="flex gap-2 mt-1">
                      {getStatusBadge(selectedRequisition.status)}
                      {getUrgencyBadge(selectedRequisition.urgency)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>แผนก: {selectedRequisition.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>ผู้ขอ: {selectedRequisition.requestedBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>วันที่ขอ: {selectedRequisition.requestDate}</span>
                    </div>
                    {selectedRequisition.approvedDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>วันที่อนุมัติ: {selectedRequisition.approvedDate}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="font-medium text-sm">เหตุผลในการขอ:</span>
                    <p className="text-sm bg-muted p-2 rounded mt-1">
                      {selectedRequisition.reason}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>รายการวัสดุที่ขอเบิก</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedRequisition.items.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <p className="font-medium">
                          ฿{item.estimatedCost.toLocaleString()}
                        </p>
                      </div>
                    ))}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold text-primary">
                        <span>รวมทั้งสิ้น:</span>
                        <span>฿{selectedRequisition.totalCost.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedRequisition.status === "pending" && (
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => approveRequisition(selectedRequisition.id)}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    อนุมัติ
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => rejectRequisition(selectedRequisition.id)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    ไม่อนุมัติ
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">เลือกคำขอเบิกเพื่อดูรายละเอียด</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}