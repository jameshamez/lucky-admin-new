import { CheckCircle, Circle, Factory, Package, Truck, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductionProgressBarProps {
  currentStatus: string;
}

const steps = [
  { label: "ยืนยันออเดอร์", icon: ClipboardCheck },
  { label: "เตรียมการผลิต", icon: Factory },
  { label: "กำลังผลิต", icon: Package },
  { label: "ระหว่างขนส่ง", icon: Truck },
  { label: "สำเร็จ", icon: CheckCircle },
];

// Map detailed statuses to step index
const getStepIndex = (status: string): number => {
  const statusMap: Record<string, number> = {
    "รอจัดซื้อส่งประเมิน": 0,
    "อยู่ระหว่างการประเมินราคา": 0,
    "ได้รับราคา": 0,
    "เสนอราคาให้ลูกค้า": 0,
    "ลูกค้าอนุมัติราคา": 0,
    "รอกราฟิกปรับไฟล์เพื่อผลิต": 1,
    "กำลังปรับไฟล์ผลิต": 1,
    "ไฟล์ผลิตพร้อมสั่งผลิต": 1,
    "รอจัดซื้อออก PO / สั่งผลิต": 1,
    "สั่งผลิตแล้ว": 1,
    "จัดหา": 1,
    "จัดหาสินค้า": 1,
    "กำลังผลิต": 2,
    "ตรวจสอบ Artwork จากโรงงาน": 2,
    "ตรวจสอบ CNC": 2,
    "อัปเดทปั้มชิ้นงาน": 2,
    "อัปเดตสาย": 2,
    "อัปเดตชิ้นงานก่อนจัดส่ง": 2,
    "ประกอบสินค้า": 2,
    "ผูกโบว์": 2,
    "ติดป้ายจารึก": 2,
    "ติดสติ๊กเกอร์": 2,
    "คล้องสาย": 2,
    "สินค้าประกอบเสร็จ": 2,
    "งานเสร็จสมบูรณ์": 3,
    "อยู่ระหว่างขนส่ง": 3,
    "สินค้ามาส่งที่ร้าน": 4,
  };
  return statusMap[status] ?? 0;
};

const getStatusLabel = (status: string): string => {
  return status;
};

export default function ProductionProgressBar({ currentStatus }: ProductionProgressBarProps) {
  const activeStep = getStepIndex(currentStatus);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Factory className="w-5 h-5 text-primary" />
        แถบสถานะการผลิต (Production Progress)
      </h2>

      {/* Stepper */}
      <div className="flex items-center justify-between relative">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;
          const isPending = index > activeStep;

          return (
            <div key={index} className="flex flex-col items-center relative z-10 flex-1">
              {/* Connector line (before this step) */}
              {index > 0 && (
                <div
                  className={cn(
                    "absolute top-5 right-1/2 w-full h-0.5",
                    isCompleted || isActive ? "bg-green-400" : "bg-muted"
                  )}
                  style={{ zIndex: -1 }}
                />
              )}

              {/* Circle */}
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  isCompleted && "bg-green-500 border-green-500 text-white",
                  isActive && "bg-amber-500 border-amber-500 text-white animate-pulse",
                  isPending && "bg-muted border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-xs mt-2 text-center font-medium",
                  isCompleted && "text-green-600",
                  isActive && "text-amber-600",
                  isPending && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Current status detail */}
      <div className="mt-5 pt-4 border-t flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">สถานะปัจจุบัน:</span>
        <span className="font-semibold text-amber-600">{getStatusLabel(currentStatus)}</span>
      </div>
    </div>
  );
}
