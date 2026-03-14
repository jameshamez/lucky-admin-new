import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Plus,
    Edit,
    UserCheck,
    UserX,
    Key,
    Loader2,
    RefreshCw,
    ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

const API_BASE = "https://finfinphone.com/api-lucky/admin/users.php";

const DEPARTMENTS = [
    "ฝ่ายขาย",
    "ฝ่ายกราฟิก",
    "ฝ่ายจัดซื้อ",
    "ฝ่ายผลิตและจัดส่ง",
    "ฝ่ายบัญชี",
    "ฝ่ายบุคคล",
    "IT",
];

const ROLES = ["User", "Manager", "Admin"];

interface UserData {
    id: number;
    username: string;
    full_name: string;
    email: string;
    department: string;
    role: string;
    status: "active" | "inactive";
    created_at: string;
}

const emptyForm = {
    username: "",
    full_name: "",
    email: "",
    department: "",
    role: "User",
    password: "",
};

export default function HRUserManagement() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Dialog states
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showResetDialog, setShowResetDialog] = useState(false);

    const [form, setForm] = useState(emptyForm);
    const [editUser, setEditUser] = useState<UserData | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [saving, setSaving] = useState(false);

    // ─── Fetch users ───────────────────────────────────────────────────────────
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(API_BASE);
            const json = await res.json();
            if (json.status === "success") {
                setUsers(json.data);
            } else {
                toast.error("โหลดข้อมูลผู้ใช้งานล้มเหลว");
            }
        } catch {
            toast.error("ไม่สามารถเชื่อมต่อ API ได้");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // ─── Filtered list ─────────────────────────────────────────────────────────
    const filtered = users.filter((u) => {
        const q = searchTerm.toLowerCase();
        return (
            u.full_name.toLowerCase().includes(q) ||
            u.username.toLowerCase().includes(q) ||
            u.department.includes(searchTerm) ||
            u.email.toLowerCase().includes(q)
        );
    });

    // ─── Create user ───────────────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!form.username || !form.full_name || !form.password || !form.department || !form.role) {
            toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const json = await res.json();
            if (json.status === "success") {
                toast.success("สร้างผู้ใช้งานสำเร็จ");
                setShowAddDialog(false);
                setForm(emptyForm);
                fetchUsers();
            } else {
                toast.error(json.message || "สร้างผู้ใช้งานล้มเหลว");
            }
        } catch {
            toast.error("ไม่สามารถเชื่อมต่อ API ได้");
        } finally {
            setSaving(false);
        }
    };

    // ─── Update user ───────────────────────────────────────────────────────────
    const handleUpdate = async () => {
        if (!editUser) return;
        if (!form.full_name || !form.department || !form.role) {
            toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }
        setSaving(true);
        try {
            const body: Record<string, string> = {
                username: form.username,
                full_name: form.full_name,
                email: form.email,
                department: form.department,
                role: form.role,
            };
            if (form.password) body.password = form.password;

            const res = await fetch(`${API_BASE}?id=${editUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (json.status === "success") {
                toast.success("อัปเดตผู้ใช้งานสำเร็จ");
                setShowEditDialog(false);
                setEditUser(null);
                setForm(emptyForm);
                fetchUsers();
            } else {
                toast.error(json.message || "อัปเดตข้อมูลล้มเหลว");
            }
        } catch {
            toast.error("ไม่สามารถเชื่อมต่อ API ได้");
        } finally {
            setSaving(false);
        }
    };

    // ─── Toggle status (soft delete) ───────────────────────────────────────────
    const handleToggleStatus = async (user: UserData) => {
        const newStatus = user.status === "active" ? "inactive" : "active";
        try {
            const res = await fetch(`${API_BASE}?id=${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const json = await res.json();
            if (json.status === "success") {
                toast.success(
                    newStatus === "active" ? "เปิดใช้งานสำเร็จ" : "ปิดใช้งานสำเร็จ"
                );
                fetchUsers();
            } else {
                toast.error(json.message || "เปลี่ยนสถานะล้มเหลว");
            }
        } catch {
            toast.error("ไม่สามารถเชื่อมต่อ API ได้");
        }
    };

    // ─── Reset password ────────────────────────────────────────────────────────
    const handleResetPassword = async () => {
        if (!editUser || !newPassword) {
            toast.error("กรุณากรอกรหัสผ่านใหม่");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE}?id=${editUser.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword }),
            });
            const json = await res.json();
            if (json.status === "success") {
                toast.success("รีเซ็ตรหัสผ่านสำเร็จ");
                setShowResetDialog(false);
                setNewPassword("");
                setEditUser(null);
            } else {
                toast.error(json.message || "รีเซ็ตรหัสผ่านล้มเหลว");
            }
        } catch {
            toast.error("ไม่สามารถเชื่อมต่อ API ได้");
        } finally {
            setSaving(false);
        }
    };

    // ─── Helpers ───────────────────────────────────────────────────────────────
    const openEdit = (user: UserData) => {
        setEditUser(user);
        setForm({
            username: user.username,
            full_name: user.full_name,
            email: user.email,
            department: user.department,
            role: user.role,
            password: "",
        });
        setShowEditDialog(true);
    };

    const openReset = (user: UserData) => {
        setEditUser(user);
        setNewPassword("");
        setShowResetDialog(true);
    };

    const statusBadge = (status: string) =>
        status === "active" ? (
            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                ใช้งานอยู่
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                ปิดใช้งาน
            </Badge>
        );

    const roleBadge = (role: string) => {
        const map: Record<string, string> = {
            Admin: "bg-red-100 text-red-700 border-red-200",
            Manager: "bg-blue-100 text-blue-700 border-blue-200",
            User: "bg-slate-100 text-slate-600 border-slate-200",
        };
        return (
            <Badge variant="outline" className={map[role] ?? map["User"]}>
                {role}
            </Badge>
        );
    };

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground mb-1">
                        จัดการผู้ใช้งานระบบ
                    </h1>
                    <p className="text-muted-foreground">
                        เพิ่ม / แก้ไข / ปิดการใช้งาน บัญชีผู้ใช้งานของพนักงาน
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchUsers}
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                    รีเฟรช
                </Button>
            </div>

            {/* Search + Add */}
            <Card>
                <CardContent className="pt-5">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="ค้นหา ชื่อ / username / อีเมล / แผนก..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Button
                            onClick={() => {
                                setForm(emptyForm);
                                setShowAddDialog(true);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            เพิ่มผู้ใช้งาน
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle>รายชื่อผู้ใช้งานทั้งหมด ({filtered.length} คน)</CardTitle>
                    <CardDescription>บัญชีผู้ใช้งานและสิทธิ์การเข้าถึงระบบ</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>ไม่พบผู้ใช้งาน</p>
                        </div>
                    ) : (
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ชื่อ-นามสกุล</TableHead>
                                        <TableHead>Username</TableHead>
                                        <TableHead>อีเมล</TableHead>
                                        <TableHead>แผนก</TableHead>
                                        <TableHead>สิทธิ์</TableHead>
                                        <TableHead>สถานะ</TableHead>
                                        <TableHead>วันที่สร้าง</TableHead>
                                        <TableHead className="text-right">การจัดการ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filtered.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.full_name}</TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-sm">
                                                {user.username}
                                            </TableCell>
                                            <TableCell>{user.email || "-"}</TableCell>
                                            <TableCell>{user.department || "-"}</TableCell>
                                            <TableCell>{roleBadge(user.role)}</TableCell>
                                            <TableCell>{statusBadge(user.status)}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {user.created_at?.substring(0, 10) ?? "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1.5">
                                                    {/* Edit */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEdit(user)}
                                                        title="แก้ไขข้อมูล"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </Button>
                                                    {/* Toggle status */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleStatus(user)}
                                                        title={user.status === "active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                                                    >
                                                        {user.status === "active" ? (
                                                            <UserX className="w-3.5 h-3.5 text-red-500" />
                                                        ) : (
                                                            <UserCheck className="w-3.5 h-3.5 text-green-600" />
                                                        )}
                                                    </Button>
                                                    {/* Reset password */}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openReset(user)}
                                                        title="รีเซ็ตรหัสผ่าน"
                                                    >
                                                        <Key className="w-3.5 h-3.5 text-blue-500" />
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

            {/* ─── Add Dialog ────────────────────────────────────────────────────── */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle>เพิ่มผู้ใช้งานใหม่</DialogTitle>
                        <DialogDescription>
                            กรอกข้อมูลพนักงานเพื่อสร้างบัญชีผู้ใช้งานในระบบ
                        </DialogDescription>
                    </DialogHeader>
                    <FormFields form={form} setForm={setForm} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                            ยกเลิก
                        </Button>
                        <Button onClick={handleCreate} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            สร้างบัญชี
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Edit Dialog ───────────────────────────────────────────────────── */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle>แก้ไขข้อมูลผู้ใช้งาน</DialogTitle>
                        <DialogDescription>
                            แก้ไขข้อมูลของ <strong>{editUser?.full_name}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <FormFields form={form} setForm={setForm} isEdit />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowEditDialog(false);
                                setEditUser(null);
                            }}
                        >
                            ยกเลิก
                        </Button>
                        <Button onClick={handleUpdate} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            บันทึก
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── Reset Password Dialog ─────────────────────────────────────────── */}
            <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <DialogContent className="sm:max-w-[380px]">
                    <DialogHeader>
                        <DialogTitle>รีเซ็ตรหัสผ่าน</DialogTitle>
                        <DialogDescription>
                            ตั้งรหัสผ่านใหม่สำหรับ <strong>{editUser?.full_name}</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                        <Label>รหัสผ่านใหม่</Label>
                        <Input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="กรอกรหัสผ่านใหม่"
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowResetDialog(false);
                                setEditUser(null);
                            }}
                        >
                            ยกเลิก
                        </Button>
                        <Button onClick={handleResetPassword} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            รีเซ็ตรหัสผ่าน
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── Shared form fields ────────────────────────────────────────────────────
function FormFields({
    form,
    setForm,
    isEdit = false,
}: {
    form: any;
    setForm: (f: any) => void;
    isEdit?: boolean;
}) {
    return (
        <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
                <Label>Username</Label>
                <Input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="ชื่อผู้ใช้งานในระบบ"
                    disabled={isEdit} // ไม่ให้แก้ username หลังสร้าง
                />
            </div>
            <div className="grid gap-1.5">
                <Label>ชื่อ-นามสกุล</Label>
                <Input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="ชื่อและนามสกุลเต็ม"
                />
            </div>
            <div className="grid gap-1.5">
                <Label>อีเมล</Label>
                <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="example@thebravo.com"
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                    <Label>แผนก</Label>
                    <Select
                        value={form.department}
                        onValueChange={(v) => setForm({ ...form, department: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="เลือกแผนก" />
                        </SelectTrigger>
                        <SelectContent>
                            {DEPARTMENTS.map((d) => (
                                <SelectItem key={d} value={d}>
                                    {d}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-1.5">
                    <Label>สิทธิ์</Label>
                    <Select
                        value={form.role}
                        onValueChange={(v) => setForm({ ...form, role: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="เลือกสิทธิ์" />
                        </SelectTrigger>
                        <SelectContent>
                            {ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                    {r}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid gap-1.5">
                <Label>{isEdit ? "รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)" : "รหัสผ่าน"}</Label>
                <Input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={isEdit ? "ไม่บังคับ" : "รหัสผ่านเริ่มต้น"}
                />
            </div>
        </div>
    );
}
