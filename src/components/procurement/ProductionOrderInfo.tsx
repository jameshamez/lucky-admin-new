import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";

// Interface for order & shipping data
export interface OrderShippingData {
  orderer: string;
  poNumber: string;
  shipDate: string;
  splitQuantity: string;
  totalSales: number;
  vat: number;
  shippingChannel: string;
  shippingCostRMB: number;
  exchangeRate: number;
  shippingCostTHB: number;
}

interface ProductionOrderInfoProps {
  data: OrderShippingData;
  mode?: "readonly" | "editable";
}

const shippingChannelLabels: Record<string, string> = {
  EK: "EK",
  SEA: "SEA",
  AIR: "AIR"
};

export function ProductionOrderInfoReadOnly({ data }: { data: OrderShippingData }) {
  return (
    <div className="space-y-6">
      {/* ข้อมูลออเดอร์และการจัดส่ง */}
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            ข้อมูลออเดอร์และการจัดส่ง
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ผู้สั่งงาน</p>
              <p className="text-base">{data.orderer || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ใบสั่งซื้อ (PO)</p>
              <p className="text-base">{data.poNumber || "-"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">วันที่จัดส่งออก</p>
              <p className="text-base">{data.shipDate || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">จำนวนแยก (ถ้ามี)</p>
              <p className="text-base">{data.splitQuantity || "-"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* สรุปการเงิน */}
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">สรุปการเงิน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">รวมยอดขาย (THB)</p>
              <p className="text-base">{data.totalSales?.toLocaleString() || "0"} บาท</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ภาษีมูลค่าเพิ่ม VAT</p>
              <p className="text-base">{data.vat || 0}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* รายละเอียดขนส่ง */}
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">รายละเอียดขนส่ง</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ช่องทางการจัดส่ง</p>
              <p className="text-base">{shippingChannelLabels[data.shippingChannel] || "-"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ค่าขนส่ง (RMB)</p>
              <p className="text-base">{data.shippingCostRMB?.toLocaleString() || "0"} RMB</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">อัตราแลกเปลี่ยน (EXC)</p>
              <p className="text-base">{data.exchangeRate || 5.5}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ค่าขนส่ง (THB)</p>
              <p className="text-base font-semibold text-primary">{data.shippingCostTHB?.toLocaleString() || "0"} บาท</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductionOrderInfoReadOnly;
