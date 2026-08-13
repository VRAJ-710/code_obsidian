import { motion } from 'framer-motion';
import { Brain, Search, Bug, TrendingUp, Zap, Lock } from 'lucide-react';
import SpotlightCard from './SpotlightCard';

const features = [
  {
    icon: <Brain className="w-6 h-6 text-orange-400" />,
    title: 'Socratic Method',
    description: 'Sage never just gives you answers. She asks guiding questions that build real, lasting understanding of programming concepts.',
    spotlightColor: 'rgba(255, 107, 53, 0.2)',
    hoverBorder: 'hover:border-orange-500/50',
    hoverGlow: 'hover:shadow-[0_0_25px_rgba(249,115,22,0.4)]',
    cornerBorder: 'border-orange-500',
    badgeBorder: 'border-orange-500/20 group-hover:border-orange-500/60',
    focusRing: 'focus-visible:ring-orange-500/60',
  },
  {
    icon: <Search className="w-6 h-6 text-blue-400" />,
    title: 'Real-Time Code Review',
    description: "Aria analyzes your code as you write it — catching bugs, suggesting improvements, and explaining best practices in plain English.",
    spotlightColor: 'rgba(59, 130, 246, 0.2)',
    hoverBorder: 'hover:border-blue-500/50',
    hoverGlow: 'hover:shadow-[0_0_25px_rgba(59,130,246,0.4)]',
    cornerBorder: 'border-blue-500',
    badgeBorder: 'border-blue-500/20 group-hover:border-blue-500/60',
    focusRing: 'focus-visible:ring-blue-500/60',
  },
  {
    icon: <Bug className="w-6 h-6 text-purple-400" />,
    title: 'Debugging Coach',
    description: 'Rex teaches you systematic debugging methodology. Find root causes, not just symptoms. Build intuition that lasts.',
    spotlightColor: 'rgba(168, 85, 247, 0.2)',
    hoverBorder: 'hover:border-purple-500/50',
    hoverGlow: 'hover:shadow-[0_0_25px_rgba(168,85,247,0.4)]',
    cornerBorder: 'border-purple-500',
    badgeBorder: 'border-purple-500/20 group-hover:border-purple-500/60',
    focusRing: 'focus-visible:ring-purple-500/60',
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-green-400" />,
    title: 'Progress Tracking',
    description: 'Sessions stored in DynamoDB. Track what you\'ve learned, revisit past conversations, see your skill growth over time.',
    spotlightColor: 'rgba(34, 197, 94, 0.2)',
    hoverBorder: 'hover:border-green-500/50',
    hoverGlow: 'hover:shadow-[0_0_25px_rgba(34,197,94,0.4)]',
    cornerBorder: 'border-green-500',
    badgeBorder: 'border-green-500/20 group-hover:border-green-500/60',
    focusRing: 'focus-visible:ring-green-500/60',
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    title: 'Multi-Agent Architecture',
    description: 'Three specialized AI agents built on Claude Sonnet 4 via AWS Bedrock. Each with unique personality and teaching style.',
    spotlightColor: 'rgba(234, 179, 8, 0.2)',
    hoverBorder: 'hover:border-yellow-500/50',
    hoverGlow: 'hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]',
    cornerBorder: 'border-yellow-500',
    badgeBorder: 'border-yellow-500/20 group-hover:border-yellow-500/60',
    focusRing: 'focus-visible:ring-yellow-500/60',
  },
  {
    icon: <Lock className="w-6 h-6 text-gray-400" />,
    title: 'Serverless & Scalable',
    description: 'Built on AWS Lambda + API Gateway. Zero server management. Scales from 1 to 1M students without any configuration.',
    spotlightColor: 'rgba(148, 163, 184, 0.2)',
    hoverBorder: 'hover:border-slate-500/50',
    hoverGlow: 'hover:shadow-[0_0_25px_rgba(148,163,184,0.4)]',
    cornerBorder: 'border-slate-500',
    badgeBorder: 'border-slate-500/20 group-hover:border-slate-500/60',
    focusRing: 'focus-visible:ring-slate-500/60',
  },
];

export default function FeatureCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
          className="flex"
        >
          <SpotlightCard
            spotlightColor={f.spotlightColor}
            className={`relative flex-1 p-6 bg-[#0c0d14] border border-white/10 group cursor-default transition-all duration-300 hover:-translate-y-1 ${f.hoverBorder} ${f.hoverGlow} ${f.focusRing} focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black outline-none rounded-2xl overflow-hidden`}
            tabIndex={0}
          >
            {/* Cyber Corner Bracket Accents */}
            <div className={`absolute top-0 left-0 w-2.5 h-2.5 border-t border-l ${f.cornerBorder} opacity-30 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className={`absolute top-0 right-0 w-2.5 h-2.5 border-t border-r ${f.cornerBorder} opacity-30 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className={`absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l ${f.cornerBorder} opacity-30 group-hover:opacity-100 transition-opacity duration-300`} />
            <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r ${f.cornerBorder} opacity-30 group-hover:opacity-100 transition-opacity duration-300`} />

            {/* Glowing Icon Badge */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-black/60 border ${f.badgeBorder} shadow-[0_0_10px_rgba(255,255,255,0.02)] transition-all duration-300 mb-4`}>
              {f.icon}
            </div>

            {/* Content */}
            <h3 className="font-mono text-xs uppercase tracking-wider text-white font-bold mb-2 flex items-center gap-1.5">
              <span>{f.title}</span>
            </h3>
            <p className="text-white/60 text-xs leading-relaxed font-sans">
              {f.description}
            </p>
          </SpotlightCard>
        </motion.div>
      ))}
    </div>
  );
}