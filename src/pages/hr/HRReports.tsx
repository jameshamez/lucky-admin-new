import { useState, useEffect, useMemo } from "react";
import { hrService } from "@/services/hrService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Award, Users, DollarSign, Settings2, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { defaultEmployees, type Employee, type EmployeeRole, type EmployeeStatus } from "@/lib/employeeData";
import { mockTransactions, monthLabels, type CommissionTransaction } from "@/components/hr-reports/reportMockData";
import GrandOverviewTab from "@/components/hr-reports/GrandOverviewTab";
import KPIPerformanceTab from "@/components/hr-reports/KPIPerformanceTab";
import HRTurnoverTab from "@/components/hr-reports/HRTurnoverTab";
import FinancialBreakdownTab from "@/components/hr-reports/FinancialBreakdownTab";
import TransactionManagementTab from "@/components/hr-reports/TransactionManagementTab";

const months = Object.entries(monthLabels).map(([value, label]) => ({ value, label }));
const years = [
  { value: "2024", label: "2567" },
  { value: "2025", label: "2568" },
  { value: "2026", label: "2569" },
];

export default function HRReports() {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedMonthNum, setSelectedMonthNum] = useState("01");
  const selectedMonth = `${selectedYear}-${selectedMonthNum}`;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [transactions, setTransactions] = useState<CommissionTransaction[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, reportRes] = await Promise.all([
        hrService.getEmployees(),
        hrService.getHRReports(selectedMonthNum, selectedYear)
      ]);

      if (empRes.status === 'success') {
        setEmployees(empRes.data.map((d: any) => ({
          id: d.code || d.id,
          fullName: d.fullName,
          nickname: d.nickname,
          position: d.position,
          role: d.role as EmployeeRole,
          status: d.status as EmployeeStatus,
        })));
      }

      if (reportRes.status === 'success') {
        setTransactions(reportRes.data.transactions || []);
        setReportData(reportRes.data);
      }
    } catch (error) {
      console.error(error);
      // toast.error("ไม่สามารถโหลดข้อมูลรายงานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedMonthNum, selectedYear]);

  // Derived state for movements and targets from reportData
  const employeeMovements = useMemo(() => reportData?.movements || [], [reportData]);
  const salesTargets = useMemo(() => reportData?.targets || [], [reportData]);
  const kpiRecords = useMemo(() => reportData?.kpi || [], [reportData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ศูนย์รวมรายงาน HR</h1>
          <p className="text-muted-foreground">Unified Report & Management Center</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonthNum} onValueChange={setSelectedMonthNum}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="เดือน" />
            </SelectTrigger>
            <SelectContent>
              {months.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="ปี" />
            </SelectTrigger>
            <SelectContent>
              {years.map(y => (
                <SelectItem key={y.value} value={y.value}>{y.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <TrendingUp className="h-10 w-10 animate-pulse text-primary" />
          <p className="text-muted-foreground animate-pulse">กำลังโหลดข้อมูลรายงาน...</p>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4 hidden sm:block" />
              ภาพรวม
            </TabsTrigger>
            <TabsTrigger value="kpi" className="gap-1.5 text-xs sm:text-sm">
              <Award className="h-4 w-4 hidden sm:block" />
              KPI
            </TabsTrigger>
            <TabsTrigger value="turnover" className="gap-1.5 text-xs sm:text-sm">
              <Users className="h-4 w-4 hidden sm:block" />
              บุคลากร
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-1.5 text-xs sm:text-sm">
              <DollarSign className="h-4 w-4 hidden sm:block" />
              การเงิน
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-1.5 text-xs sm:text-sm">
              <Settings2 className="h-4 w-4 hidden sm:block" />
              จัดการข้อมูล
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <GrandOverviewTab
              transactions={transactions}
              employees={employees}
              selectedMonth={selectedMonth}
            />
          </TabsContent>

          <TabsContent value="kpi">
            <KPIPerformanceTab
              transactions={transactions}
              employees={employees}
              salesTargets={salesTargets}
              kpiRecords={kpiRecords}
              selectedMonth={selectedMonth}
            />
          </TabsContent>

          <TabsContent value="turnover">
            <HRTurnoverTab
              employees={employees}
              employeeMovements={employeeMovements}
              selectedMonth={selectedMonth}
            />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialBreakdownTab
              transactions={transactions}
              employees={employees}
              selectedMonth={selectedMonth}
            />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionManagementTab
              transactions={transactions}
              onTransactionsChange={setTransactions}
              employees={employees}
              selectedMonth={selectedMonth}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
