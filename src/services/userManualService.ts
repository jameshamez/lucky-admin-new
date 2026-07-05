export const API_BASE_URL = 'https://nacres.co.th/api-lucky/admin';

export interface VideoTutorial {
    id: number;
    title: string;
    description: string;
    videoUrl: string;
    thumbnail: string;
}

export interface ManualAttachment {
    id: number;
    fileName: string;
    fileUrl: string;
}

export interface ManualSubcategory {
    id: number;
    title: string;
    content: string;
    attachments: ManualAttachment[];
}

export interface ManualSection {
    id: number;
    category: string;
    subcategories: ManualSubcategory[];
}

export interface QuizQuestion {
    id?: number;
    question: string;
    options: string[];
    correctIndex?: number; // absent when fetched in "take" mode
}

export interface Quiz {
    id: number;
    title: string;
    category: string;
    passingScore: number;
    questions: number;
    questionList: QuizQuestion[];
}

export interface QuizAttemptAnswer {
    questionId: number;
    selectedIndex: number;
}

export interface QuizAttemptResult {
    correct: number;
    total: number;
    percent: number;
    passingScore: number;
    passed: boolean;
    review: {
        questionId: number;
        selectedIndex: number;
        correctIndex: number;
        isCorrect: boolean;
    }[];
}

export const userManualService = {
    // --- Videos ---
    getVideos: async () => {
        const res = await fetch(`${API_BASE_URL}/user_manual_videos.php`);
        return res.json();
    },
    saveVideo: async (data: Partial<VideoTutorial>) => {
        const res = await fetch(`${API_BASE_URL}/user_manual_videos.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    deleteVideo: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/user_manual_videos.php?id=${id}`, { method: 'DELETE' });
        return res.json();
    },

    // --- Manuals ---
    getManuals: async () => {
        const res = await fetch(`${API_BASE_URL}/user_manual_manuals.php`);
        return res.json();
    },
    saveSection: async (data: { id?: number; category: string }) => {
        const res = await fetch(`${API_BASE_URL}/user_manual_manuals.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'section', ...data }),
        });
        return res.json();
    },
    saveSubsection: async (data: { id?: number; sectionId: number; title: string; content: string }) => {
        const res = await fetch(`${API_BASE_URL}/user_manual_manuals.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'subsection', ...data }),
        });
        return res.json();
    },
    addAttachment: async (data: { subsectionId: number; fileName: string; fileUrl: string }) => {
        const res = await fetch(`${API_BASE_URL}/user_manual_manuals.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'attachment', ...data }),
        });
        return res.json();
    },
    deleteManualEntity: async (type: 'section' | 'subsection' | 'attachment', id: number) => {
        const res = await fetch(`${API_BASE_URL}/user_manual_manuals.php?type=${type}&id=${id}`, { method: 'DELETE' });
        return res.json();
    },

    // --- Quizzes ---
    getQuizzes: async () => {
        const res = await fetch(`${API_BASE_URL}/user_manual_quizzes.php`);
        return res.json();
    },
    getQuiz: async (id: number, mode: 'take' | 'edit' = 'edit') => {
        const res = await fetch(`${API_BASE_URL}/user_manual_quizzes.php?id=${id}&mode=${mode}`);
        return res.json();
    },
    saveQuiz: async (data: Partial<Quiz>) => {
        const res = await fetch(`${API_BASE_URL}/user_manual_quizzes.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },
    deleteQuiz: async (id: number) => {
        const res = await fetch(`${API_BASE_URL}/user_manual_quizzes.php?id=${id}`, { method: 'DELETE' });
        return res.json();
    },

    // --- Attempts ---
    submitAttempt: async (data: { quizId: number; username?: string; fullName?: string; answers: QuizAttemptAnswer[] }) => {
        const res = await fetch(`${API_BASE_URL}/user_manual_attempts.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return res.json();
    },

    // --- Upload ---
    uploadFile: async (file: File, folder: string = 'user-manual') => {
        const form = new FormData();
        form.append('file', file);
        form.append('folder', folder);
        const res = await fetch(`${API_BASE_URL}/upload.php`, {
            method: 'POST',
            body: form,
        });
        return res.json();
    },
};
