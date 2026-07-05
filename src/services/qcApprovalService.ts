export const API_BASE_URL = 'https://nacres.co.th/api-lucky/admin';

export type QCDepartment = "เซลล์" | "จัดซื้อ";
export type QCApprovalStatus = "pending" | "passed" | "failed";

export interface QCApproval {
    department: QCDepartment;
    status: QCApprovalStatus;
    approvedBy?: string | null;
    approvedAt?: string | null;
    comment?: string | null;
}

export type QCApprovalsByStep = Record<string, QCApproval[]>;

export const qcApprovalService = {
    getApprovals: async (orderId: string, steps: string[]): Promise<{ status: string; data: QCApprovalsByStep }> => {
        const res = await fetch(`${API_BASE_URL}/qc_approvals.php?orderId=${encodeURIComponent(orderId)}&steps=${encodeURIComponent(steps.join(','))}`);
        return res.json();
    },
    updateApproval: async (data: {
        orderId: string;
        stepKey: string;
        department: QCDepartment;
        status: "passed" | "failed";
        comment?: string;
        approvedBy?: string;
    }) => {
        const res = await fetch(`${API_BASE_URL}/qc_approvals.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
};
