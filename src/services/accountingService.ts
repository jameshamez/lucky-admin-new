const API_BASE_URL = 'https://nacres.co.th/api-lucky/admin';

export const accountingService = {
    getDashboardData: async () => {
        const res = await fetch(`${API_BASE_URL}/accounting/dashboard.php`);
        return await res.json();
    },

    getTransactions: async (type?: 'INCOME' | 'EXPENSE') => {
        let url = `${API_BASE_URL}/accounting/transactions.php`;
        if (type) url += `?type=${type}`;
        const res = await fetch(url);
        return await res.json();
    },

    saveTransaction: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/accounting/transactions.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    getPettyCash: async () => {
        const res = await fetch(`${API_BASE_URL}/accounting/petty_cash.php`);
        return await res.json();
    },

    savePettyCash: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/accounting/petty_cash.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    bulkClearPettyCash: async (ids: number[] | string[], date: string) => {
        const res = await fetch(`${API_BASE_URL}/accounting/petty_cash.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'bulk_clear', ids, date })
        });
        return await res.json();
    },

    getWorkOrders: async () => {
        const res = await fetch(`${API_BASE_URL}/accounting/work_orders.php`);
        return await res.json();
    },

    updateWorkOrderStatus: async (id: string, status: string) => {
        const res = await fetch(`${API_BASE_URL}/accounting/work_orders.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status })
        });
        return await res.json();
    },

    getRevenueData: async () => {
        const res = await fetch(`${API_BASE_URL}/accounting/revenue.php`);
        return await res.json();
    },

    getExpenses: async () => {
        const res = await fetch(`${API_BASE_URL}/accounting/expenses.php`);
        return await res.json();
    },

    saveExpense: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/accounting/expenses.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    deleteExpense: async (id: string | number) => {
        const res = await fetch(`${API_BASE_URL}/accounting/expenses.php?id=${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    getCustomerAccounts: async () => {
        const res = await fetch(`${API_BASE_URL}/accounting/customer_accounts.php`);
        return await res.json();
    },

    getCustomerAccountDetails: async (id: string | number) => {
        const res = await fetch(`${API_BASE_URL}/accounting/customer_accounts.php?id=${id}`);
        return await res.json();
    },

    saveCustomerAccount: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/accounting/customer_accounts.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    addFollowUp: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/accounting/customer_accounts.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, action: 'add_follow_up' })
        });
        return await res.json();
    },

    deleteCustomerAccount: async (id: string | number) => {
        const res = await fetch(`${API_BASE_URL}/accounting/customer_accounts.php?id=${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    getEmployees: async (params?: { department?: string, sales_only?: string }) => {
        let url = `${API_BASE_URL}/employees.php`;
        if (params) {
            const searchParams = new URLSearchParams(params as any);
            url += `?${searchParams.toString()}`;
        }
        const res = await fetch(url);
        return await res.json();
    },

    getOfficeAssets: async () => {
        const res = await fetch(`${API_BASE_URL}/accounting/office_assets.php`);
        return await res.json();
    },

    getOfficeAssetDetails: async (id: string | number) => {
        const res = await fetch(`${API_BASE_URL}/accounting/office_assets.php?id=${id}`);
        return await res.json();
    },

    saveOfficeAsset: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/accounting/office_assets.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    deleteOfficeAsset: async (id: string | number) => {
        const res = await fetch(`${API_BASE_URL}/accounting/office_assets.php?id=${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    getOfficeRequisitions: async () => {
        const res = await fetch(`${API_BASE_URL}/accounting/office_requisitions.php`);
        return await res.json();
    },

    saveOfficeSupply: async (data: any) => {
        const method = data.id ? 'PUT' : 'POST';
        const body = data.id ? data : { ...data, action: 'add_supply' };
        const res = await fetch(`${API_BASE_URL}/accounting/office_requisitions.php`, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await res.json();
    },

    saveOfficeRequisition: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/accounting/office_requisitions.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, action: 'add_requisition' })
        });
        return await res.json();
    },

    deleteOfficeSupply: async (id: string | number) => {
        const res = await fetch(`${API_BASE_URL}/accounting/office_requisitions.php?id=${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    },

    getReportsData: async (type: 'summary' | 'sales' | 'inventory' | 'petty_cash' | 'office_equipment') => {
        const res = await fetch(`${API_BASE_URL}/accounting/reports.php?type=${type}`);
        return await res.json();
    }
};
