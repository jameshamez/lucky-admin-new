import { Bell, Search, User, Home, LogOut } from "lucide-react";
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

  return (
    <header className="h-16 border-b border-border bg-background px-6 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <SidebarTrigger />
        
        {/* THE BRAVO Logo */}
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-[#FF5A5F]">THE BRAVO</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="ค้นหาออเดอร์, ลูกค้า, สินค้า..." 
            className="w-80 pl-10 bg-background"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Welcome Message */}
        <span className="text-foreground text-sm">สวัสดี, สมชาย</span>
        
        {/* Home Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/')}
          className="gap-2 text-muted-foreground hover:text-[#FF5A5F]"
        >
          <Home className="w-4 h-4" />
          หน้าหลัก
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
            3
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>โปรไฟล์</DropdownMenuItem>
            <DropdownMenuItem>การตั้งค่า</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[#FF5A5F] gap-2">
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}