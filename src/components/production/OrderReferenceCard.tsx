import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Building2, Phone, Calendar, Package, FileText, CreditCard, Truck, Tag, Ribbon } from "lucide-react";

interface ProductDetail {
  name: string;
  model?: string;
  color?: string;
  orderedQty: number;
  countedQty: number;
}

interface PaymentInfo {
  status: "full" | "deposit";
  amount: number;
  proof?: string;
  bank: string;
  receivedDate: string;
  netTotal: number;
}

interface ShippingInfo {
  province: string;
  channel: string;
  shippingFee: number;
  usageDate: string;
  pickupDate?: string;
  pickupTime?: string;
}

interface OrderReferenceCardProps {
  order: Order;
  onShippingFeeChange?: (newFee: number) => void;
}

interface EngravingInfo {
  accepted: boolean;
  graphicStaff?: string;
  status?: string;
  statusDate?: string;
}

interface RibbonInfo {
  accepted: boolean;
  color?: string;
  number?: string;
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
  paymentInfo?: PaymentInfo;
  shippingInfo?: ShippingInfo;
  engravingInfo?: EngravingInfo;
  ribbonInfo?: RibbonInfo;
}

import { Input } from "@/components/ui/input";
import { useState } from "react";

export function OrderReferenceCard({ order, onShippingFeeChange }: OrderReferenceCardProps) {
  const [shippingFee, setShippingFee] = useState(order.shippingInfo?.shippingFee || 0);

  const handleShippingFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFee = parseFloat(e.target.value) || 0;
    setShippingFee(newFee);
    onShippingFeeChange?.(newFee);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      "รอผลิต": "bg-gray-100 text-gray-700",
      "กำลังผลิต": "bg-blue-100 text-blue-700",
      "พร้อมจัดส่ง": "bg-orange-100 text-orange-700",
      "จัดส่งแล้ว": "bg-green-100 text-green-700",
      "รอประกอบ": "bg-yellow-100 text-yellow-700",
      "รอผูกโบว์": "bg-purple-100 text-purple-700",
      "รอติดป้ายจารึก": "bg-indigo-100 text-indigo-700",
      "ประกอบเสร็จ": "bg-green-100 text-green-700",
    };
    return <Badge className={config[status] || "bg-gray-100 text-gray-700"}>{status}</Badge>;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            ข้อมูลอ้างอิงคำสั่งผลิต
          </CardTitle>
          {getStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Job Info Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Job ID</p>
            <p className="font-semibold text-lg">{order.id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">ใบเสนอราคา</p>
            <p className="font-medium">{order.quotation}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">วันที่สั่ง</p>
            <p className="font-medium">{order.orderDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase">กำหนดส่ง</p>
            <p className="font-medium text-destructive">{order.deliveryDate}</p>
          </div>
        </div>

        <Separator />

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4" />
              ข้อมูลลูกค้า
            </h4>
            <div className="pl-6 space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">LINE: {order.lineName}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              ผู้รับผิดชอบ
            </h4>
            <div className="pl-6 space-y-2">
              <div>
                <span className="text-xs text-muted-foreground">พนักงานขาย: </span>
                <span>{order.responsiblePerson}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">กราฟิก: </span>
                <span>{order.graphicDesigner}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">พนักงานผลิต: </span>
                <span className="font-medium text-primary">{order.assignedEmployee}</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Info - 2 Column Grid Layout */}
        {order.paymentInfo && (
          <>
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4" />
                ข้อมูลการชำระเงิน
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                {/* Left Column - Main Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">สถานะชำระเงิน</p>
                    <Badge className={order.paymentInfo.status === "full" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                      {order.paymentInfo.status === "full" ? "เต็มจำนวน" : "มัดจำ"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">ธนาคาร</p>
                    <p className="font-medium">{order.paymentInfo.bank}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">วันที่รับยอด</p>
                    <p className="font-medium">{order.paymentInfo.receivedDate}</p>
                  </div>
                </div>

                {/* Right Column - Summary & Proof */}
                <div className="space-y-4 md:border-l md:pl-4 border-border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">รวมยอดสุทธิ</p>
                    <p className="font-bold text-xl text-foreground">{order.paymentInfo.netTotal.toLocaleString()} บาท</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">
                      {order.paymentInfo.status === "full" ? "ยอดชำระแล้ว" : "ยอดมัดจำ"}
                    </p>
                    <p className="font-medium text-green-600">{order.paymentInfo.amount.toLocaleString()} บาท</p>
                  </div>
                  {/* Outstanding Amount - Only show for Deposit */}
                  {order.paymentInfo.status === "deposit" && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-600 uppercase mb-1">ยอดค้างชำระ</p>
                      <p className="font-bold text-lg text-red-600">
                        {(order.paymentInfo.netTotal - order.paymentInfo.amount).toLocaleString()} บาท
                      </p>
                    </div>
                  )}
                  {/* Paid in Full Indicator */}
                  {order.paymentInfo.status === "full" && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-600 uppercase mb-1">คงเหลือ</p>
                      <p className="font-bold text-lg text-green-600">0 บาท</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">หลักฐานชำระเงิน</p>
                    {order.paymentInfo.proof ? (
                      <a href={order.paymentInfo.proof} target="_blank" rel="noopener noreferrer" className="text-primary underline text-sm font-medium hover:text-primary/80">
                        ดูหลักฐาน
                      </a>
                    ) : (
                      <p className="text-muted-foreground text-sm">-</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Shipping Info */}
        {order.shippingInfo && (
          <>
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2 text-sm">
                <Truck className="h-4 w-4" />
                ข้อมูลการจัดส่ง
              </h4>
              {order.shippingInfo.channel === "มารับเอง" ? (
                /* Self-Pickup Layout */
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">ช่องทางจัดส่ง</p>
                    <p className="font-medium">{order.shippingInfo.channel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">วันที่นัดรับ</p>
                    <p className="font-medium">{order.shippingInfo.pickupDate || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">เวลาที่นัดรับ</p>
                    <p className="font-medium">{order.shippingInfo.pickupTime || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">วันที่ใช้งาน</p>
                    <p className="font-medium">{order.shippingInfo.usageDate}</p>
                  </div>
                </div>
              ) : (
                /* Delivery Layout */
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">จังหวัดที่จัดส่ง</p>
                    <p className="font-medium">{order.shippingInfo.province}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ช่องทางจัดส่ง</p>
                    <p className="font-medium">{order.shippingInfo.channel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ค่าขนส่ง</p>
                    <Input
                      type="number"
                      value={shippingFee}
                      onChange={handleShippingFeeChange}
                      className="w-32 h-8 text-sm font-medium"
                      min={0}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">วันที่ใช้งาน</p>
                    <p className="font-medium">{order.shippingInfo.usageDate}</p>
                  </div>
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Product Info */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2 text-sm">
            <Package className="h-4 w-4" />
            รายละเอียดสินค้า
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">ประเภทงาน</p>
              <Badge variant="outline">{order.jobType}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">สินค้า</p>
              <p className="font-medium">{order.product}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">จำนวนทั้งหมด</p>
              <p className="font-semibold text-lg">{order.quantity.toLocaleString()} ชิ้น</p>
            </div>
          </div>

          {/* Engraving & Ribbon Info - Full Width */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <h5 className="font-semibold text-sm">ป้ายจารึก</h5>
                {order.engravingInfo?.accepted ? (
                  <Badge className="bg-green-100 text-green-700">รับ</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700">ไม่รับ</Badge>
                )}
              </div>
              {order.engravingInfo?.accepted ? (
                <div className="space-y-2 pl-6">
                  <div>
                    <span className="text-xs text-muted-foreground">พนักงานกราฟิก: </span>
                    <span className="font-medium">{order.engravingInfo.graphicStaff || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">สถานะ: </span>
                    <Badge variant="outline" className="ml-1">{order.engravingInfo.status || "-"}</Badge>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">วันที่: </span>
                    <span className="font-medium">{order.engravingInfo.statusDate || "-"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground pl-6">ไม่รับป้ายจารึก</p>
              )}
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Ribbon className="h-4 w-4 text-muted-foreground" />
                <h5 className="font-semibold text-sm">โบว์</h5>
                {order.ribbonInfo?.accepted ? (
                  <Badge className="bg-green-100 text-green-700">รับ</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-700">ไม่รับ</Badge>
                )}
              </div>
              {order.ribbonInfo?.accepted ? (
                <div className="space-y-2 pl-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">สีโบว์: </span>
                    <div 
                      className="w-6 h-6 rounded-full border shadow-sm" 
                      style={{ backgroundColor: order.ribbonInfo.color || "#ccc" }}
                      title={order.ribbonInfo.color}
                    />
                    <span className="font-medium">{order.ribbonInfo.color || "-"}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">เบอร์โบว์: </span>
                    <span className="font-medium">{order.ribbonInfo.number || "-"}</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground pl-6">ไม่รับโบว์</p>
              )}
            </div>
          </div>

          {/* Product Details Table with Zebra Stripes and Thumbnails - Full Width */}
          {order.productDetails && order.productDetails.length > 0 && (
            <div className="mt-4 w-full">
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-destructive">
                    <tr>
                      <th className="w-20 text-center p-3 font-medium text-destructive-foreground">ลำดับ</th>
                      <th className="w-20 text-center p-3 font-medium text-destructive-foreground">รูป</th>
                      <th className="text-center p-3 font-medium text-destructive-foreground">รุ่น</th>
                      <th className="w-32 text-center p-3 font-medium text-destructive-foreground">สี</th>
                      <th className="w-32 text-center p-3 font-medium text-destructive-foreground">จำนวนที่สั่ง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.productDetails.map((detail, index) => (
                      <tr 
                        key={index} 
                        className={`border-t border-border ${index % 2 === 0 ? "bg-background" : "bg-muted/30"}`}
                      >
                        <td className="p-3 text-center text-muted-foreground">{index + 1}</td>
                        <td className="p-2 text-center">
                          <div className="w-12 h-12 mx-auto rounded border bg-muted/50 flex items-center justify-center overflow-hidden">
                            {(detail as any).thumbnail ? (
                              <img 
                                src={(detail as any).thumbnail} 
                                alt={detail.model || detail.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center">{detail.model || detail.name}</td>
                        <td className="p-3 text-center">{detail.color || "-"}</td>
                        <td className="p-3 text-center font-bold text-foreground">{detail.orderedQty.toLocaleString()}</td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="border-t-2 border-border bg-muted">
                      <td className="p-3 font-bold text-left" colSpan={4}>รวมทั้งหมด</td>
                      <td className="p-3 text-center font-bold text-foreground">
                        {order.productDetails.reduce((sum, detail) => sum + detail.orderedQty, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
