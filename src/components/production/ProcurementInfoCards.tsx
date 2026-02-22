import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileImage } from "lucide-react";
import sampleArtwork from "@/assets/sample-artwork.png";

export interface ProcurementJobInfo {
  jobCode: string;
  jobName: string;
  customerName: string;
  salesPerson: string;
  material: string;
  size: string;
  thickness: string;
  colors: string[];
  frontDetails: string;
  backDetails: string;
  lanyardSize: string;
  lanyardPatterns: number;
  quantity: number;
  customerBudget: number;
  eventDate: string;
  notes?: string;
  artworkImages?: string[];
  factoryLabel: string;
  totalSellingPrice: number;
  profit: number;
  // Shipping
  shippingChannel?: string; // EK, SEA, AIR
  shippingCostRMB?: number;
  exchangeRate?: number;
  shippingCostTHB?: number;
  poNumber?: string;
  shipDate?: string;
}

interface ProcurementInfoCardsProps {
  info: ProcurementJobInfo;
}

const colorDisplayMap: Record<string, string> = {
  "shinny gold (สีทองเงา)": "Gold (ทอง)",
  "shinny silver (สีเงินเงา)": "Silver (เงิน)",
  "shinny copper (สีทองแดงเงา)": "Copper (ทองแดง)",
};

export function ProcurementInfoCards({ info }: ProcurementInfoCardsProps) {
  return (
    <div className="space-y-4">
      {/* Card 1: รายละเอียดงาน */}
      <Card className="border-2 border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <FileImage className="w-5 h-5" />
            รายละเอียดงาน (จากฝ่ายจัดซื้อ)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">JOB ID</p>
              <p className="font-mono font-semibold text-primary">{info.jobCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ชื่องาน</p>
              <p className="font-medium">{info.jobName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ลูกค้า</p>
              <p className="font-medium">{info.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">พนักงานขาย</p>
              <p className="font-medium">{info.salesPerson}</p>
            </div>
          </div>

          <Separator />

          {/* Product Specs */}
          <div>
            <p className="text-sm text-muted-foreground">วัสดุ</p>
            <p className="font-medium">{info.material}</p>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold text-primary mb-4">รายละเอียดสำหรับประเมินราคา</h4>
            
            <div className="grid grid-cols-2 gap-8 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">ขนาด</p>
                <p className="font-medium">{info.size}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ความหนา</p>
                <p className="font-medium">{info.thickness}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">ชนิดการชุบ (Finish)</p>
              <Badge variant="outline" className="text-sm">Shiny (เงา)</Badge>
            </div>

            {/* Colors Table */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">สีและจำนวน</p>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-left">สี</TableHead>
                      <TableHead className="text-right">จำนวน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {info.colors.map((color, idx) => {
                      const qty = Math.ceil(info.quantity / info.colors.length);
                      return (
                        <TableRow key={idx}>
                          <TableCell>{colorDisplayMap[color] || color}</TableCell>
                          <TableCell className="text-right">{qty.toLocaleString()} ชิ้น</TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>รวม</TableCell>
                      <TableCell className="text-right font-semibold">{info.quantity.toLocaleString()} ชิ้น</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Front/Back Details */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">รายละเอียดด้านหน้า</p>
              <div className="flex gap-2 flex-wrap">
                {info.frontDetails.split(", ").map((detail, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm">{detail}</Badge>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">รายละเอียดด้านหลัง</p>
              <div className="flex gap-2 flex-wrap">
                {info.backDetails.split(", ").map((detail, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm">{detail}</Badge>
                ))}
              </div>
            </div>

            {/* Lanyard */}
            <div className="grid grid-cols-2 gap-8 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">ขนาดสายคล้องคอ</p>
                <p className="font-medium">{info.lanyardSize.replace("x", " × ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">จำนวนลาย</p>
                <p className="font-medium">{info.lanyardPatterns} ลาย</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Artwork */}
          <div>
            <p className="text-sm text-muted-foreground mb-3 font-medium">ข้อมูล Artwork</p>
            <div className="w-full bg-muted rounded-lg p-4 flex items-center justify-center min-h-[150px] max-h-[250px]">
              <img
                src={info.artworkImages?.[0] || sampleArtwork}
                alt="Artwork preview"
                className="max-w-full max-h-[220px] object-contain"
              />
            </div>
          </div>

          {/* Factory Info */}
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">โรงงาน</p>
              <p className="font-semibold text-green-700 text-lg">{info.factoryLabel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">จำนวนรวม</p>
              <p className="font-semibold text-lg">{info.quantity.toLocaleString()} ชิ้น</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ราคาขายรวม</p>
              <p className="font-bold text-green-600 text-xl">{info.totalSellingPrice.toLocaleString()} บาท</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">กำไรประมาณการ</p>
              <p className="font-semibold text-blue-600 text-lg">{info.profit.toLocaleString()} บาท</p>
            </div>
          </div>

          {info.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">หมายเหตุ</p>
                <p className="font-medium bg-yellow-50 p-3 rounded-lg border border-yellow-200">{info.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
