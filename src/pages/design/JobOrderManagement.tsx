import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Search, Filter, Clock, AlertCircle, ChevronDown, FileText, Copy, Eye } from "lucide-react";
import { toast } from "sonner";
import { JobUpdateDrawer } from "@/components/design/JobUpdateDrawer";
import { JobDetailDrawer } from "@/components/design/JobDetailDrawer";

interface JobOrder {
  job_id: string;
  client_name: string;
  job_type: string;
  urgency: "เร่งด่วน 3-5 ชั่วโมง" | "ด่วน 1 วัน" | "ด่วน 2 วัน" | "ปกติ";
  due_date: string;
  order_date: string;
  status: "รอรับงาน" | "รับงานแล้ว" | "กำลังดำเนินการ" | "รอตรวจสอบ" | "แก้ไข" | "ผลิตชิ้นงาน" | "เสร็จสิ้น";
  assignee?: string;
  assigned_at?: string;
  started_at?: string;
  revision_rounds?: number;
  ordered_by?: string;
  quotation_no?: string;
  description?: string;
  reference_images?: string[];
  reference_files?: string[];
  finish_date?: string;
  qc_pass?: boolean;
  feedback?: string;
  // Medal specific fields
  medal_size?: string;
  medal_thickness?: string;
  medal_colors?: string[];
  medal_front_details?: string[];
  medal_back_details?: string[];
  lanyard_size?: string;
  lanyard_patterns?: string;
  quantity?: number;
}

// Mock Data
const mockJobs: JobOrder[] = [
  // รอรับงาน (แท็บ A)
  {
    job_id: "JOB-2024-001",
    client_name: "บริษัท ABC จำกัด",
    job_type: "ป้ายจารึก",
    urgency: "เร่งด่วน 3-5 ชั่วโมง",
    due_date: "2024-12-01",
    order_date: "2024-11-28",
    status: "รอรับงาน",
    ordered_by: "พนักงานขาย สมชาย",
    quotation_no: "QT-2024-001",
    description: "ป้ายจารึกทองเหลือง ขนาด 30x20 ซม. สลักชื่อบริษัทและโลโก้",
    reference_images: ["https://placehold.co/400x300/png?text=Sign+Reference"],
    reference_files: ["logo_file.ai", "text_content.pdf"]
  },
  {
    job_id: "JOB-2024-002",
    client_name: "ร้าน XYZ",
    job_type: "เหรียญสั่งผลิต",
    urgency: "ด่วน 1 วัน",
    due_date: "2024-12-05",
    order_date: "2024-11-27",
    status: "รอรับงาน",
    ordered_by: "พนักงานขาย สมหญิง",
    quotation_no: "QT-2024-002",
    description: "เหรียญสั่งผลิต",
    reference_images: ["https://placehold.co/400x300/png?text=Medal+Design"],
    reference_files: ["event_info.docx"],
    // Medal specific data
    medal_size: "5",
    medal_thickness: "5",
    medal_colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)"],
    medal_front_details: ["พิมพ์โลโก้", "แกะสลักข้อความ"],
    medal_back_details: ["ลงน้ำยาป้องกันสนิม"],
    lanyard_size: "2 × 90 ซม",
    lanyard_patterns: "3 ลาย",
    quantity: 100
  },

  // รับแล้ว (ยังไม่เริ่ม) (แท็บ B)
  {
    job_id: "JOB-2024-005",
    client_name: "บริษัท ABC จำกัด",
    job_type: "เหรียญสั่งผลิต",
    urgency: "ด่วน 1 วัน",
    due_date: "2024-12-10",
    order_date: "2024-11-29",
    status: "รับงานแล้ว",
    assignee: "ดีไซเนอร์ สมชาย",
    assigned_at: "2024-11-30T08:00:00",
    ordered_by: "พนักงานขาย สมชาย",
    quotation_no: "QT-2024-020",
    description: "เหรียญสั่งผลิต",
    reference_images: ["https://placehold.co/400x300/png?text=Custom+Medal"],
    reference_files: ["medal_design.ai"],
    medal_size: "6",
    medal_thickness: "4",
    medal_colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)", "shinny copper (สีทองแดงเงา)"],
    medal_front_details: ["พิมพ์โลโก้", "แกะสลักข้อความ"],
    medal_back_details: ["ลงน้ำยาป้องกันสนิม", "พิมพ์หมายเลขรุ่น"],
    lanyard_size: "2 × 90 ซม",
    lanyard_patterns: "2 ลาย",
    quantity: 200
  },

  // กำลังทำ/ติดตาม (แท็บ C)
  {
    job_id: "JOB-2024-008",
    client_name: "โรงเรียน STU",
    job_type: "ป้ายจารึก",
    urgency: "ปกติ",
    due_date: "2024-12-12",
    order_date: "2024-11-22",
    status: "กำลังดำเนินการ",
    assignee: "ดีไซเนอร์ สมชาย",
    assigned_at: "2024-11-23T08:00:00",
    started_at: "2024-11-23T09:30:00",
    ordered_by: "พนักงานขาย วิชัย",
    quotation_no: "QT-2024-008",
    description: "ป้ายประกาศเกียรติคุณ อะคริลิก ขนาด 40x60 ซม.",
    reference_images: ["https://placehold.co/400x300/png?text=Honor+Board"],
    reference_files: ["student_names.xlsx"]
  },
  {
    job_id: "JOB-2024-009",
    client_name: "บริษัท VWX",
    job_type: "เหรียญสั่งผลิต",
    urgency: "เร่งด่วน 3-5 ชั่วโมง",
    due_date: "2024-12-02",
    order_date: "2024-11-25",
    status: "กำลังดำเนินการ",
    assignee: "ดีไซเนอร์ สมหญิง",
    assigned_at: "2024-11-25T08:00:00",
    started_at: "2024-11-25T08:30:00",
    ordered_by: "พนักงานขาย สมชาย",
    quotation_no: "QT-2024-009",
    description: "เหรียญที่ระลึก วาระครบรอบ 10 ปี ปั้มสองหน้า",
    reference_images: ["https://placehold.co/400x300/png?text=Anniversary+Medal"],
    reference_files: ["company_history.pdf", "logo_files.zip"]
  },
  {
    job_id: "JOB-2024-010",
    client_name: "ร้าน YZA",
    job_type: "โล่/ถ้วย/คริสตัล",
    urgency: "ด่วน 1 วัน",
    due_date: "2024-12-04",
    order_date: "2024-11-26",
    status: "รอตรวจสอบ",
    assignee: "ดีไซเนอร์ วิชัย",
    assigned_at: "2024-11-26T08:00:00",
    started_at: "2024-11-26T09:00:00",
    ordered_by: "พนักงานขาย มานะ",
    quotation_no: "QT-2024-010",
    description: "ถ้วยรางวัล 3 ขนาด (ทอง เงิน ทองแดง) จารึกชื่อการแข่งขัน",
    reference_images: ["https://placehold.co/400x300/png?text=Trophy+Set"],
    reference_files: ["event_details.docx"]
  },
  {
    job_id: "JOB-2024-011",
    client_name: "บริษัท BCD",
    job_type: "เสื้อ",
    urgency: "ด่วน 2 วัน",
    due_date: "2024-12-07",
    order_date: "2024-11-27",
    status: "แก้ไข",
    assignee: "ดีไซเนอร์ สมชาย",
    assigned_at: "2024-11-27T08:00:00",
    started_at: "2024-11-27T10:00:00",
    revision_rounds: 1,
    ordered_by: "พนักงานขาย สุดา",
    quotation_no: "QT-2024-011",
    description: "เสื้อยืดคอกลม สกรีนภาพและข้อความด้านหน้า",
    reference_images: ["https://placehold.co/400x300/png?text=T-Shirt+Design"],
    reference_files: ["artwork.psd"],
    feedback: "ขอปรับสีให้เข้มขึ้นและเปลี่ยนฟอนต์"
  },

  // งานเสร็จสิ้น (แท็บ D)
  {
    job_id: "JOB-2024-012",
    client_name: "โรงพยาบาล EFG",
    job_type: "บิบ",
    urgency: "ปกติ",
    due_date: "2024-11-20",
    order_date: "2024-11-10",
    status: "เสร็จสิ้น",
    assignee: "ดีไซเนอร์ สมหญิง",
    assigned_at: "2024-11-10T08:00:00",
    started_at: "2024-11-10T09:00:00",
    finish_date: "2024-11-19",
    revision_rounds: 0,
    qc_pass: true,
    ordered_by: "พนักงานขาย จินดา",
    quotation_no: "QT-2024-012",
    description: "บิบชื่อพนักงาน พร้อมหมายเลขและแผนก",
    reference_images: ["https://placehold.co/400x300/png?text=Staff+Badge"],
    reference_files: ["staff_database.xlsx"],
    feedback: "งานสวย ตรงตามที่ต้องการ"
  },
  {
    job_id: "JOB-2024-013",
    client_name: "บริษัท HIJ",
    job_type: "สายคล้อง",
    urgency: "ด่วน 1 วัน",
    due_date: "2024-11-22",
    order_date: "2024-11-12",
    status: "เสร็จสิ้น",
    assignee: "ดีไซเนอร์ วิชัย",
    assigned_at: "2024-11-12T08:00:00",
    started_at: "2024-11-12T10:00:00",
    finish_date: "2024-11-21",
    revision_rounds: 1,
    qc_pass: true,
    ordered_by: "พนักงานขาย ประภา",
    quotation_no: "QT-2024-013",
    description: "สายคล้องสำหรับงานสัมมนา พิมพ์โลโก้และชื่องาน",
    reference_images: ["https://placehold.co/400x300/png?text=Event+Lanyard"],
    reference_files: ["event_branding.pdf"],
    feedback: "ผลงานดีมาก แก้ไขเล็กน้อยตามที่ร้องขอ"
  },
  {
    job_id: "JOB-2024-014",
    client_name: "ร้าน KLM",
    job_type: "ป้ายจารึก",
    urgency: "ด่วน 2 วัน",
    due_date: "2024-11-25",
    order_date: "2024-11-15",
    status: "เสร็จสิ้น",
    assignee: "ดีไซเนอร์ สมชาย",
    assigned_at: "2024-11-15T08:00:00",
    started_at: "2024-11-15T09:00:00",
    finish_date: "2024-11-24",
    revision_rounds: 2,
    qc_pass: true,
    ordered_by: "พนักงานขาย สมชาย",
    quotation_no: "QT-2024-014",
    description: "ป้ายทองเหลือง จารึกชื่อร้านและข้อมูลติดต่อ",
    reference_images: ["https://placehold.co/400x300/png?text=Shop+Sign"],
    reference_files: ["shop_details.txt"],
    feedback: "แก้ไข 2 รอบ ผลสุดท้ายดีเยี่ยม"
  },
  {
    job_id: "JOB-2024-015",
    client_name: "มหาวิทยาลัย NOP",
    job_type: "เหรียญสำเร็จรูป",
    urgency: "เร่งด่วน 3-5 ชั่วโมง",
    due_date: "2024-11-18",
    order_date: "2024-11-08",
    status: "เสร็จสิ้น",
    assignee: "ดีไซเนอร์ สมหญิง",
    assigned_at: "2024-11-08T08:00:00",
    started_at: "2024-11-08T08:30:00",
    finish_date: "2024-11-17",
    revision_rounds: 0,
    qc_pass: true,
    ordered_by: "พนักงานขาย มานะ",
    quotation_no: "QT-2024-015",
    description: "เหรียญรางวัลนักศึกษาดีเด่น 3 ประเภท พร้อมใส่กล่อง",
    reference_images: ["https://placehold.co/400x300/png?text=Award+Medals"],
    reference_files: ["university_logo.ai"],
    feedback: "งานเร็ว คุณภาพดี ไม่มีข้อติ"
  },
  {
    job_id: "JOB-2024-016",
    client_name: "บริษัท QRS",
    job_type: "โล่/ถ้วย/คริสตัล",
    urgency: "ปกติ",
    due_date: "2024-11-28",
    order_date: "2024-11-18",
    status: "เสร็จสิ้น",
    assignee: "ดีไซเนอร์ วิชัย",
    assigned_at: "2024-11-18T08:00:00",
    started_at: "2024-11-18T10:00:00",
    finish_date: "2024-11-27",
    revision_rounds: 1,
    qc_pass: true,
    ordered_by: "พนักงานขาย สุดา",
    quotation_no: "QT-2024-016",
    description: "โล่คริสตัลสีน้ำเงิน เลเซอร์จารึกโลโก้และข้อความ",
    reference_images: ["https://placehold.co/400x300/png?text=Crystal+Trophy"],
    reference_files: ["award_text.docx"],
    feedback: "ความละเอียดสูง งานสวยมาก"
  },
  {
    job_id: "JOB-2024-017",
    client_name: "บริษัท TUV จำกัด",
    job_type: "เหรียญสั่งผลิต",
    urgency: "ด่วน 1 วัน",
    due_date: "2024-11-30",
    order_date: "2024-11-20",
    status: "เสร็จสิ้น",
    assignee: "ดีไซเนอร์ สมชาย",
    assigned_at: "2024-11-20T08:00:00",
    started_at: "2024-11-20T09:00:00",
    finish_date: "2024-11-29",
    revision_rounds: 0,
    qc_pass: true,
    ordered_by: "พนักงานขาย มานะ",
    quotation_no: "QT-2024-017",
    description: "เหรียญสั่งผลิต",
    reference_images: ["https://placehold.co/400x300/png?text=Custom+Medal"],
    reference_files: ["medal_design.ai", "logo.pdf"],
    feedback: "งานออกแบบสวย ตรงตามต้องการ",
    medal_size: "7",
    medal_thickness: "5",
    medal_colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)", "shinny copper (สีทองแดงเงา)"],
    medal_front_details: ["พิมพ์โลโก้", "แกะสลักข้อความ", "ลงสี"],
    medal_back_details: ["ลงน้ำยาป้องกันสนิม"],
    lanyard_size: "2 × 90 ซม",
    lanyard_patterns: "3 ลาย",
    quantity: 150
  }
];

export default function JobOrderManagement() {
  const [jobs] = useState<JobOrder[]>(mockJobs);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJobType, setFilterJobType] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOrder | null>(null);
  const [assignmentType, setAssignmentType] = useState<"random" | "select">("random");
  const [selectedDesigner, setSelectedDesigner] = useState<string>("");
  const [isFilesDrawerOpen, setIsFilesDrawerOpen] = useState(false);
  const [selectedJobForFiles, setSelectedJobForFiles] = useState<JobOrder | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedJobForUpdate, setSelectedJobForUpdate] = useState<JobOrder | null>(null);
  const [isJobDetailDrawerOpen, setIsJobDetailDrawerOpen] = useState(false);
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<JobOrder | null>(null);
  const [jobDetailMode, setJobDetailMode] = useState<"assign" | "action" | "view">("view");

  const designers = ["ดีไซเนอร์ สมชาย", "ดีไซเนอร์ สมหญิง", "ดีไซเนอร์ วิชัย"];

  // คำนวณวันที่เหลือ
  const calculateDaysLeft = (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // คำนวณชั่วโมงที่รอ (idle hours)
  const calculateIdleHours = (assignedAt: string): number => {
    const assigned = new Date(assignedAt);
    const now = new Date();
    const diffTime = now.getTime() - assigned.getTime();
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    return diffHours;
  };

  // สี badge ตามความเร่งด่วน
  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "เร่งด่วน 3-5 ชั่วโมง":
        return <Badge variant="destructive">{urgency}</Badge>;
      case "ด่วน 1 วัน":
        return <Badge className="bg-orange-500 hover:bg-orange-600">{urgency}</Badge>;
      case "ด่วน 2 วัน":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">{urgency}</Badge>;
      case "ปกติ":
        return <Badge variant="secondary">{urgency}</Badge>;
      default:
        return <Badge>{urgency}</Badge>;
    }
  };

  // สี badge ตามสถานะ
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "กำลังดำเนินการ":
        return <Badge className="bg-blue-500 hover:bg-blue-600">{status}</Badge>;
      case "รอตรวจสอบ":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">{status}</Badge>;
      case "แก้ไข":
        return <Badge className="bg-purple-500 hover:bg-purple-600">{status}</Badge>;
      case "ผลิตชิ้นงาน":
        return <Badge className="bg-green-500 hover:bg-green-600">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // สีวันที่เหลือ (SLA)
  const getDaysLeftColor = (daysLeft: number): string => {
    if (daysLeft <= 2) return "text-red-600 font-bold";
    if (daysLeft <= 5) return "text-orange-500 font-semibold";
    return "text-green-600";
  };

  // การกระทำ
  const handleOpenAssignDialog = (job: JobOrder) => {
    setSelectedJob(job);
    setAssignmentType("random");
    setSelectedDesigner("");
    setIsAssignDialogOpen(true);
  };

  const handleConfirmAssignment = () => {
    if (!selectedJob) return;

    if (assignmentType === "random") {
      const randomDesigner = designers[Math.floor(Math.random() * designers.length)];
      toast.success(`มอบหมายงาน ${selectedJob.job_id} ให้ ${randomDesigner} เรียบร้อยแล้ว`);
    } else {
      if (!selectedDesigner) {
        toast.error("กรุณาเลือกพนักงาน");
        return;
      }
      toast.success(`มอบหมายงาน ${selectedJob.job_id} ให้ ${selectedDesigner} เรียบร้อยแล้ว`);
    }

    setIsAssignDialogOpen(false);
    setSelectedJob(null);
    setAssignmentType("random");
  };

  const handleStartJob = (jobId: string) => {
    toast.success(`เริ่มทำงาน ${jobId} เรียบร้อยแล้ว`);
  };

  const handleSubmitForReview = (jobId: string) => {
    toast.success(`ส่งงาน ${jobId} เพื่อตรวจสอบเรียบร้อยแล้ว`);
  };

  const handleOpenUpdateDialog = (job: JobOrder) => {
    setSelectedJobForUpdate(job);
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateJobSubmit = (data: any) => {
    console.log("Update job data:", data);
    toast.success(`อัพเดทงาน ${selectedJobForUpdate?.job_id} เรียบร้อยแล้ว`);
    setIsUpdateDialogOpen(false);
    setSelectedJobForUpdate(null);
  };

  const handleViewAllFiles = (job: JobOrder) => {
    setSelectedJobForFiles(job);
    setIsFilesDrawerOpen(true);
  };

  const handleDuplicateJob = (job: JobOrder) => {
    toast.success(`คัดลอกงาน ${job.job_id} เป็นงานใหม่เรียบร้อยแล้ว`);
  };

  const handleOpenJobDetailDrawer = (job: JobOrder, mode: "assign" | "action" | "view" = "view") => {
    setSelectedJobForDetail(job);
    setJobDetailMode(mode);
    setIsJobDetailDrawerOpen(true);
  };

  const handleAssignJob = (employeeId: string) => {
    if (selectedJobForDetail) {
      toast.success(`มอบหมายงาน ${selectedJobForDetail.job_id} ให้ ${employeeId} เรียบร้อยแล้ว`);
    }
  };

  const handleStartJobFromDrawer = () => {
    if (selectedJobForDetail) {
      toast.success(`เริ่มทำงาน ${selectedJobForDetail.job_id} เรียบร้อยแล้ว`);
    }
  };

  const handleRejectJob = (reason: string) => {
    if (selectedJobForDetail) {
      toast.info(`ปฏิเสธงาน ${selectedJobForDetail.job_id}\nเหตุผล: ${reason}\nข้อมูลจะถูกส่งกลับไปยังแผนกเซลล์`);
    }
  };

  const calculateDelayDays = (dueDate: string, finishDate: string): number => {
    const due = new Date(dueDate);
    const finish = new Date(finishDate);
    const diffTime = finish.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const exportToCSV = (data: JobOrder[]) => {
    const headers = ["Job ID", "ชื่อลูกค้า", "ประเภทงาน", "ผู้รับผิดชอบ", "กำหนดส่ง", "วันที่เสร็จ", "ล่าช้า (วัน)", "รอบแก้ไข", "ข้อเสนอแนะ"];
    const rows = data.map(job => [
      job.job_id,
      job.client_name,
      job.job_type,
      job.assignee || "-",
      new Date(job.due_date).toLocaleDateString("th-TH"),
      job.finish_date ? new Date(job.finish_date).toLocaleDateString("th-TH") : "-",
      job.finish_date ? calculateDelayDays(job.due_date, job.finish_date) : 0,
      job.revision_rounds || 0,
      job.feedback || "-"
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `งานเสร็จสิ้น_${new Date().toLocaleDateString("th-TH")}.csv`;
    link.click();
    toast.success("ส่งออก CSV เรียบร้อยแล้ว");
  };

  // กรองข้อมูล
  const filterJobs = (jobs: JobOrder[]) => {
    return jobs.filter((job) => {
      const matchSearch =
        job.job_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.client_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchJobType = filterJobType === "all" || job.job_type === filterJobType;
      const matchAssignee = filterAssignee === "all" || job.assignee === filterAssignee;
      return matchSearch && matchJobType && matchAssignee;
    });
  };

  const unassignedJobs = filterJobs(jobs.filter((j) => j.status === "รอรับงาน"));
  const acceptedNotStartedJobs = filterJobs(
    jobs.filter((j) => j.status === "รับงานแล้ว" && !j.started_at)
  );
  const inProgressJobs = filterJobs(
    jobs.filter((j) =>
      ["กำลังดำเนินการ", "รอตรวจสอบ", "แก้ไข", "ผลิตชิ้นงาน"].includes(j.status)
    )
  );
  const completedJobs = filterJobs(jobs.filter((j) => j.status === "เสร็จสิ้น"));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">รับงานออกแบบ</h1>
          <p className="text-muted-foreground">ดูและจัดการงานออกแบบทั้งหมด</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหา Job ID หรือชื่อลูกค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterJobType} onValueChange={setFilterJobType}>
            <SelectTrigger>
              <SelectValue placeholder="ประเภทงาน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="ออกแบบโลโก้">ออกแบบโลโก้</SelectItem>
              <SelectItem value="ออกแบบโบรชัวร์">ออกแบบโบรชัวร์</SelectItem>
              <SelectItem value="ออกแบบป้าย">ออกแบบป้าย</SelectItem>
              <SelectItem value="ออกแบบบรรจุภัณฑ์">ออกแบบบรรจุภัณฑ์</SelectItem>
              <SelectItem value="ออกแบบเมนู">ออกแบบเมนู</SelectItem>
              <SelectItem value="ออกแบบโปสเตอร์">ออกแบบโปสเตอร์</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger>
              <SelectValue placeholder="ผู้รับผิดชอบ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              <SelectItem value="ดีไซเนอร์ สมชาย">ดีไซเนอร์ สมชาย</SelectItem>
              <SelectItem value="ดีไซเนอร์ สมหญิง">ดีไซเนอร์ สมหญิง</SelectItem>
              <SelectItem value="ดีไซเนอร์ วิชัย">ดีไซเนอร์ วิชัย</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            ล้างฟิลเตอร์
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="unassigned" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="unassigned">
            ยังไม่มอบหมาย ({unassignedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            รับแล้ว (ยังไม่เริ่ม) ({acceptedNotStartedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="inprogress">
            กำลังดำเนินการ ({inProgressJobs.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            งานเสร็จสิ้น ({completedJobs.length})
          </TabsTrigger>
        </TabsList>

        {/* แท็บ A: ยังไม่มอบหมาย */}
        <TabsContent value="unassigned" className="space-y-4">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] sticky left-0 bg-background text-center">Job ID</TableHead>
                    <TableHead className="text-center">ชื่อลูกค้า</TableHead>
                    <TableHead className="text-center">ประเภทงาน</TableHead>
                    <TableHead className="text-center">ความเร่งด่วน</TableHead>
                    <TableHead className="text-center">วันที่สั่งงาน</TableHead>
                    <TableHead className="text-center">กำหนดส่ง</TableHead>
                    <TableHead className="text-center">วันที่เหลือ</TableHead>
                    <TableHead className="sticky right-0 bg-background text-center">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedJobs.map((job) => {
                    const daysLeft = calculateDaysLeft(job.due_date);
                    return (
                      <TableRow
                        key={job.job_id}
                        className={`${
                          daysLeft < 0 ? "bg-red-50 dark:bg-red-950/20" : ""
                        } ${job.urgency === "เร่งด่วน 3-5 ชั่วโมง" ? "border-l-4 border-l-red-600" : ""}`}
                      >
                        <TableCell className="font-medium sticky left-0 bg-background whitespace-nowrap text-center">
                          <a href="#" className="text-primary hover:underline">
                            {job.job_id}
                          </a>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">{job.client_name}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">{job.job_type}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">{getUrgencyBadge(job.urgency)}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">{new Date(job.order_date).toLocaleDateString("th-TH")}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">{new Date(job.due_date).toLocaleDateString("th-TH")}</TableCell>
                        <TableCell className="text-center">
                          <span className={getDaysLeftColor(daysLeft)}>
                            {daysLeft < 0 ? `เกิน ${Math.abs(daysLeft)} วัน` : `${daysLeft} วัน`}
                          </span>
                        </TableCell>
                        <TableCell className="sticky right-0 bg-background text-center">
                          <Button size="sm" onClick={() => handleOpenJobDetailDrawer(job, "assign")}>
                            มอบหมาย
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* แท็บ B: รับแล้ว (ยังไม่เริ่ม) */}
        <TabsContent value="accepted" className="space-y-4">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] sticky left-0 bg-background text-center">Job ID</TableHead>
                    <TableHead className="text-center">ชื่อลูกค้า</TableHead>
                    <TableHead className="text-center">ประเภทงาน</TableHead>
                    <TableHead className="text-center">ผู้รับผิดชอบ</TableHead>
                    <TableHead className="text-center">รับงานเมื่อ</TableHead>
                    <TableHead className="text-center">กำหนดส่ง</TableHead>
                    <TableHead className="text-center">วันที่เหลือ</TableHead>
                    <TableHead className="text-center">รอมา (ชม.)</TableHead>
                    <TableHead className="sticky right-0 bg-background text-center">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {acceptedNotStartedJobs.map((job) => {
                    const daysLeft = calculateDaysLeft(job.due_date);
                    const idleHours = calculateIdleHours(job.assigned_at!);
                    return (
                      <TableRow
                        key={job.job_id}
                        className={`${
                          daysLeft < 0 ? "bg-red-50 dark:bg-red-950/20" : ""
                        } ${job.urgency === "เร่งด่วน 3-5 ชั่วโมง" ? "border-l-4 border-l-red-600" : ""}`}
                      >
                        <TableCell className="font-medium sticky left-0 bg-background whitespace-nowrap text-center">
                          <a href="#" className="text-primary hover:underline">
                            {job.job_id}
                          </a>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">{job.client_name}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">{job.job_type}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">{job.assignee}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {new Date(job.assigned_at!).toLocaleDateString("th-TH")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">{new Date(job.due_date).toLocaleDateString("th-TH")}</TableCell>
                        <TableCell className="text-center">
                          <span className={getDaysLeftColor(daysLeft)}>
                            {daysLeft < 0 ? `เกิน ${Math.abs(daysLeft)} วัน` : `${daysLeft} วัน`}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {idleHours > 24 && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className={idleHours > 24 ? "text-red-600 font-bold" : ""}>
                              {idleHours} ชม.
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="sticky right-0 bg-background text-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenJobDetailDrawer(job, "action")}
                          >
                            ดูรายละเอียดงาน
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* แท็บ C: กำลังทำ/ติดตาม */}
        <TabsContent value="inprogress" className="space-y-4">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] sticky left-0 bg-background text-center">Job ID</TableHead>
                    <TableHead className="text-center">ชื่อลูกค้า</TableHead>
                    <TableHead className="text-center">ประเภทงาน</TableHead>
                    <TableHead className="text-center">ผู้รับผิดชอบ</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="text-center">กำหนดส่ง</TableHead>
                    <TableHead className="text-center">วันที่เหลือ</TableHead>
                    <TableHead className="text-center">รอบแก้ไข</TableHead>
                    <TableHead className="sticky right-0 bg-background text-center">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inProgressJobs.map((job) => {
                    const daysLeft = calculateDaysLeft(job.due_date);
                    return (
                      <TableRow
                        key={job.job_id}
                        className={`${
                          daysLeft < 0 ? "bg-red-50 dark:bg-red-950/20" : ""
                        } ${job.urgency === "เร่งด่วน 3-5 ชั่วโมง" ? "border-l-4 border-l-red-600" : ""}`}
                      >
                        <TableCell className="font-medium sticky left-0 bg-background whitespace-nowrap text-center">
                          <a href="#" className="text-primary hover:underline">
                            {job.job_id}
                          </a>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">{job.client_name}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">{job.job_type}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">{job.assignee}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">{getStatusBadge(job.status)}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">{new Date(job.due_date).toLocaleDateString("th-TH")}</TableCell>
                        <TableCell className="text-center">
                          <span className={getDaysLeftColor(daysLeft)}>
                            {daysLeft < 0 ? `เกิน ${Math.abs(daysLeft)} วัน` : `${daysLeft} วัน`}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{job.revision_rounds || 0} รอบ</Badge>
                        </TableCell>
                        <TableCell className="sticky right-0 bg-background text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenJobDetailDrawer(job, "view")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleOpenUpdateDialog(job)}
                            >
                              อัพเดท
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* แท็บ D: งานเสร็จสิ้น */}
        <TabsContent value="completed" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => exportToCSV(completedJobs)} variant="outline" size="sm">
              Export CSV
            </Button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] sticky left-0 bg-background text-center">Job ID</TableHead>
                    <TableHead className="text-center">ชื่อลูกค้า</TableHead>
                    <TableHead className="text-center">ประเภทงาน</TableHead>
                    <TableHead className="text-center">ผู้รับผิดชอบ</TableHead>
                    <TableHead className="text-center">กำหนดส่ง</TableHead>
                    <TableHead className="text-center">วันที่เสร็จ</TableHead>
                    <TableHead className="text-center">ล่าช้า (วัน)</TableHead>
                    <TableHead className="text-center">รอบแก้ไข</TableHead>
                    <TableHead className="text-center">ข้อเสนอแนะ</TableHead>
                    <TableHead className="sticky right-0 bg-background text-center">การจัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedJobs.map((job) => {
                    const delayDays = job.finish_date ? calculateDelayDays(job.due_date, job.finish_date) : 0;
                    const rowColorClass = delayDays > 0 ? "bg-red-50 dark:bg-red-950/20" : "";
                    
                    return (
                      <TableRow key={job.job_id} className={rowColorClass}>
                        <TableCell className="font-medium sticky left-0 bg-background whitespace-nowrap text-center">
                          <a href="#" className="text-primary hover:underline">
                            {job.job_id}
                          </a>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">{job.client_name}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">{job.job_type}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">{job.assignee}</TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {new Date(job.due_date).toLocaleDateString("th-TH", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {job.finish_date ? new Date(job.finish_date).toLocaleDateString("th-TH", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric"
                          }) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={delayDays > 0 ? "text-red-600 font-bold" : ""}>
                            {delayDays > 0 ? `+${delayDays}` : delayDays}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{job.revision_rounds || 0} รอบ</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-center">
                          {job.feedback || "-"}
                        </TableCell>
                        <TableCell className="sticky right-0 bg-background text-center">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleOpenJobDetailDrawer(job, "view")}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            ดูรายละเอียด
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog สำหรับมอบหมายงาน */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดงาน</DialogTitle>
            <DialogDescription>
              ตรวจสอบรายละเอียดงานก่อนมอบหมาย
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Job ID</label>
                  <p className="text-lg font-semibold">{selectedJob.job_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ชื่อลูกค้า</label>
                  <p className="text-lg">{selectedJob.client_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ประเภทงาน</label>
                  <p className="text-lg">{selectedJob.job_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ความเร่งด่วน</label>
                  <div className="mt-1">{getUrgencyBadge(selectedJob.urgency)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">วันที่สั่งงาน</label>
                  <p className="text-lg">{new Date(selectedJob.order_date).toLocaleDateString("th-TH")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">วันที่ต้องส่งงาน</label>
                  <p className="text-lg">{new Date(selectedJob.due_date).toLocaleDateString("th-TH")}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">วันที่เหลือ</label>
                  <p className={`text-lg ${getDaysLeftColor(calculateDaysLeft(selectedJob.due_date))}`}>
                    {calculateDaysLeft(selectedJob.due_date) < 0 
                      ? `เกิน ${Math.abs(calculateDaysLeft(selectedJob.due_date))} วัน` 
                      : `${calculateDaysLeft(selectedJob.due_date)} วัน`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ผู้สั่งงาน</label>
                  <p className="text-lg">{selectedJob.ordered_by || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ใบเสนอราคา</label>
                  <p className="text-lg">{selectedJob.quotation_no || "-"}</p>
                </div>
                {selectedJob.assignee && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ผู้รับงาน</label>
                    <p className="text-lg">{selectedJob.assignee}</p>
                  </div>
                )}
              </div>

              {selectedJob.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">รายละเอียดงาน</label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">{selectedJob.description}</p>
                </div>
              )}

              {selectedJob.reference_images && selectedJob.reference_images.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    รูปอ้างอิงจากลูกค้า ({selectedJob.reference_images.length} รูป)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedJob.reference_images.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-md overflow-hidden bg-muted">
                        <img 
                          src={img} 
                          alt={`Reference ${idx + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => window.open(img, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.reference_files && selectedJob.reference_files.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    ไฟล์อ้างอิงจากลูกค้า
                  </label>
                  <div className="space-y-2">
                    {selectedJob.reference_files.map((file, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 p-2 bg-muted rounded-md hover:bg-muted/80 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="text-sm">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-t pt-4 space-y-4">
            <div className="flex gap-2">
              <Button
                variant={assignmentType === "random" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setAssignmentType("random")}
              >
                สุ่มพนักงาน
              </Button>
              <Button
                variant={assignmentType === "select" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setAssignmentType("select")}
              >
                เลือกพนักงาน
              </Button>
            </div>

            {assignmentType === "select" ? (
              <div>
                <label className="text-sm font-medium text-muted-foreground block mb-2">
                  เลือกพนักงาน
                </label>
                <Select value={selectedDesigner} onValueChange={setSelectedDesigner}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกพนักงาน" />
                  </SelectTrigger>
                  <SelectContent>
                    {designers.map((designer) => (
                      <SelectItem key={designer} value={designer}>
                        {designer}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                ระบบจะสุ่มเลือกพนักงานให้อัตโนมัติเมื่อยืนยัน
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleConfirmAssignment}>
              ยืนยันการมอบหมาย
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drawer สำหรับดูไฟล์ทั้งหมด */}
      <Drawer open={isFilesDrawerOpen} onOpenChange={setIsFilesDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>ไฟล์ทั้งหมดของงาน {selectedJobForFiles?.job_id}</DrawerTitle>
            <DrawerDescription>
              ดูและจัดการไฟล์ทั้งหมดที่เกี่ยวข้องกับงานนี้
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedJobForFiles && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Job ID</label>
                    <p className="text-lg font-semibold">{selectedJobForFiles.job_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ชื่อลูกค้า</label>
                    <p className="text-lg">{selectedJobForFiles.client_name}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* ไฟล์อ้างอิงจากลูกค้า */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">ไฟล์อ้างอิงจากลูกค้า</h3>
                    {selectedJobForFiles.reference_files && selectedJobForFiles.reference_files.length > 0 ? (
                      <div className="space-y-2">
                        {selectedJobForFiles.reference_files.map((file, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-3 bg-muted rounded-md hover:bg-muted/80 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                                <FileText className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{file}</p>
                                <p className="text-xs text-muted-foreground">อัพโหลดโดยลูกค้า</p>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost">ดาวน์โหลด</Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">ไม่มีไฟล์อ้างอิง</p>
                    )}
                  </div>

                  {/* รูปอ้างอิงจากลูกค้า */}
                  {selectedJobForFiles.reference_images && selectedJobForFiles.reference_images.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-3">รูปอ้างอิงจากลูกค้า</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {selectedJobForFiles.reference_images.map((img, idx) => (
                          <div key={idx} className="relative aspect-video rounded-md overflow-hidden bg-muted group">
                            <img 
                              src={img} 
                              alt={`Reference ${idx + 1}`}
                              className="w-full h-full object-cover cursor-pointer group-hover:opacity-80 transition-opacity"
                              onClick={() => window.open(img, '_blank')}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                              รูปที่ {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ไฟล์ผลงาน (mock data) */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">ไฟล์ผลงาน</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-md hover:bg-muted/80 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500/10 rounded flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">design_final_v1.ai</p>
                            <p className="text-xs text-muted-foreground">ผลงานฉบับสุดท้าย - {selectedJobForFiles.assignee}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">ดาวน์โหลด</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-md hover:bg-muted/80 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500/10 rounded flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">design_final.pdf</p>
                            <p className="text-xs text-muted-foreground">ไฟล์ PDF สำหรับส่งลูกค้า</p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">ดาวน์โหลด</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Drawer สำหรับอัปเดตงาน */}
      {selectedJobForUpdate && (
        <JobUpdateDrawer
          open={isUpdateDialogOpen}
          onOpenChange={setIsUpdateDialogOpen}
          jobId={selectedJobForUpdate.job_id}
          quotationNo={selectedJobForUpdate.quotation_no}
          clientName={selectedJobForUpdate.client_name}
          jobType={selectedJobForUpdate.job_type}
          onSubmit={handleUpdateJobSubmit}
        />
      )}

      {/* Job Detail Drawer */}
      {selectedJobForDetail && (
        <JobDetailDrawer
          open={isJobDetailDrawerOpen}
          onOpenChange={setIsJobDetailDrawerOpen}
          jobId={selectedJobForDetail.job_id}
          jobData={selectedJobForDetail}
          mode={jobDetailMode}
          onAssign={handleAssignJob}
          onStart={handleStartJobFromDrawer}
          onReject={handleRejectJob}
        />
      )}
    </div>
  );
}
