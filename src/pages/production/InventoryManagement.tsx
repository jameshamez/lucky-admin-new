import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Plus,
  Minus,
  AlertTriangle,
  Package,
  TrendingDown,
  History,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  X,
  Download,
  Loader2
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import InventoryStockTab from "@/components/production/InventoryStockTab";
import DefectiveItemsTab from "@/components/production/DefectiveItemsTab";
import { officeSuppliesService, OfficeSupply, SupplyMovement, SupplyDefect } from "@/services/officeSuppliesService";
import { useAuth } from "@/contexts/AuthContext";

export default function InventoryManagement() {
  const { user } = useAuth();
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [stockAction, setStockAction] = useState("");
  const [activeTab, setActiveTab] = useState("stock");
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelFileName, setExcelFileName] = useState("");
  const [importType, setImportType] = useState<"รับเข้า" | "จ่ายออก">("รับเข้า");
  const [rowErrors, setRowErrors] = useState<Record<number, string[]>>({});
  const [headerErrors, setHeaderErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Real data ---
  const [loading, setLoading] = useState(true);
  const [supplies, setSupplies] = useState<OfficeSupply[]>([]);
  const [movements, setMovements] = useState<SupplyMovement[]>([]);
  const [defects, setDefects] = useState<SupplyDefect[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [stockRes, movementsRes, defectsRes] = await Promise.all([
        officeSuppliesService.getStock(),
        officeSuppliesService.getMovements(),
        officeSuppliesService.getDefects(),
      ]);
      if (stockRes.status === "success") setSupplies(stockRes.data);
      if (movementsRes.status === "success") setMovements(movementsRes.data);
      if (defectsRes.status === "success") setDefects(defectsRes.data);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลคลังสินค้าได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // --- Receive / Issue / Defect forms (shared by the quick-action dialog and the in-out tab) ---
  const [receiveSupplyId, setReceiveSupplyId] = useState<string>("");
  const [receiveQty, setReceiveQty] = useState("");
  const [receiveNote, setReceiveNote] = useState("");

  const [issueSupplyId, setIssueSupplyId] = useState<string>("");
  const [issueQty, setIssueQty] = useState("");
  const [issueOrderRef, setIssueOrderRef] = useState("");
  const [issueNote, setIssueNote] = useState("");

  const [defectProduct, setDefectProduct] = useState("");
  const [defectQty, setDefectQty] = useState("");
  const [defectType, setDefectType] = useState("");
  const [defectAction, setDefectAction] = useState("");
  const [defectNote, setDefectNote] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const selectedReceiveSupply = supplies.find(s => String(s.supplyId) === receiveSupplyId);
  const selectedIssueSupply = supplies.find(s => String(s.supplyId) === issueSupplyId);

  const handleReceiveSubmit = async () => {
    if (!receiveSupplyId) { toast.error("กรุณาเลือกรายการสินค้า"); return; }
    const qty = Number(receiveQty);
    if (!qty || qty <= 0) { toast.error("กรุณากรอกจำนวนที่ถูกต้อง"); return; }
    setSubmitting(true);
    try {
      const res = await officeSuppliesService.recordMovement({
        supplyId: Number(receiveSupplyId), type: "รับเข้า", qty, employeeName: user?.full_name, note: receiveNote || undefined,
      });
      if (res.status === "success") {
        toast.success("บันทึกรับเข้าสำเร็จ");
        setReceiveSupplyId(""); setReceiveQty(""); setReceiveNote("");
        setIsStockDialogOpen(false);
        fetchAll();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleIssueSubmit = async () => {
    if (!issueSupplyId) { toast.error("กรุณาเลือกรายการสินค้า"); return; }
    const qty = Number(issueQty);
    if (!qty || qty <= 0) { toast.error("กรุณากรอกจำนวนที่ถูกต้อง"); return; }
    setSubmitting(true);
    try {
      const res = await officeSuppliesService.recordMovement({
        supplyId: Number(issueSupplyId), type: "จ่ายออก", qty, employeeName: user?.full_name, note: issueNote || undefined, orderRef: issueOrderRef || undefined,
      });
      if (res.status === "success") {
        toast.success("บันทึกจ่ายออกสำเร็จ");
        setIssueSupplyId(""); setIssueQty(""); setIssueOrderRef(""); setIssueNote("");
        setIsStockDialogOpen(false);
        fetchAll();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDefectSubmit = async () => {
    if (!defectProduct.trim()) { toast.error("กรุณากรอกรายการสินค้า"); return; }
    const qty = Number(defectQty);
    if (!qty || qty <= 0) { toast.error("กรุณากรอกจำนวนที่ถูกต้อง"); return; }
    setSubmitting(true);
    try {
      const res = await officeSuppliesService.recordDefect({
        productName: defectProduct, quantity: qty, defectType: defectType || undefined,
        reportedBy: user?.full_name, resolutionAction: defectAction || undefined, note: defectNote || undefined,
      });
      if (res.status === "success") {
        toast.success("บันทึกสินค้ามีตำหนิสำเร็จ");
        setDefectProduct(""); setDefectQty(""); setDefectType(""); setDefectAction(""); setDefectNote("");
        setIsStockDialogOpen(false);
        fetchAll();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const REQUIRED_COLUMNS = ["รหัสสินค้า", "ชื่อสินค้า", "จำนวน", "หน่วย"];
  const validProductIds = supplies.map(item => item.id);

  const validateExcelData = (data: any[]) => {
    const errors: Record<number, string[]> = {};
    const hErrors: string[] = [];

    if (data.length === 0) {
      hErrors.push("ไฟล์ไม่มีข้อมูล");
      return { errors, hErrors };
    }

    const columns = Object.keys(data[0]);
    const missingCols = REQUIRED_COLUMNS.filter(col => !columns.includes(col));
    if (missingCols.length > 0) {
      hErrors.push(`ขาดคอลัมน์ที่จำเป็น: ${missingCols.join(", ")}`);
    }

    data.forEach((row, idx) => {
      const rowErr: string[] = [];

      REQUIRED_COLUMNS.forEach(col => {
        if (row[col] === undefined || row[col] === null || String(row[col]).trim() === "") {
          rowErr.push(`"${col}" ว่างเปล่า`);
        }
      });

      if (row["จำนวน"] !== undefined) {
        const qty = Number(row["จำนวน"]);
        if (isNaN(qty)) {
          rowErr.push(`"จำนวน" ต้องเป็นตัวเลข (พบ: "${row["จำนวน"]}")`);
        } else if (qty <= 0) {
          rowErr.push(`"จำนวน" ต้องมากกว่า 0`);
        }
      }

      if (row["รหัสสินค้า"] && !validProductIds.includes(String(row["รหัสสินค้า"]).trim())) {
        rowErr.push(`รหัส "${row["รหัสสินค้า"]}" ไม่พบในระบบ`);
      }

      if (rowErr.length > 0) {
        errors[idx] = rowErr;
      }
    });

    return { errors, hErrors };
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExcelFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const { errors, hErrors } = validateExcelData(jsonData);
      setRowErrors(errors);
      setHeaderErrors(hErrors);
      setExcelData(jsonData);
      setShowExcelImport(true);
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const errorCount = Object.keys(rowErrors).length;
  const hasErrors = errorCount > 0 || headerErrors.length > 0;

  const handleConfirmImport = async () => {
    if (hasErrors) {
      toast.error(`พบข้อผิดพลาด ${errorCount} แถว กรุณาแก้ไขไฟล์แล้วนำเข้าใหม่`);
      return;
    }
    setImporting(true);
    try {
      const rows = excelData.map(row => ({
        code: String(row["รหัสสินค้า"]).trim(),
        qty: Number(row["จำนวน"]),
        note: row["หมายเหตุ"] ? String(row["หมายเหตุ"]) : undefined,
      }));
      const res = await officeSuppliesService.bulkImport(importType, rows);
      if (res.status === "success") {
        toast.success(`นำเข้าสำเร็จ ${res.imported} รายการ (${importType})`);
        setShowExcelImport(false);
        setExcelData([]);
        setExcelFileName("");
        setRowErrors({});
        setHeaderErrors([]);
        fetchAll();
      } else {
        toast.error(res.message || "นำเข้าไม่สำเร็จ");
      }
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      { รหัสสินค้า: "INV-001", ชื่อสินค้า: "กระดาษ A4", จำนวน: 100, หน่วย: "รีม", หมายเหตุ: "รับจากซัพพลายเออร์" },
      { รหัสสินค้า: "INV-002", ชื่อสินค้า: "หมึกสีดำ", จำนวน: 20, หน่วย: "ขวด", หมายเหตุ: "" },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `template_${importType === "รับเข้า" ? "receive" : "issue"}.xlsx`);
  };

  const lowStockCount = supplies.filter(item =>
    item.status === "ขาดแคลน" || item.status === "ใกล้หมด"
  ).length;

  const totalDefective = defects.reduce((sum, item) => sum + item.quantity, 0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const movementsToday = movements.filter(m => m.date?.startsWith(todayStr)).length;

  const getMovementBadge = (type: string) => {
    switch (type) {
      case "รับเข้า": return <Badge className="bg-green-100 text-green-700"><ArrowDownCircle className="w-3 h-3 mr-1" />{type}</Badge>;
      case "จ่ายออก": return <Badge className="bg-red-100 text-red-700"><ArrowUpCircle className="w-3 h-3 mr-1" />{type}</Badge>;
      case "ปรับยอด": return <Badge className="bg-blue-100 text-blue-700">{type}</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">คลังสินค้า</h1>
          <p className="text-muted-foreground">จัดการสต็อก รับเข้า-จ่ายออก และตรวจสอบประวัติการเคลื่อนไหว</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setStockAction("import")}
              >
                <Plus className="w-4 h-4 mr-2" />
                รับเข้า
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>
                  {stockAction === "import" ? "รับเข้าสินค้า" :
                   stockAction === "export" ? "จ่ายออกสินค้า" : "บันทึกสินค้ามีตำหนิ"}
                </DialogTitle>
              </DialogHeader>

              {stockAction === "import" && (
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>รายการสินค้า</Label>
                    <Select value={receiveSupplyId} onValueChange={setReceiveSupplyId}>
                      <SelectTrigger><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
                      <SelectContent>
                        {supplies.map(s => (
                          <SelectItem key={s.supplyId} value={String(s.supplyId)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>จำนวน</Label>
                    <Input type="number" placeholder="0" value={receiveQty} onChange={(e) => setReceiveQty(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>หน่วย</Label>
                    <Input value={selectedReceiveSupply?.unit || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>หมายเหตุ</Label>
                    <Textarea placeholder="รายละเอียดเพิ่มเติม" value={receiveNote} onChange={(e) => setReceiveNote(e.target.value)} />
                  </div>
                </div>
              )}

              {stockAction === "export" && (
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>รายการสินค้า</Label>
                    <Select value={issueSupplyId} onValueChange={setIssueSupplyId}>
                      <SelectTrigger><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
                      <SelectContent>
                        {supplies.map(s => (
                          <SelectItem key={s.supplyId} value={String(s.supplyId)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>จำนวน</Label>
                    <Input type="number" placeholder="0" value={issueQty} onChange={(e) => setIssueQty(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>หน่วย</Label>
                    <Input value={selectedIssueSupply?.unit || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>อ้างอิง Order</Label>
                    <Input placeholder="เช่น ORD-001" value={issueOrderRef} onChange={(e) => setIssueOrderRef(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>หมายเหตุ</Label>
                    <Textarea placeholder="รายละเอียดเพิ่มเติม" value={issueNote} onChange={(e) => setIssueNote(e.target.value)} />
                  </div>
                </div>
              )}

              {stockAction === "defective" && (
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="item">รายการสินค้า</Label>
                    <Input id="item" placeholder="กรอกชื่อสินค้า" value={defectProduct} onChange={(e) => setDefectProduct(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">จำนวน</Label>
                    <Input id="quantity" type="number" placeholder="0" value={defectQty} onChange={(e) => setDefectQty(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="defect-reason">สาเหตุตำหนิ</Label>
                    <Textarea id="defect-reason" placeholder="อธิบายสาเหตุที่ทำให้เกิดตำหนิ" value={defectType} onChange={(e) => setDefectType(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>การดำเนินการ</Label>
                    <Input placeholder="เช่น ผลิตใหม่, ส่งคืนซัพพลายเออร์" value={defectAction} onChange={(e) => setDefectAction(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">หมายเหตุ</Label>
                    <Textarea id="notes" placeholder="รายละเอียดเพิ่มเติม" value={defectNote} onChange={(e) => setDefectNote(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button
                  className="bg-gradient-to-r from-primary to-primary-hover"
                  disabled={submitting}
                  onClick={() => {
                    if (stockAction === "import") handleReceiveSubmit();
                    else if (stockAction === "export") handleIssueSubmit();
                    else handleDefectSubmit();
                  }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  บันทึก
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={() => {
              setStockAction("export");
              setIsStockDialogOpen(true);
            }}
          >
            <Minus className="w-4 h-4 mr-2" />
            จ่ายออก
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              setStockAction("defective");
              setIsStockDialogOpen(true);
            }}
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            สินค้ามีตำหนิ
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">รายการสินค้าทั้งหมด</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplies.length}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สินค้าใกล้หมด/ขาดแคลน</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สินค้ามีตำหนิ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalDefective}</div>
            <p className="text-xs text-muted-foreground">ชิ้น</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เคลื่อนไหววันนี้</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{movementsToday}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            สต็อกคงเหลือ
          </TabsTrigger>
          <TabsTrigger value="in-out" className="flex items-center gap-2">
            <ArrowDownCircle className="w-4 h-4" />
            รับเข้า/จ่ายออก
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            ประวัติเคลื่อนไหว
          </TabsTrigger>
          <TabsTrigger value="defective" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            สินค้ามีตำหนิ
          </TabsTrigger>
        </TabsList>

        {/* Tab: Stock Balance */}
        <TabsContent value="stock" className="space-y-4">
          <InventoryStockTab />
        </TabsContent>

        {/* Tab: Receive/Issue */}
        <TabsContent value="in-out" className="space-y-4">
          {/* Excel Import Buttons */}
          <div className="flex gap-2 justify-end">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleExcelUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <Download className="w-4 h-4 mr-2" />
              ดาวน์โหลด Template
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => {
                setImportType("รับเข้า");
                fileInputRef.current?.click();
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              นำเข้า Excel (รับเข้า)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50"
              onClick={() => {
                setImportType("จ่ายออก");
                fileInputRef.current?.click();
              }}
            >
              <Upload className="w-4 h-4 mr-2" />
              นำเข้า Excel (จ่ายออก)
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <ArrowDownCircle className="w-5 h-5" />
                  รับเข้าสินค้า
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>รายการสินค้า</Label>
                  <Select value={receiveSupplyId} onValueChange={setReceiveSupplyId}>
                    <SelectTrigger><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
                    <SelectContent>
                      {supplies.map(s => (
                        <SelectItem key={s.supplyId} value={String(s.supplyId)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>จำนวน</Label>
                    <Input type="number" placeholder="0" value={receiveQty} onChange={(e) => setReceiveQty(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>หน่วย</Label>
                    <Input value={selectedReceiveSupply?.unit || ""} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>หมายเหตุ</Label>
                  <Textarea placeholder="เช่น รับจากซัพพลายเออร์, เลขที่ PO" value={receiveNote} onChange={(e) => setReceiveNote(e.target.value)} />
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700" disabled={submitting} onClick={handleReceiveSubmit}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  บันทึกรับเข้า
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <ArrowUpCircle className="w-5 h-5" />
                  จ่ายออกสินค้า
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>รายการสินค้า</Label>
                  <Select value={issueSupplyId} onValueChange={setIssueSupplyId}>
                    <SelectTrigger><SelectValue placeholder="เลือกสินค้า" /></SelectTrigger>
                    <SelectContent>
                      {supplies.map(s => (
                        <SelectItem key={s.supplyId} value={String(s.supplyId)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>จำนวน</Label>
                    <Input type="number" placeholder="0" value={issueQty} onChange={(e) => setIssueQty(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>หน่วย</Label>
                    <Input value={selectedIssueSupply?.unit || ""} disabled />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>อ้างอิง Order</Label>
                  <Input placeholder="เช่น ORD-001" value={issueOrderRef} onChange={(e) => setIssueOrderRef(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>หมายเหตุ</Label>
                  <Textarea placeholder="รายละเอียดเพิ่มเติม" value={issueNote} onChange={(e) => setIssueNote(e.target.value)} />
                </div>
                <Button className="w-full" variant="destructive" disabled={submitting} onClick={handleIssueSubmit}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Minus className="w-4 h-4 mr-2" />}
                  บันทึกจ่ายออก
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Excel Import Preview Dialog */}
        <Dialog open={showExcelImport} onOpenChange={(open) => {
          setShowExcelImport(open);
          if (!open) { setExcelData([]); setRowErrors({}); setHeaderErrors([]); }
        }}>
          <DialogContent className="sm:max-w-[900px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                ตรวจสอบข้อมูลก่อนนำเข้า ({importType})
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 flex-1 overflow-hidden">
              {/* Summary bar */}
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  {excelFileName}
                </Badge>
                <Badge className={importType === "รับเข้า" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                  {importType}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  พบ {excelData.length} รายการ
                </span>
                {hasErrors ? (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    พบปัญหา {errorCount} แถว
                  </Badge>
                ) : excelData.length > 0 ? (
                  <Badge className="bg-green-100 text-green-700 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    ข้อมูลถูกต้องทั้งหมด
                  </Badge>
                ) : null}
              </div>

              {/* Header-level errors */}
              {headerErrors.length > 0 && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 space-y-1">
                  <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    ปัญหาโครงสร้างไฟล์
                  </p>
                  {headerErrors.map((err, i) => (
                    <p key={i} className="text-sm text-destructive/80 ml-5">• {err}</p>
                  ))}
                  <p className="text-xs text-muted-foreground ml-5 mt-1">
                    คอลัมน์ที่ต้องมี: {REQUIRED_COLUMNS.join(", ")}
                  </p>
                </div>
              )}

              {/* Data table */}
              <div className="rounded-md border overflow-auto max-h-[350px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead className="w-16">สถานะ</TableHead>
                      {excelData.length > 0 &&
                        Object.keys(excelData[0]).map((key) => (
                          <TableHead key={key}>{key}</TableHead>
                        ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excelData.map((row, idx) => {
                      const errs = rowErrors[idx];
                      const hasErr = !!errs;
                      return (
                        <>
                          <TableRow key={idx} className={hasErr ? "bg-destructive/5 hover:bg-destructive/10" : ""}>
                            <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                            <TableCell>
                              {hasErr ? (
                                <AlertTriangle className="w-4 h-4 text-destructive" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                            </TableCell>
                            {Object.values(row).map((val: any, i) => (
                              <TableCell key={i} className="text-sm">{String(val)}</TableCell>
                            ))}
                          </TableRow>
                          {hasErr && (
                            <TableRow key={`err-${idx}`} className="bg-destructive/5 hover:bg-destructive/10">
                              <TableCell colSpan={Object.keys(row).length + 2} className="py-1 px-4">
                                <div className="flex flex-wrap gap-2">
                                  {errs.map((e, ei) => (
                                    <span key={ei} className="text-xs text-destructive">⚠ {e}</span>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setShowExcelImport(false); setExcelData([]); setRowErrors({}); setHeaderErrors([]); }}>
                <X className="w-4 h-4 mr-1" />
                ยกเลิก
              </Button>
              <Button
                className={importType === "รับเข้า" && !hasErrors ? "bg-green-600 hover:bg-green-700" : ""}
                variant={importType === "จ่ายออก" ? "destructive" : "default"}
                disabled={hasErrors || importing}
                onClick={handleConfirmImport}
              >
                {importing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                {hasErrors ? `แก้ไข ${errorCount} แถวก่อนนำเข้า` : `ยืนยันนำเข้า ${excelData.length} รายการ`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tab: Movement History */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="ค้นหาประวัติ..." className="pl-10" />
            </div>
            <Button variant="outline">วันนี้</Button>
            <Button variant="outline">สัปดาห์นี้</Button>
            <Button variant="outline">เดือนนี้</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ประวัติการเคลื่อนไหวสินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัส</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>สินค้า</TableHead>
                    <TableHead>จำนวน</TableHead>
                    <TableHead>หน่วย</TableHead>
                    <TableHead>ผู้ดำเนินการ</TableHead>
                    <TableHead>หมายเหตุ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell className="font-medium">{mov.id}</TableCell>
                      <TableCell>{mov.date}</TableCell>
                      <TableCell>{getMovementBadge(mov.type)}</TableCell>
                      <TableCell>{mov.item}</TableCell>
                      <TableCell className={mov.qty > 0 ? "text-green-600" : "text-red-600"}>
                        {mov.qty > 0 ? `+${mov.qty}` : mov.qty}
                      </TableCell>
                      <TableCell>{mov.unit}</TableCell>
                      <TableCell>{mov.by}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{mov.note}</TableCell>
                    </TableRow>
                  ))}
                  {movements.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">ยังไม่มีประวัติการเคลื่อนไหว</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Defective Items */}
        <TabsContent value="defective" className="space-y-4">
          <DefectiveItemsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
