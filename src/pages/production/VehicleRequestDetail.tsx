import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, Check, X, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { productionService } from "@/services/productionService";
import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleRequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [request, setRequest] = useState<any>(location.state?.request || null);
  const [loading, setLoading] = useState(!request);

  useEffect(() => {
    if (!request) {
      const fetchRequest = async () => {
        try {
          const res = await productionService.getVehicleReservations();
          if (res.status === "success") {
            const foundReq = res.data.find((r: any) => String(r.id) === id);
            if (foundReq) {
              setRequest(foundReq);
            } else {
              toast({ title: "ไม่พบข้อมูลคำขอใช้รถ", variant: "destructive" });
              navigate("/production/vehicle-management");
            }
          }
        } catch (error) {
          toast({ title: "โหลดข้อมูลไม่สำเร็จ", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      fetchRequest();
    }
  }, [id, request, navigate]);

  const getStatusColor = (s: string) => s === "ไม่อนุมัติ" ? "destructive" as const : "default" as const;

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" className="gap-2 text-muted-foreground"><ArrowLeft className="w-4 h-4" /> กลับ</Button>
        <Card><CardContent className="p-8"><Skeleton className="h-[400px] w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!request) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
        </Button>
        <h1 className="text-2xl font-bold flex-1">รายละเอียดคำขอใช้รถ #{request.id}</h1>
        <Badge variant={getStatusColor(request.status)} className="text-sm px-3 py-1">{request.status}</Badge>
      </div>

      <Card className="shadow-sm border-t-4" style={{ borderTopColor: request.status === "ไม่อนุมัติ" ? "#ef4444" : "#1B3A5C" }}>
        <CardHeader className="pb-4 border-b bg-muted/20">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Car className="w-5 h-5 text-[#1B3A5C]" /> ข้อมูลการจัดส่งและสินค้า
              </CardTitle>
              <CardDescription className="mt-1">รายละเอียดสำหรับคำขอใช้รถหมายเลข {request.id}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-8" style={{ fontFamily: "Sukhumvit Set, sans-serif" }}>
          {request.status === "ไม่อนุมัติ" && request.reject_reason && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm flex items-start gap-4">
              <div className="bg-red-100 p-2 rounded-full shrink-0 mt-1">
                <X className="w-6 h-6 text-red-700" />
              </div>
              <div>
                <h4 className="text-red-800 font-bold text-lg mb-1">คำขอถูกปฏิเสธ</h4>
                <p className="text-red-700 font-medium text-base whitespace-pre-line">{request.reject_reason}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-base">
            <div className="space-y-1">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">ชื่อลูกค้า (Line)</span>
              <p className="font-medium text-lg text-foreground">{request.customerLineName || request.customer_name || "-"}</p>
            </div>
            
            <div className="space-y-1">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">สินค้า</span>
              <p className="font-medium text-lg text-foreground">{request.product || request.product_detail || "-"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold bg-blue-50 text-blue-800 py-0.5 px-2 rounded-md mb-1 inline-block">ประเภทรถที่ต้องการ</span>
              <p className="font-medium text-lg text-foreground flex items-center gap-2">
                <Car className="w-4 h-4 text-muted-foreground" />
                {request.vehicle_type || "-"}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">วัตถุประสงค์การใช้รถ</span>
              <p className="font-medium text-lg text-foreground">{request.purpose || "-"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">วันที่ส่ง / วันที่คาดหวัง</span>
              <p className="font-medium text-lg text-foreground">
                {request.start_datetime ? new Date(request.start_datetime).toLocaleString("th-TH") : (request.deliveryDate || "-")}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">ผู้ขอเบิก / พนักงานขับรถ</span>
              <p className="font-medium text-lg text-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                {request.requester || request.deliveryBy || "-"}
              </p>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-1 pt-4 border-t">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">สถานที่จัดส่ง</span>
              <div className="bg-muted/10 p-4 rounded-lg mt-2">
                <p className="font-bold text-lg text-[#1B3A5C] mb-1">{request.deliveryLocation || request.delivery_location || "-"}</p>
                <p className="text-foreground whitespace-pre-line text-base">{request.address || "-"}</p>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-1">
              <span className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">หมายเหตุ / เอกสารเพิ่มเติม</span>
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg mt-2 min-h-[80px]">
                <p className="text-foreground whitespace-pre-line text-base">{request.notes || "-"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
