import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { 
  Search,
  Wrench,
  Tag,
  Gift,
  Box,
  Truck,
  ChevronRight
} from "lucide-react";
import { productionService } from "@/services/productionService";
import { toast } from "sonner";

interface EmployeeTaskStepData {
  procurementDate?: string;
  procurementEmployee?: string;
  assemblyDate?: string;
  assemblyEmployee?: string;
  signageDate?: string;
  signageEmployee?: string;
  ribbonDate?: string;
  ribbonEmployee?: string;
  ribbonImage?: string;
  packingDate?: string;
  packingEmployee?: string;
  boxCount?: number;
  shippingCostOrigin?: number;
  shippingCostDestination?: number;
  actualShippingCost?: number;
  packingImage?: string;
  paymentSlipImage?: string;
}

interface ProductionJob {
  id: string;
  dbId: number | string;
  jobType: string;
  product: string;
  quantity: number;
  productionWorkflow: Record<string, unknown> | null;
  taskDetails: EmployeeTaskStepData;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapProductionJob = (o: any): ProductionJob => ({
  id: o.job_id || "-",
  dbId: o.order_id,
  jobType: o.product_category || o.product_type || "-",
  product: o.job_name || "-",
  quantity: Number(o.total_quantity) || 0,
  productionWorkflow: o.production_workflow || null,
  taskDetails: (o.production_workflow?.employeeTaskDetails || {}) as EmployeeTaskStepData,
});

const uploadTaskFile = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", "general");
  const res = await fetch("https://nacres.co.th/api-lucky/admin/order_upload.php", {
    method: "POST",
    body: formData,
  });
  const json = await res.json();
  return json.status === "success" ? json.data?.fileUrl || null : null;
};

export default function EmployeeTaskDetails() {
  const [productionJobs, setProductionJobs] = useState<ProductionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<ProductionJob | null>(null);
  const [formData, setFormData] = useState({
    procurementDate: "",
    procurementEmployee: "",
    assemblyDate: "",
    assemblyEmployee: "",
    signageDate: "",
    signageEmployee: "",
    ribbonDate: "",
    ribbonEmployee: "",
    ribbonImage: null as File | null,
    packingDate: "",
    packingEmployee: "",
    boxCount: 0,
    shippingCostOrigin: 0,
    shippingCostDestination: 0,
    actualShippingCost: 0,
    packingImage: null as File | null,
    paymentSlipImage: null as File | null
  });

  useEffect(() => {
    setLoading(true);
    productionService
      .getOrders({ order_status: "สร้างงานแล้ว" })
      .then((res) => {
        const dataArr = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        if (res.status === "success" && Array.isArray(dataArr)) {
          setProductionJobs(dataArr.map(mapProductionJob));
        }
      })
      .catch(() => toast.error("ไม่สามารถโหลดข้อมูลงานได้"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateClick = (job: ProductionJob) => {
    setSelectedJob(job);
    const t = job.taskDetails;
    setFormData({
      procurementDate: t.procurementDate || "",
      procurementEmployee: t.procurementEmployee || "",
      assemblyDate: t.assemblyDate || "",
      assemblyEmployee: t.assemblyEmployee || "",
      signageDate: t.signageDate || "",
      signageEmployee: t.signageEmployee || "",
      ribbonDate: t.ribbonDate || "",
      ribbonEmployee: t.ribbonEmployee || "",
      ribbonImage: null,
      packingDate: t.packingDate || "",
      packingEmployee: t.packingEmployee || "",
      boxCount: t.boxCount || 0,
      shippingCostOrigin: t.shippingCostOrigin || 0,
      shippingCostDestination: t.shippingCostDestination || 0,
      actualShippingCost: t.actualShippingCost || 0,
      packingImage: null,
      paymentSlipImage: null
    });
    setIsUpdateDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
  };

  const handleSave = async () => {
    if (!selectedJob) return;
    setIsSaving(true);
    try {
      const [ribbonImageUrl, packingImageUrl, paymentSlipImageUrl] = await Promise.all([
        formData.ribbonImage ? uploadTaskFile(formData.ribbonImage) : Promise.resolve(selectedJob.taskDetails.ribbonImage || undefined),
        formData.packingImage ? uploadTaskFile(formData.packingImage) : Promise.resolve(selectedJob.taskDetails.packingImage || undefined),
        formData.paymentSlipImage ? uploadTaskFile(formData.paymentSlipImage) : Promise.resolve(selectedJob.taskDetails.paymentSlipImage || undefined),
      ]);

      const updatedTaskDetails: EmployeeTaskStepData = {
        procurementDate: formData.procurementDate,
        procurementEmployee: formData.procurementEmployee,
        assemblyDate: formData.assemblyDate,
        assemblyEmployee: formData.assemblyEmployee,
        signageDate: formData.signageDate,
        signageEmployee: formData.signageEmployee,
        ribbonDate: formData.ribbonDate,
        ribbonEmployee: formData.ribbonEmployee,
        ribbonImage: ribbonImageUrl || undefined,
        packingDate: formData.packingDate,
        packingEmployee: formData.packingEmployee,
        boxCount: formData.boxCount,
        shippingCostOrigin: formData.shippingCostOrigin,
        shippingCostDestination: formData.shippingCostDestination,
        actualShippingCost: formData.actualShippingCost,
        packingImage: packingImageUrl || undefined,
        paymentSlipImage: paymentSlipImageUrl || undefined,
      };

      const updatedWorkflow = { ...(selectedJob.productionWorkflow || {}), employeeTaskDetails: updatedTaskDetails };
      await productionService.updateProductionWorkflow(selectedJob.dbId, updatedWorkflow);

      setProductionJobs(prev => prev.map(job =>
        job.dbId === selectedJob.dbId ? { ...job, productionWorkflow: updatedWorkflow, taskDetails: updatedTaskDetails } : job
      ));
      toast.success("บันทึกข้อมูลงานสำเร็จ");
      setIsUpdateDialogOpen(false);
    } catch {
      toast.error("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">รายละเอียดงานของพนักงาน</h1>
        <p className="text-muted-foreground">ติดตามและอัปเดตรายละเอียดงานของพนักงานแต่ละคน</p>
      </div>

      {/* Job Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการงานทั้งหมด</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ประเภทงาน</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead>จำนวน</TableHead>
                <TableHead>สถานะอัพเดทงาน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    กำลังโหลดข้อมูล...
                  </TableCell>
                </TableRow>
              ) : productionJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    ไม่มีงานที่กำลังดำเนินการ
                  </TableCell>
                </TableRow>
              ) : (
              productionJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.jobType}</TableCell>
                  <TableCell>{job.product}</TableCell>
                  <TableCell>{job.quantity}</TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpdateClick(job)}
                      className="gap-2"
                    >
                      อัพเดทสถานะ
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>อัพเดทสถานะงาน - {selectedJob?.id}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Procurement Section */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Search className="h-4 w-4" />
                การจัดหา
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="procurementDate">วันที่จัดหา</Label>
                  <Input
                    id="procurementDate"
                    type="date"
                    value={formData.procurementDate}
                    onChange={(e) => setFormData({...formData, procurementDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="procurementEmployee">ชื่อพนักงานรับผิดชอบ</Label>
                  <Input
                    id="procurementEmployee"
                    value={formData.procurementEmployee}
                    onChange={(e) => setFormData({...formData, procurementEmployee: e.target.value})}
                    placeholder="ชื่อพนักงาน"
                  />
                </div>
              </div>
            </div>

            {/* Assembly Section */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                การประกอบ
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="assemblyDate">วันที่ประกอบ</Label>
                  <Input
                    id="assemblyDate"
                    type="date"
                    value={formData.assemblyDate}
                    onChange={(e) => setFormData({...formData, assemblyDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assemblyEmployee">ชื่อพนักงานรับผิดชอบ</Label>
                  <Input
                    id="assemblyEmployee"
                    value={formData.assemblyEmployee}
                    onChange={(e) => setFormData({...formData, assemblyEmployee: e.target.value})}
                    placeholder="ชื่อพนักงาน"
                  />
                </div>
              </div>
            </div>

            {/* Signage Section */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" />
                ป้ายจารึก
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="signageDate">วันที่ทำป้ายจารึก</Label>
                  <Input
                    id="signageDate"
                    type="date"
                    value={formData.signageDate}
                    onChange={(e) => setFormData({...formData, signageDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signageEmployee">ชื่อพนักงานรับผิดชอบ</Label>
                  <Input
                    id="signageEmployee"
                    value={formData.signageEmployee}
                    onChange={(e) => setFormData({...formData, signageEmployee: e.target.value})}
                    placeholder="ชื่อพนักงาน"
                  />
                </div>
              </div>
            </div>

            {/* Ribbon Section */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Gift className="h-4 w-4" />
                ผูกโบว์
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ribbonDate">วันที่ผูกโบว์</Label>
                  <Input
                    id="ribbonDate"
                    type="date"
                    value={formData.ribbonDate}
                    onChange={(e) => setFormData({...formData, ribbonDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ribbonEmployee">ชื่อพนักงานรับผิดชอบ</Label>
                  <Input
                    id="ribbonEmployee"
                    value={formData.ribbonEmployee}
                    onChange={(e) => setFormData({...formData, ribbonEmployee: e.target.value})}
                    placeholder="ชื่อพนักงาน"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ribbonImage">แนบรูปภาพ</Label>
                <Input
                  id="ribbonImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'ribbonImage')}
                />
              </div>
            </div>

            {/* Packing Section */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Box className="h-4 w-4" />
                แพ็กสินค้า
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="packingDate">วันที่แพ็กสินค้า</Label>
                  <Input
                    id="packingDate"
                    type="date"
                    value={formData.packingDate}
                    onChange={(e) => setFormData({...formData, packingDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="packingEmployee">ชื่อพนักงานรับผิดชอบ</Label>
                  <Input
                    id="packingEmployee"
                    value={formData.packingEmployee}
                    onChange={(e) => setFormData({...formData, packingEmployee: e.target.value})}
                    placeholder="ชื่อพนักงาน"
                  />
                </div>
              </div>
            </div>

            {/* Shipping Section */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Truck className="h-4 w-4" />
                การจัดส่ง
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="boxCount">จำนวนกล่อง</Label>
                  <Input
                    id="boxCount"
                    type="number"
                    value={formData.boxCount}
                    onChange={(e) => setFormData({...formData, boxCount: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingCostOrigin">ค่าขนส่ง เก็บเงิน (ต้นทาง)</Label>
                  <Input
                    id="shippingCostOrigin"
                    type="number"
                    value={formData.shippingCostOrigin}
                    onChange={(e) => setFormData({...formData, shippingCostOrigin: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingCostDestination">ค่าขนส่ง เก็บเงิน (ปลายทาง)</Label>
                  <Input
                    id="shippingCostDestination"
                    type="number"
                    value={formData.shippingCostDestination}
                    onChange={(e) => setFormData({...formData, shippingCostDestination: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="actualShippingCost">ค่าขนส่งจริง</Label>
                  <Input
                    id="actualShippingCost"
                    type="number"
                    value={formData.actualShippingCost}
                    onChange={(e) => setFormData({...formData, actualShippingCost: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="packingImage">รูปภาพการแพ็ก</Label>
                <Input
                  id="packingImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'packingImage')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentSlipImage">สลิปโอนเงิน</Label>
                <Input
                  id="paymentSlipImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, 'paymentSlipImage')}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)} disabled={isSaving}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
