import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, Trash2, UserCheck, UserX, Key } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

// Sample data
const sampleUsers: User[] = [
  {
    id: "1",
    fullName: "สมชาย ใจดี",
    email: "somchai@thebravo.com",
    department: "ฝ่ายขาย",
    position: "พนักงานขาย",
    role: "พนักงานทั่วไป",
    status: "active",
    createdAt: "2024-01-15"
  },
  {
    id: "2", 
    fullName: "สมหญิง รักงาน",
    email: "somying@thebravo.com",
    department: "ฝ่ายกราฟิก",
    position: "นักออกแบบ",
    role: "พนักงานทั่วไป",
    status: "active",
    createdAt: "2024-02-01"
  },
  {
    id: "3",
    fullName: "วิชัย ผู้จัดการ",
    email: "wichai@thebravo.com", 
    department: "ฝ่ายผลิต",
    position: "ผู้จัดการฝ่ายผลิต",
    role: "ผู้จัดการ",
    status: "active",
    createdAt: "2024-01-01"
  },
  {
    id: "4",
    fullName: "มาลี ลาออก",
    email: "malee@thebravo.com",
    department: "ฝ่ายบัญชี",
    position: "พนักงานบัญชี",
    role: "พนักงานทั่วไป", 
    status: "inactive",
    createdAt: "2023-12-01"
  }
];

const departments = ["ฝ่ายขาย", "ฝ่ายกราฟิก", "ฝ่ายจัดซื้อ", "ฝ่ายผลิตและจัดส่ง", "ฝ่ายบัญชี", "ฝ่ายบุคคล"];
const roles = ["พนักงานทั่วไป", "หัวหน้างาน", "ผู้จัดการ", "Admin"];

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(sampleUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    department: "",
    position: "",
    role: "",
    password: ""
  });

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.includes(searchTerm)
  );

  const handleAddUser = () => {
    if (!newUser.fullName || !newUser.email || !newUser.department || !newUser.role) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      fullName: newUser.fullName,
      email: newUser.email,
      department: newUser.department,
      position: newUser.position,
      role: newUser.role,
      status: "active",
      createdAt: new Date().toISOString().split('T')[0]
    };

    setUsers([...users, user]);
    setNewUser({ fullName: "", email: "", department: "", position: "", role: "", password: "" });
    setShowAddDialog(false);
    toast.success("เพิ่มผู้ใช้งานใหม่สำเร็จ");
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
    toast.success("เปลี่ยนสถานะผู้ใช้งานสำเร็จ");
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(user => user.id !== userId));
    toast.success("ลบผู้ใช้งานสำเร็จ");
  };

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        ใช้งานอยู่
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
        ปิดใช้งาน
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      "Admin": "bg-red-100 text-red-800 border-red-200",
      "ผู้จัดการ": "bg-blue-100 text-blue-800 border-blue-200",
      "หัวหน้างาน": "bg-orange-100 text-orange-800 border-orange-200",
      "พนักงานทั่วไป": "bg-gray-100 text-gray-800 border-gray-200"
    };

    return (
      <Badge variant="outline" className={colors[role as keyof typeof colors] || colors["พนักงานทั่วไป"]}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">การจัดการผู้ใช้งาน</h1>
        <p className="text-muted-foreground">
          จัดการข้อมูลพนักงานและสิทธิ์การเข้าถึงระบบของบริษัท
        </p>
      </div>

      {/* Search and Add User */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาผู้ใช้งาน... (ชื่อ, อีเมล, แผนก)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  เพิ่มผู้ใช้งานใหม่
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>เพิ่มผู้ใช้งานใหม่</DialogTitle>
                  <DialogDescription>
                    กรอกข้อมูลพนักงานใหม่เพื่อสร้างบัญชีผู้ใช้งาน
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
                    <Input
                      id="fullName"
                      value={newUser.fullName}
                      onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                      placeholder="ชื่อและนามสกุลเต็ม"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">อีเมล</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="example@thebravo.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="department">แผนก</Label>
                    <Select
                      value={newUser.department}
                      onValueChange={(value) => setNewUser({ ...newUser, department: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกแผนก" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="position">ตำแหน่ง</Label>
                    <Input
                      id="position"
                      value={newUser.position}
                      onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                      placeholder="ตำแหน่งงาน"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">สิทธิ์การเข้าถึง</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสิทธิ์" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">รหัสผ่าน</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="รหัสผ่านเริ่มต้น"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button onClick={handleAddUser} className="bg-[#FF5A5F] hover:bg-[#FF5A5F]/90">
                    สร้างผู้ใช้งาน
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายชื่อพนักงานทั้งหมด ({filteredUsers.length} คน)</CardTitle>
          <CardDescription>
            ข้อมูลพนักงานและสิทธิ์การเข้าถึงระบบ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อ-นามสกุล</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>แผนก</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead>สิทธิ์การเข้าถึง</TableHead>
                  <TableHead>สถานะบัญชี</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  <TableHead className="text-right">การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.position}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>{user.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditDialog(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(user.id)}
                        >
                          {user.status === 'active' ? (
                            <UserX className="w-4 h-4 text-red-600" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.info("รีเซ็ตรหัสผ่านสำเร็จ")}
                        >
                          <Key className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
}