import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Printer, ImageIcon, FileText, X, History, User, Clock, CheckCircle2, CircleDot, Trash2, Factory, Send } from "lucide-react";
import { toast } from "sonner";
import sampleArtwork from "@/assets/sample-artwork.png";

// Color quantity interface
interface ColorQuantity {
  color: string;
  quantity: number;
}

// Interface for design file with upload history
interface DesignFileUpload {
  fileName: string;
  uploadDate: string;
  uploadTime: string;
  uploadedBy: string;
}

export default function PriceEstimationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Mock artwork images - replace with actual data
  const artworkImages = [sampleArtwork];
  const [selectedArtwork, setSelectedArtwork] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [isUploadHistoryOpen, setIsUploadHistoryOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Modal states for approved status actions
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");
  
  const handleDelete = () => {
    // Perform delete action
    toast.success("ลบรายการประเมินราคาเรียบร้อยแล้ว");
    setIsDeleteDialogOpen(false);
    navigate("/sales/price-estimation");
  };

  // Handle revision request submission
  const handleRevisionSubmit = () => {
    if (!revisionNotes.trim()) {
      toast.error("กรุณากรอกเหตุผลในการขอแก้ไขราคา");
      return;
    }
    // Submit revision request - would update status to "รอแก้ไข" and notify procurement
    toast.success("ส่งคำขอแก้ไขราคาเรียบร้อยแล้ว");
    setIsRevisionModalOpen(false);
    setRevisionNotes("");
    // In real implementation, this would update the status and redirect
  };

  // Handle confirm price and navigate to add price estimation with customer data pre-filled
  const handleConfirmPrice = () => {
    if (!estimation) return;
    
    // Navigate to add price estimation page with pre-filled customer data
    navigate('/sales/price-estimation/add', {
      state: {
        fromApprovedEstimation: true,
        customerData: {
          customerName: estimation.customerName,
          customerPhone: estimation.customerPhone,
          customerLineId: estimation.customerLineId,
          customerEmail: estimation.customerEmail,
          customerTags: estimation.customerTags,
        }
      }
    });
  };

  
  // Mock design files upload history - replace with actual data
  const designFileHistory: DesignFileUpload[] = [
    { fileName: "artwork_final_v3.ai", uploadDate: "2024-01-18", uploadTime: "14:32:15", uploadedBy: "สมชาย กราฟิก" },
    { fileName: "artwork_v2.ai", uploadDate: "2024-01-16", uploadTime: "10:15:42", uploadedBy: "สมหญิง ดีไซน์" },
    { fileName: "artwork_draft.ai", uploadDate: "2024-01-14", uploadTime: "09:20:30", uploadedBy: "สมชาย กราฟิก" },
  ];
  
  // Get the latest uploaded file (first item in history)
  const latestDesignFile = designFileHistory.length > 0 ? designFileHistory[0] : null;

  // Mock data - replace with actual data fetching
  const estimations = [
    {
      id: 1,
      status: "อยู่ระหว่างการประเมินราคา",
      // ข้อมูลทั่วไปลูกค้า
      customerName: "บริษัท ABC จำกัด",
      customerPhone: "081-234-5678",
      customerLineId: "customer_line_001",
      customerEmail: "somchai@abc.com",
      customerTags: "ลูกค้าประจำ, องค์กร",
      // ข้อมูลการตีราคา
      estimateDate: "2024-01-15",
      salesOwner: "พนักงานขาย A",
      jobName: "งานวิ่งมาราธอน 2024",
      eventDate: "2024-03-01",
      productCategory: "สินค้าสั่งผลิต",
      productType: "เหรียญสั่งผลิต",
      hasDesign: "มีแบบ",
      material: "ซิงค์อัลลอย",
      // New structure for medal
      finishType: "Shiny (เงา)",
      colorQuantities: [
        { color: "Gold (ทอง)", quantity: 100 },
        { color: "Silver (เงิน)", quantity: 100 },
      ],
      totalQuantity: 200,
      budgetPerPiece: 250,
      // รายละเอียดสำหรับประเมินราคา (เหรียญ)
      medalSize: "5",
      medalThickness: "3",
      frontDetails: ["พิมพ์โลโก้", "แกะสลักข้อความ"],
      backDetails: ["ลงน้ำยาป้องกันสนิม"],
      lanyardSize: "2 × 90 ซม",
      lanyardPatterns: "3",
      // หมายเหตุ
      notes: "ต้องการผลิตภายใน 2 สัปดาห์",
      // ไฟล์แนบ
      attachedFiles: ["design_v1.pdf", "logo.ai"]
    },
    {
      id: 2,
      status: "อนุมัติแล้ว",
      // ข้อมูลทั่วไปลูกค้า
      customerName: "โรงเรียน XYZ",
      customerPhone: "089-876-5432",
      customerLineId: "xyz_school",
      customerEmail: "somying@xyz.ac.th",
      customerTags: "สถานศึกษา",
      // ข้อมูลการตีราคา
      estimateDate: "2024-01-14",
      salesOwner: "พนักงานขาย B",
      jobName: "งานแข่งขันกีฬาสี",
      eventDate: "2024-02-20",
      productCategory: "สินค้าสั่งผลิต",
      productType: "เหรียญสั่งผลิต",
      hasDesign: "มีแบบ",
      material: "ซิงค์อัลลอย",
      // New structure for medal
      finishType: "Shiny (เงา)",
      colorQuantities: [
        { color: "Gold (ทอง)", quantity: 100 },
        { color: "Silver (เงิน)", quantity: 200 },
        { color: "Copper (ทองแดง)", quantity: 150 },
      ],
      totalQuantity: 450,
      budgetPerPiece: 63,
      // รายละเอียดเหรียญ
      medalSize: "6",
      medalThickness: "3.5",
      frontDetails: ["พิมพ์โลโก้", "ปั๊มนูน"],
      backDetails: ["แกะสลักข้อความ", "ลงน้ำยาป้องกันสนิม"],
      lanyardSize: "2 × 90 ซม",
      lanyardPatterns: "2",
      notes: "สำหรับงานแข่งขันกีฬาสี",
      attachedFiles: ["award_design.pdf"],
      // ข้อมูลโรงงานที่จัดซื้อเลือก (สำหรับสถานะอนุมัติแล้ว)
      selectedFactory: {
        name: "China B&C",
        leadTime: "15-20 วัน",
        procurementNotes: "โรงงานมีประสบการณ์ผลิตเหรียญกีฬา คุณภาพดี ราคาเหมาะสม"
      },
      approvedUnitPrice: 63,
    },
    {
      id: 3,
      status: "ยกเลิก",
      // ข้อมูลทั่วไปลูกค้า
      customerName: "องค์กร DEF",
      customerPhone: "092-345-6789",
      customerLineId: "def_org",
      customerEmail: "somsri@def.org",
      customerTags: "องค์กร",
      // ข้อมูลการตีราคา
      estimateDate: "2024-01-13",
      salesOwner: "พนักงานขาย C",
      jobName: "สายคล้องบัตรพนักงาน",
      eventDate: "2024-04-01",
      productCategory: "หมวดสายคล้อง",
      productType: "สายคล้อง",
      hasDesign: "มีแบบ",
      material: "โพลีสกรีน",
      totalQuantity: 1000,
      budgetPerPiece: 8,
      // รายละเอียดสายคล้อง
      lanyardSize: "2 × 90 ซม",
      lanyardPatterns: "2",
      genericDesignDetails: "สายคล้องโพลีสกรีน พิมพ์โลโก้บริษัท 2 สี ติดตัวล็อคพลาสติก",
      notes: "ลูกค้าเปลี่ยนใจใช้ผู้ผลิตรายอื่น",
      attachedFiles: []
    }
  ];

  const estimation = estimations.find(e => e.id === Number(id));

  if (!estimation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/sales/price-estimation")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">ไม่พบข้อมูลการประเมินราคา</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  // Check if product is medal type
  const isMedal = estimation.productType === "เหรียญสั่งผลิต";
  const isAward = estimation.productType === "โล่สั่งผลิต";
  const isLanyard = estimation.productCategory === "หมวดสายคล้อง";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/sales/price-estimation")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold">รายละเอียดการประเมินราคา</h1>
            <p className="text-muted-foreground">
              รหัส: {estimation.customerLineId} | วันที่: {new Date(estimation.estimateDate).toLocaleDateString('th-TH')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            พิมพ์
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/sales/price-estimation/edit/${id}`)}
            className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            แก้ไข
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            ลบ
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบรายการ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบรายการประเมินราคานี้? ข้อมูลทั้งหมดจะถูกลบอย่างถาวรและไม่สามารถกู้คืนได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700">
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              ยืนยัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Badge */}
      <div>
        <Badge className={getStatusColor(estimation.status)} variant="secondary">
          {estimation.status}
        </Badge>
      </div>

      {/* ข้อมูลทั่วไปลูกค้า */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลทั่วไปลูกค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">ชื่อลูกค้า</p>
              <p className="text-base">{estimation.customerName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">เบอร์โทร (key หลัก)</p>
              <p className="text-base">{estimation.customerPhone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ชื่อไลน์ (key รอง)</p>
              <p className="text-base">{estimation.customerLineId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">อีเมล</p>
              <p className="text-base">{estimation.customerEmail}</p>
            </div>
            {estimation.customerTags && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">ประเภทลูกค้า / แท็ก</p>
                <p className="text-base">{estimation.customerTags}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ข้อมูล Artwork */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูล Artwork</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Artwork Preview Section */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">รูป Artwork</p>
            {artworkImages.length > 0 ? (
              <>
                {/* Main Preview - Clickable */}
                <button
                  onClick={() => setIsFullscreenOpen(true)}
                  className="w-full bg-muted rounded-lg p-4 flex items-center justify-center min-h-[300px] max-h-[500px] cursor-zoom-in hover:bg-muted/80 transition-colors"
                >
                  <img
                    src={artworkImages[selectedArtwork]}
                    alt={`Artwork preview ${selectedArtwork + 1}`}
                    className="max-w-full max-h-[460px] object-contain"
                  />
                </button>
                <p className="text-xs text-muted-foreground text-center mt-2">คลิกที่รูปเพื่อขยายเต็มจอ</p>
                
                {/* Thumbnails */}
                {artworkImages.length > 1 && (
                  <div className="flex gap-2 flex-wrap mt-3">
                    {artworkImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedArtwork(index)}
                        className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all bg-muted p-1 ${
                          selectedArtwork === index
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Placeholder when no images */
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 flex flex-col items-center justify-center min-h-[200px] bg-muted/30">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground text-sm">อัปโหลดรูป Artwork</p>
              </div>
            )}
          </div>

          {/* Design Files Section */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">ไฟล์งานออกแบบ</p>
            {latestDesignFile ? (
              <div className="bg-muted/50 rounded-lg p-4 border">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{latestDesignFile.fileName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{new Date(latestDesignFile.uploadDate).toLocaleDateString('th-TH')} {latestDesignFile.uploadTime}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {latestDesignFile.uploadedBy}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsUploadHistoryOpen(true)}
                    className="gap-1.5"
                  >
                    <History className="h-4 w-4" />
                    ประวัติการอัพโหลด
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center bg-muted/30">
                <FileText className="h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground text-sm">ยังไม่มีไฟล์งานออกแบบ</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ข้อมูลการจัดงานเบื้องต้น */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลการจัดงานเบื้องต้น</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">วันที่ประเมินราคา</p>
              <p className="text-base">{new Date(estimation.estimateDate).toLocaleDateString('th-TH')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">เซลล์ผู้รับผิดชอบ</p>
              <p className="text-base">{estimation.salesOwner}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ชื่องาน</p>
              <p className="text-base">{estimation.jobName}</p>
            </div>
            {estimation.eventDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">วันที่ใช้งาน</p>
                <p className="text-base">{new Date(estimation.eventDate).toLocaleDateString('th-TH')}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">ประเภทสินค้า / สินค้า</p>
              <p className="text-base">{estimation.productCategory} &gt; {estimation.productType}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">ลูกค้ามีแบบแล้วหรือไม่</p>
              <p className="text-base">{estimation.hasDesign}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">วัสดุ</p>
              <p className="text-base">{estimation.material}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">จำนวนรวมทั้งหมด</p>
              <p className="text-base">{estimation.totalQuantity?.toLocaleString() || 0} ชิ้น</p>
            </div>
            {estimation.budgetPerPiece && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">งบประมาณลูกค้าต่อชิ้น</p>
                <p className="text-base">{estimation.budgetPerPiece.toLocaleString()} บาท</p>
              </div>
            )}
          </div>

          {/* ไฟล์แนบจากลูกค้า */}
          {estimation.attachedFiles && estimation.attachedFiles.length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium text-muted-foreground mb-3">ไฟล์แนบจากลูกค้า</p>
              <div className="flex flex-wrap gap-3">
                {estimation.attachedFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 bg-muted/50 hover:bg-muted rounded-lg px-4 py-2.5 border cursor-pointer transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{file}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* รายละเอียดสำหรับประเมินราคา - Single Column for Sales Role */}
      {isMedal ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">รายละเอียดสำหรับประเมินราคา</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ขนาด</p>
                <p className="text-base font-medium">{estimation.medalSize} ซม.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">ความหนา</p>
                <p className="text-base font-medium">{estimation.medalThickness} มิล</p>
              </div>
            </div>

            {/* Finish Type */}
            {estimation.finishType && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">ชนิดการชุบ (Finish)</p>
                <Badge variant="outline" className="mt-1">{estimation.finishType}</Badge>
              </div>
            )}

            {/* Color Quantities */}
            {estimation.colorQuantities && estimation.colorQuantities.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">สีและจำนวน</p>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">สี</TableHead>
                      <TableHead className="font-semibold text-right">จำนวน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estimation.colorQuantities.map((cq, index) => (
                      <TableRow key={index}>
                        <TableCell>{cq.color}</TableCell>
                        <TableCell className="text-right">{cq.quantity.toLocaleString()} ชิ้น</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30 font-semibold">
                      <TableCell>รวม</TableCell>
                      <TableCell className="text-right">{estimation.totalQuantity?.toLocaleString() || 0} ชิ้น</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Front/Back Details */}
            {estimation.frontDetails && estimation.frontDetails.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">รายละเอียดด้านหน้า</p>
                <div className="flex flex-wrap gap-2">
                  {estimation.frontDetails.map((detail, index) => (
                    <Badge key={index} variant="secondary">{detail}</Badge>
                  ))}
                </div>
              </div>
            )}

            {estimation.backDetails && estimation.backDetails.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">รายละเอียดด้านหลัง</p>
                <div className="flex flex-wrap gap-2">
                  {estimation.backDetails.map((detail, index) => (
                    <Badge key={index} variant="secondary">{detail}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Lanyard */}
            {estimation.lanyardSize && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ขนาดสายคล้องคอ</p>
                  <p className="text-base">{estimation.lanyardSize}</p>
                </div>
                {estimation.lanyardPatterns && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">จำนวนลาย</p>
                    <p className="text-base">{estimation.lanyardPatterns} ลาย</p>
                  </div>
                )}
              </div>
            )}

            {/* Budget per piece */}
            {estimation.budgetPerPiece && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">งบประมาณต่อชิ้น</p>
                <p className="text-lg font-semibold text-primary">{estimation.budgetPerPiece.toLocaleString()} บาท</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Non-medal products use original layout */
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดสำหรับประเมินราคา</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLanyard && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {estimation.lanyardSize && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">ขนาดสายคล้อง</p>
                      <p className="text-base">{estimation.lanyardSize}</p>
                    </div>
                  )}
                  {estimation.lanyardPatterns && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">จำนวนลาย</p>
                      <p className="text-base">{estimation.lanyardPatterns} ลาย</p>
                    </div>
                  )}
                </div>
                {estimation.genericDesignDetails && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">รายละเอียดงาน</p>
                    <p className="text-base">{estimation.genericDesignDetails}</p>
                  </div>
                )}
              </>
            )}

            {estimation.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">หมายเหตุ</p>
                <p className="text-base">{estimation.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes Section (for medal) */}
      {isMedal && estimation.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">หมายเหตุ</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base">{estimation.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* สถานะการประเมินราคา - Read-only */}
      <Card className={`border-l-4 ${estimation.status === "อนุมัติแล้ว" ? "border-l-green-500" : "border-l-blue-500"}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CircleDot className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">สถานะการประเมินราคา</CardTitle>
            </div>
            {/* Status Badge - Based on estimation status */}
            {estimation.status === "อนุมัติแล้ว" ? (
              <Badge 
                variant="outline" 
                className="bg-green-500/10 text-green-600 border-green-500/30 px-3 py-1 gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                อนุมัติราคาแล้ว
              </Badge>
            ) : estimation.status === "อยู่ระหว่างการประเมินราคา" ? (
              <Badge 
                variant="outline" 
                className="bg-blue-500/10 text-blue-600 border-blue-500/30 px-3 py-1 gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                อยู่ระหว่างการประเมินราคา
              </Badge>
            ) : (
              <Badge 
                variant="outline" 
                className="bg-orange-500/10 text-orange-600 border-orange-500/30 px-3 py-1 gap-1.5"
              >
                <Clock className="h-3.5 w-3.5" />
                รอจัดซื้อส่งประเมิน
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* แสดงราคาเมื่อสถานะ = อนุมัติราคาแล้ว */}
          {estimation.status === "อนุมัติแล้ว" ? (
            <>
              {/* Selected Factory Info - Green themed */}
              {(estimation as any).selectedFactory && (
                <div className="bg-green-50/50 dark:bg-green-950/20 rounded-xl p-5 border border-green-200 dark:border-green-800 mb-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Factory className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-green-700 dark:text-green-400">โรงงานที่จัดซื้อเลือก</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">ชื่อโรงงาน</p>
                      <p className="text-base font-medium">{(estimation as any).selectedFactory.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ระยะเวลาผลิต (Lead Time)</p>
                      <p className="text-base font-medium">{(estimation as any).selectedFactory.leadTime}</p>
                    </div>
                  </div>
                  {(estimation as any).selectedFactory.procurementNotes && (
                    <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
                      <p className="text-sm text-muted-foreground">หมายเหตุจากจัดซื้อ</p>
                      <p className="text-base mt-1">{(estimation as any).selectedFactory.procurementNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Price Summary */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-6 border border-green-200 dark:border-green-800">
                {/* ราคาต่อหน่วย - เด่นที่สุด */}
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground mb-1">ราคาต่อหน่วย</p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    {(estimation as any).approvedUnitPrice || 63} <span className="text-lg font-medium">บาท / {estimation.productType === "เหรียญสั่งผลิต" ? "เหรียญ" : "ชิ้น"}</span>
                  </p>
                </div>
                
                <Separator className="my-4" />
                
                {/* บริบทของราคา */}
                <div className="flex justify-between items-center text-sm mb-3">
                  <span className="text-muted-foreground">จำนวนรวมทั้งหมด</span>
                  <span className="font-medium">{estimation.totalQuantity?.toLocaleString() || 0} {estimation.productType === "เหรียญสั่งผลิต" ? "เหรียญ" : "ชิ้น"}</span>
                </div>
                
                {/* ราคารวม - รองจากราคาต่อหน่วย */}
                <div className="flex justify-between items-center bg-white/50 dark:bg-black/20 rounded-lg p-3">
                  <span className="font-medium">ราคารวม</span>
                  <span className="text-2xl font-bold text-primary">
                    {(((estimation as any).approvedUnitPrice || 63) * (estimation.totalQuantity || 0)).toLocaleString()} <span className="text-base font-medium">บาท</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons for Approved Status */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => setIsRevisionModalOpen(true)}
                  className="flex-1 border-orange-400 bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700 dark:bg-orange-950/20 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-950/40"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  ขอแก้ไขราคา
                </Button>
                <Button 
                  onClick={handleConfirmPrice}
                  className="flex-1 bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  ยืนยันราคา
                </Button>
              </div>
            </>
          ) : (
            /* ยังไม่ได้ราคา */
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <Clock className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-muted-foreground font-medium">ยังไม่มีผลการประเมินราคา</p>
                <p className="text-sm text-muted-foreground/80">อยู่ระหว่างรอราคาจากฝ่ายที่เกี่ยวข้อง</p>
              </div>
            </div>
          )}

          {/* ข้อมูลกำกับ */}
          <p className="text-xs text-muted-foreground text-right">
            อัปเดตสถานะล่าสุด: {new Date(estimation.estimateDate).toLocaleDateString('th-TH')} โดย {estimation.salesOwner}
          </p>
        </CardContent>
      </Card>

      {/* Revision Request Modal */}
      <Dialog open={isRevisionModalOpen} onOpenChange={setIsRevisionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Edit className="h-5 w-5" />
              ขอแก้ไขราคา
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="revisionNotes">เหตุผลในการขอแก้ไขราคา <span className="text-red-500">*</span></Label>
              <Textarea
                id="revisionNotes"
                placeholder="เช่น ขอลดสเปค, เพิ่ม/ลดจำนวน, เปลี่ยนวัสดุ ฯลฯ"
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                เมื่อส่งคำขอ สถานะจะถูกส่งกลับไปให้จัดซื้อตีราคาใหม่
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsRevisionModalOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              onClick={handleRevisionSubmit}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              <Send className="h-4 w-4 mr-2" />
              ส่งคำขอแก้ไข
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Fullscreen Image Dialog */}
      <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-black/95">
          <button
            onClick={() => setIsFullscreenOpen(false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <div className="w-full h-full flex items-center justify-center p-4">
            <img
              src={artworkImages[selectedArtwork]}
              alt={`Artwork fullscreen ${selectedArtwork + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload History Dialog */}
      <Dialog open={isUploadHistoryOpen} onOpenChange={setIsUploadHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              ประวัติการอัพโหลดไฟล์งานออกแบบ
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">ชื่อไฟล์</TableHead>
                  <TableHead className="font-semibold">วันที่อัพโหลด</TableHead>
                  <TableHead className="font-semibold">เวลา</TableHead>
                  <TableHead className="font-semibold">ผู้อัพโหลด</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designFileHistory.map((file, index) => (
                  <TableRow key={index} className={index === 0 ? "bg-primary/5" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span>{file.fileName}</span>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs ml-1">ล่าสุด</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(file.uploadDate).toLocaleDateString('th-TH')}</TableCell>
                    <TableCell>{file.uploadTime}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {file.uploadedBy}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              แสดงประวัติการอัพโหลดทั้งหมด {designFileHistory.length} รายการ
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
