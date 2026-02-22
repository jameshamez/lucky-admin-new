import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, ArrowUpDown } from "lucide-react";
import { Supply, Requisition } from "./types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supply: Supply | null;
  requisitions: Requisition[];
  onUpdateSupply: (updated: Supply) => void;
  mode: "view" | "edit";
}

const SupplyDetailDrawer = ({ open, onOpenChange, supply, requisitions, onUpdateSupply, mode }: Props) => {
  const [editForm, setEditForm] = useState<Supply | null>(null);
  const [isEditing, setIsEditing] = useState(mode === "edit");

  // Reset edit form when supply changes
  const currentSupply = editForm && isEditing ? editForm : supply;

  const relatedReqs = requisitions.filter((r) => r.supplyId === supply?.id);

  const handleStartEdit = () => {
    setEditForm(supply ? { ...supply } : null);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editForm) {
      onUpdateSupply(editForm);
      toast.success("บันทึกการแก้ไขเรียบร้อย");
      setIsEditing(false);
      setEditForm(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  if (!supply) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setIsEditing(false); setEditForm(null); } }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto scrollbar-littleboy">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">{supply.code}</Badge>
            {isEditing ? "แก้ไขวัสดุ" : "รายละเอียดวัสดุ"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Supply Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">ข้อมูลวัสดุ</h3>
            {isEditing && editForm ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">ชื่อรายการ</Label>
                  <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">หมวดหมู่</Label>
                  <Input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">จำนวนคงเหลือ</Label>
                  <Input type="number" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">หน่วย</Label>
                  <Input value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ราคาต่อหน่วย (฿)</Label>
                  <Input type="number" value={editForm.pricePerUnit} onChange={(e) => setEditForm({ ...editForm, pricePerUnit: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">จุดแจ้งเตือนสต็อกต่ำ</Label>
                  <Input type="number" value={editForm.minStock} onChange={(e) => setEditForm({ ...editForm, minStock: Number(e.target.value) })} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["ชื่อรายการ", supply.name],
                  ["หมวดหมู่", supply.category],
                  ["คงเหลือ", `${supply.quantity} ${supply.unit}`],
                  ["ราคาต่อหน่วย", `฿${supply.pricePerUnit.toLocaleString()}`],
                  ["มูลค่ารวม", `฿${(supply.quantity * supply.pricePerUnit).toLocaleString()}`],
                  ["วันที่รับเข้า", supply.dateReceived],
                  ["จุดแจ้งเตือน", `${supply.minStock} ${supply.unit}`],
                  ["สถานะ", supply.quantity <= supply.minStock ? "ใกล้หมด" : "ปกติ"],
                ].map(([label, value], i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={`font-medium text-sm ${label === "สถานะ" && value === "ใกล้หมด" ? "text-[#D6275A]" : ""}`}>{value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave}>บันทึก</Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>ยกเลิก</Button>
                </>
              ) : (
                <Button size="sm" variant="outline" onClick={handleStartEdit}>
                  <Pencil className="w-3 h-3 mr-1" /> แก้ไข
                </Button>
              )}
            </div>
          </div>

          {/* Requisition History for this supply */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">ประวัติการเบิกใช้ ({relatedReqs.length} รายการ)</h3>
            {relatedReqs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">ยังไม่มีการเบิกใช้วัสดุนี้</p>
            ) : (
              <div className="rounded-md border overflow-auto scrollbar-littleboy max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary">
                      <TableHead className="text-primary-foreground">วันที่</TableHead>
                      <TableHead className="text-primary-foreground">ผู้เบิก</TableHead>
                      <TableHead className="text-primary-foreground text-center">จำนวน</TableHead>
                      <TableHead className="text-primary-foreground text-right">มูลค่า</TableHead>
                      <TableHead className="text-primary-foreground">หมายเหตุ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedReqs.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{r.date}</TableCell>
                        <TableCell className="text-sm">{r.requester}</TableCell>
                        <TableCell className="text-center">{r.quantity} {r.unit}</TableCell>
                        <TableCell className="text-right">฿{(r.quantity * r.pricePerUnit).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[120px]">{r.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SupplyDetailDrawer;
