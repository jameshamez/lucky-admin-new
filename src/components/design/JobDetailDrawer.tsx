import { useState, useEffect, useMemo } from "react";
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

const API_BASE = "https://nacres.co.th/api-lucky/admin";

type ReferenceFileItem = { fileName: string; url: string };
type DesignerOption = { id: string; name: string };

const referenceImagePattern = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;
const EMPTY_DISPLAY = "ไม่มีข้อมูล";

const PRODUCT_CATEGORY_LABELS: Record<string, string> = {
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

const KNOWN_JOB_TYPE_LABELS = [
  "สินค้าสำเร็จรูป",
  "สินค้าสั่งผลิต",
  "ป้ายจารึก",
  "เหรียญสำเร็จรูป",
  "เหรียญสั่งผลิต",
  "โล่",
  "โล่สั่งผลิต",
  "ถ้วยรางวัล",
  "สายคล้อง",
  "เสื้อ",
  "บิบ",
  "คริสตัล",
  "อะคริลิค",
];

const JOB_TYPE_KEYWORDS: Array<[string, string]> = [
  ["ready", "สินค้าสำเร็จรูป"],
  ["สำเร็จ", "สินค้าสำเร็จรูป"],
  ["ป้าย", "ป้ายจารึก"],
  ["plaque", "โล่"],
  ["award", "โล่"],
  ["shield", "โล่"],
  ["โล่", "โล่"],
  ["medal", "เหรียญสั่งผลิต"],
  ["เหรียญ", "เหรียญสั่งผลิต"],
  ["trophy", "ถ้วยรางวัล"],
  ["ถ้วย", "ถ้วยรางวัล"],
  ["lanyard", "สายคล้อง"],
  ["สายคล้อง", "สายคล้อง"],
  ["shirt", "เสื้อ"],
  ["เสื้อ", "เสื้อ"],
  ["bib", "บิบ"],
  ["บิบ", "บิบ"],
  ["crystal", "คริสตัล"],
  ["คริสตัล", "คริสตัล"],
  ["acrylic", "อะคริลิค"],
  ["อะคริลิค", "อะคริลิค"],
];

const cleanDisplayValue = (value: any) => {
  const text = String(value ?? "").trim();
  const key = text.toLowerCase();
  return ["", "0", "-", "null", "undefined", "n/a", "internal"].includes(key)
    ? ""
    : text;
};

const toReferenceFileItem = (file: any): ReferenceFileItem | null => {
  if (!file) return null;
  if (typeof file === 'string') return { fileName: file.split('?')[0].split('/').pop() || 'ไฟล์เอกสาร', url: file };

  const url = file.url || file.link || file.file_url || '';
  if (!url) return null;

  return {
    fileName: file.fileName || file.file_name || file.name || (url.split('?')[0].split('/').pop() || 'ไฟล์เอกสาร'),
    url,
  };
};

const isReferenceImageFile = (file: ReferenceFileItem) => {
  return referenceImagePattern.test(file.url) || referenceImagePattern.test(file.fileName);
};

const getFirstText = (...values: any[]) => {
  for (const value of values) {
    const text = cleanDisplayValue(value);
    if (text) return text;
  }
  return "";
};

const normalizeJobTypeDisplay = (value: string) => {
  const text = cleanDisplayValue(value);
  if (!text) return "";
  if (/^\d+$/.test(text)) return "";

  if (KNOWN_JOB_TYPE_LABELS.includes(text)) return text;

  const lower = text.toLowerCase();
  const includes = (needle: string) => lower.includes(needle.toLowerCase());

  if (PRODUCT_CATEGORY_LABELS[lower]) return PRODUCT_CATEGORY_LABELS[lower];

  const matched = JOB_TYPE_KEYWORDS.find(([keyword]) => includes(keyword));
  return matched?.[1] || "";
};

const normalizeProductCategoryDisplay = (value: any) => {
  const text = cleanDisplayValue(value);
  const key = text.toLowerCase();
  if (["สินค้าสำเร็จรูป", "สินค้าสั่งผลิต"].includes(text)) return text;
  if (PRODUCT_CATEGORY_LABELS[key]) return PRODUCT_CATEGORY_LABELS[key];
  if (key.includes("สำเร็จ")) return "สินค้าสำเร็จรูป";
  if (key.includes("สั่งผลิต") || key.includes("custom")) return "สินค้าสั่งผลิต";
  return "";
};

const parseMaybeJson = (value: any) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const parseDateValue = (...values: any[]) => {
  const text = getFirstText(...values);
  if (!text || text.startsWith("0000-00-00")) return null;
  const date = new Date(text.includes(" ") ? text.replace(" ", "T") : text);
  return Number.isNaN(date.getTime()) || date.getFullYear() < 2000 ? null : date;
};

const getFirstNumber = (...values: any[]) => {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return null;
};

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
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [salesDetails, setSalesDetails] = useState<any>(null);
  const [salesOrder, setSalesOrder] = useState<any>(null);
  const [designerOptions, setDesignerOptions] = useState<DesignerOption[]>([]);

  // Fetch Sales order and price estimation details for this job.
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        if (!open) return;
        const id = jobData?.job_id || jobData?.job_code || jobId;
        if (!id) return;
        setLoadingDetails(true);

        try {
          const orderRes = await fetch(`${API_BASE}/orders.php?job_id=${encodeURIComponent(String(id))}`);
          const orderJson = await orderRes.json().catch(() => ({}));
          setSalesOrder(orderJson?.status === "success" ? orderJson.data : null);
        } catch (orderError) {
          console.error(orderError);
          setSalesOrder(null);
        }

        const res = await fetch(`${API_BASE}/price_estimations.php`);
        if (!res.ok) throw new Error("fetch estimation failed");
        const json = await res.json();
        const rows = json?.data || [];
        const lookupIds = [
          id,
          jobData?.quotation_no,
          jobData?.quotation_number,
          jobData?.job_code,
          jobData?.job_id,
        ].map((value) => cleanDisplayValue(value)).filter(Boolean);
        const found = rows.find((it: any) => {
          const rowIds = [
            it.estimate_id,
            it.job_code,
            it.quotation_no,
            it.quotation_number,
            it.id,
          ].map((value) => cleanDisplayValue(value)).filter(Boolean);
          return rowIds.some((rowId) => lookupIds.includes(rowId));
        });
        if (!found) {
          setSalesDetails(null);
          return;
        }
        const details = parseMaybeJson(found.details);
        setSalesDetails({ ...found, ...details, details, estimationRecord: found });
      } catch (e) {
        console.error(e);
        setSalesDetails(null);
        setSalesOrder(null);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, jobId, jobData?.job_id, jobData?.job_code, jobData?.quotation_no]);

  useEffect(() => {
    const fetchDesigners = async () => {
      if (!open || mode === "view") return;

      try {
        const res = await fetch(`${API_BASE}/employees.php?department=${encodeURIComponent("ฝ่ายกราฟฟิก")}`);
        const json = await res.json();
        const employees = Array.isArray(json?.data) ? json.data : [];
        setDesignerOptions(
          employees
            .filter((emp: any) => String(emp.is_active ?? "1") !== "0")
            .map((emp: any) => ({
              id: String(emp.id ?? emp.code ?? emp.full_name),
              name: getFirstText(emp.full_name, emp.nickname, emp.code) || "ไม่ระบุชื่อ",
            }))
        );
      } catch (error) {
        console.error(error);
        setDesignerOptions([]);
      }
    };

    fetchDesigners();
  }, [open, mode]);

  const parseImageToken = (img: any): string | null => {
    if (!img) return null;
    if (typeof img === 'string') {
      try {
        const parsed = JSON.parse(img);
        if (parsed?.data) return parsed.data as string; // base64 data URL
      } catch {
        // not JSON, assume plain URL
        return img;
      }
      return img;
    }
    return img.url || null;
  };

  const referenceImages: string[] = useMemo(() => {
    const orderItemDetails = Array.isArray(salesOrder?.items)
      ? salesOrder.items.map((item: any) => parseMaybeJson(item?.details))
      : [];
    const orderDetailImages = orderItemDetails.flatMap((details: any) => {
      if (Array.isArray(details?.customerReferenceImages)) return details.customerReferenceImages;
      if (Array.isArray(details?.artworkImages)) return details.artworkImages;
      return [];
    });
    const list = (salesDetails?.customerReferenceImages && Array.isArray(salesDetails.customerReferenceImages))
      ? salesDetails.customerReferenceImages
      : (salesDetails?.artworkImages && Array.isArray(salesDetails.artworkImages))
        ? salesDetails.artworkImages
        : [];
    const attachedImageFiles = (Array.isArray(salesOrder?.design_files) ? salesOrder.design_files : [])
      .concat(Array.isArray(salesDetails?.designFiles) ? salesDetails.designFiles : [])
      .concat(Array.isArray(salesDetails?.referenceFiles) ? salesDetails.referenceFiles : [])
      .map(toReferenceFileItem)
      .filter((file): file is ReferenceFileItem => Boolean(file) && isReferenceImageFile(file))
      .map(file => file.url);

    return [...list.concat(orderDetailImages).map(parseImageToken).filter(Boolean), ...attachedImageFiles] as string[];
  }, [salesDetails, salesOrder]);

  type DocItem = ReferenceFileItem;
  const referenceFiles: DocItem[] = useMemo(() => {
    const orderItemDetails = Array.isArray(salesOrder?.items)
      ? salesOrder.items.map((item: any) => parseMaybeJson(item?.details))
      : [];
    const detailFiles = orderItemDetails.flatMap((details: any) => (
      (Array.isArray(details?.designFiles) ? details.designFiles : [])
        .concat(Array.isArray(details?.referenceFiles) ? details.referenceFiles : [])
    ));
    const raw = (Array.isArray(salesOrder?.design_files) ? salesOrder.design_files : [])
      .concat(detailFiles)
      .concat(Array.isArray(salesDetails?.designFiles) ? salesDetails.designFiles : [])
      .concat(Array.isArray(salesDetails?.referenceFiles) ? salesDetails.referenceFiles : []);
    const merged = (raw || [])
      .map(toReferenceFileItem)
      .filter((file): file is DocItem => Boolean(file) && !isReferenceImageFile(file));
    // If nothing, try to include any non-image tokens in customerReferenceImages as files
    if (merged.length === 0 && Array.isArray(salesDetails?.customerReferenceImages)) {
      const extra = salesDetails.customerReferenceImages
        .map((v: any) => (typeof v === 'string' ? v : (v?.url || '')))
        .filter((u: string) => u && !u.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        .map((u: string) => ({ fileName: u.split('/').pop() || 'ไฟล์เอกสาร', url: u }));
      return extra;
    }
    return merged;
  }, [salesDetails, salesOrder]);

  const prodAiFile: DocItem | null = useMemo(() => {
    const url = jobData?.ai_file || salesDetails?.designWorkflow?.aiFile || '';
    if (!url) return null;
    return { fileName: (String(url).split('/').pop() || 'AI/PDF'), url: String(url) };
  }, [jobData?.ai_file, salesDetails]);

  const prodArtworkImages: string[] = useMemo(() => {
    const p = jobData?.production_artwork || salesDetails?.designWorkflow?.productionArtwork;
    const arr = Array.isArray(p) ? p : (p ? [p] : []);
    return arr.map(parseImageToken).filter(Boolean) as string[];
  }, [jobData?.production_artwork, salesDetails]);

  const savedLayoutImage = useMemo(() => parseImageToken(jobData?.layout_image), [jobData?.layout_image]);
  const savedArtworkImage = useMemo(() => parseImageToken(jobData?.artwork_image), [jobData?.artwork_image]);
  const orderItems = useMemo(() => (
    Array.isArray(salesOrder?.items) ? salesOrder.items : []
  ), [salesOrder]);
  const firstOrderItem = orderItems[0] || {};
  const firstOrderItemDetails = parseMaybeJson(firstOrderItem?.details);
  const totalOrderQuantity = orderItems.reduce((sum: number, item: any) => {
    const quantity = Number(item?.quantity);
    return sum + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);

  const getArtworkStatusLabel = (status?: string) => {
    switch (status) {
      case "pending_review":
        return "รอเซลล์ตรวจ";
      case "approved":
        return "แบบผ่าน";
      case "rejected":
        return "แบบไม่ผ่าน";
      case "draft":
        return "ร่าง";
      default:
        return "ยังไม่ระบุ";
    }
  };

  const jobTypeDisplay = (
    [
      salesOrder?.product_category,
      salesDetails?.product_category,
      salesDetails?.productCategory,
      jobData?.product_category,
      jobData?.productCategory,
    ].map(normalizeProductCategoryDisplay).find(Boolean) ||
    [
      jobData?.product_type_display,
      salesDetails?.productCategoryText,
      salesDetails?.productTypeLabel,
      jobData?.product_type_label,
      jobData?.productTypeLabel,
      firstOrderItem?.product_name,
      firstOrderItemDetails?.productCategoryText,
      firstOrderItemDetails?.productTypeLabel,
      jobData?.product_type_raw,
      jobData?.product_type,
      jobData?.productType,
      salesOrder?.product_type,
      salesDetails?.productType,
      salesDetails?.product_type,
      salesDetails?.type,
      salesDetails?.category,
      salesDetails?.product?.type,
      jobData?.job_type,
    ].map(normalizeJobTypeDisplay).find(Boolean) ||
    EMPTY_DISPLAY
  );

  // ข้อมูลจริงจากฝ่ายขาย/คำสั่งซื้อเท่านั้น
  const data = {
    customerName: getFirstText(salesOrder?.customer_name, salesDetails?.customer_name, salesDetails?.customerName, jobData?.client_name) || EMPTY_DISPLAY,
    contactName: getFirstText(salesOrder?.delivery_recipient, salesDetails?.contact_name, salesDetails?.contactName, jobData?.contact_name) || EMPTY_DISPLAY,
    phone: getFirstText(salesOrder?.customer_phone, salesOrder?.delivery_phone, salesDetails?.customer_phone, salesDetails?.phone, jobData?.phone_number),
    lineId: getFirstText(salesOrder?.customer_line, salesDetails?.customer_line, salesDetails?.line_id, jobData?.line_id),
    facebook: getFirstText(salesDetails?.facebook, salesDetails?.facebook_name, jobData?.facebook),
    salesperson: getFirstText(salesOrder?.responsible_person, salesDetails?.sales_owner_name, salesDetails?.sales_name, jobData?.ordered_by) || EMPTY_DISPLAY,
    jobType: jobTypeDisplay,
    urgencyLabel: getFirstText(salesOrder?.urgency_level, jobData?.urgency) || "ปกติ",
    orderDate: parseDateValue(salesOrder?.order_date, salesDetails?.estimation_date, jobData?.order_date, jobData?.assigned_at),
    dueDate: parseDateValue(salesOrder?.delivery_date, salesOrder?.preferred_delivery_date, jobData?.due_date, salesDetails?.usage_date),
    quotation: getFirstText(salesOrder?.quotation_number, jobData?.quotation_no, salesDetails?.estimate_id) || EMPTY_DISPLAY,
    jobIdDisplay: getFirstText(salesOrder?.job_id, jobData?.job_id, jobData?.job_code, jobId) || EMPTY_DISPLAY,
    jobName: getFirstText(salesOrder?.job_name, salesDetails?.job_name, jobData?.job_name, jobData?.description) || EMPTY_DISPLAY,
    quantity: getFirstNumber(totalOrderQuantity, firstOrderItem?.quantity, salesDetails?.quantity, jobData?.quantity),
    width: getFirstText(firstOrderItemDetails?.width, firstOrderItemDetails?.size_width, salesDetails?.width, jobData?.width),
    height: getFirstText(firstOrderItemDetails?.height, firstOrderItemDetails?.size_height, salesDetails?.height, jobData?.height),
    material: getFirstText(firstOrderItem?.material, firstOrderItemDetails?.material, salesDetails?.material, jobData?.material),
    color: getFirstText(firstOrderItem?.color, firstOrderItemDetails?.color, salesDetails?.product_color, jobData?.color),
    size: getFirstText(firstOrderItem?.size, firstOrderItemDetails?.size, salesDetails?.size, jobData?.medal_size),
    thickness: getFirstText(firstOrderItemDetails?.thickness, salesDetails?.thickness, jobData?.medal_thickness),
    model: getFirstText(firstOrderItemDetails?.model, salesDetails?.model, jobData?.model),
    lanyardSize: getFirstText(firstOrderItemDetails?.lanyardSize, salesDetails?.lanyardSize, jobData?.lanyard_size),
    lanyardPatterns: getFirstText(firstOrderItemDetails?.lanyardPatterns, salesDetails?.lanyardPatterns, jobData?.lanyard_patterns),
    textOnSign: getFirstText(
      firstOrderItemDetails?.job_description,
      firstOrderItemDetails?.designDescription,
      salesDetails?.designDescription,
      salesDetails?.inscriptionDetails,
      salesDetails?.plaqueText,
      salesOrder?.notes,
      jobData?.specs,
      jobData?.description
    ),
    description: getFirstText(salesOrder?.notes, salesDetails?.notes, salesDetails?.designDescription, jobData?.description, jobData?.specs),
  };

  const toThaiDate = (d: Date | null) => {
    if (!d) return EMPTY_DISPLAY;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear() + 543;
    return `${dd}/${mm}/${yyyy}`;
  };

  const today = new Date();
  const diffDays = data.dueDate
    ? Math.ceil((data.dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const getDeadlineBadge = () => {
    if (diffDays === null) {
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />ยังไม่ระบุ</Badge>;
    }
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
    if (designerOptions.length === 0) return;
    const randomIndex = Math.floor(Math.random() * designerOptions.length);
    const employee = designerOptions[randomIndex];
    setSelectedEmployee(employee.name);
    setSelectedEmployeeId(employee.id);
  };

  const handleSelectEmployee = (emp: { id: string; name: string }) => {
    setSelectedEmployee(emp.name);
    setSelectedEmployeeId(emp.id);
    setShowEmployeeDialog(false);
  };

  const getEmployeeWorkload = () => {
    return [];
  };

  const handleDownloadAll = () => {
    const files: ReferenceFileItem[] = [
      ...referenceFiles,
      ...referenceImages.map((url, index) => ({ fileName: `reference-image-${index + 1}`, url })),
      ...(prodAiFile ? [prodAiFile] : []),
      ...prodArtworkImages.map((url, index) => ({ fileName: `production-artwork-${index + 1}`, url })),
    ];

    files.forEach((file) => {
      const a = document.createElement("a");
      a.href = file.url;
      a.download = file.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  const displayValue = (value: any) => cleanDisplayValue(value) || EMPTY_DISPLAY;
  const toTextList = (value: any): string[] => {
    if (Array.isArray(value)) return value.map(cleanDisplayValue).filter(Boolean);
    const text = cleanDisplayValue(value);
    return text ? [text] : [];
  };
  const renderBadgeList = (...values: any[]) => {
    const list = values.flatMap(toTextList);
    if (list.length === 0) {
      return <p className="text-sm text-muted-foreground">{EMPTY_DISPLAY}</p>;
    }

    return (
      <div className="flex flex-wrap gap-2">
        {list.map((detail, idx) => (
          <Badge key={`${detail}-${idx}`} variant="outline" className="text-sm font-normal">{detail}</Badge>
        ))}
      </div>
    );
  };

  const renderJobSpecifications = () => {
    const currentJobType = data.jobType;
    const sizeDisplay = data.width || data.height
      ? `${data.width || "-"} x ${data.height || "-"} ซม.`
      : displayValue(data.size);
    const quantityDisplay = data.quantity
      ? `${Number(data.quantity).toLocaleString()} ชิ้น`
      : EMPTY_DISPLAY;
    
    // Common specs for all job types
    const commonSpecs = (
      <>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">ขนาด (กว้าง x สูง)</p>
          <p className="text-base font-normal">{sizeDisplay}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">จำนวนที่สั่ง</p>
          <p className="text-base font-normal">{quantityDisplay}</p>
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
              <p className="text-base font-normal">{displayValue(jobData?.base_type || data.material)}</p>
            </div>
          </>
        );

      case "เหรียญสำเร็จรูป":
        return (
          <>
            {commonSpecs}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">วัสดุ</p>
              <p className="text-base font-normal">{displayValue(data.material)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">สี</p>
              <p className="text-base font-normal">{displayValue(data.color)}</p>
            </div>
          </>
        );

      case "เหรียญสั่งผลิต":
        return (
          <>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">ขนาด</p>
              <p className="text-base font-normal text-primary">{displayValue(data.size)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">ความหนา</p>
              <p className="text-base font-normal text-primary">{displayValue(data.thickness)}</p>
            </div>
            <div className="col-span-2 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">สี (เลือกได้หลายรายการ)</p>
              {renderBadgeList(jobData?.medal_colors, salesDetails?.colors, firstOrderItemDetails?.colors, data.color)}
            </div>
            <div className="col-span-2 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">รายละเอียดด้านหน้า (เลือกได้หลายรายการ)</p>
              {renderBadgeList(jobData?.medal_front_details, salesDetails?.frontDetails, firstOrderItemDetails?.frontDetails)}
            </div>
            <div className="col-span-2 space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">รายละเอียดด้านหลัง (เลือกได้หลายรายการ)</p>
              {renderBadgeList(jobData?.medal_back_details, salesDetails?.backDetails, firstOrderItemDetails?.backDetails)}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">สายคล้อง</p>
              <p className="text-base font-normal text-primary">{displayValue(data.lanyardSize)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">จำนวนลาย</p>
              <p className="text-base font-normal text-primary">{displayValue(data.lanyardPatterns)}</p>
            </div>
          </>
        );

      case "โล่/ถ้วย/คริสตัล":
      case "ถ้วยรางวัล":
      case "โล่":
      case "โล่สั่งผลิต":
      case "คริสตัล":
        return (
          <>
            {commonSpecs}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">รุ่น</p>
              <p className="text-base font-normal">{displayValue(data.model)}</p>
            </div>
          </>
        );

      case "เสื้อ":
        return (
          <>
            {commonSpecs}
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">ประเภทเสื้อ</p>
              <p className="text-base font-normal">{displayValue(jobData?.shirt_type || firstOrderItemDetails?.shirtType || firstOrderItemDetails?.collar)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">ไซส์</p>
              <p className="text-base font-normal">{displayValue(jobData?.sizes || firstOrderItem?.size || data.size)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">สี</p>
              <p className="text-base font-normal">{displayValue(data.color)}</p>
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
              <p className="text-base font-normal">{displayValue(data.material)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-muted-foreground">สี</p>
              <p className="text-base font-normal">{displayValue(data.color)}</p>
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
          {data.phone ? (
            <a 
              href={`tel:${data.phone.replace(/-/g, '')}`}
              className="text-base font-normal text-primary hover:underline flex items-center gap-2 cursor-pointer"
            >
              <Phone className="h-4 w-4" />
              {data.phone}
            </a>
          ) : (
            <p className="text-base font-normal text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {EMPTY_DISPLAY}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-muted-foreground">ช่องทางติดต่ออื่นๆ</p>
          <div className="space-y-2">
            <p className="text-base font-normal flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Line: {data.lineId || EMPTY_DISPLAY}
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
              value={data.textOnSign || EMPTY_DISPLAY}
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

  const SavedDesignWorkflowCard = () => {
    const hasSavedData = Boolean(
      jobData?.google_drive_link ||
      savedLayoutImage ||
      savedArtworkImage ||
      jobData?.artwork_status
    );

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            ข้อมูลที่กราฟิกบันทึก
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasSavedData ? (
            <div className="text-sm text-muted-foreground">ยังไม่มีข้อมูลอัปเดตจากกราฟิก</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">สถานะ Artwork</p>
                  <Badge variant="outline">{getArtworkStatusLabel(jobData?.artwork_status)}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-muted-foreground">Google Drive</p>
                  {jobData?.google_drive_link ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => window.open(jobData.google_drive_link, "_blank", "noopener,noreferrer")}
                    >
                      <Download className="h-4 w-4" />
                      เปิดลิงก์
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">-</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">รูปวางแบบ</p>
                  {savedLayoutImage ? (
                    <div className="aspect-video bg-muted rounded-md overflow-hidden border">
                      <img src={savedLayoutImage} alt="รูปวางแบบ" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">ยังไม่มีรูปวางแบบ</div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">รูป Artwork</p>
                  {savedArtworkImage ? (
                    <div className="aspect-video bg-muted rounded-md overflow-hidden border">
                      <img src={savedArtworkImage} alt="Artwork" className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">ยังไม่มีรูป Artwork</div>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

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
          {referenceFiles.length > 0 ? (
            <div className="space-y-2">
              {referenceFiles.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{f.fileName}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="gap-1" onClick={() => { const a = document.createElement('a'); a.href = f.url; a.download = f.fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}>
                    <Download className="h-4 w-4" />
                    ดาวน์โหลด
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">ไม่มีไฟล์เอกสาร</div>
          )}
        </div>

        {/* Reference Images */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            รูปภาพอ้างอิง
          </p>
          {referenceImages.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {referenceImages.map((img, idx) => (
                <div key={idx} className="aspect-video bg-muted rounded-md overflow-hidden hover:opacity-80 cursor-pointer transition-opacity">
                  <img src={img} alt={`รูปอ้างอิง ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">ไม่มีรูปภาพอ้างอิง</div>
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
          {prodAiFile ? (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{prodAiFile.fileName}</span>
              </div>
              <Button size="sm" variant="ghost" className="gap-1" onClick={() => { const a = document.createElement('a'); a.href = prodAiFile.url; a.download = prodAiFile.fileName; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}>
                <Download className="h-4 w-4" />
                ดาวน์โหลด
              </Button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">ยังไม่มีไฟล์ AI/PDF</div>
          )}
        </div>

        {/* Production Artwork Images */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            รูป Artwork สำหรับผลิต
          </p>
          {prodArtworkImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {prodArtworkImages.map((img, idx) => (
                <div key={idx} className="aspect-video bg-muted rounded-md overflow-hidden">
                  <img src={img} alt={`Production Artwork ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">ยังไม่มีรูป Artwork สำหรับผลิต</div>
          )}
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
                <SavedDesignWorkflowCard />
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
                disabled={designerOptions.length === 0}
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
            {designerOptions.length > 0 ? (
              designerOptions.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  className="w-full p-3 text-left border rounded-md hover:bg-accent transition-colors"
                >
                  {emp.name}
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">ไม่พบรายชื่อพนักงานฝ่ายกราฟฟิก</p>
            )}
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
