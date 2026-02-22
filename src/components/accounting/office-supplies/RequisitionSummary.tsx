import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown } from "lucide-react";
import { Requisition } from "./types";

type BubbleFilter = "week" | "month" | "year" | "custom";
type SortKey = "date" | "requester" | "supplyName" | "category" | "quantity";

interface Props {
  requisitions: Requisition[];
}

const RequisitionSummary = ({ requisitions }: Props) => {
  const [bubble, setBubble] = useState<BubbleFilter>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = useMemo(() => {
    const now = new Date();
    let from: Date, to: Date;
    to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (bubble === "week") {
      from = new Date(now);
      from.setDate(now.getDate() - now.getDay());
      from.setHours(0, 0, 0, 0);
    } else if (bubble === "month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (bubble === "year") {
      from = new Date(now.getFullYear(), 0, 1);
    } else {
      from = customFrom ? new Date(customFrom) : new Date(0);
      to = customTo ? new Date(customTo + "T23:59:59") : to;
    }

    return requisitions
      .filter((r) => {
        const d = new Date(r.date);
        return d >= from && d <= to;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === "date") cmp = a.date.localeCompare(b.date);
        else if (sortKey === "requester") cmp = a.requester.localeCompare(b.requester);
        else if (sortKey === "supplyName") cmp = a.supplyName.localeCompare(b.supplyName);
        else if (sortKey === "category") cmp = a.category.localeCompare(b.category);
        else if (sortKey === "quantity") cmp = a.quantity * a.pricePerUnit - b.quantity * b.pricePerUnit;
        return sortAsc ? cmp : -cmp;
      });
  }, [requisitions, bubble, customFrom, customTo, sortKey, sortAsc]);

  const totalCost = filtered.reduce((sum, r) => sum + r.quantity * r.pricePerUnit, 0);

  const categorySums = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((r) => {
      map[r.category] = (map[r.category] || 0) + r.quantity * r.pricePerUnit;
    });
    return map;
  }, [filtered]);

  const bubbles: { key: BubbleFilter; label: string }[] = [
    { key: "week", label: "สัปดาห์นี้" },
    { key: "month", label: "เดือนนี้" },
    { key: "year", label: "ปีนี้" },
    { key: "custom", label: "กำหนดเอง" },
  ];

  const SortIcon = () => <ArrowUpDown className="inline w-3 h-3 ml-1" />;

  return (
    <div className="space-y-4">
      {/* Bubble filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {bubbles.map((b) => (
            <Button
              key={b.key}
              size="sm"
              variant={bubble === b.key ? "default" : "outline"}
              onClick={() => setBubble(b.key)}
            >
              {b.label}
            </Button>
          ))}
        </div>
        {bubble === "custom" && (
          <div className="flex gap-2 items-center">
            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-[160px]" />
            <span className="text-muted-foreground text-sm">ถึง</span>
            <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-[160px]" />
          </div>
        )}
      </div>

      {/* Category breakdown */}
      {Object.keys(categorySums).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(categorySums).map(([cat, val]) => (
            <div key={cat} className="bg-muted rounded-lg px-3 py-1.5 text-sm">
              <span className="font-medium">{cat}:</span>{" "}
              <span className="font-semibold">฿{val.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-md border overflow-auto scrollbar-littleboy max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary">
              {[
                { key: "date" as SortKey, label: "วันที่" },
                { key: "supplyName" as SortKey, label: "วัสดุ" },
                { key: "category" as SortKey, label: "หมวดหมู่" },
                { key: "requester" as SortKey, label: "ผู้เบิก" },
              ].map((col) => (
                <TableHead
                  key={col.key}
                  className="text-primary-foreground cursor-pointer select-none whitespace-nowrap"
                  onClick={() => toggleSort(col.key)}
                >
                  {col.label}<SortIcon />
                </TableHead>
              ))}
              <TableHead className="text-primary-foreground text-center cursor-pointer select-none" onClick={() => toggleSort("quantity")}>
                จำนวน<SortIcon />
              </TableHead>
              <TableHead className="text-primary-foreground text-right">มูลค่า (฿)</TableHead>
              <TableHead className="text-primary-foreground">หมายเหตุ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  ไม่มีข้อมูลในช่วงเวลาที่เลือก
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm">{r.date}</TableCell>
                  <TableCell>
                    <span className="font-mono text-xs mr-1">{r.supplyCode}</span>
                    {r.supplyName}
                  </TableCell>
                  <TableCell className="text-sm">{r.category}</TableCell>
                  <TableCell className="text-sm">{r.requester}</TableCell>
                  <TableCell className="text-center">{r.quantity} {r.unit}</TableCell>
                  <TableCell className="text-right font-medium">
                    {(r.quantity * r.pricePerUnit).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{r.note}</TableCell>
                </TableRow>
              ))
            )}
            {filtered.length > 0 && (
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell colSpan={5} className="text-right">ยอดรวมค่าใช้จ่าย</TableCell>
                <TableCell className="text-right text-lg">฿{totalCost.toLocaleString()}</TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RequisitionSummary;
