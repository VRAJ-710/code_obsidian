const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = process.env.DATABASE_DIR || __dirname;
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.resolve(dbDir, 'devmentor.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to SQLite database.');

        // Define schemas
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                skills_json TEXT DEFAULT '{}',
                stats_json TEXT DEFAULT '{}',
                activity_json TEXT DEFAULT '{}',
                courses_json TEXT DEFAULT '{}',
                completed_courses_json TEXT DEFAULT '[]',
                resume_json TEXT DEFAULT '{}',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Safe migration for existing devmentor.db databases
            db.all(`PRAGMA table_info(users)`, (err, rows) => {
                if (!err && rows) {
                    const hasResume = rows.some(r => r.name === 'resume_json');
                    if (!hasResume) {
                        db.run(`ALTER TABLE users ADD COLUMN resume_json TEXT DEFAULT '{}'`);
                        console.log('Added resume_json column to users table.');
                    }
                }
            });

            db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_username TEXT NOT NULL,
                agent_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_username) REFERENCES users(username)
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS interview_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                role TEXT NOT NULL,
                level TEXT NOT NULL,
                questions_json TEXT NOT NULL,
                answers_json TEXT NOT NULL,
                scores_json TEXT NOT NULL,
                overall_score INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(username) REFERENCES users(username)
            )`);
        });
    }
});

module.exports = db;
