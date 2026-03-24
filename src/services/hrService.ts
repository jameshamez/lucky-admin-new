const API_BASE_URL = 'https://nacres.co.th/api-lucky/admin';

export const hrService = {
    getDashboardData: async (month: string, year: string) => {
        const res = await fetch(`${API_BASE_URL}/hr/dashboard.php?month=${month}&year=${year}`);
        return await res.json();
    },
    getEmployees: async () => {
        const res = await fetch(`${API_BASE_URL}/hr/employees.php`);
        return await res.json();
    },
    getPositions: async () => {
        const res = await fetch(`${API_BASE_URL}/hr/employees.php?type=positions`);
        return await res.json();
    },
    getProductCategories: async () => {
        const res = await fetch(`${API_BASE_URL}/hr/employees.php?type=categories`);
        return await res.json();
    },
    saveEmployee: async (data: any, isEdit: boolean) => {
        const res = await fetch(`${API_BASE_URL}/hr/employees.php`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    resignEmployee: async (id: string) => {
        const res = await fetch(`${API_BASE_URL}/hr/employees.php?id=${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    },
    addPosition: async (name: string) => {
        const res = await fetch(`${API_BASE_URL}/hr/employees.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_position', name })
        });
        return await res.json();
    },
    deletePosition: async (name: string) => {
        const res = await fetch(`${API_BASE_URL}/hr/employees.php?type=position&name=${name}`, {
            method: 'DELETE'
        });
        return await res.json();
    },
    getMTOCommissions: async (status?: string, month?: string, year?: string) => {
        let url = `${API_BASE_URL}/hr/commission_mto.php?status=${status || ''}`;
        if (month) url += `&month=${month}`;
        if (year) url += `&year=${year}`;
        const res = await fetch(url);
        return await res.json();
    },
    createMTOCommission: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/hr/commission_mto.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    completeMTOCommissions: async (ids: string[], period: string, updates?: Record<string, any>) => {
        const res = await fetch(`${API_BASE_URL}/hr/commission_mto.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'complete', ids, commissionPeriod: period, updates })
        });
        return await res.json();
    },
    getReadyMadeCommissions: async (status?: string, month?: string, year?: string) => {
        let url = `${API_BASE_URL}/hr/commission_ready_made.php?status=${status || ''}`;
        if (month) url += `&month=${month}`;
        if (year) url += `&year=${year}`;
        const res = await fetch(url);
        return await res.json();
    },
    createReadyMadeCommission: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/hr/commission_ready_made.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    completeReadyMadeCommissions: async (ids: string[], period: string, updates?: Record<string, any>) => {
        const res = await fetch(`${API_BASE_URL}/hr/commission_ready_made.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'complete', ids, commissionPeriod: period, updates })
        });
        return await res.json();
    },
    // Settings & KPI Methods
    getSettings: async (type: 'ready_made' | 'mto' | 'incentives' | 'kpi_records' | 'kpi_integrations', month?: string) => {
        let url = `${API_BASE_URL}/hr/settings.php?type=${type}`;
        if (month) url += `&month=${month}`;
        const res = await fetch(url);
        return await res.json();
    },
    saveSetting: async (type: string, data: any, isEdit: boolean) => {
        const res = await fetch(`${API_BASE_URL}/hr/settings.php?type=${type}`, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    deleteSetting: async (type: string, id: string) => {
        const res = await fetch(`${API_BASE_URL}/hr/settings.php?type=${type}&id=${id}`, {
            method: 'DELETE'
        });
        return await res.json();
    },
    getCommissionReport: async (month?: string, year?: string) => {
        let url = `${API_BASE_URL}/hr/commission_report.php?`;
        if (month) url += `month=${month}&`;
        if (year) url += `year=${year}`;
        const res = await fetch(url);
    },
    getHRReports: async (month?: string, year?: string) => {
        let url = `${API_BASE_URL}/hr/reports.php?type=all`;
        if (month && month !== 'all') url += `&month=${month}`;
        if (year && year !== 'all') url += `&year=${year}`;
        const res = await fetch(url);
        return await res.json();
    }
};
