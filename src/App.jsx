import SlidingDashboard from './components/SlidingDashboard'
import { useState, Suspense, lazy, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import TriangleBackground from './components/TriangleBackground'
import AgentChat from './components/AgentChat'
import FeatureCards from './components/FeatureCards'
import SkillTrack from './components/SkillTrack'
import LearningTracks from './components/LearningTracks'
import LearningModeSelector from './components/LearningModeSelector'
import PlaygroundEditor from './components/PlaygroundEditor'
import ZaraExaminer from './components/ZaraExaminer'
import CourseViewer from './components/CourseViewer'
import CourseExam from './components/CourseExam'
import Login from './components/Login'
import ResumeUpload from './components/ResumeUpload'
import CourseRecommender from './components/CourseRecommender'
import InterviewPrep from './components/InterviewPrep'
import CyberLab from './components/CyberLab'
import SplitFlapText from './components/SplitFlapText'
import './components/SplitFlapText.css'
import ClickSpark from './components/ClickSpark'
import DecryptedText from './components/DecryptedText'
import SidebarFlowingButton from './components/SidebarFlowingButton'
import { dbService } from './dbService'
import { Home, Bot, Code, Zap, Target, Map, Brain, Search, Bug, Shield, FileText, MessageSquare, GraduationCap, UploadCloud, Sparkles, Terminal } from 'lucide-react'
import './App.css'

const CodeEditor = lazy(() => import('./components/CodeEditor'))

function usePrefersReducedMotion() {
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReduced(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  return prefersReduced;
}

const NAV_ITEMS = [
  { id: 'home', icon: <Home className="w-5 h-5" />, label: 'Home' },
  { id: 'resume', icon: <FileText className="w-5 h-5" />, label: 'Resume Profile' },
  { id: 'interview', icon: <MessageSquare className="w-5 h-5" />, label: 'Interview Prep' },
  { id: 'courses', icon: <GraduationCap className="w-5 h-5" />, label: 'Recommended' },
  { id: 'studio', icon: <Bot className="w-5 h-5" />, label: 'AI Studio' },
  { id: 'playground', icon: <Code className="w-5 h-5" />, label: 'Playground' },
  { id: 'zara', icon: <Zap className="w-5 h-5" />, label: 'Zara Exam' },
  { id: 'skill-track', icon: <Target className="w-5 h-5" />, label: 'Skill Track' },
  { id: 'tracks', icon: <Map className="w-5 h-5" />, label: 'Learning Tracks' },
  { id: 'cyberlab', icon: <Shield className="w-5 h-5" />, label: 'Cyber Lab' },
]

const AGENTS = [
  { id: 'teacher', label: 'Sage', emoji: <Brain className="w-4 h-4" />, desc: 'Teaching Agent', color: 'from-orange-500 to-red-500' },
  { id: 'reviewer', label: 'Aria', emoji: <Search className="w-4 h-4" />, desc: 'Code Review', color: 'from-blue-500 to-cyan-500' },
  { id: 'debugger', label: 'Rex', emoji: <Bug className="w-4 h-4" />, desc: 'Debugger', color: 'from-purple-500 to-pink-500' },
  { id: 'zara', label: 'Zara', emoji: <Zap className="w-4 h-4" />, desc: 'The Examiner', color: 'from-violet-600 to-pink-500' },
]

const INITIAL_SKILLS = {
  Variables: { mastery: 72, confidence: 'high', errorFreq: 2, lastPracticed: '2h ago' },
  'Data Types': { mastery: 65, confidence: 'medium', errorFreq: 5, lastPracticed: '1d ago' },
  Conditionals: { mastery: 80, confidence: 'high', errorFreq: 1, lastPracticed: '3h ago' },
  Loops: { mastery: 58, confidence: 'medium', errorFreq: 8, lastPracticed: '2d ago' },
  Functions: { mastery: 45, confidence: 'low', errorFreq: 12, lastPracticed: '1d ago' },
  Recursion: { mastery: 20, confidence: 'low', errorFreq: 18, lastPracticed: '3d ago' },
  Arrays: { mastery: 60, confidence: 'medium', errorFreq: 6, lastPracticed: '5h ago' },
  Pointers: { mastery: 15, confidence: 'low', errorFreq: 22, lastPracticed: '4d ago' },
  OOP: { mastery: 35, confidence: 'low', errorFreq: 14, lastPracticed: '2d ago' },
  'Time Complexity': { mastery: 25, confidence: 'low', errorFreq: 16, lastPracticed: '5d ago' },
  'Web Hacking': { mastery: 0, confidence: 'low', errorFreq: 0, lastPracticed: 'never' },
  'Network Security': { mastery: 0, confidence: 'low', errorFreq: 0, lastPracticed: 'never' },
  'Cryptography': { mastery: 0, confidence: 'low', errorFreq: 0, lastPracticed: 'never' },
  'Reverse Engineering': { mastery: 0, confidence: 'low', errorFreq: 0, lastPracticed: 'never' },
  'Incident Response': { mastery: 0, confidence: 'low', errorFreq: 0, lastPracticed: 'never' },
}

export default function App() {
  const prefersReducedMotion = usePrefersReducedMotion();

  const renderDecryptText = (text, className = '') => {
    if (prefersReducedMotion) {
      return <span className={className}>{text}</span>;
    }
    return (
      <DecryptedText
        text={text}
        animateOn="view"
        sequential
        revealDirection="start"
        className={className}
      />
    );
  };

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  // Initialize user from LocalStorage session
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('code_obsidian_current_user') || null;
  });

  const [dashboardOpen, setDashboardOpen] = useState(false)
  const [activePage, setActivePage] = useState(currentUser ? 'home' : 'login')
  const [activeAgent, setActiveAgent] = useState('teacher')
  const [learningMode, setLearningMode] = useState('guided')
  const [sessionId] = useState(() => uuidv4())
  const [skills, setSkills] = useState(INITIAL_SKILLS)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [trackContext, setTrackContext] = useState(null)
  const trackMsgSent = useRef(false)
  const [activeCourse, setActiveCourse] = useState(null)
  const [topControlsHovered, setTopControlsHovered] = useState(false)
  const [resumeProfile, setResumeProfile] = useState(null)

  // Hydrate Data on initial load or user switch
  useEffect(() => {
    if (currentUser) {
      dbService.getUserData(currentUser).then(data => {
        if (data && data.skills && Object.keys(data.skills).length > 0) {
          const cleanSkills = Object.fromEntries(
            Object.entries(data.skills).filter(([, v]) => v && typeof v.mastery === 'number')
          );
          setSkills(Object.keys(cleanSkills).length > 0 ? cleanSkills : INITIAL_SKILLS);
        } else if (data) {
          // Initialize DB with standard default if new user
          dbService.updateField(currentUser, 'skills', INITIAL_SKILLS);
          setSkills(INITIAL_SKILLS);
        }

        if (data && data.resume) {
          setResumeProfile(data.resume);
        }

        // Track daily visit for Streak forever
        if (data) {
          const today = new Date().toISOString().split('T')[0];
          const activity = data.activity || {};
          if (!activity[today]) {
            activity[today] = 1; // 1 minute/visit
            dbService.updateField(currentUser, 'activity', activity);
          }
        }
      });
    }
  }, [currentUser]);

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === 'dark') {
      root.classList.remove('light')
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (currentUser) {
      dbService.updateField(currentUser, 'skills', skills);
    }

    // Save skill history for AI prediction tracking
    try {
      const historyData = localStorage.getItem('code_obsidian_skill_history')
      let history = historyData ? JSON.parse(historyData) : []
      history.push({ timestamp: new Date().toISOString(), skills })
      if (history.length > 50) history = history.slice(-50)
      localStorage.setItem('code_obsidian_skill_history', JSON.stringify(history))
    } catch (e) {
      console.error('Failed to save skill history', e)
    }
  }, [skills, currentUser])

  const updateSkills = (skillsOrName, delta) => {
    if (typeof skillsOrName === 'object') {
      setSkills(skillsOrName)
    } else {
      setSkills(prev => {
        const base = prev[skillsOrName] || { mastery: 50, confidence: 'medium', errorFreq: 0, lastPracticed: 'never' }
        return {
          ...prev,
          [skillsOrName]: {
            ...base,
            mastery: Math.min(100, Math.max(0, base.mastery + delta)),
            lastPracticed: 'just now',
          },
        }
      })
    }
  }

  const handleStartTrack = (ctx) => {
    setTrackContext(ctx)
    setActiveAgent('teacher')
    trackMsgSent.current = false
    setActivePage('studio')
  }

  const handleStartCourse = (courseData) => {
    setActiveCourse(courseData)
    setActivePage('course')
  }

  const handleTakeExam = (courseData) => {
    setActiveCourse(courseData)
    setActivePage('course-exam')
  }

  const handleExamComplete = (course, score) => {
    setActiveCourse(null)
    setActivePage('tracks')
  }

  const handleLoginSuccess = (username) => {
    setCurrentUser(username);
    setActivePage('home');
  }

  const handleLogout = () => {
    localStorage.removeItem('code_obsidian_current_user');
    setCurrentUser(null);
    setActivePage('login');
  }

  if (activePage === 'login' || !currentUser) {
    return (
      <div className="min-h-screen flex overflow-hidden bg-black" style={{ fontFamily: 'var(--font-body)' }}>
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex overflow-hidden magic-hover-container" style={{ background: 'var(--bg-primary)', fontFamily: 'var(--font-body)' }}>
      <ClickSpark
        sparkColor="#a54005"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      />

      <TriangleBackground isLightMode={theme === 'light'} />

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 220 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="h-screen relative z-50 flex-shrink-0 hidden md:flex flex-col py-6 border-r border-white/10"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)' }}
      >
        <div className="px-4 mb-8 flex items-center gap-3 overflow-hidden">
          <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center font-black text-lg shadow-lg shadow-orange-500/30"
            style={{ fontFamily: 'var(--font-display)' }}>D</div>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Code Obsidian</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#FF6B35' }}>AI Pair Programmer</div>
            </motion.div>
          )}
        </div>

        <nav className="flex-1 flex flex-col gap-1.5 px-2 overflow-y-auto select-none [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
          {NAV_ITEMS.map(item => (
            <SidebarFlowingButton
              key={item.id}
              item={item}
              isActive={activePage === item.id}
              onClick={() => setActivePage(item.id)}
              sidebarCollapsed={sidebarCollapsed}
              prefersReducedMotion={prefersReducedMotion}
            />
          ))}
        </nav>

        {!sidebarCollapsed && (
          <div className="px-3 mt-4">
            <div className="text-xs text-white/30 mb-2 px-1"
              style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Mode</div>
            <LearningModeSelector mode={learningMode} onChange={setLearningMode} />
          </div>
        )}

        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="mx-auto mt-4 w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </motion.aside>

      {/* Mobile Navbar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/10 z-50 flex items-center justify-around p-2 pb-safe">
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setActivePage(item.id)} className={`p-2 rounded-xl text-[1.2rem] ${activePage === item.id ? 'bg-orange-500/20 text-orange-400' : 'text-white/40'}`}>
            {item.icon}
          </button>
        ))}
      </div>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto relative z-10 pb-16 md:pb-0">
        <AnimatePresence mode="popLayout" initial={false}>

          {/* HOME */}
          {activePage === 'home' && (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* Hero */}
              <section className="relative min-h-screen flex items-center justify-center px-8">
                <div className="text-center max-w-5xl mx-auto">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>

                    {/* Badge */}
                    <motion.div
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/8 mb-12"
                      style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Claude Sonnet 4 · AWS Bedrock · Hackathon 2026
                    </motion.div>

                    {/* Headline */}
                    <div className="mb-8 select-none drop-shadow-2xl bg-black/20 p-8 rounded-3xl backdrop-blur-sm border border-white/5 inline-block">
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="flex justify-center mb-8 relative">
                        {/* Glowing Background Pulse */}
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-purple-500/20 blur-xl rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>

                        {/* Animated Border Badge */}
                        <div className="relative group px-6 py-2 rounded-full overflow-hidden bg-black/40 border border-white/10 backdrop-blur-md shadow-[0_0_30px_rgba(255,107,53,0.3)] hover:shadow-[0_0_50px_rgba(255,107,53,0.6)] transition-all duration-500">
                          {/* Spinning Gradient Border */}
                          <div className="absolute inset-[-100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] animate-[spin_4s_linear_infinite] opacity-30 group-hover:opacity-100 transition-opacity"></div>

                          {/* Inner Content Background to hide spin except on edges */}
                          <div className="absolute inset-[1px] bg-[#1a1b1e] rounded-full"></div>

                          {/* Text content */}
                          <div className="relative flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_#f97316] animate-ping" style={{ animationDuration: '2s' }}></span>
                            <span className="font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 tracking-[0.3em] uppercase text-xs sm:text-sm" style={{ WebkitTextStroke: '0.2px rgba(255,255,255,0.2)' }}>
                              AI-Powered
                            </span>
                          </div>
                        </div>
                      </motion.div>
                      <div className="flex flex-wrap items-baseline justify-center hero-text-group cursor-pointer transition-transform hover:scale-105 duration-300">
                        <motion.div
                          initial={{ opacity: 0, y: 30 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35, duration: 0.7 }}
                        >
                          <SplitFlapText
                            words={['CODE OBSIDIAN']}
                            loop={false}
                            flipDuration={0.12}
                            stagger={0.06}
                            charset="alphanumeric"
                            flipsPerChar={8}
                            padTo={14}
                            tileColor="#1A1A2E"
                            textColor="#FF6B35"
                            tileRadius={12}
                            gap={4}
                            fontSize="clamp(3rem, 8vw, 6rem)"
                          />
                        </motion.div>
                      </div>
                    </div>

                    <motion.p className="hero-sub font-medium drop-shadow-md bg-black/40 inline-block px-6 py-2 rounded-full border border-white/10"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
                      4 agents · skill tracking · real challenges · personalized paths
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }}
                      className="flex flex-col sm:flex-row gap-4 justify-center mt-10"
                    >
                      <motion.button
                        whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActivePage('studio')}
                        className="px-10 py-4 font-mono uppercase tracking-wider text-xs font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_35px_rgba(249,115,22,0.6)] focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black outline-none flex items-center justify-center gap-2"
                      >
                        Start Learning
                      </motion.button>
                      <motion.button
                        whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActivePage('tracks')}
                        className="px-10 py-4 font-mono uppercase tracking-wider text-xs font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl transition-all shadow-[0_0_15px_rgba(0,212,255,0.15)] hover:shadow-[0_0_25px_rgba(0,212,255,0.35)] focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black outline-none flex items-center justify-center gap-2"
                      >
                        View Tracks
                      </motion.button>
                    </motion.div>

                  </motion.div>

                  {/* Stats */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}
                    className="flex justify-center gap-12 mt-24"
                  >
                    {[
                      { value: '4', label: 'AI Agents' },
                      { value: '15', label: 'Skill Nodes' },
                      { value: '5', label: 'Tracks' },
                      { value: '3', label: 'Learning Modes' },
                    ].map(s => (
                      <div key={s.label} className="text-center">
                        <div className="stat-number">{s.value}</div>
                        <div className="stat-label">{s.label}</div>
                      </div>
                    ))}
                  </motion.div>

                  {/* Resume Onboarding Prompt */}
                  {(!resumeProfile || !resumeProfile.name) && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="max-w-4xl mx-auto my-12 p-6 rounded-2xl glass-card border border-primary/40 bg-primary/10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div className="w-14 h-14 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center flex-shrink-0">
                          <UploadCloud className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-2">
                            Upload Your Resume to Calibrate Your Skill Graph <Sparkles className="w-4 h-4 text-orange-400" />
                          </h3>
                          <p className="text-xs text-white/70 leading-relaxed mt-1">
                            Extract skills, projects, and work experience directly into your live skill graph to personalize Interview Prep and Course Recommendations.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActivePage('resume')}
                        className="btn-primary text-xs px-6 py-3 font-semibold whitespace-nowrap shadow-lg flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" /> Upload Resume →
                      </button>
                    </motion.div>
                  )}
                </div>
              </section>

              {/* Features */}
              <section className="py-24 px-8 max-w-6xl mx-auto relative z-10">
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] rounded-3xl -z-10 mt-12 mb-12 border border-white/5"></div>
                
                {/* Eyebrow Label */}
                <div className="flex flex-col items-center mb-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 font-mono text-[10px] uppercase tracking-widest font-bold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>// CORE_CAPABILITIES</span>
                  </div>
                </div>

                <h2 className="text-center mb-16 drop-shadow-lg flex flex-wrap items-center justify-center gap-x-2.5"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-0.02em' }}>
                  {renderDecryptText("Built for", "text-white")}
                  {renderDecryptText("Real Learning", "gradient-text drop-shadow-xl")}
                </h2>
                <FeatureCards />
              </section>

              {/* Agents */}
              <section className="py-24 px-8 relative" style={{ background: 'rgba(0,0,0,0.6)' }}>
                <div className="max-w-6xl mx-auto">
                  
                  {/* Eyebrow Label */}
                  <div className="flex flex-col items-center mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-orange-500/5 border border-orange-500/10 text-orange-400 font-mono text-[10px] uppercase tracking-widest font-bold">
                      <Bot className="w-3.5 h-3.5" />
                      <span>// AGENT_ROSTER</span>
                    </div>
                  </div>

                  <h2 className="text-center mb-16 drop-shadow-lg flex flex-wrap items-center justify-center gap-x-2.5"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.5rem)', letterSpacing: '-0.02em' }}>
                    {renderDecryptText("Meet Your", "text-white")}
                    {renderDecryptText("AI Team", "gradient-text drop-shadow-xl")}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 exclude-magic">
                    {AGENTS.map((agent, i) => {
                      const agentStyles = {
                        teacher: { hoverBorder: 'hover:border-orange-500/50', hoverGlow: 'hover:shadow-[0_0_25px_rgba(249,115,22,0.4)]', focusRing: 'focus-visible:ring-orange-500/60' },
                        reviewer: { hoverBorder: 'hover:border-blue-500/50', hoverGlow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]', focusRing: 'focus-visible:ring-blue-500/60' },
                        debugger: { hoverBorder: 'hover:border-purple-500/50', hoverGlow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]', focusRing: 'focus-visible:ring-purple-500/60' },
                        zara: { hoverBorder: 'hover:border-violet-600/50', hoverGlow: 'hover:shadow-[0_0_25px_rgba(124,58,237,0.4)]', focusRing: 'focus-visible:ring-violet-600/60' }
                      };
                      const style = agentStyles[agent.id] || agentStyles.teacher;
                      return (
                        <motion.div key={agent.id}
                          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                          transition={{ delay: i * 0.15 }}
                          whileHover={prefersReducedMotion ? {} : { y: -8, scale: 1.02 }}
                          className={`p-8 text-center cursor-pointer group bg-[#0c0d14] border border-white/10 rounded-2xl transition-all duration-300 ${style.hoverBorder} ${style.hoverGlow} ${style.focusRing} focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black outline-none`}
                          onClick={() => { if (agent.id === 'zara') setActivePage('zara'); else { setActiveAgent(agent.id); setActivePage('studio') } }}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              if (agent.id === 'zara') setActivePage('zara');
                              else { setActiveAgent(agent.id); setActivePage('studio') }
                            }
                          }}
                        >
                          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center text-4xl mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                            {agent.emoji}
                          </div>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.25rem' }}>{agent.label}</h3>
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#FF6B35', marginBottom: '1rem' }}>{agent.desc}</p>
                          <p className="text-white/60 text-sm leading-relaxed">
                            {agent.id === 'teacher' && 'Socratic method — builds true understanding through guided questioning.'}
                            {agent.id === 'reviewer' && 'Real-time code analysis — bugs, style, performance, best practices.'}
                            {agent.id === 'debugger' && 'Systematic debugging — find root causes, not just symptoms.'}
                            {agent.id === 'zara' && 'Real-world problem challenger — scores your answers and updates your skill graph live.'}
                          </p>
                          <div className="mt-6 pt-6 border-t border-white/10">
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FF6B35' }}>
                              {agent.id === 'zara' ? 'Take a Challenge →' : `Chat with ${agent.label} →`}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* CTA */}
              <section className="py-24 px-8 text-center relative z-10">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm -z-10"></div>
                <div className="max-w-3xl mx-auto">
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                    className="glass-card p-12 border border-orange-500/30 bg-black/40 shadow-2xl">
                    <div className="text-5xl mb-6 drop-shadow-lg">🎯</div>
                    <h2 className="drop-shadow-lg" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,3rem)', letterSpacing: '-0.02em', marginBottom: '1rem' }}>
                      Ready to Level Up?
                    </h2>
                    <p className="text-white/70 font-medium mb-8 text-lg drop-shadow-md">Start your first session — completely free.</p>
                    <motion.button
                      whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActivePage('studio')}
                      className="px-12 py-5 font-mono uppercase tracking-wider text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:shadow-[0_0_35px_rgba(249,115,22,0.6)] focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black outline-none flex items-center justify-center gap-2 mx-auto"
                    >
                      [ Launch Code Obsidian ]
                    </motion.button>
                  </motion.div>
                </div>
              </section>

              <footer className="border-t border-white/10 py-8 px-8 text-center">
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)' }}>
                  Code Obsidian · Anthropic Hackathon 2026 · Claude Sonnet 4 + AWS Bedrock
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.1)', marginTop: '0.25rem' }}>
                  Press Space to drop light · Click canvas to add new light
                </p>
              </footer>
            </motion.div>
          )}

          {/* RESUME PROFILE */}
          {activePage === 'resume' && (
            <motion.div key="resume" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <ResumeUpload
                currentUser={currentUser}
                resumeProfile={resumeProfile}
                setResumeProfile={setResumeProfile}
                skills={skills}
                updateSkills={updateSkills}
                setSkills={setSkills}
              />
            </motion.div>
          )}

          {/* INTERVIEW PREP */}
          {activePage === 'interview' && (
            <motion.div key="interview" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <InterviewPrep
                currentUser={currentUser}
                skills={skills}
                updateSkills={updateSkills}
                resumeProfile={resumeProfile}
              />
            </motion.div>
          )}

          {/* RECOMMENDED COURSES */}
          {activePage === 'courses' && (
            <motion.div key="courses" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <CourseRecommender
                skills={skills}
                resumeProfile={resumeProfile}
              />
            </motion.div>
          )}

          {/* AI STUDIO */}
          {activePage === 'studio' && (
            <motion.div key="studio" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="h-screen flex flex-col exclude-magic">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
                <div className="flex items-center gap-4">
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>AI Studio</span>
                  {trackContext && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                      <span className="text-orange-400 font-semibold">📍 {trackContext.trackTitle}</span>
                      <span className="text-white/40">→ {trackContext.milestoneTitle}</span>
                      <button onClick={() => setTrackContext(null)} className="text-white/30 hover:text-white ml-1">×</button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {AGENTS.filter(a => a.id !== 'zara').map(a => (
                      <motion.button key={a.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveAgent(a.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 ${activeAgent === a.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                        style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.08em' }}>
                        {a.emoji} {a.label}
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs border ${learningMode === 'strict' ? 'bg-red-500/20 text-red-400 border-red-500/30' : learningMode === 'guided' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}
                    style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {learningMode === 'strict' ? '🔒 Strict' : learningMode === 'guided' ? '💡 Guided' : '📖 Review'}
                  </div>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-white/40" style={{ fontFamily: 'var(--font-mono)' }}>Live</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-white/10 flex flex-col min-h-[50%] md:min-h-0">
                  <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2 bg-black/20 flex-shrink-0"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>
                    <div className="flex gap-1.5">
                      {['bg-red-500', 'bg-yellow-500', 'bg-green-500'].map(c => <div key={c} className={`w-3 h-3 rounded-full ${c} opacity-70`} />)}
                    </div>
                    <span className="ml-2">{trackContext ? `${trackContext.milestoneTitle} — Starter Code` : 'main.py — Monaco Editor'}</span>
                  </div>
                  <div className="flex-1">
                    <Suspense fallback={<div className="flex items-center justify-center h-full text-white/40 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>Loading editor...</div>}>
                      <CodeEditor agentId={activeAgent} sessionId={sessionId} initialCode={trackContext?.starterCode} initialLang={trackContext?.langId} />
                    </Suspense>
                  </div>
                </div>
                <div className="w-full md:w-1/2 flex flex-col min-h-[50%] md:min-h-0">
                  <AgentChat
                    key={`${activeAgent}-${trackContext?.milestoneTitle || 'default'}`}
                    agentId={activeAgent} sessionId={sessionId} learningMode={learningMode}
                    currentUser={currentUser}
                    onSkillUpdate={updateSkills} currentSkills={skills}
                    initialMessage={trackContext && !trackMsgSent.current ? trackContext.teacherPrompt : null}
                    onInitialMessageSent={() => { trackMsgSent.current = true }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* PLAYGROUND */}
          {activePage === 'playground' && (
            <motion.div key="playground" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="h-screen flex flex-col exclude-magic">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)' }}>
                <div>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.01em' }}>
                    Code <span className="gradient-text">Playground</span>
                  </h1>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                    Python · C++ · JavaScript · Java · C · PHP
                  </p>
                </div>
                <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Judge0 Execution
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <PlaygroundEditor onAskAgent={() => setActivePage('studio')} onSkillUpdate={updateSkills} currentSkills={skills} currentUser={currentUser} learningMode={learningMode} />
              </div>
            </motion.div>
          )}

          {/* ZARA */}
          {activePage === 'zara' && (
            <motion.div key="zara" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="h-screen flex flex-col exclude-magic">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0"
                style={{ background: 'rgba(168,85,247,0.08)', backdropFilter: 'blur(20px)' }}>
                <div>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>
                    Zara <span style={{ background: 'linear-gradient(135deg,#a78bfa,#f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>⚡ The Examiner</span>
                  </h1>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                    Real-world problems · Scored answers · Live skill updates
                  </p>
                </div>
                <div className="flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(167,139,250,0.7)' }}>
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  Challenge Mode
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ZaraExaminer onSkillUpdate={updateSkills} currentSkills={skills} />
              </div>
            </motion.div>
          )}

          {/* SKILL TRACK */}
          {activePage === 'skill-track' && (
            <motion.div key="skill-track" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <SkillTrack skills={skills} onSkillUpdate={updateSkills} currentUser={currentUser} resumeProfile={resumeProfile} />
            </motion.div>
          )}

          {/* LEARNING TRACKS */}
          {activePage === 'tracks' && (
            <motion.div key="tracks" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="p-8">
              <div className="mb-8">
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(2rem,4vw,3rem)', letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                  Learning <span className="gradient-text">Tracks</span>
                </h1>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                  Search any topic · AI-generated courses · learn & get certified
                </p>
              </div>
              <LearningTracks skills={skills} onStartCourse={handleStartCourse} />
            </motion.div>
          )}

          {/* COURSE VIEWER */}
          {activePage === 'course' && activeCourse && (
            <motion.div key="course" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="h-screen exclude-magic">
              <CourseViewer
                course={activeCourse}
                onBack={() => setActivePage('tracks')}
                onTakeExam={handleTakeExam}
                onSkillUpdate={updateSkills}
              />
            </motion.div>
          )}

          {/* COURSE EXAM */}
          {activePage === 'course-exam' && activeCourse && (
            <motion.div key="course-exam" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="h-screen exclude-magic">
              <CourseExam
                course={activeCourse}
                onBack={() => { setActivePage('course') }}
                onComplete={handleExamComplete}
                onSkillUpdate={updateSkills}
              />
            </motion.div>
          )}

          {/* CYBER LAB */}
          {activePage === 'cyberlab' && (
            <motion.div key="cyberlab" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="h-screen exclude-magic">
              <CyberLab currentUser={currentUser} onSkillUpdate={updateSkills} skills={skills} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
      {/* ── Top Right Hover-Activated Slide-Out Toolbar ─────────────────────── */}
      <div
        className="fixed top-4 right-4 z-50 flex items-center"
        onMouseEnter={() => setTopControlsHovered(true)}
        onMouseLeave={() => setTopControlsHovered(false)}
      >
        <AnimatePresence mode="wait">
          {topControlsHovered ? (
            <motion.div
              key="expanded-toolbar"
              initial={{ opacity: 0, x: 25, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 25, scale: 0.95 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="flex items-center gap-3 p-2 rounded-2xl border border-cyan-500/30 bg-[#0a0a10]/90 backdrop-blur-xl shadow-[0_0_30px_rgba(0,212,255,0.25)]"
            >
              {/* Theme toggle button */}
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 hover:border-cyan-500/40 text-xs font-mono transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}
              >
                <span>{theme === 'dark' ? '🌞' : '🌙'}</span>
                <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
              </motion.button>

              {/* Profile / Username badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-xs font-mono text-purple-300">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                {currentUser}
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 hover:border-red-500/30 text-xs font-mono text-white/50 hover:text-red-300 transition-all border border-white/10"
              >
                Logout
              </button>

              {/* Dashboard toggle button */}
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setDashboardOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-green-500/30 bg-green-500/10 text-xs font-mono text-green-300 shadow-md hover:bg-green-500/20 transition-all"
              >
                <span>📊</span>
                <span>Dashboard</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed-pill"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-[#0a0a10]/80 backdrop-blur-xl shadow-[0_0_15px_rgba(0,212,255,0.15)] cursor-pointer hover:border-cyan-400 group transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono text-cyan-300 font-bold tracking-wider group-hover:text-white transition-colors">
                ⚙️ {currentUser}
              </span>
              <span className="text-[10px] text-cyan-400/60 font-mono">◄</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SlidingDashboard
        skills={skills}
        isOpen={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
        onNavigate={(page) => { setActivePage(page); setDashboardOpen(false) }}
      />
    </div>
  )
}