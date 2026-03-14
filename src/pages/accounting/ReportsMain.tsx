import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Package, Briefcase, Wallet, FileText, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { accountingService } from "@/services/accountingService";

export default function ReportsMain() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await accountingService.getReportsData('summary');
        if (res.status === 'success') {
          setData(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch reports summary", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const summaryCards = [
    {
      title: "ยอดขายรวมเดือนนี้",
      value: data ? `฿${data.monthlySales.toLocaleString()}` : "฿0",
      change: data?.monthlySalesChange || "+0%",
      icon: TrendingUp,
      color: "text-green-600",
    },
    {
      title: "มูลค่าคลังพัสดุ",
      value: data ? `฿${data.officeValue.toLocaleString()}` : "฿0",
      change: data?.officeChange || "+0%",
      icon: Briefcase,
      color: "text-orange-600",
    },
    {
      title: "ยอดเงินสดย่อยเดือนนี้",
      value: data ? `฿${data.pettyCashSpent.toLocaleString()}` : "฿0",
      change: data?.pettyCashChange || "+0%",
      icon: Wallet,
      color: "text-purple-600",
    },
    {
      title: "มูลค่าแอปเปิ้ล (Mock)",
      value: "฿5,800,000",
      change: "+5%",
      icon: Package,
      color: "text-blue-600",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  const reportButtons = [
    {
      title: "รายงานยอดขาย",
      description: "ยอดขายรายวัน รายเดือน และสินค้าขายดี",
      icon: TrendingUp,
      path: "/accounting/reports/sales",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "รายงานสต๊อกสินค้า",
      description: "มูลค่าสต๊อก สินค้าคงเหลือ และสถานะ",
      icon: Package,
      path: "/accounting/reports/inventory",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "รายงานวัสดุสำนักงาน",
      description: "วัสดุสิ้นเปลืองและการเบิกใช้",
      icon: FileText,
      path: "/accounting/reports/office-supplies",
      color: "bg-orange-500 hover:bg-orange-600",
    },
    {
      title: "รายงานอุปกรณ์สำนักงาน",
      description: "ทรัพย์สินและครุภัณฑ์คงเหลือ",
      icon: Briefcase,
      path: "/accounting/reports/office-equipment",
      color: "bg-indigo-500 hover:bg-indigo-600",
    },
    {
      title: "รายงานเงินสดย่อย",
      description: "การเบิกจ่ายและยอดคงเหลือกองกลาง",
      icon: Wallet,
      path: "/accounting/reports/petty-cash",
      color: "bg-purple-500 hover:bg-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className={`text-xs ${card.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {card.change} จากเดือนที่แล้ว
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Access Cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">เข้าถึงรายงานแต่ละประเภท</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportButtons.map((report, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(report.path)}>
              <CardHeader>
                <div className={`w-12 h-12 rounded-lg ${report.color} flex items-center justify-center mb-3`}>
                  <report.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  ดูรายงาน
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
