import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, CheckCircle2, User, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Code2, ArrowLeft } from 'lucide-react'

export default function ResumeReviewForm({ initialProfile, onSave, onCancel }) {
  const [profile, setProfile] = useState(() => {
    return {
      name: initialProfile?.name || '',
      contact: {
        email: initialProfile?.contact?.email || '',
        phone: initialProfile?.contact?.phone || '',
        location: initialProfile?.contact?.location || ''
      },
      summary: initialProfile?.summary || '',
      skills: Array.isArray(initialProfile?.skills)
        ? initialProfile.skills.map(s => typeof s === 'string' ? { name: s, category: 'General' } : s)
        : [],
      projects: Array.isArray(initialProfile?.projects) ? initialProfile.projects : [],
      experience: Array.isArray(initialProfile?.experience) ? initialProfile.experience : [],
      education: Array.isArray(initialProfile?.education) ? initialProfile.education : [],
      certifications: Array.isArray(initialProfile?.certifications) ? initialProfile.certifications : []
    }
  })

  const [newSkill, setNewSkill] = useState('')
  const [newCert, setNewCert] = useState('')

  // Top level fields
  const handleContactChange = (field, val) => {
    setProfile(p => ({ ...p, contact: { ...p.contact, [field]: val } }))
  }

  // Skills handlers
  const addSkill = () => {
    if (!newSkill.trim()) return
    setProfile(p => ({
      ...p,
      skills: [...p.skills, { name: newSkill.trim(), category: 'General' }]
    }))
    setNewSkill('')
  }

  const removeSkill = (idx) => {
    setProfile(p => ({ ...p, skills: p.skills.filter((_, i) => i !== idx) }))
  }

  // Projects handlers
  const addProject = () => {
    setProfile(p => ({
      ...p,
      projects: [...p.projects, { title: 'New Project', description: '', tech: [], link: '' }]
    }))
  }

  const updateProject = (idx, field, val) => {
    setProfile(p => {
      const updated = [...p.projects]
      updated[idx] = { ...updated[idx], [field]: val }
      return { ...p, projects: updated }
    })
  }

  const removeProject = (idx) => {
    setProfile(p => ({ ...p, projects: p.projects.filter((_, i) => i !== idx) }))
  }

  // Experience handlers
  const addExperience = () => {
    setProfile(p => ({
      ...p,
      experience: [...p.experience, { role: 'New Role', company: '', duration: '', bullets: [''] }]
    }))
  }

  const updateExperience = (idx, field, val) => {
    setProfile(p => {
      const updated = [...p.experience]
      updated[idx] = { ...updated[idx], [field]: val }
      return { ...p, experience: updated }
    })
  }

  const removeExperience = (idx) => {
    setProfile(p => ({ ...p, experience: p.experience.filter((_, i) => i !== idx) }))
  }

  // Education handlers
  const addEducation = () => {
    setProfile(p => ({
      ...p,
      education: [...p.education, { degree: 'Degree', institution: '', duration: '' }]
    }))
  }

  const updateEducation = (idx, field, val) => {
    setProfile(p => {
      const updated = [...p.education]
      updated[idx] = { ...updated[idx], [field]: val }
      return { ...p, education: updated }
    })
  }

  const removeEducation = (idx) => {
    setProfile(p => ({ ...p, education: p.education.filter((_, i) => i !== idx) }))
  }

  // Certifications
  const addCert = () => {
    if (!newCert.trim()) return
    setProfile(p => ({ ...p, certifications: [...p.certifications, newCert.trim()] }))
    setNewCert('')
  }

  const removeCert = (idx) => {
    setProfile(p => ({ ...p, certifications: p.certifications.filter((_, i) => i !== idx) }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(profile)
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-8 max-w-5xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Review & Edit Profile
          </h2>
          <p className="text-sm text-white/60">
            Confirm the extracted details below. You can add or modify any fields before saving.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Start Over
          </button>
        )}
      </div>

      {/* Personal Info & Contact */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" /> Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Alex Johnson"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">Email Address</label>
            <input
              type="email"
              value={profile.contact.email}
              onChange={e => handleContactChange('email', e.target.value)}
              placeholder="e.g. alex@example.com"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">Phone Number</label>
            <input
              type="text"
              value={profile.contact.phone}
              onChange={e => handleContactChange('phone', e.target.value)}
              placeholder="e.g. +1 (555) 000-1234"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">Location / City</label>
            <input
              type="text"
              value={profile.contact.location}
              onChange={e => handleContactChange('location', e.target.value)}
              placeholder="e.g. San Francisco, CA"
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Professional Summary</label>
          <textarea
            rows={3}
            value={profile.summary}
            onChange={e => setProfile(p => ({ ...p, summary: e.target.value }))}
            placeholder="Brief introduction highlighting your technical background and career goals..."
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary/50 leading-relaxed"
          />
        </div>
      </div>

      {/* Technical Skills Chip Editor */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" /> Technical Skills
        </h3>
        <p className="text-xs text-white/50">
          Skills extracted will automatically sync and update your Code Obsidian skill graph.
        </p>

        <div className="flex flex-wrap gap-2 min-h-[48px] p-3 rounded-xl bg-black/40 border border-white/10">
          {profile.skills.map((s, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/20 border border-primary/30 text-primary text-xs font-semibold"
            >
              {typeof s === 'string' ? s : s.name}
              <button
                type="button"
                onClick={() => removeSkill(idx)}
                className="hover:text-red-400 text-primary/70 transition-colors ml-1"
              >
                ×
              </button>
            </span>
          ))}
          {profile.skills.length === 0 && (
            <span className="text-xs text-white/30 self-center">No skills added yet. Type below to add.</span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
            placeholder="Add a skill (e.g. Python, Docker, Web Hacking)..."
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 text-sm focus:outline-none focus:border-primary/50"
          />
          <button
            type="button"
            onClick={addSkill}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Projects */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" /> Key Projects
          </h3>
          <button
            type="button"
            onClick={addProject}
            className="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold border border-primary/30 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Project
          </button>
        </div>

        <div className="space-y-4">
          {profile.projects.map((proj, idx) => (
            <div key={idx} className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3 relative group">
              <div className="flex items-center justify-between gap-4">
                <input
                  type="text"
                  value={proj.title}
                  onChange={e => updateProject(idx, 'title', e.target.value)}
                  placeholder="Project Title"
                  className="flex-1 bg-transparent font-semibold text-white text-sm focus:outline-none border-b border-white/10 focus:border-primary pb-1"
                />
                <button
                  type="button"
                  onClick={() => removeProject(idx)}
                  className="text-white/40 hover:text-red-400 p-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <textarea
                rows={2}
                value={proj.description}
                onChange={e => updateProject(idx, 'description', e.target.value)}
                placeholder="Project description, key features, and achievements..."
                className="w-full bg-black/30 border border-white/5 rounded-lg p-2.5 text-white/80 text-xs focus:outline-none focus:border-primary/40 leading-relaxed"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={Array.isArray(proj.tech) ? proj.tech.join(', ') : proj.tech || ''}
                  onChange={e => updateProject(idx, 'tech', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  placeholder="Technologies (comma-separated: React, Node, SQLite)"
                  className="bg-black/30 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-primary/40"
                />
                <input
                  type="text"
                  value={proj.link || ''}
                  onChange={e => updateProject(idx, 'link', e.target.value)}
                  placeholder="GitHub / Live Demo Link"
                  className="bg-black/30 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-primary/40"
                />
              </div>
            </div>
          ))}
          {profile.projects.length === 0 && (
            <p className="text-xs text-white/40 italic">No projects listed. Click "Add Project" above to add one.</p>
          )}
        </div>
      </div>

      {/* Experience */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-primary" /> Work Experience
          </h3>
          <button
            type="button"
            onClick={addExperience}
            className="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold border border-primary/30 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Experience
          </button>
        </div>

        <div className="space-y-4">
          {profile.experience.map((exp, idx) => (
            <div key={idx} className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                  <input
                    type="text"
                    value={exp.role}
                    onChange={e => updateExperience(idx, 'role', e.target.value)}
                    placeholder="Role / Title"
                    className="bg-black/30 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-primary/40"
                  />
                  <input
                    type="text"
                    value={exp.company}
                    onChange={e => updateExperience(idx, 'company', e.target.value)}
                    placeholder="Company / Organization"
                    className="bg-black/30 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-primary/40"
                  />
                  <input
                    type="text"
                    value={exp.duration}
                    onChange={e => updateExperience(idx, 'duration', e.target.value)}
                    placeholder="Duration (e.g. 2023 - Present)"
                    className="bg-black/30 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-primary/40"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeExperience(idx)}
                  className="text-white/40 hover:text-red-400 p-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <textarea
                rows={2}
                value={Array.isArray(exp.bullets) ? exp.bullets.join('\n') : exp.bullets || ''}
                onChange={e => updateExperience(idx, 'bullets', e.target.value.split('\n'))}
                placeholder="Key responsibilities and impacts (one bullet per line)..."
                className="w-full bg-black/30 border border-white/5 rounded-lg p-2.5 text-white/80 text-xs focus:outline-none focus:border-primary/40 leading-relaxed"
              />
            </div>
          ))}
          {profile.experience.length === 0 && (
            <p className="text-xs text-white/40 italic">No experience listed. Click "Add Experience" above to add.</p>
          )}
        </div>
      </div>

      {/* Education & Certifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Education */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" /> Education
            </h3>
            <button
              type="button"
              onClick={addEducation}
              className="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-semibold border border-primary/30 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          <div className="space-y-3">
            {profile.education.map((edu, idx) => (
              <div key={idx} className="bg-black/40 border border-white/10 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={e => updateEducation(idx, 'degree', e.target.value)}
                    placeholder="Degree / Program"
                    className="bg-transparent text-xs font-semibold text-white focus:outline-none flex-1 border-b border-white/10 pb-0.5"
                  />
                  <button type="button" onClick={() => removeEducation(idx)} className="text-white/40 hover:text-red-400 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={e => updateEducation(idx, 'institution', e.target.value)}
                    placeholder="Institution"
                    className="bg-black/30 border border-white/5 rounded px-2.5 py-1 text-xs text-white/80"
                  />
                  <input
                    type="text"
                    value={edu.duration}
                    onChange={e => updateEducation(idx, 'duration', e.target.value)}
                    placeholder="Year / Duration"
                    className="bg-black/30 border border-white/5 rounded px-2.5 py-1 text-xs text-white/80"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Certifications
          </h3>

          <div className="space-y-2 min-h-[60px]">
            {profile.certifications.map((c, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white">
                <span>🏆 {c}</span>
                <button type="button" onClick={() => removeCert(idx)} className="text-white/40 hover:text-red-400">×</button>
              </div>
            ))}
            {profile.certifications.length === 0 && (
              <p className="text-xs text-white/40 italic">No certifications added.</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCert}
              onChange={e => setNewCert(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
              placeholder="Add certification (e.g. AWS Certified, CEH)..."
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-primary/50"
            />
            <button
              type="button"
              onClick={addCert}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="submit"
          className="btn-primary flex items-center gap-2 px-8 py-3 text-sm font-semibold shadow-xl"
        >
          <CheckCircle2 className="w-5 h-5" /> Save Profile & Update Skill Graph
        </button>
      </div>
    </motion.form>
  )
}
