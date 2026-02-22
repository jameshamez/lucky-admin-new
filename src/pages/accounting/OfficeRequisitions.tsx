import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PackagePlus, PackageMinus, Package, AlertTriangle, TrendingDown, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Supply, Requisition, INITIAL_SUPPLIES, INITIAL_REQUISITIONS } from "@/components/accounting/office-supplies/types";
import SupplyStockTable from "@/components/accounting/office-supplies/SupplyStockTable";
import AddSupplyDrawer from "@/components/accounting/office-supplies/AddSupplyDrawer";
import RequisitionDrawer from "@/components/accounting/office-supplies/RequisitionDrawer";
import RequisitionSummary from "@/components/accounting/office-supplies/RequisitionSummary";
import SupplyDetailDrawer from "@/components/accounting/office-supplies/SupplyDetailDrawer";

const OfficeRequisitions = () => {
  const [supplies, setSupplies] = useState<Supply[]>(INITIAL_SUPPLIES);
  const [requisitions, setRequisitions] = useState<Requisition[]>(INITIAL_REQUISITIONS);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [showReqDrawer, setShowReqDrawer] = useState(false);

  // Detail drawer state
  const [detailSupply, setDetailSupply] = useState<Supply | null>(null);
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view");
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);

  const nextCode = `SUP-${String(supplies.length + 1).padStart(3, "0")}`;

  const handleAddSupply = (supply: Omit<Supply, "id">) => {
    setSupplies((prev) => [...prev, { ...supply, id: String(Date.now()) }]);
  };

  const handleRequisition = (req: Omit<Requisition, "id">) => {
    setSupplies((prev) =>
      prev.map((s) =>
        s.id === req.supplyId ? { ...s, quantity: s.quantity - req.quantity } : s
      )
    );
    setRequisitions((prev) => [...prev, { ...req, id: String(Date.now()) }]);
  };

  const handleUpdateSupply = (updated: Supply) => {
    setSupplies((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setDetailSupply(updated);
  };

  const handleView = (supply: Supply) => {
    setDetailSupply(supply);
    setDetailMode("view");
    setShowDetailDrawer(true);
  };

  const handleEdit = (supply: Supply) => {
    setDetailSupply(supply);
    setDetailMode("edit");
    setShowDetailDrawer(true);
  };

  const lowStockCount = supplies.filter((s) => s.quantity <= s.minStock).length;
  const totalValue = supplies.reduce((sum, s) => sum + s.quantity * s.pricePerUnit, 0);
  const totalReqValue = requisitions.reduce((sum, r) => sum + r.quantity * r.pricePerUnit, 0);

  const stats = [
    { label: "รายการวัสดุทั้งหมด", value: supplies.length, icon: Package, color: "text-primary" },
    { label: "ใกล้หมด / หมดสต็อก", value: lowStockCount, icon: AlertTriangle, color: "text-[#D6275A]" },
    { label: "มูลค่าสต็อกรวม", value: `฿${totalValue.toLocaleString()}`, icon: BarChart3, color: "text-green-600" },
    { label: "ยอดเบิกจ่ายรวม", value: `฿${totalReqValue.toLocaleString()}`, icon: TrendingDown, color: "text-orange-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">จัดการวัสดุสำนักงาน</h1>
          <p className="text-muted-foreground mt-1">ระบบเบิก-จ่ายวัสดุสำนักงาน พร้อมสรุปยอดและติดตามสต็อก</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddDrawer(true)}>
            <PackagePlus className="w-4 h-4 mr-2" />
            เพิ่มวัสดุ
          </Button>
          <Button variant="outline" className="border-orange-400 text-orange-600 hover:bg-orange-50" onClick={() => setShowReqDrawer(true)}>
            <PackageMinus className="w-4 h-4 mr-2" />
            การเบิกใช้
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabbed Table */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="stock">
            <TabsList className="mb-4">
              <TabsTrigger value="stock">รายการวัสดุสำนักงาน</TabsTrigger>
              <TabsTrigger value="summary">สรุปการเบิกจ่าย</TabsTrigger>
            </TabsList>
            <TabsContent value="stock">
              <SupplyStockTable supplies={supplies} requisitions={requisitions} onView={handleView} onEdit={handleEdit} />
            </TabsContent>
            <TabsContent value="summary">
              <RequisitionSummary requisitions={requisitions} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Drawers */}
      <AddSupplyDrawer open={showAddDrawer} onOpenChange={setShowAddDrawer} onAdd={handleAddSupply} nextCode={nextCode} />
      <RequisitionDrawer open={showReqDrawer} onOpenChange={setShowReqDrawer} supplies={supplies} onRequisition={handleRequisition} />
      <SupplyDetailDrawer
        open={showDetailDrawer}
        onOpenChange={setShowDetailDrawer}
        supply={detailSupply}
        requisitions={requisitions}
        onUpdateSupply={handleUpdateSupply}
        mode={detailMode}
      />
    </div>
  );
};

export default OfficeRequisitions;
