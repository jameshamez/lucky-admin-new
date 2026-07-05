export const API_BASE_URL = 'https://nacres.co.th/api-lucky/admin/production';

export type StockStatus = 'ready' | 'defective' | 'damaged';
export type TransactionType = 'รับเข้า' | 'ตัดออก' | 'โอนคลัง' | 'ปรับยอด';

export interface WarehouseLocation {
    id: number;
    code: string;
    name: string;
    status: string;
}

export interface Warehouse {
    id: number;
    code: string;
    name: string;
    address: string | null;
    status: string;
    locations: WarehouseLocation[];
}

export interface InventoryCategory {
    id: number;
    name: string;
}

export interface InventoryUnit {
    id: number;
    name: string;
    abbr: string;
}

export interface InventoryProduct {
    id: number;
    code: string;
    name: string;
    categoryId: number | null;
    category: string | null;
    subcategory: string | null;
    unitId: number | null;
    unit: string | null;
    minStock: number;
    image: string;
}

export interface StockRow {
    id: number;
    productId: number;
    code: string;
    name: string;
    warehouse: string;
    location: string | null;
    total: number;
    ready: number;
    defective: number;
    damaged: number;
    min: number;
    unit: string;
    lastUpdated: string;
}

export interface StockSummary {
    warehouseData: { name: string; total: number; ready: number; defective: number; damaged: number }[];
    topLowStock: { code: string; name: string; stock: number; min: number; warehouse: string }[];
    chartData: { month: string; พร้อมผลิต: number; ตำหนิ: number; ชำรุด: number }[];
}

export interface InventoryTransaction {
    id: string;
    date: string;
    refDoc: string | null;
    type: TransactionType;
    product: string;
    warehouse: string;
    statusFrom: string;
    statusTo: string;
    quantity: number;
    by: string | null;
    note: string | null;
    receiveType: string | null;
    price: number | null;
    batchNo: string | null;
    expireDate: string | null;
    supplier: string | null;
}

export interface StockCountSession {
    id: number;
    name: string;
    warehouse: string;
    status: 'กำลังนับ' | 'เสร็จสิ้น';
    startedBy: string | null;
    startDate: string;
    endDate: string | null;
    items: number;
    counted: number;
}

export interface StockCountItem {
    id: number;
    productId: number;
    code: string;
    name: string;
    systemQty: number;
    countedQty: number | null;
}

export const inventoryService = {
    // --- Warehouses ---
    getWarehouses: async (): Promise<{ status: string; data: Warehouse[] }> => {
        const res = await fetch(`${API_BASE_URL}/inventory_warehouses.php`);
        return res.json();
    },
    saveWarehouse: async (data: { id?: number; code: string; name: string; address?: string; status?: string }) => {
        const res = await fetch(`${API_BASE_URL}/inventory_warehouses.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'warehouse', ...data }),
        });
        return res.json();
    },
    saveLocation: async (data: { id?: number; warehouseId: number; code: string; name: string; status?: string }) => {
        const res = await fetch(`${API_BASE_URL}/inventory_warehouses.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'location', ...data }),
        });
        return res.json();
    },
    deleteWarehouseEntity: async (type: 'warehouse' | 'location', id: number) => {
        const res = await fetch(`${API_BASE_URL}/inventory_warehouses.php?type=${type}&id=${id}`, { method: 'DELETE' });
        return res.json();
    },

    // --- Products / categories / units ---
    getProducts: async (params?: { category?: string; search?: string }) => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        const res = await fetch(`${API_BASE_URL}/inventory_products.php?${query}`);
        return res.json();
    },
    getProductMeta: async (): Promise<{ status: string; data: { categories: InventoryCategory[]; units: InventoryUnit[] } }> => {
        const res = await fetch(`${API_BASE_URL}/inventory_products.php?meta=1`);
        return res.json();
    },
    saveProduct: async (data: Partial<InventoryProduct>) => {
        const res = await fetch(`${API_BASE_URL}/inventory_products.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'product', ...data }),
        });
        return res.json();
    },
    saveCategory: async (data: { id?: number; name: string }) => {
        const res = await fetch(`${API_BASE_URL}/inventory_products.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'category', ...data }),
        });
        return res.json();
    },
    saveUnit: async (data: { id?: number; name: string; abbr?: string }) => {
        const res = await fetch(`${API_BASE_URL}/inventory_products.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'unit', ...data }),
        });
        return res.json();
    },
    deleteProductEntity: async (type: 'product' | 'category' | 'unit', id: number) => {
        const res = await fetch(`${API_BASE_URL}/inventory_products.php?type=${type}&id=${id}`, { method: 'DELETE' });
        return res.json();
    },

    // --- Stock ---
    getStock: async (params?: { warehouse?: string; location?: string; category?: string; search?: string }): Promise<{ status: string; data: StockRow[] }> => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        const res = await fetch(`${API_BASE_URL}/inventory_stock.php?${query}`);
        return res.json();
    },
    getStockSummary: async (): Promise<{ status: string; data: StockSummary }> => {
        const res = await fetch(`${API_BASE_URL}/inventory_stock.php?summary=1`);
        return res.json();
    },

    // --- Transactions ---
    getTransactions: async (params?: { type?: string; warehouse?: string }): Promise<{ status: string; data: InventoryTransaction[] }> => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        const res = await fetch(`${API_BASE_URL}/inventory_transactions.php?${query}`);
        return res.json();
    },
    createTransaction: async (data: {
        type: TransactionType;
        productId: number;
        warehouseCode: string;
        toWarehouseCode?: string;
        status?: StockStatus;
        quantity?: number;
        readyQty?: number;
        defectiveQty?: number;
        damagedQty?: number;
        refDoc?: string;
        employeeName?: string;
        note?: string;
        receiveType?: string;
        price?: number;
        batchNo?: string;
        expireDate?: string;
        supplier?: string;
        locationId?: number;
    }) => {
        const res = await fetch(`${API_BASE_URL}/inventory_transactions.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    // --- Stock count ---
    getStockCountSessions: async (): Promise<{ status: string; data: StockCountSession[] }> => {
        const res = await fetch(`${API_BASE_URL}/inventory_stock_count.php`);
        return res.json();
    },
    getStockCountSession: async (id: number): Promise<{ status: string; data: StockCountSession & { items: StockCountItem[] } }> => {
        const res = await fetch(`${API_BASE_URL}/inventory_stock_count.php?id=${id}`);
        return res.json();
    },
    createStockCountSession: async (data: { name: string; warehouseCode?: string; startedBy?: string }) => {
        const res = await fetch(`${API_BASE_URL}/inventory_stock_count.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create_session', ...data }),
        });
        return res.json();
    },
    saveStockCount: async (sessionId: number, items: { productId: number; countedQty: number }[]) => {
        const res = await fetch(`${API_BASE_URL}/inventory_stock_count.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_count', sessionId, items }),
        });
        return res.json();
    },
    completeStockCount: async (sessionId: number) => {
        const res = await fetch(`${API_BASE_URL}/inventory_stock_count.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'complete_session', sessionId }),
        });
        return res.json();
    },
};
