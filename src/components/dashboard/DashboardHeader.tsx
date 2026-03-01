import { Bell, Search, User, Home, LogOut, Lock as LockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <SidebarTrigger />

        {/* THE BRAVO Logo */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-[#FF5A5F]">THE BRAVO</h1>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-[#FF5A5F] transition-colors" />
          <Input
            placeholder="ค้นหาออเดอร์, ลูกค้า, สินค้า..."
            className="w-80 pl-10 bg-background border-slate-200 focus:border-[#FF5A5F] focus:ring-[#FF5A5F]/10 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Welcome Message */}
        <div className="hidden md:flex flex-col items-end mr-2">
          <span className="text-foreground text-sm font-bold tracking-tight">สวัสดี, คุณ{userData.full_name || 'ผู้ใช้งาน'}</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{userData.role || 'พนักงาน'} | {userData.department || 'ไม่ระบุแผนก'}</span>
        </div>

        {/* Home Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/select-department')}
          className="gap-2 text-muted-foreground hover:text-[#FF5A5F] px-3 font-medium transition-colors"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">หน้าหลัก</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative hover:text-[#FF5A5F] transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A5F] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5A5F]"></span>
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full border border-slate-200 hover:border-[#FF5A5F] transition-all">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-2 shadow-strong border-slate-100 rounded-xl">
            <DropdownMenuLabel className="flex flex-col p-2 pt-0">
              <span className="font-bold text-slate-800">{userData.full_name}</span>
              <span className="text-xs text-muted-foreground font-medium">{userData.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 border-slate-100" />
            <DropdownMenuItem className="p-2 gap-3 cursor-pointer rounded-lg focus:bg-slate-50">
              <User className="w-4 h-4 text-slate-400" />
              <span>โปรไฟล์พนักงาน</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-2 gap-3 cursor-pointer rounded-lg focus:bg-slate-50">
              <LockIcon className="w-4 h-4 text-slate-400" />
              <span>เปลี่ยนรหัสผ่าน</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 border-slate-100" />
            <DropdownMenuItem
              className="p-2 gap-3 cursor-pointer rounded-lg text-red-500 focus:bg-red-50 focus:text-red-600 transition-colors font-semibold"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>ออกจากระบบ</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}