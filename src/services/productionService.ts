import { API_BASE_URL } from "./procurementService";

export const productionService = {
    // Dashboard
    getDashboardData: async () => {
        const res = await fetch(`${API_BASE_URL}/production/dashboard.php`);
        return await res.json();
    },

    // Orders
    getOrders: async (params?: any) => {
        let url = `${API_BASE_URL}/orders.php`;
        if (params) {
            const query = new URLSearchParams(params).toString();
            url += `?${query}`;
        }
        const res = await fetch(url);
        return await res.json();
    },

    updateOrderStatus: async (id: number | string, status: string) => {
        const res = await fetch(`${API_BASE_URL}/orders.php?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_status: status })
        });
        return await res.json();
    },

    updateProductionWorkflow: async (id: number | string, workflow: any) => {
        const res = await fetch(`${API_BASE_URL}/orders.php?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ production_workflow: workflow })
        });
        return await res.json();
    },

    // Vehicle Management
    getVehicles: async () => {
        const res = await fetch(`${API_BASE_URL}/production/vehicles.php`);
        return await res.json();
    },

    saveVehicle: async (data: any) => {
        const isUpdate = !!data.id;
        const res = await fetch(`${API_BASE_URL}/production/vehicles.php`, {
            method: isUpdate ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    getVehicleLogs: async (vehicleId?: number | string) => {
        let url = `${API_BASE_URL}/production/vehicle_usage.php`;
        if (vehicleId) url += `?vehicle_id=${vehicleId}`;
        const res = await fetch(url);
        return await res.json();
    },

    saveVehicleLog: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/production/vehicle_usage.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    getVehicleReservations: async () => {
        const res = await fetch(`${API_BASE_URL}/vehicle_reservations.php`);
        return await res.json();
    },

    saveVehicleReservation: async (data: any) => {
        const res = await fetch(`${API_BASE_URL}/vehicle_reservations.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    updateVehicleReservationStatus: async (id: number | string, status: string, rejectReason?: string) => {
        const payload: any = { id, status };
        if (rejectReason) payload.reject_reason = rejectReason;
        const res = await fetch(`${API_BASE_URL}/vehicle_reservations.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await res.json();
    },

    getReportsData: async (period: string = 'this-month') => {
        const res = await fetch(`${API_BASE_URL}/production/reports.php?period=${period}`);
        return await res.json();
    }
};
