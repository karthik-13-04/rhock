"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAuthService } from '../../../services/admin/auth.service';
import { useAdminStore } from '../../../store/useAdminStore';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  ShieldCheck, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../../utils/cn';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const router = useRouter();
  const { login } = useAdminStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminAuthService.loginAdmin({ 
        email, 
        password
      });
      
      if (result.success) {
        login(result.user);
        router.push('/admin');
      }
    } catch (err) {
      setError(err || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#1A1A2E]"
      style={{
        '--admin-primary': '#1A5CA8',
        '--color-admin-primary': '#1A5CA8',
        '--admin-primary-soft': 'rgba(26, 92, 168, 0.1)',
        '--color-admin-primary-soft': 'rgba(26, 92, 168, 0.08)',
        '--admin-primary-glow': 'rgba(26, 92, 168, 0.43)',
        '--color-admin-primary-glow': 'rgba(26, 92, 168, 0.43)'
      }}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-60"
        style={{ backgroundImage: "url('/admin-bg.png')" }}
      />
      {/* Overlay to ensure readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#1A1A2E]/90 to-[#1A5CA8]/50 mix-blend-multiply" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center shadow-2xl shadow-black/40 mb-6">
            <ShieldCheck size={40} className="text-[#1A5CA8]" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            Rhock<span className="text-[#1A5CA8]">Admin</span>
          </h1>
          <p className="text-[#F3F6FB]/70 font-bold text-sm tracking-widest uppercase">
            Secure Infrastructure Gateway
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-[40px] p-10 border border-white/20 bg-white/10 backdrop-blur-3xl shadow-[0_32px_64px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#1A5CA8] to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          
          <form 
            onSubmit={handleLogin}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Identity Check</h2>
              <p className="text-white/60 text-sm font-medium">Enter your administrative credentials to continue.</p>
            </div>

            <div className="space-y-4">
              {/* Email Input */}
              <div className="relative group/input">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-white transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  placeholder="admin@hotelrockdale.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-black/20 border border-white/10 rounded-2xl text-white font-bold focus:ring-2 ring-[#1A5CA8]/50 outline-none transition-all placeholder:text-white/30 focus:border-[#1A5CA8]"
                />
              </div>

              {/* Password Input */}
              <div className="relative group/input">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within/input:text-white transition-colors" size={20} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-black/20 border border-white/10 rounded-2xl text-white font-bold focus:ring-2 ring-[#1A5CA8]/50 outline-none transition-all placeholder:text-white/30 focus:border-[#1A5CA8]"
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-[#F3F6FB] bg-red-500/80 p-4 rounded-xl border border-red-500/20 backdrop-blur-md"
                >
                  <AlertCircle size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">{error}</span>
                </motion.div>
              )}
            </div>

            <button 
              type="submit"
              disabled={isLoading || !email || password.length < 6}
              className="w-full py-5 bg-[#1A5CA8] hover:bg-[#1A5CA8]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#1A5CA8]/30 flex items-center justify-center gap-3 group"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : (
                <>
                  Initialize Access
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Info */}
        <p className="mt-10 text-center text-white/50 text-[10px] font-black uppercase tracking-[0.3em]">
          Restricted Area • Unauthorized Access Prohibited
        </p>
      </motion.div>
    </div>
  );
}
