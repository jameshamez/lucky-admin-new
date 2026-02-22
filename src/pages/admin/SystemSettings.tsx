import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, DollarSign, Settings, Bell, Users, FileText, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

interface CompanyInfo {
  name: string;
  logo: string;
  email: string;
  phone: string;
  address: string;
}

interface WorkflowSettings {
  orderApprovalLimit: number;
  autoNotifications: boolean;
  defaulWorkflow: string[];
}

interface FinancialSettings {
  currency: string;
  taxRate: number;
  paymentTerms: string[];
}

interface MasterData {
  products: string[];
  suppliers: string[];
  expenseCategories: string[];
}

export default function SystemSettings() {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: "THE BRAVO",
    logo: "",
    email: "contact@thebravo.com",
    phone: "02-123-4567",
    address: "123 ถนนสุขุมวิท กรุงเทพฯ 10110"
  });

  const [workflowSettings, setWorkflowSettings] = useState<WorkflowSettings>({
    orderApprovalLimit: 100000,
    autoNotifications: true,
    defaulWorkflow: ["รอกราฟิก", "กำลังออกแบบ", "รอผลิต", "กำลังผลิต", "เสร็จสิ้น"]
  });

  const [financialSettings, setFinancialSettings] = useState<FinancialSettings>({
    currency: "THB",
    taxRate: 7,
    paymentTerms: ["ชำระทันที", "เครดิต 15 วัน", "เครดิต 30 วัน", "เครดิต 60 วัน"]
  });

  const [masterData, setMasterData] = useState<MasterData>({
    products: ["ป้ายไวนิล", "นามบัตร", "สติ๊กเกอร์", "โบรชัวร์", "ปฏิทิน"],
    suppliers: ["บริษัท A", "บริษัท B", "บริษัท C"],
    expenseCategories: ["วัสดุอุปกรณ์", "ค่าเช่า", "ค่าไฟฟ้า", "ค่าใช้จ่ายพนักงาน", "ค่าขนส่ง"]
  });

  const [newProduct, setNewProduct] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const [newPaymentTerm, setNewPaymentTerm] = useState("");

  const handleSaveCompanyInfo = () => {
    toast.success("บันทึกข้อมูลบริษัทสำเร็จ");
  };

  const handleSaveWorkflowSettings = () => {
    toast.success("บันทึกการตั้งค่ากระบวนการทำงานสำเร็จ");
  };

  const handleSaveFinancialSettings = () => {
    toast.success("บันทึกการตั้งค่าทางการเงินสำเร็จ");
  };

  const addProduct = () => {
    if (newProduct.trim()) {
      setMasterData({
        ...masterData,
        products: [...masterData.products, newProduct.trim()]
      });
      setNewProduct("");
      toast.success("เพิ่มสินค้าใหม่สำเร็จ");
    }
  };

  const removeProduct = (index: number) => {
    setMasterData({
      ...masterData,
      products: masterData.products.filter((_, i) => i !== index)
    });
    toast.success("ลบสินค้าสำเร็จ");
  };

  const addSupplier = () => {
    if (newSupplier.trim()) {
      setMasterData({
        ...masterData,
        suppliers: [...masterData.suppliers, newSupplier.trim()]
      });
      setNewSupplier("");
      toast.success("เพิ่มซัพพลายเออร์ใหม่สำเร็จ");
    }
  };

  const removeSupplier = (index: number) => {
    setMasterData({
      ...masterData,
      suppliers: masterData.suppliers.filter((_, i) => i !== index)
    });
    toast.success("ลบซัพพลายเออร์สำเร็จ");
  };

  const addExpenseCategory = () => {
    if (newExpenseCategory.trim()) {
      setMasterData({
        ...masterData,
        expenseCategories: [...masterData.expenseCategories, newExpenseCategory.trim()]
      });
      setNewExpenseCategory("");
      toast.success("เพิ่มประเภทรายจ่ายใหม่สำเร็จ");
    }
  };

  const removeExpenseCategory = (index: number) => {
    setMasterData({
      ...masterData,
      expenseCategories: masterData.expenseCategories.filter((_, i) => i !== index)
    });
    toast.success("ลบประเภทรายจ่ายสำเร็จ");
  };

  const addPaymentTerm = () => {
    if (newPaymentTerm.trim()) {
      setFinancialSettings({
        ...financialSettings,
        paymentTerms: [...financialSettings.paymentTerms, newPaymentTerm.trim()]
      });
      setNewPaymentTerm("");
      toast.success("เพิ่มเงื่อนไขการชำระเงินใหม่สำเร็จ");
    }
  };

  const removePaymentTerm = (index: number) => {
    setFinancialSettings({
      ...financialSettings,
      paymentTerms: financialSettings.paymentTerms.filter((_, i) => i !== index)
    });
    toast.success("ลบเงื่อนไขการชำระเงินสำเร็จ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">การตั้งค่าระบบ</h1>
        <p className="text-muted-foreground">
          ศูนย์ควบคุมหลักของเว็บไซต์ สำหรับปรับแต่งการทำงานของระบบ
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            ทั่วไป
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            กระบวนการ
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            การเงิน
          </TabsTrigger>
          <TabsTrigger value="master-data" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            ข้อมูลหลัก
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                การตั้งค่าทั่วไป
              </CardTitle>
              <CardDescription>
                ข้อมูลพื้นฐานของบริษัทและการแสดงผลของระบบ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">ชื่อบริษัท</Label>
                    <Input
                      id="companyName"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">อีเมลติดต่อ</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">เบอร์โทรศัพท์</Label>
                    <Input
                      id="companyPhone"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">ที่อยู่บริษัท</Label>
                    <Textarea
                      id="companyAddress"
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">ภาษาเริ่มต้น</Label>
                    <Select defaultValue="th">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="th">ภาษาไทย</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">รูปแบบวันที่และเวลา</Label>
                    <Select defaultValue="thai">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thai">แบบไทย (DD/MM/YYYY)</SelectItem>
                        <SelectItem value="iso">แบบสากล (YYYY-MM-DD)</SelectItem>
                        <SelectItem value="us">แบบอเมริกัน (MM/DD/YYYY)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveCompanyInfo} className="bg-[#FF5A5F] hover:bg-[#FF5A5F]/90">
                  บันทึกการตั้งค่า
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Settings */}
        <TabsContent value="workflow">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                การตั้งค่ากระบวนการทำงาน
              </CardTitle>
              <CardDescription>
                กำหนดกฎเกณฑ์และขั้นตอนการทำงานของแต่ละแผนก
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="approvalLimit">ขีดจำกัดการอนุมัติออเดอร์ (บาท)</Label>
                  <Input
                    id="approvalLimit"
                    type="number"
                    value={workflowSettings.orderApprovalLimit}
                    onChange={(e) => setWorkflowSettings({
                      ...workflowSettings,
                      orderApprovalLimit: parseInt(e.target.value)
                    })}
                  />
                  <p className="text-sm text-muted-foreground">
                    ออเดอร์ที่มีมูลค่าเกินจำนวนนี้ต้องได้รับการอนุมัติจากผู้จัดการ
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="notifications"
                    checked={workflowSettings.autoNotifications}
                    onCheckedChange={(checked) => setWorkflowSettings({
                      ...workflowSettings,
                      autoNotifications: checked
                    })}
                  />
                  <Label htmlFor="notifications">เปิดใช้งานการแจ้งเตือนอัตโนมัติ</Label>
                </div>

                <div className="space-y-2">
                  <Label>สถานะงานมาตรฐาน</Label>
                  <div className="flex flex-wrap gap-2">
                    {workflowSettings.defaulWorkflow.map((status, index) => (
                      <Badge key={index} variant="outline">
                        {index + 1}. {status}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ลำดับสถานะงานที่ใช้เป็นมาตรฐานในระบบ
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveWorkflowSettings} className="bg-[#FF5A5F] hover:bg-[#FF5A5F]/90">
                  บันทึกการตั้งค่า
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Settings */}
        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                การตั้งค่าทางการเงิน
              </CardTitle>
              <CardDescription>
                กำหนดค่าเริ่มต้นที่เกี่ยวข้องกับระบบการเงิน
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">สกุลเงิน</Label>
                    <Select
                      value={financialSettings.currency}
                      onValueChange={(value) => setFinancialSettings({ ...financialSettings, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="THB">บาทไทย (THB)</SelectItem>
                        <SelectItem value="USD">ดอลลาร์สหรัฐ (USD)</SelectItem>
                        <SelectItem value="EUR">ยูโร (EUR)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">อัตราภาษีมูลค่าเพิ่ม (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.01"
                      value={financialSettings.taxRate}
                      onChange={(e) => setFinancialSettings({
                        ...financialSettings,
                        taxRate: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>เงื่อนไขการชำระเงิน</Label>
                    <div className="space-y-2">
                      {financialSettings.paymentTerms.map((term, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span>{term}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePaymentTerm(index)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <Input
                          placeholder="เพิ่มเงื่อนไขการชำระเงินใหม่"
                          value={newPaymentTerm}
                          onChange={(e) => setNewPaymentTerm(e.target.value)}
                        />
                        <Button onClick={addPaymentTerm} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button onClick={handleSaveFinancialSettings} className="bg-[#FF5A5F] hover:bg-[#FF5A5F]/90">
                  บันทึกการตั้งค่า
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Master Data Management */}
        <TabsContent value="master-data">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products */}
            <Card>
              <CardHeader>
                <CardTitle>จัดการสินค้า</CardTitle>
                <CardDescription>ประเภทของสินค้าและบริการ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {masterData.products.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span>{product}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="เพิ่มสินค้าใหม่"
                      value={newProduct}
                      onChange={(e) => setNewProduct(e.target.value)}
                    />
                    <Button onClick={addProduct} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Suppliers */}
            <Card>
              <CardHeader>
                <CardTitle>จัดการซัพพลายเออร์</CardTitle>
                <CardDescription>รายชื่อผู้ขายและคู่ค้า</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {masterData.suppliers.map((supplier, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span>{supplier}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSupplier(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="เพิ่มซัพพลายเออร์ใหม่"
                      value={newSupplier}
                      onChange={(e) => setNewSupplier(e.target.value)}
                    />
                    <Button onClick={addSupplier} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle>ประเภทรายจ่าย</CardTitle>
                <CardDescription>หมวดหมู่ของค่าใช้จ่าย</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {masterData.expenseCategories.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span>{category}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExpenseCategory(index)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      placeholder="เพิ่มประเภทรายจ่ายใหม่"
                      value={newExpenseCategory}
                      onChange={(e) => setNewExpenseCategory(e.target.value)}
                    />
                    <Button onClick={addExpenseCategory} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}