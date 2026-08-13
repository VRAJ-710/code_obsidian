import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Sparkles, RefreshCw, Lightbulb, Target, Rocket, ArrowRight, Briefcase, Building2, Info } from 'lucide-react'
import { dbService } from '../dbService'
import { extractResumeProfile, generateResumeInsights } from '../resumeService'
import { SKILL_KEYWORDS, analyzeGaps } from '../skillEngine'
import ResumeReviewForm from './ResumeReviewForm'

const ROLES = ['Frontend', 'Backend', 'Full-Stack', 'Cybersecurity', 'Data/ML', 'DevOps']

export default function ResumeUpload({ currentUser, resumeProfile, setResumeProfile, skills, updateSkills, setSkills }) {
  const [dragActive, setDragActive] = useState(false)
  const [loadingState, setLoadingState] = useState(null) // null | 'uploading' | 'parsing' | null
  const [errorMsg, setErrorMsg] = useState(null)
  const [extractedProfile, setExtractedProfile] = useState(null)
  const [isReviewing, setIsReviewing] = useState(false)

  // Insights State
  const [insights, setInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(false)

  // Target Company/Role Guidance State
  const [targetCompany, setTargetCompany] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [customTargetRole, setCustomTargetRole] = useState('')
  const [guidance, setGuidance] = useState(null)
  const [guidanceLoading, setGuidanceLoading] = useState(false)
  const [guidanceError, setGuidanceError] = useState(null)

  // Hydrate target fields from saved profile
  useEffect(() => {
    if (resumeProfile) {
      if (resumeProfile.targetCompany) setTargetCompany(resumeProfile.targetCompany)
      if (resumeProfile.targetRole) {
        if (ROLES.includes(resumeProfile.targetRole)) {
          setTargetRole(resumeProfile.targetRole)
        } else {
          setCustomTargetRole(resumeProfile.targetRole)
        }
      }
    }
  }, [resumeProfile])

  // Auto-fetch insights on mount if saved profile exists
  useEffect(() => {
    if (resumeProfile && resumeProfile.name && !insights && !insightsLoading) {
      fetchInsights(resumeProfile, skills)
    }
  }, [resumeProfile])

  const fetchInsights = async (targetProfile, currentSkills) => {
    if (!targetProfile) return
    setInsightsLoading(true)
    try {
      const gaps = analyzeGaps(currentSkills || {}).slice(0, 5)
      const gapSummary = gaps.length > 0
        ? gaps.map(g => `${g.name}: mastery ${g.mastery}%`).join(', ')
        : 'General skill acceleration needed'

      const res = await generateResumeInsights(targetProfile, gapSummary)
      setInsights(res)
    } catch (err) {
      console.warn('[Fetch Insights Error]:', err.message)
      setInsights(null)
    } finally {
      setInsightsLoading(false)
    }
  }

  // Fetch targeted guidance for company/role
  const fetchGuidance = async () => {
    const roleToUse = customTargetRole.trim() || targetRole
    if (!roleToUse && !targetCompany.trim()) return

    setGuidanceLoading(true)
    setGuidanceError(null)
    setGuidance(null)

    // Persist target fields to existing resume profile
    const updatedProfile = { ...resumeProfile, targetCompany: targetCompany.trim(), targetRole: roleToUse }
    setResumeProfile(updatedProfile)
    if (currentUser) {
      dbService.updateField(currentUser, 'resume', updatedProfile)
    }

    try {
      const gaps = analyzeGaps(skills || {}).slice(0, 5)
      const gapSummary = gaps.length > 0
        ? gaps.map(g => `${g.name}: mastery ${g.mastery}%`).join(', ')
        : 'General skill acceleration needed'

      const result = await generateResumeInsights(updatedProfile, gapSummary, targetCompany.trim(), roleToUse)
      if (result) {
        setGuidance(result)
      } else {
        setGuidanceError('AI could not generate guidance at this moment. Please try again.')
      }
    } catch (err) {
      console.warn('[Guidance Error]:', err.message)
      setGuidanceError('Failed to generate targeted guidance. Please try again.')
    } finally {
      setGuidanceLoading(false)
    }
  }

  // Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  // Real File Processing Pipeline
  const processFile = async (file) => {
    setErrorMsg(null)
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'txt') {
      setErrorMsg('Only .pdf and .docx files are supported.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds 10MB limit.')
      return
    }

    try {
      // Step 1: Upload & Extract Raw Text from file bytes (with server + client fallback)
      setLoadingState('uploading')
      let rawText = ''

      try {
        const parseResult = await dbService.parseResume(file)
        if (parseResult && parseResult.text) {
          rawText = parseResult.text
        }
      } catch (parseErr) {
        console.warn('[Resume Upload] Server parse warning:', parseErr.message)
      }

      if (!rawText || !rawText.trim()) {
        rawText = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result || '')
          reader.onerror = () => resolve('')
          reader.readAsText(file)
        })
      }

      if (!rawText || !rawText.trim()) {
        rawText = `Resume Candidate - File: ${file.name}`
      }

      // Step 2: Call LLM to structure extracted text into profile JSON
      setLoadingState('parsing')
      const profile = await extractResumeProfile(rawText)

      setLoadingState(null)
      const hasRealContent = profile && (
        profile.name || profile.summary ||
        (profile.skills && profile.skills.length > 0) ||
        (profile.projects && profile.projects.length > 0) ||
        (profile.experience && profile.experience.length > 0) ||
        (profile.education && profile.education.length > 0)
      )
      if (hasRealContent) {
        setExtractedProfile(profile)
      } else {
        setExtractedProfile({
          name: file.name.split('.')[0] || 'Resume Candidate',
          contact: { email: '', phone: '', location: '' },
          summary: rawText.slice(0, 300) + '...',
          skills: [{ name: 'Software Engineering', category: 'Technical' }],
          projects: [],
          experience: [],
          education: [],
          certifications: []
        })
      }
      setIsReviewing(true)
    } catch (err) {
      console.warn('[Resume Processing Error]:', err.message)
      setLoadingState(null)
      setExtractedProfile({
        name: file.name.split('.')[0] || 'Resume Candidate',
        contact: { email: '', phone: '', location: '' },
        summary: '',
        skills: [{ name: 'Software Development', category: 'Technical' }],
        projects: [],
        experience: [],
        education: [],
        certifications: []
      })
      setIsReviewing(true)
    }
  }

  // Save profile and sync skills to existing skill graph
  const handleSaveProfile = async (savedProfile) => {
    setResumeProfile(savedProfile)

    // 1. Save to SQLite database
    if (currentUser) {
      await dbService.updateField(currentUser, 'resume', savedProfile)
    }

    // 2. Map skills to canonical taxonomy and update skill graph in a single atomic batch
    let updatedSkillsState = skills || {}
    if (savedProfile.skills && Array.isArray(savedProfile.skills) && setSkills) {
      const canonicalSkills = Object.keys(SKILL_KEYWORDS || {})
      const projectTechs = (savedProfile.projects || []).flatMap(p => p.tech || [])
      const expBullets = (savedProfile.experience || []).flatMap(e => e.bullets || []).join(' ')

      const nextSkills = { ...(skills || {}) }

      savedProfile.skills.forEach(s => {
        const rawName = typeof s === 'string' ? s : (s.name || s.skill || '')
        if (!rawName || !rawName.trim()) return

        const skillName = rawName.trim()

        // Check if referenced in projects or experience
        const isUsedInProjectsOrExp =
          projectTechs.some(t => t.toLowerCase().includes(skillName.toLowerCase())) ||
          expBullets.toLowerCase().includes(skillName.toLowerCase())

        const delta = isUsedInProjectsOrExp ? 20 : 12

        // Match against canonical taxonomy
        const matchedCanonical = canonicalSkills.find(c =>
          c.toLowerCase() === skillName.toLowerCase() ||
          SKILL_KEYWORDS[c]?.some(kw => kw.toLowerCase() === skillName.toLowerCase())
        )

        const targetKey = matchedCanonical || skillName

        if (nextSkills[targetKey]) {
          nextSkills[targetKey] = {
            ...nextSkills[targetKey],
            mastery: Math.min(100, (nextSkills[targetKey].mastery || 40) + delta),
            confidence: 'high',
            lastPracticed: 'just now'
          }
        } else {
          nextSkills[targetKey] = {
            mastery: Math.min(100, 60 + delta),
            confidence: 'high',
            errorFreq: 0,
            lastPracticed: 'just now'
          }
        }
      })

      setSkills(nextSkills)
      updatedSkillsState = nextSkills
    }

    setIsReviewing(false)

    // 3. Trigger AI Insights Generation based on updated profile and live skill gaps
    fetchInsights(savedProfile, updatedSkillsState)
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Resume Intelligence & Skill Profile
            </h1>
            <p className="text-sm text-white/60">
              Upload your PDF or DOCX resume to extract technical skills, projects, and work experience into your live skill graph.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isReviewing ? (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            {/* Upload Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`glass-card border-2 border-dashed p-10 md:p-14 text-center transition-all duration-300 relative overflow-hidden ${
                dragActive ? 'border-primary bg-primary/10 scale-[1.01]' : 'border-white/20 hover:border-white/40'
              }`}
            >
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center mx-auto shadow-lg">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    Drag and drop your resume file here
                  </h3>
                  <p className="text-xs text-white/50">
                    Supports <span className="text-primary font-semibold">.PDF</span> and <span className="text-primary font-semibold">.DOCX</span> files up to 5MB
                  </p>
                </div>

                <div className="pt-2">
                  <label className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold cursor-pointer shadow-xl">
                    <FileText className="w-4 h-4" /> Browse File
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Sequential Loading State */}
            {loadingState && (
              <div className="glass-card p-6 border border-primary/30 bg-primary/5 space-y-4">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-sm font-semibold text-white font-mono">
                    {loadingState === 'uploading' ? 'Reading your resume file bytes...' : 'Understanding your experience & extracting skills with AI...'}
                  </span>
                </div>
                {/* Skeleton shimmer bar */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden relative">
                  <div className="bg-gradient-to-r from-primary to-orange-400 h-full w-2/3 animate-pulse rounded-full" />
                </div>
              </div>
            )}

            {/* Existing Saved Profile Card */}
            {resumeProfile && resumeProfile.name && (
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                      <div>
                        <h3 className="text-base font-bold text-white">{resumeProfile.name}</h3>
                        <p className="text-xs text-white/50">{resumeProfile.contact?.email} · {resumeProfile.contact?.location}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setExtractedProfile(resumeProfile); setIsReviewing(true); }}
                      className="btn-secondary text-xs px-4 py-2 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Edit Current Profile
                    </button>
                  </div>

                  {resumeProfile.summary && (
                    <p className="text-xs text-white/70 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                      {resumeProfile.summary}
                    </p>
                  )}

                  {resumeProfile.skills && resumeProfile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {resumeProfile.skills.map((s, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-mono">
                          {typeof s === 'string' ? s : s.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Target Company/Role Guidance Section ───────────────────── */}
                <div className="glass-card p-6 space-y-5 border border-cyan-500/20">
                  <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                    <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        Target Company & Role Guidance
                      </h3>
                      <p className="text-xs text-white/50">
                        Get honest, tailored advice on what to prioritize for your dream role.
                      </p>
                    </div>
                  </div>

                  {/* Target Company Input */}
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> Target Company
                    </label>
                    <input
                      type="text"
                      value={targetCompany}
                      onChange={e => setTargetCompany(e.target.value)}
                      placeholder="e.g. Google, Amazon, Stripe, TCS, Infosys..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  {/* Target Role Chips (reuse ROLES from InterviewPrep) */}
                  <div>
                    <label className="block text-xs font-semibold text-white/60 mb-2 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> Target Role
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {ROLES.map(r => (
                        <button
                          key={r}
                          onClick={() => { setTargetRole(r); setCustomTargetRole(''); }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            targetRole === r && !customTargetRole
                              ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                              : 'bg-black/40 text-white/70 border-white/10 hover:border-white/30'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={customTargetRole}
                      onChange={e => { setCustomTargetRole(e.target.value); if (e.target.value.trim()) setTargetRole(''); }}
                      placeholder="Or type a custom role (e.g. Cloud Security Architect, iOS Engineer)..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>

                  {/* Generate Guidance Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={fetchGuidance}
                      disabled={guidanceLoading || (!targetCompany.trim() && !targetRole && !customTargetRole.trim())}
                      className="btn-primary px-6 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {guidanceLoading ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Guidance...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Generate Guidance</>
                      )}
                    </button>
                  </div>

                  {/* Guidance Results */}
                  {guidanceLoading && (
                    <div className="py-6 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                      <p className="text-xs font-mono text-white/70">
                        Generating targeted guidance for {customTargetRole || targetRole || 'role'}{targetCompany ? ` at ${targetCompany}` : ''}...
                      </p>
                    </div>
                  )}

                  {guidanceError && !guidanceLoading && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center space-y-3">
                      <p className="text-xs text-red-300 flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" /> {guidanceError}
                      </p>
                      <button
                        onClick={fetchGuidance}
                        className="btn-secondary text-xs px-4 py-2 inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Retry
                      </button>
                    </div>
                  )}

                  {guidance && !guidanceLoading && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      {/* Honesty Disclaimer — always shown first */}
                      {guidance.disclaimer && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-yellow-300/80">
                          <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <p className="text-[11px] leading-relaxed">{guidance.disclaimer}</p>
                        </div>
                      )}

                      {/* Recommended Skills */}
                      {guidance.nextSkills && guidance.nextSkills.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Target className="w-4 h-4" /> Skills to Prioritize
                            {(customTargetRole || targetRole) && <span className="text-white/40 normal-case">for {customTargetRole || targetRole}</span>}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {guidance.nextSkills.map((sk, idx) => (
                              <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                                <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                                  <ArrowRight className="w-3 h-3 text-cyan-400" /> {sk.skill}
                                </span>
                                <p className="text-xs text-white/60 leading-normal">{sk.why}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Project Ideas */}
                      {guidance.projectIdeas && guidance.projectIdeas.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Rocket className="w-4 h-4" /> Portfolio Projects to Build
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {guidance.projectIdeas.map((pj, idx) => (
                              <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                                <h5 className="text-sm font-bold text-white">{pj.title}</h5>
                                <p className="text-xs text-white/70 leading-relaxed">{pj.description}</p>
                                {pj.whyRelevant && (
                                  <p className="text-[11px] text-cyan-400/80 leading-relaxed bg-cyan-500/5 rounded-lg p-2 border border-cyan-500/10">
                                    🎯 {pj.whyRelevant}
                                  </p>
                                )}
                                {pj.skillsUsed && pj.skillsUsed.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {pj.skillsUsed.map((t, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/60 font-mono">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Positioning Notes */}
                      {guidance.positioningNotes && (
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Lightbulb className="w-4 h-4" /> Resume Positioning Strategy
                          </h4>
                          <p className="text-xs text-white/70 leading-relaxed bg-purple-500/5 p-3.5 rounded-xl border border-purple-500/15">
                            {guidance.positioningNotes}
                          </p>
                        </div>
                      )}

                      {/* Resume Gaps */}
                      {guidance.resumeGaps && guidance.resumeGaps.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <AlertTriangle className="w-4 h-4" /> Gaps to Address
                          </h4>
                          <ul className="space-y-1">
                            {guidance.resumeGaps.map((gp, idx) => (
                              <li key={idx} className="text-xs text-white/70 flex items-start gap-2">
                                <span className="text-red-400 font-bold">•</span>
                                <span>{gp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* AI Insights & Career Recommendations Section */}
                <div className="glass-card p-6 space-y-6 border border-primary/30 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          AI Career Mentorship & Skill Recommendations
                        </h3>
                        <p className="text-xs text-white/50">
                          Personalized learning roadmap generated from your resume profile and live skill gaps.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => fetchInsights(resumeProfile, skills)}
                      disabled={insightsLoading}
                      className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${insightsLoading ? 'animate-spin' : ''}`} />
                      Refresh Insights
                    </button>
                  </div>

                  {insightsLoading ? (
                    <div className="py-8 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                      <p className="text-xs font-mono text-white/70">
                        Generating AI Career & Project Insights based on your resume and skill graph...
                      </p>
                    </div>
                  ) : insights ? (
                    <div className="space-y-6">
                      {/* Next Recommended Skills */}
                      {insights.nextSkills && insights.nextSkills.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Target className="w-4 h-4 text-primary" /> Recommended Focus Skills
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {insights.nextSkills.map((sk, idx) => (
                              <div key={idx} className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-1">
                                <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                                  <ArrowRight className="w-3 h-3 text-primary" /> {sk.skill}
                                </span>
                                <p className="text-xs text-white/60 leading-normal">{sk.why}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tailored Project Ideas */}
                      {insights.projectIdeas && insights.projectIdeas.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <Rocket className="w-4 h-4 text-orange-400" /> Tailored Portfolio Project Ideas
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {insights.projectIdeas.map((pj, idx) => (
                              <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                                <h5 className="text-sm font-bold text-white">{pj.title}</h5>
                                <p className="text-xs text-white/70 leading-relaxed">{pj.description}</p>
                                {pj.skillsUsed && pj.skillsUsed.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {pj.skillsUsed.map((t, i) => (
                                      <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/60 font-mono">
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resume Gaps */}
                      {insights.resumeGaps && insights.resumeGaps.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <AlertTriangle className="w-4 h-4 text-red-400" /> Resume & Experience Gaps to Address
                          </h4>
                          <ul className="space-y-1">
                            {insights.resumeGaps.map((gp, idx) => (
                              <li key={idx} className="text-xs text-white/70 flex items-start gap-2">
                                <span className="text-red-400 font-bold">•</span>
                                <span>{gp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-black/40 border border-white/10 text-center space-y-3">
                      <p className="text-xs text-white/50">
                        Couldn't generate AI Insights at this moment.
                      </p>
                      <button
                        onClick={() => fetchInsights(resumeProfile, skills)}
                        className="btn-secondary text-xs px-4 py-2 inline-flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Try Generating Insights
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <ResumeReviewForm
            key="review-form"
            initialProfile={extractedProfile}
            onSave={handleSaveProfile}
            onCancel={() => setIsReviewing(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
