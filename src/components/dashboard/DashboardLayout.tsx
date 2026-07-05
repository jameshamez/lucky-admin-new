import { ReactNode, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessDepartment, DepartmentKey } from "@/lib/departments";

interface DashboardLayoutProps {
  children: ReactNode;
  requiredDepartment?: DepartmentKey;
}

export function DashboardLayout({ children, requiredDepartment }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasAccess = !requiredDepartment || canAccessDepartment(user, requiredDepartment);

  useEffect(() => {
    if (!user) {
      navigate("/");
    } else if (!hasAccess) {
      toast.error("คุณไม่มีสิทธิ์เข้าถึงหน้านี้");
      navigate("/select-department");
    }
  }, [user, hasAccess, navigate]);

  if (!user || !hasAccess) return null; // Don't render layout if not authenticated or not authorized
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="print-hide">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="print-hide">
            <DashboardHeader />
          </div>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}