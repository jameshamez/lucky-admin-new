export const API_BASE_URL = 'https://nacres.co.th/api-lucky/admin';

class MaterialStockService {
    private department: string;

    constructor(department: string) {
        this.department = department;
    }

    private getQueryString(params: any = {}) {
        return new URLSearchParams({ ...params, department: this.department }).toString();
    }

    // Materials
    async getMaterials(params?: any) {
        const query = this.getQueryString(params);
        const res = await fetch(`${API_BASE_URL}/materials.php?${query}`);
        return res.json();
    }

    async getMaterial(id: number) {
        const query = this.getQueryString();
        const res = await fetch(`${API_BASE_URL}/materials.php/${id}?${query}`);
        return res.json();
    }

    async createMaterial(data: any) {
        const res = await fetch(`${API_BASE_URL}/materials.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, department: this.department }),
        });
        return res.json();
    }

    async updateMaterial(id: number, data: any) {
        const res = await fetch(`${API_BASE_URL}/materials.php/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, department: this.department }),
        });
        return res.json();
    }

    async adjustStock(id: number, data: any) {
        const res = await fetch(`${API_BASE_URL}/materials.php/${id}/adjust`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    }

    async deleteMaterial(id: number) {
        const res = await fetch(`${API_BASE_URL}/materials.php/${id}`, {
            method: 'DELETE',
        });
        return res.json();
    }

    // Requests
    async getRequests(params?: any) {
        const query = this.getQueryString(params);
        const res = await fetch(`${API_BASE_URL}/material_requests.php?${query}`);
        return res.json();
    }

    async createRequest(data: any) {
        const res = await fetch(`${API_BASE_URL}/material_requests.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, department: this.department }),
        });
        return res.json();
    }

    async updateRequest(id: number, data: any) {
        const res = await fetch(`${API_BASE_URL}/material_requests.php/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, department: this.department }),
        });
        return res.json();
    }

    async cancelRequest(id: number) {
        const res = await fetch(`${API_BASE_URL}/material_requests.php/${id}`, {
            method: 'DELETE',
        });
        return res.json();
    }

    // Employees
    async getEmployees(params?: any) {
        const query = new URLSearchParams(params).toString();
        const res = await fetch(`${API_BASE_URL}/employees.php?${query}`);
        return res.json();
    }
}

// Fixed instances for common departments
export const designStockService = new MaterialStockService('design');
export const salesStockService = new MaterialStockService('sales');

// Default export if needed (will default to design for backward compatibility)
export const materialStockService = designStockService;
export { MaterialStockService };
