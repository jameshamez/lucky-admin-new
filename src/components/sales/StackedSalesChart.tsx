import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Cell, LabelList, Legend } from "recharts";
import { BarChart3, X } from "lucide-react";

// Product colors - consistent across all bars
const PRODUCT_COLORS = {
  "เหรียญรางวัล": "hsl(217, 91%, 60%)",     // Blue
  "ถ้วยรางวัล": "hsl(142, 71%, 45%)",       // Green  
  "โล่รางวัล": "hsl(38, 92%, 50%)",         // Orange
  "อื่นๆ": "hsl(280, 65%, 60%)",            // Purple
};

// Mock data - stacked by products
const monthlyStackedData = [
  { 
    name: "ม.ค.", 
    "เหรียญรางวัล": 85000, 
    "ถ้วยรางวัล": 95000, 
    "โล่รางวัล": 45000,
    "อื่นๆ": 20000,
  },
  { 
    name: "ก.พ.", 
    "เหรียญรางวัล": 92000, 
    "ถ้วยรางวัล": 120000, 
    "โล่รางวัล": 68000,
    "อื่นๆ": 32000,
  },
  { 
    name: "มี.ค.", 
    "เหรียญรางวัล": 78000, 
    "ถ้วยรางวัล": 105000, 
    "โล่รางวัล": 72000,
    "อื่นๆ": 34000,
  },
  { 
    name: "เม.ย.", 
    "เหรียญรางวัล": 110000, 
    "ถ้วยรางวัล": 135000, 
    "โล่รางวัล": 78000,
    "อื่นๆ": 35000,
  },
  { 
    name: "พ.ค.", 
    "เหรียญรางวัล": 125000, 
    "ถ้วยรางวัล": 158000, 
    "โล่รางวัล": 95000,
    "อื่นๆ": 45000,
  },
  { 
    name: "มิ.ย.", 
    "เหรียญรางวัล": 98000, 
    "ถ้วยรางวัล": 142000, 
    "โล่รางวัล": 82000,
    "อื่นๆ": 45000,
  },
];

const yearlyStackedData = [
  { 
    name: "2021", 
    "เหรียญรางวัล": 850000, 
    "ถ้วยรางวัล": 950000, 
    "โล่รางวัล": 450000,
    "อื่นๆ": 200000,
  },
  { 
    name: "2022", 
    "เหรียญรางวัล": 920000, 
    "ถ้วยรางวัล": 1200000, 
    "โล่รางวัล": 680000,
    "อื่นๆ": 320000,
  },
  { 
    name: "2023", 
    "เหรียญรางวัล": 780000, 
    "ถ้วยรางวัล": 1050000, 
    "โล่รางวัล": 720000,
    "อื่นๆ": 340000,
  },
  { 
    name: "2024", 
    "เหรียญรางวัล": 1100000, 
    "ถ้วยรางวัล": 1350000, 
    "โล่รางวัล": 780000,
    "อื่นๆ": 350000,
  },
];

const allProducts = ["เหรียญรางวัล", "ถ้วยรางวัล", "โล่รางวัล", "อื่นๆ"];

const chartConfig = {
  "เหรียญรางวัล": { label: "เหรียญรางวัล", color: PRODUCT_COLORS["เหรียญรางวัล"] },
  "ถ้วยรางวัล": { label: "ถ้วยรางวัล", color: PRODUCT_COLORS["ถ้วยรางวัล"] },
  "โล่รางวัล": { label: "โล่รางวัล", color: PRODUCT_COLORS["โล่รางวัล"] },
  "อื่นๆ": { label: "อื่นๆ", color: PRODUCT_COLORS["อื่นๆ"] },
};

// Custom label to show total on top of stacked bar
const CustomTotalLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (!value) return null;
  
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill="hsl(var(--foreground))"
      textAnchor="middle"
      fontSize={11}
      fontWeight="600"
    >
      {value >= 1000000 
        ? `${(value / 1000000).toFixed(1)}M` 
        : `${(value / 1000).toFixed(0)}K`}
    </text>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
            </div>
            <span className="font-medium text-foreground">
              ฿{entry.value?.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-border mt-2 pt-2 flex justify-between">
        <span className="font-semibold text-foreground">รวม</span>
        <span className="font-bold text-foreground">฿{total.toLocaleString()}</span>
      </div>
    </div>
  );
};

// Custom legend
const CustomLegend = ({ payload, selectedProducts, onToggleProduct }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-2">
      {payload.map((entry: any, index: number) => {
        const isSelected = selectedProducts.includes(entry.value);
        return (
          <button
            key={index}
            onClick={() => onToggleProduct(entry.value)}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-all ${
              isSelected 
                ? "opacity-100" 
                : "opacity-40 hover:opacity-60"
            }`}
          >
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-foreground">{entry.value}</span>
          </button>
        );
      })}
    </div>
  );
};

export default function StackedSalesChart() {
  const [viewMode, setViewMode] = useState<"monthly" | "yearly">("monthly");
  const [selectedProducts, setSelectedProducts] = useState<string[]>(allProducts);

  const handleToggleProduct = (product: string) => {
    if (selectedProducts.includes(product)) {
      if (selectedProducts.length > 1) {
        setSelectedProducts(prev => prev.filter(p => p !== product));
      }
    } else {
      setSelectedProducts(prev => [...prev, product]);
    }
  };

  const rawData = viewMode === "monthly" ? monthlyStackedData : yearlyStackedData;

  // Add total to each data point for label
  const chartData = rawData.map(item => {
    const total = selectedProducts.reduce((sum, product) => {
      return sum + (item[product as keyof typeof item] as number || 0);
    }, 0);
    return { ...item, total };
  });

  // Sort products by total value (high to low) for proper stacking
  const sortedProducts = [...selectedProducts].sort((a, b) => {
    const totalA = chartData.reduce((sum, item) => sum + (item[a as keyof typeof item] as number || 0), 0);
    const totalB = chartData.reduce((sum, item) => sum + (item[b as keyof typeof item] as number || 0), 0);
    return totalB - totalA;
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            กราฟยอดขายตามประเภทสินค้า
          </CardTitle>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <Button
              variant={viewMode === "monthly" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setViewMode("monthly")}
            >
              รายเดือน
            </Button>
            <Button
              variant={viewMode === "yearly" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setViewMode("yearly")}
            >
              รายปี
            </Button>
          </div>
        </div>
        
        {/* Selected products badges */}
        {selectedProducts.length < allProducts.length && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selectedProducts.map(product => (
              <Badge
                key={product}
                variant="secondary"
                className="text-xs gap-1 cursor-pointer hover:bg-secondary/80"
                onClick={() => handleToggleProduct(product)}
              >
                <div 
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: PRODUCT_COLORS[product as keyof typeof PRODUCT_COLORS] }}
                />
                {product}
                <X className="w-3 h-3" />
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-xs px-2"
              onClick={() => setSelectedProducts(allProducts)}
            >
              แสดงทั้งหมด
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        <div className="h-[300px] w-full">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 25, right: 10, left: 0, bottom: 10 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  className="text-xs"
                  tickFormatter={(value) => 
                    viewMode === "yearly" 
                      ? `${(value / 1000000).toFixed(0)}M`
                      : `${(value / 1000).toFixed(0)}K`
                  }
                  width={40}
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <ChartTooltip content={<CustomTooltip />} />
                
                {/* Stacked bars - render in reverse order so highest value is at bottom */}
                {sortedProducts.slice().reverse().map((product, index) => (
                  <Bar
                    key={product}
                    dataKey={product}
                    stackId="a"
                    fill={PRODUCT_COLORS[product as keyof typeof PRODUCT_COLORS]}
                    radius={index === sortedProducts.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  >
                    {/* Only show total label on the top-most bar */}
                    {index === sortedProducts.length - 1 && (
                      <LabelList 
                        dataKey="total" 
                        content={<CustomTotalLabel />}
                      />
                    )}
                  </Bar>
                ))}
                
                <Legend
                  content={(props) => (
                    <CustomLegend
                      {...props}
                      selectedProducts={selectedProducts}
                      onToggleProduct={handleToggleProduct}
                    />
                  )}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
