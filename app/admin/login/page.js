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
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-admin-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-admin-secondary/20 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-admin-primary flex items-center justify-center shadow-2xl shadow-admin-primary/40 mb-6">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mb-2">
            Rhock<span className="text-admin-primary">Admin</span>
          </h1>
          <p className="text-zinc-500 font-bold text-sm tracking-widest uppercase">
            Secure Infrastructure Gateway
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-[40px] p-10 border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-admin-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <form 
            onSubmit={handleLogin}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Identity Check</h2>
              <p className="text-zinc-400 text-sm font-medium">Enter your administrative credentials to continue.</p>
            </div>

            <div className="space-y-4">
              {/* Email Input */}
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-admin-primary transition-colors" size={20} />
                <input 
                  type="email" 
                  required
                  placeholder="admin@hotelrockdale.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:ring-4 ring-admin-primary/10 outline-none transition-all placeholder:text-zinc-600 focus:border-admin-primary/50"
                />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-admin-primary transition-colors" size={20} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold focus:ring-4 ring-admin-primary/10 outline-none transition-all placeholder:text-zinc-600 focus:border-admin-primary/50"
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20"
                >
                  <AlertCircle size={16} />
                  <span className="text-xs font-bold uppercase tracking-widest">{error}</span>
                </motion.div>
              )}
            </div>

            <button 
              type="submit"
              disabled={isLoading || !email || password.length < 6}
              className="w-full py-5 bg-admin-primary hover:bg-admin-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-admin-primary/20 flex items-center justify-center gap-3 group"
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
        <p className="mt-10 text-center text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">
          Restricted Area • Unauthorized Access Prohibited
        </p>
      </motion.div>
    </div>
  );
}
