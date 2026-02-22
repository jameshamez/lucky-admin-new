import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

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
import ProductionReports from "./pages/production/ProductionReports";
import ProductionProductInventory from "./pages/production/ProductInventory";
import DepartmentSelection from "./pages/DepartmentSelection";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DepartmentSelection />} />
          <Route path="/petty-cash" element={
            <DashboardLayout>
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
            <DashboardLayout>
              <SalesMain />
            </DashboardLayout>
          } />
          <Route path="/sales/customers" element={
            <DashboardLayout>
              <CustomerManagement />
            </DashboardLayout>
          } />
          <Route path="/sales/customers/:id" element={
            <DashboardLayout>
              <CustomerProfile />
            </DashboardLayout>
          } />
          <Route path="/sales/create-order" element={
            <DashboardLayout>
              <CreateOrder />
            </DashboardLayout>
          } />
          <Route path="/sales/production-order" element={
            <DashboardLayout>
              <ProductionOrder />
            </DashboardLayout>
          } />
          <Route path="/sales/track-orders" element={
            <DashboardLayout>
              <OrderTracking />
            </DashboardLayout>
          } />
          <Route path="/sales/track-orders/:orderId" element={
            <DashboardLayout>
              <OrderDetail />
            </DashboardLayout>
          } />
          <Route path="/sales/price-estimation" element={
            <DashboardLayout>
              <PriceEstimation />
            </DashboardLayout>
          } />
          <Route path="/sales/price-estimation/add" element={
            <DashboardLayout>
              <AddPriceEstimation />
            </DashboardLayout>
          } />
          <Route path="/sales/price-estimation/:id" element={
            <DashboardLayout>
              <PriceEstimationDetail />
            </DashboardLayout>
          } />
          <Route path="/sales/price-estimation/edit/:id" element={
            <DashboardLayout>
              <AddPriceEstimation />
            </DashboardLayout>
          } />
          <Route path="/sales/inventory" element={
            <DashboardLayout>
              <SalesInventoryStock />
            </DashboardLayout>
          } />
          <Route path="/sales/product-inventory" element={
            <DashboardLayout>
              <ProductionProductInventory isSalesMode />
            </DashboardLayout>
          } />
          <Route path="/sales/internal-requests" element={
            <DashboardLayout>
              <InternalRequisitions />
            </DashboardLayout>
          } />
          <Route path="/sales/settings" element={
            <DashboardLayout>
              <SalesSettings />
            </DashboardLayout>
          } />
          <Route path="/sales/reports" element={
            <DashboardLayout>
              <SalesReports />
            </DashboardLayout>
          } />
          <Route path="/status" element={
            <DashboardLayout>
              <StatusOverview />
            </DashboardLayout>
          } />
          <Route path="/design" element={
            <DashboardLayout>
              <DesignMain />
            </DashboardLayout>
          } />
          <Route path="/design/jobs" element={
            <DashboardLayout>
              <JobOrderManagement />
            </DashboardLayout>
          } />
          <Route path="/design/job-tracking" element={
            <DashboardLayout>
              <DesignJobTracking />
            </DashboardLayout>
          } />
          <Route path="/design/tracking" element={
            <DashboardLayout>
              <DesignJobTracking />
            </DashboardLayout>
          } />
          <Route path="/design/materials" element={
            <DashboardLayout>
              <MaterialStock />
            </DashboardLayout>
          } />
          <Route path="/design/reports" element={
            <DashboardLayout>
              <DesignReports />
            </DashboardLayout>
          } />
          <Route path="/procurement" element={
            <DashboardLayout>
              <ProcurementMain />
            </DashboardLayout>
          } />
          <Route path="/procurement/dashboard" element={
            <DashboardLayout>
              <ProcurementDashboard />
            </DashboardLayout>
          } />
          <Route path="/procurement/estimation" element={
            <DashboardLayout>
              <ProcurementPriceEstimation />
            </DashboardLayout>
          } />
          <Route path="/procurement/estimation/quotation" element={
            <DashboardLayout>
              <Quotation />
            </DashboardLayout>
          } />
          <Route path="/procurement/estimation/history" element={
            <DashboardLayout>
              <PricingHistory />
            </DashboardLayout>
          } />
          <Route path="/procurement/estimation/add" element={
            <DashboardLayout>
              <ProcurementAddPriceEstimation />
            </DashboardLayout>
          } />
          <Route path="/procurement/requisitions" element={
            <DashboardLayout>
              <ProcurementInternalRequisitions />
            </DashboardLayout>
          } />
          <Route path="/procurement/orders" element={
            <DashboardLayout>
              <PurchaseOrders />
            </DashboardLayout>
          } />
          <Route path="/procurement/purchase-requisition" element={
            <DashboardLayout>
              <PurchaseRequisition />
            </DashboardLayout>
          } />
          <Route path="/procurement/inventory-stock" element={
            <DashboardLayout>
              <ProductionProductInventory isProcurementMode />
            </DashboardLayout>
          } />
          <Route path="/procurement/requisition-center" element={
            <DashboardLayout>
              <RequisitionCenter />
            </DashboardLayout>
          } />
          <Route path="/procurement/reports" element={
            <DashboardLayout>
              <ProcurementReports />
            </DashboardLayout>
          } />
          <Route path="/procurement/settings" element={
            <DashboardLayout>
              <ProcurementSettings />
            </DashboardLayout>
          } />
          <Route path="/procurement/user-manual" element={
            <DashboardLayout>
              <ProcurementUserManual />
            </DashboardLayout>
          } />
          <Route path="/production" element={
            <DashboardLayout>
              <ProductionDashboard />
            </DashboardLayout>
          } />
          <Route path="/production/dashboard" element={
            <DashboardLayout>
              <ProductionDashboard />
            </DashboardLayout>
          } />
          <Route path="/production/orders" element={
            <DashboardLayout>
              <OrderManagement />
            </DashboardLayout>
          } />
          <Route path="/production/orders/:orderId" element={
            <DashboardLayout>
              <ProductionOrderDetail />
            </DashboardLayout>
          } />
          <Route path="/production/order-management" element={
            <DashboardLayout>
              <OrderManagement />
            </DashboardLayout>
          } />
          <Route path="/production/employee-tasks" element={
            <DashboardLayout>
              <EmployeeTaskDetails />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-deduct" element={
            <DashboardLayout>
              <InventoryDeduct />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-management" element={
            <DashboardLayout>
              <InventoryManagement />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-dashboard" element={
            <DashboardLayout>
              <InventoryDashboard />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-all" element={
            <DashboardLayout>
              <InventoryAll />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-receive" element={
            <DashboardLayout>
              <InventoryReceive />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-defective" element={
            <DashboardLayout>
              <InventoryAll />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-damaged" element={
            <DashboardLayout>
              <InventoryAll />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-transfer" element={
            <DashboardLayout>
              <InventoryTransfer />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-adjust" element={
            <DashboardLayout>
              <InventoryAdjust />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-history" element={
            <DashboardLayout>
              <InventoryHistory />
            </DashboardLayout>
          } />
          <Route path="/production/inventory-settings" element={
            <DashboardLayout>
              <InventorySettings />
            </DashboardLayout>
          } />
          <Route path="/production/requests-management" element={
            <DashboardLayout>
              <RequestsManagement />
            </DashboardLayout>
          } />
          <Route path="/production/vehicle-management" element={
            <DashboardLayout>
              <VehicleRequestManagement />
            </DashboardLayout>
          } />
          <Route path="/production/reports" element={
            <DashboardLayout>
              <ProductionReports />
            </DashboardLayout>
          } />
          <Route path="/production/inventory" element={
            <DashboardLayout>
              <ProductionProductInventory />
            </DashboardLayout>
          } />
          <Route path="/accounting" element={
            <DashboardLayout>
              <AccountingDashboard />
            </DashboardLayout>
          } />
          <Route path="/accounting/dashboard" element={
            <DashboardLayout>
              <AccountingDashboard />
            </DashboardLayout>
          } />
          <Route path="/accounting/revenue-expenses" element={
            <DashboardLayout>
              <RevenueExpenses />
            </DashboardLayout>
          } />
          <Route path="/accounting/work-orders" element={
            <DashboardLayout>
              <WorkOrders />
            </DashboardLayout>
          } />
          <Route path="/accounting/revenue" element={
            <DashboardLayout>
              <Revenue />
            </DashboardLayout>
          } />
          <Route path="/accounting/expenses" element={
            <DashboardLayout>
              <Expenses />
            </DashboardLayout>
          } />
          <Route path="/accounting/customer-accounts" element={
            <DashboardLayout>
              <CustomerAccounts />
            </DashboardLayout>
          } />
          <Route path="/accounting/product-inventory" element={
            <DashboardLayout>
              <ProductionProductInventory isProcurementMode />
            </DashboardLayout>
          } />
          <Route path="/accounting/office-inventory" element={
            <DashboardLayout>
              <OfficeInventory />
            </DashboardLayout>
          } />
          <Route path="/accounting/petty-cash" element={
            <DashboardLayout>
              <PettyCash />
            </DashboardLayout>
          } />
          <Route path="/accounting/office-requisitions" element={
            <DashboardLayout>
              <OfficeRequisitions />
            </DashboardLayout>
          } />
          <Route path="/accounting/internal-requests" element={
            <DashboardLayout>
              <InternalRequests />
            </DashboardLayout>
          } />
          <Route path="/accounting/financial-reports" element={
            <DashboardLayout>
              <FinancialReports />
            </DashboardLayout>
          } />
          <Route path="/accounting/reports" element={
            <DashboardLayout>
              <ReportsMain />
            </DashboardLayout>
          } />
          <Route path="/accounting/reports/sales" element={
            <DashboardLayout>
              <SalesReport />
            </DashboardLayout>
          } />
          <Route path="/accounting/reports/inventory" element={
            <DashboardLayout>
              <InventoryReport />
            </DashboardLayout>
          } />
          <Route path="/accounting/reports/office-supplies" element={
            <DashboardLayout>
              <OfficeSuppliesReport />
            </DashboardLayout>
          } />
          <Route path="/accounting/reports/office-equipment" element={
            <DashboardLayout>
              <OfficeEquipmentReport />
            </DashboardLayout>
          } />
          <Route path="/accounting/reports/petty-cash" element={
            <DashboardLayout>
              <PettyCashReport />
            </DashboardLayout>
          } />
          <Route path="/hr" element={
            <DashboardLayout>
              <HRDashboard />
            </DashboardLayout>
          } />
          <Route path="/hr/dashboard" element={
            <DashboardLayout>
              <HRDashboard />
            </DashboardLayout>
          } />
          <Route path="/hr/employee-management" element={
            <DashboardLayout>
              <EmployeeManagement />
            </DashboardLayout>
          } />
          <Route path="/hr/commission-made-to-order" element={
            <DashboardLayout>
              <CommissionMadeToOrder />
            </DashboardLayout>
          } />
          <Route path="/hr/commission-ready-made" element={
            <DashboardLayout>
              <CommissionReadyMade />
            </DashboardLayout>
          } />
          <Route path="/hr/settings" element={
            <DashboardLayout>
              <HRSettings />
            </DashboardLayout>
          } />
          <Route path="/hr/reports" element={
            <DashboardLayout>
              <HRReports />
            </DashboardLayout>
          } />
          <Route path="/hr/monthly-commission-report" element={
            <DashboardLayout>
              <MonthlyCommissionReport />
            </DashboardLayout>
          } />
          <Route path="/manager" element={
            <DashboardLayout>
              <ExecutiveDashboard />
            </DashboardLayout>
          } />
          <Route path="/manager/users" element={
            <DashboardLayout>
              <UserManagement />
            </DashboardLayout>
          } />
          <Route path="/manager/settings" element={
            <DashboardLayout>
              <SystemSettings />
            </DashboardLayout>
          } />
          <Route path="/manager/reports" element={
            <DashboardLayout>
              <ComprehensiveReports />
            </DashboardLayout>
          } />
          <Route path="/user-manual" element={
            <DashboardLayout>
              <UserManual />
            </DashboardLayout>
          } />
          <Route path="/sales/user-manual" element={
            <DashboardLayout>
              <UserManual />
            </DashboardLayout>
          } />
          <Route path="/design/user-manual" element={
            <DashboardLayout>
              <UserManual />
            </DashboardLayout>
          } />
          <Route path="/production/user-manual" element={
            <DashboardLayout>
              <UserManual />
            </DashboardLayout>
          } />
          <Route path="/accounting/user-manual" element={
            <DashboardLayout>
              <UserManual />
            </DashboardLayout>
          } />
          <Route path="/hr/user-manual" element={
            <DashboardLayout>
              <UserManual />
            </DashboardLayout>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
