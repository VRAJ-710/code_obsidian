// ── Code Obsidian Resume Extraction Service ─────────────────────────────────
import { callAI } from './aiService';

const RESUME_EXTRACTION_SYSTEM_PROMPT = `
You are an expert resume parsing engine. Analyze the provided resume raw text and extract structured profile data.
Output MUST be strictly raw JSON only (no markdown, no code fences, no extra commentary).

JSON Schema:
{
  "name": "string",
  "contact": { "email": "string", "phone": "string", "location": "string" },
  "summary": "string",
  "skills": [ { "name": "string", "category": "string" } ],
  "projects": [ { "title": "string", "description": "string", "tech": ["string"], "link": "string|null" } ],
  "experience": [ { "role": "string", "company": "string", "duration": "string", "bullets": ["string"] } ],
  "education": [ { "degree": "string", "institution": "string", "duration": "string" } ],
  "certifications": ["string"]
}

If a field is not present in the text, use empty string or empty array. DO NOT invent fake data.
`;

/**
 * Parses raw text from PDF/DOCX into a structured profile object.
 * Returns null if JSON parsing fails, triggering manual entry/review mode in the UI.
 *
 * @param {string} rawText
 * @returns {Promise<Object|null>}
 */
export async function extractResumeProfile(rawText) {
    if (!rawText || !rawText.trim()) return null;

    try {
        const userPrompt = `Here is the raw text extracted from a resume:\n\n${rawText.slice(0, 12000)}\n\nExtract the structured profile JSON.`;
        const responseText = await callAI(RESUME_EXTRACTION_SYSTEM_PROMPT, [{ role: 'user', content: userPrompt }]);

        if (responseText) {
            let cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleaned = jsonMatch[0];
            }
            const profile = JSON.parse(cleaned);
            const hasRealContent = profile && (
                profile.name || profile.summary ||
                (profile.skills && profile.skills.length > 0) ||
                (profile.projects && profile.projects.length > 0) ||
                (profile.experience && profile.experience.length > 0) ||
                (profile.education && profile.education.length > 0)
            );
            if (hasRealContent) {
                return profile;
            }
        }
    } catch (err) {
        console.warn('[Resume AI Parsing Warning]:', err.message);
    }

    // Fallback parser if LLM output fails or rate limits
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
    const extractedSkills = [];
    const skillKeywords = ['JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'C++', 'Java', 'Docker', 'Git', 'HTML', 'CSS', 'AWS', 'Linux', 'REST API', 'Cybersecurity', 'Web Hacking'];

    skillKeywords.forEach(kw => {
        if (rawText.toLowerCase().includes(kw.toLowerCase())) {
            extractedSkills.push({ name: kw, category: 'Technical' });
        }
    });

    return {
        name: lines[0] || 'Resume Candidate',
        contact: { email: '', phone: '', location: '' },
        summary: rawText.slice(0, 350) + '...',
        skills: extractedSkills.length > 0 ? extractedSkills : [{ name: 'Software Engineering', category: 'General' }],
        projects: [],
        experience: [],
        education: [],
        certifications: []
    };
}

/**
 * Generates career insights, optionally contextualized to a target company/role.
 * When targetCompany or targetRole is provided, guidance is tailored to that target
 * with an honesty disclaimer (no fake company-specific claims).
 *
 * @param {Object} profile - The candidate's resume profile object
 * @param {string} gapSummary - Formatted string of skill gaps from analyzeGaps()
 * @param {string} [targetCompany] - Optional target company name
 * @param {string} [targetRole] - Optional target role
 * @returns {Promise<Object|null>}
 */
export async function generateResumeInsights(profile, gapSummary, targetCompany, targetRole) {
    const targetLine = (targetCompany || targetRole)
        ? `The candidate is targeting: ${targetRole || 'a role'}${targetCompany ? ` at ${targetCompany}` : ''}.`
        : '';

    const hasTarget = !!(targetCompany || targetRole);

    const systemPrompt = `You are a senior technical career mentor.
${targetLine}
Output MUST be strict raw JSON only (no markdown, no commentary).

${hasTarget ? `IMPORTANT HONESTY CONSTRAINT: If a specific company is named, you do NOT have verified or insider knowledge
of that company's actual current hiring bar, interview process, or requirements. Do not state company-specific
"facts" as if confirmed. Instead give general, realistic guidance appropriate for a company of that type/tier
and this role/level, and say so explicitly in the "disclaimer" field.` : ''}

JSON Schema:
{
  ${hasTarget ? '"disclaimer": "string — one sentence noting this is general guidance, not verified company-specific intel",' : ''}
  "nextSkills": [ { "skill": "string", "why": "string${hasTarget ? ', tied to the target role/company type and the candidate\'s real gaps' : ''}" } ],
  "projectIdeas": [ { "title": "string", "description": "string", "skillsUsed": ["string"]${hasTarget ? ', "whyRelevant": "string — how this maps to the target"' : ''} } ],
  ${hasTarget ? '"positioningNotes": "string — how to frame existing resume experience for this specific target",' : ''}
  "resumeGaps": ["string"]
}

Base "nextSkills" strictly on the provided real skill gap data — do not repeat skills the candidate is already strong in.
Base "projectIdeas" on a logical next step from the candidate's actual listed projects/experience, not generic tutorials.
DO NOT invent fake company facts, fake statistics, or fake interview processes.`;

    try {
        const userPrompt = `Resume profile:\n${JSON.stringify(profile)}\n\nCurrent skill gaps (weakest first):\n${gapSummary}\n\nGenerate insights JSON.`;
        const responseText = await callAI(systemPrompt, [{ role: 'user', content: userPrompt }]);
        if (!responseText) return null;

        let cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) cleaned = match[0];
        return JSON.parse(cleaned);
    } catch (err) {
        console.warn('[Resume Insights Warning]:', err.message);
        return null;
    }
}
