const API_BASE_URL = "https://finfinphone.com/api-lucky/admin";
export const adminService = {
    getDashboardData: async (period: string = "month") => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/dashboard.php?period=${period}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching admin dashboard data:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },
    getComprehensiveReports: async (period: string, department: string, date: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/comprehensive_reports.php?period=${period}&department=${department}&date=${date}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching comprehensive reports:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },
    // User Management
    getUsers: async (params?: Record<string, string>) => {
        try {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            const response = await fetch(`${API_BASE_URL}/users.php${query}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching users:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },
    createUser: async (data: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error creating user:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },
    updateUser: async (id: number | string, data: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users.php?id=${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error updating user:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },
    deleteUser: async (id: number | string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users.php?id=${id}`, {
                method: "DELETE",
            });
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error deleting user:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },
    // System Settings
    getSettings: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/settings.php`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching settings:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },
    updateSetting: async (key: string, value: any) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/settings.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value }),
            });
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error updating setting:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    }
};
