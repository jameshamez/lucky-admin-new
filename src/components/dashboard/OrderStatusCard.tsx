import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

interface Order {
  id: string;
  customerName: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  total: number;
  createdAt: Date;
  items: string[];
}

interface OrderStatusCardProps {
  order: Order;
}

const statusMap = {
  pending: { label: "รออนุมัติ", variant: "secondary" as const },
  in_progress: { label: "กำลังผลิต", variant: "default" as const },
  completed: { label: "เสร็จสิ้น", variant: "default" as const },
  cancelled: { label: "ยกเลิก", variant: "destructive" as const },
};

export function OrderStatusCard({ order }: OrderStatusCardProps) {
  const status = statusMap[order.status];
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">#{order.id}</CardTitle>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <p className="font-medium">{order.customerName}</p>
          <p className="text-sm text-muted-foreground">
            {order.items.join(", ")}
          </p>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-primary">
            ฿{order.total.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            {formatDistanceToNow(order.createdAt, { addSuffix: true, locale: th })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}