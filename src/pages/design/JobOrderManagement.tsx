import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Search,
  Filter,
  Clock,
  AlertCircle,
  ChevronDown,
  FileText,
  Copy,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { JobUpdateDrawer } from "@/components/design/JobUpdateDrawer";
import { JobDetailDrawer } from "@/components/design/JobDetailDrawer";
import { designJobService } from "@/services/designJobService";

const API_BASE_URL = "https://nacres.co.th/api-lucky/admin";

interface JobOrder {
  id?: number;
  job_id: string;
  client_name: string;
  customer_id?: number | null;
  job_type: string;
  product_category?: string;
  sales_product_category?: string;
  order_product_category?: string;
  product_type?: string;
  product_type_label?: string;
  product_type_display?: string;
  product_type_raw?: string;
  order_product_type?: string;
  urgency: "เร่งด่วน 3-5 ชั่วโมง" | "ด่วน 1 วัน" | "ด่วน 2 วัน" | "ปกติ";
  due_date: string;
  order_date: string;
  status:
    | "รอรับงาน"
    | "รับงานแล้ว"
    | "กำลังดำเนินการ"
    | "รอตรวจสอบ"
    | "แก้ไข"
    | "ผลิตชิ้นงาน"
    | "เสร็จสิ้น";
  assignee?: string;
  assigned_at?: string;
  started_at?: string;
  revision_rounds?: number;
  ordered_by?: string;
  quotation_no?: string;
  description?: string;
  google_drive_link?: string;
  layout_image?: string;
  artwork_image?: string;
  artwork_status?: "draft" | "pending_review" | "approved" | "rejected";
  production_artwork?: string;
  ai_file?: string;
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

const UNASSIGNED_ASSIGNEE_VALUE = "__unassigned__";

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  readymade: "สินค้าสำเร็จรูป",
  catalog: "สินค้าสำเร็จรูป",
  custom: "สินค้าสั่งผลิต",
  estimate: "สินค้าสั่งผลิต",
  "made-to-order": "สินค้าสั่งผลิต",
  textile: "สินค้าสั่งผลิต",
  items: "สินค้าสั่งผลิต",
  lanyard: "สินค้าสั่งผลิต",
  premium: "สินค้าสั่งผลิต",
};

const KNOWN_PRODUCT_TYPE_LABELS = [
  "สินค้าสำเร็จรูป",
  "สินค้าสั่งผลิต",
  "เหรียญสำเร็จรูป",
  "เหรียญสั่งผลิต",
  "ถ้วยรางวัล",
  "โล่",
  "โล่สั่งผลิต",
  "ป้ายจารึก",
  "โล่/ถ้วย/คริสตัล",
  "สายคล้อง",
  "เข็มกลัด",
  "คริสตัล",
  "อะคริลิค",
  "เสื้อ",
  "บิบ",
];

const PRODUCT_TYPE_KEYWORDS: Array<[string, string]> = [
  ["ready", "สินค้าสำเร็จรูป"],
  ["สำเร็จ", "สินค้าสำเร็จรูป"],
  ["custom", "สินค้าสั่งผลิต"],
  ["สั่งผลิต", "สินค้าสั่งผลิต"],
  ["medal", "เหรียญสั่งผลิต"],
  ["เหรียญ", "เหรียญสั่งผลิต"],
  ["trophy", "ถ้วยรางวัล"],
  ["ถ้วย", "ถ้วยรางวัล"],
  ["plaque", "โล่"],
  ["award", "โล่"],
  ["โล่", "โล่"],
  ["ป้าย", "ป้ายจารึก"],
  ["lanyard", "สายคล้อง"],
  ["สายคล้อง", "สายคล้อง"],
  ["pin", "เข็มกลัด"],
  ["เข็มกลัด", "เข็มกลัด"],
  ["crystal", "คริสตัล"],
  ["คริสตัล", "คริสตัล"],
  ["acrylic", "อะคริลิค"],
  ["อะคริลิค", "อะคริลิค"],
  ["shirt", "เสื้อ"],
  ["เสื้อ", "เสื้อ"],
  ["bib", "บิบ"],
  ["บิบ", "บิบ"],
];

const cleanDisplayValue = (value: unknown) => {
  const text = String(value ?? "").trim();
  const key = text.toLowerCase();
  return ["", "0", "-", "null", "undefined", "n/a", "internal"].includes(key)
    ? ""
    : text;
};

const normalizeProductCategoryText = (value: unknown) => {
  const text = cleanDisplayValue(value);
  const key = text.toLowerCase();
  if (!text) return "";
  if (["สินค้าสำเร็จรูป", "สินค้าสั่งผลิต"].includes(text)) return text;
  if (PRODUCT_TYPE_LABELS[key]) return PRODUCT_TYPE_LABELS[key];
  if (key.includes("สำเร็จ")) return "สินค้าสำเร็จรูป";
  if (key.includes("สั่งผลิต") || key.includes("custom")) return "สินค้าสั่งผลิต";
  return "";
};

const normalizeKnownProductTypeText = (value: unknown) => {
  const text = cleanDisplayValue(value);
  const key = text.toLowerCase();
  if (!text || /^\d+$/.test(text)) return "";
  if (KNOWN_PRODUCT_TYPE_LABELS.includes(text)) return text;
  if (PRODUCT_TYPE_LABELS[key]) return PRODUCT_TYPE_LABELS[key];

  const matched = PRODUCT_TYPE_KEYWORDS.find(([keyword]) =>
    key.includes(keyword.toLowerCase())
  );
  return matched?.[1] || "";
};

const normalizeExplicitProductTypeText = (value: unknown) => {
  const text = cleanDisplayValue(value);
  return normalizeKnownProductTypeText(text) || text;
};

const getProductTypeDisplay = (job: JobOrder): string => {
  return (
    normalizeProductCategoryText(job.product_category) ||
    normalizeProductCategoryText(job.sales_product_category) ||
    normalizeProductCategoryText(job.order_product_category) ||
    normalizeKnownProductTypeText(job.product_type_display) ||
    normalizeKnownProductTypeText(job.product_type_label) ||
    normalizeExplicitProductTypeText(job.product_type) ||
    normalizeExplicitProductTypeText(job.order_product_type) ||
    normalizeKnownProductTypeText(job.product_type_raw) ||
    normalizeKnownProductTypeText(job.job_type) ||
    "-"
  );
};

const fetchOrderProductLookup = async () => {
  const ordersByJobId = new Map<string, any>();

  try {
    const orderRes = await fetch(
      `${API_BASE_URL}/orders.php?limit=100&fields=job_product`
    );
    const orderJson = await orderRes.json();

    if (orderJson?.status === "success" && Array.isArray(orderJson.data)) {
      orderJson.data.forEach((order: any) => {
        const key = String(order.job_id || order.order_id || "").trim();
        if (key) ordersByJobId.set(key, order);
      });
    }
  } catch (orderError) {
    console.warn("Unable to load order product fallback", orderError);
  }

  return ordersByJobId;
};

export default function JobOrderManagement() {
  const [jobs, setJobs] = useState<JobOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [designerOptions, setDesignerOptions] = useState<string[]>([]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await designJobService.getJobs();
      if (res.status === "success") {
        const ordersByJobId = await fetchOrderProductLookup();
        const mapped: JobOrder[] = (res.data || []).map((j: any) => {
          const jobId = j.job_id || j.job_code;
          const linkedOrder = ordersByJobId.get(String(jobId || "").trim()) || {};
          const productCategory =
            normalizeProductCategoryText(j.product_category) ||
            normalizeProductCategoryText(linkedOrder.product_category) ||
            normalizeProductCategoryText(j.order_product_category) ||
            normalizeProductCategoryText(j.sales_product_category);
          const salesProductCategory = normalizeProductCategoryText(j.sales_product_category);
          const orderProductCategory =
            normalizeProductCategoryText(linkedOrder.product_category) ||
            normalizeProductCategoryText(j.order_product_category);
          const productType =
            cleanDisplayValue(linkedOrder.product_type) ||
            cleanDisplayValue(j.product_type) ||
            cleanDisplayValue(j.order_product_type);
          const orderProductType =
            cleanDisplayValue(linkedOrder.product_type) ||
            cleanDisplayValue(j.order_product_type);
          const productTypeRaw = cleanDisplayValue(
            j.product_type_raw || productType || orderProductType
          );
          const productTypeDisplay = getProductTypeDisplay({
            ...j,
            product_category: productCategory,
            sales_product_category: salesProductCategory,
            order_product_category: orderProductCategory,
            product_type: productType,
            order_product_type: orderProductType,
            product_type_display: j.product_type_display,
            product_type_raw: productTypeRaw,
          });

          return {
            ...j,
            job_id: jobId,
            assignee: cleanDisplayValue(j.assignee || j.designer),
            product_category: productCategory,
            sales_product_category: salesProductCategory,
            order_product_category: orderProductCategory,
            product_type: productType,
            order_product_type: orderProductType,
            product_type_display: productTypeDisplay,
            product_type_raw: productTypeRaw,
          };
        });
        setJobs(mapped);
      }
    } catch (e) {
      toast.error("ไม่สามารถดึงข้อมูลงานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchDesigners = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/employees.php?department=${encodeURIComponent("ฝ่ายกราฟฟิก")}`);
        const json = await res.json();
        const names = Array.isArray(json?.data)
          ? json.data
              .filter((emp: any) => String(emp.is_active ?? "1") !== "0")
              .map((emp: any) => cleanDisplayValue(emp.full_name || emp.nickname || emp.code))
              .filter(Boolean)
          : [];
        setDesignerOptions(Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "th-TH")));
      } catch (error) {
        console.error("Failed to fetch designers", error);
        setDesignerOptions([]);
      }
    };

    fetchDesigners();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJobType, setFilterJobType] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOrder | null>(null);
  const [assignmentType, setAssignmentType] = useState<"random" | "select">(
    "random"
  );
  const [selectedDesigner, setSelectedDesigner] = useState<string>("");
  const [isFilesDrawerOpen, setIsFilesDrawerOpen] = useState(false);
  const [selectedJobForFiles, setSelectedJobForFiles] =
    useState<JobOrder | null>(null);
  const [portfolioFiles, setPortfolioFiles] = useState<
    { id: number; name: string; version: string; file_url: string; created_at: string }[]
  >([]);

  useEffect(() => {
    if (!isFilesDrawerOpen || !selectedJobForFiles?.customer_id) {
      setPortfolioFiles([]);
      return;
    }
    fetch(`https://nacres.co.th/api-lucky/admin/customer_design_files.php?customer_id=${selectedJobForFiles.customer_id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.status === "success" && Array.isArray(json.data)) {
          setPortfolioFiles(json.data);
        }
      })
      .catch((err) => console.warn("Failed to fetch design files", err));
  }, [isFilesDrawerOpen, selectedJobForFiles?.customer_id]);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedJobForUpdate, setSelectedJobForUpdate] =
    useState<JobOrder | null>(null);
  const [isJobDetailDrawerOpen, setIsJobDetailDrawerOpen] = useState(false);
  const [selectedJobForDetail, setSelectedJobForDetail] =
    useState<JobOrder | null>(null);
  const [jobDetailMode, setJobDetailMode] = useState<
    "assign" | "action" | "view"
  >("view");

  const designers = useMemo(() => {
    const assignedNames = jobs
      .map((job) => cleanDisplayValue(job.assignee))
      .filter(Boolean);
    return Array.from(new Set([...designerOptions, ...assignedNames])).sort((a, b) =>
      a.localeCompare(b, "th-TH")
    );
  }, [designerOptions, jobs]);

  const productTypeOptions = useMemo(() => {
    const values = jobs
      .map((job) => getProductTypeDisplay(job))
      .filter((value) => value && value !== "-");
    return Array.from(new Set(values)).sort((a, b) =>
      a.localeCompare(b, "th-TH")
    );
  }, [jobs]);

  const assigneeOptions = useMemo(() => {
    const values = jobs
      .map((job) => cleanDisplayValue(job.assignee))
      .filter(Boolean);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, "th-TH"));
  }, [jobs]);

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
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600">{urgency}</Badge>
        );
      case "ด่วน 2 วัน":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">{urgency}</Badge>
        );
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
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">{status}</Badge>
        );
      case "รอตรวจสอบ":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">{status}</Badge>
        );
      case "แก้ไข":
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600">{status}</Badge>
        );
      case "ผลิตชิ้นงาน":
        return (
          <Badge className="bg-green-500 hover:bg-green-600">{status}</Badge>
        );
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

  const handleConfirmAssignment = async () => {
    if (!selectedJob) return;

    let assignee = selectedDesigner;
    if (assignmentType === "random") {
      if (designers.length === 0) {
        toast.error("ไม่พบรายชื่อพนักงานฝ่ายกราฟฟิก");
        return;
      }
      assignee = designers[Math.floor(Math.random() * designers.length)];
    } else if (!assignee) {
      toast.error("กรุณาเลือกพนักงาน");
      return;
    }

    try {
      await designJobService.updateJob(selectedJob.id!, {
        designer: assignee,
        status: "รับงานแล้ว",
        assigned_at: new Date().toISOString(),
      });
      toast.success(
        `มอบหมายงาน ${selectedJob.job_id} ให้ ${assignee} เรียบร้อยแล้ว`
      );
      fetchJobs();
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการมอบหมายงาน");
    }

    setIsAssignDialogOpen(false);
    setSelectedJob(null);
    setAssignmentType("random");
  };

  const handleStartJob = async (jobId: string, id?: number) => {
    if (!id) return;
    try {
      await designJobService.updateJob(id, {
        status: "กำลังดำเนินการ",
        started_at: new Date().toISOString(),
      });
      toast.success(`เริ่มทำงาน ${jobId} เรียบร้อยแล้ว`);
      fetchJobs();
    } catch (e) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const syncOrderStatusByJobCode = async (jobId: string, orderStatus: string) => {
    const response = await fetch(`${API_BASE_URL}/orders.php?job_id=${encodeURIComponent(jobId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_status: orderStatus }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.status === "error") {
      throw new Error(json.message || "Update order status failed");
    }
  };

  const handleSubmitForReview = async (jobId: string, id?: number) => {
    if (!id) return;
    try {
      await designJobService.updateJob(id, {
        status: "รอตรวจสอบ",
        artwork_status: "pending_review",
      });
      await syncOrderStatusByJobCode(jobId, "รอเซลล์ตรวจแบบป้าย");
      toast.success(`ส่งงาน ${jobId} เพื่อตรวจสอบเรียบร้อยแล้ว`);
      fetchJobs();
    } catch (e) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleOpenUpdateDialog = (job: JobOrder) => {
    setSelectedJobForUpdate(job);
    setIsUpdateDialogOpen(true);
  };

  const handleUpdateJobSubmit = async (data: any) => {
    if (!selectedJobForUpdate?.id) return;
    try {
      const updatePayload = { ...data };
      const getLatestFileUrl = (logs?: any[]) => logs?.[0]?.previewUrl || logs?.[0]?.fileUrl || logs?.[0]?.url;

      if (data.googleDriveLink !== undefined) updatePayload.google_drive_link = data.googleDriveLink;
      if (data.artworkStatus) updatePayload.artwork_status = data.artworkStatus;
      const layoutImage = getLatestFileUrl(data.layoutLogs);
      const artworkImage = getLatestFileUrl(data.artworkLogs);
      const productionArtwork = getLatestFileUrl(data.productionArtworkLogs);
      const aiFile = getLatestFileUrl(data.aiFileLogs);
      if (layoutImage) updatePayload.layout_image = layoutImage;
      if (artworkImage) updatePayload.artwork_image = artworkImage;
      if (productionArtwork) updatePayload.production_artwork = productionArtwork;
      if (aiFile) updatePayload.ai_file = aiFile;

      // Auto-progress status based on data
      if (data.isFinished) {
        updatePayload.status = "เสร็จสิ้น";
        updatePayload.finish_date = new Date().toISOString();
      } else if (
        data.aiFileLogs?.length > 0 ||
        data.productionArtworkLogs?.length > 0
      ) {
        updatePayload.status = "ผลิตชิ้นงาน";
      } else if (data.artworkStatus === "pending_review") {
        updatePayload.status = "รอตรวจสอบ";
      } else if (data.artworkStatus === "rejected") {
        updatePayload.status = "แก้ไข";
      } else if (data.layoutLogs?.length > 0) {
        updatePayload.status = "กำลังดำเนินการ";
        if (selectedJobForUpdate.status === "รับงานแล้ว") {
          updatePayload.started_at = new Date().toISOString();
        }
      } else if (selectedJobForUpdate.status === "รับงานแล้ว") {
        // Fallback for explicitly picking "ลงข้อมูลเริ่มงาน" with no files
        updatePayload.status = "กำลังดำเนินการ";
        updatePayload.started_at = new Date().toISOString();
      }

      await designJobService.updateJob(selectedJobForUpdate.id, updatePayload);
      if (data.artworkStatus === "pending_review") {
        await syncOrderStatusByJobCode(selectedJobForUpdate.job_id, "รอเซลล์ตรวจแบบป้าย");
      } else if (data.artworkStatus === "rejected") {
        await syncOrderStatusByJobCode(selectedJobForUpdate.job_id, "รอกราฟิกแก้ไขแบบป้าย");
      } else if (data.artworkStatus === "approved") {
        await syncOrderStatusByJobCode(selectedJobForUpdate.job_id, "ไฟล์ผลิตพร้อมสั่งผลิต");
      }
      toast.success(`อัพเดทงาน ${selectedJobForUpdate.job_id} เรียบร้อยแล้ว`);
      setIsUpdateDialogOpen(false);
      setSelectedJobForUpdate(null);
      fetchJobs();
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการอัปเดต");
    }
  };

  const handleViewAllFiles = (job: JobOrder) => {
    setSelectedJobForFiles(job);
    setIsFilesDrawerOpen(true);
  };

  const handleDuplicateJob = (job: JobOrder) => {
    toast.success(`คัดลอกงาน ${job.job_id} เป็นงานใหม่เรียบร้อยแล้ว`);
  };

  const handleOpenJobDetailDrawer = (
    job: JobOrder,
    mode: "assign" | "action" | "view" = "view"
  ) => {
    setSelectedJobForDetail(job);
    setJobDetailMode(mode);
    setIsJobDetailDrawerOpen(true);
  };

  const renderJobIdButton = (
    job: JobOrder,
    mode: "assign" | "action" | "view" = "view"
  ) => (
    <button
      type="button"
      onClick={() => handleOpenJobDetailDrawer(job, mode)}
      className="text-primary hover:underline font-medium cursor-pointer"
    >
      {job.job_id}
    </button>
  );

  const handleAssignJob = async (employeeId: string) => {
    if (selectedJobForDetail?.id) {
      try {
        await designJobService.updateJob(selectedJobForDetail.id, {
          designer: employeeId,
          status: "รับงานแล้ว",
          assigned_at: new Date().toISOString(),
        });
        toast.success(
          `มอบหมายงาน ${selectedJobForDetail.job_id} ให้ ${employeeId} เรียบร้อยแล้ว`
        );
        fetchJobs();
        setIsJobDetailDrawerOpen(false);
      } catch (e) {
        toast.error("เกิดข้อผิดพลาด");
      }
    }
  };

  const handleStartJobFromDrawer = async () => {
    if (selectedJobForDetail?.id) {
      try {
        await designJobService.updateJob(selectedJobForDetail.id, {
          status: "กำลังดำเนินการ",
          started_at: new Date().toISOString(),
        });
        toast.success(
          `เริ่มทำงาน ${selectedJobForDetail.job_id} เรียบร้อยแล้ว`
        );
        fetchJobs();
        setIsJobDetailDrawerOpen(false);
      } catch (e) {
        toast.error("เกิดข้อผิดพลาด");
      }
    }
  };

  const handleRejectJob = async (reason: string) => {
    if (selectedJobForDetail?.id) {
      try {
        await designJobService.updateJob(selectedJobForDetail.id, {
          status: "รอรับงาน",
          feedback: reason,
          designer: null,
        });
        toast.info(
          `ปฏิเสธงาน ${selectedJobForDetail.job_id}\nเหตุผล: ${reason}\nข้อมูลจะถูกส่งกลับ`
        );
        fetchJobs();
        setIsJobDetailDrawerOpen(false);
      } catch (e) {
        toast.error("เกิดข้อผิดพลาด");
      }
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
    const headers = [
      "Job ID",
      "ชื่อลูกค้า",
      "ประเภทสินค้า",
      "ผู้รับผิดชอบ",
      "กำหนดส่ง",
      "วันที่เสร็จ",
      "ล่าช้า (วัน)",
      "รอบแก้ไข",
      "ข้อเสนอแนะ",
    ];
    const rows = data.map((job) => [
      job.job_id,
      job.client_name,
      getProductTypeDisplay(job),
      job.assignee || "-",
      new Date(job.due_date).toLocaleDateString("th-TH"),
      job.finish_date
        ? new Date(job.finish_date).toLocaleDateString("th-TH")
        : "-",
      job.finish_date ? calculateDelayDays(job.due_date, job.finish_date) : 0,
      job.revision_rounds || 0,
      job.feedback || "-",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `งานเสร็จสิ้น_${new Date().toLocaleDateString(
      "th-TH"
    )}.csv`;
    link.click();
    toast.success("ส่งออก CSV เรียบร้อยแล้ว");
  };

  // กรองข้อมูล
  const filterJobs = (jobs: JobOrder[]) => {
    return jobs.filter((job) => {
      const jobAssignee = cleanDisplayValue(job.assignee);
      const matchSearch =
        cleanDisplayValue(job.job_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        cleanDisplayValue(job.client_name).toLowerCase().includes(searchTerm.toLowerCase());
      const matchJobType =
        filterJobType === "all" || getProductTypeDisplay(job) === filterJobType;
      const matchAssignee =
        filterAssignee === "all" ||
        (filterAssignee === UNASSIGNED_ASSIGNEE_VALUE && !jobAssignee) ||
        jobAssignee === filterAssignee;
      return matchSearch && matchJobType && matchAssignee;
    });
  };

  const unassignedJobs = filterJobs(
    jobs.filter((j) => j.status === "รอรับงาน")
  );
  const acceptedNotStartedJobs = filterJobs(
    jobs.filter((j) => j.status === "รับงานแล้ว" && !j.started_at)
  );
  const inProgressJobs = filterJobs(
    jobs.filter((j) =>
      ["กำลังดำเนินการ", "รอตรวจสอบ", "แก้ไข", "ผลิตชิ้นงาน"].includes(j.status)
    )
  );
  const completedJobs = filterJobs(
    jobs.filter((j) => j.status === "เสร็จสิ้น")
  );

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
              <SelectValue placeholder="ประเภทสินค้า" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {productTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger>
              <SelectValue placeholder="ผู้รับผิดชอบ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {jobs.some((job) => !cleanDisplayValue(job.assignee)) && (
                <SelectItem value={UNASSIGNED_ASSIGNEE_VALUE}>ยังไม่มอบหมาย</SelectItem>
              )}
              {assigneeOptions.map((assignee) => (
                <SelectItem key={assignee} value={assignee}>
                  {assignee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setSearchTerm("");
              setFilterJobType("all");
              setFilterAssignee("all");
            }}
          >
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
                    <TableHead className="w-[120px] sticky left-0 bg-background text-center">
                      Job ID
                    </TableHead>
                    <TableHead className="text-center">ชื่อลูกค้า</TableHead>
                    <TableHead className="text-center">ประเภทสินค้า</TableHead>
                    <TableHead className="text-center">ความเร่งด่วน</TableHead>
                    <TableHead className="text-center">วันที่สั่งงาน</TableHead>
                    <TableHead className="text-center">กำหนดส่ง</TableHead>
                    <TableHead className="text-center">วันที่เหลือ</TableHead>
                    <TableHead className="sticky right-0 bg-background text-center">
                      การจัดการ
                    </TableHead>
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
                        } ${
                          job.urgency === "เร่งด่วน 3-5 ชั่วโมง"
                            ? "border-l-4 border-l-red-600"
                            : ""
                        }`}
                      >
                        <TableCell className="font-medium sticky left-0 bg-background whitespace-nowrap text-center">
                          {renderJobIdButton(job, "assign")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {job.client_name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {getProductTypeDisplay(job)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {getUrgencyBadge(job.urgency)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {new Date(job.order_date).toLocaleDateString("th-TH")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {new Date(job.due_date).toLocaleDateString("th-TH")}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={getDaysLeftColor(daysLeft)}>
                            {daysLeft < 0
                              ? `เกิน ${Math.abs(daysLeft)} วัน`
                              : `${daysLeft} วัน`}
                          </span>
                        </TableCell>
                        <TableCell className="sticky right-0 bg-background text-center">
                          <Button
                            size="sm"
                            onClick={() =>
                              handleOpenJobDetailDrawer(job, "assign")
                            }
                          >
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
                    <TableHead className="w-[120px] sticky left-0 bg-background text-center">
                      Job ID
                    </TableHead>
                    <TableHead className="text-center">ชื่อลูกค้า</TableHead>
                    <TableHead className="text-center">ประเภทสินค้า</TableHead>
                    <TableHead className="text-center">ผู้รับผิดชอบ</TableHead>
                    <TableHead className="text-center">รับงานเมื่อ</TableHead>
                    <TableHead className="text-center">กำหนดส่ง</TableHead>
                    <TableHead className="text-center">วันที่เหลือ</TableHead>
                    <TableHead className="text-center">รอมา (ชม.)</TableHead>
                    <TableHead className="sticky right-0 bg-background text-center">
                      การจัดการ
                    </TableHead>
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
                        } ${
                          job.urgency === "เร่งด่วน 3-5 ชั่วโมง"
                            ? "border-l-4 border-l-red-600"
                            : ""
                        }`}
                      >
                        <TableCell className="font-medium sticky left-0 bg-background whitespace-nowrap text-center">
                          {renderJobIdButton(job, "action")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {job.client_name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {getProductTypeDisplay(job)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {job.assignee}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {new Date(job.assigned_at!).toLocaleDateString(
                            "th-TH"
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {new Date(job.due_date).toLocaleDateString("th-TH")}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={getDaysLeftColor(daysLeft)}>
                            {daysLeft < 0
                              ? `เกิน ${Math.abs(daysLeft)} วัน`
                              : `${daysLeft} วัน`}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {idleHours > 24 && (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span
                              className={
                                idleHours > 24 ? "text-red-600 font-bold" : ""
                              }
                            >
                              {idleHours} ชม.
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="sticky right-0 bg-background text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleOpenUpdateDialog(job)}
                            >
                              ลงข้อมูลเริ่มงาน
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleOpenJobDetailDrawer(job, "action")
                              }
                            >
                              ดูรายละเอียด
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

        {/* แท็บ C: กำลังทำ/ติดตาม */}
        <TabsContent value="inprogress" className="space-y-4">
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] sticky left-0 bg-background text-center">
                      Job ID
                    </TableHead>
                    <TableHead className="text-center">ชื่อลูกค้า</TableHead>
                    <TableHead className="text-center">ประเภทสินค้า</TableHead>
                    <TableHead className="text-center">ผู้รับผิดชอบ</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="text-center">กำหนดส่ง</TableHead>
                    <TableHead className="text-center">วันที่เหลือ</TableHead>
                    <TableHead className="text-center">รอบแก้ไข</TableHead>
                    <TableHead className="sticky right-0 bg-background text-center">
                      การจัดการ
                    </TableHead>
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
                        } ${
                          job.urgency === "เร่งด่วน 3-5 ชั่วโมง"
                            ? "border-l-4 border-l-red-600"
                            : ""
                        }`}
                      >
                        <TableCell className="font-medium sticky left-0 bg-background whitespace-nowrap text-center">
                          {renderJobIdButton(job, "view")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {job.client_name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {getProductTypeDisplay(job)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {job.assignee}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {getStatusBadge(job.status)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {new Date(job.due_date).toLocaleDateString("th-TH")}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={getDaysLeftColor(daysLeft)}>
                            {daysLeft < 0
                              ? `เกิน ${Math.abs(daysLeft)} วัน`
                              : `${daysLeft} วัน`}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {job.revision_rounds || 0} รอบ
                          </Badge>
                        </TableCell>
                        <TableCell className="sticky right-0 bg-background text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleOpenJobDetailDrawer(job, "view")
                              }
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
            <Button
              onClick={() => exportToCSV(completedJobs)}
              variant="outline"
              size="sm"
            >
              Export CSV
            </Button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] sticky left-0 bg-background text-center">
                      Job ID
                    </TableHead>
                    <TableHead className="text-center">ชื่อลูกค้า</TableHead>
                    <TableHead className="text-center">ประเภทสินค้า</TableHead>
                    <TableHead className="text-center">ผู้รับผิดชอบ</TableHead>
                    <TableHead className="text-center">กำหนดส่ง</TableHead>
                    <TableHead className="text-center">วันที่เสร็จ</TableHead>
                    <TableHead className="text-center">ล่าช้า (วัน)</TableHead>
                    <TableHead className="text-center">รอบแก้ไข</TableHead>
                    <TableHead className="text-center">ข้อเสนอแนะ</TableHead>
                    <TableHead className="sticky right-0 bg-background text-center">
                      การจัดการ
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedJobs.map((job) => {
                    const delayDays = job.finish_date
                      ? calculateDelayDays(job.due_date, job.finish_date)
                      : 0;
                    const rowColorClass =
                      delayDays > 0 ? "bg-red-50 dark:bg-red-950/20" : "";

                    return (
                      <TableRow key={job.job_id} className={rowColorClass}>
                        <TableCell className="font-medium sticky left-0 bg-background whitespace-nowrap text-center">
                          {renderJobIdButton(job, "view")}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {job.client_name}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {getProductTypeDisplay(job)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {job.assignee}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {new Date(job.due_date).toLocaleDateString("th-TH", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-center">
                          {job.finish_date
                            ? new Date(job.finish_date).toLocaleDateString(
                                "th-TH",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                }
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={
                              delayDays > 0 ? "text-red-600 font-bold" : ""
                            }
                          >
                            {delayDays > 0 ? `+${delayDays}` : delayDays}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {job.revision_rounds || 0} รอบ
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-center">
                          {job.feedback || "-"}
                        </TableCell>
                        <TableCell className="sticky right-0 bg-background text-center">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              handleOpenJobDetailDrawer(job, "view")
                            }
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
                  <label className="text-sm font-medium text-muted-foreground">
                    Job ID
                  </label>
                  <p className="text-lg font-semibold">{selectedJob.job_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    ชื่อลูกค้า
                  </label>
                  <p className="text-lg">{selectedJob.client_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    ประเภทสินค้า
                  </label>
                  <p className="text-lg">{getProductTypeDisplay(selectedJob)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    ความเร่งด่วน
                  </label>
                  <div className="mt-1">
                    {getUrgencyBadge(selectedJob.urgency)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    วันที่สั่งงาน
                  </label>
                  <p className="text-lg">
                    {new Date(selectedJob.order_date).toLocaleDateString(
                      "th-TH"
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    วันที่ต้องส่งงาน
                  </label>
                  <p className="text-lg">
                    {new Date(selectedJob.due_date).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    วันที่เหลือ
                  </label>
                  <p
                    className={`text-lg ${getDaysLeftColor(
                      calculateDaysLeft(selectedJob.due_date)
                    )}`}
                  >
                    {calculateDaysLeft(selectedJob.due_date) < 0
                      ? `เกิน ${Math.abs(
                          calculateDaysLeft(selectedJob.due_date)
                        )} วัน`
                      : `${calculateDaysLeft(selectedJob.due_date)} วัน`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    ผู้สั่งงาน
                  </label>
                  <p className="text-lg">{selectedJob.ordered_by || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    ใบเสนอราคา
                  </label>
                  <p className="text-lg">{selectedJob.quotation_no || "-"}</p>
                </div>
                {selectedJob.assignee && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      ผู้รับงาน
                    </label>
                    <p className="text-lg">{selectedJob.assignee}</p>
                  </div>
                )}
              </div>

              {selectedJob.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    รายละเอียดงาน
                  </label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded-md">
                    {selectedJob.description}
                  </p>
                </div>
              )}

              {selectedJob.reference_images &&
                selectedJob.reference_images.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      รูปอ้างอิงจากลูกค้า ({selectedJob.reference_images.length}{" "}
                      รูป)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedJob.reference_images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-video rounded-md overflow-hidden bg-muted"
                        >
                          <img
                            src={img}
                            alt={`Reference ${idx + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(img, "_blank")}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {selectedJob.reference_files &&
                selectedJob.reference_files.length > 0 && (
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
                            <svg
                              className="w-4 h-4 text-primary"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
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
                <Select
                  value={selectedDesigner}
                  onValueChange={setSelectedDesigner}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกพนักงาน" />
                  </SelectTrigger>
                  <SelectContent>
                    {designers.length > 0 ? (
                      designers.map((designer) => (
                        <SelectItem key={designer} value={designer}>
                          {designer}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-designers" disabled>
                        ไม่พบรายชื่อพนักงานฝ่ายกราฟฟิก
                      </SelectItem>
                    )}
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
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleConfirmAssignment}>ยืนยันการมอบหมาย</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drawer สำหรับดูไฟล์ทั้งหมด */}
      <Drawer open={isFilesDrawerOpen} onOpenChange={setIsFilesDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              ไฟล์ทั้งหมดของงาน {selectedJobForFiles?.job_id}
            </DrawerTitle>
            <DrawerDescription>
              ดูและจัดการไฟล์ทั้งหมดที่เกี่ยวข้องกับงานนี้
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedJobForFiles && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Job ID
                    </label>
                    <p className="text-lg font-semibold">
                      {selectedJobForFiles.job_id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      ชื่อลูกค้า
                    </label>
                    <p className="text-lg">{selectedJobForFiles.client_name}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* ไฟล์อ้างอิงจากลูกค้า */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      ไฟล์อ้างอิงจากลูกค้า
                    </h3>
                    {selectedJobForFiles.reference_files &&
                    selectedJobForFiles.reference_files.length > 0 ? (
                      <div className="space-y-2">
                        {selectedJobForFiles.reference_files.map(
                          (file, idx) => (
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
                                  <p className="text-xs text-muted-foreground">
                                    อัพโหลดโดยลูกค้า
                                  </p>
                                </div>
                              </div>
                              <Button size="sm" variant="ghost">
                                ดาวน์โหลด
                              </Button>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">ไม่มีไฟล์อ้างอิง</p>
                    )}
                  </div>

                  {/* รูปอ้างอิงจากลูกค้า */}
                  {selectedJobForFiles.reference_images &&
                    selectedJobForFiles.reference_images.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3">
                          รูปอ้างอิงจากลูกค้า
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                          {selectedJobForFiles.reference_images.map(
                            (img, idx) => (
                              <div
                                key={idx}
                                className="relative aspect-video rounded-md overflow-hidden bg-muted group"
                              >
                                <img
                                  src={img}
                                  alt={`Reference ${idx + 1}`}
                                  className="w-full h-full object-cover cursor-pointer group-hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(img, "_blank")}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                                  รูปที่ {idx + 1}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* ไฟล์ผลงาน */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">ไฟล์ผลงาน</h3>
                    {portfolioFiles.length > 0 ? (
                      <div className="space-y-2">
                        {portfolioFiles.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 bg-muted rounded-md hover:bg-muted/80 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-500/10 rounded flex items-center justify-center">
                                <FileText className="w-5 h-5 text-blue-500" />
                              </div>
                              <div>
                                <p className="font-medium">{file.name} ({file.version})</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(file.created_at).toLocaleDateString("th-TH")}
                                </p>
                              </div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => window.open(file.file_url, "_blank")}>
                              ดาวน์โหลด
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-md">
                        ยังไม่มีไฟล์ผลงานสำหรับลูกค้ารายนี้
                      </p>
                    )}
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
          productTypeDisplay={getProductTypeDisplay(selectedJobForUpdate)}
          initialData={selectedJobForUpdate}
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
