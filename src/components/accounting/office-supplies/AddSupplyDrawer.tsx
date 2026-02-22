import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Supply, CATEGORIES, UNITS } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (supply: Omit<Supply, "id">) => void;
  nextCode: string;
}

const AddSupplyDrawer = ({ open, onOpenChange, onAdd, nextCode }: Props) => {
  const [form, setForm] = useState({
    name: "",
    category: "",
    quantity: "",
    unit: "",
    pricePerUnit: "",
    dateReceived: new Date().toISOString().split("T")[0],
    minStock: "5",
  });

  const handleSubmit = () => {
    if (!form.name || !form.category || !form.quantity || !form.unit || !form.pricePerUnit) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    onAdd({
      code: nextCode,
      name: form.name,
      category: form.category,
      quantity: Number(form.quantity),
      unit: form.unit,
      pricePerUnit: Number(form.pricePerUnit),
      dateReceived: form.dateReceived,
      minStock: Number(form.minStock),
    });
    setForm({ name: "", category: "", quantity: "", unit: "", pricePerUnit: "", dateReceived: new Date().toISOString().split("T")[0], minStock: "5" });
    onOpenChange(false);
    toast.success("เพิ่มวัสดุเรียบร้อยแล้ว");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto scrollbar-littleboy">
        <SheetHeader>
          <SheetTitle className="text-xl">เพิ่มวัสดุสำนักงาน</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label>รหัสสินค้า (Auto)</Label>
            <Input value={nextCode} disabled className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>ชื่อรายการ *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น ปากกาลูกลื่น" />
          </div>
          <div className="space-y-2">
            <Label>หมวดหมู่ *</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>จำนวนที่รับเข้า *</Label>
              <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>หน่วยนับ *</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue placeholder="หน่วย" /></SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ราคาต่อหน่วย (฿) *</Label>
              <Input type="number" min="0" step="0.01" value={form.pricePerUnit} onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>จุดแจ้งเตือนสต็อกต่ำ</Label>
              <Input type="number" min="0" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>วันที่รับเข้า</Label>
            <Input type="date" value={form.dateReceived} onChange={(e) => setForm({ ...form, dateReceived: e.target.value })} />
          </div>
        </div>
        <SheetFooter className="gap-2">
          <Button onClick={handleSubmit} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มวัสดุ
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">ยกเลิก</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AddSupplyDrawer;
