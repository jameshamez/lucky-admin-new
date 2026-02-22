import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PackageMinus } from "lucide-react";
import { toast } from "sonner";
import { Supply, Requisition, EMPLOYEES } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplies: Supply[];
  onRequisition: (req: Omit<Requisition, "id">) => void;
}

const RequisitionDrawer = ({ open, onOpenChange, supplies, onRequisition }: Props) => {
  const [form, setForm] = useState({
    supplyId: "",
    quantity: "",
    requester: "",
    date: new Date().toISOString().split("T")[0],
    note: "",
  });

  const selectedSupply = supplies.find((s) => s.id === form.supplyId);
  const qtyNum = Number(form.quantity) || 0;
  const isOverStock = selectedSupply ? qtyNum > selectedSupply.quantity : false;
  const canSubmit = form.supplyId && form.quantity && form.requester && qtyNum > 0 && !isOverStock;

  const handleSubmit = () => {
    if (!canSubmit || !selectedSupply) return;
    onRequisition({
      supplyId: selectedSupply.id,
      supplyCode: selectedSupply.code,
      supplyName: selectedSupply.name,
      category: selectedSupply.category,
      quantity: qtyNum,
      unit: selectedSupply.unit,
      pricePerUnit: selectedSupply.pricePerUnit,
      requester: form.requester,
      date: form.date,
      note: form.note,
    });
    setForm({ supplyId: "", quantity: "", requester: "", date: new Date().toISOString().split("T")[0], note: "" });
    onOpenChange(false);
    toast.success("เบิกวัสดุเรียบร้อยแล้ว ตัดสต็อกสำเร็จ");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full sm:max-w-2xl overflow-y-auto scrollbar-littleboy">
        <SheetHeader>
          <SheetTitle className="text-xl">เบิกใช้วัสดุสำนักงาน</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 py-6">
          <div className="space-y-2">
            <Label>เลือกวัสดุที่จะเบิก *</Label>
            <Select value={form.supplyId} onValueChange={(v) => setForm({ ...form, supplyId: v, quantity: "" })}>
              <SelectTrigger><SelectValue placeholder="เลือกวัสดุ" /></SelectTrigger>
              <SelectContent>
                {supplies.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="font-mono text-xs mr-2">{s.code}</span>
                    {s.name}
                    <Badge variant={s.quantity > 0 ? "secondary" : "destructive"} className="ml-2 text-xs">
                      คงเหลือ {s.quantity} {s.unit}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSupply && (
              <p className="text-xs text-muted-foreground">
                คงเหลือ: <span className={selectedSupply.quantity <= selectedSupply.minStock ? "text-[#D6275A] font-semibold" : "text-blue-600 font-semibold"}>
                  {selectedSupply.quantity} {selectedSupply.unit}
                </span>
                {" | "}เบิกได้สูงสุด: {selectedSupply.quantity} {selectedSupply.unit}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>จำนวนที่เบิก *</Label>
            <Input
              type="number"
              min="1"
              max={selectedSupply?.quantity}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className={isOverStock ? "border-destructive" : ""}
            />
            {isOverStock && <p className="text-xs text-destructive">จำนวนเกินสต็อกที่มีอยู่</p>}
          </div>

          <div className="space-y-2">
            <Label>ผู้เบิก *</Label>
            <Select value={form.requester} onValueChange={(v) => setForm({ ...form, requester: v })}>
              <SelectTrigger><SelectValue placeholder="เลือกผู้เบิก" /></SelectTrigger>
              <SelectContent>
                {EMPLOYEES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>วันที่เบิก</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>

          <div className="space-y-2">
            <Label>หมายเหตุ / วัตถุประสงค์การใช้</Label>
            <Textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="ระบุเหตุผลการเบิก" />
          </div>
        </div>
        <SheetFooter className="gap-2">
          <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full bg-orange-500 hover:bg-orange-600">
            <PackageMinus className="w-4 h-4 mr-2" />
            ยืนยันการเบิก
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">ยกเลิก</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default RequisitionDrawer;
