import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Printer, X } from "lucide-react";

interface ProductItem {
  name: string;
  model?: string;
  color?: string;
  orderedQty: number;
}

interface DeliverySlipData {
  jobId: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  shippingChannel: string;
  shippingDate: string;
  products: ProductItem[];
  totalQty: number;
  qcImage?: string;
}

interface DeliverySlipPrintProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DeliverySlipData;
}

export function DeliverySlipPrint({ open, onOpenChange, data }: DeliverySlipPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank", "width=800,height=1100");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>ใบส่งของ - ${data.jobId}</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; font-size: 16px; color: #000; }
          .slip-container { width: 100%; border: 2px solid #000; }
          .row { display: flex; border-bottom: 2px solid #000; }
          .row:last-child { border-bottom: none; }
          .cell { padding: 12px 16px; }
          .cell-left { flex: 1; border-right: 2px solid #000; }
          .cell-right { width: 200px; text-align: center; }
          .header-blue { font-weight: bold; font-size: 20px; color: #0000CC; text-decoration: underline; margin-bottom: 8px; }
          .sender-info { font-size: 16px; line-height: 1.6; }
          .sender-info .company { font-weight: bold; }
          .box-label { font-weight: bold; font-size: 22px; color: #000; padding: 16px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 12px; }
          .box-number-line { font-size: 18px; margin-top: 8px; }
          .product-section { flex: 1; border-right: 2px solid #000; }
          .receiver-section { flex: 1; }
          .receiver-info { font-size: 17px; line-height: 1.7; }
          .receiver-info .name { font-weight: bold; font-size: 18px; }
          .shipping-info { margin-top: 10px; font-size: 16px; line-height: 1.7; }
          .shipping-info .label { font-weight: bold; }
          .shipping-conditions { color: #0000CC; font-size: 15px; margin-top: 4px; }
          .warning-section { text-align: center; padding: 16px; }
          .warning-text { font-weight: bold; color: #CC0000; font-size: 28px; }
          .product-table { width: 100%; border-collapse: collapse; }
          .product-table th, .product-table td { border: 1px solid #000; padding: 8px 12px; text-align: left; font-size: 15px; }
          .product-table th { background: #f0f0f0; font-weight: bold; }
          .product-table td.qty { text-align: center; }
          .total-row { font-weight: bold; background: #f5f5f5; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const today = new Date();
  const formattedDate = data.shippingDate || today.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            ตัวอย่างใบส่งของ - {data.jobId}
          </DialogTitle>
        </DialogHeader>

        {/* Print Preview Area */}
        <div className="border rounded-lg p-4 bg-white">
          <div ref={printRef}>
            <div style={{ width: "100%", border: "2px solid #000", fontFamily: "'Sarabun', sans-serif", color: "#000" }}>
              {/* Row 1: Sender + Box Number */}
              <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
                {/* Sender */}
                <div style={{ flex: 1, padding: "12px 16px", borderRight: "2px solid #000" }}>
                  <div style={{ fontWeight: "bold", fontSize: "18px", color: "#0000CC", textDecoration: "underline", marginBottom: "8px" }}>
                    ชื่อ-ที่อยู่ผู้ส่ง
                  </div>
                  <div style={{ fontSize: "15px", lineHeight: 1.6 }}>
                    <div style={{ fontWeight: "bold" }}>บริษัท ลัคกี้ พรีเมี่ยม แอนด์ ดีไซน์ จำกัด</div>
                    <div>34/39 หมู่ 1 ต.บ้านใหม่ อ.เมือง จ.</div>
                    <div>ปทุมธานี 12000</div>
                    <div>โทร. 082-515-9596</div>
                  </div>
                </div>
                {/* Box Number */}
                <div style={{ width: "200px", padding: "16px", textAlign: "center" }}>
                  <div style={{ fontWeight: "bold", fontSize: "20px", background: "#FFFF00", display: "inline-block", padding: "2px 12px" }}>
                    กล่องที
                  </div>
                  <div style={{ marginTop: "20px", fontSize: "18px" }}>
                    _____ / _____
                  </div>
                </div>
              </div>

              {/* Row 2: Products + Receiver */}
              <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
                {/* Product List */}
                <div style={{ flex: 1, padding: "12px 16px", borderRight: "2px solid #000" }}>
                  <div style={{ fontWeight: "bold", fontSize: "18px", color: "#0000CC", textDecoration: "underline", marginBottom: "8px" }}>
                    รายการชิ้นงาน
                  </div>
                  {data.qcImage ? (
                    <div style={{ textAlign: "center" }}>
                      <img src={data.qcImage} alt="QC Photo" style={{ maxWidth: "100%", maxHeight: "280px", objectFit: "contain", border: "1px solid #ccc", borderRadius: "4px" }} />
                    </div>
                  ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                      <thead>
                        <tr>
                          <th style={{ border: "1px solid #000", padding: "6px 10px", textAlign: "left", background: "#f0f0f0" }}>ลำดับ</th>
                          <th style={{ border: "1px solid #000", padding: "6px 10px", textAlign: "left", background: "#f0f0f0" }}>รายการสินค้า</th>
                          <th style={{ border: "1px solid #000", padding: "6px 10px", textAlign: "left", background: "#f0f0f0" }}>สี/รุ่น</th>
                          <th style={{ border: "1px solid #000", padding: "6px 10px", textAlign: "center", background: "#f0f0f0" }}>จำนวน</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.products.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ border: "1px solid #000", padding: "6px 10px" }}>{idx + 1}</td>
                            <td style={{ border: "1px solid #000", padding: "6px 10px" }}>{item.name}</td>
                            <td style={{ border: "1px solid #000", padding: "6px 10px" }}>
                              {[item.color, item.model].filter(Boolean).join(" / ") || "-"}
                            </td>
                            <td style={{ border: "1px solid #000", padding: "6px 10px", textAlign: "center" }}>{item.orderedQty}</td>
                          </tr>
                        ))}
                        <tr style={{ fontWeight: "bold", background: "#f5f5f5" }}>
                          <td colSpan={3} style={{ border: "1px solid #000", padding: "6px 10px", textAlign: "right" }}>รวมทั้งหมด</td>
                          <td style={{ border: "1px solid #000", padding: "6px 10px", textAlign: "center" }}>{data.totalQty}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Receiver */}
                <div style={{ flex: 1, padding: "12px 16px" }}>
                  <div style={{ fontWeight: "bold", fontSize: "18px", color: "#0000CC", textDecoration: "underline", marginBottom: "8px" }}>
                    ชื่อและที่อยู่ผู้รับ
                  </div>
                  <div style={{ fontSize: "16px", lineHeight: 1.7 }}>
                    <div style={{ fontWeight: "bold", fontSize: "17px" }}>{data.customerName}</div>
                    <div>{data.customerAddress}</div>
                    <div>โทร {data.customerPhone}</div>
                  </div>
                  <div style={{ marginTop: "12px", fontSize: "15px", lineHeight: 1.7 }}>
                    <div><span style={{ fontWeight: "bold" }}>จัดส่งโดย</span> {data.shippingChannel}</div>
                    <div><span style={{ fontWeight: "bold" }}>วันที่</span> {formattedDate}</div>
                    <div style={{ color: "#0000CC", marginTop: "4px" }}>เงื่อนไขการจัดส่ง</div>
                  </div>
                </div>
              </div>

              {/* Row 3: Warning */}
              <div style={{ textAlign: "center", padding: "16px" }}>
                <div style={{ fontWeight: "bold", color: "#CC0000", fontSize: "26px" }}>
                  ระวังสินค้าแตกเสียหาย ห้ามโยนหรือกระแทก
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-1" />
            ปิด
          </Button>
          <Button variant="destructive" onClick={handlePrint} className="font-bold">
            <Printer className="w-4 h-4 mr-1.5" />
            พิมพ์ใบส่งของ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
