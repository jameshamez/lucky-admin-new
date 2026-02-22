import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ActivityForm } from "@/components/sales/ActivityForm";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowLeft,
  Phone, 
  Mail, 
  MapPin,
  Calendar,
  Package,
  FileText,
  MessageCircle,
  Edit,
  Save,
  Plus,
  Download,
  Upload,
  Clock,
  DollarSign,
  User,
  Building,
  Trash2,
  Eye,
  Heart,
  AlertCircle,
  CheckCircle2,
  Target,
  ExternalLink,
  ShoppingCart,
  Crown,
  Image,
  Palette,
  CreditCard,
  Video,
  Presentation
} from "lucide-react";

// Mock activity timeline data
const activityTimeline = [
  {
    id: 1,
    type: "call",
    title: "โทรศัพท์ติดตาม",
    description: "ติดตามสถานะใบเสนอราคา Q2024-001",
    date: "2024-01-15 14:30",
    status: "สมบูรณ์",
    result: "ลูกค้าสนใจ รอตัดสินใจ"
  },
  {
    id: 2,
    type: "email",
    title: "ส่งใบเสนอราคา",
    description: "ส่งใบเสนอราคาโครงการป้ายพรีเมียม 50 ป้าย",
    date: "2024-01-12 10:15",
    status: "สมบูรณ์",
    result: "ส่งเรียบร้อย รอลูกค้าตอบกลับ"
  },
  {
    id: 3,
    type: "meeting",
    title: "การประชุมพรีเซนต์",
    description: "นำเสนอแผนการผลิตป้ายและไทม์ไลน์การส่งมอบ",
    date: "2024-01-10 09:00",
    status: "สมบูรณ์",
    result: "ลูกค้าขอแก้ไขแบบ 2 รายการ"
  },
  {
    id: 4,
    type: "visit",
    title: "เข้าพบลูกค้า",
    description: "สำรวจพื้นที่และขอบเขตงานเบื้องต้น",
    date: "2024-01-08 13:30",
    status: "สมบูรณ์",
    result: "ได้ข้อมูลครบถ้วน พร้อมเสนอราคา"
  }
];

// Mock CRM data for customer
const mockCustomerCRM = {
  salesStatus: 'เสนอราคา' as const,
  nextAction: 'โทรติดตามใบเสนอราคา',
  nextActionDate: '2024-01-20',
  salesOwner: 'สมชาย',
  source: 'Facebook Ads',
  interestedProducts: 'ป้ายไวนิล, แสตนดี้, ป้ายพรีเมียม'
};

// Mock orders data
const orderHistory = [
  {
    id: "ORD-001",
    title: "ป้ายพรีเมียมสำหรับงานกิจกรรม",
    amount: 85000,
    paidAmount: 50000,
    status: "กำลังผลิต",
    date: "2024-01-10",
    items: 25
  },
  {
    id: "ORD-002",
    title: "ป้ายแสตนดี้สำหรับประชุม",
    amount: 45000,
    paidAmount: 45000,
    status: "ส่งมอบแล้ว",
    date: "2023-12-15",
    items: 15
  },
  {
    id: "ORD-003",
    title: "ป้ายไวนิลขนาดใหญ่",
    amount: 120000,
    paidAmount: 120000,
    status: "ส่งมอบแล้ว",
    date: "2023-11-20",
    items: 10
  }
];

// Mock design files data with versions
const designFiles = [
  {
    id: 1,
    name: "เหรียญรางวัลกีฬาสี 2024",
    version: "Final",
    thumbnail: "/placeholder.svg",
    date: "2024-01-18",
    uploadedBy: "กราฟิก",
    department: "design"
  },
  {
    id: 2,
    name: "โล่เกียรติคุณ VIP",
    version: "V2",
    thumbnail: "/placeholder.svg",
    date: "2024-01-15",
    uploadedBy: "สมชาย",
    department: "sales"
  },
  {
    id: 3,
    name: "ถ้วยรางวัลการแข่งขัน",
    version: "V1",
    thumbnail: "/placeholder.svg",
    date: "2024-01-12",
    uploadedBy: "กราฟิก",
    department: "design"
  },
  {
    id: 4,
    name: "เสื้อทีมกีฬา",
    version: "Final",
    thumbnail: "/placeholder.svg",
    date: "2024-01-10",
    uploadedBy: "ลูกค้า",
    department: "customer"
  }
];

// Calculate outstanding balance
const calculateOutstandingBalance = () => {
  return orderHistory.reduce((total, order) => {
    return total + (order.amount - order.paidAmount);
  }, 0);
};

// Mock VIP status
const customerImportance = (totalValue: number): { level: 'VIP' | 'General'; color: string } => {
  if (totalValue >= 200000) {
    return { level: 'VIP', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  }
  return { level: 'General', color: 'bg-gray-100 text-gray-800 border-gray-200' };
};

// Mock documents data
const documents = [
  {
    id: 1,
    name: "สัญญาการผลิตป้าย 2024",
    type: "PDF",
    size: "2.4 MB",
    date: "2024-01-05",
    category: "สัญญา"
  },
  {
    id: 2,
    name: "ใบเสนอราคา Q2024-001",
    type: "PDF", 
    size: "1.2 MB",
    date: "2024-01-12",
    category: "ใบเสนอราคา"
  },
  {
    id: 3,
    name: "แบบร่างป้าย Premium Series",
    type: "PNG",
    size: "5.8 MB", 
    date: "2024-01-08",
    category: "แบบร่าง"
  }
];

export default function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [newNote, setNewNote] = useState("");
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isActivityFormOpen, setIsActivityFormOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [isActivityDetailOpen, setIsActivityDetailOpen] = useState(false);
  const [notes, setNotes] = useState([
    {
      id: 1,
      content: "ลูกค้ามีความต้องการป้ายคุณภาพสูง เน้นความทนทาน",
      date: "2024-01-15 14:45",
      author: "สมชาย (เซลล์)"
    },
    {
      id: 2,
      content: "ต้องการการส่งมอบแบบเร่งด่วน สำหรับงานกิจกรรมเดือนหน้า",
      date: "2024-01-10 11:20",
      author: "สมหญิง (เซลล์)"
    }
  ]);

  // Fetch activities from database
  const fetchActivities = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('customer_activities')
        .select('*')
        .eq('customer_id', id)
        .order('start_datetime', { ascending: false });

      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }

      setActivities(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleActivityClick = (activity: any) => {
    setSelectedActivity(activity);
    setIsActivityDetailOpen(true);
  };

  const handleEditActivity = () => {
    setIsActivityDetailOpen(false);
    setIsActivityFormOpen(true);
  };

  const handleDeleteActivity = async () => {
    if (!selectedActivity) return;

    try {
      const { error } = await supabase
        .from('customer_activities')
        .delete()
        .eq('id', selectedActivity.id);

      if (error) throw error;

      toast({
        title: "สำเร็จ",
        description: "ลบกิจกรรมเรียบร้อยแล้ว"
      });

      fetchActivities();
      setIsActivityDetailOpen(false);
      setSelectedActivity(null);
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบกิจกรรมได้",
        variant: "destructive"
      });
    }
  };

  const handleActivityFormClose = () => {
    setIsActivityFormOpen(false);
    setSelectedActivity(null);
  };

  const handleActivitySaved = () => {
    setIsActivityFormOpen(false);
    fetchActivities(); // Refresh activities list
  };

  // Fetch customer data from Supabase
  useEffect(() => {
    async function fetchCustomer() {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setCustomer(data);
      } catch (error) {
        console.error('Error fetching customer:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลลูกค้าได้",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCustomer();
    fetchActivities();
  }, [id, toast]);

  const addNote = () => {
    if (newNote.trim()) {
      const note = {
        id: notes.length + 1,
        content: newNote,
        date: new Date().toLocaleString('th-TH'),
        author: "ผู้ใช้ปัจจุบัน"
      };
      setNotes([note, ...notes]);
      setNewNote("");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ลูกค้าเก่า": return "bg-green-100 text-green-800 border-green-200";
      case "ลูกค้าใหม่": return "bg-blue-100 text-blue-800 border-blue-200";
      case "ลูกค้าเป้าหมาย": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case "โทรศัพท์": return <Phone className="w-4 h-4 text-blue-600" />;
      case "อีเมล": return <Mail className="w-4 h-4 text-green-600" />;
      case "การประชุม": return <Calendar className="w-4 h-4 text-purple-600" />;
      case "เยี่ยมชม": return <User className="w-4 h-4 text-orange-600" />;
      case "ใบเสนอราคา": return <FileText className="w-4 h-4 text-indigo-600" />;
      case "งานกราฟิก": return <Image className="w-4 h-4 text-pink-600" />;
      case "นำเสนอ": return <Presentation className="w-4 h-4 text-teal-600" />;
      default: return <MessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDepartmentBadge = (department: string) => {
    switch (department) {
      case "sales": return <Badge className="bg-blue-100 text-blue-800 border-blue-200">เซลล์</Badge>;
      case "design": return <Badge className="bg-pink-100 text-pink-800 border-pink-200">กราฟิก</Badge>;
      case "production": return <Badge className="bg-orange-100 text-orange-800 border-orange-200">ผลิต</Badge>;
      case "customer": return <Badge className="bg-green-100 text-green-800 border-green-200">ลูกค้า</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800 border-gray-200">{department}</Badge>;
    }
  };

  const getVersionBadge = (version: string) => {
    if (version === "Final") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Final</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{version}</Badge>;
  };

  const outstandingBalance = calculateOutstandingBalance();
  const importance = customerImportance(customer?.total_value || 0);

  // Check if customer has complete data for actions
  const hasCompleteData = customer?.contact_name && customer?.phone_numbers?.length > 0;
  const hasAddress = customer?.address;

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "ส่งมอบแล้ว": return "bg-green-100 text-green-800";
      case "กำลังผลิต": return "bg-blue-100 text-blue-800";
      case "รอการอนุมัติ": return "bg-yellow-100 text-yellow-800";
      case "ยกเลิก": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
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

  // Calculate Customer Health based on last contact date
  const getCustomerHealth = () => {
    if (!customer?.last_contact_date) return { color: 'red', label: 'ไม่มีข้อมูล', icon: AlertCircle };
    
    const lastContact = new Date(customer.last_contact_date);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 7) {
      return { color: 'green', label: 'ติดต่อปกติ', icon: CheckCircle2, days: daysDiff };
    } else if (daysDiff <= 30) {
      return { color: 'yellow', label: 'ใกล้ครบกำหนด', icon: AlertCircle, days: daysDiff };
    } else {
      return { color: 'red', label: 'ต้องติดตาม', icon: AlertCircle, days: daysDiff };
    }
  };

  const customerHealth = getCustomerHealth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">ไม่พบข้อมูลลูกค้า</p>
          <Button onClick={() => navigate('/sales/customers')} className="mt-4">
            กลับไปหน้าจัดการลูกค้า
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/sales/customers')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับ
            </Button>
            <div>
              <h1 className="text-2xl font-bold">ข้อมูลลูกค้า</h1>
              <p className="text-muted-foreground">รายละเอียดและประวัติการติดต่อ</p>
            </div>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            แก้ไขข้อมูล
          </Button>
        </div>

        {/* Customer Header Card with CRM Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                  {customer.company_name?.charAt(0) || customer.contact_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-semibold">{customer.company_name}</h2>
                  <Badge className={getStatusColor(customer.customer_status)}>
                    {customer.customer_status}
                  </Badge>
                  <Badge className={getSalesStatusColor(mockCustomerCRM.salesStatus)}>
                    {mockCustomerCRM.salesStatus}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.contact_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.phone_numbers?.[0] || 'ไม่มีข้อมูล'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{customer.emails?.[0] || 'ไม่มีข้อมูล'}</span>
                  </div>
                </div>

                {/* Customer Health & Next Action Row */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  {/* Customer Health */}
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    customerHealth.color === 'green' ? 'bg-green-100 text-green-800' :
                    customerHealth.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    <Heart className="w-4 h-4" />
                    <span className="text-sm font-medium">สถานะการติดตาม: {customerHealth.label}</span>
                    {customerHealth.days !== undefined && (
                      <span className="text-xs">({customerHealth.days} วัน)</span>
                    )}
                  </div>

                  {/* Next Action */}
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800">
                    <Target className="w-4 h-4" />
                    <span className="text-sm font-medium">{mockCustomerCRM.nextAction}</span>
                    <span className="text-xs">({new Date(mockCustomerCRM.nextActionDate).toLocaleDateString('th-TH')})</span>
                  </div>

                  {/* Sales Owner */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>เซลล์: {mockCustomerCRM.salesOwner}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right space-y-3">
                {/* VIP Badge */}
                <div className="flex justify-end">
                  <Badge className={`${importance.color} flex items-center gap-1`}>
                    {importance.level === 'VIP' && <Crown className="w-3 h-3" />}
                    {importance.level}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      ฿{customer.total_value?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-muted-foreground">มูลค่ารวม</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ฿{outstandingBalance.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      ยอดค้างชำระ
                    </div>
                  </div>
                </div>
                
                {/* Quick Action Buttons with Tooltips */}
                <TooltipProvider>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setIsActivityFormOpen(true)} className="bg-primary hover:bg-primary/90">
                      <Plus className="w-3 h-3 mr-1" />
                      กิจกรรม
                    </Button>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => navigate('/sales/price-estimation')}
                            disabled={!hasCompleteData}
                            className={!hasCompleteData ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            ใบเสนอราคา
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!hasCompleteData && (
                        <TooltipContent>
                          <p>กรุณากรอกข้อมูลผู้ติดต่อและเบอร์โทรศัพท์ให้ครบก่อน</p>
                        </TooltipContent>
                      )}
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => navigate('/sales/create-order')}
                            disabled={!hasCompleteData || !hasAddress}
                            className={(!hasCompleteData || !hasAddress) ? 'opacity-50 cursor-not-allowed' : ''}
                          >
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            สั่งผลิต
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {(!hasCompleteData || !hasAddress) && (
                        <TooltipContent>
                          <p>{!hasCompleteData ? 'กรุณากรอกข้อมูลผู้ติดต่อให้ครบก่อน' : 'กรุณากรอกที่อยู่ให้ครบก่อน'}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile">ข้อมูลทั่วไป</TabsTrigger>
            <TabsTrigger value="timeline">ไทม์ไลน์กิจกรรม</TabsTrigger>
            <TabsTrigger value="orders">ประวัติคำสั่งซื้อ</TabsTrigger>
            <TabsTrigger value="designs">ไฟล์ออกแบบ</TabsTrigger>
            <TabsTrigger value="notes">หมายเหตุ</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>ข้อมูลการติดต่อ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>บริษัท</Label>
                      <p className="text-sm mt-1">{customer.company_name}</p>
                    </div>
                    <div>
                      <Label>ชื่อผู้ติดต่อ</Label>
                      <p className="text-sm mt-1">{customer.contact_name}</p>
                    </div>
                    <div>
                      <Label>หมายเลขโทรศัพท์</Label>
                      <div className="space-y-1 mt-1">
                        {customer.phone_numbers?.map((phone: string, index: number) => (
                          <p key={index} className="text-sm">{phone}</p>
                        )) || <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>}
                      </div>
                    </div>
                    <div>
                      <Label>อีเมล</Label>
                      <div className="space-y-1 mt-1">
                        {customer.emails?.map((email: string, index: number) => (
                          <p key={index} className="text-sm">{email}</p>
                        )) || <p className="text-sm text-muted-foreground">ไม่มีข้อมูล</p>}
                      </div>
                    </div>
                    <div>
                      <Label>Line ID</Label>
                      <p className="text-sm mt-1">{customer.line_id || 'ไม่มีข้อมูล'}</p>
                    </div>
                    <div>
                      <Label>ที่อยู่</Label>
                      <p className="text-sm mt-1">{customer.address || 'ไม่มีข้อมูล'}</p>
                    </div>
                    <div>
                      <Label>หมายเลขผู้เสียภาษี</Label>
                      <p className="text-sm mt-1">{customer.tax_id || 'ไม่มีข้อมูล'}</p>
                    </div>
                    <div>
                      <Label>หมายเหตุ</Label>
                      <p className="text-sm mt-1">{customer.notes || 'ไม่มีหมายเหตุ'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Sales Info Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>ข้อมูลการขาย</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>เซลล์เจ้าของลูกค้า</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-primary" />
                        </div>
                        <p className="text-sm font-medium">{mockCustomerCRM.salesOwner}</p>
                      </div>
                    </div>
                    <div>
                      <Label>แหล่งที่มา</Label>
                      <p className="text-sm mt-1">{mockCustomerCRM.source}</p>
                    </div>
                    <div>
                      <Label>หมวดสินค้าที่สนใจ</Label>
                      <p className="text-sm mt-1">{mockCustomerCRM.interestedProducts || customer.interested_products || 'ไม่มีข้อมูล'}</p>
                    </div>
                    <div>
                      <Label>สถานะการขาย</Label>
                      <div className="mt-1">
                        <Badge className={getSalesStatusColor(mockCustomerCRM.salesStatus)}>
                          {mockCustomerCRM.salesStatus}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>ช่องทางที่รู้จัก</Label>
                      <p className="text-sm mt-1">{customer.how_found_us || 'ไม่มีข้อมูล'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>สถิติลูกค้า</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">{customer.total_orders}</p>
                        <p className="text-sm text-muted-foreground">ออเดอร์ทั้งหมด</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          ฿{(customer.total_value / 1000).toFixed(0)}K
                        </p>
                        <p className="text-sm text-muted-foreground">มูลค่ารวม</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">ติดต่อล่าสุด</p>
                      <p className="font-medium">{new Date(customer.last_contact_date).toLocaleDateString('th-TH')}</p>
                      <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        customerHealth.color === 'green' ? 'bg-green-100 text-green-800' :
                        customerHealth.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        <Heart className="w-3 h-3" />
                        {customerHealth.label} {customerHealth.days !== undefined && `(${customerHealth.days} วัน)`}
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>สถานะการนำเสนอ:</span>
                        <span className="font-medium">{customer.presentation_status}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>จำนวนการติดต่อ:</span>
                        <span className="font-medium">{customer.contact_count} ครั้ง</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Activity Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    ไทม์ไลน์กิจกรรม
                  </CardTitle>
                  <Button 
                    onClick={() => setIsActivityFormOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มกิจกรรมใหม่
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.length > 0 ? (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => handleActivityClick(activity)}>
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{activity.title}</h4>
                              {/* Department Badge */}
                              {activity.responsible_person && (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                  เซลล์
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={activity.status === 'เสร็จสิ้น' ? 'default' : 'secondary'}>
                                {activity.status}
                              </Badge>
                              <Badge variant={activity.priority === 'สูง' ? 'destructive' : activity.priority === 'ปานกลาง' ? 'default' : 'secondary'}>
                                {activity.priority}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(activity.start_datetime).toLocaleDateString('th-TH')}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              {getActivityIcon(activity.activity_type)}
                              <span>{activity.activity_type}</span>
                            </div>
                            {activity.contact_person && <span>ผู้ติดต่อ: {activity.contact_person}</span>}
                            {activity.responsible_person && <span>ผู้รับผิดชอบ: {activity.responsible_person}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>ยังไม่มีกิจกรรมใดๆ</p>
                      <p className="text-sm">เริ่มต้นด้วยการเพิ่มกิจกรรมแรก</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab with Quick Actions */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    ประวัติคำสั่งซื้อ
                  </CardTitle>
                  <Button onClick={() => navigate('/sales/create-order')} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    สร้างคำสั่งซื้อใหม่
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderHistory.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">{order.title}</h4>
                          <Badge className={getOrderStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span>รหัส: {order.id}</span>
                          <span>จำนวน: {order.items} รายการ</span>
                          <span>วันที่: {new Date(order.date).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold">฿{order.amount.toLocaleString()}</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/sales/order-tracking`);
                          }}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          ดูรายละเอียด
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Design Files Tab - Grid Layout with Versions */}
          <TabsContent value="designs" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    ไฟล์ออกแบบ (Mockup)
                  </CardTitle>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    อัพโหลดไฟล์
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {designFiles.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {designFiles.map((file) => (
                      <div key={file.id} className="border rounded-lg overflow-hidden hover:border-primary transition-colors cursor-pointer group">
                        {/* Thumbnail */}
                        <div className="relative aspect-square bg-muted flex items-center justify-center">
                          <Image className="w-12 h-12 text-muted-foreground/50" />
                          {/* Version Badge */}
                          <div className="absolute top-2 right-2">
                            {getVersionBadge(file.version)}
                          </div>
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="secondary">
                              <Eye className="w-4 h-4 mr-1" />
                              ดู
                            </Button>
                            <Button size="sm" variant="secondary">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {/* File Info */}
                        <div className="p-3 space-y-1">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{new Date(file.date).toLocaleDateString('th-TH')}</span>
                            {getDepartmentBadge(file.department)}
                          </div>
                          <p className="text-xs text-muted-foreground">โดย: {file.uploadedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">ยังไม่มีไฟล์ออกแบบ</p>
                    <p className="text-sm">อัพโหลดไฟล์ Mockup เพื่อแชร์กับลูกค้า</p>
                    <Button variant="outline" size="sm" className="mt-4">
                      <Upload className="w-4 h-4 mr-2" />
                      อัพโหลดไฟล์แรก
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  หมายเหตุและความคิดเห็น
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="เพิ่มหมายเหตุ..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addNote} className="self-end">
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-4 border rounded-lg">
                      <p className="mb-2">{note.content}</p>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{note.author}</span>
                        <span>{note.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Activity Form Dialog */}
        <Dialog open={isActivityFormOpen} onOpenChange={handleActivityFormClose}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedActivity ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมใหม่'}</DialogTitle>
            </DialogHeader>
            <ActivityForm
              customerId={id!}
              activityData={selectedActivity}
              onSave={() => {
                fetchActivities();
                handleActivityFormClose();
              }}
              onCancel={handleActivityFormClose}
            />
          </DialogContent>
        </Dialog>

        {/* Activity Detail Dialog */}
        <Dialog open={isActivityDetailOpen} onOpenChange={setIsActivityDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                รายละเอียดกิจกรรม
              </DialogTitle>
            </DialogHeader>
            
            {selectedActivity && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">ประเภทกิจกรรม</Label>
                    <p className="mt-1 font-medium">{selectedActivity.activity_type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">สถานะ</Label>
                    <div className="mt-1">
                      <Badge variant={selectedActivity.status === 'เสร็จสิ้น' ? 'default' : 'secondary'}>
                        {selectedActivity.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">หัวข้อ</Label>
                  <p className="mt-1 font-medium">{selectedActivity.title}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">รายละเอียด</Label>
                  <p className="mt-1 text-sm">{selectedActivity.description || 'ไม่มีรายละเอียด'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">วันเวลาเริ่มต้น</Label>
                    <p className="mt-1">{new Date(selectedActivity.start_datetime).toLocaleString('th-TH')}</p>
                  </div>
                  {selectedActivity.end_datetime && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">วันเวลาสิ้นสุด</Label>
                      <p className="mt-1">{new Date(selectedActivity.end_datetime).toLocaleString('th-TH')}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">ระดับความสำคัญ</Label>
                    <div className="mt-1">
                      <Badge variant={selectedActivity.priority === 'สูง' ? 'destructive' : selectedActivity.priority === 'ปานกลาง' ? 'default' : 'secondary'}>
                        {selectedActivity.priority}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">การแจ้งเตือน</Label>
                    <p className="mt-1">{selectedActivity.reminder_type}</p>
                  </div>
                </div>

                {(selectedActivity.contact_person || selectedActivity.responsible_person) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedActivity.contact_person && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">ผู้ติดต่อ</Label>
                        <p className="mt-1">{selectedActivity.contact_person}</p>
                      </div>
                    )}
                    {selectedActivity.responsible_person && (
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">ผู้รับผิดชอบ</Label>
                        <p className="mt-1">{selectedActivity.responsible_person}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleEditActivity}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    แก้ไข
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        ลบ
                      </Button>
                    </AlertDialogTrigger>
                    
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการลบกิจกรรม</AlertDialogTitle>
                        <AlertDialogDescription>
                          คุณแน่ใจหรือไม่ที่จะลบกิจกรรม "{selectedActivity.title}" นี้? การดำเนินการนี้ไม่สามารถยกเลิกได้
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteActivity}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          ลบกิจกรรม
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
}