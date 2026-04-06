import { useState, useEffect, useMemo } from "react";
import trophyB112GImage from "@/assets/trophy-b112g.png";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Plus, X, Upload, Eye, Trash2, ExternalLink, FileText, Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { format, isValid } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { EstimationDetailDialog } from "./EstimationDetailDialog";
import {
  getProvinces, getAmphoesByProvince, getDistricts, getZipcode, loadAddressData
} from "@/utils/thaiAddress";

// Set global Zod error map for Thai localization
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.received === 'undefined' || issue.received === 'null') {
      return { message: 'กรุณากรอกข้อมูล' };
    }
  }
  if (issue.code === z.ZodIssueCode.too_small && issue.type === 'string' && issue.minimum === 1) {
    return { message: 'กรุณากรอกข้อมูล' };
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);

// Define the form schema
const createOrderSchema = z.object({
  // Section 1: Sales Employee
  responsiblePerson: z.string({ required_error: "กรุณาระบุพนักงานที่รับผิดชอบ" }).min(1, "กรุณาระบุพนักงานที่รับผิดชอบ"),

  // Section 2: Customer Information
  customerSearch: z.string().optional(),
  customerName: z.string({ required_error: "กรุณาระบุชื่อลูกค้า" }).min(1, "กรุณาระบุชื่อลูกค้า"),
  customerPhone: z.string({ required_error: "กรุณาระบุเบอร์โทรศัพท์" }).min(1, "กรุณาระบุเบอร์โทรศัพท์"),
  customerLine: z.string().optional(),
  customerEmail: z.string().optional(),
  requireTaxInvoice: z.boolean().optional(),
  invoiceType: z.string().optional(),
  taxPayerName: z.string().optional(),
  taxId: z.string().optional(),
  taxAddress: z.string().optional(),

  // Section 3: Order Information
  jobId: z.string().optional(),
  quotationNumber: z.string().optional(),
  quotationUrl: z.string().optional(),
  urgencyLevel: z.string({ required_error: "กรุณาเลือกความเร่งด่วน" }).min(1, "กรุณาเลือกความเร่งด่วน"),
  jobName: z.string({ required_error: "กรุณาระบุชื่องาน" }).min(1, "กรุณาระบุชื่องาน"),
  eventLocation: z.string().optional(),
  usageDate: z.date().optional(),
  deliveryDate: z.date().optional(),
  budget: z.string().optional(),
  productType: z.string().optional(),
  material: z.string().optional(),

  // Section 4: Job Details (dynamic based on product type)
  jobDetails: z.object({
    customerReferenceImages: z.any().optional(),
    referenceImages: z.any().optional(),
    fileName: z.string().optional(),
    fileChannel: z.string().optional(),
    size: z.string().optional(),
    thickness: z.string().optional(),
    shape: z.string().optional(),
    quantity: z.string().optional(),
    colors: z.array(z.string()).optional(),
    frontDetails: z.array(z.string()).optional(),
    backDetails: z.array(z.string()).optional(),
    lanyardSize: z.string().optional(),
    lanyardQuantity: z.string().optional(),
    moldCost: z.string().optional(),
    notes: z.string().optional(),
    model: z.string().optional(),
    engraving: z.string().optional(),
    engravingDetails: z.string().optional(),
    engravingFiles: z.any().optional(),
    attachedFiles: z.any().optional(),
    customType: z.string().optional(),
  }).optional(),

  // Section 5: Delivery Information
  deliveryType: z.string({ required_error: "กรุณาเลือกรูปแบบการรับสินค้า" }).min(1, "กรุณาเลือกรูปแบบการรับสินค้า"),
  deliveryInfo: z.object({
    recipientName: z.string().optional(),
    recipientPhone: z.string().optional(),
    address: z.string().optional(),
    subdistrict: z.string().optional(),
    district: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
    deliveryMethod: z.string().optional(),
    preferredDeliveryDate: z.date().optional(),
    paymentMethod: z.string().optional(),
    shippingPaymentProof: z.any().optional(),
    deliveryInstructions: z.string().optional(),
    pickupDate: z.date().optional(),
    pickupTimePeriod: z.string().optional(),
    originBranch: z.string().optional(),
    destinationBranch: z.string().optional(),
    preferredTimeSlot: z.string().optional(),
  }).optional(),
});

type CreateOrderFormData = z.infer<typeof createOrderSchema>;

interface CreateOrderFormProps {
  onSubmit: (data: CreateOrderFormData) => void;
  onCancel: () => void;
  initialData?: any;
  estimationData?: {
    id: number;
    date: string;
    lineName: string;
    productType: string;
    quantity: number;
    price: number;
    status: string;
  } | null;
  customerData?: any;
}

// Master Subcategories with their parent category (IDs match API subcategoryId)
const SUBCATEGORY_MAP: Record<string, { id: string; name: string }> = {
  // ถ้วยรางวัลสำเร็จ
  "1": { id: "1", name: "ถ้วยรางวัลโลหะอิตาลี" },
  "2": { id: "2", name: "ถ้วยรางวัลโลหะจีน" },
  "3": { id: "3", name: "ถ้วยรางวัลพลาสติกอิตาลี" },
  "4": { id: "4", name: "ถ้วยรางวัลพลาสติกไทย" },
  "5": { id: "5", name: "ถ้วยรางวัลพิวเตอร์" },
  "6": { id: "6", name: "ถ้วยรางวัลเบญจรงค์" },
  // เหรียญรางวัล
  "7": { id: "7", name: "เหรียญรางวัลสำเร็จรูป" },
  "8": { id: "8", name: "เหรียญรางวัลซิงค์อัลลอย" },
  "9": { id: "9", name: "เหรียญรางวัลอะคริลิก" },
  "10": { id: "10", name: "เหรียญรางวัลอื่นๆ" },
  // โล่รางวัล
  "11": { id: "11", name: "โล่รางวัลอะคริลิก(สำเร็จ)" },
  "12": { id: "12", name: "โล่รางวัลอะคริลิก (สั่งผลิต)" },
  "13": { id: "13", name: "โล่รางวัลคริสตัล" },
  "14": { id: "14", name: "โล่รางวัลไม้" },
  "15": { id: "15", name: "โล่รางวัลเรซิน" },
  // เสื้อพิมพ์ลายและผ้า
  "16": { id: "16", name: "เสื้อคอปก" },
  "17": { id: "17", name: "เสื้อคอกลม" },
  "18": { id: "18", name: "เสื้อแขนยาว" },
  // ชิ้นส่วนถ้วยรางวัล
  "19": { id: "19", name: "หัวป้ายพลาสติก" },
  "20": { id: "20", name: "หัวป้ายตุ๊กตาพลาสติก" },
  "21": { id: "21", name: "เหรียญรางวัลอะคริลิก" },
};

export default function CreateOrderForm({ onSubmit, onCancel, initialData, estimationData, customerData }: CreateOrderFormProps) {
  const navigate = useNavigate();
  const [productItems, setProductItems] = useState<any[]>([]);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Thai address cascade states
  const [thaiProvinces, setThaiProvinces] = useState<string[]>([]);
  const [thaiAmphures, setThaiAmphures] = useState<string[]>([]);
  const [thaiTambons, setThaiTambons] = useState<string[]>([]);
  const [selectedProvinceName, setSelectedProvinceName] = useState<string>("");
  const [selectedAmphureName, setSelectedAmphureName] = useState<string>("");
  const [showTaxFields, setShowTaxFields] = useState(false);
  const [deliveryType, setDeliveryType] = useState<string>("parcel");
  const [customSize, setCustomSize] = useState("");
  const [showCustomSize, setShowCustomSize] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");
  const [shapeFiles, setShapeFiles] = useState<File[]>([]);

  // ReadyMedal specific states
  const [selectedProductModel, setSelectedProductModel] = useState<string>("");
  const [selectedPlatingColor, setSelectedPlatingColor] = useState<string>("");
  const [readyMedalColorEntries, setReadyMedalColorEntries] = useState<{ color: string; quantity: string }[]>([]);
  const [newColorEntry, setNewColorEntry] = useState<{ color: string; quantity: string }>({ color: "", quantity: "" });
  const [wantsSticker, setWantsSticker] = useState<string>("");
  const [stickerDesignDetails, setStickerDesignDetails] = useState<string>("");
  const [stickerFiles, setStickerFiles] = useState<File[]>([]);
  const [readyMadePriceType, setReadyMadePriceType] = useState<"retail" | "wholesale" | "clearance">("retail");
  const [readyMadeUnitPrice, setReadyMadeUnitPrice] = useState<string>("");

  // Add color entry
  const addColorEntry = () => {
    if (newColorEntry.color && newColorEntry.quantity) {
      setReadyMedalColorEntries(prev => {
        // Check if same color already exists
        const existingIndex = prev.findIndex(entry => entry.color === newColorEntry.color);
        if (existingIndex >= 0) {
          // Merge quantities
          const updated = [...prev];
          const existingQty = parseInt(updated[existingIndex].quantity) || 0;
          const newQty = parseInt(newColorEntry.quantity) || 0;
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: (existingQty + newQty).toString()
          };
          return updated;
        }
        return [...prev, newColorEntry];
      });
      setNewColorEntry({ color: "", quantity: "" });
    }
  };

  // Remove color entry
  const removeColorEntry = (index: number) => {
    setReadyMedalColorEntries(prev => prev.filter((_, i) => i !== index));
  };
  // Trophy sizes state
  const [trophySizes, setTrophySizes] = useState<{ size: string; height: number; opening: number; price: number; quantity: string }[]>([]);

  // Shirt form state
  const [shirtCollar, setShirtCollar] = useState<string>("");
  const [shirtSleeve, setShirtSleeve] = useState<string>("");
  const [shirtSizes, setShirtSizes] = useState<{ size: string; chest: string; length: string; shoulder: string; sleeve: string; quantity: string }[]>([
    { size: "XS", chest: "36", length: "26", shoulder: "15", sleeve: "7.5", quantity: "" },
    { size: "S", chest: "38", length: "27", shoulder: "16", sleeve: "8", quantity: "" },
    { size: "M", chest: "40", length: "28", shoulder: "17", sleeve: "8", quantity: "" },
    { size: "L", chest: "42", length: "29", shoulder: "18", sleeve: "8.5", quantity: "" },
    { size: "XL", chest: "44", length: "30", shoulder: "19", sleeve: "8.5", quantity: "" },
    { size: "2XL", chest: "46", length: "31", shoulder: "20", sleeve: "9", quantity: "" },
    { size: "3XL", chest: "48", length: "32", shoulder: "21", sleeve: "9.5", quantity: "" },
    { size: "4XL", chest: "50", length: "33", shoulder: "22", sleeve: "10", quantity: "" },
    { size: "5XL", chest: "52", length: "34", shoulder: "23", sleeve: "10.5", quantity: "" },
  ]);
  const [showCustomShirtSize, setShowCustomShirtSize] = useState(false);
  const [customShirtSize, setCustomShirtSize] = useState({ size: "", chest: "", length: "", shoulder: "", sleeve: "", quantity: "" });

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPriceEstimationId, setSelectedPriceEstimationId] = useState<number | null>(null);
  const [estimationDetailOpen, setEstimationDetailOpen] = useState(false);
  const [viewingEstimation, setViewingEstimation] = useState<{
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
  } | null>(null);

  // Selected estimations for quotation-style product list (multiple selection)
  const [selectedEstimations, setSelectedEstimations] = useState<{
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
    jobDescription?: string;
    material?: string;
  }[]>([]);
  const [paymentItems, setPaymentItems] = useState<{
    id: string;
    type: string;
    typeLabel: string;
    amount: number;
    transferDate?: Date;
    slipFile: File | null;
    slipPreview: string;
    slipUrl: string;
    additionalDetails: string;
    receivingBank?: string;
  }[]>([]);
  const [newPayment, setNewPayment] = useState<{
    type: string;
    amount: string;
    transferDate?: Date;
    slipFile: File | null;
    slipPreview: string;
    slipUrl: string;
    additionalDetails: string;
    receivingBank: string;
  }>({ type: '', amount: '', transferDate: undefined, slipFile: null, slipPreview: '', slipUrl: '', additionalDetails: '', receivingBank: '' });

  const [isUploading, setIsUploading] = useState(false);

  // Graphics connection info
  const [graphicsNotes, setGraphicsNotes] = useState("");
  const [designFiles, setDesignFiles] = useState<{ file: File; url: string; name: string; size: number }[]>([]);

  // Receiving bank options
  const bankOptions = [
    { value: "kbank", label: "ธ.กสิกรไทย", account: "xxx-x-xxxxx-x" },
    { value: "scb", label: "ธ.ไทยพาณิชย์", account: "xxx-x-xxxxx-x" },
    { value: "bbl", label: "ธ.กรุงเทพ", account: "xxx-x-xxxxx-x" },
    { value: "ktb", label: "ธ.กรุงไทย", account: "xxx-x-xxxxx-x" },
    { value: "bay", label: "ธ.กรุงศรีอยุธยา", account: "xxx-x-xxxxx-x" },
    { value: "tmb", label: "ธ.ทหารไทยธนชาต", account: "xxx-x-xxxxx-x" },
    { value: "promptpay", label: "PromptPay / พร้อมเพย์", account: "xxx-xxx-xxxx" },
  ];

  // Price estimation data (from /sales/price-estimation)
  const basePriceEstimations = [
    {
      id: 1,
      date: "2024-01-15",
      lineName: "customer_line_001",
      productType: "เหรียญสั่งผลิต",
      quantity: 100,
      price: 15000,
      status: "รอการอนุมัติ",
      customerName: "บริษัท ABC จำกัด",
      customerPhone: "02-123-4567",
      customerEmail: "contact@abc.co.th",
      jobDescription: "เหรียญที่ระลึกงานวิ่ง",
      material: "ซิงค์อัลลอย",
    },
    {
      id: 2,
      date: "2024-01-14",
      lineName: "customer_line_001",
      productType: "โล่สั่งผลิต",
      quantity: 50,
      price: 25000,
      status: "อนุมัติแล้ว",
      customerName: "บริษัท ABC จำกัด",
      customerPhone: "02-123-4567",
      customerEmail: "contact@abc.co.th",
      jobDescription: "โล่รางวัลประจำปี",
      material: "คริสตัล",
    },
    {
      id: 3,
      date: "2024-01-13",
      lineName: "customer_line_002",
      productType: "หมวก",
      quantity: 200,
      price: 8000,
      status: "อนุมัติแล้ว",
      customerName: "โรงเรียนสาธิต",
      customerPhone: "02-555-1234",
      customerEmail: "school@example.com",
      jobDescription: "หมวกวันกีฬาสี",
      material: "ผ้าโพลีเอสเตอร์",
    },
    {
      id: 4,
      date: "2024-01-12",
      lineName: "customer_line_002",
      productType: "กระเป๋า",
      quantity: 100,
      price: 15000,
      status: "รอการอนุมัติ",
      customerName: "โรงเรียนสาธิต",
      customerPhone: "02-555-1234",
      customerEmail: "school@example.com",
      jobDescription: "กระเป๋าผ้าของที่ระลึก",
      material: "ผ้าดิบ",
    },
    {
      id: 5,
      date: "2024-01-11",
      lineName: "customer_line_003",
      productType: "สายคล้อง",
      quantity: 500,
      price: 12500,
      status: "อนุมัติแล้ว",
      customerName: "บริษัท Event จำกัด",
      customerPhone: "02-333-4444",
      customerEmail: "event@company.com",
      jobDescription: "สายคล้องบัตรงาน Conference",
      material: "โพลีสกรีน",
    },
    {
      id: 6,
      date: "2024-01-10",
      lineName: "customer_line_003",
      productType: "ลิสแบรนด์",
      quantity: 300,
      price: 9000,
      status: "อนุมัติแล้ว",
      customerName: "บริษัท Event จำกัด",
      customerPhone: "02-333-4444",
      customerEmail: "event@company.com",
      jobDescription: "ริสแบนด์งาน Music Festival",
      material: "ซิลิโคน",
    },
    {
      id: 7,
      date: "2024-01-09",
      lineName: "customer_line_004",
      productType: "พวงกุญแจ",
      quantity: 1000,
      price: 20000,
      status: "อนุมัติแล้ว",
      customerName: "ร้านของฝาก",
      customerPhone: "02-666-7777",
      customerEmail: "gift@shop.com",
      jobDescription: "พวงกุญแจของที่ระลึก",
      material: "โลหะ",
    },
    {
      id: 8,
      date: "2024-01-08",
      lineName: "customer_line_004",
      productType: "แม่เหล็ก",
      quantity: 500,
      price: 10000,
      status: "รอการอนุมัติ",
      customerName: "ร้านของฝาก",
      customerPhone: "02-666-7777",
      customerEmail: "gift@shop.com",
      jobDescription: "แม่เหล็กติดตู้เย็น",
      material: "ยาง",
    },
    {
      id: 9,
      date: "2024-01-07",
      lineName: "nun",
      productType: "เหรียญสั่งผลิต",
      quantity: 200,
      price: 30000,
      status: "อนุมัติแล้ว",
      customerName: "LINE nun",
      customerPhone: "089-123-4567",
      customerEmail: "nun@example.com",
      jobDescription: "เหรียญสั่งผลิตพิเศษ",
      material: "ซิงค์อัลลอย",
    },
  ];


  // Mapping from product label to productsByCategory value
  const productLabelToValue: Record<string, string> = {
    "เหรียญสำเร็จรูป": "ReadyMedal",
    "ถ้วยรางวัล": "Trophy",
    "โล่ไม้": "WoodAward",
    "เหรียญสั่งผลิต": "Medal",
    "โล่สั่งผลิต": "Award",
    "ผ้า": "Fabric",
    "เสื้อ": "Shirt",
    "หมวก": "Hat",
    "กระเป๋า": "Bag",
    "แก้ว": "Glass",
    "ขวดน้ำ": "Bottle",
    "ตุ๊กตา": "Doll",
    "สมุด": "Notebook",
    "ปฏิทิน": "Calendar",
    "สายคล้อง": "Lanyard",
    "ลิสแบรนด์": "Wristband",
    "แม่เหล็ก": "Magnet",
    "ที่เปิดขวด": "BottleOpener",
    "พวงกุญแจ": "Keychain",
    "ที่ทับกระดาษ": "Paperweight"
  };

  // Reverse mapping from value to label
  const productValueToLabel: Record<string, string> = Object.fromEntries(
    Object.entries(productLabelToValue).map(([label, value]) => [value, label])
  );

  // Get filtered price estimations based on customer AND selected product type
  const getFilteredEstimationsByProduct = () => {
    const customerLine = (watchedCustomerLine ?? "").trim();
    const customerName = (watchedCustomerName ?? "").trim();
    const selectedProductLabel = productValueToLabel[watchedProductType] || "";

    if (!customerLine && !customerName) return [];
    if (!selectedProductLabel) return [];

    return priceEstimations.filter((est) => {
      // Filter out cancelled estimations
      if (est.status === "ยกเลิก") return false;

      // Match by LINE ID or customer name
      const matchesLine =
        customerLine && est.lineName.toLowerCase().includes(customerLine.toLowerCase());
      const matchesName =
        customerName && est.customerName.toLowerCase().includes(customerName.toLowerCase());

      // Match by product type
      const matchesProduct = est.productType === selectedProductLabel;

      return (matchesLine || matchesName) && matchesProduct;
    });
  };

  // Get filtered price estimations based on selected customer (by LINE or name) - for section 2
  const getFilteredEstimations = () => {
    const customerLine = (watchedCustomerLine ?? "").trim();
    const customerName = (watchedCustomerName ?? "").trim();

    if (!customerLine && !customerName) return [];

    return priceEstimations.filter((est) => {
      // Filter out cancelled estimations
      if (est.status === "ยกเลิก") return false;

      // Match by LINE ID or customer name
      const matchesLine =
        customerLine && est.lineName.toLowerCase().includes(customerLine.toLowerCase());
      const matchesName =
        customerName && est.customerName.toLowerCase().includes(customerName.toLowerCase());

      return matchesLine || matchesName;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "อนุมัติแล้ว":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "รอการอนุมัติ":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "ยกเลิก":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };


  // Find category for a product type label
  const findCategoryForProduct = (productLabel: string): string | null => {
    const productValue = productLabelToValue[productLabel];
    if (!productValue) return null;

    for (const [categoryId, products] of Object.entries(productsByCategory)) {
      if (products.some(p => p.value === productValue)) {
        return categoryId;
      }
    }
    return null;
  };

  // Toggle estimation selection (supports multiple)
  const toggleEstimationSelection = (estimation: typeof priceEstimations[0]) => {
    setSelectedEstimations(prev => {
      const isSelected = prev.some(e => e.id === estimation.id);
      if (isSelected) {
        return prev.filter(e => e.id !== estimation.id);
      } else {
        return [...prev, estimation];
      }
    });
  };

  // Remove estimation from selected list
  const removeSelectedEstimation = (estimationId: number) => {
    setSelectedEstimations(prev => prev.filter(e => e.id !== estimationId));
  };

  // Calculate grand total price from both selected estimations and saved products
  const orderTotalPrice = useMemo(() => {
    const estimationsTotal = selectedEstimations.reduce((sum, est) => sum + est.price, 0);
    const savedProductsTotal = savedProducts.reduce((sum, p) => {
      const quantity = p.quantity || parseInt(p.details?.quantity) || 1;
      const unitPrice = p.unitPrice || 0;
      return sum + (unitPrice * quantity);
    }, 0);
    return estimationsTotal + savedProductsTotal;
  }, [selectedEstimations, savedProducts]);

  // Select price estimation and auto-fill form (legacy single-select, kept for compatibility)
  const selectPriceEstimation = (estimation: typeof priceEstimations[0]) => {
    setSelectedPriceEstimationId(estimation.id);

    // Auto-fill customer info
    form.setValue("customerName", estimation.customerName);
    form.setValue("customerLine", estimation.lineName);
    form.setValue("customerPhone", estimation.customerPhone);
    form.setValue("customerEmail", estimation.customerEmail);

    // Auto-fill budget/price
    form.setValue("budget", estimation.price.toString());

    // Auto-fill job details quantity
    form.setValue("jobDetails.quantity", estimation.quantity.toString());

    // Auto-fill product type and category
    const productValue = productLabelToValue[estimation.productType];
    if (productValue) {
      const categoryId = findCategoryForProduct(estimation.productType);
      if (categoryId) {
        setSelectedCategory(categoryId);
      }
      form.setValue("productType", productValue);
      form.setValue("material", "");
    }

    toast({
      title: "เลือกรายการสำเร็จ",
      description: `นำข้อมูลจากรายการประเมินราคา #${estimation.id} มาใช้แล้ว`,
    });
  };
  
  // Category-first product selection structure
  const productCategories = [
    { id: "readymade", name: "สินค้าสำเร็จรูป", icon: "🏆" },
    { id: "custom", name: "สินค้าสั่งผลิต", icon: "🔧" },
    { id: "textile", name: "หมวดสิ่งทอ & เสื้อผ้า", icon: "👕" },
    { id: "items", name: "ของใช้", icon: "🎒" },
    { id: "lanyard", name: "หมวดสายคล้อง", icon: "🏷️" },
    { id: "premium", name: "ของพรีเมียม", icon: "🎁" },
  ];

  const productsByCategory: Record<string, { value: string; label: string; flow: "catalog" | "estimate" }[]> = {
    readymade: [
      { value: "Trophy", label: "ถ้วยรางวัลสำเร็จ", flow: "catalog" },
      { value: "ReadyMedal", label: "เหรียญรางวัล", flow: "catalog" },
      { value: "Award", label: "โล่รางวัล", flow: "catalog" },
      { value: "Shirt", label: "เสื้อพิมพ์ลายและผ้า", flow: "catalog" },
      { value: "TrophyPart", label: "ชิ้นส่วนถ้วยรางวัล", flow: "catalog" },
    ],
    custom: [
      { value: "Medal", label: "เหรียญสั่งผลิต", flow: "estimate" },
      { value: "Award", label: "โล่สั่งผลิต", flow: "estimate" },
    ],
    textile: [
      { value: "Fabric", label: "ผ้า", flow: "estimate" },
      { value: "Shirt", label: "เสื้อ", flow: "estimate" },
    ],
    items: [
      { value: "Hat", label: "หมวก", flow: "estimate" },
      { value: "Bag", label: "กระเป๋า", flow: "estimate" },
      { value: "Glass", label: "แก้ว", flow: "estimate" },
      { value: "Bottle", label: "ขวดน้ำ", flow: "estimate" },
      { value: "Doll", label: "ตุ๊กตา", flow: "estimate" },
      { value: "Notebook", label: "สมุด", flow: "estimate" },
      { value: "Calendar", label: "ปฏิทิน", flow: "estimate" },
    ],
    lanyard: [
      { value: "Lanyard", label: "สายคล้อง", flow: "estimate" },
      { value: "Wristband", label: "ลิสแบรนด์", flow: "estimate" },
    ],
    premium: [
      { value: "Magnet", label: "แม่เหล็ก", flow: "estimate" },
      { value: "BottleOpener", label: "ที่เปิดขวด", flow: "estimate" },
      { value: "Keychain", label: "พวงกุญแจ", flow: "estimate" },
      { value: "Paperweight", label: "ที่ทับกระดาษ", flow: "estimate" },
    ],
  };

  const getProductFlow = (productType: string): "catalog" | "estimate" | null => {
    for (const products of Object.values(productsByCategory)) {
      const found = products.find(p => p.value === productType);
      if (found) return found.flow;
    }
    return null;
  };

  const getPaymentTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'deposit': 'มัดจำ',
      'full': 'ชำระเต็มจำนวน',
      'remaining_balance': 'ชำระยอดส่วนที่เหลือ',
      'design_fee': 'ค่าบริการออกแบบ',
      'additional': 'ชำระเพิ่มเติม'
    };
    return labels[type] || type;
  };

  const form = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: initialData || {
      responsiblePerson: "",
      urgencyLevel: "",
      productType: "",
      deliveryType: "parcel",
      deliveryInfo: {
        recipientName: "",
        recipientPhone: "",
        address: "",
        subdistrict: "",
        district: "",
        province: "",
        postalCode: "",
        deliveryMethod: "",
        paymentMethod: "",
        deliveryInstructions: "",
      },
    },
  });

  const watchedProductType = form.watch("productType");
  const watchedMaterial = form.watch("material");
  const watchedCustomerName = form.watch("customerName");
  const watchedCustomerLine = form.watch("customerLine");
  const watchedCustomerPhone = form.watch("customerPhone");
  const watchedCustomerEmail = form.watch("customerEmail");
  const watchedDeliveryDate = form.watch("deliveryDate");
  const watchedCustomerSearch = form.watch("customerSearch");

  // If navigated from Customer Profile / Management
  useEffect(() => {
    if (customerData) {
      form.setValue("customerName", customerData.name || customerData.company_name || customerData.contact_name || "");
      
      const phoneArr = customerData.phone_numbers;
      const phone = Array.isArray(phoneArr) ? (phoneArr[0] || "") : (customerData.phone || customerData.customerPhone || "");
      form.setValue("customerPhone", phone);
      
      form.setValue("customerLine", customerData.line_id || customerData.customerLine || "");
      
      const emailArr = customerData.emails;
      const email = Array.isArray(emailArr) ? (emailArr[0] || "") : (customerData.email || "");
      form.setValue("customerEmail", email);
      
      // Auto-fill delivery address if available
      form.setValue("deliveryInfo.recipientName", customerData.contact || customerData.contact_name || customerData.name || "");
      form.setValue("deliveryInfo.recipientPhone", phone);
      
      const addr = customerData.shipping_address || customerData.billing_address || customerData.address || "";
      if (addr) form.setValue("deliveryInfo.address", addr);
      
      const province = customerData.shipping_province || customerData.billing_province || customerData.province || "";
      if (province) {
        setSelectedProvinceName(province);
        form.setValue("deliveryInfo.province", province);
      }
      
      const district = customerData.shipping_district || customerData.billing_district || customerData.district || "";
      if (district) {
        setSelectedAmphureName(district);
        form.setValue("deliveryInfo.district", district);
      }
      
      const subdistrict = customerData.shipping_subdistrict || customerData.billing_subdistrict || customerData.subdistrict || "";
      if (subdistrict) {
        form.setValue("deliveryInfo.subdistrict", subdistrict);
      }
      
      const postcode = customerData.shipping_postcode || customerData.billing_postcode || customerData.postalCode || "";
      if (postcode) {
        form.setValue("deliveryInfo.postalCode", postcode);
      }
    }
  }, [customerData, form]);


  // If user navigated from PriceEstimation, merge that record into the list
  // (and replace same-id records to prevent mock ID collision)
  const priceEstimations = useMemo(() => {
    if (!estimationData) return basePriceEstimations;

    const merged = {
      ...estimationData,
      status: estimationData.status || "อนุมัติแล้ว",
      customerName: watchedCustomerName || "",
      customerPhone: watchedCustomerPhone || "",
      customerEmail: watchedCustomerEmail || "",
      jobDescription: undefined,
    };

    return [merged, ...basePriceEstimations.filter((e) => e.id !== estimationData.id)];
  }, [estimationData, watchedCustomerName, watchedCustomerPhone, watchedCustomerEmail]);

  // Load address database immediately on mount
  useEffect(() => {
    loadAddressData().then(() => {
      getProvinces().then(setThaiProvinces);
    });
  }, []);

  // When province changes → load amphures
  useEffect(() => {
    if (selectedProvinceName) {
      setThaiAmphures([]);
      setThaiTambons([]);
      setSelectedAmphureName("");
      form.setValue("deliveryInfo.district", "");
      form.setValue("deliveryInfo.subdistrict", "");
      form.setValue("deliveryInfo.postalCode", "");
      getAmphoesByProvince(selectedProvinceName).then(setThaiAmphures);
    }
  }, [selectedProvinceName]);

  // When amphure changes → load tambons
  useEffect(() => {
    if (selectedProvinceName && selectedAmphureName) {
      setThaiTambons([]);
      form.setValue("deliveryInfo.subdistrict", "");
      form.setValue("deliveryInfo.postalCode", "");
      getDistricts(selectedProvinceName, selectedAmphureName).then(setThaiTambons);
    }
  }, [selectedAmphureName, selectedProvinceName]);

  // Fetch next Job ID on mount (only for new orders)
  useEffect(() => {
    if (!initialData) {
      fetch(`${LOCAL_API}orders.php?action=next_id`)
        .then(r => r.json())
        .then(json => {
          if (json.status === "success" && json.job_id) {
            form.setValue("jobId", json.job_id);
          }
        })
        .catch(err => console.warn("Failed to fetch next job ID:", err));
    }
  }, [initialData, form]);

  // API base URLs
  const CUSTOMERS_API = "https://nacres.co.th/api-lucky/admin/customers.php";
  const LOCAL_API = "https://nacres.co.th/api-lucky/admin/";

  // Helper function: Upload file to server
  const uploadFile = async (file: File, category: string = 'general'): Promise<string | null> => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      const response = await fetch(`${LOCAL_API}order_upload.php`, {
        method: "POST",
        body: formData,
      });

      const json = await response.json();
      if (json.status === "success") {
        return json.data.fileUrl; // We store full URL for convenience
      } else {
        toast({
          title: "อัปโหลดไฟล์ไม่สำเร็จ",
          description: json.message || "เกิดข้อผิดพลาดในการอัปโหลด",
          variant: "destructive",
        });
        return null;
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ต",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Load all customers from finfinphone server on mount
  useEffect(() => {
    fetch(CUSTOMERS_API)
      .then(r => r.json())
      .then(json => {
        if (json.status === "success") setCustomers(json.data);
      })
      .catch(err => console.warn("Failed to load customers:", err));
  }, []);

  // Load employees (sales staff only) from local backend
  useEffect(() => {
    fetch(`${LOCAL_API}/employees.php?sales_only=1`)
      .then(r => r.json())
      .then(json => {
        if (json.status === "success") setEmployees(json.data);
      })
      .catch(() => {
        // Fallback to hardcoded if API fails
        setEmployees([
          { id: 1, full_name: "นายสมศักดิ์ รักงาน", code: "EMP001" },
          { id: 2, full_name: "นางสาวพิมพ์ใจ ดีเยี่ยม", code: "EMP002" },
          { id: 3, full_name: "นายวิชัย มั่นคง", code: "EMP003" },
        ]);
      });
  }, []);

  // Auto-fill form when estimationData is provided
  useEffect(() => {
    if (estimationData) {
      // Map product type from estimation to form value
      const productTypeMap: Record<string, string> = {
        "Medal (เหรียญรางวัล)": "Medal",
        "Trophy (ถ้วยรางวัล)": "Trophy",
        "Shirt (เสื้อ)": "Shirt",
        "Award (โล่รางวัล)": "Award",
        "Lanyard (สายคล้อง)": "Lanyard",
        "เหรียญสั่งผลิต": "Medal",
        "ถ้วยรางวัล": "Trophy",
        "โล่สั่งผลิต": "Award",
        "เสื้อ": "Shirt",
        "สายคล้อง": "Lanyard",
      };

      const categoryMap: Record<string, string> = {
        "Medal": "custom",
        "Trophy": "readymade",
        "Award": "custom",
        "Shirt": "textile",
        "Lanyard": "lanyard",
      };

      const mappedProductType = productTypeMap[estimationData.productType] || "";
      const mappedCategory = categoryMap[mappedProductType] || "";

      // Set category and product type
      if (mappedCategory) {
        setSelectedCategory(mappedCategory);
      }
      if (mappedProductType) {
        form.setValue("productType", mappedProductType);
      }

      // Set LINE name as customer line
      form.setValue("customerLine", estimationData.lineName);

      // Set budget
      if (estimationData.price) {
        form.setValue("budget", estimationData.price.toString());
      }

      // Set quantity
      if (estimationData.quantity) {
        form.setValue("jobDetails.quantity", estimationData.quantity.toString());
      }

      // Mark the estimation as selected
      setSelectedPriceEstimationId(estimationData.id);
    }
  }, [estimationData, form]);

  // Auto-fill form when customerData is provided
  useEffect(() => {
    if (customerData) {
      // Basic Customer Info
      form.setValue("customerName", customerData.contact_name || "");
      form.setValue("customerPhone", Array.isArray(customerData.phone_numbers) ? (customerData.phone_numbers[0] || "") : "");
      form.setValue("customerLine", customerData.line_id || "");
      form.setValue("customerEmail", Array.isArray(customerData.emails) ? (customerData.emails[0] || "") : "");

      // Tax Information
      if (customerData.tax_id) {
        form.setValue("taxId", customerData.tax_id || "");
        form.setValue("taxPayerName", customerData.company_name || customerData.contact_name || "");
        
        // Build tax address
        const taxAddr = [
          customerData.billing_address,
          customerData.billing_subdistrict,
          customerData.billing_district,
          customerData.billing_province,
          customerData.billing_postcode,
        ].filter(Boolean).join(" ");
        
        form.setValue("taxAddress", taxAddr);
        form.setValue("requireTaxInvoice", true);
        form.setValue("invoiceType", "tax-invoice");
        setShowTaxFields(true);
      }

      // Delivery Information
      const deliveryAddr = customerData.shipping_address || customerData.billing_address || "";
      const sub = customerData.shipping_subdistrict || customerData.billing_subdistrict || "";
      const dist = customerData.shipping_district || customerData.billing_district || "";
      const prov = customerData.shipping_province || customerData.billing_province || "";
      const post = customerData.shipping_postcode || customerData.billing_postcode || "";

      form.setValue("deliveryInfo.recipientName", customerData.contact_name || "");
      form.setValue("deliveryInfo.recipientPhone", Array.isArray(customerData.phone_numbers) ? (customerData.phone_numbers[0] || "") : "");
      form.setValue("deliveryInfo.address", deliveryAddr);
      form.setValue("deliveryInfo.subdistrict", sub);
      form.setValue("deliveryInfo.district", dist);
      form.setValue("deliveryInfo.province", prov);
      form.setValue("deliveryInfo.postalCode", post);

      // Trigger address cascading states
      if (prov) {
        // We need to set these manually to ensure they display correctly in the Select components
        setSelectedProvinceName(prov);
        if (dist) {
          setSelectedAmphureName(dist);
        }
      }
    }
  }, [customerData, form]);

  // Search customers (local filter on loaded dataset, falls back to API search)
  useEffect(() => {
    const term = watchedCustomerSearch;

    // ถ้ายังไม่ได้พิมพ์ → แสดงรายชื่อทั้งหมด (first 10)
    if (!term || term.length === 0) {
      setSearchResults(customers.slice(0, 10));
      return;
    }

    // Local search first (instant)
    const lower = term.toLowerCase();
    const local = customers.filter(c =>
      c.contact_name?.toLowerCase().includes(lower) ||
      c.company_name?.toLowerCase().includes(lower) ||
      c.line_id?.toLowerCase().includes(lower) ||
      (Array.isArray(c.phone_numbers) && c.phone_numbers.some((p: string) => p.includes(term)))
    );
    if (local.length > 0) {
      setSearchResults(local.slice(0, 10));
      return;
    }
    // Fallback: live API search on finfinphone server
    const timeout = setTimeout(() => {
      fetch(`${CUSTOMERS_API}?search=${encodeURIComponent(term)}`)
        .then(r => r.json())
        .then(json => {
          if (json.status === "success") setSearchResults(json.data.slice(0, 10));
        })
        .catch(() => { });
    }, 300);
    return () => clearTimeout(timeout);
  }, [watchedCustomerSearch, customers]);

  // Select customer from search results — auto-fill all fields
  const selectCustomer = (customer: any) => {
    // ข้อมูลลูกค้าหลัก
    form.setValue("customerName", customer.contact_name ?? "");
    form.setValue("customerPhone", Array.isArray(customer.phone_numbers) ? (customer.phone_numbers[0] ?? "") : "");
    form.setValue("customerLine", customer.line_id ?? "");
    form.setValue("customerEmail", Array.isArray(customer.emails) ? (customer.emails[0] ?? "") : "");

    // ข้อมูลภาษี (ถ้ามี)
    if (customer.tax_id) {
      form.setValue("taxId", customer.tax_id ?? "");
      form.setValue("taxPayerName", customer.company_name ?? customer.contact_name ?? "");
      form.setValue("taxAddress", [
        customer.billing_address,
        customer.billing_subdistrict,
        customer.billing_district,
        customer.billing_province,
        customer.billing_postcode,
      ].filter(Boolean).join(" ") || "");
      form.setValue("requireTaxInvoice", true);
      form.setValue("invoiceType", "tax-invoice");
      setShowTaxFields(true);
    }

    // ที่อยู่จัดส่ง — ใช้ shipping address (ถ้ามี) ไม่งั้นใช้ billing
    const addr = customer.shipping_address || customer.billing_address || "";
    const sub = customer.shipping_subdistrict || customer.billing_subdistrict || "";
    const dist = customer.shipping_district || customer.billing_district || "";
    const prov = customer.shipping_province || customer.billing_province || "";
    const post = customer.shipping_postcode || customer.billing_postcode || "";

    form.setValue("deliveryInfo.recipientName", customer.contact_name ?? "");
    form.setValue("deliveryInfo.recipientPhone", Array.isArray(customer.phone_numbers) ? (customer.phone_numbers[0] ?? "") : "");
    form.setValue("deliveryInfo.address", addr);
    form.setValue("deliveryInfo.subdistrict", sub);
    form.setValue("deliveryInfo.district", dist);
    form.setValue("deliveryInfo.province", prov);
    form.setValue("deliveryInfo.postalCode", post);

    // Update cascading dropdown states
    setSelectedProvinceName(prov);
    setSelectedAmphureName(dist);

    setSearchResults([]);
    form.setValue("customerSearch", "");
    setSelectedPriceEstimationId(null);
    setShowCustomerDropdown(false);
  };

  // Update recipient info when customer info changes
  const updateRecipientInfo = () => {
    form.setValue("deliveryInfo.recipientName", watchedCustomerName);
    form.setValue("deliveryInfo.recipientPhone", watchedCustomerPhone);
  };

  // Material options based on product type
  const getMaterialOptions = (productType: string) => {
    switch (productType) {
      // ถ้วยรางวัล
      case "Trophy":
        return ["1", "2", "3", "4", "5", "6"].map(id => SUBCATEGORY_MAP[id].name);

      // เหรียญรางวัล
      case "ReadyMedal":
      case "Medal":
        return ["7", "8", "9", "10", "21"].map(id => SUBCATEGORY_MAP[id].name);

      // โล่รางวัล
      case "WoodAward":
      case "Award":
        return ["11", "12", "13", "14", "15"].map(id => SUBCATEGORY_MAP[id].name);

      // เสื้อพิมพ์ลายและผ้า
      case "Fabric":
      case "Shirt":
        return ["16", "17", "18"].map(id => SUBCATEGORY_MAP[id].name);

      // ชิ้นส่วนถ้วยรางวัล
      case "TrophyPart":
        return ["19", "20"].map(id => SUBCATEGORY_MAP[id].name);

      // ของใช้
      case "Hat":
        return ["ผ้าคอตตอน", "ผ้าโพลีเอสเตอร์", "ผ้าตาข่าย", "อื่นๆ (โปรดระบุ)"];
      case "Bag":
        return ["ผ้าแคนวาส", "หนังเทียม", "ไนลอน", "อื่นๆ (โปรดระบุ)"];
      case "Glass":
        return ["แก้วใส", "แก้วขุ่น", "เซรามิก", "อื่นๆ (โปรดระบุ)"];
      case "Bottle":
        return ["สแตนเลส", "พลาสติก", "อลูมิเนียม", "อื่นๆ (โปรดระบุ)"];
      case "Doll":
        return ["ผ้า", "ยาง", "พลาสติก", "อื่นๆ (โปรดระบุ)"];
      case "Notebook":
        return ["กระดาษถนอมสายตา", "กระดาษอาร์ต", "อื่นๆ (โปรดระบุ)"];
      case "Calendar":
        return ["กระดาษอาร์ต", "กระดาษถนอมสายตา", "อื่นๆ (โปรดระบุ)"];

      // หมวดสายคล้อง
      case "Lanyard":
        return ["โพลีสกรีน", "ผ้าไมโครเรียบ", "ผ้าดาวกระจาย", "ผ้าเม็ดข้าวสาร", "โฟม", "อื่นๆ (โปรดระบุ)"];
      case "Wristband":
        return ["ยาง", "กระดาษ", "ผ้า", "อื่นๆ (โปรดระบุ)"];

      // ของพรีเมียม
      case "Magnet":
        return ["ยาง", "โลหะ", "อะคริลิค", "อื่นๆ (โปรดระบุ)"];
      case "BottleOpener":
        return ["โลหะ", "ไม้", "อื่นๆ (โปรดระบุ)"];
      case "Keychain":
        return ["โลหะ", "ยาง", "อะคริลิค", "PVC", "อื่นๆ (โปรดระบุ)"];
      case "Paperweight":
        return ["คริสตัล", "อะคริลิค", "โลหะ", "อื่นๆ (โปรดระบุ)"];

      default:
        return ["อื่นๆ (โปรดระบุ)"];
    }
  };

  const renderJobDetails = () => {
    switch (watchedProductType) {
      case "Medal":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">รายละเอียดเหรียญสั่งผลิต</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobDetails.customerReferenceImages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รูปอ้างอิงจากลูกค้า</FormLabel>
                    <FormControl>
                      <div className="border-2 border-dashed border-border rounded-lg p-4">
                        <Button type="button" variant="outline" className="w-full">
                          <Upload className="w-4 h-4 mr-2" />
                          อัพโหลดไฟล์ (ได้มากกว่า 1 ไฟล์)
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDetails.referenceImages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ไฟล์ภาพอ้างอิง</FormLabel>
                    <FormControl>
                      <div className="border-2 border-dashed border-border rounded-lg p-4">
                        <Button type="button" variant="outline" className="w-full">
                          <Upload className="w-4 h-4 mr-2" />
                          อัพโหลดไฟล์ (ได้มากกว่า 1 ไฟล์)
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobDetails.fileName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อไฟล์งาน</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDetails.fileChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ช่องทางของไฟล์งาน</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="jobDetails.size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ขนาด</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedSize(value);
                        setShowCustomSize(value === "other");
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกขนาด" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="6">6 ซม</SelectItem>
                        <SelectItem value="6.5">6.5 ซม</SelectItem>
                        <SelectItem value="7">7 ซม</SelectItem>
                        <SelectItem value="7.5">7.5 ซม</SelectItem>
                        <SelectItem value="other">อื่นๆ</SelectItem>
                      </SelectContent>
                    </Select>
                    {showCustomSize && (
                      <Input
                        placeholder="ระบุขนาด"
                        value={customSize}
                        onChange={(e) => {
                          setCustomSize(e.target.value);
                          field.onChange(e.target.value);
                        }}
                        className="mt-2"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDetails.thickness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ความหนา</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="ระบุความหนา" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDetails.quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวน</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="jobDetails.shape"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รูปภาพ</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-border rounded-lg p-4">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setShapeFiles(files);
                          field.onChange(files);
                        }}
                        className="hidden"
                        id="shape-upload"
                      />
                      <label htmlFor="shape-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-6 h-6 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {shapeFiles.length > 0 ? `${shapeFiles.length} ไฟล์` : "แนบไฟล์รูป"}
                          </span>
                        </div>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label className="text-sm font-medium">สี (เลือกได้มากกว่า 1 รายการ)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {[
                  { value: "shinny_gold", label: "สีทองเงา" },
                  { value: "shinny_silver", label: "สีเงินเงา" },
                  { value: "shinny_copper", label: "สีทองแดงเงา" },
                  { value: "antique_gold", label: "สีทองรมดำ" },
                  { value: "antique_silver", label: "สีเงินรมดำ" },
                  { value: "antique_copper", label: "สีทองแดงรมดำ" },
                  { value: "misty_gold", label: "สีทองด้าน" },
                  { value: "misty_silver", label: "สีเงินด้าน" },
                  { value: "misty_copper", label: "สีทองแดงด้าน" },
                ].map((color) => (
                  <div key={color.value} className="flex items-center space-x-2">
                    <Checkbox id={color.value} />
                    <Label htmlFor={color.value} className="text-sm">{color.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobDetails.frontDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รายละเอียดด้านหน้า</FormLabel>
                    <Select>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกรายละเอียด (ได้มากกว่า 1 รายการ)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="option1">ตัวเลือก 1</SelectItem>
                        <SelectItem value="option2">ตัวเลือก 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDetails.backDetails"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รายละเอียดด้านหลัง</FormLabel>
                    <Select>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกรายละเอียด (ได้มากกว่า 1 รายการ)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="option1">ตัวเลือก 1</SelectItem>
                        <SelectItem value="option2">ตัวเลือก 2</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobDetails.lanyardSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ขนาดสายคล้อง</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกขนาดสายคล้อง" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1.5x90">1.5 × 90 ซม</SelectItem>
                        <SelectItem value="2x90">2 × 90 ซม</SelectItem>
                        <SelectItem value="2.5x90">2.5 × 90 ซม</SelectItem>
                        <SelectItem value="3x90">3 × 90 ซม</SelectItem>
                        <SelectItem value="3.5x90">3.5 × 90 ซม</SelectItem>
                        <SelectItem value="no_lanyard">ไม่รับสาย</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDetails.lanyardQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จำนวนแบบสายคล้อง</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="jobDetails.moldCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ค่าโมล เพิ่มเติม</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobDetails.notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมายเหตุ</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "Trophy":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">รายละเอียดถ้วยรางวัล</h4>

            <FormField
              control={form.control}
              name="jobDetails.model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รุ่นโมเดล</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobDetails.engraving"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ป้ายจารึก</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกป้ายจารึก" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="accept">รับ</SelectItem>
                      <SelectItem value="decline">ไม่รับ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("jobDetails.engraving") === "accept" && (
              <>
                <FormField
                  control={form.control}
                  name="jobDetails.engravingDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายละเอียดจารึก</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jobDetails.engravingFiles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>แนบไฟล์</FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-border rounded-lg p-4">
                          <Button type="button" variant="outline" className="w-full">
                            <Upload className="w-4 h-4 mr-2" />
                            อัพโหลดไฟล์ (ได้มากกว่า 1 ไฟล์)
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="jobDetails.quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>จำนวน</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobDetails.notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมายเหตุ</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "Award":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">รายละเอียดโล่</h4>

            <FormField
              control={form.control}
              name="jobDetails.model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รุ่นโมเดล</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobDetails.engraving"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ป้ายจารึก</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกป้ายจารึก" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="accept">รับ</SelectItem>
                      <SelectItem value="decline">ไม่รับ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("jobDetails.engraving") === "accept" && (
              <>
                <FormField
                  control={form.control}
                  name="jobDetails.engravingDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายละเอียดจารึก</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jobDetails.engravingFiles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>แนบไฟล์</FormLabel>
                      <FormControl>
                        <div className="border-2 border-dashed border-border rounded-lg p-4">
                          <Button type="button" variant="outline" className="w-full">
                            <Upload className="w-4 h-4 mr-2" />
                            อัพโหลดไฟล์ (ได้มากกว่า 1 ไฟล์)
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="jobDetails.quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>จำนวน</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobDetails.notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>หมายเหตุ</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      // Shirt is now handled directly in the product details card

      case "Bib":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">รายละเอียดป้ายบิบ</h4>

            <FormField
              control={form.control}
              name="jobDetails.quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>จำนวน</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobDetails.attachedFiles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ไฟล์แนบ</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-border rounded-lg p-4">
                      <Button type="button" variant="outline" className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        อัพโหลดไฟล์
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case "Keychain":
      case "Doll":
      case "Lanyard":
      case "Box packaging":
      case "Bag":
      case "Bottle":
      case "อื่นๆ":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">รายละเอียด{watchedProductType}</h4>

            {watchedProductType === "อื่นๆ" && (
              <FormField
                control={form.control}
                name="jobDetails.customType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ระบุประเภทสินค้า</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="โปรดระบุประเภทสินค้า" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="jobDetails.quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>จำนวน</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobDetails.attachedFiles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ไฟล์แนบ</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-border rounded-lg p-4">
                      <Button type="button" variant="outline" className="w-full">
                        <Upload className="w-4 h-4 mr-2" />
                        อัพโหลดไฟล์
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const saveCurrentProduct = () => {
    // For ReadyMedal with color entries, save each color as a separate product
    if (watchedProductType === "ReadyMedal" && readyMedalColorEntries.length > 0) {
      // Check if this is a zinc model that has plating color
      const isZincModel = ["โลหะซิงค์มัลติฟังค์ชั่น", "โลหะซิงค์สำเร็จรูปหมุนได้"].includes(watchedMaterial || "");
      const platingLabel = selectedPlatingColor === "สีเงา" ? "เงา" : (selectedPlatingColor === "สีรมดำ" ? "รมดำ" : "");

      const newProducts = readyMedalColorEntries.map((colorEntry, index) => {
        // Build display name with plating color for zinc models
        const displayName = isZincModel && platingLabel
          ? `เหรียญสำเร็จรูป ${watchedMaterial} ${platingLabel} ${colorEntry.color}`
          : `เหรียญสำเร็จรูป ${watchedMaterial} ${colorEntry.color}`;

        return {
          id: Date.now() + index,
          productType: watchedProductType,
          productTypeLabel: "เหรียญสำเร็จรูป",
          material: watchedMaterial,
          color: colorEntry.color,
          quantity: parseInt(colorEntry.quantity) || 0,
          displayName,
          platingColor: selectedPlatingColor,
          unitPrice: parseFloat(readyMadeUnitPrice) || 0,
          priceType: readyMadePriceType,
          details: form.getValues("jobDetails"),
        };
      });

      setSavedProducts([...savedProducts, ...newProducts]);

      // Reset all fields
      form.setValue("productType", "");
      form.setValue("material", "");
      form.setValue("jobDetails", {});
      setSelectedProductModel("");
      setSelectedPlatingColor("");
      setReadyMedalColorEntries([]);
      setNewColorEntry({ color: "", quantity: "" });
      setWantsSticker("");
      setStickerDesignDetails("");
      setReadyMadePriceType("retail");
      setReadyMadeUnitPrice("");
      return;
    }

    // Special handling for Trophy - add separate line items for each size
    if (watchedProductType === "Trophy" && trophySizes.length > 0) {
      const modelName = (() => {
        const models = [
          { id: "B112G", name: "ถ้วยรางวัลโลหะอิตาลี" },
          { id: "B113G", name: "ถ้วยรางวัลโลหะอิตาลี" },
          { id: "B114G", name: "ถ้วยรางวัลโลหะอิตาลี" },
          { id: "C201S", name: "ถ้วยคริสตัล" },
          { id: "C202S", name: "ถ้วยคริสตัล" },
        ];
        return models.find((m) => m.id === form.getValues("jobDetails.model"))?.name || "ถ้วยรางวัล";
      })();

      const newProducts = trophySizes.map((sizeEntry, index) => ({
        id: Date.now() + index,
        productType: watchedProductType,
        productTypeLabel: "ถ้วยรางวัล",
        material: watchedMaterial,
        displayName: modelName,
        sizeLabel: `ขนาด ${sizeEntry.size}`,
        size: sizeEntry.size,
        quantity: parseInt(sizeEntry.quantity) || 0,
        unitPrice: sizeEntry.price,
        priceType: "custom", // Trophies use specific size pricing
        details: form.getValues("jobDetails"),
      }));

      setSavedProducts([...savedProducts, ...newProducts]);

      // Reset all fields
      form.setValue("productType", "");
      form.setValue("material", "");
      form.setValue("jobDetails", {});
      setTrophySizes([]);
      return;
    }

    // Special handling for Shirt - add separate line items for each size with quantity
    if (watchedProductType === "Shirt") {
      const collarLabel = shirtCollar === "polo" ? "คอปก" : "คอกลม";
      const sleeveLabel = shirtSleeve === "sleeveless" ? "แขนกุด" : (shirtSleeve === "short" ? "แขนสั้น" : "แขนยาว");

      // Collect sizes with quantities
      const sizesWithQuantity = shirtSizes.filter(s => parseInt(s.quantity) > 0);

      // Include custom size if has quantity
      if (showCustomShirtSize && customShirtSize.size && parseInt(customShirtSize.quantity) > 0) {
        sizesWithQuantity.push(customShirtSize);
      }

      if (sizesWithQuantity.length === 0) {
        toast({
          title: "กรุณาระบุจำนวน",
          description: "กรุณาระบุจำนวนอย่างน้อย 1 ไซส์",
          variant: "destructive",
        });
        return;
      }

      const newProducts = sizesWithQuantity.map((sizeEntry, index) => ({
        id: Date.now() + index,
        productType: watchedProductType,
        productTypeLabel: "เสื้อ",
        material: watchedMaterial,
        displayName: `เสื้อ ${collarLabel} ${sleeveLabel}`,
        sizeLabel: `ไซส์ ${sizeEntry.size}`,
        size: sizeEntry.size,
        quantity: parseInt(sizeEntry.quantity) || 0,
        unitPrice: parseFloat(readyMadeUnitPrice) || 0,
        priceType: readyMadePriceType,
        details: {
          collar: shirtCollar,
          sleeve: shirtSleeve,
          chest: sizeEntry.chest,
          length: sizeEntry.length,
          shoulder: sizeEntry.shoulder,
          sleeveLength: sizeEntry.sleeve,
        },
      }));

      setSavedProducts([...savedProducts, ...newProducts]);

      // Reset all fields
      form.setValue("productType", "");
      form.setValue("material", "");
      form.setValue("jobDetails", {});
      setShirtCollar("");
      setShirtSleeve("");
      setShirtSizes([
        { size: "XS", chest: "36", length: "26", shoulder: "15", sleeve: "7.5", quantity: "" },
        { size: "S", chest: "38", length: "27", shoulder: "16", sleeve: "8", quantity: "" },
        { size: "M", chest: "40", length: "28", shoulder: "17", sleeve: "8", quantity: "" },
        { size: "L", chest: "42", length: "29", shoulder: "18", sleeve: "8.5", quantity: "" },
        { size: "XL", chest: "44", length: "30", shoulder: "19", sleeve: "8.5", quantity: "" },
        { size: "2XL", chest: "46", length: "31", shoulder: "20", sleeve: "9", quantity: "" },
        { size: "3XL", chest: "48", length: "32", shoulder: "21", sleeve: "9.5", quantity: "" },
        { size: "4XL", chest: "50", length: "33", shoulder: "22", sleeve: "10", quantity: "" },
        { size: "5XL", chest: "52", length: "34", shoulder: "23", sleeve: "10.5", quantity: "" },
      ]);
      setShowCustomShirtSize(false);
      setCustomShirtSize({ size: "", chest: "", length: "", shoulder: "", sleeve: "", quantity: "" });
      return;
    }

    // Default behavior for other products
    const currentProduct = {
      id: Date.now(),
      productType: watchedProductType,
      material: watchedMaterial,
      quantity: parseInt(form.getValues("jobDetails.quantity")) || 1,
      unitPrice: parseFloat(readyMadeUnitPrice) || 0,
      priceType: readyMadePriceType,
      details: form.getValues("jobDetails"),
    };
    setSavedProducts([...savedProducts, currentProduct]);

    // Reset product type and material to allow adding new product
    form.setValue("productType", "");
    form.setValue("material", "");
    form.setValue("jobDetails", {});
  };

  const removeProductItem = (id: number) => {
    setSavedProducts(savedProducts.filter(item => item.id !== id));
  };

  const handleSubmit = (data: CreateOrderFormData) => {
    const hasAnyProduct =
      Boolean(data.productType && data.productType.trim()) ||
      savedProducts.length > 0 ||
      selectedEstimations.length > 0;

    if (!hasAnyProduct) {
      form.setError("productType", {
        type: "manual",
        message: "กรุณาเลือกประเภทสินค้า",
      });
      toast({
        title: "บันทึกไม่ได้",
        description: "กรุณาเลือกประเภทสินค้า หรือเพิ่มรายการสินค้าอย่างน้อย 1 รายการ",
        variant: "destructive",
      });
      return;
    }

    // --- Build items array from every product source ---
    const allItems: any[] = [];

    // 1. savedProducts (ทั่วไป)
    savedProducts.forEach(p => {
      allItems.push({
        item_type: "custom",
        product_name: p.displayName || productValueToLabel[p.productType] || p.productType || p.label || "",
        material: p.material || null,
        size: p.size || null,
        color: p.color || null,
        quantity: parseInt(p.quantity) || 1,
        unit_price: parseFloat(p.unitPrice || p.price || 0),
        total_price: (parseInt(p.quantity) || 1) * parseFloat(p.unitPrice || p.price || 0),
        product_price_type: p.priceType || null,
        details: p.details || null,
      });
    });

    if (data.productType === "Trophy" && trophySizes.length > 0) {
      trophySizes.filter(s => s.quantity).forEach(s => {
        allItems.push({
          item_type: "readymade",
          product_name: `ถ้วยรางวัล ${data.material || ""} ขนาด ${s.size}`,
          size: s.size,
          quantity: parseInt(s.quantity) || 0,
          unit_price: s.price,
          total_price: (parseInt(s.quantity) || 0) * s.price,
          product_price_type: "custom",
          details: { height: s.height, opening: s.opening },
        });
      });
    }

    if ((data.productType === "Shirt" || data.productType === "Fabric") && shirtSizes.length > 0) {
      shirtSizes.filter(s => s.quantity).forEach(s => {
        const uPrice = parseFloat(readyMadeUnitPrice) || 0;
        allItems.push({
          item_type: "custom",
          product_name: `เสื้อ ${data.material || ""} ไซส์ ${s.size}`,
          size: s.size,
          quantity: parseInt(s.quantity) || 0,
          unit_price: uPrice,
          total_price: (parseInt(s.quantity) || 0) * uPrice,
          product_price_type: readyMadePriceType,
          details: { chest: s.chest, length: s.length, shoulder: s.shoulder, sleeve: s.sleeve },
        });
      });
    }

    if (data.productType === "ReadyMedal" && readyMedalColorEntries.length > 0) {
      readyMedalColorEntries.forEach(entry => {
        const uPrice = parseFloat(readyMadeUnitPrice) || 0;
        allItems.push({
          item_type: "readymade",
          product_name: `เหรียญสำเร็จรูป ${selectedProductModel || data.material || ""}`,
          color: entry.color,
          quantity: parseInt(entry.quantity) || 0,
          unit_price: uPrice,
          total_price: (parseInt(entry.quantity) || 0) * uPrice,
          product_price_type: readyMadePriceType,
          details: {
            model: selectedProductModel,
            plating: selectedPlatingColor,
          },
        });
      });
    }

    // 5. selectedEstimations (สินค้าจากใบประเมินราคา)
    selectedEstimations.forEach(est => {
      allItems.push({
        item_type: "estimate",
        product_name: est.productType,
        material: est.material || null,
        quantity: est.quantity,
        unit_price: est.price,
        total_price: est.price,
        details: { estimation_id: est.id, job_description: est.jobDescription },
      });
    });

    // --- Build final payload ---
    const payload = {
      ...data,
      // หมวดสินค้า
      productCategory: selectedCategory,
      // ประเภทเอกสาร
      invoiceType: data.invoiceType || (showTaxFields ? "tax-invoice" : "no-tax-invoice"),
      requireTaxInvoice: showTaxFields,
      // รายการสินค้า
      savedProducts: allItems,
      items: allItems,
      // ราคารวม
      totalPrice: orderTotalPrice,
      // ชำระเงิน
      paymentItems: paymentItems,
      payments: paymentItems,
      // ข้อมูลเชื่อมกราฟฟิก
      graphicsNotes: graphicsNotes,
      designFiles: designFiles.map(df => df.url), // ส่งแค่อาร์เรย์ของ URL
    };

    console.log("Form submitted with payload:", payload);
    onSubmit(payload);
  };

  const handleEstimatePrice = () => {
    // Auto-save before estimate
    form.handleSubmit(handleSubmit)();
    console.log("Estimating price...");
  };

  const handleOrderProduction = () => {
    // Auto-save before order production
    form.handleSubmit(handleSubmit)();
    console.log("Ordering production...");
  };
  const handleInvalid = () => {
    toast({
      title: "บันทึกไม่ได้",
      description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
      variant: "destructive",
    });

    // Focus the most common required fields first (helps when user is scrolled to bottom)
    const priorityFields: Array<keyof CreateOrderFormData> = [
      "responsiblePerson",
      "customerName",
      "customerPhone",
      "urgencyLevel",
      "jobName",
      "productType",
      "deliveryType",
    ];

    for (const f of priorityFields) {
      try {
        form.setFocus(f);
        break;
        break;
      } catch {
        // ignore
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, handleInvalid)} className="space-y-6">
        {/* Section 1: Sales Employee */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลพนักงานขาย</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="responsiblePerson"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>พนักงานที่รับผิดชอบ</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={employees.length === 0 ? "กำลังโหลดรายชื่อ..." : "เลือกพนักงาน"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.full_name}>
                          {emp.full_name}
                          {emp.nickname ? ` (${emp.nickname})` : ""}
                          {emp.position ? ` — ${emp.position}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Section 2: Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลลูกค้า</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="customerSearch"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ช่องค้นหาลูกค้า</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="ค้นหาจากเบอร์โทร ชื่อลูกค้า หรือชื่อไลน์"
                        onFocus={() => setShowCustomerDropdown(true)}
                        onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                      />
                      {showCustomerDropdown && searchResults.length > 0 && (
                        <div className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg mt-1 max-h-64 overflow-y-auto">
                          {searchResults.map((customer) => (
                            <div
                              key={customer.id}
                              className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                              onMouseDown={(e) => { e.preventDefault(); selectCustomer(customer); }}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-sm">{customer.contact_name}</span>
                                {customer.tax_id && (
                                  <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shrink-0">มีภาษี</span>
                                )}
                              </div>
                              {customer.company_name && (
                                <div className="text-xs text-muted-foreground mt-0.5">🏢 {customer.company_name}</div>
                              )}
                              <div className="flex gap-3 mt-0.5 flex-wrap">
                                {Array.isArray(customer.phone_numbers) && customer.phone_numbers[0] && (
                                  <span className="text-xs text-muted-foreground">📞 {customer.phone_numbers[0]}</span>
                                )}
                                {customer.line_id && (
                                  <span className="text-xs text-muted-foreground">💬 {customer.line_id}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ชื่อลูกค้า</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เบอร์โทร</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerLine"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ไลน์</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อีเมล</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">ประเภทเอกสาร</Label>
              <RadioGroup
                value={showTaxFields ? "tax-invoice" : "no-tax-invoice"}
                onValueChange={(value) => {
                  const isTax = value === "tax-invoice";
                  setShowTaxFields(isTax);
                  form.setValue("requireTaxInvoice", isTax);
                  form.setValue("invoiceType", value);
                }}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="no-tax-invoice" id="no-tax-invoice" />
                  <Label htmlFor="no-tax-invoice" className="cursor-pointer font-normal">
                    ไม่ออกใบกำกับภาษี / บิลเงินสด
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="tax-invoice" id="tax-invoice" />
                  <Label htmlFor="tax-invoice" className="cursor-pointer font-normal">
                    ออกใบกำกับภาษี
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {showTaxFields && (
              <div className="space-y-4 p-4 border border-border rounded-lg">
                <h4 className="font-medium">ข้อมูลผู้เสียภาษี</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="taxPayerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อผู้เสียภาษี</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เลขประจำตัวผู้เสียภาษี</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="taxAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ที่อยู่ผู้เสียภาษี</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>


        {/* Section 3: Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>การชำระเงิน</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มรายการชำระเงิน
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Payment Form */}
            {showPaymentForm && (
              <div className="border rounded-lg p-4 mb-4 bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">ประเภทการชำระเงิน</label>
                    <Select
                      value={newPayment.type}
                      onValueChange={(value) => setNewPayment({ ...newPayment, type: value, additionalDetails: '' })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="เลือกประเภทการชำระเงิน" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="deposit">มัดจำ</SelectItem>
                        <SelectItem value="full">ชำระเต็มจำนวน</SelectItem>
                        <SelectItem value="remaining_balance">ชำระยอดส่วนที่เหลือ</SelectItem>
                        <SelectItem value="design_fee">ค่าบริการออกแบบ</SelectItem>
                        <SelectItem value="additional">ชำระเพิ่มเติม</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">แนบสลิปการชำระเงิน</label>
                    <div className="border-2 border-dashed border-border rounded-lg p-3">
                      <label className="cursor-pointer flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">
                          {newPayment.slipFile ? newPayment.slipFile.name : 'อัพโหลดสลิป (รูปภาพ/PDF)'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // แจ้งเตือนผู้ใช้ว่ากำลังอัพโหลดและเตรียมตรวจด้วย SlipOK
                              toast({ title: "กำลังอัพโหลดสลิป...", description: "กรุณารอสักครู่ ระบบกำลังนำข้อมูลไปตรวจสอบ" });
                              const url = await uploadFile(file, 'slip');
                              
                              if (url) {
                                let verifiedAmount = newPayment.amount;
                                let verifiedDate = newPayment.transferDate;
                                let verifiedDetails = newPayment.additionalDetails;

                                try {
                                  // เริ่มกระบวนการตรวจสอบ SlipOK
                                  toast({ title: "กำลังตรวจสอบสลิป...", description: "ระบบอ่านข้อมูลจากตรายาง SlipOK" });
                                  
                                  const formData = new FormData();
                                  formData.append('files', file);

                                  // ดึง Branch ID และ API Key จาก .env (ต้องเพิ่ม VITE_SLIPOK_BRANCH_ID / VITE_SLIPOK_API_KEY)
                                  const slipOkBranchId = import.meta.env.VITE_SLIPOK_BRANCH_ID;
                                  const slipOkApiKey = import.meta.env.VITE_SLIPOK_API_KEY;

                                  if (slipOkBranchId && slipOkApiKey) {
                                    // เลี่ยง CORS Block ในฝั่ง Browser โดยเรียกผ่าน Proxy 
                                    // (อ้างอิงจาก vite.config.ts หรือ Backend API)
                                    const slipOkRes = await fetch(`/slipok-proxy/${slipOkBranchId}`, {
                                      method: 'POST',
                                      headers: {
                                        'x-authorization': slipOkApiKey
                                      },
                                      body: formData
                                    });

                                    const slipOkData = await slipOkRes.json();
                                    if (slipOkData.success) {
                                      const { amount, transTimestamp, transDate, transTime, receiver } = slipOkData.data;
                                      
                                      verifiedAmount = amount.toString();
                                      // ใช้ transTimestamp สำหรับวันที่ที่ถูกต้อง (เช่น 2026-04-05T04:10:27.000Z)
                                      const dateObj = transTimestamp ? new Date(transTimestamp) : new Date();
                                      if (isValid(dateObj)) verifiedDate = dateObj;
                                      
                                      if (receiver) {
                                        // account ซ้อนอยู่ข้างใน object receiver.account
                                        const recAccount = receiver.account?.value || "";
                                        verifiedDetails = `โอนเข้าระบบ: ${receiver.displayName} ${recAccount ? `(${recAccount})` : ''}`;
                                      }
                                      
                                      toast({ 
                                        title: "ตรวจสอบสลิปถูกต้อง ✅", 
                                        description: `ยอดเงิน ${amount} บาท โอนเมื่อ ${isValid(dateObj) ? format(dateObj, 'dd/MM/yyyy HH:mm') : `${transDate} ${transTime}`}` 
                                      });
                                    } else {
                                      toast({ 
                                        title: "ตรวจสอบสลิปไม่ผ่าน ❌", 
                                        description: slipOkData.message || "กรุณาตรวจสอบสลิปอีกครั้ง", 
                                        variant: "destructive" 
                                      });
                                    }
                                  } else {
                                    console.warn("SlipOK credentials not found. Please add VITE_SLIPOK_BRANCH_ID and VITE_SLIPOK_API_KEY in .env");
                                    // หากไม่มี ENV จะข้ามไปแต่ยังคงเซฟสลิปให้
                                    toast({ title: "อัพโหลดสำเร็จ", description: "แนบสลิปเรียบร้อยแล้ว แต่อาจไม่ได้เช็คผ่าน SlipOK" });
                                  }
                                } catch (error) {
                                  console.error("SlipOK error:", error);
                                  toast({ title: "ระบบขัดข้อง", description: "เกิดข้อผิดพลาดในการตรวจสอบสลิปด้วย SlipOK", variant: "destructive" });
                                }

                                // นำข้อมูลมาอัปเดตใส่ State (ถ้าตรวจผ่านจะดึงจำนวนเงิน/วันที่ให้อัตโนมัติ)
                                setNewPayment({
                                  ...newPayment,
                                  slipFile: file,
                                  slipPreview: URL.createObjectURL(file),
                                  slipUrl: url,
                                  amount: verifiedAmount,
                                  transferDate: verifiedDate,
                                  additionalDetails: verifiedDetails
                                });
                              }
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Bank Selection */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">ธนาคารที่รับโอน</label>
                  <Select
                    value={newPayment.receivingBank}
                    onValueChange={(value) => setNewPayment({ ...newPayment, receivingBank: value })}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="เลือกธนาคารที่รับโอน" />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {bankOptions.map((bank) => (
                        <SelectItem key={bank.value} value={bank.value}>
                          {bank.label} ({bank.account})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newPayment.receivingBank && (
                    <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <p className="text-sm font-medium text-primary">
                        {bankOptions.find(b => b.value === newPayment.receivingBank)?.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        เลขบัญชี: {bankOptions.find(b => b.value === newPayment.receivingBank)?.account}
                      </p>
                    </div>
                  )}
                </div>

                {/* Additional details for "ชำระเพิ่มเติม" */}
                {newPayment.type === 'additional' && (
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">รายละเอียดการชำระเพิ่มเติม</label>
                    <Textarea
                      value={newPayment.additionalDetails}
                      onChange={(e) => setNewPayment({ ...newPayment, additionalDetails: e.target.value })}
                      placeholder="เช่น ชำระเพิ่มจากงานแก้ไข / ค่าจัดส่ง / ค่าเพิ่มอื่น ๆ"
                      rows={2}
                    />
                  </div>
                )}

                {/* Credit term days */}
                {newPayment.type === 'credit_term' && (
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">ระยะเวลาเครดิตเทอม (วัน)</label>
                    <Select
                      value={newPayment.additionalDetails}
                      onValueChange={(value) => setNewPayment({ ...newPayment, additionalDetails: value })}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="เลือกจำนวนวัน" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        <SelectItem value="15">15 วัน</SelectItem>
                        <SelectItem value="30">30 วัน</SelectItem>
                        <SelectItem value="45">45 วัน</SelectItem>
                        <SelectItem value="60">60 วัน</SelectItem>
                        <SelectItem value="90">90 วัน</SelectItem>
                        <SelectItem value="120">120 วัน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">จำนวนเงิน (บาท)</label>
                    <Input
                      type="number"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      placeholder="0.00"
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">วันที่โอน</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-muted text-muted-foreground",
                            !newPayment.transferDate && "text-muted-foreground"
                          )}
                        >
                          {newPayment.transferDate ? (
                            format(newPayment.transferDate, "PPP", { locale: th })
                          ) : (
                            <span>เลือกวันที่</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newPayment.transferDate}
                          onSelect={(date) => setNewPayment({ ...newPayment, transferDate: date })}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                  ข้อมูลจำนวนเงินและวันที่โอน ระบบอ่านจากสลิปอัตโนมัติ
                </p>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPaymentForm(false);
                      setNewPayment({ type: '', amount: '', transferDate: undefined, slipFile: null, slipPreview: '', slipUrl: '', additionalDetails: '', receivingBank: '' });
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      try {
                        if (!newPayment.type) {
                          toast({
                            title: "ยังไม่ได้เลือกประเภทการชำระเงิน",
                            description: "กรุณาเลือกประเภทการชำระเงินก่อนบันทึก",
                            variant: "destructive",
                          });
                          return;
                        }

                        if (!newPayment.slipFile) {
                          toast({
                            title: "ยังไม่ได้แนบสลิปการชำระเงิน",
                            description: "กรุณาแนบสลิป (รูปภาพหรือ PDF) ก่อนบันทึก",
                            variant: "destructive",
                          });
                          return;
                        }

                        const normalizedAmount = newPayment.amount?.trim() ? parseFloat(newPayment.amount) : 0;
                        const normalizedTransferDate = newPayment.transferDate ?? new Date();

                        setPaymentItems((prev) => [
                          ...prev,
                          {
                            id: Date.now().toString(),
                            type: newPayment.type,
                            typeLabel: getPaymentTypeLabel(newPayment.type),
                            amount: Number.isFinite(normalizedAmount) ? normalizedAmount : 0,
                            transferDate: normalizedTransferDate,
                            slipFile: newPayment.slipFile,
                            slipPreview: newPayment.slipPreview,
                            slipUrl: newPayment.slipUrl,
                            additionalDetails: newPayment.additionalDetails,
                            receivingBank: newPayment.receivingBank,
                          },
                        ]);

                        setNewPayment({ type: '', amount: '', transferDate: undefined, slipFile: null, slipPreview: '', slipUrl: '', additionalDetails: '', receivingBank: '' });
                        setShowPaymentForm(false);

                        toast({
                          title: "บันทึกรายการชำระเงินแล้ว",
                          description: "เพิ่มรายการลงในลิสต์เรียบร้อย",
                        });

                        // Debug for cases where users report click not working
                        console.log("[payment] saved", {
                          type: newPayment.type,
                          amount: normalizedAmount,
                          transferDate: normalizedTransferDate,
                          slipName: newPayment.slipFile?.name,
                        });
                      } catch (err) {
                        console.error("[payment] save error", err);
                        toast({
                          title: "บันทึกรายการไม่สำเร็จ",
                          description: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    บันทึกรายการ
                  </Button>
                </div>
              </div>
            )}

            {/* Payment Items List */}
            {paymentItems.length > 0 && (
              <div className="space-y-2">
                {paymentItems.map((item, index) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{item.typeLabel}</span>
                        {item.receivingBank && (
                          <span className="text-xs text-muted-foreground">
                            {bankOptions.find(b => b.value === item.receivingBank)?.label ?? item.receivingBank}
                          </span>
                        )}
                        {item.additionalDetails && (
                          <span className="text-xs text-muted-foreground">{item.additionalDetails}</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        ฿{item.amount.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {item.transferDate ? format(item.transferDate, "dd/MM/yyyy") : '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.slipPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(item.slipPreview, '_blank')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPaymentItems((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {paymentItems.length === 0 && !showPaymentForm && (
              <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                ยังไม่มีรายการชำระเงิน
              </p>
            )}
          </CardContent>
        </Card>

        {/* Section: ข้อมูลเชื่อมกราฟฟิก */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลเชื่อมกราฟฟิก</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">หมายเหตุ / คำสั่งสำหรับฝ่ายกราฟฟิก</Label>
              <Textarea
                value={graphicsNotes}
                onChange={(e) => setGraphicsNotes(e.target.value)}
                placeholder="ระบุรายละเอียดงานกราฟฟิก เช่น สี, ขนาด, ตำแหน่งโลโก้, รูปแบบที่ต้องการ, จำนวน Proof ที่ต้องขอ"
                className="mt-2 min-h-[100px]"
              />
            </div>

            {/* แนบไฟล์แบบ */}
            <div>
              <Label className="text-sm font-medium">แนบไฟล์แบบ (Design Files)</Label>
              <div className="mt-2 border-2 border-dashed border-border rounded-lg p-4">
                <label className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm text-center">
                    {isUploading ? "กำลังอัปโหลดไฟล์..." : "คลิกเพื่ออัปโหลดไฟล์แบบ (AI, PSD, PDF, รูปภาพ)"}
                  </span>
                  <span className="text-xs text-muted-foreground">รองรับหลายไฟล์</span>
                  <input
                    type="file"
                    accept=".ai,.psd,.pdf,.eps,.png,.jpg,.jpeg,.svg,.cdr"
                    multiple
                    className="hidden"
                    disabled={isUploading}
                    onChange={async (e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) {
                        const uploads = await Promise.all(
                          files.map(async (file) => {
                            const url = await uploadFile(file, 'design');
                            return url ? { file, url, name: file.name, size: file.size } : null;
                          })
                        );
                        
                        const successfulUploads = uploads.filter((u): u is { file: File; url: string; name: string; size: number } => u !== null);
                        
                        setDesignFiles(prev => [...prev, ...successfulUploads]);
                        toast({
                          title: `อัปโหลด ${successfulUploads.length} ไฟล์สำเร็จแล้ว`,
                          description: successfulUploads.map(f => f.name).join(", "),
                        });
                      }
                    }}
                  />
                </label>
              </div>

              {designFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label className="text-xs text-muted-foreground">ไฟล์ที่แนบ ({designFiles.length} ไฟล์)</Label>
                  {designFiles.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate max-w-xs">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(item.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(item.url, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDesignFiles(prev => prev.filter((_, i) => i !== index))}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Order Information */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลการสั่งงาน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="jobId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>JOB ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="JB-YYYYMMXXX" readOnly className="bg-muted cursor-not-allowed" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quotationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เลขที่ใบเสนอราคา</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="QT-XXXX-XXX" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <Label className="text-sm font-medium">แนบไฟล์ใบเสนอราคา</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="flex-1"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadFile(file, 'quotation');
                      if (url) {
                        form.setValue("quotationUrl", url);
                        toast({
                          title: "อัปโหลดใบเสนอราคาสำเร็จ",
                          description: file.name
                        });
                      }
                    }
                  }}
                />
              </div>
              {form.watch("quotationUrl") && (
                <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  <span>อัปโหลดเรียบร้อยแล้ว: {form.watch("quotationUrl")?.split('/').pop()}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">รองรับไฟล์ PDF, JPG, PNG</p>
            </div>

            <FormField
              control={form.control}
              name="urgencyLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ความเร่งด่วน</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกความเร่งด่วน" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="emergency">เร่งด่วน 3-5 ชั่วโมง</SelectItem>
                      <SelectItem value="urgent_1day">ด่วน 1 วัน</SelectItem>
                      <SelectItem value="urgent_2days">ด่วน 2 วัน</SelectItem>
                      <SelectItem value="normal">ปกติ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jobName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่องาน</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventLocation"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>สถานที่จัดงาน (จังหวัด)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? thaiProvinces.find((p) => p === field.value) || field.value
                            : "เลือกจังหวัด"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="ค้นหาจังหวัด..." />
                        <CommandList>
                          <CommandEmpty>ไม่พบข้อมูลจังหวัด</CommandEmpty>
                          <CommandGroup>
                            {thaiProvinces.map((province) => (
                              <CommandItem
                                key={province}
                                value={province}
                                onSelect={() => {
                                  form.setValue("eventLocation", province);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    province === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {province}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="usageDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>วันที่ใช้งาน</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: th })
                            ) : (
                              <span>เลือกวันที่</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>วันที่จัดส่ง</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: th })
                            ) : (
                              <span>เลือกวันที่</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>งบประมาณ (ถ้าลูกค้ามีงบที่ต้องการ)</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" placeholder="ระบุงบประมาณ" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Product Details Section */}
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดสินค้า</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category-first Product Selection */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">หมวดสินค้า</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {productCategories.map((category) => (
                    <Button
                      key={category.id}
                      type="button"
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      className={cn(
                        "h-auto py-3 px-4 flex flex-col items-center gap-1 transition-all",
                        selectedCategory === category.id && "ring-2 ring-primary ring-offset-2"
                      )}
                      onClick={() => {
                        setSelectedCategory(category.id);
                        form.setValue("productType", "");
                        form.setValue("material", "");
                        setSelectedPriceEstimationId(null);
                      }}
                    >
                      <span className="text-xl">{category.icon}</span>
                      <span className="text-xs font-medium text-center">{category.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Categories that need estimation: custom, items, lanyard, premium */}
              {selectedCategory && ["custom", "items", "lanyard", "premium"].includes(selectedCategory) && (
                <div className="space-y-3">
                  {/* Check if customer has any estimations for this category */}
                  {(() => {
                    const categoryProducts = productsByCategory[selectedCategory] || [];
                    const categoryProductLabels = categoryProducts.map(p => productValueToLabel[p.value] || p.label);
                    const hasEstimationsForCategory = getFilteredEstimations().some(est =>
                      categoryProductLabels.includes(est.productType)
                    );

                    if (!hasEstimationsForCategory) {
                      return (
                        <div className="text-center py-6 border border-dashed border-border rounded-lg bg-muted/20">
                          <p className="text-sm text-muted-foreground mb-3">
                            ไม่มีสินค้าในรายการประเมินราคา
                          </p>
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={() => navigate(`/sales/price-estimation/add?customer=${encodeURIComponent(watchedCustomerName || "")}`)}
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            ไปหน้าประเมินราคา
                          </Button>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              )}

              {/* Categories that show product selection: readymade, textile */}
              {selectedCategory && ["readymade", "textile"].includes(selectedCategory) && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium block">เลือกสินค้า</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {productsByCategory[selectedCategory]?.map((product) => (
                      <Button
                        key={product.value}
                        type="button"
                        variant={watchedProductType === product.value ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "h-auto py-2 px-3 text-xs",
                          watchedProductType === product.value && "ring-2 ring-primary ring-offset-1"
                        )}
                        onClick={() => {
                          form.setValue("productType", product.value);
                          form.setValue("material", "");
                          setSelectedPriceEstimationId(null);
                        }}
                      >
                        {product.label}
                        {product.flow === "catalog" && (
                          <span className="ml-1 text-[10px] text-muted-foreground">(สต็อก)</span>
                        )}
                      </Button>
                    ))}
                  </div>

                  {watchedProductType && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
                      <span className="text-muted-foreground">Flow:</span>
                      <span className="font-medium">
                        {getProductFlow(watchedProductType) === "catalog"
                          ? "📦 Catalog / สต็อก"
                          : "🔧 ตีราคา / แนบไฟล์"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Material/Product Model field for readymade and textile categories */}
              {watchedProductType && selectedCategory && ["readymade", "textile"].includes(selectedCategory) && (
                <>
                  {/* For ReadyMedal: รุ่นสินค้า */}
                  {watchedProductType === "ReadyMedal" ? (
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="material"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>รุ่นสินค้า</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedProductModel(value);
                                // Reset plating and color entries when model changes
                                setSelectedPlatingColor("");
                                setReadyMedalColorEntries([]);
                                setNewColorEntry({ color: "", quantity: "" });
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-background">
                                  <SelectValue placeholder="เลือกรุ่นสินค้า" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background">
                                {getMaterialOptions(watchedProductType).map((model) => (
                                  <SelectItem key={model} value={model}>
                                    {model}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Plating color for โลหะซิงค์ models */}
                      {selectedProductModel && ["โลหะซิงค์มัลติฟังค์ชั่น", "โลหะซิงค์สำเร็จรูปหมุนได้"].includes(selectedProductModel) && (
                        <div>
                          <Label className="text-sm font-medium">สีชุบ</Label>
                          <Select
                            value={selectedPlatingColor}
                            onValueChange={(value) => {
                              setSelectedPlatingColor(value);
                              setReadyMedalColorEntries([]); // Reset color entries when plating changes
                              setNewColorEntry({ color: "", quantity: "" });
                            }}
                          >
                            <SelectTrigger className="bg-background mt-2">
                              <SelectValue placeholder="เลือกสีชุบ" />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                              <SelectItem value="สีเงา">สีเงา</SelectItem>
                              <SelectItem value="สีรมดำ">สีรมดำ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Color selection - show after model (non-zinc) or after plating (zinc) */}
                      {selectedProductModel && (
                        <>
                          {/* For non-zinc models: show color directly after model */}
                          {["พลาสติก รู้แพ้รู้ชนะ", "พลาสติกข้าวสาร", "พลาสติกรวงข้าว", "อะลูมิเนียม"].includes(selectedProductModel) && (
                            <>
                              {/* Added color entries list */}
                              {readyMedalColorEntries.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">สีที่เลือกแล้ว</Label>
                                  <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
                                    {readyMedalColorEntries.map((entry, index) => (
                                      <div key={index} className="flex items-center justify-between bg-background p-2 rounded-md">
                                        <div className="flex items-center gap-4">
                                          <span className="font-medium">{entry.color}</span>
                                          <span className="text-muted-foreground">จำนวน: {entry.quantity}</span>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeColorEntry(index)}
                                        >
                                          <X className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Add new color entry */}
                              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                                <div>
                                  <Label className="text-sm font-medium">สี</Label>
                                  <Select
                                    value={newColorEntry.color}
                                    onValueChange={(value) => setNewColorEntry(prev => ({ ...prev, color: value }))}
                                  >
                                    <SelectTrigger className="bg-background mt-2">
                                      <SelectValue placeholder="เลือกสี" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background">
                                      <SelectItem value="สีทอง">สีทอง</SelectItem>
                                      <SelectItem value="สีเงิน">สีเงิน</SelectItem>
                                      <SelectItem value="สีทองแดง">สีทองแดง</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">จำนวน</Label>
                                  <Input
                                    type="number"
                                    value={newColorEntry.quantity}
                                    onChange={(e) => setNewColorEntry(prev => ({ ...prev, quantity: e.target.value }))}
                                    placeholder="ระบุจำนวน"
                                    className="mt-2"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={addColorEntry}
                                  disabled={!newColorEntry.color || !newColorEntry.quantity}
                                  className="mb-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Job order details textarea */}
                              <div>
                                <Label className="text-sm font-medium">รายละเอียดในการสั่งงาน</Label>
                                <Textarea
                                  value={form.watch("jobDetails.notes") || ""}
                                  onChange={(e) => form.setValue("jobDetails.notes", e.target.value)}
                                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                                  className="mt-2 min-h-[80px]"
                                />
                              </div>

                              {/* File attachment for job details */}
                              <div>
                                <Label className="text-sm font-medium">แนบไฟล์</Label>
                                <div className="mt-2 flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById('readymade-job-file-upload')?.click()}
                                    className="flex items-center gap-2"
                                  >
                                    <Upload className="h-4 w-4" />
                                    เลือกไฟล์
                                  </Button>
                                  <input
                                    id="readymade-job-file-upload"
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files) {
                                        setStickerFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                      }
                                    }}
                                  />
                                </div>
                                {stickerFiles.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {stickerFiles.map((file, index) => (
                                      <div key={index} className="flex items-center justify-between bg-background p-2 rounded-md text-sm">
                                        <span className="truncate flex-1">{file.name}</span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setStickerFiles(prev => prev.filter((_, i) => i !== index))}
                                        >
                                          <X className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Sticker option */}
                              {readyMedalColorEntries.length > 0 && (
                                <div className="space-y-4">
                                  <div>
                                    <Label className="text-sm font-medium">สติ๊กเกอร์</Label>
                                    <RadioGroup
                                      value={wantsSticker}
                                      onValueChange={setWantsSticker}
                                      className="flex gap-4 mt-2"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="receive" id="sticker-receive" />
                                        <Label htmlFor="sticker-receive" className="font-normal cursor-pointer">รับสติ๊กเกอร์</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="no-receive" id="sticker-no-receive" />
                                        <Label htmlFor="sticker-no-receive" className="font-normal cursor-pointer">ไม่รับสติ๊กเกอร์</Label>
                                      </div>
                                    </RadioGroup>
                                  </div>

                                  {/* Design details box - show when sticker is selected */}
                                  {wantsSticker === "receive" && (
                                    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium">รายละเอียดการออกแบบ</Label>
                                        <Textarea
                                          value={stickerDesignDetails}
                                          onChange={(e) => setStickerDesignDetails(e.target.value)}
                                          placeholder="ระบุรายละเอียดการออกแบบสติ๊กเกอร์..."
                                          className="mt-2 min-h-[100px]"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">แนบไฟล์</Label>
                                        <div className="mt-2 flex items-center gap-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => document.getElementById('sticker-file-upload')?.click()}
                                            className="flex items-center gap-2"
                                          >
                                            <Upload className="h-4 w-4" />
                                            เลือกไฟล์
                                          </Button>
                                          <input
                                            id="sticker-file-upload"
                                            type="file"
                                            multiple
                                            accept="image/*,.pdf,.doc,.docx"
                                            className="hidden"
                                            onChange={(e) => {
                                              if (e.target.files) {
                                                setStickerFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                              }
                                            }}
                                          />
                                        </div>
                                        {stickerFiles.length > 0 && (
                                          <div className="mt-2 space-y-1">
                                            {stickerFiles.map((file, index) => (
                                              <div key={index} className="flex items-center justify-between bg-background p-2 rounded-md text-sm">
                                                <span className="truncate flex-1">{file.name}</span>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => setStickerFiles(prev => prev.filter((_, i) => i !== index))}
                                                >
                                                  <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}

                          {/* For zinc models: show color after plating is selected */}
                          {["โลหะซิงค์มัลติฟังค์ชั่น", "โลหะซิงค์สำเร็จรูปหมุนได้"].includes(selectedProductModel) && selectedPlatingColor && (
                            <>
                              {/* Added color entries list */}
                              {readyMedalColorEntries.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">สีที่เลือกแล้ว</Label>
                                  <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
                                    {readyMedalColorEntries.map((entry, index) => (
                                      <div key={index} className="flex items-center justify-between bg-background p-2 rounded-md">
                                        <div className="flex items-center gap-4">
                                          <span className="font-medium">{entry.color}</span>
                                          <span className="text-muted-foreground">จำนวน: {entry.quantity}</span>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeColorEntry(index)}
                                        >
                                          <X className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Add new color entry */}
                              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                                <div>
                                  <Label className="text-sm font-medium">สี</Label>
                                  <Select
                                    value={newColorEntry.color}
                                    onValueChange={(value) => setNewColorEntry(prev => ({ ...prev, color: value }))}
                                  >
                                    <SelectTrigger className="bg-background mt-2">
                                      <SelectValue placeholder="เลือกสี" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background">
                                      <SelectItem value="สีทอง">สีทอง</SelectItem>
                                      <SelectItem value="สีเงิน">สีเงิน</SelectItem>
                                      <SelectItem value="สีทองแดง">สีทองแดง</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">จำนวน</Label>
                                  <Input
                                    type="number"
                                    value={newColorEntry.quantity}
                                    onChange={(e) => setNewColorEntry(prev => ({ ...prev, quantity: e.target.value }))}
                                    placeholder="ระบุจำนวน"
                                    className="mt-2"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={addColorEntry}
                                  disabled={!newColorEntry.color || !newColorEntry.quantity}
                                  className="mb-0"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Job order details textarea */}
                              <div>
                                <Label className="text-sm font-medium">รายละเอียดในการสั่งงาน</Label>
                                <Textarea
                                  value={form.watch("jobDetails.notes") || ""}
                                  onChange={(e) => form.setValue("jobDetails.notes", e.target.value)}
                                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                                  className="mt-2 min-h-[80px]"
                                />
                              </div>

                              {/* File attachment for job details */}
                              <div>
                                <Label className="text-sm font-medium">แนบไฟล์</Label>
                                <div className="mt-2 flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById('readymade-zinc-job-file-upload')?.click()}
                                    className="flex items-center gap-2"
                                  >
                                    <Upload className="h-4 w-4" />
                                    เลือกไฟล์
                                  </Button>
                                  <input
                                    id="readymade-zinc-job-file-upload"
                                    type="file"
                                    multiple
                                    accept="image/*,.pdf,.doc,.docx"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files) {
                                        setStickerFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                      }
                                    }}
                                  />
                                </div>
                                {stickerFiles.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {stickerFiles.map((file, index) => (
                                      <div key={index} className="flex items-center justify-between bg-background p-2 rounded-md text-sm">
                                        <span className="truncate flex-1">{file.name}</span>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => setStickerFiles(prev => prev.filter((_, i) => i !== index))}
                                        >
                                          <X className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Sticker option */}
                              {readyMedalColorEntries.length > 0 && (
                                <div className="space-y-4">
                                  <div>
                                    <Label className="text-sm font-medium">สติ๊กเกอร์</Label>
                                    <RadioGroup
                                      value={wantsSticker}
                                      onValueChange={setWantsSticker}
                                      className="flex gap-4 mt-2"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="receive" id="sticker-receive-zinc" />
                                        <Label htmlFor="sticker-receive-zinc" className="font-normal cursor-pointer">รับสติ๊กเกอร์</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="no-receive" id="sticker-no-receive-zinc" />
                                        <Label htmlFor="sticker-no-receive-zinc" className="font-normal cursor-pointer">ไม่รับสติ๊กเกอร์</Label>
                                      </div>
                                    </RadioGroup>
                                  </div>

                                  {/* Design details box - show when sticker is selected */}
                                  {wantsSticker === "receive" && (
                                    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                                      <div>
                                        <Label className="text-sm font-medium">รายละเอียดการออกแบบ</Label>
                                        <Textarea
                                          value={stickerDesignDetails}
                                          onChange={(e) => setStickerDesignDetails(e.target.value)}
                                          placeholder="ระบุรายละเอียดการออกแบบสติ๊กเกอร์..."
                                          className="mt-2 min-h-[100px]"
                                        />
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium">แนบไฟล์</Label>
                                        <div className="mt-2 flex items-center gap-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => document.getElementById('sticker-file-upload-zinc')?.click()}
                                            className="flex items-center gap-2"
                                          >
                                            <Upload className="h-4 w-4" />
                                            เลือกไฟล์
                                          </Button>
                                          <input
                                            id="sticker-file-upload-zinc"
                                            type="file"
                                            multiple
                                            accept="image/*,.pdf,.doc,.docx"
                                            className="hidden"
                                            onChange={(e) => {
                                              if (e.target.files) {
                                                setStickerFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                                              }
                                            }}
                                          />
                                        </div>
                                        {stickerFiles.length > 0 && (
                                          <div className="mt-2 space-y-1">
                                            {stickerFiles.map((file, index) => (
                                              <div key={index} className="flex items-center justify-between bg-background p-2 rounded-md text-sm">
                                                <span className="truncate flex-1">{file.name}</span>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => setStickerFiles(prev => prev.filter((_, i) => i !== index))}
                                                >
                                                  <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                      {/* Pricing Selection for ReadyMedal */}
                      {getProductFlow(watchedProductType) === "catalog"}
                    </div>
                  ) : watchedProductType === "Trophy" ? (
                    /* For Trophy: วัสดุ + รายละเอียดถ้วยรางวัล in same box */
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="material"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>วัสดุ</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background">
                                  <SelectValue placeholder="เลือกวัสดุ" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background">
                                {getMaterialOptions(watchedProductType).map((material) => (
                                  <SelectItem key={material} value={material}>
                                    {material}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Pricing Selection for Trophy */}
                      {getProductFlow(watchedProductType) === "catalog"}

                      {/* รายละเอียดถ้วยรางวัล - in same box as product details */}
                      {watchedMaterial && (
                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="font-semibold text-lg">รายละเอียดถ้วยรางวัล</h4>

                          {/* รุ่นโมเดล - Searchable Dropdown */}
                          <FormField
                            control={form.control}
                            name="jobDetails.model"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>รุ่นโมเดล</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className={cn(
                                          "w-full justify-between bg-background",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value
                                          ? (() => {
                                            const models = [
                                              { id: "B112G", name: "ถ้วยโลหะอิตาลี รุ่น B112 G" },
                                              { id: "B113G", name: "ถ้วยโลหะอิตาลี รุ่น B113 G" },
                                              { id: "B114G", name: "ถ้วยโลหะอิตาลี รุ่น B114 G" },
                                              { id: "C201S", name: "ถ้วยคริสตัล รุ่น C201 S" },
                                              { id: "C202S", name: "ถ้วยคริสตัล รุ่น C202 S" },
                                            ];
                                            return models.find((m) => m.id === field.value)?.name || field.value;
                                          })()
                                          : "เลือกรุ่นโมเดล"}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-full p-0 bg-background" align="start">
                                    <Command>
                                      <CommandInput placeholder="ค้นหารุ่นโมเดล..." />
                                      <CommandList>
                                        <CommandEmpty>ไม่พบรุ่นที่ค้นหา</CommandEmpty>
                                        <CommandGroup>
                                          {[
                                            { id: "B112G", name: "ถ้วยโลหะอิตาลี รุ่น B112 G" },
                                            { id: "B113G", name: "ถ้วยโลหะอิตาลี รุ่น B113 G" },
                                            { id: "B114G", name: "ถ้วยโลหะอิตาลี รุ่น B114 G" },
                                            { id: "C201S", name: "ถ้วยคริสตัล รุ่น C201 S" },
                                            { id: "C202S", name: "ถ้วยคริสตัล รุ่น C202 S" },
                                          ].map((model) => (
                                            <CommandItem
                                              value={model.name}
                                              key={model.id}
                                              onSelect={() => {
                                                form.setValue("jobDetails.model", model.id);
                                                setTrophySizes([]);
                                              }}
                                            >
                                              <Check
                                                className={cn(
                                                  "mr-2 h-4 w-4",
                                                  model.id === field.value ? "opacity-100" : "opacity-0"
                                                )}
                                              />
                                              {model.name}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* ขนาดถ้วย - Size selection table with image */}
                          {form.watch("jobDetails.model") && (
                            <div className="space-y-3">
                              <Label className="text-sm font-medium">เลือกขนาดและจำนวน</Label>
                              <div className="flex gap-4 items-stretch">
                                {/* Product Image - match table height */}
                                <div className="flex-shrink-0 flex">
                                  <div className="border rounded-lg p-3 bg-muted/30 flex items-center justify-center">
                                    <img
                                      src={trophyB112GImage}
                                      alt="ถ้วยโลหะอิตาลี"
                                      className="h-full w-auto max-h-48 object-contain"
                                    />
                                  </div>
                                </div>

                                {/* Size Table */}
                                <div className="flex-1 border rounded-lg overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                      <tr>
                                        <th className="px-3 py-2 text-left font-medium">ขนาด</th>
                                        <th className="px-3 py-2 text-center font-medium">สูง (ซม.)</th>
                                        <th className="px-3 py-2 text-center font-medium">ปาก (ซม.)</th>
                                        <th className="px-3 py-2 text-center font-medium">ราคา (บาท)</th>
                                        <th className="px-3 py-2 text-center font-medium">จำนวน</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {[
                                        { size: "A", height: 33, opening: 14, price: 420 },
                                        { size: "B", height: 28, opening: 12, price: 370 },
                                        { size: "C", height: 22, opening: 10, price: 320 },
                                      ].map((sizeOption) => {
                                        const currentSize = trophySizes.find((s) => s.size === sizeOption.size);
                                        const quantity = currentSize?.quantity || "";

                                        return (
                                          <tr key={sizeOption.size} className="border-t border-border">
                                            <td className="px-3 py-3 font-medium">{sizeOption.size}</td>
                                            <td className="px-3 py-3 text-center">{sizeOption.height}</td>
                                            <td className="px-3 py-3 text-center">{sizeOption.opening}</td>
                                            <td className="px-3 py-3 text-center">{sizeOption.price.toLocaleString()}</td>
                                            <td className="px-3 py-3 text-center">
                                              <Input
                                                type="number"
                                                min="0"
                                                placeholder="ระบุ"
                                                className="w-20 mx-auto text-center"
                                                value={quantity}
                                                onChange={(e) => {
                                                  const newQuantity = e.target.value;
                                                  const otherSizes = trophySizes.filter((s) => s.size !== sizeOption.size);

                                                  if (newQuantity && parseInt(newQuantity) > 0) {
                                                    setTrophySizes([
                                                      ...otherSizes,
                                                      { size: sizeOption.size, height: sizeOption.height, opening: sizeOption.opening, price: sizeOption.price, quantity: newQuantity }
                                                    ]);
                                                  } else {
                                                    setTrophySizes(otherSizes);
                                                  }
                                                }}
                                              />
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                              {trophySizes.length > 0 && (
                                <div className="text-sm text-muted-foreground">
                                  รวม: {trophySizes.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0)} ชิ้น |
                                  มูลค่า: {trophySizes.reduce((sum, s) => sum + ((parseInt(s.quantity) || 0) * s.price), 0).toLocaleString()} บาท
                                </div>
                              )}
                            </div>
                          )}

                          {/* ป้ายจารึก - checkbox style */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">ป้ายจารึก</Label>
                            <div className="flex items-center gap-6">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="engraving-accept"
                                  checked={form.watch("jobDetails.engraving") === "accept"}
                                  onCheckedChange={(checked) => {
                                    form.setValue("jobDetails.engraving", checked ? "accept" : "decline");
                                  }}
                                />
                                <label htmlFor="engraving-accept" className="text-sm cursor-pointer">รับ</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="engraving-decline"
                                  checked={form.watch("jobDetails.engraving") === "decline"}
                                  onCheckedChange={(checked) => {
                                    form.setValue("jobDetails.engraving", checked ? "decline" : "");
                                  }}
                                />
                                <label htmlFor="engraving-decline" className="text-sm cursor-pointer">ไม่รับ</label>
                              </div>
                            </div>
                          </div>

                          {form.watch("jobDetails.engraving") === "accept" && (
                            <>
                              <FormField
                                control={form.control}
                                name="jobDetails.engravingDetails"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>รายละเอียดจารึก</FormLabel>
                                    <FormControl>
                                      <Textarea {...field} placeholder="ระบุรายละเอียดจารึก" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="jobDetails.engravingFiles"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>แนบไฟล์</FormLabel>
                                    <FormControl>
                                      <div className="border-2 border-dashed border-border rounded-lg p-4">
                                        <Button type="button" variant="outline" className="w-full">
                                          <Upload className="w-4 h-4 mr-2" />
                                          อัพโหลดไฟล์ (ได้มากกว่า 1 ไฟล์)
                                        </Button>
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}

                          {/* โบว์ - checkbox style */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">โบว์</Label>
                            <div className="flex items-center gap-6">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="bow-accept"
                                  checked={form.watch("jobDetails.customType") === "bow-accept"}
                                  onCheckedChange={(checked) => {
                                    form.setValue("jobDetails.customType", checked ? "bow-accept" : "bow-decline");
                                  }}
                                />
                                <label htmlFor="bow-accept" className="text-sm cursor-pointer">รับ</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="bow-decline"
                                  checked={form.watch("jobDetails.customType") === "bow-decline" || !form.watch("jobDetails.customType")}
                                  onCheckedChange={(checked) => {
                                    form.setValue("jobDetails.customType", checked ? "bow-decline" : "");
                                  }}
                                />
                                <label htmlFor="bow-decline" className="text-sm cursor-pointer">ไม่รับ</label>
                              </div>
                            </div>
                          </div>

                          {form.watch("jobDetails.customType") === "bow-accept" && (
                            <div className="space-y-3">
                              <Label className="text-sm font-medium">เลือกสีโบว์</Label>
                              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                {[
                                  { id: "1", name: "แดง", color: "#FF0000" },
                                  { id: "2", name: "น้ำเงิน", color: "#0000FF" },
                                  { id: "3", name: "เขียว", color: "#008000" },
                                  { id: "4", name: "เหลือง", color: "#FFFF00" },
                                  { id: "5", name: "ดำ", color: "#000000" },
                                  { id: "6", name: "ขาว", color: "#FFFFFF" },
                                  { id: "7", name: "เทา", color: "#808080" },
                                ].map((bowColor) => (
                                  <div
                                    key={bowColor.id}
                                    className={cn(
                                      "border rounded-lg p-3 cursor-pointer transition-all flex flex-col items-center gap-2 hover:border-primary",
                                      form.watch("jobDetails.lanyardQuantity") === bowColor.id
                                        ? "border-primary ring-2 ring-primary bg-primary/5"
                                        : "border-border"
                                    )}
                                    onClick={() => form.setValue("jobDetails.lanyardQuantity", bowColor.id)}
                                  >
                                    <div
                                      className="w-12 h-12 rounded border border-border"
                                      style={{ backgroundColor: bowColor.color }}
                                    />
                                    <span className="text-xs font-medium">{bowColor.name}</span>
                                    <span className="text-[10px] text-muted-foreground">#{bowColor.id}</span>
                                  </div>
                                ))}
                              </div>
                              {form.watch("jobDetails.lanyardQuantity") && (
                                <p className="text-sm text-muted-foreground">
                                  เลือกแล้ว: สี #{form.watch("jobDetails.lanyardQuantity")}
                                </p>
                              )}
                            </div>
                          )}

                          <FormField
                            control={form.control}
                            name="jobDetails.notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>หมายเหตุ</FormLabel>
                                <FormControl>
                                  <Textarea {...field} placeholder="ระบุหมายเหตุ" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  ) : watchedProductType === "Shirt" ? (
                    /* For Shirt: วัสดุ + รายละเอียดเสื้อ in same box */
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="material"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>วัสดุ</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-background">
                                  <SelectValue placeholder="เลือกวัสดุ" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-background">
                                {getMaterialOptions(watchedProductType).map((material) => (
                                  <SelectItem key={material} value={material}>
                                    {material}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Pricing Selection for Shirt */}
                      {getProductFlow(watchedProductType) === "catalog"}

                      {/* รายละเอียดเสื้อ - in same box as product details */}
                      {watchedMaterial && (
                        <div className="space-y-4 pt-4 border-t">
                          <h4 className="font-semibold text-lg">รายละเอียดเสื้อ</h4>

                          {/* Collar selection */}
                          <div>
                            <Label className="text-sm font-medium">คอเสื้อ</Label>
                            <Select value={shirtCollar} onValueChange={setShirtCollar}>
                              <SelectTrigger className="bg-background mt-2">
                                <SelectValue placeholder="เลือกคอเสื้อ" />
                              </SelectTrigger>
                              <SelectContent className="bg-background">
                                <SelectItem value="polo">คอปก</SelectItem>
                                <SelectItem value="round">คอกลม</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Sleeve selection */}
                          <div>
                            <Label className="text-sm font-medium">แขนเสื้อ</Label>
                            <Select value={shirtSleeve} onValueChange={setShirtSleeve}>
                              <SelectTrigger className="bg-background mt-2">
                                <SelectValue placeholder="เลือกแขนเสื้อ" />
                              </SelectTrigger>
                              <SelectContent className="bg-background">
                                <SelectItem value="sleeveless">แขนกุด</SelectItem>
                                <SelectItem value="short">แขนสั้น</SelectItem>
                                <SelectItem value="long">แขนยาว</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Show size table after selecting collar and sleeve */}
                          {shirtCollar && shirtSleeve && (
                            <div className="space-y-4 pt-4 border-t">
                              <h5 className="font-medium">ตารางไซส์เสื้อ</h5>
                              <div className="border rounded-lg overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/50">
                                      <TableHead className="text-center font-medium">ไซส์</TableHead>
                                      <TableHead className="text-center font-medium">รอบอก (นิ้ว)</TableHead>
                                      <TableHead className="text-center font-medium">ยาว (นิ้ว)</TableHead>
                                      <TableHead className="text-center font-medium">ไหล่ (นิ้ว)</TableHead>
                                      <TableHead className="text-center font-medium">แขน (นิ้ว)</TableHead>
                                      <TableHead className="text-center font-medium w-[100px]">จำนวน</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {shirtSizes.map((sizeRow, index) => (
                                      <TableRow key={sizeRow.size}>
                                        <TableCell className="text-center font-medium">{sizeRow.size}</TableCell>
                                        <TableCell className="text-center">{sizeRow.chest}"</TableCell>
                                        <TableCell className="text-center">{sizeRow.length}"</TableCell>
                                        <TableCell className="text-center">{sizeRow.shoulder}"</TableCell>
                                        <TableCell className="text-center">{sizeRow.sleeve}"</TableCell>
                                        <TableCell className="text-center">
                                          <Input
                                            type="number"
                                            min="0"
                                            value={sizeRow.quantity}
                                            onChange={(e) => {
                                              const newSizes = [...shirtSizes];
                                              newSizes[index].quantity = e.target.value;
                                              setShirtSizes(newSizes);
                                            }}
                                            className="w-20 text-center mx-auto"
                                            placeholder="0"
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    {/* Custom size row if added */}
                                    {showCustomShirtSize && (
                                      <TableRow className="bg-muted/20">
                                        <TableCell className="text-center">
                                          <Input
                                            value={customShirtSize.size}
                                            onChange={(e) => setCustomShirtSize(prev => ({ ...prev, size: e.target.value }))}
                                            className="w-16 text-center mx-auto"
                                            placeholder="ไซส์"
                                          />
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Input
                                            value={customShirtSize.chest}
                                            onChange={(e) => setCustomShirtSize(prev => ({ ...prev, chest: e.target.value }))}
                                            className="w-16 text-center mx-auto"
                                            placeholder="0"
                                          />
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Input
                                            value={customShirtSize.length}
                                            onChange={(e) => setCustomShirtSize(prev => ({ ...prev, length: e.target.value }))}
                                            className="w-16 text-center mx-auto"
                                            placeholder="0"
                                          />
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Input
                                            value={customShirtSize.shoulder}
                                            onChange={(e) => setCustomShirtSize(prev => ({ ...prev, shoulder: e.target.value }))}
                                            className="w-16 text-center mx-auto"
                                            placeholder="0"
                                          />
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Input
                                            value={customShirtSize.sleeve}
                                            onChange={(e) => setCustomShirtSize(prev => ({ ...prev, sleeve: e.target.value }))}
                                            className="w-16 text-center mx-auto"
                                            placeholder="0"
                                          />
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Input
                                            type="number"
                                            min="0"
                                            value={customShirtSize.quantity}
                                            onChange={(e) => setCustomShirtSize(prev => ({ ...prev, quantity: e.target.value }))}
                                            className="w-20 text-center mx-auto"
                                            placeholder="0"
                                          />
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </div>

                              {/* Add custom size button */}
                              {!showCustomShirtSize && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowCustomShirtSize(true)}
                                  className="flex items-center gap-1"
                                >
                                  <Plus className="h-4 w-4" />
                                  เพิ่มไซส์อื่น
                                </Button>
                              )}
                            </div>
                          )}

                          <FormField
                            control={form.control}
                            name="jobDetails.attachedFiles"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ไฟล์แนบ</FormLabel>
                                <FormControl>
                                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                                    <Button type="button" variant="outline" className="w-full">
                                      <Upload className="w-4 h-4 mr-2" />
                                      อัพโหลดไฟล์
                                    </Button>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                      {/* Pricing Selection for Shirt */}
                      {getProductFlow(watchedProductType) === "catalog"}
                    </div>
                  ) : (
                  <FormField
                    control={form.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>วัสดุ</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="เลือกวัสดุ" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background">
                            {getMaterialOptions(watchedProductType).map((material) => (
                              <SelectItem key={material} value={material}>
                                {material}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Pricing Selection for Other Catalog Items */}
                {getProductFlow(watchedProductType) === "catalog"}
              </>
            )}
          </div>

            {/* Save Product Button */}
            {watchedProductType && watchedMaterial && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="default"
                  onClick={saveCurrentProduct}
                  className="flex items-center gap-2"
                >
                  บันทึกสินค้า
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Price Estimation List Panel - Based on Customer (after Section 4) */}
        {(watchedCustomerName || watchedCustomerLine) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  รายการประเมินราคาของลูกค้า
                </span>
                {selectedEstimations.length > 0 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    เลือกรายการ #{selectedEstimations.length} แล้ว
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getFilteredEstimations().length > 0 ? (
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs">วันที่ประเมินราคา</TableHead>
                        <TableHead className="text-xs">ประเภทสินค้า</TableHead>
                        <TableHead className="text-xs">รายละเอียดงาน</TableHead>
                        <TableHead className="text-xs text-right">จำนวน</TableHead>
                        <TableHead className="text-xs text-right">ราคา (บาท)</TableHead>
                        <TableHead className="text-xs">สถานะ</TableHead>
                        <TableHead className="text-xs text-center">รายละเอียด</TableHead>
                        <TableHead className="text-xs text-center">เลือก</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredEstimations().map((estimation) => {
                        const isSelected = selectedEstimations.some(e => e.id === estimation.id);
                        return (
                          <TableRow
                            key={estimation.id}
                            className={cn(
                              "cursor-pointer hover:bg-muted/50 transition-colors",
                              isSelected && "bg-primary/10"
                            )}
                            onClick={() => toggleEstimationSelection(estimation)}
                          >
                            <TableCell className="text-xs py-2">
                              {new Date(estimation.date).toLocaleDateString('th-TH')}
                            </TableCell>
                            <TableCell className="text-xs py-2 font-medium">{estimation.productType}</TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground">
                              {estimation.jobDescription || "-"}
                            </TableCell>
                            <TableCell className="text-xs py-2 text-right">{estimation.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-xs py-2 text-right font-medium">{estimation.price.toLocaleString()}</TableCell>
                            <TableCell className="text-xs py-2">
                              <Badge className={cn("text-[10px]", getStatusColor(estimation.status))}>
                                {estimation.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs py-2 text-center">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setViewingEstimation({
                                    ...estimation,
                                    jobDescription: estimation.jobDescription || ""
                                  });
                                  setEstimationDetailOpen(true);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                                ดู
                              </Button>
                            </TableCell>
                            <TableCell className="text-xs py-2 text-center">
                              <Button
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleEstimationSelection(estimation);
                                }}
                              >
                                {isSelected ? "เลือกแล้ว" : "เลือกใช้รายการนี้"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-border rounded-lg bg-muted/20">
                  <p className="text-sm text-muted-foreground mb-3">
                    ลูกค้ารายนี้ยังไม่มีรายการประเมินราคา
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/sales/price-estimation/add?customer=${encodeURIComponent(watchedCustomerName || "")}`)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    ไปสร้างประเมินราคาใหม่
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Unified Product List Box - Combines Estimations and Saved Products */}
        {(selectedEstimations.length > 0 || savedProducts.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  รายการสินค้าทั้งหมด
                </span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {selectedEstimations.length + savedProducts.length} รายการ
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs w-16 text-center">ลำดับ</TableHead>
                      <TableHead className="text-xs">รายการ</TableHead>
                      <TableHead className="text-xs">รายละเอียดงาน</TableHead>
                      <TableHead className="text-xs text-right">จำนวน</TableHead>
                      <TableHead className="text-xs text-right">ราคาต่อหน่วย</TableHead>
                      <TableHead className="text-xs text-right">ราคา</TableHead>
                      <TableHead className="text-xs w-16 text-center">ลบ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Estimation Products */}
                    {selectedEstimations.map((estimation, index) => {
                      const unitPrice = estimation.quantity > 0 ? estimation.price / estimation.quantity : estimation.price;
                      return (
                        <TableRow key={`estimation-${estimation.id}`}>
                          <TableCell className="text-xs py-3 text-center font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell className="text-xs py-3">
                            <div className="font-medium">{estimation.productType}</div>
                          </TableCell>
                          <TableCell className="text-xs py-3 text-muted-foreground">
                            {estimation.jobDescription || estimation.material || "-"}
                          </TableCell>
                          <TableCell className="text-xs py-3 text-right">
                            {estimation.quantity.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs py-3 text-right">
                            {unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-xs py-3 text-right font-medium">
                            {estimation.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-xs py-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeSelectedEstimation(estimation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Saved Products (from ready-made products) */}
                    {savedProducts.map((product, index) => {
                      // Use displayName if available (for ReadyMedal with colors or Trophy), otherwise fallback to label
                      const productLabel = product.displayName || productValueToLabel[product.productType] || product.productType;
                      // For Trophy, show sizeLabel. For others, show material/color info
                      const productDetails = product.sizeLabel
                        ? product.sizeLabel
                        : (product.wantsSticker === "receive"
                          ? "รับสติ๊กเกอร์"
                          : (product.displayName ? "-" : (product.material && !product.displayName ? product.material : (product.color ? "" : product.material || "-"))));
                      const quantity = product.quantity || parseInt(product.details?.quantity) || 1;
                      const unitPrice = product.unitPrice || null;
                      const totalPrice = unitPrice ? unitPrice * quantity : null;
                      const priceTypeLabel = product.priceType === 'retail' ? '(ปลีก)' : (product.priceType === 'wholesale' ? '(ส่ง)' : (product.priceType === 'clearance' ? '(โล๊ะ)' : ''));
                      
                      return (
                        <TableRow key={`saved-${product.id}`} className="hover:bg-muted/30">
                          <TableCell className="text-xs py-3 text-center font-medium">
                            {selectedEstimations.length + index + 1}
                          </TableCell>
                          <TableCell className="text-xs py-3">
                            <div className="font-medium flex items-center gap-1">
                              {productLabel}
                              {priceTypeLabel && <span className="text-[10px] text-muted-foreground font-normal">{priceTypeLabel}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs py-3 text-muted-foreground">
                            {productDetails}
                          </TableCell>
                          <TableCell className="text-xs py-3 text-right">
                            {quantity.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs py-3 text-right">
                            {unitPrice ? unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                          </TableCell>
                          <TableCell className="text-xs py-3 text-right font-medium">
                            {totalPrice ? totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-"}
                          </TableCell>
                          <TableCell className="text-xs py-3 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => removeProductItem(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {/* Total Row */}
                <div className="border-t border-border bg-muted/30 px-4 py-3 flex justify-between items-center">
                  <span className="text-sm font-medium">รวมทั้งหมด</span>
                  <span className="text-lg font-bold text-primary">
                    {orderTotalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Credit term days */}
        {newPayment.type === 'credit_term' && (
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">ระยะเวลาเครดิตเทอม (วัน)</label>
            <Select
              value={newPayment.additionalDetails}
              onValueChange={(value) => setNewPayment({ ...newPayment, additionalDetails: value })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="เลือกจำนวนวัน" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="15">15 วัน</SelectItem>
                <SelectItem value="30">30 วัน</SelectItem>
                <SelectItem value="45">45 วัน</SelectItem>
                <SelectItem value="60">60 วัน</SelectItem>
                <SelectItem value="90">90 วัน</SelectItem>
                <SelectItem value="120">120 วัน</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Section 5: Job Details (Dynamic) - Show job details for all product types EXCEPT Trophy and ReadyMedal (already in product details box) */}
        {watchedProductType && watchedMaterial && watchedProductType !== "Trophy" && watchedProductType !== "ReadyMedal" && (
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียดในการสั่งงาน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {renderJobDetails()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section 6: Delivery Information */}
        {((watchedProductType && watchedMaterial) || savedProducts.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>การจัดส่ง</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delivery Type Selection */}
              <div>
                <h4 className="font-semibold mb-4">รูปแบบการรับสินค้า</h4>
                <FormField
                  control={form.control}
                  name="deliveryType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value);
                            setDeliveryType(value);
                          }}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="parcel" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              จัดส่งพัสดุ
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="pickup" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              รับที่ร้าน
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Show pickup date & time period if "รับที่ร้าน" is selected */}
              {deliveryType === "pickup" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryInfo.pickupDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>วันที่จะมารับ</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "dd/MM/yyyy") : <span>เลือกวันที่</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryInfo.pickupTimePeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ช่วงเวลาที่จะมารับ</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="เลือกช่วงเวลา" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="morning">ช่วงเช้า (09:00 - 12:00)</SelectItem>
                            <SelectItem value="afternoon">ช่วงบ่าย (13:00 - 17:00)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Show delivery form if "จัดส่งพัสดุ" is selected */}
              {deliveryType === "parcel" && (
                <>
                  {/* 5.1 Recipient Information */}
                  <div>
                    <h4 className="font-semibold mb-4">5.1 ข้อมูลผู้รับสินค้า</h4>
                    <div className="mb-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={updateRecipientInfo}
                        className="text-sm"
                      >
                        ใช้ข้อมูลลูกค้า
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="deliveryInfo.recipientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ชื่อ-นามสกุลผู้รับ</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deliveryInfo.recipientPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>เบอร์โทรศัพท์ติดต่อ</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                    </div>
                  </div>

                  {/* 5.2 Delivery Address */}
                  <div>
                    <h4 className="font-semibold mb-4">5.2 ที่อยู่สำหรับจัดส่ง</h4>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="deliveryInfo.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>บ้านเลขที่ / หมู่บ้าน / อาคาร / ห้องเลขที่ ซอย / ถนน</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* จังหวัด */}
                        <FormField
                          control={form.control}
                          name="deliveryInfo.province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>จังหวัด</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  setSelectedProvinceName(val);
                                }}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={thaiProvinces.length === 0 ? "กำลังโหลด..." : "เลือกจังหวัด"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-60">
                                  {thaiProvinces.map(p => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* เขต/อำเภอ */}
                        <FormField
                          control={form.control}
                          name="deliveryInfo.district"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>เขต/อำเภอ</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  setSelectedAmphureName(val);
                                }}
                                value={field.value}
                                disabled={!selectedProvinceName}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={!selectedProvinceName ? "เลือกจังหวัดก่อน" : "เลือกเขต/อำเภอ"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-60">
                                  {thaiAmphures.map(a => (
                                    <SelectItem key={a} value={a}>{a}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* แขวง/ตำบล */}
                        <FormField
                          control={form.control}
                          name="deliveryInfo.subdistrict"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>แขวง/ตำบล</FormLabel>
                              <Select
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  getZipcode(selectedProvinceName, selectedAmphureName, val).then(zip => {
                                    if (zip) form.setValue("deliveryInfo.postalCode", zip);
                                  });
                                }}
                                value={field.value}
                                disabled={!selectedAmphureName}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={!selectedAmphureName ? "เลือกอำเภอก่อน" : "เลือกแขวง/ตำบล"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-60">
                                  {thaiTambons.map(t => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* รหัสไปรษณีย์ (auto-fill) */}
                        <FormField
                          control={form.control}
                          name="deliveryInfo.postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>รหัสไปรษณีย์</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="กรอกเองหรืออัตโนมัติ" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5.3 Delivery Options */}
                  <div>
                    <h4 className="font-semibold mb-4">5.3 ตัวเลือกการจัดส่ง</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="deliveryInfo.deliveryMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>วิธีการจัดส่ง</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกวิธีการจัดส่ง" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ems">EMS / ไปรษณีย์ด่วน</SelectItem>
                                <SelectItem value="thaipost">ไปรษณีย์ธรรมดา</SelectItem>
                                <SelectItem value="kerry">Kerry Express</SelectItem>
                                <SelectItem value="flash">Flash Express</SelectItem>
                                <SelectItem value="jt">J&T Express</SelectItem>
                                <SelectItem value="ninja">Ninja Van</SelectItem>
                                <SelectItem value="grab">Grab Express</SelectItem>
                                <SelectItem value="lalamove">Lalamove</SelectItem>
                                <SelectItem value="private_transport">ขนส่งเอกชน / รถบรรทุก</SelectItem>
                                <SelectItem value="company_delivery">จัดส่งโดยบริษัท</SelectItem>
                                <SelectItem value="pickup">รับสินค้าเอง / นัดรับ</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deliveryInfo.preferredDeliveryDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>วันที่/เวลาที่ต้องการให้จัดส่ง</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>{watchedDeliveryDate ? format(watchedDeliveryDate, "PPP") : "เลือกวันที่"}</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value || watchedDeliveryDate}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                  className="pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* ต้นทาง/ปลายทาง (สาขา) */}
                      <FormField
                        control={form.control}
                        name="deliveryInfo.originBranch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>สาขาต้นทาง</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกสาขาต้นทาง" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="HQ">สำนักงานใหญ่</SelectItem>
                                <SelectItem value="WH">คลังสินค้า</SelectItem>
                                <SelectItem value="SB1">สาขา 1</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="deliveryInfo.destinationBranch"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>สาขาปลายทาง</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกสาขาปลายทาง" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="HQ">สำนักงานใหญ่</SelectItem>
                                <SelectItem value="WH">คลังสินค้า</SelectItem>
                                <SelectItem value="SB1">สาขา 1</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* เวลารับลูกค้าสะดวกรับ */}
                      <FormField
                        control={form.control}
                        name="deliveryInfo.preferredTimeSlot"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>เวลารับลูกค้าสะดวกรับ</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกช่วงเวลา" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="09:00-11:00">ช่วงเช้า (09:00 - 11:00)</SelectItem>
                                <SelectItem value="11:00-13:00">ก่อนบ่าย (11:00 - 13:00)</SelectItem>
                                <SelectItem value="13:00-15:00">ช่วงบ่าย (13:00 - 15:00)</SelectItem>
                                <SelectItem value="15:00-17:00">เย็น (15:00 - 17:00)</SelectItem>
                                <SelectItem value="anytime">สะดวกรับทั้งวัน</SelectItem>
                                <SelectItem value="specific">ระบุในหมายเหตุ</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* ค่าขนส่ง / การชำระค่าจัดส่ง */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="deliveryInfo.paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>การชำระค่าจัดส่ง</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="เลือกวิธีชำระค่าจัดส่ง" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="prepaid">ชำระแล้ว (รวมกับยอดสินค้า)</SelectItem>
                                <SelectItem value="cod">เก็บเงินปลายทาง (COD)</SelectItem>
                                <SelectItem value="free">ฟรีค่าจัดส่ง</SelectItem>
                                <SelectItem value="collect">เรียกเก็บแยก</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* 5.4 Additional Instructions */}
                  <div>
                    <h4 className="font-semibold mb-4">5.4 คำแนะนำเพิ่มเติมในการจัดส่ง</h4>
                    <FormField
                      control={form.control}
                      name="deliveryInfo.deliveryInstructions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>คำแนะนำเพิ่มเติม</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="เช่น ฝากไว้กับ รปภ., โทรหาก่อนส่ง" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            ยกเลิก
          </Button>

          <Button type="submit" variant="secondary" disabled={isUploading}>
            {isUploading ? "กำลังอัปโหลด..." : "บันทึก"}
          </Button>

          {/* Conditional buttons based on product type */}
          {(watchedProductType === "Medal" || watchedProductType === "Award" ||
            ["Keychain", "Doll", "Lanyard", "Box packaging", "Bag", "Bottle", "อื่นๆ"].includes(watchedProductType)) && (
              <Button type="button" onClick={handleEstimatePrice}>
                ประเมินราคา
              </Button>
            )}

        </div>
      </form>

      {/* Estimation Detail Dialog */}
      <EstimationDetailDialog
        open={estimationDetailOpen}
        onOpenChange={setEstimationDetailOpen}
        estimation={viewingEstimation}
      />
    </Form>
  );
}