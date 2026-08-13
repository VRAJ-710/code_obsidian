const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_URL = `${BASE_URL.replace(/\/+$/, '')}/api`;

export const dbService = {
    // --- Auth ---
    async register(username, password) {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) {
            let errorMsg = 'Failed to register';
            try {
                const data = await res.json();
                errorMsg = data.error || errorMsg;
            } catch (e) {
                errorMsg = `Server error (${res.status})`;
            }
            throw new Error(errorMsg);
        }
        return res.json();
    },

    async login(username, password) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) {
            let errorMsg = 'Failed to login';
            try {
                const data = await res.json();
                errorMsg = data.error || errorMsg;
            } catch (e) {
                errorMsg = `Invalid username or password (${res.status})`;
            }
            throw new Error(errorMsg);
        }
        return res.json();
    },

    // --- User Data ---
    async getUserData(username) {
        try {
            const res = await fetch(`${API_URL}/user/${username}`);
            if (!res.ok) return null;
            return res.json();
        } catch {
            return null;
        }
    },

    async updateField(username, field, data) {
        try {
            await fetch(`${API_URL}/user/${username}/${field}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.error(`Failed to update ${field}:`, e);
        }
    },

    // --- Chat ---
    async getChatHistory(username, agentId) {
        try {
            const res = await fetch(`${API_URL}/chat/${username}/${agentId}`);
            if (!res.ok) return [];
            const rows = await res.json();
            return rows.map(r => ({
                role: r.role,
                content: r.content,
                timestamp: new Date(r.timestamp).getTime()
            }));
        } catch {
            return [];
        }
    },

    async saveChatMessage(username, agentId, msg) {
        try {
            await fetch(`${API_URL}/chat/${username}/${agentId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: msg.role,
                    content: msg.content,
                    timestamp: msg.timestamp
                })
            });
        } catch (e) {
            console.error("Failed to save chat message:", e);
        }
    },

    // --- Resume ---
    async parseResume(file) {
        const formData = new FormData();
        formData.append('resume', file);

        const res = await fetch(`${API_URL}/resume/parse`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            let errorMsg = 'Could not read this file';
            try {
                const data = await res.json();
                errorMsg = data.error || errorMsg;
            } catch {}
            throw new Error(errorMsg);
        }
        return res.json();
    },

    // --- Interview Sessions ---
    async saveInterviewSession(username, sessionData) {
        try {
            const res = await fetch(`${API_URL}/interview/${username}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData)
            });
            if (!res.ok) return null;
            return res.json();
        } catch (e) {
            console.error("Failed to save interview session:", e);
            return null;
        }
    },

    async getInterviewSessions(username) {
        try {
            const res = await fetch(`${API_URL}/interview/${username}`);
            if (!res.ok) return [];
            return res.json();
        } catch {
            return [];
        }
    }
};
