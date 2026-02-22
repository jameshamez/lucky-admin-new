import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload, Star, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  company_name: string;
  contact_name: string;
  phone_numbers: string[];
  emails: string[];
  line_id: string;
  province: string;
  address: string;
  tax_id: string;
}

const ProductionOrder = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    orderNumber: '',
    urgency: '',
    customerId: '',
    jobName: '',
    usageDate: null as Date | null,
    deliveryDate: null as Date | null,
    jobDescription: '',
    productType: '',
    tags: '',
    productionDetails: '',
    paymentSlip: null as File | null,
    shippingPayment: '',
    graphicsDetails: '',
    customerReferenceImages: [] as File[],
    designReferenceImages: [] as File[],
    satisfactionRating: 0,
    satisfactionComment: '',
    satisfactionFiles: [] as File[],
    needTaxInvoice: false,
    taxCompanyName: '',
    taxId: '',
    taxAddress: ''
  });

  // Generate order number
  const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    // In a real app, you'd get the running number from database
    const runningNumber = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    return `${year}-${month}-${runningNumber}`;
  };

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "ไม่สามารถโหลดข้อมูลลูกค้าได้",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    setFormData(prev => ({ ...prev, orderNumber: generateOrderNumber() }));
    fetchCustomers();
  }, []);

  // Filter customers based on search
  const filteredCustomers = customers.filter(customer =>
    customer.company_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.contact_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.phone_numbers.some(phone => phone.includes(customerSearch)) ||
    (customer.line_id && customer.line_id.toLowerCase().includes(customerSearch.toLowerCase()))
  );

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.company_name);
    setShowCustomerDropdown(false);
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      needTaxInvoice: !!customer.tax_id,
      taxCompanyName: customer.company_name,
      taxId: customer.tax_id || '',
      taxAddress: customer.address || ''
    }));
  };

  const handleFileUpload = (files: FileList | null, fieldName: string) => {
    if (!files) return;
    
    if (fieldName === 'paymentSlip') {
      setFormData(prev => ({ ...prev, paymentSlip: files[0] }));
    } else {
      const fileArray = Array.from(files);
      setFormData(prev => ({ 
        ...prev, 
        [fieldName]: [...(prev[fieldName as keyof typeof prev] as File[]), ...fileArray] 
      }));
    }
  };

  const handleStarRating = (rating: number) => {
    setFormData(prev => ({ ...prev, satisfactionRating: rating }));
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.customerId || !formData.jobName || !formData.deliveryDate) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
        variant: "destructive"
      });
      return;
    }

    // Here you would save to database
    toast({
      title: "บันทึกสำเร็จ",
      description: `ใบสั่งผลิต ${formData.orderNumber} ถูกสร้างเรียบร้อยแล้ว`
    });
  };

  const handleCancel = () => {
    setFormData({
      orderNumber: generateOrderNumber(),
      urgency: '',
      customerId: '',
      jobName: '',
      usageDate: null,
      deliveryDate: null,
      jobDescription: '',
      productType: '',
      tags: '',
      productionDetails: '',
      paymentSlip: null,
      shippingPayment: '',
      graphicsDetails: '',
      customerReferenceImages: [],
      designReferenceImages: [],
      satisfactionRating: 0,
      satisfactionComment: '',
      satisfactionFiles: [],
      needTaxInvoice: false,
      taxCompanyName: '',
      taxId: '',
      taxAddress: ''
    });
    setSelectedCustomer(null);
    setCustomerSearch("");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/sales/create-order'}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>ย้อนกลับ</span>
          </Button>
          <h1 className="text-2xl font-bold">สั่งผลิต</h1>
        </div>
      </div>

      {/* Section 1: Order Creator Information */}
      <Card>
        <CardHeader>
          <CardTitle>ส่วนที่ 1 ข้อมูลผู้สั่งงาน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>เซลล์ผู้รับผิดชอบงาน</Label>
              <Select onValueChange={(value) => setFormData(prev => ({ ...prev, responsibleSales: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกพนักงานขาย" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales1">พนักงานขาย 1</SelectItem>
                  <SelectItem value="sales2">พนักงานขาย 2</SelectItem>
                  <SelectItem value="sales3">พนักงานขาย 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>เลขที่ใบงาน</Label>
              <Input value={formData.orderNumber} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label>ความเร่งด่วนของงาน</Label>
              <Select value={formData.urgency} onValueChange={(value) => setFormData(prev => ({ ...prev, urgency: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกความเร่งด่วน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3-5hours">งาน 3-5 ชั่วโมง</SelectItem>
                  <SelectItem value="urgent1day">ด่วน 1 วัน</SelectItem>
                  <SelectItem value="urgent2days">ด่วน 2 วัน</SelectItem>
                  <SelectItem value="normal">ปกติ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>เลือกลูกค้า</Label>
              <div className="relative">
                <Input
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="ค้นหาลูกค้า (ชื่อ, เบอร์โทร, LINE ID)"
                />
                {showCustomerDropdown && filteredCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-2 hover:bg-accent cursor-pointer"
                        onClick={() => handleCustomerSelect(customer)}
                      >
                        <div className="font-medium">{customer.company_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.contact_name} - {customer.phone_numbers[0]}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Details */}
          {selectedCustomer && (
            <div className="mt-4 p-4 bg-accent/50 rounded-lg">
              <h4 className="font-medium mb-2">ข้อมูลลูกค้า</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>ชื่อ-นามสกุล: {selectedCustomer.contact_name}</div>
                <div>จังหวัด: {selectedCustomer.province}</div>
                <div>เบอร์โทร: {selectedCustomer.phone_numbers.join(', ')}</div>
                <div>E-mail: {selectedCustomer.emails.join(', ')}</div>
                <div>LINE ID: {selectedCustomer.line_id}</div>
                <div>ที่อยู่จัดส่ง: {selectedCustomer.address}</div>
              </div>
            </div>
          )}

          {/* Tax Invoice */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="taxInvoice"
                checked={formData.needTaxInvoice}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, needTaxInvoice: checked as boolean }))}
              />
              <Label htmlFor="taxInvoice">ใบกำกับภาษี</Label>
            </div>

            {formData.needTaxInvoice && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label>ชื่อนิติบุคคล</Label>
                  <Input
                    value={formData.taxCompanyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxCompanyName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>เลขที่ประจำตัวผู้เสียภาษี</Label>
                  <Input
                    value={formData.taxId}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>ที่อยู่</Label>
                  <Textarea
                    value={formData.taxAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxAddress: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Job Details */}
      <Card>
        <CardHeader>
          <CardTitle>ส่วนที่ 2 รายละเอียดการสั่งงาน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ชื่องาน *</Label>
              <Input
                value={formData.jobName}
                onChange={(e) => setFormData(prev => ({ ...prev, jobName: e.target.value }))}
                placeholder="ระบุชื่องาน"
              />
            </div>

            <div className="space-y-2">
              <Label>วันที่ใช้งาน</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !formData.usageDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.usageDate ? format(formData.usageDate, "dd/MM/yyyy") : "เลือกวันที่"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.usageDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, usageDate: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>วันที่จัดส่ง *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !formData.deliveryDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deliveryDate ? format(formData.deliveryDate, "dd/MM/yyyy") : "เลือกวันที่"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.deliveryDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, deliveryDate: date }))}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>ประเภทสินค้า</Label>
              <Select value={formData.productType} onValueChange={(value) => setFormData(prev => ({ ...prev, productType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกประเภทสินค้า" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medal">Medal (เหรียญรางวัล)</SelectItem>
                  <SelectItem value="trophy">Trophy (ถ้วยรางวัล)</SelectItem>
                  <SelectItem value="award">Award (โล่)</SelectItem>
                  <SelectItem value="shirt">Shirt (เสื้อ)</SelectItem>
                  <SelectItem value="bib">Bib (ป้ายบิบ)</SelectItem>
                  <SelectItem value="keychain">Keychain (พวงกุญแจ)</SelectItem>
                  <SelectItem value="doll">Doll (ตุ๊กตา)</SelectItem>
                  <SelectItem value="lanyard">Lanyard (สายคล้อง)</SelectItem>
                  <SelectItem value="box">Box packaging (บรรจุภัณฑ์)</SelectItem>
                  <SelectItem value="bag">Bag (กระเป๋า)</SelectItem>
                  <SelectItem value="bottle">Bottle (ขวดน้ำ)</SelectItem>
                  <SelectItem value="other">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>รายละเอียดงาน</Label>
            <Textarea
              value={formData.jobDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, jobDescription: e.target.value }))}
              placeholder="ระบุรายละเอียดงาน"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Tags */}
      <Card>
        <CardHeader>
          <CardTitle>ส่วนที่ 3 #Tag</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Tags</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="ระบุ tags (คั่นด้วยเครื่องหมาย ,)"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Production Department Data */}
      <Card>
        <CardHeader>
          <CardTitle>ส่วนที่ 4 ข้อมูลส่วนฝ่ายผลิต (สำหรับสั่งผลิตภายใน)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>รายละเอียดงาน</Label>
            <Textarea
              value={formData.productionDetails}
              onChange={(e) => setFormData(prev => ({ ...prev, productionDetails: e.target.value }))}
              placeholder="ระบุรายละเอียดสำหรับฝ่ายผลิต"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>แนบสลิปการชำระเงิน</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload(e.target.files, 'paymentSlip')}
                className="hidden"
                id="paymentSlip"
              />
              <label htmlFor="paymentSlip" className="cursor-pointer flex items-center justify-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>คลิกเพื่ออัพโหลดสลิป</span>
              </label>
              {formData.paymentSlip && (
                <p className="mt-2 text-sm text-muted-foreground">{formData.paymentSlip.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>การชำระเงินค่าขนส่ง</Label>
            <Input
              value={formData.shippingPayment}
              onChange={(e) => setFormData(prev => ({ ...prev, shippingPayment: e.target.value }))}
              placeholder="ระบุรายละเอียดการชำระค่าขนส่ง"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 5: Graphics Department Data */}
      <Card>
        <CardHeader>
          <CardTitle>ส่วนที่ 5 ข้อมูลส่วนกราฟฟิก (สำหรับสั่งผลิตภายใน)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>รายละเอียดงาน</Label>
            <Textarea
              value={formData.graphicsDetails}
              onChange={(e) => setFormData(prev => ({ ...prev, graphicsDetails: e.target.value }))}
              placeholder="ระบุรายละเอียดสำหรับฝ่ายกราฟฟิก"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>รูปอ้างอิงจากลูกค้า</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileUpload(e.target.files, 'customerReferenceImages')}
                className="hidden"
                id="customerRef"
              />
              <label htmlFor="customerRef" className="cursor-pointer flex items-center justify-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>คลิกเพื่ออัพโหลดรูปจากลูกค้า (หลายไฟล์)</span>
              </label>
              {formData.customerReferenceImages.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  อัพโหลดแล้ว {formData.customerReferenceImages.length} ไฟล์
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>ไฟล์ภาพอ้างอิง</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <input
                type="file"
                accept="image/*,.ai,.psd,.pdf"
                multiple
                onChange={(e) => handleFileUpload(e.target.files, 'designReferenceImages')}
                className="hidden"
                id="designRef"
              />
              <label htmlFor="designRef" className="cursor-pointer flex items-center justify-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>คลิกเพื่ออัพโหลดไฟล์อ้างอิง (หลายไฟล์)</span>
              </label>
              {formData.designReferenceImages.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  อัพโหลดแล้ว {formData.designReferenceImages.length} ไฟล์
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Customer Satisfaction */}
      <Card>
        <CardHeader>
          <CardTitle>ส่วนที่ 6 ประเมินความพึงพอใจลูกค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ให้คะแนน 1-5 ดาว</Label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-6 w-6 cursor-pointer",
                    star <= formData.satisfactionRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                  )}
                  onClick={() => handleStarRating(star)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>รายละเอียด Comment</Label>
            <Textarea
              value={formData.satisfactionComment}
              onChange={(e) => setFormData(prev => ({ ...prev, satisfactionComment: e.target.value }))}
              placeholder="ความคิดเห็นเพิ่มเติม"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>แนบไฟล์</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files, 'satisfactionFiles')}
                className="hidden"
                id="satisfactionFiles"
              />
              <label htmlFor="satisfactionFiles" className="cursor-pointer flex items-center justify-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>คลิกเพื่ออัพโหลดไฟล์</span>
              </label>
              {formData.satisfactionFiles.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  อัพโหลดแล้ว {formData.satisfactionFiles.length} ไฟล์
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 7: Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center space-x-4">
            <Button onClick={handleSubmit} size="lg">
              บันทึกข้อมูล
            </Button>
            <Button variant="outline" onClick={handleCancel} size="lg">
              ยกเลิก
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionOrder;