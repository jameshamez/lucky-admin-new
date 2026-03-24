const API_BASE_URL = "https://nacres.co.th/api-lucky/admin";

export const reportService = {
    getProductionReports: async (period: string = "month") => {
        try {
            const response = await fetch(`${API_BASE_URL}/production/reports.php?period=${period}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching production reports:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },

    getHRReports: async (type: string = "all", month: string = "all", year: string = "all") => {
        try {
            const response = await fetch(`${API_BASE_URL}/hr/reports.php?type=${type}&month=${month}&year=${year}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching HR reports:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },

    getAccountingReports: async (type: string = "summary") => {
        try {
            const response = await fetch(`${API_BASE_URL}/accounting/reports.php?type=${type}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching accounting reports:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },

    getComprehensiveReports: async (period: string = "monthly", department: string = "all", date: string = "") => {
        try {
            const d = date || new Date().toISOString().split('T')[0];
            const response = await fetch(`${API_BASE_URL}/admin/comprehensive_reports.php?period=${period}&department=${department}&date=${d}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching comprehensive reports:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    }
};
