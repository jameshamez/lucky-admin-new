import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageIcon, FileText, User, History, CheckCircle2 } from "lucide-react";
import sampleArtwork from "@/assets/sample-artwork.png";

interface EstimationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimation: {
    id: number;
    date: string;
    lineName: string;
    productType: string;
    quantity: number;
    price: number;
    status: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    jobDescription: string;
    material?: string;
    size?: string;
    eventDate?: string;
    notes?: string;
    // Event info
    eventName?: string;
    eventType?: string;
    eventLocation?: string;
    eventBudget?: number;
    // Artwork info
    artworkStatus?: string;
    designNotes?: string;
    // Additional fields
    salesOwner?: string;
    productCategory?: string;
    hasDesign?: string;
  } | null;
}

export function EstimationDetailDialog({ open, onOpenChange, estimation }: EstimationDetailDialogProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  if (!estimation) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "อนุมัติแล้ว":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "อยู่ระหว่างการประเมินราคา":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "รอจัดซื้อส่งประเมิน":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case "ยกเลิก":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  // Calculate unit price
  const unitPrice = estimation.quantity > 0 ? estimation.price / estimation.quantity : 0;

  // Mock design file data
  const designFile = {
    fileName: "artwork_final_v3.ai",
    uploadDate: "2024-01-18",
    uploadTime: "14:32:15",
    uploadedBy: "สมชาย กราฟิก"
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              รายละเอียดการประเมินราคา #{estimation.id}
              <Badge className={getStatusColor(estimation.status)}>{estimation.status}</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[75vh] pr-4">
            <div className="space-y-4">
              {/* ข้อมูลการจัดงานเบื้องต้น */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base font-semibold text-primary">ข้อมูลการจัดงานเบื้องต้น</CardTitle>
                </CardHeader>
                <CardContent className="py-3 pt-0">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">วันที่ประเมินราคา</p>
                      <p className="font-medium text-sm text-primary">{new Date(estimation.date).toLocaleDateString('th-TH')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">เซลล์ผู้รับผิดชอบ</p>
                      <p className="font-medium text-sm text-primary">{estimation.salesOwner || "พนักงานขาย B"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ชื่องาน</p>
                      <p className="font-medium text-sm text-primary">{estimation.eventName || "งานแข่งขันกีฬาสี"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">วันที่ใช้งาน</p>
                      <p className="font-medium text-sm text-primary">
                        {estimation.eventDate ? new Date(estimation.eventDate).toLocaleDateString('th-TH') : "20/2/2567"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ประเภทสินค้า / สินค้า</p>
                      <p className="font-medium text-sm text-primary">
                        {estimation.productCategory || "สินค้าสั่งผลิต"} {">"} {estimation.productType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ลูกค้ามีแบบแล้วหรือไม่</p>
                      <p className="font-medium text-sm text-primary">{estimation.hasDesign || "มีแบบ"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">วัสดุ</p>
                      <p className="font-medium text-sm text-primary">{estimation.material || "ซิงค์อัลลอย"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">จำนวน</p>
                      <p className="font-medium text-sm text-primary">{estimation.quantity.toLocaleString()} ชิ้น</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">งบประมาณของลูกค้า</p>
                      <p className="font-medium text-sm text-primary">
                        {estimation.eventBudget ? `${estimation.eventBudget.toLocaleString()} บาท` : "35,000 บาท"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ข้อมูล Artwork */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base font-semibold text-primary">ข้อมูล Artwork</CardTitle>
                </CardHeader>
                <CardContent className="py-3 pt-0 space-y-4">
                  {/* Artwork Preview */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">รูป Artwork</p>
                    <button
                      onClick={() => setIsFullscreenOpen(true)}
                      className="w-full bg-muted rounded-lg p-4 flex items-center justify-center min-h-[200px] max-h-[300px] cursor-zoom-in hover:bg-muted/80 transition-colors border"
                    >
                      <img
                        src={sampleArtwork}
                        alt="Artwork preview"
                        className="max-w-full max-h-[260px] object-contain"
                      />
                    </button>
                    <p className="text-xs text-muted-foreground text-center mt-2">คลิกที่รูปเพื่อขยายเต็มจอ</p>
                  </div>

                  {/* Design Files Section */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">ไฟล์งานออกแบบ</p>
                    <div className="bg-muted/50 rounded-lg p-4 border">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{designFile.fileName}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{new Date(designFile.uploadDate).toLocaleDateString('th-TH')} {designFile.uploadTime}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {designFile.uploadedBy}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-1.5"
                        >
                          <History className="h-4 w-4" />
                          ประวัติการอัพโหลด
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* รายละเอียดสำหรับประเมินราคา */}
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base font-semibold text-primary">รายละเอียดสำหรับประเมินราคา</CardTitle>
                </CardHeader>
                <CardContent className="py-3 pt-0">
                  <div>
                    <p className="text-xs text-muted-foreground">หมายเหตุ</p>
                    <p className="font-medium text-sm text-primary">{estimation.notes || estimation.jobDescription || "สำหรับงานแข่งขันกีฬาสี"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* สถานะการประเมินราคา */}
              <Card className="border-2">
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      สถานะการประเมินราคา
                    </CardTitle>
                    <Badge className={cn("text-sm", getStatusColor(estimation.status))}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {estimation.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-4 pt-0">
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">ราคาต่อหน่วย</p>
                      <p className="text-3xl font-bold text-primary">
                        {unitPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        <span className="text-base font-normal text-muted-foreground ml-2">บาท / เหรียญ</span>
                      </p>
                    </div>
                    <div className="flex justify-between items-center border-t pt-3">
                      <span className="text-sm text-muted-foreground">จำนวน</span>
                      <span className="text-sm font-medium">{estimation.quantity.toLocaleString()} เหรียญ</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">ราคารวม</span>
                      <span className="text-2xl font-bold text-green-600">
                        {estimation.price.toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground ml-1">บาท</span>
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-right mt-2">
                    อัปเดตสถานะล่าสุด: {new Date(estimation.date).toLocaleDateString('th-TH')} โดย {estimation.salesOwner || "พนักงานขาย B"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Artwork Dialog */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
          <div className="p-4">
            <img
              src={sampleArtwork}
              alt="Artwork fullscreen"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
