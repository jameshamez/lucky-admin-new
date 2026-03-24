import { useState, useMemo, useEffect } from "react";
import { accountingService } from "@/services/accountingService";
import ExpenseExcelImportDialog, { type ExpenseImportRow } from "@/components/accounting/expenses/ExpenseExcelImportDialog";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Download, Search, Plus, FileText, AlertCircle, Edit, Trash2, ArrowUpDown, Eye, Paperclip, Upload } from "lucide-react";
import { toast } from "sonner";

// ── Types ──
interface ExpenseItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: string;
}

interface DrawerState {
  supplier: string;
  poNo: string;
  invoiceNo: string;
  purchaseDate: string;
  items: ExpenseItem[];
  includeVat: boolean;
  payments: PaymentRecord[];
  paymentStatus: string;
  remark: string;
  slipFile: File | null;
  receiptFile: File | null;
  slipPreview: string | null;
  receiptPreview: string | null;
}

const emptyItem = (): ExpenseItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 0,
  unitPrice: 0,
  currency: "THB",
});

const emptyPayment = (): PaymentRecord => ({
  id: crypto.randomUUID(),
  date: new Date().toISOString().split("T")[0],
  amount: 0,
  method: "โอน",
});

const defaultDrawer = (): DrawerState => ({
  supplier: "",
  poNo: "",
  invoiceNo: "",
  purchaseDate: "",
  items: [emptyItem()],
  includeVat: true,
  payments: [],
  paymentStatus: "รออนุมัติ",
  remark: "",
  slipFile: null,
  receiptFile: null,
  slipPreview: null,
  receiptPreview: null,
});

// ── Default Suppliers (if API doesn't provide) ──
const suppliersList = [
  "Chaina B&C", "Chaina LINDA", "Chaina PN", "Chaina Xiaoli", "Chaina ZJ",
  "China BENC", "China Lanyard A", "China U", "China W", "China X", "China Y", "China Z",
  "Papermate", "Shinemaker", "The101", "บริษัท พรีเมี่ยมแบงค์ค็อก จำกัด", "ไทย Solid", "PV พิวเตอร์"
];

// ── Drawer Form Component ──
function ExpenseDrawerForm({
  state,
  setState,
  onSave,
  onClose,
  title,
}: {
  state: DrawerState;
  setState: React.Dispatch<React.SetStateAction<DrawerState>>;
  onSave: () => void;
  onClose: () => void;
  title: string;
}) {
  const subtotal = state.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const vatAmount = state.includeVat ? subtotal * 0.07 : 0;
  const netTotal = subtotal + vatAmount;
  const totalPaid = state.payments.reduce((s, p) => s + p.amount, 0);
  const remaining = netTotal - totalPaid;

  const updateItem = (id: string, field: keyof ExpenseItem, value: string | number) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(i => (i.id === id ? { ...i, [field]: value } : i)),
    }));
  };

  const addItem = () => setState(prev => ({ ...prev, items: [...prev.items, emptyItem()] }));
  const removeItem = (id: string) => setState(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));

  const updatePayment = (id: string, field: keyof PaymentRecord, value: string | number) => {
    setState(prev => ({
      ...prev,
      payments: prev.payments.map(p => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  };
  const addPayment = () => setState(prev => ({ ...prev, payments: [...prev.payments, emptyPayment()] }));
  const removePayment = (id: string) => setState(prev => ({ ...prev, payments: prev.payments.filter(p => p.id !== id) }));

  const handleFileChange = (field: "slipFile" | "receiptFile", previewField: "slipPreview" | "receiptPreview", file: File | null) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setState(prev => ({ ...prev, [field]: file, [previewField]: url }));
    }
  };

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  return (
    <>
      {/* Drawer scrollable content */}
      <ScrollArea className="flex-1 px-6 [&_[data-radix-scroll-area-scrollbar]]:w-1.5 [&_[data-radix-scroll-area-thumb]]:bg-primary/40 [&_[data-radix-scroll-area-thumb]]:rounded-full">
        <div className="space-y-6 pb-32">
          {/* ── Section 1: Header Info ── */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">ข้อมูลหลัก</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">โรงงาน / ผู้ขาย</Label>
                <Select value={state.supplier} onValueChange={v => setState(p => ({ ...p, supplier: v }))}>
                  <SelectTrigger><SelectValue placeholder="เลือกผู้ขาย" /></SelectTrigger>
                  <SelectContent>
                    {suppliersList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-semibold">หมายเลขใบสั่งซื้อ (PO No.)</Label>
                <Input value={state.poNo} onChange={e => setState(p => ({ ...p, poNo: e.target.value }))} placeholder="PO-2025-XXX" />
              </div>
              <div>
                <Label className="text-xs font-semibold">หมายเลขใบแจ้งหนี้</Label>
                <Input value={state.invoiceNo} onChange={e => setState(p => ({ ...p, invoiceNo: e.target.value }))} placeholder="INV-XXX-XXX" />
              </div>
              <div>
                <Label className="text-xs font-semibold">วันที่สั่งซื้อ</Label>
                <Input type="date" value={state.purchaseDate} onChange={e => setState(p => ({ ...p, purchaseDate: e.target.value }))} />
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Section 2: Dynamic Expense Table ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">รายการสินค้า</h3>
              <Button size="sm" variant="outline" onClick={addItem} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> เพิ่มรายการ
              </Button>
            </div>
            <div className="rounded-md border overflow-auto max-h-[300px] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-primary/30 [&::-webkit-scrollbar-thumb]:rounded-full">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead className="text-xs w-[30%]">
                      <div className="flex items-center gap-1">รายละเอียดสินค้า <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                    </TableHead>
                    <TableHead className="text-xs w-[12%]">
                      <div className="flex items-center gap-1">จำนวน <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                    </TableHead>
                    <TableHead className="text-xs w-[15%]">
                      <div className="flex items-center gap-1">ราคา/หน่วย <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                    </TableHead>
                    <TableHead className="text-xs w-[15%]">สกุลเงิน</TableHead>
                    <TableHead className="text-xs w-[18%] text-right">
                      <div className="flex items-center justify-end gap-1">ราคารวม <ArrowUpDown className="w-3 h-3 text-muted-foreground" /></div>
                    </TableHead>
                    <TableHead className="text-xs w-[10%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="p-1.5">
                        <Input className="h-8 text-xs" value={item.description} onChange={e => updateItem(item.id, "description", e.target.value)} placeholder="ระบุสินค้า..." />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input className="h-8 text-xs" type="number" value={item.quantity || ""} onChange={e => updateItem(item.id, "quantity", Number(e.target.value))} />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Input className="h-8 text-xs" type="number" value={item.unitPrice || ""} onChange={e => updateItem(item.id, "unitPrice", Number(e.target.value))} />
                      </TableCell>
                      <TableCell className="p-1.5">
                        <Select value={item.currency} onValueChange={v => updateItem(item.id, "currency", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="THB">THB</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="CNY">CNY</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="JPY">JPY</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="p-1.5 text-right font-medium text-xs">
                        ฿{(item.quantity * item.unitPrice).toLocaleString()}
                      </TableCell>
                      <TableCell className="p-1.5">
                        {state.items.length > 1 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeItem(item.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Summary */}
            <div className="mt-4 space-y-2 bg-muted/30 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ยอดรวม</span>
                <span className="font-medium">฿{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">VAT 7%</span>
                  <Switch checked={state.includeVat} onCheckedChange={v => setState(p => ({ ...p, includeVat: v }))} className="scale-75" />
                </div>
                <span className="font-medium">{state.includeVat ? `฿${vatAmount.toLocaleString()}` : "-"}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span className="text-primary">ยอดสุทธิ</span>
                <span className="text-primary">฿{netTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* ── Section 3: Multi-Payment ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary uppercase tracking-wide">การชำระเงิน</h3>
              <Button size="sm" variant="outline" onClick={addPayment} className="h-7 text-xs">
                <Plus className="w-3 h-3 mr-1" /> เพิ่มยอดชำระเงิน
              </Button>
            </div>
            {state.payments.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-md">ยังไม่มีรายการชำระเงิน กดปุ่มเพื่อเพิ่ม</p>
            ) : (
              <div className="space-y-3">
                {state.payments.map((payment, idx) => (
                  <div key={payment.id} className="border rounded-lg p-3 bg-background">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-primary">ครั้งที่ {idx + 1}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removePayment(payment.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">วันที่จ่าย</Label>
                        <Input type="date" className="h-8 text-xs" value={payment.date} onChange={e => updatePayment(payment.id, "date", e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs">จำนวนเงิน (บาท)</Label>
                        <Input type="number" className="h-8 text-xs" value={payment.amount || ""} onChange={e => updatePayment(payment.id, "amount", Number(e.target.value))} />
                      </div>
                      <div>
                        <Label className="text-xs">วิธีชำระ</Label>
                        <Select value={payment.method} onValueChange={v => updatePayment(payment.id, "method", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="เงินสด">เงินสด</SelectItem>
                            <SelectItem value="โอน">โอน</SelectItem>
                            <SelectItem value="เช็ค">เช็ค</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment summary */}
            {state.payments.length > 0 && (
              <div className="mt-3 bg-muted/30 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ยอดชำระแล้ว</span>
                  <span className="font-medium text-green-600">฿{totalPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className={remaining > 0 ? "text-destructive" : "text-green-600"}>ยอดคงเหลือที่ต้องชำระ</span>
                  <span className={remaining > 0 ? "text-destructive" : "text-green-600"}>฿{remaining.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* ── Section 4: Status & Notes ── */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">สถานะและหมายเหตุ</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">สถานะการชำระเงิน</Label>
                <Select value={state.paymentStatus} onValueChange={v => setState(p => ({ ...p, paymentStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="รออนุมัติ">รออนุมัติ</SelectItem>
                    <SelectItem value="จ่ายแล้ว">จ่ายแล้ว</SelectItem>
                    <SelectItem value="ยกเลิก">ยกเลิก</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-3">
              <Label className="text-xs font-semibold">หมายเหตุ</Label>
              <Textarea value={state.remark} onChange={e => setState(p => ({ ...p, remark: e.target.value }))} placeholder="บันทึกเพิ่มเติม..." className="min-h-[60px]" />
            </div>
          </div>

          <Separator />

          {/* ── Section 5: File Attachments ── */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wide">แนบหลักฐาน</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Slip */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">แนบสลิป</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-3 text-center">
                  {state.slipFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs truncate">{state.slipFile.name}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {state.slipPreview && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPreviewImage(state.slipPreview)}>
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setState(p => ({ ...p, slipFile: null, slipPreview: null }))}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-1.5">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">อัปโหลดสลิป</span>
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleFileChange("slipFile", "slipPreview", e.target.files?.[0] || null)} />
                    </label>
                  )}
                </div>
              </div>

              {/* Receipt */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">แนบไฟล์ใบเสร็จ</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-3 text-center">
                  {state.receiptFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs truncate">{state.receiptFile.name}</span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {state.receiptPreview && (
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPreviewImage(state.receiptPreview)}>
                            <Eye className="w-3 h-3" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => setState(p => ({ ...p, receiptFile: null, receiptPreview: null }))}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center gap-1.5">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">อัปโหลดใบเสร็จ</span>
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => handleFileChange("receiptFile", "receiptPreview", e.target.files?.[0] || null)} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* ── Sticky Footer ── */}
      <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          ยกเลิก
        </Button>
        <Button onClick={onSave}>
          บันทึก
        </Button>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>ดูตัวอย่างไฟล์</DialogTitle>
          </DialogHeader>
          {previewImage && <img src={previewImage} alt="Preview" className="w-full rounded-md" />}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main Page ──
export default function Expenses() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const [expensesData, setExpensesData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([
    { name: "โรงงานจีน", value: 0, color: "hsl(var(--primary))" },
    { name: "โรงงานไทย", value: 0, color: "hsl(var(--info))" },
    { name: "ค่าขนส่ง", value: 0, color: "hsl(var(--accent))" },
    { name: "วัสดุสิ้นเปลือง", value: 0, color: "hsl(var(--warning))" },
    { name: "ค่าแรง", value: 0, color: "hsl(var(--success))" }
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"add" | "edit">("add");
  const [drawerState, setDrawerState] = useState<DrawerState>(defaultDrawer());
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setIsLoading(true);
    try {
      const response = await accountingService.getExpenses();
      if (response.status === "success") {
        // Map snake_case from API to camelCase for frontend
        const mappedData = response.data.map((exp: any) => ({
          id: exp.id,
          expenseCode: exp.expense_code,
          supplier: exp.supplier,
          poNo: exp.po_no,
          invoiceNo: exp.invoice_no,
          purchaseDate: exp.purchase_date,
          paymentDate: exp.payment_date,
          description: exp.description,
          amount: Number(exp.amount),
          vat: Number(exp.vat),
          netAmount: Number(exp.net_amount),
          paidAmount: Number(exp.paid_amount),
          outstandingAmount: Number(exp.outstanding_amount),
          paymentMethod: exp.payment_method,
          paymentStatus: exp.payment_status,
          remark: exp.remark
        }));

        setExpensesData(mappedData);
        setSummaryData(response.summary);
        setMonthlyData(response.monthly || []);

        const catMap: Record<string, number> = {};
        mappedData.forEach((exp: any) => {
          const cat = exp.supplier.toLowerCase().includes('china') ? 'โรงงานจีน' : 'โรงงานไทย';
          catMap[cat] = (catMap[cat] || 0) + exp.netAmount;
        });

        setCategoryData([
          { name: "โรงงานจีน", value: catMap['โรงงานจีน'] || 0, color: "hsl(var(--primary))" },
          { name: "โรงงานไทย", value: catMap['โรงงานไทย'] || 0, color: "hsl(var(--info))" },
          { name: "ค่าขนส่ง", value: 15000, color: "hsl(var(--accent))" },
          { name: "วัสดุสิ้นเปลือง", value: 32000, color: "hsl(var(--warning))" },
          { name: "ค่าแรง", value: 45000, color: "hsl(var(--success))" }
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      toast.error("ไม่สามารถโหลดข้อมูลรายจ่ายได้");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportConfirm = (rows: ExpenseImportRow[]) => {
    toast.success(`นำเข้ารายจ่าย ${rows.length} รายการสำเร็จ`);
  };

  const openAddDrawer = () => {
    setDrawerMode("add");
    setDrawerState(defaultDrawer());
    setEditingId(null);
    setIsDrawerOpen(true);
  };

  const fetchExpenseDetails = async (id: number | string) => {
    try {
      // Fetch details if we need nested items/payments
      const response = await fetch(`https://nacres.co.th/api-lucky/admin/accounting/expenses.php?id=${id}`);
      const resData = await response.json();
      if (resData.status === "success") {
        const exp = resData.data;
        setDrawerState({
          supplier: exp.supplier,
          poNo: exp.po_no,
          invoiceNo: exp.invoice_no,
          purchaseDate: exp.purchase_date,
          items: exp.items.map((i: any) => ({
            id: i.id.toString(),
            description: i.description,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unit_price),
            currency: i.currency
          })),
          includeVat: Number(exp.vat) > 0,
          payments: exp.payments.map((p: any) => ({
            id: p.id.toString(),
            date: p.payment_date,
            amount: Number(p.amount),
            method: p.payment_method
          })),
          paymentStatus: exp.payment_status,
          remark: exp.remark,
          slipFile: null,
          receiptFile: null,
          slipPreview: null,
          receiptPreview: null,
        });
        setIsDrawerOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch expense details:", error);
      toast.error("ไม่สามารถโหลดรายละเอียดรายจ่ายได้");
    }
  };

  const openEditDrawer = (expense: any) => {
    setDrawerMode("edit");
    setEditingId(expense.id);
    // Prefer fetching full details
    fetchExpenseDetails(expense.id);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...drawerState,
        id: editingId,
        // Map camelCase to snake_case if necessary, or let PHP handle it
      };
      const response = await accountingService.saveExpense(payload);
      if (response.status === "success") {
        toast.success(drawerMode === "add" ? "เพิ่มรายการจ่ายสำเร็จ" : `แก้ไขรายการสำเร็จ`);
        setIsDrawerOpen(false);
        fetchExpenses();
      } else {
        toast.error(response.message || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      console.error("Failed to save expense:", error);
      toast.error("ไม่สามารถบันทึกข้อมูลได้");
    }
  };

  const filteredExpenses = expensesData.filter(expense => {
    const matchesSearch = (expense.expenseCode?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (expense.supplier?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (expense.poNo?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesSupplier = filterSupplier === "all" || expense.supplier === filterSupplier;
    const matchesStatus = filterStatus === "all" || expense.paymentStatus === filterStatus;
    return matchesSearch && matchesSupplier && matchesStatus;
  });

  const totalExpenses = summaryData ? Number(summaryData.total_expenses) : expensesData.reduce((sum, exp) => sum + exp.netAmount, 0);
  const avgMonthlyExpense = totalExpenses / 12;
  const pendingApprovals = summaryData ? Number(summaryData.pending_approvals) : expensesData.filter(e => e.paymentStatus === "รออนุมัติ").length;
  const totalPaidExpenses = summaryData ? Number(summaryData.total_paid) : expensesData.filter(e => e.paymentStatus === "จ่ายแล้ว").reduce((sum, exp) => sum + exp.netAmount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "จ่ายแล้ว": return "default";
      case "รออนุมัติ": return "secondary";
      case "ยกเลิก": return "destructive";
      default: return "outline";
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">หน้ารายจ่าย</h1>
            <p className="text-muted-foreground">ระบบจัดการรายจ่ายและการสั่งซื้อทั้งหมด</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openAddDrawer}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มรายจ่าย
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              นำเข้า Excel
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">รายจ่ายรวมทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">฿{totalExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">ข้อมูล 12 เดือนย้อนหลัง</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">รายจ่ายเฉลี่ยต่อเดือน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">฿{avgMonthlyExpense.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">เฉลี่ยต่อเดือน</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">จ่ายไปแล้ว</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">฿{totalPaidExpenses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">ยอดที่จ่ายจริง</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">รออนุมัติ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${pendingApprovals > 3 ? 'text-destructive' : 'text-orange-500'}`}>
                {pendingApprovals} รายการ
              </div>
              <p className="text-xs text-muted-foreground mt-1">ต้องอนุมัติการจ่าย</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>สัดส่วนรายจ่ายตามประเภท</CardTitle>
              <CardDescription>แยกตามหมวดหมู่ค่าใช้จ่าย</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>สรุปยอดรายจ่ายรายเดือน</CardTitle>
              <CardDescription>ย้อนหลัง 12 เดือน</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }} formatter={(value: number) => [`฿${value.toLocaleString()}`, 'ยอดรายจ่าย']} />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>รายการจ่ายทั้งหมด</CardTitle>
            <CardDescription>ข้อมูลการสั่งซื้อและการชำระเงิน</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="ค้นหารหัส, โรงงาน หรือ PO No..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
              </div>
              <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                <SelectTrigger className="w-[250px]"><SelectValue placeholder="โรงงาน / ผู้ขาย" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {suppliersList.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="สถานะการชำระเงิน" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="รออนุมัติ">รออนุมัติ</SelectItem>
                  <SelectItem value="จ่ายแล้ว">จ่ายแล้ว</SelectItem>
                  <SelectItem value="ยกเลิก">ยกเลิก</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสรายการ</TableHead>
                    <TableHead>โรงงาน / ผู้ขาย</TableHead>
                    <TableHead>PO No.</TableHead>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>วันที่สั่งซื้อ</TableHead>
                    <TableHead>วันที่จ่ายจริง</TableHead>
                    <TableHead className="text-right">ยอดสุทธิ</TableHead>
                    <TableHead className="text-right">ยอดชำระแล้ว</TableHead>
                    <TableHead className="text-right">ยอดคงค้างชำระ</TableHead>
                    <TableHead>วิธีชำระ</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">{expense.expenseCode}</TableCell>
                      <TableCell>{expense.supplier}</TableCell>
                      <TableCell className="font-mono text-sm">{expense.poNo}</TableCell>
                      <TableCell className="font-mono text-sm">{expense.invoiceNo}</TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={expense.description}>{expense.description}</div>
                      </TableCell>
                      <TableCell>{expense.purchaseDate}</TableCell>
                      <TableCell>{expense.paymentDate ? expense.paymentDate : <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="text-right font-medium">฿{expense.netAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">฿{expense.paidAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={expense.outstandingAmount > 0 ? "text-destructive" : "text-green-600"}>฿{expense.outstandingAmount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell><Badge variant="outline">{expense.paymentMethod}</Badge></TableCell>
                      <TableCell><Badge variant={getStatusColor(expense.paymentStatus)}>{expense.paymentStatus}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEditDrawer(expense)}>
                          <Edit className="w-4 h-4 mr-1" />
                          แก้ไข
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        {pendingApprovals > 0 && (
          <Card className="border-secondary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-secondary-foreground" />
                <p className="text-sm font-medium">มีรายการจ่าย {pendingApprovals} รายการที่รออนุมัติ กรุณาตรวจสอบและอนุมัติ</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Side Drawer ── */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="left" className="w-3/4 sm:max-w-none p-0 flex flex-col [&>button]:hidden">
          <SheetHeader className="px-6 py-4 border-b bg-primary text-primary-foreground shrink-0">
            <SheetTitle className="text-primary-foreground text-lg">
              {drawerMode === "add" ? "เพิ่มรายการจ่ายใหม่" : `แก้ไขรายการจ่าย ${editingId}`}
            </SheetTitle>
          </SheetHeader>
          <ExpenseDrawerForm
            state={drawerState}
            setState={setDrawerState}
            onSave={handleSave}
            onClose={() => setIsDrawerOpen(false)}
            title={drawerMode === "add" ? "เพิ่มรายการจ่ายใหม่" : `แก้ไขรายการ ${editingId}`}
          />
        </SheetContent>
      </Sheet>

      <ExpenseExcelImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportConfirm={handleImportConfirm}
      />
    </>
  );
}
