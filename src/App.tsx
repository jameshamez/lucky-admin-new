import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Orders from "./pages/Orders";
import SalesMain from "./pages/sales/SalesMain";
import CustomerManagement from "./pages/sales/CustomerManagement";
import CustomerProfile from "./pages/sales/CustomerProfile";
import CreateOrder from "./pages/sales/CreateOrder";
import ProductionOrder from "./pages/sales/ProductionOrder";
import OrderTracking from "./pages/sales/OrderTracking";
import OrderDetail from "./pages/sales/OrderDetail";
import PriceEstimation from "./pages/sales/PriceEstimation";
import AddPriceEstimation from "./pages/sales/AddPriceEstimation";
import PriceEstimationDetail from "./pages/sales/PriceEstimationDetail";
import SalesInventoryStock from "./pages/sales/InventoryStock";
import InternalRequisitions from "./pages/sales/InternalRequisitions";
import SalesSettings from "./pages/sales/SalesSettings";
import SalesReports from "./pages/sales/SalesReports";
import DesignMain from "./pages/design/DesignMain";
import JobOrderManagement from "./pages/design/JobOrderManagement";
import DesignJobTracking from "./pages/design/JobTracking";
import MaterialStock from "./pages/design/MaterialStock";
import DesignReports from "./pages/design/DesignReports";
import ProcurementMain from "./pages/procurement/ProcurementMain";
import ProcurementDashboard from "./pages/procurement/ProcurementDashboard";
import ProcurementPriceEstimation from "./pages/procurement/PriceEstimation";
import ProcurementInternalRequisitions from "./pages/procurement/InternalRequisitions";
import PurchaseOrders from "./pages/procurement/PurchaseOrders";

import Quotation from "./pages/procurement/Quotation";
import PricingHistory from "./pages/procurement/PricingHistory";
import ProcurementAddPriceEstimation from "./pages/procurement/AddPriceEstimation";

import PurchaseRequisition from "./pages/procurement/PurchaseRequisition";

import RequisitionCenter from "./pages/procurement/RequisitionCenter";
import ProcurementReports from "./pages/procurement/ProcurementReports";
import ProcurementSettings from "./pages/procurement/ProcurementSettings";
import ProcurementUserManual from "./pages/procurement/UserManual";
import AccountingMain from "./pages/accounting/AccountingMain";
import AccountingDashboard from "./pages/accounting/AccountingDashboard";
import RevenueExpenses from "./pages/accounting/RevenueExpenses";
import WorkOrders from "./pages/accounting/WorkOrders";
import Revenue from "./pages/accounting/Revenue";
import Expenses from "./pages/accounting/Expenses";
import CustomerAccounts from "./pages/accounting/CustomerAccounts";

import OfficeInventory from "./pages/accounting/OfficeInventory";
import PettyCash from "./pages/accounting/PettyCash";
import OfficeRequisitions from "./pages/accounting/OfficeRequisitions";
import InternalRequests from "./pages/accounting/InternalRequests";
import FinancialReports from "./pages/accounting/FinancialReports";
import ReportsMain from "./pages/accounting/ReportsMain";
import SalesReport from "./pages/accounting/reports/SalesReport";
import InventoryReport from "./pages/accounting/reports/InventoryReport";
import OfficeSuppliesReport from "./pages/accounting/reports/OfficeSuppliesReport";
import OfficeEquipmentReport from "./pages/accounting/reports/OfficeEquipmentReport";
import PettyCashReport from "./pages/accounting/reports/PettyCashReport";
import HRMain from "./pages/hr/HRMain";
import HRDashboard from "./pages/hr/HRDashboard";
import EmployeeManagement from "./pages/hr/EmployeeManagement";
import CommissionMadeToOrder from "./pages/hr/CommissionMadeToOrder";
import CommissionReadyMade from "./pages/hr/CommissionReadyMade";
import HRSettings from "./pages/hr/HRSettings";
import HRReports from "./pages/hr/HRReports";
import MonthlyCommissionReport from "./pages/hr/MonthlyCommissionReport";
import HRUserManagement from "./pages/hr/HRUserManagement";
import ProductionMain from "./pages/production/ProductionMain";
import ProductionDashboard from "./pages/production/ProductionDashboard";
import OrderManagement from "./pages/production/OrderManagement";
import ProductionOrderDetail from "./pages/production/ProductionOrderDetail";
import EmployeeTaskDetails from "./pages/production/EmployeeTaskDetails";
import InventoryDeduct from "./pages/production/InventoryDeduct";
import InventoryManagement from "./pages/production/InventoryManagement";
import InventoryDashboard from "./pages/production/InventoryDashboard";
import InventoryAll from "./pages/production/InventoryAll";
import InventoryReceive from "./pages/production/InventoryReceive";
import InventoryTransfer from "./pages/production/InventoryTransfer";
import InventoryAdjust from "./pages/production/InventoryAdjust";
import InventoryHistory from "./pages/production/InventoryHistory";
import InventorySettings from "./pages/production/InventorySettings";
import RequestsManagement from "./pages/production/RequestsManagement";
import VehicleRequestManagement from "./pages/production/VehicleRequestManagement";
import VehicleRequestDetail from "./pages/production/VehicleRequestDetail";
import ProductionReports from "./pages/production/ProductionReports";
import ProductionProductInventory from "./pages/production/ProductInventory";
import DepartmentSelection from "./pages/DepartmentSelection";
import Login from "./pages/Login";
import StandalonePettyCash from "./pages/StandalonePettyCash";
import Communication from "./pages/Communication";
import Reports from "./pages/Reports";
import StatusOverview from "./pages/StatusOverview";
import NotFound from "./pages/NotFound";
import UserManagement from "./pages/admin/UserManagement";
import SystemSettings from "./pages/admin/SystemSettings";
import ComprehensiveReports from "./pages/admin/ComprehensiveReports";
import ExecutiveDashboard from "./pages/admin/ExecutiveDashboard";
import UserManual from "./pages/UserManual";

const queryClient = new QueryClient();

const RootRedirect = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/select-department" replace /> : <Login />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/select-department" element={<DepartmentSelection />} />
          <Route path="/petty-cash" element={
            <DashboardLayout requiredDepartment="petty-cash">
              <StandalonePettyCash />
            </DashboardLayout>
          } />
          <Route path="/orders" element={
            <DashboardLayout>
              <Orders />
            </DashboardLayout>
          } />
          <Route path="/inventory" element={
            <DashboardLayout>
              <div className="text-center py-8 text-muted-foreground">
                <h2 className="text-xl font-semibold mb-2">ระบบสต็อก</h2>
                <p>กำลังพัฒนา...</p>
              </div>
            </DashboardLayout>
          } />
          <Route path="/communication" element={
            <DashboardLayout>
              <Communication />
            </DashboardLayout>
          } />
          <Route path="/reports" element={
            <DashboardLayout>
              <Reports />
            </DashboardLayout>
          } />
          {/* Department Routes */}
          <Route path="/sales" element={
            <DashboardLayout requiredDepartment="sales">
              <SalesMain />
            </DashboardLayout>
          } />
          <Route path="/sales/customers" element={
            <DashboardLayout requiredDepartment="sales">
              <CustomerManagement />
            </DashboardLayout>
          } />
          <Route path="/sales/customers/:id" element={
            <DashboardLayout requiredDepartment="sales">
              <CustomerProfile />
            </DashboardLayout>
          } />
          <Route path="/sales/create-order" element={
            <DashboardLayout requiredDepartment="sales">
              <CreateOrder />
            </DashboardLayout>
          } />
          <Route path="/sales/production-order" element={
            <DashboardLayout requiredDepartment="sales">
              <ProductionOrder />
            </DashboardLayout>
          } />
          <Route path="/sales/track-orders" element={
            <DashboardLayout requiredDepartment="sales">
              <OrderTracking />
            </DashboardLayout>
          } />
          <Route path="/sales/track-orders/:orderId" element={
            <DashboardLayout requiredDepartment="sales">
              <OrderDetail />
            </DashboardLayout>
          } />
          <Route path="/sales/price-estimation" element={
            <DashboardLayout requiredDepartment="sales">
              <PriceEstimation />
            </DashboardLayout>
          } />
          <Route path="/sales/price-estimation/add" element={
            <DashboardLayout requiredDepartment="sales">
              <AddPriceEstimation />
            </DashboardLayout>
          } />
          <Route path="/sales/price-estimation/:id" element={
            <DashboardLayout requiredDepartment="sales">
              <PriceEstimationDetail />
            </DashboardLayout>
          } />
          <Route path="/sales/price-estimation/edit/:id" element={
            <DashboardLayout requiredDepartment="sales">
              <AddPriceEstimation />
            </DashboardLayout>
          } />
          <Route path="/sales/inventory" element={
            <DashboardLayout requiredDepartment="sales">
              <SalesInventoryStock />
            </DashboardLayout>
          } />
          <Route path="/sales/product-inventory" element={
            <DashboardLayout requiredDepartment="sales">
              <ProductionProductInventory isSalesMode />
            </DashboardLayout>
          } />
          <Route path="/sales/internal-requests" element={
            <DashboardLayout requiredDepartment="sales">
              <InternalRequisitions />
            </DashboardLayout>
          } />
          <Route path="/sales/settings" element={
            <DashboardLayout requiredDepartment="sales">
              <SalesSettings />
            </DashboardLayout>
          } />
          <Route path="/sales/reports" element={
            <DashboardLayout requiredDepartment="sales">
              <SalesReports />
            </DashboardLayout>
          } />
          <Route path="/status" element={
            <DashboardLayout>
              <StatusOverview />
            </DashboardLayout>
          } />
          <Route path="/design" element={
            <DashboardLayout requiredDepartment="design">
              <DesignMain />
            </DashboardLayout>
          } />
          <Route path="/design/jobs" element={
            <DashboardLayout requiredDepartment="design">
              <JobOrderManagement />
            </DashboardLayout>
          } />
          <Route path="/design/job-tracking" element={
            <DashboardLayout requiredDepartment="design">
              <DesignJobTracking />
            </DashboardLayout>
          } />
          <Route path="/design/tracking" element={
            <DashboardLayout requiredDepartment="design">
              <DesignJobTracking />
            </DashboardLayout>
          } />
          <Route path="/design/materials" element={
            <DashboardLayout requiredDepartment="design">
              <MaterialStock />
            </DashboardLayout>
          } />
          <Route path="/design/reports" element={
            <DashboardLayout requiredDepartment="design">
              <DesignReports />
            </DashboardLayout>
          } />
          <Route path="/procurement" element={
            <DashboardLayout requiredDepartment="procurement">
              <ProcurementMain />
            </DashboardLayout>
          } />
          <Route path="/procurement/dashboard" element={
            <DashboardLayout requiredDepartment="procurement">
              <ProcurementDashboard />
            </DashboardLayout>
          } />
          <Route path="/procurement/estimation" element={
            <DashboardLayout requiredDepartment="procurement">
              <ProcurementPriceEstimation />
            </DashboardLayout>
          } />
          <Route path="/procurement/estimation/quotation" element={
            <DashboardLayout requiredDepartment="procurement">
              <Quotation />
            </DashboardLayout>
          } />
          <Route path="/procurement/estimation/history" element={
            <DashboardLayout requiredDepartment="procurement">
              <PricingHistory />
            </DashboardLayout>
          } />
          <Route path="/procurement/estimation/add" element={
            <DashboardLayout requiredDepartment="procurement">
              <ProcurementAddPriceEstimation />
            </DashboardLayout>
          } />
          <Route path="/procurement/requisitions" element={
            <DashboardLayout requiredDepartment="procurement">
              <ProcurementInternalRequisitions />
            </DashboardLayout>
          } />
          <Route path="/procurement/orders" element={
            <DashboardLayout requiredDepartment="procurement">
              <PurchaseOrders />
            </DashboardLayout>
          } />
          <Route path="/procurement/purchase-requisition" element={
            <DashboardLayout requiredDepartment="procurement">
              <PurchaseRequisition />
            </DashboardLayout>
          } />
          <Route path="/procurement/inventory-stock" element={
            <DashboardLayout requiredDepartment="procurement">
              <ProductionProductInventory isProcurementMode />
            </DashboardLayout>
          } />
          <Route path="/procurement/requisition-center" element={
            <DashboardLayout requiredDepartment="procurement">
              <RequisitionCenter />
            </DashboardLayout>
          } />
          <Route path="/procurement/reports" element={
            <DashboardLayout requiredDepartment="procurement">
              <ProcurementReports />
            </DashboardLayout>
          } />
          <Route path="/procurement/settings" element={
            <DashboardLayout requiredDepartment="procurement">
              <ProcurementSettings />
            </DashboardLayout>
          } />
          <Route path="/procurement/user-manual" element={
            <DashboardLayout requiredDepartment="procurement">
              <ProcurementUserManual />
            </DashboardLayout>
          } />
          <Route path="/production" element={
            <DashboardLayout requiredDepartment="production">
              <ProductionDashboard />
            </DashboardLayout>
          } />
          <Route path="/production/dashboard" element={
            <DashboardLayout requiredDepartment="production">
              <ProductionDashboard />
            </DashboardLayout>
          } />
          <Route path="/production/orders" element={
            <DashboardLayout requiredDepartment="production">
              <OrderManagement />
            </DashboardLayout>
          } />
          <Route path="/production/orders/:orderId" element={
            <DashboardLayout requiredDepartment="production">
              <ProductionOrderDetail />
            </DashboardLayout>
          } />
          <Route path="/production/order-management" element={
            <DashboardLayout requiredDepartment="production">
              <OrderManagement />
            </DashboardLayout>
          } />
          <Route path="/production/employee-tasks" element={
            <DashboardLayout requiredDepartment="production">
              <EmployeeTaskDetails />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-deduct" element={
            <DashboardLayout requiredDepartment="production">
              <InventoryDeduct />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-management" element={
            <DashboardLayout requiredDepartment="production">
              <InventoryManagement />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-dashboard" element={
            <DashboardLayout requiredDepartment="production">
              <InventoryDashboard />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-all" element={
            <DashboardLayout requiredDepartment="production">
              <InventoryAll />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-receive" element={
            <DashboardLayout requiredDepartment="production">
              <InventoryReceive />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-defective" element={
            <DashboardLayout requiredDepartment="production">
              <InventoryAll />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-damaged" element={
            <DashboardLayout requiredDepartment="production">
              <InventoryAll />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-transfer" element={
            <DashboardLayout requiredDepartment="production">
              <InventoryTransfer />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-adjust" element={
            <DashboardLayout requiredDepartment="production">
              <InventoryAdjust />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-history" element={
            <DashboardLayout requiredDepartment="production">
              <InventoryHistory />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-settings" element={
            <DashboardLayout requiredDepartment="production">
              <InventorySettings />
            </DashboardLayout>
          } />
          <Route path="/production/requests-management" element={
            <DashboardLayout requiredDepartment="production">
              <RequestsManagement />
            </DashboardLayout>
          } />
          <Route path="/production/vehicle-management" element={
            <DashboardLayout requiredDepartment="production">
              <VehicleRequestManagement />
            </DashboardLayout>
          } />
          <Route path="/production/vehicle-request/:id" element={
            <DashboardLayout requiredDepartment="production">
              <VehicleRequestDetail />
            </DashboardLayout>
          } />
          <Route path="/production/reports" element={
            <DashboardLayout requiredDepartment="production">
              <ProductionReports />
            </DashboardLayout>
          } />
          <Route path="/production/inventory" element={
            <DashboardLayout requiredDepartment="production">
              <ProductionProductInventory />
            </DashboardLayout>
          } />
          <Route path="/accounting" element={
            <DashboardLayout requiredDepartment="accounting">
              <AccountingDashboard />
            </DashboardLayout>
          } />
          <Route path="/accounting/dashboard" element={
            <DashboardLayout requiredDepartment="accounting">
              <AccountingDashboard />
            </DashboardLayout>
          } />
          <Route path="/accounting/revenue-expenses" element={
            <DashboardLayout requiredDepartment="accounting">
              <RevenueExpenses />
            </DashboardLayout>
          } />
          <Route path="/accounting/work-orders" element={
            <DashboardLayout requiredDepartment="accounting">
              <WorkOrders />
            </DashboardLayout>
          } />
          <Route path="/accounting/revenue" element={
            <DashboardLayout requiredDepartment="accounting">
              <Revenue />
            </DashboardLayout>
          } />
          <Route path="/accounting/expenses" element={
            <DashboardLayout requiredDepartment="accounting">
              <Expenses />
            </DashboardLayout>
          } />
          <Route path="/accounting/customer-accounts" element={
            <DashboardLayout requiredDepartment="accounting">
              <CustomerAccounts />
            </DashboardLayout>
          } />
          <Route path="/accounting/product-inventory" element={
            <DashboardLayout requiredDepartment="accounting">
              <ProductionProductInventory isProcurementMode />
            </DashboardLayout>
          } />
          <Route path="/accounting/office-inventory" element={
            <DashboardLayout requiredDepartment="accounting">
              <OfficeInventory />
            </DashboardLayout>
          } />
          <Route path="/accounting/petty-cash" element={
            <DashboardLayout requiredDepartment="accounting">
              <PettyCash />
            </DashboardLayout>
          } />
          <Route path="/accounting/office-requisitions" element={
            <DashboardLayout requiredDepartment="accounting">
              <OfficeRequisitions />
            </DashboardLayout>
          } />
          <Route path="/accounting/internal-requests" element={
            <DashboardLayout requiredDepartment="accounting">
              <InternalRequests />
            </DashboardLayout>
          } />
          <Route path="/accounting/financial-reports" element={
            <DashboardLayout requiredDepartment="accounting">
              <FinancialReports />
            </DashboardLayout>
          } />
          <Route path="/accounting/reports" element={
            <DashboardLayout requiredDepartment="accounting">
              <ReportsMain />
            </DashboardLayout>
          } />
          <Route path="/accounting/reports/sales" element={
            <DashboardLayout requiredDepartment="accounting">
              <SalesReport />
            </DashboardLayout>
          } />
          <Route path="/accounting/reports/inventory" element={
            <DashboardLayout requiredDepartment="accounting">
              <InventoryReport />
            </DashboardLayout>
          } />
          <Route path="/accounting/reports/office-supplies" element={
            <DashboardLayout requiredDepartment="accounting">
              <OfficeSuppliesReport />
            </DashboardLayout>
          } />
          <Route path="/accounting/reports/office-equipment" element={
            <DashboardLayout requiredDepartment="accounting">
              <OfficeEquipmentReport />
            </DashboardLayout>
          } />
          <Route path="/accounting/reports/petty-cash" element={
            <DashboardLayout requiredDepartment="accounting">
              <PettyCashReport />
            </DashboardLayout>
          } />
          <Route path="/hr" element={
            <DashboardLayout requiredDepartment="hr">
              <HRDashboard />
            </DashboardLayout>
          } />
          <Route path="/hr/dashboard" element={
            <DashboardLayout requiredDepartment="hr">
              <HRDashboard />
            </DashboardLayout>
          } />
          <Route path="/hr/employee-management" element={
            <DashboardLayout requiredDepartment="hr">
              <EmployeeManagement />
            </DashboardLayout>
          } />
          <Route path="/hr/commission-made-to-order" element={
            <DashboardLayout requiredDepartment="hr">
              <CommissionMadeToOrder />
            </DashboardLayout>
          } />
          <Route path="/hr/commission-ready-made" element={
            <DashboardLayout requiredDepartment="hr">
              <CommissionReadyMade />
            </DashboardLayout>
          } />
          <Route path="/hr/settings" element={
            <DashboardLayout requiredDepartment="hr">
              <HRSettings />
            </DashboardLayout>
          } />
          <Route path="/hr/reports" element={
            <DashboardLayout requiredDepartment="hr">
              <HRReports />
            </DashboardLayout>
          } />
          <Route path="/hr/monthly-commission-report" element={
            <DashboardLayout requiredDepartment="hr">
              <MonthlyCommissionReport />
            </DashboardLayout>
          } />
          <Route path="/hr/user-management" element={
            <DashboardLayout requiredDepartment="hr">
              <HRUserManagement />
            </DashboardLayout>
          } />
          <Route path="/manager" element={
            <DashboardLayout requiredDepartment="manager">
              <ExecutiveDashboard />
            </DashboardLayout>
          } />
          <Route path="/manager/users" element={
            <DashboardLayout requiredDepartment="manager">
              <UserManagement />
            </DashboardLayout>
          } />
          <Route path="/manager/settings" element={
            <DashboardLayout requiredDepartment="manager">
              <SystemSettings />
            </DashboardLayout>
          } />
          <Route path="/manager/reports" element={
            <DashboardLayout requiredDepartment="manager">
              <ComprehensiveReports />
            </DashboardLayout>
          } />
          <Route path="/user-manual" element={
            <DashboardLayout>
              <UserManual />
            </DashboardLayout>
          } />
          <Route path="/sales/user-manual" element={
            <DashboardLayout requiredDepartment="sales">
              <UserManual />
            </DashboardLayout>
          } />
          <Route path="/design/user-manual" element={
            <DashboardLayout requiredDepartment="design">
              <UserManual />
            </DashboardLayout>
          } />
          <Route path="/production/user-manual" element={
            <DashboardLayout requiredDepartment="production">
              <UserManual />
            </DashboardLayout>
          } />
          <Route path="/accounting/user-manual" element={
            <DashboardLayout requiredDepartment="accounting">
              <UserManual />
            </DashboardLayout>
          } />
          <Route path="/hr/user-manual" element={
            <DashboardLayout requiredDepartment="hr">
              <UserManual />
            </DashboardLayout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
