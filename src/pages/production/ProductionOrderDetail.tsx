import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Package,
  Building2,
  FileText,
  Loader2,
} from "lucide-react";
import ProductionWorkflowBox from "@/components/production/ProductionWorkflowBox";
import { productionService } from "@/services/productionService";
import { toast } from "sonner";

interface OrderItem {
  color?: string;
  product_name?: string;
  quantity?: number;
}

interface OrderDetailData {
  orderId: number | string;
  jobId: string;
  orderDate: string;
  lineName: string;
  customerName: string;
  product: string;
  deliveryDate: string;
  status: string;
  quotation: string;
  responsiblePerson: string;
  jobType: string;
  quantity: number;
  isAccepted: boolean;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  items: OrderItem[];
  productionWorkflow: Record<string, unknown> | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapOrderDetail = (o: any): OrderDetailData => ({
  orderId: o.order_id,
  jobId: o.job_id || "-",
  orderDate: (o.order_date || "").split(" ")[0] || "-",
  lineName: o.customer_line || "-",
  customerName: o.customer_name || "-",
  product: o.job_name || "-",
  deliveryDate: o.delivery_date || "-",
  status: o.order_status || "-",
  quotation: o.quotation_number || "-",
  responsiblePerson: o.responsible_person || "-",
  jobType: o.product_category || o.product_type || "-",
  quantity: Array.isArray(o.items)
    ? o.items.reduce((sum: number, item: OrderItem) => sum + (Number(item.quantity) || 0), 0)
    : 0,
  isAccepted: o.order_status !== "สร้างคำสั่งซื้อใหม่",
  phone: o.customer_phone || "-",
  email: o.customer_email || "-",
  address: o.customer_address || o.delivery_address || "-",
  taxId: o.tax_id || "-",
  items: Array.isArray(o.items) ? o.items : [],
  productionWorkflow: o.production_workflow || null,
});

export default function ProductionOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    productionService
      .getOrders({ id: orderId })
      .then((res) => {
        if (res.status === "success" && res.data) {
          setOrder(mapOrderDetail(res.data));
        } else {
          setOrder(null);
        }
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">ไม่พบออเดอร์ที่ต้องการ</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/production/orders')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับไปหน้ารายการ
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      "สร้างคำสั่งซื้อใหม่": "bg-destructive text-destructive-foreground",
      "ยืนยันคำสั่งซื้อ": "bg-blue-500 text-white",
      "สร้างงานแล้ว": "bg-amber-500 text-white",
      "ส่งมอบแล้ว": "bg-green-500 text-white"
    };
    return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const handleAcceptJob = async () => {
    try {
      await productionService.updateOrderStatus(order.orderId, "สร้างงานแล้ว");
      setOrder({ ...order, isAccepted: true });
      toast.success("รับงานสำเร็จ");
    } catch {
      toast.error("รับงานไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/production/orders')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับ
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary" />
              รายละเอียดออเดอร์: {order.jobId}
            </h1>
            <p className="text-muted-foreground">ข้อมูลและสถานะการผลิต</p>
          </div>
        </div>
        {getStatusBadge(order.status)}
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            ข้อมูลลูกค้า
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">ชื่อลูกค้า</p>
              <p className="font-medium">{order.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">เลขผู้เสียภาษี</p>
              <p className="font-medium">{order.taxId}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>
              <p className="font-medium">{order.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">อีเมล</p>
              <p className="font-medium">{order.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Line ID</p>
              <p className="font-medium">{order.lineName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ที่อยู่</p>
              <p className="font-medium">{order.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Info */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลคำสั่งซื้อ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">วันที่สั่งซื้อ</p>
              <p className="font-medium">{order.orderDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">วันที่จัดส่ง</p>
              <p className="font-medium">{order.deliveryDate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ใบเสนอราคา</p>
              <p className="font-medium">{order.quotation}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ประเภทงาน</p>
              <p className="font-medium">{order.jobType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">สินค้า</p>
              <p className="font-medium">{order.product}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">จำนวน</p>
              <p className="font-medium">{order.quantity} ชิ้น</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">พนักงานขาย</p>
              <p className="font-medium">{order.responsiblePerson}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Details Table */}
      {order.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ลำดับ</TableHead>
                  <TableHead>รุ่น</TableHead>
                  <TableHead>สี</TableHead>
                  <TableHead className="text-right">จำนวนที่สั่ง</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{item.product_name || "-"}</TableCell>
                    <TableCell>{item.color || "-"}</TableCell>
                    <TableCell className="text-right">{item.quantity || 0}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={3} className="font-semibold">รวมทั้งหมด</TableCell>
                  <TableCell className="text-right font-semibold">
                    {order.items.reduce((sum, d) => sum + (d.quantity || 0), 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Production Workflow Box - แสดงขั้นตอน 1-7 สำหรับทุก Order */}
      <ProductionWorkflowBox
        orderId={order.jobId}
        dbOrderId={order.orderId}
        initialWorkflow={order.productionWorkflow}
      />

      {/* Accept Job Button */}
      {!order.isAccepted && (
        <div className="flex justify-center">
          <Button size="lg" onClick={handleAcceptJob}>
            รับงาน
          </Button>
        </div>
      )}

      {/* Image Lightbox */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>รูปภาพ</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img src={lightboxImage} alt="Preview" className="max-h-[70vh] object-contain" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
