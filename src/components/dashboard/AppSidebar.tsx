import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  MessageSquare, 
  FileBarChart,
  Palette,
  Truck,
  Calculator,
  Users,
  Crown,
  Trophy,
  BarChart3,
  Building2,
  UserCheck,
  PlusCircle,
  Eye,
  Boxes,
  FileText,
  Car,
  BookOpen,
  PenTool,
  DollarSign,
  Clipboard,
  ChevronDown,
  ChevronRight,
  Settings,
  UserCog,
  BarChart4,
  ClipboardList,
  Wallet,
  AlertTriangle,
  XCircle,
  ArrowRightLeft,
  FileEdit,
  History,
  PackagePlus
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

// Main menu items (same for all departments)
const mainItems = [
  { title: "สถานะงานรวม", url: "/status", icon: BarChart3 },
  { title: "การสื่อสารภายในองค์กร", url: "/communication", icon: MessageSquare },
  { title: "รายงานผล", url: "/reports", icon: FileBarChart },
];

// Department-specific menu items with detailed structure
const salesItems = [
  { title: "แดชบอร์ด", url: "/sales", icon: LayoutDashboard },
  { title: "จัดการลูกค้า", url: "/sales/customers", icon: UserCheck },
  { title: "จัดการคำสั่งซื้อ", url: "/sales/create-order", icon: PlusCircle },
  { title: "ประเมินราคา", url: "/sales/price-estimation", icon: Calculator },
  { title: "ติดตามคำสั่งซื้อ", url: "/sales/track-orders", icon: Eye },
  { title: "จัดการสินค้า", url: "/sales/product-inventory", icon: Boxes },
  { title: "เบิกการใช้งาน", url: "/sales/internal-requests", icon: FileText },
  { title: "การตั้งค่า", url: "/sales/settings", icon: Settings },
  { title: "คู่มือการทำงาน", url: "/sales/user-manual", icon: BookOpen },
  { title: "รายงานผล", url: "/sales/reports", icon: FileBarChart }
];

const designItems = [
  { title: "แดชบอร์ด", url: "/design", icon: LayoutDashboard },
  { title: "รับงานออกแบบ", url: "/design/jobs", icon: PenTool },
  { title: "ดูและติดตามสถานะงาน", url: "/design/tracking", icon: Eye },
  { title: "การเบิกสินค้าและสต็อกสินค้า", url: "/design/materials", icon: Boxes },
  { title: "คู่มือการทำงาน", url: "/design/user-manual", icon: BookOpen },
  { title: "รายงานผล", url: "/design/reports", icon: FileBarChart }
];

const procurementItems = [
  { title: "แดชบอร์ด", url: "/procurement/dashboard", icon: LayoutDashboard },
  { 
    title: "ระบบประเมินราคา", 
    url: "/procurement/estimation", 
    icon: Calculator,
    children: [
      { title: "จัดการคำขอประเมินราคา", url: "/procurement/estimation/quotation", icon: FileText },
      { title: "ประวัติการประเมินราคา", url: "/procurement/estimation/history", icon: History }
    ]
  },
  
  
  { title: "สั่งซื้อวัสดุอุปกรณ์", url: "/procurement/purchase-requisition", icon: ShoppingCart },
  { title: "สต๊อกสินค้า", url: "/procurement/inventory-stock", icon: Boxes },
  { title: "เบิกการใช้งาน", url: "/procurement/requisition-center", icon: FileText },
  { title: "รายงานและสรุปยอด", url: "/procurement/reports", icon: BarChart3 },
  { title: "คู่มือการทำงาน", url: "/procurement/user-manual", icon: BookOpen },
  { title: "การตั้งค่า", url: "/procurement/settings", icon: Settings }
];

// Production department items - Simplified structure
const productionItems = [
  { title: "แดชบอร์ด", url: "/production", icon: LayoutDashboard },
  { title: "จัดการผลิตและจัดส่ง", url: "/production/orders", icon: Package },
  { title: "คลังสินค้า", url: "/production/inventory", icon: Boxes },
  { title: "จัดการยานพาหนะ", url: "/production/vehicle-management", icon: Car },
  { title: "รายงาน", url: "/production/reports", icon: FileBarChart },
  { title: "คู่มือ", url: "/production/user-manual", icon: BookOpen }
];

// Accounting department items
const accountingItems = [
  { title: "แดชบอร์ด", url: "/accounting/dashboard", icon: LayoutDashboard },
  { title: "ใบสั่งงาน", url: "/accounting/work-orders", icon: ClipboardList },
  { title: "หน้ารายรับ", url: "/accounting/revenue", icon: DollarSign },
  { title: "หน้ารายจ่าย", url: "/accounting/expenses", icon: FileText },
  { title: "การจัดการลูกหนี้", url: "/accounting/customer-accounts", icon: Users },
  { title: "สต๊อกสินค้า", url: "/accounting/product-inventory", icon: Package },
  { title: "ทรัพย์สินสำนักงาน", url: "/accounting/office-inventory", icon: Package },
  { title: "เบิกเงินสดย่อย", url: "/accounting/petty-cash", icon: Wallet },
  { title: "เบิกใช้วัสดุสำนักงาน", url: "/accounting/office-requisitions", icon: ClipboardList },
  { title: "คู่มือการทำงาน", url: "/accounting/user-manual", icon: BookOpen },
  { 
    title: "รายงาน", 
    url: "/accounting/reports", 
    icon: FileBarChart,
    children: [
      { title: "รายงานทั้งหมด", url: "/accounting/reports", icon: BarChart3 },
      { title: "รายงานยอดขาย", url: "/accounting/reports/sales", icon: DollarSign },
      { title: "รายงานสต๊อกสินค้า", url: "/accounting/reports/inventory", icon: Package },
      { title: "รายงานวัสดุสำนักงาน", url: "/accounting/reports/office-supplies", icon: FileText },
      { title: "รายงานอุปกรณ์สำนักงาน", url: "/accounting/reports/office-equipment", icon: Settings },
      { title: "รายงานเงินสดย่อย", url: "/accounting/reports/petty-cash", icon: Wallet }
    ]
  }
];

// HR department items
const hrItems = [
  { title: "แดชบอร์ด", url: "/hr/dashboard", icon: LayoutDashboard },
  { title: "จัดการข้อมูลพนักงาน", url: "/hr/employee-management", icon: Users },
  { 
    title: "ค่าคอมมิชชั่น", 
    url: "/hr/commission", 
    icon: DollarSign,
    children: [
      { title: "งานสั่งผลิต", url: "/hr/commission-made-to-order", icon: DollarSign },
      { title: "งานสำเร็จรูป", url: "/hr/commission-ready-made", icon: DollarSign }
    ]
  },
  { title: "ตั้งค่า HR & Commission", url: "/hr/settings", icon: Settings },
  { title: "รายงานค่าคอมรายเดือน", url: "/hr/monthly-commission-report", icon: FileBarChart },
  { title: "คู่มือการทำงาน", url: "/hr/user-manual", icon: BookOpen },
  { title: "รายงานผล", url: "/hr/reports", icon: FileBarChart }
];

// Admin/Manager menu items
const adminMainItems = [
  { title: "แดชบอร์ดผู้บริหาร", url: "/manager", icon: LayoutDashboard },
  { title: "รายงานผลรวม", url: "/manager/reports", icon: BarChart4 },
  { title: "การจัดการผู้ใช้งาน", url: "/manager/users", icon: UserCog },
  { title: "การตั้งค่าระบบ", url: "/manager/settings", icon: Settings }
];

const adminDepartmentItems = [
  { 
    title: "ฝ่ายขาย", 
    url: "/sales", 
    icon: ShoppingCart,
    children: salesItems
  },
  { 
    title: "ฝ่ายกราฟิก", 
    url: "/design", 
    icon: Palette,
    children: designItems
  },
  { 
    title: "ฝ่ายจัดซื้อ", 
    url: "/procurement", 
    icon: Truck,
    children: procurementItems
  },
  { 
    title: "ฝ่ายผลิตและจัดส่ง", 
    url: "/production", 
    icon: Package,
    children: productionItems
  },
  { 
    title: "ฝ่ายบัญชี", 
    url: "/accounting", 
    icon: Calculator,
    children: accountingItems
  },
  { 
    title: "ฝ่ายบุคคล", 
    url: "/hr", 
    icon: Users,
    children: hrItems
  }
];

// Current user's department (this would be dynamic in a real app)
const getCurrentDepartmentItems = () => {
  const path = window.location.pathname;
  if (path.startsWith('/manager')) return []; // Admin handles departments separately
  if (path.startsWith('/petty-cash')) return []; // Petty cash standalone - no department menu
  if (path.startsWith('/sales')) return salesItems;
  if (path.startsWith('/design')) return designItems;
  if (path.startsWith('/procurement')) return procurementItems;
  if (path.startsWith('/production')) return productionItems;
  if (path.startsWith('/accounting')) return accountingItems;
  if (path.startsWith('/hr')) return hrItems;
  if (path.startsWith('/user-manual')) return []; // Legacy user manual path
  return [];
};

const isAdminMode = () => {
  const path = window.location.pathname;
  return path.startsWith('/manager') || path.startsWith('/dashboard');
};

const MenuItemComponent = ({ item, collapsed, level = 0 }: { item: any, collapsed: boolean, level?: number }) => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isActive = location.pathname === item.url;
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild={!hasChildren}>
        {hasChildren ? (
          <div
            onClick={handleClick}
            className={`relative flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
              isActive 
                ? "text-[#FF5A5F] font-medium bg-[#FF5A5F]/10" 
                : "text-sidebar-foreground hover:text-[#FF5A5F] hover:bg-[#FF5A5F]/5"
            }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF5A5F] rounded-r-full" />
            )}
            <item.icon className="w-4 h-4" />
            {!collapsed && (
              <>
                <span className="flex-1">{item.title}</span>
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </>
            )}
          </div>
        ) : (
          <NavLink 
            to={item.url} 
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive 
                  ? "text-[#FF5A5F] font-medium bg-[#FF5A5F]/10" 
                  : "text-sidebar-foreground hover:text-[#FF5A5F] hover:bg-[#FF5A5F]/5"
              }`
            }
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF5A5F] rounded-r-full" />
                )}
                <item.icon className="w-4 h-4" />
                {!collapsed && <span>{item.title}</span>}
              </>
            )}
          </NavLink>
        )}
      </SidebarMenuButton>
      
      {hasChildren && isOpen && !collapsed && (
        <SidebarMenuSub>
          {item.children.map((child: any) => (
            <SidebarMenuSubItem key={child.title}>
              <SidebarMenuSubButton asChild>
                <NavLink 
                  to={child.url}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive 
                        ? "text-[#FF5A5F] font-medium bg-[#FF5A5F]/10" 
                        : "text-sidebar-foreground hover:text-[#FF5A5F] hover:bg-[#FF5A5F]/5"
                    }`
                  }
                  style={{ paddingLeft: `${28 + level * 16}px` }}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF5A5F] rounded-r-full" />
                      )}
                      <child.icon className="w-4 h-4" />
                      <span>{child.title}</span>
                    </>
                  )}
                </NavLink>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const currentDepartmentItems = getCurrentDepartmentItems();
  const adminMode = isAdminMode();

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#FF5A5F] to-[#FF385C] rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">THE BRAVO</h2>
              <p className="text-xs text-sidebar-foreground/70">
                {adminMode ? "Admin Panel" : "ERP System"}
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Admin Mode */}
        {adminMode ? (
          <>
            {/* Admin Main Menu Section */}
            <SidebarGroup>
              <SidebarGroupLabel>เมนูหลัก</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminMainItems.map((item) => (
                    <MenuItemComponent key={item.title} item={item} collapsed={collapsed} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Admin Department Access Section */}
            <SidebarGroup>
              <SidebarGroupLabel>การเข้าถึงตามแผนก</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminDepartmentItems.map((item) => (
                    <MenuItemComponent key={item.title} item={item} collapsed={collapsed} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <>
            {/* Regular User Mode */}
            {/* Main Menu Section */}
            <SidebarGroup>
              <SidebarGroupLabel>หลัก</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {mainItems.map((item) => (
                    <MenuItemComponent key={item.title} item={item} collapsed={collapsed} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Department Section */}
            {currentDepartmentItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>ฟังก์ชันแผนก</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {currentDepartmentItems.map((item) => (
                      <MenuItemComponent key={item.title} item={item} collapsed={collapsed} />
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}