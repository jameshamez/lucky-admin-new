import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  PackageMinus,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

// Mock data for completed orders
const completedOrders = [
  {
    id: "ORD-001",
    orderNumber: "SO-2024-001",
    customerName: "บริษัท ABC จำกัด",
    product: "ตะกร้าผลไม้พรีเมียม",
    quantity: 10,
    completedDate: "2024-01-20",
    stockDeducted: false
  },
  {
    id: "ORD-002",
    orderNumber: "SO-2024-002",
    customerName: "บริษัท XYZ จำกัด",
    product: "กระเช้าปีใหม่",
    quantity: 5,
    completedDate: "2024-01-21",
    stockDeducted: false
  },
  {
    id: "ORD-003",
    orderNumber: "SO-2024-003",
    customerName: "คุณสมชาย ใจดี",
    product: "ของชำร่วยงานแต่ง",
    quantity: 100,
    completedDate: "2024-01-22",
    stockDeducted: true
  },
  {
    id: "ORD-004",
    orderNumber: "SO-2024-004",
    customerName: "บริษัท DEF จำกัด",
    product: "ตะกร้าของขวัญปีใหม่",
    quantity: 15,
    completedDate: "2024-01-23",
    stockDeducted: false
  },
  {
    id: "ORD-005",
    orderNumber: "SO-2024-005",
    customerName: "คุณสมหญิง รักงาน",
    product: "กระเช้าผลไม้สด",
    quantity: 8,
    completedDate: "2024-01-24",
    stockDeducted: false
  }
];

export default function InventoryDeduct() {
  const [orders, setOrders] = useState(completedOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [productSearch, setProductSearch] = useState("");
  const [deductQuantity, setDeductQuantity] = useState("");

  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeductClick = (order: any) => {
    setSelectedOrder(order);
    setProductSearch("");
    setDeductQuantity(order.quantity.toString());
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmDeduct = () => {
    if (selectedOrder) {
      // Update the order status
      setOrders(orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, stockDeducted: true }
          : order
      ));
      
      toast.success(`ตัดสต็อกสินค้าสำเร็จ`, {
        description: `ออเดอร์ ${selectedOrder.orderNumber} - ${selectedOrder.product} จำนวน ${selectedOrder.quantity} ชิ้น`
      });
      
      setIsConfirmDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ตัดสต็อกสินค้า</h1>
        <p className="text-muted-foreground">จัดการการตัดสต็อกสินค้าจากออเดอร์ที่เสร็จสินแล้ว</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ค้นหาออเดอร์</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาเลขที่ออเดอร์, ชื่อลูกค้า, หรือสินค้า..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Completed Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการออเดอร์ที่เสร็จสินแล้ว</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่ออเดอร์</TableHead>
                <TableHead>ชื่อลูกค้า</TableHead>
                <TableHead>สินค้า</TableHead>
                <TableHead className="text-center">จำนวน</TableHead>
                <TableHead>วันที่เสร็จสิน</TableHead>
                <TableHead className="text-center">สถานะสต็อก</TableHead>
                <TableHead className="text-right">การดำเนินการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    ไม่พบข้อมูลออเดอร์
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>{order.product}</TableCell>
                    <TableCell className="text-center">{order.quantity}</TableCell>
                    <TableCell>{order.completedDate}</TableCell>
                    <TableCell className="text-center">
                      {order.stockDeducted ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          ตัดสต็อกแล้ว
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          รอตัดสต็อก
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={order.stockDeducted ? "outline" : "default"}
                        onClick={() => handleDeductClick(order)}
                        disabled={order.stockDeducted}
                        className="gap-2"
                      >
                        <PackageMinus className="h-4 w-4" />
                        {order.stockDeducted ? "ตัดสต็อกแล้ว" : "ตัดสต็อก"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการตัดสต็อกสินค้า</DialogTitle>
            <DialogDescription>
              คุณต้องการตัดสต็อกสินค้าสำหรับออเดอร์นี้หรือไม่?
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">เลขที่ออเดอร์:</div>
                <div className="font-medium">{selectedOrder.orderNumber}</div>
                
                <div className="text-muted-foreground">ชื่อลูกค้า:</div>
                <div className="font-medium">{selectedOrder.customerName}</div>
                
                <div className="text-muted-foreground">สินค้า:</div>
                <div className="font-medium">{selectedOrder.product}</div>
                
                <div className="text-muted-foreground">จำนวน:</div>
                <div className="font-medium">{selectedOrder.quantity} ชิ้น</div>
              </div>

              {/* Product Search Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">ค้นหาสินค้า</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ค้นหาสินค้าที่ต้องการตัดสต็อก..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Deduct Quantity Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium">จำนวนที่ตัด</label>
                <Input
                  type="number"
                  placeholder="ใส่จำนวนที่ต้องการตัด"
                  value={deductQuantity}
                  onChange={(e) => setDeductQuantity(e.target.value)}
                  min="1"
                  max={selectedOrder.quantity}
                />
              </div>
              
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>หมายเหตุ:</strong> การตัดสต็อกจะลดจำนวนสินค้าในคลังทันที และไม่สามารถยกเลิกได้
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleConfirmDeduct}>
              ยืนยันตัดสต็อก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
