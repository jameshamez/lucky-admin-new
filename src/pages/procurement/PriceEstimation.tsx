import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  DollarSign,
  Calculator,
  Send,
  FileText,
  Clock,
  CheckCircle,
  Upload,
  CalendarIcon,
  Plus,
  Minus,
  Save
} from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";

// Sample data for calculated jobs
const calculatedJobs = [
  {
    id: "JOB001",
    jobName: "งานวิ่งมาราธอน 2568",
    customer: "สมาคมการกีฬา",
    recordDate: "2024-01-15",
    usageDate: "2024-02-20",
    productType: "Medal",
    quantity: 500,
    status: "calculated",
    image: null
  },
  {
    id: "JOB002", 
    jobName: "ถ้วยรางวัลโรงเรียน ABC รุ่น 30 ปี",
    customer: "โรงเรียน ABC",
    recordDate: "2024-01-14",
    usageDate: "2024-03-15",
    productType: "Trophy",
    quantity: 50,
    status: "calculated",
    image: null
  }
];

// Product types and materials
const productTypes = [
  { value: "medal", label: "Medal" },
  { value: "trophy", label: "Trophy" },
  { value: "crystal", label: "Crystal Award" },
  { value: "acrylic", label: "Acrylic Award" },
  { value: "shirt", label: "Shirt" },
  { value: "wristband", label: "Wristband" },
  { value: "keychain", label: "Keychain" },
  { value: "doll", label: "Doll" },
  { value: "lanyard", label: "Lanyard" },
  { value: "packaging", label: "Box packaging" },
  { value: "bag", label: "Bag" },
  { value: "bottle", label: "Bottle" }
];

const materials = [
  "Zinc alloy (ซิงค์อัลลอย)",
  "Acrylic (อะคริลิก)",
  "Crystal (คริสตัล)",
  "Wood (ไม้)",
  "PVC",
  "Paper (กระดาษ)",
  "Recycle",
  "Foam (โฟม)",
  "Resin (เรซิน)",
  "Fabric (ผ้า)",
  "Doll (ตุ๊กตา)",
  "Lanyard (สายคล้องสั่งผลิต)",
  "อลูมิเนียม",
  "ตะกั่ว",
  "ผ้าไมโครเรียบ",
  "ผ้าดาวกระจาย",
  "ผ้าเม็ดข้าวสาร"
];

const colors = [
  "shinny gold",
  "shinny silver", 
  "shinny copper",
  "antique gold",
  "antique silver",
  "antique copper",
  "misty gold",
  "misty silver",
  "misty copper"
];

const lanyardSizes = [
  "1.5 × 90 ซม.",
  "2 × 90 ซม.",
  "2.5 × 90 ซม.", 
  "3 × 90 ซม.",
  "3.5 × 90 ซม.",
  "ไม่มี"
];

export default function PriceEstimation() {
  const [activeTab, setActiveTab] = useState("calculate");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  // Form states
  const [jobForm, setJobForm] = useState({
    jobName: "",
    customerName: "",
    recordDate: undefined as Date | undefined,
    usageDate: undefined as Date | undefined,
    productType: "",
    model: "",
    material: "",
    colors: [] as string[],
    size: "",
    thickness: "",
    frontDetails: "",
    backDetails: "",
    lanyardSize: "",
    lanyardTypes: "",
    quantity: "",
    moldCost: "",
    notes: "",
    image: null as File | null
  });

  const [quoteForm, setQuoteForm] = useState({
    unitCost: "",
    moldCost: "",
    shipping: "",
    exchangeRate: "5.5",
    vat: "7",
    sellingPrice: "",
    lanyardPrice: "10",
    factoryFile: null as File | null
  });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredJobs = calculatedJobs.filter(job => 
    job.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotalCost = () => {
    const unit = parseFloat(quoteForm.unitCost) || 0;
    const mold = parseFloat(quoteForm.moldCost) || 0;
    const shipping = parseFloat(quoteForm.shipping) || 0;
    const quantity = parseInt(jobForm.quantity) || 1;
    const exchange = parseFloat(quoteForm.exchangeRate) || 5.5;
    const vat = parseFloat(quoteForm.vat) || 7;

    const totalRMB = unit + (mold / quantity) + (shipping / quantity);
    const totalTHB = totalRMB * exchange;
    const withVat = totalTHB * (1 + vat / 100);
    
    return withVat;
  };

  const calculateSellingTotal = () => {
    const selling = parseFloat(quoteForm.sellingPrice) || 0;
    const lanyard = parseFloat(quoteForm.lanyardPrice) || 0;
    return selling + (jobForm.lanyardSize && jobForm.lanyardSize !== "ไม่มี" ? lanyard : 0);
  };

  const calculateProfit = () => {
    const totalCost = calculateTotalCost();
    const sellingTotal = calculateSellingTotal();
    const quantity = parseInt(jobForm.quantity) || 1;
    
    return (sellingTotal - totalCost) * quantity;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setJobForm({ ...jobForm, image: file });
    }
  };

  const handleFactoryFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setQuoteForm({ ...quoteForm, factoryFile: file });
    }
  };

  const saveJobData = () => {
    console.log("Saving job data:", jobForm);
    alert("บันทึกข้อมูลงานเรียบร้อยแล้ว");
  };

  const sendData = () => {
    console.log("Sending job data to procurement:", jobForm);
    alert("ส่งข้อมูลไปยังฝ่ายจัดซื้อเรียบร้อยแล้ว");
  };

  const submitQuote = () => {
    if (selectedJob && quoteForm.sellingPrice) {
      console.log("Submitting quote:", {
        jobId: selectedJob.id,
        ...quoteForm,
        totalCost: calculateTotalCost(),
        sellingTotal: calculateSellingTotal(),
        profit: calculateProfit()
      });
      alert("ส่งใบเสนอราคาเรียบร้อยแล้ว");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">คำนวณราคา & เสนอราคา</h1>
          <p className="text-muted-foreground">บันทึกข้อมูลสินค้าและประเมินราคา</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculate">คำนวณราคา</TabsTrigger>
          <TabsTrigger value="quote">เสนอราคา</TabsTrigger>
        </TabsList>

        {/* Calculate Tab */}
        <TabsContent value="calculate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ฟอร์มบันทึกข้อมูลสินค้า</CardTitle>
              <CardDescription>กรอกข้อมูลสินค้าเพื่อคำนวณราคา</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="jobName">ชื่องาน</Label>
                  <Textarea
                    id="jobName"
                    placeholder="เช่น งานวิ่งมาราธอน 2568"
                    value={jobForm.jobName}
                    onChange={(e) => setJobForm({ ...jobForm, jobName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="customerName">ชื่อลูกค้า</Label>
                  <Input
                    id="customerName"
                    placeholder="เช่น บริษัท ABC จำกัด"
                    value={jobForm.customerName}
                    onChange={(e) => setJobForm({ ...jobForm, customerName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>วันที่บันทึก</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {jobForm.recordDate ? format(jobForm.recordDate, "PPP", { locale: th }) : "เลือกวันที่"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={jobForm.recordDate}
                        onSelect={(date) => setJobForm({ ...jobForm, recordDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>วันที่ลูกค้าใช้งาน</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {jobForm.usageDate ? format(jobForm.usageDate, "PPP", { locale: th }) : "เลือกวันที่"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={jobForm.usageDate}
                        onSelect={(date) => setJobForm({ ...jobForm, usageDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label htmlFor="image">รูปภาพสินค้า</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">คลิกเพื่อเลือกรูปภาพ หรือลากไฟล์มาวาง</p>
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('image')?.click()}
                  >
                    เลือกไฟล์
                  </Button>
                  {jobForm.image && (
                    <p className="text-sm text-primary mt-2">{jobForm.image.name}</p>
                  )}
                </div>
              </div>

              {/* Product Type */}
              <div>
                <Label htmlFor="productType">ประเภทสินค้า</Label>
                <Select value={jobForm.productType} onValueChange={(value) => setJobForm({ ...jobForm, productType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภทสินค้า" />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Crystal Model (only show if crystal is selected) */}
              {jobForm.productType === "crystal" && (
                <div>
                  <Label htmlFor="model">รุ่น/โมเดล</Label>
                  <Input
                    id="model"
                    placeholder="เช่น Ca282, Ca016, CY225G"
                    value={jobForm.model}
                    onChange={(e) => setJobForm({ ...jobForm, model: e.target.value })}
                  />
                </div>
              )}

              {/* Material */}
              <div>
                <Label htmlFor="material">วัสดุ</Label>
                <Select value={jobForm.material} onValueChange={(value) => setJobForm({ ...jobForm, material: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกวัสดุ" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material} value={material}>
                        {material}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Colors (multi-select) */}
              <div>
                <Label>สี (เลือกได้หลายสี)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {colors.map((color) => (
                    <Button
                      key={color}
                      variant={jobForm.colors.includes(color) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const newColors = jobForm.colors.includes(color)
                          ? jobForm.colors.filter(c => c !== color)
                          : [...jobForm.colors, color];
                        setJobForm({ ...jobForm, colors: newColors });
                      }}
                    >
                      {color}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Size and Thickness */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="size">ขนาด (ซม.)</Label>
                  <Input
                    id="size"
                    type="number"
                    placeholder="0"
                    value={jobForm.size}
                    onChange={(e) => setJobForm({ ...jobForm, size: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="thickness">ความหนา (มม.)</Label>
                  <Input
                    id="thickness"
                    type="number"
                    placeholder="0"
                    value={jobForm.thickness}
                    onChange={(e) => setJobForm({ ...jobForm, thickness: e.target.value })}
                  />
                </div>
              </div>

              {/* Front and Back Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frontDetails">รายละเอียดด้านหน้า</Label>
                  <Textarea
                    id="frontDetails"
                    placeholder="เช่น 2D, 3D, UV PRINT"
                    value={jobForm.frontDetails}
                    onChange={(e) => setJobForm({ ...jobForm, frontDetails: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="backDetails">รายละเอียดด้านหลัง</Label>
                  <Textarea
                    id="backDetails"
                    placeholder="เช่น 2D, 3D, UV PRINT"
                    value={jobForm.backDetails}
                    onChange={(e) => setJobForm({ ...jobForm, backDetails: e.target.value })}
                  />
                </div>
              </div>

              {/* Lanyard Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lanyardSize">ขนาดสายคล้อง</Label>
                  <Select value={jobForm.lanyardSize} onValueChange={(value) => setJobForm({ ...jobForm, lanyardSize: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกขนาดสาย" />
                    </SelectTrigger>
                    <SelectContent>
                      {lanyardSizes.map((size) => (
                        <SelectItem key={size} value={size}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lanyardTypes">จำนวนแบบสายคล้อง</Label>
                  <Input
                    id="lanyardTypes"
                    type="number"
                    placeholder="0"
                    value={jobForm.lanyardTypes}
                    onChange={(e) => setJobForm({ ...jobForm, lanyardTypes: e.target.value })}
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <Label htmlFor="quantity">จำนวน</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="0"
                  value={jobForm.quantity}
                  onChange={(e) => setJobForm({ ...jobForm, quantity: e.target.value })}
                />
              </div>

              {/* Mold Cost (only if quantity < 300) */}
              {parseInt(jobForm.quantity) < 300 && parseInt(jobForm.quantity) > 0 && (
                <div>
                  <Label htmlFor="moldCost">ค่าโมลเพิ่มเติม</Label>
                  <Input
                    id="moldCost"
                    type="number"
                    placeholder="3000"
                    value={jobForm.moldCost}
                    onChange={(e) => setJobForm({ ...jobForm, moldCost: e.target.value })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    สินค้าน้อยกว่า 300 ชิ้น แนะนำให้ใส่ค่าโมล 3000
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">หมายเหตุ</Label>
                <Textarea
                  id="notes"
                  placeholder="หมายเหตุเพิ่มเติม..."
                  value={jobForm.notes}
                  onChange={(e) => setJobForm({ ...jobForm, notes: e.target.value })}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button onClick={saveJobData} variant="outline" className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  บันทึกข้อมูล
                </Button>
                <Button onClick={sendData} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  ส่งข้อมูล
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quote Tab */}
        <TabsContent value="quote" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Job Search and List */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>ค้นหางาน</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="ชื่องาน หรือ ลูกค้า"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>งานที่มีการคำนวณราคา</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredJobs.map((job) => (
                      <div
                        key={job.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedJob?.id === job.id ? 'border-primary shadow-md' : ''
                        }`}
                        onClick={() => setSelectedJob(job)}
                      >
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm">{job.jobName}</h4>
                          <p className="text-xs text-muted-foreground">{job.customer}</p>
                          <div className="flex justify-between text-xs">
                            <span>{job.productType}</span>
                            <span>{job.quantity} ชิ้น</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            บันทึก: {job.recordDate}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            ยังไม่เสนอราคา
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quote Form */}
            <div className="lg:col-span-2">
              {selectedJob ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>รายละเอียดงาน: {selectedJob.id}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">ลูกค้า:</span>
                          <p>{selectedJob.customer}</p>
                        </div>
                        <div>
                          <span className="font-medium">โปรเจค:</span>
                          <p>{selectedJob.jobName}</p>
                        </div>
                        <div>
                          <span className="font-medium">จำนวน:</span>
                          <p>{selectedJob.quantity} ชิ้น</p>
                        </div>
                        <div>
                          <span className="font-medium">วันที่ใช้งาน:</span>
                          <p>{selectedJob.usageDate}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>กรอกข้อมูลเสนอราคา</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Cost Inputs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="unitCost">ชิ้นงาน (ทุนต่อหน่วย) RMB</Label>
                          <Input
                            id="unitCost"
                            type="number"
                            placeholder="0"
                            value={quoteForm.unitCost}
                            onChange={(e) => setQuoteForm({ ...quoteForm, unitCost: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="moldCost">โมล (ทุนต่อหน่วย) RMB</Label>
                          <Input
                            id="moldCost"
                            type="number"
                            placeholder="0"
                            value={quoteForm.moldCost}
                            onChange={(e) => setQuoteForm({ ...quoteForm, moldCost: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="shipping">ค่าขนส่ง (จีน-ไทย) RMB</Label>
                          <Input
                            id="shipping"
                            type="number"
                            placeholder="0"
                            value={quoteForm.shipping}
                            onChange={(e) => setQuoteForm({ ...quoteForm, shipping: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="exchangeRate">อัตราแลกเปลี่ยน (ECR)</Label>
                          <Input
                            id="exchangeRate"
                            type="number"
                            value={quoteForm.exchangeRate}
                            onChange={(e) => setQuoteForm({ ...quoteForm, exchangeRate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="vat">% VAT</Label>
                          <Input
                            id="vat"
                            type="number"
                            value={quoteForm.vat}
                            onChange={(e) => setQuoteForm({ ...quoteForm, vat: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Selling Price */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="sellingPrice">ราคาขายต่อหน่วย THB</Label>
                          <Input
                            id="sellingPrice"
                            type="number"
                            placeholder="0"
                            value={quoteForm.sellingPrice}
                            onChange={(e) => setQuoteForm({ ...quoteForm, sellingPrice: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lanyardPrice">ราคาขายสายต่อหน่วย THB</Label>
                          <Input
                            id="lanyardPrice"
                            type="number"
                            value={quoteForm.lanyardPrice}
                            onChange={(e) => setQuoteForm({ ...quoteForm, lanyardPrice: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Factory File Upload */}
                      <div>
                        <Label>แนบไฟล์จากโรงงาน (ถ้ามี)</Label>
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            id="factoryFile"
                            accept=".jpg,.png,.pdf"
                            onChange={handleFactoryFileUpload}
                            className="hidden"
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => document.getElementById('factoryFile')?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            เลือกไฟล์
                          </Button>
                          {quoteForm.factoryFile && (
                            <p className="text-sm text-primary mt-2">{quoteForm.factoryFile.name}</p>
                          )}
                        </div>
                      </div>

                      {/* Calculation Results */}
                      {quoteForm.unitCost && quoteForm.sellingPrice && (
                        <div className="space-y-3 p-4 bg-muted rounded-lg">
                          <h4 className="font-semibold">ผลการคำนวณ</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium">ทุนรวม (บาท):</span>
                              <p className="text-lg font-bold">฿{calculateTotalCost().toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="font-medium">ราคาขายรวม (บาท):</span>
                              <p className="text-lg font-bold">฿{calculateSellingTotal().toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="font-medium">คำนวณ (บาท):</span>
                              <p className="text-lg font-bold text-primary">฿{calculateProfit().toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={submitQuote}
                        className="w-full"
                        disabled={!quoteForm.sellingPrice}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        บันทึกข้อมูล
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">เลือกงานเพื่อเริ่มเสนอราคา</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}