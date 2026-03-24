export const API_BASE_URL = 'https://nacres.co.th/api-lucky/admin/graphic';

export interface DesignJob {
    id?: number;
    job_code: string;
    client_name: string;
    job_type: string;
    description?: string;
    urgency: "เร่งด่วน 3-5 ชั่วโมง" | "ด่วน 1 วัน" | "ด่วน 2 วัน" | "ปกติ";
    priority: "high" | "medium" | "low";
    designer?: string;
    ordered_by?: string;
    quotation_no?: string;
    status: "รอรับงาน" | "รับงานแล้ว" | "กำลังดำเนินการ" | "รอตรวจสอบ" | "แก้ไข" | "ผลิตชิ้นงาน" | "เสร็จสิ้น";
    progress?: number;

    google_drive_link?: string;
    layout_image?: string;
    artwork_image?: string;
    artwork_status?: "draft" | "pending_review" | "approved" | "rejected";
    production_artwork?: string;
    ai_file?: string;

    internal_notes?: string;
    specs?: string;
    feedback?: string;

    medal_size?: string;
    medal_thickness?: string;
    medal_colors?: string[];
    medal_front_details?: string[];
    medal_back_details?: string[];
    lanyard_size?: string;
    lanyard_patterns?: string;
    quantity?: number;

    order_date?: string;
    due_date?: string;
    assigned_at?: string;
    started_at?: string;
    finish_date?: string;

    revision_rounds?: number;
    qc_pass?: boolean | number;

    created_at?: string;
    updated_at?: string;
}

export const designJobService = {
    getJobs: async (params?: Record<string, any>) => {
        const query = new URLSearchParams(params || {}).toString();
        const res = await fetch(`${API_BASE_URL}/design_jobs.php?${query}`);
        return res.json();
    },

    getJobById: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/design_jobs.php?id=${id}`);
        return res.json();
    },

    createJob: async (data: Partial<DesignJob>) => {
        const res = await fetch(`${API_BASE_URL}/design_jobs.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    updateJob: async (id: number, data: Partial<DesignJob>) => {
        const res = await fetch(`${API_BASE_URL}/design_jobs.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    deleteJob: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/design_jobs.php?id=${id}`, {
            method: 'DELETE',
        });
        return res.json();
    },

    getJobLogs: async (jobId: number, limit = 100) => {
        const res = await fetch(`${API_BASE_URL}/design_job_logs.php?job_id=${jobId}&limit=${limit}`);
        return res.json();
    }
};
