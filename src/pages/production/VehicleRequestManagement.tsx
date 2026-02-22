import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Plus, Upload, Car, ClipboardList, Eye, ChevronsUpDown, Pencil, Fuel, BarChart3, Settings } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

// ─── Types ──────────────────────────────────────────────────
interface VehicleUsageLog {
  id: string; date: string; driver: string; destination: string; purpose: string;
  mileageStart: number; mileageEnd: number; fuelAdded: number; fuelCost: number; notes: string;
}
interface Vehicle {
  id: string; name: string; licensePlate: string; type: string;
  status: "พร้อมใช้" | "กำลังใช้งาน" | "ซ่อมบำรุง"; currentMileage: number; usageLogs: VehicleUsageLog[];
}

// ─── Mock Data ──────────────────────────────────────────────
const mockRequests = [
  { id: "VR001", customerLineName: "ลูกค้า A", product: "เหรียญรางวัล 500 ชิ้น", deliveryBy: "พนักงานขับรถ 1", deliveryDate: "2024-03-15", deliveryLocation: "โรงเรียนสาธิต", address: "123 ถนนพระราม 4 กรุงเทพฯ 10110", notes: "มีใบเสร็จ", status: "รออนุมัติ", imageUrl: null },
  { id: "VR002", customerLineName: "ลูกค้า B", product: "โล่รางวัล 100 ชิ้น", deliveryBy: "พนักงานขับรถ 2", deliveryDate: "2024-03-16", deliveryLocation: "บริษัท ABC จำกัด", address: "456 ถนนสุขุมวิท กรุงเทพฯ 10110", notes: "ไม่มีใบเสร็จ", status: "อนุมัติแล้ว", imageUrl: null },
];

const initialVehicles: Vehicle[] = [
  { id: "V001", name: "รถกระบะ 1", licensePlate: "กข 1234 กรุงเทพ", type: "กระบะ", status: "พร้อมใช้", currentMileage: 45230,
    usageLogs: [
      { id: "UL001", date: "2024-03-14", driver: "สมชาย", destination: "โรงเรียนสาธิต", purpose: "ส่งสินค้า", mileageStart: 45100, mileageEnd: 45230, fuelAdded: 30, fuelCost: 1050, notes: "ส่งเหรียญรางวัล" },
      { id: "UL002", date: "2024-03-10", driver: "สมชาย", destination: "บริษัท XYZ", purpose: "ส่งสินค้า", mileageStart: 44950, mileageEnd: 45100, fuelAdded: 25, fuelCost: 875, notes: "ส่งโล่รางวัล 50 ชิ้น" },
      { id: "UL010", date: "2024-02-20", driver: "สมชาย", destination: "จ.ชลบุรี", purpose: "ส่งสินค้า", mileageStart: 44500, mileageEnd: 44950, fuelAdded: 50, fuelCost: 1750, notes: "" },
      { id: "UL011", date: "2024-02-05", driver: "สมชาย", destination: "นนทบุรี", purpose: "ส่งสินค้า", mileageStart: 44300, mileageEnd: 44500, fuelAdded: 20, fuelCost: 700, notes: "" },
      { id: "UL012", date: "2024-01-15", driver: "สมชาย", destination: "ปทุมธานี", purpose: "รับวัตถุดิบ", mileageStart: 44100, mileageEnd: 44300, fuelAdded: 22, fuelCost: 770, notes: "" },
      { id: "UL013", date: "2024-01-05", driver: "สมชาย", destination: "สมุทรปราการ", purpose: "ส่งสินค้า", mileageStart: 43800, mileageEnd: 44100, fuelAdded: 35, fuelCost: 1225, notes: "" },
      { id: "UL014", date: "2023-12-20", driver: "สมชาย", destination: "กรุงเทพ", purpose: "ส่งสินค้า", mileageStart: 43500, mileageEnd: 43800, fuelAdded: 30, fuelCost: 1050, notes: "" },
      { id: "UL015", date: "2023-12-10", driver: "สมชาย", destination: "นครปฐม", purpose: "ส่งสินค้า", mileageStart: 43200, mileageEnd: 43500, fuelAdded: 28, fuelCost: 980, notes: "" },
    ],
  },
  { id: "V002", name: "รถตู้ 1", licensePlate: "คง 5678 กรุงเทพ", type: "รถตู้", status: "กำลังใช้งาน", currentMileage: 78500,
    usageLogs: [
      { id: "UL003", date: "2024-03-15", driver: "วิชัย", destination: "จ.นครปฐม", purpose: "ส่งสินค้า", mileageStart: 78400, mileageEnd: 78500, fuelAdded: 40, fuelCost: 1400, notes: "ส่งถ้วยรางวัล ลูกค้า B" },
      { id: "UL020", date: "2024-02-25", driver: "วิชัย", destination: "จ.ราชบุรี", purpose: "ส่งสินค้า", mileageStart: 78100, mileageEnd: 78400, fuelAdded: 45, fuelCost: 1575, notes: "" },
      { id: "UL021", date: "2024-02-10", driver: "วิชัย", destination: "จ.กาญจนบุรี", purpose: "ส่งสินค้า", mileageStart: 77700, mileageEnd: 78100, fuelAdded: 55, fuelCost: 1925, notes: "" },
      { id: "UL022", date: "2024-01-20", driver: "วิชัย", destination: "จ.สุพรรณบุรี", purpose: "ส่งสินค้า", mileageStart: 77300, mileageEnd: 77700, fuelAdded: 50, fuelCost: 1750, notes: "" },
      { id: "UL023", date: "2024-01-08", driver: "วิชัย", destination: "กรุงเทพ", purpose: "รับวัตถุดิบ", mileageStart: 77100, mileageEnd: 77300, fuelAdded: 25, fuelCost: 875, notes: "" },
      { id: "UL024", date: "2023-12-15", driver: "วิชัย", destination: "นนทบุรี", purpose: "ส่งสินค้า", mileageStart: 76800, mileageEnd: 77100, fuelAdded: 35, fuelCost: 1225, notes: "" },
    ],
  },
  { id: "V003", name: "รถกระบะ 2", licensePlate: "จฉ 9012 กรุงเทพ", type: "กระบะ", status: "ซ่อมบำรุง", currentMileage: 62100, usageLogs: [] },
];

// ─── Sortable Header Component ──────────────────────────────
function SortableHead({ label, sortKey, currentSort, onSort, className }: {
  label: string; sortKey: string; currentSort: { key: string; dir: "asc" | "desc" };
  onSort: (key: string) => void; className?: string;
}) {
  return (
    <TableHead className={className}>
      <button className="flex items-center gap-1 hover:text-foreground transition-colors group" onClick={() => onSort(sortKey)}>
        {label}
        <ChevronsUpDown className={`w-3.5 h-3.5 transition-colors ${currentSort.key === sortKey ? "text-[#1B3A5C]" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
      </button>
    </TableHead>
  );
}

// ─── Main Component ─────────────────────────────────────────
export default function VehicleRequestManagement() {
  const [requests, setRequests] = useState(mockRequests);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showLogDrawer, setShowLogDrawer] = useState(false);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [formDirty, setFormDirty] = useState(false);

  // Vehicle CRUD
  const [showVehicleDrawer, setShowVehicleDrawer] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({ name: "", licensePlate: "", type: "กระบะ", currentMileage: 0, status: "พร้อมใช้" as Vehicle["status"] });

  const [requestSort, setRequestSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "id", dir: "asc" });
  const [logSort, setLogSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });

  const [logForm, setLogForm] = useState({ date: "", driver: "", destination: "", purpose: "", mileageStart: 0, mileageEnd: 0, fuelAdded: 0, fuelCost: 0, notes: "" });
  const [formData, setFormData] = useState({ customerLineName: "", product: "", deliveryBy: "", deliveryDate: "", deliveryLocation: "", address: "", notes: "", imageUrl: null as string | null });

  // ─── Sorting ────────────────────────────────────────────
  const toggleSort = useCallback((key: string, setter: React.Dispatch<React.SetStateAction<{ key: string; dir: "asc" | "desc" }>>) => {
    setter(prev => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));
  }, []);

  const sortedRequests = useMemo(() => {
    const sorted = [...requests];
    sorted.sort((a, b) => { const cmp = String((a as any)[requestSort.key] ?? "").localeCompare(String((b as any)[requestSort.key] ?? ""), "th"); return requestSort.dir === "asc" ? cmp : -cmp; });
    return sorted;
  }, [requests, requestSort]);

  const handleDrawerClose = useCallback((open: boolean, setOpen: (v: boolean) => void) => {
    if (!open && formDirty) { if (!window.confirm("คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหน้าจอนี้หรือไม่?")) return; }
    setOpen(open); if (!open) setFormDirty(false);
  }, [formDirty]);

  // ─── Vehicle Request Handlers ───────────────────────────
  const handleApprove = (id: string) => { setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "อนุมัติแล้ว" } : r)); toast({ title: "อนุมัติคำขอสำเร็จ", description: `คำขอ ${id} อนุมัติแล้ว` }); };
  const handleReject = (id: string) => { setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "ไม่อนุมัติ" } : r)); toast({ title: "ไม่อนุมัติคำขอ", variant: "destructive" }); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRequests(prev => [{ id: `VR${String(prev.length + 1).padStart(3, '0')}`, ...formData, status: "รออนุมัติ" }, ...prev]);
    setIsDrawerOpen(false); setFormDirty(false);
    setFormData({ customerLineName: "", product: "", deliveryBy: "", deliveryDate: "", deliveryLocation: "", address: "", notes: "", imageUrl: null });
    toast({ title: "สร้างคำขอสำเร็จ" });
  };
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => { setFormData(prev => ({ ...prev, imageUrl: r.result as string })); setFormDirty(true); }; r.readAsDataURL(f); } };
  const getStatusColor = (s: string) => s === "ไม่อนุมัติ" ? "destructive" as const : "default" as const;

  // ─── Vehicle Usage Log Handlers ─────────────────────────
  const openAddLog = (v: Vehicle) => { setSelectedVehicle(v); setLogForm({ date: "", driver: "", destination: "", purpose: "", mileageStart: v.currentMileage, mileageEnd: v.currentMileage, fuelAdded: 0, fuelCost: 0, notes: "" }); setFormDirty(false); setShowLogDrawer(true); };
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    if (!logForm.date || !logForm.driver || !logForm.destination) { toast({ title: "กรุณากรอกข้อมูลให้ครบ", variant: "destructive" }); return; }
    setVehicles(prev => prev.map(v => v.id === selectedVehicle.id ? { ...v, currentMileage: logForm.mileageEnd || v.currentMileage, usageLogs: [{ id: `UL${Date.now()}`, ...logForm }, ...v.usageLogs] } : v));
    setShowLogDrawer(false); setFormDirty(false);
    toast({ title: "บันทึกสำเร็จ", description: `เพิ่มบันทึกการใช้รถ ${selectedVehicle.name} แล้ว` });
  };

  const getVehicleStatusBadge = (s: Vehicle["status"]) => {
    if (s === "พร้อมใช้") return <Badge className="bg-green-600 text-white">พร้อมใช้</Badge>;
    if (s === "กำลังใช้งาน") return <Badge className="bg-[#6C9FCE] text-white">กำลังใช้งาน</Badge>;
    return <Badge className="bg-amber-600 text-white">ซ่อมบำรุง</Badge>;
  };

  // ─── Vehicle CRUD Handlers ──────────────────────────────
  const openAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm({ name: "", licensePlate: "", type: "กระบะ", currentMileage: 0, status: "พร้อมใช้" });
    setFormDirty(false); setShowVehicleDrawer(true);
  };
  const openEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setVehicleForm({ name: v.name, licensePlate: v.licensePlate, type: v.type, currentMileage: v.currentMileage, status: v.status });
    setFormDirty(false); setShowVehicleDrawer(true);
  };
  const handleSaveVehicle = () => {
    if (!vehicleForm.name || !vehicleForm.licensePlate) { toast({ title: "กรุณากรอกชื่อรถและทะเบียน", variant: "destructive" }); return; }
    if (editingVehicle) {
      setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? { ...v, ...vehicleForm } : v));
      toast({ title: "แก้ไขข้อมูลรถสำเร็จ", description: vehicleForm.name });
    } else {
      const newV: Vehicle = { id: `V${String(Date.now()).slice(-4)}`, ...vehicleForm, usageLogs: [] };
      setVehicles(prev => [...prev, newV]);
      toast({ title: "เพิ่มรถใหม่สำเร็จ", description: vehicleForm.name });
    }
    setShowVehicleDrawer(false); setFormDirty(false);
  };

  const pendingRequests = requests.filter(r => r.status === "รออนุมัติ");
  const approvedRequests = requests.filter(r => r.status === "อนุมัติแล้ว");
  const rejectedRequests = requests.filter(r => r.status === "ไม่อนุมัติ");

  const sortedLogs = useMemo(() => {
    const logs = vehicles.find(v => v.id === viewingVehicle?.id)?.usageLogs || [];
    return [...logs].sort((a, b) => { const aV = (a as any)[logSort.key] ?? ""; const bV = (b as any)[logSort.key] ?? ""; if (typeof aV === "number" && typeof bV === "number") return logSort.dir === "asc" ? aV - bV : bV - aV; return logSort.dir === "asc" ? String(aV).localeCompare(String(bV), "th") : String(bV).localeCompare(String(aV), "th"); });
  }, [vehicles, viewingVehicle, logSort]);

  // ─── Monthly Fuel Summary Data ──────────────────────────
  const monthlyFuelData = useMemo(() => {
    const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const allMonths = new Map<string, Record<string, number>>();

    vehicles.forEach(v => {
      v.usageLogs.forEach(log => {
        const d = new Date(log.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!allMonths.has(key)) allMonths.set(key, {});
        const entry = allMonths.get(key)!;
        entry[v.id] = (entry[v.id] || 0) + log.fuelCost;
      });
    });

    const sorted = Array.from(allMonths.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.map(([key, costs]) => {
      const [y, m] = key.split("-");
      const label = `${monthNames[parseInt(m) - 1]} ${y}`;
      const row: any = { month: label };
      let total = 0;
      vehicles.forEach(v => { row[v.name] = costs[v.id] || 0; total += costs[v.id] || 0; });
      row["รวม"] = total;
      return row;
    });
  }, [vehicles]);

  // Per-vehicle monthly summary
  const perVehicleMonthlySummary = useMemo(() => {
    return vehicles.map(v => {
      const monthNames = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
      const byMonth = new Map<string, { cost: number; fuel: number; distance: number; trips: number }>();
      v.usageLogs.forEach(log => {
        const d = new Date(log.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!byMonth.has(key)) byMonth.set(key, { cost: 0, fuel: 0, distance: 0, trips: 0 });
        const e = byMonth.get(key)!;
        e.cost += log.fuelCost; e.fuel += log.fuelAdded; e.distance += (log.mileageEnd - log.mileageStart); e.trips += 1;
      });
      const sorted = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      return {
        vehicle: v,
        months: sorted.map(([key, data]) => {
          const [y, m] = key.split("-");
          return { month: `${monthNames[parseInt(m) - 1]} ${y}`, ...data };
        }),
        totalCost: sorted.reduce((s, [, d]) => s + d.cost, 0),
        totalFuel: sorted.reduce((s, [, d]) => s + d.fuel, 0),
        totalDistance: sorted.reduce((s, [, d]) => s + d.distance, 0),
      };
    });
  }, [vehicles]);

  const chartColors = ["#1B3A5C", "#6FB98F", "#CE3175", "#6C9FCE", "#d97706"];

  const drawerContentClass = "vehicle-drawer inset-y-0 left-0 h-full w-[75vw] max-w-none border-r p-0 flex flex-col data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left data-[state=closed]:duration-300 data-[state=open]:duration-500";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">การจัดการขอใช้รถ</h1>
        <p className="text-muted-foreground mt-2">จัดการคำขอใช้รถ บันทึกการใช้ และสรุปค่าใช้จ่าย</p>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests" className="flex items-center gap-2"><ClipboardList className="w-4 h-4" /> คำขอใช้รถ</TabsTrigger>
          <TabsTrigger value="usage-log" className="flex items-center gap-2"><Car className="w-4 h-4" /> บันทึกการใช้รถ</TabsTrigger>
          <TabsTrigger value="fuel-summary" className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> สรุปค่าน้ำมัน</TabsTrigger>
          <TabsTrigger value="manage-vehicles" className="flex items-center gap-2"><Settings className="w-4 h-4" /> จัดการข้อมูลรถ</TabsTrigger>
        </TabsList>

        {/* ===== Tab: คำขอใช้รถ ===== */}
        <TabsContent value="requests" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2" onClick={() => { setFormDirty(false); setIsDrawerOpen(true); }}><Plus className="h-4 w-4" /> สร้างคำขอใหม่</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">รอการอนุมัติ</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{pendingRequests.length}</div></CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">อนุมัติแล้ว</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{approvedRequests.length}</div></CardContent></Card>
            <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium">ไม่อนุมัติ</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{rejectedRequests.length}</div></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>รายการคำขอใช้รถทั้งหมด</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead label="รหัส" sortKey="id" currentSort={requestSort} onSort={(k) => toggleSort(k, setRequestSort)} />
                    <SortableHead label="ลูกค้า" sortKey="customerLineName" currentSort={requestSort} onSort={(k) => toggleSort(k, setRequestSort)} />
                    <SortableHead label="สินค้า" sortKey="product" currentSort={requestSort} onSort={(k) => toggleSort(k, setRequestSort)} />
                    <SortableHead label="จัดส่งโดย" sortKey="deliveryBy" currentSort={requestSort} onSort={(k) => toggleSort(k, setRequestSort)} />
                    <SortableHead label="วันที่" sortKey="deliveryDate" currentSort={requestSort} onSort={(k) => toggleSort(k, setRequestSort)} />
                    <SortableHead label="สถานที่" sortKey="deliveryLocation" currentSort={requestSort} onSort={(k) => toggleSort(k, setRequestSort)} />
                    <SortableHead label="สถานะ" sortKey="status" currentSort={requestSort} onSort={(k) => toggleSort(k, setRequestSort)} />
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRequests.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.id}</TableCell>
                      <TableCell>{r.customerLineName}</TableCell>
                      <TableCell>{r.product}</TableCell>
                      <TableCell>{r.deliveryBy}</TableCell>
                      <TableCell>{r.deliveryDate}</TableCell>
                      <TableCell>{r.deliveryLocation}</TableCell>
                      <TableCell><Badge variant={getStatusColor(r.status)}>{r.status}</Badge></TableCell>
                      <TableCell>
                        {r.status === "รออนุมัติ" ? (
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(r.id)}><Check className="h-4 w-4 mr-1" /> อนุมัติ</Button>
                            <Button size="sm" className="bg-[#CE3175] hover:bg-[#b5295f] text-white" onClick={() => handleReject(r.id)}><X className="h-4 w-4 mr-1" /> ไม่อนุมัติ</Button>
                          </div>
                        ) : <span className="text-sm text-muted-foreground">-</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== Tab: บันทึกการใช้รถ ===== */}
        <TabsContent value="usage-log" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <Card key={v.id} className="cursor-pointer hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: v.status === "พร้อมใช้" ? "#6FB98F" : v.status === "กำลังใช้งาน" ? "#6C9FCE" : "#d97706" }} onClick={() => setViewingVehicle(v)}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Car className="w-5 h-5" /> {v.name}</CardTitle>
                    {getVehicleStatusBadge(v.status)}
                  </div>
                  <CardDescription>{v.licensePlate}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">ประเภท:</span><span className="font-medium">{v.type}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">เลขไมล์:</span><span className="font-medium">{v.currentMileage.toLocaleString()} กม.</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">บันทึก:</span><span className="font-medium">{v.usageLogs.length} รายการ</span></div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); setViewingVehicle(v); }}><Eye className="w-3 h-3 mr-1" /> ดูประวัติ</Button>
                    <Button size="sm" className="flex-1 bg-[#1B3A5C] hover:bg-[#152d49] text-white" onClick={(e) => { e.stopPropagation(); openAddLog(v); }}><Plus className="w-3 h-3 mr-1" /> เพิ่มบันทึก</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {viewingVehicle && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Car className="w-5 h-5" /> ประวัติการใช้รถ: {viewingVehicle.name}</CardTitle>
                    <CardDescription>{viewingVehicle.licensePlate} • ไมล์: {vehicles.find(v => v.id === viewingVehicle.id)?.currentMileage.toLocaleString()} กม.</CardDescription>
                  </div>
                  <Button className="bg-[#1B3A5C] hover:bg-[#152d49] text-white" onClick={() => openAddLog(viewingVehicle)}><Plus className="w-4 h-4 mr-2" /> เพิ่มบันทึก</Button>
                </div>
              </CardHeader>
              <CardContent>
                {sortedLogs.length === 0 ? <p className="text-center text-muted-foreground py-8">ยังไม่มีบันทึกการใช้รถ</p> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHead label="วันที่" sortKey="date" currentSort={logSort} onSort={(k) => toggleSort(k, setLogSort)} />
                        <SortableHead label="ผู้ขับ" sortKey="driver" currentSort={logSort} onSort={(k) => toggleSort(k, setLogSort)} />
                        <SortableHead label="จุดหมาย" sortKey="destination" currentSort={logSort} onSort={(k) => toggleSort(k, setLogSort)} />
                        <SortableHead label="วัตถุประสงค์" sortKey="purpose" currentSort={logSort} onSort={(k) => toggleSort(k, setLogSort)} />
                        <SortableHead label="ไมล์เริ่ม" sortKey="mileageStart" currentSort={logSort} onSort={(k) => toggleSort(k, setLogSort)} className="text-right" />
                        <SortableHead label="ไมล์สิ้นสุด" sortKey="mileageEnd" currentSort={logSort} onSort={(k) => toggleSort(k, setLogSort)} className="text-right" />
                        <TableHead className="text-right">ระยะทาง</TableHead>
                        <SortableHead label="น้ำมัน (ลิตร)" sortKey="fuelAdded" currentSort={logSort} onSort={(k) => toggleSort(k, setLogSort)} className="text-right" />
                        <SortableHead label="ค่าน้ำมัน" sortKey="fuelCost" currentSort={logSort} onSort={(k) => toggleSort(k, setLogSort)} className="text-right" />
                        <TableHead>หมายเหตุ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">{log.date}</TableCell>
                          <TableCell className="font-medium">{log.driver}</TableCell>
                          <TableCell>{log.destination}</TableCell>
                          <TableCell>{log.purpose}</TableCell>
                          <TableCell className="text-right">{log.mileageStart.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{log.mileageEnd.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-medium">{(log.mileageEnd - log.mileageStart).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{log.fuelAdded > 0 ? log.fuelAdded : "-"}</TableCell>
                          <TableCell className="text-right">{log.fuelCost > 0 ? `฿${log.fuelCost.toLocaleString()}` : "-"}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{log.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell colSpan={6} className="text-right">รวม</TableCell>
                        <TableCell className="text-right">{sortedLogs.reduce((s, l) => s + (l.mileageEnd - l.mileageStart), 0).toLocaleString()} กม.</TableCell>
                        <TableCell className="text-right">{sortedLogs.reduce((s, l) => s + l.fuelAdded, 0)} ลิตร</TableCell>
                        <TableCell className="text-right">฿{sortedLogs.reduce((s, l) => s + l.fuelCost, 0).toLocaleString()}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ===== Tab: สรุปค่าน้ำมัน ===== */}
        <TabsContent value="fuel-summary" className="space-y-6">
          {/* Overall Fuel Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4" style={{ borderLeftColor: "#1B3A5C" }}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">ค่าน้ำมันรวมทั้งหมด</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-[#1B3A5C]">฿{perVehicleMonthlySummary.reduce((s, v) => s + v.totalCost, 0).toLocaleString()}</div></CardContent>
            </Card>
            <Card className="border-l-4" style={{ borderLeftColor: "#6FB98F" }}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">น้ำมันรวม (ลิตร)</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-[#6FB98F]">{perVehicleMonthlySummary.reduce((s, v) => s + v.totalFuel, 0).toLocaleString()} ลิตร</div></CardContent>
            </Card>
            <Card className="border-l-4" style={{ borderLeftColor: "#CE3175" }}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">ระยะทางรวม</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-[#CE3175]">{perVehicleMonthlySummary.reduce((s, v) => s + v.totalDistance, 0).toLocaleString()} กม.</div></CardContent>
            </Card>
          </div>

          {/* Stacked Bar Chart - All Vehicles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> กราฟแนวโน้มค่าน้ำมันรายเดือน (ทุกคัน)</CardTitle>
              <CardDescription>เปรียบเทียบค่าน้ำมันแต่ละคันรายเดือน</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={monthlyFuelData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis tickFormatter={(v) => `฿${v.toLocaleString()}`} fontSize={12} />
                  <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} />
                  <Legend />
                  {vehicles.map((v, i) => (
                    <Bar key={v.id} dataKey={v.name} stackId="fuel" fill={chartColors[i % chartColors.length]} radius={i === vehicles.length - 1 ? [4, 4, 0, 0] : undefined} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Per-Vehicle Detail Cards with Line Chart */}
          {perVehicleMonthlySummary.filter(p => p.months.length > 0).map((pv, idx) => (
            <Card key={pv.vehicle.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Car className="w-5 h-5" /> {pv.vehicle.name}</CardTitle>
                    <CardDescription>{pv.vehicle.licensePlate} • รวม ฿{pv.totalCost.toLocaleString()} • {pv.totalFuel} ลิตร • {pv.totalDistance.toLocaleString()} กม.</CardDescription>
                  </div>
                  {getVehicleStatusBadge(pv.vehicle.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={pv.months}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={11} />
                    <YAxis tickFormatter={(v) => `฿${v.toLocaleString()}`} fontSize={11} />
                    <Tooltip formatter={(value: number, name: string) => name === "cost" ? `฿${value.toLocaleString()}` : value.toLocaleString()} />
                    <Legend />
                    <Line type="monotone" dataKey="cost" name="ค่าน้ำมัน (฿)" stroke={chartColors[idx % chartColors.length]} strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="distance" name="ระยะทาง (กม.)" stroke="#6C9FCE" strokeWidth={2} dot={{ r: 4 }} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เดือน</TableHead>
                      <TableHead className="text-right">จำนวนเที่ยว</TableHead>
                      <TableHead className="text-right">ระยะทาง (กม.)</TableHead>
                      <TableHead className="text-right">น้ำมัน (ลิตร)</TableHead>
                      <TableHead className="text-right">ค่าน้ำมัน (฿)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pv.months.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell className="font-medium">{m.month}</TableCell>
                        <TableCell className="text-right">{m.trips}</TableCell>
                        <TableCell className="text-right">{m.distance.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{m.fuel}</TableCell>
                        <TableCell className="text-right font-semibold">฿{m.cost.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>รวม</TableCell>
                      <TableCell className="text-right">{pv.months.reduce((s, m) => s + m.trips, 0)}</TableCell>
                      <TableCell className="text-right">{pv.totalDistance.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{pv.totalFuel}</TableCell>
                      <TableCell className="text-right">฿{pv.totalCost.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ===== Tab: จัดการข้อมูลรถ ===== */}
        <TabsContent value="manage-vehicles" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2 bg-[#1B3A5C] hover:bg-[#152d49] text-white" onClick={openAddVehicle}><Plus className="h-4 w-4" /> เพิ่มรถใหม่</Button>
          </div>
          <Card>
            <CardHeader><CardTitle>รายการรถทั้งหมด ({vehicles.length} คัน)</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัส</TableHead>
                    <TableHead>ชื่อรถ</TableHead>
                    <TableHead>ทะเบียน</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead className="text-right">เลขไมล์</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">บันทึกใช้งาน</TableHead>
                    <TableHead>การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium font-mono">{v.id}</TableCell>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell>{v.licensePlate}</TableCell>
                      <TableCell>{v.type}</TableCell>
                      <TableCell className="text-right">{v.currentMileage.toLocaleString()} กม.</TableCell>
                      <TableCell>{getVehicleStatusBadge(v.status)}</TableCell>
                      <TableCell className="text-right">{v.usageLogs.length} รายการ</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEditVehicle(v)}><Pencil className="w-3 h-3 mr-1" /> แก้ไข</Button>
                          <Select value={v.status} onValueChange={(val) => { setVehicles(prev => prev.map(veh => veh.id === v.id ? { ...veh, status: val as Vehicle["status"] } : veh)); toast({ title: "เปลี่ยนสถานะสำเร็จ", description: `${v.name} → ${val}` }); }}>
                            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="พร้อมใช้">พร้อมใช้</SelectItem>
                              <SelectItem value="กำลังใช้งาน">กำลังใช้งาน</SelectItem>
                              <SelectItem value="ซ่อมบำรุง">ซ่อมบำรุง</SelectItem>
                            </SelectContent>
                          </Select>
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

      {/* ===== DRAWER: สร้างคำขอใช้รถ ===== */}
      <Sheet open={isDrawerOpen} onOpenChange={(open) => handleDrawerClose(open, setIsDrawerOpen)}>
        <SheetContent side="left" className={drawerContentClass} onInteractOutside={(e) => { if (formDirty) { e.preventDefault(); if (window.confirm("คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหรือไม่?")) { setIsDrawerOpen(false); setFormDirty(false); } } }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: "#1B3A5C" }}>
            <div><SheetTitle className="text-white text-lg font-bold">จัดการรายการคำขอใช้รถ</SheetTitle><SheetDescription className="text-white/70 text-sm">สถานะ: สร้างใหม่</SheetDescription></div>
            <button onClick={() => handleDrawerClose(false, setIsDrawerOpen)} className="rounded-full p-1.5 hover:bg-white/20 transition-colors"><X className="w-5 h-5 text-white" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 vehicle-drawer-scroll">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1B3A5C] uppercase tracking-wide border-b border-[#1B3A5C]/20 pb-2">ข้อมูลลูกค้าและสินค้า</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>ชื่อ Line ลูกค้า</Label><Input className="focus-visible:ring-[#1B3A5C]" value={formData.customerLineName} onChange={(e) => { setFormData({ ...formData, customerLineName: e.target.value }); setFormDirty(true); }} required /></div>
                <div className="space-y-2"><Label>สินค้า</Label><Input className="focus-visible:ring-[#1B3A5C]" value={formData.product} onChange={(e) => { setFormData({ ...formData, product: e.target.value }); setFormDirty(true); }} required /></div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1B3A5C] uppercase tracking-wide border-b border-[#1B3A5C]/20 pb-2">ข้อมูลการจัดส่ง</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>จัดส่งโดย</Label><Input className="focus-visible:ring-[#1B3A5C]" value={formData.deliveryBy} onChange={(e) => { setFormData({ ...formData, deliveryBy: e.target.value }); setFormDirty(true); }} required /></div>
                <div className="space-y-2"><Label>วันที่จัดส่ง</Label><Input type="date" className="focus-visible:ring-[#1B3A5C]" value={formData.deliveryDate} onChange={(e) => { setFormData({ ...formData, deliveryDate: e.target.value }); setFormDirty(true); }} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>สถานที่จัดส่ง</Label><Input className="focus-visible:ring-[#1B3A5C]" value={formData.deliveryLocation} onChange={(e) => { setFormData({ ...formData, deliveryLocation: e.target.value }); setFormDirty(true); }} required /></div>
                <div className="space-y-2"><Label>ที่อยู่</Label><Textarea className="focus-visible:ring-[#1B3A5C] min-h-[80px]" value={formData.address} onChange={(e) => { setFormData({ ...formData, address: e.target.value }); setFormDirty(true); }} required /></div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1B3A5C] uppercase tracking-wide border-b border-[#1B3A5C]/20 pb-2">หมายเหตุและเอกสาร</h3>
              <div className="space-y-2"><Label>หมายเหตุ</Label><Textarea className="focus-visible:ring-[#1B3A5C]" placeholder="เช่น มีใบเสร็จ / ไม่มีใบเสร็จ" value={formData.notes} onChange={(e) => { setFormData({ ...formData, notes: e.target.value }); setFormDirty(true); }} /></div>
              <div className="space-y-2">
                <Label>แนบรูปภาพ</Label>
                <div className="flex items-center gap-4"><Input type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer" /><Upload className="h-5 w-5 text-muted-foreground" /></div>
                {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="w-32 h-32 object-cover rounded-md border mt-2" />}
              </div>
            </div>
          </div>
          <div className="border-t bg-background px-6 py-4 flex justify-end gap-3 shrink-0">
            <Button type="button" onClick={() => handleDrawerClose(false, setIsDrawerOpen)} className="text-white hover:opacity-90" style={{ backgroundColor: "#CE3175" }}><X className="w-4 h-4 mr-2" /> ยกเลิก</Button>
            <Button type="button" onClick={handleSubmit as any} className="text-white hover:opacity-90" style={{ backgroundColor: "#6FB98F" }}><Check className="w-4 h-4 mr-2" /> บันทึก</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== DRAWER: เพิ่มบันทึกการใช้รถ ===== */}
      <Sheet open={showLogDrawer} onOpenChange={(open) => handleDrawerClose(open, setShowLogDrawer)}>
        <SheetContent side="left" className={drawerContentClass} onInteractOutside={(e) => { if (formDirty) { e.preventDefault(); if (window.confirm("คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหรือไม่?")) { setShowLogDrawer(false); setFormDirty(false); } } }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: "#1B3A5C" }}>
            <div><SheetTitle className="text-white text-lg font-bold">เพิ่มบันทึกการใช้รถ</SheetTitle><SheetDescription className="text-white/70 text-sm">{selectedVehicle?.name} ({selectedVehicle?.licensePlate})</SheetDescription></div>
            <button onClick={() => handleDrawerClose(false, setShowLogDrawer)} className="rounded-full p-1.5 hover:bg-white/20 transition-colors"><X className="w-5 h-5 text-white" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 vehicle-drawer-scroll">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1B3A5C] uppercase tracking-wide border-b border-[#1B3A5C]/20 pb-2">ข้อมูลการเดินทาง</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>วันที่</Label><Input type="date" className="focus-visible:ring-[#1B3A5C]" value={logForm.date} onChange={(e) => { setLogForm({ ...logForm, date: e.target.value }); setFormDirty(true); }} required /></div>
                <div className="space-y-2"><Label>ผู้ขับ</Label><Input className="focus-visible:ring-[#1B3A5C]" value={logForm.driver} onChange={(e) => { setLogForm({ ...logForm, driver: e.target.value }); setFormDirty(true); }} placeholder="ชื่อผู้ขับรถ" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>จุดหมายปลายทาง</Label><Input className="focus-visible:ring-[#1B3A5C]" value={logForm.destination} onChange={(e) => { setLogForm({ ...logForm, destination: e.target.value }); setFormDirty(true); }} required /></div>
                <div className="space-y-2"><Label>วัตถุประสงค์</Label><Input className="focus-visible:ring-[#1B3A5C]" value={logForm.purpose} onChange={(e) => { setLogForm({ ...logForm, purpose: e.target.value }); setFormDirty(true); }} /></div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1B3A5C] uppercase tracking-wide border-b border-[#1B3A5C]/20 pb-2">ข้อมูลเลขไมล์</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>ไมล์เริ่มต้น</Label><Input type="number" className="focus-visible:ring-[#1B3A5C]" value={logForm.mileageStart} onChange={(e) => { setLogForm({ ...logForm, mileageStart: Number(e.target.value) }); setFormDirty(true); }} /></div>
                <div className="space-y-2"><Label>ไมล์สิ้นสุด</Label><Input type="number" className="focus-visible:ring-[#1B3A5C]" value={logForm.mileageEnd} onChange={(e) => { setLogForm({ ...logForm, mileageEnd: Number(e.target.value) }); setFormDirty(true); }} /></div>
              </div>
              {logForm.mileageEnd > logForm.mileageStart && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm flex items-center gap-2"><Car className="w-4 h-4 text-[#1B3A5C]" /><span>ระยะทาง: <strong>{(logForm.mileageEnd - logForm.mileageStart).toLocaleString()} กม.</strong></span></div>
              )}
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1B3A5C] uppercase tracking-wide border-b border-[#1B3A5C]/20 pb-2">ข้อมูลน้ำมัน</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>เติมน้ำมัน (ลิตร)</Label><Input type="number" className="focus-visible:ring-[#1B3A5C]" value={logForm.fuelAdded} onChange={(e) => { setLogForm({ ...logForm, fuelAdded: Number(e.target.value) }); setFormDirty(true); }} /></div>
                <div className="space-y-2"><Label>ค่าน้ำมัน (฿)</Label><Input type="number" className="focus-visible:ring-[#1B3A5C]" value={logForm.fuelCost} onChange={(e) => { setLogForm({ ...logForm, fuelCost: Number(e.target.value) }); setFormDirty(true); }} /></div>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1B3A5C] uppercase tracking-wide border-b border-[#1B3A5C]/20 pb-2">หมายเหตุ</h3>
              <Textarea className="focus-visible:ring-[#1B3A5C]" value={logForm.notes} onChange={(e) => { setLogForm({ ...logForm, notes: e.target.value }); setFormDirty(true); }} placeholder="รายละเอียดเพิ่มเติม" />
            </div>
          </div>
          <div className="border-t bg-background px-6 py-4 flex justify-end gap-3 shrink-0">
            <Button type="button" onClick={() => handleDrawerClose(false, setShowLogDrawer)} className="text-white hover:opacity-90" style={{ backgroundColor: "#CE3175" }}><X className="w-4 h-4 mr-2" /> ยกเลิก</Button>
            <Button type="button" onClick={handleAddLog as any} className="text-white hover:opacity-90" style={{ backgroundColor: "#6FB98F" }}><Check className="w-4 h-4 mr-2" /> บันทึก</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ===== DRAWER: เพิ่ม/แก้ไขรถ ===== */}
      <Sheet open={showVehicleDrawer} onOpenChange={(open) => handleDrawerClose(open, setShowVehicleDrawer)}>
        <SheetContent side="left" className={drawerContentClass} onInteractOutside={(e) => { if (formDirty) { e.preventDefault(); if (window.confirm("คุณมีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดหรือไม่?")) { setShowVehicleDrawer(false); setFormDirty(false); } } }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: "#1B3A5C" }}>
            <div><SheetTitle className="text-white text-lg font-bold">{editingVehicle ? "แก้ไขข้อมูลรถ" : "เพิ่มรถใหม่"}</SheetTitle><SheetDescription className="text-white/70 text-sm">{editingVehicle ? `${editingVehicle.name} (${editingVehicle.licensePlate})` : "กรอกข้อมูลรถคันใหม่"}</SheetDescription></div>
            <button onClick={() => handleDrawerClose(false, setShowVehicleDrawer)} className="rounded-full p-1.5 hover:bg-white/20 transition-colors"><X className="w-5 h-5 text-white" /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 vehicle-drawer-scroll">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1B3A5C] uppercase tracking-wide border-b border-[#1B3A5C]/20 pb-2">ข้อมูลรถ</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>ชื่อรถ</Label><Input className="focus-visible:ring-[#1B3A5C]" value={vehicleForm.name} onChange={(e) => { setVehicleForm({ ...vehicleForm, name: e.target.value }); setFormDirty(true); }} placeholder="เช่น รถกระบะ 3" required /></div>
                <div className="space-y-2"><Label>ทะเบียนรถ</Label><Input className="focus-visible:ring-[#1B3A5C]" value={vehicleForm.licensePlate} onChange={(e) => { setVehicleForm({ ...vehicleForm, licensePlate: e.target.value }); setFormDirty(true); }} placeholder="เช่น กข 1234 กรุงเทพ" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ประเภทรถ</Label>
                  <Select value={vehicleForm.type} onValueChange={(v) => { setVehicleForm({ ...vehicleForm, type: v }); setFormDirty(true); }}>
                    <SelectTrigger className="focus:ring-[#1B3A5C]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="กระบะ">กระบะ</SelectItem>
                      <SelectItem value="รถตู้">รถตู้</SelectItem>
                      <SelectItem value="รถบรรทุก">รถบรรทุก</SelectItem>
                      <SelectItem value="รถเก๋ง">รถเก๋ง</SelectItem>
                      <SelectItem value="มอเตอร์ไซค์">มอเตอร์ไซค์</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>เลขไมล์ปัจจุบัน</Label><Input type="number" className="focus-visible:ring-[#1B3A5C]" value={vehicleForm.currentMileage} onChange={(e) => { setVehicleForm({ ...vehicleForm, currentMileage: Number(e.target.value) }); setFormDirty(true); }} /></div>
              </div>
              <div className="space-y-2">
                <Label>สถานะ</Label>
                <Select value={vehicleForm.status} onValueChange={(v) => { setVehicleForm({ ...vehicleForm, status: v as Vehicle["status"] }); setFormDirty(true); }}>
                  <SelectTrigger className="focus:ring-[#1B3A5C]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="พร้อมใช้">พร้อมใช้</SelectItem>
                    <SelectItem value="กำลังใช้งาน">กำลังใช้งาน</SelectItem>
                    <SelectItem value="ซ่อมบำรุง">ซ่อมบำรุง</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="border-t bg-background px-6 py-4 flex justify-end gap-3 shrink-0">
            <Button type="button" onClick={() => handleDrawerClose(false, setShowVehicleDrawer)} className="text-white hover:opacity-90" style={{ backgroundColor: "#CE3175" }}><X className="w-4 h-4 mr-2" /> ยกเลิก</Button>
            <Button type="button" onClick={handleSaveVehicle} className="text-white hover:opacity-90" style={{ backgroundColor: "#6FB98F" }}><Check className="w-4 h-4 mr-2" /> {editingVehicle ? "บันทึกการแก้ไข" : "เพิ่มรถ"}</Button>
          </div>
        </SheetContent>
      </Sheet>

      <style>{`
        .vehicle-drawer { box-shadow: 8px 0 30px rgba(27, 58, 92, 0.15); }
        .vehicle-drawer-scroll::-webkit-scrollbar { width: 6px; }
        .vehicle-drawer-scroll::-webkit-scrollbar-track { background: transparent; }
        .vehicle-drawer-scroll::-webkit-scrollbar-thumb { background-color: rgba(108, 159, 206, 0.4); border-radius: 10px; }
        .vehicle-drawer-scroll::-webkit-scrollbar-thumb:hover { background-color: rgba(108, 159, 206, 0.7); }
      `}</style>
    </div>
  );
}
