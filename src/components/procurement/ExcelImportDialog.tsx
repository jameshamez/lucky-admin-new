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
export interface ImportRow {
  rowIndex: number;
  sku: string;
  name: string;
  category: string;
  color: string;
  size: string;
  description: string;
  quantity: number;
  minQty: number;
  manufact: string;
  mtl: string;
  noted: string;
  priceYuan: number;
  priceTHB: number;
  amountRMB: number;
  totalTHB: number;
  pcsCtn: number;
  ctn: number;
  boxSize: string;
  boxSizeNum: number;
  shippingCost: number;
  shippingPerPiece: number;
  totalShipping: number;
  meas: number;
  gw: number;
  tgw: number;
  errors: string[];
  isValid: boolean;
}

interface ExcelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportConfirm: (rows: ImportRow[]) => void;
  existingSkus: string[];
}

const REQUIRED_COLUMNS = ["รหัสสินค้า (SKU)", "ชื่อสินค้า", "จำนวน", "หน่วยขั้นต่ำ"];
const ALL_COLUMNS = [
  "MANUFACT", "รหัสสินค้า (SKU)", "ชื่อสินค้า", "SIZE", "COLOR", "MTL", "Noted",
  "หมวดหมู่", "รายละเอียด", "จำนวน", "หน่วยขั้นต่ำ",
  "PRICE (¥)", "บาท", "AMOUNT RMB", "ราคารวม THB",
  "PCS/CTN", "CTN", "BOX SIZE", "BOX SIZE (ตัวเลข)",
  "ค่าขนส่ง", "ราคาค่าขนส่งต่อชิ้น", "รวมขนส่ง",
  "MEAS", "GW", "T.GW",
];

export default function ExcelImportDialog({
  open,
  onOpenChange,
  onImportConfirm,
  existingSkus,
}: ExcelImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");

  const validRows = importRows.filter((r) => r.isValid);
  const invalidRows = importRows.filter((r) => !r.isValid);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "MANUFACT": "BC",
        "รหัสสินค้า (SKU)": "B531-G",
        "ชื่อสินค้า": "ถ้วยรางวัล B531 G",
        "SIZE": "H192mm",
        "COLOR": "G",
        "MTL": "PLASTIC",
        "Noted": "",
        "หมวดหมู่": "ถ้วยรางวัล",
        "รายละเอียด": "ถ้วยรางวัลพลาสติก",
        "จำนวน": 400,
        "หน่วยขั้นต่ำ": 50,
        "PRICE (¥)": 3.00,
        "บาท": 15.60,
        "AMOUNT RMB": 1200,
        "ราคารวม THB": 6240,
        "PCS/CTN": 200,
        "CTN": 2,
        "BOX SIZE": "B2",
        "BOX SIZE (ตัวเลข)": 0.035,
        "ค่าขนส่ง": 105,
        "ราคาค่าขนส่งต่อชิ้น": 0.53,
        "รวมขนส่ง": 16.13,
        "MEAS": 0.07,
        "GW": 6.5,
        "T.GW": 13,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "สินค้า");
    ws["!cols"] = ALL_COLUMNS.map(() => ({ wch: 18 }));
    XLSX.writeFile(wb, "template_inventory_import.xlsx");
    toast.success("ดาวน์โหลดเทมเพลตเรียบร้อย");
  };

  const validateRow = (row: Record<string, unknown>, rowIndex: number): ImportRow => {
    const errors: string[] = [];

    const sku = String(row["รหัสสินค้า (SKU)"] || "").trim();
    const name = String(row["ชื่อสินค้า"] || "").trim();
    const category = String(row["หมวดหมู่"] || "").trim();
    const color = String(row["COLOR"] || row["สี"] || "").trim();
    const size = String(row["SIZE"] || row["ขนาด"] || "").trim();
    const description = String(row["รายละเอียด"] || "").trim();
    const quantity = Number(row["จำนวน"]);
    const minQty = Number(row["หน่วยขั้นต่ำ"]);

    const manufact = String(row["MANUFACT"] || "").trim();
    const mtl = String(row["MTL"] || "").trim();
    const noted = String(row["Noted"] || "").trim();
    const priceYuan = Number(row["PRICE (¥)"]) || 0;
    const priceTHB = Number(row["บาท"]) || 0;
    const amountRMB = Number(row["AMOUNT RMB"]) || 0;
    const totalTHB = Number(row["ราคารวม THB"]) || 0;
    const pcsCtn = Number(row["PCS/CTN"]) || 0;
    const ctn = Number(row["CTN"]) || 0;
    const boxSize = String(row["BOX SIZE"] || "").trim();
    const boxSizeNum = Number(row["BOX SIZE (ตัวเลข)"]) || 0;
    const shippingCost = Number(row["ค่าขนส่ง"]) || 0;
    const shippingPerPiece = Number(row["ราคาค่าขนส่งต่อชิ้น"]) || 0;
    const totalShipping = Number(row["รวมขนส่ง"]) || 0;
    const meas = Number(row["MEAS"]) || 0;
    const gw = Number(row["GW"]) || 0;
    const tgw = Number(row["T.GW"]) || 0;

    if (!sku) errors.push("ไม่มีรหัสสินค้า (SKU)");
    if (sku && sku.length > 50) errors.push("รหัสสินค้ายาวเกิน 50 ตัวอักษร");
    if (!name) errors.push("ไม่มีชื่อสินค้า");
    if (name && name.length > 200) errors.push("ชื่อสินค้ายาวเกิน 200 ตัวอักษร");
    if (isNaN(quantity) || quantity < 0) errors.push("จำนวนต้องเป็นตัวเลข ≥ 0");
    if (!Number.isFinite(quantity)) errors.push("จำนวนไม่ถูกต้อง");
    if (isNaN(minQty) || minQty < 0) errors.push("หน่วยขั้นต่ำต้องเป็นตัวเลข ≥ 0");
    if (sku && existingSkus.includes(sku)) errors.push("รหัสสินค้าซ้ำกับในระบบ");

    return {
      rowIndex, sku, name, category, color, size, description,
      quantity: isNaN(quantity) ? 0 : quantity,
      minQty: isNaN(minQty) ? 0 : minQty,
      manufact, mtl, noted, priceYuan, priceTHB, amountRMB, totalTHB,
      pcsCtn, ctn, boxSize, boxSizeNum, shippingCost, shippingPerPiece,
      totalShipping, meas, gw, tgw,
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

        const skusInFile: string[] = [];
        const rows = jsonData.map((row, idx) => {
          const validated = validateRow(row, idx + 2);
          if (validated.sku && skusInFile.includes(validated.sku)) {
            validated.errors.push("รหัสสินค้าซ้ำกันในไฟล์");
            validated.isValid = false;
          }
          if (validated.sku) skusInFile.push(validated.sku);
          return validated;
        });

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
    toast.success(`นำเข้าสินค้า ${validRows.length} รายการ เรียบร้อย`);
    resetState();
  };

  const resetState = () => {
    setImportRows([]);
    setStep("upload");
    setFileName("");
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) resetState(); onOpenChange(v); }}>
        <DialogContent className="sm:max-w-[1100px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              นำเข้าสินค้าจากไฟล์ Excel
            </DialogTitle>
          </DialogHeader>

          {step === "upload" && (
            <div className="space-y-6 py-4">
              <div className="bg-muted/50 rounded-lg p-4 border space-y-3">
                <h4 className="font-semibold text-sm">📋 คำแนะนำการนำเข้า</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                  <li>รองรับไฟล์ <strong>.xlsx, .xls, .csv</strong> ขนาดไม่เกิน 5MB</li>
                  <li>จำนวนแถวสูงสุด 500 แถวต่อครั้ง</li>
                  <li>คอลัมน์ที่จำเป็น: <strong>รหัสสินค้า (SKU), ชื่อสินค้า, จำนวน, หน่วยขั้นต่ำ</strong></li>
                  <li>คอลัมน์เพิ่มเติม: MANUFACT, SIZE, COLOR, MTL, Noted, PRICE (¥), บาท, AMOUNT RMB, ราคารวม THB, PCS/CTN, CTN, BOX SIZE, ค่าขนส่ง, รวมขนส่ง, MEAS, GW, T.GW</li>
                  <li>รหัสสินค้า (SKU) ต้องไม่ซ้ำกับในระบบ</li>
                </ul>
              </div>

              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
                <div>
                  <p className="font-medium text-sm">ดาวน์โหลดเทมเพลต</p>
                  <p className="text-xs text-muted-foreground">ดาวน์โหลดไฟล์ตัวอย่างเพื่อใช้เป็นต้นแบบในการกรอกข้อมูล</p>
                </div>
                <Button variant="outline" className="border-green-400 text-green-700 hover:bg-green-100" onClick={handleDownloadTemplate}>
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

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 border text-center">
                  <p className="text-2xl font-bold">{importRows.length}</p>
                  <p className="text-xs text-muted-foreground">ทั้งหมด</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200 text-center">
                  <p className="text-2xl font-bold text-green-700">{validRows.length}</p>
                  <p className="text-xs text-green-700 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ผ่านการตรวจสอบ
                  </p>
                </div>
                <div className={`rounded-lg p-3 border text-center ${invalidRows.length > 0 ? "bg-red-50 border-red-200" : "bg-muted/50"}`}>
                  <p className={`text-2xl font-bold ${invalidRows.length > 0 ? "text-red-600" : ""}`}>{invalidRows.length}</p>
                  <p className={`text-xs flex items-center justify-center gap-1 ${invalidRows.length > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                    <XCircle className="w-3 h-3" /> มีข้อผิดพลาด
                  </p>
                </div>
              </div>

              {invalidRows.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> รายการที่มีข้อผิดพลาด ({invalidRows.length} แถว)
                  </h4>
                  <div className="border border-red-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-red-50">
                          <TableHead className="text-xs w-[60px]">แถว</TableHead>
                          <TableHead className="text-xs">MANUFACT</TableHead>
                          <TableHead className="text-xs">รหัส SKU</TableHead>
                          <TableHead className="text-xs">ชื่อสินค้า</TableHead>
                          <TableHead className="text-xs text-right">QTY</TableHead>
                          <TableHead className="text-xs text-right">PRICE (¥)</TableHead>
                          <TableHead className="text-xs">ข้อผิดพลาด</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invalidRows.map((row) => (
                          <TableRow key={row.rowIndex} className="bg-red-50/50">
                            <TableCell className="text-xs font-medium">{row.rowIndex}</TableCell>
                            <TableCell className="text-xs">{row.manufact || "-"}</TableCell>
                            <TableCell className="text-xs">{row.sku || <span className="text-red-400 italic">ว่าง</span>}</TableCell>
                            <TableCell className="text-xs">{row.name || <span className="text-red-400 italic">ว่าง</span>}</TableCell>
                            <TableCell className="text-xs text-right">{row.quantity}</TableCell>
                            <TableCell className="text-xs text-right">{row.priceYuan}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {row.errors.map((err, i) => (
                                  <Badge key={i} variant="destructive" className="text-[10px] py-0 px-1.5">
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

              {validRows.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-green-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> รายการที่พร้อมนำเข้า ({validRows.length} แถว)
                  </h4>
                  <div className="border border-green-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-green-50">
                            <TableHead className="text-xs w-[60px]">แถว</TableHead>
                            <TableHead className="text-xs">MANUFACT</TableHead>
                            <TableHead className="text-xs">รหัส SKU</TableHead>
                            <TableHead className="text-xs">ชื่อสินค้า</TableHead>
                            <TableHead className="text-xs">SIZE</TableHead>
                            <TableHead className="text-xs">COLOR</TableHead>
                            <TableHead className="text-xs">MTL</TableHead>
                            <TableHead className="text-xs text-right">QTY</TableHead>
                            <TableHead className="text-xs text-right">PRICE (¥)</TableHead>
                            <TableHead className="text-xs text-right">บาท</TableHead>
                            <TableHead className="text-xs text-right">AMOUNT RMB</TableHead>
                            <TableHead className="text-xs text-right">ราคารวม THB</TableHead>
                            <TableHead className="text-xs text-right">PCS/CTN</TableHead>
                            <TableHead className="text-xs text-right">CTN</TableHead>
                            <TableHead className="text-xs">BOX SIZE</TableHead>
                            <TableHead className="text-xs text-right">ค่าขนส่ง</TableHead>
                            <TableHead className="text-xs text-right text-green-700 font-bold">รวมขนส่ง</TableHead>
                            <TableHead className="text-xs text-right">GW</TableHead>
                            <TableHead className="text-xs text-right">T.GW</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {validRows.map((row) => (
                            <TableRow key={row.rowIndex}>
                              <TableCell className="text-xs font-medium">{row.rowIndex}</TableCell>
                              <TableCell className="text-xs">{row.manufact || "-"}</TableCell>
                              <TableCell className="text-xs font-medium">{row.sku}</TableCell>
                              <TableCell className="text-xs">{row.name}</TableCell>
                              <TableCell className="text-xs">{row.size || "-"}</TableCell>
                              <TableCell className="text-xs">{row.color || "-"}</TableCell>
                              <TableCell className="text-xs">{row.mtl || "-"}</TableCell>
                              <TableCell className="text-xs text-right font-semibold">{row.quantity}</TableCell>
                              <TableCell className="text-xs text-right">¥{row.priceYuan.toFixed(2)}</TableCell>
                              <TableCell className="text-xs text-right">฿{row.priceTHB.toFixed(2)}</TableCell>
                              <TableCell className="text-xs text-right">¥{row.amountRMB.toLocaleString()}</TableCell>
                              <TableCell className="text-xs text-right">฿{row.totalTHB.toLocaleString()}</TableCell>
                              <TableCell className="text-xs text-right">{row.pcsCtn}</TableCell>
                              <TableCell className="text-xs text-right">{row.ctn}</TableCell>
                              <TableCell className="text-xs">{row.boxSize || "-"}</TableCell>
                              <TableCell className="text-xs text-right">{row.shippingCost.toFixed(2)}</TableCell>
                              <TableCell className="text-xs text-right text-green-700 font-bold">{row.totalShipping.toFixed(2)}</TableCell>
                              <TableCell className="text-xs text-right">{row.gw.toFixed(2)}</TableCell>
                              <TableCell className="text-xs text-right">{row.tgw}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "preview" && (
            <DialogFooter className="gap-2 pt-4">
              <Button variant="outline" onClick={resetState}>
                ยกเลิก
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={validRows.length === 0}
                onClick={() => setShowConfirmDialog(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                นำเข้า {validRows.length} รายการ
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการนำเข้าสินค้า</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                คุณต้องการนำเข้าสินค้าจำนวน <strong className="text-foreground">{validRows.length} รายการ</strong> ใช่หรือไม่?
              </span>
              {invalidRows.length > 0 && (
                <span className="block text-amber-600">
                  ⚠️ มี {invalidRows.length} รายการที่มีข้อผิดพลาดและจะถูกข้ามไป
                </span>
              )}
              <span className="block text-sm">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction className="bg-green-600 hover:bg-green-700" onClick={handleConfirmImport}>
              ยืนยันนำเข้า
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


