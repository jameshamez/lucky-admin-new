import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Package,
  Truck,
  CheckCircle,
  Building2,
  Circle,
  CheckCircle2,
  FileText,
  History,
  XCircle,
  ImageIcon,
  Ship,
  Plane,
  Car,
  Warehouse,
  ClipboardCheck,
  Send,
  PackageCheck,
  Factory,
  Globe,
  MapPin,
  ThumbsUp,
  Eye,
  MessageSquare,
  RotateCcw,
  ZoomIn
} from "lucide-react";
import { toast } from "sonner";
import artworkSample from "@/assets/artwork-sample.png";
import QCVerificationCards from "@/components/sales/QCVerificationCards";
import LogisticsDeliveryCards from "@/components/sales/LogisticsDeliveryCards";
import ProductionProgressBar from "@/components/sales/ProductionProgressBar";
import { ProductionOrderInfoReadOnly, OrderShippingData } from "@/components/procurement/ProductionOrderInfo";
import { designJobService, DesignJob } from "@/services/designJobService";

const API_BASE_URL = "https://nacres.co.th/api-lucky/admin";

// Status list for "เหรียญสั่งผลิต + ลูกค้ามีแบบแล้ว"
const productStatusList = [
  { status: "สร้างคำสั่งซื้อใหม่", department: "เซลล์" },
  { status: "ยืนยันคำสั่งซื้อ", department: "เซลล์" },
  { status: "สร้างงานแล้ว", department: "เซลล์" },
  { status: "รอจัดซื้อส่งประเมิน", department: "เซลล์" },
  { status: "อยู่ระหว่างการประเมินราคา", department: "จัดซื้อ" },
  { status: "ได้รับราคา", department: "จัดซื้อ" },
  { status: "เสนอราคาให้ลูกค้า", department: "เซลล์" },
  { status: "ลูกค้าอนุมัติราคา", department: "เซลล์" },
  { status: "รอกราฟิกปรับไฟล์เพื่อผลิต", department: "กราฟิก" },
  { status: "กำลังปรับไฟล์ผลิต", department: "กราฟิก" },
  { status: "รอเซลล์ตรวจแบบป้าย", department: "เซลล์" },
  { status: "รอกราฟิกแก้ไขแบบป้าย", department: "กราฟิก" },
  { status: "ไฟล์ผลิตพร้อมสั่งผลิต", department: "กราฟิก" },
  { status: "รอจัดซื้อออก PO / สั่งผลิต", department: "จัดซื้อ" },
  { status: "สั่งผลิตแล้ว", department: "จัดซื้อ" },
  { status: "รอประกอบ", department: "ผลิต" },
  { status: "รอผูกโบว์", department: "ผลิต" },
  { status: "รอติดป้ายจารึก", department: "ผลิต" },
  { status: "กำลังผลิต", department: "โรงงาน" },
  { status: "รอตรวจ QC", department: "QC" },
  { status: "ตรวจสอบ Artwork จากโรงงาน", department: "โรงงาน" },
  { status: "ตรวจสอบ CNC", department: "โรงงาน" },
  { status: "อัปเดทปั้มชิ้นงาน", department: "โรงงาน" },
  { status: "อัปเดตสาย", department: "โรงงาน" },
  { status: "อัปเดตชิ้นงานก่อนจัดส่ง", department: "QC" },
  { status: "งานเสร็จสมบูรณ์", department: "QC" },
  { status: "ผ่าน QC - รอแพ็ก", department: "QC" },
  { status: "แพ็กเสร็จ - รอพิมพ์ใบส่งของ", department: "ผลิต" },
  { status: "พิมพ์เอกสารแล้ว - รอจัดส่ง", department: "ผลิต" },
  { status: "อยู่ระหว่างขนส่ง", department: "ขนส่ง" },
  { status: "สินค้ามาส่งที่ร้าน", department: "คลัง" },
  { status: "จัดส่งเรียบร้อย", department: "ขนส่ง" },
  { status: "จัดส่งสำเร็จ", department: "ขนส่ง" },
  { status: "จัดส่งแล้ว", department: "ขนส่ง" },
];

interface StatusHistoryItem {
  status: string;
  updatedAt: string;
  updatedBy: string;
  department: string;
}

interface OrderItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
  currentStatus: string;
  statusHistory: StatusHistoryItem[];
  // Optional fields for readymade trophy
  productType?: "readymade" | "madeToOrder";
  material?: string;
  productModel?: string; // รุ่นสินค้า for readymade medals
  model?: string;
  modelSize?: string;
  engraving?: {
    number: string;
    color: string;
  };
  bow?: {
    number: string;
  };
}

type OrderDesignFile = string | {
  url?: string;
  file_url?: string;
  fileName?: string;
  file_name?: string;
  name?: string;
};

const orderDesignPreviewPattern = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;

const getOrderDesignFileUrl = (file: OrderDesignFile): string => {
  if (typeof file === "string") return file;
  return file.url || file.file_url || "";
};

const getOrderDesignFileName = (file: OrderDesignFile, index: number): string => {
  if (typeof file !== "string") {
    return file.fileName || file.file_name || file.name || getOrderDesignFileName(file.url || file.file_url || "", index);
  }

  const cleanUrl = file.split("?")[0];
  return cleanUrl.split("/").pop() || `ไฟล์ ${index + 1}`;
};

const isOrderDesignImage = (file: OrderDesignFile) => {
  const url = getOrderDesignFileUrl(file);
  const name = getOrderDesignFileName(file, 0);
  return orderDesignPreviewPattern.test(url) || orderDesignPreviewPattern.test(name);
};

type GraphicFile = {
  label: string;
  url: string;
  name: string;
  uploadedAt?: string;
  uploadedBy?: string;
};

const getFileNameFromUrl = (url: string, fallback: string) => {
  const cleanUrl = url.split("?")[0];
  return cleanUrl.split("/").pop() || fallback;
};

const addGraphicFile = (files: GraphicFile[], seen: Set<string>, label: string, url?: string | null, uploadedAt?: string, uploadedBy?: string) => {
  if (!url || seen.has(url)) return;
  seen.add(url);
  files.push({
    label,
    url,
    name: getFileNameFromUrl(url, label),
    uploadedAt,
    uploadedBy,
  });
};

const getGraphicFilesFromDesignJob = (job: any | null): GraphicFile[] => {
  if (!job) return [];

  const files: GraphicFile[] = [];
  const seen = new Set<string>();
  const uploadedAt = job.updated_at || job.created_at;
  const uploadedBy = job.designer || job.ordered_by;

  addGraphicFile(files, seen, "Artwork", job.artwork_image, uploadedAt, uploadedBy);
  addGraphicFile(files, seen, "Layout", job.layout_image, uploadedAt, uploadedBy);
  addGraphicFile(files, seen, "ไฟล์ผลิต", job.production_artwork, uploadedAt, uploadedBy);
  addGraphicFile(files, seen, "ไฟล์ AI", job.ai_file, uploadedAt, uploadedBy);
  addGraphicFile(files, seen, "Google Drive", job.google_drive_link, uploadedAt, uploadedBy);

  return files;
};

const getPrimaryArtworkFile = (files: GraphicFile[]) => {
  return files.find((file) => isOrderDesignImage({ url: file.url, name: file.name }))
    || files[0]
    || null;
};

const safeParseJson = <T,>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value !== "string") return value as T;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const firstFilled = (...values: unknown[]) => {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0) return value;
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return null;
};

const toText = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return String(value);
};

const toTextArray = (value: unknown): string[] => {
  const parsed = safeParseJson<unknown>(value, value);
  if (Array.isArray(parsed)) return parsed.map(toText).filter(Boolean) as string[];
  if (typeof parsed === "string") {
    return parsed
      .split(/[,|\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const getItemDetails = (item: any) => {
  const parsed = safeParseJson<Record<string, any>>(item?.details, {});
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
};

const fetchEstimationDetails = async (estimationId: string | number) => {
  try {
    const res = await fetch(`${API_BASE_URL}/price_estimations.php?id=${encodeURIComponent(String(estimationId))}`);
    const json = await res.json();
    const data = json?.status === "success" ? json.data : null;
    if (!data) return {};

    const details = safeParseJson<Record<string, any>>(data.details, {});
    return {
      ...details,
      productSize: data.product_size,
      productColor: data.product_color,
      productDetailsText: data.product_details,
      material: details.material || data.material,
      quantity: data.quantity,
    };
  } catch (error) {
    console.warn("Failed to load estimation details:", error);
    return {};
  }
};

const enrichOrderItemsWithEstimations = async (items: any[]) => {
  return Promise.all(
    items.map(async (item) => {
      const details = getItemDetails(item);
      const estimationId = details.estimation_id || details.estimationId;
      if (!estimationId) return { ...item, details };

      const estimationDetails = await fetchEstimationDetails(estimationId);
      return {
        ...item,
        details: {
          ...estimationDetails,
          ...details,
        },
      };
    })
  );
};

const getOrderProductDetails = (apiData: any) => {
  const items = Array.isArray(apiData.items) ? apiData.items : [];
  const firstItem = items[0] || {};
  const firstDetails = getItemDetails(firstItem);
  const colorRows = Array.isArray(firstDetails.colorQuantityRows) ? firstDetails.colorQuantityRows : [];

  const colorsFromRows = colorRows
    .map((row: any) => firstFilled(row?.label, row?.colorLabel, row?.colorName, row?.color))
    .filter(Boolean);

  const itemColors = items.map((item: any) => item.color).filter(Boolean);

  return {
    size: toText(firstFilled(firstDetails.size, firstDetails.productSize, firstDetails.medalSize, firstDetails.selectedMedalSizes, firstItem.size, apiData.product_size, apiData.size)),
    thickness: toText(firstFilled(firstDetails.thickness, firstDetails.medalThickness, firstDetails.selectedMedalThicknesses, apiData.product_thickness, apiData.thickness)),
    platingColors: toTextArray(firstFilled(firstDetails.colors, firstDetails.platingColors, firstDetails.productColor, colorsFromRows, itemColors, apiData.plating_colors, apiData.product_color)),
    frontDetails: toTextArray(firstFilled(firstDetails.frontDetails, apiData.front_details)),
    backDetails: toTextArray(firstFilled(firstDetails.backDetails, apiData.back_details)),
    lanyard: toText(firstFilled(firstDetails.lanyardSize, firstDetails.lanyard, firstDetails.lanyard_info, apiData.lanyard_info, apiData.lanyard)),
    patternCount: toText(firstFilled(firstDetails.lanyardPatterns, firstDetails.lanyardQuantity, firstDetails.patternCount, apiData.pattern_count, apiData.patterns)),
  };
};

interface Order {
  id: string;
  numericId?: number | string;
  customer: string;
  items: string;
  orderDate: string;
  dueDate: string;
  status: string;
  orderStatus?: string;
  value: number;
  progress: number;
  type: string;
  location: string;
  department: string;
  lineId: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  orderItems: OrderItem[];
  graphicsNotes?: string;
  designFiles?: OrderDesignFile[];
  quotationUrl?: string;
  invoiceType?: string;
  payments?: any[];
  originBranch?: string;
  destinationBranch?: string;
  preferredTimeSlot?: string;
  productionWorkflow?: Record<string, any> | null;
}

const statusConfig = {
  pending_approval: {
    label: "รออนุมัติ",
    color: "bg-yellow-500",
    textColor: "text-yellow-900",
    icon: Clock
  },
  in_production: {
    label: "กำลังผลิต",
    color: "bg-orange-500",
    textColor: "text-orange-900",
    icon: Package
  },
  ready_to_ship: {
    label: "พร้อมส่ง",
    color: "bg-blue-500",
    textColor: "text-blue-900",
    icon: Truck
  },
  shipped: {
    label: "เสร็จสิ้น",
    color: "bg-green-500",
    textColor: "text-green-900",
    icon: CheckCircle
  },
  completed: {
    label: "เสร็จสิ้น",
    color: "bg-green-500",
    textColor: "text-green-900",
    icon: CheckCircle
  },
  urgent: {
    label: "เร่งด่วน",
    color: "bg-red-500",
    textColor: "text-red-900",
    icon: AlertTriangle
  }
};

// Helper function to get status index
const getStatusIndex = (status: string) => {
  return productStatusList.findIndex(s => s.status === status);
};

// Helper to find the slowest item (lowest status index)
const getSlowestItem = (items: any[]) => {
  let slowestIndex = Infinity;
  let slowestItem: any | null = null;

  items.forEach(item => {
    const index = getStatusIndex(item.currentStatus);
    if (index < slowestIndex && index >= 0) {
      slowestIndex = index;
      slowestItem = item;
    }
  });

  return slowestItem;
};

// Helper to count items by status category
const getStatusCounts = (items: any[]) => {
  const counts: { [key: string]: number } = {};
  items.forEach(item => {
    const status = item.currentStatus;
    counts[status] = (counts[status] || 0) + 1;
  });
  return counts;
};

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [showUploadHistory, setShowUploadHistory] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [showDeliveryDetail, setShowDeliveryDetail] = useState(false);

  const [order, setOrder] = useState<any | null>(null);
  const [designJob, setDesignJob] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [labelRejectionReason, setLabelRejectionReason] = useState("");

  const fetchOrderDetail = async () => {
    if (!orderId) return;
    setIsLoading(true);
    try {
      const requestedOrderId = decodeURIComponent(orderId);
      let finalOrderId = requestedOrderId;
      let fallbackApiData: any | null = null;

      const findOrderFromSearch = async (term: string) => {
        const searchRes = await fetch(`${API_BASE_URL}/orders.php?search=${encodeURIComponent(term)}`);
        const searchJson = await searchRes.json().catch(() => null);
        const data = Array.isArray(searchJson?.data) ? searchJson.data : [];
        const normalizedTerm = String(term).trim();
        const exactMatch = data.find((d: any) => String(d.job_id || "").trim() === normalizedTerm)
          || data.find((d: any) => String(d.order_id || "").trim() === normalizedTerm);

        return exactMatch || (data.length === 1 ? data[0] : null);
      };

      if (isNaN(Number(requestedOrderId))) {
        const match = await findOrderFromSearch(requestedOrderId);
        if (match) {
          fallbackApiData = match;
          if (match.order_id) {
            finalOrderId = String(match.order_id);
          }
        }
      }

      let apiData: any | null = null;

      if (!isNaN(Number(finalOrderId))) {
        try {
          const res = await fetch(`${API_BASE_URL}/orders.php?id=${encodeURIComponent(finalOrderId)}`);
          const json = await res.json().catch(() => null);

          if (res.ok && json?.status === "success" && json.data) {
            apiData = Array.isArray(json.data) ? json.data[0] : json.data;
          } else {
            console.warn("Order detail endpoint failed, using list data fallback if available", json);
          }
        } catch (detailError) {
          console.warn("Order detail endpoint failed, using list data fallback if available", detailError);
        }
      }

      if (!apiData && !fallbackApiData) {
        fallbackApiData = await findOrderFromSearch(requestedOrderId);
      }

      if (!apiData && fallbackApiData) {
        apiData = fallbackApiData;
      }

      if (!apiData) {
        setOrder(null);
        return;
      }

      const apiItems = await enrichOrderItemsWithEstimations(Array.isArray(apiData.items) ? apiData.items : []);
      const apiDataWithItems = { ...apiData, items: apiItems };

        let broadStatus = "pending_approval";
        const os = apiData.order_status;
        if ([
          "สร้างงานแล้ว",
          "รอกราฟิกปรับไฟล์เพื่อผลิต",
          "กำลังปรับไฟล์ผลิต",
          "รอเซลล์ตรวจแบบป้าย",
          "รอกราฟิกแก้ไขแบบป้าย",
          "ไฟล์ผลิตพร้อมสั่งผลิต",
          "รอจัดซื้อออก PO / สั่งผลิต",
          "สั่งผลิตแล้ว",
          "รอประกอบ",
          "รอผูกโบว์",
          "รอติดป้ายจารึก",
          "กำลังผลิต",
          "รอตรวจ QC",
          "ตรวจสอบ Artwork จากโรงงาน",
          "ตรวจสอบ CNC",
          "อัปเดทปั้มชิ้นงาน",
          "อัปเดตสาย",
          "อัปเดตชิ้นงานก่อนจัดส่ง",
          "งานเสร็จสมบูรณ์",
        ].includes(os)) {
          broadStatus = "in_production";
        } else if (["ผ่าน QC - รอแพ็ก", "แพ็กเสร็จ - รอพิมพ์ใบส่งของ", "พิมพ์เอกสารแล้ว - รอจัดส่ง"].includes(os)) {
          broadStatus = "ready_to_ship";
        } else if (["อยู่ระหว่างขนส่ง", "สินค้ามาส่งที่ร้าน", "จัดส่งเรียบร้อย", "จัดส่งสำเร็จ", "จัดส่งแล้ว"].includes(os)) {
          broadStatus = "shipped";
        }

        // Map order items
        const orderCurrentStatus = apiData.order_status || apiData.status || "สร้างคำสั่งซื้อใหม่";
        const mappedItems: any[] = apiItems.map((item: any) => {
          const isReadymade = item.item_type === 'readymade' || item.item_type === 'catalog';
          const details = getItemDetails(item);
          return {
            id: item.id || item.item_id,
            name: item.product_name || apiData.job_name || "สินค้า",
            description: [
              item.size ? `ขนาด: ${item.size}` : null,
              item.color ? `สี: ${item.color}` : null,
              item.material ? `วัสดุ: ${item.material}` : null,
              apiData.notes || null
            ].filter(Boolean).join(' | ') || "-",
            quantity: parseInt(item.quantity) || 1,
            // Main order_status is the source of truth for cross-department updates.
            currentStatus: orderCurrentStatus || item.status || item.item_status || "สร้างคำสั่งซื้อใหม่",
            statusHistory: [],
            productType: isReadymade ? "readymade" : "madeToOrder",
            details,
            color: item.color || details.color || null,
            material: item.material || details.material || details.model || "-",
            model: item.product_code || details.model || "-",
            modelSize: item.size || details.size || "-",
            size: item.size || details.size || null,
            bowType: item.bow_type || details.bowType || null,
            bowColors: toTextArray(item.bow_colors || details.bowColors),
            engraving: details.engraving || {
              number: details.engravingNumber || details.engraving_no || "",
              color: details.engravingColor || details.engraving_color || "",
            },
            bow: details.bow || { number: details.bowNumber || details.bow_no || item.bow_type || "" },
          };
        });

        // Fallback if no items array
        if (mappedItems.length === 0) {
          const isReadymade = (apiData.product_category || '').toLowerCase().includes('readymade');
          mappedItems.push({
            id: 1,
            name: apiData.job_name || "สินค้า",
            description: apiData.notes || "-",
            quantity: 1,
            currentStatus: orderCurrentStatus,
            statusHistory: [],
            productType: isReadymade ? "readymade" : "madeToOrder",
            material: "-",
            model: "-",
            modelSize: "-"
          });
        }

        setOrder({
          id: apiData.job_id || String(apiData.order_id),
          numericId: apiData.order_id,
          customer: apiData.customer_name || "ไม่ระบุชื่อ",
          items: apiData.job_name || "ไม่ระบุรายการ",
          orderDate: (apiData.order_date || "").split(" ")[0],
          dueDate: apiData.delivery_date || apiData.usage_date || "-",
          status: broadStatus,
          orderStatus: orderCurrentStatus,
          value: parseFloat(apiData.total_price ?? apiData.total_amount) || 0,
          progress: 0,
          type: apiData.product_category || "internal",
          location: apiData.event_location || "domestic",
          department: apiData.responsible_person || "-",
          lineId: apiData.customer_line || "-",
          phone: apiData.customer_phone || "-",
          email: apiData.customer_email || "-",
          address: apiData.customer_address || apiData.delivery_address || "-",
          taxId: apiData.tax_id || "-",
          orderItems: mappedItems,
          graphicsNotes: apiData.graphics_notes || null,
          designFiles: safeParseJson<OrderDesignFile[]>(apiData.design_files, Array.isArray(apiData.design_files) ? apiData.design_files : []),
          quotationUrl: apiData.quotation_url || null,
          invoiceType: apiData.invoice_type || "no-tax-invoice",
          payments: apiData.payments || [],
          originBranch: apiData.origin_branch,
          destinationBranch: apiData.destination_branch,
          preferredTimeSlot: apiData.preferred_time_slot,
          productionWorkflow: apiData.production_workflow || null,
          // Product details from API
          productDetails: getOrderProductDetails(apiDataWithItems),
        });

        try {
          const targetJobCode = apiData.job_id || orderId;
          const djRes = await designJobService.getJobs({ search: targetJobCode, limit: 100 });
          if (djRes.status === "success" && djRes.data && djRes.data.length > 0) {
            const match = djRes.data.find((j: any) => String(j.job_code || "").trim() === String(targetJobCode || "").trim());
            if (match) {
              setDesignJob(match);
            } else {
              setDesignJob(null);
            }
          } else {
            setDesignJob(null);
          }
        } catch (e) {
          console.error("Error fetching design job:", e);
          setDesignJob(null);
        }
    } catch (err) {
      console.error(err);
      toast.error("ดึงข้อมูลคำสั่งซื้อล้มเหลว");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const handleApproveArtwork = async () => {
    if (!designJob?.id) return;

    try {
      await designJobService.updateJob(designJob.id, {
        artwork_status: 'approved',
        status: 'ผลิตชิ้นงาน',
        feedback: 'เซลล์อนุมัติแบบแล้ว'
      });

      await fetch(`${API_BASE_URL}/orders.php?id=${encodeURIComponent(String(order?.numericId || orderId))}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: 'ไฟล์ผลิตพร้อมสั่งผลิต' })
      });

      toast.success("อนุมัติแบบ Artwork สำเร็จ", {
        description: "ระบบได้แจ้งแผนกผลิตและจัดซื้อแล้ว"
      });
      fetchOrderDetail();
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  const handleRejectArtwork = async () => {
    if (!designJob?.id) return;
    if (!rejectionReason.trim()) {
      toast.error("กรุณาระบุเหตุผลที่ต้องการให้แก้ไข");
      return;
    }

    try {
      await designJobService.updateJob(designJob.id, {
        artwork_status: 'rejected',
        status: 'แก้ไข',
        feedback: rejectionReason
      });

      await fetch(`${API_BASE_URL}/orders.php?id=${encodeURIComponent(String(order?.numericId || orderId))}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: 'รอกราฟิกแก้ไขแบบป้าย' })
      });

      toast.info("ส่งกลับให้กราฟิกแก้ไขเรียบร้อยแล้ว");
      setRejectionReason("");
      fetchOrderDetail();
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการส่งกลับ");
    }
  };

  const handleApproveProductionLabel = async () => {
    if (!order?.productionWorkflow?.labeling) return;

    const nextWorkflow = {
      ...order.productionWorkflow,
      labeling: {
        ...order.productionWorkflow.labeling,
        status: "complete",
        updatedAt: new Date().toLocaleString("th-TH"),
        updatedBy: "ฝ่ายขาย",
        updateLogs: [
          ...(order.productionWorkflow.labeling.updateLogs || []),
          {
            action: "เซลล์ยืนยันแบบป้าย",
            timestamp: new Date().toLocaleString("th-TH"),
            user: "ฝ่ายขาย",
          },
        ],
      },
      qc: {
        ...(order.productionWorkflow.qc || {}),
        status: "in_progress",
      },
    };

    try {
      await fetch(`${API_BASE_URL}/orders.php?id=${encodeURIComponent(String(order?.numericId || orderId))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_status: "รอตรวจ QC",
          production_workflow: nextWorkflow,
        }),
      });

      toast.success("เซลล์ยืนยันแบบป้ายแล้ว", {
        description: "ปลดล็อกขั้นตอน QC ให้ฝ่ายผลิตแล้ว",
      });
      fetchOrderDetail();
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการยืนยันแบบป้าย");
    }
  };

  const handleRejectProductionLabel = async () => {
    if (!order?.productionWorkflow?.labeling) return;
    if (!labelRejectionReason.trim()) {
      toast.error("กรุณาระบุเหตุผลที่ต้องการให้กราฟิกแก้ไข");
      return;
    }

    const nextWorkflow = {
      ...order.productionWorkflow,
      labeling: {
        ...order.productionWorkflow.labeling,
        status: "issue",
        remark: labelRejectionReason,
        updatedAt: new Date().toLocaleString("th-TH"),
        updatedBy: "ฝ่ายขาย",
        updateLogs: [
          ...(order.productionWorkflow.labeling.updateLogs || []),
          {
            action: "เซลล์ส่งกลับแก้ไขแบบป้าย",
            timestamp: new Date().toLocaleString("th-TH"),
            user: "ฝ่ายขาย",
            detail: labelRejectionReason,
          },
        ],
      },
    };

    try {
      await fetch(`${API_BASE_URL}/orders.php?id=${encodeURIComponent(String(order?.numericId || orderId))}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_status: "รอกราฟิกแก้ไขแบบป้าย",
          production_workflow: nextWorkflow,
        }),
      });

      toast.info("ส่งกลับให้กราฟิกแก้ไขแบบป้ายแล้ว");
      setLabelRejectionReason("");
      fetchOrderDetail();
    } catch (e) {
      toast.error("เกิดข้อผิดพลาดในการส่งกลับแก้ไขแบบป้าย");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดรายละเอียดพื้นฐาน...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">ไม่พบคำสั่งซื้อที่ต้องการ</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/sales/track-orders')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปหน้ารายการ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} ${config.textColor} border-0 flex items-center gap-1.5 px-3 py-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getItemStatusBadge = (status: string) => {
    const index = getStatusIndex(status);
    const total = productStatusList.length;
    const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

    let bgColor = "bg-gray-100 text-gray-800";
    if (progress >= 90) bgColor = "bg-green-100 text-green-800";
    else if (progress >= 60) bgColor = "bg-blue-100 text-blue-800";
    else if (progress >= 30) bgColor = "bg-amber-100 text-amber-800";
    else bgColor = "bg-gray-100 text-gray-800";

    return (
      <Badge className={`${bgColor} font-medium`}>
        {status}
      </Badge>
    );
  };

  const slowestItem = getSlowestItem(order.orderItems);
  const statusCounts = getStatusCounts(order.orderItems);
  const graphicFiles = getGraphicFilesFromDesignJob(designJob);
  const primaryArtworkFile = getPrimaryArtworkFile(graphicFiles);
  const isArtworkWaitingReview = Boolean(
    designJob
    && designJob.artwork_status === "pending_review"
  );
  const displayDesignFiles = order.designFiles && order.designFiles.length > 0
    ? order.designFiles
    : graphicFiles.map((file) => ({ url: file.url, name: file.name }));
  const labelReviewStep = order.productionWorkflow?.labeling || null;
  const isLabelWaitingSales = labelReviewStep?.status === "waiting_sales";
  const labelReviewImages = Array.isArray(labelReviewStep?.imagePreviews) ? labelReviewStep.imagePreviews : [];
  const latestLabelReviewImage = labelReviewImages[labelReviewImages.length - 1] || null;
  const graphicsDetail = order.graphicsNotes
    || designJob?.description
    || designJob?.internal_notes
    || designJob?.specs
    || designJob?.feedback
    || "";
  const shippingStep = order.productionWorkflow?.shipping || null;
  const deliveryDetails = {
    carrierName: shippingStep?.carrierName || "-",
    trackingNumber: shippingStep?.trackingNumber || "-",
    deliveryLink: "",
    vehiclePickup: false,
    vehicleInfo: null as { driverName?: string; vehiclePlate?: string; contactPhone?: string } | null,
  };

  return (
    <>
      <div className="min-h-screen bg-[#F7F7F7] p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/sales/track-orders')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับ
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  รายละเอียดคำสั่งซื้อ: {order.id}
                </h1>
                <p className="text-muted-foreground">ข้อมูลและสถานะการดำเนินงานของคำสั่งซื้อ</p>
              </div>
            </div>
            {getStatusBadge(order.status)}
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              ข้อมูลลูกค้า
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ชื่อลูกค้า</p>
                <p className="font-medium">{order.customer}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เลขผู้เสียภาษี</p>
                <p className="font-medium">{order.taxId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>
                <p className="font-medium">{order.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">อีเมล</p>
                <p className="font-medium">{order.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Line ID</p>
                <p className="font-medium">{order.lineId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ที่อยู่</p>
                <p className="font-medium">{order.address}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ประเภทเอกสาร</p>
                <Badge variant="outline" className="mt-1">
                  {order.invoiceType === 'tax-invoice' ? 'ใบกำกับภาษี' : 'ไม่ออกใบกำกับภาษี/บิลเงินสด'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Order Info + Status Overview Combined */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">ข้อมูลคำสั่งซื้อ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">ชื่องาน</p>
                <p className="font-medium">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">วันที่ใช้งาน</p>
                <p className="font-medium">{order.dueDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ประเภทสินค้า / สินค้า</p>
                <p className="font-medium">
                  {(order.orderItems[0] as any)?.productType === "readymade"
                    ? `สินค้าสำเร็จรูป > ${order.orderItems[0]?.name || '-'}`
                    : `สินค้าสั่งผลิต > ${order.orderItems[0]?.name || '-'}`
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {(order.orderItems[0] as any)?.productType === "readymade" && order.orderItems[0]?.name?.includes("เหรียญสำเร็จรูป")
                    ? "รุ่นสินค้า"
                    : "วัสดุ"
                  }
                </p>
                <p className="font-medium">{(order.orderItems[0] as any)?.material || (order.orderItems[0] as any)?.productModel || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">จำนวน</p>
                <p className="font-medium">{order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น</p>
              </div>
              {order.quotationUrl && (
                <div>
                  <p className="text-sm text-muted-foreground">ใบเสนอราคา</p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={() => window.open(order.quotationUrl, '_blank')}
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    ดูไฟล์ใบเสนอราคา
                  </Button>
                </div>
              )}
            </div>

            {/* Production Progress Bar */}
            <ProductionProgressBar currentStatus={order.orderStatus || order.orderItems[0]?.currentStatus || ""} />
          </div>

          {/* Product Details - Dynamic based on product type */}
          {(() => {
            const currentItem = order.orderItems[0] as any;
            const isReadymadeTrophy = currentItem?.productType === "readymade" && currentItem?.name?.includes("ถ้วยรางวัล");

            if (isReadymadeTrophy) {
              const trophySizes = order.orderItems.map((item: any) => ({
                name: item.name || "ถ้วยรางวัล",
                size: item.size || item.modelSize || item.details?.size || "-",
                quantity: item.quantity || 0,
              }));

              return (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold mb-4">รายละเอียดสินค้า</h2>

                  {/* Trophy Product Table */}
                  <div className="rounded-lg border overflow-hidden mb-6">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-center w-20">ลำดับ</TableHead>
                          <TableHead>รายการ</TableHead>
                          <TableHead>รายละเอียดงาน</TableHead>
                          <TableHead className="text-right w-32">จำนวน</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trophySizes.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-center font-medium">{index + 1}</TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-muted-foreground">ขนาด {item.size}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={3} className="font-semibold">รวมทั้งหมด</TableCell>
                          <TableCell className="text-right font-semibold">
                            {trophySizes.reduce((sum, item) => sum + item.quantity, 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Additional Trophy Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">รุ่นโมเดล</p>
                      <p className="font-medium">{currentItem.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ป้ายจารึก (เบอร์ และสี)</p>
                      <p className="font-medium">{currentItem.engraving?.number} - {currentItem.engraving?.color}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">โบว์ (เบอร์)</p>
                      <p className="font-medium">{currentItem.bow?.number}</p>
                    </div>
                  </div>
                </div>
              );
            }

            // Check if it's a readymade medal
            const isReadymadeMedal = currentItem?.productType === "readymade" && currentItem?.name?.includes("เหรียญสำเร็จรูป");

            if (isReadymadeMedal) {
              const colorQuantities = order.orderItems.map((item: any) => ({
                color: item.color || item.details?.color || item.name || "-",
                quantity: item.quantity || 0,
              }));

              return (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold mb-6">รายละเอียดสินค้า</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left px-4 py-3 text-sm text-muted-foreground font-medium w-1/2">สี</th>
                              <th className="text-right px-4 py-3 text-sm text-muted-foreground font-medium w-1/2">จำนวน</th>
                            </tr>
                          </thead>
                          <tbody>
                            {colorQuantities.map((item, index) => (
                              <tr key={index} className="border-t">
                                <td className="px-4 py-3 font-medium">{item.color}</td>
                                <td className="px-4 py-3 text-right">{item.quantity.toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr className="border-t bg-muted/30">
                              <td className="px-4 py-3 font-semibold">รวม</td>
                              <td className="px-4 py-3 text-right font-semibold">
                                {colorQuantities.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">สายคล้อง</p>
                      <p className="font-medium">{currentItem.details?.lanyardSize || currentItem.bowType || "-"}</p>
                    </div>
                  </div>
                </div>
              );
            }

            // Default product details for other product types (made-to-order)
            // Extract product details from order data
            const productDetails = order?.productDetails || {};
            const platingColors = productDetails.platingColors || order?.platingColors || [];
            const frontDetails = productDetails.frontDetails || order?.frontDetails || [];
            const backDetails = productDetails.backDetails || order?.backDetails || [];
            const lanyardInfo = productDetails.lanyard || order?.lanyard || null;
            const patternCount = productDetails.patternCount || order?.patternCount || null;

            return (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">รายละเอียดสินค้า</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">ขนาด</p>
                    <p className="font-medium">{productDetails.size || order?.size || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ความหนา</p>
                    <p className="font-medium">{productDetails.thickness || order?.thickness || "-"}</p>
                  </div>
                  {platingColors.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">สี (เลือกได้หลายรายการ)</p>
                      <div className="flex flex-wrap gap-2">
                        {platingColors.map((color: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="px-3 py-1">{color}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {frontDetails.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">รายละเอียดด้านหน้า (เลือกได้หลายรายการ)</p>
                      <div className="flex flex-wrap gap-2">
                        {frontDetails.map((detail: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="px-3 py-1">{detail}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {backDetails.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">รายละเอียดด้านหลัง (เลือกได้หลายรายการ)</p>
                      <div className="flex flex-wrap gap-2">
                        {backDetails.map((detail: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="px-3 py-1">{detail}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {lanyardInfo && (
                    <div>
                      <p className="text-sm text-muted-foreground">สายคล้อง</p>
                      <p className="font-medium">{lanyardInfo}</p>
                    </div>
                  )}
                  {patternCount && (
                    <div>
                      <p className="text-sm text-muted-foreground">จำนวนลาย</p>
                      <p className="font-medium">{patternCount}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Graphics & Design Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              ข้อมูลงานกราฟิก
            </h2>

            {/* Graphics Notes */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-1">รายละเอียดการเชื่อมกราฟิก</p>
              <div className="p-4 bg-muted/30 rounded-lg min-h-[60px]">
                {graphicsDetail ? (
                  <p className="whitespace-pre-wrap">{graphicsDetail}</p>
                ) : (
                  <p className="text-muted-foreground italic text-sm">ไม่มีข้อมูลเพิ่มเติม</p>
                )}
              </div>
            </div>

            {/* Design Files */}
            <div>
              <p className="text-sm text-muted-foreground mb-3 font-medium">ไฟล์งานออกแบบ ({displayDesignFiles.length} ไฟล์)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {displayDesignFiles.length > 0 ? (
                  displayDesignFiles.map((file, idx) => {
                    const fileUrl = getOrderDesignFileUrl(file);
                    const fileName = getOrderDesignFileName(file, idx);
                    const canPreview = isOrderDesignImage(file);

                    return (
                      <div key={`${fileUrl}-${idx}`} className="border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
                        <div className="h-28 bg-muted/30 flex items-center justify-center border-b">
                          {canPreview ? (
                            <img
                              src={fileUrl}
                              alt={fileName}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <FileText className="w-8 h-8 text-primary" />
                          )}
                        </div>
                        <div className="p-3 flex items-center justify-between gap-2">
                          <div className="truncate">
                            <p className="font-medium text-sm truncate" title={fileName}>{fileName}</p>
                            <p className="text-[10px] text-muted-foreground truncate uppercase">{fileName.split('.').pop()}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0" onClick={() => window.open(fileUrl, '_blank')}>
                            <Eye className="w-4 h-4 text-primary" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <p className="text-sm">ไม่มีไฟล์งานที่แนบไว้</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Artwork Image */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">ข้อมูล Artwork</h2>
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">รูป Artwork</p>
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="flex justify-center">
                  {primaryArtworkFile && isOrderDesignImage({ url: primaryArtworkFile.url, name: primaryArtworkFile.name }) ? (
                    <img
                      src={primaryArtworkFile.url}
                      alt={primaryArtworkFile.name}
                      className="max-w-full h-auto max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setEnlargedImage(primaryArtworkFile.url)}
                    />
                  ) : primaryArtworkFile ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                      <FileText className="w-12 h-12 mb-2 opacity-20" />
                      <p className="font-medium text-foreground">{primaryArtworkFile.name}</p>
                      <p className="text-sm mt-1">ไฟล์นี้ไม่ใช่รูปภาพ กดเปิดไฟล์เพื่อตรวจสอบ</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => window.open(primaryArtworkFile.url, "_blank")}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        เปิดไฟล์
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                      <p>ยังไม่มีการอัพโหลดรูป Artwork</p>
                    </div>
                  )}
                </div>
                {primaryArtworkFile && isOrderDesignImage({ url: primaryArtworkFile.url, name: primaryArtworkFile.name }) && (
                  <p className="text-sm text-primary text-center mt-3 cursor-pointer hover:underline">
                    คลิกที่รูปเพื่อขยายเต็มจอ
                  </p>
                )}
              </div>

              {/* Artwork Approval Interface for Sales */}
              {isArtworkWaitingReview && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-900">ตรวจจารึก / แบบป้าย</h3>
                      <p className="text-xs text-amber-700">กราฟิกส่งแบบให้คุณตรวจสอบ กรุณายืนยันเพื่อดำเนินการต่อ</p>
                    </div>
                    <Badge className="ml-auto bg-amber-500 text-white border-none">รอคุณอนุมัติ</Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-amber-800">ความคิดเห็น / เหตุผลที่ต้องการให้แก้ไข (กรณีไม่ผ่าน)</label>
                      <textarea
                        className="w-full min-h-[80px] p-3 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                        placeholder="ระบุสิ่งที่ต้องการให้แก้ไข..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={handleApproveArtwork}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        อนุมัติแบบ (ผ่าน)
                      </Button>
                      <Button 
                        onClick={handleRejectArtwork}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        ส่งกลับแก้ไข
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {isLabelWaitingSales && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">ตรวจแบบป้ายจารึกจากกราฟิก</h3>
                      <p className="text-xs text-blue-700">กราฟิกส่งแบบป้ายมาให้ตรวจ กรุณายืนยันก่อนปลดล็อกขั้นตอน QC</p>
                    </div>
                    <Badge className="ml-auto bg-blue-500 text-white border-none">รอเซลล์ยืนยัน</Badge>
                  </div>

                  {latestLabelReviewImage && (
                    <div className="mb-4 border rounded-lg bg-white p-3">
                      <img
                        src={latestLabelReviewImage}
                        alt="แบบป้ายจารึก"
                        className="max-h-72 w-full object-contain cursor-pointer"
                        onClick={() => setEnlargedImage(latestLabelReviewImage)}
                      />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-blue-800">ความคิดเห็น / เหตุผลที่ต้องการให้แก้ไข (กรณีไม่ผ่าน)</label>
                      <textarea
                        className="w-full min-h-[80px] p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="ระบุสิ่งที่ต้องการให้กราฟิกแก้ไข..."
                        value={labelRejectionReason}
                        onChange={(e) => setLabelRejectionReason(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleApproveProductionLabel}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        เซลล์ยืนยันแบบป้าย
                      </Button>
                      <Button
                        onClick={handleRejectProductionLabel}
                        variant="outline"
                        className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        ส่งกลับแก้ไข
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Badge for existing states */}
              {designJob?.artwork_status === 'approved' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center gap-3 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">อนุมัติแบบจารึกแล้ว - พร้อมสั่งผลิต</span>
                </div>
              )}
              {designJob?.artwork_status === 'rejected' && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700">
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-sm font-medium">ส่งกลับแก้ไข - รอรายละเอียดจากกราฟิก</span>
                </div>
              )}
            </div>

            {/* Design Files */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">ไฟล์งานออกแบบจากกราฟิก</p>
              {graphicFiles.length > 0 ? (
                <div className="space-y-2">
                  {graphicFiles.map((file, idx) => (
                    <div key={idx} className="border rounded-lg p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {isOrderDesignImage({ url: file.url, name: file.name }) ? (
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            <FileText className="w-5 h-5 text-orange-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{file.name || `ไฟล์ ${idx + 1}`}</p>
                            <Badge variant="outline" className="text-[10px] h-5">{file.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {file.uploadedAt && new Date(file.uploadedAt).toLocaleString('th-TH')}
                            {file.uploadedBy && ` • ${file.uploadedBy}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          ดูไฟล์
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2"
                    onClick={() => setShowUploadHistory(true)}
                  >
                    <History className="w-4 h-4 mr-2" />
                    ประวัติการอัพโหลดทั้งหมด
                  </Button>
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground">
                  <FileText className="w-12 h-12 mb-2 opacity-20" />
                  <p className="text-sm">ยังไม่มีไฟล์งานออกแบบจากกราฟิก</p>
                  <p className="text-xs mt-1">รอกราฟิกอัปโหลดไฟล์งานออกแบบ</p>
                </div>
              )}
            </div>
          </div>

          {/* Upload History Dialog */}
          <Dialog open={showUploadHistory} onOpenChange={setShowUploadHistory}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>ประวัติการอัพโหลดไฟล์</DialogTitle>
              </DialogHeader>
              {/* <div className="space-y-3">
                <div className="border rounded-lg p-3 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                      <FileText className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">artwork_final_v3.ai</p>
                      <p className="text-xs text-muted-foreground">18/1/2567 14:32:15 • สมชาย กราฟิก</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">ล่าสุด</Badge>
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                      <FileText className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">artwork_final_v2.ai</p>
                      <p className="text-xs text-muted-foreground">17/1/2567 10:15:30 • สมชาย กราฟิก</p>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                      <FileText className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">artwork_draft_v1.ai</p>
                      <p className="text-xs text-muted-foreground">15/1/2567 16:45:00 • สมชาย กราฟิก</p>
                    </div>
                  </div>
                </div>
              </div> */}
            </DialogContent>
          </Dialog>

          {/* สถานะการผลิต - Dynamic based on order status */}
          {/* Hidden for JOB-2024-001 as it uses QCVerificationCards */}
          {/* ============================== */}
          {order.id !== "JOB-2024-001" && (() => {
            const currentItem = order.orderItems[0] as any;
            const isReadymadeTrophy = currentItem?.productType === "readymade" && currentItem?.name?.includes("ถ้วยรางวัล");
            const isReadymadeMedal = currentItem?.productType === "readymade" && currentItem?.name?.includes("เหรียญสำเร็จรูป");

            // Define production steps based on product type
            const productionSteps = isReadymadeTrophy ? [
              { key: "จัดหา", label: "จัดหา" },
              { key: "ประกอบสินค้า", label: "ประกอบสินค้า" },
              { key: "ผูกโบว์", label: "ผูกโบว์" },
              { key: "ติดป้ายจารึก", label: "ติดป้ายจารึก" },
              { key: "สินค้าประกอบเสร็จ", label: "สินค้าประกอบเสร็จ" },
            ] : isReadymadeMedal ? [
              { key: "จัดหาสินค้า", label: "จัดหาสินค้า" },
              { key: "ติดสติ๊กเกอร์", label: "ติดสติ๊กเกอร์" },
              { key: "คล้องสาย", label: "คล้องสาย" },
              { key: "สินค้าพร้อมส่ง", label: "สินค้าพร้อมส่ง" },
            ] : [
              { key: "ตรวจสอบ Artwork จากโรงงาน", label: "ตรวจสอบ Artwork จากโรงงาน" },
              { key: "ตรวจสอบ CNC", label: "ตรวจสอบ งาน CNC", requiresMultiApproval: true },
              { key: "อัปเดทปั้มชิ้นงาน", label: "ตรวจสอบ ปั้มชิ้นงาน" },
              { key: "อัปเดตสาย", label: "ตรวจสอบ สายคล้อง" },
              { key: "อัปเดตชิ้นงานก่อนจัดส่ง", label: "ตรวจสอบ ชิ้นงานก่อนจัดส่ง" },
              { key: "งานเสร็จสมบูรณ์", label: "ผลิตเสร็จจากโรงงาน" },
            ];

            // Mock data for multi-department approvals (ตรวจสอบ CNC requires both เซลล์ and จัดซื้อ)
            const multiApprovalData: Record<string, { department: string; approved: boolean; approvedBy?: string; approvedAt?: string }[]> = {
              "ตรวจสอบ CNC": [
                { department: "จัดซื้อ", approved: true, approvedBy: "วิชัย", approvedAt: "2025-01-05 14:30" },
                { department: "เซลล์", approved: false },
              ]
            };

            // Get current item's status
            const currentStatus = currentItem?.currentStatus || "";

            // Find which step we're at
            const currentStepIndex = productionSteps.findIndex(s => s.key === currentStatus);
            const completedSteps = currentStepIndex >= 0 ? currentStepIndex + 1 : 0;
            const totalSteps = productionSteps.length;
            const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
            const isCompleted = progressPercent === 100;

            // Check if production has started
            const statusHistory = currentItem?.statusHistory || [];
            const hasStartedProduction = statusHistory.some((h: any) =>
              productionSteps.some(s => s.key === h.status)
            );

            // Always show production status section (removed condition that hid it)

            return (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 ${isCompleted ? 'bg-green-100' : 'bg-amber-100'} rounded-lg flex items-center justify-center`}>
                    <Factory className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-amber-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">สถานะการผลิต</h2>
                    <p className="text-xs text-muted-foreground">การผลิตจากโรงงาน</p>
                  </div>
                  <Badge className={isCompleted ? "bg-green-500 text-white" : "bg-amber-500 text-white"}>
                    {isCompleted ? "เสร็จสิ้น" : "กำลังผลิต"}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`${isCompleted ? 'bg-green-500' : 'bg-amber-500'} h-1.5 rounded-full transition-all duration-300`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                    {progressPercent}%
                  </span>
                </div>

                {/* Production Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">วันที่สั่งผลิต</p>
                    <p className="text-sm font-medium">{order.orderDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">กำหนดเสร็จ</p>
                    <p className="text-sm font-medium">{order.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">โรงงาน</p>
                    <p className="text-sm font-medium">
                      {statusHistory.find(h => h.department === "โรงงาน")?.updatedBy || "โรงงาน A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">เลข PO</p>
                    <p className="text-sm font-medium">PO-2567-{order.id.split('-')[2]}</p>
                  </div>
                </div>

                {/* Production Steps - Accordion */}
                <Accordion type="single" collapsible defaultValue="completed">
                  <AccordionItem value="completed" className="border rounded-lg">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-sm font-medium">ขั้นตอนทั้งหมด</span>
                        <Badge
                          variant="secondary"
                          className={`text-xs h-5 ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                        >
                          {completedSteps}/{totalSteps}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-2">
                      <div className="space-y-2">
                        {productionSteps.map((step, idx) => {
                          const stepHistory = statusHistory.find(h => h.status === step.key);
                          const isStepCompleted = stepHistory !== undefined;
                          const isCurrentStep = step.key === currentStatus;
                          const isFinalStep = idx === productionSteps.length - 1;
                          const hasMultiApproval = (step as any).requiresMultiApproval;
                          const approvalList = multiApprovalData[step.key] || [];

                          return (
                            <div
                              key={step.key}
                              className={`py-1.5 ${idx > 0 ? 'border-t' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                {isStepCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                ) : isCurrentStep ? (
                                  <Circle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                )}

                                {!isFinalStep && (
                                  <div
                                    className={`w-10 h-10 ${isStepCompleted || isCurrentStep ? 'bg-muted' : 'bg-gray-100'} rounded overflow-hidden flex-shrink-0 ${isStepCompleted ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                    onClick={() => isStepCompleted && setEnlargedImage(artworkSample)}
                                  >
                                    {(isStepCompleted || isCurrentStep) && (
                                      <img src={artworkSample} alt={step.label} className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${!isStepCompleted && !isCurrentStep ? 'text-gray-400' : ''}`}>
                                    {step.label}
                                  </p>
                                  {stepHistory ? (
                                    <p className="text-xs text-muted-foreground">
                                      {stepHistory.updatedAt} • {stepHistory.updatedBy}
                                    </p>
                                  ) : isCurrentStep ? (
                                    <p className="text-xs text-amber-600">รอตรวจสอบ</p>
                                  ) : (
                                    <p className="text-xs text-gray-400">รอดำเนินการ</p>
                                  )}
                                </div>
                                {isStepCompleted ? (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs h-5">
                                    {isFinalStep ? 'เสร็จสิ้น' : 'ผ่าน'}
                                  </Badge>
                                ) : isCurrentStep ? (
                                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs h-5">
                                    รอตรวจสอบ
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-400 hover:bg-gray-100 text-xs h-5">
                                    รอดำเนินการ
                                  </Badge>
                                )}
                              </div>

                              {/* Multi-department approval section */}
                              {isCurrentStep && hasMultiApproval && approvalList.length > 0 && (
                                <div className="ml-14 mt-2 space-y-2">
                                  {approvalList.map((approval, aIdx) => (
                                    <div
                                      key={aIdx}
                                      className={`flex items-center gap-3 p-2 rounded-lg ${approval.approved ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}
                                    >
                                      {approval.approved ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                      )}

                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">
                                          แผนก{approval.department}
                                        </p>
                                        {approval.approved ? (
                                          <p className="text-xs text-green-600">
                                            {approval.approvedAt} • {approval.approvedBy}
                                          </p>
                                        ) : (
                                          <p className="text-xs text-amber-600">รอตรวจสอบ</p>
                                        )}
                                      </div>

                                      {approval.approved ? (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs h-5">
                                          ผ่าน
                                        </Badge>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-green-600 border-green-300 hover:bg-green-50">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            ผ่าน
                                          </Button>
                                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-red-600 border-red-300 hover:bg-red-50">
                                            <XCircle className="w-3 h-3 mr-1" />
                                            ไม่ผ่าน
                                          </Button>
                                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs h-5">
                                            รอตรวจสอบ
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            );
          })()}

          {/* ============================== */}
          {/* ข้อมูลออเดอร์และการจัดส่ง (Read-Only) - for JOB-2024-001 */}
          {/* ============================== */}
          {order.id === "JOB-2024-001" && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">ข้อมูลออเดอร์และการจัดส่ง (จากแผนกจัดซื้อ)</h2>
              <ProductionOrderInfoReadOnly
                data={{
                  orderer: "สมชาย สุขใจ",
                  poNumber: "PO-2567-001",
                  shipDate: "2025-01-15",
                  splitQuantity: "3 ล็อต",
                  totalSales: 150000,
                  vat: 7,
                  shippingChannel: "SEA",
                  shippingCostRMB: 2500,
                  exchangeRate: 5.5,
                  shippingCostTHB: 13750
                }}
              />
            </div>
          )}

          {/* ============================== */}
          {/* QC Verification Cards - for JOB-2024-001 */}
          {/* ============================== */}
          {order.id === "JOB-2024-001" && (
            <QCVerificationCards orderId={order.id} userRole="เซลล์" />
          )}

          {/* ============================== */}
          {/* สถานะการขนส่งระหว่างประเทศ - เสร็จสิ้น (hide for readymade products) */}
          {/* แสดงก่อน Logistics & Delivery Cards */}
          {/* ============================== */}
          {(() => {
            const currentItem = order.orderItems[0] as any;
            const isReadymadeTrophy = currentItem?.productType === "readymade" && currentItem?.name?.includes("ถ้วยรางวัล");
            const isReadymadeMedal = currentItem?.productType === "readymade" && currentItem?.name?.includes("เหรียญสำเร็จรูป");

            // Don't show international shipping for readymade products (trophy & medal)
            if (isReadymadeTrophy || isReadymadeMedal) {
              return null;
            }

            return (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">สถานะการขนส่งระหว่างประเทศ</h2>
                    <p className="text-xs text-muted-foreground">การขนส่งจากโรงงานต่างประเทศ</p>
                  </div>
                  <Badge className="bg-amber-500 text-white">รอดำเนินการ</Badge>
                </div>

                {/* Progress bar - 0% */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">0%</span>
                </div>

                {/* Timeline - Accordion */}
                <Accordion type="single" collapsible defaultValue="shipping">
                  <AccordionItem value="shipping" className="border rounded-lg">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium">ขั้นตอนทั้งหมด</span>
                        <Badge variant="secondary" className="text-xs h-5 bg-amber-100 text-amber-700">0/3</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-2">
                      <div className="space-y-2">
                        {/* Step 1 - ส่งออกจากโรงงาน */}
                        <div className="flex items-center gap-3 py-1.5">
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <Factory className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">ส่งออกจากโรงงาน</p>
                            <p className="text-xs text-muted-foreground">-</p>
                          </div>
                          <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 text-xs h-5">ยังไม่เริ่ม</Badge>
                        </div>

                        {/* Step 2 - อยู่ระหว่างขนส่ง */}
                        <div className="flex items-center gap-3 py-1.5 border-t">
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <Ship className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">อยู่ระหว่างขนส่ง</p>
                            <p className="text-xs text-muted-foreground">-</p>
                          </div>
                          <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 text-xs h-5">ยังไม่เริ่ม</Badge>
                        </div>

                        {/* Step 3 - ถึงประเทศไทย */}
                        <div className="flex items-center gap-3 py-1.5 border-t">
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">ถึงประเทศไทย</p>
                            <p className="text-xs text-muted-foreground">-</p>
                          </div>
                          <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 text-xs h-5">ยังไม่เริ่ม</Badge>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            );
          })()}

          {/* ============================== */}
          {/* Logistics & Delivery Cards - for JOB-2024-001 (หลัง International Shipping) */}
          {/* ============================== */}
          {/* Logistics & Delivery Cards - shown when ready to ship or shipped */}
          {(order.status === "shipped" || order.status === "ready_to_ship") && (
            <LogisticsDeliveryCards orderId={order.id} userRole="เซลล์" />
          )}

          {/* ============================== */}
          {/* สถานะคลังสินค้า & QC - Shown for non-shipped orders or after production */}
          {/* ============================== */}
          {order.status !== "pending_approval" && (() => {
            const currentItem = order.orderItems[0] as any;
            const isReadymadeMedal = currentItem?.productType === "readymade" && currentItem?.name?.includes("เหรียญสำเร็จรูป");
            const isReadymadeTrophy = currentItem?.productType === "readymade" && currentItem?.name?.includes("ถ้วยรางวัล");
            const isReadymadeProduct = isReadymadeMedal || isReadymadeTrophy;

            // Warehouse steps - simplified for ready-made products (no โกดัง steps)
            const warehouseSteps = isReadymadeProduct ? [
              { key: "qc", label: "ตรวจนับ & QC ที่ร้าน", icon: "clipboard", detail: `${order.dueDate} 14:00 • QC: วิภา`, subDetail: isReadymadeMedal ? `ผ่าน QC ครบ ${order.orderItems[0].quantity} ชิ้น` : `ผ่าน QC ครบ ${order.orderItems[0].quantity} ชิ้น`, badge: "ผ่าน QC" },
              { key: "ready", label: "พร้อมจัดส่งให้ลูกค้า", icon: "send", detail: `${order.dueDate} 09:00 • เตรียมแพ็คสินค้า`, badge: "Ready" },
              { key: "delivered", label: "จัดส่งสำเร็จ", icon: "thumbsup", detail: `${order.dueDate} 10:30 • ลูกค้ารับสินค้าเรียบร้อย`, subDetail: `ผู้รับ: ${order.customer}`, badge: "สำเร็จ", isClickable: true },
            ] : [
              { key: "warehouse", label: "รับเข้าโกดังไทย", icon: "warehouse", detail: `${order.dueDate} 10:00 • คลังสินค้า`, subDetail: `จำนวนรับจริง: ${order.orderItems[0].quantity} ชิ้น`, badge: "เสร็จสิ้น" },
              { key: "transfer", label: "ส่งจากโกดัง → ร้าน", icon: "truck", detail: `${order.dueDate} 08:30 • พนักงานคลัง: สมศักดิ์`, badge: "เสร็จสิ้น" },
              { key: "qc", label: "ตรวจนับ & QC ที่ร้าน", icon: "clipboard", detail: `${order.dueDate} 14:00 • QC: วิภา`, subDetail: `ผ่าน QC ครบ ${order.orderItems[0].quantity} ชิ้น`, badge: "ผ่าน QC" },
              { key: "ready", label: "พร้อมจัดส่งให้ลูกค้า", icon: "send", detail: `${order.dueDate} 09:00 • เตรียมแพ็คสินค้า`, badge: "Ready" },
              { key: "delivered", label: "จัดส่งสำเร็จ", icon: "thumbsup", detail: `${order.dueDate} 10:30 • ลูกค้ารับสินค้าเรียบร้อย`, subDetail: `ผู้รับ: ${order.customer}`, badge: "สำเร็จ", isClickable: true },
            ];

            const totalSteps = warehouseSteps.length;

            const getStepIcon = (iconName: string, className: string) => {
              switch (iconName) {
                case "warehouse": return <Warehouse className={className} />;
                case "truck": return <Truck className={className} />;
                case "clipboard": return <ClipboardCheck className={className} />;
                case "send": return <Send className={className} />;
                case "thumbsup": return <ThumbsUp className={className} />;
                default: return <Warehouse className={className} />;
              }
            };

            return (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <Warehouse className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">สถานะคลังสินค้า & การตรวจสอบคุณภาพ (QC)</h2>
                    <p className="text-xs text-muted-foreground">การจัดการสินค้าภายในประเทศ</p>
                  </div>
                  <Badge className="bg-green-500 text-white">จัดส่งสำเร็จ</Badge>
                </div>

                {/* Progress bar - 0% */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">0%</span>
                </div>

                {/* Timeline - Accordion */}
                <Accordion type="single" collapsible defaultValue="warehouse">
                  <AccordionItem value="warehouse" className="border rounded-lg">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">ขั้นตอนทั้งหมด</span>
                        <Badge variant="secondary" className="text-xs h-5 bg-green-100 text-green-700">{totalSteps}/{totalSteps}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-2">
                      <div className="space-y-2">
                        {warehouseSteps.map((step, idx) => {
                          const isLast = idx === warehouseSteps.length - 1;
                          const isClickable = (step as any).isClickable;

                          return (
                            <div
                              key={step.key}
                              className={`flex items-center gap-3 py-1.5 ${idx > 0 ? 'border-t' : ''} ${isLast ? 'bg-green-50 -mx-3 px-3 rounded-b-lg' : ''} ${isClickable ? 'cursor-pointer hover:bg-green-100 transition-colors' : ''}`}
                              onClick={() => isClickable && setShowDeliveryDetail(true)}
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                              {getStepIcon(step.icon, isLast ? "w-4 h-4 text-green-600 flex-shrink-0" : "w-4 h-4 text-muted-foreground flex-shrink-0")}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${isLast ? 'text-green-700 underline underline-offset-2' : ''}`}>{step.label}</p>
                                <p className={`text-xs ${isLast ? 'text-green-600' : 'text-muted-foreground'}`}>{step.detail}</p>
                                {step.subDetail && (
                                  <p className={`text-xs ${step.key === 'qc' ? 'text-green-600' : 'text-muted-foreground'}`}>{step.subDetail}</p>
                                )}
                              </div>
                              <Badge className={`${isLast ? 'bg-green-500 text-white hover:bg-green-500' : 'bg-green-100 text-green-700 hover:bg-green-100'} text-xs h-5`}>
                                {step.badge}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Summary Card */}
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">คำสั่งซื้อสำเร็จ</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">วันที่สั่งซื้อ</p>
                      <p className="font-medium">{order.orderDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">วันที่จัดลงคลัง/สำเร็จ</p>
                      <p className="font-medium text-green-600">{order.dueDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ระยะเวลาทั้งหมด</p>
                      <p className="font-medium">-</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">จำนวนสินค้า</p>
                      <p className="font-medium">{order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Payment History */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              ประวัติการชำระเงิน
            </h2>

            <div className="space-y-4">
              {order.payments && order.payments.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>ลำดับ</TableHead>
                        <TableHead>ประเภท</TableHead>
                        <TableHead>วัน/เวลาโอน</TableHead>
                        <TableHead>ธนาคารที่รับ</TableHead>
                        <TableHead className="text-right">จำนวนเงิน</TableHead>
                        <TableHead className="text-center w-20">สลิป</TableHead>
                        <TableHead>รายละเอียด</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.payments.map((p, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium text-sm">{idx + 1}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-normal font-sm">
                              {p.payment_label || p.payment_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {p.transfer_date || "-"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {p.receiving_bank || "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {p.amount ? parseFloat(p.amount).toLocaleString() : "0"} ฿
                          </TableCell>
                          <TableCell className="text-center">
                            {p.slip_url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => window.open(p.slip_url, '_blank')}
                                title="ดูสลิป"
                              >
                                <ImageIcon className="w-4 h-4 text-primary" />
                              </Button>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                            {p.additional_details || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={4} className="font-semibold text-right">ยอดชำระแล้วทั้งหมด</TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {order.payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toLocaleString()} ฿
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="border border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-muted-foreground">
                  <Clock className="w-10 h-10 mb-2 opacity-20" />
                  <p>ไม่พบรายการประวัติการชำระเงิน</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox Dialog */}
      <Dialog open={!!enlargedImage} onOpenChange={() => setEnlargedImage(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>ขยายรูปภาพ</DialogTitle>
          </DialogHeader>
          {enlargedImage && (
            <img
              src={enlargedImage}
              alt="รูปภาพขยาย"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delivery Detail Dialog */}
      <Dialog open={showDeliveryDetail} onOpenChange={setShowDeliveryDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-600" />
              รายละเอียดการจัดส่ง
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Carrier Name */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Package className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">ชื่อขนส่ง</p>
                <p className="font-medium">{deliveryDetails.carrierName}</p>
              </div>
            </div>

            {/* Tracking Number */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">เลขที่พัสดุ</p>
                <p className="font-medium font-mono">{deliveryDetails.trackingNumber}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(deliveryDetails.trackingNumber)}
              >
                คัดลอก
              </Button>
            </div>

            {/* Delivery Link */}
            {deliveryDetails.deliveryLink && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Globe className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">ลิงก์ติดตามพัสดุ</p>
                  <a
                    href={deliveryDetails.deliveryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all"
                  >
                    {deliveryDetails.deliveryLink}
                  </a>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(deliveryDetails.deliveryLink, '_blank')}
                >
                  เปิด
                </Button>
              </div>
            )}

            {/* Vehicle Pickup Info (if applicable) */}
            {deliveryDetails.vehiclePickup && deliveryDetails.vehicleInfo && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-700">เรียกรถเข้ามารับ</span>
                </div>
                <div className="space-y-1 text-sm">
                  {deliveryDetails.vehicleInfo.driverName && (
                    <p><span className="text-muted-foreground">คนขับ:</span> {deliveryDetails.vehicleInfo.driverName}</p>
                  )}
                  {deliveryDetails.vehicleInfo.vehiclePlate && (
                    <p><span className="text-muted-foreground">ทะเบียนรถ:</span> {deliveryDetails.vehicleInfo.vehiclePlate}</p>
                  )}
                  {deliveryDetails.vehicleInfo.contactPhone && (
                    <p><span className="text-muted-foreground">เบอร์ติดต่อ:</span> {deliveryDetails.vehicleInfo.contactPhone}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog >
    </>
  );
}
