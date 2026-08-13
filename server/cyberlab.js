const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// ── Sandbox Database (completely isolated from devmentor.db) ──────────────
const dbDir = process.env.DATABASE_DIR || __dirname;
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
const SANDBOX_PATH = path.resolve(dbDir, 'cyberlab_sandbox.db');
let sandboxDb;

function seedUsers() {
    sandboxDb.exec(`
        DROP TABLE IF EXISTS users;
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            email TEXT,
            role TEXT DEFAULT 'user',
            balance REAL DEFAULT 0.0
        );
        INSERT INTO users (username, password, email, role, balance) VALUES
            ('admin',   'hunter2',      'admin@securebank.com',   'admin',   1000000.00),
            ('alice',   'password123',  'alice@email.com',        'user',    5420.50),
            ('bob',     'qwerty',       'bob@email.com',          'user',    12050.75),
            ('charlie', 'letmein',      'charlie@email.com',      'manager', 89200.00),
            ('diana',   'trustno1',     'diana@email.com',        'user',    3150.25);
    `);
}

function seedComments() {
    sandboxDb.exec(`
        DROP TABLE IF EXISTS comments;
        CREATE TABLE comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO comments (author, content) VALUES
            ('Alice',   'Great website! Love the design.'),
            ('Bob',     'First time here, looking good!'),
            ('Charlie', 'Thanks for the helpful content.');
    `);
}

function initSandboxDb() {
    sandboxDb = new Database(SANDBOX_PATH);
    sandboxDb.pragma('journal_mode = WAL');
    seedUsers();
    seedComments();
    console.log('[CyberLab] Sandbox database initialized at', SANDBOX_PATH);
}

initSandboxDb();

// ── Rate Limiting (keyed by user ID, not IP) ─────────────────────────────
const cyberlabLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    keyGenerator: (req) => req.headers['x-cyberlab-user'] || 'anonymous',
    message: { error: 'Rate limit exceeded. Wait a moment before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.use(cyberlabLimiter);

// ── SQLi: Vulnerable ─────────────────────────────────────────────────────
router.post('/sqli/vulnerable', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username && !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // INTENTIONALLY VULNERABLE — raw string concatenation
        const query = `SELECT * FROM users WHERE username = '${username || ''}' AND password = '${password || ''}'`;

        let results;
        try {
            results = sandboxDb.prepare(query).all();
        } catch (sqlErr) {
            return res.json({ query, error: sqlErr.message, results: [], rowCount: 0, exploited: false });
        }

        // Detect exploit: check if the payload contains injection markers
        const input = (username || '') + (password || '');
        const exploited = results.length > 0 && /['";]|OR\s|UNION|--|#/i.test(input);

        res.json({ query, results, rowCount: results.length, exploited });
    } catch (err) {
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// ── SQLi: Fixed ──────────────────────────────────────────────────────────
router.post('/sqli/fixed', (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username && !password) {
            return res.status(400).json({ error: 'Username and password are required.' });
        }

        // SECURE — parameterized query
        const stmt = sandboxDb.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
        const results = stmt.all(username || '', password || '');

        res.json({
            query: 'SELECT * FROM users WHERE username = ? AND password = ?',
            params: [username || '', password || ''],
            results,
            rowCount: results.length,
            exploited: false,
            blocked: true,
            message: results.length === 0
                ? 'Parameterized query treated the input as a literal string — the injection was neutralized.'
                : 'Query executed safely with parameterized inputs.',
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// ── XSS helpers ──────────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function buildCommentsPage(comments, escaped, title) {
    const renderField = escaped ? escapeHtml : (s) => s;
    const commentsHtml = comments.map(c =>
        `<div style="padding:12px;margin:8px 0;background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid rgba(255,255,255,0.1);">
            <div style="font-weight:bold;color:#22d3ee;font-size:13px;margin-bottom:4px;">${renderField(c.author)}</div>
            <div style="color:rgba(255,255,255,0.8);font-size:13px;">${renderField(c.content)}</div>
            <div style="color:rgba(255,255,255,0.3);font-size:10px;margin-top:6px;">${c.created_at}</div>
        </div>`
    ).join('');

    return `<!DOCTYPE html><html><head><style>
body{background:#0a0a0f;color:#fff;font-family:'Inter',system-ui,sans-serif;padding:16px;margin:0}
h3{color:#22d3ee;font-size:15px;margin:0 0 12px;letter-spacing:.05em;text-transform:uppercase}
</style></head><body><h3>${title}</h3>${commentsHtml}</body></html>`;
}

// ── XSS: Vulnerable ─────────────────────────────────────────────────────
router.post('/xss/vulnerable', (req, res) => {
    try {
        const { author, comment } = req.body;
        if (!comment) return res.status(400).json({ error: 'Comment content is required.' });

        sandboxDb.prepare('INSERT INTO comments (author, content) VALUES (?, ?)').run(author || 'Anonymous', comment);
        const comments = sandboxDb.prepare('SELECT * FROM comments ORDER BY id DESC').all();

        const html = buildCommentsPage(comments, false, '📝 Guestbook Comments');
        const exploited = /<script|onerror\s*=|onload\s*=|javascript:/i.test(comment);

        res.json({ html, commentCount: comments.length, exploited, rawInput: comment });
    } catch (err) {
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// ── XSS: Fixed ───────────────────────────────────────────────────────────
router.post('/xss/fixed', (req, res) => {
    try {
        const { author, comment } = req.body;
        if (!comment) return res.status(400).json({ error: 'Comment content is required.' });

        // We don't persist to the fixed table — just render existing + new with escaping
        const comments = sandboxDb.prepare('SELECT * FROM comments ORDER BY id DESC').all();
        // Prepend the new comment as if it were stored
        const allComments = [{ author: author || 'Anonymous', content: comment, created_at: new Date().toISOString() }, ...comments];

        const html = buildCommentsPage(allComments, true, '📝 Guestbook Comments (Secured)');

        res.json({
            html,
            commentCount: allComments.length,
            exploited: false,
            blocked: true,
            message: 'HTML entities were escaped before rendering. Script tags became harmless text: ' + escapeHtml(comment),
            rawInput: comment,
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// ── Reset ────────────────────────────────────────────────────────────────
router.post('/reset/:scenario', (req, res) => {
    try {
        const { scenario } = req.params;
        if (scenario === 'sqli' || scenario === 'all') seedUsers();
        if (scenario === 'xss' || scenario === 'all') seedComments();
        if (scenario !== 'sqli' && scenario !== 'xss' && scenario !== 'all') {
            return res.status(400).json({ error: 'Unknown scenario. Use "sqli", "xss", or "all".' });
        }
        res.json({ success: true, message: `Scenario "${scenario}" has been reset.` });
    } catch (err) {
        res.status(500).json({ error: 'Reset failed: ' + err.message });
    }
});

module.exports = router;
