import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, ExternalLink, Award, Sparkles, Clock, DollarSign, Filter, CheckCircle2 } from 'lucide-react'
import courseCatalog from '../data/courseCatalog.json'
import { recommendCourses } from '../recommendEngine'
import { callAI } from '../aiService'

export default function CourseRecommender({ skills, resumeProfile }) {
  const [filterType, setFilterType] = useState('all') // 'all' | 'course' | 'certification'
  const [recommendations, setRecommendations] = useState(() => recommendCourses(skills, courseCatalog, { limit: 12 }))
  const [explanations, setExplanations] = useState({}) // itemId -> explanation string
  const [loadingAi, setLoadingAi] = useState({}) // itemId -> boolean

  useEffect(() => {
    const rawRecs = recommendCourses(skills, courseCatalog, { limit: 12 })
    setRecommendations(rawRecs)
  }, [skills])

  // Optional AI layer: generate 1-sentence explanation of why this course addresses the student's gap
  const fetchAiExplanation = async (item) => {
    if (explanations[item.id] || loadingAi[item.id]) return

    setLoadingAi(prev => ({ ...prev, [item.id]: true }))
    try {
      const topGap = item.matchingGaps?.[0]?.tag || item.skillTags?.[0] || 'technical skills'
      const systemPrompt = `You are a career advisor. Generate a 1-sentence explanation of why this course is recommended to a student based on their gap in ${topGap}. Be concise, encouraging, and specific.`
      const userPrompt = `Course: "${item.title}" by ${item.provider}. Primary skill target: ${topGap}. ${resumeProfile?.summary ? `Student context: ${resumeProfile.summary.slice(0, 150)}` : ''}`

      const explanation = await callAI(systemPrompt, [{ role: 'user', content: userPrompt }])
      setExplanations(prev => ({ ...prev, [item.id]: explanation }))
    } catch {
      setExplanations(prev => ({
        ...prev,
        [item.id]: `Targeted recommendation to strengthen your ${item.skillTags?.[0] || 'core'} proficiency.`
      }))
    } finally {
      setLoadingAi(prev => ({ ...prev, [item.id]: false }))
    }
  }

  const filteredItems = recommendations.filter(item => {
    if (filterType === 'course') return item.type === 'course'
    if (filterType === 'certification') return item.type === 'certification'
    return true
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-primary/20 text-primary border border-primary/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Recommended Courses & Certifications
            </h1>
          </div>
          <p className="text-sm text-white/60">
            Curated external learning resources dynamically ranked against your live skill gap analysis.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'all' ? 'bg-primary text-white shadow-lg' : 'text-white/60 hover:text-white'
            }`}
          >
            All Resources ({recommendations.length})
          </button>
          <button
            onClick={() => setFilterType('course')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'course' ? 'bg-primary text-white shadow-lg' : 'text-white/60 hover:text-white'
            }`}
          >
            Courses Only
          </button>
          <button
            onClick={() => setFilterType('certification')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterType === 'certification' ? 'bg-primary text-white shadow-lg' : 'text-white/60 hover:text-white'
            }`}
          >
            Certifications
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card p-6 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all group relative overflow-hidden"
          >
            {/* Top badges */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-2.5 py-1 rounded-md bg-white/10 text-white/80 text-xs font-semibold font-mono">
                  {item.provider}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  item.type === 'certification'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}>
                  {item.type === 'certification' ? '🏆 Certification' : '📖 Course'}
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors leading-snug">
                {item.title}
              </h3>

              {/* Badges bar */}
              <div className="flex items-center gap-3 text-xs text-white/50 font-mono pt-1">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary" /> {item.estHours}h</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-green-400" /> {item.estCost}</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60">{item.level}</span>
              </div>

              {/* Target Skill Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {item.skillTags.map((tag, i) => {
                  const isGap = item.matchingGaps?.some(m => m.tag.toLowerCase() === tag.toLowerCase())
                  return (
                    <span
                      key={i}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                        isGap
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 font-semibold'
                          : 'bg-white/5 text-white/60 border border-white/10'
                      }`}
                    >
                      {isGap ? `🎯 ${tag}` : tag}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* AI Explanation & Link */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              {explanations[item.id] ? (
                <p className="text-xs text-white/70 italic leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                  ✨ "{explanations[item.id]}"
                </p>
              ) : (
                <button
                  onClick={() => fetchAiExplanation(item)}
                  disabled={loadingAi[item.id]}
                  className="text-xs text-primary/80 hover:text-primary flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  {loadingAi[item.id] ? 'Generating gap explanation...' : 'Why is this recommended?'}
                </button>
              )}

              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg"
              >
                <span>View on {item.provider}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
