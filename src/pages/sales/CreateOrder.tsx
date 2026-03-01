import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Edit, Eye, Plus, Rocket, Search, SlidersHorizontal, ChevronDown, X, CheckCircle, FileSpreadsheet, Palette, ShoppingBag, Factory, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import CreateOrderForm from "@/components/sales/CreateOrderForm";

const API_BASE = "https://finfinphone.com/api-lucky/admin";

export default function CreateOrder() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [estimationData, setEstimationData] = useState<any>(null);

  // --- API state ---
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState({
    statusCounts: { request: 0, draft: 0, confirmed: 0, jobCreated: 0 },
    paymentCounts: { partial: 0, pending: 0, credit: 0 },
    totalRevenue: 0,
    totalPaid: 0,
  });

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterOrderStatus, setFilterOrderStatus] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [filterDeliveryMethod, setFilterDeliveryMethod] = useState("all");
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("all");
  const [filterProductCategory, setFilterProductCategory] = useState("all");
  const [advancedSearchTerm, setAdvancedSearchTerm] = useState("");
  const [createdJobs, setCreatedJobs] = useState<Set<number>>(new Set());
  const [jobDepartments, setJobDepartments] = useState<Record<number, string[]>>({});
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  // Summary period filter
  const [summaryPeriod, setSummaryPeriod] = useState("all");

  // Card filter (clickable summary cards)
  const [cardFilter, setCardFilter] = useState<string | null>(null);

  // Column header filters
  const [colFilterJobId, setColFilterJobId] = useState("");
  const [colFilterDate, setColFilterDate] = useState("");
  const [colFilterChannel, setColFilterChannel] = useState("all");
  const [colFilterCustomer, setColFilterCustomer] = useState("");
  const [colFilterCategory, setColFilterCategory] = useState("all");
  const [colFilterOrderStatus, setColFilterOrderStatus] = useState("all");
  const [colFilterPaymentStatus, setColFilterPaymentStatus] = useState("all");
  const [colFilterDelivery, setColFilterDelivery] = useState("all");
  const [colFilterDeliveryDate, setColFilterDeliveryDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Check if navigated from price estimation page
  useEffect(() => {
    if (location.state?.fromEstimation && location.state?.estimationData) {
      setEstimationData(location.state.estimationData);
      setShowCreateForm(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // --- Fetch orders from API ---
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders.php?limit=200`);
      const json = await res.json();
      if (json.status === "success") {
        // Map snake_case DB fields → camelCase used in the UI
        const mapped = json.data.map((o: any) => ({
          id: o.id,
          jobId: o.job_id,
          orderDate: o.order_date,
          customerName: o.customer_name,
          lineName: o.customer_line,
          customerPhone: o.customer_phone,
          customerEmail: o.customer_email,
          customerAddress: o.customer_address,
          product: o.job_name,
          productCategory: o.product_category,
          productType: o.product_type,
          salesChannel: o.sales_channel,
          deliveryDate: o.delivery_date,
          deliveryMethod: o.delivery_method,
          deliveryCost: parseFloat(o.delivery_cost ?? 0),
          paymentMethod: o.payment_method,
          paymentStatus: o.payment_status,
          orderStatus: o.order_status,
          jobCreated: Boolean(o.job_created),
          departments: o.departments ?? [],
          totalAmount: parseFloat(o.total_amount ?? 0),
          subtotal: parseFloat(o.subtotal ?? 0),
          vatAmount: parseFloat(o.vat_amount ?? 0),
          totalWithVat: parseFloat(o.total_amount ?? 0),
          paidAmount: parseFloat(o.paid_amount ?? 0),
          taxInvoice: Boolean(o.require_tax_invoice),
          taxCompanyName: o.tax_payer_name,
          taxId: o.tax_id,
          responsiblePerson: o.responsible_person,
          savedProducts: [],
        }));
        setOrders(mapped);
        if (json.summary) {
          setSummary(json.summary);
        }
      }
    } catch (e) {
      console.error("Failed to fetch orders:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Mock data for existing orders (fallback while loading / if API is empty)
  const mockOrders = [
    {
      id: 1, jobId: "JOB-2024-001", orderDate: "2024-01-15", lineName: "customer_line1",
      customerName: "สมชาย ใจดี", product: "ถ้วยรางวัล", productCategory: "สินค้าสำเร็จรูป",
      salesChannel: "ลูกค้าสั่งเอง", deliveryDate: "2024-01-25", responsiblePerson: "นายสมศักดิ์ รักงาน",
      customerPhone: "081-234-5678", customerEmail: "somchai@email.com",
      customerAddress: "123/45 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
      productType: "Trophy", material: "Crystal", size: "10 นิ้ว", quantity: 50, unitPrice: 200,
      additionalDetails: "สลักชื่อรางวัล 'ยอดเยี่ยม'",
      savedProducts: [
        { productType: "ถ้วยรางวัล", material: "คริสตัล", size: "10 นิ้ว", quantity: 30, unitPrice: 200 },
        { productType: "ถ้วยรางวัล", material: "คริสตัล", size: "8 นิ้ว", quantity: 20, unitPrice: 150 }
      ],
      taxCompanyName: "บริษัท สมชาย จำกัด", taxId: "0123456789012",
      deliveryMethod: "ส่งพัสดุ", deliveryCost: 150, paymentMethod: "โอนเงิน",
      paymentStatus: "ชำระเงินแล้ว", orderStatus: "ยืนยันคำสั่งซื้อ", jobCreated: false,
      totalAmount: 10700, subtotal: 10000, vatAmount: 700, totalWithVat: 10700, taxInvoice: true,
      paidAmount: 10700
    },
    {
      id: 2, jobId: "JOB-2024-002", orderDate: "2024-01-16", lineName: "shop_manager",
      customerName: "สุดา เก่งมาก", product: "เหรียญรางวัล", productCategory: "สินค้าสั่งผลิต",
      salesChannel: "ฟรีแลนซ์", deliveryDate: "2024-01-30", responsiblePerson: "นางสาวพิมพ์ใจ ดีเยี่ยม",
      customerPhone: "089-876-5432", customerEmail: "suda@company.co.th",
      customerAddress: "789 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
      productType: "Medal", material: "Zinc", size: "5 ซม.", quantity: 100, unitPrice: 150,
      additionalDetails: "เหรียญสีทอง พิมพ์โลโก้บริษัท",
      savedProducts: [
        { productType: "เหรียญรางวัล", material: "สังกะสี", size: "5 ซม.", quantity: 100, unitPrice: 150 }
      ],
      taxCompanyName: "สุดา เก่งมาก", taxId: null,
      deliveryMethod: "รับเอง", deliveryCost: 0, paymentMethod: "เงินสด",
      paymentStatus: "รอชำระเงิน", orderStatus: "สร้างคำสั่งซื้อใหม่", jobCreated: false,
      totalAmount: 16050, subtotal: 15000, vatAmount: 1050, totalWithVat: 16050, taxInvoice: false,
      paidAmount: 0
    },
    {
      id: 3, jobId: "JOB-2024-003", orderDate: "2024-01-17", lineName: "event_planner",
      customerName: "อนันต์ ชาญฉลาด", product: "โล่รางวัล", productCategory: "สินค้าสั่งผลิต",
      salesChannel: "ร้านค้าตัวแทน", deliveryDate: "2024-02-05", responsiblePerson: "นายวิชัย มั่นคง",
      customerPhone: "062-345-6789", customerEmail: "anun@eventplanner.com",
      customerAddress: "456/78 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพฯ 10400",
      productType: "Shield", material: "Wood", size: "12 นิ้ว", quantity: 25, unitPrice: 1000,
      additionalDetails: "โล่ไม้สักทอง สลักข้อความตามแบบที่ส่ง",
      savedProducts: [
        { productType: "โล่รางวัล", material: "ไม้สัก", size: "12 นิ้ว", quantity: 15, unitPrice: 1000 },
        { productType: "โล่รางวัล", material: "ไม้สัก", size: "10 นิ้ว", quantity: 10, unitPrice: 800 }
      ],
      taxCompanyName: "ห้างหุ้นส่วนอนันต์", taxId: "9876543210987",
      deliveryMethod: "ส่งพัสดุ", deliveryCost: 300, paymentMethod: "โอนเงิน",
      paymentStatus: "เครดิต", orderStatus: "ยืนยันคำสั่งซื้อ", jobCreated: false,
      totalAmount: 26750, subtotal: 25000, vatAmount: 1750, totalWithVat: 26750, taxInvoice: true,
      paidAmount: 0
    },
    {
      id: 4, jobId: "JOB-2024-004", orderDate: "2024-01-18", lineName: "gov_dept",
      customerName: "กรมการปกครอง", product: "เหรียญที่ระลึก", productCategory: "สินค้าสั่งผลิต",
      salesChannel: "ฝ่ายขาย", deliveryDate: "2024-02-15", responsiblePerson: "นายสมศักดิ์ รักงาน",
      customerPhone: "02-123-4567", customerEmail: "procurement@dopa.go.th",
      customerAddress: "ถ.นครสวรรค์ เขตดุสิต กรุงเทพฯ",
      productType: "Medal", material: "Bronze", size: "6 ซม.", quantity: 500, unitPrice: 120,
      additionalDetails: "เหรียญที่ระลึกงานครบรอบ",
      savedProducts: [
        { productType: "เหรียญที่ระลึก", material: "ทองแดง", size: "6 ซม.", quantity: 500, unitPrice: 120 }
      ],
      taxCompanyName: "กรมการปกครอง", taxId: "0994000123456",
      deliveryMethod: "ส่งพัสดุ", deliveryCost: 500, paymentMethod: "วางบิล",
      paymentStatus: "ชำระบางส่วน", orderStatus: "ส่งคำขอสั่งซื้อ", jobCreated: false,
      totalAmount: 64200, subtotal: 60000, vatAmount: 4200, totalWithVat: 64200, taxInvoice: true,
      paidAmount: 30000
    },
    {
      id: 5, jobId: "JOB-2024-005", orderDate: "2024-01-19", lineName: "school_admin",
      customerName: "โรงเรียนสาธิต มศว", product: "ถ้วยรางวัลกีฬาสี", productCategory: "สินค้าสำเร็จรูป",
      salesChannel: "ลูกค้าสั่งเอง", deliveryDate: "2024-02-10", responsiblePerson: "นางสาวพิมพ์ใจ ดีเยี่ยม",
      customerPhone: "02-987-6543", customerEmail: "sport@satit.swu.ac.th",
      customerAddress: "114 สุขุมวิท 23 แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110",
      productType: "Trophy", material: "Plastic Gold", size: "8 นิ้ว", quantity: 40, unitPrice: 180,
      additionalDetails: "ถ้วยรางวัลกีฬาสี 4 สี พร้อมสลักชื่อกีฬา",
      savedProducts: [
        { productType: "ถ้วยรางวัล", material: "พลาสติกสีทอง", size: "8 นิ้ว", quantity: 40, unitPrice: 180 }
      ],
      taxCompanyName: "โรงเรียนสาธิต มศว", taxId: "0994000654321",
      deliveryMethod: "ส่งพัสดุ", deliveryCost: 200, paymentMethod: "โอนเงิน",
      paymentStatus: "ชำระเงินแล้ว", orderStatus: "สร้างงานแล้ว", jobCreated: true,
      totalAmount: 7904, subtotal: 7200, vatAmount: 504, totalWithVat: 7704, taxInvoice: true,
      paidAmount: 7904
    },
    {
      id: 6, jobId: "JOB-2024-006", orderDate: "2024-01-20", lineName: "corp_hr",
      customerName: "บริษัท ปูนซิเมนต์ไทย จำกัด", product: "โล่เกียรติคุณ", productCategory: "สินค้าสั่งผลิต",
      salesChannel: "ฝ่ายขาย", deliveryDate: "2024-02-20", responsiblePerson: "นายวิชัย มั่นคง",
      customerPhone: "02-586-1234", customerEmail: "hr@scg.com",
      customerAddress: "1 ถ.ปูนซิเมนต์ไทย บางซื่อ กรุงเทพฯ 10800",
      productType: "Shield", material: "Crystal", size: "14 นิ้ว", quantity: 10, unitPrice: 2500,
      additionalDetails: "โล่คริสตัลพร้อมฐานไม้ สลักชื่อพนักงานดีเด่น",
      savedProducts: [
        { productType: "โล่เกียรติคุณ", material: "คริสตัล", size: "14 นิ้ว", quantity: 10, unitPrice: 2500 }
      ],
      taxCompanyName: "บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน)", taxId: "0107536000781",
      deliveryMethod: "จัดส่งโดยพนักงาน", deliveryCost: 0, paymentMethod: "วางบิล",
      paymentStatus: "ชำระเงินแล้ว", orderStatus: "สร้างงานแล้ว", jobCreated: true,
      totalAmount: 26750, subtotal: 25000, vatAmount: 1750, totalWithVat: 26750, taxInvoice: true,
      paidAmount: 26750
    }
  ];

  // --- Badge helpers ---
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "ส่งคำขอสั่งซื้อ":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">{status}</Badge>;
      case "สร้างคำสั่งซื้อใหม่":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">{status}</Badge>;
      case "ยืนยันคำสั่งซื้อ":
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">{status}</Badge>;
      case "สร้างงานแล้ว":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "ชำระเงินแล้ว":
        return <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">{status}</Badge>;
      case "ชำระบางส่วน":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100">{status}</Badge>;
      case "รอชำระเงิน":
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100">{status}</Badge>;
      case "เครดิต":
        return <Badge className="bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-100">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // --- Handlers ---
  const handleCreateJob = (order: any) => {
    setPendingOrder(order);
    setSelectedDepts([]);
    setShowDeptModal(true);
  };

  const handleConfirmCreateJob = async () => {
    if (!pendingOrder || selectedDepts.length === 0) {
      toast({ title: "กรุณาเลือกแผนก", description: "กรุณาเลือกอย่างน้อย 1 แผนกเพื่อส่งงาน", variant: "destructive" });
      return;
    }

    const deptLabels = selectedDepts.join(", ");

    // PATCH order in API (if it has a real DB id)
    if (pendingOrder.id && orders.some(o => o.id === pendingOrder.id)) {
      try {
        await fetch(`${API_BASE}/orders.php?id=${pendingOrder.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_status: "สร้างงานแล้ว",
            job_created: 1,
            departments: selectedDepts,
          }),
        });
        fetchOrders(); // รีเฟรชข้อมูล
      } catch (e) {
        console.error("Failed to patch order:", e);
      }
    }

    setCreatedJobs(prev => new Set(prev).add(pendingOrder.id));
    setJobDepartments(prev => ({ ...prev, [pendingOrder.id]: selectedDepts }));
    setShowDeptModal(false);

    toast({ title: "สร้างงานสำเร็จ", description: `ส่งงาน ${pendingOrder.jobId} ไปยัง ${deptLabels} เรียบร้อยแล้ว` });
    setPendingOrder(null);
    setSelectedDepts([]);
  };

  const toggleDept = (dept: string) => {
    setSelectedDepts(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]);
  };

  const getDeptBadges = (orderId: number) => {
    const depts = jobDepartments[orderId] || [];
    return depts.map(dept => {
      const config: Record<string, { bg: string; text: string; icon: any }> = {
        "ฝ่ายกราฟฟิก": { bg: "bg-purple-100 border-purple-200", text: "text-purple-800", icon: Palette },
        "ฝ่ายจัดซื้อ": { bg: "bg-orange-100 border-orange-200", text: "text-orange-800", icon: ShoppingBag },
        "ฝ่ายผลิตและจัดส่ง": { bg: "bg-teal-100 border-teal-200", text: "text-teal-800", icon: Factory },
      };
      const c = config[dept] || { bg: "bg-gray-100", text: "text-gray-800", icon: null };
      const Icon = c.icon;
      return (
        <Badge key={dept} className={`${c.bg} ${c.text} hover:${c.bg} gap-1 text-xs`}>
          {Icon && <Icon className="w-3 h-3" />} {dept}
        </Badge>
      );
    });
  };

  const handleFormSubmit = async (data: any) => {
    try {
      const method = isEditing && selectedOrder?.id ? "PUT" : "POST";
      const url = isEditing && selectedOrder?.id
        ? `${API_BASE}/orders.php?id=${selectedOrder.id}`
        : `${API_BASE}/orders.php`;

      // Map camelCase form fields → snake_case API payload
      const deliveryInfo = data.deliveryInfo ?? {};
      const payload: Record<string, any> = {
        // ข้อมูลพนักงาน
        responsible_person: data.responsiblePerson ?? "",

        // ข้อมูลลูกค้า
        customer_name: data.customerName ?? "",
        customer_phone: data.customerPhone ?? "",
        customer_line: data.customerLine ?? "",
        customer_email: data.customerEmail ?? "",
        customer_address: data.customerAddress ?? null,

        // ภาษี
        require_tax_invoice: data.requireTaxInvoice ? 1 : 0,
        tax_payer_name: data.taxPayerName ?? null,
        tax_id: data.taxId ?? null,
        tax_address: data.taxAddress ?? null,

        // ออร์เดอร์
        job_id: data.jobId ?? null,
        quotation_number: data.quotationNumber ?? null,
        urgency_level: data.urgencyLevel ?? "ปกติ",
        job_name: data.jobName ?? "",
        event_location: data.eventLocation ?? null,
        sales_channel: data.salesChannel ?? null,
        order_date: data.orderDate
          ? (data.orderDate instanceof Date
            ? data.orderDate.toISOString().split("T")[0]
            : data.orderDate)
          : new Date().toISOString().split("T")[0],
        usage_date: data.usageDate
          ? (data.usageDate instanceof Date
            ? data.usageDate.toISOString().split("T")[0]
            : data.usageDate)
          : null,
        delivery_date: data.deliveryDate
          ? (data.deliveryDate instanceof Date
            ? data.deliveryDate.toISOString().split("T")[0]
            : data.deliveryDate)
          : null,

        // สินค้า
        product_category: data.productCategory ?? "",
        product_type: data.productType ?? "",
        material: data.material ?? null,
        budget: data.budget ? parseFloat(data.budget) : null,

        // ราคา
        subtotal: parseFloat(data.subtotal ?? 0),
        delivery_cost: parseFloat(data.deliveryCost ?? 0),
        vat_amount: parseFloat(data.vatAmount ?? 0),
        total_amount: parseFloat(data.totalAmount ?? 0),

        // ชำระเงิน
        payment_method: deliveryInfo.paymentMethod ?? data.paymentMethod ?? "",
        payment_status: data.paymentStatus ?? "รอชำระเงิน",
        paid_amount: parseFloat(data.paidAmount ?? 0),

        // จัดส่ง
        delivery_type: data.deliveryType ?? "parcel",
        delivery_recipient: deliveryInfo.recipientName ?? null,
        delivery_phone: deliveryInfo.recipientPhone ?? null,
        delivery_address: [
          deliveryInfo.address,
          deliveryInfo.subdistrict,
          deliveryInfo.district,
          deliveryInfo.province,
          deliveryInfo.postalCode,
        ].filter(Boolean).join(" ") || null,
        preferred_delivery_date: deliveryInfo.preferredDeliveryDate
          ? (deliveryInfo.preferredDeliveryDate instanceof Date
            ? deliveryInfo.preferredDeliveryDate.toISOString().split("T")[0]
            : deliveryInfo.preferredDeliveryDate)
          : null,

        // สถานะ
        order_status: data.orderStatus ?? "สร้างคำสั่งซื้อใหม่",
        job_created: data.jobCreated ? 1 : 0,
        notes: data.notes ?? null,

        // รายการสินค้า (order_items)
        items: (data.savedProducts ?? data.items ?? []).map((item: any) => ({
          product_id: item.product_id ?? null,
          item_type: item.itemType ?? item.item_type ?? "custom",
          product_name: item.productType ?? item.product_name ?? item.label ?? "",
          product_code: item.product_code ?? null,
          material: item.material ?? null,
          size: item.size ?? null,
          color: item.color ?? null,
          quantity: parseInt(item.quantity ?? 1),
          unit_price: parseFloat(item.unitPrice ?? item.unit_price ?? item.price ?? 0),
          total_price: parseFloat(item.totalPrice ?? item.total_price ??
            ((item.quantity ?? 1) * (item.unitPrice ?? item.price ?? 0))),
          details: item.details ?? null,
        })),

        // ประวัติชำระเงิน (order_payments)
        payments: (data.paymentItems ?? data.payments ?? []).map((p: any) => ({
          type: p.type ?? "deposit",
          typeLabel: p.typeLabel ?? p.type ?? null,
          amount: parseFloat(p.amount ?? 0),
          transferDate: p.transferDate
            ? (p.transferDate instanceof Date
              ? p.transferDate.toISOString().split("T")[0]
              : p.transferDate)
            : null,
          slipUrl: p.slipUrl ?? null,
          additionalDetails: p.additionalDetails ?? null,
        })),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.status === "success") {
        toast({
          title: isEditing ? "อัปเดตคำสั่งซื้อสำเร็จ" : "สร้างคำสั่งซื้อสำเร็จ",
          description: json.job_id ? `JOB ID: ${json.job_id}` : undefined,
        });
        fetchOrders();
      } else {
        toast({ title: "เกิดข้อผิดพลาด", description: json.message, variant: "destructive" });
      }
    } catch (e) {
      console.error("Order submit error:", e);
      toast({ title: "ไม่สามารถเชื่อมต่อ API ได้", variant: "destructive" });
    }
    setShowCreateForm(false);
    setIsEditing(false);
    setSelectedOrder(null);
  };

  const handleFormCancel = () => {
    setShowCreateForm(false);
    setIsEditing(false);
    setSelectedOrder(null);
    setEstimationData(null);
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setIsEditing(true);
    setShowCreateForm(true);
    setShowOrderDetails(false);
  };

  const handleBackToList = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
  };

  // --- Deep search utility ---
  const deepSearch = useCallback((order: any, term: string): boolean => {
    const searchStr = term.toLowerCase();
    const searchInValue = (val: any): boolean => {
      if (val == null) return false;
      if (typeof val === "string") return val.toLowerCase().includes(searchStr);
      if (typeof val === "number") return String(val).includes(searchStr);
      if (Array.isArray(val)) return val.some(v => searchInValue(v));
      if (typeof val === "object") return Object.values(val).some(v => searchInValue(v));
      return false;
    };
    return searchInValue(order);
  }, []);

  // --- Summary stats (use API summary when available, fallback to local calc) ---
  const summaryStats = useMemo(() => {
    // If API has returned summary data, use it
    if (summary.totalRevenue > 0 || orders.length > 0) {
      // Use live data from API
      const displayOrders = orders.length > 0 ? orders : mockOrders;
      const statusCounts = {
        request: displayOrders.filter(o => o.orderStatus === "ส่งคำขอสั่งซื้อ").length,
        draft: displayOrders.filter(o => o.orderStatus === "สร้างคำสั่งซื้อใหม่").length,
        confirmed: displayOrders.filter(o => o.orderStatus === "ยืนยันคำสั่งซื้อ").length,
        jobCreated: displayOrders.filter(o => o.orderStatus === "สร้างงานแล้ว").length,
      };
      const paymentCounts = {
        partial: displayOrders.filter(o => o.paymentStatus === "ชำระบางส่วน").length,
        pending: displayOrders.filter(o => o.paymentStatus === "รอชำระเงิน").length,
        credit: displayOrders.filter(o => o.paymentStatus === "เครดิต").length,
      };
      const totalRevenue = displayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
      const totalPaid = displayOrders.reduce((s, o) => s + (o.paidAmount || 0), 0);
      return { statusCounts, paymentCounts, totalRevenue, totalPaid };
    }
    // Fallback mock
    return {
      statusCounts: summary.statusCounts,
      paymentCounts: summary.paymentCounts,
      totalRevenue: summary.totalRevenue,
      totalPaid: summary.totalPaid,
    };
  }, [orders, summary, summaryPeriod]);

  // --- Filters ---
  const hasActiveFilters = filterOrderStatus !== "all" || filterPaymentStatus !== "all" || filterDeliveryMethod !== "all" || filterPaymentMethod !== "all" || filterProductCategory !== "all" || advancedSearchTerm.trim() !== "" || cardFilter !== null;
  const hasColumnFilters = colFilterJobId || colFilterDate || colFilterChannel !== "all" || colFilterCustomer || colFilterCategory !== "all" || colFilterOrderStatus !== "all" || colFilterPaymentStatus !== "all" || colFilterDelivery !== "all" || colFilterDeliveryDate;

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterOrderStatus("all");
    setFilterPaymentStatus("all");
    setFilterDeliveryMethod("all");
    setFilterPaymentMethod("all");
    setFilterProductCategory("all");
    setAdvancedSearchTerm("");
    setColFilterJobId("");
    setColFilterDate("");
    setColFilterChannel("all");
    setColFilterCustomer("");
    setColFilterCategory("all");
    setColFilterOrderStatus("all");
    setColFilterPaymentStatus("all");
    setColFilterDelivery("all");
    setColFilterDeliveryDate("");
    setCardFilter(null);
  };

  // Use real API orders when available, fallback to mock
  const displayOrders = orders.length > 0 ? orders : mockOrders;

  const filteredOrders = useMemo(() => {
    return displayOrders.filter(order => {
      // Card filter
      if (cardFilter) {
        const cardMatch = (() => {
          switch (cardFilter) {
            case "request": return order.orderStatus === "ส่งคำขอสั่งซื้อ";
            case "draft": return order.orderStatus === "สร้างคำสั่งซื้อใหม่";
            case "confirmed": return order.orderStatus === "ยืนยันคำสั่งซื้อ";
            case "jobCreated": return order.orderStatus === "สร้างงานแล้ว";
            case "partial": return order.paymentStatus === "ชำระบางส่วน";
            case "pending": return order.paymentStatus === "รอชำระเงิน";
            case "credit": return order.paymentStatus === "เครดิต";
            default: return true;
          }
        })();
        if (!cardMatch) return false;
      }

      // Global deep search
      if (searchTerm.trim() && !deepSearch(order, searchTerm)) return false;

      // Advanced deep search
      if (advancedSearchTerm.trim() && !deepSearch(order, advancedSearchTerm)) return false;

      // Advanced dropdown filters
      if (filterOrderStatus !== "all" && order.orderStatus !== filterOrderStatus) return false;
      if (filterPaymentStatus !== "all" && order.paymentStatus !== filterPaymentStatus) return false;
      if (filterDeliveryMethod !== "all" && order.deliveryMethod !== filterDeliveryMethod) return false;
      if (filterPaymentMethod !== "all" && order.paymentMethod !== filterPaymentMethod) return false;
      if (filterProductCategory !== "all" && order.productCategory !== filterProductCategory) return false;

      // Column header filters
      if (colFilterJobId && !order.jobId.toLowerCase().includes(colFilterJobId.toLowerCase())) return false;
      if (colFilterDate && !order.orderDate.includes(colFilterDate)) return false;
      if (colFilterChannel !== "all" && order.salesChannel !== colFilterChannel) return false;
      if (colFilterCustomer && !order.customerName.toLowerCase().includes(colFilterCustomer.toLowerCase())) return false;
      if (colFilterCategory !== "all" && order.productCategory !== colFilterCategory) return false;
      if (colFilterOrderStatus !== "all" && order.orderStatus !== colFilterOrderStatus) return false;
      if (colFilterPaymentStatus !== "all" && order.paymentStatus !== colFilterPaymentStatus) return false;
      if (colFilterDelivery !== "all" && order.deliveryMethod !== colFilterDelivery) return false;
      if (colFilterDeliveryDate && !order.deliveryDate.includes(colFilterDeliveryDate)) return false;

      return true;
    });
  }, [displayOrders, searchTerm, advancedSearchTerm, filterOrderStatus, filterPaymentStatus, filterDeliveryMethod, filterPaymentMethod, filterProductCategory, colFilterJobId, colFilterDate, colFilterChannel, colFilterCustomer, colFilterCategory, colFilterOrderStatus, colFilterPaymentStatus, colFilterDelivery, colFilterDeliveryDate, deepSearch, cardFilter]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, advancedSearchTerm, filterOrderStatus, filterPaymentStatus, filterDeliveryMethod, filterPaymentMethod, filterProductCategory, colFilterJobId, colFilterDate, colFilterChannel, colFilterCustomer, colFilterCategory, colFilterOrderStatus, colFilterPaymentStatus, colFilterDelivery, colFilterDeliveryDate, cardFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  // --- Export to CSV ---
  const handleExport = () => {
    const headers = ["JOB ID", "วันที่สั่งซื้อ", "ช่องทาง", "ชื่อลูกค้า", "ประเภทสินค้า", "สถานะคำสั่งซื้อ", "สถานะชำระเงิน", "ยอดรวม", "วิธีชำระเงิน", "วิธีจัดส่ง", "วันจัดส่ง", "เบอร์โทร", "อีเมล"];
    const rows = filteredOrders.map(o => [
      o.jobId, o.orderDate, o.salesChannel, o.customerName, o.productCategory, o.orderStatus, o.paymentStatus, o.totalAmount, o.paymentMethod, o.deliveryMethod, o.deliveryDate, o.customerPhone, o.customerEmail
    ]);
    const bom = "\uFEFF";
    const csv = bom + [headers.join(","), ...rows.map(r => r.map(v => `"${v ?? ""}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders_export_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "ส่งออกข้อมูลสำเร็จ", description: `ส่งออก ${filteredOrders.length} รายการเป็นไฟล์ CSV แล้ว` });
  };

  // --- Highlight helper ---
  const highlightText = (text: string, term: string) => {
    if (!term || !text) return text;
    try {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark> : part
      );
    } catch {
      return text;
    }
  };

  const activeSearchTerm = searchTerm || advancedSearchTerm;

  // ============ ORDER DETAIL VIEW ============
  if (showOrderDetails && selectedOrder) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">รายละเอียดคำสั่งซื้อ #{selectedOrder.id}</h1>
            <p className="text-muted-foreground">ข้อมูลคำสั่งซื้อทั้งหมด</p>
          </div>
          <Button variant="outline" onClick={handleBackToList}>กลับไปรายการคำสั่งซื้อ</Button>
        </div>

        <Card>
          <CardHeader><CardTitle>ข้อมูลคำสั่งซื้อ</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">JOB ID</p><p className="font-medium text-primary">{selectedOrder.jobId}</p></div>
              <div><p className="text-sm text-muted-foreground">วันที่สั่งซื้อ</p><p className="font-medium">{selectedOrder.orderDate}</p></div>
              <div><p className="text-sm text-muted-foreground">วันจัดส่ง</p><p className="font-medium">{selectedOrder.deliveryDate}</p></div>
              <div><p className="text-sm text-muted-foreground">ช่องทางการขาย</p><Badge variant="outline">{selectedOrder.salesChannel}</Badge></div>
              <div><p className="text-sm text-muted-foreground">สถานะคำสั่งซื้อ</p>{getOrderStatusBadge(selectedOrder.orderStatus || "สร้างคำสั่งซื้อใหม่")}</div>
              <div><p className="text-sm text-muted-foreground">สถานะชำระเงิน</p>{getPaymentStatusBadge(selectedOrder.paymentStatus || "รอชำระเงิน")}</div>
              <div><p className="text-sm text-muted-foreground">พนักงานที่รับผิดชอบ</p><p className="font-medium">{selectedOrder.responsiblePerson || "ไม่ระบุ"}</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ข้อมูลลูกค้า</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">ชื่อผู้สั่งซื้อ</p><p className="font-medium">{selectedOrder.customerName}</p></div>
              <div><p className="text-sm text-muted-foreground">ชื่อ LINE</p><p className="font-medium">{selectedOrder.lineName}</p></div>
              <div><p className="text-sm text-muted-foreground">เบอร์โทร</p><p className="font-medium">{selectedOrder.customerPhone || "ไม่ระบุ"}</p></div>
              <div><p className="text-sm text-muted-foreground">อีเมล</p><p className="font-medium">{selectedOrder.customerEmail || "ไม่ระบุ"}</p></div>
              <div className="col-span-2"><p className="text-sm text-muted-foreground">ที่อยู่</p><p className="font-medium">{selectedOrder.customerAddress || "ไม่ระบุ"}</p></div>
              <div><p className="text-sm text-muted-foreground">เลขผู้เสียภาษี</p><p className="font-medium">{selectedOrder.taxId || "ไม่ระบุ"}</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>รายละเอียดงาน</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">ประเภทสินค้า</p><p className="font-medium">{selectedOrder.productType || "ไม่ระบุ"}</p></div>
              <div><p className="text-sm text-muted-foreground">วัสดุ</p><p className="font-medium">{selectedOrder.material || "ไม่ระบุ"}</p></div>
              <div><p className="text-sm text-muted-foreground">ขนาด</p><p className="font-medium">{selectedOrder.size || "ไม่ระบุ"}</p></div>
              <div><p className="text-sm text-muted-foreground">จำนวน</p><p className="font-medium">{selectedOrder.quantity || "ไม่ระบุ"} ชิ้น</p></div>
              <div><p className="text-sm text-muted-foreground">ราคาต่อหน่วย</p><p className="font-medium">{selectedOrder.unitPrice ? `${selectedOrder.unitPrice} บาท` : "ไม่ระบุ"}</p></div>
              <div className="col-span-2"><p className="text-sm text-muted-foreground">รายละเอียดเพิ่มเติม</p><p className="font-medium">{selectedOrder.additionalDetails || "ไม่มี"}</p></div>
            </div>
          </CardContent>
        </Card>

        {selectedOrder.savedProducts && selectedOrder.savedProducts.length > 0 && (
          <Card>
            <CardHeader><CardTitle>สินค้าที่บันทึกแล้ว</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedOrder.savedProducts.map((product: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg bg-muted/50">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">ประเภท:</span> <span className="font-medium">{product.productType}</span></div>
                      <div><span className="text-muted-foreground">วัสดุ:</span> <span className="font-medium">{product.material}</span></div>
                      <div><span className="text-muted-foreground">ขนาด:</span> <span className="font-medium">{product.size || product.customSize}</span></div>
                      <div><span className="text-muted-foreground">จำนวน:</span> <span className="font-medium">{product.quantity} ชิ้น</span></div>
                      <div><span className="text-muted-foreground">ราคา/หน่วย:</span> <span className="font-medium">{product.unitPrice} บาท</span></div>
                      <div><span className="text-muted-foreground">รวม:</span> <span className="font-medium">{product.quantity * product.unitPrice} บาท</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>ข้อมูลผู้เสียภาษี</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div><p className="text-sm text-muted-foreground mb-1">ชื่อผู้เสียภาษี</p><p className="font-medium">{selectedOrder.taxCompanyName || selectedOrder.customerName || "ไม่ระบุ"}</p></div>
              <div><p className="text-sm text-muted-foreground mb-1">เลขประจำตัวผู้เสียภาษี</p><p className="font-medium">{selectedOrder.taxId || "ไม่ระบุ"}</p></div>
              <div><p className="text-sm text-muted-foreground mb-1">ที่อยู่ผู้เสียภาษี</p><p className="font-medium whitespace-pre-line">{selectedOrder.customerAddress || "ไม่ระบุ"}</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>ข้อมูลการจัดส่งและการชำระเงิน</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-muted-foreground">วิธีการจัดส่ง</p><p className="font-medium">{selectedOrder.deliveryMethod || "ไม่ระบุ"}</p></div>
              <div><p className="text-sm text-muted-foreground">ค่าจัดส่ง</p><p className="font-medium">{selectedOrder.deliveryCost ? `${selectedOrder.deliveryCost} บาท` : "ไม่ระบุ"}</p></div>
              <div><p className="text-sm text-muted-foreground">วิธีการชำระเงิน</p><p className="font-medium">{selectedOrder.paymentMethod || "ไม่ระบุ"}</p></div>
              <div><p className="text-sm text-muted-foreground">สถานะการชำระเงิน</p><Badge variant={selectedOrder.paymentStatus === "ชำระแล้ว" ? "default" : "outline"}>{selectedOrder.paymentStatus || "รอชำระ"}</Badge></div>
              <div><p className="text-sm text-muted-foreground">ยอดรวมทั้งหมด</p><p className="font-medium text-lg">{selectedOrder.totalAmount ? `${selectedOrder.totalAmount} บาท` : "ไม่ระบุ"}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============ CREATE / EDIT FORM ============
  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{isEditing ? "แก้ไขคำสั่งซื้อ" : "สร้างรายการคำสั่งซื้อ"}</h1>
            <p className="text-muted-foreground">{isEditing ? "แก้ไขข้อมูลคำสั่งซื้อ" : "กรอกข้อมูลเพื่อสร้างคำสั่งซื้อใหม่"}</p>
          </div>
          <Button variant="outline" onClick={handleFormCancel}>กลับไปรายการคำสั่งซื้อ</Button>
        </div>
        <CreateOrderForm onSubmit={handleFormSubmit} onCancel={handleFormCancel} initialData={isEditing ? selectedOrder : undefined} estimationData={estimationData} />
      </div>
    );
  }

  // ============ MAIN LIST VIEW ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการคำสั่งซื้อ</h1>
          <p className="text-muted-foreground">สร้างและจัดการคำสั่งซื้อ</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          สร้างรายการคำสั่งซื้อ
        </Button>
      </div>

      {/* ===== TOP SUMMARY CARDS ===== */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">ช่วงเวลา:</span>
          <div className="flex gap-1">
            {[
              { value: "today", label: "วันนี้" },
              { value: "week", label: "สัปดาห์" },
              { value: "month", label: "เดือน" },
              { value: "year", label: "ปี" },
              { value: "lastYear", label: "ปีที่แล้ว" },
              { value: "all", label: "ทั้งหมด" },
            ].map(p => (
              <Button key={p.value} variant={summaryPeriod === p.value ? "default" : "outline"} size="sm" onClick={() => setSummaryPeriod(p.value)} className="text-xs h-7 px-3">
                {p.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
          {/* Order stats */}
          <Card className={cn("cursor-pointer transition-all hover:shadow-md border-blue-200 bg-blue-50/50", cardFilter === "request" && "ring-2 ring-blue-500 shadow-md")} onClick={() => setCardFilter(cardFilter === "request" ? null : "request")}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">ส่งคำขอ</p>
              <p className="text-2xl font-bold text-blue-700">{summaryStats.statusCounts.request}</p>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer transition-all hover:shadow-md border-amber-200 bg-amber-50/50", cardFilter === "draft" && "ring-2 ring-amber-500 shadow-md")} onClick={() => setCardFilter(cardFilter === "draft" ? null : "draft")}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">สร้างใหม่</p>
              <p className="text-2xl font-bold text-amber-700">{summaryStats.statusCounts.draft}</p>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer transition-all hover:shadow-md border-green-200 bg-green-50/50", cardFilter === "confirmed" && "ring-2 ring-green-500 shadow-md")} onClick={() => setCardFilter(cardFilter === "confirmed" ? null : "confirmed")}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">ยืนยันแล้ว</p>
              <p className="text-2xl font-bold text-green-700">{summaryStats.statusCounts.confirmed}</p>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer transition-all hover:shadow-md border-purple-200 bg-purple-50/50", cardFilter === "jobCreated" && "ring-2 ring-purple-500 shadow-md")} onClick={() => setCardFilter(cardFilter === "jobCreated" ? null : "jobCreated")}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">สร้างงานแล้ว</p>
              <p className="text-2xl font-bold text-purple-700">{summaryStats.statusCounts.jobCreated}</p>
            </CardContent>
          </Card>
          {/* Payment stats */}
          <Card className={cn("cursor-pointer transition-all hover:shadow-md border-orange-200 bg-orange-50/50", cardFilter === "partial" && "ring-2 ring-orange-500 shadow-md")} onClick={() => setCardFilter(cardFilter === "partial" ? null : "partial")}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">ชำระบางส่วน</p>
              <p className="text-2xl font-bold text-orange-700">{summaryStats.paymentCounts.partial}</p>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer transition-all hover:shadow-md border-gray-200 bg-gray-50/50", cardFilter === "pending" && "ring-2 ring-gray-500 shadow-md")} onClick={() => setCardFilter(cardFilter === "pending" ? null : "pending")}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">รอชำระเงิน</p>
              <p className="text-2xl font-bold text-gray-700">{summaryStats.paymentCounts.pending}</p>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer transition-all hover:shadow-md border-sky-200 bg-sky-50/50", cardFilter === "credit" && "ring-2 ring-sky-500 shadow-md")} onClick={() => setCardFilter(cardFilter === "credit" ? null : "credit")}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">เครดิต</p>
              <p className="text-2xl font-bold text-sky-700">{summaryStats.paymentCounts.credit}</p>
            </CardContent>
          </Card>
          {/* Revenue stats (not clickable filters) */}
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">ยอดขายรวม</p>
              <p className="text-lg font-bold text-emerald-700">{summaryStats.totalRevenue.toLocaleString("th-TH")}฿</p>
            </CardContent>
          </Card>
          <Card className="border-teal-200 bg-teal-50/50">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">ยอดรับจริง</p>
              <p className="text-lg font-bold text-teal-700">{summaryStats.totalPaid.toLocaleString("th-TH")}฿</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== SEARCH & FILTER ===== */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาทุกข้อมูล (Deep Search) - JOB ID, ชื่อลูกค้า, เบอร์โทร, วัสดุ, หมายเหตุ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant={showAdvancedFilter ? "default" : "outline"}
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              ค้นหาขั้นสูง
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFilter ? "rotate-180" : ""}`} />
            </Button>
            {(hasActiveFilters || hasColumnFilters) && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-destructive">
                <X className="w-4 h-4" />
                ล้างตัวกรอง
              </Button>
            )}
          </div>

          {showAdvancedFilter && (
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <p className="text-sm font-medium text-muted-foreground">ค้นหาขั้นสูง (ค้นหาทุกข้อมูลรวมถึงรายละเอียดที่ไม่แสดงในตาราง เช่น เบอร์โทร, อีเมล, ที่อยู่, วัสดุ, เลขผู้เสียภาษี)</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="ค้นหาข้อมูลทั้งหมด เช่น เบอร์โทร, อีเมล, วัสดุ, ที่อยู่, เลขผู้เสียภาษี..." value={advancedSearchTerm} onChange={(e) => setAdvancedSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">สถานะคำสั่งซื้อ</p>
                  <Select value={filterOrderStatus} onValueChange={setFilterOrderStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="ส่งคำขอสั่งซื้อ">ส่งคำขอสั่งซื้อ</SelectItem>
                      <SelectItem value="สร้างคำสั่งซื้อใหม่">สร้างคำสั่งซื้อใหม่</SelectItem>
                      <SelectItem value="ยืนยันคำสั่งซื้อ">ยืนยันคำสั่งซื้อ</SelectItem>
                      <SelectItem value="สร้างงานแล้ว">สร้างงานแล้ว</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">สถานะชำระเงิน</p>
                  <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="ชำระเงินแล้ว">ชำระเงินแล้ว</SelectItem>
                      <SelectItem value="ชำระบางส่วน">ชำระบางส่วน</SelectItem>
                      <SelectItem value="รอชำระเงิน">รอชำระเงิน</SelectItem>
                      <SelectItem value="เครดิต">เครดิต</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">วิธีจัดส่ง</p>
                  <Select value={filterDeliveryMethod} onValueChange={setFilterDeliveryMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="ส่งพัสดุ">ส่งพัสดุ</SelectItem>
                      <SelectItem value="รับเอง">รับเอง</SelectItem>
                      <SelectItem value="จัดส่งโดยพนักงาน">จัดส่งโดยพนักงาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">วิธีชำระเงิน</p>
                  <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="โอนเงิน">โอนเงิน</SelectItem>
                      <SelectItem value="เงินสด">เงินสด</SelectItem>
                      <SelectItem value="วางบิล">วางบิล</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ประเภทสินค้า</p>
                  <Select value={filterProductCategory} onValueChange={setFilterProductCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทั้งหมด</SelectItem>
                      <SelectItem value="สินค้าสำเร็จรูป">สินค้าสำเร็จรูป</SelectItem>
                      <SelectItem value="สินค้าสั่งผลิต">สินค้าสั่งผลิต</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===== ORDERS TABLE ===== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>รายการคำสั่งซื้อ</span>
            <Badge variant="secondary">{filteredOrders.length} รายการ</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>JOB ID</TableHead>
                  <TableHead>วันที่สั่งซื้อ</TableHead>
                  <TableHead>ช่องทางการขาย</TableHead>
                  <TableHead>ชื่อผู้สั่งซื้อ</TableHead>
                  <TableHead>ประเภทสินค้า</TableHead>
                  <TableHead>สถานะคำสั่งซื้อ</TableHead>
                  <TableHead>สถานะชำระเงิน</TableHead>
                  <TableHead className="text-right">ยอดรวมทั้งหมด</TableHead>
                  <TableHead>วิธีจัดส่ง</TableHead>
                  <TableHead className="text-center">ออกใบกำกับภาษี</TableHead>
                  <TableHead>วันจัดส่ง</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
                {/* Column filter row */}
                <TableRow className="bg-muted/30">
                  <TableHead className="py-1">
                    <Input placeholder="กรอง..." value={colFilterJobId} onChange={e => setColFilterJobId(e.target.value)} className="h-7 text-xs" />
                  </TableHead>
                  <TableHead className="py-1">
                    <Input placeholder="วันที่..." value={colFilterDate} onChange={e => setColFilterDate(e.target.value)} className="h-7 text-xs" />
                  </TableHead>
                  <TableHead className="py-1">
                    <Select value={colFilterChannel} onValueChange={setColFilterChannel}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        <SelectItem value="ลูกค้าสั่งเอง">ลูกค้าสั่งเอง</SelectItem>
                        <SelectItem value="ฟรีแลนซ์">ฟรีแลนซ์</SelectItem>
                        <SelectItem value="ร้านค้าตัวแทน">ร้านค้าตัวแทน</SelectItem>
                        <SelectItem value="ฝ่ายขาย">ฝ่ายขาย</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead className="py-1">
                    <Input placeholder="กรอง..." value={colFilterCustomer} onChange={e => setColFilterCustomer(e.target.value)} className="h-7 text-xs" />
                  </TableHead>
                  <TableHead className="py-1">
                    <Select value={colFilterCategory} onValueChange={setColFilterCategory}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        <SelectItem value="สินค้าสำเร็จรูป">สำเร็จรูป</SelectItem>
                        <SelectItem value="สินค้าสั่งผลิต">สั่งผลิต</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead className="py-1">
                    <Select value={colFilterOrderStatus} onValueChange={setColFilterOrderStatus}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        <SelectItem value="ส่งคำขอสั่งซื้อ">ส่งคำขอ</SelectItem>
                        <SelectItem value="สร้างคำสั่งซื้อใหม่">สร้างใหม่</SelectItem>
                        <SelectItem value="ยืนยันคำสั่งซื้อ">ยืนยัน</SelectItem>
                        <SelectItem value="สร้างงานแล้ว">สร้างงาน</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead className="py-1">
                    <Select value={colFilterPaymentStatus} onValueChange={setColFilterPaymentStatus}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        <SelectItem value="ชำระเงินแล้ว">ชำระแล้ว</SelectItem>
                        <SelectItem value="ชำระบางส่วน">บางส่วน</SelectItem>
                        <SelectItem value="รอชำระเงิน">รอชำระ</SelectItem>
                        <SelectItem value="เครดิต">เครดิต</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead className="py-1"></TableHead>
                  <TableHead className="py-1">
                    <Select value={colFilterDelivery} onValueChange={setColFilterDelivery}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">ทั้งหมด</SelectItem>
                        <SelectItem value="ส่งพัสดุ">ส่งพัสดุ</SelectItem>
                        <SelectItem value="รับเอง">รับเอง</SelectItem>
                        <SelectItem value="จัดส่งโดยพนักงาน">พนักงาน</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead className="py-1"></TableHead>
                  <TableHead className="py-1">
                    <Input placeholder="วันที่..." value={colFilterDeliveryDate} onChange={e => setColFilterDeliveryDate(e.target.value)} className="h-7 text-xs" />
                  </TableHead>
                  <TableHead className="py-1"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                      ไม่พบรายการที่ตรงกับการค้นหา
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <a
                          href={`/sales/track-orders/${order.jobId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline hover:text-blue-800 cursor-pointer"
                        >
                          {highlightText(order.jobId, activeSearchTerm)}
                        </a>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{highlightText(order.orderDate, activeSearchTerm)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{highlightText(order.salesChannel, activeSearchTerm)}</Badge>
                      </TableCell>
                      <TableCell>{highlightText(order.customerName, activeSearchTerm)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{order.productCategory}</Badge>
                      </TableCell>
                      <TableCell>{getOrderStatusBadge(order.orderStatus)}</TableCell>
                      <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="font-medium">{order.totalAmount?.toLocaleString('th-TH')} ฿</div>
                        <div className="text-xs text-muted-foreground">{order.paymentMethod}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.deliveryMethod}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {order.taxInvoice ? (
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{highlightText(order.deliveryDate, activeSearchTerm)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            {order.orderStatus === "ยืนยันคำสั่งซื้อ" && !order.jobCreated && !createdJobs.has(order.id) && (
                              <Button size="sm" className="bg-primary hover:bg-primary/90 gap-1" onClick={() => handleCreateJob(order)}>
                                <Rocket className="w-4 h-4" /> สร้างงาน
                              </Button>
                            )}
                            {order.orderStatus === "ยืนยันคำสั่งซื้อ" && !order.jobCreated && createdJobs.has(order.id) && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => navigate(`/sales/track-orders/${order.jobId}`)}>
                                <CheckCircle className="w-4 h-4" /> สร้างงานแล้ว
                              </Button>
                            )}
                            {order.orderStatus === "สร้างงานแล้ว" && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={() => navigate(`/sales/track-orders/${order.jobId}`)}>
                                <CheckCircle className="w-4 h-4" /> สร้างงานแล้ว
                              </Button>
                            )}
                            {order.orderStatus !== "สร้างงานแล้ว" && !createdJobs.has(order.id) && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => handleViewOrder(order)}><Eye className="w-4 h-4" /></Button>
                                <Button size="sm" variant="outline" onClick={() => handleEditOrder(order)}><Edit className="w-4 h-4" /></Button>
                              </>
                            )}
                            {(order.orderStatus === "สร้างงานแล้ว" || createdJobs.has(order.id)) && (
                              <Button size="sm" variant="outline" onClick={() => handleViewOrder(order)}><Eye className="w-4 h-4" /></Button>
                            )}
                          </div>
                          {(createdJobs.has(order.id) || order.orderStatus === "สร้างงานแล้ว") && jobDepartments[order.id] && (
                            <div className="flex flex-wrap gap-1">
                              {getDeptBadges(order.id)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
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
        </CardContent>
      </Card>

      {/* Department Selection Modal */}
      <Dialog open={showDeptModal} onOpenChange={setShowDeptModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5" />
              เลือกแผนกเพื่อส่งงาน
            </DialogTitle>
          </DialogHeader>
          {pendingOrder && (
            <div className="mb-2 p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium">{pendingOrder.jobId} — {pendingOrder.customerName}</p>
              <p className="text-xs text-muted-foreground">{pendingOrder.product} • {pendingOrder.productCategory}</p>
            </div>
          )}
          <div className="space-y-3">
            {[
              { key: "ฝ่ายกราฟฟิก", icon: Palette, desc: "ส่งงานออกแบบกราฟฟิก / อาร์ตเวิร์ค", color: "text-purple-600" },
              { key: "ฝ่ายจัดซื้อ", icon: ShoppingBag, desc: "ส่งงานจัดซื้อ / ติดต่อโรงงาน", color: "text-orange-600" },
              { key: "ฝ่ายผลิตและจัดส่ง", icon: Factory, desc: "ส่งงานเข้าคิวผลิตและจัดส่ง", color: "text-teal-600" },
            ].map(dept => (
              <label
                key={dept.key}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                  selectedDepts.includes(dept.key)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <Checkbox
                  checked={selectedDepts.includes(dept.key)}
                  onCheckedChange={() => toggleDept(dept.key)}
                />
                <dept.icon className={cn("w-5 h-5", dept.color)} />
                <div className="flex-1">
                  <p className="font-medium text-sm">{dept.key}</p>
                  <p className="text-xs text-muted-foreground">{dept.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDeptModal(false)}>ยกเลิก</Button>
            <Button onClick={handleConfirmCreateJob} disabled={selectedDepts.length === 0} className="gap-1">
              <Rocket className="w-4 h-4" /> ส่งงาน ({selectedDepts.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
