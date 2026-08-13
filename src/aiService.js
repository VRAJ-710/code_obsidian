// ── Code Obsidian AI Service (Multi-Provider & Multi-Key Resilient Architecture) ──
// Supported Providers: Groq (Llama 3.3), Google Gemini (1.5 Flash), OpenRouter (DeepSeek R1), Ollama, and Smart Engine.
import axios from 'axios';
import { BASE_URL } from './dbService';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── Layer 1: In-Memory Response Cache (0ms latency, 0 API cost) ────────────────
const aiCache = new Map(); // key -> { text, timestamp }
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache TTL

function getCacheKey(systemPrompt, messages) {
    const lastMsg = messages[messages.length - 1]?.content || '';
    return `${systemPrompt.slice(0, 40)}::${lastMsg}`;
}

// ── Layer 2: Provider Keys Configuration ───────────────────────────────────────
function getGroqKeys() {
    const rawKeys = import.meta.env.VITE_GROQ_KEYS || import.meta.env.VITE_GROQ_KEY || '';
    return rawKeys.split(',').map(k => k.trim()).filter(k => k && !k.includes('dummy'));
}

function getGeminiKey() {
    return (import.meta.env.VITE_GEMINI_KEY || '').trim();
}

function getOpenRouterKey() {
    return (import.meta.env.VITE_OPENROUTER_KEY || '').trim();
}

let activeGroqKeyIndex = 0;

// ── Provider API Adapters ───────────────────────────────────────────────────────

// Provider 1: Groq (Llama 3.3 70B)
async function callGroqAPI(systemPrompt, messages, apiKey) {
    const response = await axios.post(
        GROQ_URL,
        {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: systemPrompt }, ...messages],
            temperature: 0.7,
            max_tokens: 1500,
            top_p: 0.95,
        },
        {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            timeout: 15000,
        }
    );
    return response.data?.choices?.[0]?.message?.content;
}

// Provider 2: Google Gemini (1.5 Flash)
async function callGeminiAPI(systemPrompt, messages, geminiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
    const contents = [
        { role: 'user', parts: [{ text: `System Instruction:\n${systemPrompt}` }] },
        ...messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }))
    ];
    const res = await axios.post(url, { contents }, { timeout: 15000 });
    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
}

// Provider 3: OpenRouter (DeepSeek R1 / Free Models)
async function callOpenRouterAPI(systemPrompt, messages, openRouterKey) {
    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const res = await axios.post(url, {
        model: 'deepseek/deepseek-r1-distill-llama-70b:free',
        messages: [{ role: 'system', content: systemPrompt }, ...messages]
    }, {
        headers: { 'Authorization': `Bearer ${openRouterKey}`, 'Content-Type': 'application/json' },
        timeout: 15000
    });
    return res.data?.choices?.[0]?.message?.content;
}

// ── Smart Diagnostic Offline Engine ──────────────────────────────────────────
function generateDynamicCodeAnalysis(systemPrompt, userMsg) {
    const isStrict = systemPrompt.includes('STRICT');
    const isReview = systemPrompt.includes('REVIEW');

    const codeMatch = userMsg.match(/```(?:\w+)?\n([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1] : '';
    const lines = code ? code.trim().split('\n') : [];
    
    const errorMatch = userMsg.match(/Error:\n([\s\S]*?)(?:\n\n|\n$)/);
    const errorText = errorMatch ? errorMatch[1].trim() : '';

    const langMatch = userMsg.match(/coding in ([A-Za-z+#]+)/);
    const lang = langMatch ? langMatch[1] : 'code';

    if (errorText) {
        let specificHint = "";
        
        const nameErrMatch = errorText.match(/NameError:\s*name\s*['"](\w+)['"]\s*is not defined(?:\.\s*Did you mean:\s*['"](\w+)['"])?/i);
        if (nameErrMatch) {
            const missingVar = nameErrMatch[1];
            const suggestion = nameErrMatch[2];
            if (missingVar === 'printf' && lang.toLowerCase().includes('python')) {
                specificHint = `You called \`printf()\`, which is a C/C++ function. In Python, use \`print()\` instead!`;
            } else if (suggestion) {
                specificHint = `Identifier \`${missingVar}\` is not defined. Did you mean \`${suggestion}\`?`;
            } else {
                specificHint = `Variable or function \`${missingVar}\` was used before it was defined or imported.`;
            }
        }
        else if (errorText.includes('IndentationError')) {
            specificHint = `Indentation error! Make sure code inside functions, loops, and \`if\` statements is consistently indented with 4 spaces.`;
        }
        else if (errorText.includes('SyntaxError')) {
            specificHint = `Syntax Error detected. Check for missing quotes \`"\`, parentheses \`()\`, or colons \`:\` at the end of statements.`;
        }
        else if (errorText.includes('TypeError')) {
            specificHint = `Type Error! You are performing an operation on incompatible data types.`;
        }
        else if (errorText.includes('IndexError') || errorText.includes('out of range') || errorText.includes('segmentation fault')) {
            specificHint = `Index Out of Bounds! Your loop or array access tried to read an element beyond the list/vector size.`;
        }
        else if (errorText.includes('was not declared in this scope') || errorText.includes('expected \';\'')) {
            specificHint = `C/C++ Syntax Error! Check that all variables are declared with a type (e.g. \`int\`, \`string\`) and lines end with a semicolon \`;\`.`;
        }
        else {
            const cleanErrLine = errorText.split('\n').filter(l => l.trim() && !l.includes('Traceback') && !l.includes('File ')).slice(-1)[0] || errorText;
            specificHint = `Diagnostic: \`${cleanErrLine}\`. Check variable declarations and line syntax.`;
        }

        const summaryErr = errorText.split('\n').filter(l => l.trim()).slice(-2).join(' ');

        if (isStrict) {
            return `🔍 **Rex (Strict Debugger)**:\nI detected an issue in your ${lang} code:\n\`\`\`\n${errorText}\n\`\`\`\n${specificHint}\nWhat change do you need to make on line 1 to resolve this?`;
        } else if (isReview) {
            return `🛠️ **Rex (Review Debugger)**:\nHere is the breakdown of your ${lang} error:\n\n**Error Log**:\n\`\`\`\n${errorText}\n\`\`\`\n\n**Diagnosis**:\n${specificHint}\n\n**Recommended Fix**:\nUpdate line 1 to use correct ${lang} syntax.`;
        } else {
            return `🐛 **Rex (Guided Debugger)**:\nYour ${lang} code produced an error:\n> \`${summaryErr}\` \n\n**Diagnosis**: ${specificHint}`;
        }
    } else {
        const funcMatches = code.match(/(?:def|function|class|void|int|double|String)\s+([A-Za-z0-9_]+)/g) || [];
        const funcNames = funcMatches.map(f => f.split(/\s+/)[1]).filter(Boolean);

        if (isStrict) {
            return `🧠 **Sage (Strict Teacher)**:\nI evaluated your ${lines.length}-line ${lang} script${funcNames.length ? ` (found function \`${funcNames[0]}\`)` : ''}.\n\nWhat is the expected output when your program handles empty inputs?`;
        } else if (isReview) {
            return `📖 **Sage (Review Mode)**:\n**Code Review for ${lang} script (${lines.length} lines)**:\n\n✅ **Structure**: Good usage of ${funcNames.length > 0 ? `functions (\`${funcNames.join('`, `')}\`)` : 'procedural logic'}.\n🟡 **Optimization**: Check time & space complexity.\n🔵 **Best Practice**: Add explicit parameter validation.`;
        } else {
            return `💡 **Sage (Guided Teacher)**:\nNice job writing this ${lang} snippet (${lines.length} lines${funcNames.length ? `, function: \`${funcNames[0]}\`` : ''})!\n\n**Suggestion**: Handle edge cases (like empty/null inputs) and use descriptive variable names.`;
        }
    }
}

// ── Main Orchestrator ─────────────────────────────────────────────────────────
export async function callAI(systemPrompt, messages) {
    const cacheKey = getCacheKey(systemPrompt, messages);

    // 0. Check In-Memory Cache (0ms Response)
    if (aiCache.has(cacheKey)) {
        const cached = aiCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
            console.log('[aiService] Served response from 0ms cache');
            return cached.text;
        }
    }

    // 1. Provider Tier 1: Groq API Key Pool (with Key Rotation)
    const groqKeys = getGroqKeys();
    if (groqKeys.length > 0) {
        for (let i = 0; i < groqKeys.length; i++) {
            const keyIndex = (activeGroqKeyIndex + i) % groqKeys.length;
            try {
                const text = await callGroqAPI(systemPrompt, messages, groqKeys[keyIndex]);
                if (text) {
                    activeGroqKeyIndex = keyIndex;
                    aiCache.set(cacheKey, { text, timestamp: Date.now() });
                    return text;
                }
            } catch (err) {
                console.warn(`[aiService] Groq Key #${keyIndex} failed (${err.message}). Rotating to next key...`);
            }
        }
    }

    // 2. Provider Tier 2: Google Gemini API (1.5 Flash)
    const geminiKey = getGeminiKey();
    if (geminiKey) {
        try {
            const text = await callGeminiAPI(systemPrompt, messages, geminiKey);
            if (text) {
                console.log('[aiService] Served via Google Gemini API');
                aiCache.set(cacheKey, { text, timestamp: Date.now() });
                return text;
            }
        } catch (err) {
            console.warn('[aiService] Gemini API failed:', err.message);
        }
    }

    // 3. Provider Tier 3: OpenRouter API (DeepSeek R1 / Free Tier Models)
    const openRouterKey = getOpenRouterKey();
    if (openRouterKey) {
        try {
            const text = await callOpenRouterAPI(systemPrompt, messages, openRouterKey);
            if (text) {
                console.log('[aiService] Served via OpenRouter (DeepSeek R1)');
                aiCache.set(cacheKey, { text, timestamp: Date.now() });
                return text;
            }
        } catch (err) {
            console.warn('[aiService] OpenRouter API failed:', err.message);
        }
    }

    // 4. Provider Tier 4: Server Backend Proxy (/api/groq)
    try {
        const serverRes = await axios.post(`${BASE_URL}/api/groq`, { system: systemPrompt, messages, model: 'llama-3.3-70b-versatile' }, { timeout: 10000 });
        const text = serverRes.data?.choices?.[0]?.message?.content;
        if (text) {
            aiCache.set(cacheKey, { text, timestamp: Date.now() });
            return text;
        }
    } catch {
        // Proxy offline, continue
    }

    // 5. Provider Tier 5: Local Ollama Endpoint
    try {
        const ollamaRes = await axios.post('http://localhost:11434/api/chat', { model: 'llama3', messages: [{ role: 'system', content: systemPrompt }, ...messages], stream: false }, { timeout: 4000 });
        const text = ollamaRes.data?.message?.content;
        if (text) {
            aiCache.set(cacheKey, { text, timestamp: Date.now() });
            return text;
        }
    } catch {
        // Ollama offline
    }

    // 6. Provider Tier 6: Dynamic Smart Diagnostic Engine
    const userMsg = messages[messages.length - 1]?.content || '';
    const fallbackText = generateDynamicCodeAnalysis(systemPrompt, userMsg);
    aiCache.set(cacheKey, { text: fallbackText, timestamp: Date.now() });
    return fallbackText;
}
