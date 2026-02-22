import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft,
  Package,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Upload,
  ChevronDown,
  ChevronUp,
  Truck,
  Factory,
  Ship,
  Plane,
  Warehouse,
  MapPin
} from "lucide-react";
import artworkSample from "@/assets/artwork-sample.png";
import ProductionWorkflowBox from "@/components/production/ProductionWorkflowBox";

// Mock orders data
// Mock orders data - using JOB-YYYY-XXX format to match OrderManagement
const mockOrders = [
  {
    id: "JOB-2024-001",
    orderDate: "2024-01-15",
    lineName: "customer_line_1",
    customerName: "บริษัท ABC จำกัด",
    product: "เหรียญรางวัลสำเร็จรูป",
    deliveryDate: "2024-01-25",
    status: "รอผลิต",
    quotation: "Q-2024-001",
    responsiblePerson: "สมชาย ใจดี",
    graphicDesigner: "นภา สวยงาม",
    jobType: "สินค้าสำเร็จรูป",
    quantity: 500,
    isAccepted: false,
    phone: "02-123-4567",
    email: "contact@abc.co.th",
    address: "123 ถนนสุขุมวิท กรุงเทพฯ",
    taxId: "0105555123456",
    productModel: "พลาสติกรู้แพ้รู้ชนะ",
    productDetails: [
      { color: "เหรียญทอง", orderedQty: 200, countedQty: 0 },
      { color: "เหรียญเงิน", orderedQty: 150, countedQty: 0 },
      { color: "เหรียญทองแดง", orderedQty: 150, countedQty: 0 },
    ],
    qcSteps: [
      { key: "artwork", label: "ตรวจสอบ Artwork", status: "pending", photo: null },
      { key: "cnc", label: "ตรวจสอบงาน CNC", status: "pending", photo: null },
      { key: "lanyard", label: "ตรวจสอบสายคล้อง", status: "pending", photo: null },
      { key: "final", label: "ตรวจสอบชิ้นงานก่อนจัดส่ง", status: "pending", photo: null },
    ],
    shippingSteps: [
      { key: "factory-export", label: "ส่งออกจากโรงงาน", status: "pending" },
      { key: "shipping", label: "กำลังขนส่ง", status: "pending" },
      { key: "arrival", label: "ถึงประเทศไทย", status: "pending" },
    ],
    warehouseSteps: [
      { key: "warehouse-to-store", label: "ส่งจากโกดัง → ร้าน", status: "pending" },
      { key: "store-qc", label: "ตรวจนับ & QC ที่ร้าน", status: "pending" },
      { key: "delivery-success", label: "จัดส่งสำเร็จ", status: "pending" },
    ]
  },
  {
    id: "JOB-2024-002",
    orderDate: "2024-01-16",
    lineName: "customer_line_2",
    customerName: "ห้างหุ้นส่วน XYZ",
    product: "เหรียญรางวัล",
    deliveryDate: "2024-01-28",
    status: "กำลังผลิต",
    quotation: "Q-2024-002",
    responsiblePerson: "วิชัย ขยัน",
    graphicDesigner: "สมหญิง รักงาน",
    jobType: "งานเหรียญ",
    quantity: 1250,
    isAccepted: true,
    phone: "02-234-5678",
    email: "info@xyz.co.th",
    address: "456 ถนนพระราม 4 กรุงเทพฯ",
    taxId: "0105555234567",
    productModel: "โลหะซิงค์มัลติฟังค์ชั่น",
    productDetails: [
      { color: "เหรียญทอง", orderedQty: 500, countedQty: 495 },
      { color: "เหรียญเงิน", orderedQty: 400, countedQty: 400 },
      { color: "เหรียญทองแดง", orderedQty: 350, countedQty: 350 },
    ],
    qcSteps: [
      { key: "artwork", label: "ตรวจสอบ Artwork", status: "passed", photo: artworkSample },
      { key: "cnc", label: "ตรวจสอบงาน CNC", status: "passed", photo: artworkSample },
      { key: "lanyard", label: "ตรวจสอบสายคล้อง", status: "active", photo: null },
      { key: "final", label: "ตรวจสอบชิ้นงานก่อนจัดส่ง", status: "pending", photo: null },
    ],
    shippingSteps: [
      { key: "factory-export", label: "ส่งออกจากโรงงาน", status: "pending" },
      { key: "shipping", label: "กำลังขนส่ง", status: "pending" },
      { key: "arrival", label: "ถึงประเทศไทย", status: "pending" },
    ],
    warehouseSteps: [
      { key: "warehouse-to-store", label: "ส่งจากโกดัง → ร้าน", status: "pending" },
      { key: "store-qc", label: "ตรวจนับ & QC ที่ร้าน", status: "pending" },
      { key: "delivery-success", label: "จัดส่งสำเร็จ", status: "pending" },
    ]
  },
  {
    id: "JOB-2024-003",
    orderDate: "2024-01-10",
    lineName: "customer_line_3",
    customerName: "ร้านของขวัญ DEF",
    product: "กระเช้าของขวัญ",
    deliveryDate: "2024-01-20",
    status: "พร้อมจัดส่ง",
    quotation: "Q-2024-003",
    responsiblePerson: "มานะ ทำงาน",
    graphicDesigner: "ประดิษฐ์ สร้างสรรค์",
    jobType: "งานกระเช้า",
    quantity: 10,
    isAccepted: true,
    phone: "02-345-6789",
    email: "shop@def.co.th",
    address: "789 ถนนสีลม กรุงเทพฯ",
    taxId: "0105555345678",
    productModel: "",
    productDetails: [],
    qcSteps: [
      { key: "artwork", label: "ตรวจสอบ Artwork", status: "passed", photo: artworkSample },
      { key: "cnc", label: "ตรวจสอบงาน CNC", status: "passed", photo: artworkSample },
      { key: "lanyard", label: "ตรวจสอบสายคล้อง", status: "passed", photo: artworkSample },
      { key: "final", label: "ตรวจสอบชิ้นงานก่อนจัดส่ง", status: "passed", photo: artworkSample },
    ],
    shippingSteps: [
      { key: "factory-export", label: "ส่งออกจากโรงงาน", status: "passed" },
      { key: "shipping", label: "กำลังขนส่ง", status: "passed" },
      { key: "arrival", label: "ถึงประเทศไทย", status: "passed" },
    ],
    warehouseSteps: [
      { key: "warehouse-to-store", label: "ส่งจากโกดัง → ร้าน", status: "active" },
      { key: "store-qc", label: "ตรวจนับ & QC ที่ร้าน", status: "pending" },
      { key: "delivery-success", label: "จัดส่งสำเร็จ", status: "pending" },
    ]
  },
  {
    id: "JOB-2024-004",
    orderDate: "2024-01-15",
    lineName: "customer_line_1",
    customerName: "บริษัท ABC จำกัด",
    product: "เหรียญรางวัลสำเร็จรูป",
    deliveryDate: "2024-01-25",
    status: "จัดส่งแล้ว",
    quotation: "Q-2024-001",
    responsiblePerson: "สมชาย ใจดี",
    graphicDesigner: "นภา สวยงาม",
    jobType: "สินค้าสำเร็จรูป",
    quantity: 500,
    isAccepted: true,
    phone: "02-123-4567",
    email: "contact@abc.co.th",
    address: "123 ถนนสุขุมวิท กรุงเทพฯ",
    taxId: "0105555123456",
    productModel: "พลาสติกรู้แพ้รู้ชนะ",
    productDetails: [
      { color: "เหรียญทอง", orderedQty: 200, countedQty: 200 },
      { color: "เหรียญเงิน", orderedQty: 150, countedQty: 150 },
      { color: "เหรียญทองแดง", orderedQty: 150, countedQty: 150 },
    ],
    qcSteps: [
      { key: "artwork", label: "ตรวจสอบ Artwork", status: "passed", photo: artworkSample },
      { key: "cnc", label: "ตรวจสอบงาน CNC", status: "passed", photo: artworkSample },
      { key: "lanyard", label: "ตรวจสอบสายคล้อง", status: "passed", photo: artworkSample },
      { key: "final", label: "ตรวจสอบชิ้นงานก่อนจัดส่ง", status: "passed", photo: artworkSample },
    ],
    shippingSteps: [
      { key: "factory-export", label: "ส่งออกจากโรงงาน", status: "passed" },
      { key: "shipping", label: "กำลังขนส่ง", status: "passed" },
      { key: "arrival", label: "ถึงประเทศไทย", status: "passed" },
    ],
    warehouseSteps: [
      { key: "warehouse-to-store", label: "ส่งจากโกดัง → ร้าน", status: "passed" },
      { key: "store-qc", label: "ตรวจนับ & QC ที่ร้าน", status: "passed" },
      { key: "delivery-success", label: "จัดส่งสำเร็จ", status: "passed" },
    ]
  },
  {
    id: "JOB-2024-005",
    orderDate: "2024-01-18",
    lineName: "customer_line_5",
    customerName: "บริษัท สยามทอง จำกัด",
    product: "ถ้วยรางวัล",
    deliveryDate: "2024-01-30",
    status: "รอผลิต",
    quotation: "Q-2024-005",
    responsiblePerson: "สมชาย ใจดี",
    graphicDesigner: "นภา สวยงาม",
    jobType: "งานถ้วย",
    quantity: 50,
    isAccepted: false,
    phone: "02-567-8901",
    email: "info@siamthong.co.th",
    address: "555 ถนนเพชรบุรี กรุงเทพฯ",
    taxId: "0105555567890",
    productModel: "",
    productDetails: [],
    qcSteps: [
      { key: "artwork", label: "ตรวจสอบ Artwork", status: "pending", photo: null },
      { key: "cnc", label: "ตรวจสอบงาน CNC", status: "pending", photo: null },
      { key: "lanyard", label: "ตรวจสอบสายคล้อง", status: "pending", photo: null },
      { key: "final", label: "ตรวจสอบชิ้นงานก่อนจัดส่ง", status: "pending", photo: null },
    ],
    shippingSteps: [
      { key: "factory-export", label: "ส่งออกจากโรงงาน", status: "pending" },
      { key: "shipping", label: "กำลังขนส่ง", status: "pending" },
      { key: "arrival", label: "ถึงประเทศไทย", status: "pending" },
    ],
    warehouseSteps: [
      { key: "warehouse-to-store", label: "ส่งจากโกดัง → ร้าน", status: "pending" },
      { key: "store-qc", label: "ตรวจนับ & QC ที่ร้าน", status: "pending" },
      { key: "delivery-success", label: "จัดส่งสำเร็จ", status: "pending" },
    ]
  }
];

export default function ProductionOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [expandedSections, setExpandedSections] = useState<string[]>(["production", "shipping", "warehouse"]);

  const order = mockOrders.find(o => o.id === orderId);

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
      "รอผลิต": "bg-destructive text-destructive-foreground",
      "กำลังผลิต": "bg-blue-500 text-white",
      "พร้อมจัดส่ง": "bg-amber-500 text-white",
      "ส่งมอบแล้ว": "bg-green-500 text-white"
    };
    return <Badge className={colors[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "active":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "pending":
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-green-100 text-green-700">เสร็จสิ้น</Badge>;
      case "active":
        return <Badge className="bg-blue-100 text-blue-700">กำลังดำเนินการ</Badge>;
      case "pending":
        return <Badge variant="secondary">รอดำเนินการ</Badge>;
      default:
        return <Badge variant="secondary">รอดำเนินการ</Badge>;
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleOpenLightbox = (image: string) => {
    setLightboxImage(image);
    setShowLightbox(true);
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
              รายละเอียดออเดอร์: {order.id}
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
            <div>
              <p className="text-sm text-muted-foreground">กราฟิกผู้รับผิดชอบ</p>
              <p className="font-medium">{order.graphicDesigner}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product Details Table */}
      {order.productDetails.length > 0 && (
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
                {order.productDetails.map((detail, index) => (
                  <TableRow key={index}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium">{order.productModel}</TableCell>
                    <TableCell>{detail.color}</TableCell>
                    <TableCell className="text-right">{detail.orderedQty}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={3} className="font-semibold">รวมทั้งหมด</TableCell>
                  <TableCell className="text-right font-semibold">
                    {order.productDetails.reduce((sum, d) => sum + d.orderedQty, 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Production Workflow Box - แสดงขั้นตอน 1-7 สำหรับทุก Order */}
      <ProductionWorkflowBox orderId={order.id} />


      {/* Accept Job Button */}
      {!order.isAccepted && (
        <div className="flex justify-center">
          <Button size="lg" onClick={() => console.log("Accept job:", order.id)}>
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
