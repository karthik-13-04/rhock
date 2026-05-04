"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAuthService } from '../../../services/admin/auth.service';
import { useAdminStore } from '../../../store/useAdminStore';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { 
  ShieldCheck, 
  Smartphone, 
  Lock, 
  ArrowRight, 
  Loader2, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../../utils/cn';

export default function AdminLoginPage() {
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const router = useRouter();
  const { login } = useAdminStore();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await axios.post('/api/auth/send-otp', { mobileNumber: phone });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await adminAuthService.loginAdmin({ 
        mobileNumber: phone, 
        otp,
        role: 'admin'
      });
      
      if (result.success) {
        login(result.user);
        router.push('/admin');
      }
    } catch (err) {
      setError(err || 'Invalid OTP. Please try again.');
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
          
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form 
                key="step-phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOTP}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white tracking-tight">Identity Check</h2>
                  <p className="text-zinc-400 text-sm font-medium">Enter your registered mobile number to continue.</p>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-admin-primary transition-colors" size={20} />
                    <input 
                      type="tel" 
                      required
                      placeholder="91XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
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
                  disabled={isLoading || phone.length < 10}
                  className="w-full py-5 bg-admin-primary hover:bg-admin-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-admin-primary/20 flex items-center justify-center gap-3 group"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : (
                    <>
                      Send Access Key
                      <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="step-otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerifyOTP}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white tracking-tight">Verify Protocol</h2>
                  <p className="text-zinc-400 text-sm font-medium">Authentication key sent to <span className="text-admin-primary">+{phone}</span></p>
                </div>

                <div className="space-y-4">
                  <div className="relative group">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-admin-primary transition-colors" size={20} />
                    <input 
                      type="text" 
                      required
                      placeholder="4-Digit OTP"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-bold tracking-[1em] text-center focus:ring-4 ring-admin-primary/10 outline-none transition-all placeholder:text-zinc-600 focus:border-admin-primary/50 placeholder:tracking-normal"
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

                <div className="flex flex-col gap-4">
                  <button 
                    type="submit"
                    disabled={isLoading || otp.length < 4}
                    className="w-full py-5 bg-white text-zinc-950 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-3 group"
                  >
                    {isLoading ? <Loader2 size={20} className="animate-spin text-zinc-950" /> : (
                      <>
                        Initialize Access
                        <ShieldCheck size={20} />
                      </>
                    )}
                  </button>
                  
                  <button 
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="text-zinc-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    Change Identity
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Info */}
        <p className="mt-10 text-center text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">
          Restricted Area • Unauthorized Access Prohibited
        </p>
      </motion.div>
    </div>
  );
}
