import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Search, Eye, Calendar, User, FileText, CheckCircle2, Link as LinkIcon, ImageIcon, Lock, Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatsCard } from "@/components/dashboard/StatsCard";

interface DesignWorkflowData {
  googleDriveLink?: string;
  layoutImage?: string;
  artworkImage?: string;
  artworkStatus: 'draft' | 'pending_review' | 'approved' | 'rejected';
  productionArtwork?: string;
  aiFile?: string;
}

interface JobTracking {
  job_id: string;
  client_name: string;
  job_type: string;
  assignee: string;
  assigned_at: string;
  due_date: string;
  status: "รับงานแล้ว" | "กำลังดำเนินการ" | "รอตรวจสอบ" | "ผลิตชิ้นงาน" | "เสร็จสิ้น" | "ล่าช้า";
  progress: number;
  has_artwork: boolean;
  designWorkflow?: DesignWorkflowData;
  internal_notes?: string;
  specs?: string;
}

const workflowSteps = [
  { key: "รับงานแล้ว", label: "รับงาน" },
  { key: "กำลังดำเนินการ", label: "กำลังดำเนินการ" },
  { key: "รอตรวจสอบ", label: "รอตรวจสอบ" },
  { key: "ผลิตชิ้นงาน", label: "ผลิตชิ้นงาน" },
  { key: "เสร็จสิ้น", label: "เสร็จสิ้น" }
];

// Deep search utility
const deepSearch = (obj: any, term: string): boolean => {
  const s = term.toLowerCase();
  const searchVal = (val: any): boolean => {
    if (val == null) return false;
    if (typeof val === "string") return val.toLowerCase().includes(s);
    if (typeof val === "number") return String(val).includes(s);
    if (Array.isArray(val)) return val.some(v => searchVal(v));
    if (typeof val === "object") return Object.values(val).some(v => searchVal(v));
    return false;
  };
  return searchVal(obj);
};

// Highlight text utility
const highlightText = (text: string, search: string) => {
  if (!search.trim()) return text;
  const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">{part}</mark> : part
  );
};

export default function JobTracking() {
  const [searchTerm, setSearchTerm] = useState("");
  const [cardFilter, setCardFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Column filters
  const [colJobId, setColJobId] = useState("");
  const [colClient, setColClient] = useState("");
  const [colJobType, setColJobType] = useState("");
  const [colAssignee, setColAssignee] = useState("");
  const [colStatus, setColStatus] = useState("");

  const [jobs] = useState<JobTracking[]>([
    {
      job_id: "JOB-2024-001",
      client_name: "บริษัท ABC จำกัด",
      job_type: "เหรียญซิงค์อัลลอย",
      assignee: "ดีไซเนอร์ A",
      assigned_at: "2024-01-15",
      due_date: "2024-12-25",
      status: "กำลังดำเนินการ",
      progress: 60,
      has_artwork: true,
      internal_notes: "ลูกค้าต้องการแก้ไขสีทอง",
      specs: "ขนาด 5cm ชุบทองเหลือง",
      designWorkflow: {
        googleDriveLink: "https://drive.google.com/file/d/abc123",
        layoutImage: "/placeholder.svg",
        artworkImage: "/placeholder.svg",
        artworkStatus: 'pending_review',
      }
    },
    {
      job_id: "JOB-2024-002",
      client_name: "ร้าน XYZ",
      job_type: "โล่สั่งผลิต",
      assignee: "ดีไซเนอร์ B",
      assigned_at: "2024-01-10",
      due_date: "2024-12-10",
      status: "รอตรวจสอบ",
      progress: 85,
      has_artwork: true,
      internal_notes: "รอลูกค้ายืนยันแบบ",
      specs: "โล่คริสตัล 8 นิ้ว",
      designWorkflow: {
        googleDriveLink: "https://drive.google.com/file/d/xyz456",
        layoutImage: "/placeholder.svg",
        artworkImage: "/placeholder.svg",
        artworkStatus: 'approved',
        productionArtwork: "/placeholder.svg",
        aiFile: "production_file.ai",
      }
    },
    {
      job_id: "JOB-2024-003",
      client_name: "บริษัท DEF",
      job_type: "PVC",
      assignee: "ดีไซเนอร์ C",
      assigned_at: "2024-01-05",
      due_date: "2024-12-05",
      status: "เสร็จสิ้น",
      progress: 100,
      has_artwork: true,
      internal_notes: "งานเสร็จเรียบร้อย",
      specs: "PVC 3mm พิมพ์ UV",
      designWorkflow: {
        googleDriveLink: "https://drive.google.com/file/d/def789",
        layoutImage: "/placeholder.svg",
        artworkImage: "/placeholder.svg",
        artworkStatus: 'approved',
        productionArtwork: "/placeholder.svg",
        aiFile: "final_artwork.ai",
      }
    },
    {
      job_id: "JOB-2024-004",
      client_name: "องค์กร GHI",
      job_type: "เหรียญอะคริลิก",
      assignee: "ดีไซเนอร์ A",
      assigned_at: "2024-02-01",
      due_date: "2024-11-30",
      status: "ล่าช้า",
      progress: 45,
      has_artwork: false,
      internal_notes: "ลูกค้ายังไม่ส่งข้อมูลเพิ่มเติม",
      specs: "อะคริลิกใส 10cm ตัดเลเซอร์",
      designWorkflow: {
        artworkStatus: 'draft',
      }
    },
    {
      job_id: "JOB-2024-005",
      client_name: "สถาบัน JKL",
      job_type: "ป้ายจารึก",
      assignee: "ดีไซเนอร์ B",
      assigned_at: "2024-02-15",
      due_date: "2024-12-20",
      status: "ผลิตชิ้นงาน",
      progress: 90,
      has_artwork: true,
      internal_notes: "อยู่ระหว่างผลิต",
      specs: "ป้ายทองเหลือง 20x30cm",
      designWorkflow: {
        googleDriveLink: "https://drive.google.com/file/d/jkl012",
        layoutImage: "/placeholder.svg",
        artworkImage: "/placeholder.svg",
        artworkStatus: 'approved',
        productionArtwork: "/placeholder.svg",
        aiFile: "label_design.ai",
      }
    },
    {
      job_id: "JOB-2024-006",
      client_name: "บริษัท MNO",
      job_type: "สติกเกอร์",
      assignee: "ดีไซเนอร์ C",
      assigned_at: "2024-03-01",
      due_date: "2024-12-15",
      status: "รับงานแล้ว",
      progress: 10,
      has_artwork: false,
      internal_notes: "รอเริ่มงาน",
      specs: "สติกเกอร์ไดคัท 5x5cm",
      designWorkflow: {
        artworkStatus: 'draft',
      }
    }
  ]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, cardFilter, colJobId, colClient, colJobType, colAssignee, colStatus]);

  const getArtworkStatusBadge = (status?: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">ร่าง</Badge>;
      case 'pending_review': return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">รอตรวจ</Badge>;
      case 'approved': return <Badge className="bg-green-500 hover:bg-green-600 text-white">แบบผ่าน</Badge>;
      case 'rejected': return <Badge variant="destructive">แบบไม่ผ่าน</Badge>;
      default: return <Badge variant="secondary">-</Badge>;
    }
  };

  const calculateDaysLeft = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDaysLeftBadge = (daysLeft: number) => {
    if (daysLeft < 0) return <Badge className="bg-red-500 hover:bg-red-600 text-white">เกิน {Math.abs(daysLeft)} วัน</Badge>;
    if (daysLeft <= 2) return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">เหลือ {daysLeft} วัน</Badge>;
    return <Badge className="bg-green-500 hover:bg-green-600 text-white">เหลือ {daysLeft} วัน</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      "รับงานแล้ว": "bg-gray-500 hover:bg-gray-600",
      "กำลังดำเนินการ": "bg-blue-500 hover:bg-blue-600",
      "รอตรวจสอบ": "bg-orange-500 hover:bg-orange-600",
      "ผลิตชิ้นงาน": "bg-cyan-500 hover:bg-cyan-600",
      "เสร็จสิ้น": "bg-green-500 hover:bg-green-600",
      "ล่าช้า": "bg-red-500 hover:bg-red-600",
    };
    return <Badge className={`${colors[status] || ""} text-white`}>{status}</Badge>;
  };

  const formatThaiDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  };

  // Stats
  const totalJobs = jobs.length;
  const inProgressJobs = jobs.filter(j => j.status === "กำลังดำเนินการ").length;
  const reviewJobs = jobs.filter(j => j.status === "รอตรวจสอบ").length;
  const productionJobs = jobs.filter(j => j.status === "ผลิตชิ้นงาน").length;
  const completedJobs = jobs.filter(j => j.status === "เสร็จสิ้น").length;
  const delayedJobs = jobs.filter(j => {
    const dueDate = new Date(j.due_date);
    return dueDate < new Date() && j.status !== "เสร็จสิ้น";
  }).length;

  // Unique values for column filters
  const uniqueJobTypes = [...new Set(jobs.map(j => j.job_type))];
  const uniqueAssignees = [...new Set(jobs.map(j => j.assignee))];
  const uniqueStatuses = [...new Set(jobs.map(j => j.status))];

  // Filtering
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      // Card filter
      if (cardFilter) {
        const isDelayed = new Date(job.due_date) < new Date() && job.status !== "เสร็จสิ้น";
        const match = (() => {
          switch (cardFilter) {
            case "all": return true;
            case "designing": return job.status === "กำลังดำเนินการ";
            case "review": return job.status === "รอตรวจสอบ";
            case "production": return job.status === "ผลิตชิ้นงาน";
            case "completed": return job.status === "เสร็จสิ้น";
            case "delayed": return isDelayed;
            default: return true;
          }
        })();
        if (!match) return false;
      }

      // Deep search
      if (searchTerm && !deepSearch(job, searchTerm)) return false;

      // Column filters
      if (colJobId && !job.job_id.toLowerCase().includes(colJobId.toLowerCase())) return false;
      if (colClient && !job.client_name.toLowerCase().includes(colClient.toLowerCase())) return false;
      if (colJobType && job.job_type !== colJobType) return false;
      if (colAssignee && job.assignee !== colAssignee) return false;
      if (colStatus && job.status !== colStatus) return false;

      return true;
    });
  }, [jobs, searchTerm, cardFilter, colJobId, colClient, colJobType, colAssignee, colStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(start, start + itemsPerPage);
  }, [filteredJobs, currentPage, itemsPerPage]);

  const hasActiveFilters = searchTerm || cardFilter || colJobId || colClient || colJobType || colAssignee || colStatus;

  const clearAllFilters = () => {
    setSearchTerm("");
    setCardFilter(null);
    setColJobId("");
    setColClient("");
    setColJobType("");
    setColAssignee("");
    setColStatus("");
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ["รหัสงาน", "ชื่อลูกค้า", "ประเภทงาน", "ผู้รับผิดชอบ", "วันที่รับงาน", "กำหนดส่ง", "สถานะ", "ความคืบหน้า(%)"];
    const rows = filteredJobs.map(j => [
      j.job_id, j.client_name, j.job_type, j.assignee,
      formatThaiDate(j.assigned_at), formatThaiDate(j.due_date),
      j.status, String(j.progress)
    ]);
    const csvContent = "\uFEFF" + [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `design-tracking-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const renderStepTracker = (currentStatus: string) => {
    const currentIndex = workflowSteps.findIndex(step => step.key === currentStatus);
    return (
      <div className="flex items-center justify-between w-full gap-2">
        {workflowSteps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isActive ? isCurrent ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" : "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {isActive ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                </div>
                <span className={`text-[10px] mt-1 text-center ${isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step.label}</span>
              </div>
              {index < workflowSteps.length - 1 && (
                <div className={`h-[2px] flex-1 -mt-6 ${index < currentIndex ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDetailDialog = (job: JobTracking) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-1" />ดูรายละเอียด</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>รายละเอียดงาน {job.job_id}</DialogTitle>
          <DialogDescription>{job.client_name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Step Tracker */}
          <div className="pb-4 border-b">{renderStepTracker(job.status)}</div>

          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-sm text-muted-foreground">ประเภทงาน</span><p className="font-medium">{job.job_type}</p></div>
            <div><span className="text-sm text-muted-foreground">ผู้รับผิดชอบ</span><p className="font-medium">{job.assignee}</p></div>
            <div><span className="text-sm text-muted-foreground">วันที่รับงาน</span><p className="font-medium">{formatThaiDate(job.assigned_at)}</p></div>
            <div><span className="text-sm text-muted-foreground">กำหนดส่ง</span><p className="font-medium">{formatThaiDate(job.due_date)}</p></div>
          </div>
          <div><span className="text-sm text-muted-foreground">สถานะ</span><div className="mt-2">{getStatusBadge(job.status)}</div></div>
          <div><span className="text-sm text-muted-foreground">ความคืบหน้า</span><div className="mt-2 space-y-2"><Progress value={job.progress} /><p className="text-sm font-medium">{job.progress}%</p></div></div>

          {/* Design Workflow Section */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="font-semibold text-base">รับออกแบบ</h3>
            
            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <h4 className="font-medium text-sm">1. เริ่มวางแบบ</h4>
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">ลิงก์ Google Drive</span>
                <div className="flex items-center gap-2 p-2 bg-background rounded border">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  {job.designWorkflow?.googleDriveLink ? (
                    <a href={job.designWorkflow.googleDriveLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate">{job.designWorkflow.googleDriveLink}</a>
                  ) : <span className="text-sm text-muted-foreground">ยังไม่มีลิงก์</span>}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">รูปวางแบบ</span>
                <div className="w-full h-32 border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                  {job.designWorkflow?.layoutImage ? <img src={job.designWorkflow.layoutImage} alt="Layout" className="w-full h-full object-contain" /> : <div className="flex flex-col items-center text-muted-foreground"><ImageIcon className="h-8 w-8 mb-1" /><span className="text-xs">ตัวอย่างรูปวางแบบ</span></div>}
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
              <div className="flex items-center justify-between"><h4 className="font-medium text-sm">2. Artwork</h4>{getArtworkStatusBadge(job.designWorkflow?.artworkStatus)}</div>
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground">รูป Artwork</span>
                <div className="w-full h-32 border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                  {job.designWorkflow?.artworkImage ? <img src={job.designWorkflow.artworkImage} alt="Artwork" className="w-full h-full object-contain" /> : <div className="flex flex-col items-center text-muted-foreground"><ImageIcon className="h-8 w-8 mb-1" /><span className="text-xs">ตัวอย่างรูป Artwork</span></div>}
                </div>
              </div>
            </div>

            <div className={`space-y-3 p-4 border rounded-lg bg-muted/20 relative ${job.designWorkflow?.artworkStatus !== 'approved' ? 'opacity-50' : ''}`}>
              {job.designWorkflow?.artworkStatus !== 'approved' && (
                <div className="absolute inset-0 bg-muted/30 rounded-lg flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-muted-foreground bg-background px-3 py-1.5 rounded-lg shadow-sm border text-xs"><Lock className="h-3 w-3" /><span>รอ Artwork ผ่านการอนุมัติก่อน</span></div>
                </div>
              )}
              <h4 className="font-medium text-sm">3. ไฟล์สั่งผลิต</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">แนบ Artwork</span>
                  <div className="w-full h-24 border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                    {job.designWorkflow?.productionArtwork ? <img src={job.designWorkflow.productionArtwork} alt="Production" className="w-full h-full object-contain" /> : <div className="flex flex-col items-center text-muted-foreground"><ImageIcon className="h-6 w-6 mb-1" /><span className="text-[10px]">รอไฟล์</span></div>}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground">แนบไฟล์ AI</span>
                  <div className="w-full h-24 border rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center">
                    {job.designWorkflow?.aiFile ? <div className="flex flex-col items-center text-foreground"><FileText className="h-6 w-6 mb-1 text-primary" /><span className="text-xs font-medium truncate max-w-[100px]">{job.designWorkflow.aiFile}</span></div> : <div className="flex flex-col items-center text-muted-foreground"><FileText className="h-6 w-6 mb-1" /><span className="text-[10px]">ตัวอย่างไฟล์ AI</span></div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ดูและติดตามสถานะงาน</h1>
        <p className="text-muted-foreground">ติดตามความคืบหน้าของงานออกแบบทั้งหมด</p>
      </div>

      {/* Interactive KPI Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        {[
          { key: "all", title: "งานทั้งหมด", value: totalJobs, gradient: "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900" },
          { key: "designing", title: "กำลังออกแบบ", value: inProgressJobs, gradient: "from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900" },
          { key: "review", title: "รอตรวจแบบ", value: reviewJobs, gradient: "from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900" },
          { key: "production", title: "ส่งผลิต", value: productionJobs, gradient: "from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900" },
          { key: "completed", title: "ปิดงาน", value: completedJobs, gradient: "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900" },
          { key: "delayed", title: "ล่าช้า", value: delayedJobs, gradient: "from-red-50 to-red-100 dark:from-red-950 dark:to-red-900" },
        ].map(card => (
          <div
            key={card.key}
            onClick={() => setCardFilter(cardFilter === card.key ? null : card.key)}
            className={`cursor-pointer transition-all duration-200 ${cardFilter === card.key ? "ring-2 ring-primary shadow-lg scale-[1.02]" : "hover:shadow-md"}`}
          >
            <StatsCard
              title={card.title}
              value={card.value}
              icon={<FileText className="h-4 w-4" />}
              className={`bg-gradient-to-br ${card.gradient}`}
            />
          </div>
        ))}
      </div>

      {/* Search & Export Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาทุกฟิลด์ (รหัสงาน, ลูกค้า, สเปค, หมายเหตุ)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-destructive hover:text-destructive">
            <X className="h-4 w-4" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {/* Active filter indicator */}
      {cardFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">กรองตาม:</span>
          <Badge variant="secondary" className="gap-1">
            {cardFilter === "all" ? "งานทั้งหมด" : cardFilter === "designing" ? "กำลังออกแบบ" : cardFilter === "review" ? "รอตรวจแบบ" : cardFilter === "production" ? "ส่งผลิต" : cardFilter === "completed" ? "ปิดงาน" : "ล่าช้า"}
            <X className="h-3 w-3 cursor-pointer" onClick={() => setCardFilter(null)} />
          </Badge>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-center whitespace-nowrap">รหัสงาน</TableHead>
                  <TableHead className="text-center whitespace-nowrap">ชื่อลูกค้า</TableHead>
                  <TableHead className="text-center whitespace-nowrap">ประเภทงาน</TableHead>
                  <TableHead className="text-center whitespace-nowrap">ผู้รับผิดชอบ</TableHead>
                  <TableHead className="text-center whitespace-nowrap">วันที่รับงาน</TableHead>
                  <TableHead className="text-center whitespace-nowrap">กำหนดส่ง</TableHead>
                  <TableHead className="text-center whitespace-nowrap">สถานะ</TableHead>
                  <TableHead className="text-center whitespace-nowrap">ความคืบหน้า</TableHead>
                  <TableHead className="text-center whitespace-nowrap">การจัดการ</TableHead>
                </TableRow>
                {/* Column Filters */}
                <TableRow>
                  <TableHead><Input placeholder="ค้นหา..." value={colJobId} onChange={e => setColJobId(e.target.value)} className="h-8 text-xs" /></TableHead>
                  <TableHead><Input placeholder="ค้นหา..." value={colClient} onChange={e => setColClient(e.target.value)} className="h-8 text-xs" /></TableHead>
                  <TableHead>
                    <Select value={colJobType} onValueChange={v => setColJobType(v === "all" ? "" : v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="ทั้งหมด" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">ทั้งหมด</SelectItem>{uniqueJobTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead>
                    <Select value={colAssignee} onValueChange={v => setColAssignee(v === "all" ? "" : v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="ทั้งหมด" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">ทั้งหมด</SelectItem>{uniqueAssignees.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead />
                  <TableHead />
                  <TableHead>
                    <Select value={colStatus} onValueChange={v => setColStatus(v === "all" ? "" : v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="ทั้งหมด" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">ทั้งหมด</SelectItem>{uniqueStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead />
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedJobs.length > 0 ? paginatedJobs.map(job => {
                  const daysLeft = calculateDaysLeft(job.due_date);
                  const isDelayed = daysLeft < 0 && job.status !== "เสร็จสิ้น";
                  return (
                    <TableRow key={job.job_id} className={`text-center whitespace-nowrap ${isDelayed ? "bg-destructive/10 border-l-4 border-l-destructive" : ""}`}>
                      <TableCell className="font-mono text-center">
                        <a
                          href={`/design/tracking/${job.job_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline hover:text-blue-800 cursor-pointer"
                        >
                          {highlightText(job.job_id, searchTerm)}
                        </a>
                      </TableCell>
                      <TableCell className="text-center">{highlightText(job.client_name, searchTerm)}</TableCell>
                      <TableCell className="text-center">{highlightText(job.job_type, searchTerm)}</TableCell>
                      <TableCell className="text-center">{highlightText(job.assignee, searchTerm)}</TableCell>
                      <TableCell className="text-center">{formatThaiDate(job.assigned_at)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {formatThaiDate(job.due_date)}
                          {getDaysLeftBadge(daysLeft)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2 justify-center min-w-[120px]">
                          <Progress value={job.progress} className="h-2 flex-1" />
                          <span className="text-xs font-bold text-primary">{job.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{renderDetailDialog(job)}</TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50 text-muted-foreground" />
                      <p className="text-muted-foreground">ไม่พบข้อมูลที่ตรงกับตัวกรอง</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredJobs.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>แสดง</span>
                <Select value={String(itemsPerPage)} onValueChange={v => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-8 w-[70px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{[5, 10, 20, 50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                </Select>
                <span>จาก {filteredJobs.length} รายการ</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>«</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>‹</Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) { page = i + 1; }
                  else if (currentPage <= 3) { page = i + 1; }
                  else if (currentPage >= totalPages - 2) { page = totalPages - 4 + i; }
                  else { page = currentPage - 2 + i; }
                  return (
                    <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="min-w-[32px]">{page}</Button>
                  );
                })}
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>›</Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>»</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
