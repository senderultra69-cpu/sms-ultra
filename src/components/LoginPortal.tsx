import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SmsUser } from '../types';
import { LogIn, Eye, EyeOff, ShieldCheck, Mail, Lock, Info, Sparkles } from 'lucide-react';

interface LoginPortalProps {
  users: SmsUser[];
  onLoginSuccess: (userId: string) => void;
}

export default function LoginPortal({ users, onLoginSuccess }: LoginPortalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'typing' | 'sad' | 'success'>('idle');
  const [errorText, setErrorText] = useState('');
  const [revealHelper, setRevealHelper] = useState(false);

  // Focus and eye movement tracker based on input length
  const [typingOffset, setTypingOffset] = useState(0);

  useEffect(() => {
    if (status === 'typing') {
      const length = Math.min(email.length, 30);
      setTypingOffset((length - 15) * 0.4); // moves eyes left & right
    } else {
      setTypingOffset(0);
    }
  }, [email, status]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (status !== 'typing' && status !== 'success') {
      setStatus('typing');
    }
  };

  const handleInputFocus = () => {
    if (status !== 'success') {
      setStatus('typing');
    }
  };

  const handleInputBlur = () => {
    if (status === 'typing') {
      setStatus('idle');
    }
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorText('');

    const targetUser = users.find(
      u => u.email.trim().toLowerCase() === email.trim().toLowerCase() && u.password === password
    );

    if (targetUser) {
      if (!targetUser.isActive) {
        setStatus('sad');
        setErrorText('This user account has been disabled by the system admin.');
        return;
      }

      // Success sequence
      setStatus('success');
      
      // Delay to let the beautiful door animation complete
      setTimeout(() => {
        onLoginSuccess(targetUser.id);
      }, 2500);

    } else {
      // Failed trigger: rabbit cries and gets emotional
      setStatus('sad');
      setErrorText('Incorrect email address or security key! Try again.');
      
      // Flash back to idle after user is done feeling remorseful
      setTimeout(() => {
        setStatus('idle');
      }, 5000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none select-none font-sans">
      
      {/* 3D background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/40 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-10%] w-[550px] h-[550px] rounded-full bg-violet-950/50 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[120px] h-[120px] rounded-full bg-emerald-950/30 blur-[60px] pointer-events-none" />

      {/* Header Labeling */}
      <div className="text-center z-10 mb-4 max-w-sm">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-indigo-950/80 border border-indigo-500/30 px-3 py-1.5 rounded-full mb-3"
        >
          <Sparkles size={13} className="text-indigo-400" />
          <span className="text-[10px] text-indigo-200 uppercase font-black tracking-widest">Ultra 3D Interactive Hub</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-2xl font-black text-white tracking-tight"
        >
          Ultra Sender Portal
        </motion.h1>
        <p className="text-[11px] text-slate-400 mt-1 leading-normal">
          Log in with your corporate credential key to access high density templates and Easy Send gateways.
        </p>
      </div>

      {/* Main card stage */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="w-full max-w-md bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-20"
      >
        
        {/* INTERACTIVE RABBIT STAGE */}
        <div className="w-full flex justify-center h-44 relative mb-4">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              /* Success cinematic: Rabbit walking to the 3D door and opening it */
              <motion.div
                key="rabbit-success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="w-full h-full flex flex-col items-center justify-center relative"
              >
                {/* 3D Isometric Wooden Door */}
                <div className="relative w-32 h-40 mt-1">
                  {/* Glowing door frame */}
                  <motion.div 
                    animate={{ 
                      boxShadow: ["0 0 10px #7c3aed, 0 0 20px #7c3aed", "0 0 30px #7c3aed, 0 0 45px #3b82f6", "0 0 10px #7c3aed, 0 0 20px #7c3aed"]
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 bg-violet-600 rounded-t-2xl border-4 border-violet-400 overflow-hidden"
                  />
                  
                  {/* Inside light (visible when opening) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-amber-200 via-indigo-500 to-indigo-900 flex flex-col justify-center items-center">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="text-white font-extrabold text-[10px] uppercase text-center tracking-wider max-w-[60px]"
                    >
                      Entering ultra ...
                    </motion.div>
                  </div>

                  {/* Wood Door slab swinging open */}
                  <motion.div
                    initial={{ rotateY: 0, originX: 0 }}
                    animate={{ rotateY: -115 }}
                    transition={{ delay: 0.6, duration: 1.5, ease: 'easeOut' }}
                    className="absolute inset-0 bg-amber-800 border-2 border-amber-900 rounded-t-xl flex flex-col justify-center items-end pr-2 shadow-2xl z-10 origin-left"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {/* Golden Handle knob */}
                    <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600 shadow-md mr-1 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-white/70" />
                    </div>
                    {/* Panels */}
                    <div className="w-6 h-12 border border-amber-900/60 rounded-md mt-2 mx-1 opacity-40"></div>
                    <div className="w-6 h-12 border border-amber-900/60 rounded-md mt-1 mx-1 opacity-40"></div>
                  </motion.div>
                </div>

                {/* Little hopping rabbit going into the door */}
                <motion.div
                  initial={{ x: -100, y: 25, scale: 0.4, opacity: 0.9 }}
                  animate={{ 
                    x: [null, -60, -20, 5], 
                    y: [null, 15, 23, 10],
                    scale: [null, 0.45, 0.35, 0.2],
                    opacity: [null, 1, 0.8, 0]
                  }}
                  transition={{
                    duration: 1.8,
                    times: [0, 0.3, 0.7, 1],
                    ease: 'easeInOut'
                  }}
                  className="absolute z-20"
                >
                  {/* Simple rear rabbit / tail */}
                  <div className="w-12 h-12 bg-white rounded-full relative flex items-center justify-center">
                    {/* Tail */}
                    <div className="w-4 h-4 bg-slate-100 rounded-full absolute -bottom-1 left-4" />
                    {/* Ear tracks */}
                    <div className="w-3 h-8 bg-white border border-pink-100 rounded-full absolute -top-5 left-2 transform -rotate-12" />
                    <div className="w-3 h-8 bg-white border border-pink-100 rounded-full absolute -top-5 left-6 transform rotate-12" />
                    <div className="text-[7px] text-slate-500 font-extrabold rotate-12">IN!</div>
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              /* Regular animated interactive rabbit mascot */
              <motion.div
                key="rabbit-mascot"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-44 h-44 relative flex items-center justify-center flex-col"
              >
                {/* Background Shadow Ring */}
                <div className="absolute w-28 h-6 bg-black/40 rounded-full bottom-2 filter blur-md" />

                {/* RABBIT HEAD / CONSTRUCT */}
                <div className="w-28 h-26 bg-gradient-to-b from-white to-slate-100 rounded-[50%_50%_45%_45%] relative border border-white/50 shadow-lg flex flex-col justify-between p-1">
                  
                  {/* EAR LEFT */}
                  <motion.div
                    animate={
                      status === 'sad'
                        ? { rotate: 55, y: 15, x: -12 } // droops down sadly
                        : { rotate: [0, -3, 3, 0], y: 0 } // happy ears move
                    }
                    transition={{
                      repeat: status === 'sad' ? 0 : Infinity,
                      repeatType: 'reverse',
                      duration: 2.2
                    }}
                    className="w-6 h-18 bg-white rounded-full absolute left-4 -top-14 border-l border-r border-slate-100 origin-bottom flex items-center justify-center p-0.5 shadow-xs"
                  >
                    <div className="w-3.5 h-15 bg-pink-100 rounded-full" />
                  </motion.div>

                  {/* EAR RIGHT */}
                  <motion.div
                    animate={
                      status === 'sad'
                        ? { rotate: -55, y: 15, x: 12 } // droops down sadly
                        : { rotate: [0, 4, -4, 0], y: 0 }
                    }
                    transition={{
                      repeat: status === 'sad' ? 0 : Infinity,
                      repeatType: 'reverse',
                      duration: 1.8
                    }}
                    className="w-6 h-18 bg-white rounded-full absolute right-4 -top-14 border-l border-r border-slate-100 origin-bottom flex items-center justify-center p-0.5 shadow-xs"
                  >
                    <div className="w-3.5 h-15 bg-pink-100 rounded-full" />
                  </motion.div>

                  {/* FACE FEATURES BOX */}
                  <div className="flex-1 w-full relative pt-5 px-3">
                    
                    {/* TEARS DROPPING ANIMS (Visible if sad status) */}
                    {status === 'sad' && (
                      <>
                        {/* Tear L */}
                        <motion.div
                          animate={{ y: [0, 40], opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeIn' }}
                          className="absolute w-2.5 h-3 bg-cyan-300 rounded-tr-full rounded-b-full left-5 top-10 shadow-xs"
                        />
                        {/* Tear R */}
                        <motion.div
                          animate={{ y: [0, 35], opacity: [1, 0] }}
                          transition={{ repeat: Infinity, duration: 1.4, ease: 'easeIn', delay: 0.3 }}
                          className="absolute w-2.5 h-3 bg-cyan-300 rounded-tl-full rounded-b-full right-5 top-10 shadow-xs"
                        />
                      </>
                    )}

                    {/* EYES CONTAINER */}
                    <div className="flex justify-between px-2">
                      
                      {/* Left Eye */}
                      <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
                        {status === 'sad' ? (
                          /* Sad squint eyes */
                          <div className="absolute w-8 h-4 bg-white top-3 rounded-full border border-pink-200" />
                        ) : (
                          /* Interactive moving pupil eye */
                          <motion.div
                            animate={{ x: typingOffset, y: status === 'typing' ? 2 : 0 }}
                            className="w-3.5 h-3.5 rounded-full bg-black flex items-start justify-end p-0.5 relative"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            <div className="w-0.5 h-0.5 rounded-full bg-white absolute bottom-0.5 left-0.5" />
                          </motion.div>
                        )}
                      </div>

                      {/* Right Eye */}
                      <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
                        {status === 'sad' ? (
                          /* Sad squint eyes */
                          <div className="absolute w-8 h-4 bg-white top-3 rounded-full border border-pink-200" />
                        ) : (
                          /* Interactive moving pupil eye */
                          <motion.div
                            animate={{ x: typingOffset, y: status === 'typing' ? 2 : 0 }}
                            className="w-3.5 h-3.5 rounded-full bg-black flex items-start justify-end p-0.5 relative"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            <div className="w-0.5 h-0.5 rounded-full bg-white absolute bottom-0.5 left-0.5" />
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* BLUSH CHEEKS */}
                    <div className="flex justify-between px-1 mt-1">
                      <div className="w-4 h-2 rounded-full bg-pink-350/80 saturate-150 opacity-80" />
                      <div className="w-4 h-2 rounded-full bg-pink-350/80 saturate-150 opacity-80" />
                    </div>

                    {/* NOSE AND MOUTH COLUMN */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 top-11 flex flex-col items-center">
                      {/* Nose */}
                      <div className="w-3 h-2 bg-pink-400 rounded-b-full" />
                      
                      {/* Mouth curves */}
                      <div className="relative h-4 mt-0.5">
                        {status === 'sad' ? (
                          /* Sad vibrating frown mouth */
                          <motion.div
                            animate={{ x: [-0.5, 0.5, -0.5, 0] }}
                            transition={{ repeat: Infinity, duration: 0.1 }}
                            className="w-5 h-2.5 border-t-2 border-slate-700/80 rounded-t-full"
                          />
                        ) : status === 'typing' ? (
                          /* Small curious typing mouth */
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                        ) : (
                          /* Normal happy rabbit mouth w-shape */
                          <div className="flex">
                            <div className="w-3 h-3.5 border-b-2 border-r border-slate-600 rounded-b-md" />
                            <div className="w-3 h-3.5 border-b-2 border-l border-slate-600 rounded-b-md" />
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Simple soft paws covering cheeks if extremely sad */}
                  {status === 'sad' && (
                    <motion.div
                      initial={{ y: 15 }}
                      animate={{ y: [15, 0, 15] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute bottom-1 w-full flex justify-between px-2"
                    >
                      <div className="w-5 h-5 bg-white border border-pink-100 rounded-full" />
                      <div className="w-5 h-5 bg-white border border-pink-100 rounded-full" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action feedback info text */}
        <div className="text-center h-4 flex items-center justify-center mb-4">
          <AnimatePresence mode="wait">
            {status === 'sad' ? (
              <motion.span
                key="msg-sad"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-[11px] text-pink-300 font-extrabold flex items-center gap-1 bg-red-950/40 px-3 py-1 rounded-full border border-red-900/40"
              >
                😭 Bun-Bun got emotional! Please input valid keys.
              </motion.span>
            ) : status === 'success' ? (
              <motion.span
                key="msg-success"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11.5px] text-emerald-300 font-extrabold flex items-center gap-1 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-900/40"
              >
                🚪 Door open! Logged in successfully.
              </motion.span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">
                {status === 'typing' ? 'Rabbit is watching keys...' : 'Rabbit is happy & waiting'}
              </span>
            )}
          </AnimatePresence>
        </div>

        {/* Real Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4 font-sans mt-2">
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 text-slate-300">
              <Mail size={11} className="text-indigo-400" /> Account Registered Email
            </label>
            <div className="relative">
              <input
                type="email"
                required
                disabled={status === 'success'}
                value={email}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="e.g. senderultra69@gmail.com"
                className="w-full text-xs text-slate-200 bg-slate-950/55 border border-white/10 rounded-xl py-3 pl-3 pr-4 outline-none focus:border-indigo-500 focus:bg-slate-950 font-mono transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 text-slate-300">
                <Lock size={11} className="text-indigo-400" /> Security Token password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                disabled={status === 'success'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Enter password"
                className="w-full text-xs text-slate-200 bg-slate-950/55 border border-white/10 rounded-xl py-3 pl-3 pr-10 outline-none focus:border-indigo-500 focus:bg-slate-950 font-mono transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {errorText && (
            <div className="p-3 bg-red-950/80 border border-red-800/50 rounded-xl text-red-200 text-[11px] leading-normal font-sans">
              ⚠️ {errorText}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'success'}
            className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 text-white font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 hover:from-indigo-500 hover:to-violet-500 transition-all select-none shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.45)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
          >
            <LogIn size={13} /> {status === 'success' ? 'Verifying Credentials...' : 'Unlocks Corporate Gateways'}
          </button>
        </form>

        {/* Corporate Gateway Secure Indicator */}
        <div className="mt-6 pt-2 text-center text-[10px] text-slate-500 font-mono flex justify-center items-center gap-1">
          <ShieldCheck size={11} className="text-emerald-500" /> 256-bit Secure Gateway
        </div>

      </motion.div>

      {/* Corporate Gateway Secure Indicator */}
      <div className="text-[10px] text-slate-600 font-mono mt-4 flex items-center gap-1.5 z-10 select-none">
        <ShieldCheck size={12} className="text-slate-500" /> Ultra Sender SSL Multi-User Security Isolated 2026
      </div>

    </div>
  );
}
