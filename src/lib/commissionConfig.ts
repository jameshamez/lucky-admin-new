// Commission Configuration Types & Default Data
// ============================================
// Config A: Ready-Made (สินค้าสำเร็จรูป) - Per Piece or % of Sales
// Config B: Made-to-Order (งานสั่งผลิต) - Tier-based Fixed
// Incentive: Admin Incentive based on total company sales

// === Config A Types ===
export type ReadyMadeConfig = {
  id: string;
  category: string;
  ratePerUnit: number;
  unit: string; // "ชิ้น" | "คน" | "%ยอดขาย"
  calcMethod: "perUnit" | "percentSales";
  active: boolean;
};

// === Config B Types ===
export type TierRange = {
  minQty: number;
  maxQty: number | null;
  fixedAmount: number;
  label: string;
};

export type MadeToOrderConfig = {
  id: string;
  category: string;
  calcMethod: "tier" | "fixedPerJob";
  tiers: TierRange[];
  fixedPerJob?: number;
  active: boolean;
};

// === Incentive Types ===
export type IncentiveTier = {
  id: string;
  minSales: number;
  maxSales: number | null;
  incentivePerPerson: number;
  label: string;
  active: boolean;
};

// === Default Config A: Ready-Made ===
export const defaultReadyMadeConfigs: ReadyMadeConfig[] = [
  { id: "a1", category: "ถ้วยรางวัล พลาสติก ไทย", ratePerUnit: 3, unit: "ชิ้น", calcMethod: "perUnit", active: true },
  { id: "a2", category: "ถ้วยรางวัล พลาสติก จีน", ratePerUnit: 5, unit: "ชิ้น", calcMethod: "perUnit", active: true },
  { id: "a3", category: "ถ้วยรางวัล พิวเตอร์/เบญจรงค์", ratePerUnit: 30, unit: "ชิ้น", calcMethod: "perUnit", active: true },
  { id: "a4", category: "ถ้วยรางวัล โลหะ (S/M)", ratePerUnit: 10, unit: "ชิ้น", calcMethod: "perUnit", active: true },
  { id: "a5", category: "ถ้วยรางวัล โลหะ (L/XL)", ratePerUnit: 30, unit: "ชิ้น", calcMethod: "perUnit", active: true },
  { id: "a6", category: "โล่รางวัล (มาตรฐาน)", ratePerUnit: 3, unit: "ชิ้น", calcMethod: "perUnit", active: true },
  { id: "a7", category: "เหรียญรางวัล (มาตรฐาน)", ratePerUnit: 0.5, unit: "ชิ้น", calcMethod: "perUnit", active: true },
  { id: "a8", category: "ระบบวิ่ง", ratePerUnit: 1, unit: "คน", calcMethod: "perUnit", active: true },
  { id: "a9", category: "อะไหล่ชิ้นส่วนถ้วยรางวัล", ratePerUnit: 5, unit: "%ยอดขาย", calcMethod: "percentSales", active: true },
];

// === Default Config B: Made-to-Order ===
export const defaultMadeToOrderConfigs: MadeToOrderConfig[] = [
  {
    id: "b1", category: "โล่สั่งผลิต (อะคริลิค/ไม้/คริสตัล/เรซิ่น/เหรียญอะคริลิค)", calcMethod: "tier", active: true,
    tiers: [
      { minQty: 1, maxQty: 10, fixedAmount: 50, label: "1-10 ชิ้น" },
      { minQty: 11, maxQty: 50, fixedAmount: 100, label: "11-50 ชิ้น" },
      { minQty: 51, maxQty: 100, fixedAmount: 200, label: "51-100 ชิ้น" },
      { minQty: 101, maxQty: 300, fixedAmount: 300, label: "101-300 ชิ้น" },
      { minQty: 301, maxQty: null, fixedAmount: 500, label: "301+ ชิ้น" },
    ],
  },
  {
    id: "b2", category: "เหรียญรางวัล (สั่งผลิต)", calcMethod: "tier", active: true,
    tiers: [
      { minQty: 1, maxQty: 10000, fixedAmount: 250, label: "1-10,000 ชิ้น" },
      { minQty: 10001, maxQty: null, fixedAmount: 500, label: "10,001+ ชิ้น" },
    ],
  },
  {
    id: "b3", category: "เสื้อ", calcMethod: "tier", active: true,
    tiers: [
      { minQty: 1, maxQty: 1000, fixedAmount: 100, label: "1-1,000 ตัว" },
      { minQty: 1001, maxQty: 3000, fixedAmount: 200, label: "1,001-3,000 ตัว" },
      { minQty: 3001, maxQty: null, fixedAmount: 500, label: "3,001+ ตัว" },
    ],
  },
  {
    id: "b4", category: "BIB", calcMethod: "tier", active: true,
    tiers: [{ minQty: 1, maxQty: null, fixedAmount: 0, label: "ทุกจำนวน" }],
  },
  {
    id: "b5", category: "ออแกไนท์", calcMethod: "fixedPerJob", active: true,
    tiers: [],
    fixedPerJob: 5000,
  },
];

// === Default Incentive Config (from Excel Page 4) ===
export const defaultIncentiveTiers: IncentiveTier[] = [
  { id: "i1", minSales: 2300000, maxSales: 2499999, incentivePerPerson: 500, label: "2,300,000 - 2,499,999", active: true },
  { id: "i2", minSales: 2500000, maxSales: 2699999, incentivePerPerson: 2500, label: "2,500,000 - 2,699,999", active: true },
  { id: "i3", minSales: 2700000, maxSales: 2999999, incentivePerPerson: 3000, label: "2,700,000 - 2,999,999", active: true },
  { id: "i4", minSales: 3000000, maxSales: 3499999, incentivePerPerson: 3500, label: "3,000,000 - 3,499,999", active: true },
  { id: "i5", minSales: 3500000, maxSales: 3999999, incentivePerPerson: 4000, label: "3,500,000 - 3,999,999", active: true },
  { id: "i6", minSales: 4000000, maxSales: 4999999, incentivePerPerson: 4500, label: "4,000,000 - 4,999,999", active: true },
  { id: "i7", minSales: 5000000, maxSales: null, incentivePerPerson: 5000, label: "5,000,000+", active: true },
];

// === Calculation Functions ===

export function calculateReadyMadeCommission(
  config: ReadyMadeConfig,
  quantity: number,
  totalSalesAmount: number
): { amount: number; description: string; rateDisplay: string; baseAmount: string } {
  if (config.calcMethod === "percentSales") {
    const amount = totalSalesAmount * (config.ratePerUnit / 100);
    return {
      amount,
      description: `${config.ratePerUnit}% ของยอดขาย ฿${totalSalesAmount.toLocaleString()} = ฿${amount.toLocaleString()}`,
      rateDisplay: `${config.ratePerUnit}%`,
      baseAmount: `฿${totalSalesAmount.toLocaleString()}`,
    };
  }
  const amount = quantity * config.ratePerUnit;
  return {
    amount,
    description: `${config.ratePerUnit} บาท × ${quantity} ${config.unit} = ฿${amount.toLocaleString()}`,
    rateDisplay: `${config.ratePerUnit} บาท/${config.unit}`,
    baseAmount: `${quantity.toLocaleString()} ${config.unit}`,
  };
}

export function calculateMadeToOrderCommission(
  config: MadeToOrderConfig,
  quantity: number
): { amount: number; description: string; tierCondition: string } {
  if (config.calcMethod === "fixedPerJob") {
    const amount = config.fixedPerJob ?? 0;
    return {
      amount,
      description: `เหมาจ่าย ฿${amount.toLocaleString()}/งาน`,
      tierCondition: "Fixed Job",
    };
  }

  const tier = config.tiers.find(
    t => quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty)
  );
  if (!tier) return { amount: 0, description: "ไม่อยู่ในช่วงที่กำหนด", tierCondition: "-" };

  return {
    amount: tier.fixedAmount,
    description: `Tier ${tier.label} → เหมา ฿${tier.fixedAmount.toLocaleString()}`,
    tierCondition: `Tier ${tier.label}`,
  };
}

export function calculateAdminIncentive(
  tiers: IncentiveTier[],
  totalCompanySales: number
): { amount: number; tierLabel: string; nextTierSales: number | null; nextTierAmount: number | null } {
  const activeTiers = tiers.filter(t => t.active).sort((a, b) => a.minSales - b.minSales);

  let matchedTier: IncentiveTier | null = null;
  let nextTier: IncentiveTier | null = null;

  for (let i = 0; i < activeTiers.length; i++) {
    const t = activeTiers[i];
    if (totalCompanySales >= t.minSales && (t.maxSales === null || totalCompanySales <= t.maxSales)) {
      matchedTier = t;
      nextTier = i + 1 < activeTiers.length ? activeTiers[i + 1] : null;
      break;
    }
  }

  if (!matchedTier) {
    const firstTier = activeTiers[0];
    return {
      amount: 0,
      tierLabel: "ไม่ถึงเป้า",
      nextTierSales: firstTier?.minSales ?? null,
      nextTierAmount: firstTier?.incentivePerPerson ?? null,
    };
  }

  return {
    amount: matchedTier.incentivePerPerson,
    tierLabel: matchedTier.label,
    nextTierSales: nextTier?.minSales ?? null,
    nextTierAmount: nextTier?.incentivePerPerson ?? null,
  };
}

// Helper to get active categories
export function getReadyMadeCategories(configs: ReadyMadeConfig[]): string[] {
  return configs.filter(c => c.active).map(c => c.category);
}

export function getMadeToOrderCategories(configs: MadeToOrderConfig[]): string[] {
  return configs.filter(c => c.active).map(c => c.category);
}

// Legacy compatibility exports
export type CommissionConfig = ReadyMadeConfig | MadeToOrderConfig;

export function getCalcTypeBadge(calcType: string): string {
  switch (calcType) {
    case "A": return "Per Piece";
    case "B": return "Tier-based";
    case "C": return "% / Fixed";
    default: return calcType;
  }
}

export function getCalcTypeLabel(calcType: string): string {
  switch (calcType) {
    case "A": return "แบบ A: ต่อชิ้น (Per Piece)";
    case "B": return "แบบ B: เหมาตามช่วง (Tier-based)";
    case "C": return "แบบ C: % หรือ เหมาจ่าย";
    default: return calcType;
  }
}

// Legacy calculateCommission for backward compatibility
export function calculateCommission(
  config: any,
  quantity: number,
  totalSalesAmount: number
): { amount: number; description: string } {
  if (config.calcType === "A" || config.calcMethod === "perUnit") {
    const amount = quantity * (config.ratePerUnit || 0);
    return { amount, description: `${config.ratePerUnit} บาท × ${quantity} = ฿${amount.toLocaleString()}` };
  }
  if (config.calcMethod === "percentSales") {
    const amount = totalSalesAmount * ((config.ratePerUnit || 0) / 100);
    return { amount, description: `${config.ratePerUnit}% ของ ฿${totalSalesAmount.toLocaleString()} = ฿${amount.toLocaleString()}` };
  }
  return { amount: 0, description: "-" };
}

export function getAllCategories(configs: any[]): string[] {
  return configs.filter((c: any) => c.active).map((c: any) => c.category);
}

// Keep defaultCommissionConfigs for backward compatibility
export const defaultCommissionConfigs: any[] = [
  ...defaultReadyMadeConfigs.map(c => ({ ...c, calcType: "A" })),
  ...defaultMadeToOrderConfigs.map(c => ({ ...c, calcType: "B" })),
];

// Type exports for backward compat
export type CommissionTypeA = ReadyMadeConfig & { calcType: "A" };
export type CommissionTypeB = MadeToOrderConfig & { calcType: "B" };
export type CommissionTypeC = { id: string; category: string; method: string; percentOfSales?: number; fixedPerJob?: number; active: boolean; calcType: "C" };
