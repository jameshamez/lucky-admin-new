import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  Search,
  Package,
  AlertTriangle,
  Plus,
  Edit,
  X,
  FileText,
  Download,
  Filter,
  Eye,
  Pencil,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// API Service
import { materialStockService } from "@/services/materialStockService";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// Pagination component
function PaginationControls({ currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }: {
  currentPage: number; totalPages: number; totalItems: number; pageSize: number;
  onPageChange: (p: number) => void; onPageSizeChange: (s: number) => void;
}) {
  const pages = useMemo(() => {
    const arr: number[] = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>แสดง</span>
        <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
          <SelectTrigger className="w-[70px] h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((s) => (<SelectItem key={s} value={String(s)}>{s}</SelectItem>))}
          </SelectContent>
        </Select>
        <span>จาก {totalItems} รายการ</span>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
        {pages.map((p) => (
          <Button key={p} variant={p === currentPage ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => onPageChange(p)}>{p}</Button>
        ))}
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

export default function MaterialStock() {
  const [activeTab, setActiveTab] = useState("history");

  // Data states
  const [materials, setMaterials] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uniqueRequesters, setUniqueRequesters] = useState<string[]>([]);

  // Request History states
  const [searchRequest, setSearchRequest] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("all");
  const [filterRequester, setFilterRequester] = useState("all");
  const [isRequestDrawerOpen, setIsRequestDrawerOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    request_date: new Date().toISOString().split('T')[0],
    material_name: "",
    qty: 0,
    requester: "",
    remark: ""
  });

  // View/Edit Request states
  const [isViewRequestOpen, setIsViewRequestOpen] = useState(false);
  const [isEditRequestOpen, setIsEditRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [editRequestForm, setEditRequestForm] = useState({
    request_date: "",
    material_name: "",
    qty: 0,
    requester: "",
    remark: ""
  });

  // Stock states
  const [searchStock, setSearchStock] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isAdjustDrawerOpen, setIsAdjustDrawerOpen] = useState(false);
  const [isAddMaterialDrawerOpen, setIsAddMaterialDrawerOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [adjustForm, setAdjustForm] = useState({
    adjustType: "set",
    newQty: 0,
    adjustAmount: 0,
    note: ""
  });
  const [addMaterialForm, setAddMaterialForm] = useState({
    material_name: "",
    unit: "",
    current_qty: 0,
    min_qty: 0,
    note: ""
  });

  // View/Edit Stock states
  const [isViewStockOpen, setIsViewStockOpen] = useState(false);
  const [isEditStockOpen, setIsEditStockOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<any>(null);
  const [editStockForm, setEditStockForm] = useState({
    material_name: "",
    unit: "",
    current_qty: 0,
    min_qty: 0,
    note: ""
  });

  // Confirmation dialog states
  const [confirmEditRequest, setConfirmEditRequest] = useState(false);
  const [confirmEditStock, setConfirmEditStock] = useState(false);

  // Pagination states
  const [reqPage, setReqPage] = useState(1);
  const [reqPageSize, setReqPageSize] = useState(10);
  const [stockPage, setStockPage] = useState(1);
  const [stockPageSize, setStockPageSize] = useState(10);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      const materialsRes = await materialStockService.getMaterials({ limit: 1000 });
      if (materialsRes.status === 'success') {
        setMaterials(materialsRes.data);
      }

      const requestsRes = await materialStockService.getRequests({ limit: 1000 });
      if (requestsRes.status === 'success') {
        setRequests(requestsRes.data);
        // Extract unique requesters
        const requesters = Array.from(new Set(requestsRes.data.map((r: any) => r.requester))) as string[];
        setUniqueRequesters(requesters);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter requests
  const filteredRequests = useMemo(() => requests.filter(req => {
    const matchesSearch = (req.material_name || "").toLowerCase().includes(searchRequest.toLowerCase()) ||
      (req.requester || "").toLowerCase().includes(searchRequest.toLowerCase());
    const matchesMaterial = filterMaterial === "all" || req.material_name === filterMaterial;
    const matchesRequester = filterRequester === "all" || req.requester === filterRequester;
    return matchesSearch && matchesMaterial && matchesRequester;
  }), [requests, searchRequest, filterMaterial, filterRequester]);

  // Filter stock
  const filteredStock = useMemo(() => materials.filter(item => {
    const matchesSearch = (item.material_name || "").toLowerCase().includes(searchStock.toLowerCase());
    let matchesStatus = true;
    if (filterStatus === "low") matchesStatus = item.current_qty <= item.min_qty && item.current_qty > 0;
    if (filterStatus === "out") matchesStatus = item.current_qty === 0;
    return matchesSearch && matchesStatus;
  }), [materials, searchStock, filterStatus]);

  // Reset page on filter change
  useEffect(() => { setReqPage(1); }, [searchRequest, filterMaterial, filterRequester]);
  useEffect(() => { setStockPage(1); }, [searchStock, filterStatus]);

  // Paginated data
  const reqTotalPages = Math.max(1, Math.ceil(filteredRequests.length / reqPageSize));
  const paginatedRequests = useMemo(() => {
    const start = (reqPage - 1) * reqPageSize;
    return filteredRequests.slice(start, start + reqPageSize);
  }, [filteredRequests, reqPage, reqPageSize]);

  const stockTotalPages = Math.max(1, Math.ceil(filteredStock.length / stockPageSize));
  const paginatedStock = useMemo(() => {
    const start = (stockPage - 1) * stockPageSize;
    return filteredStock.slice(start, start + stockPageSize);
  }, [filteredStock, stockPage, stockPageSize]);

  // Calculate stats
  const totalMaterials = materials.length;
  const lowStockCount = materials.filter(m => m.current_qty <= m.min_qty && m.current_qty > 0).length;
  const outOfStockCount = materials.filter(m => m.current_qty === 0).length;

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getStockColor = (current: number, min: number) => {
    if (current === 0) return "text-red-600";
    if (current <= min) return "text-amber-600";
    return "text-green-600";
  };

  const getStockBadge = (current: number, min: number) => {
    if (current === 0) return <Badge variant="destructive">หมดสต็อก</Badge>;
    if (current <= min) return <Badge className="bg-amber-500">ถึงจุดต่ำสุด</Badge>;
    return <Badge variant="secondary">ปกติ</Badge>;
  };

  // === Request handlers ===
  const handleOpenRequestDrawer = () => {
    setRequestForm({ request_date: new Date().toISOString().split('T')[0], material_name: "", qty: 0, requester: "", remark: "" });
    setIsRequestDrawerOpen(true);
  };

  const handleSubmitRequest = async () => {
    if (!requestForm.material_name || requestForm.qty <= 0 || !requestForm.requester.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsSaving(true);
    try {
      const res = await materialStockService.createRequest(requestForm);
      if (res.status === 'success') {
        toast.success("บันทึกการเบิกสำเร็จ");
        if (res.data.lowStock) {
          toast.warning("วัสดุถึงจุดสั่งซื้อขั้นต่ำแล้ว");
        }
        setIsRequestDrawerOpen(false);
        await fetchData(); // Reload data
      } else {
        toast.error(res.message || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      if (confirm("คุณต้องการยกเลิกรายการนี้ใช่หรือไม่?")) {
        const res = await materialStockService.cancelRequest(parseInt(requestId));
        if (res.status === 'success') {
          toast.success("ยกเลิกรายการสำเร็จ คืนสต็อกแล้ว");
          fetchData();
        } else {
          toast.error(res.message || "ไม่สามารถยกเลิกรายการได้");
        }
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setIsViewRequestOpen(true);
  };

  const handleEditRequest = (request: any) => {
    setSelectedRequest(request);
    setEditRequestForm({
      request_date: request.request_date,
      material_name: request.material_name,
      qty: request.qty,
      requester: request.requester,
      remark: request.remark
    });
    setIsEditRequestOpen(true);
  };

  const handleSubmitEditRequest = () => {
    if (!editRequestForm.material_name || editRequestForm.qty <= 0 || !editRequestForm.requester.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    setConfirmEditRequest(true);
  };

  const confirmSaveEditRequest = async () => {
    setIsSaving(true);
    try {
      const res = await materialStockService.updateRequest(selectedRequest.id, editRequestForm);
      if (res.status === 'success') {
        toast.success("แก้ไขรายการเบิกสำเร็จ");
        setIsEditRequestOpen(false);
        setConfirmEditRequest(false);
        await fetchData(); // Refresh both requests and stock
      } else {
        toast.error(res.message || "ไม่สามารถแก้ไขรายการได้");
      }
    } catch (error) {
      console.error("Edit request error:", error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsSaving(false);
    }
  };

  // === Stock handlers ===
  const handleOpenAdjustDrawer = (material: any) => {
    setSelectedMaterial(material);
    setAdjustForm({ adjustType: "set", newQty: material.current_qty, adjustAmount: 0, note: "" });
    setIsAdjustDrawerOpen(true);
  };

  const handleSubmitAdjust = async () => {
    setIsSaving(true);
    try {
      let amount = adjustForm.adjustAmount;
      if (adjustForm.adjustType === 'set') {
        amount = adjustForm.newQty;
      }

      const payload = {
        adjustType: adjustForm.adjustType,
        amount: amount,
        note: adjustForm.note
      };

      const res = await materialStockService.adjustStock(selectedMaterial.id, payload);
      if (res.status === 'success') {
        toast.success("อัปเดตสต็อกแล้ว");
        setIsAdjustDrawerOpen(false);
        await fetchData();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitAddMaterial = async () => {
    if (!addMaterialForm.material_name || !addMaterialForm.unit) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        material_name: addMaterialForm.material_name,
        unit: addMaterialForm.unit,
        current_qty: addMaterialForm.current_qty,
        min_qty: addMaterialForm.min_qty,
        note: addMaterialForm.note
      };

      const res = await materialStockService.createMaterial(payload);
      if (res.status === 'success') {
        toast.success("เพิ่มวัสดุใหม่สำเร็จ");
        setIsAddMaterialDrawerOpen(false);
        await fetchData();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewStock = (item: any) => {
    setSelectedStockItem(item);
    setIsViewStockOpen(true);
  };

  const handleEditStock = (item: any) => {
    setSelectedStockItem(item);
    setEditStockForm({
      material_name: item.material_name,
      unit: item.unit,
      current_qty: item.current_qty,
      min_qty: item.min_qty,
      note: item.note
    });
    setIsEditStockOpen(true);
  };

  const handleSubmitEditStock = () => {
    setConfirmEditStock(true);
  };

  const confirmSaveEditStock = async () => {
    setIsSaving(true);
    try {
      const res = await materialStockService.updateMaterial(selectedStockItem.id, editStockForm);
      if (res.status === 'success') {
        toast.success("แก้ไขข้อมูลวัสดุสำเร็จ");
        setIsEditStockOpen(false);
        setConfirmEditStock(false);
        await fetchData();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCSV = (type: string) => {
    const dataToExport = type === 'history' ? filteredRequests : filteredStock;
    if (dataToExport.length === 0) {
      toast.error("ไม่มีข้อมูลสำหรับการดาวน์โหลด");
      return;
    }

    let csvContent = "\uFEFF"; // Add BOM for Excel Thai support

    if (type === 'history') {
      // Header
      csvContent += "วันที่เบิก,ประเภทวัสดุ,จำนวน,หน่วย,ผู้เบิก,หมายเหตุ\n";
      // Rows
      dataToExport.forEach(req => {
        const unit = materials.find(m => m.material_name === req.material_name)?.unit || "";
        // Handle potential commas in fields by wrapping in quotes
        const row = [
          req.request_date,
          `"${(req.material_name || "").replace(/"/g, '""')}"`,
          req.qty,
          `"${(unit || "").replace(/"/g, '""')}"`,
          `"${(req.requester || "").replace(/"/g, '""')}"`,
          `"${(req.remark || "").replace(/"/g, '""')}"`
        ];
        csvContent += row.join(",") + "\n";
      });
    } else {
      // Header
      csvContent += "ชื่อวัสดุ,คงเหลือ,หน่วย,จุดสั่งซื้อต่ำสุด,หมายเหตุ,อัปเดตล่าสุด\n";
      // Rows
      dataToExport.forEach(item => {
        const row = [
          `"${(item.material_name || "").replace(/"/g, '""')}"`,
          item.current_qty,
          `"${(item.unit || "").replace(/"/g, '""')}"`,
          item.min_qty,
          `"${(item.note || "").replace(/"/g, '""')}"`,
          item.updated_at
        ];
        csvContent += row.join(",") + "\n";
      });
    }

    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${type === 'history' ? 'ประวัติการเบิก' : 'สต็อกวัสดุ'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`ดาวน์โหลดไฟล์สำเร็จ`);
    } catch (error) {
      console.error("Export CSV error:", error);
      toast.error("ไม่สามารถดาวน์โหลดไฟล์ได้");
    }
  };

  const handleMaterialSelect = (materialName: string) => {
    const option = materials.find(m => m.material_name === materialName);
    if (option) {
      setRequestForm({ ...requestForm, material_name: materialName });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">การเบิกสินค้า และสต็อกสินค้า</h1>
          <p className="text-muted-foreground">จัดการการเบิกวัสดุและตรวจสอบสต็อก</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">การเบิกใช้ภายในแผนก</TabsTrigger>
          <TabsTrigger value="stock">สต็อกวัสดุภายในแผนก</TabsTrigger>
        </TabsList>

        {/* Tab A: Request History */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="ค้นหาวัสดุ หรือผู้เบิก..." value={searchRequest} onChange={(e) => setSearchRequest(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterMaterial} onValueChange={setFilterMaterial}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="ประเภทวัสดุ" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {materials.map(m => (<SelectItem key={m.id} value={m.material_name}>{m.material_name}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filterRequester} onValueChange={setFilterRequester}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="ผู้เบิก" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  {uniqueRequesters.map(req => (<SelectItem key={req} value={req}>{req}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportCSV('history')}>
                <Download className="w-4 h-4 mr-2" />Export CSV
              </Button>
              <Button onClick={handleOpenRequestDrawer}>
                <Plus className="w-4 h-4 mr-2" />เบิกวัสดุ
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่เบิก</TableHead>
                    <TableHead>ประเภทวัสดุ</TableHead>
                    <TableHead>จำนวน</TableHead>
                    <TableHead>ผู้เบิก</TableHead>
                    <TableHead>หมายเหตุ</TableHead>
                    <TableHead className="text-right">การกระทำ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8">กำลังโหลด...</TableCell></TableRow>
                  ) : paginatedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{formatDate(request.request_date)}</TableCell>
                      <TableCell className="font-medium">{request.material_name}</TableCell>
                      <TableCell>{request.qty} {materials.find(m => m.material_name === request.material_name)?.unit || ""}</TableCell>
                      <TableCell>{request.requester}</TableCell>
                      <TableCell className="text-muted-foreground">{request.remark || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewRequest(request)} className="text-blue-600 hover:text-blue-700">
                            <Eye className="w-4 h-4 mr-1" />ดู
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditRequest(request)} className="text-amber-600 hover:text-amber-700">
                            <Pencil className="w-4 h-4 mr-1" />แก้ไข
                          </Button>
                          {request.request_date === new Date().toISOString().split('T')[0] && (
                            <Button variant="ghost" size="sm" onClick={() => handleCancelRequest(request.id)} className="text-destructive hover:text-destructive">
                              <X className="w-4 h-4 mr-1" />ยกเลิก
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && paginatedRequests.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={reqPage} totalPages={reqTotalPages} totalItems={filteredRequests.length}
                pageSize={reqPageSize} onPageChange={setReqPage}
                onPageSizeChange={(s) => { setReqPageSize(s); setReqPage(1); }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab B: Material Stock */}
        <TabsContent value="stock" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">วัสดุทั้งหมด</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMaterials}</div>
                <p className="text-xs text-muted-foreground">รายการ</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ถึงจุดต่ำสุด</CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
                <p className="text-xs text-muted-foreground">รายการ</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">วัสดุใกล้หมด</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{outOfStockCount}</div>
                <p className="text-xs text-muted-foreground">รายการ</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="ค้นหาชื่อวัสดุ..." value={searchStock} onChange={(e) => setSearchStock(e.target.value)} className="pl-10" />
              </div>
              <div className="flex gap-1 border rounded-md p-1">
                <Button variant={filterStatus === "all" ? "secondary" : "ghost"} size="sm" onClick={() => setFilterStatus("all")}>ทั้งหมด</Button>
                <Button variant={filterStatus === "low" ? "secondary" : "ghost"} size="sm" onClick={() => setFilterStatus("low")} className="text-amber-600">ถึงจุดต่ำสุด</Button>
                <Button variant={filterStatus === "out" ? "secondary" : "ghost"} size="sm" onClick={() => setFilterStatus("out")} className="text-red-600">หมดสต็อก</Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportCSV('stock')}>
                <Download className="w-4 h-4 mr-2" />Export CSV
              </Button>
              <Button onClick={() => setIsAddMaterialDrawerOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />เพิ่มวัสดุใหม่
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วัสดุ</TableHead>
                    <TableHead>คงเหลือ</TableHead>
                    <TableHead>จุดต่ำสุด</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>หมายเหตุ</TableHead>
                    <TableHead>ปรับปรุงล่าสุด</TableHead>
                    <TableHead className="text-right">การกระทำ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8">กำลังโหลด...</TableCell></TableRow>
                  ) : paginatedStock.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.material_name}</TableCell>
                      <TableCell className={getStockColor(material.current_qty, material.min_qty)}>
                        <span className="font-semibold">{material.current_qty}</span> {material.unit}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{material.min_qty}</TableCell>
                      <TableCell>{getStockBadge(material.current_qty, material.min_qty)}</TableCell>
                      <TableCell className="text-muted-foreground">{material.note || "-"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(material.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewStock(material)} className="text-blue-600 hover:text-blue-700">
                            <Eye className="w-4 h-4 mr-1" />ดู
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditStock(material)} className="text-amber-600 hover:text-amber-700">
                            <Pencil className="w-4 h-4 mr-1" />แก้ไข
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenAdjustDrawer(material)}>
                            <Edit className="w-4 h-4 mr-1" />ปรับสต็อก
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && paginatedStock.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">ไม่พบข้อมูล</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={stockPage} totalPages={stockTotalPages} totalItems={filteredStock.length}
                pageSize={stockPageSize} onPageChange={setStockPage}
                onPageSizeChange={(s) => { setReqPageSize(s); setReqPage(1); }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* === DRAWERS === */}

      {/* Create Request Drawer */}
      <Sheet open={isRequestDrawerOpen} onOpenChange={setIsRequestDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>เบิกวัสดุ</SheetTitle>
            <SheetDescription>กรอกข้อมูลการเบิกวัสดุ</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6 overflow-y-auto max-h-[calc(100vh-120px)] px-1">
            <div>
              <Label>วันที่เบิก</Label>
              <Input type="date" value={requestForm.request_date} onChange={(e) => setRequestForm({ ...requestForm, request_date: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>ประเภทวัสดุ</Label>
              <Select value={requestForm.material_name} onValueChange={handleMaterialSelect}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="เลือกวัสดุ" /></SelectTrigger>
                <SelectContent>
                  {materials.map(m => (<SelectItem key={m.id} value={m.material_name}>{m.material_name} ({m.unit})</SelectItem>))}
                </SelectContent>
              </Select>
              {requestForm.material_name && (() => {
                const stock = materials.find(m => m.material_name === requestForm.material_name);
                const qty = stock?.current_qty ?? 0;
                const unit = stock?.unit || "";
                return (
                  <p className="mt-2 text-sm">
                    <span className="text-muted-foreground">Stock ใหญ่: </span>
                    <span className={qty > 0 ? "text-blue-600 font-semibold" : "text-red-600 font-semibold"}>{qty} {unit}</span>
                  </p>
                );
              })()}
            </div>
            <div>
              <Label>หน่วย</Label>
              <Input value={materials.find(m => m.material_name === requestForm.material_name)?.unit || ""} disabled className="mt-1 bg-muted" />
            </div>
            <div>
              <Label>จำนวนที่เบิก</Label>
              {(() => {
                const maxStock = materials.find(m => m.material_name === requestForm.material_name)?.current_qty || 0;
                const unit = materials.find(m => m.material_name === requestForm.material_name)?.unit || "";
                const isOverStock = requestForm.qty > maxStock;
                return (
                  <>
                    <Input type="number" min="1" value={requestForm.qty || ""} onChange={(e) => setRequestForm({ ...requestForm, qty: parseInt(e.target.value) || 0 })} className={`mt-1 ${isOverStock ? "border-red-500 border-2 focus-visible:ring-red-500" : ""}`} />
                    {requestForm.material_name && (
                      <p className={`text-xs mt-1 ${isOverStock ? "text-red-500" : "text-muted-foreground"}`}>เบิกได้สูงสุด: {maxStock} {unit}</p>
                    )}
                  </>
                );
              })()}
            </div>
            <div>
              <Label>ชื่อผู้เบิก</Label>
              <Select value={requestForm.requester} onValueChange={(v) => setRequestForm({ ...requestForm, requester: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="เลือกผู้เบิก" /></SelectTrigger>
                <SelectContent>
                  {uniqueRequesters.map(req => (<SelectItem key={req} value={req}>{req}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>หมายเหตุ</Label>
              <Textarea value={requestForm.remark} onChange={(e) => setRequestForm({ ...requestForm, remark: e.target.value })} className="mt-1" rows={3} />
            </div>
            {(() => {
              const maxStock = materials.find(m => m.material_name === requestForm.material_name)?.current_qty || 0;
              const isOverStock = requestForm.qty > maxStock;
              const isDisabled = isOverStock || !requestForm.material_name || requestForm.qty <= 0;
              return (
                <Button onClick={handleSubmitRequest} disabled={isDisabled} className={`w-full ${isDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"} text-white`}>
                  ยืนยันการเบิก
                </Button>
              );
            })()}
          </div>
        </SheetContent>
      </Sheet>

      {/* View Request Drawer */}
      <Sheet open={isViewRequestOpen} onOpenChange={setIsViewRequestOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-blue-600" /> รายละเอียดการเบิก</SheetTitle>
            <SheetDescription>ข้อมูลรายการเบิกวัสดุ</SheetDescription>
          </SheetHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-6 overflow-y-auto max-h-[calc(100vh-120px)] px-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">วันที่เบิก</Label>
                  <p className="font-medium mt-1">{formatDate(selectedRequest.request_date)}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">สถานะ</Label>
                  <div className="mt-1"><Badge variant="secondary">{selectedRequest.status}</Badge></div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">ประเภทวัสดุ</Label>
                <p className="font-medium mt-1">{selectedRequest.material_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">จำนวนที่เบิก</Label>
                  <p className="font-medium mt-1">{selectedRequest.qty} {materials.find(m => m.material_name === selectedRequest.material_name)?.unit}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">ผู้เบิก</Label>
                  <p className="font-medium mt-1">{selectedRequest.requester}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">หมายเหตุ</Label>
                <p className="font-medium mt-1">{selectedRequest.remark || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">วันที่สร้างรายการ</Label>
                <p className="font-medium mt-1">{formatDateTime(selectedRequest.created_at)}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Request Drawer */}
      <Sheet open={isEditRequestOpen} onOpenChange={setIsEditRequestOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Pencil className="w-5 h-5 text-amber-600" /> แก้ไขรายการเบิก</SheetTitle>
            <SheetDescription>แก้ไขข้อมูลรายการเบิกวัสดุ</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6 overflow-y-auto max-h-[calc(100vh-120px)] px-1">
            <div>
              <Label>วันที่เบิก</Label>
              <Input type="date" value={editRequestForm.request_date} onChange={(e) => setEditRequestForm({ ...editRequestForm, request_date: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>ประเภทวัสดุ</Label>
              <Select value={editRequestForm.material_name} onValueChange={(v) => setEditRequestForm({ ...editRequestForm, material_name: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="เลือกวัสดุ" /></SelectTrigger>
                <SelectContent>
                  {materials.map(m => (<SelectItem key={m.id} value={m.material_name}>{m.material_name} ({m.unit})</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>หน่วย</Label>
              <Input value={materials.find(m => m.material_name === editRequestForm.material_name)?.unit || ""} disabled className="mt-1 bg-muted" />
            </div>
            <div>
              <Label>จำนวนที่เบิก</Label>
              <Input type="number" min="1" value={editRequestForm.qty || ""} onChange={(e) => setEditRequestForm({ ...editRequestForm, qty: parseInt(e.target.value) || 0 })} className="mt-1" />
            </div>
            <div>
              <Label>ชื่อผู้เบิก</Label>
              <Select value={editRequestForm.requester} onValueChange={(v) => setEditRequestForm({ ...editRequestForm, requester: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="เลือกผู้เบิก" /></SelectTrigger>
                <SelectContent>
                  {uniqueRequesters.map(req => (<SelectItem key={req} value={req}>{req}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>หมายเหตุ</Label>
              <Textarea value={editRequestForm.remark} onChange={(e) => setEditRequestForm({ ...editRequestForm, remark: e.target.value })} className="mt-1" rows={3} />
            </div>
            <Button onClick={handleSubmitEditRequest} className="w-full">บันทึกการแก้ไข</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* View Stock Drawer */}
      <Sheet open={isViewStockOpen} onOpenChange={setIsViewStockOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Eye className="w-5 h-5 text-blue-600" /> รายละเอียดวัสดุ</SheetTitle>
            <SheetDescription>ข้อมูลวัสดุในสต็อก</SheetDescription>
          </SheetHeader>
          {selectedStockItem && (
            <div className="space-y-4 mt-6 overflow-y-auto max-h-[calc(100vh-120px)] px-1">
              <div>
                <Label className="text-muted-foreground text-xs">ชื่อวัสดุ</Label>
                <p className="font-medium mt-1 text-lg">{selectedStockItem.material_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">หน่วย</Label>
                  <p className="font-medium mt-1">{selectedStockItem.unit}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">สถานะ</Label>
                  <div className="mt-1">{getStockBadge(selectedStockItem.current_qty, selectedStockItem.min_qty)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">คงเหลือ</Label>
                  <p className={`font-semibold mt-1 text-lg ${getStockColor(selectedStockItem.current_qty, selectedStockItem.min_qty)}`}>{selectedStockItem.current_qty} {selectedStockItem.unit}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">จุดต่ำสุด</Label>
                  <p className="font-medium mt-1 text-lg">{selectedStockItem.min_qty} {selectedStockItem.unit}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">หมายเหตุ</Label>
                <p className="font-medium mt-1">{selectedStockItem.note || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">ปรับปรุงล่าสุด</Label>
                <p className="font-medium mt-1">{formatDateTime(selectedStockItem.updated_at)}</p>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Stock Drawer */}
      <Sheet open={isEditStockOpen} onOpenChange={setIsEditStockOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Pencil className="w-5 h-5 text-amber-600" /> แก้ไขข้อมูลวัสดุ</SheetTitle>
            <SheetDescription>แก้ไขรายละเอียดวัสดุในสต็อก</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6 overflow-y-auto max-h-[calc(100vh-120px)] px-1">
            <div>
              <Label>ชื่อวัสดุ</Label>
              <Input value={editStockForm.material_name} onChange={(e) => setEditStockForm({ ...editStockForm, material_name: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>หน่วยนับ</Label>
                <Input value={editStockForm.unit} onChange={(e) => setEditStockForm({ ...editStockForm, unit: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>จุดสั่งซื้อต่ำสุด</Label>
                <Input type="number" min="0" value={editStockForm.min_qty} onChange={(e) => setEditStockForm({ ...editStockForm, min_qty: parseInt(e.target.value) || 0 })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>หมายเหตุ</Label>
              <Textarea value={editStockForm.note} onChange={(e) => setEditStockForm({ ...editStockForm, note: e.target.value })} className="mt-1" rows={3} />
            </div>
            <Button onClick={handleSubmitEditStock} className="w-full">บันทึกการแก้ไข</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Adjust Stock Drawer */}
      <Sheet open={isAdjustDrawerOpen} onOpenChange={setIsAdjustDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Edit className="w-5 h-5 text-blue-600" /> ปรับสต็อก</SheetTitle>
            <SheetDescription>ปรับปรุงจำนวนสต็อกสินค้า (รับเข้า/จ่ายออก/ปรับยอด)</SheetDescription>
          </SheetHeader>
          {selectedMaterial && (
            <div className="space-y-4 mt-6 overflow-y-auto max-h-[calc(100vh-120px)] px-1">
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{selectedMaterial.material_name}</h3>
                  <Badge variant="outline">{selectedMaterial.unit}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">คงเหลือปัจจุบัน:</span>
                  <span className="font-mono text-xl font-bold">{selectedMaterial.current_qty}</span>
                </div>
              </div>

              <Tabs defaultValue="set" value={adjustForm.adjustType} onValueChange={(v) => setAdjustForm({ ...adjustForm, adjustType: v })}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="add">รับเข้า (+)</TabsTrigger>
                  <TabsTrigger value="reduce">จ่ายออก (-)</TabsTrigger>
                  <TabsTrigger value="set">ปรับยอด (=)</TabsTrigger>
                </TabsList>

                <TabsContent value="add" className="space-y-4 pt-4">
                  <div>
                    <Label>จำนวนที่รับเข้า</Label>
                    <Input type="number" min="1" value={adjustForm.adjustAmount || ""} onChange={(e) => setAdjustForm({ ...adjustForm, adjustAmount: parseInt(e.target.value) || 0 })} className="mt-1 focus-visible:ring-green-500" />
                  </div>
                  <div className="bg-green-50 p-3 rounded-md border border-green-200">
                    <p className="text-sm text-green-800 flex justify-between">
                      <span>คงเหลือใหม่:</span>
                      <span className="font-bold">{selectedMaterial.current_qty + (adjustForm.adjustAmount || 0)} {selectedMaterial.unit}</span>
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="reduce" className="space-y-4 pt-4">
                  <div>
                    <Label>จำนวนที่จ่ายออก</Label>
                    <Input type="number" min="1" value={adjustForm.adjustAmount || ""} onChange={(e) => setAdjustForm({ ...adjustForm, adjustAmount: parseInt(e.target.value) || 0 })} className="mt-1 focus-visible:ring-red-500" />
                  </div>
                  <div className="bg-red-50 p-3 rounded-md border border-red-200">
                    <p className="text-sm text-red-800 flex justify-between">
                      <span>คงเหลือใหม่:</span>
                      <span className="font-bold">{Math.max(0, selectedMaterial.current_qty - (adjustForm.adjustAmount || 0))} {selectedMaterial.unit}</span>
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="set" className="space-y-4 pt-4">
                  <div>
                    <Label>จำนวนคงเหลือจริง</Label>
                    <Input type="number" min="0" value={adjustForm.newQty} onChange={(e) => setAdjustForm({ ...adjustForm, newQty: parseInt(e.target.value) || 0 })} className="mt-1 focus-visible:ring-blue-500" />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <p className="text-sm text-blue-800 flex justify-between">
                      <span>ผลต่าง:</span>
                      <span className="font-bold">{(adjustForm.newQty - selectedMaterial.current_qty) > 0 ? "+" : ""}{adjustForm.newQty - selectedMaterial.current_qty} {selectedMaterial.unit}</span>
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div>
                <Label>หมายเหตุ</Label>
                <Textarea value={adjustForm.note} onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })} className="mt-1" placeholder="ระบุสาเหตุการปรับสต็อก..." rows={2} />
              </div>

              <Button onClick={handleSubmitAdjust} className="w-full">ยืนยันการปรับสต็อก</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Material Drawer */}
      <Sheet open={isAddMaterialDrawerOpen} onOpenChange={setIsAddMaterialDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-green-600" /> เพิ่มวัสดุใหม่</SheetTitle>
            <SheetDescription>เพิ่มรายการวัสดุใหม่เข้าสู่ระบบ</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6 overflow-y-auto max-h-[calc(100vh-120px)] px-1">
            <div>
              <Label>ชื่อวัสดุ <span className="text-red-500">*</span></Label>
              <Input value={addMaterialForm.material_name} onChange={(e) => setAddMaterialForm({ ...addMaterialForm, material_name: e.target.value })} className="mt-1" placeholder="ระบุชื่อวัสดุ" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>หน่วยนับ <span className="text-red-500">*</span></Label>
                <Input value={addMaterialForm.unit} onChange={(e) => setAddMaterialForm({ ...addMaterialForm, unit: e.target.value })} className="mt-1" placeholder="เช่น ชิ้น, อัน, กล่อง" />
              </div>
              <div>
                <Label>จุดสั่งซื้อต่ำสุด</Label>
                <Input type="number" min="0" value={addMaterialForm.min_qty} onChange={(e) => setAddMaterialForm({ ...addMaterialForm, min_qty: parseInt(e.target.value) || 0 })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>ยอดเริ่มต้น</Label>
              <Input type="number" min="0" value={addMaterialForm.current_qty} onChange={(e) => setAddMaterialForm({ ...addMaterialForm, current_qty: parseInt(e.target.value) || 0 })} className="mt-1" />
            </div>
            <div>
              <Label>หมายเหตุ</Label>
              <Textarea value={addMaterialForm.note} onChange={(e) => setAddMaterialForm({ ...addMaterialForm, note: e.target.value })} className="mt-1" rows={3} />
            </div>
            <Button onClick={handleSubmitAddMaterial} className="w-full bg-green-600 hover:bg-green-700">บันทึกวัสดุ</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialogs */}
      <AlertDialog open={confirmEditRequest} onOpenChange={setConfirmEditRequest}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการแก้ไขข้อมูล?</AlertDialogTitle>
            <AlertDialogDescription>
              การแก้ไขจำนวนเบิกอาจมีผลต่อสต็อกสินค้า คุณต้องการดำเนินการต่อหรือไม่
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveEditRequest} disabled={isSaving}>
              {isSaving ? "กำลังบันทึก..." : "ยืนยัน"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmEditStock} onOpenChange={setConfirmEditStock}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการแก้ไขข้อมูล?</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการบันทึกการแก้ไขข้อมูลวัสดุนี้หรือไม่
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveEditStock} disabled={isSaving}>
              {isSaving ? "กำลังบันทึก..." : "ยืนยัน"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
