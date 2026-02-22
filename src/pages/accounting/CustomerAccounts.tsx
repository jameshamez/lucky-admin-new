import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const accountsReceivable = [
  {
    id: "AR-001",
    customer: "บริษัท ABC จำกัด",
    invoiceNumber: "INV-2024-001",
    invoiceDate: "2024-01-10",
    dueDate: "2024-01-25",
    totalAmount: 75000,
    paidAmount: 25000,
    remainingAmount: 50000,
    status: "ค้างชำระ",
    daysOverdue: 35,
    followUpNote: "โทรติดตามแล้ว 2 ครั้ง รอยืนยันวันชำระ",
    accountManager: "คุณสมชาย",
    lastUpdated: "2024-02-29",
    attachments: [],
    followUpHistory: [
      { id: "f1", date: "2024-02-29", channel: "โทรศัพท์", detail: "โทรติดตามครั้งที่ 2 ลูกค้าแจ้งว่าจะชำระภายในสัปดาห์หน้า", nextDate: "2024-03-07", user: "คุณสมชาย" },
      { id: "f2", date: "2024-02-15", channel: "LINE", detail: "ส่งข้อความแจ้งเตือนครบกำหนดชำระ ลูกค้าอ่านแล้วยังไม่ตอบ", nextDate: "2024-02-29", user: "คุณสมชาย" },
      { id: "f3", date: "2024-01-26", channel: "โทรศัพท์", detail: "โทรแจ้งครบกำหนดชำระ ลูกค้ารับทราบแต่ขอเลื่อน", nextDate: "2024-02-15", user: "คุณสมชาย" },
    ]
  },
  {
    id: "AR-002",
    customer: "ร้าน XYZ",
    invoiceNumber: "INV-2024-002",
    invoiceDate: "2024-02-15",
    dueDate: "2024-03-15",
    totalAmount: 45000,
    paidAmount: 0,
    remainingAmount: 45000,
    status: "รอชำระ",
    daysOverdue: 0,
    followUpNote: "-",
    accountManager: "คุณสมหญิง",
    lastUpdated: "2024-02-15",
    attachments: [],
    followUpHistory: []
  },
  {
    id: "AR-003",
    customer: "บริษัท DEF จำกัด",
    invoiceNumber: "INV-2024-003",
    invoiceDate: "2024-01-05",
    dueDate: "2024-01-20",
    totalAmount: 120000,
    paidAmount: 120000,
    remainingAmount: 0,
    status: "ชำระเสร็จสิ้น",
    daysOverdue: 0,
    followUpNote: "ชำระครบถ้วนแล้ว",
    accountManager: "คุณสมศักดิ์",
    lastUpdated: "2024-01-19",
    attachments: [],
    followUpHistory: [
      { id: "f4", date: "2024-01-19", channel: "โทรศัพท์", detail: "ลูกค้าโอนเงินเข้าบัญชีเรียบร้อย ยืนยันสลิปแล้ว", nextDate: "", user: "คุณสมศักดิ์" },
    ]
  },
  {
    id: "AR-004",
    customer: "บริษัท GHI จำกัด",
    invoiceNumber: "INV-2024-004",
    invoiceDate: "2023-12-20",
    dueDate: "2024-01-05",
    totalAmount: 85000,
    paidAmount: 30000,
    remainingAmount: 55000,
    status: "ค้างชำระ",
    daysOverdue: 55,
    followUpNote: "ลูกค้าขอผ่อนชำระ 3 งวด",
    accountManager: "คุณสมชาย",
    lastUpdated: "2024-02-28",
    attachments: [],
    followUpHistory: [
      { id: "f5", date: "2024-02-28", channel: "เข้าพบ", detail: "เข้าพบลูกค้าที่สำนักงาน ตกลงผ่อนชำระ 3 งวด งวดละ ~18,333 บาท เริ่มงวดแรก 15 มี.ค.", nextDate: "2024-03-15", user: "คุณสมชาย" },
      { id: "f6", date: "2024-02-10", channel: "อีเมล", detail: "ส่งอีเมลแจ้งยอดค้างชำระพร้อมใบแจ้งหนี้ฉบับใหม่", nextDate: "2024-02-20", user: "คุณสมชาย" },
      { id: "f7", date: "2024-01-20", channel: "โทรศัพท์", detail: "โทรแจ้งครบกำหนด ลูกค้าแจ้งว่ามีปัญหากระแสเงินสด ขอผ่อนผัน", nextDate: "2024-02-10", user: "คุณสมชาย" },
    ]
  },
];

const monthlyData = [
  { month: "ม.ค.", amount: 120000 },
  { month: "ก.พ.", amount: 95000 },
  { month: "มี.ค.", amount: 145000 },
  { month: "เม.ย.", amount: 110000 },
  { month: "พ.ค.", amount: 130000 },
  { month: "มิ.ย.", amount: 155000 },
  { month: "ก.ค.", amount: 125000 },
  { month: "ส.ค.", amount: 140000 },
  { month: "ก.ย.", amount: 135000 },
  { month: "ต.ค.", amount: 150000 },
  { month: "พ.ย.", amount: 165000 },
  { month: "ธ.ค.", amount: 175000 },
];

const COLORS = ['hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export default function CustomerAccounts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<typeof accountsReceivable[0] | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);

  // Calculations
  const totalAccounts = accountsReceivable.length;
  const totalReceivable = accountsReceivable.reduce((sum, item) => sum + item.remainingAmount, 0);
  const overdueAccounts = accountsReceivable.filter(item => item.daysOverdue > 30);
  const overdueCount = overdueAccounts.length;
  const overduePercentage = ((overdueCount / totalAccounts) * 100).toFixed(1);
  const completedCount = accountsReceivable.filter(item => item.status === "ชำระเสร็จสิ้น").length;

  // Status distribution for pie chart
  const statusData = [
    { name: "ชำระเสร็จสิ้น", value: accountsReceivable.filter(a => a.status === "ชำระเสร็จสิ้น").length },
    { name: "รอชำระ", value: accountsReceivable.filter(a => a.status === "รอชำระ").length },
    { name: "ค้างชำระ", value: accountsReceivable.filter(a => a.status === "ค้างชำระ").length },
  ];

  // Filter accounts
  const filteredAccounts = accountsReceivable.filter(account => {
    const matchesSearch = account.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         account.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
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
          <Button className="bg-gradient-to-r from-primary to-primary-hover">
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                            setSelectedAccount(account);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            window.open("/accounting/work-orders", "_blank");
                          }}
                          title="ดูใบสั่งงาน"
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
              <Input type="date" />
            </div>
            <div>
              <Label>จำนวนเงิน (THB)</Label>
              <Input type="number" placeholder="0.00" />
            </div>
            <div>
              <Label>วิธีการชำระ</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกวิธีการชำระ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer">โอนเงิน</SelectItem>
                  <SelectItem value="cash">เงินสด</SelectItem>
                  <SelectItem value="check">เช็ค</SelectItem>
                  <SelectItem value="credit">บัตรเครดิต</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>แนบสลิป</Label>
              <Input type="file" />
            </div>
            <div>
              <Label>หมายเหตุ</Label>
              <Textarea placeholder="หมายเหตุเพิ่มเติม..." />
            </div>
            <Button className="w-full">บันทึกการชำระเงิน</Button>
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
              <Input type="date" />
            </div>
            <div>
              <Label>ช่องทางการติดตาม</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกช่องทาง" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">โทรศัพท์</SelectItem>
                  <SelectItem value="email">อีเมล</SelectItem>
                  <SelectItem value="line">LINE</SelectItem>
                  <SelectItem value="visit">เข้าพบ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>รายละเอียดการติดตาม</Label>
              <Textarea placeholder="บันทึกรายละเอียดการติดตาม..." rows={4} />
            </div>
            <div>
              <Label>วันนัดชำระ (ถ้ามี)</Label>
              <Input type="date" />
            </div>
            <Button className="w-full">บันทึกการติดตาม</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}