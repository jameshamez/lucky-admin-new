import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

// --- Types ---
export interface ExpenseImportRow {
  rowIndex: number;
  supplier: string;
  poNo: string;
  invoiceNo: string;
  purchaseDate: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  remark: string;
  errors: string[];
  isValid: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportConfirm: (rows: ExpenseImportRow[]) => void;
}

const REQUIRED_COLUMNS = ["โรงงาน/ผู้ขาย", "รายละเอียดสินค้า", "จำนวน", "ราคาต่อหน่วย"];

const TEMPLATE_COLUMNS = [
  "โรงงาน/ผู้ขาย",
  "หมายเลข PO",
  "หมายเลข Invoice",
  "วันที่สั่งซื้อ",
  "รายละเอียดสินค้า",
  "จำนวน",
  "ราคาต่อหน่วย",
  "สกุลเงิน",
  "ราคารวม",
  "วิธีชำระเงิน",
  "สถานะชำระเงิน",
  "หมายเหตุ",
];

export default function ExpenseExcelImportDialog({ open, onOpenChange, onImportConfirm }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importRows, setImportRows] = useState<ExpenseImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const validRows = importRows.filter((r) => r.isValid);
  const invalidRows = importRows.filter((r) => !r.isValid);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "โรงงาน/ผู้ขาย": "China BENC",
        "หมายเลข PO": "PO-2025-001",
        "หมายเลข Invoice": "INV-CN-001",
        "วันที่สั่งซื้อ": "2025-01-10",
        "รายละเอียดสินค้า": "ปากกาพลาสติก",
        "จำนวน": 5000,
        "ราคาต่อหน่วย": 15,
        "สกุลเงิน": "THB",
        "ราคารวม": 75000,
        "วิธีชำระเงิน": "โอน",
        "สถานะชำระเงิน": "จ่ายแล้ว",
        "หมายเหตุ": "สั่งจากจีน",
      },
      {
        "โรงงาน/ผู้ขาย": "บริษัท พรีเมี่ยม จำกัด",
        "หมายเลข PO": "PO-2025-002",
        "หมายเลข Invoice": "INV-TH-002",
        "วันที่สั่งซื้อ": "2025-01-12",
        "รายละเอียดสินค้า": "กระเป๋าผ้า Canvas",
        "จำนวน": 500,
        "ราคาต่อหน่วย": 90,
        "สกุลเงิน": "THB",
        "ราคารวม": 45000,
        "วิธีชำระเงิน": "เช็ค",
        "สถานะชำระเงิน": "รออนุมัติ",
        "หมายเหตุ": "รอการอนุมัติ",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "รายจ่าย");
    ws["!cols"] = TEMPLATE_COLUMNS.map(() => ({ wch: 20 }));
    XLSX.writeFile(wb, "template_expense_import.xlsx");
    toast.success("ดาวน์โหลดเทมเพลตเรียบร้อย");
  };

  const validateRow = (row: Record<string, unknown>, rowIndex: number): ExpenseImportRow => {
    const errors: string[] = [];

    const supplier = String(row["โรงงาน/ผู้ขาย"] || "").trim();
    const poNo = String(row["หมายเลข PO"] || "").trim();
    const invoiceNo = String(row["หมายเลข Invoice"] || "").trim();
    const purchaseDate = String(row["วันที่สั่งซื้อ"] || "").trim();
    const description = String(row["รายละเอียดสินค้า"] || "").trim();
    const quantity = Number(row["จำนวน"]);
    const unitPrice = Number(row["ราคาต่อหน่วย"]);
    const currency = String(row["สกุลเงิน"] || "THB").trim();
    const totalAmount = Number(row["ราคารวม"]) || quantity * unitPrice;
    const paymentMethod = String(row["วิธีชำระเงิน"] || "โอน").trim();
    const paymentStatus = String(row["สถานะชำระเงิน"] || "รออนุมัติ").trim();
    const remark = String(row["หมายเหตุ"] || "").trim();

    if (!supplier) errors.push("ไม่มีชื่อโรงงาน/ผู้ขาย");
    if (!description) errors.push("ไม่มีรายละเอียดสินค้า");
    if (isNaN(quantity) || quantity <= 0) errors.push("จำนวนต้องเป็นตัวเลข > 0");
    if (isNaN(unitPrice) || unitPrice <= 0) errors.push("ราคาต่อหน่วยต้องเป็นตัวเลข > 0");
    if (!["THB", "USD", "CNY", "EUR", "JPY"].includes(currency)) errors.push("สกุลเงินไม่ถูกต้อง");
    if (!["จ่ายแล้ว", "รออนุมัติ", "ยกเลิก"].includes(paymentStatus)) errors.push("สถานะชำระเงินไม่ถูกต้อง");

    return {
      rowIndex,
      supplier,
      poNo,
      invoiceNo,
      purchaseDate,
      description,
      quantity: isNaN(quantity) ? 0 : quantity,
      unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
      currency,
      totalAmount,
      paymentMethod,
      paymentStatus,
      remark,
      errors,
      isValid: errors.length === 0,
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("กรุณาอัปโหลดไฟล์ Excel (.xlsx, .xls) หรือ CSV เท่านั้น");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ไฟล์มีขนาดใหญ่เกิน 5MB");
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

        if (jsonData.length === 0) {
          toast.error("ไฟล์ไม่มีข้อมูล กรุณาตรวจสอบไฟล์");
          setIsProcessing(false);
          return;
        }
        if (jsonData.length > 500) {
          toast.error("ไฟล์มีข้อมูลมากเกิน 500 แถว กรุณาแบ่งไฟล์");
          setIsProcessing(false);
          return;
        }

        const firstRow = jsonData[0];
        const missingCols = REQUIRED_COLUMNS.filter((col) => !(col in firstRow));
        if (missingCols.length > 0) {
          toast.error(`ไม่พบคอลัมน์ที่จำเป็น: ${missingCols.join(", ")}`);
          setIsProcessing(false);
          return;
        }

        const rows = jsonData.map((row, idx) => validateRow(row, idx + 2));
        setImportRows(rows);
        setStep("preview");
        setIsProcessing(false);
      } catch {
        toast.error("ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์");
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmImport = () => {
    setShowConfirmDialog(false);
    onImportConfirm(validRows);
    toast.success(`นำเข้ารายจ่าย ${validRows.length} รายการเรียบร้อย`);
    resetState();
  };

  const resetState = () => {
    setImportRows([]);
    setStep("upload");
    setFileName("");
    onOpenChange(false);
  };

  const totalImportAmount = validRows.reduce((s, r) => s + r.totalAmount, 0);

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
        <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              นำเข้ารายจ่ายจากไฟล์ Excel
            </DialogTitle>
          </DialogHeader>

          {step === "upload" && (
            <div className="space-y-6 py-4">
              <div className="bg-muted/50 rounded-lg p-4 border space-y-3">
                <h4 className="font-semibold text-sm">📋 คำแนะนำการนำเข้า</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                  <li>รองรับไฟล์ <strong>.xlsx, .xls, .csv</strong> ขนาดไม่เกิน 5MB</li>
                  <li>จำนวนแถวสูงสุด 500 แถวต่อครั้ง</li>
                  <li>คอลัมน์ที่จำเป็น: <strong>โรงงาน/ผู้ขาย, รายละเอียดสินค้า, จำนวน, ราคาต่อหน่วย</strong></li>
                  <li>คอลัมน์เพิ่มเติม: หมายเลข PO, หมายเลข Invoice, วันที่สั่งซื้อ, สกุลเงิน, ราคารวม, วิธีชำระเงิน, สถานะชำระเงิน, หมายเหตุ</li>
                  <li>สกุลเงินที่รองรับ: THB, USD, CNY, EUR, JPY</li>
                  <li>สถานะที่รองรับ: จ่ายแล้ว, รออนุมัติ, ยกเลิก</li>
                </ul>
              </div>

              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div>
                  <p className="font-medium text-sm">ดาวน์โหลดเทมเพลต</p>
                  <p className="text-xs text-muted-foreground">ดาวน์โหลดไฟล์ตัวอย่างเพื่อใช้เป็นต้นแบบในการกรอกข้อมูล</p>
                </div>
                <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10" onClick={handleDownloadTemplate}>
                  <Download className="w-4 h-4 mr-2" /> ดาวน์โหลดเทมเพลต
                </Button>
              </div>

              <div
                className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">กำลังประมวลผลไฟล์...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground" />
                    <div className="text-center">
                      <p className="font-medium">คลิกเพื่ออัปโหลดไฟล์</p>
                      <p className="text-xs text-muted-foreground mt-1">รองรับ .xlsx, .xls, .csv (สูงสุด 5MB)</p>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{fileName}</span>
                  <span className="text-muted-foreground">({importRows.length} แถว)</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setStep("upload"); setImportRows([]); }}>
                  เลือกไฟล์ใหม่
                </Button>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 border text-center">
                  <p className="text-2xl font-bold">{importRows.length}</p>
                  <p className="text-xs text-muted-foreground">ทั้งหมด</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                  <p className="text-2xl font-bold text-green-700">{validRows.length}</p>
                  <p className="text-xs text-green-700 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ผ่านตรวจสอบ
                  </p>
                </div>
                <div className={`rounded-lg p-3 border text-center ${invalidRows.length > 0 ? "bg-red-50 border-red-200" : "bg-muted/50"}`}>
                  <p className={`text-2xl font-bold ${invalidRows.length > 0 ? "text-red-600" : ""}`}>{invalidRows.length}</p>
                  <p className={`text-xs flex items-center justify-center gap-1 ${invalidRows.length > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                    <XCircle className="w-3 h-3" /> มีข้อผิดพลาด
                  </p>
                </div>
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
                  <p className="text-2xl font-bold text-primary">฿{totalImportAmount.toLocaleString()}</p>
                  <p className="text-xs text-primary">ยอดรวมนำเข้า</p>
                </div>
              </div>

              {/* Error rows */}
              {invalidRows.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> รายการที่มีข้อผิดพลาด ({invalidRows.length} แถว)
                  </h4>
                  <div className="border border-red-200 rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-red-50">
                          <TableHead className="text-xs w-[50px]">แถว</TableHead>
                          <TableHead className="text-xs">ผู้ขาย</TableHead>
                          <TableHead className="text-xs">รายละเอียด</TableHead>
                          <TableHead className="text-xs text-right">จำนวน</TableHead>
                          <TableHead className="text-xs text-right">ราคา/หน่วย</TableHead>
                          <TableHead className="text-xs">ข้อผิดพลาด</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invalidRows.map((row) => (
                          <TableRow key={row.rowIndex} className="bg-red-50/50">
                            <TableCell className="text-xs font-medium">{row.rowIndex}</TableCell>
                            <TableCell className="text-xs">{row.supplier || "-"}</TableCell>
                            <TableCell className="text-xs max-w-[150px] truncate">{row.description || "-"}</TableCell>
                            <TableCell className="text-xs text-right">{row.quantity}</TableCell>
                            <TableCell className="text-xs text-right">{row.unitPrice.toLocaleString()}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {row.errors.map((err, i) => (
                                  <Badge key={i} variant="destructive" className="text-[10px] px-1.5 py-0">
                                    {err}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Valid rows preview */}
              {validRows.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> รายการที่พร้อมนำเข้า ({validRows.length} แถว)
                  </h4>
                  <div className="border border-green-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-green-50">
                          <TableHead className="text-xs w-[50px]">แถว</TableHead>
                          <TableHead className="text-xs">ผู้ขาย</TableHead>
                          <TableHead className="text-xs">PO No.</TableHead>
                          <TableHead className="text-xs">Invoice</TableHead>
                          <TableHead className="text-xs">รายละเอียด</TableHead>
                          <TableHead className="text-xs text-right">จำนวน</TableHead>
                          <TableHead className="text-xs text-right">ราคา/หน่วย</TableHead>
                          <TableHead className="text-xs text-center">สกุลเงิน</TableHead>
                          <TableHead className="text-xs text-right">ราคารวม</TableHead>
                          <TableHead className="text-xs">สถานะ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validRows.map((row) => (
                          <TableRow key={row.rowIndex}>
                            <TableCell className="text-xs font-medium">{row.rowIndex}</TableCell>
                            <TableCell className="text-xs">{row.supplier}</TableCell>
                            <TableCell className="text-xs font-mono">{row.poNo || "-"}</TableCell>
                            <TableCell className="text-xs font-mono">{row.invoiceNo || "-"}</TableCell>
                            <TableCell className="text-xs max-w-[150px] truncate">{row.description}</TableCell>
                            <TableCell className="text-xs text-right">{row.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right">{row.unitPrice.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-center">
                              <Badge variant="outline" className="text-[10px]">{row.currency}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right font-medium">฿{row.totalAmount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px]">{row.paymentStatus}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={resetState}>ยกเลิก</Button>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={validRows.length === 0}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  นำเข้า {validRows.length} รายการ
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการนำเข้ารายจ่าย</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>คุณต้องการนำเข้ารายจ่ายจำนวน <strong>{validRows.length}</strong> รายการ หรือไม่?</p>
                <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>จำนวนรายการ:</span>
                    <span className="font-semibold">{validRows.length} รายการ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ยอดรวมทั้งหมด:</span>
                    <span className="font-semibold text-primary">฿{totalImportAmount.toLocaleString()}</span>
                  </div>
                  {invalidRows.length > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>ข้ามรายการที่มีข้อผิดพลาด:</span>
                      <span className="font-semibold">{invalidRows.length} รายการ</span>
                    </div>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              ยืนยันนำเข้า
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
