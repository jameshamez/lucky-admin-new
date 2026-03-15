import { useState, useEffect, useCallback } from "react";
import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Trash2, UserCheck, UserX, Key, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: number;
  username: string;
  full_name: string;
  email: string;
  department: string;
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
}

const DEPARTMENTS = ["ฝ่ายขาย", "ฝ่ายกราฟิก", "ฝ่ายจัดซื้อ", "ฝ่ายผลิตและจัดส่ง", "ฝ่ายบัญชี", "ฝ่ายบุคคล", "IT"];
const ROLES = ["User", "Manager", "Admin"];

const emptyForm = {
  username: "",
  full_name: "",
  email: "",
  department: "",
  role: "User",
  password: ""
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers();
      if (res.status === "success") {
        setUsers(res.data);
      } else {
        toast.error("โหลดข้อมูลพนักงานล้มเหลว");
      }
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddUser = async () => {
    if (!form.username || !form.full_name || !form.password || !form.department || !form.role) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setSaving(true);
    try {
      const res = await adminService.createUser(form);
      if (res.status === "success") {
        toast.success("เพิ่มผู้ใช้งานใหม่สำเร็จ");
        setShowAddDialog(false);
        setForm(emptyForm);
        fetchUsers();
      } else {
        toast.error(res.message || "เพิ่มผู้ใช้งานล้มเหลว");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    if (!form.full_name || !form.department || !form.role) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setSaving(true);
    try {
      const body: any = {
        full_name: form.full_name,
        email: form.email,
        department: form.department,
        role: form.role
      };
      if (form.password) body.password = form.password;

      const res = await adminService.updateUser(selectedUser.id, body);
      if (res.status === "success") {
        toast.success("แก้ไขข้อมูลสำเร็จ");
        setShowEditDialog(false);
        setForm(emptyForm);
        fetchUsers();
      } else {
        toast.error(res.message || "แก้ไขข้อมูลล้มเหลว");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await adminService.updateUser(user.id, { status: newStatus });
      if (res.status === "success") {
        toast.success("เปลี่ยนสถานะพนักงานสำเร็จ");
        fetchUsers();
      } else {
        toast.error(res.message || "เปลี่ยนสถานะล้มเหลว");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่? (สถานะจะถูกเปลี่ยนเป็น inactive)")) return;
    try {
      const res = await adminService.deleteUser(userId);
      if (res.status === "success") {
        toast.success("ลบผู้ใช้งานสำเร็จ");
        fetchUsers();
      } else {
        toast.error(res.message || "ลบพนักงานล้มเหลว");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) {
      toast.error("กรุณากรอกรหัสผ่านใหม่");
      return;
    }
    setSaving(true);
    try {
      const res = await adminService.updateUser(selectedUser.id, { password: newPassword });
      if (res.status === "success") {
        toast.success("รีเซ็ตรหัสผ่านสำเร็จ");
        setShowResetDialog(false);
        setNewPassword("");
        setSelectedUser(null);
      } else {
        toast.error(res.message || "รีเซ็ตรหัสผ่านล้มเหลว");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    user.department.includes(searchTerm)
  );

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        ใช้งานอยู่
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-500 border-gray-200">
        ปิดใช้งาน
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, string> = {
      Admin: "bg-red-100 text-red-700 border-red-200",
      Manager: "bg-blue-100 text-blue-700 border-blue-200",
      User: "bg-slate-100 text-slate-600 border-slate-200",
    };
    return (
      <Badge variant="outline" className={map[role] || map["User"]}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">การจัดการผู้ใช้งานระบบ</h1>
          <p className="text-muted-foreground">
            จัดการบัญชีพนักงาน สิทธิ์การเข้าถึง และความปลอดภัยของระบบ
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          รีเฟรช
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาพนักงาน... (ชื่อ, username, แผนก)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { setForm(emptyForm); setShowAddDialog(true); }} className="bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มผู้ใช้งานใหม่
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>รายชื่อพนักงานทั้งหมด ({filteredUsers.length} คน)</CardTitle>
          <CardDescription>ข้อมูลบัญชีผู้ใช้งานและสถานะการเข้าสู่ระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>ไม่พบข้อมูลผู้ใช้งาน</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>ชื่อ-นามสกุล</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>แผนก</TableHead>
                    <TableHead>สิทธิ์</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>วันที่สร้าง</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">{user.username}</TableCell>
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell>{user.email || "-"}</TableCell>
                      <TableCell>{user.department || "-"}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {user.created_at?.substring(0, 10)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => {
                            setSelectedUser(user);
                            setForm({
                              username: user.username,
                              full_name: user.full_name,
                              email: user.email || "",
                              department: user.department || "",
                              role: user.role,
                              password: ""
                            });
                            setShowEditDialog(true);
                          }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleStatus(user)}>
                            {user.status === 'active' ? <UserX className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-600" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-orange-500" onClick={() => { setSelectedUser(user); setNewPassword(""); setShowResetDialog(true); }}>
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteUser(user.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>เพิ่มผู้ใช้งานใหม่</DialogTitle>
            <DialogDescription>ตั้งค่าบัญชีใหม่สำหรับพนักงาน</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <UserFormFields form={form} setForm={setForm} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleAddUser} disabled={saving} className="bg-[#FF5A5F] hover:bg-[#FF5A5F]/90">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              สร้างบัญชี
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลผู้ใช้งาน</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลของ {selectedUser?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <UserFormFields form={form} setForm={setForm} isEdit />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleUpdateUser} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              บันทึกการเปลี่ยนแปลง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>รีเซ็ตรหัสผ่าน</DialogTitle>
            <DialogDescription>เปลี่ยนรหัสผ่านใหม่สำหรับ {selectedUser?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="กรอกรหัสผ่านใหม่" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>ยกเลิก</Button>
            <Button onClick={handleResetPassword} disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              ยืนยันเปลี่ยนรหัสผ่าน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserFormFields({ form, setForm, isEdit = false }: any) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={isEdit} placeholder="สำหรับใช้เข้าระบบ" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
        <Input id="fullName" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="ชื่อเต็ม" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">อีเมล</Label>
        <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="example@thebravo.com" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="department">แผนก</Label>
          <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
            <SelectTrigger><SelectValue placeholder="เลือกแผนก" /></SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">สิทธิ์</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
            <SelectTrigger><SelectValue placeholder="เลือกสิทธิ์" /></SelectTrigger>
            <SelectContent>
              {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {!isEdit && (
        <div className="grid gap-2">
          <Label htmlFor="password">รหัสผ่าน</Label>
          <Input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="รหัสผ่านเริ่มต้น" />
        </div>
      )}
    </>
  );
}