export const API_BASE_URL = 'https://finfinphone.com/api-lucky/admin';

export const procurementService = {
    // Dashboard
    getDashboardData: async () => {
        const res = await fetch(`${API_BASE_URL}/procurement/dashboard.php`);
        return res.json();
    },

    // Suppliers
    getSuppliers: async () => {
        const res = await fetch(`${API_BASE_URL}/procurement/suppliers.php`);
        return res.json();
    },
    createSupplier: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/procurement/suppliers.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    updateSupplier: async (id: number, data: any) => {
        const res = await fetch(`${API_BASE_URL}/procurement/suppliers.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    deleteSupplier: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/procurement/suppliers.php?id=${id}`, {
            method: 'DELETE',
        });
        return res.json();
    },

    // Settings
    getSettings: async (type: string) => {
        const res = await fetch(`${API_BASE_URL}/procurement/settings.php?type=${type}`);
        return res.json();
    },
    createSetting: async (type: string, data: any) => {
        const res = await fetch(`${API_BASE_URL}/procurement/settings.php?type=${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    deleteSetting: async (type: string, id: number) => {
        const res = await fetch(`${API_BASE_URL}/procurement/settings.php?type=${type}&id=${id}`, {
            method: 'DELETE',
        });
        return res.json();
    },

    // Reports
    getReportData: async () => {
        const res = await fetch(`${API_BASE_URL}/procurement/reports.php`);
        return res.json();
    }
};
