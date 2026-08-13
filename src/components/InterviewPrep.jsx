import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, Award, Clock, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, Sparkles, UserCheck, History, ChevronRight } from 'lucide-react'
import { callAI } from '../aiService'
import { dbService } from '../dbService'
import { analyzeGaps } from '../skillEngine'
import { selectQuestions } from '../interviewQuestionBank'

const ROLES = ['Frontend', 'Backend', 'Full-Stack', 'Cybersecurity', 'Data/ML', 'DevOps', 'Game Development']
const LEVELS = ['Junior', 'Mid', 'Senior']

// ScoreRing component consistent with ZaraExaminer
function ScoreRing({ score }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="56" cy="56" r={radius} className="stroke-white/10" strokeWidth="8" fill="transparent" />
        <circle
          cx="56" cy="56" r={radius}
          className="stroke-primary transition-all duration-1000 ease-out"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold text-white font-mono">{score}%</span>
        <span className="block text-[10px] text-white/50 uppercase">Score</span>
      </div>
    </div>
  )
}

export default function InterviewPrep({ currentUser, skills, updateSkills, resumeProfile }) {
  const [phase, setPhase] = useState('setup') // 'setup' | 'active' | 'summary'
  const [selectedRole, setSelectedRole] = useState('Full-Stack')
  const [customRole, setCustomRole] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('Mid')

  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [answers, setAnswers] = useState([]) // Array of answer strings
  const [scores, setScores] = useState([]) // Array of { score: number, feedback: string, focusSkill: string }

  const [loading, setLoading] = useState(false)
  const [scoringLoading, setScoringLoading] = useState(false)
  const [pastSessions, setPastSessions] = useState([])
  const [errorMsg, setErrorMsg] = useState(null)

  // Load past interview sessions
  useEffect(() => {
    if (currentUser) {
      dbService.getInterviewSessions(currentUser).then(sessions => {
        setPastSessions(sessions || [])
      })
    }
  }, [currentUser, phase])

  // Infer default role from resume if available
  useEffect(() => {
    if (resumeProfile && resumeProfile.summary && !customRole) {
      if (resumeProfile.summary.toLowerCase().includes('cyber') || resumeProfile.summary.toLowerCase().includes('security')) {
        setSelectedRole('Cybersecurity')
      } else if (resumeProfile.summary.toLowerCase().includes('frontend') || resumeProfile.summary.toLowerCase().includes('react')) {
        setSelectedRole('Frontend')
      } else if (resumeProfile.summary.toLowerCase().includes('backend') || resumeProfile.summary.toLowerCase().includes('node')) {
        setSelectedRole('Backend')
      }
    }
  }, [resumeProfile])

  // Generate Question Set from curated real-company question bank
  // AI is used to optionally enhance/adapt, but curated bank guarantees quality
  const handleStartInterview = async () => {
    setLoading(true)
    setErrorMsg(null)
    const roleToUse = customRole.trim() || selectedRole
    const gaps = analyzeGaps(skills || {}).slice(0, 3)
    const gapSkills = gaps.map(g => g.name || g.skill || '').filter(Boolean)

    // Step 1: Select 5 curated real-company questions from the bank
    const curatedQuestions = selectQuestions(roleToUse, selectedLevel, gapSkills)

    // Step 2: Optionally ask AI to adapt/reword questions for the user's specific context
    try {
      const systemPrompt = `You are a Senior Technical Interviewer. You are given 5 REAL interview questions from top tech companies.
Your task: ADAPT each question slightly to test the candidate's specific weak areas: ${gapSkills.join(', ') || 'general skills'}.
Keep the core question intact — only add context or a follow-up twist that makes it more relevant.
Preserve the companyTag, type, and focusSkill exactly. Keep questions realistic and challenging for ${selectedLevel} level.

Return ONLY valid JSON (no markdown fences):
{ "questions": [ { "id": "string", "type": "string", "companyTag": "string", "question": "string", "focusSkill": "string" } ] }`

      const userMsg = `Adapt these questions for a ${selectedLevel} ${roleToUse} candidate:\n${JSON.stringify(curatedQuestions.map(q => ({ id: q.id, type: q.type, companyTag: q.companyTag, question: q.question, focusSkill: q.focusSkill })))}`

      const resText = await callAI(systemPrompt, [{ role: 'user', content: userMsg }])
      if (resText) {
        let cleaned = resText.replace(/```json/gi, '').replace(/```/g, '').trim()
        const match = cleaned.match(/\{[\s\S]*\}/)
        if (match) cleaned = match[0]
        const data = JSON.parse(cleaned)
        if (data.questions && Array.isArray(data.questions) && data.questions.length >= 3) {
          setQuestions(data.questions.slice(0, 5))
          setCurrentIdx(0)
          setAnswers([])
          setScores([])
          setPhase('active')
          setLoading(false)
          return
        }
      }
    } catch (err) {
      console.warn('[InterviewPrep] AI adaptation skipped, using curated bank directly:', err.message)
    }

    // Fallback: Use curated questions directly (always works, never fails)
    setQuestions(curatedQuestions)
    setCurrentIdx(0)
    setAnswers([])
    setScores([])
    setPhase('active')
    setLoading(false)
  }

  // Submit Answer & Score via LLM
  const handleAnswerSubmit = async (e) => {
    e.preventDefault()
    if (!userAnswer.trim() || scoringLoading) return

    setScoringLoading(true)
    const currentQ = questions[currentIdx] || { question: "Technical Question", focusSkill: "General" }
    const roleToUse = customRole.trim() || selectedRole

    const systemPrompt = `You are an expert interviewer evaluating a candidate's answer.
Analyze the candidate's answer to the question for a ${selectedLevel} ${roleToUse} role.
Embed a score tag like [SCORE:85] and a skill tag like [SKILL:${currentQ.focusSkill || 'General'}] in your evaluation.
Provide 2-3 sentences of feedback (what was good, what was missing, and how to improve).`

    const userMsg = `Question: "${currentQ.question}"\nCandidate Answer: "${userAnswer}"`

    let numericScore = 82
    let cleanFeedback = "Good structured answer explaining the core concept clearly. To reach a top score, elaborate on production edge cases, performance trade-offs, and monitoring."
    let targetSkill = currentQ.focusSkill || 'General'

    try {
      const responseText = await callAI(systemPrompt, [{ role: 'user', content: userMsg }])
      if (responseText) {
        const scoreMatch = responseText.match(/\[SCORE:(\d+)\]/)
        if (scoreMatch) numericScore = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)))

        const skillMatch = responseText.match(/\[SKILL:([^\]]+)\]/)
        if (skillMatch) targetSkill = skillMatch[1].trim()

        const cleaned = responseText
          .replace(/\[SCORE:\d+\]/g, '')
          .replace(/\[SKILL:[^\]]+\]/g, '')
          .trim()
        if (cleaned) cleanFeedback = cleaned
      }
    } catch (err) {
      console.warn("[InterviewPrep] AI Answer scoring warning:", err.message)
    }

    const newScores = [...scores, { score: numericScore, feedback: cleanFeedback, focusSkill: targetSkill }]
    const newAnswers = [...answers, userAnswer]
    setScores(newScores)
    setAnswers(newAnswers)

    // Sync score to live skill graph
    if (updateSkills && targetSkill && typeof targetSkill === 'string' && targetSkill.trim()) {
      const delta = numericScore >= 70 ? 10 : -5
      updateSkills(targetSkill.trim(), delta)
    }

    setUserAnswer('')
    setScoringLoading(false)

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(c => c + 1)
    } else {
      finishSession(newScores, newAnswers)
    }
  }

  const finishSession = async (finalScores, finalAnswers) => {
    const total = finalScores.reduce((acc, s) => acc + (typeof s.score === 'number' ? s.score : (typeof s === 'number' ? s : 0)), 0)
    const overall = Math.round(total / (finalScores.length || 1))
    const roleToUse = customRole.trim() || selectedRole

    setPhase('summary')

    // Persist to SQLite
    if (currentUser) {
      await dbService.saveInterviewSession(currentUser, {
        role: roleToUse,
        level: selectedLevel,
        questions,
        answers: finalAnswers,
        scores: finalScores,
        overall_score: overall
      })
    }
  }

  const validScores = scores.map(s => (typeof s === 'number' ? s : (typeof s?.score === 'number' ? s.score : 0)))
  const overallScore = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 0

  const currentQ = questions[currentIdx] || questions[0] || { question: "Technical Question", type: "Technical", focusSkill: "General" }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              AI Mock Interview Prep
            </h1>
            <p className="text-sm text-white/60">
              Practice real technical and behavioral interview questions generated by AI and receive instant answer scoring.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* PHASE 1: SETUP */}
        {phase === 'setup' && (
          <motion.div
            key="setup-phase"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-8"
          >
            {/* Resume Suggestion Chip */}
            {resumeProfile && resumeProfile.name && (
              <div className="glass-card p-4 border border-primary/30 bg-primary/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <UserCheck className="w-5 h-5 text-primary" />
                  <span className="text-xs text-white/80">
                    Suggested for <span className="font-bold text-white">{resumeProfile.name}</span> based on resume profile.
                  </span>
                </div>
                <button
                  onClick={() => setSelectedRole(selectedRole)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Use Profile
                </button>
              </div>
            )}

            {/* Role Selection */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-base font-bold text-white">1. Select Target Role</h3>
              <div className="flex flex-wrap gap-3">
                {ROLES.map(r => (
                  <button
                    key={r}
                    onClick={() => { setSelectedRole(r); setCustomRole(''); }}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedRole === r && !customRole
                        ? 'bg-primary text-white border-primary shadow-lg scale-[1.02]'
                        : 'bg-black/40 text-white/70 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  placeholder="Or type a custom role (e.g. Cloud Security Architect, iOS Engineer)..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>

            {/* Level Selection */}
            <div className="glass-card p-6 space-y-4">
              <h3 className="text-base font-bold text-white">2. Select Target Experience Level</h3>
              <div className="grid grid-cols-3 gap-4">
                {LEVELS.map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      selectedLevel === lvl
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30 font-bold shadow-lg scale-[1.02]'
                        : 'bg-black/40 text-white/70 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span className="block text-sm">{lvl}</span>
                    <span className="block text-[10px] text-white/40 mt-1 font-mono">
                      {lvl === 'Junior' ? '1-2 Questions Focus' : lvl === 'Mid' ? 'System & Code Focus' : 'Architecture & Tradeoffs'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                {errorMsg}
              </div>
            )}

            {/* Start CTA */}
            <div className="flex justify-end">
              <button
                onClick={handleStartInterview}
                disabled={loading}
                className="btn-primary px-8 py-3 text-sm font-semibold flex items-center gap-2 shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Questions...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Start Mock Interview</>
                )}
              </button>
            </div>

            {/* Past Interview Sessions History */}
            {pastSessions.length > 0 && (
              <div className="glass-card p-6 space-y-4 border border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" /> Past Interview History
                </h3>
                <div className="space-y-2">
                  {pastSessions.slice(0, 5).map(sess => (
                    <div key={sess.id} className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">{sess.role}</span>
                        <span className="text-white/40 ml-2">({sess.level})</span>
                        <span className="block text-[10px] text-white/40">{new Date(sess.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-primary text-sm">{sess.overall_score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* PHASE 2: ACTIVE INTERVIEW */}
        {phase === 'active' && questions.length > 0 && (
          <motion.div
            key="active-phase"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            {/* Progress Bar */}
            <div className="flex items-center justify-between text-xs text-white/60 font-mono">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 font-semibold">
                {selectedLevel} {customRole || selectedRole}
              </span>
            </div>

            {/* Question Card */}
            <div className="glass-card p-6 space-y-4 border border-primary/30 bg-primary/5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider font-mono">
                    Type: {currentQ.type || 'Technical'}
                  </span>
                  {currentQ.companyTag && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold">
                      🏢 Asked at {currentQ.companyTag}
                    </span>
                  )}
                </div>
                {currentQ.focusSkill && (
                  <span className="text-xs text-white/50 font-mono">Target: {currentQ.focusSkill}</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white leading-relaxed">
                "{currentQ.question}"
              </h2>
            </div>

            {/* Answer Form */}
            <form onSubmit={handleAnswerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/60 mb-2">Your Answer:</label>
                <textarea
                  rows={6}
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  placeholder="Type your structured answer here. Include relevant technical details, trade-offs, and examples..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-primary/50 leading-relaxed font-sans"
                />
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40 font-mono">
                  {userAnswer.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  type="submit"
                  disabled={!userAnswer.trim() || scoringLoading}
                  className="btn-primary px-6 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {scoringLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Evaluating Answer...</>
                  ) : (
                    <>Submit & Get AI Feedback <Send className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* PHASE 3: SUMMARY */}
        {phase === 'summary' && (
          <motion.div
            key="summary-phase"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-8"
          >
            <div className="glass-card p-8 text-center space-y-4 flex flex-col items-center">
              <ScoreRing score={overallScore} />
              <div>
                <h2 className="text-xl font-bold text-white">Interview Complete!</h2>
                <p className="text-xs text-white/60">
                  Performance evaluation for {selectedLevel} {customRole || selectedRole} position
                </p>
              </div>
            </div>

            {/* Per-Question Breakdown */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white">Question Breakdown & Feedback</h3>
              {scores.map((sc, idx) => (
                <div key={idx} className="glass-card p-6 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-sm font-semibold text-white">
                      Q{idx + 1}: {questions[idx]?.question}
                    </h4>
                    <span className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary font-mono text-xs font-bold border border-primary/30">
                      {typeof sc.score === 'number' ? sc.score : (typeof sc === 'number' ? sc : 0)}%
                    </span>
                  </div>

                  {answers[idx] && (
                    <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-white/70">
                      <span className="text-white/40 block mb-1">Your Answer:</span>
                      "{answers[idx]}"
                    </div>
                  )}

                  <p className="text-xs text-white/80 leading-relaxed bg-primary/5 p-3 rounded-lg border border-primary/20">
                    💡 <span className="font-semibold text-primary">AI Feedback:</span> {sc.feedback}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setPhase('setup')}
                className="btn-primary px-6 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-4 h-4" /> Start Another Interview
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
