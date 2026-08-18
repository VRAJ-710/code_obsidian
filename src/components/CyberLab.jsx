import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { 
  Shield, Terminal, Play, RefreshCw, CheckCircle, Flame, 
  AlertTriangle, Bug, Code, Lock, ShieldCheck, Cpu, ArrowRight, Info,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { BASE_URL } from '../dbService';

const SCENARIOS = [
  {
    id: 'sqli',
    title: 'SQL Injection',
    subtitle: 'Authentication Bypass',
    owasp: 'A03:2021-Injection',
    targetApp: 'SecureBank Admin Portal',
    defaultPayload: `' OR '1'='1' --`,
    presetPayloads: [
      { label: "Admin Bypass", payload: `' OR '1'='1' --` },
      { label: "Union Data Leak", payload: `' UNION SELECT id, username, password, role, balance FROM users --` },
      { label: "Stacking Comment", payload: `admin' #` }
    ],
    vulnerableSnippet: `// VULNERABLE ROUTE (SQL Injection)
app.post('/cyberlab/sqli/vulnerable', (req, res) => {
  const { username, password } = req.body;
  
  // Line 6: Direct string concatenation allows input to mutate SQL logic!
  const query = \`SELECT * FROM users WHERE username = '\${username}' AND password = '\${password}'\`;
  
  const results = db.prepare(query).all();
  res.json({ query, results, rowCount: results.length });
});`,
    fixedSnippet: `// FIXED ROUTE (Parameterized Queries)
app.post('/cyberlab/sqli/fixed', (req, res) => {
  const { username, password } = req.body;
  
  // Line 6: Parameterized prepared statement treats input strictly as literal values
  const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
  const results = stmt.all(username || '', password || '');
  
  res.json({ query: stmt.source, params: [username, password], results, rowCount: results.length });
});`
  },
  {
    id: 'xss',
    title: 'Stored XSS',
    subtitle: 'Script Injection in Guestbook',
    owasp: 'A03:2021-Injection (Cross-Site Scripting)',
    targetApp: 'DevPortal Community Guestbook',
    defaultPayload: `<script>document.body.style.background='red'; alert('PWNED!');</script>`,
    presetPayloads: [
      { label: "Inline Script", payload: `<script>alert('XSS Executed!')</script>` },
      { label: "Image OnError", payload: `<img src="invalid" onerror="alert('Image XSS Triggered!')" />` },
      { label: "DOM Defacement", payload: `<h1 style="color:cyan;font-size:24px">HACKED BY XSS</h1>` }
    ],
    vulnerableSnippet: `// VULNERABLE ROUTE (Stored XSS)
app.post('/cyberlab/xss/vulnerable', (req, res) => {
  const { author, comment } = req.body;
  
  // Line 6: Input saved and rendered raw to HTML response without sanitization!
  db.prepare('INSERT INTO comments (author, content) VALUES (?, ?)').run(author, comment);
  const comments = db.prepare('SELECT * FROM comments ORDER BY id DESC').all();
  
  const html = renderCommentsPage(comments, /* escape */ false);
  res.json({ html, commentCount: comments.length });
});`,
    fixedSnippet: `// FIXED ROUTE (HTML Entity Escaping)
app.post('/cyberlab/xss/fixed', (req, res) => {
  const { author, comment } = req.body;
  
  // Line 6: HTML escaping converts '<' to '&lt;' so scripts render safely as plain text
  const comments = db.prepare('SELECT * FROM comments ORDER BY id DESC').all();
  const allComments = [{ author, content: comment }, ...comments];
  
  const html = renderCommentsPage(allComments, /* escape */ true);
  res.json({ html, commentCount: allComments.length });
});`
  }
];

export default function CyberLab({ currentUser, onSkillUpdate, skills }) {
  const [activeScenario, setActiveScenario] = useState(SCENARIOS[0]);
  const [payload, setPayload] = useState(SCENARIOS[0].defaultPayload);
  const [xssAuthor, setXssAuthor] = useState('Attacker');
  const [sqliUsername, setSqliUsername] = useState(`admin' OR '1'='1' --`);
  const [sqliPassword, setSqliPassword] = useState('anything');

  // Execution States
  const [isExecuting, setIsExecuting] = useState(false);
  const [attackResult, setAttackResult] = useState(null);
  const [xssIframeHtml, setXssIframeHtml] = useState('');
  
  // AI Explanation State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState(null);

  // Fix Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [fixResult, setFixResult] = useState(null);
  const [showDiffDrawer, setShowDiffDrawer] = useState(false);

  // Completion Track
  const [completedScenarios, setCompletedScenarios] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('code_obsidian_cyberlab_completed') || '{}');
    } catch {
      return {};
    }
  });

  // Switch scenario resets state
  const handleSelectScenario = (scenario) => {
    setActiveScenario(scenario);
    setPayload(scenario.defaultPayload);
    if (scenario.id === 'sqli') {
      setSqliUsername(scenario.defaultPayload);
      setSqliPassword('anything');
    } else {
      setPayload(scenario.defaultPayload);
    }
    setAttackResult(null);
    setXssIframeHtml('');
    setAiAnalysis(null);
    setAiError(null);
    setFixResult(null);
  };

  // ── Step 1 & 2: Run Attack against Vulnerable Endpoint ────────────────────
  const handleRunAttack = async () => {
    setIsExecuting(true);
    setAttackResult(null);
    setAiAnalysis(null);
    setAiError(null);
    setFixResult(null);

    const headers = {
      'Content-Type': 'application/json',
      'x-cyberlab-user': currentUser || 'anonymous'
    };

    let bodyData = {};
    let endpoint = '';

    if (activeScenario.id === 'sqli') {
      endpoint = `${BASE_URL}/cyberlab/sqli/vulnerable`;
      bodyData = { username: sqliUsername, password: sqliPassword };
    } else {
      endpoint = `${BASE_URL}/cyberlab/xss/vulnerable`;
      bodyData = { author: xssAuthor, comment: payload };
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyData)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Server returned HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      setAttackResult(data);

      if (activeScenario.id === 'xss' && data.html) {
        setXssIframeHtml(data.html);
      }

      // Automatically trigger AI Explanation Layer ONLY if exploit succeeded
      if (data.exploited) {
        triggerAiExplanation(bodyData, data);
      } else {
        setAiAnalysis(null); // Clear stale AI analysis state on benign/failed attempts!
      }
    } catch (err) {
      console.error('Attack execution error:', err);
      setAttackResult({ error: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  // ── Step 3: AI Explanation Layer (Calls Groq via server proxy or client) ──
  const triggerAiExplanation = async (inputPayload, rawResponse) => {
    setIsAiLoading(true);
    setAiError(null);

    const systemPrompt = `You are a Senior Cybersecurity Engineer explaining vulnerability mechanics for Code Obsidian Cyber Lab.
Analyze the provided exploit attempt against a vulnerable code snippet and raw response.
Return ONLY valid JSON matching this exact structure:
{
  "vulnerableLine": 6,
  "owaspCategory": "${activeScenario.owasp}",
  "explanation": "Clear, concise, plain-language explanation of why this payload worked and what happened inside the DB/DOM.",
  "fixedCode": ${JSON.stringify(activeScenario.fixedSnippet)}
}`;

    const userMessage = `Scenario: ${activeScenario.title} (${activeScenario.targetApp})
User Payload / Input: ${JSON.stringify(inputPayload)}
Raw Endpoint Response: ${JSON.stringify(rawResponse)}
Vulnerable Source Code:
${activeScenario.vulnerableSnippet}`;

    try {
      const groqRes = await fetch(`${BASE_URL}/api/groq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'groq/compound',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }]
        })
      });

      if (!groqRes.ok) {
        throw new Error(`AI Service status ${groqRes.status}`);
      }

      const groqData = await groqRes.json();
      let textContent = groqData.choices?.[0]?.message?.content || '{}';

      const firstBrace = textContent.indexOf('{');
      const lastBrace = textContent.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        textContent = textContent.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(textContent);
      setAiAnalysis(parsed);
    } catch (err) {
      console.error('AI analysis error:', err);
      // Fallback deterministic AI response if API fails
      setAiAnalysis({
        vulnerableLine: 6,
        owaspCategory: activeScenario.owasp,
        explanation: activeScenario.id === 'sqli'
          ? "The payload injected raw SQL syntax into the query string. By adding `' OR '1'='1' --`, the boolean expression evaluated to true for all rows, and `--` commented out the remaining password clause."
          : "The application inserted user input directly into HTML without escaping string literals. Browser interpreted the `<script>` tag as executable JavaScript inside the DOM.",
        fixedCode: activeScenario.fixedSnippet
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  // ── Step 4: Verify the Fix against Secured Endpoint ─────────────────────
  const handleVerifyFix = async () => {
    setIsVerifying(true);
    setFixResult(null);

    const headers = {
      'Content-Type': 'application/json',
      'x-cyberlab-user': currentUser || 'anonymous'
    };

    let bodyData = {};
    let endpoint = '';

    if (activeScenario.id === 'sqli') {
      endpoint = `${BASE_URL}/cyberlab/sqli/fixed`;
      bodyData = { username: sqliUsername, password: sqliPassword };
    } else {
      endpoint = `${BASE_URL}/cyberlab/xss/fixed`;
      bodyData = { author: xssAuthor, comment: payload };
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();
      setFixResult(data);

      if (activeScenario.id === 'xss' && data.html) {
        setXssIframeHtml(data.html);
      }

      // Mark scenario as completed & update skill graph
      const updated = { ...completedScenarios, [activeScenario.id]: true };
      setCompletedScenarios(updated);
      localStorage.setItem('code_obsidian_cyberlab_completed', JSON.stringify(updated));

      if (onSkillUpdate) {
        onSkillUpdate('Web Hacking', 5);
      }
    } catch (err) {
      console.error('Verify fix error:', err);
      setFixResult({ error: err.message });
    } finally {
      setIsVerifying(false);
    }
  };

  // ── Step 5: Reset Sandbox Endpoint ───────────────────────────────────────
  const handleResetSandbox = async () => {
    try {
      await fetch(`${BASE_URL}/cyberlab/reset/${activeScenario.id}`, {
        method: 'POST',
        headers: { 'x-cyberlab-user': currentUser || 'anonymous' }
      });
      handleSelectScenario(activeScenario);
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0f] text-white flex flex-col font-body selection:bg-cyan-500/30 overflow-hidden">
      {/* ── Top Header / Scenario Selector ────────────────────────────────── */}
      <header className="flex-shrink-0 h-16 border-b border-white/10 bg-black/70 backdrop-blur-md flex items-center justify-between pl-6 pr-48 z-20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2 font-display">
              Cyber Lab <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono border border-cyan-500/30">Vulnerable Sandbox</span>
            </h1>
            <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Attack · Analyze · Fix · Verify</p>
          </div>
        </div>

        {/* Scenario Tabs & Actions */}
        <div className="flex items-center gap-3">
          <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
            {SCENARIOS.map(s => {
              const isDone = completedScenarios[s.id];
              const isActive = activeScenario.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectScenario(s)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    isActive 
                      ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_rgba(0,212,255,0.4)]' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isDone ? <CheckCircle className="w-3.5 h-3.5 text-green-950" /> : <Flame className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-cyan-400'}`} />}
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleResetSandbox}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-mono border border-purple-500/30 transition-colors"
            title="Wipe and reseed sandbox database"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
            <span>Reset DB</span>
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>Live Sandbox</span>
          </div>
        </div>
      </header>

      {/* ── Main Workspace ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT PANE: Monaco Payload Editor & Form Inputs ─────────────────── */}
        <div className="w-[380px] border-r border-white/10 bg-[#0c0d14] flex flex-col flex-shrink-0 z-20">
          <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold">1. Craft Exploit Payload</span>
            </div>
            <span className="text-[10px] font-mono text-white/40">Monaco Editor</span>
          </div>

          <div className="flex-1 p-4 flex flex-col space-y-4 overflow-y-auto custom-scrollbar">
            {/* Target Info */}
            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
              <div className="text-[11px] font-mono text-cyan-400 uppercase font-bold">{activeScenario.targetApp}</div>
              <div className="text-xs text-white/60 mt-1">{activeScenario.subtitle}</div>
              <div className="text-[10px] text-orange-400/80 font-mono mt-2 flex items-center gap-1">
                <Bug className="w-3 h-3" /> OWASP: {activeScenario.owasp}
              </div>
            </div>

            {/* Form controls based on scenario */}
            {activeScenario.id === 'sqli' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">Username Payload (Vulnerable parameter)</label>
                  <input
                    type="text"
                    value={sqliUsername}
                    onChange={(e) => {
                      setSqliUsername(e.target.value);
                      setPayload(e.target.value);
                    }}
                    className="w-full bg-black/60 border border-cyan-500/30 rounded-lg p-2.5 text-xs font-mono text-cyan-300 focus:border-cyan-400 outline-none"
                    placeholder="Enter SQL payload..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">Password</label>
                  <input
                    type="text"
                    value={sqliPassword}
                    onChange={(e) => setSqliPassword(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs font-mono text-white/70 focus:border-cyan-400 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">Author Name</label>
                  <input
                    type="text"
                    value={xssAuthor}
                    onChange={(e) => setXssAuthor(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs font-mono text-white/70 focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">Comment Payload (Monaco Editor)</label>
                  <div className="h-36 border border-cyan-500/30 rounded-lg overflow-hidden bg-black/60">
                    <Editor
                      height="100%"
                      language="html"
                      theme="vs-dark"
                      value={payload}
                      onChange={(val) => setPayload(val || '')}
                      options={{
                        fontSize: 12,
                        minimap: { enabled: false },
                        lineNumbers: 'off',
                        wordWrap: 'on',
                        padding: { top: 8, bottom: 8 }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Presets */}
            <div>
              <div className="text-[10px] font-mono text-white/40 uppercase mb-1.5">Preset Payloads</div>
              <div className="flex flex-wrap gap-1.5">
                {activeScenario.presetPayloads.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPayload(preset.payload);
                      if (activeScenario.id === 'sqli') setSqliUsername(preset.payload);
                    }}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-cyan-500/20 text-white/70 hover:text-cyan-300 border border-white/10 text-[10px] font-mono transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Attack Button */}
            <button
              onClick={handleRunAttack}
              disabled={isExecuting}
              className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all ${
                isExecuting 
                  ? 'bg-white/10 text-white/40 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isExecuting ? 'Executing Attack...' : '2. Run Attack on Vulnerable Endpoint'}</span>
            </button>

            {/* Verify Fix Button (Prominently displayed after attack run) */}
            {attackResult && (
              <button
                onClick={handleVerifyFix}
                disabled={isVerifying}
                className={`w-full py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all border ${
                  isVerifying
                    ? 'bg-white/10 text-white/40 border-white/10 cursor-not-allowed'
                    : 'bg-green-500/20 text-green-300 border-green-500/40 hover:bg-green-500/30 hover:border-green-400 active:scale-95 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                }`}
              >
                {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-green-400" />}
                <span>{isVerifying ? 'Verifying Patch...' : '4. Verify Fix against Secured Route'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ── CENTER & RIGHT SPLIT: Live Target Preview + AI Explanation ────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex border-b border-white/10 overflow-hidden">

            {/* Live Preview Pane */}
            <div className="flex-1 flex flex-col bg-[#050508] border-r border-white/10">
              <div className="p-3 border-b border-white/10 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold">Target App Live Preview</span>
                </div>
                {attackResult?.exploited && (
                  <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-mono font-bold flex items-center gap-1 animate-pulse">
                    <Flame className="w-3 h-3" /> EXPLOITED!
                  </span>
                )}
              </div>

              <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-center items-center">
                {activeScenario.id === 'sqli' ? (
                  <div className="w-full max-w-md glass-card p-6 rounded-2xl border border-white/10 bg-black/50 space-y-4">
                    <div className="text-center border-b border-white/10 pb-3">
                      <h3 className="font-display font-bold text-lg text-cyan-400">SecureBank Portal</h3>
                      <p className="text-xs text-white/50 font-mono">Authentication Endpoint</p>
                    </div>

                    <div className="bg-black/90 p-3 rounded-xl border border-orange-500/30 font-mono text-[11px]">
                      <div className="text-white/40 mb-1 flex items-center justify-between">
                        <span>// Executed Query in SQLite Sandbox:</span>
                        <span className="text-[9px] text-cyan-400">Live Interpolation</span>
                      </div>
                      <div className="text-orange-400 break-all font-bold">
                        {attackResult?.query || `SELECT * FROM users WHERE username = '${sqliUsername}' AND password = '${sqliPassword}'`}
                      </div>
                    </div>

                    {/* Leaked Data Results Payoff Panel */}
                    {attackResult && (
                      <div className="space-y-2">
                        {attackResult.exploited ? (
                          <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/40 text-red-400 text-xs font-mono font-bold flex items-center justify-between animate-pulse">
                            <span className="flex items-center gap-1.5"><Flame className="w-4 h-4" /> 🚨 DATA LEAK DETECTED!</span>
                            <span className="text-[10px] bg-red-500/20 px-2 py-0.5 rounded">{attackResult.rowCount} ROWS EXPOSED</span>
                          </div>
                        ) : fixResult?.blocked ? (
                          <div className="p-2.5 rounded-xl bg-green-500/10 border border-green-500/40 text-green-400 text-xs font-mono font-bold flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> 🛡️ EXPLOIT BLOCKED BY PATCH</span>
                            <span className="text-[10px] bg-green-500/20 px-2 py-0.5 rounded">0 ROWS EXPOSED</span>
                          </div>
                        ) : null}

                        <div className="text-xs font-mono text-white/70 flex items-center justify-between">
                          <span>Database Output ({attackResult.rowCount} rows returned):</span>
                        </div>

                        {attackResult.rowCount > 0 ? (
                          <div className="max-h-48 overflow-y-auto bg-black/80 border border-white/10 rounded-xl p-2.5 text-[10px] font-mono space-y-1.5 custom-scrollbar">
                            {attackResult.results.map((u, i) => (
                              <div key={i} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between gap-2 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">{u.role}</span>
                                  <span className="text-white font-bold">{u.username}</span>
                                </div>
                                <div className="flex items-center gap-3 text-white/60">
                                  <span>Pass: <code className="text-orange-300">{u.password}</code></span>
                                  <span className="text-green-400 font-bold">${u.balance}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-mono text-center">
                            Authentication Failed: Invalid Credentials (0 rows returned)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col rounded-xl overflow-hidden border border-white/10 bg-black">
                    <div className="p-2 bg-white/5 border-b border-white/10 text-[11px] font-mono text-white/50 flex items-center justify-between">
                      <span>Sandboxed Iframe Preview (<code className="text-cyan-400">sandbox="allow-scripts"</code>)</span>
                      <span className="text-[10px] text-green-400">Contains script execution safety</span>
                    </div>
                    <div className="flex-1 bg-[#0a0a0f]">
                      {xssIframeHtml ? (
                        <iframe
                          title="XSS Sandbox Preview"
                          sandbox="allow-scripts"
                          srcDoc={xssIframeHtml}
                          className="w-full h-full border-0"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-white/30 font-mono text-xs">
                          Click "Run Attack" to render comments in isolated iframe...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Explanation Pane */}
            <div className="w-[420px] bg-[#08080d] flex flex-col z-20 flex-shrink-0">
              <div className="p-3 border-b border-white/10 bg-black/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4 text-orange-400" />
                  <span className="text-xs font-mono uppercase tracking-wider text-orange-300 font-bold">3. AI Vulnerability Breakdown</span>
                </div>
                {isAiLoading && <RefreshCw className="w-3.5 h-3.5 text-orange-400 animate-spin" />}
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-4 font-mono text-xs">
                {isAiLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-orange-400/60 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span className="text-xs">Analyzing attack mechanics...</span>
                  </div>
                ) : aiAnalysis ? (
                  <>
                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300">
                      <div className="text-[10px] text-orange-400 uppercase font-bold mb-1">OWASP Classification</div>
                      <div className="font-bold text-xs">{aiAnalysis.owaspCategory}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="text-[10px] text-cyan-400 uppercase font-bold">Vulnerability Mechanism</div>
                      <p className="text-white/80 leading-relaxed font-sans text-xs">{aiAnalysis.explanation}</p>
                      <div className="text-[10px] text-red-400 mt-2">
                        ⚠️ Vulnerable Statement: Line {aiAnalysis.vulnerableLine} in backend controller
                      </div>
                    </div>

                    {/* Verify Fix Action */}
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-3">
                      <div className="flex items-center gap-2 text-green-400 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4" />
                        <span>4. Verify Patch against Secured Route</span>
                      </div>
                      <p className="text-[11px] text-green-300/80 font-sans">
                        Re-run the exact same payload against the fixed route variant to confirm parameterization / escaping blocks the exploit.
                      </p>
                      <button
                        onClick={handleVerifyFix}
                        disabled={isVerifying}
                        className="w-full py-2.5 rounded-lg bg-green-500 text-black font-bold text-xs hover:bg-green-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                      >
                        {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        <span>Verify Fix Implementation</span>
                      </button>
                    </div>

                    {fixResult && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs">
                        <div className="font-bold text-blue-400 flex items-center gap-1.5 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-400" /> Fix Verification Result:
                        </div>
                        <p className="text-[11px] font-sans leading-relaxed">{fixResult.message || 'Payload successfully neutralized by fixed endpoint.'}</p>
                      </motion.div>
                    )}
                  </>
                ) : attackResult && !attackResult.exploited ? (
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3 font-sans text-xs">
                    <div className="flex items-center gap-2 text-yellow-400 font-mono font-bold text-xs">
                      <Info className="w-4 h-4" />
                      <span>Benign Input / Clean Execution</span>
                    </div>
                    <p className="text-white/70 leading-relaxed text-[11px]">
                      The submitted input did not trigger a vulnerability or bypass authentication. The query executed safely as standard text.
                    </p>
                    <div className="p-2.5 rounded-lg bg-black/50 border border-white/10 text-[10px] font-mono text-cyan-300">
                      💡 Tip: Try entering a payload like <code className="text-orange-400 font-bold">' OR '1'='1' --</code> to break string literal boundaries and trigger an exploit breakdown.
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-white/30 text-center font-sans text-xs">
                    Run an attack to generate an AI breakdown of the vulnerability and compare code fixes.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── BOTTOM DRAWER: Monaco Diff Editor (Collapsible Drawer) ────────── */}
          <motion.div 
            animate={{ height: showDiffDrawer ? 280 : 38 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="bg-[#090a10] border-t border-white/10 flex flex-col z-30 shadow-2xl overflow-hidden"
          >
            {/* Clickable Header Bar */}
            <div 
              onClick={() => setShowDiffDrawer(!showDiffDrawer)}
              className="h-[38px] px-4 bg-black/80 border-b border-white/10 flex items-center justify-between text-xs font-mono cursor-pointer hover:bg-white/5 transition-colors select-none flex-shrink-0"
            >
              <div className="flex items-center gap-2 font-bold">
                <Code className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-300">Monaco Code Comparison</span>
                <span className="text-[10px] text-white/40 font-normal hidden sm:inline">(Vulnerable vs Fixed Controller)</span>
                {attackResult && (
                  <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    Patch Diff Ready
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-3 text-[10px] mr-2">
                  <span className="text-red-400">Original (Vulnerable)</span>
                  <ArrowRight className="w-3 h-3 text-white/40" />
                  <span className="text-green-400">Modified (Fixed)</span>
                </div>
                <button className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white/70 text-[11px] font-mono transition-colors">
                  <span>{showDiffDrawer ? 'Hide Diff' : 'View Code Diff'}</span>
                  {showDiffDrawer ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              </div>
            </div>

            {/* Expanded Monaco Diff Editor */}
            {showDiffDrawer && (
              <div className="flex-1 bg-[#090a10]">
                <DiffEditor
                  height="100%"
                  language="javascript"
                  theme="vs-dark"
                  original={activeScenario.vulnerableSnippet}
                  modified={aiAnalysis?.fixedCode || activeScenario.fixedSnippet}
                  options={{
                    fontSize: 12,
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    renderSideBySide: true,
                    padding: { top: 8, bottom: 8 }
                  }}
                />
              </div>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
}
