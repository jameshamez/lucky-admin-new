const API_BASE_URL = "https://nacres.co.th/api-lucky/admin";

export const communicationService = {
    getChannels: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/communication.php?action=channels`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching channels:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },

    getMessages: async (channelId: number | string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/communication.php?action=messages&channel_id=${channelId}`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching messages:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },

    sendMessage: async (data: { channel_id: number; message: string; user_id?: number; user_name: string; avatar_fallback: string }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/communication.php?action=send_message`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error sending message:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },

    getAnnouncements: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/communication.php?action=announcements`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching announcements:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },

    addAnnouncement: async (data: { title: string; content: string; author_name: string; is_pinned?: boolean }) => {
        try {
            const response = await fetch(`${API_BASE_URL}/communication.php?action=add_announcement`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error adding announcement:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },

    getNotifications: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/communication.php?action=notifications`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching notifications:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    },

    getFiles: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/communication.php?action=files`);
            if (!response.ok) throw new Error("Network response was not ok");
            return await response.json();
        } catch (error) {
            console.error("Error fetching files:", error);
            return { status: "error", message: error instanceof Error ? error.message : "Internal Server Error" };
        }
    }
};
