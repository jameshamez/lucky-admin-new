import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  AlertTriangle,
  Clock,
  Package,
  Truck,
  CheckCircle,
  Share2,
  FileSpreadsheet,
  X,
  Palette,
  ShoppingBag,
  Factory,
  Plus,
  Edit,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Copy, Check } from "lucide-react";

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

const salesActionStatuses = new Set([
  "รอเซลล์ตรวจแบบป้าย",
]);

const priceApprovalStatuses = new Set([
  "สร้างคำสั่งซื้อใหม่",
  "ยืนยันคำสั่งซื้อ",
  "รอจัดซื้อส่งประเมิน",
  "อยู่ระหว่างการประเมินราคา",
  "ได้รับราคา",
  "เสนอราคาให้ลูกค้า",
  "ลูกค้าอนุมัติราคา",
]);

const graphicStatuses = new Set([
  "สร้างงานแล้ว",
  "รอกราฟิกปรับไฟล์เพื่อผลิต",
  "กำลังปรับไฟล์ผลิต",
  "รอเซลล์ตรวจแบบป้าย",
  "รอกราฟิกแก้ไขแบบป้าย",
  "ไฟล์ผลิตพร้อมสั่งผลิต",
]);

const procurementStatuses = new Set([
  "รอจัดซื้อออก PO / สั่งผลิต",
  "สั่งผลิตแล้ว",
]);

const productionStatuses = new Set([
  "รอประกอบ",
  "รอผูกโบว์",
  "รอติดป้ายจารึก",
  "กำลังผลิต",
  "ตรวจสอบ Artwork จากโรงงาน",
  "ตรวจสอบ CNC",
  "อัปเดทปั้มชิ้นงาน",
  "อัปเดตสาย",
]);

const qcStatuses = new Set([
  "รอตรวจ QC",
  "อัปเดตชิ้นงานก่อนจัดส่ง",
  "งานเสร็จสมบูรณ์",
  "ผ่าน QC - รอแพ็ก",
]);

const readyToShipStatuses = new Set([
  "แพ็กเสร็จ - รอพิมพ์ใบส่งของ",
  "พิมพ์เอกสารแล้ว - รอจัดส่ง",
]);

const shippingStatuses = new Set([
  "อยู่ระหว่างขนส่ง",
]);

const deliveredStatuses = new Set([
  "สินค้ามาส่งที่ร้าน",
  "จัดส่งเรียบร้อย",
  "จัดส่งสำเร็จ",
  "จัดส่งแล้ว",
]);

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
}

interface Order {
  id: string; // Display ID (JOB-...)
  numericId: number; // Database ID
  customer: string;
  items: string;
  orderDate: string;
  dueDate: string;
  status: string;
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
  sentDepartments?: string[];
}

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

const cleanDisplayValue = (value?: string | number | null) => {
  const text = String(value ?? "").trim();
  const key = text.toLowerCase();
  return ["", "0", "-", "null", "undefined", "n/a", "internal"].includes(key) ? "" : text;
};

const getProductCategoryDisplay = (order: any) => {
  const category = cleanDisplayValue(order.product_category);
  const categoryKey = category.toLowerCase();
  if (PRODUCT_CATEGORY_LABELS[categoryKey]) return PRODUCT_CATEGORY_LABELS[categoryKey];
  if (category) return category;

  const productType = cleanDisplayValue(order.product_type);
  if (productType) return productType;

  return "ไม่ระบุประเภทสินค้า";
};

const statusConfig = {
  pending_approval: { label: "รออนุมัติ", color: "bg-yellow-500", textColor: "text-yellow-900", icon: Clock },
  in_production: { label: "กำลังผลิต", color: "bg-orange-500", textColor: "text-orange-900", icon: Package },
  ready_to_ship: { label: "พร้อมส่ง", color: "bg-blue-500", textColor: "text-blue-900", icon: Truck },
  shipped: { label: "เสร็จสิ้น", color: "bg-green-500", textColor: "text-green-900", icon: CheckCircle },
  urgent: { label: "เร่งด่วน", color: "bg-red-500", textColor: "text-red-900", icon: AlertTriangle }
};

const getStatusIndex = (status: string) => productStatusList.findIndex(s => s.status === status);

// Map item-level status to a broad progress category for bubble filters
const getProgressCategory = (status: string): string => {
  if (priceApprovalStatuses.has(status)) return "ประเมินราคา/อนุมัติ";
  if (graphicStatuses.has(status)) return "ออกแบบกราฟิก";
  if (procurementStatuses.has(status)) return "จัดซื้อ/สั่งผลิต";
  if (productionStatuses.has(status)) return "กำลังผลิต";
  if (qcStatuses.has(status)) return "QC/ตรวจสอบ";
  if (readyToShipStatuses.has(status)) return "พร้อมจัดส่ง";
  if (shippingStatuses.has(status)) return "ขนส่ง";
  if (deliveredStatuses.has(status)) return "ส่งถึงแล้ว";
  return "อื่นๆ";
};

export default function OrderTracking() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Department Assignment states
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [isUpdatingDepts, setIsUpdatingDepts] = useState(false);

  const availableDepartments = ["ฝ่ายกราฟฟิก", "ฝ่ายจัดซื้อ", "ฝ่ายผลิตและจัดส่ง"];

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("https://nacres.co.th/api-lucky/admin/orders.php");
      const json = await res.json();
      if (json.status === "success" && json.data) {
        const mappedOrders = json.data.map((o: any) => {
          const departments = (() => {
            if (!o.departments) return [];
            if (Array.isArray(o.departments)) return o.departments;
            if (typeof o.departments === 'string') {
              try { return JSON.parse(o.departments); } catch (e) { return []; }
            }
            return [];
          })();

          const currentOrderStatus = o.order_status || "สร้างคำสั่งซื้อใหม่";

          // Map standard order status for KPI
          let broadStatus = "pending_approval";
          if (
            graphicStatuses.has(currentOrderStatus) ||
            procurementStatuses.has(currentOrderStatus) ||
            productionStatuses.has(currentOrderStatus) ||
            qcStatuses.has(currentOrderStatus)
          ) {
            broadStatus = "in_production";
          } else if (readyToShipStatuses.has(currentOrderStatus)) {
            broadStatus = "ready_to_ship";
          } else if (shippingStatuses.has(currentOrderStatus) || deliveredStatuses.has(currentOrderStatus)) {
            broadStatus = "shipped";
          }

          const productCategoryDisplay = getProductCategoryDisplay(o);
          const jobName = cleanDisplayValue(o.job_name);

          return {
            id: o.job_id || String(o.order_id),
            numericId: o.order_id,
            customer: o.customer_name || "ไม่ระบุชื่อ",
            items: productCategoryDisplay,
            orderDate: (o.order_date || "").split(" ")[0],
            dueDate: o.delivery_date || "-",
            status: broadStatus,
            value: parseFloat(o.total_price ?? o.total_amount) || 0,
            progress: 0,
            type: productCategoryDisplay,
            location: o.event_location || "domestic",
            department: o.responsible_person || "-",
            lineId: o.customer_line || "-",
            phone: o.customer_phone || "-",
            email: o.customer_email || "-",
            address: o.customer_address || o.delivery_address || "-",
            taxId: o.tax_id || "-",
            sentDepartments: departments,
            orderItems: [
              {
                id: o.order_id || Math.random(),
                name: productCategoryDisplay,
                description: jobName || o.notes || "สร้างจาก Order",
                quantity: 1,
                currentStatus: currentOrderStatus,
                statusHistory: []
              }
            ]
          } as Order;
        });
        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "ข้อผิดพลาด",
        description: "ดึงข้อมูลออเดอร์ล้มเหลว",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // KPI card filter
  const [progressBubble, setProgressBubble] = useState("all"); // bubble filter

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Column header filters
  const [colFilterId, setColFilterId] = useState("");
  const [colFilterCustomer, setColFilterCustomer] = useState("");
  const [colFilterOrderDate, setColFilterOrderDate] = useState("");
  const [colFilterDueDate, setColFilterDueDate] = useState("");
  const [colFilterItem, setColFilterItem] = useState("");
  const [colFilterStatus, setColFilterStatus] = useState("all");

  // Deep search utility
  const deepSearch = useCallback((order: Order, term: string): boolean => {
    const s = term.toLowerCase();
    const searchVal = (val: any): boolean => {
      if (val == null) return false;
      if (typeof val === "string") return val.toLowerCase().includes(s);
      if (typeof val === "number") return String(val).includes(s);
      if (Array.isArray(val)) return val.some(v => searchVal(v));
      if (typeof val === "object") return Object.values(val).some(v => searchVal(v));
      return false;
    };
    return searchVal(order);
  }, []);

  // Stats
  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === "pending_approval").length,
    inProduction: orders.filter(o => o.status === "in_production").length,
    readyToShip: orders.filter(o => o.status === "ready_to_ship").length,
    urgent: orders.filter(o => o.status === "urgent").length,
  }), [orders]);

  // Progress bubble counts (item-level)
  const progressCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => o.orderItems.forEach(item => {
      const cat = getProgressCategory(item.currentStatus);
      counts[cat] = (counts[cat] || 0) + 1;
    }));
    return counts;
  }, [orders]);

  const progressCategories = ["ประเมินราคา/อนุมัติ", "ออกแบบกราฟิก", "จัดซื้อ/สั่งผลิต", "กำลังผลิต", "QC/ตรวจสอบ", "พร้อมจัดส่ง", "ขนส่ง", "ส่งถึงแล้ว"];
  const progressColors: Record<string, string> = {
    "ประเมินราคา/อนุมัติ": "bg-gray-100 text-gray-700 border-gray-300",
    "ออกแบบกราฟิก": "bg-purple-100 text-purple-700 border-purple-300",
    "จัดซื้อ/สั่งผลิต": "bg-amber-100 text-amber-700 border-amber-300",
    "กำลังผลิต": "bg-orange-100 text-orange-700 border-orange-300",
    "QC/ตรวจสอบ": "bg-blue-100 text-blue-700 border-blue-300",
    "พร้อมจัดส่ง": "bg-sky-100 text-sky-700 border-sky-300",
    "ขนส่ง": "bg-cyan-100 text-cyan-700 border-cyan-300",
    "ส่งถึงแล้ว": "bg-green-100 text-green-700 border-green-300",
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Deep search
      if (searchTerm.trim() && !deepSearch(order, searchTerm)) return false;
      // KPI card filter
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      // Column filters
      if (colFilterId && !order.id.toLowerCase().includes(colFilterId.toLowerCase())) return false;
      if (colFilterCustomer && !order.customer.toLowerCase().includes(colFilterCustomer.toLowerCase())) return false;
      if (colFilterOrderDate && !order.orderDate.includes(colFilterOrderDate)) return false;
      if (colFilterDueDate && !order.dueDate.includes(colFilterDueDate)) return false;
      if (colFilterItem) {
        const t = colFilterItem.toLowerCase();
        const itemMatch = order.orderItems.some(i => i.name.toLowerCase().includes(t) || i.description.toLowerCase().includes(t));
        if (!itemMatch) return false;
      }
      if (colFilterStatus !== "all") {
        const itemMatch = order.orderItems.some(i => i.currentStatus === colFilterStatus);
        if (!itemMatch) return false;
      }
      // Progress bubble filter
      if (progressBubble !== "all") {
        const itemMatch = order.orderItems.some(i => getProgressCategory(i.currentStatus) === progressBubble);
        if (!itemMatch) return false;
      }
      return true;
    });
  }, [orders, searchTerm, statusFilter, colFilterId, colFilterCustomer, colFilterOrderDate, colFilterDueDate, colFilterItem, colFilterStatus, progressBubble, deepSearch]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, colFilterId, colFilterCustomer, colFilterOrderDate, colFilterDueDate, colFilterItem, colFilterStatus, progressBubble]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const hasAnyFilter = searchTerm || statusFilter !== "all" || progressBubble !== "all" || colFilterId || colFilterCustomer || colFilterOrderDate || colFilterDueDate || colFilterItem || colFilterStatus !== "all";

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setProgressBubble("all");
    setColFilterId("");
    setColFilterCustomer("");
    setColFilterOrderDate("");
    setColFilterDueDate("");
    setColFilterItem("");
    setColFilterStatus("all");
  };

  // Export CSV
  const handleExport = () => {
    const headers = ["รหัสออเดอร์", "ลูกค้า", "วันที่สั่ง", "วันจัดส่ง", "สินค้า", "จำนวน", "สถานะ", "เบอร์โทร", "อีเมล", "มูลค่า"];
    const rows: string[][] = [];
    filteredOrders.forEach(o => {
      o.orderItems.forEach(item => {
        rows.push([o.id, o.customer, o.orderDate, o.dueDate, item.name, String(item.quantity), item.currentStatus, o.phone, o.email, String(o.value)]);
      });
    });
    const bom = "\uFEFF";
    const csv = bom + [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order_tracking_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "ส่งออกสำเร็จ",
      description: `ส่งออก ${rows.length} รายการเป็นไฟล์ CSV แล้ว`,
    });
  };

  // Highlight helper
  const highlightText = (text: string, term: string) => {
    if (!term || !text) return text;
    try {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      return text.split(regex).map((part, i) =>
        regex.test(part) ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark> : part
      );
    } catch { return text; }
  };

  const deptConfig: Record<string, { bg: string; text: string; icon: any }> = {
    "ฝ่ายกราฟฟิก": { bg: "bg-purple-100", text: "text-purple-700", icon: Palette },
    "ฝ่ายจัดซื้อ": { bg: "bg-orange-100", text: "text-orange-700", icon: ShoppingBag },
    "ฝ่ายผลิตและจัดส่ง": { bg: "bg-emerald-100", text: "text-emerald-700", icon: Factory },
    "เซลล์": { bg: "bg-blue-100", text: "text-blue-700", icon: Package },
    "QC": { bg: "bg-teal-100", text: "text-teal-700", icon: CheckCircle },
    "ขนส่ง": { bg: "bg-cyan-100", text: "text-cyan-700", icon: Truck },
    "คลัง": { bg: "bg-slate-100", text: "text-slate-700", icon: Package },
  };

  const getItemStatusBadge = (status: string) => {
    const index = getStatusIndex(status);
    const total = productStatusList.length;
    const progress = total > 0 ? ((index + 1) / total) * 100 : 0;
    let bgColor = "bg-gray-100 text-gray-800";
    if (progress >= 90) bgColor = "bg-green-100 text-green-800";
    else if (progress >= 60) bgColor = "bg-blue-100 text-blue-800";
    else if (progress >= 30) bgColor = "bg-amber-100 text-amber-800";
    return <Badge className={`${bgColor} font-medium`}>{status}</Badge>;
  };

  const getCurrentDept = (status: string) => {
    const item = productStatusList.find(s => s.status === status);
    return item ? item.department : null;
  };

  const handleUpdateDepts = (order: Order) => {
    setPendingOrder(order);
    setSelectedDepts(order.sentDepartments || []);
    setShowDeptModal(true);
  };

  const confirmUpdateDepts = async () => {
    if (!pendingOrder) return;
    setIsUpdatingDepts(true);
    try {
      const res = await fetch(`https://nacres.co.th/api-lucky/admin/orders.php?id=${pendingOrder.numericId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departments: selectedDepts,
          // หากยังไม่ได้เป็น "สร้างงานแล้ว" และมีการส่งฝ่าย ให้เปลี่ยนสถานะด้วย
          ...(pendingOrder.orderItems[0].currentStatus === "สร้างคำสั่งซื้อใหม่" || pendingOrder.orderItems[0].currentStatus === "ยืนยันคำสั่งซื้อ"
            ? { order_status: "สร้างงานแล้ว" } : {})
        }),
      });
      const json = await res.json();
      if (json.status === "success") {
        toast({
          title: "อัปเดตแผนที่ส่งงานสำเร็จ",
          description: `ส่งงานออเดอร์ ${pendingOrder.id} เรียบร้อยแล้ว`,
        });
        fetchOrders();
        setShowDeptModal(false);
      } else {
        throw new Error(json.message);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอัปเดตแผนกได้",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingDepts(false);
    }
  };

  const getDeptBadges = (order: Order) => {
    const departments = order.sentDepartments || [];
    const currentHandlingDept = getCurrentDept(order.orderItems[0]?.currentStatus);

    return (
      <div className="flex flex-col gap-2 items-center">
        {departments.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1 max-w-[150px]">
            {departments.map(dept => {
              const config = deptConfig[dept] || { bg: "bg-gray-100", text: "text-gray-600", icon: Package };
              const Icon = config.icon;
              return (
                <Badge key={dept} className={`${config.bg} ${config.text} gap-1 text-[10px] px-1.5 py-0.5 border`}>
                  <Icon className="w-3 h-3" />
                  {dept.replace("ฝ่าย", "")}
                </Badge>
              );
            })}
            <Button
              variant="ghost"
              size="icon"
              className="w-5 h-5 rounded-full hover:bg-slate-200"
              onClick={() => handleUpdateDepts(order)}
            >
              <Edit className="w-3 h-3 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1 px-2 border-dashed"
            onClick={() => handleUpdateDepts(order)}
          >
            <Plus className="w-3 h-3" /> ส่งแผนก
          </Button>
        )}

        {currentHandlingDept && (
          <div className="flex items-center gap-1.5 mt-1 border-t pt-1 w-full justify-center">
            <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">อยู่ระหว่าง:</span>
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-bold bg-slate-100">
              {currentHandlingDept}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  // Unique statuses for column filter
  const allItemStatuses = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => o.orderItems.forEach(i => set.add(i.currentStatus)));
    return Array.from(set);
  }, [orders]);

  return (
    <div className="min-h-screen bg-[#F7F7F7] p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">ติดตามคำสั่งซื้อ</h1>
            <p className="text-muted-foreground">ดูสถานะและความคืบหน้าของคำสั่งซื้อทั้งหมด</p>
          </div>
        </div>

        {/* ===== KPI Cards (clickable as filters) ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { key: "all", label: "ออเดอร์ทั้งหมด", count: stats.total, icon: Package, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
            { key: "pending_approval", label: "รออนุมัติ", count: stats.pending, icon: Clock, iconBg: "bg-yellow-50", iconColor: "text-yellow-600" },
            { key: "in_production", label: "กำลังผลิต", count: stats.inProduction, icon: Package, iconBg: "bg-orange-50", iconColor: "text-orange-600" },
            { key: "ready_to_ship", label: "พร้อมส่ง", count: stats.readyToShip, icon: Truck, iconBg: "bg-green-50", iconColor: "text-green-600" },
            { key: "urgent", label: "เร่งด่วน", count: stats.urgent, icon: AlertTriangle, iconBg: "bg-red-50", iconColor: "text-red-600" },
          ].map(card => {
            const Icon = card.icon;
            const isActive = statusFilter === card.key;
            return (
              <div
                key={card.key}
                onClick={() => setStatusFilter(isActive ? "all" : card.key)}
                className={`bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-all cursor-pointer border-2 ${isActive ? "border-primary ring-2 ring-primary/20" : "border-transparent"}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${card.iconBg}`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                    <p className="text-3xl font-bold text-foreground">{card.count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== Progress Bubble Filters ===== */}
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
          <p className="text-sm font-medium text-muted-foreground">สถานะความคืบหน้า</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setProgressBubble("all")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${progressBubble === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"}`}
            >
              ทั้งหมด
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${progressBubble === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                {orders.reduce((s, o) => s + o.orderItems.length, 0)}
              </span>
            </button>
            {progressCategories.map(cat => {
              const count = progressCounts[cat] || 0;
              if (count === 0) return null;
              const isActive = progressBubble === cat;
              const colors = progressColors[cat] || "bg-gray-100 text-gray-700 border-gray-300";
              return (
                <button
                  key={cat}
                  onClick={() => setProgressBubble(isActive ? "all" : cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isActive ? "ring-2 ring-primary/30 border-primary" : ""} ${colors}`}
                >
                  {cat}
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-black/10">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== Search & Export ===== */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Deep Search - ค้นหาทุกข้อมูล (รหัส, ลูกค้า, สินค้า, เบอร์โทร, อีเมล, ที่อยู่, วัสดุ...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border"
            />
          </div>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Export
          </Button>
          {hasAnyFilter && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-destructive">
              <X className="w-4 h-4" /> ล้างตัวกรอง
            </Button>
          )}
        </div>

        {/* ===== Orders Table with Column Filters ===== */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
              <p className="text-muted-foreground">กำลังโหลดข้อมูลออเดอร์...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">ไม่พบออเดอร์ที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground">รหัสออเดอร์</TableHead>
                    <TableHead className="font-semibold text-foreground">ลูกค้า</TableHead>
                    <TableHead className="font-semibold text-foreground">วันที่สั่ง</TableHead>
                    <TableHead className="font-semibold text-foreground">วันที่จัดส่ง</TableHead>
                    <TableHead className="font-semibold text-foreground">สินค้า</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">จำนวน</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">แผนกที่ส่งงาน</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">สถานะความคืบหน้า</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">จัดการ</TableHead>
                  </TableRow>
                  {/* Column filter row */}
                  <TableRow className="bg-muted/30">
                    <TableHead className="py-1">
                      <Input placeholder="กรอง..." value={colFilterId} onChange={e => setColFilterId(e.target.value)} className="h-7 text-xs" />
                    </TableHead>
                    <TableHead className="py-1">
                      <Input placeholder="กรอง..." value={colFilterCustomer} onChange={e => setColFilterCustomer(e.target.value)} className="h-7 text-xs" />
                    </TableHead>
                    <TableHead className="py-1">
                      <Input placeholder="วันที่..." value={colFilterOrderDate} onChange={e => setColFilterOrderDate(e.target.value)} className="h-7 text-xs" />
                    </TableHead>
                    <TableHead className="py-1">
                      <Input placeholder="วันที่..." value={colFilterDueDate} onChange={e => setColFilterDueDate(e.target.value)} className="h-7 text-xs" />
                    </TableHead>
                    <TableHead className="py-1">
                      <Input placeholder="กรอง..." value={colFilterItem} onChange={e => setColFilterItem(e.target.value)} className="h-7 text-xs" />
                    </TableHead>
                    <TableHead className="py-1"></TableHead>
                    <TableHead className="py-1"></TableHead>
                    <TableHead className="py-1">
                      <Select value={colFilterStatus} onValueChange={setColFilterStatus}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">ทั้งหมด</SelectItem>
                          {allItemStatuses.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead className="py-1"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order, orderIndex) => {
                    const itemCount = order.orderItems.length;
                    const isEvenOrder = orderIndex % 2 === 0;
                    const orderBgColor = isEvenOrder ? "bg-white" : "bg-slate-50/70";

                    return (
                      <React.Fragment key={order.id}>
                        {orderIndex > 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="p-0 h-1 bg-slate-200" />
                          </TableRow>
                        )}
                        {order.orderItems.map((item, itemIndex) => (
                          <TableRow
                            key={`${order.id}-${item.id}`}
                            className={`${orderBgColor} hover:bg-slate-100/50 transition-colors ${itemIndex < itemCount - 1 ? 'border-b border-dashed border-slate-200' : ''}`}
                          >
                            {itemIndex === 0 ? (
                              <>
                                <TableCell className="font-semibold align-middle py-4 border-l-4 border-l-primary" rowSpan={itemCount}>
                                  <a
                                    href={`/sales/track-orders/${order.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline hover:text-blue-800 cursor-pointer"
                                  >
                                    {highlightText(order.id, searchTerm)}
                                  </a>
                                </TableCell>
                                <TableCell className="font-medium align-middle py-4" rowSpan={itemCount}>
                                  {highlightText(order.customer, searchTerm)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground align-middle py-4" rowSpan={itemCount}>
                                  {highlightText(order.orderDate, searchTerm)}
                                </TableCell>
                                <TableCell className={`text-sm align-middle py-4 ${order.status === "urgent" ? "text-red-600 font-semibold" : "text-muted-foreground"}`} rowSpan={itemCount}>
                                  {highlightText(order.dueDate, searchTerm)}
                                </TableCell>
                              </>
                            ) : null}
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                  {itemIndex + 1}
                                </span>
                                <span className="font-medium">{highlightText(item.name, searchTerm)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-3">
                              <span className="text-sm font-medium">{item.quantity} ชิ้น</span>
                            </TableCell>
                            {itemIndex === 0 ? (
                              <TableCell className="align-middle py-3" rowSpan={itemCount}>
                                {getDeptBadges(order)}
                              </TableCell>
                            ) : null}
                            <TableCell className="text-center py-3">
                              {getItemStatusBadge(item.currentStatus)}
                            </TableCell>
                            <TableCell className="text-center py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                {salesActionStatuses.has(item.currentStatus) && (
                                  <Button
                                    size="sm"
                                    onClick={() => navigate(`/sales/track-orders/${order.id}?item=${item.id}`)}
                                    className="bg-blue-600 text-white hover:bg-blue-700 transition-colors text-xs"
                                  >
                                    ตรวจ/ตอบกลับ
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/sales/track-orders/${order.id}?item=${item.id}`)}
                                  className="hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                                >
                                  ดูรายละเอียด
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = `${window.location.origin}/sales/track-orders/${order.id}?item=${item.id}`;
                                    setShareUrl(url);
                                    setShareDialogOpen(true);
                                    setIsCopied(false);

                                    navigator.clipboard.writeText(url).then(() => {
                                      setIsCopied(true);
                                      toast({
                                        title: "คัดลอกลิงก์เรียบร้อยแล้ว",
                                        description: "คุณสามารถส่งลิงก์นี้ให้ลูกค้าได้ทันที",
                                      });
                                      setTimeout(() => setIsCopied(false), 2000);
                                    }).catch(() => {
                                      toast({
                                        title: "ข้อผิดพลาด",
                                        description: "ไม่สามารถคัดลอกลิงก์ได้",
                                        variant: "destructive",
                                      });
                                    });
                                  }}
                                  className="hover:bg-green-600 hover:text-white transition-colors text-xs gap-1"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  แชร์สถานะ
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>แสดง</span>
                <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>จาก {filteredOrders.length} รายการ</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="h-8 px-2 text-xs">«</Button>
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-8 px-3 text-xs">ก่อนหน้า</Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) { page = i + 1; }
                  else if (currentPage <= 3) { page = i + 1; }
                  else if (currentPage >= totalPages - 2) { page = totalPages - 4 + i; }
                  else { page = currentPage - 2 + i; }
                  return (
                    <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 p-0 text-xs">
                      {page}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-8 px-3 text-xs">ถัดไป</Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="h-8 px-2 text-xs">»</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Dialog */}
      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แชร์สถานะคำสั่งซื้อ</DialogTitle>
            <DialogDescription>
              คัดลอกลิงก์ด้านล่างเพื่อส่งผลการติดตามสถานะให้ลูกค้า
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 pt-4">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="share-link" className="sr-only">
                Link
              </Label>
              <Input
                id="share-link"
                value={shareUrl}
                readOnly
                className="h-9 font-mono text-[10px]"
              />
            </div>
            <Button
              type="button"
              size="sm"
              className="px-3"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                setIsCopied(true);
                toast({
                  title: "คัดลอกลิงก์แล้ว",
                  description: "ลิงก์ถูกเก็บไว้ใน Clipboard ของคุณเรียบร้อย",
                });
                setTimeout(() => setIsCopied(false), 2000);
              }}
            >
              <span className="sr-only">Copy</span>
              {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <p className="text-xs text-muted-foreground italic">
              * ลูกค้าสามารถดูสถานะการผลิตล่าสุดได้ตลอดเวลาผ่านลิงก์นี้
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Department Assignment Modal */}
      <Dialog open={showDeptModal} onOpenChange={setShowDeptModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แผนกที่ต้องการส่งงาน</DialogTitle>
            <DialogDescription>
              ออเดอร์: <span className="font-bold text-primary">{pendingOrder?.id}</span> ({pendingOrder?.customer})
              <br />เลือกแผนกที่ต้องการให้ดำเนินงานต่อ
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-3">
              {availableDepartments.map(dept => (
                <div
                  key={dept}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedDepts.includes(dept) ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"}`}
                  onClick={() => {
                    setSelectedDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${selectedDepts.includes(dept) ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>
                      {dept === "ฝ่ายกราฟฟิก" && <Palette className="w-4 h-4" />}
                      {dept === "ฝ่ายจัดซื้อ" && <ShoppingBag className="w-4 h-4" />}
                      {dept === "ฝ่ายผลิตและจัดส่ง" && <Factory className="w-4 h-4" />}
                    </div>
                    <span className={`font-medium ${selectedDepts.includes(dept) ? "text-primary" : "text-foreground"}`}>{dept}</span>
                  </div>
                  {selectedDepts.includes(dept) && <CheckCircle className="w-5 h-5 text-primary" />}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeptModal(false)}>ยกเลิก</Button>
            <Button
              onClick={confirmUpdateDepts}
              disabled={isUpdatingDepts || selectedDepts.length === 0}
              className="gap-2"
            >
              {isUpdatingDepts && <Loader2 className="w-4 h-4 animate-spin" />}
              ยืนยันการส่งงาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

