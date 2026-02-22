import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  XCircle, 
  Lock, 
  ChevronDown, 
  ChevronUp,
  Image as ImageIcon,
  Clock,
  Upload,
  Eye,
  Truck,
  ClipboardCheck,
  ThumbsUp,
  Package,
  Ship,
  Plane,
  Factory,
  Download,
  Trash2,
  Plus
} from "lucide-react";
import artworkSample from "@/assets/artwork-sample.png";
import { toast } from "sonner";

// QC Step Interface
interface QCPhotoUpload {
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface QCStep {
  key: string;
  label: string;
  photos: QCPhotoUpload[];
  status: "pending" | "completed" | "locked";
  completedBy?: string;
  completedAt?: string;
}

// Shipping Step Interface
interface ShippingStep {
  key: string;
  label: string;
  icon: React.ElementType;
  photos: QCPhotoUpload[];
  status: "pending" | "completed" | "locked";
  completedBy?: string;
  completedAt?: string;
}

// Logistics Step Interface  
interface LogisticsStep {
  key: string;
  label: string;
  icon: React.ElementType;
  photos: QCPhotoUpload[];
  status: "pending" | "completed" | "locked";
  completedBy?: string;
  completedAt?: string;
}

interface ProcurementStatusUpdateProps {
  orderId: string;
  filterStep?: string;
  hideSections?: ("qc" | "shipping" | "logistics")[];
}

export default function ProcurementStatusUpdate({ orderId, filterStep = "all", hideSections = [] }: ProcurementStatusUpdateProps) {
  // Determine which sections to show based on filterStep
  const qcStepKeys = ["artwork", "cnc", "production", "color_check", "lanyard", "final"];
  const shippingStepKeys = ["factory_ship", "in_transit", "arrived_th"];
  const logisticsStepKeys = ["warehouse_to_store", "store_qc", "delivery_success"];
  
  const showQC = !hideSections.includes("qc") && (filterStep === "all" || qcStepKeys.includes(filterStep));
  const showShipping = !hideSections.includes("shipping") && (filterStep === "all" || shippingStepKeys.includes(filterStep));
  const showLogistics = !hideSections.includes("logistics") && (filterStep === "all" || logisticsStepKeys.includes(filterStep));
  // QC Verification Steps
  const [qcSteps, setQcSteps] = useState<QCStep[]>([
    {
      key: "artwork",
      label: "ตรวจสอบ Artwork",
      photos: [
        { url: artworkSample, uploadedBy: "วิชัย", uploadedAt: "2025-01-05 10:30" }
      ],
      status: "completed",
      completedBy: "วิชัย",
      completedAt: "2025-01-05 10:30"
    },
    {
      key: "cnc",
      label: "ตรวจสอบงาน CNC",
      photos: [
        { url: artworkSample, uploadedBy: "วิชัย", uploadedAt: "2025-01-07 09:00" }
      ],
      status: "completed",
      completedBy: "วิชัย",
      completedAt: "2025-01-07 09:00"
    },
    {
      key: "production",
      label: "ผลิตชิ้นงาน",
      photos: [],
      status: "pending",
    },
    {
      key: "color_check",
      label: "ตรวจสอบลงสี",
      photos: [],
      status: "locked",
    },
    {
      key: "lanyard",
      label: "ตรวจสอบสายคล้อง",
      photos: [],
      status: "locked",
    },
    {
      key: "final",
      label: "ตรวจสอบชิ้นงานก่อนจัดส่ง",
      photos: [],
      status: "locked",
    },
  ]);

  // International Shipping Steps
  const [shippingSteps, setShippingSteps] = useState<ShippingStep[]>([
    {
      key: "factory_ship",
      label: "โรงงานส่งออก",
      icon: Factory,
      photos: [
        { url: artworkSample, uploadedBy: "จัดซื้อ สมชาย", uploadedAt: "23/1/2569 10:36:22" }
      ],
      status: "completed",
      completedBy: "จัดซื้อ สมชาย",
      completedAt: "23/1/2569 10:36:25"
    },
    {
      key: "in_transit",
      label: "ระหว่างขนส่ง",
      icon: Ship,
      photos: [
        { url: artworkSample, uploadedBy: "จัดซื้อ สมชาย", uploadedAt: "25/1/2569 14:20:00" }
      ],
      status: "completed",
      completedBy: "จัดซื้อ สมชาย",
      completedAt: "25/1/2569 14:20:10"
    },
    {
      key: "arrived_th",
      label: "ถึงไทย",
      icon: Plane,
      photos: [
        { url: artworkSample, uploadedBy: "จัดซื้อ สมชาย", uploadedAt: "30/1/2569 11:00:00" }
      ],
      status: "completed",
      completedBy: "จัดซื้อ สมชาย",
      completedAt: "30/1/2569 11:00:30"
    },
  ]);

  // Warehouse & Delivery Steps
  const [logisticsSteps, setLogisticsSteps] = useState<LogisticsStep[]>([
    {
      key: "warehouse_to_store",
      label: "ส่งจากโกดัง → ร้าน",
      icon: Truck,
      photos: [
        { url: artworkSample, uploadedBy: "คลังสินค้า สมหมาย", uploadedAt: "31/1/2569 08:30:00" }
      ],
      status: "completed",
      completedBy: "คลังสินค้า สมหมาย",
      completedAt: "31/1/2569 08:30:15"
    },
    {
      key: "store_qc",
      label: "ตรวจนับ & QC ที่ร้าน",
      icon: ClipboardCheck,
      photos: [],
      status: "pending",
    },
    {
      key: "delivery_success",
      label: "จัดส่งสำเร็จ",
      icon: ThumbsUp,
      photos: [],
      status: "locked",
    },
  ]);

  // Expanded state
  const [expandedQC, setExpandedQC] = useState<string[]>(["lanyard"]);
  const [expandedShipping, setExpandedShipping] = useState<string[]>(["factory_ship"]);
  const [expandedLogistics, setExpandedLogistics] = useState<string[]>([]);

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");

  const toggleExpand = (key: string, type: "qc" | "shipping" | "logistics") => {
    if (type === "qc") {
      setExpandedQC(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    } else if (type === "shipping") {
      setExpandedShipping(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    } else {
      setExpandedLogistics(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    }
  };

  const openLightbox = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  };

  // Upload photo handler
  const handlePhotoUpload = (stepKey: string, type: "qc" | "shipping" | "logistics") => {
    const newPhoto: QCPhotoUpload = {
      url: artworkSample, // In real app, this would be the uploaded file URL
      uploadedBy: "จัดซื้อ สมชาย",
      uploadedAt: new Date().toLocaleString("th-TH")
    };

    if (type === "qc") {
      setQcSteps(prev => prev.map(step => 
        step.key === stepKey 
          ? { ...step, photos: [...step.photos, newPhoto] }
          : step
      ));
    } else if (type === "shipping") {
      setShippingSteps(prev => prev.map(step => 
        step.key === stepKey 
          ? { ...step, photos: [...step.photos, newPhoto] }
          : step
      ));
    } else {
      setLogisticsSteps(prev => prev.map(step => 
        step.key === stepKey 
          ? { ...step, photos: [...step.photos, newPhoto] }
          : step
      ));
    }

    toast.success("อัพโหลดรูปภาพสำเร็จ");
  };

  // Mark step as complete
  const handleMarkComplete = (stepKey: string, type: "qc" | "shipping" | "logistics") => {
    const now = new Date().toLocaleString("th-TH");
    
    if (type === "qc") {
      setQcSteps(prev => {
        const newSteps = prev.map((step, idx) => {
          if (step.key === stepKey) {
            return { ...step, status: "completed" as const, completedBy: "จัดซื้อ สมชาย", completedAt: now };
          }
          // Unlock next step
          if (idx > 0 && prev[idx - 1].key === stepKey && step.status === "locked") {
            return { ...step, status: "pending" as const };
          }
          return step;
        });
        return newSteps;
      });
    } else if (type === "shipping") {
      setShippingSteps(prev => {
        const newSteps = prev.map((step, idx) => {
          if (step.key === stepKey) {
            return { ...step, status: "completed" as const, completedBy: "จัดซื้อ สมชาย", completedAt: now };
          }
          if (idx > 0 && prev[idx - 1].key === stepKey && step.status === "locked") {
            return { ...step, status: "pending" as const };
          }
          return step;
        });
        return newSteps;
      });
    } else {
      setLogisticsSteps(prev => {
        const newSteps = prev.map((step, idx) => {
          if (step.key === stepKey) {
            return { ...step, status: "completed" as const, completedBy: "จัดซื้อ สมชาย", completedAt: now };
          }
          if (idx > 0 && prev[idx - 1].key === stepKey && step.status === "locked") {
            return { ...step, status: "pending" as const };
          }
          return step;
        });
        return newSteps;
      });
    }

    toast.success("อัพเดทสถานะสำเร็จ");
  };

  // Calculate progress
  const qcCompleted = qcSteps.filter(s => s.status === "completed").length;
  const shippingCompleted = shippingSteps.filter(s => s.status === "completed").length;
  const logisticsCompleted = logisticsSteps.filter(s => s.status === "completed").length;

  const getCardStyle = (status: string) => {
    if (status === "locked") return "border-muted bg-muted/30 opacity-60";
    if (status === "completed") return "border-green-300 bg-green-50/50";
    return "border-primary bg-primary/5 shadow-md";
  };

  const getStatusBadge = (status: string) => {
    if (status === "locked") return <Badge className="bg-muted text-muted-foreground"><Lock className="w-3 h-3 mr-1" />รอขั้นตอนก่อนหน้า</Badge>;
    if (status === "completed") return <Badge className="bg-green-500 text-white">เสร็จสิ้น</Badge>;
    return <Badge className="bg-primary text-primary-foreground">กำลังดำเนินการ</Badge>;
  };

  // Render step cards
  const renderStepCard = (
    step: QCStep | ShippingStep | LogisticsStep, 
    index: number, 
    type: "qc" | "shipping" | "logistics",
    expanded: string[]
  ) => {
    const isExpanded = expanded.includes(step.key);
    const isLocked = step.status === "locked";
    const isCompleted = step.status === "completed";
    const StepIcon = 'icon' in step ? step.icon : CheckCircle2;

    return (
      <Card 
        key={step.key}
        className={`transition-all duration-200 ${getCardStyle(step.status)}`}
      >
        <CardHeader 
          className="p-3 cursor-pointer"
          onClick={() => !isLocked && toggleExpand(step.key, type)}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isLocked ? "bg-muted" : isCompleted ? "bg-green-500" : "bg-primary"
            }`}>
              {isLocked ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <StepIcon className="w-4 h-4 text-primary-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-medium ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                  {step.label}
                </span>
                {getStatusBadge(step.status)}
              </div>
              {isCompleted && step.completedAt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  <Clock className="w-3 h-3 inline mr-1" />
                  เสร็จเมื่อ {step.completedAt} โดย {step.completedBy}
                </p>
              )}
            </div>
            {!isLocked && (
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </CardHeader>

        {isExpanded && !isLocked && (
          <CardContent className="px-3 pb-3 pt-0">
            <div className="border-t border-border pt-3 space-y-4">
              {/* Photos Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">รูปภาพอัปเดต</span>
                    <Badge variant="secondary" className="text-xs h-5">
                      {step.photos.length} รูป
                    </Badge>
                  </div>
                </div>

                {step.photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {step.photos.map((photo, photoIdx) => (
                      <div key={photoIdx} className="relative group">
                        <img
                          src={photo.url}
                          alt={`${step.label} - ${photoIdx + 1}`}
                          className="w-full h-20 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openLightbox(photo.url)}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 w-7 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLightbox(photo.url);
                            }}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-b-lg truncate">
                          {photo.uploadedBy} • {photo.uploadedAt.split(' ')[1] || photo.uploadedAt}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-20 bg-muted/50 rounded-lg border border-dashed mb-3">
                    <span className="text-sm text-muted-foreground">ยังไม่มีรูปภาพ</span>
                  </div>
                )}

                {/* Upload Button - Only show for pending steps */}
                {step.status === "pending" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2 flex-1"
                        onClick={() => handlePhotoUpload(step.key, type)}
                      >
                        <Upload className="w-4 h-4" />
                        อัพโหลดรูป
                      </Button>
                      <Input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id={`upload-${type}-${step.key}`}
                        onChange={() => handlePhotoUpload(step.key, type)}
                      />
                    </div>

                {/* Mark Complete Button */}
                    <Button 
                      size="sm"
                      className="w-full bg-green-500 hover:bg-green-600 text-white gap-2"
                      onClick={() => handleMarkComplete(step.key, type)}
                      disabled={step.photos.length === 0}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      ยืนยันขั้นตอนนี้เสร็จสิ้น
                    </Button>
                    {step.photos.length === 0 && (
                      <p className="text-xs text-amber-600 text-center">* กรุณาอัพโหลดรูปอย่างน้อย 1 รูปก่อนยืนยัน</p>
                    )}

                  </div>
                )}

                {/* Special button for warehouse_to_store: notify production - shown regardless of step status */}
                {step.key === "warehouse_to_store" && type === "logistics" && (() => {
                  const storeQcStep = logisticsSteps.find(s => s.key === "store_qc");
                  const alreadyNotified = storeQcStep?.status === "pending" || storeQcStep?.status === "completed";
                  return (
                    <Button
                      size="sm"
                      className={`w-full gap-2 mt-3 ${alreadyNotified ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} text-white`}
                      onClick={() => {
                        if (step.status === "pending") {
                          handleMarkComplete("warehouse_to_store", "logistics");
                        }
                        toast.success(
                          `แจ้งแผนกผลิตและจัดส่งเรียบร้อย — สินค้า ${orderId} ถึงร้านแล้ว รอ ตรวจสอบสินค้า QC`,
                          { duration: 5000 }
                        );
                      }}
                    >
                      <Package className="w-4 h-4" />
                      {alreadyNotified ? "✓ แจ้งสินค้าถึงร้านแล้ว" : "อัพเดท สินค้าถึงร้าน"}
                    </Button>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Section 1: QC Verification */}
      {showQC && (
      <Card className="border-2 border-purple-200 bg-purple-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-700 text-base">
              <CheckCircle2 className="w-5 h-5" />
              การผลิต และการตรวจสอบคุณภาพงาน
            </CardTitle>
            <Badge className={qcCompleted === qcSteps.length ? "bg-green-500" : "bg-purple-100 text-purple-700"}>
              {qcCompleted}/{qcSteps.length} ขั้นตอน
            </Badge>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-purple-100 rounded-full h-2 mt-3">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(qcCompleted / qcSteps.length) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {qcSteps
            .filter(step => filterStep === "all" || step.key === filterStep)
            .map((step, idx) => renderStepCard(step, qcSteps.indexOf(step), "qc", expandedQC))}
        </CardContent>
      </Card>
      )}

      {showShipping && (
      <Card className="border-2 border-orange-200 bg-orange-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-orange-700 text-base">
              <Ship className="w-5 h-5" />
              สถานะการขนส่งระหว่างประเทศ
            </CardTitle>
            <Badge className={shippingCompleted === shippingSteps.length ? "bg-green-500" : "bg-orange-100 text-orange-700"}>
              {shippingCompleted}/{shippingSteps.length} ขั้นตอน
            </Badge>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-orange-100 rounded-full h-2 mt-3">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(shippingCompleted / shippingSteps.length) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {shippingSteps
            .filter(step => filterStep === "all" || step.key === filterStep)
            .map((step, idx) => renderStepCard(step, shippingSteps.indexOf(step), "shipping", expandedShipping))}
        </CardContent>
      </Card>
      )}

      {/* Section 3: Warehouse & Delivery */}
      {showLogistics && (
      <Card className="border-2 border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-700 text-base">
              <Truck className="w-5 h-5" />
              สถานะคลังสินค้า & การจัดส่ง
            </CardTitle>
            <Badge className={logisticsCompleted === logisticsSteps.length ? "bg-green-500" : "bg-blue-100 text-blue-700"}>
              {logisticsCompleted}/{logisticsSteps.length} ขั้นตอน
            </Badge>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-blue-100 rounded-full h-2 mt-3">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(logisticsCompleted / logisticsSteps.length) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {logisticsSteps
            .filter(step => filterStep === "all" || step.key === filterStep)
            .map((step, idx) => renderStepCard(step, logisticsSteps.indexOf(step), "logistics", expandedLogistics))}
        </CardContent>
      </Card>
      )}

      {/* Image Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={lightboxImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
