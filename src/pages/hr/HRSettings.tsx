import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Package, Layers, Award, Save, ChevronLeft, Eye, Users, TrendingUp, Loader2 } from "lucide-react";
import {
  type ReadyMadeConfig, type MadeToOrderConfig, type IncentiveTier, type TierRange,
} from "@/lib/commissionConfig";
import { useToast } from "@/hooks/use-toast";
import { hrService } from "@/services/hrService";

type KPIRecord = {
  id: string; employeeId: string; employeeName: string; department: string; month: string; kpiScore: number; remark: string;
};

type KPIIntegration = {
  id: string; department: string; dataSourceType: string; sheetUrl: string; apiEndpoint: string; note: string; active: boolean;
};

export default function HRSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [readyMadeConfigs, setReadyMadeConfigs] = useState<ReadyMadeConfig[]>([]);
  const [madeToOrderConfigs, setMadeToOrderConfigs] = useState<MadeToOrderConfig[]>([]);
  const [incentiveTiers, setIncentiveTiers] = useState<IncentiveTier[]>([]);
  const [commissionSubTab, setCommissionSubTab] = useState("ready-made");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);

  // Edit dialog states
  const [editConfigAOpen, setEditConfigAOpen] = useState(false);
  const [editConfigA, setEditConfigA] = useState<ReadyMadeConfig | null>(null);

  const [editConfigBOpen, setEditConfigBOpen] = useState(false);
  const [editConfigB, setEditConfigB] = useState<MadeToOrderConfig | null>(null);

  const [editIncentiveOpen, setEditIncentiveOpen] = useState(false);
  const [editIncentive, setEditIncentive] = useState<IncentiveTier | null>(null);

  // KPI states
  const [kpiRecords, setKpiRecords] = useState<KPIRecord[]>([]);
  const [kpiIntegrations, setKpiIntegrations] = useState<KPIIntegration[]>([]);
  const [editKPIOpen, setEditKPIOpen] = useState(false);
  const [editKPI, setEditKPI] = useState<KPIRecord | null>(null);
  const [editIntegrationOpen, setEditIntegrationOpen] = useState(false);
  const [editIntegration, setEditIntegration] = useState<KPIIntegration | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [viewingMonth, setViewingMonth] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const [rm, mto, inc, kpi, integ] = await Promise.all([
        hrService.getSettings('ready_made'),
        hrService.getSettings('mto'),
        hrService.getSettings('incentives'),
        hrService.getSettings('kpi_records'),
        hrService.getSettings('kpi_integrations')
      ]);
      if (rm.status === 'success') setReadyMadeConfigs(rm.data);
      if (mto.status === 'success') setMadeToOrderConfigs(mto.data);
      if (inc.status === 'success') setIncentiveTiers(inc.data);
      if (kpi.status === 'success') setKpiRecords(kpi.data);
      if (integ.status === 'success') setKpiIntegrations(integ.data);
    } catch (e) {
      toast({ title: "เกิดข้อผิดพลาด", description: "โหลดข้อมูลตั้งค่าไม่สำเร็จ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Compute monthly summaries
  const monthlySummaries = useMemo(() => {
    const monthMap = new Map<string, { month: string; count: number; totalScore: number; avgScore: number; records: KPIRecord[] }>();
    kpiRecords.forEach(r => {
      const existing = monthMap.get(r.month);
      if (existing) {
        existing.count += 1;
        existing.totalScore += r.kpiScore;
        existing.avgScore = Math.round(existing.totalScore / existing.count);
        existing.records.push(r);
      } else {
        monthMap.set(r.month, { month: r.month, count: 1, totalScore: r.kpiScore, avgScore: r.kpiScore, records: [r] });
      }
    });
    return Array.from(monthMap.values()).sort((a, b) => b.month.localeCompare(a.month));
  }, [kpiRecords]);

  const handleAddNew = (type: string) => {
    setIsAddMode(true);
    if (type === "Config A") {
      setEditConfigA({ id: "", category: "", ratePerUnit: 0, unit: "ชิ้น", calcMethod: "perUnit", active: true });
      setEditConfigAOpen(true);
    } else if (type === "Config B") {
      setEditConfigB({ id: "", category: "", calcMethod: "tier", active: true, tiers: [] });
      setEditConfigBOpen(true);
    } else if (type === "Incentive Tier") {
      setEditIncentive({ id: "", label: "", minSales: 0, maxSales: null, incentivePerPerson: 0, active: true });
      setEditIncentiveOpen(true);
    } else if (type === "คะแนน KPI") {
      setEditKPI({ id: "", employeeId: "", employeeName: "", department: "Sale", month: viewingMonth || new Date().toISOString().slice(0, 7), kpiScore: 0, remark: "" });
      setEditKPIOpen(true);
    } else if (type === "แหล่งข้อมูล KPI") {
      setEditIntegration({ id: "", department: "", dataSourceType: "Manual", sheetUrl: "", apiEndpoint: "", note: "", active: true });
      setEditIntegrationOpen(true);
    }
  };

  const handleEdit = (type: string, id: string) => {
    setIsAddMode(false);
    if (type === "Config A") {
      const item = readyMadeConfigs.find(c => c.id === id);
      if (item) { setEditConfigA({ ...item }); setEditConfigAOpen(true); }
    } else if (type === "Config B") {
      const item = madeToOrderConfigs.find(c => c.id === id);
      if (item) { setEditConfigB({ ...item, tiers: item.tiers.map(t => ({ ...t })) }); setEditConfigBOpen(true); }
    } else if (type === "Incentive") {
      const item = incentiveTiers.find(t => t.id === id);
      if (item) { setEditIncentive({ ...item }); setEditIncentiveOpen(true); }
    } else if (type === "KPI") {
      const item = kpiRecords.find(r => r.id === id);
      if (item) { setEditKPI({ ...item }); setEditKPIOpen(true); }
    } else if (type === "Integration") {
      const item = kpiIntegrations.find(i => i.id === id);
      if (item) { setEditIntegration({ ...item }); setEditIntegrationOpen(true); }
    }
  };

  const handleDelete = (type: string, id: string) => { setDeleteTarget({ type, id }); setIsDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      const { type, id } = deleteTarget;
      let apiType = '';
      if (type === "Config A") apiType = 'ready_made';
      else if (type === "Config B") apiType = 'mto';
      else if (type === "Incentive") apiType = 'incentives';
      else if (type === "KPI") apiType = 'kpi_records';
      else if (type === "Integration") apiType = 'kpi_integrations';

      const res = await hrService.deleteSetting(apiType, id);
      if (res.status === 'success') {
        toast({ title: "ลบข้อมูลสำเร็จ", description: `ลบ ${type} เรียบร้อยแล้ว`, variant: "destructive" });
        loadSettings();
      }
    } catch (e) {
      toast({ title: "ผิดพลาด", description: "ไม่สามารถลบข้อมูลได้", variant: "destructive" });
    } finally {
      setLoading(false);
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  // Save handlers
  const saveConfigA = async () => {
    if (!editConfigA) return;
    try {
      setLoading(true);
      const res = await hrService.saveSetting('ready_made', editConfigA, !isAddMode);
      if (res.status === 'success') {
        toast({ title: "บันทึกสำเร็จ", description: `อัปเดต "${editConfigA.category}" แล้ว` });
        setEditConfigAOpen(false);
        loadSettings();
      }
    } catch (e) {
      toast({ title: "ผิดพลาด", description: "บันทึกข้อมูลไม่สำเร็จ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveConfigB = async () => {
    if (!editConfigB) return;
    try {
      setLoading(true);
      const res = await hrService.saveSetting('mto', editConfigB, !isAddMode);
      if (res.status === 'success') {
        toast({ title: "บันทึกสำเร็จ", description: `อัปเดต "${editConfigB.category}" แล้ว` });
        setEditConfigBOpen(false);
        loadSettings();
      }
    } catch (e) {
      toast({ title: "ผิดพลาด", description: "บันทึกข้อมูลไม่สำเร็จ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveIncentive = async () => {
    if (!editIncentive) return;
    try {
      setLoading(true);
      const res = await hrService.saveSetting('incentives', editIncentive, !isAddMode);
      if (res.status === 'success') {
        toast({ title: "บันทึกสำเร็จ", description: `อัปเดต Tier "${editIncentive.label}" แล้ว` });
        setEditIncentiveOpen(false);
        loadSettings();
      }
    } catch (e) {
      toast({ title: "ผิดพลาด", description: "บันทึกข้อมูลไม่สำเร็จ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveKPI = async () => {
    if (!editKPI) return;
    try {
      setLoading(true);
      const res = await hrService.saveSetting('kpi_records', editKPI, !isAddMode);
      if (res.status === 'success') {
        toast({ title: "บันทึกสำเร็จ", description: `บันทึก KPI ของ "${editKPI.employeeName}" แล้ว` });
        setEditKPIOpen(false);
        loadSettings();
      }
    } catch (e) {
      toast({ title: "ผิดพลาด", description: "บันทึกข้อมูลไม่สำเร็จ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveIntegration = async () => {
    if (!editIntegration) return;
    try {
      setLoading(true);
      const res = await hrService.saveSetting('kpi_integrations', editIntegration, !isAddMode);
      if (res.status === 'success') {
        toast({ title: "บันทึกสำเร็จ", description: `อัปเดตแหล่งข้อมูล "${editIntegration.department}" แล้ว` });
        setEditIntegrationOpen(false);
        loadSettings();
      }
    } catch (e) {
      toast({ title: "ผิดพลาด", description: "บันทึกข้อมูลไม่สำเร็จ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateConfigBTier = (tierIdx: number, field: keyof TierRange, value: string) => {
    if (!editConfigB) return;
    const newTiers = [...editConfigB.tiers];
    if (field === "label") {
      newTiers[tierIdx] = { ...newTiers[tierIdx], label: value };
    } else {
      const numVal = value === "" ? (field === "maxQty" ? null : 0) : Number(value);
      newTiers[tierIdx] = { ...newTiers[tierIdx], [field]: numVal } as TierRange;
    }
    setEditConfigB({ ...editConfigB, tiers: newTiers });
  };

  const addConfigBTier = () => {
    if (!editConfigB) return;
    setEditConfigB({
      ...editConfigB,
      tiers: [...editConfigB.tiers, { minQty: 0, maxQty: null, fixedAmount: 0, label: `Tier ${editConfigB.tiers.length + 1}` }]
    });
  };

  const removeConfigBTier = (idx: number) => {
    if (!editConfigB) return;
    const newTiers = [...editConfigB.tiers];
    newTiers.splice(idx, 1);
    setEditConfigB({ ...editConfigB, tiers: newTiers });
  };

  const filteredKPIRecords = viewingMonth ? kpiRecords.filter(r => r.month === viewingMonth) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ตั้งค่า (Commission & KPI)</h1>
          <p className="text-muted-foreground">ตั้งค่าสูตรคำนวณค่าคอมมิชชั่น, Incentive และ KPI</p>
        </div>
        {loading && <Loader2 className="w-6 h-6 animate-spin text-primary" />}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบข้อมูล</AlertDialogTitle>
            <AlertDialogDescription>คุณแน่ใจหรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">ลบข้อมูล</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== Edit Config A Dialog ===== */}
      <Dialog open={editConfigAOpen} onOpenChange={setEditConfigAOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAddMode ? "เพิ่ม Config A" : "แก้ไข Config A"}</DialogTitle>
            <DialogDescription>ตั้งค่าอัตราค่าคอมมิชชั่นสินค้าสำเร็จรูป</DialogDescription>
          </DialogHeader>
          {editConfigA && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ประเภทสินค้า</Label>
                <Input value={editConfigA.category} onChange={e => setEditConfigA({ ...editConfigA, category: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>อัตรา</Label>
                  <Input type="number" value={editConfigA.ratePerUnit} onChange={e => setEditConfigA({ ...editConfigA, ratePerUnit: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>หน่วย</Label>
                  <Select value={editConfigA.unit} onValueChange={v => setEditConfigA({ ...editConfigA, unit: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ชิ้น">ชิ้น</SelectItem>
                      <SelectItem value="คน">คน</SelectItem>
                      <SelectItem value="%ยอดขาย">%ยอดขาย</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>วิธีคำนวณ</Label>
                <Select value={editConfigA.calcMethod} onValueChange={v => setEditConfigA({ ...editConfigA, calcMethod: v as "perUnit" | "percentSales" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perUnit">ต่อชิ้น/คน</SelectItem>
                    <SelectItem value="percentSales">% ของยอดขาย</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Label>สถานะใช้งาน</Label>
                <Switch checked={editConfigA.active} onCheckedChange={v => setEditConfigA({ ...editConfigA, active: v })} />
                <span className="text-sm text-muted-foreground">{editConfigA.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditConfigAOpen(false)}>ยกเลิก</Button>
            <Button onClick={saveConfigA} className="gap-2" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Config B Dialog ===== */}
      <Dialog open={editConfigBOpen} onOpenChange={setEditConfigBOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isAddMode ? "เพิ่ม Config B" : "แก้ไข Config B"}</DialogTitle>
            <DialogDescription>ตั้งค่าอัตราค่าคอมมิชชั่นสินค้าสั่งผลิต</DialogDescription>
          </DialogHeader>
          {editConfigB && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ประเภทสินค้า</Label>
                <Input value={editConfigB.category} onChange={e => setEditConfigB({ ...editConfigB, category: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>วิธีคำนวณ</Label>
                  <Select value={editConfigB.calcMethod} onValueChange={v => setEditConfigB({ ...editConfigB, calcMethod: v as "tier" | "fixedPerJob" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tier">Tier-based</SelectItem>
                      <SelectItem value="fixedPerJob">เหมาจ่ายต่องาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch checked={editConfigB.active} onCheckedChange={v => setEditConfigB({ ...editConfigB, active: v })} />
                  <span className="text-sm text-muted-foreground">{editConfigB.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
                </div>
              </div>

              {editConfigB.calcMethod === "fixedPerJob" ? (
                <div className="space-y-2">
                  <Label>จำนวนเงินเหมาจ่ายต่องาน (บาท)</Label>
                  <Input type="number" value={editConfigB.fixedPerJob ?? 0} onChange={e => setEditConfigB({ ...editConfigB, fixedPerJob: Number(e.target.value) })} />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Tier ช่วงจำนวน</Label>
                    <Button variant="outline" size="sm" onClick={addConfigBTier} className="h-7 gap-1 text-xs"><Plus className="w-3 h-3" />เพิ่ม Tier</Button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {editConfigB.tiers.map((tier, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center border rounded-md p-2">
                        <div className="col-span-2">
                          <span className="text-[10px] text-muted-foreground uppercase">Min</span>
                          <Input type="number" value={tier.minQty} onChange={e => updateConfigBTier(idx, "minQty", e.target.value)} className="h-8 text-sm px-1" />
                        </div>
                        <div className="col-span-2">
                          <span className="text-[10px] text-muted-foreground uppercase">Max</span>
                          <Input type="number" value={tier.maxQty ?? ""} placeholder="∞" onChange={e => updateConfigBTier(idx, "maxQty", e.target.value)} className="h-8 text-sm px-1" />
                        </div>
                        <div className="col-span-3">
                          <span className="text-[10px] text-muted-foreground uppercase">฿ Amount</span>
                          <Input type="number" value={tier.fixedAmount} onChange={e => updateConfigBTier(idx, "fixedAmount", e.target.value)} className="h-8 text-sm px-1" />
                        </div>
                        <div className="col-span-4">
                          <span className="text-[10px] text-muted-foreground uppercase">Label</span>
                          <Input value={tier.label} onChange={e => updateConfigBTier(idx, "label", e.target.value)} className="h-8 text-sm px-1" />
                        </div>
                        <div className="col-span-1 pt-4 text-center">
                          <Button variant="ghost" size="sm" onClick={() => removeConfigBTier(idx)} className="h-7 w-7 p-0 text-destructive"><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      </div>
                    ))}
                    {editConfigB.tiers.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">ยังไม่มี Tier — กดปุ่มด้านบนเพื่อเพิ่ม</p>}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditConfigBOpen(false)}>ยกเลิก</Button>
            <Button onClick={saveConfigB} className="gap-2" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Incentive Dialog ===== */}
      <Dialog open={editIncentiveOpen} onOpenChange={setEditIncentiveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAddMode ? "เพิ่ม Incentive Tier" : "แก้ไข Incentive Tier"}</DialogTitle>
            <DialogDescription>ช่วงยอดขายและจำนวน Incentive ต่อคน</DialogDescription>
          </DialogHeader>
          {editIncentive && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={editIncentive.label} onChange={e => setEditIncentive({ ...editIncentive, label: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ยอดขายขั้นต่ำ (฿)</Label>
                  <Input type="number" value={editIncentive.minSales} onChange={e => setEditIncentive({ ...editIncentive, minSales: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>ยอดขายขั้นสูง (฿)</Label>
                  <Input type="number" value={editIncentive.maxSales ?? ""} placeholder="ไม่จำกัด" onChange={e => setEditIncentive({ ...editIncentive, maxSales: e.target.value === "" ? null : Number(e.target.value) })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Incentive ต่อคนต่อเดือน (฿)</Label>
                <Input type="number" value={editIncentive.incentivePerPerson} onChange={e => setEditIncentive({ ...editIncentive, incentivePerPerson: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-3">
                <Label>สถานะ</Label>
                <Switch checked={editIncentive.active} onCheckedChange={v => setEditIncentive({ ...editIncentive, active: v })} />
                <span className="text-sm text-muted-foreground">{editIncentive.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditIncentiveOpen(false)}>ยกเลิก</Button>
            <Button onClick={saveIncentive} className="gap-2" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit KPI Dialog ===== */}
      <Dialog open={editKPIOpen} onOpenChange={setEditKPIOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAddMode ? "เพิ่ม KPI" : "แก้ไข KPI"}</DialogTitle>
            <DialogDescription>บันทึกคะแนน KPI พนักงาน</DialogDescription>
          </DialogHeader>
          {editKPI && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>ชื่อพนักงาน</Label>
                <Input value={editKPI.employeeName} onChange={e => setEditKPI({ ...editKPI, employeeName: e.target.value })} placeholder="ชื่อ-นามสกุล" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>แผนก</Label>
                  <Select value={editKPI.department} onValueChange={v => setEditKPI({ ...editKPI, department: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sale">Sale</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Accounting">Accounting</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Production">Production</SelectItem>
                      <SelectItem value="Procurement">Procurement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>เดือน</Label>
                  <Input type="month" value={editKPI.month} onChange={e => setEditKPI({ ...editKPI, month: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>KPI Score</Label>
                <Input type="number" min={0} max={100} value={editKPI.kpiScore} onChange={e => setEditKPI({ ...editKPI, kpiScore: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>หมายเหตุ</Label>
                <Input value={editKPI.remark} onChange={e => setEditKPI({ ...editKPI, remark: e.target.value })} placeholder="หมายเหตุ (ไม่บังคับ)" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditKPIOpen(false)}>ยกเลิก</Button>
            <Button onClick={saveKPI} className="gap-2" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Edit Integration Dialog ===== */}
      <Dialog open={editIntegrationOpen} onOpenChange={setEditIntegrationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAddMode ? "เพิ่มแหล่งข้อมูล" : "แก้ไขแหล่งข้อมูล"}</DialogTitle>
            <DialogDescription>การเชื่อมโยง KPI จากภายนอก</DialogDescription>
          </DialogHeader>
          {editIntegration && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>แผนก</Label>
                <Select value={editIntegration.department} onValueChange={v => setEditIntegration({ ...editIntegration, department: v })}>
                  <SelectTrigger><SelectValue placeholder="เลือกแผนก" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sale">Sale</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Accounting">Accounting</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Procurement">Procurement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ประเภทแหล่งข้อมูล</Label>
                <Select value={editIntegration.dataSourceType} onValueChange={v => setEditIntegration({ ...editIntegration, dataSourceType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="GoogleSheet">Google Sheet</SelectItem>
                    <SelectItem value="API">API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editIntegration.dataSourceType === "GoogleSheet" && (
                <div className="space-y-2">
                  <Label>Google Sheet URL</Label>
                  <Input value={editIntegration.sheetUrl} onChange={e => setEditIntegration({ ...editIntegration, sheetUrl: e.target.value })} placeholder="https://docs.google.com/spreadsheets/d/..." />
                </div>
              )}
              {editIntegration.dataSourceType === "API" && (
                <div className="space-y-2">
                  <Label>API Endpoint</Label>
                  <Input value={editIntegration.apiEndpoint} onChange={e => setEditIntegration({ ...editIntegration, apiEndpoint: e.target.value })} placeholder="https://api.example.com/kpi" />
                </div>
              )}
              <div className="space-y-2">
                <Label>หมายเหตุ</Label>
                <Input value={editIntegration.note} onChange={e => setEditIntegration({ ...editIntegration, note: e.target.value })} placeholder="หมายเหตุ" />
              </div>
              <div className="flex items-center gap-3">
                <Label>สถานะ</Label>
                <Switch checked={editIntegration.active} onCheckedChange={v => setEditIntegration({ ...editIntegration, active: v })} />
                <span className="text-sm text-muted-foreground">{editIntegration.active ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditIntegrationOpen(false)}>ยกเลิก</Button>
            <Button onClick={saveIntegration} className="gap-2" disabled={loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Tabs */}
      <Tabs defaultValue="commission-config" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="commission-config">Configuration & Rates</TabsTrigger>
          <TabsTrigger value="kpi">KPI พนักงาน</TabsTrigger>
          <TabsTrigger value="kpi-integration">การเชื่อม KPI แผนก</TabsTrigger>
        </TabsList>

        {/* Tab 1: Commission Configuration with Sub-Tabs */}
        <TabsContent value="commission-config" className="space-y-6">
          <Tabs value={commissionSubTab} onValueChange={setCommissionSubTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ready-made" className="gap-2"><Package className="w-4 h-4" />สินค้าสำเร็จรูป (Config A)</TabsTrigger>
              <TabsTrigger value="made-to-order" className="gap-2"><Layers className="w-4 h-4" />สินค้าสั่งผลิต (Config B)</TabsTrigger>
              <TabsTrigger value="incentive" className="gap-2"><Award className="w-4 h-4" />Incentive แอดมิน</TabsTrigger>
            </TabsList>

            {/* Sub-Tab 1: Config A */}
            <TabsContent value="ready-made" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Config A: สินค้าสำเร็จรูป (Ready-Made)</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">ค่าคอม = อัตราต่อชิ้น × จำนวน หรือ %ยอดขาย</p>
                  </div>
                  <Button onClick={() => handleAddNew("Config A")} size="sm" className="gap-2"><Plus className="w-4 h-4" />เพิ่ม</Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ประเภทสินค้า</TableHead>
                        <TableHead className="text-right">อัตรา</TableHead>
                        <TableHead>หน่วย</TableHead>
                        <TableHead>วิธีคำนวณ</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {readyMadeConfigs.length === 0 && !loading && (
                        <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">ไม่พบข้อมูล — กรุณาคลิก "เพิ่ม" เพื่อเริ่มตั้งค่า</TableCell></TableRow>
                      )}
                      {readyMadeConfigs.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.category}</TableCell>
                          <TableCell className="text-right font-bold">
                            {c.calcMethod === "percentSales" ? `${c.ratePerUnit}%` : `฿${c.ratePerUnit.toLocaleString()}`}
                          </TableCell>
                          <TableCell>{c.unit}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {c.calcMethod === "perUnit" ? "ต่อชิ้น/คน" : "% ของยอดขาย"}
                            </Badge>
                          </TableCell>
                          <TableCell><Badge variant={c.active ? "default" : "secondary"}>{c.active ? "ใช้งาน" : "ปิด"}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit("Config A", c.id)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete("Config A", c.id)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sub-Tab 2: Config B */}
            <TabsContent value="made-to-order" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Config B: สินค้าสั่งผลิต (Made-to-Order Tiers)</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">ค่าคอม = เหมาจ่ายตาม Tier หรือ Fixed per Job</p>
                  </div>
                  <Button onClick={() => handleAddNew("Config B")} size="sm" className="gap-2"><Plus className="w-4 h-4" />เพิ่ม</Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {madeToOrderConfigs.length === 0 && !loading && (
                    <p className="text-center py-10 text-muted-foreground border rounded-lg">ไม่พบข้อมูล Config B</p>
                  )}
                  {madeToOrderConfigs.map(c => (
                    <div key={c.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{c.category}</h4>
                          <Badge variant={c.active ? "default" : "secondary"}>{c.active ? "ใช้งาน" : "ปิด"}</Badge>
                          <Badge variant="outline" className="text-xs">{c.calcMethod === "fixedPerJob" ? "Fixed Job" : "Tier-based"}</Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit("Config B", c.id)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete("Config B", c.id)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      {c.calcMethod === "fixedPerJob" ? (
                        <p className="text-sm text-muted-foreground">เหมาจ่าย: <strong>฿{(c.fixedPerJob ?? 0).toLocaleString()}</strong> / งาน</p>
                      ) : (
                        <Table>
                          <TableHeader><TableRow><TableHead>ช่วงจำนวน</TableHead><TableHead className="text-right">ค่าคอมเหมา (บาท)</TableHead></TableRow></TableHeader>
                          <TableBody>
                            {c.tiers.map((tier, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{tier.label}</TableCell>
                                <TableCell className="text-right font-bold">
                                  {tier.fixedAmount === 0 ? <span className="text-muted-foreground font-normal">ไม่คิดค่าคอม</span> : `฿${tier.fixedAmount.toLocaleString()}`}
                                </TableCell>
                              </TableRow>
                            ))}
                            {c.tiers.length === 0 && <TableRow><TableCell colSpan={2} className="text-center text-xs text-muted-foreground">ไม่มีข้อมูล Tier — กรุณากดแก้ไขเพื่อเพิ่ม</TableCell></TableRow>}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sub-Tab 3: Admin Incentive */}
            <TabsContent value="incentive" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Admin Incentive Config</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">เงื่อนไข Incentive แอดมิน: ยอดขายรวมทั้งบริษัท → จำนวนเงินต่อคนต่อเดือน</p>
                  </div>
                  <Button onClick={() => handleAddNew("Incentive Tier")} size="sm" className="gap-2"><Plus className="w-4 h-4" />เพิ่มขั้น</Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ช่วงยอดขายรวม</TableHead>
                        <TableHead className="text-right">ยอดขายขั้นต่ำ</TableHead>
                        <TableHead className="text-right">ยอดขายขั้นสูง</TableHead>
                        <TableHead className="text-right">Incentive / คน / เดือน</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead className="text-right">จัดการ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incentiveTiers.length === 0 && !loading && (
                        <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">ไม่พบข้อมูลเงื่อนไข Incentive</TableCell></TableRow>
                      )}
                      {incentiveTiers.map(tier => (
                        <TableRow key={tier.id}>
                          <TableCell className="font-medium">{tier.label}</TableCell>
                          <TableCell className="text-right">฿{tier.minSales.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{tier.maxSales ? `฿${tier.maxSales.toLocaleString()}` : "ไม่จำกัด"}</TableCell>
                          <TableCell className="text-right font-bold text-primary">฿{tier.incentivePerPerson.toLocaleString()}</TableCell>
                          <TableCell><Badge variant={tier.active ? "default" : "secondary"}>{tier.active ? "ใช้งาน" : "ปิด"}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit("Incentive", tier.id)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete("Incentive", tier.id)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Tab 2: KPI */}
        <TabsContent value="kpi" className="space-y-4">
          {viewingMonth ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => setViewingMonth(null)} className="gap-1">
                    <ChevronLeft className="w-4 h-4" />ย้อนกลับ
                  </Button>
                  <div>
                    <CardTitle>KPI ประจำเดือน {new Date(viewingMonth + "-01").toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">พนักงาน {filteredKPIRecords.length} คน | เฉลี่ย {filteredKPIRecords.length > 0 ? Math.round(filteredKPIRecords.reduce((s, r) => s + r.kpiScore, 0) / filteredKPIRecords.length) : 0} คะแนน</p>
                  </div>
                </div>
                <Button onClick={() => handleAddNew("คะแนน KPI")} className="gap-2"><Plus className="w-4 h-4" />เพิ่ม KPI</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>พนักงาน</TableHead>
                      <TableHead>แผนก</TableHead>
                      <TableHead className="text-right">KPI Score</TableHead>
                      <TableHead>หมายเหตุ</TableHead>
                      <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKPIRecords.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">ไม่มีข้อมูล KPI ในเดือนนี้</TableCell></TableRow>
                    )}
                    {filteredKPIRecords.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.employeeName}</TableCell>
                        <TableCell>{r.department}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={r.kpiScore >= 90 ? "default" : r.kpiScore >= 80 ? "secondary" : "destructive"}>
                            {r.kpiScore}
                          </Badge>
                        </TableCell>
                        <TableCell>{r.remark || <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit("KPI", r.id)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete("KPI", r.id)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>KPI พนักงาน — รายเดือน</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">เลือกเดือนเพื่อดูข้อมูล KPI ย้อนหลัง</p>
                  </div>
                  <Button onClick={() => handleAddNew("คะแนน KPI")} className="gap-2"><Plus className="w-4 h-4" />เพิ่ม KPI</Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {monthlySummaries.map(summary => (
                      <Card
                        key={summary.month}
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                        onClick={() => setViewingMonth(summary.month)}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-base">
                              {new Date(summary.month + "-01").toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}
                            </h3>
                            <Button variant="ghost" size="sm" className="gap-1 text-primary">
                              <Eye className="w-4 h-4" />ดู
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] mb-1">
                                <Users className="w-3 h-3" />พนักงาน
                              </div>
                              <p className="text-xl font-bold">{summary.count}</p>
                            </div>
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] mb-1">
                                <TrendingUp className="w-3 h-3" />เฉลี่ย
                              </div>
                              <p className="text-xl font-bold">{summary.avgScore}</p>
                            </div>
                            <div className="text-center">
                              <div className="text-muted-foreground text-[10px] mb-1">ระดับ</div>
                              <Badge variant={summary.avgScore >= 90 ? "default" : summary.avgScore >= 80 ? "secondary" : "destructive"} className="text-[10px] px-1 h-5">
                                {summary.avgScore >= 90 ? "ดีเยี่ยม" : summary.avgScore >= 80 ? "ดี" : "ปรับปรุง"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {monthlySummaries.length === 0 && !loading && (
                    <div className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-xl">ยังไม่มีข้อมูล KPI บันทึกไว้</div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Tab 3: KPI Integration */}
        <TabsContent value="kpi-integration" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>การเชื่อมต่อ KPI รายแผนก</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">ตั้งค่าแหล่งข้อมูลสำหรับดึง KPI (Google Sheets / API)</p>
              </div>
              <Button onClick={() => handleAddNew("แหล่งข้อมูล KPI")} size="sm" className="gap-2"><Plus className="w-4 h-4" />เพิ่ม</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>แผนก</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>ข้อมูล</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpiIntegrations.length === 0 && !loading && (
                    <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">ยังไม่มีการตั้งค่าเชื่อมต่อ</TableCell></TableRow>
                  )}
                  {kpiIntegrations.map(i => (
                    <TableRow key={i.id}>
                      <TableCell className="font-medium">{i.department}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{i.dataSourceType}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                        {i.dataSourceType === "GoogleSheet" ? i.sheetUrl : i.dataSourceType === "API" ? i.apiEndpoint : i.note}
                      </TableCell>
                      <TableCell><Badge variant={i.active ? "default" : "secondary"}>{i.active ? "เปิด" : "ปิด"}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit("Integration", i.id)}><Edit className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete("Integration", i.id)} className="hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
