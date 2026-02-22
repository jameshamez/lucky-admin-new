import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  type CommissionTransaction,
  formatCurrency,
  recalculateCommission,
} from "./reportMockData";
import {
  defaultReadyMadeConfigs,
  defaultMadeToOrderConfigs,
  getReadyMadeCategories,
  getMadeToOrderCategories,
} from "@/lib/commissionConfig";
import { getSaleEmployees, type Employee } from "@/lib/employeeData";

type Props = {
  transactions: CommissionTransaction[];
  onTransactionsChange: (txns: CommissionTransaction[]) => void;
  employees: Employee[];
  selectedMonth: string;
};

const ITEMS_PER_PAGE = 10;

export default function TransactionManagementTab({ transactions, onTransactionsChange, employees, selectedMonth }: Props) {
  const { toast } = useToast();
  const saleEmployees = useMemo(() => getSaleEmployees(employees), [employees]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "ReadyMade" | "MadeToOrder">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "PENDING" | "COMPLETED">("all");
  const [page, setPage] = useState(1);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommissionTransaction | null>(null);

  const [form, setForm] = useState({
    month: new Date().toISOString().slice(0, 7),
    employeeId: "",
    poNumber: "",
    jobName: "",
    type: "ReadyMade" as "ReadyMade" | "MadeToOrder",
    productCategory: "",
    quantity: 0,
    totalSales: 0,
  });

  const categories = useMemo(() =>
    form.type === "ReadyMade"
      ? getReadyMadeCategories(defaultReadyMadeConfigs)
      : getMadeToOrderCategories(defaultMadeToOrderConfigs),
    [form.type]
  );

  // Filter & search (includes global month filter)
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const q = search.toLowerCase();
      const matchMonth = t.month === selectedMonth;
      const matchSearch = !q || t.employeeName.toLowerCase().includes(q) || t.poNumber.toLowerCase().includes(q) || t.jobName.toLowerCase().includes(q);
      const matchType = typeFilter === "all" || t.type === typeFilter;
      const matchStatus = statusFilter === "all" || t.status === statusFilter;
      return matchMonth && matchSearch && matchType && matchStatus;
    });
  }, [transactions, search, typeFilter, statusFilter, selectedMonth]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Reset page on filter change
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleTypeFilter = (v: string) => { setTypeFilter(v as any); setPage(1); };
  const handleStatusFilter = (v: string) => { setStatusFilter(v as any); setPage(1); };

  const openAdd = () => {
    setEditingId(null);
    setForm({
      month: selectedMonth,
      employeeId: "",
      poNumber: "",
      jobName: "",
      type: "ReadyMade",
      productCategory: "",
      quantity: 0,
      totalSales: 0,
    });
    setIsFormOpen(true);
  };

  const openEdit = (txn: CommissionTransaction) => {
    setEditingId(txn.id);
    setForm({
      month: txn.month,
      employeeId: txn.employeeId,
      poNumber: txn.poNumber,
      jobName: txn.jobName,
      type: txn.type,
      productCategory: txn.productCategory,
      quantity: txn.quantity,
      totalSales: txn.totalSales,
    });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!form.poNumber || !form.employeeId || !form.productCategory) {
      toast({ title: "กรุณากรอกข้อมูลให้ครบ", variant: "destructive" });
      return;
    }

    const emp = saleEmployees.find(e => e.id === form.employeeId);
    const empName = emp?.fullName || form.employeeId;

    const baseTxn: CommissionTransaction = {
      id: editingId || `txn-${Date.now()}`,
      month: form.month,
      employeeId: form.employeeId,
      employeeName: empName,
      poNumber: form.poNumber,
      jobName: form.jobName,
      type: form.type,
      productCategory: form.productCategory,
      quantity: form.quantity,
      totalSales: form.totalSales,
      commission: 0,
      rateInfo: "",
      status: "COMPLETED",
    };

    // Recalculate commission
    baseTxn.commission = recalculateCommission(baseTxn);

    if (editingId) {
      onTransactionsChange(transactions.map(t => t.id === editingId ? baseTxn : t));
      toast({ title: "แก้ไขสำเร็จ", description: `ค่าคอม: ${formatCurrency(baseTxn.commission)}` });
    } else {
      onTransactionsChange([...transactions, baseTxn]);
      toast({ title: "เพิ่มรายการสำเร็จ", description: `ค่าคอม: ${formatCurrency(baseTxn.commission)}` });
    }
    setIsFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    onTransactionsChange(transactions.filter(t => t.id !== deleteTarget.id));
    toast({ title: "ลบรายการสำเร็จ", description: deleteTarget.poNumber });
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-5">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ค้นหาชื่อ, PO, งาน..." value={search} onChange={e => handleSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger><SelectValue placeholder="ประเภท" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                <SelectItem value="ReadyMade">สำเร็จรูป</SelectItem>
                <SelectItem value="MadeToOrder">สั่งผลิต</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger><SelectValue placeholder="สถานะ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              เพิ่มรายการ
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>เดือน</TableHead>
                  <TableHead>PO</TableHead>
                  <TableHead>ชื่องาน</TableHead>
                  <TableHead>พนักงาน</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                  <TableHead className="text-right">ยอดขาย</TableHead>
                  <TableHead className="text-right">ค่าคอม</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-center">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell>
                  </TableRow>
                ) : paginated.map(txn => (
                  <TableRow key={txn.id}>
                    <TableCell className="text-sm whitespace-nowrap">{txn.month}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{txn.poNumber}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{txn.jobName}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{txn.employeeName}</TableCell>
                    <TableCell>
                      <Badge variant={txn.type === "ReadyMade" ? "default" : "secondary"} className="text-xs">
                        {txn.type === "ReadyMade" ? "สำเร็จรูป" : "สั่งผลิต"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{txn.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{formatCurrency(txn.totalSales)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(txn.commission)}</TableCell>
                    <TableCell>
                      <Badge variant={txn.status === "COMPLETED" ? "default" : "outline"} className="text-xs">
                        {txn.status === "COMPLETED" ? "เสร็จสิ้น" : "รอดำเนินการ"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(txn)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(txn)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">{filtered.length} รายการ (หน้า {page}/{totalPages})</p>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(1)}>«</Button>
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹</Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}</DialogTitle>
            <DialogDescription>กรอกข้อมูลและระบบจะคำนวณค่าคอมให้อัตโนมัติ</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>เดือน</Label>
                <Input type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} />
              </div>
              <div>
                <Label>ประเภทงาน</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as any, productCategory: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ReadyMade">สำเร็จรูป</SelectItem>
                    <SelectItem value="MadeToOrder">สั่งผลิต</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>หมวดหมู่สินค้า</Label>
              <Select value={form.productCategory} onValueChange={(v) => setForm({ ...form, productCategory: v })}>
                <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>พนักงานขาย</Label>
              <Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}>
                <SelectTrigger><SelectValue placeholder="เลือกพนักงาน" /></SelectTrigger>
                <SelectContent>
                  {saleEmployees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>เลข PO</Label>
                <Input value={form.poNumber} onChange={e => setForm({ ...form, poNumber: e.target.value })} />
              </div>
              <div>
                <Label>ชื่องาน</Label>
                <Input value={form.jobName} onChange={e => setForm({ ...form, jobName: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>จำนวน</Label>
                <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <Label>ยอดขาย (฿)</Label>
                <Input type="number" value={form.totalSales} onChange={e => setForm({ ...form, totalSales: Number(e.target.value) })} />
              </div>
            </div>

            {/* Preview commission */}
            {form.productCategory && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">ค่าคอมมิชชั่น (Preview)</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(
                    recalculateCommission({
                      ...form,
                      id: "", employeeName: "", commission: 0, rateInfo: "", status: "COMPLETED",
                    } as CommissionTransaction)
                  )}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave}>{editingId ? "บันทึก" : "เพิ่ม"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              ต้องการลบรายการ "{deleteTarget?.poNumber} - {deleteTarget?.jobName}" หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">ลบ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
