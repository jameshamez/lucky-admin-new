export const API_BASE_URL = 'https://nacres.co.th/api-lucky/admin/production';

export interface DefectiveItem {
    id: string;
    code: string;
    name: string;
    image: string;
    category: string;
    subcategory: string;
    color: string;
    size: string;
    defectType: string;
    quantity: number;
    unit: string;
    reportDate: string;
    reportedBy: string;
    orderRef: string;
    note: string;
    status: "รอดำเนินการ" | "ตัดขาย" | "ทำลาย" | "ซ่อมแล้ว";
}

export interface BOMComponent {
    id: string;
    name: string;
    qty: number;
    unit: string;
}

export interface MovementLog {
    id: string;
    date: string;
    type: "รับเข้า" | "จ่ายออก" | "เคลม" | "ชำรุด" | "เบิกภายใน";
    qty: number;
    by: string;
    note: string;
}

export interface StockItem {
    id: string;
    code: string;
    name: string;
    image: string;
    category: string;
    subcategory: string;
    color: string;
    size: string;
    tags: string;
    currentStock: number;
    minimumStock: number;
    unit: string;
    model: string;
    lastUpdated: string;
    status: "in_stock" | "low_stock" | "out_of_stock";
    bom?: BOMComponent[];
    movementHistory?: MovementLog[];
}

export interface WithdrawalComponent {
    id: string;
    name: string;
    color: string;
    size: string;
    requiredQty: number;
    unit: string;
    image: string;
}

export interface WithdrawalBatch {
    date: string;
    requester: string;
    items: (WithdrawalComponent & { withdrawnQty: number })[];
}

export const productionStockService = {
    // --- Defective items ---
    getDefectiveItems: async () => {
        const res = await fetch(`${API_BASE_URL}/defective_items.php`);
        return res.json();
    },
    sellDefectiveItem: async (id: string, qty: number, note: string) => {
        const res = await fetch(`${API_BASE_URL}/defective_items.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sell', id, qty, note }),
        });
        return res.json();
    },
    destroyDefectiveItem: async (id: string) => {
        const res = await fetch(`${API_BASE_URL}/defective_items.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'destroy', id }),
        });
        return res.json();
    },

    // --- Stock items ---
    getStockItems: async () => {
        const res = await fetch(`${API_BASE_URL}/stock_items.php`);
        return res.json();
    },
    adjustStockItem: async (data: { id: string; type: MovementLog['type']; qty: number; note?: string; employeeName?: string }) => {
        const res = await fetch(`${API_BASE_URL}/stock_items.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'adjust', ...data }),
        });
        return res.json();
    },

    // --- Withdrawal components + history ---
    getWithdrawalComponents: async () => {
        const res = await fetch(`${API_BASE_URL}/withdrawal_components.php`);
        return res.json();
    },
    getWithdrawals: async (orderId: string, stepKey: string) => {
        const res = await fetch(`${API_BASE_URL}/withdrawals.php?orderId=${encodeURIComponent(orderId)}&stepKey=${encodeURIComponent(stepKey)}`);
        return res.json();
    },
    submitWithdrawal: async (data: { orderId: string; stepKey: string; requester: string; items: { componentId: string; withdrawnQty: number }[] }) => {
        const res = await fetch(`${API_BASE_URL}/withdrawals.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
};
