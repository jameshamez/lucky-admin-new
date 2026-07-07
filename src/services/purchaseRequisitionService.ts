const API_BASE_URL = 'https://nacres.co.th/api-lucky/admin';

export const purchaseRequisitionService = {
    getAll: async () => {
        const res = await fetch(`${API_BASE_URL}/procurement/purchase_requisitions.php`);
        return res.json();
    },
    getOne: async (id: string | number) => {
        const res = await fetch(`${API_BASE_URL}/procurement/purchase_requisitions.php?id=${id}`);
        return res.json();
    },
    create: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/procurement/purchase_requisitions.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    update: async (id: string | number, data: any) => {
        const res = await fetch(`${API_BASE_URL}/procurement/purchase_requisitions.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    updateStatus: async (id: string | number, status: string, poNumber?: string) => {
        const res = await fetch(`${API_BASE_URL}/procurement/purchase_requisitions.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, poNumber }),
        });
        return res.json();
    },
    uploadFile: async (file: File, folder = "purchase-requisitions"): Promise<{ status: string; url?: string; file?: { name: string; size: number } }> => {
        const form = new FormData();
        form.append("file", file);
        form.append("folder", folder);
        const res = await fetch(`${API_BASE_URL}/upload.php`, { method: 'POST', body: form });
        return res.json();
    },
};
