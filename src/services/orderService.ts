const API_BASE_URL = "https://nacres.co.th/api-lucky/admin";

export interface DashboardSummary {
    statusCounts: {
        request: number;
        draft: number;
        confirmed: number;
        jobCreated: number;
    };
    paymentCounts: {
        partial: number;
        pending: number;
        credit: number;
    };
    totalRevenue: number;
    totalPaid: number;
}

export interface Order {
    id: number;
    job_id: string;
    customer_name: string;
    job_name: string;
    order_date: string;
    usage_date: string | null;
    delivery_date: string | null;
    order_status: string;
    responsible_person: string;
    total_amount: number | string;
    total_price?: number | string;
    payment_status: string;
    created_at: string;
    urgency_level?: string;
}

export const orderService = {
    getOrders: async (params?: Record<string, string | number>) => {
        try {
            const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
            const response = await fetch(`${API_BASE_URL}/orders.php${query}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching orders:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },
    getOrderById: async (id: number | string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders.php?id=${id}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching order:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },
    createOrder: async (data: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error creating order:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },
    updateOrder: async (id: number | string, data: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders.php?id=${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error updating order:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },
    patchOrder: async (id: number | string, data: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders.php?id=${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error patching order:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },
    deleteOrder: async (id: number | string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/orders.php?id=${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error deleting order:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    }
};
