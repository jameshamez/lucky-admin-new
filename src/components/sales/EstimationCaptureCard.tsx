import { useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon, Copy, FileText } from "lucide-react";
import { toast } from "sonner";
import sampleArtwork from "@/assets/sample-artwork.png";

interface EstimationCaptureData {
  estimateId: string;
  productType: string;
  material: string;
  size: string;
  thickness: string;
  finish: string;
  totalQuantity: number;
  designCount: number;
  medalPrice: number;
  strapPrice: number;
  totalPrice: number;
  artworkUrl?: string;
  lineName?: string;
  jobName?: string;
  frontDetails?: string[];
  backDetails?: string[];
  lanyardSize?: string;
  lanyardPatterns?: string | number;
  eventDate?: string;
}

interface EstimationCaptureCardProps {
  data: EstimationCaptureData;
  onClose?: () => void;
}

const parsePositiveInteger = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : undefined;
  }

  if (typeof value !== "string") return undefined;

  const normalized = value.trim().replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return undefined;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
};

export function EstimationCaptureCard({ data, onClose }: EstimationCaptureCardProps) {
  const captureRef = useRef<HTMLDivElement>(null);

  const unitMedalPrice = data.totalQuantity > 0 ? (data.medalPrice / data.totalQuantity) : 0;
  const unitStrapPrice = data.totalQuantity > 0 ? (data.strapPrice / data.totalQuantity) : 0;
  const unitTotalPrice = data.totalQuantity > 0 ? (data.totalPrice / data.totalQuantity) : 0;
  const lanyardPatternCount = parsePositiveInteger(data.lanyardPatterns) ?? parsePositiveInteger(data.designCount) ?? 1;

  const handleCopyText = useCallback(async () => {
    const unitLabel = data.productType.includes("เหรียญ") ? "เหรียญ" : "ชิ้น";
    const frontText = data.frontDetails && data.frontDetails.length > 0 ? data.frontDetails.join(", ") : "-";
    const backText = data.backDetails && data.backDetails.length > 0 ? data.backDetails.join(", ") : "-";
    const lanyardInfo = data.lanyardSize 
      ? `${data.lanyardSize} ( สาย ${lanyardPatternCount} แบบ )`
      : "-";

    const isMedal = data.productType.includes("เหรียญ") || !!data.lanyardSize;
    let priceLines = "";
    if (isMedal && unitMedalPrice > 0) {
      priceLines = `ราคาเหรียญต่อชิ้น : ${unitMedalPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท
ราคาสายต่อชิ้น : ${unitStrapPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท
ราคาเหรียญสายต่อชิ้น : ${unitTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท
ราคารวมทั้งหมด : ${data.totalPrice.toLocaleString()} บาท`;
    } else {
      priceLines = `ราคาต่อชิ้น : ${unitTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท
ราคารวมทั้งหมด : ${data.totalPrice.toLocaleString()} บาท`;
    }

    const text = `ราคา${data.productType}
Line ${data.lineName || "-"}
วัสดุ : ${data.material}
สีชุบ (สีเนื้องาน) : ${data.finish || "-"}
รายละเอียดด้านหน้า : ${frontText}
รายละเอียดด้านหลัง : ${backText}
ขนาด ซม. : ${data.size}
ความหนา มม. : ${data.thickness}
จำนวน ${data.totalQuantity} ${unitLabel}
ขนาดสาย : ${lanyardInfo}
Project ${data.jobName || "-"}
${priceLines}
ใช้งาน ${data.eventDate || "-"}`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success("คัดลอกข้อความเรียบร้อยแล้ว");
    } catch {
      toast.error("ไม่สามารถคัดลอกข้อความได้");
    }
  }, [data, unitMedalPrice, unitStrapPrice, unitTotalPrice, lanyardPatternCount]);

  const handleCopyImage = useCallback(async () => {
    if (!captureRef.current) return;
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error("ไม่สามารถสร้างรูปภาพได้");
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          toast.success("คัดลอกรูปภาพเรียบร้อยแล้ว");
        } catch {
          // Fallback: download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${data.estimateId}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("ดาวน์โหลดรูปภาพเรียบร้อยแล้ว");
        }
      }, "image/png");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการสร้างรูปภาพ");
    }
  }, [data.estimateId]);

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleCopyText} variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          คัดลอกข้อความ
        </Button>
        <Button onClick={handleCopyImage} className="gap-2 bg-red-500 hover:bg-red-600 text-white">
          <Copy className="h-4 w-4" />
          คัดลอกรูปภาพ
        </Button>
      </div>

      {/* Capture area */}
      <div
        ref={captureRef}
        className="bg-white rounded-2xl border shadow-sm p-6 max-w-2xl mx-auto"
        style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-800">
            The Bravo by ลัคกี้ถ้วยรางวัล เสนอราคา
          </h2>
          <div className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg px-3 py-1.5">
            <ImageIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600 font-medium">{data.productType}</span>
          </div>
        </div>

        {/* Product details */}
        <div className="flex gap-5 mb-6">
          {/* Left: Image */}
          <div className="flex-shrink-0 w-[160px]">
            <div className="bg-gray-50 rounded-xl p-3 border">
              <img
                src={data.artworkUrl || sampleArtwork}
                alt="Product"
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
            <div className="mt-2 text-center">
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                Estimate ID: {data.estimateId}
              </Badge>
            </div>
          </div>

          {/* Right: Spec cards */}
          <div className="flex-1 grid grid-cols-3 gap-2.5">
            {[
              { label: "วัสดุ", value: data.material },
              { label: "ขนาด", value: data.size },
              { label: "ความหนา", value: data.thickness },
              { label: "ชนิดการชุบ", value: data.finish },
              { label: "จำนวนรวม", value: `${data.totalQuantity.toLocaleString()} ชิ้น` },
              { label: "จำนวนลาย", value: `${lanyardPatternCount} ลาย`, highlight: true },
            ].map((spec, i) => (
              <div
                key={i}
                className={`rounded-xl border p-2.5 ${
                  spec.highlight
                    ? "bg-orange-50 border-orange-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <p className="text-[10px] text-gray-400 mb-0.5">{spec.label}</p>
                <p className="text-sm font-semibold text-gray-800">{spec.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing table */}
        <div className="mb-5">
          <table className="w-full border-collapse rounded-xl overflow-hidden text-sm">
            <thead>
              <tr>
                <th className="bg-blue-100 text-blue-800 px-4 py-2.5 text-left font-semibold border-r border-white">
                  ราคาเหรียญ (ต่อชิ้น)
                </th>
                <th className="bg-green-100 text-green-800 px-4 py-2.5 text-left font-semibold border-r border-white">
                  ราคาสาย (ต่อชิ้น)
                </th>
                <th className="bg-yellow-100 text-yellow-800 px-4 py-2.5 text-left font-semibold">
                  ราคาเหรียญรวมสาย (ต่อชิ้น)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="px-4 py-3 text-gray-700 font-medium bg-blue-50/50 border-r border-gray-100">
                  {unitMedalPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท
                </td>
                <td className="px-4 py-3 text-gray-700 font-medium bg-green-50/50 border-r border-gray-100">
                  {unitStrapPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท
                </td>
                <td className="px-4 py-3 text-gray-800 font-bold bg-yellow-50/50">
                  {unitTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} บาท
                </td>
              </tr>
            </tbody>
          </table>

          {/* ราคารวมทั้งหมด (Total Price) */}
          <div className="mt-3 flex justify-end">
            <div className="bg-red-50/85 border border-red-200 rounded-xl px-5 py-2 text-right min-w-[200px]">
              <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider block mb-0.5">
                ราคารวมทั้งหมด (Total Price)
              </span>
              <span className="text-xl font-black text-red-600">
                {data.totalPrice.toLocaleString()} <span className="text-xs font-bold text-red-500">บาท</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer notes */}
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-xs font-bold text-gray-700 mb-2">หมายเหตุ</p>
          <ol className="text-[11px] text-gray-500 space-y-1 list-decimal list-inside leading-relaxed">
            <li>ราคาสาย 1 แบบ 8 บาท</li>
            <li>สาย 2 แบบ 10 บาท ราคาบวกเพิ่มแบบละ 2 บาท</li>
            <li>กรณีจำนวนไม่ถึง 300 ชิ้น มีค่าโมลเพิ่มเติม 3,000 บาท</li>
            <li>ราคาข้างต้นเป็นราคาตามสเปคงานที่ระบุมา หากแก้ไขสเปคงาน กรุณาตีราคาใหม่อีกครั้ง</li>
            <li>ราคายังไม่รวมค่าจัดส่ง</li>
            <li>ระยะเวลาผลิตงาน 25-30 วัน</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
