import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface QuotationHistoryItem {
  id: string;
  factory: string;
  productColor?: string;
  productSize?: string;
  thickness?: string;
  quantity: string;
  totalCost: number;
  totalSellingPrice: number;
  totalProfit: number;
  moldCost?: string;
  submittedAt: string;
  jobCode: string;
}

const API_BASE = "https://nacres.co.th/api-lucky/admin";

const QuotationHistory = () => {
  const [history, setHistory] = useState<QuotationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationHistoryItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/price_estimations.php`)
      .then((res) => res.json())
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((json: any) => {
        if (json.status !== "success" || !Array.isArray(json.data)) return;

        const mapped: QuotationHistoryItem[] = json.data
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let detailObj: any = {};
            try {
              detailObj = typeof item.details === "string" ? JSON.parse(item.details) : (item.details || {});
            } catch {
              detailObj = {};
            }
            const winnerFactory = detailObj?.winnerFactoryValue || item.factory || "";
            const status = String(item.status || "").trim();
            const isCompleted = status === "ยืนยันเรียบร้อย" || status === "รายการสั่งผลิต" || status === "4" || status === "5";
            if (!isCompleted || !winnerFactory) return null;

            const colors: string[] = Array.isArray(detailObj?.colors)
              ? detailObj.colors
              : (detailObj?.colors ? [detailObj.colors] : []);

            return {
              id: String(item.id),
              factory: winnerFactory,
              productColor: colors.join(", ") || undefined,
              productSize: detailObj?.size || undefined,
              thickness: detailObj?.thickness || undefined,
              quantity: String(item.quantity || 0),
              // totalCost / totalSellingPrice ที่บันทึกไว้เป็นยอดรวมแล้ว (ไม่ใช่ต่อหน่วย)
              totalCost: Number(detailObj?.totalCost) || 0,
              totalSellingPrice: Number(item.price) || 0,
              totalProfit: Number(detailObj?.profit) || 0,
              moldCost: undefined,
              submittedAt: item.estimation_date || new Date().toISOString(),
              jobCode: item.estimate_id || `JOB-${item.id}`,
            };
          })
          .filter((item: QuotationHistoryItem | null): item is QuotationHistoryItem => item !== null);

        setHistory(mapped);
      })
      .finally(() => setLoading(false));
  }, []);

  const factoryLabels: { [key: string]: string } = {
    china_bc: "China B&C",
    china_linda: "China LINDA",
    china_pn: "China PN",
    premium_bangkok: "บริษัท พรีเมี่ยมแบงค์ค็อก จำกัด",
    thai_solid: "ไทย Solid",
  };

  const getFactoryLabel = (value: string) => factoryLabels[value] || value;

  const calculateMoldExtra = (moldCost?: string) => {
    return moldCost ? (parseFloat(moldCost) * 0.1).toFixed(2) : "0.00";
  };

  const handleViewDetails = (item: QuotationHistoryItem) => {
    setSelectedQuotation(item);
    setShowDetailModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">ประวัติการขอราคา</h1>
          <p className="text-muted-foreground mt-1">รายการใบเสนอราคาที่ส่งไปแล้ว</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          ส่งออกรายงาน
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการทั้งหมด ({history.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>รูปภาพ</TableHead>
                  <TableHead>สีชุบ</TableHead>
                  <TableHead>ขนาด cm/inch</TableHead>
                  <TableHead>ความหนา mm</TableHead>
                  <TableHead>จำนวนสายคล้องแนม</TableHead>
                  <TableHead>จำนวน ชิ้น</TableHead>
                  <TableHead>ทบรวม THB</TableHead>
                  <TableHead>ราคายรวม THB</TableHead>
                  <TableHead>กำไร THB</TableHead>
                  <TableHead>ค่าโมล THB</TableHead>
                  <TableHead>ค่าโมลเพิ่มเติม THB</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                      กำลังโหลดข้อมูล...
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                      ยังไม่มีประวัติการขอราคา
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {getFactoryLabel(item.factory)}
                      </TableCell>
                      <TableCell>
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          ไม่มีรูป
                        </div>
                      </TableCell>
                      <TableCell>{item.productColor || "-"}</TableCell>
                      <TableCell>{item.productSize || "-"}</TableCell>
                      <TableCell>{item.thickness || "-"}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>{parseFloat(item.quantity).toLocaleString()}</TableCell>
                      <TableCell className="font-semibold">
                        {item.totalCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {item.totalSellingPrice.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.totalProfit >= 0 ? "default" : "destructive"}>
                          {item.totalProfit.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.moldCost || "0.00"}</TableCell>
                      <TableCell>{calculateMoldExtra(item.moldCost)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewDetails(item)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">รายละเอียดการขอราคา</DialogTitle>
          </DialogHeader>
          
          {selectedQuotation && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">ข้อมูลโรงงาน</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-medium">{getFactoryLabel(selectedQuotation.factory)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Job Code</p>
                    <p className="font-medium">{selectedQuotation.jobCode}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">ข้อมูลสินค้า</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">สีชุบ</p>
                    <p className="font-medium">{selectedQuotation.productColor || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ขนาด (cm/inch)</p>
                    <p className="font-medium">{selectedQuotation.productSize || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ความหนา (mm)</p>
                    <p className="font-medium">{selectedQuotation.thickness || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">จำนวน (ชิ้น)</p>
                    <p className="font-medium">{parseFloat(selectedQuotation.quantity).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">ข้อมูลต้นทุนและราคา</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ทุนต่อหน่วย (THB)</p>
                    <p className="font-medium">
                      {(selectedQuotation.totalCost / (parseFloat(selectedQuotation.quantity) || 1)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ราคาขายต่อหน่วย (THB)</p>
                    <p className="font-medium">
                      {(selectedQuotation.totalSellingPrice / (parseFloat(selectedQuotation.quantity) || 1)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ทุนรวม (THB)</p>
                    <p className="font-medium text-lg">
                      {selectedQuotation.totalCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ราคาขายรวม (THB)</p>
                    <p className="font-medium text-lg">
                      {selectedQuotation.totalSellingPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">กำไรและค่าโมล</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">กำไรรวม (THB)</p>
                    <p className={`font-bold text-2xl ${selectedQuotation.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedQuotation.totalProfit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">เปอร์เซ็นต์กำไร</p>
                    <p className={`font-bold text-2xl ${selectedQuotation.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedQuotation.totalSellingPrice > 0
                        ? ((selectedQuotation.totalProfit / selectedQuotation.totalSellingPrice) * 100).toFixed(2)
                        : "0.00"}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ค่าโมล (THB)</p>
                    <p className="font-medium">{selectedQuotation.moldCost || "0.00"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ค่าโมลเพิ่มเติม 10% (THB)</p>
                    <p className="font-medium">{calculateMoldExtra(selectedQuotation.moldCost)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-3">ข้อมูลการส่ง</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">วันที่ส่งใบเสนอราคา</p>
                    <p className="font-medium">
                      {new Date(selectedQuotation.submittedAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuotationHistory;
