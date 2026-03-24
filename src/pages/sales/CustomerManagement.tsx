import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

// PHP Backend API URL
const API_BASE_URL = "https://nacres.co.th/api-lucky/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isValid, parseISO, parse } from "date-fns";
import { th } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Package,
  UserPlus,
  FileText,
  Clock,
  Filter,
  CalendarIcon,
  Receipt,
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Save,
  DollarSign,
  Building,
  Check,
  ChevronsUpDown,
  User,
  X,
  Users,
  SlidersHorizontal,
  ChevronDown,
  Trash2
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Thai provinces list
const thaiProvinces = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น",
  "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงราย",
  "เชียงใหม่", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", "นครราชสีมา",
  "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์",
  "ปทุมธานี", "ประจวบคีรีขันธ์", "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พังงา",
  "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", "ภูเก็ต", "มหาสารคาม",
  "มุกดาหาร", "แม่ฮ่องสอน", "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี",
  "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี",
  "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ",
  "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
];

// ===================================================
// Thai Geo — จาก jsdelivr GitHub CDN (โหลดครั้งเดียว cache module)
// ===================================================
interface GeoProvince { id: number; name_th: string; }
interface GeoAmphure { id: number; name_th: string; province_id: number; }
interface GeoTambon { id: number; name_th: string; zip_code: number; amphure_id: number; }

// ไฟล์จริงอยู่ใน /api/latest/ (verified จาก GitHub API)
const GEO_URL = 'https://raw.githubusercontent.com/kongvut/thai-province-data/master/api/latest/province_with_district_and_sub_district.json';

let _geoProvinces: GeoProvince[] = [];
let _geoAmphures: GeoAmphure[] = [];
let _geoTambons: GeoTambon[] = [];
let _geoReady = false;
let _geoPromise: Promise<void> | null = null;

function loadGeo(): Promise<void> {
  if (_geoReady) return Promise.resolve();
  if (_geoPromise) return _geoPromise;
  console.log('[Geo] Loading combined geo data...');
  _geoPromise = fetch(GEO_URL)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then((provinces: any[]) => {
      _geoProvinces = provinces.map((p: any) => ({ id: p.id, name_th: p.name_th }));
      _geoAmphures = provinces.flatMap((p: any) =>
        (p.districts || []).map((d: any) => ({ id: d.id, name_th: d.name_th, province_id: p.id }))
      );
      _geoTambons = provinces.flatMap((p: any) =>
        (p.districts || []).flatMap((d: any) =>
          (d.sub_districts || []).map((s: any) => ({ id: s.id, name_th: s.name_th, zip_code: s.zip_code, amphure_id: d.id }))
        )
      );
      _geoReady = true;
      console.log(`[Geo] ✅ ${_geoProvinces.length} จังหวัด, ${_geoAmphures.length} อำเภอ, ${_geoTambons.length} ตำบล`);
    })
    .catch(e => {
      _geoPromise = null;
      console.error('[Geo] ❌ Load failed:', e);
    });
  return _geoPromise!;
}

function geoDistricts(provinceName: string): GeoAmphure[] {
  const prov = _geoProvinces.find(p => p.name_th === provinceName)
    || _geoProvinces.find(p => p.name_th.includes(provinceName) || provinceName.includes(p.name_th));
  if (!prov) return [];
  return _geoAmphures.filter(a => a.province_id === prov.id);
}

function geoSubdistricts(amphureId: number): GeoTambon[] {
  return _geoTambons.filter(t => t.amphure_id === amphureId);
}

// Product tags for multi-select
const productTags = [
  "เหรียญ", "ถ้วยรางวัล", "โล่", "เสื้อ", "สายคล้อง",
  "แก้ว", "หมวก", "กระเป๋า", "ป้ายพรีเมียม", "พวงกุญแจ",
  "ที่เปิดขวด", "แม่เหล็ก", "ที่ทับกระดาษ"
];

// Sales owners list for filter
const salesOwners = ['สมชาย', 'สมหญิง', 'วิภา', 'ธนา', 'กมล'];

interface Customer {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  address: string;
  businessType: string;
  totalOrders: number;
  totalValue: number;
  lastContact: string;
  status: string;
  // CRM Fields (จาก DB)
  salesStatus: 'ใหม่' | 'เสนอราคา' | 'ผลิต' | 'ปิดงาน';
  nextAction: string;
  nextActionDate: string;
  salesOwner: string;
  interestedProducts: string[];
  contactCount: number;
}

// Phone number formatting helper
const formatPhoneNumber = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};

// Tax ID formatting helper
const formatTaxId = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  return numbers.slice(0, 13);
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatNextActionDate = (dateVal: any) => {
  if (!dateVal || dateVal === "0000-00-00" || dateVal === "0000-00-00 00:00:00") return "ไม่ได้กำหนด";

  let d: Date;
  try {
    if (typeof dateVal === "string") {
      // Split to handle 'YYYY-MM-DD HH:mm:ss' easily and get only date part
      const datePart = dateVal.includes(' ') ? dateVal.split(' ')[0] : dateVal;
      d = parseISO(datePart);
    } else {
      d = new Date(dateVal);
    }

    if (!isValid(d)) return "ไม่ได้กำหนด";
    return format(d, "dd/MM/yyyy", { locale: th });
  } catch (e) {
    return "ไม่ได้กำหนด";
  }
};

export default function CustomerManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [salesOwnerFilter, setSalesOwnerFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [addStep, setAddStep] = useState(0);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Customer | null, direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });

  const handleSort = (key: keyof Customer) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  const [isQuotationOpen, setIsQuotationOpen] = useState(false);
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [subdistrictOpen, setSubdistrictOpen] = useState(false);
  const [shippingProvinceOpen, setShippingProvinceOpen] = useState(false);
  const [shippingDistrictOpen, setShippingDistrictOpen] = useState(false);
  const [shippingSubdistrictOpen, setShippingSubdistrictOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sameAddress, setSameAddress] = useState(false);
  const [cardFilter, setCardFilter] = useState<string | null>(null);
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Thai Geo state
  const [billingDistricts, setBillingDistricts] = useState<GeoAmphure[]>([]);
  const [billingSubdistricts, setBillingSubdistricts] = useState<GeoTambon[]>([]);
  const [shippingDistricts, setShippingDistricts] = useState<GeoAmphure[]>([]);
  const [shippingSubdistricts, setShippingSubdistricts] = useState<GeoTambon[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);

  // Column filters
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [openColumnFilter, setOpenColumnFilter] = useState<string | null>(null);

  // Advanced search modal
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedSearch, setAdvancedSearch] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    lineId: "",
    address: "",
    status: "all",
    source: "all",
    responsiblePerson: "all",
    notes: "",
  });
  const [selectedProductTags, setSelectedProductTags] = useState<string[]>([]);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLDivElement>(null);

  const [newCustomer, setNewCustomer] = useState({
    // ส่วนที่ 1: ข้อมูลบริษัท/องค์กร
    companyName: "",
    customerType: "เจ้าของงาน",
    taxId: "",

    // ที่อยู่ออกใบกำกับภาษี
    billingProvince: "",
    billingDistrict: "",
    billingSubdistrict: "",
    billingPostcode: "",
    billingAddress: "",

    // ที่อยู่จัดส่ง
    shippingProvince: "",
    shippingDistrict: "",
    shippingSubdistrict: "",
    shippingPostcode: "",
    shippingAddress: "",

    // ส่วนที่ 2: ข้อมูลผู้ติดต่อหลัก
    contactName: "",
    phoneNumbers: [""],
    emails: [""],
    lineId: "",

    // ข้อมูลผู้ติดต่อเพิ่มเติม
    additionalContacts: [] as Array<{ contactName: string; lineId: string; phoneNumber: string; email: string }>,

    // ส่วนที่ 3: การนำเสนอ
    presentationStatus: "เสนอขาย",
    contactCount: 1,
    lastContactDate: new Date(),
    interestedProducts: [] as string[],

    // ส่วนที่ 4: ข้อมูลภายใน
    responsiblePerson: "พนักงานขายปัจจุบัน",
    customerStatus: "ลูกค้าใหม่",
    howFoundUs: "Facebook",
    otherChannel: "",
    notes: ""
  });
  const { toast } = useToast();

  // Load geo data on mount (background)
  useEffect(() => { loadGeo(); }, []);

  // Billing province → load districts
  useEffect(() => {
    if (!newCustomer.billingProvince) { setBillingDistricts([]); setBillingSubdistricts([]); return; }
    setGeoLoading(true);
    loadGeo().then(() => {
      setBillingDistricts(geoDistricts(newCustomer.billingProvince));
      setBillingSubdistricts([]);
      setGeoLoading(false);
    });
  }, [newCustomer.billingProvince]);

  // Billing district → load subdistricts
  useEffect(() => {
    const amp = billingDistricts.find(a => a.name_th === newCustomer.billingDistrict);
    if (!amp) { setBillingSubdistricts([]); return; }
    setBillingSubdistricts(geoSubdistricts(amp.id));
  }, [newCustomer.billingDistrict, billingDistricts]);

  // Shipping province → load districts
  useEffect(() => {
    if (!newCustomer.shippingProvince) { setShippingDistricts([]); setShippingSubdistricts([]); return; }
    loadGeo().then(() => {
      setShippingDistricts(geoDistricts(newCustomer.shippingProvince));
      setShippingSubdistricts([]);
    });
  }, [newCustomer.shippingProvince]);

  // Shipping district → load subdistricts
  useEffect(() => {
    const amp = shippingDistricts.find(a => a.name_th === newCustomer.shippingDistrict);
    if (!amp) { setShippingSubdistricts([]); return; }
    setShippingSubdistricts(geoSubdistricts(amp.id));
  }, [newCustomer.shippingDistrict, shippingDistricts]);

  // Handle same address toggle
  useEffect(() => {
    if (sameAddress) {
      setNewCustomer(prev => ({
        ...prev,
        shippingProvince: prev.billingProvince,
        shippingDistrict: prev.billingDistrict,
        shippingSubdistrict: prev.billingSubdistrict,
        shippingPostcode: prev.billingPostcode,
        shippingAddress: prev.billingAddress
      }));
    }
  }, [sameAddress, newCustomer.billingProvince, newCustomer.billingDistrict, newCustomer.billingSubdistrict, newCustomer.billingPostcode, newCustomer.billingAddress]);

  // Fetch customers from PHP API
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/customers.php`);
      const json = await response.json();

      if (!response.ok || json.status === 'error') {
        console.error('Error fetching customers:', json.message);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: json.message || "ไม่สามารถดึงข้อมูลลูกค้าได้",
          variant: "destructive"
        });
        return;
      }

      // แปลง API response -> Customer interface
      const transformedCustomers: Customer[] = (json.data || []).map((customer: any) => ({
        id: String(customer.id),
        name: customer.company_name || '',
        contact: customer.contact_name || '',
        phone: Array.isArray(customer.phone_numbers) ? customer.phone_numbers[0] || '' : '',
        email: Array.isArray(customer.emails) ? customer.emails[0] || '' : '',
        address: customer.billing_province || '',
        businessType: customer.business_type || customer.customer_type || 'ไม่ระบุ',
        totalOrders: customer.total_orders ?? 0,
        totalValue: customer.total_value ?? 0,
        lastContact: customer.last_contact_date || '',
        status: customer.customer_status || 'ลูกค้าใหม่',
        salesStatus: (customer.sales_status || 'ใหม่') as 'ใหม่' | 'เสนอราคา' | 'ผลิต' | 'ปิดงาน',
        nextAction: customer.next_action || '',
        nextActionDate: customer.next_action_date || '',
        salesOwner: customer.sales_owner || '',
        interestedProducts: Array.isArray(customer.interested_products) ? customer.interested_products : [],
        contactCount: customer.contact_count ?? 0,
      }));

      setCustomers(transformedCustomers);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเชื่อมต่อ API ได้",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const addPhoneNumber = () => {
    setNewCustomer(prev => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, ""]
    }));
  };

  const addEmail = () => {
    setNewCustomer(prev => ({
      ...prev,
      emails: [...prev.emails, ""]
    }));
  };

  const updatePhoneNumber = (index: number, value: string) => {
    const formatted = formatPhoneNumber(value);
    setNewCustomer(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.map((phone, i) => i === index ? formatted : phone)
    }));
  };

  const updateEmail = (index: number, value: string) => {
    setNewCustomer(prev => ({
      ...prev,
      emails: prev.emails.map((email, i) => i === index ? value : email)
    }));
    // Clear error if valid or empty
    if (!value || EMAIL_REGEX.test(value)) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[`email_${index}`];
        return next;
      });
    }
  };

  const removePhoneNumber = (index: number) => {
    if (newCustomer.phoneNumbers.length > 1) {
      setNewCustomer(prev => ({
        ...prev,
        phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index)
      }));
    }
  };

  const removeEmail = (index: number) => {
    if (newCustomer.emails.length > 1) {
      setNewCustomer(prev => ({
        ...prev,
        emails: prev.emails.filter((_, i) => i !== index)
      }));
    }
  };

  // Product tag toggle
  const toggleProductTag = (tag: string) => {
    setNewCustomer(prev => {
      const next = prev.interestedProducts.includes(tag)
        ? prev.interestedProducts.filter(t => t !== tag)
        : [...prev.interestedProducts, tag];
      // Clear error if at least 1 product selected
      if (next.length > 0) setFormErrors(prev => { const n = { ...prev }; delete n.interestedProducts; return n; });
      return { ...prev, interestedProducts: next };
    });
  };

  // Additional contacts functions
  const addAdditionalContact = () => {
    setNewCustomer(prev => ({
      ...prev,
      additionalContacts: [...prev.additionalContacts, {
        contactName: "",
        lineId: "",
        phoneNumber: "",
        email: ""
      }]
    }));
  };

  const updateAdditionalContact = (index: number, field: string, value: string) => {
    let formattedValue = value;
    if (field === 'phoneNumber') {
      formattedValue = formatPhoneNumber(value);
    }
    setNewCustomer(prev => ({
      ...prev,
      additionalContacts: prev.additionalContacts.map((contact, i) =>
        i === index ? { ...contact, [field]: formattedValue } : contact
      )
    }));
    // Clear email error if valid or empty
    if (field === 'email' && (!value || EMAIL_REGEX.test(value))) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[`additionalContact_${index}_email`];
        return next;
      });
    }
  };

  const removeAdditionalContact = (index: number) => {
    setNewCustomer(prev => ({
      ...prev,
      additionalContacts: prev.additionalContacts.filter((_, i) => i !== index)
    }));
  };

  const handleAddCustomer = async () => {
    const errors: Record<string, string> = {};
    if (!newCustomer.companyName.trim()) errors.companyName = "กรุณากรอกชื่อบริษัท";
    if (!newCustomer.contactName.trim()) errors.contactName = "กรุณากรอกชื่อ-นามสกุลผู้ติดต่อ";
    if (!newCustomer.phoneNumbers[0]?.trim()) errors.phone = "กรุณากรอกเบอร์โทรศัพท์";
    if (newCustomer.interestedProducts.length === 0) errors.interestedProducts = "กรุณาเลือกสินค้าที่สนใจอย่างน้อย 1 รายการ";
    if (newCustomer.taxId && newCustomer.taxId.length !== 13) errors.taxId = "เลขประจำตัวผู้เสียภาษีต้องมี 13 หลักเท่านั้น";

    // --- Duplicate Check ---
    const lowerName = newCustomer.companyName.trim().toLowerCase();
    const existing = customers.find(c => c.name.trim().toLowerCase() === lowerName);

    if (existing) {
      toast({
        title: "⚠️ พบข้อมูลลูกค้าซ้ำ",
        description: `ชื่อลูกค้า "${newCustomer.companyName}" มีอยู่ในระบบแล้ว (รหัส: ${existing.id})`,
        variant: "destructive",
        action: (
          <ToastAction altText="ดูข้อมูลเดิม" onClick={() => navigate(`/sales/customers/${existing.id}`)}>
            ดูข้อมูลเดิม
          </ToastAction>
        )
      });
      return;
    }
    // ----------------------

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Auto-scroll to the first errored field
      const firstErrorKey = Object.keys(errors)[0];
      const el = document.getElementById(`field-${firstErrorKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลในช่องที่จำเป็นและถูกต้องทั้งหมด",
        variant: "destructive"
      });
      return;
    }
    setFormErrors({});

    try {
      // Filter out empty phone numbers and emails
      const filteredPhoneNumbers = newCustomer.phoneNumbers.filter(phone => phone.trim() !== '');
      const filteredEmails = newCustomer.emails.filter(email => email.trim() !== '');

      // Prepare additional contacts
      const validAdditionalContacts = newCustomer.additionalContacts
        .filter(c => c.contactName.trim() !== '')
        .map(c => ({
          contact_name: c.contactName,
          line_id: c.lineId,
          phone_number: c.phoneNumber,
          email: c.email
        }));

      const customerData = {
        company_name: newCustomer.companyName,
        customer_type: newCustomer.customerType,
        tax_id: newCustomer.taxId,
        business_type: newCustomer.customerType === 'เจ้าของงาน' ? 'องค์กร' : 'ตัวแทน',
        // ที่อยู่ออกใบกำกับ
        billing_address: newCustomer.billingAddress,
        billing_subdistrict: newCustomer.billingSubdistrict,
        billing_district: newCustomer.billingDistrict,
        billing_province: newCustomer.billingProvince,
        billing_postcode: newCustomer.billingPostcode,
        // ที่อยู่จัดส่ง
        shipping_address: sameAddress ? newCustomer.billingAddress : newCustomer.shippingAddress,
        shipping_subdistrict: sameAddress ? newCustomer.billingSubdistrict : newCustomer.shippingSubdistrict,
        shipping_district: sameAddress ? newCustomer.billingDistrict : newCustomer.shippingDistrict,
        shipping_province: sameAddress ? newCustomer.billingProvince : newCustomer.shippingProvince,
        shipping_postcode: sameAddress ? newCustomer.billingPostcode : newCustomer.shippingPostcode,
        same_address: sameAddress ? 1 : 0,
        // ผู้ติดต่อหลัก
        contact_name: newCustomer.contactName,
        phone_numbers: filteredPhoneNumbers,
        emails: filteredEmails,
        line_id: newCustomer.lineId,
        // CRM
        presentation_status: newCustomer.presentationStatus,
        sales_status: 'ใหม่',
        contact_count: newCustomer.contactCount,
        last_contact_date: newCustomer.lastContactDate.toISOString().split('T')[0],
        interested_products: newCustomer.interestedProducts,
        // ข้อมูลภายใน
        responsible_person: newCustomer.responsiblePerson,
        customer_status: newCustomer.customerStatus,
        how_found_us: newCustomer.howFoundUs,
        other_channel: newCustomer.otherChannel,
        notes: newCustomer.notes,
        // ผู้ติดต่อเพิ่มเติม
        additional_contacts: validAdditionalContacts,
      };

      const response = await fetch(`${API_BASE_URL}/customers.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      const json = await response.json();

      if (!response.ok || json.status === 'error') {
        console.error('Error adding customer:', json.message);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: json.message || "ไม่สามารถเพิ่มลูกค้าใหม่ได้",
          variant: "destructive"
        });
        return;
      }

      const newId = json.id || (json.data && json.data.id);

      toast({
        title: "✅ บันทึกลูกค้าใหม่สำเร็จ!",
        description: `เพิ่มข้อมูลลูกค้า ${newCustomer.companyName} เรียบร้อยแล้ว`,
        action: newId ? (
          <ToastAction altText="ดูข้อมูลลูกค้า" onClick={() => navigate(`/sales/customers/${newId}`)}>
            ดูข้อมูลลูกค้า
          </ToastAction>
        ) : undefined,
      });

      if (newId) {
        setNewlyAddedId(newId.toString());
      }

      setIsAddCustomerOpen(false);

      // Refresh customer list
      await fetchCustomers();

      // Reset form
      setNewCustomer({
        companyName: "",
        customerType: "เจ้าของงาน",
        taxId: "",
        billingProvince: "",
        billingDistrict: "",
        billingSubdistrict: "",
        billingPostcode: "",
        billingAddress: "",
        shippingProvince: "",
        shippingDistrict: "",
        shippingSubdistrict: "",
        shippingPostcode: "",
        shippingAddress: "",
        contactName: "",
        phoneNumbers: [""],
        emails: [""],
        lineId: "",
        additionalContacts: [],
        presentationStatus: "เสนอขาย",
        contactCount: 1,
        lastContactDate: new Date(),
        interestedProducts: [],
        responsiblePerson: "พนักงานขายปัจจุบัน",
        customerStatus: "ลูกค้าใหม่",
        howFoundUs: "Facebook",
        otherChannel: "",
        notes: ""
      });
      setSameAddress(false);
      setFormErrors({});
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มลูกค้าใหม่ได้",
        variant: "destructive"
      });
    }
  };

  const handleCreateQuotation = () => {
    if (!selectedCustomer) {
      toast({
        title: "กรุณาเลือกลูกค้า",
        description: "โปรดเลือกลูกค้าก่อนสร้างใบเสนอราคา",
        variant: "destructive"
      });
      return;
    }

    console.log("Creating quotation for:", selectedCustomer);
    toast({
      title: "สร้างใบเสนอราคา",
      description: `กำลังสร้างใบเสนอราคาสำหรับ ${selectedCustomer.name}`,
    });
    setIsQuotationOpen(false);
  };

  // Deep search - search all fields in customer object
  const deepSearch = useCallback((customer: Customer, term: string): boolean => {
    if (!term) return true;
    const lowerTerm = term.toLowerCase();
    return Object.values(customer).some(value => {
      if (Array.isArray(value)) return value.some(v => String(v).toLowerCase().includes(lowerTerm));
      return String(value).toLowerCase().includes(lowerTerm);
    });
  }, []);

  // Advanced search filter
  const matchesAdvancedSearch = useCallback((customer: Customer): boolean => {
    const { companyName, contactPerson, phone, email, lineId, address, status, source, responsiblePerson, notes } = advancedSearch;
    if (companyName && !customer.name.toLowerCase().includes(companyName.toLowerCase())) return false;
    if (contactPerson && !customer.contact.toLowerCase().includes(contactPerson.toLowerCase())) return false;
    if (phone && !customer.phone.includes(phone)) return false;
    if (email && !customer.email.toLowerCase().includes(email.toLowerCase())) return false;
    if (address && !customer.address.toLowerCase().includes(address.toLowerCase())) return false;
    if (status !== "all" && customer.status !== status) return false;
    if (responsiblePerson !== "all" && customer.salesOwner !== responsiblePerson) return false;
    return true;
  }, [advancedSearch]);

  // Card filter logic
  const matchesCardFilter = useCallback((customer: Customer): boolean => {
    if (!cardFilter) return true;
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    switch (cardFilter) {
      case "total": return true;
      case "ลูกค้าใหม่": return customer.status === "ลูกค้าใหม่";
      case "ลูกค้าประจำ": return customer.status === "ลูกค้าประจำ";
      case "ลูกค้า VIP": return customer.status === "ลูกค้า VIP";
      case "inactive": {
        const lastContactDate = new Date(customer.lastContact + "T00:00:00");
        return lastContactDate < thirtyDaysAgo;
      }
      default: return true;
    }
  }, [cardFilter]);

  const duplicateNames = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach(c => {
      const name = (c.name || "").trim().toLowerCase();
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).filter(([_, count]) => count > 1).map(([name]) => name);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = deepSearch(customer, searchTerm);
      const matchesBusinessType = businessTypeFilter === "all" || customer.businessType === businessTypeFilter;
      const matchesStatus = statusFilter === "all" || customer.status === statusFilter;
      const matchesSalesOwner = salesOwnerFilter === "all" || customer.salesOwner === salesOwnerFilter;
      const matchesProduct = productFilter === "all" || customer.interestedProducts.includes(productFilter);
      const matchesCard = matchesCardFilter(customer);

      // Column filters
      const matchesColumnFilters = Object.entries(columnFilters).every(([key, value]) => {
        if (!value || value === "all") return true;
        switch (key) {
          case "name": return customer.name.toLowerCase().includes(value.toLowerCase());
          case "salesStatus": return customer.salesStatus === value;
          case "salesOwner": return customer.salesOwner === value;
          case "status": return customer.status === value;
          case "lastContact": return customer.lastContact.includes(value);
          default: return true;
        }
      });

      // Date range filtering
      let matchesDate = true;
      if (dateRange?.from || dateRange?.to) {
        const customerDate = new Date(customer.lastContact + "T00:00:00");
        if (dateRange.from && dateRange.to) {
          matchesDate = customerDate >= dateRange.from && customerDate <= dateRange.to;
        } else if (dateRange.from) {
          matchesDate = customerDate >= dateRange.from;
        } else if (dateRange.to) {
          matchesDate = customerDate <= dateRange.to;
        }
      }

      const matchesAdvanced = matchesAdvancedSearch(customer);

      return matchesSearch && matchesBusinessType && matchesStatus && matchesSalesOwner && matchesProduct && matchesDate && matchesColumnFilters && matchesAdvanced && matchesCard;
    }).sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal, 'th')
          : bVal.localeCompare(aVal, 'th');
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [customers, searchTerm, businessTypeFilter, statusFilter, salesOwnerFilter, productFilter, dateRange, columnFilters, advancedSearch, deepSearch, matchesAdvancedSearch, matchesCardFilter, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, businessTypeFilter, statusFilter, salesOwnerFilter, productFilter, dateRange, columnFilters, advancedSearch, cardFilter]);

  // Scroll and highlight newly added customer
  useEffect(() => {
    if (newlyAddedId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`customer-row-${newlyAddedId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300); // Wait a bit for the table to refresh and render

      const clearTimer = setTimeout(() => setNewlyAddedId(null), 10000);
      return () => {
        clearTimeout(timer);
        clearTimeout(clearTimer);
      };
    }
  }, [newlyAddedId, filteredCustomers]);

  // Highlight matching text
  const highlightText = useCallback((text: string, term: string) => {
    if (!term || !text) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    if (parts.length === 1) return text;
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark> : part
    );
  }, []);

  const activeSearchTerm = searchTerm;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ลูกค้า VIP": return "bg-accent text-accent-foreground";
      case "ลูกค้าประจำ": return "bg-primary text-primary-foreground";
      case "ลูกค้าใหม่": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getSalesStatusColor = (status: string) => {
    switch (status) {
      case "ใหม่": return "bg-blue-100 text-blue-800 border-blue-200";
      case "เสนอราคา": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ผลิต": return "bg-purple-100 text-purple-800 border-purple-200";
      case "ปิดงาน": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Calculate KPI metrics
  const cardCounts = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
      total: customers.length,
      new: customers.filter(c => c.status === "ลูกค้าใหม่").length,
      regular: customers.filter(c => c.status === "ลูกค้าประจำ").length,
      vip: customers.filter(c => c.status === "ลูกค้า VIP").length,
      inactive: customers.filter(c => {
        const d = new Date(c.lastContact + "T00:00:00");
        return d < thirtyDaysAgo;
      }).length,
    };
  }, [customers]);

  const clearAllFilters = () => {
    setBusinessTypeFilter("all");
    setStatusFilter("all");
    setSalesOwnerFilter("all");
    setProductFilter("all");
    setDateRange(undefined);
    setSearchTerm("");
    setColumnFilters({});
    setCardFilter(null);
    setAdvancedSearch({
      companyName: "", contactPerson: "", phone: "", email: "", lineId: "", address: "", status: "all", source: "all", responsiblePerson: "all", notes: "",
    });
  };

  const hasActiveFilters = businessTypeFilter !== "all" || statusFilter !== "all" || salesOwnerFilter !== "all" || productFilter !== "all" || dateRange || cardFilter !== null || Object.values(columnFilters).some(v => v && v !== "all") || Object.values(advancedSearch).some(v => v && v !== "all" && v !== "");

  // Column filter dropdown helper
  const ColumnFilterDropdown = ({ columnKey, label, options }: { columnKey: string; label: string; options?: string[] }) => (
    <Popover open={openColumnFilter === columnKey} onOpenChange={(open) => setOpenColumnFilter(open ? columnKey : null)}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className={cn("h-6 w-6 p-0 ml-1", columnFilters[columnKey] && columnFilters[columnKey] !== "all" && "text-primary")}>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        {options ? (
          <div className="space-y-1">
            <Button variant={!columnFilters[columnKey] || columnFilters[columnKey] === "all" ? "secondary" : "ghost"} size="sm" className="w-full justify-start text-xs" onClick={() => { setColumnFilters(prev => ({ ...prev, [columnKey]: "all" })); setOpenColumnFilter(null); }}>
              ทั้งหมด
            </Button>
            {options.map(opt => (
              <Button key={opt} variant={columnFilters[columnKey] === opt ? "secondary" : "ghost"} size="sm" className="w-full justify-start text-xs" onClick={() => { setColumnFilters(prev => ({ ...prev, [columnKey]: opt })); setOpenColumnFilter(null); }}>
                {opt}
              </Button>
            ))}
          </div>
        ) : (
          <Input
            placeholder={`กรอง${label}...`}
            value={columnFilters[columnKey] || ""}
            onChange={(e) => setColumnFilters(prev => ({ ...prev, [columnKey]: e.target.value }))}
            className="h-8 text-xs"
            autoFocus
          />
        )}
      </PopoverContent>
    </Popover>
  );

  // Skeleton loading component
  const TableSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <TableRow key={i}>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
          </TableCell>
          <TableCell><Skeleton className="h-6 w-[100px]" /></TableCell>
          <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
        </TableRow>
      ))}
    </>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">
        {hasActiveFilters ? "ไม่พบลูกค้าที่ตรงกับคำค้นหา" : "ยังไม่มีข้อมูลลูกค้า"}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        {hasActiveFilters
          ? "ไม่มีข้อมูลในระบบที่ตรงกับตัวกรองหรือคำค้นหานี้ กรุณาลองปรับเปลี่ยนคำค้นหาหรือล้างตัวกรองใหม่"
          : "เริ่มต้นด้วยการเพิ่มลูกค้าใหม่เพื่อจัดการข้อมูลและติดตามการขาย"}
      </p>
      {hasActiveFilters ? (
        <Button variant="outline" onClick={clearAllFilters}>
          ล้างตัวกรองทั้งหมด
        </Button>
      ) : (
        <Button onClick={() => setIsAddCustomerOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มลูกค้าใหม่
        </Button>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center pb-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการลูกค้า</h1>
          <p className="text-muted-foreground">ค้นหาและจัดการข้อมูลลูกค้าทั้งหมด</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={isAddCustomerOpen} onOpenChange={(open) => { setIsAddCustomerOpen(open); setAddStep(0); if (!open) setFormErrors({}); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                เพิ่มลูกค้าใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
              <div className="sticky top-0 z-50 bg-background border-b px-6 py-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle className="text-xl">เพิ่มลูกค้าใหม่</DialogTitle>
                    <DialogDescription>เพิ่มข้อมูลลูกค้าอย่างเป็นระบบ ({addStep + 1}/4)</DialogDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 px-3 py-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      กรอกข้อมูลแล้ว {Math.round([
                        newCustomer.companyName,
                        newCustomer.billingProvince,
                        newCustomer.contactName,
                        newCustomer.interestedProducts.length > 0
                      ].filter(Boolean).length / 4 * 100)}%
                    </Badge>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-4 py-2">
                  {[
                    { icon: Building2, label: "ข้อมูลบริษัท" },
                    { icon: MapPin, label: "ที่อยู่" },
                    { icon: UserPlus, label: "ผู้ติดต่อ" },
                    { icon: FileText, label: "การนำเสนอ" }
                  ].map((step, idx) => (
                    <div key={idx} className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                          addStep === idx ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                            addStep > idx ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                        )}>
                          {addStep > idx ? <Check className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div className={cn(
                          "hidden md:block text-xs font-semibold",
                          addStep === idx ? "text-primary" : "text-muted-foreground"
                        )}>
                          {step.label}
                        </div>
                      </div>
                      <div className={cn(
                        "h-1 rounded-full transition-all",
                        addStep > idx ? "bg-green-500" : addStep === idx ? "bg-primary" : "bg-muted"
                      )} />
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); if (addStep === 3) handleAddCustomer(); else setAddStep(s => s + 1); }} className="px-6 py-4">
                <div className="min-h-[400px]">
                  {addStep === 0 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2" id="field-companyName">
                          <Label htmlFor="companyName" className="text-primary font-semibold flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            ชื่อบริษัท/องค์กร <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="companyName"
                            value={newCustomer.companyName}
                            onChange={(e) => {
                              setNewCustomer({ ...newCustomer, companyName: e.target.value });
                              if (e.target.value.trim()) setFormErrors(prev => { const n = { ...prev }; delete n.companyName; return n; });
                            }}
                            placeholder="กรอกชื่อบริษัทหรือองค์กร"
                            className={cn(formErrors.companyName && "border-red-500 ring-red-500")}
                          />
                          {formErrors.companyName && <p className="text-xs text-red-500 font-medium">{formErrors.companyName}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="customerType" className="font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4 text-primary" />
                            ประเภทลูกค้า
                          </Label>
                          <Select value={newCustomer.customerType} onValueChange={(value) => setNewCustomer({ ...newCustomer, customerType: value })}>
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                              <SelectItem value="เจ้าของงาน">เจ้าของงาน</SelectItem>
                              <SelectItem value="ตัวแทน">ตัวแทน</SelectItem>
                              <SelectItem value="ออแกนไนเซอร์">ออแกนไนเซอร์</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 md:col-span-2" id="field-taxId">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="taxId" className="font-semibold flex items-center gap-2">
                              <Receipt className="w-4 h-4 text-primary" />
                              เลขประจำตัวผู้เสียภาษี (13 หลัก)
                            </Label>
                            <span className="text-[10px] text-muted-foreground">{newCustomer.taxId.length}/13 หลัก</span>
                          </div>
                          <Input
                            id="taxId"
                            value={newCustomer.taxId}
                            onChange={(e) => setNewCustomer({ ...newCustomer, taxId: formatTaxId(e.target.value) })}
                            placeholder="X-XXXX-XXXXX-XX-X"
                            maxLength={13}
                            className="font-mono bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {addStep === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary">
                          <MapPin className="w-5 h-5 font-bold" />
                          <h3 className="text-lg font-bold">ที่อยู่ออกใบกำกับภาษี</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>จังหวัด/อำเภอ/ตำบล</Label>
                            <div className="grid grid-cols-3 gap-2">
                              <Popover open={provinceOpen} onOpenChange={setProvinceOpen}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between">
                                    <span className="truncate">{newCustomer.billingProvince || "จังหวัด"}</span>
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0 shadow-lg border-primary/20">
                                  <Command>
                                    <CommandInput placeholder="ค้นหา..." />
                                    <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                                    <CommandGroup className="max-h-60 overflow-y-auto">
                                      {thaiProvinces.map(p => (
                                        <CommandItem key={p} onSelect={() => {
                                          setNewCustomer({ ...newCustomer, billingProvince: p, billingDistrict: "", billingSubdistrict: "" });
                                          setProvinceOpen(false);
                                        }}>
                                          <Check className={cn("mr-2 h-4 w-4", newCustomer.billingProvince === p ? "opacity-100" : "opacity-0")} />
                                          {p}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between" disabled={!newCustomer.billingProvince}>
                                    <span className="truncate">{newCustomer.billingDistrict || "อำเภอ"}</span>
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0 shadow-lg border-primary/20">
                                  <Command>
                                    <CommandInput placeholder="ค้นหา..." />
                                    <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                                    <CommandGroup className="max-h-60 overflow-y-auto">
                                      {billingDistricts.map(d => (
                                        <CommandItem key={d.id} onSelect={() => {
                                          setNewCustomer({ ...newCustomer, billingDistrict: d.name_th, billingSubdistrict: "", billingPostcode: "" });
                                          setDistrictOpen(false);
                                        }}>
                                          {d.name_th}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                              <Popover open={subdistrictOpen} onOpenChange={setSubdistrictOpen}>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between" disabled={!newCustomer.billingDistrict}>
                                    <span className="truncate">{newCustomer.billingSubdistrict || "ตำบล"}</span>
                                    <ChevronDown className="h-3 w-3 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[200px] p-0 shadow-lg border-primary/20">
                                  <Command>
                                    <CommandInput placeholder="ค้นหา..." />
                                    <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                                    <CommandGroup className="max-h-60 overflow-y-auto">
                                      {billingSubdistricts.map(s => (
                                        <CommandItem key={s.id} onSelect={() => {
                                          setNewCustomer({ ...newCustomer, billingSubdistrict: s.name_th, billingPostcode: String(s.zip_code || '') });
                                          setSubdistrictOpen(false);
                                        }}>
                                          {s.name_th}
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>รหัสไปรษณีย์</Label>
                            <Input
                              value={newCustomer.billingPostcode}
                              onChange={(e) => setNewCustomer({ ...newCustomer, billingPostcode: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                              placeholder="XXXXX"
                              maxLength={5}
                            />
                          </div>
                          <div className="md:col-span-2 space-y-2">
                            <Label>รายละเอียดที่อยู่ (บ้านเลขที่, ถนน)</Label>
                            <Textarea
                              value={newCustomer.billingAddress}
                              onChange={(e) => setNewCustomer({ ...newCustomer, billingAddress: e.target.value })}
                              placeholder="ที่อยู่สำหรับออกใบกำกับภาษี..."
                              className="bg-background resize-none"
                              rows={2}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-primary">
                            <Package className="w-5 h-5 font-bold" />
                            <h3 className="text-lg font-bold">ที่อยู่จัดส่ง</h3>
                          </div>
                          <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full border">
                            <Switch checked={sameAddress} onCheckedChange={setSameAddress} />
                            <Label className="text-xs font-semibold cursor-pointer">ใช้ที่อยู่เดียวกับใบกำกับภาษี</Label>
                          </div>
                        </div>

                        {!sameAddress && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>จังหวัด/อำเภอ/ตำบล</Label>
                              <div className="grid grid-cols-3 gap-2">
                                <Popover open={shippingProvinceOpen} onOpenChange={setShippingProvinceOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between">
                                      <span className="truncate">{newCustomer.shippingProvince || "จังหวัด"}</span>
                                      <ChevronDown className="h-3 w-3 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[200px] p-0 shadow-lg border-primary/20">
                                    <Command>
                                      <CommandInput placeholder="ค้นหา..." />
                                      <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                                      <CommandGroup className="max-h-60 overflow-y-auto">
                                        {thaiProvinces.map(p => (
                                          <CommandItem key={p} onSelect={() => {
                                            setNewCustomer({ ...newCustomer, shippingProvince: p, shippingDistrict: "", shippingSubdistrict: "" });
                                            setShippingProvinceOpen(false);
                                          }}>
                                            {p}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <Popover open={shippingDistrictOpen} onOpenChange={setShippingDistrictOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between" disabled={!newCustomer.shippingProvince}>
                                      <span className="truncate">{newCustomer.shippingDistrict || "อำเภอ"}</span>
                                      <ChevronDown className="h-3 w-3 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[200px] p-0 shadow-lg border-primary/20">
                                    <Command>
                                      <CommandInput placeholder="ค้นหา..." />
                                      <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                                      <CommandGroup className="max-h-60 overflow-y-auto">
                                        {shippingDistricts.map(d => (
                                          <CommandItem key={d.id} onSelect={() => {
                                            setNewCustomer({ ...newCustomer, shippingDistrict: d.name_th, shippingSubdistrict: "", shippingPostcode: "" });
                                            setShippingDistrictOpen(false);
                                          }}>
                                            {d.name_th}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                                <Popover open={shippingSubdistrictOpen} onOpenChange={setShippingSubdistrictOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-between" disabled={!newCustomer.shippingDistrict}>
                                      <span className="truncate">{newCustomer.shippingSubdistrict || "ตำบล"}</span>
                                      <ChevronDown className="h-3 w-3 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[200px] p-0 shadow-lg border-primary/20">
                                    <Command>
                                      <CommandInput placeholder="ค้นหา..." />
                                      <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                                      <CommandGroup className="max-h-60 overflow-y-auto">
                                        {shippingSubdistricts.map(s => (
                                          <CommandItem key={s.id} onSelect={() => {
                                            setNewCustomer({ ...newCustomer, shippingSubdistrict: s.name_th, shippingPostcode: String(s.zip_code || '') });
                                            setShippingSubdistrictOpen(false);
                                          }}>
                                            {s.name_th}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>รหัสไปรษณีย์</Label>
                              <Input
                                value={newCustomer.shippingPostcode}
                                onChange={(e) => setNewCustomer({ ...newCustomer, shippingPostcode: e.target.value.replace(/\D/g, '').slice(0, 5) })}
                                placeholder="XXXXX"
                                maxLength={5}
                              />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                              <Label>รายละเอียดที่อยู่ (บ้านเลขที่, ถนน)</Label>
                              <Textarea
                                value={newCustomer.shippingAddress}
                                onChange={(e) => setNewCustomer({ ...newCustomer, shippingAddress: e.target.value })}
                                placeholder="ที่อยู่สำหรับจัดส่ง..."
                                className="bg-background resize-none"
                                rows={2}
                              />
                            </div>
                          </div>
                        )}
                        {sameAddress && (
                          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 flex flex-col items-center justify-center gap-3 animate-in zoom-in-95 duration-200">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                              <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <p className="text-sm font-medium text-primary">ใช้ที่อยู่เดียวกันกับใบกำกับภาษีเรียบร้อยแล้ว</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {addStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2" id="field-contactName">
                          <Label htmlFor="contactName" className="font-semibold flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            ชื่อผู้ติดต่อ <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="contactName"
                            value={newCustomer.contactName}
                            onChange={(e) => {
                              setNewCustomer({ ...newCustomer, contactName: e.target.value });
                              if (e.target.value.trim()) setFormErrors(prev => { const n = { ...prev }; delete n.contactName; return n; });
                            }}
                            placeholder="ระบุชื่อจริง-นามสกุล"
                            className={cn(formErrors.contactName && "border-red-500 ring-red-500")}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lineId" className="font-semibold flex items-center gap-2">
                            <Mail className="w-4 h-4 text-primary" />
                            LINE ID
                          </Label>
                          <Input
                            id="lineId"
                            value={newCustomer.lineId}
                            onChange={(e) => setNewCustomer({ ...newCustomer, lineId: e.target.value })}
                            placeholder="Line ID"
                          />
                        </div>

                        <div className="space-y-4 md:col-span-2 p-4 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between">
                            <Label className="font-bold flex items-center gap-2">
                              <Phone className="w-4 h-4 text-primary" />
                              เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                            </Label>
                            <Button type="button" variant="outline" size="sm" onClick={addPhoneNumber} className="h-7 text-[10px] gap-1 px-2">
                              + เพิ่มเบอร์
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {newCustomer.phoneNumbers.map((phone, idx) => (
                              <div key={idx} className="flex gap-2">
                                <Input
                                  value={phone}
                                  onChange={(e) => updatePhoneNumber(idx, e.target.value)}
                                  placeholder="0XX-XXX-XXXX"
                                  maxLength={12}
                                  className={cn("bg-background", idx === 0 && formErrors.phone && "border-red-500 ring-red-500")}
                                />
                                {newCustomer.phoneNumbers.length > 1 && (
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removePhoneNumber(idx)} className="text-red-500 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                          {formErrors.phone && <p className="text-xs text-red-500 font-medium">{formErrors.phone}</p>}
                        </div>

                        <div className="space-y-4 md:col-span-2 p-4 border rounded-lg bg-muted/30">
                          <div className="flex items-center justify-between">
                            <Label className="font-bold flex items-center gap-2">
                              <Mail className="w-4 h-4 text-primary" />
                              อีเมล
                            </Label>
                            <Button type="button" variant="outline" size="sm" onClick={addEmail} className="h-7 text-[10px] gap-1 px-2">
                              + เพิ่มอีเมล
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {newCustomer.emails.map((email, idx) => (
                              <div key={idx} className="flex gap-2">
                                <Input
                                  value={email}
                                  onChange={(e) => updateEmail(idx, e.target.value)}
                                  placeholder="example@mail.com"
                                  className="bg-background"
                                />
                                {newCustomer.emails.length > 1 && (
                                  <Button type="button" variant="ghost" size="icon" onClick={() => removeEmail(idx)} className="text-red-500 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {addStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="font-semibold">สถานะการนำเสนอ</Label>
                          <Select value={newCustomer.presentationStatus} onValueChange={(value) => setNewCustomer({ ...newCustomer, presentationStatus: value })}>
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                              <SelectItem value="เสนอขาย">เสนอขาย</SelectItem>
                              <SelectItem value="นำเสนอแล้ว">นำเสนอแล้ว</SelectItem>
                              <SelectItem value="รอตัดสินใจ">รอตัดสินใจ</SelectItem>
                              <SelectItem value="ปิดการขาย">ปิดการขาย</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="font-semibold">ผู้รับผิดชอบ (Sales)</Label>
                          <Select value={newCustomer.responsiblePerson} onValueChange={(value) => setNewCustomer({ ...newCustomer, responsiblePerson: value })}>
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                              {salesOwners.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="md:col-span-2 space-y-3" id="field-interestedProducts">
                          <Label className="font-semibold flex items-center gap-2">
                            <Package className="w-4 h-4 text-primary" />
                            สินค้าที่สนใจ <span className="text-red-500">*</span>
                          </Label>
                          <div className={cn(
                            "flex flex-wrap gap-2 p-3 border rounded-lg bg-background",
                            formErrors.interestedProducts && "border-red-500 ring-red-500"
                          )}>
                            {productTags.map(tag => (
                              <Badge key={tag}
                                variant={newCustomer.interestedProducts.includes(tag) ? "default" : "outline"}
                                className={cn("cursor-pointer select-none", newCustomer.interestedProducts.includes(tag) ? "bg-primary" : "hover:border-primary")}
                                onClick={() => toggleProductTag(tag)}>
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          {formErrors.interestedProducts && <p className="text-xs text-red-500 font-medium">{formErrors.interestedProducts}</p>}
                        </div>

                        <div className="space-y-2">
                          <Label className="font-semibold">สถานะลูกค้า</Label>
                          <Select value={newCustomer.customerStatus} onValueChange={(value) => setNewCustomer({ ...newCustomer, customerStatus: value })}>
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                              <SelectItem value="ลูกค้าใหม่">ลูกค้าใหม่</SelectItem>
                              <SelectItem value="ลูกค้าเก่า">ลูกค้าเก่า</SelectItem>
                              <SelectItem value="ลูกค้า VIP">ลูกค้า VIP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="font-semibold">ช่องทางที่รู้จักเรา</Label>
                          <Select value={newCustomer.howFoundUs} onValueChange={(value) => setNewCustomer({ ...newCustomer, howFoundUs: value })}>
                            <SelectTrigger className="bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                              <SelectItem value="Facebook">Facebook</SelectItem>
                              <SelectItem value="Google">Google</SelectItem>
                              <SelectItem value="ลูกค้าแนะนำ">ลูกค้าแนะนำ</SelectItem>
                              <SelectItem value="อื่นๆ">อื่นๆ</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {newCustomer.howFoundUs === "อื่นๆ" && (
                          <div className="space-y-2 animate-in zoom-in-95">
                            <Label>โปรดระบุอื่นๆ</Label>
                            <Input value={newCustomer.otherChannel} onChange={(e) => setNewCustomer({ ...newCustomer, otherChannel: e.target.value })} placeholder="..." />
                          </div>
                        )}

                        <div className="md:col-span-2 space-y-2">
                          <Label className="font-semibold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            หมายเหตุ / ข้อมูลเพิ่มเติม
                          </Label>
                          <Textarea
                            value={newCustomer.notes}
                            onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                            placeholder="บันทึกรายละเอียดเพิ่มเติม..."
                            className="bg-background resize-none"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Wizard Footer */}
                <div className="flex items-center justify-between pt-8 mt-6 border-t font-semibold">
                  <Button type="button" variant="ghost" onClick={() => {
                    if (addStep > 0) setAddStep(s => s - 1);
                    else setIsAddCustomerOpen(false);
                  }} className="gap-2">
                    {addStep === 0 ? "ยกเลิก" : <><ArrowLeft className="w-4 h-4" /> ย้อนกลับ</>}
                  </Button>

                  <div className="flex items-center gap-3">
                    {addStep < 3 ? (
                      <Button type="button" onClick={() => {
                        // Basic step validation
                        if (addStep === 0 && !newCustomer.companyName.trim()) {
                          setFormErrors({ companyName: "กรุณากรอกชื่อบริษัท" });
                          return;
                        }
                        setAddStep(s => s + 1);
                      }} className="bg-primary hover:bg-primary/90 gap-2 px-8">
                        ถัดไป <ArrowRight className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button type="submit" className="bg-green-600 hover:bg-green-700 gap-2 px-8 shadow-md">
                        <Save className="w-4 h-4" /> บันทึกลูกค้า
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Dashboard - Interactive Filter Cards */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">สรุปภาพรวม</h2>
            <p className="text-muted-foreground text-sm">คลิกการ์ดเพื่อกรองข้อมูลลูกค้า</p>
          </div>
          {cardFilter && (
            <Button variant="ghost" size="sm" onClick={() => setCardFilter(null)} className="text-xs gap-1">
              <X className="w-3 h-3" /> ล้างตัวกรองการ์ด
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[80px]" />
                  <Skeleton className="h-7 w-[40px]" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: "total", label: "ลูกค้าทั้งหมด", count: cardCounts.total, icon: <Users className="w-4 h-4" />, color: "text-primary" },
              { key: "ลูกค้าใหม่", label: "ลูกค้าใหม่", count: cardCounts.new, icon: <UserPlus className="w-4 h-4" />, color: "text-blue-600" },
              { key: "ลูกค้าประจำ", label: "ลูกค้าประจำ", count: cardCounts.regular, icon: <User className="w-4 h-4" />, color: "text-emerald-600" },
              { key: "ลูกค้า VIP", label: "ลูกค้า VIP", count: cardCounts.vip, icon: <Package className="w-4 h-4" />, color: "text-amber-600" },
              { key: "inactive", label: "ไม่ติดต่อ >30 วัน", count: cardCounts.inactive, icon: <Clock className="w-4 h-4" />, color: "text-destructive" },
            ].map((card) => (
              <Card
                key={card.key}
                className={cn(
                  "p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-2",
                  cardFilter === card.key
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-transparent hover:border-primary/30"
                )}
                onClick={() => setCardFilter(cardFilter === card.key ? null : card.key)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
                  <span className={card.color}>{card.icon}</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{card.count}</div>
                {cardFilter === card.key && (
                  <div className="text-[10px] text-primary font-medium mt-1">● กำลังกรอง</div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Main Content - Use remaining space */}
      <div className="flex-1 flex flex-col min-h-0">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              ค้นหาลูกค้า
            </CardTitle>

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="ค้นหาทุกฟิลด์ (ชื่อ, เบอร์โทร, ที่อยู่, หมายเหตุ...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="gap-2 shrink-0" onClick={() => setIsAdvancedSearchOpen(true)}>
                  <SlidersHorizontal className="w-4 h-4" />
                  ค้นหาขั้นสูง
                </Button>
              </div>

              {/* Advanced Filters */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="w-4 h-4" />
                  <span>ตัวกรองขั้นสูง:</span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Select value={salesOwnerFilter} onValueChange={setSalesOwnerFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="เซลล์ที่รับผิดชอบ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกเซลล์</SelectItem>
                      {salesOwners.map(owner => (
                        <SelectItem key={owner} value={owner}>{owner}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={productFilter} onValueChange={setProductFilter}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="หมวดหมู่สินค้า" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
                      {productTags.map(tag => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={businessTypeFilter} onValueChange={setBusinessTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="ประเภทธุรกิจ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกประเภท</SelectItem>
                      <SelectItem value="องค์กร">องค์กร</SelectItem>
                      <SelectItem value="โรงเรียน">โรงเรียน</SelectItem>
                      <SelectItem value="หน่วยงาน">หน่วยงาน</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="สถานะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกสถานะ</SelectItem>
                      <SelectItem value="ลูกค้าใหม่">ลูกค้าใหม่</SelectItem>
                      <SelectItem value="ลูกค้าประจำ">ลูกค้าประจำ</SelectItem>
                      <SelectItem value="ลูกค้า VIP">ลูกค้า VIP</SelectItem>
                    </SelectContent>
                  </Select>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className={cn(
                          "w-56 justify-start text-left font-normal",
                          !dateRange && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "dd/MM/yyyy")} -{" "}
                              {format(dateRange.to, "dd/MM/yyyy")}
                            </>
                          ) : (
                            format(dateRange.from, "dd/MM/yyyy")
                          )
                        ) : (
                          <span>ช่วงวันที่ติดต่อล่าสุด</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={setDateRange}
                        numberOfMonths={2}
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>

                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4 mr-1" />
                      ล้างตัวกรอง
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            <div className="h-full overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[250px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1 group">
                        ชื่อลูกค้า/บริษัท
                        {sortConfig.key === 'name' ? (
                          <ChevronDown className={cn("h-4 w-4 text-primary transition-transform", sortConfig.direction === 'desc' && "rotate-180")} />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        <div onClick={(e) => e.stopPropagation()}><ColumnFilterDropdown columnKey="name" label="ชื่อ" /></div>
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('salesStatus')}>
                      <div className="flex items-center gap-1 group">
                        สถานะการขาย
                        {sortConfig.key === 'salesStatus' ? (
                          <ChevronDown className={cn("h-4 w-4 text-primary transition-transform", sortConfig.direction === 'desc' && "rotate-180")} />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        <div onClick={(e) => e.stopPropagation()}><ColumnFilterDropdown columnKey="salesStatus" label="สถานะ" options={['ใหม่', 'เสนอราคา', 'ผลิต', 'ปิดงาน']} /></div>
                      </div>
                    </TableHead>
                    <TableHead className="w-[200px]">Next Action</TableHead>
                    <TableHead className="w-[120px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('salesOwner')}>
                      <div className="flex items-center gap-1 group">
                        เซลล์เจ้าของ
                        {sortConfig.key === 'salesOwner' ? (
                          <ChevronDown className={cn("h-4 w-4 text-primary transition-transform", sortConfig.direction === 'desc' && "rotate-180")} />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        <div onClick={(e) => e.stopPropagation()}><ColumnFilterDropdown columnKey="salesOwner" label="เซลล์" options={salesOwners} /></div>
                      </div>
                    </TableHead>
                    <TableHead className="w-[130px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1 group">
                        สถานะลูกค้า
                        {sortConfig.key === 'status' ? (
                          <ChevronDown className={cn("h-4 w-4 text-primary transition-transform", sortConfig.direction === 'desc' && "rotate-180")} />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        <div onClick={(e) => e.stopPropagation()}><ColumnFilterDropdown columnKey="status" label="สถานะ" options={['ลูกค้าใหม่', 'ลูกค้าประจำ', 'ลูกค้า VIP']} /></div>
                      </div>
                    </TableHead>
                    <TableHead className="w-[130px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('lastContact')}>
                      <div className="flex items-center gap-1 group">
                        ติดต่อล่าสุด
                        {sortConfig.key === 'lastContact' ? (
                          <ChevronDown className={cn("h-4 w-4 text-primary transition-transform", sortConfig.direction === 'desc' && "rotate-180")} />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        <div onClick={(e) => e.stopPropagation()}><ColumnFilterDropdown columnKey="lastContact" label="วันที่" /></div>
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('contactCount')}>
                      <div className="flex items-center justify-center gap-1 group">
                        จำนวนครั้งที่ติดต่อ
                        {sortConfig.key === 'contactCount' ? (
                          <ChevronDown className={cn("h-4 w-4 text-primary transition-transform", sortConfig.direction === 'desc' && "rotate-180")} />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px] text-center cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('totalOrders')}>
                      <div className="flex items-center justify-center gap-1 group">
                        จำนวนสั่งซื้อ
                        {sortConfig.key === 'totalOrders' ? (
                          <ChevronDown className={cn("h-4 w-4 text-primary transition-transform", sortConfig.direction === 'desc' && "rotate-180")} />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px] text-right cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleSort('totalValue')}>
                      <div className="flex items-center justify-end gap-1 group">
                        ยอดสั่งซื้อรวม
                        {sortConfig.key === 'totalValue' ? (
                          <ChevronDown className={cn("h-4 w-4 text-primary transition-transform", sortConfig.direction === 'desc' && "rotate-180")} />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[70px] text-center">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableSkeleton />
                  ) : filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10}>
                        <EmptyState />
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedCustomers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        id={`customer-row-${customer.id}`}
                        className={cn(
                          "cursor-pointer transition-all duration-500 hover:bg-accent/50",
                          selectedCustomer?.id === customer.id && "bg-accent",
                          newlyAddedId === customer.id && "bg-primary/10 ring-2 ring-primary/20"
                        )}
                        onClick={() => navigate(`/sales/customers/${customer.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold flex items-center">
                              {highlightText(customer.name, activeSearchTerm)}
                              {duplicateNames.includes(customer.name.trim().toLowerCase()) && (
                                <Badge variant="destructive" className="ml-2 text-[8px] h-3.5 px-1 py-0 font-normal opacity-80">
                                  ชื่อซ้ำ
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">{highlightText(customer.contact, activeSearchTerm)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getSalesStatusColor(customer.salesStatus)}>
                            {customer.salesStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium">{highlightText(customer.nextAction, activeSearchTerm)}</div>
                            <div className="text-xs text-muted-foreground">
                              {customer.nextActionDate && customer.nextActionDate !== "0000-00-00" && customer.nextActionDate !== "0000-00-00 00:00:00"
                                ? `กำหนด: ${formatNextActionDate(customer.nextActionDate)}`
                                : formatNextActionDate(customer.nextActionDate)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="w-3 h-3 text-primary" />
                            </div>
                            <span className="text-sm">{highlightText(customer.salesOwner, activeSearchTerm)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(customer.status)}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{highlightText(customer.lastContact, activeSearchTerm)}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            {customer.contactCount}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="font-mono">
                            {customer.totalOrders}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {customer.totalValue.toLocaleString('th-TH')} ฿
                        </TableCell>
                        <TableCell className="text-center">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>ยืนยันการลบลูกค้า</AlertDialogTitle>
                                <AlertDialogDescription>
                                  คุณแน่ใจหรือไม่ที่จะลบข้อมูลของ "{customer.name}"?
                                  การลบจะทำให้ข้อมูลทั้งหมดถูกลบออกจากระบบและไม่สามารถกู้คืนได้
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const res = await fetch(`${API_BASE_URL}/customers.php?id=${customer.id}`, { method: 'DELETE' });
                                      const json = await res.json();
                                      if (!res.ok || json.status === 'error') throw new Error(json.message);
                                      toast({ title: "สำเร็จ", description: `ลบข้อมูล "${customer.name}" เรียบร้อยแล้ว` });
                                      fetchCustomers();
                                    } catch (err: any) {
                                      toast({ title: "เกิดข้อผิดพลาด", description: err.message || "ไม่สามารถลบข้อมูลได้", variant: "destructive" });
                                    }
                                  }}
                                >
                                  ยืนยันการลบ
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination UI */}
        {filteredCustomers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>แสดง</span>
              <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>จาก {filteredCustomers.length} รายการ</span>
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

      {/* Advanced Search Modal */}
      <Dialog open={isAdvancedSearchOpen} onOpenChange={setIsAdvancedSearchOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5" />
              ค้นหาขั้นสูง
            </DialogTitle>
            <DialogDescription>ระบุเงื่อนไขหลายข้อพร้อมกันเพื่อค้นหาลูกค้าที่ต้องการ</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>ชื่อบริษัท</Label>
              <Input value={advancedSearch.companyName} onChange={(e) => setAdvancedSearch(prev => ({ ...prev, companyName: e.target.value }))} placeholder="ชื่อบริษัท..." />
            </div>
            <div className="space-y-2">
              <Label>ชื่อผู้ติดต่อ</Label>
              <Input value={advancedSearch.contactPerson} onChange={(e) => setAdvancedSearch(prev => ({ ...prev, contactPerson: e.target.value }))} placeholder="ชื่อ-นามสกุล..." />
            </div>
            <div className="space-y-2">
              <Label>เบอร์โทรศัพท์</Label>
              <Input value={advancedSearch.phone} onChange={(e) => setAdvancedSearch(prev => ({ ...prev, phone: e.target.value }))} placeholder="0XX-XXX-XXXX" />
            </div>
            <div className="space-y-2">
              <Label>อีเมล</Label>
              <Input value={advancedSearch.email} onChange={(e) => setAdvancedSearch(prev => ({ ...prev, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <Label>Line ID</Label>
              <Input value={advancedSearch.lineId} onChange={(e) => setAdvancedSearch(prev => ({ ...prev, lineId: e.target.value }))} placeholder="@lineid" />
            </div>
            <div className="space-y-2">
              <Label>ที่อยู่</Label>
              <Input value={advancedSearch.address} onChange={(e) => setAdvancedSearch(prev => ({ ...prev, address: e.target.value }))} placeholder="จังหวัด, ถนน..." />
            </div>
            <div className="space-y-2">
              <Label>สถานะลูกค้า</Label>
              <Select value={advancedSearch.status} onValueChange={(v) => setAdvancedSearch(prev => ({ ...prev, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="ลูกค้าใหม่">ลูกค้าใหม่</SelectItem>
                  <SelectItem value="ลูกค้าประจำ">ลูกค้าประจำ</SelectItem>
                  <SelectItem value="ลูกค้า VIP">ลูกค้า VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ผู้รับผิดชอบ</Label>
              <Select value={advancedSearch.responsiblePerson} onValueChange={(v) => setAdvancedSearch(prev => ({ ...prev, responsiblePerson: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {salesOwners.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>หมายเหตุ</Label>
              <Input value={advancedSearch.notes} onChange={(e) => setAdvancedSearch(prev => ({ ...prev, notes: e.target.value }))} placeholder="ค้นหาในหมายเหตุ..." />
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setAdvancedSearch({ companyName: "", contactPerson: "", phone: "", email: "", lineId: "", address: "", status: "all", source: "all", responsiblePerson: "all", notes: "" })}>
              ล้างเงื่อนไข
            </Button>
            <Button onClick={() => setIsAdvancedSearchOpen(false)}>
              ค้นหา
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}
