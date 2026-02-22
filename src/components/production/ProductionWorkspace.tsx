import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderReferenceCard } from "./OrderReferenceCard";
import { ProductionStepBox } from "./ProductionStepBox";
import { CircularProgress } from "./CircularProgress";
import { DeliverySlipPrint } from "./DeliverySlipPrint";
import { ProcurementInfoCards, ProcurementJobInfo } from "./ProcurementInfoCards";
import ProcurementStatusUpdate from "@/components/procurement/ProcurementStatusUpdate";
import { ArrowLeft, Package, Wrench, Ribbon, Tag, CheckCircle, Box, Truck, FileText, AlertTriangle, Clock, Factory, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductDetail {
  name: string;
  model?: string;
  color?: string;
  orderedQty: number;
  countedQty: number;
}

interface ShippingInfo {
  province: string;
  channel: string;
  shippingFee: number;
  usageDate: string;
  pickupDate?: string;
  pickupTime?: string;
}

interface Order {
  id: string;
  orderDate: string;
  lineName: string;
  customerName: string;
  product: string;
  deliveryDate: string;
  status: string;
  quotation: string;
  responsiblePerson: string;
  graphicDesigner: string;
  assignedEmployee: string;
  jobType: string;
  quantity: number;
  isAccepted: boolean;
  productDetails: ProductDetail[];
  phone?: string;
  address?: string;
  shippingInfo?: ShippingInfo;
  procurementInfo?: ProcurementJobInfo;
  productionWorkflow?: Record<string, {
    status: string;
    remark: string;
    updatedAt: string;
    updatedBy: string;
    boxCount?: number;
    carrierName?: string;
    trackingNumber?: string;
    imagePreviews?: string[];
  }>;
}

interface LogEntry {
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

interface ProductionWorkspaceProps {
  order: Order;
  onBack: () => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  currentUserDepartment?: string; // "production" | "design" | "sales" etc.
}

const PRODUCTION_STEPS = [
  {
    key: "procurement",
    title: "จัดหา",
    icon: <Package className="w-4 h-4" />,
    completedStatus: "รอประกอบ",
    requiresGraphicDepartment: false,
  },
  {
    key: "assembly",
    title: "ประกอบสินค้า",
    icon: <Wrench className="w-4 h-4" />,
    completedStatus: "รอผูกโบว์",
    requiresGraphicDepartment: false,
  },
  {
    key: "ribbon",
    title: "ผูกโบว์",
    icon: <Ribbon className="w-4 h-4" />,
    completedStatus: "รอติดป้ายจารึก",
    requiresGraphicDepartment: false,
  },
  {
    key: "labeling",
    title: "ติดป้ายจารึก",
    icon: <Tag className="w-4 h-4" />,
    completedStatus: "รอตรวจ QC",
    requiresGraphicDepartment: true, // Only Graphic Department can update this step
  },
  {
    key: "qc",
    title: "ตรวจสอบสินค้า QC",
    icon: <CheckCircle className="w-4 h-4" />,
    completedStatus: "ผ่าน QC - รอแพ็ก",
    requiresGraphicDepartment: false,
  },
  {
    key: "packing",
    title: "แพ็กสินค้า",
    icon: <Box className="w-4 h-4" />,
    completedStatus: "แพ็กเสร็จ - รอพิมพ์ใบส่งของ",
    hasBoxCount: true,
    requiresGraphicDepartment: false,
  },
  {
    key: "delivery_slip",
    title: "ใบส่งของ",
    icon: <FileText className="w-4 h-4" />,
    completedStatus: "พิมพ์เอกสารแล้ว - รอจัดส่ง",
    isDeliverySlipStep: true,
    requiresGraphicDepartment: false,
  },
  {
    key: "shipping",
    title: "จัดส่งสินค้า",
    icon: <Truck className="w-4 h-4" />,
    completedStatus: "จัดส่งแล้ว",
    hasShippingInfo: true,
    requiresGraphicDepartment: false,
  },
];

// Stepper steps matching procurement's Quotation.tsx
const WORKFLOW_STEPPER_STEPS = [
  { key: "artwork", label: "ตรวจสอบ Artwork" },
  { key: "cnc", label: "ตรวจสอบงาน CNC" },
  { key: "production", label: "ผลิตชิ้นงาน" },
  { key: "color_check", label: "ตรวจสอบลงสี" },
  { key: "lanyard", label: "ตรวจสอบสายคล้อง" },
  { key: "final", label: "ตรวจสอบชิ้นงานก่อนจัดส่ง" },
  { key: "factory_ship", label: "โรงงานส่งออก" },
  { key: "in_transit", label: "ระหว่างขนส่ง" },
  { key: "arrived_th", label: "ถึงไทย" },
  { key: "warehouse_to_store", label: "ส่งจากโกดัง → ร้าน" },
  { key: "store_qc", label: "ตรวจนับ & QC ที่ร้าน" },
  { key: "delivery_success", label: "จัดส่งสำเร็จ" },
];

export function ProductionWorkspace({ order, onBack, onStatusChange, currentUserDepartment = "production" }: ProductionWorkspaceProps) {
  const isFactoryExportOrder = order.status === "โรงงานส่งออก" || !!order.procurementInfo;
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<string>("all");
  
  // Initialize steps data from order.productionWorkflow if available
  const getInitialStepsData = (): Record<string, StepData> => {
    const defaultSteps: Record<string, StepData> = {
      procurement: { status: "in_progress", remark: "", images: [], imagePreviews: [], updatedAt: "", updatedBy: "" },
      assembly: { status: "pending", remark: "", images: [], imagePreviews: [], updatedAt: "", updatedBy: "" },
      ribbon: { status: "pending", remark: "", images: [], imagePreviews: [], updatedAt: "", updatedBy: "" },
      labeling: { status: "pending", remark: "", images: [], imagePreviews: [], updatedAt: "", updatedBy: "" },
      qc: { status: "pending", remark: "", images: [], imagePreviews: [], updatedAt: "", updatedBy: "" },
      packing: { status: "pending", remark: "", images: [], imagePreviews: [], updatedAt: "", updatedBy: "", boxCount: 0 },
      delivery_slip: { status: "pending", remark: "", images: [], imagePreviews: [], updatedAt: "", updatedBy: "" },
      shipping: { status: "pending", remark: "", images: [], imagePreviews: [], updatedAt: "", updatedBy: "", carrierName: "", trackingNumber: "" },
    };

    // If order has productionWorkflow data, use it
    if (order.productionWorkflow) {
      Object.keys(order.productionWorkflow).forEach((key) => {
        const workflowStep = order.productionWorkflow![key];
        if (defaultSteps[key]) {
          defaultSteps[key] = {
            ...defaultSteps[key],
            status: workflowStep.status as "pending" | "in_progress" | "issue" | "complete",
            remark: workflowStep.remark || "",
            updatedAt: workflowStep.updatedAt || "",
            updatedBy: workflowStep.updatedBy || "",
            boxCount: workflowStep.boxCount,
            carrierName: workflowStep.carrierName,
            trackingNumber: workflowStep.trackingNumber,
            imagePreviews: workflowStep.imagePreviews || [],
          };
        }
      });
    }

    return defaultSteps;
  };

  const [stepsData, setStepsData] = useState<Record<string, StepData>>(getInitialStepsData);

  const [currentOrderStatus, setCurrentOrderStatus] = useState(order.status);
  const [deliverySlipOpen, setDeliverySlipOpen] = useState(false);
  const handleStepUpdate = (stepKey: string, data: StepData) => {
    setStepsData((prev) => ({
      ...prev,
      [stepKey]: data,
    }));

    // Auto-advance logic
    if (data.status === "complete") {
      const stepIndex = PRODUCTION_STEPS.findIndex((s) => s.key === stepKey);
      const step = PRODUCTION_STEPS[stepIndex];
      
      // Update main order status
      setCurrentOrderStatus(step.completedStatus);
      onStatusChange(order.id, step.completedStatus);

      // Unlock next step
      if (stepIndex < PRODUCTION_STEPS.length - 1) {
        const nextStepKey = PRODUCTION_STEPS[stepIndex + 1].key;
        setStepsData((prev) => ({
          ...prev,
          [nextStepKey]: { ...prev[nextStepKey], status: "in_progress" },
        }));
      }
    }
  };

  const isStepLocked = (stepKey: string): boolean => {
    const stepIndex = PRODUCTION_STEPS.findIndex((s) => s.key === stepKey);
    if (stepIndex === 0) return false;

    const previousStepKey = PRODUCTION_STEPS[stepIndex - 1].key;
    return stepsData[previousStepKey].status !== "complete";
  };

  const getOverallProgress = (): number => {
    const completedSteps = Object.values(stepsData).filter((s) => s.status === "complete").length;
    return Math.round((completedSteps / PRODUCTION_STEPS.length) * 100);
  };

  // Prepare step data for CircularProgress
  const stepsForProgress = useMemo(() => {
    return PRODUCTION_STEPS.map((step) => ({
      key: step.key,
      title: step.title,
      status: stepsData[step.key].status as "pending" | "in_progress" | "issue" | "complete",
    }));
  }, [stepsData]);

  // Check if order is overdue or urgent
  const isOverdue = useMemo(() => {
    const deliveryDate = new Date(order.deliveryDate);
    const today = new Date();
    return deliveryDate < today;
  }, [order.deliveryDate]);

  const isUrgent = useMemo(() => {
    const deliveryDate = new Date(order.deliveryDate);
    const today = new Date();
    const diffDays = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  }, [order.deliveryDate]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปรายการ
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{order.id}</h2>
                {/* Overdue/Urgent Flags */}
                {isOverdue && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="bg-destructive text-destructive-foreground animate-pulse cursor-help">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        เลยกำหนด
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>งานนี้เลยกำหนดส่งแล้ว! กำหนดส่ง: {order.deliveryDate}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {isUrgent && !isOverdue && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="bg-amber-500 text-white cursor-help">
                        <Clock className="w-3 h-3 mr-1" />
                        ด่วน
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>เหลือเวลาไม่ถึง 3 วัน! กำหนดส่ง: {order.deliveryDate}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-muted-foreground">บันทึกงานผลิต</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Circular Progress with Hover Details */}
            <CircularProgress 
              percentage={getOverallProgress()} 
              steps={stepsForProgress}
            />
            <Badge className="bg-blue-100 text-blue-700 text-sm px-3 py-1">
              สถานะปัจจุบัน: {currentOrderStatus}
            </Badge>
          </div>
        </div>

      {/* Stepper Bar (only for factory export orders) */}
      {isFactoryExportOrder && (
        <Card className="border bg-white">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Factory className="w-4 h-4 text-primary" />
              แถบสถานะการผลิต (Production Progress)
            </h3>

            {/* Stepper */}
            <div className="flex items-start relative overflow-x-auto pb-2">
              {WORKFLOW_STEPPER_STEPS.map((step, index) => {
                const activeIdx = activeWorkflowStep === "all" ? -1 : WORKFLOW_STEPPER_STEPS.findIndex(s => s.key === activeWorkflowStep);
                const isCompleted = activeIdx > index;
                const isActive = activeIdx === index;
                const isPending = activeIdx < index || activeIdx === -1;

                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center relative z-10 flex-1 min-w-[72px] cursor-pointer group"
                    onClick={() => setActiveWorkflowStep(step.key)}
                  >
                    {index > 0 && (
                      <div
                        className={cn(
                          "absolute top-4 right-1/2 w-full h-0.5",
                          isCompleted || isActive ? "bg-green-400" : "bg-muted"
                        )}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all text-xs font-bold",
                        isCompleted && "bg-green-500 border-green-500 text-white",
                        isActive && "bg-amber-500 border-amber-500 text-white animate-pulse",
                        isPending && "bg-muted border-muted-foreground/30 text-muted-foreground",
                        "group-hover:scale-110"
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] mt-1.5 text-center font-medium leading-tight max-w-[80px]",
                        isCompleted && "text-green-600",
                        isActive && "text-amber-600 font-semibold",
                        isPending && "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Current status */}
            <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">สถานะปัจจุบัน:</span>
              <span className="font-semibold text-amber-600">
                {activeWorkflowStep === "all" ? "ทั้งหมด" : WORKFLOW_STEPPER_STEPS.find(s => s.key === activeWorkflowStep)?.label || "-"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto text-xs h-6 px-2 text-muted-foreground hover:text-primary"
                onClick={() => setActiveWorkflowStep("all")}
              >
                ดูทั้งหมด
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 1: Order Reference Info (hidden for factory export orders) */}
      {!isFactoryExportOrder && (
        <OrderReferenceCard order={{ ...order, status: currentOrderStatus }} />
      )}

      {/* Procurement Info Cards (only for factory export orders) */}
      {isFactoryExportOrder && order.procurementInfo && (
        <>
          <ProcurementInfoCards info={order.procurementInfo} />
          {/* Procurement-style shipping status (replaces simple card) */}
          <ProcurementStatusUpdate orderId={order.id} filterStep={activeWorkflowStep} hideSections={["qc", "logistics"]} />
        </>
      )}

      {/* Section 2: Production Steps - 2 Column Dashboard */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">ขั้นตอนการผลิต</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isFactoryExportOrder 
              ? ""
              : "ดำเนินการตามลำดับขั้นตอน เมื่อเสร็จแต่ละขั้นตอนระบบจะอัปเดตสถานะอัตโนมัติ"}
          </p>
        </CardHeader>
       <CardContent className="p-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {(isFactoryExportOrder ? PRODUCTION_STEPS.slice(4) : PRODUCTION_STEPS).map((step, index) => {
              const displayNumber = isFactoryExportOrder ? index + 1 : index + 1;
              
              return (
                <div key={step.key}>
                  <ProductionStepBox
                    stepKey={step.key}
                    stepNumber={displayNumber}
                    title={step.title}
                    icon={step.icon}
                    completedStatus={step.completedStatus}
                    initialData={stepsData[step.key]}
                    isLocked={isStepLocked(step.key)}
                    onUpdate={handleStepUpdate}
                    hasBoxCount={step.hasBoxCount}
                    hasShippingInfo={step.hasShippingInfo}
                    isDeliverySlipStep={step.isDeliverySlipStep}
                    requiresGraphicDepartment={step.requiresGraphicDepartment}
                    currentUserDepartment={currentUserDepartment}
                    onPrintDeliverySlip={step.isDeliverySlipStep ? () => setDeliverySlipOpen(true) : undefined}
                    compact
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
        </Card>

        {/* Delivery Slip Print Dialog */}
        <DeliverySlipPrint
          open={deliverySlipOpen}
          onOpenChange={setDeliverySlipOpen}
          data={{
            jobId: order.id,
            customerName: order.customerName,
            customerAddress: order.address || "-",
            customerPhone: order.phone || order.lineName || "-",
            shippingChannel: order.shippingInfo?.channel || "-",
            shippingDate: order.deliveryDate,
            qcImage: stepsData.qc?.imagePreviews?.[0] || undefined,
            products: order.productDetails.length > 0
              ? order.productDetails.map(p => ({
                  name: p.name || order.product,
                  model: p.model,
                  color: p.color,
                  orderedQty: p.orderedQty,
                }))
              : [{ name: order.product, orderedQty: order.quantity }],
            totalQty: order.productDetails.length > 0
              ? order.productDetails.reduce((sum, p) => sum + p.orderedQty, 0)
              : order.quantity,
          }}
        />
      </div>
    </TooltipProvider>
  );
}
