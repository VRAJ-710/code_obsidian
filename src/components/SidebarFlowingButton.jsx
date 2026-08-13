import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function SidebarFlowingButton({
  item,
  isActive,
  onClick,
  sidebarCollapsed,
  prefersReducedMotion
}) {
  const text = item.label;
  const [displayText, setDisplayText] = useState(text);
  const [isHovered, setIsHovered] = useState(false);
  const scrambleIntervalRef = useRef(null);

  useEffect(() => {
    setDisplayText(text);
  }, [text]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (sidebarCollapsed || prefersReducedMotion) return;

    // Dynamic scramble decryption animation on hover
    if (scrambleIntervalRef.current) {
      clearInterval(scrambleIntervalRef.current);
    }
    const chars = '01XYZ$#@&%?[]';
    let iterations = 0;
    scrambleIntervalRef.current = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iterations) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );
      iterations += 0.55;
      if (iterations >= text.length) {
        clearInterval(scrambleIntervalRef.current);
        setDisplayText(text);
      }
    }, 25);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (scrambleIntervalRef.current) {
      clearInterval(scrambleIntervalRef.current);
    }
    setDisplayText(text);
  };

  useEffect(() => {
    return () => {
      if (scrambleIntervalRef.current) {
        clearInterval(scrambleIntervalRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      whileHover={prefersReducedMotion ? {} : { x: 6 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full"
    >
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-3 text-sm rounded-xl transition-all relative overflow-hidden outline-none ${
          isActive
            ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
            : 'text-white/50 border border-transparent hover:bg-white/8 hover:text-white'
        }`}
        style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}
      >
        {/* Active/Hover line indicator on left edge */}
        <motion.div
          className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-md ${
            isActive ? 'bg-orange-500' : 'bg-orange-500/50'
          }`}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{
            scaleY: isActive || isHovered ? 1 : 0,
            opacity: isActive || isHovered ? 1 : 0
          }}
          transition={{ duration: 0.2 }}
        />

        {/* Lucide icon with hover spin */}
        <motion.span
          className="text-xl flex-shrink-0 z-10 inline-block pl-1"
          animate={isHovered && !prefersReducedMotion ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {item.icon}
        </motion.span>

        {/* Scrambled Text */}
        {!sidebarCollapsed && (
          <span className="z-10 font-bold uppercase tracking-wider text-[11px]">
            {displayText}
          </span>
        )}

        {/* Active dot */}
        {isActive && !sidebarCollapsed && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 z-10" />
        )}
      </button>
    </motion.div>
  );
}

export default SidebarFlowingButton;
