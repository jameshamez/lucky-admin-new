export const API_BASE_URL = 'https://nacres.co.th/api-lucky/admin/production';

export type SupplyMovementType = "รับเข้า" | "จ่ายออก" | "ปรับยอด";

export interface OfficeSupply {
    id: string;
    supplyId: number;
    name: string;
    category: string;
    currentStock: number;
    minimumStock: number;
    unit: string;
    lastUpdated: string;
    status: "ขาดแคลน" | "ใกล้หมด" | "ปกติ";
}

export interface SupplyMovement {
    id: string;
    date: string;
    type: SupplyMovementType;
    item: string;
    qty: number;
    unit: string;
    by: string | null;
    note: string | null;
    orderRef: string | null;
}

export interface SupplyDefect {
    id: string;
    product: string;
    quantity: number;
    defectType: string;
    reportDate: string;
    reportedBy: string;
    orderRef: string;
    action: string;
}

export const officeSuppliesService = {
    getStock: async (): Promise<{ status: string; data: OfficeSupply[] }> => {
        const res = await fetch(`${API_BASE_URL}/office_supplies.php?type=stock`);
        return res.json();
    },
    getMovements: async (): Promise<{ status: string; data: SupplyMovement[] }> => {
        const res = await fetch(`${API_BASE_URL}/office_supplies.php?type=movements`);
        return res.json();
    },
    getDefects: async (): Promise<{ status: string; data: SupplyDefect[] }> => {
        const res = await fetch(`${API_BASE_URL}/office_supplies.php?type=defects`);
        return res.json();
    },
    recordMovement: async (data: {
        supplyId: number;
        type: SupplyMovementType;
        qty: number;
        employeeName?: string;
        note?: string;
        orderRef?: string;
    }) => {
        const res = await fetch(`${API_BASE_URL}/office_supplies.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'movement', ...data }),
        });
        return res.json();
    },
    recordDefect: async (data: {
        productName: string;
        quantity: number;
        defectType?: string;
        reportedBy?: string;
        orderRef?: string;
        resolutionAction?: string;
        note?: string;
    }) => {
        const res = await fetch(`${API_BASE_URL}/office_supplies.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'defect', ...data }),
        });
        return res.json();
    },
    bulkImport: async (type: "รับเข้า" | "จ่ายออก", rows: { code: string; qty: number; note?: string }[]) => {
        const res = await fetch(`${API_BASE_URL}/office_supplies.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'bulk_import', type, rows }),
        });
        return res.json();
    },
};
