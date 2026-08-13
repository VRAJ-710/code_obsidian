const express = require('express');
const cors = require('cors');
const db = require('./db');
const Groq = require('groq-sdk');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Cyber Lab sandbox routes (isolated from all other routes/databases)
app.use('/cyberlab', require('./cyberlab'));

// Groq API Key Pool for Backend Proxy
const groqKeys = (process.env.VITE_GROQ_KEYS || process.env.VITE_GROQ_KEY || '')
    .split(',')
    .map(k => k.trim())
    .filter(k => k && !k.includes('dummy'));

let serverKeyIndex = 0;

function getGroqClient() {
    const key = groqKeys.length > 0 
        ? groqKeys[serverKeyIndex % groqKeys.length] 
        : 'gsk_dummy_key_for_dev_mode';
    return new Groq({ apiKey: key });
}

// Resilient Proxy route for Groq API
app.post('/api/groq', async (req, res) => {
    const { system, messages, max_tokens, model } = req.body;
    const groqMessages = [];
    if (system) groqMessages.push({ role: 'system', content: system });
    if (messages && messages.length > 0) groqMessages.push(...messages);

    const attempts = groqKeys.length > 0 ? groqKeys.length : 1;

    for (let i = 0; i < attempts; i++) {
        try {
            const client = getGroqClient();
            const response = await client.chat.completions.create({
                model: model || 'llama-3.3-70b-versatile',
                max_tokens: max_tokens || 1024,
                messages: groqMessages
            });
            return res.json(response);
        } catch (error) {
            console.warn(`[Backend Groq Proxy] Key #${serverKeyIndex % (groqKeys.length || 1)} failed: ${error.message}. Rotating key...`);
            if (groqKeys.length > 0) serverKeyIndex++;
            if (i === attempts - 1) {
                return res.status(500).json({ error: error.message || 'All backend Groq API keys exhausted' });
            }
        }
    }
});

// Registration
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, message: 'User registered' });
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row || row.password !== password) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }
        res.json({ success: true, user: row.username });
    });
});

// Add multer, pdf-parse, mammoth for resume parsing
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.pdf' || ext === '.docx') {
            cb(null, true);
        } else {
            cb(new Error('INVALID_FILE_TYPE'));
        }
    }
});

// Resume parsing endpoint (extracts raw text from .pdf or .docx)
app.post('/api/resume/parse', (req, res) => {
    upload.single('resume')(req, res, async (err) => {
        if (err) {
            if (err.message === 'INVALID_FILE_TYPE') {
                return res.status(400).json({ error: 'Only .pdf and .docx files are allowed' });
            }
            return res.status(400).json({ error: err.message || 'File upload error' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        try {
            const ext = path.extname(req.file.originalname).toLowerCase();
            let text = '';

            if (ext === '.pdf') {
                try {
                    const pdfData = await pdfParse(req.file.buffer);
                    text = pdfData.text || '';
                } catch (pdfErr) {
                    console.warn('[Resume Parser] pdf-parse warning:', pdfErr.message);
                }
                if (!text || !text.trim()) {
                    const bufStr = req.file.buffer.toString('utf8');
                    const matches = bufStr.match(/[\w\s.,@\-:\/]{4,}/g) || [];
                    text = matches.join(' ');
                }
            } else if (ext === '.docx') {
                try {
                    const docxData = await mammoth.extractRawText({ buffer: req.file.buffer });
                    text = docxData.value || '';
                } catch (docxErr) {
                    console.warn('[Resume Parser] mammoth warning:', docxErr.message);
                }
                if (!text || !text.trim()) {
                    const bufStr = req.file.buffer.toString('utf8');
                    const matches = bufStr.match(/[\w\s.,@\-:\/]{4,}/g) || [];
                    text = matches.join(' ');
                }
            } else {
                text = req.file.buffer.toString('utf8');
            }

            text = text.trim();
            if (!text) {
                text = `Resume File Name: ${req.file.originalname}`;
            }

            const wordCount = text.split(/\s+/).filter(Boolean).length;
            res.json({
                text,
                filename: req.file.originalname,
                wordCount
            });
        } catch (parseErr) {
            console.error('[Resume Parser] Extraction Error:', parseErr);
            res.json({
                text: `Resume File: ${req.file.originalname}`,
                filename: req.file.originalname,
                wordCount: 3
            });
        }
    });
});

// Get User Data
app.get('/api/user/:username', (req, res) => {
    const { username } = req.params;
    db.get(`SELECT skills_json, stats_json, activity_json, courses_json, completed_courses_json, resume_json FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'User not found' });

        try {
            const rawSkills = JSON.parse(row.skills_json || '{}');
            const cleanSkills = Object.fromEntries(
                Object.entries(rawSkills).filter(([, v]) => v && typeof v.mastery === 'number')
            );
            res.json({
                skills: cleanSkills,
                stats: JSON.parse(row.stats_json || '{}'),
                activity: JSON.parse(row.activity_json || '{}'),
                courses: JSON.parse(row.courses_json || '{}'),
                completed_courses: JSON.parse(row.completed_courses_json || '[]'),
                resume: JSON.parse(row.resume_json || '{}')
            });
        } catch (e) {
            res.status(500).json({ error: 'Data parsing error' });
        }
    });
});

// Update User Data field dynamically
const updateField = (req, res, field) => {
    const { username } = req.params;
    let data = req.body;

    if (field === 'skills_json' && data && typeof data === 'object') {
        data = Object.fromEntries(
            Object.entries(data).filter(([, v]) => v && typeof v.mastery === 'number')
        );
    }

    const jsonStr = JSON.stringify(data);

    db.run(`UPDATE users SET ${field} = ? WHERE username = ?`, [jsonStr, username], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ success: true });
    });
};

app.post('/api/user/:username/skills', (req, res) => updateField(req, res, 'skills_json'));
app.post('/api/user/:username/stats', (req, res) => updateField(req, res, 'stats_json'));
app.post('/api/user/:username/activity', (req, res) => updateField(req, res, 'activity_json'));
app.post('/api/user/:username/courses', (req, res) => updateField(req, res, 'courses_json'));
app.post('/api/user/:username/completed_courses', (req, res) => updateField(req, res, 'completed_courses_json'));
app.post('/api/user/:username/resume', (req, res) => updateField(req, res, 'resume_json'));

// Save Interview Session
app.post('/api/interview/:username', (req, res) => {
    const { username } = req.params;
    const { role, level, questions, answers, scores, overall_score } = req.body;

    db.run(
        `INSERT INTO interview_sessions (username, role, level, questions_json, answers_json, scores_json, overall_score) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            username,
            role || 'General',
            level || 'Mid',
            JSON.stringify(questions || []),
            JSON.stringify(answers || []),
            JSON.stringify(scores || []),
            overall_score || 0
        ],
        function (err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// List Interview Sessions
app.get('/api/interview/:username', (req, res) => {
    const { username } = req.params;
    db.all(
        `SELECT id, role, level, questions_json, answers_json, scores_json, overall_score, created_at FROM interview_sessions WHERE username = ? ORDER BY created_at DESC`,
        [username],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            const sessions = rows.map(r => ({
                id: r.id,
                role: r.role,
                level: r.level,
                questions: JSON.parse(r.questions_json || '[]'),
                answers: JSON.parse(r.answers_json || '[]'),
                scores: JSON.parse(r.scores_json || '[]'),
                overall_score: r.overall_score,
                created_at: r.created_at
            }));
            res.json(sessions);
        }
    );
});

// Get Chat History
app.get('/api/chat/:username/:agentId', (req, res) => {
    const { username, agentId } = req.params;
    db.all(`SELECT role, content, timestamp FROM chat_messages WHERE user_username = ? AND agent_id = ? ORDER BY timestamp ASC`,
        [username, agentId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(rows);
        }
    );
});

// Save Chat Message
app.post('/api/chat/:username/:agentId', (req, res) => {
    const { username, agentId } = req.params;
    const { role, content, timestamp } = req.body;
    const timeToSave = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();

    db.run(`INSERT INTO chat_messages (user_username, agent_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)`,
        [username, agentId, role, content, timeToSave],
        function (err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ success: true });
        }
    );
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
