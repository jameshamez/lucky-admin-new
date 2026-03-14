import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { accountingService } from "@/services/accountingService";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  Plus,
  Download,
  Eye,
  DollarSign,
  FileCheck,
  ClipboardList,
  MessageSquare,
  UserCheck,
  Calendar,
  ChevronRight,
  History
} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";


// COLORS used for charts
const AR_COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export default function CustomerAccounts() {
  const [accountsReceivable, setAccountsReceivable] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accountingEmployees, setAccountingEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetchAccounts();
    fetchAccountingEmployees();
  }, []);

  const fetchAccountingEmployees = async () => {
    try {
      const response = await accountingService.getEmployees({ department: 'ฝ่ายบัญชี' });
      if (response.status === "success") {
        setAccountingEmployees(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await accountingService.getCustomerAccounts();
      if (response.status === "success") {
        const mappedData = response.data.map((acc: any) => ({
          ...acc,
          customer: acc.customer_name,
          invoiceNumber: acc.invoice_number,
          invoiceDate: acc.invoice_date,
          dueDate: acc.due_date,
          totalAmount: Number(acc.total_amount),
          paidAmount: Number(acc.paid_amount),
          remainingAmount: Number(acc.remaining_amount),
          daysOverdue: Number(acc.days_overdue),
          accountManager: acc.account_manager,
          followUpNote: acc.follow_up_note,
        }));
        setAccountsReceivable(mappedData);
        setSummaryData(response.summary);
        setMonthlyData(response.monthly);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      toast.error("ไม่สามารถโหลดข้อมูลลูกหนี้ได้");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccountDetails = async (id: number | string) => {
    try {
      const response = await accountingService.getCustomerAccountDetails(id);
      if (response.status === "success") {
        const acc = response.data;
        const mappedAcc = {
          ...acc,
          customer: acc.customer_name,
          invoiceNumber: acc.invoice_number,
          invoiceDate: acc.invoice_date,
          dueDate: acc.due_date,
          totalAmount: Number(acc.total_amount),
          paidAmount: Number(acc.paid_amount),
          remainingAmount: Number(acc.remaining_amount),
          daysOverdue: Number(acc.days_overdue),
          accountManager: acc.account_manager,
          followUpNote: acc.follow_up_note,
          followUpHistory: acc.follow_up_history.map((h: any) => ({
            id: h.id,
            date: h.follow_up_date,
            channel: h.channel,
            detail: h.detail,
            nextDate: h.next_follow_up_date,
            user: h.user_name
          }))
        };
        setSelectedAccount(mappedAcc);
        setShowDetailDialog(true);
      }
    } catch (error) {
      console.error("Failed to fetch account details:", error);
      toast.error("ไม่สามารถโหลดรายละเอียดได้");
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAccountData, setNewAccountData] = useState({
    customer_name: "",
    invoice_number: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    total_amount: 0,
    paid_amount: 0,
    status: "รอชำระ",
    account_manager: ""
  });

  const handleAddAccount = async () => {
    try {
      const response = await accountingService.saveCustomerAccount(newAccountData);
      if (response.status === "success") {
        toast.success("เพิ่มข้อมูลลูกหนี้เรียบร้อย");
        setShowAddDialog(false);
        fetchAccounts();
        setNewAccountData({
          customer_name: "",
          invoice_number: "",
          invoice_date: new Date().toISOString().split("T")[0],
          due_date: "",
          total_amount: 0,
          paid_amount: 0,
          status: "รอชำระ",
          account_manager: ""
        });
      }
    } catch (error) {
      toast.error("ไม่สามารถเพิ่มข้อมูลได้");
    }
  };

  const [followUpData, setFollowUpData] = useState({
    date: new Date().toISOString().split("T")[0],
    channel: "โทรศัพท์",
    detail: "",
    nextDate: "",
    user: ""
  });

  const handleAddFollowUp = async () => {
    if (!selectedAccount) return;
    try {
      const payload = {
        ar_id: selectedAccount.id,
        follow_up_date: followUpData.date,
        channel: followUpData.channel,
        detail: followUpData.detail,
        next_follow_up_date: followUpData.nextDate,
        user_name: followUpData.user
      };
      const response = await accountingService.addFollowUp(payload);
      if (response.status === "success") {
        toast.success("บันทึกการติดตามเรียบร้อย");
        setShowFollowUpDialog(false);
        fetchAccountDetails(selectedAccount.id); // Refresh details
        fetchAccounts(); // Refresh list
      }
    } catch (error) {
      toast.error("ไม่สามารถบันทึกข้อมูลได้");
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!selectedAccount) return;
    try {
      const payload = {
        ...selectedAccount,
        status: newStatus,
        customer_name: selectedAccount.customer,
        invoice_number: selectedAccount.invoiceNumber,
        invoice_date: selectedAccount.invoiceDate,
        due_date: selectedAccount.dueDate,
        total_amount: selectedAccount.totalAmount,
        paid_amount: selectedAccount.paidAmount,
        account_manager: selectedAccount.accountManager
      };
      const response = await accountingService.saveCustomerAccount(payload);
      if (response.status === "success") {
        toast.success("อัปเดตสถานะเรียบร้อย");
        fetchAccountDetails(selectedAccount.id);
        fetchAccounts();
      }
    } catch (error) {
      toast.error("ไม่สามารถอัปเดตสถานะได้");
    }
  };
  const [paymentData, setPaymentData] = useState({
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    method: "โอนเงิน",
    remark: ""
  });

  const handlePayment = async () => {
    if (!selectedAccount) return;
    try {
      const newPaidAmount = Number(selectedAccount.paidAmount) + Number(paymentData.amount);
      const newStatus = newPaidAmount >= selectedAccount.totalAmount ? "ชำระเสร็จสิ้น" : "ค้างชำระ";

      const payload = {
        ...selectedAccount,
        customer_name: selectedAccount.customer,
        invoice_number: selectedAccount.invoiceNumber,
        invoice_date: selectedAccount.invoiceDate,
        due_date: selectedAccount.dueDate,
        total_amount: selectedAccount.totalAmount,
        paid_amount: newPaidAmount,
        status: newStatus,
        account_manager: selectedAccount.accountManager
      };

      const response = await accountingService.saveCustomerAccount(payload);
      if (response.status === "success") {
        // Also add a follow-up record for the payment
        await accountingService.addFollowUp({
          ar_id: selectedAccount.id,
          follow_up_date: paymentData.date,
          channel: "ชำระเงิน",
          detail: `ชำระเงินจำนวน ฿${Number(paymentData.amount).toLocaleString()} ผ่าน${paymentData.method}. ${paymentData.remark}`,
          user_name: "System"
        });

        toast.success("บันทึกการชำระเงินเรียบร้อย");
        setShowPaymentDialog(false);
        fetchAccounts();
      }
    } catch (error) {
      toast.error("ไม่สามารถบันทึกการชำระเงินได้");
    }
  };
  const totalAccounts = summaryData?.total_accounts || accountsReceivable.length;
  const totalReceivable = summaryData?.total_receivable || accountsReceivable.reduce((sum, item) => sum + item.remainingAmount, 0);
  const overdueCount = summaryData?.overdue_count || accountsReceivable.filter(item => item.daysOverdue > 30).length;
  const overduePercentage = totalAccounts > 0 ? ((overdueCount / totalAccounts) * 100).toFixed(1) : "0.0";
  const completedCount = summaryData?.completed_count || accountsReceivable.filter(item => item.status === "ชำระเสร็จสิ้น").length;

  // Status distribution for pie chart
  const statusData = [
    { name: "ชำระเสร็จสิ้น", value: accountsReceivable.filter(a => a.status === "ชำระเสร็จสิ้น").length },
    { name: "รอชำระ", value: accountsReceivable.filter(a => a.status === "รอชำระ").length },
    { name: "ค้างชำระ", value: accountsReceivable.filter(a => a.status === "ค้างชำระ").length },
  ];

  // Filter accounts
  const filteredAccounts = accountsReceivable.filter(account => {
    const matchesSearch = (account.customer?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (account.invoiceNumber?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    const matchesOverdue = filterOverdue ? account.daysOverdue > 0 : true;
    return matchesSearch && matchesOverdue;
  });

  const getStatusBadge = (status: string) => {
    if (status === "ชำระเสร็จสิ้น") return "default";
    if (status === "รอชำระ") return "secondary";
    return "destructive";
  };

  const getStatusIcon = (status: string) => {
    if (status === "ชำระเสร็จสิ้น") return "🟢";
    if (status === "รอชำระ") return "🟡";
    return "🔴";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">การจัดการลูกหนี้</h1>
          <p className="text-muted-foreground">ตรวจสอบสถานะการชำระเงินของลูกค้า และติดตามลูกหนี้คงค้าง</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
          <Button className="bg-gradient-to-r from-primary to-primary-hover" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มลูกหนี้
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลูกหนี้ทั้งหมด</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAccounts}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ยอดค้างชำระรวม</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{totalReceivable.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">THB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ลูกหนี้เกิน 30 วัน</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">{overduePercentage}% ของทั้งหมด</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ชำระเสร็จสิ้น</CardTitle>
            <FileCheck className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{completedCount}</div>
            <p className="text-xs text-muted-foreground">รายการ</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ยอดลูกหนี้คงค้างย้อนหลัง 12 เดือน</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="hsl(var(--primary))" name="ยอดคงค้าง (฿)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>สัดส่วนลูกหนี้ตามสถานะ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={AR_COLORS[index % AR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="ค้นหาชื่อลูกค้า หรือเลขที่ใบแจ้งหนี้..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant={filterOverdue ? "default" : "outline"}
          onClick={() => setFilterOverdue(!filterOverdue)}
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          ค้างชำระเท่านั้น
        </Button>
      </div>

      {/* Accounts Receivable Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการลูกหนี้</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ชื่อลูกค้า</TableHead>
                  <TableHead>เลขที่ใบแจ้งหนี้</TableHead>
                  <TableHead>วันที่ออกใบ</TableHead>
                  <TableHead>วันครบกำหนด</TableHead>
                  <TableHead>ยอดรวม</TableHead>
                  <TableHead>ชำระแล้ว</TableHead>
                  <TableHead>ยอดคงค้าง</TableHead>
                  <TableHead>เกินกำหนด (วัน)</TableHead>
                  <TableHead>ผู้ดูแล</TableHead>
                  <TableHead>การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <Badge variant={getStatusBadge(account.status)}>
                        {getStatusIcon(account.status)} {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{account.customer}</TableCell>
                    <TableCell className="text-sm">{account.invoiceNumber}</TableCell>
                    <TableCell className="text-sm">{account.invoiceDate}</TableCell>
                    <TableCell className="text-sm">{account.dueDate}</TableCell>
                    <TableCell className="font-semibold">฿{account.totalAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-success">฿{account.paidAmount.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold text-destructive">
                      ฿{account.remainingAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {account.daysOverdue > 0 ? (
                        <span className="text-destructive font-semibold">{account.daysOverdue}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{account.accountManager}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            fetchAccountDetails(account.id);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowPaymentDialog(true);
                          }}
                          title="ชำระเงิน"
                        >
                          <DollarSign className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedAccount(account);
                            setShowFollowUpDialog(true);
                          }}
                        >
                          <ClipboardList className="w-4 h-4" />
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>รายละเอียดลูกหนี้</DialogTitle>
            <DialogDescription>
              {selectedAccount?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">ชื่อลูกค้า</Label>
                    <p className="font-semibold">{selectedAccount.customer}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">เลขที่ใบแจ้งหนี้</Label>
                    <p className="font-semibold">{selectedAccount.invoiceNumber}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">วันที่ออกใบ</Label>
                    <p>{selectedAccount.invoiceDate}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">วันครบกำหนด</Label>
                    <p>{selectedAccount.dueDate}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ยอดรวม</Label>
                    <p className="text-lg font-bold">฿{selectedAccount.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ชำระแล้ว</Label>
                    <p className="text-lg font-bold text-success">฿{selectedAccount.paidAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ยอดคงค้าง</Label>
                    <p className={`text-lg font-bold ${selectedAccount.remainingAmount > 0 ? "text-destructive" : "text-success"}`}>
                      ฿{selectedAccount.remainingAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">สถานะ</Label>
                    <Badge variant={getStatusBadge(selectedAccount.status)}>
                      {getStatusIcon(selectedAccount.status)} {selectedAccount.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">เกินกำหนด</Label>
                    <p className={selectedAccount.daysOverdue > 0 ? "text-destructive font-semibold" : ""}>
                      {selectedAccount.daysOverdue > 0 ? `${selectedAccount.daysOverdue} วัน` : "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ผู้ดูแลบัญชี</Label>
                    <p>{selectedAccount.accountManager}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-muted-foreground">หมายเหตุการติดตาม</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md">{selectedAccount.followUpNote}</p>
                </div>

                {/* ═══ Follow-up History Timeline ═══ */}
                <Separator />
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-2 mb-4">
                    <History className="h-4 w-4" /> ประวัติการติดตามลูกหนี้
                  </h3>

                  {selectedAccount.followUpHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">ยังไม่มีประวัติการติดตาม</p>
                  ) : (
                    <div className="relative pl-8 space-y-0">
                      {/* Timeline line */}
                      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

                      {selectedAccount.followUpHistory.map((entry, idx) => {
                        const channelIcon = entry.channel === "โทรศัพท์" ? <Phone className="h-3.5 w-3.5" />
                          : entry.channel === "อีเมล" ? <Mail className="h-3.5 w-3.5" />
                            : entry.channel === "LINE" ? <MessageSquare className="h-3.5 w-3.5" />
                              : <UserCheck className="h-3.5 w-3.5" />;

                        const dotColor = idx === 0 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))";

                        return (
                          <div key={entry.id} className="relative pb-6 last:pb-0">
                            {/* Dot */}
                            <div
                              className="absolute -left-8 w-[30px] h-[30px] rounded-full flex items-center justify-center text-white z-10"
                              style={{ backgroundColor: dotColor }}
                            >
                              {channelIcon}
                            </div>

                            <div className="ml-4 p-3 rounded-lg border bg-card">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{entry.channel}</Badge>
                                  <span className="text-xs text-muted-foreground">โดย {entry.user}</span>
                                </div>
                                <span className="text-xs text-muted-foreground font-mono">{entry.date}</span>
                              </div>
                              <p className="text-sm mt-1">{entry.detail}</p>
                              {entry.nextDate && (
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>นัดติดตามครั้งถัดไป: <strong className="text-foreground">{entry.nextDate}</strong></span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มการชำระเงิน</DialogTitle>
            <DialogDescription>
              {selectedAccount?.customer} - {selectedAccount?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>วันที่ชำระ</Label>
              <Input type="date" value={paymentData.date} onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })} />
            </div>
            <div>
              <Label>จำนวนเงิน (THB)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>วิธีการชำระ</Label>
              <Select value={paymentData.method} onValueChange={(v) => setPaymentData({ ...paymentData, method: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกวิธีการชำระ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="โอนเงิน">โอนเงิน</SelectItem>
                  <SelectItem value="เงินสด">เงินสด</SelectItem>
                  <SelectItem value="เช็ค">เช็ค</SelectItem>
                  <SelectItem value="บัตรเครดิต">บัตรเครดิต</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>แนบสลิป</Label>
              <Input type="file" />
            </div>
            <div>
              <Label>หมายเหตุ</Label>
              <Textarea
                placeholder="หมายเหตุเพิ่มเติม..."
                value={paymentData.remark}
                onChange={(e) => setPaymentData({ ...paymentData, remark: e.target.value })}
              />
            </div>
            <Button className="w-full" onClick={handlePayment}>บันทึกการชำระเงิน</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Follow Up Dialog */}
      <Dialog open={showFollowUpDialog} onOpenChange={setShowFollowUpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่มบันทึกติดตาม</DialogTitle>
            <DialogDescription>
              {selectedAccount?.customer} - {selectedAccount?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>วันที่ติดตาม</Label>
              <Input type="date" value={followUpData.date} onChange={(e) => setFollowUpData({ ...followUpData, date: e.target.value })} />
            </div>
            <div>
              <Label>ช่องทางการติดตาม</Label>
              <Select value={followUpData.channel} onValueChange={(v) => setFollowUpData({ ...followUpData, channel: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกช่องทาง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="โทรศัพท์">โทรศัพท์</SelectItem>
                  <SelectItem value="อีเมล">อีเมล</SelectItem>
                  <SelectItem value="LINE">LINE</SelectItem>
                  <SelectItem value="เข้าพบ">เข้าพบ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>รายละเอียดการติดตาม</Label>
              <Textarea
                placeholder="บันทึกรายละเอียดการติดตาม..."
                rows={4}
                value={followUpData.detail}
                onChange={(e) => setFollowUpData({ ...followUpData, detail: e.target.value })}
              />
            </div>
            <div>
              <Label>วันนัดชำระ (ถ้ามี)</Label>
              <Input type="date" value={followUpData.nextDate} onChange={(e) => setFollowUpData({ ...followUpData, nextDate: e.target.value })} />
            </div>
            <div>
              <Label>ผู้บันทึก</Label>
              <Select
                value={followUpData.user}
                onValueChange={(v) => setFollowUpData({ ...followUpData, user: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกผู้บันทึก" />
                </SelectTrigger>
                <SelectContent>
                  {accountingEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.full_name}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddFollowUp}>บันทึกการติดตาม</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มข้อมูลลูกหนี้ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ชื่อลูกค้า</Label>
              <Input
                value={newAccountData.customer_name}
                onChange={(e) => setNewAccountData({ ...newAccountData, customer_name: e.target.value })}
                placeholder="ชื่อบริษัท หรือ ชื่อลูกค้า"
              />
            </div>
            <div>
              <Label>เลขที่ใบแจ้งหนี้</Label>
              <Input
                value={newAccountData.invoice_number}
                onChange={(e) => setNewAccountData({ ...newAccountData, invoice_number: e.target.value })}
                placeholder="INV-XXXX-XXX"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>วันที่ออกใบ</Label>
                <Input
                  type="date"
                  value={newAccountData.invoice_date}
                  onChange={(e) => setNewAccountData({ ...newAccountData, invoice_date: e.target.value })}
                />
              </div>
              <div>
                <Label>วันครบกำหนด</Label>
                <Input
                  type="date"
                  value={newAccountData.due_date}
                  onChange={(e) => setNewAccountData({ ...newAccountData, due_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ยอดรวม (THB)</Label>
                <Input
                  type="number"
                  value={newAccountData.total_amount}
                  onChange={(e) => setNewAccountData({ ...newAccountData, total_amount: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>ชำระแล้ว (THB)</Label>
                <Input
                  type="number"
                  value={newAccountData.paid_amount}
                  onChange={(e) => setNewAccountData({ ...newAccountData, paid_amount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>สถานะ</Label>
              <Select value={newAccountData.status} onValueChange={(v) => setNewAccountData({ ...newAccountData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="รอชำระ">รอชำระ</SelectItem>
                  <SelectItem value="ค้างชำระ">ค้างชำระ</SelectItem>
                  <SelectItem value="ชำระเสร็จสิ้น">ชำระเสร็จสิ้น</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ผู้ดูแลบัญชี</Label>
              <Select
                value={newAccountData.account_manager}
                onValueChange={(v) => setNewAccountData({ ...newAccountData, account_manager: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกผู้ดูแล" />
                </SelectTrigger>
                <SelectContent>
                  {accountingEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.full_name}>
                      {emp.full_name} ({emp.nickname || emp.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddAccount}>บันทึกข้อมูล</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}