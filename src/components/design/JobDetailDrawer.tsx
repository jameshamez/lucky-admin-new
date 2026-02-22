import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Shuffle, 
  FileText, 
  Phone, 
  User, 
  Building2, 
  MessageCircle, 
  Download,
  Calendar,
  Clock,
  AlertTriangle,
  Clipboard,
  Image as ImageIcon
} from "lucide-react";

interface JobDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId?: string;
  jobData?: any;
  mode?: "assign" | "action" | "view";
  onAssign?: (employeeId: string) => void;
  onStart?: () => void;
  onReject?: (reason: string) => void;
}

const mockEmployees = [
  { id: "1", name: "สมชาย ใจดี" },
  { id: "2", name: "สมหญิง รักงาน" },
  { id: "3", name: "วิชัย มีฝีมือ" },
  { id: "4", name: "สุดา ออกแบบดี" },
];

export function JobDetailDrawer({ 
  open, 
  onOpenChange, 
  jobId, 
  jobData, 
  mode = "view",
  onAssign,
  onStart,
  onReject 
}: JobDetailDrawerProps) {
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [requestInfoMessage, setRequestInfoMessage] = useState("");

  // Mock employee workload data
  const mockEmployeeWorkload: Record<string, { jobType: string; quantity: number }[]> = {
    "1": [
      { jobType: "ป้ายจารึก", quantity: 3 },
      { jobType: "เหรียญสำเร็จรูป", quantity: 2 },
    ],
    "2": [
      { jobType: "โล่/ถ้วย/คริสตัล", quantity: 5 },
    ],
    "3": [
      { jobType: "เสื้อ", quantity: 4 },
      { jobType: "สายคล้อง", quantity: 1 },
    ],
    "4": [
      { jobType: "ป้ายจารึก", quantity: 2 },
    ],
  };

  // ข้อมูลจริงจาก jobData หรือ Mockup
  const data = {
    customerName: jobData?.client_name ?? "บริษัท ABC จำกัด",
    contactName: jobData?.contact_name ?? "คุณสมศักดิ์ ใจดี",
    phone: jobData?.phone_number ?? "081-234-5678",
    lineId: jobData?.line_id ?? "@customer_line",
    facebook: jobData?.facebook ?? "ABC Company",
    salesperson: jobData?.ordered_by ?? "สมชาย",
    jobType: jobData?.job_type ?? "ป้ายจารึก",
    urgencyLabel: jobData?.urgency ?? "เร่งด่วน",
    orderDate: jobData?.order_date ? new Date(jobData.order_date) : new Date("2024-11-28"),
    dueDate: jobData?.due_date ? new Date(jobData.due_date) : new Date("2024-12-01"),
    quotation: jobData?.quotation_no ?? "QT-2024-001",
    jobIdDisplay: jobData?.job_id || jobId || "JOB-2024-XXX",
    jobName: jobData?.job_name ?? "ป้ายจารึกรางวัล ประจำปี 2567",
    quantity: jobData?.quantity ?? 50,
    width: jobData?.width ?? "15",
    height: jobData?.height ?? "20",
    material: jobData?.material ?? "อะคริลิค",
    textOnSign: jobData?.text_on_sign ?? "รางวัลพนักงานดีเด่น\nประจำปี 2567\nบริษัท ABC จำกัด",
    description: jobData?.description ?? "ออกแบบโลโก้สำหรับบริษัท ต้องการดูมีความทันสมัย เน้นสีน้ำเงิน-ขาว",
  };

  const toThaiDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear() + 543;
    return `${dd}/${mm}/${yyyy}`;
  };

  const today = new Date();
  const diffDays = Math.ceil((data.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const getDeadlineBadge = () => {
    if (diffDays < 0) {
      return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />เกินกำหนด {Math.abs(diffDays)} วัน</Badge>;
    } else if (diffDays <= 2) {
      return <Badge variant="destructive" className="gap-1"><Clock className="h-3 w-3" />เหลือ {diffDays} วัน (ด่วน)</Badge>;
    } else if (diffDays <= 5) {
      return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />เหลือ {diffDays} วัน</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />เหลือ {diffDays} วัน</Badge>;
  };

  const handleRandomEmployee = () => {
    const randomIndex = Math.floor(Math.random() * mockEmployees.length);
    const employee = mockEmployees[randomIndex];
    setSelectedEmployee(employee.name);
    setSelectedEmployeeId(employee.id);
  };

  const handleSelectEmployee = (emp: { id: string; name: string }) => {
    setSelectedEmployee(emp.name);
    setSelectedEmployeeId(emp.id);
    setShowEmployeeDialog(false);
  };

  const getEmployeeWorkload = () => {
    if (!selectedEmployeeId) return [];
    return mockEmployeeWorkload[selectedEmployeeId] || [];
  };

  const handleDownloadAll = () => {
    // Mock function - in real app this would download all files
    console.log("Downloading all files...");
  };

  const renderJobSpecifications = () => {
    const currentJobType = jobData?.job_type || "ป้ายจารึก";
    
    // Common specs for all job types
    const commonSpecs = (
      <>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">ขนาด (กว้าง x สูง)</p>
          <p className="text-base font-normal">{data.width} x {data.height} ซม.</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">จำนวนที่สั่ง</p>
          <p className="text-base font-normal">{data.quantity} ชิ้น</p>
        </div>
      </>
    );

    switch (currentJobType) {
      case "ป้ายจารึก":
        return (
          <>
            {commonSpecs}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">ชนิดฐาน / วัสดุ</p>
              <p className="text-base font-normal">{jobData?.base_type || data.material}</p>
            </div>
          </>
        );

      case "เหรียญสำเร็จรูป":
        return (
          <>
            {commonSpecs}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">วัสดุ</p>
              <p className="text-base font-normal">{jobData?.material || "ทองเหลือง"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">สี</p>
              <p className="text-base font-normal">{jobData?.color || "ทอง"}</p>
            </div>
          </>
        );

      case "เหรียญสั่งผลิต":
        return (
          <>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">ขนาด</p>
              <p className="text-base font-normal text-primary">{jobData?.medal_size || "5"} ซม.</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">ความหนา</p>
              <p className="text-base font-normal text-primary">{jobData?.medal_thickness || "5"} มิล</p>
            </div>
            <div className="col-span-2 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">สี (เลือกได้หลายรายการ)</p>
              <div className="flex flex-wrap gap-2">
                {(jobData?.medal_colors || ["shinny gold (สีทองเงา)"]).map((color: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-sm font-normal">{color}</Badge>
                ))}
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">รายละเอียดด้านหน้า (เลือกได้หลายรายการ)</p>
              <div className="flex flex-wrap gap-2">
                {(jobData?.medal_front_details || ["พิมพ์โลโก้"]).map((detail: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-sm font-normal">{detail}</Badge>
                ))}
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">รายละเอียดด้านหลัง (เลือกได้หลายรายการ)</p>
              <div className="flex flex-wrap gap-2">
                {(jobData?.medal_back_details || ["ลงน้ำยาป้องกันสนิม"]).map((detail: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="text-sm font-normal">{detail}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">สายคล้อง</p>
              <p className="text-base font-normal text-primary">{jobData?.lanyard_size || "2 × 90 ซม"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">จำนวนลาย</p>
              <p className="text-base font-normal text-primary">{jobData?.lanyard_patterns || "3 ลาย"}</p>
            </div>
          </>
        );

      case "โล่/ถ้วย/คริสตัล":
        return (
          <>
            {commonSpecs}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">รุ่น</p>
              <p className="text-base font-normal">{jobData?.model || "คริสตัล A-01"}</p>
            </div>
          </>
        );

      case "เสื้อ":
        return (
          <>
            {commonSpecs}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">ประเภทเสื้อ</p>
              <p className="text-base font-normal">{jobData?.shirt_type || "โปโล"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">ไซส์</p>
              <p className="text-base font-normal">{jobData?.sizes || "S, M, L, XL"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">สี</p>
              <p className="text-base font-normal">{jobData?.color || "ขาว"}</p>
            </div>
          </>
        );

      case "บิบ":
      case "สายคล้อง":
        return (
          <>
            {commonSpecs}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">วัสดุ</p>
              <p className="text-base font-normal">{jobData?.material || "ผ้าโพลีเอสเตอร์"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">สี</p>
              <p className="text-base font-normal">{jobData?.color || "แดง"}</p>
            </div>
          </>
        );

      default:
        return commonSpecs;
    }
  };

  // Customer Information Card
  const CustomerInfoCard = () => (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          ข้อมูลลูกค้า
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 2-column layout for company and contact */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">ชื่อลูกค้า/บริษัท</p>
            <p className="text-base font-normal">{data.customerName}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">ชื่อผู้ติดต่อ</p>
            <p className="text-base font-normal flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {data.contactName}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">เบอร์โทรศัพท์</p>
          <a 
            href={`tel:${data.phone.replace(/-/g, '')}`}
            className="text-base font-normal text-primary hover:underline flex items-center gap-2 cursor-pointer"
          >
            <Phone className="h-4 w-4" />
            {data.phone}
          </a>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">ช่องทางติดต่ออื่นๆ</p>
          <div className="space-y-2">
            <p className="text-base font-normal flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Line: {data.lineId}
            </p>
            {data.facebook && (
              <p className="text-base font-normal flex items-center gap-2">
                <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {data.facebook}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">พนักงานขายที่ดูแล</p>
            <p className="text-base font-normal flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              {data.salesperson}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Get urgency badge for header - more prominent styling
  const getUrgencyBadge = () => {
    const urgency = data.urgencyLabel;
    // Check for high urgency keywords
    const isHighUrgency = urgency?.includes("เร่งด่วน") || 
                          urgency?.includes("ด่วนมาก") || 
                          urgency?.includes("ชั่วโมง") ||
                          urgency?.includes("ด่วน");
    
    if (isHighUrgency) {
      return (
        <Badge variant="destructive" className="gap-1.5 px-3 py-1 text-sm font-semibold animate-pulse">
          <AlertTriangle className="h-4 w-4" />
          {urgency}
        </Badge>
      );
    }
    return <Badge variant="secondary" className="px-3 py-1">{urgency || "ปกติ"}</Badge>;
  };

  // Job Specifications Card
  const JobSpecificationsCard = () => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Clipboard className="h-4 w-4 text-primary" />
            ข้อมูลงาน
          </CardTitle>
          {getUrgencyBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Job ID & Quotation */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">เลขที่ใบสั่งงาน (Job ID)</p>
            <p className="text-base font-mono font-medium text-primary">{data.jobIdDisplay}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">ใบเสนอราคา (QT No.)</p>
            <p className="text-base font-mono font-normal">{data.quotation}</p>
          </div>
        </div>

        {/* Job Type */}
        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">ประเภทงาน</p>
          <Badge variant="outline" className="text-sm font-normal">{data.jobType}</Badge>
        </div>

        {/* Technical Specifications */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-muted-foreground">รายละเอียด</p>
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
            {renderJobSpecifications()}
          </div>
        </div>

        {/* Design Details - Copy Pasteable */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">รายละเอียดการออกแบบ</p>
          <div className="relative">
            <Textarea 
              value={data.textOnSign}
              readOnly
              className="min-h-[100px] bg-muted/30 resize-none cursor-text select-all"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
            <p className="text-xs text-muted-foreground mt-1">คลิกเพื่อเลือกทั้งหมด แล้ว Copy</p>
          </div>
        </div>

        {/* Deadline with Urgency Bar */}
        <div className="space-y-3 p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                กำหนดส่ง (Deadline)
              </p>
              <p className="text-lg font-medium">{toThaiDate(data.dueDate)}</p>
            </div>
            {getDeadlineBadge()}
          </div>
          <div className="text-sm text-muted-foreground">
            วันที่สั่งงาน: {toThaiDate(data.orderDate)}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Customer Reference Files Card
  const CustomerReferenceCard = () => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          ไฟล์อ้างอิงจากลูกค้า
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reference Files */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            ไฟล์เอกสาร
          </p>
          {jobData?.reference_files && jobData.reference_files.length > 0 ? (
            <div className="space-y-2">
              {jobData.reference_files.map((file: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{file}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="gap-1">
                    <Download className="h-4 w-4" />
                    ดาวน์โหลด
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Mock files for demo */}
              {["Brief_ABC_Company.pdf", "Logo_Guidelines.ai"].map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{file}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="gap-1">
                    <Download className="h-4 w-4" />
                    ดาวน์โหลด
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reference Images */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            รูปภาพอ้างอิง
          </p>
          {jobData?.reference_images && jobData.reference_images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {jobData.reference_images.map((img: string, idx: number) => (
                <div
                  key={idx}
                  className="aspect-video bg-muted rounded-md overflow-hidden hover:opacity-80 cursor-pointer transition-opacity"
                >
                  <img src={img} alt={`รูปอ้างอิง ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {/* Mock images for demo */}
              {[1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className="aspect-video bg-muted/50 rounded-md overflow-hidden flex items-center justify-center border-2 border-dashed"
                >
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Production Files Card
  const ProductionFilesCard = () => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            ไฟล์สั่งผลิต
          </CardTitle>
          <Button size="sm" variant="outline" onClick={handleDownloadAll} className="gap-2">
            <Download className="h-4 w-4" />
            Download All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Production files - files ready for manufacturing */}
        <div className="space-y-2">
          {/* Mock production files */}
          {["Artwork_Final.ai", "Production_Specs.pdf"].map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{file}</span>
              </div>
              <Button size="sm" variant="ghost" className="gap-1">
                <Download className="h-4 w-4" />
                ดาวน์โหลด
              </Button>
            </div>
          ))}
        </div>

        {/* Production Artwork Images */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            รูป Artwork สำหรับผลิต
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* Mock production artwork */}
            {[1, 2].map((idx) => (
              <div
                key={idx}
                className="aspect-video bg-muted/50 rounded-md overflow-hidden flex items-center justify-center border-2 border-dashed"
              >
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-4xl p-0">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="text-xl">รายละเอียดงานออกแบบ</SheetTitle>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="p-6">
              {/* Stacked Layout: All cards in a single column */}
              <div className="space-y-6">
                <CustomerInfoCard />
                <JobSpecificationsCard />
                <CustomerReferenceCard />
                <ProductionFilesCard />
              </div>
            </div>
          </ScrollArea>

          {/* Footer Buttons */}
          {mode !== "view" && (
            <div className="absolute bottom-0 left-0 right-0 p-6 border-t bg-background">
              {mode === "assign" ? (
                <div className="flex gap-4">
                  <Button 
                    variant="outline"
                    size="lg"
                    className="flex-1 h-12 text-base border-2"
                    onClick={() => setShowRequestInfoDialog(true)}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    ขอข้อมูลเพิ่มเติม
                  </Button>
                  <Button 
                    size="lg"
                    className="flex-[1.5] h-12 text-base font-semibold"
                    onClick={() => {
                      setSelectedEmployee("");
                      setSelectedEmployeeId("");
                      setShowAssignmentDialog(true);
                    }}
                  >
                    รับงาน
                  </Button>
                </div>
              ) : mode === "action" ? (
                <div className="flex gap-4">
                  <Button 
                    variant="outline"
                    size="lg"
                    className="flex-1 h-12 text-base"
                    onClick={() => setShowRejectDialog(true)}
                  >
                    ปฏิเสธงาน
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg"
                    className="flex-1 h-12 text-base border-2"
                    onClick={() => setShowRequestInfoDialog(true)}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    ขอข้อมูลเพิ่มเติม
                  </Button>
                  <Button 
                    size="lg"
                    className="flex-1 h-12 text-base font-semibold"
                    onClick={() => {
                      if (onStart) {
                        onStart();
                        onOpenChange(false);
                      }
                    }}
                  >
                    เริ่มงาน
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Assignment Dialog - รับงาน */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>มอบหมายงาน</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Selection buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleRandomEmployee}
                className="flex-1"
              >
                <Shuffle className="mr-2 h-4 w-4" />
                สุ่มพนักงาน
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEmployeeDialog(true)}
                className="flex-1"
              >
                <Users className="mr-2 h-4 w-4" />
                เลือกพนักงาน
              </Button>
            </div>

            {/* Show selected employee and workload */}
            {selectedEmployee && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-semibold">พนักงานที่เลือก:</span>
                  <span className="text-primary font-medium">{selectedEmployee}</span>
                </div>
                
                {/* Employee workload */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">งานที่รับผิดชอบอยู่:</p>
                  {getEmployeeWorkload().length > 0 ? (
                    <div className="space-y-1">
                      {getEmployeeWorkload().map((work, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm bg-background p-2 rounded">
                          <span>{work.jobType}</span>
                          <Badge variant="secondary">{work.quantity} งาน</Badge>
                        </div>
                      ))}
                      <div className="flex justify-between items-center text-sm font-medium pt-2 border-t mt-2">
                        <span>รวมทั้งหมด</span>
                        <Badge variant="outline">
                          {getEmployeeWorkload().reduce((sum, w) => sum + w.quantity, 0)} งาน
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">ไม่มีงานที่รับผิดชอบอยู่</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAssignmentDialog(false);
              setSelectedEmployee("");
              setSelectedEmployeeId("");
            }}>
              ยกเลิก
            </Button>
            <Button 
              onClick={() => {
                if (selectedEmployee && onAssign) {
                  onAssign(selectedEmployee);
                  setShowAssignmentDialog(false);
                  setSelectedEmployee("");
                  setSelectedEmployeeId("");
                  onOpenChange(false);
                }
              }}
              disabled={!selectedEmployee}
            >
              ยืนยันการมอบหมาย
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Employee Selection Dialog */}
      <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เลือกพนักงานออกแบบ</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {mockEmployees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => handleSelectEmployee(emp)}
                className="w-full p-3 text-left border rounded-md hover:bg-accent transition-colors"
              >
                {emp.name}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmployeeDialog(false)}>
              ยกเลิก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Info Dialog - ขอข้อมูลเพิ่มเติม */}
      <Dialog open={showRequestInfoDialog} onOpenChange={setShowRequestInfoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              ขอข้อมูลเพิ่มเติม
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="request-info">ระบุข้อมูลที่ต้องการเพิ่มเติม</Label>
              <Textarea
                id="request-info"
                placeholder="กรุณาระบุรายละเอียดข้อมูลที่ต้องการจากฝ่ายขาย..."
                value={requestInfoMessage}
                onChange={(e) => setRequestInfoMessage(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRequestInfoDialog(false);
              setRequestInfoMessage("");
            }}>
              ยกเลิก
            </Button>
            <Button 
              onClick={() => {
                if (requestInfoMessage.trim()) {
                  // TODO: Send request to sales team
                  console.log("Request info sent:", requestInfoMessage);
                  setShowRequestInfoDialog(false);
                  setRequestInfoMessage("");
                }
              }}
              disabled={!requestInfoMessage.trim()}
            >
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Job Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ปฏิเสธงาน</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">เหตุผลในการปฏิเสธงาน</Label>
              <Textarea
                id="reject-reason"
                placeholder="กรุณาระบุเหตุผลในการปฏิเสธงาน..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRejectDialog(false);
              setRejectReason("");
            }}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (rejectReason.trim() && onReject) {
                  onReject(rejectReason);
                  setShowRejectDialog(false);
                  setRejectReason("");
                  onOpenChange(false);
                }
              }}
              disabled={!rejectReason.trim()}
            >
              ยืนยันการปฏิเสธ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
