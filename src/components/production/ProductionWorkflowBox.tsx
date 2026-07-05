import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Factory,
  Package,
  Gift,
  Tag,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Camera,
  ClipboardCheck,
  Box,
  Truck,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { productionService } from "@/services/productionService";

// Types
interface ProductionStep {
  key: string;
  label: string;
  icon: React.ReactNode;
  statuses: {
    value: string;
    label: string;
    type: "progress" | "issue" | "complete";
  }[];
  uploadLabel: string;
  hasBoxCount?: boolean;
  hasShippingInfo?: boolean;
}

interface StepData {
  status: string;
  remark: string;
  imageUrls: string[];
  updatedAt: string;
  updatedBy: string;
  boxCount?: number;
  carrierName?: string;
  trackingNumber?: string;
}

interface ProductionWorkflowBoxProps {
  orderId: string;
  dbOrderId?: number | string;
  initialWorkflow?: Record<string, Partial<StepData>> | null;
}

// Production workflow steps configuration
const productionSteps: ProductionStep[] = [
  {
    key: "procurement",
    label: "ขั้นที่ 1: จัดหา",
    icon: <Package className="w-5 h-5" />,
    statuses: [
      { value: "in_progress", label: "กำลังจัดหา", type: "progress" },
      { value: "issue", label: "สินค้ามีไม่ครบ", type: "issue" },
      { value: "complete", label: "รอประกอบ", type: "complete" },
    ],
    uploadLabel: "กดเพื่อถ่ายรูป/อัปโหลด",
  },
  {
    key: "assembly",
    label: "ขั้นที่ 2: ประกอบสินค้า",
    icon: <Factory className="w-5 h-5" />,
    statuses: [
      { value: "in_progress", label: "กำลังประกอบ", type: "progress" },
      { value: "issue", label: "มีปัญหา", type: "issue" },
      { value: "complete", label: "รอผูกโบว์", type: "complete" },
    ],
    uploadLabel: "กดเพื่อถ่ายรูป/อัปโหลด",
  },
  {
    key: "ribbon",
    label: "ขั้นที่ 3: ผูกโบว์",
    icon: <Gift className="w-5 h-5" />,
    statuses: [
      { value: "in_progress", label: "กำลังผูกโบว์", type: "progress" },
      { value: "issue", label: "มีปัญหา", type: "issue" },
      { value: "complete", label: "รอติดป้ายจารึก", type: "complete" },
    ],
    uploadLabel: "กดเพื่อถ่ายรูป/อัปโหลด",
  },
  {
    key: "labeling",
    label: "ขั้นที่ 4: ติดป้ายจารึก",
    icon: <Tag className="w-5 h-5" />,
    statuses: [
      { value: "in_progress", label: "กำลังติดป้ายจารึก", type: "progress" },
      { value: "issue", label: "มีปัญหา", type: "issue" },
      { value: "complete", label: "รอตรวจสอบ QC", type: "complete" },
    ],
    uploadLabel: "กดเพื่อถ่ายรูป/อัปโหลด",
  },
  {
    key: "qc",
    label: "ขั้นที่ 5: ตรวจสอบสินค้า QC",
    icon: <ClipboardCheck className="w-5 h-5" />,
    statuses: [
      { value: "in_progress", label: "กำลังตรวจสอบ", type: "progress" },
      { value: "issue", label: "ไม่ผ่าน QC", type: "issue" },
      { value: "complete", label: "ผ่าน QC - รอแพ็ก", type: "complete" },
    ],
    uploadLabel: "ถ่ายรูปสินค้าหลังตรวจสอบ",
  },
  {
    key: "packing",
    label: "ขั้นที่ 6: แพ็กสินค้า",
    icon: <Box className="w-5 h-5" />,
    statuses: [
      { value: "in_progress", label: "กำลังแพ็ก", type: "progress" },
      { value: "issue", label: "มีปัญหา", type: "issue" },
      { value: "complete", label: "แพ็กเสร็จ - รอจัดส่ง", type: "complete" },
    ],
    uploadLabel: "ถ่ายรูปกล่องสินค้า",
    hasBoxCount: true,
  },
  {
    key: "shipping",
    label: "ขั้นที่ 7: จัดส่งสินค้า",
    icon: <Truck className="w-5 h-5" />,
    statuses: [
      { value: "in_progress", label: "รอจัดส่ง", type: "progress" },
      { value: "issue", label: "มีปัญหา", type: "issue" },
      { value: "complete", label: "จัดส่งแล้ว", type: "complete" },
    ],
    uploadLabel: "ถ่ายรูปใบเสร็จขนส่ง",
    hasShippingInfo: true,
  },
];

// Default (empty) step data, merged with production_workflow loaded from the order
const buildStepData = (
  initialWorkflow?: Record<string, Partial<StepData>> | null
): Record<string, StepData> => {
  const emptyStep: StepData = {
    status: "in_progress",
    remark: "",
    imageUrls: [],
    updatedAt: "",
    updatedBy: "",
  };
  const data: Record<string, StepData> = {};
  productionSteps.forEach((step) => {
    data[step.key] = {
      ...emptyStep,
      ...(initialWorkflow?.[step.key] || {}),
      imageUrls: initialWorkflow?.[step.key]?.imageUrls || [],
    };
  });
  return data;
};

const getLastUpdateFromWorkflow = (stepsData: Record<string, StepData>) => {
  let latest: { timestamp: string; employee: string } | null = null;
  Object.values(stepsData).forEach((step) => {
    if (step.updatedAt && (!latest || step.updatedAt > latest.timestamp)) {
      latest = { timestamp: step.updatedAt, employee: step.updatedBy };
    }
  });
  return latest || { timestamp: "", employee: "" };
};

const getCurrentEmployeeName = () => {
  try {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    return userData.full_name || "ไม่ระบุผู้ใช้งาน";
  } catch {
    return "ไม่ระบุผู้ใช้งาน";
  }
};

export default function ProductionWorkflowBox({ orderId, dbOrderId, initialWorkflow }: ProductionWorkflowBoxProps) {
  const [stepsData, setStepsData] = useState<Record<string, StepData>>(() => buildStepData(initialWorkflow));
  const [lastUpdate, setLastUpdate] = useState(() => getLastUpdateFromWorkflow(buildStepData(initialWorkflow)));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Get status badge styling
  const getStatusBadge = (type: "progress" | "issue" | "complete") => {
    switch (type) {
      case "progress":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "issue":
        return "bg-red-100 text-red-700 border-red-300";
      case "complete":
        return "bg-green-100 text-green-700 border-green-300";
    }
  };

  // Get status icon
  const getStatusIcon = (type: "progress" | "issue" | "complete") => {
    switch (type) {
      case "progress":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "issue":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "complete":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    }
  };

  // Handle status change
  const handleStatusChange = (stepKey: string, value: string) => {
    setStepsData((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        status: value,
        remark: value !== "issue" ? "" : prev[stepKey].remark,
      },
    }));
  };

  // Handle remark change
  const handleRemarkChange = (stepKey: string, value: string) => {
    setStepsData((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        remark: value,
      },
    }));
  };

  // Handle image upload (multiple) - uploads immediately and stores the resulting URLs
  const handleImageUpload = async (stepKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "general");
        const res = await fetch("https://nacres.co.th/api-lucky/admin/order_upload.php", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (json.status === "success" && json.data?.fileUrl) {
          uploadedUrls.push(json.data.fileUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        setStepsData((prev) => ({
          ...prev,
          [stepKey]: {
            ...prev[stepKey],
            imageUrls: [...prev[stepKey].imageUrls, ...uploadedUrls],
          },
        }));
      }
      if (uploadedUrls.length < files.length) {
        toast.error("อัปโหลดรูปบางไฟล์ไม่สำเร็จ");
      }
    } catch {
      toast.error("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // Remove image
  const handleRemoveImage = (stepKey: string, index: number) => {
    setStepsData((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        imageUrls: prev[stepKey].imageUrls.filter((_, i) => i !== index),
      },
    }));
  };

  // Check if step has issue status
  const hasIssueStatus = (stepKey: string) => {
    return stepsData[stepKey]?.status === "issue";
  };

  // Get current status type for a step
  const getCurrentStatusType = (step: ProductionStep): "progress" | "issue" | "complete" => {
    const currentStatus = stepsData[step.key]?.status;
    const statusConfig = step.statuses.find((s) => s.value === currentStatus);
    return statusConfig?.type || "progress";
  };

  // Handle box count change
  const handleBoxCountChange = (stepKey: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setStepsData((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        boxCount: numValue,
      },
    }));
  };

  // Handle carrier name change
  const handleCarrierNameChange = (stepKey: string, value: string) => {
    setStepsData((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        carrierName: value,
      },
    }));
  };

  // Handle tracking number change
  const handleTrackingNumberChange = (stepKey: string, value: string) => {
    setStepsData((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        trackingNumber: value,
      },
    }));
  };

  // Handle print delivery slip
  const handlePrintDeliverySlip = () => {
    toast.success("กำลังพิมพ์ใบส่งของ...", {
      description: `ใบส่งของสำหรับ Order ${orderId}`,
    });
  };

  // Handle update button click - Auto-update to next step if in_progress, then persist
  const handleUpdate = async () => {
    const currentEmployee = getCurrentEmployeeName();
    const now = new Date();
    const timestamp = `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${now.getFullYear()} ${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    // Update each step with timestamp and auto-progress logic
    const updatedStepsData: Record<string, StepData> = { ...stepsData };
    const stepOrder = productionSteps.map((s) => s.key);

    stepOrder.forEach((key) => {
      const currentStatus = updatedStepsData[key].status;

      // If status is in_progress (not issue), auto-update to complete
      if (currentStatus === "in_progress") {
        updatedStepsData[key] = { ...updatedStepsData[key], status: "complete", updatedAt: timestamp, updatedBy: currentEmployee };
      } else if (currentStatus === "issue") {
        // Keep issue status, just update timestamp
        updatedStepsData[key] = { ...updatedStepsData[key], updatedAt: timestamp, updatedBy: currentEmployee };
      }
    });

    if (!dbOrderId) {
      toast.error("ไม่พบรหัสออเดอร์ ไม่สามารถบันทึกได้");
      return;
    }

    setIsSaving(true);
    try {
      await productionService.updateProductionWorkflow(dbOrderId, updatedStepsData);
      setStepsData(updatedStepsData);
      setLastUpdate({ timestamp, employee: currentEmployee });
      toast.success("อัปเดตสถานะการผลิตสำเร็จ", {
        description: `บันทึกโดย ${currentEmployee} เวลา ${timestamp}`,
      });
    } catch {
      toast.error("บันทึกสถานะการผลิตไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2">
          <Factory className="w-5 h-5 text-primary" />
          การผลิต
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {productionSteps.map((step) => {
          const stepData = stepsData[step.key];
          const currentStatusType = getCurrentStatusType(step);
          const isCompleted = currentStatusType === "complete";

          return (
            <div
              key={step.key}
              className={`p-4 rounded-lg border-2 transition-all ${
                isCompleted
                  ? "bg-green-50 border-green-200"
                  : hasIssueStatus(step.key)
                  ? "bg-red-50 border-red-200"
                  : "bg-muted/30 border-muted"
              }`}
            >
              {/* Step Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      isCompleted
                        ? "bg-green-100"
                        : hasIssueStatus(step.key)
                        ? "bg-red-100"
                        : "bg-yellow-100"
                    }`}
                  >
                    {step.icon}
                  </div>
                  <h4 className="font-semibold text-lg">{step.label}</h4>
                </div>
                <Badge
                  variant="outline"
                  className={getStatusBadge(currentStatusType)}
                >
                  <span className="flex items-center gap-1">
                    {getStatusIcon(currentStatusType)}
                    {step.statuses.find((s) => s.value === stepData?.status)?.label || "กำลังดำเนินการ"}
                  </span>
                </Badge>
              </div>

              {/* Status Selection - Dropdown with only 2 options for non-completed steps */}
              {currentStatusType !== "complete" ? (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">เลือกสถานะ:</Label>
                  <Select
                    value={stepData?.status || "in_progress"}
                    onValueChange={(value) => handleStatusChange(step.key, value)}
                  >
                    <SelectTrigger className="w-full max-w-xs">
                      <SelectValue>
                        <span className="flex items-center gap-2">
                          {stepData?.status === "issue" ? "🔴" : "🟡"}
                          {stepData?.status === "issue" 
                            ? step.statuses.find(s => s.value === "issue")?.label 
                            : step.statuses.find(s => s.value === "in_progress")?.label}
                        </span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_progress">
                        <span className="flex items-center gap-2">
                          🟡 {step.statuses.find(s => s.value === "in_progress")?.label}
                        </span>
                      </SelectItem>
                      <SelectItem value="issue">
                        <span className="flex items-center gap-2">
                          🔴 {step.statuses.find(s => s.value === "issue")?.label}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  ✅ {step.statuses.find(s => s.value === "complete")?.label}
                </div>
              )}

              {/* Remark Field - Only show for issue status */}
              {hasIssueStatus(step.key) && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor={`${step.key}-remark`} className="text-sm font-medium text-destructive">
                    หมายเหตุ (จำเป็น):
                  </Label>
                  <Textarea
                    id={`${step.key}-remark`}
                    value={stepData?.remark || ""}
                    onChange={(e) => handleRemarkChange(step.key, e.target.value)}
                    placeholder="ระบุรายละเอียดปัญหา..."
                    className="border-destructive focus:border-destructive"
                    rows={2}
                  />
                </div>
              )}

              {/* Box Count Field - Only for packing step */}
              {step.hasBoxCount && currentStatusType !== "complete" && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor={`${step.key}-boxcount`} className="text-sm font-medium">
                    จำนวนกล่อง:
                  </Label>
                  <Input
                    id={`${step.key}-boxcount`}
                    type="number"
                    min="0"
                    value={stepData?.boxCount || ""}
                    onChange={(e) => handleBoxCountChange(step.key, e.target.value)}
                    placeholder="ระบุจำนวนกล่อง..."
                    className="max-w-xs"
                  />
                </div>
              )}

              {/* Shipping Info Fields - Only for shipping step */}
              {step.hasShippingInfo && (
                <div className="mt-4 space-y-4">
                  {/* Print Delivery Slip Button */}
                  <Button 
                    variant="destructive" 
                    onClick={handlePrintDeliverySlip}
                    className="w-full sm:w-auto"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    พิมพ์ใบส่งของ
                  </Button>

                  {currentStatusType !== "complete" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${step.key}-carrier`} className="text-sm font-medium">
                          ชื่อขนส่ง:
                        </Label>
                        <Input
                          id={`${step.key}-carrier`}
                          value={stepData?.carrierName || ""}
                          onChange={(e) => handleCarrierNameChange(step.key, e.target.value)}
                          placeholder="เช่น Kerry, Flash, Lalamove..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${step.key}-tracking`} className="text-sm font-medium">
                          เลขที่ขนส่ง:
                        </Label>
                        <Input
                          id={`${step.key}-tracking`}
                          value={stepData?.trackingNumber || ""}
                          onChange={(e) => handleTrackingNumberChange(step.key, e.target.value)}
                          placeholder="เลขพัสดุ หรือ Tracking Number..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Image Upload (Multiple) */}
              <div className="mt-4 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  {step.uploadLabel} ({stepData?.imageUrls?.length || 0} รูป)
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isUploading}
                  onChange={(e) => handleImageUpload(step.key, e)}
                  className="max-w-xs"
                />
                {stepData?.imageUrls && stepData.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {stepData.imageUrls.map((preview, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${idx + 1}`}
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(step.key, idx)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step Update Info */}
              {stepData?.updatedAt && (
                <div className="mt-3 text-xs text-muted-foreground">
                  อัปเดตล่าสุด: {stepData.updatedAt} โดย {stepData.updatedBy}
                </div>
              )}
            </div>
          );
        })}

        {/* Footer - Update Button */}
        <div className="pt-4 border-t space-y-3">
          <div className="flex justify-center">
            <Button size="lg" onClick={handleUpdate} className="px-8" disabled={isSaving}>
              <Upload className="w-4 h-4 mr-2" />
              {isSaving ? "กำลังบันทึก..." : "อัปเดตสถานะ"}
            </Button>
          </div>

          {/* Last Update Log */}
          {lastUpdate.timestamp && (
            <div className="text-center text-sm text-muted-foreground">
              อัปเดตล่าสุด: {lastUpdate.timestamp} โดย {lastUpdate.employee}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
