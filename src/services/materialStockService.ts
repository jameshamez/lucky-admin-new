export const API_BASE_URL = 'https://finfinphone.com/api-lucky/admin/graphic';

export const materialStockService = {
    // Materials
    getMaterials: async (params?: any) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE_URL}/materials.php?${query}`);
        return res.json();
    },
    getMaterial: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/materials.php/${id}`);
        return res.json();
    },
    createMaterial: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/materials.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    updateMaterial: async (id: number, data: any) => {
        const res = await fetch(`${API_BASE_URL}/materials.php/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    adjustStock: async (id: number, data: any) => {
        const res = await fetch(`${API_BASE_URL}/materials.php/${id}/adjust`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    deleteMaterial: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/materials.php/${id}`, {
            method: 'DELETE',
        });
        return res.json();
    },

    // Requests
    getRequests: async (params?: any) => {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE_URL}/material_requests.php?${query}`);
        return res.json();
    },
    createRequest: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/material_requests.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    updateRequest: async (id: number, data: any) => {
        const res = await fetch(`${API_BASE_URL}/material_requests.php/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    cancelRequest: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/material_requests.php/${id}`, {
            method: 'DELETE',
        });
        return res.json();
    }
};
