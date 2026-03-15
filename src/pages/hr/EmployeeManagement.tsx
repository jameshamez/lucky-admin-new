import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Edit, Users, Briefcase, ShieldCheck, UserMinus, X, UserX, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { defaultEmployees, defaultPositions, getSaleEmployees, getAdminEmployees, getActiveEmployees, getResignedEmployees, type Employee, type EmployeeRole, type EmployeeStatus } from "@/lib/employeeData";
import { hrService } from "@/services/hrService";
import { Loader2 } from "lucide-react";

const ROLE_CONFIG: Record<EmployeeRole, { label: string; desc: string; color: string }> = {
  Sale: { label: "Sales (Commission)", desc: "ชื่อจะปรากฏในหน้าบันทึกค่าคอมฯ — คำนวณตามสูตรสินค้า", color: "bg-blue-500/15 text-blue-700 border-blue-200" },
  Admin: { label: "Admin (Incentive)", desc: "ชื่อจะถูกนำไปคำนวณ Incentive จากยอดขายรวมบริษัท", color: "bg-violet-500/15 text-violet-700 border-violet-200" },
  General: { label: "General (No Benefit)", desc: "ไม่ได้รับค่าคอมมิชชั่นหรือ Incentive", color: "bg-muted text-muted-foreground border-border" },
};

export default function EmployeeManagement() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isResignDialogOpen, setIsResignDialogOpen] = useState(false);
  const [resignTargetId, setResignTargetId] = useState<string | null>(null);
  const [newPositionInput, setNewPositionInput] = useState("");
  const [activeTab, setActiveTab] = useState("active");

  const [form, setForm] = useState({
    id: "",
    fullName: "",
    nickname: "",
    position: "",
    role: "Sale" as EmployeeRole,
    status: "ACTIVE" as EmployeeStatus
  });

  // Load from API
  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, posRes] = await Promise.all([
        hrService.getEmployees(),
        hrService.getPositions()
      ]);
      if (empRes.status === 'success') setEmployees(empRes.data);
      if (posRes.status === 'success') setPositions(posRes.data);
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({ id: "", fullName: "", nickname: "", position: "", role: "Sale", status: "ACTIVE" });
    setEditingEmployee(null);
    setNewPositionInput("");
  };

  const activeEmployees = getActiveEmployees(employees);
  const resignedEmployees = getResignedEmployees(employees);

  const filtered = useMemo(() => {
    const source = activeTab === "active" ? activeEmployees : resignedEmployees;
    return source.filter(e => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || e.fullName.toLowerCase().includes(q) || e.nickname.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
      const matchRole = filterRole === "all" || e.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [employees, searchQuery, filterRole, activeTab]);

  const saleCount = getSaleEmployees(employees).length;
  const adminCount = getAdminEmployees(employees).length;
  const generalCount = activeEmployees.filter(e => e.role === "General").length;

  const handleOpenAdd = () => { resetForm(); setIsDialogOpen(true); };

  const handleOpenEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setForm({ id: emp.id, fullName: emp.fullName, nickname: emp.nickname || "", position: emp.position, role: emp.role, status: emp.status });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.fullName || !form.position || !form.id) {
      toast({ title: "กรุณากรอกรหัส ชื่อ และตำแหน่ง", variant: "destructive" });
      return;
    }

    try {
      const res = await hrService.saveEmployee(form, !!editingEmployee);
      if (res.status === 'success') {
        toast({ title: editingEmployee ? "อัพเดทสำเร็จ" : "เพิ่มพนักงานสำเร็จ", description: `${form.fullName}` });
        loadData();
        setIsDialogOpen(false);
        resetForm();
      } else {
        toast({ title: "เกิดข้อผิดพลาด", description: res.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถบันทึกข้อมูลได้", variant: "destructive" });
    }
  };

  const handleResign = (id: string) => { setResignTargetId(id); setIsResignDialogOpen(true); };

  const confirmResign = async () => {
    if (resignTargetId) {
      try {
        const res = await hrService.resignEmployee(resignTargetId);
        if (res.status === 'success') {
          toast({ title: "แจ้งลาออกสำเร็จ", description: "พนักงานถูกย้ายไปประวัติพนักงานเก่าแล้ว" });
          loadData();
        } else {
          toast({ title: "เกิดข้อผิดพลาด", description: res.message, variant: "destructive" });
        }
      } catch (error) {
        toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถดำเนินการได้", variant: "destructive" });
      }
    }
    setIsResignDialogOpen(false);
    setResignTargetId(null);
  };

  const handleAddPosition = async () => {
    const val = newPositionInput.trim();
    if (!val) return;
    if (positions.includes(val)) {
      toast({ title: "ตำแหน่งนี้มีอยู่แล้ว", variant: "destructive" });
      return;
    }
    try {
      const res = await hrService.addPosition(val);
      if (res.status === 'success') {
        setPositions([...positions, val]);
        setForm({ ...form, position: val });
        setNewPositionInput("");
        toast({ title: "เพิ่มตำแหน่งใหม่สำเร็จ", description: val });
      }
    } catch (error) {
      toast({ title: "เพิ่มตำแหน่งล้มเหลว", variant: "destructive" });
    }
  };

  const handleDeletePosition = async (pos: string) => {
    const inUse = employees.some(e => e.position === pos);
    if (inUse) {
      toast({ title: "ไม่สามารถลบได้", description: `ตำแหน่ง "${pos}" ยังมีพนักงานใช้งานอยู่`, variant: "destructive" });
      return;
    }
    try {
      const res = await hrService.deletePosition(pos);
      if (res.status === 'success') {
        setPositions(positions.filter(p => p !== pos));
        if (form.position === pos) setForm({ ...form, position: "" });
        toast({ title: "ลบตำแหน่งสำเร็จ", description: pos });
      }
    } catch (error) {
      toast({ title: "ลบตำแหน่งล้มเหลว", variant: "destructive" });
    }
  };

  const resignTargetEmployee = resignTargetId ? employees.find(e => e.id === resignTargetId) : null;

  if (loading && employees.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">กำลังโหลดข้อมูลพนักงาน...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">จัดการข้อมูลพนักงาน</h1>
          <p className="text-muted-foreground">กำหนดตำแหน่งและบทบาทในระบบค่าตอบแทน</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2"><Plus className="w-4 h-4" />เพิ่มพนักงาน</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">พนักงานปัจจุบัน</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees.length}</div>
            {resignedEmployees.length > 0 && <p className="text-xs text-muted-foreground">ลาออกแล้ว {resignedEmployees.length} คน</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{saleCount}</div>
            <p className="text-xs text-muted-foreground">รับค่าคอมมิชชั่น</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">{adminCount}</div>
            <p className="text-xs text-muted-foreground">รับ Incentive</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">General</CardTitle>
            <UserMinus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{generalCount}</div>
            <p className="text-xs text-muted-foreground">ไม่มีสิทธิ์พิเศษ</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="ค้นหาชื่อ / รหัส..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-48"><SelectValue placeholder="กรองตาม Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุก Role</SelectItem>
            <SelectItem value="Sale">Sales (Commission)</SelectItem>
            <SelectItem value="Admin">Admin (Incentive)</SelectItem>
            <SelectItem value="General">General (No Benefit)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <Users className="w-4 h-4" />
            พนักงานปัจจุบัน
            <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5 text-xs">{activeEmployees.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="resigned" className="gap-2">
            <History className="w-4 h-4" />
            ประวัติพนักงานเก่า
            {resignedEmployees.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">{resignedEmployees.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Tab */}
        <TabsContent value="active">
          <Card>
            <CardHeader><CardTitle>รายชื่อพนักงานปัจจุบัน ({filtered.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">รหัส</TableHead>
                      <TableHead>ชื่อ-นามสกุล</TableHead>
                      <TableHead>ตำแหน่ง</TableHead>
                      <TableHead>บทบาทในระบบ</TableHead>
                      <TableHead className="text-right w-[120px]">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูลพนักงาน</TableCell></TableRow>
                    ) : filtered.map(emp => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-mono text-xs">{emp.id}</TableCell>
                        <TableCell>
                          <p className="font-medium">{emp.fullName}</p>
                          {emp.nickname && <p className="text-xs text-muted-foreground">({emp.nickname})</p>}
                        </TableCell>
                        <TableCell>{emp.position}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={ROLE_CONFIG[emp.role].color}>
                            {ROLE_CONFIG[emp.role].label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(emp)}><Edit className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleResign(emp.id)} className="hover:text-destructive" title="แจ้งลาออก">
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resigned Tab */}
        <TabsContent value="resigned">
          <Card>
            <CardHeader><CardTitle>ประวัติพนักงานเก่า ({filtered.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">รหัส</TableHead>
                      <TableHead>ชื่อ-นามสกุล</TableHead>
                      <TableHead>ตำแหน่ง</TableHead>
                      <TableHead>บทบาทเดิม</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">ไม่มีประวัติพนักงานเก่า</TableCell></TableRow>
                    ) : filtered.map(emp => (
                      <TableRow key={emp.id} className="opacity-70">
                        <TableCell className="font-mono text-xs">{emp.id}</TableCell>
                        <TableCell>
                          <p className="font-medium">{emp.fullName}</p>
                          {emp.nickname && <p className="text-xs text-muted-foreground">({emp.nickname})</p>}
                        </TableCell>
                        <TableCell>{emp.position}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={ROLE_CONFIG[emp.role].color}>
                            {ROLE_CONFIG[emp.role].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive" className="text-xs">ลาออกแล้ว</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEmployee ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}</DialogTitle>
            <DialogDescription>กรอกข้อมูลพื้นฐานและกำหนดบทบาทในระบบค่าตอบแทน</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>รหัสพนักงาน *</Label>
              <Input value={form.id} onChange={e => setForm({ ...form, id: e.target.value })} placeholder="เช่น EMP-010" disabled={!!editingEmployee} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ชื่อ-นามสกุล *</Label>
                <Input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="กรอกชื่อ-นามสกุล" />
              </div>
              <div className="space-y-2">
                <Label>ชื่อเล่น</Label>
                <Input value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="ชื่อเล่น" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>ตำแหน่ง *</Label>
              <Select value={form.position} onValueChange={v => setForm({ ...form, position: v })}>
                <SelectTrigger><SelectValue placeholder="เลือกตำแหน่ง" /></SelectTrigger>
                <SelectContent>
                  {positions.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="เพิ่มตำแหน่งใหม่..."
                  value={newPositionInput}
                  onChange={e => setNewPositionInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleAddPosition())}
                  className="text-sm h-8"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddPosition} className="shrink-0 h-8">
                  <Plus className="w-3 h-3 mr-1" />เพิ่ม
                </Button>
              </div>
              {/* Position list with delete */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {positions.map(p => (
                  <Badge key={p} variant="outline" className="gap-1 pr-1 text-xs">
                    {p}
                    <button
                      type="button"
                      onClick={() => handleDeletePosition(p)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>บทบาทในระบบ (System Role) *</Label>
              <Select value={form.role} onValueChange={(v: EmployeeRole) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sale">Sales — รับค่าคอมมิชชั่น</SelectItem>
                  <SelectItem value="Admin">Admin — รับ Incentive</SelectItem>
                  <SelectItem value="General">General — ไม่มีสิทธิ์พิเศษ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role hint */}
            <div className="rounded-lg border p-3 bg-muted/30 text-sm text-muted-foreground">
              {ROLE_CONFIG[form.role].desc}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave}>{editingEmployee ? "บันทึก" : "เพิ่มพนักงาน"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resign Confirmation Dialog */}
      <AlertDialog open={isResignDialogOpen} onOpenChange={setIsResignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันแจ้งลาออก</AlertDialogTitle>
            <AlertDialogDescription>
              {resignTargetEmployee ? (
                <>
                  คุณต้องการแจ้งลาออก <strong>{resignTargetEmployee.fullName}</strong> ({resignTargetEmployee.id}) หรือไม่?
                  <br /><br />
                  ข้อมูลจะถูกย้ายไปแท็บ "ประวัติพนักงานเก่า" และจะไม่แสดงใน Dropdown เลือกพนักงานของหน้าบันทึกค่าคอมฯ อีกต่อไป
                  <br /><br />
                  <strong>หมายเหตุ:</strong> ข้อมูลประวัติการขายและค่าคอมเดิมจะยังคงอยู่ในระบบ
                </>
              ) : "ต้องการแจ้งลาออกพนักงานนี้หรือไม่?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmResign} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              ยืนยันลาออก
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
