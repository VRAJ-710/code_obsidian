<div align="center">

# ⚔️ CODE OBSIDIAN

### *Where Cybersecurity Meets the Future of AI-Driven Learning*

[![Live Demo](https://img.shields.io/badge/🚀%20Live%20Demo-code__obsidian.vercel.app-blueviolet?style=for-the-badge)](https://code-obsidian.vercel.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel)](https://code-obsidian.vercel.app)
[![Groq](https://img.shields.io/badge/Groq-AI%20Powered-F55036?style=for-the-badge)](https://groq.com/)

> **Code Obsidian** is an immersive, full-stack, AI-driven cybersecurity and programming education platform designed to feel like a high-tech command center. It features adaptive learning paths, real-time AI mentoring, interactive security sandboxes, and resume-driven profile calibrations.

</div>

---

## 🌐 Live Demo

Experience the platform live at: **[https://code-obsidian.vercel.app](https://code-obsidian.vercel.app)**

---

## 🎯 The Problem We're Solving

Traditional cybersecurity education is static, disconnected, and dry. Students read text documentation, solve generic multiple-choice quizzes, and struggle to apply security principles to real-world architectures.

**Code Obsidian transforms this experience.** It turns technical training into a gamified, high-stakes simulation guided by a team of contextual AI mentors who understand your background, evaluate your skill gaps, and custom-build paths to guide your progression.

---

## ✨ Key Features

### 📁 Resume Intelligence & Profile Parsing
* **AI-Powered Extraction**: Upload resumes in PDF or DOCX format to parse skills, technical projects, and professional history automatically.
* **Skill Graph Syncing**: Directly injects parsed experience into your dynamic skill tree to calibrate subsequent recommendations and mock interviews.

### 🧠 AI Skill Path Prediction & Recommendations
* **Contextual Course Advisor**: Analyzes your current competency levels across network security, database management, and programming languages to suggest targeted learning paths.
* **Adaptive Recommendations**: Focuses recommendations on your weakest nodes to help you master challenging topics.

### 🧪 Cyber Lab — Interactive Hacking Sandbox
* **AI Attack Simulator**: Input cyberattack vectors (like SQL Injection or Cross-Site Scripting) and watch step-by-step, AI-driven visualizations of how they execute.
* **Vulnerability Visualizer**: Graphically maps weak points in modern application architectures.
* **Payload Playground**: Run security exploits safely inside a simulated sandbox and get immediate, helpful feedback from your AI mentor.
* **CTF Challenges**: Real Capture-the-Flag scenarios with interactive flags, target systems, and verification.

### 🤖 AI Studio & Mentor Roster
Engage with specialised, context-aware AI agents ready to pair-program, debug, or evaluate you:
* **Sage (Teaching Agent)**: Uses the Socratic method to guide you towards answers without giving them away.
* **Aria (Code Reviewer)**: Scans code formatting, efficiency, and design patterns.
* **Rex (Debugger)**: Helps systematically diagnose runtime bugs and compilation errors.
* **Zara (The Examiner)**: Tests your hands-on coding skills in real-world scenarios.

### 💻 Code Playground & Monaco Editor
* **Browser-based Code Editor**: Embedded editor powered by Monaco Editor (the core engine behind VS Code) with syntax highlighting, autocomplete, and clean layouts.
* **Sandboxed Code Execution**: Execute code in Python, C++, JS, Java, C, and PHP securely via the **Judge0 API**.

### 📊 Dynamic Skill Track
* **Visual Competency Map**: A dynamic, animated knowledge tree tracking your mastery levels, confidence values (low, medium, high), error frequencies, and practice history.
* **History Log**: Keeps a running timeline of your skill changes for AI tracking.

### 📚 AI-Generated Learning Tracks
* **On-Demand Course Builder**: Search any cybersecurity or programming topic to instantly generate tailored multi-module tracks with chapters, quizzes, and exams.

### 🐉 Gamified Theme & Visual Polish
* **3D Dragon Cursor Tracking**: Interactive login panel featuring a Three.js / React Three Fiber dragon that follows your cursor.
* **High-End UI Elements**: Features interactive click sparks, split-flap display text transitions, dark-mode styling, and smooth framer-motion page animations.

---

## 🛠️ Tech Stack

| Component | Technologies & API Integrations |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, GSAP |
| **3D Renderers** | Three.js, React Three Fiber, Drei |
| **Backend** | Node.js, Express, Rate Limiters |
| **Database** | SQLite (via `better-sqlite3` & `sqlite3`) |
| **AI LLM APIs** | Groq API, Anthropic API, Google Gemini (Failover), OpenRouter (DeepSeek R1 Failover) |
| **Code Sandbox** | Monaco Editor, Judge0 API Integration |
| **Document Parsers** | Multer, PDF-Parse, Mammoth (.docx extraction) |

---

## 🏗️ Architecture

```
                 +-----------------------------------------+
                 |          Frontend (React + Vite)        |
                 |  - Monaco Editor   - Three.js Dragon    |
                 +--------------------+--------------------+
                                      |
                                      | HTTP Requests
                                      v
                 +--------------------+--------------------+
                 |          Backend Proxy (Express)        |
                 |  - SQLite User DB  - Resume Parser      |
                 +----------+------------------+-----------+
                            |                  |
              AI API Calls  |                  | Sandboxed Run
                            v                  v
                 +----------+--------+   +-----+-------------+
                 |  Groq / Gemini    |   |    Judge0 API     |
                 |  LLM Provider API |   |   Code Executor   |
                 +-------------------+   +-------------------+
```

---

## 🚀 Local Setup & Installation

Get Code Obsidian up and running on your local machine:

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** (v9 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/VRAJ-710/code_obsidian.git
cd code_obsidian
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# 1. Groq API Key (Primary AI Provider)
# Set VITE_GROQ_KEY to your Groq API key. To rotate keys, separate them with commas.
VITE_GROQ_KEY=your_groq_api_key_here

# 2. Gemini API Key (First Failover Provider)
VITE_GEMINI_KEY=your_gemini_api_key_here

# 3. OpenRouter API Key (Second Failover Provider - e.g., DeepSeek R1)
VITE_OPENROUTER_KEY=your_openrouter_api_key_here

# 4. Judge0/RapidAPI Key (For code execution)
VITE_JUDGE0_KEY=your_judge0_api_key_here
```

### 3. Install Dependencies
Install all package dependencies for the frontend and the local backend server:

**Frontend Dependencies:**
```bash
npm install
```

**Backend Dependencies:**
```bash
cd server
npm install
cd ..
```

### 4. Run the Development Servers
Start both the Vite frontend server and Express backend server concurrently from the root directory:
```bash
npm run dev
```

* **Frontend**: Open [http://localhost:5173](http://localhost:5173) in your browser.
* **Backend API**: Running at [http://localhost:3001](http://localhost:3001).

---

## 👥 Contributors

| Contributor | Focus |
| :--- | :--- |
| **Vraj Gajjar** | Full Stack & AI Integration |
| **Vedant Kapadia** | Frontend & 3D Animation |
| **Prey Patel** | Backend & AWS Cloud |
| **Het Patel** | UI/UX & Learning Design |

---

## 📄 License

This project is licensed under the MIT License.