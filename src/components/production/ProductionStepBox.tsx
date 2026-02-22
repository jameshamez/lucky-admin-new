import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, CheckCircle, AlertCircle, Clock, Printer, ZoomIn, ChevronLeft, ChevronRight, ImageIcon, User, FileText, PackageMinus, Edit, History, ChevronDown, ChevronUp } from "lucide-react";
import { Copy, Truck } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface LogEntry {
  action: string;
  timestamp: string;
  user: string;
  detail?: string;
}

interface StepData {
  status: "pending" | "in_progress" | "issue" | "complete";
  remark: string;
  images: File[];
  imagePreviews: string[];
  updatedAt: string;
  updatedBy: string;
  boxCount?: number;
  carrierName?: string;
  trackingNumber?: string;
  updateLogs?: LogEntry[];
}

interface ProductionStepBoxProps {
  stepKey: string;
  stepNumber: number;
  title: string;
  icon: React.ReactNode;
  completedStatus: string;
  initialData?: StepData;
  isLocked: boolean;
  onUpdate: (stepKey: string, data: StepData) => void;
  hasBoxCount?: boolean;
  hasShippingInfo?: boolean;
  isDeliverySlipStep?: boolean;
  compact?: boolean;
  // Role-based access control
  requiresGraphicDepartment?: boolean;
  currentUserDepartment?: string;
  onPrintDeliverySlip?: () => void;
}

export function ProductionStepBox({
  stepKey,
  stepNumber,
  title,
  icon,
  completedStatus,
  initialData,
  isLocked,
  onUpdate,
  hasBoxCount,
  hasShippingInfo,
  isDeliverySlipStep,
  requiresGraphicDepartment = false,
  currentUserDepartment = "production",
  onPrintDeliverySlip,
}: ProductionStepBoxProps) {
  const [data, setData] = useState<StepData>(
    initialData || {
      status: "in_progress",
      remark: "",
      images: [],
      imagePreviews: [],
      updatedAt: "",
      updatedBy: "",
      boxCount: 0,
      carrierName: "",
      trackingNumber: "",
      updateLogs: [],
    }
  );
  const [selectedStatus, setSelectedStatus] = useState<string>("in_progress");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  const getTimestamp = () => {
    const now = new Date();
    return now.toLocaleDateString("th-TH", {
      day: "2-digit", month: "2-digit", year: "numeric",
    }) + " " + now.toLocaleTimeString("th-TH", {
      hour: "2-digit", minute: "2-digit",
    });
  };

  const addLog = (logs: LogEntry[] | undefined, action: string, user: string, timestamp: string, detail?: string): LogEntry[] => {
    return [...(logs || []), { action, timestamp, user, detail }];
  };

  // Mock components data for stock withdrawal (procurement step)
  const mockComponents = [
    { id: "MAT-001", name: "ตัวเหรียญ", color: "ทอง", size: "5cm", requiredQty: 200, withdrawnQty: 0, image: "https://img.icons8.com/emoji/96/1st-place-medal.png" },
    { id: "MAT-002", name: "ตัวเหรียญ", color: "เงิน", size: "5cm", requiredQty: 150, withdrawnQty: 0, image: "https://img.icons8.com/emoji/96/2nd-place-medal.png" },
    { id: "MAT-003", name: "ตัวเหรียญ", color: "ทองแดง", size: "5cm", requiredQty: 150, withdrawnQty: 0, image: "https://img.icons8.com/emoji/96/3rd-place-medal.png" },
    { id: "MAT-004", name: "สายคล้องคอ", color: "น้ำเงิน", size: "90cm", requiredQty: 500, withdrawnQty: 0, image: "https://img.icons8.com/fluency/96/ribbon.png" },
    { id: "MAT-005", name: "กล่องใส่เหรียญ", color: "ดำ", size: "8x8cm", requiredQty: 500, withdrawnQty: 0, image: "https://img.icons8.com/fluency/96/box.png" },
  ];

  const [withdrawalItems, setWithdrawalItems] = useState(mockComponents);
  const [withdrawalRequester, setWithdrawalRequester] = useState("");
  const [withdrawalHistory, setWithdrawalHistory] = useState<Array<{
    date: string;
    requester: string;
    items: typeof mockComponents;
  }>>([]);

  const mockEmployees = ["สมชาย ใจดี", "วิชัย ขยัน", "นภา สวยงาม", "สมหญิง รักงาน", "มานะ ทำงาน"];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);

    Promise.all(
      newFiles.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          })
      )
    ).then((previews) => {
      setData((prev) => ({
        ...prev,
        images: [...prev.images, ...newFiles],
        imagePreviews: [...prev.imagePreviews, ...previews],
      }));
    });
  };

  const handleRemoveImage = (index: number) => {
    setData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }));
    if (currentImageIndex >= data.imagePreviews.length - 1) {
      setCurrentImageIndex(Math.max(0, data.imagePreviews.length - 2));
    }
  };

  const handleUpdate = () => {
    if (!isDeliverySlipStep && data.imagePreviews.length === 0) {
      toast.error("กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป");
      return;
    }

    if (selectedStatus === "issue" && !data.remark.trim()) {
      toast.error("กรุณาระบุหมายเหตุปัญหา");
      return;
    }

    const timestamp = getTimestamp();
    const user = "สมชาย ใจดี";
    const newStatus = selectedStatus === "issue" ? "issue" : "complete";
    const actionLabel = newStatus === "issue" ? "รายงานปัญหา" : "อัปเดตเสร็จสิ้น";

    const updatedData: StepData = {
      ...data,
      status: newStatus,
      updatedAt: timestamp,
      updatedBy: user,
      updateLogs: addLog(data.updateLogs, actionLabel, user, timestamp, data.remark || undefined),
    };

    setData(updatedData);
    onUpdate(stepKey, updatedData);

    if (selectedStatus === "in_progress") {
      toast.success(`อัปเดตเสร็จ! สถานะเปลี่ยนเป็น "${completedStatus}"`);
    } else {
      toast.warning("บันทึกปัญหาแล้ว รอหัวหน้าตรวจสอบ");
    }
  };

  const handlePrintDeliverySlip = () => {
    if (onPrintDeliverySlip) {
      onPrintDeliverySlip();
    }
    const timestamp = getTimestamp();
    const user = "สมชาย ใจดี";
    const updatedData: StepData = {
      ...data,
      status: "complete",
      updatedAt: timestamp,
      updatedBy: user,
      updateLogs: addLog(data.updateLogs, "พิมพ์ใบส่งของ", user, timestamp),
    };
    setData(updatedData);
    onUpdate(stepKey, updatedData);
  };

  const handleWithdrawStock = () => {
    if (!withdrawalRequester) {
      toast.error("กรุณาเลือกผู้เบิก");
      return;
    }
    const hasQty = withdrawalItems.some(item => item.withdrawnQty > 0);
    if (!hasQty) {
      toast.error("กรุณากรอกจำนวนที่เบิกอย่างน้อย 1 รายการ");
      return;
    }
    const overItems = withdrawalItems.filter(item => item.withdrawnQty > item.requiredQty);
    if (overItems.length > 0) {
      toast.error("จำนวนที่เบิกเกินจำนวนที่ต้องการ");
      return;
    }

    const now = new Date();
    const timestamp = now.toLocaleDateString("th-TH", {
      day: "2-digit", month: "2-digit", year: "numeric",
    }) + " " + now.toLocaleTimeString("th-TH", {
      hour: "2-digit", minute: "2-digit",
    });

    setWithdrawalHistory(prev => [...prev, {
      date: timestamp,
      requester: withdrawalRequester,
      items: withdrawalItems.filter(i => i.withdrawnQty > 0),
    }]);

    toast.success(`เบิกสินค้าสำเร็จ! ตัดสต๊อกแล้ว โดย ${withdrawalRequester}`);
    setWithdrawalDialogOpen(false);
    // Reset quantities
    setWithdrawalItems(prev => prev.map(item => ({ ...item, withdrawnQty: 0 })));
    setWithdrawalRequester("");
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % data.imagePreviews.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + data.imagePreviews.length) % data.imagePreviews.length);
  };

  const getStatusBadge = () => {
    if (data.status === "complete") {
      return (
        <Badge className="bg-green-100 text-green-700 text-[10px] py-0 px-1.5">
          <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
          เสร็จสิ้น
        </Badge>
      );
    }
    if (data.status === "issue") {
      return (
        <Badge className="bg-red-100 text-red-700 text-[10px] py-0 px-1.5">
          <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
          มีปัญหา
        </Badge>
      );
    }
    if (isLocked) {
      return (
        <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
          <Clock className="w-2.5 h-2.5 mr-0.5" />
          รอ
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-700 text-[10px] py-0 px-1.5">
        <Clock className="w-2.5 h-2.5 mr-0.5" />
        กำลังทำ
      </Badge>
    );
  };

  const isCompleted = data.status === "complete";
  const hasIssue = data.status === "issue";
  const hasImages = data.imagePreviews.length > 0;
  const latestImage = hasImages ? data.imagePreviews[data.imagePreviews.length - 1] : null;
  const remainingCount = data.imagePreviews.length - 1;

  // Get status label for completed steps
  const getCompletedStatusLabel = () => {
    return completedStatus;
  };

  // Status Badge Component for inside content
  const ContentStatusBadge = () => {
    if (isCompleted) {
      return (
        <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs font-medium px-2 py-0.5 w-fit">
          {getCompletedStatusLabel()}
        </Badge>
      );
    }
    if (hasIssue) {
      return (
        <Badge className="bg-red-100 text-red-700 border border-red-200 text-xs font-medium px-2 py-0.5 w-fit">
          มีปัญหา - รอตรวจสอบ
        </Badge>
      );
    }
    return null;
  };

  // Compact Staff Info Block - grouped tightly next to image (max 280px)
  const StaffInfoBlock = ({ showStatus = true }: { showStatus?: boolean }) => {
    return (
      <div className="flex flex-col gap-1.5 max-w-[280px]">
        {/* Status Badge at top */}
        {showStatus && <ContentStatusBadge />}
        
        {/* Date/Time - Bold */}
        {data.updatedAt && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-bold text-foreground">{data.updatedAt}</span>
          </div>
        )}
        
        {/* Employee Name - Clear */}
        {data.updatedBy && (
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-semibold text-foreground">{data.updatedBy}</span>
          </div>
        )}
      </div>
    );
  };

  // Image Thumbnail Component - Fixed size for consistency
  const ImageThumbnail = () => {
    const sizeClasses = "w-24 h-24";
    
    if (!latestImage) {
      return (
        <label className={`${sizeClasses} border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors flex-shrink-0`}>
          <Upload className="w-5 h-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground mt-1">เพิ่มรูป</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      );
    }

    return (
      <div className="flex flex-col gap-1 flex-shrink-0">
        <div 
          className={`relative ${sizeClasses} cursor-pointer group rounded-lg overflow-hidden border shadow-sm`}
          onClick={() => openLightbox(data.imagePreviews.length - 1)}
        >
          <img
            src={latestImage}
            alt="Latest upload"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
            <ZoomIn className="w-5 h-5 text-white" />
          </div>
          {remainingCount > 0 && (
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-medium">
              +{remainingCount}
            </div>
          )}
        </div>
        <label className="flex items-center justify-center text-xs text-primary cursor-pointer hover:underline gap-1">
          <ImageIcon className="w-3 h-3" />
          เพิ่มรูป
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>
      </div>
    );
  };

  // Check if this step is skippable based on order context
  const isSkippable = stepKey === "ribbon" || stepKey === "labeling";
  const isSkipped = isSkippable && initialData?.status === "pending" && isLocked;

  // Role-based access control: Check if current user can update this step
  const isGraphicOnlyStep = requiresGraphicDepartment;
  const canUserUpdateThisStep = !isGraphicOnlyStep || currentUserDepartment === "design";
  const showGraphicWaitingState = isGraphicOnlyStep && currentUserDepartment !== "design" && !isCompleted && !isLocked;

  return (
    <>
      <Card className={`
        h-full
        ${isLocked && !isSkipped ? "opacity-40 bg-muted/20 scale-[0.98]" : ""} 
        ${isSkipped ? "opacity-30 bg-muted/10 scale-[0.96]" : ""}
        ${hasIssue ? "border-red-500 border-2 bg-red-50/30 shadow-md" : ""} 
        ${isCompleted ? "border-green-500 border-2 bg-green-50/30 shadow-md" : "border shadow-sm"}
        transition-all flex flex-col w-full
      `}>
        {/* Card Header */}
        <div className={`flex items-center justify-between px-4 py-2 border-b border-border/50 ${isLocked ? "bg-muted/10" : "bg-muted/20"}`}>
          <div className="flex items-center gap-2">
            <span className={`flex items-center justify-center w-6 h-6 text-xs rounded-full font-bold ${
              isLocked ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground"
            }`}>
              {stepNumber}
            </span>
            <span className={isLocked ? "text-muted-foreground" : ""}>{icon}</span>
            <span className={`text-sm font-semibold ${isLocked ? "text-muted-foreground" : ""}`}>{title}</span>
          </div>
          {getStatusBadge()}
        </div>

        <CardContent className="p-4 flex-1 flex flex-col">
          {/* ===== DELIVERY SLIP STEP (7) ===== */}
          {isDeliverySlipStep && !isLocked && !isCompleted && (
            <div className="flex items-start gap-4">
              {/* Left placeholder for visual alignment with other cards */}
              <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center flex-shrink-0 bg-muted/30">
                <FileText className="w-8 h-8 text-muted-foreground/50" />
              </div>
              {/* Right: Info + Button grouped together */}
              <div className="flex flex-col gap-2 max-w-[280px]">
                <Badge className="bg-blue-100 text-blue-700 w-fit text-xs px-2 py-0.5">พร้อมพิมพ์เอกสาร</Badge>
                <StaffInfoBlock showStatus={false} />
                <Button
                  variant="destructive"
                  size="default"
                  className="h-9 px-4 text-sm font-bold w-fit mt-1"
                  onClick={handlePrintDeliverySlip}
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  พิมพ์ใบส่งของ
                </Button>
              </div>
            </div>
          )}

          {isDeliverySlipStep && isCompleted && (
            <div className="flex items-start gap-4">
              {/* Left placeholder */}
              <div className="w-24 h-24 border rounded-lg flex items-center justify-center flex-shrink-0 bg-green-50">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              {/* Right: Staff Info grouped */}
              <div className="flex flex-col gap-2 max-w-[280px]">
                <StaffInfoBlock showStatus={true} />
                <div className="flex items-center gap-1.5 text-green-600 mt-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">พิมพ์เอกสารแล้ว</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs font-medium w-fit mt-1"
                  onClick={handlePrintDeliverySlip}
                >
                  <Printer className="w-3.5 h-3.5 mr-1" />
                  พิมพ์เอกสารอีกครั้ง
                </Button>
              </div>
            </div>
          )}

          {isDeliverySlipStep && isLocked && (
            <div className="flex items-center justify-center flex-1 min-h-[100px]">
              <p className="text-sm text-muted-foreground">รอขั้นตอนก่อนหน้าเสร็จสิ้น</p>
            </div>
          )}

          {/* ===== GRAPHIC DEPARTMENT WAITING STATE (For non-graphic users) ===== */}
          {!isDeliverySlipStep && showGraphicWaitingState && !hasIssue && (
            <div className="flex items-start gap-4">
              {/* Left: Image or Placeholder */}
              {latestImage ? (
                <div 
                  className="relative w-24 h-24 cursor-pointer group rounded-lg overflow-hidden border shadow-sm flex-shrink-0"
                  onClick={() => openLightbox(data.imagePreviews.length - 1)}
                >
                  <img
                    src={latestImage}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                  {remainingCount > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      +{remainingCount}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center flex-shrink-0 bg-muted/30">
                  <Clock className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}

              {/* Right: Waiting for Graphic Department Info */}
              <div className="flex flex-col gap-2 max-w-[280px]">
                <Badge className="bg-purple-100 text-purple-700 border border-purple-200 text-xs font-medium px-2 py-0.5 w-fit">
                  รอแผนกกราฟิกดำเนินการ
                </Badge>
                <p className="text-xs text-muted-foreground">
                  ขั้นตอนนี้ดำเนินการโดยแผนกกราฟิกเท่านั้น
                </p>
                {data.updatedAt && <StaffInfoBlock showStatus={false} />}
                
                {/* Disabled Button for visual consistency */}
                <Button
                  disabled
                  className="h-11 md:h-9 font-semibold text-sm w-fit px-8 md:px-6 min-w-[120px] opacity-50 cursor-not-allowed"
                  variant="secondary"
                >
                  อัปเดตงาน
                </Button>
              </div>
            </div>
          )}

          {/* ===== REGULAR STEPS - ACTIVE STATE (Can update) ===== */}
          {!isDeliverySlipStep && !isLocked && !isCompleted && !hasIssue && canUserUpdateThisStep && !showGraphicWaitingState && (
            <div className="flex items-start gap-4">
              {/* Left: Image */}
              <ImageThumbnail />

              {/* Right: Fields grouped compactly - max 280px */}
              <div className="flex flex-col gap-2 max-w-[280px]">
                {/* Status Dropdown */}
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-8 text-sm w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    <SelectItem value="in_progress">🟡 กำลังดำเนินการ</SelectItem>
                    <SelectItem value="issue">🔴 มีปัญหา</SelectItem>
                  </SelectContent>
                </Select>

                {/* Issue Remark */}
                {selectedStatus === "issue" && (
                  <Textarea
                    placeholder="ระบุปัญหา..."
                    value={data.remark}
                    onChange={(e) => setData((prev) => ({ ...prev, remark: e.target.value }))}
                    className="border-red-300 min-h-[40px] text-sm resize-none w-[220px]"
                  />
                )}

                {/* Box Count for Packing */}
                {hasBoxCount && selectedStatus !== "issue" && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs shrink-0">กล่อง:</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={data.boxCount || ""}
                      onChange={(e) => setData((prev) => ({ ...prev, boxCount: parseInt(e.target.value) || 0 }))}
                      min={0}
                      className="h-8 text-sm w-20"
                    />
                  </div>
                )}

                {/* Shipping Info - Step 8 */}
                {hasShippingInfo && selectedStatus !== "issue" && (
                  <div className="space-y-1.5">
                    <Input
                      placeholder="ชื่อขนส่ง (เช่น Flash, Kerry)"
                      value={data.carrierName || ""}
                      onChange={(e) => setData((prev) => ({ ...prev, carrierName: e.target.value }))}
                      className="h-8 text-sm w-[220px]"
                    />
                    <Input
                      placeholder="เลขพัสดุ/Tracking"
                      value={data.trackingNumber || ""}
                      onChange={(e) => setData((prev) => ({ ...prev, trackingNumber: e.target.value }))}
                      className="h-8 text-sm w-[220px]"
                    />
                  </div>
                )}

                {/* Update Button - Touch Friendly */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={handleUpdate}
                    className="h-11 md:h-9 font-semibold text-sm w-fit px-8 md:px-6 min-w-[120px]"
                    variant="destructive"
                  >
                    อัปเดตงาน
                  </Button>
                  {/* Stock Withdrawal Button - Only for procurement step */}
                  {stepKey === "procurement" && (
                    <Button
                      onClick={() => setWithdrawalDialogOpen(true)}
                      className="h-11 md:h-9 font-semibold text-sm w-fit px-6 md:px-4 bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      <PackageMinus className="w-4 h-4 mr-1.5" />
                      เบิกสินค้า/ตัดสต๊อก
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== COMPLETED STATE ===== */}
          {!isDeliverySlipStep && isCompleted && (
            <div className="flex items-start gap-4">
              {/* Left: Image */}
              {latestImage ? (
                <div 
                  className="relative w-24 h-24 cursor-pointer group rounded-lg overflow-hidden border shadow-sm flex-shrink-0"
                  onClick={() => openLightbox(data.imagePreviews.length - 1)}
                >
                  <img
                    src={latestImage}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                  {remainingCount > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      +{remainingCount}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 border rounded-lg flex items-center justify-center flex-shrink-0 bg-green-50">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
              )}

              {/* Right: Staff Info Block - grouped tightly next to image */}
              <div className="flex flex-col gap-1.5 max-w-[280px]">
                <StaffInfoBlock showStatus={true} />
                
                {/* Additional Info */}
                {hasBoxCount && data.boxCount && (
                  <p className="text-xs text-muted-foreground">📦 {data.boxCount} กล่อง</p>
                )}
                {hasShippingInfo && (
                  <div className="text-xs space-y-1">
                    {data.carrierName && (
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-foreground font-medium">{data.carrierName}</span>
                      </div>
                    )}
                    {data.trackingNumber && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">เลขพัสดุ:</span>
                        <span className="font-mono text-foreground font-semibold">{data.trackingNumber}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 p-0 hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(data.trackingNumber || "");
                            toast.success("คัดลอกเลขพัสดุแล้ว");
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Re-update Button */}
                <Button
                  onClick={() => {
                    const ts = getTimestamp();
                    const u = "สมชาย ใจดี";
                    setData(prev => ({
                      ...prev,
                      status: "in_progress",
                      updateLogs: addLog(prev.updateLogs, "เปิดแก้ไขใหม่", u, ts),
                    }));
                    setSelectedStatus("in_progress");
                  }}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs w-fit mt-2 border-primary text-primary hover:bg-primary/10"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  อัปเดตใหม่
                </Button>
              </div>
            </div>
          )}

          {/* ===== ISSUE STATE ===== */}
          {!isDeliverySlipStep && hasIssue && (
            <div className="flex items-start gap-4">
              {/* Left: Image */}
              {latestImage ? (
                <div 
                  className="relative w-24 h-24 cursor-pointer group rounded-lg overflow-hidden border shadow-sm flex-shrink-0"
                  onClick={() => openLightbox(data.imagePreviews.length - 1)}
                >
                  <img
                    src={latestImage}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                </div>
              ) : (
                <ImageThumbnail />
              )}

              {/* Right: Staff Info + Remark + Update Button */}
              <div className="flex flex-col gap-1.5 max-w-[280px]">
                <StaffInfoBlock showStatus={true} />
                {data.remark && (
                  <div className="p-2 bg-red-100 rounded text-xs text-red-700 border border-red-200">
                    💬 {data.remark}
                  </div>
                )}
                
                {/* Re-update controls for fixing the issue */}
                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-red-200">
                  <label className="flex items-center justify-center text-xs text-primary cursor-pointer hover:underline gap-1 w-fit">
                    <ImageIcon className="w-3 h-3" />
                    อัปโหลดรูปแก้ไข
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <Textarea
                    placeholder="ระบุรายละเอียดการแก้ไข..."
                    value={data.remark}
                    onChange={(e) => setData((prev) => ({ ...prev, remark: e.target.value }))}
                    className="border-red-300 min-h-[40px] text-sm resize-none w-[220px]"
                  />
                  <Button
                    onClick={() => {
                      const ts = getTimestamp();
                      const u = "สมชาย ใจดี";
                      const updatedData: StepData = {
                        ...data,
                        status: "complete",
                        updatedAt: ts,
                        updatedBy: u,
                        updateLogs: addLog(data.updateLogs, "แก้ไขปัญหาเรียบร้อย", u, ts, data.remark || undefined),
                      };
                      setData(updatedData);
                      onUpdate(stepKey, updatedData);
                      toast.success(`แก้ไขปัญหาเรียบร้อย! สถานะเปลี่ยนเป็น "${completedStatus}"`);
                    }}
                    className="h-11 md:h-9 font-semibold text-sm w-fit px-8 md:px-6 min-w-[120px]"
                    variant="destructive"
                  >
                    <AlertCircle className="w-4 h-4 mr-1.5" />
                    อัปเดตแก้ไขปัญหา
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ===== LOCKED STATE - Collapsed with Tooltip ===== */}
          {!isDeliverySlipStep && isLocked && (
            <div 
              className="flex items-center justify-center flex-1 min-h-[60px] cursor-not-allowed group"
              title="รอขั้นตอนก่อนหน้าเสร็จสิ้น"
            >
              <div className="flex flex-col items-center gap-1">
                <Clock className="w-5 h-5 text-muted-foreground/50" />
                <p className="text-xs text-muted-foreground/70 group-hover:text-muted-foreground transition-colors">
                  รอขั้นตอนก่อนหน้า
                </p>
              </div>
            </div>
          )}
        </CardContent>

        {/* Update Log History */}
        {data.updateLogs && data.updateLogs.length > 0 && (
          <div className="border-t border-border/50">
            <Collapsible open={logOpen} onOpenChange={setLogOpen}>
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-1.5 w-full px-4 py-2 text-xs text-muted-foreground hover:bg-muted/30 transition-colors">
                  <History className="w-3.5 h-3.5" />
                  <span className="font-medium">ประวัติการอัปเดต ({data.updateLogs.length})</span>
                  {logOpen ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-3 space-y-1.5 max-h-40 overflow-y-auto">
                  {[...data.updateLogs].reverse().map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs p-2 rounded bg-muted/30 border border-border/30">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium">{log.action}</Badge>
                          <span className="text-muted-foreground">{log.timestamp}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <User className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-foreground">{log.user}</span>
                        </div>
                        {log.detail && (
                          <p className="text-muted-foreground mt-1 text-[11px]">💬 {log.detail}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </Card>

      {/* Image Gallery Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-2 bg-black/95">
          {data.imagePreviews.length > 0 && (
            <div className="relative">
              {/* Main Image */}
              <div className="flex items-center justify-center min-h-[60vh]">
                <img
                  src={data.imagePreviews[currentImageIndex]}
                  alt={`Image ${currentImageIndex + 1}`}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>

              {/* Navigation Arrows */}
              {data.imagePreviews.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                {currentImageIndex + 1} / {data.imagePreviews.length}
              </div>

              {/* Thumbnail Strip */}
              {data.imagePreviews.length > 1 && (
                <div className="flex gap-2 justify-center mt-3 overflow-x-auto pb-2">
                  {data.imagePreviews.map((preview, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-12 h-12 flex-shrink-0 rounded overflow-hidden border-2 transition-all ${
                        index === currentImageIndex ? "border-primary scale-110" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={preview} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Delete Button */}
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-10"
                onClick={() => {
                  handleRemoveImage(currentImageIndex);
                  if (data.imagePreviews.length <= 1) {
                    setLightboxOpen(false);
                  }
                }}
              >
                <X className="w-4 h-4 mr-1" />
                ลบรูปนี้
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stock Withdrawal Dialog */}
      <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <PackageMinus className="w-5 h-5 text-amber-500" />
              เบิกสินค้า / ตัดสต๊อก
            </DialogTitle>
          </DialogHeader>

          {/* Requester Dropdown */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">ผู้เบิก</Label>
            <Select value={withdrawalRequester} onValueChange={setWithdrawalRequester}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกผู้เบิก..." />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {mockEmployees.map(emp => (
                  <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Components Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-500">
                  <TableHead className="text-white font-semibold">รหัสสินค้า</TableHead>
                  <TableHead className="text-white font-semibold">รูปสินค้า</TableHead>
                  <TableHead className="text-white font-semibold">ชื่อ</TableHead>
                  <TableHead className="text-white font-semibold">สี</TableHead>
                  <TableHead className="text-white font-semibold">ขนาด</TableHead>
                  <TableHead className="text-white font-semibold text-right">จำนวนที่ต้องการ</TableHead>
                  <TableHead className="text-white font-semibold text-right">จำนวนที่เบิก</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawalItems.map((item, index) => (
                  <TableRow key={item.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <TableCell className="font-mono text-sm font-medium text-blue-600">{item.id}</TableCell>
                    <TableCell>
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-contain rounded border bg-white p-0.5" />
                    </TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.color}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell className="text-right font-semibold">{item.requiredQty}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        min={0}
                        max={item.requiredQty}
                        value={item.withdrawnQty || ""}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setWithdrawalItems(prev => prev.map((it, i) =>
                            i === index ? { ...it, withdrawnQty: val } : it
                          ));
                        }}
                        className={`h-8 w-20 text-sm text-right ml-auto ${
                          item.withdrawnQty > item.requiredQty ? "border-destructive" : ""
                        }`}
                        placeholder="0"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Withdrawal History */}
          {withdrawalHistory.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">ประวัติการเบิก</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {withdrawalHistory.map((record, idx) => (
                  <div key={idx} className="p-2 bg-muted/30 rounded-lg border text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{record.requester}</span>
                      <span className="text-muted-foreground">{record.date}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {record.items.map(i => `${i.name} (${i.color}) x${i.withdrawnQty}`).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawalDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleWithdrawStock}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              <PackageMinus className="w-4 h-4 mr-1.5" />
              ยืนยันเบิกสินค้า
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
