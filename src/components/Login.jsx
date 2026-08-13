import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DotField from './DotField';
import { dbService } from '../dbService';
import { User, Lock } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');

        if (!username.trim() || !password.trim()) {
            setError('Fields cannot be empty.');
            return;
        }

        setIsLoading(true);

        try {
            if (isLogin) {
                // Login Flow
                const data = await dbService.login(username, password);
                if (data.success) {
                    localStorage.setItem('code_obsidian_current_user', username);
                    if (onLoginSuccess) onLoginSuccess(username);
                }
            } else {
                // Register Flow
                const data = await dbService.register(username, password);
                if (data.success) {
                    setSuccessMsg('Account created! You can now log in.');
                    setIsLogin(true); // Switch back to login
                    setPassword(''); // clear password for safety
                }
            }
        } catch (err) {
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#070709] font-sans selection:bg-purple-500/30">

            {/* 1. DotField Background */}
            <div className="absolute inset-0 z-0">
                <DotField
                    dotRadius={1.5}
                    dotSpacing={14}
                    bulgeStrength={67}
                    glowRadius={160}
                    sparkle={false}
                    waveAmplitude={0}
                    cursorRadius={500}
                    cursorForce={0.1}
                    bulgeOnly
                    gradientFrom="#A855F7"
                    gradientTo="#B497CF"
                    glowColor="#120F17"
                />
            </div>

            {/* 2. Main Glass Auth Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-[420px] mx-4"
            >
                <div className="backdrop-blur-2xl bg-black/50 border border-white/10 rounded-[2rem] p-10 shadow-[0_0_50px_rgba(168,85,247,0.15)] overflow-hidden">

                    {/* Top glowing accent */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

                    {/* Brand Logo/Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-75 transition-all duration-500" />
                            <div className="relative w-14 h-14 rounded-2xl bg-[#0d0d12]/95 border border-white/15 flex items-center justify-center shadow-inner">
                                <svg className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <polygon points="12 2 2 12 12 22 22 12" className="fill-purple-500/10" />
                                    <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="3 3" />
                                    <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="3 3" />
                                    <circle cx="12" cy="12" r="3" className="fill-purple-500 stroke-purple-300" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-display font-bold text-white tracking-tight mb-2">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h1>
                        <p className="text-white/40 text-sm font-mono">
                            {isLogin ? 'Enter your credentials to continue.' : 'Register a new mock presence.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-mono text-white/50 uppercase tracking-widest pl-1">
                                Username
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-white/30">
                                    <User className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="off"
                                    spellCheck="false"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-mono text-sm"
                                    placeholder="dragon_slayer_99"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center pl-1">
                                <label className="text-[11px] font-mono text-white/50 uppercase tracking-widest">
                                    Password
                                </label>
                                {isLogin && <a href="#" className="text-[11px] font-mono text-purple-400 hover:text-purple-300 transition-colors">Forgot?</a>}
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-white/30">
                                    <Lock className="w-4 h-4" />
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all font-mono text-sm tracking-widest"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Error / Success Messages */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-red-400 text-xs font-mono bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                                >
                                    {error}
                                </motion.div>
                            )}
                            {successMsg && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-green-400 text-xs font-mono bg-green-500/10 border border-green-500/20 rounded-lg p-3"
                                >
                                    {successMsg}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            className="w-full relative group overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 transition-all hover:opacity-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span className="font-mono text-sm tracking-widest uppercase">{isLogin ? 'Authenticating' : 'Registering'}</span>
                                </div>
                            ) : (
                                <span className="font-mono text-sm tracking-widest uppercase">{isLogin ? 'Login' : 'Sign Up'}</span>
                            )}
                        </motion.button>
                    </form>

                    {/* Toggle Register / Login */}
                    <div className="mt-8 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                                setSuccessMsg('');
                            }}
                            className="text-sm font-medium text-white/50 hover:text-white transition-colors"
                        >
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <span className="text-purple-400 border-b border-transparent hover:border-purple-400 transition-colors pb-0.5 font-semibold">
                                {isLogin ? "Register" : "Login"}
                            </span>
                        </button>
                    </div>

                </div>
            </motion.div>
        </div>
    );
}
