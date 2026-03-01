import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Users,
  FileText,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Circle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = "https://finfinphone.com/api-lucky/admin/sales_settings.php";

export default function SalesSettings() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // States for dynamic data
  const [customerTypes, setCustomerTypes] = useState<any[]>([]);
  const [businessTypes, setBusinessTypes] = useState<any[]>([]);
  const [customerStatus, setCustomerStatus] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [jobTypes, setJobTypes] = useState<any[]>([]);
  const [deliveryFormats, setDeliveryFormats] = useState<any[]>([]);
  const [urgencyLevels, setUrgencyLevels] = useState<any[]>([]);
  const [salesTargets, setSalesTargets] = useState<any[]>([]);
  const [activityTargets, setActivityTargets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      const result = await response.json();
      if (result.status === "success") {
        const { master_data, sales_targets, activity_targets } = result.data;

        setCustomerTypes(master_data.filter((i: any) => i.category === "customer_type"));
        setBusinessTypes(master_data.filter((i: any) => i.category === "business_type"));
        setCustomerStatus(master_data.filter((i: any) => i.category === "customer_status"));
        setChannels(master_data.filter((i: any) => i.category === "channel"));
        setJobTypes(master_data.filter((i: any) => i.category === "job_type"));
        setDeliveryFormats(master_data.filter((i: any) => i.category === "delivery_format"));
        setUrgencyLevels(master_data.filter((i: any) => i.category === "urgency_level"));

        setSalesTargets(sales_targets);
        setActivityTargets(activity_targets);

        // Fetch employees
        const empResponse = await fetch(API_BASE_URL.replace('sales_settings.php', 'employees.php'));
        const empResult = await empResponse.json();
        if (empResult.status === "success") {
          setEmployees(empResult.data);
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("ไม่สามารถโหลดข้อมูลการตั้งค่าได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSaveMasterData = async (name: string, description: string, color: string | null = null) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_master_data",
          id: editingItem?.id,
          category: activeCategory,
          name,
          description,
          color
        })
      });
      const result = await response.json();
      if (result.status === "success") {
        toast.success("บันทึกข้อมูลเรียบร้อยแล้ว");
        setOpenDialog(false);
        fetchAllData();
      } else {
        toast.error("เกิดข้อผิดพลาด: " + result.message);
      }
    } catch (error) {
      toast.error("ไม่สามารถเชื่อมต่อ API ได้");
    }
  };

  const handleDeleteMasterData = async (id: number) => {
    if (!confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}?type=master_data&id=${id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (result.status === "success") {
        toast.success("ลบข้อมูลเรียบร้อยแล้ว");
        fetchAllData();
      } else {
        toast.error("เกิดข้อผิดพลาด: " + result.message);
      }
    } catch (error) {
      toast.error("ไม่สามารถเชื่อมต่อ API ได้");
    }
  };

  const handleSaveSalesTarget = async (data: any) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_sales_target",
          id: editingItem?.id,
          ...data
        })
      });
      const result = await response.json();
      if (result.status === "success") {
        toast.success("บันทึกเป้ายอดขายเรียบร้อยแล้ว");
        setOpenDialog(false);
        fetchAllData();
      } else {
        toast.error("เกิดข้อผิดพลาด: " + result.message);
      }
    } catch (error) {
      toast.error("ไม่สามารถเชื่อมต่อ API ได้");
    }
  };

  const handleDeleteSalesTarget = async (id: number) => {
    if (!confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}?type=sales_targets&id=${id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (result.status === "success") {
        toast.success("ลบข้อมูลเรียบร้อยแล้ว");
        fetchAllData();
      } else {
        toast.error("เกิดข้อผิดพลาด: " + result.message);
      }
    } catch (error) {
      toast.error("ไม่สามารถเชื่อมต่อ API ได้");
    }
  };

  const handleSaveActivityTarget = async (data: any) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_activity_target",
          id: editingItem?.id,
          ...data
        })
      });
      const result = await response.json();
      if (result.status === "success") {
        toast.success("บันทึกเป้าแผนงานเรียบร้อยแล้ว");
        setOpenDialog(false);
        fetchAllData();
      } else {
        toast.error("เกิดข้อผิดพลาด: " + result.message);
      }
    } catch (error) {
      toast.error("ไม่สามารถเชื่อมต่อ API ได้");
    }
  };

  const handleDeleteActivityTarget = async (id: number) => {
    if (!confirm("คุณต้องการลบข้อมูลนี้ใช่หรือไม่?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}?type=activity_targets&id=${id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (result.status === "success") {
        toast.success("ลบข้อมูลเรียบร้อยแล้ว");
        fetchAllData();
      } else {
        toast.error("เกิดข้อผิดพลาด: " + result.message);
      }
    } catch (error) {
      toast.error("ไม่สามารถเชื่อมต่อ API ได้");
    }
  };

  const SettingItem = ({ item, category, onEdit, onDelete }: any) => (
    <TableRow>
      <TableCell className="font-medium">
        {category === "urgency_level" ? (
          <Badge className={item.color}>{item.name}</Badge>
        ) : (
          item.name
        )}
      </TableCell>
      <TableCell className="text-muted-foreground">{item.description}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => { setActiveCategory(category); onEdit(item); setOpenDialog(true); }}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const SettingDialog = ({ title, description, category, onSave }: any) => {
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [color, setColor] = useState("");

    useEffect(() => {
      if (openDialog && activeCategory === category) {
        if (editingItem) {
          setName(editingItem.name);
          setDesc(editingItem.description || "");
          setColor(editingItem.color || "");
        } else {
          setName("");
          setDesc("");
          setColor("");
        }
      }
    }, [editingItem, openDialog, category]);

    return (
      <Dialog open={openDialog && activeCategory === category} onOpenChange={(open) => {
        setOpenDialog(open);
        if (open) setActiveCategory(category);
      }}>
        <DialogTrigger asChild>
          <Button onClick={() => { setEditingItem(null); setActiveCategory(category); }}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มใหม่
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "แก้ไข" : "เพิ่ม"}{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อตัวเลือก *</Label>
              <Input
                id="name"
                placeholder="กรอกชื่อ"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                placeholder="กรอกคำอธิบาย"
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            {category === "urgency_level" && (
              <div className="space-y-2">
                <Label htmlFor="color">สี (Tailwind bg class)</Label>
                <Input
                  id="color"
                  placeholder="เช่น bg-red-500"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            )}
            <Button
              className="w-full"
              onClick={() => onSave(name, desc, color)}
              disabled={!name}
            >
              บันทึก
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const SalesTargetDialog = ({ onSave }: any) => {
    const [targetType, setTargetType] = useState("individual");
    const [subjectName, setSubjectName] = useState("");
    const [periodType, setPeriodType] = useState("monthly");
    const [periodValue, setPeriodValue] = useState("");
    const [targetAmount, setTargetAmount] = useState("");

    useEffect(() => {
      if (editingItem && activeCategory === 'sales_target') {
        setTargetType(editingItem.target_type);
        setSubjectName(editingItem.target_subject_name);
        setPeriodType(editingItem.period_type);
        setPeriodValue(editingItem.period_value);
        setTargetAmount(editingItem.target_amount.toString());
      } else {
        setTargetType("individual");
        setSubjectName("");
        setPeriodType("monthly");
        setPeriodValue("");
        setTargetAmount("");
      }
    }, [editingItem]);

    return (
      <Dialog open={openDialog && activeCategory === 'sales_target'} onOpenChange={setOpenDialog}>
        <DialogTrigger asChild>
          <Button onClick={() => { setEditingItem(null); setActiveCategory('sales_target'); }}>
            <Plus className="w-4 h-4 mr-2" />
            ตั้งเป้าใหม่
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "แก้ไข" : "ตั้ง"}เป้ายอดขาย</DialogTitle>
            <DialogDescription>กำหนดเป้าหมายยอดขายใหม่</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ประเภทเป้าหมาย *</Label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">รายบุคคล</SelectItem>
                  <SelectItem value="team">รายทีม</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ระบุชื่อบุคคล/ทีม *</Label>
              <Select value={subjectName} onValueChange={setSubjectName}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกบุคคลหรือทีม" />
                </SelectTrigger>
                <SelectContent>
                  {targetType === 'individual' ? (
                    employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.full_name}>
                        {emp.full_name} ({emp.nickname})
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="ทีมขาย A">ทีมขาย A</SelectItem>
                      <SelectItem value="ทีมขาย B">ทีมขาย B</SelectItem>
                      <SelectItem value="ทีมทั้งหมด">ทีมทั้งหมด</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ช่วงเวลา *</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">รายเดือน</SelectItem>
                  <SelectItem value="quarterly">รายไตรมาส</SelectItem>
                  <SelectItem value="yearly">รายปี</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>เดือน/ไตรมาส/ปี *</Label>
              <Input value={periodValue} onChange={(e) => setPeriodValue(e.target.value)} placeholder="เช่น 2024-03" />
            </div>
            <div className="space-y-2">
              <Label>เป้ายอดขาย (บาท) *</Label>
              <Input type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} placeholder="500000" />
            </div>
            <Button className="w-full" onClick={() => onSave({
              target_type: targetType,
              target_subject_name: subjectName,
              period_type: periodType,
              period_value: periodValue,
              target_amount: parseFloat(targetAmount)
            })}>บันทึกเป้าหมาย</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const ActivityTargetDialog = ({ onSave }: any) => {
    const [employeeName, setEmployeeName] = useState("");
    const [activityType, setActivityType] = useState("call");
    const [periodType, setPeriodType] = useState("monthly");
    const [targetCount, setTargetCount] = useState("");

    useEffect(() => {
      if (editingItem && activeCategory === 'activity_target') {
        setEmployeeName(editingItem.employee_name);
        setActivityType(editingItem.activity_type);
        setPeriodType(editingItem.period_type);
        setTargetCount(editingItem.target_count.toString());
      } else {
        setEmployeeName("");
        setActivityType("call");
        setPeriodType("monthly");
        setTargetCount("");
      }
    }, [editingItem]);

    return (
      <Dialog open={openDialog && activeCategory === 'activity_target'} onOpenChange={setOpenDialog}>
        <DialogTrigger asChild>
          <Button onClick={() => { setEditingItem(null); setActiveCategory('activity_target'); }}>
            <Plus className="w-4 h-4 mr-2" />
            ตั้งเป้าใหม่
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "แก้ไข" : "ตั้ง"}เป้าการติดต่อ</DialogTitle>
            <DialogDescription>กำหนดเป้าหมายการติดต่อลูกค้าใหม่</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อพนักงาน *</Label>
              <Select value={employeeName} onValueChange={setEmployeeName}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกพนักงาน" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.full_name}>
                      {emp.full_name} ({emp.nickname})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ประเภทกิจกรรม *</Label>
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">โทรศัพท์</SelectItem>
                  <SelectItem value="meeting">นัดพบ</SelectItem>
                  <SelectItem value="email">อีเมล</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ช่วงเวลา *</Label>
              <Select value={periodType} onValueChange={setPeriodType}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">รายวัน</SelectItem>
                  <SelectItem value="weekly">รายสัปดาห์</SelectItem>
                  <SelectItem value="monthly">รายเดือน</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>เป้าหมายจำนวน (ครั้ง) *</Label>
              <Input type="number" value={targetCount} onChange={(e) => setTargetCount(e.target.value)} placeholder="10" />
            </div>
            <Button className="w-full" onClick={() => onSave({
              employee_name: employeeName,
              activity_type: activityType,
              period_type: periodType,
              target_count: parseInt(targetCount)
            })}>บันทึกเป้าหมาย</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">ตั้งค่าการขาย</h2>
          <p className="text-muted-foreground">จัดการข้อมูลพื้นฐานและเป้าหมายการขาย</p>
        </div>
        <Button variant="outline" onClick={fetchAllData}>
          <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </Button>
      </div>

      <Tabs defaultValue="master" className="space-y-4">
        <TabsList>
          <TabsTrigger value="master">
            <Users className="w-4 h-4 mr-2" />
            ข้อมูลลูกค้า
          </TabsTrigger>
          <TabsTrigger value="sales">
            <FileText className="w-4 h-4 mr-2" />
            การขายและใบเสนอราคา
          </TabsTrigger>
          <TabsTrigger value="kpi">
            <Target className="w-4 h-4 mr-2" />
            KPI และเป้าหมาย
          </TabsTrigger>
        </TabsList>

        <TabsContent value="master" className="space-y-4">
          {/* Customer Types */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ประเภทลูกค้า</CardTitle>
                  <CardDescription>จัดการประเภทของลูกค้า</CardDescription>
                </div>
                <SettingDialog
                  title="ประเภทลูกค้า"
                  category="customer_type"
                  description="เพิ่มประเภทลูกค้าใหม่"
                  onSave={handleSaveMasterData}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell>
                    </TableRow>
                  ) : (
                    customerTypes.map((item) => (
                      <SettingItem
                        key={item.id}
                        item={item}
                        category="customer_type"
                        onEdit={setEditingItem}
                        onDelete={handleDeleteMasterData}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Business Types */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ประเภทธุรกิจ</CardTitle>
                  <CardDescription>จัดการประเภทธุรกิจของลูกค้า</CardDescription>
                </div>
                <SettingDialog
                  title="ประเภทธุรกิจ"
                  category="business_type"
                  description="เพิ่มประเภทธุรกิจใหม่"
                  onSave={handleSaveMasterData}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businessTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell>
                    </TableRow>
                  ) : (
                    businessTypes.map((item) => (
                      <SettingItem
                        key={item.id}
                        item={item}
                        category="business_type"
                        onEdit={setEditingItem}
                        onDelete={handleDeleteMasterData}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Customer Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>สถานะลูกค้า</CardTitle>
                  <CardDescription>จัดการสถานะของลูกค้า</CardDescription>
                </div>
                <SettingDialog
                  title="สถานะลูกค้า"
                  category="customer_status"
                  description="เพิ่มสถานะลูกค้าใหม่"
                  onSave={handleSaveMasterData}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerStatus.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell>
                    </TableRow>
                  ) : (
                    customerStatus.map((item) => (
                      <SettingItem
                        key={item.id}
                        item={item}
                        category="customer_status"
                        onEdit={setEditingItem}
                        onDelete={handleDeleteMasterData}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Channels */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ช่องทางที่รู้จัก</CardTitle>
                  <CardDescription>จัดการช่องทางที่ลูกค้ารู้จัก</CardDescription>
                </div>
                <SettingDialog
                  title="ช่องทางที่รู้จัก"
                  category="channel"
                  description="เพิ่มช่องทางใหม่"
                  onSave={handleSaveMasterData}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell>
                    </TableRow>
                  ) : (
                    channels.map((item) => (
                      <SettingItem
                        key={item.id}
                        item={item}
                        category="channel"
                        onEdit={setEditingItem}
                        onDelete={handleDeleteMasterData}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          {/* Job Types */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ประเภทงาน (สำหรับลูกค้า)</CardTitle>
                  <CardDescription>จัดการประเภทงานที่ลูกค้าสั่งผลิต</CardDescription>
                </div>
                <SettingDialog
                  title="ประเภทงาน"
                  category="job_type"
                  description="เพิ่มประเภทงานใหม่"
                  onSave={handleSaveMasterData}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell>
                    </TableRow>
                  ) : (
                    jobTypes.map((item) => (
                      <SettingItem
                        key={item.id}
                        item={item}
                        category="job_type"
                        onEdit={setEditingItem}
                        onDelete={handleDeleteMasterData}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Delivery Formats */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>รูปแบบการส่งมอบ</CardTitle>
                  <CardDescription>จัดการรูปแบบการส่งมอบสินค้า</CardDescription>
                </div>
                <SettingDialog
                  title="รูปแบบการส่งมอบ"
                  category="delivery_format"
                  description="เพิ่มรูปแบบการส่งมอบใหม่"
                  onSave={handleSaveMasterData}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryFormats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell>
                    </TableRow>
                  ) : (
                    deliveryFormats.map((item) => (
                      <SettingItem
                        key={item.id}
                        item={item}
                        category="delivery_format"
                        onEdit={setEditingItem}
                        onDelete={handleDeleteMasterData}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Urgency Levels */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>สถานะความเร่งด่วน</CardTitle>
                  <CardDescription>จัดการระดับความเร่งด่วนของงาน</CardDescription>
                </div>
                <SettingDialog
                  title="สถานะความเร่งด่วน"
                  category="urgency_level"
                  description="เพิ่มระดับความเร่งด่วนใหม่"
                  onSave={handleSaveMasterData}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {urgencyLevels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell>
                    </TableRow>
                  ) : (
                    urgencyLevels.map((item) => (
                      <SettingItem
                        key={item.id}
                        item={item}
                        category="urgency_level"
                        onEdit={setEditingItem}
                        onDelete={handleDeleteMasterData}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kpi" className="space-y-4">
          {/* Sales Targets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ตั้งเป้ายอดขาย (Sales Target)</CardTitle>
                  <CardDescription>กำหนดเป้ายอดขายรายบุคคลและรายทีม</CardDescription>
                </div>
                <SalesTargetDialog onSave={handleSaveSalesTarget} />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>ช่วงเวลา</TableHead>
                    <TableHead>เป้าหมาย</TableHead>
                    <TableHead>ปัจจุบัน</TableHead>
                    <TableHead>ความสำเร็จ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesTargets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell>
                    </TableRow>
                  ) : (
                    salesTargets.map((target) => {
                      const percentage = target.target_amount > 0 ? (target.current_amount / target.target_amount) * 100 : 0;
                      return (
                        <TableRow key={target.id}>
                          <TableCell className="font-medium">{target.target_subject_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{target.target_type === 'individual' ? 'รายบุคคล' : 'รายทีม'}</Badge>
                          </TableCell>
                          <TableCell>{target.period_value} ({target.period_type})</TableCell>
                          <TableCell>฿{parseFloat(target.target_amount).toLocaleString()}</TableCell>
                          <TableCell>฿{parseFloat(target.current_amount).toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-secondary rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${percentage >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm font-semibold ${percentage >= 100 ? 'text-green-500' : ''}`}>
                                {Math.round(percentage)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => { setEditingItem(target); setActiveCategory('sales_target'); setOpenDialog(true); }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteSalesTarget(target.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Activity Targets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ตั้งเป้าการติดต่อ (Activity Target)</CardTitle>
                  <CardDescription>กำหนดเป้าหมายจำนวนการโทร/การเข้าพบลูกค้า</CardDescription>
                </div>
                <ActivityTargetDialog onSave={handleSaveActivityTarget} />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>ช่วงเวลา</TableHead>
                    <TableHead>เป้าหมาย</TableHead>
                    <TableHead>ปัจจุบัน</TableHead>
                    <TableHead>ความสำเร็จ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityTargets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell>
                    </TableRow>
                  ) : (
                    activityTargets.map((target) => {
                      const percentage = target.target_count > 0 ? (target.current_count / target.target_count) * 100 : 0;
                      return (
                        <TableRow key={target.id}>
                          <TableCell className="font-medium">{target.employee_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{target.activity_type}</Badge>
                          </TableCell>
                          <TableCell>{target.period_type}</TableCell>
                          <TableCell>{target.target_count} ครั้ง</TableCell>
                          <TableCell>{target.current_count} ครั้ง</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-secondary rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${percentage >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                                  style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm font-semibold ${percentage >= 100 ? 'text-green-500' : ''}`}>
                                {Math.round(percentage)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => { setEditingItem(target); setActiveCategory('activity_target'); setOpenDialog(true); }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteActivityTarget(target.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
