import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle2, 
  Lock, 
  ChevronDown, 
  ChevronUp,
  Image as ImageIcon,
  Clock,
  Truck,
  ClipboardCheck,
  ThumbsUp,
  Upload,
  Download,
  Eye,
  Link,
  Copy,
  ExternalLink
} from "lucide-react";
import artworkSample from "@/assets/artwork-sample.png";

interface DeliveryInfo {
  carrier: string;
  trackingNumber?: string;
  trackingLink?: string;
}

interface LogisticsStep {
  key: string;
  label: string;
  icon: React.ElementType;
  photos: {
    url: string;
    uploadedBy: string;
    uploadedAt: string;
    department: string;
  }[];
  status: "pending" | "completed" | "locked";
  confirmedBy?: string;
  confirmedAt?: string;
  deliveryInfo?: DeliveryInfo;
}

interface LogisticsDeliveryCardsProps {
  orderId: string;
  userRole: "เซลล์" | "คลังสินค้า" | "ขนส่ง";
}

export default function LogisticsDeliveryCards({ orderId, userRole }: LogisticsDeliveryCardsProps) {
  const [steps, setSteps] = useState<LogisticsStep[]>([
    {
      key: "warehouse_to_store",
      label: "ส่งจากโกดัง → ร้าน",
      icon: Truck,
      photos: [
        { 
          url: artworkSample, 
          uploadedBy: "สมศักดิ์", 
          uploadedAt: "2025-01-12 08:30",
          department: "คลังสินค้า"
        },
        { 
          url: artworkSample, 
          uploadedBy: "สมศักดิ์", 
          uploadedAt: "2025-01-12 08:35",
          department: "คลังสินค้า"
        },
      ],
      status: "completed",
      confirmedBy: "สมศักดิ์",
      confirmedAt: "2025-01-12 09:00",
    },
    {
      key: "store_qc",
      label: "ตรวจนับ & QC ที่ร้าน",
      icon: ClipboardCheck,
      photos: [
        { 
          url: artworkSample, 
          uploadedBy: "วิภา", 
          uploadedAt: "2025-01-12 14:00",
          department: "คลังสินค้า"
        },
      ],
      status: "completed",
      confirmedBy: "วิภา",
      confirmedAt: "2025-01-12 15:30",
    },
    {
      key: "delivery_success",
      label: "จัดส่งสำเร็จ",
      icon: ThumbsUp,
      photos: [
        { 
          url: artworkSample, 
          uploadedBy: "ประเสริฐ", 
          uploadedAt: "2025-01-13 10:00",
          department: "ขนส่ง"
        },
        { 
          url: artworkSample, 
          uploadedBy: "ประเสริฐ", 
          uploadedAt: "2025-01-13 10:05",
          department: "ขนส่ง"
        },
      ],
      status: "completed",
      confirmedBy: "ประเสริฐ",
      confirmedAt: "2025-01-13 10:15",
      deliveryInfo: {
        carrier: "Flash",
        trackingNumber: "TH123456789",
      },
    },
  ]);

  const [expandedSteps, setExpandedSteps] = useState<string[]>(["warehouse_to_store"]);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const toggleExpand = (stepKey: string) => {
    setExpandedSteps(prev => 
      prev.includes(stepKey) 
        ? prev.filter(k => k !== stepKey)
        : [...prev, stepKey]
    );
  };

  const openLightbox = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const completedCount = steps.filter(s => s.status === "completed").length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // Check if user can operate (warehouse/logistics) or just view (sales)
  const canOperate = userRole === "คลังสินค้า" || userRole === "ขนส่ง";
  const isSalesView = userRole === "เซลล์";

  const getStepCardStyle = (step: LogisticsStep) => {
    if (step.status === "locked") {
      return "border-muted bg-muted/30 opacity-60";
    }
    if (step.status === "completed") {
      return "border-blue-200 bg-blue-50/50";
    }
    return "border-blue-400 bg-blue-50 shadow-md";
  };

  const getStepBadge = (step: LogisticsStep) => {
    if (step.status === "locked") {
      return <Badge className="bg-muted text-muted-foreground">รอขั้นตอนก่อนหน้า</Badge>;
    }
    if (step.status === "completed") {
      return <Badge className="bg-blue-500 text-white">เสร็จสิ้น</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-700">กำลังดำเนินการ</Badge>;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
          <Truck className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">สถานะคลังสินค้า & การจัดส่ง</h2>
          <p className="text-xs text-muted-foreground">Logistics & Delivery Tracking</p>
        </div>
        <Badge className={progressPercent === 100 ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-700"}>
          {progressPercent === 100 ? "จัดส่งสำเร็จ" : `${progressPercent}%`}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <div className="w-full bg-blue-100 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-medium text-blue-600">{completedCount}/{steps.length}</span>
      </div>

      {/* Role Indicator for Sales */}
      {isSalesView && (
        <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">โหมดดูอย่างเดียว (แผนกเซลล์)</span>
          </div>
        </div>
      )}

      {/* Logistics Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isExpanded = expandedSteps.includes(step.key);
          const isCompleted = step.status === "completed";
          const isLocked = step.status === "locked";

          return (
            <Card 
              key={step.key}
              className={`transition-all duration-200 ${getStepCardStyle(step)}`}
            >
              <CardHeader 
                className="p-3 cursor-pointer"
                onClick={() => !isLocked && toggleExpand(step.key)}
              >
                <div className="flex items-center gap-3">
                  {/* Step Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isLocked 
                      ? "bg-muted" 
                      : isCompleted 
                        ? "bg-blue-500" 
                        : "bg-blue-100"
                  }`}>
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <StepIcon className="w-4 h-4 text-blue-600" />
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isLocked ? "text-muted-foreground" : "text-foreground"}`}>
                        {index + 1}. {step.label}
                      </span>
                      {getStepBadge(step)}
                    </div>
                    {isCompleted && step.confirmedAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3 inline mr-1" />
                        ยืนยันเมื่อ {step.confirmedAt} โดย {step.confirmedBy}
                      </p>
                    )}
                  </div>

                  {/* Expand Toggle */}
                  {!isLocked && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>

              {/* Expanded Content */}
              {isExpanded && !isLocked && (
                <CardContent className="px-3 pb-3 pt-0">
                  <div className="border-t border-blue-200 pt-3">
                    {/* Photos Section */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">รูปภาพอัปเดต</span>
                        <Badge variant="secondary" className="text-xs h-5">
                          {step.photos.length} รูป
                        </Badge>
                      </div>

                      {step.photos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {step.photos.map((photo, photoIndex) => (
                            <div key={photoIndex} className="relative group">
                              <img
                                src={photo.url}
                                alt={`${step.label} - ${photoIndex + 1}`}
                                className="w-full h-20 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => openLightbox(photo.url)}
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
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
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 w-7 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(photo.url, `${step.key}-${photoIndex + 1}.png`);
                                  }}
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-b-lg truncate">
                                {photo.uploadedBy} • {photo.uploadedAt.split(' ')[1]}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-20 bg-muted/50 rounded-lg border border-dashed">
                          <span className="text-sm text-muted-foreground">ยังไม่มีรูปภาพ</span>
                        </div>
                      )}
                    </div>

                    {/* Upload Info for Each Photo */}
                    <div className="space-y-1 mb-3">
                      {step.photos.map((photo, photoIndex) => (
                        <div key={photoIndex} className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>รูป {photoIndex + 1}: อัปโหลดโดย {photo.uploadedBy} ({photo.department}) เมื่อ {photo.uploadedAt}</span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Info Section - For delivery_success step */}
                    {step.key === "delivery_success" && (
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Truck className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">ข้อมูลการจัดส่ง</span>
                        </div>
                        
                        {isSalesView && step.deliveryInfo ? (
                          // Read-only view for Sales
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground w-20">ชื่อขนส่ง:</Label>
                              <span className="text-sm font-medium">{step.deliveryInfo.carrier}</span>
                            </div>
                            {step.deliveryInfo.trackingNumber && (
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground w-20">เลขพัสดุ:</Label>
                                <span className="text-sm font-medium">{step.deliveryInfo.trackingNumber}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    navigator.clipboard.writeText(step.deliveryInfo?.trackingNumber || "");
                                  }}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                            {step.deliveryInfo.trackingLink && (
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-muted-foreground w-20">ลิงก์ติดตาม:</Label>
                                <a 
                                  href={step.deliveryInfo.trackingLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                >
                                  ติดตามพัสดุ <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        ) : canOperate ? (
                          // Editable form for warehouse/logistics
                          <div className="space-y-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs">ชื่อขนส่ง</Label>
                              <Select defaultValue={step.deliveryInfo?.carrier}>
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="เลือกขนส่ง" />
                                </SelectTrigger>
                                <SelectContent className="bg-white z-50">
                                  <SelectItem value="Lalamove">Lalamove</SelectItem>
                                  <SelectItem value="Flash">Flash</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">เลขที่พัสดุ หรือ ลิงก์การจัดส่งสินค้า</Label>
                              <Input 
                                placeholder="กรอกเลขพัสดุ หรือ ลิงก์ติดตาม"
                                defaultValue={step.deliveryInfo?.trackingNumber || step.deliveryInfo?.trackingLink}
                                className="bg-white"
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Action Buttons - Only for warehouse/logistics */}
                    {canOperate && step.status !== "completed" && (
                      <div className="flex gap-2 pt-2 border-t border-blue-200">
                        <Button size="sm" variant="outline" className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50">
                          <Upload className="w-4 h-4 mr-1" />
                          อัปโหลดรูป
                        </Button>
                        <Button size="sm" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          ยืนยันสถานะ
                        </Button>
                      </div>
                    )}

                    {/* Read-only status for Sales */}
                    {isSalesView && isCompleted && (
                      <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-blue-700">
                          ยืนยันแล้วโดย {step.confirmedBy} เมื่อ {step.confirmedAt}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>ดูรูปภาพ</span>
              {lightboxImage && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => downloadImage(lightboxImage, 'logistics-photo.png')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  ดาวน์โหลด
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {lightboxImage && (
            <div className="flex items-center justify-center">
              <img 
                src={lightboxImage} 
                alt="Full size" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
