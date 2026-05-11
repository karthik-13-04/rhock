"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { couponService } from '@/services/admin/coupon.service';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  ToggleLeft as Toggle, 
  Calendar, 
  Tag, 
  Store, 
  Link as LinkIcon, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Ticket,
  ChevronRight,
  Info,
  Shield,
  Layers,
  ExternalLink,
  X
} from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Premium Coupon Management Module
 * Redesigned for maximum clarity and administrative efficiency.
 */
export default function CouponsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    category: '',
    imageUrl: '',
    couponCode: '',
    isActive: true,
    order: 0,
    storeName: '',
    terms: '',
    ctaLink: '',
    expiryDate: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await couponService.list({ page: 1, limit: 100 });
      setItems(res.data || []);
    } catch (error) {
      console.error("Failed to load coupons:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await couponService.create(form);
      setForm({
        title: '',
        subtitle: '',
        category: '',
        imageUrl: '',
        couponCode: '',
        isActive: true,
        order: 0,
        storeName: '',
        terms: '',
        ctaLink: '',
        expiryDate: '',
      });
      setIsAdding(false);
      await load();
    } catch (error) {
      alert("Failed to create coupon. Please check all fields.");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await couponService.update(item._id, { isActive: !item.isActive });
      await load();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this coupon?")) return;
    try {
      await couponService.remove(id);
      await load();
    } catch (error) {
      alert("Failed to delete coupon");
    }
  };

  const filteredItems = items.filter(item => {
    if (activeTab === 'active') return item.isActive;
    if (activeTab === 'inactive') return !item.isActive;
    return true;
  });

  return (
    <div className="space-y-12 pb-24">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-admin-primary/5 rounded-full border border-admin-primary/10"
          >
            <Ticket size={14} className="text-admin-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-admin-primary">Reward Infrastructure</span>
          </motion.div>
          <h1 className="text-5xl font-black text-zinc-900 tracking-tighter">
            Coupon <span className="text-admin-primary italic">Architect</span>
          </h1>
          <p className="text-zinc-500 font-bold text-sm">
            Orchestrating <span className="text-zinc-900 font-black underline decoration-admin-primary/30 decoration-4">{items.length}</span> reward vectors for the user base
          </p>
        </div>
        
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-3 px-8 py-5 bg-zinc-900 text-white rounded-[28px] text-sm font-black uppercase tracking-[0.2em] hover:bg-admin-primary hover:shadow-2xl hover:shadow-admin-primary/30 transition-all w-full md:w-auto group"
        >
          {isAdding ? <X size={20} /> : <Plus size={20} className="group-hover:rotate-90 transition-transform" />}
          {isAdding ? "Cancel Creation" : "Forge New Coupon"}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={onCreate} className="glass-card rounded-[48px] border-white/60 p-10 bg-white/50 backdrop-blur-xl shadow-2xl space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Identity Group */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2 flex items-center gap-3">
                    <Info size={14} className="text-admin-primary" /> Core Identity
                  </h4>
                  <div className="space-y-4">
                    <div className="relative group">
                      <Tag size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-admin-primary transition-colors" />
                      <input 
                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent dark:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-900 dark:text-white focus:border-admin-primary/20 focus:bg-white dark:focus:bg-zinc-700 outline-none transition-all" 
                        placeholder="Coupon Title (e.g. 50% OFF)" 
                        value={form.title} 
                        onChange={(e) => setForm({ ...form, title: e.target.value })} 
                        required 
                      />
                    </div>
                    <input 
                      className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent dark:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-900 dark:text-white focus:border-admin-primary/20 focus:bg-white dark:focus:bg-zinc-700 outline-none transition-all" 
                      placeholder="Subtitle / Short Description (Required)" 
                      value={form.subtitle} 
                      onChange={(e) => setForm({ ...form, subtitle: e.target.value })} 
                      required
                    />
                    <div className="relative group">
                      <Ticket size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-admin-primary transition-colors" />
                      <input 
                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent dark:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-900 dark:text-white focus:border-admin-primary/20 focus:bg-white dark:focus:bg-zinc-700 outline-none transition-all" 
                        placeholder="CRITICAL: Coupon Code" 
                        value={form.couponCode} 
                        onChange={(e) => setForm({ ...form, couponCode: e.target.value })} 
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Logistics Group */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2 flex items-center gap-3">
                    <Shield size={14} className="text-admin-primary" /> Market Logistics
                  </h4>
                  <div className="space-y-4">
                    <div className="relative group">
                      <Layers size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-admin-primary transition-colors" />
                      <input 
                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent dark:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-900 dark:text-white focus:border-admin-primary/20 focus:bg-white dark:focus:bg-zinc-700 outline-none transition-all" 
                        placeholder="Category (e.g. Fashion)" 
                        value={form.category} 
                        onChange={(e) => setForm({ ...form, category: e.target.value })} 
                      />
                    </div>
                    <div className="relative group">
                      <Store size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-admin-primary transition-colors" />
                      <input 
                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent dark:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-900 dark:text-white focus:border-admin-primary/20 focus:bg-white dark:focus:bg-zinc-700 outline-none transition-all" 
                        placeholder="Affiliated Store Name" 
                        value={form.storeName} 
                        onChange={(e) => setForm({ ...form, storeName: e.target.value })} 
                      />
                    </div>
                    <div className="relative group">
                      <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-admin-primary transition-colors" />
                      <input 
                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent dark:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-900 dark:text-white focus:border-admin-primary/20 focus:bg-white dark:focus:bg-zinc-700 outline-none transition-all" 
                        type="date" 
                        value={form.expiryDate} 
                        onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>

                {/* Digital Presence Group */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-2 flex items-center gap-3">
                    <LinkIcon size={14} className="text-admin-primary" /> Visual & Links
                  </h4>
                  <div className="space-y-4">
                    <input 
                      className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent dark:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-900 dark:text-white focus:border-admin-primary/20 focus:bg-white dark:focus:bg-zinc-700 outline-none transition-all" 
                      placeholder="Image URL / Asset Path (Required)" 
                      value={form.imageUrl} 
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} 
                      required
                    />
                    <div className="relative group">
                      <ExternalLink size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-admin-primary transition-colors" />
                      <input 
                        className="w-full pl-14 pr-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent dark:border-zinc-700 rounded-2xl text-sm font-bold text-zinc-900 dark:text-white focus:border-admin-primary/20 focus:bg-white dark:focus:bg-zinc-700 outline-none transition-all" 
                        placeholder="CTA / Store Redirect Link" 
                        value={form.ctaLink} 
                        onChange={(e) => setForm({ ...form, ctaLink: e.target.value })} 
                      />
                    </div>
                    <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 rounded-2xl text-white">
                      <span className="text-[10px] font-black uppercase tracking-widest">Protocol Status</span>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <span className="text-[10px] font-bold">{form.isActive ? "ACTIVE" : "STANDBY"}</span>
                        <div 
                          onClick={() => setForm({...form, isActive: !form.isActive})}
                          className={cn(
                            "w-12 h-6 rounded-full relative transition-all duration-500",
                            form.isActive ? "bg-admin-primary" : "bg-zinc-700"
                          )}
                        >
                          <div className={cn(
                            "absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-500",
                            form.isActive ? "left-7" : "left-1"
                          )} />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 lg:col-span-3">
                   <textarea 
                    className="w-full px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent dark:border-zinc-700 rounded-[32px] text-sm font-bold text-zinc-900 dark:text-white focus:border-admin-primary/20 focus:bg-white dark:focus:bg-zinc-700 outline-none transition-all min-h-[120px]" 
                    placeholder="Terms & Conditions (Policy DNA)" 
                    value={form.terms} 
                    onChange={(e) => setForm({ ...form, terms: e.target.value })} 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-6 border-t border-zinc-100 pt-10">
                 <button 
                  type="submit"
                  disabled={loading}
                  className="px-12 py-5 bg-admin-primary text-white rounded-full font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-admin-primary/30 hover:bg-zinc-900 transition-all flex items-center gap-4"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  Instantiate Coupon
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Filter Navigation */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-zinc-100/50 rounded-[32px] border border-zinc-200/50 backdrop-blur-md w-fit">
        {['all', 'active', 'inactive'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
              activeTab === tab 
                ? "bg-white text-admin-primary shadow-xl shadow-zinc-200/60 scale-105 border border-zinc-100" 
                : "text-zinc-500 hover:text-zinc-900 hover:bg-white/50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Coupons Ledger */}
      <div className="glass-card rounded-[48px] border-white/60 overflow-hidden shadow-2xl relative bg-white">
        {loading && items.length === 0 && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-20 flex flex-col items-center justify-center gap-4">
            <Loader2 className="text-admin-primary animate-spin" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Syncing Reward Nodes</p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/30 border-b border-zinc-100/80">
                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">Reward DNA</th>
                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">Market Segment</th>
                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">Protocol Status</th>
                <th className="px-10 py-8 text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400 text-right">Administrative</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              <AnimatePresence mode="popLayout">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-10 py-32 text-center">
                       <div className="flex flex-col items-center gap-6">
                          <div className="w-24 h-24 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-200">
                             <Ticket size={48} />
                          </div>
                          <p className="font-black text-zinc-400 uppercase tracking-widest text-sm">No reward vectors found</p>
                       </div>
                    </td>
                  </tr>
                ) : filteredItems.map((item, i) => (
                  <motion.tr 
                    key={item._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="group hover:bg-zinc-50/50 transition-all duration-300"
                  >
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center overflow-hidden shadow-xl shadow-zinc-900/10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ring-4 ring-white">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Ticket size={28} className="text-white/40" />
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="font-black text-zinc-900 text-lg tracking-tight mb-1 group-hover:text-admin-primary transition-colors">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 bg-admin-primary/10 rounded text-[10px] font-black text-admin-primary uppercase tracking-widest">
                              {item.couponCode || 'NO CODE'}
                            </span>
                            <span className="text-[10px] font-bold text-zinc-400 italic">
                              {item.subtitle}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="space-y-1">
                          <p className="text-xs font-black text-zinc-900 uppercase tracking-widest">{item.category || "General"}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400">
                             <Store size={12} className="text-admin-primary" />
                             {item.storeName || "Rhock Universal"}
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                      <button 
                        onClick={() => toggleActive(item)}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all duration-500",
                          item.isActive ? "bg-green-50/50 text-green-700 border-green-100 shadow-sm shadow-green-100/50" : "bg-zinc-50 text-zinc-500 border-zinc-200"
                        )}
                      >
                        <div className={cn("w-2 h-2 rounded-full", item.isActive ? "bg-green-500 animate-pulse" : "bg-zinc-300")} />
                        {item.isActive ? "ACTIVE" : "DISABLED"}
                      </button>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => onDelete(item._id)}
                          className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white hover:-rotate-12 transition-all duration-500 flex items-center justify-center shadow-sm"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
